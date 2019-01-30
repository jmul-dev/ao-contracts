var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var Logos = artifacts.require("./Logos.sol");

var NameTAOLookup = artifacts.require("./NameTAOLookup.sol");

contract("NameTAOLookup", function(accounts) {
	var namefactory,
		taofactory,
		nametaoposition,
		logos,
		nameId1,
		nameId2,
		taoId1,
		taoId2,
		taoId3,
		nametaolookup,
		internalId1,
		internalId2,
		internalId3;

	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var someAddress = accounts[3];
	var whitelistedAddress = accounts[4];

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		logos = await Logos.deployed();
		nametaolookup = await NameTAOLookup.deployed();

		// Create Name
		var result = await namefactory.createName("charlie", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account1
		});
		nameId1 = await namefactory.ethAddressToNameId(account1);

		// Mint Logos to nameId
		await logos.setWhitelist(theAO, true, { from: theAO });
		await logos.mintToken(nameId1, 10 ** 12, { from: theAO });

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
	});

	it("The AO - transferOwnership() - should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await nametaolookup.transferOwnership(taoId1, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await nametaolookup.transferOwnership(taoId1, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await nametaolookup.theAO();
		assert.equal(newTheAO, taoId1, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - setWhitelist() should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await nametaolookup.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await nametaolookup.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await nametaolookup.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
	});

	it("The AO - setNameFactoryAddress() should be able to set NameFactory address", async function() {
		var canSetAddress;
		try {
			await nametaolookup.setNameFactoryAddress(namefactory.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameFactory address");

		try {
			await nametaolookup.setNameFactoryAddress(namefactory.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameFactory address");

		var nameFactoryAddress = await nametaolookup.nameFactoryAddress();
		assert.equal(nameFactoryAddress, namefactory.address, "Contract has incorrect nameFactoryAddress");
	});

	it("The AO - setTAOFactoryAddress() should be able to set TAOFactory address", async function() {
		var canSetAddress;
		try {
			await nametaolookup.setTAOFactoryAddress(taofactory.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set TAOFactory address");

		try {
			await nametaolookup.setTAOFactoryAddress(taofactory.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set TAOFactory address");

		var taoFactoryAddress = await nametaolookup.taoFactoryAddress();
		assert.equal(taoFactoryAddress, taofactory.address, "Contract has incorrect taoFactoryAddress");
	});

	it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await nametaolookup.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await nametaolookup.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await nametaolookup.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("initialize() - only NameFactory/TAOFactory can initialize NameTAOInfo for a Name/TAO", async function() {
		var totalNamesBefore = await nametaolookup.totalNames();

		// Create Name
		var result = await namefactory.createName("delta", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account2
		});
		nameId2 = await namefactory.ethAddressToNameId(account2);
		await logos.mintToken(nameId2, 10 ** 12, { from: theAO });

		var isExist = await nametaolookup.isExist("delta");
		assert.equal(isExist, true, "isExist() returns incorrect value");

		internalId1 = await nametaolookup.internalId();

		var totalNamesAfter = await nametaolookup.totalNames();
		assert.equal(totalNamesAfter.toNumber(), totalNamesBefore.plus(1).toNumber(), "Contract has incorrect totalNames value");

		var totalTAOsBefore = await nametaolookup.totalTAOs();

		result = await taofactory.createTAO(
			"Delta's TAO #1",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			"somecontentid",
			nameId2,
			0,
			false,
			0,
			{
				from: account2
			}
		);
		var createTAOEvent = result.logs[0];
		taoId2 = createTAOEvent.args.taoId;

		var totalTAOsAfter = await nametaolookup.totalTAOs();
		assert.equal(totalTAOsAfter.toNumber(), totalTAOsBefore.plus(1).toNumber(), "Contract has incorrect totalTAOs value");

		isExist = await nametaolookup.isExist("Delta's TAO #1");
		assert.equal(isExist, true, "isExist() returns incorrect value");

		internalId2 = await nametaolookup.internalId();

		totalTAOsBefore = await nametaolookup.totalTAOs();

		result = await taofactory.createTAO(
			"Delta's TAO #2",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			"somecontentid",
			taoId2,
			0,
			false,
			0,
			{
				from: account2
			}
		);
		createTAOEvent = result.logs[0];
		taoId3 = createTAOEvent.args.taoId;

		totalTAOsAfter = await nametaolookup.totalTAOs();
		assert.equal(totalTAOsAfter.toNumber(), totalTAOsBefore.plus(1).toNumber(), "Contract has incorrect totalTAOs value");

		isExist = await nametaolookup.isExist("Delta's TAO #2");
		assert.equal(isExist, true, "isExist() returns incorrect value");

		internalId3 = await nametaolookup.internalId();
	});

	it("getByName() - should get NameTAOInfo given a name", async function() {
		var canGetName, getByName;
		try {
			getByName = await nametaolookup.getByName("somename");
			canGetName = true;
		} catch (e) {
			canGetName = false;
		}
		assert.equal(canGetName, false, "Can getByName() of non-existing name");

		getByName = await nametaolookup.getByName("delta");
		assert.equal(getByName[0], "delta", "getByName() returns incorrect name");
		assert.equal(getByName[1], nameId2, "getByName() returns incorrect nameTAOId");
		assert.equal(getByName[2], "human", "getByName() returns incorrect parentName");
		assert.equal(getByName[3].toNumber(), 1, "getByName() returns incorrect typeId");

		getByName = await nametaolookup.getByName("Delta's TAO #1");
		assert.equal(getByName[0], "Delta's TAO #1", "getByName() returns incorrect name");
		assert.equal(getByName[1], taoId2, "getByName() returns incorrect nameTAOId");
		assert.equal(getByName[2], "delta", "getByName() returns incorrect parentName");
		assert.equal(getByName[3].toNumber(), 0, "getByName() returns incorrect typeId");

		getByName = await nametaolookup.getByName("Delta's TAO #2");
		assert.equal(getByName[0], "Delta's TAO #2", "getByName() returns incorrect name");
		assert.equal(getByName[1], taoId3, "getByName() returns incorrect nameTAOId");
		assert.equal(getByName[2], "Delta's TAO #1", "getByName() returns incorrect parentName");
		assert.equal(getByName[3].toNumber(), 0, "getByName() returns incorrect typeId");
	});

	it("getByInternalId() - should get NameTAOInfo given an internal ID", async function() {
		var canGetByInternalId, getByInternalId;
		try {
			getByInternalId = await nametaolookup.getByInternalId(100);
			canGetByInternalId = true;
		} catch (e) {
			canGetByInternalId = false;
		}
		assert.equal(canGetByInternalId, false, "Can getByInternalId() of non-existing internal ID");

		getByInternalId = await nametaolookup.getByInternalId(internalId1.toNumber());
		assert.equal(getByInternalId[0], "delta", "getByInternalId() returns incorrect name");
		assert.equal(getByInternalId[1], nameId2, "getByInternalId() returns incorrect nameTAOId");
		assert.equal(getByInternalId[2], "human", "getByInternalId() returns incorrect parentName");
		assert.equal(getByInternalId[3].toNumber(), 1, "getByInternalId() returns incorrect typeId");

		getByInternalId = await nametaolookup.getByInternalId(internalId2.toNumber());
		assert.equal(getByInternalId[0], "Delta's TAO #1", "getByInternalId() returns incorrect name");
		assert.equal(getByInternalId[1], taoId2, "getByInternalId() returns incorrect nameTAOId");
		assert.equal(getByInternalId[2], "delta", "getByInternalId() returns incorrect parentName");
		assert.equal(getByInternalId[3].toNumber(), 0, "getByInternalId() returns incorrect typeId");

		getByInternalId = await nametaolookup.getByInternalId(internalId3.toNumber());
		assert.equal(getByInternalId[0], "Delta's TAO #2", "getByInternalId() returns incorrect name");
		assert.equal(getByInternalId[1], taoId3, "getByInternalId() returns incorrect nameTAOId");
		assert.equal(getByInternalId[2], "Delta's TAO #1", "getByInternalId() returns incorrect parentName");
		assert.equal(getByInternalId[3].toNumber(), 0, "getByInternalId() returns incorrect typeId");
	});

	it("getNameTAOIdByName() - should return Name/TAO ID given a name", async function() {
		var canGetNameTAOIdByName, getNameTAOIdByName;
		try {
			getNameTAOIdByName = await nametaolookup.getNameTAOIdByName("somename");
			canGetNameTAOIdByName = true;
		} catch (e) {
			canGetNameTAOIdByName = false;
		}
		assert.equal(canGetNameTAOIdByName, false, "Can getNameTAOIdByName() of non-existing name");

		getNameTAOIdByName = await nametaolookup.getNameTAOIdByName("delta");
		assert.equal(getNameTAOIdByName, nameId2, "getNameTAOIdByName() returns incorrect Name/TAO ID");

		getNameTAOIdByName = await nametaolookup.getNameTAOIdByName("Delta's TAO #1");
		assert.equal(getNameTAOIdByName, taoId2, "getNameTAOIdByName() returns incorrect Name/TAO ID");

		getNameTAOIdByName = await nametaolookup.getNameTAOIdByName("Delta's TAO #2");
		assert.equal(getNameTAOIdByName, taoId3, "getNameTAOIdByName() returns incorrect Name/TAO ID");
	});
});
