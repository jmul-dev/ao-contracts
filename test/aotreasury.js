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
	var owner = accounts[0];
	var account1 = accounts[1];
	var someAddress = "0x0694bdcab07b298e88a834a3c91602cb8f457bde";
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
		var ao = await aotreasury.denominations("ao");
		var kilo = await aotreasury.denominations("kilo");
		var mega = await aotreasury.denominations("mega");
		var giga = await aotreasury.denominations("giga");
		var tera = await aotreasury.denominations("tera");
		var peta = await aotreasury.denominations("peta");
		var exa = await aotreasury.denominations("exa");
		var zetta = await aotreasury.denominations("zetta");
		var yotta = await aotreasury.denominations("yotta");
		var xona = await aotreasury.denominations("xona");

		assert.equal(ao, aotoken.address, "contract is missing ao from list of denominations");
		assert.equal(kilo, aokilo.address, "contract is missing kilo from list of denominations");
		assert.equal(mega, aomega.address, "Contract is missing mega from list of denominations");
		assert.equal(giga, aogiga.address, "Contract is missing giga from list of denominations");
		assert.equal(tera, aotera.address, "Contract is missing tera from list of denominations");
		assert.equal(peta, aopeta.address, "Contract is missing peta from list of denominations");
		assert.equal(exa, aoexa.address, "Contract is missing exa from list of denominations");
		assert.equal(zetta, aozetta.address, "Contract is missing zetta from list of denominations");
		assert.equal(yotta, aoyotta.address, "Contract is missing yotta from list of denominations");
		assert.equal(xona, aoxona.address, "Contract is missing xona from list of denominations");
	});
	it("toBase() should return correct amount", async function() {
		var kiloToBase = await aotreasury.toBase(9, "123456789123456789123456789", "kilo");
		var megaToBase = await aotreasury.toBase(9, "123456789123456789123456789", "mega");
		var gigaToBase = await aotreasury.toBase(9, "123456789123456789123456789", "giga");
		var teraToBase = await aotreasury.toBase(9, "123456789123456789123456789", "tera");
		var petaToBase = await aotreasury.toBase(9, "123456789123456789123456789", "peta");
		var exaToBase = await aotreasury.toBase(9, "123456789123456789123456789", "exa");
		var zettaToBase = await aotreasury.toBase(9, "123456789123456789123456789", "zetta");
		var yottaToBase = await aotreasury.toBase(9, "123456789123456789123456789", "yotta");
		var xonaToBase = await aotreasury.toBase(9, "123456789123456789123456789", "xona");

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
		var baseToAo = await aotreasury.fromBase(9123, "ao");
		var baseToKilo = await aotreasury.fromBase(9123, "kilo");
		var baseToMega = await aotreasury.fromBase(9123456, "mega");
		var baseToGiga = await aotreasury.fromBase(9123456789, "giga");
		var baseToTera = await aotreasury.fromBase(9123456789123, "tera");
		var baseToPeta = await aotreasury.fromBase("9123456789123456", "peta");
		var baseToExa = await aotreasury.fromBase("9123456789123456789", "exa");
		var baseToZetta = await aotreasury.fromBase("9123456789123456789123", "zetta");
		var baseToYotta = await aotreasury.fromBase("9123456789123456789123456", "yotta");
		var baseToXona = await aotreasury.fromBase("9123456789123456789123456789", "xona");

		assert.equal(baseToAo[0].toNumber(), 9123, "fromBase ao return wrong integer");
		assert.equal(baseToAo[1].toNumber(), 0, "fromBase ao return wrong fraction");
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
	contract("Owner only function tests", function() {
		it("only owner can add denomination", async function() {
			var canAdd;
			try {
				await aotreasury.addDenomination("deno", someAddress, { from: account1 });
				canAdd = true;
			} catch (e) {
				canAdd = false;
			}
			assert.notEqual(canAdd, true, "Others can add denomination");
			try {
				await aotreasury.addDenomination("kilo", someAddress, { from: owner });
				canAdd = true;
			} catch (e) {
				canAdd = false;
			}
			assert.notEqual(canAdd, true, "Owner can re-add existing denomination");
			try {
				await aotreasury.addDenomination("deno", someAddress, { from: owner });
				canAdd = true;
			} catch (e) {
				canAdd = false;
			}
			assert.equal(canAdd, true, "Owner can't add denomination");
			var deno = await aotreasury.denominations("deno");
			assert.equal(deno, someAddress, "Contract has incorrect denomination address after add");
		});
		it("only owner can update denomination", async function() {
			var canUpdate;
			try {
				await aotreasury.updateDenomination("kilo", aokilo.address, { from: account1 });
				canUpdate = true;
			} catch (e) {
				canUpdate = false;
			}
			assert.notEqual(canUpdate, true, "Others can update denomination");
			try {
				await aotreasury.updateDenomination("deca", someAddress, { from: owner });
				canUpdate = true;
			} catch (e) {
				canUpdate = false;
			}
			assert.notEqual(canUpdate, true, "Owner can update non-existing denomination");
			try {
				await aotreasury.updateDenomination("kilo", someAddress, { from: owner });
				canUpdate = true;
			} catch (e) {
				canUpdate = false;
			}
			assert.equal(canUpdate, true, "Owner can't update denomination");
			var kilo = await aotreasury.denominations("kilo");
			assert.equal(kilo, someAddress, "Contract has incorrect denomination address after update");
		});
		it("only owner can delete denomination", async function() {
			var canDelete;
			try {
				await aotreasury.deleteDenomination("kilo", { from: account1 });
				canDelete = true;
			} catch (e) {
				canDelete = false;
			}
			assert.notEqual(canDelete, true, "Others can delete denomination");
			try {
				await aotreasury.deleteDenomination("deno", { from: account1 });
				canDelete = true;
			} catch (e) {
				canDelete = false;
			}
			assert.notEqual(canDelete, true, "Owner can delete non-existing denomination");
			try {
				await aotreasury.deleteDenomination("kilo", { from: owner });
				canDelete = true;
			} catch (e) {
				canDelete = false;
			}
			assert.equal(canDelete, true, "Owner can't delete denomination");
			var kilo = await aotreasury.denominations("kilo");
			assert.equal(kilo, "0x0000000000000000000000000000000000000000", "Denomination still exist after delete");
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

			await aotoken.mintToken(account1, 100, { from: owner });
			await aokilo.mintToken(account1, 100 * 10 ** aokilodecimals.toNumber(), { from: owner });
			await aomega.mintToken(account1, 100 * 10 ** aomegadecimals.toNumber(), { from: owner });
			await aogiga.mintToken(account1, 100 * 10 ** aogigadecimals.toNumber(), { from: owner });
			await aotera.mintToken(account1, 100 * 10 ** aoteradecimals.toNumber(), { from: owner });
			await aopeta.mintToken(account1, 100 * 10 ** aopetadecimals.toNumber(), { from: owner });
			await aoexa.mintToken(account1, 100 * 10 ** aoexadecimals.toNumber(), { from: owner });
			await aozetta.mintToken(account1, 100 * 10 ** aozettadecimals.toNumber(), { from: owner });
			await aoyotta.mintToken(account1, 100 * 10 ** aoyottadecimals.toNumber(), { from: owner });
			await aoxona.mintToken(account1, 100 * 10 ** aoxonadecimals.toNumber(), { from: owner });
		});
		it("should exchange token from `fromDenominationName` to `toDenominationName` correctly", async function() {
			var canExchange;
			try {
				await aotreasury.exchange(50, "deca", "ao", { from: account1 });
				canExchange = true;
			} catch (e) {
				canExchange = false;
			}
			assert.notEqual(canExchange, true, "Contract can exchange token from invalid origin denomination");

			try {
				await aotreasury.exchange(50, "ao", "deca", { from: account1 });
				canExchange = true;
			} catch (e) {
				canExchange = false;
			}
			assert.notEqual(canExchange, true, "Contract can exchange token to invalid target denomination");

			try {
				await aotreasury.exchange(1000, "ao", "kilo", { from: account1 });
				canExchange = true;
			} catch (e) {
				canExchange = false;
			}
			assert.notEqual(canExchange, true, "Account1 can exchange token more than he/she has");

			var account1AoBalanceBefore = await aotoken.balanceOf(account1);
			var account1KiloBalanceBefore = await aokilo.balanceOf(account1);

			try {
				await aotreasury.exchange(50, "ao", "kilo", { from: account1 });
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
				await aotreasury.exchange(50, "tera", "giga", { from: account1 });
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
});
