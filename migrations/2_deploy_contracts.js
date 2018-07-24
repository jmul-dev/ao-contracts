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

module.exports = function(deployer, network, accounts) {
	var aotoken, aokilo, aomega, aogiga, aotera, aopeta, aoexa, aozetta, aoyotta, aoxona, aotreasury;
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

	deployer.then(async function() {
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
		await aotreasury.addDenomination("kilo", aokilo.address, {from: accounts[0]});
		await aotreasury.addDenomination("mega", aomega.address, {from: accounts[0]});
		await aotreasury.addDenomination("giga", aogiga.address, {from: accounts[0]});
		await aotreasury.addDenomination("tera", aotera.address, {from: accounts[0]});
		await aotreasury.addDenomination("peta", aopeta.address, {from: accounts[0]});
		await aotreasury.addDenomination("exa", aoexa.address, {from: accounts[0]});
		await aotreasury.addDenomination("zetta", aozetta.address, {from: accounts[0]});
		await aotreasury.addDenomination("yotta", aoyotta.address, {from: accounts[0]});
		await aotreasury.addDenomination("xona", aoxona.address, {from: accounts[0]});
	});
};
