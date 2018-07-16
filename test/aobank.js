var AOBank = artifacts.require("./AOBank.sol");
var AOToken = artifacts.require("./AOToken.sol");
var AOKilo = artifacts.require("./AOKilo.sol");
var AOMega = artifacts.require("./AOMega.sol");
var AOGiga = artifacts.require("./AOGiga.sol");
var AOTera = artifacts.require("./AOTera.sol");
var AOPeta = artifacts.require("./AOPeta.sol");
var AOExa = artifacts.require("./AOExa.sol");
var AOZetta = artifacts.require("./AOZetta.sol");
var AOYotta = artifacts.require("./AOYotta.sol");
var AOXona = artifacts.require("./AOXona.sol");

contract("AOBank", function(accounts) {
	var bankMeta, aoMeta, kiloMeta, megaMeta, gigaMeta, teraMeta, petaMeta, exaMeta, zettaMeta, yottaMeta, xonaMeta;
	before(function() {
		return AOBank.deployed()
			.then(function(instance) {
				bankMeta = instance;
				return AOToken.deployed();
			})
			.then(function(instance) {
				aoMeta = instance;
				return AOKilo.deployed();
			})
			.then(function(instance) {
				kiloMeta = instance;
				return AOMega.deployed();
			})
			.then(function(instance) {
				megaMeta = instance;
				return AOGiga.deployed();
			})
			.then(function(instance) {
				gigaMeta = instance;
				return AOTera.deployed();
			})
			.then(function(instance) {
				teraMeta = instance;
				return AOPeta.deployed();
			})
			.then(function(instance) {
				petaMeta = instance;
				return AOExa.deployed();
			})
			.then(function(instance) {
				exaMeta = instance;
				return AOZetta.deployed();
			})
			.then(function(instance) {
				zettaMeta = instance;
				return AOYotta.deployed();
			})
			.then(function(instance) {
				yottaMeta = instance;
				return AOXona.deployed();
			})
			.then(function(instance) {
				xonaMeta = instance;
			});
	});

	it("should have all the denominations and the token addresses", function() {
		var aoAddress, kiloAddress, megaAddress, gigaAddress, teraAddress, petaAddress, exaAddress, zettaAddress, yottaAddress, xonaAddress;
		return bankMeta
			.addDenominationAddress("ao", aoMeta.address, { from: accounts[0] })
			.then(function() {
				return bankMeta.denominationAddresses.call("ao");
			})
			.then(function(tokenAddress) {
				aoAddress = tokenAddress;
				return bankMeta.addDenominationAddress("kilo", kiloMeta.address, { from: accounts[0] });
			})
			.then(function() {
				return bankMeta.denominationAddresses.call("kilo");
			})
			.then(function(tokenAddress) {
				kiloAddress = tokenAddress;
				return bankMeta.addDenominationAddress("mega", megaMeta.address, { from: accounts[0] });
			})
			.then(function() {
				return bankMeta.denominationAddresses.call("mega");
			})
			.then(function(tokenAddress) {
				megaAddress = tokenAddress;
				return bankMeta.addDenominationAddress("giga", gigaMeta.address, { from: accounts[0] });
			})
			.then(function() {
				return bankMeta.denominationAddresses.call("giga");
			})
			.then(function(tokenAddress) {
				gigaAddress = tokenAddress;
				return bankMeta.addDenominationAddress("tera", teraMeta.address, { from: accounts[0] });
			})
			.then(function() {
				return bankMeta.denominationAddresses.call("tera");
			})
			.then(function(tokenAddress) {
				teraAddress = tokenAddress;
				return bankMeta.addDenominationAddress("peta", petaMeta.address, { from: accounts[0] });
			})
			.then(function() {
				return bankMeta.denominationAddresses.call("peta");
			})
			.then(function(tokenAddress) {
				petaAddress = tokenAddress;
				return bankMeta.addDenominationAddress("exa", exaMeta.address, { from: accounts[0] });
			})
			.then(function() {
				return bankMeta.denominationAddresses.call("exa");
			})
			.then(function(tokenAddress) {
				exaAddress = tokenAddress;
				return bankMeta.addDenominationAddress("zetta", zettaMeta.address, { from: accounts[0] });
			})
			.then(function() {
				return bankMeta.denominationAddresses.call("zetta");
			})
			.then(function(tokenAddress) {
				zettaAddress = tokenAddress;
				return bankMeta.addDenominationAddress("yotta", yottaMeta.address, { from: accounts[0] });
			})
			.then(function() {
				return bankMeta.denominationAddresses.call("yotta");
			})
			.then(function(tokenAddress) {
				yottaAddress = tokenAddress;
				return bankMeta.addDenominationAddress("xona", xonaMeta.address, { from: accounts[0] });
			})
			.then(function() {
				return bankMeta.denominationAddresses.call("xona");
			})
			.then(function(tokenAddress) {
				xonaAddress = tokenAddress;
				assert.equal(aoAddress, aoMeta.address, "Invalid ao Denomination and address");
				assert.equal(kiloAddress, kiloMeta.address, "Invalid kilo Denomination and address");
				assert.equal(megaAddress, megaMeta.address, "Invalid mega Denomination and address");
				assert.equal(gigaAddress, gigaMeta.address, "Invalid giga Denomination and address");
				assert.equal(teraAddress, teraMeta.address, "Invalid tera Denomination and address");
				assert.equal(petaAddress, petaMeta.address, "Invalid peta Denomination and address");
				assert.equal(exaAddress, exaMeta.address, "Invalid exa Denomination and address");
				assert.equal(zettaAddress, zettaMeta.address, "Invalid zetta Denomination and address");
				assert.equal(yottaAddress, yottaMeta.address, "Invalid yotta Denomination and address");
				assert.equal(xonaAddress, xonaMeta.address, "Invalid xona Denomination and address");
			});
	});
	it("toBase() should return correct amount", function() {
		var kiloAmount, megaAmount, gigaAmount, teraAmount, petaAmount, exaAmount, zettaAmount, yottaAmount, xonaAmount;
		return bankMeta
			.toBase(9, "123456789123456789123456789", "kilo")
			.then(function(amount) {
				kiloAmount = amount;
				return bankMeta.toBase(9, "123456789123456789123456789", "mega");
			})
			.then(function(amount) {
				megaAmount = amount;
				return bankMeta.toBase(9, "123456789123456789123456789", "giga");
			})
			.then(function(amount) {
				gigaAmount = amount;
				return bankMeta.toBase(9, "123456789123456789123456789", "tera");
			})
			.then(function(amount) {
				teraAmount = amount;
				return bankMeta.toBase(9, "123456789123456789123456789", "peta");
			})
			.then(function(amount) {
				petaAmount = amount;
				return bankMeta.toBase(9, "123456789123456789123456789", "exa");
			})
			.then(function(amount) {
				exaAmount = amount;
				return bankMeta.toBase(9, "123456789123456789123456789", "zetta");
			})
			.then(function(amount) {
				zettaAmount = amount;
				return bankMeta.toBase(9, "123456789123456789123456789", "yotta");
			})
			.then(function(amount) {
				yottaAmount = amount;
				return bankMeta.toBase(9, "123456789123456789123456789", "xona");
			})
			.then(function(amount) {
				xonaAmount = amount;
				assert.equal(kiloAmount.toNumber(), 9123, "toBase kilo return wrong amount of token");
				assert.equal(megaAmount.toNumber(), 9123456, "toBase mega return wrong amount of token");
				assert.equal(gigaAmount.toNumber(), 9123456789, "toBase giga return wrong amount of token");
				assert.equal(teraAmount.toNumber(), 9123456789123, "toBase tera return wrong amount of token");
				assert.equal(petaAmount.toNumber(), "9123456789123456", "toBase peta return wrong amount of token");
				assert.equal(exaAmount.toNumber(), "9123456789123456789", "toBase exa return wrong amount of token");
				assert.equal(zettaAmount.toNumber(), "9123456789123456789123", "toBase zetta return wrong amount of token");
				assert.equal(yottaAmount.toNumber(), "9123456789123456789123456", "toBase yotta return wrong amount of token");
				assert.equal(xonaAmount.toNumber(), "9123456789123456789123456789", "toBase xona return wrong amount of token");
			});
	});
	it("fromBase() should return correct amount", function() {
		var kiloInteger,
			kiloFraction,
			megaInteger,
			megaFraction,
			gigaInteger,
			gigaFraction,
			teraInteger,
			teraFraction,
			petaInteger,
			petaFraction,
			exaInteger,
			exaFraction,
			zettaInteger,
			zettaFraction,
			yottaInteger,
			yottaFraction,
			xonaInteger,
			xonaFraction;

		return bankMeta
			.fromBase(9123, "kilo")
			.then(function(denominationResponse) {
				kiloInteger = denominationResponse[0];
				kiloFraction = denominationResponse[1];
				return bankMeta.fromBase(9123456, "mega");
			})
			.then(function(denominationResponse) {
				megaInteger = denominationResponse[0];
				megaFraction = denominationResponse[1];
				return bankMeta.fromBase(9123456789, "giga");
			})
			.then(function(denominationResponse) {
				gigaInteger = denominationResponse[0];
				gigaFraction = denominationResponse[1];
				return bankMeta.fromBase(9123456789123, "tera");
			})
			.then(function(denominationResponse) {
				teraInteger = denominationResponse[0];
				teraFraction = denominationResponse[1];
				return bankMeta.fromBase("9123456789123456", "peta");
			})
			.then(function(denominationResponse) {
				petaInteger = denominationResponse[0];
				petaFraction = denominationResponse[1];
				return bankMeta.fromBase("9123456789123456789", "exa");
			})
			.then(function(denominationResponse) {
				exaInteger = denominationResponse[0];
				exaFraction = denominationResponse[1];
				return bankMeta.fromBase("9123456789123456789123", "zetta");
			})
			.then(function(denominationResponse) {
				zettaInteger = denominationResponse[0];
				zettaFraction = denominationResponse[1];
				return bankMeta.fromBase("9123456789123456789123456", "yotta");
			})
			.then(function(denominationResponse) {
				yottaInteger = denominationResponse[0];
				yottaFraction = denominationResponse[1];
				return bankMeta.fromBase("9123456789123456789123456789", "xona");
			})
			.then(function(denominationResponse) {
				xonaInteger = denominationResponse[0];
				xonaFraction = denominationResponse[1];
				assert.equal(kiloInteger.toNumber(), 9, "fromBase kilo return wrong integer");
				assert.equal(kiloFraction.toNumber(), 123, "fromBase kilo return wrong fraction");
				assert.equal(megaInteger.toNumber(), 9, "fromBase mega return wrong integer");
				assert.equal(megaFraction.toNumber(), 123456, "fromBase mega return wrong fraction");
				assert.equal(gigaInteger.toNumber(), 9, "fromBase giga return wrong integer");
				assert.equal(gigaFraction.toNumber(), 123456789, "fromBase giga return wrong fraction");
				assert.equal(teraInteger.toNumber(), 9, "fromBase tera return wrong integer");
				assert.equal(teraFraction.toNumber(), 123456789123, "fromBase tera return wrong fraction");
				assert.equal(petaInteger.toNumber(), 9, "fromBase peta return wrong integer");
				assert.equal(petaFraction.toNumber(), "123456789123456", "fromBase peta return wrong fraction");
				assert.equal(exaInteger.toNumber(), 9, "fromBase exa return wrong integer");
				assert.equal(exaFraction.toNumber(), "123456789123456789", "fromBase exa return wrong fraction");
				assert.equal(zettaInteger.toNumber(), 9, "fromBase zetta return wrong integer");
				assert.equal(zettaFraction.toNumber(), "123456789123456789123", "fromBase zetta return wrong fraction");
				assert.equal(yottaInteger.toNumber(), 9, "fromBase yotta return wrong integer");
				assert.equal(yottaFraction.toNumber(), "123456789123456789123456", "fromBase yotta return wrong fraction");
				assert.equal(xonaInteger.toNumber(), 9, "fromBase xona return wrong integer");
				assert.equal(xonaFraction.toNumber(), "123456789123456789123456789", "fromBase xona return wrong fraction");
			});
	});
});
