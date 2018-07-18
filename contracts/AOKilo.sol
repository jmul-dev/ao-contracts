pragma solidity ^0.4.24;

import "./AOToken.sol";

contract AOKilo is AOToken {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol)
		AOToken(initialSupply, tokenName, tokenSymbol) public {
		powerOfTen = 3;
		decimals = 3;
		icoContract = false;
	}
}
