pragma solidity ^0.4.24;

import './SafeMath.sol';
import './developed.sol';

/**
 * @title ThoughtCurrency
 */
contract ThoughtCurrency is developed {
	using SafeMath for uint256;

	// Public variables of the token
	string public name;
	string public symbol;
	uint8 public decimals = 0;
	bytes32 public internalName;
	int8 public sign = 1;

	uint256 public totalSupply;

	// This creates an array with all balances
	// address is the address of nameId, not the eth public address
	mapping (address => uint256) public balanceOf;

	// This notifies clients about the amount minted
	// address is the address of nameId, not the eth public address
	event Mint(address indexed target, uint256 value);

	/**
	 * Constructor function
	 *
	 * Initializes contract with initial supply tokens to the creator of the contract
	 */
	constructor (uint256 initialSupply, string tokenName, string tokenSymbol, bytes32 tokenInternalName) public {
		totalSupply = initialSupply;			// Update total supply
		balanceOf[msg.sender] = totalSupply;	// Give the creator all initial tokens
		name = tokenName;						// Set the name for display purposes
		symbol = tokenSymbol;					// Set the symbol for display purposes
		internalName = tokenInternalName;		// Set the internalName to be used internally
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Create `mintedAmount` tokens and send it to `target`
	 * @param target Address to receive the tokens
	 * @param mintedAmount The amount of tokens it will receive
	 * @return true on success
	 */
	function mintToken(address target, uint256 mintedAmount) public inWhitelist(msg.sender) returns (bool) {
		require (target != address(0));
		balanceOf[target] = balanceOf[target].add(mintedAmount);
		totalSupply = totalSupply.add(mintedAmount);
		emit Mint(target, mintedAmount);
		return true;
	}
}
