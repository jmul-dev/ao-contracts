var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var Logos = artifacts.require("./Logos.sol");

var NameAccountRecovery = artifacts.require("./NameAccountRecovery.sol");
var NamePublicKey = artifacts.require("./NamePublicKey.sol");
var AOSetting = artifacts.require("./AOSetting.sol");

var helper = require("./helpers/truffleTestHelper");

contract("NameAccountRecovery", function(accounts) {
	var namefactory,
		taofactory,
		nametaoposition,
		logos,
		nameaccountrecovery,
		namepublickey,
		aosetting,
		settingTAOId,
		accountRecoveryLockDuration,
		nameId1,
		nameId2,
		nameId3,
		taoId1,
		taoId2;

	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var account4 = accounts[4];
	var someAddress = accounts[5];
	var whitelistedAddress = accounts[6];

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		logos = await Logos.deployed();
		nameaccountrecovery = await NameAccountRecovery.deployed();
		namepublickey = await NamePublicKey.deployed();
		aosetting = await AOSetting.deployed();

		settingTAOId = await nameaccountrecovery.settingTAOId();

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "accountRecoveryLockDuration");
		accountRecoveryLockDuration = settingValues[0];

		// Create Name
		var result = await namefactory.createName("charlie", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account1
		});
		nameId1 = await namefactory.ethAddressToNameId(account1);

		result = await namefactory.createName("delta", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account2
		});
		nameId2 = await namefactory.ethAddressToNameId(account2);

		result = await namefactory.createName("echo", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account3
		});
		nameId3 = await namefactory.ethAddressToNameId(account3);

		// Mint Logos to nameId
		await logos.setWhitelist(theAO, true, { from: theAO });
		await logos.mint(nameId1, 10 ** 12, { from: theAO });
		await logos.mint(nameId2, 10 ** 12, { from: theAO });
		await logos.mint(nameId3, 10 ** 12, { from: theAO });

		result = await taofactory.createTAO(
			"Charlie's TAO",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			"somecontentid",
			nameId1,
			0,
			false,
			0,
			{
				from: account1
			}
		);
		var createTAOEvent = result.logs[0];
		taoId1 = createTAOEvent.args.taoId;

		// Set nameId2 as nameId1's Listener
		await nametaoposition.setListener(nameId1, nameId2, { from: account1 });

		// Set nameId3 as nameId1's Speaker
		await nametaoposition.setSpeaker(nameId1, nameId3, { from: account1 });
	});

	it("The AO - transferOwnership() - should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await nameaccountrecovery.transferOwnership(taoId1, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await nameaccountrecovery.transferOwnership(taoId1, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await nameaccountrecovery.theAO();
		assert.equal(newTheAO, taoId1, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - setWhitelist() should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await nameaccountrecovery.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await nameaccountrecovery.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await nameaccountrecovery.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
	});

	it("The AO - setNameFactoryAddress() should be able to set NameFactory address", async function() {
		var canSetAddress;
		try {
			await nameaccountrecovery.setNameFactoryAddress(namefactory.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameFactory address");

		try {
			await nameaccountrecovery.setNameFactoryAddress(namefactory.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameFactory address");

		var nameFactoryAddress = await nameaccountrecovery.nameFactoryAddress();
		assert.equal(nameFactoryAddress, namefactory.address, "Contract has incorrect nameFactoryAddress");
	});

	it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await nameaccountrecovery.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await nameaccountrecovery.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await nameaccountrecovery.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("The AO - setNamePublicKeyAddress() should be able to set NamePublicKey address", async function() {
		var canSetAddress;
		try {
			await nameaccountrecovery.setNamePublicKeyAddress(namepublickey.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NamePublicKey address");

		try {
			await nameaccountrecovery.setNamePublicKeyAddress(namepublickey.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NamePublicKey address");

		var namePublicKeyAddress = await nameaccountrecovery.namePublicKeyAddress();
		assert.equal(namePublicKeyAddress, namepublickey.address, "Contract has incorrect namePublicKeyAddress");
	});

	it("The AO - should be able to set settingTAOId", async function() {
		var canSetSettingTAOId;
		try {
			await nameaccountrecovery.setSettingTAOId(settingTAOId, { from: someAddress });
			canSetSettingTAOId = true;
		} catch (e) {
			canSetSettingTAOId = false;
		}
		assert.equal(canSetSettingTAOId, false, "Non-AO can set settingTAOId");

		try {
			await nameaccountrecovery.setSettingTAOId(settingTAOId, { from: account1 });
			canSetSettingTAOId = true;
		} catch (e) {
			canSetSettingTAOId = false;
		}
		assert.equal(canSetSettingTAOId, true, "The AO can't set settingTAOId");

		var _settingTAOId = await nameaccountrecovery.settingTAOId();
		assert.equal(_settingTAOId, settingTAOId, "Contract has incorrect settingTAOId");
	});

	it("The AO - should be able to set AOSetting address", async function() {
		var canSetAddress;
		try {
			await nameaccountrecovery.setAOSettingAddress(aosetting.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOSetting address");

		try {
			await nameaccountrecovery.setAOSettingAddress(aosetting.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOSetting address");

		var aoSettingAddress = await nameaccountrecovery.aoSettingAddress();
		assert.equal(aoSettingAddress, aosetting.address, "Contract has incorrect aoSettingAddress");
	});

	it("submitAccountRecovery() - only Listener of a Name can submit account recovery", async function() {
		var canSubmit;
		try {
			var result = await nameaccountrecovery.submitAccountRecovery(someAddress, { from: account2 });
			canSubmit = true;
		} catch (e) {
			canSubmit = false;
		}
		assert.equal(canSubmit, false, "Can submit account recovery for a non-Name");

		try {
			var result = await nameaccountrecovery.submitAccountRecovery(nameId1, { from: account1 });
			canSubmit = true;
		} catch (e) {
			canSubmit = false;
		}
		assert.equal(canSubmit, false, "Non-Listener can submit account recovery");

		var nonceBefore = await namefactory.nonces(nameId1);
		try {
			var result = await nameaccountrecovery.submitAccountRecovery(nameId1, { from: account2 });
			canSubmit = true;
		} catch (e) {
			canSubmit = false;
		}
		assert.equal(canSubmit, true, "Listener of Name can't submit account recovery");

		var nonceAfter = await namefactory.nonces(nameId1);
		assert.equal(nonceAfter.toNumber(), nonceBefore.plus(1).toNumber(), "Name has incorrect nonce");

		var accountRecovery = await nameaccountrecovery.getAccountRecovery(nameId1);
		assert.equal(accountRecovery[0], true, "getAccountRecovery() returns incorrect submitted status");
		assert.isAbove(accountRecovery[1].toNumber(), 0, "getAccountRecovery() returns incorrect submittedTimestamp value");
		assert.equal(
			accountRecovery[2].minus(accountRecovery[1]).toNumber(),
			accountRecoveryLockDuration.toNumber(),
			"getAccountRecovery() returns incorrect lockedUntilTimestamp value"
		);

		try {
			var result = await nameaccountrecovery.submitAccountRecovery(nameId1, { from: account2 });
			canSubmit = true;
		} catch (e) {
			canSubmit = false;
		}
		assert.equal(canSubmit, false, "Listener of Name can submit account recovery while current account recovery is still in flight");
	});

	it("isCompromised() - should check whether or not a Name is compromised", async function() {
		var canGet, isCompromised;
		try {
			isCompromised = await nameaccountrecovery.isCompromised(someAddress);
			canGet = true;
		} catch (e) {
			canGet = false;
		}
		assert.equal(canGet, false, "Can check isCompromised on a non-Name");

		isCompromised = await nameaccountrecovery.isCompromised(nameId1);
		assert.equal(isCompromised, true, "isCompromised() returns incorrect value");

		isCompromised = await nameaccountrecovery.isCompromised(nameId2);
		assert.equal(isCompromised, false, "isCompromised() returns incorrect value");

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.plus(100).toNumber());

		// If the time has passed the lockedUntilTimestamp, then the Name should be no longer compromised
		isCompromised = await nameaccountrecovery.isCompromised(nameId1);
		assert.equal(isCompromised, false, "isCompromised() returns incorrect value");

		//Re-submit account recovery again for the next test
		await nameaccountrecovery.submitAccountRecovery(nameId1, { from: account2 });
	});

	it("setNameNewAddress() - only Speaker of Name can set new address for Name", async function() {
		var canSet;

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.plus(100).toNumber());
		try {
			await nameaccountrecovery.setNameNewAddress(nameId1, account4, { from: account3 });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, false, "Speaker of Name can set Name's new address when account recovery has passed lockedUntilTimestamp");

		//Re-submit account recovery again for the next test
		await nameaccountrecovery.submitAccountRecovery(nameId1, { from: account2 });

		await helper.advanceTimeAndBlock(1000);

		try {
			await nameaccountrecovery.setNameNewAddress(someAddress, account4, { from: account3 });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, false, "Can set new address on non-Name");

		try {
			await nameaccountrecovery.setNameNewAddress(nameId1, account4, { from: account1 });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, false, "Non-Listener can set new address on Name");

		try {
			await nameaccountrecovery.setNameNewAddress(nameId1, account2, { from: account3 });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, false, "Listener can set new address that's already associated with a Name, on Name");

		var nonceBefore = await namefactory.nonces(nameId1);
		var isKeyExistBefore = await namepublickey.isKeyExist(nameId1, account4);
		try {
			await nameaccountrecovery.setNameNewAddress(nameId1, account4, { from: account3 });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, true, "Speaker of Name can't set Name's new address");

		var nonceAfter = await namefactory.nonces(nameId1);
		if (isKeyExistBefore) {
			assert.equal(nonceAfter.toNumber(), nonceBefore.plus(1).toNumber(), "Name has incorrect nonce");
		} else {
			assert.equal(nonceAfter.toNumber(), nonceBefore.plus(2).toNumber(), "Name has incorrect nonce");
		}

		var accountRecovery = await nameaccountrecovery.getAccountRecovery(nameId1);
		assert.equal(accountRecovery[0], false, "getAccountRecovery() returns incorrect submitted status");
		assert.equal(accountRecovery[1].toNumber(), 0, "getAccountRecovery() returns incorrect submittedTimestamp value");
		assert.equal(accountRecovery[2].toNumber(), 0, "getAccountRecovery() returns incorrect lockedUntilTimestamp value");

		var nameId = await namefactory.ethAddressToNameId(account4);
		assert.equal(nameId, nameId1, "ETH address has incorrect nameId");

		var ethAddress = await namefactory.nameIdToEthAddress(nameId1);
		assert.equal(ethAddress, account4, "Name ID has incorrect ETH addresss");

		var isKeyExistAfter = await namepublickey.isKeyExist(nameId1, account4);
		assert.equal(isKeyExistAfter, true, "Name is missing the new eth address as one of the public keys");
	});
});
