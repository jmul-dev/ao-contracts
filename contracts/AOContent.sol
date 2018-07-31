pragma solidity ^0.4.24;

import './SafeMath.sol';
import './owned.sol';
import './AOToken.sol';
import './AOTreasury.sol';

/**
 * @title AOContent
 *
 * The purpose of this contract is to allow content creator to stake normal ERC20 AO tokens and/or ICO AO Tokens
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
		/**
		 * denominationAmount is the amount of the normal ERC20 token to stake
		 * For example:
		 * denominationAmount = 1123
		 * denomination = kilo
		 * this actually means 1.123 AOKILO since kilo has 3 decimals
		 */
		uint256 denominationAmount;
		bytes8 denomination; // i.e ao, kilo, mega, etc.
		uint256 icoTokenAmount;	// icoTokenAmount is the amount of ICO AO Token to stake (always in base denomination)
		uint256 icoTokenWeightedIndex;
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
		/**
		 * denominationAmount is the amount of the normal ERC20 token to spend
		 * For example:
		 * denominationAmount = 1123
		 * denomination = kilo
		 * this actually means 1.123 AOKILO since kilo has 3 decimals
		 */
		uint256 denominationAmount;
		bytes8 denomination; // i.e ao, kilo, mega, etc.
		uint256 icoTokenAmount;	// icoTokenAmount is the amount of ICO AO Token to stake (always in base denomination)
		uint256 icoTokenWeightedIndex;
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
	event StakeContent(address indexed stakeOwner, bytes32 indexed stakeId, uint256 denominationAmount, bytes8 denomination, uint256 icoTokenAmount, uint256 icoTokenWeightedIndex, string datKey, uint256 fileSize, uint256 profitPercentage, uint256 createdOnTimestamp);

	// Event to be broadcasted to public when `stakeOwner` updates the staked content's profit percentage
	event SetProfitPercentage(address indexed stakeOwner, bytes32 indexed stakeId, uint256 newProfitPercentage);

	// Event to be broadcasted to public when `stakeOwner` unstakes all token amount on an existing content
	event UnstakeContent(address indexed stakeOwner, bytes32 indexed stakeId);

	// Event to be broadcasted to public when `stakeOwner` unstakes partial token amount on an existing content
	event UnstakePartialContent(address indexed stakeOwner, bytes32 indexed stakeId, uint256 remainingDenominationAmount, bytes8 denomination, uint256 remainingIcoTokenAmount, uint256 icoTokenWeightedIndex);

	// Event to be broadcasted to public when `stakeOwner` re-stakes an existing content
	event StakeExistingContent(address indexed stakeOwner, bytes32 indexed stakeId, uint256 currentDenominationAmount, bytes8 currentDenomination, uint256 currentIcoTokenAmount, uint256 currentIcoTokenWeightedIndex);

	// Event to be broadcasted to public when `buyer` buys an existing content
	event BuyContent(address indexed buyer, bytes32 indexed buyId, bytes32 indexed stakeId, address host, uint256 denominationAmountSpent, bytes8 denomination, uint256 icoTokenAmountSpent, uint256 icoTokenWeightedIndex);

	// Event to be broadcasted to public when stake owner (content creator) or host receives profit when someone buys the content
	// recipientType:
	// 0 => Stake Owner (Content Creator)
	// 1 => Node Host
	event BuyContentNetworkTokenEarning(address indexed recipient, address indexed sender, bytes32 indexed buyId, bytes32 stakeId, uint256 denominationAmount, bytes8 denomination, uint256 profitPercentage, uint8 recipientType);
	event BuyContentPrimordialTokenEarning(address indexed recipient, address indexed sender, bytes32 indexed buyId, bytes32 stakeId, uint256 icoTokenAmount, uint256 icoTokenWeightedIndex, uint256 profitPercentage, uint8 recipientType);

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

	/**
	 * @dev Whitelisted address sets inflation rate
	 * @param _inflationRate The new inflation rate value to be set
	 */
	function setInflationRate(uint256 _inflationRate) public inWhitelist(msg.sender) {
		inflationRate = _inflationRate;
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Stake `_denominationAmount` of normal ERC20 and/or `_icoTokenAmount` ICO Tokens for a content
	 * @param _denominationAmount The amount of normal ERC20 token to stake
	 * @param _denomination The denomination of the normal ERC20 token, i.e ao, kilo, mega, etc.
	 * @param _icoTokenAmount The amount of ICO Token to stake
	 * @param _datKey The dat key of the file
	 * @param _fileSize The size of the file
	 * @param _profitPercentage The percentage of profit the stake owner's media will charge
	 */
	function stakeContent(uint256 _denominationAmount, bytes8 _denomination, uint256 _icoTokenAmount, string _datKey, uint256 _fileSize, uint256 _profitPercentage) public isActive {
		require (bytes(_datKey).length > 0);
		require (_fileSize > 0);
		require (_denominationAmount > 0 || _icoTokenAmount > 0);
		require (_profitPercentage <= PERCENTAGE_DIVISOR);

		// Make sure the staked token amount can cover the fileSize
		require (_denominationAmount.add(_icoTokenAmount) >= _fileSize);

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

		if (_denominationAmount > 0) {
			// Make sure the _denomination is in the available list
			require (_treasury.denominations(_denomination) != address(0));

			_stakedContent.denominationAmount = _denominationAmount;
			_stakedContent.denomination = _denomination;

			AOToken _denominationToken = AOToken(_treasury.denominations(_denomination));
			require (_denominationToken.stakeFrom(msg.sender, _denominationAmount));
		}
		if (_icoTokenAmount > 0) {
			_stakedContent.icoTokenAmount = _icoTokenAmount;

			// ICO Token is the base AO Token
			AOToken _icoToken = AOToken(_treasury.denominations(_treasury.BASE_DENOMINATION()));
			_stakedContent.icoTokenWeightedIndex = _icoToken.weightedIndexByAddress(msg.sender);
			require (_icoToken.stakeIcoTokenFrom(msg.sender, _icoTokenAmount, _stakedContent.icoTokenWeightedIndex));
		}

		emit StakeContent(msg.sender, _stakeId, _denominationAmount, _denomination, _icoTokenAmount, _stakedContent.icoTokenWeightedIndex, _datKey, _fileSize, _profitPercentage, _stakedContent.createdOnTimestamp);
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
		require (_stakedContent.active == true && (_stakedContent.denominationAmount > 0 || _stakedContent.icoTokenAmount > 0));

		_stakedContent.active = false;

		// Refund the staked normal ERC20 tokens to the stake owner
		if (_stakedContent.denominationAmount > 0) {
			uint256 _denominationAmount = _stakedContent.denominationAmount;
			bytes8 _denomination = _stakedContent.denomination;

			// Clear the denomination amount
			_stakedContent.denominationAmount = 0;
			_stakedContent.denomination = '';

			AOToken _denominationToken = AOToken(_treasury.denominations(_denomination));
			require (_denominationToken.unstakeFrom(msg.sender, _denominationAmount));
		}

		// Refund the staked ICO tokens to the stake owner
		if (_stakedContent.icoTokenAmount > 0) {
			uint256 _icoTokenAmount = _stakedContent.icoTokenAmount;
			uint256 _icoTokenWeightedIndex = _stakedContent.icoTokenWeightedIndex;

			// Clear the ico token amount and the weighted index
			_stakedContent.icoTokenAmount = 0;
			_stakedContent.icoTokenWeightedIndex = 0;

			AOToken _icoToken = AOToken(_treasury.denominations(_treasury.BASE_DENOMINATION()));
			require (_icoToken.unstakeIcoTokenFrom(msg.sender, _icoTokenAmount, _icoTokenWeightedIndex));
		}

		emit UnstakeContent(msg.sender, _stakeId);
	}

	/**
	 * @dev Unstake existing staked content and refund partial staked amount to the stake owner
	 *		Use unstakeContent() to unstake all staked token amount. unstakePartialContent() can unstake only up to
	 *		the mininum required to cover the fileSize
	 * @param _stakeId The ID of the staked content
	 * @param _denominationAmount The amount of normal ERC20 AO token to unstake
	 * @param _icoTokenAmount The amount of ICO AO token to unstake
	 */
	function unstakePartialContent(bytes32 _stakeId, uint256 _denominationAmount, uint256 _icoTokenAmount) public isActive {
		// Make sure the staked content exist
		require (stakedContentIndex[_stakeId] > 0);
		require (_denominationAmount > 0 || _icoTokenAmount > 0);

		StakedContent storage _stakedContent = stakedContents[stakedContentIndex[_stakeId]];
		// Make sure the staked content owner is the same as the sender
		require (_stakedContent.stakeOwner == msg.sender);
		// Make sure the staked content is currently active (staked) with some amounts
		require (_stakedContent.active == true && (_stakedContent.denominationAmount > 0 || _stakedContent.icoTokenAmount > 0));
		// Make sure the staked content has enough balance to unstake
		require (_stakedContent.denominationAmount >= _denominationAmount && _stakedContent.icoTokenAmount >= _icoTokenAmount);
		// Make sure the minimum required staked amount can cover the content file size
		require ((_stakedContent.denominationAmount.sub(_denominationAmount)).add(_stakedContent.icoTokenAmount.sub(_icoTokenAmount)) >= _stakedContent.fileSize);

		// Refund `_denominationAmount` of normal ERC20 tokens to the stake owner
		if (_denominationAmount > 0) {
			_stakedContent.denominationAmount = _stakedContent.denominationAmount.sub(_denominationAmount);

			AOToken _denominationToken = AOToken(_treasury.denominations(_stakedContent.denomination));
			require (_denominationToken.unstakeFrom(msg.sender, _denominationAmount));
		}

		// Refund `_icoTokenAmount` of staked ICO tokens to the stake owner
		if (_icoTokenAmount > 0) {
			_stakedContent.icoTokenAmount = _stakedContent.icoTokenAmount.sub(_icoTokenAmount);
			AOToken _icoToken = AOToken(_treasury.denominations(_treasury.BASE_DENOMINATION()));
			require (_icoToken.unstakeIcoTokenFrom(msg.sender, _icoTokenAmount, _stakedContent.icoTokenWeightedIndex));
		}

		emit UnstakePartialContent(msg.sender, _stakeId, _stakedContent.denominationAmount, _stakedContent.denomination, _stakedContent.icoTokenAmount, _stakedContent.icoTokenWeightedIndex);
	}

	/**
	 * @dev Stake existing content
	 *		If the existing staked content's denomination is not set, then we are going to use the `_denomination` passed in the params.
	 *		Otherwise, we use the denomination from existing existing staked content.
	 *
	 * @param _stakeId The ID of the staked content
	 * @param _denominationAmount The amount of normal ERC20 token to stake
	 * @param _denomination The denomination of the normal ERC20 token, i.e ao, kilo, mega, etc.
	 * @param _icoTokenAmount The amount of ICO Token to stake
	 */
	function stakeExistingContent(bytes32 _stakeId, uint256 _denominationAmount, bytes8 _denomination, uint256 _icoTokenAmount) public isActive {
		// Make sure the staked content exist
		require (stakedContentIndex[_stakeId] > 0);
		require (_denominationAmount > 0 || _icoTokenAmount > 0);

		StakedContent storage _stakedContent = stakedContents[stakedContentIndex[_stakeId]];
		// Make sure the staked content owner is the same as the sender
		require (_stakedContent.stakeOwner == msg.sender);

		// Make sure the `_denomination` is valid
		// If we are currently staking an active staked content, then the `_denomination` has to match `_stakedContent.denomination`
		// i.e, can't replace existing denomination with a new one
		if (_denominationAmount > 0 && _denomination.length > 0 && _stakedContent.active && _stakedContent.denominationAmount > 0 && _stakedContent.denomination.length > 0) {
			require (_denomination == _stakedContent.denomination);
		}

		// Make sure we can stake ICO token
		// If we are currently staking an active staked content, then the stake owner's weighted index has to match `stakedContent.icoTokenWeightedIndex`
		// i.e, can't use a combination of different weighted index. Stake owner has to call unstakeContent() to unstake all tokens first
		// ICO Token is the base AO Token
		AOToken _icoToken = AOToken(_treasury.denominations(_treasury.BASE_DENOMINATION()));
		if (_icoTokenAmount > 0 && _stakedContent.active && _stakedContent.icoTokenAmount > 0) {
			require (_icoToken.weightedIndexByAddress(msg.sender) == _stakedContent.icoTokenWeightedIndex);
		}

		// Make sure the staked token amount can cover the fileSize
		require (_stakedContent.denominationAmount.add(_denominationAmount).add(_stakedContent.icoTokenAmount).add(_icoTokenAmount) >= _stakedContent.fileSize);

		if (_denominationAmount > 0) {
			// Make sure the _denomination is in the available list
			require (_treasury.denominations(_denomination) != address(0));

			_stakedContent.denominationAmount = _stakedContent.denominationAmount.add(_denominationAmount);
			_stakedContent.denomination = _denomination;

			AOToken _denominationToken = AOToken(_treasury.denominations(_denomination));
			require (_denominationToken.stakeFrom(msg.sender, _denominationAmount));
		}
		if (_icoTokenAmount > 0) {
			_stakedContent.icoTokenAmount = _stakedContent.icoTokenAmount.add(_icoTokenAmount);
			_stakedContent.icoTokenWeightedIndex = _icoToken.weightedIndexByAddress(msg.sender);
			require (_icoToken.stakeIcoTokenFrom(msg.sender, _icoTokenAmount, _stakedContent.icoTokenWeightedIndex));
		}
		_stakedContent.active = true;
		emit StakeExistingContent(msg.sender, _stakeId, _stakedContent.denominationAmount, _stakedContent.denomination, _stakedContent.icoTokenAmount, _stakedContent.icoTokenWeightedIndex);
	}

	/**
	 * @dev Return staked content information at a given ID
	 * @param _stakeId The ID of the staked content
	 * @return address of the staked content's owner
	 * @return the denomination amount staked for this content
	 * @return the token denomination of the staked content
	 * @return the ICO token amount staked for this content
	 * @return the ICO token weighted index of the staked content
	 * @return the dat key of the content
	 * @return the file size of the content
	 * @return the profit percentage of the content
	 * @return status of the staked content
	 * @return the timestamp when the staked content was created
	 */
	function stakedContentById(bytes32 _stakeId) public view returns (address, uint256, bytes8, uint256, uint256, string, uint256, uint256, bool, uint256) {
		// Make sure the staked content exist
		require (stakedContentIndex[_stakeId] > 0);

		StakedContent memory _stakedContent = stakedContents[stakedContentIndex[_stakeId]];
		return (
			_stakedContent.stakeOwner,
			_stakedContent.denominationAmount,
			_stakedContent.denomination,
			_stakedContent.icoTokenAmount,
			_stakedContent.icoTokenWeightedIndex,
			_stakedContent.datKey,
			_stakedContent.fileSize,
			_stakedContent.profitPercentage,
			_stakedContent.active,
			_stakedContent.createdOnTimestamp
		);
	}

	/**
	 * @dev Buy existing content
	 * @param _stakeId The ID of the staked content
	 * @param _host The host address of the content
	 * @param _denominationAmount The amount of normal ERC20 token to spend
	 * @param _denomination The denomination of the normal ERC20 token, i.e ao, kilo, mega, etc.
	 * @param _icoTokenAmount The amount of ICO Token to spend
	 */
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

	/***** INTERNAL METHODS *****/
	function _rewardBuyContentNetworkEarning(address _sender, address _stakeOwner, address _host, bytes32 _buyId, bytes32 _stakeId, uint256 _denominationAmount, bytes8 _denomination, uint256 _profitPercentage) internal {
		// Make sure the _denomination is in the available list
		require (_treasury.denominations(_denomination) != address(0));

		BoughtContent storage _boughtContent = boughtContents[boughtContentIndex[_buyId]];

		_boughtContent.denominationAmount = _denominationAmount;
		_boughtContent.denomination = _denomination;

		AOToken _denominationToken = AOToken(_treasury.denominations(_denomination));

		// Transfer the profit percentage to stake owner
		uint256 _contentCreatorProfit = (_denominationAmount.mul(_profitPercentage)).div(PERCENTAGE_DIVISOR);
		require (_denominationToken.whitelistTransferFrom(_sender, _stakeOwner, _contentCreatorProfit));
		emit BuyContentNetworkTokenEarning(_stakeOwner, _sender, _buyId, _stakeId, _contentCreatorProfit, _denomination, _profitPercentage, 0);

		// Transfer the profit difference to _host
		require (_denominationToken.whitelistTransferFrom(_sender, _host, _denominationAmount.sub(_contentCreatorProfit)));
		emit BuyContentNetworkTokenEarning(_host, _sender, _buyId, _stakeId, _denominationAmount.sub(_contentCreatorProfit), _denomination, PERCENTAGE_DIVISOR.sub(_profitPercentage), 1);
	}

	function _rewardBuyContentPrimordialEarning(address _sender, address _stakeOwner, address _host, bytes32 _buyId, bytes32 _stakeId, uint256 _icoTokenAmount, uint256 _profitPercentage) internal {
		BoughtContent storage _boughtContent = boughtContents[boughtContentIndex[_buyId]];

		_boughtContent.icoTokenAmount = _icoTokenAmount;

		// ICO Token is the base AO Token
		AOToken _icoToken = AOToken(_treasury.denominations(_treasury.BASE_DENOMINATION()));
		_boughtContent.icoTokenWeightedIndex = _icoToken.weightedIndexByAddress(_sender);

		// Transfer the profit percentage to stake owner
		uint256 _contentCreatorIcoProfit = (_icoTokenAmount.mul(_profitPercentage)).div(PERCENTAGE_DIVISOR);
		require (_icoToken.whitelistTransferIcoTokenFrom(_sender, _stakeOwner, _contentCreatorIcoProfit));
		emit BuyContentPrimordialTokenEarning(_stakeOwner, _sender, _buyId, _stakeId, _contentCreatorIcoProfit, _boughtContent.icoTokenWeightedIndex, _profitPercentage, 0);

		// Transfer the profit difference to _host
		require (_icoToken.whitelistTransferIcoTokenFrom(_sender, _host, _icoTokenAmount.sub(_contentCreatorIcoProfit)));
		emit BuyContentPrimordialTokenEarning(_host, _sender, _buyId, _stakeId, _icoTokenAmount.sub(_contentCreatorIcoProfit), _boughtContent.icoTokenWeightedIndex, PERCENTAGE_DIVISOR.sub(_profitPercentage), 1);
	}
}
