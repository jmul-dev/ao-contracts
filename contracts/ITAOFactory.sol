pragma solidity ^0.4.24;

interface ITAOFactory {
	function incrementNonce(address _taoId) external returns (uint256);
}
