pragma solidity ^0.4.24;

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
	constructor(address _nameFactoryAddress) TAOCurrencyTreasury(_nameFactoryAddress) public {}
}
