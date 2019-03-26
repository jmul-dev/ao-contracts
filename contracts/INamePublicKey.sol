pragma solidity >=0.5.4 <0.6.0;

interface INamePublicKey {
	function initialize(address _id, address _defaultKey) external returns (bool);

	function isKeyExist(address _id, address _key) external view returns (bool);

	function getDefaultKey(address _id) external view returns (address);

	function whitelistAddKey(address _id, address _key) external returns (bool);
}
