pragma solidity ^0.4.24;

import "./Ethos.sol";

contract EthosKilo is Ethos {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol)
		Ethos(initialSupply, tokenName, tokenSymbol) public {
		powerOfTen = 3;
		decimals = 3;
	}
}
