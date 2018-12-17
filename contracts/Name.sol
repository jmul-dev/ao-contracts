pragma solidity ^0.4.24;

import './Thought.sol';
import './SafeMath.sol';

/**
 * @title Name
 */
contract Name is Thought {
	using SafeMath for uint256;

	address[] internal publicKeys;
	address public defaultPublicKey;

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
		require (_publicKey != address(0));
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
	 * @return true on success
	 */
	function addPublicKey(address _publicKey) public isActive onlyFactory returns (bool) {
		require (!isPublicKeyExist(_publicKey));
		publicKeys.push(_publicKey);
		nonce++;
		return true;
	}

	/**
	 * @dev Delete publicKey from the list
	 * @param _publicKey The publicKey to be deleted
	 * @return true on success
	 */
	function deletePublicKey(address _publicKey) public isActive onlyFactory returns (bool) {
		require (publicKeys.length > 1);
		require (isPublicKeyExist(_publicKey));
		for (uint256 i = 0; i < publicKeys.length; i++) {
			if (publicKeys[i] == _publicKey) {
				delete publicKeys[i];
				publicKeys.length--;
				nonce++;
				break;
			}
		}
		return true;
	}

	/**
	 * @dev Set a publicKey as the default
	 * @param _publicKey The publicKey to be set
	 * @param _signatureV The V part of the signature for this update
	 * @param _signatureR The R part of the signature for this update
	 * @param _signatureS The S part of the signature for this update
	 * @return true on success
	 */
	function setDefaultPublicKey(address _publicKey, uint8 _signatureV, bytes32 _signatureR, bytes32 _signatureS) public isActive onlyFactory returns (bool) {
		require (isPublicKeyExist(_publicKey));
		bytes32 _hash = keccak256(abi.encodePacked(address(this), _publicKey));
		require (ecrecover(_hash, _signatureV, _signatureR, _signatureS) == msg.sender);

		defaultPublicKey = _publicKey;
		nonce++;
		return true;
	}
}
