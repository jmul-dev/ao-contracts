pragma solidity ^0.5.4;

interface IAOSetting {
	function getSettingValuesByTAOName(address _taoId, string _settingName) external view returns (uint256, bool, address, bytes32, string);
	function getSettingTypes() external view returns (uint8, uint8, uint8, uint8, uint8);

	function settingTypeLookup(uint256 _settingId) external view returns (uint8);
}
