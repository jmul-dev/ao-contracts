var TeraAOToken = artifacts.require("./TeraAOToken.sol");

contract("TeraAOToken", function(accounts) {
	it("should return correct name", function() {
		return TeraAOToken.deployed()
			.then(function(instance) {
				return instance.name.call();
			})
			.then(function(name) {
				assert.equal(name, "Tera AO Token", "Contract has the wrong name");
			});
	});
	it("should return correct symbol", function() {
		return TeraAOToken.deployed()
			.then(function(instance) {
				return instance.symbol.call();
			})
			.then(function(name) {
				assert.equal(name, "AOTERA", "Contract has the wrong name");
			});
	});
	it("should have the correct power of ten", function() {
		return TeraAOToken.deployed()
			.then(function(instance) {
				return instance.power.call();
			})
			.then(function(power) {
				assert.equal(power, 12, "Contract has the wrong power of ten");
			});
	});
});
