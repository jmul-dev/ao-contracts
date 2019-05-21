var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var Logos = artifacts.require("./Logos.sol");
var AOYotta = artifacts.require("./AOYotta.sol");

var NameAccountRecovery = artifacts.require("./NameAccountRecovery.sol");
var AOSetting = artifacts.require("./AOSetting.sol");
var NamePublicKey = artifacts.require("./NamePublicKey.sol");

var EthCrypto = require("eth-crypto");
var helper = require("./helpers/truffleTestHelper");
var BN = require("bn.js");

contract("AOYotta", function(accounts) {
	var namefactory,
		taofactory,
		nametaoposition,
		logos,
		aoyotta,
		nameaccountrecovery,
		aosetting,
		namepublickey,
		accountRecoveryLockDuration,
		nameId1,
		nameId2,
		taoId;

	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var whitelistedAddress = accounts[4];
	var someAddress = accounts[5];
	var emptyAddress = "0x0000000000000000000000000000000000000000";
	var recipient = EthCrypto.createIdentity();
	var account3PrivateKey = "0xf4bab2d2f0c5119cc6aad0735bbf0a017d229cbf430c0041af382b93e713a1c3";

	var nameId1LocalWriterKey = EthCrypto.createIdentity();
	var nameId2LocalWriterKey = EthCrypto.createIdentity();

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		logos = await Logos.deployed();
		aoyotta = await AOYotta.deployed();
		nameaccountrecovery = await NameAccountRecovery.deployed();
		aosetting = await AOSetting.deployed();
		namepublickey = await NamePublicKey.deployed();

		var settingTAOId = await nameaccountrecovery.settingTAOId();

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "accountRecoveryLockDuration");
		accountRecoveryLockDuration = settingValues[0];
	});

	contract("Variable settings", function() {
		it("should return correct name", async function() {
			var name = await aoyotta.name();
			assert.equal(name, "AO Yotta", "Contract has the incorrect name");
		});

		it("should return correct symbol", async function() {
			var symbol = await aoyotta.symbol();
			assert.equal(symbol, "AOYOTTA", "Contract has the incorrect symbol");
		});

		it("should have the correct power of ten", async function() {
			var powerOfTen = await aoyotta.powerOfTen();
			assert.equal(powerOfTen, 24, "Contract has the incorrect power of ten");
		});

		it("should have 0 decimal", async function() {
			var decimals = await aoyotta.decimals();
			assert.equal(decimals, 24, "Contract has the incorrect decimals");
		});

		it("should have 0 initial supply", async function() {
			var totalSupply = await aoyotta.totalSupply();
			assert.equal(totalSupply.toNumber(), 0, "Contract has incorrect initial supply");
		});
	});

	contract("The AO Only", function() {
		before(async function() {
			// Create Name
			var result = await namefactory.createName(
				"charlie",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				web3.utils.toHex("somecontentid"),
				nameId1LocalWriterKey.address,
				{
					from: account1
				}
			);
			nameId1 = await namefactory.ethAddressToNameId(account1);

			// Mint Logos to nameId1
			await logos.setWhitelist(theAO, true, { from: theAO });
			await logos.mint(nameId1, 10 ** 12, { from: theAO });

			result = await taofactory.createTAO(
				"Charlie's TAO",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				web3.utils.toHex("somecontentid"),
				nameId1,
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
				await aoyotta.transferOwnership(taoId, { from: someAddress });
				canTransferOwnership = true;
			} catch (e) {
				canTransferOwnership = false;
			}
			assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

			try {
				await aoyotta.transferOwnership(taoId, { from: theAO });
				canTransferOwnership = true;
			} catch (e) {
				canTransferOwnership = false;
			}
			assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

			var newTheAO = await aoyotta.theAO();
			assert.equal(newTheAO, taoId, "Contract has incorrect TheAO address after transferring ownership");
		});

		it("The AO - setWhitelist() should be able to whitelist an address", async function() {
			var canSetWhitelist;
			try {
				await aoyotta.setWhitelist(whitelistedAddress, true, { from: someAddress });
				canSetWhitelist = true;
			} catch (e) {
				canSetWhitelist = false;
			}
			assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

			try {
				await aoyotta.setWhitelist(whitelistedAddress, true, { from: account1 });
				canSetWhitelist = true;
			} catch (e) {
				canSetWhitelist = false;
			}
			assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

			var whitelistStatus = await aoyotta.whitelist(whitelistedAddress);
			assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
		});

		it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
			var canSetAddress;
			try {
				await aoyotta.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

			try {
				await aoyotta.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

			var nameTAOPositionAddress = await aoyotta.nameTAOPositionAddress();
			assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
		});

		it("The AO - freezeAccount() can freeze account", async function() {
			var canFreezeAccount;
			try {
				await aoyotta.freezeAccount(account2, true, { from: someAddress });
				canFreezeAccount = true;
			} catch (e) {
				canFreezeAccount = false;
			}
			assert.notEqual(canFreezeAccount, true, "Others can freeze account");
			try {
				await aoyotta.freezeAccount(account2, true, { from: account1 });
				canFreezeAccount = true;
			} catch (e) {
				canFreezeAccount = false;
			}
			assert.equal(canFreezeAccount, true, "The AO can't mint AOYotta");
			var account2Frozen = await aoyotta.frozenAccount(account2);
			assert.equal(account2Frozen, true, "Account2 is not frozen after The AO froze his account");

			await aoyotta.freezeAccount(account2, false, { from: account1 });
		});

		it("The AO - setPrices() can set prices", async function() {
			var canSetPrices;
			try {
				await aoyotta.setPrices(2, 2, { from: someAddress });
				canSetPrices = true;
			} catch (e) {
				canSetPrices = false;
			}
			assert.notEqual(canSetPrices, true, "Others can set network AOYotta prices");
			try {
				await aoyotta.setPrices(2, 2, { from: account1 });
				canSetPrices = true;
			} catch (e) {
				canSetPrices = false;
			}
			assert.equal(canSetPrices, true, "The AO can't set network AOYotta prices");
			var sellPrice = await aoyotta.sellPrice();
			var buyPrice = await aoyotta.buyPrice();
			assert.equal(sellPrice.toNumber(), 2, "Incorrect sell price");
			assert.equal(buyPrice.toNumber(), 2, "Incorrect buy price");
		});
	});

	contract("Network Ion Function Tests", function() {
		before(async function() {
			await aoyotta.setWhitelist(whitelistedAddress, true, { from: theAO });

			// Create Name
			var result = await namefactory.createName(
				"charlie",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				web3.utils.toHex("somecontentid"),
				nameId1LocalWriterKey.address,
				{
					from: account1
				}
			);
			nameId1 = await namefactory.ethAddressToNameId(account1);

			result = await namefactory.createName(
				"delta",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				web3.utils.toHex("somecontentid"),
				nameId2LocalWriterKey.address,
				{
					from: account2
				}
			);
			nameId2 = await namefactory.ethAddressToNameId(account2);

			await nametaoposition.setListener(nameId1, nameId2, { from: account1 });

			var nonce = await namefactory.nonces(nameId1);
			var signHash = EthCrypto.hash.keccak256([
				{
					type: "address",
					value: namepublickey.address
				},
				{
					type: "address",
					value: nameId1
				},
				{
					type: "address",
					value: account3
				},
				{
					type: "uint256",
					value: nonce.add(new BN(1)).toNumber()
				}
			]);

			var signature = EthCrypto.sign(account3PrivateKey, signHash);
			var vrs = EthCrypto.vrs.fromString(signature);

			await namepublickey.addKey(nameId1, account3, nonce.add(new BN(1)).toNumber(), vrs.v, vrs.r, vrs.s, { from: account1 });
		});

		it("Whitelisted address - mint()  can mint", async function() {
			var canMint;
			try {
				await aoyotta.mint(account1, 100, { from: someAddress });
				canMint = true;
			} catch (e) {
				canMint = false;
			}
			assert.notEqual(canMint, true, "Others can mint");

			var balanceBefore = await aoyotta.balanceOf(account1);
			var totalSupplyBefore = await aoyotta.totalSupply();
			try {
				await aoyotta.mint(account1, 100, { from: whitelistedAddress });
				canMint = true;
			} catch (e) {
				canMint = false;
			}
			assert.equal(canMint, true, "The AO can't mint");

			var balanceAfter = await aoyotta.balanceOf(account1);
			var totalSupplyAfter = await aoyotta.totalSupply();

			assert.equal(
				balanceAfter.toNumber(),
				balanceBefore.add(new BN(100)).toNumber(),
				"Account1 has incorrect balance after minting"
			);
			assert.equal(totalSupplyAfter.toNumber(), totalSupplyBefore.add(new BN(100)).toNumber(), "Contract has incorrect totalSupply");
		});

		it("WhitelistedAddress - stakeFrom() should be able to stake ions on behalf of others", async function() {
			var account1BalanceBefore = await aoyotta.balanceOf(account1);
			var account1StakedBalanceBefore = await aoyotta.stakedBalance(account1);
			var totalSupplyBefore = await aoyotta.totalSupply();

			var canStake;
			try {
				await aoyotta.stakeFrom(account1, 10, { from: someAddress });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "Account that do not have permission can stake on behalf of others");
			try {
				await aoyotta.stakeFrom(account1, 100000, { from: whitelistedAddress });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "Account can stake more than available balance");
			try {
				await aoyotta.stakeFrom(account1, 10, { from: whitelistedAddress });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.equal(canStake, true, "Account that has permission can't stake on behalf of others");

			var account1BalanceAfter = await aoyotta.balanceOf(account1);
			var account1StakedBalanceAfter = await aoyotta.stakedBalance(account1);
			var totalSupplyAfter = await aoyotta.totalSupply();

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.sub(new BN(10)).toString(),
				"Account1 has incorrect balance after staking"
			);
			assert.equal(
				account1StakedBalanceAfter.toString(),
				account1StakedBalanceBefore.add(new BN(10)).toString(),
				"Account1 has incorrect staked balance after staking"
			);
			assert.equal(totalSupplyAfter.toString(), totalSupplyBefore.toString(), "Contract has incorrect total supply after staking");
		});

		it("Whitelisted address - unstakeFrom() should be able to unstake ions on behalf of others", async function() {
			var account1BalanceBefore = await aoyotta.balanceOf(account1);
			var account1StakedBalanceBefore = await aoyotta.stakedBalance(account1);
			var totalSupplyBefore = await aoyotta.totalSupply();

			var canUnstake;
			try {
				await aoyotta.unstakeFrom(account1, 10, { from: someAddress });
				canUnstake = true;
			} catch (e) {
				canUnstake = false;
			}
			assert.notEqual(canUnstake, true, "Account that do not have permission can unstake on behalf of others");
			try {
				await aoyotta.unstakeFrom(account1, 100000, { from: whitelistedAddress });
				canUnstake = true;
			} catch (e) {
				canUnstake = false;
			}
			assert.notEqual(canUnstake, true, "Account can unstake more than available balance");
			try {
				await aoyotta.unstakeFrom(account1, 10, { from: whitelistedAddress });
				canUnstake = true;
			} catch (e) {
				canUnstake = false;
			}
			assert.equal(canUnstake, true, "Account that has permission can't unstake on behalf of others");

			var account1BalanceAfter = await aoyotta.balanceOf(account1);
			var account1StakedBalanceAfter = await aoyotta.stakedBalance(account1);
			var totalSupplyAfter = await aoyotta.totalSupply();

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.add(new BN(10)).toString(),
				"Account1 has incorrect balance after unstaking"
			);
			assert.equal(
				account1StakedBalanceAfter.toString(),
				account1StakedBalanceBefore.sub(new BN(10)).toString(),
				"Account1 has incorrect staked balance after unstaking"
			);
			assert.equal(totalSupplyAfter.toString(), totalSupplyBefore.toString(), "Contract has incorrect total supply after unstaking");
		});

		it("Whitelisted address - escrowFrom() should be able to escrow ions on behalf of others", async function() {
			var account1BalanceBefore = await aoyotta.balanceOf(account1);
			var account2BalanceBefore = await aoyotta.balanceOf(account2);
			var account2EscrowedBalanceBefore = await aoyotta.escrowedBalance(account2);
			var totalSupplyBefore = await aoyotta.totalSupply();

			var canEscrow;
			try {
				await aoyotta.escrowFrom(account1, account2, 10, { from: someAddress });
				canEscrow = true;
			} catch (e) {
				canEscrow = false;
			}
			assert.notEqual(canEscrow, true, "Account that do not have permission can escrow on behalf of others");
			try {
				await aoyotta.escrowFrom(account1, account2, 1000, { from: whitelistedAddress });
				canEscrow = true;
			} catch (e) {
				canEscrow = false;
			}
			assert.notEqual(canEscrow, true, "Account can escrow more than available balance");
			try {
				await aoyotta.escrowFrom(account1, account2, 10, { from: whitelistedAddress });
				canEscrow = true;
			} catch (e) {
				canEscrow = false;
			}
			assert.equal(canEscrow, true, "Account that has permission can't escrow on behalf of others");

			var account1BalanceAfter = await aoyotta.balanceOf(account1);
			var account2BalanceAfter = await aoyotta.balanceOf(account2);
			var account2EscrowedBalanceAfter = await aoyotta.escrowedBalance(account2);
			var totalSupplyAfter = await aoyotta.totalSupply();

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.sub(new BN(10)).toString(),
				"Account1 has incorrect balance after escrow"
			);
			assert.equal(account2BalanceAfter.toString(), account2BalanceBefore.toString(), "Account2 has incorrect balance after escrow");
			assert.equal(
				account2EscrowedBalanceAfter.toString(),
				account2EscrowedBalanceBefore.add(new BN(10)).toString(),
				"Account2 has incorrect escrowed balance after escrow"
			);
			assert.equal(totalSupplyAfter.toString(), totalSupplyBefore.toString(), "Contract has incorrect total supply after escrow");
		});

		it("Whitelisted address - mintEscrow() should be able to mint and escrow ions to an account", async function() {
			var account1BalanceBefore = await aoyotta.balanceOf(account1);
			var account1EscrowedBalanceBefore = await aoyotta.escrowedBalance(account1);
			var totalSupplyBefore = await aoyotta.totalSupply();

			var canMintEscrow;
			try {
				await aoyotta.mintEscrow(account1, 10, { from: someAddress });
				canMintEscrow = true;
			} catch (e) {
				canMintEscrow = false;
			}
			assert.notEqual(canMintEscrow, true, "Account that do not have permission can mint and escrow");
			try {
				await aoyotta.mintEscrow(account1, 10, { from: whitelistedAddress });
				canMintEscrow = true;
			} catch (e) {
				canMintEscrow = false;
			}
			assert.equal(canMintEscrow, true, "Account that has permission can't mint and escrow");

			var account1BalanceAfter = await aoyotta.balanceOf(account1);
			var account1EscrowedBalanceAfter = await aoyotta.escrowedBalance(account1);
			var totalSupplyAfter = await aoyotta.totalSupply();

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.toString(),
				"Account1 has incorrect balance after mint and escrow"
			);
			assert.equal(
				account1EscrowedBalanceAfter.toString(),
				account1EscrowedBalanceBefore.add(new BN(10)).toString(),
				"Account1 has incorrect escrowed balance after mint and escrow"
			);
			assert.equal(
				totalSupplyAfter.toString(),
				totalSupplyBefore.add(new BN(10)).toString(),
				"Contract has incorrect total supply after mint and escrow"
			);
		});

		it("Whitelisted address - unescrowFrom() should be able to unescrow ions for an account", async function() {
			var account1BalanceBefore = await aoyotta.balanceOf(account1);
			var account1EscrowedBalanceBefore = await aoyotta.escrowedBalance(account1);
			var totalSupplyBefore = await aoyotta.totalSupply();

			var canUnescrow;
			try {
				await aoyotta.unescrowFrom(account1, 10, { from: someAddress });
				canUnescrow = true;
			} catch (e) {
				canUnescrow = false;
			}
			assert.notEqual(canUnescrow, true, "Account that do not have permission can unescrow ions on behalf of others");
			try {
				await aoyotta.unescrowFrom(account1, 100000, { from: whitelistedAddress });
				canUnescrow = true;
			} catch (e) {
				canUnescrow = false;
			}
			assert.notEqual(canUnescrow, true, "Account can unescrow more than available balance");
			try {
				await aoyotta.unescrowFrom(account1, 10, { from: whitelistedAddress });
				canUnescrow = true;
			} catch (e) {
				canUnescrow = false;
			}
			assert.equal(canUnescrow, true, "Account that has permission can't unescrow on behalf of others");

			var account1BalanceAfter = await aoyotta.balanceOf(account1);
			var account1EscrowedBalanceAfter = await aoyotta.escrowedBalance(account1);
			var totalSupplyAfter = await aoyotta.totalSupply();

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.add(new BN(10)).toString(),
				"Account1 has incorrect balance after unescrow"
			);
			assert.equal(
				account1EscrowedBalanceAfter.toString(),
				account1EscrowedBalanceBefore.sub(new BN(10)).toString(),
				"Account1 has incorrect escrowed balance after unescrow"
			);
			assert.equal(totalSupplyAfter.toString(), totalSupplyBefore.toString(), "Contract has incorrect total supply after unescrow");
		});

		it("Whitelisted address - whitelistBurnFrom() should be able to burn ions on behalf of others", async function() {
			var account1BalanceBefore = await aoyotta.balanceOf(account1);
			var totalSupplyBefore = await aoyotta.totalSupply();

			var canBurn;
			try {
				await aoyotta.whitelistBurnFrom(account1, 10, { from: someAddress });
				canBurn = true;
			} catch (e) {
				canBurn = false;
			}
			assert.notEqual(canBurn, true, "Account that do not have permission can burn on behalf of others");
			try {
				await aoyotta.whitelistBurnFrom(account1, 1000000, { from: whitelistedAddress });
				canBurn = true;
			} catch (e) {
				canBurn = false;
			}
			assert.notEqual(canBurn, true, "Account can burn more than available balance");
			try {
				await aoyotta.whitelistBurnFrom(account1, 10, { from: whitelistedAddress });
				canBurn = true;
			} catch (e) {
				canBurn = false;
			}
			assert.equal(canBurn, true, "Account that has permission can't burn on behalf of others");

			var account1BalanceAfter = await aoyotta.balanceOf(account1);
			var totalSupplyAfter = await aoyotta.totalSupply();

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.sub(new BN(10)).toString(),
				"Account1 has incorrect balance after burning"
			);
			assert.equal(
				totalSupplyAfter.toString(),
				totalSupplyBefore.sub(new BN(10)).toString(),
				"Contract has incorrect total supply after burning"
			);
		});

		it("Whitelisted address - whitelistTransferFrom() should be able to transfer ions from an address to another address", async function() {
			var account1BalanceBefore = await aoyotta.balanceOf(account1);
			var account2BalanceBefore = await aoyotta.balanceOf(account2);
			var totalSupplyBefore = await aoyotta.totalSupply();

			var canTransferFrom;
			try {
				await aoyotta.whitelistTransferFrom(account1, account2, 10, { from: someAddress });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.notEqual(canTransferFrom, true, "Account that do not have permission can transfer on behalf of others");

			try {
				await aoyotta.whitelistTransferFrom(account1, account2, 1000000, { from: whitelistedAddress });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.notEqual(canTransferFrom, true, "Account can transfer more than available balance");

			try {
				await aoyotta.whitelistTransferFrom(account1, account2, 10, { from: whitelistedAddress });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.equal(canTransferFrom, true, "Account that has permission can't transfer on behalf of others");

			var account1BalanceAfter = await aoyotta.balanceOf(account1);
			var account2BalanceAfter = await aoyotta.balanceOf(account2);
			var totalSupplyAfter = await aoyotta.totalSupply();

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.sub(new BN(10)).toString(),
				"Account1 has incorrect balance after transfer"
			);
			assert.equal(
				account2BalanceAfter.toString(),
				account2BalanceBefore.add(new BN(10)).toString(),
				"Account2 has incorrect balance after transfer"
			);
			assert.equal(totalSupplyAfter.toString(), totalSupplyBefore.toString(), "Contract has incorrect total supply after transfer");
		});

		it("buy() - user can buy network ions", async function() {
			await aoyotta.setPrices(1, 1, { from: theAO });

			var canBuy;
			try {
				await aoyotta.buy({ from: account2, value: 10 });
				canBuy = true;
			} catch (e) {
				canBuy = false;
			}
			assert.notEqual(canBuy, true, "Contract does not have enough network ion balance to complete user's ion purchase");
			await aoyotta.mint(aoyotta.address, 10 ** 10, { from: whitelistedAddress });

			var account2BalanceBefore = await aoyotta.balanceOf(account2);
			try {
				await aoyotta.buy({ from: account2, value: 10 });
				canBuy = true;
			} catch (e) {
				canBuy = false;
			}
			var account2BalanceAfter = await aoyotta.balanceOf(account2);
			assert.equal(canBuy, true, "Fail buying network ion from contract");
			assert.equal(
				account2BalanceAfter.toNumber(),
				account2BalanceBefore.add(new BN(10)).toNumber(),
				"Account has incorrect balance after buying ion"
			);
		});

		it("sell() - user can sell network ions to contract", async function() {
			await aoyotta.setPrices(100, 1, { from: theAO });

			var canSell;
			try {
				await aoyotta.sell(10, { from: account2 });
				canSell = true;
			} catch (e) {
				canSell = false;
			}
			assert.notEqual(canSell, true, "User can sell ions to contract even if contract does not have enough ETH balance");

			await aoyotta.setPrices(1, 1, { from: theAO });

			var account2BalanceBefore = await aoyotta.balanceOf(account2);
			var contractBalanceBefore = await aoyotta.balanceOf(aoyotta.address);

			try {
				await aoyotta.sell(5, { from: account2 });
				canSell = true;
			} catch (e) {
				canSell = false;
			}
			assert.equal(canSell, true, "Fail selling network ion to contract");

			var account2BalanceAfter = await aoyotta.balanceOf(account2);
			var contractBalanceAfter = await aoyotta.balanceOf(aoyotta.address);
			assert.equal(
				account2BalanceAfter.toNumber(),
				account2BalanceBefore.sub(new BN(5)).toNumber(),
				"Account has incorrect balance after selling ion"
			);
			assert.equal(
				contractBalanceAfter.toNumber(),
				contractBalanceBefore.add(new BN(5)).toNumber(),
				"Contract has incorrect balance after user sell ion"
			);
		});

		it("transfer() - should send correct `_value` to `_to` from your account", async function() {
			var account1BalanceBefore = await aoyotta.balanceOf(account1);
			var account2BalanceBefore = await aoyotta.balanceOf(account2);
			await aoyotta.transfer(account2, 10, { from: account1 });
			account1BalanceAfter = await aoyotta.balanceOf(account1);
			account2BalanceAfter = await aoyotta.balanceOf(account2);
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.sub(new BN(10)).toNumber(),
				"Account1 has incorrect balance after transfer"
			);
			assert.equal(
				account2BalanceAfter.toNumber(),
				account2BalanceBefore.add(new BN(10)).toNumber(),
				"Account2 has incorrect balance after transfer"
			);
		});

		it("burn() - should remove `_value` ions from the system irreversibly", async function() {
			var account1BalanceBefore = await aoyotta.balanceOf(account1);
			await aoyotta.burn(10, { from: account1 });
			account1BalanceAfter = await aoyotta.balanceOf(account1);
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.sub(new BN(10)).toNumber(),
				"Account1 has incorrect balance after burn"
			);
		});

		it("approve() - should set allowance for other address", async function() {
			var account2AllowanceBefore = await aoyotta.allowance(account1, account2);
			await aoyotta.approve(account2, 10, { from: account1 });
			var account2AllowanceAfter = await aoyotta.allowance(account1, account2);
			assert.equal(
				account2AllowanceAfter.toNumber(),
				account2AllowanceBefore.add(new BN(10)).toNumber(),
				"Account2 has incorrect allowance after approve"
			);
		});

		it("transferFrom() - should send `_value` ions to `_to` in behalf of `_from`", async function() {
			var canTransferFrom;
			try {
				await aoyotta.transferFrom(account1, account2, 5, { from: someAddress });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.notEqual(canTransferFrom, true, "Account that was not approved is able to transfer on behalf of other");

			try {
				await aoyotta.transferFrom(account1, account2, 1000, { from: account2 });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.notEqual(
				canTransferFrom,
				true,
				"Account that was approved is able to transfer more than it's allowance on behalf of other"
			);

			var account1BalanceBefore = await aoyotta.balanceOf(account1);
			var account2BalanceBefore = await aoyotta.balanceOf(account2);
			var account2AllowanceBefore = await aoyotta.allowance(account1, account2);

			try {
				await aoyotta.transferFrom(account1, account2, 5, { from: account2 });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.equal(canTransferFrom, true, "Account that was approved is not able to transfer on behalf of other");

			var account1BalanceAfter = await aoyotta.balanceOf(account1);
			var account2BalanceAfter = await aoyotta.balanceOf(account2);
			var account2AllowanceAfter = await aoyotta.allowance(account1, account2);
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.sub(new BN(5)).toNumber(),
				"Account1 has incorrect balance after transferFrom"
			);
			assert.equal(
				account2BalanceAfter.toNumber(),
				account2BalanceBefore.add(new BN(5)).toNumber(),
				"Account2 has incorrect balance after transferFrom"
			);
			assert.equal(
				account2AllowanceAfter.toNumber(),
				account2AllowanceBefore.sub(new BN(5)).toNumber(),
				"Account2 has incorrect allowance after transferFrom"
			);
		});

		it("burnFrom() - should remove `_value` ions from the system irreversibly on behalf of `_from`", async function() {
			var canBurnFrom;
			try {
				await aoyotta.burnFrom(account1, 5, { from: someAddress });
				canBurnFrom = true;
			} catch (e) {
				canBurnFrom = false;
			}
			assert.notEqual(canBurnFrom, true, "Account that was not approved is able to burn on behalf of other");

			try {
				await aoyotta.burnFrom(account1, 10, { from: account2 });
				canBurnFrom = true;
			} catch (e) {
				canBurnFrom = false;
			}
			assert.notEqual(canBurnFrom, true, "Account that was approved is able to burn more than it's allowance on behalf of other");

			var account1BalanceBefore = await aoyotta.balanceOf(account1);
			var account2AllowanceBefore = await aoyotta.allowance(account1, account2);

			try {
				await aoyotta.burnFrom(account1, 5, { from: account2 });
				canBurnFrom = true;
			} catch (e) {
				canBurnFrom = false;
			}
			assert.equal(canBurnFrom, true, "Account that was approved is not able to burn on behalf of other");

			var account1BalanceAfter = await aoyotta.balanceOf(account1);
			var account2AllowanceAfter = await aoyotta.allowance(account1, account2);

			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.sub(new BN(5)).toNumber(),
				"Account1 has incorrect balance after burnFrom"
			);
			assert.equal(
				account2AllowanceAfter.toNumber(),
				account2AllowanceBefore.sub(new BN(5)).toNumber(),
				"Account2 has incorrect allowance after burnFrom"
			);
		});

		it("frozen account should NOT be able to transfer", async function() {
			await aoyotta.freezeAccount(account1, true, { from: theAO });

			var canTransfer;
			try {
				await aoyotta.transfer(account2, 10, { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.notEqual(canTransfer, true, "Frozen account can transfer");

			// Unfreeze account1
			await aoyotta.freezeAccount(account1, false, { from: theAO });
		});

		it("transferBetweenPublicKeys() - should be able to transfer ions between public keys in a Name", async function() {
			var canTransfer;
			var transferAmount = 10;

			try {
				await aoyotta.transferBetweenPublicKeys(someAddress, account1, account3, transferAmount, { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, false, "Can transfer AO Ion between public keys for a non-Name");

			try {
				await aoyotta.transferBetweenPublicKeys(nameId1, account1, account3, transferAmount, { from: account2 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, false, "Non-Advocate of Name transfer AO Ion between public keys");

			try {
				await aoyotta.transferBetweenPublicKeys(nameId1, account2, account3, transferAmount, { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, false, "Advocate of Name transfer AO Ion from an address that is not listed as public key");

			try {
				await aoyotta.transferBetweenPublicKeys(nameId1, account1, account2, transferAmount, { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, false, "Advocate of Name transfer AO Ion to an address that is not listed as public key");

			var account1Balance = await aoyotta.balanceOf(account1);

			try {
				await aoyotta.transferBetweenPublicKeys(nameId1, account1, account3, account1Balance.add(1).toNumber(), { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, false, "Advocate of Name transfer AO Ion more than from address' owned balance");

			// Listener submit account recovery for nameId1
			await nameaccountrecovery.submitAccountRecovery(nameId1, { from: account2 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			try {
				await aoyotta.transferBetweenPublicKeys(nameId1, account1, account3, transferAmount, { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, false, "Compromised Advocate of Name can transfer AO Ion between public keys");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			var account1BalanceBefore = await aoyotta.balanceOf(account1);
			var account3BalanceBefore = await aoyotta.balanceOf(account3);

			try {
				await aoyotta.transferBetweenPublicKeys(nameId1, account1, account3, transferAmount, { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, true, "Advocate of Name can't transfer AO Ion between public keys");

			var account1BalanceAfter = await aoyotta.balanceOf(account1);
			var account3BalanceAfter = await aoyotta.balanceOf(account3);
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.sub(new BN(transferAmount)).toNumber(),
				"Account has incorrect balance"
			);
			assert.equal(
				account3BalanceAfter.toNumber(),
				account3BalanceBefore.add(new BN(transferAmount)).toNumber(),
				"Account has incorrect balance"
			);
		});

		it("The AO - transferETH() should be able to transfer ETH to an address", async function() {
			await aoyotta.buy({ from: account2, value: new BN(10 ** 5) });

			var canTransferEth;
			try {
				await aoyotta.transferEth(recipient.address, new BN(10 ** 4), { from: someAddress });
				canTransferEth = true;
			} catch (e) {
				canTransferEth = false;
			}
			assert.equal(canTransferEth, false, "Non-AO can transfer ETH out of contract");

			try {
				await aoyotta.transferEth(emptyAddress, new BN(10 ** 4), { from: theAO });
				canTransferEth = true;
			} catch (e) {
				canTransferEth = false;
			}
			assert.equal(canTransferEth, false, "The AO can transfer ETH out of contract to invalid address");

			try {
				await aoyotta.transferEth(recipient.address, new BN(10 ** 8), { from: theAO });
				canTransferEth = true;
			} catch (e) {
				canTransferEth = false;
			}
			assert.equal(canTransferEth, false, "The AO can transfer ETH out of contract more than its available balance");

			try {
				await aoyotta.transferEth(recipient.address, new BN(10 ** 4), { from: theAO });
				canTransferEth = true;
			} catch (e) {
				canTransferEth = false;
			}
			assert.equal(canTransferEth, true, "The AO can't transfer ETH out of contract");

			var recipientBalance = await web3.eth.getBalance(recipient.address);
			assert.equal(recipientBalance, 10 ** 4, "Recipient has incorrect balance");
		});
	});
});
