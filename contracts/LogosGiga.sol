pragma solidity ^0.4.24;

import "./Logos.sol";

contract LogosGiga is Logos {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol, bytes32 tokenInternalName)
		Logos(initialSupply, tokenName, tokenSymbol, tokenInternalName) public {
		powerOfTen = 9;
		decimals = 9;
	}
}
