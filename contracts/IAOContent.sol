pragma solidity >=0.5.4 <0.6.0;

interface IAOContent {
	function create(address _creator, string calldata _baseChallenge, uint256 _fileSize, bytes32 _contentUsageType, address _taoId) external returns (bytes32);

	function isAOContentUsageType(bytes32 _contentId) external view returns (bool);

	function getById(bytes32 _contentId) external view returns (address, uint256, bytes32, address, bytes32, uint8, bytes32, bytes32, string memory);

	function getBaseChallenge(bytes32 _contentId) external view returns (string memory);
}
