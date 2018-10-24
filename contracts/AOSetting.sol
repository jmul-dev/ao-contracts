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

	/***** Constant variables *****/
	// Total available primordial token for sale 1,125,899,906,842,620 AO+
	uint256 constant public TOTAL_PRIMORDIAL_FOR_SALE = 1125899906842620;
	uint256 constant public PERCENTAGE_DIVISOR = 10 ** 6; // 1000000 = 100%
	uint256 constant public MULTIPLIER_DIVISOR = 10 ** 6; // 1000000 = 1

	struct UintData {
		address nameId;		// The nameId who sets the key/value
		uint256 value;		// The uint256 value of the setting
		bool isSet;			// Indicates whether a key of a setting isset
		bool locked;		// If true, no one can update this setting until the TAO unlocks it
	}

	struct BoolData {
		address nameId;		// The nameId who sets the key/value
		bool value;			// The bool value of the setting
		bool isSet;			// Indicates whether a key of a setting isset
		bool locked;		// If true, no one can update this setting until the TAO unlocks it
	}

	// Mapping from bytes32 key to its UintData
	mapping(bytes32 => UintData) public uintSetting;

	// Mapping from bytes32 key to its BoolData
	mapping(bytes32 => BoolData) public boolSetting;

	// Event to be broadcasted to public when a uint setting is added
	// nameId is the ID of the Name that creates this transaction
	// thoughtId is the ID of the Thought that supports this transaction
	event AddUintSetting(address indexed nameId, bytes32 indexed key, uint256 value, address thoughtId);

	// Event to be broadcasted to public when a bool setting is added
	// nameId is the ID of the Name that creates this transaction
	// thoughtId is the ID of the Thought that supports this transaction
	event AddBoolSetting(address indexed nameId, bytes32 indexed key, bool value, address thoughtId);

	// Event to be broadcasted to public when a uint setting is updated
	// nameId is the ID of the Name that creates this transaction
	// thoughtId is the ID of the Thought that supports this transaction
	event UpdateUintSetting(address indexed nameId, bytes32 indexed key, uint256 value, address thoughtId);

	// Event to be broadcasted to public when a bool setting is updated
	// nameId is the ID of the Name that creates this transaction
	// thoughtId is the ID of the Thought that supports this transaction
	event UpdateBoolSetting(address indexed nameId, bytes32 indexed key, bool value, address thoughtId);

	// Event to be broadcasted to public when a uint setting's ownership is transferred
	// thoughtId is the ID of the Thought that supports this transaction
	event TransferUintSettingOwnership(bytes32 indexed key, address oldNameId, address newNameId, address thoughtId);

	// Event to be broadcasted to public when a bool setting's ownership is transferred
	// thoughtId is the ID of the Thought that supports this transaction
	event TransferBoolSettingOwnership(bytes32 indexed key, address oldNameId, address newNameId, address thoughtId);

	// Event to be broadcasted to public when a uint setting is unlocked
	// nameId is the ID of the Name that unlocks this setting
	// thoughtId is the ID of the Thought that supports this transaction
	event UnlockUintSetting(bytes32 indexed key, address nameId, address thoughtId);

	// Event to be broadcasted to public when a bool setting is unlocked
	// nameId is the ID of the Name that unlocks this setting
	// thoughtId is the ID of the Thought that supports this transaction
	event UnlockBoolSetting(bytes32 indexed key, address nameId, address thoughtId);

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress) public {
		nameFactoryAddress = _nameFactoryAddress;
		_nameFactory = NameFactory(nameFactoryAddress);
	}

	/***** Public Methods *****/
	/**
	 * @dev Adds uint256 setting
	 * @param _key The key to add
	 * @param _value The value of the setting
	 * @param _thoughtId The Thought ID that supports this transaction
	 */
	function addUintSetting(bytes32 _key, uint256 _value, address _thoughtId) public {
		UintData storage _data = uintSetting[_key];
		// Make sure this setting not yet exist
		require (_data.isSet == false && _data.nameId == address(0));

		/**
		 * TODO: Need to figure out how to validate the _thoughtId
		 *		 i.e, it is the one that prompts this transaction
		 *
		 * For now, check whether the Thought is closed and it is the `advocate` that
		 * adds this setting
		 */
		address _nameId = _nameFactory.ethAddressToNameId(msg.sender);
		require (_nameId != address(0) && Thought(_thoughtId).closed() == true && _nameId == Thought(_thoughtId).advocateId());

		// Store the setting data
		_data.nameId = _nameId;
		_data.value = _value;
		_data.isSet = true;
		_data.locked = true;
		emit AddUintSetting(_nameId, _key, _value, _thoughtId);
	}

	/**
	 * @dev Adds bool setting
	 * @param _key The key to add
	 * @param _value The value of the setting
	 * @param _thoughtId The Thought ID that supports this transaction
	 */
	function addBoolSetting(bytes32 _key, bool _value, address _thoughtId) public {
		BoolData storage _data = boolSetting[_key];
		// Make sure this setting not yet exist
		require (_data.isSet == false && _data.nameId == address(0));

		/**
		 * TODO: Need to figure out how to validate the _thoughtId
		 *		 i.e, it is the one that prompts this transaction
		 *
		 * For now, check whether the Thought is closed and it is the `advocate` that
		 * adds this setting
		 */
		address _nameId = _nameFactory.ethAddressToNameId(msg.sender);
		require (_nameId != address(0) && Thought(_thoughtId).closed() == true && _nameId == Thought(_thoughtId).advocateId());

		// Store the setting data
		_data.nameId = _nameId;
		_data.value = _value;
		_data.isSet = true;
		_data.locked = true;
		emit AddBoolSetting(_nameId, _key, _value, _thoughtId);
	}

	/**
	 * @dev Updates existing uint256 setting
	 * @param _key The key to update
	 * @param _value The new value of the setting
	 * @param _thoughtId The Thought ID that supports this transaction
	 */
	function updateUintSetting(bytes32 _key, uint256 _value, address _thoughtId) public {
		UintData storage _data = uintSetting[_key];
		// Make sure this setting can be updated
		require (_data.isSet == true && _data.locked == false);

		/**
		 * TODO: Need to figure out how to validate the _thoughtId
		 *		 i.e, it is the one that prompts this transaction
		 *
		 * For now, check whether the Thought is closed and it is the `advocate` that
		 * updates this setting
		 */
		address _nameId = _nameFactory.ethAddressToNameId(msg.sender);
		require (_nameId != address(0) && _data.nameId == _nameId && Thought(_thoughtId).closed() == true && _nameId == Thought(_thoughtId).advocateId());

		// Update the setting data
		_data.value = _value;
		_data.locked = true;
		emit UpdateUintSetting(msg.sender, _key, _value, _thoughtId);
	}

	/**
	 * @dev Updates existing bool setting
	 * @param _key The key to update
	 * @param _value The new value of the setting
	 * @param _thoughtId The Thought ID that supports this transaction
	 */
	function updateBoolSetting(bytes32 _key, bool _value, address _thoughtId) public {
		BoolData storage _data = boolSetting[_key];
		// Make sure this setting can be updated
		require (_data.isSet == true && _data.locked == false);

		/**
		 * TODO: Need to figure out how to validate the _thoughtId
		 *		 i.e, it is the one that prompts this transaction
		 *
		 * For now, check whether the Thought is closed and it is the `advocate` that
		 * updates this setting
		 */
		address _nameId = _nameFactory.ethAddressToNameId(msg.sender);
		require (_nameId != address(0) && _data.nameId == _nameId && Thought(_thoughtId).closed() == true && _nameId == Thought(_thoughtId).advocateId());

		// Update the setting data
		_data.value = _value;
		_data.locked = true;
		emit UpdateBoolSetting(msg.sender, _key, _value, _thoughtId);
	}

	/**
	 * @dev Transfer ownership of existing uintSetting
	 * @param _key The key to update
	 * @param _newNameId The new nameId
	 * @param _thoughtId The Thought ID that supports this transaction
	 */
	function transferUintSettingOwnership(bytes32 _key, address _newNameId, address _thoughtId) public {
		UintData storage _data = uintSetting[_key];
		// Make sure this setting exist
		require (_data.isSet == true);

		// Make sure the new _newNameId is a Name
		require (Name(_newNameId).originNameId() != address(0) && Name(_newNameId).thoughtTypeId() == 1);

		/**
		 * TODO: Need to figure out how to validate the _thoughtId
		 *		 i.e, it is the one that prompts this transaction
		 *
		 * For now, check whether the Thought is closed and it is the `advocate` that
		 * triggers this transfer of ownership
		 */
		address _oldNameId = _nameFactory.ethAddressToNameId(msg.sender);
		require (_oldNameId != address(0) && _data.nameId == _oldNameId && Thought(_thoughtId).closed() == true && _oldNameId == Thought(_thoughtId).advocateId());

		// Update the nameId
		_data.nameId = _newNameId;
		emit TransferUintSettingOwnership(_key, _oldNameId, _newNameId, _thoughtId);
	}

	/**
	 * @dev Transfer ownership of existing boolSetting
	 * @param _key The key to update
	 * @param _newNameId The new nameId
	 * @param _thoughtId The Thought ID that supports this transaction
	 */
	function transferBoolSettingOwnership(bytes32 _key, address _newNameId, address _thoughtId) public {
		BoolData storage _data = boolSetting[_key];
		// Make sure this setting exist
		require (_data.isSet == true);

		// Make sure the new _newNameId is a Name
		require (Name(_newNameId).originNameId() != address(0) && Name(_newNameId).thoughtTypeId() == 1);

		/**
		 * TODO: Need to figure out how to validate the _thoughtId
		 *		 i.e, it is the one that prompts this transaction
		 *
		 * For now, check whether the Thought is closed and it is the `advocate` that
		 * triggers this transfer of ownership
		 */
		address _oldNameId = _nameFactory.ethAddressToNameId(msg.sender);
		require (_oldNameId != address(0) && _data.nameId == _oldNameId && Thought(_thoughtId).closed() == true && _oldNameId == Thought(_thoughtId).advocateId());

		// Update the nameId
		_data.nameId = _newNameId;
		emit TransferBoolSettingOwnership(_key, _oldNameId, _newNameId, _thoughtId);
	}

	/**
	 * @dev Unlock uintSetting key so that the nameId can update the value
	 * @param _key The key to unlock
	 * @param _thoughtId The Thought ID that supports this transaction
	 */
	function unlockUintSetting(bytes32 _key, address _thoughtId) public {
		UintData storage _data = uintSetting[_key];
		// Make sure this setting exist
		require (_data.isSet == true && _data.locked == true);

		/**
		 * TODO: Need to figure out how to validate the _thoughtId
		 *		 i.e, it is the one that prompts this transaction
		 *
		 * For now, check whether the Thought is closed and it is the `advocate` that
		 * triggers unlock
		 */
		address _nameId = _nameFactory.ethAddressToNameId(msg.sender);
		require (_nameId != address(0) && _data.nameId == _nameId && Thought(_thoughtId).closed() == true && _nameId == Thought(_thoughtId).advocateId());

		// Unlock the setting
		_data.locked = false;
		emit UnlockUintSetting(_key, _nameId, _thoughtId);
	}

	/**
	 * @dev Unlock boolSetting key so that the nameId can update the value
	 * @param _key The key to unlock
	 * @param _thoughtId The Thought ID that supports this transaction
	 */
	function unlockBoolSetting(bytes32 _key, address _thoughtId) public {
		BoolData storage _data = boolSetting[_key];
		// Make sure this setting exist
		require (_data.isSet == true && _data.locked == true);

		/**
		 * TODO: Need to figure out how to validate the _thoughtId
		 *		 i.e, it is the one that prompts this transaction
		 *
		 * For now, check whether the Thought is closed and it is the `advocate` that
		 * triggers unlock
		 */
		address _nameId = _nameFactory.ethAddressToNameId(msg.sender);
		require (_nameId != address(0) && _data.nameId == _nameId && Thought(_thoughtId).closed() == true && _nameId == Thought(_thoughtId).advocateId());

		// Unlock the setting
		_data.locked = false;
		emit UnlockBoolSetting(_key, _nameId, _thoughtId);
	}
}
