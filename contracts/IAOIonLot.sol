pragma solidity ^0.4.24;

interface IAOIonLot {
	function createPrimordialLot(address _account, uint256 _primordialAmount, uint256 _multiplier, uint256 _networkBonusAmount) external returns (bytes32);

	function createWeightedMultiplierLot(address _account, uint256 _amount, uint256 _weightedMultiplier) external returns (bytes32);

	function lotById(bytes32 _lotId) external view returns (bytes32, address, uint256, uint256);

	function totalLotsByAddress(address _lotOwner) external view returns (uint256);

	function createBurnLot(address _account, uint256 _amount, uint256 _multiplierAfterBurn) external returns (bool);

	function createConvertLot(address _account, uint256 _amount, uint256 _multiplierAfterConversion) external returns (bool);
}
