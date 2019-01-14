pragma solidity ^0.4.24;

import "./TAOCurrency.sol";

contract PathosMega is TAOCurrency {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol, address _nameTAOPositionAddress)
		TAOCurrency(initialSupply, tokenName, tokenSymbol, _nameTAOPositionAddress) public {
		powerOfTen = 6;
		decimals = 6;
	}
}
