var AOToken = artifacts.require("./AOToken.sol");

contract("AOToken", function(accounts) {
	var tokenMeta;
	var owner = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var maxIcoSupply;
	var icoReservedForFoundation;
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
				assert.equal(powerOfTen, 1, "Contract has the incorrect power of ten");
			});
		});
		it("should have 0 decimal", function() {
			return tokenMeta.decimals.call().then(function(decimals) {
				assert.equal(decimals, 0, "Contract has the incorrect decimals");
			});
		});
		it("should have 0 initial supply", function() {
			return tokenMeta.balanceOf.call(owner).then(function(balance) {
				assert.equal(balance.toNumber(), 0, "Contract has incorrect initial supply");
			});
		});
		it("should have max of 1125899906842620 ICO tokens", function() {
			return tokenMeta.MAX_ICO_SUPPLY.call().then(function(icoSupply) {
				maxIcoSupply = icoSupply;
				assert.equal(maxIcoSupply.toNumber(), 1125899906842620, "Contract has incorrect max ico supply amount");
			});
		});
		it("should set aside 125899906842620 ICO tokens reserved for Foundation", function() {
			return tokenMeta.ICO_RESERVED_FOR_FOUNDATION.call().then(function(reservedTokens) {
				icoReservedForFoundation = reservedTokens;
				assert.equal(icoReservedForFoundation.toNumber(), 125899906842620, "Contract has incorrect reserved amount for Foundation");
			});
		});
		it("should have the correct weighted index divisor", function() {
			return tokenMeta.WEIGHTED_INDEX_DIVISOR.call().then(function(divisor) {
				weightedIndexDivisor = divisor;
				assert.equal(divisor.toNumber(), 10 ** 6, "Contract has incorrect weighted index divisor");
			});
		});
		it("should set this contract as the ICO contract", function() {
			return tokenMeta.icoContract.call().then(function(isIcoContract) {
				assert.equal(isIcoContract, true, "Contract should be set as the ICO contract");
			});
		});
	});
	contract("Normal ERC20 Function Tests", function() {
		it("only owner can mint token", async function() {
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
				await tokenMeta.mintToken(account1, 100, { from: owner });
				canMint = true;
			} catch (e) {
				canMint = false;
			}
			balance = await tokenMeta.balanceOf(account1);
			assert.equal(canMint, true, "Owner can't mint token");
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
				await tokenMeta.transferFrom(account1, account2, 5, { from: owner });
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
				await tokenMeta.burnFrom(account1, 5, { from: owner });
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
		it("only owner can freeze account", async function() {
			var canFreezeAccount;
			try {
				await tokenMeta.freezeAccount(account1, true, { from: account1 });
				canFreezeAccount = true;
			} catch (e) {
				canFreezeAccount = false;
			}
			assert.notEqual(canFreezeAccount, true, "Others can freeze account");
			try {
				await tokenMeta.freezeAccount(account1, true, { from: owner });
				canFreezeAccount = true;
			} catch (e) {
				canFreezeAccount = false;
			}
			assert.equal(canFreezeAccount, true, "Owner can't mint token");
			var account1Frozen = await tokenMeta.frozenAccount(account1);
			assert.equal(account1Frozen, true, "Account1 is not frozen after owner froze his account");
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
			await tokenMeta.freezeAccount(account1, false, { from: owner });
		});
		it("only owner can set prices", async function() {
			var canSetPrices;
			try {
				await tokenMeta.setPrices(2, 2, { from: account1 });
				canSetPrices = true;
			} catch (e) {
				canSetPrices = false;
			}
			assert.notEqual(canSetPrices, true, "Others can set ERC20 token prices");
			try {
				await tokenMeta.setPrices(2, 2, { from: owner });
				canSetPrices = true;
			} catch (e) {
				canSetPrices = false;
			}
			assert.equal(canSetPrices, true, "Owner can't set ERC20 token prices");
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
			await tokenMeta.mintToken(tokenMeta.address, 1000, { from: owner });
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
	contract("ICO Token Function Tests", function() {
		it("only owner can set ICO prices", async function() {
			var canSetIcoPrices;
			try {
				await tokenMeta.setIcoPrices(100, 100, { from: account1 });
				canSetIcoPrices = true;
			} catch (e) {
				canSetIcoPrices = false;
			}
			assert.notEqual(canSetIcoPrices, true, "Others can set ICO token prices");
			try {
				await tokenMeta.setIcoPrices(100, 100, { from: owner });
				canSetIcoPrices = true;
			} catch (e) {
				canSetIcoPrices = false;
			}
			assert.equal(canSetIcoPrices, true, "Owner can't set ICO token prices");
			var icoSellPrice = await tokenMeta.icoSellPrice();
			var icoBuyPrice = await tokenMeta.icoBuyPrice();
			assert.equal(icoSellPrice.toNumber(), 100, "Incorrect ICO sell price");
			assert.equal(icoBuyPrice.toNumber(), 100, "Incorrect ICO buy price");
		});
		it("only owner can reserve ICO tokens for the Foundation", async function() {
			var canReserveForFoundation;
			var foundationReserved = await tokenMeta.foundationReserved();
			var totalLots = await tokenMeta.totalLots();
			var lotIndex = await tokenMeta.lotIndex();
			var ownerIcoBalance = await tokenMeta.icoBalanceOf(owner);
			var ownerTotalLots = await tokenMeta.totalLotsByAddress(owner);
			var weightedIndexByAddress = await tokenMeta.weightedIndexByAddress(owner);
			var icoTotalSupply = await tokenMeta.icoTotalSupply();
			assert.equal(
				foundationReserved,
				false,
				"foundationReserved bit is set incorrectly before the reserve for Foundation transaction is executed"
			);
			assert.equal(totalLots.toNumber(), 0, "Total lots is incorrect before reserve for Foundation transaction");
			assert.equal(lotIndex.toNumber(), 0, "Lot index is incorrect before reserve for Foundation transaction");
			assert.equal(ownerIcoBalance.toNumber(), 0, "Owner has incorrect ICO balance before reserve for Foundation transaction");
			assert.equal(ownerTotalLots.toNumber(), 0, "Owner has incorrect total lots amount before reserve for Foundation transaction");
			assert.equal(
				weightedIndexByAddress.toNumber(),
				0,
				"Owner has incorrect weighted index before reserve for Foundation transaction"
			);
			assert.equal(icoTotalSupply.toNumber(), 0, "Contract has incorrect ICO total supply before reserve for Foundation transaction");
			try {
				await tokenMeta.reserveForFoundation({ from: account1 });
				canReserveForFoundation = true;
			} catch (e) {
				canReserveForFoundation = false;
			}
			assert.notEqual(canReserveForFoundation, true, "Others can reserve ICO tokens for the Foundation");
			try {
				await tokenMeta.reserveForFoundation({ from: owner });
				canReserveForFoundation = true;
			} catch (e) {
				canReserveForFoundation = false;
			}
			assert.equal(canReserveForFoundation, true, "Owner can't reserve ICO tokens for the Foundation");
			foundationReserved = await tokenMeta.foundationReserved();
			totalLots = await tokenMeta.totalLots();
			lotIndex = await tokenMeta.lotIndex();
			ownerIcoBalance = await tokenMeta.icoBalanceOf(owner);
			ownerTotalLots = await tokenMeta.totalLotsByAddress(owner);
			weightedIndexByAddress = await tokenMeta.weightedIndexByAddress(owner);
			icoTotalSupply = await tokenMeta.icoTotalSupply();
			assert.equal(
				foundationReserved,
				true,
				"foundationReserved bit is set incorrectly after the reserve for Foundation transaction is executed"
			);
			assert.equal(totalLots.toNumber(), 1, "Total lots is incorrect after reserve for Foundation transaction");
			assert.equal(lotIndex.toNumber(), 1, "Lot index is incorrect after reserve for Foundation transaction");
			assert.equal(
				ownerIcoBalance.toNumber(),
				icoReservedForFoundation.toNumber(),
				"Owner has incorrect ICO balance after reserve for Foundation transaction"
			);
			assert.equal(ownerTotalLots.toNumber(), 1, "Owner has incorrect total lots amount after reserve for Foundation transaction");
			assert.equal(
				weightedIndexByAddress.toNumber(),
				1 * weightedIndexDivisor.toNumber(),
				"Owner has incorrect weighted index after reserve for Foundation transaction"
			);
			assert.equal(
				icoTotalSupply.toNumber(),
				icoReservedForFoundation.toNumber(),
				"Contract has incorrect ICO total supply after reserve for Foundation transaction"
			);
			var ownerLot = await tokenMeta.lotOfOwnerByIndex(owner, 0);
			assert.equal(ownerLot[1].toNumber(), 1 * weightedIndexDivisor.toNumber(), "Owner lot has incorrect global lot index");
			assert.equal(ownerLot[2].toNumber(), icoReservedForFoundation.toNumber(), "Owner lot has incorrect ICO token amount");
		});
		it("can only reserve ICO tokens for the Foundation once", async function() {
			var canReserveForFoundation;
			try {
				await tokenMeta.reserveForFoundation({ from: owner });
				canReserveForFoundation = true;
			} catch (e) {
				canReserveForFoundation = false;
			}
			assert.notEqual(canReserveForFoundation, true, "Owner can reserve ICO tokens for the Foundation more than once");
		});
		it("buyIcoToken() - buy ICO tokens from contract by sending ETH", async function() {
			var account1IcoBalance = await tokenMeta.icoBalanceOf(account1);
			assert.equal(account1IcoBalance.toNumber(), 0, "Account1 has incorrect ICO tokens balance before buy");

			var totalLots = await tokenMeta.totalLots();
			var lotIndex = await tokenMeta.lotIndex();
			var account1IcoBalance = await tokenMeta.icoBalanceOf(account1);
			var account1TotalLots = await tokenMeta.totalLotsByAddress(account1);
			var account1WeightedIndex = await tokenMeta.weightedIndexByAddress(account1);
			var icoTotalSupply = await tokenMeta.icoTotalSupply();
			assert.equal(totalLots.toNumber(), 1, "Total lots is incorrect before user buy ICO transaction");
			assert.equal(lotIndex.toNumber(), 1, "Lot index is incorrect before user buy ICO transaction");
			assert.equal(account1IcoBalance.toNumber(), 0, "Account1 has incorrect ICO balance before buy ICO transaction");
			assert.equal(account1TotalLots.toNumber(), 0, "Account1 has incorrect total lots amount before buy ICO transaction");
			assert.equal(account1WeightedIndex.toNumber(), 0, "Account1 has incorrect weighted index before buy ICO transaction");
			assert.equal(
				icoTotalSupply.toNumber(),
				icoReservedForFoundation.toNumber(),
				"Contract has incorrect ICO total supply before user buy ICO transaction"
			);

			var buySuccess;
			try {
				await tokenMeta.buyIcoToken({ from: account1, value: 0 });
				buySuccess = true;
			} catch (e) {
				buySuccess = false;
			}
			assert.equal(buySuccess, false, "Buy ICO token succeeded even though user sent 0 ETH");
			try {
				await tokenMeta.buyIcoToken({ from: account1, value: 10000 });
				buySuccess = true;
			} catch (e) {
				buySuccess = false;
			}
			assert.equal(buySuccess, true, "Unable to buy ICO token even though user sent some ETH");

			totalLots = await tokenMeta.totalLots();
			lotIndex = await tokenMeta.lotIndex();
			account1IcoBalance = await tokenMeta.icoBalanceOf(account1);
			account1TotalLots = await tokenMeta.totalLotsByAddress(account1);
			account1WeightedIndex = await tokenMeta.weightedIndexByAddress(account1);
			icoTotalSupply = await tokenMeta.icoTotalSupply();
			assert.equal(totalLots.toNumber(), 2, "Total lots is incorrect after user buy ICO transaction");
			assert.equal(lotIndex.toNumber(), 2, "Lot index is incorrect after user buy ICO transaction");
			assert.equal(account1IcoBalance.toNumber(), 100, "Account1 has incorrect ICO balance after buy ICO transaction");
			assert.equal(account1TotalLots.toNumber(), 1, "Account1 has incorrect total lots amount after buy ICO transaction");
			assert.equal(
				account1WeightedIndex.toNumber(),
				2 * weightedIndexDivisor.toNumber(),
				"Account2 has incorrect weighted index before buy ICO transaction"
			);
			assert.equal(
				icoTotalSupply.toNumber(),
				icoReservedForFoundation.toNumber() + account1IcoBalance.toNumber(),
				"Contract has incorrect ICO total supply after user buy ICO transaction"
			);
			var account1Lot1 = await tokenMeta.lotOfOwnerByIndex(account1, 0);
			lot1 = account1Lot1;
			account1Lots.push(account1Lot1[0]);
			assert.equal(account1Lot1[1].toNumber(), 2 * weightedIndexDivisor.toNumber(), "Account1 lot has incorrect global lot index");
			assert.equal(account1Lot1[2].toNumber(), 100, "Account1 lot has incorrect ICO token amount");
		});
		it("_updateWeightedIndex() - Should re-calculate existing `account` lots' indexes and update his/her overall weighted index", async function() {
			var account1Lot1 = await tokenMeta.lotOfOwnerByIndex(account1, 0);
			assert.equal(account1Lot1[1].toNumber(), 2 * weightedIndexDivisor.toNumber(), "Account1 lot #1 has incorrect global lot index");
			assert.equal(account1Lot1[2].toNumber(), 100, "Account1 lot #1 has incorrect ICO token amount");

			var buySuccess;
			try {
				await tokenMeta.buyIcoToken({ from: account1, value: 1000000 });
				buySuccess = true;
			} catch (e) {
				buySuccess = false;
			}
			assert.equal(buySuccess, true, "Unable to buy ICO token even though user sent some ETH");
			var account1Lot2 = await tokenMeta.lotOfOwnerByIndex(account1, 1);
			account1Lots.push(account1Lot2[0]);
			assert.equal(account1Lot2[1].toNumber(), 3 * weightedIndexDivisor.toNumber(), "Account1 lot #2 has incorrect global lot index");
			assert.equal(account1Lot2[2].toNumber(), 10000, "Account1 lot #2 has incorrect ICO token amount");

			try {
				await tokenMeta.buyIcoToken({ from: account1, value: 800000 });
				buySuccess = true;
			} catch (e) {
				buySuccess = false;
			}
			assert.equal(buySuccess, true, "Unable to buy ICO token even though user sent some ETH");
			var account1Lot3 = await tokenMeta.lotOfOwnerByIndex(account1, 2);
			account1Lots.push(account1Lot3[0]);
			assert.equal(account1Lot3[1].toNumber(), 4 * weightedIndexDivisor.toNumber(), "Account1 lot #3 has incorrect global lot index");
			assert.equal(account1Lot3[2].toNumber(), 8000, "Account1 lot #3 has incorrect ICO token amount");

			var account1WeightedIndex = await tokenMeta.weightedIndexByAddress(account1);

			// Calculate weighted index
			var totalWeightedTokens =
				account1Lot1[1].toNumber() * account1Lot1[2].toNumber() +
				account1Lot2[1].toNumber() * account1Lot2[2].toNumber() +
				account1Lot3[1].toNumber() * account1Lot3[2].toNumber();
			var totalTokens = account1Lot1[2].toNumber() + account1Lot2[2].toNumber() + account1Lot3[2].toNumber();
			var newWeightedIndex = parseInt(totalWeightedTokens / totalTokens);
			assert.equal(
				account1WeightedIndex.toNumber(),
				newWeightedIndex,
				"Account1 has incorrect weighted index after multiple buy transactions"
			);
		});
		it("should NOT allow buy ICO if max ICO cap is reached (ICO has ended)", async function() {
			var icoTotalSupply = await tokenMeta.icoTotalSupply();
			var remainingAvailableIcoTokens = maxIcoSupply.toNumber() - icoTotalSupply.toNumber();
			assert.isAbove(remainingAvailableIcoTokens, 0, "Contract has incorrect ICO total supply amount");

			var icoEnded = await tokenMeta.icoEnded();
			assert.equal(icoEnded, false, "ICO is ended before max supply is reached");

			var buySuccess;
			try {
				// Sending more ETH than we should to check whether or not the user receives the remainder ETH
				await tokenMeta.buyIcoToken({ from: account2, value: web3.toWei(900, "ether") });
				buySuccess = true;
			} catch (e) {
				buySuccess = false;
			}
			assert.equal(buySuccess, true, "Unable to buy ICO token even though user sent some ETH");

			var account2Lot1 = await tokenMeta.lotOfOwnerByIndex(account2, 0);
			account2Lots.push(account2Lot1[0]);

			var account2IcoBalance = await tokenMeta.icoBalanceOf(account2);
			assert.equal(
				account2IcoBalance.toNumber(),
				remainingAvailableIcoTokens,
				"Account2 has incorrect ICO balance after buy ICO transaction"
			);

			// If user does not receive the remainder ETH, his/her ETH balance will not have more than 800 ETH
			var account2EthBalance = web3.eth.getBalance(account2);
			assert.isAbove(
				account2EthBalance.toNumber(),
				parseInt(web3.toWei(800, "ether")),
				"Account2 does not receive the remainder surplus ETH after buy ICO transaction"
			);

			icoEnded = await tokenMeta.icoEnded();
			assert.equal(icoEnded, true, "ICO is not ended when ICO max supply is reached");

			try {
				await tokenMeta.buyIcoToken({ from: account2, value: web3.toWei(5, "ether") });
				buySuccess = true;
			} catch (e) {
				buySuccess = false;
			}
			assert.equal(buySuccess, false, "Buy ICO token succeeded even though ICO has ended");
		});
		it("transferIcoToken() - should send correct `_value` to `_to` from your account", async function() {
			var account1IcoBalanceBefore = await tokenMeta.icoBalanceOf(account1);
			var account3IcoBalance = await tokenMeta.icoBalanceOf(account3);
			var account1WeightedIndexBefore = await tokenMeta.weightedIndexByAddress(account1);
			var account3WeightedIndex = await tokenMeta.weightedIndexByAddress(account3);
			assert.equal(account3IcoBalance.toNumber(), 0, "Account3 has incorrect ICO balance before transfer");
			assert.equal(account3WeightedIndex.toNumber(), 0, "Account3 has incorrect weighted index before transfer");

			var totalLotsBefore = await tokenMeta.totalLots();
			var lotIndexBefore = await tokenMeta.lotIndex();
			var icoTotalSupplyBefore = await tokenMeta.icoTotalSupply();

			await tokenMeta.transferIcoToken(account3, 100, { from: account1 });

			var account3Lot1 = await tokenMeta.lotOfOwnerByIndex(account3, 0);
			account3Lots.push(account3Lot1[0]);

			var account1IcoBalanceAfter = await tokenMeta.icoBalanceOf(account1);
			account3IcoBalance = await tokenMeta.icoBalanceOf(account3);
			var account1WeightedIndexAfter = await tokenMeta.weightedIndexByAddress(account1);
			account3WeightedIndex = await tokenMeta.weightedIndexByAddress(account3);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.toNumber() - 100,
				"Account1 has incorrect ICO balance after transfer"
			);
			assert.equal(account3IcoBalance.toNumber(), 100, "Account3 has incorrect ICO balance after transfer");
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
			var icoTotalSupplyAfter = await tokenMeta.icoTotalSupply();
			assert.equal(totalLotsAfter.toNumber(), totalLotsBefore.toNumber() + 1, "Incorrect total lots after transfer");
			assert.equal(lotIndexAfter.toNumber(), lotIndexBefore.toNumber(), "Incorrect lot index after transfer");
			assert.equal(icoTotalSupplyAfter.toNumber(), icoTotalSupplyBefore.toNumber(), "Incorrect ICO total supply after transfer");

			var account3Lot = await tokenMeta.lotOfOwnerByIndex(account3, 0);
			assert.equal(account3Lot[1].toNumber(), account1WeightedIndexAfter.toNumber(), "Account3 lot has incorrect global lot index");
			assert.equal(account3Lot[2].toNumber(), 100, "Account3 lot has incorrect ICO token amount");
		});
		it("burnIcoToken() - should remove `_value` tokens from the system irreversibly", async function() {
			var icoTotalSupplyBefore = await tokenMeta.icoTotalSupply();
			var account1IcoBalanceBefore = await tokenMeta.icoBalanceOf(account1);
			var account1WeightedIndexBefore = await tokenMeta.weightedIndexByAddress(account1);
			var account1TotalLotsBefore = await tokenMeta.totalLotsByAddress(account1);

			await tokenMeta.burnIcoToken(10, { from: account1 });

			var account1IcoBalanceAfter = await tokenMeta.icoBalanceOf(account1);
			var icoTotalSupplyAfter = await tokenMeta.icoTotalSupply();
			var account1WeightedIndexAfter = await tokenMeta.weightedIndexByAddress(account1);
			var account1TotalLotsAfter = await tokenMeta.totalLotsByAddress(account1);

			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.toNumber() - 10,
				"Account1 has incorrect ICO balance after burn"
			);
			assert.equal(icoTotalSupplyAfter.toNumber(), icoTotalSupplyBefore.toNumber() - 10, "Incorrect ICO total supply after burn");
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
		it("approveIcoToken() - should set ICO allowance for other address", async function() {
			var account3IcoAllowance = await tokenMeta.icoAllowance(account1, account3);
			assert.equal(account3IcoAllowance.toNumber(), 0, "Account3 has incorrect ICO allowance before approve");
			await tokenMeta.approveIcoToken(account3, 10, { from: account1 });
			account3IcoAllowance = await tokenMeta.icoAllowance(account1, account3);
			assert.equal(account3IcoAllowance.toNumber(), 10, "Account3 has incorrect ICO allowance after approve");
		});
		it("transferIcoTokenFrom() - should send `_value` ICO tokens to `_to` in behalf of `_from`", async function() {
			var account1WeightedIndexBefore = await tokenMeta.weightedIndexByAddress(account1);
			var account1IcoBalanceBefore = await tokenMeta.icoBalanceOf(account1);
			var account3IcoBalanceBefore = await tokenMeta.icoBalanceOf(account3);
			var account3IcoAllowanceBefore = await tokenMeta.icoAllowance(account1, account3);
			var totalLotsBefore = await tokenMeta.totalLots();
			var lotIndexBefore = await tokenMeta.lotIndex();
			var icoTotalSupplyBefore = await tokenMeta.icoTotalSupply();

			var canTransferIcoFrom;
			try {
				await tokenMeta.transferIcoTokenFrom(account1, account3, 5, { from: owner });
				canTransferIcoFrom = true;
			} catch (e) {
				canTransferIcoFrom = false;
			}
			assert.notEqual(canTransferIcoFrom, true, "Account that was not approved is able to transfer ICO on behalf of other");
			try {
				await tokenMeta.transferIcoTokenFrom(account1, account3, 5, { from: account3 });
				canTransferIcoFrom = true;
			} catch (e) {
				canTransferIcoFrom = false;
			}
			assert.equal(canTransferIcoFrom, true, "Account that was approved is not able to transfer ICO on behalf of other");

			var account1WeightedIndexAfter = await tokenMeta.weightedIndexByAddress(account1);
			var account1IcoBalanceAfter = await tokenMeta.icoBalanceOf(account1);
			var account3IcoBalanceAfter = await tokenMeta.icoBalanceOf(account3);
			var account3IcoAllowanceAfter = await tokenMeta.icoAllowance(account1, account3);
			assert.equal(
				account1WeightedIndexBefore.toNumber(),
				account1WeightedIndexAfter.toNumber(),
				"Account1 has incorrect weighted index after transfer"
			);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.toNumber() - 5,
				"Account1 has incorrect ICO balance after transfer"
			);
			assert.equal(
				account3IcoBalanceAfter.toNumber(),
				account3IcoBalanceBefore.toNumber() + 5,
				"Account3 has incorrect ICO balance after transfer"
			);
			assert.equal(
				account3IcoAllowanceAfter.toNumber(),
				account3IcoAllowanceBefore.toNumber() - 5,
				"Account3 has incorrect ICO allowance after transfer"
			);

			var totalLotsAfter = await tokenMeta.totalLots();
			var lotIndexAfter = await tokenMeta.lotIndex();
			var icoTotalSupplyAfter = await tokenMeta.icoTotalSupply();
			assert.equal(totalLotsAfter.toNumber(), totalLotsBefore.toNumber() + 1, "Incorrect total lots after transfer");
			assert.equal(lotIndexAfter.toNumber(), lotIndexBefore.toNumber(), "Incorrect lot index after transfer");
			assert.equal(icoTotalSupplyAfter.toNumber(), icoTotalSupplyBefore.toNumber(), "Incorrect ICO total supply after transfer");

			var account3Lot1 = await tokenMeta.lotOfOwnerByIndex(account3, 0);
			var account3Lot2 = await tokenMeta.lotOfOwnerByIndex(account3, 1);
			account3Lots.push(account3Lot2[0]);

			assert.equal(
				account3Lot2[1].toNumber(),
				account1WeightedIndexAfter.toNumber(),
				"Account3 lot #2 has incorrect global lot index"
			);
			assert.equal(account3Lot2[2].toNumber(), 5, "Account3 lot #2 has incorrect ICO token amount");

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
		it("burnIcoTokenFrom() - should remove `_value` ICO tokens from the system irreversibly on behalf of `_from`", async function() {
			var account1IcoBalanceBefore = await tokenMeta.icoBalanceOf(account1);
			var account3AllowanceBefore = await tokenMeta.icoAllowance(account1, account3);
			var icoTotalSupplyBefore = await tokenMeta.icoTotalSupply();

			var canBurnIcoFrom;
			try {
				await tokenMeta.burnIcoTokenFrom(account1, 5, { from: owner });
				canBurnIcoFrom = true;
			} catch (e) {
				canBurnIcoFrom = false;
			}
			assert.notEqual(canBurnIcoFrom, true, "Account that was not approved is able to burn on behalf of other");
			try {
				await tokenMeta.burnIcoTokenFrom(account1, 10, { from: account3 });
				canBurnIcoFrom = true;
			} catch (e) {
				canBurnIcoFrom = false;
			}
			assert.notEqual(canBurnIcoFrom, true, "Account that was approved is able to burn more than it's allowance on behalf of other");
			try {
				await tokenMeta.burnIcoTokenFrom(account1, 5, { from: account3 });
				canBurnIcoFrom = true;
			} catch (e) {
				canBurnIcoFrom = false;
			}
			assert.equal(canBurnIcoFrom, true, "Account that was approved is not able to burn on behalf of other");
			var account1IcoBalanceAfter = await tokenMeta.icoBalanceOf(account1);
			var account3AllowanceAfter = await tokenMeta.icoAllowance(account1, account3);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.toNumber() - 5,
				"Account1 has incorrect ICO balance after burnIcoTokenFrom"
			);
			assert.equal(
				account3AllowanceAfter.toNumber(),
				account3AllowanceBefore.toNumber() - 5,
				"Account3 has incorrect ICO allowance after burnIcoTokenFrom"
			);

			var icoTotalSupplyAfter = await tokenMeta.icoTotalSupply();
			assert.equal(
				icoTotalSupplyAfter.toNumber(),
				icoTotalSupplyBefore.toNumber() - 5,
				"Contract has incorrect ICO total supply after burnIcoTokenFrom"
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
		it("frozen account should NOT be able to transfer ICO", async function() {
			var canTransferIco;
			await tokenMeta.freezeAccount(account1, true, { from: owner });
			try {
				await tokenMeta.transferIcoToken(account2, 10, { from: account1 });
				canTransferIco = true;
			} catch (e) {
				canTransferIco = false;
			}
			assert.notEqual(canTransferIco, true, "Frozen account can transfer ICO");
			// Unfreeze account1
			await tokenMeta.freezeAccount(account1, false, { from: owner });
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
			await tokenMeta.mintToken(account1, 1000, { from: owner });
			await tokenMeta.buyIcoToken({ from: account1, value: 10000000 });
		});

		it("transferTokens() - should send correct `_value` normal ERC20 and `_icoValue` ICO tokens to `_to` from your account", async function() {
			var account1BalanceBefore = await tokenMeta.balanceOf(account1);
			var account2BalanceBefore = await tokenMeta.balanceOf(account2);

			var account1IcoBalanceBefore = await tokenMeta.icoBalanceOf(account1);
			var account2IcoBalanceBefore = await tokenMeta.icoBalanceOf(account2);

			var account1WeightedIndex = await tokenMeta.weightedIndexByAddress(account1);

			await tokenMeta.transferTokens(account2, 10, 10, { from: account1 });

			var account1BalanceAfter = await tokenMeta.balanceOf(account1);
			var account2BalanceAfter = await tokenMeta.balanceOf(account2);

			var account1IcoBalanceAfter = await tokenMeta.icoBalanceOf(account1);
			var account2IcoBalanceAfter = await tokenMeta.icoBalanceOf(account2);

			var account2WeightedIndex = await tokenMeta.weightedIndexByAddress(account2);

			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.toNumber() - 10,
				"Account1 has incorrect normal ERC20 balance after transfer"
			);
			assert.equal(
				account2BalanceAfter.toNumber(),
				account2BalanceBefore.toNumber() + 10,
				"Account2 has incorrect normal ERC20 balance after transfer"
			);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.toNumber() - 10,
				"Account1 has incorrect ICO Tokens balance after transfer"
			);
			assert.equal(
				account2IcoBalanceAfter.toNumber(),
				account2IcoBalanceBefore.toNumber() + 10,
				"Account2 has incorrect ICO Tokens balance after transfer"
			);
			assert.equal(
				account2WeightedIndex.toNumber(),
				account1WeightedIndex.toNumber(),
				"Account2 has incorrect weighted index after transfer"
			);
		});
		it("burnTokens() - should remove `_value` normal ERC20 and `_icoValue` ICO tokens from the system irreversibly", async function() {
			var account1BalanceBefore = await tokenMeta.balanceOf(account1);
			var account1IcoBalanceBefore = await tokenMeta.icoBalanceOf(account1);
			var totalSupplyBefore = await tokenMeta.totalSupply();
			var icoTotalSupplyBefore = await tokenMeta.icoTotalSupply();

			await tokenMeta.burnTokens(5, 5, { from: account1 });

			var account1BalanceAfter = await tokenMeta.balanceOf(account1);
			var account1IcoBalanceAfter = await tokenMeta.icoBalanceOf(account1);
			var totalSupplyAfter = await tokenMeta.totalSupply();
			var icoTotalSupplyAfter = await tokenMeta.icoTotalSupply();

			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.toNumber() - 5,
				"Account1 has incorrect normal ERC20 balance after burn"
			);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.toNumber() - 5,
				"Account1 has incorrect ICO Tokens balance after burn"
			);
			assert.equal(
				totalSupplyAfter.toNumber(),
				totalSupplyBefore.toNumber() - 5,
				"Contract has incorrect normal ERC20 total supply after burn"
			);
			assert.equal(
				icoTotalSupplyAfter.toNumber(),
				icoTotalSupplyBefore.toNumber() - 5,
				"Contract has incorrect ICO Tokens total supply after burn"
			);
		});
		it("approveTokens() - should allow `_spender` to spend no more than `_value` normal ERC20 and `_icoValue` ICO tokens in your behalf", async function() {
			var account2AllowanceBefore = await tokenMeta.allowance(account1, account2);
			var account2IcoAllowanceBefore = await tokenMeta.icoAllowance(account1, account2);

			await tokenMeta.approveTokens(account2, 40, 40, { from: account1 });

			var account2AllowanceAfter = await tokenMeta.allowance(account1, account2);
			var account2IcoAllowanceAfter = await tokenMeta.icoAllowance(account1, account2);

			assert.equal(
				account2AllowanceAfter.toNumber(),
				account2AllowanceBefore.toNumber() + 40,
				"Account2 has incorrect normal ERC20 allowance after approve"
			);
			assert.equal(
				account2IcoAllowanceAfter.toNumber(),
				account2IcoAllowanceBefore.toNumber() + 40,
				"Account2 has incorrect ICO Tokens allowance after approve"
			);
		});
		it("transferTokensFrom() - should send `_value` normal ERC20 tokens and `_icoValue` ICO Tokens to `_to` in behalf of `_from`", async function() {
			var canTransferTokensFrom;
			try {
				await tokenMeta.transferTokensFrom(account1, account3, 5, 5, { from: owner });
				canTransferTokensFrom = true;
			} catch (e) {
				canTransferTokensFrom = false;
			}
			assert.notEqual(canTransferTokensFrom, true, "Account that was not approved is able to transfer tokens on behalf of other");

			var account1BalanceBefore = await tokenMeta.balanceOf(account1);
			var account3BalanceBefore = await tokenMeta.balanceOf(account3);
			var account2AllowanceBefore = await tokenMeta.allowance(account1, account2);

			var account1IcoBalanceBefore = await tokenMeta.icoBalanceOf(account1);
			var account3IcoBalanceBefore = await tokenMeta.icoBalanceOf(account3);
			var account2IcoAllowanceBefore = await tokenMeta.icoAllowance(account1, account2);

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

			var account1IcoBalanceAfter = await tokenMeta.icoBalanceOf(account1);
			var account3IcoBalanceAfter = await tokenMeta.icoBalanceOf(account3);
			var account2IcoAllowanceAfter = await tokenMeta.icoAllowance(account1, account2);

			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.toNumber() - 5,
				"Account1 has incorrect normal ERC20 balance after transferTokensFrom"
			);
			assert.equal(
				account3BalanceAfter.toNumber(),
				account3BalanceBefore.toNumber() + 5,
				"Account3 has incorrect normal ERC20 balance after transferTokensFrom"
			);
			assert.equal(
				account2AllowanceAfter.toNumber(),
				account2AllowanceBefore.toNumber() - 5,
				"Account2 has incorrect normal ERC20 allowance after transferTokensFrom"
			);

			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.toNumber() - 5,
				"Account1 has incorrect ICO Tokens balance after transferTokensFrom"
			);
			assert.equal(
				account3IcoBalanceAfter.toNumber(),
				account3IcoBalanceBefore.toNumber() + 5,
				"Account3 has incorrect ICO Tokens balance after transferTokensFrom"
			);
			assert.equal(
				account2IcoAllowanceAfter.toNumber(),
				account2IcoAllowanceBefore.toNumber() - 5,
				"Account2 has incorrect ICO Tokens allowance after transferTokensFrom"
			);
		});
		it("burnTokensFrom() - should remove `_value` normal ERC20 and `_icoValue` ICO Tokens from the system irreversibly on behalf of `_from`", async function() {
			var canBurnTokensFrom;
			try {
				await tokenMeta.burnTokensFrom(account1, 5, 5, { from: owner });
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

			var account1IcoBalanceBefore = await tokenMeta.icoBalanceOf(account1);
			var account2IcoAllowanceBefore = await tokenMeta.icoAllowance(account1, account2);

			var totalSupplyBefore = await tokenMeta.totalSupply();
			var icoTotalSupplyBefore = await tokenMeta.icoTotalSupply();

			try {
				await tokenMeta.burnTokensFrom(account1, 10, 10, { from: account2 });
				canBurnTokensFrom = true;
			} catch (e) {
				canBurnTokensFrom = false;
			}
			assert.equal(canBurnTokensFrom, true, "Account that was approved is not able to burn on behalf of other");

			var account1BalanceAfter = await tokenMeta.balanceOf(account1);
			var account2AllowanceAfter = await tokenMeta.allowance(account1, account2);

			var account1IcoBalanceAfter = await tokenMeta.icoBalanceOf(account1);
			var account2IcoAllowanceAfter = await tokenMeta.icoAllowance(account1, account2);

			var totalSupplyAfter = await tokenMeta.totalSupply();
			var icoTotalSupplyAfter = await tokenMeta.icoTotalSupply();

			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.toNumber() - 10,
				"Account1 has incorrect normal ERC20 balance after burnTokensFrom"
			);
			assert.equal(
				account2AllowanceAfter.toNumber(),
				account2AllowanceBefore.toNumber() - 10,
				"Account2 has incorrect normal ERC20 allowance after burnTokensFrom"
			);

			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.toNumber() - 10,
				"Account1 has incorrect ICO Tokens balance after burnTokensFrom"
			);
			assert.equal(
				account2IcoAllowanceAfter.toNumber(),
				account2IcoAllowanceBefore.toNumber() - 10,
				"Account2 has incorrect ICO Tokens allowance after burnTokensFrom"
			);

			assert.equal(
				totalSupplyAfter.toNumber(),
				totalSupplyBefore.toNumber() - 10,
				"Contract has incorrect normal ERC20 total suppy after burnTokensFrom"
			);
			assert.equal(
				icoTotalSupplyAfter.toNumber(),
				icoTotalSupplyBefore.toNumber() - 10,
				"Contract has incorrect ICO Tokens total suppy after burnTokensFrom"
			);
		});
	});
});
