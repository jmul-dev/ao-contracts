pragma solidity >=0.5.4 <0.6.0;

import './SafeMath.sol';
import './AOLibrary.sol';
import './TheAO.sol';
import './INameFactory.sol';
import './Name.sol';
import './Voice.sol';
import './INameTAOLookup.sol';
import './INameTAOPosition.sol';
import './INamePublicKey.sol';
import './INameAccountRecovery.sol';
import './IAOSetting.sol';
import './Pathos.sol';
import './Ethos.sol';

/**
 * @title NameFactory
 *
 * The purpose of this contract is to allow node to create Name
 */
contract NameFactory is TheAO, INameFactory {
	using SafeMath for uint256;

	address public voiceAddress;
	address public nameTAOVaultAddress;
	address public nameTAOLookupAddress;
	address public namePublicKeyAddress;
	address public nameAccountRecoveryAddress;
	address public settingTAOId;
	address public aoSettingAddress;
	address public pathosAddress;
	address public ethosAddress;

	Voice internal _voice;
	INameTAOLookup internal _nameTAOLookup;
	INameTAOPosition internal _nameTAOPosition;
	INamePublicKey internal _namePublicKey;
	INameAccountRecovery internal _nameAccountRecovery;
	IAOSetting internal _aoSetting;
	Pathos internal _pathos;
	Ethos internal _ethos;

	address[] internal names;

	// Mapping from eth address to Name ID
	mapping (address => address) internal _ethAddressToNameId;

	// Mapping from Name ID to eth address
	mapping (address => address) internal _nameIdToEthAddress;

	// Mapping from Name ID to its nonce
	mapping (address => uint256) internal _nonces;

	// Event to be broadcasted to public when a Name is created
	event CreateName(address indexed ethAddress, address nameId, uint256 index, string name);

	/**
	 * @dev Constructor function
	 */
	constructor(address _voiceAddress) public {
		setVoiceAddress(_voiceAddress);
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
	 * @dev Checks if calling address can update Name's nonce
	 */
	modifier canUpdateNonce {
		require (msg.sender == nameTAOPositionAddress || msg.sender == namePublicKeyAddress || msg.sender == nameAccountRecoveryAddress);
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
	 * @dev The AO set the Voice Address
	 * @param _voiceAddress The address of Voice
	 */
	function setVoiceAddress(address _voiceAddress) public onlyTheAO {
		require (_voiceAddress != address(0));
		voiceAddress = _voiceAddress;
		_voice = Voice(voiceAddress);
	}

	/**
	 * @dev The AO set the NameTAOVault Address
	 * @param _nameTAOVaultAddress The address of NameTAOVault
	 */
	function setNameTAOVaultAddress(address _nameTAOVaultAddress) public onlyTheAO {
		require (_nameTAOVaultAddress != address(0));
		nameTAOVaultAddress = _nameTAOVaultAddress;
	}

	/**
	 * @dev The AO set the NameTAOLookup Address
	 * @param _nameTAOLookupAddress The address of NameTAOLookup
	 */
	function setNameTAOLookupAddress(address _nameTAOLookupAddress) public onlyTheAO {
		require (_nameTAOLookupAddress != address(0));
		nameTAOLookupAddress = _nameTAOLookupAddress;
		_nameTAOLookup = INameTAOLookup(nameTAOLookupAddress);
	}

	/**
	 * @dev The AO set the NameTAOPosition Address
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	function setNameTAOPositionAddress(address _nameTAOPositionAddress) public onlyTheAO {
		require (_nameTAOPositionAddress != address(0));
		nameTAOPositionAddress = _nameTAOPositionAddress;
		_nameTAOPosition = INameTAOPosition(nameTAOPositionAddress);
	}

	/**
	 * @dev The AO set the NamePublicKey Address
	 * @param _namePublicKeyAddress The address of NamePublicKey
	 */
	function setNamePublicKeyAddress(address _namePublicKeyAddress) public onlyTheAO {
		require (_namePublicKeyAddress != address(0));
		namePublicKeyAddress = _namePublicKeyAddress;
		_namePublicKey = INamePublicKey(namePublicKeyAddress);
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
	 * @dev The AO sets Pathos address
	 * @param _pathosAddress The address of Pathos
	 */
	function setPathosAddress(address _pathosAddress) public onlyTheAO {
		require (_pathosAddress != address(0));
		pathosAddress = _pathosAddress;
		_pathos = Pathos(_pathosAddress);
	}

	/**
	 * @dev The AO sets Ethos address
	 * @param _ethosAddress The address of Ethos
	 */
	function setEthosAddress(address _ethosAddress) public onlyTheAO {
		require (_ethosAddress != address(0));
		ethosAddress = _ethosAddress;
		_ethos = Ethos(_ethosAddress);
	}

	/**
	 * @dev NameAccountRecovery contract replaces eth address associated with a Name
	 * @param _id The ID of the Name
	 * @param _newAddress The new eth address
	 * @return true on success
	 */
	function setNameNewAddress(address _id, address _newAddress) external returns (bool) {
		require (msg.sender == nameAccountRecoveryAddress);
		require (AOLibrary.isName(_id));
		require (_newAddress != address(0));
		require (_ethAddressToNameId[_newAddress] == address(0));
		require (_nameIdToEthAddress[_id] != address(0));

		address _currentEthAddress = _nameIdToEthAddress[_id];
		_ethAddressToNameId[_currentEthAddress] = address(0);
		_ethAddressToNameId[_newAddress] = _id;
		_nameIdToEthAddress[_id] = _newAddress;
		return true;
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Get the nonce given a Name ID
	 * @param _nameId The Name ID to check
	 * @return The nonce of the Name
	 */
	function nonces(address _nameId) external view returns (uint256) {
		return _nonces[_nameId];
	}

	/**
	 * @dev Increment the nonce of a Name
	 * @param _nameId The ID of the Name
	 * @return current nonce
	 */
	function incrementNonce(address _nameId) external canUpdateNonce returns (uint256) {
		// Check if _nameId exist
		require (_nonces[_nameId] > 0);
		_nonces[_nameId]++;
		return _nonces[_nameId];
	}

	/**
	 * @dev Create a Name
	 * @param _name The name of the Name
	 * @param _datHash The datHash to this Name's profile
	 * @param _database The database for this Name
	 * @param _keyValue The key/value pair to be checked on the database
	 * @param _contentId The contentId related to this Name
	 * @param _writerKey The writer public key for this Name
	 */
	function createName(string memory _name, string memory _datHash, string memory _database, string memory _keyValue, bytes32 _contentId, address _writerKey) public {
		require (bytes(_name).length > 0);
		require (!_nameTAOLookup.isExist(_name));

		// Only one Name per ETH address
		require (_ethAddressToNameId[msg.sender] == address(0));

		// The address is the Name ID (which is also a TAO ID)
		address nameId = address(AOLibrary.deployName(_name, msg.sender, _datHash, _database, _keyValue, _contentId, nameTAOVaultAddress));

		// Only one ETH address per Name
		require (_nameIdToEthAddress[nameId] == address(0));

		// Increment the nonce
		_nonces[nameId]++;

		_ethAddressToNameId[msg.sender] = nameId;
		_nameIdToEthAddress[nameId] = msg.sender;

		// Store the name lookup information
		require (_nameTAOLookup.initialize(_name, nameId, 1, 'human', msg.sender, 2));

		// Store the Advocate/Listener/Speaker information
		require (_nameTAOPosition.initialize(nameId, nameId, nameId, nameId));

		// Store the public key information
		require (_namePublicKey.initialize(nameId, msg.sender, _writerKey));

		names.push(nameId);

		// Need to mint Voice for this Name
		require (_voice.mint(nameId));

		// Assign Pathos/Ethos to the Name if it's the primordial contributor name
		_initializeContributor(nameId, _name);

		emit CreateName(msg.sender, nameId, names.length.sub(1), _name);
	}

	/**
	 * @dev Get the Name ID given an ETH address
	 * @param _ethAddress The ETH address to check
	 * @return The Name ID
	 */
	function ethAddressToNameId(address _ethAddress) external view returns (address) {
		return _ethAddressToNameId[_ethAddress];
	}

	/**
	 * @dev Get the ETH address given a Name ID
	 * @param _nameId The Name ID to check
	 * @return The ETH address
	 */
	function nameIdToEthAddress(address _nameId) external view returns (address) {
		return _nameIdToEthAddress[_nameId];
	}

	/**
	 * @dev Get Name information
	 * @param _nameId The ID of the Name to be queried
	 * @return The name of the Name
	 * @return The originId of the Name (in this case, it's the creator node's ETH address)
	 * @return The datHash of the Name
	 * @return The database of the Name
	 * @return The keyValue of the Name
	 * @return The contentId of the Name
	 * @return The typeId of the Name
	 */
	function getName(address _nameId) public view returns (string memory, address, string memory, string memory, string memory, bytes32, uint8) {
		Name _name = Name(address(uint160(_nameId)));
		return (
			_name.name(),
			_name.originId(),
			_name.datHash(),
			_name.database(),
			_name.keyValue(),
			_name.contentId(),
			_name.typeId()
		);
	}

	/**
	 * @dev Get total Names count
	 * @return total Names count
	 */
	function getTotalNamesCount() public view returns (uint256) {
		return names.length;
	}

	/**
	 * @dev Get list of Name IDs
	 * @param _from The starting index
	 * @param _to The ending index
	 * @return list of Name IDs
	 */
	function getNameIds(uint256 _from, uint256 _to) public view returns (address[] memory) {
		require (_from >= 0 && _to >= _from);
		require (names.length > 0);

		address[] memory _names = new address[](_to.sub(_from).add(1));
		if (_to > names.length.sub(1)) {
			_to = names.length.sub(1);
		}
		for (uint256 i = _from; i <= _to; i++) {
			_names[i.sub(_from)] = names[i];
		}
		return _names;
	}

	/**
	 * @dev Check whether or not the signature is valid
	 * @param _data The signed string data
	 * @param _nonce The signed uint256 nonce (should be Name's current nonce + 1)
	 * @param _validateAddress The ETH address to be validated (optional)
	 * @param _name The name of the Name
	 * @param _signatureV The V part of the signature
	 * @param _signatureR The R part of the signature
	 * @param _signatureS The S part of the signature
	 * @return true if valid. false otherwise
	 */
	function validateNameSignature(
		string memory _data,
		uint256 _nonce,
		address _validateAddress,
		string memory _name,
		uint8 _signatureV,
		bytes32 _signatureR,
		bytes32 _signatureS
	) public view returns (bool) {
		require (_nameTAOLookup.isExist(_name));
		address _nameId = _nameTAOLookup.getIdByName(_name);
		address _signatureAddress = _getValidateSignatureAddress(_data, _nonce, _signatureV, _signatureR, _signatureS);
		if (_validateAddress != address(0)) {
			return (
				_nonce == _nonces[_nameId].add(1) &&
				_signatureAddress == _validateAddress &&
				_namePublicKey.isKeyExist(_nameId, _validateAddress)
			);
		} else {
			return (
				_nonce == _nonces[_nameId].add(1) &&
				_signatureAddress == _namePublicKey.getDefaultKey(_nameId)
			);
		}
	}

	/***** INTERNAL METHODS *****/
	/**
	 * @dev Return the address that signed the data and nonce when validating signature
	 * @param _data the data that was signed
	 * @param _nonce The signed uint256 nonce
	 * @param _v part of the signature
	 * @param _r part of the signature
	 * @param _s part of the signature
	 * @return the address that signed the message
	 */
	function _getValidateSignatureAddress(string memory _data, uint256 _nonce, uint8 _v, bytes32 _r, bytes32 _s) internal view returns (address) {
		bytes32 _hash = keccak256(abi.encodePacked(address(this), _data, _nonce));
		return ecrecover(_hash, _v, _r, _s);
	}

	/**
	 * @dev Assign primordial contributor with pathos/ethos
	 */
	function _initializeContributor(address _nameId, string memory _name) internal {
		if (settingTAOId != address(0)) {
			(,,,, string memory primordialContributorName) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'primordialContributorName');
			(uint256 primordialContributorPathos,,,,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'primordialContributorPathos');
			(uint256 primordialContributorEthos,,,,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'primordialContributorEthos');
			if (keccak256(abi.encodePacked(primordialContributorName)) == keccak256(abi.encodePacked(_name))) {
				_pathos.mint(_nameId, primordialContributorPathos);
				_ethos.mint(_nameId, primordialContributorEthos);
			}
		}
	}
}
