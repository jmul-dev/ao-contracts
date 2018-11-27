var AOBoolSetting = artifacts.require("./AOBoolSetting.sol");

contract("AOBoolSetting", function(accounts) {
	var aoboolsetting;
	var developer = accounts[0];
	var account1 = accounts[1];
	var whitelistedAccount = accounts[2];
	var settingId = 1;
	var settingValue = true;

	before(async function() {
		aoboolsetting = await AOBoolSetting.deployed();
		await aoboolsetting.setWhitelist(whitelistedAccount, true, { from: developer });
	});

	it("only whitelisted address can set pending value", async function() {
		var canSetPendingValue;
		try {
			await aoboolsetting.setPendingValue(settingId, settingValue, { from: account1 });
			canSetPendingValue = true;
		} catch (e) {
			canSetPendingValue = false;
		}
		assert.equal(canSetPendingValue, false, "Non-whitelisted account can set pending value");

		var pendingValueBefore = await aoboolsetting.pendingValue(settingId);
		assert.equal(pendingValueBefore, false, "Contract has incorrect pendingValue for settingId");

		var settingValueBefore = await aoboolsetting.settingValue(settingId);
		assert.equal(settingValueBefore, false, "Contract has incorrect settingValue for settingId");

		try {
			await aoboolsetting.setPendingValue(settingId, settingValue, { from: whitelistedAccount });
			canSetPendingValue = true;
		} catch (e) {
			canSetPendingValue = false;
		}
		assert.equal(canSetPendingValue, true, "Whitelisted account can't set pending value");

		var pendingValueAfter = await aoboolsetting.pendingValue(settingId);
		assert.equal(pendingValueAfter, settingValue, "Contract has incorrect pendingValue for settingId");

		var settingValueAfter = await aoboolsetting.settingValue(settingId);
		assert.equal(settingValueAfter, false, "Contract has incorrect settingValue for settingId");
	});

	it("only whitelisted address can move value from pending to setting", async function() {
		var canMovePendingToSetting;
		try {
			await aoboolsetting.movePendingToSetting(settingId, { from: account1 });
			canMovePendingToSetting = true;
		} catch (e) {
			canMovePendingToSetting = false;
		}
		assert.equal(canMovePendingToSetting, false, "Non-whitelisted account can move value from pending to setting");

		var pendingValueBefore = await aoboolsetting.pendingValue(settingId);
		assert.equal(pendingValueBefore, settingValue, "Contract has incorrect pendingValue for settingId");

		var settingValueBefore = await aoboolsetting.settingValue(settingId);
		assert.equal(settingValueBefore, false, "Contract has incorrect settingValue for settingId");

		try {
			await aoboolsetting.movePendingToSetting(settingId, { from: whitelistedAccount });
			canMovePendingToSetting = true;
		} catch (e) {
			canMovePendingToSetting = false;
		}
		assert.equal(canMovePendingToSetting, true, "Whitelisted account can't move value from pending to setting");

		var pendingValueAfter = await aoboolsetting.pendingValue(settingId);
		assert.equal(pendingValueAfter, false, "Contract has incorrect pendingValue for settingId");

		var settingValueAfter = await aoboolsetting.settingValue(settingId);
		assert.equal(settingValueAfter, settingValue, "Contract has incorrect settingValue for settingId");
	});
});
