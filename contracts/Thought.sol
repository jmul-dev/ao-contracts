pragma solidity ^0.4.24;

import './SafeMath.sol';

/**
 * @title Thought
 */
contract Thought {
	using SafeMath for uint256;

	// Public variables
	address public brainAddress;
	string public originName;
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
		brainAddress = msg.sender;
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

	/**
	 * @dev Check if calling address is Brain
	 */
	modifier onlyBrain {
		require (msg.sender == brainAddress);
		_;
	}

	/**
	 * @dev Set advocate
	 * @param _advocateId The advocate ID to be set
	 * @return true on success
	 */
	function setAdvocate(address _advocateId) public onlyBrain returns (bool) {
		require (_advocateId != address(0));
		advocateId = _advocateId;
		return true;
	}

	/**
	 * @dev Set listener
	 * @param _listenerId The listener ID to be set
	 * @return true on success
	 */
	function setListener(address _listenerId) public onlyBrain returns (bool) {
		require (_listenerId != address(0));
		listenerId = _listenerId;
		return true;
	}

	/**
	 * @dev Set speaker
	 * @param _speakerId The speaker ID to be set
	 * @return true on success
	 */
	function setSpeaker(address _speakerId) public onlyBrain returns (bool) {
		require (_speakerId != address(0));
		speakerId = _speakerId;
		return true;
	}
}
