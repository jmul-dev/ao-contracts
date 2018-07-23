pragma solidity ^0.4.24;

import './SafeMath.sol';
import './AOToken.sol';

/**
 * @title AOLibrary
 */
library AOLibrary {
	using SafeMath for uint256;

	/**
	 * @dev convert token from `denominationAddress` denomination to base denomination,
	 *		in this case it's similar to web3.toWei() functionality
	 * @param integerAmount uint256 of the integer amount to be converted
	 * @param fractionAmount uint256 of the frational amount to be converted
	 * @param denominationAddress address of the target token denomination
	 * @return uint256 converted amount in base denomination from target denomination
	 */
	function toBase(uint256 integerAmount, uint256 fractionAmount, address denominationAddress) public view returns (uint256) {
		AOToken _denominationToken = AOToken(denominationAddress);
		// Make sure the denomination token is valid by checking the powerOfTen variable (should be at least 1)
		require (_denominationToken.powerOfTen() > 0);
		uint8 fractionNumDigits = _numDigits(fractionAmount);
		uint256 baseFraction = _denominationToken.decimals() > 0 && fractionAmount > 0 ? fractionAmount.mul(10 ** uint256(_denominationToken.decimals())).div(10 ** uint256(fractionNumDigits)) : 0;
		uint256 baseInteger = integerAmount.mul(10 ** _denominationToken.powerOfTen());
		return baseInteger.add(baseFraction);
	}

	/**
	 * @dev convert token from base denomination to `denominationAddress` denomination,
	 *		in this case it's similar to web3.fromWei() functionality
	 * @param integerAmount uint256 of the base amount to be converted
	 * @param denominationAddress address of the target token denomination
	 * @return uint256 of the converted integer amount in target denomination
	 * @return uint256 of the converted fraction amount in target denomination
	 */
	function fromBase(uint256 integerAmount, address denominationAddress) public view returns (uint256, uint256) {
		AOToken _denominationToken = AOToken(denominationAddress);
		// Make sure the denomination token is valid by checking the powerOfTen variable (should be at least 1)
		require (_denominationToken.powerOfTen() > 0);
		uint256 denominationInteger = integerAmount.div(10 ** _denominationToken.powerOfTen());

		uint256 denominationFraction = integerAmount.sub(denominationInteger.mul(10 ** _denominationToken.powerOfTen()));
		return (denominationInteger, denominationFraction);
	}

	/* Private functions */

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
