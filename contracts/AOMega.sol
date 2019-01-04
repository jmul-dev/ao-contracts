pragma solidity ^0.4.24;

import "./AOTokenInterface.sol";

contract AOMega is AOTokenInterface {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol)
		AOTokenInterface(initialSupply, tokenName, tokenSymbol) public {
		powerOfTen = 6;
		decimals = 6;
	}
}
