var Brain = artifacts.require("./Brain.sol");

contract("Brain", function(accounts) {
	var brain;
	var developer = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var account4 = accounts[4];
	var datHash = "somehash";
	var database = "hyperdb";
	var keyValue = "somevalue";
	var contentId = "somecontentid";

	before(async function() {
		brain = await Brain.deployed();
	});

	contract("Name Function Tests", function() {
		var nameThoughtId1, nameThoughtId2, nameThoughtId3, nameThoughtId4;

		var createName = async function(name, account) {
			var totalNamesBefore = await brain.getTotalNames();

			var canCreateName, createNameEvent, nameThoughtId;
			try {
				var result = await brain.createName(name, datHash, database, keyValue, contentId, { from: account });
				createNameEvent = result.logs[0];
				canCreateName = true;
				nameThoughtId = createNameEvent.args.thoughtId;
			} catch (e) {
				createNameEvent = null;
				canCreateName = false;
				nameThoughtId = null;
			}
			assert.equal(canCreateName, true, "Contract is unable to create Name");

			var totalNamesAfter = await brain.getTotalNames();
			assert.equal(totalNamesAfter.toString(), totalNamesBefore.plus(1).toString(), "Contract has incorrect names length");

			var names = await brain.getNamesThoughtIds(0, totalNamesAfter.toString());
			assert.include(names, nameThoughtId, "Newly created Name's Thought ID is not in the list");

			var _name = await brain.getName(nameThoughtId);
			assert.equal(_name[0], name, "Name has incorrect originName");
			assert.equal(_name[1], account, "Name has incorrect originNameId");
			assert.equal(_name[2], nameThoughtId, "Name has incorrect advocateId");
			assert.equal(_name[3], nameThoughtId, "Name has incorrect listenerId");
			assert.equal(_name[4], nameThoughtId, "Name has incorrect speakerId");
			assert.equal(_name[5], datHash, "Name has incorrect datHash");
			assert.equal(_name[6], database, "Name has incorrect database");
			assert.equal(_name[7], keyValue, "Name has incorrect keyValue");
			assert.equal(web3.toAscii(_name[8]).replace(/\0/g, ""), contentId, "Name has incorrect contentId");
			assert.equal(_name[9].toString(), 1, "Name has incorrect thoughtTypeId");

			return nameThoughtId;
		};

		it("createName()", async function() {
			nameThoughtId1 = await createName("account1", account1);

			try {
				var result = await brain.createName("account1", datHash, database, keyValue, contentId, { from: account1 });
				createNameEvent = result.logs[0];
				canCreateName = true;
			} catch (e) {
				createNameEvent = null;
				canCreateName = false;
			}
			assert.notEqual(canCreateName, true, "Contract is able to create Name even though the `name` has been taken");
		});

		it("setNameAdvocate()", async function() {
			nameThoughtId2 = await createName("account2", account2);

			var _newAdvocateId = nameThoughtId2;

			var canSetNameAdvocate, setNameAdvocateEvent;
			try {
				var result = await brain.setNameAdvocate("someid", _newAdvocateId, { from: account1 });
				setNameAdvocateEvent = result.logs[0];
				canSetNameAdvocate = true;
			} catch (e) {
				setNameAdvocateEvent = null;
				canSetNameAdvocate = false;
			}
			assert.notEqual(canSetNameAdvocate, true, "Advocate can set new Advocate on non-existing Name");

			try {
				var result = await brain.setNameAdvocate(nameThoughtId1, "someid", { from: account1 });
				setNameAdvocateEvent = result.logs[0];
				canSetNameAdvocate = true;
			} catch (e) {
				setNameAdvocateEvent = null;
				canSetNameAdvocate = false;
			}
			assert.notEqual(canSetNameAdvocate, true, "Advocate can set non-existing Advocate to a Name");

			try {
				var result = await brain.setNameAdvocate(nameThoughtId1, _newAdvocateId, { from: account2 });
				setNameAdvocateEvent = result.logs[0];
				canSetNameAdvocate = true;
			} catch (e) {
				setNameAdvocateEvent = null;
				canSetNameAdvocate = false;
			}
			assert.notEqual(canSetNameAdvocate, true, "Non-Name's advocate can set a new Advocate");

			try {
				var result = await brain.setNameAdvocate(nameThoughtId1, _newAdvocateId, { from: account1 });
				setNameAdvocateEvent = result.logs[0];
				canSetNameAdvocate = true;
			} catch (e) {
				setNameAdvocateEvent = null;
				canSetNameAdvocate = false;
			}
			assert.equal(canSetNameAdvocate, true, "Name's advocate can't set a new Advocate");

			var _name = await brain.getName(nameThoughtId1);
			assert.equal(_name[2], _newAdvocateId, "Name has incorrect advocateId after the update");
		});

		it("setNameListener()", async function() {
			nameThoughtId3 = await createName("account3", account3);

			var _newListenerId = nameThoughtId3;

			var canSetNameListener, setNameListenerEvent;
			try {
				var result = await brain.setNameListener("someid", _newListenerId, { from: account2 });
				setNameListenerEvent = result.logs[0];
				canSetNameListener = true;
			} catch (e) {
				setNameListenerEvent = null;
				canSetNameListener = false;
			}
			assert.notEqual(canSetNameListener, true, "Advocate can set new Listener on non-existing Name");

			try {
				var result = await brain.setNameListener(nameThoughtId1, "someid", { from: account2 });
				setNameListenerEvent = result.logs[0];
				canSetNameListener = true;
			} catch (e) {
				setNameListenerEvent = null;
				canSetNameListener = false;
			}
			assert.notEqual(canSetNameListener, true, "Advocate can set non-existing Listener to a Name");

			try {
				var result = await brain.setNameListener(nameThoughtId1, _newListenerId, { from: account3 });
				setNameListenerEvent = result.logs[0];
				canSetNameListener = true;
			} catch (e) {
				setNameListenerEvent = null;
				canSetNameListener = false;
			}
			assert.notEqual(canSetNameListener, true, "Non-Name's advocate can set a new Listener");

			try {
				var result = await brain.setNameListener(nameThoughtId1, _newListenerId, { from: account2 });
				setNameListenerEvent = result.logs[0];
				canSetNameListener = true;
			} catch (e) {
				setNameListenerEvent = null;
				canSetNameListener = false;
			}
			assert.equal(canSetNameListener, true, "Name's advocate can't set a new Listener");

			var _name = await brain.getName(nameThoughtId1);
			assert.equal(_name[3], _newListenerId, "Name has incorrect listenerId after the update");
		});

		it("setNameSpeaker()", async function() {
			nameThoughtId4 = await createName("account4", account4);

			var _newSpeakerId = nameThoughtId4;

			var canSetNameSpeaker, setNameSpeakerEvent;
			try {
				var result = await brain.setNameSpeaker("someid", _newSpeakerId, { from: account2 });
				setNameSpeakerEvent = result.logs[0];
				canSetNameSpeaker = true;
			} catch (e) {
				setNameSpeakerEvent = null;
				canSetNameSpeaker = false;
			}
			assert.notEqual(canSetNameSpeaker, true, "Advocate can set new Speaker on non-existing Name");

			try {
				var result = await brain.setNameSpeaker(nameThoughtId1, "someid", { from: account2 });
				setNameSpeakerEvent = result.logs[0];
				canSetNameSpeaker = true;
			} catch (e) {
				setNameSpeakerEvent = null;
				canSetNameSpeaker = false;
			}
			assert.notEqual(canSetNameSpeaker, true, "Advocate can set non-existing Speaker to a Name");

			try {
				var result = await brain.setNameSpeaker(nameThoughtId1, _newSpeakerId, { from: account3 });
				setNameSpeakerEvent = result.logs[0];
				canSetNameSpeaker = true;
			} catch (e) {
				setNameSpeakerEvent = null;
				canSetNameSpeaker = false;
			}
			assert.notEqual(canSetNameSpeaker, true, "Non-Name's advocate can set a new Speaker");

			try {
				var result = await brain.setNameSpeaker(nameThoughtId1, _newSpeakerId, { from: account2 });
				setNameSpeakerEvent = result.logs[0];
				canSetNameSpeaker = true;
			} catch (e) {
				setNameSpeakerEvent = null;
				canSetNameSpeaker = false;
			}
			assert.equal(canSetNameSpeaker, true, "Name's advocate can't set a new Speaker");

			var _name = await brain.getName(nameThoughtId1);
			assert.equal(_name[4], _newSpeakerId, "Name has incorrect speakerId after the update");
		});
	});
});
