pragma solidity ^0.4.24;

import "./developed.sol";
import './Thought.sol';

/**
 * @title AOSettingAttribute
 *
 * This contract stores all AO setting data/state
 */
contract AOSettingAttribute is developed {
	struct SettingData {
		uint256 settingId;				// Identifier of this setting
		address creatorNameId;			// The nameId that created the setting
		address creatorThoughtId;		// The thoughtId that created the setting
		address associatedThoughtId;	// The thoughtId that the setting affects
		string settingName;				// The human-readable name of the setting
		/**
		 * 1 => uint256
		 * 2 => bool
		 * 3 => address
		 * 4 => bytes32
		 * 5 => string (catch all)
		 */
		uint8 settingType;
		bool pendingCreate;				// State when associatedThoughtId has not accepted setting
		bool locked;					// State when pending anything (cannot change if locked)
		bool rejected;					// State when associatedThoughtId rejected this setting
		string settingDataJSON;			// Catch-all
	}

	struct SettingState {
		uint256 settingId;				// Identifier of this setting
		bool pendingUpdate;				// State when setting is in process of being updated
		address updateAdvocateNameId;	// The nameId of the Advocate that performed the update

		/**
		 * A child of the associatedThoughtId with the update Logos.
		 * This tells the setting contract that there is a proposal Thought that is a Child Thought
		 * of the associated Thought, which will be responsible for deciding if the update to the
		 * setting is accepted or rejected.
		 */
		address proposalThoughtId;

		/**
		 * Signature of the proposalThoughtId and update value by the associatedThoughtId
		 * Advocate's Name's address.
		 */
		string updateSignature;

		/**
		 * The proposalThoughtId moves here when setting value changes successfully
		 */
		address lastUpdateThoughtId;

		string settingStateJSON;		// Catch-all
	}

	struct SettingDeprecation {
		uint256 settingId;				// Identifier of this setting
		address creatorNameId;			// The nameId that created this deprecation
		address creatorThoughtId;		// The thoughtId that created this deprecation
		address associatedThoughtId;	// The thoughtId that the setting affects
		bool pendingDeprecated;			// State when associatedThoughtId has not accepted setting
		bool locked;					// State when pending anything (cannot change if locked)
		bool rejected;					// State when associatedThoughtId rejected this setting
		bool migrated;					// State when this setting is fully migrated

		// holds the pending new settingId value when a deprecation is set
		uint256 pendingNewSettingId;

		// holds the new settingId that has been approved by associatedThoughtId
		uint256 newSettingId;

		// holds the pending new contract address for this setting
		address pendingNewSettingContractAddress;

		// holds the new contract address for this setting
		address newSettingContractAddress;
	}

	struct AssociatedThoughtSetting {
		bytes32 associatedThoughtSettingId;		// Identifier
		address associatedThoughtId;			// The Thought ID that the setting is associated to
		uint256 settingId;						// The Setting ID that is associated with the Thought ID
	}

	struct CreatorThoughtSetting {
		bytes32 creatorThoughtSettingId;		// Identifier
		address creatorThoughtId;				// The Thought ID that the setting was created from
		uint256 settingId;						// The Setting ID created from the Thought ID
	}

	struct AssociatedThoughtSettingDeprecation {
		bytes32 associatedThoughtSettingDeprecationId;		// Identifier
		address associatedThoughtId;						// The Thought ID that the setting is associated to
		uint256 settingId;									// The Setting ID that is associated with the Thought ID
	}

	struct CreatorThoughtSettingDeprecation {
		bytes32 creatorThoughtSettingDeprecationId;			// Identifier
		address creatorThoughtId;							// The Thought ID that the setting was created from
		uint256 settingId;									// The Setting ID created from the Thought ID
	}

	// Mapping from settingId to it's data
	mapping (uint256 => SettingData) internal settingDatas;

	// Mapping from settingId to it's state
	mapping (uint256 => SettingState) internal settingStates;

	// Mapping from settingId to it's deprecation info
	mapping (uint256 => SettingDeprecation) internal settingDeprecations;

	// Mapping from associatedThoughtSettingId to AssociatedThoughtSetting
	mapping (bytes32 => AssociatedThoughtSetting) internal associatedThoughtSettings;

	// Mapping from creatorThoughtSettingId to CreatorThoughtSetting
	mapping (bytes32 => CreatorThoughtSetting) internal creatorThoughtSettings;

	// Mapping from associatedThoughtSettingDeprecationId to AssociatedThoughtSettingDeprecation
	mapping (bytes32 => AssociatedThoughtSettingDeprecation) internal associatedThoughtSettingDeprecations;

	// Mapping from creatorThoughtSettingDeprecationId to CreatorThoughtSettingDeprecation
	mapping (bytes32 => CreatorThoughtSettingDeprecation) internal creatorThoughtSettingDeprecations;

	/**
	 * @dev Constructor function
	 */
	constructor() public {}

	/**
	 * @dev Add setting data/state
	 * @param _settingId The ID of the setting
	 * @param _creatorNameId The nameId that created the setting
	 * @param _settingType The type of this setting. 1 => uint256, 2 => bool, 3 => address, 4 => bytes32, 5 => string
	 * @param _settingName The human-readable name of the setting
	 * @param _creatorThoughtId The thoughtId that created the setting
	 * @param _associatedThoughtId The thoughtId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 * @return The ID of the "Associated" setting
	 * @return The ID of the "Creator" setting
	 */
	function add(uint256 _settingId, address _creatorNameId, uint8 _settingType, string _settingName, address _creatorThoughtId, address _associatedThoughtId, string _extraData) public inWhitelist(msg.sender) returns (bytes32, bytes32) {
		// Store setting data/state
		require (_storeSettingDataState(_settingId, _creatorNameId, _settingType, _settingName, _creatorThoughtId, _associatedThoughtId, _extraData));

		// Store the associatedThoughtSetting info
		bytes32 _associatedThoughtSettingId = keccak256(abi.encodePacked(this, _associatedThoughtId, _settingId));
		AssociatedThoughtSetting storage _associatedThoughtSetting = associatedThoughtSettings[_associatedThoughtSettingId];
		_associatedThoughtSetting.associatedThoughtSettingId = _associatedThoughtSettingId;
		_associatedThoughtSetting.associatedThoughtId = _associatedThoughtId;
		_associatedThoughtSetting.settingId = _settingId;

		// Store the creatorThoughtSetting info
		bytes32 _creatorThoughtSettingId = keccak256(abi.encodePacked(this, _creatorThoughtId, _settingId));
		CreatorThoughtSetting storage _creatorThoughtSetting = creatorThoughtSettings[_creatorThoughtSettingId];
		_creatorThoughtSetting.creatorThoughtSettingId = _creatorThoughtSettingId;
		_creatorThoughtSetting.creatorThoughtId = _creatorThoughtId;
		_creatorThoughtSetting.settingId = _settingId;

		return (_associatedThoughtSettingId, _creatorThoughtSettingId);
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
			_settingData.creatorThoughtId,
			_settingData.associatedThoughtId,
			_settingData.settingName,
			_settingData.settingType,
			_settingData.pendingCreate,
			_settingData.locked,
			_settingData.rejected,
			_settingData.settingDataJSON
		);
	}

	/**
	 * @dev Get Associated Thought Setting info
	 * @param _associatedThoughtSettingId The ID of the associated thought setting
	 */
	function getAssociatedThoughtSetting(bytes32 _associatedThoughtSettingId) public view returns (bytes32, address, uint256) {
		AssociatedThoughtSetting memory _associatedThoughtSetting = associatedThoughtSettings[_associatedThoughtSettingId];
		return (
			_associatedThoughtSetting.associatedThoughtSettingId,
			_associatedThoughtSetting.associatedThoughtId,
			_associatedThoughtSetting.settingId
		);
	}

	/**
	 * @dev Get Creator Thought Setting info
	 * @param _creatorThoughtSettingId The ID of the creator thought setting
	 */
	function getCreatorThoughtSetting(bytes32 _creatorThoughtSettingId) public view returns (bytes32, address, uint256) {
		CreatorThoughtSetting memory _creatorThoughtSetting = creatorThoughtSettings[_creatorThoughtSettingId];
		return (
			_creatorThoughtSetting.creatorThoughtSettingId,
			_creatorThoughtSetting.creatorThoughtId,
			_creatorThoughtSetting.settingId
		);
	}

	/**
	 * @dev Advocate of Setting's _associatedThoughtId approves setting creation
	 * @param _settingId The ID of the setting to approve
	 * @param _associatedThoughtAdvocate The advocate of the associated Thought
	 * @param _approved Whether to approve or reject
	 * @return true on success
	 */
	function approveAdd(uint256 _settingId, address _associatedThoughtAdvocate, bool _approved) public inWhitelist(msg.sender) returns (bool) {
		// Make sure setting exists and needs approval
		SettingData storage _settingData = settingDatas[_settingId];
		require (_settingData.settingId == _settingId && _settingData.pendingCreate == true && _settingData.locked == true && _settingData.rejected == false && _associatedThoughtAdvocate != address(0) && _associatedThoughtAdvocate == Thought(_settingData.associatedThoughtId).advocateId());

		if (_approved) {
			// Unlock the setting so that advocate of creatorThoughtId can finalize the creation
			_settingData.locked = false;
		} else {
			// Reject the setting
			_settingData.pendingCreate = false;
			_settingData.rejected = true;
		}

		return true;
	}

	/**
	 * @dev Advocate of Setting's _creatorThoughtId finalizes the setting creation once the setting is approved
	 * @param _settingId The ID of the setting to be finalized
	 * @param _creatorThoughtAdvocate The advocate of the creator Thought
	 * @return true on success
	 */
	function finalizeAdd(uint256 _settingId, address _creatorThoughtAdvocate) public inWhitelist(msg.sender) returns (bool) {
		// Make sure setting exists and needs approval
		SettingData storage _settingData = settingDatas[_settingId];
		require (_settingData.settingId == _settingId && _settingData.pendingCreate == true && _settingData.locked == false && _settingData.rejected == false && _creatorThoughtAdvocate != address(0) && _creatorThoughtAdvocate == Thought(_settingData.creatorThoughtId).advocateId());

		// Update the setting data
		_settingData.pendingCreate = false;
		_settingData.locked = true;

		return true;
	}

	/**
	 * @dev Store setting update data
	 * @param _settingId The ID of the setting to be updated
	 * @param _associatedThoughtAdvocate The setting's associatedThoughtId's advocate's name address
	 * @param _proposalThoughtId The child of the associatedThoughtId with the update Logos
	 * @param _updateSignature A signature of the proposalThoughtId and update value by _associatedThoughtAdvocate
	 * @param _extraData Catch-all string value to be stored if exist
	 * @return true on success
	 */
	function update(uint256 _settingId, address _associatedThoughtAdvocate, address _proposalThoughtId, string _updateSignature, string _extraData) public inWhitelist(msg.sender) returns (bool) {
		// Make sure setting is created
		SettingData memory _settingData = settingDatas[_settingId];
		require (_settingData.settingId == _settingId && _settingData.pendingCreate == false && _settingData.locked == true && _settingData.rejected == false && _associatedThoughtAdvocate != address(0) && _associatedThoughtAdvocate == Thought(_settingData.associatedThoughtId).advocateId());

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
		_settingState.updateAdvocateNameId = _associatedThoughtAdvocate;
		_settingState.proposalThoughtId = _proposalThoughtId;
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
			_settingState.proposalThoughtId,
			_settingState.updateSignature,
			_settingState.lastUpdateThoughtId,
			_settingState.settingStateJSON
		);
	}

	/**
	 * @dev Advocate of Setting's proposalThoughtId approves the setting update
	 * @param _settingId The ID of the setting to be approved
	 * @param _proposalThoughtAdvocate The advocate of the proposal Thought
	 * @param _approved Whether to approve or reject
	 * @return true on success
	 */
	function approveUpdate(uint256 _settingId, address _proposalThoughtAdvocate, bool _approved) public inWhitelist(msg.sender) returns (bool) {
		// Make sure setting is created
		SettingData storage _settingData = settingDatas[_settingId];
		require (_settingData.settingId == _settingId && _settingData.pendingCreate == false && _settingData.locked == true && _settingData.rejected == false);

		// Make sure setting update exists and needs approval
		SettingState storage _settingState = settingStates[_settingId];
		require (_settingState.settingId == _settingId && _settingState.pendingUpdate == true && _proposalThoughtAdvocate != address(0) && _proposalThoughtAdvocate == Thought(_settingState.proposalThoughtId).advocateId());

		if (_approved) {
			// Unlock the setting so that advocate of associatedThoughtId can finalize the update
			_settingData.locked = false;
		} else {
			// Set pendingUpdate to false
			_settingState.pendingUpdate = false;
			_settingState.proposalThoughtId = address(0);
		}
		return true;
	}

	/**
	 * @dev Advocate of Setting's _associatedThoughtId finalizes the setting update once the setting is approved
	 * @param _settingId The ID of the setting to be finalized
	 * @param _associatedThoughtAdvocate The advocate of the associated Thought
	 * @return true on success
	 */
	function finalizeUpdate(uint256 _settingId, address _associatedThoughtAdvocate) public inWhitelist(msg.sender) returns (bool) {
		// Make sure setting is created
		SettingData storage _settingData = settingDatas[_settingId];
		require (_settingData.settingId == _settingId && _settingData.pendingCreate == false && _settingData.locked == false && _settingData.rejected == false && _associatedThoughtAdvocate != address(0) && _associatedThoughtAdvocate == Thought(_settingData.associatedThoughtId).advocateId());

		// Make sure setting update exists and needs approval
		SettingState storage _settingState = settingStates[_settingId];
		require (_settingState.settingId == _settingId && _settingState.pendingUpdate == true && _settingState.proposalThoughtId != address(0));

		// Update the setting data
		_settingData.locked = true;

		// Update the setting state
		_settingState.pendingUpdate = false;
		_settingState.updateAdvocateNameId = _associatedThoughtAdvocate;
		address _proposalThoughtId = _settingState.proposalThoughtId;
		_settingState.proposalThoughtId = address(0);
		_settingState.lastUpdateThoughtId = _proposalThoughtId;

		return true;
	}

	/**
	 * @dev Add setting deprecation
	 * @param _settingId The ID of the setting
	 * @param _creatorNameId The nameId that created the setting
	 * @param _creatorThoughtId The thoughtId that created the setting
	 * @param _associatedThoughtId The thoughtId that the setting affects
	 * @param _newSettingId The new settingId value to route
	 * @param _newSettingContractAddress The address of the new setting contract to route
	 * @return The ID of the "Associated" setting deprecation
	 * @return The ID of the "Creator" setting deprecation
	 */
	function addDeprecation(uint256 _settingId, address _creatorNameId, address _creatorThoughtId, address _associatedThoughtId, uint256 _newSettingId, address _newSettingContractAddress) public inWhitelist(msg.sender) returns (bytes32, bytes32) {
		require (_storeSettingDeprecation(_settingId, _creatorNameId, _creatorThoughtId, _associatedThoughtId, _newSettingId, _newSettingContractAddress));

		// Store the associatedThoughtSettingDeprecation info
		bytes32 _associatedThoughtSettingDeprecationId = keccak256(abi.encodePacked(this, _associatedThoughtId, _settingId));
		AssociatedThoughtSettingDeprecation storage _associatedThoughtSettingDeprecation = associatedThoughtSettingDeprecations[_associatedThoughtSettingDeprecationId];
		_associatedThoughtSettingDeprecation.associatedThoughtSettingDeprecationId = _associatedThoughtSettingDeprecationId;
		_associatedThoughtSettingDeprecation.associatedThoughtId = _associatedThoughtId;
		_associatedThoughtSettingDeprecation.settingId = _settingId;

		// Store the creatorThoughtSettingDeprecation info
		bytes32 _creatorThoughtSettingDeprecationId = keccak256(abi.encodePacked(this, _creatorThoughtId, _settingId));
		CreatorThoughtSettingDeprecation storage _creatorThoughtSettingDeprecation = creatorThoughtSettingDeprecations[_creatorThoughtSettingDeprecationId];
		_creatorThoughtSettingDeprecation.creatorThoughtSettingDeprecationId = _creatorThoughtSettingDeprecationId;
		_creatorThoughtSettingDeprecation.creatorThoughtId = _creatorThoughtId;
		_creatorThoughtSettingDeprecation.settingId = _settingId;

		return (_associatedThoughtSettingDeprecationId, _creatorThoughtSettingDeprecationId);
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
			_settingDeprecation.creatorThoughtId,
			_settingDeprecation.associatedThoughtId,
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
	 * @dev Get Associated Thought Setting Deprecation info
	 * @param _associatedThoughtSettingDeprecationId The ID of the associated thought setting deprecation
	 */
	function getAssociatedThoughtSettingDeprecation(bytes32 _associatedThoughtSettingDeprecationId) public view returns (bytes32, address, uint256) {
		AssociatedThoughtSettingDeprecation memory _associatedThoughtSettingDeprecation = associatedThoughtSettingDeprecations[_associatedThoughtSettingDeprecationId];
		return (
			_associatedThoughtSettingDeprecation.associatedThoughtSettingDeprecationId,
			_associatedThoughtSettingDeprecation.associatedThoughtId,
			_associatedThoughtSettingDeprecation.settingId
		);
	}

	/**
	 * @dev Get Creator Thought Setting Deprecation info
	 * @param _creatorThoughtSettingDeprecationId The ID of the creator thought setting deprecation
	 */
	function getCreatorThoughtSettingDeprecation(bytes32 _creatorThoughtSettingDeprecationId) public view returns (bytes32, address, uint256) {
		CreatorThoughtSettingDeprecation memory _creatorThoughtSettingDeprecation = creatorThoughtSettingDeprecations[_creatorThoughtSettingDeprecationId];
		return (
			_creatorThoughtSettingDeprecation.creatorThoughtSettingDeprecationId,
			_creatorThoughtSettingDeprecation.creatorThoughtId,
			_creatorThoughtSettingDeprecation.settingId
		);
	}

	/**
	 * @dev Advocate of SettingDeprecation's _associatedThoughtId approves deprecation
	 * @param _settingId The ID of the setting to approve
	 * @param _associatedThoughtAdvocate The advocate of the associated Thought
	 * @param _approved Whether to approve or reject
	 * @return true on success
	 */
	function approveDeprecation(uint256 _settingId, address _associatedThoughtAdvocate, bool _approved) public inWhitelist(msg.sender) returns (bool) {
		// Make sure setting exists and needs approval
		SettingDeprecation storage _settingDeprecation = settingDeprecations[_settingId];
		require (_settingDeprecation.settingId == _settingId && _settingDeprecation.migrated == false && _settingDeprecation.pendingDeprecated == true && _settingDeprecation.locked == true && _settingDeprecation.rejected == false && _associatedThoughtAdvocate != address(0) && _associatedThoughtAdvocate == Thought(_settingDeprecation.associatedThoughtId).advocateId());

		if (_approved) {
			// Unlock the setting so that advocate of creatorThoughtId can finalize the creation
			_settingDeprecation.locked = false;
		} else {
			// Reject the setting
			_settingDeprecation.pendingDeprecated = false;
			_settingDeprecation.rejected = true;
		}
		return true;
	}

	/**
	 * @dev Advocate of SettingDeprecation's _creatorThoughtId finalizes the deprecation once the setting deprecation is approved
	 * @param _settingId The ID of the setting to be finalized
	 * @param _creatorThoughtAdvocate The advocate of the creator Thought
	 * @return true on success
	 */
	function finalizeDeprecation(uint256 _settingId, address _creatorThoughtAdvocate) public inWhitelist(msg.sender) returns (bool) {
		// Make sure setting exists and needs approval
		SettingDeprecation storage _settingDeprecation = settingDeprecations[_settingId];
		require (_settingDeprecation.settingId == _settingId && _settingDeprecation.migrated == false && _settingDeprecation.pendingDeprecated == true && _settingDeprecation.locked == false && _settingDeprecation.rejected == false && _creatorThoughtAdvocate != address(0) && _creatorThoughtAdvocate == Thought(_settingDeprecation.creatorThoughtId).advocateId());

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

	/***** Internal Method *****/
	/**
	 * @dev Store setting data/state
	 * @param _settingId The ID of the setting
	 * @param _creatorNameId The nameId that created the setting
	 * @param _settingType The type of this setting. 1 => uint256, 2 => bool, 3 => address, 4 => bytes32, 5 => string
	 * @param _settingName The human-readable name of the setting
	 * @param _creatorThoughtId The thoughtId that created the setting
	 * @param _associatedThoughtId The thoughtId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 * @return true on success
	 */
	function _storeSettingDataState(uint256 _settingId, address _creatorNameId, uint8 _settingType, string _settingName, address _creatorThoughtId, address _associatedThoughtId, string _extraData) internal returns (bool) {
		// Store setting data
		SettingData storage _settingData = settingDatas[_settingId];
		_settingData.settingId = _settingId;
		_settingData.creatorNameId = _creatorNameId;
		_settingData.creatorThoughtId = _creatorThoughtId;
		_settingData.associatedThoughtId = _associatedThoughtId;
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
	 * @param _creatorThoughtId The thoughtId that created the setting
	 * @param _associatedThoughtId The thoughtId that the setting affects
	 * @param _newSettingId The new settingId value to route
	 * @param _newSettingContractAddress The address of the new setting contract to route
	 * @return true on success
	 */
	function _storeSettingDeprecation(uint256 _settingId, address _creatorNameId, address _creatorThoughtId, address _associatedThoughtId, uint256 _newSettingId, address _newSettingContractAddress) internal returns (bool) {
		// Make sure this setting exists
		require (settingDatas[_settingId].creatorNameId != address(0) && settingDatas[_settingId].rejected == false);

		// Make sure deprecation is not yet exist for this setting Id
		require (settingDeprecations[_settingId].creatorNameId == address(0));

		// Make sure newSettingId exists
		require (settingDatas[_newSettingId].creatorNameId != address(0) && settingDatas[_newSettingId].rejected == false);

		// Store setting deprecation info
		SettingDeprecation storage _settingDeprecation = settingDeprecations[_settingId];
		_settingDeprecation.settingId = _settingId;
		_settingDeprecation.creatorNameId = _creatorNameId;
		_settingDeprecation.creatorThoughtId = _creatorThoughtId;
		_settingDeprecation.associatedThoughtId = _associatedThoughtId;
		_settingDeprecation.pendingDeprecated = true;
		_settingDeprecation.locked = true;
		_settingDeprecation.pendingNewSettingId = _newSettingId;
		_settingDeprecation.pendingNewSettingContractAddress = _newSettingContractAddress;
		return true;
	}
}
