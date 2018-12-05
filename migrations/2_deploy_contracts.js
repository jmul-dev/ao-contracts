var AOLibrary = artifacts.require("./AOLibrary.sol");

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

// Thought Currencies
var Logos = artifacts.require("./Logos.sol");
var Ethos = artifacts.require("./Ethos.sol");
var Pathos = artifacts.require("./Pathos.sol");
var AntiLogos = artifacts.require("./AntiLogos.sol");
var AntiEthos = artifacts.require("./AntiEthos.sol");
var AntiPathos = artifacts.require("./AntiPathos.sol");

var Position = artifacts.require("./Position.sol");
var NameFactory = artifacts.require("./NameFactory.sol");
var ThoughtFactory = artifacts.require("./ThoughtFactory.sol");
var ThoughtPosition = artifacts.require("./ThoughtPosition.sol");

var AOPool = artifacts.require("./AOPool.sol");
var AOSettingAttribute = artifacts.require("./AOSettingAttribute.sol");
var AOUintSetting = artifacts.require("./AOUintSetting.sol");
var AOBoolSetting = artifacts.require("./AOBoolSetting.sol");
var AOAddressSetting = artifacts.require("./AOAddressSetting.sol");
var AOBytesSetting = artifacts.require("./AOBytesSetting.sol");
var AOStringSetting = artifacts.require("./AOStringSetting.sol");
var AOSetting = artifacts.require("./AOSetting.sol");

module.exports = function(deployer, network, accounts) {
	var primordialAccount, associatedAccount, primordialNameId, associatedNameId, primordialThoughtId, associatedThoughtId;
	if (network === "rinkeby") {
		primordialAccount = "0xcccf4699bbdcf30c8f310d19f5e07c8098665f18";
		associatedAccount = "0xd2021e918ed447797fb66c48efa2899ea17dbddb";
	} else {
		primordialAccount = accounts[0];
		associatedAccount = accounts[9];
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
	deployer.link(AOLibrary, AOSetting);

	deployer.deploy([
		[AOToken, 0, "AO Token", "AOTKN"],
		[AOKilo, 0, "AO Kilo", "AOKILO"],
		[AOMega, 0, "AO Mega", "AOMEGA"],
		[AOGiga, 0, "AO Giga", "AOGIGA"],
		[AOTera, 0, "AO Tera", "AOTERA"],
		[AOPeta, 0, "AO Peta", "AOPETA"],
		[AOExa, 0, "AO Exa", "AOEXA"],
		[AOZetta, 0, "AO Zetta", "AOZETTA"],
		[AOYotta, 0, "AO Yotta", "AOYOTTA"],
		[AOXona, 0, "AO Xona", "AOXONA"],
		AOTreasury,
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

			return deployer.deploy(NameFactory, position.address);
		})
		.then(async function() {
			namefactory = await NameFactory.deployed();

			// position grant access to namefactory
			await position.setWhitelist(namefactory.address, true, { from: primordialAccount });

			return deployer.deploy(ThoughtFactory, namefactory.address, position.address);
		})
		.then(async function() {
			thoughtfactory = await ThoughtFactory.deployed();

			return deployer.deploy(ThoughtPosition, namefactory.address, position.address);
		})
		.then(async function() {
			thoughtposition = await ThoughtPosition.deployed();

			// position grant access to thoughtposition
			await position.setWhitelist(thoughtposition.address, true, { from: primordialAccount });

			return deployer.deploy(AOEarning, aotoken.address, aotreasury.address, pathos.address, antilogos.address);
		})
		.then(async function() {
			aoearning = await AOEarning.deployed();

			// Grant access to aoearning to transact on behalf of others on base denomination
			await aotoken.setWhitelist(aoearning.address, true, { from: primordialAccount });

			// pathos grant access to aoearning
			await pathos.setWhitelist(aoearning.address, true, { from: primordialAccount });

			// antilogos grant access to aoearning
			await antilogos.setWhitelist(aoearning.address, true, { from: primordialAccount });

			// set inflation rate and foundation cut
			await aoearning.setInflationRate(10000, { from: primordialAccount }); // inflation rate 1%
			await aoearning.setFoundationCut(5000, { from: primordialAccount }); // foundation cut 0.5%

			return deployer.deploy(AOPool, aotoken.address);
		})
		.then(async function() {
			aopool = await AOPool.deployed();

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
					from: associatedAccount
				});
				associatedNameId = await namefactory.ethAddressToNameId(associatedAccount);
			} catch (e) {
				console.log("Unable to create Associated Name", e);
				return;
			}

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
					from: associatedAccount
				});
				var createThoughtEvent = result.logs[0];
				associatedThoughtId = createThoughtEvent.args.thoughtId;
			} catch (e) {
				console.log("Unable to create Associated Thought", e);
				return;
			}

			return deployer.deploy(
				AOSetting,
				namefactory.address,
				aosettingattribute.address,
				aouintsetting.address,
				aoboolsetting.address,
				aoaddresssetting.address,
				aobytessetting.address,
				aostringsetting.address
			);
		})
		.then(async function() {
			aosetting = await AOSetting.deployed();

			// Grant access to aosetting
			await aosettingattribute.setWhitelist(aosetting.address, true, { from: primordialAccount });
			await aouintsetting.setWhitelist(aosetting.address, true, { from: primordialAccount });
			await aoboolsetting.setWhitelist(aosetting.address, true, { from: primordialAccount });
			await aoaddresssetting.setWhitelist(aosetting.address, true, { from: primordialAccount });
			await aobytessetting.setWhitelist(aosetting.address, true, { from: primordialAccount });
			await aostringsetting.setWhitelist(aosetting.address, true, { from: primordialAccount });

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
