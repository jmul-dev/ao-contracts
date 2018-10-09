pragma solidity ^0.4.24;

import './SafeMath.sol';
import './developed.sol';
import './TokenERC20.sol';
import './AOToken.sol';

/**
 * @title AOPool
 */
contract AOPool is developed {
	using SafeMath for uint256;

	address public baseDenominationAddress;
	AOToken internal _baseAO;

	struct Pool {
		uint256 price;	// Flat price of AO

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
		/**
		 * Used if ERC20 token needs to deviate from Ethereum in multiplication/division
		 */
		uint256 erc20TokenMultiplier;

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

	// Mapping from Pool ID to total Lot in the Pool
	mapping (uint256 => uint256) public poolTotalLot;

	// Mapping from Pool ID to quantity of AO available to buy at `price`
	mapping (uint256 => uint256) public poolTotalQuantity;

	// Mapping from Pool ID to quantity of AO that has been contributed to the Pool
	mapping (uint256 => uint256) public poolTotalSell;

	// Mapping from Pool ID to quantity of AO that has been bought from the Pool
	mapping (uint256 => uint256) public poolTotalBuy;

	// Mapping from Pool ID to quantity of Ethereum available to withdraw
	mapping (uint256 => uint256) public poolEthereumBalance;

	// Mapping from Pool ID to quantity of ERC20 token available to withdraw
	mapping (uint256 => uint256) public poolERC20TokenBalance;

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
	constructor(address _baseDenominationAddress) public {
		baseDenominationAddress = _baseDenominationAddress;
		_baseAO = AOToken(_baseDenominationAddress);
	}

	// Event to be broadcasted to public when Pool is created
	event CreatePool(uint256 indexed poolId, address indexed adminAddress, uint256 price, bool status, bool sellCapStatus, uint256 sellCapAmount, bool quantityCapStatus, uint256 quantityCapAmount, bool erc20CounterAsset, address erc20TokenAddress, uint256 erc20TokenMultiplier);

	// Event to be broadcasted to public when Pool's status is updated
	// If status == true, start Pool
	// Otherwise, stop Pool
	event UpdatePoolStatus(uint256 indexed poolId, bool status);

	// Event to be broadcasted to public when Pool's admin address is changed
	event ChangeAdminAddress(uint256 indexed poolId, address newAdminAddress);

	/***** Developer Only Methods *****/
	/**
	 * @dev DAO creates a Pool
	 * @param _price The flat price of AO
	 * @param _status The status of the Pool
	 *					true = Pool is live and can be sold into
	 *					false = Pool cannot be sold into
	 * @param _sellCapStatus Whether or not the Pool has sell cap
	 *					true = has sell cap
	 *					false = no sell cap
	 * @param _sellCapAmount Cap for the amount of AO that can be put up for sale in this Pool at `_price`
	 * @param _quantityCapStatus Whether or not the Pool has quantity cap
	 *					true = has quantity cap
	 *					false = no quantity cap
	 * @param _quantityCapAmount Cap for the amount of AO at any given time that can be available for sale in this Pool
	 * @param _erc20CounterAsset Type of the Counter-Asset
	 *					true = Pool is priced in ERC20 compatible Token
	 *					false = Pool is priced in Ethereum
	 * @param _erc20TokenAddress The address of the ERC20 Token
	 * @param _erc20TokenMultiplier Used if ERC20 Token needs to deviate from Ethereum in multiplication/division
	 */
	function createPool(
		uint256 _price,
		bool _status,
		bool _sellCapStatus,
		uint256 _sellCapAmount,
		bool _quantityCapStatus,
		uint256 _quantityCapAmount,
		bool _erc20CounterAsset,
		address _erc20TokenAddress,
		uint256 _erc20TokenMultiplier) public onlyDeveloper {
		require (_price > 0);
		// Make sure sell cap amount is provided if sell cap is enabled
		if (_sellCapStatus == true) {
			require (_sellCapAmount > 0);
		}
		// Make sure quantity cap amount is provided if quantity cap is enabled
		if (_quantityCapStatus == true) {
			require (_quantityCapAmount > 0);
		}
		// Make sure the ERC20 token address and multiplier are provided
		// if this Pool is priced in ERC20 compatible Token
		if (_erc20CounterAsset == true) {
			require (_erc20TokenAddress != address(0) && bytes(TokenERC20(_erc20TokenAddress).name()).length > 0);
			require (_erc20TokenMultiplier > 0);
		}

		totalPool++;
		Pool storage _pool = pools[totalPool];
		_pool.price = _price;
		_pool.status = _status;
		_pool.sellCapStatus = _sellCapStatus;
		if (_sellCapStatus) {
			_pool.sellCapAmount = _sellCapAmount;
		}
		_pool.quantityCapStatus = _quantityCapStatus;
		if (_quantityCapStatus) {
			_pool.quantityCapAmount = _quantityCapAmount;
		}
		_pool.erc20CounterAsset = _erc20CounterAsset;
		if (_erc20CounterAsset) {
			_pool.erc20TokenAddress = _erc20TokenAddress;
			_pool.erc20TokenMultiplier = _erc20TokenMultiplier;
		}
		_pool.adminAddress = msg.sender;

		emit CreatePool(totalPool, _pool.adminAddress, _pool.price, _pool.status, _pool.sellCapStatus, _pool.sellCapAmount, _pool.quantityCapStatus, _pool.quantityCapAmount, _pool.erc20CounterAsset, _pool.erc20TokenAddress, _pool.erc20TokenMultiplier);
	}

	/***** Pool's Admin Only Methods *****/
	/**
	 * @dev Start/Stop a Pool
	 * @param _poolId The ID of the Pool
	 * @param _status The status to set. true = start. false = stop
	 */
	function updatePoolStatus(uint256 _poolId, bool _status) public {
		require (pools[_poolId].price > 0 && pools[_poolId].adminAddress == msg.sender);
		pools[_poolId].status = _status;
		emit UpdatePoolStatus(_poolId, _status);
	}

	/**
	 * @dev Change Admin Address
	 * @param _poolId The ID of the Pool
	 * @param _adminAddress The new admin address to set
	 */
	function changeAdminAddress(uint256 _poolId, address _adminAddress) public {
		require (pools[_poolId].price > 0 && (pools[_poolId].adminAddress == msg.sender || developer == msg.sender));
		require (_adminAddress != address(0));
		pools[_poolId].adminAddress = _adminAddress;
		emit ChangeAdminAddress(_poolId, _adminAddress);
	}
}
