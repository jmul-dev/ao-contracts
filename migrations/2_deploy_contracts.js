var AONFT = artifacts.require("./AONFT.sol");
var AOToken = artifacts.require("./AOToken.sol");
var DecaAOToken = artifacts.require("./DecaAOToken.sol");
var KiloAOToken = artifacts.require("./KiloAOToken.sol");
var MegaAOToken = artifacts.require("./MegaAOToken.sol");
var GigaAOToken = artifacts.require("./GigaAOToken.sol");
var TeraAOToken = artifacts.require("./TeraAOToken.sol");
var PetaAOToken = artifacts.require("./PetaAOToken.sol");
var ExaAOToken = artifacts.require("./ExaAOToken.sol");
var ZettaAOToken = artifacts.require("./ZettaAOToken.sol");
var YottaAOToken = artifacts.require("./YottaAOToken.sol");

module.exports = function(deployer) {
	deployer.deploy(AONFT, "AO NFT", "AONFT");
	deployer.deploy(AOToken, 0, "AO Token", "AO");
	deployer.deploy(DecaAOToken, 0, "Deca AO Token", "AODECA");
	deployer.deploy(KiloAOToken, 0, "Kilo AO Token", "AOKILO");
	deployer.deploy(MegaAOToken, 0, "Mega AO Token", "AOMEGA");
	deployer.deploy(GigaAOToken, 0, "Giga AO Token", "AOGIGA");
	deployer.deploy(TeraAOToken, 0, "Tera AO Token", "AOTERA");
	deployer.deploy(PetaAOToken, 0, "Peta AO Token", "AOPETA");
	deployer.deploy(ExaAOToken, 0, "Exa AO Token", "AOEXA");
	deployer.deploy(ZettaAOToken, 0, "Zetta AO Token", "AOZETTA");
	deployer.deploy(YottaAOToken, 0, "Yotta AO Token", "AOYOTTA");
};
