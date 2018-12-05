pragma solidity ^0.4.24;

import './SafeMath.sol';
import './developed.sol';
import './AOToken.sol';
import './AOTreasury.sol';
import './Pathos.sol';
import './AntiLogos.sol';
import './AOSetting.sol';

/**
 * @title AOEarning
 *
 * This contract stores the earning from staking/hosting content on AO
 */
contract AOEarning is developed {
	using SafeMath for uint256;

	bool public paused;
	bool public killed;

	address public settingThoughtId;
	address public aoSettingAddress;
	address public baseDenominationAddress;
	address public treasuryAddress;
	address public pathosAddress;
	address public antiLogosAddress;

	AOToken internal _baseAO;
	AOTreasury internal _treasury;
	Pathos internal _pathos;
	AntiLogos internal _antiLogos;
	AOSetting internal _aoSetting;

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

	// Mapping from stake ID to it's total earning from staking
	mapping (bytes32 => uint256) public totalStakedContentStakeEarning;

	// Mapping from stake ID to it's total earning from hosting
	mapping (bytes32 => uint256) public totalStakedContentHostEarning;

	// Mapping from stake ID to it's total earning earned by Foundation
	mapping (bytes32 => uint256) public totalStakedContentFoundationEarning;

	// Mapping from content host ID to it's total earning
	mapping (bytes32 => uint256) public totalHostContentEarningById;

	// Event to be broadcasted to public when content creator/host/foundation earns inflation bonus in escrow when request node buys the content
	// recipientType:
	// 0 => Content Creator (Stake Owner)
	// 1 => Node Host
	// 2 => Foundation
	event InflationBonusEscrowed(address indexed recipient, bytes32 indexed purchaseId, uint256 totalInflationBonusAmount, uint256 recipientProfitPercentage, uint256 recipientInflationBonus, uint8 recipientType);

	// Event to be broadcasted to public when content creator/host earns the payment split in escrow when request node buys the content
	// recipientType:
	// 0 => Content Creator (Stake Owner)
	// 1 => Node Host
	event PaymentEarningEscrowed(address indexed recipient, bytes32 indexed purchaseId, uint256 totalPaymentAmount, uint256 recipientProfitPercentage, uint256 recipientPaymentEarning, uint8 recipientType);

	// Event to be broadcasted to public when content creator/host/foundation earning is released from escrow
	// recipientType:
	// 0 => Content Creator (Stake Owner)
	// 1 => Node Host
	// 2 => Foundation
	event EarningUnescrowed(address indexed recipient, bytes32 indexed purchaseId, uint256 paymentEarning, uint256 inflationBonus, uint8 recipientType);

	// Event to be broadcasted to public when content creator earns Pathos when a node buys a content
	event PathosEarned(address indexed stakeOwner, bytes32 indexed purchaseId, uint256 amount);

	// Event to be broadcasted to public when host earns AntiLogos when a node buys a content
	event AntiLogosEarned(address indexed host, bytes32 indexed purchaseId, uint256 amount);

	// Event to be broadcasted to public when emergency mode is triggered
	event EscapeHatch();

	/**
	 * @dev Constructor function
	 * @param _settingThoughtId The Thought ID that controls the setting
	 * @param _aoSettingAddress The address of AOSetting
	 * @param _baseDenominationAddress The address of AO base token
	 * @param _treasuryAddress The address of AOTreasury
	 */
	constructor(address _settingThoughtId, address _aoSettingAddress, address _baseDenominationAddress, address _treasuryAddress, address _pathosAddress, address _antiLogosAddress) public {
		settingThoughtId = _settingThoughtId;
		aoSettingAddress = _aoSettingAddress;
		baseDenominationAddress = _baseDenominationAddress;
		treasuryAddress = _treasuryAddress;
		pathosAddress = _pathosAddress;
		antiLogosAddress = _antiLogosAddress;

		_aoSetting = AOSetting(_aoSettingAddress);
		_baseAO = AOToken(_baseDenominationAddress);
		_treasury = AOTreasury(_treasuryAddress);
		_pathos = Pathos(_pathosAddress);
		_antiLogos = AntiLogos(_antiLogosAddress);
	}

	/**
	 * @dev Checks if contract is currently active
	 */
	modifier isActive {
		require (paused == false && killed == false);
		_;
	}

	/***** DEVELOPER ONLY METHODS *****/
	/**
	 * @dev Developer pauses/unpauses contract
	 * @param _paused Either to pause contract or not
	 */
	function setPaused(bool _paused) public onlyDeveloper {
		paused = _paused;
	}

	/**
	 * @dev Developer updates base denomination address
	 * @param _newBaseDenominationAddress The new address
	 */
	function setBaseDenominationAddress(address _newBaseDenominationAddress) public onlyDeveloper {
		require (AOToken(_newBaseDenominationAddress).powerOfTen() == 0 && AOToken(_newBaseDenominationAddress).networkExchangeContract() == true);
		baseDenominationAddress = _newBaseDenominationAddress;
		_baseAO = AOToken(baseDenominationAddress);
	}

	/**
	 * @dev Developer triggers emergency mode.
	 *
	 */
	function escapeHatch() public onlyDeveloper {
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
	 * @param _primordialWeightedMultiplierStaked The weighted multiplier of primordial tokens at stake
	 * @param _profitPercentage The content creator's profit percentage
	 * @param _fileSize The size of the file
	 * @param _stakeOwner The address of the stake owner
	 * @param _host The address of the host
	 */
	function calculateEarning(
		address _buyer,
		bytes32 _purchaseId,
		uint256 _networkAmountStaked,
		uint256 _primordialAmountStaked,
		uint256 _primordialWeightedMultiplierStaked,
		uint256 _profitPercentage,
		uint256 _fileSize,
		address _stakeOwner,
		address _host) public isActive inWhitelist(msg.sender) returns (bool) {

		// Split the payment earning between content creator and host and store them in escrow
		_escrowPaymentEarning(_buyer, _purchaseId, _networkAmountStaked.add(_primordialAmountStaked), _profitPercentage, _stakeOwner, _host);

		// Calculate the inflation bonus earning for content creator/node/foundation in escrow
		_escrowInflationBonus(_purchaseId, _calculateInflationBonus(_networkAmountStaked, _primordialAmountStaked, _primordialWeightedMultiplierStaked), _profitPercentage, _stakeOwner, _host);

		// Reward the content creator/stake owner with some Pathos
		require (_pathos.mintToken(_stakeOwner, _networkAmountStaked.add(_primordialAmountStaked)));
		emit PathosEarned(_stakeOwner, _purchaseId, _networkAmountStaked.add(_primordialAmountStaked));

		// Reward the host with some AntiLogos
		require (_antiLogos.mintToken(_host, _fileSize));
		emit AntiLogosEarned(_host, _purchaseId, _fileSize);
		return true;
	}

	/**
	 * @dev Release the payment earning and inflation bonus that is in escrow for specific purchase ID
	 * @param _stakeId The ID of the staked content
	 * @param _contentHostId The ID of the hosted content
	 * @param _purchaseId The purchase receipt ID to check
	 * @param _buyerPaidAmount The request node paid amount when buying the content
	 * @param _fileSize The size of the content
	 * @param _stakeOwner The address of the stake owner
	 * @param _host The address of the node that host the file
	 * @return true on success
	 */
	function releaseEarning(bytes32 _stakeId, bytes32 _contentHostId, bytes32 _purchaseId, uint256 _buyerPaidAmount, uint256 _fileSize, address _stakeOwner, address _host) public isActive inWhitelist(msg.sender) returns (bool) {
		// Release the earning in escrow for stake owner
		_releaseEarning(_stakeId, _contentHostId, _purchaseId, _buyerPaidAmount, _fileSize, _stakeOwner, 0);

		// Release the earning in escrow for host
		_releaseEarning(_stakeId, _contentHostId, _purchaseId, _buyerPaidAmount, _fileSize, _host, 1);

		// Release the earning in escrow for foundation
		_releaseEarning(_stakeId, _contentHostId, _purchaseId, _buyerPaidAmount, _fileSize, developer, 2);
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
		(uint256 PERCENTAGE_DIVISOR,,,,) = _aoSetting.getSettingValuesByThoughtName(settingThoughtId, 'PERCENTAGE_DIVISOR');

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
	 * @param _primordialWeightedMultiplierStaked The weighted multiplier of primordial tokens at stake
	 * @return the bonus network amount
	 */
	function _calculateInflationBonus(uint256 _networkAmountStaked, uint256 _primordialAmountStaked, uint256 _primordialWeightedMultiplierStaked) internal view returns (uint256) {
		(uint256 inflationRate,,,,) = _aoSetting.getSettingValuesByThoughtName(settingThoughtId, 'inflationRate');
		(uint256 PERCENTAGE_DIVISOR,,,,) = _aoSetting.getSettingValuesByThoughtName(settingThoughtId, 'PERCENTAGE_DIVISOR');
		(uint256 MULTIPLIER_DIVISOR,,,,) = _aoSetting.getSettingValuesByThoughtName(settingThoughtId, 'MULTIPLIER_DIVISOR');

		uint256 _networkBonus = _networkAmountStaked.mul(inflationRate).div(PERCENTAGE_DIVISOR);
		uint256 _primordialBonus = _primordialAmountStaked.mul(_primordialWeightedMultiplierStaked).div(MULTIPLIER_DIVISOR).mul(inflationRate).div(PERCENTAGE_DIVISOR);
		return _networkBonus.add(_primordialBonus);
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
		(uint256 foundationCut,,,,) = _aoSetting.getSettingValuesByThoughtName(settingThoughtId, 'foundationCut');
		(uint256 PERCENTAGE_DIVISOR,,,,) = _aoSetting.getSettingValuesByThoughtName(settingThoughtId, 'PERCENTAGE_DIVISOR');

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
			require (_baseAO.mintTokenEscrow(developer, _foundationEarning.inflationBonus));
			emit InflationBonusEscrowed(developer, _purchaseId, _inflationBonusAmount, foundationCut, _foundationEarning.inflationBonus, 2);
		} else {
			emit InflationBonusEscrowed(_stakeOwner, _purchaseId, 0, _profitPercentage, 0, 0);
			emit InflationBonusEscrowed(_host, _purchaseId, 0, PERCENTAGE_DIVISOR.sub(_profitPercentage), 0, 1);
			emit InflationBonusEscrowed(developer, _purchaseId, 0, foundationCut, 0, 2);
		}
	}

	/**
	 * @dev Release the escrowed earning for a specific purchase ID for an account
	 * @param _stakeId The ID of the staked content
	 * @param _contentHostId The ID of the hosted content
	 * @param _purchaseId The purchase receipt ID
	 * @param _buyerPaidAmount The request node paid amount when buying the content
	 * @param _fileSize The size of the content
	 * @param _account The address of account that made the earning (content creator/host)
	 * @param _recipientType The type of the earning recipient (0 => content creator. 1 => host. 2 => foundation)
	 */
	function _releaseEarning(bytes32 _stakeId, bytes32 _contentHostId, bytes32 _purchaseId, uint256 _buyerPaidAmount, uint256 _fileSize, address _account, uint8 _recipientType) internal {
		// Make sure the recipient type is valid
		require (_recipientType >= 0 && _recipientType <= 2);

		uint256 _paymentEarning;
		uint256 _inflationBonus;
		uint256 _totalEarning;
		if (_recipientType == 0) {
			Earning storage _earning = stakeEarnings[_account][_purchaseId];
			_paymentEarning = _earning.paymentEarning;
			_inflationBonus = _earning.inflationBonus;
			_earning.paymentEarning = 0;
			_earning.inflationBonus = 0;
			_totalEarning = _paymentEarning.add(_inflationBonus);

			// Update the global var settings
			totalStakeContentEarning = totalStakeContentEarning.add(_totalEarning);
			stakeContentEarning[_account] = stakeContentEarning[_account].add(_totalEarning);
			totalStakedContentStakeEarning[_stakeId] = totalStakedContentStakeEarning[_stakeId].add(_totalEarning);
			if (_buyerPaidAmount > _fileSize) {
				contentPriceEarning[_account] = contentPriceEarning[_account].add(_totalEarning);
			} else {
				networkPriceEarning[_account] = networkPriceEarning[_account].add(_totalEarning);
			}
			inflationBonusAccrued[_account] = inflationBonusAccrued[_account].add(_inflationBonus);
		} else if (_recipientType == 1) {
			_earning = hostEarnings[_account][_purchaseId];
			_paymentEarning = _earning.paymentEarning;
			_inflationBonus = _earning.inflationBonus;
			_earning.paymentEarning = 0;
			_earning.inflationBonus = 0;
			_totalEarning = _paymentEarning.add(_inflationBonus);

			// Update the global var settings
			totalHostContentEarning = totalHostContentEarning.add(_totalEarning);
			hostContentEarning[_account] = hostContentEarning[_account].add(_totalEarning);
			totalStakedContentHostEarning[_stakeId] = totalStakedContentHostEarning[_stakeId].add(_totalEarning);
			totalHostContentEarningById[_contentHostId] = totalHostContentEarningById[_contentHostId].add(_totalEarning);
			if (_buyerPaidAmount > _fileSize) {
				contentPriceEarning[_account] = contentPriceEarning[_account].add(_totalEarning);
			} else {
				networkPriceEarning[_account] = networkPriceEarning[_account].add(_totalEarning);
			}
			inflationBonusAccrued[_account] = inflationBonusAccrued[_account].add(_inflationBonus);
		} else {
			_earning = foundationEarnings[_purchaseId];
			_paymentEarning = _earning.paymentEarning;
			_inflationBonus = _earning.inflationBonus;
			_earning.paymentEarning = 0;
			_earning.inflationBonus = 0;
			_totalEarning = _paymentEarning.add(_inflationBonus);

			// Update the global var settings
			totalFoundationEarning = totalFoundationEarning.add(_totalEarning);
			inflationBonusAccrued[_account] = inflationBonusAccrued[_account].add(_inflationBonus);
			totalStakedContentFoundationEarning[_stakeId] = totalStakedContentFoundationEarning[_stakeId].add(_totalEarning);
		}
		require (_baseAO.unescrowFrom(_account, _totalEarning));
		emit EarningUnescrowed(_account, _purchaseId, _paymentEarning, _inflationBonus, _recipientType);
	}
}
