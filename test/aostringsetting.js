var AOStringSetting = artifacts.require("./AOStringSetting.sol");

contract("AOStringSetting", function(accounts) {
	var aostringsetting;
	var developer = accounts[0];
	var account1 = accounts[1];
	var whitelistedAccount = accounts[2];
	var settingId = 1000000000;
	var settingValue = "somevalue";

	before(async function() {
		aostringsetting = await AOStringSetting.deployed();
		await aostringsetting.setWhitelist(whitelistedAccount, true, { from: developer });
	});

	it("only whitelisted address can set pending value", async function() {
		var canSetPendingValue;
		try {
			await aostringsetting.setPendingValue(settingId, settingValue, { from: account1 });
			canSetPendingValue = true;
		} catch (e) {
			canSetPendingValue = false;
		}
		assert.equal(canSetPendingValue, false, "Non-whitelisted account can set pending value");

		var pendingValueBefore = await aostringsetting.pendingValue(settingId);
		assert.equal(pendingValueBefore, "", "Contract has incorrect pendingValue for settingId");

		var settingValueBefore = await aostringsetting.settingValue(settingId);
		assert.equal(settingValueBefore, "", "Contract has incorrect settingValue for settingId");

		try {
			await aostringsetting.setPendingValue(settingId, settingValue, { from: whitelistedAccount });
			canSetPendingValue = true;
		} catch (e) {
			canSetPendingValue = false;
		}
		assert.equal(canSetPendingValue, true, "Whitelisted account can't set pending value");

		var pendingValueAfter = await aostringsetting.pendingValue(settingId);
		assert.equal(pendingValueAfter, settingValue, "Contract has incorrect pendingValue for settingId");

		var settingValueAfter = await aostringsetting.settingValue(settingId);
		assert.equal(settingValueAfter, "", "Contract has incorrect settingValue for settingId");
	});

	it("only whitelisted address can move value from pending to setting", async function() {
		var canMovePendingToSetting;
		try {
			await aostringsetting.movePendingToSetting(settingId, { from: account1 });
			canMovePendingToSetting = true;
		} catch (e) {
			canMovePendingToSetting = false;
		}
		assert.equal(canMovePendingToSetting, false, "Non-whitelisted account can move value from pending to setting");

		var pendingValueBefore = await aostringsetting.pendingValue(settingId);
		assert.equal(pendingValueBefore, settingValue, "Contract has incorrect pendingValue for settingId");

		var settingValueBefore = await aostringsetting.settingValue(settingId);
		assert.equal(settingValueBefore, "", "Contract has incorrect settingValue for settingId");

		try {
			await aostringsetting.movePendingToSetting(settingId, { from: whitelistedAccount });
			canMovePendingToSetting = true;
		} catch (e) {
			canMovePendingToSetting = false;
		}
		assert.equal(canMovePendingToSetting, true, "Whitelisted account can't move value from pending to setting");

		var pendingValueAfter = await aostringsetting.pendingValue(settingId);
		assert.equal(pendingValueAfter, "", "Contract has incorrect pendingValue for settingId");

		var settingValueAfter = await aostringsetting.settingValue(settingId);
		assert.equal(settingValueAfter, settingValue, "Contract has incorrect settingValue for settingId");
	});
});
