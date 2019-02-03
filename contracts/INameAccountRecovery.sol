pragma solidity ^0.4.24;

interface INameAccountRecovery {
	function isCompromised(address _id) external view returns (bool);
}
