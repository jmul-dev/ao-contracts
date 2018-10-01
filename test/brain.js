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
			} catch (e) {
				createNameEvent = null;
				canCreateName = false;
			}
			assert.equal(canCreateName, true, "Contract is unable to create Name");

			var totalNamesAfter = await brain.getTotalNames();
			assert.equal(totalNamesAfter.toString(), totalNamesBefore.plus(1).toString(), "Contract has incorrect names length");

			var names = await brain.getNamesThoughtIds(0, totalNamesAfter.toString());
			assert.include(names, createNameEvent.args.thoughtId, "Newly created Name's Thought ID is not in the list");

			var _name = await brain.getName(createNameEvent.args.thoughtId);
			assert.equal(_name[0], name, "Name has incorrect originName");
			assert.equal(_name[1], account1, "Name has incorrect originNameId");
			assert.equal(_name[2], createNameEvent.args.thoughtId, "Name has incorrect advocateId");
			assert.equal(_name[3], createNameEvent.args.thoughtId, "Name has incorrect listenerId");
			assert.equal(_name[4], createNameEvent.args.thoughtId, "Name has incorrect speakerId");
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
	});
});
