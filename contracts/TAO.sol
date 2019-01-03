pragma solidity ^0.4.24;

import './SafeMath.sol';

/**
 * @title TAO
 */
contract TAO {
	using SafeMath for uint256;

	string public name;				// the name for this TAO
	address public originId;		// the ID of the Name that created this TAO. If Name, it's the eth address

	// TAO's data
	string public datHash;
	string public database;
	string public keyValue;
	bytes32 public contentId;

	/**
	 * 0 = TAO
	 * 1 = Name
	 */
	uint8 public typeId;

	uint256 public balance;

	/**
	 * @dev Constructor function
	 */
	constructor (string _name, address _originId, string _datHash, string _database, string _keyValue, bytes32 _contentId) public {
		name = _name;
		originId = _originId;
		datHash = _datHash;
		database = _database;
		keyValue = _keyValue;
		contentId = _contentId;

		// Creating TAO
		typeId = 0;
	}

	/**
	 * @dev Receive ETH
	 */
	function () public payable {
		balance = balance.add(msg.value);
	}
}
