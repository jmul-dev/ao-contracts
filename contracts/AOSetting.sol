pragma solidity ^0.4.24;

import './AOLibrary.sol';
import './TheAO.sol';
import './IAOSetting.sol';
import './INameFactory.sol';
import './IAOSettingAttribute.sol';
import './IAOSettingValue.sol';
import './INameTAOPosition.sol';

/**
 * @title AOSetting
 *
 * This contract stores all AO setting variables
 */
contract AOSetting is TheAO, IAOSetting {
	address public nameFactoryAddress;
	address public aoSettingAttributeAddress;
	address public aoSettingValueAddress;

	INameFactory internal _nameFactory;
	INameTAOPosition internal _nameTAOPosition;
	IAOSettingAttribute internal _aoSettingAttribute;
	IAOSettingValue internal _aoSettingValue;

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
	mapping (uint256 => uint8) public settingTypeLookup;

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
		address _nameTAOPositionAddress,
		address _aoSettingAttributeAddress,
		address _aoSettingValueAddress
		) public {
		setNameFactoryAddress(_nameFactoryAddress);
		setNameTAOPositionAddress(_nameTAOPositionAddress);
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
	function addUintSetting(string _settingName, uint256 _value, address _creatorTAOId, address _associatedTAOId, string _extraData) public isTAO(_creatorTAOId) isTAO(_associatedTAOId) settingNameNotTaken(_settingName, _associatedTAOId) onlyAdvocate(_creatorTAOId) {
		// Update global variables
		totalSetting++;

		settingTypeLookup[totalSetting] = 1;

		// Store the value as pending value
		_aoSettingValue.setPendingValue(totalSetting, address(0), false, '', '', _value);

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
	function addBoolSetting(string _settingName, bool _value, address _creatorTAOId, address _associatedTAOId, string _extraData) public isTAO(_creatorTAOId) isTAO(_associatedTAOId) settingNameNotTaken(_settingName, _associatedTAOId) onlyAdvocate(_creatorTAOId) {
		// Update global variables
		totalSetting++;

		settingTypeLookup[totalSetting] = 2;

		// Store the value as pending value
		_aoSettingValue.setPendingValue(totalSetting, address(0), _value, '', '', 0);

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
	function addAddressSetting(string _settingName, address _value, address _creatorTAOId, address _associatedTAOId, string _extraData) public isTAO(_creatorTAOId) isTAO(_associatedTAOId) settingNameNotTaken(_settingName, _associatedTAOId) onlyAdvocate(_creatorTAOId) {
		// Update global variables
		totalSetting++;

		settingTypeLookup[totalSetting] = 3;

		// Store the value as pending value
		_aoSettingValue.setPendingValue(totalSetting, _value, false, '', '', 0);

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
	function addBytesSetting(string _settingName, bytes32 _value, address _creatorTAOId, address _associatedTAOId, string _extraData) public isTAO(_creatorTAOId) isTAO(_associatedTAOId) settingNameNotTaken(_settingName, _associatedTAOId) onlyAdvocate(_creatorTAOId) {
		// Update global variables
		totalSetting++;

		settingTypeLookup[totalSetting] = 4;

		// Store the value as pending value
		_aoSettingValue.setPendingValue(totalSetting, address(0), false, _value, '', 0);

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
	function addStringSetting(string _settingName, string _value, address _creatorTAOId, address _associatedTAOId, string _extraData) public isTAO(_creatorTAOId) isTAO(_associatedTAOId) settingNameNotTaken(_settingName, _associatedTAOId) onlyAdvocate(_creatorTAOId) {
		// Update global variables
		totalSetting++;

		settingTypeLookup[totalSetting] = 5;

		// Store the value as pending value
		_aoSettingValue.setPendingValue(totalSetting, address(0), false, '', _value, 0);

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
			delete settingTypeLookup[_settingId];
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

		(,,address _creatorTAOId,,,,,,,) = _aoSettingAttribute.getSettingData(_settingId);

		require (_aoSettingValue.movePendingToSetting(_settingId));

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
		// Make sure the setting type is uint256
		require (settingTypeLookup[_settingId] == 1);

		// Store the setting state data
		require (_aoSettingAttribute.update(_settingId, 1, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId, _updateSignature, _extraData));

		// Store the value as pending value
		_aoSettingValue.setPendingValue(_settingId, address(0), false, '', '', _newValue);

		// Store the update hash key lookup
		(,,,, uint256 _uintValue) = _aoSettingValue.settingValue(_settingId);
		updateHashLookup[keccak256(abi.encodePacked(this, _proposalTAOId, _uintValue, _newValue, _extraData, _settingId))] = _settingId;

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
		// Make sure the setting type is bool
		require (settingTypeLookup[_settingId] == 2);

		// Store the setting state data
		require (_aoSettingAttribute.update(_settingId, 2, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId, _updateSignature, _extraData));

		// Store the value as pending value
		_aoSettingValue.setPendingValue(_settingId, address(0), _newValue, '', '', 0);

		// Store the update hash key lookup
		(, bool _boolValue,,,) = _aoSettingValue.settingValue(_settingId);
		updateHashLookup[keccak256(abi.encodePacked(this, _proposalTAOId, _boolValue, _newValue, _extraData, _settingId))] = _settingId;

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
		// Make sure the setting type is address
		require (settingTypeLookup[_settingId] == 3);

		// Store the setting state data
		require (_aoSettingAttribute.update(_settingId, 3, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId, _updateSignature, _extraData));

		// Store the value as pending value
		_aoSettingValue.setPendingValue(_settingId, _newValue, false, '', '', 0);

		// Store the update hash key lookup
		(address _addressValue,,,,) = _aoSettingValue.settingValue(_settingId);
		updateHashLookup[keccak256(abi.encodePacked(this, _proposalTAOId, _addressValue, _newValue, _extraData, _settingId))] = _settingId;

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
		// Make sure the setting type is bytes32
		require (settingTypeLookup[_settingId] == 4);

		// Store the setting state data
		require (_aoSettingAttribute.update(_settingId, 4, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId, _updateSignature, _extraData));

		// Store the value as pending value
		_aoSettingValue.setPendingValue(_settingId, address(0), false, _newValue, '', 0);

		// Store the update hash key lookup
		(,, bytes32 _bytesValue,,) = _aoSettingValue.settingValue(_settingId);
		updateHashLookup[keccak256(abi.encodePacked(this, _proposalTAOId, _bytesValue, _newValue, _extraData, _settingId))] = _settingId;

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
		// Make sure the setting type is string
		require (settingTypeLookup[_settingId] == 5);

		// Store the setting state data
		require (_aoSettingAttribute.update(_settingId, 5, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId, _updateSignature, _extraData));

		// Store the value as pending value
		_aoSettingValue.setPendingValue(_settingId, address(0), false, '', _newValue, 0);

		// Store the update hash key lookup
		(,,, string memory _stringValue,) = _aoSettingValue.settingValue(_settingId);
		updateHashLookup[keccak256(abi.encodePacked(this, _proposalTAOId, _stringValue, _newValue, _extraData, _settingId))] = _settingId;

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

		(,,, address _associatedTAOId,,,,,,) = _aoSettingAttribute.getSettingData(_settingId);

		require (_aoSettingValue.movePendingToSetting(_settingId));

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
	function addSettingDeprecation(uint256 _settingId, uint256 _newSettingId, address _newSettingContractAddress, address _creatorTAOId, address _associatedTAOId) public isTAO(_creatorTAOId) isTAO(_associatedTAOId) onlyAdvocate(_creatorTAOId) {
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
}
