var AOLibrary = artifacts.require("./AOLibrary.sol");

// TAO Currencies
var Logos = artifacts.require("./Logos.sol");
var Ethos = artifacts.require("./Ethos.sol");
var Pathos = artifacts.require("./Pathos.sol");

// Name/TAO Contracts
var Position = artifacts.require("./Position.sol");
var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOLookup = artifacts.require("./NameTAOLookup.sol");
var TAOPosition = artifacts.require("./TAOPosition.sol");

// Settings
var AOSettingAttribute = artifacts.require("./AOSettingAttribute.sol");
var AOUintSetting = artifacts.require("./AOUintSetting.sol");
var AOBoolSetting = artifacts.require("./AOBoolSetting.sol");
var AOAddressSetting = artifacts.require("./AOAddressSetting.sol");
var AOBytesSetting = artifacts.require("./AOBytesSetting.sol");
var AOStringSetting = artifacts.require("./AOStringSetting.sol");
var AOSetting = artifacts.require("./AOSetting.sol");

// AO and its denominations
var AOToken = artifacts.require("./AOToken.sol");
var AOKilo = artifacts.require("./AOKilo.sol");
var AOMega = artifacts.require("./AOMega.sol");
var AOGiga = artifacts.require("./AOGiga.sol");
var AOTera = artifacts.require("./AOTera.sol");
var AOPeta = artifacts.require("./AOPeta.sol");
var AOExa = artifacts.require("./AOExa.sol");
var AOZetta = artifacts.require("./AOZetta.sol");
var AOYotta = artifacts.require("./AOYotta.sol");
var AOXona = artifacts.require("./AOXona.sol");

// Contracts that interact with AO and its denominations contracts
var AOTreasury = artifacts.require("./AOTreasury.sol");
var AOContent = artifacts.require("./AOContent.sol");
var AOEarning = artifacts.require("./AOEarning.sol");

// AO Pool
var AOPool = artifacts.require("./AOPool.sol");

