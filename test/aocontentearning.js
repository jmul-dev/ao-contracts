var AOContent = artifacts.require("./AOContent.sol");
var AOToken = artifacts.require("./AOToken.sol");
var AOTreasury = artifacts.require("./AOTreasury.sol");
var AOEarning = artifacts.require("./AOEarning.sol");
var AOLibrary = artifacts.require("./AOLibrary.sol");
var Pathos = artifacts.require("./Pathos.sol");
var AntiLogos = artifacts.require("./AntiLogos.sol");
var AOSetting = artifacts.require("./AOSetting.sol");
var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var EthCrypto = require("eth-crypto");

contract("AOContent & AOEarning", function(accounts) {
	var aocontent,
		aotoken,
		aodecimals,
		aotreasury,
		aoearning,
		library,
		pathos,
		antilogos,
		settingTAOId,
		aosetting,
		namefactory,
		taofactory,
		inflationRate,
		foundationCut,
		percentageDivisor,
		multiplierDivisor,
		contentUsageType_aoContent,
		contentUsageType_creativeCommons,
		contentUsageType_taoContent,
		taoContentState_submitted,
		taoContentState_pendingReview,
		taoContentState_acceptedToTAO;

	var someAddress = "0x0694bdcab07b298e88a834a3c91602cb8f457bde";
	var developer = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];

	var baseChallenge = "basechallengestring";
	var encChallenge = "encchallengestring";
	var account2EncChallenge = "account2encchallengestring";
	var account3EncChallenge = "account3encchallengestring";
	var contentDatKey = "7bde24fb38d6e316ec48874c937f4582f3a494df1ecf387e6edb2e25bff700f7";
	var metadataDatKey = "7bde24fb38d6e316ec48874c937f4582f3a494df1ecf387e6edb2e25bff700f7";
	var account2ContentDatKey = "02bde24fb38d6e316ec48874c937f4582f3a494df1ecf38eofu2ufgooi2ho2ie";
	var account2MetadataDatKey = "02bde24fb38d6e316ec48874c937f4582f3a494df1ecf38eofu2ufgooi2ho2ie";
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

	var fileSize = 1000000; // 1000000 bytes = min 1000000 AO
	var profitPercentage = 600000; // 60%

	var emptyAddress = "0x0000000000000000000000000000000000000000";
	var nullBytesValue = "0x0000000000000000000000000000000000000000000000000000000000000000";
	var extraData = JSON.stringify({ extraData: "value" });

	var nameId1, // Name that creates a TAO, i.e taoId1
		nameId2, // Other Name that creates a TAO
		nameId3, // Name that also creates a TAO but has 0 token balance
		taoId1, // A TAO created by nameId1
		taoId2, // A TAO created by nameId1 to update TAO Content State
		taoId3, // A TAO created by nameId2
		taoId4; // A TAO created by nameId3

	before(async function() {
		aocontent = await AOContent.deployed();
		aotoken = await AOToken.deployed();
		aotreasury = await AOTreasury.deployed();
		aoearning = await AOEarning.deployed();
		aosetting = await AOSetting.deployed();
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();

		// Get the decimals
		aodecimals = await aotoken.decimals();

		library = await AOLibrary.deployed();

		pathos = await Pathos.deployed();
		antilogos = await AntiLogos.deployed();

		settingTAOId = await aoearning.settingTAOId();

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "inflationRate");
		inflationRate = settingValues[0];

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "foundationCut");
		foundationCut = settingValues[0];

		percentageDivisor = await library.PERCENTAGE_DIVISOR();
		multiplierDivisor = await library.MULTIPLIER_DIVISOR();

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
	});

	contract("AOContent - Developer Only Function Tests", function() {
		it("only developer can pause/unpause contract", async function() {
			var canPause;
			try {
				await aocontent.setPaused(true, { from: account1 });
				canPause = true;
			} catch (e) {
				canPause = false;
			}
			assert.notEqual(canPause, true, "Non-developer can pause contract");
			try {
				await aocontent.setPaused(true, { from: developer });
				canPause = true;
			} catch (e) {
				canPause = false;
			}
			assert.equal(canPause, true, "Developer can't pause contract");
			var paused = await aocontent.paused();
			assert.equal(paused, true, "Contract has incorrect paused value after developer set paused");
		});

		it("only developer can set base denomination address", async function() {
			var canSetBaseDenominationAddress;
			try {
				await aocontent.setBaseDenominationAddress(aotoken.address, { from: account1 });
				canSetBaseDenominationAddress = true;
			} catch (e) {
				canSetBaseDenominationAddress = false;
			}
			assert.notEqual(canSetBaseDenominationAddress, true, "Non-developer can set base denomination address");
			try {
				await aocontent.setBaseDenominationAddress(someAddress, { from: developer });
				canSetBaseDenominationAddress = true;
			} catch (e) {
				canSetBaseDenominationAddress = false;
			}
			assert.notEqual(canSetBaseDenominationAddress, true, "Developer can set invalid base denomination address");
			try {
				await aocontent.setBaseDenominationAddress(aotoken.address, { from: developer });
				canSetBaseDenominationAddress = true;
			} catch (e) {
				canSetBaseDenominationAddress = false;
			}
			assert.equal(canSetBaseDenominationAddress, true, "Developer can't set base denomination address");
			var baseDenominationAddress = await aocontent.baseDenominationAddress();
			assert.equal(baseDenominationAddress, aotoken.address, "Contract has incorrect base denomination address");
		});

		it("only developer can call escape hatch", async function() {
			var canEscapeHatch;
			try {
				await aocontent.escapeHatch({ from: account1 });
				canEscapeHatch = true;
			} catch (e) {
				canEscapeHatch = false;
			}
			assert.notEqual(canEscapeHatch, true, "Non-developer can call escape hatch");
			try {
				await aocontent.escapeHatch({ from: developer });
				canEscapeHatch = true;
			} catch (e) {
				canEscapeHatch = false;
			}
			assert.equal(canEscapeHatch, true, "Developer can't call escape hatch");
			var killed = await aocontent.killed();
			assert.equal(killed, true, "Contract has incorrect killed value after developer call escape hatch");
		});
	});

	contract("AOEarning - Developer Only Function Tests", function() {
		it("only developer can pause/unpause contract", async function() {
			var canPause;
			try {
				await aoearning.setPaused(true, { from: account1 });
				canPause = true;
			} catch (e) {
				canPause = false;
			}
			assert.notEqual(canPause, true, "Non-developer can pause contract");
			try {
				await aoearning.setPaused(true, { from: developer });
				canPause = true;
			} catch (e) {
				canPause = false;
			}
			assert.equal(canPause, true, "Developer can't pause contract");
			var paused = await aoearning.paused();
			assert.equal(paused, true, "Contract has incorrect paused value after developer set paused");
		});

		it("only developer can set base denomination address", async function() {
			var canSetBaseDenominationAddress;
			try {
				await aoearning.setBaseDenominationAddress(aotoken.address, { from: account1 });
				canSetBaseDenominationAddress = true;
			} catch (e) {
				canSetBaseDenominationAddress = false;
			}
			assert.notEqual(canSetBaseDenominationAddress, true, "Non-developer can set base denomination address");
			try {
				await aoearning.setBaseDenominationAddress(someAddress, { from: developer });
				canSetBaseDenominationAddress = true;
			} catch (e) {
				canSetBaseDenominationAddress = false;
			}
			assert.notEqual(canSetBaseDenominationAddress, true, "Developer can set invalid base denomination address");
			try {
				await aoearning.setBaseDenominationAddress(aotoken.address, { from: developer });
				canSetBaseDenominationAddress = true;
			} catch (e) {
				canSetBaseDenominationAddress = false;
			}
			assert.equal(canSetBaseDenominationAddress, true, "Developer can't set base denomination address");
			var baseDenominationAddress = await aoearning.baseDenominationAddress();
			assert.equal(baseDenominationAddress, aotoken.address, "Contract has incorrect base denomination address");
		});

		it("only developer can call escape hatch", async function() {
			var canEscapeHatch;
			try {
				await aoearning.escapeHatch({ from: account1 });
				canEscapeHatch = true;
			} catch (e) {
				canEscapeHatch = false;
			}
			assert.notEqual(canEscapeHatch, true, "Non-developer can call escape hatch");
			try {
				await aoearning.escapeHatch({ from: developer });
				canEscapeHatch = true;
			} catch (e) {
				canEscapeHatch = false;
			}
			assert.equal(canEscapeHatch, true, "Developer can't call escape hatch");
			var killed = await aoearning.killed();
			assert.equal(killed, true, "Contract has incorrect killed value after developer call escape hatch");
		});
	});

	contract("Stake, Unstake, Buy Content & Become Host Function Tests", function() {
		var AOContent_contentId1,
			AOContent_contentId2,
			AOContent_contentId3,
			AOContent_stakeId1,
			AOContent_stakeId2,
			AOContent_stakeId3,
			AOContent_contentHostId1,
			AOContent_contentHostId2,
			AOContent_contentHostId3,
			AOContent_contentHostPrice1,
			AOContent_contentHostPrice2,
			AOContent_contentHostPrice3,
			CreativeCommons_contentId1,
			CreativeCommons_contentId2,
			CreativeCommons_contentId3,
			CreativeCommons_stakeId1,
			CreativeCommons_stakeId2,
			CreativeCommons_stakeId3,
			CreativeCommons_contentHostId1,
			CreativeCommons_contentHostId2,
			CreativeCommons_contentHostId3,
			CreativeCommons_contentHostPrice1,
			CreativeCommons_contentHostPrice2,
			CreativeCommons_contentHostPrice3,
			TAOContent_contentId1,
			TAOContent_contentId2,
			TAOContent_contentId3,
			TAOContent_stakeId1,
			TAOContent_stakeId2,
			TAOContent_stakeId3,
			TAOContent_contentHostId1,
			TAOContent_contentHostId2,
			TAOContent_contentHostId3,
			TAOContent_contentHostPrice1,
			TAOContent_contentHostPrice2,
			TAOContent_contentHostPrice3,
			AOContent_purchaseId1,
			AOContent_purchaseId2,
			AOContent_purchaseId3,
			CreativeCommons_purchaseId1,
			CreativeCommons_purchaseId2,
			CreativeCommons_purchaseId3,
			TAOContent_purchaseId1,
			TAOContent_purchaseId2,
			TAOContent_purchaseId3,
			AOContent_contentHostId4,
			AOContent_contentHostId5,
			AOContent_contentHostId6,
			CreativeCommons_contentHostId4,
			CreativeCommons_contentHostId5,
			CreativeCommons_contentHostId6,
			TAOContent_contentHostId4,
			TAOContent_contentHostId5,
			TAOContent_contentHostId6;

		var stakeAOContent = async function(account, networkIntegerAmount, networkFractionAmount, denomination, primordialAmount) {
			var accountBalanceBefore = await aotoken.balanceOf(account);
			var accountStakedBalanceBefore = await aotoken.stakedBalance(account);
			var accountWeightedMultiplierBefore = await aotoken.weightedMultiplierByAddress(account);
			var accountPrimordialBalanceBefore = await aotoken.primordialBalanceOf(account);
			var accountPrimordialStakedBalanceBefore = await aotoken.primordialStakedBalance(
				account,
				accountWeightedMultiplierBefore.toNumber()
			);

			var canStake, content, stakedContent, contentHost, storeContentEvent, stakeContentEvent, hostContentEvent;
			try {
				var result = await aocontent.stakeAOContent(
					networkIntegerAmount,
					networkFractionAmount,
					denomination,
					primordialAmount,
					baseChallenge,
					encChallenge,
					contentDatKey,
					metadataDatKey,
					fileSize,
					profitPercentage,
					{ from: account }
				);

				storeContentEvent = result.logs[0];
				stakeContentEvent = result.logs[1];
				hostContentEvent = result.logs[2];

				contentId = storeContentEvent.args.contentId;
				stakeId = stakeContentEvent.args.stakeId;
				contentHostId = hostContentEvent.args.contentHostId;

				content = await aocontent.contentById(contentId);
				stakedContent = await aocontent.stakedContentById(stakeId);
				contentHost = await aocontent.contentHostById(contentHostId);
				canStake = true;
			} catch (e) {
				canStake = false;
				contentId = null;
				stakeId = null;
				contentHostId = null;

				content = null;
				stakedContent = null;
				contentHost = null;
			}
			var networkAmount =
				networkIntegerAmount > 0 || networkFractionAmount > 0
					? await aotreasury.toBase(networkIntegerAmount, networkFractionAmount, denomination)
					: 0;
			assert.equal(canStake, true, "account can't stake content even though enough tokens were sent");
			assert.notEqual(contentId, null, "Unable to determine the contentID from the log after staking content");
			assert.notEqual(stakeId, null, "Unable to determine the stakeID from the log after staking content");
			assert.notEqual(contentHostId, null, "Unable to determine the contentHostID from the log after staking content");

			// Verify content
			assert.equal(content[0], account, "contentById returns incorrect content creator");
			assert.equal(content[1].toString(), fileSize, "contentById returns incorrect filesize");
			assert.equal(content[2], contentUsageType_aoContent, "contentById returns incorrect contentUsageType");
			assert.equal(content[3], emptyAddress, "contentById returns incorrect taoId");
			assert.equal(content[4], nullBytesValue, "contentById returns incorrect taoContentState");
			assert.equal(content[5].toNumber(), 0, "contentById returns incorrect updateTAOContentStateV");
			assert.equal(content[6], nullBytesValue, "contentById returns incorrect updateTAOContentStateR");
			assert.equal(content[7], nullBytesValue, "contentById returns incorrect updateTAOContentStateS");
			assert.equal(content[8], "", "contentById returns incorrect extraData");

			// Verify stakedContent
			assert.equal(stakedContent[0], contentId, "stakedContentById returns incorrect contentID");
			assert.equal(stakedContent[1], account, "stakedContentById returns incorrect stakeOwner");
			assert.equal(
				stakedContent[2].toString(),
				networkAmount ? networkAmount.toString() : 0,
				"stakedContentById returns incorrect networkAmount"
			);
			assert.equal(stakedContent[3].toString(), primordialAmount, "stakedContentById returns incorrect primordialAmount");
			assert.equal(
				stakedContent[4].toString(),
				primordialAmount ? accountWeightedMultiplierBefore.toString() : 0,
				"stakedContentById returns incorrect primordialWeightedMultiplier"
			);
			assert.equal(stakedContent[5].toString(), profitPercentage, "stakedContentById returns incorrect profitPercentage");
			assert.equal(stakedContent[6], true, "stakedContentById returns incorrect active status");

			// Verify contentHost
			assert.equal(contentHost[0], stakeId, "contentHostById returns incorrect stakeID");
			assert.equal(contentHost[1], account, "contentHostById returns incorrect host");
			assert.equal(contentHost[2], contentDatKey, "contentHostById returns incorrect contentDatKey");
			assert.equal(contentHost[3], metadataDatKey, "contentHostById returns incorrect metadataDatKey");

			// Verify the account balance after staking
			var accountBalanceAfter = await aotoken.balanceOf(account);
			var accountStakedBalanceAfter = await aotoken.stakedBalance(account);
			var accountWeightedMultiplierAfter = await aotoken.weightedMultiplierByAddress(account);
			var accountPrimordialBalanceAfter = await aotoken.primordialBalanceOf(account);
			var accountPrimordialStakedBalanceAfter = await aotoken.primordialStakedBalance(
				account,
				accountWeightedMultiplierAfter.toNumber()
			);

			assert.equal(
				accountBalanceAfter.toString(),
				accountBalanceBefore.minus(networkAmount).toString(),
				"account has incorrect balance after staking"
			);
			assert.equal(
				accountStakedBalanceAfter.toString(),
				accountStakedBalanceBefore.plus(networkAmount).toString(),
				"account has incorrect staked balance after staking"
			);
			assert.equal(
				accountWeightedMultiplierAfter.toString(),
				accountWeightedMultiplierBefore.toString(),
				"account has incorrect weighted multiplier after staking"
			);
			assert.equal(
				accountPrimordialBalanceAfter.toString(),
				accountPrimordialBalanceBefore.minus(primordialAmount).toString(),
				"account has incorrect primordial balance after staking"
			);
			assert.equal(
				accountPrimordialStakedBalanceAfter.toString(),
				accountPrimordialStakedBalanceBefore.plus(primordialAmount).toString(),
				"account has incorrect staked primordial balance after staking"
			);

			return { contentId: contentId, stakeId: stakeId, contentHostId: contentHostId };
		};

		var stakeCreativeCommonsContent = async function(
			account,
			networkIntegerAmount,
			networkFractionAmount,
			denomination,
			primordialAmount
		) {
			var accountBalanceBefore = await aotoken.balanceOf(account);
			var accountStakedBalanceBefore = await aotoken.stakedBalance(account);
			var accountWeightedMultiplierBefore = await aotoken.weightedMultiplierByAddress(account);
			var accountPrimordialBalanceBefore = await aotoken.primordialBalanceOf(account);
			var accountPrimordialStakedBalanceBefore = await aotoken.primordialStakedBalance(
				account,
				accountWeightedMultiplierBefore.toNumber()
			);

			var canStake, content, stakedContent, contentHost, storeContentEvent, stakeContentEvent, hostContentEvent;
			try {
				var result = await aocontent.stakeCreativeCommonsContent(
					networkIntegerAmount,
					networkFractionAmount,
					denomination,
					primordialAmount,
					baseChallenge,
					encChallenge,
					contentDatKey,
					metadataDatKey,
					fileSize,
					{ from: account }
				);

				storeContentEvent = result.logs[0];
				stakeContentEvent = result.logs[1];
				hostContentEvent = result.logs[2];

				contentId = storeContentEvent.args.contentId;
				stakeId = stakeContentEvent.args.stakeId;
				contentHostId = hostContentEvent.args.contentHostId;

				content = await aocontent.contentById(contentId);
				stakedContent = await aocontent.stakedContentById(stakeId);
				contentHost = await aocontent.contentHostById(contentHostId);
				canStake = true;
			} catch (e) {
				canStake = false;
				contentId = null;
				stakeId = null;
				contentHostId = null;

				content = null;
				stakedContent = null;
				contentHost = null;
			}
			var networkAmount =
				networkIntegerAmount > 0 || networkFractionAmount > 0
					? await aotreasury.toBase(networkIntegerAmount, networkFractionAmount, denomination)
					: 0;
			assert.equal(canStake, true, "account can't stake content even though enough tokens were sent");
			assert.notEqual(contentId, null, "Unable to determine the contentID from the log after staking content");
			assert.notEqual(stakeId, null, "Unable to determine the stakeID from the log after staking content");
			assert.notEqual(contentHostId, null, "Unable to determine the contentHostID from the log after staking content");

			// Verify content
			assert.equal(content[0], account, "contentById returns incorrect content creator");
			assert.equal(content[1].toString(), fileSize, "contentById returns incorrect filesize");
			assert.equal(content[2], contentUsageType_creativeCommons, "contentById returns incorrect contentUsageType");
			assert.equal(content[3], emptyAddress, "contentById returns incorrect taoId");
			assert.equal(content[4], nullBytesValue, "contentById returns incorrect taoContentState");
			assert.equal(content[5].toNumber(), 0, "contentById returns incorrect updateTAOContentStateV");
			assert.equal(content[6], nullBytesValue, "contentById returns incorrect updateTAOContentStateR");
			assert.equal(content[7], nullBytesValue, "contentById returns incorrect updateTAOContentStateS");
			assert.equal(content[8], "", "contentById returns incorrect extraData");

			// Verify stakedContent
			assert.equal(stakedContent[0], contentId, "stakedContentById returns incorrect contentID");
			assert.equal(stakedContent[1], account, "stakedContentById returns incorrect stakeOwner");
			assert.equal(
				stakedContent[2].toString(),
				networkAmount ? networkAmount.toString() : 0,
				"stakedContentById returns incorrect networkAmount"
			);
			assert.equal(stakedContent[3].toString(), primordialAmount, "stakedContentById returns incorrect primordialAmount");
			assert.equal(
				stakedContent[4].toString(),
				primordialAmount ? accountWeightedMultiplierBefore.toString() : 0,
				"stakedContentById returns incorrect primordialWeightedMultiplier"
			);
			assert.equal(stakedContent[5].toString(), 0, "stakedContentById returns incorrect profitPercentage");
			assert.equal(stakedContent[6], true, "stakedContentById returns incorrect active status");

			// Verify contentHost
			assert.equal(contentHost[0], stakeId, "contentHostById returns incorrect stakeID");
			assert.equal(contentHost[1], account, "contentHostById returns incorrect host");
			assert.equal(contentHost[2], contentDatKey, "contentHostById returns incorrect contentDatKey");
			assert.equal(contentHost[3], metadataDatKey, "contentHostById returns incorrect metadataDatKey");

			// Verify the account balance after staking
			var accountBalanceAfter = await aotoken.balanceOf(account);
			var accountStakedBalanceAfter = await aotoken.stakedBalance(account);
			var accountWeightedMultiplierAfter = await aotoken.weightedMultiplierByAddress(account);
			var accountPrimordialBalanceAfter = await aotoken.primordialBalanceOf(account);
			var accountPrimordialStakedBalanceAfter = await aotoken.primordialStakedBalance(
				account,
				accountWeightedMultiplierAfter.toNumber()
			);

			assert.equal(
				accountBalanceAfter.toString(),
				accountBalanceBefore.minus(networkAmount).toString(),
				"account has incorrect balance after staking"
			);
			assert.equal(
				accountStakedBalanceAfter.toString(),
				accountStakedBalanceBefore.plus(networkAmount).toString(),
				"account has incorrect staked balance after staking"
			);
			assert.equal(
				accountWeightedMultiplierAfter.toString(),
				accountWeightedMultiplierBefore.toString(),
				"account has incorrect weighted multiplier after staking"
			);
			assert.equal(
				accountPrimordialBalanceAfter.toString(),
				accountPrimordialBalanceBefore.minus(primordialAmount).toString(),
				"account has incorrect primordial balance after staking"
			);
			assert.equal(
				accountPrimordialStakedBalanceAfter.toString(),
				accountPrimordialStakedBalanceBefore.plus(primordialAmount).toString(),
				"account has incorrect staked primordial balance after staking"
			);

			return { contentId: contentId, stakeId: stakeId, contentHostId: contentHostId };
		};

		var stakeTAOContent = async function(account, networkIntegerAmount, networkFractionAmount, denomination, primordialAmount, taoId) {
			var accountBalanceBefore = await aotoken.balanceOf(account);
			var accountStakedBalanceBefore = await aotoken.stakedBalance(account);
			var accountWeightedMultiplierBefore = await aotoken.weightedMultiplierByAddress(account);
			var accountPrimordialBalanceBefore = await aotoken.primordialBalanceOf(account);
			var accountPrimordialStakedBalanceBefore = await aotoken.primordialStakedBalance(
				account,
				accountWeightedMultiplierBefore.toNumber()
			);

			var canStake, content, stakedContent, contentHost, storeContentEvent, stakeContentEvent, hostContentEvent;
			try {
				var result = await aocontent.stakeTAOContent(
					networkIntegerAmount,
					networkFractionAmount,
					denomination,
					primordialAmount,
					baseChallenge,
					encChallenge,
					contentDatKey,
					metadataDatKey,
					fileSize,
					taoId,
					{ from: account }
				);

				storeContentEvent = result.logs[0];
				stakeContentEvent = result.logs[1];
				hostContentEvent = result.logs[2];

				contentId = storeContentEvent.args.contentId;
				stakeId = stakeContentEvent.args.stakeId;
				contentHostId = hostContentEvent.args.contentHostId;

				content = await aocontent.contentById(contentId);
				stakedContent = await aocontent.stakedContentById(stakeId);
				contentHost = await aocontent.contentHostById(contentHostId);
				canStake = true;
			} catch (e) {
				canStake = false;
				contentId = null;
				stakeId = null;
				contentHostId = null;

				content = null;
				stakedContent = null;
				contentHost = null;
			}
			var networkAmount =
				networkIntegerAmount > 0 || networkFractionAmount > 0
					? await aotreasury.toBase(networkIntegerAmount, networkFractionAmount, denomination)
					: 0;
			assert.equal(canStake, true, "account can't stake content even though enough tokens were sent");
			assert.notEqual(contentId, null, "Unable to determine the contentID from the log after staking content");
			assert.notEqual(stakeId, null, "Unable to determine the stakeID from the log after staking content");
			assert.notEqual(contentHostId, null, "Unable to determine the contentHostID from the log after staking content");

			// Verify content
			assert.equal(content[0], account, "contentById returns incorrect content creator");
			assert.equal(content[1].toString(), fileSize, "contentById returns incorrect filesize");
			assert.equal(content[2], contentUsageType_taoContent, "contentById returns incorrect contentUsageType");
			assert.equal(content[3], taoId, "contentById returns incorrect taoId");
			assert.equal(content[4], taoContentState_submitted, "contentById returns incorrect taoContentState");
			assert.equal(content[5].toNumber(), 0, "contentById returns incorrect updateTAOContentStateV");
			assert.equal(content[6], nullBytesValue, "contentById returns incorrect updateTAOContentStateR");
			assert.equal(content[7], nullBytesValue, "contentById returns incorrect updateTAOContentStateS");
			assert.equal(content[8], "", "contentById returns incorrect extraData");

			// Verify stakedContent
			assert.equal(stakedContent[0], contentId, "stakedContentById returns incorrect contentID");
			assert.equal(stakedContent[1], account, "stakedContentById returns incorrect stakeOwner");
			assert.equal(
				stakedContent[2].toString(),
				networkAmount ? networkAmount.toString() : 0,
				"stakedContentById returns incorrect networkAmount"
			);
			assert.equal(stakedContent[3].toString(), primordialAmount, "stakedContentById returns incorrect primordialAmount");
			assert.equal(
				stakedContent[4].toString(),
				primordialAmount ? accountWeightedMultiplierBefore.toString() : 0,
				"stakedContentById returns incorrect primordialWeightedMultiplier"
			);
			assert.equal(stakedContent[5].toString(), 0, "stakedContentById returns incorrect profitPercentage");
			assert.equal(stakedContent[6], true, "stakedContentById returns incorrect active status");

			// Verify contentHost
			assert.equal(contentHost[0], stakeId, "contentHostById returns incorrect stakeID");
			assert.equal(contentHost[1], account, "contentHostById returns incorrect host");
			assert.equal(contentHost[2], contentDatKey, "contentHostById returns incorrect contentDatKey");
			assert.equal(contentHost[3], metadataDatKey, "contentHostById returns incorrect metadataDatKey");

			// Verify the account balance after staking
			var accountBalanceAfter = await aotoken.balanceOf(account);
			var accountStakedBalanceAfter = await aotoken.stakedBalance(account);
			var accountWeightedMultiplierAfter = await aotoken.weightedMultiplierByAddress(account);
			var accountPrimordialBalanceAfter = await aotoken.primordialBalanceOf(account);
			var accountPrimordialStakedBalanceAfter = await aotoken.primordialStakedBalance(
				account,
				accountWeightedMultiplierAfter.toNumber()
			);

			assert.equal(
				accountBalanceAfter.toString(),
				accountBalanceBefore.minus(networkAmount).toString(),
				"account has incorrect balance after staking"
			);
			assert.equal(
				accountStakedBalanceAfter.toString(),
				accountStakedBalanceBefore.plus(networkAmount).toString(),
				"account has incorrect staked balance after staking"
			);
			assert.equal(
				accountWeightedMultiplierAfter.toString(),
				accountWeightedMultiplierBefore.toString(),
				"account has incorrect weighted multiplier after staking"
			);
			assert.equal(
				accountPrimordialBalanceAfter.toString(),
				accountPrimordialBalanceBefore.minus(primordialAmount).toString(),
				"account has incorrect primordial balance after staking"
			);
			assert.equal(
				accountPrimordialStakedBalanceAfter.toString(),
				accountPrimordialStakedBalanceBefore.plus(primordialAmount).toString(),
				"account has incorrect staked primordial balance after staking"
			);

			return { contentId: contentId, stakeId: stakeId, contentHostId: contentHostId };
		};

		var unstakePartialContent = async function(
			account,
			stakeId,
			networkIntegerAmount,
			networkFractionAmount,
			denomination,
			primordialAmount
		) {
			var stakedContentBefore = await aocontent.stakedContentById(stakeId);
			var accountBalanceBefore = await aotoken.balanceOf(account);
			var accountStakedBalanceBefore = await aotoken.stakedBalance(account);
			var accountWeightedMultiplierBefore = await aotoken.weightedMultiplierByAddress(account);
			var accountPrimordialBalanceBefore = await aotoken.primordialBalanceOf(account);
			var accountPrimordialStakedBalanceBefore = await aotoken.primordialStakedBalance(account, stakedContentBefore[4].toString());

			var networkAmount =
				networkIntegerAmount > 0 || networkFractionAmount > 0
					? await aotreasury.toBase(networkIntegerAmount, networkFractionAmount, denomination)
					: 0;

			var canUnstakePartial;
			try {
				await aocontent.unstakePartialContent(
					stakeId,
					networkIntegerAmount,
					networkFractionAmount,
					denomination,
					primordialAmount,
					{
						from: account
					}
				);

				canUnstakePartial = true;
			} catch (e) {
				canUnstakePartial = false;
			}
			assert.equal(
				canUnstakePartial,
				true,
				"Stake owner was unable to partially unstake network tokens from existing staked content."
			);

			var stakedContentAfter = await aocontent.stakedContentById(stakeId);
			var accountBalanceAfter = await aotoken.balanceOf(account);
			var accountStakedBalanceAfter = await aotoken.stakedBalance(account);
			var accountWeightedMultiplierAfter = await aotoken.weightedMultiplierByAddress(account);
			var accountPrimordialBalanceAfter = await aotoken.primordialBalanceOf(account);
			var accountPrimordialStakedBalanceAfter = await aotoken.primordialStakedBalance(account, stakedContentAfter[4].toString());

			assert.equal(
				stakedContentAfter[2].toString(),
				stakedContentBefore[2].minus(networkAmount).toString(),
				"Staked content has incorrect networkAmount after unstaking"
			);
			assert.equal(
				stakedContentAfter[3].toString(),
				stakedContentBefore[3].minus(primordialAmount).toString(),
				"Staked content has incorrect primordialAmount after unstaking"
			);
			assert.equal(
				stakedContentAfter[4].toString(),
				stakedContentBefore[4].toString(),
				"Staked content has incorrect primordialWeightedMultiplier after unstaking"
			);
			assert.equal(stakedContentAfter[6], true, "Staked content has incorrect status after unstaking");
			assert.equal(
				accountBalanceAfter.toString(),
				accountBalanceBefore.plus(networkAmount).toString(),
				"Account has incorrect balance after unstaking"
			);
			assert.equal(
				accountStakedBalanceAfter.toString(),
				accountStakedBalanceBefore.minus(networkAmount).toString(),
				"Account has incorrect staked balance after unstaking"
			);
			assert.equal(
				accountWeightedMultiplierAfter.toString(),
				accountWeightedMultiplierBefore.toString(),
				"Account has incorrect weighted multiplier after unstaking"
			);
			assert.equal(
				accountPrimordialBalanceAfter.toString(),
				accountPrimordialBalanceBefore.plus(primordialAmount).toString(),
				"Account has incorrect primordial balance after unstaking"
			);
			assert.equal(
				accountPrimordialStakedBalanceAfter.toString(),
				accountPrimordialStakedBalanceBefore.minus(primordialAmount).toString(),
				"Account has incorrect primordial staked balance after unstaking"
			);
		};

		var stakeExistingContent = async function(
			account,
			stakeId,
			networkIntegerAmount,
			networkFractionAmount,
			denomination,
			primordialAmount
		) {
			var stakedContentBefore = await aocontent.stakedContentById(stakeId);
			var accountBalanceBefore = await aotoken.balanceOf(account);
			var accountStakedBalanceBefore = await aotoken.stakedBalance(account);
			var accountWeightedMultiplierBefore = await aotoken.weightedMultiplierByAddress(account);
			var accountPrimordialBalanceBefore = await aotoken.primordialBalanceOf(account);
			var accountPrimordialStakedBalanceBefore = await aotoken.primordialStakedBalance(
				account,
				accountWeightedMultiplierBefore.toString()
			);

			var canStakeExisting;
			try {
				await aocontent.stakeExistingContent(stakeId, networkIntegerAmount, networkFractionAmount, denomination, primordialAmount, {
					from: account
				});
				canStakeExisting = true;
			} catch (e) {
				canStakeExisting = false;
			}
			assert.equal(canStakeExisting, true, "Stake owner can't stake tokens on existing staked content");

			var networkAmount =
				networkIntegerAmount > 0 || networkFractionAmount > 0
					? await aotreasury.toBase(networkIntegerAmount, networkFractionAmount, denomination)
					: 0;

			var stakedContentAfter = await aocontent.stakedContentById(stakeId);
			var accountBalanceAfter = await aotoken.balanceOf(account);
			var accountStakedBalanceAfter = await aotoken.stakedBalance(account);
			var accountWeightedMultiplierAfter = await aotoken.weightedMultiplierByAddress(account);
			var accountPrimordialBalanceAfter = await aotoken.primordialBalanceOf(account);
			var accountPrimordialStakedBalanceAfter = await aotoken.primordialStakedBalance(account, stakedContentAfter[4].toString());

			assert.equal(
				stakedContentAfter[2].toString(),
				stakedContentBefore[2].plus(networkAmount).toString(),
				"stakedContentById returns incorrect networkAmount"
			);
			assert.equal(
				stakedContentAfter[3].toString(),
				stakedContentBefore[3].plus(primordialAmount).toString(),
				"stakedContentById returns incorrect primordialAmount"
			);
			assert.equal(
				stakedContentAfter[4].toString(),
				primordialAmount ? accountWeightedMultiplierBefore.toString() : stakedContentBefore[4].toString(),
				"stakedContentById returns incorrect primordialWeightedMultiplier"
			);
			assert.equal(stakedContentAfter[6], true, "stakedContentById returns incorrect active status");

			assert.equal(
				accountBalanceAfter.toString(),
				accountBalanceBefore.minus(networkAmount).toString(),
				"account has incorrect balance after staking"
			);
			assert.equal(
				accountStakedBalanceAfter.toString(),
				accountStakedBalanceBefore.plus(networkAmount).toString(),
				"account has incorrect staked balance after staking"
			);
			assert.equal(
				accountWeightedMultiplierAfter.toString(),
				accountWeightedMultiplierBefore.toString(),
				"account has incorrect weighted multiplier after staking"
			);
			assert.equal(
				accountPrimordialBalanceAfter.toString(),
				accountPrimordialBalanceBefore.minus(primordialAmount).toString(),
				"account has incorrect primordial balance after staking"
			);
			assert.equal(
				accountPrimordialStakedBalanceAfter.toString(),
				accountPrimordialStakedBalanceBefore.plus(primordialAmount).toString(),
				"account has incorrect staked primordial balance after staking"
			);
		};

		before(async function() {
			// Let's give account1 some tokens
			await aotoken.mintToken(account1, 10 ** 9, { from: developer }); // 1,000,000,000 AO Token
			// Buy 2 lots so that we can test avg weighted multiplier
			await aotoken.buyPrimordialToken({ from: account1, value: 500000000000 });
			await aotoken.buyPrimordialToken({ from: account1, value: 500000000000 });

			// Let's give account2 some tokens
			await aotoken.mintToken(account2, 10 ** 9, { from: developer }); // 1,000,000,000 AO Token

			// Create Names
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

			// Create TAOs
			result = await taofactory.createTAO("somedathash", "somedatabase", "somekeyvalue", "somecontentid", nameId1, {
				from: account1
			});
			var createTAOEvent = result.logs[0];
			taoId1 = createTAOEvent.args.taoId;

			result = await taofactory.createTAO("somedathash", "somedatabase", "somekeyvalue", "somecontentid", taoId1, {
				from: account1
			});
			createTAOEvent = result.logs[0];
			taoId2 = createTAOEvent.args.taoId;

			result = await taofactory.createTAO("somedathash", "somedatabase", "somekeyvalue", "somecontentid", nameId2, {
				from: account2
			});
			createTAOEvent = result.logs[0];
			taoId3 = createTAOEvent.args.taoId;

			result = await taofactory.createTAO("somedathash", "somedatabase", "somekeyvalue", "somecontentid", nameId3, {
				from: account3
			});
			createTAOEvent = result.logs[0];
			taoId4 = createTAOEvent.args.taoId;
		});

		it("stakeAOContent() - should NOT stake content if params provided are not valid", async function() {
			var canStake;
			try {
				await aocontent.stakeAOContent(
					1,
					0,
					"mega",
					0,
					"",
					encChallenge,
					contentDatKey,
					metadataDatKey,
					fileSize,
					profitPercentage,
					{
						from: account1
					}
				);
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though it's missing baseChallenge");

			try {
				await aocontent.stakeAOContent(
					1,
					0,
					"mega",
					0,
					baseChallenge,
					"",
					contentDatKey,
					metadataDatKey,
					fileSize,
					profitPercentage,
					{ from: account1 }
				);
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though it's missing encChallenge");

			try {
				await aocontent.stakeAOContent(
					1,
					0,
					"mega",
					0,
					baseChallenge,
					encChallenge,
					"",
					metadataDatKey,
					fileSize,
					profitPercentage,
					{
						from: account1
					}
				);
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though it's missing contentDatKey");
			try {
				await aocontent.stakeAOContent(
					1,
					0,
					"mega",
					0,
					baseChallenge,
					encChallenge,
					contentDatKey,
					"",
					fileSize,
					profitPercentage,
					{
						from: account1
					}
				);
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though it's missing metadataDatKey");
			try {
				await aocontent.stakeAOContent(
					1,
					0,
					"mega",
					0,
					baseChallenge,
					encChallenge,
					contentDatKey,
					metadataDatKey,
					0,
					profitPercentage,
					{ from: account1 }
				);
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though fileSize is 0");
			try {
				await aocontent.stakeAOContent(
					1,
					0,
					"mega",
					0,
					baseChallenge,
					encChallenge,
					contentDatKey,
					metadataDatKey,
					fileSize,
					1100000,
					{ from: account1 }
				);
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though it's profitPercentage is > 100%");

			try {
				await aocontent.stakeAOContent(
					1,
					0,
					"kilo",
					100,
					baseChallenge,
					encChallenge,
					contentDatKey,
					metadataDatKey,
					fileSize,
					profitPercentage,
					{ from: account1 }
				);
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though staked amount is less than filesize");
		});

		it("stakeAOContent() - should NOT stake content if account does not have enough balance", async function() {
			var canStake;
			try {
				await aocontent.stakeAOContent(
					2,
					0,
					"giga",
					0,
					baseChallenge,
					encChallenge,
					contentDatKey,
					metadataDatKey,
					fileSize,
					700000,
					{ from: account3 }
				);
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account3 can stake more than available balance");
		});

		it("stakeAOContent() - should be able to stake content with only network tokens", async function() {
			var response = await stakeAOContent(account1, 5, 1000, "mega", 0);
			AOContent_contentId1 = response.contentId;
			AOContent_stakeId1 = response.stakeId;
			AOContent_contentHostId1 = response.contentHostId;
		});

		it("stakeAOContent() - should be able to stake content with only primordial tokens", async function() {
			var response = await stakeAOContent(account1, 0, 0, "", 1000100);
			AOContent_contentId2 = response.contentId;
			AOContent_stakeId2 = response.stakeId;
			AOContent_contentHostId2 = response.contentHostId;
		});

		it("stakeAOContent() - should be able to stake content with both network Tokens and primordial tokens", async function() {
			var response = await stakeAOContent(account1, 3, 100, "mega", 10000);
			AOContent_contentId3 = response.contentId;
			AOContent_stakeId3 = response.stakeId;
			AOContent_contentHostId3 = response.contentHostId;
		});

		it("stakeCreativeCommonsContent() - should NOT stake content if params provided are not valid", async function() {
			var canStake;
			try {
				await aocontent.stakeCreativeCommonsContent(1, 0, "mega", 0, "", encChallenge, contentDatKey, metadataDatKey, fileSize, {
					from: account1
				});
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though it's missing baseChallenge");

			try {
				await aocontent.stakeCreativeCommonsContent(1, 0, "mega", 0, baseChallenge, "", contentDatKey, metadataDatKey, fileSize, {
					from: account1
				});
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though it's missing encChallenge");

			try {
				await aocontent.stakeCreativeCommonsContent(1, 0, "mega", 0, baseChallenge, encChallenge, "", metadataDatKey, fileSize, {
					from: account1
				});
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though it's missing contentDatKey");
			try {
				await aocontent.stakeCreativeCommonsContent(1, 0, "mega", 0, baseChallenge, encChallenge, contentDatKey, "", fileSize, {
					from: account1
				});
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though it's missing metadataDatKey");
			try {
				await aocontent.stakeCreativeCommonsContent(
					1,
					0,
					"mega",
					0,
					baseChallenge,
					encChallenge,
					contentDatKey,
					metadataDatKey,
					0,
					{ from: account1 }
				);
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though fileSize is 0");

			try {
				await aocontent.stakeCreativeCommonsContent(
					1,
					0,
					"kilo",
					100,
					baseChallenge,
					encChallenge,
					contentDatKey,
					metadataDatKey,
					fileSize,
					{ from: account1 }
				);
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though staked amount is less than filesize");

			try {
				await aocontent.stakeCreativeCommonsContent(
					5,
					1000,
					"mega",
					0,
					baseChallenge,
					encChallenge,
					contentDatKey,
					metadataDatKey,
					fileSize,
					{ from: account1 }
				);
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake more than filesize");
		});

		it("stakeCreativeCommonsContent() - should NOT stake content if account does not have enough balance", async function() {
			var canStake;
			try {
				await aocontent.stakeCreativeCommonsContent(
					1,
					0,
					"mega",
					0,
					baseChallenge,
					encChallenge,
					contentDatKey,
					metadataDatKey,
					fileSize,
					{ from: account3 }
				);
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake more than available balance");
		});

		it("stakeCreativeCommonsContent() - should be able to stake content with only network tokens", async function() {
			var response = await stakeCreativeCommonsContent(account1, 1, 0, "mega", 0);
			CreativeCommons_contentId1 = response.contentId;
			CreativeCommons_stakeId1 = response.stakeId;
			CreativeCommons_contentHostId1 = response.contentHostId;
		});

		it("stakeCreativeCommonsContent() - should be able to stake content with only primordial tokens", async function() {
			var response = await stakeCreativeCommonsContent(account1, 0, 0, "", 1000000);
			CreativeCommons_contentId2 = response.contentId;
			CreativeCommons_stakeId2 = response.stakeId;
			CreativeCommons_contentHostId2 = response.contentHostId;
		});

		it("stakeCreativeCommonsContent() - should be able to stake content with both network Tokens and primordial tokens", async function() {
			var response = await stakeCreativeCommonsContent(account1, 0, 900000, "mega", 100000);
			CreativeCommons_contentId3 = response.contentId;
			CreativeCommons_stakeId3 = response.stakeId;
			CreativeCommons_contentHostId3 = response.contentHostId;
		});

		it("stakeTAOContent() - should NOT stake content if params provided are not valid", async function() {
			var canStake;
			try {
				await aocontent.stakeTAOContent(1, 0, "mega", 0, "", encChallenge, contentDatKey, metadataDatKey, fileSize, taoId1, {
					from: account1
				});
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though it's missing baseChallenge");

			try {
				await aocontent.stakeTAOContent(1, 0, "mega", 0, baseChallenge, "", contentDatKey, metadataDatKey, fileSize, taoId1, {
					from: account1
				});
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though it's missing encChallenge");

			try {
				await aocontent.stakeTAOContent(1, 0, "mega", 0, baseChallenge, encChallenge, "", metadataDatKey, fileSize, taoId1, {
					from: account1
				});
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though it's missing contentDatKey");
			try {
				await aocontent.stakeTAOContent(1, 0, "mega", 0, baseChallenge, encChallenge, contentDatKey, "", fileSize, taoId1, {
					from: account1
				});
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though it's missing metadataDatKey");
			try {
				await aocontent.stakeTAOContent(1, 0, "mega", 0, baseChallenge, encChallenge, contentDatKey, metadataDatKey, 0, taoId1, {
					from: account1
				});
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though fileSize is 0");

			try {
				await aocontent.stakeTAOContent(
					1,
					0,
					"kilo",
					100,
					baseChallenge,
					encChallenge,
					contentDatKey,
					metadataDatKey,
					fileSize,
					taoId1,
					{ from: account1 }
				);
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though staked amount is less than filesize");

			try {
				await aocontent.stakeTAOContent(
					1,
					0,
					"mega",
					0,
					baseChallenge,
					encChallenge,
					contentDatKey,
					metadataDatKey,
					fileSize,
					someAddress,
					{ from: account1 }
				);
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content with invalid TAO ID");

			try {
				await aocontent.stakeTAOContent(
					1,
					0,
					"mega",
					0,
					baseChallenge,
					encChallenge,
					contentDatKey,
					metadataDatKey,
					fileSize,
					taoId1,
					{ from: account2 }
				);
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "Non-Advocate/Listener/Speaker of The TAO ID can stake TAO content");

			try {
				await aocontent.stakeTAOContent(
					5,
					1000,
					"mega",
					0,
					baseChallenge,
					encChallenge,
					contentDatKey,
					metadataDatKey,
					fileSize,
					taoId1,
					{ from: account1 }
				);
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake more than filesize");
		});

		it("stakeTAOContent() - should NOT stake content if account does not have enough balance", async function() {
			var canStake;
			try {
				await aocontent.stakeTAOContent(
					1,
					0,
					"mega",
					0,
					baseChallenge,
					encChallenge,
					contentDatKey,
					metadataDatKey,
					fileSize,
					taoId4,
					{ from: account3 }
				);
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account3 can stake more than available balance");
		});

		it("stakeTAOContent() - should be able to stake content with only network tokens", async function() {
			var response = await stakeTAOContent(account1, 1, 0, "mega", 0, taoId1);
			TAOContent_contentId1 = response.contentId;
			TAOContent_stakeId1 = response.stakeId;
			TAOContent_contentHostId1 = response.contentHostId;
		});

		it("stakeTAOContent() - should be able to stake content with only primordial tokens", async function() {
			var response = await stakeTAOContent(account1, 0, 0, "", 1000000, taoId1);
			TAOContent_contentId2 = response.contentId;
			TAOContent_stakeId2 = response.stakeId;
			TAOContent_contentHostId2 = response.contentHostId;
		});

		it("stakeTAOContent() - should be able to stake content with both network Tokens and primordial tokens", async function() {
			var response = await stakeTAOContent(account1, 0, 900000, "mega", 100000, taoId1);
			TAOContent_contentId3 = response.contentId;
			TAOContent_stakeId3 = response.stakeId;
			TAOContent_contentHostId3 = response.contentHostId;
		});

		it("setProfitPercentage() - should NOT be able to set profit percentage on non-existing staked content", async function() {
			var canSetProfitPercentage;
			try {
				await aocontent.setProfitPercentage("someid", 100, { from: account1 });
				canSetProfitPercentage = true;
			} catch (e) {
				canSetProfitPercentage = false;
			}
			assert.notEqual(canSetProfitPercentage, true, "account1 can set profit percentage for non-existing staked content");
		});

		it("setProfitPercentage() - should NOT be able to set profit percentage if stake owner is not the same as sender", async function() {
			var setProfitPercentage = async function(stakeId) {
				var canSetProfitPercentage;
				try {
					await aocontent.setProfitPercentage(stakeId, 100, { from: account2 });
					canSetProfitPercentage = true;
				} catch (e) {
					canSetProfitPercentage = false;
				}
				assert.notEqual(canSetProfitPercentage, true, "Non-stake owner address can set profit percentage");
			};

			await setProfitPercentage(AOContent_stakeId1);
			await setProfitPercentage(AOContent_stakeId2);
			await setProfitPercentage(AOContent_stakeId3);
		});

		it("setProfitPercentage() - should NOT be able to set profit percentage if profit percentage is more than 100%", async function() {
			var setProfitPercentage = async function(stakeId) {
				var canSetProfitPercentage;
				try {
					await aocontent.setProfitPercentage(stakeId, 1100000, { from: account1 });
					canSetProfitPercentage = true;
				} catch (e) {
					canSetProfitPercentage = false;
				}
				assert.notEqual(canSetProfitPercentage, true, "account1 can set profit percentage more than its allowed value");
			};

			await setProfitPercentage(AOContent_stakeId1);
			await setProfitPercentage(AOContent_stakeId2);
			await setProfitPercentage(AOContent_stakeId3);
		});

		it("setProfitPercentage() - should be able to set profit percentage", async function() {
			var setProfitPercentage = async function(stakeId) {
				var canSetProfitPercentage;
				try {
					await aocontent.setProfitPercentage(stakeId, 800000, { from: account1 });
					canSetProfitPercentage = true;
				} catch (e) {
					canSetProfitPercentage = false;
				}
				assert.equal(canSetProfitPercentage, true, "account1 is unable to set profit percentage");

				var stakedContent = await aocontent.stakedContentById(stakeId);
				assert.equal(stakedContent[5].toNumber(), 800000, "StakedContent has incorrect profitPercentage after update");
			};

			await setProfitPercentage(AOContent_stakeId1);
			await setProfitPercentage(AOContent_stakeId2);
			await setProfitPercentage(AOContent_stakeId3);
		});

		it("setProfitPercentage() - should not be able to set profit percentage for non-AO Content, i.e Creative Commons/T(AO) Content", async function() {
			var setProfitPercentage = async function(stakeId) {
				var canSetProfitPercentage;
				try {
					await aocontent.setProfitPercentage(stakeId, 800000, { from: account1 });
					canSetProfitPercentage = true;
				} catch (e) {
					canSetProfitPercentage = false;
				}
				assert.notEqual(canSetProfitPercentage, true, "account1 is able to set profit percentage");
			};

			await setProfitPercentage(CreativeCommons_stakeId1);
			await setProfitPercentage(CreativeCommons_stakeId2);
			await setProfitPercentage(CreativeCommons_stakeId3);
			await setProfitPercentage(TAOContent_stakeId1);
			await setProfitPercentage(TAOContent_stakeId2);
			await setProfitPercentage(TAOContent_stakeId3);
		});

		it("setContentExtraData() - should NOT be able to set extraData on non-existing content", async function() {
			var canSetContentExtraData;
			try {
				await aocontent.setContentExtraData("someid", extraData, { from: account1 });
				canSetContentExtraData = true;
			} catch (e) {
				canSetContentExtraData = false;
			}
			assert.notEqual(canSetContentExtraData, true, "account1 can set extra data for non-existing content");
		});

		it("setContentExtraData() - should NOT be able to set extraData if content creator is not the same as sender", async function() {
			var setContentExtraData = async function(contentId) {
				var canSetContentExtraData;
				try {
					await aocontent.setContentExtraData(contentId, extraData, { from: account2 });
					canSetContentExtraData = true;
				} catch (e) {
					canSetContentExtraData = false;
				}
				assert.notEqual(canSetContentExtraData, true, "Non-content creator address can set content extra data");
			};

			await setContentExtraData(AOContent_contentId1);
			await setContentExtraData(AOContent_contentId2);
			await setContentExtraData(AOContent_contentId3);
			await setContentExtraData(CreativeCommons_contentId1);
			await setContentExtraData(CreativeCommons_contentId2);
			await setContentExtraData(CreativeCommons_contentId3);
			await setContentExtraData(TAOContent_contentId1);
			await setContentExtraData(TAOContent_contentId2);
			await setContentExtraData(TAOContent_contentId3);
		});

		it("setContentExtraData() - should be able to set extraData", async function() {
			var setContentExtraData = async function(contentId) {
				var canSetContentExtraData;
				try {
					await aocontent.setContentExtraData(contentId, extraData, { from: account1 });
					canSetContentExtraData = true;
				} catch (e) {
					canSetContentExtraData = false;
				}
				assert.equal(canSetContentExtraData, true, "Content creator address can's set content extra data");

				var content = await aocontent.contentById(contentId);
				assert.equal(content[8], extraData, "Content has incorrect extraData after update");
			};

			await setContentExtraData(AOContent_contentId1);
			await setContentExtraData(AOContent_contentId2);
			await setContentExtraData(AOContent_contentId3);
			await setContentExtraData(CreativeCommons_contentId1);
			await setContentExtraData(CreativeCommons_contentId2);
			await setContentExtraData(CreativeCommons_contentId3);
			await setContentExtraData(TAOContent_contentId1);
			await setContentExtraData(TAOContent_contentId2);
			await setContentExtraData(TAOContent_contentId3);
		});

		it("updateTAOContentState() - should NOT update TAO Content State if params provided are not valid", async function() {
			var signHash = EthCrypto.hash.keccak256([
				{
					type: "address",
					value: aocontent.address
				},
				{
					type: "bytes32",
					value: TAOContent_contentId1
				},
				{
					type: "address",
					value: taoId2
				},
				{
					type: "bytes32",
					value: taoContentState_acceptedToTAO
				}
			]);

			var signature = EthCrypto.sign(account1PrivateKey, signHash);
			var vrs = EthCrypto.vrs.fromString(signature);

			var canUpdateTAOContentState;
			try {
				await aocontent.updateTAOContentState("someid", taoId2, taoContentState_acceptedToTAO, vrs.v, vrs.r, vrs.s, {
					from: account1
				});
				canUpdateTAOContentState = true;
			} catch (e) {
				canUpdateTAOContentState = false;
			}
			assert.notEqual(canUpdateTAOContentState, true, "account1 can update TAO Content State for non-existing content");

			try {
				await aocontent.updateTAOContentState(AOContent_contentId1, taoId2, taoContentState_acceptedToTAO, vrs.v, vrs.r, vrs.s, {
					from: account1
				});
				canUpdateTAOContentState = true;
			} catch (e) {
				canUpdateTAOContentState = false;
			}
			assert.notEqual(canUpdateTAOContentState, true, "account1 can update TAO Content State for non-T(AO) content");

			try {
				await aocontent.updateTAOContentState(
					TAOContent_contentId1,
					someAddress,
					taoContentState_acceptedToTAO,
					vrs.v,
					vrs.r,
					vrs.s,
					{ from: account1 }
				);
				canUpdateTAOContentState = true;
			} catch (e) {
				canUpdateTAOContentState = false;
			}
			assert.notEqual(canUpdateTAOContentState, true, "account1 can update TAO Content State with invalid TAO");

			try {
				await aocontent.updateTAOContentState(TAOContent_contentId1, taoId2, "somestate", vrs.v, vrs.r, vrs.s, {
					from: account1
				});
				canUpdateTAOContentState = true;
			} catch (e) {
				canUpdateTAOContentState = false;
			}
			assert.notEqual(canUpdateTAOContentState, true, "account1 can update TAO Content State with invalid TAO Content State");

			try {
				await aocontent.updateTAOContentState(TAOContent_contentId1, taoId2, taoContentState_acceptedToTAO, 0, vrs.r, vrs.s, {
					from: account1
				});
				canUpdateTAOContentState = true;
			} catch (e) {
				canUpdateTAOContentState = false;
			}
			assert.notEqual(canUpdateTAOContentState, true, "account1 can update TAO Content State with missing v part of the signature");

			try {
				await aocontent.updateTAOContentState(TAOContent_contentId1, taoId2, taoContentState_acceptedToTAO, vrs.v, "", vrs.s, {
					from: account1
				});
				canUpdateTAOContentState = true;
			} catch (e) {
				canUpdateTAOContentState = false;
			}
			assert.notEqual(canUpdateTAOContentState, true, "account1 can update TAO Content State with missing r part of the signature");

			try {
				await aocontent.updateTAOContentState(TAOContent_contentId1, taoId2, taoContentState_acceptedToTAO, vrs.v, vrs.r, "", {
					from: account1
				});
				canUpdateTAOContentState = true;
			} catch (e) {
				canUpdateTAOContentState = false;
			}
			assert.notEqual(canUpdateTAOContentState, true, "account1 can update TAO Content State with missing s part of the signature");

			try {
				await aocontent.updateTAOContentState(TAOContent_contentId1, taoId2, taoContentState_acceptedToTAO, vrs.v, vrs.r, vrs.s, {
					from: account2
				});
				canUpdateTAOContentState = true;
			} catch (e) {
				canUpdateTAOContentState = false;
			}
			assert.notEqual(canUpdateTAOContentState, true, "other account can update TAO Content State using other's signature");

			signHash = EthCrypto.hash.keccak256([
				{
					type: "address",
					value: aocontent.address
				},
				{
					type: "bytes32",
					value: TAOContent_contentId1
				},
				{
					type: "address",
					value: taoId3
				},
				{
					type: "bytes32",
					value: taoContentState_acceptedToTAO
				}
			]);

			signature = EthCrypto.sign(account2PrivateKey, signHash);
			vrs = EthCrypto.vrs.fromString(signature);

			try {
				await aocontent.updateTAOContentState(TAOContent_contentId1, taoId3, taoContentState_acceptedToTAO, vrs.v, vrs.r, vrs.s, {
					from: account2
				});
				canUpdateTAOContentState = true;
			} catch (e) {
				canUpdateTAOContentState = false;
			}
			assert.notEqual(canUpdateTAOContentState, true, "Non-Advocate/Listener/Speaker of TAO ID can update TAO Content State");
		});

		it("updateTAOContentState() - should be able to update TAO Content State", async function() {
			var updateTAOContentState = async function(account, contentId, taoId, taoContentState, privateKey) {
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
				var vrs = EthCrypto.vrs.fromString(signature);

				var canUpdateTAOContentState, updateTAOContentStateEvent;
				try {
					var result = await aocontent.updateTAOContentState(contentId, taoId, taoContentState, vrs.v, vrs.r, vrs.s, {
						from: account
					});
					canUpdateTAOContentState = true;
					updateTAOContentStateEvent = result.logs[0];
				} catch (e) {
					canUpdateTAOContentState = false;
					updateTAOContentStateEvent = null;
				}
				assert.equal(canUpdateTAOContentState, true, "account can't update TAO Content State");

				assert.equal(updateTAOContentStateEvent.args.contentId, contentId, "UpdateTAOContent event has incorrect contentId");
				assert.equal(updateTAOContentStateEvent.args.taoId, taoId, "UpdateTAOContent event has incorrect taoId");
				assert.equal(updateTAOContentStateEvent.args.signer, account, "UpdateTAOContent event has incorrect signer");
				assert.equal(
					updateTAOContentStateEvent.args.taoContentState,
					taoContentState,
					"UpdateTAOContent event has incorrect taoContentState"
				);

				var content = await aocontent.contentById(contentId);
				assert.equal(content[4], taoContentState, "Content has incorrect taoContentState");
				assert.equal(content[5].toNumber(), vrs.v, "Content has incorrect updateTAOContentStateV");
				assert.equal(content[6], vrs.r, "Content has incorrect updateTAOContentStateR");
				assert.equal(content[7], vrs.s, "Content has incorrect updateTAOContentStateS");
			};
			await updateTAOContentState(account1, TAOContent_contentId1, taoId2, taoContentState_acceptedToTAO, account1PrivateKey);
			await updateTAOContentState(account1, TAOContent_contentId2, taoId2, taoContentState_pendingReview, account1PrivateKey);
			await updateTAOContentState(account1, TAOContent_contentId3, taoId2, taoContentState_acceptedToTAO, account1PrivateKey);
		});

		it("unstakePartialContent() - should NOT be able to partially unstake non-existing staked content", async function() {
			var canUnstakePartial;
			try {
				await aocontent.unstakePartialContent("someid", 10, 10, "kilo", 10, { from: account1 });
				canUnstakePartial = true;
			} catch (e) {
				canUnstakePartial = false;
			}
			assert.notEqual(canUnstakePartial, true, "account1 can partially unstake non-existing staked content");
		});

		it("unstakePartialContent() - should NOT be able to partially unstake existing staked content if stake owner is not the same as the sender", async function() {
			var unstakePartialContent = async function(
				stakeId,
				networkIntegerAmount,
				networkFractionAmount,
				denomination,
				primordialAmount
			) {
				var canUnstakePartial;
				try {
					await aocontent.unstakePartialContent(
						stakeId,
						networkIntegerAmount,
						networkFractionAmount,
						denomination,
						primordialAmount,
						{ from: account2 }
					);

					canUnstakePartial = true;
				} catch (e) {
					canUnstakePartial = false;
				}
				assert.notEqual(canUnstakePartial, true, "Non-stake owner address can partially unstake existing staked content");
			};

			await unstakePartialContent(AOContent_stakeId1, 10, 10, "kilo", 0);
			await unstakePartialContent(AOContent_stakeId2, 0, 0, "", 10);
			await unstakePartialContent(AOContent_stakeId3, 10, 10, "kilo", 10);
		});

		it("unstakePartialContent() - should NOT be able to partially unstake existing staked content if the requested unstake amount is more than the balance of the staked amount", async function() {
			var unstakePartialContent = async function(
				stakeId,
				networkIntegerAmount,
				networkFractionAmount,
				denomination,
				primordialAmount
			) {
				var canUnstakePartial;
				try {
					await aocontent.unstakePartialContent(
						stakeId,
						networkIntegerAmount,
						networkFractionAmount,
						denomination,
						primordialAmount,
						{ from: account1 }
					);

					canUnstakePartial = true;
				} catch (e) {
					canUnstakePartial = false;
				}
				assert.notEqual(canUnstakePartial, true, "Stake owner can partially unstake more tokens than it's existing balance.");
			};

			await unstakePartialContent(AOContent_stakeId1, 10, 10, "giga", 10000000);
			await unstakePartialContent(AOContent_stakeId2, 10, 10, "giga", 10000000);
			await unstakePartialContent(AOContent_stakeId3, 10, 10, "giga", 10000000);
		});

		it("unstakePartialContent() - should be able to partially unstake only network token from existing staked content", async function() {
			await unstakePartialContent(account1, AOContent_stakeId1, 10, 10, "kilo", 0);
			await unstakePartialContent(account1, AOContent_stakeId3, 10, 10, "kilo", 0);
		});

		it("unstakePartialContent() - should be able to partially unstake only primordial token from existing staked content", async function() {
			await unstakePartialContent(account1, AOContent_stakeId2, 0, 0, "", 100);
			await unstakePartialContent(account1, AOContent_stakeId3, 0, 0, "", 100);
		});

		it("unstakePartialContent() - should be able to partially unstake both network and primordial token from existing staked content", async function() {
			await unstakePartialContent(account1, AOContent_stakeId3, 10, 10, "kilo", 100);
		});

		it("unstakePartialContent() - should NOT be able to partially unstake existing non-AO Content, i.e Creative Commons/T(AO) Content", async function() {
			var unstakePartialContent = async function(
				stakeId,
				networkIntegerAmount,
				networkFractionAmount,
				denomination,
				primordialAmount
			) {
				var canUnstakePartial;
				try {
					await aocontent.unstakePartialContent(
						stakeId,
						networkIntegerAmount,
						networkFractionAmount,
						denomination,
						primordialAmount,
						{ from: account1 }
					);

					canUnstakePartial = true;
				} catch (e) {
					canUnstakePartial = false;
				}
				assert.notEqual(canUnstakePartial, true, "Stake owner can partially unstake non-AO Content.");
			};

			await unstakePartialContent(CreativeCommons_stakeId1, 1, 0, "kilo", 10);
			await unstakePartialContent(CreativeCommons_stakeId1, 1, 0, "kilo", 10);
			await unstakePartialContent(CreativeCommons_stakeId1, 1, 0, "kilo", 10);
			await unstakePartialContent(TAOContent_stakeId1, 1, 0, "kilo", 10);
			await unstakePartialContent(TAOContent_stakeId1, 1, 0, "kilo", 10);
			await unstakePartialContent(TAOContent_stakeId1, 1, 0, "kilo", 10);
		});

		it("unstakeContent() - should NOT be able to unstake non-existing staked content", async function() {
			var canUnstake;
			try {
				await aocontent.unstakeContent("someid", { from: account1 });
				canUnstake = true;
			} catch (e) {
				canUnstake = false;
			}
			assert.notEqual(canUnstake, true, "account1 can unstake non-existing staked content");
		});

		it("unstakeContent() - should NOT be able to unstake existing staked content if stake owner is not the same as the sender", async function() {
			var unstakeContent = async function(stakeId) {
				var canUnstake;
				try {
					await aocontent.unstakeContent(stakeId, { from: account2 });
					canUnstake = true;
				} catch (e) {
					canUnstake = false;
				}
				assert.notEqual(canUnstake, true, "Non-stake owner address can unstake existing staked content");
			};

			await unstakeContent(AOContent_stakeId1);
			await unstakeContent(AOContent_stakeId2);
			await unstakeContent(AOContent_stakeId3);

			await unstakeContent(CreativeCommons_stakeId1);
			await unstakeContent(CreativeCommons_stakeId2);
			await unstakeContent(CreativeCommons_stakeId3);

			await unstakeContent(TAOContent_stakeId1);
			await unstakeContent(TAOContent_stakeId2);
			await unstakeContent(TAOContent_stakeId3);
		});

		it("unstakeContent() - should be able to unstake existing staked content", async function() {
			var unstakeContent = async function(account, stakeId) {
				var stakedContentBefore = await aocontent.stakedContentById(stakeId);
				var accountBalanceBefore = await aotoken.balanceOf(account);
				var accountStakedBalanceBefore = await aotoken.stakedBalance(account);
				var accountWeightedMultiplierBefore = await aotoken.weightedMultiplierByAddress(account);
				var accountPrimordialBalanceBefore = await aotoken.primordialBalanceOf(account);
				var accountPrimordialStakedBalanceBefore = await aotoken.primordialStakedBalance(
					account,
					stakedContentBefore[4].toString()
				);

				var networkAmount = stakedContentBefore[2];
				var primordialAmount = stakedContentBefore[3];

				var canUnstake;
				try {
					await aocontent.unstakeContent(stakeId, { from: account });
					canUnstake = true;
				} catch (e) {
					canUnstake = false;
				}
				assert.equal(
					canUnstake,
					true,
					"Stake owner address unable to unstake network and primordial token from existing staked content"
				);

				var stakedContentAfter = await aocontent.stakedContentById(stakeId);
				var accountBalanceAfter = await aotoken.balanceOf(account);
				var accountStakedBalanceAfter = await aotoken.stakedBalance(account);
				var accountWeightedMultiplierAfter = await aotoken.weightedMultiplierByAddress(account);
				var accountPrimordialBalanceAfter = await aotoken.primordialBalanceOf(account);
				var accountPrimordialStakedBalanceAfter = await aotoken.primordialStakedBalance(account, stakedContentBefore[4].toString());

				assert.equal(stakedContentAfter[2].toString(), 0, "Staked content has incorrect networkAmount after unstaking");
				assert.equal(stakedContentAfter[3].toString(), 0, "Staked content has incorrect primordialAmount after unstaking");
				assert.equal(
					stakedContentAfter[4].toString(),
					0,
					"Staked content has incorrect primordialWeightedMultiplier after unstaking"
				);
				assert.equal(stakedContentAfter[6], false, "Staked content has incorrect status after unstaking");
				assert.equal(
					accountBalanceAfter.toString(),
					accountBalanceBefore.plus(networkAmount).toString(),
					"Account has incorrect balance after unstaking"
				);
				assert.equal(
					accountStakedBalanceAfter.toString(),
					accountStakedBalanceBefore.minus(networkAmount).toString(),
					"Account has incorrect staked balance after unstaking"
				);
				assert.equal(
					accountWeightedMultiplierAfter.toString(),
					accountWeightedMultiplierBefore.toString(),
					"Account has incorrect weighted multiplier after unstaking"
				);
				assert.equal(
					accountPrimordialBalanceAfter.toString(),
					accountPrimordialBalanceBefore.plus(primordialAmount).toString(),
					"Account has incorrect primordial balance after unstaking"
				);
				assert.equal(
					accountPrimordialStakedBalanceAfter.toString(),
					accountPrimordialStakedBalanceBefore.minus(primordialAmount).toString(),
					"Account has incorrect primordial staked balance after unstaking"
				);
			};

			await unstakeContent(account1, AOContent_stakeId1);
			await unstakeContent(account1, AOContent_stakeId2);
			await unstakeContent(account1, AOContent_stakeId3);

			await unstakeContent(account1, CreativeCommons_stakeId1);
			await unstakeContent(account1, CreativeCommons_stakeId2);
			await unstakeContent(account1, CreativeCommons_stakeId3);

			await unstakeContent(account1, TAOContent_stakeId1);
			await unstakeContent(account1, TAOContent_stakeId2);
			await unstakeContent(account1, TAOContent_stakeId3);
		});

		it("stakeExistingContent() - should NOT be able to stake non-existing staked content", async function() {
			var canStakeExisting;
			try {
				await aocontent.stakeExistingContent("someid", 5, 10, "mega", 10, { from: account1 });
				canStakeExisting = true;
			} catch (e) {
				canStakeExisting = false;
			}
			assert.notEqual(canStakeExisting, true, "account1 can stake non-existing staked content");
		});

		it("stakeExistingContent() - should NOT be able to stake existing staked content if the stake owner is not the same as the sender", async function() {
			var stakeExistingContent = async function(stakeId) {
				var canStakeExisting;
				try {
					await aocontent.stakeExistingContent(stakeId, 1, 0, "mega", 0, { from: account2 });
					canStakeExisting = true;
				} catch (e) {
					canStakeExisting = false;
				}
				assert.notEqual(canStakeExisting, true, "Non-stake owner address can stake existing staked content");
			};

			await stakeExistingContent(AOContent_stakeId1);
			await stakeExistingContent(AOContent_stakeId2);
			await stakeExistingContent(AOContent_stakeId3);
		});

		it("stakeExistingContent() - should not be able to stake less than file size", async function() {
			var stakeExistingContent = async function(
				stakeId,
				networkIntegerAmount,
				networkFractionAmount,
				denomination,
				primordialAmount
			) {
				var canStakeExisting;
				try {
					await aocontent.stakeExistingContent(
						stakeId,
						networkIntegerAmount,
						networkFractionAmount,
						denomination,
						primordialAmount,
						{ from: account1 }
					);
					canStakeExisting = true;
				} catch (e) {
					canStakeExisting = false;
				}
				assert.notEqual(canStakeExisting, true, "Stake owner can stake less than filesize");
			};

			await stakeExistingContent(AOContent_stakeId1, 30, 0, "ao", 0);
			await stakeExistingContent(AOContent_stakeId1, 0, 0, "", 30);
			await stakeExistingContent(AOContent_stakeId1, 30, 0, "ao", 30);

			await stakeExistingContent(CreativeCommons_stakeId1, 30, 0, "ao", 0);
			await stakeExistingContent(CreativeCommons_stakeId1, 0, 0, "", 30);
			await stakeExistingContent(CreativeCommons_stakeId1, 30, 0, "ao", 30);

			await stakeExistingContent(TAOContent_stakeId1, 30, 0, "ao", 0);
			await stakeExistingContent(TAOContent_stakeId1, 0, 0, "", 30);
			await stakeExistingContent(TAOContent_stakeId1, 30, 0, "ao", 30);
		});

		it("stakeExistingContent() - should not be able to stake more than file size for non-AO Content", async function() {
			var stakeExistingContent = async function(
				stakeId,
				networkIntegerAmount,
				networkFractionAmount,
				denomination,
				primordialAmount
			) {
				var canStakeExisting;
				try {
					await aocontent.stakeExistingContent(
						stakeId,
						networkIntegerAmount,
						networkFractionAmount,
						denomination,
						primordialAmount,
						{ from: account1 }
					);
					canStakeExisting = true;
				} catch (e) {
					canStakeExisting = false;
				}
				assert.notEqual(canStakeExisting, true, "Stake owner can stake more than filesize");
			};

			await stakeExistingContent(CreativeCommons_stakeId1, 3, 0, "mega", 0);
			await stakeExistingContent(CreativeCommons_stakeId1, 0, 0, "", 3000000);
			await stakeExistingContent(CreativeCommons_stakeId1, 30, 0, "mega", 30);

			await stakeExistingContent(TAOContent_stakeId1, 3, 0, "mega", 0);
			await stakeExistingContent(TAOContent_stakeId1, 0, 0, "", 3000000);
			await stakeExistingContent(TAOContent_stakeId1, 30, 0, "mega", 30);
		});

		it("stakeExistingContent() - should be able to stake only network tokens on existing staked content", async function() {
			await stakeExistingContent(account1, AOContent_stakeId1, 2, 0, "mega", 0);
			await stakeExistingContent(account1, AOContent_stakeId2, 1000, 100, "kilo", 0);
			await stakeExistingContent(account1, AOContent_stakeId3, 1, 0, "mega", 0);

			await stakeExistingContent(account1, CreativeCommons_stakeId1, 1, 0, "mega", 0);
			await stakeExistingContent(account1, CreativeCommons_stakeId2, 1, 0, "mega", 0);
			await stakeExistingContent(account1, CreativeCommons_stakeId3, 1000, 0, "kilo", 0);

			await stakeExistingContent(account1, TAOContent_stakeId1, 1, 0, "mega", 0);
			await stakeExistingContent(account1, TAOContent_stakeId2, 1, 0, "mega", 0);
			await stakeExistingContent(account1, TAOContent_stakeId3, 1000, 0, "kilo", 0);

			// unstake them again for next test
			await aocontent.unstakeContent(AOContent_stakeId1, { from: account1 });
			await aocontent.unstakeContent(AOContent_stakeId2, { from: account1 });
			await aocontent.unstakeContent(AOContent_stakeId3, { from: account1 });

			await aocontent.unstakeContent(CreativeCommons_stakeId1, { from: account1 });
			await aocontent.unstakeContent(CreativeCommons_stakeId2, { from: account1 });
			await aocontent.unstakeContent(CreativeCommons_stakeId3, { from: account1 });

			await aocontent.unstakeContent(TAOContent_stakeId1, { from: account1 });
			await aocontent.unstakeContent(TAOContent_stakeId2, { from: account1 });
			await aocontent.unstakeContent(TAOContent_stakeId3, { from: account1 });
		});

		it("stakeExistingContent() - should be able to stake only primordial tokens on existing staked content", async function() {
			await stakeExistingContent(account1, AOContent_stakeId1, 0, 0, "", 1000100);
			await stakeExistingContent(account1, AOContent_stakeId2, 0, 0, "", 2000000);
			await stakeExistingContent(account1, AOContent_stakeId3, 0, 0, "", 1000000);

			await stakeExistingContent(account1, CreativeCommons_stakeId1, 0, 0, "", 1000000);
			await stakeExistingContent(account1, CreativeCommons_stakeId2, 0, 0, "", 1000000);
			await stakeExistingContent(account1, CreativeCommons_stakeId3, 0, 0, "", 1000000);

			await stakeExistingContent(account1, TAOContent_stakeId1, 0, 0, "", 1000000);
			await stakeExistingContent(account1, TAOContent_stakeId2, 0, 0, "", 1000000);
			await stakeExistingContent(account1, TAOContent_stakeId3, 0, 0, "", 1000000);

			// unstake them again for next test
			await aocontent.unstakeContent(AOContent_stakeId1, { from: account1 });
			await aocontent.unstakeContent(AOContent_stakeId2, { from: account1 });
			await aocontent.unstakeContent(AOContent_stakeId3, { from: account1 });

			await aocontent.unstakeContent(CreativeCommons_stakeId1, { from: account1 });
			await aocontent.unstakeContent(CreativeCommons_stakeId2, { from: account1 });
			await aocontent.unstakeContent(CreativeCommons_stakeId3, { from: account1 });

			await aocontent.unstakeContent(TAOContent_stakeId1, { from: account1 });
			await aocontent.unstakeContent(TAOContent_stakeId2, { from: account1 });
			await aocontent.unstakeContent(TAOContent_stakeId3, { from: account1 });
		});

		it("stakeExistingContent() - should be able to stake both network and primordial tokens on existing staked content", async function() {
			await stakeExistingContent(account1, AOContent_stakeId1, 2, 10, "kilo", 1000000);
			await stakeExistingContent(account1, AOContent_stakeId2, 1, 0, "mega", 10);
			await stakeExistingContent(account1, AOContent_stakeId3, 0, 900000, "mega", 110000);

			var networkAmount = await aotreasury.toBase(2, 10, "kilo");
			AOContent_contentHostPrice1 = networkAmount.add(1000000);
			networkAmount = await aotreasury.toBase(1, 0, "mega");
			AOContent_contentHostPrice2 = networkAmount.add(10);
			networkAmount = await aotreasury.toBase(0, 900000, "mega");
			AOContent_contentHostPrice3 = networkAmount.add(110000);

			// Should be able to stake again on active staked content
			await stakeExistingContent(account1, AOContent_stakeId1, 0, 500, "kilo", 0);
			await stakeExistingContent(account1, AOContent_stakeId2, 0, 10, "mega", 1000);
			await stakeExistingContent(account1, AOContent_stakeId3, 100, 0, "ao", 100);

			networkAmount = await aotreasury.toBase(0, 500, "kilo");
			AOContent_contentHostPrice1 = AOContent_contentHostPrice1.add(networkAmount);
			networkAmount = await aotreasury.toBase(0, 10, "mega");
			AOContent_contentHostPrice2 = AOContent_contentHostPrice2.add(networkAmount).add(1000);
			networkAmount = await aotreasury.toBase(100, 0, "ao");
			AOContent_contentHostPrice3 = AOContent_contentHostPrice3.add(networkAmount).add(100);

			await stakeExistingContent(account1, CreativeCommons_stakeId1, 0, 900000, "mega", 100000);
			await stakeExistingContent(account1, CreativeCommons_stakeId2, 0, 500000, "mega", 500000);
			await stakeExistingContent(account1, CreativeCommons_stakeId3, 0, 300000, "mega", 700000);

			await stakeExistingContent(account1, TAOContent_stakeId1, 0, 900000, "mega", 100000);
			await stakeExistingContent(account1, TAOContent_stakeId2, 0, 500000, "mega", 500000);
			await stakeExistingContent(account1, TAOContent_stakeId3, 0, 300000, "mega", 700000);
		});

		it("contentHostPrice() - should be able to return the price of a content hosted by a host", async function() {
			var getContentHostPrice;
			try {
				await aocontent.contentHostPrice("someid");
				getContentHostPrice = true;
			} catch (e) {
				getContentHostPrice = false;
			}
			assert.notEqual(getContentHostPrice, true, "Contract can get price for non-existing contentHostID");

			var _AOContent_contentHostPrice1 = await aocontent.contentHostPrice(AOContent_contentHostId1);
			assert.equal(
				_AOContent_contentHostPrice1.toString(),
				AOContent_contentHostPrice1.toString(),
				"Content host has incorrect price"
			);

			var _AOContent_contentHostPrice2 = await aocontent.contentHostPrice(AOContent_contentHostId2);
			assert.equal(
				_AOContent_contentHostPrice2.toString(),
				AOContent_contentHostPrice2.toString(),
				"Content host has incorrect price"
			);

			var _AOContent_contentHostPrice3 = await aocontent.contentHostPrice(AOContent_contentHostId3);
			assert.equal(
				_AOContent_contentHostPrice3.toString(),
				AOContent_contentHostPrice3.toString(),
				"Content host has incorrect price"
			);

			CreativeCommons_contentHostPrice1 = await aocontent.contentHostPrice(CreativeCommons_contentHostId1);
			assert.equal(CreativeCommons_contentHostPrice1.toString(), fileSize, "Content host has incorrect price");

			CreativeCommons_contentHostPrice2 = await aocontent.contentHostPrice(CreativeCommons_contentHostId2);
			assert.equal(CreativeCommons_contentHostPrice2.toString(), fileSize, "Content host has incorrect price");

			CreativeCommons_contentHostPrice3 = await aocontent.contentHostPrice(CreativeCommons_contentHostId3);
			assert.equal(CreativeCommons_contentHostPrice3.toString(), fileSize, "Content host has incorrect price");

			TAOContent_contentHostPrice1 = await aocontent.contentHostPrice(TAOContent_contentHostId1);
			assert.equal(TAOContent_contentHostPrice1.toString(), fileSize, "Content host has incorrect price");

			TAOContent_contentHostPrice2 = await aocontent.contentHostPrice(TAOContent_contentHostId2);
			assert.equal(TAOContent_contentHostPrice2.toString(), fileSize, "Content host has incorrect price");

			TAOContent_contentHostPrice3 = await aocontent.contentHostPrice(TAOContent_contentHostId3);
			assert.equal(TAOContent_contentHostPrice3.toString(), fileSize, "Content host has incorrect price");
		});

		it("buyContent() - should NOT be able to buy content if sent tokens < price", async function() {
			var buyContent = async function(account, contentHostId, publicKey, publicAddress) {
				var canBuyContent;
				try {
					await aocontent.buyContent(contentHostId, 10, 0, "ao", publicKey, publicAddress, { from: account });
					canBuyContent = true;
				} catch (e) {
					canBuyContent = false;
				}
				assert.notEqual(canBuyContent, true, "Account can buy content even though sent tokens < price");
			};
			await buyContent(account2, AOContent_contentHostId1, account2LocalIdentity.publicKey, account2LocalIdentity.address);
			await buyContent(account2, AOContent_contentHostId2, account2LocalIdentity.publicKey, account2LocalIdentity.address);
			await buyContent(account2, AOContent_contentHostId3, account2LocalIdentity.publicKey, account2LocalIdentity.address);
		});

		it("buyContent() - should NOT be able to buy content if account does not have enough balance", async function() {
			var buyContent = async function(account, contentHostId, publicKey, publicAddress) {
				var canBuyContent;
				try {
					await aocontent.buyContent(contentHostId, 5, 0, "mega", publicKey, publicAddress, { from: account });
					canBuyContent = true;
				} catch (e) {
					canBuyContent = false;
				}
				assert.notEqual(canBuyContent, true, "Account can buy content even though account does not have enough balance");
			};
			await buyContent(account3, AOContent_contentHostId1, account3LocalIdentity.publicKey, account3LocalIdentity.address);
			await buyContent(account3, AOContent_contentHostId2, account3LocalIdentity.publicKey, account3LocalIdentity.address);
			await buyContent(account3, AOContent_contentHostId3, account3LocalIdentity.publicKey, account3LocalIdentity.address);
		});

		it("buyContent() - should be able to buy content and store all of the earnings of stake owner (content creator)/host/foundation in escrow", async function() {
			var buyContent = async function(
				account,
				stakeOwner,
				host,
				stakeId,
				contentHostId,
				publicKey,
				publicAddress,
				contentHostPrice,
				isAOContentUsageType
			) {
				var accountBalanceBefore = await aotoken.balanceOf(account);
				var stakeOwnerBalanceBefore = await aotoken.balanceOf(stakeOwner);
				var hostBalanceBefore = await aotoken.balanceOf(host);
				var foundationBalanceBefore = await aotoken.balanceOf(developer);

				var stakeOwnerNameId = await namefactory.ethAddressToNameId(stakeOwner);
				var hostNameId = await namefactory.ethAddressToNameId(host);

				var stakeOwnerPathosBalanceBefore = await pathos.balanceOf(stakeOwnerNameId);
				var hostAntiLogosBalanceBefore = await antilogos.balanceOf(hostNameId);

				var price = await aocontent.contentHostPrice(contentHostId);
				var stakedContent = await aocontent.stakedContentById(stakeId);
				var stakedNetworkAmount = stakedContent[2];
				var stakedPrimordialAmount = stakedContent[3];
				var stakedPrimordialWeightedMultiplier = stakedContent[4];
				var profitPercentage = stakedContent[5];

				var stakeOwnerEscrowedBalanceBefore = await aotoken.escrowedBalance(stakeOwner);
				var hostEscrowedBalanceBefore = await aotoken.escrowedBalance(host);
				var foundationEscrowedBalanceBefore = await aotoken.escrowedBalance(developer);

				var canBuyContent, buyContentEvent, purchaseReceipt, stakeEarning, hostEarning, foundationEarning;
				try {
					if (isAOContentUsageType) {
						var result = await aocontent.buyContent(contentHostId, 3, 0, "mega", publicKey, publicAddress, { from: account });
					} else {
						var result = await aocontent.buyContent(contentHostId, 0, 0, "", publicKey, publicAddress, { from: account });
					}
					canBuyContent = true;
					buyContentEvent = result.logs[0];
					purchaseId = buyContentEvent.args.purchaseId;
					purchaseReceipt = await aocontent.purchaseReceiptById(purchaseId);
					stakeEarning = await aoearning.stakeEarnings(stakeOwner, purchaseId);
					hostEarning = await aoearning.hostEarnings(host, purchaseId);
					foundationEarning = await aoearning.foundationEarnings(purchaseId);
				} catch (e) {
					canBuyContent = false;
					buyContentEvent = null;
					purchaseId = null;
					purchaseReceipt = null;
					stakeEarning = null;
					hostEarning = null;
					foundationEarning = null;
				}
				assert.equal(canBuyContent, true, "Account can't buy content even though sent tokens >= price");
				assert.notEqual(purchaseId, null, "Unable to determine the purchaseID from the log after buying content");

				assert.equal(purchaseReceipt[0], contentHostId, "Purchase receipt has incorrect content host ID");
				assert.equal(purchaseReceipt[1], account, "Purchase receipt has incorrect buyer address");
				assert.equal(
					purchaseReceipt[2].toString(),
					isAOContentUsageType ? contentHostPrice.toString() : 0,
					"Purchase receipt has incorrect paid network amount"
				);
				assert.equal(purchaseReceipt[3], publicKey, "Purchase receipt has incorrect public key");

				assert.equal(
					purchaseReceipt[4].toLowerCase(),
					publicAddress.toLowerCase(),
					"Purchase receipt has incorrect public address"
				);

				var accountBalanceAfter = await aotoken.balanceOf(account);
				var stakeOwnerBalanceAfter = await aotoken.balanceOf(stakeOwner);
				var hostBalanceAfter = await aotoken.balanceOf(host);
				var foundationBalanceAfter = await aotoken.balanceOf(developer);

				assert.equal(
					accountBalanceAfter.toString(),
					isAOContentUsageType ? accountBalanceBefore.minus(price).toString() : accountBalanceBefore.toString(),
					"Account has incorrect balance after buying content"
				);
				assert.equal(
					stakeOwnerBalanceAfter.toString(),
					stakeOwnerBalanceBefore.toString(),
					"Stake owner has incorrect balance after buying content"
				);
				assert.equal(hostBalanceAfter.toString(), hostBalanceBefore.toString(), "Host has incorrect balance after buying content");
				assert.equal(
					foundationBalanceAfter.toString(),
					foundationBalanceBefore.toString(),
					"Foundation has incorrect balance after buying content"
				);

				// Calculate stake owner/host payment earning
				var stakeOwnerPaymentEarning = isAOContentUsageType
					? parseInt(
							price
								.mul(profitPercentage)
								.div(percentageDivisor)
								.toString()
					  )
					: 0;
				var hostPaymentEarning = price.minus(stakeOwnerPaymentEarning);

				// Verify payment earning
				assert.equal(stakeEarning[0], purchaseId, "Stake earning has incorrect purchase ID");
				assert.equal(stakeEarning[1].toString(), stakeOwnerPaymentEarning, "Stake earning has incorrect paymentEarning amount");

				assert.equal(hostEarning[0], purchaseId, "Host earning has incorrect purchase ID");
				assert.equal(hostEarning[1].toString(), hostPaymentEarning, "Host earning has incorrect paymentEarning amount");

				assert.equal(foundationEarning[0], purchaseId, "Foundation earning has incorrect purchase ID");
				assert.equal(foundationEarning[1].toString(), 0, "Foundation earning has incorrect paymentEarning amount");

				// Calculate inflation bonus
				var networkBonus = parseInt(stakedNetworkAmount.times(inflationRate).div(percentageDivisor));

				var primordialBonus = parseInt(
					stakedPrimordialAmount
						.times(stakedPrimordialWeightedMultiplier)
						.div(multiplierDivisor)
						.times(inflationRate)
						.div(percentageDivisor)
				);
				var inflationBonus = networkBonus + primordialBonus;

				// Calculate stake owner/host/foundation inflation bonus
				var stakeOwnerInflationBonus = isAOContentUsageType
					? parseInt(profitPercentage.times(inflationBonus).div(percentageDivisor))
					: 0;
				var hostInflationBonus = inflationBonus - stakeOwnerInflationBonus;
				var foundationInflationBonus = parseInt(foundationCut.times(inflationBonus).div(percentageDivisor));

				// Verify inflation bonus
				assert.equal(stakeEarning[2].toString(), stakeOwnerInflationBonus, "Stake earning has incorrect inflationBonus amount");
				assert.equal(hostEarning[2].toString(), hostInflationBonus, "Host earning has incorrect inflationBonus amount");
				assert.equal(
					foundationEarning[2].toString(),
					foundationInflationBonus,
					"Foundation earning has incorrect inflationBonus amount"
				);

				// Verify escrowed balance
				var stakeOwnerEscrowedBalanceAfter = await aotoken.escrowedBalance(stakeOwner);
				var hostEscrowedBalanceAfter = await aotoken.escrowedBalance(host);
				var foundationEscrowedBalanceAfter = await aotoken.escrowedBalance(developer);

				// since the stake owner and the host are the same
				assert.equal(
					stakeOwnerEscrowedBalanceAfter.toString(),
					stakeOwnerEscrowedBalanceBefore
						.add(price)
						.add(inflationBonus)
						.toString(),
					"Stake owner/host has incorrect escrowed balance"
				);
				assert.equal(
					foundationEscrowedBalanceAfter.toString(),
					foundationEscrowedBalanceBefore.add(foundationInflationBonus).toString(),
					"Foundation has incorrect escrowed balance"
				);

				try {
					var result = await aocontent.buyContent(contentHostId, 3, 0, "mega", publicKey, publicAddress, { from: account });
					canBuyContent = true;
				} catch (e) {
					canBuyContent = false;
				}
				assert.notEqual(canBuyContent, true, "Account can buy the same content more than once");

				// Verify TAO Currencies balance
				var stakeOwnerPathosBalanceAfter = await pathos.balanceOf(stakeOwnerNameId);
				var hostAntiLogosBalanceAfter = await antilogos.balanceOf(hostNameId);

				assert.equal(
					stakeOwnerPathosBalanceAfter.toString(),
					stakeOwnerPathosBalanceBefore.plus(price).toString(),
					"Stake owner has incorrect Pathos balance"
				);
				assert.equal(
					hostAntiLogosBalanceAfter.toString(),
					hostAntiLogosBalanceBefore.plus(fileSize).toString(),
					"Host has incorrect AntiLogos balance"
				);

				return purchaseId;
			};

			AOContent_purchaseId1 = await buyContent(
				account2,
				account1,
				account1,
				AOContent_stakeId1,
				AOContent_contentHostId1,
				account2LocalIdentity.publicKey,
				account2LocalIdentity.address,
				AOContent_contentHostPrice1,
				true
			);
			AOContent_purchaseId2 = await buyContent(
				account2,
				account1,
				account1,
				AOContent_stakeId2,
				AOContent_contentHostId2,
				account2LocalIdentity.publicKey,
				account2LocalIdentity.address,
				AOContent_contentHostPrice2,
				true
			);
			AOContent_purchaseId3 = await buyContent(
				account2,
				account1,
				account1,
				AOContent_stakeId3,
				AOContent_contentHostId3,
				account2LocalIdentity.publicKey,
				account2LocalIdentity.address,
				AOContent_contentHostPrice3,
				true
			);

			CreativeCommons_purchaseId1 = await buyContent(
				account2,
				account1,
				account1,
				CreativeCommons_stakeId1,
				CreativeCommons_contentHostId1,
				account2LocalIdentity.publicKey,
				account2LocalIdentity.address,
				CreativeCommons_contentHostPrice1,
				false
			);
			CreativeCommons_purchaseId2 = await buyContent(
				account2,
				account1,
				account1,
				CreativeCommons_stakeId2,
				CreativeCommons_contentHostId2,
				account2LocalIdentity.publicKey,
				account2LocalIdentity.address,
				CreativeCommons_contentHostPrice2,
				false
			);
			CreativeCommons_purchaseId3 = await buyContent(
				account2,
				account1,
				account1,
				CreativeCommons_stakeId3,
				CreativeCommons_contentHostId3,
				account2LocalIdentity.publicKey,
				account2LocalIdentity.address,
				CreativeCommons_contentHostPrice3,
				false
			);

			TAOContent_purchaseId1 = await buyContent(
				account2,
				account1,
				account1,
				TAOContent_stakeId1,
				TAOContent_contentHostId1,
				account2LocalIdentity.publicKey,
				account2LocalIdentity.address,
				TAOContent_contentHostPrice1,
				false
			);
			TAOContent_purchaseId2 = await buyContent(
				account2,
				account1,
				account1,
				TAOContent_stakeId2,
				TAOContent_contentHostId2,
				account2LocalIdentity.publicKey,
				account2LocalIdentity.address,
				TAOContent_contentHostPrice2,
				false
			);
			TAOContent_purchaseId3 = await buyContent(
				account2,
				account1,
				account1,
				TAOContent_stakeId3,
				TAOContent_contentHostId3,
				account2LocalIdentity.publicKey,
				account2LocalIdentity.address,
				TAOContent_contentHostPrice3,
				false
			);
		});

		it("becomeHost() - should NOT be able to become host if params provided are not valid", async function() {
			var canBecomeHost;
			var signHash = EthCrypto.hash.keccak256([
				{
					type: "address",
					value: aocontent.address
				},
				{
					type: "string",
					value: baseChallenge
				}
			]);

			var signature = EthCrypto.sign(account2PrivateKey, signHash);

			var vrs = EthCrypto.vrs.fromString(signature);

			try {
				await aocontent.becomeHost(
					"someid",
					vrs.v,
					vrs.r,
					vrs.s,
					account2EncChallenge,
					account2ContentDatKey,
					account2MetadataDatKey,
					{ from: account2 }
				);
				canBecomeHost = true;
			} catch (e) {
				canBecomeHost = false;
			}
			assert.notEqual(canBecomeHost, true, "Account can become host of content of an unknown purchase ID");

			try {
				await aocontent.becomeHost(
					AOContent_purchaseId1,
					0,
					vrs.r,
					vrs.s,
					account2EncChallenge,
					account2ContentDatKey,
					account2MetadataDatKey,
					{ from: account2 }
				);
				canBecomeHost = true;
			} catch (e) {
				canBecomeHost = false;
			}
			assert.notEqual(
				canBecomeHost,
				true,
				"Account can become host of content even though it's missing part of the base challenge signature"
			);

			try {
				await aocontent.becomeHost(
					AOContent_purchaseId1,
					vrs.v,
					"",
					vrs.s,
					account2EncChallenge,
					account2ContentDatKey,
					account2MetadataDatKey,
					{ from: account2 }
				);
				canBecomeHost = true;
			} catch (e) {
				canBecomeHost = false;
			}
			assert.notEqual(
				canBecomeHost,
				true,
				"Account can become host of content even though it's missing part of the base challenge signature"
			);

			try {
				await aocontent.becomeHost(
					AOContent_purchaseId1,
					vrs.v,
					vrs.r,
					"",
					account2EncChallenge,
					account2ContentDatKey,
					account2MetadataDatKey,
					{ from: account2 }
				);
				canBecomeHost = true;
			} catch (e) {
				canBecomeHost = false;
			}
			assert.notEqual(
				canBecomeHost,
				true,
				"Account can become host of content even though it's missing part of the base challenge signature"
			);

			try {
				await aocontent.becomeHost(AOContent_purchaseId1, vrs.v, vrs.r, vrs.s, "", account2ContentDatKey, account2MetadataDatKey, {
					from: account2
				});
				canBecomeHost = true;
			} catch (e) {
				canBecomeHost = false;
			}
			assert.notEqual(
				canBecomeHost,
				true,
				"Account can become host of content even though it's missing the encrypted challenge string"
			);

			try {
				await aocontent.becomeHost(AOContent_purchaseId1, vrs.v, vrs.r, vrs.s, account2EncChallenge, "", account2MetadataDatKey, {
					from: account2
				});
				canBecomeHost = true;
			} catch (e) {
				canBecomeHost = false;
			}
			assert.notEqual(canBecomeHost, true, "Account can become host of content even though it's missing the content dat key");

			try {
				await aocontent.becomeHost(AOContent_purchaseId1, vrs.v, vrs.r, vrs.s, account2EncChallenge, account2ContentDatKey, "", {
					from: account2
				});
				canBecomeHost = true;
			} catch (e) {
				canBecomeHost = false;
			}
			assert.notEqual(canBecomeHost, true, "Account can become host of content even though it's missing the metadata dat key");

			try {
				await aocontent.becomeHost(
					AOContent_purchaseId1,
					vrs.v,
					vrs.r,
					vrs.s,
					account2EncChallenge,
					account2ContentDatKey,
					account2MetadataDatKey,
					{ from: account1 }
				);
				canBecomeHost = true;
			} catch (e) {
				canBecomeHost = false;
			}
			assert.notEqual(canBecomeHost, true, "Account can become host of content of a purchase receipt owned by others");
		});

		it("becomeHost() (stake owner and host are the same address) - should be able to become host and release all the escrowed earnings for stake owner (content creator)/host/foundation", async function() {
			var becomeHost = async function(
				account,
				privateKey,
				stakeOwner,
				host,
				purchaseId,
				contentId,
				stakeId,
				contentHostId,
				encChallenge,
				contentDatKey,
				metadataDatKey
			) {
				var signHash = EthCrypto.hash.keccak256([
					{
						type: "address",
						value: aocontent.address
					},
					{
						type: "string",
						value: baseChallenge
					}
				]);

				var signature = EthCrypto.sign(privateKey, signHash);

				var vrs = EthCrypto.vrs.fromString(signature);

				var stakeOwnerBalanceBefore = await aotoken.balanceOf(stakeOwner);
				var hostBalanceBefore = await aotoken.balanceOf(host);
				var foundationBalanceBefore = await aotoken.balanceOf(developer);

				var stakeOwnerEscrowedBalanceBefore = await aotoken.escrowedBalance(stakeOwner);
				var hostEscrowedBalanceBefore = await aotoken.escrowedBalance(host);
				var foundationEscrowedBalanceBefore = await aotoken.escrowedBalance(developer);

				var stakeEarningBefore = await aoearning.stakeEarnings(stakeOwner, purchaseId);
				var hostEarningBefore = await aoearning.hostEarnings(host, purchaseId);
				var foundationEarningBefore = await aoearning.foundationEarnings(purchaseId);

				var totalStakeContentEarningBefore = await aoearning.totalStakeContentEarning();
				var totalHostContentEarningBefore = await aoearning.totalHostContentEarning();
				var totalFoundationEarningBefore = await aoearning.totalFoundationEarning();
				var stakeContentEarningBefore = await aoearning.stakeContentEarning(stakeOwner);
				var hostContentEarningBefore = await aoearning.hostContentEarning(host);
				var networkPriceEarningBefore = await aoearning.networkPriceEarning(stakeOwner);
				var contentPriceEarningBefore = await aoearning.contentPriceEarning(stakeOwner);
				var inflationBonusAccruedBefore = await aoearning.inflationBonusAccrued(host);

				var totalStakedContentStakeEarningBefore = await aoearning.totalStakedContentStakeEarning(stakeId);
				var totalStakedContentHostEarningBefore = await aoearning.totalStakedContentHostEarning(stakeId);
				var totalStakedContentFoundationEarningBefore = await aoearning.totalStakedContentFoundationEarning(stakeId);
				var totalHostContentEarningByIdBefore = await aoearning.totalHostContentEarningById(contentHostId);

				var canBecomeHost, hostContentEvent, contentHost;
				try {
					var result = await aocontent.becomeHost(purchaseId, vrs.v, vrs.r, vrs.s, encChallenge, contentDatKey, metadataDatKey, {
						from: account
					});
					canBecomeHost = true;

					hostContentEvent = result.logs[0];
					newContentHostId = hostContentEvent.args.contentHostId;
					contentHost = await aocontent.contentHostById(newContentHostId);
				} catch (e) {
					canBecomeHost = false;
					hostContentEvent = null;
					newContentHostId = null;
				}
				assert.equal(canBecomeHost, true, "Account fails becoming host of the content");

				// Verify the content host object
				assert.equal(contentHost[0], stakeId, "Content host has incorrect stake ID");
				assert.equal(contentHost[1], account, "Content host has incorrect host");
				assert.equal(contentHost[2], contentDatKey, "Content host has incorrect content dat key");
				assert.equal(contentHost[3], metadataDatKey, "Content host has incorrect metadata dat key");

				var stakeOwnerBalanceAfter = await aotoken.balanceOf(stakeOwner);
				var hostBalanceAfter = await aotoken.balanceOf(host);
				var foundationBalanceAfter = await aotoken.balanceOf(developer);

				var stakeOwnerEscrowedBalanceAfter = await aotoken.escrowedBalance(stakeOwner);
				var hostEscrowedBalanceAfter = await aotoken.escrowedBalance(host);
				var foundationEscrowedBalanceAfter = await aotoken.escrowedBalance(developer);

				var stakeEarningAfter = await aoearning.stakeEarnings(stakeOwner, purchaseId);
				var hostEarningAfter = await aoearning.hostEarnings(host, purchaseId);
				var foundationEarningAfter = await aoearning.foundationEarnings(purchaseId);

				var totalStakeContentEarningAfter = await aoearning.totalStakeContentEarning();
				var totalHostContentEarningAfter = await aoearning.totalHostContentEarning();
				var totalFoundationEarningAfter = await aoearning.totalFoundationEarning();
				var stakeContentEarningAfter = await aoearning.stakeContentEarning(stakeOwner);
				var hostContentEarningAfter = await aoearning.hostContentEarning(host);
				var networkPriceEarningAfter = await aoearning.networkPriceEarning(stakeOwner);
				var contentPriceEarningAfter = await aoearning.contentPriceEarning(stakeOwner);
				var inflationBonusAccruedAfter = await aoearning.inflationBonusAccrued(stakeOwner);

				var totalStakedContentStakeEarningAfter = await aoearning.totalStakedContentStakeEarning(stakeId);
				var totalStakedContentHostEarningAfter = await aoearning.totalStakedContentHostEarning(stakeId);
				var totalStakedContentFoundationEarningAfter = await aoearning.totalStakedContentFoundationEarning(stakeId);
				var totalHostContentEarningByIdAfter = await aoearning.totalHostContentEarningById(contentHostId);

				// Verify the earning
				assert.equal(stakeEarningAfter[0], purchaseId, "Stake earning has incorrect purchaseId");
				assert.equal(
					stakeEarningAfter[1].toString(),
					0,
					"Stake earning has incorrect paymentEarning after request node become host"
				);
				assert.equal(
					stakeEarningAfter[2].toString(),
					0,
					"Stake earning has incorrect inflationBonus after request node become host"
				);

				assert.equal(hostEarningAfter[0], purchaseId, "Host earning has incorrect purchaseId");
				assert.equal(hostEarningAfter[1].toString(), 0, "Host earning has incorrect paymentEarning after request node become host");
				assert.equal(hostEarningAfter[2].toString(), 0, "Host earning has incorrect inflationBonus after request node become host");

				assert.equal(foundationEarningAfter[0], purchaseId, "Foundation earning has incorrect purchaseId");
				assert.equal(
					foundationEarningAfter[1].toString(),
					0,
					"Foundation earning has incorrect paymentEarning after request node become host"
				);
				assert.equal(
					foundationEarningAfter[2].toString(),
					0,
					"Foundation earning has incorrect inflationBonus after request node become host"
				);

				// Verify the balance
				// Since stake owner and host are the same
				assert.equal(
					stakeOwnerBalanceAfter.toString(),
					stakeOwnerBalanceBefore
						.plus(stakeEarningBefore[1])
						.plus(stakeEarningBefore[2])
						.plus(hostEarningBefore[1])
						.plus(hostEarningBefore[2])
						.toString(),
					"Stake owner/host has incorrect balance after request node become host"
				);
				assert.equal(
					foundationBalanceAfter.toString(),
					foundationBalanceBefore.plus(foundationEarningBefore[2]).toString(),
					"Foundation has incorrect balance after request node become host"
				);

				// Verify the escrowed balance
				// since stake owner and host are the same
				assert.equal(
					stakeOwnerEscrowedBalanceAfter.toString(),
					stakeOwnerEscrowedBalanceBefore
						.minus(stakeEarningBefore[1])
						.minus(stakeEarningBefore[2])
						.minus(hostEarningBefore[1])
						.minus(hostEarningBefore[2])
						.toString(),
					"Stake owner/host has incorrect escrowed balance after request node become host"
				);
				assert.equal(
					foundationEscrowedBalanceAfter.toString(),
					foundationEscrowedBalanceBefore.minus(foundationEarningBefore[2]).toString(),
					"Foundation has incorrect escrowed balance after request node become host"
				);

				// Verify global variables earnings
				assert.equal(
					totalStakeContentEarningAfter.toString(),
					totalStakeContentEarningBefore
						.plus(stakeEarningBefore[1])
						.plus(stakeEarningBefore[2])
						.toString(),
					"Contract has incorrect totalStakeContentEarning"
				);
				assert.equal(
					totalHostContentEarningAfter.toString(),
					totalHostContentEarningBefore
						.plus(hostEarningBefore[1])
						.plus(hostEarningBefore[2])
						.toString(),
					"Contract has incorrect totalHostContentEarning"
				);
				assert.equal(
					totalFoundationEarningAfter.toString(),
					totalFoundationEarningBefore.plus(foundationEarningBefore[2]).toString(),
					"Contract has incorrect totalFoundationEarning"
				);
				assert.equal(
					stakeContentEarningAfter.toString(),
					stakeContentEarningBefore
						.plus(stakeEarningBefore[1])
						.plus(stakeEarningBefore[2])
						.toString(),
					"Contract has incorrect stakeContentEarning for stakeOwner"
				);
				assert.equal(
					hostContentEarningAfter.toString(),
					hostContentEarningBefore
						.plus(hostEarningBefore[1])
						.plus(hostEarningBefore[2])
						.toString(),
					"Contract has incorrect hostContentEarning for host"
				);

				var stakedContent = await aocontent.stakedContentById(stakeId);
				var content = await aocontent.contentById(contentId);
				if (stakedContent[2].plus(stakedContent[3]).gt(content[1])) {
					assert.equal(
						networkPriceEarningAfter.toString(),
						networkPriceEarningBefore.toString(),
						"Contract has incorrect networkPriceEarning"
					);

					// Since stakeOwner/host are the same
					assert.equal(
						contentPriceEarningAfter.toString(),
						contentPriceEarningBefore
							.plus(stakeEarningBefore[1])
							.plus(stakeEarningBefore[2])
							.plus(hostEarningBefore[1])
							.plus(hostEarningBefore[2])
							.toString(),
						"Contract has incorrect contentPriceEarning for stake owner/host"
					);
				} else {
					assert.equal(
						networkPriceEarningAfter.toString(),
						networkPriceEarningBefore
							.plus(stakeEarningBefore[1])
							.plus(stakeEarningBefore[2])
							.plus(hostEarningBefore[1])
							.plus(hostEarningBefore[2])
							.toString(),
						"Contract has incorrect networkPriceEarning"
					);

					// Since stakeOwner/host are the same
					assert.equal(
						contentPriceEarningAfter.toString(),
						contentPriceEarningBefore.toString(),
						"Contract has incorrect contentPriceEarning for stake owner/host"
					);
				}
				assert.equal(
					inflationBonusAccruedAfter.toString(),
					inflationBonusAccruedBefore
						.plus(stakeEarningBefore[2])
						.plus(hostEarningBefore[2])
						.toString(),
					"Contract has incorrect inflationBonusAccrued for stake owner/host"
				);

				assert.equal(
					totalStakedContentStakeEarningAfter.toString(),
					totalStakedContentStakeEarningBefore
						.plus(stakeEarningBefore[1])
						.plus(stakeEarningBefore[2])
						.toString(),
					"Staked content has incorrect totalStakedContentStakeEarning value"
				);
				assert.equal(
					totalStakedContentHostEarningAfter.toString(),
					totalStakedContentHostEarningBefore
						.plus(hostEarningBefore[1])
						.plus(hostEarningBefore[2])
						.toString(),
					"Staked content has incorrect totalStakedContentHostEarning value"
				);
				assert.equal(
					totalStakedContentFoundationEarningAfter.toString(),
					totalStakedContentFoundationEarningBefore.plus(foundationEarningBefore[2]).toString(),
					"Staked content has incorrect totalStakedContentFoundationEarning value"
				);
				assert.equal(
					totalHostContentEarningByIdAfter.toString(),
					totalHostContentEarningByIdBefore
						.plus(hostEarningBefore[1])
						.plus(hostEarningBefore[2])
						.toString(),
					"Content Host ID has incorrect total earning value"
				);

				return newContentHostId;
			};

			AOContent_contentHostId4 = await becomeHost(
				account2,
				account2PrivateKey,
				account1,
				account1,
				AOContent_purchaseId1,
				AOContent_contentId1,
				AOContent_stakeId1,
				AOContent_contentHostId1,
				account2EncChallenge,
				account2ContentDatKey,
				account2MetadataDatKey
			);
			AOContent_contentHostId5 = await becomeHost(
				account2,
				account2PrivateKey,
				account1,
				account1,
				AOContent_purchaseId2,
				AOContent_contentId2,
				AOContent_stakeId2,
				AOContent_contentHostId2,
				account2EncChallenge,
				account2ContentDatKey,
				account2MetadataDatKey
			);
			AOContent_contentHostId6 = await becomeHost(
				account2,
				account2PrivateKey,
				account1,
				account1,
				AOContent_purchaseId3,
				AOContent_contentId3,
				AOContent_stakeId3,
				AOContent_contentHostId3,
				account2EncChallenge,
				account2ContentDatKey,
				account2MetadataDatKey
			);

			CreativeCommons_contentHostId4 = await becomeHost(
				account2,
				account2PrivateKey,
				account1,
				account1,
				CreativeCommons_purchaseId1,
				CreativeCommons_contentId1,
				CreativeCommons_stakeId1,
				CreativeCommons_contentHostId1,
				account2EncChallenge,
				account2ContentDatKey,
				account2MetadataDatKey
			);
			CreativeCommons_contentHostId5 = await becomeHost(
				account2,
				account2PrivateKey,
				account1,
				account1,
				CreativeCommons_purchaseId2,
				CreativeCommons_contentId2,
				CreativeCommons_stakeId2,
				CreativeCommons_contentHostId2,
				account2EncChallenge,
				account2ContentDatKey,
				account2MetadataDatKey
			);
			CreativeCommons_contentHostId6 = await becomeHost(
				account2,
				account2PrivateKey,
				account1,
				account1,
				CreativeCommons_purchaseId3,
				CreativeCommons_contentId3,
				CreativeCommons_stakeId3,
				CreativeCommons_contentHostId3,
				account2EncChallenge,
				account2ContentDatKey,
				account2MetadataDatKey
			);

			TAOContent_contentHostId4 = await becomeHost(
				account2,
				account2PrivateKey,
				account1,
				account1,
				TAOContent_purchaseId1,
				TAOContent_contentId1,
				TAOContent_stakeId1,
				TAOContent_contentHostId1,
				account2EncChallenge,
				account2ContentDatKey,
				account2MetadataDatKey
			);
			TAOContent_contentHostId5 = await becomeHost(
				account2,
				account2PrivateKey,
				account1,
				account1,
				TAOContent_purchaseId2,
				TAOContent_contentId2,
				TAOContent_stakeId2,
				TAOContent_contentHostId2,
				account2EncChallenge,
				account2ContentDatKey,
				account2MetadataDatKey
			);
			TAOContent_contentHostId6 = await becomeHost(
				account2,
				account2PrivateKey,
				account1,
				account1,
				TAOContent_purchaseId3,
				TAOContent_contentId3,
				TAOContent_stakeId3,
				TAOContent_contentHostId3,
				account2EncChallenge,
				account2ContentDatKey,
				account2MetadataDatKey
			);
		});

		it("new node should be able to buy content from new distribution node, and then become a host itself", async function() {
			// Let's give account3 some tokens
			await aotoken.mintToken(account3, 10 ** 9, { from: developer }); // 1,000,000,000 AO Token

			var buyAndBecomeHost = async function(
				account,
				contentHostId,
				publicKey,
				publicAddress,
				privateKey,
				encChallenge,
				contentDatKey,
				metadataDatKey,
				stakeId,
				stakeOwner,
				host,
				isAOContentUsageType
			) {
				var stakeOwnerBalanceBefore = await aotoken.balanceOf(stakeOwner);
				var hostBalanceBefore = await aotoken.balanceOf(host);
				var accountBalanceBefore = await aotoken.balanceOf(account);

				var canBuyContent, buyContentEvent;
				try {
					if (isAOContentUsageType) {
						var result = await aocontent.buyContent(contentHostId, 3, 0, "mega", publicKey, publicAddress, { from: account });
					} else {
						var result = await aocontent.buyContent(contentHostId, 0, 0, "", publicKey, publicAddress, { from: account });
					}
					canBuyContent = true;
					buyContentEvent = result.logs[0];
					purchaseId = buyContentEvent.args.purchaseId;
				} catch (e) {
					canBuyContent = false;
					buyContentEvent = null;
					purchaseId = null;
				}
				assert.equal(canBuyContent, true, "Account can't buy content even though sent tokens >= price");

				var price = await aocontent.contentHostPrice(contentHostId);
				var stakedContent = await aocontent.stakedContentById(stakeId);
				var stakedNetworkAmount = stakedContent[2];
				var stakedPrimordialAmount = stakedContent[3];
				var stakedPrimordialWeightedMultiplier = stakedContent[4];
				var profitPercentage = stakedContent[5];

				var signHash = EthCrypto.hash.keccak256([
					{
						type: "address",
						value: aocontent.address
					},
					{
						type: "string",
						value: baseChallenge
					}
				]);

				var signature = EthCrypto.sign(privateKey, signHash);

				var vrs = EthCrypto.vrs.fromString(signature);
				var canBecomeHost, hostContentEvent, newContentHostId, contentHost;
				try {
					var result = await aocontent.becomeHost(purchaseId, vrs.v, vrs.r, vrs.s, encChallenge, contentDatKey, metadataDatKey, {
						from: account
					});
					canBecomeHost = true;

					hostContentEvent = result.logs[0];
					newContentHostId = hostContentEvent.args.contentHostId;
					contentHost = await aocontent.contentHostById(newContentHostId);
				} catch (e) {
					canBecomeHost = false;
					hostContentEvent = null;
					newContentHostId = null;
				}
				assert.equal(canBecomeHost, true, "Account fails becoming host of the content");

				// Verify the content host object
				assert.equal(contentHost[0], stakeId, "Content host has incorrect stake ID");
				assert.equal(contentHost[1], account, "Content host has incorrect host");
				assert.equal(contentHost[2], contentDatKey, "Content host has incorrect content dat key");
				assert.equal(contentHost[3], metadataDatKey, "Content host has incorrect metadata dat key");

				// Calculate stake owner/host payment earning
				var stakeOwnerPaymentEarning = isAOContentUsageType
					? parseInt(
							price
								.mul(profitPercentage)
								.div(percentageDivisor)
								.toString()
					  )
					: 0;
				var hostPaymentEarning = price.minus(stakeOwnerPaymentEarning);

				// Calculate inflation bonus
				var networkBonus = parseInt(stakedNetworkAmount.times(inflationRate).div(percentageDivisor));

				var primordialBonus = parseInt(
					stakedPrimordialAmount
						.times(stakedPrimordialWeightedMultiplier)
						.div(multiplierDivisor)
						.times(inflationRate)
						.div(percentageDivisor)
				);
				var inflationBonus = networkBonus + primordialBonus;

				// Calculate stake owner/host/foundation inflation bonus
				var stakeOwnerInflationBonus = isAOContentUsageType
					? parseInt(profitPercentage.times(inflationBonus).div(percentageDivisor))
					: 0;
				var hostInflationBonus = inflationBonus - stakeOwnerInflationBonus;

				var stakeOwnerBalanceAfter = await aotoken.balanceOf(stakeOwner);
				var hostBalanceAfter = await aotoken.balanceOf(host);
				var accountBalanceAfter = await aotoken.balanceOf(account);

				if (isAOContentUsageType) {
					assert.equal(
						stakeOwnerBalanceAfter.toString(),
						stakeOwnerBalanceBefore
							.plus(stakeOwnerPaymentEarning)
							.plus(stakeOwnerInflationBonus)
							.toString(),
						"Stake owner has incorrect balance"
					);
					assert.equal(
						hostBalanceAfter.toString(),
						hostBalanceBefore
							.plus(hostPaymentEarning)
							.plus(hostInflationBonus)
							.toString(),
						"Host has incorrect balance"
					);
					assert.equal(
						accountBalanceAfter.toString(),
						accountBalanceBefore.minus(price).toString(),
						"Account has incorrect balance"
					);
				} else {
					assert.equal(
						stakeOwnerBalanceAfter.toString(),
						stakeOwnerBalanceBefore.toString(),
						"Stake owner has incorrect balance"
					);
					assert.equal(
						hostBalanceAfter.toString(),
						hostBalanceBefore
							.plus(price)
							.plus(hostInflationBonus)
							.toString(),
						"Host has incorrect balance"
					);
					assert.equal(accountBalanceAfter.toString(), accountBalanceBefore.toString(), "Account has incorrect balance");
				}
			};

			await buyAndBecomeHost(
				account3,
				AOContent_contentHostId4,
				account3LocalIdentity.publicKey,
				account3LocalIdentity.address,
				account3PrivateKey,
				account3EncChallenge,
				account3ContentDatKey,
				account3MetadataDatKey,
				AOContent_stakeId1,
				account1,
				account2,
				true
			);
			await buyAndBecomeHost(
				account3,
				AOContent_contentHostId5,
				account3LocalIdentity.publicKey,
				account3LocalIdentity.address,
				account3PrivateKey,
				account3EncChallenge,
				account3ContentDatKey,
				account3MetadataDatKey,
				AOContent_stakeId2,
				account1,
				account2,
				true
			);
			await buyAndBecomeHost(
				account3,
				AOContent_contentHostId6,
				account3LocalIdentity.publicKey,
				account3LocalIdentity.address,
				account3PrivateKey,
				account3EncChallenge,
				account3ContentDatKey,
				account3MetadataDatKey,
				AOContent_stakeId3,
				account1,
				account2,
				true
			);

			await buyAndBecomeHost(
				account3,
				CreativeCommons_contentHostId4,
				account3LocalIdentity.publicKey,
				account3LocalIdentity.address,
				account3PrivateKey,
				account3EncChallenge,
				account3ContentDatKey,
				account3MetadataDatKey,
				CreativeCommons_stakeId1,
				account1,
				account2,
				false
			);
			await buyAndBecomeHost(
				account3,
				CreativeCommons_contentHostId5,
				account3LocalIdentity.publicKey,
				account3LocalIdentity.address,
				account3PrivateKey,
				account3EncChallenge,
				account3ContentDatKey,
				account3MetadataDatKey,
				CreativeCommons_stakeId2,
				account1,
				account2,
				false
			);
			await buyAndBecomeHost(
				account3,
				CreativeCommons_contentHostId6,
				account3LocalIdentity.publicKey,
				account3LocalIdentity.address,
				account3PrivateKey,
				account3EncChallenge,
				account3ContentDatKey,
				account3MetadataDatKey,
				CreativeCommons_stakeId3,
				account1,
				account2,
				false
			);

			await buyAndBecomeHost(
				account3,
				TAOContent_contentHostId4,
				account3LocalIdentity.publicKey,
				account3LocalIdentity.address,
				account3PrivateKey,
				account3EncChallenge,
				account3ContentDatKey,
				account3MetadataDatKey,
				TAOContent_stakeId1,
				account1,
				account2,
				false
			);
			await buyAndBecomeHost(
				account3,
				TAOContent_contentHostId5,
				account3LocalIdentity.publicKey,
				account3LocalIdentity.address,
				account3PrivateKey,
				account3EncChallenge,
				account3ContentDatKey,
				account3MetadataDatKey,
				TAOContent_stakeId2,
				account1,
				account2,
				false
			);
			await buyAndBecomeHost(
				account3,
				TAOContent_contentHostId6,
				account3LocalIdentity.publicKey,
				account3LocalIdentity.address,
				account3PrivateKey,
				account3EncChallenge,
				account3ContentDatKey,
				account3MetadataDatKey,
				TAOContent_stakeId3,
				account1,
				account2,
				false
			);
		});

		it("AOLibrary - getContentMetrics(), it should return the staking and earning information of a stake ID", async function() {
			var canGetContentMetrics, metrics;
			try {
				metrics = await library.getContentMetrics(aocontent.address, aoearning.address, "someid");
				canGetContentMetrics = true;
			} catch (e) {
				canGetContentMetrics = false;
			}
			assert.notEqual(canGetContentMetrics, true, "Library contract can get content metrics of non-existing stake ID");

			try {
				metrics = await library.getContentMetrics(aocontent.address, aoearning.address, AOContent_stakeId1);
				canGetContentMetrics = true;
			} catch (e) {
				canGetContentMetrics = false;
			}
			assert.equal(canGetContentMetrics, true, "Library contract can't get content metrics of existing stake ID");

			var stakedContent = await aocontent.stakedContentById(AOContent_stakeId1);
			assert.equal(metrics[0].toString(), stakedContent[2].toString(), "getContentMetrics() returns incorrect staked networkAmount");
			assert.equal(
				metrics[1].toString(),
				stakedContent[3].toString(),
				"getContentMetrics() returns incorrect staked primordialAmount"
			);
			assert.equal(
				metrics[2].toString(),
				stakedContent[4].toString(),
				"getContentMetrics() returns incorrect staked primordialWeightedMultiplier"
			);

			var totalStakedContentStakeEarning = await aoearning.totalStakedContentStakeEarning(AOContent_stakeId1);
			var totalStakedContentHostEarning = await aoearning.totalStakedContentHostEarning(AOContent_stakeId1);
			var totalStakedContentFoundationEarning = await aoearning.totalStakedContentFoundationEarning(AOContent_stakeId1);

			assert.equal(
				metrics[3].toString(),
				totalStakedContentStakeEarning.toString(),
				"getContentMetrics() returns incorrect total earning from staking content"
			);
			assert.equal(
				metrics[4].toString(),
				totalStakedContentHostEarning.toString(),
				"getContentMetrics() returns incorrect total earning from hosting content"
			);
			assert.equal(
				metrics[5].toString(),
				totalStakedContentFoundationEarning.toString(),
				"getContentMetrics() returns incorrect total earning for Foundation"
			);
		});

		it("AOLibrary - getStakingMetrics(), it should return the staking information of a stake ID", async function() {
			var canGetStakingMetrics, metrics;
			try {
				metrics = await library.getStakingMetrics(aocontent.address, "someid");
				canGetStakingMetrics = true;
			} catch (e) {
				canGetStakingMetrics = false;
			}
			assert.notEqual(canGetStakingMetrics, true, "Library contract can get staking metrics of non-existing stake ID");

			try {
				metrics = await library.getStakingMetrics(aocontent.address, AOContent_stakeId1);
				canGetStakingMetrics = true;
			} catch (e) {
				canGetStakingMetrics = false;
			}
			assert.equal(canGetStakingMetrics, true, "Library contract can't get staking metrics of existing stake ID");

			var stakedContent = await aocontent.stakedContentById(AOContent_stakeId1);
			assert.equal(metrics[0].toString(), stakedContent[2].toString(), "getStakingMetrics() returns incorrect staked networkAmount");
			assert.equal(
				metrics[1].toString(),
				stakedContent[3].toString(),
				"getStakingMetrics() returns incorrect staked primordialAmount"
			);
			assert.equal(
				metrics[2].toString(),
				stakedContent[4].toString(),
				"getStakingMetrics() returns incorrect staked primordialWeightedMultiplier"
			);
		});

		it("AOLibrary - getEarningMetrics(), it should return the earning information of a stake ID", async function() {
			var metrics = await library.getEarningMetrics(aoearning.address, "someid");
			assert.equal(
				metrics[0].toString(),
				0,
				"getEarningMetrics() returns incorrect total earning from staking content for a non-existing stake ID"
			);
			assert.equal(
				metrics[1].toString(),
				0,
				"getEarningMetrics() returns incorrect total earning from hosting content for a non-existing stake ID"
			);
			assert.equal(
				metrics[2].toString(),
				0,
				"getEarningMetrics() returns incorrect total earning for Foundation for a non-existing stake ID"
			);

			var metrics = await library.getEarningMetrics(aoearning.address, AOContent_stakeId1);
			var totalStakedContentStakeEarning = await aoearning.totalStakedContentStakeEarning(AOContent_stakeId1);
			var totalStakedContentHostEarning = await aoearning.totalStakedContentHostEarning(AOContent_stakeId1);
			var totalStakedContentFoundationEarning = await aoearning.totalStakedContentFoundationEarning(AOContent_stakeId1);

			assert.equal(
				metrics[0].toString(),
				totalStakedContentStakeEarning.toString(),
				"getEarningMetrics() returns incorrect total earning from staking content"
			);
			assert.equal(
				metrics[1].toString(),
				totalStakedContentHostEarning.toString(),
				"getEarningMetrics() returns incorrect total earning from hosting content"
			);
			assert.equal(
				metrics[2].toString(),
				totalStakedContentFoundationEarning.toString(),
				"getEarningMetrics() returns incorrect total earning for Foundation"
			);
		});
	});
});
