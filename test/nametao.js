var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var TAOPosition = artifacts.require("./TAOPosition.sol");
var Position = artifacts.require("./Position.sol");
var NameTAOLookup = artifacts.require("./NameTAOLookup.sol");
var EthCrypto = require("eth-crypto");

contract("Name & TAO", function(accounts) {
	var namefactory,
		taofactory,
		taoposition,
		position,
		nametaolookup,
		maxSupplyPerName,
		nameId1,
		nameId2,
		nameId3,
		nameId4,
		taoId1,
		taoId2,
		taoId3,
		taoId4;
	var developer = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var account4 = accounts[4];
	var account5 = accounts[5];
	var someAddress1 = accounts[9];
	var someAddress2 = accounts[8];
	var datHash = "somehash";
	var database = "hyperdb";
	var keyValue = "somevalue";
	var contentId = "somecontentid";
	var emptyAddress = "0x0000000000000000000000000000000000000000";

	// Retrieve private key from ganache
	var account1PrivateKey = "0xfa372b56eac0e71de587267f0a59989719b2325aeb4579912379641cf93ccaab";
	var account2PrivateKey = "0x6a35c58d0acad0ceca9c03d37aa2d2288d70afe0690f5e5f5e05aeab93b95dad";
	var account3PrivateKey = "0xf4bab2d2f0c5119cc6aad0735bbf0a017d229cbf430c0041af382b93e713a1c3";
	var account4PrivateKey = "0xfc164bb116857e2b7e5bafb6f515c61cc2cddae22a052c3988c8ff5de598ede0";
	var account1LocalIdentity = {
		publicKey: EthCrypto.publicKeyByPrivateKey(account1PrivateKey),
		address: EthCrypto.publicKey.toAddress(EthCrypto.publicKeyByPrivateKey(account1PrivateKey))
	};
	var account2LocalIdentity = {
		publicKey: EthCrypto.publicKeyByPrivateKey(account2PrivateKey),
		address: EthCrypto.publicKey.toAddress(EthCrypto.publicKeyByPrivateKey(account2PrivateKey))
	};
	var account3LocalIdentity = {
		publicKey: EthCrypto.publicKeyByPrivateKey(account3PrivateKey),
		address: EthCrypto.publicKey.toAddress(EthCrypto.publicKeyByPrivateKey(account3PrivateKey))
	};
	var account4LocalIdentity = {
		publicKey: EthCrypto.publicKeyByPrivateKey(account4PrivateKey),
		address: EthCrypto.publicKey.toAddress(EthCrypto.publicKeyByPrivateKey(account4PrivateKey))
	};

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		taoposition = await TAOPosition.deployed();
		position = await Position.deployed();
		nametaolookup = await NameTAOLookup.deployed();

		maxSupplyPerName = await position.MAX_SUPPLY_PER_NAME();
	});

	contract("Public Function Tests", function() {
		var createName = async function(name, account) {
			var totalNamesBefore = await nametaolookup.totalNames();

			var canCreateName, createNameEvent, nameId;
			try {
				var result = await namefactory.createName(name, datHash, database, keyValue, contentId, { from: account });
				createNameEvent = result.logs[0];
				canCreateName = true;
				nameId = createNameEvent.args.nameId;
			} catch (e) {
				createNameEvent = null;
				canCreateName = false;
				nameId = null;
			}
			assert.equal(canCreateName, true, "Contract is unable to create Name");

			var totalNamesAfter = await nametaolookup.totalNames();
			assert.equal(totalNamesAfter.toString(), totalNamesBefore.plus(1).toString(), "Contract has incorrect names length");

			var names = await namefactory.getNameIds(0, totalNamesAfter.toString());
			assert.include(names, nameId, "Newly created Name ID is not in the list");

			var _name = await namefactory.getName(nameId);
			assert.equal(_name[0], name, "Name has incorrect name");
			assert.equal(_name[1], account, "Name has incorrect originId");
			assert.equal(_name[2], datHash, "Name has incorrect datHash");
			assert.equal(_name[3], database, "Name has incorrect database");
			assert.equal(_name[4], keyValue, "Name has incorrect keyValue");
			assert.equal(web3.toAscii(_name[5]).replace(/\0/g, ""), contentId, "Name has incorrect contentId");
			assert.equal(_name[6].toString(), 1, "Name has incorrect typeId");
			assert.equal(_name[7], account, "Name has incorrect defaultPublicKey");
			assert.equal(_name[8].toNumber(), 1, "Name has incorrect nonce");

			var ethAddressToNameId = await namefactory.ethAddressToNameId(account);
			assert.equal(ethAddressToNameId, nameId, "Contract stores incorrect nameId for ETH address");

			var nameRelationship = await namefactory.getNameRelationship(nameId);
			assert.equal(nameRelationship[0], account, "Name has incorrect fromId");
			assert.equal(nameRelationship[1], emptyAddress, "Name has incorrect fromId");
			assert.equal(nameRelationship[2], emptyAddress, "Name has incorrect fromId");

			var positionAmount = await position.balanceOf(nameId);
			assert.equal(
				positionAmount.toString(),
				maxSupplyPerName.toString(),
				"Name has incorrect Position token balance after creation"
			);

			var totalPublicKeysCount = await namefactory.getNameTotalPublicKeysCount(nameId);
			assert.equal(totalPublicKeysCount.toNumber(), 1, "Name has incorrect publicKeys count");

			var _nameTAOInfo = await nametaolookup.getByName(name);
			assert.equal(_nameTAOInfo[0], name, "getByName() returns incorrect name");
			assert.equal(_nameTAOInfo[1], nameId, "getByName() returns incorrect nameTAOAddress");
			assert.equal(_nameTAOInfo[2], "human", "getByName() returns incorrect parentName");
			assert.equal(_nameTAOInfo[3].toNumber(), 1, "getByName() returns incorrect typeId");

			var _nameTAOInfoInternalId = await nametaolookup.internalId();
			var _nameTAOInfo = await nametaolookup.getByInternalId(_nameTAOInfoInternalId.toNumber());
			assert.equal(_nameTAOInfo[0], name, "getByName() returns incorrect name");
			assert.equal(_nameTAOInfo[1], nameId, "getByName() returns incorrect nameTAOAddress");
			assert.equal(_nameTAOInfo[2], "human", "getByName() returns incorrect parentName");
			assert.equal(_nameTAOInfo[3].toNumber(), 1, "getByName() returns incorrect typeId");

			return nameId;
		};

		var createTAO = async function(name, from, fromType, sameAdvocate, account) {
			var totalTAOsBefore = await nametaolookup.totalTAOs();
			var totalSubTAOsBefore, totalChildTAOsBefore, totalChildTAOsAfter, totalOrphanTAOsBefore, totalOrphanTAOsAfter;
			if (fromType == "tao") {
				totalSubTAOsBefore = await taofactory.getTotalSubTAOsCount(from);
				if (sameAdvocate) {
					totalChildTAOsBefore = await taofactory.getTotalChildTAOsCount(from);
				} else {
					totalOrphanTAOsBefore = await taofactory.getTotalOrphanTAOsCount(from);
				}
			}

			var canCreateTAO, createTAOEvent, addChildTAOEvent, addOrphanTAOEvent, taoId;
			try {
				var result = await taofactory.createTAO(name, datHash, database, keyValue, contentId, from, {
					from: account
				});
				createTAOEvent = result.logs[0];
				if (fromType == "tao") {
					if (sameAdvocate) {
						addChildTAOEvent = result.logs[1];
					} else {
						addOrphanTAOEvent = result.logs[1];
					}
				}
				canCreateTAO = true;
				taoId = createTAOEvent.args.taoId;
			} catch (e) {
				createTAOEvent = null;
				addChildTAOEvent = null;
				addOrphanTAOEvent = null;
				canCreateTAO = false;
				taoId = null;
			}
			assert.equal(canCreateTAO, true, "Advocate is unable to create TAO");

			var totalTAOsAfter = await nametaolookup.totalTAOs();
			assert.equal(totalTAOsAfter.toString(), totalTAOsBefore.plus(1).toString(), "Contract has incorrect taos length");

			var taos = await taofactory.getTAOIds(0, totalTAOsAfter.minus(1).toString());
			assert.include(taos, taoId, "Newly created TAO ID is not in the list");

			var _tao = await taofactory.getTAO(taoId);
			var _advocateId = await namefactory.ethAddressToNameId(account);
			var _advocate = await namefactory.getName(_advocateId);
			assert.equal(_tao[0], name, "TAO has incorrect name");
			assert.equal(_tao[1], _advocateId, "TAO has incorrect originId");
			assert.equal(_tao[2], _advocate[0], "TAO has incorrect Name's name");
			assert.equal(_tao[3], datHash, "TAO has incorrect datHash");
			assert.equal(_tao[4], database, "TAO has incorrect database");
			assert.equal(_tao[5], keyValue, "TAO has incorrect keyValue");
			assert.equal(web3.toAscii(_tao[6]).replace(/\0/g, ""), contentId, "TAO has incorrect contentId");
			assert.equal(_tao[7].toString(), 0, "TAO has incorrect typeId");
			assert.equal(_tao[8].toString(), 1, "TAO has incorrect nonce");

			var _taoPosition = await taofactory.getTAOPosition(taoId);
			assert.equal(_taoPosition[0], _advocateId, "TAO has incorrect advocateId");
			assert.equal(_taoPosition[1], _advocate[0], "TAO has incorrect advocate's name");
			assert.equal(_taoPosition[2], _advocateId, "TAO has incorrect listenerId");
			assert.equal(_taoPosition[3], _advocate[0], "TAO has incorrect listener's name");
			assert.equal(_taoPosition[4], _advocateId, "TAO has incorrect speakerId");
			assert.equal(_taoPosition[5], _advocate[0], "TAO has incorrect speaker's name");

			var taoRelationship = await taofactory.getTAORelationship(taoId);
			if (fromType == "tao" && !sameAdvocate) {
				assert.equal(taoRelationship[0], _advocateId, "TAO has incorrect fromId");
				assert.equal(taoRelationship[2], from, "TAO has incorrect toId");
			} else {
				assert.equal(taoRelationship[0], from, "TAO has incorrect fromId");
				assert.equal(taoRelationship[2], emptyAddress, "TAO has incorrect toId");
			}
			assert.equal(taoRelationship[1], emptyAddress, "TAO has incorrect throughId");

			if (fromType == "tao") {
				totalSubTAOsAfter = await taofactory.getTotalSubTAOsCount(from);

				assert.equal(
					totalSubTAOsAfter.toString(),
					totalSubTAOsBefore.plus(1).toString(),
					"Parent TAO has incorrect count of sub TAOs"
				);

				var subTAOs = await taofactory.getSubTAOIds(from, 1, totalSubTAOsAfter.toString());
				assert.include(subTAOs, taoId, "Newly created TAO ID is not in the parent's list of sub TAOs");
				if (sameAdvocate) {
					assert.notEqual(addChildTAOEvent, null, "Creating TAO didn't emit AddChildTAO event");
					assert.equal(addChildTAOEvent.args.parentTAOId, from, "AddChildTAO event has incorrect parent TAO ID");
					assert.equal(addChildTAOEvent.args.childTAOId, taoId, "AddChildTAO event has incorrect child TAO ID");

					totalChildTAOsAfter = await taofactory.getTotalChildTAOsCount(from);

					assert.equal(
						totalChildTAOsAfter.toString(),
						totalChildTAOsBefore.plus(1).toString(),
						"Parent TAO has incorrect count of child TAOs"
					);

					var isChildTAOOfTAO = await taofactory.isChildTAOOfTAO(from, taoId);
					assert.equal(isChildTAOOfTAO, true, "Newly created TAO is not child TAO of `from`");
				} else {
					assert.notEqual(addOrphanTAOEvent, null, "Creating TAO didn't emit AddOrphanTAO event");
					assert.equal(addOrphanTAOEvent.args.parentTAOId, from, "AddOrphanTAO event has incorrect parent TAO ID");
					assert.equal(addOrphanTAOEvent.args.orphanTAOId, taoId, "AddOrphanTAO event has incorrect orphan TAO ID");

					totalOrphanTAOsAfter = await taofactory.getTotalOrphanTAOsCount(from);

					assert.equal(
						totalOrphanTAOsAfter.toString(),
						totalOrphanTAOsBefore.plus(1).toString(),
						"Parent TAO has incorrect count of orphan TAOs"
					);

					var isOrphanTAOOfTAO = await taofactory.isOrphanTAOOfTAO(from, taoId);
					assert.equal(isOrphanTAOOfTAO, true, "Newly created TAO is not orphan TAO of `from`");
				}
			}
			return taoId;
		};

		it("createName() - should be able to create a Name for an ETH address", async function() {
			nameId1 = await createName("account1", account1);

			try {
				var result = await namefactory.createName("account1", datHash, database, keyValue, contentId, { from: account2 });
				createNameEvent = result.logs[0];
				canCreateName = true;
			} catch (e) {
				createNameEvent = null;
				canCreateName = false;
			}
			assert.notEqual(canCreateName, true, "Contract is able to create Name even though the `name` has been taken");

			try {
				var result = await namefactory.createName("account2", datHash, database, keyValue, contentId, { from: account1 });
				createNameEvent = result.logs[0];
				canCreateName = true;
			} catch (e) {
				createNameEvent = null;
				canCreateName = false;
			}
			assert.notEqual(canCreateName, true, "ETH address is able to create Name even though it already has a Name");
		});

		it("setNameListener() - should be able to set a Listener for a Name", async function() {
			nameId2 = await createName("account2", account2);

			var _newListenerId = nameId2;

			var canSetNameListener, setNameListenerEvent;
			try {
				var result = await namefactory.setNameListener("someid", _newListenerId, { from: account1 });
				setNameListenerEvent = result.logs[0];
				canSetNameListener = true;
			} catch (e) {
				setNameListenerEvent = null;
				canSetNameListener = false;
			}
			assert.notEqual(canSetNameListener, true, "Advocate can set new Listener on non-existing Name");

			try {
				var result = await namefactory.setNameListener(nameId1, "someid", { from: account1 });
				setNameListenerEvent = result.logs[0];
				canSetNameListener = true;
			} catch (e) {
				setNameListenerEvent = null;
				canSetNameListener = false;
			}
			assert.notEqual(canSetNameListener, true, "Advocate can set non-existing Listener on a Name");

			try {
				var result = await namefactory.setNameListener(nameId1, _newListenerId, { from: account2 });
				setNameListenerEvent = result.logs[0];
				canSetNameListener = true;
			} catch (e) {
				setNameListenerEvent = null;
				canSetNameListener = false;
			}
			assert.notEqual(canSetNameListener, true, "Non-Name's advocate can set a new Listener");

			try {
				var result = await namefactory.setNameListener(nameId1, _newListenerId, { from: account1 });
				setNameListenerEvent = result.logs[0];
				canSetNameListener = true;
			} catch (e) {
				setNameListenerEvent = null;
				canSetNameListener = false;
			}
			assert.equal(canSetNameListener, true, "Name's advocate can't set a new Listener");

			var _namePosition = await namefactory.getNamePosition(nameId1);
			assert.equal(_namePosition[2], _newListenerId, "Name has incorrect listenerId after the update");
		});

		it("setNameSpeaker() - should be able to set a Speaker for a Name", async function() {
			nameId3 = await createName("account3", account3);

			var _newSpeakerId = nameId3;

			var canSetNameSpeaker, setNameSpeakerEvent;
			try {
				var result = await namefactory.setNameSpeaker("someid", _newSpeakerId, { from: account1 });
				setNameSpeakerEvent = result.logs[0];
				canSetNameSpeaker = true;
			} catch (e) {
				setNameSpeakerEvent = null;
				canSetNameSpeaker = false;
			}
			assert.notEqual(canSetNameSpeaker, true, "Advocate can set new Speaker on non-existing Name");

			try {
				var result = await namefactory.setNameSpeaker(nameId1, "someid", { from: account1 });
				setNameSpeakerEvent = result.logs[0];
				canSetNameSpeaker = true;
			} catch (e) {
				setNameSpeakerEvent = null;
				canSetNameSpeaker = false;
			}
			assert.notEqual(canSetNameSpeaker, true, "Advocate can set non-existing Speaker on a Name");

			try {
				var result = await namefactory.setNameSpeaker(nameId1, _newSpeakerId, { from: account2 });
				setNameSpeakerEvent = result.logs[0];
				canSetNameSpeaker = true;
			} catch (e) {
				setNameSpeakerEvent = null;
				canSetNameSpeaker = false;
			}
			assert.notEqual(canSetNameSpeaker, true, "Non-Name's advocate can set a new Speaker");

			try {
				var result = await namefactory.setNameSpeaker(nameId1, _newSpeakerId, { from: account1 });
				setNameSpeakerEvent = result.logs[0];
				canSetNameSpeaker = true;
			} catch (e) {
				setNameSpeakerEvent = null;
				canSetNameSpeaker = false;
			}
			assert.equal(canSetNameSpeaker, true, "Name's advocate can't set a new Speaker");

			var _namePosition = await namefactory.getNamePosition(nameId1);
			assert.equal(_namePosition[4], _newSpeakerId, "Name has incorrect speakerId after the update");
		});

		it("getNamePosition() - should return the Advocate/Listener/Speaker of a Name", async function() {
			var canGetNamePosition, position;
			try {
				position = await namefactory.getNamePosition(someAddress1);
				canGetNamePosition = true;
			} catch (e) {
				canGetNamePosition = false;
				position = null;
			}
			assert.notEqual(canGetNamePosition, true, "Contract can get position for non-exiting Name");

			try {
				position = await namefactory.getNamePosition(nameId1);
				canGetNamePosition = true;
			} catch (e) {
				canGetNamePosition = false;
				position = null;
			}
			assert.equal(canGetNamePosition, true, "Contract can't get position for a Name");

			assert.equal(position[0], nameId1, "getNamePosition() returns incorrect Advocate ID for a Name");
			assert.equal(position[1], "account1", "getNamePosition() returns incorrect Advocate's name for a Name");
			assert.equal(position[2], nameId2, "getNamePosition() returns incorrect Listener ID for a Name");
			assert.equal(position[3], "account2", "getNamePosition() returns incorrect Listener's name for a Name");
			assert.equal(position[4], nameId3, "getNamePosition() returns incorrect Speaker ID for a Name");
			assert.equal(position[5], "account3", "getNamePosition() returns incorrect Speaker's name for a Name");
		});

		it("getAddressByName() - should return the correct Name ID given a name", async function() {
			var canGetAddressByName;
			try {
				var nameId = await nametaolookup.getAddressByName("somename");
				canGetAddressByName = true;
			} catch (e) {
				canGetAddressByName = false;
			}
			assert.equal(canGetAddressByName, false, "getAddressByName() is successful even though the name is invalid");

			try {
				var nameId = await nametaolookup.getAddressByName("account1");
				canGetAddressByName = true;
			} catch (e) {
				canGetAddressByName = false;
			}
			assert.equal(canGetAddressByName, true, "getAddressByName() is not successful even though the name is valid");
			assert.equal(nameId, nameId1, "getAddressByName() returns incorrect nameId");
		});

		it("getNameTotalPublicKeysCount() - should return the count of publicKeys given a nameId", async function() {
			var canGetNameTotalPublicKeysCount, totalPublicKeysCount;
			try {
				totalPublicKeysCount = await namefactory.getNameTotalPublicKeysCount(someAddress1);
				canGetNameTotalPublicKeysCount = true;
			} catch (e) {
				canGetNameTotalPublicKeysCount = false;
			}
			assert.notEqual(canGetNameTotalPublicKeysCount, true, "Contract can get total publicKeys count of a non-existing Name");

			try {
				totalPublicKeysCount = await namefactory.getNameTotalPublicKeysCount(nameId1);
				canGetNameTotalPublicKeysCount = true;
			} catch (e) {
				canGetNameTotalPublicKeysCount = false;
			}
			assert.equal(canGetNameTotalPublicKeysCount, true, "Contract can't get total publicKeys count of a Name");
			assert.equal(totalPublicKeysCount.toNumber(), 1, "Contract returns incorrect total publicKeys count of a Name");
		});

		it("getNamePublicKeys() - should return the correct list of publicKeys given a nameId", async function() {
			var canGetNamePublicKeys, publicKeys;
			try {
				publicKeys = await namefactory.getNamePublicKeys(someAddress1, 0, 0);
				canGetNamePublicKeys = true;
			} catch (e) {
				canGetNamePublicKeys = false;
			}
			assert.notEqual(canGetNamePublicKeys, true, "Contract can get publicKeys of a non-existing Name");

			try {
				publicKeys = await namefactory.getNamePublicKeys(nameId1, 1, 0);
				canGetNamePublicKeys = true;
			} catch (e) {
				canGetNamePublicKeys = false;
			}
			assert.notEqual(canGetNamePublicKeys, true, "Contract can get publicKeys with invalid from/to value");

			var totalPublicKeysCount = await namefactory.getNameTotalPublicKeysCount(nameId1);
			try {
				publicKeys = await namefactory.getNamePublicKeys(nameId1, 0, totalPublicKeysCount.plus(10).toNumber());
				canGetNamePublicKeys = true;
			} catch (e) {
				canGetNamePublicKeys = false;
			}
			assert.equal(
				canGetNamePublicKeys,
				true,
				"Contract can't get publicKeys for a Name even though the to value is greater than the public keys length"
			);

			try {
				publicKeys = await namefactory.getNamePublicKeys(nameId1, 0, 0);
				canGetNamePublicKeys = true;
			} catch (e) {
				canGetNamePublicKeys = false;
			}
			assert.equal(canGetNamePublicKeys, true, "Contract can't get publicKeys of a Name");
			assert.lengthOf(publicKeys, 1, "Contract returns incorrect num of publicKeys");
			assert.equal(publicKeys[0], account1, "Contract returns incorrect publicKeys of a Name");
		});

		it("isNamePublicKeyExist() - should return whether or not a publicKey exist inside a Name", async function() {
			var canCall, publicKeyExist;
			try {
				publicKeyExist = await namefactory.isNamePublicKeyExist(someAddress1, account1);
				canCall = true;
			} catch (e) {
				canCall = false;
			}
			assert.notEqual(canCall, true, "Contract can check isNamePublicKeyExist on a non-existing Name");

			try {
				publicKeyExist = await namefactory.isNamePublicKeyExist(nameId1, someAddress1);
				canCall = true;
			} catch (e) {
				canCall = false;
			}
			assert.equal(canCall, true, "Contract can't check isNamePublicKeyExist on a Name");
			assert.equal(publicKeyExist, false, "Contract returns incorrect public key exist for a Name");

			try {
				publicKeyExist = await namefactory.isNamePublicKeyExist(nameId1, account1);
				canCall = true;
			} catch (e) {
				canCall = false;
			}
			assert.equal(canCall, true, "Contract can't check isNamePublicKeyExist on a Name");
			assert.equal(publicKeyExist, true, "Contract returns incorrect public key exist for a Name");
		});

		it("addNamePublicKey() - should be able to add more publicKey to a Name", async function() {
			var canAddNamePublicKey, addNamePublicKeyEvent;
			try {
				var result = await namefactory.addNamePublicKey(someAddress, someAddress1, { from: account1 });
				canAddNamePublicKey = true;
				addNamePublicKeyEvent = result.logs[0];
			} catch (e) {
				canAddNamePublicKey = false;
				addNamePublicKeyEvent = null;
			}
			assert.notEqual(canAddNamePublicKey, true, "Contract can add publicKey for a non-existing Name");

			try {
				var result = await namefactory.addNamePublicKey(nameId1, account1, { from: account1 });
				canAddNamePublicKey = true;
				addNamePublicKeyEvent = result.logs[0];
			} catch (e) {
				canAddNamePublicKey = false;
				addNamePublicKeyEvent = null;
			}
			assert.notEqual(canAddNamePublicKey, true, "Contract can add duplicate publicKey for a Name");

			try {
				var result = await namefactory.addNamePublicKey(nameId1, someAddress1, { from: account2 });
				canAddNamePublicKey = true;
				addNamePublicKeyEvent = result.logs[0];
			} catch (e) {
				canAddNamePublicKey = false;
				addNamePublicKeyEvent = null;
			}
			assert.notEqual(canAddNamePublicKey, true, "Non-Advocate of Name can add publicKey");

			var isNamePublicKeyExist = await namefactory.isNamePublicKeyExist(nameId1, someAddress1);
			assert.equal(isNamePublicKeyExist, false, "Contract returns incorrect public key exist for a Name");

			var totalPublicKeysBefore = await namefactory.getNameTotalPublicKeysCount(nameId1);
			var nameBefore = await namefactory.getName(nameId1);
			try {
				var result = await namefactory.addNamePublicKey(nameId1, someAddress1, { from: account1 });
				canAddNamePublicKey = true;
				addNamePublicKeyEvent = result.logs[0];
			} catch (e) {
				canAddNamePublicKey = false;
				addNamePublicKeyEvent = null;
			}
			assert.equal(canAddNamePublicKey, true, "Contract can't add publicKey for a Name");

			isNamePublicKeyExist = await namefactory.isNamePublicKeyExist(nameId1, someAddress1);
			assert.equal(isNamePublicKeyExist, true, "Contract returns incorrect public key exist for a Name");

			var totalPublicKeysAfter = await namefactory.getNameTotalPublicKeysCount(nameId1);
			assert.equal(totalPublicKeysAfter.toNumber(), totalPublicKeysBefore.plus(1).toNumber(), "Name has incorrect total public keys");

			var publicKeys = await namefactory.getNamePublicKeys(nameId1, 0, totalPublicKeysAfter.minus(1).toNumber());
			assert.include(publicKeys, someAddress1, "Name's publicKeys list is missing an address");

			var nameAfter = await namefactory.getName(nameId1);
			assert.equal(nameAfter[8].toNumber(), nameBefore[8].plus(1).toNumber(), "Name has incorrect nonce after adding publicKey");

			assert.equal(addNamePublicKeyEvent.args.nameId, nameId1, "AddNamePublicKey event has incorrect nameId");
			assert.equal(addNamePublicKeyEvent.args.publicKey, someAddress1, "AddNamePublicKey event has incorrect publicKey");
			assert.equal(
				addNamePublicKeyEvent.args.nonce.toNumber(),
				nameAfter[8].toNumber(),
				"AddNamePublicKey event has incorrect nonce"
			);
		});

		it("deleteNamePublicKey() - should be able to delete publicKey from a Name", async function() {
			var canDeleteNamePublicKey, deleteNamePublicKeyEvent;
			try {
				var result = await namefactory.deleteNamePublicKey(someAddress1, someAddress1, { from: account1 });
				canDeleteNamePublicKey = true;
				deleteNamePublicKeyEvent = result.logs[0];
			} catch (e) {
				canDeleteNamePublicKey = false;
				deleteNamePublicKeyEvent = null;
			}
			assert.notEqual(canDeleteNamePublicKey, true, "Contract can delete publicKey for a non-existing Name");

			try {
				var result = await namefactory.deleteNamePublicKey(nameId1, someAddress2, { from: account1 });
				canDeleteNamePublicKey = true;
				deleteNamePublicKeyEvent = result.logs[0];
			} catch (e) {
				canDeleteNamePublicKey = false;
				deleteNamePublicKeyEvent = null;
			}
			assert.notEqual(canDeleteNamePublicKey, true, "Contract can delete non-existing publicKey for a Name");

			try {
				var result = await namefactory.deleteNamePublicKey(nameId1, someAddress1, { from: account2 });
				canDeleteNamePublicKey = true;
				deleteNamePublicKeyEvent = result.logs[0];
			} catch (e) {
				canDeleteNamePublicKey = false;
				deleteNamePublicKeyEvent = null;
			}
			assert.notEqual(canDeleteNamePublicKey, true, "Non-Advocate of Name can delete publicKey");

			var isNamePublicKeyExist = await namefactory.isNamePublicKeyExist(nameId1, someAddress1);
			assert.equal(isNamePublicKeyExist, true, "Contract returns incorrect public key exist for a Name");

			var totalPublicKeysBefore = await namefactory.getNameTotalPublicKeysCount(nameId1);
			var nameBefore = await namefactory.getName(nameId1);
			try {
				var result = await namefactory.deleteNamePublicKey(nameId1, someAddress1, { from: account1 });
				canDeleteNamePublicKey = true;
				deleteNamePublicKeyEvent = result.logs[0];
			} catch (e) {
				canDeleteNamePublicKey = false;
				deleteNamePublicKeyEvent = null;
			}
			assert.equal(canDeleteNamePublicKey, true, "Contract can't delete publicKey for a Name");

			isNamePublicKeyExist = await namefactory.isNamePublicKeyExist(nameId1, someAddress1);
			assert.equal(isNamePublicKeyExist, false, "Contract returns incorrect public key exist for a Name");

			var totalPublicKeysAfter = await namefactory.getNameTotalPublicKeysCount(nameId1);
			assert.equal(
				totalPublicKeysAfter.toNumber(),
				totalPublicKeysBefore.minus(1).toNumber(),
				"Name has incorrect total public keys"
			);

			var publicKeys = await namefactory.getNamePublicKeys(nameId1, 0, totalPublicKeysAfter.minus(1).toNumber());
			assert.notInclude(publicKeys, someAddress1, "Name's publicKeys list is missing an deleteress");

			var nameAfter = await namefactory.getName(nameId1);
			assert.equal(nameAfter[8].toNumber(), nameBefore[8].plus(1).toNumber(), "Name has incorrect nonce after deleteing publicKey");

			assert.equal(deleteNamePublicKeyEvent.args.nameId, nameId1, "DeleteNamePublicKey event has incorrect nameId");
			assert.equal(deleteNamePublicKeyEvent.args.publicKey, someAddress1, "DeleteNamePublicKey event has incorrect publicKey");
			assert.equal(
				deleteNamePublicKeyEvent.args.nonce.toNumber(),
				nameAfter[8].toNumber(),
				"DeleteNamePublicKey event has incorrect nonce"
			);

			try {
				var result = await namefactory.deleteNamePublicKey(nameId1, account1, { from: account1 });
				canDeleteNamePublicKey = true;
				deleteNamePublicKeyEvent = result.logs[0];
			} catch (e) {
				canDeleteNamePublicKey = false;
				deleteNamePublicKeyEvent = null;
			}
			assert.notEqual(
				canDeleteNamePublicKey,
				true,
				"Contract can delete all publicKey for a Name, even though a Name has to have at least 1 publicKey"
			);
		});

		it("setNameDefaultPublicKey() - should be able to set a default publicKey for a Name", async function() {
			// Add the publicKey back
			await namefactory.addNamePublicKey(nameId1, someAddress1, { from: account1 });

			var sign = function(privateKey, nameId, publicKey) {
				var signHash = EthCrypto.hash.keccak256([
					{
						type: "address",
						value: namefactory.address
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
				return EthCrypto.vrs.fromString(signature);
			};

			var canSetNameDefaultPublicKey, setNameDefaultPublicKeyEvent;
			try {
				var vrs = sign(account1PrivateKey, nameId1, someAddress1);
				var result = await namefactory.setNameDefaultPublicKey(nameId1, someAddress1, "", vrs.r, vrs.s, { from: account1 });
				canSetNameDefaultPublicKey = true;
				setNameDefaultPublicKeyEvent = result.logs[0];
			} catch (e) {
				canSetNameDefaultPublicKey = false;
				setNameDefaultPublicKeyEvent = null;
			}
			assert.notEqual(canSetNameDefaultPublicKey, true, "Contract can set publicKey as a default without v part of signature");

			try {
				var vrs = sign(account1PrivateKey, nameId1, someAddress1);
				var result = await namefactory.setNameDefaultPublicKey(nameId1, someAddress1, vrs.v, "", vrs.s, { from: account1 });
				canSetNameDefaultPublicKey = true;
				setNameDefaultPublicKeyEvent = result.logs[0];
			} catch (e) {
				canSetNameDefaultPublicKey = false;
				setNameDefaultPublicKeyEvent = null;
			}
			assert.notEqual(canSetNameDefaultPublicKey, true, "Contract can set publicKey as a default without r part of signature");

			try {
				var vrs = sign(account1PrivateKey, nameId1, someAddress1);
				var result = await namefactory.setNameDefaultPublicKey(nameId1, someAddress1, vrs.v, vrs.r, "", { from: account1 });
				canSetNameDefaultPublicKey = true;
				setNameDefaultPublicKeyEvent = result.logs[0];
			} catch (e) {
				canSetNameDefaultPublicKey = false;
				setNameDefaultPublicKeyEvent = null;
			}
			assert.notEqual(canSetNameDefaultPublicKey, true, "Contract can set publicKey as a default without s part of signature");

			try {
				var vrs = sign(account2PrivateKey, nameId1, someAddress1);
				var result = await namefactory.setNameDefaultPublicKey(nameId1, someAddress1, vrs.v, vrs.r, "", { from: account1 });
				canSetNameDefaultPublicKey = true;
				setNameDefaultPublicKeyEvent = result.logs[0];
			} catch (e) {
				canSetNameDefaultPublicKey = false;
				setNameDefaultPublicKeyEvent = null;
			}
			assert.notEqual(canSetNameDefaultPublicKey, true, "Contract can set publicKey as a default with incorrect signature");

			try {
				var vrs = sign(account1PrivateKey, someAddress1, someAddress1);
				var result = await namefactory.setNameDefaultPublicKey(someAddress1, someAddress1, vrs.v, vrs.r, vrs.s, { from: account1 });
				canSetNameDefaultPublicKey = true;
				setNameDefaultPublicKeyEvent = result.logs[0];
			} catch (e) {
				canSetNameDefaultPublicKey = false;
				setNameDefaultPublicKeyEvent = null;
			}
			assert.notEqual(canSetNameDefaultPublicKey, true, "Contract can set publicKey as a default for a non-existing Name");

			try {
				var vrs = sign(account1PrivateKey, nameId1, someAddress2);
				var result = await namefactory.setNameDefaultPublicKey(nameId1, someAddress2, vrs.v, vrs.r, vrs.s, { from: account1 });
				canSetNameDefaultPublicKey = true;
				setNameDefaultPublicKeyEvent = result.logs[0];
			} catch (e) {
				canSetNameDefaultPublicKey = false;
				setNameDefaultPublicKeyEvent = null;
			}
			assert.notEqual(canSetNameDefaultPublicKey, true, "Contract can set non-existing publicKey as a default for a Name");

			try {
				var vrs = sign(account2PrivateKey, nameId1, someAddress1);
				var result = await namefactory.setNameDefaultPublicKey(nameId1, someAddress1, vrs.v, vrs.r, vrs.s, { from: account2 });
				canSetNameDefaultPublicKey = true;
				setNameDefaultPublicKeyEvent = result.logs[0];
			} catch (e) {
				canSetNameDefaultPublicKey = false;
				setNameDefaultPublicKeyEvent = null;
			}
			assert.notEqual(canSetNameDefaultPublicKey, true, "Non-Advocate of Name can set default publicKey");

			var nameBefore = await namefactory.getName(nameId1);

			try {
				var vrs = sign(account1PrivateKey, nameId1, someAddress1);
				var result = await namefactory.setNameDefaultPublicKey(nameId1, someAddress1, vrs.v, vrs.r, vrs.s, { from: account1 });
				canSetNameDefaultPublicKey = true;
				setNameDefaultPublicKeyEvent = result.logs[0];
			} catch (e) {
				canSetNameDefaultPublicKey = false;
				setNameDefaultPublicKeyEvent = null;
			}
			assert.equal(canSetNameDefaultPublicKey, true, "Contract can't set publicKey as default for a Name");

			var nameAfter = await namefactory.getName(nameId1);
			assert.equal(nameAfter[7], someAddress1, "Name has incorrect defautPublicKey");
			assert.equal(nameAfter[8].toNumber(), nameBefore[8].plus(1).toNumber(), "Name has incorrect nonce after set default publicKey");

			assert.equal(setNameDefaultPublicKeyEvent.args.nameId, nameId1, "SetNameDefaultPublicKey event has incorrect nameId");
			assert.equal(
				setNameDefaultPublicKeyEvent.args.publicKey,
				someAddress1,
				"SetNameDefaultPublicKey event has incorrect publicKey"
			);
			assert.equal(
				setNameDefaultPublicKeyEvent.args.nonce.toNumber(),
				nameAfter[8].toNumber(),
				"SetNameDefaultPublicKey event has incorrect nonce"
			);

			// Set Default Public Key back to account1 for next testing
			var vrs = sign(account1PrivateKey, nameId1, account1);
			var result = await namefactory.setNameDefaultPublicKey(nameId1, account1, vrs.v, vrs.r, vrs.s, { from: account1 });
		});

		it("validateNameSignature() - should return true if the signature is valid", async function() {
			var sign = function(privateKey, data, nonce) {
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
				return EthCrypto.vrs.fromString(signature);
			};

			var data = "somestring";
			var name = await namefactory.getName(nameId1);
			var nonce = name[8];
			var vrs = sign(account1PrivateKey, data, nonce.plus(1).toNumber());
			var isValidSignature = await namefactory.validateNameSignature(
				data,
				nonce.plus(1).toNumber(),
				account1,
				"account1",
				vrs.v,
				vrs.r,
				vrs.s
			);
			assert.equal(isValidSignature, true, "validateNameSignature() returns incorrect bool value");

			var isValidSignature = await namefactory.validateNameSignature(
				data,
				nonce.plus(1).toNumber(),
				"",
				"account1",
				vrs.v,
				vrs.r,
				vrs.s
			);
			assert.equal(isValidSignature, true, "validateNameSignature() returns incorrect bool value");

			var isValidSignature = await namefactory.validateNameSignature(
				data,
				nonce.plus(1).toNumber(),
				"",
				"account1",
				"",
				vrs.r,
				vrs.s
			);
			assert.equal(isValidSignature, false, "validateNameSignature() returns true even though it's missing v part of signature");

			var isValidSignature = await namefactory.validateNameSignature(
				data,
				nonce.plus(1).toNumber(),
				"",
				"account1",
				vrs.v,
				"",
				vrs.s
			);
			assert.equal(isValidSignature, false, "validateNameSignature() returns true even though it's missing r part of signature");

			var isValidSignature = await namefactory.validateNameSignature(
				data,
				nonce.plus(1).toNumber(),
				"",
				"account1",
				vrs.v,
				vrs.r,
				""
			);
			assert.equal(isValidSignature, false, "validateNameSignature() returns true even though it's missing s part of signature");

			var isValidSignature = await namefactory.validateNameSignature(
				data,
				nonce.plus(1).toNumber(),
				"",
				"account2",
				vrs.v,
				vrs.r,
				""
			);
			assert.equal(
				isValidSignature,
				false,
				"validateNameSignature() returns true even though signature address is not account's default public key"
			);

			var vrs = sign(account1PrivateKey, data, nonce.toNumber());
			var isValidSignature = await namefactory.validateNameSignature(
				data,
				nonce.toNumber(),
				account1,
				"account1",
				vrs.v,
				vrs.r,
				vrs.s
			);
			assert.equal(isValidSignature, false, "validateNameSignature() returns true even though nonce was incorrect");

			var name = await namefactory.getName(nameId1);
			var nonce = name[8];
			var vrs = sign(account2PrivateKey, data, nonce.plus(1).toNumber());
			var isValidSignature = await namefactory.validateNameSignature(
				data,
				nonce.plus(1).toNumber(),
				account1,
				"account1",
				vrs.v,
				vrs.r,
				vrs.s
			);
			assert.equal(
				isValidSignature,
				false,
				"validateNameSignature() returns true even though the signature address is different from validateAddress"
			);
		});

		it("createTAO() - should be able to create a TAO", async function() {
			var canCreateTAO;
			try {
				await taofactory.createTAO("TAO of " + account5, datHash, database, keyValue, contentId, nameId1, { from: account5 });
				canCreateTAO = true;
			} catch (e) {
				canCreateTAO = false;
			}
			assert.notEqual(canCreateTAO, true, "ETH address with no Name can create a TAO");

			// Create primordial TAO
			taoId1 = await createTAO("TAO ID 1", nameId1, "name", true, account1);

			// Create TAO2 from TAO1 by the same Advocate
			// taoId2 should be child TAO of taoId1
			taoId2 = await createTAO("TAO ID 2", taoId1, "tao", true, account1);

			// Create TAO3 to TAO1 by different Advocate
			// taoId3 should be orphan TAO of taoId1
			taoId3 = await createTAO("TAO ID 3", taoId1, "tao", false, account2);
		});

		it("isExist() - should be able to check whether or not a name exist. Should check both Names and TAOs", async function() {
			var isExist = await nametaolookup.isExist("account100");
			assert.equal(isExist, false, "isExist() returns true even though name is not taken");

			isExist = await nametaolookup.isExist("account1");
			assert.equal(isExist, true, "isExist() returns false even though name is taken");

			isExist = await nametaolookup.isExist("TAO ID 1");
			assert.equal(isExist, true, "isExist() returns false even though name is taken");
		});

		it("getAddressByName() - should return the correct taoId given a TAO's name", async function() {
			var canGetAddressByName;
			try {
				var taoId = await nametaolookup.getAddressByName("somename");
				canGetAddressByName = true;
			} catch (e) {
				canGetAddressByName = false;
			}
			assert.equal(canGetAddressByName, false, "getAddressByName() is successful even though the name is invalid");

			try {
				var taoId = await nametaolookup.getAddressByName("TAO ID 1");
				canGetAddressByName = true;
			} catch (e) {
				canGetAddressByName = false;
			}
			assert.equal(canGetAddressByName, true, "getAddressByName() is not successful even though the name is valid");
			assert.equal(taoId, taoId1, "getAddressByName() returns incorrect nameId");
		});

		it("setTAOAdvocate() - should be able to switch TAO's Advocate", async function() {
			var _newAdvocateId = nameId2;

			var canSetTAOAdvocate, setTAOAdvocateEvent;
			try {
				var result = await taofactory.setTAOAdvocate("someid", _newAdvocateId, { from: account1 });
				setTAOAdvocateEvent = result.logs[0];
				canSetTAOAdvocate = true;
			} catch (e) {
				setTAOAdvocateEvent = null;
				canSetTAOAdvocate = false;
			}
			assert.notEqual(canSetTAOAdvocate, true, "Advocate can set new Advocate on non-existing TAO");

			try {
				var result = await taofactory.setTAOAdvocate(taoId1, "someid", { from: account1 });
				setTAOAdvocateEvent = result.logs[0];
				canSetTAOAdvocate = true;
			} catch (e) {
				setTAOAdvocateEvent = null;
				canSetTAOAdvocate = false;
			}
			assert.notEqual(canSetTAOAdvocate, true, "Advocate can set non-existing Advocate on a TAO");

			try {
				var result = await taofactory.setTAOAdvocate(taoId1, _newAdvocateId, { from: account2 });
				setTAOAdvocateEvent = result.logs[0];
				canSetTAOAdvocate = true;
			} catch (e) {
				setTAOAdvocateEvent = null;
				canSetTAOAdvocate = false;
			}
			assert.notEqual(canSetTAOAdvocate, true, "Non-TAO's advocate can set a new Advocate");

			try {
				var result = await taofactory.setTAOAdvocate(taoId1, _newAdvocateId, { from: account1 });
				setTAOAdvocateEvent = result.logs[0];
				canSetTAOAdvocate = true;
			} catch (e) {
				setTAOAdvocateEvent = null;
				canSetTAOAdvocate = false;
			}
			assert.equal(canSetTAOAdvocate, true, "TAO's advocate can't set a new Advocate");

			var _taoPosition = await taofactory.getTAOPosition(taoId1);
			assert.equal(_taoPosition[0], _newAdvocateId, "TAO has incorrect advocateId after the update");
		});

		it("setTAOListener() - should be able to switch TAO's Listener", async function() {
			var _newListenerId = nameId3;

			var canSetTAOListener, setTAOListenerEvent;
			try {
				var result = await taofactory.setTAOListener("someid", _newListenerId, { from: account2 });
				setTAOListenerEvent = result.logs[0];
				canSetTAOListener = true;
			} catch (e) {
				setTAOListenerEvent = null;
				canSetTAOListener = false;
			}
			assert.notEqual(canSetTAOListener, true, "Advocate can set new Listener on non-existing TAO");

			try {
				var result = await taofactory.setTAOListener(taoId1, "someid", { from: account2 });
				setTAOListenerEvent = result.logs[0];
				canSetTAOListener = true;
			} catch (e) {
				setTAOListenerEvent = null;
				canSetTAOListener = false;
			}
			assert.notEqual(canSetTAOListener, true, "Advocate can set non-existing Listener on a TAO");

			try {
				var result = await taofactory.setTAOListener(taoId1, _newListenerId, { from: account3 });
				setTAOListenerEvent = result.logs[0];
				canSetTAOListener = true;
			} catch (e) {
				setTAOListenerEvent = null;
				canSetTAOListener = false;
			}
			assert.notEqual(canSetTAOListener, true, "Non-TAO's advocate can set a new Listener");

			try {
				var result = await taofactory.setTAOListener(taoId1, _newListenerId, { from: account2 });
				setTAOListenerEvent = result.logs[0];
				canSetTAOListener = true;
			} catch (e) {
				setTAOListenerEvent = null;
				canSetTAOListener = false;
			}
			assert.equal(canSetTAOListener, true, "TAO's advocate can't set a new Listener");

			var _taoPosition = await taofactory.getTAOPosition(taoId1);
			assert.equal(_taoPosition[2], _newListenerId, "TAO has incorrect listenerId after the update");
		});

		it("setTAOSpeaker() - should be able to switch TAO's Speaker", async function() {
			nameId4 = await createName("account4", account4);

			var _newSpeakerId = nameId4;

			var canSetTAOSpeaker, setTAOSpeakerEvent;
			try {
				var result = await taofactory.setTAOSpeaker("someid", _newSpeakerId, { from: account2 });
				setTAOSpeakerEvent = result.logs[0];
				canSetTAOSpeaker = true;
			} catch (e) {
				setTAOSpeakerEvent = null;
				canSetTAOSpeaker = false;
			}
			assert.notEqual(canSetTAOSpeaker, true, "Advocate can set new Speaker on non-existing TAO");

			try {
				var result = await taofactory.setTAOSpeaker(taoId1, "someid", { from: account2 });
				setTAOSpeakerEvent = result.logs[0];
				canSetTAOSpeaker = true;
			} catch (e) {
				setTAOSpeakerEvent = null;
				canSetTAOSpeaker = false;
			}
			assert.notEqual(canSetTAOSpeaker, true, "Advocate can set non-existing Speaker on a TAO");

			try {
				var result = await taofactory.setTAOSpeaker(taoId1, _newSpeakerId, { from: account3 });
				setTAOSpeakerEvent = result.logs[0];
				canSetTAOSpeaker = true;
			} catch (e) {
				setTAOSpeakerEvent = null;
				canSetTAOSpeaker = false;
			}
			assert.notEqual(canSetTAOSpeaker, true, "Non-TAO's advocate can set a new Speaker");

			try {
				var result = await taofactory.setTAOSpeaker(taoId1, _newSpeakerId, { from: account2 });
				setTAOSpeakerEvent = result.logs[0];
				canSetTAOSpeaker = true;
			} catch (e) {
				setTAOSpeakerEvent = null;
				canSetTAOSpeaker = false;
			}
			assert.equal(canSetTAOSpeaker, true, "TAO's advocate can't set a new Speaker");

			var _taoPosition = await taofactory.getTAOPosition(taoId1);
			assert.equal(_taoPosition[4], _newSpeakerId, "TAO has incorrect speakerId after the update");
		});

		it("approveOrphanTAO() - should be able to approve orphan sub TAO of a TAO", async function() {
			var orphanTAOId = taoId3;

			var canApproveOrphanTAO, approveOrphanTAOEvent;
			try {
				var result = await taofactory.approveOrphanTAO("someid", orphanTAOId, { from: account3 });
				approveOrphanTAOEvent = result.logs[0];
				canApproveOrphanTAO = true;
			} catch (e) {
				approveOrphanTAOEvent = null;
				canApproveOrphanTAO = false;
			}
			assert.notEqual(canApproveOrphanTAO, true, "Listener can approve orphan TAO of a non-existing parent TAO");

			try {
				var result = await taofactory.approveOrphanTAO(taoId1, "someid", { from: account3 });
				approveOrphanTAOEvent = result.logs[0];
				canApproveOrphanTAO = true;
			} catch (e) {
				approveOrphanTAOEvent = null;
				canApproveOrphanTAO = false;
			}
			assert.notEqual(canApproveOrphanTAO, true, "Listener can approve non-existing TAO of a parent TAO");

			try {
				var result = await taofactory.approveOrphanTAO(taoId1, taoId2, { from: account3 });
				approveOrphanTAOEvent = result.logs[0];
				canApproveOrphanTAO = true;
			} catch (e) {
				approveOrphanTAOEvent = null;
				canApproveOrphanTAO = false;
			}
			assert.notEqual(canApproveOrphanTAO, true, "Listener can approve non-orphan TAO of a parent TAO");

			try {
				var result = await taofactory.approveOrphanTAO(taoId1, orphanTAOId, { from: account2 });
				approveOrphanTAOEvent = result.logs[0];
				canApproveOrphanTAO = true;
			} catch (e) {
				approveOrphanTAOEvent = null;
				canApproveOrphanTAO = false;
			}
			assert.notEqual(canApproveOrphanTAO, true, "Non-Listener can approve noorphan TAO of a parent TAO");

			try {
				var result = await taofactory.approveOrphanTAO(taoId1, orphanTAOId, { from: account3 });
				approveOrphanTAOEvent = result.logs[0];
				canApproveOrphanTAO = true;
			} catch (e) {
				approveOrphanTAOEvent = null;
				canApproveOrphanTAO = false;
			}
			assert.equal(canApproveOrphanTAO, true, "Listener can't approve noorphan TAO of a parent TAO");

			var isOrphanTAOOfTAO = await taofactory.isOrphanTAOOfTAO(taoId1, orphanTAOId);
			assert.equal(isOrphanTAOOfTAO, false, "TAO is still listed as orphan TAO even though Listener has approved it");

			var isChildTAOOfTAO = await taofactory.isChildTAOOfTAO(taoId1, orphanTAOId);
			assert.equal(isChildTAOOfTAO, true, "Orphan TAO is not listed as child TAO even though Listener has approved it");
		});

		it("stakePosition() - should be able to stake Position on a TAO", async function() {
			var canStakePosition;
			try {
				var result = await taoposition.stakePosition("someid", 800000, { from: account1 });
				canStakePosition = true;
			} catch (e) {
				canStakePosition = false;
			}
			assert.notEqual(canStakePosition, true, "Name can stake Position on non-existing TAO");

			try {
				var result = await taoposition.stakePosition(taoId1, 800000, { from: account5 });
				canStakePosition = true;
			} catch (e) {
				canStakePosition = false;
			}
			assert.notEqual(canStakePosition, true, "Non-Name account can stake Position on a TAO");

			try {
				var result = await taoposition.stakePosition(taoId1, 800000, { from: account1 });
				canStakePosition = true;
			} catch (e) {
				canStakePosition = false;
			}
			assert.equal(canStakePosition, true, "Name can't stake Position on a TAO");

			try {
				var result = await taoposition.stakePosition(taoId1, 800000, { from: account2 });
				canStakePosition = true;
			} catch (e) {
				canStakePosition = false;
			}
			assert.equal(canStakePosition, true, "Name can't stake Position on a TAO");
		});

		it("unstakePosition() - should be able to unstake Position on a TAO", async function() {
			var canUnstakePosition;
			try {
				var result = await taoposition.unstakePosition("someid", 800000, { from: account1 });
				canUnstakePosition = true;
			} catch (e) {
				canUnstakePosition = false;
			}
			assert.notEqual(canUnstakePosition, true, "Name can unstake Position on non-existing TAO");

			try {
				var result = await taoposition.unstakePosition(taoId1, 800000, { from: account5 });
				canUnstakePosition = true;
			} catch (e) {
				canUnstakePosition = false;
			}
			assert.notEqual(canUnstakePosition, true, "Non-Name account can unstake Position on a TAO");

			try {
				var result = await taoposition.unstakePosition(taoId1, 800000, { from: account1 });
				canUnstakePosition = true;
			} catch (e) {
				canUnstakePosition = false;
			}
			assert.equal(canUnstakePosition, true, "Name can't unstake Position on a TAO");

			try {
				var result = await taoposition.unstakePosition(taoId1, 800000, { from: account2 });
				canUnstakePosition = true;
			} catch (e) {
				canUnstakePosition = false;
			}
			assert.equal(canUnstakePosition, true, "Name can't unstake Position on a TAO");
		});

		it("validateTAOSignature() - should return true if the signature is valid", async function() {
			// Set TAO's Advocate back to nameId1 for this test
			await taofactory.setTAOAdvocate(taoId1, nameId1, { from: account2 });

			var sign = function(privateKey, data, nonce) {
				var signHash = EthCrypto.hash.keccak256([
					{
						type: "address",
						value: taofactory.address
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
				return EthCrypto.vrs.fromString(signature);
			};

			var data = "somestring";
			var tao = await taofactory.getTAO(taoId1);
			var taoName = tao[0];
			var nonce = tao[8];
			var vrs = sign(account1PrivateKey, data, nonce.plus(1).toNumber());
			var result = await taofactory.validateTAOSignature(data, nonce.plus(1).toNumber(), account1, taoName, vrs.v, vrs.r, vrs.s);
			assert.equal(
				result[0],
				true,
				"validateTAOSignature() returns false even though validateAddress/signatureAddress is Advocate of TAO"
			);
			assert.equal(result[1], "account1", "validateTAOSignature() returns incorrect Advocate's name");
			assert.equal(result[2].toNumber(), 1, "validateTAOSignature() returns incorrect Name's position");

			var vrs = sign(account3PrivateKey, data, nonce.plus(1).toNumber());
			var result = await taofactory.validateTAOSignature(data, nonce.plus(1).toNumber(), account3, taoName, vrs.v, vrs.r, vrs.s);
			assert.equal(
				result[0],
				true,
				"validateTAOSignature() returns false even though validateAddress/signatureAddress is Listener of TAO"
			);
			assert.equal(result[1], "account3", "validateTAOSignature() returns incorrect Listener's name");
			assert.equal(result[2].toNumber(), 2, "validateTAOSignature() returns incorrect Name's position");

			var vrs = sign(account4PrivateKey, data, nonce.plus(1).toNumber());
			var result = await taofactory.validateTAOSignature(data, nonce.plus(1).toNumber(), account4, taoName, vrs.v, vrs.r, vrs.s);
			assert.equal(
				result[0],
				true,
				"validateTAOSignature() returns false even though validateAddress/signatureAddress is Speaker of TAO"
			);
			assert.equal(result[1], "account4", "validateTAOSignature() returns incorrect Speaker's name");
			assert.equal(result[2].toNumber(), 3, "validateTAOSignature() returns incorrect Name's position");

			var vrs = sign(account1PrivateKey, data, nonce.plus(1).toNumber());
			var result = await taofactory.validateTAOSignature(data, nonce.plus(1).toNumber(), "", taoName, vrs.v, vrs.r, vrs.s);
			assert.equal(result[0], true, "validateTAOSignature() returns false even though signatureAddress is Advocate of TAO");
			assert.equal(result[1], "account1", "validateTAOSignature() returns incorrect Advocate's name");
			assert.equal(result[2].toNumber(), 1, "validateTAOSignature() returns incorrect Name's position");

			var vrs = sign(account3PrivateKey, data, nonce.plus(1).toNumber());
			var result = await taofactory.validateTAOSignature(data, nonce.plus(1).toNumber(), "", taoName, vrs.v, vrs.r, vrs.s);
			assert.equal(result[0], true, "validateTAOSignature() returns false even though signatureAddress is Listener of TAO");
			assert.equal(result[1], "account3", "validateTAOSignature() returns incorrect Listener's name");
			assert.equal(result[2].toNumber(), 2, "validateTAOSignature() returns incorrect Name's position");

			var vrs = sign(account4PrivateKey, data, nonce.plus(1).toNumber());
			var result = await taofactory.validateTAOSignature(data, nonce.plus(1).toNumber(), "", taoName, vrs.v, vrs.r, vrs.s);
			assert.equal(result[0], true, "validateTAOSignature() returns false even though signatureAddress is Speaker of TAO");
			assert.equal(result[1], "account4", "validateTAOSignature() returns incorrect Speaker's name");
			assert.equal(result[2].toNumber(), 3, "validateTAOSignature() returns incorrect Name's position");

			var vrs = sign(account1PrivateKey, data, nonce.toNumber());
			var result = await taofactory.validateTAOSignature(data, nonce.toNumber(), account1, taoName, vrs.v, vrs.r, vrs.s);
			assert.equal(result[0], false, "validateTAOSignature() returns true even though nonce does not match");
			assert.equal(result[1], "", "validateTAOSignature() returns incorrect name");
			assert.equal(result[2].toNumber(), 0, "validateTAOSignature() returns incorrect Name's position");

			var vrs = sign(account2PrivateKey, data, nonce.plus(1).toNumber());
			var result = await taofactory.validateTAOSignature(data, nonce.plus(1).toNumber(), account2, taoName, vrs.v, vrs.r, vrs.s);
			assert.equal(
				result[0],
				false,
				"validateTAOSignature() returns true even though signatureAddress is neither TAO's Advocate/Listener/Speaker"
			);
			assert.equal(result[1], "", "validateTAOSignature() returns incorrect name");
			assert.equal(result[2].toNumber(), 0, "validateTAOSignature() returns incorrect Name's position");

			var vrs = sign(account1PrivateKey, data, nonce.plus(1).toNumber());
			var result = await taofactory.validateTAOSignature(data, nonce.plus(1).toNumber(), account1, taoName, "", vrs.r, vrs.s);
			assert.equal(result[0], false, "validateTAOSignature() returns true even though it's missing the v part of signature");
			assert.equal(result[1], "", "validateTAOSignature() returns incorrect name");
			assert.equal(result[2].toNumber(), 0, "validateTAOSignature() returns incorrect Name's position");

			var vrs = sign(account1PrivateKey, data, nonce.plus(1).toNumber());
			var result = await taofactory.validateTAOSignature(data, nonce.plus(1).toNumber(), account1, taoName, vrs.v, "", vrs.s);
			assert.equal(result[0], false, "validateTAOSignature() returns true even though it's missing the r part of signature");
			assert.equal(result[1], "", "validateTAOSignature() returns incorrect name");
			assert.equal(result[2].toNumber(), 0, "validateTAOSignature() returns incorrect Name's position");

			var vrs = sign(account1PrivateKey, data, nonce.plus(1).toNumber());
			var result = await taofactory.validateTAOSignature(data, nonce.plus(1).toNumber(), account1, taoName, vrs.v, vrs.r, "");
			assert.equal(result[0], false, "validateTAOSignature() returns true even though it's missing the s part of signature");
			assert.equal(result[1], "", "validateTAOSignature() returns incorrect name");
			assert.equal(result[2].toNumber(), 0, "validateTAOSignature() returns incorrect Name's position");
		});
	});
});
