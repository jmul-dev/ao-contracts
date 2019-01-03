pragma solidity ^0.4.24;

import "./Pathos.sol";

contract PathosPeta is Pathos {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol)
		Pathos(initialSupply, tokenName, tokenSymbol) public {
		powerOfTen = 15;
		decimals = 15;
	}
}
