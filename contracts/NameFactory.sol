pragma solidity ^0.4.24;

import './TheAO.sol';
import './SafeMath.sol';
import './AOLibrary.sol';
import './Name.sol';
import './Position.sol';
import './NameTAOLookup.sol';
import './NameTAOPosition.sol';
import './NamePublicKey.sol';

/**
 * @title NameFactory
 *
 * The purpose of this contract is to allow node to create Name
 */
contract NameFactory is TheAO {
	using SafeMath for uint256;

	address public positionAddress;
	address public nameTAOLookupAddress;
	address public nameTAOPositionAddress;
	address public namePublicKeyAddress;

	Position internal _position;
	NameTAOLookup internal _nameTAOLookup;
	NameTAOPosition internal _nameTAOPosition;
	NamePublicKey internal _namePublicKey;

	address[] internal names;

	// Mapping from eth address to Name ID
	mapping (address => address) public ethAddressToNameId;

	// Mapping from Name ID to its nonce
	mapping (address => uint256) public nonces;

	// Event to be broadcasted to public when a Name is created
	event CreateName(address indexed ethAddress, address nameId, uint256 index, string name);

	/**
	 * @dev Constructor function
	 */
	constructor(address _positionAddress) public {
		positionAddress = _positionAddress;
		_position = Position(positionAddress);
	}

	/**
	 * @dev Checks if calling address can update Name's nonce
	 */
	modifier canUpdateNonce {
		require (msg.sender == nameTAOPositionAddress || msg.sender == namePublicKeyAddress);
		_;
	}

	/***** The AO ONLY METHODS *****/
	/**
	 * @dev The AO set the NameTAOLookup Address
	 * @param _nameTAOLookupAddress The address of NameTAOLookup
	 */
	function setNameTAOLookupAddress(address _nameTAOLookupAddress) public onlyTheAO {
		require (_nameTAOLookupAddress != address(0));
		nameTAOLookupAddress = _nameTAOLookupAddress;
		_nameTAOLookup = NameTAOLookup(nameTAOLookupAddress);
	}

	/**
	 * @dev The AO set the NameTAOPosition Address
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	function setNameTAOPositionAddress(address _nameTAOPositionAddress) public onlyTheAO {
		require (_nameTAOPositionAddress != address(0));
		nameTAOPositionAddress = _nameTAOPositionAddress;
		_nameTAOPosition = NameTAOPosition(nameTAOPositionAddress);
	}

	/**
	 * @dev The AO set the NamePublicKey Address
	 * @param _namePublicKeyAddress The address of NamePublicKey
	 */
	function setNamePublicKeyAddress(address _namePublicKeyAddress) public onlyTheAO {
		require (_namePublicKeyAddress != address(0));
		namePublicKeyAddress = _namePublicKeyAddress;
		_namePublicKey = NamePublicKey(namePublicKeyAddress);
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Increment the nonce of a Name
	 * @param _nameId The ID of the Name
	 * @return current nonce
	 */
	function incrementNonce(address _nameId) public canUpdateNonce returns (uint256) {
		// Check if _nameId exist
		require (nonces[_nameId] > 0);
		nonces[_nameId]++;
		return nonces[_nameId];
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
		require (bytes(_name).length > 0);
		require (!_nameTAOLookup.isExist(_name));

		// Only one Name per ETH address
		require (ethAddressToNameId[msg.sender] == address(0));

		// The address is the Name ID (which is also a TAO ID)
		address nameId = new Name(_name, msg.sender, _datHash, _database, _keyValue, _contentId);

		// Increment the nonce
		nonces[nameId]++;

		ethAddressToNameId[msg.sender] = nameId;

		// Store the name lookup information
		require (_nameTAOLookup.add(_name, nameId, 'human', 1));

		// Store the Advocate/Listener/Speaker information
		require (_nameTAOPosition.add(nameId, nameId, nameId, nameId));

		// Store the public key information
		require (_namePublicKey.add(nameId, msg.sender));

		names.push(nameId);

		// Need to mint Position token for this Name
		require (_position.mintToken(nameId));

		emit CreateName(msg.sender, nameId, names.length.sub(1), _name);
	}

	/**
	 * @dev Get Name information
	 * @param _nameId The ID of the Name to be queried
	 * @return The name of the Name
	 * @return The originId of the Name (in this case, it's the creator node's ETH address)
	 * @return The datHash of the Name
	 * @return The database of the Name
	 * @return The keyValue of the Name
	 * @return The contentId of the Name
	 * @return The typeId of the Name
	 */
	function getName(address _nameId) public view returns (string, address, string, string, string, bytes32, uint8) {
		Name _name = Name(_nameId);
		return (
			_name.name(),
			_name.originId(),
			_name.datHash(),
			_name.database(),
			_name.keyValue(),
			_name.contentId(),
			_name.typeId()
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
		address _signatureAddress = AOLibrary.getValidateSignatureAddress(address(this), _data, _nonce, _signatureV, _signatureR, _signatureS);
		if (_validateAddress != address(0)) {
			return (
				_nonce == nonces[_nameId].add(1) &&
				_signatureAddress == _validateAddress &&
				_namePublicKey.isKeyExist(_nameId, _validateAddress)
			);
		} else {
			return (
				_nonce == nonces[_nameId].add(1) &&
				_signatureAddress == _namePublicKey.getDefaultKey(_nameId)
			);
		}
	}
}
