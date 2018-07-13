pragma solidity ^0.4.24;

import "./MyAdvancedToken.sol";

contract AOToken is MyAdvancedToken {
	uint256 public power;

	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol)
		MyAdvancedToken(initialSupply, tokenName, tokenSymbol) public {
		power = 1;
		decimals = 0;
	}
}
