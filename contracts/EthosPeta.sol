pragma solidity ^0.5.4;

import "./TAOCurrency.sol";

contract EthosPeta is TAOCurrency {
	/**
	 * @dev Constructor function
	 */
	constructor(string memory _name, string memory _symbol, address _nameTAOPositionAddress)
		TAOCurrency(_name, _symbol, _nameTAOPositionAddress) public {
		powerOfTen = 15;
		decimals = 15;
	}
}
