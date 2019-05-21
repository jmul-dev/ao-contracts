var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var EthosYotta = artifacts.require("./EthosYotta.sol");
var Logos = artifacts.require("./Logos.sol");
var EthCrypto = require("eth-crypto");

contract("Ethos Yotta", function(accounts) {
	var namefactory, taofactory, nametaoposition, ethosyotta, logos, nameId1, nameId2, taoId1, taoId2;
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
		ethosyotta = await EthosYotta.deployed();
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
		var totalSupply = await ethosyotta.totalSupply();
		assert.equal(totalSupply.toNumber(), 0, "Contract has incorrect totalSupply");
	});

	it("should have the correct name", async function() {
		var name = await ethosyotta.name();
		assert.equal(name, "Ethos Yotta", "Contract has incorrect name");
	});

	it("should have the correct symbol", async function() {
		var symbol = await ethosyotta.symbol();
		assert.equal(symbol, "ETHOSYOTTA", "Contract has incorrect symbol");
	});

	it("should have the correct powerOfTen", async function() {
		var powerOfTen = await ethosyotta.powerOfTen();
		assert.equal(powerOfTen.toNumber(), 24, "Contract has incorrect powerOfTen");
	});

	it("should have the correct decimals", async function() {
		var decimals = await ethosyotta.decimals();
		assert.equal(decimals.toNumber(), 24, "Contract has incorrect decimals");
	});

	it("should have the correct nameTAOPositionAddress", async function() {
		var nameTAOPositionAddress = await ethosyotta.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("The AO - transferOwnership() should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await ethosyotta.transferOwnership(taoId1, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await ethosyotta.transferOwnership(taoId1, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await ethosyotta.theAO();
		assert.equal(newTheAO, taoId1, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - setWhitelist() should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await ethosyotta.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await ethosyotta.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await ethosyotta.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
	});

	it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await ethosyotta.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await ethosyotta.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await ethosyotta.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("Whitelisted Address - should be able to mint EthosYotta to a TAO/Name", async function() {
		var canMint;
		try {
			await ethosyotta.mint(nameId1, 1000, { from: someAddress });
			canMint = true;
		} catch (e) {
			canMint = false;
		}
		assert.equal(canMint, false, "Non-whitelisted address can mint EthosYotta");

		try {
			await ethosyotta.mint(someAddress, 1000, { from: whitelistedAddress });
			canMint = true;
		} catch (e) {
			canMint = false;
		}
		assert.equal(canMint, false, "Whitelisted address can mint EthosYotta to non Name/TAO");

		try {
			await ethosyotta.mint(nameId1, 1000, { from: whitelistedAddress });
			canMint = true;
		} catch (e) {
			canMint = false;
		}
		assert.equal(canMint, true, "Whitelisted address can't mint EthosYotta to Name");

		var nameBalance = await ethosyotta.balanceOf(nameId1);
		assert.equal(nameBalance.toNumber(), 1000, "Name has incorrect ethosyotta balance");

		try {
			await ethosyotta.mint(taoId1, 1000, { from: whitelistedAddress });
			canMint = true;
		} catch (e) {
			canMint = false;
		}
		assert.equal(canMint, true, "Whitelisted address can't mint EthosYotta to TAO");

		var taoBalance = await ethosyotta.balanceOf(taoId1);
		assert.equal(taoBalance.toNumber(), 1000, "TAO has incorrect ethosyotta balance");
	});

	it("Whitelisted Address - should be able to transfer EthosYotta from a Name/TAO to another Name/TAO", async function() {
		var canTransferFrom;
		try {
			await ethosyotta.transferFrom(nameId1, nameId2, 10, { from: someAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, false, "Non-whitelisted address can transfer EthosYotta");

		try {
			await ethosyotta.transferFrom(nameId1, someAddress, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, false, "Whitelisted address can transfer EthosYotta to non Name/TAO");

		try {
			await ethosyotta.transferFrom(nameId1, nameId2, 10000, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, false, "Whitelisted address can transfer EthosYotta more than owned balance");

		try {
			await ethosyotta.transferFrom(nameId1, nameId2, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, true, "Whitelisted address can't transfer EthosYotta from Name to Name");

		var nameId1Balance = await ethosyotta.balanceOf(nameId1);
		assert.equal(nameId1Balance.toNumber(), 990, "Name has incorrect ethosyotta balance");
		var nameId2Balance = await ethosyotta.balanceOf(nameId2);
		assert.equal(nameId2Balance.toNumber(), 10, "Name has incorrect ethosyotta balance");

		try {
			await ethosyotta.transferFrom(nameId1, taoId2, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, true, "Whitelisted address can't transfer EthosYotta from Name to TAO");

		var nameId1Balance = await ethosyotta.balanceOf(nameId1);
		assert.equal(nameId1Balance.toNumber(), 980, "Name has incorrect ethosyotta balance");
		var taoId2Balance = await ethosyotta.balanceOf(taoId2);
		assert.equal(taoId2Balance.toNumber(), 10, "TAO has incorrect ethosyotta balance");

		try {
			await ethosyotta.transferFrom(taoId1, nameId2, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, true, "Whitelisted address can't transfer EthosYotta from TAO to Name");

		var taoId1Balance = await ethosyotta.balanceOf(taoId1);
		assert.equal(taoId1Balance.toNumber(), 990, "TAO has incorrect ethosyotta balance");
		var nameId2Balance = await ethosyotta.balanceOf(nameId2);
		assert.equal(nameId2Balance.toNumber(), 20, "Name has incorrect ethosyotta balance");

		try {
			await ethosyotta.transferFrom(taoId1, taoId2, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, true, "Whitelisted address can't transfer EthosYotta from TAO to TAO");

		var taoId1Balance = await ethosyotta.balanceOf(taoId1);
		assert.equal(taoId1Balance.toNumber(), 980, "TAO has incorrect ethosyotta balance");
		var taoId2Balance = await ethosyotta.balanceOf(taoId2);
		assert.equal(taoId2Balance.toNumber(), 20, "TAO has incorrect ethosyotta balance");
	});

	it("Whitelisted Address - should be able to burn EthosYotta from a TAO/Name", async function() {
		var canWhitelistBurnFrom;
		try {
			await ethosyotta.whitelistBurnFrom(nameId1, 50, { from: someAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, false, "Non-whitelisted address can burn EthosYotta");

		try {
			await ethosyotta.whitelistBurnFrom(someAddress, 50, { from: whitelistedAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, false, "Whitelisted address can burn EthosYotta from non Name/TAO");

		try {
			await ethosyotta.whitelistBurnFrom(nameId1, 1000, { from: whitelistedAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, false, "Whitelisted address can burn EthosYotta more than owned balance");

		try {
			await ethosyotta.whitelistBurnFrom(nameId1, 50, { from: whitelistedAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, true, "Whitelisted address can't burn EthosYotta from Name");

		var nameBalance = await ethosyotta.balanceOf(nameId1);
		assert.equal(nameBalance.toNumber(), 930, "Name has incorrect ethosyotta balance");

		try {
			await ethosyotta.whitelistBurnFrom(taoId1, 50, { from: whitelistedAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, true, "Whitelisted address can't burn EthosYotta from TAO");

		var taoBalance = await ethosyotta.balanceOf(taoId1);
		assert.equal(taoBalance.toNumber(), 930, "TAO has incorrect ethosyotta balance");
	});
});
