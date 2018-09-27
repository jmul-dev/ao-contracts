pragma solidity ^0.4.24;

import "./ThoughtCurrency.sol";

contract Logos is ThoughtCurrency {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol)
		ThoughtCurrency(initialSupply, tokenName, tokenSymbol) public {}
}
