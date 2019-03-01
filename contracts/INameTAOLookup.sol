pragma solidity ^0.5.4;

interface INameTAOLookup {
	function isExist(string _name) external view returns (bool);

	function initialize(string _name, address _nameTAOId, uint256 _typeId, string _parentName, address _parentId, uint256 _parentTypeId) external returns (bool);

	function getById(address _id) external view returns (string, address, uint256, string, address, uint256);

	function getIdByName(string _name) external view returns (address);
}
