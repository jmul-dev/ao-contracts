var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var PathosYotta = artifacts.require("./PathosYotta.sol");
var Logos = artifacts.require("./Logos.sol");
var EthCrypto = require("eth-crypto");

contract("Pathos Yotta", function(accounts) {
	var namefactory, taofactory, nametaoposition, pathosyotta, logos, nameId1, nameId2, taoId1, taoId2;
	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var someAddress = accounts[3];
	var whitelistedAddress = accounts[4];

	var nameId1LocalWriterKey = EthCrypto.createIdentity();
	var nameId2LocalWriterKey = EthCrypto.createIdentity();

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		pathosyotta = await PathosYotta.deployed();
		logos = await Logos.deployed();

		// Create Name
		var result = await namefactory.createName(
			"charlie",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			web3.utils.toHex("somecontentid"),
			nameId1LocalWriterKey.address,
			{
				from: account1
			}
		);
		nameId1 = await namefactory.ethAddressToNameId(account1);

		var result = await namefactory.createName(
			"delta",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			web3.utils.toHex("somecontentid"),
			nameId2LocalWriterKey.address,
			{
				from: account2
			}
		);
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
			web3.utils.toHex("somecontentid"),
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
			web3.utils.toHex("somecontentid"),
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
		var totalSupply = await pathosyotta.totalSupply();
		assert.equal(totalSupply.toNumber(), 0, "Contract has incorrect totalSupply");
	});

	it("should have the correct name", async function() {
		var name = await pathosyotta.name();
		assert.equal(name, "Pathos Yotta", "Contract has incorrect name");
	});

	it("should have the correct symbol", async function() {
		var symbol = await pathosyotta.symbol();
		assert.equal(symbol, "PATHOSYOTTA", "Contract has incorrect symbol");
	});

	it("should have the correct powerOfTen", async function() {
		var powerOfTen = await pathosyotta.powerOfTen();
		assert.equal(powerOfTen.toNumber(), 24, "Contract has incorrect powerOfTen");
	});

	it("should have the correct decimals", async function() {
		var decimals = await pathosyotta.decimals();
		assert.equal(decimals.toNumber(), 24, "Contract has incorrect decimals");
	});

	it("should have the correct nameTAOPositionAddress", async function() {
		var nameTAOPositionAddress = await pathosyotta.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("The AO - transferOwnership() should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await pathosyotta.transferOwnership(taoId1, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await pathosyotta.transferOwnership(taoId1, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await pathosyotta.theAO();
		assert.equal(newTheAO, taoId1, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - setWhitelist() should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await pathosyotta.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await pathosyotta.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await pathosyotta.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
	});

	it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await pathosyotta.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await pathosyotta.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await pathosyotta.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("Whitelisted Address - should be able to mint PathosYotta to a TAO/Name", async function() {
		var canMint;
		try {
			await pathosyotta.mint(nameId1, 1000, { from: someAddress });
			canMint = true;
		} catch (e) {
			canMint = false;
		}
		assert.equal(canMint, false, "Non-whitelisted address can mint PathosYotta");

		try {
			await pathosyotta.mint(someAddress, 1000, { from: whitelistedAddress });
			canMint = true;
		} catch (e) {
			canMint = false;
		}
		assert.equal(canMint, false, "Whitelisted address can mint PathosYotta to non Name/TAO");

		try {
			await pathosyotta.mint(nameId1, 1000, { from: whitelistedAddress });
			canMint = true;
		} catch (e) {
			canMint = false;
		}
		assert.equal(canMint, true, "Whitelisted address can't mint PathosYotta to Name");

		var nameBalance = await pathosyotta.balanceOf(nameId1);
		assert.equal(nameBalance.toNumber(), 1000, "Name has incorrect pathosyotta balance");

		try {
			await pathosyotta.mint(taoId1, 1000, { from: whitelistedAddress });
			canMint = true;
		} catch (e) {
			canMint = false;
		}
		assert.equal(canMint, true, "Whitelisted address can't mint PathosYotta to TAO");

		var taoBalance = await pathosyotta.balanceOf(taoId1);
		assert.equal(taoBalance.toNumber(), 1000, "TAO has incorrect pathosyotta balance");
	});

	it("Whitelisted Address - should be able to transfer PathosYotta from a Name/TAO to another Name/TAO", async function() {
		var canTransferFrom;
		try {
			await pathosyotta.transferFrom(nameId1, nameId2, 10, { from: someAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, false, "Non-whitelisted address can transfer PathosYotta");

		try {
			await pathosyotta.transferFrom(nameId1, someAddress, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, false, "Whitelisted address can transfer PathosYotta to non Name/TAO");

		try {
			await pathosyotta.transferFrom(nameId1, nameId2, 10000, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, false, "Whitelisted address can transfer PathosYotta more than owned balance");

		try {
			await pathosyotta.transferFrom(nameId1, nameId2, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, true, "Whitelisted address can't transfer PathosYotta from Name to Name");

		var nameId1Balance = await pathosyotta.balanceOf(nameId1);
		assert.equal(nameId1Balance.toNumber(), 990, "Name has incorrect pathosyotta balance");
		var nameId2Balance = await pathosyotta.balanceOf(nameId2);
		assert.equal(nameId2Balance.toNumber(), 10, "Name has incorrect pathosyotta balance");

		try {
			await pathosyotta.transferFrom(nameId1, taoId2, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, true, "Whitelisted address can't transfer PathosYotta from Name to TAO");

		var nameId1Balance = await pathosyotta.balanceOf(nameId1);
		assert.equal(nameId1Balance.toNumber(), 980, "Name has incorrect pathosyotta balance");
		var taoId2Balance = await pathosyotta.balanceOf(taoId2);
		assert.equal(taoId2Balance.toNumber(), 10, "TAO has incorrect pathosyotta balance");

		try {
			await pathosyotta.transferFrom(taoId1, nameId2, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, true, "Whitelisted address can't transfer PathosYotta from TAO to Name");

		var taoId1Balance = await pathosyotta.balanceOf(taoId1);
		assert.equal(taoId1Balance.toNumber(), 990, "TAO has incorrect pathosyotta balance");
		var nameId2Balance = await pathosyotta.balanceOf(nameId2);
		assert.equal(nameId2Balance.toNumber(), 20, "Name has incorrect pathosyotta balance");

		try {
			await pathosyotta.transferFrom(taoId1, taoId2, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, true, "Whitelisted address can't transfer PathosYotta from TAO to TAO");

		var taoId1Balance = await pathosyotta.balanceOf(taoId1);
		assert.equal(taoId1Balance.toNumber(), 980, "TAO has incorrect pathosyotta balance");
		var taoId2Balance = await pathosyotta.balanceOf(taoId2);
		assert.equal(taoId2Balance.toNumber(), 20, "TAO has incorrect pathosyotta balance");
	});

	it("Whitelisted Address - should be able to burn PathosYotta from a TAO/Name", async function() {
		var canWhitelistBurnFrom;
		try {
			await pathosyotta.whitelistBurnFrom(nameId1, 50, { from: someAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, false, "Non-whitelisted address can burn PathosYotta");

		try {
			await pathosyotta.whitelistBurnFrom(someAddress, 50, { from: whitelistedAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, false, "Whitelisted address can burn PathosYotta from non Name/TAO");

		try {
			await pathosyotta.whitelistBurnFrom(nameId1, 1000, { from: whitelistedAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, false, "Whitelisted address can burn PathosYotta more than owned balance");

		try {
			await pathosyotta.whitelistBurnFrom(nameId1, 50, { from: whitelistedAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, true, "Whitelisted address can't burn PathosYotta from Name");

		var nameBalance = await pathosyotta.balanceOf(nameId1);
		assert.equal(nameBalance.toNumber(), 930, "Name has incorrect pathosyotta balance");

		try {
			await pathosyotta.whitelistBurnFrom(taoId1, 50, { from: whitelistedAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, true, "Whitelisted address can't burn PathosYotta from TAO");

		var taoBalance = await pathosyotta.balanceOf(taoId1);
		assert.equal(taoBalance.toNumber(), 930, "TAO has incorrect pathosyotta balance");
	});
});
