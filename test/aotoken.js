var AOToken = artifacts.require("./AOToken.sol");

contract("AOToken", function(accounts) {
	var tokenMeta;
	var developer = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var whitelistedAccount = accounts[4];
	var maxPrimordialSupply;
	var primordialReservedForFoundation;
	var weightedIndexDivisor;
	var account1Lots = [];
	var account2Lots = [];
	var account3Lots = [];
	var lot1;
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
			return tokenMeta.MAX_Primordial_SUPPLY.call().then(function(primordialSupply) {
				maxPrimordialSupply = primordialSupply;
				assert.equal(maxPrimordialSupply.toNumber(), 1125899906842620, "Contract has incorrect max primordial supply amount");
			});
		});
		it("should set aside 125899906842620 Primordial tokens reserved for Foundation", function() {
			return tokenMeta.Primordial_RESERVED_FOR_FOUNDATION.call().then(function(reservedTokens) {
				primordialReservedForFoundation = reservedTokens;
				assert.equal(
					primordialReservedForFoundation.toNumber(),
					125899906842620,
					"Contract has incorrect reserved amount for Foundation"
				);
			});
		});
		it("should have the correct weighted index divisor", function() {
			return tokenMeta.WEIGHTED_INDEX_DIVISOR.call().then(function(divisor) {
				weightedIndexDivisor = divisor;
				assert.equal(divisor.toNumber(), 10 ** 6, "Contract has incorrect weighted index divisor");
			});
		});
		it("should set this contract as the Network Exchange contract", function() {
			return tokenMeta.networkExchangeContract.call().then(function(isNetworkExchangeContract) {
				assert.equal(isNetworkExchangeContract, true, "Contract should be set as the Network Exchange contract");
			});
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
			assert.notEqual(canSetPrices, true, "Others can set ERC20 token prices");
			try {
				await tokenMeta.setPrices(2, 2, { from: developer });
				canSetPrices = true;
			} catch (e) {
				canSetPrices = false;
			}
			assert.equal(canSetPrices, true, "Developer can't set ERC20 token prices");
			var sellPrice = await tokenMeta.sellPrice();
			var buyPrice = await tokenMeta.buyPrice();
			assert.equal(sellPrice.toNumber(), 2, "Incorrect sell price");
			assert.equal(buyPrice.toNumber(), 2, "Incorrect buy price");
		});
		it("user can buy ERC20 tokens", async function() {
			var canBuyToken;
			try {
				await tokenMeta.buy({ from: account2, value: 10 });
				canBuyToken = true;
			} catch (e) {
				canBuyToken = false;
			}
			assert.notEqual(canBuyToken, true, "Contract does not have enough ERC20 token balance to complete user's token purchase");
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
			assert.equal(canBuyToken, true, "Fail buying ERC20 token from contract");
			assert.equal(account2Balance.toNumber(), 20, "Account has incorrect balance after buying token");
		});
		it("user can sell ERC20 tokens to contract", async function() {
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
			assert.equal(canSellToken, true, "Fail selling ERC20 token to contract");
			assert.equal(account2Balance.toNumber(), 15, "Account has incorrect balance after selling token");
			assert.equal(contractBalance.toNumber(), 1000, "Contract has incorrect balance after user sell token");
		});
	});
	contract("Primordial Token Function Tests", function() {
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
				developerPrimordialBalance.toNumber(),
				primordialReservedForFoundation.toNumber(),
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
				primordialReservedForFoundation.toNumber(),
				"Contract has incorrect Primordial total supply after reserve for Foundation transaction"
			);
			var developerLot = await tokenMeta.lotOfOwnerByIndex(developer, 0);
			assert.equal(developerLot[1].toNumber(), 1 * weightedIndexDivisor.toNumber(), "Developer lot has incorrect global lot index");
			assert.equal(
				developerLot[2].toNumber(),
				primordialReservedForFoundation.toNumber(),
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
		it("buyPrimordialToken() - buy Primordial tokens from contract by sending ETH", async function() {
			var account1PrimordialBalance = await tokenMeta.primordialBalanceOf(account1);
			assert.equal(account1PrimordialBalance.toNumber(), 0, "Account1 has incorrect Primordial tokens balance before buy");

			var totalLots = await tokenMeta.totalLots();
			var lotIndex = await tokenMeta.lotIndex();
			var account1PrimordialBalance = await tokenMeta.primordialBalanceOf(account1);
			var account1TotalLots = await tokenMeta.totalLotsByAddress(account1);
			var account1WeightedIndex = await tokenMeta.weightedIndexByAddress(account1);
			var primordialTotalSupply = await tokenMeta.primordialTotalSupply();
			assert.equal(totalLots.toNumber(), 1, "Total lots is incorrect before user buy Primordial transaction");
			assert.equal(lotIndex.toNumber(), 1, "Lot index is incorrect before user buy Primordial transaction");
			assert.equal(
				account1PrimordialBalance.toNumber(),
				0,
				"Account1 has incorrect Primordial balance before buy Primordial transaction"
			);
			assert.equal(account1TotalLots.toNumber(), 0, "Account1 has incorrect total lots amount before buy Primordial transaction");
			assert.equal(account1WeightedIndex.toNumber(), 0, "Account1 has incorrect weighted index before buy Primordial transaction");
			assert.equal(
				primordialTotalSupply.toNumber(),
				primordialReservedForFoundation.toNumber(),
				"Contract has incorrect Primordial total supply before user buy Primordial transaction"
			);

			var buySuccess;
			try {
				await tokenMeta.buyPrimordialToken({ from: account1, value: 0 });
				buySuccess = true;
			} catch (e) {
				buySuccess = false;
			}
			assert.equal(buySuccess, false, "Buy Primordial token succeeded even though user sent 0 ETH");
			try {
				await tokenMeta.buyPrimordialToken({ from: account1, value: 10000 });
				buySuccess = true;
			} catch (e) {
				buySuccess = false;
			}
			assert.equal(buySuccess, true, "Unable to buy Primordial token even though user sent some ETH");

			totalLots = await tokenMeta.totalLots();
			lotIndex = await tokenMeta.lotIndex();
			account1PrimordialBalance = await tokenMeta.primordialBalanceOf(account1);
			account1TotalLots = await tokenMeta.totalLotsByAddress(account1);
			account1WeightedIndex = await tokenMeta.weightedIndexByAddress(account1);
			primordialTotalSupply = await tokenMeta.primordialTotalSupply();
			assert.equal(totalLots.toNumber(), 2, "Total lots is incorrect after user buy Primordial transaction");
			assert.equal(lotIndex.toNumber(), 2, "Lot index is incorrect after user buy Primordial transaction");
			assert.equal(
				account1PrimordialBalance.toNumber(),
				100,
				"Account1 has incorrect Primordial balance after buy Primordial transaction"
			);
			assert.equal(account1TotalLots.toNumber(), 1, "Account1 has incorrect total lots amount after buy Primordial transaction");
			assert.equal(
				account1WeightedIndex.toNumber(),
				2 * weightedIndexDivisor.toNumber(),
				"Account2 has incorrect weighted index before buy Primordial transaction"
			);
			assert.equal(
				primordialTotalSupply.toNumber(),
				primordialReservedForFoundation.toNumber() + account1PrimordialBalance.toNumber(),
				"Contract has incorrect Primordial total supply after user buy Primordial transaction"
			);
			var account1Lot1 = await tokenMeta.lotOfOwnerByIndex(account1, 0);
			lot1 = account1Lot1;
			account1Lots.push(account1Lot1[0]);
			assert.equal(account1Lot1[1].toNumber(), 2 * weightedIndexDivisor.toNumber(), "Account1 lot has incorrect global lot index");
			assert.equal(account1Lot1[2].toNumber(), 100, "Account1 lot has incorrect Primordial token amount");
		});
		it("Should re-calculate existing `account` lots' indexes and update his/her overall weighted index", async function() {
			var account1Lot1 = await tokenMeta.lotOfOwnerByIndex(account1, 0);
			assert.equal(account1Lot1[1].toNumber(), 2 * weightedIndexDivisor.toNumber(), "Account1 lot #1 has incorrect global lot index");
			assert.equal(account1Lot1[2].toNumber(), 100, "Account1 lot #1 has incorrect Primordial token amount");
			var account1WeightedIndex = await tokenMeta.weightedIndexByAddress(account1);
			var account1PrimordialBalance = await tokenMeta.primordialBalanceOf(account1);

			assert.equal(account1WeightedIndex.toNumber(), account1Lot1[1].toNumber(), "Account1 has incorrect weighted index");
			assert.equal(account1PrimordialBalance.toNumber(), account1Lot1[2].toNumber(), "Account1 has incorrect Primordial balance");

			var buySuccess;
			try {
				await tokenMeta.buyPrimordialToken({ from: account1, value: 1000000 });
				buySuccess = true;
			} catch (e) {
				buySuccess = false;
			}
			assert.equal(buySuccess, true, "Unable to buy Primordial token even though user sent some ETH");
			var account1Lot2 = await tokenMeta.lotOfOwnerByIndex(account1, 1);
			account1Lots.push(account1Lot2[0]);
			assert.equal(account1Lot2[1].toNumber(), 3 * weightedIndexDivisor.toNumber(), "Account1 lot #2 has incorrect global lot index");
			assert.equal(account1Lot2[2].toNumber(), 10000, "Account1 lot #2 has incorrect Primordial token amount");

			// Calculate weighted index
			var totalWeightedTokens = account1Lot1[1].mul(account1Lot1[2]).add(account1Lot2[1].mul(account1Lot2[2]));
			var totalTokens = account1Lot1[2].add(account1Lot2[2]);
			var newWeightedIndex = parseInt(totalWeightedTokens.div(totalTokens).toNumber());

			account1WeightedIndex = await tokenMeta.weightedIndexByAddress(account1);
			account1PrimordialBalance = await tokenMeta.primordialBalanceOf(account1);

			assert.equal(account1WeightedIndex.toNumber(), newWeightedIndex, "Account1 has incorrect weighted index");
			assert.equal(account1PrimordialBalance.toNumber(), totalTokens.toNumber(), "Account1 has incorrect Primordial balance");

			try {
				await tokenMeta.buyPrimordialToken({ from: account1, value: 800000 });
				buySuccess = true;
			} catch (e) {
				buySuccess = false;
			}
			assert.equal(buySuccess, true, "Unable to buy Primordial token even though user sent some ETH");
			var account1Lot3 = await tokenMeta.lotOfOwnerByIndex(account1, 2);
			account1Lots.push(account1Lot3[0]);
			assert.equal(account1Lot3[1].toNumber(), 4 * weightedIndexDivisor.toNumber(), "Account1 lot #3 has incorrect global lot index");
			assert.equal(account1Lot3[2].toNumber(), 8000, "Account1 lot #3 has incorrect Primordial token amount");

			account1WeightedIndex = await tokenMeta.weightedIndexByAddress(account1);
			account1PrimordialBalance = await tokenMeta.primordialBalanceOf(account1);

			// Calculate weighted index
			totalWeightedTokens = totalTokens.mul(newWeightedIndex).add(account1Lot3[1].mul(account1Lot3[2]));
			totalTokens = totalTokens.add(account1Lot3[2]);
			newWeightedIndex = parseInt(totalWeightedTokens.div(totalTokens).toNumber());

			assert.equal(account1WeightedIndex.toNumber(), newWeightedIndex, "Account1 has incorrect weighted index");
			assert.equal(account1PrimordialBalance.toNumber(), totalTokens.toNumber(), "Account1 has incorrect Primordial balance");

			// Calculate weighted index from lot 1-3
			totalWeightedTokens = account1Lot1[1]
				.mul(account1Lot1[2])
				.add(account1Lot2[1].mul(account1Lot2[2]))
				.add(account1Lot3[1].mul(account1Lot3[2]));
			totalTokens = account1Lot1[2].add(account1Lot2[2]).add(account1Lot3[2]);
			newWeightedIndex = parseInt(totalWeightedTokens.div(totalTokens).toNumber());
			assert.equal(account1WeightedIndex.toNumber(), newWeightedIndex, "Account1 has incorrect weighted index");
			assert.equal(account1PrimordialBalance.toNumber(), totalTokens.toNumber(), "Account1 has incorrect Primordial balance");
		});
		it("should NOT allow buy Primordial if max Primordial cap is reached (network exchange has ended)", async function() {
			var primordialTotalSupply = await tokenMeta.primordialTotalSupply();
			var remainingAvailablePrimordialTokens = maxPrimordialSupply.toNumber() - primordialTotalSupply.toNumber();
			assert.isAbove(remainingAvailablePrimordialTokens, 0, "Contract has incorrect Primordial total supply amount");

			var networkExchangeEnded = await tokenMeta.networkExchangeEnded();
			assert.equal(networkExchangeEnded, false, "Network exchange is ended before max supply is reached");

			var buySuccess;
			try {
				// Sending more ETH than we should to check whether or not the user receives the remainder ETH
				await tokenMeta.buyPrimordialToken({ from: account2, value: web3.toWei(900, "ether") });
				buySuccess = true;
			} catch (e) {
				buySuccess = false;
			}
			assert.equal(buySuccess, true, "Unable to buy Primordial token even though user sent some ETH");

			var account2Lot1 = await tokenMeta.lotOfOwnerByIndex(account2, 0);
			account2Lots.push(account2Lot1[0]);

			var account2PrimordialBalance = await tokenMeta.primordialBalanceOf(account2);
			assert.equal(
				account2PrimordialBalance.toNumber(),
				remainingAvailablePrimordialTokens,
				"Account2 has incorrect Primordial balance after buy Primordial transaction"
			);

			// If user does not receive the remainder ETH, his/her ETH balance will not have more than 800 ETH
			var account2EthBalance = web3.eth.getBalance(account2);
			assert.isAbove(
				account2EthBalance.toNumber(),
				parseInt(web3.toWei(800, "ether")),
				"Account2 does not receive the remainder surplus ETH after buy Primordial transaction"
			);

			networkExchangeEnded = await tokenMeta.networkExchangeEnded();
			assert.equal(networkExchangeEnded, true, "Network exchange is not ended when Primordial max supply is reached");

			try {
				await tokenMeta.buyPrimordialToken({ from: account2, value: web3.toWei(5, "ether") });
				buySuccess = true;
			} catch (e) {
				buySuccess = false;
			}
			assert.equal(buySuccess, false, "Buy Primordial token succeeded even though Network exchange has ended");
		});
		it("transferPrimordialToken() - should send correct `_value` to `_to` from your account", async function() {
			var account1PrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account1);
			var account3PrimordialBalance = await tokenMeta.primordialBalanceOf(account3);
			var account1WeightedIndexBefore = await tokenMeta.weightedIndexByAddress(account1);
			var account3WeightedIndex = await tokenMeta.weightedIndexByAddress(account3);
			assert.equal(account3PrimordialBalance.toNumber(), 0, "Account3 has incorrect Primordial balance before transfer");
			assert.equal(account3WeightedIndex.toNumber(), 0, "Account3 has incorrect weighted index before transfer");

			var totalLotsBefore = await tokenMeta.totalLots();
			var lotIndexBefore = await tokenMeta.lotIndex();
			var primordialTotalSupplyBefore = await tokenMeta.primordialTotalSupply();

			await tokenMeta.transferPrimordialToken(account3, 100, { from: account1 });

			var account3Lot1 = await tokenMeta.lotOfOwnerByIndex(account3, 0);
			account3Lots.push(account3Lot1[0]);

			var account1PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account1);
			account3PrimordialBalance = await tokenMeta.primordialBalanceOf(account3);
			var account1WeightedIndexAfter = await tokenMeta.weightedIndexByAddress(account1);
			account3WeightedIndex = await tokenMeta.weightedIndexByAddress(account3);
			assert.equal(
				account1PrimordialBalanceAfter.toNumber(),
				account1PrimordialBalanceBefore.toNumber() - 100,
				"Account1 has incorrect Primordial balance after transfer"
			);
			assert.equal(account3PrimordialBalance.toNumber(), 100, "Account3 has incorrect Primordial balance after transfer");
			assert.equal(
				account1WeightedIndexBefore.toNumber(),
				account1WeightedIndexAfter.toNumber(),
				"Account1 has incorrect weighted index after transfer"
			);
			assert.equal(
				account3WeightedIndex.toNumber(),
				account1WeightedIndexAfter.toNumber(),
				"Account3 has incorrect weighted index after transfer"
			);

			var totalLotsAfter = await tokenMeta.totalLots();
			var lotIndexAfter = await tokenMeta.lotIndex();
			var primordialTotalSupplyAfter = await tokenMeta.primordialTotalSupply();
			assert.equal(totalLotsAfter.toNumber(), totalLotsBefore.toNumber() + 1, "Incorrect total lots after transfer");
			assert.equal(lotIndexAfter.toNumber(), lotIndexBefore.toNumber(), "Incorrect lot index after transfer");
			assert.equal(
				primordialTotalSupplyAfter.toNumber(),
				primordialTotalSupplyBefore.toNumber(),
				"Incorrect Primordial total supply after transfer"
			);

			var account3Lot = await tokenMeta.lotOfOwnerByIndex(account3, 0);
			assert.equal(account3Lot[1].toNumber(), account1WeightedIndexAfter.toNumber(), "Account3 lot has incorrect global lot index");
			assert.equal(account3Lot[2].toNumber(), 100, "Account3 lot has incorrect Primordial token amount");
		});
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
		it("approvePrimordialToken() - should set Primordial allowance for other address", async function() {
			var account3PrimordialAllowance = await tokenMeta.primordialAllowance(account1, account3);
			assert.equal(account3PrimordialAllowance.toNumber(), 0, "Account3 has incorrect Primordial allowance before approve");
			await tokenMeta.approvePrimordialToken(account3, 10, { from: account1 });
			account3PrimordialAllowance = await tokenMeta.primordialAllowance(account1, account3);
			assert.equal(account3PrimordialAllowance.toNumber(), 10, "Account3 has incorrect Primordial allowance after approve");
		});
		it("transferPrimordialTokenFrom() - should send `_value` Primordial tokens to `_to` in behalf of `_from`", async function() {
			var account1WeightedIndexBefore = await tokenMeta.weightedIndexByAddress(account1);
			var account1PrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account1);
			var account3PrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account3);
			var account3PrimordialAllowanceBefore = await tokenMeta.primordialAllowance(account1, account3);
			var totalLotsBefore = await tokenMeta.totalLots();
			var lotIndexBefore = await tokenMeta.lotIndex();
			var primordialTotalSupplyBefore = await tokenMeta.primordialTotalSupply();

			var canTransferPrimordialFrom;
			try {
				await tokenMeta.transferPrimordialTokenFrom(account1, account3, 5, { from: developer });
				canTransferPrimordialFrom = true;
			} catch (e) {
				canTransferPrimordialFrom = false;
			}
			assert.notEqual(
				canTransferPrimordialFrom,
				true,
				"Account that was not approved is able to transfer Primordial on behalf of other"
			);
			try {
				await tokenMeta.transferPrimordialTokenFrom(account1, account3, 5, { from: account3 });
				canTransferPrimordialFrom = true;
			} catch (e) {
				canTransferPrimordialFrom = false;
			}
			assert.equal(
				canTransferPrimordialFrom,
				true,
				"Account that was approved is not able to transfer Primordial on behalf of other"
			);

			var account1WeightedIndexAfter = await tokenMeta.weightedIndexByAddress(account1);
			var account1PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account1);
			var account3PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account3);
			var account3PrimordialAllowanceAfter = await tokenMeta.primordialAllowance(account1, account3);
			assert.equal(
				account1WeightedIndexBefore.toNumber(),
				account1WeightedIndexAfter.toNumber(),
				"Account1 has incorrect weighted index after transfer"
			);
			assert.equal(
				account1PrimordialBalanceAfter.toNumber(),
				account1PrimordialBalanceBefore.toNumber() - 5,
				"Account1 has incorrect Primordial balance after transfer"
			);
			assert.equal(
				account3PrimordialBalanceAfter.toNumber(),
				account3PrimordialBalanceBefore.toNumber() + 5,
				"Account3 has incorrect Primordial balance after transfer"
			);
			assert.equal(
				account3PrimordialAllowanceAfter.toNumber(),
				account3PrimordialAllowanceBefore.toNumber() - 5,
				"Account3 has incorrect Primordial allowance after transfer"
			);

			var totalLotsAfter = await tokenMeta.totalLots();
			var lotIndexAfter = await tokenMeta.lotIndex();
			var primordialTotalSupplyAfter = await tokenMeta.primordialTotalSupply();
			assert.equal(totalLotsAfter.toNumber(), totalLotsBefore.toNumber() + 1, "Incorrect total lots after transfer");
			assert.equal(lotIndexAfter.toNumber(), lotIndexBefore.toNumber(), "Incorrect lot index after transfer");
			assert.equal(
				primordialTotalSupplyAfter.toNumber(),
				primordialTotalSupplyBefore.toNumber(),
				"Incorrect Primordial total supply after transfer"
			);

			var account3Lot1 = await tokenMeta.lotOfOwnerByIndex(account3, 0);
			var account3Lot2 = await tokenMeta.lotOfOwnerByIndex(account3, 1);
			account3Lots.push(account3Lot2[0]);

			assert.equal(
				account3Lot2[1].toNumber(),
				account1WeightedIndexAfter.toNumber(),
				"Account3 lot #2 has incorrect global lot index"
			);
			assert.equal(account3Lot2[2].toNumber(), 5, "Account3 lot #2 has incorrect Primordial token amount");

			var account3WeightedIndex = await tokenMeta.weightedIndexByAddress(account3);

			// Calculate weighted index
			var totalWeightedTokens =
				account3Lot1[1].toNumber() * account3Lot1[2].toNumber() + account3Lot2[1].toNumber() * account3Lot2[2].toNumber();
			var totalTokens = account3Lot1[2].toNumber() + account3Lot2[2].toNumber();
			var newWeightedIndex = parseInt(totalWeightedTokens / totalTokens);
			assert.equal(
				account3WeightedIndex.toNumber(),
				newWeightedIndex,
				"Account3 has incorrect weighted index after transfer from Account1"
			);
		});
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
			var _lots = await tokenMeta.lotsByAddress(account1);
			var isEqual =
				_lots.length === account1Lots.length &&
				_lots.every(function(value, index) {
					return value === account1Lots[index];
				});
			assert.equal(isEqual, true, "lotsByAddress() return incorrect lots for Account1");

			_lots = await tokenMeta.lotsByAddress(account2);
			isEqual =
				_lots.length === account2Lots.length &&
				_lots.every(function(value, index) {
					return value === account2Lots[index];
				});
			assert.equal(isEqual, true, "lotsByAddress() return incorrect lots for Account2");

			_lots = await tokenMeta.lotsByAddress(account3);
			isEqual =
				_lots.length === account3Lots.length &&
				_lots.every(function(value, index) {
					return value === account3Lots[index];
				});
			assert.equal(isEqual, true, "lotsByAddress() return incorrect lots for Account3");
		});
		it("should return correct lot information at a given ID", async function() {
			var _lot = await tokenMeta.lotById(lot1[0]);
			assert.equal(_lot[0], lot1[0], "lotById() return incorrect lot ID");
			assert.equal(_lot[1].toNumber(), lot1[1].toNumber(), "lotById() return incorrect lot index");
			assert.equal(_lot[2].toNumber(), lot1[2].toNumber(), "lotById() return incorrect token amount");
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

			var account1WeightedIndex = await tokenMeta.weightedIndexByAddress(account1);

			await tokenMeta.transferTokens(account2, 10, 10, { from: account1 });

			var account1BalanceAfter = await tokenMeta.balanceOf(account1);
			var account2BalanceAfter = await tokenMeta.balanceOf(account2);

			var account1PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account1);
			var account2PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account2);

			var account2WeightedIndex = await tokenMeta.weightedIndexByAddress(account2);

			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.toNumber() - 10,
				"Account1 has incorrect network tokens balance after transfer"
			);
			assert.equal(
				account2BalanceAfter.toNumber(),
				account2BalanceBefore.toNumber() + 10,
				"Account2 has incorrect network tokens balance after transfer"
			);
			assert.equal(
				account1PrimordialBalanceAfter.toNumber(),
				account1PrimordialBalanceBefore.toNumber() - 10,
				"Account1 has incorrect Primordial Tokens balance after transfer"
			);
			assert.equal(
				account2PrimordialBalanceAfter.toNumber(),
				account2PrimordialBalanceBefore.toNumber() + 10,
				"Account2 has incorrect Primordial Tokens balance after transfer"
			);
			assert.equal(
				account2WeightedIndex.toNumber(),
				account1WeightedIndex.toNumber(),
				"Account2 has incorrect weighted index after transfer"
			);
		});
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
		it("approveTokens() - should allow `_spender` to spend no more than `_value` network tokens and `_primordialValue` Primordial tokens in your behalf", async function() {
			var account2AllowanceBefore = await tokenMeta.allowance(account1, account2);
			var account2PrimordialAllowanceBefore = await tokenMeta.primordialAllowance(account1, account2);

			await tokenMeta.approveTokens(account2, 40, 40, { from: account1 });

			var account2AllowanceAfter = await tokenMeta.allowance(account1, account2);
			var account2PrimordialAllowanceAfter = await tokenMeta.primordialAllowance(account1, account2);

			assert.equal(
				account2AllowanceAfter.toNumber(),
				account2AllowanceBefore.toNumber() + 40,
				"Account2 has incorrect network tokens allowance after approve"
			);
			assert.equal(
				account2PrimordialAllowanceAfter.toNumber(),
				account2PrimordialAllowanceBefore.toNumber() + 40,
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
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.toNumber() - 5,
				"Account1 has incorrect network tokens balance after transferTokensFrom"
			);
			assert.equal(
				account3BalanceAfter.toNumber(),
				account3BalanceBefore.toNumber() + 5,
				"Account3 has incorrect network tokens balance after transferTokensFrom"
			);
			assert.equal(
				account2AllowanceAfter.toNumber(),
				account2AllowanceBefore.toNumber() - 5,
				"Account2 has incorrect network tokens allowance after transferTokensFrom"
			);

			assert.equal(
				account1PrimordialBalanceAfter.toNumber(),
				account1PrimordialBalanceBefore.toNumber() - 5,
				"Account1 has incorrect Primordial Tokens balance after transferTokensFrom"
			);
			assert.equal(
				account3PrimordialBalanceAfter.toNumber(),
				account3PrimordialBalanceBefore.toNumber() + 5,
				"Account3 has incorrect Primordial Tokens balance after transferTokensFrom"
			);
			assert.equal(
				account2PrimordialAllowanceAfter.toNumber(),
				account2PrimordialAllowanceBefore.toNumber() - 5,
				"Account2 has incorrect Primordial Tokens allowance after transferTokensFrom"
			);
		});
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
	});
	contract("Whitelisted Address Function Tests", function() {
		var stakedPrimordialWeightedIndex;
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
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.toNumber() - 10,
				"Account1 has incorrect balance after staking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.toNumber() + 10,
				"Account1 has incorrect staked balance after staking"
			);
			assert.equal(totalSupplyAfter.toNumber(), totalSupplyBefore.toNumber(), "Contract has incorrect total supply after staking");
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
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.toNumber() + 10,
				"Account1 has incorrect balance after unstaking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.toNumber() - 10,
				"Account1 has incorrect staked balance after unstaking"
			);
			assert.equal(totalSupplyAfter.toNumber(), totalSupplyBefore.toNumber(), "Contract has incorrect total supply after unstaking");
		});
		it("should be able to stake Primordial tokens on behalf of others", async function() {
			var account1PrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account1);
			var account1WeightedIndexBefore = await tokenMeta.weightedIndexByAddress(account1);
			var account1PrimordialStakedBalanceBefore = await tokenMeta.primordialStakedBalance(
				account1,
				account1WeightedIndexBefore.toNumber()
			);
			var primordialTotalSupplyBefore = await tokenMeta.primordialTotalSupply();

			var canStakePrimordial;
			try {
				await tokenMeta.stakePrimordialTokenFrom(account1, 10, account1WeightedIndexBefore.toNumber(), { from: account2 });
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
				await tokenMeta.stakePrimordialTokenFrom(account1, 1000000, account1WeightedIndexBefore.toNumber(), {
					from: whitelistedAccount
				});
				canStakePrimordial = true;
			} catch (e) {
				canStakePrimordial = false;
			}
			assert.notEqual(canStakePrimordial, true, "Account can stake more than available balance");
			try {
				await tokenMeta.stakePrimordialTokenFrom(account1, 10, account1WeightedIndexBefore.toNumber(), {
					from: whitelistedAccount
				});
				canStakePrimordial = true;
			} catch (e) {
				canStakePrimordial = false;
			}
			assert.equal(canStakePrimordial, true, "Account that has permission can't stake Primordial tokens on behalf of others");
			stakedPrimordialWeightedIndex = account1WeightedIndexBefore.toNumber();

			var account1PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account1);
			var account1WeightedIndexAfter = await tokenMeta.weightedIndexByAddress(account1);
			var account1PrimordialStakedBalanceAfter = await tokenMeta.primordialStakedBalance(account1, stakedPrimordialWeightedIndex);
			var primordialTotalSupplyAfter = await tokenMeta.primordialTotalSupply();

			assert.equal(
				account1PrimordialBalanceAfter.toNumber(),
				account1PrimordialBalanceBefore.toNumber() - 10,
				"Account1 has incorrect Primordial tokens balance after staking"
			);
			assert.equal(
				account1WeightedIndexAfter.toNumber(),
				account1WeightedIndexBefore.toNumber(),
				"Account1 has incorrect weighted index after staking"
			);
			assert.equal(
				account1PrimordialStakedBalanceAfter.toNumber(),
				account1PrimordialStakedBalanceBefore.toNumber() + 10,
				"Account1 has incorrect Primordial tokens staked balance after staking"
			);
			assert.equal(
				primordialTotalSupplyAfter.toNumber(),
				primordialTotalSupplyBefore.toNumber(),
				"Contract has incorrect Primordial total supply after staking"
			);
		});
		it("should be able to unstake Primordial tokens on behalf of others", async function() {
			var account1PrimordialBalanceBefore = await tokenMeta.primordialBalanceOf(account1);
			var account1WeightedIndexBefore = await tokenMeta.weightedIndexByAddress(account1);
			var account1PrimordialStakedBalanceBefore = await tokenMeta.primordialStakedBalance(account1, stakedPrimordialWeightedIndex);
			var primordialTotalSupplyBefore = await tokenMeta.primordialTotalSupply();

			var canUnstakePrimordial;
			try {
				await tokenMeta.unstakePrimordialTokenFrom(account1, 10, stakedPrimordialWeightedIndex, { from: account2 });
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
				await tokenMeta.unstakePrimordialTokenFrom(account1, 100000, stakedPrimordialWeightedIndex, { from: whitelistedAccount });
				canUnstakePrimordial = true;
			} catch (e) {
				canUnstakePrimordial = false;
			}
			assert.notEqual(canUnstakePrimordial, true, "Account can unstake more than available balance");
			try {
				await tokenMeta.unstakePrimordialTokenFrom(account1, 10, stakedPrimordialWeightedIndex, { from: whitelistedAccount });
				canUnstakePrimordial = true;
			} catch (e) {
				canUnstakePrimordial = false;
			}
			assert.equal(canUnstakePrimordial, true, "Account that has permission can't unstake Primordial tokens on behalf of others");

			var account1PrimordialBalanceAfter = await tokenMeta.primordialBalanceOf(account1);
			var account1WeightedIndexAfter = await tokenMeta.weightedIndexByAddress(account1);
			var account1PrimordialStakedBalanceAfter = await tokenMeta.primordialStakedBalance(account1, stakedPrimordialWeightedIndex);
			var primordialTotalSupplyAfter = await tokenMeta.primordialTotalSupply();

			var totalWeightedTokens =
				account1WeightedIndexBefore.toNumber() * account1PrimordialBalanceBefore.toNumber() + stakedPrimordialWeightedIndex * 10;
			var totalTokens = account1PrimordialBalanceBefore.toNumber() + 10;
			var newWeightedIndex = Math.floor(totalWeightedTokens / totalTokens);

			assert.equal(
				account1PrimordialBalanceAfter.toNumber(),
				account1PrimordialBalanceBefore.toNumber() + 10,
				"Account1 has incorrect Primordial tokens balance after unstaking"
			);
			assert.equal(account1WeightedIndexAfter.toNumber(), newWeightedIndex, "Account1 has incorrect weighted index after unstaking");
			assert.equal(
				account1PrimordialStakedBalanceAfter.toNumber(),
				account1PrimordialStakedBalanceBefore.toNumber() - 10,
				"Account1 has incorrect Primordial tokens staked balance after unstaking"
			);
			assert.equal(
				primordialTotalSupplyAfter.toNumber(),
				primordialTotalSupplyBefore.toNumber(),
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
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.minus(10).toNumber(),
				"Account1 has incorrect balance after burning"
			);
			assert.equal(
				totalSupplyAfter.toNumber(),
				totalSupplyBefore.minus(10).toNumber(),
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

			assert.equal(account1BalanceAfter.toNumber(), account1BalanceBefore.toNumber(), "Account1 has incorrect balance after escrow");
			assert.equal(
				account2BalanceAfter.toNumber(),
				account2BalanceBefore.minus(10).toNumber(),
				"Account2 has incorrect balance after escrow"
			);
			assert.equal(
				account1EscrowedBalanceAfter.toNumber(),
				account1EscrowedBalanceBefore.plus(10).toNumber(),
				"Account1 has incorrect escrowed balance after escrow"
			);
			assert.equal(totalSupplyAfter.toNumber(), totalSupplyBefore.toNumber(), "Contract has incorrect total supply after escrow");

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

			assert.equal(account1BalanceAfter.toNumber(), account1BalanceBefore.toNumber(), "Account1 has incorrect balance after escrow");
			assert.equal(
				account3BalanceAfter.toNumber(),
				account3BalanceBefore.minus(75).toNumber(),
				"Account3 has incorrect balance after escrow"
			);
			assert.equal(
				account1EscrowedBalanceAfter.toNumber(),
				account1EscrowedBalanceBefore.plus(75).toNumber(),
				"Account1 has incorrect escrowed balance after escrow"
			);
			assert.equal(totalSupplyAfter.toNumber(), totalSupplyBefore.toNumber(), "Contract has incorrect total supply after escrow");
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
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.toNumber(),
				"Account1 has incorrect balance after mint and escrow"
			);
			assert.equal(
				account1EscrowedBalanceAfter.toNumber(),
				account1EscrowedBalanceBefore.plus(10).toNumber(),
				"Account1 has incorrect escrowed balance after mint and escrow"
			);
			assert.equal(
				totalSupplyAfter.toNumber(),
				totalSupplyBefore.plus(10).toNumber(),
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
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.plus(10).toNumber(),
				"Account1 has incorrect balance after unescrow"
			);
			assert.equal(
				account1EscrowedBalanceAfter.toNumber(),
				account1EscrowedBalanceBefore.minus(10).toNumber(),
				"Account1 has incorrect escrowed balance after unescrow"
			);
			assert.equal(totalSupplyAfter.toNumber(), totalSupplyBefore.toNumber(), "Contract has incorrect total supply after unescrow");
		});
	});
});
