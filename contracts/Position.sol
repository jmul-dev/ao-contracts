pragma solidity ^0.4.24;

import './SafeMath.sol';
import './developed.sol';

/**
 * @title Position
 */
contract Position is developed {
	using SafeMath for uint256;

	// Public variables of the token
	string public name;
	string public symbol;
	uint8 public decimals = 4;

	uint256 constant public MAX_SUPPLY_PER_NAME = 100 * (10 ** 4);

	uint256 public totalSupply;

	// Mapping from Name ID to bool value whether or not it has received Position Token
	mapping (address => bool) public receivedToken;

	// Mapping from Name ID to its total available balance
	mapping (address => uint256) public balanceOf;

	// Mapping from Name's TAO ID to its staked amount
	mapping (address => mapping(address => uint256)) public taoStakedBalance;

	// Mapping from TAO ID to its total staked amount
	mapping (address => uint256) public totalTAOStakedBalance;

	// This generates a public event on the blockchain that will notify clients
	event Mint(address indexed nameId, uint256 value);
	event Stake(address indexed nameId, address indexed taoId, uint256 value);
	event Unstake(address indexed nameId, address indexed taoId, uint256 value);

	/**
	 * Constructor function
	 *
	 * Initializes contract with initial supply tokens to the creator of the contract
	 */
	constructor (uint256 initialSupply, string tokenName, string tokenSymbol) public {
		totalSupply = initialSupply;			// Update total supply
		balanceOf[msg.sender] = totalSupply;	// Give the creator all initial tokens
		name = tokenName;						// Set the name for display purposes
		symbol = tokenSymbol;					// Set the symbol for display purposes
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Create `MAX_SUPPLY_PER_NAME` tokens and send it to `_nameId`
	 * @param _nameId Address to receive the tokens
	 * @return true on success
	 */
	function mintToken(address _nameId) public inWhitelist(msg.sender) returns (bool) {
		// Make sure _nameId has not received Position Token
		require (receivedToken[_nameId] == false);

		receivedToken[_nameId] = true;
		balanceOf[_nameId] = balanceOf[_nameId].add(MAX_SUPPLY_PER_NAME);
		totalSupply = totalSupply.add(MAX_SUPPLY_PER_NAME);
		emit Mint(_nameId, MAX_SUPPLY_PER_NAME);
		return true;
	}

	/**
	 * @dev Get staked balance of `_nameId`
	 * @param _nameId The Name ID to be queried
	 * @return total staked balance
	 */
	function stakedBalance(address _nameId) public view returns (uint256) {
		return MAX_SUPPLY_PER_NAME.sub(balanceOf[_nameId]);
	}

	/**
	 * @dev Stake `_value` tokens on `_taoId` from `_nameId`
	 * @param _nameId The Name ID that wants to stake
	 * @param _taoId The TAO ID to stake
	 * @param _value The amount to stake
	 * @return true on success
	 */
	function stake(address _nameId, address _taoId, uint256 _value) public inWhitelist(msg.sender) returns (bool) {
		require (_value > 0 && _value <= MAX_SUPPLY_PER_NAME);
		require (balanceOf[_nameId] >= _value);							// Check if the targeted balance is enough
		balanceOf[_nameId] = balanceOf[_nameId].sub(_value);			// Subtract from the targeted balance
		taoStakedBalance[_nameId][_taoId] = taoStakedBalance[_nameId][_taoId].add(_value);	// Add to the targeted staked balance
		totalTAOStakedBalance[_taoId] = totalTAOStakedBalance[_taoId].add(_value);
		emit Stake(_nameId, _taoId, _value);
		return true;
	}

	/**
	 * @dev Unstake `_value` tokens from `_nameId`'s `_taoId`
	 * @param _nameId The Name ID that wants to unstake
	 * @param _taoId The TAO ID to unstake
	 * @param _value The amount to unstake
	 * @return true on success
	 */
	function unstake(address _nameId, address _taoId, uint256 _value) public inWhitelist(msg.sender) returns (bool) {
		require (_value > 0 && _value <= MAX_SUPPLY_PER_NAME);
		require (taoStakedBalance[_nameId][_taoId] >= _value);	// Check if the targeted staked balance is enough
		require (totalTAOStakedBalance[_taoId] >= _value);	// Check if the total targeted staked balance is enough
		taoStakedBalance[_nameId][_taoId] = taoStakedBalance[_nameId][_taoId].sub(_value);	// Subtract from the targeted staked balance
		totalTAOStakedBalance[_taoId] = totalTAOStakedBalance[_taoId].sub(_value);
		balanceOf[_nameId] = balanceOf[_nameId].add(_value);			// Add to the targeted balance
		emit Unstake(_nameId, _taoId, _value);
		return true;
	}
}
