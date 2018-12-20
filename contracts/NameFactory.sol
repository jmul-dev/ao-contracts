pragma solidity ^0.4.24;

import './developed.sol';
import './SafeMath.sol';
import './AOLibrary.sol';
import './Position.sol';
import './Name.sol';
import './TAOFactory.sol';
import './NameTAOLookup.sol';

/**
 * @title NameFactory
 *
 * The purpose of this contract is to allow node to create Name
 */
contract NameFactory is developed {
	using SafeMath for uint256;

	address public positionAddress;
	address public taoFactoryAddress;
	address public nameTAOLookupAddress;

	Position internal _position;
	TAOFactory internal _taoFactory;
	NameTAOLookup internal _nameTAOLookup;

	address[] internal names;

	mapping (address => address) public ethAddressToNameId;

	// Event to be broadcasted to public when a Name is created
	event CreateName(address indexed ethAddress, address nameId, uint256 index, string name);

	// Event to be broadcasted to public when current Advocate sets New Listener for a Name
	event SetNameListener(address indexed nameId, address oldListenerId, address newListenerId, uint256 nonce);

	// Event to be broadcasted to public when current Advocate sets New Speaker for a Name
	event SetNameSpeaker(address indexed nameId, address oldSpeakerId, address newSpeakerId, uint256 nonce);

	// Event to be broadcasted to public when a publicKey is added to a Name
	event AddNamePublicKey(address indexed nameId, address publicKey, uint256 nonce);

	// Event to be broadcasted to public when a publicKey is deleted from a Name
	event DeleteNamePublicKey(address indexed nameId, address publicKey, uint256 nonce);

	// Event to be broadcasted to public when a publicKey is set as default for a Name
	event SetNameDefaultPublicKey(address indexed nameId, address publicKey, uint256 nonce);

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
	 *		is the same as the Name's Origin ID
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

	/***** DEVELOPER ONLY METHODS *****/
	/**
	 * @dev Developer set the TAO Factory Address
	 * @param _taoFactoryAddress The address of TAOFactory
	 */
	function setTAOFactoryAddress(address _taoFactoryAddress) public onlyDeveloper {
		require (_taoFactoryAddress != address(0));
		taoFactoryAddress = _taoFactoryAddress;
		_taoFactory = TAOFactory(taoFactoryAddress);
	}

	/**
	 * @dev Developer set the NameTAOLookup Address
	 * @param _nameTAOLookupAddress The address of NameTAOLookup
	 */
	function setNameTAOLookupAddress(address _nameTAOLookupAddress) public onlyDeveloper {
		require (_nameTAOLookupAddress != address(0));
		nameTAOLookupAddress = _nameTAOLookupAddress;
		_nameTAOLookup = NameTAOLookup(nameTAOLookupAddress);
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Create a Name
	 * @param _name The name of the Name
	 * @param _datHash The datHash to this Name's profile
	 * @param _database The database for this Name
	 * @param _keyValue The key/value pair to be checked on the database
	 * @param _contentId The contentId related to this Name
	 */
	function createName(string _name, string _datHash, string _database, string _keyValue, bytes32 _contentId) public {
		require (bytes(_name).length > 0);
		require (!_nameTAOLookup.isExist(_name));
		// Only one Name per ETH address
		require (ethAddressToNameId[msg.sender] == address(0));

		// The address is the Name ID (which is also a TAO ID)
		address nameId = new Name(_name, msg.sender, _datHash, _database, _keyValue, _contentId);
		ethAddressToNameId[msg.sender] = nameId;
		require (_nameTAOLookup.add(_name, nameId, 'human', 1));
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
	 * @return The typeId of the Name
	 * @return The defaultPublicKey of the Name
	 * @return The current nonce of the Name
	 */
	function getName(address _nameId) public view returns (string, address, string, string, string, bytes32, uint8, address, uint256) {
		Name _name = Name(_nameId);
		return (
			_name.name(),
			_name.originId(),
			_name.datHash(),
			_name.database(),
			_name.keyValue(),
			_name.contentId(),
			_name.typeId(),
			_name.defaultPublicKey(),
			_name.nonce()
		);
	}

	/**
	 * @dev Given a Name ID, wants to get the Name's Position, i.e Advocate/Listener/Speaker
	 * @param _nameId The ID of the Name
	 * @return The advocateId of the Name
	 * @return The advocate's name of the Name
	 * @return The listenerId of the Name
	 * @return The listener's name of the Name
	 * @return The speakerId of the Name
	 * @return The speaker's name of the Name
	 */
	function getNamePosition(address _nameId) public view returns (address, string, address, string, address, string) {
		Name _name = Name(_nameId);
		return (
			_name.advocateId(),
			Name(_name.advocateId()).name(),
			_name.listenerId(),
			Name(_name.listenerId()).name(),
			_name.speakerId(),
			Name(_name.speakerId()).name()
		);
	}

	/**
	 * @dev Get total Names count
	 * @return total Names count
	 */
	function getTotalNamesCount() public view returns (uint256) {
		return names.length;
	}

	/**
	 * @dev Get list of Name IDs
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
		uint256 _nonce = _name.setListener(_newListenerId);
		require (_nonce > 0);

		emit SetNameListener(_nameId, _currentListenerId, _newListenerId, _nonce);
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
		uint256 _nonce = _name.setSpeaker(_newSpeakerId);
		require (_nonce > 0);

		emit SetNameSpeaker(_nameId, _currentSpeakerId, _newSpeakerId, _nonce);
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
	function getNameTotalPublicKeysCount(address _nameId) public isName(_nameId) view returns (uint256) {
		return Name(_nameId).getTotalPublicKeysCount();
	}

	/**
	 * @dev Get list of publicKeys of a Name
	 * @param _nameId The ID of the Name
	 * @param _from The starting index
	 * @param _to The ending index
	 * @return list of publicKeys
	 */
	function getNamePublicKeys(address _nameId, uint256 _from, uint256 _to) public isName(_nameId) view returns (address[]) {
		return Name(_nameId).getPublicKeys(_from, _to);
	}

	/**
	 * @dev Check whether or not a publicKey exist in a Name
	 * @param _nameId The ID of the Name
	 * @param _publicKey The publicKey to check
	 * @return true if yes. false otherwise
	 */
	function isNamePublicKeyExist(address _nameId, address _publicKey) public isName(_nameId) view returns (bool) {
		return Name(_nameId).isPublicKeyExist(_publicKey);
	}

	/**
	 * @dev Add publicKey for a Name
	 * @param _nameId The ID of the Name
	 * @param _publicKey The publicKey to be added
	 */
	function addNamePublicKey(address _nameId, address _publicKey) public isName(_nameId) onlyAdvocateOfName(_nameId) {
		uint256 _nonce = Name(_nameId).addPublicKey(_publicKey);
		require (_nonce > 0);
		emit AddNamePublicKey(_nameId, _publicKey, _nonce);
	}

	/**
	 * @dev Delete publicKey from a Name
	 * @param _nameId The ID of the Name
	 * @param _publicKey The publicKey to be deleted
	 */
	function deleteNamePublicKey(address _nameId, address _publicKey) public isName(_nameId) onlyAdvocateOfName(_nameId) {
		uint256 _nonce = Name(_nameId).deletePublicKey(_publicKey);
		require (_nonce > 0);
		emit DeleteNamePublicKey(_nameId, _publicKey, _nonce);
	}

	/**
	 * @dev Set a publicKey as the default for a Name
	 * @param _nameId The ID of the Name
	 * @param _publicKey The publicKey to be set
	 * @param _signatureV The V part of the signature for this update
	 * @param _signatureR The R part of the signature for this update
	 * @param _signatureS The S part of the signature for this update
	 */
	function setNameDefaultPublicKey(address _nameId, address _publicKey, uint8 _signatureV, bytes32 _signatureR, bytes32 _signatureS) public isName(_nameId) onlyAdvocateOfName(_nameId) {
		bytes32 _hash = keccak256(abi.encodePacked(address(this), _nameId, _publicKey));
		require (ecrecover(_hash, _signatureV, _signatureR, _signatureS) == msg.sender);
		uint256 _nonce = Name(_nameId).setDefaultPublicKey(_publicKey);
		require (_nonce > 0);
		emit SetNameDefaultPublicKey(_nameId, _publicKey, _nonce);
	}

	/**
	 * @dev Check whether or not the signature is valid
	 * @param _data The signed string data
	 * @param _nonce The signed uint256 nonce (should be Name's current nonce + 1)
	 * @param _validateAddress The ETH address to be validated (optional)
	 * @param _name The name of the Name
	 * @param _signatureV The V part of the signature
	 * @param _signatureR The R part of the signature
	 * @param _signatureS The S part of the signature
	 * @return true if valid. false otherwise
	 */
	function validateNameSignature(
		string _data,
		uint256 _nonce,
		address _validateAddress,
		string _name,
		uint8 _signatureV,
		bytes32 _signatureR,
		bytes32 _signatureS
	) public view returns (bool) {
		require (_nameTAOLookup.isExist(_name));
		address _nameId = _nameTAOLookup.getAddressByName(_name);
		Name name = Name(_nameId);
		address _signatureAddress = AOLibrary.getValidateSignatureAddress(address(this), _data, _nonce, _signatureV, _signatureR, _signatureS);
		if (_validateAddress != address(0)) {
			return (
				_nonce == name.nonce().add(1) &&
				_signatureAddress == _validateAddress &&
				name.isPublicKeyExist(_validateAddress)
			);
		} else {
			return (
				_nonce == name.nonce().add(1) &&
				_signatureAddress == name.defaultPublicKey()
			);
		}
	}
}
