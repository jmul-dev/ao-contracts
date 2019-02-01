pragma solidity ^0.4.24;

import "./TAOCurrency.sol";

contract EthosExa is TAOCurrency {
	/**
	 * @dev Constructor function
	 */
	constructor(string _name, string _symbol, address _nameTAOPositionAddress)
		TAOCurrency(_name, _symbol, _nameTAOPositionAddress) public {
		powerOfTen = 18;
		decimals = 18;
	}
}
