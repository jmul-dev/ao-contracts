var AOToken = artifacts.require("./AOToken.sol");
var AOTokenICO = artifacts.require("./AOTokenICO.sol");

module.exports = function(deployer) {
	deployer.deploy(AOToken, 125899906842620, "AO Token", "AOTKN").then(function() {
		return deployer.deploy(AOTokenICO, AOToken.address);
	});
};
