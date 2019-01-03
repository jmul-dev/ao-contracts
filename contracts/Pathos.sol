pragma solidity ^0.4.24;

import "./TAOCurrency.sol";

contract Pathos is TAOCurrency {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol)
		TAOCurrency(initialSupply, tokenName, tokenSymbol) public {}
}
