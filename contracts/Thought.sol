pragma solidity ^0.4.24;

import './SafeMath.sol';

/**
 * @title Thought
 */
contract Thought {
	using SafeMath for uint256;

	// Public variables
	bytes32 public thoughtId;
	string public originName;
	// If originNameId is an address, hash it
	bytes32 public originNameId;

	bytes32 public advocateId;
	bytes32 public listenerId;
	bytes32 public speakerId;

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

	bytes32 public fromId;
	bytes32 public throughId;
	bytes32 public toId;

	struct ChildThought {
		bytes32 fromThoughtId;
		uint256 positionAmount;
	}

	ChildThought[] public childThoughts;
	bytes32[] public orphanThoughts;

	/**
	 * @dev Constructor function
	 */
	constructor (string _originName, bytes32 _originNameId, bytes32 _advocateId, string _datHash, string _database, string _keyValue, bytes32 _contentId, bytes32 _fromId) public {
		thoughtId = keccak256(abi.encodePacked(msg.sender, _originName, _originNameId));
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
