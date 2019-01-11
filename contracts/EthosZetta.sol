pragma solidity ^0.4.24;

import "./Ethos.sol";

contract EthosZetta is Ethos {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol, address _nameTAOPositionAddress)
		Ethos(initialSupply, tokenName, tokenSymbol, _nameTAOPositionAddress) public {
		powerOfTen = 21;
		decimals = 21;
	}
}