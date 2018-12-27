pragma solidity ^0.4.24;

import "./Pathos.sol";

contract PathosKilo is Pathos {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol, bytes32 tokenInternalName)
		Pathos(initialSupply, tokenName, tokenSymbol, tokenInternalName) public {
		powerOfTen = 3;
		decimals = 3;
	}
}
