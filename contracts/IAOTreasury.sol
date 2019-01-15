pragma solidity ^0.4.24;

interface IAOTreasury {
	function toBase(uint256 integerAmount, uint256 fractionAmount, bytes8 denominationName) external view returns (uint256);
	function isDenominationExist(bytes8 denominationName) external view returns (bool);
}
