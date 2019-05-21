var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var Logos = artifacts.require("./Logos.sol");

var TAOAncestry = artifacts.require("./TAOAncestry.sol");
var Pathos = artifacts.require("./Pathos.sol");
var Ethos = artifacts.require("./Ethos.sol");
var TAOPool = artifacts.require("./TAOPool.sol");
var AOSetting = artifacts.require("./AOSetting.sol");

var NameAccountRecovery = artifacts.require("./NameAccountRecovery.sol");

var EthCrypto = require("eth-crypto");
var helper = require("./helpers/truffleTestHelper");
var BN = require("bn.js");

contract("NameTAOPosition", function(accounts) {
	var namefactory,
		taofactory,
		nametaoposition,
		logos,
		taoancestry,
		pathos,
		ethos,
		taopool,
		aosetting,
		nameaccountrecovery,
		settingTAOId,
		challengeTAOAdvocateLockDuration,
		challengeTAOAdvocateCompleteDuration,
		accountRecoveryLockDuration,
		nameId1,
		nameId2,
		nameId3,
		nameId4,
		nameId5,
		taoId1,
		taoId2,
		taoId3,
		taoId4,
		taoId5,
		challengeId1,
		challengeId2,
		challengeId3;

	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var account4 = accounts[4];
	var account5 = accounts[5];
	var someAddress = accounts[6];
	var whitelistedAddress = accounts[7];

	var nameId1LocalWriterKey = EthCrypto.createIdentity();
	var nameId2LocalWriterKey = EthCrypto.createIdentity();
	var nameId3LocalWriterKey = EthCrypto.createIdentity();
	var nameId4LocalWriterKey = EthCrypto.createIdentity();
	var nameId5LocalWriterKey = EthCrypto.createIdentity();

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		logos = await Logos.deployed();
		taoancestry = await TAOAncestry.deployed();
		pathos = await Pathos.deployed();
		ethos = await Ethos.deployed();
		taopool = await TAOPool.deployed();
		aosetting = await AOSetting.deployed();
		nameaccountrecovery = await NameAccountRecovery.deployed();

		settingTAOId = await nametaoposition.settingTAOId();

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "challengeTAOAdvocateLockDuration");
		challengeTAOAdvocateLockDuration = settingValues[0];

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "challengeTAOAdvocateCompleteDuration");
		challengeTAOAdvocateCompleteDuration = settingValues[0];

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
			"echo",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			web3.utils.toHex("somecontentid"),
			nameId3LocalWriterKey.address,
			{
				from: account3
			}
		);
		nameId3 = await namefactory.ethAddressToNameId(account3);

		result = await namefactory.createName(
			"foxtrot",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			web3.utils.toHex("somecontentid"),
			nameId4LocalWriterKey.address,
			{
				from: account4
			}
		);
		nameId4 = await namefactory.ethAddressToNameId(account4);

		result = await namefactory.createName(
			"golf",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			web3.utils.toHex("somecontentid"),
			nameId5LocalWriterKey.address,
			{
				from: account5
			}
		);
		nameId5 = await namefactory.ethAddressToNameId(account5);

		// Mint Logos to nameId
		await logos.setWhitelist(theAO, true, { from: theAO });
		await logos.mint(nameId1, 10 ** 12, { from: theAO });
		await logos.mint(nameId3, 10 ** 12, { from: theAO });
		await logos.mint(nameId4, 10 ** 12, { from: theAO });
		await logos.mint(nameId5, 10 ** 12, { from: theAO });

		await pathos.setWhitelist(theAO, true, { from: theAO });
		await pathos.mint(nameId3, 10 ** 6, { from: theAO });
		await pathos.mint(nameId4, 10 ** 6, { from: theAO });
		await pathos.mint(nameId5, 10 ** 6, { from: theAO });

		await ethos.setWhitelist(theAO, true, { from: theAO });
		await ethos.mint(nameId3, 10 ** 6, { from: theAO });
		await ethos.mint(nameId4, 10 ** 6, { from: theAO });
		await ethos.mint(nameId5, 10 ** 6, { from: theAO });

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
		taoId1 = createTAOEvent.args.taoId;
	});

	var challengeTAOAdvocate = async function(taoId, account) {
		var totalTAOAdvocateChallengesBefore = await nametaoposition.totalTAOAdvocateChallenges();
		var challengerNameId = await namefactory.ethAddressToNameId(account);

		var canChallenge, challengeTAOAdvocateEvent, challengeId;
		try {
			var result = await nametaoposition.challengeTAOAdvocate(taoId, { from: account });
			challengeTAOAdvocateEvent = result.logs[0];
			challengeId = challengeTAOAdvocateEvent.args.challengeId;
			canChallenge = true;
		} catch (e) {
			challengeTAOAdvocateEvent = null;
			challengeId = null;
			canChallenge = false;
		}
		assert.equal(canChallenge, true, "Advocate with more Logos can't challenge current TAO's Advocate");

		var totalTAOAdvocateChallengesAfter = await nametaoposition.totalTAOAdvocateChallenges();
		assert.equal(
			totalTAOAdvocateChallengesAfter.toNumber(),
			totalTAOAdvocateChallengesBefore.add(new BN(1)).toNumber(),
			"Contract has incorrect totalTAOAdvocateChallenges value"
		);

		var getTAOAdvocateChallengeById = await nametaoposition.getTAOAdvocateChallengeById(challengeId);
		assert.equal(
			getTAOAdvocateChallengeById[0],
			challengerNameId,
			"getTAOAdvocateChallengeById() returns incorrect value for newAdvocateId"
		);
		assert.equal(getTAOAdvocateChallengeById[1], taoId, "getTAOAdvocateChallengeById() returns incorrect value for taoId");
		assert.equal(getTAOAdvocateChallengeById[2], false, "getTAOAdvocateChallengeById() returns incorrect value for completed status");
		assert.equal(
			getTAOAdvocateChallengeById[4],
			getTAOAdvocateChallengeById[3].add(challengeTAOAdvocateLockDuration).toNumber(),
			"getTAOAdvocateChallengeById() returns incorrect value for lockedUntilTimestamp"
		);
		assert.equal(
			getTAOAdvocateChallengeById[5],
			getTAOAdvocateChallengeById[4].add(challengeTAOAdvocateCompleteDuration).toNumber(),
			"getTAOAdvocateChallengeById() returns incorrect value for completeBeforeTimestamp"
		);
		return challengeId;
	};

	it("The AO - transferOwnership() - should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await nametaoposition.transferOwnership(taoId1, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await nametaoposition.transferOwnership(taoId1, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await nametaoposition.theAO();
		assert.equal(newTheAO, taoId1, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - setWhitelist() should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await nametaoposition.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await nametaoposition.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await nametaoposition.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
	});

	it("The AO - setNameFactoryAddress() should be able to set NameFactory address", async function() {
		var canSetAddress;
		try {
			await nametaoposition.setNameFactoryAddress(namefactory.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameFactory address");

		try {
			await nametaoposition.setNameFactoryAddress(namefactory.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameFactory address");

		var nameFactoryAddress = await nametaoposition.nameFactoryAddress();
		assert.equal(nameFactoryAddress, namefactory.address, "Contract has incorrect nameFactoryAddress");
	});

	it("The AO - setTAOFactoryAddress() should be able to set TAOFactory address", async function() {
		var canSetAddress;
		try {
			await nametaoposition.setTAOFactoryAddress(taofactory.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set TAOFactory address");

		try {
			await nametaoposition.setTAOFactoryAddress(taofactory.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set TAOFactory address");

		var taoFactoryAddress = await nametaoposition.taoFactoryAddress();
		assert.equal(taoFactoryAddress, taofactory.address, "Contract has incorrect taoFactoryAddress");
	});

	it("The AO - setSettingTAOId() should be able to set settingTAOId", async function() {
		var canSetSettingTAOId;
		try {
			await nametaoposition.setSettingTAOId(settingTAOId, { from: someAddress });
			canSetSettingTAOId = true;
		} catch (e) {
			canSetSettingTAOId = false;
		}
		assert.equal(canSetSettingTAOId, false, "Non-AO can set settingTAOId");

		try {
			await nametaoposition.setSettingTAOId(settingTAOId, { from: account1 });
			canSetSettingTAOId = true;
		} catch (e) {
			canSetSettingTAOId = false;
		}
		assert.equal(canSetSettingTAOId, true, "The AO can't set settingTAOId");

		var _settingTAOId = await nametaoposition.settingTAOId();
		assert.equal(_settingTAOId, settingTAOId, "Contract has incorrect settingTAOId");
	});

	it("The AO - setAOSettingAddress() should be able to set AOSetting address", async function() {
		var canSetAddress;
		try {
			await nametaoposition.setAOSettingAddress(aosetting.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOSetting address");

		try {
			await nametaoposition.setAOSettingAddress(aosetting.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOSetting address");

		var aoSettingAddress = await nametaoposition.aoSettingAddress();
		assert.equal(aoSettingAddress, aosetting.address, "Contract has incorrect aoSettingAddress");
	});

	it("The AO - setTAOAncestryAddress() should be able to set TAOAncestry address", async function() {
		var canSetAddress;
		try {
			await nametaoposition.setTAOAncestryAddress(taoancestry.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set TAOAncestry address");

		try {
			await nametaoposition.setTAOAncestryAddress(taoancestry.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set TAOAncestry address");

		var taoAncestryAddress = await nametaoposition.taoAncestryAddress();
		assert.equal(taoAncestryAddress, taoancestry.address, "Contract has incorrect taoAncestryAddress");
	});

	it("The AO - setLogosAddress() should be able to set Logos address", async function() {
		var canSetAddress;
		try {
			await nametaoposition.setLogosAddress(logos.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set Logos address");

		try {
			await nametaoposition.setLogosAddress(logos.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set Logos address");

		var logosAddress = await nametaoposition.logosAddress();
		assert.equal(logosAddress, logos.address, "Contract has incorrect logosAddress");
	});

	it("The AO - setNameAccountRecoveryAddress() should be able to set NameAccountRecovery address", async function() {
		var canSetAddress;
		try {
			await nametaoposition.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameAccountRecovery address");

		try {
			await nametaoposition.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameAccountRecovery address");

		var nameAccountRecoveryAddress = await nametaoposition.nameAccountRecoveryAddress();
		assert.equal(nameAccountRecoveryAddress, nameaccountrecovery.address, "Contract has incorrect nameAccountRecoveryAddress");
	});

	it("initialize() - only NameFactory/TAOFactory can initialize NameTAOPosition for a Name/TAO", async function() {
		// Create Name
		var result = await namefactory.createName(
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
		await logos.mint(nameId2, 10 ** 12, { from: theAO });

		var isExist = await nametaoposition.isExist(nameId2);
		assert.equal(isExist, true, "isExist() returns incorrect value");

		var getPositionById = await nametaoposition.getPositionById(nameId2);
		assert.equal(getPositionById[1], nameId2, "getPositionById() returns incorrect Advocate");
		assert.equal(getPositionById[3], nameId2, "getPositionById() returns incorrect Listener");
		assert.equal(getPositionById[5], nameId2, "getPositionById() returns incorrect Speaker");

		result = await taofactory.createTAO(
			"Delta's TAO #1",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			web3.utils.toHex("somecontentid"),
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

		isExist = await nametaoposition.isExist(taoId2);
		assert.equal(isExist, true, "isExist() returns incorrect value");

		var getPositionById = await nametaoposition.getPositionById(taoId2);
		assert.equal(getPositionById[1], nameId2, "getPositionById() returns incorrect Advocate");
		assert.equal(getPositionById[3], nameId2, "getPositionById() returns incorrect Listener");
		assert.equal(getPositionById[5], nameId2, "getPositionById() returns incorrect Speaker");
	});

	it("senderIsAdvocate() - should check whether or not the sender address is Advocate of a Name/TAO ID", async function() {
		var senderIsAdvocate = await nametaoposition.senderIsAdvocate(account1, nameId1);
		assert.equal(senderIsAdvocate, true, "senderIsAdvocate() returns incorrect value");

		senderIsAdvocate = await nametaoposition.senderIsAdvocate(account1, taoId1);
		assert.equal(senderIsAdvocate, true, "senderIsAdvocate() returns incorrect value");

		senderIsAdvocate = await nametaoposition.senderIsAdvocate(account2, nameId2);
		assert.equal(senderIsAdvocate, true, "senderIsAdvocate() returns incorrect value");

		senderIsAdvocate = await nametaoposition.senderIsAdvocate(account2, taoId2);
		assert.equal(senderIsAdvocate, true, "senderIsAdvocate() returns incorrect value");

		senderIsAdvocate = await nametaoposition.senderIsAdvocate(account1, nameId2);
		assert.equal(senderIsAdvocate, false, "senderIsAdvocate() returns incorrect value");

		senderIsAdvocate = await nametaoposition.senderIsAdvocate(account1, taoId2);
		assert.equal(senderIsAdvocate, false, "senderIsAdvocate() returns incorrect value");

		senderIsAdvocate = await nametaoposition.senderIsAdvocate(account2, nameId1);
		assert.equal(senderIsAdvocate, false, "senderIsAdvocate() returns incorrect value");

		senderIsAdvocate = await nametaoposition.senderIsAdvocate(account2, taoId1);
		assert.equal(senderIsAdvocate, false, "senderIsAdvocate() returns incorrect value");
	});

	it("senderIsAdvocateOfParent() - should check whether or not the sender address is Advocate of the Parent of a Name/TAO ID", async function() {
		var senderIsAdvocateOfParent;
		try {
			// Will fail because parentId of nameId1 is not a Name/TAO
			senderIsAdvocateOfParent = await nametaoposition.senderIsAdvocateOfParent(account1, nameId1);
		} catch (e) {
			senderIsAdvocateOfParent = false;
		}
		assert.equal(senderIsAdvocateOfParent, false, "senderIsAdvocateOfParent() returns incorrect value");

		senderIsAdvocateOfParent = await nametaoposition.senderIsAdvocateOfParent(account1, taoId1);
		assert.equal(senderIsAdvocateOfParent, true, "senderIsAdvocateOfParent() returns incorrect value");

		try {
			// Will fail because parentId of nameId2 is not a Name/TAO
			senderIsAdvocateOfParent = await nametaoposition.senderIsAdvocateOfParent(account2, nameId2);
		} catch (e) {
			senderIsAdvocateOfParent = false;
		}
		assert.equal(senderIsAdvocateOfParent, false, "senderIsAdvocateOfParent() returns incorrect value");

		senderIsAdvocateOfParent = await nametaoposition.senderIsAdvocateOfParent(account2, taoId2);
		assert.equal(senderIsAdvocateOfParent, true, "senderIsAdvocateOfParent() returns incorrect value");

		var result = await taofactory.createTAO(
			"Delta's TAO #2",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			web3.utils.toHex("somecontentid"),
			taoId2,
			0,
			false,
			0,
			{
				from: account2
			}
		);
		var createTAOEvent = result.logs[0];
		taoId3 = createTAOEvent.args.taoId;

		senderIsAdvocateOfParent = await nametaoposition.senderIsAdvocateOfParent(account2, taoId3);
		assert.equal(senderIsAdvocateOfParent, true, "senderIsAdvocateOfParent() returns incorrect value");

		result = await taofactory.createTAO(
			"Delta's TAO #3",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			web3.utils.toHex("somecontentid"),
			taoId2,
			0,
			false,
			0,
			{
				from: account3
			}
		);
		var createTAOEvent = result.logs[0];
		taoId4 = createTAOEvent.args.taoId;

		// Child is not yet approved
		senderIsAdvocateOfParent = await nametaoposition.senderIsAdvocateOfParent(account2, taoId4);
		assert.equal(senderIsAdvocateOfParent, false, "senderIsAdvocateOfParent() returns incorrect value");

		// Approve child TAO
		await taoancestry.approveChild(taoId2, taoId4, { from: account2 });

		senderIsAdvocateOfParent = await nametaoposition.senderIsAdvocateOfParent(account2, taoId4);
		assert.equal(senderIsAdvocateOfParent, true, "senderIsAdvocateOfParent() returns incorrect value");

		// Create another TAO for next testing
		result = await taofactory.createTAO(
			"Delta's TAO #4",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			web3.utils.toHex("somecontentid"),
			taoId2,
			0,
			false,
			0,
			{
				from: account4
			}
		);
		var createTAOEvent = result.logs[0];
		taoId5 = createTAOEvent.args.taoId;
	});

	it("nameIsAdvocate() - should check whether a Name ID is the Advocate of Name/TAO", async function() {
		var nameIsAdvocate = await nametaoposition.nameIsAdvocate(nameId1, nameId1);
		assert.equal(nameIsAdvocate, true, "nameIsAdvocate() returns incorrect value");

		nameIsAdvocate = await nametaoposition.nameIsAdvocate(nameId1, taoId1);
		assert.equal(nameIsAdvocate, true, "nameIsAdvocate() returns incorrect value");

		nameIsAdvocate = await nametaoposition.nameIsAdvocate(nameId2, nameId2);
		assert.equal(nameIsAdvocate, true, "nameIsAdvocate() returns incorrect value");

		nameIsAdvocate = await nametaoposition.nameIsAdvocate(nameId2, taoId2);
		assert.equal(nameIsAdvocate, true, "nameIsAdvocate() returns incorrect value");

		nameIsAdvocate = await nametaoposition.nameIsAdvocate(nameId1, nameId2);
		assert.equal(nameIsAdvocate, false, "nameIsAdvocate() returns incorrect value");

		nameIsAdvocate = await nametaoposition.nameIsAdvocate(nameId1, taoId2);
		assert.equal(nameIsAdvocate, false, "nameIsAdvocate() returns incorrect value");

		nameIsAdvocate = await nametaoposition.nameIsAdvocate(nameId2, nameId1);
		assert.equal(nameIsAdvocate, false, "nameIsAdvocate() returns incorrect value");

		nameIsAdvocate = await nametaoposition.nameIsAdvocate(nameId2, taoId1);
		assert.equal(nameIsAdvocate, false, "nameIsAdvocate() returns incorrect value");
	});

	it("setAdvocate() - only current Advocate of TAO can set a new Advocate", async function() {
		var canSetAdvocate;
		try {
			var result = await nametaoposition.setAdvocate(someAddress, nameId3, { from: account2 });
			canSetAdvocate = true;
		} catch (e) {
			canSetAdvocate = false;
		}
		assert.equal(canSetAdvocate, false, "Can set Advocate of a non-Name/TAO");

		try {
			var result = await nametaoposition.setAdvocate(nameId2, nameId3, { from: account2 });
			canSetAdvocate = true;
		} catch (e) {
			canSetAdvocate = false;
		}
		assert.equal(canSetAdvocate, false, "Current Advocate can set Advocate of a Name");

		try {
			var result = await nametaoposition.setAdvocate(taoId2, nameId3, { from: account3 });
			canSetAdvocate = true;
		} catch (e) {
			canSetAdvocate = false;
		}
		assert.equal(canSetAdvocate, false, "Non-Advocate of TAO can set Advocate of a TAO");

		try {
			var result = await nametaoposition.setAdvocate(taoId2, taoId1, { from: account2 });
			canSetAdvocate = true;
		} catch (e) {
			canSetAdvocate = false;
		}
		assert.equal(canSetAdvocate, false, "Current Advocate of TAO can set TAO as Advocate");

		// Test transfer advocated TAO logos
		// Stake Ethos on TAO
		var quantity = 100;
		var nameId2_totalAdvocatedTAOLogosBefore = await logos.totalAdvocatedTAOLogos(nameId2);
		var nameId2_advocatedTAOLogosBefore = await logos.advocatedTAOLogos(nameId2, taoId2);

		await taopool.stakeEthos(taoId2, quantity, { from: account3 });
		await taopool.stakePathos(taoId2, quantity, { from: account4 });

		var nameId2_totalAdvocatedTAOLogosAfter = await logos.totalAdvocatedTAOLogos(nameId2);
		var nameId2_advocatedTAOLogosAfter = await logos.advocatedTAOLogos(nameId2, taoId2);
		assert.equal(
			nameId2_totalAdvocatedTAOLogosAfter.toNumber(),
			nameId2_totalAdvocatedTAOLogosBefore.add(new BN(quantity)).toNumber(),
			"Name has incorrect totalAdvocatedTAOLogos"
		);
		assert.equal(
			nameId2_advocatedTAOLogosAfter.toNumber(),
			nameId2_advocatedTAOLogosBefore.add(new BN(quantity)).toNumber(),
			"Name has incorrect advocatedTAOLogos of a TAO"
		);

		nameId2_totalAdvocatedTAOLogosBefore = await logos.totalAdvocatedTAOLogos(nameId2);
		nameId2_advocatedTAOLogosBefore = await logos.advocatedTAOLogos(nameId2, taoId2);
		var nameId3_totalAdvocatedTAOLogosBefore = await logos.totalAdvocatedTAOLogos(nameId3);
		var nameId3_advocatedTAOLogosBefore = await logos.advocatedTAOLogos(nameId3, taoId2);

		// Listener submit account recovery for nameId3
		await nametaoposition.setListener(nameId3, nameId1, { from: account3 });
		await nameaccountrecovery.submitAccountRecovery(nameId3, { from: account1 });

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		try {
			var result = await nametaoposition.setAdvocate(taoId2, nameId3, { from: account2 });
			canSetAdvocate = true;
		} catch (e) {
			canSetAdvocate = false;
		}
		assert.equal(canSetAdvocate, false, "Advocate can set new Advocate using a compromised Name");

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

		// Listener submit account recovery for nameId2
		await nametaoposition.setListener(nameId2, nameId1, { from: account2 });
		await nameaccountrecovery.submitAccountRecovery(nameId2, { from: account1 });

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		try {
			var result = await nametaoposition.setAdvocate(taoId2, nameId3, { from: account2 });
			canSetAdvocate = true;
		} catch (e) {
			canSetAdvocate = false;
		}
		assert.equal(canSetAdvocate, false, "Compromised Advocate can set new Advocate");

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

		var nonceBefore = await taofactory.nonces(taoId2);
		try {
			var result = await nametaoposition.setAdvocate(taoId2, nameId3, { from: account2 });
			canSetAdvocate = true;
		} catch (e) {
			canSetAdvocate = false;
		}
		assert.equal(canSetAdvocate, true, "Current Advocate of TAO can't set new Advocate");

		var nonceAfter = await taofactory.nonces(taoId2);
		assert.equal(nonceAfter.toNumber(), nonceBefore.add(new BN(1)).toNumber(), "TAO has incorrect nonce");

		var getAdvocate = await nametaoposition.getAdvocate(taoId2);
		assert.equal(getAdvocate, nameId3, "TAO has incorrect Advocate");

		nameId2_totalAdvocatedTAOLogosAfter = await logos.totalAdvocatedTAOLogos(nameId2);
		nameId2_advocatedTAOLogosAfter = await logos.advocatedTAOLogos(nameId2, taoId2);
		var nameId3_totalAdvocatedTAOLogosAfter = await logos.totalAdvocatedTAOLogos(nameId3);
		var nameId3_advocatedTAOLogosAfter = await logos.advocatedTAOLogos(nameId3, taoId2);

		assert.equal(
			nameId2_totalAdvocatedTAOLogosAfter.toNumber(),
			nameId2_totalAdvocatedTAOLogosBefore.sub(nameId2_advocatedTAOLogosBefore).toNumber(),
			"Name has incorrect totalAdvocatedTAOLogos"
		);
		assert.equal(nameId2_advocatedTAOLogosAfter.toNumber(), 0, "Name has incorrect advocatedTAOLogos of a TAO");

		assert.equal(
			nameId3_totalAdvocatedTAOLogosAfter.toNumber(),
			nameId3_totalAdvocatedTAOLogosBefore.add(nameId2_advocatedTAOLogosBefore).toNumber(),
			"Name has incorrect totalAdvocatedTAOLogos"
		);
		assert.equal(
			nameId3_advocatedTAOLogosAfter.toNumber(),
			nameId3_advocatedTAOLogosBefore.add(nameId2_advocatedTAOLogosBefore).toNumber(),
			"Name has incorrect advocatedTAOLogos of a TAO"
		);

		// Reset the Advocate to original Advocate again
		await nametaoposition.setAdvocate(taoId2, nameId2, { from: account3 });
	});

	it("parentReplaceChildAdvocate() - only Advocate of direct parent of TAO can replace child TAO's Advocate with himself", async function() {
		var canReplace;
		try {
			await nametaoposition.parentReplaceChildAdvocate(someAddress, { from: account2 });
			canReplace = true;
		} catch (e) {
			canReplace = false;
		}
		assert.equal(canReplace, false, "Can call parentReplaceChildAdvocate of non-TAO");

		try {
			await nametaoposition.parentReplaceChildAdvocate(nameId2, { from: account2 });
			canReplace = true;
		} catch (e) {
			canReplace = false;
		}
		assert.equal(canReplace, false, "Can call parentReplaceChildAdvocate of non-TAO");

		try {
			await nametaoposition.parentReplaceChildAdvocate(taoId2, { from: account2 });
			canReplace = true;
		} catch (e) {
			canReplace = false;
		}
		assert.equal(canReplace, false, "Same Advocate can replace child TAO's Advocate with himself");

		try {
			await nametaoposition.parentReplaceChildAdvocate(taoId4, { from: account3 });
			canReplace = true;
		} catch (e) {
			canReplace = false;
		}
		assert.equal(canReplace, false, "Advocate of non-Parent can replace child TAO'S Advocate with himself");

		// Burn logos from nameId2
		var nameLogosBalance = await logos.balanceOf(nameId2);
		await logos.whitelistBurnFrom(nameId2, nameLogosBalance.toNumber(), { from: theAO });

		try {
			await nametaoposition.parentReplaceChildAdvocate(taoId4, { from: account2 });
			canReplace = true;
		} catch (e) {
			canReplace = false;
		}
		assert.equal(canReplace, false, "Advocate of Parent with less Logos can replace child TAO'S Advocate with himself");

		var getAdvocate = await nametaoposition.getAdvocate(taoId4);
		assert.equal(getAdvocate, nameId3, "TAO has incorrect Advocate");

		await logos.mint(nameId2, nameLogosBalance.add(new BN(10 ** 6)).toNumber(), { from: theAO });

		var nameId2_totalAdvocatedTAOLogosBefore = await logos.totalAdvocatedTAOLogos(nameId2);
		var nameId2_advocatedTAOLogosBefore = await logos.advocatedTAOLogos(nameId2, taoId2);
		var nameId3_totalAdvocatedTAOLogosBefore = await logos.totalAdvocatedTAOLogos(nameId3);
		var nameId3_advocatedTAOLogosBefore = await logos.advocatedTAOLogos(nameId3, taoId2);

		// Listener submit account recovery for nameId2
		await nameaccountrecovery.submitAccountRecovery(nameId2, { from: account1 });

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		try {
			await nametaoposition.parentReplaceChildAdvocate(taoId4, { from: account2 });
			canReplace = true;
		} catch (e) {
			canReplace = false;
		}
		assert.equal(canReplace, false, "Compromised Parent can replace child TAO's Advocate with himself");

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

		var nonceBefore = await taofactory.nonces(taoId4);
		try {
			await nametaoposition.parentReplaceChildAdvocate(taoId4, { from: account2 });
			canReplace = true;
		} catch (e) {
			canReplace = false;
		}
		assert.equal(canReplace, true, "Advocate of Parent TAO can't replace child TAO's Advocate with himself");

		var nonceAfter = await taofactory.nonces(taoId4);
		assert.equal(nonceAfter.toNumber(), nonceBefore.add(new BN(1)).toNumber(), "TAO has incorrect nonce");

		getAdvocate = await nametaoposition.getAdvocate(taoId4);
		assert.equal(getAdvocate, nameId2, "TAO has incorrect Advocate");

		var nameId2_totalAdvocatedTAOLogosAfter = await logos.totalAdvocatedTAOLogos(nameId2);
		var nameId2_advocatedTAOLogosAfter = await logos.advocatedTAOLogos(nameId2, taoId2);
		var nameId3_totalAdvocatedTAOLogosAfter = await logos.totalAdvocatedTAOLogos(nameId3);
		var nameId3_advocatedTAOLogosAfter = await logos.advocatedTAOLogos(nameId3, taoId2);

		assert.equal(
			nameId2_totalAdvocatedTAOLogosAfter.toNumber(),
			nameId2_totalAdvocatedTAOLogosBefore.add(nameId3_advocatedTAOLogosBefore).toNumber(),
			"Name has incorrect totalAdvocatedTAOLogos"
		);
		assert.equal(
			nameId2_advocatedTAOLogosAfter.toNumber(),
			nameId2_advocatedTAOLogosBefore.add(nameId3_advocatedTAOLogosBefore).toNumber(),
			"Name has incorrect advocatedTAOLogos of a TAO"
		);

		assert.equal(
			nameId3_totalAdvocatedTAOLogosAfter.toNumber(),
			nameId3_totalAdvocatedTAOLogosBefore.sub(nameId3_advocatedTAOLogosBefore).toNumber(),
			"Name has incorrect totalAdvocatedTAOLogos"
		);
		assert.equal(nameId3_advocatedTAOLogosAfter.toNumber(), 0, "Name has incorrect advocatedTAOLogos of a TAO");

		// Reset the Advocate to original Advocate again
		await nametaoposition.setAdvocate(taoId4, nameId3, { from: account2 });
	});

	it("challengeTAOAdvocate() - a Name should be able to challenge TAO's Advocate to be its new Advocate", async function() {
		var canChallenge, challengeTAOAdvocateEvent;
		try {
			var result = await nametaoposition.challengeTAOAdvocate(someAddress, { from: account2 });
			challengeTAOAdvocateEvent = result.logs[0];
			canChallenge = true;
		} catch (e) {
			challengeTAOAdvocateEvent = null;
			canChallenge = false;
		}
		assert.equal(canChallenge, false, "Can call challengeTAOAdvocate() on non-TAO");

		try {
			var result = await nametaoposition.challengeTAOAdvocate(nameId1, { from: account2 });
			challengeTAOAdvocateEvent = result.logs[0];
			canChallenge = true;
		} catch (e) {
			challengeTAOAdvocateEvent = null;
			canChallenge = false;
		}
		assert.equal(canChallenge, false, "Can call challengeTAOAdvocate() on non-TAO");

		// Burn logos from challenger
		var nameLogosBalance = await logos.balanceOf(nameId2);
		await logos.whitelistBurnFrom(nameId2, nameLogosBalance.toNumber(), { from: theAO });

		try {
			var result = await nametaoposition.challengeTAOAdvocate(taoId4, { from: account2 });
			challengeTAOAdvocateEvent = result.logs[0];
			canChallenge = true;
		} catch (e) {
			challengeTAOAdvocateEvent = null;
			canChallenge = false;
		}
		assert.equal(canChallenge, false, "Name with less Logos can challenge current TAO's Advocate");

		// Mint more logos challenger
		var currentAdvocateLogosBalance = await logos.balanceOf(nameId3);
		await logos.mint(nameId2, currentAdvocateLogosBalance.add(new BN(10 ** 3)).toNumber(), { from: theAO });

		// Listener submit account recovery for nameId2
		await nameaccountrecovery.submitAccountRecovery(nameId2, { from: account1 });

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		try {
			var result = await nametaoposition.challengeTAOAdvocate(taoId1, { from: account2 });
			canChallenge = true;
		} catch (e) {
			canChallenge = false;
		}
		assert.equal(canChallenge, false, "Compromised Name can challenge current TAO's Advocate");

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

		challengeId1 = await challengeTAOAdvocate(taoId1, account2);
		challengeId2 = await challengeTAOAdvocate(taoId4, account2);
		challengeId3 = await challengeTAOAdvocate(taoId5, account2);
	});

	it("completeTAOAdvocateChallenge() - challenger should be able to complete the TAO Advocate challenge", async function() {
		var canComplete;

		var getChallengeStatus = await nametaoposition.getChallengeStatus(web3.utils.toHex("someid"), account2);
		assert.equal(getChallengeStatus.toNumber(), 2, "getChallengeStatus() returns incorrect value");
		try {
			await nametaoposition.completeTAOAdvocateChallenge(web3.utils.toHex("someid"), { from: account2 });
			canComplete = true;
		} catch (e) {
			canComplete = false;
		}
		assert.equal(canComplete, false, "Can call completeTAOAdvocateChallenge on non-existing TAOAdvocateChallenge");

		getChallengeStatus = await nametaoposition.getChallengeStatus(challengeId1, account1);
		assert.equal(getChallengeStatus.toNumber(), 3, "getChallengeStatus() returns incorrect value");
		try {
			await nametaoposition.completeTAOAdvocateChallenge(challengeId1, { from: account1 });
			canComplete = true;
		} catch (e) {
			canComplete = false;
		}
		assert.equal(canComplete, false, "Non-challenge owner can complete challenge");

		getChallengeStatus = await nametaoposition.getChallengeStatus(challengeId1, account2);
		assert.equal(getChallengeStatus.toNumber(), 4, "getChallengeStatus() returns incorrect value");
		try {
			await nametaoposition.completeTAOAdvocateChallenge(challengeId1, { from: account2 });
			canComplete = true;
		} catch (e) {
			canComplete = false;
		}
		assert.equal(canComplete, false, "Challenger can complete challenge before it's time");

		// Listener submit account recovery for nameId2
		await nameaccountrecovery.submitAccountRecovery(nameId2, { from: account1 });

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		try {
			await nametaoposition.completeTAOAdvocateChallenge(challengeId1, { from: account2 });
			canComplete = true;
		} catch (e) {
			canComplete = false;
		}
		assert.equal(canComplete, false, "Compromsied challenger can complete challenge");

		if (accountRecoveryLockDuration.gt(challengeTAOAdvocateLockDuration)) {
			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());
		} else {
			// Fast forward the time
			await helper.advanceTimeAndBlock(challengeTAOAdvocateLockDuration.add(new BN(100)).toNumber());
		}

		getChallengeStatus = await nametaoposition.getChallengeStatus(challengeId1, account2);
		assert.equal(getChallengeStatus.toNumber(), 1, "getChallengeStatus() returns incorrect value");

		// Challenge 1
		// TAO ID 1
		// Current Advocate Name ID 1
		// Challenger Name ID 2
		var nonceBefore = await taofactory.nonces(taoId1);
		try {
			await nametaoposition.completeTAOAdvocateChallenge(challengeId1, { from: account2 });
			canComplete = true;
		} catch (e) {
			canComplete = false;
		}
		assert.equal(canComplete, true, "Challenger can't complete challenge");

		var nonceAfter = await taofactory.nonces(taoId1);
		assert.equal(nonceAfter.toNumber(), nonceBefore.add(new BN(1)).toNumber(), "TAO has incorrect nonce");

		var getAdvocate = await nametaoposition.getAdvocate(taoId1);
		assert.equal(getAdvocate, nameId2, "TAO has incorrect Advocate");

		var getTAOAdvocateChallengeById = await nametaoposition.getTAOAdvocateChallengeById(challengeId1);
		assert.equal(getTAOAdvocateChallengeById[2], true, "getTAOAdvocateChallengeById() returns incorrect value for completed status");

		getChallengeStatus = await nametaoposition.getChallengeStatus(challengeId1, account2);
		assert.equal(getChallengeStatus.toNumber(), 6, "getChallengeStatus() returns incorrect value");
		try {
			await nametaoposition.completeTAOAdvocateChallenge(challengeId1, { from: account2 });
			canComplete = true;
		} catch (e) {
			canComplete = false;
		}
		assert.equal(canComplete, false, "Challenger can complete completed challenge");

		// Challenge 2
		// TAO ID 4
		// Current Advocate Name ID 3
		// Challenger Name ID 2
		// Should fail because current Advocate has more Logos than challenger
		await logos.mint(nameId3, 10 ** 10, { from: theAO });

		getChallengeStatus = await nametaoposition.getChallengeStatus(challengeId2, account2);
		assert.equal(getChallengeStatus.toNumber(), 7, "getChallengeStatus() returns incorrect value");

		try {
			await nametaoposition.completeTAOAdvocateChallenge(challengeId2, { from: account2 });
			canComplete = true;
		} catch (e) {
			canComplete = false;
		}
		assert.equal(canComplete, false, "Challenger with less Logos can complete the challenge");

		// Challenge 3
		// TAO ID 5
		// Current Advocate Name ID 4
		// Challenger Name ID 2
		// Should fail because timestamp has passed completeBeforeTimestamp
		getChallengeStatus = await nametaoposition.getChallengeStatus(challengeId3, account2);
		assert.equal(getChallengeStatus.toNumber(), 1, "getChallengeStatus() returns incorrect value");

		// Fast forward the time
		await helper.advanceTimeAndBlock(challengeTAOAdvocateCompleteDuration.add(new BN(10 * 86400)).toNumber());

		getChallengeStatus = await nametaoposition.getChallengeStatus(challengeId3, account2);
		assert.equal(getChallengeStatus.toNumber(), 5, "getChallengeStatus() returns incorrect value");

		try {
			await nametaoposition.completeTAOAdvocateChallenge(challengeId3, { from: account2 });
			canComplete = true;
		} catch (e) {
			canComplete = false;
		}
		assert.equal(canComplete, false, "Challenger can complete challenge even though timestamp has passed completeBeforeTimestamp");

		// Reset the Advocate to original Advocate again
		await nametaoposition.setAdvocate(taoId1, nameId1, { from: account2 });
	});

	it("setListener() - should be able to set a Name/TAO as listener of a Name/TAO", async function() {
		var canSet;
		try {
			await nametaoposition.setListener(someAddress, nameId2, { from: account1 });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, false, "Advocate can set Listener of a non-Name/TAO");

		try {
			await nametaoposition.setListener(nameId1, someAddress, { from: account1 });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, false, "Advocate can set non-Name/TAO as Listener");

		try {
			await nametaoposition.setListener(nameId1, nameId2, { from: account2 });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, false, "Non-Advocate can set Listener");

		try {
			await nametaoposition.setListener(nameId1, taoId2, { from: account1 });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, false, "Advocate can set TAO as a Listener of a Name");

		var nonceBefore = await namefactory.nonces(nameId1);
		try {
			await nametaoposition.setListener(nameId1, nameId2, { from: account1 });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, true, "Advocate can't set Listener");

		var nonceAfter = await namefactory.nonces(nameId1);
		assert.equal(nonceAfter.toNumber(), nonceBefore.add(new BN(1)).toNumber(), "Name has incorrect nonce");

		var getListener = await nametaoposition.getListener(nameId1);
		assert.equal(getListener, nameId2, "Name has incorrect Advocate");

		// Listener submit account recovery for nameId1
		await nameaccountrecovery.submitAccountRecovery(nameId1, { from: account2 });

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		try {
			await nametaoposition.setListener(nameId1, nameId2, { from: account1 });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, false, "Compromised Advocate can set Listener");

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

		// Listener submit account recovery for nameId2
		await nameaccountrecovery.submitAccountRecovery(nameId2, { from: account1 });

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		try {
			await nametaoposition.setListener(nameId1, nameId2, { from: account1 });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, false, "Advocate can set Listener that is currently compromised");

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

		nonceBefore = await taofactory.nonces(taoId1);
		try {
			await nametaoposition.setListener(taoId1, nameId2, { from: account1 });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, true, "Advocate can't set Listener");

		nonceAfter = await taofactory.nonces(taoId1);
		assert.equal(nonceAfter.toNumber(), nonceBefore.add(new BN(1)).toNumber(), "TAO has incorrect nonce");

		getListener = await nametaoposition.getListener(taoId1);
		assert.equal(getListener, nameId2, "TAO has incorrect Advocate");

		nonceBefore = await taofactory.nonces(taoId1);
		try {
			await nametaoposition.setListener(taoId1, taoId2, { from: account1 });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, true, "Advocate can't set Listener");

		nonceAfter = await taofactory.nonces(taoId1);
		assert.equal(nonceAfter.toNumber(), nonceBefore.add(new BN(1)).toNumber(), "TAO has incorrect nonce");

		getListener = await nametaoposition.getListener(taoId1);
		assert.equal(getListener, taoId2, "TAO has incorrect Advocate");
	});

	it("senderIsListener() - should check whether or not the sender address is Listener of a Name/TAO ID", async function() {
		var senderIsListener = await nametaoposition.senderIsListener(account1, nameId1);
		assert.equal(senderIsListener, false, "senderIsListener() returns incorrect value");

		senderIsListener = await nametaoposition.senderIsListener(account2, nameId1);
		assert.equal(senderIsListener, true, "senderIsListener() returns incorrect value");

		senderIsListener = await nametaoposition.senderIsListener(account1, taoId1);
		assert.equal(senderIsListener, false, "senderIsListener() returns incorrect value");
	});

	it("setSpeaker() - should be able to set a Name/TAO as listener of a Name/TAO", async function() {
		var canSet;
		try {
			await nametaoposition.setSpeaker(someAddress, nameId2, { from: account1 });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, false, "Advocate can set Speaker of a non-Name/TAO");

		try {
			await nametaoposition.setSpeaker(nameId1, someAddress, { from: account1 });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, false, "Advocate can set non-Name/TAO as Speaker");

		try {
			await nametaoposition.setSpeaker(nameId1, nameId2, { from: account2 });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, false, "Non-Advocate can set Speaker");

		try {
			await nametaoposition.setSpeaker(nameId1, taoId2, { from: account1 });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, false, "Advocate can set TAO as a Speaker of a Name");

		// Listener submit account recovery for nameId1
		await nameaccountrecovery.submitAccountRecovery(nameId1, { from: account2 });

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		try {
			await nametaoposition.setSpeaker(nameId1, nameId2, { from: account1 });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, false, "Compromised Advocate can set Speaker");

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

		// Listener submit account recovery for nameId2
		await nameaccountrecovery.submitAccountRecovery(nameId2, { from: account1 });

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		try {
			await nametaoposition.setSpeaker(nameId1, nameId2, { from: account1 });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, false, "Advocate can set Speaker that is currently compromised");

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

		var nonceBefore = await namefactory.nonces(nameId1);
		try {
			await nametaoposition.setSpeaker(nameId1, nameId2, { from: account1 });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, true, "Advocate can't set Speaker");

		var nonceAfter = await namefactory.nonces(nameId1);
		assert.equal(nonceAfter.toNumber(), nonceBefore.add(new BN(1)).toNumber(), "Name has incorrect nonce");

		var getSpeaker = await nametaoposition.getSpeaker(nameId1);
		assert.equal(getSpeaker, nameId2, "Name has incorrect Advocate");

		nonceBefore = await taofactory.nonces(taoId1);
		try {
			await nametaoposition.setSpeaker(taoId1, nameId2, { from: account1 });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, true, "Advocate can't set Speaker");

		nonceAfter = await taofactory.nonces(taoId1);
		assert.equal(nonceAfter.toNumber(), nonceBefore.add(new BN(1)).toNumber(), "TAO has incorrect nonce");

		getSpeaker = await nametaoposition.getSpeaker(taoId1);
		assert.equal(getSpeaker, nameId2, "TAO has incorrect Advocate");

		nonceBefore = await taofactory.nonces(taoId1);
		try {
			await nametaoposition.setSpeaker(taoId1, taoId2, { from: account1 });
			canSet = true;
		} catch (e) {
			canSet = false;
		}
		assert.equal(canSet, true, "Advocate can't set Speaker");

		nonceAfter = await taofactory.nonces(taoId1);
		assert.equal(nonceAfter.toNumber(), nonceBefore.add(new BN(1)).toNumber(), "TAO has incorrect nonce");

		getSpeaker = await nametaoposition.getSpeaker(taoId1);
		assert.equal(getSpeaker, taoId2, "TAO has incorrect Advocate");
	});

	it("senderIsSpeaker() - should check whether or not the sender address is Speaker of a Name/TAO ID", async function() {
		var senderIsSpeaker = await nametaoposition.senderIsSpeaker(account1, nameId1);
		assert.equal(senderIsSpeaker, false, "senderIsSpeaker() returns incorrect value");

		senderIsSpeaker = await nametaoposition.senderIsSpeaker(account2, nameId2);
		assert.equal(senderIsSpeaker, true, "senderIsSpeaker() returns incorrect value");

		senderIsSpeaker = await nametaoposition.senderIsSpeaker(account1, taoId1);
		assert.equal(senderIsSpeaker, false, "senderIsSpeaker() returns incorrect value");
	});

	it("senderIsPosition() - should check whether or not sender eth address is either Advocate/Listener/Speaker of a Name/TAO", async function() {
		await nametaoposition.setListener(nameId1, nameId2, { from: account1 });
		await nametaoposition.setSpeaker(nameId1, nameId3, { from: account1 });

		// account1 (nameId1) is nameId1's Advocate
		var senderIsPosition = await nametaoposition.senderIsPosition(account1, nameId1);
		assert.equal(senderIsPosition, true, "senderIsPosition() returns incorrect value");

		// account2 (nameId2) is nameId1's Listener
		senderIsPosition = await nametaoposition.senderIsPosition(account2, nameId1);
		assert.equal(senderIsPosition, true, "senderIsPosition() returns incorrect value");

		// account3 (nameId3) is nameId1's Speaker
		senderIsPosition = await nametaoposition.senderIsPosition(account3, nameId1);
		assert.equal(senderIsPosition, true, "senderIsPosition() returns incorrect value");

		senderIsPosition = await nametaoposition.senderIsPosition(account4, nameId1);
		assert.equal(senderIsPosition, false, "senderIsPosition() returns incorrect value");

		senderIsPosition = await nametaoposition.senderIsPosition(someAddress, nameId1);
		assert.equal(senderIsPosition, false, "senderIsPosition() returns incorrect value");

		await nametaoposition.setListener(taoId1, nameId2, { from: account1 });
		await nametaoposition.setSpeaker(taoId1, nameId3, { from: account1 });

		// account1 (nameId1) is taoId1's Advocate
		senderIsPosition = await nametaoposition.senderIsPosition(account1, taoId1);
		assert.equal(senderIsPosition, true, "senderIsPosition() returns incorrect value");

		// account2 (nameId2) is taoId1's Listener
		senderIsPosition = await nametaoposition.senderIsPosition(account2, taoId1);
		assert.equal(senderIsPosition, true, "senderIsPosition() returns incorrect value");

		// account3 (nameId3) is taoId1's Speaker
		senderIsPosition = await nametaoposition.senderIsPosition(account3, taoId1);
		assert.equal(senderIsPosition, true, "senderIsPosition() returns incorrect value");

		senderIsPosition = await nametaoposition.senderIsPosition(account4, taoId1);
		assert.equal(senderIsPosition, false, "senderIsPosition() returns incorrect value");

		senderIsPosition = await nametaoposition.senderIsPosition(someAddress, taoId1);
		assert.equal(senderIsPosition, false, "senderIsPosition() returns incorrect value");
	});

	it("determinePosition() - determine whether or not sender eth address is either Advocate/Listener/Speaker of a Name/TAO", async function() {
		// account1 (nameId1) is nameId1's Advocate
		var determinePosition = await nametaoposition.determinePosition(account1, nameId1);
		assert.equal(determinePosition.toNumber(), 1, "determinePosition() returns incorrect value");

		// account2 (nameId2) is nameId1's Listener
		determinePosition = await nametaoposition.determinePosition(account2, nameId1);
		assert.equal(determinePosition.toNumber(), 2, "determinePosition() returns incorrect value");

		// account3 (nameId3) is nameId1's Speaker
		determinePosition = await nametaoposition.determinePosition(account3, nameId1);
		assert.equal(determinePosition.toNumber(), 3, "determinePosition() returns incorrect value");

		var canDetermine;
		try {
			await nametaoposition.determinePosition(account4, nameId1);
			canDetermine = true;
		} catch (e) {
			canDetermine = false;
		}
		assert.equal(canDetermine, false, "Can determinePosition of a non-Position member of a Name");

		try {
			await nametaoposition.determinePosition(someAddress, nameId1);
			canDetermine = true;
		} catch (e) {
			canDetermine = false;
		}
		assert.equal(canDetermine, false, "Can determinePosition of a sender eth address that is not a Name");

		// account1 (nameId1) is taoId1's Advocate
		var determinePosition = await nametaoposition.determinePosition(account1, taoId1);
		assert.equal(determinePosition.toNumber(), 1, "determinePosition() returns incorrect value");

		// account2 (nameId2) is taoId1's Listener
		determinePosition = await nametaoposition.determinePosition(account2, taoId1);
		assert.equal(determinePosition.toNumber(), 2, "determinePosition() returns incorrect value");

		// account3 (nameId3) is taoId1's Speaker
		determinePosition = await nametaoposition.determinePosition(account3, taoId1);
		assert.equal(determinePosition.toNumber(), 3, "determinePosition() returns incorrect value");

		var canDetermine;
		try {
			await nametaoposition.determinePosition(account4, taoId1);
			canDetermine = true;
		} catch (e) {
			canDetermine = false;
		}
		assert.equal(canDetermine, false, "Can determinePosition of a non-Position member of a TAO");

		try {
			await nametaoposition.determinePosition(someAddress, taoId1);
			canDetermine = true;
		} catch (e) {
			canDetermine = false;
		}
		assert.equal(canDetermine, false, "Can determinePosition of a sender eth address that is not a Name");
	});

	it("nameIsPosition() - should check whether or not nameId is either Advocate/Listener/Speaker of a Name/TAO", async function() {
		// account1 (nameId1) is nameId1's Advocate
		var nameIsPosition = await nametaoposition.nameIsPosition(nameId1, nameId1);
		assert.equal(nameIsPosition, true, "nameIsPosition() returns incorrect value");

		// account2 (nameId2) is nameId1's Listener
		nameIsPosition = await nametaoposition.nameIsPosition(nameId2, nameId1);
		assert.equal(nameIsPosition, true, "nameIsPosition() returns incorrect value");

		// account3 (nameId3) is nameId1's Speaker
		nameIsPosition = await nametaoposition.nameIsPosition(nameId3, nameId1);
		assert.equal(nameIsPosition, true, "nameIsPosition() returns incorrect value");

		nameIsPosition = await nametaoposition.nameIsPosition(nameId4, nameId1);
		assert.equal(nameIsPosition, false, "nameIsPosition() returns incorrect value");

		nameIsPosition = await nametaoposition.nameIsPosition(someAddress, nameId1);
		assert.equal(nameIsPosition, false, "nameIsPosition() returns incorrect value");

		// account1 (nameId1) is taoId1's Advocate
		nameIsPosition = await nametaoposition.nameIsPosition(nameId1, taoId1);
		assert.equal(nameIsPosition, true, "nameIsPosition() returns incorrect value");

		// account2 (nameId2) is taoId1's Listener
		nameIsPosition = await nametaoposition.nameIsPosition(nameId2, taoId1);
		assert.equal(nameIsPosition, true, "nameIsPosition() returns incorrect value");

		// account3 (nameId3) is taoId1's Speaker
		nameIsPosition = await nametaoposition.nameIsPosition(nameId3, taoId1);
		assert.equal(nameIsPosition, true, "nameIsPosition() returns incorrect value");

		nameIsPosition = await nametaoposition.nameIsPosition(nameId4, taoId1);
		assert.equal(nameIsPosition, false, "nameIsPosition() returns incorrect value");

		nameIsPosition = await nametaoposition.nameIsPosition(someAddress, taoId1);
		assert.equal(nameIsPosition, false, "nameIsPosition() returns incorrect value");
	});
});
