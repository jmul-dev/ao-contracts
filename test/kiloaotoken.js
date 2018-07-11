var KiloAOToken = artifacts.require("./KiloAOToken.sol");

contract("KiloAOToken", function(accounts) {
	it("should return correct name", function() {
		return KiloAOToken.deployed()
			.then(function(instance) {
				return instance.name.call();
			})
			.then(function(name) {
				assert.equal(name, "Kilo AO Token", "Contract has the wrong name");
			});
	});
	it("should return correct symbol", function() {
		return KiloAOToken.deployed()
			.then(function(instance) {
				return instance.symbol.call();
			})
			.then(function(name) {
				assert.equal(name, "AOKILO", "Contract has the wrong name");
			});
	});
	it("should have the correct power of ten", function() {
		return KiloAOToken.deployed()
			.then(function(instance) {
				return instance.power.call();
			})
			.then(function(power) {
				assert.equal(power, 3, "Contract has the wrong power of ten");
			});
	});
});
