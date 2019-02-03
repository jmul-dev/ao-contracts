pragma solidity ^0.4.24;

import "./AOIonInterface.sol";

contract AOPeta is AOIonInterface {
	/**
	 * @dev Constructor function
	 */
	constructor(string _name, string _symbol, address _nameTAOPositionAddress, address _namePublicKeyAddress, address _nameAccountRecoveryAddress)
		AOIonInterface(_name, _symbol, _nameTAOPositionAddress, _namePublicKeyAddress, _nameAccountRecoveryAddress) public {
		powerOfTen = 15;
		decimals = 15;
	}
}
