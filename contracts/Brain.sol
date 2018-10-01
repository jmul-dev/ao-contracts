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
	mapping (address => address) internal advocateIdToEthAddress;

	// Event to be broadcasted to public when a Name is created
	event CreateName(address creator, address thoughtId, uint256 index, string name);

	// Event to be broadcasted to public when current Advocate sets New Advocate for a Name
	event SetNameAdvocate(address thoughtId, address oldAdvocateId, address newAdvocateId);

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

		address newNameAddress = new Name(_name, msg.sender, _datHash, _database, _keyValue, _contentId);
		names.push(newNameAddress);

		Name newName = Name(newNameAddress);
		advocateIdToEthAddress[newName.advocateId()] = msg.sender;

		emit CreateName(msg.sender, newNameAddress, names.length.sub(1), _name);
		return true;
	}

	/**
	 * @dev Get Name information
	 * @param _thoughtId The thought ID of the Name to be queried
	 * @return The name of the Name
	 * @return The nameId of the Name (in this case, it's the creator ETH address)
	 * @return The advocateId of the Name
	 * @return The listenerId of the Name
	 * @return The speakerId of the Name
	 * @return The datHash of the Name
	 * @return The database of the Name
	 * @return The keyValue of the Name
	 * @return The contentId of the Name
	 * @return The thoughtTypeId of the Name
	 */
	function getName(address _thoughtId) public view returns (string, address, address, address, address, string, string, string, bytes32, uint8) {
		Name _name = Name(_thoughtId);
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
	 * @return total oNames count
	 */
	function getTotalNames() public view returns (uint256) {
		return names.length;
	}

	/**
	 * @dev Get list of Name's Thought IDs
	 * @param _from The starting index
	 * @param _to The ending index
	 * @return list of Name's Thought Ids
	 */
	function getNamesThoughtIds(uint256 _from, uint256 _to) public view returns (address[]) {
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
	 * @param _thoughtId The thought ID of the Name
	 * @param _newAdvocateId The new advocate ID to be set
	 * @return true on success
	 */
	function setNameAdvocate(address _thoughtId, address _newAdvocateId) public returns (bool) {
		Name _name = Name(_thoughtId);

		// Make sure the Name exist
		require (_name.originNameId() != address(0));

		// Make sure the new Advocate ID is a Name
		Name _newAdvocate = Name(_newAdvocateId);
		require (_newAdvocate.originNameId() != address(0));

		// Only Name's current advocate can set new advocate
		address _currentAdvocateId = _name.advocateId();
		require (advocateIdToEthAddress[_currentAdvocateId] == msg.sender);

		// Set the new advocate
		require (_name.setAdvocate(_newAdvocateId));

		emit SetNameAdvocate(_thoughtId, _currentAdvocateId, _newAdvocateId);
		return true;
	}
}
