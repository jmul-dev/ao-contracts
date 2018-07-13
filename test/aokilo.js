var AOKilo = artifacts.require("./AOKilo.sol");

contract("AOKilo", function(accounts) {
	var tokenMeta;
	before(function() {
		return AOKilo.deployed()
			.then(function(instance) {
				tokenMeta = instance;
			});
	});

	it("should return correct name", function() {
		return tokenMeta.name.call()
			.then(function(name) {
				assert.equal(name, "AO Kilo", "Contract has the wrong name");
			});
	});
	it("should return correct symbol", function() {
		return tokenMeta.symbol.call()
			.then(function(symbol) {
				assert.equal(symbol, "AOKILO", "Contract has the wrong symbol");
			});
	});
	it("should have the correct power of ten", function() {
		return tokenMeta.powerOfTen.call()
			.then(function(powerOfTen) {
				assert.equal(powerOfTen, 3, "Contract has the wrong power of ten");
			});
	});
	it("should have 3 decimals", function() {
		return tokenMeta.decimals.call()
			.then(function(decimals) {
				assert.equal(decimals, 3, "Contract has the wrong decimals");
			});
	});
	it("should have 0 initial supply", function() {
		return tokenMeta.balanceOf.call(accounts[0])
			.then(function(balance) {
				assert.equal(balance.toNumber(), 0, "Contract has wrong initial supply");
			});
	});
});
