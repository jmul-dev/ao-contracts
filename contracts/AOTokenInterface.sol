pragma solidity ^0.4.24;

import './SafeMath.sol';
import './TheAO.sol';
import './TokenERC20.sol';
import './tokenRecipient.sol';
import './AOLibrary.sol';

/**
 * @title AOTokenInterface
 */
contract AOTokenInterface is TheAO, TokenERC20 {
	using SafeMath for uint256;

	// To differentiate denomination of AO
	uint256 public powerOfTen;

	/***** NETWORK TOKEN VARIABLES *****/
	uint256 public sellPrice;
	uint256 public buyPrice;

	mapping (address => bool) public frozenAccount;
	mapping (address => uint256) public stakedBalance;
	mapping (address => uint256) public escrowedBalance;

	// This generates a public event on the blockchain that will notify clients
	event FrozenFunds(address target, bool frozen);
	event Stake(address indexed from, uint256 value);
	event Unstake(address indexed from, uint256 value);
	event Escrow(address indexed from, address indexed to, uint256 value);
	event Unescrow(address indexed from, uint256 value);

	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol)
		TokenERC20(initialSupply, tokenName, tokenSymbol) public {
		powerOfTen = 0;
		decimals = 0;
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

	/***** The AO ONLY METHODS *****/
	/**
	 * @dev The AO set the NameTAOPosition Address
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	function setNameTAOPositionAddress(address _nameTAOPositionAddress) public onlyTheAO {
		require (_nameTAOPositionAddress != address(0));
		nameTAOPositionAddress = _nameTAOPositionAddress;
	}

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
	 * @dev Allows TheAO to transfer `_amount` of ETH from this address to `_recipient`
	 * @param _recipient The recipient address
	 * @param _amount The amount to transfer
	 */
	function transferEth(address _recipient, uint256 _amount) public onlyTheAO {
		_recipient.transfer(_amount);
	}

	/**
	 * @dev Allows TheAO to transfer `_amount` of ERC20 Token from this address to `_recipient`
	 * @param _erc20TokenAddress The address of ERC20 Token
	 * @param _recipient The recipient address
	 * @param _amount The amount to transfer
	 */
	function transferERC20(address _erc20TokenAddress, address _recipient, uint256 _amount) public onlyTheAO {
		TokenERC20 _erc20 = TokenERC20(_erc20TokenAddress);
		require (_erc20.transfer(_recipient, _amount));
	}

	/**
	 * @dev Prevent/Allow target from sending & receiving tokens
	 * @param target Address to be frozen
	 * @param freeze Either to freeze it or not
	 */
	function freezeAccount(address target, bool freeze) public onlyTheAO {
		frozenAccount[target] = freeze;
		emit FrozenFunds(target, freeze);
	}

	/**
	 * @dev Allow users to buy tokens for `newBuyPrice` eth and sell tokens for `newSellPrice` eth
	 * @param newSellPrice Price users can sell to the contract
	 * @param newBuyPrice Price users can buy from the contract
	 */
	function setPrices(uint256 newSellPrice, uint256 newBuyPrice) public onlyTheAO {
		sellPrice = newSellPrice;
		buyPrice = newBuyPrice;
	}

	/***** NETWORK TOKEN WHITELISTED ADDRESS ONLY METHODS *****/
	/**
	 * @dev Create `mintedAmount` tokens and send it to `target`
	 * @param target Address to receive the tokens
	 * @param mintedAmount The amount of tokens it will receive
	 * @return true on success
	 */
	function mintToken(address target, uint256 mintedAmount) public inWhitelist returns (bool) {
		_mintToken(target, mintedAmount);
		return true;
	}

	/**
	 * @dev Stake `_value` tokens on behalf of `_from`
	 * @param _from The address of the target
	 * @param _value The amount to stake
	 * @return true on success
	 */
	function stakeFrom(address _from, uint256 _value) public inWhitelist returns (bool) {
		require (balanceOf[_from] >= _value);						// Check if the targeted balance is enough
		balanceOf[_from] = balanceOf[_from].sub(_value);			// Subtract from the targeted balance
		stakedBalance[_from] = stakedBalance[_from].add(_value);	// Add to the targeted staked balance
		emit Stake(_from, _value);
		return true;
	}

	/**
	 * @dev Unstake `_value` tokens on behalf of `_from`
	 * @param _from The address of the target
	 * @param _value The amount to unstake
	 * @return true on success
	 */
	function unstakeFrom(address _from, uint256 _value) public inWhitelist returns (bool) {
		require (stakedBalance[_from] >= _value);					// Check if the targeted staked balance is enough
		stakedBalance[_from] = stakedBalance[_from].sub(_value);	// Subtract from the targeted staked balance
		balanceOf[_from] = balanceOf[_from].add(_value);			// Add to the targeted balance
		emit Unstake(_from, _value);
		return true;
	}

	/**
	 * @dev Store `_value` from `_from` to `_to` in escrow
	 * @param _from The address of the sender
	 * @param _to The address of the recipient
	 * @param _value The amount of network tokens to put in escrow
	 * @return true on success
	 */
	function escrowFrom(address _from, address _to, uint256 _value) public inWhitelist returns (bool) {
		require (balanceOf[_from] >= _value);						// Check if the targeted balance is enough
		balanceOf[_from] = balanceOf[_from].sub(_value);			// Subtract from the targeted balance
		escrowedBalance[_to] = escrowedBalance[_to].add(_value);	// Add to the targeted escrowed balance
		emit Escrow(_from, _to, _value);
		return true;
	}

	/**
	 * @dev Create `mintedAmount` tokens and send it to `target` escrow balance
	 * @param target Address to receive the tokens
	 * @param mintedAmount The amount of tokens it will receive in escrow
	 */
	function mintTokenEscrow(address target, uint256 mintedAmount) public inWhitelist returns (bool) {
		escrowedBalance[target] = escrowedBalance[target].add(mintedAmount);
		totalSupply = totalSupply.add(mintedAmount);
		emit Escrow(this, target, mintedAmount);
		return true;
	}

	/**
	 * @dev Release escrowed `_value` from `_from`
	 * @param _from The address of the sender
	 * @param _value The amount of escrowed network tokens to be released
	 * @return true on success
	 */
	function unescrowFrom(address _from, uint256 _value) public inWhitelist returns (bool) {
		require (escrowedBalance[_from] >= _value);						// Check if the targeted escrowed balance is enough
		escrowedBalance[_from] = escrowedBalance[_from].sub(_value);	// Subtract from the targeted escrowed balance
		balanceOf[_from] = balanceOf[_from].add(_value);				// Add to the targeted balance
		emit Unescrow(_from, _value);
		return true;
	}

	/**
	 *
	 * @dev Whitelisted address remove `_value` tokens from the system irreversibly on behalf of `_from`.
	 *
	 * @param _from the address of the sender
	 * @param _value the amount of money to burn
	 */
	function whitelistBurnFrom(address _from, uint256 _value) public inWhitelist returns (bool success) {
		require(balanceOf[_from] >= _value);                // Check if the targeted balance is enough
		balanceOf[_from] = balanceOf[_from].sub(_value);    // Subtract from the targeted balance
		totalSupply = totalSupply.sub(_value);              // Update totalSupply
		emit Burn(_from, _value);
		return true;
	}

	/**
	 * @dev Whitelisted address transfer tokens from other address
	 *
	 * Send `_value` tokens to `_to` on behalf of `_from`
	 *
	 * @param _from The address of the sender
	 * @param _to The address of the recipient
	 * @param _value the amount to send
	 */
	function whitelistTransferFrom(address _from, address _to, uint256 _value) public inWhitelist returns (bool success) {
		_transfer(_from, _to, _value);
		return true;
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Buy tokens from contract by sending ether
	 */
	function buy() public payable {
		require (buyPrice > 0);
		uint256 amount = msg.value.div(buyPrice);
		_transfer(this, msg.sender, amount);
	}

	/**
	 * @dev Sell `amount` tokens to contract
	 * @param amount The amount of tokens to be sold
	 */
	function sell(uint256 amount) public {
		require (sellPrice > 0);
		address myAddress = this;
		require (myAddress.balance >= amount.mul(sellPrice));
		_transfer(msg.sender, this, amount);
		msg.sender.transfer(amount.mul(sellPrice));
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
		require (!frozenAccount[_from]);						// Check if sender is frozen
		require (!frozenAccount[_to]);							// Check if recipient is frozen
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
