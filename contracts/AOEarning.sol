pragma solidity ^0.4.24;

import './SafeMath.sol';
import './AOLibrary.sol';
import './TheAO.sol';
import './IAOEarning.sol';
import './IAOSetting.sol';
import './AOIon.sol';
import './INameFactory.sol';
import './Pathos.sol';
import './Ethos.sol';
import './IAOContent.sol';
import './IAOStakedContent.sol';
import './IAOContentHost.sol';
import './IAOPurchaseReceipt.sol';
import './INamePublicKey.sol';

/**
 * @title AOEarning
 *
 * This contract stores the earning from staking/hosting content on AO
 */
contract AOEarning is TheAO, IAOEarning {
	using SafeMath for uint256;

	address public settingTAOId;
	address public aoSettingAddress;
	address public aoIonAddress;
	address public nameFactoryAddress;
	address public pathosAddress;
	address public ethosAddress;
	address public aoContentAddress;
	address public aoStakedContentAddress;
	address public aoContentHostAddress;
	address public aoPurchaseReceiptAddress;
	address public namePublicKeyAddress;

	IAOSetting internal _aoSetting;
	AOIon internal _aoIon;
	INameFactory internal _nameFactory;
	Pathos internal _pathos;
	Ethos internal _ethos;
	IAOContent internal _aoContent;
	IAOStakedContent internal _aoStakedContent;
	IAOContentHost internal _aoContentHost;
	IAOPurchaseReceipt internal _aoPurchaseReceipt;
	INamePublicKey internal _namePublicKey;

	// Total earning from staking content from all nodes
	uint256 public totalStakedContentEarning;

	// Total earning from hosting content from all nodes
	uint256 public totalContentHostEarning;

	// Total The AO earning
	uint256 public totalTheAOEarning;

	// Mapping from PurchaseReceipt ID to its escrowed earning status
	mapping (bytes32 => bool) internal purchaseReceiptEarningEscrowed;

	// Mapping from PurchaseReceipt ID to its unescrowed earning status
	mapping (bytes32 => bool) internal purchaseReceiptEarningUnescrowed;

	// Mapping from address to his/her earning from content that he/she staked
	mapping (address => uint256) public ownerStakedContentEarning;

	// Mapping from address to his/her earning from content that he/she hosted
	mapping (address => uint256) public ownerContentHostEarning;

	// Mapping from address to his/her network price earning
	// i.e, when staked amount = filesize
	mapping (address => uint256) public ownerNetworkPriceEarning;

	// Mapping from address to his/her content price earning
	// i.e, when staked amount > filesize
	mapping (address => uint256) public ownerContentPriceEarning;

	// Mapping from address to his/her inflation bonus
	mapping (address => uint256) public ownerInflationBonusAccrued;

	struct Earning {
		bytes32 purchaseReceiptId;
		uint256 paymentEarning;
		uint256 inflationBonus;
		uint256 pathosAmount;
		uint256 ethosAmount;
	}

	// Mapping from address to earning from staking content of a PurchaseReceipt ID
	mapping (address => mapping(bytes32 => Earning)) public ownerPurchaseReceiptStakeEarnings;

	// Mapping from address to earning from hosting content of a PurchaseReceipt ID
	mapping (address => mapping(bytes32 => Earning)) public ownerPurchaseReceiptHostEarnings;

	// Mapping from PurchaaseReceipt ID to earning for The AO
	mapping (bytes32 => Earning) public theAOPurchaseReceiptEarnings;

	// Mapping from StakedContent ID to it's total earning from staking
	mapping (bytes32 => uint256) public stakedContentStakeEarning;

	// Mapping from StakedContent ID to it's total earning from hosting
	mapping (bytes32 => uint256) public stakedContentHostEarning;

	// Mapping from StakedContent ID to it's total earning earned by The AO
	mapping (bytes32 => uint256) public stakedContentTheAOEarning;

	// Mapping from content host ID to it's total earning
	mapping (bytes32 => uint256) public contentHostEarning;

	// Event to be broadcasted to public when content creator/host earns the payment split in escrow when request node buys the content
	// recipientType:
	// 0 => Content Creator (Stake Owner)
	// 1 => Node Host
	// 2 => The AO
	event PaymentEarningEscrowed(address indexed recipient, bytes32 indexed purchaseReceiptId, uint256 price, uint256 recipientProfitPercentage, uint256 recipientPaymentEarning, uint8 recipientType);

	// Event to be broadcasted to public when content creator/host/The AO earns inflation bonus in escrow when request node buys the content
	// recipientType:
	// 0 => Content Creator (Stake Owner)
	// 1 => Node Host
	// 2 => The AO
	event InflationBonusEscrowed(address indexed recipient, bytes32 indexed purchaseReceiptId, uint256 totalInflationBonusAmount, uint256 recipientProfitPercentage, uint256 recipientInflationBonus, uint8 recipientType);

	// Event to be broadcasted to public when content creator/host/The AO earning is released from escrow
	// recipientType:
	// 0 => Content Creator (Stake Owner)
	// 1 => Node Host
	// 2 => The AO
	event EarningUnescrowed(address indexed recipient, bytes32 indexed purchaseReceiptId, uint256 paymentEarning, uint256 inflationBonus, uint8 recipientType);

	// Event to be broadcasted to public when content creator's Name earns Pathos when a node buys a content
	event PathosEarned(address indexed nameId, bytes32 indexed purchaseReceiptId, uint256 amount);

	// Event to be broadcasted to public when host's Name earns Ethos when a node buys a content
	event EthosEarned(address indexed nameId, bytes32 indexed purchaseReceiptId, uint256 amount);

	/**
	 * @dev Constructor function
	 * @param _settingTAOId The TAO ID that controls the setting
	 * @param _aoSettingAddress The address of AOSetting
	 * @param _aoIonAddress The address of AOIon
	 * @param _nameFactoryAddress The address of NameFactory
	 * @param _pathosAddress The address of Pathos
	 * @param _ethosAddress The address of Ethos
	 * @param _namePublicKeyAddress The address of NamePublicKey
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	constructor(address _settingTAOId,
		address _aoSettingAddress,
		address _aoIonAddress,
		address _nameFactoryAddress,
		address _pathosAddress,
		address _ethosAddress,
		address _aoContentAddress,
		address _namePublicKeyAddress,
		address _nameTAOPositionAddress) public {
		setSettingTAOId(_settingTAOId);
		setAOSettingAddress(_aoSettingAddress);
		setAOIonAddress(_aoIonAddress);
		setNameFactoryAddress(_nameFactoryAddress);
		setPathosAddress(_pathosAddress);
		setEthosAddress(_ethosAddress);
		setAOContentAddress(_aoContentAddress);
		setNamePublicKeyAddress(_namePublicKeyAddress);
		setNameTAOPositionAddress(_nameTAOPositionAddress);
	}

	/**
	 * @dev Checks if the calling contract address is The AO
	 *		OR
	 *		If The AO is set to a Name/TAO, then check if calling address is the Advocate
	 */
	modifier onlyTheAO {
		require (AOLibrary.isTheAO(msg.sender, theAO, nameTAOPositionAddress));
		_;
	}

	/***** The AO ONLY METHODS *****/
	/**
	 * @dev Transfer ownership of The AO to new address
	 * @param _theAO The new address to be transferred
	 */
	function transferOwnership(address _theAO) public onlyTheAO {
		require (_theAO != address(0));
		theAO = _theAO;
	}

	/**
	 * @dev Whitelist `_account` address to transact on behalf of others
	 * @param _account The address to whitelist
	 * @param _whitelist Either to whitelist or not
	 */
	function setWhitelist(address _account, bool _whitelist) public onlyTheAO {
		require (_account != address(0));
		whitelist[_account] = _whitelist;
	}

	/**
	 * @dev The AO sets setting TAO ID
	 * @param _settingTAOId The new setting TAO ID to set
	 */
	function setSettingTAOId(address _settingTAOId) public onlyTheAO {
		require (AOLibrary.isTAO(_settingTAOId));
		settingTAOId = _settingTAOId;
	}

	/**
	 * @dev The AO sets AO Setting address
	 * @param _aoSettingAddress The address of AOSetting
	 */
	function setAOSettingAddress(address _aoSettingAddress) public onlyTheAO {
		require (_aoSettingAddress != address(0));
		aoSettingAddress = _aoSettingAddress;
		_aoSetting = IAOSetting(_aoSettingAddress);
	}

	/**
	 * @dev The AO sets AOIon address
	 * @param _aoIonAddress The address of AOIon
	 */
	function setAOIonAddress(address _aoIonAddress) public onlyTheAO {
		require (_aoIonAddress != address(0));
		aoIonAddress = _aoIonAddress;
		_aoIon = AOIon(_aoIonAddress);
	}

	/**
	 * @dev The AO sets NameFactory address
	 * @param _nameFactoryAddress The address of NameFactory
	 */
	function setNameFactoryAddress(address _nameFactoryAddress) public onlyTheAO {
		require (_nameFactoryAddress != address(0));
		nameFactoryAddress = _nameFactoryAddress;
		_nameFactory = INameFactory(_nameFactoryAddress);
	}

	/**
	 * @dev The AO sets Pathos address
	 * @param _pathosAddress The address of Pathos
	 */
	function setPathosAddress(address _pathosAddress) public onlyTheAO {
		require (_pathosAddress != address(0));
		pathosAddress = _pathosAddress;
		_pathos = Pathos(_pathosAddress);
	}

	/**
	 * @dev The AO sets Ethos address
	 * @param _ethosAddress The address of Ethos
	 */
	function setEthosAddress(address _ethosAddress) public onlyTheAO {
		require (_ethosAddress != address(0));
		ethosAddress = _ethosAddress;
		_ethos = Ethos(_ethosAddress);
	}

	/**
	 * @dev The AO sets AOContent address
	 * @param _aoContentAddress The address of AOContent
	 */
	function setAOContentAddress(address _aoContentAddress) public onlyTheAO {
		require (_aoContentAddress != address(0));
		aoContentAddress = _aoContentAddress;
		_aoContent = IAOContent(_aoContentAddress);
	}

	/**
	 * @dev The AO sets AOStakedContent address
	 * @param _aoStakedContentAddress The address of AOStakedContent
	 */
	function setAOStakedContentAddress(address _aoStakedContentAddress) public onlyTheAO {
		require (_aoStakedContentAddress != address(0));
		aoStakedContentAddress = _aoStakedContentAddress;
		_aoStakedContent = IAOStakedContent(_aoStakedContentAddress);
	}

	/**
	 * @dev The AO sets AOContentHost address
	 * @param _aoContentHostAddress The address of AOContentHost
	 */
	function setAOContentHostAddress(address _aoContentHostAddress) public onlyTheAO {
		require (_aoContentHostAddress != address(0));
		aoContentHostAddress = _aoContentHostAddress;
		_aoContentHost = IAOContentHost(_aoContentHostAddress);
	}

	/**
	 * @dev The AO sets AOPurchaseReceipt address
	 * @param _aoPurchaseReceiptAddress The address of AOPurchaseReceipt
	 */
	function setAOPurchaseReceiptAddress(address _aoPurchaseReceiptAddress) public onlyTheAO {
		require (_aoPurchaseReceiptAddress != address(0));
		aoPurchaseReceiptAddress = _aoPurchaseReceiptAddress;
		_aoPurchaseReceipt = IAOPurchaseReceipt(_aoPurchaseReceiptAddress);
	}

	/**
	 * @dev The AO sets NamePublicKey address
	 * @param _namePublicKeyAddress The address of NamePublicKey
	 */
	function setNamePublicKeyAddress(address _namePublicKeyAddress) public onlyTheAO {
		require (_namePublicKeyAddress != address(0));
		namePublicKeyAddress = _namePublicKeyAddress;
		_namePublicKey = INamePublicKey(_namePublicKeyAddress);
	}

	/**
	 * @dev The AO set the NameTAOPosition Address
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	function setNameTAOPositionAddress(address _nameTAOPositionAddress) public onlyTheAO {
		require (_nameTAOPositionAddress != address(0));
		nameTAOPositionAddress = _nameTAOPositionAddress;
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Calculate the content creator/host/The AO earning when request node buys the content.
	 *		Also at this stage, all of the earnings are stored in escrow
	 * @param _purchaseReceiptId The ID of the purchase receipt object
	 * @return true on success
	 */
	function calculateEarning(bytes32 _purchaseReceiptId) external inWhitelist returns (bool) {
		require (_aoPurchaseReceipt.isExist(_purchaseReceiptId));
		require (!purchaseReceiptEarningEscrowed[_purchaseReceiptId]);
		purchaseReceiptEarningEscrowed[_purchaseReceiptId] = true;

		// Split the payment earning between content creator and host and store them in escrow
		_escrowPaymentEarning(_purchaseReceiptId);

		// Calculate the inflation bonus earning for content creator/node/The AO in escrow
		_escrowInflationBonus(_purchaseReceiptId);
		return true;
	}

	/**
	 * @dev Release the payment earning and inflation bonus that is in escrow for specific PurchaseReceipt ID
	 * @param _purchaseReceiptId The purchase receipt ID to check
	 * @return true on success
	 */
	function releaseEarning(bytes32 _purchaseReceiptId) external inWhitelist returns (bool) {
		require (_aoPurchaseReceipt.isExist(_purchaseReceiptId));
		require (purchaseReceiptEarningEscrowed[_purchaseReceiptId] && !purchaseReceiptEarningUnescrowed[_purchaseReceiptId]);
		purchaseReceiptEarningUnescrowed[_purchaseReceiptId] = true;

		(bytes32 _contentHostId, bytes32 _stakedContentId, bytes32 _contentId,,, uint256 _amountPaidByBuyer,,,,) = _aoPurchaseReceipt.getById(_purchaseReceiptId);
		(, address _stakeOwner,,,,,,) = _aoStakedContent.getById(_stakedContentId);
		(,, address _host,,) = _aoContentHost.getById(_contentHostId);
		(, uint256 _fileSize,,,,,,,) = _aoContent.getById(_contentId);

		// Release the earning in escrow for stake owner
		_releaseEarning(_stakedContentId, _contentHostId, _purchaseReceiptId, _amountPaidByBuyer > _fileSize, _stakeOwner, 0);

		// Release the earning in escrow for host
		_releaseEarning(_stakedContentId, _contentHostId, _purchaseReceiptId, _amountPaidByBuyer > _fileSize, _host, 1);

		// Release the earning in escrow for The AO
		_releaseEarning(_stakedContentId, _contentHostId, _purchaseReceiptId, _amountPaidByBuyer > _fileSize, theAO, 2);
		return true;
	}

	/**
	 * @dev Return the earning information of a StakedContent ID
	 * @param _stakedContentId The ID of the staked content
	 * @return the total earning from staking this content
	 * @return the total earning from hosting this content
	 * @return the total The AO earning of this content
	 */
	function getTotalStakedContentEarning(bytes32 _stakedContentId) external view returns (uint256, uint256, uint256) {
		return (
			stakedContentStakeEarning[_stakedContentId],
			stakedContentHostEarning[_stakedContentId],
			stakedContentTheAOEarning[_stakedContentId]
		);
	}

	/***** INTERNAL METHODS *****/
	/**
	 * @dev Calculate the payment split for content creator/host and store them in escrow
	 * @param _purchaseReceiptId The ID of the purchase receipt object
	 */
	function _escrowPaymentEarning(bytes32 _purchaseReceiptId) internal {
		(uint256 _stakeOwnerEarning, uint256 _pathosAmount) = _escrowStakeOwnerPaymentEarning(_purchaseReceiptId);
		(uint256 _ethosAmount) = _escrowHostPaymentEarning(_purchaseReceiptId, _stakeOwnerEarning);
		_escrowTheAOPaymentEarning(_purchaseReceiptId, _pathosAmount, _ethosAmount);
	}

	/**
	 * @dev Calculate the payment split for content creator and store them in escrow
	 * @param _purchaseReceiptId The ID of the purchase receipt object
	 * @return The stake owner's earning amount
	 * @return The pathos earned from this transaction
	 */
	function _escrowStakeOwnerPaymentEarning(bytes32 _purchaseReceiptId) internal returns (uint256, uint256) {
		(uint256 inflationRate,,) = _getSettingVariables();
		(, bytes32 _stakedContentId, bytes32 _contentId, address _buyer, uint256 _price,,,,,) = _aoPurchaseReceipt.getById(_purchaseReceiptId);
		(, address _stakeOwner,,,, uint256 _profitPercentage,,) = _aoStakedContent.getById(_stakedContentId);

		Earning storage _ownerPurchaseReceiptStakeEarning = ownerPurchaseReceiptStakeEarnings[_stakeOwner][_purchaseReceiptId];
		_ownerPurchaseReceiptStakeEarning.purchaseReceiptId = _purchaseReceiptId;

		// Store how much the content creator (stake owner) earns in escrow
		// If content is AO Content Usage Type, stake owner earns 0%
		// and all profit goes to the serving host node
		_ownerPurchaseReceiptStakeEarning.paymentEarning = _aoContent.isAOContentUsageType(_contentId) ? (_price.mul(_profitPercentage)).div(AOLibrary.PERCENTAGE_DIVISOR()) : 0;
		// Pathos = Price X Node Share X Inflation Rate
		_ownerPurchaseReceiptStakeEarning.pathosAmount = _price.mul(AOLibrary.PERCENTAGE_DIVISOR().sub(_profitPercentage)).mul(inflationRate).div(AOLibrary.PERCENTAGE_DIVISOR()).div(AOLibrary.PERCENTAGE_DIVISOR());
		require (_aoIon.escrowFrom(_namePublicKey.getDefaultKey(_buyer), _namePublicKey.getDefaultKey(_stakeOwner), _ownerPurchaseReceiptStakeEarning.paymentEarning));
		emit PaymentEarningEscrowed(_stakeOwner, _purchaseReceiptId, _price, _profitPercentage, _ownerPurchaseReceiptStakeEarning.paymentEarning, 0);
		return (_ownerPurchaseReceiptStakeEarning.paymentEarning, _ownerPurchaseReceiptStakeEarning.pathosAmount);
	}

	/**
	 * @dev Calculate the payment split for host node and store them in escrow
	 * @param _purchaseReceiptId The ID of the purchase receipt object
	 * @param _stakeOwnerEarning The stake owner's earning amount
	 * @return The ethos earned from this transaction
	 */
	function _escrowHostPaymentEarning(bytes32 _purchaseReceiptId, uint256 _stakeOwnerEarning) internal returns (uint256) {
		(uint256 inflationRate,,) = _getSettingVariables();
		(bytes32 _contentHostId, bytes32 _stakedContentId, bytes32 _contentId, address _buyer, uint256 _price,,,,,) = _aoPurchaseReceipt.getById(_purchaseReceiptId);
		(,,,,, uint256 _profitPercentage,,) = _aoStakedContent.getById(_stakedContentId);
		(,, address _host,,) = _aoContentHost.getById(_contentHostId);

		// Store how much the node host earns in escrow
		Earning storage _ownerPurchaseReceiptHostEarning = ownerPurchaseReceiptHostEarnings[_host][_purchaseReceiptId];
		_ownerPurchaseReceiptHostEarning.purchaseReceiptId = _purchaseReceiptId;
		_ownerPurchaseReceiptHostEarning.paymentEarning = _price.sub(_stakeOwnerEarning);
		// Ethos = Price X Creator Share X Inflation Rate
		_ownerPurchaseReceiptHostEarning.ethosAmount = _price.mul(_profitPercentage).mul(inflationRate).div(AOLibrary.PERCENTAGE_DIVISOR()).div(AOLibrary.PERCENTAGE_DIVISOR());

		if (_aoContent.isAOContentUsageType(_contentId)) {
			require (_aoIon.escrowFrom(_namePublicKey.getDefaultKey(_buyer), _namePublicKey.getDefaultKey(_host), _ownerPurchaseReceiptHostEarning.paymentEarning));
		} else {
			// If not AO Content usage type, we want to mint to the host
			require (_aoIon.mintEscrow(_namePublicKey.getDefaultKey(_host), _ownerPurchaseReceiptHostEarning.paymentEarning));
		}
		emit PaymentEarningEscrowed(_host, _purchaseReceiptId, _price, AOLibrary.PERCENTAGE_DIVISOR().sub(_profitPercentage), _ownerPurchaseReceiptHostEarning.paymentEarning, 1);
		return _ownerPurchaseReceiptHostEarning.ethosAmount;
	}

	/**
	 * @dev Calculate the earning for The AO and store them in escrow
	 * @param _purchaseReceiptId The ID of the purchase receipt object
	 * @param _pathosAmount The amount of pathos earned by stake owner
	 * @param _ethosAmount The amount of ethos earned by host node
	 */
	function _escrowTheAOPaymentEarning(bytes32 _purchaseReceiptId, uint256 _pathosAmount, uint256 _ethosAmount) internal {
		(,,uint256 theAOEthosEarnedRate) = _getSettingVariables();
		(,,,, uint256 _price,,,,,) = _aoPurchaseReceipt.getById(_purchaseReceiptId);

		// Store how much The AO earns in escrow
		Earning storage _theAOPurchaseReceiptEarning = theAOPurchaseReceiptEarnings[_purchaseReceiptId];
		_theAOPurchaseReceiptEarning.purchaseReceiptId = _purchaseReceiptId;
		// Pathos + X% of Ethos
		_theAOPurchaseReceiptEarning.paymentEarning = _pathosAmount.add(_ethosAmount.mul(theAOEthosEarnedRate).div(AOLibrary.PERCENTAGE_DIVISOR()));
		require (_aoIon.mintEscrow(theAO, _theAOPurchaseReceiptEarning.paymentEarning));
		emit PaymentEarningEscrowed(theAO, _purchaseReceiptId, _price, 0, _theAOPurchaseReceiptEarning.paymentEarning, 2);
	}

	/**
	 * @dev Mint the inflation bonus for content creator/host/The AO and store them in escrow
	 * @param _purchaseReceiptId The ID of the purchase receipt object
	 */
	function _escrowInflationBonus(
		bytes32 _purchaseReceiptId
	) internal {
		(, uint256 theAOCut,) = _getSettingVariables();
		uint256 _inflationBonusAmount = _calculateInflationBonus(_purchaseReceiptId);
		(bytes32 _contentHostId, bytes32 _stakedContentId, bytes32 _contentId,,,,,,,) = _aoPurchaseReceipt.getById(_purchaseReceiptId);
		(, address _stakeOwner,,,, uint256 _profitPercentage,,) = _aoStakedContent.getById(_stakedContentId);
		(,, address _host,,) = _aoContentHost.getById(_contentHostId);

		if (_inflationBonusAmount > 0) {
			// Store how much the content creator earns in escrow
			uint256 _stakeOwnerInflationBonus = _aoContent.isAOContentUsageType(_contentId) ? (_inflationBonusAmount.mul(_profitPercentage)).div(AOLibrary.PERCENTAGE_DIVISOR()) : 0;
			Earning storage _ownerPurchaseReceiptStakeEarning = ownerPurchaseReceiptStakeEarnings[_stakeOwner][_purchaseReceiptId];
			_ownerPurchaseReceiptStakeEarning.inflationBonus = _stakeOwnerInflationBonus;
			require (_aoIon.mintEscrow(_namePublicKey.getDefaultKey(_stakeOwner), _ownerPurchaseReceiptStakeEarning.inflationBonus));
			emit InflationBonusEscrowed(_stakeOwner, _purchaseReceiptId, _inflationBonusAmount, _profitPercentage, _ownerPurchaseReceiptStakeEarning.inflationBonus, 0);

			// Store how much the host earns in escrow
			Earning storage _ownerPurchaseReceiptHostEarning = ownerPurchaseReceiptHostEarnings[_host][_purchaseReceiptId];
			_ownerPurchaseReceiptHostEarning.inflationBonus = _inflationBonusAmount.sub(_stakeOwnerInflationBonus);
			require (_aoIon.mintEscrow(_namePublicKey.getDefaultKey(_host), _ownerPurchaseReceiptHostEarning.inflationBonus));
			emit InflationBonusEscrowed(_host, _purchaseReceiptId, _inflationBonusAmount, AOLibrary.PERCENTAGE_DIVISOR().sub(_profitPercentage), _ownerPurchaseReceiptHostEarning.inflationBonus, 1);

			// Store how much the The AO earns in escrow
			Earning storage _theAOPurchaseReceiptEarning = theAOPurchaseReceiptEarnings[_purchaseReceiptId];
			_theAOPurchaseReceiptEarning.inflationBonus = (_inflationBonusAmount.mul(theAOCut)).div(AOLibrary.PERCENTAGE_DIVISOR());
			require (_aoIon.mintEscrow(theAO, _theAOPurchaseReceiptEarning.inflationBonus));
			emit InflationBonusEscrowed(theAO, _purchaseReceiptId, _inflationBonusAmount, theAOCut, _theAOPurchaseReceiptEarning.inflationBonus, 2);
		} else {
			emit InflationBonusEscrowed(_stakeOwner, _purchaseReceiptId, 0, _profitPercentage, 0, 0);
			emit InflationBonusEscrowed(_host, _purchaseReceiptId, 0, AOLibrary.PERCENTAGE_DIVISOR().sub(_profitPercentage), 0, 1);
			emit InflationBonusEscrowed(theAO, _purchaseReceiptId, 0, theAOCut, 0, 2);
		}
	}

	/**
	 * @dev Calculate the inflation bonus amount
	 * @param _purchaseReceiptId The ID of the PurchaseReceipt
	 * @return the bonus network amount
	 */
	function _calculateInflationBonus(bytes32 _purchaseReceiptId) internal view returns (uint256) {
		(uint256 inflationRate,,) = _getSettingVariables();
		(, bytes32 _stakedContentId,,,,,,,,) = _aoPurchaseReceipt.getById(_purchaseReceiptId);
		(,,uint256 _networkAmount, uint256 _primordialAmount, uint256 _primordialWeightedMultiplier,,,) = _aoStakedContent.getById(_stakedContentId);

		uint256 _networkBonus = _networkAmount.mul(inflationRate).div(AOLibrary.PERCENTAGE_DIVISOR());
		uint256 _primordialBonus = _primordialAmount.mul(_primordialWeightedMultiplier).div(AOLibrary.MULTIPLIER_DIVISOR()).mul(inflationRate).div(AOLibrary.PERCENTAGE_DIVISOR());
		return _networkBonus.add(_primordialBonus);
	}

	/**
	 * @dev Release the escrowed earning for a specific PurchaseReceipt ID for an account
	 * @param _stakedContentId The ID of the staked content
	 * @param _contentHostId The ID of the hosted content
	 * @param _purchaseReceiptId The purchase receipt ID
	 * @param _buyerPaidMoreThanFileSize Whether or not the request node paid more than filesize when buying the content
	 * @param _account The address of account that made the earning (content creator/host)
	 * @param _recipientType The type of the earning recipient (0 => content creator. 1 => host. 2 => theAO)
	 */
	function _releaseEarning(bytes32 _stakedContentId, bytes32 _contentHostId, bytes32 _purchaseReceiptId, bool _buyerPaidMoreThanFileSize, address _account, uint8 _recipientType) internal {
		// Make sure the recipient type is valid
		require (_recipientType >= 0 && _recipientType <= 2);

		uint256 _paymentEarning;
		uint256 _inflationBonus;
		uint256 _totalEarning;
		uint256 _pathosAmount;
		uint256 _ethosAmount;
		if (_recipientType == 0) {
			Earning storage _earning = ownerPurchaseReceiptStakeEarnings[_account][_purchaseReceiptId];
			_paymentEarning = _earning.paymentEarning;
			_inflationBonus = _earning.inflationBonus;
			_pathosAmount = _earning.pathosAmount;
			_earning.paymentEarning = 0;
			_earning.inflationBonus = 0;
			_earning.pathosAmount = 0;
			_earning.ethosAmount = 0;
			_totalEarning = _paymentEarning.add(_inflationBonus);

			// Update the global var settings
			totalStakedContentEarning = totalStakedContentEarning.add(_totalEarning);
			ownerStakedContentEarning[_account] = ownerStakedContentEarning[_account].add(_totalEarning);
			stakedContentStakeEarning[_stakedContentId] = stakedContentStakeEarning[_stakedContentId].add(_totalEarning);
			if (_buyerPaidMoreThanFileSize) {
				ownerContentPriceEarning[_account] = ownerContentPriceEarning[_account].add(_totalEarning);
			} else {
				ownerNetworkPriceEarning[_account] = ownerNetworkPriceEarning[_account].add(_totalEarning);
			}
			ownerInflationBonusAccrued[_account] = ownerInflationBonusAccrued[_account].add(_inflationBonus);

			// Reward the content creator/stake owner with some Pathos
			require (_pathos.mint(_account, _pathosAmount));
			emit PathosEarned(_account, _purchaseReceiptId, _pathosAmount);
			require (_aoIon.unescrowFrom(_namePublicKey.getDefaultKey(_account), _totalEarning));
		} else if (_recipientType == 1) {
			_earning = ownerPurchaseReceiptHostEarnings[_account][_purchaseReceiptId];
			_paymentEarning = _earning.paymentEarning;
			_inflationBonus = _earning.inflationBonus;
			_ethosAmount = _earning.ethosAmount;
			_earning.paymentEarning = 0;
			_earning.inflationBonus = 0;
			_earning.pathosAmount = 0;
			_earning.ethosAmount = 0;
			_totalEarning = _paymentEarning.add(_inflationBonus);

			// Update the global var settings
			totalContentHostEarning = totalContentHostEarning.add(_totalEarning);
			ownerContentHostEarning[_account] = ownerContentHostEarning[_account].add(_totalEarning);
			stakedContentHostEarning[_stakedContentId] = stakedContentHostEarning[_stakedContentId].add(_totalEarning);
			contentHostEarning[_contentHostId] = contentHostEarning[_contentHostId].add(_totalEarning);
			if (_buyerPaidMoreThanFileSize) {
				ownerContentPriceEarning[_account] = ownerContentPriceEarning[_account].add(_totalEarning);
			} else {
				ownerNetworkPriceEarning[_account] = ownerNetworkPriceEarning[_account].add(_totalEarning);
			}
			ownerInflationBonusAccrued[_account] = ownerInflationBonusAccrued[_account].add(_inflationBonus);

			// Reward the host node with some Ethos
			require (_ethos.mint(_account, _ethosAmount));
			emit EthosEarned(_account, _purchaseReceiptId, _ethosAmount);
			require (_aoIon.unescrowFrom(_namePublicKey.getDefaultKey(_account), _totalEarning));
		} else {
			_earning = theAOPurchaseReceiptEarnings[_purchaseReceiptId];
			_paymentEarning = _earning.paymentEarning;
			_inflationBonus = _earning.inflationBonus;
			_earning.paymentEarning = 0;
			_earning.inflationBonus = 0;
			_earning.pathosAmount = 0;
			_earning.ethosAmount = 0;
			_totalEarning = _paymentEarning.add(_inflationBonus);

			// Update the global var settings
			totalTheAOEarning = totalTheAOEarning.add(_totalEarning);
			ownerInflationBonusAccrued[_account] = ownerInflationBonusAccrued[_account].add(_inflationBonus);
			stakedContentTheAOEarning[_stakedContentId] = stakedContentTheAOEarning[_stakedContentId].add(_totalEarning);
			require (_aoIon.unescrowFrom(_account, _totalEarning));
		}
		emit EarningUnescrowed(_account, _purchaseReceiptId, _paymentEarning, _inflationBonus, _recipientType);
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
}
