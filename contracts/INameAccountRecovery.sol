pragma solidity >=0.5.4 <0.6.0;

interface INameAccountRecovery {
	function isCompromised(address _id) external view returns (bool);
}
