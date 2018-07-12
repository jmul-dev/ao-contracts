var AOTokenICO = artifacts.require("./AOTokenICO.sol");
var AOToken = artifacts.require("./AOToken.sol");

contract("AOTokenICO", function(accounts) {
	it("should set AO Token Address", function() {
		return AOTokenICO.deployed()
			.then(function(instance) {
				return instance.AOTokenAddress.call();
			})
			.then(function(address) {
				assert.notEqual(address, "0x0", "Contract does not set AO Token Address");
			});
	});
	it("should have buy price at 10000 Wei/AO", function() {
		return AOTokenICO.deployed()
			.then(function(instance) {
				return instance.buyPrice.call();
			})
			.then(function(buyPrice) {
				assert.equal(buyPrice.toNumber(), 10000, "Buy price is not set correctly");
			});
	});
	it("can pause contract", function() {
		var meta;
		return AOTokenICO.deployed()
			.then(function(instance) {
				meta = instance;
				return instance.setPaused(true, { from: accounts[0] });
			})
			.then(function() {
				return meta.paused.call();
			})
			.then(function(paused) {
				assert.equal(paused, true, "Can't paused contract");
			});
	});
	it("can unpause contract", function() {
		var meta;
		return AOTokenICO.deployed()
			.then(function(instance) {
				meta = instance;
				return instance.setPaused(false, { from: accounts[0] });
			})
			.then(function() {
				return meta.paused.call();
			})
			.then(function(paused) {
				assert.equal(paused, false, "Can't unpaused contract");
			});
	});
	it("can set buy price", function() {
		var meta;
		return AOTokenICO.deployed()
			.then(function(instance) {
				meta = instance;
				return instance.setBuyPrice(10000, { from: accounts[0] });
			})
			.then(function() {
				return meta.buyPrice.call();
			})
			.then(function(buyPrice) {
				assert.equal(buyPrice.toNumber(), 10000, "Can't set buy price");
			});
	});
	it("should have 1 Peta AO", function() {
		var tokenMeta, icoMeta;
		return AOToken.deployed()
			.then(function(instance) {
				tokenMeta = instance;
				return AOTokenICO.deployed();
			})
			.then(function(instance) {
				icoMeta = instance;
				return tokenMeta.mintToken(icoMeta.address, web3.toWei(10 ** 15, "ether"));
			})
			.then(function() {
				return tokenMeta.balanceOf.call(icoMeta.address);
			})
			.then(function(balance) {
				assert.equal(balance.toNumber(), web3.toWei(10 ** 15, "ether"), "Contract does not have the correct AO balance");
			});
	});
	it("should send 20 AO to investor", function() {
		var tokenMeta, icoMeta;
		var totalTokenBought;
		return AOToken.deployed()
			.then(function(instance) {
				tokenMeta = instance;
				return AOTokenICO.deployed();
			})
			.then(function(instance) {
				icoMeta = instance;
				return icoMeta.buy({ from: accounts[1], value: 200000 });
			})
			.then(function() {
				return icoMeta.totalTokenBought.call();
			})
			.then(function(totalBought) {
				totalTokenBought = totalBought;
				return tokenMeta.balanceOf.call(accounts[1]);
			})
			.then(function(balance) {
				assert.equal(totalTokenBought.toNumber(), web3.toWei(20, "ether"), "Contract does not have the correct totalTokenBought");
				assert.equal(balance.toNumber(), web3.toWei(20, "ether"), "Investor has wrong balance after purchase");
			});
	});
});
