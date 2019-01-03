pragma solidity ^0.4.24;

import "./Logos.sol";

contract LogosPeta is Logos {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol, address _nameTAOPositionAddress)
		Logos(initialSupply, tokenName, tokenSymbol, _nameTAOPositionAddress) public {
		powerOfTen = 15;
		decimals = 15;
	}
}
