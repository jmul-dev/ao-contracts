pragma solidity ^0.5.4;

interface ITAOFactory {
	function nonces(address _taoId) external view returns (uint256);
	function incrementNonce(address _taoId) external returns (uint256);
}
