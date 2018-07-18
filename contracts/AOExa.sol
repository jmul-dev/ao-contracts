pragma solidity ^0.4.24;

import "./AOToken.sol";

contract AOExa is AOToken {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol)
		AOToken(initialSupply, tokenName, tokenSymbol) public {
		powerOfTen = 18;
		decimals = 18;
		icoContract = false;
	}
}
