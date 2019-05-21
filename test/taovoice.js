var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var Logos = artifacts.require("./Logos.sol");

var Voice = artifacts.require("./Voice.sol");
var TAOVoice = artifacts.require("./TAOVoice.sol");

var NameAccountRecovery = artifacts.require("./NameAccountRecovery.sol");
var AOSetting = artifacts.require("./AOSetting.sol");

var EthCrypto = require("eth-crypto");
var helper = require("./helpers/truffleTestHelper");
var BN = require("bn.js");

contract("TAOVoice", function(accounts) {
	var namefactory,
		taofactory,
		nametaoposition,
		logos,
		nameId1,
		nameId2,
		taoId,
		voice,
		taovoice,
		nameaccountrecovery,
		aosetting,
		accountRecoveryLockDuration;

	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var someAddress = accounts[3];
	var whitelistedAddress = accounts[4];

	var nameId1LocalWriterKey = EthCrypto.createIdentity();
	var nameId2LocalWriterKey = EthCrypto.createIdentity();

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		logos = await Logos.deployed();
		voice = await Voice.deployed();
		taovoice = await TAOVoice.deployed();

		nameaccountrecovery = await NameAccountRecovery.deployed();
		aosetting = await AOSetting.deployed();

		var settingTAOId = await nameaccountrecovery.settingTAOId();

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "accountRecoveryLockDuration");
		accountRecoveryLockDuration = settingValues[0];

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

		await nametaoposition.setListener(nameId1, nameId2, { from: account1 });
	});

	it("The AO - transferOwnership() - should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await taovoice.transferOwnership(taoId, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await taovoice.transferOwnership(taoId, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await taovoice.theAO();
		assert.equal(newTheAO, taoId, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - setWhitelist() should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await taovoice.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await taovoice.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await taovoice.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
	});

	it("The AO - setNameFactoryAddress() should be able to set NameFactory address", async function() {
		var canSetAddress;
		try {
			await taovoice.setNameFactoryAddress(namefactory.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameFactory address");

		try {
			await taovoice.setNameFactoryAddress(namefactory.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameFactory address");

		var nameFactoryAddress = await taovoice.nameFactoryAddress();
		assert.equal(nameFactoryAddress, namefactory.address, "Contract has incorrect nameFactoryAddress");
	});

	it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await taovoice.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await taovoice.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await taovoice.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("The AO - setVoiceAddress() should be able to set Voice address", async function() {
		var canSetAddress;
		try {
			await taovoice.setVoiceAddress(voice.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set Voice address");

		try {
			await taovoice.setVoiceAddress(voice.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set Voice address");

		var voiceAddress = await taovoice.voiceAddress();
		assert.equal(voiceAddress, voice.address, "Contract has incorrect voiceAddress");
	});

	it("The AO - setNameAccountRecoveryAddress() should be able to set NameAccountRecovery address", async function() {
		var canSetAddress;
		try {
			await taovoice.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameAccountRecovery address");

		try {
			await taovoice.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameAccountRecovery address");

		var nameAccountRecoveryAddress = await taovoice.nameAccountRecoveryAddress();
		assert.equal(nameAccountRecoveryAddress, nameaccountrecovery.address, "Contract has incorrect nameAccountRecoveryAddress");
	});

	it("stakeVoice() should be able to stake Voice on a TAO", async function() {
		var canStake;
		try {
			await taovoice.stakeVoice(taoId, 800000, { from: someAddress });
			canStake = true;
		} catch (e) {
			canStake = false;
		}
		assert.equal(canStake, false, "Non-Name can stake Voice on a TAO");

		try {
			await taovoice.stakeVoice(someAddress, 800000, { from: account1 });
			canStake = true;
		} catch (e) {
			canStake = false;
		}
		assert.equal(canStake, false, "Name can stake Voice on a non-TAO");

		try {
			await taovoice.stakeVoice(taoId, 10 ** 10, { from: account1 });
			canStake = true;
		} catch (e) {
			canStake = false;
		}
		assert.equal(canStake, false, "Name can stake Voice on a TAO more than its owned balance");

		// Listener submit account recovery for nameId1
		await nameaccountrecovery.submitAccountRecovery(nameId1, { from: account2 });

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		try {
			await taovoice.stakeVoice(taoId, 800000, { from: account1 });
			canStake = true;
		} catch (e) {
			canStake = false;
		}
		assert.equal(canStake, false, "Compromised Name can stake Voice on a TAO");

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

		var nameBalanceBefore = await voice.balanceOf(nameId1);
		var taoBalanceBefore = await voice.balanceOf(taoId);
		var taoStakedBalanceBefore = await voice.taoStakedBalance(nameId1, taoId);
		var nameStakedBalanceBefore = await voice.stakedBalance(nameId1);
		try {
			await taovoice.stakeVoice(taoId, 800000, { from: account1 });
			canStake = true;
		} catch (e) {
			canStake = false;
		}
		assert.equal(canStake, true, "Name can't stake Voice on a TAO");

		var nameBalanceAfter = await voice.balanceOf(nameId1);
		var taoBalanceAfter = await voice.balanceOf(taoId);
		var taoStakedBalanceAfter = await voice.taoStakedBalance(nameId1, taoId);
		var nameStakedBalanceAfter = await voice.stakedBalance(nameId1);

		assert.equal(nameBalanceAfter.toNumber(), nameBalanceBefore.sub(new BN(800000)).toNumber(), "Name has incorrect balance");
		assert.equal(taoBalanceAfter.toNumber(), taoBalanceBefore.add(new BN(800000)).toNumber(), "TAO has incorrect balance");
		assert.equal(
			taoStakedBalanceAfter.toNumber(),
			taoStakedBalanceBefore.add(new BN(800000)).toNumber(),
			"taoStakedBalance has incorrect balance"
		);
		assert.equal(
			nameStakedBalanceAfter.toNumber(),
			nameStakedBalanceBefore.add(new BN(800000)).toNumber(),
			"stakedBalance() has incorrect balance"
		);

		try {
			await taovoice.stakeVoice(taoId, 300000, { from: account1 });
			canStake = true;
		} catch (e) {
			canStake = false;
		}
		assert.equal(canStake, false, "Name can stake Voice more than its available balance");
	});

	it("unstakeVoice() should be able to unstake Voice on a TAO", async function() {
		var canUnstake;
		try {
			await taovoice.unstakeVoice(taoId, 800000, { from: someAddress });
			canUnstake = true;
		} catch (e) {
			canUnstake = false;
		}
		assert.equal(canUnstake, false, "Non-Name can unstake Voice from a TAO");

		try {
			await taovoice.unstakeVoice(someAddress, 800000, { from: account1 });
			canUnstake = true;
		} catch (e) {
			canUnstake = false;
		}
		assert.equal(canUnstake, false, "Name can unstake Voice from a non-TAO");

		try {
			await taovoice.unstakeVoice(taoId, 10 ** 10, { from: account1 });
			canUnstake = true;
		} catch (e) {
			canUnstake = false;
		}
		assert.equal(canUnstake, false, "Name can unstake Voice from a TAO more than its staked balance");

		// Listener submit account recovery for nameId1
		await nameaccountrecovery.submitAccountRecovery(nameId1, { from: account2 });

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		try {
			await taovoice.unstakeVoice(taoId, 600000, { from: account1 });
			canUnstake = true;
		} catch (e) {
			canUnstake = false;
		}
		assert.equal(canUnstake, false, "Compromised Name can unstake Voice from a TAO");

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

		var nameBalanceBefore = await voice.balanceOf(nameId1);
		var taoBalanceBefore = await voice.balanceOf(taoId);
		var taoStakedBalanceBefore = await voice.taoStakedBalance(nameId1, taoId);
		var nameStakedBalanceBefore = await voice.stakedBalance(nameId1);
		try {
			await taovoice.unstakeVoice(taoId, 600000, { from: account1 });
			canUnstake = true;
		} catch (e) {
			canUnstake = false;
		}
		assert.equal(canUnstake, true, "Name can't unstake Voice from a TAO");

		var nameBalanceAfter = await voice.balanceOf(nameId1);
		var taoBalanceAfter = await voice.balanceOf(taoId);
		var taoStakedBalanceAfter = await voice.taoStakedBalance(nameId1, taoId);
		var nameStakedBalanceAfter = await voice.stakedBalance(nameId1);

		assert.equal(nameBalanceAfter.toNumber(), nameBalanceBefore.add(new BN(600000)).toNumber(), "Name has incorrect balance");
		assert.equal(taoBalanceAfter.toNumber(), taoBalanceBefore.sub(new BN(600000)).toNumber(), "TAO has incorrect balance");
		assert.equal(
			taoStakedBalanceAfter.toNumber(),
			taoStakedBalanceBefore.sub(new BN(600000)).toNumber(),
			"taoStakedBalance has incorrect balance"
		);
		assert.equal(
			nameStakedBalanceAfter.toNumber(),
			nameStakedBalanceBefore.sub(new BN(600000)).toNumber(),
			"stakedBalance() has incorrect balance"
		);

		try {
			await taovoice.unstakeVoice(taoId, 300000, { from: account1 });
			canUnstake = true;
		} catch (e) {
			canUnstake = false;
		}
		assert.equal(canUnstake, false, "Name can unstake Voice more than its staked balance");
	});
});
