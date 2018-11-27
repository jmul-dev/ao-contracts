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
var AOSettingDataState = artifacts.require("./AOSettingDataState.sol");
var AOUintSetting = artifacts.require("./AOUintSetting.sol");
var AOBoolSetting = artifacts.require("./AOBoolSetting.sol");
var AOAddressSetting = artifacts.require("./AOAddressSetting.sol");
var AOBytesSetting = artifacts.require("./AOBytesSetting.sol");
var AOStringSetting = artifacts.require("./AOStringSetting.sol");
var AOSetting = artifacts.require("./AOSetting.sol");

module.exports = function(deployer, network, accounts) {
	var deployerAccount;
	if (network === "rinkeby") {
		deployerAccount = "0xcccf4699bbdcf30c8f310d19f5e07c8098665f18";
	} else {
		deployerAccount = accounts[0];
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
		aosettingdatastate,
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
		AOSettingDataState,
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
			aosettingdatastate = await AOSettingDataState.deployed();
			aouintsetting = await AOUintSetting.deployed();
			aoboolsetting = await AOBoolSetting.deployed();
			aoaddresssetting = await AOAddressSetting.deployed();
			aobytessetting = await AOBytesSetting.deployed();
			aostringsetting = await AOStringSetting.deployed();
			return deployer.deploy(NameFactory, position.address);
		})
		.then(async function() {
			namefactory = await NameFactory.deployed();
			return deployer.deploy(
				AOSetting,
				namefactory.address,
				aosettingdatastate.address,
				aouintsetting.address,
				aoboolsetting.addres,
				aoaddresssetting.address,
				aobytessetting.address,
				aostringsetting.address
			);
		})
		.then(async function() {
			aosetting = await AOSetting.deployed();
			return deployer.deploy(ThoughtFactory, namefactory.address, position.address);
		})
		.then(async function() {
			thoughtfactory = await ThoughtFactory.deployed();
			return deployer.deploy(ThoughtPosition, namefactory.address, position.address);
		})
		.then(async function() {
			thoughtposition = await ThoughtPosition.deployed();
			return deployer.deploy(AOEarning, aotoken.address, aotreasury.address, pathos.address, antilogos.address);
		})
		.then(async function() {
			aoearning = await AOEarning.deployed();
			return deployer.deploy(AOContent, aotoken.address, aotreasury.address, aoearning.address);
		})
		.then(async function() {
			aocontent = await AOContent.deployed();
			return deployer.deploy(AOPool, aotoken.address);
		})
		.then(async function() {
			aopool = await AOPool.deployed();

			// Store AO denominations in the treasury contract
			await aotreasury.addDenomination("ao", aotoken.address, { from: deployerAccount });
			await aotreasury.addDenomination("kilo", aokilo.address, { from: deployerAccount });
			await aotreasury.addDenomination("mega", aomega.address, { from: deployerAccount });
			await aotreasury.addDenomination("giga", aogiga.address, { from: deployerAccount });
			await aotreasury.addDenomination("tera", aotera.address, { from: deployerAccount });
			await aotreasury.addDenomination("peta", aopeta.address, { from: deployerAccount });
			await aotreasury.addDenomination("exa", aoexa.address, { from: deployerAccount });
			await aotreasury.addDenomination("zetta", aozetta.address, { from: deployerAccount });
			await aotreasury.addDenomination("yotta", aoyotta.address, { from: deployerAccount });
			await aotreasury.addDenomination("xona", aoxona.address, { from: deployerAccount });

			// Grant access to aocontent to transact on behalf of others on all AO Tokens denominations
			await aotoken.setWhitelist(aocontent.address, true, { from: deployerAccount });

			// Grant access to aotreasury to transact on behalf of others on all AO Tokens denominations
			await aotoken.setWhitelist(aotreasury.address, true, { from: deployerAccount });
			await aokilo.setWhitelist(aotreasury.address, true, { from: deployerAccount });
			await aomega.setWhitelist(aotreasury.address, true, { from: deployerAccount });
			await aogiga.setWhitelist(aotreasury.address, true, { from: deployerAccount });
			await aotera.setWhitelist(aotreasury.address, true, { from: deployerAccount });
			await aopeta.setWhitelist(aotreasury.address, true, { from: deployerAccount });
			await aoexa.setWhitelist(aotreasury.address, true, { from: deployerAccount });
			await aozetta.setWhitelist(aotreasury.address, true, { from: deployerAccount });
			await aoyotta.setWhitelist(aotreasury.address, true, { from: deployerAccount });
			await aoxona.setWhitelist(aotreasury.address, true, { from: deployerAccount });

			// Grant access to aoearning to transact on behalf of others on base denomination
			await aotoken.setWhitelist(aoearning.address, true, { from: deployerAccount });

			// aoearning grant access to aocontent
			await aoearning.setWhitelist(aocontent.address, true, { from: deployerAccount });

			// set inflation rate and foundation cut
			await aoearning.setInflationRate(10000, { from: deployerAccount }); // inflation rate 1%
			await aoearning.setFoundationCut(5000, { from: deployerAccount }); // foundation cut 0.5%

			// Grant access to aopool to transact on behalf of others on base denomination
			await aotoken.setWhitelist(aopool.address, true, { from: deployerAccount });

			// Create test pools for testing exchanges
			// Pool #1
			// price: 10000
			// status: true (active)
			// sellCapStatus: no
			// quantityCapStatus: no
			// erc20CounterAsset: false (priced in Eth)
			await aopool.createPool(10000, true, false, "", false, "", false, "", "", { from: deployerAccount });

			// Pool #2
			// price: 10000
			// status: true (active)
			// sellCapStatus: yes
			// sellCapAmount: 10000000
			// quantityCapStatus: no
			// erc20CounterAsset: false (priced in Eth)
			await aopool.createPool(10000, true, true, 10000000, false, "", false, "", "", { from: deployerAccount });

			// Pool #3
			// price: 10000
			// status: true (active)
			// sellCapStatus: no
			// quantityCapStatus: yes
			// quantityCapAmount: 5000
			// erc20CounterAsset: false (priced in Eth)
			await aopool.createPool(10000, true, false, "", true, 5000, false, "", "", { from: deployerAccount });

			// Pool #4
			// price: 10000
			// status: true (active)
			// sellCapStatus: yes
			// sellCapAmount: 10000000
			// quantityCapStatus: yes
			// quantityCapAmount: 5000
			// erc20CounterAsset: false (priced in Eth)
			await aopool.createPool(10000, true, true, 10000000, true, 5000, false, "", "", { from: deployerAccount });

			// Pool #5
			// price: 10000
			// status: false (inactive)
			// sellCapStatus: yes
			// sellCapAmount: 10000000
			// quantityCapStatus: yes
			// quantityCapAmount: 5000
			// erc20CounterAsset: false (priced in Eth)
			await aopool.createPool(10000, false, true, 10000000, true, 5000, false, "", "", { from: deployerAccount });

			// pathos grant access to aoearning
			await pathos.setWhitelist(aoearning.address, true, { from: deployerAccount });

			// antilogos grant access to aoearning
			await antilogos.setWhitelist(aoearning.address, true, { from: deployerAccount });

			// position grant access to namefactory and thoughtposition
			await position.setWhitelist(namefactory.address, true, { from: deployerAccount });
			await position.setWhitelist(thoughtposition.address, true, { from: deployerAccount });

			// Grant access to aosetting
			await aosettingdatastate.setWhitelist(aosetting.address, true, { from: deployerAccount });
			await aouintsetting.setWhitelist(aosetting.address, true, { from: deployerAccount });
			await aoboolsetting.setWhitelist(aosetting.address, true, { from: deployerAccount });
			await aoaddresssetting.setWhitelist(aosetting.address, true, { from: deployerAccount });
			await aobytessetting.setWhitelist(aosetting.address, true, { from: deployerAccount });
			await aostringsetting.setWhitelist(aosetting.address, true, { from: deployerAccount });

			/*
			// create Primordial Name for the deployerAccount
			await namefactory.createName("alpha", "", "", "", "", { from: deployerAccount });

			var primordialNameId = await nameFactory.ethAddressToNameId(deployerAccount);

			// create Primordial Thought
			await thoughtFactory.createThought("somehash", "somedatabase", "somekeyvalue", "", primordialNameId, { from: deployerAccount});
			*/
		});
};
