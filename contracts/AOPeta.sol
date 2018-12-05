pragma solidity ^0.4.24;

import "./AOToken.sol";

contract AOPeta is AOToken {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol, address _settingThoughtId, address _aoSettingAddress)
		AOToken(initialSupply, tokenName, tokenSymbol, _settingThoughtId, _aoSettingAddress) public {
		powerOfTen = 15;
		decimals = 15;
		networkExchangeContract = false;
	}
}
