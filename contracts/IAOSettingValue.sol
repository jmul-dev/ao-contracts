pragma solidity ^0.5.4;

interface IAOSettingValue {
	function setPendingValue(uint256 _settingId, address _addressValue, bool _boolValue, bytes32 _bytesValue, string calldata _stringValue, uint256 _uintValue) external returns (bool);

	function movePendingToSetting(uint256 _settingId) external returns (bool);

	function settingValue(uint256 _settingId) external view returns (address, bool, bytes32, string memory, uint256);
}
