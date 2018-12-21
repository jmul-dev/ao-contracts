var AOUintSetting = artifacts.require("./AOUintSetting.sol");

contract("AOUintSetting", function(accounts) {
	var aouintsetting;
	var theAO = accounts[0];
	var account1 = accounts[1];
	var whitelistedAccount = accounts[2];
	var settingId = 1000000000;
	var settingValue = 10;

	before(async function() {
		aouintsetting = await AOUintSetting.deployed();
		await aouintsetting.setWhitelist(whitelistedAccount, true, { from: theAO });
	});

	it("only whitelisted address can set pending value", async function() {
		var canSetPendingValue;
		try {
			await aouintsetting.setPendingValue(settingId, settingValue, { from: account1 });
			canSetPendingValue = true;
		} catch (e) {
			canSetPendingValue = false;
		}
		assert.equal(canSetPendingValue, false, "Non-whitelisted account can set pending value");

		var pendingValueBefore = await aouintsetting.pendingValue(settingId);
		assert.equal(pendingValueBefore.toNumber(), 0, "Contract has incorrect pendingValue for settingId");

		var settingValueBefore = await aouintsetting.settingValue(settingId);
		assert.equal(settingValueBefore.toNumber(), 0, "Contract has incorrect settingValue for settingId");

		try {
			await aouintsetting.setPendingValue(settingId, settingValue, { from: whitelistedAccount });
			canSetPendingValue = true;
		} catch (e) {
			canSetPendingValue = false;
		}
		assert.equal(canSetPendingValue, true, "Whitelisted account can't set pending value");

		var pendingValueAfter = await aouintsetting.pendingValue(settingId);
		assert.equal(pendingValueAfter.toNumber(), settingValue, "Contract has incorrect pendingValue for settingId");

		var settingValueAfter = await aouintsetting.settingValue(settingId);
		assert.equal(settingValueAfter.toNumber(), 0, "Contract has incorrect settingValue for settingId");
	});

	it("only whitelisted address can move value from pending to setting", async function() {
		var canMovePendingToSetting;
		try {
			await aouintsetting.movePendingToSetting(settingId, { from: account1 });
			canMovePendingToSetting = true;
		} catch (e) {
			canMovePendingToSetting = false;
		}
		assert.equal(canMovePendingToSetting, false, "Non-whitelisted account can move value from pending to setting");

		var pendingValueBefore = await aouintsetting.pendingValue(settingId);
		assert.equal(pendingValueBefore.toNumber(), settingValue, "Contract has incorrect pendingValue for settingId");

		var settingValueBefore = await aouintsetting.settingValue(settingId);
		assert.equal(settingValueBefore.toNumber(), 0, "Contract has incorrect settingValue for settingId");

		try {
			await aouintsetting.movePendingToSetting(settingId, { from: whitelistedAccount });
			canMovePendingToSetting = true;
		} catch (e) {
			canMovePendingToSetting = false;
		}
		assert.equal(canMovePendingToSetting, true, "Whitelisted account can't move value from pending to setting");

		var pendingValueAfter = await aouintsetting.pendingValue(settingId);
		assert.equal(pendingValueAfter.toNumber(), 0, "Contract has incorrect pendingValue for settingId");

		var settingValueAfter = await aouintsetting.settingValue(settingId);
		assert.equal(settingValueAfter.toNumber(), settingValue, "Contract has incorrect settingValue for settingId");
	});
});
