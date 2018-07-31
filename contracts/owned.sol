pragma solidity ^0.4.24;

contract owned {
	address public owner;

	// Check whether an address is whitelisted and granted access to transact
	// on behalf of others
	mapping (address => bool) public whitelist;

	constructor() public {
		owner = msg.sender;
	}

	modifier onlyOwner {
		require(msg.sender == owner);
		_;
	}

	/**
	 * @dev Checks if `_account` is in whitelist.
	 *		i.e, `_account` is granted access to transact on behalf of others
	 */
	modifier inWhitelist(address _account) {
		require (whitelist[_account] == true || _account == owner);
		_;
	}

	function transferOwnership(address newOwner) onlyOwner public {
		owner = newOwner;
	}

	/**
	 * @dev Whitelist `_account` address to transact on behalf of others
	 * @param _account The address to whitelist
	 * @param _whitelist Either to whitelist or not
	 */
	function setWhitelist(address _account, bool _whitelist) public onlyOwner {
		whitelist[_account] = _whitelist;
	}
}
