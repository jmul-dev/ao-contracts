pragma solidity ^0.4.24;

import './SafeMath.sol';
import './TAOController.sol';
import './ITAOFactory.sol';
import './Name.sol';
import './INameTAOLookup.sol';		// Store the name lookup for a Name/TAO
import './ITAOFamily.sol';			// Store TAO's child information
import './IAOSetting.sol';
import './Logos.sol';
import './ITAOPool.sol';

/**
 * @title TAOFactory
 *
 * The purpose of this contract is to allow node to create TAO
 */
contract TAOFactory is TAOController, ITAOFactory {
	using SafeMath for uint256;

	address[] internal taos;

	address public nameTAOLookupAddress;
	address public aoSettingAddress;
	address public logosAddress;
	address public nameTAOVaultAddress;
	address public taoFamilyAddress;
	address public settingTAOId;
	address public taoPoolAddress;

	INameTAOLookup internal _nameTAOLookup;
	IAOSetting internal _aoSetting;
	Logos internal _logos;
	ITAOFamily internal _taoFamily;
	ITAOPool internal _taoPool;

	// Mapping from TAO ID to its nonce
	mapping (address => uint256) public nonces;

	// Event to be broadcasted to public when Advocate creates a TAO
	event CreateTAO(address indexed ethAddress, address advocateId, address taoId, uint256 index, address parent, uint8 parentTypeId);

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress)
		TAOController(_nameFactoryAddress) public {}

	/**
	 * @dev Checks if calling address can update TAO's nonce
	 */
	modifier canUpdateNonce {
		require (msg.sender == nameTAOPositionAddress || msg.sender == taoFamilyAddress || msg.sender == taoPoolAddress);
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
		_nameTAOLookup = INameTAOLookup(_nameTAOLookupAddress);
	}

	/**
	 * @dev The AO set the AOSetting Address
	 * @param _aoSettingAddress The address of AOSetting
	 */
	function setAOSettingAddress(address _aoSettingAddress) public onlyTheAO {
		require (_aoSettingAddress != address(0));
		aoSettingAddress = _aoSettingAddress;
		_aoSetting = IAOSetting(_aoSettingAddress);
	}

	/**
	 * @dev The AO set the Logos Address
	 * @param _logosAddress The address of Logos
	 */
	function setLogosAddress(address _logosAddress) public onlyTheAO {
		require (_logosAddress != address(0));
		logosAddress = _logosAddress;
		_logos = Logos(_logosAddress);
	}

	/**
	 * @dev The AO set the NameTAOVault Address
	 * @param _nameTAOVaultAddress The address of NameTAOVault
	 */
	function setNameTAOVaultAddress(address _nameTAOVaultAddress) public onlyTheAO {
		require (_nameTAOVaultAddress != address(0));
		nameTAOVaultAddress = _nameTAOVaultAddress;
	}

	/**
	 * @dev The AO set the TAOFamily Address
	 * @param _taoFamilyAddress The address of TAOFamily
	 */
	function setTAOFamilyAddress(address _taoFamilyAddress) public onlyTheAO {
		require (_taoFamilyAddress != address(0));
		taoFamilyAddress = _taoFamilyAddress;
		_taoFamily = ITAOFamily(taoFamilyAddress);
	}

	/**
	 * @dev The AO set settingTAOId (The TAO ID that holds the setting values)
	 * @param _settingTAOId The address of settingTAOId
	 */
	function setSettingTAOId(address _settingTAOId) public onlyTheAO isTAO(_settingTAOId) {
		settingTAOId = _settingTAOId;
	}

	/**
	 * @dev The AO set the TAOPool Address
	 * @param _taoPoolAddress The address of TAOPool
	 */
	function setTAOPoolAddress(address _taoPoolAddress) public onlyTheAO {
		require (_taoPoolAddress != address(0));
		taoPoolAddress = _taoPoolAddress;
		_taoPool = ITAOPool(taoPoolAddress);
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Increment the nonce of a TAO
	 * @param _taoId The ID of the TAO
	 * @return current nonce
	 */
	function incrementNonce(address _taoId) external canUpdateNonce returns (uint256) {
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
		uint256 _childMinLogos,
		bool _ethosCapStatus,
		uint256 _ethosCapAmount
	) public senderIsName() isNameOrTAO(_parentId) {
		require (bytes(_name).length > 0);
		require (!_nameTAOLookup.isExist(_name));

		uint256 _parentCreateChildTAOMinLogos;
		uint256 _createChildTAOMinLogos = _getSettingVariables();
		if (AOLibrary.isTAO(_parentId)) {
			(, _parentCreateChildTAOMinLogos,) = _taoFamily.getFamilyById(_parentId);
		}
		if (_parentCreateChildTAOMinLogos > 0) {
			require (_logos.sumBalanceOf(_nameFactory.ethAddressToNameId(msg.sender)) >= _parentCreateChildTAOMinLogos);
		} else if (_createChildTAOMinLogos > 0) {
			require (_logos.sumBalanceOf(_nameFactory.ethAddressToNameId(msg.sender)) >= _createChildTAOMinLogos);
		}

		// Create the TAO
		require (_createTAO(_name, _nameFactory.ethAddressToNameId(msg.sender), _datHash, _database, _keyValue, _contentId, _parentId, _childMinLogos, _ethosCapStatus, _ethosCapAmount));
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
		address _signatureAddress = _getValidateSignatureAddress(_data, _nonce, _signatureV, _signatureR, _signatureS);
		if (_isTAOSignatureAddressValid(_validateAddress, _signatureAddress, _getTAOIdByName(_name), _nonce)) {
			return (true, Name(_nameFactory.ethAddressToNameId(_signatureAddress)).name(), _nameTAOPosition.determinePosition(_signatureAddress, _getTAOIdByName(_name)));
		} else {
			return (false, "", 0);
		}
	}

	/***** INTERNAL METHOD *****/
	/**
	 * @dev Actual creating the TAO
	 * @param _name The name of the TAO
	 * @param _nameId The ID of the Name that creates this TAO
	 * @param _datHash The datHash of this TAO
	 * @param _database The database for this TAO
	 * @param _keyValue The key/value pair to be checked on the database
	 * @param _contentId The contentId related to this TAO
	 * @param _parentId The parent of this TAO (has to be a Name or TAO)
	 * @param _childMinLogos The min required Logos to create a child from this TAO
	 * @return true on success
	 */
	function _createTAO(
		string _name,
		address _nameId,
		string _datHash,
		string _database,
		string _keyValue,
		bytes32 _contentId,
		address _parentId,
		uint256 _childMinLogos,
		bool _ethosCapStatus,
		uint256 _ethosCapAmount
	) internal returns (bool) {
		// Create the TAO
		address taoId = AOLibrary.deployTAO(_name, _nameId, _datHash, _database, _keyValue, _contentId, nameTAOVaultAddress);

		// Increment the nonce
		nonces[taoId]++;

		// Store the name lookup information
		require (_nameTAOLookup.add(_name, taoId, TAO(_parentId).name(), 0));

		// Store the Advocate/Listener/Speaker information
		require (_nameTAOPosition.add(taoId, _nameId, _nameId, _nameId));

		// Store the "Family" info of this TAO
		require (_taoFamily.add(taoId, _parentId, _childMinLogos));

		// Creat a Pool so that public can stake Ethos/Pathos on it
		require (_taoPool.createPool(taoId, _ethosCapStatus, _ethosCapAmount));

		taos.push(taoId);

		emit CreateTAO(msg.sender, _nameId, taoId, taos.length.sub(1), _parentId, TAO(_parentId).typeId());

		if (AOLibrary.isTAO(_parentId)) {
			require (_taoFamily.addChild(_parentId, taoId));
		}
		return true;
	}

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

	/**
	 * @dev Return the address that signed the data and nonce when validating signature
	 * @param _data the data that was signed
	 * @param _nonce The signed uint256 nonce
	 * @param _v part of the signature
	 * @param _r part of the signature
	 * @param _s part of the signature
	 * @return the address that signed the message
	 */
	function _getValidateSignatureAddress(string _data, uint256 _nonce, uint8 _v, bytes32 _r, bytes32 _s) internal view returns (address) {
		bytes32 _hash = keccak256(abi.encodePacked(address(this), _data, _nonce));
		return ecrecover(_hash, _v, _r, _s);
	}
}
