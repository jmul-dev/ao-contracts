pragma solidity ^0.5.4;

interface INameAccountRecovery {
	function isCompromised(address _id) external view returns (bool);
}
