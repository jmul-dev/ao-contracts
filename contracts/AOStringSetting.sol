pragma solidity ^0.4.24;

import './TheAO.sol';

/**
 * @title AOStringSetting
 *
 * This contract stores all AO string setting variables
 */
contract AOStringSetting is TheAO {
	// Mapping from settingId to it's actual string value
	mapping (uint256 => string) public settingValue;

	// Mapping from settingId to it's potential string value that is at pending state
	mapping (uint256 => string) public pendingValue;

	/**
	 * @dev Constructor function
	 */
	constructor() public {}

	/**
	 * @dev Set pending value
	 * @param _settingId The ID of the setting
	 * @param _value The string value to be set
	 */
	function setPendingValue(uint256 _settingId, string _value) public inWhitelist(msg.sender) {
		pendingValue[_settingId] = _value;
	}

	/**
	 * @dev Move value from pending to setting
	 * @param _settingId The ID of the setting
	 */
	function movePendingToSetting(uint256 _settingId) public inWhitelist(msg.sender) {
		string memory _tempValue = pendingValue[_settingId];
		delete pendingValue[_settingId];
		settingValue[_settingId] = _tempValue;
	}
}
