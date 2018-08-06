var AOContent = artifacts.require("./AOContent.sol");
var AOToken = artifacts.require("./AOToken.sol");
var AOKilo = artifacts.require("./AOKilo.sol");
var AOMega = artifacts.require("./AOMega.sol");
var AOGiga = artifacts.require("./AOGiga.sol");
var AOTera = artifacts.require("./AOTera.sol");
var AOPeta = artifacts.require("./AOPeta.sol");
var AOExa = artifacts.require("./AOExa.sol");
var AOZetta = artifacts.require("./AOZetta.sol");
var AOYotta = artifacts.require("./AOYotta.sol");
var AOXona = artifacts.require("./AOXona.sol");
var AOTreasury = artifacts.require("./AOTreasury.sol");

contract("AOContent", function(accounts) {
	var aocontent,
		aotoken,
		aokilo,
		aomega,
		aogiga,
		aotera,
		aopeta,
		aoexa,
		aozetta,
		aoyotta,
		aoxona,
		aotokendecimals,
		aokilodecimals,
		aomegadecimals,
		aogigadecimals,
		aoteradecimals,
		aopetadecimals,
		aoexadecimals,
		aozettadecimals,
		aoyottadecimals,
		aoxonadecimals,
		aotreasury;
	var owner = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var datKey = "7bde24fb38d6e316ec48874c937f4582f3a494df1ecf387e6edb2e25bff700f7";
	var fileSize = 1000000; // 1000000 bytes = min 1000000 AO
	var profitPercentage = 600000; // 60%

	before(async function() {
		aocontent = await AOContent.deployed();
		aotoken = await AOToken.deployed();
		aokilo = await AOKilo.deployed();
		aomega = await AOMega.deployed();
		aogiga = await AOGiga.deployed();
		aotera = await AOTera.deployed();
		aopeta = await AOPeta.deployed();
		aoexa = await AOExa.deployed();
		aozetta = await AOZetta.deployed();
		aoyotta = await AOYotta.deployed();
		aoxona = await AOXona.deployed();
		aotreasury = await AOTreasury.deployed();

		// Get the decimals
		aotokendecimals = await aotoken.decimals();
		aokilodecimals = await aokilo.decimals();
		aomegadecimals = await aomega.decimals();
		aogigadecimals = await aogiga.decimals();
		aoteradecimals = await aotera.decimals();
		aopetadecimals = await aopeta.decimals();
		aoexadecimals = await aoexa.decimals();
		aozettadecimals = await aozetta.decimals();
		aoyottadecimals = await aoyotta.decimals();
		aoxonadecimals = await aoxona.decimals();
	});
	contract("Owner Only Function Tests", function() {
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
	contract("Staking Function Tests", function() {
		var stakeId1, stakeId2, stakeId3;

		before(async function() {
			// Let's give account1 some tokens
			await aotoken.mintToken(account1, 100000, { from: owner }); // 100,000 AO Token
			// Buy 2 lots so that we can test avg weighted index
			await aotoken.buyIcoToken({ from: account1, value: 50000000000 });
			await aotoken.buyIcoToken({ from: account1, value: 50000000000 });
			await aokilo.mintToken(account1, 2 * 10 ** aokilodecimals.toNumber(), { from: owner }); // 2 AO Kilo
			await aomega.mintToken(account1, 5 * 10 ** aomegadecimals.toNumber(), { from: owner }); // 5 AO Mega
		});

		it("stakeContent() - should NOT stake content if datKey is not provided", async function() {
			var canStake;
			try {
				await aocontent.stakeContent(1, 0, "kilo", 0, "", fileSize, profitPercentage, { from: account1 });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though it's missing datKey");
		});

		it("stakeContent() - should NOT stake content if fileSize is 0", async function() {
			var canStake;
			try {
				await aocontent.stakeContent(1, 0, "kilo", 0, datKey, 0, profitPercentage, { from: account1 });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though it's missing fileSize");
		});

		it("stakeContent() - should NOT stake content if token amount is less than fileSize", async function() {
			var stakeContent = async function(networkIntegerAmount, networkFractionAmount, denomination, primordialAmount) {
				var canStake;
				try {
					await aocontent.stakeContent(
						networkIntegerAmount,
						networkFractionAmount,
						denomination,
						primordialAmount,
						datKey,
						fileSize,
						profitPercentage,
						{ from: account1 }
					);
					canStake = true;
				} catch (e) {
					canStake = false;
				}
				assert.notEqual(canStake, true, "account1 can stake content even though token amount is less than fileSize");
			};

			await stakeContent(100, 0, "ao", 0);
			await stakeContent(10, 0, "ao", 50);
			await stakeContent(1, 5, "kilo", 50);
			await stakeContent(0, 0, "", 150);
		});

		it("stakeContent() - should NOT stake content if account does not have enough balance", async function() {
			var stakeContent = async function(networkIntegerAmount, networkFractionAmount, denomination, primordialAmount) {
				var canStake;
				try {
					await aocontent.stakeContent(
						networkIntegerAmount,
						networkFractionAmount,
						denomination,
						primordialAmount,
						datKey,
						fileSize,
						profitPercentage,
						{ from: account1 }
					);
					canStake = true;
				} catch (e) {
					canStake = false;
				}
				assert.notEqual(canStake, true, "account1 can stake content even though account1 does not have enough balance");
			};

			await stakeContent(100000000, 0, "ao", 0);
			await stakeContent(10, 5, "kilo", 0);
			await stakeContent(10, 0, "mega", 500);
			await stakeContent(0, 0, "", 5000000000000);
		});

		it("stakeContent() - should NOT stake content if profit percentage is more than 100%", async function() {
			var stakeContent = async function(networkIntegerAmount, networkFractionAmount, denomination, primordialAmount) {
				var canStake;
				try {
					await aocontent.stakeContent(
						networkIntegerAmount,
						networkFractionAmount,
						denomination,
						primordialAmount,
						datKey,
						fileSize,
						1100000,
						{ from: account1 }
					);
					canStake = true;
				} catch (e) {
					canStake = false;
				}
				assert.notEqual(canStake, true, "account1 can stake content even though profit percentage is more than 100%");
			};
			await stakeContent(1000000, 0, "ao", 0);
			await stakeContent(2, 0, "kilo", 100);
			await stakeContent(1, 5, "mega", 100);
			await stakeContent(0, 0, "", 2000000);
		});

		it("stakeContent() - should be able to stake content with only network tokens", async function() {
			var account1TotalNetworkBalanceBefore = await aotreasury.totalNetworkBalanceOf(account1);
			var account1TotalNetworkStakedBalanceBefore = await aotreasury.totalNetworkStakedBalanceOf(account1);
			var account1MegaBalanceBefore = await aomega.balanceOf(account1);
			var account1KiloBalanceBefore = await aokilo.balanceOf(account1);

			var canStake, stakedContent;
			try {
				var result = await aocontent.stakeContent(5, 1000, "mega", 0, datKey, fileSize, profitPercentage, { from: account1 });
				stakeId1 = result.logs[0].args.stakeId;
				stakedContent = await aocontent.stakedContentById(stakeId1);
				canStake = true;
			} catch (e) {
				canStake = false;
				stakeId1 = null;
				stakedContent = null;
			}
			var networkAmount = await aotreasury.toBase(5, 1000, "mega");
			assert.equal(canStake, true, "account1 can't stake content even though enough network tokens were sent");
			assert.notEqual(stakeId1, null, "Unable to determine the stakeID from the log after staking content");
			assert.equal(stakedContent[0], account1, "stakedContentById returns incorrect stakeOwner");
			assert.equal(stakedContent[1].toString(), networkAmount.toString(), "stakedContentById returns incorrect networkAmount");
			assert.equal(stakedContent[2].toString(), 0, "stakedContentById returns incorrect primordialAmount");
			assert.equal(stakedContent[3].toString(), 0, "stakedContentById returns incorrect primordialWeightedIndex");
			assert.equal(stakedContent[4], datKey, "stakedContentById returns incorrect datKey");
			assert.equal(stakedContent[5].toString(), fileSize, "stakedContentById returns incorrect fileSize");
			assert.equal(stakedContent[6].toString(), profitPercentage, "stakedContentById returns incorrect profitPercentage");
			assert.equal(stakedContent[7], true, "stakedContentById returns incorrect status");

			var account1TotalNetworkBalanceAfter = await aotreasury.totalNetworkBalanceOf(account1);
			var account1TotalNetworkStakedBalanceAfter = await aotreasury.totalNetworkStakedBalanceOf(account1);
			var account1MegaBalanceAfter = await aomega.balanceOf(account1);
			var account1KiloBalanceAfter = await aokilo.balanceOf(account1);

			assert.equal(
				account1TotalNetworkBalanceAfter.toString(),
				account1TotalNetworkBalanceBefore.minus(networkAmount).toString(),
				"account1 has incorrect balance after staking"
			);
			assert.equal(
				account1TotalNetworkStakedBalanceAfter.toString(),
				account1TotalNetworkStakedBalanceBefore.plus(networkAmount).toString(),
				"account1 has incorrect staked balance after staking"
			);
			assert.equal(
				account1MegaBalanceAfter.toString(),
				account1MegaBalanceBefore.minus(5 * 10 ** aomegadecimals.toNumber()).toString(),
				"account1 has incorrect AO Mega balance after staking"
			);
			assert.equal(
				account1KiloBalanceAfter.toString(),
				account1KiloBalanceBefore.minus(1 * 10 ** aokilodecimals.toNumber()).toString(),
				"account1 has incorrect AO Kilo balance after staking"
			);
		});

		it("stakeContent() - should be able to stake content with only primordial tokens", async function() {
			var primordialAmount = 1000100;
			var account1WeightedIndexBefore = await aotoken.weightedIndexByAddress(account1);
			var account1PrimordialBalanceBefore = await aotoken.icoBalanceOf(account1);
			var account1PrimordialStakedBalanceBefore = await aotoken.icoStakedBalance(account1, account1WeightedIndexBefore.toNumber());

			var canStake, stakedContent;
			try {
				var result = await aocontent.stakeContent(0, 0, "", primordialAmount, datKey, fileSize, profitPercentage, {
					from: account1
				});
				stakeId2 = result.logs[0].args.stakeId;
				stakedContent = await aocontent.stakedContentById(stakeId2);
				canStake = true;
			} catch (e) {
				canStake = false;
				stakeId2 = null;
				stakedContent = null;
			}
			assert.equal(canStake, true, "account1 can't stake content even though enough AO Tokens were sent");
			assert.notEqual(stakeId2, null, "Unable to determine the stakeID from the log after staking content");
			assert.equal(stakedContent[0], account1, "stakedContentById returns incorrect stakeOwner");
			assert.equal(stakedContent[1].toString(), 0, "stakedContentById returns incorrect networkAmount");
			assert.equal(stakedContent[2].toString(), primordialAmount, "stakedContentById returns incorrect primordialAmount");
			assert.equal(
				stakedContent[3].toString(),
				account1WeightedIndexBefore.toString(),
				"stakedContentById returns incorrect primordialWeightedIndex"
			);
			assert.equal(stakedContent[4], datKey, "stakedContentById returns incorrect datKey");
			assert.equal(stakedContent[5].toString(), fileSize, "stakedContentById returns incorrect fileSize");
			assert.equal(stakedContent[6].toString(), profitPercentage, "stakedContentById returns incorrect profitPercentage");
			assert.equal(stakedContent[7], true, "stakedContentById returns incorrect status");

			var account1WeightedIndexAfter = await aotoken.weightedIndexByAddress(account1);
			var account1PrimordialBalanceAfter = await aotoken.icoBalanceOf(account1);
			var account1PrimordialStakedBalanceAfter = await aotoken.icoStakedBalance(account1, stakedContent[3].toString());

			assert.equal(
				account1WeightedIndexAfter.toNumber(),
				account1WeightedIndexBefore.toNumber(),
				"account1 has incorrect weighted index after staking"
			);
			assert.equal(
				account1PrimordialBalanceAfter.toString(),
				account1PrimordialBalanceBefore.minus(primordialAmount).toString(),
				"account1 has incorrect primordial balance after staking"
			);
			assert.equal(
				account1PrimordialStakedBalanceAfter.toString(),
				account1PrimordialStakedBalanceBefore.plus(primordialAmount).toString(),
				"account1 has incorrect primordial staked balance after staking"
			);
		});

		it("stakeContent() - should be able to stake content with both network Tokens and primordial tokens", async function() {
			await aokilo.mintToken(account1, 2 * 10 ** aokilodecimals.toNumber(), { from: owner }); // 2 AO Kilo
			await aomega.mintToken(account1, 5 * 10 ** aomegadecimals.toNumber(), { from: owner }); // 5 AO Mega

			// Stake 5.002 AO Mega and 1,000,000 Primordial
			var networkIntegerAmount = 5;
			var networkFractionAmount = 2000;
			var denomination = "mega";
			var primordialAmount = 1000000;
			var account1TotalNetworkBalanceBefore = await aotreasury.totalNetworkBalanceOf(account1);
			var account1TotalNetworkStakedBalanceBefore = await aotreasury.totalNetworkStakedBalanceOf(account1);
			var account1MegaBalanceBefore = await aomega.balanceOf(account1);
			var account1KiloBalanceBefore = await aokilo.balanceOf(account1);
			var account1WeightedIndexBefore = await aotoken.weightedIndexByAddress(account1);
			var account1PrimordialBalanceBefore = await aotoken.icoBalanceOf(account1);
			var account1PrimordialStakedBalanceBefore = await aotoken.icoStakedBalance(account1, account1WeightedIndexBefore.toNumber());

			var canStake, stakedContent;
			try {
				var result = await aocontent.stakeContent(
					networkIntegerAmount,
					networkFractionAmount,
					denomination,
					primordialAmount,
					datKey,
					fileSize,
					profitPercentage,
					{ from: account1 }
				);
				stakeId3 = result.logs[0].args.stakeId;
				stakedContent = await aocontent.stakedContentById(stakeId3);
				canStake = true;
			} catch (e) {
				canStake = false;
				stakeId3 = null;
				stakedContent = null;
			}
			var networkAmount = await aotreasury.toBase(networkIntegerAmount, networkFractionAmount, denomination);
			assert.equal(canStake, true, "account1 can't stake content even though enough network tokens were sent");
			assert.notEqual(stakeId3, null, "Unable to determine the stakeID from the log after staking content");
			assert.equal(stakedContent[0], account1, "stakedContentById returns incorrect stakeOwner");
			assert.equal(stakedContent[1].toString(), networkAmount.toString(), "stakedContentById returns incorrect networkAmount");
			assert.equal(stakedContent[2].toString(), primordialAmount, "stakedContentById returns incorrect primordialAmount");
			assert.equal(
				stakedContent[3].toString(),
				account1WeightedIndexBefore.toString(),
				"stakedContentById returns incorrect primordialWeightedIndex"
			);
			assert.equal(stakedContent[4], datKey, "stakedContentById returns incorrect datKey");
			assert.equal(stakedContent[5].toString(), fileSize, "stakedContentById returns incorrect fileSize");
			assert.equal(stakedContent[6].toString(), profitPercentage, "stakedContentById returns incorrect profitPercentage");
			assert.equal(stakedContent[7], true, "stakedContentById returns incorrect status");

			var account1TotalNetworkBalanceAfter = await aotreasury.totalNetworkBalanceOf(account1);
			var account1TotalNetworkStakedBalanceAfter = await aotreasury.totalNetworkStakedBalanceOf(account1);
			var account1MegaBalanceAfter = await aomega.balanceOf(account1);
			var account1KiloBalanceAfter = await aokilo.balanceOf(account1);

			assert.equal(
				account1TotalNetworkBalanceAfter.toString(),
				account1TotalNetworkBalanceBefore.minus(networkAmount).toString(),
				"account1 has incorrect balance after staking"
			);
			assert.equal(
				account1TotalNetworkStakedBalanceAfter.toString(),
				account1TotalNetworkStakedBalanceBefore.plus(networkAmount).toString(),
				"account1 has incorrect staked balance after staking"
			);
			assert.equal(
				account1MegaBalanceAfter.toString(),
				account1MegaBalanceBefore.minus(5 * 10 ** aomegadecimals.toNumber()).toString(),
				"account1 has incorrect AO Mega balance after staking"
			);
			assert.equal(
				account1KiloBalanceAfter.toString(),
				account1KiloBalanceBefore.minus(2 * 10 ** aokilodecimals.toNumber()).toString(),
				"account1 has incorrect AO Kilo balance after staking"
			);
			var account1WeightedIndexAfter = await aotoken.weightedIndexByAddress(account1);
			var account1PrimordialBalanceAfter = await aotoken.icoBalanceOf(account1);
			var account1PrimordialStakedBalanceAfter = await aotoken.icoStakedBalance(account1, stakedContent[3].toString());

			assert.equal(
				account1WeightedIndexAfter.toNumber(),
				account1WeightedIndexBefore.toNumber(),
				"account1 has incorrect weighted index after staking"
			);
			assert.equal(
				account1PrimordialBalanceAfter.toString(),
				account1PrimordialBalanceBefore.minus(primordialAmount).toString(),
				"account1 has incorrect primordial balance after staking"
			);
			assert.equal(
				account1PrimordialStakedBalanceAfter.toString(),
				account1PrimordialStakedBalanceBefore.plus(primordialAmount).toString(),
				"account1 has incorrect primordial staked balance after staking"
			);
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
				primordialAmoun
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
				primordialAmoun
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
				assert.notEqual(canUnstakePartial, true, "Stake owner can partially unstake more tokens than it's existing balance.");
			};

			await unstakePartialContent(stakeId1, 10, 10, "giga", 0);
			await unstakePartialContent(stakeId2, 0, 0, "", 10000000);
			await unstakePartialContent(stakeId3, 10, 10, "giga", 10);
		});

		it("unstakePartialContent() - should be able to partially unstake only network token from existing staked content", async function() {
			var unstakePartialContent = async function(stakeId, networkIntegerAmount, networkFractionAmount, denomination) {
				var stakedContentBefore = await aocontent.stakedContentById(stakeId);
				var account1TotalNetworkBalanceBefore = await aotreasury.totalNetworkBalanceOf(account1);
				var account1TotalNetworkStakedBalanceBefore = await aotreasury.totalNetworkStakedBalanceOf(account1);
				var networkAmount = await aotreasury.toBase(networkIntegerAmount, networkFractionAmount, denomination);

				var canUnstakePartial;
				try {
					await aocontent.unstakePartialContent(stakeId, networkIntegerAmount, networkFractionAmount, denomination, 0, {
						from: account1
					});

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
				var account1TotalNetworkBalanceAfter = await aotreasury.totalNetworkBalanceOf(account1);
				var account1TotalNetworkStakedBalanceAfter = await aotreasury.totalNetworkStakedBalanceOf(account1);

				assert.equal(
					stakedContentAfter[1].toString(),
					stakedContentBefore[1].minus(networkAmount).toString(),
					"Staked content has incorrect networkAmount after unstaking"
				);
				assert.equal(
					stakedContentAfter[2].toString(),
					stakedContentBefore[2].toString(),
					"Staked content has incorrect primordialAmount after unstaking"
				);
				assert.equal(
					stakedContentAfter[3].toString(),
					stakedContentBefore[3].toString(),
					"Staked content has incorrect primordialWeightedIndex after unstaking"
				);
				assert.equal(stakedContentAfter[7], true, "Staked content has incorrect status after unstaking");
				assert.equal(
					account1TotalNetworkBalanceAfter.toString(),
					account1TotalNetworkBalanceBefore.plus(networkAmount).toString(),
					"Account1 has incorrect balance after unstaking"
				);
				assert.equal(
					account1TotalNetworkStakedBalanceAfter.toString(),
					account1TotalNetworkStakedBalanceBefore.minus(networkAmount).toString(),
					"Account1 has incorrect staked balance after unstaking"
				);
			};

			await unstakePartialContent(stakeId1, 10, 10, "kilo");
			await unstakePartialContent(stakeId3, 10, 10, "kilo");
		});

		it("unstakePartialContent() - should be able to partially unstake only primordial token from existing staked content", async function() {
			var primordialAmount = 10;
			var unstakePartialContent = async function(stakeId) {
				var stakedContentBefore = await aocontent.stakedContentById(stakeId);
				var account1TotalNetworkBalanceBefore = await aotreasury.totalNetworkBalanceOf(account1);
				var account1TotalNetworkStakedBalanceBefore = await aotreasury.totalNetworkStakedBalanceOf(account1);
				var account1TotalPrimordialBalanceBefore = await aotreasury.totalPrimordialBalanceOf(account1);
				var account1TotalPrimordialStakedBalanceBefore = await aotreasury.totalPrimordialStakedBalanceOf(
					account1,
					stakedContentBefore[3].toString()
				);
				var account1WeightedIndexBefore = await aotoken.weightedIndexByAddress(account1);

				var canUnstakePartial;
				try {
					await aocontent.unstakePartialContent(stakeId, 0, 0, "", primordialAmount, { from: account1 });
					canUnstakePartial = true;
				} catch (e) {
					canUnstakePartial = false;
				}
				assert.equal(
					canUnstakePartial,
					true,
					"Stake owner address unable to partially unstake primordial token from existing staked content"
				);

				var stakedContentAfter = await aocontent.stakedContentById(stakeId);
				var account1TotalNetworkBalanceAfter = await aotreasury.totalNetworkBalanceOf(account1);
				var account1TotalNetworkStakedBalanceAfter = await aotreasury.totalNetworkStakedBalanceOf(account1);
				var account1TotalPrimordialBalanceAfter = await aotreasury.totalPrimordialBalanceOf(account1);
				var account1TotalPrimordialStakedBalanceAfter = await aotreasury.totalPrimordialStakedBalanceOf(
					account1,
					stakedContentAfter[3].toString()
				);
				var account1WeightedIndexAfter = await aotoken.weightedIndexByAddress(account1);

				assert.equal(
					stakedContentAfter[1].toString(),
					stakedContentBefore[1].toString(),
					"Staked content has incorrect networkAmount after unstaking"
				);
				assert.equal(
					stakedContentAfter[2].toString(),
					stakedContentBefore[2].minus(primordialAmount).toString(),
					"Staked content has incorrect primordialAmount after unstaking"
				);
				assert.equal(
					stakedContentAfter[3].toString(),
					stakedContentBefore[3].toString(),
					"Staked content has incorrect primordialWeightedIndex after unstaking"
				);
				assert.equal(stakedContentAfter[7], true, "Staked content has incorrect status after unstaking");
				assert.equal(
					account1TotalNetworkBalanceAfter.toString(),
					account1TotalNetworkBalanceBefore.toString(),
					"Account1 has incorrect balance after unstaking"
				);
				assert.equal(
					account1TotalNetworkStakedBalanceAfter.toString(),
					account1TotalNetworkStakedBalanceBefore.toString(),
					"Account1 has incorrect staked balance after unstaking"
				);
				assert.equal(
					account1TotalPrimordialBalanceAfter.toString(),
					account1TotalPrimordialBalanceBefore.plus(primordialAmount).toString(),
					"Account1 has incorrect primordial balance after unstaking"
				);
				assert.equal(
					account1TotalPrimordialStakedBalanceAfter.toString(),
					account1TotalPrimordialStakedBalanceBefore.minus(primordialAmount).toString(),
					"Account1 has incorrect primordial staked balance after unstaking"
				);
				assert.equal(
					account1WeightedIndexAfter.toString(),
					account1WeightedIndexBefore.toString(),
					"Account1 has incorrect weighted index after unstaking"
				);
			};
			await unstakePartialContent(stakeId2);
			await unstakePartialContent(stakeId3);
		});

		it("unstakePartialContent() - should be able to partially unstake both network and primordial token from existing staked content", async function() {
			var unstakePartialContent = async function(
				stakeId,
				networkIntegerAmount,
				networkFractionAmount,
				denomination,
				primordialAmount
			) {
				var stakedContentBefore = await aocontent.stakedContentById(stakeId);
				var account1TotalNetworkBalanceBefore = await aotreasury.totalNetworkBalanceOf(account1);
				var account1TotalNetworkStakedBalanceBefore = await aotreasury.totalNetworkStakedBalanceOf(account1);
				var account1TotalPrimordialBalanceBefore = await aotreasury.totalPrimordialBalanceOf(account1);
				var account1TotalPrimordialStakedBalanceBefore = await aotreasury.totalPrimordialStakedBalanceOf(
					account1,
					stakedContentBefore[3].toString()
				);
				var account1WeightedIndexBefore = await aotoken.weightedIndexByAddress(account1);
				var networkAmount = await aotreasury.toBase(networkIntegerAmount, networkFractionAmount, denomination);

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
				assert.equal(
					canUnstakePartial,
					true,
					"Stake owner address unable to partially unstake network and primordial token from existing staked content"
				);

				var stakedContentAfter = await aocontent.stakedContentById(stakeId);
				var account1TotalNetworkBalanceAfter = await aotreasury.totalNetworkBalanceOf(account1);
				var account1TotalNetworkStakedBalanceAfter = await aotreasury.totalNetworkStakedBalanceOf(account1);
				var account1TotalPrimordialBalanceAfter = await aotreasury.totalPrimordialBalanceOf(account1);
				var account1TotalPrimordialStakedBalanceAfter = await aotreasury.totalPrimordialStakedBalanceOf(
					account1,
					stakedContentAfter[3].toString()
				);
				var account1WeightedIndexAfter = await aotoken.weightedIndexByAddress(account1);

				assert.equal(
					stakedContentAfter[1].toString(),
					stakedContentBefore[1].minus(networkAmount).toString(),
					"Staked content has incorrect networkAmount after unstaking"
				);
				assert.equal(
					stakedContentAfter[2].toString(),
					stakedContentBefore[2].minus(primordialAmount).toString(),
					"Staked content has incorrect primordialAmount after unstaking"
				);
				assert.equal(
					stakedContentAfter[3].toString(),
					stakedContentBefore[3].toString(),
					"Staked content has incorrect primordialWeightedIndex after unstaking"
				);
				assert.equal(stakedContentAfter[7], true, "Staked content has incorrect status after unstaking");
				assert.equal(
					account1TotalNetworkBalanceAfter.toString(),
					account1TotalNetworkBalanceBefore.plus(networkAmount).toString(),
					"Account1 has incorrect balance after unstaking"
				);
				assert.equal(
					account1TotalNetworkStakedBalanceAfter.toString(),
					account1TotalNetworkStakedBalanceBefore.minus(networkAmount).toString(),
					"Account1 has incorrect staked balance after unstaking"
				);
				assert.equal(
					account1TotalPrimordialBalanceAfter.toString(),
					account1TotalPrimordialBalanceBefore.plus(primordialAmount).toString(),
					"Account1 has incorrect primordial balance after unstaking"
				);
				assert.equal(
					account1TotalPrimordialStakedBalanceAfter.toString(),
					account1TotalPrimordialStakedBalanceBefore.minus(primordialAmount).toString(),
					"Account1 has incorrect primordial staked balance after unstaking"
				);
				assert.equal(
					account1WeightedIndexAfter.toString(),
					account1WeightedIndexBefore.toString(),
					"Account1 has incorrect weighted index after unstaking"
				);
			};
			await unstakePartialContent(stakeId3, 10, 10, "kilo", 10);
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
			var unstakeContent = async function(stakeId) {
				var stakedContentBefore = await aocontent.stakedContentById(stakeId);
				var account1TotalNetworkBalanceBefore = await aotreasury.totalNetworkBalanceOf(account1);
				var account1TotalNetworkStakedBalanceBefore = await aotreasury.totalNetworkStakedBalanceOf(account1);
				var account1TotalPrimordialBalanceBefore = await aotreasury.totalPrimordialBalanceOf(account1);
				var account1TotalPrimordialStakedBalanceBefore = await aotreasury.totalPrimordialStakedBalanceOf(
					account1,
					stakedContentBefore[3].toString()
				);
				var account1WeightedIndexBefore = await aotoken.weightedIndexByAddress(account1);
				var networkAmount = stakedContentBefore[1];
				var primordialAmount = stakedContentBefore[2];

				var canUnstake;
				try {
					await aocontent.unstakeContent(stakeId, { from: account1 });
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
				var account1TotalNetworkBalanceAfter = await aotreasury.totalNetworkBalanceOf(account1);
				var account1TotalNetworkStakedBalanceAfter = await aotreasury.totalNetworkStakedBalanceOf(account1);
				var account1TotalPrimordialBalanceAfter = await aotreasury.totalPrimordialBalanceOf(account1);
				var account1TotalPrimordialStakedBalanceAfter = await aotreasury.totalPrimordialStakedBalanceOf(
					account1,
					stakedContentBefore[3].toString()
				);
				var account1WeightedIndexAfter = await aotoken.weightedIndexByAddress(account1);

				assert.equal(stakedContentAfter[1].toString(), 0, "Staked content has incorrect networkAmount after unstaking");
				assert.equal(stakedContentAfter[2].toString(), 0, "Staked content has incorrect primordialAmount after unstaking");
				assert.equal(stakedContentAfter[3].toString(), 0, "Staked content has incorrect primordialWeightedIndex after unstaking");
				assert.equal(stakedContentAfter[7], false, "Staked content has incorrect status after unstaking");
				assert.equal(
					account1TotalNetworkBalanceAfter.toString(),
					account1TotalNetworkBalanceBefore.plus(networkAmount).toString(),
					"Account1 has incorrect balance after unstaking"
				);
				assert.equal(
					account1TotalNetworkStakedBalanceAfter.toString(),
					account1TotalNetworkStakedBalanceBefore.minus(networkAmount).toString(),
					"Account1 has incorrect staked balance after unstaking"
				);
				assert.equal(
					account1TotalPrimordialBalanceAfter.toString(),
					account1TotalPrimordialBalanceBefore.plus(primordialAmount).toString(),
					"Account1 has incorrect primordial balance after unstaking"
				);
				assert.equal(
					account1TotalPrimordialStakedBalanceAfter.toString(),
					account1TotalPrimordialStakedBalanceBefore.minus(primordialAmount).toString(),
					"Account1 has incorrect primordial staked balance after unstaking"
				);
				assert.equal(
					account1WeightedIndexAfter.toString(),
					account1WeightedIndexBefore.toString(),
					"Account1 has incorrect weighted index after unstaking"
				);
			};

			await unstakeContent(stakeId1);
			await unstakeContent(stakeId2);
			await unstakeContent(stakeId3);
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
			var stakeExistingContent = async function(stakeId, networkIntegerAmount, networkFractionAmount, denomination) {
				var stakedContentBefore = await aocontent.stakedContentById(stakeId);
				var account1TotalNetworkBalanceBefore = await aotreasury.totalNetworkBalanceOf(account1);
				var account1TotalNetworkStakedBalanceBefore = await aotreasury.totalNetworkStakedBalanceOf(account1);
				var networkAmount = await aotreasury.toBase(networkIntegerAmount, networkFractionAmount, denomination);

				var canStakeExisting;
				try {
					await aocontent.stakeExistingContent(stakeId, networkIntegerAmount, networkFractionAmount, denomination, 0, {
						from: account1
					});
					canStakeExisting = true;
				} catch (e) {
					canStakeExisting = false;
				}
				assert.equal(canStakeExisting, true, "Stake owner can't stake only network tokens on existing staked content");

				var stakedContentAfter = await aocontent.stakedContentById(stakeId);
				var account1TotalNetworkBalanceAfter = await aotreasury.totalNetworkBalanceOf(account1);
				var account1TotalNetworkStakedBalanceAfter = await aotreasury.totalNetworkStakedBalanceOf(account1);

				assert.equal(
					stakedContentAfter[1].toString(),
					stakedContentBefore[1].plus(networkAmount).toString(),
					"Staked content has incorrect networkAmount after staking"
				);
				assert.equal(
					stakedContentAfter[2].toString(),
					stakedContentBefore[2].toString(),
					"Staked content has incorrect primordialAmount after staking"
				);
				assert.equal(
					stakedContentAfter[3].toString(),
					stakedContentBefore[3].toString(),
					"Staked content has incorrect primordialWeightedIndex after staking"
				);
				assert.equal(stakedContentAfter[7], true, "Staked content has incorrect status after staking");
				assert.equal(
					account1TotalNetworkBalanceAfter.toString(),
					account1TotalNetworkBalanceBefore.minus(networkAmount).toString(),
					"Account1 has incorrect balance after staking"
				);
				assert.equal(
					account1TotalNetworkStakedBalanceAfter.toString(),
					account1TotalNetworkStakedBalanceBefore.plus(networkAmount).toString(),
					"Account1 has incorrect staked balance after staking"
				);
			};

			await stakeExistingContent(stakeId1, 2, 0, "mega");
			await stakeExistingContent(stakeId2, 1, 100, "mega");
			await stakeExistingContent(stakeId3, 1, 0, "mega");

			// unstake them again for next test
			await aocontent.unstakeContent(stakeId1, { from: account1 });
			await aocontent.unstakeContent(stakeId2, { from: account1 });
			await aocontent.unstakeContent(stakeId3, { from: account1 });
		});

		it("stakeExistingContent() - should be able to stake only primordial tokens on existing staked content", async function() {
			var stakeExistingContent = async function(stakeId, primordialAmount) {
				var stakedContentBefore = await aocontent.stakedContentById(stakeId);
				var account1TotalNetworkBalanceBefore = await aotreasury.totalNetworkBalanceOf(account1);
				var account1TotalNetworkStakedBalanceBefore = await aotreasury.totalNetworkStakedBalanceOf(account1);
				var account1WeightedIndexBefore = await aotoken.weightedIndexByAddress(account1);
				var account1TotalPrimordialBalanceBefore = await aotreasury.totalPrimordialBalanceOf(account1);
				var account1TotalPrimordialStakedBalanceBefore = await aotreasury.totalPrimordialStakedBalanceOf(
					account1,
					account1WeightedIndexBefore.toString()
				);

				var canStakeExisting;
				try {
					await aocontent.stakeExistingContent(stakeId, 0, 0, "", primordialAmount, { from: account1 });
					canStakeExisting = true;
				} catch (e) {
					canStakeExisting = false;
				}
				assert.equal(canStakeExisting, true, "Stake owner can't stake only primordial tokens on existing staked content");

				var stakedContentAfter = await aocontent.stakedContentById(stakeId);
				var account1TotalNetworkBalanceAfter = await aotreasury.totalNetworkBalanceOf(account1);
				var account1TotalNetworkStakedBalanceAfter = await aotreasury.totalNetworkStakedBalanceOf(account1);
				var account1WeightedIndexAfter = await aotoken.weightedIndexByAddress(account1);
				var account1TotalPrimordialBalanceAfter = await aotreasury.totalPrimordialBalanceOf(account1);
				var account1TotalPrimordialStakedBalanceAfter = await aotreasury.totalPrimordialStakedBalanceOf(
					account1,
					stakedContentAfter[3].toString()
				);

				assert.equal(
					stakedContentAfter[1].toString(),
					stakedContentBefore[1].toString(),
					"Staked content has incorrect networkAmount after staking"
				);
				assert.equal(
					stakedContentAfter[2].toString(),
					stakedContentBefore[2].plus(primordialAmount).toString(),
					"Staked content has incorrect primordialAmount after staking"
				);
				assert.equal(
					stakedContentAfter[3].toString(),
					account1WeightedIndexBefore.toString(),
					"Staked content has incorrect primordialWeightedIndex after staking"
				);
				assert.equal(stakedContentAfter[7], true, "Staked content has incorrect status after staking");
				assert.equal(
					account1TotalNetworkBalanceAfter.toString(),
					account1TotalNetworkBalanceBefore.toString(),
					"Account1 has incorrect balance after staking"
				);
				assert.equal(
					account1TotalNetworkStakedBalanceAfter.toString(),
					account1TotalNetworkStakedBalanceBefore.toString(),
					"Account1 has incorrect staked balance after staking"
				);
				assert.equal(
					account1TotalPrimordialBalanceAfter.toString(),
					account1TotalPrimordialBalanceBefore.minus(primordialAmount).toString(),
					"Account1 has incorrect primordial balance after staking"
				);
				assert.equal(
					account1TotalPrimordialStakedBalanceAfter.toString(),
					account1TotalPrimordialStakedBalanceBefore.plus(primordialAmount).toString(),
					"Account1 has incorrect primordial staked balance after staking"
				);
			};

			await stakeExistingContent(stakeId1, 1000000);
			await stakeExistingContent(stakeId2, 1000100);
			await stakeExistingContent(stakeId3, 2100000);

			// unstake them again for next test
			await aocontent.unstakeContent(stakeId1, { from: account1 });
			await aocontent.unstakeContent(stakeId2, { from: account1 });
			await aocontent.unstakeContent(stakeId3, { from: account1 });
		});

		it("stakeExistingContent() - should be able to stake both network and primordial tokens on existing staked content", async function() {
			var stakeExistingContent = async function(
				stakeId,
				networkIntegerAmount,
				networkFractionAmount,
				denomination,
				primordialAmount
			) {
				var stakedContentBefore = await aocontent.stakedContentById(stakeId);
				var account1TotalNetworkBalanceBefore = await aotreasury.totalNetworkBalanceOf(account1);
				var account1TotalNetworkStakedBalanceBefore = await aotreasury.totalNetworkStakedBalanceOf(account1);
				var account1WeightedIndexBefore = await aotoken.weightedIndexByAddress(account1);
				var account1TotalPrimordialBalanceBefore = await aotreasury.totalPrimordialBalanceOf(account1);
				var account1TotalPrimordialStakedBalanceBefore = await aotreasury.totalPrimordialStakedBalanceOf(
					account1,
					account1WeightedIndexBefore.toString()
				);
				var networkAmount = await aotreasury.toBase(networkIntegerAmount, networkFractionAmount, denomination);

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
				assert.equal(
					canStakeExisting,
					true,
					"Stake owner can't stake both network and primordial tokens on existing staked content"
				);

				var stakedContentAfter = await aocontent.stakedContentById(stakeId);
				var account1TotalNetworkBalanceAfter = await aotreasury.totalNetworkBalanceOf(account1);
				var account1TotalNetworkStakedBalanceAfter = await aotreasury.totalNetworkStakedBalanceOf(account1);
				var account1WeightedIndexAfter = await aotoken.weightedIndexByAddress(account1);
				var account1TotalPrimordialBalanceAfter = await aotreasury.totalPrimordialBalanceOf(account1);
				var account1TotalPrimordialStakedBalanceAfter = await aotreasury.totalPrimordialStakedBalanceOf(
					account1,
					stakedContentAfter[3].toString()
				);

				assert.equal(
					stakedContentAfter[1].toString(),
					stakedContentBefore[1].plus(networkAmount).toString(),
					"Staked content has incorrect networkAmount after staking"
				);
				assert.equal(
					stakedContentAfter[2].toString(),
					stakedContentBefore[2].plus(primordialAmount).toString(),
					"Staked content has incorrect primordialAmount after staking"
				);
				assert.equal(
					stakedContentAfter[3].toString(),
					account1WeightedIndexBefore.toString(),
					"Staked content has incorrect primordialWeightedIndex after staking"
				);
				assert.equal(stakedContentAfter[7], true, "Staked content has incorrect status after staking");
				assert.equal(
					account1TotalNetworkBalanceAfter.toString(),
					account1TotalNetworkBalanceBefore.minus(networkAmount).toString(),
					"Account1 has incorrect balance after staking"
				);
				assert.equal(
					account1TotalNetworkStakedBalanceAfter.toString(),
					account1TotalNetworkStakedBalanceBefore.plus(networkAmount).toString(),
					"Account1 has incorrect staked balance after staking"
				);
				assert.equal(
					account1TotalPrimordialBalanceAfter.toString(),
					account1TotalPrimordialBalanceBefore.minus(primordialAmount).toString(),
					"Account1 has incorrect primordial balance after staking"
				);
				assert.equal(
					account1TotalPrimordialStakedBalanceAfter.toString(),
					account1TotalPrimordialStakedBalanceBefore.plus(primordialAmount).toString(),
					"Account1 has incorrect primordial staked balance after staking"
				);
			};

			await stakeExistingContent(stakeId1, 2, 10, "kilo", 1000000);
			await stakeExistingContent(stakeId2, 1, 0, "mega", 10);
			await stakeExistingContent(stakeId3, 0, 900000, "mega", 110000);

			// Should be able to stake again on active staked content
			await stakeExistingContent(stakeId1, 0, 500, "kilo", 0);
			await stakeExistingContent(stakeId2, 0, 10, "mega", 1000);
			await stakeExistingContent(stakeId3, 100, 0, "ao", 100);
		});
	});
});
