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
		string settingDataJSON;			// Catch-all
	}

	struct SettingState {
		uint256 settingId;				// Identifier of this setting
		bool pendingAdvocateCreate;		// State when associatedThoughtId has not accepted setting
		bool pendingUpdateThought;		// State when setting is in process of being updated
		bool locked;					// State when pending anything (cannot change if locked)
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
		 * Advocate's Name's Address.
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

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress) public {
		nameFactoryAddress = _nameFactoryAddress;
		_nameFactory = NameFactory(nameFactoryAddress);
	}
}
