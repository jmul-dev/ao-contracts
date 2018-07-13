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

var AOLot = artifacts.require("./AOLot.sol");

var AOBank = artifacts.require("./AOBank.sol");

module.exports = function(deployer) {
	deployer.deploy(AOToken, 0, "AO Token", "AOTKN").then(function() {
		return deployer.deploy(AOLot, AOToken.address);
	});
	deployer.deploy(AOKilo, 0, "AO Kilo", "AOKILO");
	deployer.deploy(AOMega, 0, "AO Mega", "AOMEGA");
	deployer.deploy(AOGiga, 0, "AO Giga", "AOGIGA");
	deployer.deploy(AOTera, 0, "AO Tera", "AOTERA");
	deployer.deploy(AOPeta, 0, "AO Peta", "AOPETA");
	deployer.deploy(AOExa, 0, "AO Exa", "AOEXA");
	deployer.deploy(AOZetta, 0, "AO Zetta", "AOZETTA");
	deployer.deploy(AOYotta, 0, "AO Yotta", "AOYOTTA");
	deployer.deploy(AOXona, 0, "AO Xona", "AOXONA");
	deployer.deploy(AOBank);
};
