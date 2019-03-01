pragma solidity ^0.5.4;

import "./TAOCurrency.sol";

contract EthosZetta is TAOCurrency {
	/**
	 * @dev Constructor function
	 */
	constructor(string _name, string _symbol, address _nameTAOPositionAddress)
		TAOCurrency(_name, _symbol, _nameTAOPositionAddress) public {
		powerOfTen = 21;
		decimals = 21;
	}
}
