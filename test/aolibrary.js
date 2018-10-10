var AOLibrary = artifacts.require("./AOLibrary.sol");

contract("AOLibrary", function(accounts) {
	var library;

	before(function() {
		return AOLibrary.deployed().then(function(instance) {
			library = instance;
		});
	});

	it("calculateWeightedMultiplier() - should calculate and return correct weighted multiplier", async function() {
		var weightedMultiplier = await library.calculateWeightedMultiplier(1500000, 200, 3000000, 100);
		assert.equal(weightedMultiplier.toNumber(), 2000000, "Library returns incorrect weighted multiplier");
	});

	it("calculatePrimordialMultiplier() - should calculate and return the correct primoridial multiplier on a given lot", async function() {
		var multiplier = await library.calculatePrimordialMultiplier(50, 1000, 300, 50 * 10 ** 6, 3 * 10 ** 6);
		assert.equal(multiplier.toNumber(), 31725000, "Library returns incorrect multiplier for a given lot");
	});

	it("calculateNetworkTokenBonusAmount() - should calculate and return the correct network token bonus amount on a given lot", async function() {
		var bonusAmount = await library.calculateNetworkTokenBonusAmount(50, 1000, 300, 1000000, 250000);
		assert.equal(bonusAmount.toNumber(), 25, "Library returns incorrect network token bonus amount for a given lot");
	});
});
