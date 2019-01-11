var AOLibrary = artifacts.require("./AOLibrary.sol");
var Epiphany = artifacts.require("./Epiphany.sol");

module.exports = function(deployer) {
	deployer.deploy(AOLibrary);
	deployer.link(AOLibrary, Epiphany);
	deployer.deploy(Epiphany, { overwrite: false });
};
