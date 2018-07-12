pragma solidity ^0.4.24;

import './SafeMath.sol';
import './owned.sol';
import './AOToken.sol';

/**
 * @title AOTokenICO
 */
contract AOTokenICO is owned {
	using SafeMath for uint256;

	address public AOTokenAddress;
	AOToken internal aotoken;

	bool public paused;
	// 1 Peta = 10^15 but since AO has 18 decimals
	// 1 Peta = 10^15 * 10^18 = 10^33
	uint256 constant public MAX_SUPPLY = 10 ** 33;
	uint256 public buyPrice;
	uint256 public totalTokenBought;

	struct Lot {
		address investor;
		uint256 tokenAmount;
	}
	uint256 public numLots;

	// Mapping from lot ID to the actual Lot
	mapping (uint256 => Lot) private lots;

	// Mapping from owner to list of owned lot IDs
	mapping (address => uint256[]) private ownedLots;

	// Mapping from lot ID to index of the owner lots list
	mapping (address => mapping(uint256 => uint256)) private ownedLotsIndex;

	event BuyToken(address indexed investor, uint256 indexed lotId, uint256 tokenAmount, bool success);

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
	 * @dev Investor buy tokens from contract by sending ether
	 */
	function buy() payable public isActive {
		require(msg.value > 0 && buyPrice > 0 && totalTokenBought < MAX_SUPPLY);

		// Calculate the amount of tokens
		uint256 tokenAmount = msg.value.div(buyPrice).mul(10 ** uint256(aotoken.decimals()));

		// Make sure we don't buy more than MAX_SUPPLY
		if (tokenAmount.add(totalTokenBought) > MAX_SUPPLY) {
			tokenAmount = MAX_SUPPLY.sub(totalTokenBought);
		}

		// Check if we have token to be transferred
		require(tokenAmount > 0 && aotoken.balanceOf(this) > tokenAmount);

		// Store this purchase lot
		numLots++;
		totalTokenBought = totalTokenBought.add(tokenAmount);
		Lot storage lot = lots[numLots];
		lot.investor = msg.sender;
		lot.tokenAmount = tokenAmount;
		uint256 length = ownedLots[msg.sender].length;
		ownedLots[msg.sender].push(numLots);
		ownedLotsIndex[msg.sender][numLots] = length;
		if (aotoken.transfer(msg.sender, tokenAmount)) {
			emit BuyToken(msg.sender, numLots, tokenAmount, true);
		} else {
			emit BuyToken(msg.sender, numLots, tokenAmount, false);
		}
	}
}
