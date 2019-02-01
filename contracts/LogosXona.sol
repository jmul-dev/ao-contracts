pragma solidity ^0.4.24;

import "./TAOCurrency.sol";

contract LogosXona is TAOCurrency {
	/**
	 * @dev Constructor function
	 */
	constructor(string _name, string _symbol, address _nameTAOPositionAddress)
		TAOCurrency(_name, _symbol, _nameTAOPositionAddress) public {
		powerOfTen = 27;
		decimals = 27;
	}
}
