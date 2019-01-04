pragma solidity ^0.4.24;

import './SafeMath.sol';
import './TheAO.sol';
import './AOToken.sol';
import './AOTreasury.sol';
import './Pathos.sol';
import './Ethos.sol';
import './AOSetting.sol';
import './AOLibrary.sol';
import './NameFactory.sol';

/**
 * @title AOEarning
 *
 * This contract stores the earning from staking/hosting content on AO
 */
contract AOEarning is TheAO {
	using SafeMath for uint256;

	address public settingTAOId;
	address public aoSettingAddress;
	address public baseDenominationAddress;
	address public treasuryAddress;
	address public nameFactoryAddress;
	address public pathosAddress;
	address public ethosAddress;

	bool public paused;
	bool public killed;

	AOToken internal _baseAO;
	AOTreasury internal _treasury;
	NameFactory internal _nameFactory;
	Pathos internal _pathos;
	Ethos internal _ethos;
	AOSetting internal _aoSetting;

	// Total earning from staking content from all nodes
	uint256 public totalStakeContentEarning;

	// Total earning from hosting content from all nodes
	uint256 public totalHostContentEarning;

	// Total The AO earning
	uint256 public totalTheAOEarning;

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
		uint256 pathosAmount;
		uint256 ethosAmount;
	}

	// Mapping from address to earning from staking content of a purchase ID
	mapping (address => mapping(bytes32 => Earning)) public stakeEarnings;

	// Mapping from address to earning from hosting content of a purchase ID
	mapping (address => mapping(bytes32 => Earning)) public hostEarnings;

	// Mapping from purchase ID to earning for The AO
	mapping (bytes32 => Earning) public theAOEarnings;

	// Mapping from stake ID to it's total earning from staking
	mapping (bytes32 => uint256) public totalStakedContentStakeEarning;

	// Mapping from stake ID to it's total earning from hosting
	mapping (bytes32 => uint256) public totalStakedContentHostEarning;

	// Mapping from stake ID to it's total earning earned by The AO
	mapping (bytes32 => uint256) public totalStakedContentTheAOEarning;

	// Mapping from content host ID to it's total earning
	mapping (bytes32 => uint256) public totalHostContentEarningById;

	// Event to be broadcasted to public when content creator/host earns the payment split in escrow when request node buys the content
	// recipientType:
	// 0 => Content Creator (Stake Owner)
	// 1 => Node Host
	// 2 => The AO
	event PaymentEarningEscrowed(address indexed recipient, bytes32 indexed purchaseId, uint256 totalPaymentAmount, uint256 recipientProfitPercentage, uint256 recipientPaymentEarning, uint8 recipientType);

	// Event to be broadcasted to public when content creator/host/The AO earns inflation bonus in escrow when request node buys the content
	// recipientType:
	// 0 => Content Creator (Stake Owner)
	// 1 => Node Host
	// 2 => The AO
	event InflationBonusEscrowed(address indexed recipient, bytes32 indexed purchaseId, uint256 totalInflationBonusAmount, uint256 recipientProfitPercentage, uint256 recipientInflationBonus, uint8 recipientType);

	// Event to be broadcasted to public when content creator/host/The AO earning is released from escrow
	// recipientType:
	// 0 => Content Creator (Stake Owner)
	// 1 => Node Host
	// 2 => The AO
	event EarningUnescrowed(address indexed recipient, bytes32 indexed purchaseId, uint256 paymentEarning, uint256 inflationBonus, uint8 recipientType);

	// Event to be broadcasted to public when content creator's Name earns Pathos when a node buys a content
	event PathosEarned(address indexed nameId, bytes32 indexed purchaseId, uint256 amount);

	// Event to be broadcasted to public when host's Name earns Ethos when a node buys a content
	event EthosEarned(address indexed nameId, bytes32 indexed purchaseId, uint256 amount);

	// Event to be broadcasted to public when emergency mode is triggered
	event EscapeHatch();

	/**
	 * @dev Constructor function
	 * @param _settingTAOId The TAO ID that controls the setting
	 * @param _aoSettingAddress The address of AOSetting
	 * @param _baseDenominationAddress The address of AO base token
	 * @param _treasuryAddress The address of AOTreasury
	 * @param _nameFactoryAddress The address of NameFactory
	 * @param _pathosAddress The address of Pathos
	 * @param _ethosAddress The address of Ethos
	 */
	constructor(address _settingTAOId, address _aoSettingAddress, address _baseDenominationAddress, address _treasuryAddress, address _nameFactoryAddress, address _pathosAddress, address _ethosAddress) public {
		settingTAOId = _settingTAOId;
		aoSettingAddress = _aoSettingAddress;
		baseDenominationAddress = _baseDenominationAddress;
		treasuryAddress = _treasuryAddress;
		pathosAddress = _pathosAddress;
		ethosAddress = _ethosAddress;

		_aoSetting = AOSetting(_aoSettingAddress);
		_baseAO = AOToken(_baseDenominationAddress);
		_treasury = AOTreasury(_treasuryAddress);
		_nameFactory = NameFactory(_nameFactoryAddress);
		_pathos = Pathos(_pathosAddress);
		_ethos = Ethos(_ethosAddress);
	}

	/**
	 * @dev Checks if contract is currently active
	 */
	modifier isContractActive {
		require (paused == false && killed == false);
		_;
	}

	/***** The AO ONLY METHODS *****/
	/**
	 * @dev The AO pauses/unpauses contract
	 * @param _paused Either to pause contract or not
	 */
	function setPaused(bool _paused) public onlyTheAO {
		paused = _paused;
	}

	/**
	 * @dev The AO triggers emergency mode.
	 *
	 */
	function escapeHatch() public onlyTheAO {
		require (killed == false);
		killed = true;
		emit EscapeHatch();
	}

	/**
	 * @dev The AO updates base denomination address
	 * @param _newBaseDenominationAddress The new address
	 */
	function setBaseDenominationAddress(address _newBaseDenominationAddress) public onlyTheAO {
		require (AOToken(_newBaseDenominationAddress).powerOfTen() == 0);
		baseDenominationAddress = _newBaseDenominationAddress;
		_baseAO = AOToken(baseDenominationAddress);
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Calculate the content creator/host/The AO earning when request node buys the content.
	 *		Also at this stage, all of the earnings are stored in escrow
	 * @param _buyer The request node address that buys the content
	 * @param _purchaseId The ID of the purchase receipt object
	 * @param _networkAmountStaked The amount of network tokens at stake
	 * @param _primordialAmountStaked The amount of primordial tokens at stake
	 * @param _primordialWeightedMultiplierStaked The weighted multiplier of primordial tokens at stake
	 * @param _profitPercentage The content creator's profit percentage
	 * @param _stakeOwner The address of the stake owner
	 * @param _host The address of the host
	 * @param _isAOContentUsageType whether or not the content is of AO Content Usage Type
	 */
	function calculateEarning(
		address _buyer,
		bytes32 _purchaseId,
		uint256 _networkAmountStaked,
		uint256 _primordialAmountStaked,
		uint256 _primordialWeightedMultiplierStaked,
		uint256 _profitPercentage,
		address _stakeOwner,
		address _host,
		bool _isAOContentUsageType
	) public isContractActive inWhitelist(msg.sender) returns (bool) {
		// Split the payment earning between content creator and host and store them in escrow
		_escrowPaymentEarning(_buyer, _purchaseId, _networkAmountStaked.add(_primordialAmountStaked), _profitPercentage, _stakeOwner, _host, _isAOContentUsageType);

		// Calculate the inflation bonus earning for content creator/node/The AO in escrow
		_escrowInflationBonus(_purchaseId, _calculateInflationBonus(_networkAmountStaked, _primordialAmountStaked, _primordialWeightedMultiplierStaked), _profitPercentage, _stakeOwner, _host, _isAOContentUsageType);

		return true;
	}

	/**
	 * @dev Release the payment earning and inflation bonus that is in escrow for specific purchase ID
	 * @param _stakeId The ID of the staked content
	 * @param _contentHostId The ID of the hosted content
	 * @param _purchaseId The purchase receipt ID to check
	 * @param _buyerPaidMoreThanFileSize Whether or not the request node paid more than filesize when buying the content
	 * @param _stakeOwner The address of the stake owner
	 * @param _host The address of the node that host the file
	 * @return true on success
	 */
	function releaseEarning(bytes32 _stakeId, bytes32 _contentHostId, bytes32 _purchaseId, bool _buyerPaidMoreThanFileSize, address _stakeOwner, address _host) public isContractActive inWhitelist(msg.sender) returns (bool) {
		// Release the earning in escrow for stake owner
		_releaseEarning(_stakeId, _contentHostId, _purchaseId, _buyerPaidMoreThanFileSize, _stakeOwner, 0);

		// Release the earning in escrow for host
		_releaseEarning(_stakeId, _contentHostId, _purchaseId, _buyerPaidMoreThanFileSize, _host, 1);

		// Release the earning in escrow for The AO
		_releaseEarning(_stakeId, _contentHostId, _purchaseId, _buyerPaidMoreThanFileSize, theAO, 2);

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
	 * @param _isAOContentUsageType whether or not the content is of AO Content Usage Type
	 */
	function _escrowPaymentEarning(address _buyer, bytes32 _purchaseId, uint256 _totalStaked, uint256 _profitPercentage, address _stakeOwner, address _host, bool _isAOContentUsageType) internal {
		(uint256 _stakeOwnerEarning, uint256 _pathosAmount) = _escrowStakeOwnerPaymentEarning(_buyer, _purchaseId, _totalStaked, _profitPercentage, _stakeOwner, _isAOContentUsageType);
		(uint256 _ethosAmount) = _escrowHostPaymentEarning(_buyer, _purchaseId, _totalStaked, _profitPercentage, _host, _isAOContentUsageType, _stakeOwnerEarning);

		_escrowTheAOPaymentEarning(_purchaseId, _totalStaked, _pathosAmount, _ethosAmount);
	}

	/**
	 * @dev Calculate the inflation bonus amount
	 * @param _networkAmountStaked The amount of network tokens at stake
	 * @param _primordialAmountStaked The amount of primordial tokens at stake
	 * @param _primordialWeightedMultiplierStaked The weighted multiplier of primordial tokens at stake
	 * @return the bonus network amount
	 */
	function _calculateInflationBonus(uint256 _networkAmountStaked, uint256 _primordialAmountStaked, uint256 _primordialWeightedMultiplierStaked) internal view returns (uint256) {
		(uint256 inflationRate,,) = _getSettingVariables();

		uint256 _networkBonus = _networkAmountStaked.mul(inflationRate).div(AOLibrary.PERCENTAGE_DIVISOR());
		uint256 _primordialBonus = _primordialAmountStaked.mul(_primordialWeightedMultiplierStaked).div(AOLibrary.MULTIPLIER_DIVISOR()).mul(inflationRate).div(AOLibrary.PERCENTAGE_DIVISOR());
		return _networkBonus.add(_primordialBonus);
	}

	/**
	 * @dev Mint the inflation bonus for content creator/host/The AO and store them in escrow
	 * @param _purchaseId The ID of the purchase receipt object
	 * @param _inflationBonusAmount The amount of inflation bonus earning
	 * @param _profitPercentage The content creator's profit percentage
	 * @param _stakeOwner The address of the stake owner
	 * @param _host The address of the host
	 * @param _isAOContentUsageType whether or not the content is of AO Content Usage Type
	 */
	function _escrowInflationBonus(
		bytes32 _purchaseId,
		uint256 _inflationBonusAmount,
		uint256 _profitPercentage,
		address _stakeOwner,
		address _host,
		bool _isAOContentUsageType
	) internal {
		(, uint256 theAOCut,) = _getSettingVariables();

		if (_inflationBonusAmount > 0) {
			// Store how much the content creator earns in escrow
			uint256 _stakeOwnerInflationBonus = _isAOContentUsageType ? (_inflationBonusAmount.mul(_profitPercentage)).div(AOLibrary.PERCENTAGE_DIVISOR()) : 0;
			Earning storage _stakeEarning = stakeEarnings[_stakeOwner][_purchaseId];
			_stakeEarning.inflationBonus = _stakeOwnerInflationBonus;
			require (_baseAO.mintTokenEscrow(_stakeOwner, _stakeEarning.inflationBonus));
			emit InflationBonusEscrowed(_stakeOwner, _purchaseId, _inflationBonusAmount, _profitPercentage, _stakeEarning.inflationBonus, 0);

			// Store how much the host earns in escrow
			Earning storage _hostEarning = hostEarnings[_host][_purchaseId];
			_hostEarning.inflationBonus = _inflationBonusAmount.sub(_stakeOwnerInflationBonus);
			require (_baseAO.mintTokenEscrow(_host, _hostEarning.inflationBonus));
			emit InflationBonusEscrowed(_host, _purchaseId, _inflationBonusAmount, AOLibrary.PERCENTAGE_DIVISOR().sub(_profitPercentage), _hostEarning.inflationBonus, 1);

			// Store how much the The AO earns in escrow
			Earning storage _theAOEarning = theAOEarnings[_purchaseId];
			_theAOEarning.inflationBonus = (_inflationBonusAmount.mul(theAOCut)).div(AOLibrary.PERCENTAGE_DIVISOR());
			require (_baseAO.mintTokenEscrow(theAO, _theAOEarning.inflationBonus));
			emit InflationBonusEscrowed(theAO, _purchaseId, _inflationBonusAmount, theAOCut, _theAOEarning.inflationBonus, 2);
		} else {
			emit InflationBonusEscrowed(_stakeOwner, _purchaseId, 0, _profitPercentage, 0, 0);
			emit InflationBonusEscrowed(_host, _purchaseId, 0, AOLibrary.PERCENTAGE_DIVISOR().sub(_profitPercentage), 0, 1);
			emit InflationBonusEscrowed(theAO, _purchaseId, 0, theAOCut, 0, 2);
		}
	}

	/**
	 * @dev Release the escrowed earning for a specific purchase ID for an account
	 * @param _stakeId The ID of the staked content
	 * @param _contentHostId The ID of the hosted content
	 * @param _purchaseId The purchase receipt ID
	 * @param _buyerPaidMoreThanFileSize Whether or not the request node paid more than filesize when buying the content
	 * @param _account The address of account that made the earning (content creator/host)
	 * @param _recipientType The type of the earning recipient (0 => content creator. 1 => host. 2 => theAO)
	 */
	function _releaseEarning(bytes32 _stakeId, bytes32 _contentHostId, bytes32 _purchaseId, bool _buyerPaidMoreThanFileSize, address _account, uint8 _recipientType) internal {
		// Make sure the recipient type is valid
		require (_recipientType >= 0 && _recipientType <= 2);

		uint256 _paymentEarning;
		uint256 _inflationBonus;
		uint256 _totalEarning;
		uint256 _pathosAmount;
		uint256 _ethosAmount;
		if (_recipientType == 0) {
			Earning storage _earning = stakeEarnings[_account][_purchaseId];
			_paymentEarning = _earning.paymentEarning;
			_inflationBonus = _earning.inflationBonus;
			_pathosAmount = _earning.pathosAmount;
			_earning.paymentEarning = 0;
			_earning.inflationBonus = 0;
			_earning.pathosAmount = 0;
			_earning.ethosAmount = 0;
			_totalEarning = _paymentEarning.add(_inflationBonus);

			// Update the global var settings
			totalStakeContentEarning = totalStakeContentEarning.add(_totalEarning);
			stakeContentEarning[_account] = stakeContentEarning[_account].add(_totalEarning);
			totalStakedContentStakeEarning[_stakeId] = totalStakedContentStakeEarning[_stakeId].add(_totalEarning);
			if (_buyerPaidMoreThanFileSize) {
				contentPriceEarning[_account] = contentPriceEarning[_account].add(_totalEarning);
			} else {
				networkPriceEarning[_account] = networkPriceEarning[_account].add(_totalEarning);
			}
			inflationBonusAccrued[_account] = inflationBonusAccrued[_account].add(_inflationBonus);

			// Reward the content creator/stake owner with some Pathos
			require (_pathos.mintToken(_nameFactory.ethAddressToNameId(_account), _pathosAmount));
			emit PathosEarned(_nameFactory.ethAddressToNameId(_account), _purchaseId, _pathosAmount);
		} else if (_recipientType == 1) {
			_earning = hostEarnings[_account][_purchaseId];
			_paymentEarning = _earning.paymentEarning;
			_inflationBonus = _earning.inflationBonus;
			_ethosAmount = _earning.ethosAmount;
			_earning.paymentEarning = 0;
			_earning.inflationBonus = 0;
			_earning.pathosAmount = 0;
			_earning.ethosAmount = 0;
			_totalEarning = _paymentEarning.add(_inflationBonus);

			// Update the global var settings
			totalHostContentEarning = totalHostContentEarning.add(_totalEarning);
			hostContentEarning[_account] = hostContentEarning[_account].add(_totalEarning);
			totalStakedContentHostEarning[_stakeId] = totalStakedContentHostEarning[_stakeId].add(_totalEarning);
			totalHostContentEarningById[_contentHostId] = totalHostContentEarningById[_contentHostId].add(_totalEarning);
			if (_buyerPaidMoreThanFileSize) {
				contentPriceEarning[_account] = contentPriceEarning[_account].add(_totalEarning);
			} else {
				networkPriceEarning[_account] = networkPriceEarning[_account].add(_totalEarning);
			}
			inflationBonusAccrued[_account] = inflationBonusAccrued[_account].add(_inflationBonus);

			// Reward the host node with some Ethos
			require (_ethos.mintToken(_nameFactory.ethAddressToNameId(_account), _ethosAmount));
			emit EthosEarned(_nameFactory.ethAddressToNameId(_account), _purchaseId, _ethosAmount);
		} else {
			_earning = theAOEarnings[_purchaseId];
			_paymentEarning = _earning.paymentEarning;
			_inflationBonus = _earning.inflationBonus;
			_earning.paymentEarning = 0;
			_earning.inflationBonus = 0;
			_earning.pathosAmount = 0;
			_earning.ethosAmount = 0;
			_totalEarning = _paymentEarning.add(_inflationBonus);

			// Update the global var settings
			totalTheAOEarning = totalTheAOEarning.add(_totalEarning);
			inflationBonusAccrued[_account] = inflationBonusAccrued[_account].add(_inflationBonus);
			totalStakedContentTheAOEarning[_stakeId] = totalStakedContentTheAOEarning[_stakeId].add(_totalEarning);
		}
		require (_baseAO.unescrowFrom(_account, _totalEarning));
		emit EarningUnescrowed(_account, _purchaseId, _paymentEarning, _inflationBonus, _recipientType);
	}

	/**
	 * @dev Get setting variables
	 * @return inflationRate The rate to use when calculating inflation bonus
	 * @return theAOCut The rate to use when calculating the AO earning
	 * @return theAOEthosEarnedRate The rate to use when calculating the Ethos to AO rate for the AO
	 */
	function _getSettingVariables() internal view returns (uint256, uint256, uint256) {
		(uint256 inflationRate,,,,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'inflationRate');
		(uint256 theAOCut,,,,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'theAOCut');
		(uint256 theAOEthosEarnedRate,,,,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'theAOEthosEarnedRate');

		return (inflationRate, theAOCut, theAOEthosEarnedRate);
	}

	/**
	 * @dev Calculate the payment split for content creator and store them in escrow
	 * @param _buyer the request node address that buys the content
	 * @param _purchaseId The ID of the purchase receipt object
	 * @param _totalStaked The total staked amount of the content
	 * @param _profitPercentage The content creator's profit percentage
	 * @param _stakeOwner The address of the stake owner
	 * @param _isAOContentUsageType whether or not the content is of AO Content Usage Type
	 * @return The stake owner's earning amount
	 * @return The pathos earned from this transaction
	 */
	function _escrowStakeOwnerPaymentEarning(address _buyer, bytes32 _purchaseId, uint256 _totalStaked, uint256 _profitPercentage, address _stakeOwner, bool _isAOContentUsageType) internal returns (uint256, uint256) {
		(uint256 inflationRate,,) = _getSettingVariables();

		Earning storage _stakeEarning = stakeEarnings[_stakeOwner][_purchaseId];
		_stakeEarning.purchaseId = _purchaseId;
		// Store how much the content creator (stake owner) earns in escrow
		// If content is AO Content Usage Type, stake owner earns 0%
		// and all profit goes to the serving host node
		_stakeEarning.paymentEarning = _isAOContentUsageType ? (_totalStaked.mul(_profitPercentage)).div(AOLibrary.PERCENTAGE_DIVISOR()) : 0;
		// Pathos = Price X Node Share X Inflation Rate
		_stakeEarning.pathosAmount = _totalStaked.mul(AOLibrary.PERCENTAGE_DIVISOR().sub(_profitPercentage)).mul(inflationRate).div(AOLibrary.PERCENTAGE_DIVISOR()).div(AOLibrary.PERCENTAGE_DIVISOR());
		require (_baseAO.escrowFrom(_buyer, _stakeOwner, _stakeEarning.paymentEarning));
		emit PaymentEarningEscrowed(_stakeOwner, _purchaseId, _totalStaked, _profitPercentage, _stakeEarning.paymentEarning, 0);
		return (_stakeEarning.paymentEarning, _stakeEarning.pathosAmount);
	}

	/**
	 * @dev Calculate the payment split for host node and store them in escrow
	 * @param _buyer the request node address that buys the content
	 * @param _purchaseId The ID of the purchase receipt object
	 * @param _totalStaked The total staked amount of the content
	 * @param _profitPercentage The content creator's profit percentage
	 * @param _host The address of the host node
	 * @param _isAOContentUsageType whether or not the content is of AO Content Usage Type
	 * @param _stakeOwnerEarning The stake owner's earning amount
	 * @return The ethos earned from this transaction
	 */
	function _escrowHostPaymentEarning(address _buyer, bytes32 _purchaseId, uint256 _totalStaked, uint256 _profitPercentage, address _host, bool _isAOContentUsageType, uint256 _stakeOwnerEarning) internal returns (uint256) {
		(uint256 inflationRate,,) = _getSettingVariables();

		// Store how much the node host earns in escrow
		Earning storage _hostEarning = hostEarnings[_host][_purchaseId];
		_hostEarning.purchaseId = _purchaseId;
		_hostEarning.paymentEarning = _totalStaked.sub(_stakeOwnerEarning);
		// Ethos = Price X Creator Share X Inflation Rate
		_hostEarning.ethosAmount = _totalStaked.mul(_profitPercentage).mul(inflationRate).div(AOLibrary.PERCENTAGE_DIVISOR()).div(AOLibrary.PERCENTAGE_DIVISOR());

		if (_isAOContentUsageType) {
			require (_baseAO.escrowFrom(_buyer, _host, _hostEarning.paymentEarning));
		} else {
			// If not AO Content usage type, we want to mint to the host
			require (_baseAO.mintTokenEscrow(_host, _hostEarning.paymentEarning));
		}
		emit PaymentEarningEscrowed(_host, _purchaseId, _totalStaked, AOLibrary.PERCENTAGE_DIVISOR().sub(_profitPercentage), _hostEarning.paymentEarning, 1);
		return _hostEarning.ethosAmount;
	}

	/**
	 * @dev Calculate the earning for The AO and store them in escrow
	 * @param _purchaseId The ID of the purchase receipt object
	 * @param _totalStaked The total staked amount of the content
	 * @param _pathosAmount The amount of pathos earned by stake owner
	 * @param _ethosAmount The amount of ethos earned by host node
	 */
	function _escrowTheAOPaymentEarning(bytes32 _purchaseId, uint256 _totalStaked, uint256 _pathosAmount, uint256 _ethosAmount) internal {
		(,,uint256 theAOEthosEarnedRate) = _getSettingVariables();

		// Store how much The AO earns in escrow
		Earning storage _theAOEarning = theAOEarnings[_purchaseId];
		_theAOEarning.purchaseId = _purchaseId;
		// Pathos + X% of Ethos
		_theAOEarning.paymentEarning = _pathosAmount.add(_ethosAmount.mul(theAOEthosEarnedRate).div(AOLibrary.PERCENTAGE_DIVISOR()));
		require (_baseAO.mintTokenEscrow(theAO, _theAOEarning.paymentEarning));
		emit PaymentEarningEscrowed(theAO, _purchaseId, _totalStaked, 0, _theAOEarning.paymentEarning, 2);
	}
}
