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
	uint256 public totalStakedContents;
	uint256 public totalBoughtContents;
	AOTreasury private _treasury;

	struct StakedContent {
		bytes32 stakeId;
		address stakeOwner;
		uint256 networkAmount; // total network token staked in base denomination
		uint256 primordialAmount;	// the amount of primordial AO Token to stake (always in base denomination)
		uint256 primordialWeightedIndex;
		string datKey;
		uint256 fileSize;
		uint256 profitPercentage; // support up to 4 decimals, 100% = 1000000
		bool active; // true if currently staked, false when unstaked
		uint256 createdOnTimestamp;
	}

	struct BoughtContent {
		bytes32 buyId;
		bytes32 stakeId;
		address buyer;
		address host; // The host address that holds the data
		uint256 networkAmount; // total network token staked in base denomination
		uint256 primordialAmount;	// the amount of primordial AO Token to stake (always in base denomination)
		uint256 primordialWeightedIndex;
		uint256 createdOnTimestamp;
	}

	// Mapping from StakedContent index to the StakedContent object
	mapping (uint256 => StakedContent) private stakedContents;

	// Mapping from stake ID to index of the stakedContents list
	mapping (bytes32 => uint256) private stakedContentIndex;

	// Mapping from BoughtContent index to the BoughtContent object
	mapping (uint256 => BoughtContent) private boughtContents;

	// Mapping from buy ID to index of the boughtContents list
	mapping (bytes32 => uint256) private boughtContentIndex;

	// Mapping from buyer's bought stake ID to the buy ID
	// To check whether or not a stakedContent has been bought by buyer
	mapping (address => mapping (bytes32 => bytes32)) internal buyerOwnedStakeId;

	// Event to be broadcasted to public when `stakeOwner` stakes a new content
	event StakeContent(
		address indexed stakeOwner,
		bytes32 indexed stakeId,
		uint256 networkIntegerAmount,
		uint256 networkFractionAmount,
		bytes8 denomination,
		uint256 totalNetworkBaseAmount,
		uint256 primordialAmount,
		uint256 primordialWeightedIndex,
		string datKey,
		uint256 fileSize,
		uint256 profitPercentage,
		uint256 createdOnTimestamp
	);

	// Event to be broadcasted to public when `stakeOwner` updates the staked content's profit percentage
	event SetProfitPercentage(address indexed stakeOwner, bytes32 indexed stakeId, uint256 newProfitPercentage);

	// Event to be broadcasted to public when `stakeOwner` unstakes some network/primordial token from an existing content
	event UnstakePartialContent(address indexed stakeOwner, bytes32 indexed stakeId, uint256 remainingNetworkAmount, uint256 remainingPrimordialAmount, uint256 primordialWeightedIndex);

	// Event to be broadcasted to public when `stakeOwner` unstakes all token amount on an existing content
	event UnstakeContent(address indexed stakeOwner, bytes32 indexed stakeId);

	// Event to be broadcasted to public when `stakeOwner` re-stakes an existing content
	event StakeExistingContent(address indexed stakeOwner, bytes32 indexed stakeId, uint256 currentNetworkAmount, uint256 currentPrimordialAmount, uint256 currentPrimordialWeightedIndex);

	// Event to be broadcasted to public when emergency mode is triggered
	event EscapeHatch();

	/*

	// Event to be broadcasted to public when `buyer` buys an existing content
	event BuyContent(address indexed buyer, bytes32 indexed buyId, bytes32 indexed stakeId, address host, uint256 denominationAmountSpent, bytes8 denomination, uint256 icoTokenAmountSpent, uint256 icoTokenWeightedIndex);

	// Event to be broadcasted to public when stake owner (content creator) or host receives profit when someone buys the content
	// recipientType:
	// 0 => Stake Owner (Content Creator)
	// 1 => Node Host
	event BuyContentNetworkTokenEarning(address indexed recipient, address indexed sender, bytes32 indexed buyId, bytes32 stakeId, uint256 denominationAmount, bytes8 denomination, uint256 profitPercentage, uint8 recipientType);
	event BuyContentPrimordialTokenEarning(address indexed recipient, address indexed sender, bytes32 indexed buyId, bytes32 stakeId, uint256 icoTokenAmount, uint256 icoTokenWeightedIndex, uint256 profitPercentage, uint8 recipientType);
	 */

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
	 * @param _datKey The dat key of the file
	 * @param _fileSize The size of the file
	 * @param _profitPercentage The percentage of profit the stake owner's media will charge
	 */
	function stakeContent(
		uint256 _networkIntegerAmount,
		uint256 _networkFractionAmount,
		bytes8 _denomination,
		uint256 _primordialAmount,
		string _datKey,
		uint256 _fileSize,
		uint256 _profitPercentage)
		public
		isActive {
		require (bytes(_datKey).length > 0);
		require (_fileSize > 0);
		require (_networkIntegerAmount > 0 || _networkFractionAmount > 0 || _primordialAmount > 0);
		require (_profitPercentage <= PERCENTAGE_DIVISOR);
		require (_isAdequate(_networkIntegerAmount, _networkFractionAmount, _denomination, _primordialAmount, _fileSize) == true);

		// Increment totalStakedContents
		totalStakedContents++;

		// Generate stakeId
		bytes32 _stakeId = keccak256(abi.encodePacked(this, msg.sender, totalStakedContents, _datKey));
		StakedContent storage _stakedContent = stakedContents[totalStakedContents];
		_stakedContent.stakeId = _stakeId;
		_stakedContent.stakeOwner = msg.sender;
		_stakedContent.datKey = _datKey;
		_stakedContent.fileSize = _fileSize;
		_stakedContent.profitPercentage = _profitPercentage;
		_stakedContent.active = true;
		_stakedContent.createdOnTimestamp = now;

		stakedContentIndex[_stakeId] = totalStakedContents;

		if (_denomination.length > 0 && (_networkIntegerAmount > 0 || _networkFractionAmount > 0)) {
			require (_stakeNetworkToken(_stakeId, _networkIntegerAmount, _networkFractionAmount, _denomination));
		}
		if (_primordialAmount > 0) {
			require (_stakePrimordialToken(_stakeId, _primordialAmount));
		}
		emit StakeContent(
			msg.sender,
			_stakeId,
			_networkIntegerAmount,
			_networkFractionAmount,
			_denomination,
			_stakedContent.networkAmount,
			_stakedContent.primordialAmount,
			_stakedContent.primordialWeightedIndex,
			_stakedContent.datKey,
			_stakedContent.fileSize,
			_stakedContent.profitPercentage,
			_stakedContent.createdOnTimestamp
		);
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
	 * @dev Return staked content information at a given ID
	 * @param _stakeId The ID of the staked content
	 * @return address of the staked content's owner
	 * @return the network base token amount staked for this content
	 * @return the primordial token amount staked for this content
	 * @return the primordial weighted index of the staked content
	 * @return the dat key of the content
	 * @return the file size of the content
	 * @return the profit percentage of the content
	 * @return status of the staked content
	 * @return the timestamp when the staked content was created
	 */
	function stakedContentById(bytes32 _stakeId) public view returns (address, uint256, uint256, uint256, string, uint256, uint256, bool, uint256) {
		// Make sure the staked content exist
		require (stakedContentIndex[_stakeId] > 0);

		StakedContent memory _stakedContent = stakedContents[stakedContentIndex[_stakeId]];
		return (
			_stakedContent.stakeOwner,
			_stakedContent.networkAmount,
			_stakedContent.primordialAmount,
			_stakedContent.primordialWeightedIndex,
			_stakedContent.datKey,
			_stakedContent.fileSize,
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
		// Make sure the staked content owner is the same as the sender
		require (_stakedContent.stakeOwner == msg.sender);
		// Make sure the staked content is currently active (staked) with some amounts
		require (_stakedContent.active == true && (_stakedContent.networkAmount > 0 || _stakedContent.primordialAmount > 0));
		// Make sure the staked content has enough balance to unstake
		require (_canUnstakePartial(_networkIntegerAmount, _networkFractionAmount, _denomination, _primordialAmount, _stakedContent.networkAmount, _stakedContent.primordialAmount, _stakedContent.fileSize));

		if (_denomination.length > 0 && (_networkIntegerAmount > 0 || _networkFractionAmount > 0)) {
			require (_unstakePartialNetworkToken(_stakeId, _networkIntegerAmount, _networkFractionAmount, _denomination));
		}
		if (_primordialAmount > 0) {
			require (_unstakePartialPrimordialToken(_stakeId, _primordialAmount));
		}
		emit UnstakePartialContent(_stakedContent.stakeOwner, _stakedContent.stakeId, _stakedContent.networkAmount, _stakedContent.primordialAmount, _stakedContent.primordialWeightedIndex);
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
			(bytes8 _baseDenominationName,,) = _treasury.getBaseDenomination();
			require (_unstakePartialNetworkToken(_stakeId, _stakedContent.networkAmount, 0, _baseDenominationName));
		}
		if (_stakedContent.primordialAmount > 0) {
			require (_unstakePartialPrimordialToken(_stakeId, _stakedContent.primordialAmount));
			_stakedContent.primordialWeightedIndex = 0;
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
		require (_canStakeExisting(_stakeId, _networkIntegerAmount, _networkFractionAmount, _denomination, _primordialAmount));

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
			require (_stakeNetworkToken(_stakeId, _networkIntegerAmount, _networkFractionAmount, _denomination));
		}
		if (_primordialAmount > 0) {
			require (_stakePrimordialToken(_stakeId, _primordialAmount));
		}

		emit StakeExistingContent(msg.sender, _stakeId, _stakedContent.networkAmount, _stakedContent.primordialAmount, _stakedContent.primordialWeightedIndex);
	}

	/**
	 * @dev Buy existing content
	 * @param _stakeId The ID of the staked content
	 * @param _host The host address of the content
	 * @param _denominationAmount The amount of normal ERC20 token to spend
	 * @param _denomination The denomination of the normal ERC20 token, i.e ao, kilo, mega, etc.
	 * @param _icoTokenAmount The amount of ICO Token to spend
	function buyContent(bytes32 _stakeId, address _host, uint256 _denominationAmount, bytes8 _denomination, uint256 _icoTokenAmount) public isActive {
		// Make sure the staked content exist
		require (stakedContentIndex[_stakeId] > 0);
		// Make sure buyer has not bought this content previously
		require (buyerOwnedStakeId[msg.sender][_stakeId].length == 0);
		require (_denominationAmount > 0 || _icoTokenAmount > 0);

		StakedContent memory _stakedContent = stakedContents[stakedContentIndex[_stakeId]];

		// Make sure the token amount can pay for the content price
		require (_denominationAmount.add(_icoTokenAmount) >= _stakedContent.denominationAmount.add(_stakedContent.icoTokenAmount));

		// _host has to be either the stake owner (content creator) or someone who has purchased the content previously
		require (_host == _stakedContent.stakeOwner || buyerOwnedStakeId[_host][_stakeId].length > 0);

		// Increment totalBoughtContents;
		totalBoughtContents++;

		// Generate buyId
		bytes32 _buyId = keccak256(abi.encodePacked(this, msg.sender, totalBoughtContents, _stakeId));

		BoughtContent storage _boughtContent = boughtContents[totalBoughtContents];
		_boughtContent.buyId = _buyId;
		_boughtContent.stakeId = _stakeId;
		_boughtContent.buyer = msg.sender;
		_boughtContent.host = _host;
		_boughtContent.createdOnTimestamp = now;

		boughtContentIndex[_buyId] = totalBoughtContents;
		buyerOwnedStakeId[msg.sender][_stakeId] = _buyId;

		if (_denominationAmount > 0) {
			_rewardBuyContentNetworkEarning(msg.sender, _stakedContent.stakeOwner, _host, _buyId, _stakeId, _denominationAmount, _denomination, _stakedContent.profitPercentage);
		}
		if (_icoTokenAmount > 0) {
			_rewardBuyContentPrimordialEarning(msg.sender, _stakedContent.stakeOwner, _host, _buyId, _stakeId, _icoTokenAmount, _stakedContent.profitPercentage);
		}

		// TODO:
		// Mint network token and reward Foundation, stake owner and host accordingly

		emit BuyContent(msg.sender, _buyId, _stakeId, _host, _denominationAmount, _denomination, _icoTokenAmount, _boughtContent.icoTokenWeightedIndex);
	}
	 */

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
	function _isAdequate(uint256 _networkIntegerAmount, uint256 _networkFractionAmount, bytes8 _denomination, uint256 _primordialAmount, uint256 _fileSize) internal view returns (bool) {
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
	 * @dev Stake network token on existing staked content
	 * @param _stakeId The ID of the staked content
	 * @param _networkIntegerAmount The integer amount of the network token to stake
	 * @param _networkFractionAmount The fraction amount of the network token to stake
	 * @param _denomination The denomination of the the network token to stake
	 * @return true on success
	 */
	function _stakeNetworkToken(bytes32 _stakeId, uint256 _networkIntegerAmount, uint256 _networkFractionAmount, bytes8 _denomination) internal isValidDenomination(_denomination) returns (bool) {
		StakedContent storage _stakedContent = stakedContents[stakedContentIndex[_stakeId]];
		(address[] memory _paymentAddress, uint256[] memory _paymentAmount) = _treasury.determinePayment(_stakedContent.stakeOwner, _networkIntegerAmount, _networkFractionAmount, _denomination);

		_stakedContent.networkAmount = _stakedContent.networkAmount.add(_treasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination));

		// Stake tokens from each denomination in payment address
		for (uint256 i=0; i < _paymentAddress.length; i++) {
			if (_paymentAddress[i] != address(0) && _paymentAmount[i] > 0) {
				require (AOToken(_paymentAddress[i]).stakeFrom(_stakedContent.stakeOwner, _paymentAmount[i]));
			}
		}
		return true;
	}

	/**
	 * @dev Stake primordial token on existing staked content
	 * @param _stakeId The ID of the staked content
	 * @param _primordialAmount The amount of the primordial token to stake
	 * @return true on success
	 */
	function _stakePrimordialToken(bytes32 _stakeId, uint256 _primordialAmount) internal returns (bool) {
		// Make sure base denomination is active
		(, address _baseDenominationAddress, bool _baseDenominationActive) = _treasury.getBaseDenomination();
		require (_baseDenominationAddress != address(0));
		require (_baseDenominationActive == true);

		StakedContent storage _stakedContent = stakedContents[stakedContentIndex[_stakeId]];

		_stakedContent.primordialAmount = _stakedContent.primordialAmount.add(_primordialAmount);

		// Primordial Token is the base AO Token
		AOToken _primordialToken = AOToken(_baseDenominationAddress);
		_stakedContent.primordialWeightedIndex = _primordialToken.weightedIndexByAddress(_stakedContent.stakeOwner);
		require (_primordialToken.stakeIcoTokenFrom(_stakedContent.stakeOwner, _primordialAmount, _stakedContent.primordialWeightedIndex));
		return true;
	}

	/**
	 * @dev Unstake some network token on existing staked content
	 * @param _stakeId The ID of the staked content
	 * @param _networkIntegerAmount The integer amount of the network token to unstake
	 * @param _networkFractionAmount The fraction amount of the network token to unstake
	 * @param _denomination The denomination of the the network token to unstake
	 * @return true on success
	 */
	function _unstakePartialNetworkToken(bytes32 _stakeId, uint256 _networkIntegerAmount, uint256 _networkFractionAmount, bytes8 _denomination) internal isValidDenomination(_denomination) returns (bool) {
		StakedContent storage _stakedContent = stakedContents[stakedContentIndex[_stakeId]];
		(address[] memory _unstakeAddress, uint256[] memory _unstakeAmount) = _treasury.determineUnstake(_stakedContent.stakeOwner, _networkIntegerAmount, _networkFractionAmount, _denomination);

		_stakedContent.networkAmount = _stakedContent.networkAmount.sub(_treasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination));

		// Unstake tokens from each denomination in unstake address
		for (uint256 i=0; i < _unstakeAddress.length; i++) {
			if (_unstakeAddress[i] != address(0) && _unstakeAmount[i] > 0) {
				require (AOToken(_unstakeAddress[i]).unstakeFrom(_stakedContent.stakeOwner, _unstakeAmount[i]));
			}
		}
		return true;
	}

	/**
	 * @dev Unstake some primordial token on existing staked content
	 * @param _stakeId The ID of the staked content
	 * @param _primordialAmount The amount of the primordial token to unstake
	 * @return true on success
	 */
	function _unstakePartialPrimordialToken(bytes32 _stakeId, uint256 _primordialAmount) internal returns (bool) {
		// Make sure base denomination is active
		(, address _baseDenominationAddress, bool _baseDenominationActive) = _treasury.getBaseDenomination();
		require (_baseDenominationAddress != address(0));
		require (_baseDenominationActive == true);

		StakedContent storage _stakedContent = stakedContents[stakedContentIndex[_stakeId]];

		_stakedContent.primordialAmount = _stakedContent.primordialAmount.sub(_primordialAmount);

		// Primordial Token is the base AO Token
		AOToken _primordialToken = AOToken(_baseDenominationAddress);
		require (_primordialToken.unstakeIcoTokenFrom(_stakedContent.stakeOwner, _primordialAmount, _stakedContent.primordialWeightedIndex));
		return true;
	}

	/**
	 * @dev Check whether the network token and/or primordial token is adequate to pay for existing staked content
	 * @param _stakeId The stake ID to be checked
	 * @param _networkIntegerAmount The integer amount of the network token
	 * @param _networkFractionAmount The fraction amount of the network token
	 * @param _denomination The denomination of the the network token
	 * @param _primordialAmount The amount of primordial token
	 * @return true when the amount is sufficient, false otherwise
	 */
	function _canStakeExisting(bytes32 _stakeId, uint256 _networkIntegerAmount, uint256 _networkFractionAmount, bytes8 _denomination, uint256 _primordialAmount) internal view returns (bool) {
		StakedContent memory _stakedContent = stakedContents[stakedContentIndex[_stakeId]];

		if (_denomination.length > 0 && (_networkIntegerAmount > 0 || _networkFractionAmount > 0)) {
			return _treasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination).add(_primordialAmount).add(_stakedContent.networkAmount).add(_stakedContent.primordialAmount) >= _stakedContent.fileSize;
		} else if (_primordialAmount > 0) {
			return _stakedContent.networkAmount.add(_stakedContent.primordialAmount).add(_primordialAmount) >= _stakedContent.fileSize;
		} else {
			return false;
		}
	}

	/*
	function _rewardBuyContentNetworkEarning(address _sender, address _stakeOwner, address _host, bytes32 _buyId, bytes32 _stakeId, uint256 _denominationAmount, bytes8 _denomination, uint256 _profitPercentage) internal {
		// Make sure the _denomination is in the available list
		(address _denominationAddress, bool _denominationActive) = _treasury.getDenomination(_denomination);
		require (_denominationAddress != address(0));
		require (_denominationActive == true);

		BoughtContent storage _boughtContent = boughtContents[boughtContentIndex[_buyId]];

		_boughtContent.denominationAmount = _denominationAmount;
		_boughtContent.denomination = _denomination;

		AOToken _denominationToken = AOToken(_denominationAddress);

		// Transfer the profit percentage to stake owner
		uint256 _contentCreatorProfit = (_denominationAmount.mul(_profitPercentage)).div(PERCENTAGE_DIVISOR);
		require (_denominationToken.whitelistTransferFrom(_sender, _stakeOwner, _contentCreatorProfit));
		emit BuyContentNetworkTokenEarning(_stakeOwner, _sender, _buyId, _stakeId, _contentCreatorProfit, _denomination, _profitPercentage, 0);

		// Transfer the profit difference to _host
		require (_denominationToken.whitelistTransferFrom(_sender, _host, _denominationAmount.sub(_contentCreatorProfit)));
		emit BuyContentNetworkTokenEarning(_host, _sender, _buyId, _stakeId, _denominationAmount.sub(_contentCreatorProfit), _denomination, PERCENTAGE_DIVISOR.sub(_profitPercentage), 1);
	}

	function _rewardBuyContentPrimordialEarning(address _sender, address _stakeOwner, address _host, bytes32 _buyId, bytes32 _stakeId, uint256 _icoTokenAmount, uint256 _profitPercentage) internal {
		(, address _baseDenominationAddress, bool _baseDenominationActive) = _treasury.getBaseDenomination();
		require (_baseDenominationAddress != address(0));
		require (_baseDenominationActive == true);

		BoughtContent storage _boughtContent = boughtContents[boughtContentIndex[_buyId]];

		_boughtContent.icoTokenAmount = _icoTokenAmount;

		// ICO Token is the base AO Token
		AOToken _icoToken = AOToken(_baseDenominationAddress);
		_boughtContent.icoTokenWeightedIndex = _icoToken.weightedIndexByAddress(_sender);

		// Transfer the profit percentage to stake owner
		uint256 _contentCreatorIcoProfit = (_icoTokenAmount.mul(_profitPercentage)).div(PERCENTAGE_DIVISOR);
		require (_icoToken.whitelistTransferIcoTokenFrom(_sender, _stakeOwner, _contentCreatorIcoProfit));
		emit BuyContentPrimordialTokenEarning(_stakeOwner, _sender, _buyId, _stakeId, _contentCreatorIcoProfit, _boughtContent.icoTokenWeightedIndex, _profitPercentage, 0);

		// Transfer the profit difference to _host
		require (_icoToken.whitelistTransferIcoTokenFrom(_sender, _host, _icoTokenAmount.sub(_contentCreatorIcoProfit)));
		emit BuyContentPrimordialTokenEarning(_host, _sender, _buyId, _stakeId, _icoTokenAmount.sub(_contentCreatorIcoProfit), _boughtContent.icoTokenWeightedIndex, PERCENTAGE_DIVISOR.sub(_profitPercentage), 1);
	}
	*/
}
