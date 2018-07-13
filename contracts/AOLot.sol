pragma solidity ^0.4.24;

import './SafeMath.sol';
import './owned.sol';
import './AOToken.sol';

/**
 * @title AOLot
 */
contract AOLot is owned {
	using SafeMath for uint256;

	address public AOTokenAddress;
	AOToken private aotoken;

	bool public paused;
	bool public icoEnded;

	// Max supply of 1,125,899,906,842,620 AO Tokens
	uint256 constant public MAX_SUPPLY = 1125899906842620;
	uint256 constant public RESERVED_SUPPLY = 125899906842620;
	uint256 public buyPrice;
	uint256 public totalTokenBought;
	bool private foundationLotReserved;

	struct Lot {
		address lotOwner;
		uint256 tokenAmount;
		uint256 remainingTokenAmount;
	}

	// numLots serves 2 purposes:
	// 1. To tell how many lots there are in the contract
	// 2. As incremental ID
	uint256 public numLots;

	// Mapping from lot ID to the actual Lot
	mapping (uint256 => Lot) private lots;

	// Mapping from owner to list of owned lot IDs
	mapping (address => uint256[]) private ownedLots;

	// Mapping from lot ID to index of the owner lots list
	mapping (address => mapping(uint256 => uint256)) private ownedLotsIndex;

	event BuyToken(address indexed lotOwner, uint256 indexed lotId, uint256 tokenAmount, bool success);

	constructor(address tokenAddress) public {
		AOTokenAddress = tokenAddress;
		aotoken = AOToken(tokenAddress);
		setBuyPrice(10000); // Set buyPrice to 10000 Wei/AO
	}

	/**
	 * @dev Checks if the contract is currently active
	 */
	modifier isActive {
		require(paused == false);
		_;
	}

	/**
	 * @dev Owner paused contract
	 * @param _paused The value to be set
	 */
	function setPaused(bool _paused) public onlyOwner returns (bool) {
		paused = _paused;
		return true;
	}

	/**
	 * @dev Owner set token buy price
	 * @param newBuyPrice The new value to be set
	 */
	function setBuyPrice(uint256 newBuyPrice) public onlyOwner returns (bool) {
		buyPrice = newBuyPrice;
		return true;
	}

	/**
	 * @dev Owner reserve 1 lot of 126 Tera AO Tokens for the foundation/DAO
	 */
	function reserveForFoundation() public onlyOwner returns (bool) {
		require (foundationLotReserved == false);
		foundationLotReserved = true;
		_storeLot(owner, RESERVED_SUPPLY);
		return true;
	}

	/**
	 * @dev buy lot of tokens from contract by sending ether
	 */
	function buy() payable public isActive {
		require(msg.value > 0 && buyPrice > 0 && totalTokenBought < MAX_SUPPLY && icoEnded == false);

		// Calculate the amount of tokens
		uint256 tokenAmount = msg.value.div(buyPrice);

		// Make sure we don't buy more than MAX_SUPPLY
		if (tokenAmount.add(totalTokenBought) > MAX_SUPPLY) {
			tokenAmount = MAX_SUPPLY.sub(totalTokenBought);
		}

		// Check if we have token to be transferred
		require(tokenAmount > 0 && aotoken.balanceOf(this) > tokenAmount);

		// Store this purchase lot
		_storeLot(msg.sender, tokenAmount);
	}

	/**
	 * @dev Gets the num of lots owned by an address
	 * @param _owner address owning the lots list
	 * @return uint256 num of lots
	 */
	function numLotsByAddress(address _owner) public view returns (uint256) {
		return ownedLots[_owner].length;
	}

	/**
	 * @dev Gets the lot ID at a given index of the lots list of the requested owner
	 * @param _owner address owning the lots list to be accessed
	 * @param _index uint256 representing the index to be access of the requested lots list
	 * @return uint256 lot ID at the given index of the lots list owned by the requested address
	 */
	function lotOfOwnerByIndex(address _owner, uint256 _index) public view returns (uint256) {
		require (_index < ownedLots[_owner].length);
		return ownedLots[_owner][_index];
	}

	/**
	 * @dev Gets the lot at a given ID of all lots in this contract
	 * @param _lotId uint256 representing the ID to be accessed of the lots list
	 * @return address of the lot owner
	 * @return uint256 representing the amount of AO tokens in the lot
	 */
	function lotById(uint256 _lotId) public view returns (address, uint256) {
		require (_lotId > 0 && _lotId <= numLots);
		Lot memory lot = lots[_lotId];
		return (lot.lotOwner, lot.tokenAmount);
	}

	/* Private functions */
	function _storeLot(address lotOwner, uint256 tokenAmount) private {
		// Store this purchase lot
		numLots++;
		totalTokenBought = totalTokenBought.add(tokenAmount);
		if (totalTokenBought >= MAX_SUPPLY) {
			icoEnded = true;
		}
		Lot storage lot = lots[numLots];
		lot.lotOwner = lotOwner;
		lot.tokenAmount = tokenAmount;
		uint256 length = ownedLots[lotOwner].length;
		ownedLots[lotOwner].push(numLots);
		ownedLotsIndex[lotOwner][numLots] = length;
		if (aotoken.transfer(lotOwner, tokenAmount)) {
			emit BuyToken(lotOwner, numLots, tokenAmount, true);
		} else {
			emit BuyToken(lotOwner, numLots, tokenAmount, false);
		}
	}
}
