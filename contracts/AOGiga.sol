pragma solidity ^0.4.24;

import "./AOToken.sol";

contract AOGiga is AOToken {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol)
		AOToken(initialSupply, tokenName, tokenSymbol) public {
		powerOfTen = 9;
		decimals = 9;
		icoContract = false;
	}
}
