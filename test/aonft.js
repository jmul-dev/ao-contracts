var AONFT = artifacts.require("./AONFT.sol");

contract("AONFT", function(accounts) {
	it("should return correct name", function() {
		return AONFT.deployed()
			.then(function(instance) {
				return instance.name.call();
			})
			.then(function(name) {
				assert.equal(name, "AO NFT", "Contract has the wrong name");
			});
	});
	it("should return correct symbol", function() {
		return AONFT.deployed()
			.then(function(instance) {
				return instance.symbol.call();
			})
			.then(function(name) {
				assert.equal(name, "AONFT", "Contract has the wrong name");
			});
	});
});
