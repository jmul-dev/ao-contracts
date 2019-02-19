pragma solidity ^0.4.24;

interface ITAOFactory {
	function nonces(address _taoId) external view returns (uint256);
	function incrementNonce(address _taoId) external returns (uint256);
}
