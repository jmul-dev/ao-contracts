pragma solidity ^0.4.24;

import './SafeMath.sol';

/**
 * @title Thought
 */
contract Thought {
	using SafeMath for uint256;

	// Public variables
	string public originName;
	// If originNameId is an address, hash it
	address public originNameId;

	address public advocateId;
	address public listenerId;
	address public speakerId;

	// Thought's data
	string public datHash;
	string public database;
	string public keyValue;
	bytes32 public contentId;

	/**
	 * 0 = create a Thought
	 * 1 = create a Name
	 */
	uint8 public thoughtTypeId;

	address public fromId;
	address public throughId;
	address public toId;

	struct ChildThought {
		address fromThoughtId;
		uint256 positionAmount;
	}

	ChildThought[] public childThoughts;
	address[] public orphanThoughts;

	/**
	 * @dev Constructor function
	 */
	constructor (string _originName, address _originNameId, address _advocateId, string _datHash, string _database, string _keyValue, bytes32 _contentId, address _fromId) public {
		originName = _originName;
		originNameId = _originNameId;
		advocateId = _advocateId;
		datHash = _datHash;
		database = _database;
		keyValue = _keyValue;
		contentId = _contentId;
		fromId = _fromId;

		listenerId = advocateId;
		speakerId = advocateId;

		// Creating Thought
		thoughtTypeId = 0;
	}
}
