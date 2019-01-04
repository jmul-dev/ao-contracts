var Epiphany = artifacts.require("./Epiphany.sol");

contract("Epiphany", function(accounts) {
	var epiphany;
	var theAO = accounts[0];
	var account1 = accounts[1];
	var someAddress = accounts[2];

	before(async function() {
		epiphany = await Epiphany.deployed();
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
		assert.equal(what, "hashofthewp", "Contract returns incorrect value for `logos`");
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
});
