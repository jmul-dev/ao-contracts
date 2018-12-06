var AOLibrary = artifacts.require("./AOLibrary.sol");

// Thought Currencies
var Logos = artifacts.require("./Logos.sol");
var Ethos = artifacts.require("./Ethos.sol");
var Pathos = artifacts.require("./Pathos.sol");
var AntiLogos = artifacts.require("./AntiLogos.sol");
var AntiEthos = artifacts.require("./AntiEthos.sol");
var AntiPathos = artifacts.require("./AntiPathos.sol");

// Name/Thought Contracts
var Position = artifacts.require("./Position.sol");
var NameFactory = artifacts.require("./NameFactory.sol");
var ThoughtFactory = artifacts.require("./ThoughtFactory.sol");
var ThoughtPosition = artifacts.require("./ThoughtPosition.sol");

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
	var primordialAccount, settingAccount, primordialNameId, settingNameId, primordialThoughtId, settingThoughtId;
	if (network === "rinkeby") {
		primordialAccount = "0xcccf4699bbdcf30c8f310d19f5e07c8098665f18";
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
		antilogos,
		antiethos,
		antipathos,
		position,
		namefactory,
		thoughtfactory,
		thoughtposition,
		aosettingattribute,
		aouintsetting,
		aoboolsetting,
		aoaddresssetting,
		aobytessetting,
		aostringsetting,
		aosetting;

	deployer.deploy(AOLibrary);
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

	deployer.deploy([
		[Logos, 0, "Logos", "LOGOS", "logos"],
		[Ethos, 0, "Ethos", "ETHOS", "ethos"],
		[Pathos, 0, "Pathos", "PATHOS", "antipathos"],
		[AntiLogos, 0, "Anti Logos", "ALOGOS", "antilogos"],
		[AntiEthos, 0, "Anti Ethos", "AETHOS", "antiethos"],
		[AntiPathos, 0, "Anti Pathos", "APATHOS", "antipathos"],
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
			antilogos = await AntiLogos.deployed();
			antiethos = await AntiEthos.deployed();
			antipathos = await AntiPathos.deployed();
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

			// Deploy ThoughtFactory, ThoughtPosition, AOSetting
			return deployer.deploy([
				[ThoughtFactory, namefactory.address, position.address],
				[ThoughtPosition, namefactory.address, position.address],
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
			thoughtfactory = await ThoughtFactory.deployed();
			thoughtposition = await ThoughtPosition.deployed();
			aosetting = await AOSetting.deployed();

			// position grant access to thoughtposition
			await position.setWhitelist(thoughtposition.address, true, { from: primordialAccount });

			/**
			 * Create Primordial Thought and Associated Thought that proposes Content Usage Setting creation
			 */
			try {
				var result = await thoughtfactory.createThought("", "", "", "", primordialNameId, {
					from: primordialAccount
				});
				var createThoughtEvent = result.logs[0];
				primordialThoughtId = createThoughtEvent.args.thoughtId;
			} catch (e) {
				console.log("Unable to create Primordial Thought", e);
				return;
			}

			try {
				var result = await thoughtfactory.createThought("", "", "", "", primordialThoughtId, {
					from: settingAccount
				});
				var createThoughtEvent = result.logs[0];
				settingThoughtId = createThoughtEvent.args.thoughtId;
			} catch (e) {
				console.log("Unable to create Associated Thought", e);
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
			 * Inflation Rate 1%
			 */
			try {
				var result = await aosetting.addUintSetting("inflationRate", 10000, primordialThoughtId, settingThoughtId, "", {
					from: primordialAccount
				});
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add inflationRate setting", e);
			}

			/**
			 * Foundation Cut 0.5%
			 */
			try {
				var result = await aosetting.addUintSetting("foundationCut", 5000, primordialThoughtId, settingThoughtId, "", {
					from: primordialAccount
				});
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add foundationCut setting", e);
			}

			/**
			 * PERCENTAGE_DIVISOR 100% = 1000000
			 */
			try {
				var result = await aosetting.addUintSetting("PERCENTAGE_DIVISOR", 10 ** 6, primordialThoughtId, settingThoughtId, "", {
					from: primordialAccount
				});
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add PERCENTAGE_DIVISOR setting", e);
			}

			/**
			 * MULTIPLIER_DIVISOR 1000000 = 1
			 */
			try {
				var result = await aosetting.addUintSetting("MULTIPLIER_DIVISOR", 10 ** 6, primordialThoughtId, settingThoughtId, "", {
					from: primordialAccount
				});
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add MULTIPLIER_DIVISOR setting", e);
			}

			/**
			 * TOTAL_PRIMORDIAL_FOR_SALE 1125899906842620
			 */
			try {
				var result = await aosetting.addUintSetting(
					"TOTAL_PRIMORDIAL_FOR_SALE",
					1125899906842620,
					primordialThoughtId,
					settingThoughtId,
					"",
					{
						from: primordialAccount
					}
				);
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add TOTAL_PRIMORDIAL_FOR_SALE setting", e);
			}

			/**
			 * startingPrimordialMultiplier 50 * MULTIPLIER_DIVISOR = 50
			 */
			try {
				var result = await aosetting.addUintSetting(
					"startingPrimordialMultiplier",
					50 * 10 ** 6,
					primordialThoughtId,
					settingThoughtId,
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
			 * endingPrimordialMultiplier 3 * MULTIPLIER_DIVISOR = 3
			 */
			try {
				var result = await aosetting.addUintSetting(
					"endingPrimordialMultiplier",
					3 * 10 ** 6,
					primordialThoughtId,
					settingThoughtId,
					"",
					{
						from: primordialAccount
					}
				);
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
					primordialThoughtId,
					settingThoughtId,
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
					primordialThoughtId,
					settingThoughtId,
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

			// Deploy AOToken and all of the denominations
			return deployer.deploy([
				[AOToken, 0, "AO Token", "AOTKN", settingThoughtId, aosetting.address],
				[AOKilo, 0, "AO Kilo", "AOKILO", settingThoughtId, aosetting.address],
				[AOMega, 0, "AO Mega", "AOMEGA", settingThoughtId, aosetting.address],
				[AOGiga, 0, "AO Giga", "AOGIGA", settingThoughtId, aosetting.address],
				[AOTera, 0, "AO Tera", "AOTERA", settingThoughtId, aosetting.address],
				[AOPeta, 0, "AO Peta", "AOPETA", settingThoughtId, aosetting.address],
				[AOExa, 0, "AO Exa", "AOEXA", settingThoughtId, aosetting.address],
				[AOZetta, 0, "AO Zetta", "AOZETTA", settingThoughtId, aosetting.address],
				[AOYotta, 0, "AO Yotta", "AOYOTTA", settingThoughtId, aosetting.address],
				[AOXona, 0, "AO Xona", "AOXONA", settingThoughtId, aosetting.address],
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
				[AOEarning, settingThoughtId, aosetting.address, aotoken.address, aotreasury.address, pathos.address, antilogos.address]
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

			// antilogos grant access to aoearning
			await antilogos.setWhitelist(aoearning.address, true, { from: primordialAccount });

			return deployer.deploy(AOContent, aotoken.address, aotreasury.address, aoearning.address);
		})
		.then(async function() {
			aocontent = await AOContent.deployed();

			// Grant access to aocontent to transact on behalf of others on all AO Tokens denominations
			await aotoken.setWhitelist(aocontent.address, true, { from: primordialAccount });

			// aoearning grant access to aocontent
			await aoearning.setWhitelist(aocontent.address, true, { from: primordialAccount });
		});
};
