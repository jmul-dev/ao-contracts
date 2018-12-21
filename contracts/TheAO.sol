pragma solidity ^0.4.24;

contract TheAO {
	address public theAO;

	// Check whether an address is whitelisted and granted access to transact
	// on behalf of others
	mapping (address => bool) public whitelist;

	constructor() public {
		theAO = msg.sender;
	}

	/**
	 * @dev Checks if the calling contract address is The AO
	 */
	modifier onlyTheAO {
		require(msg.sender == theAO);
		_;
	}

	/**
	 * @dev Checks if `_account` is in whitelist.
	 *		i.e, `_account` is granted access to transact on behalf of others
	 */
	modifier inWhitelist(address _account) {
		require (whitelist[_account] == true || _account == theAO);
		_;
	}

	/**
	 * @dev Transfer ownership of The AO to new address
	 * @param _theAO The new address to be transferred
	 */
	function transferOwnership(address _theAO) public onlyTheAO {
		require (_theAO != address(0));
		theAO = _theAO;
	}

	/**
	 * @dev Whitelist `_account` address to transact on behalf of others
	 * @param _account The address to whitelist
	 * @param _whitelist Either to whitelist or not
	 */
	function setWhitelist(address _account, bool _whitelist) public onlyTheAO {
		require (_account != address(0));
		whitelist[_account] = _whitelist;
	}
}
