var AOContent = artifacts.require("./AOContent.sol");
var AOToken = artifacts.require("./AOToken.sol");
var AOTreasury = artifacts.require("./AOTreasury.sol");
var AOEarning = artifacts.require("./AOEarning.sol");

contract("AOContent & AOEarning", function(accounts) {
	var aocontent, aotoken, aodecimals, aotreasury, aoearning;
	var someAddress = "0x0694bdcab07b298e88a834a3c91602cb8f457bde";
	var owner = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var baseChallenge = "basechallengestring";
	var encChallenge = "encchallengestring";
	var contentDatKey = "7bde24fb38d6e316ec48874c937f4582f3a494df1ecf387e6edb2e25bff700f7";
	var metadataDatKey = "7bde24fb38d6e316ec48874c937f4582f3a494df1ecf387e6edb2e25bff700f7";
	var fileSize = 1000000; // 1000000 bytes = min 1000000 AO
	var profitPercentage = 600000; // 60%

	before(async function() {
		aocontent = await AOContent.deployed();
		aotoken = await AOToken.deployed();
		aotreasury = await AOTreasury.deployed();
		aoearning = await AOEarning.deployed();

		// Get the decimals
		aodecimals = await aotoken.decimals();
	});
	contract("AOContent - Owner Only Function Tests", function() {
		it("only owner can pause/unpause contract", async function() {
			var canPause;
			try {
				await aocontent.setPaused(true, { from: account1 });
				canPause = true;
			} catch (e) {
				canPause = false;
			}
			assert.notEqual(canPause, true, "Non-owner can pause contract");
			try {
				await aocontent.setPaused(true, { from: owner });
				canPause = true;
			} catch (e) {
				canPause = false;
			}
			assert.equal(canPause, true, "Owner can't pause contract");
			var paused = await aocontent.paused();
			assert.equal(paused, true, "Contract has incorrect paused value after owner set paused");
		});

		it("only owner can set base denomination address", async function() {
			var canSetBaseDenominationAddress;
			try {
				await aocontent.setBaseDenominationAddress(aotoken.address, { from: account1 });
				canSetBaseDenominationAddress = true;
			} catch (e) {
				canSetBaseDenominationAddress = false;
			}
			assert.notEqual(canSetBaseDenominationAddress, true, "Non-owner can set base denomination address");
			try {
				await aocontent.setBaseDenominationAddress(someAddress, { from: owner });
				canSetBaseDenominationAddress = true;
			} catch (e) {
				canSetBaseDenominationAddress = false;
			}
			assert.notEqual(canSetBaseDenominationAddress, true, "Owner can set invalid base denomination address");
			try {
				await aocontent.setBaseDenominationAddress(aotoken.address, { from: owner });
				canSetBaseDenominationAddress = true;
			} catch (e) {
				canSetBaseDenominationAddress = false;
			}
			assert.equal(canSetBaseDenominationAddress, true, "Owner can't set base denomination address");
			var baseDenominationAddress = await aocontent.baseDenominationAddress();
			assert.equal(baseDenominationAddress, aotoken.address, "Contract has incorrect base denomination address");
		});

		it("only owner can call escape hatch", async function() {
			var canEscapeHatch;
			try {
				await aocontent.escapeHatch({ from: account1 });
				canEscapeHatch = true;
			} catch (e) {
				canEscapeHatch = false;
			}
			assert.notEqual(canEscapeHatch, true, "Non-owner can call escape hatch");
			try {
				await aocontent.escapeHatch({ from: owner });
				canEscapeHatch = true;
			} catch (e) {
				canEscapeHatch = false;
			}
			assert.equal(canEscapeHatch, true, "Owner can't call escape hatch");
			var killed = await aocontent.killed();
			assert.equal(killed, true, "Contract has incorrect killed value after owner call escape hatch");
		});
	});

	contract("AOEarning - Owner Only Function Tests", function() {
		it("only owner can pause/unpause contract", async function() {
			var canPause;
			try {
				await aoearning.setPaused(true, { from: account1 });
				canPause = true;
			} catch (e) {
				canPause = false;
			}
			assert.notEqual(canPause, true, "Non-owner can pause contract");
			try {
				await aoearning.setPaused(true, { from: owner });
				canPause = true;
			} catch (e) {
				canPause = false;
			}
			assert.equal(canPause, true, "Owner can't pause contract");
			var paused = await aoearning.paused();
			assert.equal(paused, true, "Contract has incorrect paused value after owner set paused");
		});

		it("only owner can set base denomination address", async function() {
			var canSetBaseDenominationAddress;
			try {
				await aoearning.setBaseDenominationAddress(aotoken.address, { from: account1 });
				canSetBaseDenominationAddress = true;
			} catch (e) {
				canSetBaseDenominationAddress = false;
			}
			assert.notEqual(canSetBaseDenominationAddress, true, "Non-owner can set base denomination address");
			try {
				await aoearning.setBaseDenominationAddress(someAddress, { from: owner });
				canSetBaseDenominationAddress = true;
			} catch (e) {
				canSetBaseDenominationAddress = false;
			}
			assert.notEqual(canSetBaseDenominationAddress, true, "Owner can set invalid base denomination address");
			try {
				await aoearning.setBaseDenominationAddress(aotoken.address, { from: owner });
				canSetBaseDenominationAddress = true;
			} catch (e) {
				canSetBaseDenominationAddress = false;
			}
			assert.equal(canSetBaseDenominationAddress, true, "Owner can't set base denomination address");
			var baseDenominationAddress = await aoearning.baseDenominationAddress();
			assert.equal(baseDenominationAddress, aotoken.address, "Contract has incorrect base denomination address");
		});

		it("only owner can set inflation rate", async function() {
			var canSetInflationRate;
			try {
				await aoearning.setInflationRate(10000, { from: account1 });
				canSetInflationRate = true;
			} catch (e) {
				canSetInflationRate = false;
			}
			assert.notEqual(canSetInflationRate, true, "Non-owner can set inflation rate");
			try {
				await aoearning.setInflationRate(10000, { from: owner });
				canSetInflationRate = true;
			} catch (e) {
				canSetInflationRate = false;
			}
			assert.equal(canSetInflationRate, true, "Owner can't set inflation rate");
			var inflationRate = await aoearning.inflationRate();
			assert.equal(inflationRate.toString(), 10000, "Contract has incorrect inflation rate after owner set inflation rate");
		});

		it("only owner can set foundation cut", async function() {
			var canSetFoundationCut;
			try {
				await aoearning.setFoundationCut(5000, { from: account1 });
				canSetFoundationCut = true;
			} catch (e) {
				canSetFoundationCut = false;
			}
			assert.notEqual(canSetFoundationCut, true, "Non-owner can set foundation cut");
			try {
				await aoearning.setFoundationCut(5000, { from: owner });
				canSetFoundationCut = true;
			} catch (e) {
				canSetFoundationCut = false;
			}
			assert.equal(canSetFoundationCut, true, "Owner can't set foundation cut");
			var foundationCut = await aoearning.foundationCut();
			assert.equal(foundationCut.toString(), 5000, "Contract has incorrect foundation cut after owner set foundation cut");
		});

		it("only owner can set multiplier modifier", async function() {
			var canSetMultiplierModifier;
			try {
				await aoearning.setMultiplierModifier(1000000, { from: account1 });
				canSetMultiplierModifier = true;
			} catch (e) {
				canSetMultiplierModifier = false;
			}
			assert.notEqual(canSetMultiplierModifier, true, "Non-owner can set multiplier modifier");
			try {
				await aoearning.setMultiplierModifier(1000000, { from: owner });
				canSetMultiplierModifier = true;
			} catch (e) {
				canSetMultiplierModifier = false;
			}
			assert.equal(canSetMultiplierModifier, true, "Owner can't set multiplier modifier");
			var multiplierModifier = await aoearning.multiplierModifier();
			assert.equal(
				multiplierModifier.toString(),
				1000000,
				"Contract has incorrect multiplier modifier after owner set multiplier modifier"
			);
		});

		it("only owner can call escape hatch", async function() {
			var canEscapeHatch;
			try {
				await aoearning.escapeHatch({ from: account1 });
				canEscapeHatch = true;
			} catch (e) {
				canEscapeHatch = false;
			}
			assert.notEqual(canEscapeHatch, true, "Non-owner can call escape hatch");
			try {
				await aoearning.escapeHatch({ from: owner });
				canEscapeHatch = true;
			} catch (e) {
				canEscapeHatch = false;
			}
			assert.equal(canEscapeHatch, true, "Owner can't call escape hatch");
			var killed = await aoearning.killed();
			assert.equal(killed, true, "Contract has incorrect killed value after owner call escape hatch");
		});
	});

	contract("Stake, Unstake & Buy Content Function Tests", function() {
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
			contentHost3Price;

		var stakeContent = async function(account, networkIntegerAmount, networkFractionAmount, denomination, primordialAmount) {
			var accountBalanceBefore = await aotoken.balanceOf(account);
			var accountStakedBalanceBefore = await aotoken.stakedBalance(account);
			var accountWeightedIndexBefore = await aotoken.weightedIndexByAddress(account);
			var accountPrimordialBalanceBefore = await aotoken.icoBalanceOf(account);
			var accountPrimordialStakedBalanceBefore = await aotoken.icoStakedBalance(account, accountWeightedIndexBefore.toNumber());

			var canStake, content, stakedContent, contentHost, storeContentEvent, stakeContentEvent, hostContentEvent;
			try {
				var result = await aocontent.stakeContent(
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
				primordialAmount ? accountWeightedIndexBefore.toString() : 0,
				"stakedContentById returns incorrect primordialWeightedIndex"
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
			var accountWeightedIndexAfter = await aotoken.weightedIndexByAddress(account);
			var accountPrimordialBalanceAfter = await aotoken.icoBalanceOf(account);
			var accountPrimordialStakedBalanceAfter = await aotoken.icoStakedBalance(account, accountWeightedIndexAfter.toNumber());

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
				accountWeightedIndexAfter.toString(),
				accountWeightedIndexBefore.toString(),
				"account has incorrect weighted index after staking"
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
			var accountWeightedIndexBefore = await aotoken.weightedIndexByAddress(account);
			var accountPrimordialBalanceBefore = await aotoken.icoBalanceOf(account);
			var accountPrimordialStakedBalanceBefore = await aotoken.icoStakedBalance(account, stakedContentBefore[4].toString());

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
			var accountWeightedIndexAfter = await aotoken.weightedIndexByAddress(account);
			var accountPrimordialBalanceAfter = await aotoken.icoBalanceOf(account);
			var accountPrimordialStakedBalanceAfter = await aotoken.icoStakedBalance(account, stakedContentAfter[4].toString());

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
				"Staked content has incorrect primordialWeightedIndex after unstaking"
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
				accountWeightedIndexAfter.toString(),
				accountWeightedIndexBefore.toString(),
				"Account has incorrect weighted index after unstaking"
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
			var accountWeightedIndexBefore = await aotoken.weightedIndexByAddress(account);
			var accountPrimordialBalanceBefore = await aotoken.icoBalanceOf(account);
			var accountPrimordialStakedBalanceBefore = await aotoken.icoStakedBalance(account, accountWeightedIndexBefore.toString());

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
			var accountWeightedIndexAfter = await aotoken.weightedIndexByAddress(account);
			var accountPrimordialBalanceAfter = await aotoken.icoBalanceOf(account);
			var accountPrimordialStakedBalanceAfter = await aotoken.icoStakedBalance(account, stakedContentAfter[4].toString());

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
				primordialAmount ? accountWeightedIndexBefore.toString() : stakedContentBefore[4].toString(),
				"stakedContentById returns incorrect primordialWeightedIndex"
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
				accountWeightedIndexAfter.toString(),
				accountWeightedIndexBefore.toString(),
				"account has incorrect weighted index after staking"
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
			await aotoken.mintToken(account1, 10 ** 9, { from: owner }); // 1,000,000,000 AO Token
			// Buy 2 lots so that we can test avg weighted index
			await aotoken.buyIcoToken({ from: account1, value: 50000000000 });
			await aotoken.buyIcoToken({ from: account1, value: 50000000000 });

			// Let's give account2 some tokens
			await aotoken.mintToken(account2, 10 ** 9, { from: owner }); // 1,000,000,000 AO Token
		});

		it("stakeContent() - should NOT stake content if params provided are not valid", async function() {
			var canStake;
			try {
				await aocontent.stakeContent(1, 0, "mega", 0, "", encChallenge, contentDatKey, metadataDatKey, fileSize, profitPercentage, {
					from: account1
				});
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though it's missing baseChallenge");

			try {
				await aocontent.stakeContent(
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
				await aocontent.stakeContent(1, 0, "mega", 0, baseChallenge, encChallenge, "", metadataDatKey, fileSize, profitPercentage, {
					from: account1
				});
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though it's missing contentDatKey");
			try {
				await aocontent.stakeContent(1, 0, "mega", 0, baseChallenge, encChallenge, contentDatKey, "", fileSize, profitPercentage, {
					from: account1
				});
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though it's missing metadataDatKey");
			try {
				await aocontent.stakeContent(
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
				await aocontent.stakeContent(
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
				await aocontent.stakeContent(
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
				await aocontent.stakeContent(
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
					await aocontent.setProfitPercentage(stakeId, 400000, { from: account1 });
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
				var accountWeightedIndexBefore = await aotoken.weightedIndexByAddress(account);
				var accountPrimordialBalanceBefore = await aotoken.icoBalanceOf(account);
				var accountPrimordialStakedBalanceBefore = await aotoken.icoStakedBalance(account, stakedContentBefore[4].toString());

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
				var accountWeightedIndexAfter = await aotoken.weightedIndexByAddress(account);
				var accountPrimordialBalanceAfter = await aotoken.icoBalanceOf(account);
				var accountPrimordialStakedBalanceAfter = await aotoken.icoStakedBalance(account, stakedContentBefore[4].toString());

				assert.equal(stakedContentAfter[2].toString(), 0, "Staked content has incorrect networkAmount after unstaking");
				assert.equal(stakedContentAfter[3].toString(), 0, "Staked content has incorrect primordialAmount after unstaking");
				assert.equal(stakedContentAfter[4].toString(), 0, "Staked content has incorrect primordialWeightedIndex after unstaking");
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
					accountWeightedIndexAfter.toString(),
					accountWeightedIndexBefore.toString(),
					"Account has incorrect weighted index after unstaking"
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
			var buyContent = async function(account, contentHostId) {
				var canBuyContent;
				try {
					await aocontent.buyContent(contentHostId, 10, 0, "ao", { from: account });
					canBuyContent = true;
				} catch (e) {
					canBuyContent = false;
				}
				assert.notEqual(canBuyContent, true, "Account can buy content even though sent tokens < price");
			};
			await buyContent(account2, contentHostId1);
			await buyContent(account2, contentHostId2);
			await buyContent(account2, contentHostId3);
		});

		it("buyContent() - should NOT be able to buy content if account does not have enough balance", async function() {
			var buyContent = async function(account, contentHostId) {
				var canBuyContent;
				try {
					await aocontent.buyContent(contentHostId, 5, 0, "mega", { from: account });
					canBuyContent = true;
				} catch (e) {
					canBuyContent = false;
				}
				assert.notEqual(canBuyContent, true, "Account can buy content even though account does not have enough balance");
			};
			await buyContent(account3, contentHostId1);
			await buyContent(account3, contentHostId2);
			await buyContent(account3, contentHostId3);
		});

		it("buyContent() - should be able to buy content", async function() {
			var accountBalanceBefore = await aotoken.balanceOf(account2);

			var price = await aocontent.contentHostPrice(contentHostId1);
			var inflationRate = await aoearning.inflationRate();
			var foundationCut = await aoearning.foundationCut();
			var multiplierModifier = await aoearning.multiplierModifier();
			var percentageDivisor = await aoearning.PERCENTAGE_DIVISOR();
			var weightedIndexDivisor = await aoearning.WEIGHTED_INDEX_DIVISOR();
			var stakedContent = await aocontent.stakedContentById(stakeId1);
			var stakedNetworkAmount = stakedContent[2];
			var stakedPrimordialAmount = stakedContent[3];
			var stakedPrimordialWeightedIndex = stakedContent[4];
			var profitPercentage = stakedContent[5];

			var canBuyContent, buyContentEvent, purchaseId, purchaseReceipt, stakeEarning, hostEarning, foundationEarning;
			try {
				var result = await aocontent.buyContent(contentHostId1, 3, 0, "mega", { from: account2 });
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
			var accountBalanceAfter = await aotoken.balanceOf(account2);
			assert.equal(
				accountBalanceAfter.toString(),
				accountBalanceBefore.minus(price).toString(),
				"Account has incorrect balance after buying content"
			);

			// Calculate earning
		});
	});
});
