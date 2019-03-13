pragma solidity ^0.5.4;

import "./TAOCurrency.sol";

contract PathosXona is TAOCurrency {
	/**
	 * @dev Constructor function
	 */
	constructor(string memory _name, string memory _symbol, address _nameTAOPositionAddress)
		TAOCurrency(_name, _symbol, _nameTAOPositionAddress) public {
		powerOfTen = 27;
		decimals = 27;
	}
}
