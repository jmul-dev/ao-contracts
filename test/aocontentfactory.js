var AOLibrary = artifacts.require("./AOLibrary.sol");
var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var AOIon = artifacts.require("./AOIon.sol");
var AOTreasury = artifacts.require("./AOTreasury.sol");
var AOSetting = artifacts.require("./AOSetting.sol");
var AOContent = artifacts.require("./AOContent.sol");
var AOStakedContent = artifacts.require("./AOStakedContent.sol");
var AOContentHost = artifacts.require("./AOContentHost.sol");
var AOPurchaseReceipt = artifacts.require("./AOPurchaseReceipt.sol");
var AOEarning = artifacts.require("./AOEarning.sol");
var AOContentFactory = artifacts.require("./AOContentFactory.sol");
var Logos = artifacts.require("./Logos.sol");

var EthCrypto = require("eth-crypto");
var BigNumber = require("bignumber.js");

BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: 1, EXPONENTIAL_AT: [-10, 40] }); // no rounding

contract("AOContentFactory", function(accounts) {
	var library,
		namefactory,
		taofactory,
		nametaoposition,
		aoion,
		aotreasury,
		aosetting,
		aocontent,
		aostakedcontent,
		aocontenthost,
		aopurchasereceipt,
		aoearning,
		aocontentfactory,
		logos,
		settingTAOId,
		contentUsageType_aoContent,
		contentUsageType_creativeCommons,
		contentUsageType_taoContent,
		taoContentState_submitted,
		nameId1,
		nameId2,
		nameId3,
		nameId4,
		taoId1,
		taoId2,
		contentId1,
		contentId2,
		contentId3,
		stakedContentId1,
		stakedContentId2,
		stakedContentId3,
		contentHostId1,
		contentHostId2,
		contentHostId3,
		purchaseReceiptId1,
		purchaseReceiptId2,
		purchaseReceiptId3;

	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var someAddress = accounts[4];
	var whitelistedAddress = accounts[5];

	var baseChallenge = "basechallengestring";
	var fileSize = 1000000; // 1000000 bytes = min 1000000 AO
	var emptyAddress = "0x0000000000000000000000000000000000000000";
	var nullBytesValue = "0x0000000000000000000000000000000000000000000000000000000000000000";

	var account1EncChallenge = "encchallengestring";
	var account1ContentDatKey = "7bde24fb38d6e316ec48874c937f4582f3a494df1ecf387e6edb2e25bff700f7";
	var account1MetadataDatKey = "7bde24fb38d6e316ec48874c937f4582f3a494df1ecf387e6edb2e25bff700f7";

	var account2EncChallenge = "account2encchallengestring";
	var account2ContentDatKey = "02bde24fb38d6e316ec48874c937f4582f3a494df1ecf38eofu2ufgooi2ho2ie";
	var account2MetadataDatKey = "02bde24fb38d6e316ec48874c937f4582f3a494df1ecf38eofu2ufgooi2ho2ie";

	var account3EncChallenge = "account3encchallengestring";
	var account3ContentDatKey = "90bde24fb38d6e316ec48874c937f4582f3a494df1ecf38eofu2ufgooi2ho2ie";
	var account3MetadataDatKey = "90bde24fb38d6e316ec48874c937f4582f3a494df1ecf38eofu2ufgooi2ho2ie";

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

	before(async function() {
		library = await AOLibrary.deployed();
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		aoion = await AOIon.deployed();
		aotreasury = await AOTreasury.deployed();
		aosetting = await AOSetting.deployed();
		aocontent = await AOContent.deployed();
		aostakedcontent = await AOStakedContent.deployed();
		aocontenthost = await AOContentHost.deployed();
		aopurchasereceipt = await AOPurchaseReceipt.deployed();
		aoearning = await AOEarning.deployed();
		aocontentfactory = await AOContentFactory.deployed();
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

		// Create Name
		var result = await namefactory.createName("charlie", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account1
		});
		nameId1 = await namefactory.ethAddressToNameId(account1);

		var result = await namefactory.createName("delta", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account2
		});
		nameId2 = await namefactory.ethAddressToNameId(account2);

		var result = await namefactory.createName("echo", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account3
		});
		nameId3 = await namefactory.ethAddressToNameId(account3);

		// Mint Logos to nameId1 and nameId2
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

		// AOContent/AOStakedContent/AOContentHost/AOPurchaseReceipt grant access to whitelistedAddress
		await aocontent.setWhitelist(whitelistedAddress, true, { from: theAO });
		await aostakedcontent.setWhitelist(whitelistedAddress, true, { from: theAO });
		await aocontenthost.setWhitelist(whitelistedAddress, true, { from: theAO });
		await aopurchasereceipt.setWhitelist(whitelistedAddress, true, { from: theAO });

		// Let's give accounts some ions
		await aoion.setWhitelist(theAO, true, { from: theAO });
		await aoion.mint(account1, 10 ** 9, { from: theAO }); // 1,000,000,000 AO Ion
		// Buy 2 lots so that we can test avg weighted multiplier
		await aoion.buyPrimordial({ from: account1, value: 500000000000 });
		await aoion.buyPrimordial({ from: account1, value: 500000000000 });

		await aoion.mint(account2, 10 ** 9, { from: theAO }); // 1,000,000,000 AO Ion
		// Buy 2 lots so that we can test avg weighted multiplier
		await aoion.buyPrimordial({ from: account2, value: 500000000000 });
		await aoion.buyPrimordial({ from: account2, value: 500000000000 });

		await aoion.mint(account3, 10 ** 9, { from: theAO }); // 1,000,000,000 AO Ion
	});

	var createBecomeHostSignature = function(privateKey, _baseChallenge) {
		var signHash = EthCrypto.hash.keccak256([
			{
				type: "address",
				value: aocontenthost.address
			},
			{
				type: "string",
				value: _baseChallenge
			}
		]);

		var signature = EthCrypto.sign(privateKey, signHash);
		var vrs = EthCrypto.vrs.fromString(signature);
		return vrs;
	};

	it("The AO - should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await aocontentfactory.transferOwnership(taoId1, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await aocontentfactory.transferOwnership(taoId1, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await aocontentfactory.theAO();
		assert.equal(newTheAO, taoId1, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await aocontentfactory.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await aocontentfactory.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await aocontentfactory.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
	});

	it("The AO - should be able to set settingTAOId", async function() {
		var canSetSettingTAOId;
		try {
			await aocontentfactory.setSettingTAOId(settingTAOId, { from: someAddress });
			canSetSettingTAOId = true;
		} catch (e) {
			canSetSettingTAOId = false;
		}
		assert.equal(canSetSettingTAOId, false, "Non-AO can set settingTAOId");

		try {
			await aocontentfactory.setSettingTAOId(settingTAOId, { from: account1 });
			canSetSettingTAOId = true;
		} catch (e) {
			canSetSettingTAOId = false;
		}
		assert.equal(canSetSettingTAOId, true, "The AO can't set settingTAOId");

		var _settingTAOId = await aocontentfactory.settingTAOId();
		assert.equal(_settingTAOId, settingTAOId, "Contract has incorrect settingTAOId");
	});

	it("The AO - should be able to set AOSetting address", async function() {
		var canSetAddress;
		try {
			await aocontentfactory.setAOSettingAddress(aosetting.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOSetting address");

		try {
			await aocontentfactory.setAOSettingAddress(aosetting.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOSetting address");

		var aoSettingAddress = await aocontentfactory.aoSettingAddress();
		assert.equal(aoSettingAddress, aosetting.address, "Contract has incorrect aoSettingAddress");
	});

	it("The AO - should be able to set AOTreasury address", async function() {
		var canSetAddress;
		try {
			await aocontentfactory.setAOTreasuryAddress(aotreasury.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOTreasury address");

		try {
			await aocontentfactory.setAOTreasuryAddress(aotreasury.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOTreasury address");

		var aoTreasuryAddress = await aocontentfactory.aoTreasuryAddress();
		assert.equal(aoTreasuryAddress, aotreasury.address, "Contract has incorrect aoTreasuryAddress");
	});

	it("The AO - should be able to set AOContent address", async function() {
		var canSetAddress;
		try {
			await aocontentfactory.setAOContentAddress(aocontent.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOContent address");

		try {
			await aocontentfactory.setAOContentAddress(aocontent.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOContent address");

		var aoContentAddress = await aocontentfactory.aoContentAddress();
		assert.equal(aoContentAddress, aocontent.address, "Contract has incorrect aoContentAddress");
	});

	it("The AO - should be able to set AOStakedContent address", async function() {
		var canSetAddress;
		try {
			await aocontentfactory.setAOStakedContentAddress(aostakedcontent.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOStakedContent address");

		try {
			await aocontentfactory.setAOStakedContentAddress(aostakedcontent.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOStakedContent address");

		var aoStakedContentAddress = await aocontentfactory.aoStakedContentAddress();
		assert.equal(aoStakedContentAddress, aostakedcontent.address, "Contract has incorrect aoStakedContentAddress");
	});

	it("The AO - should be able to set AOContentHost address", async function() {
		var canSetAddress;
		try {
			await aocontentfactory.setAOContentHostAddress(aocontenthost.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOContentHost address");

		try {
			await aocontentfactory.setAOContentHostAddress(aocontenthost.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOContentHost address");

		var aoContentHostAddress = await aocontentfactory.aoContentHostAddress();
		assert.equal(aoContentHostAddress, aocontenthost.address, "Contract has incorrect aoContentHostAddress");
	});

	it("The AO - should be able to set AOEarning address", async function() {
		var canSetAddress;
		try {
			await aocontentfactory.setAOEarningAddress(aoearning.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOEarning address");

		try {
			await aocontentfactory.setAOEarningAddress(aoearning.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOEarning address");

		var aoEarningAddress = await aocontentfactory.aoEarningAddress();
		assert.equal(aoEarningAddress, aoearning.address, "Contract has incorrect aoEarningAddress");
	});

	it("The AO - should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await aocontentfactory.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await aocontentfactory.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await aocontentfactory.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("stakeAOContent() - should be able to create and stake an AO Content", async function() {
		var networkIntegerAmount = 5;
		var networkFractionAmount = 10;
		var denomination = "mega";
		var primordialAmount = 1000;
		var networkAmount = await aotreasury.toBase(networkIntegerAmount, networkFractionAmount, denomination);
		var accountWeightedMultiplier = await aoion.weightedMultiplierByAddress(account1);
		var profitPercentage = 100000;

		var _event = aocontenthost.HostContent();
		_event.watch(async function(error, log) {
			if (!error) {
				if (log.event === "HostContent") {
					contentId1 = log.args.contentId;
					stakedContentId1 = log.args.stakedContentId;
					contentHostId1 = log.args.contentHostId;

					var content = await aocontent.getById(contentId1);
					assert.equal(content[0], account1, "Content has incorrect creator");
					assert.equal(content[1].toNumber(), fileSize, "Content has incorrect creator");
					assert.equal(content[2], contentUsageType_aoContent, "Content has incorrect contentUsageType");
					assert.equal(content[5].toNumber(), 0, "Content has incorrect updateTAOContentStateV");
					assert.equal(content[6], nullBytesValue, "Content has incorrect updateTAOContentStateR");
					assert.equal(content[7], nullBytesValue, "Content has incorrect updateTAOContentStateS");
					assert.equal(content[8], "", "Content has incorrect extraData");

					var stakedContent = await aostakedcontent.getById(stakedContentId1);
					assert.equal(stakedContent[0], contentId1, "StakedContent has incorrect contentId");
					assert.equal(stakedContent[1], account1, "StakedContent has incorrect stakeOwner");
					assert.equal(stakedContent[2].toNumber(), networkAmount.toNumber(), "StakedContent has incorrect networkAmount");
					assert.equal(stakedContent[3].toNumber(), primordialAmount, "StakedContent has incorrect primordialAmount");
					assert.equal(
						stakedContent[4].toNumber(),
						primordialAmount ? accountWeightedMultiplier.toNumber() : 0,
						"StakedContent has incorrect primordialWeightedMultiplier"
					);
					assert.equal(stakedContent[5].toNumber(), profitPercentage, "StakedContent has incorrect profitPercentage");
					assert.equal(stakedContent[6], true, "StakedContent has incorrect active");

					var contentHost = await aocontenthost.getById(contentHostId1);
					assert.equal(contentHost[0], stakedContentId1, "ContentHost has incorrect stakedContentId");
					assert.equal(contentHost[1], contentId1, "ContentHost has incorrect contentId");
					assert.equal(contentHost[2], account1, "ContentHost has incorrect host");
					assert.equal(contentHost[3], account1ContentDatKey, "ContentHost has incorrect contentDatKey");
					assert.equal(contentHost[4], account1MetadataDatKey, "ContentHost has incorrect metadataDatKey");
				}
			}
			_event.stopWatching();
		});

		var canStakeAOContent;
		try {
			await aocontentfactory.stakeAOContent(
				networkIntegerAmount,
				networkFractionAmount,
				denomination,
				primordialAmount,
				baseChallenge,
				account1EncChallenge,
				account1ContentDatKey,
				account1MetadataDatKey,
				fileSize,
				profitPercentage,
				{ from: account1 }
			);
			canStakeAOContent = true;
		} catch (e) {
			canStakeAOContent = false;
		}
		assert.equal(canStakeAOContent, true, "Account can't create and stake AO Content");
	});

	it("stakeCreativeCommonsContent() - should be able to create and stake a Creative Commons Content", async function() {
		var networkIntegerAmount = 1;
		var networkFractionAmount = 0;
		var denomination = "mega";
		var primordialAmount = 0;
		var networkAmount = await aotreasury.toBase(networkIntegerAmount, networkFractionAmount, denomination);
		var accountWeightedMultiplier = await aoion.weightedMultiplierByAddress(account1);
		var profitPercentage = 0;

		var _event = aocontenthost.HostContent();
		_event.watch(async function(error, log) {
			if (!error) {
				if (log.event === "HostContent") {
					contentId2 = log.args.contentId;
					stakedContentId2 = log.args.stakedContentId;
					contentHostId2 = log.args.contentHostId;

					var content = await aocontent.getById(contentId2);
					assert.equal(content[0], account1, "Content has incorrect creator");
					assert.equal(content[1].toNumber(), fileSize, "Content has incorrect creator");
					assert.equal(content[2], contentUsageType_creativeCommons, "Content has incorrect contentUsageType");
					assert.equal(content[5].toNumber(), 0, "Content has incorrect updateTAOContentStateV");
					assert.equal(content[6], nullBytesValue, "Content has incorrect updateTAOContentStateR");
					assert.equal(content[7], nullBytesValue, "Content has incorrect updateTAOContentStateS");
					assert.equal(content[8], "", "Content has incorrect extraData");

					var stakedContent = await aostakedcontent.getById(stakedContentId2);
					assert.equal(stakedContent[0], contentId2, "StakedContent has incorrect contentId");
					assert.equal(stakedContent[1], account1, "StakedContent has incorrect stakeOwner");
					assert.equal(stakedContent[2].toNumber(), networkAmount.toNumber(), "StakedContent has incorrect networkAmount");
					assert.equal(stakedContent[3].toNumber(), primordialAmount, "StakedContent has incorrect primordialAmount");
					assert.equal(
						stakedContent[4].toNumber(),
						primordialAmount ? accountWeightedMultiplier.toNumber() : 0,
						"StakedContent has incorrect primordialWeightedMultiplier"
					);
					assert.equal(stakedContent[5].toNumber(), profitPercentage, "StakedContent has incorrect profitPercentage");
					assert.equal(stakedContent[6], true, "StakedContent has incorrect active");

					var contentHost = await aocontenthost.getById(contentHostId2);
					assert.equal(contentHost[0], stakedContentId2, "ContentHost has incorrect stakedContentId");
					assert.equal(contentHost[1], contentId2, "ContentHost has incorrect contentId");
					assert.equal(contentHost[2], account1, "ContentHost has incorrect host");
					assert.equal(contentHost[3], account1ContentDatKey, "ContentHost has incorrect contentDatKey");
					assert.equal(contentHost[4], account1MetadataDatKey, "ContentHost has incorrect metadataDatKey");
				}
			}
			_event.stopWatching();
		});

		var canStakeCreativeCommonsContent;
		try {
			await aocontentfactory.stakeCreativeCommonsContent(
				networkIntegerAmount,
				networkFractionAmount,
				denomination,
				primordialAmount,
				baseChallenge,
				account1EncChallenge,
				account1ContentDatKey,
				account1MetadataDatKey,
				fileSize,
				{ from: account1 }
			);
			canStakeCreativeCommonsContent = true;
		} catch (e) {
			canStakeCreativeCommonsContent = false;
		}
		assert.equal(canStakeCreativeCommonsContent, true, "Account can't create and stake Creative Commons Content");
	});

	it("stakeTAOContent() - should be able to create and stake a T(AO) Content", async function() {
		var networkIntegerAmount = 0;
		var networkFractionAmount = 0;
		var denomination = "";
		var primordialAmount = 1000000;
		var networkAmount = await aotreasury.toBase(networkIntegerAmount, networkFractionAmount, denomination);
		var accountWeightedMultiplier = await aoion.weightedMultiplierByAddress(account1);
		var profitPercentage = 0;

		var _event = aocontenthost.HostContent();
		_event.watch(async function(error, log) {
			if (!error) {
				if (log.event === "HostContent") {
					contentId3 = log.args.contentId;
					stakedContentId3 = log.args.stakedContentId;
					contentHostId3 = log.args.contentHostId;

					var content = await aocontent.getById(contentId3);
					assert.equal(content[0], account1, "Content has incorrect creator");
					assert.equal(content[1].toNumber(), fileSize, "Content has incorrect creator");
					assert.equal(content[2], contentUsageType_taoContent, "Content has incorrect contentUsageType");
					assert.equal(content[3], taoId1, "Content has incorrect taoId");
					assert.equal(content[4], taoContentState_submitted, "Content has incorrect taoContentState");
					assert.equal(content[5].toNumber(), 0, "Content has incorrect updateTAOContentStateV");
					assert.equal(content[6], nullBytesValue, "Content has incorrect updateTAOContentStateR");
					assert.equal(content[7], nullBytesValue, "Content has incorrect updateTAOContentStateS");
					assert.equal(content[8], "", "Content has incorrect extraData");

					var stakedContent = await aostakedcontent.getById(stakedContentId3);
					assert.equal(stakedContent[0], contentId3, "StakedContent has incorrect contentId");
					assert.equal(stakedContent[1], account1, "StakedContent has incorrect stakeOwner");
					assert.equal(stakedContent[2].toNumber(), networkAmount.toNumber(), "StakedContent has incorrect networkAmount");
					assert.equal(stakedContent[3].toNumber(), primordialAmount, "StakedContent has incorrect primordialAmount");
					assert.equal(
						stakedContent[4].toNumber(),
						primordialAmount ? accountWeightedMultiplier.toNumber() : 0,
						"StakedContent has incorrect primordialWeightedMultiplier"
					);
					assert.equal(stakedContent[5].toNumber(), profitPercentage, "StakedContent has incorrect profitPercentage");
					assert.equal(stakedContent[6], true, "StakedContent has incorrect active");

					var contentHost = await aocontenthost.getById(contentHostId3);
					assert.equal(contentHost[0], stakedContentId3, "ContentHost has incorrect stakedContentId");
					assert.equal(contentHost[1], contentId3, "ContentHost has incorrect contentId");
					assert.equal(contentHost[2], account1, "ContentHost has incorrect host");
					assert.equal(contentHost[3], account1ContentDatKey, "ContentHost has incorrect contentDatKey");
					assert.equal(contentHost[4], account1MetadataDatKey, "ContentHost has incorrect metadataDatKey");
				}
			}
			_event.stopWatching();
		});

		var canStakeTAOContent;
		try {
			await aocontentfactory.stakeTAOContent(
				networkIntegerAmount,
				networkFractionAmount,
				denomination,
				primordialAmount,
				baseChallenge,
				account1EncChallenge,
				account1ContentDatKey,
				account1MetadataDatKey,
				fileSize,
				taoId1,
				{ from: account1 }
			);
			canStakeTAOContent = true;
		} catch (e) {
			canStakeTAOContent = false;
		}
		assert.equal(canStakeTAOContent, true, "Account can't create and stake T(AO) Content");
	});

	it("getStakingMetrics() - should return correct staking information of a StakedContent", async function() {
		var canGetStakingMetrics;
		try {
			var stakingMetrics = await aocontentfactory.getStakingMetrics(someAddress);
			canGetStakingMetrics = true;
		} catch (e) {
			canGetStakingMetrics = false;
		}
		assert.equal(canGetStakingMetrics, false, "Contract can get staking metrics of non-existing StakedContent");

		var getStakingMetrics = async function(stakedContentId) {
			var stakingMetrics = await aocontentfactory.getStakingMetrics(stakedContentId);
			var stakedContent = await aostakedcontent.getById(stakedContentId);

			assert.equal(
				stakingMetrics[0].toNumber(),
				stakedContent[2].toNumber(),
				"getStakingMetrics() returns incorrect value for networkAmount"
			);
			assert.equal(
				stakingMetrics[1].toNumber(),
				stakedContent[3].toNumber(),
				"getStakingMetrics() returns incorrect value for primordialAmount"
			);
			assert.equal(
				stakingMetrics[2].toNumber(),
				stakedContent[4].toNumber(),
				"getStakingMetrics() returns incorrect value for primordialWeightedMultiplier"
			);
		};

		await getStakingMetrics(stakedContentId1);
		await getStakingMetrics(stakedContentId2);
		await getStakingMetrics(stakedContentId3);
	});

	it("getEarningMetrics() - should return correct earning information of a StakedContent", async function() {
		// Buy the content and become host
		var result = await aopurchasereceipt.buyContent(
			contentHostId1,
			5,
			1100,
			"mega",
			account3LocalIdentity.publicKey,
			account3LocalIdentity.address,
			{ from: account3 }
		);
		var buyContentEvent = result.logs[0];
		purchaseReceiptId1 = buyContentEvent.args.purchaseReceiptId;

		result = await aopurchasereceipt.buyContent(
			contentHostId2,
			0,
			0,
			"",
			account3LocalIdentity.publicKey,
			account3LocalIdentity.address,
			{ from: account3 }
		);
		buyContentEvent = result.logs[0];
		purchaseReceiptId2 = buyContentEvent.args.purchaseReceiptId;

		result = await aopurchasereceipt.buyContent(
			contentHostId3,
			0,
			0,
			"",
			account3LocalIdentity.publicKey,
			account3LocalIdentity.address,
			{ from: account3 }
		);
		buyContentEvent = result.logs[0];
		purchaseReceiptId3 = buyContentEvent.args.purchaseReceiptId;

		var vrs = createBecomeHostSignature(account3PrivateKey, baseChallenge);
		result = await aocontenthost.becomeHost(
			purchaseReceiptId1,
			vrs.v,
			vrs.r,
			vrs.s,
			account3EncChallenge,
			account3ContentDatKey,
			account3MetadataDatKey,
			{ from: account3 }
		);

		result = await aocontenthost.becomeHost(
			purchaseReceiptId2,
			vrs.v,
			vrs.r,
			vrs.s,
			account3EncChallenge,
			account3ContentDatKey,
			account3MetadataDatKey,
			{ from: account3 }
		);

		result = await aocontenthost.becomeHost(
			purchaseReceiptId3,
			vrs.v,
			vrs.r,
			vrs.s,
			account3EncChallenge,
			account3ContentDatKey,
			account3MetadataDatKey,
			{ from: account3 }
		);

		var getEarningMetrics = async function(stakedContentId) {
			var earningMetrics = await aocontentfactory.getEarningMetrics(stakedContentId);
			var totalStakedContentEarning = await aoearning.getTotalStakedContentEarning(stakedContentId);
			assert.equal(
				earningMetrics[0].toNumber(),
				totalStakedContentEarning[0].toNumber(),
				"getEarningMetrics() returns incorrect value for total earning from staking the content"
			);
			assert.equal(
				earningMetrics[1].toNumber(),
				totalStakedContentEarning[1].toNumber(),
				"getEarningMetrics() returns incorrect value for total earning from hosting the content"
			);
			assert.equal(
				earningMetrics[2].toNumber(),
				totalStakedContentEarning[2].toNumber(),
				"getEarningMetrics() returns incorrect value for total The AO earning of the content"
			);
		};

		await getEarningMetrics(stakedContentId1);
		await getEarningMetrics(stakedContentId2);
		await getEarningMetrics(stakedContentId3);
	});

	it("getContentMetrics() - should return correct staking and earning information of a StakedContent", async function() {
		var getContentMetrics = async function(stakedContentId) {
			var contentMetrics = await aocontentfactory.getContentMetrics(stakedContentId);
			var stakingMetrics = await aocontentfactory.getStakingMetrics(stakedContentId);
			var earningMetrics = await aocontentfactory.getEarningMetrics(stakedContentId);

			assert.equal(
				contentMetrics[0].toNumber(),
				stakingMetrics[0].toNumber(),
				"getContentMetrics() returns incorrect value for networkAmount"
			);
			assert.equal(
				contentMetrics[1].toNumber(),
				stakingMetrics[1].toNumber(),
				"getContentMetrics() returns incorrect value for primordialAmount"
			);
			assert.equal(
				contentMetrics[2].toNumber(),
				stakingMetrics[2].toNumber(),
				"getContentMetrics() returns incorrect value for primordialWeightedMultiplier"
			);
			assert.equal(
				contentMetrics[3].toNumber(),
				earningMetrics[0].toNumber(),
				"getContentMetrics() returns incorrect value for total earning from staking the content"
			);
			assert.equal(
				contentMetrics[4].toNumber(),
				earningMetrics[1].toNumber(),
				"getContentMetrics() returns incorrect value for total earning from hosting the content"
			);
			assert.equal(
				contentMetrics[5].toNumber(),
				earningMetrics[2].toNumber(),
				"getContentMetrics() returns incorrect value for total The AO earning of the content"
			);
		};
		await getContentMetrics(stakedContentId1);
		await getContentMetrics(stakedContentId2);
		await getContentMetrics(stakedContentId3);
	});
});
