pragma solidity ^0.4.24;

import './SafeMath.sol';
import './developed.sol';
import './TokenERC20.sol';
import './tokenRecipient.sol';
import './AOLibrary.sol';

/**
 * @title AOToken
 */
contract AOToken is developed, TokenERC20 {
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

	/***** PRIMORDIAL TOKEN VARIABLES *****/
	uint256 public primordialTotalSupply;
	uint256 public primordialSellPrice;
	uint256 public primordialBuyPrice;
	bool public networkExchangeContract;
	uint256 public startingMultiplier;
	uint256 public endingMultiplier;
	uint256 public startingNetworkTokenBonusMultiplier;
	uint256 public endingNetworkTokenBonusMultiplier;

	mapping (address => uint256) public primordialBalanceOf;
	mapping (address => mapping (address => uint256)) public primordialAllowance;

	// Mapping from owner's lot weighted multiplier to the amount of staked tokens
	mapping (address => mapping (uint256 => uint256)) public primordialStakedBalance;

	event PrimordialTransfer(address indexed from, address indexed to, uint256 value);
	event PrimordialApproval(address indexed _owner, address indexed _spender, uint256 _value);
	event PrimordialBurn(address indexed from, uint256 value);
	event PrimordialStake(address indexed from, uint256 value, uint256 weightedMultiplier);
	event PrimordialUnstake(address indexed from, uint256 value, uint256 weightedMultiplier);

	uint256 public totalLots;

	// Max supply of 1,125,899,906,842,620 AOTKN
	uint256 constant public MAX_PRIMORDIAL_SUPPLY = 1125899906842620;
	// The amount of tokens that we want to reserve for foundation
	uint256 constant public TOKENS_RESERVED_FOR_FOUNDATION = 125899906842620;
	// Account for 6 decimal points for multiplier
	uint256 constant public MULTIPLIER_DIVISOR = 10 ** 6; // 1000000 = 1
	uint256 constant public PERCENTAGE_DIVISOR = 10 ** 6; // 100% = 1000000

	bool public foundationReserved;
	bool public networkExchangeEnded;

	struct Lot {
		bytes32 lotId;
		uint256 multiplier;	// This value is in 10^6, so 1000000 = 1
		address lotOwner;
		uint256 tokenAmount;
	}

	// Mapping from lot ID to the lot object
	mapping (bytes32 => Lot) internal lots;

	// Mapping from owner to list of owned lot IDs
	mapping (address => bytes32[]) internal ownedLots;

	// Mapping from owner to his/her current weighted multiplier
	mapping (address => uint256) internal ownerWeightedMultiplier;

	// Event to be broadcasted to public when a lot is created
	// multiplier value is in 10^6 to account for 6 decimal points
	event LotCreation(address indexed lotOwner, bytes32 indexed lotId, uint256 multiplier, uint256 primordialTokenAmount, uint256 networkTokenBonusAmount);

	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol)
		TokenERC20(initialSupply, tokenName, tokenSymbol) public {
		powerOfTen = 0;
		decimals = 0;
		networkExchangeContract = true;
		setPrimordialPrices(0, 10000); // Set Primordial buy price to 10000 Wei/token
		startingMultiplier = 50 * MULTIPLIER_DIVISOR;
		endingMultiplier = 3 * MULTIPLIER_DIVISOR;
		startingNetworkTokenBonusMultiplier = 1000000; // 100%
		endingNetworkTokenBonusMultiplier = 250000; // 25%
	}

	/**
	 * @dev Checks if this is the Primordial contract
	 */
	modifier isNetworkExchange {
		require (networkExchangeContract == true);
		_;
	}

	/***** DEVELOPER ONLY METHODS *****/
	/**
	 * @dev Set starting/ending multiplier values that are used to calculate primordial multiplier
	 * @param _startingMultiplier The new starting multiplier value
	 * @param _endingMultiplier The new ending multiplier value
	 */
	function setStartingEndingMultiplier(uint256 _startingMultiplier, uint256 _endingMultiplier) public onlyDeveloper {
		require (_startingMultiplier >= _endingMultiplier);
		startingMultiplier = _startingMultiplier;
		endingMultiplier = _endingMultiplier;
	}

	/**
	 * @dev Set starting/ending network token bonus multiplier values that are used to calculate network token bonus amount
	 * @param _startingNetworkTokenBonusMultiplier The new starting network token bonus multiplier value
	 * @param _endingNetworkTokenBonusMultiplier The new ending network token bonus multiplier value
	 */
	function setStartingEndingNetworkTokenBonusMultiplier(uint256 _startingNetworkTokenBonusMultiplier, uint256 _endingNetworkTokenBonusMultiplier) public onlyDeveloper {
		require (_startingNetworkTokenBonusMultiplier >= _endingNetworkTokenBonusMultiplier);
		startingNetworkTokenBonusMultiplier = _startingNetworkTokenBonusMultiplier;
		endingNetworkTokenBonusMultiplier = _endingNetworkTokenBonusMultiplier;
	}

	/***** NETWORK TOKEN DEVELOPER ONLY METHODS *****/
	/**
	 * @dev Prevent/Allow target from sending & receiving tokens
	 * @param target Address to be frozen
	 * @param freeze Either to freeze it or not
	 */
	function freezeAccount(address target, bool freeze) public onlyDeveloper {
		frozenAccount[target] = freeze;
		emit FrozenFunds(target, freeze);
	}

	/**
	 * @dev Allow users to buy tokens for `newBuyPrice` eth and sell tokens for `newSellPrice` eth
	 * @param newSellPrice Price users can sell to the contract
	 * @param newBuyPrice Price users can buy from the contract
	 */
	function setPrices(uint256 newSellPrice, uint256 newBuyPrice) public onlyDeveloper {
		sellPrice = newSellPrice;
		buyPrice = newBuyPrice;
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

	/**
	 * @dev Stake `_value` tokens on behalf of `_from`
	 * @param _from The address of the target
	 * @param _value The amount to stake
	 * @return true on success
	 */
	function stakeFrom(address _from, uint256 _value) public inWhitelist(msg.sender) returns (bool) {
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
	function unstakeFrom(address _from, uint256 _value) public inWhitelist(msg.sender) returns (bool) {
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
	function escrowFrom(address _from, address _to, uint256 _value) public inWhitelist(msg.sender) returns (bool) {
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
	function mintTokenEscrow(address target, uint256 mintedAmount) public inWhitelist(msg.sender) returns (bool) {
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
	function unescrowFrom(address _from, uint256 _value) public inWhitelist(msg.sender) returns (bool) {
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
	function whitelistBurnFrom(address _from, uint256 _value) public inWhitelist(msg.sender) returns (bool success) {
		require(balanceOf[_from] >= _value);                // Check if the targeted balance is enough
		balanceOf[_from] = balanceOf[_from].sub(_value);    // Subtract from the targeted balance
		totalSupply = totalSupply.sub(_value);              // Update totalSupply
		emit Burn(_from, _value);
		return true;
	}

	/***** PRIMORDIAL TOKEN DEVELOPER ONLY METHODS *****/
	/**
	 * @dev Allow users to buy Primordial tokens for `newBuyPrice` eth and sell Primordial tokens for `newSellPrice` eth
	 * @param newPrimordialSellPrice Price users can sell to the contract
	 * @param newPrimordialBuyPrice Price users can buy from the contract
	 */
	function setPrimordialPrices(uint256 newPrimordialSellPrice, uint256 newPrimordialBuyPrice) public onlyDeveloper isNetworkExchange {
		primordialSellPrice = newPrimordialSellPrice;
		primordialBuyPrice = newPrimordialBuyPrice;
	}

	/**
	 * @dev Reserve some tokens for the Foundation
	 */
	function reserveForFoundation() public onlyDeveloper isNetworkExchange {
		require (networkExchangeEnded == false);
		require (foundationReserved == false);
		require (primordialTotalSupply < MAX_PRIMORDIAL_SUPPLY);

		foundationReserved = true;
		uint256 tokenAmount = TOKENS_RESERVED_FOR_FOUNDATION;

		if (primordialTotalSupply.add(tokenAmount) >= MAX_PRIMORDIAL_SUPPLY) {
			tokenAmount = MAX_PRIMORDIAL_SUPPLY.sub(primordialTotalSupply);
			networkExchangeEnded = true;
		}

		//_createPrimordialLot(msg.sender, tokenAmount);
	}

	/**
	 * @dev Stake `_value` Primordial tokens at `_weightedMultiplier ` multiplier on behalf of `_from`
	 * @param _from The address of the target
	 * @param _value The amount of Primordial tokens to stake
	 * @param _weightedMultiplier The weighted multiplier of the Primordial tokens
	 * @return true on success
	 */
	function stakePrimordialTokenFrom(address _from, uint256 _value, uint256 _weightedMultiplier) public inWhitelist(msg.sender) isNetworkExchange returns (bool) {
		// Check if the targeted balance is enough
		require (primordialBalanceOf[_from] >= _value);
		// Make sure the weighted multiplier is the same as account's current weighted multiplier
		require (_weightedMultiplier == ownerWeightedMultiplier[_from]);
		// Subtract from the targeted balance
		primordialBalanceOf[_from] = primordialBalanceOf[_from].sub(_value);
		// Add to the targeted staked balance
		primordialStakedBalance[_from][_weightedMultiplier] = primordialStakedBalance[_from][_weightedMultiplier].add(_value);
		emit PrimordialStake(_from, _value, _weightedMultiplier);
		return true;
	}

	/**
	 * @dev Unstake `_value` Primordial tokens at `_weightedMultiplier` on behalf of `_from`
	 * @param _from The address of the target
	 * @param _value The amount to unstake
	 * @param _weightedMultiplier The weighted multiplier of the Primordial tokens
	 * @return true on success
	 */
	function unstakePrimordialTokenFrom(address _from, uint256 _value, uint256 _weightedMultiplier) public inWhitelist(msg.sender) isNetworkExchange returns (bool) {
		// Check if the targeted staked balance is enough
		require (primordialStakedBalance[_from][_weightedMultiplier] >= _value);
		// Subtract from the targeted staked balance
		primordialStakedBalance[_from][_weightedMultiplier] = primordialStakedBalance[_from][_weightedMultiplier].sub(_value);
		// Add to the targeted balance
		primordialBalanceOf[_from] = primordialBalanceOf[_from].add(_value);
		emit PrimordialUnstake(_from, _value, _weightedMultiplier);
		return true;
	}

	/***** PUBLIC METHODS *****/
	/***** NETWORK TOKEN PUBLIC METHODS *****/
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

	/***** Primordial TOKEN PUBLIC METHODS *****/
	/**
	 * @dev Buy Primordial tokens from contract by sending ether
	 */
	function buyPrimordialToken() public payable isNetworkExchange {
		require (networkExchangeEnded == false);
		require (primordialTotalSupply < MAX_PRIMORDIAL_SUPPLY);
		require (primordialBuyPrice > 0);
		require (msg.value > 0);

		// Calculate the amount of tokens
		uint256 tokenAmount = msg.value.div(primordialBuyPrice);

		uint256 remainderEth = 0;

		// Make sure primordialTotalSupply is not overflowing
		if (primordialTotalSupply.add(tokenAmount) >= MAX_PRIMORDIAL_SUPPLY) {
			tokenAmount = MAX_PRIMORDIAL_SUPPLY.sub(primordialTotalSupply);
			networkExchangeEnded = true;
			remainderEth = msg.value.sub(tokenAmount.mul(primordialBuyPrice));
		}
		require (tokenAmount > 0);

		(uint256 multiplier, uint256 networkTokenBonusPercentage, uint256 networkTokenBonusAmount) = calculateMultiplierAndBonus(tokenAmount);
		_createPrimordialLot(msg.sender, tokenAmount, multiplier, networkTokenBonusAmount);

		// Calculate foundation's portion of Primordial and Network Token Bonus

		// Make sure primordialTotalSupply is not overflowing
		if (primordialTotalSupply.add(tokenAmount) >= MAX_PRIMORDIAL_SUPPLY) {
			tokenAmount = MAX_PRIMORDIAL_SUPPLY.sub(primordialTotalSupply);
			networkExchangeEnded = true;
		}

		if (tokenAmount > 0) {
			uint256 foundationMultiplier = startingMultiplier.sub(multiplier);
			uint256 foundationNetworkTokenBonusAmount = (startingNetworkTokenBonusMultiplier.sub(networkTokenBonusPercentage).add(endingNetworkTokenBonusMultiplier)).mul(tokenAmount).div(PERCENTAGE_DIVISOR);
			_createPrimordialLot(aoDevTeam1, tokenAmount.div(2), foundationMultiplier, foundationNetworkTokenBonusAmount.div(2));
			_createPrimordialLot(aoDevTeam2, tokenAmount.sub(tokenAmount.div(2)), foundationMultiplier, foundationNetworkTokenBonusAmount.sub(foundationNetworkTokenBonusAmount.div(2)));
		}

		if (remainderEth > 0) {
			msg.sender.transfer(remainderEth);
		}
	}

	/**
	 * @dev Send `_value` Primordial tokens to `_to` from your account
	 * @param _to The address of the recipient
	 * @param _value The amount to send
	 * @return true on success
	 */
	function transferPrimordialToken(address _to, uint256 _value) public isNetworkExchange returns (bool success) {
		bytes32 _createdLotId = _createWeightedMultiplierLot(_to, _value, ownerWeightedMultiplier[msg.sender]);
		Lot memory _lot = lots[_createdLotId];

		// Make sure the new lot is created successfully
		require (_lot.lotOwner == _to);

		// Update the weighted multiplier of the recipient
		ownerWeightedMultiplier[_to] = AOLibrary.calculateWeightedMultiplier(ownerWeightedMultiplier[_to], primordialBalanceOf[_to], ownerWeightedMultiplier[msg.sender], _value);

		// Transfer the Primordial tokens
		require (_transferPrimordialToken(msg.sender, _to, _value));
		emit LotCreation(_lot.lotOwner, _lot.lotId, _lot.multiplier, _lot.tokenAmount, 0);
		return true;
	}

	/**
	 * @dev Send `_value` Primordial tokens to `_to` from `_from`
	 * @param _from The address of the sender
	 * @param _to The address of the recipient
	 * @param _value The amount to send
	 * @return true on success
	 */
	function transferPrimordialTokenFrom(address _from, address _to, uint256 _value) public isNetworkExchange returns (bool success) {
		require (_value <= primordialAllowance[_from][msg.sender]);
		primordialAllowance[_from][msg.sender] = primordialAllowance[_from][msg.sender].sub(_value);

		bytes32 _createdLotId = _createWeightedMultiplierLot(_to, _value, ownerWeightedMultiplier[_from]);
		Lot memory _lot = lots[_createdLotId];

		// Make sure the new lot is created successfully
		require (_lot.lotOwner == _to);

		// Update the weighted multiplier of the recipient
		ownerWeightedMultiplier[_to] = AOLibrary.calculateWeightedMultiplier(ownerWeightedMultiplier[_to], primordialBalanceOf[_to], ownerWeightedMultiplier[_from], _value);

		// Transfer the Primordial tokens
		require (_transferPrimordialToken(_from, _to, _value));
		emit LotCreation(_lot.lotOwner, _lot.lotId, _lot.multiplier, _lot.tokenAmount, 0);
		return true;
	}

	/**
	 * @dev Allows `_spender` to spend no more than `_value` Primordial tokens in your behalf
	 * @param _spender The address authorized to spend
	 * @param _value The max amount they can spend
	 * @return true on success
	 */
	function approvePrimordialToken(address _spender, uint256 _value) public isNetworkExchange returns (bool success) {
		primordialAllowance[msg.sender][_spender] = _value;
		emit PrimordialApproval(msg.sender, _spender, _value);
		return true;
	}

	/**
	 * @dev Allows `_spender` to spend no more than `_value` Primordial tokens in your behalf, and then ping the contract about it
	 * @param _spender The address authorized to spend
	 * @param _value The max amount they can spend
	 * @param _extraData some extra information to send to the approved contract
	 * @return true on success
	 */
	function approvePrimordialTokenAndCall(address _spender, uint256 _value, bytes _extraData) public isNetworkExchange returns (bool success) {
		tokenRecipient spender = tokenRecipient(_spender);
		if (approvePrimordialToken(_spender, _value)) {
			spender.receiveApproval(msg.sender, _value, this, _extraData);
			return true;
		}
	}

	/**
	 * @dev Remove `_value` Primordial tokens from the system irreversibly
	 * @param _value The amount to burn
	 * @return true on success
	 */
	function burnPrimordialToken(uint256 _value) public isNetworkExchange returns (bool success) {
		require (primordialBalanceOf[msg.sender] >= _value);
		primordialBalanceOf[msg.sender] = primordialBalanceOf[msg.sender].sub(_value);
		primordialTotalSupply = primordialTotalSupply.sub(_value);
		emit PrimordialBurn(msg.sender, _value);
		return true;
	}

	/**
	 * @dev Remove `_value` Primordial tokens from the system irreversibly on behsalf of `_from`
	 * @param _from The address of sender
	 * @param _value The amount to burn
	 * @return true on success
	 */
	function burnPrimordialTokenFrom(address _from, uint256 _value) public isNetworkExchange returns (bool success) {
		require (primordialBalanceOf[_from] >= _value);
		require (_value <= primordialAllowance[_from][msg.sender]);
		primordialBalanceOf[_from] = primordialBalanceOf[_from].sub(_value);
		primordialAllowance[_from][msg.sender] = primordialAllowance[_from][msg.sender].sub(_value);
		primordialTotalSupply = primordialTotalSupply.sub(_value);
		emit PrimordialBurn(_from, _value);
		return true;
	}

	/**
	 * @dev Return all lot IDs owned by an address
	 * @param _lotOwner The address of the lot owner
	 * @return array of lot IDs
	 */
	function lotIdsByAddress(address _lotOwner) public isNetworkExchange view returns (bytes32[]) {
		return ownedLots[_lotOwner];
	}

	/**
	 * @dev Return the total lots owned by an address
	 * @param _lotOwner The address of the lot owner
	 * @return total lots owner by the address
	 */
	function totalLotsByAddress(address _lotOwner) public isNetworkExchange view returns (uint256) {
		return ownedLots[_lotOwner].length;
	}

	/**
	 * @dev Return the lot information at a given index of the lots list of the requested owner
	 * @param _lotOwner The address owning the lots list to be accessed
	 * @param _index uint256 representing the index to be accessed of the requested lots list
	 * @return id of the lot
	 * @return multiplier of the lot in (10 ** 6)
	 * @return Primordial token amount in the lot
	 */
	function lotOfOwnerByIndex(address _lotOwner, uint256 _index) public isNetworkExchange view returns (bytes32, uint256, uint256) {
		require (_index < ownedLots[_lotOwner].length);
		Lot memory _lot = lots[ownedLots[_lotOwner][_index]];
		return (_lot.lotId, _lot.multiplier, _lot.tokenAmount);
	}

	/**
	 * @dev Return the lot information at a given ID
	 * @param _lotId The lot ID in question
	 * @return id of the lot
	 * @return multiplier of the lot in (10 ** 6)
	 * @return Primordial token amount in the lot
	 */
	function lotById(bytes32 _lotId) public isNetworkExchange view returns (bytes32, uint256, uint256) {
		Lot memory _lot = lots[_lotId];
		return (_lot.lotId, _lot.multiplier, _lot.tokenAmount);
	}

	/**
	 * @dev Return the average weighted multiplier of all lots owned by an address
	 * @param _lotOwner The address of the lot owner
	 * @return the weighted multiplier of the address (in 10 ** 6)
	 */
	function weightedMultiplierByAddress(address _lotOwner) public isNetworkExchange view returns (uint256) {
		return ownerWeightedMultiplier[_lotOwner];
	}

	/**
	 * @dev Calculate the primordial token multiplier and the bonuse network token amount on a given lot
	 *		when someone purchases primordial token during network exchange
	 * @param _purchaseAmount The amount of primordial token intended to be purchased
	 * @return The multiplier in (10 ** 6)
	 * @return The bonus percentage
	 * @return The amount of network token as bonus
	 */
	function calculateMultiplierAndBonus(uint256 _purchaseAmount) public isNetworkExchange view returns (uint256, uint256, uint256) {
		return (
			AOLibrary.calculatePrimordialMultiplier(_purchaseAmount, MAX_PRIMORDIAL_SUPPLY, primordialTotalSupply, startingMultiplier, endingMultiplier),
			AOLibrary.calculateNetworkTokenBonusPercentage(_purchaseAmount, MAX_PRIMORDIAL_SUPPLY, primordialTotalSupply, startingNetworkTokenBonusMultiplier, endingNetworkTokenBonusMultiplier),
			AOLibrary.calculateNetworkTokenBonusAmount(_purchaseAmount, MAX_PRIMORDIAL_SUPPLY, primordialTotalSupply, startingNetworkTokenBonusMultiplier, endingNetworkTokenBonusMultiplier)
		);
	}

	/***** NETWORK TOKEN & PRIMORDIAL TOKEN METHODS *****/
	/**
	 * @dev Send `_value` network tokens and `_primordialValue` primordial tokens to `_to` from your account
	 * @param _to The address of the recipient
	 * @param _value The amount of network tokens to send
	 * @param _primordialValue The amount of Primordial tokens to send
	 * @return true on success
	 */
	function transferTokens(address _to, uint256 _value, uint256 _primordialValue) public isNetworkExchange returns (bool success) {
		require (super.transfer(_to, _value));
		require (transferPrimordialToken(_to, _primordialValue));
		return true;
	}

	/**
	 * @dev Send `_value` network tokens and `_primordialValue` primordial tokens to `_to` from `_from`
	 * @param _from The address of the sender
	 * @param _to The address of the recipient
	 * @param _value The amount of network tokens tokens to send
	 * @param _primordialValue The amount of Primordial tokens to send
	 * @return true on success
	 */
	function transferTokensFrom(address _from, address _to, uint256 _value, uint256 _primordialValue) public isNetworkExchange returns (bool success) {
		require (super.transferFrom(_from, _to, _value));
		require (transferPrimordialTokenFrom(_from, _to, _primordialValue));
		return true;
	}

	/**
	 * @dev Allows `_spender` to spend no more than `_value` network tokens and `_primordialValue` Primordial tokens in your behalf
	 * @param _spender The address authorized to spend
	 * @param _value The max amount of network tokens they can spend
	 * @param _primordialValue The max amount of network tokens they can spend
	 * @return true on success
	 */
	function approveTokens(address _spender, uint256 _value, uint256 _primordialValue) public isNetworkExchange returns (bool success) {
		require (super.approve(_spender, _value));
		require (approvePrimordialToken(_spender, _primordialValue));
		return true;
	}

	/**
	 * @dev Allows `_spender` to spend no more than `_value` network tokens and `_primordialValue` Primordial tokens in your behalf, and then ping the contract about it
	 * @param _spender The address authorized to spend
	 * @param _value The max amount of network tokens they can spend
	 * @param _primordialValue The max amount of Primordial Tokens they can spend
	 * @param _extraData some extra information to send to the approved contract
	 * @return true on success
	 */
	function approveTokensAndCall(address _spender, uint256 _value, uint256 _primordialValue, bytes _extraData) public isNetworkExchange returns (bool success) {
		require (super.approveAndCall(_spender, _value, _extraData));
		require (approvePrimordialTokenAndCall(_spender, _primordialValue, _extraData));
		return true;
	}

	/**
	 * @dev Remove `_value` network tokens and `_primordialValue` Primordial tokens from the system irreversibly
	 * @param _value The amount of network tokens to burn
	 * @param _primordialValue The amount of Primordial tokens to burn
	 * @return true on success
	 */
	function burnTokens(uint256 _value, uint256 _primordialValue) public isNetworkExchange returns (bool success) {
		require (super.burn(_value));
		require (burnPrimordialToken(_primordialValue));
		return true;
	}

	/**
	 * @dev Remove `_value` network tokens and `_primordialValue` Primordial tokens from the system irreversibly on behsalf of `_from`
	 * @param _from The address of sender
	 * @param _value The amount of network tokens to burn
	 * @param _primordialValue The amount of Primordial tokens to burn
	 * @return true on success
	 */
	function burnTokensFrom(address _from, uint256 _value, uint256 _primordialValue) public isNetworkExchange returns (bool success) {
		require (super.burnFrom(_from, _value));
		require (burnPrimordialTokenFrom(_from, _primordialValue));
		return true;
	}

	/***** INTERNAL METHODS *****/
	/***** NETWORK TOKENS INTERNAL METHODS *****/
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

	/***** PRIMORDIAL TOKEN INTERNAL METHODS *****/
	/**
	 * @dev Create a lot with `primordialTokenAmount` of primordial tokens with `_multiplier` for an `account`
	 *		during network exchange, and reward `_networkTokenBonusAmount` if exist
	 * @param _account Address of the lot owner
	 * @param _primordialTokenAmount The amount of primordial tokens to be stored in the lot
	 * @param _multiplier The multiplier for this lot in (10 ** 6)
	 * @param _networkTokenBonusAmount The network token bonus amount
	 */
	function _createPrimordialLot(address _account, uint256 _primordialTokenAmount, uint256 _multiplier, uint256 _networkTokenBonusAmount) internal {
		require (_account != address(0));

		totalLots++;

		// Generate lotId
		bytes32 lotId = keccak256(abi.encodePacked(this, _account, totalLots));

		// Make sure no one owns this lot yet
		require (lots[lotId].lotOwner == address(0));

		Lot storage lot = lots[lotId];
		lot.lotId = lotId;
		lot.multiplier = _multiplier;
		lot.lotOwner = _account;
		lot.tokenAmount = _primordialTokenAmount;
		ownedLots[_account].push(lotId);
		ownerWeightedMultiplier[_account] = AOLibrary.calculateWeightedMultiplier(ownerWeightedMultiplier[_account], primordialBalanceOf[_account], lot.multiplier, lot.tokenAmount);
		require (_mintPrimordialToken(_account, _primordialTokenAmount));

		// If there is network token bonus, mint them to the account
		if (_networkTokenBonusAmount > 0) {
			_mintToken(_account, _networkTokenBonusAmount);
		}

		emit LotCreation(lot.lotOwner, lot.lotId, lot.multiplier, lot.tokenAmount, _networkTokenBonusAmount);
	}

	/**
	 * @dev Create `mintedAmount` Primordial tokens and send it to `target`
	 * @param target Address to receive the Primordial tokens
	 * @param mintedAmount The amount of Primordial tokens it will receive
	 * @return true on success
	 */
	function _mintPrimordialToken(address target, uint256 mintedAmount) internal returns (bool) {
		primordialBalanceOf[target] = primordialBalanceOf[target].add(mintedAmount);
		primordialTotalSupply = primordialTotalSupply.add(mintedAmount);
		emit PrimordialTransfer(0, this, mintedAmount);
		emit PrimordialTransfer(this, target, mintedAmount);
		return true;
	}

	/**
	 * @dev Create a lot with `tokenAmount` of tokens at `weightedMultiplier` for an `account`
	 * @param _account Address of lot owner
	 * @param _tokenAmount The amount of tokens
	 * @param _weightedMultiplier The multiplier of the lot (in 10^6)
	 * @return bytes32 of new created lot ID
	 */
	function _createWeightedMultiplierLot(address _account, uint256 _tokenAmount, uint256 _weightedMultiplier) internal returns (bytes32) {
		require (_account != address(0));
		require (_tokenAmount > 0);

		totalLots++;

		// Generate lotId
		bytes32 lotId = keccak256(abi.encodePacked(this, _account, totalLots));

		// Make sure no one owns this lot yet
		require (lots[lotId].lotOwner == address(0));

		Lot storage lot = lots[lotId];
		lot.lotId = lotId;
		lot.multiplier = _weightedMultiplier;
		lot.lotOwner = _account;
		lot.tokenAmount = _tokenAmount;
		ownedLots[_account].push(lotId);
		return lotId;
	}

	/**
	 * @dev Send `_value` Primordial tokens from `_from` to `_to`
	 * @param _from The address of sender
	 * @param _to The address of the recipient
	 * @param _value The amount to send
	 */
	function _transferPrimordialToken(address _from, address _to, uint256 _value) internal returns (bool) {
		require (_to != address(0));									// Prevent transfer to 0x0 address. Use burn() instead
		require (primordialBalanceOf[_from] >= _value);						// Check if the sender has enough
		require (primordialBalanceOf[_to].add(_value) >= primordialBalanceOf[_to]);	// Check for overflows
		require (!frozenAccount[_from]);								// Check if sender is frozen
		require (!frozenAccount[_to]);									// Check if recipient is frozen
		uint256 previousBalances = primordialBalanceOf[_from].add(primordialBalanceOf[_to]);
		primordialBalanceOf[_from] = primordialBalanceOf[_from].sub(_value);			// Subtract from the sender
		primordialBalanceOf[_to] = primordialBalanceOf[_to].add(_value);				// Add the same to the recipient
		emit PrimordialTransfer(_from, _to, _value);
		assert(primordialBalanceOf[_from].add(primordialBalanceOf[_to]) == previousBalances);
		return true;
	}
}
