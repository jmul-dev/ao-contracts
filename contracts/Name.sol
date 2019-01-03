pragma solidity ^0.4.24;

import './TAO.sol';
/**
 * @title Name
 */
contract Name is TAO {
	/**
	 * @dev Constructor function
	 */
	constructor (string _name, address _originId, string _datHash, string _database, string _keyValue, bytes32 _contentId)
		TAO (_name, _originId, _datHash, _database, _keyValue, _contentId) public {
		// Creating Name
		typeId = 1;
	}
}
