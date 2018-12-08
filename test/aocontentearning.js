var AOContent = artifacts.require("./AOContent.sol");
var AOToken = artifacts.require("./AOToken.sol");
var AOTreasury = artifacts.require("./AOTreasury.sol");
var AOEarning = artifacts.require("./AOEarning.sol");
var AOLibrary = artifacts.require("./AOLibrary.sol");
var Pathos = artifacts.require("./Pathos.sol");
var AntiLogos = artifacts.require("./AntiLogos.sol");
var AOSetting = artifacts.require("./AOSetting.sol");
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
		settingThoughtId,
		aosetting,
		inflationRate,
		foundationCut,
		percentageDivisor,
		multiplierDivisor,
		contentUsageType_aoContent,
		contentUsageType_creativeCommons,
		contentUsageType_taoContent;
	var someAddress = "0x0694bdcab07b298e88a834a3c91602cb8f457bde";
	var developer = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	// Retrieve private keys from ganache
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
	var extraData = "";

	var account2LocalIdentity = EthCrypto.createIdentity();
	var account3LocalIdentity = EthCrypto.createIdentity();

	var fileSize = 1000000; // 1000000 bytes = min 1000000 AO
	var profitPercentage = 600000; // 60%

	var taoId = "";

	before(async function() {
		aocontent = await AOContent.deployed();
		aotoken = await AOToken.deployed();
		aotreasury = await AOTreasury.deployed();
		aoearning = await AOEarning.deployed();
		aosetting = await AOSetting.deployed();

		// Get the decimals
		aodecimals = await aotoken.decimals();

		library = await AOLibrary.deployed();

		pathos = await Pathos.deployed();
		antilogos = await AntiLogos.deployed();

		settingThoughtId = await aoearning.settingThoughtId();

		var settingValues = await aosetting.getSettingValuesByThoughtName(settingThoughtId, "inflationRate");
		inflationRate = settingValues[0];

		var settingValues = await aosetting.getSettingValuesByThoughtName(settingThoughtId, "foundationCut");
		foundationCut = settingValues[0];

		percentageDivisor = await library.PERCENTAGE_DIVISOR();
		multiplierDivisor = await library.MULTIPLIER_DIVISOR();

		var settingValues = await aosetting.getSettingValuesByThoughtName(settingThoughtId, "contentUsageType_aoContent");
		contentUsageType_aoContent = settingValues[4];

		var settingValues = await aosetting.getSettingValuesByThoughtName(settingThoughtId, "contentUsageType_creativeCommons");
		contentUsageType_creativeCommons = settingValues[4];

		var settingValues = await aosetting.getSettingValuesByThoughtName(settingThoughtId, "contentUsageType_taoContent");
		contentUsageType_taoContent = settingValues[4];
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
		var contentId1,
			contentId2,
			contentId3,
			stakeId1,
			stakeId2,
			stakeId3,
			contentHostId1,
			contentHostId2,
			contentHostId3,
			contentHost1Price,
			contentHost2Price,
			contentHost3Price,
			purchaseId,
			contentHostId4;

		var stakeContent = async function(account, networkIntegerAmount, networkFractionAmount, denomination, primordialAmount) {
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

			/**
			 * TODO: add more validation for contentById
			 */
			//assert.equal(content[2], contentUsageType_aoContent, "contentById returns incorrect contentUsageType_aoContent");
			//assert.equal(content[3], extraData, "contentById returns incorrect extraData");

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
			await aotoken.buyPrimordialToken({ from: account1, value: 50000000000 });
			await aotoken.buyPrimordialToken({ from: account1, value: 50000000000 });

			// Let's give account2 some tokens
			await aotoken.mintToken(account2, 10 ** 9, { from: developer }); // 1,000,000,000 AO Token
		});

		it("stakeContent() - should NOT stake content if params provided are not valid", async function() {
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

		it("stakeContent() - should NOT stake content if account does not have enough balance", async function() {
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
					{ from: account1 }
				);
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake more than available balance");
		});

		it("stakeContent() - should be able to stake content with only network tokens", async function() {
			var response = await stakeContent(account1, 5, 1000, "mega", 0);
			contentId1 = response.contentId;
			stakeId1 = response.stakeId;
			contentHostId1 = response.contentHostId;
		});

		it("stakeContent() - should be able to stake content with only primordial tokens", async function() {
			var response = await stakeContent(account1, 0, 0, "", 1000100);
			contentId2 = response.contentId;
			stakeId2 = response.stakeId;
			contentHostId2 = response.contentHostId;
		});

		it("stakeContent() - should be able to stake content with both network Tokens and primordial tokens", async function() {
			var response = await stakeContent(account1, 3, 100, "mega", 10000);
			contentId3 = response.contentId;
			stakeId3 = response.stakeId;
			contentHostId3 = response.contentHostId;
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

			await setProfitPercentage(stakeId1);
			await setProfitPercentage(stakeId2);
			await setProfitPercentage(stakeId3);
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

			await setProfitPercentage(stakeId1);
			await setProfitPercentage(stakeId2);
			await setProfitPercentage(stakeId3);
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
			};

			await setProfitPercentage(stakeId1);
			await setProfitPercentage(stakeId2);
			await setProfitPercentage(stakeId3);
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

			await unstakePartialContent(stakeId1, 10, 10, "kilo", 0);
			await unstakePartialContent(stakeId2, 0, 0, "", 10);
			await unstakePartialContent(stakeId3, 10, 10, "kilo", 10);
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

			await unstakePartialContent(stakeId1, 10, 10, "giga", 10000000);
			await unstakePartialContent(stakeId2, 10, 10, "giga", 10000000);
			await unstakePartialContent(stakeId3, 10, 10, "giga", 10000000);
		});

		it("unstakePartialContent() - should be able to partially unstake only network token from existing staked content", async function() {
			await unstakePartialContent(account1, stakeId1, 10, 10, "kilo", 0);
			await unstakePartialContent(account1, stakeId3, 10, 10, "kilo", 0);
		});

		it("unstakePartialContent() - should be able to partially unstake only primordial token from existing staked content", async function() {
			await unstakePartialContent(account1, stakeId2, 0, 0, "", 100);
			await unstakePartialContent(account1, stakeId3, 0, 0, "", 100);
		});

		it("unstakePartialContent() - should be able to partially unstake both network and primordial token from existing staked content", async function() {
			await unstakePartialContent(account1, stakeId3, 10, 10, "kilo", 100);
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

			await unstakeContent(stakeId1);
			await unstakeContent(stakeId2);
			await unstakeContent(stakeId3);
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

			await unstakeContent(account1, stakeId1);
			await unstakeContent(account1, stakeId2);
			await unstakeContent(account1, stakeId3);
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
					await aocontent.stakeExistingContent(stakeId, 5, 10, "mega", 10, { from: account2 });
					canStakeExisting = true;
				} catch (e) {
					canStakeExisting = false;
				}
				assert.notEqual(canStakeExisting, true, "Non-stake owner address can stake existing staked content");
			};

			await stakeExistingContent(stakeId1);
			await stakeExistingContent(stakeId2);
			await stakeExistingContent(stakeId3);
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

			await stakeExistingContent(stakeId1, 30, 0, "ao", 0);
			await stakeExistingContent(stakeId1, 0, 0, "", 30);
			await stakeExistingContent(stakeId1, 30, 0, "ao", 30);
		});

		it("stakeExistingContent() - should be able to stake only network tokens on existing staked content", async function() {
			await stakeExistingContent(account1, stakeId1, 2, 0, "mega", 0);
			await stakeExistingContent(account1, stakeId2, 1000, 100, "kilo", 0);
			await stakeExistingContent(account1, stakeId3, 1, 0, "mega", 0);

			// unstake them again for next test
			await aocontent.unstakeContent(stakeId1, { from: account1 });
			await aocontent.unstakeContent(stakeId2, { from: account1 });
			await aocontent.unstakeContent(stakeId3, { from: account1 });
		});

		it("stakeExistingContent() - should be able to stake only primordial tokens on existing staked content", async function() {
			await stakeExistingContent(account1, stakeId1, 0, 0, "", 1000100);
			await stakeExistingContent(account1, stakeId2, 0, 0, "", 2000000);
			await stakeExistingContent(account1, stakeId3, 0, 0, "", 1000000);

			// unstake them again for next test
			await aocontent.unstakeContent(stakeId1, { from: account1 });
			await aocontent.unstakeContent(stakeId2, { from: account1 });
			await aocontent.unstakeContent(stakeId3, { from: account1 });
		});

		it("stakeExistingContent() - should be able to stake both network and primordial tokens on existing staked content", async function() {
			await stakeExistingContent(account1, stakeId1, 2, 10, "kilo", 1000000);
			await stakeExistingContent(account1, stakeId2, 1, 0, "mega", 10);
			await stakeExistingContent(account1, stakeId3, 0, 900000, "mega", 110000);

			var networkAmount = await aotreasury.toBase(2, 10, "kilo");
			contentHost1Price = networkAmount.add(1000000);
			networkAmount = await aotreasury.toBase(1, 0, "mega");
			contentHost2Price = networkAmount.add(10);
			networkAmount = await aotreasury.toBase(0, 900000, "mega");
			contentHost3Price = networkAmount.add(110000);

			// Should be able to stake again on active staked content
			await stakeExistingContent(account1, stakeId1, 0, 500, "kilo", 0);
			await stakeExistingContent(account1, stakeId2, 0, 10, "mega", 1000);
			await stakeExistingContent(account1, stakeId3, 100, 0, "ao", 100);

			networkAmount = await aotreasury.toBase(0, 500, "kilo");
			contentHost1Price = contentHost1Price.add(networkAmount);
			networkAmount = await aotreasury.toBase(0, 10, "mega");
			contentHost2Price = contentHost2Price.add(networkAmount).add(1000);
			networkAmount = await aotreasury.toBase(100, 0, "ao");
			contentHost3Price = contentHost3Price.add(networkAmount).add(100);
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

			var _contentHost1Price = await aocontent.contentHostPrice(contentHostId1);
			assert.equal(_contentHost1Price.toString(), contentHost1Price.toString(), "Content host has incorrect price");

			var _contentHost2Price = await aocontent.contentHostPrice(contentHostId2);
			assert.equal(_contentHost2Price.toString(), contentHost2Price.toString(), "Content host has incorrect price");

			var _contentHost3Price = await aocontent.contentHostPrice(contentHostId3);
			assert.equal(_contentHost3Price.toString(), contentHost3Price.toString(), "Content host has incorrect price");
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
			await buyContent(account2, contentHostId1, account2LocalIdentity.publicKey, account2LocalIdentity.address);
			await buyContent(account2, contentHostId2, account2LocalIdentity.publicKey, account2LocalIdentity.address);
			await buyContent(account2, contentHostId3, account2LocalIdentity.publicKey, account2LocalIdentity.address);
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
			await buyContent(account3, contentHostId1, account3LocalIdentity.publicKey, account3LocalIdentity.address);
			await buyContent(account3, contentHostId2, account3LocalIdentity.publicKey, account3LocalIdentity.address);
			await buyContent(account3, contentHostId3, account3LocalIdentity.publicKey, account3LocalIdentity.address);
		});

		it("buyContent() - should be able to buy content and store all of the earnings of stake owner (content creator)/host/foundation in escrow", async function() {
			var accountBalanceBefore = await aotoken.balanceOf(account2);
			var stakeOwnerBalanceBefore = await aotoken.balanceOf(account1);
			var hostBalanceBefore = await aotoken.balanceOf(account1);
			var foundationBalanceBefore = await aotoken.balanceOf(developer);

			var stakeOwnerPathosBalanceBefore = await pathos.balanceOf(account1);
			var hostAntiLogosBalanceBefore = await antilogos.balanceOf(account1);

			var price = await aocontent.contentHostPrice(contentHostId1);
			var stakedContent = await aocontent.stakedContentById(stakeId1);
			var stakedNetworkAmount = stakedContent[2];
			var stakedPrimordialAmount = stakedContent[3];
			var stakedPrimordialWeightedMultiplier = stakedContent[4];
			var profitPercentage = stakedContent[5];

			var canBuyContent, buyContentEvent, purchaseReceipt, stakeEarning, hostEarning, foundationEarning;
			try {
				var result = await aocontent.buyContent(
					contentHostId1,
					3,
					0,
					"mega",
					account2LocalIdentity.publicKey,
					account2LocalIdentity.address,
					{ from: account2 }
				);
				canBuyContent = true;
				buyContentEvent = result.logs[0];
				purchaseId = buyContentEvent.args.purchaseId;
				purchaseReceipt = await aocontent.purchaseReceiptById(purchaseId);
				stakeEarning = await aoearning.stakeEarnings(account1, purchaseId);
				hostEarning = await aoearning.hostEarnings(account1, purchaseId);
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

			assert.equal(purchaseReceipt[0], contentHostId1, "Purchase receipt has incorrect content host ID");
			assert.equal(purchaseReceipt[1], account2, "Purchase receipt has incorrect buyer address");
			assert.equal(purchaseReceipt[2].toString(), contentHost1Price.toString(), "Purchase receipt has incorrect paid network amount");
			assert.equal(purchaseReceipt[3], account2LocalIdentity.publicKey, "Purchase receipt has incorrect public key");

			assert.equal(
				purchaseReceipt[4].toLowerCase(),
				account2LocalIdentity.address.toLowerCase(),
				"Purchase receipt has incorrect public address"
			);

			var accountBalanceAfter = await aotoken.balanceOf(account2);
			var stakeOwnerBalanceAfter = await aotoken.balanceOf(account1);
			var hostBalanceAfter = await aotoken.balanceOf(account1);
			var foundationBalanceAfter = await aotoken.balanceOf(developer);

			assert.equal(
				accountBalanceAfter.toString(),
				accountBalanceBefore.minus(price).toString(),
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
			var stakeOwnerPaymentEarning = parseInt(
				price
					.mul(profitPercentage)
					.div(percentageDivisor)
					.toString()
			);
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
			var stakeOwnerInflationBonus = parseInt(profitPercentage.times(inflationBonus).div(percentageDivisor));
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
			var stakeOwnerEscrowedBalance = await aotoken.escrowedBalance(account1);
			var hostEscrowedBalance = await aotoken.escrowedBalance(account1);
			var foundationEscrowedBalance = await aotoken.escrowedBalance(developer);

			// since the stake owner and the host are the same
			assert.equal(
				stakeOwnerEscrowedBalance.toString(),
				price.add(inflationBonus).toString(),
				"Stake owner/host has incorrect escrowed balance"
			);
			assert.equal(foundationEscrowedBalance.toString(), foundationInflationBonus, "Foundation has incorrect escrowed balance");

			try {
				var result = await aocontent.buyContent(
					contentHostId1,
					3,
					0,
					"mega",
					account2LocalIdentity.publicKey,
					account2LocalIdentity.address,
					{ from: account2 }
				);
				canBuyContent = true;
			} catch (e) {
				canBuyContent = false;
			}
			assert.notEqual(canBuyContent, true, "Account can buy the same content more than once");

			// Verify Thought Currencies balance
			var stakeOwnerPathosBalanceAfter = await pathos.balanceOf(account1);
			var hostAntiLogosBalanceAfter = await antilogos.balanceOf(account1);

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

			var signature = EthCrypto.sign(account2LocalIdentity.privateKey, signHash);

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
					purchaseId,
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
					purchaseId,
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
					purchaseId,
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
				await aocontent.becomeHost(purchaseId, vrs.v, vrs.r, vrs.s, "", account2ContentDatKey, account2MetadataDatKey, {
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
				await aocontent.becomeHost(purchaseId, vrs.v, vrs.r, vrs.s, account2EncChallenge, "", account2MetadataDatKey, {
					from: account2
				});
				canBecomeHost = true;
			} catch (e) {
				canBecomeHost = false;
			}
			assert.notEqual(canBecomeHost, true, "Account can become host of content even though it's missing the content dat key");

			try {
				await aocontent.becomeHost(purchaseId, vrs.v, vrs.r, vrs.s, account2EncChallenge, account2ContentDatKey, "", {
					from: account2
				});
				canBecomeHost = true;
			} catch (e) {
				canBecomeHost = false;
			}
			assert.notEqual(canBecomeHost, true, "Account can become host of content even though it's missing the metadata dat key");

			try {
				await aocontent.becomeHost(
					purchaseId,
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

			var signature = EthCrypto.sign(account2LocalIdentity.privateKey, signHash);

			var vrs = EthCrypto.vrs.fromString(signature);

			var stakeOwnerBalanceBefore = await aotoken.balanceOf(account1);
			var hostBalanceBefore = await aotoken.balanceOf(account1);
			var foundationBalanceBefore = await aotoken.balanceOf(developer);

			var stakeOwnerEscrowedBalanceBefore = await aotoken.escrowedBalance(account1);
			var hostEscrowedBalanceBefore = await aotoken.escrowedBalance(account1);
			var foundationEscrowedBalanceBefore = await aotoken.escrowedBalance(developer);

			var stakeEarningBefore = await aoearning.stakeEarnings(account1, purchaseId);
			var hostEarningBefore = await aoearning.hostEarnings(account1, purchaseId);
			var foundationEarningBefore = await aoearning.foundationEarnings(purchaseId);

			var totalStakeContentEarningBefore = await aoearning.totalStakeContentEarning();
			var totalHostContentEarningBefore = await aoearning.totalHostContentEarning();
			var totalFoundationEarningBefore = await aoearning.totalFoundationEarning();
			var stakeContentEarningBefore = await aoearning.stakeContentEarning(account1);
			var hostContentEarningBefore = await aoearning.hostContentEarning(account1);
			var networkPriceEarningBefore = await aoearning.networkPriceEarning(account1);
			var contentPriceEarningBefore = await aoearning.contentPriceEarning(account1);
			var inflationBonusAccruedBefore = await aoearning.inflationBonusAccrued(account1);

			var totalStakedContentStakeEarningBefore = await aoearning.totalStakedContentStakeEarning(stakeId1);
			var totalStakedContentHostEarningBefore = await aoearning.totalStakedContentHostEarning(stakeId1);
			var totalStakedContentFoundationEarningBefore = await aoearning.totalStakedContentFoundationEarning(stakeId1);
			var totalHostContentEarningByIdBefore = await aoearning.totalHostContentEarningById(contentHostId1);

			var canBecomeHost, hostContentEvent, contentHost;
			try {
				var result = await aocontent.becomeHost(
					purchaseId,
					vrs.v,
					vrs.r,
					vrs.s,
					account2EncChallenge,
					account2ContentDatKey,
					account2MetadataDatKey,
					{ from: account2 }
				);
				canBecomeHost = true;

				hostContentEvent = result.logs[0];
				contentHostId4 = hostContentEvent.args.contentHostId;
				contentHost = await aocontent.contentHostById(contentHostId4);
			} catch (e) {
				canBecomeHost = false;
				hostContentEvent = null;
				contentHostId4 = null;
			}
			assert.equal(canBecomeHost, true, "Account fails becoming host of the content");

			// Verify the content host object
			assert.equal(contentHost[0], stakeId1, "Content host has incorrect stake ID");
			assert.equal(contentHost[1], account2, "Content host has incorrect host");
			assert.equal(contentHost[2], account2ContentDatKey, "Content host has incorrect content dat key");
			assert.equal(contentHost[3], account2MetadataDatKey, "Content host has incorrect metadata dat key");

			var stakeOwnerBalanceAfter = await aotoken.balanceOf(account1);
			var hostBalanceAfter = await aotoken.balanceOf(account1);
			var foundationBalanceAfter = await aotoken.balanceOf(developer);

			var stakeOwnerEscrowedBalanceAfter = await aotoken.escrowedBalance(account1);
			var hostEscrowedBalanceAfter = await aotoken.escrowedBalance(account1);
			var foundationEscrowedBalanceAfter = await aotoken.escrowedBalance(developer);

			var stakeEarningAfter = await aoearning.stakeEarnings(account1, purchaseId);
			var hostEarningAfter = await aoearning.hostEarnings(account1, purchaseId);
			var foundationEarningAfter = await aoearning.foundationEarnings(purchaseId);

			var totalStakeContentEarningAfter = await aoearning.totalStakeContentEarning();
			var totalHostContentEarningAfter = await aoearning.totalHostContentEarning();
			var totalFoundationEarningAfter = await aoearning.totalFoundationEarning();
			var stakeContentEarningAfter = await aoearning.stakeContentEarning(account1);
			var hostContentEarningAfter = await aoearning.hostContentEarning(account1);
			var networkPriceEarningAfter = await aoearning.networkPriceEarning(account1);
			var contentPriceEarningAfter = await aoearning.contentPriceEarning(account1);
			var inflationBonusAccruedAfter = await aoearning.inflationBonusAccrued(account1);

			var totalStakedContentStakeEarningAfter = await aoearning.totalStakedContentStakeEarning(stakeId1);
			var totalStakedContentHostEarningAfter = await aoearning.totalStakedContentHostEarning(stakeId1);
			var totalStakedContentFoundationEarningAfter = await aoearning.totalStakedContentFoundationEarning(stakeId1);
			var totalHostContentEarningByIdAfter = await aoearning.totalHostContentEarningById(contentHostId1);

			// Verify the earning
			assert.equal(stakeEarningAfter[0], purchaseId, "Stake earning has incorrect purchaseId");
			assert.equal(stakeEarningAfter[1].toString(), 0, "Stake earning has incorrect paymentEarning after request node become host");
			assert.equal(stakeEarningAfter[2].toString(), 0, "Stake earning has incorrect inflationBonus after request node become host");

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
		});

		it("new node should be able to buy content from new distribution node, and then become a host itself", async function() {
			// Let's give account3 some tokens
			await aotoken.mintToken(account3, 10 ** 9, { from: developer }); // 1,000,000,000 AO Token

			var canBuyContent, buyContentEvent;
			try {
				var result = await aocontent.buyContent(
					contentHostId4,
					3,
					0,
					"mega",
					account3LocalIdentity.publicKey,
					account3LocalIdentity.address,
					{ from: account3 }
				);
				canBuyContent = true;
				buyContentEvent = result.logs[0];
				purchaseId = buyContentEvent.args.purchaseId;
			} catch (e) {
				canBuyContent = false;
				buyContentEvent = null;
				purchaseId = null;
			}
			assert.equal(canBuyContent, true, "Account can't buy content even though sent tokens >= price");

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

			var signature = EthCrypto.sign(account3LocalIdentity.privateKey, signHash);

			var vrs = EthCrypto.vrs.fromString(signature);
			var canBecomeHost, hostContentEvent, contentHostId, contentHost;
			try {
				var result = await aocontent.becomeHost(
					purchaseId,
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
				contentHost = await aocontent.contentHostById(contentHostId);
			} catch (e) {
				canBecomeHost = false;
				hostContentEvent = null;
				contentHostId = null;
			}
			assert.equal(canBecomeHost, true, "Account fails becoming host of the content");

			// Verify the content host object
			assert.equal(contentHost[0], stakeId1, "Content host has incorrect stake ID");
			assert.equal(contentHost[1], account3, "Content host has incorrect host");
			assert.equal(contentHost[2], account3ContentDatKey, "Content host has incorrect content dat key");
			assert.equal(contentHost[3], account3MetadataDatKey, "Content host has incorrect metadata dat key");
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
				metrics = await library.getContentMetrics(aocontent.address, aoearning.address, stakeId1);
				canGetContentMetrics = true;
			} catch (e) {
				canGetContentMetrics = false;
			}
			assert.equal(canGetContentMetrics, true, "Library contract can't get content metrics of existing stake ID");

			var stakedContent = await aocontent.stakedContentById(stakeId1);
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

			var totalStakedContentStakeEarning = await aoearning.totalStakedContentStakeEarning(stakeId1);
			var totalStakedContentHostEarning = await aoearning.totalStakedContentHostEarning(stakeId1);
			var totalStakedContentFoundationEarning = await aoearning.totalStakedContentFoundationEarning(stakeId1);

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
				metrics = await library.getStakingMetrics(aocontent.address, stakeId1);
				canGetStakingMetrics = true;
			} catch (e) {
				canGetStakingMetrics = false;
			}
			assert.equal(canGetStakingMetrics, true, "Library contract can't get staking metrics of existing stake ID");

			var stakedContent = await aocontent.stakedContentById(stakeId1);
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

			var metrics = await library.getEarningMetrics(aoearning.address, stakeId1);
			var totalStakedContentStakeEarning = await aoearning.totalStakedContentStakeEarning(stakeId1);
			var totalStakedContentHostEarning = await aoearning.totalStakedContentHostEarning(stakeId1);
			var totalStakedContentFoundationEarning = await aoearning.totalStakedContentFoundationEarning(stakeId1);

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
