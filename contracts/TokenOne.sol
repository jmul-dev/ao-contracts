pragma solidity ^0.4.24;

import './TokenERC20.sol';

/**
 * @title TokenOne
 */
contract TokenOne is TokenERC20 {
	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol)
		TokenERC20(initialSupply, tokenName, tokenSymbol) public {
		decimals = 18;
		totalSupply = initialSupply * 10 ** uint256(decimals);  // Update total supply with the decimal amount
		balanceOf[msg.sender] = totalSupply;                // Give the creator all initial tokens
	}
}
