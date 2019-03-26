pragma solidity >=0.5.4 <0.6.0;

interface INameTAOLookup {
	function isExist(string calldata _name) external view returns (bool);

	function initialize(string calldata _name, address _nameTAOId, uint256 _typeId, string calldata _parentName, address _parentId, uint256 _parentTypeId) external returns (bool);

	function getById(address _id) external view returns (string memory, address, uint256, string memory, address, uint256);

	function getIdByName(string calldata _name) external view returns (address);
}
