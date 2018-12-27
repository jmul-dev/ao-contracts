pragma solidity ^0.4.24;

import "./Ethos.sol";

contract EthosYotta is Ethos {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol, bytes32 tokenInternalName)
		Ethos(initialSupply, tokenName, tokenSymbol, tokenInternalName) public {
		powerOfTen = 24;
		decimals = 24;
	}
}
