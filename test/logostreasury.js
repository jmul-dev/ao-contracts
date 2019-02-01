var Logos = artifacts.require("./Logos.sol");
var LogosKilo = artifacts.require("./LogosKilo.sol");
var LogosMega = artifacts.require("./LogosMega.sol");
var LogosGiga = artifacts.require("./LogosGiga.sol");
var LogosTera = artifacts.require("./LogosTera.sol");
var LogosPeta = artifacts.require("./LogosPeta.sol");
var LogosExa = artifacts.require("./LogosExa.sol");
var LogosZetta = artifacts.require("./LogosZetta.sol");
var LogosYotta = artifacts.require("./LogosYotta.sol");
var LogosXona = artifacts.require("./LogosXona.sol");
var LogosTreasury = artifacts.require("./LogosTreasury.sol");

var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");

contract("LogosTreasury", function(accounts) {
	var logostreasury,
		logos,
		logoskilo,
		logosmega,
		logosgiga,
		logostera,
		logospeta,
		logosexa,
		logoszetta,
		logosyotta,
		logosxona,
		namefactory,
		taofactory,
		nametaoposition,
		nameId1,
		taoId1;
	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var someAddress = accounts[3];
	var whitelistedAddress = accounts[4];
	var base, kilo, mega, giga, tera, peta, exa, zetta, yotta, xona;
	before(async function() {
		logostreasury = await LogosTreasury.deployed();
		logos = await Logos.deployed();
		logoskilo = await LogosKilo.deployed();
		logosmega = await LogosMega.deployed();
		logosgiga = await LogosGiga.deployed();
		logostera = await LogosTera.deployed();
		logospeta = await LogosPeta.deployed();
		logosexa = await LogosExa.deployed();
		logoszetta = await LogosZetta.deployed();
		logosyotta = await LogosYotta.deployed();
		logosxona = await LogosXona.deployed();

		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();

		// Create Name
		var result = await namefactory.createName("charlie", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account1
		});
		nameId1 = await namefactory.ethAddressToNameId(account1);

		// Mint Logos to nameId1 and nameId2
		await logos.setWhitelist(theAO, true, { from: theAO });
		await logos.mint(nameId1, 10 ** 12, { from: theAO });

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

	it("should have all of Logos denominations", async function() {
		base = await logostreasury.getDenominationByName("logos");
		kilo = await logostreasury.getDenominationByName("kilo");
		mega = await logostreasury.getDenominationByName("mega");
		giga = await logostreasury.getDenominationByName("giga");
		tera = await logostreasury.getDenominationByName("tera");
		peta = await logostreasury.getDenominationByName("peta");
		exa = await logostreasury.getDenominationByName("exa");
		zetta = await logostreasury.getDenominationByName("zetta");
		yotta = await logostreasury.getDenominationByName("yotta");
		xona = await logostreasury.getDenominationByName("xona");

		assert.equal(base[1], logos.address, "contract is missing logos from list of denominations");
		assert.equal(kilo[1], logoskilo.address, "contract is missing kilo from list of denominations");
		assert.equal(mega[1], logosmega.address, "Contract is missing mega from list of denominations");
		assert.equal(giga[1], logosgiga.address, "Contract is missing giga from list of denominations");
		assert.equal(tera[1], logostera.address, "Contract is missing tera from list of denominations");
		assert.equal(peta[1], logospeta.address, "Contract is missing peta from list of denominations");
		assert.equal(exa[1], logosexa.address, "Contract is missing exa from list of denominations");
		assert.equal(zetta[1], logoszetta.address, "Contract is missing zetta from list of denominations");
		assert.equal(yotta[1], logosyotta.address, "Contract is missing yotta from list of denominations");
		assert.equal(xona[1], logosxona.address, "Contract is missing xona from list of denominations");
	});

	it("The AO - should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await logostreasury.transferOwnership(taoId1, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await logostreasury.transferOwnership(taoId1, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await logostreasury.theAO();
		assert.equal(newTheAO, taoId1, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await logostreasury.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await logostreasury.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await logostreasury.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
	});

	it("The AO - should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await logostreasury.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await logostreasury.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await logostreasury.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("The AO - should be able to set NameFactory address", async function() {
		var canSetAddress;
		try {
			await logostreasury.setNameFactoryAddress(namefactory.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameFactory address");

		try {
			await logostreasury.setNameFactoryAddress(namefactory.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameFactory address");

		var nameFactoryAddress = await logostreasury.nameFactoryAddress();
		assert.equal(nameFactoryAddress, namefactory.address, "Contract has incorrect nameFactoryAddress");
	});

	it("The AO - should be able to can add denomination", async function() {
		var canAdd;
		try {
			await logostreasury.addDenomination("deno", someAddress, { from: account2 });
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.notEqual(canAdd, true, "Others can add denomination");
		try {
			await logostreasury.addDenomination("kilo", someAddress, { from: account1 });
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.notEqual(canAdd, true, "The AO can re-add existing denomination");
		try {
			await logostreasury.addDenomination("deno", someAddress, { from: account1 });
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.notEqual(canAdd, true, "The AO can add invalid denomination");
	});

	it("The AO - should be able to update denomination", async function() {
		var canUpdate;
		try {
			await logostreasury.updateDenomination("kilo", logoskilo.address, { from: account2 });
			canUpdate = true;
		} catch (e) {
			canUpdate = false;
		}
		assert.notEqual(canUpdate, true, "Others can update denomination");
		try {
			await logostreasury.updateDenomination("deca", someAddress, { from: account1 });
			canUpdate = true;
		} catch (e) {
			canUpdate = false;
		}
		assert.notEqual(canUpdate, true, "The AO can update non-existing denomination");
		try {
			await logostreasury.updateDenomination("kilo", someAddress, { from: account1 });
			canUpdate = true;
		} catch (e) {
			canUpdate = false;
		}
		assert.notEqual(canUpdate, true, "The AO can set invalid denomination address");
		try {
			await logostreasury.updateDenomination("kilo", logoskilo.address, { from: account1 });
			canUpdate = true;
		} catch (e) {
			canUpdate = false;
		}
		assert.equal(canUpdate, true, "The AO can't update denomination");
		var kilo = await logostreasury.getDenominationByName("kilo");
		assert.equal(kilo[1], logoskilo.address, "Denomination has incorrect denomination address after update");
	});

	it("isDenominationExist() - should check whether or not a denomination exist", async function() {
		var isDenominationExist = await logostreasury.isDenominationExist("kilo");
		assert.equal(isDenominationExist, true, "isDenominationExist() returns incorrect value");

		isDenominationExist = await logostreasury.isDenominationExist("deca");
		assert.equal(isDenominationExist, false, "isDenominationExist() returns incorrect value");
	});

	it("getDenominationByName() - should return denomination info given a denomination name", async function() {
		var canGetDenominationByName;
		try {
			var denomination = await logostreasury.getDenominationByName("deca");
			canGetDenominationByName = true;
		} catch (e) {
			canGetDenominationByName = false;
		}
		assert.equal(canGetDenominationByName, false, "getDenominationByName() can get info of a non-existing denomination");

		var denomination = await logostreasury.getDenominationByName("kilo");
		var name = await logoskilo.name();
		var symbol = await logoskilo.symbol();
		var decimals = await logoskilo.decimals();
		var powerOfTen = await logoskilo.powerOfTen();

		assert.equal(
			web3.toAscii(denomination[0]).replace(/\0/g, ""),
			"kilo",
			"getDenominationByName() returns incorrect value for denomination internal name"
		);
		assert.equal(denomination[1], logoskilo.address, "getDenominationByName() returns incorrect value for denomination address");
		assert.equal(denomination[2], name, "getDenominationByName() returns incorrect value for name");
		assert.equal(denomination[3], symbol, "getDenominationByName() returns incorrect value for symbol");
		assert.equal(denomination[4].toNumber(), decimals.toNumber(), "getDenominationByName() returns incorrect value for decimals");
		assert.equal(denomination[5].toNumber(), powerOfTen.toNumber(), "getDenominationByName() returns incorrect value for powerOfTen");
	});

	it("getDenominationByIndex() - should return denomination info given a denomination index", async function() {
		var canGetDenominationByIndex;
		try {
			var denomination = await logostreasury.getDenominationByIndex(100);
			canGetDenominationByIndex = true;
		} catch (e) {
			canGetDenominationByIndex = false;
		}
		assert.equal(canGetDenominationByIndex, false, "getDenominationByIndex() can get info of a non-existing denomination");

		var denomination = await logostreasury.getDenominationByIndex(2);
		var name = await logoskilo.name();
		var symbol = await logoskilo.symbol();
		var decimals = await logoskilo.decimals();
		var powerOfTen = await logoskilo.powerOfTen();

		assert.equal(
			web3.toAscii(denomination[0]).replace(/\0/g, ""),
			"kilo",
			"getDenominationByIndex() returns incorrect value for denomination internal name"
		);
		assert.equal(denomination[1], logoskilo.address, "getDenominationByIndex() returns incorrect value for denomination address");
		assert.equal(denomination[2], name, "getDenominationByIndex() returns incorrect value for name");
		assert.equal(denomination[3], symbol, "getDenominationByIndex() returns incorrect value for symbol");
		assert.equal(denomination[4].toNumber(), decimals.toNumber(), "getDenominationByIndex() returns incorrect value for decimals");
		assert.equal(denomination[5].toNumber(), powerOfTen.toNumber(), "getDenominationByIndex() returns incorrect value for powerOfTen");
	});

	it("getBaseDenomination() - should return base denomination info", async function() {
		var denomination = await logostreasury.getBaseDenomination();
		var name = await logos.name();
		var symbol = await logos.symbol();
		var decimals = await logos.decimals();
		var powerOfTen = await logos.powerOfTen();

		assert.equal(
			web3.toAscii(denomination[0]).replace(/\0/g, ""),
			"logos",
			"getBaseDenomination() returns incorrect value for denomination internal name"
		);
		assert.equal(denomination[1], logos.address, "getBaseDenomination() returns incorrect value for denomination address");
		assert.equal(denomination[2], name, "getBaseDenomination() returns incorrect value for name");
		assert.equal(denomination[3], symbol, "getBaseDenomination() returns incorrect value for symbol");
		assert.equal(denomination[4].toNumber(), decimals.toNumber(), "getBaseDenomination() returns incorrect value for decimals");
		assert.equal(denomination[5].toNumber(), powerOfTen.toNumber(), "getBaseDenomination() returns incorrect value for powerOfTen");
	});

	it("toBase() should return correct amount", async function() {
		var kiloToBase = await logostreasury.toBase(9, 1, "kilo");
		assert.equal(kiloToBase.toNumber(), 9001, "toBase kilo return wrong amount of Logos");
		kiloToBase = await logostreasury.toBase(9, 20, "kilo");
		assert.equal(kiloToBase.toNumber(), 9020, "toBase kilo return wrong amount of Logos");
		kiloToBase = await logostreasury.toBase(9, 100, "kilo");
		assert.equal(kiloToBase.toNumber(), 9100, "toBase kilo return wrong amount of Logos");

		var megaToBase = await logostreasury.toBase(9, 123, "mega");
		var gigaToBase = await logostreasury.toBase(9, 123, "giga");
		var teraToBase = await logostreasury.toBase(9, 123, "tera");
		var petaToBase = await logostreasury.toBase(9, 123, "peta");
		var exaToBase = await logostreasury.toBase(9, 123, "exa");
		var zettaToBase = await logostreasury.toBase(9, 123, "zetta");
		var yottaToBase = await logostreasury.toBase(9, 123, "yotta");
		var xonaToBase = await logostreasury.toBase(9, 123, "xona");

		assert.equal(megaToBase.toNumber(), 9000123, "toBase mega return wrong amount of Logos");
		assert.equal(gigaToBase.toNumber(), 9000000123, "toBase giga return wrong amount of Logos");
		assert.equal(teraToBase.toNumber(), 9000000000123, "toBase tera return wrong amount of Logos");
		assert.equal(petaToBase.toNumber(), "9000000000000123", "toBase peta return wrong amount of Logos");
		assert.equal(exaToBase.toNumber(), "9000000000000000123", "toBase exa return wrong amount of Logos");
		assert.equal(zettaToBase.toNumber(), "9000000000000000000123", "toBase zetta return wrong amount of Logos");
		assert.equal(yottaToBase.toNumber(), "9000000000000000000000123", "toBase yotta return wrong amount of Logos");
		assert.equal(xonaToBase.toNumber(), "9000000000000000000000000123", "toBase xona return wrong amount of Logos");
	});

	it("fromBase() should return correct amount", async function() {
		var baseTologos = await logostreasury.fromBase(9001, "logos");
		var baseToKilo = await logostreasury.fromBase(9123, "kilo");
		var baseToMega = await logostreasury.fromBase(1203, "mega");
		var baseToGiga = await logostreasury.fromBase(9123456789, "giga");
		var baseToTera = await logostreasury.fromBase(9123456789123, "tera");
		var baseToPeta = await logostreasury.fromBase("9123456789123456", "peta");
		var baseToExa = await logostreasury.fromBase("9123456789123456789", "exa");
		var baseToZetta = await logostreasury.fromBase("9123456789123456789123", "zetta");
		var baseToYotta = await logostreasury.fromBase("9123456789123456789123456", "yotta");
		var baseToXona = await logostreasury.fromBase("9000000000123456789123456789", "xona");

		assert.equal(baseTologos[0].toNumber(), 9001, "fromBase logos return wrong integer");
		assert.equal(baseTologos[1].toNumber(), 0, "fromBase logos return wrong fraction");
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
		var highestDenomination = await logostreasury.toHighestDenomination(10);
		assert.equal(
			web3.toAscii(highestDenomination[0]).replace(/\0/g, ""),
			"logos",
			"Highest denomination returns incorrect denomination"
		);
		assert.equal(highestDenomination[1], base[1], "Highest denomination returns incorrect denomination address");
		assert.equal(highestDenomination[2].toNumber(), 10, "Highest denomination returns incorrect integer amount");
		assert.equal(highestDenomination[3].toNumber(), 0, "Highest denomination returns incorrect fraction amount");
		assert.equal(highestDenomination[4], base[2], "Highest denomination name does not match logos name");
		assert.equal(highestDenomination[5], base[3], "Highest denomination symbol does not match logos symbol");
		assert.equal(highestDenomination[6].toNumber(), base[4].toNumber(), "Highest denomination decimals does not match logos decimals");
		assert.equal(
			highestDenomination[7].toNumber(),
			base[5].toNumber(),
			"Highest denomination power of ten does not match logos power of ten"
		);

		var highestDenomination = await logostreasury.toHighestDenomination(28340394);
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

	it("exchangeDenomination() - should exchange Logos from `fromDenominationName` to `toDenominationName` correctly", async function() {
		var canExchange, exchangeDenominationEvent, exchangeId;
		try {
			var result = await logostreasury.exchangeDenomination(50, "deca", "logos", { from: account1 });
			exchangeDenominationEvent = result.logs[0];
			exchangeId = exchangeDenominationEvent.args.exchangeId;
			canExchange = true;
		} catch (e) {
			canExchange = false;
			exchangeDenominationEvent = null;
			exchangeId = null;
		}
		assert.notEqual(canExchange, true, "Contract can exchange Logos from invalid origin denomination");

		try {
			var result = await logostreasury.exchangeDenomination(50, "logos", "deca", { from: account1 });
			exchangeDenominationEvent = result.logs[0];
			exchangeId = exchangeDenominationEvent.args.exchangeId;
			canExchange = true;
		} catch (e) {
			canExchange = false;
			exchangeDenominationEvent = null;
			exchangeId = null;
		}
		assert.notEqual(canExchange, true, "Contract can exchange Logos to invalid target denomination");

		try {
			var result = await logostreasury.exchangeDenomination(10 ** 20, "logos", "kilo", { from: account1 });
			exchangeDenominationEvent = result.logs[0];
			exchangeId = exchangeDenominationEvent.args.exchangeId;
			canExchange = true;
		} catch (e) {
			canExchange = false;
			exchangeDenominationEvent = null;
			exchangeId = null;
		}
		assert.notEqual(canExchange, true, "Account1 can exchange Logos more than he/she has");

		var nameId1LogosBalanceBefore = await logos.balanceOf(nameId1);
		var nameId1KiloBalanceBefore = await logoskilo.balanceOf(nameId1);

		try {
			var result = await logostreasury.exchangeDenomination(50, "logos", "kilo", { from: account1 });
			exchangeDenominationEvent = result.logs[0];
			exchangeId = exchangeDenominationEvent.args.exchangeId;
			canExchange = true;
		} catch (e) {
			canExchange = false;
			exchangeDenominationEvent = null;
			exchangeId = null;
		}
		assert.equal(canExchange, true, "Contract can't complete exchange on valid denominations");
		var nameId1LogosBalanceAfter = await logos.balanceOf(nameId1);
		var nameId1KiloBalanceAfter = await logoskilo.balanceOf(nameId1);

		assert.equal(
			nameId1LogosBalanceAfter.toNumber(),
			nameId1LogosBalanceBefore.minus(50).toNumber(),
			"NameId1 has incorrect Logos balance after exchanging"
		);
		assert.equal(
			nameId1KiloBalanceAfter.toNumber(),
			nameId1KiloBalanceBefore.plus(50).toNumber(),
			"NameId1 has incorrect Logos Kilo  balance after exchanging"
		);

		var denominationExchange = await logostreasury.getDenominationExchangeById(exchangeId);
		var fromSymbol = await logos.symbol();
		var toSymbol = await logoskilo.symbol();
		assert.equal(denominationExchange[0], nameId1, "DenominationExchange returns incorrect sender address");
		assert.equal(denominationExchange[1], logos.address, "DenominationExchange returns incorrect fromDenominationAddress");
		assert.equal(denominationExchange[2], logoskilo.address, "DenominationExchange returns incorrect toDenominationAddress");
		assert.equal(denominationExchange[3], fromSymbol, "DenominationExchange returns incorrect from denomination symbol");
		assert.equal(denominationExchange[4], toSymbol, "DenominationExchange returns incorrect to denomination symbol");
		assert.equal(denominationExchange[5], 50, "DenominationExchange returns incorrect to amount exchanged");
	});
});
