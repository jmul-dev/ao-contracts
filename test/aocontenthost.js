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
var Logos = artifacts.require("./Logos.sol");

var EthCrypto = require("eth-crypto");
var BigNumber = require("bignumber.js");

BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: 1, EXPONENTIAL_AT: [-10, 40] }); // no rounding

contract("AOContentHost", function(accounts) {
	var namefactory,
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
		logos,
		settingTAOId,
		contentUsageType_aoContent,
		contentUsageType_creativeCommons,
		contentUsageType_taoContent,
		nameId1,
		nameId2,
		nameId3,
		nameId4,
		taoId1,
		contentId1,
		contentId2,
		contentId3,
		stakedContentId1,
		stakedContentId2,
		stakedContentId3,
		contentHostId1,
		contentHostId2,
		contentHostId3,
		contentHostId4,
		contentHostId5,
		contentHostId6,
		purchaseReceiptId1,
		purchaseReceiptId2,
		purchaseReceiptId3,
		purchaseReceiptId4,
		purchaseReceiptId5,
		purchaseReceiptId6;

	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var account4 = accounts[4];
	var someAddress = accounts[5];
	var whitelistedAddress = accounts[6];

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

	var account4EncChallenge = "account4encchallengestring";
	var account4ContentDatKey = "90bde24fb38d6e316ec48874c937f4582f3a494df1ecf38eofu2ufgooi2hoeee";
	var account4MetadataDatKey = "90bde24fb38d6e316ec48874c937f4582f3a494df1ecf38eofu2ufgooi2hoeee";

	// Retrieve private key from ganache
	var account1PrivateKey = "0xfa372b56eac0e71de587267f0a59989719b2325aeb4579912379641cf93ccaab";
	var account2PrivateKey = "0x6a35c58d0acad0ceca9c03d37aa2d2288d70afe0690f5e5f5e05aeab93b95dad";
	var account3PrivateKey = "0xf4bab2d2f0c5119cc6aad0735bbf0a017d229cbf430c0041af382b93e713a1c3";
	var account4PrivateKey = "0xfc164bb116857e2b7e5bafb6f515c61cc2cddae22a052c3988c8ff5de598ede0";
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
	var account4LocalIdentity = {
		publicKey: EthCrypto.publicKeyByPrivateKey(account4PrivateKey),
		address: EthCrypto.publicKey.toAddress(EthCrypto.publicKeyByPrivateKey(account4PrivateKey))
	};

	before(async function() {
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

		logos = await Logos.deployed();

		settingTAOId = await aocontent.settingTAOId();

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "contentUsageType_aoContent");
		contentUsageType_aoContent = settingValues[3];

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "contentUsageType_creativeCommons");
		contentUsageType_creativeCommons = settingValues[3];

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "contentUsageType_taoContent");
		contentUsageType_taoContent = settingValues[3];

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

		var result = await namefactory.createName("foxtrot", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account4
		});
		nameId4 = await namefactory.ethAddressToNameId(account4);

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

		// AOContent/AOStakedContent/AOPurchaseReceipt grant access to whitelistedAddress
		await aocontent.setWhitelist(whitelistedAddress, true, { from: theAO });
		await aostakedcontent.setWhitelist(whitelistedAddress, true, { from: theAO });
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
		await aoion.mint(account4, 10 ** 9, { from: theAO }); // 1,000,000,000 AO Ion
	});

	var create = async function(host, stakedContentId, encChallenge, contentDatKey, metadataDatKey) {
		var canHostContent, hostContentEvent, contentHostId;
		try {
			var result = await aocontenthost.create(host, stakedContentId, encChallenge, contentDatKey, metadataDatKey, {
				from: whitelistedAddress
			});
			canHostContent = true;
			hostContentEvent = result.logs[0];
			contentHostId = hostContentEvent.args.contentHostId;
		} catch (e) {
			canHostContent = false;
			hostContentEvent = null;
			contentHostId = null;
		}
		assert.equal(canHostContent, true, "Whitelisted address can't host content");

		var stakedContent = await aostakedcontent.getById(stakedContentId);
		var contentHost = await aocontenthost.getById(contentHostId);
		assert.equal(contentHost[0], stakedContentId, "ContentHost has incorrect stakedContentId");
		assert.equal(contentHost[1], stakedContent[0], "ContentHost has incorrect contentId");
		assert.equal(contentHost[2], host, "ContentHost has incorrect host");
		assert.equal(contentHost[3], contentDatKey, "ContentHost has incorrect contentDatKey");
		assert.equal(contentHost[4], metadataDatKey, "ContentHost has incorrect metadataDatKey");
		return contentHostId;
	};

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

	var becomeHost = async function(
		account,
		purchaseReceiptId,
		baseChallengeV,
		baseChallengeR,
		baseChallengeS,
		encChallenge,
		contentDatKey,
		metadataDatKey
	) {
		var canBecomeHost, hostContentEvent, contentHostId;
		try {
			var result = await aocontenthost.becomeHost(
				purchaseReceiptId,
				baseChallengeV,
				baseChallengeR,
				baseChallengeS,
				encChallenge,
				contentDatKey,
				metadataDatKey,
				{ from: account }
			);
			canBecomeHost = true;
			hostContentEvent = result.logs[0];
			contentHostId = hostContentEvent.args.contentHostId;
		} catch (e) {
			canBecomeHost = false;
			hostContentEvent = null;
			contentHostId = null;
		}
		assert.equal(canBecomeHost, true, "Account can't host content after buying");

		var purchaseReceipt = await aopurchasereceipt.getById(purchaseReceiptId);
		var contentHost = await aocontenthost.getById(contentHostId);
		assert.equal(contentHost[0], purchaseReceipt[1], "ContentHost has incorrect stakedContentId");
		assert.equal(contentHost[1], purchaseReceipt[2], "ContentHost has incorrect contentId");
		assert.equal(contentHost[2], account, "ContentHost has incorrect host");
		assert.equal(contentHost[3], contentDatKey, "ContentHost has incorrect contentDatKey");
		assert.equal(contentHost[4], metadataDatKey, "ContentHost has incorrect metadataDatKey");
		return contentHostId;
	};

	it("The AO - should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await aocontenthost.transferOwnership(taoId1, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await aocontenthost.transferOwnership(taoId1, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await aocontenthost.theAO();
		assert.equal(newTheAO, taoId1, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await aocontenthost.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await aocontenthost.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await aocontenthost.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");

		// Create several contents
		var result = await aocontent.create(account1, baseChallenge, fileSize, contentUsageType_aoContent, emptyAddress, {
			from: whitelistedAddress
		});
		var storeContentEvent = result.logs[0];
		contentId1 = storeContentEvent.args.contentId;

		result = await aocontent.create(account2, baseChallenge, fileSize, contentUsageType_creativeCommons, emptyAddress, {
			from: whitelistedAddress
		});
		storeContentEvent = result.logs[0];
		contentId2 = storeContentEvent.args.contentId;

		result = await aocontent.create(account1, baseChallenge, fileSize, contentUsageType_taoContent, taoId1, {
			from: whitelistedAddress
		});
		storeContentEvent = result.logs[0];
		contentId3 = storeContentEvent.args.contentId;

		result = await aostakedcontent.create(account1, contentId1, 4, 1000, "mega", 100000, 100000, { from: whitelistedAddress });
		var stakeContentEvent = result.logs[0];
		stakedContentId1 = stakeContentEvent.args.stakedContentId;

		result = await aostakedcontent.create(account2, contentId2, 0, 0, "", 1000000, 100000, { from: whitelistedAddress });
		stakeContentEvent = result.logs[0];
		stakedContentId2 = stakeContentEvent.args.stakedContentId;

		result = await aostakedcontent.create(account1, contentId3, 1000000, 0, "ao", 0, 100000, { from: whitelistedAddress });
		stakeContentEvent = result.logs[0];
		stakedContentId3 = stakeContentEvent.args.stakedContentId;
	});

	it("The AO - should be able to set AOContent address", async function() {
		var canSetAddress;
		try {
			await aocontenthost.setAOContentAddress(aocontent.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOContent address");

		try {
			await aocontenthost.setAOContentAddress(aocontent.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOContent address");

		var aoContentAddress = await aocontenthost.aoContentAddress();
		assert.equal(aoContentAddress, aocontent.address, "Contract has incorrect aoContentAddress");
	});

	it("The AO - should be able to set AOStakedContent address", async function() {
		var canSetAddress;
		try {
			await aocontenthost.setAOStakedContentAddress(aostakedcontent.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOStakedContent address");

		try {
			await aocontenthost.setAOStakedContentAddress(aostakedcontent.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOStakedContent address");

		var aoStakedContentAddress = await aocontenthost.aoStakedContentAddress();
		assert.equal(aoStakedContentAddress, aostakedcontent.address, "Contract has incorrect aoStakedContentAddress");
	});

	it("The AO - should be able to set AOPurchaseReceipt address", async function() {
		var canSetAddress;
		try {
			await aocontenthost.setAOPurchaseReceiptAddress(aopurchasereceipt.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOPurchaseReceipt address");

		try {
			await aocontenthost.setAOPurchaseReceiptAddress(aopurchasereceipt.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOPurchaseReceipt address");

		var aoPurchaseReceiptAddress = await aocontenthost.aoPurchaseReceiptAddress();
		assert.equal(aoPurchaseReceiptAddress, aopurchasereceipt.address, "Contract has incorrect aoPurchaseReceiptAddress");
	});

	it("The AO - should be able to set AOEarning address", async function() {
		var canSetAddress;
		try {
			await aocontenthost.setAOEarningAddress(aoearning.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOEarning address");

		try {
			await aocontenthost.setAOEarningAddress(aoearning.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOEarning address");

		var aoEarningAddress = await aocontenthost.aoEarningAddress();
		assert.equal(aoEarningAddress, aoearning.address, "Contract has incorrect aoEarningAddress");
	});

	it("The AO - should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await aocontenthost.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await aocontenthost.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await aocontenthost.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("Whitelisted Address - should not be able to host content with invalid params", async function() {
		var canHostContent, hostContentEvent, contentHostId;
		try {
			var result = await aocontenthost.create(
				account1,
				stakedContentId1,
				account1EncChallenge,
				account1ContentDatKey,
				account1MetadataDatKey,
				{
					from: someAddress
				}
			);
			canHostContent = true;
			hostContentEvent = result.logs[0];
			contentHostId = hostContentEvent.args.contentHostId;
		} catch (e) {
			canHostContent = false;
			hostContentEvent = null;
			contentHostId = null;
		}
		assert.equal(canHostContent, false, "Non-whitelisted address can host content");

		try {
			var result = await aocontenthost.create(
				emptyAddress,
				stakedContentId1,
				account1EncChallenge,
				account1ContentDatKey,
				account1MetadataDatKey,
				{
					from: whitelistedAddress
				}
			);
			canHostContent = true;
			hostContentEvent = result.logs[0];
			contentHostId = hostContentEvent.args.contentHostId;
		} catch (e) {
			canHostContent = false;
			hostContentEvent = null;
			contentHostId = null;
		}
		assert.equal(canHostContent, false, "Whitelisted address can host content with invalid host address");

		try {
			var result = await aocontenthost.create(
				account1,
				someAddress,
				account1EncChallenge,
				account1ContentDatKey,
				account1MetadataDatKey,
				{
					from: whitelistedAddress
				}
			);
			canHostContent = true;
			hostContentEvent = result.logs[0];
			contentHostId = hostContentEvent.args.contentHostId;
		} catch (e) {
			canHostContent = false;
			hostContentEvent = null;
			contentHostId = null;
		}
		assert.equal(canHostContent, false, "Whitelisted address can host content with invalid Staked ID");

		try {
			var result = await aocontenthost.create(account1, stakedContentId1, "", account1ContentDatKey, account1MetadataDatKey, {
				from: whitelistedAddress
			});
			canHostContent = true;
			hostContentEvent = result.logs[0];
			contentHostId = hostContentEvent.args.contentHostId;
		} catch (e) {
			canHostContent = false;
			hostContentEvent = null;
			contentHostId = null;
		}
		assert.equal(canHostContent, false, "Whitelisted address can host content with invalid encChallenge");

		try {
			var result = await aocontenthost.create(account1, stakedContentId1, account1EncChallenge, "", account1MetadataDatKey, {
				from: whitelistedAddress
			});
			canHostContent = true;
			hostContentEvent = result.logs[0];
			contentHostId = hostContentEvent.args.contentHostId;
		} catch (e) {
			canHostContent = false;
			hostContentEvent = null;
			contentHostId = null;
		}
		assert.equal(canHostContent, false, "Whitelisted address can host content with invalid contentDatKey");

		try {
			var result = await aocontenthost.create(account1, stakedContentId1, account1EncChallenge, account1ContentDatKey, "", {
				from: whitelistedAddress
			});
			canHostContent = true;
			hostContentEvent = result.logs[0];
			contentHostId = hostContentEvent.args.contentHostId;
		} catch (e) {
			canHostContent = false;
			hostContentEvent = null;
			contentHostId = null;
		}
		assert.equal(canHostContent, false, "Whitelisted address can host content with invalid metadataDatKey");

		// Unstake stakedContentId1
		await aostakedcontent.unstakeContent(stakedContentId1, { from: account1 });

		try {
			var result = await aocontenthost.create(
				account1,
				stakedContentId1,
				account1EncChallenge,
				account1ContentDatKey,
				account1MetadataDatKey,
				{
					from: whitelistedAddress
				}
			);
			canHostContent = true;
			hostContentEvent = result.logs[0];
			contentHostId = hostContentEvent.args.contentHostId;
		} catch (e) {
			canHostContent = false;
			hostContentEvent = null;
			contentHostId = null;
		}
		assert.equal(canHostContent, false, "Whitelisted address can host content with inactive StakedContent ID");

		// Add stake to stakedContentId1 again
		await aostakedcontent.stakeExistingContent(stakedContentId1, 4, 1000, "mega", 100000, { from: account1 });
	});

	it("Whitelisted Address - should be able to host content", async function() {
		contentHostId1 = await create(account1, stakedContentId1, account1EncChallenge, account1ContentDatKey, account1MetadataDatKey);
		contentHostId2 = await create(account2, stakedContentId2, account2EncChallenge, account2ContentDatKey, account2MetadataDatKey);
		contentHostId3 = await create(account1, stakedContentId3, account1EncChallenge, account1ContentDatKey, account1MetadataDatKey);
	});

	it("contentHostPrice() - should return the content price hosted by a host", async function() {
		var contentHostPrice = async function(contentHostId) {
			var canGetContentHostPrice, contentHostPrice;
			try {
				contentHostPrice = await aocontenthost.contentHostPrice(contentHostId);
				canGetContentHostPrice = true;
			} catch (e) {
				canGetContentHostPrice = false;
			}
			assert.equal(canGetContentHostPrice, true, "Contract can't get content price of a hosted content");

			var contentHost = await aocontenthost.getById(contentHostId);
			var stakedContent = await aostakedcontent.getById(contentHost[0]);
			assert.equal(
				contentHostPrice.toNumber(),
				stakedContent[2].plus(stakedContent[3]).toNumber(),
				"ContentHostPrice() returns incorrect value"
			);
		};

		var canGetContentHostPrice, contentHostPrice;
		try {
			contentHostPrice = await aocontenthost.contentHostPrice(someAddress);
			canGetContentHostPrice = true;
		} catch (e) {
			canGetContentHostPrice = false;
		}
		assert.equal(canGetContentHostPrice, false, "Contract can get content price of a non-exist hosted content");

		// Unstake stakedContentId1
		await aostakedcontent.unstakeContent(stakedContentId1, { from: account1 });

		try {
			contentHostPrice = await aocontenthost.contentHostPrice(contentHostId1);
			canGetContentHostPrice = true;
		} catch (e) {
			canGetContentHostPrice = false;
		}
		assert.equal(canGetContentHostPrice, false, "Contract can get content price of a hosted content with inactive stake");

		// Add stake to stakedContentId1 again
		await aostakedcontent.stakeExistingContent(stakedContentId1, 4, 1000, "mega", 100000, { from: account1 });

		await contentHostPrice(contentHostId1);
		await contentHostPrice(contentHostId2);
		await contentHostPrice(contentHostId3);
	});

	it("contentHostPaidByAO() - should return the content price hosted by a host", async function() {
		var contentHostPaidByAO = async function(contentHostId, stakedContentId) {
			var canGetContentHostPaidByAO, contentHostPaidByAO;
			try {
				contentHostPaidByAO = await aocontenthost.contentHostPaidByAO(contentHostId);
				canGetContentHostPaidByAO = true;
			} catch (e) {
				canGetContentHostPaidByAO = false;
			}
			assert.equal(canGetContentHostPaidByAO, true, "Contract can't get content price of a hosted content");

			var contentHost = await aocontenthost.getById(contentHostId);
			var isAOContentUsageType = await aocontent.isAOContentUsageType(contentHost[1]);
			var contentHostPrice = await aocontenthost.contentHostPrice(contentHostId);
			if (isAOContentUsageType) {
				assert.equal(contentHostPaidByAO.toNumber(), 0, "ContentHostPaidByAO() returns incorrect value");
			} else {
				assert.equal(contentHostPaidByAO.toNumber(), contentHostPrice.toNumber(), "ContentHostPaidByAO() returns incorrect value");
			}
		};

		var canGetContentHostPaidByAO, contentHostPaidByAO;
		try {
			contentHostPaidByAO = await aocontenthost.contentHostPaidByAO(someAddress);
			canGetContentHostPaidByAO = true;
		} catch (e) {
			canGetContentHostPaidByAO = false;
		}
		assert.equal(canGetContentHostPaidByAO, false, "Contract can get content price of a non-exist hosted content");

		// Unstake stakedContentId1
		await aostakedcontent.unstakeContent(stakedContentId1, { from: account1 });

		try {
			contentHostPaidByAO = await aocontenthost.contentHostPaidByAO(contentHostId1);
			canGetContentHostPaidByAO = true;
		} catch (e) {
			canGetContentHostPaidByAO = false;
		}
		assert.equal(canGetContentHostPaidByAO, false, "Contract can get content price of a hosted content with inactive stake");

		// Add stake to stakedContentId1 again
		await aostakedcontent.stakeExistingContent(stakedContentId1, 4, 1000, "mega", 100000, { from: account1 });

		await contentHostPaidByAO(contentHostId1);
		await contentHostPaidByAO(contentHostId2);
		await contentHostPaidByAO(contentHostId3);
	});

	it("isExist() - should check whether or not a hosted content exist", async function() {
		var isExist = await aocontenthost.isExist(someAddress);
		assert.equal(isExist, false, "isExist() returns incorrect value");

		isExist = await aocontenthost.isExist(contentHostId1);
		assert.equal(isExist, true, "isExist() returns incorrect value");

		isExist = await aocontenthost.isExist(contentHostId2);
		assert.equal(isExist, true, "isExist() returns incorrect value");

		isExist = await aocontenthost.isExist(contentHostId3);
		assert.equal(isExist, true, "isExist() returns incorrect value");
	});

	it("becomeHost() - should not be able to become host with invalid params", async function() {
		// Account3 buy the contents
		var result = await aopurchasereceipt.buyContent(
			contentHostId1,
			5,
			0,
			"mega",
			account3LocalIdentity.publicKey,
			account3LocalIdentity.address,
			{ from: account3 }
		);
		var buyContentEvent = result.logs[0];
		purchaseReceiptId1 = buyContentEvent.args.purchaseReceiptId;

		result = await aopurchasereceipt.buyContent(
			contentHostId2,
			5,
			0,
			"mega",
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
		var canBecomeHost, hostContentEvent, contentHostId;
		try {
			var result = await aocontenthost.becomeHost(
				someAddress,
				vrs.v,
				vrs.r,
				vrs.s,
				account3EncChallenge,
				account3ContentDatKey,
				account3MetadataDatKey,
				{ from: account3 }
			);
			canBecomeHost = true;
			hostContentEvent = result.logs[0];
			contentHostId = hostContentEvent.args.contentHostId;
		} catch (e) {
			canBecomeHost = false;
			hostContentEvent = null;
			contentHostId = null;
		}
		assert.equal(canBecomeHost, false, "Account can become host using a non-exist PurchaseReceipt");

		try {
			var result = await aocontenthost.becomeHost(
				purchaseReceiptId1,
				"",
				vrs.r,
				vrs.s,
				account3EncChallenge,
				account3ContentDatKey,
				account3MetadataDatKey,
				{ from: account3 }
			);
			canBecomeHost = true;
			hostContentEvent = result.logs[0];
			contentHostId = hostContentEvent.args.contentHostId;
		} catch (e) {
			canBecomeHost = false;
			hostContentEvent = null;
			contentHostId = null;
		}
		assert.equal(canBecomeHost, false, "Account can become host using with invalid v part of a signature");

		try {
			var result = await aocontenthost.becomeHost(
				purchaseReceiptId1,
				vrs.v,
				"",
				vrs.s,
				account3EncChallenge,
				account3ContentDatKey,
				account3MetadataDatKey,
				{ from: account3 }
			);
			canBecomeHost = true;
			hostContentEvent = result.logs[0];
			contentHostId = hostContentEvent.args.contentHostId;
		} catch (e) {
			canBecomeHost = false;
			hostContentEvent = null;
			contentHostId = null;
		}
		assert.equal(canBecomeHost, false, "Account can become host using with invalid r part of a signature");

		try {
			var result = await aocontenthost.becomeHost(
				purchaseReceiptId1,
				vrs.v,
				vrs.r,
				"",
				account3EncChallenge,
				account3ContentDatKey,
				account3MetadataDatKey,
				{ from: account3 }
			);
			canBecomeHost = true;
			hostContentEvent = result.logs[0];
			contentHostId = hostContentEvent.args.contentHostId;
		} catch (e) {
			canBecomeHost = false;
			hostContentEvent = null;
			contentHostId = null;
		}
		assert.equal(canBecomeHost, false, "Account can become host using with invalid s part of a signature");

		try {
			var result = await aocontenthost.becomeHost(
				purchaseReceiptId1,
				vrs.v,
				vrs.r,
				vrs.s,
				"",
				account3ContentDatKey,
				account3MetadataDatKey,
				{ from: account3 }
			);
			canBecomeHost = true;
			hostContentEvent = result.logs[0];
			contentHostId = hostContentEvent.args.contentHostId;
		} catch (e) {
			canBecomeHost = false;
			hostContentEvent = null;
			contentHostId = null;
		}
		assert.equal(canBecomeHost, false, "Account can become host using with invalid encChallenge");

		try {
			var result = await aocontenthost.becomeHost(
				purchaseReceiptId1,
				vrs.v,
				vrs.r,
				vrs.s,
				account3EncChallenge,
				"",
				account3MetadataDatKey,
				{ from: account3 }
			);
			canBecomeHost = true;
			hostContentEvent = result.logs[0];
			contentHostId = hostContentEvent.args.contentHostId;
		} catch (e) {
			canBecomeHost = false;
			hostContentEvent = null;
			contentHostId = null;
		}
		assert.equal(canBecomeHost, false, "Account can become host using with invalid contentDatKey");

		try {
			var result = await aocontenthost.becomeHost(
				purchaseReceiptId1,
				vrs.v,
				vrs.r,
				vrs.s,
				account3EncChallenge,
				account3ContentDatKey,
				"",
				{ from: account3 }
			);
			canBecomeHost = true;
			hostContentEvent = result.logs[0];
			contentHostId = hostContentEvent.args.contentHostId;
		} catch (e) {
			canBecomeHost = false;
			hostContentEvent = null;
			contentHostId = null;
		}
		assert.equal(canBecomeHost, false, "Account can become host using with invalid metadataDatKey");

		vrs = createBecomeHostSignature(account2PrivateKey, baseChallenge);
		try {
			var result = await aocontenthost.becomeHost(
				purchaseReceiptId1,
				vrs.v,
				vrs.r,
				vrs.s,
				account2EncChallenge,
				account2ContentDatKey,
				account2ContentDatKey,
				{ from: account2 }
			);
			canBecomeHost = true;
			hostContentEvent = result.logs[0];
			contentHostId = hostContentEvent.args.contentHostId;
		} catch (e) {
			canBecomeHost = false;
			hostContentEvent = null;
			contentHostId = null;
		}
		assert.equal(canBecomeHost, false, "Non-owner of PurchaseReceipt can become a host");

		vrs = createBecomeHostSignature(account3PrivateKey, "somebasechallenge");
		try {
			var result = await aocontenthost.becomeHost(
				purchaseReceiptId1,
				vrs.v,
				vrs.r,
				vrs.s,
				account3EncChallenge,
				account3ContentDatKey,
				account3MetadataDatKey,
				{ from: account3 }
			);
			canBecomeHost = true;
			hostContentEvent = result.logs[0];
			contentHostId = hostContentEvent.args.contentHostId;
		} catch (e) {
			canBecomeHost = false;
			hostContentEvent = null;
			contentHostId = null;
		}
		assert.equal(canBecomeHost, false, "Buyer with wrong baseChallenge can become a host");
	});

	it("becomeHost() - should be able to become host", async function() {
		var vrs = createBecomeHostSignature(account3PrivateKey, baseChallenge);
		contentHostId4 = await becomeHost(
			account3,
			purchaseReceiptId1,
			vrs.v,
			vrs.r,
			vrs.s,
			account3EncChallenge,
			account3ContentDatKey,
			account3MetadataDatKey
		);
		contentHostId5 = await becomeHost(
			account3,
			purchaseReceiptId2,
			vrs.v,
			vrs.r,
			vrs.s,
			account3EncChallenge,
			account3ContentDatKey,
			account3MetadataDatKey
		);
		contentHostId6 = await becomeHost(
			account3,
			purchaseReceiptId3,
			vrs.v,
			vrs.r,
			vrs.s,
			account3EncChallenge,
			account3ContentDatKey,
			account3MetadataDatKey
		);
	});

	it("new node should be able to buy content and become host", async function() {
		// Account4 buy the contents
		var result = await aopurchasereceipt.buyContent(
			contentHostId4,
			5,
			0,
			"mega",
			account4LocalIdentity.publicKey,
			account4LocalIdentity.address,
			{ from: account4 }
		);
		var buyContentEvent = result.logs[0];
		purchaseReceiptId4 = buyContentEvent.args.purchaseReceiptId;

		result = await aopurchasereceipt.buyContent(
			contentHostId5,
			0,
			0,
			"",
			account4LocalIdentity.publicKey,
			account4LocalIdentity.address,
			{ from: account4 }
		);
		buyContentEvent = result.logs[0];
		purchaseReceiptId5 = buyContentEvent.args.purchaseReceiptId;

		result = await aopurchasereceipt.buyContent(
			contentHostId6,
			0,
			0,
			"",
			account4LocalIdentity.publicKey,
			account4LocalIdentity.address,
			{ from: account4 }
		);
		buyContentEvent = result.logs[0];
		purchaseReceiptId6 = buyContentEvent.args.purchaseReceiptId;

		var vrs = createBecomeHostSignature(account4PrivateKey, baseChallenge);
		contentHostId4 = await becomeHost(
			account4,
			purchaseReceiptId4,
			vrs.v,
			vrs.r,
			vrs.s,
			account4EncChallenge,
			account4ContentDatKey,
			account4MetadataDatKey
		);

		contentHostId5 = await becomeHost(
			account4,
			purchaseReceiptId5,
			vrs.v,
			vrs.r,
			vrs.s,
			account4EncChallenge,
			account4ContentDatKey,
			account4MetadataDatKey
		);

		contentHostId6 = await becomeHost(
			account4,
			purchaseReceiptId6,
			vrs.v,
			vrs.r,
			vrs.s,
			account4EncChallenge,
			account4ContentDatKey,
			account4MetadataDatKey
		);
	});
});
