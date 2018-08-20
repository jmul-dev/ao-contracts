pragma solidity ^0.4.24;

import './SafeMath.sol';
import './owned.sol';
import './AOToken.sol';
import './AOTreasury.sol';
import './AOEarning.sol';
import './AOLibrary.sol';

/**
 * @title AOContent
 *
 * The purpose of this contract is to allow content creator to stake network ERC20 AO tokens and/or primordial AO Tokens
 * on his/her content
 */
contract AOContent is owned {
	using SafeMath for uint256;

	bool public paused;
	bool public killed;
	uint256 constant public PERCENTAGE_DIVISOR = 10 ** 6; // 100% = 1000000
	uint256 public totalContents;
	uint256 public totalContentHosts;
	uint256 public totalStakedContents;
	uint256 public totalPurchaseReceipts;

	address public baseDenominationAddress;
	address public treasuryAddress;
	address public earningAddress;
	AOToken internal _baseAO;
	AOTreasury internal _treasury;
	AOEarning internal _earning;

	struct Content {
		bytes32 contentId;
		address creator;
		/**
		 * baseChallenge is the content's PUBLIC KEY
		 * When a request node wants to be a host, we require it to send a signed base challenge (its content's PUBLIC KEY)
		 * so that we can verify the authenticity of the content by comparing what the contract has and what the request node
		 * submit
		 */
		string baseChallenge;
		uint256 fileSize;
	}

	struct StakedContent {
		bytes32 stakeId;
		bytes32 contentId;
		address stakeOwner;
		uint256 networkAmount; // total network token staked in base denomination
		uint256 primordialAmount;	// the amount of primordial AO Token to stake (always in base denomination)
		uint256 primordialWeightedIndex;
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
	event StoreContent(address indexed creator, bytes32 indexed contentId, uint256 fileSize);

	// Event to be broadcasted to public when `stakeOwner` stakes a new content
	event StakeContent(address indexed stakeOwner, bytes32 indexed stakeId, bytes32 indexed contentId, uint256 baseNetworkAmount, uint256 primordialAmount, uint256 primordialWeightedIndex, uint256 profitPercentage, uint256 createdOnTimestamp);

	// Event to be broadcasted to public when a node hosts a content
	event HostContent(address indexed host, bytes32 indexed contentHostId, bytes32 stakeId, string contentDatKey, string metadataDatKey);

	// Event to be broadcasted to public when `stakeOwner` updates the staked content's profit percentage
	event SetProfitPercentage(address indexed stakeOwner, bytes32 indexed stakeId, uint256 newProfitPercentage);

	// Event to be broadcasted to public when `stakeOwner` unstakes some network/primordial token from an existing content
	event UnstakePartialContent(address indexed stakeOwner, bytes32 indexed stakeId, bytes32 indexed contentId, uint256 remainingNetworkAmount, uint256 remainingPrimordialAmount, uint256 primordialWeightedIndex);

	// Event to be broadcasted to public when `stakeOwner` unstakes all token amount on an existing content
	event UnstakeContent(address indexed stakeOwner, bytes32 indexed stakeId);

	// Event to be broadcasted to public when `stakeOwner` re-stakes an existing content
	event StakeExistingContent(address indexed stakeOwner, bytes32 indexed stakeId, bytes32 indexed contentId, uint256 currentNetworkAmount, uint256 currentPrimordialAmount, uint256 currentPrimordialWeightedIndex);

	// Event to be broadcasted to public when a request node buys a content
	event BuyContent(address indexed buyer, bytes32 indexed purchaseId, bytes32 indexed contentHostId, uint256 paidNetworkAmount, uint256 createdOnTimestamp);

	// Event to be broadcasted to public when emergency mode is triggered
	event EscapeHatch();

	/**
	 * @dev Constructor function
	 * @param _baseDenominationAddress The address of AO base token
	 * @param _treasuryAddress The address of AOTreasury
	 * @param _earningAddress The address of AOEarning
	 */
	constructor(address _baseDenominationAddress, address _treasuryAddress, address _earningAddress) public {
		baseDenominationAddress = _baseDenominationAddress;
		treasuryAddress = _treasuryAddress;
		_baseAO = AOToken(_baseDenominationAddress);
		_treasury = AOTreasury(_treasuryAddress);
		_earning = AOEarning(_earningAddress);
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
	 * @dev Stake `_networkIntegerAmount` + `_networkFractionAmount` of network token in `_denomination` and/or `_primordialAmount` primordial Tokens for a content
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
	function stakeContent(
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
		public
		isActive {
		require (bytes(_baseChallenge).length > 0);
		require (_fileSize > 0);
		require (_networkIntegerAmount > 0 || _networkFractionAmount > 0 || _primordialAmount > 0);
		require (AOLibrary.canStake(treasuryAddress, _networkIntegerAmount, _networkFractionAmount, _denomination, _primordialAmount, _fileSize) == true);
		require (_profitPercentage <= PERCENTAGE_DIVISOR);

		// Store this content
		bytes32 _contentId = _storeContent(msg.sender, _baseChallenge, _fileSize);

		// Stake the network/primordial token on content
		bytes32 _stakeId = _stakeContent(msg.sender, _contentId, _networkIntegerAmount, _networkFractionAmount, _denomination, _primordialAmount, _profitPercentage);

		// Add the node info that hosts this content (in this case the creator himself)
		_hostContent(msg.sender, _stakeId, _encChallenge, _contentDatKey, _metadataDatKey);
	}

	/**
	 * @dev Set profit percentage on existing staked content
	 * @param _stakeId The ID of the staked content
	 * @param _profitPercentage The new value to be set
	 */
	function setProfitPercentage(bytes32 _stakeId, uint256 _profitPercentage) public isActive {
		require (_profitPercentage <= PERCENTAGE_DIVISOR);

		// Make sure the staked content exist
		require (stakedContentIndex[_stakeId] > 0);

		StakedContent storage _stakedContent = stakedContents[stakedContentIndex[_stakeId]];
		// Make sure the staked content owner is the same as the sender
		require (_stakedContent.stakeOwner == msg.sender);

		_stakedContent.profitPercentage = _profitPercentage;

		emit SetProfitPercentage(msg.sender, _stakeId, _profitPercentage);
	}

	/**
	 * @dev Return content info at a given ID
	 * @param _contentId The ID of the content
	 * @return address of the creator
	 * @return file size of the content
	 */
	function contentById(bytes32 _contentId) public view returns (address, uint256) {
		// Make sure the content exist
		require (contentIndex[_contentId] > 0);
		Content memory _content = contents[contentIndex[_contentId]];
		return (
			_content.creator,
			_content.fileSize
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
	 * @return the primordial weighted index of the staked content
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
			_stakedContent.primordialWeightedIndex,
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
		require (_stakedContent.active == true && (_stakedContent.networkAmount > 0 || (_stakedContent.primordialAmount > 0 && _stakedContent.primordialWeightedIndex > 0)));
		// Make sure the staked content has enough balance to unstake
		require (AOLibrary.canUnstakePartial(treasuryAddress, _networkIntegerAmount, _networkFractionAmount, _denomination, _primordialAmount, _stakedContent.networkAmount, _stakedContent.primordialAmount, _content.fileSize));

		if (_denomination[0] != 0 && (_networkIntegerAmount > 0 || _networkFractionAmount > 0)) {
			uint256 _unstakeNetworkAmount = _treasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination);
			_stakedContent.networkAmount = _stakedContent.networkAmount.sub(_unstakeNetworkAmount);
			require (_baseAO.unstakeFrom(msg.sender, _unstakeNetworkAmount));
		}
		if (_primordialAmount > 0) {
			_stakedContent.primordialAmount = _stakedContent.primordialAmount.sub(_primordialAmount);
			require (_baseAO.unstakeIcoTokenFrom(msg.sender, _primordialAmount, _stakedContent.primordialWeightedIndex));
		}
		emit UnstakePartialContent(_stakedContent.stakeOwner, _stakedContent.stakeId, _stakedContent.contentId, _stakedContent.networkAmount, _stakedContent.primordialAmount, _stakedContent.primordialWeightedIndex);
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
		require (_stakedContent.active == true && (_stakedContent.networkAmount > 0 || (_stakedContent.primordialAmount > 0 && _stakedContent.primordialWeightedIndex > 0)));

		_stakedContent.active = false;

		if (_stakedContent.networkAmount > 0) {
			uint256 _unstakeNetworkAmount = _stakedContent.networkAmount;
			_stakedContent.networkAmount = 0;
			require (_baseAO.unstakeFrom(msg.sender, _unstakeNetworkAmount));
		}
		if (_stakedContent.primordialAmount > 0) {
			uint256 _primordialAmount = _stakedContent.primordialAmount;
			uint256 _primordialWeightedIndex = _stakedContent.primordialWeightedIndex;
			_stakedContent.primordialAmount = 0;
			_stakedContent.primordialWeightedIndex = 0;
			require (_baseAO.unstakeIcoTokenFrom(msg.sender, _primordialAmount, _primordialWeightedIndex));
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
	 * @param _primordialAmount The amount of primordial Token to stake. (The primordial weighted index has to match the current staked weighted index)
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
		// If we are currently staking an active staked content, then the stake owner's weighted index has to match `stakedContent.primordialWeightedIndex`
		// i.e, can't use a combination of different weighted index. Stake owner has to call unstakeContent() to unstake all tokens first
		if (_primordialAmount > 0 && _stakedContent.active && _stakedContent.primordialAmount > 0 && _stakedContent.primordialWeightedIndex > 0) {
			require (_baseAO.weightedIndexByAddress(msg.sender) == _stakedContent.primordialWeightedIndex);
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
			_stakedContent.primordialWeightedIndex = _baseAO.weightedIndexByAddress(_stakedContent.stakeOwner);
			require (_baseAO.stakeIcoTokenFrom(_stakedContent.stakeOwner, _primordialAmount, _stakedContent.primordialWeightedIndex));
		}

		emit StakeExistingContent(msg.sender, _stakedContent.stakeId, _stakedContent.contentId, _stakedContent.networkAmount, _stakedContent.primordialAmount, _stakedContent.primordialWeightedIndex);
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
		require (_stakedContent.active == true && (_stakedContent.networkAmount > 0 || (_stakedContent.primordialAmount > 0 && _stakedContent.primordialWeightedIndex > 0)));
		return _stakedContent.networkAmount.add(_stakedContent.primordialAmount);
	}

	/**
	 * @dev Bring content in to the requesting node by sending network tokens to the contract to pay for the content
	 * @param _contentHostId The ID of hosted content
	 * @param _networkIntegerAmount The integer amount of network token to pay
	 * @param _networkFractionAmount The fraction amount of network token to pay
	 * @param _denomination The denomination of the network token, i.e ao, kilo, mega, etc.
	 */
	function buyContent(bytes32 _contentHostId, uint256 _networkIntegerAmount, uint256 _networkFractionAmount, bytes8 _denomination) public isActive {
		// Make sure the content host exist
		require (contentHostIndex[_contentHostId] > 0);

		ContentHost memory _contentHost = contentHosts[contentHostIndex[_contentHostId]];
		StakedContent memory _stakedContent = stakedContents[stakedContentIndex[_contentHost.stakeId]];

		// Make sure the content currently has stake
		require (_stakedContent.active == true && (_stakedContent.networkAmount > 0 || (_stakedContent.primordialAmount > 0 && _stakedContent.primordialWeightedIndex > 0)));

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

		// Make sure we don't buy the same content twice
		require (_purchaseReceipt.buyer == address(0));

		_purchaseReceipt.purchaseId = _purchaseId;
		_purchaseReceipt.contentHostId = _contentHostId;
		_purchaseReceipt.buyer = msg.sender;
		// Update the receipt with the correct network amount
		_purchaseReceipt.networkAmount = _stakedContent.networkAmount.add(_stakedContent.primordialAmount);
		_purchaseReceipt.createdOnTimestamp = now;

		purchaseReceiptIndex[_purchaseId] = totalPurchaseReceipts;
		buyerPurchaseReceipts[msg.sender][_contentHostId] = _purchaseId;

		// Calculate content creator/host/foundation earning from this purchase and store them in escrow
		require (_earning.calculateEarning(
			msg.sender,
			_purchaseId,
			_stakedContent.networkAmount,
			_stakedContent.primordialAmount,
			_stakedContent.primordialWeightedIndex,
			_stakedContent.profitPercentage,
			_stakedContent.stakeOwner,
			_contentHost.host
		));

		emit BuyContent(_purchaseReceipt.buyer, _purchaseReceipt.purchaseId, _purchaseReceipt.contentHostId, _purchaseReceipt.networkAmount, _purchaseReceipt.createdOnTimestamp);
	}

	/**
	 * @dev Return purchase receipt info at a given ID
	 * @param _purchaseId The ID of the purchased content
	 * @return The ID of the content host
	 * @return address of the buyer
	 * @return paid network amount
	 * @return created on timestamp
	 */
	function purchaseReceiptById(bytes32 _purchaseId) public view returns (bytes32, address, uint256, uint256) {
		// Make sure the purchase receipt exist
		require (purchaseReceiptIndex[_purchaseId] > 0);
		PurchaseReceipt memory _purchaseReceipt = purchaseReceipts[purchaseReceiptIndex[_purchaseId]];
		return (
			_purchaseReceipt.contentHostId,
			_purchaseReceipt.buyer,
			_purchaseReceipt.networkAmount,
			_purchaseReceipt.createdOnTimestamp
		);
	}

	/**
	 * @dev Request node wants to become a distribution node after buying the content
	 *		Also, if this transaction succeeds, we release all of the earnings that are
	 *		currently in escrow for content creator/host/foundation
	 */
	function becomeHost(bytes32 _purchaseId, uint8 _baseChallengeV, bytes32 _baseChallengeR, bytes32 _baseChallengeS, string _encChallenge, string _contentDatKey, string _metadataDatKey) public isActive {
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
		require (AOLibrary.checkSignature(address(this), _content.baseChallenge, _baseChallengeV, _baseChallengeR, _baseChallengeS) == msg.sender);

		_hostContent(msg.sender, _stakeId, _encChallenge, _contentDatKey, _metadataDatKey);

		// Release earning from escrow
		require (_earning.releaseEarning(_purchaseId, _purchaseReceipt.networkAmount, _content.fileSize, stakedContents[stakedContentIndex[_stakeId]].stakeOwner, contentHosts[contentHostIndex[_purchaseReceipt.contentHostId]].host));
	}

	/***** INTERNAL METHODS *****/
	/**
	 * @dev Store the content information (content creation during staking)
	 * @param _creator the address of the content creator
	 * @param _baseChallenge The base challenge string (PUBLIC KEY) of the content
	 * @param _fileSize The size of the file
	 * @return the ID of the content
	 */
	function _storeContent(address _creator, string _baseChallenge, uint256 _fileSize) internal returns (bytes32) {
		// Increment totalContents
		totalContents++;

		// Generate contentId
		bytes32 _contentId = keccak256(abi.encodePacked(this, _creator, totalContents));
		Content storage _content = contents[totalContents];

		// Make sure we don't store the same content twice
		require (_content.creator == address(0));

		_content.contentId = _contentId;
		_content.creator = _creator;
		_content.baseChallenge = _baseChallenge;
		_content.fileSize = _fileSize;

		contentIndex[_contentId] = totalContents;

		emit StoreContent(_content.creator, _content.contentId, _content.fileSize);
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

		// Make sure we don't host the same content twice
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

		// Make sure we don't stake the same content twice
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
			_stakedContent.primordialWeightedIndex = _baseAO.weightedIndexByAddress(_stakedContent.stakeOwner);
			require (_baseAO.stakeIcoTokenFrom(_stakedContent.stakeOwner, _primordialAmount, _stakedContent.primordialWeightedIndex));
		}

		emit StakeContent(_stakedContent.stakeOwner, _stakedContent.stakeId, _stakedContent.contentId, _stakedContent.networkAmount, _stakedContent.primordialAmount, _stakedContent.primordialWeightedIndex, _stakedContent.profitPercentage, _stakedContent.createdOnTimestamp);
		return _stakedContent.stakeId;
	}
}
