var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var Logos = artifacts.require("./Logos.sol");

var NameTAOVault = artifacts.require("./NameTAOVault.sol");
var AOIon = artifacts.require("./AOIon.sol");
var TokenOne = artifacts.require("./TokenOne.sol");

var BigNumber = require("bignumber.js");
var EthCrypto = require("eth-crypto");

BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: 1, EXPONENTIAL_AT: [-10, 40] }); // no rounding

contract("NameTAOVault", function(accounts) {
	var namefactory, taofactory, nametaoposition, logos, nameId1, nameId2, taoId1, taoId2, nametaovault, aoion, tokenone;

	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var someAddress = accounts[3];
	var accountWithBalance = accounts[4];
	var whitelistedAddress = accounts[5];
	var recipient = EthCrypto.createIdentity();
	var emptyAddress = "0x0000000000000000000000000000000000000000";

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		logos = await Logos.deployed();
		nametaovault = await NameTAOVault.deployed();
		aoion = await AOIon.deployed();
		tokenone = await TokenOne.deployed();

		// Create Name
		var result = await namefactory.createName("charlie", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account1
		});
		nameId1 = await namefactory.ethAddressToNameId(account1);

		result = await namefactory.createName("delta", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account2
		});
		nameId2 = await namefactory.ethAddressToNameId(account2);

		// Mint Logos to nameId
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

		await aoion.setWhitelist(theAO, true, { from: theAO });
		await aoion.mint(accountWithBalance, 10 ** 9, { from: theAO }); // 1,000,000,000 AO ION
		var buyPrice = await aoion.primordialBuyPrice();
		await aoion.buyPrimordial({ from: accountWithBalance, value: buyPrice.times(1000).toNumber() }); // Buy 1000 AO+
	});

	it("The AO - transferOwnership() - should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await nametaovault.transferOwnership(taoId1, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await nametaovault.transferOwnership(taoId1, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await nametaovault.theAO();
		assert.equal(newTheAO, taoId1, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - setWhitelist() should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await nametaovault.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await nametaovault.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await nametaovault.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
	});

	it("The AO - setNameFactoryAddress() should be able to set NameFactory address", async function() {
		var canSetAddress;
		try {
			await nametaovault.setNameFactoryAddress(namefactory.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameFactory address");

		try {
			await nametaovault.setNameFactoryAddress(namefactory.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameFactory address");

		var nameFactoryAddress = await nametaovault.nameFactoryAddress();
		assert.equal(nameFactoryAddress, namefactory.address, "Contract has incorrect nameFactoryAddress");
	});

	it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await nametaovault.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await nametaovault.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await nametaovault.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("The AO - setAOIonAddress() should be able to set AOIon address", async function() {
		var canSetAddress;
		try {
			await nametaovault.setAOIonAddress(aoion.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOIon address");

		try {
			await nametaovault.setAOIonAddress(aoion.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOIon address");

		var aoIonAddress = await nametaovault.aoIonAddress();
		assert.equal(aoIonAddress, aoion.address, "Contract has incorrect aoIonAddress");
	});

	it("ethBalanceOf() - should be able to get the ETH balance of a Name/TAO", async function() {
		var canGetEthBalance;
		try {
			await nametaovault.ethBalanceOf(someAddress);
			canGetEthBalance = true;
		} catch (e) {
			canGetEthBalance = false;
		}
		assert.equal(canGetEthBalance, false, "Can get ETH balance of non-Name/TAO");

		var ethBalanceBefore = await nametaovault.ethBalanceOf(nameId2);
		var canSendEth;
		try {
			await web3.eth.sendTransaction({ from: accountWithBalance, to: nameId2, value: web3.toWei(1, "ether") });
			canSendEth = true;
		} catch (e) {
			canSendEth = false;
		}
		assert.equal(canSendEth, true, "Can't send ETH to a Name");

		var ethBalanceAfter = await nametaovault.ethBalanceOf(nameId2);
		assert.equal(
			ethBalanceAfter.toNumber(),
			ethBalanceBefore.plus(web3.toWei(1, "ether")).toNumber(),
			"Name has incorrect ETH balance"
		);

		ethBalanceBefore = await nametaovault.ethBalanceOf(taoId2);
		try {
			await web3.eth.sendTransaction({ from: accountWithBalance, to: taoId2, value: web3.toWei(1, "ether") });
			canSendEth = true;
		} catch (e) {
			canSendEth = false;
		}
		assert.equal(canSendEth, true, "Can't send ETH to a TAO");

		ethBalanceAfter = await nametaovault.ethBalanceOf(taoId2);
		assert.equal(ethBalanceAfter.toNumber(), ethBalanceBefore.plus(web3.toWei(1, "ether")).toNumber(), "TAO has incorrect ETH balance");
	});

	it("erc20BalanceOf() - should be able to get the ERC20 Token balance of a Name/TAO", async function() {
		var canGetERC20Balance;
		try {
			await nametaovault.erc20BalanceOf(tokenone.address, someAddress);
			canGetERC20Balance = true;
		} catch (e) {
			canGetERC20Balance = false;
		}
		assert.equal(canGetERC20Balance, false, "Can get ERC20 Token balance of non-Name/TAO");

		var erc20BalanceBefore = await nametaovault.erc20BalanceOf(tokenone.address, nameId2);

		await tokenone.transfer(nameId2, web3.toWei(1, "ether"), { from: theAO });

		var erc20BalanceAfter = await nametaovault.erc20BalanceOf(tokenone.address, nameId2);
		assert.equal(
			erc20BalanceAfter.toNumber(),
			erc20BalanceBefore.plus(web3.toWei(1, "ether")).toNumber(),
			"Name has incorrect ERC20 Token balance"
		);

		erc20BalanceBefore = await nametaovault.erc20BalanceOf(tokenone.address, taoId2);

		await tokenone.transfer(taoId2, web3.toWei(1, "ether"), { from: theAO });

		erc20BalanceAfter = await nametaovault.erc20BalanceOf(tokenone.address, taoId2);
		assert.equal(
			erc20BalanceAfter.toNumber(),
			erc20BalanceBefore.plus(web3.toWei(1, "ether")).toNumber(),
			"TAO has incorrect ERC20 Token balance"
		);
	});

	it("AOBalanceOf() - should be able to get the AO Ion balance of a Name/TAO", async function() {
		var canGetAOBalance;
		try {
			await nametaovault.AOBalanceOf(someAddress);
			canGetAOBalance = true;
		} catch (e) {
			canGetAOBalance = false;
		}
		assert.equal(canGetAOBalance, false, "Can get AO Ion balance of non-Name/TAO");

		var AOBalanceBefore = await nametaovault.AOBalanceOf(nameId2);

		await aoion.transfer(nameId2, 1000, { from: accountWithBalance });

		var AOBalanceAfter = await nametaovault.AOBalanceOf(nameId2);
		assert.equal(AOBalanceAfter.toNumber(), AOBalanceBefore.plus(1000).toNumber(), "Name has incorrect AO Ion balance");

		AOBalanceBefore = await nametaovault.AOBalanceOf(taoId2);

		await aoion.transfer(taoId2, 1000, { from: accountWithBalance });

		AOBalanceAfter = await nametaovault.AOBalanceOf(taoId2);
		assert.equal(AOBalanceAfter.toNumber(), AOBalanceBefore.plus(1000).toNumber(), "TAO has incorrect AO Ion balance");
	});

	it("primordialAOBalanceOf() - should be able to get the primordial AO+ Ion balance of a Name/TAO", async function() {
		var canGetPrimordialAOBalance;
		try {
			await nametaovault.primordialAOBalanceOf(someAddress);
			canGetPrimordialAOBalance = true;
		} catch (e) {
			canGetPrimordialAOBalance = false;
		}
		assert.equal(canGetPrimordialAOBalance, false, "Can get primordial AO+ Ion balance of non-Name/TAO");

		var primordialAOBalanceBefore = await nametaovault.primordialAOBalanceOf(nameId2);

		await aoion.transferPrimordial(nameId2, 100, { from: accountWithBalance });

		var primordialAOBalanceAfter = await nametaovault.primordialAOBalanceOf(nameId2);
		assert.equal(
			primordialAOBalanceAfter.toNumber(),
			primordialAOBalanceBefore.plus(100).toNumber(),
			"Name has incorrect primordial AO+ Ion balance"
		);

		primordialAOBalanceBefore = await nametaovault.primordialAOBalanceOf(taoId2);

		await aoion.transferPrimordial(taoId2, 100, { from: accountWithBalance });

		primordialAOBalanceAfter = await nametaovault.primordialAOBalanceOf(taoId2);
		assert.equal(
			primordialAOBalanceAfter.toNumber(),
			primordialAOBalanceBefore.plus(100).toNumber(),
			"TAO has incorrect primordial AO+ Ion balance"
		);
	});

	it("transferEth() - only Advocate of Name/TAO can transfer ETH to an address", async function() {
		var canTransfer;
		try {
			await nametaovault.transferEth(someAddress, recipient.address, web3.toWei(0.1, "ether"), { from: account2 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Can transfer ETH from non-Name/TAO");

		try {
			await nametaovault.transferEth(nameId1, recipient.address, web3.toWei(0.1, "ether"), { from: account1 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Advocate of Name can transfer ETH from Name with no balance");

		try {
			await nametaovault.transferEth(nameId2, emptyAddress, web3.toWei(0.1, "ether"), { from: account2 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Advocate of Name can transfer ETH to invalid address");

		try {
			await nametaovault.transferEth(nameId2, recipient.address, web3.toWei(10, "ether"), { from: account2 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Advocate of Name can transfer ETH more than its owned balance");

		try {
			await nametaovault.transferEth(nameId2, recipient.address, web3.toWei(0.1, "ether"), { from: account1 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Non-advocate of Name can transfer ETH");

		var senderBalanceBefore = await nametaovault.ethBalanceOf(nameId2);
		var recipientBalanceBefore = await web3.eth.getBalance(recipient.address);
		try {
			await nametaovault.transferEth(nameId2, recipient.address, web3.toWei(0.1, "ether"), { from: account2 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, true, "Advocate of Name can't transfer ETH from Name");

		var senderBalanceAfter = await nametaovault.ethBalanceOf(nameId2);
		var recipientBalanceAfter = await web3.eth.getBalance(recipient.address);

		assert.equal(
			senderBalanceAfter.toNumber(),
			senderBalanceBefore.minus(web3.toWei(0.1, "ether")).toNumber(),
			"Sender has incorrect balance"
		);
		assert.equal(
			recipientBalanceAfter.toNumber(),
			recipientBalanceBefore.plus(web3.toWei(0.1, "ether")).toNumber(),
			"Recipient has incorrect balance"
		);

		senderBalanceBefore = await nametaovault.ethBalanceOf(taoId2);
		recipientBalanceBefore = await web3.eth.getBalance(recipient.address);
		try {
			await nametaovault.transferEth(taoId2, recipient.address, web3.toWei(0.1, "ether"), { from: account2 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, true, "Advocate of TAO can't transfer ETH from TAO");

		senderBalanceAfter = await nametaovault.ethBalanceOf(taoId2);
		recipientBalanceAfter = await web3.eth.getBalance(recipient.address);

		assert.equal(
			senderBalanceAfter.toNumber(),
			senderBalanceBefore.minus(web3.toWei(0.1, "ether")).toNumber(),
			"Sender has incorrect balance"
		);
		assert.equal(
			recipientBalanceAfter.toNumber(),
			recipientBalanceBefore.plus(web3.toWei(0.1, "ether")).toNumber(),
			"Recipient has incorrect balance"
		);
	});

	it("transferERC20() - only Advocate of Name/TAO can transfer ERC20 Token to an address", async function() {
		var canTransfer;
		try {
			await nametaovault.transferERC20(tokenone.address, someAddress, recipient.address, web3.toWei(0.1, "ether"), {
				from: account2
			});
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Can transfer ERC20 Token from non-Name/TAO");

		try {
			await nametaovault.transferERC20(someAddress, nameId2, recipient.address, web3.toWei(0.1, "ether"), { from: account2 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Advocate can transfer invalid ERC20 Token");

		try {
			await nametaovault.transferERC20(tokenone.address, nameId1, recipient.address, web3.toWei(0.1, "ether"), { from: account1 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Advocate of Name can transfer ERC20 Token from Name with no balance");

		try {
			await nametaovault.transferERC20(tokenone.address, nameId2, emptyAddress, web3.toWei(0.1, "ether"), { from: account2 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Advocate of Name can transfer ERC20 Token to invalid address");

		try {
			await nametaovault.transferERC20(tokenone.address, nameId2, recipient.address, web3.toWei(10, "ether"), { from: account2 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Advocate of Name can transfer ERC20 Token more than its owned balance");

		try {
			await nametaovault.transferERC20(tokenone.address, nameId2, recipient.address, web3.toWei(0.1, "ether"), { from: account1 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Non-advocate of Name can transfer ERC20 Token");

		var senderBalanceBefore = await nametaovault.erc20BalanceOf(tokenone.address, nameId2);
		var recipientBalanceBefore = await tokenone.balanceOf(recipient.address);
		try {
			await nametaovault.transferERC20(tokenone.address, nameId2, recipient.address, web3.toWei(0.1, "ether"), { from: account2 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, true, "Advocate of Name can't transfer ERC20 Token from Name");

		var senderBalanceAfter = await nametaovault.erc20BalanceOf(tokenone.address, nameId2);
		var recipientBalanceAfter = await tokenone.balanceOf(recipient.address);

		assert.equal(
			senderBalanceAfter.toNumber(),
			senderBalanceBefore.minus(web3.toWei(0.1, "ether")).toNumber(),
			"Sender has incorrect balance"
		);
		assert.equal(
			recipientBalanceAfter.toNumber(),
			recipientBalanceBefore.plus(web3.toWei(0.1, "ether")).toNumber(),
			"Recipient has incorrect balance"
		);

		senderBalanceBefore = await nametaovault.erc20BalanceOf(tokenone.address, taoId2);
		recipientBalanceBefore = await tokenone.balanceOf(recipient.address);
		try {
			await nametaovault.transferERC20(tokenone.address, taoId2, recipient.address, web3.toWei(0.1, "ether"), { from: account2 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, true, "Advocate of TAO can't transfer ERC20 Token from TAO");

		senderBalanceAfter = await nametaovault.erc20BalanceOf(tokenone.address, taoId2);
		recipientBalanceAfter = await tokenone.balanceOf(recipient.address);

		assert.equal(
			senderBalanceAfter.toNumber(),
			senderBalanceBefore.minus(web3.toWei(0.1, "ether")).toNumber(),
			"Sender has incorrect balance"
		);
		assert.equal(
			recipientBalanceAfter.toNumber(),
			recipientBalanceBefore.plus(web3.toWei(0.1, "ether")).toNumber(),
			"Recipient has incorrect balance"
		);
	});

	it("transferAO() - only Advocate of Name/TAO can transfer AO Ion to an address", async function() {
		var canTransfer;
		try {
			await nametaovault.transferAO(someAddress, recipient.address, 10, { from: account2 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Can transfer AO Ion from non-Name/TAO");

		try {
			await nametaovault.transferAO(nameId1, recipient.address, 10, { from: account1 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Advocate of Name can transfer AO Ion from Name with no balance");

		try {
			await nametaovault.transferAO(nameId2, emptyAddress, 10, { from: account2 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Advocate of Name can transfer AO Ion to invalid address");

		try {
			await nametaovault.transferAO(nameId2, recipient.address, 10 ** 10, { from: account2 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Advocate of Name can transfer AO Ion more than its owned balance");

		try {
			await nametaovault.transferAO(nameId2, recipient.address, 10, { from: account1 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Non-advocate of Name can transfer AO Ion");

		var senderBalanceBefore = await nametaovault.AOBalanceOf(nameId2);
		var recipientBalanceBefore = await aoion.balanceOf(recipient.address);
		try {
			await nametaovault.transferAO(nameId2, recipient.address, 10, { from: account2 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, true, "Advocate of Name can't transfer AO Ion from Name");

		var senderBalanceAfter = await nametaovault.AOBalanceOf(nameId2);
		var recipientBalanceAfter = await aoion.balanceOf(recipient.address);

		assert.equal(senderBalanceAfter.toNumber(), senderBalanceBefore.minus(10).toNumber(), "Sender has incorrect balance");
		assert.equal(recipientBalanceAfter.toNumber(), recipientBalanceBefore.plus(10).toNumber(), "Recipient has incorrect balance");

		senderBalanceBefore = await nametaovault.AOBalanceOf(taoId2);
		recipientBalanceBefore = await aoion.balanceOf(recipient.address);
		try {
			await nametaovault.transferAO(taoId2, recipient.address, 10, { from: account2 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, true, "Advocate of TAO can't transfer AO Ion from TAO");

		senderBalanceAfter = await nametaovault.AOBalanceOf(taoId2);
		recipientBalanceAfter = await aoion.balanceOf(recipient.address);

		assert.equal(senderBalanceAfter.toNumber(), senderBalanceBefore.minus(10).toNumber(), "Sender has incorrect balance");
		assert.equal(recipientBalanceAfter.toNumber(), recipientBalanceBefore.plus(10).toNumber(), "Recipient has incorrect balance");
	});

	it("transferPrimordialAO() - only Advocate of Name/TAO can transfer Primordial AO+ Ion to an address", async function() {
		var canTransfer;
		try {
			await nametaovault.transferPrimordialAO(someAddress, recipient.address, 10, { from: account2 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Can transfer Primordial AO+ Ion from non-Name/TAO");

		try {
			await nametaovault.transferPrimordialAO(nameId1, recipient.address, 10, { from: account1 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Advocate of Name can transfer Primordial AO+ Ion from Name with no balance");

		try {
			await nametaovault.transferPrimordialAO(nameId2, emptyAddress, 10, { from: account2 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Advocate of Name can transfer Primordial AO+ Ion to invalid address");

		try {
			await nametaovault.transferPrimordialAO(nameId2, recipient.address, 10 ** 10, { from: account2 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Advocate of Name can transfer Primordial AO+ Ion more than its owned balance");

		try {
			await nametaovault.transferPrimordialAO(nameId2, recipient.address, 10, { from: account1 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Non-advocate of Name can transfer Primordial AO+ Ion");

		var senderBalanceBefore = await nametaovault.primordialAOBalanceOf(nameId2);
		var recipientBalanceBefore = await aoion.primordialBalanceOf(recipient.address);
		try {
			await nametaovault.transferPrimordialAO(nameId2, recipient.address, 10, { from: account2 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, true, "Advocate of Name can't transfer Primordial AO+ Ion from Name");

		var senderBalanceAfter = await nametaovault.primordialAOBalanceOf(nameId2);
		var recipientBalanceAfter = await aoion.primordialBalanceOf(recipient.address);

		assert.equal(senderBalanceAfter.toNumber(), senderBalanceBefore.minus(10).toNumber(), "Sender has incorrect balance");
		assert.equal(recipientBalanceAfter.toNumber(), recipientBalanceBefore.plus(10).toNumber(), "Recipient has incorrect balance");

		senderBalanceBefore = await nametaovault.primordialAOBalanceOf(taoId2);
		recipientBalanceBefore = await aoion.primordialBalanceOf(recipient.address);
		try {
			await nametaovault.transferPrimordialAO(taoId2, recipient.address, 10, { from: account2 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, true, "Advocate of TAO can't transfer Primordial AO+ Ion from TAO");

		senderBalanceAfter = await nametaovault.primordialAOBalanceOf(taoId2);
		recipientBalanceAfter = await aoion.primordialBalanceOf(recipient.address);

		assert.equal(senderBalanceAfter.toNumber(), senderBalanceBefore.minus(10).toNumber(), "Sender has incorrect balance");
		assert.equal(recipientBalanceAfter.toNumber(), recipientBalanceBefore.plus(10).toNumber(), "Recipient has incorrect balance");
	});
});