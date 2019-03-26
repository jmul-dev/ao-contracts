pragma solidity >=0.5.4 <0.6.0;

import './SafeMath.sol';
import './AOLibrary.sol';
import './TheAO.sol';
import './IAOStakedContent.sol';
import './AOIon.sol';
import './IAOTreasury.sol';
import './IAOContent.sol';

/**
 * @title AOStakedContent
 */
contract AOStakedContent is TheAO, IAOStakedContent {
	using SafeMath for uint256;

	uint256 public totalStakedContents;
	address public aoIonAddress;
	address public aoTreasuryAddress;
	address public aoContentAddress;

	AOIon internal _aoIon;
	IAOTreasury internal _aoTreasury;
	IAOContent internal _aoContent;

	struct StakedContent {
		bytes32 stakedContentId;
		bytes32 contentId;
		address stakeOwner;
		uint256 networkAmount;		// total network ion staked in base denomination
		uint256 primordialAmount;	// the amount of primordial AOIon to stake (always in base denomination)
		uint256 primordialWeightedMultiplier;
		uint256 profitPercentage;	// support up to 4 decimals, 100% = 1000000
		bool active;	// true if currently staked, false when unstaked
		uint256 createdOnTimestamp;
	}

	// Mapping from StakedContent index to the StakedContent object
	mapping (uint256 => StakedContent) internal stakedContents;

	// Mapping from StakedContent ID to index of the stakedContents list
	mapping (bytes32 => uint256) internal stakedContentIndex;

	// Event to be broadcasted to public when `stakeOwner` stakes a new content
	event StakeContent(
		address indexed stakeOwner,
		bytes32 indexed stakedContentId,
		bytes32 indexed contentId,
		uint256 baseNetworkAmount,
		uint256 primordialAmount,
		uint256 primordialWeightedMultiplier,
		uint256 profitPercentage,
		uint256 createdOnTimestamp
	);

	// Event to be broadcasted to public when `stakeOwner` updates the staked content's profit percentage
	event SetProfitPercentage(address indexed stakeOwner, bytes32 indexed stakedContentId, uint256 newProfitPercentage);

	// Event to be broadcasted to public when `stakeOwner` unstakes some network/primordial ion from an existing content
	event UnstakePartialContent(
		address indexed stakeOwner,
		bytes32 indexed stakedContentId,
		bytes32 indexed contentId,
		uint256 remainingNetworkAmount,
		uint256 remainingPrimordialAmount,
		uint256 primordialWeightedMultiplier
	);

	// Event to be broadcasted to public when `stakeOwner` unstakes all ion amount on an existing content
	event UnstakeContent(address indexed stakeOwner, bytes32 indexed stakedContentId);

	// Event to be broadcasted to public when `stakeOwner` re-stakes an existing content
	event StakeExistingContent(
		address indexed stakeOwner,
		bytes32 indexed stakedContentId,
		bytes32 indexed contentId,
		uint256 currentNetworkAmount,
		uint256 currentPrimordialAmount,
		uint256 currentPrimordialWeightedMultiplier
	);

	/**
	 * @dev Constructor function
	 * @param _aoIonAddress The address of AOIon
	 * @param _aoTreasuryAddress The address of AOTreasury
	 * @param _aoContentAddress The address of AOContent
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	constructor(address _aoIonAddress, address _aoTreasuryAddress, address _aoContentAddress, address _nameTAOPositionAddress) public {
		setAOIonAddress(_aoIonAddress);
		setAOTreasuryAddress(_aoTreasuryAddress);
		setAOContentAddress(_aoContentAddress);
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
	 * @dev The AO sets AOIon address
	 * @param _aoIonAddress The address of AOIon
	 */
	function setAOIonAddress(address _aoIonAddress) public onlyTheAO {
		require (_aoIonAddress != address(0));
		aoIonAddress = _aoIonAddress;
		_aoIon = AOIon(_aoIonAddress);
	}

	/**
	 * @dev The AO sets AOTreasury address
	 * @param _aoTreasuryAddress The address of AOTreasury
	 */
	function setAOTreasuryAddress(address _aoTreasuryAddress) public onlyTheAO {
		require (_aoTreasuryAddress != address(0));
		aoTreasuryAddress = _aoTreasuryAddress;
		_aoTreasury = IAOTreasury(_aoTreasuryAddress);
	}

	/**
	 * @dev The AO sets AO Content address
	 * @param _aoContentAddress The address of AOContent
	 */
	function setAOContentAddress(address _aoContentAddress) public onlyTheAO {
		require (_aoContentAddress != address(0));
		aoContentAddress = _aoContentAddress;
		_aoContent = IAOContent(_aoContentAddress);
	}

	/**
	 * @dev The AO sets NameTAOPosition address
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	function setNameTAOPositionAddress(address _nameTAOPositionAddress) public onlyTheAO {
		require (_nameTAOPositionAddress != address(0));
		nameTAOPositionAddress = _nameTAOPositionAddress;
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Stake the content
	 * @param _stakeOwner the address that stake the content
	 * @param _contentId The ID of the content
	 * @param _networkIntegerAmount The integer amount of network ion to stake
	 * @param _networkFractionAmount The fraction amount of network ion to stake
	 * @param _denomination The denomination of the network ion, i.e ao, kilo, mega, etc.
	 * @param _primordialAmount The amount of primordial ion to stake
	 * @param _profitPercentage The percentage of profit the stake owner's media will charge
	 * @return the newly created staked content ID
	 */
	function create(address _stakeOwner,
		bytes32 _contentId,
		uint256 _networkIntegerAmount,
		uint256 _networkFractionAmount,
		bytes8 _denomination,
		uint256 _primordialAmount,
		uint256 _profitPercentage
		) external inWhitelist returns (bytes32) {
		require (_canCreate(_stakeOwner, _contentId, _networkIntegerAmount, _networkFractionAmount, _denomination, _primordialAmount, _profitPercentage));
		// Increment totalStakedContents
		totalStakedContents++;

		// Generate stakedContentId
		bytes32 _stakedContentId = keccak256(abi.encodePacked(this, _stakeOwner, _contentId));
		StakedContent storage _stakedContent = stakedContents[totalStakedContents];

		// Make sure the node doesn't stake the same content twice
		require (_stakedContent.stakeOwner == address(0));

		_stakedContent.stakedContentId = _stakedContentId;
		_stakedContent.contentId = _contentId;
		_stakedContent.stakeOwner = _stakeOwner;
		_stakedContent.profitPercentage = _profitPercentage;
		_stakedContent.active = true;
		_stakedContent.createdOnTimestamp = now;

		if (_aoTreasury.isDenominationExist(_denomination) && (_networkIntegerAmount > 0 || _networkFractionAmount > 0)) {
			_stakedContent.networkAmount = _aoTreasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination);
			require (_aoIon.stakeFrom(_stakeOwner, _stakedContent.networkAmount));
		}
		if (_primordialAmount > 0) {
			_stakedContent.primordialAmount = _primordialAmount;

			// Primordial ion is the base AO ion
			_stakedContent.primordialWeightedMultiplier = _aoIon.weightedMultiplierByAddress(_stakedContent.stakeOwner);
			require (_aoIon.stakePrimordialFrom(_stakedContent.stakeOwner, _primordialAmount, _stakedContent.primordialWeightedMultiplier));
		}

		stakedContentIndex[_stakedContentId] = totalStakedContents;

		emit StakeContent(_stakedContent.stakeOwner, _stakedContent.stakedContentId, _stakedContent.contentId, _stakedContent.networkAmount, _stakedContent.primordialAmount, _stakedContent.primordialWeightedMultiplier, _stakedContent.profitPercentage, _stakedContent.createdOnTimestamp);
		return _stakedContent.stakedContentId;
	}

	/**
	 * @dev Set profit percentage on existing staked content
	 *		Will throw error if this is a Creative Commons/T(AO) Content
	 * @param _stakedContentId The ID of the staked content
	 * @param _profitPercentage The new value to be set
	 */
	function setProfitPercentage(bytes32 _stakedContentId, uint256 _profitPercentage) public {
		require (_profitPercentage <= AOLibrary.PERCENTAGE_DIVISOR());

		// Make sure the staked content exist
		require (stakedContentIndex[_stakedContentId] > 0);

		StakedContent storage _stakedContent = stakedContents[stakedContentIndex[_stakedContentId]];
		// Make sure the staked content owner is the same as the sender
		require (_stakedContent.stakeOwner == msg.sender);

		// Make sure we are updating profit percentage for AO Content only
		// Creative Commons/T(AO) Content has 0 profit percentage
		require (_aoContent.isAOContentUsageType(_stakedContent.contentId));

		_stakedContent.profitPercentage = _profitPercentage;

		emit SetProfitPercentage(msg.sender, _stakedContentId, _profitPercentage);
	}

	/**
	 * @dev Return staked content information at a given ID
	 * @param _stakedContentId The ID of the staked content
	 * @return The ID of the content being staked
	 * @return address of the staked content's owner
	 * @return the network base ion amount staked for this content
	 * @return the primordial ion amount staked for this content
	 * @return the primordial weighted multiplier of the staked content
	 * @return the profit percentage of the content
	 * @return status of the staked content
	 * @return the timestamp when the staked content was created
	 */
	function getById(bytes32 _stakedContentId) external view returns (bytes32, address, uint256, uint256, uint256, uint256, bool, uint256) {
		// Make sure the staked content exist
		require (stakedContentIndex[_stakedContentId] > 0);

		StakedContent memory _stakedContent = stakedContents[stakedContentIndex[_stakedContentId]];
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
	 *		Use unstakeContent() to unstake all staked ion amount. unstakePartialContent() can unstake only up to
	 *		the mininum required to pay the fileSize
	 * @param _stakedContentId The ID of the staked content
	 * @param _networkIntegerAmount The integer amount of network ion to unstake
	 * @param _networkFractionAmount The fraction amount of network ion to unstake
	 * @param _denomination The denomination of the network ion, i.e ao, kilo, mega, etc.
	 * @param _primordialAmount The amount of primordial ion to unstake
	 */
	function unstakePartialContent(bytes32 _stakedContentId,
		uint256 _networkIntegerAmount,
		uint256 _networkFractionAmount,
		bytes8 _denomination,
		uint256 _primordialAmount
		) public {
		// Make sure the staked content exist
		require (stakedContentIndex[_stakedContentId] > 0);
		require (_networkIntegerAmount > 0 || _networkFractionAmount > 0 || _primordialAmount > 0);

		StakedContent storage _stakedContent = stakedContents[stakedContentIndex[_stakedContentId]];
		(, uint256 _fileSize,,,,,,,) = _aoContent.getById(_stakedContent.contentId);

		// Make sure the staked content owner is the same as the sender
		require (_stakedContent.stakeOwner == msg.sender);
		// Make sure the staked content is currently active (staked) with some amounts
		require (this.isActive(_stakedContentId));
		// Make sure the staked content has enough balance to unstake
		require (_canUnstakePartial(_networkIntegerAmount, _networkFractionAmount, _denomination, _primordialAmount, _stakedContent.networkAmount, _stakedContent.primordialAmount, _fileSize));

		if (_aoTreasury.isDenominationExist(_denomination) && (_networkIntegerAmount > 0 || _networkFractionAmount > 0)) {
			uint256 _unstakeNetworkAmount = _aoTreasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination);
			_stakedContent.networkAmount = _stakedContent.networkAmount.sub(_unstakeNetworkAmount);
			require (_aoIon.unstakeFrom(msg.sender, _unstakeNetworkAmount));
		}
		if (_primordialAmount > 0) {
			_stakedContent.primordialAmount = _stakedContent.primordialAmount.sub(_primordialAmount);
			require (_aoIon.unstakePrimordialFrom(msg.sender, _primordialAmount, _stakedContent.primordialWeightedMultiplier));
		}
		emit UnstakePartialContent(_stakedContent.stakeOwner, _stakedContent.stakedContentId, _stakedContent.contentId, _stakedContent.networkAmount, _stakedContent.primordialAmount, _stakedContent.primordialWeightedMultiplier);
	}

	/**
	 * @dev Unstake existing staked content and refund the total staked amount to the stake owner
	 * @param _stakedContentId The ID of the staked content
	 */
	function unstakeContent(bytes32 _stakedContentId) public {
		// Make sure the staked content exist
		require (stakedContentIndex[_stakedContentId] > 0);

		StakedContent storage _stakedContent = stakedContents[stakedContentIndex[_stakedContentId]];
		// Make sure the staked content owner is the same as the sender
		require (_stakedContent.stakeOwner == msg.sender);
		// Make sure the staked content is currently active (staked) with some amounts
		require (this.isActive(_stakedContentId));
		_stakedContent.active = false;

		if (_stakedContent.networkAmount > 0) {
			uint256 _unstakeNetworkAmount = _stakedContent.networkAmount;
			_stakedContent.networkAmount = 0;
			require (_aoIon.unstakeFrom(msg.sender, _unstakeNetworkAmount));
		}
		if (_stakedContent.primordialAmount > 0) {
			uint256 _primordialAmount = _stakedContent.primordialAmount;
			uint256 _primordialWeightedMultiplier = _stakedContent.primordialWeightedMultiplier;
			_stakedContent.primordialAmount = 0;
			_stakedContent.primordialWeightedMultiplier = 0;
			require (_aoIon.unstakePrimordialFrom(msg.sender, _primordialAmount, _primordialWeightedMultiplier));
		}
		emit UnstakeContent(_stakedContent.stakeOwner, _stakedContentId);
	}

	/**
	 * @dev Stake existing content with more ions (this is to increase the price)
	 *
	 * @param _stakedContentId The ID of the staked content
	 * @param _networkIntegerAmount The integer amount of network ion to stake
	 * @param _networkFractionAmount The fraction amount of network ion to stake
	 * @param _denomination The denomination of the network ion, i.e ao, kilo, mega, etc.
	 * @param _primordialAmount The amount of primordial ion to stake. (The primordial weighted multiplier has to match the current staked weighted multiplier)
	 */
	function stakeExistingContent(bytes32 _stakedContentId,
		uint256 _networkIntegerAmount,
		uint256 _networkFractionAmount,
		bytes8 _denomination,
		uint256 _primordialAmount
		) public {
		// Make sure the staked content exist
		require (stakedContentIndex[_stakedContentId] > 0);

		StakedContent storage _stakedContent = stakedContents[stakedContentIndex[_stakedContentId]];
		(, uint256 _fileSize,,,,,,,) = _aoContent.getById(_stakedContent.contentId);

		// Make sure the staked content owner is the same as the sender
		require (_stakedContent.stakeOwner == msg.sender);
		require (_networkIntegerAmount > 0 || _networkFractionAmount > 0 || _primordialAmount > 0);
		require (_canStakeExisting(_aoContent.isAOContentUsageType(_stakedContent.contentId), _fileSize, _stakedContent.networkAmount.add(_stakedContent.primordialAmount), _networkIntegerAmount, _networkFractionAmount, _denomination, _primordialAmount));

		// Make sure we can stake primordial ion
		// If we are currently staking an active staked content, then the stake owner's weighted multiplier has to match `stakedContent.primordialWeightedMultiplier`
		// i.e, can't use a combination of different weighted multiplier. Stake owner has to call unstakeContent() to unstake all ions first
		if (_primordialAmount > 0 && _stakedContent.active && _stakedContent.primordialAmount > 0 && _stakedContent.primordialWeightedMultiplier > 0) {
			require (_aoIon.weightedMultiplierByAddress(msg.sender) == _stakedContent.primordialWeightedMultiplier);
		}

		_stakedContent.active = true;
		if (_aoTreasury.isDenominationExist(_denomination) && (_networkIntegerAmount > 0 || _networkFractionAmount > 0)) {
			uint256 _stakeNetworkAmount = _aoTreasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination);
			_stakedContent.networkAmount = _stakedContent.networkAmount.add(_stakeNetworkAmount);
			require (_aoIon.stakeFrom(_stakedContent.stakeOwner, _stakeNetworkAmount));
		}
		if (_primordialAmount > 0) {
			_stakedContent.primordialAmount = _stakedContent.primordialAmount.add(_primordialAmount);

			// Primordial ion is the base AO ion
			_stakedContent.primordialWeightedMultiplier = _aoIon.weightedMultiplierByAddress(_stakedContent.stakeOwner);
			require (_aoIon.stakePrimordialFrom(_stakedContent.stakeOwner, _primordialAmount, _stakedContent.primordialWeightedMultiplier));
		}

		emit StakeExistingContent(msg.sender, _stakedContent.stakedContentId, _stakedContent.contentId, _stakedContent.networkAmount, _stakedContent.primordialAmount, _stakedContent.primordialWeightedMultiplier);
	}

	/**
	 * @dev Check whether or not a staked content is active
	 * @param _stakedContentId The ID of the staked content
	 * @return true if yes, false otherwise.
	 */
	function isActive(bytes32 _stakedContentId) external view returns (bool) {
		// Make sure the staked content exist
		require (stakedContentIndex[_stakedContentId] > 0);

		StakedContent memory _stakedContent = stakedContents[stakedContentIndex[_stakedContentId]];
		return (_stakedContent.active == true && (_stakedContent.networkAmount > 0 || (_stakedContent.primordialAmount > 0 && _stakedContent.primordialWeightedMultiplier > 0)));
	}

	/***** INTERNAL METHODS *****/
	/**
	 * @dev Checks if create params are valid
	 * @param _stakeOwner the address that stake the content
	 * @param _contentId The ID of the content
	 * @param _networkIntegerAmount The integer amount of network ion to stake
	 * @param _networkFractionAmount The fraction amount of network ion to stake
	 * @param _denomination The denomination of the network ion, i.e ao, kilo, mega, etc.
	 * @param _primordialAmount The amount of primordial ion to stake
	 * @param _profitPercentage The percentage of profit the stake owner's media will charge
	 * @return true if yes. false otherwise
	 */
	function _canCreate(address _stakeOwner,
		bytes32 _contentId,
		uint256 _networkIntegerAmount,
		uint256 _networkFractionAmount,
		bytes8 _denomination,
		uint256 _primordialAmount,
		uint256 _profitPercentage) internal view returns (bool) {
		(address _contentCreator, uint256 _fileSize,,,,,,,) = _aoContent.getById(_contentId);
		return (_stakeOwner != address(0) &&
			_stakeOwner == _contentCreator &&
			(_networkIntegerAmount > 0 || _networkFractionAmount > 0 || _primordialAmount > 0) &&
			(_aoContent.isAOContentUsageType(_contentId) ?
				_aoTreasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination).add(_primordialAmount) >= _fileSize :
				_aoTreasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination).add(_primordialAmount) == _fileSize
			) &&
			_profitPercentage <= AOLibrary.PERCENTAGE_DIVISOR()
		);
	}

	/**
	 * @dev Check whether or the requested unstake amount is valid
	 * @param _networkIntegerAmount The integer amount of the network ion
	 * @param _networkFractionAmount The fraction amount of the network ion
	 * @param _denomination The denomination of the the network ion
	 * @param _primordialAmount The amount of primordial ion
	 * @param _stakedNetworkAmount The current staked network ion amount
	 * @param _stakedPrimordialAmount The current staked primordial ion amount
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
		uint256 _stakedFileSize
		) internal view returns (bool) {
		if (
			(_denomination.length > 0 && _denomination[0] != 0 &&
				(_networkIntegerAmount > 0 || _networkFractionAmount > 0) &&
				_stakedNetworkAmount < _aoTreasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination)
			) ||
			_stakedPrimordialAmount < _primordialAmount ||
			(
				_denomination.length > 0 && _denomination[0] != 0
					&& (_networkIntegerAmount > 0 || _networkFractionAmount > 0)
					&& (_stakedNetworkAmount.sub(_aoTreasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination)).add(_stakedPrimordialAmount.sub(_primordialAmount)) < _stakedFileSize)
			) ||
			( _denomination.length == 0 && _denomination[0] == 0 && _networkIntegerAmount == 0 && _networkFractionAmount == 0 && _primordialAmount > 0 && _stakedPrimordialAmount.sub(_primordialAmount) < _stakedFileSize)
		) {
			return false;
		} else {
			return true;
		}
	}

	/**
	 * @dev Check whether the network ion and/or primordial ion is adequate to pay for existing staked content
	 * @param _isAOContentUsageType whether or not the content is of AO Content usage type
	 * @param _fileSize The size of the file
	 * @param _stakedAmount The total staked amount
	 * @param _networkIntegerAmount The integer amount of the network ion
	 * @param _networkFractionAmount The fraction amount of the network ion
	 * @param _denomination The denomination of the the network ion
	 * @param _primordialAmount The amount of primordial ion
	 * @return true when the amount is sufficient, false otherwise
	 */
	function _canStakeExisting(
		bool _isAOContentUsageType,
		uint256 _fileSize,
		uint256 _stakedAmount,
		uint256 _networkIntegerAmount,
		uint256 _networkFractionAmount,
		bytes8 _denomination,
		uint256 _primordialAmount
	) internal view returns (bool) {
		if (_isAOContentUsageType) {
			return _aoTreasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination).add(_primordialAmount).add(_stakedAmount) >= _fileSize;
		} else {
			return _aoTreasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination).add(_primordialAmount).add(_stakedAmount) == _fileSize;
		}
	}
}
