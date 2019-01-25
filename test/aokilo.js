var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var Logos = artifacts.require("./Logos.sol");
var AOKilo = artifacts.require("./AOKilo.sol");
var TokenOne = artifacts.require("./TokenOne.sol");

var EthCrypto = require("eth-crypto");

contract("AOKilo", function(accounts) {
	var namefactory, taofactory, nametaoposition, logos, aokilo, tokenone, nameId, taoId;

	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var whitelistedAddress = accounts[3];
	var someAddress = accounts[4];
	var emptyAddress = "0x0000000000000000000000000000000000000000";
	var recipient = EthCrypto.createIdentity();

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		logos = await Logos.deployed();
		aokilo = await AOKilo.deployed();
		tokenone = await TokenOne.deployed();
	});

	contract("Variable settings", function() {
		it("should return correct name", async function() {
			var name = await aokilo.name();
			assert.equal(name, "AO Kilo", "Contract has the incorrect name");
		});

		it("should return correct symbol", async function() {
			var symbol = await aokilo.symbol();
			assert.equal(symbol, "AOKILO", "Contract has the incorrect symbol");
		});

		it("should have the correct power of ten", async function() {
			var powerOfTen = await aokilo.powerOfTen();
			assert.equal(powerOfTen, 3, "Contract has the incorrect power of ten");
		});

		it("should have 0 decimal", async function() {
			var decimals = await aokilo.decimals();
			assert.equal(decimals, 3, "Contract has the incorrect decimals");
		});

		it("should have 0 initial supply", async function() {
			var totalSupply = await aokilo.totalSupply();
			assert.equal(totalSupply.toNumber(), 0, "Contract has incorrect initial supply");
		});
	});

	contract("The AO Only", function() {
		before(async function() {
			// Create Name
			var result = await namefactory.createName("charlie", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
				from: account1
			});
			nameId = await namefactory.ethAddressToNameId(account1);

			// Mint Logos to nameId
			await logos.setWhitelist(theAO, true, { from: theAO });
			await logos.mintToken(nameId, 10 ** 12, { from: theAO });

			result = await taofactory.createTAO(
				"Charlie's TAO",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				"somecontentid",
				nameId,
				0,
				false,
				0,
				{
					from: account1
				}
			);
			var createTAOEvent = result.logs[0];
			taoId = createTAOEvent.args.taoId;
		});

		it("The AO - transferOwnership() - should be able to transfer ownership to a TAO", async function() {
			var canTransferOwnership;
			try {
				await aokilo.transferOwnership(taoId, { from: someAddress });
				canTransferOwnership = true;
			} catch (e) {
				canTransferOwnership = false;
			}
			assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

			try {
				await aokilo.transferOwnership(taoId, { from: theAO });
				canTransferOwnership = true;
			} catch (e) {
				canTransferOwnership = false;
			}
			assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

			var newTheAO = await aokilo.theAO();
			assert.equal(newTheAO, taoId, "Contract has incorrect TheAO address after transferring ownership");
		});

		it("The AO - setWhitelist() should be able to whitelist an address", async function() {
			var canSetWhitelist;
			try {
				await aokilo.setWhitelist(whitelistedAddress, true, { from: someAddress });
				canSetWhitelist = true;
			} catch (e) {
				canSetWhitelist = false;
			}
			assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

			try {
				await aokilo.setWhitelist(whitelistedAddress, true, { from: account1 });
				canSetWhitelist = true;
			} catch (e) {
				canSetWhitelist = false;
			}
			assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

			var whitelistStatus = await aokilo.whitelist(whitelistedAddress);
			assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
		});

		it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
			var canSetAddress;
			try {
				await aokilo.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

			try {
				await aokilo.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

			var nameTAOPositionAddress = await aokilo.nameTAOPositionAddress();
			assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
		});

		it("The AO - transferERC20() should be able to transfer ERC20 to an address", async function() {
			await tokenone.transfer(aokilo.address, 100, { from: theAO });

			var accountBalanceBefore = await tokenone.balanceOf(account1);
			var aokiloBalanceBefore = await tokenone.balanceOf(aokilo.address);

			var canTransfer;
			try {
				await aokilo.transferERC20(tokenone.address, account1, 10, { from: someAddress });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, false, "Non-AO can transfer ERC20 token from aokilo");

			try {
				await aokilo.transferERC20(tokenone.address, account1, 1000, { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, false, "The AO can transfer ERC20 token more than owned balance");

			try {
				await aokilo.transferERC20(tokenone.address, account1, 100, { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, true, "The AO can't transfer ERC20 token from aokilo to another recipient");

			var accountBalanceAfter = await tokenone.balanceOf(account1);
			var aokiloBalanceAfter = await tokenone.balanceOf(aokilo.address);

			assert.equal(accountBalanceAfter.toNumber(), accountBalanceBefore.plus(100).toNumber(), "Account has incorrect ERC20 balance");
			assert.equal(aokiloBalanceAfter.toNumber(), aokiloBalanceBefore.minus(100).toNumber(), "aokilo has incorrect ERC20 balance");
		});

		it("The AO - freezeAccount() can freeze account", async function() {
			var canFreezeAccount;
			try {
				await aokilo.freezeAccount(account2, true, { from: someAddress });
				canFreezeAccount = true;
			} catch (e) {
				canFreezeAccount = false;
			}
			assert.notEqual(canFreezeAccount, true, "Others can freeze account");
			try {
				await aokilo.freezeAccount(account2, true, { from: account1 });
				canFreezeAccount = true;
			} catch (e) {
				canFreezeAccount = false;
			}
			assert.equal(canFreezeAccount, true, "The AO can't mint token");
			var account2Frozen = await aokilo.frozenAccount(account2);
			assert.equal(account2Frozen, true, "Account2 is not frozen after The AO froze his account");

			await aokilo.freezeAccount(account2, false, { from: account1 });
		});

		it("The AO - setPrices() can set prices", async function() {
			var canSetPrices;
			try {
				await aokilo.setPrices(2, 2, { from: someAddress });
				canSetPrices = true;
			} catch (e) {
				canSetPrices = false;
			}
			assert.notEqual(canSetPrices, true, "Others can set network token prices");
			try {
				await aokilo.setPrices(2, 2, { from: account1 });
				canSetPrices = true;
			} catch (e) {
				canSetPrices = false;
			}
			assert.equal(canSetPrices, true, "The AO can't set network token prices");
			var sellPrice = await aokilo.sellPrice();
			var buyPrice = await aokilo.buyPrice();
			assert.equal(sellPrice.toNumber(), 2, "Incorrect sell price");
			assert.equal(buyPrice.toNumber(), 2, "Incorrect buy price");
		});
	});

	contract("Network Token Function Tests", function() {
		before(async function() {
			await aokilo.setWhitelist(whitelistedAddress, true, { from: theAO });
		});

		it("Whitelisted address - mintToken()  can mint token", async function() {
			var canMint;
			try {
				await aokilo.mintToken(account1, 100, { from: someAddress });
				canMint = true;
			} catch (e) {
				canMint = false;
			}
			assert.notEqual(canMint, true, "Others can mint token");

			var balanceBefore = await aokilo.balanceOf(account1);
			var totalSupplyBefore = await aokilo.totalSupply();
			try {
				await aokilo.mintToken(account1, 100, { from: whitelistedAddress });
				canMint = true;
			} catch (e) {
				canMint = false;
			}
			assert.equal(canMint, true, "The AO can't mint token");

			var balanceAfter = await aokilo.balanceOf(account1);
			var totalSupplyAfter = await aokilo.totalSupply();

			assert.equal(balanceAfter.toNumber(), balanceBefore.plus(100).toNumber(), "Account1 has incorrect balance after minting");
			assert.equal(totalSupplyAfter.toNumber(), totalSupplyBefore.plus(100).toNumber(), "Contract has incorrect totalSupply");
		});

		it("WhitelistedAddress - stakeFrom() should be able to stake tokens on behalf of others", async function() {
			var account1BalanceBefore = await aokilo.balanceOf(account1);
			var account1StakedBalanceBefore = await aokilo.stakedBalance(account1);
			var totalSupplyBefore = await aokilo.totalSupply();

			var canStake;
			try {
				await aokilo.stakeFrom(account1, 10, { from: someAddress });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "Account that do not have permission can stake on behalf of others");
			try {
				await aokilo.stakeFrom(account1, 100000, { from: whitelistedAddress });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "Account can stake more than available balance");
			try {
				await aokilo.stakeFrom(account1, 10, { from: whitelistedAddress });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.equal(canStake, true, "Account that has permission can't stake on behalf of others");

			var account1BalanceAfter = await aokilo.balanceOf(account1);
			var account1StakedBalanceAfter = await aokilo.stakedBalance(account1);
			var totalSupplyAfter = await aokilo.totalSupply();

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

		it("Whitelisted address - unstakeFrom() should be able to unstake tokens on behalf of others", async function() {
			var account1BalanceBefore = await aokilo.balanceOf(account1);
			var account1StakedBalanceBefore = await aokilo.stakedBalance(account1);
			var totalSupplyBefore = await aokilo.totalSupply();

			var canUnstake;
			try {
				await aokilo.unstakeFrom(account1, 10, { from: someAddress });
				canUnstake = true;
			} catch (e) {
				canUnstake = false;
			}
			assert.notEqual(canUnstake, true, "Account that do not have permission can unstake on behalf of others");
			try {
				await aokilo.unstakeFrom(account1, 100000, { from: whitelistedAddress });
				canUnstake = true;
			} catch (e) {
				canUnstake = false;
			}
			assert.notEqual(canUnstake, true, "Account can unstake more than available balance");
			try {
				await aokilo.unstakeFrom(account1, 10, { from: whitelistedAddress });
				canUnstake = true;
			} catch (e) {
				canUnstake = false;
			}
			assert.equal(canUnstake, true, "Account that has permission can't unstake on behalf of others");

			var account1BalanceAfter = await aokilo.balanceOf(account1);
			var account1StakedBalanceAfter = await aokilo.stakedBalance(account1);
			var totalSupplyAfter = await aokilo.totalSupply();

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

		it("Whitelisted address - escrowFrom() should be able to escrow tokens on behalf of others", async function() {
			var account1BalanceBefore = await aokilo.balanceOf(account1);
			var account2BalanceBefore = await aokilo.balanceOf(account2);
			var account2EscrowedBalanceBefore = await aokilo.escrowedBalance(account2);
			var totalSupplyBefore = await aokilo.totalSupply();

			var canEscrow;
			try {
				await aokilo.escrowFrom(account1, account2, 10, { from: someAddress });
				canEscrow = true;
			} catch (e) {
				canEscrow = false;
			}
			assert.notEqual(canEscrow, true, "Account that do not have permission can escrow on behalf of others");
			try {
				await aokilo.escrowFrom(account1, account2, 1000, { from: whitelistedAddress });
				canEscrow = true;
			} catch (e) {
				canEscrow = false;
			}
			assert.notEqual(canEscrow, true, "Account can escrow more than available balance");
			try {
				await aokilo.escrowFrom(account1, account2, 10, { from: whitelistedAddress });
				canEscrow = true;
			} catch (e) {
				canEscrow = false;
			}
			assert.equal(canEscrow, true, "Account that has permission can't escrow on behalf of others");

			var account1BalanceAfter = await aokilo.balanceOf(account1);
			var account2BalanceAfter = await aokilo.balanceOf(account2);
			var account2EscrowedBalanceAfter = await aokilo.escrowedBalance(account2);
			var totalSupplyAfter = await aokilo.totalSupply();

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.minus(10).toString(),
				"Account1 has incorrect balance after escrow"
			);
			assert.equal(account2BalanceAfter.toString(), account2BalanceBefore.toString(), "Account2 has incorrect balance after escrow");
			assert.equal(
				account2EscrowedBalanceAfter.toString(),
				account2EscrowedBalanceBefore.plus(10).toString(),
				"Account2 has incorrect escrowed balance after escrow"
			);
			assert.equal(totalSupplyAfter.toString(), totalSupplyBefore.toString(), "Contract has incorrect total supply after escrow");
		});

		it("Whitelisted address - mintTokenEscrow() should be able to mint and escrow tokens to an account", async function() {
			var account1BalanceBefore = await aokilo.balanceOf(account1);
			var account1EscrowedBalanceBefore = await aokilo.escrowedBalance(account1);
			var totalSupplyBefore = await aokilo.totalSupply();

			var canMintEscrow;
			try {
				await aokilo.mintTokenEscrow(account1, 10, { from: someAddress });
				canMintEscrow = true;
			} catch (e) {
				canMintEscrow = false;
			}
			assert.notEqual(canMintEscrow, true, "Account that do not have permission can mint and escrow");
			try {
				await aokilo.mintTokenEscrow(account1, 10, { from: whitelistedAddress });
				canMintEscrow = true;
			} catch (e) {
				canMintEscrow = false;
			}
			assert.equal(canMintEscrow, true, "Account that has permission can't mint and escrow");

			var account1BalanceAfter = await aokilo.balanceOf(account1);
			var account1EscrowedBalanceAfter = await aokilo.escrowedBalance(account1);
			var totalSupplyAfter = await aokilo.totalSupply();

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

		it("Whitelisted address - unescrowFrom() should be able to unescrow tokens for an account", async function() {
			var account1BalanceBefore = await aokilo.balanceOf(account1);
			var account1EscrowedBalanceBefore = await aokilo.escrowedBalance(account1);
			var totalSupplyBefore = await aokilo.totalSupply();

			var canUnescrow;
			try {
				await aokilo.unescrowFrom(account1, 10, { from: someAddress });
				canUnescrow = true;
			} catch (e) {
				canUnescrow = false;
			}
			assert.notEqual(canUnescrow, true, "Account that do not have permission can unescrow tokens on behalf of others");
			try {
				await aokilo.unescrowFrom(account1, 100000, { from: whitelistedAddress });
				canUnescrow = true;
			} catch (e) {
				canUnescrow = false;
			}
			assert.notEqual(canUnescrow, true, "Account can unescrow more than available balance");
			try {
				await aokilo.unescrowFrom(account1, 10, { from: whitelistedAddress });
				canUnescrow = true;
			} catch (e) {
				canUnescrow = false;
			}
			assert.equal(canUnescrow, true, "Account that has permission can't unescrow on behalf of others");

			var account1BalanceAfter = await aokilo.balanceOf(account1);
			var account1EscrowedBalanceAfter = await aokilo.escrowedBalance(account1);
			var totalSupplyAfter = await aokilo.totalSupply();

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

		it("Whitelisted address - whitelistBurnFrom() should be able to burn tokens on behalf of others", async function() {
			var account1BalanceBefore = await aokilo.balanceOf(account1);
			var totalSupplyBefore = await aokilo.totalSupply();

			var canBurn;
			try {
				await aokilo.whitelistBurnFrom(account1, 10, { from: someAddress });
				canBurn = true;
			} catch (e) {
				canBurn = false;
			}
			assert.notEqual(canBurn, true, "Account that do not have permission can burn on behalf of others");
			try {
				await aokilo.whitelistBurnFrom(account1, 1000000, { from: whitelistedAddress });
				canBurn = true;
			} catch (e) {
				canBurn = false;
			}
			assert.notEqual(canBurn, true, "Account can burn more than available balance");
			try {
				await aokilo.whitelistBurnFrom(account1, 10, { from: whitelistedAddress });
				canBurn = true;
			} catch (e) {
				canBurn = false;
			}
			assert.equal(canBurn, true, "Account that has permission can't burn on behalf of others");

			var account1BalanceAfter = await aokilo.balanceOf(account1);
			var totalSupplyAfter = await aokilo.totalSupply();

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

		it("Whitelisted address - whitelistTransferFrom() should be able to transfer tokens from an address to another address", async function() {
			var account1BalanceBefore = await aokilo.balanceOf(account1);
			var account2BalanceBefore = await aokilo.balanceOf(account2);
			var totalSupplyBefore = await aokilo.totalSupply();

			var canTransferFrom;
			try {
				await aokilo.whitelistTransferFrom(account1, account2, 10, { from: someAddress });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.notEqual(canTransferFrom, true, "Account that do not have permission can transfer on behalf of others");

			try {
				await aokilo.whitelistTransferFrom(account1, account2, 1000000, { from: whitelistedAddress });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.notEqual(canTransferFrom, true, "Account can transfer more than available balance");

			try {
				await aokilo.whitelistTransferFrom(account1, account2, 10, { from: whitelistedAddress });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.equal(canTransferFrom, true, "Account that has permission can't transfer on behalf of others");

			var account1BalanceAfter = await aokilo.balanceOf(account1);
			var account2BalanceAfter = await aokilo.balanceOf(account2);
			var totalSupplyAfter = await aokilo.totalSupply();

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.minus(10).toString(),
				"Account1 has incorrect balance after transfer"
			);
			assert.equal(
				account2BalanceAfter.toString(),
				account2BalanceBefore.plus(10).toString(),
				"Account2 has incorrect balance after transfer"
			);
			assert.equal(totalSupplyAfter.toString(), totalSupplyBefore.toString(), "Contract has incorrect total supply after transfer");
		});

		it("buy() - user can buy network tokens", async function() {
			await aokilo.setPrices(1, 1, { from: theAO });

			var canBuyToken;
			try {
				await aokilo.buy({ from: account2, value: 10 });
				canBuyToken = true;
			} catch (e) {
				canBuyToken = false;
			}
			assert.notEqual(canBuyToken, true, "Contract does not have enough network token balance to complete user's token purchase");
			await aokilo.mintToken(aokilo.address, 10 ** 20, { from: whitelistedAddress });

			var account2BalanceBefore = await aokilo.balanceOf(account2);
			try {
				await aokilo.buy({ from: account2, value: 10 });
				canBuyToken = true;
			} catch (e) {
				canBuyToken = false;
			}
			var account2BalanceAfter = await aokilo.balanceOf(account2);
			assert.equal(canBuyToken, true, "Fail buying network token from contract");
			assert.equal(
				account2BalanceAfter.toNumber(),
				account2BalanceBefore.plus(10).toNumber(),
				"Account has incorrect balance after buying token"
			);
		});

		it("sell() - user can sell network tokens to contract", async function() {
			await aokilo.setPrices(100, 1, { from: theAO });

			var canSellToken;
			try {
				await aokilo.sell(10, { from: account2 });
				canSellToken = true;
			} catch (e) {
				canSellToken = false;
			}
			assert.notEqual(canSellToken, true, "User can sell tokens to contract even if contract does not have enough ETH balance");

			await aokilo.setPrices(1, 1, { from: theAO });

			var account2BalanceBefore = await aokilo.balanceOf(account2);
			var contractBalanceBefore = await aokilo.balanceOf(aokilo.address);

			try {
				await aokilo.sell(5, { from: account2 });
				canSellToken = true;
			} catch (e) {
				canSellToken = false;
			}
			assert.equal(canSellToken, true, "Fail selling network token to contract");

			var account2BalanceAfter = await aokilo.balanceOf(account2);
			var contractBalanceAfter = await aokilo.balanceOf(aokilo.address);
			assert.equal(
				account2BalanceAfter.toNumber(),
				account2BalanceBefore.minus(5).toNumber(),
				"Account has incorrect balance after selling token"
			);
			assert.equal(
				contractBalanceAfter.toNumber(),
				contractBalanceBefore.plus(5).toNumber(),
				"Contract has incorrect balance after user sell token"
			);
		});

		it("transfer() - should send correct `_value` to `_to` from your account", async function() {
			var account1BalanceBefore = await aokilo.balanceOf(account1);
			var account2BalanceBefore = await aokilo.balanceOf(account2);
			await aokilo.transfer(account2, 10, { from: account1 });
			account1BalanceAfter = await aokilo.balanceOf(account1);
			account2BalanceAfter = await aokilo.balanceOf(account2);
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.minus(10).toNumber(),
				"Account1 has incorrect balance after transfer"
			);
			assert.equal(
				account2BalanceAfter.toNumber(),
				account2BalanceBefore.plus(10).toNumber(),
				"Account2 has incorrect balance after transfer"
			);
		});

		it("burn() - should remove `_value` tokens from the system irreversibly", async function() {
			var account1BalanceBefore = await aokilo.balanceOf(account1);
			await aokilo.burn(10, { from: account1 });
			account1BalanceAfter = await aokilo.balanceOf(account1);
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.minus(10).toNumber(),
				"Account1 has incorrect balance after burn"
			);
		});

		it("approve() - should set allowance for other address", async function() {
			var account2AllowanceBefore = await aokilo.allowance(account1, account2);
			await aokilo.approve(account2, 10, { from: account1 });
			var account2AllowanceAfter = await aokilo.allowance(account1, account2);
			assert.equal(
				account2AllowanceAfter.toNumber(),
				account2AllowanceBefore.plus(10).toNumber(),
				"Account2 has incorrect allowance after approve"
			);
		});

		it("transferFrom() - should send `_value` tokens to `_to` in behalf of `_from`", async function() {
			var canTransferFrom;
			try {
				await aokilo.transferFrom(account1, account2, 5, { from: someAddress });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.notEqual(canTransferFrom, true, "Account that was not approved is able to transfer on behalf of other");

			try {
				await aokilo.transferFrom(account1, account2, 1000, { from: account2 });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.notEqual(
				canTransferFrom,
				true,
				"Account that was approved is able to transfer more than it's allowance on behalf of other"
			);

			var account1BalanceBefore = await aokilo.balanceOf(account1);
			var account2BalanceBefore = await aokilo.balanceOf(account2);
			var account2AllowanceBefore = await aokilo.allowance(account1, account2);

			try {
				await aokilo.transferFrom(account1, account2, 5, { from: account2 });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.equal(canTransferFrom, true, "Account that was approved is not able to transfer on behalf of other");

			var account1BalanceAfter = await aokilo.balanceOf(account1);
			var account2BalanceAfter = await aokilo.balanceOf(account2);
			var account2AllowanceAfter = await aokilo.allowance(account1, account2);
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.minus(5).toNumber(),
				"Account1 has incorrect balance after transferFrom"
			);
			assert.equal(
				account2BalanceAfter.toNumber(),
				account2BalanceBefore.plus(5).toNumber(),
				"Account2 has incorrect balance after transferFrom"
			);
			assert.equal(
				account2AllowanceAfter.toNumber(),
				account2AllowanceBefore.minus(5).toNumber(),
				"Account2 has incorrect allowance after transferFrom"
			);
		});

		it("burnFrom() - should remove `_value` tokens from the system irreversibly on behalf of `_from`", async function() {
			var canBurnFrom;
			try {
				await aokilo.burnFrom(account1, 5, { from: someAddress });
				canBurnFrom = true;
			} catch (e) {
				canBurnFrom = false;
			}
			assert.notEqual(canBurnFrom, true, "Account that was not approved is able to burn on behalf of other");

			try {
				await aokilo.burnFrom(account1, 10, { from: account2 });
				canBurnFrom = true;
			} catch (e) {
				canBurnFrom = false;
			}
			assert.notEqual(canBurnFrom, true, "Account that was approved is able to burn more than it's allowance on behalf of other");

			var account1BalanceBefore = await aokilo.balanceOf(account1);
			var account2AllowanceBefore = await aokilo.allowance(account1, account2);

			try {
				await aokilo.burnFrom(account1, 5, { from: account2 });
				canBurnFrom = true;
			} catch (e) {
				canBurnFrom = false;
			}
			assert.equal(canBurnFrom, true, "Account that was approved is not able to burn on behalf of other");

			var account1BalanceAfter = await aokilo.balanceOf(account1);
			var account2AllowanceAfter = await aokilo.allowance(account1, account2);

			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.minus(5).toNumber(),
				"Account1 has incorrect balance after burnFrom"
			);
			assert.equal(
				account2AllowanceAfter.toNumber(),
				account2AllowanceBefore.minus(5).toNumber(),
				"Account2 has incorrect allowance after burnFrom"
			);
		});

		it("frozen account should NOT be able to transfer", async function() {
			await aokilo.freezeAccount(account1, true, { from: theAO });

			var canTransfer;
			try {
				await aokilo.transfer(account2, 10, { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.notEqual(canTransfer, true, "Frozen account can transfer");

			// Unfreeze account1
			await aokilo.freezeAccount(account1, false, { from: theAO });
		});

		it("The AO - transferETH() should be able to transfer ETH to an address", async function() {
			await aokilo.buy({ from: account2, value: web3.toWei(2, "ether") });

			var canTransferEth;
			try {
				await aokilo.transferEth(recipient.address, web3.toWei(1, "ether"), { from: someAddress });
				canTransferEth = true;
			} catch (e) {
				canTransferEth = false;
			}
			assert.equal(canTransferEth, false, "Non-AO can transfer ETH out of contract");

			try {
				await aokilo.transferEth(emptyAddress, web3.toWei(1, "ether"), { from: theAO });
				canTransferEth = true;
			} catch (e) {
				canTransferEth = false;
			}
			assert.equal(canTransferEth, false, "The AO can transfer ETH out of contract to invalid address");

			try {
				await aokilo.transferEth(recipient.address, web3.toWei(1000, "ether"), { from: theAO });
				canTransferEth = true;
			} catch (e) {
				canTransferEth = false;
			}
			assert.equal(canTransferEth, false, "The AO can transfer ETH out of contract more than its available balance");

			try {
				await aokilo.transferEth(recipient.address, web3.toWei(1, "ether"), { from: theAO });
				canTransferEth = true;
			} catch (e) {
				canTransferEth = false;
			}
			assert.equal(canTransferEth, true, "The AO can't transfer ETH out of contract");

			var recipientBalance = await web3.eth.getBalance(recipient.address);
			assert.equal(recipientBalance.toNumber(), web3.toWei(1, "ether"), "Recipient has incorrect balance");
		});
	});
});
