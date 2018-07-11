var GigaAOToken = artifacts.require("./GigaAOToken.sol");

contract("GigaAOToken", function(accounts) {
	it("should return correct name", function() {
		return GigaAOToken.deployed()
			.then(function(instance) {
				return instance.name.call();
			})
			.then(function(name) {
				assert.equal(name, "Giga AO Token", "Contract has the wrong name");
			});
	});
	it("should return correct symbol", function() {
		return GigaAOToken.deployed()
			.then(function(instance) {
				return instance.symbol.call();
			})
			.then(function(name) {
				assert.equal(name, "AOGIGA", "Contract has the wrong name");
			});
	});
	it("should have the correct power of ten", function() {
		return GigaAOToken.deployed()
			.then(function(instance) {
				return instance.power.call();
			})
			.then(function(power) {
				assert.equal(power, 9, "Contract has the wrong power of ten");
			});
	});
});
