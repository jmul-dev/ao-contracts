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

var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var Logos = artifacts.require("./Logos.sol");

contract("AOTreasury", function(accounts) {
	var aotreasury,
		aotoken,
		aokilo,
		aomega,
		aogiga,
		aotera,
		aopeta,
		aoexa,
		aozetta,
		aoyotta,
		aoxona,
		namefactory,
		taofactory,
		nametaoposition,
		logos,
		nameId1,
		taoId1;
	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var someAddress = accounts[3];
	var whitelistedAddress = accounts[4];
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

		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		logos = await Logos.deployed();

		// Create Name
		var result = await namefactory.createName("charlie", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account1
		});
		nameId1 = await namefactory.ethAddressToNameId(account1);

		// Mint Logos to nameId1 and nameId2
		await logos.setWhitelist(theAO, true, { from: theAO });
		await logos.mintToken(nameId1, 10 ** 12, { from: theAO });

		result = await taofactory.createTAO(
			"Charlie's TAO",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			"somecontentid",
			nameId1,
			0,
			false,
			0,
			{
				from: account1
			}
		);
		var createTAOEvent = result.logs[0];
		taoId1 = createTAOEvent.args.taoId;
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

	it("The AO - should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await aotreasury.transferOwnership(taoId1, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await aotreasury.transferOwnership(taoId1, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await aotreasury.theAO();
		assert.equal(newTheAO, taoId1, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await aotreasury.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await aotreasury.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await aotreasury.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
	});

	it("The AO - should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await aotreasury.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await aotreasury.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await aotreasury.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("The AO - should be able to can add denomination", async function() {
		var canAdd;
		try {
			await aotreasury.addDenomination("deno", someAddress, { from: account2 });
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.notEqual(canAdd, true, "Others can add denomination");
		try {
			await aotreasury.addDenomination("kilo", someAddress, { from: account1 });
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.notEqual(canAdd, true, "The AO can re-add existing denomination");
		try {
			await aotreasury.addDenomination("deno", someAddress, { from: account1 });
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.notEqual(canAdd, true, "The AO can add invalid denomination");
	});

	it("The AO - should be able to update denomination", async function() {
		var canUpdate;
		try {
			await aotreasury.updateDenomination("kilo", aokilo.address, { from: account2 });
			canUpdate = true;
		} catch (e) {
			canUpdate = false;
		}
		assert.notEqual(canUpdate, true, "Others can update denomination");
		try {
			await aotreasury.updateDenomination("deca", someAddress, { from: account1 });
			canUpdate = true;
		} catch (e) {
			canUpdate = false;
		}
		assert.notEqual(canUpdate, true, "The AO can update non-existing denomination");
		try {
			await aotreasury.updateDenomination("kilo", someAddress, { from: account1 });
			canUpdate = true;
		} catch (e) {
			canUpdate = false;
		}
		assert.notEqual(canUpdate, true, "The AO can set invalid denomination address");
		try {
			await aotreasury.updateDenomination("kilo", aokilo.address, { from: account1 });
			canUpdate = true;
		} catch (e) {
			canUpdate = false;
		}
		assert.equal(canUpdate, true, "The AO can't update denomination");
		var kilo = await aotreasury.getDenominationByName("kilo");
		assert.equal(kilo[1], aokilo.address, "Denomination has incorrect denomination address after update");
	});

	it("isDenominationExist() - should check whether or not a denomination exist", async function() {
		var isDenominationExist = await aotreasury.isDenominationExist("kilo");
		assert.equal(isDenominationExist, true, "isDenominationExist() returns incorrect value");

		isDenominationExist = await aotreasury.isDenominationExist("deca");
		assert.equal(isDenominationExist, false, "isDenominationExist() returns incorrect value");
	});

	it("getDenominationByName() - should return denomination info given a denomination name", async function() {
		var canGetDenominationByName;
		try {
			var denomination = await aotreasury.getDenominationByName("deca");
			canGetDenominationByName = true;
		} catch (e) {
			canGetDenominationByName = false;
		}
		assert.equal(canGetDenominationByName, false, "getDenominationByName() can get info of a non-existing denomination");

		var denomination = await aotreasury.getDenominationByName("kilo");
		var name = await aokilo.name();
		var symbol = await aokilo.symbol();
		var decimals = await aokilo.decimals();
		var powerOfTen = await aokilo.powerOfTen();

		assert.equal(
			web3.toAscii(denomination[0]).replace(/\0/g, ""),
			"kilo",
			"getDenominationByName() returns incorrect value for denomination internal name"
		);
		assert.equal(denomination[1], aokilo.address, "getDenominationByName() returns incorrect value for denomination address");
		assert.equal(denomination[2], name, "getDenominationByName() returns incorrect value for name");
		assert.equal(denomination[3], symbol, "getDenominationByName() returns incorrect value for symbol");
		assert.equal(denomination[4].toNumber(), decimals.toNumber(), "getDenominationByName() returns incorrect value for decimals");
		assert.equal(denomination[5].toNumber(), powerOfTen.toNumber(), "getDenominationByName() returns incorrect value for powerOfTen");
	});

	it("getDenominationByIndex() - should return denomination info given a denomination index", async function() {
		var canGetDenominationByIndex;
		try {
			var denomination = await aotreasury.getDenominationByIndex(100);
			canGetDenominationByIndex = true;
		} catch (e) {
			canGetDenominationByIndex = false;
		}
		assert.equal(canGetDenominationByIndex, false, "getDenominationByIndex() can get info of a non-existing denomination");

		var denomination = await aotreasury.getDenominationByIndex(2);
		var name = await aokilo.name();
		var symbol = await aokilo.symbol();
		var decimals = await aokilo.decimals();
		var powerOfTen = await aokilo.powerOfTen();

		assert.equal(
			web3.toAscii(denomination[0]).replace(/\0/g, ""),
			"kilo",
			"getDenominationByIndex() returns incorrect value for denomination internal name"
		);
		assert.equal(denomination[1], aokilo.address, "getDenominationByIndex() returns incorrect value for denomination address");
		assert.equal(denomination[2], name, "getDenominationByIndex() returns incorrect value for name");
		assert.equal(denomination[3], symbol, "getDenominationByIndex() returns incorrect value for symbol");
		assert.equal(denomination[4].toNumber(), decimals.toNumber(), "getDenominationByIndex() returns incorrect value for decimals");
		assert.equal(denomination[5].toNumber(), powerOfTen.toNumber(), "getDenominationByIndex() returns incorrect value for powerOfTen");
	});

	it("getBaseDenomination() - should return base denomination info", async function() {
		var denomination = await aotreasury.getBaseDenomination();
		var name = await aotoken.name();
		var symbol = await aotoken.symbol();
		var decimals = await aotoken.decimals();
		var powerOfTen = await aotoken.powerOfTen();

		assert.equal(
			web3.toAscii(denomination[0]).replace(/\0/g, ""),
			"ao",
			"getBaseDenomination() returns incorrect value for denomination internal name"
		);
		assert.equal(denomination[1], aotoken.address, "getBaseDenomination() returns incorrect value for denomination address");
		assert.equal(denomination[2], name, "getBaseDenomination() returns incorrect value for name");
		assert.equal(denomination[3], symbol, "getBaseDenomination() returns incorrect value for symbol");
		assert.equal(denomination[4].toNumber(), decimals.toNumber(), "getBaseDenomination() returns incorrect value for decimals");
		assert.equal(denomination[5].toNumber(), powerOfTen.toNumber(), "getBaseDenomination() returns incorrect value for powerOfTen");
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

	it("toHighestDenomination() - should return the correct highest possible denomination given a base amount", async function() {
		var highestDenomination = await aotreasury.toHighestDenomination(10);
		assert.equal(web3.toAscii(highestDenomination[0]).replace(/\0/g, ""), "ao", "Highest denomination returns incorrect denomination");
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
		assert.equal(highestDenomination[6].toNumber(), mega[4].toNumber(), "Highest denomination decimals does not match mega decimals");
		assert.equal(
			highestDenomination[7].toNumber(),
			mega[5].toNumber(),
			"Highest denomination power of ten does not match mega power of ten"
		);
	});

	contract("exchange()", function() {
		before(async function() {
			await aotoken.setWhitelist(theAO, true, { from: theAO });
			await aotoken.mintToken(account1, 100, { from: theAO });
		});
		it("should exchange token from `fromDenominationName` to `toDenominationName` correctly", async function() {
			var canExchange, exchangeDenominationEvent, exchangeId;
			try {
				var result = await aotreasury.exchangeDenomination(50, "deca", "ao", { from: account1 });
				exchangeDenominationEvent = result.logs[0];
				exchangeId = exchangeDenominationEvent.args.exchangeId;
				canExchange = true;
			} catch (e) {
				canExchange = false;
				exchangeDenominationEvent = null;
				exchangeId = null;
			}
			assert.notEqual(canExchange, true, "Contract can exchange token from invalid origin denomination");

			try {
				var result = await aotreasury.exchangeDenomination(50, "ao", "deca", { from: account1 });
				exchangeDenominationEvent = result.logs[0];
				exchangeId = exchangeDenominationEvent.args.exchangeId;
				canExchange = true;
			} catch (e) {
				canExchange = false;
				exchangeDenominationEvent = null;
				exchangeId = null;
			}
			assert.notEqual(canExchange, true, "Contract can exchange token to invalid target denomination");

			try {
				var result = await aotreasury.exchangeDenomination(1000, "ao", "kilo", { from: account1 });
				exchangeDenominationEvent = result.logs[0];
				exchangeId = exchangeDenominationEvent.args.exchangeId;
				canExchange = true;
			} catch (e) {
				canExchange = false;
				exchangeDenominationEvent = null;
				exchangeId = null;
			}
			assert.notEqual(canExchange, true, "Account1 can exchange token more than he/she has");

			var account1AoBalanceBefore = await aotoken.balanceOf(account1);
			var account1KiloBalanceBefore = await aokilo.balanceOf(account1);

			try {
				var result = await aotreasury.exchangeDenomination(50, "ao", "kilo", { from: account1 });
				exchangeDenominationEvent = result.logs[0];
				exchangeId = exchangeDenominationEvent.args.exchangeId;
				canExchange = true;
			} catch (e) {
				canExchange = false;
				exchangeDenominationEvent = null;
				exchangeId = null;
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

			var denominationExchange = await aotreasury.getDenominationExchangeById(exchangeId);
			var fromSymbol = await aotoken.symbol();
			var toSymbol = await aokilo.symbol();
			assert.equal(denominationExchange[0], account1, "DenominationExchange returns incorrect sender address");
			assert.equal(denominationExchange[1], aotoken.address, "DenominationExchange returns incorrect fromDenominationAddress");
			assert.equal(denominationExchange[2], aokilo.address, "DenominationExchange returns incorrect toDenominationAddress");
			assert.equal(denominationExchange[3], fromSymbol, "DenominationExchange returns incorrect from denomination symbol");
			assert.equal(denominationExchange[4], toSymbol, "DenominationExchange returns incorrect to denomination symbol");
			assert.equal(denominationExchange[5], 50, "DenominationExchange returns incorrect to amount exchanged");
		});
	});
});
