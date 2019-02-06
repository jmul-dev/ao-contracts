pragma solidity ^0.4.24;

interface IAOSettingAttribute {
	function add(uint256 _settingId, address _creatorNameId, string _settingName, address _creatorTAOId, address _associatedTAOId, string _extraData) external returns (bytes32, bytes32);

	function getSettingData(uint256 _settingId) external view returns (uint256, address, address, address, string, bool, bool, bool, string);

	function approveAdd(uint256 _settingId, address _associatedTAOAdvocate, bool _approved) external returns (bool);

	function finalizeAdd(uint256 _settingId, address _creatorTAOAdvocate) external returns (bool);

	function update(uint256 _settingId, address _associatedTAOAdvocate, address _proposalTAOId, string _extraData) external returns (bool);

	function getSettingState(uint256 _settingId) external view returns (uint256, bool, address, address, address, string);

	function approveUpdate(uint256 _settingId, address _proposalTAOAdvocate, bool _approved) external returns (bool);

	function finalizeUpdate(uint256 _settingId, address _associatedTAOAdvocate) external returns (bool);

	function addDeprecation(uint256 _settingId, address _creatorNameId, address _creatorTAOId, address _associatedTAOId, uint256 _newSettingId, address _newSettingContractAddress) external returns (bytes32, bytes32);

	function getSettingDeprecation(uint256 _settingId) external view returns (uint256, address, address, address, bool, bool, bool, bool, uint256, uint256, address, address);

	function approveDeprecation(uint256 _settingId, address _associatedTAOAdvocate, bool _approved) external returns (bool);

	function finalizeDeprecation(uint256 _settingId, address _creatorTAOAdvocate) external returns (bool);

	function settingExist(uint256 _settingId) external view returns (bool);

	function getLatestSettingId(uint256 _settingId) external view returns (uint256);
}
