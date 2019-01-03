pragma solidity ^0.4.24;

import './SafeMath.sol';
import './TheAO.sol';
import './TAOController.sol';
import './Name.sol';
import './NameTAOLookup.sol';		// Store the name lookup for a Name/TAO
import './TAOFamily.sol';			// Store TAO's child information
import './AOSetting.sol';
import './Logos.sol';

/**
 * @title TAOFactory
 *
 * The purpose of this contract is to allow node to create TAO
 */
contract TAOFactory is TAOController, TheAO {
	using SafeMath for uint256;
	address[] internal taos;

	address public nameTAOPositionAddress;
	address public taoFamilyAddress;
	address public settingTAOId;

	NameTAOLookup internal _nameTAOLookup;
	TAOFamily internal _taoFamily;
	AOSetting internal _aoSetting;
	Logos internal _logos;

	// Mapping from TAO ID to its nonce
	mapping (address => uint256) public nonces;

	// Event to be broadcasted to public when Advocate creates a TAO
	event CreateTAO(address indexed ethAddress, address advocateId, address taoId, uint256 index, address parent, uint8 parentTypeId);

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress, address _nameTAOLookupAddress, address _nameTAOPositionAddress, address _aoSettingAddress, address _logosAddress)
		TAOController(_nameFactoryAddress, _nameTAOPositionAddress) public {
		nameTAOPositionAddress = _nameTAOPositionAddress;

		_nameTAOLookup = NameTAOLookup(_nameTAOLookupAddress);
		_nameTAOPosition = NameTAOPosition(_nameTAOPositionAddress);
		_aoSetting = AOSetting(_aoSettingAddress);
		_logos = Logos(_logosAddress);
	}

	/**
	 * @dev Checks if calling address can update TAO's nonce
	 */
	modifier canUpdateNonce {
		require (msg.sender == nameTAOPositionAddress || msg.sender == taoFamilyAddress);
		_;
	}

	/***** The AO ONLY METHODS *****/
	/**
	 * @dev The AO set the TAOFamily Address
	 * @param _taoFamilyAddress The address of TAOFamily
	 */
	function setTAOFamilyAddress(address _taoFamilyAddress) public onlyTheAO {
		require (_taoFamilyAddress != address(0));
		taoFamilyAddress = _taoFamilyAddress;
		_taoFamily = TAOFamily(taoFamilyAddress);
	}

	/**
	 * @dev The AO set settingTAOId (The TAO ID that holds the setting values)
	 * @param _settingTAOId The address of settingTAOId
	 */
	function setSettingTAOId(address _settingTAOId) public onlyTheAO isTAO(_settingTAOId) {
		settingTAOId = _settingTAOId;
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Increment the nonce of a TAO
	 * @param _taoId The ID of the TAO
	 * @return current nonce
	 */
	function incrementNonce(address _taoId) public canUpdateNonce returns (uint256) {
		// Check if _taoId exist
		require (nonces[_taoId] > 0);
		nonces[_taoId]++;
		return nonces[_taoId];
	}

	/**
	 * @dev Name creates a TAO
	 * @param _name The name of the TAO
	 * @param _datHash The datHash of this TAO
	 * @param _database The database for this TAO
	 * @param _keyValue The key/value pair to be checked on the database
	 * @param _contentId The contentId related to this TAO
	 * @param _parentId The parent of this TAO (has to be a Name or TAO)
	 * @param _childMinLogos The min required Logos to create a child from this TAO
	 */
	function createTAO(
		string _name,
		string _datHash,
		string _database,
		string _keyValue,
		bytes32 _contentId,
		address _parentId,
		uint256 _childMinLogos
	) public senderIsName() isNameOrTAO(_parentId) {
		require (bytes(_name).length > 0);
		require (!_nameTAOLookup.isExist(_name));

		address _nameId = _nameFactory.ethAddressToNameId(msg.sender);

		uint256 _parentCreateChildTAOMinLogos;
		uint256 _createChildTAOMinLogos = _getSettingVariables();
		if (AOLibrary.isTAO(_parentId)) {
			(, _parentCreateChildTAOMinLogos,) = _taoFamily.getFamilyById(_parentId);
		}
		if (_parentCreateChildTAOMinLogos > 0) {
			require (_logos.sumBalanceOf(_nameId) >= _parentCreateChildTAOMinLogos);
		} else if (_createChildTAOMinLogos > 0) {
			require (_logos.sumBalanceOf(_nameId) >= _createChildTAOMinLogos);
		}

		// Create the TAO
		address taoId = new TAO(_name, _nameId, _datHash, _database, _keyValue, _contentId);

		// Increment the nonce
		nonces[taoId]++;

		// Store the name lookup information
		require (_nameTAOLookup.add(_name, taoId, TAO(_parentId).name(), 0));

		// Store the Advocate/Listener/Speaker information
		require (_nameTAOPosition.add(taoId, _nameId, _nameId, _nameId));

		require (_taoFamily.add(taoId, _parentId, _childMinLogos));
		taos.push(taoId);

		emit CreateTAO(msg.sender, _nameId, taoId, taos.length.sub(1), _parentId, TAO(_parentId).typeId());

		if (AOLibrary.isTAO(_parentId)) {
			require (_taoFamily.addChild(_parentId, taoId));
		}
	}

	/**
	 * @dev Get TAO information
	 * @param _taoId The ID of the TAO to be queried
	 * @return The name of the TAO
	 * @return The origin Name ID that created the TAO
	 * @return The name of Name that created the TAO
	 * @return The datHash of the TAO
	 * @return The database of the TAO
	 * @return The keyValue of the TAO
	 * @return The contentId of the TAO
	 * @return The typeId of the TAO
	 */
	function getTAO(address _taoId) public view returns (string, address, string, string, string, string, bytes32, uint8) {
		TAO _tao = TAO(_taoId);
		return (
			_tao.name(),
			_tao.originId(),
			Name(_tao.originId()).name(),
			_tao.datHash(),
			_tao.database(),
			_tao.keyValue(),
			_tao.contentId(),
			_tao.typeId()
		);
	}

	/**
	 * @dev Get total TAOs count
	 * @return total TAOs count
	 */
	function getTotalTAOsCount() public view returns (uint256) {
		return taos.length;
	}

	/**
	 * @dev Get list of TAO IDs
	 * @param _from The starting index
	 * @param _to The ending index
	 * @return list of TAO IDs
	 */
	function getTAOIds(uint256 _from, uint256 _to) public view returns (address[]) {
		require (_from >= 0 && _to >= _from && taos.length > _to);

		address[] memory _taos = new address[](_to.sub(_from).add(1));
		for (uint256 i = _from; i <= _to; i++) {
			_taos[i.sub(_from)] = taos[i];
		}
		return _taos;
	}

	/**
	 * @dev Check whether or not the signature is valid
	 * @param _data The signed string data
	 * @param _nonce The signed uint256 nonce (should be TAO's current nonce + 1)
	 * @param _validateAddress The ETH address to be validated (optional)
	 * @param _name The Name of the TAO
	 * @param _signatureV The V part of the signature
	 * @param _signatureR The R part of the signature
	 * @param _signatureS The S part of the signature
	 * @return true if valid. false otherwise
	 * @return The name of the Name that created the signature
	 * @return The Position of the Name that created the signature.
	 *			0 == unknown. 1 == Advocate. 2 == Listener. 3 == Speaker
	 */
	function validateTAOSignature(
		string _data,
		uint256 _nonce,
		address _validateAddress,
		string _name,
		uint8 _signatureV,
		bytes32 _signatureR,
		bytes32 _signatureS
	) public isTAO(_getTAOIdByName(_name)) view returns (bool, string, uint256) {
		address _signatureAddress = AOLibrary.getValidateSignatureAddress(address(this), _data, _nonce, _signatureV, _signatureR, _signatureS);
		if (_isTAOSignatureAddressValid(_validateAddress, _signatureAddress, _getTAOIdByName(_name), _nonce)) {
			return (true, Name(_nameFactory.ethAddressToNameId(_signatureAddress)).name(), _nameTAOPosition.determinePosition(_signatureAddress, _getTAOIdByName(_name)));
		} else {
			return (false, "", 0);
		}
	}

	/***** INTERNAL METHOD *****/
	/**
	 * @dev Check whether or not the address recovered from the signature is valid
	 * @param _validateAddress The ETH address to be validated (optional)
	 * @param _signatureAddress The address recovered from the signature
	 * @param _taoId The ID of the TAO
	 * @param _nonce The signed uint256 nonce
	 * @return true if valid. false otherwise
	 */
	function _isTAOSignatureAddressValid(
		address _validateAddress,
		address _signatureAddress,
		address _taoId,
		uint256 _nonce
	) internal view returns (bool) {
		if (_validateAddress != address(0)) {
			return (_nonce == nonces[_taoId].add(1) &&
				_signatureAddress == _validateAddress &&
				_nameTAOPosition.senderIsPosition(_validateAddress, _taoId)
			);
		} else {
			return (
				_nonce == nonces[_taoId].add(1) &&
				_nameTAOPosition.senderIsPosition(_signatureAddress, _taoId)
			);
		}
	}

	/**
	 * @dev Internal function to get the TAO Id by name
	 * @param _name The name of the TAO
	 * @return the TAO ID
	 */
	function _getTAOIdByName(string _name) internal view returns (address) {
		return _nameTAOLookup.getAddressByName(_name);
	}

	/**
	 * @dev Get setting variables
	 * @return createChildTAOMinLogos The minimum required Logos to create a TAO
	 */
	function _getSettingVariables() internal view returns (uint256) {
		(uint256 createChildTAOMinLogos,,,,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'createChildTAOMinLogos');
		return createChildTAOMinLogos;
	}
}
