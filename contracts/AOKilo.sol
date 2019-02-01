pragma solidity ^0.4.24;

import "./AOIonInterface.sol";

contract AOKilo is AOIonInterface {
	/**
	 * @dev Constructor function
	 */
	constructor(string _name, string _symbol, address _nameTAOPositionAddress)
		AOIonInterface(_name, _symbol, _nameTAOPositionAddress) public {
		powerOfTen = 3;
		decimals = 3;
	}
}
