pragma solidity ^0.4.24;

import './SafeMath.sol';
import './owned.sol';
import './AOToken.sol';
import './AOTreasury.sol';

/**
 * @title AOStake
 */
contract AOStake is owned {
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
		uint256 createdOnTimestamp;
	}

	// Mapping from StakedContent index to the StakedContent object
	mapping (uint256 => StakedContent) private stakedContents;

	// Mapping from stake ID to index of the stakedContents list
	mapping (bytes32 => uint256) private stakedContentIndex;

	// Mapping from stake owner address to list of his/her owned stake IDs
	mapping (address => bytes32[]) internal ownedStakedContents;

	// Mapping from stake owner's stake ID to index of the owner staked contents list
	mapping (address => mapping (bytes32 => uint256)) internal ownedStakedContentsIndex;

	// Event to be broadcasted to public when account staked content is created
	event StakedContentCreation(address indexed stakeOwner, bytes32 indexed stakeId, uint256 denominationAmount, bytes8 denomination, uint256 icoTokenAmount, uint256 icoTokenWeightedIndex, string datKey, uint256 fileSize, uint256 createdOnTimestamp);

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
	 * @dev Owner triggers emergency mode. Will refund all the staked funds to the owner
	 */
	function escapeHatch() public onlyOwner isActive {
		killed = true;
		// TODO: refund staked funds
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
	 * @return true on success
	 */
	function stakeContent(uint256 _denominationAmount, bytes8 _denomination, uint256 _icoTokenAmount, string _datKey, uint256 _fileSize) public isActive returns (bool) {
		// Make sure the _denomination is in the available list
		require (_treasury.denominations(_denomination) != address(0));
		require (bytes(_datKey).length > 0);
		require (_fileSize > 0);
		require (_denominationAmount > 0 || _icoTokenAmount > 0);

		AOToken _denominationToken = AOToken(_treasury.denominations(_denomination));
		// ICO Token is the base AO Token
		AOToken _icoToken = AOToken(_treasury.denominations(_treasury.BASE_DENOMINATION()));

		// Make sure the staked token amount can cover the fileSize
		require (_denominationAmount.add(_icoTokenAmount) >= _fileSize);

		// Increment totalStakedContents
		totalStakedContents++;

		// Generate stakeId
		bytes32 _stakeId = keccak256(abi.encodePacked(this, msg.sender, totalStakedContents, _datKey));
		StakedContent storage _stakedContent = stakedContents[totalStakedContents];
		_stakedContent.stakeId = _stakeId;
		_stakedContent.stakeOwner = msg.sender;
		_stakedContent.denominationAmount = _denominationAmount;
		_stakedContent.denomination = _denomination;
		_stakedContent.icoTokenAmount = _icoTokenAmount;
		_stakedContent.icoTokenWeightedIndex = _icoToken.weightedIndexByAddress(msg.sender);
		_stakedContent.datKey = _datKey;
		_stakedContent.fileSize = _fileSize;
		_stakedContent.createdOnTimestamp = now;

		stakedContentIndex[_stakeId] = totalStakedContents;
		ownedStakedContents[msg.sender].push(_stakeId);
		uint256 _stakeIdIndex = ownedStakedContents[msg.sender].length;
		ownedStakedContentsIndex[msg.sender][_stakeId] = _stakeIdIndex;

		/**
		 * TODO
		if (_denominationAmount > 0) {
			require (_denominationToken.stake(msg.sender, _denominationAmount));
		}
		if (_icoTokenAmount > 0) {
			require (_icoToken.stakeIcoToken(msg.sender, _icoTokenAmount));
		}
		*/

		emit StakedContentCreation(msg.sender, _stakeId, _denominationAmount, _denomination, _icoTokenAmount, _stakedContent.icoTokenWeightedIndex, _datKey, _fileSize, _stakedContent.createdOnTimestamp);
		return true;
	}
}
