pragma solidity ^0.4.24;

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
		address nameTAOAddress;
		string parentName;
		uint256 typeId; // 0 = TAO. 1 = Name
	}

	uint256 public internalId;
	uint256 public totalNames;
	uint256 public totalTAOs;

	mapping (uint256 => NameTAOInfo) internal nameTAOInfos;
	mapping (bytes32 => uint256) internal internalIdLookup;

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
	function isExist(string _name) external view returns (bool) {
		bytes32 _nameKey = keccak256(abi.encodePacked(_name));
		return (internalIdLookup[_nameKey] > 0);
	}

	/**
	 * @dev Add a new NameTAOInfo
	 * @param _name The name of the Name/TAO
	 * @param _nameTAOAddress The address of the Name/TAO
	 * @param _parentName The parent name of the Name/TAO
	 * @param _typeId If TAO = 0. Name = 1
	 * @return true on success
	 */
	function initialize(string _name, address _nameTAOAddress, string _parentName, uint256 _typeId) external onlyFactory returns (bool) {
		require (bytes(_name).length > 0);
		require (_nameTAOAddress != address(0));
		require (bytes(_parentName).length > 0);
		require (_typeId == 0 || _typeId == 1);
		require (!this.isExist(_name));

		internalId++;
		bytes32 _nameKey = keccak256(abi.encodePacked(_name));
		internalIdLookup[_nameKey] = internalId;
		NameTAOInfo storage _nameTAOInfo = nameTAOInfos[internalId];
		_nameTAOInfo.name = _name;
		_nameTAOInfo.nameTAOAddress = _nameTAOAddress;
		_nameTAOInfo.parentName = _parentName;
		_nameTAOInfo.typeId = _typeId;

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
	 * @return the parent name of Name/TAO
	 * @return type ID. 0 = TAO. 1 = Name
	 */
	function getByName(string _name) public view returns (string, address, string, uint256) {
		require (this.isExist(_name));
		bytes32 _nameKey = keccak256(abi.encodePacked(_name));
		NameTAOInfo memory _nameTAOInfo = nameTAOInfos[internalIdLookup[_nameKey]];
		return (
			_nameTAOInfo.name,
			_nameTAOInfo.nameTAOAddress,
			_nameTAOInfo.parentName,
			_nameTAOInfo.typeId
		);
	}

	/**
	 * @dev Get the NameTAOInfo given an ID
	 * @param _internalId The internal ID to be queried
	 * @return the name of Name/TAO
	 * @return the address of Name/TAO
	 * @return the parent name of Name/TAO
	 * @return type ID. 0 = TAO. 1 = Name
	 */
	function getByInternalId(uint256 _internalId) public view returns (string, address, string, uint256) {
		require (nameTAOInfos[_internalId].nameTAOAddress != address(0));
		NameTAOInfo memory _nameTAOInfo = nameTAOInfos[_internalId];
		return (
			_nameTAOInfo.name,
			_nameTAOInfo.nameTAOAddress,
			_nameTAOInfo.parentName,
			_nameTAOInfo.typeId
		);
	}

	/**
	 * @dev Return the nameTAOAddress given a _name
	 * @param _name The name to be queried
	 * @return the nameTAOAddress of the name
	 */
	function getAddressByName(string _name) external view returns (address) {
		require (this.isExist(_name));
		bytes32 _nameKey = keccak256(abi.encodePacked(_name));
		NameTAOInfo memory _nameTAOInfo = nameTAOInfos[internalIdLookup[_nameKey]];
		return _nameTAOInfo.nameTAOAddress;
	}
}
