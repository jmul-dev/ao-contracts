pragma solidity ^0.4.24;

import './AOLibrary.sol';
import "./TheAO.sol";
import './NameTAOPosition.sol';

/**
 * @title AOSettingAttribute
 *
 * This contract stores all AO setting data/state
 */
contract AOSettingAttribute is TheAO {
	NameTAOPosition internal _nameTAOPosition;

	struct SettingData {
		uint256 settingId;				// Identifier of this setting
		address creatorNameId;			// The nameId that created the setting
		address creatorTAOId;		// The taoId that created the setting
		address associatedTAOId;	// The taoId that the setting affects
		string settingName;				// The human-readable name of the setting
		/**
		 * 1 => uint256
		 * 2 => bool
		 * 3 => address
		 * 4 => bytes32
		 * 5 => string (catch all)
		 */
		uint8 settingType;
		bool pendingCreate;				// State when associatedTAOId has not accepted setting
		bool locked;					// State when pending anything (cannot change if locked)
		bool rejected;					// State when associatedTAOId rejected this setting
		string settingDataJSON;			// Catch-all
	}

	struct SettingState {
		uint256 settingId;				// Identifier of this setting
		bool pendingUpdate;				// State when setting is in process of being updated
		address updateAdvocateNameId;	// The nameId of the Advocate that performed the update

		/**
		 * A child of the associatedTAOId with the update Logos.
		 * This tells the setting contract that there is a proposal TAO that is a Child TAO
		 * of the associated TAO, which will be responsible for deciding if the update to the
		 * setting is accepted or rejected.
		 */
		address proposalTAOId;

		/**
		 * Signature of the proposalTAOId and update value by the associatedTAOId
		 * Advocate's Name's address.
		 */
		string updateSignature;

		/**
		 * The proposalTAOId moves here when setting value changes successfully
		 */
		address lastUpdateTAOId;

		string settingStateJSON;		// Catch-all
	}

	struct SettingDeprecation {
		uint256 settingId;				// Identifier of this setting
		address creatorNameId;			// The nameId that created this deprecation
		address creatorTAOId;		// The taoId that created this deprecation
		address associatedTAOId;	// The taoId that the setting affects
		bool pendingDeprecated;			// State when associatedTAOId has not accepted setting
		bool locked;					// State when pending anything (cannot change if locked)
		bool rejected;					// State when associatedTAOId rejected this setting
		bool migrated;					// State when this setting is fully migrated

		// holds the pending new settingId value when a deprecation is set
		uint256 pendingNewSettingId;

		// holds the new settingId that has been approved by associatedTAOId
		uint256 newSettingId;

		// holds the pending new contract address for this setting
		address pendingNewSettingContractAddress;

		// holds the new contract address for this setting
		address newSettingContractAddress;
	}

	struct AssociatedTAOSetting {
		bytes32 associatedTAOSettingId;		// Identifier
		address associatedTAOId;			// The TAO ID that the setting is associated to
		uint256 settingId;						// The Setting ID that is associated with the TAO ID
	}

	struct CreatorTAOSetting {
		bytes32 creatorTAOSettingId;		// Identifier
		address creatorTAOId;				// The TAO ID that the setting was created from
		uint256 settingId;						// The Setting ID created from the TAO ID
	}

	struct AssociatedTAOSettingDeprecation {
		bytes32 associatedTAOSettingDeprecationId;		// Identifier
		address associatedTAOId;						// The TAO ID that the setting is associated to
		uint256 settingId;									// The Setting ID that is associated with the TAO ID
	}

	struct CreatorTAOSettingDeprecation {
		bytes32 creatorTAOSettingDeprecationId;			// Identifier
		address creatorTAOId;							// The TAO ID that the setting was created from
		uint256 settingId;									// The Setting ID created from the TAO ID
	}

	// Mapping from settingId to it's data
	mapping (uint256 => SettingData) internal settingDatas;

	// Mapping from settingId to it's state
	mapping (uint256 => SettingState) internal settingStates;

	// Mapping from settingId to it's deprecation info
	mapping (uint256 => SettingDeprecation) internal settingDeprecations;

	// Mapping from associatedTAOSettingId to AssociatedTAOSetting
	mapping (bytes32 => AssociatedTAOSetting) internal associatedTAOSettings;

	// Mapping from creatorTAOSettingId to CreatorTAOSetting
	mapping (bytes32 => CreatorTAOSetting) internal creatorTAOSettings;

	// Mapping from associatedTAOSettingDeprecationId to AssociatedTAOSettingDeprecation
	mapping (bytes32 => AssociatedTAOSettingDeprecation) internal associatedTAOSettingDeprecations;

	// Mapping from creatorTAOSettingDeprecationId to CreatorTAOSettingDeprecation
	mapping (bytes32 => CreatorTAOSettingDeprecation) internal creatorTAOSettingDeprecations;

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameTAOPositionAddress) public {
		nameTAOPositionAddress = _nameTAOPositionAddress;
		_nameTAOPosition = NameTAOPosition(_nameTAOPositionAddress);
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
	 * @dev Add setting data/state
	 * @param _settingId The ID of the setting
	 * @param _creatorNameId The nameId that created the setting
	 * @param _settingType The type of this setting. 1 => uint256, 2 => bool, 3 => address, 4 => bytes32, 5 => string
	 * @param _settingName The human-readable name of the setting
	 * @param _creatorTAOId The taoId that created the setting
	 * @param _associatedTAOId The taoId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 * @return The ID of the "Associated" setting
	 * @return The ID of the "Creator" setting
	 */
	function add(uint256 _settingId, address _creatorNameId, uint8 _settingType, string _settingName, address _creatorTAOId, address _associatedTAOId, string _extraData) public inWhitelist returns (bytes32, bytes32) {
		// Store setting data/state
		require (_storeSettingDataState(_settingId, _creatorNameId, _settingType, _settingName, _creatorTAOId, _associatedTAOId, _extraData));

		// Store the associatedTAOSetting info
		bytes32 _associatedTAOSettingId = keccak256(abi.encodePacked(this, _associatedTAOId, _settingId));
		AssociatedTAOSetting storage _associatedTAOSetting = associatedTAOSettings[_associatedTAOSettingId];
		_associatedTAOSetting.associatedTAOSettingId = _associatedTAOSettingId;
		_associatedTAOSetting.associatedTAOId = _associatedTAOId;
		_associatedTAOSetting.settingId = _settingId;

		// Store the creatorTAOSetting info
		bytes32 _creatorTAOSettingId = keccak256(abi.encodePacked(this, _creatorTAOId, _settingId));
		CreatorTAOSetting storage _creatorTAOSetting = creatorTAOSettings[_creatorTAOSettingId];
		_creatorTAOSetting.creatorTAOSettingId = _creatorTAOSettingId;
		_creatorTAOSetting.creatorTAOId = _creatorTAOId;
		_creatorTAOSetting.settingId = _settingId;

		return (_associatedTAOSettingId, _creatorTAOSettingId);
	}

	/**
	 * @dev Get Setting Data of a setting ID
	 * @param _settingId The ID of the setting
	 */
	function getSettingData(uint256 _settingId) public view returns (uint256, address, address, address, string, uint8, bool, bool, bool, string) {
		SettingData memory _settingData = settingDatas[_settingId];
		return (
			_settingData.settingId,
			_settingData.creatorNameId,
			_settingData.creatorTAOId,
			_settingData.associatedTAOId,
			_settingData.settingName,
			_settingData.settingType,
			_settingData.pendingCreate,
			_settingData.locked,
			_settingData.rejected,
			_settingData.settingDataJSON
		);
	}

	/**
	 * @dev Get Associated TAO Setting info
	 * @param _associatedTAOSettingId The ID of the associated tao setting
	 */
	function getAssociatedTAOSetting(bytes32 _associatedTAOSettingId) public view returns (bytes32, address, uint256) {
		AssociatedTAOSetting memory _associatedTAOSetting = associatedTAOSettings[_associatedTAOSettingId];
		return (
			_associatedTAOSetting.associatedTAOSettingId,
			_associatedTAOSetting.associatedTAOId,
			_associatedTAOSetting.settingId
		);
	}

	/**
	 * @dev Get Creator TAO Setting info
	 * @param _creatorTAOSettingId The ID of the creator tao setting
	 */
	function getCreatorTAOSetting(bytes32 _creatorTAOSettingId) public view returns (bytes32, address, uint256) {
		CreatorTAOSetting memory _creatorTAOSetting = creatorTAOSettings[_creatorTAOSettingId];
		return (
			_creatorTAOSetting.creatorTAOSettingId,
			_creatorTAOSetting.creatorTAOId,
			_creatorTAOSetting.settingId
		);
	}

	/**
	 * @dev Advocate of Setting's _associatedTAOId approves setting creation
	 * @param _settingId The ID of the setting to approve
	 * @param _associatedTAOAdvocate The advocate of the associated TAO
	 * @param _approved Whether to approve or reject
	 * @return true on success
	 */
	function approveAdd(uint256 _settingId, address _associatedTAOAdvocate, bool _approved) public inWhitelist returns (bool) {
		// Make sure setting exists and needs approval
		SettingData storage _settingData = settingDatas[_settingId];
		require (_settingData.settingId == _settingId &&
			_settingData.pendingCreate == true &&
			_settingData.locked == true &&
			_settingData.rejected == false &&
			_associatedTAOAdvocate != address(0) &&
			_associatedTAOAdvocate == _nameTAOPosition.getAdvocate(_settingData.associatedTAOId)
		);

		if (_approved) {
			// Unlock the setting so that advocate of creatorTAOId can finalize the creation
			_settingData.locked = false;
		} else {
			// Reject the setting
			_settingData.pendingCreate = false;
			_settingData.rejected = true;
		}

		return true;
	}

	/**
	 * @dev Advocate of Setting's _creatorTAOId finalizes the setting creation once the setting is approved
	 * @param _settingId The ID of the setting to be finalized
	 * @param _creatorTAOAdvocate The advocate of the creator TAO
	 * @return true on success
	 */
	function finalizeAdd(uint256 _settingId, address _creatorTAOAdvocate) public inWhitelist returns (bool) {
		// Make sure setting exists and needs approval
		SettingData storage _settingData = settingDatas[_settingId];
		require (_settingData.settingId == _settingId &&
			_settingData.pendingCreate == true &&
			_settingData.locked == false &&
			_settingData.rejected == false &&
			_creatorTAOAdvocate != address(0) &&
			_creatorTAOAdvocate == _nameTAOPosition.getAdvocate(_settingData.creatorTAOId)
		);

		// Update the setting data
		_settingData.pendingCreate = false;
		_settingData.locked = true;

		return true;
	}

	/**
	 * @dev Store setting update data
	 * @param _settingId The ID of the setting to be updated
	 * @param _settingType The type of this setting
	 * @param _associatedTAOAdvocate The setting's associatedTAOId's advocate's name address
	 * @param _proposalTAOId The child of the associatedTAOId with the update Logos
	 * @param _updateSignature A signature of the proposalTAOId and update value by _associatedTAOAdvocate
	 * @param _extraData Catch-all string value to be stored if exist
	 * @return true on success
	 */
	function update(uint256 _settingId, uint8 _settingType, address _associatedTAOAdvocate, address _proposalTAOId, string _updateSignature, string _extraData) public inWhitelist returns (bool) {
		// Make sure setting is created
		SettingData memory _settingData = settingDatas[_settingId];
		require (_settingData.settingId == _settingId &&
			_settingData.settingType == _settingType &&
			_settingData.pendingCreate == false &&
			_settingData.locked == true &&
			_settingData.rejected == false &&
			_associatedTAOAdvocate != address(0) &&
			_associatedTAOAdvocate == _nameTAOPosition.getAdvocate(_settingData.associatedTAOId) &&
			bytes(_updateSignature).length > 0
		);

		// Make sure setting is not in the middle of updating
		SettingState storage _settingState = settingStates[_settingId];
		require (_settingState.pendingUpdate == false);

		// Make sure setting is not yet deprecated
		SettingDeprecation memory _settingDeprecation = settingDeprecations[_settingId];
		if (_settingDeprecation.settingId == _settingId) {
			require (_settingDeprecation.migrated == false);
		}

		// Store the SettingState data
		_settingState.pendingUpdate = true;
		_settingState.updateAdvocateNameId = _associatedTAOAdvocate;
		_settingState.proposalTAOId = _proposalTAOId;
		_settingState.updateSignature = _updateSignature;
		_settingState.settingStateJSON = _extraData;

		return true;
	}

	/**
	 * @dev Get setting state
	 * @param _settingId The ID of the setting
	 */
	function getSettingState(uint256 _settingId) public view returns (uint256, bool, address, address, string, address, string) {
		SettingState memory _settingState = settingStates[_settingId];
		return (
			_settingState.settingId,
			_settingState.pendingUpdate,
			_settingState.updateAdvocateNameId,
			_settingState.proposalTAOId,
			_settingState.updateSignature,
			_settingState.lastUpdateTAOId,
			_settingState.settingStateJSON
		);
	}

	/**
	 * @dev Advocate of Setting's proposalTAOId approves the setting update
	 * @param _settingId The ID of the setting to be approved
	 * @param _proposalTAOAdvocate The advocate of the proposal TAO
	 * @param _approved Whether to approve or reject
	 * @return true on success
	 */
	function approveUpdate(uint256 _settingId, address _proposalTAOAdvocate, bool _approved) public inWhitelist returns (bool) {
		// Make sure setting is created
		SettingData storage _settingData = settingDatas[_settingId];
		require (_settingData.settingId == _settingId && _settingData.pendingCreate == false && _settingData.locked == true && _settingData.rejected == false);

		// Make sure setting update exists and needs approval
		SettingState storage _settingState = settingStates[_settingId];
		require (_settingState.settingId == _settingId &&
			_settingState.pendingUpdate == true &&
			_proposalTAOAdvocate != address(0) &&
			_proposalTAOAdvocate == _nameTAOPosition.getAdvocate(_settingState.proposalTAOId)
		);

		if (_approved) {
			// Unlock the setting so that advocate of associatedTAOId can finalize the update
			_settingData.locked = false;
		} else {
			// Set pendingUpdate to false
			_settingState.pendingUpdate = false;
			_settingState.proposalTAOId = address(0);
		}
		return true;
	}

	/**
	 * @dev Advocate of Setting's _associatedTAOId finalizes the setting update once the setting is approved
	 * @param _settingId The ID of the setting to be finalized
	 * @param _associatedTAOAdvocate The advocate of the associated TAO
	 * @return true on success
	 */
	function finalizeUpdate(uint256 _settingId, address _associatedTAOAdvocate) public inWhitelist returns (bool) {
		// Make sure setting is created
		SettingData storage _settingData = settingDatas[_settingId];
		require (_settingData.settingId == _settingId &&
			_settingData.pendingCreate == false &&
			_settingData.locked == false &&
			_settingData.rejected == false &&
			_associatedTAOAdvocate != address(0) &&
			_associatedTAOAdvocate == _nameTAOPosition.getAdvocate(_settingData.associatedTAOId)
		);

		// Make sure setting update exists and needs approval
		SettingState storage _settingState = settingStates[_settingId];
		require (_settingState.settingId == _settingId && _settingState.pendingUpdate == true && _settingState.proposalTAOId != address(0));

		// Update the setting data
		_settingData.locked = true;

		// Update the setting state
		_settingState.pendingUpdate = false;
		_settingState.updateAdvocateNameId = _associatedTAOAdvocate;
		address _proposalTAOId = _settingState.proposalTAOId;
		_settingState.proposalTAOId = address(0);
		_settingState.lastUpdateTAOId = _proposalTAOId;

		return true;
	}

	/**
	 * @dev Add setting deprecation
	 * @param _settingId The ID of the setting
	 * @param _creatorNameId The nameId that created the setting
	 * @param _creatorTAOId The taoId that created the setting
	 * @param _associatedTAOId The taoId that the setting affects
	 * @param _newSettingId The new settingId value to route
	 * @param _newSettingContractAddress The address of the new setting contract to route
	 * @return The ID of the "Associated" setting deprecation
	 * @return The ID of the "Creator" setting deprecation
	 */
	function addDeprecation(uint256 _settingId, address _creatorNameId, address _creatorTAOId, address _associatedTAOId, uint256 _newSettingId, address _newSettingContractAddress) public inWhitelist returns (bytes32, bytes32) {
		require (_storeSettingDeprecation(_settingId, _creatorNameId, _creatorTAOId, _associatedTAOId, _newSettingId, _newSettingContractAddress));

		// Store the associatedTAOSettingDeprecation info
		bytes32 _associatedTAOSettingDeprecationId = keccak256(abi.encodePacked(this, _associatedTAOId, _settingId));
		AssociatedTAOSettingDeprecation storage _associatedTAOSettingDeprecation = associatedTAOSettingDeprecations[_associatedTAOSettingDeprecationId];
		_associatedTAOSettingDeprecation.associatedTAOSettingDeprecationId = _associatedTAOSettingDeprecationId;
		_associatedTAOSettingDeprecation.associatedTAOId = _associatedTAOId;
		_associatedTAOSettingDeprecation.settingId = _settingId;

		// Store the creatorTAOSettingDeprecation info
		bytes32 _creatorTAOSettingDeprecationId = keccak256(abi.encodePacked(this, _creatorTAOId, _settingId));
		CreatorTAOSettingDeprecation storage _creatorTAOSettingDeprecation = creatorTAOSettingDeprecations[_creatorTAOSettingDeprecationId];
		_creatorTAOSettingDeprecation.creatorTAOSettingDeprecationId = _creatorTAOSettingDeprecationId;
		_creatorTAOSettingDeprecation.creatorTAOId = _creatorTAOId;
		_creatorTAOSettingDeprecation.settingId = _settingId;

		return (_associatedTAOSettingDeprecationId, _creatorTAOSettingDeprecationId);
	}

	/**
	 * @dev Get Setting Deprecation info of a setting ID
	 * @param _settingId The ID of the setting
	 */
	function getSettingDeprecation(uint256 _settingId) public view returns (uint256, address, address, address, bool, bool, bool, bool, uint256, uint256, address, address) {
		SettingDeprecation memory _settingDeprecation = settingDeprecations[_settingId];
		return (
			_settingDeprecation.settingId,
			_settingDeprecation.creatorNameId,
			_settingDeprecation.creatorTAOId,
			_settingDeprecation.associatedTAOId,
			_settingDeprecation.pendingDeprecated,
			_settingDeprecation.locked,
			_settingDeprecation.rejected,
			_settingDeprecation.migrated,
			_settingDeprecation.pendingNewSettingId,
			_settingDeprecation.newSettingId,
			_settingDeprecation.pendingNewSettingContractAddress,
			_settingDeprecation.newSettingContractAddress
		);
	}

	/**
	 * @dev Get Associated TAO Setting Deprecation info
	 * @param _associatedTAOSettingDeprecationId The ID of the associated tao setting deprecation
	 */
	function getAssociatedTAOSettingDeprecation(bytes32 _associatedTAOSettingDeprecationId) public view returns (bytes32, address, uint256) {
		AssociatedTAOSettingDeprecation memory _associatedTAOSettingDeprecation = associatedTAOSettingDeprecations[_associatedTAOSettingDeprecationId];
		return (
			_associatedTAOSettingDeprecation.associatedTAOSettingDeprecationId,
			_associatedTAOSettingDeprecation.associatedTAOId,
			_associatedTAOSettingDeprecation.settingId
		);
	}

	/**
	 * @dev Get Creator TAO Setting Deprecation info
	 * @param _creatorTAOSettingDeprecationId The ID of the creator tao setting deprecation
	 */
	function getCreatorTAOSettingDeprecation(bytes32 _creatorTAOSettingDeprecationId) public view returns (bytes32, address, uint256) {
		CreatorTAOSettingDeprecation memory _creatorTAOSettingDeprecation = creatorTAOSettingDeprecations[_creatorTAOSettingDeprecationId];
		return (
			_creatorTAOSettingDeprecation.creatorTAOSettingDeprecationId,
			_creatorTAOSettingDeprecation.creatorTAOId,
			_creatorTAOSettingDeprecation.settingId
		);
	}

	/**
	 * @dev Advocate of SettingDeprecation's _associatedTAOId approves deprecation
	 * @param _settingId The ID of the setting to approve
	 * @param _associatedTAOAdvocate The advocate of the associated TAO
	 * @param _approved Whether to approve or reject
	 * @return true on success
	 */
	function approveDeprecation(uint256 _settingId, address _associatedTAOAdvocate, bool _approved) public inWhitelist returns (bool) {
		// Make sure setting exists and needs approval
		SettingDeprecation storage _settingDeprecation = settingDeprecations[_settingId];
		require (_settingDeprecation.settingId == _settingId &&
			_settingDeprecation.migrated == false &&
			_settingDeprecation.pendingDeprecated == true &&
			_settingDeprecation.locked == true &&
			_settingDeprecation.rejected == false &&
			_associatedTAOAdvocate != address(0) &&
			_associatedTAOAdvocate == _nameTAOPosition.getAdvocate(_settingDeprecation.associatedTAOId)
		);

		if (_approved) {
			// Unlock the setting so that advocate of creatorTAOId can finalize the creation
			_settingDeprecation.locked = false;
		} else {
			// Reject the setting
			_settingDeprecation.pendingDeprecated = false;
			_settingDeprecation.rejected = true;
		}
		return true;
	}

	/**
	 * @dev Advocate of SettingDeprecation's _creatorTAOId finalizes the deprecation once the setting deprecation is approved
	 * @param _settingId The ID of the setting to be finalized
	 * @param _creatorTAOAdvocate The advocate of the creator TAO
	 * @return true on success
	 */
	function finalizeDeprecation(uint256 _settingId, address _creatorTAOAdvocate) public inWhitelist returns (bool) {
		// Make sure setting exists and needs approval
		SettingDeprecation storage _settingDeprecation = settingDeprecations[_settingId];
		require (_settingDeprecation.settingId == _settingId &&
			_settingDeprecation.migrated == false &&
			_settingDeprecation.pendingDeprecated == true &&
			_settingDeprecation.locked == false &&
			_settingDeprecation.rejected == false &&
			_creatorTAOAdvocate != address(0) &&
			_creatorTAOAdvocate == _nameTAOPosition.getAdvocate(_settingDeprecation.creatorTAOId)
		);

		// Update the setting data
		_settingDeprecation.pendingDeprecated = false;
		_settingDeprecation.locked = true;
		_settingDeprecation.migrated = true;
		uint256 _newSettingId = _settingDeprecation.pendingNewSettingId;
		_settingDeprecation.pendingNewSettingId = 0;
		_settingDeprecation.newSettingId = _newSettingId;

		address _newSettingContractAddress = _settingDeprecation.pendingNewSettingContractAddress;
		_settingDeprecation.pendingNewSettingContractAddress = address(0);
		_settingDeprecation.newSettingContractAddress = _newSettingContractAddress;
		return true;
	}

	/**
	 * @dev Check if a setting exist and not rejected
	 * @param _settingId The ID of the setting
	 * @return true if exist. false otherwise
	 */
	function settingExist(uint256 _settingId) public view returns (bool) {
		SettingData memory _settingData = settingDatas[_settingId];
		return (_settingData.settingId == _settingId && _settingData.rejected == false);
	}

	/**
	 * @dev Get the latest ID of a deprecated setting, if exist
	 * @param _settingId The ID of the setting
	 * @return The latest setting ID
	 */
	function getLatestSettingId(uint256 _settingId) public view returns (uint256) {
		(,,,,,,, bool _migrated,, uint256 _newSettingId,,) = getSettingDeprecation(_settingId);
		while (_migrated && _newSettingId > 0) {
			_settingId = _newSettingId;
			(,,,,,,, _migrated,, _newSettingId,,) = getSettingDeprecation(_settingId);
		}
		return _settingId;
	}

	/***** Internal Method *****/
	/**
	 * @dev Store setting data/state
	 * @param _settingId The ID of the setting
	 * @param _creatorNameId The nameId that created the setting
	 * @param _settingType The type of this setting. 1 => uint256, 2 => bool, 3 => address, 4 => bytes32, 5 => string
	 * @param _settingName The human-readable name of the setting
	 * @param _creatorTAOId The taoId that created the setting
	 * @param _associatedTAOId The taoId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 * @return true on success
	 */
	function _storeSettingDataState(uint256 _settingId, address _creatorNameId, uint8 _settingType, string _settingName, address _creatorTAOId, address _associatedTAOId, string _extraData) internal returns (bool) {
		// Store setting data
		SettingData storage _settingData = settingDatas[_settingId];
		_settingData.settingId = _settingId;
		_settingData.creatorNameId = _creatorNameId;
		_settingData.creatorTAOId = _creatorTAOId;
		_settingData.associatedTAOId = _associatedTAOId;
		_settingData.settingName = _settingName;
		_settingData.settingType = _settingType;
		_settingData.pendingCreate = true;
		_settingData.locked = true;
		_settingData.settingDataJSON = _extraData;

		// Store setting state
		SettingState storage _settingState = settingStates[_settingId];
		_settingState.settingId = _settingId;
		return true;
	}

	/**
	 * @dev Store setting deprecation
	 * @param _settingId The ID of the setting
	 * @param _creatorNameId The nameId that created the setting
	 * @param _creatorTAOId The taoId that created the setting
	 * @param _associatedTAOId The taoId that the setting affects
	 * @param _newSettingId The new settingId value to route
	 * @param _newSettingContractAddress The address of the new setting contract to route
	 * @return true on success
	 */
	function _storeSettingDeprecation(uint256 _settingId, address _creatorNameId, address _creatorTAOId, address _associatedTAOId, uint256 _newSettingId, address _newSettingContractAddress) internal returns (bool) {
		// Make sure this setting exists
		require (settingDatas[_settingId].creatorNameId != address(0) && settingDatas[_settingId].rejected == false && settingDatas[_settingId].pendingCreate == false);

		// Make sure deprecation is not yet exist for this setting Id
		require (settingDeprecations[_settingId].creatorNameId == address(0));

		// Make sure newSettingId exists
		require (settingDatas[_newSettingId].creatorNameId != address(0) && settingDatas[_newSettingId].rejected == false && settingDatas[_newSettingId].pendingCreate == false);

		// Make sure the settingType matches
		require (settingDatas[_settingId].settingType == settingDatas[_newSettingId].settingType);

		// Store setting deprecation info
		SettingDeprecation storage _settingDeprecation = settingDeprecations[_settingId];
		_settingDeprecation.settingId = _settingId;
		_settingDeprecation.creatorNameId = _creatorNameId;
		_settingDeprecation.creatorTAOId = _creatorTAOId;
		_settingDeprecation.associatedTAOId = _associatedTAOId;
		_settingDeprecation.pendingDeprecated = true;
		_settingDeprecation.locked = true;
		_settingDeprecation.pendingNewSettingId = _newSettingId;
		_settingDeprecation.pendingNewSettingContractAddress = _newSettingContractAddress;
		return true;
	}
}
