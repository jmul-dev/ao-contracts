var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var Logos = artifacts.require("./Logos.sol");

contract("Logos", function(accounts) {
	var namefactory, taofactory, nametaoposition, logos, nameId1, nameId2, nameId3, nameId4, taoId1, taoId2, taoId3;
	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var account4 = accounts[4];
	var someAddress = accounts[5];
	var whitelistedAddress = accounts[6];

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
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

		var result = await namefactory.createName("echo", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account3
		});
		nameId3 = await namefactory.ethAddressToNameId(account3);

		var result = await namefactory.createName("foxtrot", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account4
		});
		nameId4 = await namefactory.ethAddressToNameId(account4);
	});

	it("should have the correct totalSupply", async function() {
		var totalSupply = await logos.totalSupply();
		assert.equal(totalSupply.toNumber(), 0, "Contract has incorrect totalSupply");
	});

	it("should have the correct name", async function() {
		var name = await logos.name();
		assert.equal(name, "Logos", "Contract has incorrect name");
	});

	it("should have the correct symbol", async function() {
		var symbol = await logos.symbol();
		assert.equal(symbol, "LOGOS", "Contract has incorrect symbol");
	});

	it("should have the correct powerOfTen", async function() {
		var powerOfTen = await logos.powerOfTen();
		assert.equal(powerOfTen.toNumber(), 0, "Contract has incorrect powerOfTen");
	});

	it("should have the correct decimals", async function() {
		var decimals = await logos.decimals();
		assert.equal(decimals.toNumber(), 0, "Contract has incorrect decimals");
	});

	it("should have the correct nameTAOPositionAddress", async function() {
		var nameTAOPositionAddress = await logos.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("The AO - should be able to transfer ownership to a TAO", async function() {
		// Mint Logos to nameId1 and nameId2
		await logos.setWhitelist(theAO, true, { from: theAO });
		await logos.mintToken(nameId1, 10 ** 12, { from: theAO });
		await logos.mintToken(nameId2, 10 ** 12, { from: theAO });

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

		var canTransferOwnership;
		try {
			await logos.transferOwnership(taoId1, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await logos.transferOwnership(taoId1, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await logos.theAO();
		assert.equal(newTheAO, taoId1, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await logos.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await logos.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await logos.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
	});

	it("The AO - should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await logos.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await logos.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await logos.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("Whitelisted Address - should be able to mint token to a TAO/Name", async function() {
		var canMintToken;
		try {
			await logos.mintToken(nameId3, 1000, { from: someAddress });
			canMintToken = true;
		} catch (e) {
			canMintToken = false;
		}
		assert.equal(canMintToken, false, "Non-whitelisted address can mint token");

		try {
			await logos.mintToken(someAddress, 1000, { from: whitelistedAddress });
			canMintToken = true;
		} catch (e) {
			canMintToken = false;
		}
		assert.equal(canMintToken, false, "Whitelisted address can mint token to non Name/TAO");

		try {
			await logos.mintToken(nameId3, 1000, { from: whitelistedAddress });
			canMintToken = true;
		} catch (e) {
			canMintToken = false;
		}
		assert.equal(canMintToken, true, "Whitelisted address can't mint token to Name");

		var nameBalance = await logos.balanceOf(nameId3);
		assert.equal(nameBalance.toNumber(), 1000, "Name has incorrect logos balance");

		try {
			await logos.mintToken(taoId1, 1000, { from: whitelistedAddress });
			canMintToken = true;
		} catch (e) {
			canMintToken = false;
		}
		assert.equal(canMintToken, true, "Whitelisted address can't mint token to TAO");

		var taoBalance = await logos.balanceOf(taoId1);
		assert.equal(taoBalance.toNumber(), 1000, "TAO has incorrect logos balance");
	});

	it("Whitelisted Address - should be able to transfer token from a Name/TAO to another Name/TAO", async function() {
		var canTransferFrom;
		try {
			await logos.transferFrom(nameId3, nameId4, 10, { from: someAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, false, "Non-whitelisted address can transfer token");

		try {
			await logos.transferFrom(nameId3, someAddress, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, false, "Whitelisted address can transfer token to non Name/TAO");

		try {
			await logos.transferFrom(nameId3, nameId4, 10000, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, false, "Whitelisted address can transfer token more than owned balance");

		try {
			await logos.transferFrom(nameId3, nameId4, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, true, "Whitelisted address can't transfer token from Name to Name");

		var nameId3Balance = await logos.balanceOf(nameId3);
		assert.equal(nameId3Balance.toNumber(), 990, "Name has incorrect logos balance");
		var nameId4Balance = await logos.balanceOf(nameId4);
		assert.equal(nameId4Balance.toNumber(), 10, "Name has incorrect logos balance");

		try {
			await logos.transferFrom(nameId3, taoId2, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, true, "Whitelisted address can't transfer token from Name to TAO");

		var nameId3Balance = await logos.balanceOf(nameId3);
		assert.equal(nameId3Balance.toNumber(), 980, "Name has incorrect logos balance");
		var taoId2Balance = await logos.balanceOf(taoId2);
		assert.equal(taoId2Balance.toNumber(), 10, "TAO has incorrect logos balance");

		try {
			await logos.transferFrom(taoId1, nameId4, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, true, "Whitelisted address can't transfer token from TAO to Name");

		var taoId1Balance = await logos.balanceOf(taoId1);
		assert.equal(taoId1Balance.toNumber(), 990, "TAO has incorrect logos balance");
		var nameId4Balance = await logos.balanceOf(nameId4);
		assert.equal(nameId4Balance.toNumber(), 20, "Name has incorrect logos balance");

		try {
			await logos.transferFrom(taoId1, taoId2, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, true, "Whitelisted address can't transfer token from TAO to TAO");

		var taoId1Balance = await logos.balanceOf(taoId1);
		assert.equal(taoId1Balance.toNumber(), 980, "TAO has incorrect logos balance");
		var taoId2Balance = await logos.balanceOf(taoId2);
		assert.equal(taoId2Balance.toNumber(), 20, "TAO has incorrect logos balance");
	});

	it("Whitelisted Address - should be able to burn token from a TAO/Name", async function() {
		var canWhitelistBurnFrom;
		try {
			await logos.whitelistBurnFrom(nameId3, 50, { from: someAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, false, "Non-whitelisted address can burn token");

		try {
			await logos.whitelistBurnFrom(someAddress, 50, { from: whitelistedAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, false, "Whitelisted address can burn token from non Name/TAO");

		try {
			await logos.whitelistBurnFrom(nameId3, 1000, { from: whitelistedAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, false, "Whitelisted address can burn token more than owned balance");

		try {
			await logos.whitelistBurnFrom(nameId3, 50, { from: whitelistedAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, true, "Whitelisted address can't burn token from Name");

		var nameBalance = await logos.balanceOf(nameId3);
		assert.equal(nameBalance.toNumber(), 930, "Name has incorrect logos balance");

		try {
			await logos.whitelistBurnFrom(taoId1, 50, { from: whitelistedAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, true, "Whitelisted address can't burn token from TAO");

		var taoBalance = await logos.balanceOf(taoId1);
		assert.equal(taoBalance.toNumber(), 930, "TAO has incorrect logos balance");
	});

	it("Name can position logos on other Name", async function() {
		var canPositionFrom;
		try {
			await logos.positionFrom(someAddress, nameId4, 10, { from: someAddress });
			canPositionFrom = true;
		} catch (e) {
			canPositionFrom = false;
		}
		assert.equal(canPositionFrom, false, "Non-Name can position Logos on other Name");

		try {
			await logos.positionFrom(nameId1, someAddress, 10, { from: account1 });
			canPositionFrom = true;
		} catch (e) {
			canPositionFrom = false;
		}
		assert.equal(canPositionFrom, false, "Name can position Logos on Non-Name");

		try {
			await logos.positionFrom(nameId1, nameId2, 10, { from: account2 });
			canPositionFrom = true;
		} catch (e) {
			canPositionFrom = false;
		}
		assert.equal(canPositionFrom, false, "Non-advocate of Name can position Logos on other Name");

		try {
			await logos.positionFrom(nameId1, nameId2, 10 ** 20, { from: account1 });
			canPositionFrom = true;
		} catch (e) {
			canPositionFrom = false;
		}
		assert.equal(canPositionFrom, false, "Advocate of Name can position more than owned Logos on other Name");

		var nameId1AvailableToPositionAmountBefore = await logos.availableToPositionAmount(nameId1);
		var nameId2SumBalanceBefore = await logos.sumBalanceOf(nameId2);

		try {
			await logos.positionFrom(nameId1, nameId2, 100, { from: account1 });
			canPositionFrom = true;
		} catch (e) {
			canPositionFrom = false;
		}
		assert.equal(canPositionFrom, true, "Advocate of Name can't position Logos on other Name");

		var nameId1AvailableToPositionAmountAfter = await logos.availableToPositionAmount(nameId1);
		var nameId2SumBalanceAfter = await logos.sumBalanceOf(nameId2);

		assert.equal(
			nameId1AvailableToPositionAmountAfter.toNumber(),
			nameId1AvailableToPositionAmountBefore.minus(100).toNumber(),
			"Name has incorrect available to position amount after positioning logos on other Name"
		);
		assert.equal(
			nameId2SumBalanceAfter.toNumber(),
			nameId2SumBalanceBefore.plus(100).toNumber(),
			"Name has incorrect sum balance after receiving position logos from other Name"
		);

		var positionFromOthers = await logos.positionFromOthers(nameId2);
		assert.equal(positionFromOthers.toNumber(), 100, "Contract returns incorrect positionFromOthers for a Name");

		var positionOnOthers = await logos.positionOnOthers(nameId1, nameId2);
		assert.equal(positionOnOthers.toNumber(), 100, "Contract returns incorrect positionOnOthers for a Name");

		var totalPositionOnOthers = await logos.totalPositionOnOthers(nameId1);
		assert.equal(totalPositionOnOthers.toNumber(), 100, "Contract returns incorrect totalPositionOnOthers for a Name");
	});

	it("Name can unposition logos from other Name", async function() {
		var canUnpositionFrom;
		try {
			await logos.unpositionFrom(someAddress, nameId4, 10, { from: someAddress });
			canUnpositionFrom = true;
		} catch (e) {
			canUnpositionFrom = false;
		}
		assert.equal(canUnpositionFrom, false, "Non-Name can unposition Logos from other Name");

		try {
			await logos.unpositionFrom(nameId1, someAddress, 10, { from: account1 });
			canUnpositionFrom = true;
		} catch (e) {
			canUnpositionFrom = false;
		}
		assert.equal(canUnpositionFrom, false, "Name can unposition Logos from Non-Name");

		try {
			await logos.unpositionFrom(nameId1, nameId2, 10, { from: account2 });
			canUnpositionFrom = true;
		} catch (e) {
			canUnpositionFrom = false;
		}
		assert.equal(canUnpositionFrom, false, "Non-advocate of Name can unposition Logos from other Name");

		try {
			await logos.unpositionFrom(nameId1, nameId2, 10 ** 20, { from: account1 });
			canUnpositionFrom = true;
		} catch (e) {
			canUnpositionFrom = false;
		}
		assert.equal(canUnpositionFrom, false, "Advocate of Name can unposition more than positioned Logos from other Name");

		var nameId1AvailableToPositionAmountBefore = await logos.availableToPositionAmount(nameId1);
		var nameId2SumBalanceBefore = await logos.sumBalanceOf(nameId2);

		try {
			await logos.unpositionFrom(nameId1, nameId2, 100, { from: account1 });
			canUnpositionFrom = true;
		} catch (e) {
			canUnpositionFrom = false;
		}
		assert.equal(canUnpositionFrom, true, "Advocate of Name can't unposition Logos from other Name");

		var nameId1AvailableToPositionAmountAfter = await logos.availableToPositionAmount(nameId1);
		var nameId2SumBalanceAfter = await logos.sumBalanceOf(nameId2);

		assert.equal(
			nameId1AvailableToPositionAmountAfter.toNumber(),
			nameId1AvailableToPositionAmountBefore.plus(100).toNumber(),
			"Name has incorrect available to position amount after unpositioning logos from other Name"
		);
		assert.equal(
			nameId2SumBalanceAfter.toNumber(),
			nameId2SumBalanceBefore.minus(100).toNumber(),
			"Name has incorrect sum balance after other Name unposition logos"
		);

		var positionFromOthers = await logos.positionFromOthers(nameId2);
		assert.equal(positionFromOthers.toNumber(), 0, "Contract returns incorrect positionFromOthers for a Name");

		var positionOnOthers = await logos.positionOnOthers(nameId1, nameId2);
		assert.equal(positionOnOthers.toNumber(), 0, "Contract returns incorrect positionOnOthers for a Name");

		var totalPositionOnOthers = await logos.totalPositionOnOthers(nameId1);
		assert.equal(totalPositionOnOthers.toNumber(), 0, "Contract returns incorrect totalPositionOnOthers for a Name");
	});

	it("Whitelisted Address - can add Logos for Advocate of a TAO", async function() {
		var canAddAdvocatedTAOLogos;
		try {
			await logos.addAdvocatedTAOLogos(taoId1, 10, { from: account1 });
			canAddAdvocatedTAOLogos = true;
		} catch (e) {
			canAddAdvocatedTAOLogos = false;
		}
		assert.equal(canAddAdvocatedTAOLogos, false, "Non-whitelisted address can add Logos for Advocate of a TAO");

		try {
			await logos.addAdvocatedTAOLogos(someAddress, 10, { from: whitelistedAddress });
			canAddAdvocatedTAOLogos = true;
		} catch (e) {
			canAddAdvocatedTAOLogos = false;
		}
		assert.equal(canAddAdvocatedTAOLogos, false, "Whitelisted address can add Logos for non-TAO");

		var nameId1SumBalanceBefore = await logos.sumBalanceOf(nameId1);
		try {
			await logos.addAdvocatedTAOLogos(taoId1, 10, { from: whitelistedAddress });
			canAddAdvocatedTAOLogos = true;
		} catch (e) {
			canAddAdvocatedTAOLogos = false;
		}
		assert.equal(canAddAdvocatedTAOLogos, true, "Whitelisted address can't add Logos for Advocate of a TAO");

		var nameId1SumBalanceAfter = await logos.sumBalanceOf(nameId1);
		assert.equal(
			nameId1SumBalanceAfter.toNumber(),
			nameId1SumBalanceBefore.plus(10).toNumber(),
			"Advocate of TAO has incorrect Logos after receiving advocated TAO Logos"
		);

		var advocatedTAOLogos = await logos.advocatedTAOLogos(nameId1, taoId1);
		assert.equal(advocatedTAOLogos.toNumber(), 10, "Contract returns incorrect advocated TAO Logos for a Name");

		var totalAdvocatedTAOLogos = await logos.totalAdvocatedTAOLogos(nameId1);
		assert.equal(totalAdvocatedTAOLogos.toNumber(), 10, "Contract returns incorrect total advocated TAO Logos for a Name");
	});

	it("Whitelisted Address - can transfer advocated TAO Logos from a Name to other Advocate a TAO", async function() {
		var canTransferAdvocatedTAOLogos;
		try {
			await logos.transferAdvocatedTAOLogos(nameId1, taoId1, { from: account1 });
			canTransferAdvocatedTAOLogos = true;
		} catch (e) {
			canTransferAdvocatedTAOLogos = false;
		}
		assert.equal(
			canTransferAdvocatedTAOLogos,
			false,
			"Non-whitelisted address can transfer Advocated TAO Logos from a Name to Advocate of a TAO"
		);

		try {
			await logos.transferAdvocatedTAOLogos(nameId1, someAddress, { from: whitelistedAddress });
			canTransferAdvocatedTAOLogos = true;
		} catch (e) {
			canTransferAdvocatedTAOLogos = false;
		}
		assert.equal(canTransferAdvocatedTAOLogos, false, "Whitelisted address can transfer Advocated TAO Logos to a non-TAO");

		try {
			await logos.transferAdvocatedTAOLogos(someAddress, taoId1, { from: whitelistedAddress });
			canTransferAdvocatedTAOLogos = true;
		} catch (e) {
			canTransferAdvocatedTAOLogos = false;
		}
		assert.equal(canTransferAdvocatedTAOLogos, false, "Whitelisted address can transfer Advocated TAO Logos from a non-Name");

		var nameId1SumBalanceBefore = await logos.sumBalanceOf(nameId1);
		var nameId2SumBalanceBefore = await logos.sumBalanceOf(nameId2);

		try {
			// Set new Advocate for taoId1 will actually trigger transferAdvocatedTAOLogos()
			await nametaoposition.setAdvocate(taoId1, nameId2, { from: account1 });
			canTransferAdvocatedTAOLogos = true;
		} catch (e) {
			canTransferAdvocatedTAOLogos = false;
		}
		assert.equal(
			canTransferAdvocatedTAOLogos,
			true,
			"Whitelisted address can't transfer Advocated TAO Logos from a Name to Advocate of a TAO"
		);

		var advocatedTAOLogos = await logos.advocatedTAOLogos(nameId1, taoId1);
		assert.equal(advocatedTAOLogos.toNumber(), 0, "Contract returns incorrect advocated TAO Logos for a Name");

		var totalAdvocatedTAOLogos = await logos.totalAdvocatedTAOLogos(nameId1);
		assert.equal(totalAdvocatedTAOLogos.toNumber(), 0, "Contract returns incorrect total advocated TAO Logos for a Name");

		var advocatedTAOLogos = await logos.advocatedTAOLogos(nameId2, taoId1);
		assert.equal(advocatedTAOLogos.toNumber(), 10, "Contract returns incorrect advocated TAO Logos for a Name");

		var totalAdvocatedTAOLogos = await logos.totalAdvocatedTAOLogos(nameId2);
		assert.equal(totalAdvocatedTAOLogos.toNumber(), 10, "Contract returns incorrect total advocated TAO Logos for a Name");

		var nameId1SumBalanceAfter = await logos.sumBalanceOf(nameId1);
		var nameId2SumBalanceAfter = await logos.sumBalanceOf(nameId2);

		assert.equal(
			nameId1SumBalanceAfter.toNumber(),
			nameId1SumBalanceBefore.minus(10).toNumber(),
			"Name has incorrect Logos after transferring advocated TAO Logos"
		);
		assert.equal(
			nameId2SumBalanceAfter.toNumber(),
			nameId2SumBalanceBefore.plus(10).toNumber(),
			"Advocate of TAO has incorrect Logos after receiving transferred advocated TAO Logos"
		);
	});
});