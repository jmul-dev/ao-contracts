var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var Logos = artifacts.require("./Logos.sol");

var AOSetting = artifacts.require("./AOSetting.sol");
var AOSettingUpdate = artifacts.require("./AOSettingUpdate.sol");
var AOSettingDeprecation = artifacts.require("./AOSettingDeprecation.sol");
var AOSettingAttribute = artifacts.require("./AOSettingAttribute.sol");
var AOSettingValue = artifacts.require("./AOSettingValue.sol");

var NameAccountRecovery = artifacts.require("./NameAccountRecovery.sol");

var EthCrypto = require("eth-crypto");
var helper = require("./helpers/truffleTestHelper");
var BN = require("bn.js");

contract("AOSetting / AOSettingUpdate / AOSettingDeprecation", function(accounts) {
	var namefactory,
		taofactory,
		nametaoposition,
		logos,
		aosetting,
		aosettingupdate,
		aosettingdeprecation,
		aosettingattribute,
		aosettingvalue,
		nameaccountrecovery,
		accountRecoveryLockDuration;
	var theAO = accounts[0];

	var whitelistedAddress = accounts[9];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var account4 = accounts[4];

	// Retrieve private key from ganache
	var account1PrivateKey = "0xfa372b56eac0e71de587267f0a59989719b2325aeb4579912379641cf93ccaab";
	var account2PrivateKey = "0x6a35c58d0acad0ceca9c03d37aa2d2288d70afe0690f5e5f5e05aeab93b95dad";
	var account3PrivateKey = "0xf4bab2d2f0c5119cc6aad0735bbf0a017d229cbf430c0041af382b93e713a1c3";
	var account4PrivateKey = "0xfc164bb116857e2b7e5bafb6f515c61cc2cddae22a052c3988c8ff5de598ede0";

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

	var creatorTAONameId, creatorTAOId, associatedTAONameId, associatedTAOId, proposalTAONameId, proposalTAOId, nameId, taoId, nameId4;
	var extraData = JSON.stringify({ extraVariable: "someValue" });
	var emptyAddress = "0x0000000000000000000000000000000000000000";
	var updateSignature = "somesignature";
	var newSettingId = 4;
	var newSettingContractAddress = accounts[4];

	var nonTAOId = accounts[9];
	var uintValue = 10;
	var boolValue = true;
	var addressValue = accounts[8];
	var bytesValue = web3.utils.toHex("somebytesvalue");
	var nullBytesValue = "0x0000000000000000000000000000000000000000000000000000000000000000";
	var stringValue = "somestringvalue";

	var updateSignature = "somesignature";
	var newSettingContractAddress = accounts[7];

	var nameId1LocalWriterKey = EthCrypto.createIdentity();
	var nameId2LocalWriterKey = EthCrypto.createIdentity();
	var nameId3LocalWriterKey = EthCrypto.createIdentity();
	var nameId4LocalWriterKey = EthCrypto.createIdentity();

	var createSignature = function(_privateKey, _settingId, _proposalTAOId, _associatedTAONameId, _newValue, _type) {
		var signHash = EthCrypto.hash.keccak256([
			{
				type: "address",
				value: aosettingupdate.address
			},
			{
				type: "uint256",
				value: _settingId
			},
			{
				type: "address",
				value: _proposalTAOId
			},
			{
				type: _type,
				value: _newValue
			},
			{
				type: "address",
				value: _associatedTAONameId
			}
		]);

		var signature = EthCrypto.sign(_privateKey, signHash);
		return signature;
	};

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		logos = await Logos.deployed();

		aosetting = await AOSetting.deployed();
		aosettingupdate = await AOSettingUpdate.deployed();
		aosettingdeprecation = await AOSettingDeprecation.deployed();
		aosettingattribute = await AOSettingAttribute.deployed();
		aosettingvalue = await AOSettingValue.deployed();

		nameaccountrecovery = await NameAccountRecovery.deployed();

		var settingTAOId = await nameaccountrecovery.settingTAOId();

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "accountRecoveryLockDuration");
		accountRecoveryLockDuration = settingValues[0];
	});

	contract("AOSetting - The AO Only", function() {
		before(async function() {
			// Create Name
			var result = await namefactory.createName(
				"charlie",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				web3.utils.toHex("somecontentid"),
				nameId1LocalWriterKey.address,
				{
					from: account1
				}
			);
			nameId = await namefactory.ethAddressToNameId(account1);

			// Mint Logos to nameId
			await logos.setWhitelist(theAO, true, { from: theAO });
			await logos.mint(nameId, 10 ** 12, { from: theAO });

			result = await taofactory.createTAO(
				"Charlie's TAO",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				web3.utils.toHex("somecontentid"),
				nameId,
				0,
				false,
				0,
				{
					from: account1
				}
			);
			var createTAOEvent = result.logs[0];
			taoId = createTAOEvent.args.taoId;
		});

		it("The AO - transferOwnership() - should be able to transfer ownership to a TAO", async function() {
			var canTransferOwnership;
			try {
				await aosetting.transferOwnership(taoId, { from: someAddress });
				canTransferOwnership = true;
			} catch (e) {
				canTransferOwnership = false;
			}
			assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

			try {
				await aosetting.transferOwnership(taoId, { from: theAO });
				canTransferOwnership = true;
			} catch (e) {
				canTransferOwnership = false;
			}
			assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

			var newTheAO = await aosetting.theAO();
			assert.equal(newTheAO, taoId, "Contract has incorrect TheAO address after transferring ownership");
		});

		it("The AO - setWhitelist() should be able to whitelist an address", async function() {
			var canSetWhitelist;
			try {
				await aosetting.setWhitelist(whitelistedAddress, true, { from: someAddress });
				canSetWhitelist = true;
			} catch (e) {
				canSetWhitelist = false;
			}
			assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

			try {
				await aosetting.setWhitelist(whitelistedAddress, true, { from: account1 });
				canSetWhitelist = true;
			} catch (e) {
				canSetWhitelist = false;
			}
			assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

			var whitelistStatus = await aosetting.whitelist(whitelistedAddress);
			assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
		});

		it("The AO - setNameFactoryAddress() should be able to set NameFactory address", async function() {
			var canSetAddress;
			try {
				await aosetting.setNameFactoryAddress(namefactory.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set NameFactory address");

			try {
				await aosetting.setNameFactoryAddress(namefactory.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set NameFactory address");

			var nameFactoryAddress = await aosetting.nameFactoryAddress();
			assert.equal(nameFactoryAddress, namefactory.address, "Contract has incorrect nameFactoryAddress");
		});

		it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
			var canSetAddress;
			try {
				await aosetting.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

			try {
				await aosetting.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

			var nameTAOPositionAddress = await aosetting.nameTAOPositionAddress();
			assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
		});

		it("The AO - setNameAccountRecoveryAddress() should be able to set NameAccountRecovery address", async function() {
			var canSetAddress;
			try {
				await aosetting.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set NameAccountRecovery address");

			try {
				await aosetting.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set NameAccountRecovery address");

			var nameAccountRecoveryAddress = await aosetting.nameAccountRecoveryAddress();
			assert.equal(nameAccountRecoveryAddress, nameaccountrecovery.address, "Contract has incorrect nameAccountRecoveryAddress");
		});

		it("The AO - setAOSettingAttributeAddress() should be able to set AOSettingAttribute address", async function() {
			var canSetAddress;
			try {
				await aosetting.setAOSettingAttributeAddress(aosettingattribute.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set AOSettingAttribute address");

			try {
				await aosetting.setAOSettingAttributeAddress(aosettingattribute.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set AOSettingAttribute address");

			var aoSettingAttributeAddress = await aosetting.aoSettingAttributeAddress();
			assert.equal(aoSettingAttributeAddress, aosettingattribute.address, "Contract has incorrect aosettingattributeAddress");
		});

		it("The AO - setAOSettingValueAddress() should be able to set AOSettingValue address", async function() {
			var canSetAddress;
			try {
				await aosetting.setAOSettingValueAddress(aosettingvalue.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set AOSettingValue address");

			try {
				await aosetting.setAOSettingValueAddress(aosettingvalue.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set AOSettingValue address");

			var aoSettingValueAddress = await aosetting.aoSettingValueAddress();
			assert.equal(aoSettingValueAddress, aosettingvalue.address, "Contract has incorrect aoSettingValueAddress");
		});
	});

	contract("AOSettingUpdate - The AO Only", function() {
		before(async function() {
			// Create Name
			var result = await namefactory.createName(
				"charlie",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				web3.utils.toHex("somecontentid"),
				nameId1LocalWriterKey.address,
				{
					from: account1
				}
			);
			nameId = await namefactory.ethAddressToNameId(account1);

			// Mint Logos to nameId
			await logos.setWhitelist(theAO, true, { from: theAO });
			await logos.mint(nameId, 10 ** 12, { from: theAO });

			result = await taofactory.createTAO(
				"Charlie's TAO",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				web3.utils.toHex("somecontentid"),
				nameId,
				0,
				false,
				0,
				{
					from: account1
				}
			);
			var createTAOEvent = result.logs[0];
			taoId = createTAOEvent.args.taoId;
		});

		it("The AO - transferOwnership() - should be able to transfer ownership to a TAO", async function() {
			var canTransferOwnership;
			try {
				await aosettingupdate.transferOwnership(taoId, { from: someAddress });
				canTransferOwnership = true;
			} catch (e) {
				canTransferOwnership = false;
			}
			assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

			try {
				await aosettingupdate.transferOwnership(taoId, { from: theAO });
				canTransferOwnership = true;
			} catch (e) {
				canTransferOwnership = false;
			}
			assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

			var newTheAO = await aosettingupdate.theAO();
			assert.equal(newTheAO, taoId, "Contract has incorrect TheAO address after transferring ownership");
		});

		it("The AO - setWhitelist() should be able to whitelist an address", async function() {
			var canSetWhitelist;
			try {
				await aosettingupdate.setWhitelist(whitelistedAddress, true, { from: someAddress });
				canSetWhitelist = true;
			} catch (e) {
				canSetWhitelist = false;
			}
			assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

			try {
				await aosettingupdate.setWhitelist(whitelistedAddress, true, { from: account1 });
				canSetWhitelist = true;
			} catch (e) {
				canSetWhitelist = false;
			}
			assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

			var whitelistStatus = await aosettingupdate.whitelist(whitelistedAddress);
			assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
		});

		it("The AO - setNameFactoryAddress() should be able to set NameFactory address", async function() {
			var canSetAddress;
			try {
				await aosettingupdate.setNameFactoryAddress(namefactory.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set NameFactory address");

			try {
				await aosettingupdate.setNameFactoryAddress(namefactory.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set NameFactory address");

			var nameFactoryAddress = await aosettingupdate.nameFactoryAddress();
			assert.equal(nameFactoryAddress, namefactory.address, "Contract has incorrect nameFactoryAddress");
		});

		it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
			var canSetAddress;
			try {
				await aosettingupdate.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

			try {
				await aosettingupdate.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

			var nameTAOPositionAddress = await aosettingupdate.nameTAOPositionAddress();
			assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
		});

		it("The AO - setNameAccountRecoveryAddress() should be able to set NameAccountRecovery address", async function() {
			var canSetAddress;
			try {
				await aosettingupdate.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set NameAccountRecovery address");

			try {
				await aosettingupdate.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set NameAccountRecovery address");

			var nameAccountRecoveryAddress = await aosettingupdate.nameAccountRecoveryAddress();
			assert.equal(nameAccountRecoveryAddress, nameaccountrecovery.address, "Contract has incorrect nameAccountRecoveryAddress");
		});

		it("The AO - setAOSettingAttributeAddress() should be able to set AOSettingAttribute address", async function() {
			var canSetAddress;
			try {
				await aosettingupdate.setAOSettingAttributeAddress(aosettingattribute.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set AOSettingAttribute address");

			try {
				await aosettingupdate.setAOSettingAttributeAddress(aosettingattribute.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set AOSettingAttribute address");

			var aoSettingAttributeAddress = await aosettingupdate.aoSettingAttributeAddress();
			assert.equal(aoSettingAttributeAddress, aosettingattribute.address, "Contract has incorrect aosettingattributeAddress");
		});

		it("The AO - setAOSettingValueAddress() should be able to set AOSettingValue address", async function() {
			var canSetAddress;
			try {
				await aosettingupdate.setAOSettingValueAddress(aosettingvalue.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set AOSettingValue address");

			try {
				await aosettingupdate.setAOSettingValueAddress(aosettingvalue.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set AOSettingValue address");

			var aoSettingValueAddress = await aosettingupdate.aoSettingValueAddress();
			assert.equal(aoSettingValueAddress, aosettingvalue.address, "Contract has incorrect aoSettingValueAddress");
		});

		it("The AO - setAOSettingAddress() should be able to set AOSetting address", async function() {
			var canSetAddress;
			try {
				await aosettingupdate.setAOSettingAddress(aosetting.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set AOSetting address");

			try {
				await aosettingupdate.setAOSettingAddress(aosetting.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set AOSetting address");

			var aoSettingAddress = await aosettingupdate.aoSettingAddress();
			assert.equal(aoSettingAddress, aosetting.address, "Contract has incorrect aoSettingAddress");
		});
	});

	contract("AOSettingDeprecation - The AO Only", function() {
		before(async function() {
			// Create Name
			var result = await namefactory.createName(
				"charlie",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				web3.utils.toHex("somecontentid"),
				nameId1LocalWriterKey.address,
				{
					from: account1
				}
			);
			nameId = await namefactory.ethAddressToNameId(account1);

			// Mint Logos to nameId
			await logos.setWhitelist(theAO, true, { from: theAO });
			await logos.mint(nameId, 10 ** 12, { from: theAO });

			result = await taofactory.createTAO(
				"Charlie's TAO",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				web3.utils.toHex("somecontentid"),
				nameId,
				0,
				false,
				0,
				{
					from: account1
				}
			);
			var createTAOEvent = result.logs[0];
			taoId = createTAOEvent.args.taoId;
		});

		it("The AO - transferOwnership() - should be able to transfer ownership to a TAO", async function() {
			var canTransferOwnership;
			try {
				await aosettingdeprecation.transferOwnership(taoId, { from: someAddress });
				canTransferOwnership = true;
			} catch (e) {
				canTransferOwnership = false;
			}
			assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

			try {
				await aosettingdeprecation.transferOwnership(taoId, { from: theAO });
				canTransferOwnership = true;
			} catch (e) {
				canTransferOwnership = false;
			}
			assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

			var newTheAO = await aosettingdeprecation.theAO();
			assert.equal(newTheAO, taoId, "Contract has incorrect TheAO address after transferring ownership");
		});

		it("The AO - setWhitelist() should be able to whitelist an address", async function() {
			var canSetWhitelist;
			try {
				await aosettingdeprecation.setWhitelist(whitelistedAddress, true, { from: someAddress });
				canSetWhitelist = true;
			} catch (e) {
				canSetWhitelist = false;
			}
			assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

			try {
				await aosettingdeprecation.setWhitelist(whitelistedAddress, true, { from: account1 });
				canSetWhitelist = true;
			} catch (e) {
				canSetWhitelist = false;
			}
			assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

			var whitelistStatus = await aosettingdeprecation.whitelist(whitelistedAddress);
			assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
		});

		it("The AO - setNameFactoryAddress() should be able to set NameFactory address", async function() {
			var canSetAddress;
			try {
				await aosettingdeprecation.setNameFactoryAddress(namefactory.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set NameFactory address");

			try {
				await aosettingdeprecation.setNameFactoryAddress(namefactory.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set NameFactory address");

			var nameFactoryAddress = await aosettingdeprecation.nameFactoryAddress();
			assert.equal(nameFactoryAddress, namefactory.address, "Contract has incorrect nameFactoryAddress");
		});

		it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
			var canSetAddress;
			try {
				await aosettingdeprecation.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

			try {
				await aosettingdeprecation.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

			var nameTAOPositionAddress = await aosettingdeprecation.nameTAOPositionAddress();
			assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
		});

		it("The AO - setNameAccountRecoveryAddress() should be able to set NameAccountRecovery address", async function() {
			var canSetAddress;
			try {
				await aosettingdeprecation.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set NameAccountRecovery address");

			try {
				await aosettingdeprecation.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set NameAccountRecovery address");

			var nameAccountRecoveryAddress = await aosettingdeprecation.nameAccountRecoveryAddress();
			assert.equal(nameAccountRecoveryAddress, nameaccountrecovery.address, "Contract has incorrect nameAccountRecoveryAddress");
		});

		it("The AO - setAOSettingAttributeAddress() should be able to set AOSettingAttribute address", async function() {
			var canSetAddress;
			try {
				await aosettingdeprecation.setAOSettingAttributeAddress(aosettingattribute.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set AOSettingAttribute address");

			try {
				await aosettingdeprecation.setAOSettingAttributeAddress(aosettingattribute.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set AOSettingAttribute address");

			var aoSettingAttributeAddress = await aosettingdeprecation.aoSettingAttributeAddress();
			assert.equal(aoSettingAttributeAddress, aosettingattribute.address, "Contract has incorrect aosettingattributeAddress");
		});

		it("The AO - setAOSettingAddress() should be able to set AOSetting address", async function() {
			var canSetAddress;
			try {
				await aosettingdeprecation.setAOSettingAddress(aosetting.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set AOSetting address");

			try {
				await aosettingdeprecation.setAOSettingAddress(aosetting.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set AOSetting address");

			var aoSettingAddress = await aosettingdeprecation.aoSettingAddress();
			assert.equal(aoSettingAddress, aosetting.address, "Contract has incorrect aoSettingAddress");
		});
	});

	contract("Add/Update/Deprecate Setting Functionality", function() {
		before(async function() {
			await logos.setWhitelist(theAO, true, { from: theAO });

			// Create Names
			var result = await namefactory.createName(
				"charlie",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				web3.utils.toHex("somecontentid"),
				nameId1LocalWriterKey.address,
				{
					from: account1
				}
			);
			creatorTAONameId = await namefactory.ethAddressToNameId(account1);

			result = await namefactory.createName(
				"delta",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				web3.utils.toHex("somecontentid"),
				nameId2LocalWriterKey.address,
				{
					from: account2
				}
			);
			associatedTAONameId = await namefactory.ethAddressToNameId(account2);

			result = await namefactory.createName(
				"echo",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				web3.utils.toHex("somecontentid"),
				nameId3LocalWriterKey.address,
				{
					from: account3
				}
			);
			proposalTAONameId = await namefactory.ethAddressToNameId(account3);

			result = await namefactory.createName(
				"foxtrot",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				web3.utils.toHex("somecontentid"),
				nameId4LocalWriterKey.address,
				{
					from: account4
				}
			);
			nameId4 = await namefactory.ethAddressToNameId(account4);

			// Mint Logos to Names
			await logos.mint(creatorTAONameId, 10 ** 12, { from: theAO });
			await logos.mint(associatedTAONameId, 10 ** 12, { from: theAO });
			await logos.mint(proposalTAONameId, 10 ** 12, { from: theAO });

			// Create TAOs
			result = await taofactory.createTAO(
				"creatorTAOId",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				web3.utils.toHex("somecontentid"),
				creatorTAONameId,
				0,
				false,
				0,
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
				web3.utils.toHex("somecontentid"),
				creatorTAONameId,
				0,
				false,
				0,
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
				web3.utils.toHex("somecontentid"),
				creatorTAONameId,
				0,
				false,
				0,
				{
					from: account3
				}
			);
			createTAOEvent = result.logs[0];
			proposalTAOId = createTAOEvent.args.taoId;

			await nametaoposition.setListener(creatorTAONameId, nameId4, { from: account1 });
			await nametaoposition.setListener(associatedTAONameId, nameId4, { from: account2 });
			await nametaoposition.setListener(proposalTAONameId, nameId4, { from: account3 });
		});

		it("getSettingTypes() - should return the available setting types in the contract", async function() {
			var getSettingTypes = await aosetting.getSettingTypes();
			assert.equal(getSettingTypes[0].toNumber(), 1, "getSettingTypes() returns incorrect value for address setting type");
			assert.equal(getSettingTypes[1].toNumber(), 2, "getSettingTypes() returns incorrect value for bool setting type");
			assert.equal(getSettingTypes[2].toNumber(), 3, "getSettingTypes() returns incorrect value for bytes32 setting type");
			assert.equal(getSettingTypes[3].toNumber(), 4, "getSettingTypes() returns incorrect value for string setting type");
			assert.equal(getSettingTypes[4].toNumber(), 5, "getSettingTypes() returns incorrect value for uint256 setting type");
		});

		it("addUintSetting() - only the Advocate of a Creator TAO can add uint setting", async function() {
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

			// Listener submit account recovery for creatorTAONameId
			await nameaccountrecovery.submitAccountRecovery(creatorTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

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
			assert.equal(canAdd, false, "Compromised Advocate of Creator TAO can create setting");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

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
				totalSettingBefore.add(new BN(1)).toNumber(),
				"Contract has incorrect totalSetting after adding setting"
			);

			var settingTypeLookup = await aosetting.settingTypeLookup(settingId1.toNumber());
			assert.equal(settingTypeLookup.toNumber(), 5, "settingTypeLookup() returns incorrect value");

			var pendingValue = await aosettingvalue.pendingValue(settingId1.toNumber());
			assert.equal(pendingValue[4].toNumber(), uintValue, "Setting has incorrect pendingValue");

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

			var associatedTAOSetting = await aosettingattribute.getAssociatedTAOSetting(associatedTAOSettingId);
			assert.equal(
				associatedTAOSetting[0],
				associatedTAOSettingId,
				"getAssociatedTAOSetting returns incorrect associatedTAOSettingId"
			);
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

		it("addBoolSetting() - only the Advocate of a Creator TAO can add bool setting", async function() {
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

			// Listener submit account recovery for creatorTAONameId
			await nameaccountrecovery.submitAccountRecovery(creatorTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

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
			assert.equal(canAdd, false, "Compromised Advocate of Creator TAO can create setting");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

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
				totalSettingBefore.add(new BN(1)).toNumber(),
				"Contract has incorrect totalSetting after adding setting"
			);

			var settingTypeLookup = await aosetting.settingTypeLookup(settingId2.toNumber());
			assert.equal(settingTypeLookup.toNumber(), 2, "settingTypeLookup() returns incorrect value");

			var pendingValue = await aosettingvalue.pendingValue(settingId2.toNumber());
			assert.equal(pendingValue[1], boolValue, "Setting has incorrect pendingValue");

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

			var associatedTAOSetting = await aosettingattribute.getAssociatedTAOSetting(associatedTAOSettingId);
			assert.equal(
				associatedTAOSetting[0],
				associatedTAOSettingId,
				"getAssociatedTAOSetting returns incorrect associatedTAOSettingId"
			);
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

		it("addAddressSetting() - only the Advocate of a Creator TAO can add address setting", async function() {
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

			// Listener submit account recovery for creatorTAONameId
			await nameaccountrecovery.submitAccountRecovery(creatorTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

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
			assert.equal(canAdd, false, "Compromised Advocate of Creator TAO can create setting");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

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
				totalSettingBefore.add(new BN(1)).toNumber(),
				"Contract has incorrect totalSetting after adding setting"
			);

			var settingTypeLookup = await aosetting.settingTypeLookup(settingId3.toNumber());
			assert.equal(settingTypeLookup.toNumber(), 1, "settingTypeLookup() returns incorrect value");

			var pendingValue = await aosettingvalue.pendingValue(settingId3.toNumber());
			assert.equal(pendingValue[0], addressValue, "Setting has incorrect pendingValue");

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

			var associatedTAOSetting = await aosettingattribute.getAssociatedTAOSetting(associatedTAOSettingId);
			assert.equal(
				associatedTAOSetting[0],
				associatedTAOSettingId,
				"getAssociatedTAOSetting returns incorrect associatedTAOSettingId"
			);
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

		it("addBytesSetting() - only the Advocate of a Creator TAO can add bytes setting", async function() {
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

			// Listener submit account recovery for creatorTAONameId
			await nameaccountrecovery.submitAccountRecovery(creatorTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

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
			assert.equal(canAdd, false, "Compromised Advocate of Creator TAO can create setting");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

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
				totalSettingBefore.add(new BN(1)).toNumber(),
				"Contract has incorrect totalSetting after adding setting"
			);

			var settingTypeLookup = await aosetting.settingTypeLookup(settingId4.toNumber());
			assert.equal(settingTypeLookup.toNumber(), 3, "settingTypeLookup() returns incorrect value");

			var pendingValue = await aosettingvalue.pendingValue(settingId4.toNumber());
			assert.notEqual(pendingValue[2], nullBytesValue, "Setting has incorrect pendingValue");

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

			var associatedTAOSetting = await aosettingattribute.getAssociatedTAOSetting(associatedTAOSettingId);
			assert.equal(
				associatedTAOSetting[0],
				associatedTAOSettingId,
				"getAssociatedTAOSetting returns incorrect associatedTAOSettingId"
			);
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

		it("addStringSetting() - only the Advocate of a Creator TAO can add string setting", async function() {
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

			// Listener submit account recovery for creatorTAONameId
			await nameaccountrecovery.submitAccountRecovery(creatorTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

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
			assert.equal(canAdd, false, "Compromised Advocate of Creator TAO can create setting");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

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
				totalSettingBefore.add(new BN(1)).toNumber(),
				"Contract has incorrect totalSetting after adding setting"
			);

			var settingTypeLookup = await aosetting.settingTypeLookup(settingId5.toNumber());
			assert.equal(settingTypeLookup.toNumber(), 4, "settingTypeLookup() returns incorrect value");

			var pendingValue = await aosettingvalue.pendingValue(settingId5.toNumber());
			assert.equal(pendingValue[3], stringValue, "Setting has incorrect pendingValue");

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

			var associatedTAOSetting = await aosettingattribute.getAssociatedTAOSetting(associatedTAOSettingId);
			assert.equal(
				associatedTAOSetting[0],
				associatedTAOSettingId,
				"getAssociatedTAOSetting returns incorrect associatedTAOSettingId"
			);
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

		it("approveSettingCreation() - only the Advocate of setting's Associated TAO can approve/reject uint setting creation", async function() {
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

			// Listener submit account recovery for associatedTAONameId
			await nameaccountrecovery.submitAccountRecovery(associatedTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			// Approve settingId1
			try {
				var result = await aosetting.approveSettingCreation(settingId1, true, { from: account2 });
				canApprove = true;
				approveSettingCreationEvent = result.logs[0];
			} catch (e) {
				canApprove = false;
				approveSettingCreationEvent = null;
			}
			assert.equal(canApprove, false, "Compromised Advocate of setting's Associated TAO can approve setting creation");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

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

			var settingId = await aosetting.getSettingIdByTAOName(associatedTAOId, "uintSetting2");
			assert.equal(settingId.toNumber(), 0, "getSettingIdByTAOName() returns incorrect value");

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

		it("finalizeSettingCreation() - only the Advocate of setting's Creator TAO can finalize uint setting creation", async function() {
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

			// Listener submit account recovery for creatorTAONameId
			await nameaccountrecovery.submitAccountRecovery(creatorTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			try {
				var result = await aosetting.finalizeSettingCreation(settingId1, { from: account1 });
				canFinalize = true;
				finalizeSettingCreationEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingCreationEvent = null;
			}
			assert.equal(canFinalize, false, "Compromised Advocate can finalize setting creation");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			try {
				var result = await aosetting.finalizeSettingCreation(settingId1, { from: account1 });
				canFinalize = true;
				finalizeSettingCreationEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingCreationEvent = null;
			}
			assert.equal(canFinalize, true, "Advocate can't finalize setting creation");

			var pendingValue = await aosettingvalue.pendingValue(settingId1.toNumber());
			assert.equal(pendingValue[4].toNumber(), 0, "Setting has incorrect pendingValue");

			var settingValue = await aosettingvalue.settingValue(settingId1.toNumber());
			assert.equal(settingValue[4].toNumber(), uintValue, "Setting has incorrect settingValue");

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

		it("approveSettingCreation() - only the Advocate of setting's Associated TAO can approve/reject bool setting creation", async function() {
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

			// Listener submit account recovery for associatedTAONameId
			await nameaccountrecovery.submitAccountRecovery(associatedTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			// Approve settingId2
			try {
				var result = await aosetting.approveSettingCreation(settingId2, true, { from: account2 });
				canApprove = true;
				approveSettingCreationEvent = result.logs[0];
			} catch (e) {
				canApprove = false;
				approveSettingCreationEvent = null;
			}
			assert.equal(canApprove, false, "Compromised Advocate of setting's Associated TAO can approve setting creation");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

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

			var settingId = await aosetting.getSettingIdByTAOName(associatedTAOId, "boolSetting2");
			assert.equal(settingId.toNumber(), 0, "getSettingIdByTAOName() returns incorrect value");

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

		it("finalizeSettingCreation() - only the Advocate of setting's Creator TAO can finalize bool setting creation", async function() {
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

			// Listener submit account recovery for creatorTAONameId
			await nameaccountrecovery.submitAccountRecovery(creatorTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			try {
				var result = await aosetting.finalizeSettingCreation(settingId2, { from: account1 });
				canFinalize = true;
				finalizeSettingCreationEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingCreationEvent = null;
			}
			assert.equal(canFinalize, false, "Compromised Advocate can finalize setting creation");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			try {
				var result = await aosetting.finalizeSettingCreation(settingId2, { from: account1 });
				canFinalize = true;
				finalizeSettingCreationEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingCreationEvent = null;
			}
			assert.equal(canFinalize, true, "Advocate can't finalize setting creation");

			var pendingValue = await aosettingvalue.pendingValue(settingId2.toNumber());
			assert.equal(pendingValue[1], false, "Setting has incorrect pendingValue");

			var settingValue = await aosettingvalue.settingValue(settingId2.toNumber());
			assert.equal(settingValue[1], boolValue, "Setting has incorrect settingValue");

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

		it("approveSettingCreation() - only the Advocate of setting's Associated TAO can approve/reject address setting creation", async function() {
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

			// Listener submit account recovery for associatedTAONameId
			await nameaccountrecovery.submitAccountRecovery(associatedTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			// Approve settingId3
			try {
				var result = await aosetting.approveSettingCreation(settingId3, true, { from: account2 });
				canApprove = true;
				approveSettingCreationEvent = result.logs[0];
			} catch (e) {
				canApprove = false;
				approveSettingCreationEvent = null;
			}
			assert.equal(canApprove, false, "Compromised Advocate of setting's Associated TAO can approve setting creation");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

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

			var settingId = await aosetting.getSettingIdByTAOName(associatedTAOId, "addressSetting2");
			assert.equal(settingId.toNumber(), 0, "getSettingIdByTAOName() returns incorrect value");

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

		it("finalizeSettingCreation() - only the Advocate of setting's Creator TAO can finalize address setting creation", async function() {
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

			// Listener submit account recovery for creatorTAONameId
			await nameaccountrecovery.submitAccountRecovery(creatorTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			try {
				var result = await aosetting.finalizeSettingCreation(settingId3, { from: account1 });
				canFinalize = true;
				finalizeSettingCreationEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingCreationEvent = null;
			}
			assert.equal(canFinalize, false, "Compromiseed Advocate can finalize setting creation");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			try {
				var result = await aosetting.finalizeSettingCreation(settingId3, { from: account1 });
				canFinalize = true;
				finalizeSettingCreationEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingCreationEvent = null;
			}
			assert.equal(canFinalize, true, "Advocate can't finalize setting creation");

			var pendingValue = await aosettingvalue.pendingValue(settingId3.toNumber());
			assert.equal(pendingValue[0], emptyAddress, "Setting has incorrect pendingValue");

			var settingValue = await aosettingvalue.settingValue(settingId3.toNumber());
			assert.equal(settingValue[0], addressValue, "Setting has incorrect settingValue");

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

		it("approveSettingCreation() - only the Advocate of setting's Associated TAO can approve/reject bytes setting creation", async function() {
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

			// Listener submit account recovery for associatedTAONameId
			await nameaccountrecovery.submitAccountRecovery(associatedTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			// Approve settingId4
			try {
				var result = await aosetting.approveSettingCreation(settingId4, true, { from: account2 });
				canApprove = true;
				approveSettingCreationEvent = result.logs[0];
			} catch (e) {
				canApprove = false;
				approveSettingCreationEvent = null;
			}
			assert.equal(canApprove, false, "Compromised Advocate of setting's Associated TAO can approve setting creation");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

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

			var settingId = await aosetting.getSettingIdByTAOName(associatedTAOId, "bytesSetting2");
			assert.equal(settingId.toNumber(), 0, "getSettingIdByTAOName() returns incorrect value");

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

		it("finalizeSettingCreation() - only the Advocate of setting's Creator TAO can finalize bytes setting creation", async function() {
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

			// Listener submit account recovery for creatorTAONameId
			await nameaccountrecovery.submitAccountRecovery(creatorTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			try {
				var result = await aosetting.finalizeSettingCreation(settingId4, { from: account1 });
				canFinalize = true;
				finalizeSettingCreationEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingCreationEvent = null;
			}
			assert.equal(canFinalize, false, "Compromised Advocate can finalize setting creation");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			try {
				var result = await aosetting.finalizeSettingCreation(settingId4, { from: account1 });
				canFinalize = true;
				finalizeSettingCreationEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingCreationEvent = null;
			}
			assert.equal(canFinalize, true, "Advocate can't finalize setting creation");

			var pendingValue = await aosettingvalue.pendingValue(settingId4.toNumber());
			assert.equal(pendingValue[2], nullBytesValue, "Setting has incorrect pendingValue");

			var settingValue = await aosettingvalue.settingValue(settingId4.toNumber());
			assert.notEqual(settingValue[2], nullBytesValue, "Setting has incorrect settingValue");

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

		it("approveSettingCreation() - only the Advocate of setting's Associated TAO can approve/reject string setting creation", async function() {
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

			// Listener submit account recovery for associatedTAONameId
			await nameaccountrecovery.submitAccountRecovery(associatedTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			// Approve settingId5
			try {
				var result = await aosetting.approveSettingCreation(settingId5, true, { from: account2 });
				canApprove = true;
				approveSettingCreationEvent = result.logs[0];
			} catch (e) {
				canApprove = false;
				approveSettingCreationEvent = null;
			}
			assert.equal(canApprove, false, "Compromised Advocate of setting's Associated TAO can approve setting creation");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

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

			var settingId = await aosetting.getSettingIdByTAOName(associatedTAOId, "stringSetting2");
			assert.equal(settingId.toNumber(), 0, "getSettingIdByTAOName() returns incorrect value");

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

		it("finalizeSettingCreation() - only the Advocate of setting's Creator TAO can finalize string setting creation", async function() {
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

			// Listener submit account recovery for creatorTAONameId
			await nameaccountrecovery.submitAccountRecovery(creatorTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			try {
				var result = await aosetting.finalizeSettingCreation(settingId5, { from: account1 });
				canFinalize = true;
				finalizeSettingCreationEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingCreationEvent = null;
			}
			assert.equal(canFinalize, false, "Compromised Advocate can finalize setting creation");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			try {
				var result = await aosetting.finalizeSettingCreation(settingId5, { from: account1 });
				canFinalize = true;
				finalizeSettingCreationEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingCreationEvent = null;
			}
			assert.equal(canFinalize, true, "Advocate can't finalize setting creation");

			var pendingValue = await aosettingvalue.pendingValue(settingId5.toNumber());
			assert.equal(pendingValue[3], "", "Setting has incorrect pendingValue");

			var settingValue = await aosettingvalue.settingValue(settingId5.toNumber());
			assert.equal(settingValue[3], stringValue, "Setting has incorrect settingValue");

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

		it("updateUintSetting() - only the Advocate of setting's Associated TAO can update uint setting", async function() {
			uintValue = 100;
			var signature = createSignature(
				account2PrivateKey,
				settingId1.toNumber(),
				proposalTAOId,
				associatedTAONameId,
				uintValue,
				"uint256"
			);
			var vrs = EthCrypto.vrs.fromString(signature);

			var canUpdate, settingUpdateEvent;
			try {
				var result = await aosettingupdate.updateUintSetting(
					settingId2.toNumber(),
					uintValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can call update uint on non-uint setting");

			try {
				var result = await aosettingupdate.updateUintSetting(
					settingId11.toNumber(),
					uintValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update non-approved uint setting");

			try {
				var result = await aosettingupdate.updateUintSetting(
					settingId6.toNumber(),
					uintValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update rejected uint setting");

			try {
				var result = await aosettingupdate.updateUintSetting(
					settingId1.toNumber(),
					uintValue,
					nonTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update uint setting with invalid Proposal TAO");

			try {
				var result = await aosettingupdate.updateUintSetting(
					settingId1.toNumber(),
					uintValue,
					proposalTAOId,
					"",
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update uint setting without v part of update signature");

			try {
				var result = await aosettingupdate.updateUintSetting(
					settingId1.toNumber(),
					uintValue,
					proposalTAOId,
					vrs.v,
					"",
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update uint setting without r part of update signature");

			try {
				var result = await aosettingupdate.updateUintSetting(
					settingId1.toNumber(),
					uintValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					"",
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update uint setting without s part of update signature");

			try {
				var result = await aosettingupdate.updateUintSetting(
					settingId1.toNumber(),
					uintValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account1
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Non-setting Associated TAO's Advocate can update uint setting");

			try {
				var result = await aosettingupdate.updateUintSetting(99, uintValue, proposalTAOId, vrs.v, vrs.r, vrs.s, extraData, {
					from: account2
				});
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update uint setting on non-existing setting");

			// Listener submit account recovery for associatedTAONameId
			await nameaccountrecovery.submitAccountRecovery(associatedTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			try {
				var result = await aosettingupdate.updateUintSetting(
					settingId1.toNumber(),
					uintValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Compromised Advocate can update uint setting");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			try {
				var result = await aosettingupdate.updateUintSetting(
					settingId1.toNumber(),
					uintValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, true, "Advocate can't update uint setting");

			var pendingValue = await aosettingvalue.pendingValue(settingId1.toNumber());
			assert.equal(pendingValue[4].toNumber(), uintValue, "Setting has incorrect pendingValue");

			assert.equal(
				settingUpdateEvent.args.settingId.toNumber(),
				settingId1.toNumber(),
				"SettingUpdate event has incorrect settingId"
			);
			assert.equal(
				settingUpdateEvent.args.updateAdvocateNameId,
				associatedTAONameId,
				"SettingUpdate event has incorrect updateAdvocateNameId"
			);
			assert.equal(settingUpdateEvent.args.proposalTAOId, proposalTAOId, "SettingUpdate event has incorrect proposalTAOId");

			var updateSignature = await aosettingupdate.updateSignatures(settingId1.toNumber());
			assert.equal(updateSignature[1], vrs.r, "updateSignature has incorrect value of signatureR");
			assert.equal(updateSignature[2], vrs.s, "updateSignature has incorrect value of signatureS");

			var settingValue = await aosettingvalue.settingValue(settingId1.toNumber());
			var updateHash = EthCrypto.hash.keccak256([
				{
					type: "address",
					value: aosettingupdate.address
				},
				{
					type: "address",
					value: proposalTAOId
				},
				{
					type: "uint256",
					value: settingValue[4].toNumber()
				},
				{
					type: "uint256",
					value: uintValue
				},
				{
					type: "string",
					value: extraData
				},
				{
					type: "uint256",
					value: settingId1.toNumber()
				}
			]);

			var updateHashLookup = await aosettingupdate.updateHashLookup(updateHash);
			assert.equal(updateHashLookup.toNumber(), settingId1.toNumber(), "updateHashLookup has incorrect value");

			try {
				var result = await aosettingupdate.updateUintSetting(
					settingId1.toNumber(),
					uintValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update uint setting that is currently pending approval");
		});

		it("updateBoolSetting() - only the Advocate of setting's Associated TAO can update bool setting", async function() {
			boolValue = false;
			var signature = createSignature(
				account2PrivateKey,
				settingId2.toNumber(),
				proposalTAOId,
				associatedTAONameId,
				boolValue,
				"bool"
			);
			var vrs = EthCrypto.vrs.fromString(signature);

			var canUpdate, settingUpdateEvent;
			try {
				var result = await aosettingupdate.updateBoolSetting(
					settingId1.toNumber(),
					boolValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can call update bool on non-bool setting");

			try {
				var result = await aosettingupdate.updateBoolSetting(
					settingId12.toNumber(),
					boolValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update non-approved bool setting");

			try {
				var result = await aosettingupdate.updateBoolSetting(
					settingId7.toNumber(),
					boolValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update rejected bool setting");

			try {
				var result = await aosettingupdate.updateBoolSetting(
					settingId2.toNumber(),
					boolValue,
					nonTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update bool setting with invalid Proposal TAO");

			try {
				var result = await aosettingupdate.updateBoolSetting(
					settingId2.toNumber(),
					boolValue,
					proposalTAOId,
					"",
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update bool setting without v part of update signature");

			try {
				var result = await aosettingupdate.updateBoolSetting(
					settingId2.toNumber(),
					boolValue,
					proposalTAOId,
					vrs.v,
					"",
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update bool setting without r part of update signature");

			try {
				var result = await aosettingupdate.updateBoolSetting(
					settingId2.toNumber(),
					boolValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					"",
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update bool setting without s part of update signature");

			try {
				var result = await aosettingupdate.updateBoolSetting(
					settingId2.toNumber(),
					boolValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account1
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Non-setting Associated TAO's Advocate can update bool setting");

			try {
				var result = await aosettingupdate.updateBoolSetting(99, boolValue, proposalTAOId, vrs.v, vrs.r, vrs.s, extraData, {
					from: account2
				});
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update bool setting on non-existing setting");

			// Listener submit account recovery for associatedTAONameId
			await nameaccountrecovery.submitAccountRecovery(associatedTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			try {
				var result = await aosettingupdate.updateBoolSetting(
					settingId2.toNumber(),
					boolValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Compromised Advocate can update bool setting");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			try {
				var result = await aosettingupdate.updateBoolSetting(
					settingId2.toNumber(),
					boolValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, true, "Advocate can't update bool setting");

			var pendingValue = await aosettingvalue.pendingValue(settingId2.toNumber());
			assert.equal(pendingValue[1], boolValue, "Setting has incorrect pendingValue");

			assert.equal(
				settingUpdateEvent.args.settingId.toNumber(),
				settingId2.toNumber(),
				"SettingUpdate event has incorrect settingId"
			);
			assert.equal(
				settingUpdateEvent.args.updateAdvocateNameId,
				associatedTAONameId,
				"SettingUpdate event has incorrect updateAdvocateNameId"
			);
			assert.equal(settingUpdateEvent.args.proposalTAOId, proposalTAOId, "SettingUpdate event has incorrect proposalTAOId");

			var updateSignature = await aosettingupdate.updateSignatures(settingId2.toNumber());
			assert.equal(updateSignature[1], vrs.r, "updateSignature has incorrect value of signatureR");
			assert.equal(updateSignature[2], vrs.s, "updateSignature has incorrect value of signatureS");

			var settingValue = await aosettingvalue.settingValue(settingId2.toNumber());
			var updateHash = EthCrypto.hash.keccak256([
				{
					type: "address",
					value: aosettingupdate.address
				},
				{
					type: "address",
					value: proposalTAOId
				},
				{
					type: "bool",
					value: settingValue[1]
				},
				{
					type: "bool",
					value: boolValue
				},
				{
					type: "string",
					value: extraData
				},
				{
					type: "uint256",
					value: settingId2.toNumber()
				}
			]);

			var updateHashLookup = await aosettingupdate.updateHashLookup(updateHash);
			assert.equal(updateHashLookup.toNumber(), settingId2.toNumber(), "updateHashLookup has incorrect value");

			try {
				var result = await aosettingupdate.updateBoolSetting(
					settingId2.toNumber(),
					boolValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update bool setting that is currently pending approval");
		});

		it("updateAddressSetting() - only the Advocate of setting's Associated TAO can update address setting", async function() {
			addressValue = accounts[9];
			var signature = createSignature(
				account2PrivateKey,
				settingId3.toNumber(),
				proposalTAOId,
				associatedTAONameId,
				addressValue,
				"address"
			);
			var vrs = EthCrypto.vrs.fromString(signature);

			var canUpdate, settingUpdateEvent;
			try {
				var result = await aosettingupdate.updateAddressSetting(
					settingId1.toNumber(),
					addressValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can call update address on non-address setting");

			try {
				var result = await aosettingupdate.updateAddressSetting(
					settingId13.toNumber(),
					addressValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update non-approved address setting");

			try {
				var result = await aosettingupdate.updateAddressSetting(
					settingId8.toNumber(),
					addressValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update rejected address setting");

			try {
				var result = await aosettingupdate.updateAddressSetting(
					settingId3.toNumber(),
					addressValue,
					nonTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update address setting with invalid Proposal TAO");

			try {
				var result = await aosettingupdate.updateAddressSetting(
					settingId3.toNumber(),
					addressValue,
					proposalTAOId,
					"",
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update address setting without v part of update signature");

			try {
				var result = await aosettingupdate.updateAddressSetting(
					settingId3.toNumber(),
					addressValue,
					proposalTAOId,
					vrs.v,
					"",
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update address setting without r part of update signature");

			try {
				var result = await aosettingupdate.updateAddressSetting(
					settingId3.toNumber(),
					addressValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					"",
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update address setting without s part of update signature");

			try {
				var result = await aosettingupdate.updateAddressSetting(
					settingId3.toNumber(),
					addressValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account1
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Non-setting Associated TAO's Advocate can update address setting");

			try {
				var result = await aosettingupdate.updateAddressSetting(99, addressValue, proposalTAOId, vrs.v, vrs.r, vrs.s, extraData, {
					from: account2
				});
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update address setting on non-existing setting");

			// Listener submit account recovery for associatedTAONameId
			await nameaccountrecovery.submitAccountRecovery(associatedTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			try {
				var result = await aosettingupdate.updateAddressSetting(
					settingId3.toNumber(),
					addressValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Compromised Advocate can update address setting");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			try {
				var result = await aosettingupdate.updateAddressSetting(
					settingId3.toNumber(),
					addressValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, true, "Advocate can't update address setting");

			var pendingValue = await aosettingvalue.pendingValue(settingId3.toNumber());
			assert.equal(pendingValue[0], addressValue, "Setting has incorrect pendingValue");

			assert.equal(
				settingUpdateEvent.args.settingId.toNumber(),
				settingId3.toNumber(),
				"SettingUpdate event has incorrect settingId"
			);
			assert.equal(
				settingUpdateEvent.args.updateAdvocateNameId,
				associatedTAONameId,
				"SettingUpdate event has incorrect updateAdvocateNameId"
			);
			assert.equal(settingUpdateEvent.args.proposalTAOId, proposalTAOId, "SettingUpdate event has incorrect proposalTAOId");

			var updateSignature = await aosettingupdate.updateSignatures(settingId3.toNumber());
			assert.equal(updateSignature[1], vrs.r, "updateSignature has incorrect value of signatureR");
			assert.equal(updateSignature[2], vrs.s, "updateSignature has incorrect value of signatureS");

			var settingValue = await aosettingvalue.settingValue(settingId3.toNumber());
			var updateHash = EthCrypto.hash.keccak256([
				{
					type: "address",
					value: aosettingupdate.address
				},
				{
					type: "address",
					value: proposalTAOId
				},
				{
					type: "address",
					value: settingValue[0]
				},
				{
					type: "address",
					value: addressValue
				},
				{
					type: "string",
					value: extraData
				},
				{
					type: "uint256",
					value: settingId3.toNumber()
				}
			]);

			var updateHashLookup = await aosettingupdate.updateHashLookup(updateHash);
			assert.equal(updateHashLookup.toNumber(), settingId3.toNumber(), "updateHashLookup has incorrect value");

			try {
				var result = await aosettingupdate.updateAddressSetting(
					settingId3.toNumber(),
					addressValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update address setting that is currently pending approval");
		});

		it("updateBytesSetting() - only the Advocate of setting's Associated TAO can update bytes32 setting", async function() {
			bytesValue = "0x6e6577627974657376616c756500000000000000000000000000000000000000";
			var signature = createSignature(
				account2PrivateKey,
				settingId4.toNumber(),
				proposalTAOId,
				associatedTAONameId,
				bytesValue,
				"bytes32"
			);
			var vrs = EthCrypto.vrs.fromString(signature);
			var canUpdate, settingUpdateEvent;
			try {
				var result = await aosettingupdate.updateBytesSetting(
					settingId1.toNumber(),
					bytesValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can call update bytes on non-bytes setting");

			try {
				var result = await aosettingupdate.updateBytesSetting(
					settingId14.toNumber(),
					bytesValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update non-approved bytes32 setting");

			try {
				var result = await aosettingupdate.updateBytesSetting(
					settingId9.toNumber(),
					bytesValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update rejected bytes32 setting");

			try {
				var result = await aosettingupdate.updateBytesSetting(
					settingId4.toNumber(),
					bytesValue,
					nonTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update bytes32 setting with invalid Proposal TAO");

			try {
				var result = await aosettingupdate.updateBytesSetting(
					settingId4.toNumber(),
					bytesValue,
					proposalTAOId,
					"",
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update bytes32 setting without v part of update signature");

			try {
				var result = await aosettingupdate.updateBytesSetting(
					settingId4.toNumber(),
					bytesValue,
					proposalTAOId,
					vrs.v,
					"",
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update bytes32 setting without r part of update signature");

			try {
				var result = await aosettingupdate.updateBytesSetting(
					settingId4.toNumber(),
					bytesValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					"",
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update bytes32 setting without s part of update signature");

			try {
				var result = await aosettingupdate.updateBytesSetting(
					settingId4.toNumber(),
					bytesValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account1
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Non-setting Associated TAO's Advocate can update bytes32 setting");

			try {
				var result = await aosettingupdate.updateBytesSetting(99, bytesValue, proposalTAOId, vrs.v, vrs.r, vrs.s, extraData, {
					from: account2
				});
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update bytes32 setting on non-existing setting");

			// Listener submit account recovery for associatedTAONameId
			await nameaccountrecovery.submitAccountRecovery(associatedTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			try {
				var result = await aosettingupdate.updateBytesSetting(
					settingId4.toNumber(),
					bytesValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Compromised Advocate can update bytes32 setting");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			try {
				var result = await aosettingupdate.updateBytesSetting(
					settingId4.toNumber(),
					bytesValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, true, "Advocate can't update bytes32 setting");

			var pendingValue = await aosettingvalue.pendingValue(settingId4.toNumber());
			assert.equal(pendingValue[2], bytesValue, "Setting has incorrect pendingValue");

			assert.equal(
				settingUpdateEvent.args.settingId.toNumber(),
				settingId4.toNumber(),
				"SettingUpdate event has incorrect settingId"
			);
			assert.equal(
				settingUpdateEvent.args.updateAdvocateNameId,
				associatedTAONameId,
				"SettingUpdate event has incorrect updateAdvocateNameId"
			);
			assert.equal(settingUpdateEvent.args.proposalTAOId, proposalTAOId, "SettingUpdate event has incorrect proposalTAOId");

			var updateSignature = await aosettingupdate.updateSignatures(settingId4.toNumber());
			assert.equal(updateSignature[1], vrs.r, "updateSignature has incorrect value of signatureR");
			assert.equal(updateSignature[2], vrs.s, "updateSignature has incorrect value of signatureS");

			var settingValue = await aosettingvalue.settingValue(settingId4.toNumber());
			var updateHash = EthCrypto.hash.keccak256([
				{
					type: "address",
					value: aosettingupdate.address
				},
				{
					type: "address",
					value: proposalTAOId
				},
				{
					type: "bytes32",
					value: settingValue[2]
				},
				{
					type: "bytes32",
					value: bytesValue
				},
				{
					type: "string",
					value: extraData
				},
				{
					type: "uint256",
					value: settingId4.toNumber()
				}
			]);

			var updateHashLookup = await aosettingupdate.updateHashLookup(updateHash);
			assert.equal(updateHashLookup.toNumber(), settingId4.toNumber(), "updateHashLookup has incorrect value");

			try {
				var result = await aosettingupdate.updateBytesSetting(
					settingId4.toNumber(),
					bytesValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update bytes32 setting that is currently pending approval");
		});

		it("updateStringSetting() - only the Advocate of setting's Associated TAO can update string setting", async function() {
			stringValue = "somevalue";
			var signature = createSignature(
				account2PrivateKey,
				settingId5.toNumber(),
				proposalTAOId,
				associatedTAONameId,
				stringValue,
				"string"
			);
			var vrs = EthCrypto.vrs.fromString(signature);

			var canUpdate, settingUpdateEvent;
			try {
				var result = await aosettingupdate.updateStringSetting(
					settingId1.toNumber(),
					stringValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can call update string on non-string setting");

			try {
				var result = await aosettingupdate.updateStringSetting(
					settingId15.toNumber(),
					stringValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update non-approved string setting");

			try {
				var result = await aosettingupdate.updateStringSetting(
					settingId10.toNumber(),
					stringValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update rejected string setting");

			try {
				var result = await aosettingupdate.updateStringSetting(
					settingId5.toNumber(),
					stringValue,
					nonTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update string setting with invalid Proposal TAO");

			try {
				var result = await aosettingupdate.updateStringSetting(
					settingId5.toNumber(),
					stringValue,
					proposalTAOId,
					"",
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update string setting without v part of update signature");

			try {
				var result = await aosettingupdate.updateStringSetting(
					settingId5.toNumber(),
					stringValue,
					proposalTAOId,
					vrs.v,
					"",
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update string setting without r part of update signature");

			try {
				var result = await aosettingupdate.updateStringSetting(
					settingId5.toNumber(),
					stringValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					"",
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update string setting without s part of update signature");

			try {
				var result = await aosettingupdate.updateStringSetting(
					settingId5.toNumber(),
					stringValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account1
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Non-setting Associated TAO's Advocate can update string setting");

			try {
				var result = await aosettingupdate.updateStringSetting(99, stringValue, proposalTAOId, vrs.v, vrs.r, vrs.s, extraData, {
					from: account2
				});
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update string setting on non-existing setting");

			// Listener submit account recovery for associatedTAONameId
			await nameaccountrecovery.submitAccountRecovery(associatedTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			try {
				var result = await aosettingupdate.updateStringSetting(
					settingId5.toNumber(),
					stringValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Compromised Advocate can update string setting");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			try {
				var result = await aosettingupdate.updateStringSetting(
					settingId5.toNumber(),
					stringValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, true, "Advocate can't update string setting");

			var pendingValue = await aosettingvalue.pendingValue(settingId5.toNumber());
			assert.equal(pendingValue[3], stringValue, "Setting has incorrect pendingValue");

			assert.equal(
				settingUpdateEvent.args.settingId.toNumber(),
				settingId5.toNumber(),
				"SettingUpdate event has incorrect settingId"
			);
			assert.equal(
				settingUpdateEvent.args.updateAdvocateNameId,
				associatedTAONameId,
				"SettingUpdate event has incorrect updateAdvocateNameId"
			);
			assert.equal(settingUpdateEvent.args.proposalTAOId, proposalTAOId, "SettingUpdate event has incorrect proposalTAOId");

			var updateSignature = await aosettingupdate.updateSignatures(settingId5.toNumber());
			assert.equal(updateSignature[1], vrs.r, "updateSignature has incorrect value of signatureR");
			assert.equal(updateSignature[2], vrs.s, "updateSignature has incorrect value of signatureS");

			var settingValue = await aosettingvalue.settingValue(settingId5.toNumber());
			var updateHash = EthCrypto.hash.keccak256([
				{
					type: "address",
					value: aosettingupdate.address
				},
				{
					type: "address",
					value: proposalTAOId
				},
				{
					type: "string",
					value: settingValue[3]
				},
				{
					type: "string",
					value: stringValue
				},
				{
					type: "string",
					value: extraData
				},
				{
					type: "uint256",
					value: settingId5.toNumber()
				}
			]);

			var updateHashLookup = await aosettingupdate.updateHashLookup(updateHash);
			assert.equal(updateHashLookup.toNumber(), settingId5.toNumber(), "updateHashLookup has incorrect value");

			try {
				var result = await aosettingupdate.updateStringSetting(
					settingId5.toNumber(),
					stringValue,
					proposalTAOId,
					vrs.v,
					vrs.r,
					vrs.s,
					extraData,
					{
						from: account2
					}
				);
				canUpdate = true;
				settingUpdateEvent = result.logs[0];
			} catch (e) {
				canUpdate = false;
				settingUpdateEvent = null;
			}
			assert.equal(canUpdate, false, "Advocate can update string setting that is currently pending approval");
		});

		it("approveSettingUpdate() - only the Advocate of setting's Proposal TAO can approve uint setting update", async function() {
			var canApprove, approveSettingUpdateEvent;
			try {
				var result = await aosettingupdate.approveSettingUpdate(99, true, { from: account3 });
				canApprove = true;
				approveSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canApprove = false;
				approveSettingUpdateEvent = null;
			}
			assert.equal(canApprove, false, "Advocate can approve non-existing setting update");

			try {
				var result = await aosettingupdate.approveSettingUpdate(settingId1, true, { from: account1 });
				canApprove = true;
				approveSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canApprove = false;
				approveSettingUpdateEvent = null;
			}
			assert.equal(canApprove, false, "Non-Advocate of setting's Proposal TAO can approve setting update");

			// Listener submit account recovery for proposalTAONameId
			await nameaccountrecovery.submitAccountRecovery(proposalTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			// Approve settingId1
			try {
				var result = await aosettingupdate.approveSettingUpdate(settingId1, true, { from: account3 });
				canApprove = true;
				approveSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canApprove = false;
				approveSettingUpdateEvent = null;
			}
			assert.equal(canApprove, false, "Compromised Advocate of setting's Proposal TAO can approve setting update");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			// Approve settingId1
			try {
				var result = await aosettingupdate.approveSettingUpdate(settingId1, true, { from: account3 });
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

		it("approveSettingUpdate() - only the Advocate of setting's Proposal TAO can approve bool setting update", async function() {
			var canApprove, approveSettingUpdateEvent;
			try {
				var result = await aosettingupdate.approveSettingUpdate(settingId2, true, { from: account1 });
				canApprove = true;
				approveSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canApprove = false;
				approveSettingUpdateEvent = null;
			}
			assert.equal(canApprove, false, "Non-Advocate of setting's Proposal TAO can approve setting update");

			// Listener submit account recovery for proposalTAONameId
			await nameaccountrecovery.submitAccountRecovery(proposalTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			// Approve settingId2
			try {
				var result = await aosettingupdate.approveSettingUpdate(settingId2, true, { from: account3 });
				canApprove = true;
				approveSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canApprove = false;
				approveSettingUpdateEvent = null;
			}
			assert.equal(canApprove, false, "Compromised Advocate of setting's Proposal TAO can approve setting update");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			// Approve settingId2
			try {
				var result = await aosettingupdate.approveSettingUpdate(settingId2, true, { from: account3 });
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

		it("approveSettingUpdate() - only the Advocate of setting's Proposal TAO can approve address setting update", async function() {
			var canApprove, approveSettingUpdateEvent;
			try {
				var result = await aosettingupdate.approveSettingUpdate(settingId3, true, { from: account1 });
				canApprove = true;
				approveSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canApprove = false;
				approveSettingUpdateEvent = null;
			}
			assert.equal(canApprove, false, "Non-Advocate of setting's Proposal TAO can approve setting update");

			// Listener submit account recovery for proposalTAONameId
			await nameaccountrecovery.submitAccountRecovery(proposalTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			// Approve settingId3
			try {
				var result = await aosettingupdate.approveSettingUpdate(settingId3, true, { from: account3 });
				canApprove = true;
				approveSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canApprove = false;
				approveSettingUpdateEvent = null;
			}
			assert.equal(canApprove, false, "Compromised Advocate of setting's Proposal TAO can approve setting update");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			// Approve settingId3
			try {
				var result = await aosettingupdate.approveSettingUpdate(settingId3, true, { from: account3 });
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

		it("approveSettingUpdate() - only the Advocate of setting's Proposal TAO can approve bytes setting update", async function() {
			var canApprove, approveSettingUpdateEvent;
			try {
				var result = await aosettingupdate.approveSettingUpdate(settingId4, true, { from: account1 });
				canApprove = true;
				approveSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canApprove = false;
				approveSettingUpdateEvent = null;
			}
			assert.equal(canApprove, false, "Non-Advocate of setting's Proposal TAO can approve setting update");

			// Listener submit account recovery for proposalTAONameId
			await nameaccountrecovery.submitAccountRecovery(proposalTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			// Approve settingId4
			try {
				var result = await aosettingupdate.approveSettingUpdate(settingId4, true, { from: account3 });
				canApprove = true;
				approveSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canApprove = false;
				approveSettingUpdateEvent = null;
			}
			assert.equal(canApprove, false, "Compromised Advocate of setting's Proposal TAO can approve setting update");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			// Approve settingId4
			try {
				var result = await aosettingupdate.approveSettingUpdate(settingId4, true, { from: account3 });
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

		it("approveSettingUpdate() - only the Advocate of setting's Proposal TAO can approve string setting update", async function() {
			var canApprove, approveSettingUpdateEvent;
			try {
				var result = await aosettingupdate.approveSettingUpdate(settingId5, true, { from: account1 });
				canApprove = true;
				approveSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canApprove = false;
				approveSettingUpdateEvent = null;
			}
			assert.equal(canApprove, false, "Non-Advocate of setting's Proposal TAO can approve setting update");

			// Listener submit account recovery for proposalTAONameId
			await nameaccountrecovery.submitAccountRecovery(proposalTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			// Approve settingId5
			try {
				var result = await aosettingupdate.approveSettingUpdate(settingId5, true, { from: account3 });
				canApprove = true;
				approveSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canApprove = false;
				approveSettingUpdateEvent = null;
			}
			assert.equal(canApprove, false, "Compromised Advocate of setting's Proposal TAO can approve setting update");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			// Approve settingId5
			try {
				var result = await aosettingupdate.approveSettingUpdate(settingId5, true, { from: account3 });
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

		it("finalizeSettingUpdate() - only the Advocate of setting's Associated TAO can finalize uint setting update", async function() {
			var canFinalize, finalizeSettingUpdateEvent;
			try {
				var result = await aosettingupdate.finalizeSettingUpdate(99, { from: account2 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, false, "Advocate can finalize non-existing setting");

			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId1, { from: account1 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, false, "Non-Advocate of Associated TAO can finalize setting update");

			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId11, { from: account2 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, false, "Advocate can finalize update for non-approved setting");

			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId6, { from: account2 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, false, "Advocate can finalize update for rejected setting");

			// Listener submit account recovery for associatedTAONameId
			await nameaccountrecovery.submitAccountRecovery(associatedTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId1, { from: account2 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, false, "Compromised Advocate can finalize setting update");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId1, { from: account2 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, true, "Advocate can't finalize setting update");

			var pendingValue = await aosettingvalue.pendingValue(settingId1.toNumber());
			assert.equal(pendingValue[4].toNumber(), 0, "Setting has incorrect pendingValue");

			var settingValue = await aosettingvalue.settingValue(settingId1.toNumber());
			assert.equal(settingValue[4].toNumber(), uintValue, "Setting has incorrect settingValue");

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

		it("finalizeSettingUpdate() - only the Advocate of setting's Associated TAO can finalize bool setting update", async function() {
			var canFinalize, finalizeSettingUpdateEvent;
			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId2, { from: account1 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, false, "Non-Advocate of Associated TAO can finalize setting update");

			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId12, { from: account2 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, false, "Advocate can finalize update for non-approved setting");

			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId7, { from: account2 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, false, "Advocate can finalize update for rejected setting");

			// Listener submit account recovery for associatedTAONameId
			await nameaccountrecovery.submitAccountRecovery(associatedTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId2, { from: account2 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, false, "Compromised Advocate can finalize setting update");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId2, { from: account2 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, true, "Advocate can't finalize setting update");

			var pendingValue = await aosettingvalue.pendingValue(settingId2.toNumber());
			assert.equal(pendingValue[1], false, "Setting has incorrect pendingValue");

			var settingValue = await aosettingvalue.settingValue(settingId2.toNumber());
			assert.equal(settingValue[1], boolValue, "Setting has incorrect settingValue");

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

		it("finalizeSettingUpdate() - only the Advocate of setting's Associated TAO can finalize address setting update", async function() {
			var canFinalize, finalizeSettingUpdateEvent;
			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId3, { from: account1 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, false, "Non-Advocate of Associated TAO can finalize setting update");

			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId13, { from: account2 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, false, "Advocate can finalize update for non-approved setting");

			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId8, { from: account2 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, false, "Advocate can finalize update for rejected setting");

			// Listener submit account recovery for associatedTAONameId
			await nameaccountrecovery.submitAccountRecovery(associatedTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId3, { from: account2 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, false, "Compromised Advocate can finalize setting update");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId3, { from: account2 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, true, "Advocate can't finalize setting update");

			var pendingValue = await aosettingvalue.pendingValue(settingId3.toNumber());
			assert.equal(pendingValue[0], emptyAddress, "Setting has incorrect pendingValue");

			var settingValue = await aosettingvalue.settingValue(settingId3.toNumber());
			assert.equal(settingValue[0], addressValue, "Setting has incorrect settingValue");

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

		it("finalizeSettingUpdate() - only the Advocate of setting's Associated TAO can finalize bytes setting update", async function() {
			var canFinalize, finalizeSettingUpdateEvent;
			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId4, { from: account1 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, false, "Non-Advocate of Associated TAO can finalize setting update");

			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId14, { from: account2 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, false, "Advocate can finalize update for non-approved setting");

			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId9, { from: account2 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, false, "Advocate can finalize update for rejected setting");

			// Listener submit account recovery for associatedTAONameId
			await nameaccountrecovery.submitAccountRecovery(associatedTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId4, { from: account2 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, false, "Compromised Advocate can finalize setting update");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId4, { from: account2 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, true, "Advocate can't finalize setting update");

			var pendingValue = await aosettingvalue.pendingValue(settingId4.toNumber());
			assert.equal(pendingValue[2], nullBytesValue, "Setting has incorrect pendingValue");

			var settingValue = await aosettingvalue.settingValue(settingId4.toNumber());
			assert.notEqual(settingValue[2], nullBytesValue, "Setting has incorrect settingValue");

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

		it("finalizeSettingUpdate() - only the Advocate of setting's Associated TAO can finalize string setting update", async function() {
			var canFinalize, finalizeSettingUpdateEvent;
			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId5, { from: account1 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, false, "Non-Advocate of Associated TAO can finalize setting update");

			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId15, { from: account2 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, false, "Advocate can finalize update for non-approved setting");

			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId10, { from: account2 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, false, "Advocate can finalize update for rejected setting");

			// Listener submit account recovery for associatedTAONameId
			await nameaccountrecovery.submitAccountRecovery(associatedTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId5, { from: account2 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, false, "Compromised Advocate can finalize setting update");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			try {
				var result = await aosettingupdate.finalizeSettingUpdate(settingId5, { from: account2 });
				canFinalize = true;
				finalizeSettingUpdateEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingUpdateEvent = null;
			}
			assert.equal(canFinalize, true, "Advocate can't finalize setting update");

			var pendingValue = await aosettingvalue.pendingValue(settingId5.toNumber());
			assert.equal(pendingValue[3], "", "Setting has incorrect pendingValue");

			var settingValue = await aosettingvalue.settingValue(settingId5.toNumber());
			assert.equal(settingValue[3], stringValue, "Setting has incorrect settingValue");

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

		it("approveSettingUpdate() - only the Advocate of setting's Proposal TAO can reject uint setting update", async function() {
			uintValue = 1000;
			var signature = createSignature(
				account2PrivateKey,
				settingId1.toNumber(),
				proposalTAOId,
				associatedTAONameId,
				uintValue,
				"uint256"
			);
			var vrs = EthCrypto.vrs.fromString(signature);

			var result = await aosettingupdate.updateUintSetting(settingId1, uintValue, proposalTAOId, vrs.v, vrs.r, vrs.s, extraData, {
				from: account2
			});

			var canApprove, approveSettingUpdateEvent;
			// Reject settingId1
			try {
				var result = await aosettingupdate.approveSettingUpdate(settingId1, false, { from: account3 });
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
				var result = await aosettingupdate.finalizeSettingUpdate(settingId1, { from: account2 });
				canFinalize = true;
			} catch (e) {
				canFinalize = false;
			}
			assert.equal(canFinalize, false, "Advocate can finalize rejected setting update");
		});

		it("approveSettingUpdate() - only the Advocate of setting's Proposal TAO can reject bool setting update", async function() {
			boolValue = true;
			var signature = createSignature(
				account2PrivateKey,
				settingId2.toNumber(),
				proposalTAOId,
				associatedTAONameId,
				boolValue,
				"bool"
			);
			var vrs = EthCrypto.vrs.fromString(signature);
			var result = await aosettingupdate.updateBoolSetting(settingId2, boolValue, proposalTAOId, vrs.v, vrs.r, vrs.s, extraData, {
				from: account2
			});

			var canApprove, approveSettingUpdateEvent;
			// Reject settingId2
			try {
				var result = await aosettingupdate.approveSettingUpdate(settingId2, false, { from: account3 });
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
				var result = await aosettingupdate.finalizeSettingUpdate(settingId2, { from: account2 });
				canFinalize = true;
			} catch (e) {
				canFinalize = false;
			}
			assert.equal(canFinalize, false, "Advocate can finalize rejected setting update");
		});

		it("approveSettingUpdate() - only the Advocate of setting's Proposal TAO can reject address setting update", async function() {
			addressValue = accounts[9];
			var signature = createSignature(
				account2PrivateKey,
				settingId3.toNumber(),
				proposalTAOId,
				associatedTAONameId,
				addressValue,
				"address"
			);
			var vrs = EthCrypto.vrs.fromString(signature);

			var result = await aosettingupdate.updateAddressSetting(
				settingId3,
				addressValue,
				proposalTAOId,
				vrs.v,
				vrs.r,
				vrs.s,
				extraData,
				{
					from: account2
				}
			);

			var canApprove, approveSettingUpdateEvent;
			// Reject settingId3
			try {
				var result = await aosettingupdate.approveSettingUpdate(settingId3, false, { from: account3 });
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
				var result = await aosettingupdate.finalizeSettingUpdate(settingId3, { from: account2 });
				canFinalize = true;
			} catch (e) {
				canFinalize = false;
			}
			assert.equal(canFinalize, false, "Advocate can finalize rejected setting update");
		});

		it("approveSettingUpdate() - only the Advocate of setting's Proposal TAO can reject bytes setting update", async function() {
			bytesValue = "0x616e6f74686572627974657376616c7565000000000000000000000000000000";
			var signature = createSignature(
				account2PrivateKey,
				settingId4.toNumber(),
				proposalTAOId,
				associatedTAONameId,
				bytesValue,
				"bytes32"
			);
			var vrs = EthCrypto.vrs.fromString(signature);

			var result = await aosettingupdate.updateBytesSetting(settingId4, bytesValue, proposalTAOId, vrs.v, vrs.r, vrs.s, extraData, {
				from: account2
			});

			var canApprove, approveSettingUpdateEvent;
			// Reject settingId4
			try {
				var result = await aosettingupdate.approveSettingUpdate(settingId4, false, { from: account3 });
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
				var result = await aosettingupdate.finalizeSettingUpdate(settingId4, { from: account2 });
				canFinalize = true;
			} catch (e) {
				canFinalize = false;
			}
			assert.equal(canFinalize, false, "Advocate can finalize rejected setting update");
		});

		it("approveSettingUpdate() - only the Advocate of setting's Proposal TAO can reject string setting update", async function() {
			stringValue = "anotherstringvalue";
			var signature = createSignature(
				account2PrivateKey,
				settingId5.toNumber(),
				proposalTAOId,
				associatedTAONameId,
				stringValue,
				"string"
			);
			var vrs = EthCrypto.vrs.fromString(signature);
			var result = await aosettingupdate.updateStringSetting(settingId5, stringValue, proposalTAOId, vrs.v, vrs.r, vrs.s, extraData, {
				from: account2
			});

			var canApprove, approveSettingUpdateEvent;
			// Reject settingId5
			try {
				var result = await aosettingupdate.approveSettingUpdate(settingId5, false, { from: account3 });
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
				var result = await aosettingupdate.finalizeSettingUpdate(settingId5, { from: account2 });
				canFinalize = true;
			} catch (e) {
				canFinalize = false;
			}
			assert.equal(canFinalize, false, "Advocate can finalize rejected setting update");
		});

		it("addSettingDeprecation() - only the Advocate of a Creator TAO can add setting deprecation", async function() {
			var canAdd, settingDeprecationEvent, associatedTAOSettingDeprecationId, creatorTAOSettingDeprecationId;
			try {
				var result = await aosettingdeprecation.addSettingDeprecation(
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
				var result = await aosettingdeprecation.addSettingDeprecation(
					settingId1,
					settingId16,
					newSettingContractAddress,
					creatorTAOId,
					nonTAOId,
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
			assert.equal(canAdd, false, "Can create deprecation using invalid Associated TAO");

			try {
				var result = await aosettingdeprecation.addSettingDeprecation(
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
				var result = await aosettingdeprecation.addSettingDeprecation(
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
				var result = await aosettingdeprecation.addSettingDeprecation(
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
				var result = await aosettingdeprecation.addSettingDeprecation(
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

			// Listener submit account recovery for creatorTAONameId
			await nameaccountrecovery.submitAccountRecovery(creatorTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			try {
				var result = await aosettingdeprecation.addSettingDeprecation(
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
			assert.equal(canAdd, false, "Compromised Advocate of Creator TAO can create setting deprecation");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			try {
				var result = await aosettingdeprecation.addSettingDeprecation(
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
			assert.equal(
				settingDeprecationEvent.args.creatorNameId,
				creatorTAONameId,
				"SettingDeprecation event has incorrect creatorNameId"
			);
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

			// Listener submit account recovery for creatorTAONameId
			await nameaccountrecovery.submitAccountRecovery(creatorTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			// Add deprecation for settingId2
			try {
				var result = await aosettingdeprecation.addSettingDeprecation(
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
			assert.equal(canAdd, false, "Compromised Advocate of Creator TAO can create setting deprecation");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			// Add deprecation for settingId2
			try {
				var result = await aosettingdeprecation.addSettingDeprecation(
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

		it("approveSettingDeprecation() - only the Advocate of setting deprecation's Associated TAO can approve/reject uint setting deprecation", async function() {
			var canApprove, approveSettingDeprecationEvent;
			try {
				var result = await aosettingdeprecation.approveSettingDeprecation(99, true, { from: account1 });
				canApprove = true;
				approveSettingDeprecationEvent = result.logs[0];
			} catch (e) {
				canApprove = false;
				approveSettingDeprecationEvent = null;
			}
			assert.equal(canApprove, false, "Advocate can approve non-existing setting deprecation");

			try {
				var result = await aosettingdeprecation.approveSettingDeprecation(settingId1, true, { from: account1 });
				canApprove = true;
				approveSettingDeprecationEvent = result.logs[0];
			} catch (e) {
				canApprove = false;
				approveSettingDeprecationEvent = null;
			}
			assert.equal(canApprove, false, "Non-Advocate of setting's Associated TAO can approve setting deprecation");

			// Listener submit account recovery for associatedTAONameId
			await nameaccountrecovery.submitAccountRecovery(associatedTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			// Approve settingId1
			try {
				var result = await aosettingdeprecation.approveSettingDeprecation(settingId1, true, { from: account2 });
				canApprove = true;
				approveSettingDeprecationEvent = result.logs[0];
			} catch (e) {
				canApprove = false;
				approveSettingDeprecationEvent = null;
			}
			assert.equal(canApprove, false, "Compromised Advocate of setting's Associated TAO can approve setting deprecation");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			// Approve settingId1
			try {
				var result = await aosettingdeprecation.approveSettingDeprecation(settingId1, true, { from: account2 });
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

			// Listener submit account recovery for associatedTAONameId
			await nameaccountrecovery.submitAccountRecovery(associatedTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			// Reject settingId2
			try {
				var result = await aosettingdeprecation.approveSettingDeprecation(settingId2, false, { from: account2 });
				canApprove = true;
				approveSettingDeprecationEvent = result.logs[0];
			} catch (e) {
				canApprove = false;
				approveSettingDeprecationEvent = null;
			}
			assert.equal(canApprove, false, "Compromised Advocate of setting's Associated TAO can approve setting deprecation");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			// Reject settingId2
			try {
				var result = await aosettingdeprecation.approveSettingDeprecation(settingId2, false, { from: account2 });
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

		it("finalizeSettingDeprecation() - only the Advocate of setting's Creator TAO can finalize setting deprecation", async function() {
			var canFinalize, finalizeSettingDeprecationEvent;
			try {
				var result = await aosettingdeprecation.finalizeSettingDeprecation(99, { from: account1 });
				canFinalize = true;
				finalizeSettingDeprecationEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingDeprecationEvent = null;
			}
			assert.equal(canFinalize, false, "Advocate can finalize non-existing setting deprecation");

			try {
				var result = await aosettingdeprecation.finalizeSettingDeprecation(settingId1, { from: account2 });
				canFinalize = true;
				finalizeSettingDeprecationEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingDeprecationEvent = null;
			}
			assert.equal(canFinalize, false, "Non-Advocate of Creator TAO can finalize setting deprecation");

			try {
				var result = await aosettingdeprecation.finalizeSettingDeprecation(settingId3, { from: account1 });
				canFinalize = true;
				finalizeSettingDeprecationEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingDeprecationEvent = null;
			}
			assert.equal(canFinalize, false, "Advocate can finalize setting that has no deprecation");

			try {
				var result = await aosettingdeprecation.finalizeSettingDeprecation(settingId2, { from: account1 });
				canFinalize = true;
				finalizeSettingDeprecationEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingDeprecationEvent = null;
			}
			assert.equal(canFinalize, false, "Advocate can finalize rejected setting deprecation");

			// Listener submit account recovery for creatorTAONameId
			await nameaccountrecovery.submitAccountRecovery(creatorTAONameId, { from: account4 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			try {
				var result = await aosettingdeprecation.finalizeSettingDeprecation(settingId1, { from: account1 });
				canFinalize = true;
				finalizeSettingDeprecationEvent = result.logs[0];
			} catch (e) {
				canFinalize = false;
				finalizeSettingDeprecationEvent = null;
			}
			assert.equal(canFinalize, false, "Compromised Advocate can finalize setting deprecation");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.add(new BN(100)).toNumber());

			try {
				var result = await aosettingdeprecation.finalizeSettingDeprecation(settingId1, { from: account1 });
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
			var settingId16Value = await aosettingvalue.settingValue(settingId16.toNumber());
			assert.equal(
				settingId1Values[0].toNumber(),
				settingId16Value[4].toNumber(),
				"getSettingValuesById() return incorrect uint256 value for deprecated setting"
			);

			var settingId1Values = await aosetting.getSettingValuesByTAOName(associatedTAOId, "uintSetting");
			assert.equal(
				settingId1Values[0].toNumber(),
				settingId16Value[4].toNumber(),
				"getSettingValuesByTAOName() return incorrect uint256 value"
			);
		});

		it("Advocate should not be able to update deprecated setting", async function() {
			var canUpdate, settingUpdateEvent;
			uintValue = 100;
			try {
				var result = await aosettingupdate.updateUintSetting(settingId1, uintValue, proposalTAOId, updateSignature, extraData, {
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
});
