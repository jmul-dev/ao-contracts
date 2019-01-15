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

var AOTreasury = artifacts.require("./AOTreasury.sol");

contract("AOTreasury", function(accounts) {
	var aotreasury, aotoken, aokilo, aomega, aogiga, aotera, aopeta, aoexa, aozetta, aoyotta, aoxona;
	var theAO = accounts[0];
	var account1 = accounts[1];
	var someAddress = "0x0694bdcab07b298e88a834a3c91602cb8f457bde";
	var ao, kilo, mega, giga, tera, peta, exa, zetta, yotta, xona;
	before(async function() {
		aotreasury = await AOTreasury.deployed();
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
	it("should have all of AO denominations", async function() {
		ao = await aotreasury.getDenominationByName("ao");
		kilo = await aotreasury.getDenominationByName("kilo");
		mega = await aotreasury.getDenominationByName("mega");
		giga = await aotreasury.getDenominationByName("giga");
		tera = await aotreasury.getDenominationByName("tera");
		peta = await aotreasury.getDenominationByName("peta");
		exa = await aotreasury.getDenominationByName("exa");
		zetta = await aotreasury.getDenominationByName("zetta");
		yotta = await aotreasury.getDenominationByName("yotta");
		xona = await aotreasury.getDenominationByName("xona");

		assert.equal(ao[1], aotoken.address, "contract is missing ao from list of denominations");
		assert.equal(kilo[1], aokilo.address, "contract is missing kilo from list of denominations");
		assert.equal(mega[1], aomega.address, "Contract is missing mega from list of denominations");
		assert.equal(giga[1], aogiga.address, "Contract is missing giga from list of denominations");
		assert.equal(tera[1], aotera.address, "Contract is missing tera from list of denominations");
		assert.equal(peta[1], aopeta.address, "Contract is missing peta from list of denominations");
		assert.equal(exa[1], aoexa.address, "Contract is missing exa from list of denominations");
		assert.equal(zetta[1], aozetta.address, "Contract is missing zetta from list of denominations");
		assert.equal(yotta[1], aoyotta.address, "Contract is missing yotta from list of denominations");
		assert.equal(xona[1], aoxona.address, "Contract is missing xona from list of denominations");
	});
	it("should have ao as the base denomination", async function() {
		var baseDenomination = await aotreasury.getBaseDenomination();
		assert.equal(web3.toAscii(baseDenomination[0]).replace(/\0/g, ""), "ao", "Base denomination short name does not match");
		assert.equal(baseDenomination[1], ao[1], "Base denomination address does not match ao denomination address");
		assert.equal(baseDenomination[2], ao[2], "Base denomination name does not match ao name");
		assert.equal(baseDenomination[3], ao[3], "Base denomination symbol does not match ao symbol");
		assert.equal(baseDenomination[4].toNumber(), ao[4].toNumber(), "Base denomination decimals does not match ao decimals");
		assert.equal(baseDenomination[5].toNumber(), ao[5].toNumber(), "Base denomination power of ten does not match ao power of ten");
	});
	it("toBase() should return correct amount", async function() {
		var kiloToBase = await aotreasury.toBase(9, 1, "kilo");
		assert.equal(kiloToBase.toNumber(), 9001, "toBase kilo return wrong amount of token");
		kiloToBase = await aotreasury.toBase(9, 20, "kilo");
		assert.equal(kiloToBase.toNumber(), 9020, "toBase kilo return wrong amount of token");
		kiloToBase = await aotreasury.toBase(9, 100, "kilo");
		assert.equal(kiloToBase.toNumber(), 9100, "toBase kilo return wrong amount of token");

		var megaToBase = await aotreasury.toBase(9, 123, "mega");
		var gigaToBase = await aotreasury.toBase(9, 123, "giga");
		var teraToBase = await aotreasury.toBase(9, 123, "tera");
		var petaToBase = await aotreasury.toBase(9, 123, "peta");
		var exaToBase = await aotreasury.toBase(9, 123, "exa");
		var zettaToBase = await aotreasury.toBase(9, 123, "zetta");
		var yottaToBase = await aotreasury.toBase(9, 123, "yotta");
		var xonaToBase = await aotreasury.toBase(9, 123, "xona");

		assert.equal(megaToBase.toNumber(), 9000123, "toBase mega return wrong amount of token");
		assert.equal(gigaToBase.toNumber(), 9000000123, "toBase giga return wrong amount of token");
		assert.equal(teraToBase.toNumber(), 9000000000123, "toBase tera return wrong amount of token");
		assert.equal(petaToBase.toNumber(), "9000000000000123", "toBase peta return wrong amount of token");
		assert.equal(exaToBase.toNumber(), "9000000000000000123", "toBase exa return wrong amount of token");
		assert.equal(zettaToBase.toNumber(), "9000000000000000000123", "toBase zetta return wrong amount of token");
		assert.equal(yottaToBase.toNumber(), "9000000000000000000000123", "toBase yotta return wrong amount of token");
		assert.equal(xonaToBase.toNumber(), "9000000000000000000000000123", "toBase xona return wrong amount of token");
	});
	it("fromBase() should return correct amount", async function() {
		var baseToAo = await aotreasury.fromBase(9001, "ao");
		var baseToKilo = await aotreasury.fromBase(9123, "kilo");
		var baseToMega = await aotreasury.fromBase(1203, "mega");
		var baseToGiga = await aotreasury.fromBase(9123456789, "giga");
		var baseToTera = await aotreasury.fromBase(9123456789123, "tera");
		var baseToPeta = await aotreasury.fromBase("9123456789123456", "peta");
		var baseToExa = await aotreasury.fromBase("9123456789123456789", "exa");
		var baseToZetta = await aotreasury.fromBase("9123456789123456789123", "zetta");
		var baseToYotta = await aotreasury.fromBase("9123456789123456789123456", "yotta");
		var baseToXona = await aotreasury.fromBase("9000000000123456789123456789", "xona");

		assert.equal(baseToAo[0].toNumber(), 9001, "fromBase ao return wrong integer");
		assert.equal(baseToAo[1].toNumber(), 0, "fromBase ao return wrong fraction");
		assert.equal(baseToKilo[0].toNumber(), 9, "fromBase kilo return wrong integer");
		assert.equal(baseToKilo[1].toNumber(), 123, "fromBase kilo return wrong fraction");
		assert.equal(baseToMega[0].toNumber(), 0, "fromBase mega return wrong integer");
		assert.equal(baseToMega[1].toNumber(), 1203, "fromBase mega return wrong fraction");
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
		assert.equal(baseToXona[1].toNumber(), "123456789123456789", "fromBase xona return wrong fraction");
	});
	contract("The AO only function tests", function() {
		it("only The AO can add denomination", async function() {
			var canAdd;
			try {
				await aotreasury.addDenomination("deno", someAddress, { from: account1 });
				canAdd = true;
			} catch (e) {
				canAdd = false;
			}
			assert.notEqual(canAdd, true, "Others can add denomination");
			try {
				await aotreasury.addDenomination("kilo", someAddress, { from: theAO });
				canAdd = true;
			} catch (e) {
				canAdd = false;
			}
			assert.notEqual(canAdd, true, "The AO can re-add existing denomination");
			try {
				await aotreasury.addDenomination("deno", someAddress, { from: theAO });
				canAdd = true;
			} catch (e) {
				canAdd = false;
			}
			assert.notEqual(canAdd, true, "The AO can add invalid denomination");
		});
		it("only The AO can update denomination", async function() {
			var canUpdate;
			try {
				await aotreasury.updateDenomination("kilo", aokilo.address, { from: account1 });
				canUpdate = true;
			} catch (e) {
				canUpdate = false;
			}
			assert.notEqual(canUpdate, true, "Others can update denomination");
			try {
				await aotreasury.updateDenomination("deca", someAddress, { from: theAO });
				canUpdate = true;
			} catch (e) {
				canUpdate = false;
			}
			assert.notEqual(canUpdate, true, "The AO can update non-existing denomination");
			try {
				await aotreasury.updateDenomination("kilo", someAddress, { from: theAO });
				canUpdate = true;
			} catch (e) {
				canUpdate = false;
			}
			assert.notEqual(canUpdate, true, "The AO can set invalid denomination address");
			try {
				await aotreasury.updateDenomination("kilo", aokilo.address, { from: theAO });
				canUpdate = true;
			} catch (e) {
				canUpdate = false;
			}
			assert.equal(canUpdate, true, "The AO can't update denomination");
			var kilo = await aotreasury.getDenominationByName("kilo");
			assert.equal(kilo[1], aokilo.address, "Denomination has incorrect denomination address after update");
		});
	});
	contract("getDenominationByIndex()", function() {
		it("should return the correct denomination info", async function() {
			var index1 = await aotreasury.getDenominationByIndex(1);
			assert.equal(web3.toAscii(index1[0]).replace(/\0/g, ""), "ao", "Base denomination short name does not match");
			assert.equal(index1[1], ao[1], "Base denomination address does not match ao denomination address");
			assert.equal(index1[2], ao[2], "Base denomination name does not match ao name");
			assert.equal(index1[3], ao[3], "Base denomination symbol does not match ao symbol");
			assert.equal(index1[4].toNumber(), ao[4].toNumber(), "Base denomination decimals does not match ao decimals");
			assert.equal(index1[5].toNumber(), ao[5].toNumber(), "Base denomination power of ten does not match ao power of ten");

			var index2 = await aotreasury.getDenominationByIndex(2);
			assert.equal(web3.toAscii(index2[0]).replace(/\0/g, ""), "kilo", "Base denomination short name does not match");
			assert.equal(index2[1], kilo[1], "Base denomination address does not match kilo denomination address");
			assert.equal(index2[2], kilo[2], "Base denomination name does not match kilo name");
			assert.equal(index2[3], kilo[3], "Base denomination symbol does not match kilo symbol");
			assert.equal(index2[4].toNumber(), kilo[4].toNumber(), "Base denomination decimals does not match kilo decimals");
			assert.equal(index2[5].toNumber(), kilo[5].toNumber(), "Base denomination power of ten does not match kilo power of ten");
		});
	});
	contract("exchange()", function() {
		before(async function() {
			var aokilodecimals = await aokilo.decimals();
			var aomegadecimals = await aomega.decimals();
			var aogigadecimals = await aogiga.decimals();
			var aoteradecimals = await aotera.decimals();
			var aopetadecimals = await aopeta.decimals();
			var aoexadecimals = await aoexa.decimals();
			var aozettadecimals = await aozetta.decimals();
			var aoyottadecimals = await aoyotta.decimals();
			var aoxonadecimals = await aoxona.decimals();

			await aotoken.setWhitelist(theAO, true, { from: theAO });
			await aokilo.setWhitelist(theAO, true, { from: theAO });
			await aomega.setWhitelist(theAO, true, { from: theAO });
			await aogiga.setWhitelist(theAO, true, { from: theAO });
			await aotera.setWhitelist(theAO, true, { from: theAO });
			await aopeta.setWhitelist(theAO, true, { from: theAO });
			await aoexa.setWhitelist(theAO, true, { from: theAO });
			await aozetta.setWhitelist(theAO, true, { from: theAO });
			await aoyotta.setWhitelist(theAO, true, { from: theAO });
			await aoxona.setWhitelist(theAO, true, { from: theAO });

			await aotoken.mintToken(account1, 100, { from: theAO });
			await aokilo.mintToken(account1, 100 * 10 ** aokilodecimals.toNumber(), { from: theAO });
			await aomega.mintToken(account1, 100 * 10 ** aomegadecimals.toNumber(), { from: theAO });
			await aogiga.mintToken(account1, 100 * 10 ** aogigadecimals.toNumber(), { from: theAO });
			await aotera.mintToken(account1, 100 * 10 ** aoteradecimals.toNumber(), { from: theAO });
			await aopeta.mintToken(account1, 100 * 10 ** aopetadecimals.toNumber(), { from: theAO });
			await aoexa.mintToken(account1, 100 * 10 ** aoexadecimals.toNumber(), { from: theAO });
			await aozetta.mintToken(account1, 100 * 10 ** aozettadecimals.toNumber(), { from: theAO });
			await aoyotta.mintToken(account1, 100 * 10 ** aoyottadecimals.toNumber(), { from: theAO });
			await aoxona.mintToken(account1, 100 * 10 ** aoxonadecimals.toNumber(), { from: theAO });
		});
		it("should exchange token from `fromDenominationName` to `toDenominationName` correctly", async function() {
			var canExchange;
			try {
				await aotreasury.exchangeDenomination(50, "deca", "ao", { from: account1 });
				canExchange = true;
			} catch (e) {
				canExchange = false;
			}
			assert.notEqual(canExchange, true, "Contract can exchange token from invalid origin denomination");

			try {
				await aotreasury.exchangeDenomination(50, "ao", "deca", { from: account1 });
				canExchange = true;
			} catch (e) {
				canExchange = false;
			}
			assert.notEqual(canExchange, true, "Contract can exchange token to invalid target denomination");

			try {
				await aotreasury.exchangeDenomination(1000, "ao", "kilo", { from: account1 });
				canExchange = true;
			} catch (e) {
				canExchange = false;
			}
			assert.notEqual(canExchange, true, "Account1 can exchange token more than he/she has");

			var account1AoBalanceBefore = await aotoken.balanceOf(account1);
			var account1KiloBalanceBefore = await aokilo.balanceOf(account1);

			try {
				await aotreasury.exchangeDenomination(50, "ao", "kilo", { from: account1 });
				canExchange = true;
			} catch (e) {
				canExchange = false;
			}
			assert.equal(canExchange, true, "Contract can't complete exchange on valid denominations");
			var account1AoBalanceAfter = await aotoken.balanceOf(account1);
			var account1KiloBalanceAfter = await aokilo.balanceOf(account1);

			assert.equal(
				account1AoBalanceAfter.toNumber(),
				account1AoBalanceBefore.minus(50).toNumber(),
				"Account1 has incorrect AO Token balance after exchanging"
			);
			assert.equal(
				account1KiloBalanceAfter.toNumber(),
				account1KiloBalanceBefore.plus(50).toNumber(),
				"Account1 has incorrect AO Kilo Token balance after exchanging"
			);

			var account1TeraBalanceBefore = await aotera.balanceOf(account1);
			var account1GigaBalanceBefore = await aogiga.balanceOf(account1);

			try {
				await aotreasury.exchangeDenomination(50, "tera", "giga", { from: account1 });
				canExchange = true;
			} catch (e) {
				canExchange = false;
			}
			assert.equal(canExchange, true, "Contract can't complete exchange on valid denominations");

			var account1GigaBalanceAfter = await aogiga.balanceOf(account1);
			var account1TeraBalanceAfter = await aotera.balanceOf(account1);

			assert.equal(
				account1TeraBalanceAfter.toNumber(),
				account1TeraBalanceBefore.minus(50).toNumber(),
				"Account1 has incorrect AO Tera Token balance after exchanging"
			);
			assert.equal(
				account1GigaBalanceAfter.toNumber(),
				account1GigaBalanceBefore.plus(50).toNumber(),
				"Account1 has incorrect AO Giga Token balance after exchanging"
			);
		});
	});
	contract("toHighestDenomination()", function() {
		it("should return the correct highest possible denomination given a base amount", async function() {
			var highestDenomination = await aotreasury.toHighestDenomination(10);
			assert.equal(
				web3.toAscii(highestDenomination[0]).replace(/\0/g, ""),
				"ao",
				"Highest denomination returns incorrect denomination"
			);
			assert.equal(highestDenomination[1], ao[1], "Highest denomination returns incorrect denomination address");
			assert.equal(highestDenomination[2].toNumber(), 10, "Highest denomination returns incorrect integer amount");
			assert.equal(highestDenomination[3].toNumber(), 0, "Highest denomination returns incorrect fraction amount");
			assert.equal(highestDenomination[4], ao[2], "Highest denomination name does not match ao name");
			assert.equal(highestDenomination[5], ao[3], "Highest denomination symbol does not match ao symbol");
			assert.equal(highestDenomination[6].toNumber(), ao[4].toNumber(), "Highest denomination decimals does not match ao decimals");
			assert.equal(
				highestDenomination[7].toNumber(),
				ao[5].toNumber(),
				"Highest denomination power of ten does not match ao power of ten"
			);

			var highestDenomination = await aotreasury.toHighestDenomination(28340394);
			assert.equal(
				web3.toAscii(highestDenomination[0]).replace(/\0/g, ""),
				"mega",
				"Highest denomination returns incorrect denomination"
			);
			assert.equal(highestDenomination[1], mega[1], "Highest denomination returns incorrect denomination address");
			assert.equal(highestDenomination[2].toNumber(), 28, "Highest denomination returns incorrect integer amount");
			assert.equal(highestDenomination[3].toNumber(), 340394, "Highest denomination returns incorrect fraction amount");
			assert.equal(highestDenomination[4], mega[2], "Highest denomination name does not match mega name");
			assert.equal(highestDenomination[5], mega[3], "Highest denomination symbol does not match mega symbol");
			assert.equal(
				highestDenomination[6].toNumber(),
				mega[4].toNumber(),
				"Highest denomination decimals does not match mega decimals"
			);
			assert.equal(
				highestDenomination[7].toNumber(),
				mega[5].toNumber(),
				"Highest denomination power of ten does not match mega power of ten"
			);
		});
	});
});
