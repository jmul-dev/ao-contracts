pragma solidity ^0.4.24;

import './TAOCurrencyTreasury.sol';

/**
 * @title LogosTreasury
 *
 * The purpose of this contract is to list all of the valid denominations of Logos and do the conversion between denominations
 */
contract LogosTreasury is TAOCurrencyTreasury {
	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress, address _nameTAOPositionAddress)
		TAOCurrencyTreasury(_nameFactoryAddress, _nameTAOPositionAddress) public {}
}
