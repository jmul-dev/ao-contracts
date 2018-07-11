var ExaAOToken = artifacts.require("./ExaAOToken.sol");

contract("ExaAOToken", function(accounts) {
	it("should return correct name", function() {
		return ExaAOToken.deployed()
			.then(function(instance) {
				return instance.name.call();
			})
			.then(function(name) {
				assert.equal(name, "Exa AO Token", "Contract has the wrong name");
			});
	});
	it("should return correct symbol", function() {
		return ExaAOToken.deployed()
			.then(function(instance) {
				return instance.symbol.call();
			})
			.then(function(name) {
				assert.equal(name, "AOEXA", "Contract has the wrong name");
			});
	});
	it("should have the correct power of ten", function() {
		return ExaAOToken.deployed()
			.then(function(instance) {
				return instance.power.call();
			})
			.then(function(power) {
				assert.equal(power, 18, "Contract has the wrong power of ten");
			});
	});
});
