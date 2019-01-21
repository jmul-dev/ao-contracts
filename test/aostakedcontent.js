var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var AOToken = artifacts.require("./AOToken.sol");
var AOTreasury = artifacts.require("./AOTreasury.sol");
var AOSetting = artifacts.require("./AOSetting.sol");
var AOContent = artifacts.require("./AOContent.sol");
var AOStakedContent = artifacts.require("./AOStakedContent.sol");
var Logos = artifacts.require("./Logos.sol");

var BigNumber = require("bignumber.js");

BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: 1, EXPONENTIAL_AT: [-10, 40] }); // no rounding

contract("AOStakedContent", function(accounts) {
	var namefactory,
		taofactory,
		nametaoposition,
		aotoken,
		aotreasury,
		aosetting,
		aocontent,
		aostakedcontent,
		logos,
		settingTAOId,
		contentUsageType_aoContent,
		contentUsageType_creativeCommons,
		contentUsageType_taoContent,
		nameId1,
		nameId2,
		taoId1,
		taoId2,
		taoId3,
		contentId1,
		contentId2,
		contentId3,
		stakeId1,
		stakeId2,
		stakeId3;

	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var someAddress = accounts[3];
	var whitelistedAddress = accounts[4];

	var baseChallenge = "basechallengestring";
	var fileSize = 1000000; // 1000000 bytes = min 1000000 AO
	var emptyAddress = "0x0000000000000000000000000000000000000000";
	var nullBytesValue = "0x0000000000000000000000000000000000000000000000000000000000000000";

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		aotoken = await AOToken.deployed();
		aotreasury = await AOTreasury.deployed();
		aosetting = await AOSetting.deployed();
		aocontent = await AOContent.deployed();
		aostakedcontent = await AOStakedContent.deployed();
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

		// AOContent grant access to whitelistedAddress
		await aocontent.setWhitelist(whitelistedAddress, true, { from: theAO });

		// Let's give account1 and account2 some tokens
		await aotoken.setWhitelist(theAO, true, { from: theAO });
		await aotoken.mintToken(account1, 10 ** 9, { from: theAO }); // 1,000,000,000 AO Token
		// Buy 2 lots so that we can test avg weighted multiplier
		await aotoken.buyPrimordialToken({ from: account1, value: 500000000000 });
		await aotoken.buyPrimordialToken({ from: account1, value: 500000000000 });

		await aotoken.mintToken(account2, 10 ** 9, { from: theAO }); // 1,000,000,000 AO Token
		// Buy 2 lots so that we can test avg weighted multiplier
		await aotoken.buyPrimordialToken({ from: account2, value: 500000000000 });
		await aotoken.buyPrimordialToken({ from: account2, value: 500000000000 });
	});

	var create = async function(
		stakeOwner,
		contentId,
		networkIntegerAmount,
		networkFractionAmount,
		denomination,
		primordialAmount,
		profitPercentage
	) {
		var accountBalanceBefore = await aotoken.balanceOf(stakeOwner);
		var accountStakedBalanceBefore = await aotoken.stakedBalance(stakeOwner);
		var accountWeightedMultiplierBefore = await aotoken.weightedMultiplierByAddress(stakeOwner);
		var accountPrimordialBalanceBefore = await aotoken.primordialBalanceOf(stakeOwner);
		var accountPrimordialStakedBalanceBefore = await aotoken.primordialStakedBalance(
			stakeOwner,
			accountWeightedMultiplierBefore.toNumber()
		);

		var canCreate, stakeContentEvent, stakeId;
		try {
			var result = await aostakedcontent.create(
				stakeOwner,
				contentId,
				networkIntegerAmount,
				networkFractionAmount,
				denomination,
				primordialAmount,
				profitPercentage,
				{
					from: whitelistedAddress
				}
			);
			canStake = true;
			stakeContentEvent = result.logs[0];
			stakeId = stakeContentEvent.args.stakeId;
		} catch (e) {
			canStake = false;
			stakeContentEvent = null;
			stakeId = null;
		}
		assert.equal(canStake, true, "Whitelisted address can't stake content");

		var networkAmount = new BigNumber(0);
		if (networkIntegerAmount > 0 || networkFractionAmount > 0) {
			networkAmount = await aotreasury.toBase(networkIntegerAmount, networkFractionAmount, denomination);
		}

		var stakedContent = await aostakedcontent.getById(stakeId);
		assert.equal(stakedContent[0], contentId, "StakedContent has incorrect contentId");
		assert.equal(stakedContent[1], stakeOwner, "StakedContent has incorrect stakeOwner");
		assert.equal(stakedContent[2].toNumber(), networkAmount.toNumber(), "StakedContent has incorrect networkAmount");
		assert.equal(stakedContent[3].toNumber(), primordialAmount, "StakedContent has incorrect primordialAmount");
		assert.equal(
			stakedContent[4].toNumber(),
			primordialAmount ? accountWeightedMultiplierBefore.toNumber() : 0,
			"StakedContent has incorrect primordialWeightedMultiplier"
		);
		assert.equal(stakedContent[5].toNumber(), profitPercentage, "StakedContent has incorrect profitPercentage");
		assert.equal(stakedContent[6], true, "StakedContent has incorrect active");

		// Verify the account balance after staking
		var accountBalanceAfter = await aotoken.balanceOf(stakeOwner);
		var accountStakedBalanceAfter = await aotoken.stakedBalance(stakeOwner);
		var accountWeightedMultiplierAfter = await aotoken.weightedMultiplierByAddress(stakeOwner);
		var accountPrimordialBalanceAfter = await aotoken.primordialBalanceOf(stakeOwner);
		var accountPrimordialStakedBalanceAfter = await aotoken.primordialStakedBalance(
			stakeOwner,
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

		return stakeId;
	};

	var unstakePartialContent = async function(
		account,
		stakeId,
		networkIntegerAmount,
		networkFractionAmount,
		denomination,
		primordialAmount
	) {
		var stakedContentBefore = await aostakedcontent.getById(stakeId);
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
			await aostakedcontent.unstakePartialContent(
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
		assert.equal(canUnstakePartial, true, "Stake owner was unable to partially unstake tokens from existing staked content.");

		var stakedContentAfter = await aostakedcontent.getById(stakeId);
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

	var unstakeContent = async function(account, stakeId) {
		var stakedContentBefore = await aostakedcontent.getById(stakeId);
		var accountBalanceBefore = await aotoken.balanceOf(account);
		var accountStakedBalanceBefore = await aotoken.stakedBalance(account);
		var accountWeightedMultiplierBefore = await aotoken.weightedMultiplierByAddress(account);
		var accountPrimordialBalanceBefore = await aotoken.primordialBalanceOf(account);
		var accountPrimordialStakedBalanceBefore = await aotoken.primordialStakedBalance(account, stakedContentBefore[4].toString());

		var networkAmount = stakedContentBefore[2];
		var primordialAmount = stakedContentBefore[3];

		var canUnstake;
		try {
			await aostakedcontent.unstakeContent(stakeId, { from: account });
			canUnstake = true;
		} catch (e) {
			canUnstake = false;
		}
		assert.equal(canUnstake, true, "Stake owner address unable to unstake network and primordial token from existing staked content");

		var stakedContentAfter = await aostakedcontent.getById(stakeId);
		var accountBalanceAfter = await aotoken.balanceOf(account);
		var accountStakedBalanceAfter = await aotoken.stakedBalance(account);
		var accountWeightedMultiplierAfter = await aotoken.weightedMultiplierByAddress(account);
		var accountPrimordialBalanceAfter = await aotoken.primordialBalanceOf(account);
		var accountPrimordialStakedBalanceAfter = await aotoken.primordialStakedBalance(account, stakedContentBefore[4].toString());

		assert.equal(stakedContentAfter[2].toString(), 0, "Staked content has incorrect networkAmount after unstaking");
		assert.equal(stakedContentAfter[3].toString(), 0, "Staked content has incorrect primordialAmount after unstaking");
		assert.equal(stakedContentAfter[4].toString(), 0, "Staked content has incorrect primordialWeightedMultiplier after unstaking");
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

	var stakeExistingContent = async function(
		account,
		stakeId,
		networkIntegerAmount,
		networkFractionAmount,
		denomination,
		primordialAmount
	) {
		var stakedContentBefore = await aostakedcontent.getById(stakeId);
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
			await aostakedcontent.stakeExistingContent(
				stakeId,
				networkIntegerAmount,
				networkFractionAmount,
				denomination,
				primordialAmount,
				{
					from: account
				}
			);
			canStakeExisting = true;
		} catch (e) {
			canStakeExisting = false;
		}
		assert.equal(canStakeExisting, true, "Stake owner can't stake tokens on existing staked content");

		var networkAmount =
			networkIntegerAmount > 0 || networkFractionAmount > 0
				? await aotreasury.toBase(networkIntegerAmount, networkFractionAmount, denomination)
				: 0;

		var stakedContentAfter = await aostakedcontent.getById(stakeId);
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

	it("The AO - should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await aostakedcontent.transferOwnership(taoId1, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await aostakedcontent.transferOwnership(taoId1, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await aostakedcontent.theAO();
		assert.equal(newTheAO, taoId1, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await aostakedcontent.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await aostakedcontent.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await aostakedcontent.whitelist(whitelistedAddress);
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
	});

	it("The AO - should be able to set AOToken address", async function() {
		var canSetAddress;
		try {
			await aostakedcontent.setAOTokenAddress(aotoken.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOToken address");

		try {
			await aostakedcontent.setAOTokenAddress(aotoken.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOToken address");

		var aoTokenAddress = await aostakedcontent.aoTokenAddress();
		assert.equal(aoTokenAddress, aotoken.address, "Contract has incorrect aoTokenAddress");
	});

	it("The AO - should be able to set AOTreasury address", async function() {
		var canSetAddress;
		try {
			await aostakedcontent.setAOTreasuryAddress(aotreasury.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOTreasury address");

		try {
			await aostakedcontent.setAOTreasuryAddress(aotreasury.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOTreasury address");

		var aoTreasuryAddress = await aostakedcontent.aoTreasuryAddress();
		assert.equal(aoTreasuryAddress, aotreasury.address, "Contract has incorrect aoTreasuryAddress");
	});

	it("The AO - should be able to set AOContent address", async function() {
		var canSetAddress;
		try {
			await aostakedcontent.setAOContentAddress(aocontent.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOContent address");

		try {
			await aostakedcontent.setAOContentAddress(aocontent.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOContent address");

		var aoContentAddress = await aostakedcontent.aoContentAddress();
		assert.equal(aoContentAddress, aocontent.address, "Contract has incorrect aoContentAddress");
	});

	it("The AO - should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await aostakedcontent.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await aostakedcontent.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await aostakedcontent.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("Whitelisted Address - should not be able to stake content with invalid params", async function() {
		var canStake, stakeContentEvent, stakeId;
		try {
			var result = await aostakedcontent.create(account1, contentId1, 1000000, 0, "ao", 0, 80000, {
				from: someAddress
			});
			canStake = true;
			stakeContentEvent = result.logs[0];
			stakeId = stakeContentEvent.args.stakeId;
		} catch (e) {
			canStake = false;
			stakeContentEvent = null;
			stakeId = null;
		}
		assert.equal(canStake, false, "Non-whitelisted address can stake content");

		try {
			var result = await aostakedcontent.create(account2, contentId1, 1000000, 0, "ao", 0, 80000, {
				from: whitelistedAddress
			});
			canStake = true;
			stakeContentEvent = result.logs[0];
			stakeId = stakeContentEvent.args.stakeId;
		} catch (e) {
			canStake = false;
			stakeContentEvent = null;
			stakeId = null;
		}
		assert.equal(
			canStake,
			false,
			"Whitelisted address can stake content even though the stake owner is different from the content creator"
		);

		try {
			var result = await aostakedcontent.create(account1, "someid", 1000000, 0, "ao", 0, 80000, {
				from: whitelistedAddress
			});
			canStake = true;
			stakeContentEvent = result.logs[0];
			stakeId = stakeContentEvent.args.stakeId;
		} catch (e) {
			canStake = false;
			stakeContentEvent = null;
			stakeId = null;
		}
		assert.equal(canStake, false, "Whitelisted address can stake content for non-existing content ID");

		try {
			var result = await aostakedcontent.create(account1, contentId1, 100000, 0, "ao", 2000, 80000, {
				from: whitelistedAddress
			});
			canStake = true;
			stakeContentEvent = result.logs[0];
			stakeId = stakeContentEvent.args.stakeId;
		} catch (e) {
			canStake = false;
			stakeContentEvent = null;
			stakeId = null;
		}
		assert.equal(canStake, false, "Whitelisted address can stake content with price less than fileSize");

		try {
			var result = await aostakedcontent.create(account1, contentId1, 1000000, 0, "deca", 0, 80000, {
				from: whitelistedAddress
			});
			canStake = true;
			stakeContentEvent = result.logs[0];
			stakeId = stakeContentEvent.args.stakeId;
		} catch (e) {
			canStake = false;
			stakeContentEvent = null;
			stakeId = null;
		}
		assert.equal(canStake, false, "Whitelisted address can stake content with invalid denomination");

		try {
			var result = await aostakedcontent.create(account1, contentId1, 10 ** 10, 0, "ao", 0, 80000, {
				from: whitelistedAddress
			});
			canStake = true;
			stakeContentEvent = result.logs[0];
			stakeId = stakeContentEvent.args.stakeId;
		} catch (e) {
			canStake = false;
			stakeContentEvent = null;
			stakeId = null;
		}
		assert.equal(canStake, false, "Whitelisted address can stake content with more than owned AO balance");

		try {
			var result = await aostakedcontent.create(account1, contentId1, 0, 0, "ao", 10 ** 10, 80000, {
				from: whitelistedAddress
			});
			canStake = true;
			stakeContentEvent = result.logs[0];
			stakeId = stakeContentEvent.args.stakeId;
		} catch (e) {
			canStake = false;
			stakeContentEvent = null;
			stakeId = null;
		}
		assert.equal(canStake, false, "Whitelisted address can stake content with more than owned AO+ balance");

		try {
			var result = await aostakedcontent.create(account1, contentId1, 1000000, 0, "ao", 0, 10000000, {
				from: whitelistedAddress
			});
			canStake = true;
			stakeContentEvent = result.logs[0];
			stakeId = stakeContentEvent.args.stakeId;
		} catch (e) {
			canStake = false;
			stakeContentEvent = null;
			stakeId = null;
		}
		assert.equal(canStake, false, "Whitelisted address can stake content with invalid profitPercentage");

		try {
			var result = await aostakedcontent.create(account2, contentId2, 2, 0, "mega", 1000, 10000000, {
				from: whitelistedAddress
			});
			canStake = true;
			stakeContentEvent = result.logs[0];
			stakeId = stakeContentEvent.args.stakeId;
		} catch (e) {
			canStake = false;
			stakeContentEvent = null;
			stakeId = null;
		}
		assert.equal(
			canStake,
			false,
			"Whitelisted address can stake content with higher price than fileSize for a Creative Commons content"
		);

		try {
			var result = await aostakedcontent.create(account1, contentId3, 2, 0, "mega", 1000, 10000000, {
				from: whitelistedAddress
			});
			canStake = true;
			stakeContentEvent = result.logs[0];
			stakeId = stakeContentEvent.args.stakeId;
		} catch (e) {
			canStake = false;
			stakeContentEvent = null;
			stakeId = null;
		}
		assert.equal(canStake, false, "Whitelisted address can stake content with higher price than fileSize for a T(AO) content");
	});

	it("Whitelisted Address - should be able to stake content", async function() {
		stakeId1 = await create(account1, contentId1, 4, 1000, "mega", 100000, 100000);
		stakeId2 = await create(account2, contentId2, 0, 0, "", 1000000, 100000);
		stakeId3 = await create(account1, contentId3, 1000000, 0, "ao", 0, 100000);
	});

	it("setProfitPercentage() - should NOT be able to set profit percentage on non-existing staked content", async function() {
		var canSetProfitPercentage;
		try {
			await aostakedcontent.setProfitPercentage("someid", 100, { from: account1 });
			canSetProfitPercentage = true;
		} catch (e) {
			canSetProfitPercentage = false;
		}
		assert.notEqual(canSetProfitPercentage, true, "account1 can set profit percentage for non-existing staked content");
	});

	it("setProfitPercentage() - should NOT be able to set profit percentage if stake owner is not the same as sender", async function() {
		var canSetProfitPercentage;
		try {
			await aostakedcontent.setProfitPercentage(stakeId1, 100, { from: someAddress });
			canSetProfitPercentage = true;
		} catch (e) {
			canSetProfitPercentage = false;
		}
		assert.notEqual(canSetProfitPercentage, true, "Non-stake owner address can set profit percentage");
	});

	it("setProfitPercentage() - should NOT be able to set profit percentage if profit percentage is more than 100%", async function() {
		var canSetProfitPercentage;
		try {
			await aostakedcontent.setProfitPercentage(stakeId1, 1100000, { from: account1 });
			canSetProfitPercentage = true;
		} catch (e) {
			canSetProfitPercentage = false;
		}
		assert.notEqual(canSetProfitPercentage, true, "account1 can set profit percentage more than its allowed value");
	});

	it("setProfitPercentage() - should be able to set profit percentage", async function() {
		var canSetProfitPercentage;
		try {
			await aostakedcontent.setProfitPercentage(stakeId1, 800000, { from: account1 });
			canSetProfitPercentage = true;
		} catch (e) {
			canSetProfitPercentage = false;
		}
		assert.equal(canSetProfitPercentage, true, "account1 is unable to set profit percentage");

		var stakedContent = await aostakedcontent.getById(stakeId1);
		assert.equal(stakedContent[5].toNumber(), 800000, "StakedContent has incorrect profitPercentage after update");
	});

	it("setProfitPercentage() - should not be able to set profit percentage for non-AO Content, i.e Creative Commons/T(AO) Content", async function() {
		var setProfitPercentage = async function(stakeId, account) {
			var canSetProfitPercentage;
			try {
				await aostakedcontent.setProfitPercentage(stakeId, 800000, { from: account });
				canSetProfitPercentage = true;
			} catch (e) {
				canSetProfitPercentage = false;
			}
			assert.notEqual(canSetProfitPercentage, true, "Account is able to set profit percentage");
		};

		await setProfitPercentage(stakeId2, account2);
		await setProfitPercentage(stakeId3, account1);
	});

	it("unstakePartialContent() - should NOT be able to partially unstake non-existing staked content", async function() {
		var canUnstakePartial;
		try {
			await aostakedcontent.unstakePartialContent("someid", 10, 10, "kilo", 10, { from: account1 });
			canUnstakePartial = true;
		} catch (e) {
			canUnstakePartial = false;
		}
		assert.notEqual(canUnstakePartial, true, "account1 can partially unstake non-existing staked content");
	});

	it("unstakePartialContent() - should NOT be able to partially unstake existing staked content if stake owner is not the same as the sender", async function() {
		var canUnstakePartial;
		try {
			await aostakedcontent.unstakePartialContent(stakeId1, 10, 0, "kilo", 0, { from: account2 });

			canUnstakePartial = true;
		} catch (e) {
			canUnstakePartial = false;
		}
		assert.notEqual(canUnstakePartial, true, "Non-stake owner address can partially unstake existing staked content");
	});

	it("unstakePartialContent() - should NOT be able to partially unstake existing staked content if the requested unstake amount is more than the balance of the staked amount", async function() {
		var canUnstakePartial;
		try {
			await aostakedcontent.unstakePartialContent(stakeId1, 10, 0, "giga", 10000000, { from: account1 });
			canUnstakePartial = true;
		} catch (e) {
			canUnstakePartial = false;
		}
		assert.notEqual(canUnstakePartial, true, "Stake owner can partially unstake more tokens than it's existing balance.");
	});

	it("unstakePartialContent() - should be able to partially unstake only network token from existing staked content", async function() {
		await unstakePartialContent(account1, stakeId1, 1, 10, "kilo", 0);
	});

	it("unstakePartialContent() - should be able to partially unstake only primordial token from existing staked content", async function() {
		await unstakePartialContent(account1, stakeId1, 0, 0, "", 10);
	});

	it("unstakePartialContent() - should be able to partially unstake both network and primordial token from existing staked content", async function() {
		await unstakePartialContent(account1, stakeId1, 1, 10, "kilo", 10);
	});

	it("unstakePartialContent() - should NOT be able to partially unstake existing non-AO Content, i.e Creative Commons/T(AO) Content", async function() {
		var unstakePartialContent = async function(
			account,
			stakeId,
			networkIntegerAmount,
			networkFractionAmount,
			denomination,
			primordialAmount
		) {
			var canUnstakePartial;
			try {
				await aostakedcontent.unstakePartialContent(
					stakeId,
					networkIntegerAmount,
					networkFractionAmount,
					denomination,
					primordialAmount,
					{ from: account }
				);

				canUnstakePartial = true;
			} catch (e) {
				canUnstakePartial = false;
			}
			assert.notEqual(canUnstakePartial, true, "Stake owner can partially unstake non-AO Content.");
		};

		await unstakePartialContent(account2, stakeId2, 1, 0, "kilo", 10);
		await unstakePartialContent(account1, stakeId3, 1, 0, "kilo", 10);
	});

	it("unstakeContent() - should NOT be able to unstake non-existing staked content", async function() {
		var canUnstake;
		try {
			await aostakedcontent.unstakeContent("someid", { from: account1 });
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
				await aostakedcontent.unstakeContent(stakeId, { from: someAddress });
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
		await unstakeContent(account1, stakeId1);
		await unstakeContent(account2, stakeId2);
		await unstakeContent(account1, stakeId3);
	});

	it("stakeExistingContent() - should NOT be able to stake non-existing staked content", async function() {
		var canStakeExisting;
		try {
			await aostakedcontent.stakeExistingContent("someid", 5, 10, "mega", 10, { from: account1 });
			canStakeExisting = true;
		} catch (e) {
			canStakeExisting = false;
		}
		assert.notEqual(canStakeExisting, true, "account1 can stake non-existing staked content");
	});

	it("stakeExistingContent() - should NOT be able to stake existing staked content if the stake owner is not the same as the sender", async function() {
		var canStakeExisting;
		try {
			await aostakedcontent.stakeExistingContent(stakeId1, 1, 0, "mega", 0, { from: account2 });
			canStakeExisting = true;
		} catch (e) {
			canStakeExisting = false;
		}
		assert.notEqual(canStakeExisting, true, "Non-stake owner address can stake existing staked content");
	});

	it("stakeExistingContent() - should not be able to stake less than file size", async function() {
		var stakeExistingContent = async function(
			account,
			stakeId,
			networkIntegerAmount,
			networkFractionAmount,
			denomination,
			primordialAmount
		) {
			var canStakeExisting;
			try {
				await aostakedcontent.stakeExistingContent(
					stakeId,
					networkIntegerAmount,
					networkFractionAmount,
					denomination,
					primordialAmount,
					{ from: account }
				);
				canStakeExisting = true;
			} catch (e) {
				canStakeExisting = false;
			}
			assert.notEqual(canStakeExisting, true, "Stake owner can stake less than filesize");
		};

		await stakeExistingContent(account1, stakeId1, 30, 0, "ao", 0);
		await stakeExistingContent(account1, stakeId1, 0, 0, "", 30);
		await stakeExistingContent(account1, stakeId1, 30, 0, "ao", 30);

		await stakeExistingContent(account2, stakeId2, 30, 0, "ao", 0);
		await stakeExistingContent(account2, stakeId2, 0, 0, "", 30);
		await stakeExistingContent(account2, stakeId2, 30, 0, "ao", 30);

		await stakeExistingContent(account1, stakeId3, 30, 0, "ao", 0);
		await stakeExistingContent(account1, stakeId3, 0, 0, "", 30);
		await stakeExistingContent(account1, stakeId3, 30, 0, "ao", 30);
	});

	it("stakeExistingContent() - should not be able to stake more than file size for non-AO Content", async function() {
		var stakeExistingContent = async function(
			account,
			stakeId,
			networkIntegerAmount,
			networkFractionAmount,
			denomination,
			primordialAmount
		) {
			var canStakeExisting;
			try {
				await aostakedcontent.stakeExistingContent(
					stakeId,
					networkIntegerAmount,
					networkFractionAmount,
					denomination,
					primordialAmount,
					{ from: account }
				);
				canStakeExisting = true;
			} catch (e) {
				canStakeExisting = false;
			}
			assert.notEqual(canStakeExisting, true, "Stake owner can stake more than filesize");
		};

		await stakeExistingContent(account2, stakeId2, 3, 0, "mega", 0);
		await stakeExistingContent(account2, stakeId2, 0, 0, "", 3000000);

		await stakeExistingContent(account1, stakeId3, 3, 0, "mega", 0);
		await stakeExistingContent(account1, stakeId3, 0, 0, "", 3000000);
	});

	it("stakeExistingContent() - should be able to stake only network tokens on existing staked content", async function() {
		await stakeExistingContent(account1, stakeId1, 1, 0, "mega", 0);
		await stakeExistingContent(account2, stakeId2, 1, 0, "mega", 0);
		await stakeExistingContent(account1, stakeId3, 1, 0, "mega", 0);

		// unstake them again for next test
		await aostakedcontent.unstakeContent(stakeId1, { from: account1 });
		await aostakedcontent.unstakeContent(stakeId2, { from: account2 });
		await aostakedcontent.unstakeContent(stakeId3, { from: account1 });
	});

	it("stakeExistingContent() - should be able to stake only primordial tokens on existing staked content", async function() {
		await stakeExistingContent(account1, stakeId1, 0, 0, "", 1000000);
		await stakeExistingContent(account2, stakeId2, 0, 0, "", 1000000);
		await stakeExistingContent(account1, stakeId3, 0, 0, "", 1000000);

		// unstake them again for next test
		await aostakedcontent.unstakeContent(stakeId1, { from: account1 });
		await aostakedcontent.unstakeContent(stakeId2, { from: account2 });
		await aostakedcontent.unstakeContent(stakeId3, { from: account1 });
	});

	it("stakeExistingContent() - should be able to stake both network and primordial tokens on existing staked content", async function() {
		await stakeExistingContent(account1, stakeId1, 2, 10, "kilo", 1000000);
		await stakeExistingContent(account2, stakeId2, 500, 0, "kilo", 500000);
		await stakeExistingContent(account1, stakeId3, 0, 300000, "mega", 700000);
	});

	it("isActive() - check whether or not a staked content is active", async function() {
		var canCheckIsActive;
		try {
			await aostakedcontent.isActive("someid");
			canCheckIsActive = true;
		} catch (e) {
			canCheckIsActive = false;
		}
		assert.equal(canCheckIsActive, false, "Contract can check activeness of non-existing staked content");

		var isActive = await aostakedcontent.isActive(stakeId1);
		assert.equal(isActive, true, "Contract returns incorrect status of existing staked content");
		isActive = await aostakedcontent.isActive(stakeId2);
		assert.equal(isActive, true, "Contract returns incorrect status of existing staked content");
		isActive = await aostakedcontent.isActive(stakeId3);
		assert.equal(isActive, true, "Contract returns incorrect status of existing staked content");

		await aostakedcontent.unstakeContent(stakeId1, { from: account1 });
		await aostakedcontent.unstakeContent(stakeId2, { from: account2 });
		await aostakedcontent.unstakeContent(stakeId3, { from: account1 });

		var isActive = await aostakedcontent.isActive(stakeId1);
		assert.equal(isActive, false, "Contract returns incorrect status of existing staked content");
		isActive = await aostakedcontent.isActive(stakeId2);
		assert.equal(isActive, false, "Contract returns incorrect status of existing staked content");
		isActive = await aostakedcontent.isActive(stakeId3);
		assert.equal(isActive, false, "Contract returns incorrect status of existing staked content");
	});
});
