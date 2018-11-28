var AOSettingAttribute = artifacts.require("./AOSettingAttribute.sol");
var NameFactory = artifacts.require("./NameFactory.sol");
var ThoughtFactory = artifacts.require("./ThoughtFactory.sol");

contract("AOSettingAttribute", function(accounts) {
	var aosettingattribute, namefactory, thoughtfactory;
	var developer = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var whitelistedAccount = accounts[9];
	var settingId1 = 1;
	var settingId2 = 2;
	var settingId3 = 3;
	var creatorThoughtNameId, creatorThoughtId, associatedThoughtNameId, associatedThoughtId, proposalThoughtNameId, proposalThoughtId;
	var settingType = 1;
	var settingName = "someSettingName";
	var extraData = JSON.stringify({ extraVariable: "someValue" });
	var emptyAddress = "0x0000000000000000000000000000000000000000";
	var updateSignature = "somesignature";
	var newSettingId = 4;
	var newSettingContractAddress = accounts[4];

	before(async function() {
		aosettingattribute = await AOSettingAttribute.deployed();
		namefactory = await NameFactory.deployed();
		thoughtfactory = await ThoughtFactory.deployed();

		await aosettingattribute.setWhitelist(whitelistedAccount, true, { from: developer });

		// Create a name
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

		// Create a thought
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

	it("only whitelisted account can add setting attribute (Data/State)", async function() {
		var canAdd;
		try {
			var result = await aosettingattribute.add(
				settingId1,
				creatorThoughtNameId,
				settingType,
				settingName,
				creatorThoughtId,
				associatedThoughtId,
				extraData,
				{ from: account1 }
			);
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.equal(canAdd, false, "Non-whitelisted account can add setting attribute");

		try {
			var result = await aosettingattribute.add(
				settingId1,
				creatorThoughtNameId,
				settingType,
				settingName,
				creatorThoughtId,
				associatedThoughtId,
				extraData,
				{ from: whitelistedAccount }
			);
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.equal(canAdd, true, "Whitelisted account can't add setting attribute");

		var settingData = await aosettingattribute.getSettingData(settingId1);
		assert.equal(settingData[0].toNumber(), settingId1, "SettingData has incorrect settingId1");
		assert.equal(settingData[1], creatorThoughtNameId, "SettingData has incorrect creatorThoughtNameId");
		assert.equal(settingData[2], creatorThoughtId, "SettingData has incorrect creatorThoughtId");
		assert.equal(settingData[3], associatedThoughtId, "SettingData has incorrect associatedThoughtId");
		assert.equal(settingData[4], settingName, "SettingData has incorrect settingName");
		assert.equal(settingData[5].toNumber(), settingType, "SettingData has incorrect settingType");
		assert.equal(settingData[6], true, "SettingData has incorrect pendingCreate");
		assert.equal(settingData[7], true, "SettingData has incorrect locked");
		assert.equal(settingData[8], false, "SettingData has incorrect rejected");
		assert.equal(settingData[9], extraData, "SettingData has incorrect extraData");

		var settingState = await aosettingattribute.getSettingState(settingId1);
		assert.equal(settingState[0].toNumber(), settingId1, "SettingState has incorrect settingId1");
		assert.equal(settingState[1], false, "SettingState has incorrect pendingUpdate");
		assert.equal(settingState[2], emptyAddress, "SettingState has incorrect updateAdvocateNameId");
		assert.equal(settingState[3], emptyAddress, "SettingState has incorrect proposalThoughtId");
		assert.equal(settingState[4], "", "SettingState has incorrect updateSignature");
		assert.equal(settingState[5], emptyAddress, "SettingState has incorrect lastUpdateThoughtId");
		assert.equal(settingState[6], "", "SettingState has incorrect settingStateJSON");

		// Add another setting
		var result = await aosettingattribute.add(
			settingId2,
			creatorThoughtNameId,
			settingType,
			settingName,
			creatorThoughtId,
			associatedThoughtId,
			extraData,
			{ from: whitelistedAccount }
		);
	});

	it("non-approved setting creation can not be finalized", async function() {
		var canFinalize;
		try {
			await aosettingattribute.finalizeAdd(settingId1, creatorThoughtNameId, { from: whitelistedAccount });
			canFinalize = true;
		} catch (e) {
			canFinalize = false;
		}
		assert.equal(canFinalize, false, "Non-approved setting creation can be finalized");
	});

	it("only whitelisted account and setting's Associated Thought's advocate can approve setting creation", async function() {
		var canApprove;
		try {
			await aosettingattribute.approveAdd(settingId1, associatedThoughtNameId, true, { from: account1 });
			canApprove = true;
		} catch (e) {
			canApprove = false;
		}
		assert.equal(canApprove, false, "Non-whitelisted account can approve setting creation");

		try {
			await aosettingattribute.approveAdd(settingId1, proposalThoughtNameId, true, { from: whitelistedAccount });
			canApprove = true;
		} catch (e) {
			canApprove = false;
		}
		assert.equal(canApprove, false, "Non-setting's Associated Thought's Advocate can approve setting creation");

		// approve this setting
		try {
			await aosettingattribute.approveAdd(settingId1, associatedThoughtNameId, true, { from: whitelistedAccount });
			canApprove = true;
		} catch (e) {
			canApprove = false;
		}
		assert.equal(canApprove, true, "Setting's Associated Thought's Advocate can't approve setting creation");

		var settingData = await aosettingattribute.getSettingData(settingId1);
		assert.equal(settingData[7], false, "SettingData has incorrect locked");

		// reject this setting
		try {
			await aosettingattribute.approveAdd(settingId2, associatedThoughtNameId, false, { from: whitelistedAccount });
			canApprove = true;
		} catch (e) {
			canApprove = false;
		}
		assert.equal(canApprove, true, "Setting's Associated Thought's Advocate can't approve setting creation");

		settingData = await aosettingattribute.getSettingData(settingId2);
		assert.equal(settingData[6], false, "SettingData has incorrect pendingCreate");
		assert.equal(settingData[8], true, "SettingData has incorrect rejected");
	});

	it("only whitelisted account and setting's Creator Thought's Advocate can finalize setting creation", async function() {
		var canFinalize;
		try {
			await aosettingattribute.finalizeAdd(settingId1, creatorThoughtNameId, { from: account1 });
			canFinalize = true;
		} catch (e) {
			canFinalize = false;
		}
		assert.equal(canFinalize, false, "Non-whitelisted account can finalize setting creation");

		try {
			await aosettingattribute.finalizeAdd(settingId1, proposalThoughtNameId, { from: whitelistedAccount });
			canFinalize = true;
		} catch (e) {
			canFinalize = false;
		}
		assert.equal(canFinalize, false, "Non-setting's Creator Thought's Advocate can finalize setting creation");

		try {
			await aosettingattribute.finalizeAdd(settingId1, creatorThoughtNameId, { from: whitelistedAccount });
			canFinalize = true;
		} catch (e) {
			canFinalize = false;
		}
		assert.equal(canFinalize, true, "Setting's Creator Thought's Advocate can't finalize setting creation");

		var settingData = await aosettingattribute.getSettingData(settingId1);
		assert.equal(settingData[6], false, "SettingData has incorrect pendingCreate");
		assert.equal(settingData[7], true, "SettingData has incorrect locked");

		try {
			await aosettingattribute.finalizeAdd(settingId2, creatorThoughtNameId, { from: whitelistedAccount });
			canFinalize = true;
		} catch (e) {
			canFinalize = false;
		}
		assert.equal(canFinalize, false, "Setting's Creator Thought's Advocate can finalize rejected setting creation");
	});

	it("only whitelisted account can update setting", async function() {
		var canUpdate;
		try {
			await aosettingattribute.update(settingId1, associatedThoughtNameId, proposalThoughtId, updateSignature, extraData, {from: account1});
			canUpdate = true;
		} catch (e) {
			canUpdate = false;
		}
		assert.equal(canUpdate, false, "Non-whitelisted account can update setting");

		try {
			await aosettingattribute.update(settingId1, associatedThoughtNameId, proposalThoughtId, updateSignature, extraData, {from: whitelistedAccount});
			canUpdate = true;
		} catch (e) {
			canUpdate = false;
		}
		assert.equal(canUpdate, true, "Whitelisted account can't update setting");

		var settingState = await aosettingattribute.getSettingState(settingId1);
		assert.equal(settingState[1], true, "SettingState has incorrect pendingUpdate");
		assert.equal(settingState[2], associatedThoughtNameId, "SettingState has incorrect updateAdvocateNameId");
		assert.equal(settingState[3], proposalThoughtId, "SettingState has incorrect proposalThoughtId");
		assert.equal(settingState[4], updateSignature, "SettingState has incorrect updateSignature");
		assert.equal(settingState[6], extraData, "SettingState has incorrect settingStateJSON");

		try {
			await aosettingattribute.update(settingId1, associatedThoughtNameId, proposalThoughtId, updateSignature, extraData, {from: whitelistedAccount});
			canUpdate = true;
		} catch (e) {
			canUpdate = false;
		}
		assert.equal(canUpdate, false, "Whitelisted account can update setting that is pending update");

		try {
			await aosettingattribute.update(settingId2, associatedThoughtNameId, proposalThoughtId, updateSignature, extraData, {from: whitelistedAccount});
			canUpdate = true;
		} catch (e) {
			canUpdate = false;
		}
		assert.equal(canUpdate, false, "Whitelisted account can update setting that is already rejected");
	});

	it("non-approved setting update can not be finalized", async function() {
		var canFinalize;
		try {
			await aosettingattribute.finalizeUpdate(settingId1, associatedThoughtNameId, { from: whitelistedAccount });
			canFinalize = true;
		} catch (e) {
			canFinalize = false;
		}
		assert.equal(canFinalize, false, "Non-approved setting update can be finalized");
	});

	it("only whitelisted account and setting's Proposal Thought's advocate can approve setting update", async function() {
		var canApprove;
		try {
			await aosettingattribute.approveUpdate(settingId1, proposalThoughtNameId, true, { from: account1 });
			canApprove = true;
		} catch (e) {
			canApprove = false;
		}
		assert.equal(canApprove, false, "Non-whitelisted account can approve setting update");

		try {
			await aosettingattribute.approveUpdate(settingId1, associatedThoughtNameId, true, { from: whitelistedAccount });
			canApprove = true;
		} catch (e) {
			canApprove = false;
		}
		assert.equal(canApprove, false, "Non-setting's Proposal Thought's Advocate can approve setting update");

		// approve this setting
		try {
			await aosettingattribute.approveUpdate(settingId1, proposalThoughtNameId, true, { from: whitelistedAccount });
			canApprove = true;
		} catch (e) {
			canApprove = false;
		}
		assert.equal(canApprove, true, "Setting's Proposal Thought's Advocate can't approve setting update");

		var settingData = await aosettingattribute.getSettingData(settingId1);
		assert.equal(settingData[7], false, "SettingData has incorrect locked");
	});

	it("only whitelisted account and setting's Associated Thought's Advocate can finalize setting update", async function() {
		var canFinalize;
		try {
			await aosettingattribute.finalizeApprove(settingId1, associatedThoughtNameId, { from: account1 });
			canFinalize = true;
		} catch (e) {
			canFinalize = false;
		}
		assert.equal(canFinalize, false, "Non-whitelisted account can finalize setting update");

		try {
			await aosettingattribute.finalizeUpdate(settingId1, proposalThoughtNameId, { from: whitelistedAccount });
			canFinalize = true;
		} catch (e) {
			canFinalize = false;
		}
		assert.equal(canFinalize, false, "Non-setting's Associated Thought's Advocate can finalize setting update");

		try {
			await aosettingattribute.finalizeUpdate(settingId1, associatedThoughtNameId, { from: whitelistedAccount });
			canFinalize = true;
		} catch (e) {
			canFinalize = false;
		}
		assert.equal(canFinalize, true, "Setting's Associated Thought's Advocate can't finalize setting update");

		var settingData = await aosettingattribute.getSettingData(settingId1);
		assert.equal(settingData[7], true, "SettingData has incorrect locked");

		var settingState = await aosettingattribute.getSettingState(settingId1);
		assert.equal(settingState[1], false, "SettingState has incorrect pendingUpdate");
		assert.equal(settingState[2], associatedThoughtNameId, "SettingState has incorrect updateAdvocateNameId");
		assert.equal(settingState[3], emptyAddress, "SettingState has incorrect proposalThoughtId");
		assert.equal(settingState[5], proposalThoughtId, "SettingState has incorrect lastUpdateThoughtId");
	});

	it("rejected setting update can not be finalized", async function() {
		// Update setting again
		try {
			await aosettingattribute.update(settingId1, associatedThoughtNameId, proposalThoughtId, updateSignature, extraData, {from: whitelistedAccount});
			canUpdate = true;
		} catch (e) {
			canUpdate = false;
		}
		assert.equal(canUpdate, true, "Whitelisted account can't update setting");

		var settingState = await aosettingattribute.getSettingState(settingId1);
		assert.equal(settingState[1], true, "SettingState has incorrect pendingUpdate");
		assert.equal(settingState[2], associatedThoughtNameId, "SettingState has incorrect updateAdvocateNameId");
		assert.equal(settingState[3], proposalThoughtId, "SettingState has incorrect proposalThoughtId");
		assert.equal(settingState[4], updateSignature, "SettingState has incorrect updateSignature");
		assert.equal(settingState[6], extraData, "SettingState has incorrect settingStateJSON");

		// Reject the setting update
		try {
			await aosettingattribute.approveUpdate(settingId1, proposalThoughtNameId, false, { from: whitelistedAccount });
			canApprove = true;
		} catch (e) {
			canApprove = false;
		}
		assert.equal(canApprove, true, "Setting's Proposal Thought's Advocate can't approve setting update");

		var settingState = await aosettingattribute.getSettingState(settingId1);
		assert.equal(settingState[1], false, "SettingState has incorrect pendingUpdate");
		assert.equal(settingState[3], emptyAddress, "SettingState has incorrect proposalThoughtId");

		try {
			await aosettingattribute.finalizeUpdate(settingId1, associatedThoughtNameId, { from: whitelistedAccount });
			canFinalize = true;
		} catch (e) {
			canFinalize = false;
		}
		assert.equal(canFinalize, false, "Setting's Associated Thought's Advocate can finalize rejected setting update");
	});

	it("only whitelisted account can add setting deprecation", async function() {
		var canAdd;
		try {
			var result = await aosettingattribute.addDeprecation(
				settingId1,
				creatorThoughtNameId,
				creatorThoughtId,
				associatedThoughtId,
				newSettingId,
				newSettingContractAddress,
				{ from: account1 }
			);
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.equal(canAdd, false, "Non-whitelisted account can add setting deprecation");

		try {
			var result = await aosettingattribute.addDeprecation(
				99,
				creatorThoughtNameId,
				creatorThoughtId,
				associatedThoughtId,
				newSettingId,
				newSettingContractAddress,
				{ from: whitelistedAccount }
			);
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.equal(canAdd, false, "Whitelisted account can add setting deprecation for non-existing setting");

		try {
			var result = await aosettingattribute.addDeprecation(
				settingId1,
				creatorThoughtNameId,
				creatorThoughtId,
				associatedThoughtId,
				99,
				newSettingContractAddress,
				{ from: whitelistedAccount }
			);
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.equal(canAdd, false, "Whitelisted account can deprecate existing setting to a non-existing setting");

		// Add new setting
		try {
			var result = await aosettingattribute.add(
				newSettingId,
				creatorThoughtNameId,
				settingType,
				settingName,
				creatorThoughtId,
				associatedThoughtId,
				extraData,
				{ from: whitelistedAccount }
			);
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.equal(canAdd, true, "Whitelisted account can't add setting attribute");

		try {
			var result = await aosettingattribute.addDeprecation(
				settingId1,
				creatorThoughtNameId,
				creatorThoughtId,
				associatedThoughtId,
				newSettingId,
				newSettingContractAddress,
				{ from: whitelistedAccount }
			);
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.equal(canAdd, false, "Whitelisted account can route setting to a new non-approved setting");

		try {
			await aosettingattribute.approveAdd(newSettingId, associatedThoughtNameId, true, { from: whitelistedAccount });
			canApprove = true;
		} catch (e) {
			canApprove = false;
		}
		assert.equal(canApprove, true, "Setting's Associated Thought's Advocate can't approve setting creation");

		try {
			await aosettingattribute.finalizeAdd(newSettingId, creatorThoughtNameId, { from: whitelistedAccount });
			canFinalize = true;
		} catch (e) {
			canFinalize = false;
		}
		assert.equal(canFinalize, true, "Setting's Creator Thought's Advocate can't finalize setting creation");

		try {
			var result = await aosettingattribute.addDeprecation(
				settingId1,
				creatorThoughtNameId,
				creatorThoughtId,
				associatedThoughtId,
				newSettingId,
				newSettingContractAddress,
				{ from: whitelistedAccount }
			);
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.equal(canAdd, true, "Whitelisted account can't add setting deprecation");

		var settingDeprecation = await aosettingattribute.getSettingDeprecation(settingId1);
		assert.equal(settingDeprecation[0].toNumber(), settingId1, "SettingDeprecation has incorrect settingId");
		assert.equal(settingDeprecation[1], creatorThoughtNameId, "SettingDeprecation has incorrect creatorNameId");
		assert.equal(settingDeprecation[2], creatorThoughtId, "SettingDeprecation has incorrect creatorThoughtId");
		assert.equal(settingDeprecation[3], associatedThoughtId, "SettingDeprecation has incorrect associatedThoughtId");
		assert.equal(settingDeprecation[4], true, "SettingDeprecation has incorrect pendingDeprecated");
		assert.equal(settingDeprecation[5], true, "SettingDeprecation has incorrect locked");
		assert.equal(settingDeprecation[6], false, "SettingDeprecation has incorrect rejected");
		assert.equal(settingDeprecation[7], false, "SettingDeprecation has incorrect migrated");
		assert.equal(settingDeprecation[8].toNumber(), newSettingId, "SettingDeprecation has incorrect pendingNewSettingId");
		assert.equal(settingDeprecation[9].toNumber(), 0, "SettingDeprecation has incorrect newSettingId");
		assert.equal(settingDeprecation[10], newSettingContractAddress, "SettingDeprecation has incorrect pendingNewSettingContractAddress");
		assert.equal(settingDeprecation[11], emptyAddress, "SettingDeprecation has incorrect newSettingContractAddress");
	});

	it("non-approved setting deprecation can not be finalized", async function() {
		var canFinalize;
		try {
			await aosettingattribute.finalizeDeprecation(settingId1, creatorThoughtNameId, { from: whitelistedAccount });
			canFinalize = true;
		} catch (e) {
			canFinalize = false;
		}
		assert.equal(canFinalize, false, "Non-approved setting deprecation can be finalized");
	});

	it("only whitelisted account and setting's Associated Thought's advocate can approve setting deprecation", async function() {
		var canApprove;
		try {
			await aosettingattribute.approveDeprecation(settingId1, associatedThoughtNameId, true, { from: account1 });
			canApprove = true;
		} catch (e) {
			canApprove = false;
		}
		assert.equal(canApprove, false, "Non-whitelisted account can approve setting deprecation");

		try {
			await aosettingattribute.approveDeprecation(settingId1, proposalThoughtNameId, true, { from: whitelistedAccount });
			canApprove = true;
		} catch (e) {
			canApprove = false;
		}
		assert.equal(canApprove, false, "Non-setting's Associated Thought's Advocate can approve setting deprecation");

		// approve this setting deprecation
		try {
			await aosettingattribute.approveDeprecation(settingId1, associatedThoughtNameId, true, { from: whitelistedAccount });
			canApprove = true;
		} catch (e) {
			canApprove = false;
		}
		assert.equal(canApprove, true, "Setting's Associated Thought's Advocate can't approve setting deprecation");

		var settingDeprecation = await aosettingattribute.getSettingDeprecation(settingId1);
		assert.equal(settingDeprecation[5], false, "SettingDeprecation has incorrect locked");
	});

	it("only whitelisted account and setting's Creator Thought's Advocate can finalize setting deprecation", async function() {
		var canFinalize;
		try {
			await aosettingattribute.finalizeDeprecation(settingId1, creatorThoughtNameId, { from: account1 });
			canFinalize = true;
		} catch (e) {
			canFinalize = false;
		}
		assert.equal(canFinalize, false, "Non-whitelisted account can finalize setting deprecation");

		try {
			await aosettingattribute.finalizeDeprecation(settingId1, proposalThoughtNameId, { from: whitelistedAccount });
			canFinalize = true;
		} catch (e) {
			canFinalize = false;
		}
		assert.equal(canFinalize, false, "Non-setting's Creator Thought's Advocate can finalize setting deprecation");

		try {
			await aosettingattribute.finalizeDeprecation(settingId1, creatorThoughtNameId, { from: whitelistedAccount });
			canFinalize = true;
		} catch (e) {
			canFinalize = false;
		}
		assert.equal(canFinalize, true, "Setting's Creator Thought's Advocate can't finalize setting deprecation");

		var settingDeprecation = await aosettingattribute.getSettingDeprecation(settingId1);
		assert.equal(settingDeprecation[4], false, "SettingDeprecation has incorrect pendingDeprecated");
		assert.equal(settingDeprecation[5], true, "SettingDeprecation has incorrect locked");
		assert.equal(settingDeprecation[6], false, "SettingDeprecation has incorrect rejected");
		assert.equal(settingDeprecation[7], true, "SettingDeprecation has incorrect migrated");
		assert.equal(settingDeprecation[8].toNumber(), 0, "SettingDeprecation has incorrect pendingNewSettingId");
		assert.equal(settingDeprecation[9].toNumber(), newSettingId, "SettingDeprecation has incorrect newSettingId");
		assert.equal(settingDeprecation[10], emptyAddress, "SettingDeprecation has incorrect pendingNewSettingContractAddress");
		assert.equal(settingDeprecation[11], newSettingContractAddress, "SettingDeprecation has incorrect newSettingContractAddress");
	});

	it("rejected deprecation can not be finalized", async function() {
		// Add new setting
		try {
			var result = await aosettingattribute.add(
				settingId3,
				creatorThoughtNameId,
				settingType,
				settingName,
				creatorThoughtId,
				associatedThoughtId,
				extraData,
				{ from: whitelistedAccount }
			);
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.equal(canAdd, true, "Whitelisted account can't add setting attribute");

		try {
			await aosettingattribute.approveAdd(settingId3, associatedThoughtNameId, true, { from: whitelistedAccount });
			canApprove = true;
		} catch (e) {
			canApprove = false;
		}
		assert.equal(canApprove, true, "Setting's Associated Thought's Advocate can't approve setting creation");

		try {
			await aosettingattribute.finalizeAdd(settingId3, creatorThoughtNameId, { from: whitelistedAccount });
			canFinalize = true;
		} catch (e) {
			canFinalize = false;
		}
		assert.equal(canFinalize, true, "Setting's Creator Thought's Advocate can't finalize setting creation");

		try {
			var result = await aosettingattribute.addDeprecation(
				settingId3,
				creatorThoughtNameId,
				creatorThoughtId,
				associatedThoughtId,
				newSettingId,
				newSettingContractAddress,
				{ from: whitelistedAccount }
			);
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.equal(canAdd, true, "Whitelisted account can't add setting deprecation");

		// reject the deprecation
		try {
			await aosettingattribute.approveDeprecation(settingId3, associatedThoughtNameId, false, { from: whitelistedAccount });
			canApprove = true;
		} catch (e) {
			canApprove = false;
		}
		assert.equal(canApprove, true, "Setting's Associated Thought's Advocate can't approve setting deprecation");

		var settingDeprecation = await aosettingattribute.getSettingDeprecation(settingId3);
		assert.equal(settingDeprecation[4], false, "SettingDeprecation has incorrect pendingDeprecated");
		assert.equal(settingDeprecation[6], true, "SettingDeprecation has incorrect rejected");

		try {
			await aosettingattribute.finalizeDeprecation(settingId3, creatorThoughtNameId, { from: whitelistedAccount });
			canFinalize = true;
		} catch (e) {
			canFinalize = false;
		}
		assert.equal(canFinalize, false, "Setting's Creator Thought's Advocate can finalize rejected setting deprecation");
	});

	it("deprecated setting can't be updated", async function() {
		var canUpdate
		try {
			await aosettingattribute.update(settingId1, associatedThoughtNameId, proposalThoughtId, updateSignature, extraData, {from: whitelistedAccount});
			canUpdate = true;
		} catch (e) {
			canUpdate = false;
		}
		assert.equal(canUpdate, false, "Deprecated setting can be updated");
	});
});
