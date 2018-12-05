pragma solidity ^0.4.24;

import "./AOToken.sol";

contract AOMega is AOToken {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol, address _settingThoughtId, address _aoSettingAddress)
		AOToken(initialSupply, tokenName, tokenSymbol, _settingThoughtId, _aoSettingAddress) public {
		powerOfTen = 6;
		decimals = 6;
		networkExchangeContract = false;
	}
}
