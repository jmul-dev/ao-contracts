var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var Logos = artifacts.require("./Logos.sol");

var TAOAncestry = artifacts.require("./TAOAncestry.sol");
var NameAccountRecovery = artifacts.require("./NameAccountRecovery.sol");
var AOSetting = artifacts.require("./AOSetting.sol");

var EthCrypto = require("eth-crypto");
var helper = require("./helpers/truffleTestHelper");

contract("TAOAncestry", function(accounts) {
	var namefactory,
		taofactory,
		nametaoposition,
		logos,
		nameId1,
		nameId2,
		nameId3,
		taoId1,
		taoId2,
		taoId3,
		taoId4,
		taoId5,
		taoancestry,
		nameaccountrecovery,
		aosetting,
		accountRecoveryLockDuration;

	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var someAddress = accounts[4];
	var whitelistedAddress = accounts[5];
	var emptyAddress = "0x0000000000000000000000000000000000000000";

	var nameId1LocalWriterKey = EthCrypto.createIdentity();
	var nameId2LocalWriterKey = EthCrypto.createIdentity();
	var nameId3LocalWriterKey = EthCrypto.createIdentity();

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		logos = await Logos.deployed();
		taoancestry = await TAOAncestry.deployed();
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
			"somecontentid",
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
			"somecontentid",
			nameId2LocalWriterKey.address,
			{
				from: account2
			}
		);
		nameId2 = await namefactory.ethAddressToNameId(account2);

		result = await namefactory.createName(
			"echo",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			"somecontentid",
			nameId3LocalWriterKey.address,
			{
				from: account3
			}
		);
		nameId3 = await namefactory.ethAddressToNameId(account3);

		// Mint Logos to nameId
		await logos.setWhitelist(theAO, true, { from: theAO });
		await logos.mint(nameId1, 10 ** 12, { from: theAO });
		await logos.mint(nameId2, 10 ** 12, { from: theAO });

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

		await nametaoposition.setListener(nameId2, nameId3, { from: account2 });
	});

	it("The AO - transferOwnership() should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await taoancestry.transferOwnership(taoId1, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await taoancestry.transferOwnership(taoId1, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await taoancestry.theAO();
		assert.equal(newTheAO, taoId1, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - setWhitelist() should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await taoancestry.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await taoancestry.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await taoancestry.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
	});

	it("The AO - setNameFactoryAddress() should be able to set NameFactory address", async function() {
		var canSetAddress;
		try {
			await taoancestry.setNameFactoryAddress(namefactory.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameFactory address");

		try {
			await taoancestry.setNameFactoryAddress(namefactory.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameFactory address");

		var nameFactoryAddress = await taoancestry.nameFactoryAddress();
		assert.equal(nameFactoryAddress, namefactory.address, "Contract has incorrect nameFactoryAddress");
	});

	it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await taoancestry.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await taoancestry.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await taoancestry.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("The AO - setTAOFactoryAddress() should be able to set TAOFactory address", async function() {
		var canSetAddress;
		try {
			await taoancestry.setTAOFactoryAddress(taofactory.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set TAOFactory address");

		try {
			await taoancestry.setTAOFactoryAddress(taofactory.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set TAOFactory address");

		var taoFactoryAddress = await taoancestry.taoFactoryAddress();
		assert.equal(taoFactoryAddress, taofactory.address, "Contract has incorrect taoFactoryAddress");
	});

	it("The AO - setNameAccountRecoveryAddress() should be able to set NameAccountRecovery address", async function() {
		var canSetAddress;
		try {
			await taoancestry.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameAccountRecovery address");

		try {
			await taoancestry.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameAccountRecovery address");

		var nameAccountRecoveryAddress = await taoancestry.nameAccountRecoveryAddress();
		assert.equal(nameAccountRecoveryAddress, nameaccountrecovery.address, "Contract has incorrect nameAccountRecoveryAddress");
	});

	it("initialize() - only TAOFactory can initialize Ancestry for a TAO", async function() {
		// Create a TAO
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
		var createTAOEvent = result.logs[0];
		taoId2 = createTAOEvent.args.taoId;

		var isExist = await taoancestry.isExist(taoId2);
		assert.equal(isExist, true, "isExist() returns incorrect value");
	});

	it("getAncestryById() - should return ancestry information given a TAO ID", async function() {
		var canGetAncestryById, ancestry;
		try {
			ancestry = await taoancestry.getAncestryById(someAddress);
			canGetAncestryById = true;
		} catch (e) {
			canGetAncestryById = false;
		}
		assert.equal(canGetAncestryById, false, "Can getAncestryById() of a non-existing TAO");

		ancestry = await taoancestry.getAncestryById(taoId2);
		assert.equal(ancestry[0], nameId2, "getAncestryById() returns incorrect parentId");
		assert.equal(ancestry[1].toNumber(), 0, "getAncestryById() returns incorrect childMinLogos");
		assert.equal(ancestry[2].toNumber(), 0, "getAncestryById() returns incorrect totalChildren");
	});

	it("updateChildMinLogos() - Advocate of TAO should be able to update the min logos required to create a child of the TAO", async function() {
		var childMinLogos = 10;
		var canUpdateChildMinLogos;

		try {
			await taoancestry.updateChildMinLogos(someAddress, childMinLogos, { from: account2 });
			canUpdateChildMinLogos = true;
		} catch (e) {
			canUpdateChildMinLogos = false;
		}
		assert.equal(canUpdateChildMinLogos, false, "Can update childMinLogos of a non-TAO");

		try {
			await taoancestry.updateChildMinLogos(taoId2, childMinLogos, { from: account1 });
			canUpdateChildMinLogos = true;
		} catch (e) {
			canUpdateChildMinLogos = false;
		}
		assert.equal(canUpdateChildMinLogos, false, "Non-advocate of TAO can update childMinLogos of a TAO");

		// Listener submit account recovery for nameId2
		await nameaccountrecovery.submitAccountRecovery(nameId2, { from: account3 });

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		try {
			await taoancestry.updateChildMinLogos(taoId2, childMinLogos, { from: account2 });
			canUpdateChildMinLogos = true;
		} catch (e) {
			canUpdateChildMinLogos = false;
		}
		assert.equal(canUpdateChildMinLogos, false, "Compormised Advocate of TAO can update childMinLogos");

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.plus(100).toNumber());

		var nonceBefore = await taofactory.nonces(taoId2);
		try {
			await taoancestry.updateChildMinLogos(taoId2, childMinLogos, { from: account2 });
			canUpdateChildMinLogos = true;
		} catch (e) {
			canUpdateChildMinLogos = false;
		}
		assert.equal(canUpdateChildMinLogos, true, "Advocate of TAO can't update childMinLogos");

		var nonceAfter = await taofactory.nonces(taoId2);
		assert.equal(nonceAfter.toNumber(), nonceBefore.plus(1).toNumber(), "TAO has incorrect nonce");

		ancestry = await taoancestry.getAncestryById(taoId2);
		assert.equal(ancestry[1].toNumber(), childMinLogos, "getAncestryById() returns incorrect childMinLogos");
	});

	it("addChild() - TAO Factory should be able to add child to a TAO and automatically approved/connected if it's from the same Advocate", async function() {
		var ancestryBefore = await taoancestry.getAncestryById(taoId2);

		var nonceBefore = await taofactory.nonces(taoId2);

		// Create a TAO
		var result = await taofactory.createTAO(
			"Delta's TAO Child 1",
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
		var createTAOEvent = result.logs[0];
		taoId3 = createTAOEvent.args.taoId;

		var nonceAfter = await taofactory.nonces(taoId2);
		assert.equal(nonceAfter.toNumber(), nonceBefore.plus(1).toNumber(), "Parent TAO has incorrect nonce");

		var isExist = await taoancestry.isExist(taoId3);
		assert.equal(isExist, true, "isExist() returns incorrect value");

		var isChild = await taoancestry.isChild(taoId2, taoId3);
		assert.equal(isChild, true, "isChild() returns incorrect value");

		var isNotApprovedChild = await taoancestry.isNotApprovedChild(taoId2, taoId3);
		assert.equal(isNotApprovedChild, false, "isNotApprovedChild() returns incorrect value");

		var ancestryAfter = await taoancestry.getAncestryById(taoId2);
		assert.equal(
			ancestryAfter[2].toNumber(),
			ancestryBefore[2].plus(1).toNumber(),
			"getAncestryById() returns incorrect totalChildren"
		);

		var childIds = await taoancestry.getChildIds(taoId2, 1, ancestryAfter[2].toNumber());
		assert.include(childIds, taoId3, "getChildIds() is missing an ID");

		var childAncestry = await taoancestry.getAncestryById(taoId3);
		assert.equal(childAncestry[0], taoId2, "getAncestryById() returns incorrect parentId");
	});

	it("addChild() - TAO Factory should not be able to add a child TAO on behalf of Name with not enough childMinLogos", async function() {
		var canAddChild;
		try {
			// Create a TAO
			var result = await taofactory.createTAO(
				"Delta's TAO Child 2",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				"somecontentid",
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
			canAddChild = true;
		} catch (e) {
			canAddChild = false;
		}
		assert.equal(canAddChild, false, "TAO Factory can add a child TAO on behalf of Name with not enough childMinLogos");
	});

	it("addChild() - TAO Factory should be able to add child to a TAO and but not automatically approved/connected if it's from a different Advocate", async function() {
		// First mint logos to nameId3
		await logos.mint(nameId3, 10 ** 12, { from: theAO });

		var ancestryBefore = await taoancestry.getAncestryById(taoId2);

		var nonceBefore = await taofactory.nonces(taoId2);

		// Create a TAO
		var result = await taofactory.createTAO(
			"Delta's TAO Child 2",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			"somecontentid",
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

		var nonceAfter = await taofactory.nonces(taoId2);
		assert.equal(nonceAfter.toNumber(), nonceBefore.toNumber(), "Parent TAO has incorrect nonce");

		var isExist = await taoancestry.isExist(taoId4);
		assert.equal(isExist, true, "isExist() returns incorrect value");

		var isChild = await taoancestry.isChild(taoId2, taoId4);
		assert.equal(isChild, false, "isChild() returns incorrect value");

		var isNotApprovedChild = await taoancestry.isNotApprovedChild(taoId2, taoId4);
		assert.equal(isNotApprovedChild, true, "isNotApprovedChild() returns incorrect value");

		var ancestryAfter = await taoancestry.getAncestryById(taoId2);
		assert.equal(ancestryAfter[2].toNumber(), ancestryBefore[2].toNumber(), "getAncestryById() returns incorrect totalChildren");

		var childIds = await taoancestry.getChildIds(taoId2, 1, ancestryAfter[2].toNumber());
		assert.notInclude(childIds, taoId4, "getChildIds() returns incorrect value");

		var childAncestry = await taoancestry.getAncestryById(taoId4);
		assert.equal(childAncestry[0], taoId2, "getAncestryById() returns incorrect parentId");
	});

	it("isChild() - should check whether or not a TAO is a child of a parent TAO", async function() {
		var isChild = await taoancestry.isChild(taoId1, taoId2);
		assert.equal(isChild, false, "isChild() returns incorrect value");

		var isChild = await taoancestry.isChild(taoId2, taoId3);
		assert.equal(isChild, true, "isChild() returns incorrect value");
	});

	it("isNotApprovedChild() - should check whether or not a TAO is a child of parent TAO that is not yet approved", async function() {
		var isNotApprovedChild = await taoancestry.isNotApprovedChild(taoId1, taoId2);
		assert.equal(isNotApprovedChild, false, "isNotApprovedChild() returns incorrect value");

		var isNotApprovedChild = await taoancestry.isNotApprovedChild(taoId2, taoId3);
		assert.equal(isNotApprovedChild, false, "isNotApprovedChild() returns incorrect value");

		var isNotApprovedChild = await taoancestry.isNotApprovedChild(taoId2, taoId4);
		assert.equal(isNotApprovedChild, true, "isNotApprovedChild() returns incorrect value");
	});

	it("approveChild() - Advocate of parent TAO can approve a child TAO", async function() {
		var canApprove;
		try {
			await taoancestry.approveChild(someAddress, taoId4, { from: account2 });
			canApprove = true;
		} catch (e) {
			canApprove = false;
		}
		assert.equal(canApprove, false, "Can approve child TAO of a non-TAO parent");

		try {
			await taoancestry.approveChild(taoId2, someAddress, { from: account2 });
			canApprove = true;
		} catch (e) {
			canApprove = false;
		}
		assert.equal(canApprove, false, "Can approve non-TAO child of a parent TAO");

		try {
			await taoancestry.approveChild(taoId2, taoId4, { from: someAddress });
			canApprove = true;
		} catch (e) {
			canApprove = false;
		}
		assert.equal(canApprove, false, "Non-Advocate of parent TAO can approve child TAO");

		try {
			await taoancestry.approveChild(taoId2, taoId3, { from: account2 });
			canApprove = true;
		} catch (e) {
			canApprove = false;
		}
		assert.equal(canApprove, false, "Advocate of parent TAO can approve child TAO that does not need approval");

		// Listener submit account recovery for nameId2
		await nameaccountrecovery.submitAccountRecovery(nameId2, { from: account3 });

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		try {
			await taoancestry.approveChild(taoId2, taoId4, { from: account2 });
			canApprove = true;
		} catch (e) {
			canApprove = false;
		}
		assert.equal(canApprove, false, "Compromised Advocate of parent TAO can approve child TAO");

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.plus(100).toNumber());

		var ancestryBefore = await taoancestry.getAncestryById(taoId2);
		var nonceBefore = await taofactory.nonces(taoId2);

		try {
			await taoancestry.approveChild(taoId2, taoId4, { from: account2 });
			canApprove = true;
		} catch (e) {
			canApprove = false;
		}
		assert.equal(canApprove, true, "Advocate of parent TAO can't approve child TAO");

		var nonceAfter = await taofactory.nonces(taoId2);
		assert.equal(nonceAfter.toNumber(), nonceBefore.plus(1).toNumber(), "TAO has incorrect nonce");

		var ancestryAfter = await taoancestry.getAncestryById(taoId2);
		assert.equal(
			ancestryAfter[2].toNumber(),
			ancestryBefore[2].plus(1).toNumber(),
			"getAncestryById() returns incorrect totalChildren"
		);

		var childAncestry = await taoancestry.getAncestryById(taoId4);
		assert.equal(childAncestry[0], taoId2, "getAncestryById() returns incorrect parentId");

		var childIds = await taoancestry.getChildIds(taoId2, 1, ancestryAfter[2].toNumber());
		assert.include(childIds, taoId4, "getChildIds() is missing an ID");

		var isChild = await taoancestry.isChild(taoId2, taoId4);
		assert.equal(isChild, true, "isChild() returns incorrect value");

		var isNotApprovedChild = await taoancestry.isNotApprovedChild(taoId2, taoId4);
		assert.equal(isNotApprovedChild, false, "isNotApprovedChild() returns incorrect value");
	});

	it("removeChild() - Advocate of parent TAO can remove child TAO", async function() {
		var canRemove;
		try {
			await taoancestry.removeChild(someAddress, taoId4, { from: account2 });
			canRemove = true;
		} catch (e) {
			canRemove = false;
		}
		assert.equal(canRemove, false, "Can remove child TAO of a non-TAO parent");

		try {
			await taoancestry.removeChild(taoId2, someAddress, { from: account2 });
			canRemove = true;
		} catch (e) {
			canRemove = false;
		}
		assert.equal(canRemove, false, "Can remove non-TAO child of a parent TAO");

		try {
			await taoancestry.removeChild(taoId2, taoId4, { from: someAddress });
			canRemove = true;
		} catch (e) {
			canRemove = false;
		}
		assert.equal(canRemove, false, "Non-Advocate of parent TAO can remove child TAO");

		try {
			await taoancestry.removeChild(taoId2, taoId1, { from: account2 });
			canRemove = true;
		} catch (e) {
			canRemove = false;
		}
		assert.equal(canRemove, false, "Advocate of parent TAO can remove TAO that is not its child TAO");

		// Create another orphan TAO
		var result = await taofactory.createTAO(
			"Delta's TAO Child 3",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			"somecontentid",
			taoId2,
			0,
			false,
			0,
			{
				from: account3
			}
		);
		var createTAOEvent = result.logs[0];
		taoId5 = createTAOEvent.args.taoId;

		try {
			await taoancestry.removeChild(taoId2, taoId5, { from: account2 });
			canRemove = true;
		} catch (e) {
			canRemove = false;
		}
		assert.equal(canRemove, false, "Advocate of parent TAO can remove child TAO that is not yet approved");

		// Listener submit account recovery for nameId2
		await nameaccountrecovery.submitAccountRecovery(nameId2, { from: account3 });

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		try {
			await taoancestry.removeChild(taoId2, taoId4, { from: account2 });
			canRemove = true;
		} catch (e) {
			canRemove = false;
		}
		assert.equal(canRemove, false, "Compromised Advocate of parent TAO can remove child TAO");

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.plus(100).toNumber());

		var ancestryBefore = await taoancestry.getAncestryById(taoId2);
		var nonceBefore = await taofactory.nonces(taoId2);

		try {
			await taoancestry.removeChild(taoId2, taoId4, { from: account2 });
			canRemove = true;
		} catch (e) {
			canRemove = false;
		}
		assert.equal(canRemove, true, "Advocate of parent TAO can't remove child TAO");

		var nonceAfter = await taofactory.nonces(taoId2);
		assert.equal(nonceAfter.toNumber(), nonceBefore.plus(1).toNumber(), "TAO has incorrect nonce");

		var ancestryAfter = await taoancestry.getAncestryById(taoId2);
		assert.equal(
			ancestryAfter[2].toNumber(),
			ancestryBefore[2].minus(1).toNumber(),
			"getAncestryById() returns incorrect totalChildren"
		);

		var childAncestry = await taoancestry.getAncestryById(taoId4);
		assert.equal(childAncestry[0], emptyAddress, "getAncestryById() returns incorrect parentId");

		var childIds = await taoancestry.getChildIds(taoId2, 1, ancestryAfter[2].toNumber());
		assert.notInclude(childIds, taoId4, "getChildIds() returns incorrect value");

		var isChild = await taoancestry.isChild(taoId2, taoId4);
		assert.equal(isChild, false, "isChild() returns incorrect value");

		var isNotApprovedChild = await taoancestry.isNotApprovedChild(taoId2, taoId4);
		assert.equal(isNotApprovedChild, false, "isNotApprovedChild() returns incorrect value");
	});
});
