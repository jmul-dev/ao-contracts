pragma solidity ^0.4.24;

contract developed {
	address public developer;

	// Check whether an address is whitelisted and granted access to transact
	// on behalf of others
	mapping (address => bool) public whitelist;

	constructor() public {
		developer = msg.sender;
	}

	modifier onlyDeveloper {
		require(msg.sender == developer);
		_;
	}

	/**
	 * @dev Checks if `_account` is in whitelist.
	 *		i.e, `_account` is granted access to transact on behalf of others
	 */
	modifier inWhitelist(address _account) {
		require (whitelist[_account] == true || _account == developer);
		_;
	}

	function transferOwnership(address newDeveloper) onlyDeveloper public {
		developer = newDeveloper;
	}

	/**
	 * @dev Whitelist `_account` address to transact on behalf of others
	 * @param _account The address to whitelist
	 * @param _whitelist Either to whitelist or not
	 */
	function setWhitelist(address _account, bool _whitelist) public onlyDeveloper {
		whitelist[_account] = _whitelist;
	}
}
