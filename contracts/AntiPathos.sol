pragma solidity ^0.4.24;

import "./AntiTAOCurrency.sol";

contract AntiPathos is AntiTAOCurrency {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol, bytes32 tokenInternalName)
		AntiTAOCurrency(initialSupply, tokenName, tokenSymbol, tokenInternalName) public {}
}
