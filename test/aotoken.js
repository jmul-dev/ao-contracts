var AOToken = artifacts.require("./AOToken.sol");
var BigNumber = require("bignumber.js");
BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: 8 }); // no rounding

contract("AOToken", function(accounts) {
	var tokenMeta;
	var developer = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var whitelistedAccount = accounts[4];
	var foundationAddress1 = accounts[8];
	var foundationAddress2 = accounts[9];
	var emptyAddress = "0x0000000000000000000000000000000000000000";
	var maxPrimordialSupply;
	var tokensReservedForFoundation;
	var multiplierDivisor;
	var percentageDivisor;
	var startingMultiplier, endingMultiplier, startingNetworkTokenBonusMultiplier, endingNetworkTokenBonusMultiplier;
	var account1Lots = [];
	var account2Lots = [];
	var account3Lots = [];
	var lot1;

	var calculateWeightedMultiplier = function(accountLots) {
		var totalWeightedTokens = new BigNumber(0);
		var totalTokens = new BigNumber(0);
		for (var i = 0; i < accountLots.length; i++) {
			var lot = accountLots[i];
			totalWeightedTokens = totalWeightedTokens.plus(lot[1].times(lot[2]));
			totalTokens = totalTokens.plus(lot[2]);
		}
		var newWeightedMultiplier = totalWeightedTokens.div(totalTokens);
		return newWeightedMultiplier;
	};

	before(function() {
		return AOToken.deployed().then(function(instance) {
			tokenMeta = instance;
		});
	});
	contract("Variable Setting Tests", function() {
		it("should return correct name", function() {
			return tokenMeta.name.call().then(function(name) {
				assert.equal(name, "AO Token", "Contract has the incorrect name");
			});
		});
		it("should return correct symbol", function() {
			return tokenMeta.symbol.call().then(function(symbol) {
				assert.equal(symbol, "AOTKN", "Contract has the incorrect symbol");
			});
		});
		it("should have the correct power of ten", function() {
			return tokenMeta.powerOfTen.call().then(function(powerOfTen) {
				assert.equal(powerOfTen, 0, "Contract has the incorrect power of ten");
			});
		});
		it("should have 0 decimal", function() {
			return tokenMeta.decimals.call().then(function(decimals) {
				assert.equal(decimals, 0, "Contract has the incorrect decimals");
			});
		});
		it("should have 0 initial supply", function() {
			return tokenMeta.balanceOf.call(developer).then(function(balance) {
				assert.equal(balance.toNumber(), 0, "Contract has incorrect initial supply");
			});
		});
		it("should have max of 1125899906842620 Primordial tokens", function() {
			return tokenMeta.MAX_PRIMORDIAL_SUPPLY.call().then(function(primordialSupply) {
				maxPrimordialSupply = primordialSupply;
				assert.equal(maxPrimordialSupply.toNumber(), 1125899906842620, "Contract has incorrect max primordial supply amount");
			});
		});
		it("should set aside 125899906842620 tokens reserved for Foundation", function() {
			return tokenMeta.TOKENS_RESERVED_FOR_FOUNDATION.call().then(function(reservedTokens) {
				tokensReservedForFoundation = reservedTokens;
				assert.equal(
					tokensReservedForFoundation.toNumber(),
					125899906842620,
					"Contract has incorrect reserved amount for Foundation"
				);
			});
		});
		it("should have the correct multiplier divisor", function() {
			return tokenMeta.MULTIPLIER_DIVISOR.call().then(function(divisor) {
				multiplierDivisor = divisor;
				assert.equal(divisor.toNumber(), 10 ** 6, "Contract has incorrect multiplier divisor");
			});
		});
		it("should set this contract as the Network Exchange contract", function() {
			return tokenMeta.networkExchangeContract.call().then(function(isNetworkExchangeContract) {
				assert.equal(isNetworkExchangeContract, true, "Contract should be set as the Network Exchange contract");
			});
		});
		it("should have the correct percentage divisor", async function() {
			percentageDivisor = await tokenMeta.PERCENTAGE_DIVISOR();
			assert.equal(percentageDivisor.toNumber(), 10 ** 6, "Contract has incorrect percentage divisor");
		});
		it("should have the correct foundation 1 address", async function() {
			var foundationAddress = await tokenMeta.foundationAddress1();
			assert.equal(foundationAddress, foundationAddress1, "Contract has incorrect foundationAddress1");
		});
		it("should have the correct foundation 2 address", async function() {
			var foundationAddress = await tokenMeta.foundationAddress2();
			assert.equal(foundationAddress, foundationAddress2, "Contract has incorrect foundationAddress2");
		});
		it("should have the correct starting multiplier for calculating primordial multiplier", async function() {
			startingMultiplier = await tokenMeta.startingMultiplier();
			assert.equal(startingMultiplier.toNumber(), 50 * multiplierDivisor.toNumber(), "Contract has incorrect startingMultiplier");
		});
		it("should have the correct ending multiplier for calculating primordial multiplier", async function() {
			endingMultiplier = await tokenMeta.endingMultiplier();
			assert.equal(endingMultiplier.toNumber(), 3 * multiplierDivisor.toNumber(), "Contract has incorrect endingMultiplier");
		});
		it("should have the correct starting network token bonus multiplier for calculating network token bonus amount", async function() {
			startingNetworkTokenBonusMultiplier = await tokenMeta.startingNetworkTokenBonusMultiplier();
			assert.equal(
				startingNetworkTokenBonusMultiplier.toNumber(),
				1000000,
				"Contract has incorrect startingNetworkTokenBonusMultiplier"
			);
		});
		it("should have the correct ending network token bonus multiplier for calculating network token bonus amount", async function() {
			endingNetworkTokenBonusMultiplier = await tokenMeta.endingNetworkTokenBonusMultiplier();
			assert.equal(endingNetworkTokenBonusMultiplier.toNumber(), 250000, "Contract has incorrect endingNetworkTokenBonusMultiplier");
		});
	});
	contract("Developer Only Function Tests", function() {
		it("setStartingEndingMultiplier() - should update starting/ending multiplier value", async function() {
			var canSet;
			try {
				await tokenMeta.setStartingEndingMultiplier(1000, 500, { from: account1 });
				canSet = true;
			} catch (e) {
				canSet = false;
			}
			assert.notEqual(canSet, true, "Non-developer account can set starting/ending multiplier value");

			try {
				await tokenMeta.setStartingEndingMultiplier(500, 1000, { from: developer });
				canSet = true;
			} catch (e) {
				canSet = false;
			}
			assert.notEqual(
				canSet,
				true,
				"Developer account can set starting/ending multiplier value with ending multiplier > starting multiplier"
			);

			try {
				await tokenMeta.setStartingEndingMultiplier(1000, 500, { from: developer });
				canSet = true;
			} catch (e) {
				canSet = false;
			}
			assert.equal(canSet, true, "Developer account can't set starting/ending multiplier");

			var _startingMultiplier = await tokenMeta.startingMultiplier();
			assert.equal(_startingMultiplier.toString(), 1000, "Contract has incorrect startingMultiplier");

			var _endingMultiplier = await tokenMeta.endingMultiplier();
			assert.equal(_endingMultiplier.toString(), 500, "Contract has incorrect endingMultiplier");
		});

		it("setStartingEndingNetworkTokenBonusMultiplier() - should update starting/ending network token bonus multiplier value", async function() {
			var canSet;
			try {
				await tokenMeta.setStartingEndingNetworkTokenBonusMultiplier(1000, 500, { from: account1 });
				canSet = true;
			} catch (e) {
				canSet = false;
			}
			assert.notEqual(canSet, true, "Non-developer account can set starting/ending network token bonus multiplier value");

			try {
				await tokenMeta.setStartingEndingNetworkTokenBonusMultiplier(500, 1000, { from: developer });
				canSet = true;
			} catch (e) {
				canSet = false;
			}
			assert.notEqual(
				canSet,
				true,
				"Developer account can set starting/ending network token bonus multiplier value with ending network token bonus multiplier > starting network token bonus multiplier"
			);

			try {
				await tokenMeta.setStartingEndingNetworkTokenBonusMultiplier(1000, 500, { from: developer });
				canSet = true;
			} catch (e) {
				canSet = false;
			}
			assert.equal(canSet, true, "Developer account can't set starting/ending network token bonus multiplier");

			var _startingNetworkTokenBonusMultiplier = await tokenMeta.startingNetworkTokenBonusMultiplier();
			assert.equal(
				_startingNetworkTokenBonusMultiplier.toString(),
				1000,
				"Contract has incorrect startingNetworkTokenBonusMultiplier"
			);

			var _endingNetworkTokenBonusMultiplier = await tokenMeta.endingNetworkTokenBonusMultiplier();
			assert.equal(_endingNetworkTokenBonusMultiplier.toString(), 500, "Contract has incorrect endingNetworkTokenBonusMultiplier");
		});

		it("setFoundationAddress() - should update foundation addresses", async function() {
			var canSet;
			try {
				await tokenMeta.setFoundationAddresses(account2, account3, { from: account1 });
				canSet = true;
			} catch (e) {
				canSet = false;
			}
			assert.notEqual(canSet, true, "Non-developer account can set foundation addresses");

			try {
				await tokenMeta.setFoundationAddresses(emptyAddress, account3, { from: developer });
				canSet = true;
			} catch (e) {
				canSet = false;
			}
			assert.notEqual(canSet, true, "Developer account can set empty foundation addresses");

			try {
				await tokenMeta.setFoundationAddresses(account2, emptyAddress, { from: developer });
				canSet = true;
			} catch (e) {
				canSet = false;
			}
			assert.notEqual(canSet, true, "Developer account can set empty foundation addresses");

			try {
				await tokenMeta.setFoundationAddresses(account2, account3, { from: developer });
				canSet = true;
			} catch (e) {
				canSet = false;
			}
			assert.equal(canSet, true, "Developer account can't set foundation addresses");

			var _foundationAddress1 = await tokenMeta.foundationAddress1();
			assert.equal(_foundationAddress1, account2, "Contract has incorrect foundationAddress1");

			var _foundationAddress2 = await tokenMeta.foundationAddress2();
			assert.equal(_foundationAddress2, account3, "Contract has incorrect foundationAddress2");
		});
	});
	contract("Network Tokens Function Tests", function() {
		it("only developer can mint token", async function() {
			var canMint;
			var balance;
			try {
				await tokenMeta.mintToken(account1, 100, { from: account1 });
				canMint = true;
			} catch (e) {
				canMint = false;
			}
			balance = await tokenMeta.balanceOf(account1);
			assert.notEqual(canMint, true, "Others can mint token");
			assert.notEqual(balance.toNumber(), 100, "Account1 is not supposed to have tokens");
			try {
				await tokenMeta.mintToken(account1, 100, { from: developer });
				canMint = true;
			} catch (e) {
				canMint = false;
			}
			balance = await tokenMeta.balanceOf(account1);
			assert.equal(canMint, true, "Developer can't mint token");
			assert.equal(balance.toNumber(), 100, "Account1 has incorrect balance after minting");
		});
		it("transfer() - should send correct `_value` to `_to` from your account", async function() {
			var account1Balance = await tokenMeta.balanceOf(account1);
			var account2Balance = await tokenMeta.balanceOf(account2);
			assert.equal(account1Balance.toNumber(), 100, "Account1 has incorrect balance before transfer");
			assert.equal(account2Balance.toNumber(), 0, "Account2 has incorrect balance before transfer");
			await tokenMeta.transfer(account2, 10, { from: account1 });
			account1Balance = await tokenMeta.balanceOf(account1);
			account2Balance = await tokenMeta.balanceOf(account2);
			assert.equal(account1Balance.toNumber(), 90, "Account1 has incorrect balance after transfer");
			assert.equal(account2Balance.toNumber(), 10, "Account2 has incorrect balance after transfer");
		});
		it("burn() - should remove `_value` tokens from the system irreversibly", async function() {
			var account1Balance = await tokenMeta.balanceOf(account1);
			assert.equal(account1Balance.toNumber(), 90, "Account1 has incorrect balance before burn");
			await tokenMeta.burn(10, { from: account1 });
			account1Balance = await tokenMeta.balanceOf(account1);
			assert.equal(account1Balance.toNumber(), 80, "Account1 has incorrect balance after burn");
		});
		it("approve() - should set allowance for other address", async function() {
			var account2Allowance = await tokenMeta.allowance(account1, account2);
			assert.equal(account2Allowance.toNumber(), 0, "Account2 has incorrect allowance before approve");
			await tokenMeta.approve(account2, 10, { from: account1 });
			account2Allowance = await tokenMeta.allowance(account1, account2);
			assert.equal(account2Allowance.toNumber(), 10, "Account2 has incorrect allowance after approve");
		});
		it("transferFrom() - should send `_value` tokens to `_to` in behalf of `_from`", async function() {
			var canTransferFrom;
			try {
				await tokenMeta.transferFrom(account1, account2, 5, { from: developer });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.notEqual(canTransferFrom, true, "Account that was not approved is able to transfer on behalf of other");
			try {
				await tokenMeta.transferFrom(account1, account2, 5, { from: account2 });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.equal(canTransferFrom, true, "Account that was approved is not able to transfer on behalf of other");
			var account1Balance = await tokenMeta.balanceOf(account1);
			var account2Balance = await tokenMeta.balanceOf(account2);
			var account2Allowance = await tokenMeta.allowance(account1, account2);
			assert.equal(account1Balance.toNumber(), 75, "Account1 has incorrect balance after transferFrom");
			assert.equal(account2Balance.toNumber(), 15, "Account2 has incorrect balance after transferFrom");
			assert.equal(account2Allowance.toNumber(), 5, "Account2 has incorrect allowance after transferFrom");
		});
		it("burnFrom() - should remove `_value` tokens from the system irreversibly on behalf of `_from`", async function() {
			var canBurnFrom;
			try {
				await tokenMeta.burnFrom(account1, 5, { from: developer });
				canBurnFrom = true;
			} catch (e) {
				canBurnFrom = false;
			}
			assert.notEqual(canBurnFrom, true, "Account that was not approved is able to burn on behalf of other");
			try {
				await tokenMeta.burnFrom(account1, 10, { from: account2 });
				canBurnFrom = true;
			} catch (e) {
				canBurnFrom = false;
			}
			assert.notEqual(canBurnFrom, true, "Account that was approved is able to burn more than it's allowance on behalf of other");
			try {
				await tokenMeta.burnFrom(account1, 5, { from: account2 });
				canBurnFrom = true;
			} catch (e) {
				canBurnFrom = false;
			}
			assert.equal(canBurnFrom, true, "Account that was approved is not able to burn on behalf of other");
			var account1Balance = await tokenMeta.balanceOf(account1);
			var account2Allowance = await tokenMeta.allowance(account1, account2);
			assert.equal(account1Balance.toNumber(), 70, "Account1 has incorrect balance after burnFrom");
			assert.equal(account2Allowance.toNumber(), 0, "Account2 has incorrect allowance after burnFrom");
		});
		it("only developer can freeze account", async function() {
			var canFreezeAccount;
			try {
				await tokenMeta.freezeAccount(account1, true, { from: account1 });
				canFreezeAccount = true;
			} catch (e) {
				canFreezeAccount = false;
			}
			assert.notEqual(canFreezeAccount, true, "Others can freeze account");
			try {
				await tokenMeta.freezeAccount(account1, true, { from: developer });
				canFreezeAccount = true;
			} catch (e) {
				canFreezeAccount = false;
			}
			assert.equal(canFreezeAccount, true, "Developer can't mint token");
			var account1Frozen = await tokenMeta.frozenAccount(account1);
			assert.equal(account1Frozen, true, "Account1 is not frozen after developer froze his account");
		});
		it("frozen account should NOT be able to transfer", async function() {
			var canTransfer;
			try {
				await tokenMeta.transfer(account2, 10, { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.notEqual(canTransfer, true, "Frozen account can transfer");
			// Unfreeze account1
			await tokenMeta.freezeAccount(account1, false, { from: developer });
		});
		it("only developer can set prices", async function() {
			var canSetPrices;
			try {
				await tokenMeta.setPrices(2, 2, { from: account1 });
				canSetPrices = true;
			} catch (e) {
				canSetPrices = false;
			}
			assert.notEqual(canSetPrices, true, "Others can set network token prices");
			try {
				await tokenMeta.setPrices(2, 2, { from: developer });
				canSetPrices = true;
			} catch (e) {
				canSetPrices = false;
			}
			assert.equal(canSetPrices, true, "Developer can't set network token prices");
			var sellPrice = await tokenMeta.sellPrice();
			var buyPrice = await tokenMeta.buyPrice();
			assert.equal(sellPrice.toNumber(), 2, "Incorrect sell price");
			assert.equal(buyPrice.toNumber(), 2, "Incorrect buy price");
		});
		it("user can buy network tokens", async function() {
			var canBuyToken;
			try {
				await tokenMeta.buy({ from: account2, value: 10 });
				canBuyToken = true;
			} catch (e) {
				canBuyToken = false;
			}
			assert.notEqual(canBuyToken, true, "Contract does not have enough network token balance to complete user's token purchase");
			await tokenMeta.mintToken(tokenMeta.address, 1000, { from: developer });
			var contractBalance = await tokenMeta.balanceOf(tokenMeta.address);
			assert.equal(contractBalance.toNumber(), 1000, "Contract has incorrect balance after mint");
			try {
				await tokenMeta.buy({ from: account2, value: 10 });
				canBuyToken = true;
			} catch (e) {
				canBuyToken = false;
			}
			var account2Balance = await tokenMeta.balanceOf(account2);
			assert.equal(canBuyToken, true, "Fail buying network token from contract");
			assert.equal(account2Balance.toNumber(), 20, "Account has incorrect balance after buying token");
		});
		it("user can sell network tokens to contract", async function() {
			var canSellToken;
			try {
				await tokenMeta.sell(20, { from: account2 });
				canSellToken = true;
			} catch (e) {
				canSellToken = false;
			}
			assert.notEqual(canSellToken, true, "User can sell tokens to contract even if contract does not have enough ETH balance");
			try {
				await tokenMeta.sell(5, { from: account2 });
				canSellToken = true;
			} catch (e) {
				canSellToken = false;
			}
			var account2Balance = await tokenMeta.balanceOf(account2);
			var contractBalance = await tokenMeta.balanceOf(tokenMeta.address);
			assert.equal(canSellToken, true, "Fail selling network token to contract");
			assert.equal(account2Balance.toNumber(), 15, "Account has incorrect balance after selling token");
			assert.equal(contractBalance.toNumber(), 1000, "Contract has incorrect balance after user sell token");
		});
	});
	contract("Primordial Token Function Tests", function() {
		var buyPrimordialToken = async function(amount, account, accountLots) {
			var totalLotsBefore = await tokenMeta.totalLots();
			var primordialTotalSupplyBefore = await tokenMeta.primordialTotalSupply();

			var accountPrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account);
			var accountNetworkBalanceBefore = await tokenMeta.balanceOf(account);
			var accountTotalLotsBefore = await tokenMeta.totalLotsByAddress(account);

			var foundation1PrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(foundationAddress1);
			var foundation1NetworkBalanceBefore = await tokenMeta.balanceOf(foundationAddress1);

			var foundation2PrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(foundationAddress2);
			var foundation2NetworkBalanceBefore = await tokenMeta.balanceOf(foundationAddress2);

			var primordialBuyPrice = await tokenMeta.primordialBuyPrice();
			var tokenAmount = new BigNumber(amount).div(primordialBuyPrice);

			if (primordialTotalSupplyBefore.plus(tokenAmount).gte(maxPrimordialSupply)) {
				tokenAmount = maxPrimordialSupply.minus(primordialTotalSupplyBefore);
			}

			var bonus = await tokenMeta.calculateMultiplierAndBonus(tokenAmount.toNumber());

			var foundationTokenAmount = tokenAmount;
			if (
				primordialTotalSupplyBefore
					.plus(tokenAmount)
					.plus(foundationTokenAmount)
					.gte(maxPrimordialSupply)
			) {
				foundationTokenAmount = maxPrimordialSupply.minus(primordialTotalSupplyBefore.plus(tokenAmount));
			}

			var foundationMultiplier = startingMultiplier.minus(bonus[0]);
			var foundationNetworkTokenBonusAmount = startingNetworkTokenBonusMultiplier
				.minus(bonus[1])
				.plus(endingNetworkTokenBonusMultiplier)
				.mul(foundationTokenAmount)
				.div(percentageDivisor);

			var canBuy, events;
			try {
				var result = await tokenMeta.buyPrimordialToken({ from: account, value: amount });
				events = result.logs;
				canBuy = true;
			} catch (e) {
				events = null;
				canBuy = false;
			}
			assert.equal(canBuy, true, "Account can't buy primordial token");
			assert.notEqual(events, null, "Contract didn't emit events during buy primordial token transaction");

			var accountLotId, foundation1LotId, foundation2LotId;
			for (var i = 0; i < events.length; i++) {
				var _event = events[i];
				switch (_event.event) {
					case "LotCreation":
						if (_event.args.lotOwner == account) {
							accountLotId = _event.args.lotId;
							assert.equal(
								_event.args.multiplier.toString(),
								bonus[0].toString(),
								"Account Lot Creation has incorrect multiplier"
							);
							assert.equal(
								_event.args.primordialTokenAmount.toString(),
								tokenAmount.toString(),
								"Account Lot Creation has incorrect tokenAmount"
							);
							assert.equal(
								_event.args.networkTokenBonusAmount.toString(),
								bonus[2].toString(),
								"Account Lot Creation has incorrect networkTokenBonusAmount"
							);
						} else if (_event.args.lotOwner == foundationAddress1) {
							foundation1LotId = _event.args.lotId;
							assert.equal(
								_event.args.multiplier.toString(),
								foundationMultiplier.toString(),
								"Foundation1 Lot Creation has incorrect multiplier"
							);
							assert.equal(
								_event.args.primordialTokenAmount.toString(),
								foundationTokenAmount.div(2).toString(),
								"Foundation1 Lot Creation has incorrect tokenAmount"
							);
							assert.equal(
								_event.args.networkTokenBonusAmount.toString(),
								foundationNetworkTokenBonusAmount.div(2).toString(),
								"Foundation1 Lot Creation has incorrect networkTokenBonusAmount"
							);
						} else if (_event.args.lotOwner == foundationAddress2) {
							foundation2LotId = _event.args.lotId;
							assert.equal(
								_event.args.multiplier.toString(),
								foundationMultiplier.toString(),
								"Foundation2 Lot Creation has incorrect multiplier"
							);
							assert.equal(
								_event.args.primordialTokenAmount.toString(),
								foundationTokenAmount.minus(foundationTokenAmount.div(2)).toString(),
								"Foundation2 Lot Creation has incorrect tokenAmount"
							);
							assert.equal(
								_event.args.networkTokenBonusAmount.toString(),
								foundationNetworkTokenBonusAmount.minus(foundationNetworkTokenBonusAmount.div(2)).toString(),
								"Foundation2 Lot Creation has incorrect networkTokenBonusAmount"
							);
						}
						break;
					default:
						break;
				}
			}

			var totalLotsAfter = await tokenMeta.totalLots();
			var primordialTotalSupplyAfter = await tokenMeta.primordialTotalSupply();

			var accountPrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account);
			var accountNetworkBalanceAfter = await tokenMeta.balanceOf(account);
			var accountTotalLotsAfter = await tokenMeta.totalLotsByAddress(account);

			var foundation1PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(foundationAddress1);
			var foundation1NetworkBalanceAfter = await tokenMeta.balanceOf(foundationAddress1);

			var foundation2PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(foundationAddress2);
			var foundation2NetworkBalanceAfter = await tokenMeta.balanceOf(foundationAddress2);

			if (foundationTokenAmount.gt(0)) {
				assert.equal(totalLotsAfter.toString(), totalLotsBefore.plus(3).toString(), "Contract has incorrect totalLots");
			} else {
				assert.equal(totalLotsAfter.toString(), totalLotsBefore.plus(1).toString(), "Contract has incorrect totalLots");
			}
			assert.equal(
				primordialTotalSupplyAfter.toString(),
				primordialTotalSupplyBefore
					.plus(tokenAmount)
					.plus(foundationTokenAmount)
					.toString(),
				"Contract has incorrect primordialTotalSupply"
			);

			assert.equal(
				accountPrimordialBalanceAfter.toString(),
				accountPrimordialBalanceBefore.plus(tokenAmount).toString(),
				"Account has incorrect primordial balance"
			);
			assert.equal(
				accountNetworkBalanceAfter.toString(),
				accountNetworkBalanceBefore.plus(bonus[2]).toString(),
				"Account has incorrect network balance"
			);
			assert.equal(accountTotalLotsAfter.toString(), accountTotalLotsBefore.plus(1).toString(), "Account has incorrect totalLots");

			assert.equal(
				foundation1PrimordialBalanceAfter.toString(),
				foundation1PrimordialBalanceBefore.plus(foundationTokenAmount.div(2)).toString(),
				"Foundation1 has incorrect primordial balance"
			);
			assert.equal(
				foundation1NetworkBalanceAfter.toString(),
				foundation1NetworkBalanceBefore.plus(foundationNetworkTokenBonusAmount.div(2)).toString(),
				"Foundation1 has incorrect network balance"
			);

			assert.equal(
				foundation2PrimordialBalanceAfter.toString(),
				foundation2PrimordialBalanceBefore.plus(foundationTokenAmount.minus(foundationTokenAmount.div(2))).toString(),
				"Foundation2 has incorrect primordial balance"
			);
			assert.equal(
				foundation2NetworkBalanceAfter.toString(),
				foundation2NetworkBalanceBefore
					.plus(foundationNetworkTokenBonusAmount.minus(foundationNetworkTokenBonusAmount.div(2)))
					.toString(),
				"Foundation2 has incorrect network balance"
			);

			// Make sure the Lot is stored correctly
			var accountLot = await tokenMeta.lotById(accountLotId);
			assert.equal(accountLot[0], accountLotId, "Lot has incorrect ID");
			assert.equal(accountLot[1].toString(), bonus[0].toString(), "Lot has incorrect multiplier");
			assert.equal(accountLot[2].toString(), tokenAmount.toString(), "Lot has incorrect tokenAmount");

			if (foundation1LotId) {
				var foundation1Lot = await tokenMeta.lotById(foundation1LotId);
				assert.equal(foundation1Lot[0], foundation1LotId, "Lot has incorrect ID");
				assert.equal(foundation1Lot[1].toString(), foundationMultiplier.toString(), "Lot has incorrect multiplier");
				assert.equal(foundation1Lot[2].toString(), foundationTokenAmount.div(2).toString(), "Lot has incorrect tokenAmount");
			}

			if (foundation2LotId) {
				var foundation2Lot = await tokenMeta.lotById(foundation2LotId);
				assert.equal(foundation2Lot[0], foundation2LotId, "Lot has incorrect ID");
				assert.equal(foundation2Lot[1].toString(), foundationMultiplier.toString(), "Lot has incorrect multiplier");
				assert.equal(
					foundation2Lot[2].toString(),
					foundationTokenAmount.minus(foundationTokenAmount.div(2)).toString(),
					"Lot has incorrect tokenAmount"
				);
			}

			accountLots.push(accountLot);

			var newWeightedMultiplier = calculateWeightedMultiplier(accountLots);

			var accountWeightedMultiplier = await tokenMeta.weightedMultiplierByAddress(account);
			assert.equal(
				accountWeightedMultiplier.toString(),
				newWeightedMultiplier.toString(),
				"Account has incorrect weighted multiplier"
			);
			return accountLotId;
		};

		it("only developer can set Primordial prices", async function() {
			var canSetPrimordialPrices;
			try {
				await tokenMeta.setPrimordialPrices(100, 100, { from: account1 });
				canSetPrimordialPrices = true;
			} catch (e) {
				canSetPrimordialPrices = false;
			}
			assert.notEqual(canSetPrimordialPrices, true, "Others can set Primordial token prices");
			try {
				await tokenMeta.setPrimordialPrices(100, 100, { from: developer });
				canSetPrimordialPrices = true;
			} catch (e) {
				canSetPrimordialPrices = false;
			}
			assert.equal(canSetPrimordialPrices, true, "Developer can't set Primordial token prices");
			var primordialSellPrice = await tokenMeta.primordialSellPrice();
			var primordialBuyPrice = await tokenMeta.primordialBuyPrice();
			assert.equal(primordialSellPrice.toNumber(), 100, "Incorrect Primordial sell price");
			assert.equal(primordialBuyPrice.toNumber(), 100, "Incorrect Primordial buy price");
		});
		/*
		it("only developer can reserve Primordial tokens for the Foundation", async function() {
			var canReserveForFoundation;
			var foundationReserved = await tokenMeta.foundationReserved();
			var totalLots = await tokenMeta.totalLots();
			var lotIndex = await tokenMeta.lotIndex();
			var developerPrimordialBalance = await tokenMeta.primordialBalanceOf(developer);
			var developerTotalLots = await tokenMeta.totalLotsByAddress(developer);
			var weightedIndexByAddress = await tokenMeta.weightedIndexByAddress(developer);
			var primordialTotalSupply = await tokenMeta.primordialTotalSupply();
			assert.equal(
				foundationReserved,
				false,
				"foundationReserved bit is set incorrectly before the reserve for Foundation transaction is executed"
			);
			assert.equal(totalLots.toNumber(), 0, "Total lots is incorrect before reserve for Foundation transaction");
			assert.equal(lotIndex.toNumber(), 0, "Lot index is incorrect before reserve for Foundation transaction");
			assert.equal(
				developerPrimordialBalance.toNumber(),
				0,
				"Developer has incorrect Primordial balance before reserve for Foundation transaction"
			);
			assert.equal(
				developerTotalLots.toNumber(),
				0,
				"Developer has incorrect total lots amount before reserve for Foundation transaction"
			);
			assert.equal(
				weightedIndexByAddress.toNumber(),
				0,
				"Developer has incorrect weighted index before reserve for Foundation transaction"
			);
			assert.equal(
				primordialTotalSupply.toNumber(),
				0,
				"Contract has incorrect Primordial total supply before reserve for Foundation transaction"
			);
			try {
				await tokenMeta.reserveForFoundation({ from: account1 });
				canReserveForFoundation = true;
			} catch (e) {
				canReserveForFoundation = false;
			}
			assert.notEqual(canReserveForFoundation, true, "Others can reserve Primordial tokens for the Foundation");
			try {
				await tokenMeta.reserveForFoundation({ from: developer });
				canReserveForFoundation = true;
			} catch (e) {
				canReserveForFoundation = false;
			}
			assert.equal(canReserveForFoundation, true, "Developer can't reserve Primordial tokens for the Foundation");
			foundationReserved = await tokenMeta.foundationReserved();
			totalLots = await tokenMeta.totalLots();
			lotIndex = await tokenMeta.lotIndex();
			var developerNetworkBalance = await tokenMeta.balanceOf(developer);
			developerPrimordialBalance = await tokenMeta.primordialBalanceOf(developer);
			developerTotalLots = await tokenMeta.totalLotsByAddress(developer);
			weightedIndexByAddress = await tokenMeta.weightedIndexByAddress(developer);
			primordialTotalSupply = await tokenMeta.primordialTotalSupply();
			assert.equal(
				foundationReserved,
				true,
				"foundationReserved bit is set incorrectly after the reserve for Foundation transaction is executed"
			);
			assert.equal(totalLots.toNumber(), 1, "Total lots is incorrect after reserve for Foundation transaction");
			assert.equal(lotIndex.toNumber(), 1, "Lot index is incorrect after reserve for Foundation transaction");
			assert.equal(
				developerNetworkBalance.toNumber(),
				tokensReservedForFoundation.toNumber(),
				"Developer has incorrect network balance after reserve for Foundation transaction"
			);
			assert.equal(
				developerPrimordialBalance.toNumber(),
				tokensReservedForFoundation.toNumber(),
				"Developer has incorrect Primordial balance after reserve for Foundation transaction"
			);
			assert.equal(
				developerTotalLots.toNumber(),
				1,
				"Developer has incorrect total lots amount after reserve for Foundation transaction"
			);
			assert.equal(
				weightedIndexByAddress.toNumber(),
				1 * weightedIndexDivisor.toNumber(),
				"Developer has incorrect weighted index after reserve for Foundation transaction"
			);
			assert.equal(
				primordialTotalSupply.toNumber(),
				tokensReservedForFoundation.toNumber(),
				"Contract has incorrect Primordial total supply after reserve for Foundation transaction"
			);
			var developerLot = await tokenMeta.lotOfOwnerByIndex(developer, 0);
			assert.equal(developerLot[1].toNumber(), 1 * weightedIndexDivisor.toNumber(), "Developer lot has incorrect global lot index");
			assert.equal(
				developerLot[2].toNumber(),
				tokensReservedForFoundation.toNumber(),
				"Developer lot has incorrect Primordial token amount"
			);
		});
		it("can only reserve Primordial tokens for the Foundation once", async function() {
			var canReserveForFoundation;
			try {
				await tokenMeta.reserveForFoundation({ from: developer });
				canReserveForFoundation = true;
			} catch (e) {
				canReserveForFoundation = false;
			}
			assert.notEqual(canReserveForFoundation, true, "Developer can reserve Primordial tokens for the Foundation more than once");
		});
		*/
		it("buyPrimordialToken() - buy Primordial tokens from contract by sending ETH", async function() {
			var canBuy;
			try {
				await tokenMeta.buyPrimordialToken({ from: account1, value: 0 });
				canBuy = true;
			} catch (e) {
				canBuy = false;
			}
			assert.equal(canBuy, false, "Buy Primordial token succeeded even though user sent 0 ETH");
			await buyPrimordialToken(10000, account1, account1Lots);
		});
		it("Should re-calculate existing `account` lots' indexes and update his/her overall weighted index", async function() {
			await buyPrimordialToken(1000000, account1, account1Lots);
			await buyPrimordialToken(800000, account1, account1Lots);
		});
		it("should NOT allow buy Primordial if max Primordial cap is reached (network exchange has ended)", async function() {
			var primordialTotalSupply = await tokenMeta.primordialTotalSupply();
			var remainingAvailablePrimordialTokens = maxPrimordialSupply.minus(primordialTotalSupply);
			assert.isAbove(remainingAvailablePrimordialTokens.toNumber(), 0, "Contract has incorrect Primordial total supply amount");

			// Sending more ETH than we should to check whether or not the user receives the remainder ETH
			await buyPrimordialToken(web3.toWei(900, "ether"), account2, account2Lots);

			var account2PrimordialBalance = await tokenMeta.primordialBalanceOf(account2);
			assert.equal(
				account2PrimordialBalance.toString(),
				remainingAvailablePrimordialTokens.toString(),
				"Account2 has incorrect Primordial balance after buy Primordial transaction"
			);

			// If user does not receive the remainder ETH, his/her ETH balance will not have more than 800 ETH
			var account2EthBalance = web3.eth.getBalance(account2);
			assert.isAbove(
				account2EthBalance.toNumber(),
				parseInt(web3.toWei(800, "ether")),
				"Account2 does not receive the remainder surplus ETH after buy Primordial transaction"
			);

			var networkExchangeEnded = await tokenMeta.networkExchangeEnded();
			assert.equal(networkExchangeEnded, true, "Network exchange is not ended when Primordial max supply is reached");

			var canBuy;
			try {
				await tokenMeta.buyPrimordialToken({ from: account2, value: web3.toWei(5, "ether") });
				canBuy = true;
			} catch (e) {
				canBuy = false;
			}
			assert.equal(canBuy, false, "Buy Primordial token succeeded even though Network exchange has ended");
		});
		it("transferPrimordialToken() - should send correct `_value` to `_to` from your account", async function() {
			var account1PrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account1);
			var account3PrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account3);
			var account1WeightedMultiplierBefore = await tokenMeta.weightedMultiplierByAddress(account1);
			var account3WeightedMultiplierBefore = await tokenMeta.weightedMultiplierByAddress(account3);

			var totalLotsBefore = await tokenMeta.totalLots();
			var primordialTotalSupplyBefore = await tokenMeta.primordialTotalSupply();

			var canTransfer, events;
			try {
				var result = await tokenMeta.transferPrimordialToken(account3, 100, { from: account1 });
				events = result.logs;
				canTransfer = true;
			} catch (e) {
				events = null;
				canTransfer = false;
			}
			assert.equal(canTransfer, true, "Account1 can't transfer primordial token");
			assert.notEqual(events, null, "Contract didn't emit events during transfer primordial token");

			var accountLotId;
			for (var i = 0; i < events.length; i++) {
				var _event = events[i];
				switch (_event.event) {
					case "LotCreation":
						accountLotId = _event.args.lotId;
						assert.equal(
							_event.args.multiplier.toString(),
							account1WeightedMultiplierBefore.toString(),
							"Account Lot Creation has incorrect multiplier"
						);
						assert.equal(_event.args.primordialTokenAmount.toString(), 100, "Account Lot Creation has incorrect tokenAmount");
						assert.equal(
							_event.args.networkTokenBonusAmount.toString(),
							0,
							"Account Lot Creation has incorrect networkTokenBonusAmount"
						);
						break;
					default:
						break;
				}
			}

			var account1PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account1);
			var account3PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account3);
			var account1WeightedMultiplierAfter = await tokenMeta.weightedMultiplierByAddress(account1);
			var account3WeightedMultiplierAfter = await tokenMeta.weightedMultiplierByAddress(account3);

			var totalLotsAfter = await tokenMeta.totalLots();
			var primordialTotalSupplyAfter = await tokenMeta.primordialTotalSupply();

			assert.equal(
				account1PrimordialBalanceAfter.toString(),
				account1PrimordialBalanceBefore.minus(100).toString(),
				"Account1 has incorrect primordial balance"
			);
			assert.equal(
				account3PrimordialBalanceAfter.toString(),
				account3PrimordialBalanceBefore.plus(100).toString(),
				"Account3 has incorrect primordial balance"
			);
			assert.equal(
				account1WeightedMultiplierAfter.toString(),
				account1WeightedMultiplierBefore.toString(),
				"Account1 has incorrect weighted multiplier"
			);

			assert.equal(totalLotsAfter.toString(), totalLotsBefore.plus(1).toString(), "Contract has incorrect totalLots");
			assert.equal(
				primordialTotalSupplyAfter.toString(),
				primordialTotalSupplyBefore.toString(),
				"Contract has incorrect primordialTotalSupply"
			);

			// Make sure the Lot is stored correctly
			var accountLot = await tokenMeta.lotById(accountLotId);
			assert.equal(accountLot[0], accountLotId, "Lot has incorrect ID");
			assert.equal(accountLot[1].toString(), account1WeightedMultiplierAfter.toString(), "Lot has incorrect multiplier");
			assert.equal(accountLot[2].toString(), 100, "Lot has incorrect tokenAmount");

			account3Lots.push(accountLot);

			var newWeightedMultiplier = calculateWeightedMultiplier(account3Lots);
			assert.equal(
				account3WeightedMultiplierAfter.toString(),
				newWeightedMultiplier.toString(),
				"Account3 has incorrect weighted multiplier"
			);
		});
		/*
		it("burnPrimordialToken() - should remove `_value` tokens from the system irreversibly", async function() {
			var primordialTotalSupplyBefore = await tokenMeta.primordialTotalSupply();
			var account1PrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account1);
			var account1WeightedIndexBefore = await tokenMeta.weightedIndexByAddress(account1);
			var account1TotalLotsBefore = await tokenMeta.totalLotsByAddress(account1);

			await tokenMeta.burnPrimordialToken(10, { from: account1 });

			var account1PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account1);
			var primordialTotalSupplyAfter = await tokenMeta.primordialTotalSupply();
			var account1WeightedIndexAfter = await tokenMeta.weightedIndexByAddress(account1);
			var account1TotalLotsAfter = await tokenMeta.totalLotsByAddress(account1);

			assert.equal(
				account1PrimordialBalanceAfter.toNumber(),
				account1PrimordialBalanceBefore.toNumber() - 10,
				"Account1 has incorrect Primordial balance after burn"
			);
			assert.equal(
				primordialTotalSupplyAfter.toNumber(),
				primordialTotalSupplyBefore.toNumber() - 10,
				"Incorrect Primordial total supply after burn"
			);
			assert.equal(
				account1WeightedIndexBefore.toNumber(),
				account1WeightedIndexAfter.toNumber(),
				"Account1 has incorrect weighted index after burn"
			);
			assert.equal(
				account1TotalLotsBefore.toNumber(),
				account1TotalLotsAfter.toNumber(),
				"Account1 has incorrect total lots after burn"
			);
		});
		*/
		it("approvePrimordialToken() - should set Primordial allowance for other address", async function() {
			var account3PrimordialAllowance = await tokenMeta.primordialAllowance(account1, account3);
			assert.equal(account3PrimordialAllowance.toNumber(), 0, "Account3 has incorrect Primordial allowance before approve");
			await tokenMeta.approvePrimordialToken(account3, 10, { from: account1 });
			account3PrimordialAllowance = await tokenMeta.primordialAllowance(account1, account3);
			assert.equal(account3PrimordialAllowance.toNumber(), 10, "Account3 has incorrect Primordial allowance after approve");
		});
		it("transferPrimordialTokenFrom() - should send `_value` Primordial tokens to `_to` in behalf of `_from`", async function() {
			var account1PrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account1);
			var account3PrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account3);
			var account1WeightedMultiplierBefore = await tokenMeta.weightedMultiplierByAddress(account1);
			var account3WeightedMultiplierBefore = await tokenMeta.weightedMultiplierByAddress(account3);
			var account3PrimordialAllowanceBefore = await tokenMeta.primordialAllowance(account1, account3);

			var totalLotsBefore = await tokenMeta.totalLots();
			var primordialTotalSupplyBefore = await tokenMeta.primordialTotalSupply();

			var canTransfer, events;
			try {
				var result = await tokenMeta.transferPrimordialTokenFrom(account1, account3, 10, { from: developer });
				events = result.logs;
				canTransfer = true;
			} catch (e) {
				events = null;
				canTransfer = false;
			}
			assert.notEqual(canTransfer, true, "Account with no allowance can transfer primordial on behalf of other account");

			try {
				var result = await tokenMeta.transferPrimordialTokenFrom(account1, account3, 100, { from: account3 });
				events = result.logs;
				canTransfer = true;
			} catch (e) {
				events = null;
				canTransfer = false;
			}
			assert.notEqual(canTransfer, true, "Account can transfer primordial on behalf of other account more than its allowance");

			try {
				var result = await tokenMeta.transferPrimordialTokenFrom(account1, account3, 10, { from: account3 });
				events = result.logs;
				canTransfer = true;
			} catch (e) {
				events = null;
				canTransfer = false;
			}

			assert.equal(canTransfer, true, "Account1 can't transfer primordial token");
			assert.notEqual(events, null, "Contract didn't emit events during transfer primordial token");

			var accountLotId;
			for (var i = 0; i < events.length; i++) {
				var _event = events[i];
				switch (_event.event) {
					case "LotCreation":
						accountLotId = _event.args.lotId;
						assert.equal(
							_event.args.multiplier.toString(),
							account1WeightedMultiplierBefore.toString(),
							"Account Lot Creation has incorrect multiplier"
						);
						assert.equal(_event.args.primordialTokenAmount.toString(), 10, "Account Lot Creation has incorrect tokenAmount");
						assert.equal(
							_event.args.networkTokenBonusAmount.toString(),
							0,
							"Account Lot Creation has incorrect networkTokenBonusAmount"
						);
						break;
					default:
						break;
				}
			}

			var account1PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account1);
			var account3PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account3);
			var account1WeightedMultiplierAfter = await tokenMeta.weightedMultiplierByAddress(account1);
			var account3WeightedMultiplierAfter = await tokenMeta.weightedMultiplierByAddress(account3);
			var account3PrimordialAllowanceAfter = await tokenMeta.primordialAllowance(account1, account3);

			var totalLotsAfter = await tokenMeta.totalLots();
			var primordialTotalSupplyAfter = await tokenMeta.primordialTotalSupply();

			assert.equal(
				account1PrimordialBalanceAfter.toString(),
				account1PrimordialBalanceBefore.minus(10).toString(),
				"Account1 has incorrect primordial balance"
			);
			assert.equal(
				account3PrimordialBalanceAfter.toString(),
				account3PrimordialBalanceBefore.plus(10).toString(),
				"Account3 has incorrect primordial balance"
			);
			assert.equal(
				account1WeightedMultiplierAfter.toString(),
				account1WeightedMultiplierBefore.toString(),
				"Account1 has incorrect weighted multiplier"
			);

			assert.equal(totalLotsAfter.toString(), totalLotsBefore.plus(1).toString(), "Contract has incorrect totalLots");
			assert.equal(
				primordialTotalSupplyAfter.toString(),
				primordialTotalSupplyBefore.toString(),
				"Contract has incorrect primordialTotalSupply"
			);

			assert.equal(
				account3PrimordialAllowanceAfter.toString(),
				account3PrimordialAllowanceBefore.minus(10).toString(),
				"Account3 has incorrect primordial allowance"
			);

			// Make sure the Lot is stored correctly
			var accountLot = await tokenMeta.lotById(accountLotId);
			assert.equal(accountLot[0], accountLotId, "Lot has incorrect ID");
			assert.equal(accountLot[1].toString(), account1WeightedMultiplierAfter.toString(), "Lot has incorrect multiplier");
			assert.equal(accountLot[2].toString(), 10, "Lot has incorrect tokenAmount");

			account3Lots.push(accountLot);

			var newWeightedMultiplier = calculateWeightedMultiplier(account3Lots);
			assert.equal(
				account3WeightedMultiplierAfter.toString(),
				newWeightedMultiplier.toString(),
				"Account3 has incorrect weighted multiplier"
			);
		});
		/*
		it("burnPrimordialTokenFrom() - should remove `_value` Primordial tokens from the system irreversibly on behalf of `_from`", async function() {
			var account1PrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account1);
			var account3AllowanceBefore = await tokenMeta.primordialAllowance(account1, account3);
			var primordialTotalSupplyBefore = await tokenMeta.primordialTotalSupply();

			var canBurnPrimordialFrom;
			try {
				await tokenMeta.burnPrimordialTokenFrom(account1, 5, { from: developer });
				canBurnPrimordialFrom = true;
			} catch (e) {
				canBurnPrimordialFrom = false;
			}
			assert.notEqual(canBurnPrimordialFrom, true, "Account that was not approved is able to burn on behalf of other");
			try {
				await tokenMeta.burnPrimordialTokenFrom(account1, 10, { from: account3 });
				canBurnPrimordialFrom = true;
			} catch (e) {
				canBurnPrimordialFrom = false;
			}
			assert.notEqual(
				canBurnPrimordialFrom,
				true,
				"Account that was approved is able to burn more than it's allowance on behalf of other"
			);
			try {
				await tokenMeta.burnPrimordialTokenFrom(account1, 5, { from: account3 });
				canBurnPrimordialFrom = true;
			} catch (e) {
				canBurnPrimordialFrom = false;
			}
			assert.equal(canBurnPrimordialFrom, true, "Account that was approved is not able to burn on behalf of other");
			var account1PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account1);
			var account3AllowanceAfter = await tokenMeta.primordialAllowance(account1, account3);
			assert.equal(
				account1PrimordialBalanceAfter.toNumber(),
				account1PrimordialBalanceBefore.toNumber() - 5,
				"Account1 has incorrect Primordial balance after burnPrimordialTokenFrom"
			);
			assert.equal(
				account3AllowanceAfter.toNumber(),
				account3AllowanceBefore.toNumber() - 5,
				"Account3 has incorrect Primordial allowance after burnPrimordialTokenFrom"
			);

			var primordialTotalSupplyAfter = await tokenMeta.primordialTotalSupply();
			assert.equal(
				primordialTotalSupplyAfter.toNumber(),
				primordialTotalSupplyBefore.toNumber() - 5,
				"Contract has incorrect Primordial total supply after burnPrimordialTokenFrom"
			);
		});
		*/
		it("totalLotsByAddress() - should return the correct total lots owned by an address", async function() {
			var account1TotalLots = await tokenMeta.totalLotsByAddress(account1);
			var account2TotalLots = await tokenMeta.totalLotsByAddress(account2);
			var account3TotalLots = await tokenMeta.totalLotsByAddress(account3);
			assert.equal(
				account1TotalLots.toNumber(),
				account1Lots.length,
				"totalLotsByAddress() returns incorrect total lots for Account1"
			);
			assert.equal(
				account2TotalLots.toNumber(),
				account2Lots.length,
				"totalLotsByAddress() returns incorrect total lots for Account2"
			);
			assert.equal(
				account3TotalLots.toNumber(),
				account3Lots.length,
				"totalLotsByAddress() returns incorrect total lots for Account3"
			);
		});
		it("frozen account should NOT be able to transfer Primordial", async function() {
			var canTransferPrimordial;
			await tokenMeta.freezeAccount(account1, true, { from: developer });
			try {
				await tokenMeta.transferPrimordialToken(account2, 10, { from: account1 });
				canTransferPrimordial = true;
			} catch (e) {
				canTransferPrimordial = false;
			}
			assert.notEqual(canTransferPrimordial, true, "Frozen account can transfer Primordial");
			// Unfreeze account1
			await tokenMeta.freezeAccount(account1, false, { from: developer });
		});
		it("should return all lots owned by an address", async function() {
			var _lots = await tokenMeta.lotIdsByAddress(account1);
			var isEqual =
				_lots.length === account1Lots.length &&
				_lots.every(function(value, index) {
					return value === account1Lots[index][0];
				});
			assert.equal(isEqual, true, "lotIdsByAddress() return incorrect lots for Account1");

			_lots = await tokenMeta.lotIdsByAddress(account2);
			isEqual =
				_lots.length === account2Lots.length &&
				_lots.every(function(value, index) {
					return value === account2Lots[index][0];
				});
			assert.equal(isEqual, true, "lotIdsByAddress() return incorrect lots for Account2");

			_lots = await tokenMeta.lotIdsByAddress(account3);
			isEqual =
				_lots.length === account3Lots.length &&
				_lots.every(function(value, index) {
					return value === account3Lots[index][0];
				});
			assert.equal(isEqual, true, "lotIdsByAddress() return incorrect lots for Account3");
		});
		it("should return correct lot information at a given ID", async function() {
			var lot = await tokenMeta.lotById(account1Lots[0][0]);
			assert.equal(lot[0], account1Lots[0][0], "lotById() return incorrect lot ID");
			assert.equal(lot[1].toString(), account1Lots[0][1].toString(), "lotById() return incorrect multiplier");
			assert.equal(lot[2].toString(), account1Lots[0][2].toString(), "lotById() return incorrect token amount");
		});
	});
	contract("Token Combination Function Tests", function() {
		before(async function() {
			await tokenMeta.mintToken(account1, 1000, { from: developer });
			await tokenMeta.buyPrimordialToken({ from: account1, value: 10000000 });
		});

		it("transferTokens() - should send correct `_value` network tokens and `_primordialValue` Primordial tokens to `_to` from your account", async function() {
			var account1BalanceBefore = await tokenMeta.balanceOf(account1);
			var account2BalanceBefore = await tokenMeta.balanceOf(account2);

			var account1PrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account1);
			var account2PrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account2);

			var account1WeightedMultiplier = await tokenMeta.weightedMultiplierByAddress(account1);

			await tokenMeta.transferTokens(account2, 10, 10, { from: account1 });

			var account1BalanceAfter = await tokenMeta.balanceOf(account1);
			var account2BalanceAfter = await tokenMeta.balanceOf(account2);

			var account1PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account1);
			var account2PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account2);

			var account2WeightedMultiplier = await tokenMeta.weightedMultiplierByAddress(account2);

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.minus(10).toString(),
				"Account1 has incorrect network tokens balance after transfer"
			);
			assert.equal(
				account2BalanceAfter.toString(),
				account2BalanceBefore.plus(10).toString(),
				"Account2 has incorrect network tokens balance after transfer"
			);
			assert.equal(
				account1PrimordialBalanceAfter.toString(),
				account1PrimordialBalanceBefore.minus(10).toString(),
				"Account1 has incorrect Primordial Tokens balance after transfer"
			);
			assert.equal(
				account2PrimordialBalanceAfter.toString(),
				account2PrimordialBalanceBefore.plus(10).toString(),
				"Account2 has incorrect Primordial Tokens balance after transfer"
			);
			assert.equal(
				account2WeightedMultiplier.toString(),
				account1WeightedMultiplier.toString(),
				"Account2 has incorrect weighted multiplier after transfer"
			);
		});
		/*
		it("burnTokens() - should remove `_value` network tokens and `_primordialValue` Primordial tokens from the system irreversibly", async function() {
			var account1BalanceBefore = await tokenMeta.balanceOf(account1);
			var account1PrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account1);
			var totalSupplyBefore = await tokenMeta.totalSupply();
			var primordialTotalSupplyBefore = await tokenMeta.primordialTotalSupply();

			await tokenMeta.burnTokens(5, 5, { from: account1 });

			var account1BalanceAfter = await tokenMeta.balanceOf(account1);
			var account1PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account1);
			var totalSupplyAfter = await tokenMeta.totalSupply();
			var primordialTotalSupplyAfter = await tokenMeta.primordialTotalSupply();

			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.toNumber() - 5,
				"Account1 has incorrect network tokens balance after burn"
			);
			assert.equal(
				account1PrimordialBalanceAfter.toNumber(),
				account1PrimordialBalanceBefore.toNumber() - 5,
				"Account1 has incorrect Primordial Tokens balance after burn"
			);
			assert.equal(
				totalSupplyAfter.toNumber(),
				totalSupplyBefore.toNumber() - 5,
				"Contract has incorrect network tokens total supply after burn"
			);
			assert.equal(
				primordialTotalSupplyAfter.toNumber(),
				primordialTotalSupplyBefore.toNumber() - 5,
				"Contract has incorrect Primordial Tokens total supply after burn"
			);
		});
		*/
		it("approveTokens() - should allow `_spender` to spend no more than `_value` network tokens and `_primordialValue` Primordial tokens in your behalf", async function() {
			var account2AllowanceBefore = await tokenMeta.allowance(account1, account2);
			var account2PrimordialAllowanceBefore = await tokenMeta.primordialAllowance(account1, account2);

			await tokenMeta.approveTokens(account2, 40, 40, { from: account1 });

			var account2AllowanceAfter = await tokenMeta.allowance(account1, account2);
			var account2PrimordialAllowanceAfter = await tokenMeta.primordialAllowance(account1, account2);

			assert.equal(
				account2AllowanceAfter.toString(),
				account2AllowanceBefore.plus(40).toString(),
				"Account2 has incorrect network tokens allowance after approve"
			);
			assert.equal(
				account2PrimordialAllowanceAfter.toString(),
				account2PrimordialAllowanceBefore.plus(40).toString(),
				"Account2 has incorrect Primordial Tokens allowance after approve"
			);
		});
		it("transferTokensFrom() - should send `_value` network tokens tokens and `_primordialValue` Primordial Tokens to `_to` in behalf of `_from`", async function() {
			var canTransferTokensFrom;
			try {
				await tokenMeta.transferTokensFrom(account1, account3, 5, 5, { from: developer });
				canTransferTokensFrom = true;
			} catch (e) {
				canTransferTokensFrom = false;
			}
			assert.notEqual(canTransferTokensFrom, true, "Account that was not approved is able to transfer tokens on behalf of other");

			var account1BalanceBefore = await tokenMeta.balanceOf(account1);
			var account3BalanceBefore = await tokenMeta.balanceOf(account3);
			var account2AllowanceBefore = await tokenMeta.allowance(account1, account2);

			var account1PrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account1);
			var account3PrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account3);
			var account2PrimordialAllowanceBefore = await tokenMeta.primordialAllowance(account1, account2);

			var account1WeightedMultiplierBefore = await tokenMeta.weightedMultiplierByAddress(account1);

			try {
				await tokenMeta.transferTokensFrom(account1, account3, 5, 5, { from: account2 });
				canTransferTokensFrom = true;
			} catch (e) {
				canTransferTokensFrom = false;
			}
			assert.equal(canTransferTokensFrom, true, "Account that was approved is not able to transfer on behalf of other");

			var account1BalanceAfter = await tokenMeta.balanceOf(account1);
			var account3BalanceAfter = await tokenMeta.balanceOf(account3);
			var account2AllowanceAfter = await tokenMeta.allowance(account1, account2);

			var account1PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account1);
			var account3PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account3);
			var account2PrimordialAllowanceAfter = await tokenMeta.primordialAllowance(account1, account2);

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.minus(5).toString(),
				"Account1 has incorrect network tokens balance after transferTokensFrom"
			);
			assert.equal(
				account3BalanceAfter.toString(),
				account3BalanceBefore.plus(5).toString(),
				"Account3 has incorrect network tokens balance after transferTokensFrom"
			);
			assert.equal(
				account2AllowanceAfter.toString(),
				account2AllowanceBefore.minus(5).toString(),
				"Account2 has incorrect network tokens allowance after transferTokensFrom"
			);

			assert.equal(
				account1PrimordialBalanceAfter.toString(),
				account1PrimordialBalanceBefore.minus(5).toString(),
				"Account1 has incorrect Primordial Tokens balance after transferTokensFrom"
			);
			assert.equal(
				account3PrimordialBalanceAfter.toString(),
				account3PrimordialBalanceBefore.plus(5).toString(),
				"Account3 has incorrect Primordial Tokens balance after transferTokensFrom"
			);
			assert.equal(
				account2PrimordialAllowanceAfter.toString(),
				account2PrimordialAllowanceBefore.minus(5).toString(),
				"Account2 has incorrect Primordial Tokens allowance after transferTokensFrom"
			);

			var account1WeightedMultiplierAfter = await tokenMeta.weightedMultiplierByAddress(account1);
			var account3WeightedMultiplier = await tokenMeta.weightedMultiplierByAddress(account3);
			assert.equal(
				account1WeightedMultiplierAfter.toString(),
				account1WeightedMultiplierBefore.toString(),
				"Account1 has incorrect weighted multiplier"
			);
			assert.equal(
				account3WeightedMultiplier.toString(),
				account1WeightedMultiplierBefore.toString(),
				"Account3 has incorrect weighted multiplier"
			);
		});
		/*
		it("burnTokensFrom() - should remove `_value` network tokens and `_primordialValue` Primordial Tokens from the system irreversibly on behalf of `_from`", async function() {
			var canBurnTokensFrom;
			try {
				await tokenMeta.burnTokensFrom(account1, 5, 5, { from: developer });
				canBurnTokensFrom = true;
			} catch (e) {
				canBurnTokensFrom = false;
			}
			assert.notEqual(canBurnTokensFrom, true, "Account that was not approved is able to burn tokens on behalf of other");
			try {
				await tokenMeta.burnTokensFrom(account1, 1000, 1000, { from: account2 });
				canBurnTokensFrom = true;
			} catch (e) {
				canBurnTokensFrom = false;
			}
			assert.notEqual(
				canBurnTokensFrom,
				true,
				"Account that was approved is able to burn more than it's allowance on behalf of other"
			);

			var account1BalanceBefore = await tokenMeta.balanceOf(account1);
			var account2AllowanceBefore = await tokenMeta.allowance(account1, account2);

			var account1PrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account1);
			var account2PrimordialAllowanceBefore = await tokenMeta.primordialAllowance(account1, account2);

			var totalSupplyBefore = await tokenMeta.totalSupply();
			var primordialTotalSupplyBefore = await tokenMeta.primordialTotalSupply();

			try {
				await tokenMeta.burnTokensFrom(account1, 10, 10, { from: account2 });
				canBurnTokensFrom = true;
			} catch (e) {
				canBurnTokensFrom = false;
			}
			assert.equal(canBurnTokensFrom, true, "Account that was approved is not able to burn on behalf of other");

			var account1BalanceAfter = await tokenMeta.balanceOf(account1);
			var account2AllowanceAfter = await tokenMeta.allowance(account1, account2);

			var account1PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account1);
			var account2PrimordialAllowanceAfter = await tokenMeta.primordialAllowance(account1, account2);

			var totalSupplyAfter = await tokenMeta.totalSupply();
			var primordialTotalSupplyAfter = await tokenMeta.primordialTotalSupply();

			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.toNumber() - 10,
				"Account1 has incorrect network tokens balance after burnTokensFrom"
			);
			assert.equal(
				account2AllowanceAfter.toNumber(),
				account2AllowanceBefore.toNumber() - 10,
				"Account2 has incorrect network tokens allowance after burnTokensFrom"
			);

			assert.equal(
				account1PrimordialBalanceAfter.toNumber(),
				account1PrimordialBalanceBefore.toNumber() - 10,
				"Account1 has incorrect Primordial Tokens balance after burnTokensFrom"
			);
			assert.equal(
				account2PrimordialAllowanceAfter.toNumber(),
				account2PrimordialAllowanceBefore.toNumber() - 10,
				"Account2 has incorrect Primordial Tokens allowance after burnTokensFrom"
			);

			assert.equal(
				totalSupplyAfter.toNumber(),
				totalSupplyBefore.toNumber() - 10,
				"Contract has incorrect network tokens total suppy after burnTokensFrom"
			);
			assert.equal(
				primordialTotalSupplyAfter.toNumber(),
				primordialTotalSupplyBefore.toNumber() - 10,
				"Contract has incorrect Primordial Tokens total suppy after burnTokensFrom"
			);
		});
		*/
	});
	contract("Whitelisted Address Function Tests", function() {
		var stakedPrimordialWeightedMultiplier;
		before(async function() {
			await tokenMeta.mintToken(account1, 100, { from: developer });
			await tokenMeta.buyPrimordialToken({ from: account1, value: 1000000 });
			await tokenMeta.mintToken(account2, 100, { from: developer });
			await tokenMeta.mintToken(account3, 200, { from: developer });
		});

		it("only developer can whitelist account that can transact on behalf of others", async function() {
			var canSetWhitelist;
			try {
				await tokenMeta.setWhitelist(whitelistedAccount, true, { from: account1 });
				canSetWhitelist = true;
			} catch (e) {
				canSetWhitelist = false;
			}
			assert.notEqual(canSetWhitelist, true, "Others can set whitelist");
			try {
				await tokenMeta.setWhitelist(whitelistedAccount, true, { from: developer });
				canSetWhitelist = true;
			} catch (e) {
				canSetWhitelist = false;
			}
			assert.equal(canSetWhitelist, true, "Developer can't whitelist account to transact on behalf of others");
			var whitelistedAccountCanTransact = await tokenMeta.whitelist(whitelistedAccount);
			assert.equal(
				whitelistedAccountCanTransact,
				true,
				"Staking account doesn't have permission to transact after developer gave permission"
			);
		});
		it("should be able to stake tokens on behalf of others", async function() {
			var account1BalanceBefore = await tokenMeta.balanceOf(account1);
			var account1StakedBalanceBefore = await tokenMeta.stakedBalance(account1);
			var totalSupplyBefore = await tokenMeta.totalSupply();

			var canStake;
			try {
				await tokenMeta.stakeFrom(account1, 10, { from: account2 });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "Account that do not have permission can stake on behalf of others");
			try {
				await tokenMeta.stakeFrom(account1, 100000, { from: whitelistedAccount });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "Account can stake more than available balance");
			try {
				await tokenMeta.stakeFrom(account1, 10, { from: whitelistedAccount });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.equal(canStake, true, "Account that has permission can't stake on behalf of others");

			var account1BalanceAfter = await tokenMeta.balanceOf(account1);
			var account1StakedBalanceAfter = await tokenMeta.stakedBalance(account1);
			var totalSupplyAfter = await tokenMeta.totalSupply();

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.minus(10).toString(),
				"Account1 has incorrect balance after staking"
			);
			assert.equal(
				account1StakedBalanceAfter.toString(),
				account1StakedBalanceBefore.plus(10).toString(),
				"Account1 has incorrect staked balance after staking"
			);
			assert.equal(totalSupplyAfter.toString(), totalSupplyBefore.toString(), "Contract has incorrect total supply after staking");
		});
		it("should be able to unstake tokens on behalf of others", async function() {
			var account1BalanceBefore = await tokenMeta.balanceOf(account1);
			var account1StakedBalanceBefore = await tokenMeta.stakedBalance(account1);
			var totalSupplyBefore = await tokenMeta.totalSupply();

			var canUnstake;
			try {
				await tokenMeta.unstakeFrom(account1, 10, { from: account2 });
				canUnstake = true;
			} catch (e) {
				canUnstake = false;
			}
			assert.notEqual(canUnstake, true, "Account that do not have permission can unstake on behalf of others");
			try {
				await tokenMeta.unstakeFrom(account1, 100000, { from: whitelistedAccount });
				canUnstake = true;
			} catch (e) {
				canUnstake = false;
			}
			assert.notEqual(canUnstake, true, "Account can unstake more than available balance");
			try {
				await tokenMeta.unstakeFrom(account1, 10, { from: whitelistedAccount });
				canUnstake = true;
			} catch (e) {
				canUnstake = false;
			}
			assert.equal(canUnstake, true, "Account that has permission can't unstake on behalf of others");

			var account1BalanceAfter = await tokenMeta.balanceOf(account1);
			var account1StakedBalanceAfter = await tokenMeta.stakedBalance(account1);
			var totalSupplyAfter = await tokenMeta.totalSupply();

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.plus(10).toString(),
				"Account1 has incorrect balance after unstaking"
			);
			assert.equal(
				account1StakedBalanceAfter.toString(),
				account1StakedBalanceBefore.minus(10).toString(),
				"Account1 has incorrect staked balance after unstaking"
			);
			assert.equal(totalSupplyAfter.toString(), totalSupplyBefore.toString(), "Contract has incorrect total supply after unstaking");
		});
		it("should be able to stake Primordial tokens on behalf of others", async function() {
			var account1PrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account1);
			var account1WeightedMultiplierBefore = await tokenMeta.weightedMultiplierByAddress(account1);
			var account1PrimordialStakedBalanceBefore = await tokenMeta.primordialStakedBalance(
				account1,
				account1WeightedMultiplierBefore.toString()
			);
			var primordialTotalSupplyBefore = await tokenMeta.primordialTotalSupply();

			var canStakePrimordial;
			try {
				await tokenMeta.stakePrimordialTokenFrom(account1, 10, account1WeightedMultiplierBefore.toString(), { from: account2 });
				canStakePrimordial = true;
			} catch (e) {
				canStakePrimordial = false;
			}
			assert.notEqual(
				canStakePrimordial,
				true,
				"Account that do not have permission can stake Primordial tokens on behalf of others"
			);
			try {
				await tokenMeta.stakePrimordialTokenFrom(account1, 1000000, account1WeightedMultiplierBefore.toString(), {
					from: whitelistedAccount
				});
				canStakePrimordial = true;
			} catch (e) {
				canStakePrimordial = false;
			}
			assert.notEqual(canStakePrimordial, true, "Account can stake more than available balance");
			try {
				await tokenMeta.stakePrimordialTokenFrom(account1, 10, account1WeightedMultiplierBefore.toString(), {
					from: whitelistedAccount
				});
				canStakePrimordial = true;
			} catch (e) {
				canStakePrimordial = false;
			}
			assert.equal(canStakePrimordial, true, "Account that has permission can't stake Primordial tokens on behalf of others");
			stakedPrimordialWeightedMultiplier = account1WeightedMultiplierBefore.toString();

			var account1PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account1);
			var account1WeightedMultiplierAfter = await tokenMeta.weightedMultiplierByAddress(account1);
			var account1PrimordialStakedBalanceAfter = await tokenMeta.primordialStakedBalance(
				account1,
				stakedPrimordialWeightedMultiplier
			);
			var primordialTotalSupplyAfter = await tokenMeta.primordialTotalSupply();

			assert.equal(
				account1PrimordialBalanceAfter.toString(),
				account1PrimordialBalanceBefore.minus(10).toString(),
				"Account1 has incorrect Primordial tokens balance after staking"
			);
			assert.equal(
				account1WeightedMultiplierAfter.toString(),
				account1WeightedMultiplierBefore.toString(),
				"Account1 has incorrect weighted index after staking"
			);
			assert.equal(
				account1PrimordialStakedBalanceAfter.toString(),
				account1PrimordialStakedBalanceBefore.plus(10).toString(),
				"Account1 has incorrect Primordial tokens staked balance after staking"
			);
			assert.equal(
				primordialTotalSupplyAfter.toString(),
				primordialTotalSupplyBefore.toString(),
				"Contract has incorrect Primordial total supply after staking"
			);
		});
		it("should be able to unstake Primordial tokens on behalf of others", async function() {
			var account1PrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account1);
			var account1WeightedMultiplierBefore = await tokenMeta.weightedMultiplierByAddress(account1);
			var account1PrimordialStakedBalanceBefore = await tokenMeta.primordialStakedBalance(
				account1,
				stakedPrimordialWeightedMultiplier
			);
			var primordialTotalSupplyBefore = await tokenMeta.primordialTotalSupply();

			var canUnstakePrimordial;
			try {
				await tokenMeta.unstakePrimordialTokenFrom(account1, 10, stakedPrimordialWeightedMultiplier, { from: account2 });
				canUnstakePrimordial = true;
			} catch (e) {
				canUnstakePrimordial = false;
			}
			assert.notEqual(
				canUnstakePrimordial,
				true,
				"Account that do not have permission can unstake Primordial tokens on behalf of others"
			);
			try {
				await tokenMeta.unstakePrimordialTokenFrom(account1, 100000, stakedPrimordialWeightedMultiplier, {
					from: whitelistedAccount
				});
				canUnstakePrimordial = true;
			} catch (e) {
				canUnstakePrimordial = false;
			}
			assert.notEqual(canUnstakePrimordial, true, "Account can unstake more than available balance");
			try {
				await tokenMeta.unstakePrimordialTokenFrom(account1, 10, stakedPrimordialWeightedMultiplier, { from: whitelistedAccount });
				canUnstakePrimordial = true;
			} catch (e) {
				canUnstakePrimordial = false;
			}
			assert.equal(canUnstakePrimordial, true, "Account that has permission can't unstake Primordial tokens on behalf of others");

			var account1PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account1);
			var account1WeightedMultiplierAfter = await tokenMeta.weightedMultiplierByAddress(account1);
			var account1PrimordialStakedBalanceAfter = await tokenMeta.primordialStakedBalance(
				account1,
				stakedPrimordialWeightedMultiplier
			);
			var primordialTotalSupplyAfter = await tokenMeta.primordialTotalSupply();

			assert.equal(
				account1PrimordialBalanceAfter.toString(),
				account1PrimordialBalanceBefore.plus(10).toString(),
				"Account1 has incorrect Primordial tokens balance after unstaking"
			);
			assert.equal(
				account1WeightedMultiplierAfter.toString(),
				account1WeightedMultiplierBefore.toString(),
				"Account1 has incorrect weighted index after unstaking"
			);
			assert.equal(
				account1PrimordialStakedBalanceAfter.toString(),
				account1PrimordialStakedBalanceBefore.minus(10).toString(),
				"Account1 has incorrect Primordial tokens staked balance after unstaking"
			);
			assert.equal(
				primordialTotalSupplyAfter.toString(),
				primordialTotalSupplyBefore.toString(),
				"Contract has incorrect Primordial total supply after unstaking"
			);
		});

		it("should be able to burn tokens on behalf of others", async function() {
			var account1BalanceBefore = await tokenMeta.balanceOf(account1);
			var totalSupplyBefore = await tokenMeta.totalSupply();

			var canBurn;
			try {
				await tokenMeta.whitelistBurnFrom(account1, 10, { from: account2 });
				canBurn = true;
			} catch (e) {
				canBurn = false;
			}
			assert.notEqual(canBurn, true, "Account that do not have permission can burn on behalf of others");
			try {
				await tokenMeta.whitelistBurnFrom(account1, 1000000, { from: whitelistedAccount });
				canBurn = true;
			} catch (e) {
				canBurn = false;
			}
			assert.notEqual(canBurn, true, "Account can burn more than available balance");
			try {
				await tokenMeta.whitelistBurnFrom(account1, 10, { from: whitelistedAccount });
				canBurn = true;
			} catch (e) {
				canBurn = false;
			}
			assert.equal(canBurn, true, "Account that has permission can't burn on behalf of others");

			var account1BalanceAfter = await tokenMeta.balanceOf(account1);
			var totalSupplyAfter = await tokenMeta.totalSupply();

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.minus(10).toString(),
				"Account1 has incorrect balance after burning"
			);
			assert.equal(
				totalSupplyAfter.toString(),
				totalSupplyBefore.minus(10).toString(),
				"Contract has incorrect total supply after burning"
			);
		});

		it("should be able to escrow tokens on behalf of others", async function() {
			var account1BalanceBefore = await tokenMeta.balanceOf(account1);
			var account2BalanceBefore = await tokenMeta.balanceOf(account2);
			var account1EscrowedBalanceBefore = await tokenMeta.escrowedBalance(account1);
			var totalSupplyBefore = await tokenMeta.totalSupply();

			var canEscrow;
			try {
				await tokenMeta.escrowFrom(account2, account1, 10, { from: account2 });
				canEscrow = true;
			} catch (e) {
				canEscrow = false;
			}
			assert.notEqual(canEscrow, true, "Account that do not have permission can escrow on behalf of others");
			try {
				await tokenMeta.escrowFrom(account2, account1, 1000, { from: whitelistedAccount });
				canEscrow = true;
			} catch (e) {
				canEscrow = false;
			}
			assert.notEqual(canEscrow, true, "Account can escrow more than available balance");
			try {
				await tokenMeta.escrowFrom(account2, account1, 10, { from: whitelistedAccount });
				canEscrow = true;
			} catch (e) {
				canEscrow = false;
			}
			assert.equal(canEscrow, true, "Account that has permission can't escrow on behalf of others");

			var account1BalanceAfter = await tokenMeta.balanceOf(account1);
			var account2BalanceAfter = await tokenMeta.balanceOf(account2);
			var account1EscrowedBalanceAfter = await tokenMeta.escrowedBalance(account1);
			var totalSupplyAfter = await tokenMeta.totalSupply();

			assert.equal(account1BalanceAfter.toString(), account1BalanceBefore.toString(), "Account1 has incorrect balance after escrow");
			assert.equal(
				account2BalanceAfter.toString(),
				account2BalanceBefore.minus(10).toString(),
				"Account2 has incorrect balance after escrow"
			);
			assert.equal(
				account1EscrowedBalanceAfter.toString(),
				account1EscrowedBalanceBefore.plus(10).toString(),
				"Account1 has incorrect escrowed balance after escrow"
			);
			assert.equal(totalSupplyAfter.toString(), totalSupplyBefore.toString(), "Contract has incorrect total supply after escrow");

			var account1BalanceBefore = await tokenMeta.balanceOf(account1);
			var account3BalanceBefore = await tokenMeta.balanceOf(account3);
			var account1EscrowedBalanceBefore = await tokenMeta.escrowedBalance(account1);
			var totalSupplyBefore = await tokenMeta.totalSupply();

			try {
				await tokenMeta.escrowFrom(account3, account1, 75, { from: whitelistedAccount });
				canEscrow = true;
			} catch (e) {
				canEscrow = false;
			}
			assert.equal(canEscrow, true, "Account that has permission can't escrow on behalf of others");

			var account1BalanceAfter = await tokenMeta.balanceOf(account1);
			var account3BalanceAfter = await tokenMeta.balanceOf(account3);
			var account1EscrowedBalanceAfter = await tokenMeta.escrowedBalance(account1);
			var totalSupplyAfter = await tokenMeta.totalSupply();

			assert.equal(account1BalanceAfter.toString(), account1BalanceBefore.toString(), "Account1 has incorrect balance after escrow");
			assert.equal(
				account3BalanceAfter.toString(),
				account3BalanceBefore.minus(75).toString(),
				"Account3 has incorrect balance after escrow"
			);
			assert.equal(
				account1EscrowedBalanceAfter.toString(),
				account1EscrowedBalanceBefore.plus(75).toString(),
				"Account1 has incorrect escrowed balance after escrow"
			);
			assert.equal(totalSupplyAfter.toString(), totalSupplyBefore.toString(), "Contract has incorrect total supply after escrow");
		});

		it("should be able to mint and escrow tokens to an account", async function() {
			var account1BalanceBefore = await tokenMeta.balanceOf(account1);
			var account1EscrowedBalanceBefore = await tokenMeta.escrowedBalance(account1);
			var totalSupplyBefore = await tokenMeta.totalSupply();

			var canMintEscrow;
			try {
				await tokenMeta.mintTokenEscrow(account1, 10, { from: account2 });
				canMintEscrow = true;
			} catch (e) {
				canMintEscrow = false;
			}
			assert.notEqual(canMintEscrow, true, "Account that do not have permission can mint and escrow");
			try {
				await tokenMeta.mintTokenEscrow(account1, 10, { from: whitelistedAccount });
				canMintEscrow = true;
			} catch (e) {
				canMintEscrow = false;
			}
			assert.equal(canMintEscrow, true, "Account that has permission can't mint and escrow");

			var account1BalanceAfter = await tokenMeta.balanceOf(account1);
			var account1EscrowedBalanceAfter = await tokenMeta.escrowedBalance(account1);
			var totalSupplyAfter = await tokenMeta.totalSupply();

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.toString(),
				"Account1 has incorrect balance after mint and escrow"
			);
			assert.equal(
				account1EscrowedBalanceAfter.toString(),
				account1EscrowedBalanceBefore.plus(10).toString(),
				"Account1 has incorrect escrowed balance after mint and escrow"
			);
			assert.equal(
				totalSupplyAfter.toString(),
				totalSupplyBefore.plus(10).toString(),
				"Contract has incorrect total supply after mint and escrow"
			);
		});

		it("should be able to unescrow tokens for an account", async function() {
			var account1BalanceBefore = await tokenMeta.balanceOf(account1);
			var account1EscrowedBalanceBefore = await tokenMeta.escrowedBalance(account1);
			var totalSupplyBefore = await tokenMeta.totalSupply();

			var canUnescrow;
			try {
				await tokenMeta.unescrowFrom(account1, 10, { from: account2 });
				canUnescrow = true;
			} catch (e) {
				canUnescrow = false;
			}
			assert.notEqual(canUnescrow, true, "Account that do not have permission can unescrow tokens on behalf of others");
			try {
				await tokenMeta.unescrowFrom(account1, 100000, { from: whitelistedAccount });
				canUnescrow = true;
			} catch (e) {
				canUnescrow = false;
			}
			assert.notEqual(canUnescrow, true, "Account can unescrow more than available balance");
			try {
				await tokenMeta.unescrowFrom(account1, 10, { from: whitelistedAccount });
				canUnescrow = true;
			} catch (e) {
				canUnescrow = false;
			}
			assert.equal(canUnescrow, true, "Account that has permission can't unescrow on behalf of others");

			var account1BalanceAfter = await tokenMeta.balanceOf(account1);
			var account1EscrowedBalanceAfter = await tokenMeta.escrowedBalance(account1);
			var totalSupplyAfter = await tokenMeta.totalSupply();

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.plus(10).toString(),
				"Account1 has incorrect balance after unescrow"
			);
			assert.equal(
				account1EscrowedBalanceAfter.toString(),
				account1EscrowedBalanceBefore.minus(10).toString(),
				"Account1 has incorrect escrowed balance after unescrow"
			);
			assert.equal(totalSupplyAfter.toString(), totalSupplyBefore.toString(), "Contract has incorrect total supply after unescrow");
		});
	});
});
