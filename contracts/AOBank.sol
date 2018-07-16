pragma solidity ^0.4.24;

import './SafeMath.sol';
import './owned.sol';
import './AOToken.sol';

/**
 * @title AOBank
 */
contract AOBank is owned {
	using SafeMath for uint256;

	bool public paused;

	// Mapping from denomination type to the token address
	mapping (bytes8 => address) public denominationAddresses;

	constructor() public {}

	/**
	 * @dev Checks if the contract is currently active
	 */
	modifier isActive {
		require(paused == false);
		_;
	}

	/**
	 * @dev Owner pauses contract
	 * @param _paused The value to be set
	 */
	function setPaused(bool _paused) public onlyOwner returns (bool) {
		paused = _paused;
		return true;
	}

	/**
	 * @dev Owner adds denomination and the token address associated with it
	 * @param name of the denomination
	 * @param tokenAddress address of the token
	 * @return bool true when success
	 */
	function addDenominationAddress(bytes8 name, address tokenAddress) public onlyOwner returns (bool) {
		require(name.length != 0 && tokenAddress != address(0) && denominationAddresses[name] == address(0));
		denominationAddresses[name] = tokenAddress;
		return true;
	}

	/**
	 * @dev convert token to the base denomination, in this case is ao
	 *		similar to web3.toWei() functionality
	 * @param integerAmount uint256 of the integer amount to be converted
	 * @param fractionAmount uint256 of the frational amount to be converted
	 * @param denomination bytes8 of the target denomination
	 * @return uint256 converted amount in the target denomination
	 */
	function toBase(uint256 integerAmount, uint256 fractionAmount, bytes8 denomination) public view returns (uint256) {
		require (denominationAddresses[denomination] != address(0));
		uint8 fractionNumDigits = numDigits(fractionAmount);
		uint256 baseFraction = AOToken(denominationAddresses[denomination]).decimals() > 0 && fractionAmount > 0 ? fractionAmount.mul(10 ** uint256(AOToken(denominationAddresses[denomination]).decimals())).div(10 ** uint256(fractionNumDigits)) : 0;
		uint256 baseInteger = integerAmount.mul(10 ** AOToken(denominationAddresses[denomination]).powerOfTen());
		return baseInteger.add(baseFraction);
	}

	/* Private functions */

	/**
	 * @dev count num of digits
	 * @param number uint256 of the nuumber to be checked
	 * @return uint8 num of digits
	 */
	function numDigits(uint256 number) private pure returns (uint8) {
		uint8 digits = 0;
		while(number != 0) {
			number = number.div(10);
			digits++;
		}
		return digits;
	}
}
