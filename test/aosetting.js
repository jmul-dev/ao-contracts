var AOSetting = artifacts.require("./AOSetting.sol");
var AOSettingAttribute = artifacts.require("./AOSettingAttribute.sol");
var AOUintSetting = artifacts.require("./AOUintSetting.sol");
var AOBoolSetting = artifacts.require("./AOBoolSetting.sol");
var AOAddressSetting = artifacts.require("./AOAddressSetting.sol");
var AOBytesSetting = artifacts.require("./AOBytesSetting.sol");
var AOStringSetting = artifacts.require("./AOStringSetting.sol");
var NameFactory = artifacts.require("./NameFactory.sol");
var ThoughtFactory = artifacts.require("./ThoughtFactory.sol");

contract("AOSetting", function(accounts) {
	var aosetting,
		aosettingattribute,
		aouintsetting,
		aoboolsetting,
		aoaddresssetting,
		aobytessetting,
		aostringsetting,
		namefactory,
		thoughtfactory,
		primordialName;
	var developer = accounts[0];
	var whitelistedAccount = accounts[9];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];

	var settingName, settingId1, settingId2, settingId3, settingId4, settingId5;
	var creatorThoughtNameId, creatorThoughtId, associatedThoughtNameId, associatedThoughtId, proposalThoughtNameId, proposalThoughtId;
	var extraData = JSON.stringify({ extraVariable: "someValue" });
	var emptyAddress = "0x0000000000000000000000000000000000000000";
	var updateSignature = "somesignature";
	var newSettingId = 4;
	var newSettingContractAddress = accounts[4];

	var nonThoughtId = accounts[9];
	var uintValue = 10;
	var boolValue = true;
	var addressValue = accounts[8];
	var bytesValue = "somebytesvalue";
	var nullBytesValue = "0x0000000000000000000000000000000000000000000000000000000000000000";
	var stringValue = "somestringvalue";

	before(async function() {
		aosetting = await AOSetting.deployed();
		aosettingattribute = await AOSettingAttribute.deployed();
		aouintsetting = await AOUintSetting.deployed();
		aoboolsetting = await AOBoolSetting.deployed();
		aoaddresssetting = await AOAddressSetting.deployed();
		aobytessetting = await AOBytesSetting.deployed();
		aostringsetting = await AOStringSetting.deployed();
		namefactory = await NameFactory.deployed();
		thoughtfactory = await ThoughtFactory.deployed();

		// Create Names
		var result = await namefactory.createName("beta", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account1
		});
		creatorThoughtNameId = await namefactory.ethAddressToNameId(account1);

		result = await namefactory.createName("charlie", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account2
		});
		associatedThoughtNameId = await namefactory.ethAddressToNameId(account2);

		result = await namefactory.createName("delta", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", { from: account3 });
		proposalThoughtNameId = await namefactory.ethAddressToNameId(account3);

		// Create Thoughts
		result = await thoughtfactory.createThought("somedathash", "somedatabase", "somekeyvalue", "somecontentid", creatorThoughtNameId, {
			from: account1
		});
		var createThoughtEvent = result.logs[0];
		creatorThoughtId = createThoughtEvent.args.thoughtId;

		result = await thoughtfactory.createThought("somedathash", "somedatabase", "somekeyvalue", "somecontentid", creatorThoughtNameId, {
			from: account2
		});
		createThoughtEvent = result.logs[0];
		associatedThoughtId = createThoughtEvent.args.thoughtId;

		result = await thoughtfactory.createThought("somedathash", "somedatabase", "somekeyvalue", "somecontentid", creatorThoughtNameId, {
			from: account3
		});
		createThoughtEvent = result.logs[0];
		proposalThoughtId = createThoughtEvent.args.thoughtId;
	});

	it("should be able to add uint setting", async function() {
		settingName = "uintSetting";
		var settingNameExist = await aosetting.settingNameExist(settingName, associatedThoughtId);
		assert.equal(settingNameExist, false, "settingNameExist returns incorrect value");

		var totalSettingBefore = await aosetting.totalSetting();

		var canAdd, settingCreationEvent, associatedThoughtSettingId, creatorThoughtSettingId;
		try {
			var result = await aosetting.addUintSetting(settingName, uintValue, nonThoughtId, associatedThoughtId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId1 = settingCreationEvent.args.settingId;
			associatedThoughtSettingId = settingCreationEvent.args.associatedThoughtSettingId;
			creatorThoughtSettingId = settingCreationEvent.args.creatorThoughtSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId1 = null;
			associatedThoughtSettingId = null;
			creatorThoughtSettingId = null;
		}
		assert.equal(canAdd, false, "Can create setting using invalid Creator Thought");

		try {
			var result = await aosetting.addUintSetting(settingName, uintValue, creatorThoughtId, nonThoughtId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId1 = settingCreationEvent.args.settingId;
			associatedThoughtSettingId = settingCreationEvent.args.associatedThoughtSettingId;
			creatorThoughtSettingId = settingCreationEvent.args.creatorThoughtSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId1 = null;
			associatedThoughtSettingId = null;
			creatorThoughtSettingId = null;
		}
		assert.equal(canAdd, false, "Can create setting using invalid Associated Thought");

		try {
			var result = await aosetting.addUintSetting(settingName, uintValue, creatorThoughtId, associatedThoughtId, extraData, {
				from: account2
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId1 = settingCreationEvent.args.settingId;
			associatedThoughtSettingId = settingCreationEvent.args.associatedThoughtSettingId;
			creatorThoughtSettingId = settingCreationEvent.args.creatorThoughtSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId1 = null;
			associatedThoughtSettingId = null;
			creatorThoughtSettingId = null;
		}
		assert.equal(canAdd, false, "Non-Advocate of Creator Thought can create setting");

		try {
			var result = await aosetting.addUintSetting(settingName, uintValue, creatorThoughtId, associatedThoughtId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId1 = settingCreationEvent.args.settingId;
			associatedThoughtSettingId = settingCreationEvent.args.associatedThoughtSettingId;
			creatorThoughtSettingId = settingCreationEvent.args.creatorThoughtSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId1 = null;
			associatedThoughtSettingId = null;
			creatorThoughtSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator Thought can't create setting");

		var totalSettingAfter = await aosetting.totalSetting();
		assert.equal(
			totalSettingAfter.toNumber(),
			totalSettingBefore.plus(1).toNumber(),
			"Contract has incorrect totalSetting after adding setting"
		);

		var pendingValue = await aouintsetting.pendingValue(settingId1.toNumber());
		assert.equal(pendingValue.toNumber(), uintValue, "Setting has incorrect pendingValue");

		var settingId = await aosetting.getSettingIdByThoughtName(associatedThoughtId, settingName);
		assert.equal(
			settingId.toNumber(),
			settingId1.toNumber(),
			"Contract returns incorrect settingId given an associatedThoughtId and settingName"
		);

		var settingNameExist = await aosetting.settingNameExist(settingName, associatedThoughtId);
		assert.equal(settingNameExist, true, "settingNameExist returns incorrect value");

		assert.notEqual(settingCreationEvent, null, "Contract didn't emit SettingCreation event when adding a uint setting");
		assert.equal(
			settingCreationEvent.args.settingId.toNumber(),
			totalSettingAfter.toNumber(),
			"SettingCreation event has incorrect settingId"
		);
		assert.equal(settingCreationEvent.args.creatorNameId, creatorThoughtNameId, "SettingCreation event has incorrect creatorNameId");
		assert.equal(settingCreationEvent.args.creatorThoughtId, creatorThoughtId, "SettingCreation event has incorrect creatorThoughtId");
		assert.equal(
			settingCreationEvent.args.associatedThoughtId,
			associatedThoughtId,
			"SettingCreation event has incorrect associatedThoughtId"
		);
		assert.equal(settingCreationEvent.args.settingName, settingName, "SettingCreation event has incorrect settingName");
		assert.equal(settingCreationEvent.args.settingType.toNumber(), 1, "SettingCreation event has incorrect settingType");

		var associatedThoughtSetting = await aosettingattribute.getAssociatedThoughtSetting(associatedThoughtSettingId);
		assert.equal(
			associatedThoughtSetting[0],
			associatedThoughtSettingId,
			"getAssociatedThoughtSetting returns incorrect associatedThoughtSettingId"
		);
		assert.equal(associatedThoughtSetting[1], associatedThoughtId, "getAssociatedThoughtSetting returns incorrect associatedThoughtId");
		assert.equal(
			associatedThoughtSetting[2].toNumber(),
			settingId.toNumber(),
			"getAssociatedThoughtSetting returns incorrect settingId"
		);

		var creatorThoughtSetting = await aosettingattribute.getCreatorThoughtSetting(creatorThoughtSettingId);
		assert.equal(
			creatorThoughtSetting[0],
			creatorThoughtSettingId,
			"getCreatorThoughtSetting returns incorrect creatorThoughtSettingId"
		);
		assert.equal(creatorThoughtSetting[1], creatorThoughtId, "getCreatorThoughtSetting returns incorrect creatorThoughtId");
		assert.equal(creatorThoughtSetting[2].toNumber(), settingId.toNumber(), "getCreatorThoughtSetting returns incorrect settingId");
	});

	it("should be able to add bool setting", async function() {
		settingName = "boolSetting";
		var settingNameExist = await aosetting.settingNameExist(settingName, associatedThoughtId);
		assert.equal(settingNameExist, false, "settingNameExist returns incorrect value");

		var totalSettingBefore = await aosetting.totalSetting();

		var canAdd, settingCreationEvent, associatedThoughtSettingId, creatorThoughtSettingId;
		try {
			var result = await aosetting.addBoolSetting(settingName, boolValue, nonThoughtId, associatedThoughtId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId2 = settingCreationEvent.args.settingId;
			associatedThoughtSettingId = settingCreationEvent.args.associatedThoughtSettingId;
			creatorThoughtSettingId = settingCreationEvent.args.creatorThoughtSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId2 = null;
			associatedThoughtSettingId = null;
			creatorThoughtSettingId = null;
		}
		assert.equal(canAdd, false, "Can create setting using invalid Creator Thought");

		try {
			var result = await aosetting.addBoolSetting(settingName, boolValue, creatorThoughtId, nonThoughtId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId2 = settingCreationEvent.args.settingId;
			associatedThoughtSettingId = settingCreationEvent.args.associatedThoughtSettingId;
			creatorThoughtSettingId = settingCreationEvent.args.creatorThoughtSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId2 = null;
			associatedThoughtSettingId = null;
			creatorThoughtSettingId = null;
		}
		assert.equal(canAdd, false, "Can create setting using invalid Associated Thought");

		try {
			var result = await aosetting.addBoolSetting(settingName, boolValue, creatorThoughtId, associatedThoughtId, extraData, {
				from: account2
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId2 = settingCreationEvent.args.settingId;
			associatedThoughtSettingId = settingCreationEvent.args.associatedThoughtSettingId;
			creatorThoughtSettingId = settingCreationEvent.args.creatorThoughtSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId2 = null;
			associatedThoughtSettingId = null;
			creatorThoughtSettingId = null;
		}
		assert.equal(canAdd, false, "Non-Advocate of Creator Thought can create setting");

		try {
			var result = await aosetting.addBoolSetting(settingName, boolValue, creatorThoughtId, associatedThoughtId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId2 = settingCreationEvent.args.settingId;
			associatedThoughtSettingId = settingCreationEvent.args.associatedThoughtSettingId;
			creatorThoughtSettingId = settingCreationEvent.args.creatorThoughtSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId2 = null;
			associatedThoughtSettingId = null;
			creatorThoughtSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator Thought can't create setting");

		var totalSettingAfter = await aosetting.totalSetting();
		assert.equal(
			totalSettingAfter.toNumber(),
			totalSettingBefore.plus(1).toNumber(),
			"Contract has incorrect totalSetting after adding setting"
		);

		var pendingValue = await aoboolsetting.pendingValue(settingId2.toNumber());
		assert.equal(pendingValue, boolValue, "Setting has incorrect pendingValue");

		var settingId = await aosetting.getSettingIdByThoughtName(associatedThoughtId, settingName);
		assert.equal(
			settingId.toNumber(),
			settingId2.toNumber(),
			"Contract returns incorrect settingId given an associatedThoughtId and settingName"
		);

		var settingNameExist = await aosetting.settingNameExist(settingName, associatedThoughtId);
		assert.equal(settingNameExist, true, "settingNameExist returns incorrect value");

		assert.notEqual(settingCreationEvent, null, "Contract didn't emit SettingCreation event when adding a bool setting");
		assert.equal(
			settingCreationEvent.args.settingId.toNumber(),
			totalSettingAfter.toNumber(),
			"SettingCreation event has incorrect settingId"
		);
		assert.equal(settingCreationEvent.args.creatorNameId, creatorThoughtNameId, "SettingCreation event has incorrect creatorNameId");
		assert.equal(settingCreationEvent.args.creatorThoughtId, creatorThoughtId, "SettingCreation event has incorrect creatorThoughtId");
		assert.equal(
			settingCreationEvent.args.associatedThoughtId,
			associatedThoughtId,
			"SettingCreation event has incorrect associatedThoughtId"
		);
		assert.equal(settingCreationEvent.args.settingName, settingName, "SettingCreation event has incorrect settingName");
		assert.equal(settingCreationEvent.args.settingType.toNumber(), 2, "SettingCreation event has incorrect settingType");

		var associatedThoughtSetting = await aosettingattribute.getAssociatedThoughtSetting(associatedThoughtSettingId);
		assert.equal(
			associatedThoughtSetting[0],
			associatedThoughtSettingId,
			"getAssociatedThoughtSetting returns incorrect associatedThoughtSettingId"
		);
		assert.equal(associatedThoughtSetting[1], associatedThoughtId, "getAssociatedThoughtSetting returns incorrect associatedThoughtId");
		assert.equal(
			associatedThoughtSetting[2].toNumber(),
			settingId.toNumber(),
			"getAssociatedThoughtSetting returns incorrect settingId"
		);

		var creatorThoughtSetting = await aosettingattribute.getCreatorThoughtSetting(creatorThoughtSettingId);
		assert.equal(
			creatorThoughtSetting[0],
			creatorThoughtSettingId,
			"getCreatorThoughtSetting returns incorrect creatorThoughtSettingId"
		);
		assert.equal(creatorThoughtSetting[1], creatorThoughtId, "getCreatorThoughtSetting returns incorrect creatorThoughtId");
		assert.equal(creatorThoughtSetting[2].toNumber(), settingId.toNumber(), "getCreatorThoughtSetting returns incorrect settingId");
	});

	it("should be able to add address setting", async function() {
		settingName = "addressSetting";
		var settingNameExist = await aosetting.settingNameExist(settingName, associatedThoughtId);
		assert.equal(settingNameExist, false, "settingNameExist returns incorrect value");

		var totalSettingBefore = await aosetting.totalSetting();

		var canAdd, settingCreationEvent, associatedThoughtSettingId, creatorThoughtSettingId;
		try {
			var result = await aosetting.addAddressSetting(settingName, addressValue, nonThoughtId, associatedThoughtId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId3 = settingCreationEvent.args.settingId;
			associatedThoughtSettingId = settingCreationEvent.args.associatedThoughtSettingId;
			creatorThoughtSettingId = settingCreationEvent.args.creatorThoughtSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId3 = null;
			associatedThoughtSettingId = null;
			creatorThoughtSettingId = null;
		}
		assert.equal(canAdd, false, "Can create setting using invalid Creator Thought");

		try {
			var result = await aosetting.addAddressSetting(settingName, addressValue, creatorThoughtId, nonThoughtId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId3 = settingCreationEvent.args.settingId;
			associatedThoughtSettingId = settingCreationEvent.args.associatedThoughtSettingId;
			creatorThoughtSettingId = settingCreationEvent.args.creatorThoughtSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId3 = null;
			associatedThoughtSettingId = null;
			creatorThoughtSettingId = null;
		}
		assert.equal(canAdd, false, "Can create setting using invalid Associated Thought");

		try {
			var result = await aosetting.addAddressSetting(settingName, addressValue, creatorThoughtId, associatedThoughtId, extraData, {
				from: account2
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId3 = settingCreationEvent.args.settingId;
			associatedThoughtSettingId = settingCreationEvent.args.associatedThoughtSettingId;
			creatorThoughtSettingId = settingCreationEvent.args.creatorThoughtSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId3 = null;
			associatedThoughtSettingId = null;
			creatorThoughtSettingId = null;
		}
		assert.equal(canAdd, false, "Non-Advocate of Creator Thought can create setting");

		try {
			var result = await aosetting.addAddressSetting(settingName, addressValue, creatorThoughtId, associatedThoughtId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId3 = settingCreationEvent.args.settingId;
			associatedThoughtSettingId = settingCreationEvent.args.associatedThoughtSettingId;
			creatorThoughtSettingId = settingCreationEvent.args.creatorThoughtSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId3 = null;
			associatedThoughtSettingId = null;
			creatorThoughtSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator Thought can't create setting");

		var totalSettingAfter = await aosetting.totalSetting();
		assert.equal(
			totalSettingAfter.toNumber(),
			totalSettingBefore.plus(1).toNumber(),
			"Contract has incorrect totalSetting after adding setting"
		);

		var pendingValue = await aoaddresssetting.pendingValue(settingId3.toNumber());
		assert.equal(pendingValue, addressValue, "Setting has incorrect pendingValue");

		var settingId = await aosetting.getSettingIdByThoughtName(associatedThoughtId, settingName);
		assert.equal(
			settingId.toNumber(),
			settingId3.toNumber(),
			"Contract returns incorrect settingId given an associatedThoughtId and settingName"
		);

		var settingNameExist = await aosetting.settingNameExist(settingName, associatedThoughtId);
		assert.equal(settingNameExist, true, "settingNameExist returns incorrect value");

		assert.notEqual(settingCreationEvent, null, "Contract didn't emit SettingCreation event when adding a address setting");
		assert.equal(
			settingCreationEvent.args.settingId.toNumber(),
			totalSettingAfter.toNumber(),
			"SettingCreation event has incorrect settingId"
		);
		assert.equal(settingCreationEvent.args.creatorNameId, creatorThoughtNameId, "SettingCreation event has incorrect creatorNameId");
		assert.equal(settingCreationEvent.args.creatorThoughtId, creatorThoughtId, "SettingCreation event has incorrect creatorThoughtId");
		assert.equal(
			settingCreationEvent.args.associatedThoughtId,
			associatedThoughtId,
			"SettingCreation event has incorrect associatedThoughtId"
		);
		assert.equal(settingCreationEvent.args.settingName, settingName, "SettingCreation event has incorrect settingName");
		assert.equal(settingCreationEvent.args.settingType.toNumber(), 3, "SettingCreation event has incorrect settingType");

		var associatedThoughtSetting = await aosettingattribute.getAssociatedThoughtSetting(associatedThoughtSettingId);
		assert.equal(
			associatedThoughtSetting[0],
			associatedThoughtSettingId,
			"getAssociatedThoughtSetting returns incorrect associatedThoughtSettingId"
		);
		assert.equal(associatedThoughtSetting[1], associatedThoughtId, "getAssociatedThoughtSetting returns incorrect associatedThoughtId");
		assert.equal(
			associatedThoughtSetting[2].toNumber(),
			settingId.toNumber(),
			"getAssociatedThoughtSetting returns incorrect settingId"
		);

		var creatorThoughtSetting = await aosettingattribute.getCreatorThoughtSetting(creatorThoughtSettingId);
		assert.equal(
			creatorThoughtSetting[0],
			creatorThoughtSettingId,
			"getCreatorThoughtSetting returns incorrect creatorThoughtSettingId"
		);
		assert.equal(creatorThoughtSetting[1], creatorThoughtId, "getCreatorThoughtSetting returns incorrect creatorThoughtId");
		assert.equal(creatorThoughtSetting[2].toNumber(), settingId.toNumber(), "getCreatorThoughtSetting returns incorrect settingId");
	});

	it("should be able to add bytes setting", async function() {
		settingName = "bytesSetting";
		var settingNameExist = await aosetting.settingNameExist(settingName, associatedThoughtId);
		assert.equal(settingNameExist, false, "settingNameExist returns incorrect value");

		var totalSettingBefore = await aosetting.totalSetting();

		var canAdd, settingCreationEvent, associatedThoughtSettingId, creatorThoughtSettingId;
		try {
			var result = await aosetting.addBytesSetting(settingName, bytesValue, nonThoughtId, associatedThoughtId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId4 = settingCreationEvent.args.settingId;
			associatedThoughtSettingId = settingCreationEvent.args.associatedThoughtSettingId;
			creatorThoughtSettingId = settingCreationEvent.args.creatorThoughtSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId4 = null;
			associatedThoughtSettingId = null;
			creatorThoughtSettingId = null;
		}
		assert.equal(canAdd, false, "Can create setting using invalid Creator Thought");

		try {
			var result = await aosetting.addBytesSetting(settingName, bytesValue, creatorThoughtId, nonThoughtId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId4 = settingCreationEvent.args.settingId;
			associatedThoughtSettingId = settingCreationEvent.args.associatedThoughtSettingId;
			creatorThoughtSettingId = settingCreationEvent.args.creatorThoughtSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId4 = null;
			associatedThoughtSettingId = null;
			creatorThoughtSettingId = null;
		}
		assert.equal(canAdd, false, "Can create setting using invalid Associated Thought");

		try {
			var result = await aosetting.addBytesSetting(settingName, bytesValue, creatorThoughtId, associatedThoughtId, extraData, {
				from: account2
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId4 = settingCreationEvent.args.settingId;
			associatedThoughtSettingId = settingCreationEvent.args.associatedThoughtSettingId;
			creatorThoughtSettingId = settingCreationEvent.args.creatorThoughtSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId4 = null;
			associatedThoughtSettingId = null;
			creatorThoughtSettingId = null;
		}
		assert.equal(canAdd, false, "Non-Advocate of Creator Thought can create setting");

		try {
			var result = await aosetting.addBytesSetting(settingName, bytesValue, creatorThoughtId, associatedThoughtId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId4 = settingCreationEvent.args.settingId;
			associatedThoughtSettingId = settingCreationEvent.args.associatedThoughtSettingId;
			creatorThoughtSettingId = settingCreationEvent.args.creatorThoughtSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId4 = null;
			associatedThoughtSettingId = null;
			creatorThoughtSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator Thought can't create setting");

		var totalSettingAfter = await aosetting.totalSetting();
		assert.equal(
			totalSettingAfter.toNumber(),
			totalSettingBefore.plus(1).toNumber(),
			"Contract has incorrect totalSetting after adding setting"
		);

		var pendingValue = await aobytessetting.pendingValue(settingId4.toNumber());
		assert.notEqual(pendingValue, nullBytesValue, "Setting has incorrect pendingValue");

		var settingId = await aosetting.getSettingIdByThoughtName(associatedThoughtId, settingName);
		assert.equal(
			settingId.toNumber(),
			settingId4.toNumber(),
			"Contract returns incorrect settingId given an associatedThoughtId and settingName"
		);

		var settingNameExist = await aosetting.settingNameExist(settingName, associatedThoughtId);
		assert.equal(settingNameExist, true, "settingNameExist returns incorrect value");

		assert.notEqual(settingCreationEvent, null, "Contract didn't emit SettingCreation event when adding a bytes setting");
		assert.equal(
			settingCreationEvent.args.settingId.toNumber(),
			totalSettingAfter.toNumber(),
			"SettingCreation event has incorrect settingId"
		);
		assert.equal(settingCreationEvent.args.creatorNameId, creatorThoughtNameId, "SettingCreation event has incorrect creatorNameId");
		assert.equal(settingCreationEvent.args.creatorThoughtId, creatorThoughtId, "SettingCreation event has incorrect creatorThoughtId");
		assert.equal(
			settingCreationEvent.args.associatedThoughtId,
			associatedThoughtId,
			"SettingCreation event has incorrect associatedThoughtId"
		);
		assert.equal(settingCreationEvent.args.settingName, settingName, "SettingCreation event has incorrect settingName");
		assert.equal(settingCreationEvent.args.settingType.toNumber(), 4, "SettingCreation event has incorrect settingType");

		var associatedThoughtSetting = await aosettingattribute.getAssociatedThoughtSetting(associatedThoughtSettingId);
		assert.equal(
			associatedThoughtSetting[0],
			associatedThoughtSettingId,
			"getAssociatedThoughtSetting returns incorrect associatedThoughtSettingId"
		);
		assert.equal(associatedThoughtSetting[1], associatedThoughtId, "getAssociatedThoughtSetting returns incorrect associatedThoughtId");
		assert.equal(
			associatedThoughtSetting[2].toNumber(),
			settingId.toNumber(),
			"getAssociatedThoughtSetting returns incorrect settingId"
		);

		var creatorThoughtSetting = await aosettingattribute.getCreatorThoughtSetting(creatorThoughtSettingId);
		assert.equal(
			creatorThoughtSetting[0],
			creatorThoughtSettingId,
			"getCreatorThoughtSetting returns incorrect creatorThoughtSettingId"
		);
		assert.equal(creatorThoughtSetting[1], creatorThoughtId, "getCreatorThoughtSetting returns incorrect creatorThoughtId");
		assert.equal(creatorThoughtSetting[2].toNumber(), settingId.toNumber(), "getCreatorThoughtSetting returns incorrect settingId");
	});

	it("should be able to add string setting", async function() {
		settingName = "stringSetting";
		var settingNameExist = await aosetting.settingNameExist(settingName, associatedThoughtId);
		assert.equal(settingNameExist, false, "settingNameExist returns incorrect value");

		var totalSettingBefore = await aosetting.totalSetting();

		var canAdd, settingCreationEvent, associatedThoughtSettingId, creatorThoughtSettingId;
		try {
			var result = await aosetting.addStringSetting(settingName, stringValue, nonThoughtId, associatedThoughtId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId5 = settingCreationEvent.args.settingId;
			associatedThoughtSettingId = settingCreationEvent.args.associatedThoughtSettingId;
			creatorThoughtSettingId = settingCreationEvent.args.creatorThoughtSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId5 = null;
			associatedThoughtSettingId = null;
			creatorThoughtSettingId = null;
		}
		assert.equal(canAdd, false, "Can create setting using invalid Creator Thought");

		try {
			var result = await aosetting.addStringSetting(settingName, stringValue, creatorThoughtId, nonThoughtId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId5 = settingCreationEvent.args.settingId;
			associatedThoughtSettingId = settingCreationEvent.args.associatedThoughtSettingId;
			creatorThoughtSettingId = settingCreationEvent.args.creatorThoughtSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId5 = null;
			associatedThoughtSettingId = null;
			creatorThoughtSettingId = null;
		}
		assert.equal(canAdd, false, "Can create setting using invalid Associated Thought");

		try {
			var result = await aosetting.addStringSetting(settingName, stringValue, creatorThoughtId, associatedThoughtId, extraData, {
				from: account2
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId5 = settingCreationEvent.args.settingId;
			associatedThoughtSettingId = settingCreationEvent.args.associatedThoughtSettingId;
			creatorThoughtSettingId = settingCreationEvent.args.creatorThoughtSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId5 = null;
			associatedThoughtSettingId = null;
			creatorThoughtSettingId = null;
		}
		assert.equal(canAdd, false, "Non-Advocate of Creator Thought can create setting");

		try {
			var result = await aosetting.addStringSetting(settingName, stringValue, creatorThoughtId, associatedThoughtId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId5 = settingCreationEvent.args.settingId;
			associatedThoughtSettingId = settingCreationEvent.args.associatedThoughtSettingId;
			creatorThoughtSettingId = settingCreationEvent.args.creatorThoughtSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId5 = null;
			associatedThoughtSettingId = null;
			creatorThoughtSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator Thought can't create setting");

		var totalSettingAfter = await aosetting.totalSetting();
		assert.equal(
			totalSettingAfter.toNumber(),
			totalSettingBefore.plus(1).toNumber(),
			"Contract has incorrect totalSetting after adding setting"
		);

		var pendingValue = await aostringsetting.pendingValue(settingId5.toNumber());
		assert.equal(pendingValue, stringValue, "Setting has incorrect pendingValue");

		var settingId = await aosetting.getSettingIdByThoughtName(associatedThoughtId, settingName);
		assert.equal(
			settingId.toNumber(),
			settingId5.toNumber(),
			"Contract returns incorrect settingId given an associatedThoughtId and settingName"
		);

		var settingNameExist = await aosetting.settingNameExist(settingName, associatedThoughtId);
		assert.equal(settingNameExist, true, "settingNameExist returns incorrect value");

		assert.notEqual(settingCreationEvent, null, "Contract didn't emit SettingCreation event when adding a string setting");
		assert.equal(
			settingCreationEvent.args.settingId.toNumber(),
			totalSettingAfter.toNumber(),
			"SettingCreation event has incorrect settingId"
		);
		assert.equal(settingCreationEvent.args.creatorNameId, creatorThoughtNameId, "SettingCreation event has incorrect creatorNameId");
		assert.equal(settingCreationEvent.args.creatorThoughtId, creatorThoughtId, "SettingCreation event has incorrect creatorThoughtId");
		assert.equal(
			settingCreationEvent.args.associatedThoughtId,
			associatedThoughtId,
			"SettingCreation event has incorrect associatedThoughtId"
		);
		assert.equal(settingCreationEvent.args.settingName, settingName, "SettingCreation event has incorrect settingName");
		assert.equal(settingCreationEvent.args.settingType.toNumber(), 5, "SettingCreation event has incorrect settingType");

		var associatedThoughtSetting = await aosettingattribute.getAssociatedThoughtSetting(associatedThoughtSettingId);
		assert.equal(
			associatedThoughtSetting[0],
			associatedThoughtSettingId,
			"getAssociatedThoughtSetting returns incorrect associatedThoughtSettingId"
		);
		assert.equal(associatedThoughtSetting[1], associatedThoughtId, "getAssociatedThoughtSetting returns incorrect associatedThoughtId");
		assert.equal(
			associatedThoughtSetting[2].toNumber(),
			settingId.toNumber(),
			"getAssociatedThoughtSetting returns incorrect settingId"
		);

		var creatorThoughtSetting = await aosettingattribute.getCreatorThoughtSetting(creatorThoughtSettingId);
		assert.equal(
			creatorThoughtSetting[0],
			creatorThoughtSettingId,
			"getCreatorThoughtSetting returns incorrect creatorThoughtSettingId"
		);
		assert.equal(creatorThoughtSetting[1], creatorThoughtId, "getCreatorThoughtSetting returns incorrect creatorThoughtId");
		assert.equal(creatorThoughtSetting[2].toNumber(), settingId.toNumber(), "getCreatorThoughtSetting returns incorrect settingId");
	});

	it("only the Advocate of setting's Associated Thought can approve/reject setting creation", async function() {
		var canApprove, approveSettingCreationEvent;
		try {
			var result = await aosetting.approveSettingCreation(99, true, { from: account1 });
			canApprove = true;
			approveSettingCreationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingCreationEvent = null;
		}
		assert.equal(canApprove, false, "Advocate can approve non-existing setting creation");

		try {
			var result = await aosetting.approveSettingCreation(settingId1, true, { from: account1 });
			canApprove = true;
			approveSettingCreationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingCreationEvent = null;
		}
		assert.equal(canApprove, false, "Non-Advocate of setting's Associated Thought can approve setting creation");

		// Approve settingId1
		try {
			var result = await aosetting.approveSettingCreation(settingId1, true, { from: account2 });
			canApprove = true;
			approveSettingCreationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingCreationEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Associated Thought can't approve setting creation");

		assert.equal(
			approveSettingCreationEvent.args.settingId.toNumber(),
			settingId1.toNumber(),
			"ApproveSettingCreation has incorrect settingId"
		);
		assert.equal(
			approveSettingCreationEvent.args.associatedThoughtId,
			associatedThoughtId,
			"ApproveSettingCreation has incorrect associatedThoughtId"
		);
		assert.equal(
			approveSettingCreationEvent.args.associatedThoughtAdvocate,
			associatedThoughtNameId,
			"ApproveSettingCreation has incorrect associatedThoughtAdvocate"
		);
		assert.equal(approveSettingCreationEvent.args.approved, true, "ApproveSettingCreation has incorrect approved");

		// Reject settingId2
		try {
			var result = await aosetting.approveSettingCreation(settingId2, false, { from: account2 });
			canApprove = true;
			approveSettingCreationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingCreationEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Associated Thought can't approve setting creation");

		assert.equal(
			approveSettingCreationEvent.args.settingId.toNumber(),
			settingId2.toNumber(),
			"ApproveSettingCreation has incorrect settingId"
		);
		assert.equal(
			approveSettingCreationEvent.args.associatedThoughtId,
			associatedThoughtId,
			"ApproveSettingCreation has incorrect associatedThoughtId"
		);
		assert.equal(
			approveSettingCreationEvent.args.associatedThoughtAdvocate,
			associatedThoughtNameId,
			"ApproveSettingCreation has incorrect associatedThoughtAdvocate"
		);
		assert.equal(approveSettingCreationEvent.args.approved, false, "ApproveSettingCreation has incorrect approved");

		var canGetSettingIdByThoughtName;
		try {
			await aosetting.getSettingIdByThoughtName(associatedThoughtId, "boolSetting");
			canGetSettingIdByThoughtName = true;
		} catch (e) {
			canGetSettingIdByThoughtName = false;
		}
		assert.equal(
			canGetSettingIdByThoughtName,
			false,
			"canGetSettingIdByThoughtName() is successful even though setting creation is rejected"
		);
	});

	it("only the Advocate of setting's Creator Thought can finalize setting creation", async function() {
		var canFinalize, finalizeSettingCreationEvent;
		try {
			var result = await aosetting.finalizeSettingCreation(99, { from: account1 });
			canFinalize = true;
			finalizeSettingCreationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingCreationEvent = null;
		}
		assert.equal(canFinalize, false, "Advocate can finalize non-existing setting creation");

		try {
			var result = await aosetting.finalizeSettingCreation(settingId1, { from: account2 });
			canFinalize = true;
			finalizeSettingCreationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingCreationEvent = null;
		}
		assert.equal(canFinalize, false, "Non-Advocate of Creator Thought can finalize non-existing setting creation");

		try {
			var result = await aosetting.finalizeSettingCreation(settingId3, { from: account1 });
			canFinalize = true;
			finalizeSettingCreationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingCreationEvent = null;
		}
		assert.equal(canFinalize, false, "Advocate can finalize non-approved setting creation");

		try {
			var result = await aosetting.finalizeSettingCreation(settingId2, { from: account1 });
			canFinalize = true;
			finalizeSettingCreationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingCreationEvent = null;
		}
		assert.equal(canFinalize, false, "Advocate can finalize rejected setting creation");

		try {
			var result = await aosetting.finalizeSettingCreation(settingId1, { from: account1 });
			canFinalize = true;
			finalizeSettingCreationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingCreationEvent = null;
		}
		assert.equal(canFinalize, true, "Advocate can't finalize rejected setting creation");

		var pendingValue = await aouintsetting.pendingValue(settingId1.toNumber());
		assert.equal(pendingValue.toNumber(), 0, "Setting has incorrect pendingValue");

		var settingValue = await aouintsetting.settingValue(settingId1.toNumber());
		assert.equal(settingValue.toNumber(), uintValue, "Setting has incorrect settingValue");

		assert.equal(
			finalizeSettingCreationEvent.args.settingId.toNumber(),
			settingId1.toNumber(),
			"FinalizeSettingCreation event has incorrect settingId"
		);
		assert.equal(
			finalizeSettingCreationEvent.args.creatorThoughtId,
			creatorThoughtId,
			"FinalizeSettingCreation event has incorrect creatorThoughtId"
		);
		assert.equal(
			finalizeSettingCreationEvent.args.creatorThoughtAdvocate,
			creatorThoughtNameId,
			"FinalizeSettingCreation event has incorrect creatorThoughtAdvocate"
		);
	});
});
