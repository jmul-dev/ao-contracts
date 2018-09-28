pragma solidity ^0.4.24;

import './Thought.sol';
import './SafeMath.sol';

/**
 * @title Name
 */
contract Name is Thought {
	using SafeMath for uint256;

	/**
	 * @dev Constructor function
	 */
	constructor (string _name, bytes32 _ethAddress, string _datHash, string _database, string _keyValue, bytes32 _contentId)
		Thought (_name, _ethAddress, '', _datHash, _database, _keyValue, _contentId, _ethAddress) public {
		// Creating Name
		thoughtTypeId = 1;

		advocateId = thoughtId;
		listenerId = advocateId;
		speakerId = advocateId;
	}
}
