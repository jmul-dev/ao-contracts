pragma solidity ^0.4.24;

import './SafeMath.sol';
import './owned.sol';
import './TokenERC20.sol';

/**
 * @title AOContentToken
 */
contract AOContentToken is owned, TokenERC20 {
	using SafeMath for uint256;

	uint256 public sellPrice;
	uint256 public buyPrice;

	mapping (address => bool) public frozenAccount;

	// Max supply of 1,125,899,906,842,620 AOCTKN
	uint256 constant public MAX_SUPPLY = 1125899906842620;
	// The amount of tokens that we want to reserve for foundation
	uint256 constant public RESERVED_FOR_FOUNDATION_AMOUNT = 125899906842620;

	bool private foundationReserved;

	uint256 public numLots;
	uint256 public lotIndex;

	struct Lot {
		bytes32 lotId;
		uint256 index;
		address lotOwner;
		uint256 tokenAmount;
	}

	// Mapping from lot ID to the lot object
	mapping (bytes32 => Lot) private lots;

	// Mapping from owner to list of owned lot IDs
	mapping (address => bytes32[]) private ownedLots;

	// Mapping from owner's lot ID to index of the owner lots list
	// Note: Will need to use this mapping when we want to remove lot ID from ownedLots
	mapping (address => mapping (bytes32 => uint256)) private ownedLotsIndex;

	// This generates a public event on the blockchain that will notify clients
	event FrozenFunds(address target, bool frozen);

	event LotCreation(address indexed lotOwner, bytes32 indexed lotId, uint256 lotIndex, uint256 tokenAmount);

	/**
	 * @dev Constructor function
	 */
	constructor()
		TokenERC20(0, "AO Content Token", "AOCTKN") public {
			decimals = 0;
			setPrices(0, 10000); // Set buy price to 10000 Wei/token
	}

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
	 * @dev Reserve some tokens for the foundation
	 */
	function reserveForFoundation() public onlyOwner {
		require (foundationReserved == false);
		require (totalSupply < MAX_SUPPLY);

		foundationReserved = true;
		uint256 tokenAmount = RESERVED_FOR_FOUNDATION_AMOUNT;

		if (totalSupply.add(tokenAmount) > MAX_SUPPLY) {
			tokenAmount = MAX_SUPPLY.sub(totalSupply);
		}

		// Increment lotIndex since we want to create new lot
		lotIndex++;

		createLot(msg.sender, tokenAmount, lotIndex);
	}

	/**
	 * @dev Buy tokens from contract by sending ether
	 */
	function buy() public payable {
		require (totalSupply < MAX_SUPPLY);

		// Calculate the amount of tokens
		uint256 tokenAmount = msg.value.div(buyPrice);

		// Make sure totalSupply is not overflowing
		if (totalSupply.add(tokenAmount) > MAX_SUPPLY) {
			tokenAmount = MAX_SUPPLY.sub(totalSupply);
		}

		// Increment lotIndex since we want to create new lot
		lotIndex++;

		createLot(msg.sender, tokenAmount, lotIndex);
	}

	/* INTERNAL FUNCTIONS */
	function _transfer(address _from, address _to, uint256 _value) internal {
		require (_to != address(0));							// Prevent transfer to 0x0 address. Use burn() instead
		require (balanceOf[_from] >= _value);					// Check if the sender has enough
		require (balanceOf[_to].add(_value) >= balanceOf[_to]); // Check for overflows
		require (!frozenAccount[_from]);						// Check if sender is frozen
		require (!frozenAccount[_to]);							// Check if recipient is frozen
		balanceOf[_from] = balanceOf[_from].sub(_value);        // Subtract from the sender
		balanceOf[_to] = balanceOf[_to].add(_value);            // Add the same to the recipient
		emit Transfer(_from, _to, _value);
	}

	/**
	 * @dev Create `mintedAmount` tokens and send it to `target`
	 * @param target Address to receive the tokens
	 * @param mintedAmount The amount of tokens it will receive
	 * @return true on success
	 */
	function mintToken(address target, uint256 mintedAmount) internal returns (bool) {
		require (!frozenAccount[target]);
		balanceOf[target] = balanceOf[target].add(mintedAmount);
		totalSupply = totalSupply.add(mintedAmount);
		emit Transfer(0, this, mintedAmount);
		emit Transfer(this, target, mintedAmount);
		return true;
	}

	/**
	 * @dev Create a lot with `tokenAmount` of tokens for an `account`
	 * @param _account Address of the lot owner
	 * @param _tokenAmount The amount of tokens to be stored in the lot
	 * @param _lotIndex The index of this lot
	 */
	function createLot(address _account, uint256 _tokenAmount, uint256 _lotIndex) internal {
		require (_account != address(0));
		require (_tokenAmount > 0);
		require (_lotIndex > 0);

		numLots++;

		// Generate lotId
		bytes32 lotId = keccak256(abi.encodePacked(this, _account, numLots, _lotIndex));

		// Make sure no one owns this lot yet
		require (lots[lotId].lotOwner == address(0));

		Lot storage lot = lots[lotId];
		lot.lotId = lotId;
		lot.index = _lotIndex;
		lot.lotOwner = _account;
		lot.tokenAmount = _tokenAmount;
		uint256 lotIdIndex = ownedLots[_account].length;
		ownedLots[_account].push(lotId);
		ownedLotsIndex[_account][lotId] = lotIdIndex;
		require (mintToken(_account, _tokenAmount));
		emit LotCreation(_account, lotId, _lotIndex, _tokenAmount);
	}
}
