pragma solidity ^0.5.4;

import './SafeMath.sol';
import './AOLibrary.sol';
import './TheAO.sol';

/**
 * @title Voice
 */
contract Voice is TheAO {
	using SafeMath for uint256;

	// Public variables of the contract
	string public name;
	string public symbol;
	uint8 public decimals = 4;

	uint256 constant public MAX_SUPPLY_PER_NAME = 100 * (10 ** 4);

	uint256 public totalSupply;

	// Mapping from Name ID to bool value whether or not it has received Voice
	mapping (address => bool) public hasReceived;

	// Mapping from Name/TAO ID to its total available balance
	mapping (address => uint256) public balanceOf;

	// Mapping from Name ID to TAO ID and its staked amount
	mapping (address => mapping(address => uint256)) public taoStakedBalance;

	// This generates a public event on the blockchain that will notify clients
	event Mint(address indexed nameId, uint256 value);
	event Stake(address indexed nameId, address indexed taoId, uint256 value);
	event Unstake(address indexed nameId, address indexed taoId, uint256 value);

	/**
	 * Constructor function
	 */
	constructor (string _name, string _symbol) public {
		name = _name;						// Set the name for display purposes
		symbol = _symbol;					// Set the symbol for display purposes
	}

	/**
	 * @dev Checks if the calling contract address is The AO
	 *		OR
	 *		If The AO is set to a Name/TAO, then check if calling address is the Advocate
	 */
	modifier onlyTheAO {
		require (AOLibrary.isTheAO(msg.sender, theAO, nameTAOPositionAddress));
		_;
	}

	/**
	 * @dev Check if `_taoId` is a TAO
	 */
	modifier isTAO(address _taoId) {
		require (AOLibrary.isTAO(_taoId));
		_;
	}

	/**
	 * @dev Check if `_nameId` is a Name
	 */
	modifier isName(address _nameId) {
		require (AOLibrary.isName(_nameId));
		_;
	}

	/***** The AO ONLY METHODS *****/
	/**
	 * @dev Transfer ownership of The AO to new address
	 * @param _theAO The new address to be transferred
	 */
	function transferOwnership(address _theAO) public onlyTheAO {
		require (_theAO != address(0));
		theAO = _theAO;
	}

	/**
	 * @dev Whitelist `_account` address to transact on behalf of others
	 * @param _account The address to whitelist
	 * @param _whitelist Either to whitelist or not
	 */
	function setWhitelist(address _account, bool _whitelist) public onlyTheAO {
		require (_account != address(0));
		whitelist[_account] = _whitelist;
	}

	/**
	 * @dev The AO set the NameTAOPosition Address
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	function setNameTAOPositionAddress(address _nameTAOPositionAddress) public onlyTheAO {
		require (_nameTAOPositionAddress != address(0));
		nameTAOPositionAddress = _nameTAOPositionAddress;
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Create `MAX_SUPPLY_PER_NAME` Voice and send it to `_nameId`
	 * @param _nameId Address to receive Voice
	 * @return true on success
	 */
	function mint(address _nameId) public inWhitelist isName(_nameId) returns (bool) {
		// Make sure _nameId has not received Voice
		require (hasReceived[_nameId] == false);

		hasReceived[_nameId] = true;
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
	function stakedBalance(address _nameId) public isName(_nameId) view returns (uint256) {
		return MAX_SUPPLY_PER_NAME.sub(balanceOf[_nameId]);
	}

	/**
	 * @dev Stake `_value` Voice on `_taoId` from `_nameId`
	 * @param _nameId The Name ID that wants to stake
	 * @param _taoId The TAO ID to stake
	 * @param _value The amount to stake
	 * @return true on success
	 */
	function stake(address _nameId, address _taoId, uint256 _value) public inWhitelist isName(_nameId) isTAO(_taoId) returns (bool) {
		require (_value > 0 && _value <= MAX_SUPPLY_PER_NAME);
		require (balanceOf[_nameId] >= _value);							// Check if the targeted balance is enough
		balanceOf[_nameId] = balanceOf[_nameId].sub(_value);			// Subtract from the targeted balance
		taoStakedBalance[_nameId][_taoId] = taoStakedBalance[_nameId][_taoId].add(_value);	// Add to the targeted staked balance
		balanceOf[_taoId] = balanceOf[_taoId].add(_value);
		emit Stake(_nameId, _taoId, _value);
		return true;
	}

	/**
	 * @dev Unstake `_value` Voice from `_nameId`'s `_taoId`
	 * @param _nameId The Name ID that wants to unstake
	 * @param _taoId The TAO ID to unstake
	 * @param _value The amount to unstake
	 * @return true on success
	 */
	function unstake(address _nameId, address _taoId, uint256 _value) public inWhitelist isName(_nameId) isTAO(_taoId) returns (bool) {
		require (_value > 0 && _value <= MAX_SUPPLY_PER_NAME);
		require (taoStakedBalance[_nameId][_taoId] >= _value);	// Check if the targeted staked balance is enough
		require (balanceOf[_taoId] >= _value);	// Check if the total targeted staked balance is enough
		taoStakedBalance[_nameId][_taoId] = taoStakedBalance[_nameId][_taoId].sub(_value);	// Subtract from the targeted staked balance
		balanceOf[_taoId] = balanceOf[_taoId].sub(_value);
		balanceOf[_nameId] = balanceOf[_nameId].add(_value);			// Add to the targeted balance
		emit Unstake(_nameId, _taoId, _value);
		return true;
	}
}
