pragma solidity ^0.4.24;

import "./AOToken.sol";

contract AOKilo is AOToken {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol, address _settingThoughtId, address _aoSettingAddress)
		AOToken(initialSupply, tokenName, tokenSymbol, _settingThoughtId, _aoSettingAddress) public {
		powerOfTen = 3;
		decimals = 3;
		networkExchangeContract = false;
	}
}
