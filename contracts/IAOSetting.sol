pragma solidity ^0.4.24;

interface IAOSetting {
	function getSettingValuesByTAOName(address _taoId, string _settingName) external view returns (uint256, bool, address, bytes32, string);
}
