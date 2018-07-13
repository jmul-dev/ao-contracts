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
	 * @param amount uint256 of the amount to be converted
	 * @param denomination bytes8 of the target denomination
	 * @return uint256 converted amount in the target denomination
	 */
	function toBase(uint256 amount, bytes8 denomination) public view returns (uint256) {
		require (denominationAddresses[denomination] != address(0));
		return amount.mul(10 ** AOToken(denominationAddresses[denomination]).powerOfTen());
	}
}
