pragma solidity ^0.5.4;

import './SafeMath.sol';
import './AOLibrary.sol';
import './TheAO.sol';
import './INameAccountRecovery.sol';
import './INameFactory.sol';
import './INameTAOPosition.sol';
import './INamePublicKey.sol';
import './IAOSetting.sol';

/**
 * @title NameAccountRecovery
 */
contract NameAccountRecovery is TheAO {
	using SafeMath for uint256;

	address public settingTAOId;
	address public nameFactoryAddress;
	address public nameTAOPositionAddress;
	address public namePublicKeyAddress;
	address public aoSettingAddress;

	INameFactory internal _nameFactory;
	INameTAOPosition internal _nameTAOPosition;
	INamePublicKey internal _namePublicKey;
	IAOSetting internal _aoSetting;

	struct AccountRecovery {
		// If submitted, then Name is locked until lockedUntilTimestamp
		// and if no action is taken by the Speaker, then the current
		// eth address associated with the Name can resume operation
		bool submitted;
		uint256 submittedTimestamp;		// Timestamp when this account recovery is submitted
		uint256 lockedUntilTimestamp;	// The deadline for the current Speaker of Name to respond and replace the new eth address
	}

	mapping (address => AccountRecovery) internal accountRecoveries;

	// Event to be broadcasted to public when current Listener of Name submitted account recovery for a Name
	event SubmitAccountRecovery(address indexed nameId, address listenerId, bool compromised, uint256 submittedTimestamp, uint256 lockedUntilTimestamp, uint256 nonce);

	// Event to be broadcasted to public when current Speaker of Name set new ETH Address for a Name
	event SetNameNewAddress(address indexed nameId, address speakerId, address newAddress, uint256 timestamp, uint256 nonce);

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress, address _nameTAOPositionAddress) public {
		setNameFactoryAddress(_nameFactoryAddress);
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

	/**
	 * @dev Check if calling address is Factory
	 */
	modifier onlyFactory {
		require (msg.sender == nameFactoryAddress);
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
	 * @dev Check if `_nameId` is a Name
	 */
	modifier isName(address _nameId) {
		require (AOLibrary.isName(_nameId));
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
	 * @dev The AO set the NameTAOPosition Address
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	function setNameTAOPositionAddress(address _nameTAOPositionAddress) public onlyTheAO {
		require (_nameTAOPositionAddress != address(0));
		nameTAOPositionAddress = _nameTAOPositionAddress;
		_nameTAOPosition = INameTAOPosition(_nameTAOPositionAddress);
	}

	/**
	 * @dev The AO set the NamePublicKey Address
	 * @param _namePublicKeyAddress The address of NamePublicKey
	 */
	function setNamePublicKeyAddress(address _namePublicKeyAddress) public onlyTheAO {
		require (_namePublicKeyAddress != address(0));
		namePublicKeyAddress = _namePublicKeyAddress;
		_namePublicKey = INamePublicKey(_namePublicKeyAddress);
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

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Get AccountRecovery information given a Name ID
	 * @param _id The ID of the Name
	 * @return the submit status of the account recovery
	 * @return submittedTimestamp - Timestamp when this account recovery is submitted
	 * @return lockedUntilTimestamp - The deadline for the current Speaker of Name to respond and replace the new eth address
	 */
	function getAccountRecovery(address _id) public isName(_id) view returns (bool, uint256, uint256) {
		AccountRecovery memory _accountRecovery = accountRecoveries[_id];
		return (
			_accountRecovery.submitted,
			_accountRecovery.submittedTimestamp,
			_accountRecovery.lockedUntilTimestamp
		);
	}

	/**
	 * @dev Listener of Name submits an account recovery for the Name
	 * @param _id The ID of the Name
	 */
	function submitAccountRecovery(address _id) public isName(_id) senderIsName {
		require (_nameTAOPosition.senderIsListener(msg.sender, _id));

		// Can't submit account recovery for itself
		require (!_nameTAOPosition.senderIsAdvocate(msg.sender, _id));

		// Make sure Listener is not currenty compromised
		require (!this.isCompromised(_nameFactory.ethAddressToNameId(msg.sender)));

		AccountRecovery storage _accountRecovery = accountRecoveries[_id];

		// Make sure currently it's not currently locked
		require (now > _accountRecovery.lockedUntilTimestamp);

		_accountRecovery.submitted = true;
		_accountRecovery.submittedTimestamp = now;
		_accountRecovery.lockedUntilTimestamp = _accountRecovery.submittedTimestamp.add(_getAccountRecoveryLockDuration());

		uint256 _nonce = _nameFactory.incrementNonce(_id);
		require (_nonce > 0);

		emit SubmitAccountRecovery(_id, _nameFactory.ethAddressToNameId(msg.sender), true, _accountRecovery.submittedTimestamp, _accountRecovery.lockedUntilTimestamp, _nonce);
	}

	/**
	 * @dev Check whether or not current Name is compromised,
	 *		i.e an account recovery has been submitted and waiting for
	 *		action from Speaker
	 * @param _id The ID of the Name
	 * @return true if yes. false otherwise
	 */
	function isCompromised(address _id) external isName(_id) view returns (bool) {
		AccountRecovery memory _accountRecovery = accountRecoveries[_id];
		return (_accountRecovery.submitted && now <= _accountRecovery.lockedUntilTimestamp);
	}

	/**
	 * @dev Speaker of Name respond to AccountRecovery and submits a new eth address for Name
	 * @param _id The ID of the Name
	 * @param _newAddress The new replacement eth address
	 */
	function setNameNewAddress(address _id, address _newAddress) public isName(_id) senderIsName {
		require (_newAddress != address(0));

		// Only Speaker can do this action
		require (_nameTAOPosition.senderIsSpeaker(msg.sender, _id));

		// Make sure Speaker is not currenty compromised
		require (!this.isCompromised(_nameFactory.ethAddressToNameId(msg.sender)));

		// Make sure this Name is currently compromised and needs action
		require (this.isCompromised(_id));

		// Make sure the newAddress is not yet assigned to a Name
		require (_nameFactory.ethAddressToNameId(_newAddress) == address(0));

		AccountRecovery storage _accountRecovery = accountRecoveries[_id];
		_accountRecovery.submitted = false;
		_accountRecovery.submittedTimestamp = 0;
		_accountRecovery.lockedUntilTimestamp = 0;

		// Replace the existing eth address with new address
		require (_nameFactory.setNameNewAddress(_id, _newAddress));

		// Add this _newAddress to Name's publicKey if needed
		if (!_namePublicKey.isKeyExist(_id, _newAddress)) {
			require (_namePublicKey.whitelistAddKey(_id, _newAddress));
		}

		uint256 _nonce = _nameFactory.incrementNonce(_id);
		require (_nonce > 0);

		emit SetNameNewAddress(_id, _nameFactory.ethAddressToNameId(msg.sender), _newAddress, now, 1);
	}

	/***** INTERNAL METHOD *****/
	/**
	 * @dev Get accountRecoveryLockDuration setting
	 * @return accountRecoveryLockDuration = The amount of time for current Speaker of Name to response and replace the eth address associated with the Name
	 */
	function _getAccountRecoveryLockDuration() internal view returns (uint256) {
		(uint256 accountRecoveryLockDuration,,,,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'accountRecoveryLockDuration');
		return accountRecoveryLockDuration;
	}
}
