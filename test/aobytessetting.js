var AOBytesSetting = artifacts.require("./AOBytesSetting.sol");

contract("AOBytesSetting", function(accounts) {
	var aobytessetting;
	var theAO = accounts[0];
	var account1 = accounts[1];
	var whitelistedAccount = accounts[2];
	var settingId = 1000000000;
	var settingValue = "somevalue";
	var nullBytesValue = "0x0000000000000000000000000000000000000000000000000000000000000000";
	var settingValueInBytes = "0x736f6d6576616c75650000000000000000000000000000000000000000000000";

	before(async function() {
		aobytessetting = await AOBytesSetting.deployed();
		await aobytessetting.setWhitelist(whitelistedAccount, true, { from: theAO });
	});

	it("only whitelisted address can set pending value", async function() {
		var canSetPendingValue;
		try {
			await aobytessetting.setPendingValue(settingId, settingValue, { from: account1 });
			canSetPendingValue = true;
		} catch (e) {
			canSetPendingValue = false;
		}
		assert.equal(canSetPendingValue, false, "Non-whitelisted account can set pending value");

		var pendingValueBefore = await aobytessetting.pendingValue(settingId);
		assert.equal(pendingValueBefore, nullBytesValue, "Contract has incorrect pendingValue for settingId");

		var settingValueBefore = await aobytessetting.settingValue(settingId);
		assert.equal(settingValueBefore, nullBytesValue, "Contract has incorrect settingValue for settingId");

		try {
			await aobytessetting.setPendingValue(settingId, settingValue, { from: whitelistedAccount });
			canSetPendingValue = true;
		} catch (e) {
			canSetPendingValue = false;
		}
		assert.equal(canSetPendingValue, true, "Whitelisted account can't set pending value");

		var pendingValueAfter = await aobytessetting.pendingValue(settingId);
		assert.equal(pendingValueAfter, settingValueInBytes, "Contract has incorrect pendingValue for settingId");

		var settingValueAfter = await aobytessetting.settingValue(settingId);
		assert.equal(settingValueAfter, nullBytesValue, "Contract has incorrect settingValue for settingId");
	});

	it("only whitelisted address can move value from pending to setting", async function() {
		var canMovePendingToSetting;
		try {
			await aobytessetting.movePendingToSetting(settingId, { from: account1 });
			canMovePendingToSetting = true;
		} catch (e) {
			canMovePendingToSetting = false;
		}
		assert.equal(canMovePendingToSetting, false, "Non-whitelisted account can move value from pending to setting");

		var pendingValueBefore = await aobytessetting.pendingValue(settingId);
		assert.equal(pendingValueBefore, settingValueInBytes, "Contract has incorrect pendingValue for settingId");

		var settingValueBefore = await aobytessetting.settingValue(settingId);
		assert.equal(settingValueBefore, nullBytesValue, "Contract has incorrect settingValue for settingId");

		try {
			await aobytessetting.movePendingToSetting(settingId, { from: whitelistedAccount });
			canMovePendingToSetting = true;
		} catch (e) {
			canMovePendingToSetting = false;
		}
		assert.equal(canMovePendingToSetting, true, "Whitelisted account can't move value from pending to setting");

		var pendingValueAfter = await aobytessetting.pendingValue(settingId);
		assert.equal(pendingValueAfter, nullBytesValue, "Contract has incorrect pendingValue for settingId");

		var settingValueAfter = await aobytessetting.settingValue(settingId);
		assert.equal(settingValueAfter, settingValueInBytes, "Contract has incorrect settingValue for settingId");
	});
});
