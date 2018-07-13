var AOToken = artifacts.require("./AOToken.sol");
var AOLot = artifacts.require("./AOLot.sol");

module.exports = function(deployer) {
	deployer.deploy(AOToken, 0, "AO Token", "AOTKN").then(function() {
		return deployer.deploy(AOLot, AOToken.address);
	});
};
