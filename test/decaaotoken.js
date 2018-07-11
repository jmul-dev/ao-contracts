var DecaAOToken = artifacts.require("./DecaAOToken.sol");

contract("DecaAOToken", function(accounts) {
	it("should return correct name", function() {
		return DecaAOToken.deployed()
			.then(function(instance) {
				return instance.name.call();
			})
			.then(function(name) {
				assert.equal(name, "Deca AO Token", "Contract has the wrong name");
			});
	});
	it("should return correct symbol", function() {
		return DecaAOToken.deployed()
			.then(function(instance) {
				return instance.symbol.call();
			})
			.then(function(name) {
				assert.equal(name, "AODECA", "Contract has the wrong name");
			});
	});
	it("should have the correct power of ten", function() {
		return DecaAOToken.deployed()
			.then(function(instance) {
				return instance.power.call();
			})
			.then(function(power) {
				assert.equal(power, 2, "Contract has the wrong power of ten");
			});
	});
});
