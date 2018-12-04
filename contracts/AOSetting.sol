pragma solidity ^0.4.24;

import './Thought.sol';
import './Name.sol';
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
	 * Mapping from associatedThoughtId's setting name to Setting ID.
	 *
	 * Instead of concatenating the associatedThoughtID and setting name to create a unique ID for lookup,
	 * use nested mapping to achieve the same result.
	 *
	 * The setting's name needs to be converted to bytes32 since solidity does not support mapping by string.
	 */
	mapping (address => mapping (bytes32 => uint256)) internal nameSettingLookup;

	// Mapping from updateHashKey to it's settingId
	mapping (bytes32 => uint256) public updateHashLookup;

	// Event to be broadcasted to public when a setting is created and waiting for approval
	event SettingCreation(uint256 indexed settingId, address indexed creatorNameId, address creatorThoughtId, address associatedThoughtId, string settingName, uint8 settingType, bytes32 associatedThoughtSettingId, bytes32 creatorThoughtSettingId);

	// Event to be broadcasted to public when setting creation is approved/rejected by the advocate of associatedThoughtId
	event ApproveSettingCreation(uint256 indexed settingId, address associatedThoughtId, address associatedThoughtAdvocate, bool approved);
	// Event to be broadcasted to public when setting creation is finalized by the advocate of creatorThoughtId
	event FinalizeSettingCreation(uint256 indexed settingId, address creatorThoughtId, address creatorThoughtAdvocate);

	// Event to be broadcasted to public when a proposed update for a setting is created
	event SettingUpdate(uint256 indexed settingId, address indexed updateAdvocateNameId, address proposalThoughtId);

	// Event to be broadcasted to public when setting update is approved/rejected by the advocate of proposalThoughtId
	event ApproveSettingUpdate(uint256 indexed settingId, address proposalThoughtId, address proposalThoughtAdvocate, bool approved);

	// Event to be broadcasted to public when setting update is finalized by the advocate of associatedThoughtId
	event FinalizeSettingUpdate(uint256 indexed settingId, address associatedThoughtId, address associatedThoughtAdvocate);

	// Event to be broadcasted to public when a setting deprecation is created and waiting for approval
	event SettingDeprecation(uint256 indexed settingId, address indexed creatorNameId, address creatorThoughtId, address associatedThoughtId, uint256 newSettingId, address newSettingContractAddress, bytes32 associatedThoughtSettingDeprecationId, bytes32 creatorThoughtSettingDeprecationId);

	// Event to be broadcasted to public when setting deprecation is approved/rejected by the advocate of associatedThoughtId
	event ApproveSettingDeprecation(uint256 indexed settingId, address associatedThoughtId, address associatedThoughtAdvocate, bool approved);

	// Event to be broadcasted to public when setting deprecation is finalized by the advocate of creatorThoughtId
	event FinalizeSettingDeprecation(uint256 indexed settingId, address creatorThoughtId, address creatorThoughtAdvocate);

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
	 * @dev Check if `_thoughtId` is a Thought
	 */
	modifier isThought(address _thoughtId) {
		require (Thought(_thoughtId).originNameId() != address(0) && Thought(_thoughtId).thoughtTypeId() == 0);
		_;
	}

	/**
	 * @dev Check if `_settingName` of `_associatedThoughtId` is taken
	 */
	modifier settingNameNotTaken(string _settingName, address _associatedThoughtId) {
		require (settingNameExist(_settingName, _associatedThoughtId) == false);
		_;
	}

	/**
	 * @dev Check if sender is the advocate of a Thought
	 */
	modifier isAdvocate(address _sender, address _thoughtId) {
		require (_nameFactory.ethAddressToNameId(msg.sender) == Thought(_thoughtId).advocateId());
		_;
	}

	/***** Public Methods *****/
	/**
	 * @dev Check whether or not a setting name of an associatedThoughtId exist
	 * @param _settingName The human-readable name of the setting
	 * @param _associatedThoughtId The thoughtId that the setting affects
	 * @return true if yes. false otherwise
	 */
	function settingNameExist(string _settingName, address _associatedThoughtId) public view returns (bool) {
		return (nameSettingLookup[_associatedThoughtId][keccak256(abi.encodePacked(this, _settingName))] > 0);
	}

	/**
	 * @dev Advocate of _creatorThoughtId adds a uint setting
	 * @param _settingName The human-readable name of the setting
	 * @param _value The uint256 value of the setting
	 * @param _creatorThoughtId The thoughtId that created the setting
	 * @param _associatedThoughtId The thoughtId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function addUintSetting(string _settingName, uint256 _value, address _creatorThoughtId, address _associatedThoughtId, string _extraData) public isThought(_creatorThoughtId) isThought(_associatedThoughtId) settingNameNotTaken(_settingName, _associatedThoughtId) isAdvocate(msg.sender, _creatorThoughtId) {
		// Update global variables
		totalSetting++;

		// Store the value as pending value
		_aoUintSetting.setPendingValue(totalSetting, _value);

		// Store setting creation data
		_storeSettingCreation(_nameFactory.ethAddressToNameId(msg.sender), 1, _settingName, _creatorThoughtId, _associatedThoughtId, _extraData);
	}

	/**
	 * @dev Advocate of _creatorThoughtId adds a bool setting
	 * @param _settingName The human-readable name of the setting
	 * @param _value The bool value of the setting
	 * @param _creatorThoughtId The thoughtId that created the setting
	 * @param _associatedThoughtId The thoughtId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function addBoolSetting(string _settingName, bool _value, address _creatorThoughtId, address _associatedThoughtId, string _extraData) public isThought(_creatorThoughtId) isThought(_associatedThoughtId) settingNameNotTaken(_settingName, _associatedThoughtId) isAdvocate(msg.sender, _creatorThoughtId) {
		// Update global variables
		totalSetting++;

		// Store the value as pending value
		_aoBoolSetting.setPendingValue(totalSetting, _value);

		// Store setting creation data
		_storeSettingCreation(_nameFactory.ethAddressToNameId(msg.sender), 2, _settingName, _creatorThoughtId, _associatedThoughtId, _extraData);
	}

	/**
	 * @dev Advocate of _creatorThoughtId adds an address setting
	 * @param _settingName The human-readable name of the setting
	 * @param _value The address value of the setting
	 * @param _creatorThoughtId The thoughtId that created the setting
	 * @param _associatedThoughtId The thoughtId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function addAddressSetting(string _settingName, address _value, address _creatorThoughtId, address _associatedThoughtId, string _extraData) public isThought(_creatorThoughtId) isThought(_associatedThoughtId) settingNameNotTaken(_settingName, _associatedThoughtId) isAdvocate(msg.sender, _creatorThoughtId) {
		// Update global variables
		totalSetting++;

		// Store the value as pending value
		_aoAddressSetting.setPendingValue(totalSetting, _value);

		// Store setting creation data
		_storeSettingCreation(_nameFactory.ethAddressToNameId(msg.sender), 3, _settingName, _creatorThoughtId, _associatedThoughtId, _extraData);
	}

	/**
	 * @dev Advocate of _creatorThoughtId adds a bytes32 setting
	 * @param _settingName The human-readable name of the setting
	 * @param _value The bytes32 value of the setting
	 * @param _creatorThoughtId The thoughtId that created the setting
	 * @param _associatedThoughtId The thoughtId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function addBytesSetting(string _settingName, bytes32 _value, address _creatorThoughtId, address _associatedThoughtId, string _extraData) public isThought(_creatorThoughtId) isThought(_associatedThoughtId) settingNameNotTaken(_settingName, _associatedThoughtId) isAdvocate(msg.sender, _creatorThoughtId) {
		// Update global variables
		totalSetting++;

		// Store the value as pending value
		_aoBytesSetting.setPendingValue(totalSetting, _value);

		// Store setting creation data
		_storeSettingCreation(_nameFactory.ethAddressToNameId(msg.sender), 4, _settingName, _creatorThoughtId, _associatedThoughtId, _extraData);
	}

	/**
	 * @dev Advocate of _creatorThoughtId adds a string setting
	 * @param _settingName The human-readable name of the setting
	 * @param _value The string value of the setting
	 * @param _creatorThoughtId The thoughtId that created the setting
	 * @param _associatedThoughtId The thoughtId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function addStringSetting(string _settingName, string _value, address _creatorThoughtId, address _associatedThoughtId, string _extraData) public isThought(_creatorThoughtId) isThought(_associatedThoughtId) settingNameNotTaken(_settingName, _associatedThoughtId) isAdvocate(msg.sender, _creatorThoughtId) {
		// Update global variables
		totalSetting++;

		// Store the value as pending value
		_aoStringSetting.setPendingValue(totalSetting, _value);

		// Store setting creation data
		_storeSettingCreation(_nameFactory.ethAddressToNameId(msg.sender), 5, _settingName, _creatorThoughtId, _associatedThoughtId, _extraData);
	}

	/**
	 * @dev Advocate of Setting's _associatedThoughtId approves setting creation
	 * @param _settingId The ID of the setting to approve
	 * @param _approved Whether to approve or reject
	 */
	function approveSettingCreation(uint256 _settingId, bool _approved) public {
		address _associatedThoughtAdvocate = _nameFactory.ethAddressToNameId(msg.sender);
		require (_aoSettingAttribute.approveAdd(_settingId, _associatedThoughtAdvocate, _approved));

		(,,,address _associatedThoughtId, string memory _settingName,,,,,) = _aoSettingAttribute.getSettingData(_settingId);
		if (!_approved) {
			// Clear the settingName from nameSettingLookup so it can be added again in the future
			delete nameSettingLookup[_associatedThoughtId][keccak256(abi.encodePacked(this, _settingName))];
		}
		emit ApproveSettingCreation(_settingId, _associatedThoughtId, _associatedThoughtAdvocate, _approved);
	}

	/**
	 * @dev Advocate of Setting's _creatorThoughtId finalizes the setting creation once the setting is approved
	 * @param _settingId The ID of the setting to be finalized
	 */
	function finalizeSettingCreation(uint256 _settingId) public {
		address _creatorThoughtAdvocate = _nameFactory.ethAddressToNameId(msg.sender);
		require (_aoSettingAttribute.finalizeAdd(_settingId, _creatorThoughtAdvocate));

		(,,address _creatorThoughtId,,, uint8 _settingType,,,,) = _aoSettingAttribute.getSettingData(_settingId);

		_movePendingToSetting(_settingId, _settingType);

		emit FinalizeSettingCreation(_settingId, _creatorThoughtId, _creatorThoughtAdvocate);
	}

	/**
	 * @dev Advocate of Setting's _associatedThoughtId submits a uint256 setting update after an update has been proposed
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new uint256 value for this setting
	 * @param _proposalThoughtId The child of the associatedThoughtId with the update Logos
	 * @param _updateSignature A signature of the proposalThoughtId and update value by associatedThoughtId's advocate's name address
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function updateUintSetting(uint256 _settingId, uint256 _newValue, address _proposalThoughtId, string _updateSignature, string _extraData) public isThought(_proposalThoughtId) {
		// Store the setting state data
		require (_aoSettingAttribute.update(_settingId, 1, _nameFactory.ethAddressToNameId(msg.sender), _proposalThoughtId, _updateSignature, _extraData));

		// Store the value as pending value
		_aoUintSetting.setPendingValue(_settingId, _newValue);

		// Store the update hash key lookup
		updateHashLookup[keccak256(abi.encodePacked(this, _proposalThoughtId, _aoUintSetting.settingValue(_settingId), _newValue, _extraData, _settingId))] = _settingId;

		emit SettingUpdate(_settingId, _nameFactory.ethAddressToNameId(msg.sender), _proposalThoughtId);
	}

	/**
	 * @dev Advocate of Setting's _associatedThoughtId submits a bool setting update after an update has been proposed
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new bool value for this setting
	 * @param _proposalThoughtId The child of the associatedThoughtId with the update Logos
	 * @param _updateSignature A signature of the proposalThoughtId and update value by associatedThoughtId's advocate's name address
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function updateBoolSetting(uint256 _settingId, bool _newValue, address _proposalThoughtId, string _updateSignature, string _extraData) public isThought(_proposalThoughtId) {
		// Store the setting state data
		require (_aoSettingAttribute.update(_settingId, 2, _nameFactory.ethAddressToNameId(msg.sender), _proposalThoughtId, _updateSignature, _extraData));

		// Store the value as pending value
		_aoBoolSetting.setPendingValue(_settingId, _newValue);

		// Store the update hash key lookup
		updateHashLookup[keccak256(abi.encodePacked(this, _proposalThoughtId, _aoBoolSetting.settingValue(_settingId), _newValue, _extraData, _settingId))] = _settingId;

		emit SettingUpdate(_settingId, _nameFactory.ethAddressToNameId(msg.sender), _proposalThoughtId);
	}

	/**
	 * @dev Advocate of Setting's _associatedThoughtId submits an address setting update after an update has been proposed
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new address value for this setting
	 * @param _proposalThoughtId The child of the associatedThoughtId with the update Logos
	 * @param _updateSignature A signature of the proposalThoughtId and update value by associatedThoughtId's advocate's name address
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function updateAddressSetting(uint256 _settingId, address _newValue, address _proposalThoughtId, string _updateSignature, string _extraData) public isThought(_proposalThoughtId) {
		// Store the setting state data
		require (_aoSettingAttribute.update(_settingId, 3, _nameFactory.ethAddressToNameId(msg.sender), _proposalThoughtId, _updateSignature, _extraData));

		// Store the value as pending value
		_aoAddressSetting.setPendingValue(_settingId, _newValue);

		// Store the update hash key lookup
		updateHashLookup[keccak256(abi.encodePacked(this, _proposalThoughtId, _aoAddressSetting.settingValue(_settingId), _newValue, _extraData, _settingId))] = _settingId;

		emit SettingUpdate(_settingId, _nameFactory.ethAddressToNameId(msg.sender), _proposalThoughtId);
	}

	/**
	 * @dev Advocate of Setting's _associatedThoughtId submits a bytes32 setting update after an update has been proposed
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new bytes32 value for this setting
	 * @param _proposalThoughtId The child of the associatedThoughtId with the update Logos
	 * @param _updateSignature A signature of the proposalThoughtId and update value by associatedThoughtId's advocate's name address
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function updateBytesSetting(uint256 _settingId, bytes32 _newValue, address _proposalThoughtId, string _updateSignature, string _extraData) public isThought(_proposalThoughtId) {
		// Store the setting state data
		require (_aoSettingAttribute.update(_settingId, 4, _nameFactory.ethAddressToNameId(msg.sender), _proposalThoughtId, _updateSignature, _extraData));

		// Store the value as pending value
		_aoBytesSetting.setPendingValue(_settingId, _newValue);

		// Store the update hash key lookup
		updateHashLookup[keccak256(abi.encodePacked(this, _proposalThoughtId, _aoBytesSetting.settingValue(_settingId), _newValue, _extraData, _settingId))] = _settingId;

		emit SettingUpdate(_settingId, _nameFactory.ethAddressToNameId(msg.sender), _proposalThoughtId);
	}

	/**
	 * @dev Advocate of Setting's _associatedThoughtId submits a string setting update after an update has been proposed
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new string value for this setting
	 * @param _proposalThoughtId The child of the associatedThoughtId with the update Logos
	 * @param _updateSignature A signature of the proposalThoughtId and update value by associatedThoughtId's advocate's name address
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function updateStringSetting(uint256 _settingId, string _newValue, address _proposalThoughtId, string _updateSignature, string _extraData) public isThought(_proposalThoughtId) {
		// Store the setting state data
		require (_aoSettingAttribute.update(_settingId, 5, _nameFactory.ethAddressToNameId(msg.sender), _proposalThoughtId, _updateSignature, _extraData));

		// Store the value as pending value
		_aoStringSetting.setPendingValue(_settingId, _newValue);

		// Store the update hash key lookup
		updateHashLookup[keccak256(abi.encodePacked(this, _proposalThoughtId, _aoStringSetting.settingValue(_settingId), _newValue, _extraData, _settingId))] = _settingId;

		emit SettingUpdate(_settingId, _nameFactory.ethAddressToNameId(msg.sender), _proposalThoughtId);
	}

	/**
	 * @dev Advocate of Setting's proposalThoughtId approves the setting update
	 * @param _settingId The ID of the setting to be approved
	 * @param _approved Whether to approve or reject
	 */
	function approveSettingUpdate(uint256 _settingId, bool _approved) public {
		address _proposalThoughtAdvocate = _nameFactory.ethAddressToNameId(msg.sender);
		(,,, address _proposalThoughtId,,,) = _aoSettingAttribute.getSettingState(_settingId);

		require (_aoSettingAttribute.approveUpdate(_settingId, _proposalThoughtAdvocate, _approved));

		emit ApproveSettingUpdate(_settingId, _proposalThoughtId, _proposalThoughtAdvocate, _approved);
	}

	/**
	 * @dev Advocate of Setting's _associatedThoughtId finalizes the setting update once the setting is approved
	 * @param _settingId The ID of the setting to be finalized
	 */
	function finalizeSettingUpdate(uint256 _settingId) public {
		address _associatedThoughtAdvocate = _nameFactory.ethAddressToNameId(msg.sender);
		require (_aoSettingAttribute.finalizeUpdate(_settingId, _associatedThoughtAdvocate));

		(,,, address _associatedThoughtId,, uint8 _settingType,,,,) = _aoSettingAttribute.getSettingData(_settingId);

		_movePendingToSetting(_settingId, _settingType);

		emit FinalizeSettingUpdate(_settingId, _associatedThoughtId, _associatedThoughtAdvocate);
	}

	/**
	 * @dev Advocate of _creatorThoughtId adds a setting deprecation
	 * @param _settingId The ID of the setting to be deprecated
	 * @param _newSettingId The new setting ID to route
	 * @param _newSettingContractAddress The new setting contract address to route
	 * @param _creatorThoughtId The thoughtId that created the setting
	 * @param _associatedThoughtId The thoughtId that the setting affects
	 */
	function addSettingDeprecation(uint256 _settingId, uint256 _newSettingId, address _newSettingContractAddress, address _creatorThoughtId, address _associatedThoughtId) public isThought(_creatorThoughtId) isThought(_associatedThoughtId) isAdvocate(msg.sender, _creatorThoughtId) {
		(bytes32 _associatedThoughtSettingDeprecationId, bytes32 _creatorThoughtSettingDeprecationId) = _aoSettingAttribute.addDeprecation(_settingId, _nameFactory.ethAddressToNameId(msg.sender), _creatorThoughtId, _associatedThoughtId, _newSettingId, _newSettingContractAddress);

		emit SettingDeprecation(_settingId, _nameFactory.ethAddressToNameId(msg.sender), _creatorThoughtId, _associatedThoughtId, _newSettingId, _newSettingContractAddress, _associatedThoughtSettingDeprecationId, _creatorThoughtSettingDeprecationId);
	}

	/**
	 * @dev Advocate of SettingDeprecation's _associatedThoughtId approves setting deprecation
	 * @param _settingId The ID of the setting to approve
	 * @param _approved Whether to approve or reject
	 */
	function approveSettingDeprecation(uint256 _settingId, bool _approved) public {
		address _associatedThoughtAdvocate = _nameFactory.ethAddressToNameId(msg.sender);
		require (_aoSettingAttribute.approveDeprecation(_settingId, _associatedThoughtAdvocate, _approved));

		(,,, address _associatedThoughtId,,,,,,,,) = _aoSettingAttribute.getSettingDeprecation(_settingId);
		emit ApproveSettingDeprecation(_settingId, _associatedThoughtId, _associatedThoughtAdvocate, _approved);
	}

	/**
	 * @dev Advocate of SettingDeprecation's _creatorThoughtId finalizes the setting deprecation once the setting deprecation is approved
	 * @param _settingId The ID of the setting to be finalized
	 */
	function finalizeSettingDeprecation(uint256 _settingId) public {
		address _creatorThoughtAdvocate = _nameFactory.ethAddressToNameId(msg.sender);
		require (_aoSettingAttribute.finalizeDeprecation(_settingId, _creatorThoughtAdvocate));

		(,, address _creatorThoughtId,,,,,,,,,) = _aoSettingAttribute.getSettingDeprecation(_settingId);
		emit FinalizeSettingDeprecation(_settingId, _creatorThoughtId, _creatorThoughtAdvocate);
	}

	/**
	 * @dev Get setting Id given an associatedThoughtId and settingName
	 * @param _associatedThoughtId The ID of the AssociatedThought
	 * @param _settingName The name of the setting
	 * @return the ID of the setting
	 */
	function getSettingIdByThoughtName(address _associatedThoughtId, string _settingName) public view returns (uint256) {
		require (settingNameExist(_settingName, _associatedThoughtId));
		return nameSettingLookup[_associatedThoughtId][keccak256(abi.encodePacked(this, _settingName))];
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

	/***** Internal Method *****/
	/**
	 * @dev Store setting creation data
	 * @param _creatorNameId The nameId that created the setting
	 * @param _settingType The type of this setting. 1 => uint256, 2 => bool, 3 => address, 4 => bytes32, 5 => string
	 * @param _settingName The human-readable name of the setting
	 * @param _creatorThoughtId The thoughtId that created the setting
	 * @param _associatedThoughtId The thoughtId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function _storeSettingCreation(address _creatorNameId, uint8 _settingType, string _settingName, address _creatorThoughtId, address _associatedThoughtId, string _extraData) internal {
		// Make sure _settingType is in supported list
		require (_settingType >= 1 && _settingType <= 5);

		// Store nameSettingLookup
		nameSettingLookup[_associatedThoughtId][keccak256(abi.encodePacked(this, _settingName))] = totalSetting;

		// Store setting data/state
		(bytes32 _associatedThoughtSettingId, bytes32 _creatorThoughtSettingId) = _aoSettingAttribute.add(totalSetting, _creatorNameId, _settingType, _settingName, _creatorThoughtId, _associatedThoughtId, _extraData);

		emit SettingCreation(totalSetting, _creatorNameId, _creatorThoughtId, _associatedThoughtId, _settingName, _settingType, _associatedThoughtSettingId, _creatorThoughtSettingId);
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
