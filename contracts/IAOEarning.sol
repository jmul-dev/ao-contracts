pragma solidity ^0.5.4;

interface IAOEarning {
	function calculateEarning(bytes32 _purchaseReceiptId) external returns (bool);

	function releaseEarning(bytes32 _purchaseReceiptId) external returns (bool);

	function getTotalStakedContentEarning(bytes32 _stakedContentId) external view returns (uint256, uint256, uint256);
}
