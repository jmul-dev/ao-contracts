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
	uint256 public totalStakedContents;
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
		bool active; // true if currently staked, false when unstaked
		uint256 createdOnTimestamp;
	}

	// Mapping from StakedContent index to the StakedContent object
	mapping (uint256 => StakedContent) private stakedContents;

	// Mapping from stake ID to index of the stakedContents list
	mapping (bytes32 => uint256) private stakedContentIndex;

	// Event to be broadcasted to public when `stakeOwner` stakes a new content
	event StakeContent(address indexed stakeOwner, bytes32 indexed stakeId, uint256 denominationAmount, bytes8 denomination, uint256 icoTokenAmount, uint256 icoTokenWeightedIndex, string datKey, uint256 fileSize, uint256 createdOnTimestamp);

	// Event to be broadcasted to public when `stakeOwner` unstakes an existing content
	event UnstakeContent(address indexed stakeOwner, bytes32 indexed stakeId);

	// Event to be broadcasted to public when `stakeOwner` re-stakes an existing content
	event RestakeContent(address indexed stakeOwner, bytes32 indexed stakeId, uint256 denominationAmount, bytes8 denomination, uint256 icoTokenAmount, uint256 icoTokenWeightedIndex);

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

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Stake `_denominationAmount` of normal ERC20 and/or `_icoTokenAmount` ICO Tokens for a content
	 * @param _denominationAmount The amount of normal ERC20 token to stake
	 * @param _denomination The denomination of the normal ERC20 token, i.e ao, kilo, mega, etc.
	 * @param _icoTokenAmount The amount of ICO Token to stake
	 * @param _datKey The dat key of the file
	 * @param _fileSize The size of the file
	 */
	function stakeContent(uint256 _denominationAmount, bytes8 _denomination, uint256 _icoTokenAmount, string _datKey, uint256 _fileSize) public isActive {
		require (bytes(_datKey).length > 0);
		require (_fileSize > 0);
		require (_denominationAmount > 0 || _icoTokenAmount > 0);

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

		emit StakeContent(msg.sender, _stakeId, _denominationAmount, _denomination, _icoTokenAmount, _stakedContent.icoTokenWeightedIndex, _datKey, _fileSize, _stakedContent.createdOnTimestamp);
	}

	/**
	 * @dev Unstake existing staked content and refund the staked amount to the stake owner
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
			// Clear the denomination amount
			_stakedContent.denominationAmount = 0;
			_stakedContent.denomination = '';

			AOToken _denominationToken = AOToken(_treasury.denominations(_stakedContent.denomination));
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
	 * @dev Restake existing staked content
	 * @param _stakeId The ID of the staked content
	 * @param _denominationAmount The amount of normal ERC20 token to stake
	 * @param _denomination The denomination of the normal ERC20 token, i.e ao, kilo, mega, etc.
	 * @param _icoTokenAmount The amount of ICO Token to stake
	 */
	function restakeContent(bytes32 _stakeId, uint256 _denominationAmount, bytes8 _denomination, uint256 _icoTokenAmount) public isActive {
		// Make sure the staked content exist
		require (stakedContentIndex[_stakeId] > 0);

		StakedContent storage _stakedContent = stakedContents[stakedContentIndex[_stakeId]];
		// Make sure the staked content owner is the same as the sender
		require (_stakedContent.stakeOwner == msg.sender);
		// Make sure the staked content is currently inactive (unstaked) with 0 staked amount
		require (_stakedContent.active == false && _stakedContent.denominationAmount == 0 && _stakedContent.icoTokenAmount == 0 && _stakedContent.icoTokenWeightedIndex == 0);
		// Make sure the staked token amount can cover the fileSize
		require (_denominationAmount.add(_icoTokenAmount) >= _stakedContent.fileSize);

		_stakedContent.active = true;
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
		emit RestakeContent(msg.sender, _stakeId, _denominationAmount, _denomination, _icoTokenAmount, _stakedContent.icoTokenWeightedIndex);
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
	 * @return status of the staked content
	 * @return the timestamp when the staked content was created
	 */
	function stakedContentById(bytes32 _stakeId) public view returns (address, uint256, bytes8, uint256, uint256, string, uint256, bool, uint256) {
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
			_stakedContent.active,
			_stakedContent.createdOnTimestamp
		);
	}
}
