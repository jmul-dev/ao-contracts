pragma solidity ^0.4.24;

/**
 * @title NameTAOLookup
 *
 */
contract NameTAOLookup {
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
	constructor(address _nameFactoryAddress, address _taoFactoryAddress) public {
		nameFactoryAddress = _nameFactoryAddress;
		taoFactoryAddress = _taoFactoryAddress;
	}

	/**
	 * @dev Check if calling address is Factory
	 */
	modifier onlyFactory {
		require (msg.sender == nameFactoryAddress || msg.sender == taoFactoryAddress);
		_;
	}

	/**
	 * @dev Check whether or not a name exist in the list
	 * @param _name The name to be checked
	 * @return true if yes, false otherwise
	 */
	function isExist(string _name) public view returns (bool) {
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
	function add(string _name, address _nameTAOAddress, string _parentName, uint256 _typeId) public onlyFactory returns (bool) {
		require (bytes(_name).length > 0);
		require (_nameTAOAddress != address(0));
		require (bytes(_parentName).length > 0);
		require (_typeId == 0 || _typeId == 1);
		require (!isExist(_name));

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
		require (isExist(_name));
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
	function getAddressByName(string _name) public view returns (address) {
		require (isExist(_name));
		bytes32 _nameKey = keccak256(abi.encodePacked(_name));
		NameTAOInfo memory _nameTAOInfo = nameTAOInfos[internalIdLookup[_nameKey]];
		return _nameTAOInfo.nameTAOAddress;
	}
}
