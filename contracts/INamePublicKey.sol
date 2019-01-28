pragma solidity ^0.4.24;

interface INamePublicKey {
	function initialize(address _id, address _defaultKey) external returns (bool);

	function isKeyExist(address _id, address _key) external view returns (bool);

	function getDefaultKey(address _id) external view returns (address);
}
