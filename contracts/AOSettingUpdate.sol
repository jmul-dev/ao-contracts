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
 * @title AOSettingUpdate
 *
 * This contract purpose is to update existing Setting Value
 */
contract AOSettingUpdate is TheAO {
	address public nameFactoryAddress;
	address public nameAccountRecoveryAddress;
	address public aoSettingAttributeAddress;
	address public aoSettingValueAddress;
	address public aoSettingAddress;

	INameFactory internal _nameFactory;
	INameTAOPosition internal _nameTAOPosition;
	INameAccountRecovery internal _nameAccountRecovery;
	IAOSettingAttribute internal _aoSettingAttribute;
	IAOSettingValue internal _aoSettingValue;
	IAOSetting internal _aoSetting;

	struct UpdateSignature {
		uint8 signatureV;
		bytes32 signatureR;
		bytes32 signatureS;
	}

	// Mapping from settingId to UpdateSignature
	mapping (uint256 => UpdateSignature) public updateSignatures;

	// Mapping from updateHashKey to it's settingId
	mapping (bytes32 => uint256) public updateHashLookup;

	// Event to be broadcasted to public when a proposed update for a setting is created
	event SettingUpdate(uint256 indexed settingId, address indexed updateAdvocateNameId, address proposalTAOId);

	// Event to be broadcasted to public when setting update is approved/rejected by the advocate of proposalTAOId
	event ApproveSettingUpdate(uint256 indexed settingId, address proposalTAOId, address proposalTAOAdvocate, bool approved);

	// Event to be broadcasted to public when setting update is finalized by the advocate of associatedTAOId
	event FinalizeSettingUpdate(uint256 indexed settingId, address associatedTAOId, address associatedTAOAdvocate);

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress,
		address _nameTAOPositionAddress,
		address _nameAccountRecoveryAddress,
		address _aoSettingAttributeAddress,
		address _aoSettingValueAddress,
		address _aoSettingAddress
		) public {
		setNameFactoryAddress(_nameFactoryAddress);
		setNameTAOPositionAddress(_nameTAOPositionAddress);
		setNameAccountRecoveryAddress(_nameAccountRecoveryAddress);
		setAOSettingAttributeAddress(_aoSettingAttributeAddress);
		setAOSettingValueAddress(_aoSettingValueAddress);
		setAOSettingAddress(_aoSettingAddress);
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

	/**
	 * @dev Check if sender can update setting
	 */
	modifier canUpdate(address _proposalTAOId) {
		require (
			AOLibrary.isTAO(_proposalTAOId) &&
			_nameFactory.ethAddressToNameId(msg.sender) != address(0) &&
			!_nameAccountRecovery.isCompromised(_nameFactory.ethAddressToNameId(msg.sender))
		);
		_;
	}

	/**
	 * @dev Check whether or not setting is of type address
	 */
	modifier isAddressSetting(uint256 _settingId) {
		(uint8 ADDRESS_SETTING_TYPE,,,,) = _aoSetting.getSettingTypes();
		// Make sure the setting type is address
		require (_aoSetting.settingTypeLookup(_settingId) == ADDRESS_SETTING_TYPE);
		_;
	}

	/**
	 * @dev Check whether or not setting is of type bool
	 */
	modifier isBoolSetting(uint256 _settingId) {
		(, uint8 BOOL_SETTING_TYPE,,,) = _aoSetting.getSettingTypes();
		// Make sure the setting type is bool
		require (_aoSetting.settingTypeLookup(_settingId) == BOOL_SETTING_TYPE);
		_;
	}

	/**
	 * @dev Check whether or not setting is of type bytes32
	 */
	modifier isBytesSetting(uint256 _settingId) {
		(,, uint8 BYTES_SETTING_TYPE,,) = _aoSetting.getSettingTypes();
		// Make sure the setting type is bytes32
		require (_aoSetting.settingTypeLookup(_settingId) == BYTES_SETTING_TYPE);
		_;
	}

	/**
	 * @dev Check whether or not setting is of type string
	 */
	modifier isStringSetting(uint256 _settingId) {
		(,,, uint8 STRING_SETTING_TYPE,) = _aoSetting.getSettingTypes();
		// Make sure the setting type is string
		require (_aoSetting.settingTypeLookup(_settingId) == STRING_SETTING_TYPE);
		_;
	}

	/**
	 * @dev Check whether or not setting is of type uint256
	 */
	modifier isUintSetting(uint256 _settingId) {
		(,,,, uint8 UINT_SETTING_TYPE) = _aoSetting.getSettingTypes();
		// Make sure the setting type is uint256
		require (_aoSetting.settingTypeLookup(_settingId) == UINT_SETTING_TYPE);
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

	/**
	 * @dev The AO sets AOSetting address
	 * @param _aoSettingAddress The address of AOSetting
	 */
	function setAOSettingAddress(address _aoSettingAddress) public onlyTheAO {
		require (_aoSettingAddress != address(0));
		aoSettingAddress = _aoSettingAddress;
		_aoSetting = IAOSetting(_aoSettingAddress);
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Advocate of Setting's _associatedTAOId submits an address setting update after an update has been proposed
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new address value for this setting
	 * @param _proposalTAOId The child of the associatedTAOId with the update Logos
	 * @param _signatureV The V part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _signatureR The R part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _signatureS The S part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function updateAddressSetting(
		uint256 _settingId,
		address _newValue,
		address _proposalTAOId,
		uint8 _signatureV,
		bytes32 _signatureR,
		bytes32 _signatureS,
		string _extraData)
		public
		canUpdate(_proposalTAOId)
		isAddressSetting(_settingId) {

		// Verify and store update address signature
		require (_verifyAndStoreUpdateAddressSignature(_settingId, _newValue, _proposalTAOId, _signatureV, _signatureR, _signatureS));

		// Store the setting state data
		require (_aoSettingAttribute.update(_settingId, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId, _extraData));

		// Store the value as pending value
		_aoSettingValue.setPendingValue(_settingId, _newValue, false, '', '', 0);

		// Store the update hash key lookup
		_storeUpdateAddressHashLookup(_settingId, _newValue, _proposalTAOId, _extraData);

		emit SettingUpdate(_settingId, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId);
	}

	/**
	 * @dev Advocate of Setting's _associatedTAOId submits a bool setting update after an update has been proposed
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new bool value for this setting
	 * @param _proposalTAOId The child of the associatedTAOId with the update Logos
	 * @param _signatureV The V part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _signatureR The R part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _signatureS The S part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function updateBoolSetting(
		uint256 _settingId,
		bool _newValue,
		address _proposalTAOId,
		uint8 _signatureV,
		bytes32 _signatureR,
		bytes32 _signatureS,
		string _extraData)
		public
		canUpdate(_proposalTAOId)
		isBoolSetting(_settingId) {

		// Verify and store update bool signature
		require (_verifyAndStoreUpdateBoolSignature(_settingId, _newValue, _proposalTAOId, _signatureV, _signatureR, _signatureS));

		// Store the setting state data
		require (_aoSettingAttribute.update(_settingId, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId, _extraData));

		// Store the value as pending value
		_aoSettingValue.setPendingValue(_settingId, address(0), _newValue, '', '', 0);

		// Store the update hash key lookup
		_storeUpdateBoolHashLookup(_settingId, _newValue, _proposalTAOId, _extraData);

		emit SettingUpdate(_settingId, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId);
	}

	/**
	 * @dev Advocate of Setting's _associatedTAOId submits a bytes32 setting update after an update has been proposed
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new bytes32 value for this setting
	 * @param _proposalTAOId The child of the associatedTAOId with the update Logos
	 * @param _signatureV The V part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _signatureR The R part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _signatureS The S part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function updateBytesSetting(
		uint256 _settingId,
		bytes32 _newValue,
		address _proposalTAOId,
		uint8 _signatureV,
		bytes32 _signatureR,
		bytes32 _signatureS,
		string _extraData)
		public
		canUpdate(_proposalTAOId)
		isBytesSetting(_settingId) {

		// Verify and store update bytes32 signature
		require (_verifyAndStoreUpdateBytesSignature(_settingId, _newValue, _proposalTAOId, _signatureV, _signatureR, _signatureS));

		// Store the setting state data
		require (_aoSettingAttribute.update(_settingId, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId, _extraData));

		// Store the value as pending value
		_aoSettingValue.setPendingValue(_settingId, address(0), false, _newValue, '', 0);

		// Store the update hash key lookup
		_storeUpdateBytesHashLookup(_settingId, _newValue, _proposalTAOId, _extraData);

		emit SettingUpdate(_settingId, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId);
	}

	/**
	 * @dev Advocate of Setting's _associatedTAOId submits a string setting update after an update has been proposed
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new string value for this setting
	 * @param _proposalTAOId The child of the associatedTAOId with the update Logos
	 * @param _signatureV The V part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _signatureR The R part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _signatureS The S part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function updateStringSetting(
		uint256 _settingId,
		string _newValue,
		address _proposalTAOId,
		uint8 _signatureV,
		bytes32 _signatureR,
		bytes32 _signatureS,
		string _extraData)
		public
		canUpdate(_proposalTAOId)
		isStringSetting(_settingId) {

		// Verify and store update string signature
		require (_verifyAndStoreUpdateStringSignature(_settingId, _newValue, _proposalTAOId, _signatureV, _signatureR, _signatureS));

		// Store the setting state data
		require (_aoSettingAttribute.update(_settingId, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId, _extraData));

		// Store the value as pending value
		_aoSettingValue.setPendingValue(_settingId, address(0), false, '', _newValue, 0);

		// Store the update hash key lookup
		_storeUpdateStringHashLookup(_settingId, _newValue, _proposalTAOId, _extraData);

		emit SettingUpdate(_settingId, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId);
	}

	/**
	 * @dev Advocate of Setting's _associatedTAOId submits a uint256 setting update after an update has been proposed
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new uint256 value for this setting
	 * @param _proposalTAOId The child of the associatedTAOId with the update Logos
	 * @param _signatureV The V part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _signatureR The R part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _signatureS The S part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function updateUintSetting(
		uint256 _settingId,
		uint256 _newValue,
		address _proposalTAOId,
		uint8 _signatureV,
		bytes32 _signatureR,
		bytes32 _signatureS,
		string _extraData)
		public
		canUpdate(_proposalTAOId)
		isUintSetting(_settingId) {

		// Verify and store update uint256 signature
		require (_verifyAndStoreUpdateUintSignature(_settingId, _newValue, _proposalTAOId, _signatureV, _signatureR, _signatureS));

		// Store the setting state data
		require (_aoSettingAttribute.update(_settingId, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId, _extraData));

		// Store the value as pending value
		_aoSettingValue.setPendingValue(_settingId, address(0), false, '', '', _newValue);

		// Store the update hash key lookup
		_storeUpdateUintHashLookup(_settingId, _newValue, _proposalTAOId, _extraData);

		emit SettingUpdate(_settingId, _nameFactory.ethAddressToNameId(msg.sender), _proposalTAOId);
	}

	/**
	 * @dev Advocate of Setting's proposalTAOId approves the setting update
	 * @param _settingId The ID of the setting to be approved
	 * @param _approved Whether to approve or reject
	 */
	function approveSettingUpdate(uint256 _settingId, bool _approved) public senderIsName senderNameNotCompromised {
		// Make sure setting exist
		require (_aoSetting.settingTypeLookup(_settingId) > 0);

		address _proposalTAOAdvocate = _nameFactory.ethAddressToNameId(msg.sender);
		(,,, address _proposalTAOId,,) = _aoSettingAttribute.getSettingState(_settingId);

		require (_aoSettingAttribute.approveUpdate(_settingId, _proposalTAOAdvocate, _approved));

		emit ApproveSettingUpdate(_settingId, _proposalTAOId, _proposalTAOAdvocate, _approved);
	}

	/**
	 * @dev Advocate of Setting's _associatedTAOId finalizes the setting update once the setting is approved
	 * @param _settingId The ID of the setting to be finalized
	 */
	function finalizeSettingUpdate(uint256 _settingId) public senderIsName senderNameNotCompromised {
		// Make sure setting exist
		require (_aoSetting.settingTypeLookup(_settingId) > 0);

		address _associatedTAOAdvocate = _nameFactory.ethAddressToNameId(msg.sender);
		require (_aoSettingAttribute.finalizeUpdate(_settingId, _associatedTAOAdvocate));

		(,,, address _associatedTAOId,,,,,) = _aoSettingAttribute.getSettingData(_settingId);

		require (_aoSettingValue.movePendingToSetting(_settingId));

		emit FinalizeSettingUpdate(_settingId, _associatedTAOId, _associatedTAOAdvocate);
	}

	/***** Internal Method *****/
	/**
	 * @dev Verify the signature for the address update and store the signature info
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new address value for this setting
	 * @param _proposalTAOId The child of the associatedTAOId with the update Logos
	 * @param _v The V part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _r The R part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _s The S part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @return true if valid, false otherwise
	 */
	function _verifyAndStoreUpdateAddressSignature(
		uint256 _settingId,
		address _newValue,
		address _proposalTAOId,
		uint8 _v,
		bytes32 _r,
		bytes32 _s
		) internal returns (bool) {
		bytes32 _hash = keccak256(abi.encodePacked(address(this), _settingId, _proposalTAOId, _newValue, _nameFactory.ethAddressToNameId(msg.sender)));
		if (ecrecover(_hash, _v, _r, _s) != msg.sender) {
			return false;
		}
		_storeUpdateSignature(_settingId, _v, _r, _s);
		return true;
	}

	/**
	 * @dev Verify the signature for the bool update and store the signature info
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new bool value for this setting
	 * @param _proposalTAOId The child of the associatedTAOId with the update Logos
	 * @param _v The V part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _r The R part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _s The S part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @return true if valid, false otherwise
	 */
	function _verifyAndStoreUpdateBoolSignature(
		uint256 _settingId,
		bool _newValue,
		address _proposalTAOId,
		uint8 _v,
		bytes32 _r,
		bytes32 _s
		) internal returns (bool) {
		bytes32 _hash = keccak256(abi.encodePacked(address(this), _settingId, _proposalTAOId, _newValue, _nameFactory.ethAddressToNameId(msg.sender)));
		if (ecrecover(_hash, _v, _r, _s) != msg.sender) {
			return false;
		}
		_storeUpdateSignature(_settingId, _v, _r, _s);
		return true;
	}

	/**
	 * @dev Verify the signature for the bytes32 update and store the signature info
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new bytes32 value for this setting
	 * @param _proposalTAOId The child of the associatedTAOId with the update Logos
	 * @param _v The V part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _r The R part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _s The S part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @return true if valid, false otherwise
	 */
	function _verifyAndStoreUpdateBytesSignature(
		uint256 _settingId,
		bytes32 _newValue,
		address _proposalTAOId,
		uint8 _v,
		bytes32 _r,
		bytes32 _s
		) internal returns (bool) {
		bytes32 _hash = keccak256(abi.encodePacked(address(this), _settingId, _proposalTAOId, _newValue, _nameFactory.ethAddressToNameId(msg.sender)));
		if (ecrecover(_hash, _v, _r, _s) != msg.sender) {
			return false;
		}
		_storeUpdateSignature(_settingId, _v, _r, _s);
		return true;
	}

	/**
	 * @dev Verify the signature for the string update and store the signature info
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new string value for this setting
	 * @param _proposalTAOId The child of the associatedTAOId with the update Logos
	 * @param _v The V part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _r The R part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _s The S part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @return true if valid, false otherwise
	 */
	function _verifyAndStoreUpdateStringSignature(
		uint256 _settingId,
		string _newValue,
		address _proposalTAOId,
		uint8 _v,
		bytes32 _r,
		bytes32 _s
		) internal returns (bool) {
		bytes32 _hash = keccak256(abi.encodePacked(address(this), _settingId, _proposalTAOId, _newValue, _nameFactory.ethAddressToNameId(msg.sender)));
		if (ecrecover(_hash, _v, _r, _s) != msg.sender) {
			return false;
		}
		_storeUpdateSignature(_settingId, _v, _r, _s);
		return true;
	}

	/**
	 * @dev Verify the signature for the uint256 update and store the signature info
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new uint256 value for this setting
	 * @param _proposalTAOId The child of the associatedTAOId with the update Logos
	 * @param _v The V part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _r The R part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _s The S part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @return true if valid, false otherwise
	 */
	function _verifyAndStoreUpdateUintSignature(
		uint256 _settingId,
		uint256 _newValue,
		address _proposalTAOId,
		uint8 _v,
		bytes32 _r,
		bytes32 _s
		) public returns (bool) {
		bytes32 _hash = keccak256(abi.encodePacked(address(this), _settingId, _proposalTAOId, _newValue, _nameFactory.ethAddressToNameId(msg.sender)));
		if (ecrecover(_hash, _v, _r, _s) != msg.sender) {
			return false;
		}
		_storeUpdateSignature(_settingId, _v, _r, _s);
		return true;
	}

	/**
	 * @dev Store the update hash lookup for this address setting
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new address value for this setting
	 * @param _proposalTAOId The child of the associatedTAOId with the update Logos
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function _storeUpdateAddressHashLookup(
		uint256 _settingId,
		address _newValue,
		address _proposalTAOId,
		string _extraData)
		internal {
		// Store the update hash key lookup
		(address _addressValue,,,,) = _aoSettingValue.settingValue(_settingId);
		updateHashLookup[keccak256(abi.encodePacked(address(this), _proposalTAOId, _addressValue, _newValue, _extraData, _settingId))] = _settingId;
	}

	/**
	 * @dev Store the update hash lookup for this bool setting
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new bool value for this setting
	 * @param _proposalTAOId The child of the associatedTAOId with the update Logos
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function _storeUpdateBoolHashLookup(
		uint256 _settingId,
		bool _newValue,
		address _proposalTAOId,
		string _extraData)
		internal {
		// Store the update hash key lookup
		(, bool _boolValue,,,) = _aoSettingValue.settingValue(_settingId);
		updateHashLookup[keccak256(abi.encodePacked(address(this), _proposalTAOId, _boolValue, _newValue, _extraData, _settingId))] = _settingId;
	}

	/**
	 * @dev Store the update hash lookup for this bytes32 setting
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new bytes32 value for this setting
	 * @param _proposalTAOId The child of the associatedTAOId with the update Logos
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function _storeUpdateBytesHashLookup(
		uint256 _settingId,
		bytes32 _newValue,
		address _proposalTAOId,
		string _extraData)
		internal {
		// Store the update hash key lookup
		(,, bytes32 _bytesValue,,) = _aoSettingValue.settingValue(_settingId);
		updateHashLookup[keccak256(abi.encodePacked(address(this), _proposalTAOId, _bytesValue, _newValue, _extraData, _settingId))] = _settingId;
	}

	/**
	 * @dev Store the update hash lookup for this string setting
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new string value for this setting
	 * @param _proposalTAOId The child of the associatedTAOId with the update Logos
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function _storeUpdateStringHashLookup(
		uint256 _settingId,
		string _newValue,
		address _proposalTAOId,
		string _extraData)
		internal {
		// Store the update hash key lookup
		(,,, string memory _stringValue,) = _aoSettingValue.settingValue(_settingId);
		updateHashLookup[keccak256(abi.encodePacked(address(this), _proposalTAOId, _stringValue, _newValue, _extraData, _settingId))] = _settingId;
	}

	/**
	 * @dev Store the update hash lookup for this uint256 setting
	 * @param _settingId The ID of the setting to be updated
	 * @param _newValue The new address value for this setting
	 * @param _proposalTAOId The child of the associatedTAOId with the update Logos
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function _storeUpdateUintHashLookup(
		uint256 _settingId,
		uint256 _newValue,
		address _proposalTAOId,
		string _extraData)
		internal {
		// Store the update hash key lookup
		(,,,, uint256 _uintValue) = _aoSettingValue.settingValue(_settingId);
		updateHashLookup[keccak256(abi.encodePacked(address(this), _proposalTAOId, _uintValue, _newValue, _extraData, _settingId))] = _settingId;
	}

	/**
	 * @dev Actual storing the UpdateSignature info
	 * @param _settingId The ID of the setting to be updated
	 * @param _v The V part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _r The R part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 * @param _s The S part of the signature of proposalTAOId, newValue and associatedTAOId's Advocate
	 */
	function _storeUpdateSignature(uint256 _settingId, uint8 _v, bytes32 _r, bytes32 _s) internal {
		UpdateSignature storage _updateSignature = updateSignatures[_settingId];
		_updateSignature.signatureV = _v;
		_updateSignature.signatureR = _r;
		_updateSignature.signatureS = _s;
	}
}
