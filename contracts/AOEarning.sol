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

	address public baseDenominationAddress;
	address public treasuryAddress;

	AOToken internal _baseAO;
	AOTreasury internal _treasury;

	uint256 public inflationRate; // support up to 4 decimals, i.e 12.3456% = 123456
	uint256 public foundationCut; // support up to 4 decimals, i.e 12.3456% = 123456
	uint256 public multiplierModifier; // support up to 2 decimals, 100 = 1
	uint256 constant public PERCENTAGE_DIVISOR = 10 ** 6; // 100% = 1000000
	uint256 constant public WEIGHTED_INDEX_DIVISOR = 10 ** 6; // 1000000 = 1

	// Total earning from staking content from all nodes
	uint256 public totalStakeContentEarning;

	// Total earning from hosting content from all nodes
	uint256 public totalHostContentEarning;

	// Total foundation earning
	uint256 public totalFoundationEarning;

	// Mapping from address to his/her earning from content that he/she staked
	mapping (address => uint256) public stakeContentEarning;

	// Mapping from address to his/her earning from content that he/she hosted
	mapping (address => uint256) public hostContentEarning;

	// Mapping from address to his/her network price earning
	// i.e, when staked amount = filesize
	mapping (address => uint256) public networkPriceEarning;

	// Mapping from address to his/her content price earning
	// i.e, when staked amount > filesize
	mapping (address => uint256) public contentPriceEarning;

	// Mapping from address to his/her inflation bonus
	mapping (address => uint256) public inflationBonusAccrued;

	struct Earning {
		bytes32 purchaseId;
		uint256 paymentEarning;
		uint256 inflationBonus;
	}

	// Mapping from address to earning from staking content of a purchase ID
	mapping (address => mapping(bytes32 => Earning)) public stakeEarnings;

	// Mapping from address to earning from hosting content of a purchase ID
	mapping (address => mapping(bytes32 => Earning)) public hostEarnings;

	// Mapping from purchase ID to earning for Foundation
	mapping (bytes32 => Earning) public foundationEarnings;

	// Event to be broadcasted to public when content creator/host/foundation earns inflation bonus in escrow when request node buys the content
	// recipientType:
	// 0 => Content Creator (Stake Owner)
	// 1 => Node Host
	// 2 => Foundation
	event InflationBonusEscrowed(address indexed recipient, bytes32 purchaseId, uint256 totalInflationBonusAmount, uint256 recipientProfitPercentage, uint256 recipientInflationBonus, uint8 recipientType);

	// Event to be broadcasted to public when content creator/host earns the payment split in escrow when request node buys the content
	// recipientType:
	// 0 => Content Creator (Stake Owner)
	// 1 => Node Host
	event PaymentEarningEscrowed(address indexed recipient, bytes32 purchaseId, uint256 totalPaymentAmount, uint256 recipientProfitPercentage, uint256 recipientPaymentEarning, uint8 recipientType);

	// Event to be broadcasted to public when content creator/host/foundation earning is released from escrow
	// recipientType:
	// 0 => Content Creator (Stake Owner)
	// 1 => Node Host
	// 2 => Foundation
	event EarningUnescrowed(address indexed recipient, bytes32 purchaseId, uint256 paymentEarning, uint256 inflationBonus, uint8 recipientType);

	// Event to be broadcasted to public when emergency mode is triggered
	event EscapeHatch();

	/**
	 * @dev Constructor function
	 * @param _baseDenominationAddress The address of AO base token
	 * @param _treasuryAddress The address of AOTreasury
	 */
	constructor(address _baseDenominationAddress, address _treasuryAddress) public {
		baseDenominationAddress = _baseDenominationAddress;
		treasuryAddress = _treasuryAddress;
		_baseAO = AOToken(_baseDenominationAddress);
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
	 * @dev Owner updates base denomination address
	 * @param _newBaseDenominationAddress The new address
	 */
	function setBaseDenominationAddress(address _newBaseDenominationAddress) public onlyOwner {
		require (AOToken(_newBaseDenominationAddress).powerOfTen() == 0 && AOToken(_newBaseDenominationAddress).icoContract() == true);
		baseDenominationAddress = _newBaseDenominationAddress;
		_baseAO = AOToken(baseDenominationAddress);
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
	 * @dev Calculate the content creator/host/foundation earning when request node buys the content.
	 *		Also at this stage, all of the earnings are stored in escrow
	 * @param _buyer The request node address that buys the content
	 * @param _purchaseId The ID of the purchase receipt object
	 * @param _networkAmountStaked The amount of network tokens at stake
	 * @param _primordialAmountStaked The amount of primordial tokens at stake
	 * @param _primordialWeightedIndexStaked The weighted index of primordial tokens at stake
	 * @param _profitPercentage The content creator's profit percentage
	 * @param _stakeOwner The address of the stake owner
	 * @param _host The address of the host
	 */
	function calculateEarning(
		address _buyer,
		bytes32 _purchaseId,
		uint256 _networkAmountStaked,
		uint256 _primordialAmountStaked,
		uint256 _primordialWeightedIndexStaked,
		uint256 _profitPercentage,
		address _stakeOwner,
		address _host) public isActive inWhitelist(msg.sender) returns (bool) {

		// Split the payment earning between content creator and host and store them in escrow
		_escrowPaymentEarning(_buyer, _purchaseId, _networkAmountStaked.add(_primordialAmountStaked), _profitPercentage, _stakeOwner, _host);

		// Calculate the inflation bonus earning for content creator/node/foundation in escrow
		_escrowInflationBonus(_purchaseId, _calculateInflationBonus(_networkAmountStaked, _primordialAmountStaked, _primordialWeightedIndexStaked), _profitPercentage, _stakeOwner, _host);
		return true;
	}

	/**
	 * @dev Release the payment earning and inflation bonus that is in escrow for specific purchase ID
	 * @param _purchaseId The purchase receipt ID to check
	 * @param _buyerPaidAmount The request node paid amount when buying the content
	 * @param _fileSize The size of the content
	 * @param _stakeOwner The address of the stake owner
	 * @param _host The address of the node that host the file
	 * @return true on success
	 */
	function releaseEarning(bytes32 _purchaseId, uint256 _buyerPaidAmount, uint256 _fileSize, address _stakeOwner, address _host) public isActive inWhitelist(msg.sender) returns (bool) {
		// Release the earning in escrow for stake owner
		_releaseEarning(_purchaseId, _buyerPaidAmount, _fileSize, _stakeOwner, 0);

		// Release the earning in escrow for host
		_releaseEarning(_purchaseId, _buyerPaidAmount, _fileSize, _host, 1);

		// Release the earning in escrow for foundation
		_releaseEarning(_purchaseId, _buyerPaidAmount, _fileSize, owner, 2);
		return true;
	}

	/***** INTERNAL METHODS *****/
	/**
	 * @dev Calculate the payment split for content creator/host and store them in escrow
	 * @param _buyer the request node address that buys the content
	 * @param _purchaseId The ID of the purchase receipt object
	 * @param _totalStaked The total staked amount of the content
	 * @param _profitPercentage The content creator's profit percentage
	 * @param _stakeOwner The address of the stake owner
	 * @param _host The address of the host
	 */
	function _escrowPaymentEarning(address _buyer, bytes32 _purchaseId, uint256 _totalStaked, uint256 _profitPercentage, address _stakeOwner, address _host) internal {
		// Store how much the content creator (stake owner) earns in escrow
		uint256 _stakeOwnerEarning = (_totalStaked.mul(_profitPercentage)).div(PERCENTAGE_DIVISOR);
		Earning storage _stakeEarning = stakeEarnings[_stakeOwner][_purchaseId];
		_stakeEarning.purchaseId = _purchaseId;
		_stakeEarning.paymentEarning = _stakeOwnerEarning;
		require (_baseAO.escrowFrom(_buyer, _stakeOwner, _stakeEarning.paymentEarning));
		emit PaymentEarningEscrowed(_stakeOwner, _purchaseId, _totalStaked, _profitPercentage, _stakeEarning.paymentEarning, 0);

		// Store how much the node host earns in escrow
		Earning storage _hostEarning = hostEarnings[_host][_purchaseId];
		_hostEarning.purchaseId = _purchaseId;
		_hostEarning.paymentEarning = _totalStaked.sub(_stakeOwnerEarning);
		require (_baseAO.escrowFrom(_buyer, _host, _hostEarning.paymentEarning));
		emit PaymentEarningEscrowed(_host, _purchaseId, _totalStaked, PERCENTAGE_DIVISOR.sub(_profitPercentage), _hostEarning.paymentEarning, 1);
	}

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
		uint256 _lastWeightedIndex = _baseAO.lotIndex().mul(WEIGHTED_INDEX_DIVISOR);
		require (_lastWeightedIndex >= _weightedIndex);
		uint256 _temp = (_lastWeightedIndex.sub(_weightedIndex)).mul(WEIGHTED_INDEX_DIVISOR).div(_lastWeightedIndex);
		return WEIGHTED_INDEX_DIVISOR.add(multiplierModifier.mul(_temp).div(WEIGHTED_INDEX_DIVISOR));
	}

	/**
	 * @dev Mint the inflation bonus for content creator/host/foundation and store them in escrow
	 * @param _purchaseId The ID of the purchase receipt object
	 * @param _inflationBonusAmount The amount of inflation bonus earning
	 * @param _profitPercentage The content creator's profit percentage
	 * @param _stakeOwner The address of the stake owner
	 * @param _host The address of the host
	 */
	function _escrowInflationBonus(
		bytes32 _purchaseId,
		uint256 _inflationBonusAmount,
		uint256 _profitPercentage,
		address _stakeOwner,
		address _host
	) internal {
		if (_inflationBonusAmount > 0) {
			// Store how much the content creator earns in escrow
			uint256 _stakeOwnerInflationBonus = (_inflationBonusAmount.mul(_profitPercentage)).div(PERCENTAGE_DIVISOR);
			Earning storage _stakeEarning = stakeEarnings[_stakeOwner][_purchaseId];
			_stakeEarning.inflationBonus = _stakeOwnerInflationBonus;
			require (_baseAO.mintTokenEscrow(_stakeOwner, _stakeEarning.inflationBonus));
			emit InflationBonusEscrowed(_stakeOwner, _purchaseId, _inflationBonusAmount, _profitPercentage, _stakeEarning.inflationBonus, 0);

			// Store how much the host earns in escrow
			Earning storage _hostEarning = hostEarnings[_host][_purchaseId];
			_hostEarning.inflationBonus = _inflationBonusAmount.sub(_stakeOwnerInflationBonus);
			require (_baseAO.mintTokenEscrow(_host, _hostEarning.inflationBonus));
			emit InflationBonusEscrowed(_host, _purchaseId, _inflationBonusAmount, PERCENTAGE_DIVISOR.sub(_profitPercentage), _hostEarning.inflationBonus, 1);

			// Store how much the foundation earns in escrow
			Earning storage _foundationEarning = foundationEarnings[_purchaseId];
			_foundationEarning.purchaseId = _purchaseId;
			_foundationEarning.inflationBonus = (_inflationBonusAmount.mul(foundationCut)).div(PERCENTAGE_DIVISOR);
			require (_baseAO.mintTokenEscrow(owner, _foundationEarning.inflationBonus));
			emit InflationBonusEscrowed(owner, _purchaseId, _inflationBonusAmount, foundationCut, _foundationEarning.inflationBonus, 2);
		} else {
			emit InflationBonusEscrowed(_stakeOwner, _purchaseId, 0, _profitPercentage, 0, 0);
			emit InflationBonusEscrowed(_host, _purchaseId, 0, PERCENTAGE_DIVISOR.sub(_profitPercentage), 0, 1);
			emit InflationBonusEscrowed(owner, _purchaseId, 0, foundationCut, 0, 2);
		}
	}

	/**
	 * @dev Release the escrowed earning for a specific purchase ID for an account
	 * @param _purchaseId The purchase receipt ID
	 * @param _buyerPaidAmount The request node paid amount when buying the content
	 * @param _fileSize The size of the content
	 * @param _account The address of account that made the earning (content creator/host)
	 * @param _recipientType The type of the earning recipient (0 => content creator. 1 => host. 2 => foundation)
	 */
	function _releaseEarning(bytes32 _purchaseId, uint256 _buyerPaidAmount, uint256 _fileSize, address _account, uint8 _recipientType) internal {
		// Make sure the recipient type is valid
		require (_recipientType >= 0 && _recipientType <= 2);

		uint256 _paymentEarning;
		uint256 _inflationBonus;
		uint256 _totalEarning;
		if (_recipientType == 0) {
			Earning storage _stakeEarning = stakeEarnings[_account][_purchaseId];
			_paymentEarning = _stakeEarning.paymentEarning;
			_inflationBonus = _stakeEarning.inflationBonus;
			_stakeEarning.paymentEarning = 0;
			_stakeEarning.inflationBonus = 0;
			_totalEarning = _paymentEarning.add(_inflationBonus);

			// Update the global var settings
			totalStakeContentEarning = totalStakeContentEarning.add(_totalEarning);
			stakeContentEarning[_account] = stakeContentEarning[_account].add(_totalEarning);
			if (_buyerPaidAmount > _fileSize) {
				contentPriceEarning[_account] = contentPriceEarning[_account].add(_totalEarning);
			} else {
				networkPriceEarning[_account] = networkPriceEarning[_account].add(_totalEarning);
			}
			inflationBonusAccrued[_account] = inflationBonusAccrued[_account].add(_inflationBonus);
		} else if (_recipientType == 1) {
			Earning storage _hostEarning = hostEarnings[_account][_purchaseId];
			_paymentEarning = _hostEarning.paymentEarning;
			_inflationBonus = _hostEarning.inflationBonus;
			_hostEarning.paymentEarning = 0;
			_hostEarning.inflationBonus = 0;
			_totalEarning = _paymentEarning.add(_inflationBonus);

			// Update the global var settings
			totalHostContentEarning = totalHostContentEarning.add(_totalEarning);
			hostContentEarning[_account] = hostContentEarning[_account].add(_totalEarning);
			if (_buyerPaidAmount > _fileSize) {
				contentPriceEarning[_account] = contentPriceEarning[_account].add(_totalEarning);
			} else {
				networkPriceEarning[_account] = networkPriceEarning[_account].add(_totalEarning);
			}
			inflationBonusAccrued[_account] = inflationBonusAccrued[_account].add(_inflationBonus);
		} else {
			Earning storage _foundationEarning = foundationEarnings[_purchaseId];
			_paymentEarning = _foundationEarning.paymentEarning;
			_inflationBonus = _foundationEarning.inflationBonus;
			_foundationEarning.paymentEarning = 0;
			_foundationEarning.inflationBonus = 0;
			_totalEarning = _paymentEarning.add(_inflationBonus);

			// Update the global var settings
			totalFoundationEarning = totalFoundationEarning.add(_totalEarning);
			inflationBonusAccrued[_account] = inflationBonusAccrued[_account].add(_inflationBonus);
		}
		require (_baseAO.unescrowFrom(_account, _totalEarning));
		emit EarningUnescrowed(_account, _purchaseId, _paymentEarning, _inflationBonus, _recipientType);
	}
}
