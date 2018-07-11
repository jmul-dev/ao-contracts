var MegaAOToken = artifacts.require("./MegaAOToken.sol");

contract("MegaAOToken", function(accounts) {
	it("should return correct name", function() {
		return MegaAOToken.deployed()
			.then(function(instance) {
				return instance.name.call();
			})
			.then(function(name) {
				assert.equal(name, "Mega AO Token", "Contract has the wrong name");
			});
	});
	it("should return correct symbol", function() {
		return MegaAOToken.deployed()
			.then(function(instance) {
				return instance.symbol.call();
			})
			.then(function(name) {
				assert.equal(name, "AOMEGA", "Contract has the wrong name");
			});
	});
	it("should have the correct power of ten", function() {
		return MegaAOToken.deployed()
			.then(function(instance) {
				return instance.power.call();
			})
			.then(function(power) {
				assert.equal(power, 6, "Contract has the wrong power of ten");
			});
	});
});
