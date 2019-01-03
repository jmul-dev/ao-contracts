pragma solidity ^0.4.24;

import "./Pathos.sol";

contract PathosXona is Pathos {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol)
		Pathos(initialSupply, tokenName, tokenSymbol) public {
		powerOfTen = 27;
		decimals = 27;
	}
}
