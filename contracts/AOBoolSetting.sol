pragma solidity ^0.4.24;

import './TheAO.sol';

/**
 * @title AOBoolSetting
 *
 * This contract stores all AO bool setting variables
 */
contract AOBoolSetting is TheAO {
	// Mapping from settingId to it's actual bool value
	mapping (uint256 => bool) public settingValue;

	// Mapping from settingId to it's potential bool value that is at pending state
	mapping (uint256 => bool) public pendingValue;

	/**
	 * @dev Constructor function
	 */
	constructor() public {}

	/**
	 * @dev Set pending value
	 * @param _settingId The ID of the setting
	 * @param _value The bool value to be set
	 */
	function setPendingValue(uint256 _settingId, bool _value) public inWhitelist(msg.sender) {
		pendingValue[_settingId] = _value;
	}

	/**
	 * @dev Move value from pending to setting
	 * @param _settingId The ID of the setting
	 */
	function movePendingToSetting(uint256 _settingId) public inWhitelist(msg.sender) {
		bool _tempValue = pendingValue[_settingId];
		delete pendingValue[_settingId];
		settingValue[_settingId] = _tempValue;
	}
}
