var AOSetting = artifacts.require("./AOSetting.sol");
var AOSettingAttribute = artifacts.require("./AOSettingAttribute.sol");
var AOUintSetting = artifacts.require("./AOUintSetting.sol");
var AOBoolSetting = artifacts.require("./AOBoolSetting.sol");
var AOAddressSetting = artifacts.require("./AOAddressSetting.sol");
var AOBytesSetting = artifacts.require("./AOBytesSetting.sol");
var AOStringSetting = artifacts.require("./AOStringSetting.sol");
var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");

contract("AOSetting", function(accounts) {
	var aosetting,
		aosettingattribute,
		aouintsetting,
		aoboolsetting,
		aoaddresssetting,
		aobytessetting,
		aostringsetting,
		namefactory,
		taofactory;
	var developer = accounts[0];
	var whitelistedAccount = accounts[9];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];

	var settingName,
		settingId1, // uintSetting
		settingId2, // boolSetting
		settingId3, // addressSetting
		settingId4, // bytesSetting
		settingId5, // stringSetting
		settingId6, // uintSetting2 (to be rejected)
		settingId7, // boolSetting2 (to be rejected)
		settingId8, // addressSetting2 (to be rejected)
		settingId9, // bytesSetting2 (to be rejected)
		settingId10, // stringSetting2 (to be rejected)
		settingId11, // non-approved uint setting
		settingId12, // non-approved bool setting
		settingId13, // non-approved address setting
		settingId14, // non-approved bytes setting
		settingId15, // non-approved string setting
		settingId16, // approved uint setting
		settingId17, // approved bool setting
		settingId18, // approved address setting
		settingId19, // approved bytes setting
		settingId20; // approved string setting

	var creatorTAONameId, creatorTAOId, associatedTAONameId, associatedTAOId, proposalTAONameId, proposalTAOId;
	var extraData = JSON.stringify({ extraVariable: "someValue" });
	var emptyAddress = "0x0000000000000000000000000000000000000000";
	var updateSignature = "somesignature";
	var newSettingId = 4;
	var newSettingContractAddress = accounts[4];

	var nonTAOId = accounts[9];
	var uintValue = 10;
	var boolValue = true;
	var addressValue = accounts[8];
	var bytesValue = "somebytesvalue";
	var nullBytesValue = "0x0000000000000000000000000000000000000000000000000000000000000000";
	var stringValue = "somestringvalue";

	var updateSignature = "somesignature";
	var newSettingContractAddress = accounts[7];

	before(async function() {
		aosetting = await AOSetting.deployed();
		aosettingattribute = await AOSettingAttribute.deployed();
		aouintsetting = await AOUintSetting.deployed();
		aoboolsetting = await AOBoolSetting.deployed();
		aoaddresssetting = await AOAddressSetting.deployed();
		aobytessetting = await AOBytesSetting.deployed();
		aostringsetting = await AOStringSetting.deployed();
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();

		// Create Names
		var result = await namefactory.createName("charlie", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account1
		});
		creatorTAONameId = await namefactory.ethAddressToNameId(account1);

		result = await namefactory.createName("delta", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account2
		});
		associatedTAONameId = await namefactory.ethAddressToNameId(account2);

		result = await namefactory.createName("echo", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", { from: account3 });
		proposalTAONameId = await namefactory.ethAddressToNameId(account3);

		// Create TAOs
		result = await taofactory.createTAO(
			"creatorTAOId",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			"somecontentid",
			creatorTAONameId,
			{
				from: account1
			}
		);
		var createTAOEvent = result.logs[0];
		creatorTAOId = createTAOEvent.args.taoId;

		result = await taofactory.createTAO(
			"associatedTAOId",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			"somecontentid",
			creatorTAONameId,
			{
				from: account2
			}
		);
		createTAOEvent = result.logs[0];
		associatedTAOId = createTAOEvent.args.taoId;

		result = await taofactory.createTAO(
			"proposalTAOId",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			"somecontentid",
			creatorTAONameId,
			{
				from: account3
			}
		);
		createTAOEvent = result.logs[0];
		proposalTAOId = createTAOEvent.args.taoId;
	});

	it("only the Advocate of a Creator TAO can add uint setting", async function() {
		settingName = "uintSetting";
		var settingNameExist = await aosetting.settingNameExist(settingName, associatedTAOId);
		assert.equal(settingNameExist, false, "settingNameExist returns incorrect value");

		var totalSettingBefore = await aosetting.totalSetting();

		var canAdd, settingCreationEvent, associatedTAOSettingId, creatorTAOSettingId;
		try {
			var result = await aosetting.addUintSetting(settingName, uintValue, nonTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId1 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId1 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, false, "Can create setting using invalid Creator TAO");

		try {
			var result = await aosetting.addUintSetting(settingName, uintValue, creatorTAOId, nonTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId1 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId1 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, false, "Can create setting using invalid Associated TAO");

		try {
			var result = await aosetting.addUintSetting(settingName, uintValue, creatorTAOId, associatedTAOId, extraData, {
				from: account2
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId1 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId1 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, false, "Non-Advocate of Creator TAO can create setting");

		try {
			var result = await aosetting.addUintSetting(settingName, uintValue, creatorTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId1 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId1 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator TAO can't create setting");

		var totalSettingAfter = await aosetting.totalSetting();
		assert.equal(
			totalSettingAfter.toNumber(),
			totalSettingBefore.plus(1).toNumber(),
			"Contract has incorrect totalSetting after adding setting"
		);

		var pendingValue = await aouintsetting.pendingValue(settingId1.toNumber());
		assert.equal(pendingValue.toNumber(), uintValue, "Setting has incorrect pendingValue");

		var settingId = await aosetting.getSettingIdByTAOName(associatedTAOId, settingName);
		assert.equal(
			settingId.toNumber(),
			settingId1.toNumber(),
			"Contract returns incorrect settingId given an associatedTAOId and settingName"
		);

		var settingNameExist = await aosetting.settingNameExist(settingName, associatedTAOId);
		assert.equal(settingNameExist, true, "settingNameExist returns incorrect value");

		assert.notEqual(settingCreationEvent, null, "Contract didn't emit SettingCreation event when adding a uint setting");
		assert.equal(
			settingCreationEvent.args.settingId.toNumber(),
			totalSettingAfter.toNumber(),
			"SettingCreation event has incorrect settingId"
		);
		assert.equal(settingCreationEvent.args.creatorNameId, creatorTAONameId, "SettingCreation event has incorrect creatorNameId");
		assert.equal(settingCreationEvent.args.creatorTAOId, creatorTAOId, "SettingCreation event has incorrect creatorTAOId");
		assert.equal(settingCreationEvent.args.associatedTAOId, associatedTAOId, "SettingCreation event has incorrect associatedTAOId");
		assert.equal(settingCreationEvent.args.settingName, settingName, "SettingCreation event has incorrect settingName");
		assert.equal(settingCreationEvent.args.settingType.toNumber(), 1, "SettingCreation event has incorrect settingType");

		var associatedTAOSetting = await aosettingattribute.getAssociatedTAOSetting(associatedTAOSettingId);
		assert.equal(associatedTAOSetting[0], associatedTAOSettingId, "getAssociatedTAOSetting returns incorrect associatedTAOSettingId");
		assert.equal(associatedTAOSetting[1], associatedTAOId, "getAssociatedTAOSetting returns incorrect associatedTAOId");
		assert.equal(associatedTAOSetting[2].toNumber(), settingId.toNumber(), "getAssociatedTAOSetting returns incorrect settingId");

		var creatorTAOSetting = await aosettingattribute.getCreatorTAOSetting(creatorTAOSettingId);
		assert.equal(creatorTAOSetting[0], creatorTAOSettingId, "getCreatorTAOSetting returns incorrect creatorTAOSettingId");
		assert.equal(creatorTAOSetting[1], creatorTAOId, "getCreatorTAOSetting returns incorrect creatorTAOId");
		assert.equal(creatorTAOSetting[2].toNumber(), settingId.toNumber(), "getCreatorTAOSetting returns incorrect settingId");

		// Add settingId6
		try {
			var result = await aosetting.addUintSetting("uintSetting2", uintValue, creatorTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId6 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId6 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator TAO can't create setting");

		// Add settingId11
		try {
			var result = await aosetting.addUintSetting("uintSetting3", uintValue, creatorTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId11 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId11 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator TAO can't create setting");

		// Add settingId16
		try {
			var result = await aosetting.addUintSetting("uintSetting4", 91273, creatorTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId16 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId16 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator TAO can't create setting");
	});

	it("only the Advocate of a Creator TAO can add bool setting", async function() {
		settingName = "boolSetting";
		var settingNameExist = await aosetting.settingNameExist(settingName, associatedTAOId);
		assert.equal(settingNameExist, false, "settingNameExist returns incorrect value");

		var totalSettingBefore = await aosetting.totalSetting();

		var canAdd, settingCreationEvent, associatedTAOSettingId, creatorTAOSettingId;
		try {
			var result = await aosetting.addBoolSetting(settingName, boolValue, nonTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId2 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId2 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, false, "Can create setting using invalid Creator TAO");

		try {
			var result = await aosetting.addBoolSetting(settingName, boolValue, creatorTAOId, nonTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId2 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId2 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, false, "Can create setting using invalid Associated TAO");

		try {
			var result = await aosetting.addBoolSetting(settingName, boolValue, creatorTAOId, associatedTAOId, extraData, {
				from: account2
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId2 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId2 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, false, "Non-Advocate of Creator TAO can create setting");

		try {
			var result = await aosetting.addBoolSetting(settingName, boolValue, creatorTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId2 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId2 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator TAO can't create setting");

		var totalSettingAfter = await aosetting.totalSetting();
		assert.equal(
			totalSettingAfter.toNumber(),
			totalSettingBefore.plus(1).toNumber(),
			"Contract has incorrect totalSetting after adding setting"
		);

		var pendingValue = await aoboolsetting.pendingValue(settingId2.toNumber());
		assert.equal(pendingValue, boolValue, "Setting has incorrect pendingValue");

		var settingId = await aosetting.getSettingIdByTAOName(associatedTAOId, settingName);
		assert.equal(
			settingId.toNumber(),
			settingId2.toNumber(),
			"Contract returns incorrect settingId given an associatedTAOId and settingName"
		);

		var settingNameExist = await aosetting.settingNameExist(settingName, associatedTAOId);
		assert.equal(settingNameExist, true, "settingNameExist returns incorrect value");

		assert.notEqual(settingCreationEvent, null, "Contract didn't emit SettingCreation event when adding a bool setting");
		assert.equal(
			settingCreationEvent.args.settingId.toNumber(),
			totalSettingAfter.toNumber(),
			"SettingCreation event has incorrect settingId"
		);
		assert.equal(settingCreationEvent.args.creatorNameId, creatorTAONameId, "SettingCreation event has incorrect creatorNameId");
		assert.equal(settingCreationEvent.args.creatorTAOId, creatorTAOId, "SettingCreation event has incorrect creatorTAOId");
		assert.equal(settingCreationEvent.args.associatedTAOId, associatedTAOId, "SettingCreation event has incorrect associatedTAOId");
		assert.equal(settingCreationEvent.args.settingName, settingName, "SettingCreation event has incorrect settingName");
		assert.equal(settingCreationEvent.args.settingType.toNumber(), 2, "SettingCreation event has incorrect settingType");

		var associatedTAOSetting = await aosettingattribute.getAssociatedTAOSetting(associatedTAOSettingId);
		assert.equal(associatedTAOSetting[0], associatedTAOSettingId, "getAssociatedTAOSetting returns incorrect associatedTAOSettingId");
		assert.equal(associatedTAOSetting[1], associatedTAOId, "getAssociatedTAOSetting returns incorrect associatedTAOId");
		assert.equal(associatedTAOSetting[2].toNumber(), settingId.toNumber(), "getAssociatedTAOSetting returns incorrect settingId");

		var creatorTAOSetting = await aosettingattribute.getCreatorTAOSetting(creatorTAOSettingId);
		assert.equal(creatorTAOSetting[0], creatorTAOSettingId, "getCreatorTAOSetting returns incorrect creatorTAOSettingId");
		assert.equal(creatorTAOSetting[1], creatorTAOId, "getCreatorTAOSetting returns incorrect creatorTAOId");
		assert.equal(creatorTAOSetting[2].toNumber(), settingId.toNumber(), "getCreatorTAOSetting returns incorrect settingId");

		// Add settingId7
		try {
			var result = await aosetting.addBoolSetting("boolSetting2", boolValue, creatorTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId7 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId7 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator TAO can't create setting");

		// Add settingId12
		try {
			var result = await aosetting.addBoolSetting("boolSetting3", boolValue, creatorTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId12 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId12 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator TAO can't create setting");

		// Add settingId17
		try {
			var result = await aosetting.addBoolSetting("boolSetting4", boolValue, creatorTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId17 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId17 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator TAO can't create setting");
	});

	it("only the Advocate of a Creator TAO can add address setting", async function() {
		settingName = "addressSetting";
		var settingNameExist = await aosetting.settingNameExist(settingName, associatedTAOId);
		assert.equal(settingNameExist, false, "settingNameExist returns incorrect value");

		var totalSettingBefore = await aosetting.totalSetting();

		var canAdd, settingCreationEvent, associatedTAOSettingId, creatorTAOSettingId;
		try {
			var result = await aosetting.addAddressSetting(settingName, addressValue, nonTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId3 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId3 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, false, "Can create setting using invalid Creator TAO");

		try {
			var result = await aosetting.addAddressSetting(settingName, addressValue, creatorTAOId, nonTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId3 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId3 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, false, "Can create setting using invalid Associated TAO");

		try {
			var result = await aosetting.addAddressSetting(settingName, addressValue, creatorTAOId, associatedTAOId, extraData, {
				from: account2
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId3 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId3 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, false, "Non-Advocate of Creator TAO can create setting");

		try {
			var result = await aosetting.addAddressSetting(settingName, addressValue, creatorTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId3 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId3 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator TAO can't create setting");

		var totalSettingAfter = await aosetting.totalSetting();
		assert.equal(
			totalSettingAfter.toNumber(),
			totalSettingBefore.plus(1).toNumber(),
			"Contract has incorrect totalSetting after adding setting"
		);

		var pendingValue = await aoaddresssetting.pendingValue(settingId3.toNumber());
		assert.equal(pendingValue, addressValue, "Setting has incorrect pendingValue");

		var settingId = await aosetting.getSettingIdByTAOName(associatedTAOId, settingName);
		assert.equal(
			settingId.toNumber(),
			settingId3.toNumber(),
			"Contract returns incorrect settingId given an associatedTAOId and settingName"
		);

		var settingNameExist = await aosetting.settingNameExist(settingName, associatedTAOId);
		assert.equal(settingNameExist, true, "settingNameExist returns incorrect value");

		assert.notEqual(settingCreationEvent, null, "Contract didn't emit SettingCreation event when adding a address setting");
		assert.equal(
			settingCreationEvent.args.settingId.toNumber(),
			totalSettingAfter.toNumber(),
			"SettingCreation event has incorrect settingId"
		);
		assert.equal(settingCreationEvent.args.creatorNameId, creatorTAONameId, "SettingCreation event has incorrect creatorNameId");
		assert.equal(settingCreationEvent.args.creatorTAOId, creatorTAOId, "SettingCreation event has incorrect creatorTAOId");
		assert.equal(settingCreationEvent.args.associatedTAOId, associatedTAOId, "SettingCreation event has incorrect associatedTAOId");
		assert.equal(settingCreationEvent.args.settingName, settingName, "SettingCreation event has incorrect settingName");
		assert.equal(settingCreationEvent.args.settingType.toNumber(), 3, "SettingCreation event has incorrect settingType");

		var associatedTAOSetting = await aosettingattribute.getAssociatedTAOSetting(associatedTAOSettingId);
		assert.equal(associatedTAOSetting[0], associatedTAOSettingId, "getAssociatedTAOSetting returns incorrect associatedTAOSettingId");
		assert.equal(associatedTAOSetting[1], associatedTAOId, "getAssociatedTAOSetting returns incorrect associatedTAOId");
		assert.equal(associatedTAOSetting[2].toNumber(), settingId.toNumber(), "getAssociatedTAOSetting returns incorrect settingId");

		var creatorTAOSetting = await aosettingattribute.getCreatorTAOSetting(creatorTAOSettingId);
		assert.equal(creatorTAOSetting[0], creatorTAOSettingId, "getCreatorTAOSetting returns incorrect creatorTAOSettingId");
		assert.equal(creatorTAOSetting[1], creatorTAOId, "getCreatorTAOSetting returns incorrect creatorTAOId");
		assert.equal(creatorTAOSetting[2].toNumber(), settingId.toNumber(), "getCreatorTAOSetting returns incorrect settingId");

		// Add settingId8
		try {
			var result = await aosetting.addAddressSetting("addressSetting2", addressValue, creatorTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId8 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId8 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator TAO can't create setting");

		// Add settingId13
		try {
			var result = await aosetting.addAddressSetting("addressSetting3", addressValue, creatorTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId13 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId13 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator TAO can't create setting");

		// Add settingId18
		try {
			var result = await aosetting.addAddressSetting("addressSetting4", addressValue, creatorTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId18 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId18 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator TAO can't create setting");
	});

	it("only the Advocate of a Creator TAO can add bytes setting", async function() {
		settingName = "bytesSetting";
		var settingNameExist = await aosetting.settingNameExist(settingName, associatedTAOId);
		assert.equal(settingNameExist, false, "settingNameExist returns incorrect value");

		var totalSettingBefore = await aosetting.totalSetting();

		var canAdd, settingCreationEvent, associatedTAOSettingId, creatorTAOSettingId;
		try {
			var result = await aosetting.addBytesSetting(settingName, bytesValue, nonTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId4 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId4 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, false, "Can create setting using invalid Creator TAO");

		try {
			var result = await aosetting.addBytesSetting(settingName, bytesValue, creatorTAOId, nonTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId4 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId4 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, false, "Can create setting using invalid Associated TAO");

		try {
			var result = await aosetting.addBytesSetting(settingName, bytesValue, creatorTAOId, associatedTAOId, extraData, {
				from: account2
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId4 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId4 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, false, "Non-Advocate of Creator TAO can create setting");

		try {
			var result = await aosetting.addBytesSetting(settingName, bytesValue, creatorTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId4 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId4 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator TAO can't create setting");

		var totalSettingAfter = await aosetting.totalSetting();
		assert.equal(
			totalSettingAfter.toNumber(),
			totalSettingBefore.plus(1).toNumber(),
			"Contract has incorrect totalSetting after adding setting"
		);

		var pendingValue = await aobytessetting.pendingValue(settingId4.toNumber());
		assert.notEqual(pendingValue, nullBytesValue, "Setting has incorrect pendingValue");

		var settingId = await aosetting.getSettingIdByTAOName(associatedTAOId, settingName);
		assert.equal(
			settingId.toNumber(),
			settingId4.toNumber(),
			"Contract returns incorrect settingId given an associatedTAOId and settingName"
		);

		var settingNameExist = await aosetting.settingNameExist(settingName, associatedTAOId);
		assert.equal(settingNameExist, true, "settingNameExist returns incorrect value");

		assert.notEqual(settingCreationEvent, null, "Contract didn't emit SettingCreation event when adding a bytes setting");
		assert.equal(
			settingCreationEvent.args.settingId.toNumber(),
			totalSettingAfter.toNumber(),
			"SettingCreation event has incorrect settingId"
		);
		assert.equal(settingCreationEvent.args.creatorNameId, creatorTAONameId, "SettingCreation event has incorrect creatorNameId");
		assert.equal(settingCreationEvent.args.creatorTAOId, creatorTAOId, "SettingCreation event has incorrect creatorTAOId");
		assert.equal(settingCreationEvent.args.associatedTAOId, associatedTAOId, "SettingCreation event has incorrect associatedTAOId");
		assert.equal(settingCreationEvent.args.settingName, settingName, "SettingCreation event has incorrect settingName");
		assert.equal(settingCreationEvent.args.settingType.toNumber(), 4, "SettingCreation event has incorrect settingType");

		var associatedTAOSetting = await aosettingattribute.getAssociatedTAOSetting(associatedTAOSettingId);
		assert.equal(associatedTAOSetting[0], associatedTAOSettingId, "getAssociatedTAOSetting returns incorrect associatedTAOSettingId");
		assert.equal(associatedTAOSetting[1], associatedTAOId, "getAssociatedTAOSetting returns incorrect associatedTAOId");
		assert.equal(associatedTAOSetting[2].toNumber(), settingId.toNumber(), "getAssociatedTAOSetting returns incorrect settingId");

		var creatorTAOSetting = await aosettingattribute.getCreatorTAOSetting(creatorTAOSettingId);
		assert.equal(creatorTAOSetting[0], creatorTAOSettingId, "getCreatorTAOSetting returns incorrect creatorTAOSettingId");
		assert.equal(creatorTAOSetting[1], creatorTAOId, "getCreatorTAOSetting returns incorrect creatorTAOId");
		assert.equal(creatorTAOSetting[2].toNumber(), settingId.toNumber(), "getCreatorTAOSetting returns incorrect settingId");

		// Add settingId9
		try {
			var result = await aosetting.addBytesSetting("bytesSetting2", bytesValue, creatorTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId9 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId9 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator TAO can't create setting");

		// Add settingId14
		try {
			var result = await aosetting.addBytesSetting("bytesSetting3", bytesValue, creatorTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId14 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId14 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator TAO can't create setting");

		// Add settingId19
		try {
			var result = await aosetting.addBytesSetting("bytesSetting4", bytesValue, creatorTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId19 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId19 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator TAO can't create setting");
	});

	it("only the Advocate of a Creator TAO can add string setting", async function() {
		settingName = "stringSetting";
		var settingNameExist = await aosetting.settingNameExist(settingName, associatedTAOId);
		assert.equal(settingNameExist, false, "settingNameExist returns incorrect value");

		var totalSettingBefore = await aosetting.totalSetting();

		var canAdd, settingCreationEvent, associatedTAOSettingId, creatorTAOSettingId;
		try {
			var result = await aosetting.addStringSetting(settingName, stringValue, nonTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId5 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId5 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, false, "Can create setting using invalid Creator TAO");

		try {
			var result = await aosetting.addStringSetting(settingName, stringValue, creatorTAOId, nonTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId5 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId5 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, false, "Can create setting using invalid Associated TAO");

		try {
			var result = await aosetting.addStringSetting(settingName, stringValue, creatorTAOId, associatedTAOId, extraData, {
				from: account2
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId5 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId5 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, false, "Non-Advocate of Creator TAO can create setting");

		try {
			var result = await aosetting.addStringSetting(settingName, stringValue, creatorTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId5 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId5 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator TAO can't create setting");

		var totalSettingAfter = await aosetting.totalSetting();
		assert.equal(
			totalSettingAfter.toNumber(),
			totalSettingBefore.plus(1).toNumber(),
			"Contract has incorrect totalSetting after adding setting"
		);

		var pendingValue = await aostringsetting.pendingValue(settingId5.toNumber());
		assert.equal(pendingValue, stringValue, "Setting has incorrect pendingValue");

		var settingId = await aosetting.getSettingIdByTAOName(associatedTAOId, settingName);
		assert.equal(
			settingId.toNumber(),
			settingId5.toNumber(),
			"Contract returns incorrect settingId given an associatedTAOId and settingName"
		);

		var settingNameExist = await aosetting.settingNameExist(settingName, associatedTAOId);
		assert.equal(settingNameExist, true, "settingNameExist returns incorrect value");

		assert.notEqual(settingCreationEvent, null, "Contract didn't emit SettingCreation event when adding a string setting");
		assert.equal(
			settingCreationEvent.args.settingId.toNumber(),
			totalSettingAfter.toNumber(),
			"SettingCreation event has incorrect settingId"
		);
		assert.equal(settingCreationEvent.args.creatorNameId, creatorTAONameId, "SettingCreation event has incorrect creatorNameId");
		assert.equal(settingCreationEvent.args.creatorTAOId, creatorTAOId, "SettingCreation event has incorrect creatorTAOId");
		assert.equal(settingCreationEvent.args.associatedTAOId, associatedTAOId, "SettingCreation event has incorrect associatedTAOId");
		assert.equal(settingCreationEvent.args.settingName, settingName, "SettingCreation event has incorrect settingName");
		assert.equal(settingCreationEvent.args.settingType.toNumber(), 5, "SettingCreation event has incorrect settingType");

		var associatedTAOSetting = await aosettingattribute.getAssociatedTAOSetting(associatedTAOSettingId);
		assert.equal(associatedTAOSetting[0], associatedTAOSettingId, "getAssociatedTAOSetting returns incorrect associatedTAOSettingId");
		assert.equal(associatedTAOSetting[1], associatedTAOId, "getAssociatedTAOSetting returns incorrect associatedTAOId");
		assert.equal(associatedTAOSetting[2].toNumber(), settingId.toNumber(), "getAssociatedTAOSetting returns incorrect settingId");

		var creatorTAOSetting = await aosettingattribute.getCreatorTAOSetting(creatorTAOSettingId);
		assert.equal(creatorTAOSetting[0], creatorTAOSettingId, "getCreatorTAOSetting returns incorrect creatorTAOSettingId");
		assert.equal(creatorTAOSetting[1], creatorTAOId, "getCreatorTAOSetting returns incorrect creatorTAOId");
		assert.equal(creatorTAOSetting[2].toNumber(), settingId.toNumber(), "getCreatorTAOSetting returns incorrect settingId");

		// Add settingId10
		try {
			var result = await aosetting.addStringSetting("stringSetting2", stringValue, creatorTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId10 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId10 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator TAO can't create setting");

		// Add settingId15
		try {
			var result = await aosetting.addStringSetting("stringSetting3", stringValue, creatorTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId15 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId15 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator TAO can't create setting");

		// Add settingId20
		try {
			var result = await aosetting.addStringSetting("stringSetting4", stringValue, creatorTAOId, associatedTAOId, extraData, {
				from: account1
			});
			canAdd = true;
			settingCreationEvent = result.logs[0];
			settingId20 = settingCreationEvent.args.settingId;
			associatedTAOSettingId = settingCreationEvent.args.associatedTAOSettingId;
			creatorTAOSettingId = settingCreationEvent.args.creatorTAOSettingId;
		} catch (e) {
			canAdd = false;
			settingCreationEvent = null;
			settingId20 = null;
			associatedTAOSettingId = null;
			creatorTAOSettingId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator TAO can't create setting");
	});

	it("only the Advocate of setting's Associated TAO can approve/reject uint setting creation", async function() {
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
		assert.equal(canApprove, false, "Non-Advocate of setting's Associated TAO can approve setting creation");

		// Approve settingId1
		try {
			var result = await aosetting.approveSettingCreation(settingId1, true, { from: account2 });
			canApprove = true;
			approveSettingCreationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingCreationEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Associated TAO can't approve setting creation");

		assert.equal(
			approveSettingCreationEvent.args.settingId.toNumber(),
			settingId1.toNumber(),
			"ApproveSettingCreation has incorrect settingId"
		);
		assert.equal(
			approveSettingCreationEvent.args.associatedTAOId,
			associatedTAOId,
			"ApproveSettingCreation has incorrect associatedTAOId"
		);
		assert.equal(
			approveSettingCreationEvent.args.associatedTAOAdvocate,
			associatedTAONameId,
			"ApproveSettingCreation has incorrect associatedTAOAdvocate"
		);
		assert.equal(approveSettingCreationEvent.args.approved, true, "ApproveSettingCreation has incorrect approved");

		// Reject settingId6
		try {
			var result = await aosetting.approveSettingCreation(settingId6, false, { from: account2 });
			canApprove = true;
			approveSettingCreationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingCreationEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Associated TAO can't approve setting creation");

		assert.equal(
			approveSettingCreationEvent.args.settingId.toNumber(),
			settingId6.toNumber(),
			"ApproveSettingCreation has incorrect settingId"
		);
		assert.equal(
			approveSettingCreationEvent.args.associatedTAOId,
			associatedTAOId,
			"ApproveSettingCreation has incorrect associatedTAOId"
		);
		assert.equal(
			approveSettingCreationEvent.args.associatedTAOAdvocate,
			associatedTAONameId,
			"ApproveSettingCreation has incorrect associatedTAOAdvocate"
		);
		assert.equal(approveSettingCreationEvent.args.approved, false, "ApproveSettingCreation has incorrect approved");

		var canGetSettingIdByTAOName;
		try {
			await aosetting.getSettingIdByTAOName(associatedTAOId, "uintSetting2");
			canGetSettingIdByTAOName = true;
		} catch (e) {
			canGetSettingIdByTAOName = false;
		}
		assert.equal(canGetSettingIdByTAOName, false, "canGetSettingIdByTAOName() is successful even though setting creation is rejected");

		// Approve settingId16
		try {
			var result = await aosetting.approveSettingCreation(settingId16, true, { from: account2 });
			canApprove = true;
			approveSettingCreationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingCreationEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Associated TAO can't approve setting creation");
	});

	it("only the Advocate of setting's Creator TAO can finalize uint setting creation", async function() {
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
		assert.equal(canFinalize, false, "Non-Advocate of Creator TAO can finalize setting creation");

		try {
			var result = await aosetting.finalizeSettingCreation(settingId11, { from: account1 });
			canFinalize = true;
			finalizeSettingCreationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingCreationEvent = null;
		}
		assert.equal(canFinalize, false, "Advocate can finalize non-approved setting creation");

		try {
			var result = await aosetting.finalizeSettingCreation(settingId6, { from: account1 });
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
		assert.equal(canFinalize, true, "Advocate can't finalize setting creation");

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
			finalizeSettingCreationEvent.args.creatorTAOId,
			creatorTAOId,
			"FinalizeSettingCreation event has incorrect creatorTAOId"
		);
		assert.equal(
			finalizeSettingCreationEvent.args.creatorTAOAdvocate,
			creatorTAONameId,
			"FinalizeSettingCreation event has incorrect creatorTAOAdvocate"
		);

		try {
			var result = await aosetting.finalizeSettingCreation(settingId16, { from: account1 });
			canFinalize = true;
			finalizeSettingCreationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingCreationEvent = null;
		}
		assert.equal(canFinalize, true, "Advocate can't finalize setting creation");

		var settingValues = await aosetting.getSettingValuesById(settingId1.toNumber());
		assert.equal(settingValues[0].toNumber(), uintValue, "getSettingValuesById() return incorrect uint256 value");

		var settingValues = await aosetting.getSettingValuesByTAOName(associatedTAOId, "uintSetting");
		assert.equal(settingValues[0].toNumber(), uintValue, "getSettingValuesByTAOName() return incorrect uint256 value");
	});

	it("only the Advocate of setting's Associated TAO can approve/reject bool setting creation", async function() {
		var canApprove, approveSettingCreationEvent;
		try {
			var result = await aosetting.approveSettingCreation(settingId2, true, { from: account1 });
			canApprove = true;
			approveSettingCreationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingCreationEvent = null;
		}
		assert.equal(canApprove, false, "Non-Advocate of setting's Associated TAO can approve setting creation");

		// Approve settingId2
		try {
			var result = await aosetting.approveSettingCreation(settingId2, true, { from: account2 });
			canApprove = true;
			approveSettingCreationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingCreationEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Associated TAO can't approve setting creation");

		assert.equal(
			approveSettingCreationEvent.args.settingId.toNumber(),
			settingId2.toNumber(),
			"ApproveSettingCreation has incorrect settingId"
		);
		assert.equal(
			approveSettingCreationEvent.args.associatedTAOId,
			associatedTAOId,
			"ApproveSettingCreation has incorrect associatedTAOId"
		);
		assert.equal(
			approveSettingCreationEvent.args.associatedTAOAdvocate,
			associatedTAONameId,
			"ApproveSettingCreation has incorrect associatedTAOAdvocate"
		);
		assert.equal(approveSettingCreationEvent.args.approved, true, "ApproveSettingCreation has incorrect approved");

		// Reject settingId7
		try {
			var result = await aosetting.approveSettingCreation(settingId7, false, { from: account2 });
			canApprove = true;
			approveSettingCreationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingCreationEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Associated TAO can't approve setting creation");

		assert.equal(
			approveSettingCreationEvent.args.settingId.toNumber(),
			settingId7.toNumber(),
			"ApproveSettingCreation has incorrect settingId"
		);
		assert.equal(
			approveSettingCreationEvent.args.associatedTAOId,
			associatedTAOId,
			"ApproveSettingCreation has incorrect associatedTAOId"
		);
		assert.equal(
			approveSettingCreationEvent.args.associatedTAOAdvocate,
			associatedTAONameId,
			"ApproveSettingCreation has incorrect associatedTAOAdvocate"
		);
		assert.equal(approveSettingCreationEvent.args.approved, false, "ApproveSettingCreation has incorrect approved");

		var canGetSettingIdByTAOName;
		try {
			await aosetting.getSettingIdByTAOName(associatedTAOId, "uintSetting2");
			canGetSettingIdByTAOName = true;
		} catch (e) {
			canGetSettingIdByTAOName = false;
		}
		assert.equal(canGetSettingIdByTAOName, false, "canGetSettingIdByTAOName() is successful even though setting creation is rejected");

		// Approve settingId17
		try {
			var result = await aosetting.approveSettingCreation(settingId17, true, { from: account2 });
			canApprove = true;
			approveSettingCreationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingCreationEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Associated TAO can't approve setting creation");
	});

	it("only the Advocate of setting's Creator TAO can finalize bool setting creation", async function() {
		var canFinalize, finalizeSettingCreationEvent;
		try {
			var result = await aosetting.finalizeSettingCreation(settingId2, { from: account2 });
			canFinalize = true;
			finalizeSettingCreationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingCreationEvent = null;
		}
		assert.equal(canFinalize, false, "Non-Advocate of Creator TAO can finalize setting creation");

		try {
			var result = await aosetting.finalizeSettingCreation(settingId7, { from: account1 });
			canFinalize = true;
			finalizeSettingCreationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingCreationEvent = null;
		}
		assert.equal(canFinalize, false, "Advocate can finalize rejected setting creation");

		try {
			var result = await aosetting.finalizeSettingCreation(settingId2, { from: account1 });
			canFinalize = true;
			finalizeSettingCreationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingCreationEvent = null;
		}
		assert.equal(canFinalize, true, "Advocate can't finalize setting creation");

		var pendingValue = await aoboolsetting.pendingValue(settingId2.toNumber());
		assert.equal(pendingValue, false, "Setting has incorrect pendingValue");

		var settingValue = await aoboolsetting.settingValue(settingId2.toNumber());
		assert.equal(settingValue, boolValue, "Setting has incorrect settingValue");

		assert.equal(
			finalizeSettingCreationEvent.args.settingId.toNumber(),
			settingId2.toNumber(),
			"FinalizeSettingCreation event has incorrect settingId"
		);
		assert.equal(
			finalizeSettingCreationEvent.args.creatorTAOId,
			creatorTAOId,
			"FinalizeSettingCreation event has incorrect creatorTAOId"
		);
		assert.equal(
			finalizeSettingCreationEvent.args.creatorTAOAdvocate,
			creatorTAONameId,
			"FinalizeSettingCreation event has incorrect creatorTAOAdvocate"
		);

		try {
			var result = await aosetting.finalizeSettingCreation(settingId17, { from: account1 });
			canFinalize = true;
			finalizeSettingCreationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingCreationEvent = null;
		}
		assert.equal(canFinalize, true, "Advocate can't finalize setting creation");

		var settingValues = await aosetting.getSettingValuesById(settingId2.toNumber());
		assert.equal(settingValues[1], boolValue, "getSettingValuesById() return incorrect bool value");

		var settingValues = await aosetting.getSettingValuesByTAOName(associatedTAOId, "boolSetting");
		assert.equal(settingValues[1], boolValue, "getSettingValuesByTAOName() return incorrect bool value");
	});

	it("only the Advocate of setting's Associated TAO can approve/reject address setting creation", async function() {
		var canApprove, approveSettingCreationEvent;
		try {
			var result = await aosetting.approveSettingCreation(settingId3, true, { from: account1 });
			canApprove = true;
			approveSettingCreationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingCreationEvent = null;
		}
		assert.equal(canApprove, false, "Non-Advocate of setting's Associated TAO can approve setting creation");

		// Approve settingId3
		try {
			var result = await aosetting.approveSettingCreation(settingId3, true, { from: account2 });
			canApprove = true;
			approveSettingCreationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingCreationEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Associated TAO can't approve setting creation");

		assert.equal(
			approveSettingCreationEvent.args.settingId.toNumber(),
			settingId3.toNumber(),
			"ApproveSettingCreation has incorrect settingId"
		);
		assert.equal(
			approveSettingCreationEvent.args.associatedTAOId,
			associatedTAOId,
			"ApproveSettingCreation has incorrect associatedTAOId"
		);
		assert.equal(
			approveSettingCreationEvent.args.associatedTAOAdvocate,
			associatedTAONameId,
			"ApproveSettingCreation has incorrect associatedTAOAdvocate"
		);
		assert.equal(approveSettingCreationEvent.args.approved, true, "ApproveSettingCreation has incorrect approved");

		// Reject settingId8
		try {
			var result = await aosetting.approveSettingCreation(settingId8, false, { from: account2 });
			canApprove = true;
			approveSettingCreationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingCreationEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Associated TAO can't approve setting creation");

		assert.equal(
			approveSettingCreationEvent.args.settingId.toNumber(),
			settingId8.toNumber(),
			"ApproveSettingCreation has incorrect settingId"
		);
		assert.equal(
			approveSettingCreationEvent.args.associatedTAOId,
			associatedTAOId,
			"ApproveSettingCreation has incorrect associatedTAOId"
		);
		assert.equal(
			approveSettingCreationEvent.args.associatedTAOAdvocate,
			associatedTAONameId,
			"ApproveSettingCreation has incorrect associatedTAOAdvocate"
		);
		assert.equal(approveSettingCreationEvent.args.approved, false, "ApproveSettingCreation has incorrect approved");

		var canGetSettingIdByTAOName;
		try {
			await aosetting.getSettingIdByTAOName(associatedTAOId, "uintSetting2");
			canGetSettingIdByTAOName = true;
		} catch (e) {
			canGetSettingIdByTAOName = false;
		}
		assert.equal(canGetSettingIdByTAOName, false, "canGetSettingIdByTAOName() is successful even though setting creation is rejected");

		// Approve settingId18
		try {
			var result = await aosetting.approveSettingCreation(settingId18, true, { from: account2 });
			canApprove = true;
			approveSettingCreationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingCreationEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Associated TAO can't approve setting creation");
	});

	it("only the Advocate of setting's Creator TAO can finalize address setting creation", async function() {
		var canFinalize, finalizeSettingCreationEvent;
		try {
			var result = await aosetting.finalizeSettingCreation(settingId3, { from: account2 });
			canFinalize = true;
			finalizeSettingCreationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingCreationEvent = null;
		}
		assert.equal(canFinalize, false, "Non-Advocate of Creator TAO can finalize setting creation");

		try {
			var result = await aosetting.finalizeSettingCreation(settingId8, { from: account1 });
			canFinalize = true;
			finalizeSettingCreationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingCreationEvent = null;
		}
		assert.equal(canFinalize, false, "Advocate can finalize rejected setting creation");

		try {
			var result = await aosetting.finalizeSettingCreation(settingId3, { from: account1 });
			canFinalize = true;
			finalizeSettingCreationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingCreationEvent = null;
		}
		assert.equal(canFinalize, true, "Advocate can't finalize setting creation");

		var pendingValue = await aoaddresssetting.pendingValue(settingId3.toNumber());
		assert.equal(pendingValue, emptyAddress, "Setting has incorrect pendingValue");

		var settingValue = await aoaddresssetting.settingValue(settingId3.toNumber());
		assert.equal(settingValue, addressValue, "Setting has incorrect settingValue");

		assert.equal(
			finalizeSettingCreationEvent.args.settingId.toNumber(),
			settingId3.toNumber(),
			"FinalizeSettingCreation event has incorrect settingId"
		);
		assert.equal(
			finalizeSettingCreationEvent.args.creatorTAOId,
			creatorTAOId,
			"FinalizeSettingCreation event has incorrect creatorTAOId"
		);
		assert.equal(
			finalizeSettingCreationEvent.args.creatorTAOAdvocate,
			creatorTAONameId,
			"FinalizeSettingCreation event has incorrect creatorTAOAdvocate"
		);

		try {
			var result = await aosetting.finalizeSettingCreation(settingId18, { from: account1 });
			canFinalize = true;
			finalizeSettingCreationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingCreationEvent = null;
		}
		assert.equal(canFinalize, true, "Advocate can't finalize setting creation");

		var settingValues = await aosetting.getSettingValuesById(settingId3.toNumber());
		assert.equal(settingValues[2], addressValue, "getSettingValuesById() return incorrect address value");

		var settingValues = await aosetting.getSettingValuesByTAOName(associatedTAOId, "addressSetting");
		assert.equal(settingValues[2], addressValue, "getSettingValuesByTAOName() return incorrect address value");
	});

	it("only the Advocate of setting's Associated TAO can approve/reject bytes setting creation", async function() {
		var canApprove, approveSettingCreationEvent;
		try {
			var result = await aosetting.approveSettingCreation(settingId4, true, { from: account1 });
			canApprove = true;
			approveSettingCreationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingCreationEvent = null;
		}
		assert.equal(canApprove, false, "Non-Advocate of setting's Associated TAO can approve setting creation");

		// Approve settingId4
		try {
			var result = await aosetting.approveSettingCreation(settingId4, true, { from: account2 });
			canApprove = true;
			approveSettingCreationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingCreationEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Associated TAO can't approve setting creation");

		assert.equal(
			approveSettingCreationEvent.args.settingId.toNumber(),
			settingId4.toNumber(),
			"ApproveSettingCreation has incorrect settingId"
		);
		assert.equal(
			approveSettingCreationEvent.args.associatedTAOId,
			associatedTAOId,
			"ApproveSettingCreation has incorrect associatedTAOId"
		);
		assert.equal(
			approveSettingCreationEvent.args.associatedTAOAdvocate,
			associatedTAONameId,
			"ApproveSettingCreation has incorrect associatedTAOAdvocate"
		);
		assert.equal(approveSettingCreationEvent.args.approved, true, "ApproveSettingCreation has incorrect approved");

		// Reject settingId9
		try {
			var result = await aosetting.approveSettingCreation(settingId9, false, { from: account2 });
			canApprove = true;
			approveSettingCreationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingCreationEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Associated TAO can't approve setting creation");

		assert.equal(
			approveSettingCreationEvent.args.settingId.toNumber(),
			settingId9.toNumber(),
			"ApproveSettingCreation has incorrect settingId"
		);
		assert.equal(
			approveSettingCreationEvent.args.associatedTAOId,
			associatedTAOId,
			"ApproveSettingCreation has incorrect associatedTAOId"
		);
		assert.equal(
			approveSettingCreationEvent.args.associatedTAOAdvocate,
			associatedTAONameId,
			"ApproveSettingCreation has incorrect associatedTAOAdvocate"
		);
		assert.equal(approveSettingCreationEvent.args.approved, false, "ApproveSettingCreation has incorrect approved");

		var canGetSettingIdByTAOName;
		try {
			await aosetting.getSettingIdByTAOName(associatedTAOId, "uintSetting2");
			canGetSettingIdByTAOName = true;
		} catch (e) {
			canGetSettingIdByTAOName = false;
		}
		assert.equal(canGetSettingIdByTAOName, false, "canGetSettingIdByTAOName() is successful even though setting creation is rejected");

		// Approve settingId19
		try {
			var result = await aosetting.approveSettingCreation(settingId19, true, { from: account2 });
			canApprove = true;
			approveSettingCreationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingCreationEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Associated TAO can't approve setting creation");
	});

	it("only the Advocate of setting's Creator TAO can finalize bytes setting creation", async function() {
		var canFinalize, finalizeSettingCreationEvent;
		try {
			var result = await aosetting.finalizeSettingCreation(settingId4, { from: account2 });
			canFinalize = true;
			finalizeSettingCreationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingCreationEvent = null;
		}
		assert.equal(canFinalize, false, "Non-Advocate of Creator TAO can finalize setting creation");

		try {
			var result = await aosetting.finalizeSettingCreation(settingId9, { from: account1 });
			canFinalize = true;
			finalizeSettingCreationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingCreationEvent = null;
		}
		assert.equal(canFinalize, false, "Advocate can finalize rejected setting creation");

		try {
			var result = await aosetting.finalizeSettingCreation(settingId4, { from: account1 });
			canFinalize = true;
			finalizeSettingCreationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingCreationEvent = null;
		}
		assert.equal(canFinalize, true, "Advocate can't finalize setting creation");

		var pendingValue = await aobytessetting.pendingValue(settingId4.toNumber());
		assert.equal(pendingValue, nullBytesValue, "Setting has incorrect pendingValue");

		var settingValue = await aobytessetting.settingValue(settingId4.toNumber());
		assert.notEqual(settingValue, nullBytesValue, "Setting has incorrect settingValue");

		assert.equal(
			finalizeSettingCreationEvent.args.settingId.toNumber(),
			settingId4.toNumber(),
			"FinalizeSettingCreation event has incorrect settingId"
		);
		assert.equal(
			finalizeSettingCreationEvent.args.creatorTAOId,
			creatorTAOId,
			"FinalizeSettingCreation event has incorrect creatorTAOId"
		);
		assert.equal(
			finalizeSettingCreationEvent.args.creatorTAOAdvocate,
			creatorTAONameId,
			"FinalizeSettingCreation event has incorrect creatorTAOAdvocate"
		);

		try {
			var result = await aosetting.finalizeSettingCreation(settingId19, { from: account1 });
			canFinalize = true;
			finalizeSettingCreationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingCreationEvent = null;
		}
		assert.equal(canFinalize, true, "Advocate can't finalize setting creation");

		var settingValues = await aosetting.getSettingValuesById(settingId4.toNumber());
		assert.notEqual(settingValues[3], nullBytesValue, "getSettingValuesById() return incorrect bytes32 value");

		var settingValues = await aosetting.getSettingValuesByTAOName(associatedTAOId, "bytesSetting");
		assert.notEqual(settingValues[3], nullBytesValue, "getSettingValuesByTAOName() return incorrect bytes32 value");
	});

	it("only the Advocate of setting's Associated TAO can approve/reject string setting creation", async function() {
		var canApprove, approveSettingCreationEvent;
		try {
			var result = await aosetting.approveSettingCreation(settingId5, true, { from: account1 });
			canApprove = true;
			approveSettingCreationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingCreationEvent = null;
		}
		assert.equal(canApprove, false, "Non-Advocate of setting's Associated TAO can approve setting creation");

		// Approve settingId5
		try {
			var result = await aosetting.approveSettingCreation(settingId5, true, { from: account2 });
			canApprove = true;
			approveSettingCreationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingCreationEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Associated TAO can't approve setting creation");

		assert.equal(
			approveSettingCreationEvent.args.settingId.toNumber(),
			settingId5.toNumber(),
			"ApproveSettingCreation has incorrect settingId"
		);
		assert.equal(
			approveSettingCreationEvent.args.associatedTAOId,
			associatedTAOId,
			"ApproveSettingCreation has incorrect associatedTAOId"
		);
		assert.equal(
			approveSettingCreationEvent.args.associatedTAOAdvocate,
			associatedTAONameId,
			"ApproveSettingCreation has incorrect associatedTAOAdvocate"
		);
		assert.equal(approveSettingCreationEvent.args.approved, true, "ApproveSettingCreation has incorrect approved");

		// Reject settingId10
		try {
			var result = await aosetting.approveSettingCreation(settingId10, false, { from: account2 });
			canApprove = true;
			approveSettingCreationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingCreationEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Associated TAO can't approve setting creation");

		assert.equal(
			approveSettingCreationEvent.args.settingId.toNumber(),
			settingId10.toNumber(),
			"ApproveSettingCreation has incorrect settingId"
		);
		assert.equal(
			approveSettingCreationEvent.args.associatedTAOId,
			associatedTAOId,
			"ApproveSettingCreation has incorrect associatedTAOId"
		);
		assert.equal(
			approveSettingCreationEvent.args.associatedTAOAdvocate,
			associatedTAONameId,
			"ApproveSettingCreation has incorrect associatedTAOAdvocate"
		);
		assert.equal(approveSettingCreationEvent.args.approved, false, "ApproveSettingCreation has incorrect approved");

		var canGetSettingIdByTAOName;
		try {
			await aosetting.getSettingIdByTAOName(associatedTAOId, "uintSetting2");
			canGetSettingIdByTAOName = true;
		} catch (e) {
			canGetSettingIdByTAOName = false;
		}
		assert.equal(canGetSettingIdByTAOName, false, "canGetSettingIdByTAOName() is successful even though setting creation is rejected");

		// Approve settingId20
		try {
			var result = await aosetting.approveSettingCreation(settingId20, true, { from: account2 });
			canApprove = true;
			approveSettingCreationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingCreationEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Associated TAO can't approve setting creation");
	});

	it("only the Advocate of setting's Creator TAO can finalize string setting creation", async function() {
		var canFinalize, finalizeSettingCreationEvent;
		try {
			var result = await aosetting.finalizeSettingCreation(settingId5, { from: account2 });
			canFinalize = true;
			finalizeSettingCreationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingCreationEvent = null;
		}
		assert.equal(canFinalize, false, "Non-Advocate of Creator TAO can finalize setting creation");

		try {
			var result = await aosetting.finalizeSettingCreation(settingId10, { from: account1 });
			canFinalize = true;
			finalizeSettingCreationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingCreationEvent = null;
		}
		assert.equal(canFinalize, false, "Advocate can finalize rejected setting creation");

		try {
			var result = await aosetting.finalizeSettingCreation(settingId5, { from: account1 });
			canFinalize = true;
			finalizeSettingCreationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingCreationEvent = null;
		}
		assert.equal(canFinalize, true, "Advocate can't finalize setting creation");

		var pendingValue = await aostringsetting.pendingValue(settingId5.toNumber());
		assert.equal(pendingValue, "", "Setting has incorrect pendingValue");

		var settingValue = await aostringsetting.settingValue(settingId5.toNumber());
		assert.equal(settingValue, stringValue, "Setting has incorrect settingValue");

		assert.equal(
			finalizeSettingCreationEvent.args.settingId.toNumber(),
			settingId5.toNumber(),
			"FinalizeSettingCreation event has incorrect settingId"
		);
		assert.equal(
			finalizeSettingCreationEvent.args.creatorTAOId,
			creatorTAOId,
			"FinalizeSettingCreation event has incorrect creatorTAOId"
		);
		assert.equal(
			finalizeSettingCreationEvent.args.creatorTAOAdvocate,
			creatorTAONameId,
			"FinalizeSettingCreation event has incorrect creatorTAOAdvocate"
		);

		try {
			var result = await aosetting.finalizeSettingCreation(settingId20, { from: account1 });
			canFinalize = true;
			finalizeSettingCreationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingCreationEvent = null;
		}
		assert.equal(canFinalize, true, "Advocate can't finalize setting creation");

		var settingValues = await aosetting.getSettingValuesById(settingId5.toNumber());
		assert.equal(settingValues[4], stringValue, "getSettingValuesById() return incorrect string value");

		var settingValues = await aosetting.getSettingValuesByTAOName(associatedTAOId, "stringSetting");
		assert.equal(settingValues[4], stringValue, "getSettingValuesByTAOName() return incorrect string value");
	});

	it("only the Advocate of setting's Associated TAO can update uint setting", async function() {
		var canUpdate, settingUpdateEvent;
		uintValue = 100;
		try {
			var result = await aosetting.updateUintSetting(settingId2, uintValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can call update uint on non-uint setting");

		try {
			var result = await aosetting.updateUintSetting(settingId11, uintValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update non-approved uint setting");

		try {
			var result = await aosetting.updateUintSetting(settingId6, uintValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update rejected uint setting");

		try {
			var result = await aosetting.updateUintSetting(settingId1, uintValue, nonTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update uint setting with invalid Proposal TAO");

		try {
			var result = await aosetting.updateUintSetting(settingId1, uintValue, proposalTAOId, "", extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update uint setting without update signature");

		try {
			var result = await aosetting.updateUintSetting(settingId1, uintValue, proposalTAOId, updateSignature, extraData, {
				from: account1
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Non-setting Associated TAO's Advocate can update uint setting");

		try {
			var result = await aosetting.updateUintSetting(99, uintValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update uint setting on non-existing setting");

		try {
			var result = await aosetting.updateUintSetting(settingId1, uintValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, true, "Advocate can't update uint setting");

		var pendingValue = await aouintsetting.pendingValue(settingId1.toNumber());
		assert.equal(pendingValue.toNumber(), uintValue, "Setting has incorrect pendingValue");

		assert.equal(settingUpdateEvent.args.settingId.toNumber(), settingId1.toNumber(), "SettingUpdate event has incorrect settingId");
		assert.equal(
			settingUpdateEvent.args.updateAdvocateNameId,
			associatedTAONameId,
			"SettingUpdate event has incorrect updateAdvocateNameId"
		);
		assert.equal(settingUpdateEvent.args.proposalTAOId, proposalTAOId, "SettingUpdate event has incorrect proposalTAOId");

		try {
			var result = await aosetting.updateUintSetting(settingId1, uintValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update uint setting that is currently pending approval");
	});

	it("only the Advocate of setting's Associated TAO can update bool setting", async function() {
		var canUpdate, settingUpdateEvent;
		boolValue = false;
		try {
			var result = await aosetting.updateBoolSetting(settingId1, boolValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can call update bool on non-bool setting");

		try {
			var result = await aosetting.updateBoolSetting(settingId12, boolValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update non-approved bool setting");

		try {
			var result = await aosetting.updateBoolSetting(settingId7, boolValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update rejected bool setting");

		try {
			var result = await aosetting.updateBoolSetting(settingId2, boolValue, nonTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update bool setting with invalid Proposal TAO");

		try {
			var result = await aosetting.updateBoolSetting(settingId2, boolValue, proposalTAOId, "", extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update bool setting without update signature");

		try {
			var result = await aosetting.updateBoolSetting(settingId2, boolValue, proposalTAOId, updateSignature, extraData, {
				from: account1
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Non-setting Associated TAO's Advocate can update bool setting");

		try {
			var result = await aosetting.updateBoolSetting(99, boolValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update bool setting on non-existing setting");

		try {
			var result = await aosetting.updateBoolSetting(settingId2, boolValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, true, "Advocate can't update bool setting");

		var pendingValue = await aoboolsetting.pendingValue(settingId2.toNumber());
		assert.equal(pendingValue, boolValue, "Setting has incorrect pendingValue");

		assert.equal(settingUpdateEvent.args.settingId.toNumber(), settingId2.toNumber(), "SettingUpdate event has incorrect settingId");
		assert.equal(
			settingUpdateEvent.args.updateAdvocateNameId,
			associatedTAONameId,
			"SettingUpdate event has incorrect updateAdvocateNameId"
		);
		assert.equal(settingUpdateEvent.args.proposalTAOId, proposalTAOId, "SettingUpdate event has incorrect proposalTAOId");

		try {
			var result = await aosetting.updateBoolSetting(settingId2, boolValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update bool setting that is currently pending approval");
	});

	it("only the Advocate of setting's Associated TAO can update address setting", async function() {
		var canUpdate, settingUpdateEvent;
		addressValue = accounts[9];
		try {
			var result = await aosetting.updateAddressSetting(settingId2, addressValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can call update address on non-address setting");

		try {
			var result = await aosetting.updateAddressSetting(settingId13, addressValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update non-approved address setting");

		try {
			var result = await aosetting.updateAddressSetting(settingId7, addressValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update rejected address setting");

		try {
			var result = await aosetting.updateAddressSetting(settingId3, addressValue, nonTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update address setting with invalid Proposal TAO");

		try {
			var result = await aosetting.updateAddressSetting(settingId3, addressValue, proposalTAOId, "", extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update address setting without update signature");

		try {
			var result = await aosetting.updateAddressSetting(settingId3, addressValue, proposalTAOId, updateSignature, extraData, {
				from: account1
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Non-setting Associated TAO's Advocate can update address setting");

		try {
			var result = await aosetting.updateAddressSetting(99, addressValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update address setting on non-existing setting");

		try {
			var result = await aosetting.updateAddressSetting(settingId3, addressValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, true, "Advocate can't update address setting");

		var pendingValue = await aoaddresssetting.pendingValue(settingId3.toNumber());
		assert.equal(pendingValue, addressValue, "Setting has incorrect pendingValue");

		assert.equal(settingUpdateEvent.args.settingId.toNumber(), settingId3.toNumber(), "SettingUpdate event has incorrect settingId");
		assert.equal(
			settingUpdateEvent.args.updateAdvocateNameId,
			associatedTAONameId,
			"SettingUpdate event has incorrect updateAdvocateNameId"
		);
		assert.equal(settingUpdateEvent.args.proposalTAOId, proposalTAOId, "SettingUpdate event has incorrect proposalTAOId");

		try {
			var result = await aosetting.updateAddressSetting(settingId3, addressValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update address setting that is currently pending approval");
	});

	it("only the Advocate of setting's Associated TAO can update bytes setting", async function() {
		var canUpdate, settingUpdateEvent;
		bytesValue = "newbytesvalue";
		try {
			var result = await aosetting.updateBytesSetting(settingId2, bytesValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can call update bytes on non-bytes setting");

		try {
			var result = await aosetting.updateBytesSetting(settingId14, bytesValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update non-approved bytes setting");

		try {
			var result = await aosetting.updateBytesSetting(settingId9, bytesValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update rejected bytes setting");

		try {
			var result = await aosetting.updateBytesSetting(settingId4, bytesValue, nonTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update bytes setting with invalid Proposal TAO");

		try {
			var result = await aosetting.updateBytesSetting(settingId4, bytesValue, proposalTAOId, "", extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update bytes setting without update signature");

		try {
			var result = await aosetting.updateBytesSetting(settingId4, bytesValue, proposalTAOId, updateSignature, extraData, {
				from: account1
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Non-setting Associated TAO's Advocate can update bytes setting");

		try {
			var result = await aosetting.updateBytesSetting(99, bytesValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update bytes setting on non-existing setting");

		try {
			var result = await aosetting.updateBytesSetting(settingId4, bytesValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, true, "Advocate can't update bytes setting");

		var pendingValue = await aobytessetting.pendingValue(settingId4.toNumber());
		assert.notEqual(pendingValue, nullBytesValue, "Setting has incorrect pendingValue");

		assert.equal(settingUpdateEvent.args.settingId.toNumber(), settingId4.toNumber(), "SettingUpdate event has incorrect settingId");
		assert.equal(
			settingUpdateEvent.args.updateAdvocateNameId,
			associatedTAONameId,
			"SettingUpdate event has incorrect updateAdvocateNameId"
		);
		assert.equal(settingUpdateEvent.args.proposalTAOId, proposalTAOId, "SettingUpdate event has incorrect proposalTAOId");

		try {
			var result = await aosetting.updateBytesSetting(settingId4, bytesValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update bytes setting that is currently pending approval");
	});

	it("only the Advocate of setting's Associated TAO can update string setting", async function() {
		var canUpdate, settingUpdateEvent;
		stringValue = "newstringvalue";
		try {
			var result = await aosetting.updateStringSetting(settingId2, stringValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can call update string on non-string setting");

		try {
			var result = await aosetting.updateStringSetting(settingId15, stringValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update non-approved string setting");

		try {
			var result = await aosetting.updateStringSetting(settingId10, stringValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update rejected string setting");

		try {
			var result = await aosetting.updateStringSetting(settingId5, stringValue, nonTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update string setting with invalid Proposal TAO");

		try {
			var result = await aosetting.updateStringSetting(settingId5, stringValue, proposalTAOId, "", extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update string setting without update signature");

		try {
			var result = await aosetting.updateStringSetting(settingId5, stringValue, proposalTAOId, updateSignature, extraData, {
				from: account1
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Non-setting Associated TAO's Advocate can update string setting");

		try {
			var result = await aosetting.updateStringSetting(99, stringValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update string setting on non-existing setting");

		try {
			var result = await aosetting.updateStringSetting(settingId5, stringValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, true, "Advocate can't update string setting");

		var pendingValue = await aostringsetting.pendingValue(settingId5.toNumber());
		assert.equal(pendingValue, stringValue, "Setting has incorrect pendingValue");

		assert.equal(settingUpdateEvent.args.settingId.toNumber(), settingId5.toNumber(), "SettingUpdate event has incorrect settingId");
		assert.equal(
			settingUpdateEvent.args.updateAdvocateNameId,
			associatedTAONameId,
			"SettingUpdate event has incorrect updateAdvocateNameId"
		);
		assert.equal(settingUpdateEvent.args.proposalTAOId, proposalTAOId, "SettingUpdate event has incorrect proposalTAOId");

		try {
			var result = await aosetting.updateStringSetting(settingId5, stringValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update string setting that is currently pending approval");
	});

	it("only the Advocate of setting's Proposal TAO can approve uint setting update", async function() {
		var canApprove, approveSettingUpdateEvent;
		try {
			var result = await aosetting.approveSettingUpdate(99, true, { from: account3 });
			canApprove = true;
			approveSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingUpdateEvent = null;
		}
		assert.equal(canApprove, false, "Advocate can approve non-existing setting update");

		try {
			var result = await aosetting.approveSettingUpdate(settingId1, true, { from: account1 });
			canApprove = true;
			approveSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingUpdateEvent = null;
		}
		assert.equal(canApprove, false, "Non-Advocate of setting's Proposal TAO can approve setting update");

		// Approve settingId1
		try {
			var result = await aosetting.approveSettingUpdate(settingId1, true, { from: account3 });
			canApprove = true;
			approveSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingUpdateEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Proposal TAO can't approve setting update");

		assert.equal(
			approveSettingUpdateEvent.args.settingId.toNumber(),
			settingId1.toNumber(),
			"ApproveSettingUpdate has incorrect settingId"
		);
		assert.equal(approveSettingUpdateEvent.args.proposalTAOId, proposalTAOId, "ApproveSettingUpdate has incorrect proposalTAOId");
		assert.equal(
			approveSettingUpdateEvent.args.proposalTAOAdvocate,
			proposalTAONameId,
			"ApproveSettingUpdate has incorrect proposalTAOAdvocate"
		);
		assert.equal(approveSettingUpdateEvent.args.approved, true, "ApproveSettingUpdate has incorrect approved");
	});

	it("only the Advocate of setting's Proposal TAO can approve bool setting update", async function() {
		var canApprove, approveSettingUpdateEvent;
		try {
			var result = await aosetting.approveSettingUpdate(settingId2, true, { from: account1 });
			canApprove = true;
			approveSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingUpdateEvent = null;
		}
		assert.equal(canApprove, false, "Non-Advocate of setting's Proposal TAO can approve setting update");

		// Approve settingId2
		try {
			var result = await aosetting.approveSettingUpdate(settingId2, true, { from: account3 });
			canApprove = true;
			approveSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingUpdateEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Proposal TAO can't approve setting update");

		assert.equal(
			approveSettingUpdateEvent.args.settingId.toNumber(),
			settingId2.toNumber(),
			"ApproveSettingUpdate has incorrect settingId"
		);
		assert.equal(approveSettingUpdateEvent.args.proposalTAOId, proposalTAOId, "ApproveSettingUpdate has incorrect proposalTAOId");
		assert.equal(
			approveSettingUpdateEvent.args.proposalTAOAdvocate,
			proposalTAONameId,
			"ApproveSettingUpdate has incorrect proposalTAOAdvocate"
		);
		assert.equal(approveSettingUpdateEvent.args.approved, true, "ApproveSettingUpdate has incorrect approved");
	});

	it("only the Advocate of setting's Proposal TAO can approve address setting update", async function() {
		var canApprove, approveSettingUpdateEvent;
		try {
			var result = await aosetting.approveSettingUpdate(settingId3, true, { from: account1 });
			canApprove = true;
			approveSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingUpdateEvent = null;
		}
		assert.equal(canApprove, false, "Non-Advocate of setting's Proposal TAO can approve setting update");

		// Approve settingId3
		try {
			var result = await aosetting.approveSettingUpdate(settingId3, true, { from: account3 });
			canApprove = true;
			approveSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingUpdateEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Proposal TAO can't approve setting update");

		assert.equal(
			approveSettingUpdateEvent.args.settingId.toNumber(),
			settingId3.toNumber(),
			"ApproveSettingUpdate has incorrect settingId"
		);
		assert.equal(approveSettingUpdateEvent.args.proposalTAOId, proposalTAOId, "ApproveSettingUpdate has incorrect proposalTAOId");
		assert.equal(
			approveSettingUpdateEvent.args.proposalTAOAdvocate,
			proposalTAONameId,
			"ApproveSettingUpdate has incorrect proposalTAOAdvocate"
		);
		assert.equal(approveSettingUpdateEvent.args.approved, true, "ApproveSettingUpdate has incorrect approved");
	});

	it("only the Advocate of setting's Proposal TAO can approve bytes setting update", async function() {
		var canApprove, approveSettingUpdateEvent;
		try {
			var result = await aosetting.approveSettingUpdate(settingId4, true, { from: account1 });
			canApprove = true;
			approveSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingUpdateEvent = null;
		}
		assert.equal(canApprove, false, "Non-Advocate of setting's Proposal TAO can approve setting update");

		// Approve settingId4
		try {
			var result = await aosetting.approveSettingUpdate(settingId4, true, { from: account3 });
			canApprove = true;
			approveSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingUpdateEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Proposal TAO can't approve setting update");

		assert.equal(
			approveSettingUpdateEvent.args.settingId.toNumber(),
			settingId4.toNumber(),
			"ApproveSettingUpdate has incorrect settingId"
		);
		assert.equal(approveSettingUpdateEvent.args.proposalTAOId, proposalTAOId, "ApproveSettingUpdate has incorrect proposalTAOId");
		assert.equal(
			approveSettingUpdateEvent.args.proposalTAOAdvocate,
			proposalTAONameId,
			"ApproveSettingUpdate has incorrect proposalTAOAdvocate"
		);
		assert.equal(approveSettingUpdateEvent.args.approved, true, "ApproveSettingUpdate has incorrect approved");
	});

	it("only the Advocate of setting's Proposal TAO can approve string setting update", async function() {
		var canApprove, approveSettingUpdateEvent;
		try {
			var result = await aosetting.approveSettingUpdate(settingId5, true, { from: account1 });
			canApprove = true;
			approveSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingUpdateEvent = null;
		}
		assert.equal(canApprove, false, "Non-Advocate of setting's Proposal TAO can approve setting update");

		// Approve settingId5
		try {
			var result = await aosetting.approveSettingUpdate(settingId5, true, { from: account3 });
			canApprove = true;
			approveSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingUpdateEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Proposal TAO can't approve setting update");

		assert.equal(
			approveSettingUpdateEvent.args.settingId.toNumber(),
			settingId5.toNumber(),
			"ApproveSettingUpdate has incorrect settingId"
		);
		assert.equal(approveSettingUpdateEvent.args.proposalTAOId, proposalTAOId, "ApproveSettingUpdate has incorrect proposalTAOId");
		assert.equal(
			approveSettingUpdateEvent.args.proposalTAOAdvocate,
			proposalTAONameId,
			"ApproveSettingUpdate has incorrect proposalTAOAdvocate"
		);
		assert.equal(approveSettingUpdateEvent.args.approved, true, "ApproveSettingUpdate has incorrect approved");
	});

	it("only the Advocate of setting's Associated TAO can finalize uint setting update", async function() {
		var canFinalize, finalizeSettingUpdateEvent;
		try {
			var result = await aosetting.finalizeSettingUpdate(99, { from: account2 });
			canFinalize = true;
			finalizeSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingUpdateEvent = null;
		}
		assert.equal(canFinalize, false, "Advocate can finalize non-existing setting");

		try {
			var result = await aosetting.finalizeSettingUpdate(settingId1, { from: account1 });
			canFinalize = true;
			finalizeSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingUpdateEvent = null;
		}
		assert.equal(canFinalize, false, "Non-Advocate of Associated TAO can finalize setting update");

		try {
			var result = await aosetting.finalizeSettingUpdate(settingId11, { from: account2 });
			canFinalize = true;
			finalizeSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingUpdateEvent = null;
		}
		assert.equal(canFinalize, false, "Advocate can finalize update for non-approved setting");

		try {
			var result = await aosetting.finalizeSettingUpdate(settingId6, { from: account2 });
			canFinalize = true;
			finalizeSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingUpdateEvent = null;
		}
		assert.equal(canFinalize, false, "Advocate can finalize update for rejected setting");

		try {
			var result = await aosetting.finalizeSettingUpdate(settingId1, { from: account2 });
			canFinalize = true;
			finalizeSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingUpdateEvent = null;
		}
		assert.equal(canFinalize, true, "Advocate can't finalize setting update");

		var pendingValue = await aouintsetting.pendingValue(settingId1.toNumber());
		assert.equal(pendingValue.toNumber(), 0, "Setting has incorrect pendingValue");

		var settingValue = await aouintsetting.settingValue(settingId1.toNumber());
		assert.equal(settingValue.toNumber(), uintValue, "Setting has incorrect settingValue");

		assert.equal(
			finalizeSettingUpdateEvent.args.settingId.toNumber(),
			settingId1.toNumber(),
			"FinalizeSettingUpdate event has incorrect settingId"
		);
		assert.equal(
			finalizeSettingUpdateEvent.args.associatedTAOId,
			associatedTAOId,
			"FinalizeSettingUpdate event has incorrect associatedTAOId"
		);
		assert.equal(
			finalizeSettingUpdateEvent.args.associatedTAOAdvocate,
			associatedTAONameId,
			"FinalizeSettingUpdate event has incorrect associatedTAOAdvocate"
		);

		var settingValues = await aosetting.getSettingValuesById(settingId1.toNumber());
		assert.equal(settingValues[0].toNumber(), uintValue, "getSettingValuesById() return incorrect uint256 value");

		var settingValues = await aosetting.getSettingValuesByTAOName(associatedTAOId, "uintSetting");
		assert.equal(settingValues[0].toNumber(), uintValue, "getSettingValuesByTAOName() return incorrect uint256 value");
	});

	it("only the Advocate of setting's Associated TAO can finalize bool setting update", async function() {
		var canFinalize, finalizeSettingUpdateEvent;
		try {
			var result = await aosetting.finalizeSettingUpdate(settingId2, { from: account1 });
			canFinalize = true;
			finalizeSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingUpdateEvent = null;
		}
		assert.equal(canFinalize, false, "Non-Advocate of Associated TAO can finalize setting update");

		try {
			var result = await aosetting.finalizeSettingUpdate(settingId12, { from: account2 });
			canFinalize = true;
			finalizeSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingUpdateEvent = null;
		}
		assert.equal(canFinalize, false, "Advocate can finalize update for non-approved setting");

		try {
			var result = await aosetting.finalizeSettingUpdate(settingId7, { from: account2 });
			canFinalize = true;
			finalizeSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingUpdateEvent = null;
		}
		assert.equal(canFinalize, false, "Advocate can finalize update for rejected setting");

		try {
			var result = await aosetting.finalizeSettingUpdate(settingId2, { from: account2 });
			canFinalize = true;
			finalizeSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingUpdateEvent = null;
		}
		assert.equal(canFinalize, true, "Advocate can't finalize setting update");

		var pendingValue = await aoboolsetting.pendingValue(settingId2.toNumber());
		assert.equal(pendingValue, false, "Setting has incorrect pendingValue");

		var settingValue = await aoboolsetting.settingValue(settingId2.toNumber());
		assert.equal(settingValue, boolValue, "Setting has incorrect settingValue");

		assert.equal(
			finalizeSettingUpdateEvent.args.settingId.toNumber(),
			settingId2.toNumber(),
			"FinalizeSettingUpdate event has incorrect settingId"
		);
		assert.equal(
			finalizeSettingUpdateEvent.args.associatedTAOId,
			associatedTAOId,
			"FinalizeSettingUpdate event has incorrect associatedTAOId"
		);
		assert.equal(
			finalizeSettingUpdateEvent.args.associatedTAOAdvocate,
			associatedTAONameId,
			"FinalizeSettingUpdate event has incorrect associatedTAOAdvocate"
		);

		var settingValues = await aosetting.getSettingValuesById(settingId2.toNumber());
		assert.equal(settingValues[1], boolValue, "getSettingValuesById() return incorrect bool value");

		var settingValues = await aosetting.getSettingValuesByTAOName(associatedTAOId, "boolSetting");
		assert.equal(settingValues[1], boolValue, "getSettingValuesByTAOName() return incorrect bool value");
	});

	it("only the Advocate of setting's Associated TAO can finalize address setting update", async function() {
		var canFinalize, finalizeSettingUpdateEvent;
		try {
			var result = await aosetting.finalizeSettingUpdate(settingId3, { from: account1 });
			canFinalize = true;
			finalizeSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingUpdateEvent = null;
		}
		assert.equal(canFinalize, false, "Non-Advocate of Associated TAO can finalize setting update");

		try {
			var result = await aosetting.finalizeSettingUpdate(settingId13, { from: account2 });
			canFinalize = true;
			finalizeSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingUpdateEvent = null;
		}
		assert.equal(canFinalize, false, "Advocate can finalize update for non-approved setting");

		try {
			var result = await aosetting.finalizeSettingUpdate(settingId8, { from: account2 });
			canFinalize = true;
			finalizeSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingUpdateEvent = null;
		}
		assert.equal(canFinalize, false, "Advocate can finalize update for rejected setting");

		try {
			var result = await aosetting.finalizeSettingUpdate(settingId3, { from: account2 });
			canFinalize = true;
			finalizeSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingUpdateEvent = null;
		}
		assert.equal(canFinalize, true, "Advocate can't finalize setting update");

		var pendingValue = await aoaddresssetting.pendingValue(settingId3.toNumber());
		assert.equal(pendingValue, emptyAddress, "Setting has incorrect pendingValue");

		var settingValue = await aoaddresssetting.settingValue(settingId3.toNumber());
		assert.equal(settingValue, addressValue, "Setting has incorrect settingValue");

		assert.equal(
			finalizeSettingUpdateEvent.args.settingId.toNumber(),
			settingId3.toNumber(),
			"FinalizeSettingUpdate event has incorrect settingId"
		);
		assert.equal(
			finalizeSettingUpdateEvent.args.associatedTAOId,
			associatedTAOId,
			"FinalizeSettingUpdate event has incorrect associatedTAOId"
		);
		assert.equal(
			finalizeSettingUpdateEvent.args.associatedTAOAdvocate,
			associatedTAONameId,
			"FinalizeSettingUpdate event has incorrect associatedTAOAdvocate"
		);

		var settingValues = await aosetting.getSettingValuesById(settingId3.toNumber());
		assert.equal(settingValues[2], addressValue, "getSettingValuesById() return incorrect address value");

		var settingValues = await aosetting.getSettingValuesByTAOName(associatedTAOId, "addressSetting");
		assert.equal(settingValues[2], addressValue, "getSettingValuesByTAOName() return incorrect address value");
	});

	it("only the Advocate of setting's Associated TAO can finalize bytes setting update", async function() {
		var canFinalize, finalizeSettingUpdateEvent;
		try {
			var result = await aosetting.finalizeSettingUpdate(settingId4, { from: account1 });
			canFinalize = true;
			finalizeSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingUpdateEvent = null;
		}
		assert.equal(canFinalize, false, "Non-Advocate of Associated TAO can finalize setting update");

		try {
			var result = await aosetting.finalizeSettingUpdate(settingId14, { from: account2 });
			canFinalize = true;
			finalizeSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingUpdateEvent = null;
		}
		assert.equal(canFinalize, false, "Advocate can finalize update for non-approved setting");

		try {
			var result = await aosetting.finalizeSettingUpdate(settingId9, { from: account2 });
			canFinalize = true;
			finalizeSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingUpdateEvent = null;
		}
		assert.equal(canFinalize, false, "Advocate can finalize update for rejected setting");

		try {
			var result = await aosetting.finalizeSettingUpdate(settingId4, { from: account2 });
			canFinalize = true;
			finalizeSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingUpdateEvent = null;
		}
		assert.equal(canFinalize, true, "Advocate can't finalize setting update");

		var pendingValue = await aobytessetting.pendingValue(settingId4.toNumber());
		assert.equal(pendingValue, nullBytesValue, "Setting has incorrect pendingValue");

		var settingValue = await aobytessetting.settingValue(settingId4.toNumber());
		assert.notEqual(settingValue, nullBytesValue, "Setting has incorrect settingValue");

		assert.equal(
			finalizeSettingUpdateEvent.args.settingId.toNumber(),
			settingId4.toNumber(),
			"FinalizeSettingUpdate event has incorrect settingId"
		);
		assert.equal(
			finalizeSettingUpdateEvent.args.associatedTAOId,
			associatedTAOId,
			"FinalizeSettingUpdate event has incorrect associatedTAOId"
		);
		assert.equal(
			finalizeSettingUpdateEvent.args.associatedTAOAdvocate,
			associatedTAONameId,
			"FinalizeSettingUpdate event has incorrect associatedTAOAdvocate"
		);

		var settingValues = await aosetting.getSettingValuesById(settingId4.toNumber());
		assert.notEqual(settingValues[3], nullBytesValue, "getSettingValuesById() return incorrect bytes32 value");

		var settingValues = await aosetting.getSettingValuesByTAOName(associatedTAOId, "bytesSetting");
		assert.notEqual(settingValues[3], nullBytesValue, "getSettingValuesByTAOName() return incorrect bytes32 value");
	});

	it("only the Advocate of setting's Associated TAO can finalize string setting update", async function() {
		var canFinalize, finalizeSettingUpdateEvent;
		try {
			var result = await aosetting.finalizeSettingUpdate(settingId5, { from: account1 });
			canFinalize = true;
			finalizeSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingUpdateEvent = null;
		}
		assert.equal(canFinalize, false, "Non-Advocate of Associated TAO can finalize setting update");

		try {
			var result = await aosetting.finalizeSettingUpdate(settingId15, { from: account2 });
			canFinalize = true;
			finalizeSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingUpdateEvent = null;
		}
		assert.equal(canFinalize, false, "Advocate can finalize update for non-approved setting");

		try {
			var result = await aosetting.finalizeSettingUpdate(settingId10, { from: account2 });
			canFinalize = true;
			finalizeSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingUpdateEvent = null;
		}
		assert.equal(canFinalize, false, "Advocate can finalize update for rejected setting");

		try {
			var result = await aosetting.finalizeSettingUpdate(settingId5, { from: account2 });
			canFinalize = true;
			finalizeSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingUpdateEvent = null;
		}
		assert.equal(canFinalize, true, "Advocate can't finalize setting update");

		var pendingValue = await aostringsetting.pendingValue(settingId5.toNumber());
		assert.equal(pendingValue, "", "Setting has incorrect pendingValue");

		var settingValue = await aostringsetting.settingValue(settingId5.toNumber());
		assert.equal(settingValue, stringValue, "Setting has incorrect settingValue");

		assert.equal(
			finalizeSettingUpdateEvent.args.settingId.toNumber(),
			settingId5.toNumber(),
			"FinalizeSettingUpdate event has incorrect settingId"
		);
		assert.equal(
			finalizeSettingUpdateEvent.args.associatedTAOId,
			associatedTAOId,
			"FinalizeSettingUpdate event has incorrect associatedTAOId"
		);
		assert.equal(
			finalizeSettingUpdateEvent.args.associatedTAOAdvocate,
			associatedTAONameId,
			"FinalizeSettingUpdate event has incorrect associatedTAOAdvocate"
		);

		var settingValues = await aosetting.getSettingValuesById(settingId5.toNumber());
		assert.equal(settingValues[4], stringValue, "getSettingValuesById() return incorrect string value");

		var settingValues = await aosetting.getSettingValuesByTAOName(associatedTAOId, "stringSetting");
		assert.equal(settingValues[4], stringValue, "getSettingValuesByTAOName() return incorrect string value");
	});

	it("only the Advocate of setting's Proposal TAO can reject uint setting update", async function() {
		uintValue = 1000;
		var result = await aosetting.updateUintSetting(settingId1, uintValue, proposalTAOId, updateSignature, extraData, {
			from: account2
		});

		var canApprove, approveSettingUpdateEvent;
		// Reject settingId1
		try {
			var result = await aosetting.approveSettingUpdate(settingId1, false, { from: account3 });
			canApprove = true;
			approveSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingUpdateEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Proposal TAO can't reject setting update");

		assert.equal(
			approveSettingUpdateEvent.args.settingId.toNumber(),
			settingId1.toNumber(),
			"ApproveSettingUpdate has incorrect settingId"
		);
		assert.equal(approveSettingUpdateEvent.args.proposalTAOId, proposalTAOId, "ApproveSettingUpdate has incorrect proposalTAOId");
		assert.equal(
			approveSettingUpdateEvent.args.proposalTAOAdvocate,
			proposalTAONameId,
			"ApproveSettingUpdate has incorrect proposalTAOAdvocate"
		);
		assert.equal(approveSettingUpdateEvent.args.approved, false, "ApproveSettingUpdate has incorrect approved");

		var canFinalize;
		try {
			var result = await aosetting.finalizeSettingUpdate(settingId1, { from: account2 });
			canFinalize = true;
		} catch (e) {
			canFinalize = false;
		}
		assert.equal(canFinalize, false, "Advocate can finalize rejected setting update");
	});

	it("only the Advocate of setting's Proposal TAO can reject bool setting update", async function() {
		boolValue = true;
		var result = await aosetting.updateBoolSetting(settingId2, boolValue, proposalTAOId, updateSignature, extraData, {
			from: account2
		});

		var canApprove, approveSettingUpdateEvent;
		// Reject settingId2
		try {
			var result = await aosetting.approveSettingUpdate(settingId2, false, { from: account3 });
			canApprove = true;
			approveSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingUpdateEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Proposal TAO can't reject setting update");

		assert.equal(
			approveSettingUpdateEvent.args.settingId.toNumber(),
			settingId2.toNumber(),
			"ApproveSettingUpdate has incorrect settingId"
		);
		assert.equal(approveSettingUpdateEvent.args.proposalTAOId, proposalTAOId, "ApproveSettingUpdate has incorrect proposalTAOId");
		assert.equal(
			approveSettingUpdateEvent.args.proposalTAOAdvocate,
			proposalTAONameId,
			"ApproveSettingUpdate has incorrect proposalTAOAdvocate"
		);
		assert.equal(approveSettingUpdateEvent.args.approved, false, "ApproveSettingUpdate has incorrect approved");

		var canFinalize;
		try {
			var result = await aosetting.finalizeSettingUpdate(settingId2, { from: account2 });
			canFinalize = true;
		} catch (e) {
			canFinalize = false;
		}
		assert.equal(canFinalize, false, "Advocate can finalize rejected setting update");
	});

	it("only the Advocate of setting's Proposal TAO can reject address setting update", async function() {
		addressValue = accounts[9];
		var result = await aosetting.updateAddressSetting(settingId3, addressValue, proposalTAOId, updateSignature, extraData, {
			from: account2
		});

		var canApprove, approveSettingUpdateEvent;
		// Reject settingId3
		try {
			var result = await aosetting.approveSettingUpdate(settingId3, false, { from: account3 });
			canApprove = true;
			approveSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingUpdateEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Proposal TAO can't reject setting update");

		assert.equal(
			approveSettingUpdateEvent.args.settingId.toNumber(),
			settingId3.toNumber(),
			"ApproveSettingUpdate has incorrect settingId"
		);
		assert.equal(approveSettingUpdateEvent.args.proposalTAOId, proposalTAOId, "ApproveSettingUpdate has incorrect proposalTAOId");
		assert.equal(
			approveSettingUpdateEvent.args.proposalTAOAdvocate,
			proposalTAONameId,
			"ApproveSettingUpdate has incorrect proposalTAOAdvocate"
		);
		assert.equal(approveSettingUpdateEvent.args.approved, false, "ApproveSettingUpdate has incorrect approved");

		var canFinalize;
		try {
			var result = await aosetting.finalizeSettingUpdate(settingId3, { from: account2 });
			canFinalize = true;
		} catch (e) {
			canFinalize = false;
		}
		assert.equal(canFinalize, false, "Advocate can finalize rejected setting update");
	});

	it("only the Advocate of setting's Proposal TAO can reject bytes setting update", async function() {
		bytesValue = "anotherbytesvalue";
		var result = await aosetting.updateBytesSetting(settingId4, bytesValue, proposalTAOId, updateSignature, extraData, {
			from: account2
		});

		var canApprove, approveSettingUpdateEvent;
		// Reject settingId4
		try {
			var result = await aosetting.approveSettingUpdate(settingId4, false, { from: account3 });
			canApprove = true;
			approveSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingUpdateEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Proposal TAO can't reject setting update");

		assert.equal(
			approveSettingUpdateEvent.args.settingId.toNumber(),
			settingId4.toNumber(),
			"ApproveSettingUpdate has incorrect settingId"
		);
		assert.equal(approveSettingUpdateEvent.args.proposalTAOId, proposalTAOId, "ApproveSettingUpdate has incorrect proposalTAOId");
		assert.equal(
			approveSettingUpdateEvent.args.proposalTAOAdvocate,
			proposalTAONameId,
			"ApproveSettingUpdate has incorrect proposalTAOAdvocate"
		);
		assert.equal(approveSettingUpdateEvent.args.approved, false, "ApproveSettingUpdate has incorrect approved");

		var canFinalize;
		try {
			var result = await aosetting.finalizeSettingUpdate(settingId4, { from: account2 });
			canFinalize = true;
		} catch (e) {
			canFinalize = false;
		}
		assert.equal(canFinalize, false, "Advocate can finalize rejected setting update");
	});

	it("only the Advocate of setting's Proposal TAO can reject string setting update", async function() {
		stringValue = "anotherstringvalue";
		var result = await aosetting.updateStringSetting(settingId5, stringValue, proposalTAOId, updateSignature, extraData, {
			from: account2
		});

		var canApprove, approveSettingUpdateEvent;
		// Reject settingId5
		try {
			var result = await aosetting.approveSettingUpdate(settingId5, false, { from: account3 });
			canApprove = true;
			approveSettingUpdateEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingUpdateEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Proposal TAO can't reject setting update");

		assert.equal(
			approveSettingUpdateEvent.args.settingId.toNumber(),
			settingId5.toNumber(),
			"ApproveSettingUpdate has incorrect settingId"
		);
		assert.equal(approveSettingUpdateEvent.args.proposalTAOId, proposalTAOId, "ApproveSettingUpdate has incorrect proposalTAOId");
		assert.equal(
			approveSettingUpdateEvent.args.proposalTAOAdvocate,
			proposalTAONameId,
			"ApproveSettingUpdate has incorrect proposalTAOAdvocate"
		);
		assert.equal(approveSettingUpdateEvent.args.approved, false, "ApproveSettingUpdate has incorrect approved");

		var canFinalize;
		try {
			var result = await aosetting.finalizeSettingUpdate(settingId5, { from: account2 });
			canFinalize = true;
		} catch (e) {
			canFinalize = false;
		}
		assert.equal(canFinalize, false, "Advocate can finalize rejected setting update");
	});

	it("only the Advocate of a Creator TAO can add setting deprecation", async function() {
		var canAdd, settingDeprecationEvent, associatedTAOSettingDeprecationId, creatorTAOSettingDeprecationId;
		try {
			var result = await aosetting.addSettingDeprecation(
				settingId1,
				settingId16,
				newSettingContractAddress,
				nonTAOId,
				associatedTAOId,
				{
					from: account1
				}
			);
			canAdd = true;
			settingDeprecationEvent = result.logs[0];
			associatedTAOSettingDeprecationId = settingDeprecationEvent.args.associatedTAOSettingDeprecationId;
			creatorTAOSettingDeprecationId = settingDeprecationEvent.args.creatorTAOSettingDeprecationId;
		} catch (e) {
			canAdd = false;
			settingDeprecationEvent = null;
			associatedTAOSettingDeprecationId = null;
			creatorTAOSettingDeprecationId = null;
		}
		assert.equal(canAdd, false, "Can create deprecation using invalid Creator TAO");

		try {
			var result = await aosetting.addSettingDeprecation(settingId1, settingId16, newSettingContractAddress, creatorTAOId, nonTAOId, {
				from: account1
			});
			canAdd = true;
			settingDeprecationEvent = result.logs[0];
			associatedTAOSettingDeprecationId = settingDeprecationEvent.args.associatedTAOSettingDeprecationId;
			creatorTAOSettingDeprecationId = settingDeprecationEvent.args.creatorTAOSettingDeprecationId;
		} catch (e) {
			canAdd = false;
			settingDeprecationEvent = null;
			associatedTAOSettingDeprecationId = null;
			creatorTAOSettingDeprecationId = null;
		}
		assert.equal(canAdd, false, "Can create deprecation using invalid Associated TAO");

		try {
			var result = await aosetting.addSettingDeprecation(
				settingId1,
				settingId17,
				newSettingContractAddress,
				creatorTAOId,
				associatedTAOId,
				{
					from: account1
				}
			);
			canAdd = true;
			settingDeprecationEvent = result.logs[0];
			associatedTAOSettingDeprecationId = settingDeprecationEvent.args.associatedTAOSettingDeprecationId;
			creatorTAOSettingDeprecationId = settingDeprecationEvent.args.creatorTAOSettingDeprecationId;
		} catch (e) {
			canAdd = false;
			settingDeprecationEvent = null;
			associatedTAOSettingDeprecationId = null;
			creatorTAOSettingDeprecationId = null;
		}
		assert.equal(canAdd, false, "Advocate can create setting deprecation and route setting to a non-matching setting type");

		try {
			var result = await aosetting.addSettingDeprecation(
				settingId1,
				settingId6,
				newSettingContractAddress,
				creatorTAOId,
				associatedTAOId,
				{
					from: account1
				}
			);
			canAdd = true;
			settingDeprecationEvent = result.logs[0];
			associatedTAOSettingDeprecationId = settingDeprecationEvent.args.associatedTAOSettingDeprecationId;
			creatorTAOSettingDeprecationId = settingDeprecationEvent.args.creatorTAOSettingDeprecationId;
		} catch (e) {
			canAdd = false;
			settingDeprecationEvent = null;
			associatedTAOSettingDeprecationId = null;
			creatorTAOSettingDeprecationId = null;
		}
		assert.equal(canAdd, false, "Advocate can create setting deprecation and route setting to rejected setting");

		try {
			var result = await aosetting.addSettingDeprecation(
				settingId1,
				settingId11,
				newSettingContractAddress,
				creatorTAOId,
				associatedTAOId,
				{
					from: account1
				}
			);
			canAdd = true;
			settingDeprecationEvent = result.logs[0];
			associatedTAOSettingDeprecationId = settingDeprecationEvent.args.associatedTAOSettingDeprecationId;
			creatorTAOSettingDeprecationId = settingDeprecationEvent.args.creatorTAOSettingDeprecationId;
		} catch (e) {
			canAdd = false;
			settingDeprecationEvent = null;
			associatedTAOSettingDeprecationId = null;
			creatorTAOSettingDeprecationId = null;
		}
		assert.equal(canAdd, false, "Advocate can create setting deprecation and route setting to non-approved setting");

		try {
			var result = await aosetting.addSettingDeprecation(
				settingId1,
				settingId16,
				newSettingContractAddress,
				creatorTAOId,
				associatedTAOId,
				{
					from: account2
				}
			);
			canAdd = true;
			settingDeprecationEvent = result.logs[0];
			associatedTAOSettingDeprecationId = settingDeprecationEvent.args.associatedTAOSettingDeprecationId;
			creatorTAOSettingDeprecationId = settingDeprecationEvent.args.creatorTAOSettingDeprecationId;
		} catch (e) {
			canAdd = false;
			settingDeprecationEvent = null;
			associatedTAOSettingDeprecationId = null;
			creatorTAOSettingDeprecationId = null;
		}
		assert.equal(canAdd, false, "Non-Advocate of setting's Creator TAO can create setting deprecation");

		try {
			var result = await aosetting.addSettingDeprecation(
				settingId1,
				settingId16,
				newSettingContractAddress,
				creatorTAOId,
				associatedTAOId,
				{
					from: account1
				}
			);
			canAdd = true;
			settingDeprecationEvent = result.logs[0];
			associatedTAOSettingDeprecationId = settingDeprecationEvent.args.associatedTAOSettingDeprecationId;
			creatorTAOSettingDeprecationId = settingDeprecationEvent.args.creatorTAOSettingDeprecationId;
		} catch (e) {
			canAdd = false;
			settingDeprecationEvent = null;
			associatedTAOSettingDeprecationId = null;
			creatorTAOSettingDeprecationId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator TAO can't create setting deprecation");

		assert.equal(
			settingDeprecationEvent.args.settingId.toNumber(),
			settingId1.toNumber(),
			"SettingDeprecation event has incorrect settingId"
		);
		assert.equal(settingDeprecationEvent.args.creatorNameId, creatorTAONameId, "SettingDeprecation event has incorrect creatorNameId");
		assert.equal(settingDeprecationEvent.args.creatorTAOId, creatorTAOId, "SettingDeprecation event has incorrect creatorTAOId");
		assert.equal(
			settingDeprecationEvent.args.associatedTAOId,
			associatedTAOId,
			"SettingDeprecation event has incorrect associatedTAOId"
		);
		assert.equal(
			settingDeprecationEvent.args.newSettingId.toNumber(),
			settingId16.toNumber(),
			"SettingDeprecation event has incorrect newSettingId"
		);
		assert.equal(
			settingDeprecationEvent.args.newSettingContractAddress,
			newSettingContractAddress,
			"SettingDeprecation event has incorrect newSettingContractAddress"
		);

		var associatedTAOSettingDeprecation = await aosettingattribute.getAssociatedTAOSettingDeprecation(
			associatedTAOSettingDeprecationId
		);
		assert.equal(
			associatedTAOSettingDeprecation[0],
			associatedTAOSettingDeprecationId,
			"getAssociatedTAOSettingDeprecation returns incorrect associatedTAOSettingDeprecationId"
		);
		assert.equal(
			associatedTAOSettingDeprecation[1],
			associatedTAOId,
			"getAssociatedTAOSettingDeprecation returns incorrect associatedTAOId"
		);
		assert.equal(
			associatedTAOSettingDeprecation[2].toNumber(),
			settingId1.toNumber(),
			"getAssociatedTAOSettingDeprecation returns incorrect settingId"
		);

		var creatorTAOSettingDeprecation = await aosettingattribute.getCreatorTAOSettingDeprecation(creatorTAOSettingDeprecationId);
		assert.equal(
			creatorTAOSettingDeprecation[0],
			creatorTAOSettingDeprecationId,
			"getCreatorTAOSettingDeprecation returns incorrect creatorTAOSettingDeprecationId"
		);
		assert.equal(creatorTAOSettingDeprecation[1], creatorTAOId, "getCreatorTAOSettingDeprecation returns incorrect creatorTAOId");
		assert.equal(
			creatorTAOSettingDeprecation[2].toNumber(),
			settingId1.toNumber(),
			"getCreatorTAOSettingDeprecation returns incorrect settingId"
		);

		// Add deprecation for settingId2
		try {
			var result = await aosetting.addSettingDeprecation(
				settingId2,
				settingId17,
				newSettingContractAddress,
				creatorTAOId,
				associatedTAOId,
				{
					from: account1
				}
			);
			canAdd = true;
			settingDeprecationEvent = result.logs[0];
			associatedTAOSettingDeprecationId = settingDeprecationEvent.args.associatedTAOSettingDeprecationId;
			creatorTAOSettingDeprecationId = settingDeprecationEvent.args.creatorTAOSettingDeprecationId;
		} catch (e) {
			canAdd = false;
			settingDeprecationEvent = null;
			associatedTAOSettingDeprecationId = null;
			creatorTAOSettingDeprecationId = null;
		}
		assert.equal(canAdd, true, "Advocate of Creator TAO can't create setting deprecation");
	});

	it("only the Advocate of setting deprecation's Associated TAO can approve/reject uint setting deprecation", async function() {
		var canApprove, approveSettingDeprecationEvent;
		try {
			var result = await aosetting.approveSettingDeprecation(99, true, { from: account1 });
			canApprove = true;
			approveSettingDeprecationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingDeprecationEvent = null;
		}
		assert.equal(canApprove, false, "Advocate can approve non-existing setting deprecation");

		try {
			var result = await aosetting.approveSettingDeprecation(settingId1, true, { from: account1 });
			canApprove = true;
			approveSettingDeprecationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingDeprecationEvent = null;
		}
		assert.equal(canApprove, false, "Non-Advocate of setting's Associated TAO can approve setting deprecation");

		// Approve settingId1
		try {
			var result = await aosetting.approveSettingDeprecation(settingId1, true, { from: account2 });
			canApprove = true;
			approveSettingDeprecationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingDeprecationEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Associated TAO can't approve setting deprecation");

		assert.equal(
			approveSettingDeprecationEvent.args.settingId.toNumber(),
			settingId1.toNumber(),
			"ApproveSettingDeprecation has incorrect settingId"
		);
		assert.equal(
			approveSettingDeprecationEvent.args.associatedTAOId,
			associatedTAOId,
			"ApproveSettingDeprecation has incorrect associatedTAOId"
		);
		assert.equal(
			approveSettingDeprecationEvent.args.associatedTAOAdvocate,
			associatedTAONameId,
			"ApproveSettingDeprecation has incorrect associatedTAOAdvocate"
		);
		assert.equal(approveSettingDeprecationEvent.args.approved, true, "ApproveSettingDeprecation has incorrect approved");

		// Reject settingId2
		try {
			var result = await aosetting.approveSettingDeprecation(settingId2, false, { from: account2 });
			canApprove = true;
			approveSettingDeprecationEvent = result.logs[0];
		} catch (e) {
			canApprove = false;
			approveSettingDeprecationEvent = null;
		}
		assert.equal(canApprove, true, "Advocate of setting's Associated TAO can't approve setting deprecation");

		assert.equal(
			approveSettingDeprecationEvent.args.settingId.toNumber(),
			settingId2.toNumber(),
			"ApproveSettingDeprecation has incorrect settingId"
		);
		assert.equal(
			approveSettingDeprecationEvent.args.associatedTAOId,
			associatedTAOId,
			"ApproveSettingDeprecation has incorrect associatedTAOId"
		);
		assert.equal(
			approveSettingDeprecationEvent.args.associatedTAOAdvocate,
			associatedTAONameId,
			"ApproveSettingDeprecation has incorrect associatedTAOAdvocate"
		);
		assert.equal(approveSettingDeprecationEvent.args.approved, false, "ApproveSettingDeprecation has incorrect approved");
	});

	it("only the Advocate of setting's Creator TAO can finalize setting deprecation", async function() {
		var canFinalize, finalizeSettingDeprecationEvent;
		try {
			var result = await aosetting.finalizeSettingDeprecation(99, { from: account1 });
			canFinalize = true;
			finalizeSettingDeprecationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingDeprecationEvent = null;
		}
		assert.equal(canFinalize, false, "Advocate can finalize non-existing setting deprecation");

		try {
			var result = await aosetting.finalizeSettingDeprecation(settingId1, { from: account2 });
			canFinalize = true;
			finalizeSettingDeprecationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingDeprecationEvent = null;
		}
		assert.equal(canFinalize, false, "Non-Advocate of Creator TAO can finalize setting deprecation");

		try {
			var result = await aosetting.finalizeSettingDeprecation(settingId3, { from: account1 });
			canFinalize = true;
			finalizeSettingDeprecationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingDeprecationEvent = null;
		}
		assert.equal(canFinalize, false, "Advocate can finalize setting that has no deprecation");

		try {
			var result = await aosetting.finalizeSettingDeprecation(settingId2, { from: account1 });
			canFinalize = true;
			finalizeSettingDeprecationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingDeprecationEvent = null;
		}
		assert.equal(canFinalize, false, "Advocate can finalize rejected setting deprecation");

		try {
			var result = await aosetting.finalizeSettingDeprecation(settingId1, { from: account1 });
			canFinalize = true;
			finalizeSettingDeprecationEvent = result.logs[0];
		} catch (e) {
			canFinalize = false;
			finalizeSettingDeprecationEvent = null;
		}
		assert.equal(canFinalize, true, "Advocate can't finalize setting deprecation");

		assert.equal(
			finalizeSettingDeprecationEvent.args.settingId.toNumber(),
			settingId1.toNumber(),
			"FinalizeSettingDeprecation event has incorrect settingId"
		);
		assert.equal(
			finalizeSettingDeprecationEvent.args.creatorTAOId,
			creatorTAOId,
			"FinalizeSettingDeprecation event has incorrect creatorTAOId"
		);
		assert.equal(
			finalizeSettingDeprecationEvent.args.creatorTAOAdvocate,
			creatorTAONameId,
			"FinalizeSettingDeprecation event has incorrect creatorTAOAdvocate"
		);

		var settingId1Values = await aosetting.getSettingValuesById(settingId1.toNumber());
		var settingId16Value = await aouintsetting.settingValue(settingId16.toNumber());
		assert.equal(
			settingId1Values[0].toNumber(),
			settingId16Value.toNumber(),
			"getSettingValuesById() return incorrect uint256 value for deprecated setting"
		);

		var settingId1Values = await aosetting.getSettingValuesByTAOName(associatedTAOId, "uintSetting");
		assert.equal(
			settingId1Values[0].toNumber(),
			settingId16Value.toNumber(),
			"getSettingValuesByTAOName() return incorrect uint256 value"
		);
	});

	it("Advocate should not be able to update deprecated setting", async function() {
		var canUpdate, settingUpdateEvent;
		uintValue = 100;
		try {
			var result = await aosetting.updateUintSetting(settingId1, uintValue, proposalTAOId, updateSignature, extraData, {
				from: account2
			});
			canUpdate = true;
			settingUpdateEvent = result.logs[0];
		} catch (e) {
			canUpdate = false;
			settingUpdateEvent = null;
		}
		assert.equal(canUpdate, false, "Advocate can update deprecated uint setting");
	});
});
