var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var Logos = artifacts.require("./Logos.sol");

var AOSettingValue = artifacts.require("./AOSettingValue.sol");

contract("AOSettingValue", function(accounts) {
	var namefactory, taofactory, nametaoposition, logos, aosettingvalue, nameId, taoId;
	var theAO = accounts[0];
	var account1 = accounts[1];
	var whitelistedAddress = accounts[2];
	var someAddress = accounts[3];

	var settingId = 1000000000;
	var addressValue = accounts[4];
	var boolValue = true;
	var bytesValue = "bytes";
	var stringValue = "string";
	var uintValue = 10;

	var emptyAddress = "0x0000000000000000000000000000000000000000";

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		logos = await Logos.deployed();
		aosettingvalue = await AOSettingValue.deployed();

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
			await aosettingvalue.transferOwnership(taoId, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await aosettingvalue.transferOwnership(taoId, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await aosettingvalue.theAO();
		assert.equal(newTheAO, taoId, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - setWhitelist() should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await aosettingvalue.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await aosettingvalue.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await aosettingvalue.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
	});

	it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await aosettingvalue.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await aosettingvalue.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await aosettingvalue.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("Whitelisted address - setPendingValue() can set pending value", async function() {
		var canSetPendingValue;
		try {
			await aosettingvalue.setPendingValue(settingId, addressValue, boolValue, bytesValue, stringValue, uintValue, {
				from: someAddress
			});
			canSetPendingValue = true;
		} catch (e) {
			canSetPendingValue = false;
		}
		assert.equal(canSetPendingValue, false, "Non-whitelisted address can set pending value");

		try {
			await aosettingvalue.setPendingValue(settingId, addressValue, boolValue, bytesValue, stringValue, uintValue, {
				from: whitelistedAddress
			});
			canSetPendingValue = true;
		} catch (e) {
			canSetPendingValue = false;
		}
		assert.equal(canSetPendingValue, true, "Whitelisted address can't set pending value");

		var pendingValue = await aosettingvalue.pendingValue(settingId);
		assert.equal(pendingValue[0], addressValue, "pendingValue() returns incorrect addressValue");
		assert.equal(pendingValue[1], boolValue, "pendingValue() returns incorrect boolValue");
		assert.equal(web3.toAscii(pendingValue[2]).replace(/\0/g, ""), bytesValue, "pendingValue() returns incorrect bytesValue");
		assert.equal(pendingValue[3], stringValue, "pendingValue() returns incorrect stringValue");
		assert.equal(pendingValue[4].toNumber(), uintValue, "pendingValue() returns incorrect uintValue");
	});

	it("Whitelisted address - movePendingToSetting() can move value from pending to setting", async function() {
		var canMovePendingToSetting;
		try {
			await aosettingvalue.movePendingToSetting(settingId, { from: someAddress });
			canMovePendingToSetting = true;
		} catch (e) {
			canMovePendingToSetting = false;
		}
		assert.equal(canMovePendingToSetting, false, "Non-whitelisted address can move value from pending to setting");

		try {
			await aosettingvalue.movePendingToSetting(settingId, { from: whitelistedAddress });
			canMovePendingToSetting = true;
		} catch (e) {
			canMovePendingToSetting = false;
		}
		assert.equal(canMovePendingToSetting, true, "Whitelisted address can't move value from pending to setting");

		var settingValue = await aosettingvalue.settingValue(settingId);
		assert.equal(settingValue[0], addressValue, "settingValue() returns incorrect addressValue");
		assert.equal(settingValue[1], boolValue, "settingValue() returns incorrect boolValue");
		assert.equal(web3.toAscii(settingValue[2]).replace(/\0/g, ""), bytesValue, "settingValue() returns incorrect bytesValue");
		assert.equal(settingValue[3], stringValue, "settingValue() returns incorrect stringValue");
		assert.equal(settingValue[4].toNumber(), uintValue, "settingValue() returns incorrect uintValue");

		var pendingValue = await aosettingvalue.pendingValue(settingId);
		assert.equal(pendingValue[0], emptyAddress, "pendingValue() returns incorrect addressValue");
		assert.equal(pendingValue[1], false, "pendingValue() returns incorrect boolValue");
		assert.equal(web3.toAscii(pendingValue[2]).replace(/\0/g, ""), "", "pendingValue() returns incorrect bytesValue");
		assert.equal(pendingValue[3], "", "pendingValue() returns incorrect stringValue");
		assert.equal(pendingValue[4].toNumber(), 0, "pendingValue() returns incorrect uintValue");
	});
});
