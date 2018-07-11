pragma solidity ^0.4.24;

import "./AOToken.sol";

contract PetaAOToken is AOToken {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol)
		AOToken(initialSupply, tokenName, tokenSymbol) public {
		power = 15;
	}
}
