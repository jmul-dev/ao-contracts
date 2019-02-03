var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var Logos = artifacts.require("./Logos.sol");
var Voice = artifacts.require("./Voice.sol");
var NameTAOLookup = artifacts.require("./NameTAOLookup.sol");
var NamePublicKey = artifacts.require("./NamePublicKey.sol");
var NameTAOVault = artifacts.require("./NameTAOVault.sol");

var EthCrypto = require("eth-crypto");

contract("NameFactory", function(accounts) {
	var namefactory, taofactory, nametaoposition, logos, voice, nametaolookup, namepublickey, nametaovault, nameId1, nameId2, taoId;

	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var someAddress = accounts[3];
	var whitelistedAddress = accounts[4];
	var emptyAddress = "0x0000000000000000000000000000000000000000";

	// Retrieve private key from ganache
	var account1PrivateKey = "0xfa372b56eac0e71de587267f0a59989719b2325aeb4579912379641cf93ccaab";
	var account2PrivateKey = "0x6a35c58d0acad0ceca9c03d37aa2d2288d70afe0690f5e5f5e05aeab93b95dad";

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		logos = await Logos.deployed();
		voice = await Voice.deployed();
		nametaolookup = await NameTAOLookup.deployed();
		namepublickey = await NamePublicKey.deployed();
		nametaovault = await NameTAOVault.deployed();

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

	it("The AO - should be able to set Voice address", async function() {
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

	it("The AO - should be able to set NameTAOVault address", async function() {
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

	it("The AO - should be able to set NameTAOLookup address", async function() {
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

	it("The AO - should be able to set NameTAOPosition address", async function() {
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

	it("The AO - should be able to set NamePublicKey address", async function() {
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
			var result = await namefactory.createName("", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
				from: account2
			});
			canCreateName = true;
		} catch (e) {
			canCreateName = false;
		}
		assert.equal(canCreateName, false, "Can create Name with invalid name");

		try {
			var result = await namefactory.createName("somename", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
				from: account1
			});
			canCreateName = true;
		} catch (e) {
			canCreateName = false;
		}
		assert.equal(canCreateName, false, "Address that has created Name can create another Name");

		try {
			var result = await namefactory.createName("charlie", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
				from: account2
			});
			canCreateName = true;
		} catch (e) {
			canCreateName = false;
		}
		assert.equal(canCreateName, false, "Address can create Name with name that is already taken");

		var totalNamesCountBefore = await namefactory.getTotalNamesCount();

		try {
			var result = await namefactory.createName("delta", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
				from: account2
			});
			canCreateName = true;
		} catch (e) {
			canCreateName = false;
		}
		assert.equal(canCreateName, true, "Address can't create a Name");

		nameId2 = await namefactory.ethAddressToNameId(account2);

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
			totalNamesCountBefore.plus(1).toNumber(),
			"getTotalNamesCount() returns incorrect value"
		);

		var getName = await namefactory.getName(nameId2);
		assert.equal(getName[0], "delta", "getName() returns incorrect name");
		assert.equal(getName[1], account2, "getName() returns incorrect originId");
		assert.equal(getName[2], "somedathash", "getName() returns incorrect datHash");
		assert.equal(getName[3], "somedatabase", "getName() returns incorrect database");
		assert.equal(getName[4], "somekeyvalue", "getName() returns incorrect keyValue");
		assert.equal(web3.toAscii(getName[5]).replace(/\0/g, ""), "somecontentid", "getName() returns incorrect contentId");
		assert.equal(getName[6].toNumber(), 1, "getName() returns incorrect typeId");

		var nameIds = await namefactory.getNameIds(0, totalNamesCountAfter.toNumber());
		assert.include(nameIds, nameId2, "getNameIds() is missing a Name ID");
	});

	it("validateNameSignature() - should be able to validate a Name's signature", async function() {
		var data = "somedata";
		var nonce = await namefactory.nonces(nameId2);

		var signature = createSignature(account2PrivateKey, data, nonce.plus(1).toNumber());
		var vrs = EthCrypto.vrs.fromString(signature);

		var canValidate, isValid;
		try {
			isValid = await namefactory.validateNameSignature(data, nonce.plus(1).toNumber(), account2, "somename", vrs.v, vrs.r, vrs.s);
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

		signature = createSignature(account1PrivateKey, data, nonce.plus(1).toNumber());
		vrs = EthCrypto.vrs.fromString(signature);
		try {
			isValid = await namefactory.validateNameSignature(data, nonce.plus(1).toNumber(), account2, "delta", vrs.v, vrs.r, vrs.s);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		assert.equal(isValid, false, "validateNameSignature() returns incorrect value - signatureAddress != validateAddress");

		signature = createSignature(account1PrivateKey, data, nonce.plus(1).toNumber());
		vrs = EthCrypto.vrs.fromString(signature);
		try {
			isValid = await namefactory.validateNameSignature(data, nonce.plus(1).toNumber(), account1, "delta", vrs.v, vrs.r, vrs.s);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		assert.equal(isValid, false, "validateNameSignature() returns incorrect value - validateAddress is not in Name's Public Key list");

		signature = createSignature(account1PrivateKey, data, nonce.plus(1).toNumber());
		vrs = EthCrypto.vrs.fromString(signature);
		try {
			isValid = await namefactory.validateNameSignature(data, nonce.plus(1).toNumber(), emptyAddress, "delta", vrs.v, vrs.r, vrs.s);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		assert.equal(
			isValid,
			false,
			"validateNameSignature() returns incorrect value - signatureAddress is not the Name's Default Public Key"
		);

		signature = createSignature(account2PrivateKey, data, nonce.plus(1).toNumber());
		vrs = EthCrypto.vrs.fromString(signature);
		try {
			isValid = await namefactory.validateNameSignature(data, nonce.plus(1).toNumber(), account2, "delta", vrs.v, vrs.r, vrs.s);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		assert.equal(
			isValid,
			true,
			"validateNameSignature() returns incorrect value - signatureAddress == validateAddress and validateAddress is in Name's PublicKey list"
		);

		signature = createSignature(account2PrivateKey, data, nonce.plus(1).toNumber());
		vrs = EthCrypto.vrs.fromString(signature);
		try {
			isValid = await namefactory.validateNameSignature(data, nonce.plus(1).toNumber(), emptyAddress, "delta", vrs.v, vrs.r, vrs.s);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		assert.equal(isValid, true, "validateNameSignature() returns incorrect value - signatureAddress is Name's Default Public Key");

		// Add account1 to NameId2 Public Key
		await namepublickey.addKey(nameId2, account1, { from: account2 });
		nonce = await namefactory.nonces(nameId2);

		signature = createSignature(account1PrivateKey, data, nonce.plus(1).toNumber());
		vrs = EthCrypto.vrs.fromString(signature);
		try {
			isValid = await namefactory.validateNameSignature(data, nonce.plus(1).toNumber(), account1, "delta", vrs.v, vrs.r, vrs.s);
			canValidate = true;
		} catch (e) {
			canValidate = false;
		}
		assert.equal(isValid, true, "validateNameSignature() returns incorrect value - validateAddress is in Name's Public Key list");
	});
});