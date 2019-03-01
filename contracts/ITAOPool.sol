pragma solidity ^0.5.4;

interface ITAOPool {
	function createPool(address _taoId, bool _ethosCapStatus, uint256 _ethosCapAmount) external returns (bool);
}
