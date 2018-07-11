var PetaAOToken = artifacts.require("./PetaAOToken.sol");

contract("PetaAOToken", function(accounts) {
	it("should return correct name", function() {
		return PetaAOToken.deployed()
			.then(function(instance) {
				return instance.name.call();
			})
			.then(function(name) {
				assert.equal(name, "Peta AO Token", "Contract has the wrong name");
			});
	});
	it("should return correct symbol", function() {
		return PetaAOToken.deployed()
			.then(function(instance) {
				return instance.symbol.call();
			})
			.then(function(name) {
				assert.equal(name, "AOPETA", "Contract has the wrong name");
			});
	});
	it("should have the correct power of ten", function() {
		return PetaAOToken.deployed()
			.then(function(instance) {
				return instance.power.call();
			})
			.then(function(power) {
				assert.equal(power, 15, "Contract has the wrong power of ten");
			});
	});
});
