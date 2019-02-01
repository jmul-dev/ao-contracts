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

contract("AOPurchaseReceipt", function(accounts) {
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
		purchaseReceiptId1,
		purchaseReceiptId2,
		purchaseReceiptId3,
		purchaseReceiptId4,
		purchaseReceiptId5;

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

		// AOContent/AOStakedContent/AOContentHost grant access to whitelistedAddress
		await aocontent.setWhitelist(whitelistedAddress, true, { from: theAO });
		await aostakedcontent.setWhitelist(whitelistedAddress, true, { from: theAO });
		await aocontenthost.setWhitelist(whitelistedAddress, true, { from: theAO });

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

	var buyContent = async function(
		account,
		contentHostId,
		networkIntegerAmount,
		networkFractionAmount,
		denomination,
		publicKey,
		publicAddress
	) {
		var accountBalanceBefore = new BigNumber(await aoion.balanceOf(account));
		var contentHost = await aocontenthost.getById(contentHostId);
		var stakedContentId = contentHost[0];
		var contentId = contentHost[1];
		var host = contentHost[2];
		var stakedContent = await aostakedcontent.getById(stakedContentId);
		var stakeOwner = stakedContent[1];

		var isAOContentUsageType = await aocontent.isAOContentUsageType(contentId);

		var contentHostPrice = new BigNumber(await aocontenthost.contentHostPrice(contentHostId));
		var contentHostPaidByAO = new BigNumber(await aocontenthost.contentHostPaidByAO(contentHostId));

		var canBuyContent, buyContentEvent, purchaseReceiptId;
		try {
			var result = await aopurchasereceipt.buyContent(
				contentHostId,
				networkIntegerAmount,
				networkFractionAmount,
				denomination,
				publicKey,
				publicAddress,
				{ from: account }
			);
			canBuyContent = true;
			buyContentEvent = result.logs[0];
			purchaseReceiptId = buyContentEvent.args.purchaseReceiptId;
		} catch (e) {
			canBuyContent = false;
			buyContentEvent = null;
			purchaseReceiptId = null;
		}
		assert.equal(canBuyContent, true, "Account can't buy content even though sent ions >= price");

		var isExist = await aopurchasereceipt.isExist(purchaseReceiptId);
		assert.equal(isExist, true, "isExist() returns incorrect value");

		var purchaseReceipt = await aopurchasereceipt.getById(purchaseReceiptId);
		assert.equal(purchaseReceipt[0], contentHostId, "PurchaseReceipt has incorrect contentHostId");
		assert.equal(purchaseReceipt[1], stakedContentId, "PurchaseReceipt has incorrect stakedContentId");
		assert.equal(purchaseReceipt[2], contentId, "PurchaseReceipt has incorrect contentId");
		assert.equal(purchaseReceipt[3], account, "PurchaseReceipt has incorrect buyer");
		assert.equal(purchaseReceipt[4].toNumber(), contentHostPrice.toNumber(), "PurchaseReceipt has incorrect price");
		assert.equal(
			purchaseReceipt[5].toNumber(),
			contentHostPrice.minus(contentHostPaidByAO).toNumber(),
			"PurchaseReceipt has incorrect amountPaidByBuyer"
		);
		assert.equal(purchaseReceipt[6].toNumber(), contentHostPaidByAO.toNumber(), "PurchaseReceipt has incorrect amountPaidByAO");
		assert.equal(purchaseReceipt[7], publicKey, "PurchaseReceipt has incorrect publicKey");
		assert.equal(purchaseReceipt[8].toLowerCase(), publicAddress.toLowerCase(), "PurchaseReceipt has incorrect publicAddress");

		var accountBalanceAfter = new BigNumber(await aoion.balanceOf(account));
		assert.equal(
			accountBalanceAfter.toString(),
			isAOContentUsageType ? accountBalanceBefore.minus(contentHostPrice).toString() : accountBalanceBefore.toString(),
			"Account has incorrect balance after buying content"
		);

		try {
			var result = await aopurchasereceipt.buyContent(
				contentHostId,
				networkIntegerAmount,
				networkFractionAmount,
				denomination,
				publicKey,
				publicAddress,
				{ from: account }
			);
			canBuyContent = true;
		} catch (e) {
			canBuyContent = false;
		}
		assert.equal(canBuyContent, false, "Account can buy content more than once");

		return purchaseReceiptId;
	};

	it("The AO - should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await aopurchasereceipt.transferOwnership(taoId1, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await aopurchasereceipt.transferOwnership(taoId1, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await aopurchasereceipt.theAO();
		assert.equal(newTheAO, taoId1, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await aopurchasereceipt.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await aopurchasereceipt.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await aopurchasereceipt.whitelist(whitelistedAddress);
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

		result = await aocontenthost.create(
			account1,
			stakedContentId1,
			account1EncChallenge,
			account1ContentDatKey,
			account1MetadataDatKey,
			{
				from: whitelistedAddress
			}
		);
		var hostContentEvent = result.logs[0];
		contentHostId1 = hostContentEvent.args.contentHostId;

		result = await aocontenthost.create(
			account2,
			stakedContentId2,
			account2EncChallenge,
			account2ContentDatKey,
			account2MetadataDatKey,
			{
				from: whitelistedAddress
			}
		);
		hostContentEvent = result.logs[0];
		contentHostId2 = hostContentEvent.args.contentHostId;

		result = await aocontenthost.create(
			account1,
			stakedContentId3,
			account1EncChallenge,
			account1ContentDatKey,
			account1MetadataDatKey,
			{
				from: whitelistedAddress
			}
		);
		hostContentEvent = result.logs[0];
		contentHostId3 = hostContentEvent.args.contentHostId;
	});

	it("The AO - should be able to set AOContent address", async function() {
		var canSetAddress;
		try {
			await aopurchasereceipt.setAOContentAddress(aocontent.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOContent address");

		try {
			await aopurchasereceipt.setAOContentAddress(aocontent.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOContent address");

		var aoContentAddress = await aopurchasereceipt.aoContentAddress();
		assert.equal(aoContentAddress, aocontent.address, "Contract has incorrect aoContentAddress");
	});

	it("The AO - should be able to set AOStakedContent address", async function() {
		var canSetAddress;
		try {
			await aopurchasereceipt.setAOStakedContentAddress(aostakedcontent.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOStakedContent address");

		try {
			await aopurchasereceipt.setAOStakedContentAddress(aostakedcontent.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOStakedContent address");

		var aoStakedContentAddress = await aopurchasereceipt.aoStakedContentAddress();
		assert.equal(aoStakedContentAddress, aostakedcontent.address, "Contract has incorrect aoStakedContentAddress");
	});

	it("The AO - should be able to set AOContentHost address", async function() {
		var canSetAddress;
		try {
			await aopurchasereceipt.setAOContentHostAddress(aocontenthost.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOContentHost address");

		try {
			await aopurchasereceipt.setAOContentHostAddress(aocontenthost.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOContentHost address");

		var aoContentHostAddress = await aopurchasereceipt.aoContentHostAddress();
		assert.equal(aoContentHostAddress, aocontenthost.address, "Contract has incorrect aoContentHostAddress");
	});

	it("The AO - should be able to set AOTreasury address", async function() {
		var canSetAddress;
		try {
			await aopurchasereceipt.setAOTreasuryAddress(aotreasury.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOTreasury address");

		try {
			await aopurchasereceipt.setAOTreasuryAddress(aotreasury.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOTreasury address");

		var aoTreasuryAddress = await aopurchasereceipt.aoTreasuryAddress();
		assert.equal(aoTreasuryAddress, aotreasury.address, "Contract has incorrect aoTreasuryAddress");
	});

	it("The AO - should be able to set AOEarning address", async function() {
		var canSetAddress;
		try {
			await aopurchasereceipt.setAOEarningAddress(aoearning.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOEarning address");

		try {
			await aopurchasereceipt.setAOEarningAddress(aoearning.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOEarning address");

		var aoEarningAddress = await aopurchasereceipt.aoEarningAddress();
		assert.equal(aoEarningAddress, aoearning.address, "Contract has incorrect aoEarningAddress");
	});

	it("The AO - should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await aopurchasereceipt.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await aopurchasereceipt.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await aopurchasereceipt.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("Whitelisted Address - should not be able to buy content with invalid params", async function() {
		var canBuyContent, buyContentEvent, purchaseReceiptId;
		try {
			var result = await aopurchasereceipt.buyContent(
				someaddress,
				5,
				0,
				"mega",
				account3LocalIdentity.publicKey,
				account3LocalIdentity.address,
				{ from: account3 }
			);
			canBuyContent = true;
			buyContentEvent = result.logs[0];
			purchaseReceiptId = buyContentEvent.args.purchaseReceiptId;
		} catch (e) {
			canBuyContent = false;
			buyContentEvent = null;
			purchaseReceiptId = null;
		}
		assert.equal(canBuyContent, false, "Account can buy non-exist hosted content");

		try {
			var result = await aopurchasereceipt.buyContent(
				contentId1,
				1,
				0,
				"mega",
				account3LocalIdentity.publicKey,
				account3LocalIdentity.address,
				{ from: account3 }
			);
			canBuyContent = true;
			buyContentEvent = result.logs[0];
			purchaseReceiptId = buyContentEvent.args.purchaseReceiptId;
		} catch (e) {
			canBuyContent = false;
			buyContentEvent = null;
			purchaseReceiptId = null;
		}
		assert.equal(canBuyContent, false, "Account can buy hosted content and send ions < price");

		try {
			var result = await aopurchasereceipt.buyContent(contentId1, 5, 0, "mega", "", account3LocalIdentity.address, {
				from: account3
			});
			canBuyContent = true;
			buyContentEvent = result.logs[0];
			purchaseReceiptId = buyContentEvent.args.purchaseReceiptId;
		} catch (e) {
			canBuyContent = false;
			buyContentEvent = null;
			purchaseReceiptId = null;
		}
		assert.equal(canBuyContent, false, "Account can buy hosted content with invalid publicKey");

		try {
			var result = await aopurchasereceipt.buyContent(contentId1, 5, 0, "mega", account3LocalIdentity.publicKey, "", {
				from: account3
			});
			canBuyContent = true;
			buyContentEvent = result.logs[0];
			purchaseReceiptId = buyContentEvent.args.purchaseReceiptId;
		} catch (e) {
			canBuyContent = false;
			buyContentEvent = null;
			purchaseReceiptId = null;
		}
		assert.equal(canBuyContent, false, "Account can buy hosted content with invalid publicAddress");

		try {
			var result = await aopurchasereceipt.buyContent(
				contentId1,
				5,
				0,
				"mega",
				account1LocalIdentity.publicKey,
				account1LocalIdentity.address,
				{ from: account1 }
			);
			canBuyContent = true;
			buyContentEvent = result.logs[0];
			purchaseReceiptId = buyContentEvent.args.purchaseReceiptId;
		} catch (e) {
			canBuyContent = false;
			buyContentEvent = null;
			purchaseReceiptId = null;
		}
		assert.equal(canBuyContent, false, "Account can buy his/her own hosted content");

		try {
			var result = await aopurchasereceipt.buyContent(
				contentId1,
				5,
				0,
				"mega",
				account4LocalIdentity.publicKey,
				account4LocalIdentity.address,
				{ from: account4 }
			);
			canBuyContent = true;
			buyContentEvent = result.logs[0];
			purchaseReceiptId = buyContentEvent.args.purchaseReceiptId;
		} catch (e) {
			canBuyContent = false;
			buyContentEvent = null;
			purchaseReceiptId = null;
		}
		assert.equal(canBuyContent, false, "Account without enough ions balance can buy hosted content");
	});

	it("buyContent() - should be able to buy content and store all of the earnings of stake owner (content creator)/host/The AO in escrow", async function() {
		purchaseReceiptId1 = await buyContent(
			account3,
			contentHostId1,
			5,
			100,
			"mega",
			account3LocalIdentity.publicKey,
			account3LocalIdentity.address
		);
		purchaseReceiptId2 = await buyContent(
			account3,
			contentHostId2,
			5,
			100,
			"mega",
			account3LocalIdentity.publicKey,
			account3LocalIdentity.address
		);
		purchaseReceiptId3 = await buyContent(
			account3,
			contentHostId3,
			0,
			0,
			"",
			account3LocalIdentity.publicKey,
			account3LocalIdentity.address
		);
		purchaseReceiptId4 = await buyContent(
			account4,
			contentHostId2,
			0,
			0,
			"",
			account4LocalIdentity.publicKey,
			account4LocalIdentity.address
		);
		purchaseReceiptId5 = await buyContent(
			account4,
			contentHostId3,
			0,
			0,
			"",
			account4LocalIdentity.publicKey,
			account4LocalIdentity.address
		);
	});

	it("senderIsBuyer() - should be able to check whether or not an address is the buyer of a Purchase Receipt", async function() {
		var canGetSenderIsBuyer, senderIsBuyer;
		try {
			senderIsBuyer = await aopurchasereceipt.senderIsBuyer(someAddress, account3);
			canGetSenderIsBuyer = true;
		} catch (e) {
			canGetSenderIsBuyer = false;
		}
		assert.equal(canGetSenderIsBuyer, false, "Contract can get senderIsBuyer() of non-exist purchaseReceiptId");

		senderIsBuyer = await aopurchasereceipt.senderIsBuyer(purchaseReceiptId1, account1);
		assert.equal(senderIsBuyer, false, "senderIsBuyer() returns incorrect value");

		senderIsBuyer = await aopurchasereceipt.senderIsBuyer(purchaseReceiptId1, account3);
		assert.equal(senderIsBuyer, true, "senderIsBuyer() returns incorrect value");
	});
});
