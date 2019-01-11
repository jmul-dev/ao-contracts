pragma solidity ^0.4.24;

interface IAOSettingValue {
	function setPendingValue(uint256 _settingId, address _addressValue, bool _boolValue, bytes32 _bytesValue, string _stringValue, uint256 _uintValue) external returns (bool);

	function movePendingToSetting(uint256 _settingId) external returns (bool);

	function settingValue(uint256 _settingId) external view returns (address, bool, bytes32, string, uint256);
}
