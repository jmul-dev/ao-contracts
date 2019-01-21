pragma solidity ^0.4.24;

import './SafeMath.sol';
import './AOLibrary.sol';
import './TheAO.sol';
import './IAOSetting.sol';
import './IAOTreasury.sol';
import './IAOContent.sol';
import './IAOStakedContent.sol';
import './IAOContentHost.sol';
import './IAOEarning.sol';
import './INameTAOPosition.sol';

/**
 * @title AOContentFactory
 *
 * The purpose of this contract is to allow content creator to stake network ERC20 AO tokens and/or primordial AO Tokens
 * on his/her content
 */
contract AOContentFactory is TheAO {
	using SafeMath for uint256;

	address public settingTAOId;
	address public aoSettingAddress;
	address public aoTreasuryAddress;
	address public aoContentAddress;
	address public aoStakedContentAddress;
	address public aoContentHostAddress;
	address public aoEarningAddress;

	IAOSetting internal _aoSetting;
	IAOTreasury internal _aoTreasury;
	IAOContent internal _aoContent;
	IAOStakedContent internal _aoStakedContent;
	IAOContentHost internal _aoContentHost;
	IAOEarning internal _aoEarning;
	INameTAOPosition internal _nameTAOPosition;

	/**
	 * @dev Constructor function
	 * @param _settingTAOId The TAO ID that controls the setting
	 * @param _aoSettingAddress The address of AOSetting
	 * @param _aoTreasuryAddress The address of AOTreasury
	 * @param _aoContentAddress The address of AOContent
	 * @param _aoStakedContentAddress The address of AOStakedContent
	 * @param _aoContentHostAddress The address of AOContentHost
	 * @param _aoEarningAddress The address of AOEarning
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	constructor(address _settingTAOId,
		address _aoSettingAddress,
		address _aoTreasuryAddress,
		address _aoContentAddress,
		address _aoStakedContentAddress,
		address _aoContentHostAddress,
		address _aoEarningAddress,
		address _nameTAOPositionAddress
		) public {
		setSettingTAOId(_settingTAOId);
		setAOSettingAddress(_aoSettingAddress);
		setAOTreasuryAddress(_aoTreasuryAddress);
		setAOContentAddress(_aoContentAddress);
		setAOStakedContentAddress(_aoStakedContentAddress);
		setAOContentHostAddress(_aoContentHostAddress);
		setAOEarningAddress(_aoEarningAddress);
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
	 * @dev The AO sets AO Treasury address
	 * @param _aoTreasuryAddress The address of AOTreasury
	 */
	function setAOTreasuryAddress(address _aoTreasuryAddress) public onlyTheAO {
		require (_aoTreasuryAddress != address(0));
		aoTreasuryAddress = _aoTreasuryAddress;
		_aoTreasury = IAOTreasury(_aoTreasuryAddress);
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
	 * @dev The AO sets AOEarning address
	 * @param _aoEarningAddress The address of AOEarning
	 */
	function setAOEarningAddress(address _aoEarningAddress) public onlyTheAO {
		require (_aoEarningAddress != address(0));
		aoEarningAddress = _aoEarningAddress;
		_aoEarning = IAOEarning(_aoEarningAddress);
	}

	/**
	 * @dev The AO sets NameTAOPosition address
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	function setNameTAOPositionAddress(address _nameTAOPositionAddress) public onlyTheAO {
		require (_nameTAOPositionAddress != address(0));
		nameTAOPositionAddress = _nameTAOPositionAddress;
		_nameTAOPosition = INameTAOPosition(_nameTAOPositionAddress);
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
		uint256 _profitPercentage
		) public {
		/**
		 * 1. Store this content
		 * 2. Stake the network/primordial token on content
		 * 3. Add the node info that hosts this content (in this case the creator himself)
		 */
		require (
			_hostContent(
				msg.sender,
				_stakeContent(
					msg.sender,
					_storeContent(
						msg.sender,
						_baseChallenge,
						_fileSize,
						_contentUsageType_aoContent(),
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
			)
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
		uint256 _fileSize
		) public {
		/**
		 * 1. Store this content
		 * 2. Stake the network/primordial token on content
		 * 3. Add the node info that hosts this content (in this case the creator himself)
		 */
		require (
			_hostContent(
				msg.sender,
				_stakeContent(
					msg.sender,
					_storeContent(
						msg.sender,
						_baseChallenge,
						_fileSize,
						_contentUsageType_creativeCommons(),
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
			)
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
	 * @param _taoId The TAO (TAO) ID for this content (if this is a T(AO) Content)
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
		address _taoId
		) public {
		/**
		 * 1. Store this content
		 * 2. Stake the network/primordial token on content
		 * 3. Add the node info that hosts this content (in this case the creator himself)
		 */
		require (
			_hostContent(
				msg.sender,
				_stakeContent(
					msg.sender,
					_storeContent(
						msg.sender,
						_baseChallenge,
						_fileSize,
						_contentUsageType_taoContent(),
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
			)
		);
	}

	/**
	 * @dev Return the staking information of a stake ID
	 * @param _stakeId The ID of the staked content
	 * @return the network base token amount staked for this content
	 * @return the primordial token amount staked for this content
	 * @return the primordial weighted multiplier of the staked content
	 */
	function getStakingMetrics(bytes32 _stakeId) public view returns (uint256, uint256, uint256) {
		(,, uint256 networkAmount, uint256 primordialAmount, uint256 primordialWeightedMultiplier,,,) = _aoStakedContent.getById(_stakeId);
		return (
			networkAmount,
			primordialAmount,
			primordialWeightedMultiplier
		);
	}

	/**
	 * @dev Return the earning information of a stake ID
	 * @param _stakeId The ID of the staked content
	 * @return the total earning from staking this content
	 * @return the total earning from hosting this content
	 * @return the total The AO earning of this content
	 */
	function getEarningMetrics(bytes32 _stakeId) public view returns (uint256, uint256, uint256) {
		return _aoEarning.getTotalStakedContentEarning(_stakeId);
	}

	/**
	 * @dev Return the staking and earning information of a stake ID
	 * @param _stakeId The ID of the staked content
	 * @return the network base token amount staked for this content
	 * @return the primordial token amount staked for this content
	 * @return the primordial weighted multiplier of the staked content
	 * @return the total earning from staking this content
	 * @return the total earning from hosting this content
	 * @return the total The AO earning of this content
	 */
	function getContentMetrics(bytes32 _stakeId) public view returns (uint256, uint256, uint256, uint256, uint256, uint256) {
		(uint256 networkAmount, uint256 primordialAmount, uint256 primordialWeightedMultiplier) = getStakingMetrics(_stakeId);
		(uint256 totalStakeEarning, uint256 totalHostEarning, uint256 totalTheAOEarning) = getEarningMetrics(_stakeId);
		return (
			networkAmount,
			primordialAmount,
			primordialWeightedMultiplier,
			totalStakeEarning,
			totalHostEarning,
			totalTheAOEarning
		);
	}

	/***** INTERNAL METHODS *****/
	/**
	 * @dev Get Content Usage Type = AO Content setting
	 * @return contentUsageType_aoContent Content Usage Type = AO Content
	 */
	function _contentUsageType_aoContent() internal view returns (bytes32) {
		(,,,bytes32 contentUsageType_aoContent,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'contentUsageType_aoContent');
		return contentUsageType_aoContent;
	}

	/**
	 * @dev Get Content Usage Type = Creative Commons setting
	 * @return contentUsageType_creativeCommons Content Usage Type = Creative Commons
	 */
	function _contentUsageType_creativeCommons() internal view returns (bytes32) {
		(,,,bytes32 contentUsageType_creativeCommons,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'contentUsageType_creativeCommons');
		return contentUsageType_creativeCommons;
	}

	/**
	 * @dev Get Content Usage Type = TAO Content setting
	 * @return contentUsageType_taoContent Content Usage Type = T(AO) Content
	 */
	function _contentUsageType_taoContent() internal view returns (bytes32) {
		(,,,bytes32 contentUsageType_taoContent,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'contentUsageType_taoContent');
		return contentUsageType_taoContent;
	}

	/**
	 * @dev Store the content information (content creation during staking)
	 * @param _creator the address of the content creator
	 * @param _baseChallenge The base challenge string (PUBLIC KEY) of the content
	 * @param _fileSize The size of the file
	 * @param _contentUsageType The content usage type, i.e AO Content, Creative Commons, or T(AO) Content
	 * @param _taoId The TAO (TAO) ID for this content (if this is a T(AO) Content)
	 * @return the ID of the content
	 */
	function _storeContent(address _creator,
		string _baseChallenge,
		uint256 _fileSize,
		bytes32 _contentUsageType,
		address _taoId
		) internal returns (bytes32) {
		return _aoContent.create(_creator, _baseChallenge, _fileSize, _contentUsageType, _taoId);
	}

	/**
	 * @dev Actual staking the content
	 * @param _stakeOwner the address that stake the content
	 * @param _contentId The ID of the content
	 * @param _networkIntegerAmount The integer amount of network token to stake
	 * @param _networkFractionAmount The fraction amount of network token to stake
	 * @param _denomination The denomination of the network token, i.e ao, kilo, mega, etc.
	 * @param _primordialAmount The amount of primordial Token to stake
	 * @param _profitPercentage The percentage of profit the stake owner's media will charge
	 * @return the newly created staked content ID
	 */
	function _stakeContent(address _stakeOwner,
		bytes32 _contentId,
		uint256 _networkIntegerAmount,
		uint256 _networkFractionAmount,
		bytes8 _denomination,
		uint256 _primordialAmount,
		uint256 _profitPercentage
		) internal returns (bytes32) {
		return _aoStakedContent.create(_stakeOwner, _contentId, _networkIntegerAmount, _networkFractionAmount, _denomination, _primordialAmount, _profitPercentage);
	}

	/**
	 * @dev Add the distribution node info that hosts the content
	 * @param _host the address of the host
	 * @param _stakeId The ID of the staked content
	 * @param _encChallenge The encrypted challenge string (PUBLIC KEY) of the content unique to the host
	 * @param _contentDatKey The dat key of the content
	 * @param _metadataDatKey The dat key of the content's metadata
	 * @return true on success
	 */
	function _hostContent(address _host, bytes32 _stakeId, string _encChallenge, string _contentDatKey, string _metadataDatKey) internal returns (bool) {
		return _aoContentHost.create(_host, _stakeId, _encChallenge, _contentDatKey, _metadataDatKey);
	}
}
