pragma solidity ^0.4.24;

import './ThoughtController.sol';

/**
 * @title ThoughtFactory
 *
 * The purpose of this contract is to allow node to create Thought
 */
contract ThoughtFactory is ThoughtController {
	address[] internal thoughts;

	// Event to be broadcasted to public when Advocate creates a Thought
	event CreateThought(address indexed ethAddress, address advocateId, address thoughtId, uint256 index, address from, uint8 fromThoughtTypeId, address to);

	// Event to be broadcasted to public when current Advocate sets New Advocate for a Thought
	event SetThoughtAdvocate(address indexed thoughtId, address oldAdvocateId, address newAdvocateId);

	// Event to be broadcasted to public when current Advocate sets New Listener for a Thought
	event SetThoughtListener(address indexed thoughtId, address oldListenerId, address newListenerId);

	// Event to be broadcasted to public when current Advocate sets New Speaker for a Thought
	event SetThoughtSpeaker(address indexed thoughtId, address oldSpeakerId, address newSpeakerId);

	// Event to be broadcasted to public when a parent Thought adds a child Thought
	event AddChildThought(address indexed parentThoughtId, address childThoughtId);

	// Event to be broadcasted to public when a parent Thought adds an orphan Thought
	event AddOrphanThought(address indexed parentThoughtId, address orphanThoughtId);

	// Event to be broadcasted to public when a parent Thought's Listener approves an orphan Thought
	event ApproveOrphanThought(address indexed listenerId, address parentThoughtId, address orphanThoughtId);

	// Event to be broadcasted to public when a Thought is locked/unlocked
	event SetThoughtLocked(address indexed thoughtId, bool locked);

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress, address _positionAddress)
		ThoughtController(_nameFactoryAddress, _positionAddress) public {}

	/**
	 * @dev Name creates a Thought
	 * @param _datHash The datHash of this Thought
	 * @param _database The database for this Thought
	 * @param _keyValue The key/value pair to be checked on the database
	 * @param _contentId The contentId related to this Thought
	 * @param _from The origin of this Thought (has to be a Name or Thought)
	 */
	function createThought(string _datHash, string _database, string _keyValue, bytes32 _contentId, address _from) public senderIsName(msg.sender) {
		address _nameId = _nameFactory.ethAddressToNameId(msg.sender);

		// Make sure _from is a Thought/Name
		require (_from != address(0) && Thought(_from).originNameId() != address(0));

		/**
		 * If _from is a Thought (ThoughtTypeId == 0)
		 * Decide what are the _from and _to IDs
		 * 1. If the _from's advocateId is the same as msg.sender's nameId, then
		 *    the same advocateId is creating this new Thought from _from Thought.
		 *    In this case, _from doesn't change, and _to is address(0).
		 *
		 * 2. If the _from's advocateId is different from msg.sender's nameId, then
		 *    another advocate is creating this new Thought and want to be part of
		 *    _from Thought.
		 *	  In this case, _from is the nameId, and _to is _from
		 */
		address _assignedFrom = _from;
		address _assignedTo = address(0);
		if (Thought(_assignedFrom).thoughtTypeId() == 0 && Thought(_assignedFrom).advocateId() != _nameId) {
			_assignedFrom = _nameId;
			_assignedTo = _from;
		}

		address thoughtId = new Thought(Name(_nameId).originName(), _nameId, _datHash, _database, _keyValue, _contentId, _assignedFrom, _assignedTo);
		thoughts.push(thoughtId);

		emit CreateThought(msg.sender, _nameId, thoughtId, thoughts.length.sub(1), _assignedFrom, Thought(_assignedFrom).thoughtTypeId(), _assignedTo);

		if (Thought(_from).thoughtTypeId() == 0) {
			// If this Thought is created from another Thought from the same advocate,
			// Want to add this Thought to its parent Thought as a ChildThought
			if (Thought(_from).advocateId() == _nameId) {
				require (Thought(_from).addSubThought(thoughtId, true));
				emit AddChildThought(_from, thoughtId);
			} else {
				// Otherwise, add this Thought to its parent Thought as an OrphanThought
				require (Thought(_from).addSubThought(thoughtId, false));
				emit AddOrphanThought(_from, thoughtId);
			}
		}
	}

	/**
	 * @dev Get Thought information
	 * @param _thoughtId The ID of the Thought to be queried
	 * @return The origin name of the Thought
	 * @return The origin Name ID of the Thought
	 * @return The advocateId of the Thought
	 * @return The listenerId of the Thought
	 * @return The speakerId of the Thought
	 * @return The datHash of the Thought
	 * @return The database of the Thought
	 * @return The keyValue of the Thought
	 * @return The contentId of the Thought
	 * @return The thoughtTypeId of the Thought
	 */
	function getThought(address _thoughtId) public view returns (string, address, address, address, address, string, string, string, bytes32, uint8) {
		Thought _thought = Thought(_thoughtId);
		return (
			_thought.originName(),
			_thought.originNameId(),
			_thought.advocateId(),
			_thought.listenerId(),
			_thought.speakerId(),
			_thought.datHash(),
			_thought.database(),
			_thought.keyValue(),
			_thought.contentId(),
			_thought.thoughtTypeId()
		);
	}

	/**
	 * @dev Get total Thoughts count
	 * @return total Thoughts count
	 */
	function getTotalThoughtsCount() public view returns (uint256) {
		return thoughts.length;
	}

	/**
	 * @dev Get list of Thought IDs
	 * @param _from The starting index
	 * @param _to The ending index
	 * @return list of Thought IDs
	 */
	function getThoughtIds(uint256 _from, uint256 _to) public view returns (address[]) {
		require (_from >= 0 && _to >= _from && thoughts.length > _to);

		address[] memory _thoughts = new address[](_to.sub(_from).add(1));
		for (uint256 i = _from; i <= _to; i++) {
			_thoughts[i.sub(_from)] = thoughts[i];
		}
		return _thoughts;
	}

	/**
	 * @dev Set Thought's advocate
	 * @param _thoughtId The ID of the Thought
	 * @param _newAdvocateId The new advocate ID to be set
	 */
	function setThoughtAdvocate(address _thoughtId, address _newAdvocateId) public isThought(_thoughtId) isName(_newAdvocateId) senderIsName(msg.sender) onlyAdvocateOf(msg.sender, _thoughtId) {
		Thought _thought = Thought(_thoughtId);

		address _currentAdvocateId = _thought.advocateId();

		// Set the new advocate
		require (_thought.setAdvocate(_newAdvocateId));

		emit SetThoughtAdvocate(_thoughtId, _currentAdvocateId, _newAdvocateId);
	}

	/**
	 * @dev Set Thought's listener
	 * @param _thoughtId The ID of the Thought
	 * @param _newListenerId The new listener ID to be set
	 */
	function setThoughtListener(address _thoughtId, address _newListenerId) public isThought(_thoughtId) isName(_newListenerId) senderIsName(msg.sender) onlyAdvocateOf(msg.sender, _thoughtId) {
		Thought _thought = Thought(_thoughtId);

		// Set the new listener
		address _currentListenerId = _thought.listenerId();
		require (_thought.setListener(_newListenerId));

		emit SetThoughtListener(_thoughtId, _currentListenerId, _newListenerId);
	}

	/**
	 * @dev Set Thought's speaker
	 * @param _thoughtId The ID of the Thought
	 * @param _newSpeakerId The new speaker ID to be set
	 */
	function setThoughtSpeaker(address _thoughtId, address _newSpeakerId) public isThought(_thoughtId) isName(_newSpeakerId) senderIsName(msg.sender) onlyAdvocateOf(msg.sender, _thoughtId) {
		Thought _thought = Thought(_thoughtId);

		// Set the new speaker
		address _currentSpeakerId = _thought.speakerId();
		require (_thought.setSpeaker(_newSpeakerId));

		emit SetThoughtSpeaker(_thoughtId, _currentSpeakerId, _newSpeakerId);
	}

	/**
	 * @dev Get Thought's relationship
	 * @param _thoughtId The ID of the Thought
	 * @return fromId (Origin of the Thought)
	 * @return throughId
	 * @return toId (Destination of the Thought)
	 */
	function getThoughtRelationship(address _thoughtId) public view returns (address, address, address) {
		Thought _thought = Thought(_thoughtId);
		return (
			_thought.fromId(),
			_thought.throughId(),
			_thought.toId()
		);
	}

	/**
	 * @dev Get Thought's sub Thought Ids
	 * @param _thoughtId The ID of the Thought
	 * @param _from The starting index
	 * @param _to The ending index
	 * @return list of sub Thought IDs
	 */
	function getSubThoughtIds(address _thoughtId, uint256 _from, uint256 _to) public isThought(_thoughtId) view returns (address[]) {
		require (_from >= 1 && _to >= _from);
		return Thought(_thoughtId).getSubThoughtIds(_from, _to);
	}

	/**
	 * @dev Get Thought's sub Thoughts total count
	 * @param _thoughtId The ID of the Thought
	 * @return total sub Thoughts count
	 */
	function getTotalSubThoughtsCount(address _thoughtId) public isThought(_thoughtId) view returns (uint256) {
		return Thought(_thoughtId).totalSubThoughts();
	}

	/**
	 * @dev Get Thought's child Thoughts total count
	 * @param _thoughtId The ID of the Thought
	 * @return total child Thoughts count
	 */
	function getTotalChildThoughtsCount(address _thoughtId) public isThought(_thoughtId) view returns (uint256) {
		return Thought(_thoughtId).totalChildThoughts();
	}

	/**
	 * @dev Get Thought's orphan Thoughts total count
	 * @param _thoughtId The ID of the Thought
	 * @return total orphan Thoughts count
	 */
	function getTotalOrphanThoughtsCount(address _thoughtId) public isThought(_thoughtId) view returns (uint256) {
		return Thought(_thoughtId).totalOrphanThoughts();
	}

	/**
	 * @dev Check if `_childThoughtId` is child Thought of `_thoughtId`
	 * @param _thoughtId The ID of the parent Thought
	 * @param _childThoughtId The child Thought ID to check
	 * @return return true if yes. Otherwise return false.
	 */
	function isChildThoughtOfThought(address _thoughtId, address _childThoughtId) public isThought(_thoughtId) isThought(_childThoughtId) view returns (bool) {
		return Thought(_thoughtId).isChildThought(_childThoughtId);
	}

	/**
	 * @dev Check if `_orphanThoughtId` is orphan Thought of `_thoughtId`
	 * @param _thoughtId The ID of the parent Thought
	 * @param _orphanThoughtId The orphan Thought ID to check
	 * @return return true if yes. Otherwise return false.
	 */
	function isOrphanThoughtOfThought(address _thoughtId, address _orphanThoughtId) public isThought(_thoughtId) isThought(_orphanThoughtId) view returns (bool) {
		return Thought(_thoughtId).isOrphanThought(_orphanThoughtId);
	}

	/**
	 * @dev Listener approves orphan Thought.
	 *		This will switch orphan Thought to becoming a child Thought.
	 * @param _thoughtId The ID of the parent Thought
	 * @param _orphanThoughtId The orphan Thought ID to approve
	 */
	function approveOrphanThought(address _thoughtId, address _orphanThoughtId) public senderIsName(msg.sender) {
		require (isOrphanThoughtOfThought(_thoughtId, _orphanThoughtId));

		Thought _thought = Thought(_thoughtId);

		// Only Thought's current listener can approve orphan Thought
		require (Name(_thought.listenerId()).originNameId() == msg.sender);

		require (_thought.approveOrphanThought(_orphanThoughtId));

		emit ApproveOrphanThought(_thought.listenerId(), _thoughtId, _orphanThoughtId);
	}

	/**
	 * @dev Advocate locks/unlocks a Thought.
			When a Thought is locked, no transaction can happen on the Thought (i.e adding funds, adding sub Thought, etc.)
			until the Thought is unlocked again.
	 * @param _thoughtId The ID of the Thought
	 * @param _locked The bool value to be set
	 */
	function setThoughtLocked(address _thoughtId, bool _locked) public isThought(_thoughtId) senderIsName(msg.sender) onlyAdvocateOf(msg.sender, _thoughtId) {
		require (Thought(_thoughtId).setLocked(_locked));

		emit SetThoughtLocked(_thoughtId, _locked);
	}
}
