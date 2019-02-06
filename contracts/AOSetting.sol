pragma solidity ^0.4.24;

import './AOLibrary.sol';
import './TheAO.sol';
import './IAOSetting.sol';
import './INameFactory.sol';
import './IAOSettingAttribute.sol';
import './IAOSettingValue.sol';
import './INameTAOPosition.sol';
import './INameAccountRecovery.sol';

/**
 * @title AOSetting
 *
 * This contract stores all AO setting variables
 */
contract AOSetting is TheAO, IAOSetting {
	address public nameFactoryAddress;
	address public nameAccountRecoveryAddress;
	address public aoSettingAttributeAddress;
	address public aoSettingValueAddress;

	INameFactory internal _nameFactory;
	INameTAOPosition internal _nameTAOPosition;
	INameAccountRecovery internal _nameAccountRecovery;
	IAOSettingAttribute internal _aoSettingAttribute;
	IAOSettingValue internal _aoSettingValue;

	uint8 constant public ADDRESS_SETTING_TYPE = 1;
	uint8 constant public BOOL_SETTING_TYPE = 2;
	uint8 constant public BYTES_SETTING_TYPE = 3;
	uint8 constant public STRING_SETTING_TYPE = 4;
	uint8 constant public UINT_SETTING_TYPE = 5;

	uint256 public totalSetting;

	/**
	 * Mapping from associatedTAOId's setting name to Setting ID.
	 *
	 * Instead of concatenating the associatedTAOID and setting name to create a unique ID for lookup,
	 * use nested mapping to achieve the same result.
	 *
	 * The setting's name needs to be converted to bytes32 since solidity does not support mapping by string.
	 */
	mapping (address => mapping (bytes32 => uint256)) internal nameSettingLookup;

	// Mapping from updateHashKey to it's settingId
	mapping (bytes32 => uint256) public updateHashLookup;

	// Mapping from setting ID to it's type
	// setting type 1 => uint256, 2 => bool, 3 => address, 4 => bytes32, 5 => string
	mapping (uint256 => uint8) internal _settingTypeLookup;

	// Event to be broadcasted to public when a setting is created and waiting for approval
	event SettingCreation(uint256 indexed settingId, address indexed creatorNameId, address creatorTAOId, address associatedTAOId, string settingName, bytes32 associatedTAOSettingId, bytes32 creatorTAOSettingId);

	// Event to be broadcasted to public when setting creation is approved/rejected by the advocate of associatedTAOId
	event ApproveSettingCreation(uint256 indexed settingId, address associatedTAOId, address associatedTAOAdvocate, bool approved);
	// Event to be broadcasted to public when setting creation is finalized by the advocate of creatorTAOId
	event FinalizeSettingCreation(uint256 indexed settingId, address creatorTAOId, address creatorTAOAdvocate);

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress,
		address _nameTAOPositionAddress,
		address _nameAccountRecoveryAddress,
		address _aoSettingAttributeAddress,
		address _aoSettingValueAddress
		) public {
		setNameFactoryAddress(_nameFactoryAddress);
		setNameTAOPositionAddress(_nameTAOPositionAddress);
		setNameAccountRecoveryAddress(_nameAccountRecoveryAddress);
		setAOSettingAttributeAddress(_aoSettingAttributeAddress);
		setAOSettingValueAddress(_aoSettingValueAddress);
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
	 * @dev Check if `_taoId` is a TAO
	 */
	modifier isTAO(address _taoId) {
		require (AOLibrary.isTAO(_taoId));
		_;
	}

	/**
	 * @dev Check if `_settingName` of `_associatedTAOId` is taken
	 */
	modifier settingNameNotTaken(string _settingName, address _associatedTAOId) {
		require (settingNameExist(_settingName, _associatedTAOId) == false);
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
	 * @dev Check is msg.sender address is a Name
	 */
	 modifier senderIsName() {
		require (_nameFactory.ethAddressToNameId(msg.sender) != address(0));
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
	 * @dev The AO sets AOSettingAttribute address
	 * @param _aoSettingAttributeAddress The address of AOSettingAttribute
	 */
	function setAOSettingAttributeAddress(address _aoSettingAttributeAddress) public onlyTheAO {
		require (_aoSettingAttributeAddress != address(0));
		aoSettingAttributeAddress = _aoSettingAttributeAddress;
		_aoSettingAttribute = IAOSettingAttribute(_aoSettingAttributeAddress);
	}

	/**
	 * @dev The AO sets AOSettingValue address
	 * @param _aoSettingValueAddress The address of AOSettingValue
	 */
	function setAOSettingValueAddress(address _aoSettingValueAddress) public onlyTheAO {
		require (_aoSettingValueAddress != address(0));
		aoSettingValueAddress = _aoSettingValueAddress;
		_aoSettingValue = IAOSettingValue(_aoSettingValueAddress);
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Check whether or not a setting name of an associatedTAOId exist
	 * @param _settingName The human-readable name of the setting
	 * @param _associatedTAOId The taoId that the setting affects
	 * @return true if yes. false otherwise
	 */
	function settingNameExist(string _settingName, address _associatedTAOId) public view returns (bool) {
		return (nameSettingLookup[_associatedTAOId][keccak256(abi.encodePacked(this, _settingName))] > 0);
	}

	/**
	 * @dev Advocate of _creatorTAOId adds a uint setting
	 * @param _settingName The human-readable name of the setting
	 * @param _value The uint256 value of the setting
	 * @param _creatorTAOId The taoId that created the setting
	 * @param _associatedTAOId The taoId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function addUintSetting(
		string _settingName,
		uint256 _value,
		address _creatorTAOId,
		address _associatedTAOId,
		string _extraData)
		public
		isTAO(_creatorTAOId)
		isTAO(_associatedTAOId)
		settingNameNotTaken(_settingName, _associatedTAOId)
		onlyAdvocate(_creatorTAOId)
		senderNameNotCompromised {
		// Update global variables
		totalSetting++;

		_settingTypeLookup[totalSetting] = UINT_SETTING_TYPE;

		// Store the value as pending value
		_aoSettingValue.setPendingValue(totalSetting, address(0), false, '', '', _value);

		// Store setting creation data
		_storeSettingCreation(_nameFactory.ethAddressToNameId(msg.sender), _settingName, _creatorTAOId, _associatedTAOId, _extraData);
	}

	/**
	 * @dev Advocate of _creatorTAOId adds a bool setting
	 * @param _settingName The human-readable name of the setting
	 * @param _value The bool value of the setting
	 * @param _creatorTAOId The taoId that created the setting
	 * @param _associatedTAOId The taoId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function addBoolSetting(
		string _settingName,
		bool _value,
		address _creatorTAOId,
		address _associatedTAOId,
		string _extraData)
		public
		isTAO(_creatorTAOId)
		isTAO(_associatedTAOId)
		settingNameNotTaken(_settingName, _associatedTAOId)
		onlyAdvocate(_creatorTAOId)
		senderNameNotCompromised {
		// Update global variables
		totalSetting++;

		_settingTypeLookup[totalSetting] = BOOL_SETTING_TYPE;

		// Store the value as pending value
		_aoSettingValue.setPendingValue(totalSetting, address(0), _value, '', '', 0);

		// Store setting creation data
		_storeSettingCreation(_nameFactory.ethAddressToNameId(msg.sender), _settingName, _creatorTAOId, _associatedTAOId, _extraData);
	}

	/**
	 * @dev Advocate of _creatorTAOId adds an address setting
	 * @param _settingName The human-readable name of the setting
	 * @param _value The address value of the setting
	 * @param _creatorTAOId The taoId that created the setting
	 * @param _associatedTAOId The taoId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function addAddressSetting(
		string _settingName,
		address _value,
		address _creatorTAOId,
		address _associatedTAOId,
		string _extraData)
		public
		isTAO(_creatorTAOId)
		isTAO(_associatedTAOId)
		settingNameNotTaken(_settingName, _associatedTAOId)
		onlyAdvocate(_creatorTAOId)
		senderNameNotCompromised {
		// Update global variables
		totalSetting++;

		_settingTypeLookup[totalSetting] = ADDRESS_SETTING_TYPE;

		// Store the value as pending value
		_aoSettingValue.setPendingValue(totalSetting, _value, false, '', '', 0);

		// Store setting creation data
		_storeSettingCreation(_nameFactory.ethAddressToNameId(msg.sender), _settingName, _creatorTAOId, _associatedTAOId, _extraData);
	}

	/**
	 * @dev Advocate of _creatorTAOId adds a bytes32 setting
	 * @param _settingName The human-readable name of the setting
	 * @param _value The bytes32 value of the setting
	 * @param _creatorTAOId The taoId that created the setting
	 * @param _associatedTAOId The taoId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function addBytesSetting(
		string _settingName,
		bytes32 _value,
		address _creatorTAOId,
		address _associatedTAOId,
		string _extraData)
		public
		isTAO(_creatorTAOId)
		isTAO(_associatedTAOId)
		settingNameNotTaken(_settingName, _associatedTAOId)
		onlyAdvocate(_creatorTAOId)
		senderNameNotCompromised {
		// Update global variables
		totalSetting++;

		_settingTypeLookup[totalSetting] = BYTES_SETTING_TYPE;

		// Store the value as pending value
		_aoSettingValue.setPendingValue(totalSetting, address(0), false, _value, '', 0);

		// Store setting creation data
		_storeSettingCreation(_nameFactory.ethAddressToNameId(msg.sender), _settingName, _creatorTAOId, _associatedTAOId, _extraData);
	}

	/**
	 * @dev Advocate of _creatorTAOId adds a string setting
	 * @param _settingName The human-readable name of the setting
	 * @param _value The string value of the setting
	 * @param _creatorTAOId The taoId that created the setting
	 * @param _associatedTAOId The taoId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function addStringSetting(
		string _settingName,
		string _value,
		address _creatorTAOId,
		address _associatedTAOId,
		string _extraData)
		public
		isTAO(_creatorTAOId)
		isTAO(_associatedTAOId)
		settingNameNotTaken(_settingName, _associatedTAOId)
		onlyAdvocate(_creatorTAOId)
		senderNameNotCompromised {
		// Update global variables
		totalSetting++;

		_settingTypeLookup[totalSetting] = STRING_SETTING_TYPE;

		// Store the value as pending value
		_aoSettingValue.setPendingValue(totalSetting, address(0), false, '', _value, 0);

		// Store setting creation data
		_storeSettingCreation(_nameFactory.ethAddressToNameId(msg.sender), _settingName, _creatorTAOId, _associatedTAOId, _extraData);
	}

	/**
	 * @dev Advocate of Setting's _associatedTAOId approves setting creation
	 * @param _settingId The ID of the setting to approve
	 * @param _approved Whether to approve or reject
	 */
	function approveSettingCreation(uint256 _settingId, bool _approved) public senderIsName senderNameNotCompromised {
		address _associatedTAOAdvocate = _nameFactory.ethAddressToNameId(msg.sender);
		require (_aoSettingAttribute.approveAdd(_settingId, _associatedTAOAdvocate, _approved));
		(,,, address _associatedTAOId, string memory _settingName,,,,) = _aoSettingAttribute.getSettingData(_settingId);
		if (!_approved) {
			// Clear the settingName from nameSettingLookup so it can be added again in the future
			delete nameSettingLookup[_associatedTAOId][keccak256(abi.encodePacked(this, _settingName))];
			delete _settingTypeLookup[_settingId];
		}
		emit ApproveSettingCreation(_settingId, _associatedTAOId, _associatedTAOAdvocate, _approved);
	}

	/**
	 * @dev Advocate of Setting's _creatorTAOId finalizes the setting creation once the setting is approved
	 * @param _settingId The ID of the setting to be finalized
	 */
	function finalizeSettingCreation(uint256 _settingId) public senderIsName senderNameNotCompromised {
		address _creatorTAOAdvocate = _nameFactory.ethAddressToNameId(msg.sender);
		require (_aoSettingAttribute.finalizeAdd(_settingId, _creatorTAOAdvocate));

		(,,address _creatorTAOId,,,,,,) = _aoSettingAttribute.getSettingData(_settingId);

		require (_aoSettingValue.movePendingToSetting(_settingId));

		emit FinalizeSettingCreation(_settingId, _creatorTAOId, _creatorTAOAdvocate);
	}

	/**
	 * @dev Get setting type of a setting ID
	 * @param _settingId The ID of the setting
	 * @return the setting type value
	 *		   setting type 1 => uint256, 2 => bool, 3 => address, 4 => bytes32, 5 => string
	 */
	function settingTypeLookup(uint256 _settingId) external view returns (uint8) {
		return _settingTypeLookup[_settingId];
	}

	/**
	 * @dev Get setting Id given an associatedTAOId and settingName
	 * @param _associatedTAOId The ID of the AssociatedTAO
	 * @param _settingName The name of the setting
	 * @return the ID of the setting
	 */
	function getSettingIdByTAOName(address _associatedTAOId, string _settingName) public view returns (uint256) {
		return nameSettingLookup[_associatedTAOId][keccak256(abi.encodePacked(this, _settingName))];
	}

	/**
	 * @dev Get setting values by setting ID.
	 *		Will throw error if the setting is not exist or rejected.
	 * @param _settingId The ID of the setting
	 * @return the uint256 value of this setting ID
	 * @return the bool value of this setting ID
	 * @return the address value of this setting ID
	 * @return the bytes32 value of this setting ID
	 * @return the string value of this setting ID
	 */
	function getSettingValuesById(uint256 _settingId) public view returns (uint256, bool, address, bytes32, string) {
		require (_aoSettingAttribute.settingExist(_settingId));
		_settingId = _aoSettingAttribute.getLatestSettingId(_settingId);
		(address _addressValue, bool _boolValue, bytes32 _bytesValue, string memory _stringValue, uint256 _uintValue) = _aoSettingValue.settingValue(_settingId);
		return (_uintValue, _boolValue, _addressValue, _bytesValue, _stringValue);
	}

	/**
	 * @dev Get setting values by taoId and settingName.
	 *		Will throw error if the setting is not exist or rejected.
	 * @param _taoId The ID of the TAO
	 * @param _settingName The name of the setting
	 * @return the uint256 value of this setting ID
	 * @return the bool value of this setting ID
	 * @return the address value of this setting ID
	 * @return the bytes32 value of this setting ID
	 * @return the string value of this setting ID
	 */
	function getSettingValuesByTAOName(address _taoId, string _settingName) external view returns (uint256, bool, address, bytes32, string) {
		return getSettingValuesById(getSettingIdByTAOName(_taoId, _settingName));
	}

	/**
	 * @dev Return the setting type values
	 * @return The setting type value for address
	 * @return The setting type value for bool
	 * @return The setting type value for bytes
	 * @return The setting type value for string
	 * @return The setting type value for uint
	 */
	function getSettingTypes() external view returns (uint8, uint8, uint8, uint8, uint8) {
		return (
			ADDRESS_SETTING_TYPE,
			BOOL_SETTING_TYPE,
			BYTES_SETTING_TYPE,
			STRING_SETTING_TYPE,
			UINT_SETTING_TYPE
		);
	}

	/***** Internal Method *****/
	/**
	 * @dev Store setting creation data
	 * @param _creatorNameId The nameId that created the setting
	 * @param _settingName The human-readable name of the setting
	 * @param _creatorTAOId The taoId that created the setting
	 * @param _associatedTAOId The taoId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function _storeSettingCreation(address _creatorNameId, string _settingName, address _creatorTAOId, address _associatedTAOId, string _extraData) internal {
		// Store nameSettingLookup
		nameSettingLookup[_associatedTAOId][keccak256(abi.encodePacked(address(this), _settingName))] = totalSetting;

		// Store setting data/state
		(bytes32 _associatedTAOSettingId, bytes32 _creatorTAOSettingId) = _aoSettingAttribute.add(totalSetting, _creatorNameId, _settingName, _creatorTAOId, _associatedTAOId, _extraData);

		emit SettingCreation(totalSetting, _creatorNameId, _creatorTAOId, _associatedTAOId, _settingName, _associatedTAOSettingId, _creatorTAOSettingId);
	}
}
