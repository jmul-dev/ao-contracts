pragma solidity ^0.4.24;

import './SafeMath.sol';
import './AOLibrary.sol';
import './NameFactory.sol';
import './NameTAOPosition.sol';

/**
 * @title NamePublicKey
 */
contract NamePublicKey {
	using SafeMath for uint256;

	address public nameFactoryAddress;
	address public nameTAOPositionAddress;

	NameFactory internal _nameFactory;
	NameTAOPosition internal _nameTAOPosition;

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
		nameFactoryAddress = _nameFactoryAddress;
		nameTAOPositionAddress = _nameTAOPositionAddress;

		_nameFactory = NameFactory(_nameFactoryAddress);
		_nameTAOPosition = NameTAOPosition(_nameTAOPosition);
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
	function add(address _id, address _defaultKey)
		public
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
	function isKeyExist(address _id, address _key) isName(_id) public view returns (bool) {
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
	function addKey(address _id, address _key) public isName(_id) onlyAdvocate(_id) {
		require (!isKeyExist(_id, _key));

		PublicKey storage _publicKey = publicKeys[_id];
		_publicKey.keys.push(_key);

		uint256 _nonce = _nameFactory.incrementNonce(_id);
		require (_nonce > 0);

		emit AddKey(_id, _key, _nonce);
	}

	/**
	 * @dev Get default public key of a Name
	 * @param _id The ID of the Name
	 * @return the default public key
	 */
	function getDefaultKey(address _id) public isName(_id) view returns (address) {
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
	function removeKey(address _id, address _key) public isName(_id) onlyAdvocate(_id) {
		require (isExist(_id));
		require (isKeyExist(_id, _key));

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
	function setDefaultKey(address _id, address _defaultKey, uint8 _signatureV, bytes32 _signatureR, bytes32 _signatureS) public isName(_id) onlyAdvocate(_id) {
		require (isExist(_id));
		require (isKeyExist(_id, _defaultKey));

		bytes32 _hash = keccak256(abi.encodePacked(address(this), _id, _defaultKey));
		require (ecrecover(_hash, _signatureV, _signatureR, _signatureS) == msg.sender);

		PublicKey storage _publicKey = publicKeys[_id];
		_publicKey.defaultKey = _defaultKey;

		uint256 _nonce = _nameFactory.incrementNonce(_id);
		require (_nonce > 0);
		emit SetDefaultKey(_id, _defaultKey, _nonce);
	}
}
