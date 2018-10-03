pragma solidity ^0.4.24;

import './Name.sol';
import './SafeMath.sol';

/**
 * @title NameFactory
 *
 * The purpose of this contract is to allow node to create Name
 */
contract NameFactory {
	using SafeMath for uint256;

	address[] internal names;

	mapping (bytes32 => bool) internal originNames;
	mapping (address => address) public ethAddressToNameId;

	// Event to be broadcasted to public when a Name is created
	event CreateName(address creator, address nameId, uint256 index, string name);

	// Event to be broadcasted to public when current Advocate sets New Advocate for a Name
	event SetNameAdvocate(address nameId, address oldAdvocateId, address newAdvocateId);

	// Event to be broadcasted to public when current Advocate sets New Listener for a Name
	event SetNameListener(address nameId, address oldListenerId, address newListenerId);

	// Event to be broadcasted to public when current Advocate sets New Speaker for a Name
	event SetNameSpeaker(address nameId, address oldSpeakerId, address newSpeakerId);

	constructor() public {}

	/**
	 * @dev Check whether or not `_name` is taken
	 * @param _name The value to be checked
	 * @return true if taken, false otherwise
	 */
	function isNameTaken(string _name) public view returns (bool) {
		return originNames[keccak256(abi.encodePacked(_name))];
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
		// Only one Name per ETH address
		require (ethAddressToNameId[msg.sender] == address(0));

		originNames[keccak256(abi.encodePacked(_name))] = true;

		// The address is the Name ID (which is also a Thought ID)
		address nameId = new Name(_name, msg.sender, _datHash, _database, _keyValue, _contentId);
		ethAddressToNameId[msg.sender] = nameId;
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
}
