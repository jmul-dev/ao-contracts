var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var EthosGiga = artifacts.require("./EthosGiga.sol");
var Logos = artifacts.require("./Logos.sol");

contract("Ethos Giga", function(accounts) {
	var namefactory, taofactory, nametaoposition, ethosgiga, logos, nameId1, nameId2, taoId1, taoId2;
	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var someAddress = accounts[3];
	var whitelistedAddress = accounts[4];

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		ethosgiga = await EthosGiga.deployed();
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
		var totalSupply = await ethosgiga.totalSupply();
		assert.equal(totalSupply.toNumber(), 0, "Contract has incorrect totalSupply");
	});

	it("should have the correct name", async function() {
		var name = await ethosgiga.name();
		assert.equal(name, "Ethos Giga", "Contract has incorrect name");
	});

	it("should have the correct symbol", async function() {
		var symbol = await ethosgiga.symbol();
		assert.equal(symbol, "ETHOSGIGA", "Contract has incorrect symbol");
	});

	it("should have the correct powerOfTen", async function() {
		var powerOfTen = await ethosgiga.powerOfTen();
		assert.equal(powerOfTen.toNumber(), 9, "Contract has incorrect powerOfTen");
	});

	it("should have the correct decimals", async function() {
		var decimals = await ethosgiga.decimals();
		assert.equal(decimals.toNumber(), 9, "Contract has incorrect decimals");
	});

	it("should have the correct nameTAOPositionAddress", async function() {
		var nameTAOPositionAddress = await ethosgiga.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("The AO - transferOwnership() should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await ethosgiga.transferOwnership(taoId1, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await ethosgiga.transferOwnership(taoId1, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await ethosgiga.theAO();
		assert.equal(newTheAO, taoId1, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - setWhitelist() should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await ethosgiga.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await ethosgiga.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await ethosgiga.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
	});

	it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await ethosgiga.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await ethosgiga.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await ethosgiga.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("Whitelisted Address - should be able to mint EthosGiga to a TAO/Name", async function() {
		var canMint;
		try {
			await ethosgiga.mint(nameId1, 1000, { from: someAddress });
			canMint = true;
		} catch (e) {
			canMint = false;
		}
		assert.equal(canMint, false, "Non-whitelisted address can mint EthosGiga");

		try {
			await ethosgiga.mint(someAddress, 1000, { from: whitelistedAddress });
			canMint = true;
		} catch (e) {
			canMint = false;
		}
		assert.equal(canMint, false, "Whitelisted address can mint EthosGiga to non Name/TAO");

		try {
			await ethosgiga.mint(nameId1, 1000, { from: whitelistedAddress });
			canMint = true;
		} catch (e) {
			canMint = false;
		}
		assert.equal(canMint, true, "Whitelisted address can't mint EthosGiga to Name");

		var nameBalance = await ethosgiga.balanceOf(nameId1);
		assert.equal(nameBalance.toNumber(), 1000, "Name has incorrect ethosgiga balance");

		try {
			await ethosgiga.mint(taoId1, 1000, { from: whitelistedAddress });
			canMint = true;
		} catch (e) {
			canMint = false;
		}
		assert.equal(canMint, true, "Whitelisted address can't mint EthosGiga to TAO");

		var taoBalance = await ethosgiga.balanceOf(taoId1);
		assert.equal(taoBalance.toNumber(), 1000, "TAO has incorrect ethosgiga balance");
	});

	it("Whitelisted Address - should be able to transfer EthosGiga from a Name/TAO to another Name/TAO", async function() {
		var canTransferFrom;
		try {
			await ethosgiga.transferFrom(nameId1, nameId2, 10, { from: someAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, false, "Non-whitelisted address can transfer EthosGiga");

		try {
			await ethosgiga.transferFrom(nameId1, someAddress, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, false, "Whitelisted address can transfer EthosGiga to non Name/TAO");

		try {
			await ethosgiga.transferFrom(nameId1, nameId2, 10000, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, false, "Whitelisted address can transfer EthosGiga more than owned balance");

		try {
			await ethosgiga.transferFrom(nameId1, nameId2, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, true, "Whitelisted address can't transfer EthosGiga from Name to Name");

		var nameId1Balance = await ethosgiga.balanceOf(nameId1);
		assert.equal(nameId1Balance.toNumber(), 990, "Name has incorrect ethosgiga balance");
		var nameId2Balance = await ethosgiga.balanceOf(nameId2);
		assert.equal(nameId2Balance.toNumber(), 10, "Name has incorrect ethosgiga balance");

		try {
			await ethosgiga.transferFrom(nameId1, taoId2, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, true, "Whitelisted address can't transfer EthosGiga from Name to TAO");

		var nameId1Balance = await ethosgiga.balanceOf(nameId1);
		assert.equal(nameId1Balance.toNumber(), 980, "Name has incorrect ethosgiga balance");
		var taoId2Balance = await ethosgiga.balanceOf(taoId2);
		assert.equal(taoId2Balance.toNumber(), 10, "TAO has incorrect ethosgiga balance");

		try {
			await ethosgiga.transferFrom(taoId1, nameId2, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, true, "Whitelisted address can't transfer EthosGiga from TAO to Name");

		var taoId1Balance = await ethosgiga.balanceOf(taoId1);
		assert.equal(taoId1Balance.toNumber(), 990, "TAO has incorrect ethosgiga balance");
		var nameId2Balance = await ethosgiga.balanceOf(nameId2);
		assert.equal(nameId2Balance.toNumber(), 20, "Name has incorrect ethosgiga balance");

		try {
			await ethosgiga.transferFrom(taoId1, taoId2, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, true, "Whitelisted address can't transfer EthosGiga from TAO to TAO");

		var taoId1Balance = await ethosgiga.balanceOf(taoId1);
		assert.equal(taoId1Balance.toNumber(), 980, "TAO has incorrect ethosgiga balance");
		var taoId2Balance = await ethosgiga.balanceOf(taoId2);
		assert.equal(taoId2Balance.toNumber(), 20, "TAO has incorrect ethosgiga balance");
	});

	it("Whitelisted Address - should be able to burn EthosGiga from a TAO/Name", async function() {
		var canWhitelistBurnFrom;
		try {
			await ethosgiga.whitelistBurnFrom(nameId1, 50, { from: someAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, false, "Non-whitelisted address can burn EthosGiga");

		try {
			await ethosgiga.whitelistBurnFrom(someAddress, 50, { from: whitelistedAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, false, "Whitelisted address can burn EthosGiga from non Name/TAO");

		try {
			await ethosgiga.whitelistBurnFrom(nameId1, 1000, { from: whitelistedAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, false, "Whitelisted address can burn EthosGiga more than owned balance");

		try {
			await ethosgiga.whitelistBurnFrom(nameId1, 50, { from: whitelistedAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, true, "Whitelisted address can't burn EthosGiga from Name");

		var nameBalance = await ethosgiga.balanceOf(nameId1);
		assert.equal(nameBalance.toNumber(), 930, "Name has incorrect ethosgiga balance");

		try {
			await ethosgiga.whitelistBurnFrom(taoId1, 50, { from: whitelistedAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, true, "Whitelisted address can't burn EthosGiga from TAO");

		var taoBalance = await ethosgiga.balanceOf(taoId1);
		assert.equal(taoBalance.toNumber(), 930, "TAO has incorrect ethosgiga balance");
	});
});
