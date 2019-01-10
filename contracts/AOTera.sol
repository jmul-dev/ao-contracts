pragma solidity ^0.4.24;

import "./AOTokenInterface.sol";

contract AOTera is AOTokenInterface {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol, address _nameTAOPositionAddress)
		AOTokenInterface(initialSupply, tokenName, tokenSymbol, _nameTAOPositionAddress) public {
		powerOfTen = 12;
		decimals = 12;
	}
}
