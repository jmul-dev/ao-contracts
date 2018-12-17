var NameFactory = artifacts.require("./NameFactory.sol");
var ThoughtFactory = artifacts.require("./ThoughtFactory.sol");
var ThoughtPosition = artifacts.require("./ThoughtPosition.sol");
var Position = artifacts.require("./Position.sol");
var EthCrypto = require("eth-crypto");

contract("Name & Thought", function(accounts) {
	var namefactory,
		thoughtfactory,
		thoughtposition,
		position,
		maxSupplyPerName,
		nameId1,
		nameId2,
		nameId3,
		nameId4,
		thoughtId1,
		thoughtId2,
		thoughtId3,
		thoughtId4;
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

	before(async function() {
		namefactory = await NameFactory.deployed();
		thoughtfactory = await ThoughtFactory.deployed();
		thoughtposition = await ThoughtPosition.deployed();
		position = await Position.deployed();

		maxSupplyPerName = await position.MAX_SUPPLY_PER_NAME();
	});

	contract("Public Function Tests", function() {
		var createName = async function(name, account) {
			var totalNamesBefore = await namefactory.getTotalNamesCount();

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

			var totalNamesAfter = await namefactory.getTotalNamesCount();
			assert.equal(totalNamesAfter.toString(), totalNamesBefore.plus(1).toString(), "Contract has incorrect names length");

			var names = await namefactory.getNameIds(0, totalNamesAfter.toString());
			assert.include(names, nameId, "Newly created Name ID is not in the list");

			var _name = await namefactory.getName(nameId);
			assert.equal(_name[0], name, "Name has incorrect originName");
			assert.equal(_name[1], account, "Name has incorrect originNameId");
			assert.equal(_name[2], datHash, "Name has incorrect datHash");
			assert.equal(_name[3], database, "Name has incorrect database");
			assert.equal(_name[4], keyValue, "Name has incorrect keyValue");
			assert.equal(web3.toAscii(_name[5]).replace(/\0/g, ""), contentId, "Name has incorrect contentId");
			assert.equal(_name[6].toString(), 1, "Name has incorrect thoughtTypeId");
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

			return nameId;
		};

		var createThought = async function(from, fromType, sameAdvocate, account) {
			var totalThoughtsBefore = await thoughtfactory.getTotalThoughtsCount();
			var totalSubThoughtsBefore,
				totalChildThoughtsBefore,
				totalChildThoughtsAfter,
				totalOrphanThoughtsBefore,
				totalOrphanThoughtsAfter;
			if (fromType == "thought") {
				totalSubThoughtsBefore = await thoughtfactory.getTotalSubThoughtsCount(from);
				if (sameAdvocate) {
					totalChildThoughtsBefore = await thoughtfactory.getTotalChildThoughtsCount(from);
				} else {
					totalOrphanThoughtsBefore = await thoughtfactory.getTotalOrphanThoughtsCount(from);
				}
			}

			var canCreateThought, createThoughtEvent, addChildThoughtEvent, addOrphanThoughtEvent, thoughtId;
			try {
				var result = await thoughtfactory.createThought(datHash, database, keyValue, contentId, from, { from: account });
				createThoughtEvent = result.logs[0];
				if (fromType == "thought") {
					if (sameAdvocate) {
						addChildThoughtEvent = result.logs[1];
					} else {
						addOrphanThoughtEvent = result.logs[1];
					}
				}
				canCreateThought = true;
				thoughtId = createThoughtEvent.args.thoughtId;
			} catch (e) {
				createThoughtEvent = null;
				addChildThoughtEvent = null;
				addOrphanThoughtEvent = null;
				canCreateThought = false;
				thoughtId = null;
			}
			assert.equal(canCreateThought, true, "Advocate is unable to create Thought");

			var totalThoughtsAfter = await thoughtfactory.getTotalThoughtsCount();
			assert.equal(totalThoughtsAfter.toString(), totalThoughtsBefore.plus(1).toString(), "Contract has incorrect thoughts length");

			var thoughts = await thoughtfactory.getThoughtIds(0, totalThoughtsAfter.minus(1).toString());
			assert.include(thoughts, thoughtId, "Newly created Thought ID is not in the list");

			var _thought = await thoughtfactory.getThought(thoughtId);
			var _advocateId = await namefactory.ethAddressToNameId(account);
			var _advocate = await namefactory.getName(_advocateId);
			assert.equal(_thought[0], _advocate[0], "Thought has incorrect originName");
			assert.equal(_thought[1], _advocateId, "Thought has incorrect originNameId");
			assert.equal(_thought[2], _advocateId, "Thought has incorrect advocateId");
			assert.equal(_thought[3], _advocateId, "Thought has incorrect listenerId");
			assert.equal(_thought[4], _advocateId, "Thought has incorrect speakerId");
			assert.equal(_thought[5], datHash, "Thought has incorrect datHash");
			assert.equal(_thought[6], database, "Thought has incorrect database");
			assert.equal(_thought[7], keyValue, "Thought has incorrect keyValue");
			assert.equal(web3.toAscii(_thought[8]).replace(/\0/g, ""), contentId, "Thought has incorrect contentId");
			assert.equal(_thought[9].toString(), 0, "Thought has incorrect thoughtTypeId");

			var thoughtRelationship = await thoughtfactory.getThoughtRelationship(thoughtId);
			if (fromType == "thought" && !sameAdvocate) {
				assert.equal(thoughtRelationship[0], _advocateId, "Thought has incorrect fromId");
				assert.equal(thoughtRelationship[2], from, "Thought has incorrect toId");
			} else {
				assert.equal(thoughtRelationship[0], from, "Thought has incorrect fromId");
				assert.equal(thoughtRelationship[2], emptyAddress, "Thought has incorrect toId");
			}
			assert.equal(thoughtRelationship[1], emptyAddress, "Thought has incorrect throughId");

			if (fromType == "thought") {
				totalSubThoughtsAfter = await thoughtfactory.getTotalSubThoughtsCount(from);

				assert.equal(
					totalSubThoughtsAfter.toString(),
					totalSubThoughtsBefore.plus(1).toString(),
					"Parent Thought has incorrect count of sub Thoughts"
				);

				var subThoughts = await thoughtfactory.getSubThoughtIds(from, 1, totalSubThoughtsAfter.toString());
				assert.include(subThoughts, thoughtId, "Newly created Thought ID is not in the parent's list of sub Thoughts");
				if (sameAdvocate) {
					assert.notEqual(addChildThoughtEvent, null, "Creating Thought didn't emit AddChildThought event");
					assert.equal(addChildThoughtEvent.args.parentThoughtId, from, "AddChildThought event has incorrect parent Thought ID");
					assert.equal(
						addChildThoughtEvent.args.childThoughtId,
						thoughtId,
						"AddChildThought event has incorrect child Thought ID"
					);

					totalChildThoughtsAfter = await thoughtfactory.getTotalChildThoughtsCount(from);

					assert.equal(
						totalChildThoughtsAfter.toString(),
						totalChildThoughtsBefore.plus(1).toString(),
						"Parent Thought has incorrect count of child Thoughts"
					);

					var isChildThoughtOfThought = await thoughtfactory.isChildThoughtOfThought(from, thoughtId);
					assert.equal(isChildThoughtOfThought, true, "Newly created Thought is not child Thought of `from`");
				} else {
					assert.notEqual(addOrphanThoughtEvent, null, "Creating Thought didn't emit AddOrphanThought event");
					assert.equal(
						addOrphanThoughtEvent.args.parentThoughtId,
						from,
						"AddOrphanThought event has incorrect parent Thought ID"
					);
					assert.equal(
						addOrphanThoughtEvent.args.orphanThoughtId,
						thoughtId,
						"AddOrphanThought event has incorrect orphan Thought ID"
					);

					totalOrphanThoughtsAfter = await thoughtfactory.getTotalOrphanThoughtsCount(from);

					assert.equal(
						totalOrphanThoughtsAfter.toString(),
						totalOrphanThoughtsBefore.plus(1).toString(),
						"Parent Thought has incorrect count of orphan Thoughts"
					);

					var isOrphanThoughtOfThought = await thoughtfactory.isOrphanThoughtOfThought(from, thoughtId);
					assert.equal(isOrphanThoughtOfThought, true, "Newly created Thought is not orphan Thought of `from`");
				}
			}

			var isTAO = await thoughtposition.isTAO(thoughtId);
			assert.equal(isTAO, false, "Thought has incorrect isTAO value");
			return thoughtId;
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

		it("isNameTaken() - should be able to check whether or not a username has been taken", async function() {
			var isNameTaken = await namefactory.isNameTaken("account2");
			assert.equal(isNameTaken, false, "isNameTaken() returns true even though name is not taken");

			isNameTaken = await namefactory.isNameTaken("account1");
			assert.equal(isNameTaken, true, "isNameTaken() returns false even though name is taken");
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
			assert.equal(_namePosition[1], _newListenerId, "Name has incorrect listenerId after the update");
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
			assert.equal(_namePosition[2], _newSpeakerId, "Name has incorrect speakerId after the update");
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

			assert.equal(position[0], nameId1, "getNamePosition() returns incorrect Advocate for a Name");
			assert.equal(position[1], nameId2, "getNamePosition() returns incorrect Listener for a Name");
			assert.equal(position[2], nameId3, "getNamePosition() returns incorrect Speaker for a Name");
		});

		it("getNameIdByOriginName() - should return the correct nameId given a username", async function() {
			var nameId = await namefactory.getNameIdByOriginName("somename");
			assert.equal(nameId, emptyAddress, "getNameIdByOriginName() returns incorrect nameId");

			var nameId = await namefactory.getNameIdByOriginName("account1");
			assert.equal(nameId, nameId1, "getNameIdByOriginName() returns incorrect nameId");
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
		});

		return;

		it("createThought()", async function() {
			var canCreateThought;
			try {
				await thoughtfactory.createThought(datHash, database, keyValue, contentId, nameId1, { from: account5 });
				canCreateThought = true;
			} catch (e) {
				canCreateThought = false;
			}
			assert.notEqual(canCreateThought, true, "ETH address with no Name can create a Thought");

			// Create primordial Thought
			thoughtId1 = await createThought(nameId1, "name", true, account1);

			// Create Thought2 from Thought1 by the same Advocate
			// thoughtId2 should be child Thought of thoughtId1
			thoughtId2 = await createThought(thoughtId1, "thought", true, account1);

			// Create Thought3 to Thought1 by different Advocate
			// thoughtId3 should be orphan Thought of thoughtId1
			thoughtId3 = await createThought(thoughtId1, "thought", false, account2);
		});

		it("setThoughtAdvocate()", async function() {
			var _newAdvocateId = nameId2;

			var canSetThoughtAdvocate, setThoughtAdvocateEvent;
			try {
				var result = await thoughtfactory.setThoughtAdvocate("someid", _newAdvocateId, { from: account1 });
				setThoughtAdvocateEvent = result.logs[0];
				canSetThoughtAdvocate = true;
			} catch (e) {
				setThoughtAdvocateEvent = null;
				canSetThoughtAdvocate = false;
			}
			assert.notEqual(canSetThoughtAdvocate, true, "Advocate can set new Advocate on non-existing Thought");

			try {
				var result = await thoughtfactory.setThoughtAdvocate(thoughtId1, "someid", { from: account1 });
				setThoughtAdvocateEvent = result.logs[0];
				canSetThoughtAdvocate = true;
			} catch (e) {
				setThoughtAdvocateEvent = null;
				canSetThoughtAdvocate = false;
			}
			assert.notEqual(canSetThoughtAdvocate, true, "Advocate can set non-existing Advocate on a Thought");

			try {
				var result = await thoughtfactory.setThoughtAdvocate(thoughtId1, _newAdvocateId, { from: account2 });
				setThoughtAdvocateEvent = result.logs[0];
				canSetThoughtAdvocate = true;
			} catch (e) {
				setThoughtAdvocateEvent = null;
				canSetThoughtAdvocate = false;
			}
			assert.notEqual(canSetThoughtAdvocate, true, "Non-Thought's advocate can set a new Advocate");

			try {
				var result = await thoughtfactory.setThoughtAdvocate(thoughtId1, _newAdvocateId, { from: account1 });
				setThoughtAdvocateEvent = result.logs[0];
				canSetThoughtAdvocate = true;
			} catch (e) {
				setThoughtAdvocateEvent = null;
				canSetThoughtAdvocate = false;
			}
			assert.equal(canSetThoughtAdvocate, true, "Thought's advocate can't set a new Advocate");

			var _thought = await thoughtfactory.getThought(thoughtId1);
			assert.equal(_thought[2], _newAdvocateId, "Thought has incorrect advocateId after the update");
		});

		it("setThoughtListener()", async function() {
			var _newListenerId = nameId3;

			var canSetThoughtListener, setThoughtListenerEvent;
			try {
				var result = await thoughtfactory.setThoughtListener("someid", _newListenerId, { from: account2 });
				setThoughtListenerEvent = result.logs[0];
				canSetThoughtListener = true;
			} catch (e) {
				setThoughtListenerEvent = null;
				canSetThoughtListener = false;
			}
			assert.notEqual(canSetThoughtListener, true, "Advocate can set new Listener on non-existing Thought");

			try {
				var result = await thoughtfactory.setThoughtListener(thoughtId1, "someid", { from: account2 });
				setThoughtListenerEvent = result.logs[0];
				canSetThoughtListener = true;
			} catch (e) {
				setThoughtListenerEvent = null;
				canSetThoughtListener = false;
			}
			assert.notEqual(canSetThoughtListener, true, "Advocate can set non-existing Listener on a Thought");

			try {
				var result = await thoughtfactory.setThoughtListener(thoughtId1, _newListenerId, { from: account3 });
				setThoughtListenerEvent = result.logs[0];
				canSetThoughtListener = true;
			} catch (e) {
				setThoughtListenerEvent = null;
				canSetThoughtListener = false;
			}
			assert.notEqual(canSetThoughtListener, true, "Non-Thought's advocate can set a new Listener");

			try {
				var result = await thoughtfactory.setThoughtListener(thoughtId1, _newListenerId, { from: account2 });
				setThoughtListenerEvent = result.logs[0];
				canSetThoughtListener = true;
			} catch (e) {
				setThoughtListenerEvent = null;
				canSetThoughtListener = false;
			}
			assert.equal(canSetThoughtListener, true, "Thought's advocate can't set a new Listener");

			var _thought = await thoughtfactory.getThought(thoughtId1);
			assert.equal(_thought[3], _newListenerId, "Thought has incorrect listenerId after the update");
		});

		it("setThoughtSpeaker()", async function() {
			nameId4 = await createName("account4", account4);

			var _newSpeakerId = nameId4;

			var canSetThoughtSpeaker, setThoughtSpeakerEvent;
			try {
				var result = await thoughtfactory.setThoughtSpeaker("someid", _newSpeakerId, { from: account2 });
				setThoughtSpeakerEvent = result.logs[0];
				canSetThoughtSpeaker = true;
			} catch (e) {
				setThoughtSpeakerEvent = null;
				canSetThoughtSpeaker = false;
			}
			assert.notEqual(canSetThoughtSpeaker, true, "Advocate can set new Speaker on non-existing Thought");

			try {
				var result = await thoughtfactory.setThoughtSpeaker(thoughtId1, "someid", { from: account2 });
				setThoughtSpeakerEvent = result.logs[0];
				canSetThoughtSpeaker = true;
			} catch (e) {
				setThoughtSpeakerEvent = null;
				canSetThoughtSpeaker = false;
			}
			assert.notEqual(canSetThoughtSpeaker, true, "Advocate can set non-existing Speaker on a Thought");

			try {
				var result = await thoughtfactory.setThoughtSpeaker(thoughtId1, _newSpeakerId, { from: account3 });
				setThoughtSpeakerEvent = result.logs[0];
				canSetThoughtSpeaker = true;
			} catch (e) {
				setThoughtSpeakerEvent = null;
				canSetThoughtSpeaker = false;
			}
			assert.notEqual(canSetThoughtSpeaker, true, "Non-Thought's advocate can set a new Speaker");

			try {
				var result = await thoughtfactory.setThoughtSpeaker(thoughtId1, _newSpeakerId, { from: account2 });
				setThoughtSpeakerEvent = result.logs[0];
				canSetThoughtSpeaker = true;
			} catch (e) {
				setThoughtSpeakerEvent = null;
				canSetThoughtSpeaker = false;
			}
			assert.equal(canSetThoughtSpeaker, true, "Thought's advocate can't set a new Speaker");

			var _thought = await thoughtfactory.getThought(thoughtId1);
			assert.equal(_thought[4], _newSpeakerId, "Thought has incorrect speakerId after the update");
		});

		it("approveOrphanThought()", async function() {
			var orphanThoughtId = thoughtId3;

			var canApproveOrphanThought, approveOrphanThoughtEvent;
			try {
				var result = await thoughtfactory.approveOrphanThought("someid", orphanThoughtId, { from: account3 });
				approveOrphanThoughtEvent = result.logs[0];
				canApproveOrphanThought = true;
			} catch (e) {
				approveOrphanThoughtEvent = null;
				canApproveOrphanThought = false;
			}
			assert.notEqual(canApproveOrphanThought, true, "Listener can approve orphan Thought of a non-existing parent Thought");

			try {
				var result = await thoughtfactory.approveOrphanThought(thoughtId1, "someid", { from: account3 });
				approveOrphanThoughtEvent = result.logs[0];
				canApproveOrphanThought = true;
			} catch (e) {
				approveOrphanThoughtEvent = null;
				canApproveOrphanThought = false;
			}
			assert.notEqual(canApproveOrphanThought, true, "Listener can approve non-existing Thought of a parent Thought");

			try {
				var result = await thoughtfactory.approveOrphanThought(thoughtId1, thoughtId2, { from: account3 });
				approveOrphanThoughtEvent = result.logs[0];
				canApproveOrphanThought = true;
			} catch (e) {
				approveOrphanThoughtEvent = null;
				canApproveOrphanThought = false;
			}
			assert.notEqual(canApproveOrphanThought, true, "Listener can approve non-orphan Thought of a parent Thought");

			try {
				var result = await thoughtfactory.approveOrphanThought(thoughtId1, orphanThoughtId, { from: account2 });
				approveOrphanThoughtEvent = result.logs[0];
				canApproveOrphanThought = true;
			} catch (e) {
				approveOrphanThoughtEvent = null;
				canApproveOrphanThought = false;
			}
			assert.notEqual(canApproveOrphanThought, true, "Non-Listener can approve noorphan Thought of a parent Thought");

			try {
				var result = await thoughtfactory.approveOrphanThought(thoughtId1, orphanThoughtId, { from: account3 });
				approveOrphanThoughtEvent = result.logs[0];
				canApproveOrphanThought = true;
			} catch (e) {
				approveOrphanThoughtEvent = null;
				canApproveOrphanThought = false;
			}
			assert.equal(canApproveOrphanThought, true, "Listener can't approve noorphan Thought of a parent Thought");

			var isOrphanThoughtOfThought = await thoughtfactory.isOrphanThoughtOfThought(thoughtId1, orphanThoughtId);
			assert.equal(isOrphanThoughtOfThought, false, "Thought is still listed as orphan Thought even though Listener has approved it");

			var isChildThoughtOfThought = await thoughtfactory.isChildThoughtOfThought(thoughtId1, orphanThoughtId);
			assert.equal(
				isChildThoughtOfThought,
				true,
				"Orphan Thought is not listed as child Thought even though Listener has approved it"
			);
		});

		it("stakePosition()", async function() {
			var canStakePosition, isTaoEvent;
			try {
				var result = await thoughtposition.stakePosition("someid", 800000, { from: account1 });
				isTaoEvent = result.logs[0];
				canStakePosition = true;
			} catch (e) {
				isTaoEvent = null;
				canStakePosition = false;
			}
			assert.notEqual(canStakePosition, true, "Name can stake Position on non-existing Thought");

			try {
				var result = await thoughtposition.stakePosition(thoughtId1, 800000, { from: account5 });
				isTaoEvent = result.logs[0];
				canStakePosition = true;
			} catch (e) {
				isTaoEvent = null;
				canStakePosition = false;
			}
			assert.notEqual(canStakePosition, true, "Non-Name account can stake Position on a Thought");

			try {
				var result = await thoughtposition.stakePosition(thoughtId1, 800000, { from: account1 });
				isTaoEvent = result.logs[0];
				canStakePosition = true;
			} catch (e) {
				isTaoEvent = null;
				canStakePosition = false;
			}
			assert.equal(canStakePosition, true, "Name can't stake Position on a Thought");
			assert.notEqual(isTaoEvent, null, "Contract is not emitting IsTAO event");

			var isTao = await thoughtposition.isTAO(thoughtId1);
			assert.equal(isTao, true, "Thought is not a TAO even thought it has Position");

			try {
				var result = await thoughtposition.stakePosition(thoughtId1, 800000, { from: account2 });
				isTaoEvent = result.logs[0];
				canStakePosition = true;
			} catch (e) {
				isTaoEvent = null;
				canStakePosition = false;
			}
			assert.equal(canStakePosition, true, "Name can't stake Position on a Thought");
			assert.equal(isTaoEvent, null, "Contract is emitting IsTAO event even though Thought is already a TAO");
		});

		it("unstakePosition()", async function() {
			var canUnstakePosition, isTaoEvent;
			try {
				var result = await thoughtposition.unstakePosition("someid", 800000, { from: account1 });
				isTaoEvent = result.logs[0];
				canUnstakePosition = true;
			} catch (e) {
				isTaoEvent = null;
				canUnstakePosition = false;
			}
			assert.notEqual(canUnstakePosition, true, "Name can unstake Position on non-existing Thought");

			try {
				var result = await thoughtposition.unstakePosition(thoughtId1, 800000, { from: account5 });
				isTaoEvent = result.logs[0];
				canUnstakePosition = true;
			} catch (e) {
				isTaoEvent = null;
				canUnstakePosition = false;
			}
			assert.notEqual(canUnstakePosition, true, "Non-Name account can unstake Position on a Thought");

			try {
				var result = await thoughtposition.unstakePosition(thoughtId1, 800000, { from: account1 });
				isTaoEvent = result.logs[0];
				canUnstakePosition = true;
			} catch (e) {
				isTaoEvent = null;
				canUnstakePosition = false;
			}
			assert.equal(canUnstakePosition, true, "Name can't unstake Position on a Thought");
			assert.equal(isTaoEvent, null, "Contract is emitting IsTAO event even thought there is no changes yet on the status");

			try {
				var result = await thoughtposition.unstakePosition(thoughtId1, 800000, { from: account2 });
				isTaoEvent = result.logs[0];
				canUnstakePosition = true;
			} catch (e) {
				isTaoEvent = null;
				canUnstakePosition = false;
			}
			assert.equal(canUnstakePosition, true, "Name can't unstake Position on a Thought");
			assert.notEqual(isTaoEvent, null, "Contract is not emitting IsTAO event");

			var isTao = await thoughtposition.isTAO(thoughtId1);
			assert.equal(isTao, false, "Thought is a TAO even thought it has no Position");
		});
	});
});
