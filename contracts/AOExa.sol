pragma solidity ^0.4.24;

import "./AOToken.sol";

contract AOExa is AOToken {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol, address _settingTAOId, address _aoSettingAddress)
		AOToken(initialSupply, tokenName, tokenSymbol, _settingTAOId, _aoSettingAddress) public {
		powerOfTen = 18;
		decimals = 18;
		networkExchangeContract = false;
	}
}
