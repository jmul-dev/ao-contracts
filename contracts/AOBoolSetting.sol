pragma solidity ^0.4.24;

import './TheAO.sol';
import './AOLibrary.sol';

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
	 * @dev The AO set the NameTAOPosition Address
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	function setNameTAOPositionAddress(address _nameTAOPositionAddress) public onlyTheAO {
		require (_nameTAOPositionAddress != address(0));
		nameTAOPositionAddress = _nameTAOPositionAddress;
	}

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

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Set pending value
	 * @param _settingId The ID of the setting
	 * @param _value The bool value to be set
	 */
	function setPendingValue(uint256 _settingId, bool _value) public inWhitelist {
		pendingValue[_settingId] = _value;
	}

	/**
	 * @dev Move value from pending to setting
	 * @param _settingId The ID of the setting
	 */
	function movePendingToSetting(uint256 _settingId) public inWhitelist {
		bool _tempValue = pendingValue[_settingId];
		delete pendingValue[_settingId];
		settingValue[_settingId] = _tempValue;
	}
}
