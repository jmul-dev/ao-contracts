var NameFactory = artifacts.require("./NameFactory.sol");
var ThoughtFactory = artifacts.require("./ThoughtFactory.sol");

contract("Name & Thought Factory", function(accounts) {
	var namefactory, thoughtfactory;
	var developer = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var account4 = accounts[4];
	var datHash = "somehash";
	var database = "hyperdb";
	var keyValue = "somevalue";
	var contentId = "somecontentid";

	var nameId1, nameId2, nameId3, nameId4, thoughtId1, thoughtId2, thoughtId3, thoughtId4;

	before(async function() {
		namefactory = await NameFactory.deployed();
		thoughtfactory = await ThoughtFactory.deployed();
	});

	contract("Public Function Tests", function() {
		var createName = async function(name, account) {
			var totalNamesBefore = await namefactory.getTotalNames();

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

			var totalNamesAfter = await namefactory.getTotalNames();
			assert.equal(totalNamesAfter.toString(), totalNamesBefore.plus(1).toString(), "Contract has incorrect names length");

			var names = await namefactory.getNameIds(0, totalNamesAfter.toString());
			assert.include(names, nameId, "Newly created Name ID is not in the list");

			var _name = await namefactory.getName(nameId);
			assert.equal(_name[0], name, "Name has incorrect originName");
			assert.equal(_name[1], account, "Name has incorrect originNameId");
			assert.equal(_name[2], nameId, "Name has incorrect advocateId");
			assert.equal(_name[3], nameId, "Name has incorrect listenerId");
			assert.equal(_name[4], nameId, "Name has incorrect speakerId");
			assert.equal(_name[5], datHash, "Name has incorrect datHash");
			assert.equal(_name[6], database, "Name has incorrect database");
			assert.equal(_name[7], keyValue, "Name has incorrect keyValue");
			assert.equal(web3.toAscii(_name[8]).replace(/\0/g, ""), contentId, "Name has incorrect contentId");
			assert.equal(_name[9].toString(), 1, "Name has incorrect thoughtTypeId");

			return nameId;
		};

		var createThought = async function(advocateId, account) {
			var totalThoughtsBefore = await thoughtfactory.getTotalThoughts();

			var canCreateThought, createThoughtEvent, thoughtId;
			try {
				var result = await thoughtfactory.createThought(advocateId, datHash, database, keyValue, contentId, { from: account });
				createThoughtEvent = result.logs[0];
				canCreateThought = true;
				thoughtId = createThoughtEvent.args.thoughtId;
			} catch (e) {
				createThoughtEvent = null;
				canCreateThought = false;
				thoughtId = null;
			}
			assert.equal(canCreateThought, true, "Advocate is unable to create Thought");

			var totalThoughtsAfter = await thoughtfactory.getTotalThoughts();
			assert.equal(totalThoughtsAfter.toString(), totalThoughtsBefore.plus(1).toString(), "Contract has incorrect thoughts length");

			var thoughts = await thoughtfactory.getThoughtIds(0, totalThoughtsAfter.toString());
			assert.include(thoughts, thoughtId, "Newly created Thought ID is not in the list");

			var _thought = await thoughtfactory.getThought(thoughtId);
			var _advocate = await namefactory.getName(advocateId);
			assert.equal(_thought[0], _advocate[0], "Thought has incorrect originName");
			assert.equal(_thought[1], advocateId, "Thought has incorrect originNameId");
			assert.equal(_thought[2], advocateId, "Thought has incorrect advocateId");
			assert.equal(_thought[3], advocateId, "Thought has incorrect listenerId");
			assert.equal(_thought[4], advocateId, "Thought has incorrect speakerId");
			assert.equal(_thought[5], datHash, "Thought has incorrect datHash");
			assert.equal(_thought[6], database, "Thought has incorrect database");
			assert.equal(_thought[7], keyValue, "Thought has incorrect keyValue");
			assert.equal(web3.toAscii(_thought[8]).replace(/\0/g, ""), contentId, "Thought has incorrect contentId");
			assert.equal(_thought[9].toString(), 0, "Thought has incorrect thoughtTypeId");

			return thoughtId;
		};

		it("createName()", async function() {
			nameId1 = await createName("account1", account1);

			try {
				var result = await namefactory.createName("account1", datHash, database, keyValue, contentId, { from: account1 });
				createNameEvent = result.logs[0];
				canCreateName = true;
			} catch (e) {
				createNameEvent = null;
				canCreateName = false;
			}
			assert.notEqual(canCreateName, true, "Contract is able to create Name even though the `name` has been taken");
		});

		it("isNameTaken()", async function() {
			var isNameTaken = await namefactory.isNameTaken("account2");
			assert.equal(isNameTaken, false, "isNameTaken() returns true even though name is not taken");

			isNameTaken = await namefactory.isNameTaken("account1");
			assert.equal(isNameTaken, true, "isNameTaken() returns false even though name is taken");
		});

		it("setNameAdvocate()", async function() {
			nameId2 = await createName("account2", account2);

			var _newAdvocateId = nameId2;

			var canSetNameAdvocate, setNameAdvocateEvent;
			try {
				var result = await namefactory.setNameAdvocate("someid", _newAdvocateId, { from: account1 });
				setNameAdvocateEvent = result.logs[0];
				canSetNameAdvocate = true;
			} catch (e) {
				setNameAdvocateEvent = null;
				canSetNameAdvocate = false;
			}
			assert.notEqual(canSetNameAdvocate, true, "Advocate can set new Advocate on non-existing Name");

			try {
				var result = await namefactory.setNameAdvocate(nameId1, "someid", { from: account1 });
				setNameAdvocateEvent = result.logs[0];
				canSetNameAdvocate = true;
			} catch (e) {
				setNameAdvocateEvent = null;
				canSetNameAdvocate = false;
			}
			assert.notEqual(canSetNameAdvocate, true, "Advocate can set non-existing Advocate on a Name");

			try {
				var result = await namefactory.setNameAdvocate(nameId1, _newAdvocateId, { from: account2 });
				setNameAdvocateEvent = result.logs[0];
				canSetNameAdvocate = true;
			} catch (e) {
				setNameAdvocateEvent = null;
				canSetNameAdvocate = false;
			}
			assert.notEqual(canSetNameAdvocate, true, "Non-Name's advocate can set a new Advocate");

			try {
				var result = await namefactory.setNameAdvocate(nameId1, _newAdvocateId, { from: account1 });
				setNameAdvocateEvent = result.logs[0];
				canSetNameAdvocate = true;
			} catch (e) {
				setNameAdvocateEvent = null;
				canSetNameAdvocate = false;
			}
			assert.equal(canSetNameAdvocate, true, "Name's advocate can't set a new Advocate");

			var _name = await namefactory.getName(nameId1);
			assert.equal(_name[2], _newAdvocateId, "Name has incorrect advocateId after the update");
		});

		it("setNameListener()", async function() {
			nameId3 = await createName("account3", account3);

			var _newListenerId = nameId3;

			var canSetNameListener, setNameListenerEvent;
			try {
				var result = await namefactory.setNameListener("someid", _newListenerId, { from: account2 });
				setNameListenerEvent = result.logs[0];
				canSetNameListener = true;
			} catch (e) {
				setNameListenerEvent = null;
				canSetNameListener = false;
			}
			assert.notEqual(canSetNameListener, true, "Advocate can set new Listener on non-existing Name");

			try {
				var result = await namefactory.setNameListener(nameId1, "someid", { from: account2 });
				setNameListenerEvent = result.logs[0];
				canSetNameListener = true;
			} catch (e) {
				setNameListenerEvent = null;
				canSetNameListener = false;
			}
			assert.notEqual(canSetNameListener, true, "Advocate can set non-existing Listener on a Name");

			try {
				var result = await namefactory.setNameListener(nameId1, _newListenerId, { from: account3 });
				setNameListenerEvent = result.logs[0];
				canSetNameListener = true;
			} catch (e) {
				setNameListenerEvent = null;
				canSetNameListener = false;
			}
			assert.notEqual(canSetNameListener, true, "Non-Name's advocate can set a new Listener");

			try {
				var result = await namefactory.setNameListener(nameId1, _newListenerId, { from: account2 });
				setNameListenerEvent = result.logs[0];
				canSetNameListener = true;
			} catch (e) {
				setNameListenerEvent = null;
				canSetNameListener = false;
			}
			assert.equal(canSetNameListener, true, "Name's advocate can't set a new Listener");

			var _name = await namefactory.getName(nameId1);
			assert.equal(_name[3], _newListenerId, "Name has incorrect listenerId after the update");
		});

		it("setNameSpeaker()", async function() {
			nameId4 = await createName("account4", account4);

			var _newSpeakerId = nameId4;

			var canSetNameSpeaker, setNameSpeakerEvent;
			try {
				var result = await namefactory.setNameSpeaker("someid", _newSpeakerId, { from: account2 });
				setNameSpeakerEvent = result.logs[0];
				canSetNameSpeaker = true;
			} catch (e) {
				setNameSpeakerEvent = null;
				canSetNameSpeaker = false;
			}
			assert.notEqual(canSetNameSpeaker, true, "Advocate can set new Speaker on non-existing Name");

			try {
				var result = await namefactory.setNameSpeaker(nameId1, "someid", { from: account2 });
				setNameSpeakerEvent = result.logs[0];
				canSetNameSpeaker = true;
			} catch (e) {
				setNameSpeakerEvent = null;
				canSetNameSpeaker = false;
			}
			assert.notEqual(canSetNameSpeaker, true, "Advocate can set non-existing Speaker on a Name");

			try {
				var result = await namefactory.setNameSpeaker(nameId1, _newSpeakerId, { from: account3 });
				setNameSpeakerEvent = result.logs[0];
				canSetNameSpeaker = true;
			} catch (e) {
				setNameSpeakerEvent = null;
				canSetNameSpeaker = false;
			}
			assert.notEqual(canSetNameSpeaker, true, "Non-Name's advocate can set a new Speaker");

			try {
				var result = await namefactory.setNameSpeaker(nameId1, _newSpeakerId, { from: account2 });
				setNameSpeakerEvent = result.logs[0];
				canSetNameSpeaker = true;
			} catch (e) {
				setNameSpeakerEvent = null;
				canSetNameSpeaker = false;
			}
			assert.equal(canSetNameSpeaker, true, "Name's advocate can't set a new Speaker");

			var _name = await namefactory.getName(nameId1);
			assert.equal(_name[4], _newSpeakerId, "Name has incorrect speakerId after the update");
		});

		it("createThought()", async function() {
			var advocateId = nameId1;
			var canCreateThought;
			try {
				await thoughtfactory.createThought("someadvocateid", datHash, database, keyValue, contentId, { from: account1 });
				canCreateThought = true;
			} catch (e) {
				canCreateThought = false;
			}
			assert.notEqual(canCreateThought, true, "Non-existing advocate ID can create a Thought");

			try {
				await thoughtfactory.createThought(advocateId, datHash, database, keyValue, contentId, { from: account2 });
				canCreateThought = true;
			} catch (e) {
				canCreateThought = false;
			}
			assert.notEqual(canCreateThought, true, "Wallet can create a Thought on behalf of other Advocate");

			thoughtId1 = await createThought(advocateId, account1);
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
	});
});
