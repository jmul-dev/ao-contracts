pragma solidity ^0.5.4;

import './TheAO.sol';
import './AOLibrary.sol';
import './INameTAOLookup.sol';

/**
 * @title NameTAOLookup
 *
 */
contract NameTAOLookup is TheAO, INameTAOLookup {
	address public nameFactoryAddress;
	address public taoFactoryAddress;

	struct NameTAOInfo {
		string name;
		address nameTAOId;
		uint256 typeId; // 0 = TAO. 1 = Name
		string parentName;
		address parentId; // Can be a Name ID/TAO ID/ETH address
		uint256 parentTypeId; // 0 = TAO. 1 = Name. 2 = ETH address
	}

	uint256 public totalNames;
	uint256 public totalTAOs;

	// Mapping from Name/TAO ID to NameTAOInfo
	mapping (address => NameTAOInfo) internal nameTAOInfos;

	// Mapping from name to Name/TAO ID
	mapping (bytes32 => address) internal nameToNameTAOIdLookup;

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress, address _taoFactoryAddress, address _nameTAOPositionAddress) public {
		setNameFactoryAddress(_nameFactoryAddress);
		setTAOFactoryAddress(_taoFactoryAddress);
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
		require (msg.sender == nameFactoryAddress || msg.sender == taoFactoryAddress);
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
	 * @dev The AO set the nameFactoryAddress Address
	 * @param _nameFactoryAddress The address of NameFactory
	 */
	function setNameFactoryAddress(address _nameFactoryAddress) public onlyTheAO {
		require (_nameFactoryAddress != address(0));
		nameFactoryAddress = _nameFactoryAddress;
	}

	/**
	 * @dev The AO set the taoFactoryAddress Address
	 * @param _taoFactoryAddress The address of TAOFactory
	 */
	function setTAOFactoryAddress(address _taoFactoryAddress) public onlyTheAO {
		require (_taoFactoryAddress != address(0));
		taoFactoryAddress = _taoFactoryAddress;
	}

	/**
	 * @dev The AO set the NameTAOPosition Address
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	function setNameTAOPositionAddress(address _nameTAOPositionAddress) public onlyTheAO {
		require (_nameTAOPositionAddress != address(0));
		nameTAOPositionAddress = _nameTAOPositionAddress;
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Check whether or not a name exist in the list
	 * @param _name The name to be checked
	 * @return true if yes, false otherwise
	 */
	function isExist(string calldata _name) external view returns (bool) {
		bytes32 _nameKey = keccak256(abi.encodePacked(_name));
		return (nameToNameTAOIdLookup[_nameKey] != address(0));
	}

	/**
	 * @dev Add a new NameTAOInfo
	 * @param _name The name of the Name/TAO
	 * @param _nameTAOId The address of the Name/TAO
	 * @param _typeId If TAO = 0. Name = 1
	 * @param _parentName The parent name of the Name/TAO
	 * @param _parentId The address of the parent. Can be a Name ID/TAO ID/ETH address
	 * @param _parentTypeId If TAO = 0. Name = 1. 2 = ETH address
	 * @return true on success
	 */
	function initialize(string calldata _name, address _nameTAOId, uint256 _typeId, string calldata _parentName, address _parentId, uint256 _parentTypeId) external onlyFactory returns (bool) {
		require (bytes(_name).length > 0);
		require (_nameTAOId != address(0));
		require (_typeId == 0 || _typeId == 1);
		require (bytes(_parentName).length > 0);
		require (_parentId != address(0));
		require (_parentTypeId >= 0 && _parentTypeId <= 2);
		require (!this.isExist(_name));
		if (_parentTypeId != 2) {
			require (this.isExist(_parentName));
		}

		bytes32 _nameKey = keccak256(abi.encodePacked(_name));
		nameToNameTAOIdLookup[_nameKey] = _nameTAOId;

		NameTAOInfo storage _nameTAOInfo = nameTAOInfos[_nameTAOId];
		_nameTAOInfo.name = _name;
		_nameTAOInfo.nameTAOId = _nameTAOId;
		_nameTAOInfo.typeId = _typeId;
		_nameTAOInfo.parentName = _parentName;
		_nameTAOInfo.parentId = _parentId;
		_nameTAOInfo.parentTypeId = _parentTypeId;

		if (_typeId == 0) {
			totalTAOs++;
		} else {
			totalNames++;
		}
		return true;
	}

	/**
	 * @dev Get the NameTAOInfo given a name
	 * @param _name The name to be queried
	 * @return the name of Name/TAO
	 * @return the address of Name/TAO
	 * @return type ID. 0 = TAO. 1 = Name
	 * @return the parent name of Name/TAO
	 * @return the address of the parent. Can be a Name ID/TAO ID/ETH address
	 * @return the parent typeId. If TAO = 0. Name = 1. 2 = ETH address
	 */
	function getByName(string memory _name) public view returns (string memory, address, uint256, string memory, address, uint256) {
		require (this.isExist(_name));
		bytes32 _nameKey = keccak256(abi.encodePacked(_name));
		NameTAOInfo memory _nameTAOInfo = nameTAOInfos[nameToNameTAOIdLookup[_nameKey]];
		return (
			_nameTAOInfo.name,
			_nameTAOInfo.nameTAOId,
			_nameTAOInfo.typeId,
			_nameTAOInfo.parentName,
			_nameTAOInfo.parentId,
			_nameTAOInfo.parentTypeId
		);
	}

	/**
	 * @dev Get the NameTAOInfo given a Name/TAO ID
	 * @param _id The Name/TAO ID to be queried
	 * @return the name of Name/TAO
	 * @return the address of Name/TAO
	 * @return type ID. 0 = TAO. 1 = Name
	 * @return the parent name of Name/TAO
	 * @return the address of the parent. Can be a Name ID/TAO ID/ETH address
	 * @return the parent typeId. If TAO = 0. Name = 1. 2 = ETH address
	 */
	function getById(address _id) external view returns (string memory, address, uint256, string memory, address, uint256) {
		require (nameTAOInfos[_id].nameTAOId != address(0));
		NameTAOInfo memory _nameTAOInfo = nameTAOInfos[_id];
		return (
			_nameTAOInfo.name,
			_nameTAOInfo.nameTAOId,
			_nameTAOInfo.typeId,
			_nameTAOInfo.parentName,
			_nameTAOInfo.parentId,
			_nameTAOInfo.parentTypeId
		);
	}

	/**
	 * @dev Return the Name/TAO ID given a _name
	 * @param _name The name to be queried
	 * @return the nameTAOId of the name
	 */
	function getIdByName(string calldata _name) external view returns (address) {
		require (this.isExist(_name));
		bytes32 _nameKey = keccak256(abi.encodePacked(_name));
		return nameToNameTAOIdLookup[_nameKey];
	}
}
