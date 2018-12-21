pragma solidity ^0.4.24;

import './TheAO.sol';

/**
 * @title AOBytesSetting
 *
 * This contract stores all AO bytes32 setting variables
 */
contract AOBytesSetting is TheAO {
	// Mapping from settingId to it's actual bytes32 value
	mapping (uint256 => bytes32) public settingValue;

	// Mapping from settingId to it's potential bytes32 value that is at pending state
	mapping (uint256 => bytes32) public pendingValue;

	/**
	 * @dev Constructor function
	 */
	constructor() public {}

	/**
	 * @dev Set pending value
	 * @param _settingId The ID of the setting
	 * @param _value The bytes32 value to be set
	 */
	function setPendingValue(uint256 _settingId, bytes32 _value) public inWhitelist(msg.sender) {
		pendingValue[_settingId] = _value;
	}

	/**
	 * @dev Move value from pending to setting
	 * @param _settingId The ID of the setting
	 */
	function movePendingToSetting(uint256 _settingId) public inWhitelist(msg.sender) {
		bytes32 _tempValue = pendingValue[_settingId];
		delete pendingValue[_settingId];
		settingValue[_settingId] = _tempValue;
	}
}
