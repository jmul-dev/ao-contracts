pragma solidity >=0.5.4 <0.6.0;

import './AOLibrary.sol';
import './TheAO.sol';
import './IAOSettingValue.sol';

/**
 * @title AOSettingValue
 *
 */
contract AOSettingValue is TheAO, IAOSettingValue {
	struct PendingValue {
		address addressValue;
		bool boolValue;
		bytes32 bytesValue;
		string stringValue;
		uint256 uintValue;
	}

	struct SettingValue {
		address addressValue;
		bool boolValue;
		bytes32 bytesValue;
		string stringValue;
		uint256 uintValue;
	}

	// Mapping from settingId to PendingValue
	mapping (uint256 => PendingValue) internal pendingValues;

	// Mapping from settingId to SettingValue
	mapping (uint256 => SettingValue) internal settingValues;

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameTAOPositionAddress) public {
		setNameTAOPositionAddress(_nameTAOPositionAddress);
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
	 * @dev The AO set the NameTAOPosition Address
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	function setNameTAOPositionAddress(address _nameTAOPositionAddress) public onlyTheAO {
		require (_nameTAOPositionAddress != address(0));
		nameTAOPositionAddress = _nameTAOPositionAddress;
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Set pending value
	 * @param _settingId The ID of the setting
	 * @param _addressValue The address value to be set
	 * @param _boolValue The bool value to be set
	 * @param _bytesValue The bytes32 value to be set
	 * @param _stringValue The string value to be set
	 * @param _uintValue The uint256 value to be set
	 * @return true on success
	 */
	function setPendingValue(uint256 _settingId,
		address _addressValue,
		bool _boolValue,
		bytes32 _bytesValue,
		string calldata _stringValue,
		uint256 _uintValue) external inWhitelist returns (bool) {
		PendingValue storage _pendingValue = pendingValues[_settingId];
		_pendingValue.addressValue = _addressValue;
		_pendingValue.boolValue = _boolValue;
		_pendingValue.bytesValue = _bytesValue;
		_pendingValue.stringValue = _stringValue;
		_pendingValue.uintValue = _uintValue;
		return true;
	}

	/**
	 * @dev Move value from pending to setting
	 * @param _settingId The ID of the setting
	 * @return true on success
	 */
	function movePendingToSetting(uint256 _settingId) external inWhitelist returns (bool) {
		PendingValue memory _pendingValue = pendingValues[_settingId];
		SettingValue storage _settingValue = settingValues[_settingId];
		_settingValue.addressValue = _pendingValue.addressValue;
		_settingValue.boolValue = _pendingValue.boolValue;
		_settingValue.bytesValue = _pendingValue.bytesValue;
		_settingValue.stringValue = _pendingValue.stringValue;
		_settingValue.uintValue = _pendingValue.uintValue;
		delete pendingValues[_settingId];
		return true;
	}

	/**
	 * @dev Get setting value given a setting ID
	 * @return The address setting value
	 * @return The bool setting value
	 * @return The bytes32 setting value
	 * @return The string setting value
	 * @return The uint256 setting value
	 */
	function settingValue(uint256 _settingId) external view returns (address, bool, bytes32, string memory, uint256) {
		SettingValue memory _settingValue = settingValues[_settingId];
		return (
			_settingValue.addressValue,
			_settingValue.boolValue,
			_settingValue.bytesValue,
			_settingValue.stringValue,
			_settingValue.uintValue
		);
	}

	/**
	 * @dev Get pending value given a setting ID
	 * @return The address pending value
	 * @return The bool pending value
	 * @return The bytes32 pending value
	 * @return The string pending value
	 * @return The uint256 pending value
	 */
	function pendingValue(uint256 _settingId) public view returns (address, bool, bytes32, string memory, uint256) {
		PendingValue memory _pendingValue = pendingValues[_settingId];
		return (
			_pendingValue.addressValue,
			_pendingValue.boolValue,
			_pendingValue.bytesValue,
			_pendingValue.stringValue,
			_pendingValue.uintValue
		);
	}
}
