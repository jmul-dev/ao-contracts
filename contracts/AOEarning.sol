pragma solidity ^0.4.24;

import './SafeMath.sol';
import './owned.sol';
import './AOToken.sol';
import './AOTreasury.sol';
import './AOLibrary.sol';

/**
 * @title AOEarning
 *
 * This contract stores the earning from staking/hosting content on AO
 */
contract AOEarning is owned {
	using SafeMath for uint256;

	bool public paused;
	bool public killed;

	AOTreasury internal _treasury;

	uint256 constant public PERCENTAGE_DIVISOR = 10 ** 6; // 100% = 1000000

	struct PrimordialEarning {
		uint256 primordialAmount;
		uint256 primordialWeightedIndex;
	}

	// Mapping from address to network token earning of a purchase in escrow
	// Accumulated when request node buys content from host
	mapping (address => mapping(bytes32 => uint256)) public networkEarningEscrow;

	// Mapping from address to claimable network token earning
	// Accumulated when request node has verified the bought content and become a distribution node
	mapping (address => uint256) public networkEarningClaimable;

	// Mapping from address to primordial earning object at weighted index of a purchase in escrow
	// Accumulated when request node buys content from host
	mapping (address => mapping(bytes32 => PrimordialEarning)) public primordialEarningEscrow;

	// Mapping from address to claimable primordial token earning
	// Accumulated when request node has verified the bought content and become a distribution node
	mapping (address => uint256) public primordialEarningClaimable;

	// Mapping from address to his/her global primordial earning weighted index
	// Everytime a primordial earning is added for an account, we need to re-calculate the earning weighted index
	mapping (address => uint256) public primordialEarningWeightedIndex;

	// Event to be broadcasted to public when content creator/host earns network token in escrow when someone buys the content
	// recipientType:
	// 0 => Content Creator (Stake Owner)
	// 1 => Node Host
	event BuyContentNetworkEarningEscrow(address indexed recipient, bytes32 purchaseId, bytes32 contentHostId, bytes32 stakeId, uint256 networkPrice, uint256 recipientProfitPercentage, uint256 networkEarningAmount, uint8 recipientType);

	// Event to be broadcasted to public when content creator/host earns primordial token in escrow when someone buys the content
	// recipientType:
	// 0 => Content Creator (Stake Owner)
	// 1 => Node Host
	event BuyContentPrimordialEarningEscrow(address indexed recipient, bytes32 purchaseId, bytes32 contentHostId, bytes32 stakeId, uint256 primordialPrice, uint256 primordialWeightedIndex, uint256 recipientProfitPercentage, uint256 primordialEarningAmount, uint8 recipientType);

	// Event to be broadcasted to public when `buyer` buys a content
	event BuyContent(address indexed buyer, bytes32 indexed purchaseId, bytes32 indexed contentHostId, uint256 paidNetworkAmount, uint256 paidPrimordialAmount, uint256 paidPrimordialWeightedIndex, uint256 createdOnTimestamp);

	// Event to be broadcasted to public when content creator/host earned network token is claimmable
	// recipientType:
	// 0 => Content Creator (Stake Owner)
	// 1 => Node Host
	event BuyContentNetworkEarningClaimable(address indexed recipient, bytes32 purchaseId, uint256 claimableNetworkAmount, uint8 recipientType);

	// Event to be broadcasted to public when content creator/host earned primordial token is claimmable
	// recipientType:
	// 0 => Content Creator (Stake Owner)
	// 1 => Node Host
	event BuyContentPrimordialEarningClaimable(address indexed recipient, bytes32 purchaseId, uint256 claimablePrimordialAmount, uint256 claimablePrimordialWeightedIndex, uint8 recipientType);

	// Event to be broadcasted to public when address claims the network earning
	event ClaimNetworkEarning(address indexed account, uint256 amount);

	// Event to be broadcasted to public when address claims the primordial earning
	event ClaimPrimordialEarning(address indexed account, uint256 amount, uint256 weightedIndex);

	// Event to be broadcasted to public when emergency mode is triggered
	event EscapeHatch();

	/**
	 * @dev Constructor function
	 * @param _treasuryAddress The address of AOTreasury
	 */
	constructor(address _treasuryAddress) public {
		_treasury = AOTreasury(_treasuryAddress);
	}

	/**
	 * @dev Checks if contract is currently active
	 */
	modifier isActive {
		require (paused == false && killed == false);
		_;
	}

	/***** OWNER ONLY METHODS *****/
	/**
	 * @dev Owner pauses/unpauses contract
	 * @param _paused Either to pause contract or not
	 */
	function setPaused(bool _paused) public onlyOwner {
		paused = _paused;
	}

	/**
	 * @dev Owner triggers emergency mode.
	 *
	 * Allow stake owners to withdraw all existing active staked funds
	 */
	function escapeHatch() public onlyOwner {
		require (killed == false);
		killed = true;
		emit EscapeHatch();
	}

	/***** PUBLIC METHODS *****/

	/**
	 * @dev Calculate the content creator/host network earning when request node buys the content
	 * @param _purchaseId The ID of the purchase receipt object
	 * @param _stakeId The ID of the staked content object
	 * @param _contentHostId The ID of the content host object
	 * @param _price The network price of the content
	 * @param _profitPercentage The content creator's profit percentage
	 * @param _stakeOwner The address of the stake owner
	 * @param _host The address of the host
	 */
	function calculateNetworkEarning(bytes32 _purchaseId, bytes32 _stakeId, bytes32 _contentHostId, uint256 _price, uint256 _profitPercentage, address _stakeOwner, address _host) public isActive inWhitelist(msg.sender) {
		// Store how much the content creator earns in escrow
		uint256 _contentCreatorProfit = (_price.mul(_profitPercentage)).div(PERCENTAGE_DIVISOR);
		networkEarningEscrow[_stakeOwner][_purchaseId] = _contentCreatorProfit;
		emit BuyContentNetworkEarningEscrow(_stakeOwner, _purchaseId, _contentHostId, _stakeId, _price, _profitPercentage, _contentCreatorProfit, 0);

		// Store how much the node host earns
		networkEarningEscrow[_host][_purchaseId] = _price.sub(_contentCreatorProfit);
		emit BuyContentNetworkEarningEscrow(_host, _purchaseId, _contentHostId, _stakeId, _price, PERCENTAGE_DIVISOR.sub(_profitPercentage), _price.sub(_contentCreatorProfit), 1);
	}

	/**
	 * @dev Calculate the content creator/host primordial earning when request node buys the content
	 * @param _purchaseId The ID of the purchase receipt object
	 * @param _stakeId The ID of the staked content object
	 * @param _contentHostId The ID of the content host object
	 * @param _primordialPrice The primordial price of the content
	 * @param _primordialWeightedIndex The primordial token weighted index of the content
	 * @param _profitPercentage The content creator's profit percentage
	 * @param _stakeOwner The address of the stake owner
	 * @param _host The address of the host
	 */
	function calculatePrimordialEarning(bytes32 _purchaseId, bytes32 _stakeId, bytes32 _contentHostId, uint256 _primordialPrice, uint256 _primordialWeightedIndex, uint256 _profitPercentage, address _stakeOwner, address _host) public isActive inWhitelist(msg.sender) {
		PrimordialEarning storage _stakeOwnerPrimordialEarning = primordialEarningEscrow[_stakeOwner][_purchaseId];

		// Store how much the content creator earns in escrow
		uint256 _contentCreatorProfit = (_primordialPrice.mul(_profitPercentage)).div(PERCENTAGE_DIVISOR);
		_stakeOwnerPrimordialEarning.primordialAmount = _contentCreatorProfit;
		_stakeOwnerPrimordialEarning.primordialWeightedIndex = _primordialWeightedIndex;
		emit BuyContentPrimordialEarningEscrow(_stakeOwner, _purchaseId, _contentHostId, _stakeId, _primordialPrice, _primordialWeightedIndex, _profitPercentage, _contentCreatorProfit, 0);

		// Store how much the node host earns
		PrimordialEarning storage _hostPrimordialEarning = primordialEarningEscrow[_host][_purchaseId];
		_hostPrimordialEarning.primordialAmount = _primordialPrice.sub(_contentCreatorProfit);
		_hostPrimordialEarning.primordialWeightedIndex = _primordialWeightedIndex;
		emit BuyContentPrimordialEarningEscrow(_host, _purchaseId, _contentHostId, _stakeId, _primordialPrice, _primordialWeightedIndex, PERCENTAGE_DIVISOR.sub(_profitPercentage), _hostPrimordialEarning.primordialAmount, 1);
	}

	/**
	 * @dev Release the earning that is in escrow for specific purchase ID
	 * @param _purchaseId The purchase receipt ID to check
	 * @param _stakeOwner The address of the stake owner
	 * @param _host The address of the node that host the file
	 */
	function releaseEarning(bytes32 _purchaseId, address _stakeOwner, address _host) public isActive inWhitelist(msg.sender) {
		// Release the network earning in escrow for stake owner
		uint256 _networkEarning = networkEarningEscrow[_stakeOwner][_purchaseId];
		networkEarningEscrow[_stakeOwner][_purchaseId] = 0;
		networkEarningClaimable[_stakeOwner] = networkEarningClaimable[_stakeOwner].add(_networkEarning);
		emit BuyContentNetworkEarningClaimable(_stakeOwner, _purchaseId, _networkEarning, 0);

		// Release the primordial earning in escrow for stake owner
		PrimordialEarning storage _primordialEarning = primordialEarningEscrow[_stakeOwner][_purchaseId];
		uint256 _primordialAmount = _primordialEarning.primordialAmount;
		uint256 _primordialWeightedIndex = _primordialEarning.primordialWeightedIndex;
		_primordialEarning.primordialAmount = 0;
		_primordialEarning.primordialWeightedIndex = 0;

		// Update primordial weighted index
		primordialEarningWeightedIndex[_stakeOwner] = AOLibrary.calculateWeightedIndex(primordialEarningWeightedIndex[_stakeOwner], primordialEarningClaimable[_stakeOwner], _primordialWeightedIndex, _primordialAmount);
		// Update the primordial balance
		primordialEarningClaimable[_stakeOwner] = primordialEarningClaimable[_stakeOwner].add(_primordialAmount);
		emit BuyContentPrimordialEarningClaimable(_stakeOwner, _purchaseId, _primordialAmount, _primordialWeightedIndex, 0);

		// Release the network earning in escrow for host
		_networkEarning = networkEarningEscrow[_host][_purchaseId];
		networkEarningEscrow[_host][_purchaseId] = 0;
		networkEarningClaimable[_host] = networkEarningClaimable[_host].add(_networkEarning);
		emit BuyContentNetworkEarningClaimable(_host, _purchaseId, _networkEarning, 1);

		// Release the primordial earning in escrow for host
		_primordialEarning = primordialEarningEscrow[_host][_purchaseId];
		_primordialAmount = _primordialEarning.primordialAmount;
		_primordialWeightedIndex = _primordialEarning.primordialWeightedIndex;
		_primordialEarning.primordialAmount = 0;
		_primordialEarning.primordialWeightedIndex = 0;

		// Update primordial weighted index
		primordialEarningWeightedIndex[_host] = AOLibrary.calculateWeightedIndex(primordialEarningWeightedIndex[_host], primordialEarningClaimable[_host], _primordialWeightedIndex, _primordialAmount);
		// Update the primordial balance
		primordialEarningClaimable[_host] = primordialEarningClaimable[_host].add(_primordialAmount);
		emit BuyContentPrimordialEarningClaimable(_host, _purchaseId, _primordialAmount, _primordialWeightedIndex, 1);
	}

	/**
	 * @dev Account withdraws the claimable network earning
	 */
	function withdrawNetworkEarning() public {
		// Make sure there is balance to withdraw
		require (networkEarningClaimable[msg.sender] > 0);
		require (_treasury.totalNetworkBalanceOf(address(this)) >= networkEarningClaimable[msg.sender]);

		uint256 _networkEarning = networkEarningClaimable[msg.sender];
		networkEarningClaimable[msg.sender] = 0;
		(address[] memory _paymentAddress, uint256[] memory _paymentAmount) = _treasury.determinePayment(address(this), _networkEarning);

		// Stake tokens from each denomination in payment address
		for (uint256 i=0; i < _paymentAddress.length; i++) {
			if (_paymentAddress[i] != address(0) && _paymentAmount[i] > 0) {
				require (AOToken(_paymentAddress[i]).transfer(msg.sender, _paymentAmount[i]));
			}
		}
		emit ClaimNetworkEarning(msg.sender, _networkEarning);
	}

	/**
	 * @dev Account withdraws the claimable primordial earning
	 */
	function withdrawPrimordialEarning() public {
		// Make sure there is balance to withdraw
		require (primordialEarningClaimable[msg.sender] > 0);
		require (primordialEarningWeightedIndex[msg.sender] > 0);

		uint256 _primordialEarning = primordialEarningClaimable[msg.sender];
		uint256 _primordialWeightedIndex = primordialEarningWeightedIndex[msg.sender];
		primordialEarningClaimable[msg.sender] = 0;
		primordialEarningWeightedIndex[msg.sender] = 0;

		(, address _baseDenominationAddress, bool _baseDenominationActive) = _treasury.getBaseDenomination();
		require (_baseDenominationAddress != address(0));
		require (_baseDenominationActive == true);
		require (AOToken(_baseDenominationAddress).whitelistTransferIcoTokenAtWeightedIndex(msg.sender, _primordialEarning, _primordialWeightedIndex));
		emit ClaimPrimordialEarning(msg.sender, _primordialEarning, _primordialWeightedIndex);
	}
}
