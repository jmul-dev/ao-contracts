var AOToken = artifacts.require("./AOToken.sol");

module.exports = function(deployer) {
	deployer.deploy(AOToken, "AO NFT", "AONFT");
};
