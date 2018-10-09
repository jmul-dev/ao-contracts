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

var AOEarning = artifacts.require("./AOEarning.sol");

// Contracts that interact with AO and its denominations contracts
var AOTreasury = artifacts.require("./AOTreasury.sol");
var AOContent = artifacts.require("./AOContent.sol");

var AOPool = artifacts.require("./AOPool.sol");

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
		aopool;
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
		AOTreasury
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
			return deployer.deploy(AOEarning, aotoken.address, aotreasury.address);
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
		});
};
