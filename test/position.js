var Position = artifacts.require("./Position.sol");

contract("Position", function(accounts) {
	var position;
	var developer = accounts[0];
	var nameId = accounts[1];
	var thoughtId = accounts[2];
	var account3 = accounts[3];
	var nameId2 = accounts[5];
	var thoughtId2 = accounts[6];
	var whitelistedAccount = accounts[4];
	var maxSupplyPerName;
	before(async function() {
		position = await Position.deployed();
	});
	contract("Variable Setting Tests", function() {
		it("should return correct name", async function() {
			var name = await position.name();
			assert.equal(name, "AO Position", "Contract has incorrect name");
		});

		it("should return correct symbol", async function() {
			var symbol = await position.symbol();
			assert.equal(symbol, "AOPOS", "Contract has incorrect symbol");
		});

		it("should return correct decimals", async function() {
			var decimals = await position.decimals();
			assert.equal(decimals.toNumber(), 4, "Contract has incorrect decimals");
		});

		it("should return correct MAX_SUPPLY_PER_NAME", async function() {
			maxSupplyPerName = await position.MAX_SUPPLY_PER_NAME();
			assert.equal(maxSupplyPerName.toNumber(), 100 * 10 ** 4, "Contract has incorrect MAX_SUPPLY_PER_NAME");
		});

		it("should have 0 total supply", async function() {
			var totalSupply = await position.totalSupply();
			assert.equal(totalSupply.toNumber(), 0, "Contract has incorrect total supply");
		});
	});
	contract("Public Function Tests", function() {
		before(async function() {
			await position.setWhitelist(whitelistedAccount, true, { from: developer });
		});

		it("mintToken() - only whitelisted address can mintToken", async function() {
			var canMintToken;
			try {
				await position.mintToken(nameId, { from: account3 });
				canMintToken = true;
			} catch (e) {
				canMintToken = false;
			}
			assert.notEqual(canMintToken, true, "Non-whitelisted account can mint token");

			try {
				await position.mintToken(nameId, { from: whitelistedAccount });
				canMintToken = true;
			} catch (e) {
				canMintToken = false;
			}
			assert.equal(canMintToken, true, "Whitelisted account can't mint token");

			var receivedToken = await position.receivedToken(nameId);
			assert.equal(receivedToken, true, "Contract has incorrect receivedToken value");

			var nameIdBalance = await position.balanceOf(nameId);
			assert.equal(nameIdBalance.toString(), maxSupplyPerName.toString(), "nameId has incorrect balance");

			try {
				await position.mintToken(nameId, { from: whitelistedAccount });
				canMintToken = true;
			} catch (e) {
				canMintToken = false;
			}
			assert.notEqual(canMintToken, true, "Whitelisted account can mint token for the same address more than once");
		});

		it("stake()", async function() {
			var canStake;
			try {
				await position.stake(nameId, thoughtId, 800000, { from: account3 });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "Non-whitelisted account can stake Position on behalf of nameId");

			try {
				await position.stake(nameId2, thoughtId, 800000, { from: whitelistedAccount });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "Whitelisted account can stake Position for Name with no balance");

			try {
				await position.stake(nameId, thoughtId, 10000000, { from: whitelistedAccount });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "Whitelisted account can stake Position more than MAX_SUPPLY_PER_NAME (100%)");

			try {
				await position.stake(nameId, thoughtId, 800000, { from: whitelistedAccount });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.equal(canStake, true, "Whitelisted account can't stake Position for Name's Thought ID");

			try {
				await position.stake(nameId, thoughtId2, 300000, { from: whitelistedAccount });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "Whitelisted account can stake Position more than Name's available balance");

			var nameIdBalance = await position.balanceOf(nameId);
			assert.equal(nameIdBalance.toString(), maxSupplyPerName.minus(800000).toString(), "Name has incorrect balance");

			var thoughtStakedBalance = await position.thoughtStakedBalance(nameId, thoughtId);
			assert.equal(thoughtStakedBalance.toString(), 800000, "Thought has incorrect staked balance");

			var totalThoughtStakedBalance = await position.totalThoughtStakedBalance(thoughtId);
			assert.equal(totalThoughtStakedBalance.toString(), 800000, "Thought has incorrect total staked balance");
		});

		it("stakedBalance()", async function() {
			var nameIdStakedBalance = await position.stakedBalance(nameId);
			assert.equal(nameIdStakedBalance.toString(), 800000, "Name has incorrect staked balance");
		});

		it("unstake()", async function() {
			var canUnstake;
			try {
				await position.unstake(nameId, thoughtId, 200000, { from: account3 });
				canUnstake = true;
			} catch (e) {
				canUnstake = false;
			}
			assert.notEqual(canUnstake, true, "Non-whitelisted account can unstake Position on behalf of nameId");

			try {
				await position.unstake(nameId, thoughtId, 10000000, { from: whitelistedAccount });
				canUnstake = true;
			} catch (e) {
				canUnstake = false;
			}
			assert.notEqual(canUnstake, true, "Whitelisted account can unstake Position more than MAX_SUPPLY_PER_NAME");

			try {
				await position.unstake(nameId, thoughtId, 900000, { from: whitelistedAccount });
				canUnstake = true;
			} catch (e) {
				canUnstake = false;
			}
			assert.notEqual(canUnstake, true, "Whitelisted account can unstake Position more than Thought's staked balance");

			var balanceBefore = await position.balanceOf(nameId);
			var thoughtStakedBalanceBefore = await position.thoughtStakedBalance(nameId, thoughtId);
			var totalThoughtStakedBalanceBefore = await position.totalThoughtStakedBalance(thoughtId);
			try {
				await position.unstake(nameId, thoughtId, 300000, { from: whitelistedAccount });
				canUnstake = true;
			} catch (e) {
				canUnstake = false;
			}
			assert.equal(canUnstake, true, "Whitelisted account can't unstake Position of a Name's Thought");

			var balanceAfter = await position.balanceOf(nameId);
			assert.equal(balanceAfter.toString(), balanceBefore.plus(300000).toString(), "Name has incorrect balance after unstaking");

			var thoughtStakedBalanceAfter = await position.thoughtStakedBalance(nameId, thoughtId);
			assert.equal(
				thoughtStakedBalanceAfter.toString(),
				thoughtStakedBalanceBefore.minus(300000).toString(),
				"Thought has incorrect staked balance after unstaking"
			);
			var totalThoughtStakedBalanceAfter = await position.totalThoughtStakedBalance(thoughtId);
			assert.equal(
				totalThoughtStakedBalanceAfter.toString(),
				totalThoughtStakedBalanceBefore.minus(300000).toString(),
				"Thought has incorrect total staked balance after unstaking"
			);
		});
	});
});
