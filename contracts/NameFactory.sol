pragma solidity ^0.4.24;

import './SafeMath.sol';
import './AOLibrary.sol';
import './Position.sol';
import './Name.sol';

/**
 * @title NameFactory
 *
 * The purpose of this contract is to allow node to create Name
 */
contract NameFactory {
	using SafeMath for uint256;

	address public positionAddress;

	Position internal _position;

	address[] internal names;

	mapping (bytes32 => address) internal originNamesLookup;
	mapping (address => address) public ethAddressToNameId;

	// Event to be broadcasted to public when a Name is created
	event CreateName(address ethAddress, address nameId, uint256 index, string name);

	// Event to be broadcasted to public when current Advocate sets New Listener for a Name
	event SetNameListener(address nameId, address oldListenerId, address newListenerId);

	// Event to be broadcasted to public when current Advocate sets New Speaker for a Name
	event SetNameSpeaker(address nameId, address oldSpeakerId, address newSpeakerId);

	// Event to be broadcasted to public when a publicKey is added
	event AddNamePublicKey(address publicKey, uint256 nonce);

	// Event to be broadcasted to public when a publicKey is deleted
	event DeleteNamePublicKey(address publicKey, uint256 nonce);

	// Event to be broadcasted to public when setting a defaut publicKey
	event SetNameDefaultPublicKey(address publicKey, uint256 nonce);

	/**
	 * @dev Constructor function
	 */
	constructor(address _positionAddress) public {
		positionAddress = _positionAddress;
		_position = Position(positionAddress);
	}

	/**
	 * @dev Check if `_nameId` is a Name
	 */
	modifier isName(address _nameId) {
		require (AOLibrary.isName(_nameId));
		_;
	}

	/**
	 * @dev Check if msg.sender address is the current advocate of a `_nameId`.
	 *		Since there is no way to change the Advocate of a Name, the Advocate's eth address
	 *		is the same as the Name's Origin Name ID
	 */
	modifier onlyAdvocateOfName(address _nameId) {
		require (AOLibrary.isAdvocateOfName(msg.sender, _nameId));
		_;
	}

	/**
	 * @dev Check is msg.sender address is a Name
	 */
	 modifier senderIsName() {
		require (ethAddressToNameId[msg.sender] != address(0));
		_;
	 }

	/**
	 * @dev Check whether or not `_name` is taken
	 * @param _name The value to be checked
	 * @return true if taken, false otherwise
	 */
	function isNameTaken(string _name) public view returns (bool) {
		return (originNamesLookup[keccak256(abi.encodePacked(_name))] != address(0));
	}

	/**
	 * @dev Create a Name
	 * @param _name The name of the Name
	 * @param _datHash The datHash to this Name's profile
	 * @param _database The database for this Name
	 * @param _keyValue The key/value pair to be checked on the database
	 * @param _contentId The contentId related to this Name
	 */
	function createName(string _name, string _datHash, string _database, string _keyValue, bytes32 _contentId) public {
		require (isNameTaken(_name) == false);
		// Only one Name per ETH address
		require (ethAddressToNameId[msg.sender] == address(0));

		// The address is the Name ID (which is also a Thought ID)
		address nameId = new Name(_name, msg.sender, _datHash, _database, _keyValue, _contentId);
		ethAddressToNameId[msg.sender] = nameId;
		originNamesLookup[keccak256(abi.encodePacked(_name))] = nameId;
		names.push(nameId);

		// Need to mint Position token for this Name
		require (_position.mintToken(nameId));

		emit CreateName(msg.sender, nameId, names.length.sub(1), _name);
	}

	/**
	 * @dev Get Name information
	 * @param _nameId The ID of the Name to be queried
	 * @return The name of the Name
	 * @return The nameId of the Name (in this case, it's the creator node's ETH address)
	 * @return The datHash of the Name
	 * @return The database of the Name
	 * @return The keyValue of the Name
	 * @return The contentId of the Name
	 * @return The thoughtTypeId of the Name
	 * @return The defaultPublicKey of the Name
	 * @return The current nonce of the Name
	 */
	function getName(address _nameId) public view returns (string, address, string, string, string, bytes32, uint8, address, uint256) {
		Name _name = Name(_nameId);
		return (
			_name.originName(),
			_name.originNameId(),
			_name.datHash(),
			_name.database(),
			_name.keyValue(),
			_name.contentId(),
			_name.thoughtTypeId(),
			_name.defaultPublicKey(),
			_name.nonce()
		);
	}

	/**
	 * @dev Given a Name ID, wants to get the Name's Position, i.e Advocate/Listener/Speaker
	 * @param _nameId The ID of the Name
	 * @return The advocateId of the Name
	 * @return The listenerId of the Name
	 * @return The speakerId of the Name
	 */
	function getNamePosition(address _nameId) public view returns (address, address, address) {
		Name _name = Name(_nameId);
		return (
			_name.advocateId(),
			_name.listenerId(),
			_name.speakerId()
		);
	}

	/**
	 * @dev Get the nameId given a username
	 * @param _name The username  to check
	 * @return nameId of the username
	 */
	function getNameIdByOriginName(string _name) public view returns (address) {
		return originNamesLookup[keccak256(abi.encodePacked(_name))];
	}

	/**
	 * @dev Get total Names count
	 * @return total Names count
	 */
	function getTotalNamesCount() public view returns (uint256) {
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
		require (names.length > 0);

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
	 */
	function setNameListener(address _nameId, address _newListenerId) public isName(_nameId) isName(_newListenerId) onlyAdvocateOfName(_nameId) {
		Name _name = Name(_nameId);
		// Set the new listener
		address _currentListenerId = _name.listenerId();
		require (_name.setListener(_newListenerId));

		emit SetNameListener(_nameId, _currentListenerId, _newListenerId);
	}

	/**
	 * @dev Set Name's speaker
	 * @param _nameId The ID of the Name
	 * @param _newSpeakerId The new speaker ID to be set
	 */
	function setNameSpeaker(address _nameId, address _newSpeakerId) public isName(_nameId) isName(_newSpeakerId) onlyAdvocateOfName(_nameId) {
		Name _name = Name(_nameId);
		// Set the new speaker
		address _currentSpeakerId = _name.speakerId();
		require (_name.setSpeaker(_newSpeakerId));

		emit SetNameSpeaker(_nameId, _currentSpeakerId, _newSpeakerId);
	}

	/**
	 * @dev Get Name's relationship
	 * @param _nameId The ID of the Name
	 * @return fromId (Origin of the Name)
	 * @return throughId
	 * @return toId (Destination of the Name)
	 */
	function getNameRelationship(address _nameId) public view returns (address, address, address) {
		Name _name = Name(_nameId);
		return (
			_name.fromId(),
			_name.throughId(),
			_name.toId()
		);
	}

	/**
	 * @dev Get Name's publicKeys total count
	 * @param _nameId The ID of the Name
	 * @return total publicKeys count
	 */
	function getTotalPublicKeysCount(address _nameId) public isName(_nameId) view returns (uint256) {
		return Name(_nameId).getTotalPublicKeysCount();
	}

}
