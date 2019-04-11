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
var Logos = artifacts.require("./Logos.sol");
var Pathos = artifacts.require("./Pathos.sol");
var Ethos = artifacts.require("./Ethos.sol");
var NamePublicKey = artifacts.require("./NamePublicKey.sol");

var EthCrypto = require("eth-crypto");
var BigNumber = require("bignumber.js");

BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: 1, EXPONENTIAL_AT: [-10, 40] }); // no rounding

contract("AOEarning", function(accounts) {
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
		logos,
		pathos,
		ethos,
		namepublickey,
		settingTAOId,
		inflationRate,
		theAOCut,
		theAOEthosEarnedRate,
		percentageDivisor,
		multiplierDivisor,
		contentUsageType_aoContent,
		contentUsageType_creativeCommons,
		contentUsageType_taoContent,
		nameId1,
		nameId2,
		nameId3,
		nameId4,
		nameId5,
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
		purchaseReceiptId6,
		purchaseReceiptId7,
		purchaseReceiptId8;

	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var account4 = accounts[4];
	var account5 = accounts[5];
	var someAddress = accounts[6];
	var whitelistedAddress = accounts[7];

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
	var account4ContentDatKey = "90bde24fb38d6e316ec48874c937f4582f3a494df1ecf38eofu2ufgooi2ho288";
	var account4MetadataDatKey = "90bde24fb38d6e316ec48874c937f4582f3a494df1ecf38eofu2ufgooi2ho288";

	// Retrieve private key from ganache
	var account1PrivateKey = "0xfa372b56eac0e71de587267f0a59989719b2325aeb4579912379641cf93ccaab";
	var account2PrivateKey = "0x6a35c58d0acad0ceca9c03d37aa2d2288d70afe0690f5e5f5e05aeab93b95dad";
	var account3PrivateKey = "0xf4bab2d2f0c5119cc6aad0735bbf0a017d229cbf430c0041af382b93e713a1c3";
	var account4PrivateKey = "0xfc164bb116857e2b7e5bafb6f515c61cc2cddae22a052c3988c8ff5de598ede0";
	var account5PrivateKey = "0xa9cf82c9c26517be94310dcfde34076cffc8d22a8f3c29b572ea92de8a96fd32";
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
	var account5LocalIdentity = {
		publicKey: EthCrypto.publicKeyByPrivateKey(account5PrivateKey),
		address: EthCrypto.publicKey.toAddress(EthCrypto.publicKeyByPrivateKey(account5PrivateKey))
	};

	var nameId1LocalWriterKey = EthCrypto.createIdentity();
	var nameId2LocalWriterKey = EthCrypto.createIdentity();
	var nameId3LocalWriterKey = EthCrypto.createIdentity();
	var nameId4LocalWriterKey = EthCrypto.createIdentity();
	var nameId5LocalWriterKey = EthCrypto.createIdentity();

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
		logos = await Logos.deployed();
		pathos = await Pathos.deployed();
		ethos = await Ethos.deployed();
		namepublickey = await NamePublicKey.deployed();

		settingTAOId = await aocontent.settingTAOId();

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "inflationRate");
		inflationRate = new BigNumber(settingValues[0]);

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "theAOCut");
		theAOCut = new BigNumber(settingValues[0]);

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "theAOEthosEarnedRate");
		theAOEthosEarnedRate = new BigNumber(settingValues[0]);

		percentageDivisor = new BigNumber(await library.PERCENTAGE_DIVISOR());
		multiplierDivisor = new BigNumber(await library.MULTIPLIER_DIVISOR());

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "contentUsageType_aoContent");
		contentUsageType_aoContent = settingValues[3];

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "contentUsageType_creativeCommons");
		contentUsageType_creativeCommons = settingValues[3];

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "contentUsageType_taoContent");
		contentUsageType_taoContent = settingValues[3];

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

		var result = await namefactory.createName(
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

		var result = await namefactory.createName(
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

		var result = await namefactory.createName(
			"foxtrot",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			"somecontentid",
			nameId4LocalWriterKey.address,
			{
				from: account4
			}
		);
		nameId4 = await namefactory.ethAddressToNameId(account4);

		var result = await namefactory.createName(
			"golf",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			"somecontentid",
			nameId5LocalWriterKey.address,
			{
				from: account5
			}
		);
		nameId5 = await namefactory.ethAddressToNameId(account5);

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
		await aoion.mint(account4, 10 ** 9, { from: theAO }); // 1,000,000,000 AO Ion
	});

	var buyContentCalculateEarning = async function(
		account,
		contentHostId,
		networkIntegerAmount,
		networkFractionAmount,
		denomination,
		publicKey,
		publicAddress
	) {
		var contentHost = await aocontenthost.getById(contentHostId);
		var stakedContentId = contentHost[0];
		var contentId = contentHost[1];
		var host = contentHost[2];
		var stakedContent = await aostakedcontent.getById(stakedContentId);
		var stakeOwner = stakedContent[1];
		var stakedNetworkAmount = new BigNumber(stakedContent[2]);
		var stakedPrimordialAmount = new BigNumber(stakedContent[3]);
		var stakedPrimordialWeightedMultiplier = new BigNumber(stakedContent[4]);
		var profitPercentage = new BigNumber(stakedContent[5]);

		var isAOContentUsageType = await aocontent.isAOContentUsageType(contentId);

		var contentHostPrice = new BigNumber(await aocontenthost.contentHostPrice(contentHostId));
		var contentHostPaidByAO = new BigNumber(await aocontenthost.contentHostPaidByAO(contentHostId));

		var stakeOwnerDefaultKey = await namepublickey.getDefaultKey(stakeOwner);
		var hostDefaultKey = await namepublickey.getDefaultKey(host);

		var stakeOwnerBalanceBefore = new BigNumber(await aoion.balanceOf(stakeOwnerDefaultKey));
		var hostBalanceBefore = new BigNumber(await aoion.balanceOf(hostDefaultKey));
		var theAOBalanceBefore = new BigNumber(await aoion.balanceOf(theAO));

		var stakeOwnerEscrowedBalanceBefore = new BigNumber(await aoion.escrowedBalance(stakeOwnerDefaultKey));
		var hostEscrowedBalanceBefore = new BigNumber(await aoion.escrowedBalance(hostDefaultKey));
		var theAOEscrowedBalanceBefore = new BigNumber(await aoion.escrowedBalance(theAO));

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

		var stakeOwnerBalanceAfter = new BigNumber(await aoion.balanceOf(stakeOwnerDefaultKey));
		var hostBalanceAfter = new BigNumber(await aoion.balanceOf(hostDefaultKey));
		var theAOBalanceAfter = new BigNumber(await aoion.balanceOf(theAO));

		assert.equal(
			stakeOwnerBalanceAfter.toString(),
			stakeOwnerBalanceBefore.toString(),
			"Stake owner has incorrect balance after buying content"
		);
		assert.equal(hostBalanceAfter.toString(), hostBalanceBefore.toString(), "Host has incorrect balance after buying content");
		assert.equal(theAOBalanceAfter.toString(), theAOBalanceBefore.toString(), "The AO has incorrect balance after buying content");

		// Calculate stake owner/host payment earning
		var stakeOwnerPaymentEarning = isAOContentUsageType
			? contentHostPrice.times(profitPercentage).div(percentageDivisor)
			: new BigNumber(0);
		var hostPaymentEarning = contentHostPrice.minus(stakeOwnerPaymentEarning);
		var pathosAmount = contentHostPrice
			.times(percentageDivisor.minus(profitPercentage))
			.times(inflationRate)
			.div(percentageDivisor)
			.div(percentageDivisor);
		var ethosAmount = contentHostPrice
			.times(profitPercentage)
			.times(inflationRate)
			.div(percentageDivisor)
			.div(percentageDivisor);
		var theAOPaymentEarning = pathosAmount.plus(ethosAmount.times(theAOEthosEarnedRate).div(percentageDivisor));

		// Calculate inflation bonus
		var networkBonus = stakedNetworkAmount.times(inflationRate).div(percentageDivisor);

		var primordialBonus = stakedPrimordialAmount
			.times(stakedPrimordialWeightedMultiplier)
			.div(multiplierDivisor)
			.times(inflationRate)
			.div(percentageDivisor);
		var inflationBonus = networkBonus.plus(primordialBonus);

		// Calculate stake owner/host/The AO inflation bonus
		var stakeOwnerInflationBonus = isAOContentUsageType
			? profitPercentage.times(inflationBonus).div(percentageDivisor)
			: new BigNumber(0);
		var hostInflationBonus = inflationBonus.minus(stakeOwnerInflationBonus);
		var theAOInflationBonus = theAOCut.times(inflationBonus).div(percentageDivisor);

		// Verify ownerPurchaseReceiptStakeEarning
		var ownerPurchaseReceiptStakeEarning = await aoearning.ownerPurchaseReceiptStakeEarnings(stakeOwner, purchaseReceiptId);
		assert.equal(
			ownerPurchaseReceiptStakeEarning[0],
			purchaseReceiptId,
			"ownerPurchaseReceiptStakeEarning has incorrect PurchaseReceipt ID"
		);
		assert.equal(
			ownerPurchaseReceiptStakeEarning[1].toString(),
			stakeOwnerPaymentEarning.toString(),
			"ownerPurchaseReceiptStakeEarning has incorrect paymentEarning amount"
		);
		assert.equal(
			ownerPurchaseReceiptStakeEarning[2].toString(),
			stakeOwnerInflationBonus.toString(),
			"Stake earning has incorrect inflationBonus amount"
		);
		assert.equal(
			ownerPurchaseReceiptStakeEarning[3].toString(),
			pathosAmount.toString(),
			"ownerPurchaseReceiptStakeEarning has incorrect pathos amount"
		);
		assert.equal(ownerPurchaseReceiptStakeEarning[4].toNumber(), 0, "ownerPurchaseReceiptStakeEarning has incorrect ethos amount");

		// Verify ownerPurchaseReceiptHostEarning
		var ownerPurchaseReceiptHostEarning = await aoearning.ownerPurchaseReceiptHostEarnings(host, purchaseReceiptId);
		assert.equal(
			ownerPurchaseReceiptHostEarning[0],
			purchaseReceiptId,
			"ownerPurchaseReceiptHostEarning has incorrect PurchaseReceipt ID"
		);
		assert.equal(
			ownerPurchaseReceiptHostEarning[1].toString(),
			hostPaymentEarning.toString(),
			"ownerPurchaseReceiptHostEarning has incorrect paymentEarning amount"
		);
		assert.equal(
			ownerPurchaseReceiptHostEarning[2].toString(),
			hostInflationBonus.toString(),
			"ownerPurchaseReceiptHostEarning has incorrect inflationBonus amount"
		);
		assert.equal(ownerPurchaseReceiptHostEarning[3].toNumber(), 0, "ownerPurchaseReceiptHostEarning has incorrect pathos amount");

		assert.equal(
			ownerPurchaseReceiptHostEarning[4].toString(),
			ethosAmount.toString(),
			"ownerPurchaseReceiptHostEarning has incorrect ethos amount"
		);

		// Verify theAOPurchaseReceiptEarning
		var theAOPurchaseReceiptEarning = await aoearning.theAOPurchaseReceiptEarnings(purchaseReceiptId);
		assert.equal(theAOPurchaseReceiptEarning[0], purchaseReceiptId, "theAOPurchaseReceiptEarning has incorrect PurchaseReceipt ID");
		assert.equal(
			theAOPurchaseReceiptEarning[1].toString(),
			theAOPaymentEarning.toString(),
			"theAOPurchaseReceiptEarning has incorrect paymentEarning amount"
		);

		assert.equal(
			theAOPurchaseReceiptEarning[2].toString(),
			theAOInflationBonus.toString(),
			"theAOPurchaseReceiptEarning has incorrect inflationBonus amount"
		);
		assert.equal(theAOPurchaseReceiptEarning[3].toNumber(), 0, "theAOPurchaseReceiptEarning has incorrect pathos amount");
		assert.equal(theAOPurchaseReceiptEarning[4].toNumber(), 0, "theAOPurchaseReceiptEarning has incorrect ethos amount");

		// Verify escrowed balance
		var stakeOwnerEscrowedBalanceAfter = await aoion.escrowedBalance(stakeOwnerDefaultKey);
		var hostEscrowedBalanceAfter = await aoion.escrowedBalance(hostDefaultKey);
		var theAOEscrowedBalanceAfter = await aoion.escrowedBalance(theAO);

		// since the stake owner and the host are the same
		if (stakeOwner == host) {
			assert.equal(
				stakeOwnerEscrowedBalanceAfter.toString(),
				stakeOwnerEscrowedBalanceBefore
					.plus(contentHostPrice)
					.plus(inflationBonus)
					.toString(),
				"Stake owner has incorrect escrowed balance"
			);
			assert.equal(
				hostEscrowedBalanceAfter.toString(),
				hostEscrowedBalanceBefore
					.plus(contentHostPrice)
					.plus(inflationBonus)
					.toString(),
				"Host has incorrect escrowed balance"
			);
		} else {
			assert.equal(
				stakeOwnerEscrowedBalanceAfter.toString(),
				stakeOwnerEscrowedBalanceBefore
					.plus(stakeOwnerPaymentEarning)
					.plus(stakeOwnerInflationBonus)
					.toString(),
				"Stake owner has incorrect escrowed balance"
			);
			assert.equal(
				hostEscrowedBalanceAfter.toString(),
				hostEscrowedBalanceBefore
					.plus(hostPaymentEarning)
					.plus(hostInflationBonus)
					.toString(),
				"Host has incorrect escrowed balance"
			);
		}

		assert.equal(
			theAOEscrowedBalanceAfter.toString(),
			theAOEscrowedBalanceBefore
				.plus(theAOPaymentEarning)
				.plus(theAOInflationBonus)
				.toString(),
			"The AO has incorrect escrowed balance"
		);
		return purchaseReceiptId;
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

	var becomeHostReleaseEarning = async function(
		account,
		purchaseReceiptId,
		baseChallengeV,
		baseChallengeR,
		baseChallengeS,
		encChallenge,
		contentDatKey,
		metadataDatKey
	) {
		var purchaseReceipt = await aopurchasereceipt.getById(purchaseReceiptId);
		var contentHostId = purchaseReceipt[0];
		var stakedContentId = purchaseReceipt[1];
		var contentId = purchaseReceipt[2];
		var price = purchaseReceipt[4];

		var contentHost = await aocontenthost.getById(contentHostId);
		var host = contentHost[2];

		var stakedContent = await aostakedcontent.getById(stakedContentId);
		var stakeOwner = stakedContent[1];

		var content = await aocontent.getById(contentId);
		var fileSize = content[1];

		var isAOContentUsageType = await aocontent.isAOContentUsageType(contentId);

		var stakeOwnerDefaultKey = await namepublickey.getDefaultKey(stakeOwner);
		var hostDefaultKey = await namepublickey.getDefaultKey(host);

		var stakeOwnerPathosBalanceBefore = await pathos.balanceOf(stakeOwner);
		var hostEthosBalanceBefore = await ethos.balanceOf(host);

		var stakeOwnerBalanceBefore = await aoion.balanceOf(stakeOwnerDefaultKey);
		var hostBalanceBefore = await aoion.balanceOf(hostDefaultKey);
		var theAOBalanceBefore = await aoion.balanceOf(theAO);

		var stakeOwnerEscrowedBalanceBefore = await aoion.escrowedBalance(stakeOwnerDefaultKey);
		var hostEscrowedBalanceBefore = await aoion.escrowedBalance(hostDefaultKey);
		var theAOEscrowedBalanceBefore = await aoion.escrowedBalance(theAO);

		var ownerPurchaseReceiptStakeEarningBefore = await aoearning.ownerPurchaseReceiptStakeEarnings(stakeOwner, purchaseReceiptId);
		var ownerPurchaseReceiptHostEarningBefore = await aoearning.ownerPurchaseReceiptHostEarnings(host, purchaseReceiptId);
		var theAOPurchaseReceiptEarningBefore = await aoearning.theAOPurchaseReceiptEarnings(purchaseReceiptId);

		var totalStakedContentEarningBefore = await aoearning.totalStakedContentEarning();
		var totalContentHostEarningBefore = await aoearning.totalContentHostEarning();
		var totalTheAOEarningBefore = await aoearning.totalTheAOEarning();

		var stakeOwner_ownerStakedContentEarningBefore = await aoearning.ownerStakedContentEarning(stakeOwner);
		var host_ownerContentHostEarningBefore = await aoearning.ownerContentHostEarning(host);

		var stakeOwner_ownerNetworkPriceEarningBefore = await aoearning.ownerNetworkPriceEarning(stakeOwner);
		var stakeOwner_ownerContentPriceEarningBefore = await aoearning.ownerContentPriceEarning(stakeOwner);
		var stakeOwner_ownerInflationBonusAccruedBefore = await aoearning.ownerInflationBonusAccrued(stakeOwner);

		var host_ownerNetworkPriceEarningBefore = await aoearning.ownerNetworkPriceEarning(host);
		var host_ownerContentPriceEarningBefore = await aoearning.ownerContentPriceEarning(host);
		var host_ownerInflationBonusAccruedBefore = await aoearning.ownerInflationBonusAccrued(host);

		var stakedContentStakeEarningBefore = await aoearning.stakedContentStakeEarning(stakedContentId);
		var stakedContentHostEarningBefore = await aoearning.stakedContentHostEarning(stakedContentId);
		var stakedContentTheAOEarningBefore = await aoearning.stakedContentTheAOEarning(stakedContentId);
		var contentHostEarningBefore = await aoearning.contentHostEarning(contentHostId);

		var canBecomeHost, hostContentEvent, newContentHostId;
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
			newContentHostId = hostContentEvent.args.contentHostId;
		} catch (e) {
			canBecomeHost = false;
			hostContentEvent = null;
			newContentHostId = null;
		}
		assert.equal(canBecomeHost, true, "Account can't host content after buying");

		var stakeOwnerPathosBalanceAfter = await pathos.balanceOf(stakeOwner);
		var hostEthosBalanceAfter = await ethos.balanceOf(host);

		assert.equal(
			stakeOwnerPathosBalanceAfter.toString(),
			stakeOwnerPathosBalanceBefore.plus(ownerPurchaseReceiptStakeEarningBefore[3]).toString(),
			"Stake owner has incorrect pathos balance"
		);
		assert.equal(
			hostEthosBalanceAfter.toString(),
			hostEthosBalanceBefore.plus(ownerPurchaseReceiptHostEarningBefore[4]).toString(),
			"Host has incorrect ethos balance"
		);

		var stakeOwnerBalanceAfter = await aoion.balanceOf(stakeOwnerDefaultKey);
		var hostBalanceAfter = await aoion.balanceOf(hostDefaultKey);
		var theAOBalanceAfter = await aoion.balanceOf(theAO);

		// Verify the balance
		if (isAOContentUsageType) {
			// Since stake owner and host are the same
			if (stakeOwner == host) {
				assert.equal(
					stakeOwnerBalanceAfter.toString(),
					stakeOwnerBalanceBefore
						.plus(ownerPurchaseReceiptStakeEarningBefore[1])
						.plus(ownerPurchaseReceiptStakeEarningBefore[2])
						.plus(ownerPurchaseReceiptHostEarningBefore[1])
						.plus(ownerPurchaseReceiptHostEarningBefore[2])
						.toString(),
					"Stake owner has incorrect balance after request node become host"
				);
				assert.equal(
					hostBalanceAfter.toString(),
					hostBalanceBefore
						.plus(ownerPurchaseReceiptStakeEarningBefore[1])
						.plus(ownerPurchaseReceiptStakeEarningBefore[2])
						.plus(ownerPurchaseReceiptHostEarningBefore[1])
						.plus(ownerPurchaseReceiptHostEarningBefore[2])
						.toString(),
					"Host has incorrect balance after request node become host"
				);
			} else {
				assert.equal(
					stakeOwnerBalanceAfter.toString(),
					stakeOwnerBalanceBefore
						.plus(ownerPurchaseReceiptStakeEarningBefore[1])
						.plus(ownerPurchaseReceiptStakeEarningBefore[2])
						.toString(),
					"Stake owner has incorrect balance after request node become host"
				);
				assert.equal(
					hostBalanceAfter.toString(),
					hostBalanceBefore
						.plus(ownerPurchaseReceiptHostEarningBefore[1])
						.plus(ownerPurchaseReceiptHostEarningBefore[2])
						.toString(),
					"Host has incorrect balance after request node become host"
				);
			}
		} else {
			// Since stake owner and host are the same
			if (stakeOwner == host) {
				assert.equal(
					stakeOwnerBalanceAfter.toString(),
					stakeOwnerBalanceBefore
						.plus(price)
						.plus(ownerPurchaseReceiptHostEarningBefore[2])
						.toString(),
					"Stake owner has incorrect balance after request node become host"
				);
				assert.equal(
					hostBalanceAfter.toString(),
					hostBalanceBefore
						.plus(price)
						.plus(ownerPurchaseReceiptHostEarningBefore[2])
						.toString(),
					"Host has incorrect balance after request node become host"
				);
			} else {
				assert.equal(
					stakeOwnerBalanceAfter.toString(),
					stakeOwnerBalanceBefore.toString(),
					"Stake owner has incorrect balance after request node become host"
				);
				assert.equal(
					hostBalanceAfter.toString(),
					hostBalanceBefore
						.plus(price)
						.plus(ownerPurchaseReceiptHostEarningBefore[2])
						.toString(),
					"Host has incorrect balance after request node become host"
				);
			}
		}
		assert.equal(
			theAOBalanceAfter.toString(),
			theAOBalanceBefore
				.plus(theAOPurchaseReceiptEarningBefore[1])
				.plus(theAOPurchaseReceiptEarningBefore[2])
				.toString(),
			"The AO has incorrect balance after request node become host"
		);

		var stakeOwnerEscrowedBalanceAfter = await aoion.escrowedBalance(stakeOwnerDefaultKey);
		var hostEscrowedBalanceAfter = await aoion.escrowedBalance(hostDefaultKey);
		var theAOEscrowedBalanceAfter = await aoion.escrowedBalance(theAO);

		// Verify the escrowed balance
		// since stake owner and host are the same
		if (stakeOwner == host) {
			assert.equal(
				stakeOwnerEscrowedBalanceAfter.toString(),
				stakeOwnerEscrowedBalanceBefore
					.minus(ownerPurchaseReceiptStakeEarningBefore[1])
					.minus(ownerPurchaseReceiptStakeEarningBefore[2])
					.minus(ownerPurchaseReceiptHostEarningBefore[1])
					.minus(ownerPurchaseReceiptHostEarningBefore[2])
					.toString(),
				"Stake owner has incorrect escrowed balance after request node become host"
			);
			assert.equal(
				hostEscrowedBalanceAfter.toString(),
				hostEscrowedBalanceBefore
					.minus(ownerPurchaseReceiptStakeEarningBefore[1])
					.minus(ownerPurchaseReceiptStakeEarningBefore[2])
					.minus(ownerPurchaseReceiptHostEarningBefore[1])
					.minus(ownerPurchaseReceiptHostEarningBefore[2])
					.toString(),
				"Host has incorrect escrowed balance after request node become host"
			);
		} else {
			assert.equal(
				stakeOwnerEscrowedBalanceAfter.toString(),
				stakeOwnerEscrowedBalanceBefore
					.minus(ownerPurchaseReceiptStakeEarningBefore[1])
					.minus(ownerPurchaseReceiptStakeEarningBefore[2])
					.toString(),
				"Stake owner has incorrect escrowed balance after request node become host"
			);
			assert.equal(
				hostEscrowedBalanceAfter.toString(),
				hostEscrowedBalanceBefore
					.minus(ownerPurchaseReceiptHostEarningBefore[1])
					.minus(ownerPurchaseReceiptHostEarningBefore[2])
					.toString(),
				"Host has incorrect escrowed balance after request node become host"
			);
		}
		assert.equal(
			theAOEscrowedBalanceAfter.toString(),
			theAOEscrowedBalanceBefore
				.minus(theAOPurchaseReceiptEarningBefore[1])
				.minus(theAOPurchaseReceiptEarningBefore[2])
				.toString(),
			"The AO has incorrect escrowed balance after request node become host"
		);

		var ownerPurchaseReceiptStakeEarningAfter = await aoearning.ownerPurchaseReceiptStakeEarnings(stakeOwner, purchaseReceiptId);
		// Verify the earning
		assert.equal(
			ownerPurchaseReceiptStakeEarningAfter[0],
			purchaseReceiptId,
			"ownerPurchaseReceiptStakeEarning has incorrect PurchaseReceipt ID"
		);
		assert.equal(
			ownerPurchaseReceiptStakeEarningAfter[1].toString(),
			0,
			"ownerPurchaseReceiptStakeEarning has incorrect paymentEarning after request node become host"
		);
		assert.equal(
			ownerPurchaseReceiptStakeEarningAfter[2].toString(),
			0,
			"ownerPurchaseReceiptStakeEarning has incorrect inflationBonus after request node become host"
		);
		assert.equal(
			ownerPurchaseReceiptStakeEarningAfter[3].toString(),
			0,
			"ownerPurchaseReceiptStakeEarning has incorrect pathosAmount after request node become host"
		);
		assert.equal(
			ownerPurchaseReceiptStakeEarningAfter[4].toString(),
			0,
			"ownerPurchaseReceiptStakeEarning has incorrect ethosAmount after request node become host"
		);

		var ownerPurchaseReceiptHostEarningAfter = await aoearning.ownerPurchaseReceiptHostEarnings(host, purchaseReceiptId);
		assert.equal(
			ownerPurchaseReceiptHostEarningAfter[0],
			purchaseReceiptId,
			"ownerPurchaseReceiptHostEarning has incorrect PurchaseReceipt ID"
		);
		assert.equal(
			ownerPurchaseReceiptHostEarningAfter[1].toString(),
			0,
			"ownerPurchaseReceiptHostEarning has incorrect paymentEarning after request node become host"
		);
		assert.equal(
			ownerPurchaseReceiptHostEarningAfter[2].toString(),
			0,
			"ownerPurchaseReceiptHostEarning has incorrect inflationBonus after request node become host"
		);
		assert.equal(
			ownerPurchaseReceiptHostEarningAfter[3].toString(),
			0,
			"ownerPurchaseReceiptHostEarning has incorrect pathosAmount after request node become host"
		);
		assert.equal(
			ownerPurchaseReceiptHostEarningAfter[4].toString(),
			0,
			"ownerPurchaseReceiptHostEarning has incorrect ethosAmount after request node become host"
		);

		var theAOPurchaseReceiptEarningAfter = await aoearning.theAOPurchaseReceiptEarnings(purchaseReceiptId);
		assert.equal(
			theAOPurchaseReceiptEarningAfter[0],
			purchaseReceiptId,
			"theAOPurchaseReceiptEarning has incorrect PurchaseReceipt ID"
		);
		assert.equal(
			theAOPurchaseReceiptEarningAfter[1].toString(),
			0,
			"theAOPurchaseReceiptEarning has incorrect paymentEarning after request node become host"
		);
		assert.equal(
			theAOPurchaseReceiptEarningAfter[2].toString(),
			0,
			"theAOPurchaseReceiptEarning has incorrect inflationBonus after request node become host"
		);
		assert.equal(
			theAOPurchaseReceiptEarningAfter[3].toString(),
			0,
			"theAOPurchaseReceiptEarning has incorrect pathosAmount after request node become host"
		);
		assert.equal(
			theAOPurchaseReceiptEarningAfter[4].toString(),
			0,
			"theAOPurchaseReceiptEarning has incorrect ethosAmount after request node become host"
		);

		var totalStakedContentEarningAfter = await aoearning.totalStakedContentEarning();
		var totalContentHostEarningAfter = await aoearning.totalContentHostEarning();
		var totalTheAOEarningAfter = await aoearning.totalTheAOEarning();

		// Verify global variables earnings
		assert.equal(
			totalStakedContentEarningAfter.toString(),
			totalStakedContentEarningBefore
				.plus(ownerPurchaseReceiptStakeEarningBefore[1])
				.plus(ownerPurchaseReceiptStakeEarningBefore[2])
				.toString(),
			"Contract has incorrect totalStakedContentEarning"
		);
		assert.equal(
			totalContentHostEarningAfter.toString(),
			totalContentHostEarningBefore
				.plus(ownerPurchaseReceiptHostEarningBefore[1])
				.plus(ownerPurchaseReceiptHostEarningBefore[2])
				.toString(),
			"Contract has incorrect totalContentHostEarning"
		);
		assert.equal(
			totalTheAOEarningAfter.toString(),
			totalTheAOEarningBefore
				.plus(theAOPurchaseReceiptEarningBefore[1])
				.plus(theAOPurchaseReceiptEarningBefore[2])
				.toString(),
			"Contract has incorrect totalTheAOEarning"
		);

		var stakeOwner_ownerStakedContentEarningAfter = await aoearning.ownerStakedContentEarning(stakeOwner);
		assert.equal(
			stakeOwner_ownerStakedContentEarningAfter.toString(),
			stakeOwner_ownerStakedContentEarningBefore
				.plus(ownerPurchaseReceiptStakeEarningBefore[1])
				.plus(ownerPurchaseReceiptStakeEarningBefore[2])
				.toString(),
			"Contract has incorrect ownerStakedContentEarning"
		);

		var host_ownerContentHostEarningAfter = await aoearning.ownerContentHostEarning(host);
		assert.equal(
			host_ownerContentHostEarningAfter.toString(),
			host_ownerContentHostEarningBefore
				.plus(ownerPurchaseReceiptHostEarningBefore[1])
				.plus(ownerPurchaseReceiptHostEarningBefore[2])
				.toString(),
			"Contract has incorrect ownerContentHostEarning for host"
		);

		var stakeOwner_ownerNetworkPriceEarningAfter = await aoearning.ownerNetworkPriceEarning(stakeOwner);
		var stakeOwner_ownerContentPriceEarningAfter = await aoearning.ownerContentPriceEarning(stakeOwner);
		var stakeOwner_ownerInflationBonusAccruedAfter = await aoearning.ownerInflationBonusAccrued(stakeOwner);

		var host_ownerNetworkPriceEarningAfter = await aoearning.ownerNetworkPriceEarning(host);
		var host_ownerContentPriceEarningAfter = await aoearning.ownerContentPriceEarning(host);
		var host_ownerInflationBonusAccruedAfter = await aoearning.ownerInflationBonusAccrued(host);

		if (price.gt(fileSize)) {
			assert.equal(
				stakeOwner_ownerNetworkPriceEarningAfter.toString(),
				stakeOwner_ownerNetworkPriceEarningBefore.toString(),
				"Contract has incorrect ownerNetworkPriceEarning"
			);

			assert.equal(
				host_ownerNetworkPriceEarningAfter.toString(),
				host_ownerNetworkPriceEarningBefore.toString(),
				"Contract has incorrect ownerNetworkPriceEarning"
			);

			// Since stakeOwner/host are the same
			if (stakeOwner == host) {
				assert.equal(
					stakeOwner_ownerContentPriceEarningAfter.toString(),
					stakeOwner_ownerContentPriceEarningBefore
						.plus(ownerPurchaseReceiptStakeEarningBefore[1])
						.plus(ownerPurchaseReceiptStakeEarningBefore[2])
						.plus(ownerPurchaseReceiptHostEarningBefore[1])
						.plus(ownerPurchaseReceiptHostEarningBefore[2])
						.toString(),
					"Contract has incorrect ownerContentPriceEarning for stake owner"
				);

				assert.equal(
					host_ownerContentPriceEarningAfter.toString(),
					host_ownerContentPriceEarningBefore
						.plus(ownerPurchaseReceiptStakeEarningBefore[1])
						.plus(ownerPurchaseReceiptStakeEarningBefore[2])
						.plus(ownerPurchaseReceiptHostEarningBefore[1])
						.plus(ownerPurchaseReceiptHostEarningBefore[2])
						.toString(),
					"Contract has incorrect ownerContentPriceEarning for host"
				);
			} else {
				assert.equal(
					stakeOwner_ownerContentPriceEarningAfter.toString(),
					stakeOwner_ownerContentPriceEarningBefore
						.plus(ownerPurchaseReceiptStakeEarningBefore[1])
						.plus(ownerPurchaseReceiptStakeEarningBefore[2])
						.toString(),
					"Contract has incorrect ownerContentPriceEarning for stake owner"
				);

				assert.equal(
					host_ownerContentPriceEarningAfter.toString(),
					host_ownerContentPriceEarningBefore
						.plus(ownerPurchaseReceiptHostEarningBefore[1])
						.plus(ownerPurchaseReceiptHostEarningBefore[2])
						.toString(),
					"Contract has incorrect ownerContentPriceEarning for host"
				);
			}
		} else {
			// Since stakeOwner/host are the same
			if (stakeOwner == host) {
				assert.equal(
					stakeOwner_ownerNetworkPriceEarningAfter.toString(),
					stakeOwner_ownerNetworkPriceEarningBefore
						.plus(ownerPurchaseReceiptStakeEarningBefore[1])
						.plus(ownerPurchaseReceiptStakeEarningBefore[2])
						.plus(ownerPurchaseReceiptHostEarningBefore[1])
						.plus(ownerPurchaseReceiptHostEarningBefore[2])
						.toString(),
					"Contract has incorrect ownerNetworkPriceEarning"
				);

				assert.equal(
					host_ownerNetworkPriceEarningAfter.toString(),
					host_ownerNetworkPriceEarningBefore
						.plus(ownerPurchaseReceiptStakeEarningBefore[1])
						.plus(ownerPurchaseReceiptStakeEarningBefore[2])
						.plus(ownerPurchaseReceiptHostEarningBefore[1])
						.plus(ownerPurchaseReceiptHostEarningBefore[2])
						.toString(),
					"Contract has incorrect ownerNetworkPriceEarning"
				);
			} else {
				assert.equal(
					stakeOwner_ownerNetworkPriceEarningAfter.toString(),
					stakeOwner_ownerNetworkPriceEarningBefore
						.plus(ownerPurchaseReceiptStakeEarningBefore[1])
						.plus(ownerPurchaseReceiptStakeEarningBefore[2])
						.toString(),
					"Contract has incorrect ownerNetworkPriceEarning"
				);

				assert.equal(
					host_ownerNetworkPriceEarningAfter.toString(),
					host_ownerNetworkPriceEarningBefore
						.plus(ownerPurchaseReceiptHostEarningBefore[1])
						.plus(ownerPurchaseReceiptHostEarningBefore[2])
						.toString(),
					"Contract has incorrect ownerNetworkPriceEarning"
				);
			}

			assert.equal(
				stakeOwner_ownerContentPriceEarningAfter.toString(),
				stakeOwner_ownerContentPriceEarningBefore.toString(),
				"Contract has incorrect ownerContentPriceEarning for stake owner"
			);

			assert.equal(
				host_ownerContentPriceEarningAfter.toString(),
				host_ownerContentPriceEarningBefore.toString(),
				"Contract has incorrect ownerContentPriceEarning for host"
			);
		}
		if (stakeOwner == host) {
			assert.equal(
				stakeOwner_ownerInflationBonusAccruedAfter.toString(),
				stakeOwner_ownerInflationBonusAccruedBefore
					.plus(ownerPurchaseReceiptStakeEarningBefore[2])
					.plus(ownerPurchaseReceiptHostEarningBefore[2])
					.toString(),
				"Contract has incorrect ownerInflationBonusAccrued for stake owner"
			);
			assert.equal(
				host_ownerInflationBonusAccruedAfter.toString(),
				host_ownerInflationBonusAccruedBefore
					.plus(ownerPurchaseReceiptStakeEarningBefore[2])
					.plus(ownerPurchaseReceiptHostEarningBefore[2])
					.toString(),
				"Contract has incorrect ownerInflationBonusAccrued for host"
			);
		} else {
			assert.equal(
				stakeOwner_ownerInflationBonusAccruedAfter.toString(),
				stakeOwner_ownerInflationBonusAccruedBefore.plus(ownerPurchaseReceiptStakeEarningBefore[2]).toString(),
				"Contract has incorrect ownerInflationBonusAccrued for stake owner"
			);
			assert.equal(
				host_ownerInflationBonusAccruedAfter.toString(),
				host_ownerInflationBonusAccruedBefore.plus(ownerPurchaseReceiptHostEarningBefore[2]).toString(),
				"Contract has incorrect ownerInflationBonusAccrued for host"
			);
		}

		var stakedContentStakeEarningAfter = await aoearning.stakedContentStakeEarning(stakedContentId);
		var stakedContentHostEarningAfter = await aoearning.stakedContentHostEarning(stakedContentId);
		var stakedContentTheAOEarningAfter = await aoearning.stakedContentTheAOEarning(stakedContentId);
		var contentHostEarningAfter = await aoearning.contentHostEarning(contentHostId);

		assert.equal(
			stakedContentStakeEarningAfter.toString(),
			stakedContentStakeEarningBefore
				.plus(ownerPurchaseReceiptStakeEarningBefore[1])
				.plus(ownerPurchaseReceiptStakeEarningBefore[2])
				.toString(),
			"Staked content has incorrect stakedContentStakeEarning value"
		);

		assert.equal(
			stakedContentHostEarningAfter.toString(),
			stakedContentHostEarningBefore
				.plus(ownerPurchaseReceiptHostEarningBefore[1])
				.plus(ownerPurchaseReceiptHostEarningBefore[2])
				.toString(),
			"Staked content has incorrect stakedContentHostEarning value"
		);

		assert.equal(
			stakedContentTheAOEarningAfter.toString(),
			stakedContentTheAOEarningBefore
				.plus(theAOPurchaseReceiptEarningBefore[1])
				.plus(theAOPurchaseReceiptEarningBefore[2])
				.toString(),
			"Staked content has incorrect stakedContentTheAOEarning value"
		);
		assert.equal(
			contentHostEarningAfter.toString(),
			contentHostEarningBefore
				.plus(ownerPurchaseReceiptHostEarningBefore[1])
				.plus(ownerPurchaseReceiptHostEarningBefore[2])
				.toString(),
			"Content Host ID has incorrect total earning value"
		);

		return newContentHostId;
	};

	var getTotalStakedContentEarning = async function(stakedContentId) {
		var getTotalStakedContentEarning = await aoearning.getTotalStakedContentEarning(stakedContentId);
		var stakedContentStakeEarning = await aoearning.stakedContentStakeEarning(stakedContentId);
		var stakedContentHostEarning = await aoearning.stakedContentHostEarning(stakedContentId);
		var stakedContentTheAOEarning = await aoearning.stakedContentTheAOEarning(stakedContentId);

		assert.equal(
			getTotalStakedContentEarning[0].toNumber(),
			stakedContentStakeEarning.toNumber(),
			"getTotalStakedContentEarning() returns incorrect value for total earning from staking the content"
		);
		assert.equal(
			getTotalStakedContentEarning[1].toNumber(),
			stakedContentHostEarning.toNumber(),
			"getTotalStakedContentEarning() returns incorrect value for total earning from hosting the content"
		);
		assert.equal(
			getTotalStakedContentEarning[2].toNumber(),
			stakedContentTheAOEarning.toNumber(),
			"getTotalStakedContentEarning() returns incorrect value for total The AO earning of the content"
		);
	};

	it("The AO - transferOwnership() should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await aoearning.transferOwnership(taoId1, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await aoearning.transferOwnership(taoId1, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await aoearning.theAO();
		assert.equal(newTheAO, taoId1, "Contract has incorrect TheAO address after transferring ownership");
		theAO = await aoearning.theAO();
	});

	it("The AO - setWhitelist() should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await aoearning.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await aoearning.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await aoearning.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");

		// Create several contents
		var result = await aocontent.create(nameId1, baseChallenge, fileSize, contentUsageType_aoContent, emptyAddress, {
			from: whitelistedAddress
		});
		var storeContentEvent = result.logs[0];
		contentId1 = storeContentEvent.args.contentId;

		result = await aocontent.create(nameId2, baseChallenge, fileSize, contentUsageType_creativeCommons, emptyAddress, {
			from: whitelistedAddress
		});
		storeContentEvent = result.logs[0];
		contentId2 = storeContentEvent.args.contentId;

		result = await aocontent.create(nameId1, baseChallenge, fileSize, contentUsageType_taoContent, taoId1, {
			from: whitelistedAddress
		});
		storeContentEvent = result.logs[0];
		contentId3 = storeContentEvent.args.contentId;

		result = await aostakedcontent.create(nameId1, contentId1, 4, 1000, "mega", 100000, 100000, { from: whitelistedAddress });
		var stakeContentEvent = result.logs[0];
		stakedContentId1 = stakeContentEvent.args.stakedContentId;

		result = await aostakedcontent.create(nameId2, contentId2, 0, 0, "", 1000000, 100000, { from: whitelistedAddress });
		stakeContentEvent = result.logs[0];
		stakedContentId2 = stakeContentEvent.args.stakedContentId;

		result = await aostakedcontent.create(nameId1, contentId3, 1000000, 0, "ao", 0, 100000, { from: whitelistedAddress });
		stakeContentEvent = result.logs[0];
		stakedContentId3 = stakeContentEvent.args.stakedContentId;

		result = await aocontenthost.create(
			nameId1,
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
			nameId2,
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
			nameId1,
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

	it("The AO - setSettingTAOId() should be able to set settingTAOId", async function() {
		var canSetSettingTAOId;
		try {
			await aoearning.setSettingTAOId(settingTAOId, { from: someAddress });
			canSetSettingTAOId = true;
		} catch (e) {
			canSetSettingTAOId = false;
		}
		assert.equal(canSetSettingTAOId, false, "Non-AO can set settingTAOId");

		try {
			await aoearning.setSettingTAOId(settingTAOId, { from: account1 });
			canSetSettingTAOId = true;
		} catch (e) {
			canSetSettingTAOId = false;
		}
		assert.equal(canSetSettingTAOId, true, "The AO can't set settingTAOId");

		var _settingTAOId = await aoearning.settingTAOId();
		assert.equal(_settingTAOId, settingTAOId, "Contract has incorrect settingTAOId");
	});

	it("The AO - setAOSettingAddress() should be able to set AOSetting address", async function() {
		var canSetAddress;
		try {
			await aoearning.setAOSettingAddress(aosetting.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOSetting address");

		try {
			await aoearning.setAOSettingAddress(aosetting.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOSetting address");

		var aoSettingAddress = await aoearning.aoSettingAddress();
		assert.equal(aoSettingAddress, aosetting.address, "Contract has incorrect aoSettingAddress");
	});

	it("The AO - setAOIonAddress() should be able to set AOIon address", async function() {
		var canSetAddress;
		try {
			await aoearning.setAOIonAddress(aoion.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOIon address");

		try {
			await aoearning.setAOIonAddress(aoion.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOIon address");

		var aoIonAddress = await aoearning.aoIonAddress();
		assert.equal(aoIonAddress, aoion.address, "Contract has incorrect aoIonAddress");
	});

	it("The AO - setNameFactoryAddress() should be able to set NameFactory address", async function() {
		var canSetAddress;
		try {
			await aoearning.setNameFactoryAddress(namefactory.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameFactory address");

		try {
			await aoearning.setNameFactoryAddress(namefactory.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameFactory address");

		var nameFactoryAddress = await aoearning.nameFactoryAddress();
		assert.equal(nameFactoryAddress, namefactory.address, "Contract has incorrect nameFactoryAddress");
	});

	it("The AO - setPathosAddress() should be able to set Pathos address", async function() {
		var canSetAddress;
		try {
			await aoearning.setPathosAddress(pathos.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set Pathos address");

		try {
			await aoearning.setPathosAddress(pathos.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set Pathos address");

		var pathosAddress = await aoearning.pathosAddress();
		assert.equal(pathosAddress, pathos.address, "Contract has incorrect pathosAddress");
	});

	it("The AO - setEthosAddress() should be able to set Ethos address", async function() {
		var canSetAddress;
		try {
			await aoearning.setEthosAddress(ethos.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set Ethos address");

		try {
			await aoearning.setEthosAddress(ethos.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set Ethos address");

		var ethosAddress = await aoearning.ethosAddress();
		assert.equal(ethosAddress, ethos.address, "Contract has incorrect ethosAddress");
	});

	it("The AO - setAOContentAddress() should be able to set AOContent address", async function() {
		var canSetAddress;
		try {
			await aoearning.setAOContentAddress(aocontent.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOContent address");

		try {
			await aoearning.setAOContentAddress(aocontent.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOContent address");

		var aoContentAddress = await aoearning.aoContentAddress();
		assert.equal(aoContentAddress, aocontent.address, "Contract has incorrect aoContentAddress");
	});

	it("The AO - setAOStakedContentAddress() should be able to set AOStakedContent address", async function() {
		var canSetAddress;
		try {
			await aoearning.setAOStakedContentAddress(aostakedcontent.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOStakedContent address");

		try {
			await aoearning.setAOStakedContentAddress(aostakedcontent.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOStakedContent address");

		var aoStakedContentAddress = await aoearning.aoStakedContentAddress();
		assert.equal(aoStakedContentAddress, aostakedcontent.address, "Contract has incorrect aoStakedContentAddress");
	});

	it("The AO - setAOContentHostAddress() should be able to set AOContentHost address", async function() {
		var canSetAddress;
		try {
			await aoearning.setAOContentHostAddress(aocontenthost.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOContentHost address");

		try {
			await aoearning.setAOContentHostAddress(aocontenthost.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOContentHost address");

		var aoContentHostAddress = await aoearning.aoContentHostAddress();
		assert.equal(aoContentHostAddress, aocontenthost.address, "Contract has incorrect aoContentHostAddress");
	});

	it("The AO - setAOPurchaseReceiptAddress() should be able to set AOPurchaseReceipt address", async function() {
		var canSetAddress;
		try {
			await aoearning.setAOPurchaseReceiptAddress(aopurchasereceipt.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOPurchaseReceipt address");

		try {
			await aoearning.setAOPurchaseReceiptAddress(aopurchasereceipt.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOPurchaseReceipt address");

		var aoPurchaseReceiptAddress = await aoearning.aoPurchaseReceiptAddress();
		assert.equal(aoPurchaseReceiptAddress, aopurchasereceipt.address, "Contract has incorrect aoPurchaseReceiptAddress");
	});

	it("The AO - setNamePublicKeyAddress() should be able to set NamePublicKey address", async function() {
		var canSetAddress;
		try {
			await aoearning.setNamePublicKeyAddress(namepublickey.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NamePublicKey address");

		try {
			await aoearning.setNamePublicKeyAddress(namepublickey.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NamePublicKey address");

		var namePublicKeyAddress = await aoearning.namePublicKeyAddress();
		assert.equal(namePublicKeyAddress, namepublickey.address, "Contract has incorrect namePublicKeyAddress");
	});

	it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await aoearning.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await aoearning.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await aoearning.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("Whitelisted address - should store earning in escrow when buying content", async function() {
		purchaseReceiptId1 = await buyContentCalculateEarning(
			account3,
			contentHostId1,
			5,
			100,
			"mega",
			account3LocalIdentity.publicKey,
			account3LocalIdentity.address
		);
		purchaseReceiptId2 = await buyContentCalculateEarning(
			account3,
			contentHostId2,
			5,
			100,
			"mega",
			account3LocalIdentity.publicKey,
			account3LocalIdentity.address
		);
		purchaseReceiptId3 = await buyContentCalculateEarning(
			account3,
			contentHostId3,
			0,
			0,
			"",
			account3LocalIdentity.publicKey,
			account3LocalIdentity.address
		);
		purchaseReceiptId4 = await buyContentCalculateEarning(
			account5,
			contentHostId2,
			0,
			0,
			"",
			account5LocalIdentity.publicKey,
			account5LocalIdentity.address
		);
		purchaseReceiptId5 = await buyContentCalculateEarning(
			account5,
			contentHostId3,
			0,
			0,
			"",
			account5LocalIdentity.publicKey,
			account5LocalIdentity.address
		);
	});

	it("Whitelisted address - should release earning in escrow when becoming host of a content", async function() {
		var vrs = createBecomeHostSignature(account3PrivateKey, baseChallenge);
		contentHostId4 = await becomeHostReleaseEarning(
			account3,
			purchaseReceiptId1,
			vrs.v,
			vrs.r,
			vrs.s,
			account3EncChallenge,
			account3ContentDatKey,
			account3MetadataDatKey
		);
		contentHostId5 = await becomeHostReleaseEarning(
			account3,
			purchaseReceiptId2,
			vrs.v,
			vrs.r,
			vrs.s,
			account3EncChallenge,
			account3ContentDatKey,
			account3MetadataDatKey
		);
		contentHostId6 = await becomeHostReleaseEarning(
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

	it("new node should be able to buy content from new distribution node, and then become a host itself", async function() {
		purchaseReceiptId6 = await buyContentCalculateEarning(
			account4,
			contentHostId4,
			5,
			100,
			"mega",
			account4LocalIdentity.publicKey,
			account4LocalIdentity.address
		);

		purchaseReceiptId7 = await buyContentCalculateEarning(
			account4,
			contentHostId5,
			0,
			0,
			"",
			account4LocalIdentity.publicKey,
			account4LocalIdentity.address
		);

		purchaseReceiptId8 = await buyContentCalculateEarning(
			account4,
			contentHostId6,
			0,
			0,
			"",
			account4LocalIdentity.publicKey,
			account4LocalIdentity.address
		);

		var vrs = createBecomeHostSignature(account4PrivateKey, baseChallenge);
		await becomeHostReleaseEarning(
			account4,
			purchaseReceiptId6,
			vrs.v,
			vrs.r,
			vrs.s,
			account4EncChallenge,
			account4ContentDatKey,
			account4MetadataDatKey
		);
		await becomeHostReleaseEarning(
			account4,
			purchaseReceiptId7,
			vrs.v,
			vrs.r,
			vrs.s,
			account4EncChallenge,
			account4ContentDatKey,
			account4MetadataDatKey
		);
		await becomeHostReleaseEarning(
			account4,
			purchaseReceiptId8,
			vrs.v,
			vrs.r,
			vrs.s,
			account4EncChallenge,
			account4ContentDatKey,
			account4MetadataDatKey
		);
	});

	it("getTotalStakedContentEarning() - should return earning information of a StakedContent ID", async function() {
		await getTotalStakedContentEarning(stakedContentId1);
		await getTotalStakedContentEarning(stakedContentId2);
		await getTotalStakedContentEarning(stakedContentId3);
	});
});
