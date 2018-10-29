pragma solidity ^0.4.24;

import './Thought.sol';
import './Name.sol';
import './NameFactory.sol';

/**
 * @title AOSetting
 *
 * This contract stores all AO setting variables
 */
contract AOSetting {
	address public nameFactoryAddress;
	NameFactory internal _nameFactory;

	uint256 public totalSetting;

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
		 * The has of the update data (proposalThoughtId, values, newValues, data, settingId)
		 */
		bytes32 updateHashKey;

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

	// Mapping from settingId to it's data
	mapping (uint256 => SettingData) public settingDatas;

	// Mapping from settingId to it's state
	mapping (uint256 => SettingState) public settingStates;

	// Mapping from settingId to it's deprecation info
	mapping (uint256 => SettingDeprecation) public settingDeprecations;

	// Mapping from settingId to it's actual uint256 value
	mapping (uint256 => uint256) public settingUintValue;

	// Mapping from settingId to it's actual bool value
	mapping (uint256 => bool) public settingBoolValue;

	// Mapping from settingId to it's actual address value
	mapping (uint256 => address) public settingAddressValue;

	// Mapping from settingId to it's actual bytes32 value
	mapping (uint256 => bytes32) public settingBytesValue;

	// Mapping from settingId to it's actual string value
	mapping (uint256 => string) public settingStringValue;

	// Mapping from settingId to it's potential uint256 value that is at pending state
	mapping (uint256 => uint256) public pendingSettingUintValue;

	// Mapping from settingId to it's potential bool value that is at pending state
	mapping (uint256 => bool) public pendingSettingBoolValue;

	// Mapping from settingId to it's potential address value that is at pending state
	mapping (uint256 => address) public pendingSettingAddressValue;

	// Mapping from settingId to it's potential bytes32 value that is at pending state
	mapping (uint256 => bytes32) public pendingSettingBytesValue;

	// Mapping from settingId to it's potential string value that is at pending state
	mapping (uint256 => string) public pendingSettingStringValue;

	// Mapping from associatedThoughtSettingId to AssociatedThoughtSetting
	mapping (bytes32 => AssociatedThoughtSetting) public associatedThoughtSettings;

	// Mapping from creatorThoughtSettingId to CreatorThoughtSetting
	mapping (bytes32 => CreatorThoughtSetting) public creatorThoughtSettings;

	/**
	 * Mapping from associatedThoughtId's setting name to Setting ID.
	 *
	 * Instead of concatenating the associatedThoughtID and setting name to create a unique ID for lookup,
	 * use nested mapping to achieve the same result.
	 *
	 * The setting's name needs to be converted to bytes32 since solidity does not support mapping by string.
	 */
	mapping (address => mapping (bytes32 => uint256)) public nameSettingLookup;

	// Mapping from updateHashKey to it's settingId
	mapping (bytes32 => uint256) public updateHashLookup;

	// Event to be broadcasted to public when pending setting is created
	event PendingSettingCreation(uint256 indexed settingId, address indexed creatorNameId, address creatorThoughtId, address associatedThoughtId, string settingName, uint8 settingType, bytes32 associatedThoughtSettingId, bytes32 creatorThoughtSettingId);

	// Event to be broadcasted to public when pending setting is approved
	event ApprovePendingSettingCreation(uint256 indexed settingId, address associatedThoughtAdvocate);

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress) public {
		nameFactoryAddress = _nameFactoryAddress;
		_nameFactory = NameFactory(nameFactoryAddress);
	}

	/**
	 * @dev Check if `_thoughtId` is a Thought
	 */
	modifier isThought(address _thoughtId) {
		require (Thought(_thoughtId).originNameId() != address(0) && Thought(_thoughtId).thoughtTypeId() == 0);
		_;
	}

	/**
	 * @dev Check if `_settingName` of `_associatedThoughtId` is taken
	 */
	modifier settingNameNotTaken(string _settingName, address _associatedThoughtId) {
		require (isSettingNameTaken(_settingName, _associatedThoughtId) == false);
		_;
	}

	/***** Public Methods *****/
	/**
	 * @dev Check whether or not a setting name of an associatedThoughtId is taken
	 * @param _settingName The human-readable name of the setting
	 * @param _associatedThoughtId The thoughtId that the setting affects
	 * @return true if taken. false otherwise
	 */
	function isSettingNameTaken(string _settingName, address _associatedThoughtId) public view returns (bool) {
		return (nameSettingLookup[_associatedThoughtId][keccak256(abi.encodePacked(this, _settingName))] == 0);
	}

	/**
	 * @dev Advocate of _creatorThoughtId adds a uint setting
	 * @param _settingName The human-readable name of the setting
	 * @param _value The uint256 value of the setting
	 * @param _creatorThoughtId The thoughtId that created the setting
	 * @param _associatedThoughtId The thoughtId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function addUintSetting(string _settingName, uint256 _value, address _creatorThoughtId, address _associatedThoughtId, string _extraData) public isThought(_creatorThoughtId) isThought(_associatedThoughtId) settingNameNotTaken(_settingName, _associatedThoughtId) {
		// Make sure msg.sender is the Advocate of _creatorThoughtId
		address _creatorNameId = _nameFactory.ethAddressToNameId(msg.sender);
		require (_creatorNameId != 0 && _creatorNameId == Thought(_creatorThoughtId).advocateId());

		// Update global variables
		totalSetting++;

		// Store the value as pending value
		pendingSettingUintValue[totalSetting] = _value;

		// Store pending setting creation data
		_storePendingSettingCreation(_creatorNameId, 1, _settingName, _creatorThoughtId, _associatedThoughtId, _extraData);
	}

	/**
	 * @dev Advocate of _creatorThoughtId adds a bool setting
	 * @param _settingName The human-readable name of the setting
	 * @param _value The bool value of the setting
	 * @param _creatorThoughtId The thoughtId that created the setting
	 * @param _associatedThoughtId The thoughtId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function addBoolSetting(string _settingName, bool _value, address _creatorThoughtId, address _associatedThoughtId, string _extraData) public isThought(_creatorThoughtId) isThought(_associatedThoughtId) settingNameNotTaken(_settingName, _associatedThoughtId) {
		// Make sure msg.sender is the Advocate of _creatorThoughtId
		address _creatorNameId = _nameFactory.ethAddressToNameId(msg.sender);
		require (_creatorNameId != 0 && _creatorNameId == Thought(_creatorThoughtId).advocateId());

		// Update global variables
		totalSetting++;

		// Store the value as pending value
		pendingSettingBoolValue[totalSetting] = _value;

		// Store pending setting creation data
		_storePendingSettingCreation(_creatorNameId, 2, _settingName, _creatorThoughtId, _associatedThoughtId, _extraData);
	}

	/**
	 * @dev Advocate of _creatorThoughtId adds an address setting
	 * @param _settingName The human-readable name of the setting
	 * @param _value The address value of the setting
	 * @param _creatorThoughtId The thoughtId that created the setting
	 * @param _associatedThoughtId The thoughtId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function addAddressSetting(string _settingName, address _value, address _creatorThoughtId, address _associatedThoughtId, string _extraData) public isThought(_creatorThoughtId) isThought(_associatedThoughtId) settingNameNotTaken(_settingName, _associatedThoughtId) {
		// Make sure msg.sender is the Advocate of _creatorThoughtId
		address _creatorNameId = _nameFactory.ethAddressToNameId(msg.sender);
		require (_creatorNameId != 0 && _creatorNameId == Thought(_creatorThoughtId).advocateId());

		// Update global variables
		totalSetting++;

		// Store the value as pending value
		pendingSettingAddressValue[totalSetting] = _value;

		// Store pending setting creation data
		_storePendingSettingCreation(_creatorNameId, 3, _settingName, _creatorThoughtId, _associatedThoughtId, _extraData);
	}

	/**
	 * @dev Advocate of _creatorThoughtId adds a bytes32 setting
	 * @param _settingName The human-readable name of the setting
	 * @param _value The bytes32 value of the setting
	 * @param _creatorThoughtId The thoughtId that created the setting
	 * @param _associatedThoughtId The thoughtId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function addBytesSetting(string _settingName, bytes32 _value, address _creatorThoughtId, address _associatedThoughtId, string _extraData) public isThought(_creatorThoughtId) isThought(_associatedThoughtId) settingNameNotTaken(_settingName, _associatedThoughtId) {
		// Make sure msg.sender is the Advocate of _creatorThoughtId
		address _creatorNameId = _nameFactory.ethAddressToNameId(msg.sender);
		require (_creatorNameId != 0 && _creatorNameId == Thought(_creatorThoughtId).advocateId());

		// Update global variables
		totalSetting++;

		// Store the value as pending value
		pendingSettingBytesValue[totalSetting] = _value;

		// Store pending setting creation data
		_storePendingSettingCreation(_creatorNameId, 4, _settingName, _creatorThoughtId, _associatedThoughtId, _extraData);
	}

	/**
	 * @dev Advocate of _creatorThoughtId adds a string setting
	 * @param _settingName The human-readable name of the setting
	 * @param _value The string value of the setting
	 * @param _creatorThoughtId The thoughtId that created the setting
	 * @param _associatedThoughtId The thoughtId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function addStringSetting(string _settingName, string _value, address _creatorThoughtId, address _associatedThoughtId, string _extraData) public isThought(_creatorThoughtId) isThought(_associatedThoughtId) settingNameNotTaken(_settingName, _associatedThoughtId) {
		// Make sure msg.sender is the Advocate of _creatorThoughtId
		address _creatorNameId = _nameFactory.ethAddressToNameId(msg.sender);
		require (_creatorNameId != 0 && _creatorNameId == Thought(_creatorThoughtId).advocateId());

		// Update global variables
		totalSetting++;

		// Store the value as pending value
		pendingSettingStringValue[totalSetting] = _value;

		// Store pending setting creation data
		_storePendingSettingCreation(_creatorNameId, 5, _settingName, _creatorThoughtId, _associatedThoughtId, _extraData);
	}

	/**
	 * @dev Advocate of SettingData's _associatedThoughtId approves pending setting creation
	 * @param _settingId The ID of the setting to approve
	 */
	function approvePendingSettingCreation(uint256 _settingId) public {
		// Make sure setting exists and needs approval
		SettingData storage _settingData = settingDatas[_settingId];
		address _associatedThoughtAdvocate = _nameFactory.ethAddressToNameId(msg.sender);
		require (_settingData.settingId == _settingId && _settingData.pendingCreate == true && _associatedThoughtAdvocate != address(0) && _associatedThoughtAdvocate == Thought(_settingData.associatedThoughtId).advocateId());

		// Mark setting as approved
		_settingData.pendingCreate = false;

		// If settingType == uint256
		if (_settingData.settingType == 1) {
			uint256 _uintValue = pendingSettingUintValue[_settingData.settingId];
			pendingSettingUintValue[_settingData.settingId] = 0;
			settingUintValue[_settingData.settingId] = _uintValue;
		} else if (_settingData.settingType == 2) {
			// Else if settingType == bool
			bool _boolValue = pendingSettingBoolValue[_settingData.settingId];
			pendingSettingBoolValue[_settingData.settingId] = false;
			settingBoolValue[_settingData.settingId] = _boolValue;
		} else if (_settingData.settingType == 3) {
			// Else if settingType == address
			address _addressValue = pendingSettingAddressValue[_settingData.settingId];
			pendingSettingAddressValue[_settingData.settingId] = address(0);
			settingAddressValue[_settingData.settingId] = _addressValue;
		} else if (_settingData.settingType == 4) {
			// Else if settingType == bytes32
			bytes32 _bytesValue = pendingSettingBytesValue[_settingData.settingId];
			pendingSettingBytesValue[_settingData.settingId] = '';
			settingBytesValue[_settingData.settingId] = _bytesValue;
		} else {
			// Else if settingType == string
			string memory _stringValue = pendingSettingStringValue[_settingData.settingId];
			pendingSettingStringValue[_settingData.settingId] = '';
			settingStringValue[_settingData.settingId] = _stringValue;
		}

		emit ApprovePendingSettingCreation(_settingData.settingId, _associatedThoughtAdvocate);
	}

	/***** Internal Method *****/
	/**
	 * @dev Store the pending setting creation data
	 * @param _creatorNameId The nameId that created the setting
	 * @param _settingType The type of this setting. 1 => uint256, 2 => bool, 3 => address, 4 => bytes32, 5 => string
	 * @param _settingName The human-readable name of the setting
	 * @param _creatorThoughtId The thoughtId that created the setting
	 * @param _associatedThoughtId The thoughtId that the setting affects
	 * @param _extraData Catch-all string value to be stored if exist
	 */
	function _storePendingSettingCreation(address _creatorNameId, uint8 _settingType, string _settingName, address _creatorThoughtId, address _associatedThoughtId, string _extraData) internal {
		// Make sure _settingType is in supported list
		require (_settingType >= 1 && _settingType <= 5);

		// Update nameSettingLookup
		nameSettingLookup[_associatedThoughtId][keccak256(abi.encodePacked(this, _settingName))] = totalSetting;

		// Store setting data
		SettingData storage _settingData = settingDatas[totalSetting];
		_settingData.settingId = totalSetting;
		_settingData.creatorNameId = _creatorNameId;
		_settingData.creatorThoughtId = _creatorThoughtId;
		_settingData.associatedThoughtId = _associatedThoughtId;
		_settingData.settingName = _settingName;
		_settingData.settingType = _settingType;
		_settingData.pendingCreate = true;
		_settingData.locked = true;
		_settingData.settingDataJSON = _extraData;

		// Store the associatedThoughtSetting info
		bytes32 _associatedThoughtSettingId = keccak256(abi.encodePacked(this, _associatedThoughtId, totalSetting));
		AssociatedThoughtSetting storage _associatedThoughtSetting = associatedThoughtSettings[_associatedThoughtSettingId];
		_associatedThoughtSetting.associatedThoughtSettingId = _associatedThoughtSettingId;
		_associatedThoughtSetting.associatedThoughtId = _associatedThoughtId;
		_associatedThoughtSetting.settingId = totalSetting;

		// Store the creatorThoughtSetting info
		bytes32 _creatorThoughtSettingId = keccak256(abi.encodePacked(this, _creatorThoughtId, totalSetting));
		CreatorThoughtSetting storage _creatorThoughtSetting = creatorThoughtSettings[_creatorThoughtSettingId];
		_creatorThoughtSetting.creatorThoughtSettingId = _creatorThoughtSettingId;
		_creatorThoughtSetting.creatorThoughtId = _creatorThoughtId;
		_creatorThoughtSetting.settingId = totalSetting;

		emit PendingSettingCreation(_settingData.settingId, _settingData.creatorNameId, _settingData.creatorThoughtId, _settingData.associatedThoughtId, _settingData.settingName, _settingData.settingType, _associatedThoughtSettingId, _creatorThoughtSettingId);
	}
}
