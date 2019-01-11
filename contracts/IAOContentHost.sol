pragma solidity ^0.4.24;

interface IAOContentHost {
	function create(address _host, bytes32 _stakeId, string _encChallenge, string _contentDatKey, string _metadataDatKey) external returns (bool);

	function getById(bytes32 _contentHostId) external view returns (bytes32, bytes32, address, string, string);

	function contentHostPrice(bytes32 _contentHostId) external view returns (uint256);

	function contentHostPaidByAO(bytes32 _contentHostId) external view returns (uint256);

	function isExist(bytes32 _contentHostId) external view returns (bool);
}
