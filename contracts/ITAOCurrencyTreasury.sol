pragma solidity >=0.5.4 <0.6.0;

interface ITAOCurrencyTreasury {
	function toBase(uint256 integerAmount, uint256 fractionAmount, bytes8 denominationName) external view returns (uint256);
	function isDenominationExist(bytes8 denominationName) external view returns (bool);
}
