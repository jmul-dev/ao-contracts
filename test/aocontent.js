var AOLibrary = artifacts.require("./AOLibrary.sol");
var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var AOSetting = artifacts.require("./AOSetting.sol");
var AOContent = artifacts.require("./AOContent.sol");
var Logos = artifacts.require("./Logos.sol");

var EthCrypto = require("eth-crypto");

contract("AOContent", function(accounts) {
	var library,
		namefactory,
		taofactory,
		nametaoposition,
		aosetting,
		aocontent,
		logos,
		settingTAOId,
		contentUsageType_aoContent,
		contentUsageType_creativeCommons,
		contentUsageType_taoContent,
		taoContentState_submitted,
		taoContentState_pendingReview,
		taoContentState_acceptedToTAO,
		nameId1,
		nameId2,
		taoId1,
		taoId2,
		taoId3,
		contentId1,
		contentId2,
		contentId3;

	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var someAddress = accounts[3];
	var whitelistedAddress = accounts[4];

	// Retrieve private key from ganache
	var account1PrivateKey = "0xfa372b56eac0e71de587267f0a59989719b2325aeb4579912379641cf93ccaab";
	var account2PrivateKey = "0x6a35c58d0acad0ceca9c03d37aa2d2288d70afe0690f5e5f5e05aeab93b95dad";
	var account3PrivateKey = "0xf4bab2d2f0c5119cc6aad0735bbf0a017d229cbf430c0041af382b93e713a1c3";
	var account1LocalIdentity = {
		publicKey: EthCrypto.publicKeyByPrivateKey(account1PrivateKey),
		address: EthCrypto.publicKey.toAddress(EthCrypto.publicKeyByPrivateKey(account1PrivateKey))
	};
	var account2LocalIdentity = {
		publicKey: EthCrypto.publicKeyByPrivateKey(account2PrivateKey),
		address: EthCrypto.publicKey.toAddress(EthCrypto.publicKeyByPrivateKey(account2PrivateKey))
	};
	var account3LocalIdentity = {
		publicKey: EthCrypto.publicKeyByPrivateKey(account3PrivateKey),
		address: EthCrypto.publicKey.toAddress(EthCrypto.publicKeyByPrivateKey(account3PrivateKey))
	};

	var baseChallenge = "basechallengestring";
	var fileSize = 1000000; // 1000000 bytes = min 1000000 AO
	var emptyAddress = "0x0000000000000000000000000000000000000000";
	var nullBytesValue = "0x0000000000000000000000000000000000000000000000000000000000000000";

	before(async function() {
		library = await AOLibrary.deployed();
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		aosetting = await AOSetting.deployed();
		aocontent = await AOContent.deployed();
		logos = await Logos.deployed();

		settingTAOId = await aocontent.settingTAOId();

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "contentUsageType_aoContent");
		contentUsageType_aoContent = settingValues[3];

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "contentUsageType_creativeCommons");
		contentUsageType_creativeCommons = settingValues[3];

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "contentUsageType_taoContent");
		contentUsageType_taoContent = settingValues[3];

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "taoContentState_submitted");
		taoContentState_submitted = settingValues[3];

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "taoContentState_pendingReview");
		taoContentState_pendingReview = settingValues[3];

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "taoContentState_acceptedToTAO");
		taoContentState_acceptedToTAO = settingValues[3];

		// Create Name
		var result = await namefactory.createName("charlie", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account1
		});
		nameId1 = await namefactory.ethAddressToNameId(account1);

		var result = await namefactory.createName("delta", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account2
		});
		nameId2 = await namefactory.ethAddressToNameId(account2);

		// Mint Logos to nameId1 and nameId2
		await logos.setWhitelist(theAO, true, { from: theAO });
		await logos.mintToken(nameId1, 10 ** 12, { from: theAO });
		await logos.mintToken(nameId2, 10 ** 12, { from: theAO });

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

		result = await taofactory.createTAO(
			"Charlie's 2nd TAO",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			"somecontentid",
			taoId1,
			0,
			false,
			0,
			{
				from: account1
			}
		);
		var createTAOEvent = result.logs[0];
		taoId2 = createTAOEvent.args.taoId;

		result = await taofactory.createTAO(
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
		taoId3 = createTAOEvent.args.taoId;
	});

	var create = async function(creator, contentUsageType, taoId) {
		var canCreate, storeContentEvent, contentId;
		try {
			var result = await aocontent.create(creator, baseChallenge, fileSize, contentUsageType, taoId, { from: whitelistedAddress });
			canCreate = true;
			storeContentEvent = result.logs[0];
			contentId = storeContentEvent.args.contentId;
		} catch (e) {
			canCreate = false;
			storeContentEvent = null;
			contentId = null;
		}
		assert.equal(canCreate, true, "Whitelisted address can't create content");

		var content = await aocontent.getById(contentId);
		assert.equal(content[0], creator, "Content has incorrect creator");
		assert.equal(content[1].toNumber(), fileSize, "Content has incorrect creator");
		assert.equal(content[2], contentUsageType, "Content has incorrect contentUsageType");
		if (taoId !== emptyAddress) {
			assert.equal(content[3], taoId, "Content has incorrect taoId");
			assert.equal(content[4], taoContentState_submitted, "Content has incorrect taoContentState");
		}
		assert.equal(content[5].toNumber(), 0, "Content has incorrect updateTAOContentStateV");
		assert.equal(content[6], nullBytesValue, "Content has incorrect updateTAOContentStateR");
		assert.equal(content[7], nullBytesValue, "Content has incorrect updateTAOContentStateS");
		assert.equal(content[8], "", "Content has incorrect extraData");
		return contentId;
	};

	var createSignature = function(privateKey, contentId, taoId, taoContentState) {
		var signHash = EthCrypto.hash.keccak256([
			{
				type: "address",
				value: aocontent.address
			},
			{
				type: "bytes32",
				value: contentId
			},
			{
				type: "address",
				value: taoId
			},
			{
				type: "bytes32",
				value: taoContentState
			}
		]);

		var signature = EthCrypto.sign(privateKey, signHash);
		return signature;
	};

	it("The AO - should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await aocontent.transferOwnership(taoId1, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await aocontent.transferOwnership(taoId1, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await aocontent.theAO();
		assert.equal(newTheAO, taoId1, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await aocontent.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await aocontent.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await aocontent.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
	});

	it("The AO - should be able to set settingTAOId", async function() {
		var canSetSettingTAOId;
		try {
			await aocontent.setSettingTAOId(settingTAOId, { from: someAddress });
			canSetSettingTAOId = true;
		} catch (e) {
			canSetSettingTAOId = false;
		}
		assert.equal(canSetSettingTAOId, false, "Non-AO can set settingTAOId");

		try {
			await aocontent.setSettingTAOId(settingTAOId, { from: account1 });
			canSetSettingTAOId = true;
		} catch (e) {
			canSetSettingTAOId = false;
		}
		assert.equal(canSetSettingTAOId, true, "The AO can't set settingTAOId");

		var _settingTAOId = await aocontent.settingTAOId();
		assert.equal(_settingTAOId, settingTAOId, "Contract has incorrect settingTAOId");
	});

	it("The AO - should be able to set AOSetting address", async function() {
		var canSetAddress;
		try {
			await aocontent.setAOSettingAddress(aosetting.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOSetting address");

		try {
			await aocontent.setAOSettingAddress(aosetting.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOSetting address");

		var aoSettingAddress = await aocontent.aoSettingAddress();
		assert.equal(aoSettingAddress, aosetting.address, "Contract has incorrect aoSettingAddress");
	});

	it("The AO - should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await aocontent.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await aocontent.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await aocontent.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("Whitelisted Address - should not be able to store content creation with invalid params", async function() {
		var canCreate, storeContentEvent, contentId;
		try {
			var result = await aocontent.create(account1, baseChallenge, fileSize, contentUsageType_aoContent, emptyAddress, {
				from: someAddress
			});
			canCreate = true;
			storeContentEvent = result.logs[0];
			contentId = storeContentEvent.args.contentId;
		} catch (e) {
			canCreate = false;
			storeContentEvent = null;
			contentId = null;
		}
		assert.equal(canCreate, false, "Non-whitelisted address can create content");

		try {
			var result = await aocontent.create(emptyAddress, baseChallenge, fileSize, contentUsageType_aoContent, emptyAddress, {
				from: whitelistedAddress
			});
			canCreate = true;
			storeContentEvent = result.logs[0];
			contentId = storeContentEvent.args.contentId;
		} catch (e) {
			canCreate = false;
			storeContentEvent = null;
			contentId = null;
		}
		assert.equal(canCreate, false, "Whitelisted address can create content with invalid creator address");

		try {
			var result = await aocontent.create(account1, "", fileSize, contentUsageType_aoContent, emptyAddress, {
				from: whitelistedAddress
			});
			canCreate = true;
			storeContentEvent = result.logs[0];
			contentId = storeContentEvent.args.contentId;
		} catch (e) {
			canCreate = false;
			storeContentEvent = null;
			contentId = null;
		}
		assert.equal(canCreate, false, "Whitelisted address can create content with invalid baseChallenge string");

		try {
			var result = await aocontent.create(account1, baseChallenge, 0, contentUsageType_aoContent, emptyAddress, {
				from: whitelistedAddress
			});
			canCreate = true;
			storeContentEvent = result.logs[0];
			contentId = storeContentEvent.args.contentId;
		} catch (e) {
			canCreate = false;
			storeContentEvent = null;
			contentId = null;
		}
		assert.equal(canCreate, false, "Whitelisted address can create content with invalid fileSize");

		try {
			var result = await aocontent.create(account1, baseChallenge, fileSize, "someContentUsageType", emptyAddress, {
				from: whitelistedAddress
			});
			canCreate = true;
			storeContentEvent = result.logs[0];
			contentId = storeContentEvent.args.contentId;
		} catch (e) {
			canCreate = false;
			storeContentEvent = null;
			contentId = null;
		}
		assert.equal(canCreate, false, "Whitelisted address can create content with invalid contentUsageType");

		try {
			var result = await aocontent.create(account1, baseChallenge, fileSize, contentUsageType_taoContent, someAddress, {
				from: whitelistedAddress
			});
			canCreate = true;
			storeContentEvent = result.logs[0];
			contentId = storeContentEvent.args.contentId;
		} catch (e) {
			canCreate = false;
			storeContentEvent = null;
			contentId = null;
		}
		assert.equal(canCreate, false, "Whitelisted address can create content with invalid TAO ID");

		try {
			var result = await aocontent.create(account2, baseChallenge, fileSize, contentUsageType_taoContent, taoId1, {
				from: whitelistedAddress
			});
			canCreate = true;
			storeContentEvent = result.logs[0];
			contentId = storeContentEvent.args.contentId;
		} catch (e) {
			canCreate = false;
			storeContentEvent = null;
			contentId = null;
		}
		assert.equal(
			canCreate,
			false,
			"Whitelisted address can create content with creator that is not an Advocate/Listener/Speaker of the TAO ID"
		);
	});

	it("Whitelisted Address - should be able to store content creation", async function() {
		// Content Usage Type = AO Content
		contentId1 = await create(account1, contentUsageType_aoContent, emptyAddress);

		// Content Usage Type = Creative Commons
		contentId2 = await create(account1, contentUsageType_creativeCommons, emptyAddress);

		// Content Usage Type = T(AO) Content
		contentId3 = await create(account1, contentUsageType_taoContent, taoId1);
	});

	it("Whitelisted Address/Content creator - should be able to get base challenge of a content", async function() {
		var canGetBaseChallenge;
		try {
			await aocontent.getBaseChallenge(contentId1, { from: someAddress });
			canGetBaseChallenge = true;
		} catch (e) {
			canGetBaseChallenge = false;
		}
		assert.equal(canGetBaseChallenge, false, "Non-whitelisted address/Content creator can get base challenge of a content");

		try {
			await aocontent.getBaseChallenge(contentId1, { from: whitelistedAddress });
			canGetBaseChallenge = true;
		} catch (e) {
			canGetBaseChallenge = false;
		}
		assert.equal(canGetBaseChallenge, true, "Whitelisted address can't get base challenge of a content");

		try {
			await aocontent.getBaseChallenge(contentId1, { from: account1 });
			canGetBaseChallenge = true;
		} catch (e) {
			canGetBaseChallenge = false;
		}
		assert.equal(canGetBaseChallenge, true, "Content creator can't get base challenge of a content");
	});

	it("updateTAOContentState() - should NOT update TAO Content State if params provided are not valid", async function() {
		var canUpdateTAOContentState;
		var signature = createSignature(account1PrivateKey, contentId1, taoId2, taoContentState_acceptedToTAO);
		var vrs = EthCrypto.vrs.fromString(signature);
		try {
			await aocontent.updateTAOContentState(contentId1, taoId2, taoContentState_acceptedToTAO, vrs.v, vrs.r, vrs.s, {
				from: account1
			});
			canUpdateTAOContentState = true;
		} catch (e) {
			canUpdateTAOContentState = false;
		}
		assert.notEqual(canUpdateTAOContentState, true, "account1 can update TAO Content State for non-T(AO) content");

		signature = createSignature(account1PrivateKey, contentId3, someAddress, taoContentState_acceptedToTAO);
		vrs = EthCrypto.vrs.fromString(signature);
		try {
			await aocontent.updateTAOContentState(contentId3, someAddress, taoContentState_acceptedToTAO, vrs.v, vrs.r, vrs.s, {
				from: account1
			});
			canUpdateTAOContentState = true;
		} catch (e) {
			canUpdateTAOContentState = false;
		}
		assert.notEqual(canUpdateTAOContentState, true, "account1 can update TAO Content State with invalid TAO");

		signature = createSignature(account1PrivateKey, contentId3, taoId2, taoContentState_acceptedToTAO);
		vrs = EthCrypto.vrs.fromString(signature);
		try {
			await aocontent.updateTAOContentState(contentId3, taoId2, taoContentState_acceptedToTAO, 0, vrs.r, vrs.s, {
				from: account1
			});
			canUpdateTAOContentState = true;
		} catch (e) {
			canUpdateTAOContentState = false;
		}
		assert.notEqual(canUpdateTAOContentState, true, "account1 can update TAO Content State with missing v part of the signature");

		try {
			await aocontent.updateTAOContentState(contentId3, taoId2, taoContentState_acceptedToTAO, vrs.v, "", vrs.s, {
				from: account1
			});
			canUpdateTAOContentState = true;
		} catch (e) {
			canUpdateTAOContentState = false;
		}
		assert.notEqual(canUpdateTAOContentState, true, "account1 can update TAO Content State with missing r part of the signature");

		try {
			await aocontent.updateTAOContentState(contentId3, taoId2, taoContentState_acceptedToTAO, vrs.v, vrs.r, "", {
				from: account1
			});
			canUpdateTAOContentState = true;
		} catch (e) {
			canUpdateTAOContentState = false;
		}
		assert.notEqual(canUpdateTAOContentState, true, "account1 can update TAO Content State with missing s part of the signature");

		try {
			await aocontent.updateTAOContentState(contentId3, taoId2, taoContentState_acceptedToTAO, vrs.v, vrs.r, vrs.s, {
				from: account2
			});
			canUpdateTAOContentState = true;
		} catch (e) {
			canUpdateTAOContentState = false;
		}
		assert.notEqual(canUpdateTAOContentState, true, "other account can update TAO Content State using other's signature");

		signature = createSignature(account2PrivateKey, contentId3, taoId3, taoContentState_acceptedToTAO);
		vrs = EthCrypto.vrs.fromString(signature);
		try {
			await aocontent.updateTAOContentState(contentId3, taoId3, taoContentState_acceptedToTAO, vrs.v, vrs.r, vrs.s, {
				from: account2
			});
			canUpdateTAOContentState = true;
		} catch (e) {
			canUpdateTAOContentState = false;
		}
		assert.notEqual(canUpdateTAOContentState, true, "Non-Advocate/Listener/Speaker of Content's TAO ID can update TAO Content State");
	});

	it("should be able to check whether or not a content is of AO Content usage type", async function() {
		var isAOContentUsageType = await aocontent.isAOContentUsageType(contentId1);
		assert.equal(isAOContentUsageType, true, "isAOContentUsageType returns incorrect value for AO Content");

		isAOContentUsageType = await aocontent.isAOContentUsageType(contentId2);
		assert.equal(isAOContentUsageType, false, "isAOContentUsageType returns incorrect value for non-AO Content");

		isAOContentUsageType = await aocontent.isAOContentUsageType(contentId3);
		assert.equal(isAOContentUsageType, false, "isAOContentUsageType returns incorrect value for non-AO Content");
	});

	it("should be able to set ExtraData on existing content", async function() {
		var extraData = "someextradata";
		var canSetExtraData, setExtraDataEvent, contentId;
		try {
			var result = await aocontent.setExtraData("someid", extraData, { from: account1 });
			canSetExtraData = true;
			setExtraDataEvent = result.logs[0];
			contentId = setExtraDataEvent.args.contentId;
		} catch (e) {
			canSetExtraData = false;
			setExtraDataEvent = null;
			contentId = null;
		}
		assert.equal(canSetExtraData, false, "Account can set extraData on non-existing content");

		try {
			var result = await aocontent.setExtraData(contentId1, extraData, { from: account2 });
			canSetExtraData = true;
			setExtraDataEvent = result.logs[0];
			contentId = setExtraDataEvent.args.contentId;
		} catch (e) {
			canSetExtraData = false;
			setExtraDataEvent = null;
			contentId = null;
		}
		assert.equal(canSetExtraData, false, "Non-content creator can set extraData on existing content");

		try {
			var result = await aocontent.setExtraData(contentId1, extraData, { from: account1 });
			canSetExtraData = true;
			setExtraDataEvent = result.logs[0];
			contentId = setExtraDataEvent.args.contentId;
		} catch (e) {
			canSetExtraData = false;
			setExtraDataEvent = null;
			contentId = null;
		}
		assert.equal(canSetExtraData, true, "Content creator can't set extraData on existing content");

		var content = await aocontent.getById(contentId);
		assert.equal(content[8], extraData, "Content has incorrect extraData");
	});
});
