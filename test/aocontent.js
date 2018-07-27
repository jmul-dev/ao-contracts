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
		aoxonadecimals;
	var owner = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var datKey = "7bde24fb38d6e316ec48874c937f4582f3a494df1ecf387e6edb2e25bff700f7";
	var fileSize = 1000; // 1000 bytes = min 1000 AO

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
		var aotokenStakeId,
			aokiloStakeId,
			aomegaStakeId,
			aogigaStakeId,
			aoteraStakeId,
			aopetaStakeId,
			aoexaStakeId,
			aozettaStakeId,
			aoyottaStakeId,
			aoxonaStakeId;

		before(async function() {
			// Let's give account1 some tokens
			await aotoken.mintToken(account1, 100000, { from: owner });
			// Buy 2 lots so that we can test avg weighted index
			await aotoken.buyIcoToken({ from: account1, value: 500000000 });
			await aotoken.buyIcoToken({ from: account1, value: 500000000 });
			await aokilo.mintToken(account1, 100000 * 10 ** aokilodecimals.toNumber(), { from: owner });
			await aomega.mintToken(account1, 100000 * 10 ** aomegadecimals.toNumber(), { from: owner });
			await aogiga.mintToken(account1, 100000 * 10 ** aogigadecimals.toNumber(), { from: owner });
			await aotera.mintToken(account1, 100000 * 10 ** aoteradecimals.toNumber(), { from: owner });
			await aopeta.mintToken(account1, 100000 * 10 ** aopetadecimals.toNumber(), { from: owner });
			await aoexa.mintToken(account1, 100000 * 10 ** aoexadecimals.toNumber(), { from: owner });
			await aozetta.mintToken(account1, 100000 * 10 ** aozettadecimals.toNumber(), { from: owner });
			await aoyotta.mintToken(account1, 100000 * 10 ** aoyottadecimals.toNumber(), { from: owner });
			await aoxona.mintToken(account1, 100000 * 10 ** aoxonadecimals.toNumber(), { from: owner });
		});

		it("stakeContent() - should NOT stake content if datKey is not provided", async function() {
			var stakeContent = async function(denomination) {
				var canStake;
				try {
					await aocontent.stakeContent(1000, denomination, 0, "", fileSize, { from: account1 });
					canStake = true;
				} catch (e) {
					canStake = false;
				}
				assert.notEqual(canStake, true, "account1 can stake content even though it's missing datKey");
			};

			await stakeContent("ao");
			await stakeContent("kilo");
			await stakeContent("mega");
			await stakeContent("giga");
			await stakeContent("tera");
			await stakeContent("peta");
			await stakeContent("exa");
			await stakeContent("zetta");
			await stakeContent("yotta");
			await stakeContent("xona");
		});

		it("stakeContent() - should NOT stake content if fileSize is 0", async function() {
			var stakeContent = async function(denomination) {
				var canStake;
				try {
					await aocontent.stakeContent(1000, denomination, 0, datKey, 0, { from: account1 });
					canStake = true;
				} catch (e) {
					canStake = false;
				}
				assert.notEqual(canStake, true, "account1 can stake content even though it's missing fileSize");
			};

			await stakeContent("ao");
			await stakeContent("kilo");
			await stakeContent("mega");
			await stakeContent("giga");
			await stakeContent("tera");
			await stakeContent("peta");
			await stakeContent("exa");
			await stakeContent("zetta");
			await stakeContent("yotta");
			await stakeContent("xona");
		});

		it("stakeContent() - should NOT stake content if token amount is less than fileSize", async function() {
			var stakeContent = async function(denomination) {
				var canStake;
				try {
					await aocontent.stakeContent(10, denomination, 0, datKey, fileSize, { from: account1 });
					canStake = true;
				} catch (e) {
					canStake = false;
				}
				assert.notEqual(canStake, true, "account1 can stake content even though token amount is less than fileSize");
				try {
					await aocontent.stakeContent(10, denomination, 100, datKey, fileSize, { from: account1 });
					canStake = true;
				} catch (e) {
					canStake = false;
				}
				assert.notEqual(canStake, true, "account1 can stake content even though token amount is less than fileSize");
			};

			await stakeContent("ao");
			await stakeContent("kilo");
			await stakeContent("mega");
			await stakeContent("giga");
			await stakeContent("tera");
			await stakeContent("peta");
			await stakeContent("exa");
			await stakeContent("zetta");
			await stakeContent("yotta");
			await stakeContent("xona");

			// Test staking only AO ICO tokens
			var canStake;
			try {
				await aocontent.stakeContent(0, "", 50, datKey, fileSize, { from: account1 });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though token amount is less than fileSize");
		});

		it("stakeContent() - should NOT stake content if account does not have enough balance", async function() {
			var stakeContent = async function(denomination) {
				var canStake;
				try {
					await aocontent.stakeContent(10 ** 50, denomination, 0, datKey, fileSize, { from: account1 });
					canStake = true;
				} catch (e) {
					canStake = false;
				}
				assert.notEqual(canStake, true, "account1 can stake content even though account1 does not have enough balance");
			};

			await stakeContent("ao");
			await stakeContent("kilo");
			await stakeContent("mega");
			await stakeContent("giga");
			await stakeContent("tera");
			await stakeContent("peta");
			await stakeContent("exa");
			await stakeContent("zetta");
			await stakeContent("yotta");
			await stakeContent("xona");

			// Test staking only AO ICO tokens
			var canStake;
			try {
				await aocontent.stakeContent(0, "", 1000000, datKey, fileSize, { from: account1 });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "account1 can stake content even though account1 does not have enough AO ICO token balance");
		});

		it("stakeContent() - should be able to stake content with only normal ERC20 AO tokens", async function() {
			var denominationAmount = 1000;
			var stakeContent = async function(denomination, tokenMeta) {
				var account1BalanceBefore = await tokenMeta.balanceOf(account1);
				var account1StakedBalanceBefore = await tokenMeta.stakedBalance(account1);

				var canStake, stakeId, stakedContent;
				try {
					var result = await aocontent.stakeContent(denominationAmount, denomination, 0, datKey, fileSize, { from: account1 });
					stakeId = result.logs[0].args.stakeId;
					stakedContent = await aocontent.stakedContentById(stakeId);
					canStake = true;
				} catch (e) {
					canStake = false;
					stakeId = null;
					stakedContent = null;
				}
				assert.equal(canStake, true, "account1 can't stake content even though enough AO Tokens were sent");
				assert.notEqual(stakeId, null, "Unable to determine the stakeID from the log after staking content");
				assert.equal(stakedContent[0], account1, "stakedContentById returns incorrect stakeOwner");
				assert.equal(stakedContent[1].toString(), denominationAmount, "stakedContentById returns incorrect denominationAmount");
				assert.equal(
					web3.toAscii(stakedContent[2]).replace(/\0/g, ""),
					denomination,
					"stakedContentById returns incorrect denomination"
				);
				assert.equal(stakedContent[3].toString(), 0, "stakedContentById returns incorrect icoTokenAmount");
				assert.equal(stakedContent[4].toString(), 0, "stakedContentById returns incorrect icoTokenWeightedIndex");
				assert.equal(stakedContent[5], datKey, "stakedContentById returns incorrect datKey");
				assert.equal(stakedContent[6].toString(), fileSize, "stakedContentById returns incorrect fileSize");
				assert.equal(stakedContent[7], true, "stakedContentById returns incorrect status");

				var account1BalanceAfter = await tokenMeta.balanceOf(account1);
				var account1StakedBalanceAfter = await tokenMeta.stakedBalance(account1);
				assert.equal(
					account1BalanceAfter.toString(),
					account1BalanceBefore.minus(denominationAmount).toString(),
					"account1 has incorrect balance after staking"
				);
				assert.equal(
					account1StakedBalanceAfter.toString(),
					account1StakedBalanceBefore.plus(denominationAmount).toString(),
					"account1 has incorrect staked balance after staking"
				);

				return stakeId;
			};

			aotokenStakeId = await stakeContent("ao", aotoken);
			aokiloStakeId = await stakeContent("kilo", aokilo);
			aomegaStakeId = await stakeContent("mega", aomega);
			aogigaStakeId = await stakeContent("giga", aogiga);
			aoteraStakeId = await stakeContent("tera", aotera);
			aopetaStakeId = await stakeContent("peta", aopeta);
			aoexaStakeId = await stakeContent("exa", aoexa);
			aozettaStakeId = await stakeContent("zetta", aozetta);
			aoyottaStakeId = await stakeContent("yotta", aoyotta);
			aoxonaStakeId = await stakeContent("xona", aoxona);
		});

		it("stakeContent() - should be able to stake content with only AO ICO tokens", async function() {
			var account1WeightedIndex = await aotoken.weightedIndexByAddress(account1);

			var canStake, stakeId, stakedContent;
			try {
				var result = await aocontent.stakeContent(0, "", 1000, datKey, fileSize, { from: account1 });
				stakeId = result.logs[0].args.stakeId;
				stakedContent = await aocontent.stakedContentById(stakeId);
				canStake = true;
			} catch (e) {
				canStake = false;
				stakeId = null;
				stakedContent = null;
			}
			assert.equal(canStake, true, "account1 can't stake content even though enough AO Tokens were sent");
			assert.notEqual(stakeId, null, "Unable to determine the stakeID from the log after staking content");
			assert.equal(stakedContent[0], account1, "stakedContentById returns incorrect stakeOwner");
			assert.equal(stakedContent[1].toString(), 0, "stakedContentById returns incorrect denominationAmount");
			assert.equal(web3.toAscii(stakedContent[2]).replace(/\0/g, ""), "", "stakedContentById returns incorrect denomination");
			assert.equal(stakedContent[3].toString(), 1000, "stakedContentById returns incorrect icoTokenAmount");
			assert.equal(
				stakedContent[4].toString(),
				account1WeightedIndex.toString(),
				"stakedContentById returns incorrect icoTokenWeightedIndex"
			);
			assert.equal(stakedContent[5], datKey, "stakedContentById returns incorrect datKey");
			assert.equal(stakedContent[6].toString(), fileSize, "stakedContentById returns incorrect fileSize");
			assert.equal(stakedContent[7], true, "stakedContentById returns incorrect status");
		});

		it("stakeContent() - should be able to stake content with both normal ERC20 AO Tokens and AO ICO tokens", async function() {
			var account1WeightedIndex = await aotoken.weightedIndexByAddress(account1);
			var denominationAmount = 2000;
			var icoTokenAmount = 100;

			var stakeContent = async function(denomination, tokenMeta) {
				var account1BalanceBefore = await tokenMeta.balanceOf(account1);
				var account1StakedBalanceBefore = await tokenMeta.stakedBalance(account1);
				var account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
				var account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, account1WeightedIndex.toString());

				var canStake, stakeId, stakedContent;
				try {
					var result = await aocontent.stakeContent(denominationAmount, denomination, icoTokenAmount, datKey, fileSize, {
						from: account1
					});
					stakeId = result.logs[0].args.stakeId;
					stakedContent = await aocontent.stakedContentById(stakeId);
					canStake = true;
				} catch (e) {
					canStake = false;
					stakeId = null;
					stakedContent = null;
				}
				assert.equal(canStake, true, "account1 can't stake content even though enough AO Tokens were sent");
				assert.notEqual(stakeId, null, "Unable to determine the stakeID from the log after staking content");
				assert.equal(stakedContent[0], account1, "stakedContentById returns incorrect stakeOwner");
				assert.equal(stakedContent[1].toString(), denominationAmount, "stakedContentById returns incorrect denominationAmount");
				assert.equal(
					web3.toAscii(stakedContent[2]).replace(/\0/g, ""),
					denomination,
					"stakedContentById returns incorrect denomination"
				);
				assert.equal(stakedContent[3].toString(), icoTokenAmount, "stakedContentById returns incorrect icoTokenAmount");
				assert.equal(
					stakedContent[4].toString(),
					account1WeightedIndex.toString(),
					"stakedContentById returns incorrect icoTokenWeightedIndex"
				);
				assert.equal(stakedContent[5], datKey, "stakedContentById returns incorrect datKey");
				assert.equal(stakedContent[6].toString(), fileSize, "stakedContentById returns incorrect fileSize");
				assert.equal(stakedContent[7], true, "stakedContentById returns incorrect status");

				var account1BalanceAfter = await tokenMeta.balanceOf(account1);
				var account1StakedBalanceAfter = await tokenMeta.stakedBalance(account1);
				var account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
				var account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, account1WeightedIndex.toString());
				assert.equal(
					account1BalanceAfter.toString(),
					account1BalanceBefore.minus(denominationAmount).toString(),
					"account1 has incorrect balance after staking"
				);
				assert.equal(
					account1StakedBalanceAfter.toString(),
					account1StakedBalanceBefore.plus(denominationAmount).toString(),
					"account1 has incorrect staked balance after staking"
				);
				assert.equal(
					account1IcoBalanceAfter.toString(),
					account1IcoBalanceBefore.minus(icoTokenAmount).toString(),
					"account1 has incorrect ICO balance after staking"
				);
				assert.equal(
					account1IcoStakedBalanceAfter.toString(),
					account1IcoStakedBalanceBefore.plus(icoTokenAmount).toString(),
					"account1 has incorrect ICO staked balance after staking"
				);

				return stakeId;
			};

			aotokenStakeId = await stakeContent("ao", aotoken);
			aokiloStakeId = await stakeContent("kilo", aokilo);
			aomegaStakeId = await stakeContent("mega", aomega);
			aogigaStakeId = await stakeContent("giga", aogiga);
			aoteraStakeId = await stakeContent("tera", aotera);
			aopetaStakeId = await stakeContent("peta", aopeta);
			aoexaStakeId = await stakeContent("exa", aoexa);
			aozettaStakeId = await stakeContent("zetta", aozetta);
			aoyottaStakeId = await stakeContent("yotta", aoyotta);
			aoxonaStakeId = await stakeContent("xona", aoxona);
		});

		it("unstakePartialContent() - should NOT be able to partially unstake non-existing staked content", async function() {
			var canUnstakePartial;
			try {
				await aocontent.unstakePartialContent("someid", 10, 10, { from: account1 });
				canUnstakePartial = true;
			} catch (e) {
				canUnstakePartial = false;
			}
			assert.notEqual(canUnstakePartial, true, "account1 can partially unstake non-existing staked content");
		});

		it("unstakePartialContent() - should NOT be able to partially unstake existing staked content if stake owner is not the same as the sender", async function() {
			var unstakePartialContent = async function(stakeId) {
				var canUnstakePartial;
				try {
					await aocontent.unstakePartialContent(stakeId, 10, 10, { from: account2 });
					canUnstakePartial = true;
				} catch (e) {
					canUnstakePartial = false;
				}
				assert.notEqual(canUnstakePartial, true, "Non-stake owner address can partially unstake existing staked content");
			};

			await unstakePartialContent(aotokenStakeId);
			await unstakePartialContent(aokiloStakeId);
			await unstakePartialContent(aomegaStakeId);
			await unstakePartialContent(aogigaStakeId);
			await unstakePartialContent(aoteraStakeId);
			await unstakePartialContent(aopetaStakeId);
			await unstakePartialContent(aoexaStakeId);
			await unstakePartialContent(aozettaStakeId);
			await unstakePartialContent(aoyottaStakeId);
			await unstakePartialContent(aoxonaStakeId);
		});

		it("unstakePartialContent() - should NOT be able to partially unstake existing staked content if the requested denomination amount is more than the balance of the staked amount", async function() {
			var unstakePartialContent = async function(stakeId) {
				var canUnstakePartial;
				try {
					await aocontent.unstakePartialContent(stakeId, 2500, 0, { from: account2 });
					canUnstakePartial = true;
				} catch (e) {
					canUnstakePartial = false;
				}
				assert.notEqual(
					canUnstakePartial,
					true,
					"Stake owner can partially unstake denomination tokens more than it's existing balance."
				);
			};

			await unstakePartialContent(aotokenStakeId);
			await unstakePartialContent(aokiloStakeId);
			await unstakePartialContent(aomegaStakeId);
			await unstakePartialContent(aogigaStakeId);
			await unstakePartialContent(aoteraStakeId);
			await unstakePartialContent(aopetaStakeId);
			await unstakePartialContent(aoexaStakeId);
			await unstakePartialContent(aozettaStakeId);
			await unstakePartialContent(aoyottaStakeId);
			await unstakePartialContent(aoxonaStakeId);
		});

		it("unstakePartialContent() - should NOT be able to partially unstake existing staked content if the requested ICO token amount is more than the balance of the staked ICO amount", async function() {
			var unstakePartialContent = async function(stakeId) {
				var canUnstakePartial;
				try {
					await aocontent.unstakePartialContent(stakeId, 0, 150, { from: account2 });
					canUnstakePartial = true;
				} catch (e) {
					canUnstakePartial = false;
				}
				assert.notEqual(
					canUnstakePartial,
					true,
					"Stake owner can partially unstake ICO tokens more than it's existing ICO balance."
				);
			};

			await unstakePartialContent(aotokenStakeId);
			await unstakePartialContent(aokiloStakeId);
			await unstakePartialContent(aomegaStakeId);
			await unstakePartialContent(aogigaStakeId);
			await unstakePartialContent(aoteraStakeId);
			await unstakePartialContent(aopetaStakeId);
			await unstakePartialContent(aoexaStakeId);
			await unstakePartialContent(aozettaStakeId);
			await unstakePartialContent(aoyottaStakeId);
			await unstakePartialContent(aoxonaStakeId);
		});

		it("unstakePartialContent() - should be able to partially unstake only normal ERC20 AO token from existing staked content", async function() {
			var denominationAmount = 5;
			var unstakePartialContent = async function(stakeId, tokenMeta) {
				var stakedContentBefore = await aocontent.stakedContentById(stakeId);
				var account1BalanceBefore = await tokenMeta.balanceOf(account1);
				var account1StakedBalanceBefore = await tokenMeta.stakedBalance(account1);

				var canUnstakePartial;
				try {
					await aocontent.unstakePartialContent(stakeId, denominationAmount, 0, { from: account1 });
					canUnstakePartial = true;
				} catch (e) {
					canUnstakePartial = false;
				}
				assert.equal(
					canUnstakePartial,
					true,
					"Stake owner address unable to partially unstake normal ERC20 AO token from existing staked content"
				);

				var stakedContentAfter = await aocontent.stakedContentById(stakeId);
				var account1BalanceAfter = await tokenMeta.balanceOf(account1);
				var account1StakedBalanceAfter = await tokenMeta.stakedBalance(account1);

				assert.equal(
					stakedContentAfter[1].toString(),
					stakedContentBefore[1].minus(denominationAmount).toString(),
					"Staked content has incorrect denominationAmount after unstaking"
				);
				assert.equal(stakedContentAfter[2], stakedContentBefore[2], "Staked content has incorrect denomination after unstaking");
				assert.equal(
					stakedContentAfter[3].toString(),
					stakedContentBefore[3].toString(),
					"Staked content has incorrect icoTokenAmount after unstaking"
				);
				assert.equal(
					stakedContentAfter[4].toString(),
					stakedContentBefore[4].toString(),
					"Staked content has incorrect icoTokenWeightedIndex after unstaking"
				);
				assert.equal(stakedContentAfter[7], true, "Staked content has incorrect status after unstaking");
				assert.equal(
					account1BalanceAfter.toString(),
					account1BalanceBefore.plus(denominationAmount).toString(),
					"Account1 has incorrect balance after unstaking"
				);
				assert.equal(
					account1StakedBalanceAfter.toString(),
					account1StakedBalanceBefore.minus(denominationAmount).toString(),
					"Account1 has incorrect staked balance after unstaking"
				);
			};

			await unstakePartialContent(aotokenStakeId, aotoken);
			await unstakePartialContent(aokiloStakeId, aokilo);
			await unstakePartialContent(aomegaStakeId, aomega);
			await unstakePartialContent(aogigaStakeId, aogiga);
			await unstakePartialContent(aoteraStakeId, aotera);
			await unstakePartialContent(aopetaStakeId, aopeta);
			await unstakePartialContent(aoexaStakeId, aoexa);
			await unstakePartialContent(aozettaStakeId, aozetta);
			await unstakePartialContent(aoyottaStakeId, aoyotta);
			await unstakePartialContent(aoxonaStakeId, aoxona);
		});

		it("unstakePartialContent() - should be able to partially unstake only ICO AO token from existing staked content", async function() {
			var icoTokenAmount = 5;
			var unstakePartialContent = async function(stakeId, tokenMeta) {
				var stakedContentBefore = await aocontent.stakedContentById(stakeId);
				var account1BalanceBefore = await tokenMeta.balanceOf(account1);
				var account1StakedBalanceBefore = await tokenMeta.stakedBalance(account1);
				var account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
				var account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, stakedContentBefore[4].toString());
				var account1WeightedIndexBefore = await aotoken.weightedIndexByAddress(account1);

				var canUnstakePartial;
				try {
					await aocontent.unstakePartialContent(stakeId, 0, icoTokenAmount, { from: account1 });
					canUnstakePartial = true;
				} catch (e) {
					canUnstakePartial = false;
				}
				assert.equal(
					canUnstakePartial,
					true,
					"Stake owner address unable to partially unstake ICO AO token from existing staked content"
				);

				var stakedContentAfter = await aocontent.stakedContentById(stakeId);
				var account1BalanceAfter = await tokenMeta.balanceOf(account1);
				var account1StakedBalanceAfter = await tokenMeta.stakedBalance(account1);
				var account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
				var account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, stakedContentAfter[4].toString());
				var account1WeightedIndexAfter = await aotoken.weightedIndexByAddress(account1);

				assert.equal(
					stakedContentAfter[1].toString(),
					stakedContentBefore[1].toString(),
					"Staked content has incorrect denominationAmount after unstaking"
				);
				assert.equal(stakedContentAfter[2], stakedContentBefore[2], "Staked content has incorrect denomination after unstaking");
				assert.equal(
					stakedContentAfter[3].toString(),
					stakedContentBefore[3].minus(icoTokenAmount).toString(),
					"Staked content has incorrect icoTokenAmount after unstaking"
				);
				assert.equal(
					stakedContentAfter[4].toString(),
					stakedContentBefore[4].toString(),
					"Staked content has incorrect icoTokenWeightedIndex after unstaking"
				);
				assert.equal(stakedContentAfter[7], true, "Staked content has incorrect status after unstaking");
				assert.equal(
					account1BalanceAfter.toString(),
					account1BalanceBefore.toString(),
					"Account1 has incorrect balance after unstaking"
				);
				assert.equal(
					account1StakedBalanceAfter.toString(),
					account1StakedBalanceBefore.toString(),
					"Account1 has incorrect staked balance after unstaking"
				);
				assert.equal(
					account1IcoBalanceAfter.toString(),
					account1IcoBalanceBefore.plus(icoTokenAmount).toString(),
					"Account1 has incorrect ICO balance after unstaking"
				);
				assert.equal(
					account1IcoStakedBalanceAfter.toString(),
					account1IcoStakedBalanceBefore.minus(icoTokenAmount).toString(),
					"Account1 has incorrect ICO staked balance after unstaking"
				);
				assert.equal(
					account1WeightedIndexAfter.toString(),
					account1WeightedIndexBefore.toString(),
					"Account1 has incorrect weighted index after unstaking"
				);
			};

			await unstakePartialContent(aotokenStakeId, aotoken);
			await unstakePartialContent(aokiloStakeId, aokilo);
			await unstakePartialContent(aomegaStakeId, aomega);
			await unstakePartialContent(aogigaStakeId, aogiga);
			await unstakePartialContent(aoteraStakeId, aotera);
			await unstakePartialContent(aopetaStakeId, aopeta);
			await unstakePartialContent(aoexaStakeId, aoexa);
			await unstakePartialContent(aozettaStakeId, aozetta);
			await unstakePartialContent(aoyottaStakeId, aoyotta);
			await unstakePartialContent(aoxonaStakeId, aoxona);
		});

		it("unstakePartialContent() - should be able to partially unstake both normal ERC20 AO Token and ICO AO token from existing staked content", async function() {
			var denominationAmount = 5;
			var icoTokenAmount = 5;
			var unstakePartialContent = async function(stakeId, tokenMeta) {
				var stakedContentBefore = await aocontent.stakedContentById(stakeId);
				var account1BalanceBefore = await tokenMeta.balanceOf(account1);
				var account1StakedBalanceBefore = await tokenMeta.stakedBalance(account1);
				var account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
				var account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, stakedContentBefore[4].toString());
				var account1WeightedIndexBefore = await aotoken.weightedIndexByAddress(account1);

				var canUnstakePartial;
				try {
					await aocontent.unstakePartialContent(stakeId, denominationAmount, icoTokenAmount, { from: account1 });
					canUnstakePartial = true;
				} catch (e) {
					canUnstakePartial = false;
				}
				assert.equal(
					canUnstakePartial,
					true,
					"Stake owner address unable to partially unstake ICO AO token from existing staked content"
				);

				var stakedContentAfter = await aocontent.stakedContentById(stakeId);
				var account1BalanceAfter = await tokenMeta.balanceOf(account1);
				var account1StakedBalanceAfter = await tokenMeta.stakedBalance(account1);
				var account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
				var account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, stakedContentAfter[4].toString());
				var account1WeightedIndexAfter = await aotoken.weightedIndexByAddress(account1);

				assert.equal(
					stakedContentAfter[1].toString(),
					stakedContentBefore[1].minus(denominationAmount).toString(),
					"Staked content has incorrect denominationAmount after unstaking"
				);
				assert.equal(stakedContentAfter[2], stakedContentBefore[2], "Staked content has incorrect denomination after unstaking");
				assert.equal(
					stakedContentAfter[3].toString(),
					stakedContentBefore[3].minus(icoTokenAmount).toString(),
					"Staked content has incorrect icoTokenAmount after unstaking"
				);
				assert.equal(
					stakedContentAfter[4].toString(),
					stakedContentBefore[4].toString(),
					"Staked content has incorrect icoTokenWeightedIndex after unstaking"
				);
				assert.equal(stakedContentAfter[7], true, "Staked content has incorrect status after unstaking");
				assert.equal(
					account1BalanceAfter.toString(),
					account1BalanceBefore.plus(denominationAmount).toString(),
					"Account1 has incorrect balance after unstaking"
				);
				assert.equal(
					account1StakedBalanceAfter.toString(),
					account1StakedBalanceBefore.minus(denominationAmount).toString(),
					"Account1 has incorrect staked balance after unstaking"
				);
				assert.equal(
					account1IcoBalanceAfter.toString(),
					account1IcoBalanceBefore.plus(icoTokenAmount).toString(),
					"Account1 has incorrect ICO balance after unstaking"
				);
				assert.equal(
					account1IcoStakedBalanceAfter.toString(),
					account1IcoStakedBalanceBefore.minus(icoTokenAmount).toString(),
					"Account1 has incorrect ICO staked balance after unstaking"
				);
				assert.equal(
					account1WeightedIndexAfter.toString(),
					account1WeightedIndexBefore.toString(),
					"Account1 has incorrect weighted index after unstaking"
				);
			};

			await unstakePartialContent(aotokenStakeId, aotoken);
			await unstakePartialContent(aokiloStakeId, aokilo);
			await unstakePartialContent(aomegaStakeId, aomega);
			await unstakePartialContent(aogigaStakeId, aogiga);
			await unstakePartialContent(aoteraStakeId, aotera);
			await unstakePartialContent(aopetaStakeId, aopeta);
			await unstakePartialContent(aoexaStakeId, aoexa);
			await unstakePartialContent(aozettaStakeId, aozetta);
			await unstakePartialContent(aoyottaStakeId, aoyotta);
			await unstakePartialContent(aoxonaStakeId, aoxona);
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

			await unstakeContent(aotokenStakeId);
			await unstakeContent(aokiloStakeId);
			await unstakeContent(aomegaStakeId);
			await unstakeContent(aogigaStakeId);
			await unstakeContent(aoteraStakeId);
			await unstakeContent(aopetaStakeId);
			await unstakeContent(aoexaStakeId);
			await unstakeContent(aozettaStakeId);
			await unstakeContent(aoyottaStakeId);
			await unstakeContent(aoxonaStakeId);
		});

		it("unstakeContent() - should be able to unstake existing staked content", async function() {
			var unstakeContent = async function(stakeId, tokenMeta) {
				var stakedContentBefore = await aocontent.stakedContentById(stakeId);
				var account1BalanceBefore = await tokenMeta.balanceOf(account1);
				var account1StakedBalanceBefore = await tokenMeta.stakedBalance(account1);
				var account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
				var account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, stakedContentBefore[4].toString());
				var account1WeightedIndexBefore = await aotoken.weightedIndexByAddress(account1);

				var canUnstake;
				try {
					await aocontent.unstakeContent(stakeId, { from: account1 });
					canUnstake = true;
				} catch (e) {
					canUnstake = false;
				}
				assert.equal(canUnstake, true, "Stake owner address unable to unstake existing staked content");

				var stakedContentAfter = await aocontent.stakedContentById(stakeId);
				var account1BalanceAfter = await tokenMeta.balanceOf(account1);
				var account1StakedBalanceAfter = await tokenMeta.stakedBalance(account1);
				var account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
				var account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, stakedContentBefore[4].toString());
				var account1WeightedIndexAfter = await aotoken.weightedIndexByAddress(account1);
				assert.equal(stakedContentAfter[1].toString(), 0, "Staked content has incorrect denominationAmount after unstaking");
				assert.equal(
					web3.toAscii(stakedContentAfter[2]).replace(/\0/g, ""),
					"",
					"Staked content has incorrect denomination after unstaking"
				);
				assert.equal(stakedContentAfter[3].toString(), 0, "Staked content has incorrect icoTokenAmount after unstaking");
				assert.equal(stakedContentAfter[4].toString(), 0, "Staked content has incorrect icoTokenWeightedIndex after unstaking");
				assert.equal(stakedContentAfter[7], false, "Staked content has incorrect status after unstaking");
				assert.equal(
					account1BalanceAfter.toString(),
					account1BalanceBefore.plus(stakedContentBefore[1]).toString(),
					"Account1 has incorrect balance after unstaking"
				);
				assert.equal(
					account1StakedBalanceAfter.toString(),
					account1StakedBalanceBefore.minus(stakedContentBefore[1]).toString(),
					"Account1 has incorrect staked balance after unstaking"
				);
				assert.equal(
					account1IcoBalanceAfter.toString(),
					account1IcoBalanceBefore.plus(stakedContentBefore[3]).toString(),
					"Account1 has incorrect ICO balance after unstaking"
				);
				assert.equal(
					account1IcoStakedBalanceAfter.toString(),
					account1IcoStakedBalanceBefore.minus(stakedContentBefore[3]).toString(),
					"Account1 has incorrect ICO staked balance after unstaking"
				);
				var totalWeightedTokens = account1WeightedIndexBefore
					.times(account1IcoBalanceBefore)
					.plus(stakedContentBefore[4].times(stakedContentBefore[3]));
				var totalTokens = account1IcoBalanceBefore.plus(stakedContentBefore[3]);
				var newWeightedIndex = parseInt(totalWeightedTokens.div(totalTokens).toString());
				assert.equal(
					account1WeightedIndexAfter.toString(),
					newWeightedIndex,
					"Account1 has incorrect weighted index after unstaking"
				);
			};

			await unstakeContent(aotokenStakeId, aotoken);
			await unstakeContent(aokiloStakeId, aokilo);
			await unstakeContent(aomegaStakeId, aomega);
			await unstakeContent(aogigaStakeId, aogiga);
			await unstakeContent(aoteraStakeId, aotera);
			await unstakeContent(aopetaStakeId, aopeta);
			await unstakeContent(aoexaStakeId, aoexa);
			await unstakeContent(aozettaStakeId, aozetta);
			await unstakeContent(aoyottaStakeId, aoyotta);
			await unstakeContent(aoxonaStakeId, aoxona);
		});

		it("stakeExistingContent() - should NOT be able to stake non-existing staked content", async function() {
			var canStakeExisting;
			try {
				await aocontent.stakeExistingContent("someid", 0, "", 1000, { from: account1 });
				canStakeExisting = true;
			} catch (e) {
				canStakeExisting = false;
			}
			assert.notEqual(canStakeExisting, true, "account1 can stake non-existing staked content");
		});

		it("stakeExistingContent() - should NOT be able to stake existing staked content if the stake owner is not the same as the sender", async function() {
			var stakeExistingContent = async function(stakeId, denomination) {
				var canStakeExisting;
				try {
					await aocontent.stakeExistingContent(stakeId, 1000, denomination, 1000, { from: account2 });
					canStakeExisting = true;
				} catch (e) {
					canStakeExisting = false;
				}
				assert.notEqual(canStakeExisting, true, "Non-stake owner address can stake existing staked content");
			};

			await stakeExistingContent(aotokenStakeId, "ao");
			await stakeExistingContent(aokiloStakeId, "kilo");
			await stakeExistingContent(aomegaStakeId, "mega");
			await stakeExistingContent(aogigaStakeId, "giga");
			await stakeExistingContent(aoteraStakeId, "tera");
			await stakeExistingContent(aopetaStakeId, "peta");
			await stakeExistingContent(aoexaStakeId, "exa");
			await stakeExistingContent(aozettaStakeId, "zetta");
			await stakeExistingContent(aoyottaStakeId, "yotta");
			await stakeExistingContent(aoxonaStakeId, "xona");
		});

		it("stakeExistingContent() - should stake greater or equal than file size", async function() {
			var stakeExistingContent = async function(stakeId, denomination) {
				var canStakeExisting;
				try {
					await aocontent.stakeExistingContent(stakeId, 50, denomination, 0, { from: account1 });
					canStakeExisting = true;
				} catch (e) {
					canStakeExisting = false;
				}
				assert.notEqual(canStakeExisting, true, "Stake owner can stake less than filesize");
			};

			await stakeExistingContent(aotokenStakeId, "ao");
			await stakeExistingContent(aokiloStakeId, "kilo");
			await stakeExistingContent(aomegaStakeId, "mega");
			await stakeExistingContent(aogigaStakeId, "giga");
			await stakeExistingContent(aoteraStakeId, "tera");
			await stakeExistingContent(aopetaStakeId, "peta");
			await stakeExistingContent(aoexaStakeId, "exa");
			await stakeExistingContent(aozettaStakeId, "zetta");
			await stakeExistingContent(aoyottaStakeId, "yotta");
			await stakeExistingContent(aoxonaStakeId, "xona");

			var stakeExistingContent = async function(stakeId) {
				var canStakeExisting;
				try {
					await aocontent.stakeExistingContent(stakeId, 0, "", 50, { from: account1 });
					canStakeExisting = true;
				} catch (e) {
					canStakeExisting = false;
				}
				assert.notEqual(canStakeExisting, true, "Stake owner can stake less than filesize");
			};

			await stakeExistingContent(aotokenStakeId);
			await stakeExistingContent(aokiloStakeId);
			await stakeExistingContent(aomegaStakeId);
			await stakeExistingContent(aogigaStakeId);
			await stakeExistingContent(aoteraStakeId);
			await stakeExistingContent(aopetaStakeId);
			await stakeExistingContent(aoexaStakeId);
			await stakeExistingContent(aozettaStakeId);
			await stakeExistingContent(aoyottaStakeId);
			await stakeExistingContent(aoxonaStakeId);
		});

		it("stakeExistingContent() - should be able to stake only normal ERC20 AO tokens on existing staked content", async function() {
			var denominationAmount = 1000;
			var stakeExistingContent = async function(stakeId, denomination, tokenMeta) {
				var stakedContentBefore = await aocontent.stakedContentById(stakeId);
				var account1BalanceBefore = await tokenMeta.balanceOf(account1);
				var account1StakedBalanceBefore = await tokenMeta.stakedBalance(account1);

				var canStakeExisting;
				try {
					await aocontent.stakeExistingContent(stakeId, denominationAmount, denomination, 0, { from: account1 });
					canStakeExisting = true;
				} catch (e) {
					canStakeExisting = false;
				}
				assert.equal(canStakeExisting, true, "Stake owner can't stake only normal ERC20 AO tokens on existing staked content");

				var stakedContentAfter = await aocontent.stakedContentById(stakeId);
				var account1BalanceAfter = await tokenMeta.balanceOf(account1);
				var account1StakedBalanceAfter = await tokenMeta.stakedBalance(account1);

				assert.equal(
					stakedContentAfter[1].toString(),
					stakedContentBefore[1].plus(denominationAmount).toString(),
					"Staked content has incorrect denominationAmount after staking"
				);
				assert.equal(
					web3.toAscii(stakedContentAfter[2]).replace(/\0/g, ""),
					denomination,
					"Staked content has incorrect denomination after staking"
				);
				assert.equal(
					stakedContentAfter[3].toString(),
					stakedContentBefore[3].toString(),
					"Staked content has incorrect icoTokenAmount after staking"
				);
				assert.equal(
					stakedContentAfter[4].toString(),
					stakedContentBefore[4].toString(),
					"Staked content has incorrect icoTokenWeightedIndex after staking"
				);
				assert.equal(stakedContentAfter[7], true, "Staked content has incorrect status after staking");
				assert.equal(
					account1BalanceAfter.toString(),
					account1BalanceBefore.minus(denominationAmount).toString(),
					"Account1 has incorrect balance after staking"
				);
				assert.equal(
					account1StakedBalanceAfter.toString(),
					account1StakedBalanceBefore.plus(denominationAmount).toString(),
					"Account1 has incorrect staked balance after staking"
				);
			};

			await stakeExistingContent(aotokenStakeId, "ao", aotoken);
			await stakeExistingContent(aokiloStakeId, "kilo", aokilo);
			await stakeExistingContent(aomegaStakeId, "mega", aomega);
			await stakeExistingContent(aogigaStakeId, "giga", aogiga);
			await stakeExistingContent(aoteraStakeId, "tera", aotera);
			await stakeExistingContent(aopetaStakeId, "peta", aopeta);
			await stakeExistingContent(aoexaStakeId, "exa", aoexa);
			await stakeExistingContent(aozettaStakeId, "zetta", aozetta);
			await stakeExistingContent(aoyottaStakeId, "yotta", aoyotta);
			await stakeExistingContent(aoxonaStakeId, "xona", aoxona);

			// unstake them again for next test
			await aocontent.unstakeContent(aotokenStakeId, { from: account1 });
			await aocontent.unstakeContent(aokiloStakeId, { from: account1 });
			await aocontent.unstakeContent(aomegaStakeId, { from: account1 });
			await aocontent.unstakeContent(aogigaStakeId, { from: account1 });
			await aocontent.unstakeContent(aoteraStakeId, { from: account1 });
			await aocontent.unstakeContent(aopetaStakeId, { from: account1 });
			await aocontent.unstakeContent(aoexaStakeId, { from: account1 });
			await aocontent.unstakeContent(aozettaStakeId, { from: account1 });
			await aocontent.unstakeContent(aoyottaStakeId, { from: account1 });
			await aocontent.unstakeContent(aoxonaStakeId, { from: account1 });
		});

		it("stakeExistingContent() - should be able to stake only ICO AO tokens on existing staked content", async function() {
			var icoTokenAmount = 1000;
			var stakeExistingContent = async function(stakeId, tokenMeta) {
				var stakedContentBefore = await aocontent.stakedContentById(stakeId);
				var account1WeightedIndexBefore = await aotoken.weightedIndexByAddress(account1);
				var account1BalanceBefore = await tokenMeta.balanceOf(account1);
				var account1StakedBalanceBefore = await tokenMeta.stakedBalance(account1);
				var account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
				var account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, account1WeightedIndexBefore.toString());

				var canStakeExisting;
				try {
					await aocontent.stakeExistingContent(stakeId, 0, "", icoTokenAmount, { from: account1 });
					canStakeExisting = true;
				} catch (e) {
					canStakeExisting = false;
				}
				assert.equal(canStakeExisting, true, "Stake owner can't stake only ICO AO tokens on existing staked content");

				var stakedContentAfter = await aocontent.stakedContentById(stakeId);
				var account1BalanceAfter = await tokenMeta.balanceOf(account1);
				var account1StakedBalanceAfter = await tokenMeta.stakedBalance(account1);
				var account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
				var account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, account1WeightedIndexBefore.toString());
				var account1WeightedIndexAfter = await aotoken.weightedIndexByAddress(account1);

				assert.equal(
					stakedContentAfter[1].toString(),
					stakedContentBefore[1].toString(),
					"Staked content has incorrect denominationAmount after staking"
				);
				assert.equal(
					web3.toAscii(stakedContentAfter[2]).replace(/\0/g, ""),
					"",
					"Staked content has incorrect denomination after staking"
				);
				assert.equal(
					stakedContentAfter[3].toString(),
					stakedContentBefore[3].plus(icoTokenAmount).toString(),
					"Staked content has incorrect icoTokenAmount after staking"
				);
				assert.equal(
					stakedContentAfter[4].toString(),
					account1WeightedIndexBefore.toString(),
					"Staked content has incorrect icoTokenWeightedIndex after staking"
				);
				assert.equal(stakedContentAfter[7], true, "Staked content has incorrect status after staking");
				assert.equal(
					account1BalanceAfter.toString(),
					account1BalanceBefore.toString(),
					"Account1 has incorrect balance after staking"
				);
				assert.equal(
					account1StakedBalanceAfter.toString(),
					account1StakedBalanceBefore.toString(),
					"Account1 has incorrect staked balance after staking"
				);
				assert.equal(
					account1IcoBalanceAfter.toString(),
					account1IcoBalanceBefore.minus(icoTokenAmount).toString(),
					"Account1 has incorrect ICO balance after staking"
				);
				assert.equal(
					account1IcoStakedBalanceAfter.toString(),
					account1IcoStakedBalanceBefore.plus(icoTokenAmount).toString(),
					"Account1 has incorrect ICO staked balance after staking"
				);
				assert.equal(
					account1WeightedIndexAfter.toString(),
					account1WeightedIndexBefore.toString(),
					"Account1 has incorrect weighted index after staking"
				);
			};

			await stakeExistingContent(aotokenStakeId, aotoken);
			await stakeExistingContent(aokiloStakeId, aokilo);
			await stakeExistingContent(aomegaStakeId, aomega);
			await stakeExistingContent(aogigaStakeId, aogiga);
			await stakeExistingContent(aoteraStakeId, aotera);
			await stakeExistingContent(aopetaStakeId, aopeta);
			await stakeExistingContent(aoexaStakeId, aoexa);
			await stakeExistingContent(aozettaStakeId, aozetta);
			await stakeExistingContent(aoyottaStakeId, aoyotta);
			await stakeExistingContent(aoxonaStakeId, aoxona);

			// unstake them again for next test
			await aocontent.unstakeContent(aotokenStakeId, { from: account1 });
			await aocontent.unstakeContent(aokiloStakeId, { from: account1 });
			await aocontent.unstakeContent(aomegaStakeId, { from: account1 });
			await aocontent.unstakeContent(aogigaStakeId, { from: account1 });
			await aocontent.unstakeContent(aoteraStakeId, { from: account1 });
			await aocontent.unstakeContent(aopetaStakeId, { from: account1 });
			await aocontent.unstakeContent(aoexaStakeId, { from: account1 });
			await aocontent.unstakeContent(aozettaStakeId, { from: account1 });
			await aocontent.unstakeContent(aoyottaStakeId, { from: account1 });
			await aocontent.unstakeContent(aoxonaStakeId, { from: account1 });
		});

		it("stakeExistingContent() - should be able to stake both normal ERC20 tokens and ICO AO tokens on existing staked content", async function() {
			var denominationAmount = 1000;
			var icoTokenAmount = 1000;
			var stakeExistingContent = async function(stakeId, denomination, tokenMeta) {
				var stakedContentBefore = await aocontent.stakedContentById(stakeId);
				var account1WeightedIndexBefore = await aotoken.weightedIndexByAddress(account1);
				var account1BalanceBefore = await tokenMeta.balanceOf(account1);
				var account1StakedBalanceBefore = await tokenMeta.stakedBalance(account1);
				var account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
				var account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, account1WeightedIndexBefore.toString());

				var canStakeExisting;
				try {
					await aocontent.stakeExistingContent(stakeId, denominationAmount, denomination, icoTokenAmount, { from: account1 });
					canStakeExisting = true;
				} catch (e) {
					canStakeExisting = false;
				}
				assert.equal(canStakeExisting, true, "Stake owner can't stake only ICO AO tokens on existing staked content");

				var stakedContentAfter = await aocontent.stakedContentById(stakeId);
				var account1BalanceAfter = await tokenMeta.balanceOf(account1);
				var account1StakedBalanceAfter = await tokenMeta.stakedBalance(account1);
				var account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
				var account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, account1WeightedIndexBefore.toString());
				var account1WeightedIndexAfter = await aotoken.weightedIndexByAddress(account1);

				assert.equal(
					stakedContentAfter[1].toString(),
					stakedContentBefore[1].plus(denominationAmount).toString(),
					"Staked content has incorrect denominationAmount after staking"
				);
				assert.equal(
					web3.toAscii(stakedContentAfter[2]).replace(/\0/g, ""),
					denomination,
					"Staked content has incorrect denomination after staking"
				);
				assert.equal(
					stakedContentAfter[3].toString(),
					stakedContentBefore[3].plus(icoTokenAmount).toString(),
					"Staked content has incorrect icoTokenAmount after staking"
				);
				assert.equal(
					stakedContentAfter[4].toString(),
					account1WeightedIndexBefore.toString(),
					"Staked content has incorrect icoTokenWeightedIndex after staking"
				);
				assert.equal(stakedContentAfter[7], true, "Staked content has incorrect status after staking");
				assert.equal(
					account1BalanceAfter.toString(),
					account1BalanceBefore.minus(denominationAmount).toString(),
					"Account1 has incorrect balance after staking"
				);
				assert.equal(
					account1StakedBalanceAfter.toString(),
					account1StakedBalanceBefore.plus(denominationAmount).toString(),
					"Account1 has incorrect staked balance after staking"
				);
				assert.equal(
					account1IcoBalanceAfter.toString(),
					account1IcoBalanceBefore.minus(icoTokenAmount).toString(),
					"Account1 has incorrect ICO balance after staking"
				);
				assert.equal(
					account1IcoStakedBalanceAfter.toString(),
					account1IcoStakedBalanceBefore.plus(icoTokenAmount).toString(),
					"Account1 has incorrect ICO staked balance after staking"
				);
				assert.equal(
					account1WeightedIndexAfter.toString(),
					account1WeightedIndexBefore.toString(),
					"Account1 has incorrect weighted index after staking"
				);
			};

			await stakeExistingContent(aotokenStakeId, "ao", aotoken);
			await stakeExistingContent(aokiloStakeId, "kilo", aokilo);
			await stakeExistingContent(aomegaStakeId, "mega", aomega);
			await stakeExistingContent(aogigaStakeId, "giga", aogiga);
			await stakeExistingContent(aoteraStakeId, "tera", aotera);
			await stakeExistingContent(aopetaStakeId, "peta", aopeta);
			await stakeExistingContent(aoexaStakeId, "exa", aoexa);
			await stakeExistingContent(aozettaStakeId, "zetta", aozetta);
			await stakeExistingContent(aoyottaStakeId, "yotta", aoyotta);
			await stakeExistingContent(aoxonaStakeId, "xona", aoxona);

			// Should be able to stake them again
			await stakeExistingContent(aotokenStakeId, "ao", aotoken);
			await stakeExistingContent(aokiloStakeId, "kilo", aokilo);
			await stakeExistingContent(aomegaStakeId, "mega", aomega);
			await stakeExistingContent(aogigaStakeId, "giga", aogiga);
			await stakeExistingContent(aoteraStakeId, "tera", aotera);
			await stakeExistingContent(aopetaStakeId, "peta", aopeta);
			await stakeExistingContent(aoexaStakeId, "exa", aoexa);
			await stakeExistingContent(aozettaStakeId, "zetta", aozetta);
			await stakeExistingContent(aoyottaStakeId, "yotta", aoyotta);
			await stakeExistingContent(aoxonaStakeId, "xona", aoxona);
		});

		it("stakeExistingContent() - should NOT be able to stake existing active staked content with different denomination", async function() {
			var stakeExistingContent = async function(stakeId, denomination) {
				var canStakeExisting;
				try {
					await aocontent.stakeExistingContent(stakeId, 10, denomination, 0, { from: account1 });
					canStakeExisting = true;
				} catch (e) {
					canStakeExisting = false;
				}
				assert.notEqual(canStakeExisting, true, "Stake owner can stake existing active staked content with different denomination");
			};
			await stakeExistingContent(aotokenStakeId, "kilo");
			await stakeExistingContent(aokiloStakeId, "ao");
			await stakeExistingContent(aomegaStakeId, "ao");
			await stakeExistingContent(aogigaStakeId, "ao");
			await stakeExistingContent(aoteraStakeId, "ao");
			await stakeExistingContent(aopetaStakeId, "ao");
			await stakeExistingContent(aoexaStakeId, "ao");
			await stakeExistingContent(aozettaStakeId, "ao");
			await stakeExistingContent(aoyottaStakeId, "ao");
			await stakeExistingContent(aoxonaStakeId, "ao");

			// unstake them again for next test
			await aocontent.unstakeContent(aotokenStakeId, { from: account1 });
			await aocontent.unstakeContent(aokiloStakeId, { from: account1 });
			await aocontent.unstakeContent(aomegaStakeId, { from: account1 });
			await aocontent.unstakeContent(aogigaStakeId, { from: account1 });
			await aocontent.unstakeContent(aoteraStakeId, { from: account1 });
			await aocontent.unstakeContent(aopetaStakeId, { from: account1 });
			await aocontent.unstakeContent(aoexaStakeId, { from: account1 });
			await aocontent.unstakeContent(aozettaStakeId, { from: account1 });
			await aocontent.unstakeContent(aoyottaStakeId, { from: account1 });
			await aocontent.unstakeContent(aoxonaStakeId, { from: account1 });
		});

		it("stakeExistingContent() - should be able to stake existing inactive staked content with different denomination", async function() {
			var stakeExistingContent = async function(stakeId, denomination) {
				var canStakeExisting;
				try {
					await aocontent.stakeExistingContent(stakeId, 1000, denomination, 0, { from: account1 });
					canStakeExisting = true;
				} catch (e) {
					canStakeExisting = false;
				}
				assert.equal(
					canStakeExisting,
					true,
					"Stake owner can't stake existing inactive staked content with different denomination"
				);
			};
			await stakeExistingContent(aotokenStakeId, "kilo");
			await stakeExistingContent(aokiloStakeId, "ao");
			await stakeExistingContent(aomegaStakeId, "ao");
			await stakeExistingContent(aogigaStakeId, "ao");
			await stakeExistingContent(aoteraStakeId, "ao");
			await stakeExistingContent(aopetaStakeId, "ao");
			await stakeExistingContent(aoexaStakeId, "ao");
			await stakeExistingContent(aozettaStakeId, "ao");
			await stakeExistingContent(aoyottaStakeId, "ao");
			await stakeExistingContent(aoxonaStakeId, "ao");
		});
	});
});
