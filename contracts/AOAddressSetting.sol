pragma solidity ^0.4.24;

import './developed.sol';

/**
 * @title AOAddressSetting
 *
 * This contract stores all AO address setting variables
 */
contract AOAddressSetting is developed {
	// Mapping from settingId to it's actual address value
	mapping (uint256 => address) public settingValue;

	// Mapping from settingId to it's potential address value that is at pending state
	mapping (uint256 => address) public pendingValue;

	/**
	 * @dev Constructor function
	 */
	constructor() public {}

	/**
	 * @dev Set pending value
	 * @param _settingId The ID of the setting
	 * @param _value The address value to be set
	 */
	function setPendingValue(uint256 _settingId, address _value) public inWhitelist(msg.sender) {
		pendingValue[_settingId] = _value;
	}

	/**
	 * @dev Move value from pending to setting
	 * @param _settingId The ID of the setting
	 */
	function movePendingToSetting(uint256 _settingId) public inWhitelist(msg.sender) {
		address _tempValue = pendingValue[_settingId];
		delete pendingValue[_settingId];
		settingValue[_settingId] = _tempValue;
	}
}
