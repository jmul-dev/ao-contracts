var AOExa = artifacts.require("./AOExa.sol");

contract("AOExa", function(accounts) {
	var tokenMeta;
	var developer = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var whitelistedAccount = accounts[4];

	before(function() {
		return AOExa.deployed().then(function(instance) {
			tokenMeta = instance;
		});
	});

	contract("Variable Setting Tests", function() {
		it("should return correct name", function() {
			return tokenMeta.name.call().then(function(name) {
				assert.equal(name, "AO Exa", "Contract has the wrong name");
			});
		});
		it("should return correct symbol", function() {
			return tokenMeta.symbol.call().then(function(symbol) {
				assert.equal(symbol, "AOEXA", "Contract has the wrong symbol");
			});
		});
		it("should have the correct power of ten", function() {
			return tokenMeta.powerOfTen.call().then(function(powerOfTen) {
				assert.equal(powerOfTen, 18, "Contract has the wrong power of ten");
			});
		});
		it("should have 18 decimals", function() {
			return tokenMeta.decimals.call().then(function(decimals) {
				assert.equal(decimals, 18, "Contract has the wrong decimals");
			});
		});
		it("should have 0 initial supply", function() {
			return tokenMeta.balanceOf.call(accounts[0]).then(function(balance) {
				assert.equal(balance.toNumber(), 0, "Contract has wrong initial supply");
			});
		});
	});

	contract("Normal ERC20 Function Tests", function() {
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

	contract("ICO Token Function Tests", function() {
		it("developer should NOT be able to set ICO prices", async function() {
			var canSetIcoPrices;
			try {
				await tokenMeta.setIcoPrices(100, 100, { from: developer });
				canSetIcoPrices = true;
			} catch (e) {
				canSetIcoPrices = false;
			}
			assert.equal(canSetIcoPrices, false, "Developer can set ICO token prices");
		});
		it("developer should NOT be able to reserve ICO tokens for the Foundation", async function() {
			var canReserveForFoundation;
			try {
				await tokenMeta.reserveForFoundation({ from: developer });
				canReserveForFoundation = true;
			} catch (e) {
				canReserveForFoundation = false;
			}
			assert.equal(canReserveForFoundation, false, "Developer can reserve ICO tokens for the Foundation");
		});
		it("buyIcoToken() - should NOT be able tobuy ICO tokens from contract by sending ETH", async function() {
			var buySuccess;
			try {
				await tokenMeta.buyIcoToken({ from: account1, value: 10000 });
				buySuccess = true;
			} catch (e) {
				buySuccess = false;
			}
			assert.equal(buySuccess, false, "Buy ICO token was successful when user sent some ETH");
		});
		it("transferIcoToken() - should NOT be able to send `_value` to `_to` from your account", async function() {
			var transferIcoSuccess;
			try {
				await tokenMeta.transferIcoToken(account2, 0, { from: account1 });
				transferIcoSuccess = true;
			} catch (e) {
				transferIcoSuccess = false;
			}
			assert.equal(transferIcoSuccess, false, "Account1 can transfer ICO tokens");
		});
		it("burnIcoToken() - should NOT be able to remove `_value` tokens from the system irreversibly", async function() {
			var burnIcoSuccess;
			try {
				await tokenMeta.burnIcoToken(0, { from: account1 });
				burnIcoSuccess = true;
			} catch (e) {
				burnIcoSuccess = false;
			}
			assert.equal(burnIcoSuccess, false, "Account1 can burn ICO tokens");
		});
		it("approveIcoToken() - should NOT be able to set ICO allowance for other address", async function() {
			var approveIcoSuccess;
			try {
				await tokenMeta.approveIcoToken(account2, 0, { from: account1 });
				approveIcoSuccess = true;
			} catch (e) {
				approveIcoSuccess = false;
			}
			assert.equal(approveIcoSuccess, false, "Account1 can set ICO allowance for other address");
		});
		it("totalLotsByAddress() - should NOT be able to return the total lots owned by an address", async function() {
			var totalLotsSuccess;
			try {
				await tokenMeta.totalLotsByAddress(account1);
				totalLotsSuccess = true;
			} catch (e) {
				totalLotsSuccess = false;
			}
			assert.equal(totalLotsSuccess, false, "Contract can return total lots of an address");
		});
		it("should NOT be able to return all lots owned by an address", async function() {
			var allLotsSuccess;
			try {
				await tokenMeta.lotsByAddress(account1);
				allLotsSuccess = true;
			} catch (e) {
				allLotsSuccess = false;
			}
			assert.equal(allLotsSuccess, false, "Contract can return all lots of an address");
		});
	});

	contract("Token Combination Function Tests", function() {
		before(async function() {
			await tokenMeta.mintToken(account1, 1000, { from: developer });
		});

		it("transferTokens() - should NOT be able to send `_value` normal ERC20 and `_icoValue` ICO tokens to `_to` from your account", async function() {
			var transferTokensSuccess;
			try {
				await tokenMeta.transferTokens(account2, 10, 0, { from: account1 });
				transferTokensSuccess = true;
			} catch (e) {
				transferTokensSuccess = false;
			}
			assert.equal(transferTokensSuccess, false, "Account1 can transfer both normal ERC20 and ICO tokens");
		});
		it("burnTokens() - should NOT be able to remove `_value` normal ERC20 and `_icoValue` ICO tokens from the system irreversibly", async function() {
			var burnTokensSuccess;
			try {
				await tokenMeta.burnTokens(5, 0, { from: account1 });
				burnTokensSuccess = true;
			} catch (e) {
				burnTokensSuccess = false;
			}
			assert.equal(burnTokensSuccess, false, "Account1 can burn both normal ERC20 and ICO tokens");
		});
		it("approveTokens() - should NOT be able to allow `_spender` to spend no more than `_value` normal ERC20 and `_icoValue` ICO tokens in your behalf", async function() {
			var approveTokensSuccess;
			try {
				await tokenMeta.approveTokens(account2, 40, 0, { from: account1 });
				approveTokensSuccess = true;
			} catch (e) {
				approveTokensSuccess = false;
			}
			assert.equal(approveTokensSuccess, false, "Account1 can set both normal ERC20 and ICO tokens allowances for other address");
		});
	});
	contract("Whitelisted Address Function Tests", function() {
		var stakedIcoWeightedIndex;
		before(async function() {
			await tokenMeta.mintToken(account1, 100, { from: developer });
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
				await tokenMeta.stakeFrom(account1, 10, { from: whitelistedAccount });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.equal(canStake, true, "Account that has permission can't stake on behalf of thers");

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
				await tokenMeta.unstakeFrom(account1, 10, { from: whitelistedAccount });
				canUnstake = true;
			} catch (e) {
				canUnstake = false;
			}
			assert.equal(canUnstake, true, "Account that has permission can't unstake on behalf of thers");

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
		it("should not be able to stake ICO tokens on behalf of others", async function() {
			var canStakeIco;
			try {
				await tokenMeta.stakeIcoTokenFrom(account1, 10, 0, { from: whitelistedAccount });
				canStakeIco = true;
			} catch (e) {
				canStakeIco = false;
			}
			assert.equal(canStakeIco, false, "Contract allows account to stake ICO tokens on behalf of thers");
		});
		it("should not be able to unstake ICO tokens on behalf of others", async function() {
			var canUnstakeIco;
			try {
				await tokenMeta.unstakeIcoTokenFrom(account1, 10, 0, { from: whitelistedAccount });
				canUnstakeIco = true;
			} catch (e) {
				canUnstakeIco = false;
			}
			assert.equal(canUnstakeIco, false, "Contract allows account to unstake ICO tokens on behalf of thers");
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
				await tokenMeta.whitelistBurnFrom(account1, 10, { from: whitelistedAccount });
				canBurn = true;
			} catch (e) {
				canBurn = false;
			}
			assert.equal(canBurn, true, "Account that has permission can't burn on behalf of thers");

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
	});
});
