var ZettaAOToken = artifacts.require("./ZettaAOToken.sol");

contract("ZettaAOToken", function(accounts) {
	it("should return correct name", function() {
		return ZettaAOToken.deployed()
			.then(function(instance) {
				return instance.name.call();
			})
			.then(function(name) {
				assert.equal(name, "Zetta AO Token", "Contract has the wrong name");
			});
	});
	it("should return correct symbol", function() {
		return ZettaAOToken.deployed()
			.then(function(instance) {
				return instance.symbol.call();
			})
			.then(function(name) {
				assert.equal(name, "AOZETTA", "Contract has the wrong name");
			});
	});
	it("should have the correct power of ten", function() {
		return ZettaAOToken.deployed()
			.then(function(instance) {
				return instance.power.call();
			})
			.then(function(power) {
				assert.equal(power, 21, "Contract has the wrong power of ten");
			});
	});
});
