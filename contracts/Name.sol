pragma solidity ^0.4.24;

import './Thought.sol';
import './SafeMath.sol';

/**
 * @title Name
 */
contract Name is Thought {
	using SafeMath for uint256;

	address[] public publicKeys;
	address public defaultPublicKey;

	// Event to be broadcasted to public when a publicKey is added
	event AddPublicKey(address publicKey, uint256 nonce);

	// Event to be broadcasted to public when a publicKey is deleted
	event DeletePublicKey(address publicKey, uint256 nonce);

	// Event to be broadcasted to public when setting a defaut publicKey
	event SetDefaultPublicKey(address publicKey, uint256 nonce);

	/**
	 * @dev Constructor function
	 */
	constructor (string _originName, address _originNameId, string _datHash, string _database, string _keyValue, bytes32 _contentId)
		Thought (_originName, _originNameId, _datHash, _database, _keyValue, _contentId, _originNameId, address(0)) public {
		// Creating Name
		thoughtTypeId = 1;

		advocateId = address(this);
		listenerId = advocateId;
		speakerId = advocateId;

		// Store the publicKey
		publicKeys.push(_originNameId);
		defaultPublicKey = _originNameId;
	}

	/**
	 * Check if the sender is the same as the origin Name
	 */
	modifier senderIsOriginName() {
		require (msg.sender == originNameId);
		_;
	}

	/**
	 * @dev Get total publicKeys count
	 * @return total publicKeys count
	 */
	function getTotalPublicKeysCount() public view returns (uint256) {
		return publicKeys.length;
	}

	/**
	 * @dev Get list of publicKeys
	 * @param _from The starting index
	 * @param _to The ending index
	 * @return list of publicKeys
	 */
	function getPublicKeys(uint256 _from, uint256 _to) public view returns (address[]) {
		require (_from >= 0 && _to >= _from);
		require (publicKeys.length > 0);

		address[] memory _publicKeys = new address[](_to.sub(_from).add(1));
		if (_to > publicKeys.length.sub(1)) {
			_to = publicKeys.length.sub(1);
		}
		for (uint256 i = _from; i <= _to; i++) {
			_publicKeys[i.sub(_from)] = publicKeys[i];
		}
		return _publicKeys;
	}

	/**
	 * @dev Check whether or not a publicKey exist in the list
	 * @param _publicKey The publicKey to check
	 * @return true if yes. false otherwise
	 */
	function isPublicKeyExist(address _publicKey) public view returns (bool) {
		for (uint256 i = 0; i < publicKeys.length; i++) {
			if (publicKeys[i] == _publicKey) {
				return true;
			}
		}
		return false;
	}

	/**
	 * @dev Add publicKey to list
	 * @param _publicKey The publicKey to be added
	 */
	function addPublicKey(address _publicKey) public senderIsOriginName {
		require (!isPublicKeyExist(_publicKey));
		publicKeys.push(_publicKey);
		nonce++;
		emit AddPublicKey(_publicKey, nonce);
	}

	/**
	 * @dev Delete publicKey from the list
	 * @param _publicKey The publicKey to be deleted
	 */
	function deletePublicKey(address _publicKey) public senderIsOriginName {
		require (publicKeys.length > 1);
		require (isPublicKeyExist(_publicKey));
		for (uint256 i = 0; i < publicKeys.length; i++) {
			if (publicKeys[i] == _publicKey) {
				delete publicKeys[i];
				publicKeys.length--;
				nonce++;
				emit DeletePublicKey(_publicKey, nonce);
				break;
			}
		}
		return;
	}

	/**
	 * @dev Set a publicKey as the default
	 * @param _publicKey The publicKey to be set
	 * @param _signatureV The V part of the signature for this update
	 * @param _signatureR The R part of the signature for this update
	 * @param _signatureS The S part of the signature for this update
	 */
	function setDefaultPublicKey(address _publicKey, uint8 _signatureV, bytes32 _signatureR, bytes32 _signatureS) public senderIsOriginName {
		require (isPublicKeyExist(_publicKey));
		bytes32 _hash = keccak256(abi.encodePacked(address(this), _publicKey));
		require (ecrecover(_hash, _signatureV, _signatureR, _signatureS) == msg.sender);

		defaultPublicKey = _publicKey;
		nonce++;
		emit SetDefaultPublicKey(_publicKey, nonce);
	}
}
