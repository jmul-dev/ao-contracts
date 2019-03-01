pragma solidity ^0.5.4;

import "./AOIonInterface.sol";

contract AOGiga is AOIonInterface {
	/**
	 * @dev Constructor function
	 */
	constructor(string _name, string _symbol, address _nameTAOPositionAddress, address _namePublicKeyAddress, address _nameAccountRecoveryAddress)
		AOIonInterface(_name, _symbol, _nameTAOPositionAddress, _namePublicKeyAddress, _nameAccountRecoveryAddress) public {
		powerOfTen = 9;
		decimals = 9;
	}
}
