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
			await aotoken.mintToken(account1, 10000, { from: owner });
			// Buy 2 lots so that we can test avg weighted index
			await aotoken.buyIcoToken({ from: account1, value: 50000000 });
			await aotoken.buyIcoToken({ from: account1, value: 50000000 });
			await aokilo.mintToken(account1, 10000 * 10 ** aokilodecimals.toNumber(), { from: owner });
			await aomega.mintToken(account1, 10000 * 10 ** aomegadecimals.toNumber(), { from: owner });
			await aogiga.mintToken(account1, 10000 * 10 ** aogigadecimals.toNumber(), { from: owner });
			await aotera.mintToken(account1, 10000 * 10 ** aoteradecimals.toNumber(), { from: owner });
			await aopeta.mintToken(account1, 10000 * 10 ** aopetadecimals.toNumber(), { from: owner });
			await aoexa.mintToken(account1, 10000 * 10 ** aoexadecimals.toNumber(), { from: owner });
			await aozetta.mintToken(account1, 10000 * 10 ** aozettadecimals.toNumber(), { from: owner });
			await aoyotta.mintToken(account1, 10000 * 10 ** aoyottadecimals.toNumber(), { from: owner });
			await aoxona.mintToken(account1, 10000 * 10 ** aoxonadecimals.toNumber(), { from: owner });
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
				assert.notEqual(canStake, true, "account1 can stake content even though token amount can't cover fileSize");
				try {
					await aocontent.stakeContent(10, denomination, 100, datKey, fileSize, { from: account1 });
					canStake = true;
				} catch (e) {
					canStake = false;
				}
				assert.notEqual(canStake, true, "account1 can stake content even though token amount can't cover fileSize");
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
			assert.notEqual(canStake, true, "account1 can stake content even though token amount can't cover fileSize");
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
			var stakeContent = async function(denominationAmount, denomination) {
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
				assert.equal(stakedContent[1].toNumber(), denominationAmount, "stakedContentById returns incorrect denominationAmount");
				assert.equal(
					web3.toAscii(stakedContent[2]).replace(/\0/g, ""),
					denomination,
					"stakedContentById returns incorrect denomination"
				);
				assert.equal(stakedContent[3].toNumber(), 0, "stakedContentById returns incorrect icoTokenAmount");
				assert.equal(stakedContent[4].toNumber(), 0, "stakedContentById returns incorrect icoTokenWeightedIndex");
				assert.equal(stakedContent[5], datKey, "stakedContentById returns incorrect datKey");
				assert.equal(stakedContent[6].toNumber(), fileSize, "stakedContentById returns incorrect fileSize");
				assert.equal(stakedContent[7], true, "stakedContentById returns incorrect status");
				return stakeId;
			};
			var denominationAmount = 1000;

			// Test staking only the base AO Token
			var account1BalanceBefore = await aotoken.balanceOf(account1);
			var account1StakedBalanceBefore = await aotoken.stakedBalance(account1);
			aotokenStakeId = await stakeContent(denominationAmount, "ao");
			var account1BalanceAfter = await aotoken.balanceOf(account1);
			var account1StakedBalanceAfter = await aotoken.stakedBalance(account1);
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.toNumber() - denominationAmount,
				"account1 has incorrect balance after staking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.toNumber() + denominationAmount,
				"account1 has incorrect staked balance after staking"
			);

			// Test staking only AOKILO tokens
			account1BalanceBefore = await aokilo.balanceOf(account1);
			account1StakedBalanceBefore = await aokilo.stakedBalance(account1);
			// Here denominationAmount 1000 means 1 AOKILO since AOKILO has 3 decimals
			aokiloStakeId = await stakeContent(denominationAmount, "kilo");
			account1BalanceAfter = await aokilo.balanceOf(account1);
			account1StakedBalanceAfter = await aokilo.stakedBalance(account1);
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.toNumber() - denominationAmount,
				"account1 has incorrect balance after staking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.toNumber() + denominationAmount,
				"account1 has incorrect staked balance after staking"
			);

			// Test staking only AOMEGA tokens
			account1BalanceBefore = await aomega.balanceOf(account1);
			account1StakedBalanceBefore = await aomega.stakedBalance(account1);
			// Here denominationAmount 1000 means 0.001 AOMEGA since AOMEGA has 6 decimals
			aomegaStakeId = await stakeContent(denominationAmount, "mega");
			account1BalanceAfter = await aomega.balanceOf(account1);
			account1StakedBalanceAfter = await aomega.stakedBalance(account1);
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.toNumber() - denominationAmount,
				"account1 has incorrect balance after staking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.toNumber() + denominationAmount,
				"account1 has incorrect staked balance after staking"
			);

			// Test staking only AOGIGA tokens
			account1BalanceBefore = await aogiga.balanceOf(account1);
			account1StakedBalanceBefore = await aogiga.stakedBalance(account1);
			// Here denominationAmount 1000 means 0.000001 AOGIGA since AOGIGA has 9 decimals
			aogigaStakeId = await stakeContent(denominationAmount, "giga");
			account1BalanceAfter = await aogiga.balanceOf(account1);
			account1StakedBalanceAfter = await aogiga.stakedBalance(account1);
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.toNumber() - denominationAmount,
				"account1 has incorrect balance after staking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.toNumber() + denominationAmount,
				"account1 has incorrect staked balance after staking"
			);

			// Test staking only AOTERA tokens
			account1BalanceBefore = await aotera.balanceOf(account1);
			account1StakedBalanceBefore = await aotera.stakedBalance(account1);
			// Here denominationAmount 1000 means 1e-9 AOTERA since AOTERA has 12 decimals
			aoteraStakeId = await stakeContent(denominationAmount, "tera");
			account1BalanceAfter = await aotera.balanceOf(account1);
			account1StakedBalanceAfter = await aotera.stakedBalance(account1);
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.toNumber() - denominationAmount,
				"account1 has incorrect balance after staking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.toNumber() + denominationAmount,
				"account1 has incorrect staked balance after staking"
			);

			// Test staking only AOPETA tokens
			account1BalanceBefore = await aopeta.balanceOf(account1);
			account1StakedBalanceBefore = await aopeta.stakedBalance(account1);
			// Here denominationAmount 1000 means 1e-12 AOPETA since AOPETA has 15 decimals
			aopetaStakeId = await stakeContent(denominationAmount, "peta");
			account1BalanceAfter = await aopeta.balanceOf(account1);
			account1StakedBalanceAfter = await aopeta.stakedBalance(account1);
			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.minus(denominationAmount).toString(),
				"account1 has incorrect balance after staking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.toNumber() + denominationAmount,
				"account1 has incorrect staked balance after staking"
			);

			// Test staking only AOEXA tokens
			account1BalanceBefore = await aoexa.balanceOf(account1);
			account1StakedBalanceBefore = await aoexa.stakedBalance(account1);
			// Here denominationAmount 1000 means 1e-15 AOEXA since AOEXA has 18 decimals
			aoexaStakeId = await stakeContent(denominationAmount, "exa");
			account1BalanceAfter = await aoexa.balanceOf(account1);
			account1StakedBalanceAfter = await aoexa.stakedBalance(account1);
			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.minus(denominationAmount).toString(),
				"account1 has incorrect balance after staking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.toNumber() + denominationAmount,
				"account1 has incorrect staked balance after staking"
			);

			// Test staking only AOZETTA tokens
			account1BalanceBefore = await aozetta.balanceOf(account1);
			account1StakedBalanceBefore = await aozetta.stakedBalance(account1);
			// Here denominationAmount 1000 means 1e-18 AOZETTA since AOZETTA has 21 decimals
			aozettaStakeId = await stakeContent(denominationAmount, "zetta");
			account1BalanceAfter = await aozetta.balanceOf(account1);
			account1StakedBalanceAfter = await aozetta.stakedBalance(account1);
			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.minus(denominationAmount).toString(),
				"account1 has incorrect balance after staking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.toNumber() + denominationAmount,
				"account1 has incorrect staked balance after staking"
			);

			// Test staking only AOYOTTA tokens
			account1BalanceBefore = await aoyotta.balanceOf(account1);
			account1StakedBalanceBefore = await aoyotta.stakedBalance(account1);
			// Here denominationAmount 1000 means 1e-21 AOYOTTA since AOYOTTA has 24 decimals
			aoyottaStakeId = await stakeContent(denominationAmount, "yotta");
			account1BalanceAfter = await aoyotta.balanceOf(account1);
			account1StakedBalanceAfter = await aoyotta.stakedBalance(account1);
			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.minus(denominationAmount).toString(),
				"account1 has incorrect balance after staking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.toNumber() + denominationAmount,
				"account1 has incorrect staked balance after staking"
			);

			// Test staking only AOXONA tokens
			account1BalanceBefore = await aoxona.balanceOf(account1);
			account1StakedBalanceBefore = await aoxona.stakedBalance(account1);
			// Here denominationAmount 1000 means 1e-24 AOXONA since AOXONA has 27 decimals
			aoxonaStakeId = await stakeContent(denominationAmount, "xona");
			account1BalanceAfter = await aoxona.balanceOf(account1);
			account1StakedBalanceAfter = await aoxona.stakedBalance(account1);
			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.minus(denominationAmount).toString(),
				"account1 has incorrect balance after staking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.toNumber() + denominationAmount,
				"account1 has incorrect staked balance after staking"
			);
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
			assert.equal(stakedContent[1].toNumber(), 0, "stakedContentById returns incorrect denominationAmount");
			assert.equal(web3.toAscii(stakedContent[2]).replace(/\0/g, ""), "", "stakedContentById returns incorrect denomination");
			assert.equal(stakedContent[3].toNumber(), 1000, "stakedContentById returns incorrect icoTokenAmount");
			assert.equal(
				stakedContent[4].toNumber(),
				account1WeightedIndex.toNumber(),
				"stakedContentById returns incorrect icoTokenWeightedIndex"
			);
			assert.equal(stakedContent[5], datKey, "stakedContentById returns incorrect datKey");
			assert.equal(stakedContent[6].toNumber(), fileSize, "stakedContentById returns incorrect fileSize");
			assert.equal(stakedContent[7], true, "stakedContentById returns incorrect status");
		});

		it("stakeContent() - should be able to stake content with both normal ERC20 AO Tokens and AO ICO tokens", async function() {
			var account1WeightedIndex = await aotoken.weightedIndexByAddress(account1);
			var denominationAmount = 950;
			var icoTokenAmount = 50;

			var stakeContent = async function(denomination) {
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
				assert.equal(stakedContent[1].toNumber(), denominationAmount, "stakedContentById returns incorrect denominationAmount");
				assert.equal(
					web3.toAscii(stakedContent[2]).replace(/\0/g, ""),
					denomination,
					"stakedContentById returns incorrect denomination"
				);
				assert.equal(stakedContent[3].toNumber(), icoTokenAmount, "stakedContentById returns incorrect icoTokenAmount");
				assert.equal(
					stakedContent[4].toNumber(),
					account1WeightedIndex.toNumber(),
					"stakedContentById returns incorrect icoTokenWeightedIndex"
				);
				assert.equal(stakedContent[5], datKey, "stakedContentById returns incorrect datKey");
				assert.equal(stakedContent[6].toNumber(), fileSize, "stakedContentById returns incorrect fileSize");
				assert.equal(stakedContent[7], true, "stakedContentById returns incorrect status");
				return stakeId;
			};

			// Test staking the base AO Token and AO ICO Token
			var account1BalanceBefore = await aotoken.balanceOf(account1);
			var account1StakedBalanceBefore = await aotoken.stakedBalance(account1);
			var account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
			var account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, account1WeightedIndex.toNumber());
			aotokenStakeId = await stakeContent("ao");
			var account1BalanceAfter = await aotoken.balanceOf(account1);
			var account1StakedBalanceAfter = await aotoken.stakedBalance(account1);
			var account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
			var account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, account1WeightedIndex.toNumber());
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.toNumber() - denominationAmount,
				"account1 has incorrect balance after staking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.toNumber() + denominationAmount,
				"account1 has incorrect staked balance after staking"
			);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.toNumber() - icoTokenAmount,
				"account1 has incorrect ICO balance after staking"
			);
			assert.equal(
				account1IcoStakedBalanceAfter.toNumber(),
				account1IcoStakedBalanceBefore.toNumber() + icoTokenAmount,
				"account1 has incorrect ICO staked balance after staking"
			);

			// Test staking AOKILO Token and AO ICO Token
			account1BalanceBefore = await aokilo.balanceOf(account1);
			account1StakedBalanceBefore = await aokilo.stakedBalance(account1);
			account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
			account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, account1WeightedIndex.toNumber());
			aokiloStakeId = await stakeContent("kilo");
			account1BalanceAfter = await aokilo.balanceOf(account1);
			account1StakedBalanceAfter = await aokilo.stakedBalance(account1);
			account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
			account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, account1WeightedIndex.toNumber());
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.toNumber() - denominationAmount,
				"account1 has incorrect balance after staking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.toNumber() + denominationAmount,
				"account1 has incorrect staked balance after staking"
			);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.toNumber() - icoTokenAmount,
				"account1 has incorrect ICO balance after staking"
			);
			assert.equal(
				account1IcoStakedBalanceAfter.toNumber(),
				account1IcoStakedBalanceBefore.toNumber() + icoTokenAmount,
				"account1 has incorrect ICO staked balance after staking"
			);

			// Test staking AOMEGA Token and AO ICO Token
			account1BalanceBefore = await aomega.balanceOf(account1);
			account1StakedBalanceBefore = await aomega.stakedBalance(account1);
			account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
			account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, account1WeightedIndex.toNumber());
			aomegaStakeId = await stakeContent("mega");
			account1BalanceAfter = await aomega.balanceOf(account1);
			account1StakedBalanceAfter = await aomega.stakedBalance(account1);
			account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
			account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, account1WeightedIndex.toNumber());
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.toNumber() - denominationAmount,
				"account1 has incorrect balance after staking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.toNumber() + denominationAmount,
				"account1 has incorrect staked balance after staking"
			);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.toNumber() - icoTokenAmount,
				"account1 has incorrect ICO balance after staking"
			);
			assert.equal(
				account1IcoStakedBalanceAfter.toNumber(),
				account1IcoStakedBalanceBefore.toNumber() + icoTokenAmount,
				"account1 has incorrect ICO staked balance after staking"
			);

			// Test staking AOGIGA Token and AO ICO Token
			account1BalanceBefore = await aogiga.balanceOf(account1);
			account1StakedBalanceBefore = await aogiga.stakedBalance(account1);
			account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
			account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, account1WeightedIndex.toNumber());
			aogigaStakeId = await stakeContent("giga");
			account1BalanceAfter = await aogiga.balanceOf(account1);
			account1StakedBalanceAfter = await aogiga.stakedBalance(account1);
			account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
			account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, account1WeightedIndex.toNumber());
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.toNumber() - denominationAmount,
				"account1 has incorrect balance after staking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.toNumber() + denominationAmount,
				"account1 has incorrect staked balance after staking"
			);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.toNumber() - icoTokenAmount,
				"account1 has incorrect ICO balance after staking"
			);
			assert.equal(
				account1IcoStakedBalanceAfter.toNumber(),
				account1IcoStakedBalanceBefore.toNumber() + icoTokenAmount,
				"account1 has incorrect ICO staked balance after staking"
			);

			// Test staking AOTERA Token and AO ICO Token
			account1BalanceBefore = await aotera.balanceOf(account1);
			account1StakedBalanceBefore = await aotera.stakedBalance(account1);
			account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
			account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, account1WeightedIndex.toNumber());
			aoteraStakeId = await stakeContent("tera");
			account1BalanceAfter = await aotera.balanceOf(account1);
			account1StakedBalanceAfter = await aotera.stakedBalance(account1);
			account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
			account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, account1WeightedIndex.toNumber());
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.toNumber() - denominationAmount,
				"account1 has incorrect balance after staking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.toNumber() + denominationAmount,
				"account1 has incorrect staked balance after staking"
			);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.toNumber() - icoTokenAmount,
				"account1 has incorrect ICO balance after staking"
			);
			assert.equal(
				account1IcoStakedBalanceAfter.toNumber(),
				account1IcoStakedBalanceBefore.toNumber() + icoTokenAmount,
				"account1 has incorrect ICO staked balance after staking"
			);

			// Test staking AOPETA Token and AO ICO Token
			account1BalanceBefore = await aopeta.balanceOf(account1);
			account1StakedBalanceBefore = await aopeta.stakedBalance(account1);
			account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
			account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, account1WeightedIndex.toNumber());
			aopetaStakeId = await stakeContent("peta");
			account1BalanceAfter = await aopeta.balanceOf(account1);
			account1StakedBalanceAfter = await aopeta.stakedBalance(account1);
			account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
			account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, account1WeightedIndex.toNumber());
			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.minus(denominationAmount).toString(),
				"account1 has incorrect balance after staking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.toNumber() + denominationAmount,
				"account1 has incorrect staked balance after staking"
			);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.toNumber() - icoTokenAmount,
				"account1 has incorrect ICO balance after staking"
			);
			assert.equal(
				account1IcoStakedBalanceAfter.toNumber(),
				account1IcoStakedBalanceBefore.toNumber() + icoTokenAmount,
				"account1 has incorrect ICO staked balance after staking"
			);

			// Test staking AOEXA Token and AO ICO Token
			account1BalanceBefore = await aoexa.balanceOf(account1);
			account1StakedBalanceBefore = await aoexa.stakedBalance(account1);
			account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
			account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, account1WeightedIndex.toNumber());
			aoexaStakeId = await stakeContent("exa");
			account1BalanceAfter = await aoexa.balanceOf(account1);
			account1StakedBalanceAfter = await aoexa.stakedBalance(account1);
			account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
			account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, account1WeightedIndex.toNumber());
			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.minus(denominationAmount).toString(),
				"account1 has incorrect balance after staking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.toNumber() + denominationAmount,
				"account1 has incorrect staked balance after staking"
			);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.toNumber() - icoTokenAmount,
				"account1 has incorrect ICO balance after staking"
			);
			assert.equal(
				account1IcoStakedBalanceAfter.toNumber(),
				account1IcoStakedBalanceBefore.toNumber() + icoTokenAmount,
				"account1 has incorrect ICO staked balance after staking"
			);

			// Test staking AOZETTA Token and AO ICO Token
			account1BalanceBefore = await aozetta.balanceOf(account1);
			account1StakedBalanceBefore = await aozetta.stakedBalance(account1);
			account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
			account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, account1WeightedIndex.toNumber());
			aozettaStakeId = await stakeContent("zetta");
			account1BalanceAfter = await aozetta.balanceOf(account1);
			account1StakedBalanceAfter = await aozetta.stakedBalance(account1);
			account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
			account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, account1WeightedIndex.toNumber());
			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.minus(denominationAmount).toString(),
				"account1 has incorrect balance after staking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.toNumber() + denominationAmount,
				"account1 has incorrect staked balance after staking"
			);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.toNumber() - icoTokenAmount,
				"account1 has incorrect ICO balance after staking"
			);
			assert.equal(
				account1IcoStakedBalanceAfter.toNumber(),
				account1IcoStakedBalanceBefore.toNumber() + icoTokenAmount,
				"account1 has incorrect ICO staked balance after staking"
			);

			// Test staking AOYOTTA Token and AO ICO Token
			account1BalanceBefore = await aoyotta.balanceOf(account1);
			account1StakedBalanceBefore = await aoyotta.stakedBalance(account1);
			account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
			account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, account1WeightedIndex.toNumber());
			aoyottaStakeId = await stakeContent("yotta");
			account1BalanceAfter = await aoyotta.balanceOf(account1);
			account1StakedBalanceAfter = await aoyotta.stakedBalance(account1);
			account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
			account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, account1WeightedIndex.toNumber());
			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.minus(denominationAmount).toString(),
				"account1 has incorrect balance after staking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.toNumber() + denominationAmount,
				"account1 has incorrect staked balance after staking"
			);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.toNumber() - icoTokenAmount,
				"account1 has incorrect ICO balance after staking"
			);
			assert.equal(
				account1IcoStakedBalanceAfter.toNumber(),
				account1IcoStakedBalanceBefore.toNumber() + icoTokenAmount,
				"account1 has incorrect ICO staked balance after staking"
			);

			// Test staking AOXONA Token and AO ICO Token
			account1BalanceBefore = await aoxona.balanceOf(account1);
			account1StakedBalanceBefore = await aoxona.stakedBalance(account1);
			account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
			account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, account1WeightedIndex.toNumber());
			aoxonaStakeId = await stakeContent("xona");
			account1BalanceAfter = await aoxona.balanceOf(account1);
			account1StakedBalanceAfter = await aoxona.stakedBalance(account1);
			account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
			account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, account1WeightedIndex.toNumber());
			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.minus(denominationAmount).toString(),
				"account1 has incorrect balance after staking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.toNumber() + denominationAmount,
				"account1 has incorrect staked balance after staking"
			);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.toNumber() - icoTokenAmount,
				"account1 has incorrect ICO balance after staking"
			);
			assert.equal(
				account1IcoStakedBalanceAfter.toNumber(),
				account1IcoStakedBalanceBefore.toNumber() + icoTokenAmount,
				"account1 has incorrect ICO staked balance after staking"
			);
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
			var unstakeContent = async function(stakeId) {
				var canUnstake;
				try {
					await aocontent.unstakeContent(stakeId, { from: account1 });
					canUnstake = true;
				} catch (e) {
					canUnstake = false;
				}
				assert.equal(canUnstake, true, "Stake owner address unable to unstake existing staked content");
			};

			// Test unstaking the base AO Token and AO ICO Token
			var stakedContentBefore = await aocontent.stakedContentById(aotokenStakeId);
			var account1BalanceBefore = await aotoken.balanceOf(account1);
			var account1StakedBalanceBefore = await aotoken.stakedBalance(account1);
			var account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
			var account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, stakedContentBefore[4].toNumber());
			var account1WeightedIndexBefore = await aotoken.weightedIndexByAddress(account1);
			await unstakeContent(aotokenStakeId);
			var stakedContentAfter = await aocontent.stakedContentById(aotokenStakeId);
			var account1BalanceAfter = await aotoken.balanceOf(account1);
			var account1StakedBalanceAfter = await aotoken.stakedBalance(account1);
			var account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
			var account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, stakedContentBefore[4].toNumber());
			var account1WeightedIndexAfter = await aotoken.weightedIndexByAddress(account1);
			assert.equal(stakedContentAfter[1].toNumber(), 0, "Staked content has incorrect denominationAmount after unstaking");
			assert.equal(
				web3.toAscii(stakedContentAfter[2]).replace(/\0/g, ""),
				"",
				"Staked content has incorrect denomination after unstaking"
			);
			assert.equal(stakedContentAfter[3].toNumber(), 0, "Staked content has incorrect icoTokenAmount after unstaking");
			assert.equal(stakedContentAfter[4].toNumber(), 0, "Staked content has incorrect icoTokenWeightedIndex after unstaking");
			assert.equal(stakedContentAfter[7], false, "Staked content has incorrect status after unstaking");
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.plus(stakedContentBefore[1]).toNumber(),
				"Account1 has incorrect balance after unstaking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.minus(stakedContentBefore[1]).toNumber(),
				"Account1 has incorrect staked balance after unstaking"
			);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.plus(stakedContentBefore[3]).toNumber(),
				"Account1 has incorrect ICO balance after unstaking"
			);
			assert.equal(
				account1IcoStakedBalanceAfter.toNumber(),
				account1IcoStakedBalanceBefore.minus(stakedContentBefore[3]).toNumber(),
				"Account1 has incorrect ICO staked balance after unstaking"
			);
			var totalWeightedTokens = account1WeightedIndexBefore
				.times(account1IcoBalanceBefore)
				.plus(stakedContentBefore[4].times(stakedContentBefore[3]));
			var totalTokens = account1IcoBalanceBefore.add(stakedContentBefore[3]);
			var newWeightedIndex = parseInt(totalWeightedTokens.div(totalTokens).toNumber());
			assert.equal(account1WeightedIndexAfter.toNumber(), newWeightedIndex, "Account1 has incorrect weighted index after unstaking");

			// Test unstaking AOKILO Token and AO ICO Token
			var stakedContentBefore = await aocontent.stakedContentById(aokiloStakeId);
			var account1BalanceBefore = await aokilo.balanceOf(account1);
			var account1StakedBalanceBefore = await aokilo.stakedBalance(account1);
			var account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
			var account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, stakedContentBefore[4].toNumber());
			var account1WeightedIndexBefore = await aotoken.weightedIndexByAddress(account1);
			await unstakeContent(aokiloStakeId);
			var stakedContentAfter = await aocontent.stakedContentById(aokiloStakeId);
			var account1BalanceAfter = await aokilo.balanceOf(account1);
			var account1StakedBalanceAfter = await aokilo.stakedBalance(account1);
			var account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
			var account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, stakedContentBefore[4].toNumber());
			var account1WeightedIndexAfter = await aotoken.weightedIndexByAddress(account1);
			assert.equal(stakedContentAfter[1].toNumber(), 0, "Staked content has incorrect denominationAmount after unstaking");
			assert.equal(
				web3.toAscii(stakedContentAfter[2]).replace(/\0/g, ""),
				"",
				"Staked content has incorrect denomination after unstaking"
			);
			assert.equal(stakedContentAfter[3].toNumber(), 0, "Staked content has incorrect icoTokenAmount after unstaking");
			assert.equal(stakedContentAfter[4].toNumber(), 0, "Staked content has incorrect icoTokenWeightedIndex after unstaking");
			assert.equal(stakedContentAfter[7], false, "Staked content has incorrect status after unstaking");
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.plus(stakedContentBefore[1]).toNumber(),
				"Account1 has incorrect balance after unstaking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.minus(stakedContentBefore[1]).toNumber(),
				"Account1 has incorrect staked balance after unstaking"
			);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.plus(stakedContentBefore[3]).toNumber(),
				"Account1 has incorrect ICO balance after unstaking"
			);
			assert.equal(
				account1IcoStakedBalanceAfter.toNumber(),
				account1IcoStakedBalanceBefore.minus(stakedContentBefore[3]).toNumber(),
				"Account1 has incorrect ICO staked balance after unstaking"
			);
			var totalWeightedTokens = account1WeightedIndexBefore
				.times(account1IcoBalanceBefore)
				.plus(stakedContentBefore[4].times(stakedContentBefore[3]));
			var totalTokens = account1IcoBalanceBefore.add(stakedContentBefore[3]);
			var newWeightedIndex = parseInt(totalWeightedTokens.div(totalTokens).toNumber());
			assert.equal(account1WeightedIndexAfter.toNumber(), newWeightedIndex, "Account1 has incorrect weighted index after unstaking");

			// Test unstaking AOMEGA Token and AO ICO Token
			var stakedContentBefore = await aocontent.stakedContentById(aomegaStakeId);
			var account1BalanceBefore = await aomega.balanceOf(account1);
			var account1StakedBalanceBefore = await aomega.stakedBalance(account1);
			var account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
			var account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, stakedContentBefore[4].toNumber());
			var account1WeightedIndexBefore = await aotoken.weightedIndexByAddress(account1);
			await unstakeContent(aomegaStakeId);
			var stakedContentAfter = await aocontent.stakedContentById(aomegaStakeId);
			var account1BalanceAfter = await aomega.balanceOf(account1);
			var account1StakedBalanceAfter = await aomega.stakedBalance(account1);
			var account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
			var account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, stakedContentBefore[4].toNumber());
			var account1WeightedIndexAfter = await aotoken.weightedIndexByAddress(account1);
			assert.equal(stakedContentAfter[1].toNumber(), 0, "Staked content has incorrect denominationAmount after unstaking");
			assert.equal(
				web3.toAscii(stakedContentAfter[2]).replace(/\0/g, ""),
				"",
				"Staked content has incorrect denomination after unstaking"
			);
			assert.equal(stakedContentAfter[3].toNumber(), 0, "Staked content has incorrect icoTokenAmount after unstaking");
			assert.equal(stakedContentAfter[4].toNumber(), 0, "Staked content has incorrect icoTokenWeightedIndex after unstaking");
			assert.equal(stakedContentAfter[7], false, "Staked content has incorrect status after unstaking");
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.plus(stakedContentBefore[1]).toNumber(),
				"Account1 has incorrect balance after unstaking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.minus(stakedContentBefore[1]).toNumber(),
				"Account1 has incorrect staked balance after unstaking"
			);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.plus(stakedContentBefore[3]).toNumber(),
				"Account1 has incorrect ICO balance after unstaking"
			);
			assert.equal(
				account1IcoStakedBalanceAfter.toNumber(),
				account1IcoStakedBalanceBefore.minus(stakedContentBefore[3]).toNumber(),
				"Account1 has incorrect ICO staked balance after unstaking"
			);
			var totalWeightedTokens = account1WeightedIndexBefore
				.times(account1IcoBalanceBefore)
				.plus(stakedContentBefore[4].times(stakedContentBefore[3]));
			var totalTokens = account1IcoBalanceBefore.add(stakedContentBefore[3]);
			var newWeightedIndex = parseInt(totalWeightedTokens.div(totalTokens).toNumber());
			assert.equal(account1WeightedIndexAfter.toNumber(), newWeightedIndex, "Account1 has incorrect weighted index after unstaking");

			// Test unstaking AOGIGA Token and AO ICO Token
			var stakedContentBefore = await aocontent.stakedContentById(aogigaStakeId);
			var account1BalanceBefore = await aogiga.balanceOf(account1);
			var account1StakedBalanceBefore = await aogiga.stakedBalance(account1);
			var account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
			var account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, stakedContentBefore[4].toNumber());
			var account1WeightedIndexBefore = await aotoken.weightedIndexByAddress(account1);
			await unstakeContent(aogigaStakeId);
			var stakedContentAfter = await aocontent.stakedContentById(aogigaStakeId);
			var account1BalanceAfter = await aogiga.balanceOf(account1);
			var account1StakedBalanceAfter = await aogiga.stakedBalance(account1);
			var account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
			var account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, stakedContentBefore[4].toNumber());
			var account1WeightedIndexAfter = await aotoken.weightedIndexByAddress(account1);
			assert.equal(stakedContentAfter[1].toNumber(), 0, "Staked content has incorrect denominationAmount after unstaking");
			assert.equal(
				web3.toAscii(stakedContentAfter[2]).replace(/\0/g, ""),
				"",
				"Staked content has incorrect denomination after unstaking"
			);
			assert.equal(stakedContentAfter[3].toNumber(), 0, "Staked content has incorrect icoTokenAmount after unstaking");
			assert.equal(stakedContentAfter[4].toNumber(), 0, "Staked content has incorrect icoTokenWeightedIndex after unstaking");
			assert.equal(stakedContentAfter[7], false, "Staked content has incorrect status after unstaking");
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.plus(stakedContentBefore[1]).toNumber(),
				"Account1 has incorrect balance after unstaking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.minus(stakedContentBefore[1]).toNumber(),
				"Account1 has incorrect staked balance after unstaking"
			);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.plus(stakedContentBefore[3]).toNumber(),
				"Account1 has incorrect ICO balance after unstaking"
			);
			assert.equal(
				account1IcoStakedBalanceAfter.toNumber(),
				account1IcoStakedBalanceBefore.minus(stakedContentBefore[3]).toNumber(),
				"Account1 has incorrect ICO staked balance after unstaking"
			);
			var totalWeightedTokens = account1WeightedIndexBefore
				.times(account1IcoBalanceBefore)
				.plus(stakedContentBefore[4].times(stakedContentBefore[3]));
			var totalTokens = account1IcoBalanceBefore.add(stakedContentBefore[3]);
			var newWeightedIndex = parseInt(totalWeightedTokens.div(totalTokens).toNumber());
			assert.equal(account1WeightedIndexAfter.toNumber(), newWeightedIndex, "Account1 has incorrect weighted index after unstaking");

			// Test unstaking AOTERA Token and AO ICO Token
			var stakedContentBefore = await aocontent.stakedContentById(aoteraStakeId);
			var account1BalanceBefore = await aotera.balanceOf(account1);
			var account1StakedBalanceBefore = await aotera.stakedBalance(account1);
			var account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
			var account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, stakedContentBefore[4].toNumber());
			var account1WeightedIndexBefore = await aotoken.weightedIndexByAddress(account1);
			await unstakeContent(aoteraStakeId);
			var stakedContentAfter = await aocontent.stakedContentById(aoteraStakeId);
			var account1BalanceAfter = await aotera.balanceOf(account1);
			var account1StakedBalanceAfter = await aotera.stakedBalance(account1);
			var account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
			var account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, stakedContentBefore[4].toNumber());
			var account1WeightedIndexAfter = await aotoken.weightedIndexByAddress(account1);
			assert.equal(stakedContentAfter[1].toNumber(), 0, "Staked content has incorrect denominationAmount after unstaking");
			assert.equal(
				web3.toAscii(stakedContentAfter[2]).replace(/\0/g, ""),
				"",
				"Staked content has incorrect denomination after unstaking"
			);
			assert.equal(stakedContentAfter[3].toNumber(), 0, "Staked content has incorrect icoTokenAmount after unstaking");
			assert.equal(stakedContentAfter[4].toNumber(), 0, "Staked content has incorrect icoTokenWeightedIndex after unstaking");
			assert.equal(stakedContentAfter[7], false, "Staked content has incorrect status after unstaking");
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.plus(stakedContentBefore[1]).toNumber(),
				"Account1 has incorrect balance after unstaking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.minus(stakedContentBefore[1]).toNumber(),
				"Account1 has incorrect staked balance after unstaking"
			);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.plus(stakedContentBefore[3]).toNumber(),
				"Account1 has incorrect ICO balance after unstaking"
			);
			assert.equal(
				account1IcoStakedBalanceAfter.toNumber(),
				account1IcoStakedBalanceBefore.minus(stakedContentBefore[3]).toNumber(),
				"Account1 has incorrect ICO staked balance after unstaking"
			);
			var totalWeightedTokens = account1WeightedIndexBefore
				.times(account1IcoBalanceBefore)
				.plus(stakedContentBefore[4].times(stakedContentBefore[3]));
			var totalTokens = account1IcoBalanceBefore.add(stakedContentBefore[3]);
			var newWeightedIndex = parseInt(totalWeightedTokens.div(totalTokens).toNumber());
			assert.equal(account1WeightedIndexAfter.toNumber(), newWeightedIndex, "Account1 has incorrect weighted index after unstaking");

			// Test unstaking AOPETA Token and AO ICO Token
			var stakedContentBefore = await aocontent.stakedContentById(aopetaStakeId);
			var account1BalanceBefore = await aopeta.balanceOf(account1);
			var account1StakedBalanceBefore = await aopeta.stakedBalance(account1);
			var account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
			var account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, stakedContentBefore[4].toNumber());
			var account1WeightedIndexBefore = await aotoken.weightedIndexByAddress(account1);
			await unstakeContent(aopetaStakeId);
			var stakedContentAfter = await aocontent.stakedContentById(aopetaStakeId);
			var account1BalanceAfter = await aopeta.balanceOf(account1);
			var account1StakedBalanceAfter = await aopeta.stakedBalance(account1);
			var account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
			var account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, stakedContentBefore[4].toNumber());
			var account1WeightedIndexAfter = await aotoken.weightedIndexByAddress(account1);
			assert.equal(stakedContentAfter[1].toNumber(), 0, "Staked content has incorrect denominationAmount after unstaking");
			assert.equal(
				web3.toAscii(stakedContentAfter[2]).replace(/\0/g, ""),
				"",
				"Staked content has incorrect denomination after unstaking"
			);
			assert.equal(stakedContentAfter[3].toNumber(), 0, "Staked content has incorrect icoTokenAmount after unstaking");
			assert.equal(stakedContentAfter[4].toNumber(), 0, "Staked content has incorrect icoTokenWeightedIndex after unstaking");
			assert.equal(stakedContentAfter[7], false, "Staked content has incorrect status after unstaking");
			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.plus(stakedContentBefore[1]).toString(),
				"Account1 has incorrect balance after unstaking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.minus(stakedContentBefore[1]).toNumber(),
				"Account1 has incorrect staked balance after unstaking"
			);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.plus(stakedContentBefore[3]).toNumber(),
				"Account1 has incorrect ICO balance after unstaking"
			);
			assert.equal(
				account1IcoStakedBalanceAfter.toNumber(),
				account1IcoStakedBalanceBefore.minus(stakedContentBefore[3]).toNumber(),
				"Account1 has incorrect ICO staked balance after unstaking"
			);
			var totalWeightedTokens = account1WeightedIndexBefore
				.times(account1IcoBalanceBefore)
				.plus(stakedContentBefore[4].times(stakedContentBefore[3]));
			var totalTokens = account1IcoBalanceBefore.add(stakedContentBefore[3]);
			var newWeightedIndex = parseInt(totalWeightedTokens.div(totalTokens).toNumber());
			assert.equal(account1WeightedIndexAfter.toNumber(), newWeightedIndex, "Account1 has incorrect weighted index after unstaking");

			// Test unstaking AOEXA Token and AO ICO Token
			var stakedContentBefore = await aocontent.stakedContentById(aoexaStakeId);
			var account1BalanceBefore = await aoexa.balanceOf(account1);
			var account1StakedBalanceBefore = await aoexa.stakedBalance(account1);
			var account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
			var account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, stakedContentBefore[4].toNumber());
			var account1WeightedIndexBefore = await aotoken.weightedIndexByAddress(account1);
			await unstakeContent(aoexaStakeId);
			var stakedContentAfter = await aocontent.stakedContentById(aoexaStakeId);
			var account1BalanceAfter = await aoexa.balanceOf(account1);
			var account1StakedBalanceAfter = await aoexa.stakedBalance(account1);
			var account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
			var account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, stakedContentBefore[4].toNumber());
			var account1WeightedIndexAfter = await aotoken.weightedIndexByAddress(account1);
			assert.equal(stakedContentAfter[1].toNumber(), 0, "Staked content has incorrect denominationAmount after unstaking");
			assert.equal(
				web3.toAscii(stakedContentAfter[2]).replace(/\0/g, ""),
				"",
				"Staked content has incorrect denomination after unstaking"
			);
			assert.equal(stakedContentAfter[3].toNumber(), 0, "Staked content has incorrect icoTokenAmount after unstaking");
			assert.equal(stakedContentAfter[4].toNumber(), 0, "Staked content has incorrect icoTokenWeightedIndex after unstaking");
			assert.equal(stakedContentAfter[7], false, "Staked content has incorrect status after unstaking");
			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.plus(stakedContentBefore[1]).toString(),
				"Account1 has incorrect balance after unstaking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.minus(stakedContentBefore[1]).toNumber(),
				"Account1 has incorrect staked balance after unstaking"
			);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.plus(stakedContentBefore[3]).toNumber(),
				"Account1 has incorrect ICO balance after unstaking"
			);
			assert.equal(
				account1IcoStakedBalanceAfter.toNumber(),
				account1IcoStakedBalanceBefore.minus(stakedContentBefore[3]).toNumber(),
				"Account1 has incorrect ICO staked balance after unstaking"
			);
			var totalWeightedTokens = account1WeightedIndexBefore
				.times(account1IcoBalanceBefore)
				.plus(stakedContentBefore[4].times(stakedContentBefore[3]));
			var totalTokens = account1IcoBalanceBefore.add(stakedContentBefore[3]);
			var newWeightedIndex = parseInt(totalWeightedTokens.div(totalTokens).toNumber());
			assert.equal(account1WeightedIndexAfter.toNumber(), newWeightedIndex, "Account1 has incorrect weighted index after unstaking");

			// Test unstaking AOZETTA Token and AO ICO Token
			var stakedContentBefore = await aocontent.stakedContentById(aozettaStakeId);
			var account1BalanceBefore = await aozetta.balanceOf(account1);
			var account1StakedBalanceBefore = await aozetta.stakedBalance(account1);
			var account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
			var account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, stakedContentBefore[4].toNumber());
			var account1WeightedIndexBefore = await aotoken.weightedIndexByAddress(account1);
			await unstakeContent(aozettaStakeId);
			var stakedContentAfter = await aocontent.stakedContentById(aozettaStakeId);
			var account1BalanceAfter = await aozetta.balanceOf(account1);
			var account1StakedBalanceAfter = await aozetta.stakedBalance(account1);
			var account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
			var account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, stakedContentBefore[4].toNumber());
			var account1WeightedIndexAfter = await aotoken.weightedIndexByAddress(account1);
			assert.equal(stakedContentAfter[1].toNumber(), 0, "Staked content has incorrect denominationAmount after unstaking");
			assert.equal(
				web3.toAscii(stakedContentAfter[2]).replace(/\0/g, ""),
				"",
				"Staked content has incorrect denomination after unstaking"
			);
			assert.equal(stakedContentAfter[3].toNumber(), 0, "Staked content has incorrect icoTokenAmount after unstaking");
			assert.equal(stakedContentAfter[4].toNumber(), 0, "Staked content has incorrect icoTokenWeightedIndex after unstaking");
			assert.equal(stakedContentAfter[7], false, "Staked content has incorrect status after unstaking");
			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.plus(stakedContentBefore[1]).toString(),
				"Account1 has incorrect balance after unstaking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.minus(stakedContentBefore[1]).toNumber(),
				"Account1 has incorrect staked balance after unstaking"
			);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.plus(stakedContentBefore[3]).toNumber(),
				"Account1 has incorrect ICO balance after unstaking"
			);
			assert.equal(
				account1IcoStakedBalanceAfter.toNumber(),
				account1IcoStakedBalanceBefore.minus(stakedContentBefore[3]).toNumber(),
				"Account1 has incorrect ICO staked balance after unstaking"
			);
			var totalWeightedTokens = account1WeightedIndexBefore
				.times(account1IcoBalanceBefore)
				.plus(stakedContentBefore[4].times(stakedContentBefore[3]));
			var totalTokens = account1IcoBalanceBefore.add(stakedContentBefore[3]);
			var newWeightedIndex = parseInt(totalWeightedTokens.div(totalTokens).toNumber());
			assert.equal(account1WeightedIndexAfter.toNumber(), newWeightedIndex, "Account1 has incorrect weighted index after unstaking");

			// Test unstaking AOYOTTA Token and AO ICO Token
			var stakedContentBefore = await aocontent.stakedContentById(aoyottaStakeId);
			var account1BalanceBefore = await aoyotta.balanceOf(account1);
			var account1StakedBalanceBefore = await aoyotta.stakedBalance(account1);
			var account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
			var account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, stakedContentBefore[4].toNumber());
			var account1WeightedIndexBefore = await aotoken.weightedIndexByAddress(account1);
			await unstakeContent(aoyottaStakeId);
			var stakedContentAfter = await aocontent.stakedContentById(aoyottaStakeId);
			var account1BalanceAfter = await aoyotta.balanceOf(account1);
			var account1StakedBalanceAfter = await aoyotta.stakedBalance(account1);
			var account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
			var account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, stakedContentBefore[4].toNumber());
			var account1WeightedIndexAfter = await aotoken.weightedIndexByAddress(account1);
			assert.equal(stakedContentAfter[1].toNumber(), 0, "Staked content has incorrect denominationAmount after unstaking");
			assert.equal(
				web3.toAscii(stakedContentAfter[2]).replace(/\0/g, ""),
				"",
				"Staked content has incorrect denomination after unstaking"
			);
			assert.equal(stakedContentAfter[3].toNumber(), 0, "Staked content has incorrect icoTokenAmount after unstaking");
			assert.equal(stakedContentAfter[4].toNumber(), 0, "Staked content has incorrect icoTokenWeightedIndex after unstaking");
			assert.equal(stakedContentAfter[7], false, "Staked content has incorrect status after unstaking");
			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.plus(stakedContentBefore[1]).toString(),
				"Account1 has incorrect balance after unstaking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.minus(stakedContentBefore[1]).toNumber(),
				"Account1 has incorrect staked balance after unstaking"
			);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.plus(stakedContentBefore[3]).toNumber(),
				"Account1 has incorrect ICO balance after unstaking"
			);
			assert.equal(
				account1IcoStakedBalanceAfter.toNumber(),
				account1IcoStakedBalanceBefore.minus(stakedContentBefore[3]).toNumber(),
				"Account1 has incorrect ICO staked balance after unstaking"
			);
			var totalWeightedTokens = account1WeightedIndexBefore
				.times(account1IcoBalanceBefore)
				.plus(stakedContentBefore[4].times(stakedContentBefore[3]));
			var totalTokens = account1IcoBalanceBefore.add(stakedContentBefore[3]);
			var newWeightedIndex = parseInt(totalWeightedTokens.div(totalTokens).toNumber());
			assert.equal(account1WeightedIndexAfter.toNumber(), newWeightedIndex, "Account1 has incorrect weighted index after unstaking");

			// Test unstaking AOXONA Token and AO ICO Token
			var stakedContentBefore = await aocontent.stakedContentById(aoxonaStakeId);
			var account1BalanceBefore = await aoxona.balanceOf(account1);
			var account1StakedBalanceBefore = await aoxona.stakedBalance(account1);
			var account1IcoBalanceBefore = await aotoken.icoBalanceOf(account1);
			var account1IcoStakedBalanceBefore = await aotoken.icoStakedBalance(account1, stakedContentBefore[4].toNumber());
			var account1WeightedIndexBefore = await aotoken.weightedIndexByAddress(account1);
			await unstakeContent(aoxonaStakeId);
			var stakedContentAfter = await aocontent.stakedContentById(aoxonaStakeId);
			var account1BalanceAfter = await aoxona.balanceOf(account1);
			var account1StakedBalanceAfter = await aoxona.stakedBalance(account1);
			var account1IcoBalanceAfter = await aotoken.icoBalanceOf(account1);
			var account1IcoStakedBalanceAfter = await aotoken.icoStakedBalance(account1, stakedContentBefore[4].toNumber());
			var account1WeightedIndexAfter = await aotoken.weightedIndexByAddress(account1);
			assert.equal(stakedContentAfter[1].toNumber(), 0, "Staked content has incorrect denominationAmount after unstaking");
			assert.equal(
				web3.toAscii(stakedContentAfter[2]).replace(/\0/g, ""),
				"",
				"Staked content has incorrect denomination after unstaking"
			);
			assert.equal(stakedContentAfter[3].toNumber(), 0, "Staked content has incorrect icoTokenAmount after unstaking");
			assert.equal(stakedContentAfter[4].toNumber(), 0, "Staked content has incorrect icoTokenWeightedIndex after unstaking");
			assert.equal(stakedContentAfter[7], false, "Staked content has incorrect status after unstaking");
			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.plus(stakedContentBefore[1]).toString(),
				"Account1 has incorrect balance after unstaking"
			);
			assert.equal(
				account1StakedBalanceAfter.toNumber(),
				account1StakedBalanceBefore.minus(stakedContentBefore[1]).toNumber(),
				"Account1 has incorrect staked balance after unstaking"
			);
			assert.equal(
				account1IcoBalanceAfter.toNumber(),
				account1IcoBalanceBefore.plus(stakedContentBefore[3]).toNumber(),
				"Account1 has incorrect ICO balance after unstaking"
			);
			assert.equal(
				account1IcoStakedBalanceAfter.toNumber(),
				account1IcoStakedBalanceBefore.minus(stakedContentBefore[3]).toNumber(),
				"Account1 has incorrect ICO staked balance after unstaking"
			);
			var totalWeightedTokens = account1WeightedIndexBefore
				.times(account1IcoBalanceBefore)
				.plus(stakedContentBefore[4].times(stakedContentBefore[3]));
			var totalTokens = account1IcoBalanceBefore.add(stakedContentBefore[3]);
			var newWeightedIndex = parseInt(totalWeightedTokens.div(totalTokens).toNumber());
			assert.equal(account1WeightedIndexAfter.toNumber(), newWeightedIndex, "Account1 has incorrect weighted index after unstaking");
		});

		it("restakeContent() - should NOT be able to restake non-existing staked content", async function() {
			var canRestake;
			try {
				await aocontent.restakeContent("someid", { from: account1 });
				canRestake = true;
			} catch (e) {
				canRestake = false;
			}
			assert.notEqual(canRestake, true, "account1 can restake non-existing staked content");
		});

		it("restakeContent() - should NOT be able to restake existing staked content if stake owner is not the same as the sender", async function() {
			var restakeContent = async function(stakeId) {
				var canRestake;
				try {
					await aocontent.restakeContent(stakeId, { from: account2 });
					canRestake = true;
				} catch (e) {
					canRestake = false;
				}
				assert.notEqual(canRestake, true, "Non-stake owner address can restake existing staked content");
			};

			await restakeContent(aotokenStakeId);
			await restakeContent(aokiloStakeId);
			await restakeContent(aomegaStakeId);
			await restakeContent(aogigaStakeId);
			await restakeContent(aoteraStakeId);
			await restakeContent(aopetaStakeId);
			await restakeContent(aoexaStakeId);
			await restakeContent(aozettaStakeId);
			await restakeContent(aoyottaStakeId);
			await restakeContent(aoxonaStakeId);
		});
	});
});
