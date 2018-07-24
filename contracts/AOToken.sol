pragma solidity ^0.4.24;

import './SafeMath.sol';
import './owned.sol';
import './TokenERC20.sol';
import './tokenRecipient.sol';

/**
 * @title AOToken
 */
contract AOToken is owned, TokenERC20 {
	using SafeMath for uint256;

	// To differentiate denomination of AO
	uint256 public powerOfTen;

	/***** NORMAL ERC20 TOKEN VARIABLES *****/
	uint256 public sellPrice;
	uint256 public buyPrice;

	mapping (address => bool) public frozenAccount;

	// This generates a public event on the blockchain that will notify clients
	event FrozenFunds(address target, bool frozen);

	/***** ICO TOKEN VARIABLES *****/
	uint256 public icoTotalSupply;
	uint256 public icoSellPrice;
	uint256 public icoBuyPrice;
	bool public icoContract;

	mapping (address => uint256) public icoBalanceOf;
	mapping (address => mapping (address => uint256)) public icoAllowance;

	event IcoTransfer(address indexed from, address indexed to, uint256 value);
	event IcoApproval(address indexed _owner, address indexed _spender, uint256 _value);
	event IcoBurn(address indexed from, uint256 value);

	uint256 public totalLots;
	uint256 public lotIndex;

	// Max supply of 1,125,899,906,842,620 AOTKN
	uint256 constant public MAX_ICO_SUPPLY = 1125899906842620;
	// The amount of tokens that we want to reserve for foundation
	uint256 constant public ICO_RESERVED_FOR_FOUNDATION = 125899906842620;
	// Account for 6 decimal points for weighted index
	uint256 constant public WEIGHTED_INDEX_DIVISOR = 10 ** 6; // 1000000 = 1

	bool public foundationReserved;
	bool public icoEnded;

	struct Lot {
		bytes32 lotId;
		uint256 index;	// This value is in 10^6, so 1000000 = 1
		address lotOwner;
		uint256 tokenAmount;
	}

	// Mapping from lot ID to the lot object
	mapping (bytes32 => Lot) internal lots;

	// Mapping from owner to list of owned lot IDs
	mapping (address => bytes32[]) internal ownedLots;

	// Mapping from owner's lot ID to index of the owner lots list
	mapping (address => mapping (bytes32 => uint256)) internal ownedLotsIndex;

	// Mapping from owner to his/her current weighted index
	mapping (address => uint256) internal ownerWeightedIndex;

	// Event to be broadcasted to public when a lot is created
	// index value is in 10^6 to account for decimal points
	event LotCreation(address indexed lotOwner, bytes32 indexed lotId, uint256 index, uint256 tokenAmount);

	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol)
		TokenERC20(initialSupply, tokenName, tokenSymbol) public {
		powerOfTen = 0;
		decimals = 0;
		icoContract = true;
		setIcoPrices(0, 10000); // Set ICO buy price to 10000 Wei/token
	}

	/**
	 * @dev Checks if this is the ICO contract
	 */
	modifier isIco {
		require (icoContract == true);
		_;
	}

	/***** OWNER ONLY METHODS *****/
	/***** NORMAL ERC20 OWNER ONLY METHODS *****/
	/**
	 * @dev Prevent/Allow target from sending & receiving tokens
	 * @param target Address to be frozen
	 * @param freeze Either to freeze it or not
	 */
	function freezeAccount(address target, bool freeze) public onlyOwner {
		frozenAccount[target] = freeze;
		emit FrozenFunds(target, freeze);
	}

	/**
	 * @dev Allow users to buy tokens for `newBuyPrice` eth and sell tokens for `newSellPrice` eth
	 * @param newSellPrice Price users can sell to the contract
	 * @param newBuyPrice Price users can buy from the contract
	 */
	function setPrices(uint256 newSellPrice, uint256 newBuyPrice) public onlyOwner {
		sellPrice = newSellPrice;
		buyPrice = newBuyPrice;
	}

	/**
	 * @dev Create `mintedAmount` tokens and send it to `target`
	 * @param target Address to receive the tokens
	 * @param mintedAmount The amount of tokens it will receive
	 */
	function mintToken(address target, uint256 mintedAmount) public onlyOwner {
		balanceOf[target] = balanceOf[target].add(mintedAmount);
		totalSupply = totalSupply.add(mintedAmount);
		emit Transfer(0, this, mintedAmount);
		emit Transfer(this, target, mintedAmount);
	}

	/***** ICO TOKEN OWNER ONLY METHODS *****/
	/**
	 * @dev Allow users to buy ICO tokens for `newBuyPrice` eth and sell ICO tokens for `newSellPrice` eth
	 * @param newIcoSellPrice Price users can sell to the contract
	 * @param newIcoBuyPrice Price users can buy from the contract
	 */
	function setIcoPrices(uint256 newIcoSellPrice, uint256 newIcoBuyPrice) public onlyOwner isIco {
		icoSellPrice = newIcoSellPrice;
		icoBuyPrice = newIcoBuyPrice;
	}

	/**
	 * @dev Reserve some tokens for the Foundation
	 */
	function reserveForFoundation() public onlyOwner isIco {
		require (icoEnded == false);
		require (foundationReserved == false);
		require (icoTotalSupply < MAX_ICO_SUPPLY);

		foundationReserved = true;
		uint256 tokenAmount = ICO_RESERVED_FOR_FOUNDATION;

		if (icoTotalSupply.add(tokenAmount) >= MAX_ICO_SUPPLY) {
			tokenAmount = MAX_ICO_SUPPLY.sub(icoTotalSupply);
			icoEnded = true;
		}

		_createIcoLot(msg.sender, tokenAmount);
	}

	/***** PUBLIC METHODS *****/
	/***** NORMAL ERC20 PUBLIC METHODS *****/
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

	/***** ICO TOKEN PUBLIC METHODS *****/
	/**
	 * @dev Buy ICO tokens from contract by sending ether
	 */
	function buyIcoToken() public payable isIco {
		require (icoEnded == false);
		require (icoTotalSupply < MAX_ICO_SUPPLY);
		require (icoBuyPrice > 0);
		require (msg.value > 0);

		// Calculate the amount of tokens
		uint256 tokenAmount = msg.value.div(icoBuyPrice);

		uint256 remainderEth = 0;

		// Make sure icoTotalSupply is not overflowing
		if (icoTotalSupply.add(tokenAmount) >= MAX_ICO_SUPPLY) {
			tokenAmount = MAX_ICO_SUPPLY.sub(icoTotalSupply);
			icoEnded = true;
			remainderEth = msg.value.sub(tokenAmount.mul(icoBuyPrice));
		}

		_createIcoLot(msg.sender, tokenAmount);
		if (remainderEth > 0) {
			msg.sender.transfer(remainderEth);
		}
	}

	/**
	 * @dev Send `_value` ICO tokens to `_to` from your account
	 * @param _to The address of the recipient
	 * @param _value The amount to send
	 * @return true on success
	 */
	function transferIcoToken(address _to, uint256 _value) public isIco returns (bool success) {
		bytes32 _createdLotId = _createWeightedIndexLot(_to, _value, ownerWeightedIndex[msg.sender]);
		Lot memory _lot = lots[_createdLotId];

		// Make sure the new lot is created successfully
		require (_lot.lotOwner == _to);
		// Transfer the ICO tokens
		require (_transferIcoToken(msg.sender, _to, _value));
		// Update the weighted index of the recipient
		require (_updateWeightedIndex(_to));
		emit LotCreation(_lot.lotOwner, _lot.lotId, _lot.index, _lot.tokenAmount);
		return true;
	}

	/**
	 * @dev Send `_value` ICO tokens to `_to` from `_from`
	 * @param _from The address of the sender
	 * @param _to The address of the recipient
	 * @param _value The amount to send
	 * @return true on success
	 */
	function transferIcoTokenFrom(address _from, address _to, uint256 _value) public isIco returns (bool success) {
		require (_value <= icoAllowance[_from][msg.sender]);
		icoAllowance[_from][msg.sender] = icoAllowance[_from][msg.sender].sub(_value);

		bytes32 _createdLotId = _createWeightedIndexLot(_to, _value, ownerWeightedIndex[_from]);
		Lot memory _lot = lots[_createdLotId];

		// Make sure the new lot is created successfully
		require (_lot.lotOwner == _to);
		// Transfer the ICO tokens
		require (_transferIcoToken(_from, _to, _value));
		// Update the weighted index of the recipient
		require (_updateWeightedIndex(_to));
		emit LotCreation(_lot.lotOwner, _lot.lotId, _lot.index, _lot.tokenAmount);
		return true;
	}

	/**
	 * @dev Allows `_spender` to spend no more than `_value` ICO tokens in your behalf
	 * @param _spender The address authorized to spend
	 * @param _value The max amount they can spend
	 * @return true on success
	 */
	function approveIcoToken(address _spender, uint256 _value) public isIco returns (bool success) {
		icoAllowance[msg.sender][_spender] = _value;
		emit IcoApproval(msg.sender, _spender, _value);
		return true;
	}

	/**
	 * @dev Allows `_spender` to spend no more than `_value` ICO tokens in your behalf, and then ping the contract about it
	 * @param _spender The address authorized to spend
	 * @param _value The max amount they can spend
	 * @param _extraData some extra information to send to the approved contract
	 * @return true on success
	 */
	function approveIcoTokenAndCall(address _spender, uint256 _value, bytes _extraData) public isIco returns (bool success) {
		tokenRecipient spender = tokenRecipient(_spender);
		if (approveIcoToken(_spender, _value)) {
			spender.receiveApproval(msg.sender, _value, this, _extraData);
			return true;
		}
	}

	/**
	 * @dev Remove `_value` ICO tokens from the system irreversibly
	 * @param _value The amount to burn
	 * @return true on success
	 */
	function burnIcoToken(uint256 _value) public isIco returns (bool success) {
		require (icoBalanceOf[msg.sender] >= _value);
		icoBalanceOf[msg.sender] = icoBalanceOf[msg.sender].sub(_value);
		icoTotalSupply = icoTotalSupply.sub(_value);
		emit IcoBurn(msg.sender, _value);
		return true;
	}

	/**
	 * @dev Remove `_value` ICO tokens from the system irreversibly on behsalf of `_from`
	 * @param _from The address of sender
	 * @param _value The amount to burn
	 * @return true on success
	 */
	function burnIcoTokenFrom(address _from, uint256 _value) public isIco returns (bool success) {
		require (icoBalanceOf[_from] >= _value);
		require (_value <= icoAllowance[_from][msg.sender]);
		icoBalanceOf[_from] = icoBalanceOf[_from].sub(_value);
		icoAllowance[_from][msg.sender] = icoAllowance[_from][msg.sender].sub(_value);
		icoTotalSupply = icoTotalSupply.sub(_value);
		emit IcoBurn(_from, _value);
		return true;
	}

	/**
	 * @dev Return all lot IDs owned by an address
	 * @param _lotOwner The address of the lot owner
	 * @return array of lot IDs
	 */
	function lotsByAddress(address _lotOwner) public isIco view returns (bytes32[]) {
		return ownedLots[_lotOwner];
	}

	/**
	 * @dev Return the total lots owned by an address
	 * @param _lotOwner The address of the lot owner
	 * @return total lots owner by the address
	 */
	function totalLotsByAddress(address _lotOwner) public isIco view returns (uint256) {
		return ownedLots[_lotOwner].length;
	}

	/**
	 * @dev Return the lot information at a given index of the lots list of the requested owner
	 * @param _lotOwner The address owning the lots list to be accessed
	 * @param _index uint256 representing the index to be accessed of the requested lots list
	 * @return id of the lot
	 * @return index of the lot in (10 ** 6)
	 * @return ICO token amount in the lot
	 */
	function lotOfOwnerByIndex(address _lotOwner, uint256 _index) public isIco view returns (bytes32, uint256, uint256) {
		require (_index < ownedLots[_lotOwner].length);
		Lot memory _lot = lots[ownedLots[_lotOwner][_index]];
		return (_lot.lotId, _lot.index, _lot.tokenAmount);
	}

	/**
	 * @dev Return the lot information at a given ID
	 * @param _lotId The lot ID in question
	 * @return id of the lot
	 * @return index of the lot in (10 ** 6)
	 * @return ICO token amount in the lot
	 */
	function lotById(bytes32 _lotId) public isIco view returns (bytes32, uint256, uint256) {
		Lot memory _lot = lots[_lotId];
		return (_lot.lotId, _lot.index, _lot.tokenAmount);
	}

	/**
	 * @dev Return the average weighted index of all lots owned by an address
	 * @param _lotOwner The address of the lot owner
	 * @return the weighted index of the address (in 10 ** 6)
	 */
	function weightedIndexByAddress(address _lotOwner) public isIco view returns (uint256) {
		return ownerWeightedIndex[_lotOwner];
	}

	/***** NORMAL ERC20 & ICO TOKEN METHODS *****/
	/**
	 * @dev Send `_value` normal ERC20 and `_icoValue` ICO tokens to `_to` from your account
	 * @param _to The address of the recipient
	 * @param _value The amount of normal ERC20 tokens to send
	 * @param _icoValue The amount of ICO tokens to send
	 * @return true on success
	 */
	function transferTokens(address _to, uint256 _value, uint256 _icoValue) public isIco returns (bool success) {
		require (super.transfer(_to, _value));
		require (transferIcoToken(_to, _icoValue));
		return true;
	}

	/**
	 * @dev Send `_value` normal ERC20 and `_icoValue` ICO tokens to `_to` from `_from`
	 * @param _from The address of the sender
	 * @param _to The address of the recipient
	 * @param _value The amount of normal ERC20 tokens to send
	 * @param _icoValue The amount of ICO tokens to send
	 * @return true on success
	 */
	function transferTokensFrom(address _from, address _to, uint256 _value, uint256 _icoValue) public isIco returns (bool success) {
		require (super.transferFrom(_from, _to, _value));
		require (transferIcoTokenFrom(_from, _to, _icoValue));
		return true;
	}

	/**
	 * @dev Allows `_spender` to spend no more than `_value` normal ERC20 and `_icoValue` ICO tokens in your behalf
	 * @param _spender The address authorized to spend
	 * @param _value The max amount of normal ERC20 they can spend
	 * @param _icoValue The max amount of normal ERC20 they can spend
	 * @return true on success
	 */
	function approveTokens(address _spender, uint256 _value, uint256 _icoValue) public isIco returns (bool success) {
		require (super.approve(_spender, _value));
		require (approveIcoToken(_spender, _icoValue));
		return true;
	}

	/**
	 * @dev Allows `_spender` to spend no more than `_value` normal ERC20 and `_icoValue` ICO tokens in your behalf, and then ping the contract about it
	 * @param _spender The address authorized to spend
	 * @param _value The max amount of normal ERC20 they can spend
	 * @param _icoValue The max amount of ICO Tokens they can spend
	 * @param _extraData some extra information to send to the approved contract
	 * @return true on success
	 */
	function approveTokensAndCall(address _spender, uint256 _value, uint256 _icoValue, bytes _extraData) public isIco returns (bool success) {
		require (super.approveAndCall(_spender, _value, _extraData));
		require (approveIcoTokenAndCall(_spender, _icoValue, _extraData));
		return true;
	}

	/**
	 * @dev Remove `_value` normal ERC20 and `_icoValue` ICO tokens from the system irreversibly
	 * @param _value The amount of normal ERC20 to burn
	 * @param _icoValue The amount of ICO tokens to burn
	 * @return true on success
	 */
	function burnTokens(uint256 _value, uint256 _icoValue) public isIco returns (bool success) {
		require (super.burn(_value));
		require (burnIcoToken(_icoValue));
		return true;
	}

	/**
	 * @dev Remove `_value` normal ERC20 and `_icoValue` ICO tokens from the system irreversibly on behsalf of `_from`
	 * @param _from The address of sender
	 * @param _value The amount of normal ERC20 to burn
	 * @param _icoValue The amount of ICO tokens to burn
	 * @return true on success
	 */
	function burnTokensFrom(address _from, uint256 _value, uint256 _icoValue) public isIco returns (bool success) {
		require (super.burnFrom(_from, _value));
		require (burnIcoTokenFrom(_from, _icoValue));
		return true;
	}

	/***** INTERNAL METHODS *****/
	/***** NORMAL ERC20 INTERNAL METHODS *****/
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

	/***** ICO TOKEN INTERNAL METHODS *****/
	/**
	 * @dev Create a lot with `tokenAmount` of tokens for an `account` during ICO
	 * @param _account Address of the lot owner
	 * @param _tokenAmount The amount of tokens to be stored in the lot
	 */
	function _createIcoLot(address _account, uint256 _tokenAmount) internal {
		require (_account != address(0));
		require (_tokenAmount > 0);

		totalLots++;
		lotIndex++;

		// Generate lotId
		bytes32 lotId = keccak256(abi.encodePacked(this, _account, totalLots));

		// Make sure no one owns this lot yet
		require (lots[lotId].lotOwner == address(0));

		Lot storage lot = lots[lotId];
		lot.lotId = lotId;
		lot.index = lotIndex.mul(WEIGHTED_INDEX_DIVISOR);
		lot.lotOwner = _account;
		lot.tokenAmount = _tokenAmount;
		uint256 lotIdIndex = ownedLots[_account].length;
		ownedLots[_account].push(lotId);
		ownedLotsIndex[_account][lotId] = lotIdIndex;
		require (_mintIcoToken(_account, _tokenAmount));
		require (_updateWeightedIndex(_account));
		emit LotCreation(lot.lotOwner, lot.lotId, lot.index, lot.tokenAmount);
	}

	/**
	 * @dev Create `mintedAmount` ICO tokens and send it to `target`
	 * @param target Address to receive the ICO tokens
	 * @param mintedAmount The amount of ICO tokens it will receive
	 * @return true on success
	 */
	function _mintIcoToken(address target, uint256 mintedAmount) internal returns (bool) {
		icoBalanceOf[target] = icoBalanceOf[target].add(mintedAmount);
		icoTotalSupply = icoTotalSupply.add(mintedAmount);
		emit IcoTransfer(0, this, mintedAmount);
		emit IcoTransfer(this, target, mintedAmount);
		return true;
	}

	/**
	 * @dev Calculate and update the weighted index of owner's total ICO tokens
	 * @param account The account address to be updated
	 */
	function _updateWeightedIndex(address account) internal returns (bool) {
		if (ownedLots[account].length > 0) {
			uint256 totalWeightedTokens;
			uint256 totalTokens;
			for (uint256 i=0; i < ownedLots[account].length; i++) {
				Lot memory _lot = lots[ownedLots[account][i]];
				totalWeightedTokens = totalWeightedTokens.add(_lot.index.mul(_lot.tokenAmount));
				totalTokens = totalTokens.add(_lot.tokenAmount);
			}
			ownerWeightedIndex[account] = totalWeightedTokens.div(totalTokens);
		}
		return true;
	}

	/**
	 * @dev Create a lot with `tokenAmount` of tokens at `weightedIndex` for an `account`
	 * @param _account Address of lot owner
	 * @param _tokenAmount The amount of tokens
	 * @param _weightedIndex The index of the lot (in 10^6)
	 * @return bytes32 of new created lot ID
	 */
	function _createWeightedIndexLot(address _account, uint256 _tokenAmount, uint256 _weightedIndex) internal returns (bytes32) {
		require (_account != address(0));
		require (_tokenAmount > 0);

		totalLots++;

		// Generate lotId
		bytes32 lotId = keccak256(abi.encodePacked(this, _account, totalLots));

		// Make sure no one owns this lot yet
		require (lots[lotId].lotOwner == address(0));

		Lot storage lot = lots[lotId];
		lot.lotId = lotId;
		lot.index = _weightedIndex;
		lot.lotOwner = _account;
		lot.tokenAmount = _tokenAmount;
		uint256 lotIdIndex = ownedLots[_account].length;
		ownedLots[_account].push(lotId);
		ownedLotsIndex[_account][lotId] = lotIdIndex;
		return lotId;
	}

	/**
	 * @dev Send `_value` ICO tokens from `_from` to `_to`
	 * @param _from The address of sender
	 * @param _to The address of the recipient
	 * @param _value The amount to send
	 */
	function _transferIcoToken(address _from, address _to, uint256 _value) internal returns (bool) {
		require (_to != address(0));									// Prevent transfer to 0x0 address. Use burn() instead
		require (icoBalanceOf[_from] >= _value);						// Check if the sender has enough
		require (icoBalanceOf[_to].add(_value) >= icoBalanceOf[_to]);	// Check for overflows
		require (!frozenAccount[_from]);								// Check if sender is frozen
		require (!frozenAccount[_to]);									// Check if recipient is frozen
		uint256 previousBalances = icoBalanceOf[_from].add(icoBalanceOf[_to]);
		icoBalanceOf[_from] = icoBalanceOf[_from].sub(_value);			// Subtract from the sender
		icoBalanceOf[_to] = icoBalanceOf[_to].add(_value);				// Add the same to the recipient
		emit IcoTransfer(_from, _to, _value);
		assert(icoBalanceOf[_from].add(icoBalanceOf[_to]) == previousBalances);
		return true;
	}
}
