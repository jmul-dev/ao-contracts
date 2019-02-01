var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var Logos = artifacts.require("./Logos.sol");

var NamePublicKey = artifacts.require("./NamePublicKey.sol");

var EthCrypto = require("eth-crypto");

contract("NamePublicKey", function(accounts) {
	var namefactory, taofactory, nametaoposition, logos, nameId1, nameId2, taoId1, namepublickey;

	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var someAddress = accounts[3];
	var whitelistedAddress = accounts[4];
	var newKey = accounts[5];
	var emptyAddress = "0x0000000000000000000000000000000000000000";

	// Retrieve private key from ganache
	var account1PrivateKey = "0xfa372b56eac0e71de587267f0a59989719b2325aeb4579912379641cf93ccaab";
	var account2PrivateKey = "0x6a35c58d0acad0ceca9c03d37aa2d2288d70afe0690f5e5f5e05aeab93b95dad";

	var createSignature = function(privateKey, nameId, publicKey) {
		var signHash = EthCrypto.hash.keccak256([
			{
				type: "address",
				value: namepublickey.address
			},
			{
				type: "address",
				value: nameId
			},
			{
				type: "address",
				value: publicKey
			}
		]);

		var signature = EthCrypto.sign(privateKey, signHash);
		return signature;
	};

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		logos = await Logos.deployed();
		namepublickey = await NamePublicKey.deployed();

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

	it("The AO - transferOwnership() - should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await namepublickey.transferOwnership(taoId1, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await namepublickey.transferOwnership(taoId1, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await namepublickey.theAO();
		assert.equal(newTheAO, taoId1, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - setWhitelist() should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await namepublickey.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await namepublickey.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await namepublickey.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
	});

	it("The AO - setNameFactoryAddress() should be able to set NameFactory address", async function() {
		var canSetAddress;
		try {
			await namepublickey.setNameFactoryAddress(namefactory.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameFactory address");

		try {
			await namepublickey.setNameFactoryAddress(namefactory.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameFactory address");

		var nameFactoryAddress = await namepublickey.nameFactoryAddress();
		assert.equal(nameFactoryAddress, namefactory.address, "Contract has incorrect nameFactoryAddress");
	});

	it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await namepublickey.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await namepublickey.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await namepublickey.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("initialize() - only NameFactory can initialize PublicKey for a Name", async function() {
		// Create Name
		var result = await namefactory.createName("delta", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account2
		});
		nameId2 = await namefactory.ethAddressToNameId(account2);

		var isExist = await namepublickey.isExist(nameId2);
		assert.equal(isExist, true, "isExist() returns incorrect value");

		var getTotalPublicKeysCount = await namepublickey.getTotalPublicKeysCount(nameId2);
		assert.equal(getTotalPublicKeysCount.toNumber(), 1, "getTotalPublicKeysCount() returns incorrect value");

		var isKeyExist = await namepublickey.isKeyExist(nameId2, account2);
		assert.equal(isKeyExist, true, "isKeyExist() returns incorrect value");

		var getDefaultKey = await namepublickey.getDefaultKey(nameId2);
		assert.equal(getDefaultKey, account2, "getDefaultKey() returns incorrect value");

		var nonce = await namefactory.nonces(nameId2);
		assert.equal(nonce.toNumber(), 1, "Name has incorrect nonce");
	});

	it("addKey() - Advocate of Name should be able to add public key to list", async function() {
		var canAdd;
		try {
			await namepublickey.addKey(someAddress, newKey, { from: account1 });
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.equal(canAdd, false, "Can add public key to a non-existing Name");

		try {
			await namepublickey.addKey(nameId2, newKey, { from: account1 });
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.equal(canAdd, false, "Non-Advocate of Name can add new public key");

		try {
			await namepublickey.addKey(nameId2, emptyAddress, { from: account2 });
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.equal(canAdd, false, "Advocate of Name can add invalid public key");

		try {
			await namepublickey.addKey(nameId2, account2, { from: account2 });
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.equal(canAdd, false, "Advocate of Name can add duplicate public key");

		var nonceBefore = await namefactory.nonces(nameId2);
		var getTotalPublicKeysCountBefore = await namepublickey.getTotalPublicKeysCount(nameId2);

		try {
			await namepublickey.addKey(nameId2, newKey, { from: account2 });
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.equal(canAdd, true, "Advocate of Name can't add public key");

		var nonceAfter = await namefactory.nonces(nameId2);
		assert.equal(nonceAfter.toNumber(), nonceBefore.plus(1).toNumber(), "Name has incorrect nonce");

		var isKeyExist = await namepublickey.isKeyExist(nameId2, newKey);
		assert.equal(isKeyExist, true, "isKeyExist() returns incorrect value");

		var getTotalPublicKeysCountAfter = await namepublickey.getTotalPublicKeysCount(nameId2);
		assert.equal(
			getTotalPublicKeysCountAfter.toNumber(),
			getTotalPublicKeysCountBefore.plus(1).toNumber(),
			"getTotalPublicKeysCount() returns incorrect value"
		);

		var getKeys = await namepublickey.getKeys(nameId2, 0, getTotalPublicKeysCountAfter.toNumber());
		assert.include(getKeys, newKey, "getKeys() returns incorrect value");
	});

	it("removeKey() - Advocate of Name should be able to remove public key from list", async function() {
		var canRemove;
		try {
			await namepublickey.removeKey(someAddress, newKey, { from: account1 });
			canRemove = true;
		} catch (e) {
			canRemove = false;
		}
		assert.equal(canRemove, false, "Can remove public key from a non-existing Name");

		try {
			await namepublickey.removeKey(nameId2, newKey, { from: account1 });
			canRemove = true;
		} catch (e) {
			canRemove = false;
		}
		assert.equal(canRemove, false, "Non-Advocate of Name can remove public key");

		try {
			await namepublickey.removeKey(nameId2, someAddress, { from: account2 });
			canRemove = true;
		} catch (e) {
			canRemove = false;
		}
		assert.equal(canRemove, false, "Advocate of Name can remove non-existing public key");

		var defaultKey = await namepublickey.getDefaultKey(nameId2);
		try {
			await namepublickey.removeKey(nameId2, defaultKey, { from: account2 });
			canRemove = true;
		} catch (e) {
			canRemove = false;
		}
		assert.equal(canRemove, false, "Advocate of Name can remove default public key");

		var nonceBefore = await namefactory.nonces(nameId2);
		var getTotalPublicKeysCountBefore = await namepublickey.getTotalPublicKeysCount(nameId2);

		try {
			await namepublickey.removeKey(nameId2, newKey, { from: account2 });
			canRemove = true;
		} catch (e) {
			canRemove = false;
		}
		assert.equal(canRemove, true, "Advocate of Name can't remove public key");

		var nonceAfter = await namefactory.nonces(nameId2);
		assert.equal(nonceAfter.toNumber(), nonceBefore.plus(1).toNumber(), "Name has incorrect nonce");

		var isKeyExist = await namepublickey.isKeyExist(nameId2, newKey);
		assert.equal(isKeyExist, false, "isKeyExist() returns incorrect value");

		var getTotalPublicKeysCountAfter = await namepublickey.getTotalPublicKeysCount(nameId2);
		assert.equal(
			getTotalPublicKeysCountAfter.toNumber(),
			getTotalPublicKeysCountBefore.minus(1).toNumber(),
			"getTotalPublicKeysCount() returns incorrect value"
		);

		var getKeys = await namepublickey.getKeys(nameId2, 0, getTotalPublicKeysCountAfter.toNumber());
		assert.notInclude(getKeys, newKey, "getKeys() returns incorrect value");
	});

	it("setDefaultKey() - should be able to set a default public key from existing public key list", async function() {
		await namepublickey.addKey(nameId2, newKey, { from: account2 });

		var signature = createSignature(account2PrivateKey, nameId2, newKey);
		var vrs = EthCrypto.vrs.fromString(signature);

		var canSetDefault;
		try {
			await namepublickey.setDefaultKey(nameId2, newKey, vrs.v, vrs.r, vrs.s, { from: account1 });
			canSetDefault = true;
		} catch (e) {
			canSetDefault = false;
		}
		assert.equal(canSetDefault, false, "Non-advocate of Name can set default public key");

		try {
			await namepublickey.setDefaultKey(someAddress, newKey, vrs.v, vrs.r, vrs.s, { from: account2 });
			canSetDefault = true;
		} catch (e) {
			canSetDefault = false;
		}
		assert.equal(canSetDefault, false, "Can set default public key on a non-existing Name");

		try {
			await namepublickey.setDefaultKey(nameId2, someAddress, vrs.v, vrs.r, vrs.s, { from: account2 });
			canSetDefault = true;
		} catch (e) {
			canSetDefault = false;
		}
		assert.equal(canSetDefault, false, "Advocate of Name can set non-existing public key as default");

		try {
			await namepublickey.setDefaultKey(nameId2, newKey, 0, vrs.r, vrs.s, { from: account2 });
			canSetDefault = true;
		} catch (e) {
			canSetDefault = false;
		}
		assert.equal(canSetDefault, false, "Advocate of Name can set default public key with invalid v part of signature");

		try {
			await namepublickey.setDefaultKey(nameId2, newKey, vrs.v, "", vrs.s, { from: account2 });
			canSetDefault = true;
		} catch (e) {
			canSetDefault = false;
		}
		assert.equal(canSetDefault, false, "Advocate of Name can set default public key with invalid r part of signature");

		try {
			await namepublickey.setDefaultKey(nameId2, newKey, vrs.v, vrs.r, "", { from: account2 });
			canSetDefault = true;
		} catch (e) {
			canSetDefault = false;
		}
		assert.equal(canSetDefault, false, "Advocate of Name can set default public key with invalid s part of signature");

		var nonceBefore = await namefactory.nonces(nameId2);

		try {
			await namepublickey.setDefaultKey(nameId2, newKey, vrs.v, vrs.r, vrs.s, { from: account2 });
			canSetDefault = true;
		} catch (e) {
			canSetDefault = false;
		}
		assert.equal(canSetDefault, true, "Advocate of Name can't set default public key");

		var nonceAfter = await namefactory.nonces(nameId2);
		assert.equal(nonceAfter.toNumber(), nonceBefore.plus(1).toNumber(), "Name has incorrect nonce");

		var getDefaultKey = await namepublickey.getDefaultKey(nameId2);
		assert.equal(getDefaultKey, newKey, "getDefaultKey() returns incorrect value");
	});
});
