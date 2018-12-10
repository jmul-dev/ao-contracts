pragma solidity ^0.4.24;

import './SafeMath.sol';
import './developed.sol';
import './AOToken.sol';
import './AOTreasury.sol';
import './AOEarning.sol';
import './AOLibrary.sol';
import './AOSetting.sol';

/**
 * @title AOContent
 *
 * The purpose of this contract is to allow content creator to stake network ERC20 AO tokens and/or primordial AO Tokens
 * on his/her content
 */
contract AOContent is developed {
	using SafeMath for uint256;

	bool public paused;
	bool public killed;
	uint256 public totalContents;
	uint256 public totalContentHosts;
	uint256 public totalStakedContents;
	uint256 public totalPurchaseReceipts;

	address public settingThoughtId;
	address public aoSettingAddress;
	address public baseDenominationAddress;
	address public treasuryAddress;
	address public earningAddress;
	address public nameFactoryAddress;

	AOToken internal _baseAO;
	AOTreasury internal _treasury;
	AOEarning internal _earning;
	AOSetting internal _aoSetting;

	struct Content {
		bytes32 contentId;
		address creator;
		/**
		 * baseChallenge is the content's PUBLIC KEY
		 * When a request node wants to be a host, it is required to send a signed base challenge (its content's PUBLIC KEY)
		 * so that the contract can verify the authenticity of the content by comparing what the contract has and what the request node
		 * submit
		 */
		string baseChallenge;
		uint256 fileSize;
		bytes32 contentUsageType; // i.e AO Content, Creative Commons, or T(AO) Content
		address taoId;
		bytes32 taoContentState; // i.e Submitted, Pending Review, Accepted to TAO
		uint8 updateTAOContentStateV;
		bytes32 updateTAOContentStateR;
		bytes32 updateTAOContentStateS;
		string extraData;
	}

	struct StakedContent {
		bytes32 stakeId;
		bytes32 contentId;
		address stakeOwner;
		uint256 networkAmount; // total network token staked in base denomination
		uint256 primordialAmount;	// the amount of primordial AO Token to stake (always in base denomination)
		uint256 primordialWeightedMultiplier;
		uint256 profitPercentage; // support up to 4 decimals, 100% = 1000000
		bool active; // true if currently staked, false when unstaked
		uint256 createdOnTimestamp;
	}

	struct ContentHost {
		bytes32 contentHostId;
		bytes32 stakeId;
		address host;
		/**
		 * encChallenge is the content's PUBLIC KEY unique to the host
		 */
		string encChallenge;
		string contentDatKey;
		string metadataDatKey;
	}

	struct PurchaseReceipt {
		bytes32 purchaseId;
		bytes32 contentHostId;
		address buyer;
		uint256 networkAmount; // total network token paid in base denomination
		string publicKey; // The public key provided by request node
		address publicAddress; // The public address provided by request node
		uint256 createdOnTimestamp;
	}

	// Mapping from Content index to the Content object
	mapping (uint256 => Content) private contents;

	// Mapping from content ID to index of the contents list
	mapping (bytes32 => uint256) private contentIndex;

	// Mapping from StakedContent index to the StakedContent object
	mapping (uint256 => StakedContent) private stakedContents;

	// Mapping from stake ID to index of the stakedContents list
	mapping (bytes32 => uint256) private stakedContentIndex;

	// Mapping from ContentHost index to the ContentHost object
	mapping (uint256 => ContentHost) private contentHosts;

	// Mapping from content host ID to index of the contentHosts list
	mapping (bytes32 => uint256) private contentHostIndex;

	// Mapping from PurchaseReceipt index to the PurchaseReceipt object
	mapping (uint256 => PurchaseReceipt) private purchaseReceipts;

	// Mapping from purchase ID to index of the purchaseReceipts list
	mapping (bytes32 => uint256) private purchaseReceiptIndex;

	// Mapping from buyer's content host ID to the buy ID
	// To check whether or not buyer has bought/paid for a content
	mapping (address => mapping (bytes32 => bytes32)) public buyerPurchaseReceipts;

	// Event to be broadcasted to public when `content` is stored
	event StoreContent(address indexed creator, bytes32 indexed contentId, uint256 fileSize, bytes32 contentUsageType);

	// Event to be broadcasted to public when `stakeOwner` stakes a new content
	event StakeContent(address indexed stakeOwner, bytes32 indexed stakeId, bytes32 indexed contentId, uint256 baseNetworkAmount, uint256 primordialAmount, uint256 primordialWeightedMultiplier, uint256 profitPercentage, uint256 createdOnTimestamp);

	// Event to be broadcasted to public when a node hosts a content
	event HostContent(address indexed host, bytes32 indexed contentHostId, bytes32 stakeId, string contentDatKey, string metadataDatKey);

	// Event to be broadcasted to public when `stakeOwner` updates the staked content's profit percentage
	event SetProfitPercentage(address indexed stakeOwner, bytes32 indexed stakeId, uint256 newProfitPercentage);

	// Event to be broadcasted to public when `stakeOwner` unstakes some network/primordial token from an existing content
	event UnstakePartialContent(address indexed stakeOwner, bytes32 indexed stakeId, bytes32 indexed contentId, uint256 remainingNetworkAmount, uint256 remainingPrimordialAmount, uint256 primordialWeightedMultiplier);

	// Event to be broadcasted to public when `stakeOwner` unstakes all token amount on an existing content
	event UnstakeContent(address indexed stakeOwner, bytes32 indexed stakeId);

	// Event to be broadcasted to public when `stakeOwner` re-stakes an existing content
	event StakeExistingContent(address indexed stakeOwner, bytes32 indexed stakeId, bytes32 indexed contentId, uint256 currentNetworkAmount, uint256 currentPrimordialAmount, uint256 currentPrimordialWeightedMultiplier);

	// Event to be broadcasted to public when a request node buys a content
	event BuyContent(address indexed buyer, bytes32 indexed purchaseId, bytes32 indexed contentHostId, uint256 paidNetworkAmount, string publicKey, address publicAddress, uint256 createdOnTimestamp);

	// Event to be broadcasted to public when Advocate/Listener/Speaker wants to update the TAO Content's State
	event UpdateTAOContentState(bytes32 indexed contentId, address indexed thoughtId, address signer, bytes32 taoContentState);

	// Event to be broadcasted to public when emergency mode is triggered
	event EscapeHatch();

	/**
	 * @dev Constructor function
	 * @param _settingThoughtId The Thought ID that controls the setting
	 * @param _aoSettingAddress The address of AOSetting
	 * @param _baseDenominationAddress The address of AO base token
	 * @param _treasuryAddress The address of AOTreasury
	 * @param _earningAddress The address of AOEarning
	 * @param _nameFactoryAddress The address of NameFactory
	 */
	constructor(address _settingThoughtId, address _aoSettingAddress, address _baseDenominationAddress, address _treasuryAddress, address _earningAddress, address _nameFactoryAddress) public {
		settingThoughtId = _settingThoughtId;
		aoSettingAddress = _aoSettingAddress;
		baseDenominationAddress = _baseDenominationAddress;
		treasuryAddress = _treasuryAddress;
		nameFactoryAddress = _nameFactoryAddress;

		_baseAO = AOToken(_baseDenominationAddress);
		_treasury = AOTreasury(_treasuryAddress);
		_earning = AOEarning(_earningAddress);
		_aoSetting = AOSetting(_aoSettingAddress);
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
	 * @dev Stake `_networkIntegerAmount` + `_networkFractionAmount` of network token in `_denomination` and/or `_primordialAmount` primordial Tokens for an AO Content
	 * @param _networkIntegerAmount The integer amount of network token to stake
	 * @param _networkFractionAmount The fraction amount of network token to stake
	 * @param _denomination The denomination of the network token, i.e ao, kilo, mega, etc.
	 * @param _primordialAmount The amount of primordial Token to stake
	 * @param _baseChallenge The base challenge string (PUBLIC KEY) of the content
	 * @param _encChallenge The encrypted challenge string (PUBLIC KEY) of the content unique to the host
	 * @param _contentDatKey The dat key of the content
	 * @param _metadataDatKey The dat key of the content's metadata
	 * @param _fileSize The size of the file
	 * @param _profitPercentage The percentage of profit the stake owner's media will charge
	 */
	function stakeAOContent(
		uint256 _networkIntegerAmount,
		uint256 _networkFractionAmount,
		bytes8 _denomination,
		uint256 _primordialAmount,
		string _baseChallenge,
		string _encChallenge,
		string _contentDatKey,
		string _metadataDatKey,
		uint256 _fileSize,
		uint256 _profitPercentage)
		public isActive {
		require (AOLibrary.canStake(treasuryAddress, _networkIntegerAmount, _networkFractionAmount, _denomination, _primordialAmount, _baseChallenge, _encChallenge, _contentDatKey, _metadataDatKey, _fileSize, _profitPercentage));
		(bytes32 _contentUsageType_aoContent,,,,,) = _getSettingVariables();

		/**
		 * 1. Store this content
		 * 2. Stake the network/primordial token on content
		 * 3. Add the node info that hosts this content (in this case the creator himself)
		 */
		_hostContent(
			msg.sender,
			_stakeContent(
				msg.sender,
				_storeContent(
					msg.sender,
					_baseChallenge,
					_fileSize,
					_contentUsageType_aoContent,
					address(0)
				),
				_networkIntegerAmount,
				_networkFractionAmount,
				_denomination,
				_primordialAmount,
				_profitPercentage
			),
			_encChallenge,
			_contentDatKey,
			_metadataDatKey
		);
	}

	/**
	 * @dev Stake `_networkIntegerAmount` + `_networkFractionAmount` of network token in `_denomination` and/or `_primordialAmount` primordial Tokens for a Creative Commons Content
	 * @param _networkIntegerAmount The integer amount of network token to stake
	 * @param _networkFractionAmount The fraction amount of network token to stake
	 * @param _denomination The denomination of the network token, i.e ao, kilo, mega, etc.
	 * @param _primordialAmount The amount of primordial Token to stake
	 * @param _baseChallenge The base challenge string (PUBLIC KEY) of the content
	 * @param _encChallenge The encrypted challenge string (PUBLIC KEY) of the content unique to the host
	 * @param _contentDatKey The dat key of the content
	 * @param _metadataDatKey The dat key of the content's metadata
	 * @param _fileSize The size of the file
	 */
	function stakeCreativeCommonsContent(
		uint256 _networkIntegerAmount,
		uint256 _networkFractionAmount,
		bytes8 _denomination,
		uint256 _primordialAmount,
		string _baseChallenge,
		string _encChallenge,
		string _contentDatKey,
		string _metadataDatKey,
		uint256 _fileSize)
		public isActive {
		require (AOLibrary.canStake(treasuryAddress, _networkIntegerAmount, _networkFractionAmount, _denomination, _primordialAmount, _baseChallenge, _encChallenge, _contentDatKey, _metadataDatKey, _fileSize, 0));
		require (_treasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination).add(_primordialAmount) == _fileSize);

		(,bytes32 _contentUsageType_creativeCommons,,,,) = _getSettingVariables();

		/**
		 * 1. Store this content
		 * 2. Stake the network/primordial token on content
		 * 3. Add the node info that hosts this content (in this case the creator himself)
		 */
		_hostContent(
			msg.sender,
			_stakeContent(
				msg.sender,
				_storeContent(
					msg.sender,
					_baseChallenge,
					_fileSize,
					_contentUsageType_creativeCommons,
					address(0)
				),
				_networkIntegerAmount,
				_networkFractionAmount,
				_denomination,
				_primordialAmount,
				0
			),
			_encChallenge,
			_contentDatKey,
			_metadataDatKey
		);
	}

	/**
	 * @dev Stake `_networkIntegerAmount` + `_networkFractionAmount` of network token in `_denomination` and/or `_primordialAmount` primordial Tokens for a T(AO) Content
	 * @param _networkIntegerAmount The integer amount of network token to stake
	 * @param _networkFractionAmount The fraction amount of network token to stake
	 * @param _denomination The denomination of the network token, i.e ao, kilo, mega, etc.
	 * @param _primordialAmount The amount of primordial Token to stake
	 * @param _baseChallenge The base challenge string (PUBLIC KEY) of the content
	 * @param _encChallenge The encrypted challenge string (PUBLIC KEY) of the content unique to the host
	 * @param _contentDatKey The dat key of the content
	 * @param _metadataDatKey The dat key of the content's metadata
	 * @param _fileSize The size of the file
	 * @param _taoId The TAO (Thought) ID for this content (if this is a T(AO) Content)
	 */
	function stakeTAOContent(
		uint256 _networkIntegerAmount,
		uint256 _networkFractionAmount,
		bytes8 _denomination,
		uint256 _primordialAmount,
		string _baseChallenge,
		string _encChallenge,
		string _contentDatKey,
		string _metadataDatKey,
		uint256 _fileSize,
		address _taoId)
		public isActive {
		require (AOLibrary.canStake(treasuryAddress, _networkIntegerAmount, _networkFractionAmount, _denomination, _primordialAmount, _baseChallenge, _encChallenge, _contentDatKey, _metadataDatKey, _fileSize, 0));
		require (
			_treasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination).add(_primordialAmount) == _fileSize &&
			AOLibrary.addressIsThoughtAdvocateListenerSpeaker(nameFactoryAddress, msg.sender, _taoId)
		);

		(,,bytes32 _contentUsageType_taoContent,,,) = _getSettingVariables();

		/**
		 * 1. Store this content
		 * 2. Stake the network/primordial token on content
		 * 3. Add the node info that hosts this content (in this case the creator himself)
		 */
		_hostContent(
			msg.sender,
			_stakeContent(
				msg.sender,
				_storeContent(
					msg.sender,
					_baseChallenge,
					_fileSize,
					_contentUsageType_taoContent,
					_taoId
				),
				_networkIntegerAmount,
				_networkFractionAmount,
				_denomination,
				_primordialAmount,
				0
			),
			_encChallenge,
			_contentDatKey,
			_metadataDatKey
		);
	}

	/**
	 * @dev Set profit percentage on existing staked content
	 *		Will throw error if this is a Creative Commons/T(AO) Content
	 * @param _stakeId The ID of the staked content
	 * @param _profitPercentage The new value to be set
	 */
	function setProfitPercentage(bytes32 _stakeId, uint256 _profitPercentage) public isActive {
		require (_profitPercentage <= AOLibrary.PERCENTAGE_DIVISOR());

		// Make sure the staked content exist
		require (stakedContentIndex[_stakeId] > 0);

		StakedContent storage _stakedContent = stakedContents[stakedContentIndex[_stakeId]];
		// Make sure the staked content owner is the same as the sender
		require (_stakedContent.stakeOwner == msg.sender);

		// Make sure we are updating profit percentage for AO Content only
		// Creative Commons/T(AO) Content has 0 profit percentage
		Content memory _content = contents[contentIndex[_stakedContent.contentId]];
		(bytes32 contentUsageType_aoContent,,,,,) = _getSettingVariables();
		require (_content.contentUsageType == contentUsageType_aoContent);

		_stakedContent.profitPercentage = _profitPercentage;

		emit SetProfitPercentage(msg.sender, _stakeId, _profitPercentage);
	}

	/**
	 * @dev Set extra data on existing content
	 * @param _contentId The ID of the content
	 * @param _extraData some extra information to send to the contract for a content
	 */
	function setContentExtraData(bytes32 _contentId, string _extraData) public isActive {
		// Make sure the content exist
		require (contentIndex[_contentId] > 0);

		Content storage _content = contents[contentIndex[_contentId]];
		// Make sure the content creator is the same as the sender
		require (_content.creator == msg.sender);

		_content.extraData = _extraData;
	}

	/**
	 * @dev Return content info at a given ID
	 * @param _contentId The ID of the content
	 * @return address of the creator
	 * @return file size of the content
	 * @return the content usage type, i.e AO Content, Creative Commons, or T(AO) Content
	 * @return The TAO ID for this content (if this is a T(AO) Content)
	 * @return The TAO Content state, i.e Submitted, Pending Review, or Accepted to TAO
	 * @return The V part of signature that is used to update the TAO Content State
	 * @return The R part of signature that is used to update the TAO Content State
	 * @return The S part of signature that is used to update the TAO Content State
	 * @return the extra information sent to the contract when creating a content
	 */
	function contentById(bytes32 _contentId) public view returns (address, uint256, bytes32, address, bytes32, uint8, bytes32, bytes32, string) {
		// Make sure the content exist
		require (contentIndex[_contentId] > 0);
		Content memory _content = contents[contentIndex[_contentId]];
		return (
			_content.creator,
			_content.fileSize,
			_content.contentUsageType,
			_content.taoId,
			_content.taoContentState,
			_content.updateTAOContentStateV,
			_content.updateTAOContentStateR,
			_content.updateTAOContentStateS,
			_content.extraData
		);
	}

	/**
	 * @dev Return content host info at a given ID
	 * @param _contentHostId The ID of the hosted content
	 * @return The ID of the staked content
	 * @return address of the host
	 * @return the dat key of the content
	 * @return the dat key of the content's metadata
	 */
	function contentHostById(bytes32 _contentHostId) public view returns (bytes32, address, string, string) {
		// Make sure the content host exist
		require (contentHostIndex[_contentHostId] > 0);
		ContentHost memory _contentHost = contentHosts[contentHostIndex[_contentHostId]];
		return (
			_contentHost.stakeId,
			_contentHost.host,
			_contentHost.contentDatKey,
			_contentHost.metadataDatKey
		);
	}

	/**
	 * @dev Return staked content information at a given ID
	 * @param _stakeId The ID of the staked content
	 * @return The ID of the content being staked
	 * @return address of the staked content's owner
	 * @return the network base token amount staked for this content
	 * @return the primordial token amount staked for this content
	 * @return the primordial weighted multiplier of the staked content
	 * @return the profit percentage of the content
	 * @return status of the staked content
	 * @return the timestamp when the staked content was created
	 */
	function stakedContentById(bytes32 _stakeId) public view returns (bytes32, address, uint256, uint256, uint256, uint256, bool, uint256) {
		// Make sure the staked content exist
		require (stakedContentIndex[_stakeId] > 0);

		StakedContent memory _stakedContent = stakedContents[stakedContentIndex[_stakeId]];
		return (
			_stakedContent.contentId,
			_stakedContent.stakeOwner,
			_stakedContent.networkAmount,
			_stakedContent.primordialAmount,
			_stakedContent.primordialWeightedMultiplier,
			_stakedContent.profitPercentage,
			_stakedContent.active,
			_stakedContent.createdOnTimestamp
		);
	}

	/**
	 * @dev Unstake existing staked content and refund partial staked amount to the stake owner
	 *		Use unstakeContent() to unstake all staked token amount. unstakePartialContent() can unstake only up to
	 *		the mininum required to pay the fileSize
	 * @param _stakeId The ID of the staked content
	 * @param _networkIntegerAmount The integer amount of network token to unstake
	 * @param _networkFractionAmount The fraction amount of network token to unstake
	 * @param _denomination The denomination of the network token, i.e ao, kilo, mega, etc.
	 * @param _primordialAmount The amount of primordial Token to unstake
	 */
	function unstakePartialContent(bytes32 _stakeId, uint256 _networkIntegerAmount, uint256 _networkFractionAmount, bytes8 _denomination, uint256 _primordialAmount) public isActive {
		// Make sure the staked content exist
		require (stakedContentIndex[_stakeId] > 0);
		require (_networkIntegerAmount > 0 || _networkFractionAmount > 0 || _primordialAmount > 0);

		StakedContent storage _stakedContent = stakedContents[stakedContentIndex[_stakeId]];
		Content memory _content = contents[contentIndex[_stakedContent.contentId]];

		// Make sure the staked content owner is the same as the sender
		require (_stakedContent.stakeOwner == msg.sender);
		// Make sure the staked content is currently active (staked) with some amounts
		require (_stakedContent.active == true && (_stakedContent.networkAmount > 0 || (_stakedContent.primordialAmount > 0 && _stakedContent.primordialWeightedMultiplier > 0)));
		// Make sure the staked content has enough balance to unstake
		require (AOLibrary.canUnstakePartial(treasuryAddress, _networkIntegerAmount, _networkFractionAmount, _denomination, _primordialAmount, _stakedContent.networkAmount, _stakedContent.primordialAmount, _content.fileSize));

		if (_denomination[0] != 0 && (_networkIntegerAmount > 0 || _networkFractionAmount > 0)) {
			uint256 _unstakeNetworkAmount = _treasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination);
			_stakedContent.networkAmount = _stakedContent.networkAmount.sub(_unstakeNetworkAmount);
			require (_baseAO.unstakeFrom(msg.sender, _unstakeNetworkAmount));
		}
		if (_primordialAmount > 0) {
			_stakedContent.primordialAmount = _stakedContent.primordialAmount.sub(_primordialAmount);
			require (_baseAO.unstakePrimordialTokenFrom(msg.sender, _primordialAmount, _stakedContent.primordialWeightedMultiplier));
		}
		emit UnstakePartialContent(_stakedContent.stakeOwner, _stakedContent.stakeId, _stakedContent.contentId, _stakedContent.networkAmount, _stakedContent.primordialAmount, _stakedContent.primordialWeightedMultiplier);
	}

	/**
	 * @dev Unstake existing staked content and refund the total staked amount to the stake owner
	 * @param _stakeId The ID of the staked content
	 */
	function unstakeContent(bytes32 _stakeId) public isActive {
		// Make sure the staked content exist
		require (stakedContentIndex[_stakeId] > 0);

		StakedContent storage _stakedContent = stakedContents[stakedContentIndex[_stakeId]];
		// Make sure the staked content owner is the same as the sender
		require (_stakedContent.stakeOwner == msg.sender);
		// Make sure the staked content is currently active (staked) with some amounts
		require (_stakedContent.active == true && (_stakedContent.networkAmount > 0 || (_stakedContent.primordialAmount > 0 && _stakedContent.primordialWeightedMultiplier > 0)));

		_stakedContent.active = false;

		if (_stakedContent.networkAmount > 0) {
			uint256 _unstakeNetworkAmount = _stakedContent.networkAmount;
			_stakedContent.networkAmount = 0;
			require (_baseAO.unstakeFrom(msg.sender, _unstakeNetworkAmount));
		}
		if (_stakedContent.primordialAmount > 0) {
			uint256 _primordialAmount = _stakedContent.primordialAmount;
			uint256 _primordialWeightedMultiplier = _stakedContent.primordialWeightedMultiplier;
			_stakedContent.primordialAmount = 0;
			_stakedContent.primordialWeightedMultiplier = 0;
			require (_baseAO.unstakePrimordialTokenFrom(msg.sender, _primordialAmount, _primordialWeightedMultiplier));
		}
		emit UnstakeContent(_stakedContent.stakeOwner, _stakeId);
	}

	/**
	 * @dev Stake existing content with more tokens (this is to increase the price)
	 *
	 * @param _stakeId The ID of the staked content
	 * @param _networkIntegerAmount The integer amount of network token to stake
	 * @param _networkFractionAmount The fraction amount of network token to stake
	 * @param _denomination The denomination of the network token, i.e ao, kilo, mega, etc.
	 * @param _primordialAmount The amount of primordial Token to stake. (The primordial weighted multiplier has to match the current staked weighted multiplier)
	 */
	function stakeExistingContent(bytes32 _stakeId, uint256 _networkIntegerAmount, uint256 _networkFractionAmount, bytes8 _denomination, uint256 _primordialAmount) public isActive {
		// Make sure the staked content exist
		require (stakedContentIndex[_stakeId] > 0);

		StakedContent storage _stakedContent = stakedContents[stakedContentIndex[_stakeId]];
		Content memory _content = contents[contentIndex[_stakedContent.contentId]];

		// Make sure the staked content owner is the same as the sender
		require (_stakedContent.stakeOwner == msg.sender);
		require (_networkIntegerAmount > 0 || _networkFractionAmount > 0 || _primordialAmount > 0);
		require (AOLibrary.canStakeExisting(treasuryAddress, _content.fileSize, _stakedContent.networkAmount.add(_stakedContent.primordialAmount), _networkIntegerAmount, _networkFractionAmount, _denomination, _primordialAmount));

		// Make sure we can stake primordial token
		// If we are currently staking an active staked content, then the stake owner's weighted multiplier has to match `stakedContent.primordialWeightedMultiplier`
		// i.e, can't use a combination of different weighted multiplier. Stake owner has to call unstakeContent() to unstake all tokens first
		if (_primordialAmount > 0 && _stakedContent.active && _stakedContent.primordialAmount > 0 && _stakedContent.primordialWeightedMultiplier > 0) {
			require (_baseAO.weightedMultiplierByAddress(msg.sender) == _stakedContent.primordialWeightedMultiplier);
		}

		_stakedContent.active = true;
		if (_denomination[0] != 0 && (_networkIntegerAmount > 0 || _networkFractionAmount > 0)) {
			uint256 _stakeNetworkAmount = _treasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination);
			_stakedContent.networkAmount = _stakedContent.networkAmount.add(_stakeNetworkAmount);
			require (_baseAO.stakeFrom(_stakedContent.stakeOwner, _stakeNetworkAmount));
		}
		if (_primordialAmount > 0) {
			_stakedContent.primordialAmount = _stakedContent.primordialAmount.add(_primordialAmount);

			// Primordial Token is the base AO Token
			_stakedContent.primordialWeightedMultiplier = _baseAO.weightedMultiplierByAddress(_stakedContent.stakeOwner);
			require (_baseAO.stakePrimordialTokenFrom(_stakedContent.stakeOwner, _primordialAmount, _stakedContent.primordialWeightedMultiplier));
		}

		emit StakeExistingContent(msg.sender, _stakedContent.stakeId, _stakedContent.contentId, _stakedContent.networkAmount, _stakedContent.primordialAmount, _stakedContent.primordialWeightedMultiplier);
	}

	/**
	 * @dev Determine the content price hosted by a host
	 * @param _contentHostId The content host ID to be checked
	 * @return the price of the content
	 */
	function contentHostPrice(bytes32 _contentHostId) public isActive view returns (uint256) {
		// Make sure content host exist
		require (contentHostIndex[_contentHostId] > 0);

		ContentHost memory _contentHost = contentHosts[contentHostIndex[_contentHostId]];
		StakedContent memory _stakedContent = stakedContents[stakedContentIndex[_contentHost.stakeId]];
		// Make sure content is currently staked
		require (_stakedContent.active == true && (_stakedContent.networkAmount > 0 || (_stakedContent.primordialAmount > 0 && _stakedContent.primordialWeightedMultiplier > 0)));
		return _stakedContent.networkAmount.add(_stakedContent.primordialAmount);
	}

	/**
	 * @dev Bring content in to the requesting node by sending network tokens to the contract to pay for the content
	 * @param _contentHostId The ID of hosted content
	 * @param _networkIntegerAmount The integer amount of network token to pay
	 * @param _networkFractionAmount The fraction amount of network token to pay
	 * @param _denomination The denomination of the network token, i.e ao, kilo, mega, etc.
	 * @param _publicKey The public key of the request node
	 * @param _publicAddress The public address of the request node
	 */
	function buyContent(bytes32 _contentHostId, uint256 _networkIntegerAmount, uint256 _networkFractionAmount, bytes8 _denomination, string _publicKey, address _publicAddress) public isActive {
		// Make sure the content host exist
		require (contentHostIndex[_contentHostId] > 0);

		// Make sure public key is not empty
		require (bytes(_publicKey).length > 0);

		// Make sure public address is valid
		require (_publicAddress != address(0));

		ContentHost memory _contentHost = contentHosts[contentHostIndex[_contentHostId]];
		StakedContent memory _stakedContent = stakedContents[stakedContentIndex[_contentHost.stakeId]];

		// Make sure the content currently has stake
		require (_stakedContent.active == true && (_stakedContent.networkAmount > 0 || (_stakedContent.primordialAmount > 0 && _stakedContent.primordialWeightedMultiplier > 0)));

		// Make sure the buyer has not bought this content previously
		require (buyerPurchaseReceipts[msg.sender][_contentHostId][0] == 0);

		// Make sure the token amount can pay for the content price
		require (_denomination[0] != 0 && (_networkIntegerAmount > 0 || _networkFractionAmount > 0));
		require (AOLibrary.canBuy(treasuryAddress, _stakedContent.networkAmount.add(_stakedContent.primordialAmount), _networkIntegerAmount, _networkFractionAmount, _denomination));

		// Increment totalPurchaseReceipts;
		totalPurchaseReceipts++;

		// Generate purchaseId
		bytes32 _purchaseId = keccak256(abi.encodePacked(this, msg.sender, _contentHostId));
		PurchaseReceipt storage _purchaseReceipt = purchaseReceipts[totalPurchaseReceipts];

		// Make sure the node doesn't buy the same content twice
		require (_purchaseReceipt.buyer == address(0));

		_purchaseReceipt.purchaseId = _purchaseId;
		_purchaseReceipt.contentHostId = _contentHostId;
		_purchaseReceipt.buyer = msg.sender;
		// Update the receipt with the correct network amount
		_purchaseReceipt.networkAmount = _stakedContent.networkAmount.add(_stakedContent.primordialAmount);
		_purchaseReceipt.publicKey = _publicKey;
		_purchaseReceipt.publicAddress = _publicAddress;
		_purchaseReceipt.createdOnTimestamp = now;

		purchaseReceiptIndex[_purchaseId] = totalPurchaseReceipts;
		buyerPurchaseReceipts[msg.sender][_contentHostId] = _purchaseId;

		// Calculate content creator/host/foundation earning from this purchase and store them in escrow
		require (_earning.calculateEarning(
			msg.sender,
			_purchaseId,
			_stakedContent.networkAmount,
			_stakedContent.primordialAmount,
			_stakedContent.primordialWeightedMultiplier,
			_stakedContent.profitPercentage,
			contents[contentIndex[_stakedContent.contentId]].fileSize,
			_stakedContent.stakeOwner,
			_contentHost.host
		));

		emit BuyContent(_purchaseReceipt.buyer, _purchaseReceipt.purchaseId, _purchaseReceipt.contentHostId, _purchaseReceipt.networkAmount, _purchaseReceipt.publicKey, _purchaseReceipt.publicAddress, _purchaseReceipt.createdOnTimestamp);
	}

	/**
	 * @dev Return purchase receipt info at a given ID
	 * @param _purchaseId The ID of the purchased content
	 * @return The ID of the content host
	 * @return address of the buyer
	 * @return paid network amount
	 * @return request node's public key
	 * @return request node's public address
	 * @return created on timestamp
	 */
	function purchaseReceiptById(bytes32 _purchaseId) public view returns (bytes32, address, uint256, string, address, uint256) {
		// Make sure the purchase receipt exist
		require (purchaseReceiptIndex[_purchaseId] > 0);
		PurchaseReceipt memory _purchaseReceipt = purchaseReceipts[purchaseReceiptIndex[_purchaseId]];
		return (
			_purchaseReceipt.contentHostId,
			_purchaseReceipt.buyer,
			_purchaseReceipt.networkAmount,
			_purchaseReceipt.publicKey,
			_purchaseReceipt.publicAddress,
			_purchaseReceipt.createdOnTimestamp
		);
	}

	/**
	 * @dev Request node wants to become a distribution node after buying the content
	 *		Also, if this transaction succeeds, contract will release all of the earnings that are
	 *		currently in escrow for content creator/host/foundation
	 */
	function becomeHost(
		bytes32 _purchaseId,
		uint8 _baseChallengeV,
		bytes32 _baseChallengeR,
		bytes32 _baseChallengeS,
		string _encChallenge,
		string _contentDatKey,
		string _metadataDatKey
	) public isActive {
		// Make sure the purchase receipt exist
		require (purchaseReceiptIndex[_purchaseId] > 0);

		PurchaseReceipt memory _purchaseReceipt = purchaseReceipts[purchaseReceiptIndex[_purchaseId]];
		bytes32 _stakeId = contentHosts[contentHostIndex[_purchaseReceipt.contentHostId]].stakeId;
		bytes32 _contentId = stakedContents[stakedContentIndex[_stakeId]].contentId;

		// Make sure the purchase receipt owner is the same as the sender
		require (_purchaseReceipt.buyer == msg.sender);

		// Verify that the file is not tampered by validating the base challenge signature
		// The signed base challenge key should match the one from content creator
		Content memory _content = contents[contentIndex[_contentId]];
		require (AOLibrary.getBecomeHostSignatureAddress(address(this), _content.baseChallenge, _baseChallengeV, _baseChallengeR, _baseChallengeS) == _purchaseReceipt.publicAddress);

		_hostContent(msg.sender, _stakeId, _encChallenge, _contentDatKey, _metadataDatKey);

		// Release earning from escrow
		require (_earning.releaseEarning(_stakeId, _purchaseReceipt.contentHostId, _purchaseId, _purchaseReceipt.networkAmount, _content.fileSize, stakedContents[stakedContentIndex[_stakeId]].stakeOwner, contentHosts[contentHostIndex[_purchaseReceipt.contentHostId]].host));
	}

	/**
	 * @dev Update the TAO Content State of a T(AO) Content
	 * @param _contentId The ID of the Content
	 * @param _thoughtId The ID of the Thought that initiates the update
	 * @param _taoContentState The TAO Content state value, i.e Submitted, Pending Review, or Accepted to TAO
	 * @param _updateTAOContentStateV The V part of the signature for this update
	 * @param _updateTAOContentStateR The R part of the signature for this update
	 * @param _updateTAOContentStateS The S part of the signature for this update
	 */
	function updateTAOContentState(
		bytes32 _contentId,
		address _thoughtId,
		bytes32 _taoContentState,
		uint8 _updateTAOContentStateV,
		bytes32 _updateTAOContentStateR,
		bytes32 _updateTAOContentStateS
	) public isActive {
		// Make sure the content exist
		require (contentIndex[_contentId] > 0);
		require (AOLibrary.isThought(_thoughtId));
		(,,,bytes32 taoContentState_submitted, bytes32 taoContentState_pendingReview, bytes32 taoContentState_acceptedToTAO) = _getSettingVariables();
		require (_taoContentState == taoContentState_submitted || _taoContentState == taoContentState_pendingReview || _taoContentState == taoContentState_acceptedToTAO);

		address _signatureAddress = AOLibrary.getUpdateTAOContentStateSignatureAddress(address(this), _contentId, _thoughtId, _taoContentState, _updateTAOContentStateV, _updateTAOContentStateR, _updateTAOContentStateS);

		Content storage _content = contents[contentIndex[_contentId]];

		// Make sure that the signature address is one of content's TAO ID's Advocate/Listener/Speaker
		require (AOLibrary.addressIsThoughtAdvocateListenerSpeaker(nameFactoryAddress, _signatureAddress, _content.taoId));

		_content.taoContentState = _taoContentState;
		_content.updateTAOContentStateV = _updateTAOContentStateV;
		_content.updateTAOContentStateR = _updateTAOContentStateR;
		_content.updateTAOContentStateS = _updateTAOContentStateS;

		emit UpdateTAOContentState(_contentId, _thoughtId, _signatureAddress, _taoContentState);
	}

	/***** INTERNAL METHODS *****/
	/**
	 * @dev Store the content information (content creation during staking)
	 * @param _creator the address of the content creator
	 * @param _baseChallenge The base challenge string (PUBLIC KEY) of the content
	 * @param _fileSize The size of the file
	 * @param _contentUsageType The content usage type, i.e AO Content, Creative Commons, or T(AO) Content
	 * @param _taoId The TAO (Thought) ID for this content (if this is a T(AO) Content)
	 * @return the ID of the content
	 */
	function _storeContent(address _creator, string _baseChallenge, uint256 _fileSize, bytes32 _contentUsageType, address _taoId) internal returns (bytes32) {
		// Increment totalContents
		totalContents++;

		// Generate contentId
		bytes32 _contentId = keccak256(abi.encodePacked(this, _creator, totalContents));
		Content storage _content = contents[totalContents];

		// Make sure the node does't store the same content twice
		require (_content.creator == address(0));

		(,,bytes32 contentUsageType_taoContent, bytes32 taoContentState_submitted,,) = _getSettingVariables();

		_content.contentId = _contentId;
		_content.creator = _creator;
		_content.baseChallenge = _baseChallenge;
		_content.fileSize = _fileSize;
		_content.contentUsageType = _contentUsageType;

		// If this is a TAO Content
		if (_contentUsageType == contentUsageType_taoContent) {
			_content.taoContentState = taoContentState_submitted;
			_content.taoId = _taoId;
		}

		contentIndex[_contentId] = totalContents;

		emit StoreContent(_content.creator, _content.contentId, _content.fileSize, _content.contentUsageType);
		return _content.contentId;
	}

	/**
	 * @dev Add the distribution node info that hosts the content
	 * @param _host the address of the host
	 * @param _stakeId The ID of the staked content
	 * @param _encChallenge The encrypted challenge string (PUBLIC KEY) of the content unique to the host
	 * @param _contentDatKey The dat key of the content
	 * @param _metadataDatKey The dat key of the content's metadata
	 */
	function _hostContent(address _host, bytes32 _stakeId, string _encChallenge, string _contentDatKey, string _metadataDatKey) internal {
		require (bytes(_encChallenge).length > 0);
		require (bytes(_contentDatKey).length > 0);
		require (bytes(_metadataDatKey).length > 0);
		require (stakedContentIndex[_stakeId] > 0);

		// Increment totalContentHosts
		totalContentHosts++;

		// Generate contentId
		bytes32 _contentHostId = keccak256(abi.encodePacked(this, _host, _stakeId));

		ContentHost storage _contentHost = contentHosts[totalContentHosts];

		// Make sure the node doesn't host the same content twice
		require (_contentHost.host == address(0));

		_contentHost.contentHostId = _contentHostId;
		_contentHost.stakeId = _stakeId;
		_contentHost.host = _host;
		_contentHost.encChallenge = _encChallenge;
		_contentHost.contentDatKey = _contentDatKey;
		_contentHost.metadataDatKey = _metadataDatKey;

		contentHostIndex[_contentHostId] = totalContentHosts;

		emit HostContent(_contentHost.host, _contentHost.contentHostId, _contentHost.stakeId, _contentHost.contentDatKey, _contentHost.metadataDatKey);
	}

	/**
	 * @dev actual staking the content
	 * @param _stakeOwner the address that stake the content
	 * @param _contentId The ID of the content
	 * @param _networkIntegerAmount The integer amount of network token to stake
	 * @param _networkFractionAmount The fraction amount of network token to stake
	 * @param _denomination The denomination of the network token, i.e ao, kilo, mega, etc.
	 * @param _primordialAmount The amount of primordial Token to stake
	 * @param _profitPercentage The percentage of profit the stake owner's media will charge
	 * @return the newly created staked content ID
	 */
	function _stakeContent(address _stakeOwner, bytes32 _contentId, uint256 _networkIntegerAmount, uint256 _networkFractionAmount, bytes8 _denomination, uint256 _primordialAmount, uint256 _profitPercentage) internal returns (bytes32) {
		// Increment totalStakedContents
		totalStakedContents++;

		// Generate stakeId
		bytes32 _stakeId = keccak256(abi.encodePacked(this, _stakeOwner, _contentId));
		StakedContent storage _stakedContent = stakedContents[totalStakedContents];

		// Make sure the node doesn't stake the same content twice
		require (_stakedContent.stakeOwner == address(0));

		_stakedContent.stakeId = _stakeId;
		_stakedContent.contentId = _contentId;
		_stakedContent.stakeOwner = _stakeOwner;
		_stakedContent.profitPercentage = _profitPercentage;
		_stakedContent.active = true;
		_stakedContent.createdOnTimestamp = now;

		stakedContentIndex[_stakeId] = totalStakedContents;

		if (_denomination[0] != 0 && (_networkIntegerAmount > 0 || _networkFractionAmount > 0)) {
			_stakedContent.networkAmount = _treasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination);
			require (_baseAO.stakeFrom(_stakeOwner, _stakedContent.networkAmount));
		}
		if (_primordialAmount > 0) {
			_stakedContent.primordialAmount = _primordialAmount;

			// Primordial Token is the base AO Token
			_stakedContent.primordialWeightedMultiplier = _baseAO.weightedMultiplierByAddress(_stakedContent.stakeOwner);
			require (_baseAO.stakePrimordialTokenFrom(_stakedContent.stakeOwner, _primordialAmount, _stakedContent.primordialWeightedMultiplier));
		}

		emit StakeContent(_stakedContent.stakeOwner, _stakedContent.stakeId, _stakedContent.contentId, _stakedContent.networkAmount, _stakedContent.primordialAmount, _stakedContent.primordialWeightedMultiplier, _stakedContent.profitPercentage, _stakedContent.createdOnTimestamp);

		return _stakedContent.stakeId;
	}

	/**
	 * @dev Get setting variables
	 * @return contentUsageType_aoContent Content Usage Type = AO Content
	 * @return contentUsageType_creativeCommons Content Usage Type = Creative Commons
	 * @return contentUsageType_taoContent Content Usage Type = T(AO) Content
	 * @return taoContentState_submitted TAO Content State = Submitted
	 * @return taoContentState_pendingReview TAO Content State = Pending Review
	 * @return taoContentState_acceptedToTAO TAO Content State = Accepted to TAO
	 */
	function _getSettingVariables() internal view returns (bytes32, bytes32, bytes32, bytes32, bytes32, bytes32) {
		(,,,bytes32 contentUsageType_aoContent,) = _aoSetting.getSettingValuesByThoughtName(settingThoughtId, 'contentUsageType_aoContent');
		(,,,bytes32 contentUsageType_creativeCommons,) = _aoSetting.getSettingValuesByThoughtName(settingThoughtId, 'contentUsageType_creativeCommons');
		(,,,bytes32 contentUsageType_taoContent,) = _aoSetting.getSettingValuesByThoughtName(settingThoughtId, 'contentUsageType_taoContent');
		(,,,bytes32 taoContentState_submitted,) = _aoSetting.getSettingValuesByThoughtName(settingThoughtId, 'taoContentState_submitted');
		(,,,bytes32 taoContentState_pendingReview,) = _aoSetting.getSettingValuesByThoughtName(settingThoughtId, 'taoContentState_pendingReview');
		(,,,bytes32 taoContentState_acceptedToTAO,) = _aoSetting.getSettingValuesByThoughtName(settingThoughtId, 'taoContentState_acceptedToTAO');

		return (
			contentUsageType_aoContent,
			contentUsageType_creativeCommons,
			contentUsageType_taoContent,
			taoContentState_submitted,
			taoContentState_pendingReview,
			taoContentState_acceptedToTAO
		);
	}
}
