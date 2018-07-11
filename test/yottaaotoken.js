var YottaAOToken = artifacts.require("./YottaAOToken.sol");

contract("YottaAOToken", function(accounts) {
	it("should return correct name", function() {
		return YottaAOToken.deployed()
			.then(function(instance) {
				return instance.name.call();
			})
			.then(function(name) {
				assert.equal(name, "Yotta AO Token", "Contract has the wrong name");
			});
	});
	it("should return correct symbol", function() {
		return YottaAOToken.deployed()
			.then(function(instance) {
				return instance.symbol.call();
			})
			.then(function(name) {
				assert.equal(name, "AOYOTTA", "Contract has the wrong name");
			});
	});
	it("should have the correct power of ten", function() {
		return YottaAOToken.deployed()
			.then(function(instance) {
				return instance.power.call();
			})
			.then(function(power) {
				assert.equal(power, 24, "Contract has the wrong power of ten");
			});
	});
});
