var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var PathosKilo = artifacts.require("./PathosKilo.sol");
var Logos = artifacts.require("./Logos.sol");

contract("Pathos Kilo", function(accounts) {
	var namefactory, taofactory, nametaoposition, pathoskilo, logos, nameId1, nameId2, taoId1, taoId2;
	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var someAddress = accounts[3];
	var whitelistedAddress = accounts[4];

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		pathoskilo = await PathosKilo.deployed();
		logos = await Logos.deployed();

		// Create Name
		var result = await namefactory.createName("charlie", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account1
		});
		nameId1 = await namefactory.ethAddressToNameId(account1);

		var result = await namefactory.createName("delta", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account2
		});
		nameId2 = await namefactory.ethAddressToNameId(account2);

		// Mint Logos to nameId1 and nameId2
		await logos.setWhitelist(theAO, true, { from: theAO });
		await logos.mint(nameId1, 10 ** 12, { from: theAO });
		await logos.mint(nameId2, 10 ** 12, { from: theAO });

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

		result = await taofactory.createTAO(
			"Delta's TAO",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			"somecontentid",
			nameId2,
			0,
			false,
			0,
			{
				from: account2
			}
		);
		var createTAOEvent = result.logs[0];
		taoId2 = createTAOEvent.args.taoId;
	});

	it("should have the correct totalSupply", async function() {
		var totalSupply = await pathoskilo.totalSupply();
		assert.equal(totalSupply.toNumber(), 0, "Contract has incorrect totalSupply");
	});

	it("should have the correct name", async function() {
		var name = await pathoskilo.name();
		assert.equal(name, "Pathos Kilo", "Contract has incorrect name");
	});

	it("should have the correct symbol", async function() {
		var symbol = await pathoskilo.symbol();
		assert.equal(symbol, "PATHOSKILO", "Contract has incorrect symbol");
	});

	it("should have the correct powerOfTen", async function() {
		var powerOfTen = await pathoskilo.powerOfTen();
		assert.equal(powerOfTen.toNumber(), 3, "Contract has incorrect powerOfTen");
	});

	it("should have the correct decimals", async function() {
		var decimals = await pathoskilo.decimals();
		assert.equal(decimals.toNumber(), 3, "Contract has incorrect decimals");
	});

	it("should have the correct nameTAOPositionAddress", async function() {
		var nameTAOPositionAddress = await pathoskilo.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("The AO - transferOwnership() should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await pathoskilo.transferOwnership(taoId1, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await pathoskilo.transferOwnership(taoId1, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await pathoskilo.theAO();
		assert.equal(newTheAO, taoId1, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - setWhitelist() should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await pathoskilo.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await pathoskilo.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await pathoskilo.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
	});

	it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await pathoskilo.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await pathoskilo.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await pathoskilo.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("Whitelisted Address - should be able to mint PathosKilo to a TAO/Name", async function() {
		var canMint;
		try {
			await pathoskilo.mint(nameId1, 1000, { from: someAddress });
			canMint = true;
		} catch (e) {
			canMint = false;
		}
		assert.equal(canMint, false, "Non-whitelisted address can mint PathosKilo");

		try {
			await pathoskilo.mint(someAddress, 1000, { from: whitelistedAddress });
			canMint = true;
		} catch (e) {
			canMint = false;
		}
		assert.equal(canMint, false, "Whitelisted address can mint PathosKilo to non Name/TAO");

		try {
			await pathoskilo.mint(nameId1, 1000, { from: whitelistedAddress });
			canMint = true;
		} catch (e) {
			canMint = false;
		}
		assert.equal(canMint, true, "Whitelisted address can't mint PathosKilo to Name");

		var nameBalance = await pathoskilo.balanceOf(nameId1);
		assert.equal(nameBalance.toNumber(), 1000, "Name has incorrect pathoskilo balance");

		try {
			await pathoskilo.mint(taoId1, 1000, { from: whitelistedAddress });
			canMint = true;
		} catch (e) {
			canMint = false;
		}
		assert.equal(canMint, true, "Whitelisted address can't mint PathosKilo to TAO");

		var taoBalance = await pathoskilo.balanceOf(taoId1);
		assert.equal(taoBalance.toNumber(), 1000, "TAO has incorrect pathoskilo balance");
	});

	it("Whitelisted Address - should be able to transfer PathosKilo from a Name/TAO to another Name/TAO", async function() {
		var canTransferFrom;
		try {
			await pathoskilo.transferFrom(nameId1, nameId2, 10, { from: someAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, false, "Non-whitelisted address can transfer PathosKilo");

		try {
			await pathoskilo.transferFrom(nameId1, someAddress, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, false, "Whitelisted address can transfer PathosKilo to non Name/TAO");

		try {
			await pathoskilo.transferFrom(nameId1, nameId2, 10000, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, false, "Whitelisted address can transfer PathosKilo more than owned balance");

		try {
			await pathoskilo.transferFrom(nameId1, nameId2, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, true, "Whitelisted address can't transfer PathosKilo from Name to Name");

		var nameId1Balance = await pathoskilo.balanceOf(nameId1);
		assert.equal(nameId1Balance.toNumber(), 990, "Name has incorrect pathoskilo balance");
		var nameId2Balance = await pathoskilo.balanceOf(nameId2);
		assert.equal(nameId2Balance.toNumber(), 10, "Name has incorrect pathoskilo balance");

		try {
			await pathoskilo.transferFrom(nameId1, taoId2, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, true, "Whitelisted address can't transfer PathosKilo from Name to TAO");

		var nameId1Balance = await pathoskilo.balanceOf(nameId1);
		assert.equal(nameId1Balance.toNumber(), 980, "Name has incorrect pathoskilo balance");
		var taoId2Balance = await pathoskilo.balanceOf(taoId2);
		assert.equal(taoId2Balance.toNumber(), 10, "TAO has incorrect pathoskilo balance");

		try {
			await pathoskilo.transferFrom(taoId1, nameId2, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, true, "Whitelisted address can't transfer PathosKilo from TAO to Name");

		var taoId1Balance = await pathoskilo.balanceOf(taoId1);
		assert.equal(taoId1Balance.toNumber(), 990, "TAO has incorrect pathoskilo balance");
		var nameId2Balance = await pathoskilo.balanceOf(nameId2);
		assert.equal(nameId2Balance.toNumber(), 20, "Name has incorrect pathoskilo balance");

		try {
			await pathoskilo.transferFrom(taoId1, taoId2, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, true, "Whitelisted address can't transfer PathosKilo from TAO to TAO");

		var taoId1Balance = await pathoskilo.balanceOf(taoId1);
		assert.equal(taoId1Balance.toNumber(), 980, "TAO has incorrect pathoskilo balance");
		var taoId2Balance = await pathoskilo.balanceOf(taoId2);
		assert.equal(taoId2Balance.toNumber(), 20, "TAO has incorrect pathoskilo balance");
	});

	it("Whitelisted Address - should be able to burn PathosKilo from a TAO/Name", async function() {
		var canWhitelistBurnFrom;
		try {
			await pathoskilo.whitelistBurnFrom(nameId1, 50, { from: someAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, false, "Non-whitelisted address can burn PathosKilo");

		try {
			await pathoskilo.whitelistBurnFrom(someAddress, 50, { from: whitelistedAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, false, "Whitelisted address can burn PathosKilo from non Name/TAO");

		try {
			await pathoskilo.whitelistBurnFrom(nameId1, 1000, { from: whitelistedAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, false, "Whitelisted address can burn PathosKilo more than owned balance");

		try {
			await pathoskilo.whitelistBurnFrom(nameId1, 50, { from: whitelistedAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, true, "Whitelisted address can't burn PathosKilo from Name");

		var nameBalance = await pathoskilo.balanceOf(nameId1);
		assert.equal(nameBalance.toNumber(), 930, "Name has incorrect pathoskilo balance");

		try {
			await pathoskilo.whitelistBurnFrom(taoId1, 50, { from: whitelistedAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, true, "Whitelisted address can't burn PathosKilo from TAO");

		var taoBalance = await pathoskilo.balanceOf(taoId1);
		assert.equal(taoBalance.toNumber(), 930, "TAO has incorrect pathoskilo balance");
	});
});
