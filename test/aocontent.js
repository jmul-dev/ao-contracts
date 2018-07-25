var AOContent = artifacts.require("./AOContent.sol");

contract("AOContent", function(accounts) {
	var contentMeta;
	var owner = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	before(async function() {
		contentMeta = await AOContent.deployed();
	});
	contract("Owner Only Function Tests", function() {
		it("only owner can pause/unpause contract", async function() {
			var canPause;
			try {
				await contentMeta.setPaused(true, {from: account1});
				canPause = true;
			} catch (e) {
				canPause = false;
			}
			assert.notEqual(canPause, true, "Non-owner can pause contract");
			try {
				await contentMeta.setPaused(true, {from: owner});
				canPause = true;
			} catch (e) {
				canPause = false;
			}
			assert.equal(canPause, true, "Owner can't pause contract");
			var paused = await contentMeta.paused();
			assert.equal(paused, true, "Contract has incorrect paused value after owner set paused");
		});
		it("only owner can call escape hatch", async function() {
			var canEscapeHatch;
			try {
				await contentMeta.escapeHatch({from: account1});
				canEscapeHatch = true;
			} catch (e) {
				canEscapeHatch = false;
			}
			assert.notEqual(canEscapeHatch, true, "Non-owner can call escape hatch");
			try {
				await contentMeta.escapeHatch({from: owner});
				canEscapeHatch = true;
			} catch (e) {
				canEscapeHatch = false;
			}
			assert.equal(canEscapeHatch, true, "Owner can't call escape hatch");
			var killed = await contentMeta.killed();
			assert.equal(killed, true, "Contract has incorrect killed value after owner call escape hatch");

		});
	});
});
