pragma solidity ^0.5.4;

import './TAOCurrencyTreasury.sol';

/**
 * @title EthosTreasury
 *
 * The purpose of this contract is to list all of the valid denominations of Ethos and do the conversion between denominations
 */
contract EthosTreasury is TAOCurrencyTreasury {
	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress, address _nameTAOPositionAddress)
		TAOCurrencyTreasury(_nameFactoryAddress, _nameTAOPositionAddress) public {}
}
