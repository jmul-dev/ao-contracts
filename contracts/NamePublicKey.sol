pragma solidity >=0.5.4 <0.6.0;

import './SafeMath.sol';
import './AOLibrary.sol';
import './TheAO.sol';
import './INamePublicKey.sol';
import './INameFactory.sol';
import './INameTAOPosition.sol';
import './INameAccountRecovery.sol';

/**
 * @title NamePublicKey
 */
contract NamePublicKey is TheAO, INamePublicKey {
	using SafeMath for uint256;

	address public nameFactoryAddress;
	address public nameAccountRecoveryAddress;

	INameFactory internal _nameFactory;
	INameTAOPosition internal _nameTAOPosition;
	INameAccountRecovery internal _nameAccountRecovery;

	struct PublicKey {
		bool created;
		address defaultKey;
		address writerKey;
		address[] keys;
	}

	// Mapping from nameId to its PublicKey
	mapping (address => PublicKey) internal publicKeys;

	// Mapping from key to nameId
	mapping (address => address) public keyToNameId;

	// Event to be broadcasted to public when a publicKey is added to a Name
	event AddKey(address indexed nameId, address publicKey, uint256 nonce);

	// Event to be broadcasted to public when a publicKey is removed from a Name
	event RemoveKey(address indexed nameId, address publicKey, uint256 nonce);

	// Event to be broadcasted to public when a publicKey is set as default for a Name
	event SetDefaultKey(address indexed nameId, address publicKey, uint256 nonce);

	// Event to be broadcasted to public when a publicKey is set as writer for a Name
	event SetWriterKey(address indexed nameId, address publicKey, uint256 nonce);

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress, address _nameTAOPositionAddress) public {
		setNameFactoryAddress(_nameFactoryAddress);
		setNameTAOPositionAddress(_nameTAOPositionAddress);
	}

	/**
	 * @dev Checks if the calling contract address is The AO
	 *		OR
	 *		If The AO is set to a Name/TAO, then check if calling address is the Advocate
	 */
	modifier onlyTheAO {
		require (AOLibrary.isTheAO(msg.sender, theAO, nameTAOPositionAddress));
		_;
	}

	/**
	 * @dev Check if calling address is Factory
	 */
	modifier onlyFactory {
		require (msg.sender == nameFactoryAddress);
		_;
	}

	/**
	 * @dev Check if `_nameId` is a Name
	 */
	modifier isName(address _nameId) {
		require (AOLibrary.isName(_nameId));
		_;
	}

	/**
	 * @dev Check if msg.sender is the current advocate of Name ID
	 */
	modifier onlyAdvocate(address _id) {
		require (_nameTAOPosition.senderIsAdvocate(msg.sender, _id));
		_;
	}

	/**
	 * @dev Only allowed if sender's Name is not compromised
	 */
	modifier senderNameNotCompromised() {
		require (!_nameAccountRecovery.isCompromised(_nameFactory.ethAddressToNameId(msg.sender)));
		_;
	}

	/**
	 * @dev Check if `_key` is not yet taken
	 */
	modifier keyNotTaken(address _key) {
		require (_key != address(0) && keyToNameId[_key] == address(0));
		_;
	}

	/***** The AO ONLY METHODS *****/
	/**
	 * @dev Transfer ownership of The AO to new address
	 * @param _theAO The new address to be transferred
	 */
	function transferOwnership(address _theAO) public onlyTheAO {
		require (_theAO != address(0));
		theAO = _theAO;
	}

	/**
	 * @dev Whitelist `_account` address to transact on behalf of others
	 * @param _account The address to whitelist
	 * @param _whitelist Either to whitelist or not
	 */
	function setWhitelist(address _account, bool _whitelist) public onlyTheAO {
		require (_account != address(0));
		whitelist[_account] = _whitelist;
	}

	/**
	 * @dev The AO sets NameFactory address
	 * @param _nameFactoryAddress The address of NameFactory
	 */
	function setNameFactoryAddress(address _nameFactoryAddress) public onlyTheAO {
		require (_nameFactoryAddress != address(0));
		nameFactoryAddress = _nameFactoryAddress;
		_nameFactory = INameFactory(_nameFactoryAddress);
	}

	/**
	 * @dev The AO sets NameTAOPosition address
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	function setNameTAOPositionAddress(address _nameTAOPositionAddress) public onlyTheAO {
		require (_nameTAOPositionAddress != address(0));
		nameTAOPositionAddress = _nameTAOPositionAddress;
		_nameTAOPosition = INameTAOPosition(_nameTAOPositionAddress);
	}

	/**
	 * @dev The AO set the NameAccountRecovery Address
	 * @param _nameAccountRecoveryAddress The address of NameAccountRecovery
	 */
	function setNameAccountRecoveryAddress(address _nameAccountRecoveryAddress) public onlyTheAO {
		require (_nameAccountRecoveryAddress != address(0));
		nameAccountRecoveryAddress = _nameAccountRecoveryAddress;
		_nameAccountRecovery = INameAccountRecovery(nameAccountRecoveryAddress);
	}

	/**
	 * @dev Whitelisted address add publicKey to list for a Name
	 * @param _id The ID of the Name
	 * @param _key The publicKey to be added
	 * @return true on success
	 */
	function whitelistAddKey(address _id, address _key) external isName(_id) keyNotTaken(_key) inWhitelist returns (bool) {
		require (_addKey(_id, _key));
		return true;
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Check whether or not a Name ID exist in the list of Public Keys
	 * @param _id The ID to be checked
	 * @return true if yes, false otherwise
	 */
	function isExist(address _id) public view returns (bool) {
		return publicKeys[_id].created;
	}

	/**
	 * @dev Store the PublicKey info for a Name
	 * @param _id The ID of the Name
	 * @param _defaultKey The default public key for this Name
	 * @param _writerKey The writer public key for this Name
	 * @return true on success
	 */
	function initialize(address _id, address _defaultKey, address _writerKey)
		external
		isName(_id)
		keyNotTaken(_defaultKey)
		keyNotTaken(_writerKey)
		onlyFactory returns (bool) {
		require (!isExist(_id));

		keyToNameId[_defaultKey] = _id;
		if (_defaultKey != _writerKey) {
			keyToNameId[_writerKey] = _id;
		}
		PublicKey storage _publicKey = publicKeys[_id];
		_publicKey.created = true;
		_publicKey.defaultKey = _defaultKey;
		_publicKey.writerKey = _writerKey;
		_publicKey.keys.push(_defaultKey);
		if (_defaultKey != _writerKey) {
			_publicKey.keys.push(_writerKey);
		}
		return true;
	}

	/**
	 * @dev Get total publicKeys count for a Name
	 * @param _id The ID of the Name
	 * @return total publicKeys count
	 */
	function getTotalPublicKeysCount(address _id) public isName(_id) view returns (uint256) {
		require (isExist(_id));
		return publicKeys[_id].keys.length;
	}

	/**
	 * @dev Check whether or not a publicKey exist in the list for a Name
	 * @param _id The ID of the Name
	 * @param _key The publicKey to check
	 * @return true if yes. false otherwise
	 */
	function isKeyExist(address _id, address _key) isName(_id) external view returns (bool) {
		require (isExist(_id));
		require (_key != address(0));
		return keyToNameId[_key] == _id;
	}

	/**
	 * @dev Add publicKey to list for a Name
	 * @param _id The ID of the Name
	 * @param _key The publicKey to be added
	 * @param _nonce The signed uint256 nonce (should be Name's current nonce + 1)
	 * @param _signatureV The V part of the signature
	 * @param _signatureR The R part of the signature
	 * @param _signatureS The S part of the signature
	 */
	function addKey(address _id,
		address _key,
		uint256 _nonce,
		uint8 _signatureV,
		bytes32 _signatureR,
		bytes32 _signatureS
	) public isName(_id) onlyAdvocate(_id) keyNotTaken(_key) senderNameNotCompromised {
		require (_nonce == _nameFactory.nonces(_id).add(1));
		bytes32 _hash = keccak256(abi.encodePacked(address(this), _id, _key, _nonce));
		require (ecrecover(_hash, _signatureV, _signatureR, _signatureS) == _key);
		require (_addKey(_id, _key));
	}

	/**
	 * @dev Get default public key of a Name
	 * @param _id The ID of the Name
	 * @return the default public key
	 */
	function getDefaultKey(address _id) external isName(_id) view returns (address) {
		require (isExist(_id));
		return publicKeys[_id].defaultKey;
	}

	/**
	 * @dev Get writer public key of a Name
	 * @param _id The ID of the Name
	 * @return the writer public key
	 */
	function getWriterKey(address _id) external isName(_id) view returns (address) {
		require (isExist(_id));
		return publicKeys[_id].writerKey;
	}

	/**
	 * @dev Check whether or not a key is Name's writerKey
	 * @param _id The ID of the Name
	 * @param _key The key to be checked
	 * @return true if yes, false otherwise
	 */
	function isNameWriterKey(address _id, address _key) public isName(_id) view returns (bool) {
		require (isExist(_id));
		require (_key != address(0));
		return publicKeys[_id].writerKey == _key;
	}

	/**
	 * @dev Get list of publicKeys of a Name
	 * @param _id The ID of the Name
	 * @param _from The starting index
	 * @param _to The ending index
	 * @return list of publicKeys
	 */
	function getKeys(address _id, uint256 _from, uint256 _to) public isName(_id) view returns (address[] memory) {
		require (isExist(_id));
		require (_from >= 0 && _to >= _from);

		PublicKey memory _publicKey = publicKeys[_id];
		require (_publicKey.keys.length > 0);

		if (_to >  _publicKey.keys.length.sub(1)) {
			_to = _publicKey.keys.length.sub(1);
		}
		address[] memory _keys = new address[](_to.sub(_from).add(1));

		for (uint256 i = _from; i <= _to; i++) {
			_keys[i.sub(_from)] = _publicKey.keys[i];
		}
		return _keys;
	}

	/**
	 * @dev Remove publicKey from the list
	 * @param _id The ID of the Name
	 * @param _key The publicKey to be removed
	 */
	function removeKey(address _id, address _key) public isName(_id) onlyAdvocate(_id) senderNameNotCompromised {
		require (this.isKeyExist(_id, _key));

		PublicKey storage _publicKey = publicKeys[_id];

		// Can't remove default key
		require (_key != _publicKey.defaultKey);
		// Can't remove writer key
		require (_key != _publicKey.writerKey);
		// Has to have at least defaultKey/writerKey
		require (_publicKey.keys.length > 1);

		keyToNameId[_key] = address(0);

		uint256 index;
		for (uint256 i = 0; i < _publicKey.keys.length; i++) {
			if (_publicKey.keys[i] == _key) {
				index = i;
				break;
			}
		}

		for (uint256 i = index; i < _publicKey.keys.length.sub(1); i++) {
			_publicKey.keys[i] = _publicKey.keys[i+1];
		}
		_publicKey.keys.length--;

		uint256 _nonce = _nameFactory.incrementNonce(_id);
		require (_nonce > 0);

		emit RemoveKey(_id, _key, _nonce);
	}

	/**
	 * @dev Set a publicKey as the default for a Name
	 * @param _id The ID of the Name
	 * @param _defaultKey The defaultKey to be set
	 * @param _signatureV The V part of the signature for this update
	 * @param _signatureR The R part of the signature for this update
	 * @param _signatureS The S part of the signature for this update
	 */
	function setDefaultKey(address _id, address _defaultKey, uint8 _signatureV, bytes32 _signatureR, bytes32 _signatureS) public isName(_id) onlyAdvocate(_id) senderNameNotCompromised {
		require (this.isKeyExist(_id, _defaultKey));

		bytes32 _hash = keccak256(abi.encodePacked(address(this), _id, _defaultKey));
		require (ecrecover(_hash, _signatureV, _signatureR, _signatureS) == msg.sender);

		PublicKey storage _publicKey = publicKeys[_id];
		_publicKey.defaultKey = _defaultKey;

		uint256 _nonce = _nameFactory.incrementNonce(_id);
		require (_nonce > 0);
		emit SetDefaultKey(_id, _defaultKey, _nonce);
	}

	/**
	 * @dev Set a publicKey as the writer for a Name
	 * @param _id The ID of the Name
	 * @param _writerKey The writerKey to be set
	 * @param _signatureV The V part of the signature for this update
	 * @param _signatureR The R part of the signature for this update
	 * @param _signatureS The S part of the signature for this update
	 */
	function setWriterKey(address _id, address _writerKey, uint8 _signatureV, bytes32 _signatureR, bytes32 _signatureS) public isName(_id) onlyAdvocate(_id) senderNameNotCompromised {
		bytes32 _hash = keccak256(abi.encodePacked(address(this), _id, _writerKey));
		require (ecrecover(_hash, _signatureV, _signatureR, _signatureS) == msg.sender);
		require (_setWriterKey(_id, _writerKey));
	}

	/**
	 * @dev Add key and set as writerKey for a Name
	 * @param _id The ID of the Name
	 * @param _key The writerKey to be added
	 * @param _nonce The signed uint256 nonce (should be Name's current nonce + 1)
	 * @param _signatureV The V part of the signature
	 * @param _signatureR The R part of the signature
	 * @param _signatureS The S part of the signature
	 */
	function addSetWriterKey(address _id,
		address _key,
		uint256 _nonce,
		uint8 _signatureV,
		bytes32 _signatureR,
		bytes32 _signatureS
	) public isName(_id) onlyAdvocate(_id) keyNotTaken(_key) senderNameNotCompromised {
		require (_nonce == _nameFactory.nonces(_id).add(1));
		bytes32 _hash = keccak256(abi.encodePacked(address(this), _id, _key, _nonce));
		require (ecrecover(_hash, _signatureV, _signatureR, _signatureS) == _key);
		require (_addKey(_id, _key));
		require (_setWriterKey(_id, _key));
	}

	/***** INTERNAL METHOD *****/
	/**
	 * @dev Actual adding the publicKey to list for a Name
	 * @param _id The ID of the Name
	 * @param _key The publicKey to be added
	 * @return true on success
	 */
	function _addKey(address _id, address _key) internal returns (bool) {
		require (!this.isKeyExist(_id, _key));

		keyToNameId[_key] = _id;

		PublicKey storage _publicKey = publicKeys[_id];
		_publicKey.keys.push(_key);

		uint256 _nonce = _nameFactory.incrementNonce(_id);
		require (_nonce > 0);

		emit AddKey(_id, _key, _nonce);
		return true;
	}

	/**
	 * @dev Actual setting the writerKey for a Name
	 * @param _id The ID of the Name
	 * @param _writerKey The writerKey to be set
	 * @return true on success
	 */
	function _setWriterKey(address _id, address _writerKey) internal returns (bool) {
		require (this.isKeyExist(_id, _writerKey));

		PublicKey storage _publicKey = publicKeys[_id];
		_publicKey.writerKey = _writerKey;

		uint256 _nonce = _nameFactory.incrementNonce(_id);
		require (_nonce > 0);
		emit SetWriterKey(_id, _writerKey, _nonce);
		return true;
	}
}
