pragma solidity ^0.4.24;

import './AOLibrary.sol';
import './TheAO.sol';
import './IAOContent.sol';
import './IAOSetting.sol';
import './INameTAOPosition.sol';

/**
 * @title AOContent
 */
contract AOContent is TheAO, IAOContent {
	uint256 public totalContents;
	address public settingTAOId;
	address public aoSettingAddress;

	IAOSetting internal _aoSetting;
	INameTAOPosition internal _nameTAOPosition;

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

	// Mapping from Content index to the Content object
	mapping (uint256 => Content) internal contents;

	// Mapping from content ID to index of the contents list
	mapping (bytes32 => uint256) internal contentIndex;

	// Event to be broadcasted to public when `content` is stored
	event StoreContent(address indexed creator, bytes32 indexed contentId, uint256 fileSize, bytes32 contentUsageType);

	// Event to be broadcasted to public when Advocate/Listener/Speaker wants to update the TAO Content's State
	event UpdateTAOContentState(bytes32 indexed contentId, address indexed taoId, address signer, bytes32 taoContentState);

	// Event to be broadcasted to public when content creator updates the content's extra data
	event SetExtraData(address indexed creator, bytes32 indexed contentId, string newExtraData);

	/**
	 * @dev Constructor function
	 * @param _settingTAOId The TAO ID that controls the setting
	 * @param _aoSettingAddress The address of AOSetting
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	constructor(address _settingTAOId, address _aoSettingAddress, address _nameTAOPositionAddress) public {
		setSettingTAOId(_settingTAOId);
		setAOSettingAddress(_aoSettingAddress);
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
	 * @dev Store the content information (content creation during staking)
	 * @param _creator the address of the content creator
	 * @param _baseChallenge The base challenge string (PUBLIC KEY) of the content
	 * @param _fileSize The size of the file
	 * @param _contentUsageType The content usage type, i.e AO Content, Creative Commons, or T(AO) Content
	 * @param _taoId The TAO (TAO) ID for this content (if this is a T(AO) Content)
	 * @return the ID of the content
	 */
	function create(address _creator,
		string _baseChallenge,
		uint256 _fileSize,
		bytes32 _contentUsageType,
		address _taoId
		) external inWhitelist returns (bytes32) {
		require (_canCreate(_creator, _baseChallenge, _fileSize, _contentUsageType, _taoId));

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
	function getById(bytes32 _contentId) external view returns (address, uint256, bytes32, address, bytes32, uint8, bytes32, bytes32, string) {
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
	 * @dev Get content base challenge
	 * @param _contentId The ID of the content
	 * @return the base challenge
	 */
	function getBaseChallenge(bytes32 _contentId) external view returns (string) {
		// Make sure the content exist
		require (contentIndex[_contentId] > 0);
		Content memory _content = contents[contentIndex[_contentId]];
		require (whitelist[msg.sender] == true || _content.creator == msg.sender);
		return _content.baseChallenge;
	}

	/**
	 * @dev Update the TAO Content State of a T(AO) Content
	 * @param _contentId The ID of the Content
	 * @param _taoId The ID of the TAO that initiates the update
	 * @param _taoContentState The TAO Content state value, i.e Submitted, Pending Review, or Accepted to TAO
	 * @param _updateTAOContentStateV The V part of the signature for this update
	 * @param _updateTAOContentStateR The R part of the signature for this update
	 * @param _updateTAOContentStateS The S part of the signature for this update
	 */
	function updateTAOContentState(
		bytes32 _contentId,
		address _taoId,
		bytes32 _taoContentState,
		uint8 _updateTAOContentStateV,
		bytes32 _updateTAOContentStateR,
		bytes32 _updateTAOContentStateS
	) public {
		// Make sure the content exist
		require (contentIndex[_contentId] > 0);
		require (AOLibrary.isTAO(_taoId));
		(,, bytes32 _contentUsageType_taoContent, bytes32 taoContentState_submitted, bytes32 taoContentState_pendingReview, bytes32 taoContentState_acceptedToTAO) = _getSettingVariables();
		require (_taoContentState == taoContentState_submitted || _taoContentState == taoContentState_pendingReview || _taoContentState == taoContentState_acceptedToTAO);

		address _signatureAddress = _getUpdateTAOContentStateSignatureAddress(_contentId, _taoId, _taoContentState, _updateTAOContentStateV, _updateTAOContentStateR, _updateTAOContentStateS);

		Content storage _content = contents[contentIndex[_contentId]];
		// Make sure that the signature address is one of content's TAO ID's Advocate/Listener/Speaker
		require (_signatureAddress == msg.sender && _nameTAOPosition.senderIsPosition(_signatureAddress, _content.taoId));
		require (_content.contentUsageType == _contentUsageType_taoContent);

		_content.taoContentState = _taoContentState;
		_content.updateTAOContentStateV = _updateTAOContentStateV;
		_content.updateTAOContentStateR = _updateTAOContentStateR;
		_content.updateTAOContentStateS = _updateTAOContentStateS;

		emit UpdateTAOContentState(_contentId, _taoId, _signatureAddress, _taoContentState);
	}

	/**
	 * @dev Check whether or not the content is of AO Content Usage Type
	 * @param _contentId The ID of the content
	 * @return true if yes. false otherwise
	 */
	function isAOContentUsageType(bytes32 _contentId) external view returns (bool) {
		require (contentIndex[_contentId] > 0);
		(bytes32 _contentUsageType_aoContent,,,,,) = _getSettingVariables();
		return contents[contentIndex[_contentId]].contentUsageType == _contentUsageType_aoContent;
	}

	/**
	 * @dev Set extra data on existing content
	 * @param _contentId The ID of the content
	 * @param _extraData some extra information to send to the contract for a content
	 */
	function setExtraData(bytes32 _contentId, string _extraData) public {
		// Make sure the content exist
		require (contentIndex[_contentId] > 0);

		Content storage _content = contents[contentIndex[_contentId]];
		// Make sure the content creator is the same as the sender
		require (_content.creator == msg.sender);

		_content.extraData = _extraData;

		emit SetExtraData(_content.creator, _content.contentId, _content.extraData);
	}

	/***** INTERNAL METHODS *****/
	/**
	 * @dev Checks if create params are valid
	 * @param _creator the address of the content creator
	 * @param _baseChallenge The base challenge string (PUBLIC KEY) of the content
	 * @param _fileSize The size of the file
	 * @param _contentUsageType The content usage type, i.e AO Content, Creative Commons, or T(AO) Content
	 * @param _taoId The TAO (TAO) ID for this content (if this is a T(AO) Content)
	 * @return true if yes. false otherwise
	 */
	function _canCreate(address _creator, string _baseChallenge, uint256 _fileSize, bytes32 _contentUsageType, address _taoId) internal view returns (bool) {
		(bytes32 aoContent, bytes32 creativeCommons, bytes32 taoContent,,,) = _getSettingVariables();
		return (_creator != address(0) &&
			bytes(_baseChallenge).length > 0 &&
			_fileSize > 0 &&
			(_contentUsageType == aoContent || _contentUsageType == creativeCommons || _contentUsageType == taoContent) &&
			(
				_contentUsageType != taoContent ||
				(_contentUsageType == taoContent && _taoId != address(0) && AOLibrary.isTAO(_taoId) && _nameTAOPosition.senderIsPosition(_creator, _taoId))
			)
		);
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
		(,,,bytes32 contentUsageType_aoContent,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'contentUsageType_aoContent');
		(,,,bytes32 contentUsageType_creativeCommons,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'contentUsageType_creativeCommons');
		(,,,bytes32 contentUsageType_taoContent,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'contentUsageType_taoContent');
		(,,,bytes32 taoContentState_submitted,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'taoContentState_submitted');
		(,,,bytes32 taoContentState_pendingReview,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'taoContentState_pendingReview');
		(,,,bytes32 taoContentState_acceptedToTAO,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'taoContentState_acceptedToTAO');

		return (
			contentUsageType_aoContent,
			contentUsageType_creativeCommons,
			contentUsageType_taoContent,
			taoContentState_submitted,
			taoContentState_pendingReview,
			taoContentState_acceptedToTAO
		);
	}

	/**
	 * @dev Return the address that signed the TAO content state update
	 * @param _contentId the ID of the content
	 * @param _taoId the ID of the TAO
	 * @param _taoContentState the TAO Content State value, i.e Submitted, Pending Review, or Accepted to TAO
	 * @param _v part of the signature
	 * @param _r part of the signature
	 * @param _s part of the signature
	 * @return the address that signed the message
	 */
	function _getUpdateTAOContentStateSignatureAddress(bytes32 _contentId, address _taoId, bytes32 _taoContentState, uint8 _v, bytes32 _r, bytes32 _s) internal view returns (address) {
		bytes32 _hash = keccak256(abi.encodePacked(address(this), _contentId, _taoId, _taoContentState));
		return ecrecover(_hash, _v, _r, _s);
	}
}
