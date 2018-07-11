var AOToken = artifacts.require("./AOToken.sol");

contract("AOToken", function(accounts) {
	it("should return correct name", function() {
		return AOToken.deployed()
			.then(function(instance) {
				return instance.name.call();
			})
			.then(function(name) {
				assert.equal(name, "AO Token", "Contract has the wrong name");
			});
	});
	it("should return correct symbol", function() {
		return AOToken.deployed()
			.then(function(instance) {
				return instance.symbol.call();
			})
			.then(function(name) {
				assert.equal(name, "AO", "Contract has the wrong name");
			});
	});
	it("should have the correct power of ten", function() {
		return AOToken.deployed()
			.then(function(instance) {
				return instance.power.call();
			})
			.then(function(power) {
				assert.equal(power, 1, "Contract has the wrong power of ten");
			});
	});
});
