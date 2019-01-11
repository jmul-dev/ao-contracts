pragma solidity ^0.4.24;

interface IAOPurchaseReceipt {
	function senderIsBuyer(bytes32 _purchaseReceiptId, address _sender) external view returns (bool);

	function getById(bytes32 _purchaseReceiptId) external view returns (bytes32, bytes32, bytes32, address, uint256, uint256, uint256, string, address, uint256);
}
