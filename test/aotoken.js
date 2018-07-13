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
			.then(function(symbol) {
				assert.equal(symbol, "AOTKN", "Contract has the wrong symbol");
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
	it("should have 0 decimals", function() {
		return AOToken.deployed()
			.then(function(instance) {
				return instance.decimals.call();
			})
			.then(function(decimals) {
				assert.equal(decimals, 0, "Contract has the wrong decimals");
			});
	});
	it("should have 0 initial supply", function() {
		return AOToken.deployed()
			.then(function(instance) {
				return instance.balanceOf.call(accounts[0]);
			})
			.then(function(balance) {
				assert.equal(balance.toNumber(), 0, "Contract has wrong initial supply");
			});
	});
});
