var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var Logos = artifacts.require("./Logos.sol");

var Voice = artifacts.require("./Voice.sol");

contract("Voice", function(accounts) {
	var namefactory, taofactory, nametaoposition, logos, nameId1, nameId2, taoId1, voice;

	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var someAddress = accounts[3];
	var whitelistedAddress = accounts[4];

	var maxSupplyPerName;
	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		logos = await Logos.deployed();
		voice = await Voice.deployed();

		// Create Name
		var result = await namefactory.createName("charlie", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account1
		});
		nameId1 = await namefactory.ethAddressToNameId(account1);

		// Mint Logos to nameId
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
	it("should return correct name", async function() {
		var name = await voice.name();
		assert.equal(name, "Voice", "Contract has incorrect name");
	});

	it("should return correct symbol", async function() {
		var symbol = await voice.symbol();
		assert.equal(symbol, "VOICE", "Contract has incorrect symbol");
	});

	it("should return correct decimals", async function() {
		var decimals = await voice.decimals();
		assert.equal(decimals.toNumber(), 4, "Contract has incorrect decimals");
	});

	it("should return correct MAX_SUPPLY_PER_NAME", async function() {
		maxSupplyPerName = await voice.MAX_SUPPLY_PER_NAME();
		assert.equal(maxSupplyPerName.toNumber(), 100 * 10 ** 4, "Contract has incorrect MAX_SUPPLY_PER_NAME");
	});

	it("The AO - transferOwnership() - should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await voice.transferOwnership(taoId1, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await voice.transferOwnership(taoId1, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await voice.theAO();
		assert.equal(newTheAO, taoId1, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - setWhitelist() should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await voice.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await voice.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await voice.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
	});

	it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await voice.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await voice.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await voice.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("mint() - only whitelisted address can mint", async function() {
		var canMint;
		try {
			await voice.mint(someAddress, { from: whitelistedAddress });
			canMint = true;
		} catch (e) {
			canMint = false;
		}
		assert.equal(canMint, false, "Whitelisted address can mint Voice to non-Name");

		var totalSupplyBefore = await voice.totalSupply();

		// Create Name
		var result = await namefactory.createName("delta", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account2
		});
		nameId2 = await namefactory.ethAddressToNameId(account2);

		var totalSupplyAfter = await voice.totalSupply();
		assert.equal(totalSupplyAfter.toNumber(), totalSupplyBefore.plus(maxSupplyPerName).toNumber(), "Voice has incorrect totalSupply");

		var nameBalance = await voice.balanceOf(nameId2);
		assert.equal(nameBalance.toNumber(), maxSupplyPerName.toNumber(), "Name has incorrect balance");

		var hasReceived = await voice.hasReceived(nameId2);
		assert.equal(hasReceived, true, "Contract has incorrect hasReceived value");

		try {
			await voice.mint(nameId2, { from: whitelistedAddress });
			canMint = true;
		} catch (e) {
			canMint = false;
		}
		assert.equal(canMint, false, "Whitelisted address can mint Voice to Name more than once");
	});

	it("Whitelisted address - stake() should be able to stake Name's Voice on a TAO", async function() {
		var canStake;
		try {
			await voice.stake(nameId1, taoId1, 800000, { from: someAddress });
			canStake = true;
		} catch (e) {
			canStake = false;
		}
		assert.equal(canStake, false, "Non-whitelisted address can stake Voice on behalf of nameId");

		try {
			await voice.stake(someAddress, taoId1, 800000, { from: whitelistedAddress });
			canStake = true;
		} catch (e) {
			canStake = false;
		}
		assert.equal(canStake, false, "Whitelisted address can stake Voice on behalf a non-Name ");

		try {
			await voice.stake(nameId1, someAddress, 800000, { from: whitelistedAddress });
			canStake = true;
		} catch (e) {
			canStake = false;
		}
		assert.equal(canStake, false, "Whitelisted address can stake Voice on a non-TAO");

		try {
			await voice.stake(nameId1, taoId1, 10 ** 10, { from: whitelistedAddress });
			canStake = true;
		} catch (e) {
			canStake = false;
		}
		assert.equal(canStake, false, "Whitelisted address can stake Voice more than MAX_SUPPLY_PER_NAME (100%)");

		var nameBalanceBefore = await voice.balanceOf(nameId1);
		var taoBalanceBefore = await voice.balanceOf(taoId1);
		var taoStakedBalanceBefore = await voice.taoStakedBalance(nameId1, taoId1);
		var nameStakedBalanceBefore = await voice.stakedBalance(nameId1);
		try {
			await voice.stake(nameId1, taoId1, 800000, { from: whitelistedAddress });
			canStake = true;
		} catch (e) {
			canStake = false;
		}
		assert.equal(canStake, true, "Whitelisted address can't stake Voice on a TAO for a Name");

		var nameBalanceAfter = await voice.balanceOf(nameId1);
		var taoBalanceAfter = await voice.balanceOf(taoId1);
		var taoStakedBalanceAfter = await voice.taoStakedBalance(nameId1, taoId1);
		var nameStakedBalanceAfter = await voice.stakedBalance(nameId1);

		assert.equal(nameBalanceAfter.toNumber(), nameBalanceBefore.minus(800000).toNumber(), "Name has incorrect balance");
		assert.equal(taoBalanceAfter.toNumber(), taoBalanceBefore.plus(800000).toNumber(), "TAO has incorrect balance");
		assert.equal(
			taoStakedBalanceAfter.toNumber(),
			taoStakedBalanceBefore.plus(800000).toNumber(),
			"taoStakedBalance has incorrect balance"
		);
		assert.equal(
			nameStakedBalanceAfter.toNumber(),
			nameStakedBalanceBefore.plus(800000).toNumber(),
			"stakedBalance() has incorrect balance"
		);

		try {
			await voice.stake(nameId1, taoId1, 300000, { from: whitelistedAddress });
			canStake = true;
		} catch (e) {
			canStake = false;
		}
		assert.equal(canStake, false, "Whitelisted address can stake Voice more than Name's available balance");
	});

	it("Whitelisted address - unstake() should be able to unstake Name's Voice from a TAO", async function() {
		var canUnstake;
		try {
			await voice.unstake(nameId1, taoId1, 200000, { from: someAddress });
			canUnstake = true;
		} catch (e) {
			canUnstake = false;
		}
		assert.notEqual(canUnstake, true, "Non-whitelisted address can unstake Voice on behalf of nameId");

		try {
			await voice.unstake(someAddress, taoId1, 800000, { from: whitelistedAddress });
			canUnstake = true;
		} catch (e) {
			canUnstake = false;
		}
		assert.equal(canUnstake, false, "Whitelisted address can unstake Voice on behalf a non-Name ");

		try {
			await voice.unstake(nameId1, someAddress, 800000, { from: whitelistedAddress });
			canUnstake = true;
		} catch (e) {
			canUnstake = false;
		}
		assert.equal(canUnstake, false, "Whitelisted address can unstake Voice from a non-TAO");

		try {
			await voice.unstake(nameId1, taoId1, 900000, { from: whitelistedAddress });
			canUnstake = true;
		} catch (e) {
			canUnstake = false;
		}
		assert.equal(canUnstake, false, "Whitelisted address can unstake Voice from a TAO more than its staked balance");

		var nameBalanceBefore = await voice.balanceOf(nameId1);
		var taoBalanceBefore = await voice.balanceOf(taoId1);
		var taoStakedBalanceBefore = await voice.taoStakedBalance(nameId1, taoId1);
		var nameStakedBalanceBefore = await voice.stakedBalance(nameId1);
		try {
			await voice.unstake(nameId1, taoId1, 600000, { from: whitelistedAddress });
			canUnstake = true;
		} catch (e) {
			canUnstake = false;
		}
		assert.equal(canUnstake, true, "Whitelisted address can't unstake Voice from a TAO for a Name");

		var nameBalanceAfter = await voice.balanceOf(nameId1);
		var taoBalanceAfter = await voice.balanceOf(taoId1);
		var taoStakedBalanceAfter = await voice.taoStakedBalance(nameId1, taoId1);
		var nameStakedBalanceAfter = await voice.stakedBalance(nameId1);

		assert.equal(nameBalanceAfter.toNumber(), nameBalanceBefore.plus(600000).toNumber(), "Name has incorrect balance");
		assert.equal(taoBalanceAfter.toNumber(), taoBalanceBefore.minus(600000).toNumber(), "TAO has incorrect balance");
		assert.equal(
			taoStakedBalanceAfter.toNumber(),
			taoStakedBalanceBefore.minus(600000).toNumber(),
			"taoStakedBalance has incorrect balance"
		);
		assert.equal(
			nameStakedBalanceAfter.toNumber(),
			nameStakedBalanceBefore.minus(600000).toNumber(),
			"stakedBalance() has incorrect balance"
		);

		try {
			await voice.unstake(nameId1, taoId1, 300000, { from: whitelistedAddress });
			canUnstake = true;
		} catch (e) {
			canUnstake = false;
		}
		assert.equal(canUnstake, false, "Whitelisted address can unstake Voice from a TAO for a Name more than its staked balance");
	});
});
