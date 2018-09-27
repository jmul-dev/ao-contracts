pragma solidity ^0.4.24;

import "./AntiThoughtCurrency.sol";

contract AntiLogos is AntiThoughtCurrency {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol)
		AntiThoughtCurrency(initialSupply, tokenName, tokenSymbol) public {}
}
