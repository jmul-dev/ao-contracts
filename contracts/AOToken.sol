pragma solidity ^0.4.24;

import "./MyAdvancedToken.sol";

contract AOToken is MyAdvancedToken {
	uint256 public powerOfTen;

	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol)
		MyAdvancedToken(initialSupply, tokenName, tokenSymbol) public {
		powerOfTen = 1;
		decimals = 0;
	}
}
