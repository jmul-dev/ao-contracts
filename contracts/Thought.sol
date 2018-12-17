pragma solidity ^0.4.24;

import './SafeMath.sol';

/**
 * @title Thought
 */
contract Thought {
	using SafeMath for uint256;

	// Public variables
	bool public locked;
	bool public closed;

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
	uint256 public totalSubThoughts;

	uint256 public balance;
	uint256 public nonce;

	struct SubThought {
		address thoughtId;
		bool child;			// If false, then it's an orphan Thought
		bool connected;		// If false, then parent Thought want to remove this sub Thought
	}

	mapping (uint256 => SubThought) public subThoughts;
	mapping (address => uint256) public subThoughtInternalIdLookup;

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

		nonce = 1;
	}

	/**
	 * @dev Check if contract is active
	 */
	modifier isActive {
		require (locked == false && closed == false);
		_;
	}

	/**
	 * @dev Check if calling address is Factory
	 */
	modifier onlyFactory {
		require (msg.sender == factoryAddress);
		_;
	}

	/**
	 * @dev Set advocate (only works for a Thought)
	 * @param _advocateId The advocate ID to be set
	 * @return true on success
	 */
	function setAdvocate(address _advocateId) public isActive onlyFactory returns (bool) {
		require (_advocateId != address(0));
		require (thoughtTypeId == 0);
		advocateId = _advocateId;
		return true;
	}

	/**
	 * @dev Set listener
	 * @param _listenerId The listener ID to be set
	 * @return true on success
	 */
	function setListener(address _listenerId) public isActive onlyFactory returns (bool) {
		require (_listenerId != address(0));
		listenerId = _listenerId;
		return true;
	}

	/**
	 * @dev Set speaker
	 * @param _speakerId The speaker ID to be set
	 * @return true on success
	 */
	function setSpeaker(address _speakerId) public isActive onlyFactory returns (bool) {
		require (_speakerId != address(0));
		speakerId = _speakerId;
		return true;
	}

	/**
	 * @dev Add sub Thought
	 * @param _thoughtId The Thought ID to be added to as sub Thought
	 * @param _child True if adding this as a child Thought. False if it's an orphan Thought.
	 * @return true on success
	 */
	function addSubThought(address _thoughtId, bool _child) public isActive onlyFactory returns (bool) {
		require (_thoughtId != address(0));
		require (subThoughtInternalIdLookup[_thoughtId] == 0);

		totalSubThoughts++;
		if (_child) {
			totalChildThoughts++;
		} else {
			totalOrphanThoughts++;
		}
		subThoughtInternalIdLookup[_thoughtId] = totalSubThoughts;
		SubThought storage _subThought = subThoughts[totalSubThoughts];
		_subThought.thoughtId = _thoughtId;
		_subThought.child = _child;
		_subThought.connected = true;
		return true;
	}

	/**
	 * @dev Get list of sub Thought IDs
	 * @param _from The starting index (start from 1)
	 * @param _to The ending index, (max is totalSubThoughts count )
	 * @return list of sub Thought IDs
	 */
	function getSubThoughtIds(uint256 _from, uint256 _to) public view returns (address[]) {
		require (_from >= 1 && _to >= _from && totalSubThoughts >= _to);
		address[] memory _subThoughtIds = new address[](_to.sub(_from).add(1));
		for (uint256 i = _from; i <= _to; i++) {
			_subThoughtIds[i.sub(_from)] = subThoughts[i].connected ? subThoughts[i].thoughtId : address(0);
		}
		return _subThoughtIds;
	}

	/**
	 * @dev Check if `_childThoughtId` is a child Thought
	 * @param _childThoughtId The child Thought ID to check
	 * @return true if yes. Otherwise return false.
	 */
	function isChildThought(address _childThoughtId) public view returns (bool) {
		return (subThoughtInternalIdLookup[_childThoughtId] > 0 && subThoughts[subThoughtInternalIdLookup[_childThoughtId]].child && subThoughts[subThoughtInternalIdLookup[_childThoughtId]].connected);
	}

	/**
	 * @dev Check if `_orphanThoughtId` is an orphan Thought
	 * @param _orphanThoughtId The orphan Thought ID to check
	 * @return true if yes. Otherwise return false.
	 */
	function isOrphanThought(address _orphanThoughtId) public view returns (bool) {
		return (subThoughtInternalIdLookup[_orphanThoughtId] > 0 && !subThoughts[subThoughtInternalIdLookup[_orphanThoughtId]].child && subThoughts[subThoughtInternalIdLookup[_orphanThoughtId]].connected);
	}

	/**
	 * @dev Approve orphan Thought and switch it to a child Thought
	 * @param _orphanThoughtId The orphan Thought ID to approve
	 * @return true on success
	 */
	function approveOrphanThought(address _orphanThoughtId) public isActive onlyFactory returns (bool) {
		SubThought storage _subThought = subThoughts[subThoughtInternalIdLookup[_orphanThoughtId]];
		_subThought.child = true;
		totalChildThoughts++;
		totalOrphanThoughts--;
		return true;
	}

	/**
	 * @dev Lock/unlock Thought. If at "locked" state, no transaction can be executed on this Thought
			until it's unlocked again.
	 * @param _locked The bool value to set
	 * @return true on success
	 */
	function setLocked(bool _locked) public onlyFactory returns (bool) {
		require (closed == false);
		locked = _locked;
		return true;
	}

	/**
	 * @dev Mark Thought as closed
	 * @return true on success
	 */
	function close() public onlyFactory returns (bool) {
		require (closed == false);
		closed = true;
		return true;
	}

	/**
	 * @dev Receive ETH
	 */
	function () public payable isActive {
		balance = balance.add(msg.value);
	}
}
