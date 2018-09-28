pragma solidity ^0.4.24;

import "./ThoughtCurrency.sol";

contract AntiThoughtCurrency is ThoughtCurrency {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol, bytes32 tokenInternalName)
		ThoughtCurrency(initialSupply, tokenName, tokenSymbol, tokenInternalName) public {
		sign = -1;
	}
}
