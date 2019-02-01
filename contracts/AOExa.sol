pragma solidity ^0.4.24;

import "./AOIonInterface.sol";

contract AOExa is AOIonInterface {
	/**
	 * @dev Constructor function
	 */
	constructor(string _name, string _symbol, address _nameTAOPositionAddress)
		AOIonInterface(_name, _symbol, _nameTAOPositionAddress) public {
		powerOfTen = 18;
		decimals = 18;
	}
}
