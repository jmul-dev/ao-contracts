pragma solidity >=0.5.4 <0.6.0;

import './SafeMath.sol';
import './AOLibrary.sol';
import './TheAO.sol';
import './INameTAOPosition.sol';
import './INameFactory.sol';
import './INameAccountRecovery.sol';
import './ITAOFactory.sol';
import './ITAOAncestry.sol';
import './IAOSetting.sol';
import './Logos.sol';
import './TAO.sol';

/**
 * @title NameTAOPosition
 */
contract NameTAOPosition is TheAO, INameTAOPosition {
	using SafeMath for uint256;

	address public settingTAOId;
	address public nameFactoryAddress;
	address public nameAccountRecoveryAddress;
	address public taoFactoryAddress;
	address public aoSettingAddress;
	address public taoAncestryAddress;
	address public logosAddress;

	uint256 public totalTAOAdvocateChallenges;

	INameFactory internal _nameFactory;
	INameAccountRecovery internal _nameAccountRecovery;
	ITAOFactory internal _taoFactory;
	IAOSetting internal _aoSetting;
	ITAOAncestry internal _taoAncestry;
	Logos internal _logos;

	struct PositionDetail {
		address advocateId;
		address listenerId;
		address speakerId;
		bool created;
	}

	struct TAOAdvocateChallenge {
		bytes32 challengeId;
		address newAdvocateId;		// The Name ID that wants to be the new Advocate
		address taoId;				// The TAO ID being challenged
		bool completed;				// Status of the challenge
		uint256 createdTimestamp;	// Timestamp when this challenge is created
		uint256 lockedUntilTimestamp;	// The deadline for current Advocate to respond
		uint256 completeBeforeTimestamp; // The deadline for the challenger to respond and complete the challenge
	}

	// Mapping from Name/TAO ID to its PositionDetail info
	mapping (address => PositionDetail) internal positionDetails;

	// Mapping from challengeId to TAOAdvocateChallenge info
	mapping (bytes32 => TAOAdvocateChallenge) internal taoAdvocateChallenges;

	// Event to be broadcasted to public when current Advocate of TAO sets New Advocate
	event SetAdvocate(address indexed taoId, address oldAdvocateId, address newAdvocateId, uint256 nonce);

	// Event to be broadcasted to public when current Advocate of Name/TAO sets New Listener
	event SetListener(address indexed taoId, address oldListenerId, address newListenerId, uint256 nonce);

	// Event to be broadcasted to public when current Advocate of Name/TAO sets New Speaker
	event SetSpeaker(address indexed taoId, address oldSpeakerId, address newSpeakerId, uint256 nonce);

	// Event to be broadcasted to public when a Name challenges to become TAO's new Advocate
	event ChallengeTAOAdvocate(address indexed taoId, bytes32 indexed challengeId, address currentAdvocateId, address challengerAdvocateId, uint256 createdTimestamp, uint256 lockedUntilTimestamp, uint256 completeBeforeTimestamp);

	// Event to be broadcasted to public when Challenger completes the TAO Advocate challenge
	event CompleteTAOAdvocateChallenge(address indexed taoId, bytes32 indexed challengeId);

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress, address _taoFactoryAddress) public {
		setNameFactoryAddress(_nameFactoryAddress);
		setTAOFactoryAddress(_taoFactoryAddress);

		nameTAOPositionAddress = address(this);
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

	/**
	 * @dev Check if calling address is Factory
	 */
	modifier onlyFactory {
		require (msg.sender == nameFactoryAddress || msg.sender == taoFactoryAddress);
		_;
	}

	/**
	 * @dev Check if `_taoId` is a TAO
	 */
	modifier isTAO(address _taoId) {
		require (AOLibrary.isTAO(_taoId));
		_;
	}

	/**
	 * @dev Check if `_nameId` is a Name
	 */
	modifier isName(address _nameId) {
		require (AOLibrary.isName(_nameId));
		_;
	}

	/**
	 * @dev Check if `_id` is a Name or a TAO
	 */
	modifier isNameOrTAO(address _id) {
		require (AOLibrary.isName(_id) || AOLibrary.isTAO(_id));
		_;
	}

	/**
	 * @dev Check is msg.sender address is a Name
	 */
	 modifier senderIsName() {
		require (_nameFactory.ethAddressToNameId(msg.sender) != address(0));
		_;
	 }

	/**
	 * @dev Check if msg.sender is the current advocate of a Name/TAO ID
	 */
	modifier onlyAdvocate(address _id) {
		require (this.senderIsAdvocate(msg.sender, _id));
		_;
	}

	/**
	 * @dev Only allowed if sender's Name is not compromised
	 */
	modifier senderNameNotCompromised() {
		require (!_nameAccountRecovery.isCompromised(_nameFactory.ethAddressToNameId(msg.sender)));
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
	 * @dev The AO set the NameFactory Address
	 * @param _nameFactoryAddress The address of NameFactory
	 */
	function setNameFactoryAddress(address _nameFactoryAddress) public onlyTheAO {
		require (_nameFactoryAddress != address(0));
		nameFactoryAddress = _nameFactoryAddress;
		_nameFactory = INameFactory(_nameFactoryAddress);
	}

	/**
	 * @dev The AO set the NameAccountRecovery Address
	 * @param _nameAccountRecoveryAddress The address of NameAccountRecovery
	 */
	function setNameAccountRecoveryAddress(address _nameAccountRecoveryAddress) public onlyTheAO {
		require (_nameAccountRecoveryAddress != address(0));
		nameAccountRecoveryAddress = _nameAccountRecoveryAddress;
		_nameAccountRecovery = INameAccountRecovery(nameAccountRecoveryAddress);
	}

	/**
	 * @dev The AO set the TAOFactory Address
	 * @param _taoFactoryAddress The address of TAOFactory
	 */
	function setTAOFactoryAddress(address _taoFactoryAddress) public onlyTheAO {
		require (_taoFactoryAddress != address(0));
		taoFactoryAddress = _taoFactoryAddress;
		_taoFactory = ITAOFactory(_taoFactoryAddress);
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
	 * @dev The AO set the TAOAncestry Address
	 * @param _taoAncestryAddress The address of TAOAncestry
	 */
	function setTAOAncestryAddress(address _taoAncestryAddress) public onlyTheAO {
		require (_taoAncestryAddress != address(0));
		taoAncestryAddress = _taoAncestryAddress;
		_taoAncestry = ITAOAncestry(taoAncestryAddress);
	}

	/**
	 * @dev The AO set the logosAddress Address
	 * @param _logosAddress The address of Logos
	 */
	function setLogosAddress(address _logosAddress) public onlyTheAO {
		require (_logosAddress != address(0));
		logosAddress = _logosAddress;
		_logos = Logos(_logosAddress);
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Check whether or not a Name/TAO ID exist in the list
	 * @param _id The ID to be checked
	 * @return true if yes, false otherwise
	 */
	function isExist(address _id) public view returns (bool) {
		return positionDetails[_id].created;
	}

	/**
	 * @dev Check whether or not `_sender` eth address is Advocate of _id
	 * @param _sender The eth address to check
	 * @param _id The ID to be checked
	 * @return true if yes, false otherwise
	 */
	function senderIsAdvocate(address _sender, address _id) external view returns (bool) {
		return (positionDetails[_id].created && positionDetails[_id].advocateId == _nameFactory.ethAddressToNameId(_sender));
	}

	/**
	 * @dev Check whether or not `_sender` eth address is Listener of _id
	 * @param _sender The eth address to check
	 * @param _id The ID to be checked
	 * @return true if yes, false otherwise
	 */
	function senderIsListener(address _sender, address _id) external view returns (bool) {
		return (positionDetails[_id].created && positionDetails[_id].listenerId == _nameFactory.ethAddressToNameId(_sender));
	}

	/**
	 * @dev Check whether or not `_sender` eth address is Speaker of _id
	 * @param _sender The eth address to check
	 * @param _id The ID to be checked
	 * @return true if yes, false otherwise
	 */
	function senderIsSpeaker(address _sender, address _id) external view returns (bool) {
		return (positionDetails[_id].created && positionDetails[_id].speakerId == _nameFactory.ethAddressToNameId(_sender));
	}

	/**
	 * @dev Check whether or not `_sender` eth address is Advocate of Parent of _id
	 * @param _sender The eth address to check
	 * @param _id The ID to be checked
	 * @return true if yes, false otherwise
	 */
	function senderIsAdvocateOfParent(address _sender, address _id) public view returns (bool) {
		(address _parentId,,) = _taoAncestry.getAncestryById(_id);
		 return ((AOLibrary.isName(_parentId) || (AOLibrary.isTAO(_parentId) && _taoAncestry.isChild(_parentId, _id))) && this.senderIsAdvocate(_sender, _parentId));
	}

	/**
	 * @dev Check whether or not eth address is either Advocate/Listener/Speaker of _id
	 * @param _sender The eth address to check
	 * @param _id The ID to be checked
	 * @return true if yes, false otherwise
	 */
	function senderIsPosition(address _sender, address _id) external view returns (bool) {
		address _nameId = _nameFactory.ethAddressToNameId(_sender);
		if (_nameId == address(0)) {
			return false;
		} else {
			return (positionDetails[_id].created &&
				(positionDetails[_id].advocateId == _nameId ||
				 positionDetails[_id].listenerId == _nameId ||
				 positionDetails[_id].speakerId == _nameId
				)
			);
		}
	}

	/**
	 * @dev Check whether or not _nameId is advocate of _id
	 * @param _nameId The name ID to be checked
	 * @param _id The ID to be checked
	 * @return true if yes, false otherwise
	 */
	function nameIsAdvocate(address _nameId, address _id) external view returns (bool) {
		return (positionDetails[_id].created && positionDetails[_id].advocateId == _nameId);
	}

	/**
	 * @dev Determine whether or not `_sender` is Advocate/Listener/Speaker of the Name/TAO
	 * @param _sender The ETH address that to check
	 * @param _id The ID of the Name/TAO
	 * @return 1 if Advocate. 2 if Listener. 3 if Speaker
	 */
	function determinePosition(address _sender, address _id) external view returns (uint256) {
		require (this.senderIsPosition(_sender, _id));
		PositionDetail memory _positionDetail = positionDetails[_id];
		address _nameId = _nameFactory.ethAddressToNameId(_sender);
		if (_nameId == _positionDetail.advocateId) {
			return 1;
		} else if (_nameId == _positionDetail.listenerId) {
			return 2;
		} else {
			return 3;
		}
	}

	/**
	 * @dev Initialize Position for a Name/TAO
	 * @param _id The ID of the Name/TAO
	 * @param _advocateId The Advocate ID of the Name/TAO
	 * @param _listenerId The Listener ID of the Name/TAO
	 * @param _speakerId The Speaker ID of the Name/TAO
	 * @return true on success
	 */
	function initialize(address _id, address _advocateId, address _listenerId, address _speakerId)
		external
		isNameOrTAO(_id)
		isName(_advocateId)
		isNameOrTAO(_listenerId)
		isNameOrTAO(_speakerId)
		onlyFactory returns (bool) {
		require (!isExist(_id));

		PositionDetail storage _positionDetail = positionDetails[_id];
		_positionDetail.advocateId = _advocateId;
		_positionDetail.listenerId = _listenerId;
		_positionDetail.speakerId = _speakerId;
		_positionDetail.created = true;
		return true;
	}

	/**
	 * @dev Get Name/TAO's Position info
	 * @param _id The ID of the Name/TAO
	 * @return the Advocate name
	 * @return the Advocate ID of Name/TAO
	 * @return the Listener name
	 * @return the Listener ID of Name/TAO
	 * @return the Speaker name
	 * @return the Speaker ID of Name/TAO
	 */
	function getPositionById(address _id) public view returns (string memory, address, string memory, address, string memory, address) {
		require (isExist(_id));
		PositionDetail memory _positionDetail = positionDetails[_id];
		return (
			TAO(address(uint160(_positionDetail.advocateId))).name(),
			_positionDetail.advocateId,
			TAO(address(uint160(_positionDetail.listenerId))).name(),
			_positionDetail.listenerId,
			TAO(address(uint160(_positionDetail.speakerId))).name(),
			_positionDetail.speakerId
		);
	}

	/**
	 * @dev Get Name/TAO's Advocate
	 * @param _id The ID of the Name/TAO
	 * @return the Advocate ID of Name/TAO
	 */
	function getAdvocate(address _id) external view returns (address) {
		require (isExist(_id));
		PositionDetail memory _positionDetail = positionDetails[_id];
		return _positionDetail.advocateId;
	}

	/**
	 * @dev Get Name/TAO's Listener
	 * @param _id The ID of the Name/TAO
	 * @return the Listener ID of Name/TAO
	 */
	function getListener(address _id) public view returns (address) {
		require (isExist(_id));
		PositionDetail memory _positionDetail = positionDetails[_id];
		return _positionDetail.listenerId;
	}

	/**
	 * @dev Get Name/TAO's Speaker
	 * @param _id The ID of the Name/TAO
	 * @return the Speaker ID of Name/TAO
	 */
	function getSpeaker(address _id) public view returns (address) {
		require (isExist(_id));
		PositionDetail memory _positionDetail = positionDetails[_id];
		return _positionDetail.speakerId;
	}

	/**
	 * @dev Set Advocate for a TAO
	 * @param _taoId The ID of the TAO
	 * @param _newAdvocateId The new advocate ID to be set
	 */
	function setAdvocate(address _taoId, address _newAdvocateId)
		public
		isTAO(_taoId)
		isName(_newAdvocateId)
		onlyAdvocate(_taoId)
		senderIsName
		senderNameNotCompromised {
		require (isExist(_taoId));
		// Make sure the newAdvocate is not compromised
		require (!_nameAccountRecovery.isCompromised(_newAdvocateId));
		_setAdvocate(_taoId, _newAdvocateId);
	}

	/**
	 * Only Advocate of Parent of `_taoId` can replace child `_taoId` 's Advocate with himself
	 * @param _taoId The ID of the TAO
	 */
	function parentReplaceChildAdvocate(address _taoId)
		public
		isTAO(_taoId)
		senderIsName
		senderNameNotCompromised {
		require (isExist(_taoId));
		require (senderIsAdvocateOfParent(msg.sender, _taoId));
		address _parentNameId = _nameFactory.ethAddressToNameId(msg.sender);
		address _currentAdvocateId = this.getAdvocate(_taoId);

		// Make sure it's not replacing itself
		require (_parentNameId != _currentAdvocateId);

		// Parent has to have more Logos than current Advocate
		require (_logos.sumBalanceOf(_parentNameId) > _logos.sumBalanceOf(this.getAdvocate(_taoId)));

		_setAdvocate(_taoId, _parentNameId);
	}

	/**
	 * A Name challenges current TAO's Advocate to be its new Advocate
	 * @param _taoId The ID of the TAO
	 */
	function challengeTAOAdvocate(address _taoId)
		public
		isTAO(_taoId)
		senderIsName
		senderNameNotCompromised {
		require (isExist(_taoId));
		address _newAdvocateId = _nameFactory.ethAddressToNameId(msg.sender);
		address _currentAdvocateId = this.getAdvocate(_taoId);

		// Make sure it's not challenging itself
		require (_newAdvocateId != _currentAdvocateId);

		// New Advocate has to have more Logos than current Advocate
		require (_logos.sumBalanceOf(_newAdvocateId) > _logos.sumBalanceOf(_currentAdvocateId));

		(uint256 _lockDuration, uint256 _completeDuration) = _getSettingVariables();

		totalTAOAdvocateChallenges++;
		bytes32 _challengeId = keccak256(abi.encodePacked(this, _taoId, _newAdvocateId, totalTAOAdvocateChallenges));
		TAOAdvocateChallenge storage _taoAdvocateChallenge = taoAdvocateChallenges[_challengeId];
		_taoAdvocateChallenge.challengeId = _challengeId;
		_taoAdvocateChallenge.newAdvocateId = _newAdvocateId;
		_taoAdvocateChallenge.taoId = _taoId;
		_taoAdvocateChallenge.createdTimestamp = now;
		_taoAdvocateChallenge.lockedUntilTimestamp = _taoAdvocateChallenge.createdTimestamp.add(_lockDuration);
		_taoAdvocateChallenge.completeBeforeTimestamp = _taoAdvocateChallenge.lockedUntilTimestamp.add(_completeDuration);

		emit ChallengeTAOAdvocate(_taoId, _challengeId, _currentAdvocateId, _newAdvocateId, _taoAdvocateChallenge.createdTimestamp, _taoAdvocateChallenge.lockedUntilTimestamp, _taoAdvocateChallenge.completeBeforeTimestamp);
	}

	/**
	 * Get status of a TAOAdvocateChallenge given a `_challengeId` and a `_sender` eth address
	 * @param _challengeId The ID of TAOAdvocateChallenge
	 * @param _sender The sender address
	 * @return status of the challenge
	 *		1 = Can complete challenge
	 *		2 = Challenge not exist
	 *		3 = Sender is not the creator of the challenge
	 *		4 = Transaction is not in the allowed period of time
	 *		5 = Challenge has been completed
	 *		6 = Challenger has less Logos than current Advocate of TAO
	 */
	function getChallengeStatus(bytes32 _challengeId, address _sender) public view returns (uint8) {
		address _challengerNameId = _nameFactory.ethAddressToNameId(_sender);
		TAOAdvocateChallenge storage _taoAdvocateChallenge = taoAdvocateChallenges[_challengeId];

		// If the challenge does not exist
		if (_taoAdvocateChallenge.taoId == address(0)) {
			return 2;
		} else if (_challengerNameId != _taoAdvocateChallenge.newAdvocateId) {
			// If the calling address is not the creator of the challenge
			return 3;
		} else if (now < _taoAdvocateChallenge.lockedUntilTimestamp || now > _taoAdvocateChallenge.completeBeforeTimestamp) {
			// If this transaction is not in the allowed period of time
			return 4;
		} else if (_taoAdvocateChallenge.completed) {
			// If the challenge has been completed
			return 5;
		} else if (_logos.sumBalanceOf(_challengerNameId) <= _logos.sumBalanceOf(this.getAdvocate(_taoAdvocateChallenge.taoId))) {
			// If challenger has less Logos than current Advocate of TAO
			return 6;
		} else {
			// Can complete!
			return 1;
		}
	}

	/**
	 * Only owner of challenge can respond and complete of the challenge
	 * @param _challengeId The ID of the TAOAdvocateChallenge
	 */
	function completeTAOAdvocateChallenge(bytes32 _challengeId)
		public
		senderIsName
		senderNameNotCompromised {
		TAOAdvocateChallenge storage _taoAdvocateChallenge = taoAdvocateChallenges[_challengeId];

		// Make sure the challenger can complete this challenge
		require (getChallengeStatus(_challengeId, msg.sender) == 1);

		_taoAdvocateChallenge.completed = true;

		_setAdvocate(_taoAdvocateChallenge.taoId, _taoAdvocateChallenge.newAdvocateId);

		emit CompleteTAOAdvocateChallenge(_taoAdvocateChallenge.taoId, _challengeId);
	}

	/**
	 * @dev Get TAOAdvocateChallenge info given an ID
	 * @param _challengeId The ID of TAOAdvocateChallenge
	 * @return the new Advocate ID in the challenge
	 * @return the ID of Name/TAO
	 * @return the completion status of the challenge
	 * @return the created timestamp
	 * @return the lockedUntil timestamp (The deadline for current Advocate to respond)
	 * @return the completeBefore timestamp (The deadline for the challenger to respond and complete the challenge)
	 */
	function getTAOAdvocateChallengeById(bytes32 _challengeId) public view returns (address, address, bool, uint256, uint256, uint256) {
		TAOAdvocateChallenge memory _taoAdvocateChallenge = taoAdvocateChallenges[_challengeId];
		require (_taoAdvocateChallenge.taoId != address(0));
		return (
			_taoAdvocateChallenge.newAdvocateId,
			_taoAdvocateChallenge.taoId,
			_taoAdvocateChallenge.completed,
			_taoAdvocateChallenge.createdTimestamp,
			_taoAdvocateChallenge.lockedUntilTimestamp,
			_taoAdvocateChallenge.completeBeforeTimestamp
		);
	}

	/**
	 * @dev Set Listener for a Name/TAO
	 * @param _id The ID of the Name/TAO
	 * @param _newListenerId The new listener ID to be set
	 */
	function setListener(address _id, address _newListenerId)
		public
		isNameOrTAO(_id)
		isNameOrTAO(_newListenerId)
		senderIsName
		senderNameNotCompromised
		onlyAdvocate(_id) {
		require (isExist(_id));

		// If _id is a Name, then new Listener can only be a Name
		// If _id is a TAO, then new Listener can be a TAO/Name
		bool _isName = false;
		if (AOLibrary.isName(_id)) {
			_isName = true;
			require (AOLibrary.isName(_newListenerId));
			require (!_nameAccountRecovery.isCompromised(_id));
			require (!_nameAccountRecovery.isCompromised(_newListenerId));
		}

		PositionDetail storage _positionDetail = positionDetails[_id];
		address _currentListenerId = _positionDetail.listenerId;
		_positionDetail.listenerId = _newListenerId;

		uint256 _nonce;
		if (_isName) {
			_nonce = _nameFactory.incrementNonce(_id);
		} else {
			_nonce = _taoFactory.incrementNonce(_id);
		}
		emit SetListener(_id, _currentListenerId, _positionDetail.listenerId, _nonce);
	}

	/**
	 * @dev Set Speaker for a Name/TAO
	 * @param _id The ID of the Name/TAO
	 * @param _newSpeakerId The new speaker ID to be set
	 */
	function setSpeaker(address _id, address _newSpeakerId)
		public
		isNameOrTAO(_id)
		isNameOrTAO(_newSpeakerId)
		senderIsName
		senderNameNotCompromised
		onlyAdvocate(_id) {
		require (isExist(_id));

		// If _id is a Name, then new Speaker can only be a Name
		// If _id is a TAO, then new Speaker can be a TAO/Name
		bool _isName = false;
		if (AOLibrary.isName(_id)) {
			_isName = true;
			require (AOLibrary.isName(_newSpeakerId));
			require (!_nameAccountRecovery.isCompromised(_id));
			require (!_nameAccountRecovery.isCompromised(_newSpeakerId));
		}

		PositionDetail storage _positionDetail = positionDetails[_id];
		address _currentSpeakerId = _positionDetail.speakerId;
		_positionDetail.speakerId = _newSpeakerId;

		uint256 _nonce;
		if (_isName) {
			_nonce = _nameFactory.incrementNonce(_id);
		} else {
			_nonce = _taoFactory.incrementNonce(_id);
		}
		emit SetSpeaker(_id, _currentSpeakerId, _positionDetail.speakerId, _nonce);
	}

	/***** INTERNAL METHOD *****/
	/**
	 * @dev Actually setting Advocate for a TAO
	 * @param _taoId The ID of the TAO
	 * @param _newAdvocateId The new advocate ID to be set
	 */
	function _setAdvocate(address _taoId, address _newAdvocateId) internal {
		PositionDetail storage _positionDetail = positionDetails[_taoId];
		address _currentAdvocateId = _positionDetail.advocateId;
		_positionDetail.advocateId = _newAdvocateId;

		uint256 _nonce = _taoFactory.incrementNonce(_taoId);
		require (_nonce > 0);

		// Transfer Advocated TAO Logos to the new Advocate
		require (_logos.transferAdvocatedTAOLogos(_currentAdvocateId, _taoId));

		emit SetAdvocate(_taoId, _currentAdvocateId, _positionDetail.advocateId, _nonce);
	}

	/**
	 * @dev Get setting variables
	 * @return challengeTAOAdvocateLockDuration = The amount of time for current Advocate to respond to TAO Advocate challenge from another Name
	 * @return challengeTAOAdvocateCompleteDuration = The amount of time for challenger Advocate to respond and complete the challenge after the lock period ends
	 */
	function _getSettingVariables() internal view returns (uint256, uint256) {
		(uint256 challengeTAOAdvocateLockDuration,,,,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'challengeTAOAdvocateLockDuration');
		(uint256 challengeTAOAdvocateCompleteDuration,,,,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'challengeTAOAdvocateCompleteDuration');

		return (
			challengeTAOAdvocateLockDuration,
			challengeTAOAdvocateCompleteDuration
		);
	}
}
