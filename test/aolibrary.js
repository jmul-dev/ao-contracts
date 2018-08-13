var AOLibrary = artifacts.require("./AOLibrary.sol");

contract("AOLibrary", function(accounts) {
	var library;
	before(function() {
		return AOLibrary.deployed().then(function(instance) {
			library = instance;
		});
	});
	it("should calculate and return correct weighted index", async function() {
		var weightedIndex = await library.calculateWeightedIndex(1500000, 200, 3000000, 100);
		assert.equal(weightedIndex.toNumber(), 2000000, "Library returns incorrect weighted index");
	});
});
