var AOToken = artifacts.require("./AOToken.sol");

contract("AOToken", function(accounts) {
	var tokenMeta;
	var owner = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
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
			return tokenMeta.MAX_ICO_SUPPLY.call().then(function(maxIcoSupply) {
				assert.equal(maxIcoSupply.toNumber(), 1125899906842620, "Contract has incorrect max ico supply amount");
			});
		});
		it("should set aside 125899906842620 ICO tokens reserved for Foundation", function() {
			return tokenMeta.ICO_RESERVED_FOR_FOUNDATION.call().then(function(reservedTokens) {
				assert.equal(reservedTokens.toNumber(), 125899906842620, "Contract has incorrect reserved amount for Foundation");
			});
		});
		it("should have the correct weighted index divisor", function() {
			return tokenMeta.WEIGHTED_INDEX_DIVISOR.call().then(function(divisor) {
				assert.equal(divisor.toNumber(), 10 ** 6, "Contract has incorrect weighted index divisor");
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
		it("frozen account should not be able to transfer", async function() {
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
			var reservedForFoundationAmount = await tokenMeta.ICO_RESERVED_FOR_FOUNDATION();
			var foundationReserved = await tokenMeta.foundationReserved();
			var totalLots = await tokenMeta.totalLots();
			var lotIndex = await tokenMeta.lotIndex();
			var ownerIcoBalance = await tokenMeta.icoBalanceOf(owner);
			var ownerTotalLots = await tokenMeta.totalLotsByAddress(owner);
			assert.equal(
				foundationReserved,
				false,
				"foundationReserved bit is set incorrectly before the reserve for Foundation transaction is executed"
			);
			assert.equal(totalLots.toNumber(), 0, "Total lots is incorrect before reserve for Foundation transaction");
			assert.equal(lotIndex.toNumber(), 0, "Lot index is incorrect before reserve for Foundation transaction");
			assert.equal(ownerIcoBalance.toNumber(), 0, "Owner has incorrect ICO balance before reserve for Foundation transaction");
			assert.equal(ownerTotalLots.toNumber(), 0, "Owner has incorrect total lots amount before reserve for Foundation transaction");
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
			assert.equal(
				foundationReserved,
				true,
				"foundationReserved bit is set incorrectly after the reserve for Foundation transaction is executed"
			);
			assert.equal(totalLots.toNumber(), 1, "Total lots is incorrect after reserve for Foundation transaction");
			assert.equal(lotIndex.toNumber(), 1, "Lot index is incorrect after reserve for Foundation transaction");
			assert.equal(ownerTotalLots.toNumber(), 1, "Owner has incorrect total lots amount after reserve for Foundation transaction");
			assert.equal(
				ownerIcoBalance.toNumber(),
				reservedForFoundationAmount.toNumber(),
				"Owner has incorrect ICO balance after reserve for Foundation transaction"
			);

			var ownerLot = await tokenMeta.lotOfOwnerByIndex(owner, 0);
			assert.equal(ownerLot[1].toNumber(), 10 ** 6, "Owner lot has incorrect global lot index");
			assert.equal(ownerLot[2].toNumber(), reservedForFoundationAmount.toNumber(), "Owner lot has incorrect ICO token amount");
		});
	});
});
