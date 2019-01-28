pragma solidity ^0.4.24;

interface INameTAOLookup {
	function isExist(string _name) external view returns (bool);

	function initialize(string _name, address _nameTAOAddress, string _parentName, uint256 _typeId) external returns (bool);

	function getAddressByName(string _name) external view returns (address);
}
