var AOToken = artifacts.require("./AOToken.sol");
var AOLibrary = artifacts.require("./AOLibrary.sol");
var BigNumber = require("bignumber.js");
BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: 1, EXPONENTIAL_AT: [-10, 40] }); // no rounding

contract("AOToken", function(accounts) {
	var tokenMeta, library;
	var developer = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var whitelistedAccount = accounts[4];
	var aoDevTeam1 = accounts[8];
	var aoDevTeam2 = accounts[9];
	var emptyAddress = "0x0000000000000000000000000000000000000000";
	var totalPrimordialForSale;
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
			lot[2] = new BigNumber(lot[2]);
			lot[3] = new BigNumber(lot[3]);
			totalWeightedTokens = totalWeightedTokens.plus(lot[2].times(lot[3]));
			totalTokens = totalTokens.plus(lot[3]);
		}
		var newWeightedMultiplier = totalWeightedTokens.div(totalTokens);
		return newWeightedMultiplier;
	};

	before(async function() {
		tokenMeta = await AOToken.deployed();
		library = await AOLibrary.deployed();
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
		it("should have total of 1125899906842620 Primordial tokens for sale", function() {
			return tokenMeta.TOTAL_PRIMORDIAL_FOR_SALE.call().then(function(primordialSupply) {
				totalPrimordialForSale = primordialSupply;
				assert.equal(totalPrimordialForSale.toNumber(), 1125899906842620, "Contract has incorrect total primordial for sale");
			});
		});
		it("should have the correct multiplier divisor", function() {
			return tokenMeta.MULTIPLIER_DIVISOR.call().then(function(divisor) {
				multiplierDivisor = new BigNumber(divisor);
				assert.equal(divisor.toNumber(), 10 ** 6, "Contract has incorrect multiplier divisor");
			});
		});
		it("should set this contract as the Network Exchange contract", function() {
			return tokenMeta.networkExchangeContract.call().then(function(isNetworkExchangeContract) {
				assert.equal(isNetworkExchangeContract, true, "Contract should be set as the Network Exchange contract");
			});
		});
		it("should have the correct percentage divisor", async function() {
			percentageDivisor = new BigNumber(await tokenMeta.PERCENTAGE_DIVISOR());
			assert.equal(percentageDivisor.toNumber(), 10 ** 6, "Contract has incorrect percentage divisor");
		});
		it("should have the correct AO Dev team 1 address", async function() {
			var aoDevTeam = await tokenMeta.aoDevTeam1();
			assert.equal(aoDevTeam, aoDevTeam1, "Contract has incorrect aoDevTeam1");
		});
		it("should have the correct AO Dev team 2 address", async function() {
			var aoDevTeam = await tokenMeta.aoDevTeam2();
			assert.equal(aoDevTeam, aoDevTeam2, "Contract has incorrect aoDevTeam2");
		});
		it("should have the correct starting multiplier for calculating primordial multiplier", async function() {
			startingMultiplier = new BigNumber(await tokenMeta.startingMultiplier());
			assert.equal(startingMultiplier.toNumber(), 50 * multiplierDivisor.toNumber(), "Contract has incorrect startingMultiplier");
		});
		it("should have the correct ending multiplier for calculating primordial multiplier", async function() {
			endingMultiplier = new BigNumber(await tokenMeta.endingMultiplier());
			assert.equal(endingMultiplier.toNumber(), 3 * multiplierDivisor.toNumber(), "Contract has incorrect endingMultiplier");
		});
		it("should have the correct starting network token bonus multiplier for calculating network token bonus amount", async function() {
			startingNetworkTokenBonusMultiplier = new BigNumber(await tokenMeta.startingNetworkTokenBonusMultiplier());
			assert.equal(
				startingNetworkTokenBonusMultiplier.toNumber(),
				1000000,
				"Contract has incorrect startingNetworkTokenBonusMultiplier"
			);
		});
		it("should have the correct ending network token bonus multiplier for calculating network token bonus amount", async function() {
			endingNetworkTokenBonusMultiplier = new BigNumber(await tokenMeta.endingNetworkTokenBonusMultiplier());
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

		it("setAODevTeamAddresses() - should update AO Dev team addresses", async function() {
			var canSet;
			try {
				await tokenMeta.setAODevTeamAddresses(account2, account3, { from: account1 });
				canSet = true;
			} catch (e) {
				canSet = false;
			}
			assert.notEqual(canSet, true, "Non-developer account can set AO Dev team addresses");

			try {
				await tokenMeta.setAODevTeamAddresses(account2, account3, { from: developer });
				canSet = true;
			} catch (e) {
				canSet = false;
			}
			assert.equal(canSet, true, "Developer account can't set AO Dev team addresses");

			var _aoDevTeam1 = await tokenMeta.aoDevTeam1();
			assert.equal(_aoDevTeam1, account2, "Contract has incorrect aoDevTeam1");

			var _aoDevTeam2 = await tokenMeta.aoDevTeam2();
			assert.equal(_aoDevTeam2, account3, "Contract has incorrect aoDevTeam2");
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
			var primordialTotalBoughtBefore = await tokenMeta.primordialTotalBought();
			var primordialTotalSupplyBefore = await tokenMeta.primordialTotalSupply();

			var accountPrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account);
			var accountNetworkBalanceBefore = await tokenMeta.balanceOf(account);
			var accountTotalLotsBefore = await tokenMeta.totalLotsByAddress(account);

			var aoDevTeam1PrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(aoDevTeam1);
			var aoDevTeam1NetworkBalanceBefore = await tokenMeta.balanceOf(aoDevTeam1);

			var aoDevTeam2PrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(aoDevTeam2);
			var aoDevTeam2NetworkBalanceBefore = await tokenMeta.balanceOf(aoDevTeam2);

			var foundationPrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(developer);
			var foundationNetworkBalanceBefore = await tokenMeta.balanceOf(developer);

			var primordialBuyPrice = await tokenMeta.primordialBuyPrice();
			var tokenAmount = new BigNumber(amount).div(primordialBuyPrice);

			if (primordialTotalBoughtBefore.plus(tokenAmount).gte(totalPrimordialForSale)) {
				tokenAmount = totalPrimordialForSale.minus(primordialTotalBoughtBefore);
			}

			var bonus = await tokenMeta.calculateMultiplierAndBonus(tokenAmount.toNumber());

			var inverseMultiplier = startingMultiplier.minus(bonus[0]);
			var foundationNetworkTokenBonusAmount = startingNetworkTokenBonusMultiplier
				.minus(bonus[1])
				.plus(endingNetworkTokenBonusMultiplier)
				.times(tokenAmount)
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

			var halfTokenAmount = new BigNumber(tokenAmount).div(2);
			var halfFoundationNetworkTokenBonusAmount = new BigNumber(foundationNetworkTokenBonusAmount).div(2);

			var accountLotId, aoDevTeam1LotId, aoDevTeam2LotId;
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
						} else if (_event.args.lotOwner == aoDevTeam1) {
							aoDevTeam1LotId = _event.args.lotId;
							assert.equal(
								_event.args.multiplier.toString(),
								inverseMultiplier.toString(),
								"aoDevTeam1 Lot Creation has incorrect multiplier"
							);
							assert.equal(
								_event.args.primordialTokenAmount.toString(),
								halfTokenAmount.toString(),
								"aoDevTeam1 Lot Creation has incorrect tokenAmount"
							);
							assert.equal(
								_event.args.networkTokenBonusAmount.toString(),
								halfFoundationNetworkTokenBonusAmount.toString(),
								"aoDevTeam1 Lot Creation has incorrect networkTokenBonusAmount"
							);
						} else if (_event.args.lotOwner == aoDevTeam2) {
							aoDevTeam2LotId = _event.args.lotId;
							assert.equal(
								_event.args.multiplier.toString(),
								inverseMultiplier.toString(),
								"aoDevTeam2 Lot Creation has incorrect multiplier"
							);
							assert.equal(
								_event.args.primordialTokenAmount.toString(),
								halfTokenAmount.toString(),
								"aoDevTeam2 Lot Creation has incorrect tokenAmount"
							);
							assert.equal(
								_event.args.networkTokenBonusAmount.toString(),
								halfFoundationNetworkTokenBonusAmount.toString(),
								"aoDevTeam2 Lot Creation has incorrect networkTokenBonusAmount"
							);
						}
						break;
					default:
						break;
				}
			}

			var totalLotsAfter = await tokenMeta.totalLots();
			var primordialTotalBoughtAfter = await tokenMeta.primordialTotalBought();
			var primordialTotalSupplyAfter = await tokenMeta.primordialTotalSupply();

			var accountPrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account);
			var accountNetworkBalanceAfter = await tokenMeta.balanceOf(account);
			var accountTotalLotsAfter = await tokenMeta.totalLotsByAddress(account);

			var aoDevTeam1PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(aoDevTeam1);
			var aoDevTeam1NetworkBalanceAfter = await tokenMeta.balanceOf(aoDevTeam1);

			var aoDevTeam2PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(aoDevTeam2);
			var aoDevTeam2NetworkBalanceAfter = await tokenMeta.balanceOf(aoDevTeam2);

			var foundationPrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(developer);
			var foundationNetworkBalanceAfter = await tokenMeta.balanceOf(developer);

			assert.equal(totalLotsAfter.toString(), totalLotsBefore.plus(3).toString(), "Contract has incorrect totalLots");
			assert.equal(
				primordialTotalBoughtAfter.toString(),
				primordialTotalBoughtBefore.plus(tokenAmount).toString(),
				"Contract has incorrect primordialTotalBought"
			);
			assert.equal(
				primordialTotalSupplyAfter.toString(),
				primordialTotalSupplyBefore
					.plus(tokenAmount)
					.plus(halfTokenAmount)
					.plus(halfTokenAmount)
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
				aoDevTeam1PrimordialBalanceAfter.toString(),
				aoDevTeam1PrimordialBalanceBefore.plus(halfTokenAmount).toString(),
				"aoDevTeam1 has incorrect primordial balance"
			);
			assert.equal(
				aoDevTeam1NetworkBalanceAfter.toString(),
				aoDevTeam1NetworkBalanceBefore.plus(halfFoundationNetworkTokenBonusAmount).toString(),
				"aoDevTeam1 has incorrect network balance"
			);

			assert.equal(
				aoDevTeam2PrimordialBalanceAfter.toString(),
				aoDevTeam2PrimordialBalanceBefore.plus(halfTokenAmount).toString(),
				"aoDevTeam2 has incorrect primordial balance"
			);
			assert.equal(
				aoDevTeam2NetworkBalanceAfter.toString(),
				aoDevTeam2NetworkBalanceBefore.plus(halfFoundationNetworkTokenBonusAmount).toString(),
				"aoDevTeam2 has incorrect network balance"
			);

			assert.equal(
				foundationPrimordialBalanceAfter.toString(),
				foundationPrimordialBalanceBefore.toString(),
				"Foundation has incorrect primordial balance"
			);
			assert.equal(
				foundationNetworkBalanceAfter.toString(),
				foundationNetworkBalanceBefore.plus(foundationNetworkTokenBonusAmount).toString(),
				"Foundation has incorrect network balance"
			);

			// Make sure the Lot is stored correctly
			var accountLot = await tokenMeta.lotById(accountLotId);
			assert.equal(accountLot[0], accountLotId, "Lot has incorrect ID");
			assert.equal(accountLot[1], account, "Lot has incorrect lot owner");
			assert.equal(accountLot[2].toString(), bonus[0].toString(), "Lot has incorrect multiplier");
			assert.equal(accountLot[3].toString(), tokenAmount.toString(), "Lot has incorrect tokenAmount");

			var aoDevTeam1Lot = await tokenMeta.lotById(aoDevTeam1LotId);
			assert.equal(aoDevTeam1Lot[0], aoDevTeam1LotId, "Lot has incorrect ID");
			assert.equal(aoDevTeam1Lot[1], aoDevTeam1, "Lot has incorrect lot owner");
			assert.equal(aoDevTeam1Lot[2].toString(), inverseMultiplier.toString(), "Lot has incorrect multiplier");
			assert.equal(aoDevTeam1Lot[3].toString(), halfTokenAmount.toString(), "Lot has incorrect tokenAmount");

			var aoDevTeam2Lot = await tokenMeta.lotById(aoDevTeam2LotId);
			assert.equal(aoDevTeam2Lot[0], aoDevTeam2LotId, "Lot has incorrect ID");
			assert.equal(aoDevTeam2Lot[1], aoDevTeam2, "Lot has incorrect lot owner");
			assert.equal(aoDevTeam2Lot[2].toString(), inverseMultiplier.toString(), "Lot has incorrect multiplier");
			assert.equal(aoDevTeam2Lot[3].toString(), halfTokenAmount.toString(), "Lot has incorrect tokenAmount");

			accountLots.push(accountLot);

			var newWeightedMultiplier = calculateWeightedMultiplier(accountLots);

			var accountWeightedMultiplier = await tokenMeta.weightedMultiplierByAddress(account);
			assert.equal(
				accountWeightedMultiplier.toString(),
				newWeightedMultiplier.toString(),
				"Account has incorrect weighted multiplier"
			);

			// Check max multiplier for the account
			// should be the same as multiplier from account's lot #1
			var maxMultiplier = await tokenMeta.maxMultiplierByAddress(account);
			assert.equal(maxMultiplier.toString(), accountLots[0][2].toString(), "Account has incorrect maxMultiplier");

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

			// reset primordial prices
			await tokenMeta.setPrimordialPrices(0, 10000, { from: developer });
		});
		it("calculateMultiplierAndBonus() - should calculate the primordial token multiplier, bonus network token percentage and the bonus network token amount on a given lot when account purchases primordial token during network exchange", async function() {
			var primordialTotalBought = await tokenMeta.primordialTotalBought();
			var startingMultiplier = await tokenMeta.startingMultiplier();
			var endingMultiplier = await tokenMeta.endingMultiplier();
			var startingNetworkTokenBonusMultiplier = await tokenMeta.startingNetworkTokenBonusMultiplier();
			var endingNetworkTokenBonusMultiplier = await tokenMeta.endingNetworkTokenBonusMultiplier();

			var purchaseAmount = 10000;
			var primordialMultiplier = await library.calculatePrimordialMultiplier(
				purchaseAmount,
				totalPrimordialForSale.toString(),
				primordialTotalBought.toString(),
				startingMultiplier.toString(),
				endingMultiplier.toString()
			);
			var bonusPercentage = await library.calculateNetworkTokenBonusPercentage(
				purchaseAmount,
				totalPrimordialForSale.toString(),
				primordialTotalBought.toString(),
				startingNetworkTokenBonusMultiplier.toString(),
				endingNetworkTokenBonusMultiplier.toString()
			);
			var bonusAmount = await library.calculateNetworkTokenBonusAmount(
				purchaseAmount,
				totalPrimordialForSale.toString(),
				primordialTotalBought.toString(),
				startingNetworkTokenBonusMultiplier.toString(),
				endingNetworkTokenBonusMultiplier.toString()
			);

			var multiplierAndBonus = await tokenMeta.calculateMultiplierAndBonus(purchaseAmount);
			assert.equal(
				multiplierAndBonus[0].toString(),
				primordialMultiplier.toString(),
				"calculateMultiplierAndBonus() returns incorrect primordial multiplier"
			);
			assert.equal(
				multiplierAndBonus[1].toString(),
				bonusPercentage.toString(),
				"calculateMultiplierAndBonus() returns incorrect bonus percentage"
			);
			assert.equal(
				multiplierAndBonus[2].toString(),
				bonusAmount.toString(),
				"calculateMultiplierAndBonus() returns incorrect bonus amount"
			);
		});
		it("buyPrimordialToken() - buy Primordial tokens from contract by sending ETH", async function() {
			var canBuy;
			try {
				await tokenMeta.buyPrimordialToken({ from: account1, value: 0 });
				canBuy = true;
			} catch (e) {
				canBuy = false;
			}
			assert.equal(canBuy, false, "Buy Primordial token succeeded even though user sent 0 ETH");
			await buyPrimordialToken(web3.toWei(2, "ether"), account1, account1Lots);
		});
		it("Should re-calculate existing `account` lots' indexes and update his/her overall weighted index", async function() {
			await buyPrimordialToken(web3.toWei(3, "ether"), account1, account1Lots);
			await buyPrimordialToken(web3.toWei(5, "ether"), account1, account1Lots);
		});
		it("should NOT allow buy Primordial if Total Primordial For Sale cap is reached (network exchange has ended)", async function() {
			var primordialTotalBought = await tokenMeta.primordialTotalBought();
			assert.isBelow(
				primordialTotalBought.toNumber(),
				totalPrimordialForSale.toNumber(),
				"Contract has incorrect primordial total bought"
			);

			var remainingAvailablePrimordialTokens = totalPrimordialForSale.minus(primordialTotalBought);
			assert.isAbove(
				remainingAvailablePrimordialTokens.toNumber(),
				0,
				"Contract should have remaining available tokens for purchase"
			);

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
			assert.equal(networkExchangeEnded, true, "Network exchange is not ended when total Primordial for sale cap is reached");

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
			assert.equal(accountLot[1], account3, "Lot has incorrect lot owner");
			assert.equal(accountLot[2].toString(), account1WeightedMultiplierAfter.toString(), "Lot has incorrect multiplier");
			assert.equal(accountLot[3].toString(), 100, "Lot has incorrect tokenAmount");

			account3Lots.push(accountLot);

			var newWeightedMultiplier = calculateWeightedMultiplier(account3Lots);
			assert.equal(
				account3WeightedMultiplierAfter.toString(),
				newWeightedMultiplier.toString(),
				"Account3 has incorrect weighted multiplier"
			);
		});
		it("maxMultiplierByAddress() - should return the max multiplier of an address (the multiplier of the first lot of the account)", async function() {
			var maxMultiplier = await tokenMeta.maxMultiplierByAddress(account1);
			assert.equal(maxMultiplier.toString(), account1Lots[0][2].toString(), "Account1 has incorrect max multiplier");

			maxMultiplier = await tokenMeta.maxMultiplierByAddress(account2);
			assert.equal(maxMultiplier.toString(), account2Lots[0][2].toString(), "Account2 has incorrect max multiplier");

			maxMultiplier = await tokenMeta.maxMultiplierByAddress(account3);
			assert.equal(maxMultiplier.toString(), account3Lots[0][2].toString(), "Account3 has incorrect max multiplier");
		});
		it("calculateMaximumBurnAmount() - should return the maximum amount of primordial an account can burn", async function() {
			var accountPrimordialBalance = await tokenMeta.primordialBalanceOf(account1);
			var accountWeightedMultiplier = await tokenMeta.weightedMultiplierByAddress(account1);
			var accountMaxMultiplier = await tokenMeta.maxMultiplierByAddress(account1);
			var _maxBurnAmount = await library.calculateMaximumBurnAmount(
				accountPrimordialBalance.toString(),
				accountWeightedMultiplier.toString(),
				accountMaxMultiplier.toString()
			);

			var maxBurnAmount = await tokenMeta.calculateMaximumBurnAmount(account1);

			assert.equal(
				maxBurnAmount.toString(),
				_maxBurnAmount.toString(),
				"calculateMaximumBurnAmount() returns incorrect max burn amount"
			);
		});
		it("calculateMultiplierAfterBurn() - should return the new multiplier after burn primordial tokens", async function() {
			var accountPrimordialBalance = await tokenMeta.primordialBalanceOf(account1);
			var accountWeightedMultiplier = await tokenMeta.weightedMultiplierByAddress(account1);
			var maxBurnAmount = await tokenMeta.calculateMaximumBurnAmount(account1);
			var accountMaxMultiplier = await tokenMeta.maxMultiplierByAddress(account1);
			var canCalculate, multiplierAfterBurn;
			try {
				multiplierAfterBurn = await tokenMeta.calculateMultiplierAfterBurn(account1, maxBurnAmount.plus(100).toString());
				canCalculate = true;
			} catch (e) {
				multiplierAfterBurn = null;
				canCalculate = false;
			}
			assert.equal(canCalculate, false, "calculateMultiplierAfterBurn() returns result even though amount to burn > max burn amount");
			var burnAmount = maxBurnAmount.minus(10);
			try {
				multiplierAfterBurn = await tokenMeta.calculateMultiplierAfterBurn(account1, burnAmount.toString());
				canCalculate = true;
			} catch (e) {
				multiplierAfterBurn = null;
				canCalculate = false;
			}
			assert.equal(canCalculate, true, "calculateMultiplierAfterBurn() failed even though amount to burn <= max burn amount");

			var _multiplierAfterBurn = await library.calculateMultiplierAfterBurn(
				accountPrimordialBalance.toString(),
				accountWeightedMultiplier.toString(),
				burnAmount.toString()
			);

			assert.equal(
				multiplierAfterBurn.toString(),
				_multiplierAfterBurn.toString(),
				"calculateMultiplierAfterBurn() returns incorrect multiplier"
			);
		});
		it("burnPrimordialToken() - should remove `_value` tokens from the system irreversibly and re-weight the multiplier", async function() {
			var maxBurnAmount = await tokenMeta.calculateMaximumBurnAmount(account1);
			var accountPrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account1);
			var accountWeightedMultiplierBefore = await tokenMeta.weightedMultiplierByAddress(account1);
			var primordialTotalSupplyBefore = await tokenMeta.primordialTotalSupply();

			var canBurn, burnLotCreationEvent, burnLotId;
			try {
				var result = await tokenMeta.burnPrimordialToken(maxBurnAmount.plus(10).toString(), { from: account1 });
				burnLotCreationEvent = result.logs[0];
				burnLotId = burnLotCreationEvent.args.burnLotId;
				canBurn = true;
			} catch (e) {
				burnLotCreationEvent = null;
				primordialBurnEvent = null;
				burnLotId = null;
				canBurn = false;
			}
			assert.equal(canBurn, false, "Account can burn more than maximum burn amount");

			var burnAmount = new BigNumber(5);
			var multiplierAfterBurn = await tokenMeta.calculateMultiplierAfterBurn(account1, burnAmount.toString());
			try {
				var result = await tokenMeta.burnPrimordialToken(burnAmount.toString(), { from: account1 });
				burnLotCreationEvent = result.logs[0];
				burnLotId = burnLotCreationEvent.args.burnLotId;
				canBurn = true;
			} catch (e) {
				burnLotCreationEvent = null;
				primordialBurnEvent = null;
				burnLotId = null;
				canBurn = false;
			}
			assert.equal(canBurn, true, "Account can't burn primordial token");

			var accountPrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account1);
			var accountWeightedMultiplierAfter = await tokenMeta.weightedMultiplierByAddress(account1);
			var primordialTotalSupplyAfter = await tokenMeta.primordialTotalSupply();

			assert.equal(
				accountPrimordialBalanceAfter.toString(),
				accountPrimordialBalanceBefore.minus(burnAmount).toString(),
				"Account has incorrect primordial balance after burn"
			);
			assert.equal(
				accountWeightedMultiplierAfter.toString(),
				multiplierAfterBurn.toString(),
				"Account has incorrect weighted multiplier after burn"
			);
			assert.isAtLeast(
				accountWeightedMultiplierAfter.toNumber(),
				accountWeightedMultiplierBefore.toNumber(),
				"New weighted multiplier should be greater than or equal to previous weighted multiplier"
			);
			assert.equal(
				primordialTotalSupplyAfter.toString(),
				primordialTotalSupplyBefore.minus(burnAmount).toString(),
				"Contract has incorrect primordialTotalSupply after burn"
			);

			var burnLot = await tokenMeta.burnLotById(burnLotId);
			assert.equal(burnLot[0], burnLotId, "Burn Lot has incorrect burnLotId");
			assert.equal(burnLot[1], account1, "Burn Lot has incorrect burn lotOwner");
			assert.equal(burnLot[2], burnAmount.toString(), "Burn Lot has incorrect tokenAmount");
		});
		it("approvePrimordialToken() - should set Primordial allowance for other address", async function() {
			var account3PrimordialAllowance = await tokenMeta.primordialAllowance(account1, account3);
			assert.equal(account3PrimordialAllowance.toNumber(), 0, "Account3 has incorrect Primordial allowance before approve");
			await tokenMeta.approvePrimordialToken(account3, 20, { from: account1 });
			account3PrimordialAllowance = await tokenMeta.primordialAllowance(account1, account3);
			assert.equal(account3PrimordialAllowance.toNumber(), 20, "Account3 has incorrect Primordial allowance after approve");
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
			assert.equal(accountLot[1], account3, "Lot has incorrect lot owner");
			assert.equal(accountLot[2].toString(), account1WeightedMultiplierAfter.toString(), "Lot has incorrect multiplier");
			assert.equal(accountLot[3].toString(), 10, "Lot has incorrect tokenAmount");

			account3Lots.push(accountLot);

			var newWeightedMultiplier = calculateWeightedMultiplier(account3Lots);
			assert.equal(
				account3WeightedMultiplierAfter.toString(),
				newWeightedMultiplier.toString(),
				"Account3 has incorrect weighted multiplier"
			);
		});
		it("burnPrimordialTokenFrom() - should remove `_value` Primordial tokens from the system irreversibly on behalf of `_from` and re-weight multiplier", async function() {
			var maxBurnAmount = await tokenMeta.calculateMaximumBurnAmount(account1);
			var accountPrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account1);
			var accountWeightedMultiplierBefore = await tokenMeta.weightedMultiplierByAddress(account1);
			var primordialTotalSupplyBefore = await tokenMeta.primordialTotalSupply();
			var account3PrimordialAllowanceBefore = await tokenMeta.primordialAllowance(account1, account3);

			var canBurn, burnLotCreationEvent, burnLotId;
			try {
				var result = await tokenMeta.burnPrimordialTokenFrom(account1, maxBurnAmount.plus(10).toString(), { from: account3 });
				burnLotCreationEvent = result.logs[0];
				burnLotId = burnLotCreationEvent.args.burnLotId;
				canBurn = true;
			} catch (e) {
				burnLotCreationEvent = null;
				primordialBurnEvent = null;
				burnLotId = null;
				canBurn = false;
			}
			assert.equal(canBurn, false, "Account can burn more than maximum burn amount");

			var burnAmount = new BigNumber(10);
			var multiplierAfterBurn = await tokenMeta.calculateMultiplierAfterBurn(account1, burnAmount.toString());
			try {
				var result = await tokenMeta.burnPrimordialTokenFrom(account1, burnAmount.toString(), { from: account3 });
				burnLotCreationEvent = result.logs[0];
				burnLotId = burnLotCreationEvent.args.burnLotId;
				canBurn = true;
			} catch (e) {
				burnLotCreationEvent = null;
				primordialBurnEvent = null;
				burnLotId = null;
				canBurn = false;
			}
			assert.equal(canBurn, true, "Account can't burn primordial token");

			var accountPrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account1);
			var accountWeightedMultiplierAfter = await tokenMeta.weightedMultiplierByAddress(account1);
			var primordialTotalSupplyAfter = await tokenMeta.primordialTotalSupply();
			var account3PrimordialAllowanceAfter = await tokenMeta.primordialAllowance(account1, account3);

			assert.equal(
				accountPrimordialBalanceAfter.toString(),
				accountPrimordialBalanceBefore.minus(burnAmount).toString(),
				"Account has incorrect primordial balance after burn"
			);
			assert.equal(
				accountWeightedMultiplierAfter.toString(),
				multiplierAfterBurn.toString(),
				"Account has incorrect weighted multiplier after burn"
			);
			assert.isAtLeast(
				accountWeightedMultiplierAfter.toNumber(),
				accountWeightedMultiplierBefore.toNumber(),
				"New weighted multiplier should be greater than or equal to previous weighted multiplier"
			);
			assert.equal(
				primordialTotalSupplyAfter.toString(),
				primordialTotalSupplyBefore.minus(burnAmount).toString(),
				"Contract has incorrect primordialTotalSupply after burn"
			);
			assert.equal(
				account3PrimordialAllowanceAfter.toString(),
				account3PrimordialAllowanceBefore.minus(burnAmount).toString(),
				"Account3 has incorrect primordial allowance after burn"
			);

			var burnLot = await tokenMeta.burnLotById(burnLotId);
			assert.equal(burnLot[0], burnLotId, "Burn Lot has incorrect burnLotId");
			assert.equal(burnLot[1], account1, "Burn Lot has incorrect burn lotOwner");
			assert.equal(burnLot[2], burnAmount.toString(), "Burn Lot has incorrect tokenAmount");
		});
		it("calculateMultiplierAfterConversion() - should return the new multiplier after converting network token to primordial tokens", async function() {
			var accountPrimordialBalance = await tokenMeta.primordialBalanceOf(account1);
			var accountWeightedMultiplier = await tokenMeta.weightedMultiplierByAddress(account1);
			var convertAmount = new BigNumber(100);
			var multiplierAfterConversion = await tokenMeta.calculateMultiplierAfterConversion(account1, convertAmount.toString());

			var _multiplierAfterConversion = await library.calculateMultiplierAfterConversion(
				accountPrimordialBalance.toString(),
				accountWeightedMultiplier.toString(),
				convertAmount.toString()
			);

			assert.equal(
				multiplierAfterConversion.toString(),
				_multiplierAfterConversion.toString(),
				"calculateMultiplierAfterConversion() returns incorrect multiplier"
			);
		});
		it("convertToPrimordial() - should convert network token to primordial tokens and re-weight multiplier", async function() {
			var accountNetworkBalanceBefore = await tokenMeta.balanceOf(account1);
			var accountPrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account1);
			var accountWeightedMultiplierBefore = await tokenMeta.weightedMultiplierByAddress(account1);
			var networkTotalSupplyBefore = await tokenMeta.totalSupply();
			var primordialTotalSupplyBefore = await tokenMeta.primordialTotalSupply();

			var canConvert, convertLotId;
			try {
				var result = await tokenMeta.convertToPrimordial(10 ** 30, { from: account1 });
				for (var i = 0; i < result.logs.length; i++) {
					var log = result.logs[i];
					if (log.event == "ConvertLotCreation") {
						convertLotId = log.args.convertLotId;
						break;
					}
				}
				canConvert = true;
			} catch (e) {
				convertLotId = null;
				canConvert = false;
			}
			assert.equal(canConvert, false, "Account can convert more network tokens than available balance");

			var convertAmount = new BigNumber(500);
			var multiplierAfterConversion = await tokenMeta.calculateMultiplierAfterConversion(account1, convertAmount.toString());
			try {
				var result = await tokenMeta.convertToPrimordial(convertAmount.toString(), { from: account1 });
				for (var i = 0; i < result.logs.length; i++) {
					var log = result.logs[i];
					if (log.event == "ConvertLotCreation") {
						convertLotId = log.args.convertLotId;
						break;
					}
				}
				canConvert = true;
			} catch (e) {
				convertLotId = null;
				canConvert = false;
			}
			assert.equal(canConvert, true, "Account can't convert network tokens to primordial tokens");

			var accountNetworkBalanceAfter = await tokenMeta.balanceOf(account1);
			var accountPrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account1);
			var accountWeightedMultiplierAfter = await tokenMeta.weightedMultiplierByAddress(account1);
			var networkTotalSupplyAfter = await tokenMeta.totalSupply();
			var primordialTotalSupplyAfter = await tokenMeta.primordialTotalSupply();

			assert.equal(
				accountNetworkBalanceAfter.toString(),
				accountNetworkBalanceBefore.minus(convertAmount).toString(),
				"Account has incorrect network balance after conversion"
			);
			assert.equal(
				accountPrimordialBalanceAfter.toString(),
				accountPrimordialBalanceBefore.plus(convertAmount).toString(),
				"Account has incorrect primordial balance after conversion"
			);
			assert.equal(
				accountWeightedMultiplierAfter.toString(),
				multiplierAfterConversion.toString(),
				"Account has incorrect multiplier after conversion"
			);
			assert.isAtMost(
				accountWeightedMultiplierAfter.toNumber(),
				accountWeightedMultiplierBefore.toNumber(),
				"New multiplier should be less than or equal to previous multiplier after conversion"
			);
			assert.equal(
				networkTotalSupplyAfter.toString(),
				networkTotalSupplyBefore.minus(convertAmount).toString(),
				"Contract has incorrect network total supply after conversion"
			);
			assert.equal(
				primordialTotalSupplyAfter.toString(),
				primordialTotalSupplyBefore.plus(convertAmount).toString(),
				"Contract has incorrect primordial total supply after conversion"
			);

			var convertLot = await tokenMeta.convertLotById(convertLotId);
			assert.equal(convertLot[0], convertLotId, "Convert Lot has incorrect convertLotId");
			assert.equal(convertLot[1], account1, "Convert Lot has incorrect convert lotOwner");
			assert.equal(convertLot[2], convertAmount.toString(), "Convert Lot has incorrect tokenAmount");
		});
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
			assert.equal(lot[1], account1Lots[0][1], "lotById() return incorrect lot owner");
			assert.equal(lot[1].toString(), account1Lots[0][1].toString(), "lotById() return incorrect multiplier");
			assert.equal(lot[2].toString(), account1Lots[0][2].toString(), "lotById() return incorrect token amount");
		});
	});
	contract("Token Combination Function Tests", function() {
		before(async function() {
			await tokenMeta.mintToken(account1, 1000, { from: developer });
			await tokenMeta.buyPrimordialToken({ from: account1, value: web3.toWei(2, "ether") });
			await tokenMeta.buyPrimordialToken({ from: account1, value: web3.toWei(5, "ether") });
			await tokenMeta.buyPrimordialToken({ from: account1, value: web3.toWei(3, "ether") });
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
		it("burnTokens() - should remove `_value` network tokens and `_primordialValue` Primordial tokens from the system irreversibly and re-weight multiplier", async function() {
			var maxBurnAmount = await tokenMeta.calculateMaximumBurnAmount(account1);
			var accountNetworkBalanceBefore = await tokenMeta.balanceOf(account1);
			var accountPrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account1);
			var accountWeightedMultiplierBefore = await tokenMeta.weightedMultiplierByAddress(account1);
			var networkTotalSupplyBefore = await tokenMeta.totalSupply();
			var primordialTotalSupplyBefore = await tokenMeta.primordialTotalSupply();

			var canBurn, burnLotId;
			try {
				var result = await tokenMeta.burnTokens(accountNetworkBalanceBefore.plus(10).toString(), 2, { from: account1 });
				for (var i = 0; i < result.logs.length; i++) {
					var log = result.logs[i];
					if (log.event == "BurnLotCreation") {
						burnLotId = log.args.burnLotId;
						break;
					}
				}
				canBurn = true;
			} catch (e) {
				burnLotId = null;
				canBurn = false;
			}
			assert.equal(canBurn, false, "Account can burn more than maximum network balance");

			try {
				var result = await tokenMeta.burnTokens(2, maxBurnAmount.plus(10).toString(), { from: account1 });
				for (var i = 0; i < result.logs.length; i++) {
					var log = result.logs[i];
					if (log.event == "BurnLotCreation") {
						burnLotId = log.args.burnLotId;
						break;
					}
				}
				canBurn = true;
			} catch (e) {
				burnLotId = null;
				canBurn = false;
			}
			assert.equal(canBurn, false, "Account can burn more than maximum burn amount");

			var burnAmount = new BigNumber(5);
			var multiplierAfterBurn = await tokenMeta.calculateMultiplierAfterBurn(account1, burnAmount.toString());
			try {
				var result = await tokenMeta.burnTokens(burnAmount.toString(), burnAmount.toString(), { from: account1 });
				for (var i = 0; i < result.logs.length; i++) {
					var log = result.logs[i];
					if (log.event == "BurnLotCreation") {
						burnLotId = log.args.burnLotId;
						break;
					}
				}
				canBurn = true;
			} catch (e) {
				burnLotId = null;
				canBurn = false;
			}
			assert.equal(canBurn, true, "Account can't burn network and primordial token");

			var accountNetworkBalanceAfter = await tokenMeta.balanceOf(account1);
			var accountPrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account1);
			var accountWeightedMultiplierAfter = await tokenMeta.weightedMultiplierByAddress(account1);
			var networkTotalSupplyAfter = await tokenMeta.totalSupply();
			var primordialTotalSupplyAfter = await tokenMeta.primordialTotalSupply();

			assert.equal(
				accountNetworkBalanceAfter.toString(),
				accountNetworkBalanceBefore.minus(burnAmount).toString(),
				"Account has incorrect network balance after burn"
			);
			assert.equal(
				accountPrimordialBalanceAfter.toString(),
				accountPrimordialBalanceBefore.minus(burnAmount).toString(),
				"Account has incorrect primordial balance after burn"
			);
			assert.equal(
				accountWeightedMultiplierAfter.toString(),
				multiplierAfterBurn.toString(),
				"Account has incorrect weighted multiplier after burn"
			);
			assert.isAtLeast(
				accountWeightedMultiplierAfter.toNumber(),
				accountWeightedMultiplierBefore.toNumber(),
				"New weighted multiplier should be greater than or equal to previous weighted multiplier"
			);
			assert.equal(
				networkTotalSupplyAfter.toString(),
				networkTotalSupplyBefore.minus(burnAmount).toString(),
				"Contract has incorrect networkTotalSupply after burn"
			);
			assert.equal(
				primordialTotalSupplyAfter.toString(),
				primordialTotalSupplyBefore.minus(burnAmount).toString(),
				"Contract has incorrect primordialTotalSupply after burn"
			);

			var burnLot = await tokenMeta.burnLotById(burnLotId);
			assert.equal(burnLot[0], burnLotId, "Burn Lot has incorrect burnLotId");
			assert.equal(burnLot[1], account1, "Burn Lot has incorrect burn lotOwner");
			assert.equal(burnLot[2], burnAmount.toString(), "Burn Lot has incorrect tokenAmount");
		});
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
		it("burnTokensFrom() - should remove `_value` network tokens and `_primordialValue` Primordial Tokens from the system irreversibly on behalf of `_from` and re-weight multiplier", async function() {
			var maxBurnAmount = await tokenMeta.calculateMaximumBurnAmount(account1);
			var accountNetworkBalanceBefore = await tokenMeta.balanceOf(account1);
			var accountPrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account1);
			var accountWeightedMultiplierBefore = await tokenMeta.weightedMultiplierByAddress(account1);
			var networkTotalSupplyBefore = await tokenMeta.totalSupply();
			var primordialTotalSupplyBefore = await tokenMeta.primordialTotalSupply();
			var account2NetworkAllowanceBefore = await tokenMeta.allowance(account1, account2);
			var account2PrimordialAllowanceBefore = await tokenMeta.primordialAllowance(account1, account2);

			var canBurn, burnLotId;
			try {
				var result = await tokenMeta.burnTokensFrom(account1, account2NetworkAllowanceBefore.plus(10).toString(), 2, {
					from: account2
				});
				for (var i = 0; i < result.logs.length; i++) {
					var log = result.logs[i];
					if (log.event == "BurnLotCreation") {
						burnLotId = log.args.burnLotId;
						break;
					}
				}
				canBurn = true;
			} catch (e) {
				burnLotId = null;
				canBurn = false;
			}
			assert.equal(canBurn, false, "Account can burn more than network allowance");

			try {
				var result = await tokenMeta.burnTokensFrom(account1, 2, account2PrimordialAllowanceBefore.plus(10).toString(), {
					from: account2
				});

				var result = await tokenMeta.burnTokens(2, maxBurnAmount.plus(10).toString(), { from: account1 });
				for (var i = 0; i < result.logs.length; i++) {
					var log = result.logs[i];
					if (log.event == "BurnLotCreation") {
						burnLotId = log.args.burnLotId;
						break;
					}
				}
				canBurn = true;
			} catch (e) {
				burnLotId = null;
				canBurn = false;
			}
			assert.equal(canBurn, false, "Account can burn more than primordial allowance");

			var burnAmount = new BigNumber(5);
			var multiplierAfterBurn = await tokenMeta.calculateMultiplierAfterBurn(account1, burnAmount.toString());
			try {
				var result = await tokenMeta.burnTokensFrom(account1, burnAmount.toString(), burnAmount.toString(), { from: account2 });
				for (var i = 0; i < result.logs.length; i++) {
					var log = result.logs[i];
					if (log.event == "BurnLotCreation") {
						burnLotId = log.args.burnLotId;
						break;
					}
				}
				canBurn = true;
			} catch (e) {
				burnLotId = null;
				canBurn = false;
			}
			assert.equal(canBurn, true, "Account can't burn network and primordial token");

			var accountNetworkBalanceAfter = await tokenMeta.balanceOf(account1);
			var accountPrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account1);
			var accountWeightedMultiplierAfter = await tokenMeta.weightedMultiplierByAddress(account1);
			var networkTotalSupplyAfter = await tokenMeta.totalSupply();
			var primordialTotalSupplyAfter = await tokenMeta.primordialTotalSupply();
			var account2NetworkAllowanceAfter = await tokenMeta.allowance(account1, account2);
			var account2PrimordialAllowanceAfter = await tokenMeta.primordialAllowance(account1, account2);

			assert.equal(
				accountNetworkBalanceAfter.toString(),
				accountNetworkBalanceBefore.minus(burnAmount).toString(),
				"Account has incorrect network balance after burn"
			);
			assert.equal(
				accountPrimordialBalanceAfter.toString(),
				accountPrimordialBalanceBefore.minus(burnAmount).toString(),
				"Account has incorrect primordial balance after burn"
			);
			assert.equal(
				accountWeightedMultiplierAfter.toString(),
				multiplierAfterBurn.toString(),
				"Account has incorrect weighted multiplier after burn"
			);
			assert.isAtLeast(
				accountWeightedMultiplierAfter.toNumber(),
				accountWeightedMultiplierBefore.toNumber(),
				"New weighted multiplier should be greater than or equal to previous weighted multiplier"
			);
			assert.equal(
				networkTotalSupplyAfter.toString(),
				networkTotalSupplyBefore.minus(burnAmount).toString(),
				"Contract has incorrect networkTotalSupply after burn"
			);
			assert.equal(
				primordialTotalSupplyAfter.toString(),
				primordialTotalSupplyBefore.minus(burnAmount).toString(),
				"Contract has incorrect primordialTotalSupply after burn"
			);
			assert.equal(
				account2NetworkAllowanceAfter.toString(),
				account2NetworkAllowanceBefore.minus(burnAmount).toString(),
				"Account has incorrect network allowance after burn"
			);
			assert.equal(
				account2PrimordialAllowanceAfter.toString(),
				account2PrimordialAllowanceBefore.minus(burnAmount).toString(),
				"Account has incorrect primordial allowance after burn"
			);

			var burnLot = await tokenMeta.burnLotById(burnLotId);
			assert.equal(burnLot[0], burnLotId, "Burn Lot has incorrect burnLotId");
			assert.equal(burnLot[1], account1, "Burn Lot has incorrect burn lotOwner");
			assert.equal(burnLot[2], burnAmount.toString(), "Burn Lot has incorrect tokenAmount");
		});
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
