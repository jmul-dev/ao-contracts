pragma solidity >=0.5.4 <0.6.0;

import "./TAOCurrency.sol";

contract Ethos is TAOCurrency {
	/**
	 * @dev Constructor function
	 */
	constructor(string memory _name, string memory _symbol, address _nameTAOPositionAddress)
		TAOCurrency(_name, _symbol, _nameTAOPositionAddress) public {}
}
