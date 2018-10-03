pragma solidity ^0.4.24;

import './SafeMath.sol';

/**
 * @title Thought
 */
contract Thought {
	using SafeMath for uint256;

	// Public variables
	address public factoryAddress;
	string public originName;		// the name of the Name that created this Thought
	address public originNameId;	// the ID of the Name that created this Thought

	address public advocateId;	// current advocateId
	address public listenerId;	// current listenerId
	address public speakerId;	// current speakerId

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

	address public fromId;		// The origin Thought ID
	address public throughId;
	address public toId;		// When this Thought wants to be part of a larger Thought but it's not coming from its Advocate

	address[] internal childThoughts;
	address[] internal orphanThoughts;

	/**
	 * @dev Constructor function
	 */
	constructor (string _originName, address _originNameId, string _datHash, string _database, string _keyValue, bytes32 _contentId, address _fromId) public {
		factoryAddress = msg.sender;
		originName = _originName;
		originNameId = _originNameId;
		advocateId = _originNameId;
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
	 * @dev Check if calling address is Factory
	 */
	modifier onlyFactory {
		require (msg.sender == factoryAddress);
		_;
	}

	/**
	 * @dev Set advocate
	 * @param _advocateId The advocate ID to be set
	 * @return true on success
	 */
	function setAdvocate(address _advocateId) public onlyFactory returns (bool) {
		require (_advocateId != address(0));
		advocateId = _advocateId;
		return true;
	}

	/**
	 * @dev Set listener
	 * @param _listenerId The listener ID to be set
	 * @return true on success
	 */
	function setListener(address _listenerId) public onlyFactory returns (bool) {
		require (_listenerId != address(0));
		listenerId = _listenerId;
		return true;
	}

	/**
	 * @dev Set speaker
	 * @param _speakerId The speaker ID to be set
	 * @return true on success
	 */
	function setSpeaker(address _speakerId) public onlyFactory returns (bool) {
		require (_speakerId != address(0));
		speakerId = _speakerId;
		return true;
	}

	/**
	 * @dev Add ChildThought
	 * @param _thoughtId The Thought to be added to as ChildThought
	 * @return true on success
	 */
	function addChildThought(address _thoughtId) public onlyFactory returns (bool) {
		require (_thoughtId != address(0));
		childThoughts.push(_thoughtId);
		return true;
	}

	/**
	 * @dev Get list of child Thought IDs
	 * @param _from The starting index
	 * @param _to The ending index
	 * @return list of child Thought IDs
	 */
	function getChildThoughtIds(uint256 _from, uint256 _to) public onlyFactory view returns (address[]) {
		require (_from >= 0 && _to >= _from);
		require (childThoughts.length > 0);
		address[] memory _childThoughtIds = new address[](_to.sub(_from).add(1));
		if (_to > childThoughts.length.sub(1)) {
			_to = childThoughts.length.sub(1);
		}
		for (uint256 i = _from; i <= _to; i++) {
			_childThoughtIds[i.sub(_from)] = childThoughts[i];
		}
		return _childThoughtIds;
	}

	/**
	 * @dev Get total child Thoughts count
	 * @return total Child Thoughts count
	 */
	function getTotalChildThoughtsCount() public onlyFactory view returns (uint256) {
		return childThoughts.length;
	}
}
