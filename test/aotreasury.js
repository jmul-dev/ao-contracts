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
	var ao;
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
		ao = await aotreasury.getDenomination("ao");
		var kilo = await aotreasury.getDenomination("kilo");
		var mega = await aotreasury.getDenomination("mega");
		var giga = await aotreasury.getDenomination("giga");
		var tera = await aotreasury.getDenomination("tera");
		var peta = await aotreasury.getDenomination("peta");
		var exa = await aotreasury.getDenomination("exa");
		var zetta = await aotreasury.getDenomination("zetta");
		var yotta = await aotreasury.getDenomination("yotta");
		var xona = await aotreasury.getDenomination("xona");

		assert.equal(ao[0], aotoken.address, "contract is missing ao from list of denominations");
		assert.equal(kilo[0], aokilo.address, "contract is missing kilo from list of denominations");
		assert.equal(mega[0], aomega.address, "Contract is missing mega from list of denominations");
		assert.equal(giga[0], aogiga.address, "Contract is missing giga from list of denominations");
		assert.equal(tera[0], aotera.address, "Contract is missing tera from list of denominations");
		assert.equal(peta[0], aopeta.address, "Contract is missing peta from list of denominations");
		assert.equal(exa[0], aoexa.address, "Contract is missing exa from list of denominations");
		assert.equal(zetta[0], aozetta.address, "Contract is missing zetta from list of denominations");
		assert.equal(yotta[0], aoyotta.address, "Contract is missing yotta from list of denominations");
		assert.equal(xona[0], aoxona.address, "Contract is missing xona from list of denominations");
		assert.equal(ao[1], true, "ao denomination is inactive");
		assert.equal(kilo[1], true, "kilo denomination is inactive");
		assert.equal(mega[1], true, "mega denomination is inactive");
		assert.equal(giga[1], true, "giga denomination is inactive");
		assert.equal(tera[1], true, "tera denomination is inactive");
		assert.equal(peta[1], true, "peta denomination is inactive");
		assert.equal(exa[1], true, "exa denomination is inactive");
		assert.equal(zetta[1], true, "zetta denomination is inactive");
		assert.equal(yotta[1], true, "yotta denomination is inactive");
		assert.equal(xona[1], true, "xona denomination is inactive");
	});
	it("should have ao as the base denomination", async function() {
		var baseDenomination = await aotreasury.getBaseDenomination();
		assert.equal(baseDenomination[0], ao[0], "Base denomination address does not match ao denomination address");
		assert.equal(baseDenomination[1], ao[1], "Base denomination status does not match ao denomination status");
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
	contract("totalBalanceOf()", function() {
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

			// Mint 1 token for each denominations
			await aotoken.mintToken(account1, 1, { from: owner });
			await aokilo.mintToken(account1, 1 * 10 ** aokilodecimals.toNumber(), { from: owner });
			await aomega.mintToken(account1, 1 * 10 ** aomegadecimals.toNumber(), { from: owner });
			await aogiga.mintToken(account1, 1 * 10 ** aogigadecimals.toNumber(), { from: owner });
			await aotera.mintToken(account1, 1 * 10 ** aoteradecimals.toNumber(), { from: owner });
			await aopeta.mintToken(account1, 1 * 10 ** aopetadecimals.toNumber(), { from: owner });
			await aoexa.mintToken(account1, 1 * 10 ** aoexadecimals.toNumber(), { from: owner });
			await aozetta.mintToken(account1, 1 * 10 ** aozettadecimals.toNumber(), { from: owner });
			await aoyotta.mintToken(account1, 1 * 10 ** aoyottadecimals.toNumber(), { from: owner });
			await aoxona.mintToken(account1, 1 * 10 ** aoxonadecimals.toNumber(), { from: owner });
		});
		it("should return the correct sum of total balance from all denominations in base denomination", async function() {
			var totalBalance = await aotreasury.totalBalanceOf(account1);
			var aotokenBalance = await aotoken.balanceOf(account1);
			var aokiloBalance = await aokilo.balanceOf(account1);
			var aomegaBalance = await aomega.balanceOf(account1);
			var aogigaBalance = await aogiga.balanceOf(account1);
			var aoteraBalance = await aotera.balanceOf(account1);
			var aopetaBalance = await aopeta.balanceOf(account1);
			var aoexaBalance = await aoexa.balanceOf(account1);
			var aozettaBalance = await aozetta.balanceOf(account1);
			var aoyottaBalance = await aoyotta.balanceOf(account1);
			var aoxonaBalance = await aoxona.balanceOf(account1);

			assert.equal(
				totalBalance.toString(),
				aotokenBalance
					.add(aokiloBalance)
					.add(aomegaBalance)
					.add(aogigaBalance)
					.add(aoteraBalance)
					.add(aopetaBalance)
					.add(aoexaBalance)
					.add(aozettaBalance)
					.add(aoyottaBalance)
					.add(aoxonaBalance)
					.toString(),
				"Total balance return incorrect amount"
			);
		});
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
			assert.notEqual(canAdd, true, "Owner can add invalid denomination");
		});
		it("only owner can update denomination", async function() {
			var canUpdate;
			try {
				await aotreasury.updateDenomination("kilo", aokilo.address, false, { from: account1 });
				canUpdate = true;
			} catch (e) {
				canUpdate = false;
			}
			assert.notEqual(canUpdate, true, "Others can update denomination");
			try {
				await aotreasury.updateDenomination("deca", someAddress, false, { from: owner });
				canUpdate = true;
			} catch (e) {
				canUpdate = false;
			}
			assert.notEqual(canUpdate, true, "Owner can update non-existing denomination");
			try {
				await aotreasury.updateDenomination("kilo", someAddress, false, { from: owner });
				canUpdate = true;
			} catch (e) {
				canUpdate = false;
			}
			assert.notEqual(canUpdate, true, "Owner can set invalid denomination address");
			try {
				await aotreasury.updateDenomination("kilo", aokilo.address, false, { from: owner });
				canUpdate = true;
			} catch (e) {
				canUpdate = false;
			}
			assert.equal(canUpdate, true, "Owner can't update denomination");
			var kilo = await aotreasury.getDenomination("kilo");
			assert.equal(kilo[0], aokilo.address, "Denomination has incorrect denomination address after update");
			assert.equal(kilo[1], false, "Denomination has incorrect status after update");
		});
	});
	contract("determinePayment()", function() {
		before(async function() {
			var aokilodecimals = await aokilo.decimals();

			await aotoken.mintToken(account1, 800, { from: owner }); // 800 AO Token
			await aokilo.mintToken(account1, 2 * 10 ** aokilodecimals.toNumber(), { from: owner }); // 2 AO Kilo
		});
		it("should FAIL when the price is greater than user total balance", async function() {
			var canDeterminePayment;
			try {
				var payment = await aotreasury.determinePayment(account1, 1, 5, "tera");
				canDeterminePayment = true;
			} catch (e) {
				canDeterminePayment = false;
			}
			assert.notEqual(canDeterminePayment, true, "Contract can determine payment when user does not have enough balance");
		});
		it("should FAIL when the denomination is invalid", async function() {
			var canDeterminePayment;
			try {
				var payment = await aotreasury.determinePayment(account1, 1, 5, "deca");
				canDeterminePayment = true;
			} catch (e) {
				canDeterminePayment = false;
			}
			assert.notEqual(canDeterminePayment, true, "Contract can determine payment even though the passed denomination is invalid");
		});
		it("should return correct payment denominations and amounts given a price at denomination", async function() {
			var canDeterminePayment;
			try {
				var payment = await aotreasury.determinePayment(account1, 1, 20, "kilo"); // 1.020 AO Kilo
				canDeterminePayment = true;
			} catch (e) {
				canDeterminePayment = false;
			}
			assert.equal(canDeterminePayment, true, "Contract unable to determine the payment for valid price at denomination");
			var aokiloDenominationIndex = await aotreasury.denominationIndex("kilo");
			var paymentDenominations = payment[0];
			var paymentDenominationAmount = payment[1];
			for (i = 0; i < paymentDenominations.length; i++) {
				if (i == aokiloDenominationIndex.minus(1).toNumber()) {
					assert.equal(paymentDenominations[i], aokilo.address, "Payment has incorrect denomination address");
					assert.equal(paymentDenominationAmount[i].toNumber(), 1020, "Payment has incorrect denomination amount");
				} else {
					assert.equal(
						paymentDenominations[i],
						"0x0000000000000000000000000000000000000000",
						"Payment denomination address should not exist"
					);
					assert.equal(paymentDenominationAmount[i].toNumber(), 0, "Payment amount should not exist");
				}
			}

			try {
				var payment = await aotreasury.determinePayment(account1, 2, 9, "kilo"); // 2.009 AO Kilo
				canDeterminePayment = true;
			} catch (e) {
				canDeterminePayment = false;
			}
			assert.equal(canDeterminePayment, true, "Contract unable to determine the payment for valid price at denomination");
			var aotokenDenominationIndex = await aotreasury.denominationIndex("ao");
			var aokiloDenominationIndex = await aotreasury.denominationIndex("kilo");
			var paymentDenominations = payment[0];
			var paymentDenominationAmount = payment[1];
			for (i = 0; i < paymentDenominations.length; i++) {
				if (i == aotokenDenominationIndex.minus(1).toNumber()) {
					assert.equal(paymentDenominations[i], aotoken.address, "Payment has incorrect denomination address");
					assert.equal(paymentDenominationAmount[i].toNumber(), 9, "Payment has incorrect denomination amount");
				} else if (i == aokiloDenominationIndex.minus(1).toNumber()) {
					assert.equal(paymentDenominations[i], aokilo.address, "Payment has incorrect denomination address");
					assert.equal(paymentDenominationAmount[i].toNumber(), 2000, "Payment has incorrect denomination amount");
				} else {
					assert.equal(
						paymentDenominations[i],
						"0x0000000000000000000000000000000000000000",
						"Payment denomination address should not exist"
					);
					assert.equal(paymentDenominationAmount[i].toNumber(), 0, "Payment amount should not exist");
				}
			}

			var aogigadecimals = await aogiga.decimals();
			var aoexadecimals = await aoexa.decimals();

			await aogiga.mintToken(account1, 0.5 * 10 ** aogigadecimals.toNumber(), { from: owner }); // 0.5 AO Giga
			await aoexa.mintToken(account1, 0.1 * 10 ** aoexadecimals.toNumber(), { from: owner }); // 0.1 AO Exa

			try {
				var payment = await aotreasury.determinePayment(account1, 100, 500002000, "peta"); // 100.000000500002800 AO Peta
				canDeterminePayment = true;
			} catch (e) {
				canDeterminePayment = false;
			}
			assert.equal(canDeterminePayment, true, "Contract unable to determine the payment for valid price at denomination");
			var aogigaDenominationIndex = await aotreasury.denominationIndex("giga");
			var aoexaDenominationIndex = await aotreasury.denominationIndex("exa");
			var paymentDenominations = payment[0];
			var paymentDenominationAmount = payment[1];
			for (i = 0; i < paymentDenominations.length; i++) {
				if (i == aokiloDenominationIndex.minus(1).toNumber()) {
					assert.equal(paymentDenominations[i], aokilo.address, "Payment has incorrect denomination address");
					assert.equal(paymentDenominationAmount[i].toNumber(), 2000, "Payment has incorrect denomination amount");
				} else if (i == aogigaDenominationIndex.minus(1).toNumber()) {
					assert.equal(paymentDenominations[i], aogiga.address, "Payment has incorrect denomination address");
					assert.equal(paymentDenominationAmount[i].toNumber(), 500000000, "Payment has incorrect denomination amount");
				} else if (i == aoexaDenominationIndex.minus(1).toNumber()) {
					assert.equal(paymentDenominations[i], aoexa.address, "Payment has incorrect denomination address");
					assert.equal(paymentDenominationAmount[i].toNumber(), 100000000000000000, "Payment has incorrect denomination amount");
				} else {
					assert.equal(
						paymentDenominations[i],
						"0x0000000000000000000000000000000000000000",
						"Payment denomination address should not exist"
					);
					assert.equal(paymentDenominationAmount[i].toNumber(), 0, "Payment amount should not exist");
				}
			}
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
