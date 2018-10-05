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

	uint256 public totalChildThoughts;
	uint256 public totalOrphanThoughts;
	uint256 public totalChildOrphanThoughts;

	struct ChildOrphanThought {
		address thoughtId;
		bool child;			// If false, then it's an orphan Thought
		bool connected;		// If false, then parent Thought want to remove this child/orphan Thought
	}

	mapping (uint256 => ChildOrphanThought) public childOrphanThoughts;
	mapping (address => uint256) public childOrphanThoughtInternalIdLookup;

	/**
	 * @dev Constructor function
	 */
	constructor (string _originName, address _originNameId, string _datHash, string _database, string _keyValue, bytes32 _contentId, address _fromId, address _toId) public {
		factoryAddress = msg.sender;
		originName = _originName;
		originNameId = _originNameId;
		advocateId = _originNameId;
		datHash = _datHash;
		database = _database;
		keyValue = _keyValue;
		contentId = _contentId;
		fromId = _fromId;
		toId = _toId;

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
	 * @dev Add Child/Orphan Thought
	 * @param _thoughtId The Thought ID to be added to as Child/Orphan Thought
	 * @param _child True if adding this as a child Thought. False if it's an orphan Thought.
	 * @return true on success
	 */
	function addChildOrphanThought(address _thoughtId, bool _child) public onlyFactory returns (bool) {
		require (_thoughtId != address(0));
		require (childOrphanThoughtInternalIdLookup[_thoughtId] == 0);

		totalChildOrphanThoughts++;
		if (_child) {
			totalChildThoughts++;
		} else {
			totalOrphanThoughts++;
		}
		childOrphanThoughtInternalIdLookup[_thoughtId] = totalChildOrphanThoughts;
		ChildOrphanThought storage _childOrphanThought = childOrphanThoughts[totalChildOrphanThoughts];
		_childOrphanThought.thoughtId = _thoughtId;
		_childOrphanThought.child = _child;
		_childOrphanThought.connected = true;
		return true;
	}

	/**
	 * @dev Get list of child/orphan Thought IDs
	 * @param _from The starting index (start from 1)
	 * @param _to The ending index, (max is totalChildOrphanThoughts count )
	 * @return list of child/orphan Thought IDs
	 */
	function getChildOrphanThoughtIds(uint256 _from, uint256 _to) public view returns (address[]) {
		require (_from >= 1 && _to >= _from && totalChildOrphanThoughts >= _to);
		address[] memory _childOrphanThoughtIds = new address[](_to.sub(_from).add(1));
		for (uint256 i = _from; i <= _to; i++) {
			_childOrphanThoughtIds[i.sub(_from)] = childOrphanThoughts[i].connected ? childOrphanThoughts[i].thoughtId : address(0);
		}
		return _childOrphanThoughtIds;
	}

	/**
	 * @dev Get total child/orphan Thoughts count
	 * @return total Child/Orphan Thoughts count
	 */
	function getTotalChildOrphanThoughtsCount() public view returns (uint256) {
		return totalChildOrphanThoughts;
	}

	/**
	 * @dev Get total child Thoughts count
	 * @return total Child Thoughts count
	 */
	function getTotalChildThoughtsCount() public view returns (uint256) {
		return totalChildThoughts;
	}

	/**
	 * @dev Get total orphan Thoughts count
	 * @return total Orphan Thoughts count
	 */
	function getTotalOrphanThoughtsCount() public view returns (uint256) {
		return totalOrphanThoughts;
	}

	/**
	 * @dev Check if `_childThoughtId` is a child Thought
	 * @param _childThoughtId The child Thought ID to check
	 * @return return true if yes. Otherwise return false.
	 */
	function isChildThought(address _childThoughtId) public view returns (bool) {
		return (childOrphanThoughtInternalIdLookup[_childThoughtId] > 0 && childOrphanThoughts[childOrphanThoughtInternalIdLookup[_childThoughtId]].child && childOrphanThoughts[childOrphanThoughtInternalIdLookup[_childThoughtId]].connected);
	}

	/**
	 * @dev Check if `_orphanThoughtId` is an orphan Thought
	 * @param _orphanThoughtId The orphan Thought ID to check
	 * @return return true if yes. Otherwise return false.
	 */
	function isOrphanThought(address _orphanThoughtId) public view returns (bool) {
		return (childOrphanThoughtInternalIdLookup[_orphanThoughtId] > 0 && !childOrphanThoughts[childOrphanThoughtInternalIdLookup[_orphanThoughtId]].child && childOrphanThoughts[childOrphanThoughtInternalIdLookup[_orphanThoughtId]].connected);
	}
}
