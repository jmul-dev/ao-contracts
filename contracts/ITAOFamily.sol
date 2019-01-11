pragma solidity ^0.4.24;

interface ITAOFamily {
	function add(address _id, address _parentId, uint256 _childMinLogos) external returns (bool);

	function getFamilyById(address _id) external view returns (address, uint256, uint256);

	function addChild(address _taoId, address _childId) external returns (bool);
}
