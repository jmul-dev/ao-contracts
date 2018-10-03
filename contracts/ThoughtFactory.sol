pragma solidity ^0.4.24;

import './Thought.sol';
import './Name.sol';
import './SafeMath.sol';
import './NameFactory.sol';

/**
 * @title ThoughtFactory
 *
 * The purpose of this contract is to allow node to create Thought
 */
contract ThoughtFactory {
	using SafeMath for uint256;

	address public nameFactoryAddress;
	NameFactory internal _nameFactory;

	address[] internal thoughts;

	// Event to be broadcasted to public when Advocate creates a Thought
	event CreateThought(address ethAddress, address advocateId, address thoughtId, uint256 index, address from, uint8 fromThoughtTypeId, address to);

	// Event to be broadcasted to public when current Advocate sets New Advocate for a Thought
	event SetThoughtAdvocate(address thoughtId, address oldAdvocateId, address newAdvocateId);

	// Event to be broadcasted to public when current Advocate sets New Listener for a Thought
	event SetThoughtListener(address thoughtId, address oldListenerId, address newListenerId);

	// Event to be broadcasted to public when current Advocate sets New Speaker for a Thought
	event SetThoughtSpeaker(address thoughtId, address oldSpeakerId, address newSpeakerId);

	// Event to be broadcasted to public when a parent Thought adds a child Thought
	event AddChildThought(address parentThoughtId, address childThoughtId);

	// Event to be broadcasted to public when a parent Thought adds an orphan Thought
	event AddOrphanThought(address parentThoughtId, address orphanThoughtId);

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress) public {
		nameFactoryAddress = _nameFactoryAddress;
		_nameFactory = NameFactory(nameFactoryAddress);
	}

	/**
	 * @dev Name creates a Thought
	 * @param _datHash The datHash of this Thought
	 * @param _database The database for this Thought
	 * @param _keyValue The key/value pair to be checked on the database
	 * @param _contentId The contentId related to this Thought
	 * @param _from The origin of this Thought (has to be a Name or Thought)
	 * @return true on success
	 */
	function createThought(string _datHash, string _database, string _keyValue, bytes32 _contentId, address _from) public returns (bool) {
		// Make sure the msg.sender has a Name
		address advocateId = _nameFactory.ethAddressToNameId(msg.sender);
		require (advocateId != address(0));

		// Make sure _from is a Thought/Name
		require (_from != address(0) && Thought(_from).originNameId() != address(0));

		/**
		 * If _from is a Thought (ThoughtTypeId == 0)
		 * Decide what are the _from and _to IDs
		 * 1. If the _from's advocateId is the same as msg.sender's advocateId, then
		 *    the same advocateId is creating this new Thought from _from Thought.
		 *    In this case, _from doesn't change, and _to is address(0).
		 *
		 * 2. If the _from's advocateId is different from msg.sender's advocateId, then
		 *    another advocate is creating this new Thought and want to be part of
		 *    _from Thought.
		 *	  In this case, _from is the advocateId, and _to is _from
		 */
		address _revisedFrom = _from;
		address _revisedTo = address(0);
		if (Thought(_revisedFrom).thoughtTypeId() == 0 && Thought(_revisedFrom).advocateId() != advocateId) {
			_revisedFrom = advocateId;
			_revisedTo = _from;
		}

		address thoughtId = new Thought(Name(advocateId).originName(), advocateId, _datHash, _database, _keyValue, _contentId, _revisedFrom, _revisedTo);
		thoughts.push(thoughtId);

		emit CreateThought(msg.sender, advocateId, thoughtId, thoughts.length.sub(1), _revisedFrom, Thought(_revisedFrom).thoughtTypeId(), _revisedTo);

		if (Thought(_from).thoughtTypeId() == 0) {
			// If this Thought is created from another Thought from the same advocate,
			// Want to add this Thought to its parent Thought as a ChildThought
			if (Thought(_from).advocateId() == advocateId) {
				require (Thought(_from).addChildThought(thoughtId));
				emit AddChildThought(_from, thoughtId);
			} else {
				// Otherwise, add this Thought to its parent Thought as an OrphanThought
				require (Thought(_from).addOrphanThought(thoughtId));
				emit AddOrphanThought(_from, thoughtId);
			}
		}
		return true;
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
		require (_from >= 0 && _to >= _from);
		require (thoughts.length > 0);

		address[] memory _thoughts = new address[](_to.sub(_from).add(1));
		if (_to > thoughts.length.sub(1)) {
			_to = thoughts.length.sub(1);
		}
		for (uint256 i = _from; i <= _to; i++) {
			_thoughts[i.sub(_from)] = thoughts[i];
		}
		return _thoughts;
	}

	/**
	 * @dev Set Thought's advocate
	 * @param _thoughtId The ID of the Thought
	 * @param _newAdvocateId The new advocate ID to be set
	 * @return true on success
	 */
	function setThoughtAdvocate(address _thoughtId, address _newAdvocateId) public returns (bool) {
		Thought _thought = Thought(_thoughtId);

		// Make sure the Thought exist
		require (_thought.originNameId() != address(0) && _thought.thoughtTypeId() == 0);

		// Make sure the new Advocate ID is a Name
		require (Name(_newAdvocateId).originNameId() != address(0) && Name(_newAdvocateId).thoughtTypeId() == 1);

		// Only Thought's current advocate can set new advocate
		address _currentAdvocateId = _thought.advocateId();
		require (_nameFactory.ethAddressToNameId(msg.sender) != address(0) && Name(_currentAdvocateId).originNameId() == msg.sender);

		// Set the new advocate
		require (_thought.setAdvocate(_newAdvocateId));

		emit SetThoughtAdvocate(_thoughtId, _currentAdvocateId, _newAdvocateId);
		return true;
	}

	/**
	 * @dev Set Thought's listener
	 * @param _thoughtId The ID of the Thought
	 * @param _newListenerId The new listener ID to be set
	 * @return true on success
	 */
	function setThoughtListener(address _thoughtId, address _newListenerId) public returns (bool) {
		Thought _thought = Thought(_thoughtId);

		// Make sure the Thought exist
		require (_thought.originNameId() != address(0) && _thought.thoughtTypeId() == 0);

		// Make sure the new Listener ID is a Name
		require (Name(_newListenerId).originNameId() != address(0) && Name(_newListenerId).thoughtTypeId() == 1);

		// Only Thought's current advocate can set new advocate
		require (_nameFactory.ethAddressToNameId(msg.sender) != address(0) && Name(_thought.advocateId()).originNameId() == msg.sender);

		// Set the new listener
		address _currentListenerId = _thought.listenerId();
		require (_thought.setListener(_newListenerId));

		emit SetThoughtListener(_thoughtId, _currentListenerId, _newListenerId);
		return true;
	}

	/**
	 * @dev Set Thought's speaker
	 * @param _thoughtId The ID of the Thought
	 * @param _newSpeakerId The new speaker ID to be set
	 * @return true on success
	 */
	function setThoughtSpeaker(address _thoughtId, address _newSpeakerId) public returns (bool) {
		Thought _thought = Thought(_thoughtId);

		// Make sure the Thought exist
		require (_thought.originNameId() != address(0) && _thought.thoughtTypeId() == 0);

		// Make sure the new Speaker ID is a Name
		require (Name(_newSpeakerId).originNameId() != address(0) && Name(_newSpeakerId).thoughtTypeId() == 1);

		// Only Thought's current advocate can set new advocate
		require (_nameFactory.ethAddressToNameId(msg.sender) != address(0) && Name(_thought.advocateId()).originNameId() == msg.sender);

		// Set the new speaker
		address _currentSpeakerId = _thought.speakerId();
		require (_thought.setSpeaker(_newSpeakerId));

		emit SetThoughtSpeaker(_thoughtId, _currentSpeakerId, _newSpeakerId);
		return true;
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

		// Make sure the Thought exist
		require (_thought.originNameId() != address(0) && _thought.thoughtTypeId() == 0);

		return (
			_thought.fromId(),
			_thought.throughId(),
			_thought.toId()
		);
	}

	/**
	 * @dev Get Thought's child Thoughts
	 * @param _thoughtId The ID of the Thought
	 * @param _from The starting index
	 * @param _to The ending index
	 * @return list of child Thought IDs
	 */
	function getChildThoughtIds(address _thoughtId, uint256 _from, uint256 _to) public view returns (address[]) {
		require (_from >= 0 && _to >= _from);

		Thought _thought = Thought(_thoughtId);

		// Make sure the Thought exist
		require (_thought.originNameId() != address(0) && _thought.thoughtTypeId() == 0);

		return _thought.getChildThoughtIds(_from, _to);
	}

	/**
	 * @dev Get Thought's child Thoughts total count
	 * @param _thoughtId The ID of the Thought
	 * @return total child Thoughts count
	 */
	function getTotalChildThoughtsCount(address _thoughtId) public view returns (uint256) {
		Thought _thought = Thought(_thoughtId);

		// Make sure the Thought exist
		require (_thought.originNameId() != address(0) && _thought.thoughtTypeId() == 0);

		return _thought.getTotalChildThoughtsCount();
	}

	/**
	 * @dev Get Thought's orphan Thoughts
	 * @param _thoughtId The ID of the Thought
	 * @param _from The starting index
	 * @param _to The ending index
	 * @return list of orphan Thought IDs
	 */
	function getOrphanThoughtIds(address _thoughtId, uint256 _from, uint256 _to) public view returns (address[]) {
		require (_from >= 0 && _to >= _from);

		Thought _thought = Thought(_thoughtId);

		// Make sure the Thought exist
		require (_thought.originNameId() != address(0) && _thought.thoughtTypeId() == 0);

		return _thought.getOrphanThoughtIds(_from, _to);
	}

	/**
	 * @dev Get Thought's orphan Thoughts total count
	 * @param _thoughtId The ID of the Thought
	 * @return total orphan Thoughts count
	 */
	function getTotalOrphanThoughtsCount(address _thoughtId) public view returns (uint256) {
		Thought _thought = Thought(_thoughtId);

		// Make sure the Thought exist
		require (_thought.originNameId() != address(0) && _thought.thoughtTypeId() == 0);

		return _thought.getTotalOrphanThoughtsCount();
	}
}
