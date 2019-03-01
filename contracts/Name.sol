pragma solidity ^0.5.4;

import './TAO.sol';
/**
 * @title Name
 */
contract Name is TAO {
	/**
	 * @dev Constructor function
	 */
	constructor (string _name, address _originId, string _datHash, string _database, string _keyValue, bytes32 _contentId, address _vaultAddress)
		TAO (_name, _originId, _datHash, _database, _keyValue, _contentId, _vaultAddress) public {
		// Creating Name
		typeId = 1;
	}
}
