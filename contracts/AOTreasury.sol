pragma solidity ^0.4.24;

import './SafeMath.sol';
import './owned.sol';
import './AOToken.sol';

/**
 * @title AOTreasury
 *
 * The purpose of this contract is to list all of the valid denominations of AO Token and do the conversion between denominations
 */
contract AOTreasury is owned {
	using SafeMath for uint256;

	// Mapping from denomination type to the token address
	mapping (bytes8 => address) public denominations;

	/**
	 * @dev Constructor function
	 */
	constructor() public {}

	/***** OWNER ONLY METHODS *****/
	/**
	 * @dev Owner adds denomination and the contract address associated with it
	 * @param denominationName The name of the denomination, i.e kilo, mega, etc.
	 * @param denominationAddress The address of the denomination token
	 * @return true on success
	 */
	function addDenomination(bytes8 denominationName, address denominationAddress) public onlyOwner returns (bool) {
		require (denominationName.length != 0);
		require (denominationAddress != address(0));
		require (denominations[denominationName] == address(0));
		denominations[denominationName] = denominationAddress;
		return true;
	}

	/**
	 * @dev Owner updates denomination and the contract address associated with it
	 * @param denominationName The name of the denomination, i.e kilo, mega, etc.
	 * @param denominationAddress The address of the denomination token
	 * @return true on success
	 */
	function updateDenomination(bytes8 denominationName, address denominationAddress) public onlyOwner returns (bool) {
		require (denominationName.length != 0);
		require (denominations[denominationName] != address(0));
		require (denominationAddress != address(0));
		denominations[denominationName] = denominationAddress;
		return true;
	}

	/**
	 * @dev Owner deletes denomination from the list
	 * @param denominationName The name of the denomination, i.e kilo, mega, etc.
	 * @return true on success
	 */
	function deleteDenomination(bytes8 denominationName) public onlyOwner returns (bool) {
		require (denominationName.length != 0);
		require (denominations[denominationName] != address(0));
		denominations[denominationName] = address(0);
		return true;
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev convert token from `denominationName` denomination to base denomination,
	 *		in this case it's similar to web3.toWei() functionality
	 * @param integerAmount uint256 of the integer amount to be converted
	 * @param fractionAmount uint256 of the frational amount to be converted
	 * @param denominationName bytes8 name of the token denomination
	 * @return uint256 converted amount in base denomination from target denomination
	 */
	function toBase(uint256 integerAmount, uint256 fractionAmount, bytes8 denominationName) public view returns (uint256) {
		require (denominations[denominationName] != address(0));
		AOToken _denominationToken = AOToken(denominations[denominationName]);
		uint8 fractionNumDigits = _numDigits(fractionAmount);
		uint256 baseFraction = _denominationToken.decimals() > 0 && fractionAmount > 0 ? fractionAmount.mul(10 ** uint256(_denominationToken.decimals())).div(10 ** uint256(fractionNumDigits)) : 0;
		uint256 baseInteger = integerAmount.mul(10 ** _denominationToken.powerOfTen());
		return baseInteger.add(baseFraction);
	}

	/**
	 * @dev convert token from base denomination to `denominationName` denomination,
	 *		in this case it's similar to web3.fromWei() functionality
	 * @param integerAmount uint256 of the base amount to be converted
	 * @param denominationName bytes8 name of the target token denomination
	 * @return uint256 of the converted integer amount in target denomination
	 * @return uint256 of the converted fraction amount in target denomination
	 */
	function fromBase(uint256 integerAmount, bytes8 denominationName) public view returns (uint256, uint256) {
		require (denominations[denominationName] != address(0));
		AOToken _denominationToken = AOToken(denominations[denominationName]);
		uint256 denominationInteger = integerAmount.div(10 ** _denominationToken.powerOfTen());
		uint256 denominationFraction = integerAmount.sub(denominationInteger.mul(10 ** _denominationToken.powerOfTen()));
		return (denominationInteger, denominationFraction);
	}

	/***** Private functions *****/
	/**
	 * @dev count num of digits
	 * @param number uint256 of the nuumber to be checked
	 * @return uint8 num of digits
	 */
	function _numDigits(uint256 number) private pure returns (uint8) {
		uint8 digits = 0;
		while(number != 0) {
			number = number.div(10);
			digits++;
		}
		return digits;
	}
}
