pragma solidity ^0.4.24;

import "./developed.sol";
import './Thought.sol';

/**
 * @title AOSettingDataState
 *
 * This contract stores all AO setting data/state
 */
contract AOSettingDataState is developed {
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
		/**
		 * 0 => no deprecation
		 * 1 => marks if this setting is deprecated and re-routed
		 * 2 => marks if the deprecation status is pending
		 */
		uint8 deprecationStatus;

		// holds the new settingId that either is pending or replaced once the deprecation is set
		uint256 newSettingId;

		/**
		 * 0 => no migration to new contract address
		 * 1 => marks if this setting is migrated to an entirely new address
		 * 2 => marks if the migration status is pending
		 */
		uint8 migrationStatus;

		// holds the new contract address for this setting
		address newSettingContractAddress;
	}

	// Mapping from settingId to it's data
	mapping (uint256 => SettingData) internal settingDatas;

	// Mapping from settingId to it's state
	mapping (uint256 => SettingState) public settingStates;

	// Mapping from settingId to it's deprecation info
	mapping (uint256 => SettingDeprecation) public settingDeprecations;

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
	 */
	function add(uint256 _settingId, address _creatorNameId, uint8 _settingType, string _settingName, address _creatorThoughtId, address _associatedThoughtId, string _extraData) public {
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
	 * @dev Advocate of Setting's _associatedThoughtId approves setting creation
	 * @param _settingId The ID of the setting to approve
	 * @param _associatedThoughtAdvocate The advocate of the associated Thought
	 * @param _approved Whether to approve or reject
	 * @return true on success
	 */
	function approveAdd(uint256 _settingId, address _associatedThoughtAdvocate, bool _approved) public returns (bool) {
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
	function finalizeAdd(uint256 _settingId, address _creatorThoughtAdvocate) public returns (bool) {
		// Make sure setting exists and needs approval
		SettingData storage _settingData = settingDatas[_settingId];
		require (_settingData.settingId == _settingId && _settingData.pendingCreate == true && _settingData.locked == false && _settingData.rejected == false && _creatorThoughtAdvocate != address(0) && _creatorThoughtAdvocate == Thought(_settingData.creatorThoughtId).advocateId());

		// Update the setting data
		_settingData.pendingCreate = false;
		_settingData.locked = true;

		return true;
	}

	/**
	 * @dev Check if sender can update settingId
	 * @param _settingId The ID of the setting
	 * @param _associatedThoughtAdvocate The Advocate of the associated Thought
	 * @return true if yes, false otherwise
	 */
	function canUpdateSetting(uint256 _settingId, address _associatedThoughtAdvocate) public view returns (bool) {
		// Make sure setting is created
		SettingData memory _settingData = settingDatas[_settingId];
		return (_settingData.settingId == _settingId && _settingData.pendingCreate == false && _settingData.locked == true && _settingData.rejected == false && _associatedThoughtAdvocate != address(0) && _associatedThoughtAdvocate == Thought(_settingData.associatedThoughtId).advocateId());
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
	function update(uint256 _settingId, address _associatedThoughtAdvocate, address _proposalThoughtId, string _updateSignature, string _extraData) public returns (bool) {
		// Make sure setting is not in the middle of updating
		SettingState storage _settingState = settingStates[_settingId];
		require (_settingState.pendingUpdate == false);

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
	function approveUpdate(uint256 _settingId, address _proposalThoughtAdvocate, bool _approved) public returns (bool) {
		// Make sure setting is created
		SettingData storage _settingData = settingDatas[_settingId];
		require (_settingData.settingId == _settingId && _settingData.pendingCreate == false && _settingData.locked == true && _settingData.rejected == false);

		// Make sure setting update exists and needs approval
		SettingState memory _settingState = settingStates[_settingId];
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
	function finalizeUpdate(uint256 _settingId, address _associatedThoughtAdvocate) public returns (bool) {
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

}
