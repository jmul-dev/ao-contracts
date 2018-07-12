var AOLot = artifacts.require("./AOLot.sol");
var AOToken = artifacts.require("./AOToken.sol");

contract("AOLot", function(accounts) {
	var tokenMeta, lotMeta;
	before(function() {
		return AOToken.deployed()
			.then(function(instance) {
				tokenMeta = instance;
				return AOLot.deployed();
			})
			.then(function(instance) {
				lotMeta = instance;
			});
	});

	it("should set AO Token Address", function() {
		return lotMeta.AOTokenAddress.call()
			.then(function(address) {
				assert.notEqual(address, "0x0", "Contract does not set AO Token Address");
			});
	});
	it("should have buy price at 10000 Wei/AO", function() {
		return lotMeta.buyPrice.call()
			.then(function(buyPrice) {
				assert.equal(buyPrice.toNumber(), 10000, "Buy price is not set correctly");
			});
	});
	it("can pause contract", function() {
		return lotMeta.setPaused(true, { from: accounts[0] })
			.then(function() {
				return lotMeta.paused.call();
			})
			.then(function(paused) {
				assert.equal(paused, true, "Can't paused contract");
			});
	});
	it("can unpause contract", function() {
		return lotMeta.setPaused(false, { from: accounts[0] })
			.then(function() {
				return lotMeta.paused.call();
			})
			.then(function(paused) {
				assert.equal(paused, false, "Can't unpaused contract");
			});
	});
	it("can set buy price", function() {
		return lotMeta.setBuyPrice(10000, { from: accounts[0] })
			.then(function() {
				return lotMeta.buyPrice.call();
			})
			.then(function(buyPrice) {
				assert.equal(buyPrice.toNumber(), 10000, "Can't set buy price");
			});
	});
	it("should have 1 Peta AO", function() {
		return tokenMeta.mintToken(lotMeta.address, web3.toWei(10 ** 15, "ether"))
			.then(function() {
				return tokenMeta.balanceOf.call(lotMeta.address);
			})
			.then(function(balance) {
				assert.equal(balance.toNumber(), web3.toWei(10 ** 15, "ether"), "Contract does not have the correct AO balance");
			});
	});
	it("should send 20 AO to investor", function() {
		var totalTokenBought;
		return lotMeta.buy({ from: accounts[1], value: 200000 })
			.then(function() {
				return lotMeta.totalTokenBought.call();
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
	it("should return the correct number of lots owned by an address", function() {
		return lotMeta.numLotsByAddress(accounts[1])
			.then(function(numLots) {
				assert.equal(numLots.toNumber(), 1, "Returns wrong number of lots owned by an address");
			});
	});
	it("should return the correct lot ID at a given index of owner's lots list", function() {
		return lotMeta.lotOfOwnerByIndex(accounts[1], 0)
			.then(function(numLots) {
				assert.equal(numLots.toNumber(), 1, "Returns wrong lot ID at a given index");
			});
	});
	it("should return the correct lot at a given lot ID", function() {
		return lotMeta.lotById(1)
			.then(function(lot) {
				assert.equal(lot[0], accounts[1], "Returns wrong address of the lot");
				assert.equal(lot[1].toNumber(), web3.toWei(20, 'ether'), "Returns wrong tokenAmount of the lot");
			});
	});
});
