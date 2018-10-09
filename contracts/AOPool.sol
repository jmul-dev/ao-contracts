pragma solidity ^0.4.24;

import './SafeMath.sol';
import './developed.sol';

/**
 * @title AOPool
 */
contract AOPool is developed {
	using SafeMath for uint256;

	struct Pool {
		uint256 totalLot;					// Total lot in this pool
		uint256 totalQuantity;				// Quantity of AO available to buy at `price`
		uint256 price;						// Flat price of AO
		uint256 totalSell;					// Total quantity of AO that has been contributed to this pool
		uint256 totalBuy;					// Quantity of AO that has been bought from this pool
		uint256 ethereumBalance;			// Quantity of Ethereum available to withdraw

		/**
		 * If true, Pool is live and can be sold into.
		 * Otherwise, Pool cannot be sold into.
		 */
		bool status;

		/**
		 * If true, has sell cap. Otherwise, no sell cap.
		 */
		bool sellCapStatus;
		/**
		 * Denominated in AO, creates a cap for the amount of AO that can be
		 * put up for sale in this pool at `price`
		 */
		uint256 sellCapAmount;

		/**
		 * If true, has quantity cap. Otherwise, no quantity cap.
		 */
		bool quantityCapStatus;
		/**
		 * Denominated in AO, creates a cap for the amount of AO at any given time
		 * that can be available for sale in this pool
		 */
		uint256 quantityCapAmount;

		/**
		 * If true, the Pool is priced in an ERC20 compatible token.
		 * Otherwise, the Pool is priced in Ethereum
		 */
		bool erc20CounterAsset;
		address erc20TokenAddress;			// The address of the ERC20 Token
		uint256 erc20TokenBalance;			// Quantity of ERC20 token available to withdraw

		/**
		 * Used if ERC20 token needs to deviate from Ethereum in multiplication/division
		 */
		uint256 counterAssetMultiplier;

		address adminAddress;				// defaults to DAO address, but can be modified
	}

	struct Lot {
		address seller;						// Ethereum address of the seller
		uint256 lotQuantity;				// Amount of AO being added to the Pool from this Lot
		uint256 poolId;						// Identifier for the Pool this Lot is adding to
		uint256 poolPreSellSnapshot;		// Amount of contributed to the Pool prior to this Lot Number
		uint256 poolSellLotSnapshot;		// poolPreSellSnapshot + lotQuantity
		uint256 lotValueInCounterAsset;		// Amount of AO x Pool Price
		uint256 counterAssetWithdrawn;		// Amount of Counter-Asset withdrawn from this Lot
		uint256 aoWithdrawn;				// Amount of AO withdrawn from this Lot
		uint256 timestamp;
	}

	// Contract variables
	uint256 public totalPool;
	uint256 public contractTotalLot;		// Total lot from all pools

	uint256 public contractTotalSell;		// Quantity of AO that has been contributed to all Pools
	uint256 public contractTotalBuy;		// Quantity of AO that has been bought from all Pools
	uint256 public contractTotalQuantity;	// Quantity of AO available to buy from all Pools
	uint256 public contractEthereumBalance;	// Total quantity of Ethereum in contract

	// Mapping from Pool ID to Pool
	mapping (uint256 => Pool) public pools;

	// Mapping from Lot ID to Lot
	mapping (uint256 => Lot) public lots;

	// Mapping from an address to quantity of AO put on sale from all sell lots
	mapping (address => uint256) public totalPutOnSale;

	// Mapping from an address to quantity of AO sold and redeemed from all sell lots
	mapping (address => uint256) public totalSold;

	// Mapping from an address to quantity of AO bought from all pool
	mapping (address => uint256) public totalBought;

	// Mapping from an address to amount of Ethereum withdrawn from selling AO
	mapping (address => uint256) public totalEthereumWithdrawn;

	/**
	 * @dev Constructor function
	 */
	constructor () public {}


}
