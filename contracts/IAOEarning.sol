pragma solidity ^0.4.24;

interface IAOEarning {
	function calculateEarning(address _buyer, bytes32 _purchaseId, uint256 _networkAmountStaked, uint256 _primordialAmountStaked, uint256 _primordialWeightedMultiplierStaked, uint256 _profitPercentage, address _stakeOwner, address _host, bool _isAOContentUsageType) external returns (bool);

	function releaseEarning(bytes32 _stakeId, bytes32 _contentHostId, bytes32 _purchaseId, bool _buyerPaidMoreThanFileSize, address _stakeOwner, address _host) external returns (bool);

	function getTotalStakedContentEarning(bytes32 _stakeId) external view returns (uint256, uint256, uint256);
}
