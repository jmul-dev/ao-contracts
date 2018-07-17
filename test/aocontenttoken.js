var AOContentToken = artifacts.require("./AOContentToken.sol");

contract("AOContentToken", function(accounts) {
	var tokenMeta;
	before(function() {
		return AOContentToken.deployed().then(function(instance) {
			tokenMeta = instance;
		});
	});

	it("should return correct name", function() {
		return tokenMeta.name.call().then(function(name) {
			assert.equal(name, "AO Content Token", "Contract has the wrong name");
		});
	});
	it("should return correct symbol", function() {
		return tokenMeta.symbol.call().then(function(symbol) {
			assert.equal(symbol, "AOCTKN", "Contract has the wrong symbol");
		});
	});
	it("should have 0 decimals", function() {
		return tokenMeta.decimals.call().then(function(decimals) {
			assert.equal(decimals, 0, "Contract has the wrong decimals");
		});
	});
	it("should have 0 initial supply", function() {
		return tokenMeta.balanceOf.call(accounts[0]).then(function(balance) {
			assert.equal(balance.toNumber(), 0, "Contract has wrong initial supply");
		});
	});
});
