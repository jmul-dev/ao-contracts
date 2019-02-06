var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var Logos = artifacts.require("./Logos.sol");
var NameTAOLookup = artifacts.require("./NameTAOLookup.sol");
var TAOAncestry = artifacts.require("./TAOAncestry.sol");
var TAOPool = artifacts.require("./TAOPool.sol");
var AOSetting = artifacts.require("./AOSetting.sol");
var NameTAOVault = artifacts.require("./NameTAOVault.sol");
var NameAccountRecovery = artifacts.require("./NameAccountRecovery.sol");

var EthCrypto = require("eth-crypto");
var helper = require("./helpers/truffleTestHelper");

contract("TAOFactory", function(accounts) {
	var namefactory,
		taofactory,
		nametaoposition,
		logos,
		nametaolookup,
		taoancestry,
		taopool,
		aosetting,
		nametaovault,
		nameaccountrecovery,
		settingTAOId,
		nameId1,
		nameId2,
		nameId3,
		nameId4,
		taoId1,
		taoId2,
		taoId3,
		taoId4,
		accountRecoveryLockDuration;

	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var account4 = accounts[4];
	var someAddress = accounts[3];
	var whitelistedAddress = accounts[4];
	var emptyAddress = "0x0000000000000000000000000000000000000000";

	// Retrieve private key from ganache
	var account1PrivateKey = "0xfa372b56eac0e71de587267f0a59989719b2325aeb4579912379641cf93ccaab";
	var account2PrivateKey = "0x6a35c58d0acad0ceca9c03d37aa2d2288d70afe0690f5e5f5e05aeab93b95dad";
	var account3PrivateKey = "0xf4bab2d2f0c5119cc6aad0735bbf0a017d229cbf430c0041af382b93e713a1c3";
	var account4PrivateKey = "0xfc164bb116857e2b7e5bafb6f515c61cc2cddae22a052c3988c8ff5de598ede0";

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		logos = await Logos.deployed();
		nametaolookup = await NameTAOLookup.deployed();
		taoancestry = await TAOAncestry.deployed();
		taopool = await TAOPool.deployed();
		aosetting = await AOSetting.deployed();
		nametaovault = await NameTAOVault.deployed();
		nameaccountrecovery = await NameAccountRecovery.deployed();

		settingTAOId = await taofactory.settingTAOId();

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

		result = await namefactory.createName("foxtrot", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account4
		});
		nameId4 = await namefactory.ethAddressToNameId(account4);

		// Mint Logos to nameId
		await logos.setWhitelist(theAO, true, { from: theAO });
		await logos.mint(nameId1, 10 ** 12, { from: theAO });

		result = await taofactory.createTAO(
			"Charlie's TAO",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			"somecontentid",
			nameId1,
			10,
			false,
			0,
			{
				from: account1
			}
		);
		var createTAOEvent = result.logs[0];
		taoId1 = createTAOEvent.args.taoId;

		await nametaoposition.setListener(nameId2, nameId3, { from: account2 });
	});

	var createSignature = function(privateKey, data, nonce) {
		var signHash = EthCrypto.hash.keccak256([
			{
				type: "address",
				value: taofactory.address
			},
			{
				type: "string",
				value: data
			},
			{
				type: "uint256",
				value: nonce
			}
		]);

		var signature = EthCrypto.sign(privateKey, signHash);
		return signature;
	};

	it("The AO - transferOwnership() should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await taofactory.transferOwnership(taoId1, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await taofactory.transferOwnership(taoId1, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await taofactory.theAO();
		assert.equal(newTheAO, taoId1, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - setWhitelist() should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await taofactory.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await taofactory.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await taofactory.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
	});

	it("The AO - setNameFactoryAddress() should be able to set NameFactory address", async function() {
		var canSetAddress;
		try {
			await taofactory.setNameFactoryAddress(namefactory.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameFactory address");

		try {
			await taofactory.setNameFactoryAddress(namefactory.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameFactory address");

		var nameFactoryAddress = await taofactory.nameFactoryAddress();
		assert.equal(nameFactoryAddress, namefactory.address, "Contract has incorrect nameFactoryAddress");
	});

	it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await taofactory.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await taofactory.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await taofactory.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("The AO - setNameTAOLookupAddress() should be able to set NameTAOLookup address", async function() {
		var canSetAddress;
		try {
			await taofactory.setNameTAOLookupAddress(nametaolookup.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOLookup address");

		try {
			await taofactory.setNameTAOLookupAddress(nametaolookup.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOLookup address");

		var nameTAOLookupAddress = await taofactory.nameTAOLookupAddress();
		assert.equal(nameTAOLookupAddress, nametaolookup.address, "Contract has incorrect nameTAOLookupAddress");
	});

	it("The AO - setAOSettingAddress() should be able to set AOSetting address", async function() {
		var canSetAddress;
		try {
			await taofactory.setAOSettingAddress(aosetting.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOSetting address");

		try {
			await taofactory.setAOSettingAddress(aosetting.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOSetting address");

		var aoSettingAddress = await taofactory.aoSettingAddress();
		assert.equal(aoSettingAddress, aosetting.address, "Contract has incorrect aoSettingAddress");
	});

	it("The AO - setLogosAddress() should be able to set Logos address", async function() {
		var canSetAddress;
		try {
			await taofactory.setLogosAddress(logos.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set Logos address");

		try {
			await taofactory.setLogosAddress(logos.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set Logos address");

		var logosAddress = await taofactory.logosAddress();
		assert.equal(logosAddress, logos.address, "Contract has incorrect logosAddress");
	});

	it("The AO - setNameTAOVaultAddress() should be able to set NameTAOVault address", async function() {
		var canSetAddress;
		try {
			await taofactory.setNameTAOVaultAddress(nametaovault.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOVault address");

		try {
			await taofactory.setNameTAOVaultAddress(nametaovault.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOVault address");

		var nameTAOVaultAddress = await taofactory.nameTAOVaultAddress();
		assert.equal(nameTAOVaultAddress, nametaovault.address, "Contract has incorrect nameTAOVaultAddress");
	});

	it("The AO - setTAOAncestryAddress() should be able to set TAOAncestry address", async function() {
		var canSetAddress;
		try {
			await taofactory.setTAOAncestryAddress(taoancestry.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set TAOAncestry address");

		try {
			await taofactory.setTAOAncestryAddress(taoancestry.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set TAOAncestry address");

		var taoAncestryAddress = await taofactory.taoAncestryAddress();
		assert.equal(taoAncestryAddress, taoancestry.address, "Contract has incorrect taoAncestryAddress");
	});

	it("The AO - setSettingTAOId() should be able to set settingTAOId", async function() {
		var canSet;
		try {
			await taofactory.setSettingTAOId(settingTAOId, { from: someAddress });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, false, "Non-AO can set settingTAOId");

		try {
			await taofactory.setSettingTAOId(settingTAOId, { from: account1 });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, true, "The AO can't set settingTAOId");

		var _settingTAOId = await taofactory.settingTAOId();
		assert.equal(_settingTAOId, settingTAOId, "Contract has incorrect settingTAOId");
	});

	it("The AO - setTAOPoolAddress() should be able to set TAOPool address", async function() {
		var canSetAddress;
		try {
			await taofactory.setTAOPoolAddress(taopool.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set TAOPool address");

		try {
			await taofactory.setTAOPoolAddress(taopool.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set TAOPool address");

		var taoPoolAddress = await taofactory.taoPoolAddress();
		assert.equal(taoPoolAddress, taopool.address, "Contract has incorrect taoPoolAddress");
	});

	it("The AO - setNameAccountRecoveryAddress() should be able to set NameAccountRecovery address", async function() {
		var canSetAddress;
		try {
			await taofactory.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameAccountRecovery address");

		try {
			await taofactory.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameAccountRecovery address");

		var nameAccountRecoveryAddress = await taofactory.nameAccountRecoveryAddress();
		assert.equal(nameAccountRecoveryAddress, nameaccountrecovery.address, "Contract has incorrect nameAccountRecoveryAddress");
	});

	it("incrementNonce() - only allowed address can update TAO's nonce", async function() {
		var canIncrementNonce;
		try {
			await taofactory.incrementNonce(taoId1, { from: someAddress });
			canIncrementNonce = true;
		} catch (e) {
			canIncrementNonce = false;
		}
		assert.equal(canIncrementNonce, false, "Address that is not in the allowed list can increment TAO's nonce");
	});

	it("createTAO() - should be able to create TAO", async function() {
		var canCreateTAO, createTAOEvent, taoId;
		try {
			var result = await taofactory.createTAO(
				"",
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
			canCreateTAO = true;
		} catch (e) {
			canCreateTAO = false;
		}
		assert.equal(canCreateTAO, false, "Name can create TAO with invalid name");

		try {
			var result = await taofactory.createTAO(
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
			canCreateTAO = true;
		} catch (e) {
			canCreateTAO = false;
		}
		assert.equal(canCreateTAO, false, "Name can create TAO with name that is already taken");

		try {
			var result = await taofactory.createTAO(
				"sometao",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				"somecontentid",
				nameId1,
				0,
				false,
				0,
				{
					from: account3
				}
			);
			canCreateTAO = true;
		} catch (e) {
			canCreateTAO = false;
		}
		assert.equal(canCreateTAO, false, "Non-Name can create TAO");

		try {
			var result = await taofactory.createTAO(
				"Delta's TAO",
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
			canCreateTAO = true;
		} catch (e) {
			canCreateTAO = false;
		}
		assert.equal(canCreateTAO, false, "Name with not enough logos can create TAO - logos < createChildTAOMinLogos setting");

		try {
			var result = await taofactory.createTAO(
				"Delta's TAO",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				"somecontentid",
				taoId1,
				0,
				false,
				0,
				{
					from: account2
				}
			);
			canCreateTAO = true;
		} catch (e) {
			canCreateTAO = false;
		}
		assert.equal(canCreateTAO, false, "Name with not enough logos can create TAO - logos < parent TAO's childMinLogos");

		await logos.mint(nameId2, 10 ** 12, { from: theAO });

		// Listener submit account recovery for nameId2
		await nameaccountrecovery.submitAccountRecovery(nameId2, { from: account3 });

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		try {
			var result = await taofactory.createTAO(
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
			createTAOEvent = result.logs[0];
			taoId2 = createTAOEvent.args.taoId;
			canCreateTAO = true;
		} catch (e) {
			createTAOEvent = null;
			taoId2 = null;
			canCreateTAO = false;
		}
		assert.equal(canCreateTAO, false, "Compromised Name can create TAO");

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.plus(100).toNumber());

		// Add a TAO
		var totalTAOsCountBefore = await taofactory.getTotalTAOsCount();
		try {
			var result = await taofactory.createTAO(
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
			createTAOEvent = result.logs[0];
			taoId2 = createTAOEvent.args.taoId;
			canCreateTAO = true;
		} catch (e) {
			createTAOEvent = null;
			taoId2 = null;
			canCreateTAO = false;
		}
		assert.equal(canCreateTAO, true, "Name can't create TAO");

		var totalTAOsCountAfter = await taofactory.getTotalTAOsCount();
		assert.equal(
			totalTAOsCountAfter.toNumber(),
			totalTAOsCountBefore.plus(1).toNumber(),
			"getTotalTAOsCount() returns incorrect value"
		);

		var isExist = await nametaolookup.isExist("Delta's TAO #1");
		assert.equal(isExist, true, "TAO creation is missing NameTAOLookup initialization");

		isExist = await nametaoposition.isExist(taoId2);
		assert.equal(isExist, true, "TAO creation is missing NameTAOPosition initialization");

		isExist = await taoancestry.isExist(taoId2);
		assert.equal(isExist, true, "TAO creation is missing TAOAncestry initialization");

		isExist = await taopool.isExist(taoId2);
		assert.equal(isExist, true, "TAO creation is missing TAOPool initialization");

		var getTAO = await taofactory.getTAO(taoId2);
		assert.equal(getTAO[0], "Delta's TAO #1", "getTAO() returns incorrect name");
		assert.equal(getTAO[1], nameId2, "getTAO() returns incorrect originId");
		assert.equal(getTAO[2], "delta", "getTAO() returns incorrect Name's name");
		assert.equal(getTAO[3], "somedathash", "getTAO() returns incorrect datHash");
		assert.equal(getTAO[4], "somedatabase", "getTAO() returns incorrect database");
		assert.equal(getTAO[5], "somekeyvalue", "getTAO() returns incorrect keyValue");
		assert.equal(web3.toAscii(getTAO[6]).replace(/\0/g, ""), "somecontentid", "getTAO() returns incorrect contentId");
		assert.equal(getTAO[7].toNumber(), 0, "getTAO() returns incorrect typeId");

		var taoIds = await taofactory.getTAOIds(0, totalTAOsCountAfter.toNumber());
		assert.include(taoIds, taoId2, "getTAOIds() is missing a TAO ID");

		// Add a child TAO
		totalTAOsCountBefore = await taofactory.getTotalTAOsCount();
		try {
			var result = await taofactory.createTAO(
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
			canCreateTAO = true;
		} catch (e) {
			createTAOEvent = null;
			taoId3 = null;
			canCreateTAO = false;
		}
		assert.equal(canCreateTAO, true, "Name can't create TAO");

		totalTAOsCountAfter = await taofactory.getTotalTAOsCount();
		assert.equal(
			totalTAOsCountAfter.toNumber(),
			totalTAOsCountBefore.plus(1).toNumber(),
			"getTotalTAOsCount() returns incorrect value"
		);

		isExist = await nametaolookup.isExist("Delta's TAO #2");
		assert.equal(isExist, true, "TAO creation is missing NameTAOLookup initialization");

		isExist = await nametaoposition.isExist(taoId3);
		assert.equal(isExist, true, "TAO creation is missing NameTAOPosition initialization");

		isExist = await taoancestry.isExist(taoId3);
		assert.equal(isExist, true, "TAO creation is missing TAOAncestry initialization");

		isExist = await taopool.isExist(taoId3);
		assert.equal(isExist, true, "TAO creation is missing TAOPool initialization");

		getTAO = await taofactory.getTAO(taoId3);
		assert.equal(getTAO[0], "Delta's TAO #2", "getTAO() returns incorrect name");
		assert.equal(getTAO[1], nameId2, "getTAO() returns incorrect originId");
		assert.equal(getTAO[2], "delta", "getTAO() returns incorrect Name's name");
		assert.equal(getTAO[3], "somedathash", "getTAO() returns incorrect datHash");
		assert.equal(getTAO[4], "somedatabase", "getTAO() returns incorrect database");
		assert.equal(getTAO[5], "somekeyvalue", "getTAO() returns incorrect keyValue");
		assert.equal(web3.toAscii(getTAO[6]).replace(/\0/g, ""), "somecontentid", "getTAO() returns incorrect contentId");
		assert.equal(getTAO[7].toNumber(), 0, "getTAO() returns incorrect typeId");

		taoIds = await taofactory.getTAOIds(0, totalTAOsCountAfter.toNumber());
		assert.include(taoIds, taoId3, "getTAOIds() is missing a TAO ID");

		var isChild = await taoancestry.isChild(taoId2, taoId3);
		assert.equal(isChild, true, "isChild() returns incorrect value");

		var isNotApprovedChild = await taoancestry.isNotApprovedChild(taoId2, taoId3);
		assert.equal(isNotApprovedChild, false, "isNotApprovedChild() returns incorrect value");

		// Add a non-approved child TAO
		totalTAOsCountBefore = await taofactory.getTotalTAOsCount();
		try {
			var result = await taofactory.createTAO(
				"Delta's TAO #3",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				"somecontentid",
				taoId1,
				0,
				false,
				0,
				{
					from: account2
				}
			);
			createTAOEvent = result.logs[0];
			taoId4 = createTAOEvent.args.taoId;
			canCreateTAO = true;
		} catch (e) {
			createTAOEvent = null;
			taoId4 = null;
			canCreateTAO = false;
		}
		assert.equal(canCreateTAO, true, "Name can't create TAO");

		totalTAOsCountAfter = await taofactory.getTotalTAOsCount();
		assert.equal(
			totalTAOsCountAfter.toNumber(),
			totalTAOsCountBefore.plus(1).toNumber(),
			"getTotalTAOsCount() returns incorrect value"
		);

		isExist = await nametaolookup.isExist("Delta's TAO #3");
		assert.equal(isExist, true, "TAO creation is missing NameTAOLookup initialization");

		isExist = await nametaoposition.isExist(taoId4);
		assert.equal(isExist, true, "TAO creation is missing NameTAOPosition initialization");

		isExist = await taoancestry.isExist(taoId4);
		assert.equal(isExist, true, "TAO creation is missing TAOAncestry initialization");

		isExist = await taopool.isExist(taoId4);
		assert.equal(isExist, true, "TAO creation is missing TAOPool initialization");

		getTAO = await taofactory.getTAO(taoId4);
		assert.equal(getTAO[0], "Delta's TAO #3", "getTAO() returns incorrect name");
		assert.equal(getTAO[1], nameId2, "getTAO() returns incorrect originId");
		assert.equal(getTAO[2], "delta", "getTAO() returns incorrect Name's name");
		assert.equal(getTAO[3], "somedathash", "getTAO() returns incorrect datHash");
		assert.equal(getTAO[4], "somedatabase", "getTAO() returns incorrect database");
		assert.equal(getTAO[5], "somekeyvalue", "getTAO() returns incorrect keyValue");
		assert.equal(web3.toAscii(getTAO[6]).replace(/\0/g, ""), "somecontentid", "getTAO() returns incorrect contentId");
		assert.equal(getTAO[7].toNumber(), 0, "getTAO() returns incorrect typeId");

		taoIds = await taofactory.getTAOIds(0, totalTAOsCountAfter.toNumber());
		assert.include(taoIds, taoId4, "getTAOIds() is missing a TAO ID");

		isChild = await taoancestry.isChild(taoId1, taoId4);
		assert.equal(isChild, false, "isChild() returns incorrect value");

		isNotApprovedChild = await taoancestry.isNotApprovedChild(taoId1, taoId4);
		assert.equal(isNotApprovedChild, true, "isNotApprovedChild() returns incorrect value");
	});

	it("validateTAOSignature() - should be able to validate a Name's signature", async function() {
		var verifyInvalidSignature = function(isValid) {
			assert.equal(isValid[0], false, "validateTAOSignature() returns incorrect isValid value");
			assert.equal(isValid[1], "", "validateTAOSignature() returns incorrect Name's name that created the signature");
			assert.equal(isValid[2].toNumber(), 0, "validateTAOSignature() returns incorrect Name's name that created the signature");
		};

		var data = "somedata";
		var nonce = await taofactory.nonces(taoId2);

		var signature = createSignature(account2PrivateKey, data, nonce.plus(1).toNumber());
		var vrs = EthCrypto.vrs.fromString(signature);

		var canValidate, isValid;
		try {
			isValid = await taofactory.validateTAOSignature(data, nonce.plus(1).toNumber(), account2, "somename", vrs.v, vrs.r, vrs.s);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		assert.equal(canValidate, false, "Can validate signature of a non-existing name");

		signature = createSignature(account2PrivateKey, data, nonce.toNumber());
		vrs = EthCrypto.vrs.fromString(signature);
		try {
			isValid = await taofactory.validateTAOSignature(data, nonce.toNumber(), account2, "Delta's TAO #1", vrs.v, vrs.r, vrs.s);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		// Incorrect nonce
		verifyInvalidSignature(isValid);

		signature = createSignature(account1PrivateKey, data, nonce.plus(1).toNumber());
		vrs = EthCrypto.vrs.fromString(signature);
		try {
			isValid = await taofactory.validateTAOSignature(
				data,
				nonce.plus(1).toNumber(),
				account2,
				"Delta's TAO #1",
				vrs.v,
				vrs.r,
				vrs.s
			);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		// signatureAddress != validateAddress
		verifyInvalidSignature(isValid);

		signature = createSignature(account1PrivateKey, data, nonce.plus(1).toNumber());
		vrs = EthCrypto.vrs.fromString(signature);
		try {
			isValid = await taofactory.validateTAOSignature(
				data,
				nonce.plus(1).toNumber(),
				account1,
				"Delta's TAO #1",
				vrs.v,
				vrs.r,
				vrs.s
			);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		// validateAddress is not any of TAO's Position
		verifyInvalidSignature(isValid);

		signature = createSignature(account1PrivateKey, data, nonce.plus(1).toNumber());
		vrs = EthCrypto.vrs.fromString(signature);
		try {
			isValid = await taofactory.validateTAOSignature(
				data,
				nonce.plus(1).toNumber(),
				emptyAddress,
				"Delta's TAO #1",
				vrs.v,
				vrs.r,
				vrs.s
			);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		// signatureAddress is not any of TAO's Position
		verifyInvalidSignature(isValid);

		signature = createSignature(account2PrivateKey, data, nonce.plus(1).toNumber());
		vrs = EthCrypto.vrs.fromString(signature);
		try {
			isValid = await taofactory.validateTAOSignature(
				data,
				nonce.plus(1).toNumber(),
				account2,
				"Delta's TAO #1",
				vrs.v,
				vrs.r,
				vrs.s
			);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		// signatureAddress == validateAddress and validateAddress is one of TAO's Position
		assert.equal(isValid[0], true, "validateTAOSignature() returns incorrect isValid value");
		assert.equal(isValid[1], "delta", "validateTAOSignature() returns incorrect Name's name that created the signature");
		assert.equal(isValid[2].toNumber(), 1, "validateTAOSignature() returns incorrect Name's name that created the signature");

		signature = createSignature(account2PrivateKey, data, nonce.plus(1).toNumber());
		vrs = EthCrypto.vrs.fromString(signature);
		try {
			isValid = await taofactory.validateTAOSignature(
				data,
				nonce.plus(1).toNumber(),
				emptyAddress,
				"Delta's TAO #1",
				vrs.v,
				vrs.r,
				vrs.s
			);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		// signatureAddress is one of TAO's Position
		assert.equal(isValid[0], true, "validateTAOSignature() returns incorrect isValid value");
		assert.equal(isValid[1], "delta", "validateTAOSignature() returns incorrect Name's name that created the signature");
		assert.equal(isValid[2].toNumber(), 1, "validateTAOSignature() returns incorrect Name's name that created the signature");

		// Set nameId3 as taoId2's Listener
		await nametaoposition.setListener(taoId2, nameId3, { from: account2 });
		nonce = await taofactory.nonces(taoId2);

		signature = createSignature(account3PrivateKey, data, nonce.plus(1).toNumber());
		vrs = EthCrypto.vrs.fromString(signature);
		try {
			isValid = await taofactory.validateTAOSignature(
				data,
				nonce.plus(1).toNumber(),
				account3,
				"Delta's TAO #1",
				vrs.v,
				vrs.r,
				vrs.s
			);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		// signatureAddress == validateAddress and validateAddress is one of TAO's Position
		assert.equal(isValid[0], true, "validateTAOSignature() returns incorrect isValid value");
		assert.equal(isValid[1], "echo", "validateTAOSignature() returns incorrect Name's name that created the signature");
		assert.equal(isValid[2].toNumber(), 2, "validateTAOSignature() returns incorrect Name's name that created the signature");

		try {
			isValid = await taofactory.validateTAOSignature(
				data,
				nonce.plus(1).toNumber(),
				emptyAddress,
				"Delta's TAO #1",
				vrs.v,
				vrs.r,
				vrs.s
			);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		// signatureAddress is one of TAO's Position
		assert.equal(isValid[0], true, "validateTAOSignature() returns incorrect isValid value");
		assert.equal(isValid[1], "echo", "validateTAOSignature() returns incorrect Name's name that created the signature");
		assert.equal(isValid[2].toNumber(), 2, "validateTAOSignature() returns incorrect Name's name that created the signature");

		// Set nameId4 as taoId2's Speaker
		await nametaoposition.setSpeaker(taoId2, nameId4, { from: account2 });
		nonce = await taofactory.nonces(taoId2);

		signature = createSignature(account4PrivateKey, data, nonce.plus(1).toNumber());
		vrs = EthCrypto.vrs.fromString(signature);
		try {
			isValid = await taofactory.validateTAOSignature(
				data,
				nonce.plus(1).toNumber(),
				account4,
				"Delta's TAO #1",
				vrs.v,
				vrs.r,
				vrs.s
			);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		// signatureAddress == validateAddress and validateAddress is one of TAO's Position
		assert.equal(isValid[0], true, "validateTAOSignature() returns incorrect isValid value");
		assert.equal(isValid[1], "foxtrot", "validateTAOSignature() returns incorrect Name's name that created the signature");
		assert.equal(isValid[2].toNumber(), 3, "validateTAOSignature() returns incorrect Name's name that created the signature");

		try {
			isValid = await taofactory.validateTAOSignature(
				data,
				nonce.plus(1).toNumber(),
				emptyAddress,
				"Delta's TAO #1",
				vrs.v,
				vrs.r,
				vrs.s
			);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		// signatureAddress is one of TAO's Position
		assert.equal(isValid[0], true, "validateTAOSignature() returns incorrect isValid value");
		assert.equal(isValid[1], "foxtrot", "validateTAOSignature() returns incorrect Name's name that created the signature");
		assert.equal(isValid[2].toNumber(), 3, "validateTAOSignature() returns incorrect Name's name that created the signature");
	});
});
