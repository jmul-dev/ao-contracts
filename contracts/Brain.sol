pragma solidity ^0.4.24;

import './Thought.sol';
import './Name.sol';
import './SafeMath.sol';

/**
 * @title Brain
 *
 * The purpose of this contract is to allow node to create Thought/Name
 */
contract Brain {
	using SafeMath for uint256;

	/**
	 * Since Name is a Thought and TAO is also a Thought,
	 * `thoughts`, `names` and `taos` are basically collection of Thought IDs
	 */
	address[] internal thoughts;
	address[] internal names;
	address[] internal taos;

	mapping (string => bool) internal originNames;

	// Event to be broadcasted to public when a Name is created
	event CreateName(address creator, address nameId, uint256 index, string name);

	// Event to be broadcasted to public when current Advocate sets New Advocate for a Name
	event SetNameAdvocate(address nameId, address oldAdvocateId, address newAdvocateId);

	// Event to be broadcasted to public when current Advocate sets New Listener for a Name
	event SetNameListener(address nameId, address oldListenerId, address newListenerId);

	// Event to be broadcasted to public when current Advocate sets New Speaker for a Name
	event SetNameSpeaker(address nameId, address oldSpeakerId, address newSpeakerId);

	// Event to be broadcasted to public when Advocate creates a Thought
	event CreateThought(address creator, address advocateId, address thoughtId, uint256 index);

	// Event to be broadcasted to public when current Advocate sets New Advocate for a Thought
	event SetThoughtAdvocate(address thoughtId, address oldAdvocateId, address newAdvocateId);

	// Event to be broadcasted to public when current Advocate sets New Listener for a Thought
	event SetThoughtListener(address thoughtId, address oldListenerId, address newListenerId);

	// Event to be broadcasted to public when current Advocate sets New Speaker for a Thought
	event SetThoughtSpeaker(address thoughtId, address oldSpeakerId, address newSpeakerId);

	constructor() public {}

	/**
	 * @dev Check whether or not `_name` is taken
	 * @param _name The value to be checked
	 * @return true if taken, false otherwise
	 */
	function isNameTaken(string _name) public view returns (bool) {
		return originNames[_name];
	}

	/**
	 * @dev Create a Name
	 * @param _name The name of the Name
	 * @param _datHash The datHash to this Name's profile
	 * @param _database The database for this Name
	 * @param _keyValue The key/value pair to be checked on the database
	 * @param _contentId The contentId related to this Name
	 * @return true on success
	 */
	function createName(string _name, string _datHash, string _database, string _keyValue, bytes32 _contentId) public returns (bool) {
		require (isNameTaken(_name) == false);

		originNames[_name] = true;

		// The address is the Name ID (which is also a Thought ID)
		address nameId = new Name(_name, msg.sender, _datHash, _database, _keyValue, _contentId);
		names.push(nameId);

		emit CreateName(msg.sender, nameId, names.length.sub(1), _name);
		return true;
	}

	/**
	 * @dev Get Name information
	 * @param _nameId The ID of the Name to be queried
	 * @return The name of the Name
	 * @return The nameId of the Name (in this case, it's the creator node's ETH address)
	 * @return The advocateId of the Name
	 * @return The listenerId of the Name
	 * @return The speakerId of the Name
	 * @return The datHash of the Name
	 * @return The database of the Name
	 * @return The keyValue of the Name
	 * @return The contentId of the Name
	 * @return The thoughtTypeId of the Name
	 */
	function getName(address _nameId) public view returns (string, address, address, address, address, string, string, string, bytes32, uint8) {
		Name _name = Name(_nameId);
		return (
			_name.originName(),
			_name.originNameId(),
			_name.advocateId(),
			_name.listenerId(),
			_name.speakerId(),
			_name.datHash(),
			_name.database(),
			_name.keyValue(),
			_name.contentId(),
			_name.thoughtTypeId()
		);
	}

	/**
	 * @dev Get total Names
	 * @return total Names count
	 */
	function getTotalNames() public view returns (uint256) {
		return names.length;
	}

	/**
	 * @dev Get list of Name IDs (or Thought IDs)
	 * @param _from The starting index
	 * @param _to The ending index
	 * @return list of Name IDs
	 */
	function getNameIds(uint256 _from, uint256 _to) public view returns (address[]) {
		require (_from >= 0 && _to >= _from);
		address[] memory _names = new address[](_to.sub(_from).add(1));
		if (_to > names.length.sub(1)) {
			_to = names.length.sub(1);
		}
		for (uint256 i = _from; i <= _to; i++) {
			_names[i.sub(_from)] = names[i];
		}
		return _names;
	}

	/**
	 * @dev Set Name's advocate
	 * @param _nameId The ID of the Name
	 * @param _newAdvocateId The new advocate ID to be set
	 * @return true on success
	 */
	function setNameAdvocate(address _nameId, address _newAdvocateId) public returns (bool) {
		Name _name = Name(_nameId);

		// Make sure the Name exist
		require (_name.originNameId() != address(0) && _name.thoughtTypeId() == 1);

		// Make sure the new Advocate ID is a Name
		Name _newAdvocate = Name(_newAdvocateId);
		require (_newAdvocate.originNameId() != address(0) && _newAdvocate.thoughtTypeId() == 1);

		// Only Name's current advocate can set new advocate
		address _currentAdvocateId = _name.advocateId();
		require (_name.originNameId() == msg.sender);

		// Set the new advocate
		require (_name.setAdvocate(_newAdvocateId));

		emit SetNameAdvocate(_nameId, _currentAdvocateId, _newAdvocateId);
		return true;
	}

	/**
	 * @dev Set Name's listener
	 * @param _nameId The ID of the Name
	 * @param _newListenerId The new listener ID to be set
	 * @return true on success
	 */
	function setNameListener(address _nameId, address _newListenerId) public returns (bool) {
		Name _name = Name(_nameId);

		// Make sure the Name exist
		require (_name.originNameId() != address(0) && _name.thoughtTypeId() == 1);

		// Make sure the new Listener ID is a Name
		Name _newListener = Name(_newListenerId);
		require (_newListener.originNameId() != address(0) && _newListener.thoughtTypeId() == 1);

		// Only Name's current advocate can set new advocate
		require (Name(_name.advocateId()).originNameId() == msg.sender);

		// Set the new listener
		address _currentListenerId = _name.listenerId();
		require (_name.setListener(_newListenerId));

		emit SetNameListener(_nameId, _currentListenerId, _newListenerId);
		return true;
	}

	/**
	 * @dev Set Name's speaker
	 * @param _nameId The ID of the Name
	 * @param _newSpeakerId The new speaker ID to be set
	 * @return true on success
	 */
	function setNameSpeaker(address _nameId, address _newSpeakerId) public returns (bool) {
		Name _name = Name(_nameId);

		// Make sure the Name exist
		require (_name.originNameId() != address(0) && _name.thoughtTypeId() == 1);

		// Make sure the new Speaker ID is a Name
		Name _newSpeaker = Name(_newSpeakerId);
		require (_newSpeaker.originNameId() != address(0) && _newSpeaker.thoughtTypeId() == 1);

		// Only Name's current advocate can set new advocate
		require (Name(_name.advocateId()).originNameId() == msg.sender);

		// Set the new speaker
		address _currentSpeakerId = _name.speakerId();
		require (_name.setSpeaker(_newSpeakerId));

		emit SetNameSpeaker(_nameId, _currentSpeakerId, _newSpeakerId);
		return true;
	}

	/**
	 * @dev Name creates a Thought
	 * @param _advocateId The advocate ID that creates this Thought
	 * @param _datHash The datHash of this Thought
	 * @param _database The database for this Thought
	 * @param _keyValue The key/value pair to be checked on the database
	 * @param _contentId The contentId related to this Thought
	 * @return true on success
	 */
	function createThought(address _advocateId, string _datHash, string _database, string _keyValue, bytes32 _contentId) public returns (bool) {
		Name _advocate = Name(_advocateId);

		// Make sure the Advocate exist
		require (_advocate.originNameId() != address(0) && _advocate.thoughtTypeId() == 1);

		// Make sure Advocate is the msg.sender
		require (_advocate.originNameId() == msg.sender);

		address thoughtId = new Thought(_advocate.originName(), _advocateId, _advocateId, _datHash, _database, _keyValue, _contentId, _advocateId);
		thoughts.push(thoughtId);

		emit CreateThought(msg.sender, _advocateId, thoughtId, thoughts.length.sub(1));
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
	 * @dev Get total Thoughts
	 * @return total Thoughts count
	 */
	function getTotalThoughts() public view returns (uint256) {
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
		Name _newAdvocate = Name(_newAdvocateId);
		require (_newAdvocate.originNameId() != address(0) && _newAdvocate.thoughtTypeId() == 1);

		// Only Thought's current advocate can set new advocate
		address _currentAdvocateId = _thought.advocateId();
		require (Name(_currentAdvocateId).originNameId() == msg.sender);

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
		Name _newListener = Name(_newListenerId);
		require (_newListener.originNameId() != address(0) && _newListener.thoughtTypeId() == 1);

		// Only Thought's current advocate can set new advocate
		require (Name(_thought.advocateId()).originNameId() == msg.sender);

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
		Name _newSpeaker = Name(_newSpeakerId);
		require (_newSpeaker.originNameId() != address(0) && _newSpeaker.thoughtTypeId() == 1);

		// Only Thought's current advocate can set new advocate
		require (Name(_thought.advocateId()).originNameId() == msg.sender);

		// Set the new speaker
		address _currentSpeakerId = _thought.speakerId();
		require (_thought.setSpeaker(_newSpeakerId));

		emit SetThoughtSpeaker(_thoughtId, _currentSpeakerId, _newSpeakerId);
		return true;
	}
}
