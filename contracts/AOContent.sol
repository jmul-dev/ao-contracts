pragma solidity ^0.4.24;

import './SafeMath.sol';
import './owned.sol';
import './AOToken.sol';
import './AOTreasury.sol';

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
	uint256 public inflationRate; // support up to 4 decimals, i.e 12.3456% = 123456
	uint256 constant public PERCENTAGE_DIVISOR = 10 ** 6; // 100% = 1000000
	uint256 public totalContents;
	uint256 public totalContentHosts;
	uint256 public totalStakedContents;
	uint256 public totalBoughtContents;
	AOTreasury private _treasury;

	struct Content {
		bytes32 contentId;
		address creator;
		/**
		 * baseChallenge is the content's PUBLIC KEY
		 * When a request node wants to be a host, we require it to send a signed base challenge (its content's PUBLIC KEY)
		 * so that we can verify the authenticity of the content
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
		bytes32 contentId;
		bytes32 stakeId;
		address host;
		/**
		 * encChallenge is the content's PUBLIC KEY unique to the host
		 */
		string encChallenge;
		string contentDatKey;
		string metadataDatKey;
	}

	struct BoughtContent {
		bytes32 buyId;
		bytes32 contentHostId;
		address buyer;
		uint256 networkAmount; // total network token staked in base denomination
		uint256 primordialAmount;	// the amount of primordial AO Token to stake (always in base denomination)
		uint256 primordialWeightedIndex;
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

	// Mapping from BoughtContent index to the BoughtContent object
	mapping (uint256 => BoughtContent) private boughtContents;

	// Mapping from buy ID to index of the boughtContents list
	mapping (bytes32 => uint256) private boughtContentIndex;

	// Mapping from buyer's content host ID to the buy ID
	// To check whether or not buyer has bought/paid for a content
	mapping (address => mapping (bytes32 => bytes32)) internal buyerBoughtContents;

	// Mapping from address to network token earning in escrow
	// Accumulated when request node buys content from host
	mapping (address => uint256) public networkEarningEscrow;

	// Mapping from address to claimable network token earning
	// Accumulated when request node has verified the bought content and become a distribution node
	mapping (address => uint256) public networkEarning;

	// Mapping from address to primordial token earning at weighted index in escrow
	// Accumulated when request node buys content from host
	mapping (address => mapping(uint256 => uint256)) public primordialEarningEscrow;

	// Mapping from address to claimable primordial token earning at weighted index
	// Accumulated when request node has verified the bought content and become a distribution node
	mapping (address => mapping(uint256 => uint256)) public primordialEarning;

	// Event to be broadcasted to public when `content` is stored
	event StoreContent(address indexed creator, bytes32 indexed contentId, uint256 fileSize);

	// Event to be broadcasted to public when `stakeOwner` stakes a new content
	event StakeContent(address indexed stakeOwner, bytes32 indexed stakeId, bytes32 indexed contentId, uint256 baseNetworkAmount, uint256 primordialAmount, uint256 primordialWeightedIndex, uint256 profitPercentage, uint256 createdOnTimestamp);

	// Event to be broadcasted to public when a node hosts a content
	event HostContent(address indexed host, bytes32 indexed contentHostId, bytes32 indexed contentId, bytes32 stakeId, string contentDatKey, string metadataDatKey);

	// Event to be broadcasted to public when `stakeOwner` updates the staked content's profit percentage
	event SetProfitPercentage(address indexed stakeOwner, bytes32 indexed stakeId, uint256 newProfitPercentage);

	// Event to be broadcasted to public when `stakeOwner` unstakes some network/primordial token from an existing content
	event UnstakePartialContent(address indexed stakeOwner, bytes32 indexed stakeId, bytes32 indexed contentId, uint256 remainingNetworkAmount, uint256 remainingPrimordialAmount, uint256 primordialWeightedIndex);

	// Event to be broadcasted to public when `stakeOwner` unstakes all token amount on an existing content
	event UnstakeContent(address indexed stakeOwner, bytes32 indexed stakeId);

	// Event to be broadcasted to public when `stakeOwner` re-stakes an existing content
	event StakeExistingContent(address indexed stakeOwner, bytes32 indexed stakeId, bytes32 indexed contentId, uint256 currentNetworkAmount, uint256 currentPrimordialAmount, uint256 currentPrimordialWeightedIndex);

	// Event to be broadcasted to public when content creator/host earns network token when someone buys the content
	// recipientType:
	// 0 => Content Creator (Stake Owner)
	// 1 => Node Host
	event BuyContentNetworkEarningEscrow(address indexed recipient, bytes32 buyId, bytes32 contentHostId, bytes32 stakeId, uint256 networkPrice, uint256 recipientProfitPercentage, uint256 networkEarningAmount, uint8 recipientType);

	event BuyContentPrimordialEarningEscrow(address indexed recipient, bytes32 buyId, bytes32 contentHostId, bytes32 stakeId, uint256 primordialPrice, uint256 primordialWeightedIndex, uint256 recipientProfitPercentage, uint256 primordialEarningAmount, uint8 recipientType);

	// Event to be broadcasted to public when `buyer` buys a content
	event BuyContent(address indexed buyer, bytes32 indexed buyId, bytes32 indexed contentHostId, uint256 paidNetworkAmount, uint256 paidPrimordialAmount, uint256 paidPrimordialWeightedIndex, uint256 createdOnTimestamp);

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

	/**
	 * @dev Checks if the denomination is valid
	 */
	modifier isValidDenomination(bytes8 _denomination) {
		// Make sure the _denomination is in the available list
		(address _networkTokenAddress, bool _networkTokenActive) = _treasury.getDenomination(_denomination);
		require (_networkTokenAddress != address(0) && _networkTokenActive == true);
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

	/**
	 * @dev Whitelisted address sets inflation rate
	 * @param _inflationRate The new inflation rate value to be set
	 */
	function setInflationRate(uint256 _inflationRate) public inWhitelist(msg.sender) {
		inflationRate = _inflationRate;
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
		require (_canStake(_networkIntegerAmount, _networkFractionAmount, _denomination, _primordialAmount, _fileSize) == true);
		require (_profitPercentage <= PERCENTAGE_DIVISOR);

		// Store this content
		bytes32 _contentId = _storeContent(msg.sender, _baseChallenge, _fileSize);

		// Stake the network/primordial token on content
		bytes32 _stakeId = _stakeContent(msg.sender, _contentId, _networkIntegerAmount, _networkFractionAmount, _denomination, _primordialAmount, _profitPercentage);

		// Add the node info that hosts this content (in this case the creator himself)
		require (_hostContent(msg.sender, _contentId, _stakeId, _encChallenge, _contentDatKey, _metadataDatKey));
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
	 * @return The ID of the content being hosted
	 * @return address of the host
	 * @return the dat key of the content
	 * @return the dat key of the content's metadata
	 */
	function contentHostById(bytes32 _contentHostId) public view returns (bytes32, address, string, string) {
		// Make sure the content host exist
		require (contentHostIndex[_contentHostId] > 0);
		ContentHost memory _contentHost = contentHosts[contentHostIndex[_contentHostId]];
		return (
			_contentHost.contentId,
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
		require (_stakedContent.active == true && (_stakedContent.networkAmount > 0 || _stakedContent.primordialAmount > 0));
		// Make sure the staked content has enough balance to unstake
		require (_canUnstakePartial(_networkIntegerAmount, _networkFractionAmount, _denomination, _primordialAmount, _stakedContent.networkAmount, _stakedContent.primordialAmount, _content.fileSize));

		if (_denomination.length > 0 && (_networkIntegerAmount > 0 || _networkFractionAmount > 0)) {
			uint256 _unstakeNetworkAmount = _treasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination);
			_stakedContent.networkAmount = _stakedContent.networkAmount.sub(_unstakeNetworkAmount);
			require (_unstakePartialNetworkToken(msg.sender, _unstakeNetworkAmount));
		}
		if (_primordialAmount > 0) {
			_stakedContent.primordialAmount = _stakedContent.primordialAmount.sub(_primordialAmount);
			require (_unstakePartialPrimordialToken(msg.sender, _primordialAmount, _stakedContent.primordialWeightedIndex));
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
		require (_stakedContent.active == true && (_stakedContent.networkAmount > 0 || _stakedContent.primordialAmount > 0));

		_stakedContent.active = false;

		if (_stakedContent.networkAmount > 0) {
			uint256 _unstakeNetworkAmount = _stakedContent.networkAmount;
			_stakedContent.networkAmount = 0;
			require (_unstakePartialNetworkToken(msg.sender, _unstakeNetworkAmount));
		}
		if (_stakedContent.primordialAmount > 0) {
			uint256 _primordialAmount = _stakedContent.primordialAmount;
			uint256 _primordialWeightedIndex = _stakedContent.primordialWeightedIndex;
			_stakedContent.primordialAmount = 0;
			_stakedContent.primordialWeightedIndex = 0;
			require (_unstakePartialPrimordialToken(msg.sender, _primordialAmount, _primordialWeightedIndex));
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

		// Make sure the staked content owner is the same as the sender
		require (_stakedContent.stakeOwner == msg.sender);
		require (_networkIntegerAmount > 0 || _networkFractionAmount > 0 || _primordialAmount > 0);
		require (_canStakeExisting(_stakedContent, _networkIntegerAmount, _networkFractionAmount, _denomination, _primordialAmount));

		// Make sure we can stake primordial token
		// If we are currently staking an active staked content, then the stake owner's weighted index has to match `stakedContent.primordialWeightedIndex`
		// i.e, can't use a combination of different weighted index. Stake owner has to call unstakeContent() to unstake all tokens first
		(, address _baseDenominationAddress, bool _baseDenominationActive) = _treasury.getBaseDenomination();
		require (_baseDenominationAddress != address(0));
		require (_baseDenominationActive == true);
		AOToken _primordialToken = AOToken(_baseDenominationAddress);
		if (_primordialAmount > 0 && _stakedContent.active && _stakedContent.primordialAmount > 0 && _stakedContent.primordialWeightedIndex > 0) {
			require (_primordialToken.weightedIndexByAddress(msg.sender) == _stakedContent.primordialWeightedIndex);
		}

		_stakedContent.active = true;
		if (_denomination.length > 0 && (_networkIntegerAmount > 0 || _networkFractionAmount > 0)) {
			uint256 _stakeNetworkAmount = _treasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination);
			_stakedContent.networkAmount = _stakedContent.networkAmount.add(_stakeNetworkAmount);
			require (_stakeNetworkToken(_stakedContent.stakeOwner, _stakeNetworkAmount));
		}
		if (_primordialAmount > 0) {
			_stakedContent.primordialAmount = _stakedContent.primordialAmount.add(_primordialAmount);

			// Primordial Token is the base AO Token
			_stakedContent.primordialWeightedIndex = _primordialToken.weightedIndexByAddress(_stakedContent.stakeOwner);
			require (_primordialToken.stakeIcoTokenFrom(_stakedContent.stakeOwner, _primordialAmount, _stakedContent.primordialWeightedIndex));
		}

		emit StakeExistingContent(msg.sender, _stakedContent.stakeId, _stakedContent.contentId, _stakedContent.networkAmount, _stakedContent.primordialAmount, _stakedContent.primordialWeightedIndex);
	}

	/**
	 * @dev Bring content in to the requesting node by sending network/primordial tokens to the contract to pay for the content
	 * @param _contentHostId The ID of hosted content
	 * @param _networkIntegerAmount The integer amount of network token to pay
	 * @param _networkFractionAmount The fraction amount of network token to pay
	 * @param _denomination The denomination of the network token, i.e ao, kilo, mega, etc.
	 * @param _primordialAmount The amount of primordial Token to pay
	 */
	function buyContent(bytes32 _contentHostId, uint256 _networkIntegerAmount, uint256 _networkFractionAmount, bytes8 _denomination, uint256 _primordialAmount) public isActive {
		// Make sure the content host exist
		require (contentHostIndex[_contentHostId] > 0);

		ContentHost memory _contentHost = contentHosts[contentHostIndex[_contentHostId]];
		StakedContent memory _stakedContent = stakedContents[stakedContentIndex[_contentHost.stakeId]];

		// Make sure the content currently has stake
		require (_stakedContent.active == true && (_stakedContent.networkAmount > 0 || _stakedContent.primordialAmount > 0));

		// Make sure the buyer has not bought this content previously
		require (buyerBoughtContents[msg.sender][_contentHostId].length == 0);

		// Make sure the token amount can pay for the content price
		require (_networkIntegerAmount > 0 || _networkFractionAmount > 0 || _primordialAmount > 0);
		require (_canBuy(_stakedContent.networkAmount.add(_stakedContent.primordialAmount), _networkIntegerAmount, _networkFractionAmount, _denomination, _primordialAmount));

		// Increment totalBoughtContents;
		totalBoughtContents++;

		// Generate buyId
		bytes32 _buyId = keccak256(abi.encodePacked(this, msg.sender, _contentHostId));
		BoughtContent storage _boughtContent = boughtContents[totalBoughtContents];

		// Make sure we don't buy the same content twice
		require (_boughtContent.buyer == address(0));

		_boughtContent.buyId = _buyId;
		_boughtContent.contentHostId = _contentHostId;
		_boughtContent.buyer = msg.sender;
		_boughtContent.createdOnTimestamp = now;

		boughtContentIndex[_buyId] = totalBoughtContents;
		buyerBoughtContents[msg.sender][_contentHostId] = _buyId;

		if (_denomination.length > 0 && (_networkIntegerAmount > 0 || _networkFractionAmount > 0)) {
			// Update the receipt with the correct network amount
			_boughtContent.networkAmount = _treasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination);

			// Have the buyer transfer the network amount
			require (_transferNetworkToken(msg.sender, _boughtContent.networkAmount));

			// Calculate content creator and host' network earning and store them in escrow
			_calculateNetworkEarning(_buyId, _stakedContent.stakeId, _contentHost.contentHostId, _boughtContent.networkAmount, _stakedContent.profitPercentage, _stakedContent.stakeOwner, _contentHost.host);
		}
		if (_primordialAmount > 0) {
			// Make sure base denomination is active
			(, address _baseDenominationAddress, bool _baseDenominationActive) = _treasury.getBaseDenomination();
			require (_baseDenominationAddress != address(0));
			require (_baseDenominationActive == true);

			// Update the receipt with the correct primordial amounit
			_boughtContent.primordialAmount = _primordialAmount;

			// Primordial Token is the base AO Token
			AOToken _primordialToken = AOToken(_baseDenominationAddress);
			_boughtContent.primordialWeightedIndex = _primordialToken.weightedIndexByAddress(msg.sender);

			// Transfer payment
			require (_primordialToken.whitelistTransferIcoTokenFrom(msg.sender, this, _boughtContent.primordialAmount));

			// Calculate content creator and host' primordial earning and store them in escrow
			_calculatePrimordialEarning(_buyId, _stakedContent.stakeId, _contentHost.contentHostId, _boughtContent.primordialAmount, _boughtContent.primordialWeightedIndex, _stakedContent.profitPercentage, _stakedContent.stakeOwner, _contentHost.host);
		}

		// TODO:
		// Mint network token and reward Foundation, stake owner and host accordingly

		emit BuyContent(_boughtContent.buyer, _boughtContent.buyId, _boughtContent.contentHostId, _boughtContent.networkAmount, _boughtContent.primordialAmount, _boughtContent.primordialWeightedIndex, _boughtContent.createdOnTimestamp);
	}

	/***** INTERNAL METHODS *****/
	/**
	 * @dev Check whether the network token and/or primordial token is adequate to pay for the filesize
	 * @param _networkIntegerAmount The integer amount of the network token
	 * @param _networkFractionAmount The fraction amount of the network token
	 * @param _denomination The denomination of the the network token
	 * @param _primordialAmount The amount of primordial token
	 * @param _fileSize The file size of the content
	 * @return true when the amount is sufficient, false otherwise
	 */
	function _canStake(uint256 _networkIntegerAmount, uint256 _networkFractionAmount, bytes8 _denomination, uint256 _primordialAmount, uint256 _fileSize) internal view returns (bool) {
		if (_denomination.length > 0 && (_networkIntegerAmount > 0 || _networkFractionAmount > 0)) {
			if (_treasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination).add(_primordialAmount) >= _fileSize) {
				return true;
			} else {
				return false;
			}
		} else if (_primordialAmount >= _fileSize) {
			return true;
		} else {
			return false;
		}
	}

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
	 * @param _contentId The ID of the content being hosted
	 * @param _stakeId The ID of the staked content
	 * @param _encChallenge The encrypted challenge string (PUBLIC KEY) of the content unique to the host
	 * @param _contentDatKey The dat key of the content
	 * @param _metadataDatKey The dat key of the content's metadata
	 * @return true on success
	 */
	function _hostContent(address _host, bytes32 _contentId, bytes32 _stakeId, string _encChallenge, string _contentDatKey, string _metadataDatKey) internal returns (bool) {
		require (bytes(_encChallenge).length > 0);
		require (bytes(_contentDatKey).length > 0);
		require (bytes(_metadataDatKey).length > 0);
		require (contentIndex[_contentId] > 0);

		// Increment totalContentHosts
		totalContentHosts++;

		// Generate contentId
		bytes32 _contentHostId = keccak256(abi.encodePacked(this, _host, _contentId));

		ContentHost storage _contentHost = contentHosts[totalContentHosts];

		// Make sure we don't host the same content twice
		require (_contentHost.host == address(0));

		_contentHost.contentHostId = _contentHostId;
		_contentHost.contentId = _contentId;
		_contentHost.stakeId = _stakeId;
		_contentHost.host = _host;
		_contentHost.encChallenge = _encChallenge;
		_contentHost.contentDatKey = _contentDatKey;
		_contentHost.metadataDatKey = _metadataDatKey;

		contentHostIndex[_contentHostId] = totalContentHosts;

		emit HostContent(_contentHost.host, _contentHost.contentHostId, _contentHost.contentId, _contentHost.stakeId, _contentHost.contentDatKey, _contentHost.metadataDatKey);
		return true;
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

		if (_denomination.length > 0 && (_networkIntegerAmount > 0 || _networkFractionAmount > 0)) {
			_stakedContent.networkAmount = _treasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination);
			require (_stakeNetworkToken(_stakedContent.stakeOwner, _stakedContent.networkAmount));
		}
		if (_primordialAmount > 0) {
			// Make sure base denomination is active
			(, address _baseDenominationAddress, bool _baseDenominationActive) = _treasury.getBaseDenomination();
			require (_baseDenominationAddress != address(0));
			require (_baseDenominationActive == true);

			_stakedContent.primordialAmount = _primordialAmount;

			// Primordial Token is the base AO Token
			AOToken _primordialToken = AOToken(_baseDenominationAddress);
			_stakedContent.primordialWeightedIndex = _primordialToken.weightedIndexByAddress(_stakedContent.stakeOwner);
			require (_primordialToken.stakeIcoTokenFrom(_stakedContent.stakeOwner, _primordialAmount, _stakedContent.primordialWeightedIndex));
		}

		emit StakeContent(_stakedContent.stakeOwner, _stakedContent.stakeId, _stakedContent.contentId, _stakedContent.networkAmount, _stakedContent.primordialAmount, _stakedContent.primordialWeightedIndex, _stakedContent.profitPercentage, _stakedContent.createdOnTimestamp);
		return _stakedContent.stakeId;
	}

	/**
	 * @dev Stake network token on existing staked content
	 * @param _stakeOwner The stake owner address
	 * @param _networkAmount The amount of the network token to stake
	 * @return true on success
	 */
	function _stakeNetworkToken(address _stakeOwner, uint256 _networkAmount) internal returns (bool) {
		(address[] memory _paymentAddress, uint256[] memory _paymentAmount) = _treasury.determinePayment(_stakeOwner, _networkAmount);

		// Stake tokens from each denomination in payment address
		for (uint256 i=0; i < _paymentAddress.length; i++) {
			if (_paymentAddress[i] != address(0) && _paymentAmount[i] > 0) {
				require (AOToken(_paymentAddress[i]).stakeFrom(_stakeOwner, _paymentAmount[i]));
			}
		}
		return true;
	}

	/**
	 * @dev Check whether or the requested unstake amount is valid
	 * @param _networkIntegerAmount The integer amount of the network token
	 * @param _networkFractionAmount The fraction amount of the network token
	 * @param _denomination The denomination of the the network token
	 * @param _primordialAmount The amount of primordial token
	 * @param _stakedNetworkAmount The current staked network token amount
	 * @param _stakedPrimordialAmount The current staked primordial token amount
	 * @param _stakedFileSize The file size of the staked content
	 * @return true if can unstake, false otherwise
	 */
	function _canUnstakePartial(
		uint256 _networkIntegerAmount,
		uint256 _networkFractionAmount,
		bytes8 _denomination,
		uint256 _primordialAmount,
		uint256 _stakedNetworkAmount,
		uint256 _stakedPrimordialAmount,
		uint256 _stakedFileSize) internal view returns (bool) {
		if (
			(_denomination.length > 0 &&
				(_networkIntegerAmount > 0 || _networkFractionAmount > 0) &&
				_stakedNetworkAmount < _treasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination)
			) ||
			_stakedPrimordialAmount < _primordialAmount ||
			(
				_denomination.length > 0
					&& (_networkIntegerAmount > 0 || _networkFractionAmount > 0)
					&& (_stakedNetworkAmount.sub(_treasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination)).add(_stakedPrimordialAmount.sub(_primordialAmount)) < _stakedFileSize)
			) ||
			( _denomination.length == 0 && _networkIntegerAmount == 0 && _networkFractionAmount == 0 && _primordialAmount > 0 && _stakedPrimordialAmount.sub(_primordialAmount) < _stakedFileSize)
		) {
			return false;
		} else {
			return true;
		}
	}

	/**
	 * @dev Unstake some network token on existing staked content
	 * @param _stakeOwner The stake owner address
	 * @param _unstakeNetworkAmount The amount of the network token to unstake
	 * @return true on success
	 */
	function _unstakePartialNetworkToken(address _stakeOwner, uint256 _unstakeNetworkAmount) internal returns (bool) {
		(address[] memory _unstakeAddress, uint256[] memory _unstakeAmount) = _treasury.determineUnstake(_stakeOwner, _unstakeNetworkAmount);

		// Unstake tokens from each denomination in unstake address
		for (uint256 i=0; i < _unstakeAddress.length; i++) {
			if (_unstakeAddress[i] != address(0) && _unstakeAmount[i] > 0) {
				require (AOToken(_unstakeAddress[i]).unstakeFrom(_stakeOwner, _unstakeAmount[i]));
			}
		}
		return true;
	}

	/**
	 * @dev Unstake some primordial token on existing staked content
	 * @param _stakeOwner The address of the stake owner
	 * @param _primordialAmount The amount of the primordial token to unstake
	 * @param _primordialWeightedIndex The weighted index of the primordial token to unstake
	 * @return true on success
	 */
	function _unstakePartialPrimordialToken(address _stakeOwner, uint256 _primordialAmount, uint256 _primordialWeightedIndex) internal returns (bool) {
		// Make sure base denomination is active
		(, address _baseDenominationAddress, bool _baseDenominationActive) = _treasury.getBaseDenomination();
		require (_baseDenominationAddress != address(0));
		require (_baseDenominationActive == true);

		// Primordial Token is the base AO Token
		AOToken _primordialToken = AOToken(_baseDenominationAddress);
		require (_primordialToken.unstakeIcoTokenFrom(_stakeOwner, _primordialAmount, _primordialWeightedIndex));
		return true;
	}

	/**
	 * @dev Check whether the network token and/or primordial token is adequate to pay for existing staked content
	 * @param _stakedContent The staked content object
	 * @param _networkIntegerAmount The integer amount of the network token
	 * @param _networkFractionAmount The fraction amount of the network token
	 * @param _denomination The denomination of the the network token
	 * @param _primordialAmount The amount of primordial token
	 * @return true when the amount is sufficient, false otherwise
	 */
	function _canStakeExisting(StakedContent memory _stakedContent, uint256 _networkIntegerAmount, uint256 _networkFractionAmount, bytes8 _denomination, uint256 _primordialAmount) internal view returns (bool) {
		Content memory _content = contents[contentIndex[_stakedContent.contentId]];

		if (_denomination.length > 0 && (_networkIntegerAmount > 0 || _networkFractionAmount > 0)) {
			return _treasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination).add(_primordialAmount).add(_stakedContent.networkAmount).add(_stakedContent.primordialAmount) >= _content.fileSize;
		} else if (_primordialAmount > 0) {
			return _stakedContent.networkAmount.add(_stakedContent.primordialAmount).add(_primordialAmount) >= _content.fileSize;
		} else {
			return false;
		}
	}

	/**
	 * @dev Check whether the network token and/or primordial token is adequate to pay for existing staked content
	 * @param _price The price of the content
	 * @param _networkIntegerAmount The integer amount of the network token
	 * @param _networkFractionAmount The fraction amount of the network token
	 * @param _denomination The denomination of the the network token
	 * @param _primordialAmount The amount of primordial token
	 * @return true when the amount is sufficient, false otherwise
	 */
	function _canBuy(uint256 _price, uint256 _networkIntegerAmount, uint256 _networkFractionAmount, bytes8 _denomination, uint256 _primordialAmount) internal view returns (bool) {
		if (_denomination.length > 0 && (_networkIntegerAmount > 0 || _networkFractionAmount > 0)) {
			return _treasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination).add(_primordialAmount) >= _price;
		} else if (_primordialAmount > 0) {
			return _primordialAmount >= _price;
		} else {
			return false;
		}
	}

	/**
	 * @dev Transfer the network token for the purchase
	 * @param _buyer The address of the buyer
	 * @param _networkAmount The amount of the network token to transfer
	 * @return true on success
	 */
	function _transferNetworkToken(address _buyer, uint256 _networkAmount) internal returns (bool) {
		// Transfer tokens from each denomination in payment address to this contract
		(address[] memory _paymentAddress, uint256[] memory _paymentAmount) = _treasury.determinePayment(_buyer, _networkAmount);

		for (uint256 i=0; i < _paymentAddress.length; i++) {
			if (_paymentAddress[i] != address(0) && _paymentAmount[i] > 0) {
				require (AOToken(_paymentAddress[i]).whitelistTransferFrom(_buyer, this, _paymentAmount[i]));
			}
		}
		return true;
	}

	/**
	 * @dev Calculate the content creator/host network earning when request node buys the content
	 * @param _buyId The ID of the bought content object
	 * @param _stakeId The ID of the staked content object
	 * @param _contentHostId The ID of the content host object
	 * @param _price The network price of the content
	 * @param _profitPercentage The content creator's profit percentage
	 * @param _stakeOwner The address of the stake owner
	 * @param _host The address of the host
	 */
	function _calculateNetworkEarning(bytes32 _buyId, bytes32 _stakeId, bytes32 _contentHostId, uint256 _price, uint256 _profitPercentage, address _stakeOwner, address _host) internal {
		// Store how much the content creator earns in escrow
		uint256 _contentCreatorProfit = (_price.mul(_profitPercentage)).div(PERCENTAGE_DIVISOR);
		networkEarningEscrow[_stakeOwner] = networkEarningEscrow[_stakeOwner].add(_contentCreatorProfit);
		emit BuyContentNetworkEarningEscrow(_stakeOwner, _buyId, _contentHostId, _stakeId, _price, _profitPercentage, _contentCreatorProfit, 0);

		// Store how much the node host earns
		networkEarningEscrow[_host] = networkEarningEscrow[_host].add(_price.sub(_contentCreatorProfit));
		emit BuyContentNetworkEarningEscrow(_host, _buyId, _contentHostId, _stakeId, _price, PERCENTAGE_DIVISOR.sub(_profitPercentage), _price.sub(_contentCreatorProfit), 1);
	}

	/**
	 * @dev Calculate the content creator/host primordial earning when request node buys the content
	 * @param _buyId The ID of the bought content object
	 * @param _stakeId The ID of the staked content object
	 * @param _contentHostId The ID of the content host object
	 * @param _primordialPrice The primordial price of the content
	 * @param _primordialWeightedIndex The primordial token weighted index of the content
	 * @param _profitPercentage The content creator's profit percentage
	 * @param _stakeOwner The address of the stake owner
	 * @param _host The address of the host
	 */
	function _calculatePrimordialEarning(bytes32 _buyId, bytes32 _stakeId, bytes32 _contentHostId, uint256 _primordialPrice, uint256 _primordialWeightedIndex, uint256 _profitPercentage, address _stakeOwner, address _host) internal {
		// Store how much the content creator earns in escrow
		uint256 _contentCreatorProfit = (_primordialPrice.mul(_profitPercentage)).div(PERCENTAGE_DIVISOR);
		primordialEarningEscrow[_stakeOwner][_primordialWeightedIndex] = primordialEarningEscrow[_stakeOwner][_primordialWeightedIndex].add(_contentCreatorProfit);
		emit BuyContentPrimordialEarningEscrow(_stakeOwner, _buyId, _contentHostId, _stakeId, _primordialPrice, _primordialWeightedIndex, _profitPercentage, _contentCreatorProfit, 0);

		// Store how much the node host earns
		primordialEarningEscrow[_host][_primordialWeightedIndex] = primordialEarningEscrow[_host][_primordialWeightedIndex].add(_primordialPrice.sub(_contentCreatorProfit));
		emit BuyContentPrimordialEarningEscrow(_host, _buyId, _contentHostId, _stakeId, _primordialPrice, _primordialWeightedIndex, PERCENTAGE_DIVISOR.sub(_profitPercentage), _primordialPrice.sub(_contentCreatorProfit), 1);
	}
}
