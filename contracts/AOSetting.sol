pragma solidity ^0.4.24;

import './NameFactory.sol';
import './AOSettingAttribute.sol';
import './AOUintSetting.sol';
import './AOBoolSetting.sol';
import './AOAddressSetting.sol';
import './AOBytesSetting.sol';
import './AOStringSetting.sol';
import './AOLibrary.sol';

/**
 * @title AOSetting
 *
 * This contract stores all AO setting variables
 */
contract AOSetting {
	address public aoSettingAttributeAddress;
	address public aoUintSettingAddress;
	address public aoBoolSettingAddress;
	address public aoAddressSettingAddress;
	address public aoBytesSettingAddress;
	address public aoStringSettingAddress;

	NameFactory internal _nameFactory;
	AOSettingAttribute internal _aoSettingAttribute;
	AOUintSetting internal _aoUintSetting;
	AOBoolSetting internal _aoBoolSetting;
	AOAddressSetting internal _aoAddressSetting;
	AOBytesSetting internal _aoBytesSetting;
	AOStringSetting internal _aoStringSetting;

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

	// Event to be broadcasted to public when a setting is created and waiting for approval
	event SettingCreation(uint256 indexed settingId, address indexed creatorNameId, address creatorTAOId, address associatedTAOId, string settingName, uint8 settingType, bytes32 associatedTAOSettingId, bytes32 creatorTAOSettingId);

	// Event to be broadcasted to public when setting creation is approved/rejected by the advocate of associatedTAOId
	event ApproveSettingCreation(uint256 indexed settingId, address associatedTAOId, address associatedTAOAdvocate, bool approved);
	// Event to be broadcasted to public when setting creation is finalized by the advocate of creatorTAOId
	event FinalizeSettingCreation(uint256 indexed settingId, address creatorTAOId, address creatorTAOAdvocate);

	// Event to be broadcasted to public when a proposed update for a setting is created
	event SettingUpdate(uint256 indexed settingId, address indexed updateAdvocateNameId, address proposalTAOId);

	// Event to be broadcasted to public when setting update is approved/rejected by the advocate of proposalTAOId
	event ApproveSettingUpdate(uint256 indexed settingId, address proposalTAOId, address proposalTAOAdvocate, bool approved);

	// Event to be broadcasted to public when setting update is finalized by the advocate of associatedTAOId
	event FinalizeSettingUpdate(uint256 indexed settingId, address associatedTAOId, address associatedTAOAdvocate);

	// Event to be broadcasted to public when a setting deprecation is created and waiting for approval
	event SettingDeprecation(uint256 indexed settingId, address indexed creatorNameId, address creatorTAOId, address associatedTAOId, uint256 newSettingId, address newSettingContractAddress, bytes32 associatedTAOSettingDeprecationId, bytes32 creatorTAOSettingDeprecationId);

	// Event to be broadcasted to public when setting deprecation is approved/rejected by the advocate of associatedTAOId
	event ApproveSettingDeprecation(uint256 indexed settingId, address associatedTAOId, address associatedTAOAdvocate, bool approved);

	// Event to be broadcasted to public when setting deprecation is finalized by the advocate of creatorTAOId
	event FinalizeSettingDeprecation(uint256 indexed settingId, address creatorTAOId, address creatorTAOAdvocate);

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress,
		address _aoSettingAttributeAddress,
		address _aoUintSettingAddress,
		address _aoBoolSettingAddress,
		address _aoAddressSettingAddress,
		address _aoBytesSettingAddress,
		address _aoStringSettingAddress) public {
		aoSettingAttributeAddress = _aoSettingAttributeAddress;
		aoUintSettingAddress = _aoUintSettingAddress;
		aoBoolSettingAddress = _aoBoolSettingAddress;
		aoAddressSettingAddress = _aoAddressSettingAddress;
		aoBytesSettingAddress = _aoBytesSettingAddress;
		aoStringSettingAddress = _aoStringSettingAddress;
		_nameFactory = NameFactory(_nameFactoryAddress);
		_aoSettingAttribute = AOSettingAttribute(_aoSettingAttributeAddress);
		_aoUintSetting = AOUintSetting(_aoUintSettingAddress);
		_aoBoolSetting = AOBoolSetting(_aoBoolSettingAddress);
		_aoAddressSetting = AOAddressSetting(_aoAddressSettingAddress);
		_aoBytesSetting = AOBytesSetting(_aoBytesSettingAddress);
		_aoStringSetting = AOStringSetting(_aoStringSettingAddress);
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
	 * @dev Check if sender is the advocate of a TAO
	 */
	modifier isAdvocateOfTAO(address _taoId) {
		require (AOLibrary.isAdvocateOfTAO(msg.sender, _taoId));
		_;
	}

	/***** Public Methods *****/
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
	function addUintSetting(string _settingName, uint256 _value, address _creatorTAOId, address _associatedTAOId, string _extraData) public isTAO(_creatorTAOId) isTAO(_associatedTAOId) settingNameNotTaken(_settingName, _associatedTAOId) isAdvocateOfTAO(_creatorTAOId) {
		// Update global variables
		totalSetting++;

		// Store the value as pending value
		_aoUintSetting.setPendingValue(totalSetting, _value);

		// Store setting creation data
		_storeSettingCreation(_nameFactory.ethAddressToNameId(msg.sender), 1, _settingName, _creatorTAOId, _associatedTAOId, _extraData);
	}

	/**
	 * @dev Advocate of _creatorTAOId adds a bool setting
	 * @param _settingName The human-readable name of the setting
	 * @param _value The bool value of the setting
	 * @param _creatorTAOId The taoId that created the setting
	 * @param _associatedTAOId The taoId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function addBoolSetting(string _settingName, bool _value, address _creatorTAOId, address _associatedTAOId, string _extraData) public isTAO(_creatorTAOId) isTAO(_associatedTAOId) settingNameNotTaken(_settingName, _associatedTAOId) isAdvocateOfTAO(_creatorTAOId) {
		// Update global variables
		totalSetting++;

		// Store the value as pending value
		_aoBoolSetting.setPendingValue(totalSetting, _value);

		// Store setting creation data
		_storeSettingCreation(_nameFactory.ethAddressToNameId(msg.sender), 2, _settingName, _creatorTAOId, _associatedTAOId, _extraData);
	}

	/**
	 * @dev Advocate of _creatorTAOId adds an address setting
	 * @param _settingName The human-readable name of the setting
	 * @param _value The address value of the setting
	 * @param _creatorTAOId The taoId that created the setting
	 * @param _associatedTAOId The taoId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function addAddressSetting(string _settingName, address _value, address _creatorTAOId, address _associatedTAOId, string _extraData) public isTAO(_creatorTAOId) isTAO(_associatedTAOId) settingNameNotTaken(_settingName, _associatedTAOId) isAdvocateOfTAO(_creatorTAOId) {
		// Update global variables
		totalSetting++;

		// Store the value as pending value
		_aoAddressSetting.setPendingValue(totalSetting, _value);

		// Store setting creation data
		_storeSettingCreation(_nameFactory.ethAddressToNameId(msg.sender), 3, _settingName, _creatorTAOId, _associatedTAOId, _extraData);
	}

	/**
	 * @dev Advocate of _creatorTAOId adds a bytes32 setting
	 * @param _settingName The human-readable name of the setting
	 * @param _value The bytes32 value of the setting
	 * @param _creatorTAOId The taoId that created the setting
	 * @param _associatedTAOId The taoId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function addBytesSetting(string _settingName, bytes32 _value, address _creatorTAOId, address _associatedTAOId, string _extraData) public isTAO(_creatorTAOId) isTAO(_associatedTAOId) settingNameNotTaken(_settingName, _associatedTAOId) isAdvocateOfTAO(_creatorTAOId) {
		// Update global variables
		totalSetting++;

		// Store the value as pending value
		_aoBytesSetting.setPendingValue(totalSetting, _value);

		// Store setting creation data
		_storeSettingCreation(_nameFactory.ethAddressToNameId(msg.sender), 4, _settingName, _creatorTAOId, _associatedTAOId, _extraData);
	}

	/**
	 * @dev Advocate of _creatorTAOId adds a string setting
	 * @param _settingName The human-readable name of the setting
	 * @param _value The string value of the setting
	 * @param _creatorTAOId The taoId that created the setting
	 * @param _associatedTAOId The taoId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function addStringSetting(string _settingName, string _value, address _creatorTAOId, address _associatedTAOId, string _extraData) public isTAO(_creatorTAOId) isTAO(_associatedTAOId) settingNameNotTaken(_settingName, _associatedTAOId) isAdvocateOfTAO(_creatorTAOId) {
		// Update global variables
		totalSetting++;

		// Store the value as pending value
		_aoStringSetting.setPendingValue(totalSetting, _value);

		// Store setting creation data
		_storeSettingCreation(_nameFactory.ethAddressToNameId(msg.sender), 5, _settingName, _creatorTAOId, _associatedTAOId, _extraData);
	}

	/**
	 * @dev Advocate of Setting's _associatedTAOId approves setting creation
	 * @param _settingId The ID of the setting to approve
	 * @param _approved Whether to approve or reject
	 */
	function approveSettingCreation(uint256 _settingId, bool _approved) public {
		address _associatedTAOAdvocate = _nameFactory.ethAddressToNameId(msg.sender);
		require (_aoSettingAttribute.approveAdd(_settingId, _associatedTAOAdvocate, _approved));

		(,,,address _associatedTAOId, string memory _settingName,,,,,) = _aoSettingAttribute.getSettingData(_settingId);
		if (!_approved) {
			// Clear the settingName from nameSettingLookup so it can be added again in the future
			delete nameSettingLookup[_associatedTAOId][keccak256(abi.encodePacked(this, _settingName))];
		}
		emit ApproveSettingCreation(_settingId, _associatedTAOId, _associatedTAOAdvocate, _approved);
	}

	/**
	 * @dev Advocate of Setting's _creatorTAOId finalizes the setting creation once the setting is approved
	 * @param _settingId The ID of the setting to be finalized
	 */
	function finalizeSettingCreation(uint256 _settingId) public {
		address _creatorTAOAdvocate = _nameFactory.ethAddressToNameId(msg.sender);
		require (_aoSettingAttribute.finalizeAdd(_settingId, _creatorTAOAdvocate));

		(,,address _creatorTAOId,,, uint8 _settingType,,,,) = _aoSettingAttribute.getSettingData(_settingId);

		_movePendingToSetting(_settingId, _settingType);

		emit FinalizeSettingCreation(_settingId, _creatorTAOId, _creatorTAOAdvocate);
	}

	/**
	 * @dev Advocate of Setting's _associatedTAOId submits a uint256 setting update after an update has been proposed
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new uint256 value for this setting
	 * @param _proposalTAOId The child of the associatedTAOId with the update Logos
	 * @param _updateSignature A signature of the proposalTAOId and update value by associatedTAOId's advocate's name address
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function updateUintSetting(uint256 _settingId, uint256 _newValue, address _proposalTAOId, string _updateSignature, string _extraData) public isTAO(_proposalTAOId) {
		// Store the setting state data
		require (_aoSettingAttribute.update(_settingId, 1, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId, _updateSignature, _extraData));

		// Store the value as pending value
		_aoUintSetting.setPendingValue(_settingId, _newValue);

		// Store the update hash key lookup
		updateHashLookup[keccak256(abi.encodePacked(this, _proposalTAOId, _aoUintSetting.settingValue(_settingId), _newValue, _extraData, _settingId))] = _settingId;

		emit SettingUpdate(_settingId, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId);
	}

	/**
	 * @dev Advocate of Setting's _associatedTAOId submits a bool setting update after an update has been proposed
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new bool value for this setting
	 * @param _proposalTAOId The child of the associatedTAOId with the update Logos
	 * @param _updateSignature A signature of the proposalTAOId and update value by associatedTAOId's advocate's name address
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function updateBoolSetting(uint256 _settingId, bool _newValue, address _proposalTAOId, string _updateSignature, string _extraData) public isTAO(_proposalTAOId) {
		// Store the setting state data
		require (_aoSettingAttribute.update(_settingId, 2, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId, _updateSignature, _extraData));

		// Store the value as pending value
		_aoBoolSetting.setPendingValue(_settingId, _newValue);

		// Store the update hash key lookup
		updateHashLookup[keccak256(abi.encodePacked(this, _proposalTAOId, _aoBoolSetting.settingValue(_settingId), _newValue, _extraData, _settingId))] = _settingId;

		emit SettingUpdate(_settingId, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId);
	}

	/**
	 * @dev Advocate of Setting's _associatedTAOId submits an address setting update after an update has been proposed
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new address value for this setting
	 * @param _proposalTAOId The child of the associatedTAOId with the update Logos
	 * @param _updateSignature A signature of the proposalTAOId and update value by associatedTAOId's advocate's name address
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function updateAddressSetting(uint256 _settingId, address _newValue, address _proposalTAOId, string _updateSignature, string _extraData) public isTAO(_proposalTAOId) {
		// Store the setting state data
		require (_aoSettingAttribute.update(_settingId, 3, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId, _updateSignature, _extraData));

		// Store the value as pending value
		_aoAddressSetting.setPendingValue(_settingId, _newValue);

		// Store the update hash key lookup
		updateHashLookup[keccak256(abi.encodePacked(this, _proposalTAOId, _aoAddressSetting.settingValue(_settingId), _newValue, _extraData, _settingId))] = _settingId;

		emit SettingUpdate(_settingId, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId);
	}

	/**
	 * @dev Advocate of Setting's _associatedTAOId submits a bytes32 setting update after an update has been proposed
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new bytes32 value for this setting
	 * @param _proposalTAOId The child of the associatedTAOId with the update Logos
	 * @param _updateSignature A signature of the proposalTAOId and update value by associatedTAOId's advocate's name address
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function updateBytesSetting(uint256 _settingId, bytes32 _newValue, address _proposalTAOId, string _updateSignature, string _extraData) public isTAO(_proposalTAOId) {
		// Store the setting state data
		require (_aoSettingAttribute.update(_settingId, 4, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId, _updateSignature, _extraData));

		// Store the value as pending value
		_aoBytesSetting.setPendingValue(_settingId, _newValue);

		// Store the update hash key lookup
		updateHashLookup[keccak256(abi.encodePacked(this, _proposalTAOId, _aoBytesSetting.settingValue(_settingId), _newValue, _extraData, _settingId))] = _settingId;

		emit SettingUpdate(_settingId, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId);
	}

	/**
	 * @dev Advocate of Setting's _associatedTAOId submits a string setting update after an update has been proposed
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new string value for this setting
	 * @param _proposalTAOId The child of the associatedTAOId with the update Logos
	 * @param _updateSignature A signature of the proposalTAOId and update value by associatedTAOId's advocate's name address
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function updateStringSetting(uint256 _settingId, string _newValue, address _proposalTAOId, string _updateSignature, string _extraData) public isTAO(_proposalTAOId) {
		// Store the setting state data
		require (_aoSettingAttribute.update(_settingId, 5, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId, _updateSignature, _extraData));

		// Store the value as pending value
		_aoStringSetting.setPendingValue(_settingId, _newValue);

		// Store the update hash key lookup
		updateHashLookup[keccak256(abi.encodePacked(this, _proposalTAOId, _aoStringSetting.settingValue(_settingId), _newValue, _extraData, _settingId))] = _settingId;

		emit SettingUpdate(_settingId, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId);
	}

	/**
	 * @dev Advocate of Setting's proposalTAOId approves the setting update
	 * @param _settingId The ID of the setting to be approved
	 * @param _approved Whether to approve or reject
	 */
	function approveSettingUpdate(uint256 _settingId, bool _approved) public {
		address _proposalTAOAdvocate = _nameFactory.ethAddressToNameId(msg.sender);
		(,,, address _proposalTAOId,,,) = _aoSettingAttribute.getSettingState(_settingId);

		require (_aoSettingAttribute.approveUpdate(_settingId, _proposalTAOAdvocate, _approved));

		emit ApproveSettingUpdate(_settingId, _proposalTAOId, _proposalTAOAdvocate, _approved);
	}

	/**
	 * @dev Advocate of Setting's _associatedTAOId finalizes the setting update once the setting is approved
	 * @param _settingId The ID of the setting to be finalized
	 */
	function finalizeSettingUpdate(uint256 _settingId) public {
		address _associatedTAOAdvocate = _nameFactory.ethAddressToNameId(msg.sender);
		require (_aoSettingAttribute.finalizeUpdate(_settingId, _associatedTAOAdvocate));

		(,,, address _associatedTAOId,, uint8 _settingType,,,,) = _aoSettingAttribute.getSettingData(_settingId);

		_movePendingToSetting(_settingId, _settingType);

		emit FinalizeSettingUpdate(_settingId, _associatedTAOId, _associatedTAOAdvocate);
	}

	/**
	 * @dev Advocate of _creatorTAOId adds a setting deprecation
	 * @param _settingId The ID of the setting to be deprecated
	 * @param _newSettingId The new setting ID to route
	 * @param _newSettingContractAddress The new setting contract address to route
	 * @param _creatorTAOId The taoId that created the setting
	 * @param _associatedTAOId The taoId that the setting affects
	 */
	function addSettingDeprecation(uint256 _settingId, uint256 _newSettingId, address _newSettingContractAddress, address _creatorTAOId, address _associatedTAOId) public isTAO(_creatorTAOId) isTAO(_associatedTAOId) isAdvocateOfTAO(_creatorTAOId) {
		(bytes32 _associatedTAOSettingDeprecationId, bytes32 _creatorTAOSettingDeprecationId) = _aoSettingAttribute.addDeprecation(_settingId, _nameFactory.ethAddressToNameId(msg.sender), _creatorTAOId, _associatedTAOId, _newSettingId, _newSettingContractAddress);

		emit SettingDeprecation(_settingId, _nameFactory.ethAddressToNameId(msg.sender), _creatorTAOId, _associatedTAOId, _newSettingId, _newSettingContractAddress, _associatedTAOSettingDeprecationId, _creatorTAOSettingDeprecationId);
	}

	/**
	 * @dev Advocate of SettingDeprecation's _associatedTAOId approves setting deprecation
	 * @param _settingId The ID of the setting to approve
	 * @param _approved Whether to approve or reject
	 */
	function approveSettingDeprecation(uint256 _settingId, bool _approved) public {
		address _associatedTAOAdvocate = _nameFactory.ethAddressToNameId(msg.sender);
		require (_aoSettingAttribute.approveDeprecation(_settingId, _associatedTAOAdvocate, _approved));

		(,,, address _associatedTAOId,,,,,,,,) = _aoSettingAttribute.getSettingDeprecation(_settingId);
		emit ApproveSettingDeprecation(_settingId, _associatedTAOId, _associatedTAOAdvocate, _approved);
	}

	/**
	 * @dev Advocate of SettingDeprecation's _creatorTAOId finalizes the setting deprecation once the setting deprecation is approved
	 * @param _settingId The ID of the setting to be finalized
	 */
	function finalizeSettingDeprecation(uint256 _settingId) public {
		address _creatorTAOAdvocate = _nameFactory.ethAddressToNameId(msg.sender);
		require (_aoSettingAttribute.finalizeDeprecation(_settingId, _creatorTAOAdvocate));

		(,, address _creatorTAOId,,,,,,,,,) = _aoSettingAttribute.getSettingDeprecation(_settingId);
		emit FinalizeSettingDeprecation(_settingId, _creatorTAOId, _creatorTAOAdvocate);
	}

	/**
	 * @dev Get setting Id given an associatedTAOId and settingName
	 * @param _associatedTAOId The ID of the AssociatedTAO
	 * @param _settingName The name of the setting
	 * @return the ID of the setting
	 */
	function getSettingIdByTAOName(address _associatedTAOId, string _settingName) public view returns (uint256) {
		require (settingNameExist(_settingName, _associatedTAOId));
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
		return AOLibrary.getSettingValuesById(aoSettingAttributeAddress, aoUintSettingAddress, aoBoolSettingAddress, aoAddressSettingAddress, aoBytesSettingAddress, aoStringSettingAddress, _settingId);
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
	function getSettingValuesByTAOName(address _taoId, string _settingName) public view returns (uint256, bool, address, bytes32, string) {
		return AOLibrary.getSettingValuesById(aoSettingAttributeAddress, aoUintSettingAddress, aoBoolSettingAddress, aoAddressSettingAddress, aoBytesSettingAddress, aoStringSettingAddress, getSettingIdByTAOName(_taoId, _settingName));
	}

	/***** Internal Method *****/
	/**
	 * @dev Store setting creation data
	 * @param _creatorNameId The nameId that created the setting
	 * @param _settingType The type of this setting. 1 => uint256, 2 => bool, 3 => address, 4 => bytes32, 5 => string
	 * @param _settingName The human-readable name of the setting
	 * @param _creatorTAOId The taoId that created the setting
	 * @param _associatedTAOId The taoId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function _storeSettingCreation(address _creatorNameId, uint8 _settingType, string _settingName, address _creatorTAOId, address _associatedTAOId, string _extraData) internal {
		// Make sure _settingType is in supported list
		require (_settingType >= 1 && _settingType <= 5);

		// Store nameSettingLookup
		nameSettingLookup[_associatedTAOId][keccak256(abi.encodePacked(this, _settingName))] = totalSetting;

		// Store setting data/state
		(bytes32 _associatedTAOSettingId, bytes32 _creatorTAOSettingId) = _aoSettingAttribute.add(totalSetting, _creatorNameId, _settingType, _settingName, _creatorTAOId, _associatedTAOId, _extraData);

		emit SettingCreation(totalSetting, _creatorNameId, _creatorTAOId, _associatedTAOId, _settingName, _settingType, _associatedTAOSettingId, _creatorTAOSettingId);
	}

	/**
	 * @dev Move value of _settingId from pending variable to setting variable
	 * @param _settingId The ID of the setting
	 * @param _settingType The type of the setting
	 */
	function _movePendingToSetting(uint256 _settingId, uint8 _settingType) internal {
		// If settingType == uint256
		if (_settingType == 1) {
			_aoUintSetting.movePendingToSetting(_settingId);
		} else if (_settingType == 2) {
			// Else if settingType == bool
			_aoBoolSetting.movePendingToSetting(_settingId);
		} else if (_settingType == 3) {
			// Else if settingType == address
			_aoAddressSetting.movePendingToSetting(_settingId);
		} else if (_settingType == 4) {
			// Else if settingType == bytes32
			_aoBytesSetting.movePendingToSetting(_settingId);
		} else {
			// Else if settingType == string
			_aoStringSetting.movePendingToSetting(_settingId);
		}
	}
}
