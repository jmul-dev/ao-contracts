pragma solidity ^0.4.24;

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
		address[] keys;
	}

	// Mapping from nameId to its PublicKey
	mapping (address => PublicKey) internal publicKeys;

	// Event to be broadcasted to public when a publicKey is added to a Name
	event AddKey(address indexed nameId, address publicKey, uint256 nonce);

	// Event to be broadcasted to public when a publicKey is removed from a Name
	event RemoveKey(address indexed nameId, address publicKey, uint256 nonce);

	// Event to be broadcasted to public when a publicKey is set as default for a Name
	event SetDefaultKey(address indexed nameId, address publicKey, uint256 nonce);

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
	 * @dev Only allowed if Name is not compromised
	 */
	modifier nameNotCompromised(address _id) {
		require (!_nameAccountRecovery.isCompromised(_id));
		_;
	}

	/**
	 * @dev Only allowed if sender's Name is not compromised
	 */
	modifier senderNameNotCompromised() {
		require (!_nameAccountRecovery.isCompromised(_nameFactory.ethAddressToNameId(msg.sender)));
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
	function whitelistAddKey(address _id, address _key) external isName(_id) inWhitelist returns (bool) {
		_addKey(_id, _key);
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
	 * @return true on success
	 */
	function initialize(address _id, address _defaultKey)
		external
		isName(_id)
		onlyFactory returns (bool) {
		require (!isExist(_id));
		require (_defaultKey != address(0));

		PublicKey storage _publicKey = publicKeys[_id];
		_publicKey.created = true;
		_publicKey.defaultKey = _defaultKey;
		_publicKey.keys.push(_defaultKey);
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

		PublicKey memory _publicKey = publicKeys[_id];
		for (uint256 i = 0; i < _publicKey.keys.length; i++) {
			if (_publicKey.keys[i] == _key) {
				return true;
			}
		}
		return false;
	}

	/**
	 * @dev Add publicKey to list for a Name
	 * @param _id The ID of the Name
	 * @param _key The publicKey to be added
	 */
	function addKey(address _id, address _key) public isName(_id) nameNotCompromised(_id) onlyAdvocate(_id) senderNameNotCompromised {
		_addKey(_id, _key);
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
	 * @dev Get list of publicKeys of a Name
	 * @param _id The ID of the Name
	 * @param _from The starting index
	 * @param _to The ending index
	 * @return list of publicKeys
	 */
	function getKeys(address _id, uint256 _from, uint256 _to) public isName(_id) view returns (address[]) {
		require (isExist(_id));
		require (_from >= 0 && _to >= _from);

		PublicKey memory _publicKey = publicKeys[_id];
		require (_publicKey.keys.length > 0);

		address[] memory _keys = new address[](_to.sub(_from).add(1));
		if (_to > _publicKey.keys.length.sub(1)) {
			_to = _publicKey.keys.length.sub(1);
		}
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
	function removeKey(address _id, address _key) public isName(_id) nameNotCompromised(_id) onlyAdvocate(_id) senderNameNotCompromised {
		require (isExist(_id));
		require (this.isKeyExist(_id, _key));

		PublicKey storage _publicKey = publicKeys[_id];

		// Can't remove default key
		require (_key != _publicKey.defaultKey);
		require (_publicKey.keys.length > 1);

		for (uint256 i = 0; i < _publicKey.keys.length; i++) {
			if (_publicKey.keys[i] == _key) {
				delete _publicKey.keys[i];
				_publicKey.keys.length--;

				uint256 _nonce = _nameFactory.incrementNonce(_id);
				break;
			}
		}
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
	function setDefaultKey(address _id, address _defaultKey, uint8 _signatureV, bytes32 _signatureR, bytes32 _signatureS) public isName(_id) nameNotCompromised(_id) onlyAdvocate(_id) senderNameNotCompromised {
		require (isExist(_id));
		require (this.isKeyExist(_id, _defaultKey));

		bytes32 _hash = keccak256(abi.encodePacked(address(this), _id, _defaultKey));
		require (ecrecover(_hash, _signatureV, _signatureR, _signatureS) == msg.sender);

		PublicKey storage _publicKey = publicKeys[_id];
		_publicKey.defaultKey = _defaultKey;

		uint256 _nonce = _nameFactory.incrementNonce(_id);
		require (_nonce > 0);
		emit SetDefaultKey(_id, _defaultKey, _nonce);
	}

	/***** INTERNAL METHOD *****/
	/**
	 * @dev Actual adding the publicKey to list for a Name
	 * @param _id The ID of the Name
	 * @param _key The publicKey to be added
	 */
	function _addKey(address _id, address _key) internal {
		require (!this.isKeyExist(_id, _key));
		require (_key != address(0));

		PublicKey storage _publicKey = publicKeys[_id];
		_publicKey.keys.push(_key);

		uint256 _nonce = _nameFactory.incrementNonce(_id);
		require (_nonce > 0);

		emit AddKey(_id, _key, _nonce);
	}
}
