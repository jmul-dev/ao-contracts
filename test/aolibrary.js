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

var AOLibrary = artifacts.require("./AOLibrary.sol");

contract("AOLibrary", function(accounts) {
	var aolibrary, aotoken, aokilo, aomega, aogiga, aotera, aopeta, aoexa, aozetta, aoyotta, aoxona;
	before(async function() {
		aolibrary = await AOLibrary.deployed();
		aotoken = await AOToken.deployed();
		aokilo = await AOKilo.deployed();
		aomega = await AOMega.deployed();
		aogiga = await AOGiga.deployed();
		aotera = await AOTera.deployed();
		aopeta = await AOPeta.deployed();
		aoexa = await AOExa.deployed();
		aozetta = await AOZetta.deployed();
		aoyotta = await AOYotta.deployed();
		aoxona = await AOXona.deployed();
	});
	it("toBase() should return correct amount", async function() {
		var kiloToBase = await aolibrary.toBase(9, "123456789123456789123456789", aokilo.address);
		var megaToBase = await aolibrary.toBase(9, "123456789123456789123456789", aomega.address);
		var gigaToBase = await aolibrary.toBase(9, "123456789123456789123456789", aogiga.address);
		var teraToBase = await aolibrary.toBase(9, "123456789123456789123456789", aotera.address);
		var petaToBase = await aolibrary.toBase(9, "123456789123456789123456789", aopeta.address);
		var exaToBase = await aolibrary.toBase(9, "123456789123456789123456789", aoexa.address);
		var zettaToBase = await aolibrary.toBase(9, "123456789123456789123456789", aozetta.address);
		var yottaToBase = await aolibrary.toBase(9, "123456789123456789123456789", aoyotta.address);
		var xonaToBase = await aolibrary.toBase(9, "123456789123456789123456789", aoxona.address);

		assert.equal(kiloToBase.toNumber(), 9123, "toBase kilo return wrong amount of token");
		assert.equal(megaToBase.toNumber(), 9123456, "toBase mega return wrong amount of token");
		assert.equal(gigaToBase.toNumber(), 9123456789, "toBase giga return wrong amount of token");
		assert.equal(teraToBase.toNumber(), 9123456789123, "toBase tera return wrong amount of token");
		assert.equal(petaToBase.toNumber(), "9123456789123456", "toBase peta return wrong amount of token");
		assert.equal(exaToBase.toNumber(), "9123456789123456789", "toBase exa return wrong amount of token");
		assert.equal(zettaToBase.toNumber(), "9123456789123456789123", "toBase zetta return wrong amount of token");
		assert.equal(yottaToBase.toNumber(), "9123456789123456789123456", "toBase yotta return wrong amount of token");
		assert.equal(xonaToBase.toNumber(), "9123456789123456789123456789", "toBase xona return wrong amount of token");
	});
	it("fromBase() should return correct amount", async function() {
		var baseToKilo = await aolibrary.fromBase(9123, aokilo.address);
		var baseToMega = await aolibrary.fromBase(9123456, aomega.address);
		var baseToGiga = await aolibrary.fromBase(9123456789, aogiga.address);
		var baseToTera = await aolibrary.fromBase(9123456789123, aotera.address);
		var baseToPeta = await aolibrary.fromBase("9123456789123456", aopeta.address);
		var baseToExa = await aolibrary.fromBase("9123456789123456789", aoexa.address);
		var baseToZetta = await aolibrary.fromBase("9123456789123456789123", aozetta.address);
		var baseToYotta = await aolibrary.fromBase("9123456789123456789123456", aoyotta.address);
		var baseToXona = await aolibrary.fromBase("9123456789123456789123456789", aoxona.address);

		assert.equal(baseToKilo[0].toNumber(), 9, "fromBase kilo return wrong integer");
		assert.equal(baseToKilo[1].toNumber(), 123, "fromBase kilo return wrong fraction");
		assert.equal(baseToMega[0].toNumber(), 9, "fromBase mega return wrong integer");
		assert.equal(baseToMega[1].toNumber(), 123456, "fromBase mega return wrong fraction");
		assert.equal(baseToGiga[0].toNumber(), 9, "fromBase giga return wrong integer");
		assert.equal(baseToGiga[1].toNumber(), 123456789, "fromBase giga return wrong fraction");
		assert.equal(baseToTera[0].toNumber(), 9, "fromBase tera return wrong integer");
		assert.equal(baseToTera[1].toNumber(), 123456789123, "fromBase tera return wrong fraction");
		assert.equal(baseToPeta[0].toNumber(), 9, "fromBase peta return wrong integer");
		assert.equal(baseToPeta[1].toNumber(), "123456789123456", "fromBase peta return wrong fraction");
		assert.equal(baseToExa[0].toNumber(), 9, "fromBase exa return wrong integer");
		assert.equal(baseToExa[1].toNumber(), "123456789123456789", "fromBase exa return wrong fraction");
		assert.equal(baseToZetta[0].toNumber(), 9, "fromBase zetta return wrong integer");
		assert.equal(baseToZetta[1].toNumber(), "123456789123456789123", "fromBase zetta return wrong fraction");
		assert.equal(baseToYotta[0].toNumber(), 9, "fromBase yotta return wrong integer");
		assert.equal(baseToYotta[1].toNumber(), "123456789123456789123456", "fromBase yotta return wrong fraction");
		assert.equal(baseToXona[0].toNumber(), 9, "fromBase xona return wrong integer");
		assert.equal(baseToXona[1].toNumber(), "123456789123456789123456789", "fromBase xona return wrong fraction");
	});
});
