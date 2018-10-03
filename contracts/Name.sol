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
	constructor (string _originName, address _originNameId, string _datHash, string _database, string _keyValue, bytes32 _contentId)
		Thought (_originName, _originNameId, _datHash, _database, _keyValue, _contentId, _originNameId, address(0)) public {
		// Creating Name
		thoughtTypeId = 1;

		advocateId = address(this);
		listenerId = advocateId;
		speakerId = advocateId;
	}
}
