var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var Logos = artifacts.require("./Logos.sol");
var NameAccountRecovery = artifacts.require("./NameAccountRecovery.sol");
var AOSetting = artifacts.require("./AOSetting.sol");

var EthCrypto = require("eth-crypto");
var helper = require("./helpers/truffleTestHelper");
var BN = require("bn.js");

contract("Logos", function(accounts) {
	var namefactory,
		taofactory,
		nametaoposition,
		logos,
		nameaccountrecovery,
		aosetting,
		accountRecoveryLockDuration,
		nameId1,
		nameId2,
		nameId3,
		nameId4,
		taoId1,
		taoId2,
		taoId3;
	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var account4 = accounts[4];
	var someAddress = accounts[5];
	var whitelistedAddress = accounts[6];

	var nameId1LocalWriterKey = EthCrypto.createIdentity();
	var nameId2LocalWriterKey = EthCrypto.createIdentity();
	var nameId3LocalWriterKey = EthCrypto.createIdentity();
	var nameId4LocalWriterKey = EthCrypto.createIdentity();

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		logos = await Logos.deployed();
		nameaccountrecovery = await NameAccountRecovery.deployed();
		aosetting = await AOSetting.deployed();

		var settingTAOId = await nameaccountrecovery.settingTAOId();

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "accountRecoveryLockDuration");
		accountRecoveryLockDuration = settingValues[0];

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

		var result = await namefactory.createName(
			"echo",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			web3.utils.toHex("somecontentid"),
			nameId3LocalWriterKey.address,
			{
				from: account3
			}
		);
		nameId3 = await namefactory.ethAddressToNameId(account3);

		var result = await namefactory.createName(
			"foxtrot",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			web3.utils.toHex("somecontentid"),
			nameId4LocalWriterKey.address,
			{
				from: account4
			}
		);
		nameId4 = await namefactory.ethAddressToNameId(account4);

		await nametaoposition.setListener(nameId1, nameId2, { from: account1 });
		await nametaoposition.setListener(nameId2, nameId3, { from: account2 });
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

	it("The AO - transferOwnership() should be able to transfer ownership to a TAO", async function() {
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

	it("The AO - setWhitelist() should be able to whitelist an address", async function() {
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

	it("The AO - setNameFactoryAddress() should be able to set NameFactory address", async function() {
		var canSetAddress;
		try {
			await logos.setNameFactoryAddress(namefactory.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameFactory address");

		try {
			await logos.setNameFactoryAddress(namefactory.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameFactory address");

		var nameFactoryAddress = await logos.nameFactoryAddress();
		assert.equal(nameFactoryAddress, namefactory.address, "Contract has incorrect nameFactoryAddress");
	});

	it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
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

	it("The AO - setNameAccountRecoveryAddress() should be able to set NameAccountRecovery address", async function() {
		var canSetAddress;
		try {
			await logos.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameAccountRecovery address");

		try {
			await logos.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameAccountRecovery address");

		var nameAccountRecoveryAddress = await logos.nameAccountRecoveryAddress();
		assert.equal(nameAccountRecoveryAddress, nameaccountrecovery.address, "Contract has incorrect nameAccountRecoveryAddress");
	});

	it("Whitelisted Address - should be able to mint Logos to a TAO/Name", async function() {
		var canMint;
		try {
			await logos.mint(nameId3, 1000, { from: someAddress });
			canMint = true;
		} catch (e) {
			canMint = false;
		}
		assert.equal(canMint, false, "Non-whitelisted address can mint Logos");

		try {
			await logos.mint(someAddress, 1000, { from: whitelistedAddress });
			canMint = true;
		} catch (e) {
			canMint = false;
		}
		assert.equal(canMint, false, "Whitelisted address can mint Logos to non Name/TAO");

		try {
			await logos.mint(nameId3, 1000, { from: whitelistedAddress });
			canMint = true;
		} catch (e) {
			canMint = false;
		}
		assert.equal(canMint, true, "Whitelisted address can't mint Logos to Name");

		var nameBalance = await logos.balanceOf(nameId3);
		assert.equal(nameBalance.toNumber(), 1000, "Name has incorrect logos balance");

		try {
			await logos.mint(taoId1, 1000, { from: whitelistedAddress });
			canMint = true;
		} catch (e) {
			canMint = false;
		}
		assert.equal(canMint, true, "Whitelisted address can't mint Logos to TAO");

		var taoBalance = await logos.balanceOf(taoId1);
		assert.equal(taoBalance.toNumber(), 1000, "TAO has incorrect logos balance");
	});

	it("Whitelisted Address - should be able to transfer Logos from a Name/TAO to another Name/TAO", async function() {
		var canTransferFrom;
		try {
			await logos.transferFrom(nameId3, nameId4, 10, { from: someAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, false, "Non-whitelisted address can transfer Logos");

		try {
			await logos.transferFrom(nameId3, someAddress, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, false, "Whitelisted address can transfer Logos to non Name/TAO");

		try {
			await logos.transferFrom(nameId3, nameId4, 10000, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, false, "Whitelisted address can transfer Logos more than owned balance");

		try {
			await logos.transferFrom(nameId3, nameId4, 10, { from: whitelistedAddress });
			canTransferFrom = true;
		} catch (e) {
			canTransferFrom = false;
		}
		assert.equal(canTransferFrom, true, "Whitelisted address can't transfer Logos from Name to Name");

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
		assert.equal(canTransferFrom, true, "Whitelisted address can't transfer Logos from Name to TAO");

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
		assert.equal(canTransferFrom, true, "Whitelisted address can't transfer Logos from TAO to Name");

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
		assert.equal(canTransferFrom, true, "Whitelisted address can't transfer Logos from TAO to TAO");

		var taoId1Balance = await logos.balanceOf(taoId1);
		assert.equal(taoId1Balance.toNumber(), 980, "TAO has incorrect logos balance");
		var taoId2Balance = await logos.balanceOf(taoId2);
		assert.equal(taoId2Balance.toNumber(), 20, "TAO has incorrect logos balance");
	});

	it("Whitelisted Address - should be able to burn Logos from a TAO/Name", async function() {
		var canWhitelistBurnFrom;
		try {
			await logos.whitelistBurnFrom(nameId3, 50, { from: someAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, false, "Non-whitelisted address can burn Logos");

		try {
			await logos.whitelistBurnFrom(someAddress, 50, { from: whitelistedAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, false, "Whitelisted address can burn Logos from non Name/TAO");

		try {
			await logos.whitelistBurnFrom(nameId3, 1000, { from: whitelistedAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, false, "Whitelisted address can burn Logos more than owned balance");

		try {
			await logos.whitelistBurnFrom(nameId3, 50, { from: whitelistedAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, true, "Whitelisted address can't burn Logos from Name");

		var nameBalance = await logos.balanceOf(nameId3);
		assert.equal(nameBalance.toNumber(), 930, "Name has incorrect logos balance");

		try {
			await logos.whitelistBurnFrom(taoId1, 50, { from: whitelistedAddress });
			canWhitelistBurnFrom = true;
		} catch (e) {
			canWhitelistBurnFrom = false;
		}
		assert.equal(canWhitelistBurnFrom, true, "Whitelisted address can't burn Logos from TAO");

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

		// Listener submit account recovery for nameId1
		await nameaccountrecovery.submitAccountRecovery(nameId1, { from: account2 });

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		try {
			await logos.positionFrom(nameId1, nameId2, 100, { from: account1 });
			canPositionFrom = true;
		} catch (e) {
			canPositionFrom = false;
		}
		assert.equal(canPositionFrom, false, "Advocate of Name can position Logos on other Name even though the from Name is compromised");

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

		// Listener submit account recovery for nameId2
		await nameaccountrecovery.submitAccountRecovery(nameId2, { from: account3 });

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		try {
			await logos.positionFrom(nameId1, nameId2, 100, { from: account1 });
			canPositionFrom = true;
		} catch (e) {
			canPositionFrom = false;
		}
		assert.equal(canPositionFrom, false, "Advocate of Name can position Logos on other Name even though the to Name is compromised");

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

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
			nameId1AvailableToPositionAmountBefore.sub(new BN(100)).toNumber(),
			"Name has incorrect available to position amount after positioning logos on other Name"
		);
		assert.equal(
			nameId2SumBalanceAfter.toNumber(),
			nameId2SumBalanceBefore.add(new BN(100)).toNumber(),
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

		// Listener submit account recovery for nameId1
		await nameaccountrecovery.submitAccountRecovery(nameId1, { from: account2 });

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		try {
			await logos.unpositionFrom(nameId1, nameId2, 100, { from: account1 });
			canUnpositionFrom = true;
		} catch (e) {
			canUnpositionFrom = false;
		}
		assert.equal(
			canUnpositionFrom,
			false,
			"Advocate of Name can unposition Logos on other Name even though the from Name is compromised"
		);

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

		// Listener submit account recovery for nameId2
		await nameaccountrecovery.submitAccountRecovery(nameId2, { from: account3 });

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		try {
			await logos.unpositionFrom(nameId1, nameId2, 100, { from: account1 });
			canUnpositionFrom = true;
		} catch (e) {
			canUnpositionFrom = false;
		}
		assert.equal(
			canUnpositionFrom,
			false,
			"Advocate of Name can unposition Logos on other Name even though the to Name is compromised"
		);

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

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
			nameId1AvailableToPositionAmountBefore.add(new BN(100)).toNumber(),
			"Name has incorrect available to position amount after unpositioning logos from other Name"
		);
		assert.equal(
			nameId2SumBalanceAfter.toNumber(),
			nameId2SumBalanceBefore.sub(new BN(100)).toNumber(),
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
			nameId1SumBalanceBefore.add(new BN(10)).toNumber(),
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
			nameId1SumBalanceBefore.sub(new BN(10)).toNumber(),
			"Name has incorrect Logos after transferring advocated TAO Logos"
		);
		assert.equal(
			nameId2SumBalanceAfter.toNumber(),
			nameId2SumBalanceBefore.add(new BN(10)).toNumber(),
			"Advocate of TAO has incorrect Logos after receiving transferred advocated TAO Logos"
		);
	});
});
