pragma solidity ^0.4.24;

import './TokenERC20.sol';

/**
 * @title TokenThree
 */
contract TokenThree is TokenERC20 {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol)
		TokenERC20(initialSupply, tokenName, tokenSymbol) public {
		decimals = 0;
		totalSupply = initialSupply * 10 ** uint256(decimals);  // Update total supply with the decimal amount
		balanceOf[msg.sender] = totalSupply;                // Give the creator all initial tokens
	}
}
