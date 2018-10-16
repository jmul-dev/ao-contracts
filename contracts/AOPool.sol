pragma solidity ^0.4.24;

import './SafeMath.sol';
import './developed.sol';
import './TokenERC20.sol';
import './AOToken.sol';

/**
 * @title AOPool
 *
 * This contract acts as the exchange between AO and ETH/ERC-20 compatible tokens
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
		bytes32 lotId;						// The ID of this Lot
		address seller;						// Ethereum address of the seller
		uint256 lotQuantity;				// Amount of AO being added to the Pool from this Lot
		uint256 poolId;						// Identifier for the Pool this Lot is adding to
		uint256 poolPreSellSnapshot;		// Amount of contributed to the Pool prior to this Lot Number
		uint256 poolSellLotSnapshot;		// poolPreSellSnapshot + lotQuantity
		uint256 lotValueInCounterAsset;		// Amount of AO x Pool Price
		uint256 counterAssetWithdrawn;		// Amount of Counter-Asset withdrawn from this Lot
		uint256 tokenWithdrawn;				// Amount of AO withdrawn from this Lot
		uint256 timestamp;
	}

	// Contract variables
	uint256 public totalPool;
	uint256 public contractTotalLot;		// Total lot from all pools
	uint256 public contractTotalSell;		// Quantity of AO that has been contributed to all Pools
	uint256 public contractTotalBuy;		// Quantity of AO that has been bought from all Pools
	uint256 public contractTotalQuantity;	// Quantity of AO available to buy from all Pools
	uint256 public contractEthereumBalance;	// Total quantity of Ethereum in contract
	uint256 public contractTotalEthereumWithdrawn; // Total Ethereum withdrawn from selling AO in contract

	// Mapping from Pool ID to Pool
	mapping (uint256 => Pool) public pools;

	// Mapping from Lot ID to Lot
	mapping (bytes32 => Lot) public lots;

	// Mapping from Pool ID to Lots in the Pool
	mapping (uint256 => bytes32[]) public poolLots;

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

	// Mapping from Pool ID to amount of Ethereum withdrawn from selling AO
	mapping (uint256 => uint256) public poolTotalEthereumWithdrawn;

	// Mapping from an address to quantity of AO put on sale from all sell lots
	mapping (address => uint256) public totalPutOnSale;

	// Mapping from an address to quantity of AO sold and redeemed from all sell lots
	mapping (address => uint256) public totalSold;

	// Mapping from an address to quantity of AO bought from all pool
	mapping (address => uint256) public totalBought;

	// Mapping from an address to amount of Ethereum withdrawn from selling AO
	mapping (address => uint256) public totalEthereumWithdrawn;

	// Mapping from an address to its Lots
	mapping (address => bytes32[]) public ownerLots;

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

	/**
	 * Event to be broadcasted to public when a seller sells AO
	 *
	 * If erc20CounterAsset is true, the Lot is priced in an ERC20 compatible token.
	 * Otherwise, the Lot is priced in Ethereum
	 */
	event LotCreation(uint256 indexed poolId, bytes32 indexed lotId, address indexed seller, uint256 lotQuantity, uint256 price, uint256 poolPreSellSnapshot, uint256 poolSellLotSnapshot, uint256 lotValueInCounterAsset, bool erc20CounterAsset, uint256 timestamp);

	// Event to be broadcasted to public when a buyer buys AO
	event BuyWithEth(uint256 indexed poolId, address indexed buyer, uint256 buyQuantity, uint256 price, uint256 currentPoolTotalBuy);

	// Event to be broadcasted to public when a buyer withdraw ETH from Lot
	event WithdrawEth(address indexed seller, bytes32 indexed lotId, uint256 indexed poolId, uint256 withdrawnAmount, uint256 currentLotValueInCounterAsset, uint256 currentLotCounterAssetWithdrawn);

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

	/***** Public Methods *****/
	/**
	 * @dev Seller sells AO in Pool `_poolId` - create a Lot to be added to a Pool for a seller.
	 * @param _poolId The ID of the Pool
	 * @param _quantity The amount of AO to be sold
	 * @param _price The price supplied by seller
	 */
	function sell(uint256 _poolId, uint256 _quantity, uint256 _price) public {
		Pool memory _pool = pools[_poolId];
		require (_pool.status == true && _pool.price == _price && _quantity > 0 && _quantity <= _baseAO.balanceOf(msg.sender));

		// If there is a sell cap
		if (_pool.sellCapStatus == true) {
			require (poolTotalSell[_poolId].add(_quantity) <= _pool.sellCapAmount);
		}

		// If there is a quantity cap
		if (_pool.quantityCapStatus == true) {
			require (poolTotalQuantity[_poolId].add(_quantity) <= _pool.quantityCapAmount);
		}

		// Create Lot for this sell transaction
		contractTotalLot++;

		// Generate Lot ID
		bytes32 _lotId = keccak256(abi.encodePacked(this, msg.sender, contractTotalLot));

		Lot storage _lot = lots[_lotId];
		_lot.lotId = _lotId;
		_lot.seller = msg.sender;
		_lot.lotQuantity = _quantity;
		_lot.poolId = _poolId;
		_lot.poolPreSellSnapshot = poolTotalSell[_poolId];
		_lot.poolSellLotSnapshot = poolTotalSell[_poolId].add(_quantity);
		_lot.lotValueInCounterAsset = _quantity.mul(_pool.price);
		_lot.timestamp = now;
		poolLots[_poolId].push(_lotId);
		ownerLots[msg.sender].push(_lotId);

		// Update contract variables
		poolTotalQuantity[_poolId] = poolTotalQuantity[_poolId].add(_quantity);
		poolTotalSell[_poolId] = poolTotalSell[_poolId].add(_quantity);
		totalPutOnSale[msg.sender] = totalPutOnSale[msg.sender].add(_quantity);
		contractTotalQuantity = contractTotalQuantity.add(_quantity);
		contractTotalSell = contractTotalSell.add(_quantity);

		emit LotCreation(_lot.poolId, _lot.lotId, _lot.seller, _lot.lotQuantity, _pool.price, _lot.poolPreSellSnapshot, _lot.poolSellLotSnapshot, _lot.lotValueInCounterAsset, _pool.erc20CounterAsset, _lot.timestamp);
	}

	/**
	 * @dev Buyer buys AO from Pool `_poolId` with Ethereum
	 * @param _poolId The ID of the Pool
	 * @param _quantity The amount of AO to be bought
	 * @param _price The price supplied by buyer
	 */
	function buyWithEth(uint256 _poolId, uint256 _quantity, uint256 _price) public payable {
		Pool memory _pool = pools[_poolId];
		require (_pool.status == true && _pool.price == _price && _pool.erc20CounterAsset == false);
		require (_quantity > 0 && _quantity <= poolTotalQuantity[_poolId]);
		require (msg.value > 0 && msg.value.div(_pool.price) == _quantity);

		// Update contract variables
		poolTotalQuantity[_poolId] = poolTotalQuantity[_poolId].sub(_quantity);
		poolTotalBuy[_poolId] = poolTotalBuy[_poolId].add(_quantity);
		poolEthereumBalance[_poolId] = poolEthereumBalance[_poolId].add(msg.value);

		contractTotalQuantity = contractTotalQuantity.sub(_quantity);
		contractTotalBuy = contractTotalBuy.add(_quantity);
		contractEthereumBalance = contractEthereumBalance.add(msg.value);

		totalBought[msg.sender] = totalBought[msg.sender].add(_quantity);

		require (_baseAO.mintToken(msg.sender, _quantity));
		emit BuyWithEth(_poolId, msg.sender, _quantity, _price, poolTotalBuy[_poolId]);
	}

	/**
	 * @dev Seller withdraw Ethereum from Lot `_lotId`
	 * @param _lotId The ID of the Lot
	 */
	function withdrawEth(bytes32 _lotId) public {
		Lot storage _lot = lots[_lotId];
		require (_lot.seller == msg.sender && _lot.lotValueInCounterAsset > 0);
		require (poolTotalBuy[_lot.poolId] > _lot.poolPreSellSnapshot);

		(uint256 soldQuantity, uint256 ethAvailableToWithdraw,) = lotEthAvailableToWithdraw(_lotId);

		require (ethAvailableToWithdraw > 0 && ethAvailableToWithdraw <= _lot.lotValueInCounterAsset && ethAvailableToWithdraw <= poolEthereumBalance[_lot.poolId] && ethAvailableToWithdraw <= contractEthereumBalance);

		// Update lot variables
		_lot.counterAssetWithdrawn = _lot.counterAssetWithdrawn.add(ethAvailableToWithdraw);
		_lot.lotValueInCounterAsset = _lot.lotValueInCounterAsset.sub(ethAvailableToWithdraw);

		// Update contract variables
		poolEthereumBalance[_lot.poolId] = poolEthereumBalance[_lot.poolId].sub(ethAvailableToWithdraw);
		poolTotalEthereumWithdrawn[_lot.poolId] = poolTotalEthereumWithdrawn[_lot.poolId].add(ethAvailableToWithdraw);
		contractEthereumBalance = contractEthereumBalance.sub(ethAvailableToWithdraw);
		contractTotalEthereumWithdrawn = contractTotalEthereumWithdrawn.add(ethAvailableToWithdraw);

		totalSold[msg.sender] = totalSold[msg.sender].add(soldQuantity);
		totalEthereumWithdrawn[msg.sender] = totalEthereumWithdrawn[msg.sender].add(ethAvailableToWithdraw);

		// Send eth to seller
		_lot.seller.transfer(ethAvailableToWithdraw);

		emit WithdrawEth(_lot.seller, _lot.lotId, _lot.poolId, ethAvailableToWithdraw, _lot.lotValueInCounterAsset, _lot.counterAssetWithdrawn);
	}

	/**
	 * @dev Seller gets Lot `_lotId` (priced in ETH) available to withdraw info
	 * @param _lotId The ID of the Lot
	 * @return The amount of token sold
	 * @return Ethereum available to withdraw from the Lot
	 * @return Current Ethereum withdrawn from the Lot
	 */
	function lotEthAvailableToWithdraw(bytes32 _lotId) public view returns (uint256, uint256, uint256) {
		Lot memory _lot = lots[_lotId];
		require (_lot.seller != address(0));

		Pool memory _pool = pools[_lot.poolId];
		require (_pool.erc20CounterAsset == false);

		uint256 soldQuantity = 0;
		uint256 ethAvailableToWithdraw = 0;
		if (poolTotalBuy[_lot.poolId] > _lot.poolPreSellSnapshot) {
			soldQuantity = (poolTotalBuy[_lot.poolId] >= _lot.poolSellLotSnapshot) ? _lot.lotQuantity : poolTotalBuy[_lot.poolId].sub(_lot.poolPreSellSnapshot);
			uint256 ethOwedToLot = soldQuantity.mul(_pool.price).sub(_lot.tokenWithdrawn.mul(_pool.price));
			ethAvailableToWithdraw = ethOwedToLot.sub(_lot.counterAssetWithdrawn);
		}
		return (soldQuantity, ethAvailableToWithdraw, _lot.counterAssetWithdrawn);
	}
}
