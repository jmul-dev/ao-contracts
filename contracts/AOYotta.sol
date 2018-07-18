pragma solidity ^0.4.24;

import "./AOToken.sol";

contract AOYotta is AOToken {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol)
		AOToken(initialSupply, tokenName, tokenSymbol) public {
		powerOfTen = 24;
		decimals = 24;
		icoContract = false;
	}
}
