pragma solidity ^0.4.24;

import "./AOToken.sol";

contract AOYotta is AOToken {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol, address _settingThoughtId, address _aoSettingAddress)
		AOToken(initialSupply, tokenName, tokenSymbol, _settingThoughtId, _aoSettingAddress) public {
		powerOfTen = 24;
		decimals = 24;
		networkExchangeContract = false;
	}
}
