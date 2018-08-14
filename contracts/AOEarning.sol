pragma solidity ^0.4.24;

import './SafeMath.sol';
import './owned.sol';
import './AOToken.sol';
import './AOTreasury.sol';

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

	uint256 public inflationRate; // support up to 4 decimals, i.e 12.3456% = 123456
	uint256 public foundationCut; // support up to 4 decimals, i.e 12.3456% = 123456
	uint256 public multiplierModifier; // support up to 2 decimals, 100 = 1
	uint256 constant public PERCENTAGE_DIVISOR = 10 ** 6; // 100% = 1000000
	uint256 constant public WEIGHTED_INDEX_DIVISOR = 10 ** 6; // 1000000 = 1

	// Mapping from address to network token earning of a purchase in escrow
	// Accumulated when request node buys content from host
	mapping (address => mapping(bytes32 => uint256)) public networkEarningEscrow;

	// Mapping from address to claimable network token earning
	// Accumulated when request node has verified the bought content and become a distribution node
	mapping (address => uint256) public networkEarningClaimable;

	// Mapping from address to inflation bonus (network token) of a purchase in escrow
	// Accumulated when request node buys content from host
	mapping (address => mapping(bytes32 => uint256)) public inflationBonusEscrow;

	// Mapping from address to claimable inflation bonus (network token)
	// Accumulated when request node has verified the bought content and become a distribution node
	mapping (address => uint256) public inflationBonusClaimable;

	// Event to be broadcasted to public when content creator/host earns network token in escrow when someone buys the content
	// recipientType:
	// 0 => Content Creator (Stake Owner)
	// 1 => Node Host
	event BuyContentNetworkEarningEscrow(address indexed recipient, bytes32 purchaseId, bytes32 contentHostId, bytes32 stakeId, uint256 networkPrice, uint256 recipientProfitPercentage, uint256 networkEarningAmount, uint8 recipientType);

	// Event to be broadcasted to public when content creator/host earned network token is claimmable
	// recipientType:
	// 0 => Content Creator (Stake Owner)
	// 1 => Node Host
	event BuyContentNetworkEarningClaimable(address indexed recipient, bytes32 purchaseId, uint256 claimableNetworkAmount, uint8 recipientType);

	// Event to be broadcasted to public when content creator/host earns inflation bonus network token in escrow when someone buys the content
	// recipientType:
	// 0 => Content Creator (Stake Owner)
	// 1 => Node Host
	// 2 => Foundation
	event BuyContentInflationBonusEscrow(address indexed recipient, bytes32 purchaseId, bytes32 contentHostId, bytes32 stakeId, uint256 recipientProfitPercentage, uint256 inflationBonusAmount, uint8 recipientType);

	// Event to be broadcasted to public when content creator/host earned inflation bonus network token is claimmable
	// recipientType:
	// 0 => Content Creator (Stake Owner)
	// 1 => Node Host
	// 2 => Foundation
	event BuyContentInflationBonusClaimable(address indexed recipient, bytes32 purchaseId, uint256 claimableNetworkAmount, uint8 recipientType);

	// Event to be broadcasted to public when address claims the network earning from buy content and inflationBonus
	event ClaimEarning(address indexed account, uint256 networkEarningAmount, uint256 inflationBonusAmount);

	// Event to be broadcasted to public when emergency mode is triggered
	event EscapeHatch();

	/**
	 * @dev Constructor function
	 * @param _treasuryAddress The address of AOTreasury
	 */
	constructor(address _treasuryAddress) public {
		_treasury = AOTreasury(_treasuryAddress);
		setMultiplierModifier(1000000); // multiplierModifier = 1
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
	 * @dev Sets inflation rate
	 * @param _inflationRate The new inflation rate value to be set
	 */
	function setInflationRate(uint256 _inflationRate) public inWhitelist(msg.sender) {
		inflationRate = _inflationRate;
	}

	/**
	 * @dev Sets foundation cut
	 * @param _foundationCut The new foundation cut value to be set
	 */
	function setFoundationCut(uint256 _foundationCut) public inWhitelist(msg.sender) {
		require (_foundationCut <= PERCENTAGE_DIVISOR);
		foundationCut = _foundationCut;
	}

	/**
	 * @dev Sets multiplier modifier
	 * @param _multiplierModifier The new multiplier modifier value to be set (in 6 decimals)
	 *			so 1000000 = 1
	 */
	function setMultiplierModifier(uint256 _multiplierModifier) public inWhitelist(msg.sender) {
		multiplierModifier = _multiplierModifier;
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
	 * @param _networkAmountStaked The amount of network tokens at stake
	 * @param _primordialAmountStaked The amount of primordial tokens at stake
	 * @param _primordialWeightedIndexStaked The weighted index of primordial tokens at stake
	 * @param _profitPercentage The content creator's profit percentage
	 * @param _stakeOwner The address of the stake owner
	 * @param _host The address of the host
	 */
	function calculateNetworkEarning(
		bytes32 _purchaseId,
		bytes32 _stakeId,
		bytes32 _contentHostId,
		uint256 _networkAmountStaked,
		uint256 _primordialAmountStaked,
		uint256 _primordialWeightedIndexStaked,
		uint256 _profitPercentage,
		address _stakeOwner,
		address _host) public isActive inWhitelist(msg.sender) {
		uint256 _totalStaked = _networkAmountStaked.add(_primordialAmountStaked);
		// Store how much the content creator (stake owner) earns in escrow
		uint256 _stakeOwnerProfit = (_totalStaked.mul(_profitPercentage)).div(PERCENTAGE_DIVISOR);
		networkEarningEscrow[_stakeOwner][_purchaseId] = _stakeOwnerProfit;
		emit BuyContentNetworkEarningEscrow(_stakeOwner, _purchaseId, _contentHostId, _stakeId, _totalStaked, _profitPercentage, _stakeOwnerProfit, 0);

		// Store how much the node host earns in escrow
		networkEarningEscrow[_host][_purchaseId] = _totalStaked.sub(_stakeOwnerProfit);
		emit BuyContentNetworkEarningEscrow(_host, _purchaseId, _contentHostId, _stakeId, _totalStaked, PERCENTAGE_DIVISOR.sub(_profitPercentage), _totalStaked.sub(_stakeOwnerProfit), 1);

		// Store the inflation bonus earning for content creator/node/foundation in escrow
		_escrowInflationBonus(_purchaseId, _stakeId, _contentHostId, _calculateInflationBonus(_networkAmountStaked, _primordialAmountStaked, _primordialWeightedIndexStaked), _profitPercentage, _stakeOwner, _host);
	}

	/**
	 * @dev Release the network earning and inflation bonus that is in escrow for specific purchase ID
	 * @param _purchaseId The purchase receipt ID to check
	 * @param _stakeOwner The address of the stake owner
	 * @param _host The address of the node that host the file
	 */
	function releaseEarning(bytes32 _purchaseId, address _stakeOwner, address _host) public isActive inWhitelist(msg.sender) {
		// Release the network earning in escrow for stake owner
		_releaseNetworkEarning(_purchaseId, _stakeOwner, 0);

		// Release the network earning in escrow for host
		_releaseNetworkEarning(_purchaseId, _host, 1);

		// Release the inflation bonus in escrow for stake owner
		_releaseInflationBonus(_purchaseId, _stakeOwner, 0);

		// Release the inflation bonus in escrow for host
		_releaseInflationBonus(_purchaseId, _host, 1);

		// Release the inflation bonus in escrow for foundation
		_releaseInflationBonus(_purchaseId, owner, 2);
	}

	/**
	 * @dev Account withdraws the claimable network earning and/or inflation bonus
	 */
	function withdrawEarning() public {
		// Make sure there is balance to withdraw
		require (networkEarningClaimable[msg.sender] > 0 || inflationBonusClaimable[msg.sender] > 0);
		require (_treasury.totalNetworkBalanceOf(address(this)) >= networkEarningClaimable[msg.sender]);

		uint256 _networkEarning = networkEarningClaimable[msg.sender];
		if (_networkEarning > 0) {
			networkEarningClaimable[msg.sender] = 0;
			(address[] memory _paymentAddress, uint256[] memory _paymentAmount) = _treasury.determinePayment(address(this), _networkEarning);

			// Stake tokens from each denomination in payment address
			for (uint256 i=0; i < _paymentAddress.length; i++) {
				if (_paymentAddress[i] != address(0) && _paymentAmount[i] > 0) {
					require (AOToken(_paymentAddress[i]).transfer(msg.sender, _paymentAmount[i]));
				}
			}
		}

		uint256 _inflationBonusAmount = inflationBonusClaimable[msg.sender];
		if (_inflationBonusAmount > 0) {
			(, address _baseDenominationAddress, bool _baseDenominationActive) = _treasury.getBaseDenomination();
			require (_baseDenominationAddress != address(0));
			require (_baseDenominationActive == true);
			inflationBonusClaimable[msg.sender] = 0;
			require (AOToken(_baseDenominationAddress).mintToken(msg.sender, _inflationBonusAmount));
		}
		emit ClaimEarning(msg.sender, _networkEarning, _inflationBonusAmount);
	}

	/***** INTERNAL METHODS *****/
	/**
	 * @dev Calculate the inflation bonus amount
	 * @param _networkAmountStaked The amount of network tokens at stake
	 * @param _primordialAmountStaked The amount of primordial tokens at stake
	 * @param _primordialWeightedIndexStaked The weighted index of primordial tokens at stake
	 * @return the bonus network amount
	 */
	function _calculateInflationBonus(uint256 _networkAmountStaked, uint256 _primordialAmountStaked, uint256 _primordialWeightedIndexStaked) internal view returns (uint256) {
		uint256 _networkBonus = _networkAmountStaked.mul(inflationRate).div(PERCENTAGE_DIVISOR);
		uint256 _multiplier = _calculateMultiplier(_primordialWeightedIndexStaked);
		uint256 _primordialBonus = _primordialAmountStaked.mul(_multiplier).div(WEIGHTED_INDEX_DIVISOR).mul(inflationRate).div(PERCENTAGE_DIVISOR);
		return _networkBonus.add(_primordialBonus);
	}

	/**
	 * @dev Given a weighted index, we want to calculate the multiplier
	 * @param _weightedIndex The weighted index of the primordial token
	 * @return multiplier in 6 decimals
	 */
	function _calculateMultiplier(uint256 _weightedIndex) internal view returns (uint256) {
		/**
		 * Multiplier = 1 + (multiplierModifier * ((lastWeightedIndex - weightedIndex)/lastWeightedIndex))
		 *
		 * Since we are calculating in decimals, so 1 is actually 1000000 or WEIGHTED_INDEX_DIVISOR
		 * Multiplier = WEIGHTED_INDEX_DIVISOR + (multiplierModifier * ((lastWeightedIndex - weightedIndex)/lastWeightedIndex))
		 * Let temp = (lastWeightedIndex - weightedIndex)/lastWeightedIndex
		 * To account for decimal points,
		 * temp = ((lastWeightedIndex - weightedIndex) * WEIGHTED_INDEX_DIVISOR)/lastWeightedIndex
		 * We need to divide temp with WEIGHTED_INDEX_DIVISOR later
		 * Multiplier = WEIGHTED_INDEX_DIVISOR + ((multiplierModifier * temp) / WEIGHTED_INDEX_DIVISOR)
		 */
		(, address _baseDenominationAddress, bool _baseDenominationActive) = _treasury.getBaseDenomination();
		require (_baseDenominationAddress != address(0));
		require (_baseDenominationActive == true);
		uint256 _lastWeightedIndex = AOToken(_baseDenominationAddress).lotIndex().mul(WEIGHTED_INDEX_DIVISOR);
		require (_lastWeightedIndex >= _weightedIndex);
		uint256 _temp = (_lastWeightedIndex.sub(_weightedIndex)).mul(WEIGHTED_INDEX_DIVISOR).div(_lastWeightedIndex);
		return WEIGHTED_INDEX_DIVISOR.add(multiplierModifier.mul(_temp).div(WEIGHTED_INDEX_DIVISOR));
	}

	/**
	 * @dev Store inflation bonus in escrow
	 * @param _purchaseId The ID of the purchase receipt object
	 * @param _stakeId The ID of the staked content object
	 * @param _contentHostId The ID of the content host object
	 * @param _inflationBonusAmount The amount of inflation bonus earning
	 * @param _profitPercentage The content creator's profit percentage
	 * @param _stakeOwner The address of the stake owner
	 * @param _host The address of the host
	 */
	function _escrowInflationBonus(
		bytes32 _purchaseId,
		bytes32 _stakeId,
		bytes32 _contentHostId,
		uint256 _inflationBonusAmount,
		uint256 _profitPercentage,
		address _stakeOwner,
		address _host
	) internal {
		if (_inflationBonusAmount > 0) {
			// Store how much the content creator earns in escrow
			uint256 _stakeOwnerProfit = (_inflationBonusAmount.mul(_profitPercentage)).div(PERCENTAGE_DIVISOR);
			inflationBonusEscrow[_stakeOwner][_purchaseId] = _stakeOwnerProfit;

			emit BuyContentInflationBonusEscrow(_stakeOwner, _purchaseId, _contentHostId, _stakeId, _profitPercentage, _stakeOwnerProfit, 0);

			// Store how much the node host earns
			inflationBonusEscrow[_host][_purchaseId] = _inflationBonusAmount.sub(_stakeOwnerProfit);
			emit BuyContentInflationBonusEscrow(_host, _purchaseId, _contentHostId, _stakeId, PERCENTAGE_DIVISOR.sub(_profitPercentage), _inflationBonusAmount.sub(_stakeOwnerProfit), 1);

			// Store how much the foundation earns in escrow
			uint256 _foundationProfit = (_inflationBonusAmount.mul(foundationCut)).div(PERCENTAGE_DIVISOR);
			inflationBonusEscrow[owner][_purchaseId] = _foundationProfit;

			emit BuyContentInflationBonusEscrow(owner, _purchaseId, _contentHostId, _stakeId, foundationCut, _foundationProfit, 2);
		} else {
			emit BuyContentInflationBonusEscrow(_stakeOwner, _purchaseId, _contentHostId, _stakeId, _profitPercentage, 0, 0);
			emit BuyContentInflationBonusEscrow(_host, _purchaseId, _contentHostId, _stakeId, PERCENTAGE_DIVISOR.sub(_profitPercentage), 0, 1);
			emit BuyContentInflationBonusEscrow(owner, _purchaseId, _contentHostId, _stakeId, foundationCut, 0, 2);
		}
	}

	/**
	 * @dev Release the escrowed network token earning for a specific purchase ID for an account
	 * @param _purchaseId The purchase receipt ID
	 * @param _account The address of account that made the earning (content creator/host)
	 * @param _recipientType The type of the earning recipient (0 => content creator. 1 => host)
	 */
	function _releaseNetworkEarning(bytes32 _purchaseId, address _account, uint8 _recipientType) internal {
		uint256 _networkEarning = networkEarningEscrow[_account][_purchaseId];
		networkEarningEscrow[_account][_purchaseId] = 0;
		networkEarningClaimable[_account] = networkEarningClaimable[_account].add(_networkEarning);
		emit BuyContentNetworkEarningClaimable(_account, _purchaseId, _networkEarning, _recipientType);
	}

	/**
	 * @dev Release the escrowed inflation bonus for a specific purchase ID for an account
	 * @param _purchaseId The purchase receipt ID
	 * @param _account The address of account that made the earning (content creator/host/foundation)
	 * @param _recipientType The type of the inflation bonus recipient (0 => content creator. 1 => host. 2 => foundation)
	 */
	function _releaseInflationBonus(bytes32 _purchaseId, address _account, uint8 _recipientType) internal {
		// Release the inflation bonus in escrow for stake owner
		uint256 _inflationBonusAmount = inflationBonusEscrow[_account][_purchaseId];
		if (_inflationBonusAmount > 0) {
			inflationBonusEscrow[_account][_purchaseId] = 0;
			inflationBonusClaimable[_account] = inflationBonusClaimable[_account].add(_inflationBonusAmount);
			emit BuyContentInflationBonusClaimable(_account, _purchaseId, _inflationBonusAmount, _recipientType);
		} else {
			emit BuyContentInflationBonusClaimable(_account, _purchaseId, 0, _recipientType);
		}
	}

}