module.exports = function(deployer, network, accounts) {
	var primordialAccount, settingAccount, primordialNameId, settingNameId, primordialTAOId, settingTAOId;
	if (network === "rinkeby") {
		primordialAccount = "0x16a038099561ac8ad73c497c18207e6c88ff6593";
		settingAccount = "0xd2021e918ed447797fb66c48efa2899ea17dbddb";
	} else {
		primordialAccount = accounts[0];
		settingAccount = accounts[9];
	}

	var aotoken,
		aokilo,
		aomega,
		aogiga,
		aotera,
		aopeta,
		aoexa,
		aozetta,
		aoyotta,
		aoxona,
		aolibrary,
		aoearning,
		aotreasury,
		aocontent,
		aopool,
		logos,
		ethos,
		pathos,
		position,
		namefactory,
		taofactory,
		nametaolookup,
		taoposition,
		aosettingattribute,
		aouintsetting,
		aoboolsetting,
		aoaddresssetting,
		aobytessetting,
		aostringsetting,
		aosetting;

	deployer.deploy(AOLibrary);
	deployer.link(AOLibrary, Pathos);
	deployer.link(AOLibrary, Ethos);
	deployer.link(AOLibrary, Logos);
	deployer.link(AOLibrary, NameFactory);
	deployer.link(AOLibrary, TAOFactory);
	deployer.link(AOLibrary, TAOPosition);
	deployer.link(AOLibrary, AOSetting);
	deployer.link(AOLibrary, AOToken);
	deployer.link(AOLibrary, AOKilo);
	deployer.link(AOLibrary, AOMega);
	deployer.link(AOLibrary, AOGiga);
	deployer.link(AOLibrary, AOTera);
	deployer.link(AOLibrary, AOPeta);
	deployer.link(AOLibrary, AOExa);
	deployer.link(AOLibrary, AOZetta);
	deployer.link(AOLibrary, AOYotta);
	deployer.link(AOLibrary, AOXona);
	deployer.link(AOLibrary, AOContent);
	deployer.link(AOLibrary, AOEarning);

	deployer.deploy([
		[Logos, 0, "Logos", "LOGOS", "logos"],
		[Ethos, 0, "Ethos", "ETHOS", "ethos"],
		[Pathos, 0, "Pathos", "PATHOS", "pathos"],
		[Position, 0, "AO Position", "AOPOS"],
		AOSettingAttribute,
		AOUintSetting,
		AOBoolSetting,
		AOAddressSetting,
		AOBytesSetting,
		AOStringSetting
	]);

	deployer
		.then(async function() {
			aolibrary = await AOLibrary.deployed();
			logos = await Logos.deployed();
			ethos = await Ethos.deployed();
			pathos = await Pathos.deployed();
			position = await Position.deployed();
			aosettingattribute = await AOSettingAttribute.deployed();
			aouintsetting = await AOUintSetting.deployed();
			aoboolsetting = await AOBoolSetting.deployed();
			aoaddresssetting = await AOAddressSetting.deployed();
			aobytessetting = await AOBytesSetting.deployed();
			aostringsetting = await AOStringSetting.deployed();

			return deployer.deploy(NameFactory, position.address);
		})
		.then(async function() {
			namefactory = await NameFactory.deployed();

			// position grant access to namefactory
			await position.setWhitelist(namefactory.address, true, { from: primordialAccount });

			// Deploy TAOFactory, TAOPosition, AOSetting
			return deployer.deploy([
				[TAOFactory, namefactory.address, position.address],
				[TAOPosition, namefactory.address, position.address],
				[
					AOSetting,
					namefactory.address,
					aosettingattribute.address,
					aouintsetting.address,
					aoboolsetting.address,
					aoaddresssetting.address,
					aobytessetting.address,
					aostringsetting.address
				]
			]);
		})
		.then(async function() {
			taofactory = await TAOFactory.deployed();
			taoposition = await TAOPosition.deployed();
			aosetting = await AOSetting.deployed();

			// Set TAOFactory address in NameFactory
			await namefactory.setTAOFactoryAddress(taofactory.address, { from: primordialAccount });

			return deployer.deploy(NameTAOLookup, namefactory.address, taofactory.address);
		})
		.then(async function() {
			nametaolookup = await NameTAOLookup.deployed();

			// Set NameTAOLookup address in NameFactory
			await namefactory.setNameTAOLookupAddress(nametaolookup.address, { from: primordialAccount });

			// Set NameTAOLookup address in TAOFactory
			await taofactory.setNameTAOLookupAddress(nametaolookup.address, { from: primordialAccount });

			/**
			 * Create Primordial Name and Associated Name
			 */
			try {
				var result = await namefactory.createName("alpha", "", "", "", "", {
					from: primordialAccount
				});
				primordialNameId = await namefactory.ethAddressToNameId(primordialAccount);
			} catch (e) {
				console.log("Unable to create Primordial Name", e);
				return;
			}

			try {
				var result = await namefactory.createName("beta", "", "", "", "", {
					from: settingAccount
				});
				settingNameId = await namefactory.ethAddressToNameId(settingAccount);
			} catch (e) {
				console.log("Unable to create Associated Name", e);
				return;
			}

			// position grant access to taoposition
			await position.setWhitelist(taoposition.address, true, { from: primordialAccount });

			/**
			 * Create Primordial TAO and Associated TAO that proposes Content Usage Setting creation
			 */
			try {
				var result = await taofactory.createTAO("Primordial Thought of AO", "", "", "", "", primordialNameId, {
					from: primordialAccount
				});
				var createTAOEvent = result.logs[0];
				primordialTAOId = createTAOEvent.args.taoId;
			} catch (e) {
				console.log("Unable to create Primordial TAO", e);
				return;
			}

			try {
				var result = await taofactory.createTAO("Settings of AO", "", "", "", "", primordialTAOId, {
					from: settingAccount
				});
				var createTAOEvent = result.logs[0];
				settingTAOId = createTAOEvent.args.taoId;
			} catch (e) {
				console.log("Unable to create Associated TAO", e);
				return;
			}

			// Grant access to aosetting
			await aosettingattribute.setWhitelist(aosetting.address, true, { from: primordialAccount });
			await aouintsetting.setWhitelist(aosetting.address, true, { from: primordialAccount });
			await aoboolsetting.setWhitelist(aosetting.address, true, { from: primordialAccount });
			await aoaddresssetting.setWhitelist(aosetting.address, true, { from: primordialAccount });
			await aobytessetting.setWhitelist(aosetting.address, true, { from: primordialAccount });
			await aostringsetting.setWhitelist(aosetting.address, true, { from: primordialAccount });

			/***** Add Settings *****/
			/**
			 * startingPrimordialMultiplier 50 * (1000000) = 50
			 */
			try {
				var result = await aosetting.addUintSetting(
					"startingPrimordialMultiplier",
					50 * 10 ** 6,
					primordialTAOId,
					settingTAOId,
					"",
					{
						from: primordialAccount
					}
				);
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add startingPrimordialMultiplier setting", e);
			}

			/**
			 * endingPrimordialMultiplier 3 * (1000000) = 3
			 */
			try {
				var result = await aosetting.addUintSetting("endingPrimordialMultiplier", 3 * 10 ** 6, primordialTAOId, settingTAOId, "", {
					from: primordialAccount
				});
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add endingPrimordialMultiplier setting", e);
			}

			/**
			 * startingNetworkTokenBonusMultiplier 1000000 = 100%
			 */
			try {
				var result = await aosetting.addUintSetting(
					"startingNetworkTokenBonusMultiplier",
					10 ** 6,
					primordialTAOId,
					settingTAOId,
					"",
					{
						from: primordialAccount
					}
				);
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add startingNetworkTokenBonusMultiplier setting", e);
			}

			/**
			 * endingNetworkTokenBonusMultiplier 250000 = 25%
			 */
			try {
				var result = await aosetting.addUintSetting(
					"endingNetworkTokenBonusMultiplier",
					250000,
					primordialTAOId,
					settingTAOId,
					"",
					{
						from: primordialAccount
					}
				);
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add endingNetworkTokenBonusMultiplier setting", e);
			}

			/**
			 * Inflation Rate 1%
			 */
			try {
				var result = await aosetting.addUintSetting("inflationRate", 10000, primordialTAOId, settingTAOId, "", {
					from: primordialAccount
				});
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add inflationRate setting", e);
			}

			/**
			 * The AO Cut 0%
			 */
			try {
				var result = await aosetting.addUintSetting("theAOCut", 0, primordialTAOId, settingTAOId, "", {
					from: primordialAccount
				});
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add theAOCut setting", e);
			}

			/**
			 * The AO Ethos Earned Rate = 100%
			 */
			try {
				var result = await aosetting.addUintSetting("theAOEthosEarnedRate", 10 ** 6, primordialTAOId, settingTAOId, "", {
					from: primordialAccount
				});
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add theAOEthosEarnedRate setting", e);
			}

			/**
			 * Content Usage Type AO Content = AO Content
			 */
			try {
				var result = await aosetting.addBytesSetting(
					"contentUsageType_aoContent",
					"AO Content",
					primordialTAOId,
					settingTAOId,
					"",
					{
						from: primordialAccount
					}
				);
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add contentUsageType_aoContent setting", e);
			}

			/**
			 * Content Usage Type Creative Commons = Creative Commons
			 */
			try {
				var result = await aosetting.addBytesSetting(
					"contentUsageType_creativeCommons",
					"Creative Commons",
					primordialTAOId,
					settingTAOId,
					"",
					{
						from: primordialAccount
					}
				);
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add contentUsageType_creativeCommons setting", e);
			}

			/**
			 * Content Usage Type TAO Content = T(AO) Content
			 */
			try {
				var result = await aosetting.addBytesSetting(
					"contentUsageType_taoContent",
					"T(AO) Content",
					primordialTAOId,
					settingTAOId,
					"",
					{
						from: primordialAccount
					}
				);
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add contentUsageType_taoContent setting", e);
			}

			/**
			 * TAO Content State Submitted = Submitted
			 */
			try {
				var result = await aosetting.addBytesSetting("taoContentState_submitted", "Submitted", primordialTAOId, settingTAOId, "", {
					from: primordialAccount
				});
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add taoContentState_submitted setting", e);
			}

			/**
			 * TAO Content State Pending Review = Pending Review
			 */
			try {
				var result = await aosetting.addBytesSetting(
					"taoContentState_pendingReview",
					"Pending Review",
					primordialTAOId,
					settingTAOId,
					"",
					{
						from: primordialAccount
					}
				);
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add taoContentState_pendingReview setting", e);
			}

			/**
			 * TAO Content State Accepted to TAO = Accepted to TAO
			 */
			try {
				var result = await aosetting.addBytesSetting(
					"taoContentState_acceptedToTAO",
					"Accepted to TAO",
					primordialTAOId,
					settingTAOId,
					"",
					{
						from: primordialAccount
					}
				);
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add taoContentState_acceptedToTAO setting", e);
			}

			/**
			 * ingressUrl = https://www.ingress.one
			 */
			try {
				var result = await aosetting.addStringSetting("ingressUrl", "https://www.ingress.one", primordialTAOId, settingTAOId, "", {
					from: primordialAccount
				});
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add ingressUrl setting", e);
			}

			/**
			 * developerUrl = https://gitlab.paramation.com/AO-core/aodb
			 */
			try {
				var result = await aosetting.addStringSetting(
					"developerUrl",
					"https://gitlab.paramation.com/AO-core/aodb",
					primordialTAOId,
					settingTAOId,
					"",
					{
						from: primordialAccount
					}
				);
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add developerUrl setting", e);
			}

			/**
			 * aoUrl = ao.network
			 */
			try {
				var result = await aosetting.addStringSetting("aoUrl", "https://ao.network", primordialTAOId, settingTAOId, "", {
					from: primordialAccount
				});
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add aoUrl setting", e);
			}

			/**
			 * taoDbKey = b9b874b28cc2792b0becdf2c40c9254f874be3efa1a48cd61903fb62e883f271
			 */
			try {
				var result = await aosetting.addStringSetting(
					"taoDbKey",
					"b9b874b28cc2792b0becdf2c40c9254f874be3efa1a48cd61903fb62e883f271",
					primordialTAOId,
					settingTAOId,
					"",
					{
						from: primordialAccount
					}
				);
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add taoDbKey setting", e);
			}

			/**
			 * createChildTAOMinLogos 1Giga = 10 ^^ 9
			 */
			try {
				var result = await aosetting.addUintSetting("createChildTAOMinLogos", 10 ** 9, primordialTAOId, settingTAOId, "", {
					from: primordialAccount
				});
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add createChildTAOMinLogos setting", e);
			}

			// Deploy AOToken and all of the denominations
			return deployer.deploy([
				[AOToken, 0, "AO Token", "AOTKN", settingTAOId, aosetting.address],
				[AOKilo, 0, "AO Kilo", "AOKILO", settingTAOId, aosetting.address],
				[AOMega, 0, "AO Mega", "AOMEGA", settingTAOId, aosetting.address],
				[AOGiga, 0, "AO Giga", "AOGIGA", settingTAOId, aosetting.address],
				[AOTera, 0, "AO Tera", "AOTERA", settingTAOId, aosetting.address],
				[AOPeta, 0, "AO Peta", "AOPETA", settingTAOId, aosetting.address],
				[AOExa, 0, "AO Exa", "AOEXA", settingTAOId, aosetting.address],
				[AOZetta, 0, "AO Zetta", "AOZETTA", settingTAOId, aosetting.address],
				[AOYotta, 0, "AO Yotta", "AOYOTTA", settingTAOId, aosetting.address],
				[AOXona, 0, "AO Xona", "AOXONA", settingTAOId, aosetting.address],
				AOTreasury
			]);
		})
		.then(async function() {
			aotoken = await AOToken.deployed();
			aokilo = await AOKilo.deployed();
			aomega = await AOMega.deployed();
			aogiga = await AOGiga.deployed();
			aotera = await AOTera.deployed();
			aopeta = await AOPeta.deployed();
			aoexa = await AOExa.deployed();
			aozetta = await AOZetta.deployed();
			aoyotta = await AOYotta.deployed();
			aoxona = await AOXona.deployed();
			aotreasury = await AOTreasury.deployed();

			// Store AO denominations in the treasury contract
			await aotreasury.addDenomination("ao", aotoken.address, { from: primordialAccount });
			await aotreasury.addDenomination("kilo", aokilo.address, { from: primordialAccount });
			await aotreasury.addDenomination("mega", aomega.address, { from: primordialAccount });
			await aotreasury.addDenomination("giga", aogiga.address, { from: primordialAccount });
			await aotreasury.addDenomination("tera", aotera.address, { from: primordialAccount });
			await aotreasury.addDenomination("peta", aopeta.address, { from: primordialAccount });
			await aotreasury.addDenomination("exa", aoexa.address, { from: primordialAccount });
			await aotreasury.addDenomination("zetta", aozetta.address, { from: primordialAccount });
			await aotreasury.addDenomination("yotta", aoyotta.address, { from: primordialAccount });
			await aotreasury.addDenomination("xona", aoxona.address, { from: primordialAccount });

			// Grant access to aotreasury to transact on behalf of others on all AO Tokens denominations
			await aotoken.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aokilo.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aomega.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aogiga.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aotera.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aopeta.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aoexa.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aozetta.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aoyotta.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aoxona.setWhitelist(aotreasury.address, true, { from: primordialAccount });

			return deployer.deploy([
				[AOPool, aotoken.address],
				[
					AOEarning,
					settingTAOId,
					aosetting.address,
					aotoken.address,
					aotreasury.address,
					namefactory.address,
					pathos.address,
					ethos.address
				]
			]);
		})
		.then(async function() {
			aopool = await AOPool.deployed();
			aoearning = await AOEarning.deployed();

			// Grant access to aopool to transact on behalf of others on base denomination
			await aotoken.setWhitelist(aopool.address, true, { from: primordialAccount });

			// Create test pools for testing exchanges
			// Pool #1
			// price: 10000
			// status: true (active)
			// sellCapStatus: no
			// quantityCapStatus: no
			// erc20CounterAsset: false (priced in Eth)
			await aopool.createPool(10000, true, false, "", false, "", false, "", "", { from: primordialAccount });

			// Pool #2
			// price: 10000
			// status: true (active)
			// sellCapStatus: yes
			// sellCapAmount: 10000000
			// quantityCapStatus: no
			// erc20CounterAsset: false (priced in Eth)
			await aopool.createPool(10000, true, true, 10000000, false, "", false, "", "", { from: primordialAccount });

			// Pool #3
			// price: 10000
			// status: true (active)
			// sellCapStatus: no
			// quantityCapStatus: yes
			// quantityCapAmount: 5000
			// erc20CounterAsset: false (priced in Eth)
			await aopool.createPool(10000, true, false, "", true, 5000, false, "", "", { from: primordialAccount });

			// Pool #4
			// price: 10000
			// status: true (active)
			// sellCapStatus: yes
			// sellCapAmount: 10000000
			// quantityCapStatus: yes
			// quantityCapAmount: 5000
			// erc20CounterAsset: false (priced in Eth)
			await aopool.createPool(10000, true, true, 10000000, true, 5000, false, "", "", { from: primordialAccount });

			// Pool #5
			// price: 10000
			// status: false (inactive)
			// sellCapStatus: yes
			// sellCapAmount: 10000000
			// quantityCapStatus: yes
			// quantityCapAmount: 5000
			// erc20CounterAsset: false (priced in Eth)
			await aopool.createPool(10000, false, true, 10000000, true, 5000, false, "", "", { from: primordialAccount });

			// Grant access to aoearning to transact on behalf of others on base denomination
			await aotoken.setWhitelist(aoearning.address, true, { from: primordialAccount });

			// pathos grant access to aoearning
			await pathos.setWhitelist(aoearning.address, true, { from: primordialAccount });

			// ethos grant access to aoearning
			await ethos.setWhitelist(aoearning.address, true, { from: primordialAccount });

			return deployer.deploy(
				AOContent,
				settingTAOId,
				aosetting.address,
				aotoken.address,
				aotreasury.address,
				aoearning.address,
				namefactory.address
			);
		})
		.then(async function() {
			aocontent = await AOContent.deployed();

			// Grant access to aocontent to transact on behalf of others on all AO Tokens denominations
			await aotoken.setWhitelist(aocontent.address, true, { from: primordialAccount });

			// aoearning grant access to aocontent
			await aoearning.setWhitelist(aocontent.address, true, { from: primordialAccount });

			console.log("Primordial TAO ID", primordialTAOId);
			console.log("Setting TAO ID", settingTAOId);
		});
};
