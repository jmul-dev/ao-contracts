var Brain = artifacts.require("./Brain.sol");

contract("Brain", function(accounts) {
	var brain;
	var developer = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];

	before(async function() {
		brain = await Brain.deployed();
	});

	contract("Name Function Tests", function() {
		var nameThoughtId1, nameThoughtId2;

		it("createName()", async function() {
			var totalNamesBefore = await brain.getTotalNames();

			var name = "account1";
			var datHash = "somehash";
			var database = "hyperdb";
			var keyValue = "somevalue";
			var contentId = "somecontentid";
			var canCreateName, createNameEvent;
			try {
				var result = await brain.createName(name, datHash, database, keyValue, contentId, { from: account1 });
				createNameEvent = result.logs[0];
				canCreateName = true;
				nameThoughtId1 = createNameEvent.args.thoughtId;
			} catch (e) {
				createNameEvent = null;
				canCreateName = false;
				nameThoughtId1 = null;
			}
			assert.equal(canCreateName, true, "Contract is unable to create Name");

			var totalNamesAfter = await brain.getTotalNames();
			assert.equal(totalNamesAfter.toString(), totalNamesBefore.plus(1).toString(), "Contract has incorrect names length");

			var names = await brain.getNamesThoughtIds(0, totalNamesAfter.toString());
			assert.include(names, nameThoughtId1, "Newly created Name's Thought ID is not in the list");

			var _name = await brain.getName(nameThoughtId1);
			assert.equal(_name[0], name, "Name has incorrect originName");
			assert.equal(_name[1], account1, "Name has incorrect originNameId");
			assert.equal(_name[2], nameThoughtId1, "Name has incorrect advocateId");
			assert.equal(_name[3], nameThoughtId1, "Name has incorrect listenerId");
			assert.equal(_name[4], nameThoughtId1, "Name has incorrect speakerId");
			assert.equal(_name[5], datHash, "Name has incorrect datHash");
			assert.equal(_name[6], database, "Name has incorrect database");
			assert.equal(_name[7], keyValue, "Name has incorrect keyValue");
			assert.equal(web3.toAscii(_name[8]).replace(/\0/g, ""), contentId, "Name has incorrect contentId");
			assert.equal(_name[9].toString(), 1, "Name has incorrect thoughtTypeId");

			try {
				var result = await brain.createName(name, datHash, database, keyValue, contentId, { from: account1 });
				createNameEvent = result.logs[0];
				canCreateName = true;
			} catch (e) {
				createNameEvent = null;
				canCreateName = false;
			}
			assert.notEqual(canCreateName, true, "Contract is able to create Name even though the `name` has been taken");
		});

		it("setNameAdvocate()", async function() {
			var name = "account2";
			var datHash = "somehash";
			var database = "hyperdb";
			var keyValue = "somevalue";
			var contentId = "somecontentid";
			var canCreateName, createNameEvent;
			try {
				var result = await brain.createName(name, datHash, database, keyValue, contentId, { from: account2 });
				createNameEvent = result.logs[0];
				canCreateName = true;
				nameThoughtId2 = createNameEvent.args.thoughtId;
			} catch (e) {
				createNameEvent = null;
				canCreateName = false;
				nameThoughtId2 = null;
			}
			assert.equal(canCreateName, true, "Contract is unable to create Name");

			var _name = await brain.getName(nameThoughtId2);
			var _newAdvocateId = _name[2];

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
	});
});
