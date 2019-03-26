pragma solidity >=0.5.4 <0.6.0;

import './TAOCurrencyTreasury.sol';

/**
 * @title PathosTreasury
 *
 * The purpose of this contract is to list all of the valid denominations of Pathos and do the conversion between denominations
 */
contract PathosTreasury is TAOCurrencyTreasury {
	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress, address _nameTAOPositionAddress)
		TAOCurrencyTreasury(_nameFactoryAddress, _nameTAOPositionAddress) public {}
}
