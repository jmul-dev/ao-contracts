pragma solidity ^0.4.24;

import './developed.sol';

/**
 * @title AOUintSetting
 *
 * This contract stores all AO uint256 setting variables
 */
contract AOUintSetting is developed {
	// Mapping from settingId to it's actual uint256 value
	mapping (uint256 => uint256) public settingValue;

	// Mapping from settingId to it's potential uint256 value that is at pending state
	mapping (uint256 => uint256) public pendingValue;

	/**
	 * @dev Constructor function
	 */
	constructor() public {}

	/**
	 * @dev Set pending value
	 * @param _settingId The ID of the setting
	 * @param _value The uint256 value to be set
	 */
	function setPendingValue(uint256 _settingId, uint256 _value) public inWhitelist(msg.sender) {
		pendingValue[_settingId] = _value;
	}

	/**
	 * @dev Move value from pending to setting
	 * @param _settingId The ID of the setting
	 */
	function movePendingToSetting(uint256 _settingId) public inWhitelist(msg.sender) {
		uint256 _tempValue = pendingValue[_settingId];
		delete pendingValue[_settingId];
		settingValue[_settingId] = _tempValue;
	}
}
