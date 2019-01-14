pragma solidity ^0.4.24;

import "./TAOCurrency.sol";

contract EthosTera is TAOCurrency {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol, address _nameTAOPositionAddress)
		TAOCurrency(initialSupply, tokenName, tokenSymbol, _nameTAOPositionAddress) public {
		powerOfTen = 12;
		decimals = 12;
	}
}
