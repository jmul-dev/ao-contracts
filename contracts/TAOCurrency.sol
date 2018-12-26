pragma solidity ^0.4.24;

import './SafeMath.sol';
import './TheAO.sol';

/**
 * @title TAOCurrency
 */
contract TAOCurrency is TheAO {
	using SafeMath for uint256;

	// Public variables of the token
	string public name;
	string public symbol;
	uint8 public decimals = 0;
	bytes32 public internalName;

	uint256 public totalSupply;

	// This creates an array with all balances
	// address is the address of nameId, not the eth public address
	mapping (address => uint256) public balanceOf;

	// This generates a public event on the blockchain that will notify clients
	// address is the address of TAO/Name Id, not eth public address
	event Transfer(address indexed from, address indexed to, uint256 value);

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
	 * @dev transfer tokens from other address
	 *
	 * Send `_value` tokens to `_to` in behalf of `_from`
	 *
	 * @param _from The address of the sender
	 * @param _to The address of the recipient
	 * @param _value the amount to send
	 */
	function transferFrom(address _from, address _to, uint256 _value) public inWhitelist(msg.sender) returns (bool) {
		_transfer(_from, _to, _value);
		return true;
	}

	/**
	 * @dev Create `mintedAmount` tokens and send it to `target`
	 * @param target Address to receive the tokens
	 * @param mintedAmount The amount of tokens it will receive
	 * @return true on success
	 */
	function mintToken(address target, uint256 mintedAmount) public inWhitelist(msg.sender) returns (bool) {
		_mintToken(target, mintedAmount);
		return true;
	}

	/***** INTERNAL METHODS *****/
	/**
	 * @dev Send `_value` tokens from `_from` to `_to`
	 * @param _from The address of sender
	 * @param _to The address of the recipient
	 * @param _value The amount to send
	 */
	function _transfer(address _from, address _to, uint256 _value) internal {
		require (_to != address(0));							// Prevent transfer to 0x0 address. Use burn() instead
		require (balanceOf[_from] >= _value);					// Check if the sender has enough
		require (balanceOf[_to].add(_value) >= balanceOf[_to]); // Check for overflows
		uint256 previousBalances = balanceOf[_from].add(balanceOf[_to]);
		balanceOf[_from] = balanceOf[_from].sub(_value);        // Subtract from the sender
		balanceOf[_to] = balanceOf[_to].add(_value);            // Add the same to the recipient
		emit Transfer(_from, _to, _value);
		assert(balanceOf[_from].add(balanceOf[_to]) == previousBalances);
	}

	/**
	 * @dev Create `mintedAmount` tokens and send it to `target`
	 * @param target Address to receive the tokens
	 * @param mintedAmount The amount of tokens it will receive
	 */
	function _mintToken(address target, uint256 mintedAmount) internal {
		balanceOf[target] = balanceOf[target].add(mintedAmount);
		totalSupply = totalSupply.add(mintedAmount);
		emit Transfer(0, this, mintedAmount);
		emit Transfer(this, target, mintedAmount);
	}
}
