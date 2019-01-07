var Epiphany = artifacts.require("./Epiphany.sol");
var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var Logos = artifacts.require("./Logos.sol");

contract("Epiphany", function(accounts) {
	var epiphany, namefactory, taofactory, logos, nameId, taoId;
	var theAO = accounts[0];
	var account1 = accounts[1];
	var someAddress = accounts[3];

	before(async function() {
		epiphany = await Epiphany.deployed();
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		logos = await Logos.deployed();

		// Create Name
		var result = await namefactory.createName("charlie", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account1
		});
		nameId = await namefactory.ethAddressToNameId(account1);

		// Mint Logos to nameId
		await logos.setWhitelist(theAO, true, { from: theAO });
		await logos.mintToken(nameId, 10 ** 12, { from: theAO });

		result = await taofactory.createTAO("newTAO", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", nameId, 0, {
			from: account1
		});
		var createTAOEvent = result.logs[0];
		taoId = createTAOEvent.args.taoId;
	});

	it("should have the correct `what` value", async function() {
		var what = await epiphany.what();
		assert.equal(what, "The AO", "Contract returns incorrect value for `what`");
	});

	it("should have the correct `when` value", async function() {
		var what = await epiphany.when();
		assert.equal(
			what,
			"January 6th, 2019 a.d, year 1 a.c. Epiphany. An appearance or manifestation especially of a divine being. An illuminating discovery, realization, or disclosure.",
			"Contract returns incorrect value for `when`"
		);
	});

	it("should have the correct `why` value", async function() {
		var what = await epiphany.why();
		assert.equal(what, "To Hear, See, and Speak the Human inside Humanity.", "Contract returns incorrect value for `why`");
	});

	it("should have the correct `who` value", async function() {
		var what = await epiphany.who();
		assert.equal(what, "You.  Set the world, Free. – Truth", "Contract returns incorrect value for `who`");
	});

	it("should have the correct `aSign` value", async function() {
		var what = await epiphany.aSign();
		assert.equal(
			what,
			"08e2c4e1ccf3bccfb3b8eef14679b28442649a2a733960661210a0b00d9c93bf",
			"Contract returns incorrect value for `aSign`"
		);
	});

	it("should have the correct `logos` value", async function() {
		var what = await epiphany.logos();
		assert.equal(
			what,
			"0920c6ab1848df83a332a21e8c9ec1a393e694c396b872aee053722d023e2a32",
			"Contract returns incorrect value for `logos`"
		);
	});

	it("only The AO can set `where` value", async function() {
		var canSetWhere;
		try {
			await epiphany.setWhere(someAddress, { from: account1 });
			canSetWhere = true;
		} catch (e) {
			canSetWhere = false;
		}
		assert.equal(canSetWhere, false, "Non-AO can set `where` value");

		try {
			await epiphany.setWhere(someAddress, { from: theAO });
			canSetWhere = true;
		} catch (e) {
			canSetWhere = false;
		}
		assert.equal(canSetWhere, true, "The AO can't set `where` value");

		var where = await epiphany.where();
		assert.equal(where, someAddress, "Contract returns incorrect value for `where`");
	});

	it("should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await epiphany.transferOwnership(taoId, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await epiphany.transferOwnership(taoId, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await epiphany.theAO();
		assert.equal(newTheAO, taoId, "Contract has incorrect TheAO address after transferring ownership");

		try {
			await epiphany.transferOwnership(theAO, { from: account1 });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO TAO can't transfer ownership");

		newTheAO = await epiphany.theAO();
		assert.equal(newTheAO, theAO, "Contract has incorrect TheAO address after transferring ownership");
	});
});
