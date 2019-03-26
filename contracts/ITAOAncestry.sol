pragma solidity >=0.5.4 <0.6.0;

interface ITAOAncestry {
	function initialize(address _id, address _parentId, uint256 _childMinLogos) external returns (bool);

	function getAncestryById(address _id) external view returns (address, uint256, uint256);

	function addChild(address _taoId, address _childId) external returns (bool);

	function isChild(address _taoId, address _childId) external view returns (bool);
}
