var AONFT = artifacts.require("./AONFT.sol");

module.exports = function(deployer) {
	deployer.deploy(AONFT, "AO NFT", "AONFT");
};
