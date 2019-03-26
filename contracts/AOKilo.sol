pragma solidity >=0.5.4 <0.6.0;

import "./AOIonInterface.sol";

contract AOKilo is AOIonInterface {
	/**
	 * @dev Constructor function
	 */
	constructor(string memory _name, string memory _symbol, address _nameTAOPositionAddress, address _namePublicKeyAddress, address _nameAccountRecoveryAddress)
		AOIonInterface(_name, _symbol, _nameTAOPositionAddress, _namePublicKeyAddress, _nameAccountRecoveryAddress) public {
		powerOfTen = 3;
		decimals = 3;
	}
}
