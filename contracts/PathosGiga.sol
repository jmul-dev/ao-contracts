pragma solidity ^0.4.24;

import "./Pathos.sol";

contract PathosGiga is Pathos {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol, address _nameTAOPositionAddress)
		Pathos(initialSupply, tokenName, tokenSymbol, _nameTAOPositionAddress) public {
		powerOfTen = 9;
		decimals = 9;
	}
}
