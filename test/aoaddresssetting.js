var AOAddressSetting = artifacts.require("./AOAddressSetting.sol");

contract("AOAddressSetting", function(accounts) {
	var aoaddresssetting;
	var developer = accounts[0];
	var account1 = accounts[1];
	var whitelistedAccount = accounts[2];
	var settingId = 1;
	var settingValue = accounts[3];
	var emptyAddress = "0x0000000000000000000000000000000000000000";

	before(async function() {
		aoaddresssetting = await AOAddressSetting.deployed();
		await aoaddresssetting.setWhitelist(whitelistedAccount, true, { from: developer });
	});

	it("only whitelisted address can set pending value", async function() {
		var canSetPendingValue;
		try {
			await aoaddresssetting.setPendingValue(settingId, settingValue, { from: account1 });
			canSetPendingValue = true;
		} catch (e) {
			canSetPendingValue = false;
		}
		assert.equal(canSetPendingValue, false, "Non-whitelisted account can set pending value");

		var pendingValueBefore = await aoaddresssetting.pendingValue(settingId);
		assert.equal(pendingValueBefore, emptyAddress, "Contract has incorrect pendingValue for settingId");

		var settingValueBefore = await aoaddresssetting.settingValue(settingId);
		assert.equal(settingValueBefore, emptyAddress, "Contract has incorrect settingValue for settingId");

		try {
			await aoaddresssetting.setPendingValue(settingId, settingValue, { from: whitelistedAccount });
			canSetPendingValue = true;
		} catch (e) {
			canSetPendingValue = false;
		}
		assert.equal(canSetPendingValue, true, "Whitelisted account can't set pending value");

		var pendingValueAfter = await aoaddresssetting.pendingValue(settingId);
		assert.equal(pendingValueAfter, settingValue, "Contract has incorrect pendingValue for settingId");

		var settingValueAfter = await aoaddresssetting.settingValue(settingId);
		assert.equal(settingValueAfter, emptyAddress, "Contract has incorrect settingValue for settingId");
	});

	it("only whitelisted address can move value from pending to setting", async function() {
		var canMovePendingToSetting;
		try {
			await aoaddresssetting.movePendingToSetting(settingId, { from: account1 });
			canMovePendingToSetting = true;
		} catch (e) {
			canMovePendingToSetting = false;
		}
		assert.equal(canMovePendingToSetting, false, "Non-whitelisted account can move value from pending to setting");

		var pendingValueBefore = await aoaddresssetting.pendingValue(settingId);
		assert.equal(pendingValueBefore, settingValue, "Contract has incorrect pendingValue for settingId");

		var settingValueBefore = await aoaddresssetting.settingValue(settingId);
		assert.equal(settingValueBefore, emptyAddress, "Contract has incorrect settingValue for settingId");

		try {
			await aoaddresssetting.movePendingToSetting(settingId, { from: whitelistedAccount });
			canMovePendingToSetting = true;
		} catch (e) {
			canMovePendingToSetting = false;
		}
		assert.equal(canMovePendingToSetting, true, "Whitelisted account can't move value from pending to setting");

		var pendingValueAfter = await aoaddresssetting.pendingValue(settingId);
		assert.equal(pendingValueAfter, emptyAddress, "Contract has incorrect pendingValue for settingId");

		var settingValueAfter = await aoaddresssetting.settingValue(settingId);
		assert.equal(settingValueAfter, settingValue, "Contract has incorrect settingValue for settingId");
	});
});
