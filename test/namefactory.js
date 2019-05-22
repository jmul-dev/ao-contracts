var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var Logos = artifacts.require("./Logos.sol");
var Voice = artifacts.require("./Voice.sol");
var NameTAOLookup = artifacts.require("./NameTAOLookup.sol");
var NamePublicKey = artifacts.require("./NamePublicKey.sol");
var NameTAOVault = artifacts.require("./NameTAOVault.sol");
var NameAccountRecovery = artifacts.require("./NameAccountRecovery.sol");
var AOSetting = artifacts.require("./AOSetting.sol");
var Pathos = artifacts.require("./Pathos.sol");
var Ethos = artifacts.require("./Ethos.sol");

var EthCrypto = require("eth-crypto");
var helper = require("./helpers/truffleTestHelper");
var BN = require("bn.js");

contract("NameFactory", function(accounts) {
	var namefactory,
		taofactory,
		nametaoposition,
		logos,
		voice,
		nametaolookup,
		namepublickey,
		nametaovault,
		nameaccountrecovery,
		aosetting,
		pathos,
		ethos,
		primordialContributorName,
		primordialContributorPathos,
		primordialContributorEthos,
		nameId1,
		nameId2,
		nameId3,
		contributorName,
		taoId;

	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var account4 = accounts[4];
	var account5 = accounts[5];
	var someAddress = accounts[6];
	var whitelistedAddress = accounts[7];
	var emptyAddress = "0x0000000000000000000000000000000000000000";

	// Retrieve private key from ganache
	var account1PrivateKey = "0xfa372b56eac0e71de587267f0a59989719b2325aeb4579912379641cf93ccaab";
	var account2PrivateKey = "0x6a35c58d0acad0ceca9c03d37aa2d2288d70afe0690f5e5f5e05aeab93b95dad";

	var nameId1LocalWriterKey = EthCrypto.createIdentity();
	var nameId2LocalWriterKey = EthCrypto.createIdentity();
	var nameId3LocalWriterKey = EthCrypto.createIdentity();
	var contributorWriterKey = EthCrypto.createIdentity();

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		logos = await Logos.deployed();
		voice = await Voice.deployed();
		nametaolookup = await NameTAOLookup.deployed();
		namepublickey = await NamePublicKey.deployed();
		nametaovault = await NameTAOVault.deployed();
		nameaccountrecovery = await NameAccountRecovery.deployed();
		aosetting = await AOSetting.deployed();
		pathos = await Pathos.deployed();
		ethos = await Ethos.deployed();

		settingTAOId = await namefactory.settingTAOId();

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "primordialContributorName");
		primordialContributorName = settingValues[4];

		settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "primordialContributorPathos");
		primordialContributorPathos = settingValues[0];

		settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "primordialContributorEthos");
		primordialContributorEthos = settingValues[0];

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

		// Mint Logos to nameId
		await logos.setWhitelist(theAO, true, { from: theAO });
		await logos.mint(nameId1, 10 ** 12, { from: theAO });

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
		taoId = createTAOEvent.args.taoId;
	});

	var createSignature = function(privateKey, data, nonce) {
		var signHash = EthCrypto.hash.keccak256([
			{
				type: "address",
				value: namefactory.address
			},
			{
				type: "string",
				value: data
			},
			{
				type: "uint256",
				value: nonce
			}
		]);

		var signature = EthCrypto.sign(privateKey, signHash);
		return signature;
	};

	it("The AO - transferOwnership() - should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await aoeth.transferOwnership(taoId, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await namefactory.transferOwnership(taoId, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await namefactory.theAO();
		assert.equal(newTheAO, taoId, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - setWhitelist() should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await namefactory.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await namefactory.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await namefactory.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
	});

	it("The AO - setVoiceAddress() should be able to set Voice address", async function() {
		var canSetAddress;
		try {
			await namefactory.setVoiceAddress(voice.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set Voice address");

		try {
			await namefactory.setVoiceAddress(voice.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set Voice address");

		var voiceAddress = await namefactory.voiceAddress();
		assert.equal(voiceAddress, voice.address, "Contract has incorrect voiceAddress");
	});

	it("The AO - setNameTAOVaultAddress() should be able to set NameTAOVault address", async function() {
		var canSetAddress;
		try {
			await namefactory.setNameTAOVaultAddress(nametaovault.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOVault address");

		try {
			await namefactory.setNameTAOVaultAddress(nametaovault.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOVault address");

		var nameTAOVaultAddress = await namefactory.nameTAOVaultAddress();
		assert.equal(nameTAOVaultAddress, nametaovault.address, "Contract has incorrect nameTAOVaultAddress");
	});

	it("The AO - setNameTAOLookupAddress() should be able to set NameTAOLookup address", async function() {
		var canSetAddress;
		try {
			await namefactory.setNameTAOLookupAddress(nametaolookup.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOLookup address");

		try {
			await namefactory.setNameTAOLookupAddress(nametaolookup.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOLookup address");

		var nameTAOLookupAddress = await namefactory.nameTAOLookupAddress();
		assert.equal(nameTAOLookupAddress, nametaolookup.address, "Contract has incorrect nameTAOLookupAddress");
	});

	it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await namefactory.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await namefactory.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await namefactory.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("The AO - setNamePublicKeyAddress() should be able to set NamePublicKey address", async function() {
		var canSetAddress;
		try {
			await namefactory.setNamePublicKeyAddress(namepublickey.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NamePublicKey address");

		try {
			await namefactory.setNamePublicKeyAddress(namepublickey.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NamePublicKey address");

		var namePublicKeyAddress = await namefactory.namePublicKeyAddress();
		assert.equal(namePublicKeyAddress, namepublickey.address, "Contract has incorrect namePublicKeyAddress");
	});

	it("The AO - setNameAccountRecoveryAddress() should be able to set NameAccountRecovery address", async function() {
		var canSetAddress;
		try {
			await namefactory.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameAccountRecovery address");

		try {
			await namefactory.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameAccountRecovery address");

		var nameAccountRecoveryAddress = await namefactory.nameAccountRecoveryAddress();
		assert.equal(nameAccountRecoveryAddress, nameaccountrecovery.address, "Contract has incorrect nameAccountRecoveryAddress");
	});

	it("incrementNonce() - only allowed address can update Name's nonce", async function() {
		var canIncrementNonce;
		try {
			await namefactory.incrementNonce(nameId1, { from: someAddress });
			canIncrementNonce = true;
		} catch (e) {
			canIncrementNonce = false;
		}
		assert.equal(canIncrementNonce, false, "Address that is not in the allowed list can increment Name's nonce");
	});

	it("createName() - should be able to create Name", async function() {
		var canCreateName;
		try {
			var result = await namefactory.createName(
				"",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				web3.utils.toHex("somecontentid"),
				nameId2LocalWriterKey.address,
				{
					from: account2
				}
			);
			canCreateName = true;
		} catch (e) {
			canCreateName = false;
		}
		assert.equal(canCreateName, false, "Can create Name with invalid name");

		try {
			var result = await namefactory.createName(
				"somename",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				web3.utils.toHex("somecontentid"),
				nameId1LocalWriterKey.address,
				{
					from: account1
				}
			);
			canCreateName = true;
		} catch (e) {
			canCreateName = false;
		}
		assert.equal(canCreateName, false, "Address that has created Name can create another Name");

		try {
			var result = await namefactory.createName(
				"charlie",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				web3.utils.toHex("somecontentid"),
				nameId2LocalWriterKey.address,
				{
					from: account2
				}
			);
			canCreateName = true;
		} catch (e) {
			canCreateName = false;
		}
		assert.equal(canCreateName, false, "Address can create Name with name that is already taken");

		var totalNamesCountBefore = await namefactory.getTotalNamesCount();

		try {
			var result = await namefactory.createName(
				"delta",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				web3.utils.toHex("somecontentid"),
				nameId1LocalWriterKey.address,
				{
					from: account2
				}
			);
			canCreateName = true;
		} catch (e) {
			canCreateName = false;
		}
		assert.equal(canCreateName, false, "Address can create a Name using write public key that is already taken");

		try {
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
			canCreateName = true;
		} catch (e) {
			canCreateName = false;
		}
		assert.equal(canCreateName, true, "Address can't create a Name");

		nameId2 = await namefactory.ethAddressToNameId(account2);
		var ethAddress = await namefactory.nameIdToEthAddress(nameId2);
		assert.equal(ethAddress, account2, "nameIdToEthAddress() returns incorrect value");

		var isExist = await nametaolookup.isExist("delta");
		assert.equal(isExist, true, "Name creation is missing NameTAOLookup initialization");

		isExist = await nametaoposition.isExist(nameId2);
		assert.equal(isExist, true, "Name creation is missing NameTAOPosition initialization");

		isExist = await namepublickey.isExist(nameId2);
		assert.equal(isExist, true, "Name creation is missing NamePublicKey initialization");

		var voiceBalance = await voice.balanceOf(nameId2);
		var maxSupplyPerName = await voice.MAX_SUPPLY_PER_NAME();
		assert.equal(voiceBalance.toNumber(), maxSupplyPerName.toNumber(), "Name creation is not minting correct Voice amount to Name");

		var totalNamesCountAfter = await namefactory.getTotalNamesCount();
		assert.equal(
			totalNamesCountAfter.toNumber(),
			totalNamesCountBefore.add(new BN(1)).toNumber(),
			"getTotalNamesCount() returns incorrect value"
		);

		var getName = await namefactory.getName(nameId2);
		assert.equal(getName[0], "delta", "getName() returns incorrect name");
		assert.equal(getName[1], account2, "getName() returns incorrect originId");
		assert.equal(getName[2], "somedathash", "getName() returns incorrect datHash");
		assert.equal(getName[3], "somedatabase", "getName() returns incorrect database");
		assert.equal(getName[4], "somekeyvalue", "getName() returns incorrect keyValue");
		assert.equal(web3.utils.toAscii(getName[5]).replace(/\0/g, ""), "somecontentid", "getName() returns incorrect contentId");
		assert.equal(getName[6].toNumber(), 1, "getName() returns incorrect typeId");

		var nameIds = await namefactory.getNameIds(0, totalNamesCountAfter.toNumber());
		assert.include(nameIds, nameId2, "getNameIds() is missing a Name ID");
	});

	it("createName() - should be able to create primordial contributor and assign pathos/ethos", async function() {
		var totalNamesCountBefore = await namefactory.getTotalNamesCount();

		var canCreateName;
		try {
			var result = await namefactory.createName(
				primordialContributorName,
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				web3.utils.toHex("somecontentid"),
				contributorWriterKey.address,
				{
					from: account5
				}
			);
			canCreateName = true;
		} catch (e) {
			canCreateName = false;
		}
		assert.equal(canCreateName, true, "Can create primordial contributor Name");

		contributorName = await namefactory.ethAddressToNameId(account5);
		var ethAddress = await namefactory.nameIdToEthAddress(contributorName);
		assert.equal(ethAddress, account5, "nameIdToEthAddress() returns incorrect value");

		var isExist = await nametaolookup.isExist(primordialContributorName);
		assert.equal(isExist, true, "Name creation is missing NameTAOLookup initialization");

		isExist = await nametaoposition.isExist(contributorName);
		assert.equal(isExist, true, "Name creation is missing NameTAOPosition initialization");

		isExist = await namepublickey.isExist(contributorName);
		assert.equal(isExist, true, "Name creation is missing NamePublicKey initialization");

		var voiceBalance = await voice.balanceOf(contributorName);
		var maxSupplyPerName = await voice.MAX_SUPPLY_PER_NAME();
		assert.equal(voiceBalance.toNumber(), maxSupplyPerName.toNumber(), "Name creation is not minting correct Voice amount to Name");

		var totalNamesCountAfter = await namefactory.getTotalNamesCount();
		assert.equal(
			totalNamesCountAfter.toNumber(),
			totalNamesCountBefore.add(new BN(1)).toNumber(),
			"getTotalNamesCount() returns incorrect value"
		);

		var getName = await namefactory.getName(contributorName);
		assert.equal(getName[0], primordialContributorName, "getName() returns incorrect name");
		assert.equal(getName[1], account5, "getName() returns incorrect originId");
		assert.equal(getName[2], "somedathash", "getName() returns incorrect datHash");
		assert.equal(getName[3], "somedatabase", "getName() returns incorrect database");
		assert.equal(getName[4], "somekeyvalue", "getName() returns incorrect keyValue");
		assert.equal(web3.utils.toAscii(getName[5]).replace(/\0/g, ""), "somecontentid", "getName() returns incorrect contentId");
		assert.equal(getName[6].toNumber(), 1, "getName() returns incorrect typeId");

		var nameIds = await namefactory.getNameIds(0, totalNamesCountAfter.toNumber());
		assert.include(nameIds, contributorName, "getNameIds() is missing a Name ID");

		var pathosBalance = await pathos.balanceOf(contributorName);
		var ethosBalance = await ethos.balanceOf(contributorName);
		assert.equal(
			pathosBalance.toNumber(),
			primordialContributorPathos.toNumber(),
			"Primordial contributor Name has incorrect Pathos after creation"
		);
		assert.equal(
			ethosBalance.toNumber(),
			primordialContributorEthos.toNumber(),
			"Primordial contributor Name has incorrect Ethos after creation"
		);
	});

	it("validateNameSignature() - should be able to validate a Name's signature", async function() {
		var data = "somedata";
		var nonce = await namefactory.nonces(nameId2);

		var signature = createSignature(account2PrivateKey, data, nonce.add(new BN(1)).toNumber());
		var vrs = EthCrypto.vrs.fromString(signature);

		var canValidate, isValid;
		try {
			isValid = await namefactory.validateNameSignature(
				data,
				nonce.add(new BN(1)).toNumber(),
				account2,
				"somename",
				vrs.v,
				vrs.r,
				vrs.s
			);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		assert.equal(canValidate, false, "Can validate signature of a non-existing name");

		signature = createSignature(account2PrivateKey, data, nonce.toNumber());
		vrs = EthCrypto.vrs.fromString(signature);
		try {
			isValid = await namefactory.validateNameSignature(data, nonce.toNumber(), account2, "delta", vrs.v, vrs.r, vrs.s);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		assert.equal(isValid, false, "validateNameSignature() returns incorrect value - incorrect nonce");

		signature = createSignature(account1PrivateKey, data, nonce.add(new BN(1)).toNumber());
		vrs = EthCrypto.vrs.fromString(signature);
		try {
			isValid = await namefactory.validateNameSignature(
				data,
				nonce.add(new BN(1)).toNumber(),
				account2,
				"delta",
				vrs.v,
				vrs.r,
				vrs.s
			);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		assert.equal(isValid, false, "validateNameSignature() returns incorrect value - signatureAddress != validateAddress");

		signature = createSignature(account1PrivateKey, data, nonce.add(new BN(1)).toNumber());
		vrs = EthCrypto.vrs.fromString(signature);
		try {
			isValid = await namefactory.validateNameSignature(
				data,
				nonce.add(new BN(1)).toNumber(),
				account1,
				"delta",
				vrs.v,
				vrs.r,
				vrs.s
			);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		assert.equal(isValid, false, "validateNameSignature() returns incorrect value - validateAddress is not in Name's Public Key list");

		signature = createSignature(account1PrivateKey, data, nonce.add(new BN(1)).toNumber());
		vrs = EthCrypto.vrs.fromString(signature);
		try {
			isValid = await namefactory.validateNameSignature(
				data,
				nonce.add(new BN(1)).toNumber(),
				emptyAddress,
				"delta",
				vrs.v,
				vrs.r,
				vrs.s
			);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		assert.equal(
			isValid,
			false,
			"validateNameSignature() returns incorrect value - signatureAddress is not the Name's Default Public Key"
		);

		signature = createSignature(account2PrivateKey, data, nonce.add(new BN(1)).toNumber());
		vrs = EthCrypto.vrs.fromString(signature);
		try {
			isValid = await namefactory.validateNameSignature(
				data,
				nonce.add(new BN(1)).toNumber(),
				account2,
				"delta",
				vrs.v,
				vrs.r,
				vrs.s
			);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		assert.equal(
			isValid,
			true,
			"validateNameSignature() returns incorrect value - signatureAddress == validateAddress and validateAddress is in Name's PublicKey list"
		);

		signature = createSignature(account2PrivateKey, data, nonce.add(new BN(1)).toNumber());
		vrs = EthCrypto.vrs.fromString(signature);
		try {
			isValid = await namefactory.validateNameSignature(
				data,
				nonce.add(new BN(1)).toNumber(),
				emptyAddress,
				"delta",
				vrs.v,
				vrs.r,
				vrs.s
			);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		assert.equal(isValid, true, "validateNameSignature() returns incorrect value - signatureAddress is Name's Default Public Key");

		// Add newKey to NameId2 Public Key
		nonce = await namefactory.nonces(nameId2);
		var newKey = EthCrypto.createIdentity();
		var signHash = EthCrypto.hash.keccak256([
			{
				type: "address",
				value: namepublickey.address
			},
			{
				type: "address",
				value: nameId2
			},
			{
				type: "address",
				value: newKey.address
			},
			{
				type: "uint256",
				value: nonce.add(new BN(1)).toNumber()
			}
		]);

		var signature = EthCrypto.sign(newKey.privateKey, signHash);
		var vrs = EthCrypto.vrs.fromString(signature);

		await namepublickey.addKey(nameId2, newKey.address, nonce.add(new BN(1)).toNumber(), vrs.v, vrs.r, vrs.s, { from: account2 });

		nonce = await namefactory.nonces(nameId2);

		signature = createSignature(newKey.privateKey, data, nonce.add(new BN(1)).toNumber());
		vrs = EthCrypto.vrs.fromString(signature);
		try {
			isValid = await namefactory.validateNameSignature(
				data,
				nonce.add(new BN(1)).toNumber(),
				newKey.address,
				"delta",
				vrs.v,
				vrs.r,
				vrs.s
			);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		assert.equal(isValid, true, "validateNameSignature() returns incorrect value - validateAddress is in Name's Public Key list");
	});

	it("setNameNewAddress() - only NameAccountRecovery can set Name's new address", async function() {
		await nametaoposition.setListener(nameId1, nameId2, { from: account1 });
		await nametaoposition.setSpeaker(nameId1, nameId3, { from: account1 });

		// Listener submit account recovery for nameId1
		await nameaccountrecovery.submitAccountRecovery(nameId1, { from: account2 });

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		// Speaker set new address for nameId1
		await nameaccountrecovery.setNameNewAddress(nameId1, account4, { from: account3 });

		var ethAddressToNameId = await namefactory.ethAddressToNameId(account4);
		assert.equal(ethAddressToNameId, nameId1, "ethAddressToNameId() returns incorrect value");

		ethAddressToNameId = await namefactory.ethAddressToNameId(account1);
		assert.equal(ethAddressToNameId, emptyAddress, "ethAddressToNameId() returns incorrect value");

		var nameIdToEthAddress = await namefactory.nameIdToEthAddress(nameId1);
		assert.equal(nameIdToEthAddress, account4, "nameIdToEthAddress() returns incorrect value");
	});
});
