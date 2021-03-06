pragma solidity >=0.5.4 <0.6.0;

import './SafeMath.sol';
import './TAOController.sol';
import './ITAOFactory.sol';
import './Name.sol';
import './INameTAOLookup.sol';
import './ITAOAncestry.sol';
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
	address public taoAncestryAddress;
	address public settingTAOId;
	address public taoPoolAddress;

	INameTAOLookup internal _nameTAOLookup;
	IAOSetting internal _aoSetting;
	Logos internal _logos;
	ITAOAncestry internal _taoAncestry;
	ITAOPool internal _taoPool;

	// Mapping from TAO ID to its nonce
	mapping (address => uint256) internal _nonces;

	// Event to be broadcasted to public when Advocate creates a TAO
	event CreateTAO(address indexed advocateId, address taoId, uint256 index, string name, address parent, uint8 parentTypeId);

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress)
		TAOController(_nameFactoryAddress) public {}

	/**
	 * @dev Checks if calling address can update TAO's nonce
	 */
	modifier canUpdateNonce {
		require (msg.sender == nameTAOPositionAddress || msg.sender == taoAncestryAddress || msg.sender == taoPoolAddress);
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
	 * @dev The AO set the TAOAncestry Address
	 * @param _taoAncestryAddress The address of TAOAncestry
	 */
	function setTAOAncestryAddress(address _taoAncestryAddress) public onlyTheAO {
		require (_taoAncestryAddress != address(0));
		taoAncestryAddress = _taoAncestryAddress;
		_taoAncestry = ITAOAncestry(taoAncestryAddress);
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
	 * @dev Get the nonce given a TAO ID
	 * @param _taoId The TAO ID to check
	 * @return The nonce of the TAO
	 */
	function nonces(address _taoId) external view returns (uint256) {
		return _nonces[_taoId];
	}

	/**
	 * @dev Increment the nonce of a TAO
	 * @param _taoId The ID of the TAO
	 * @return current nonce
	 */
	function incrementNonce(address _taoId) external canUpdateNonce returns (uint256) {
		// Check if _taoId exist
		require (_nonces[_taoId] > 0);
		_nonces[_taoId]++;
		return _nonces[_taoId];
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
		string memory _name,
		string memory _datHash,
		string memory _database,
		string memory _keyValue,
		bytes32 _contentId,
		address _parentId,
		uint256 _childMinLogos,
		bool _ethosCapStatus,
		uint256 _ethosCapAmount
	) public senderIsName senderNameNotCompromised isNameOrTAO(_parentId) {
		require (bytes(_name).length > 0);
		require (!_nameTAOLookup.isExist(_name));

		uint256 _nameSumLogos = _logos.sumBalanceOf(_nameFactory.ethAddressToNameId(msg.sender));
		if (AOLibrary.isTAO(_parentId)) {
			(, uint256 _parentCreateChildTAOMinLogos,) = _taoAncestry.getAncestryById(_parentId);
			require (_nameSumLogos >= _parentCreateChildTAOMinLogos);
		} else {
			require (_nameSumLogos >= _getCreateChildTAOMinLogos());
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
	function getTAO(address _taoId) public view returns (string memory, address, string memory, string memory, string memory, string memory, bytes32, uint8) {
		TAO _tao = TAO(address(uint160(_taoId)));
		return (
			_tao.name(),
			_tao.originId(),
			Name(address(uint160(_tao.originId()))).name(),
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
	function getTAOIds(uint256 _from, uint256 _to) public view returns (address[] memory) {
		require (_from >= 0 && _to >= _from);
		require (taos.length > 0);

		address[] memory _taos = new address[](_to.sub(_from).add(1));
		if (_to > taos.length.sub(1)) {
			_to = taos.length.sub(1);
		}
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
		string memory _data,
		uint256 _nonce,
		address _validateAddress,
		string memory _name,
		uint8 _signatureV,
		bytes32 _signatureR,
		bytes32 _signatureS
	) public isTAO(_getTAOIdByName(_name)) view returns (bool, string memory, uint256) {
		address _signatureAddress = _getValidateSignatureAddress(_data, _nonce, _signatureV, _signatureR, _signatureS);
		if (_isTAOSignatureAddressValid(_validateAddress, _signatureAddress, _getTAOIdByName(_name), _nonce)) {
			return (true, Name(address(uint160(_nameFactory.ethAddressToNameId(_signatureAddress)))).name(), _nameTAOPosition.determinePosition(_signatureAddress, _getTAOIdByName(_name)));
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
		string memory _name,
		address _nameId,
		string memory _datHash,
		string memory _database,
		string memory _keyValue,
		bytes32 _contentId,
		address _parentId,
		uint256 _childMinLogos,
		bool _ethosCapStatus,
		uint256 _ethosCapAmount
	) internal returns (bool) {
		// Create the TAO
		address taoId = address(AOLibrary.deployTAO(_name, _nameId, _datHash, _database, _keyValue, _contentId, nameTAOVaultAddress));

		// Increment the nonce
		_nonces[taoId]++;

		// Store the name lookup information
		require (_nameTAOLookup.initialize(_name, taoId, 0, TAO(address(uint160(_parentId))).name(), _parentId, uint256(TAO(address(uint160(_parentId))).typeId())));

		// Store the Advocate/Listener/Speaker information
		require (_nameTAOPosition.initialize(taoId, _nameId, _nameId, _nameId));

		// Store the "Ancestry" info of this TAO
		require (_taoAncestry.initialize(taoId, _parentId, _childMinLogos));

		// Creat a Pool so that public can stake Ethos/Pathos on it
		require (_taoPool.createPool(taoId, _ethosCapStatus, _ethosCapAmount));

		taos.push(taoId);

		emit CreateTAO(_nameId, taoId, taos.length.sub(1), _name, _parentId, TAO(address(uint160(_parentId))).typeId());

		if (AOLibrary.isTAO(_parentId)) {
			require (_taoAncestry.addChild(_parentId, taoId));
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
			return (_nonce == _nonces[_taoId].add(1) &&
				_signatureAddress == _validateAddress &&
				_nameTAOPosition.senderIsPosition(_validateAddress, _taoId)
			);
		} else {
			return (
				_nonce == _nonces[_taoId].add(1) &&
				_nameTAOPosition.senderIsPosition(_signatureAddress, _taoId)
			);
		}
	}

	/**
	 * @dev Internal function to get the TAO Id by name
	 * @param _name The name of the TAO
	 * @return the TAO ID
	 */
	function _getTAOIdByName(string memory _name) internal view returns (address) {
		return _nameTAOLookup.getIdByName(_name);
	}

	/**
	 * @dev Get createChildTAOMinLogos setting
	 * @return createChildTAOMinLogos The minimum required Logos to create a TAO
	 */
	function _getCreateChildTAOMinLogos() internal view returns (uint256) {
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
	function _getValidateSignatureAddress(string memory _data, uint256 _nonce, uint8 _v, bytes32 _r, bytes32 _s) internal view returns (address) {
		bytes32 _hash = keccak256(abi.encodePacked(address(this), _data, _nonce));
		return ecrecover(_hash, _v, _r, _s);
	}
}
