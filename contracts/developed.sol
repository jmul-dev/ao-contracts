pragma solidity ^0.4.24;

contract developed {
	address public developer;

	// AO Dev Team addresses to receive Primordial/Network Tokens
	address public aoDevTeam1 = 0x5C63644D01Ba385eBAc5bcf2DDc1e6dBC1182b52;
	address public aoDevTeam2 = 0x156C79bf4347D1891da834Ea30662A14177CbF28;

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

	/**
	 * @dev Set AO Dev team addresses to receive Primordial/Network tokens during network exchange
	 * @param _aoDevTeam1 The first AO dev team address
	 * @param _aoDevTeam2 The second AO dev team address
	 */
	function setAODevTeamAddresses(address _aoDevTeam1, address _aoDevTeam2) public onlyDeveloper {
		aoDevTeam1 = _aoDevTeam1;
		aoDevTeam2 = _aoDevTeam2;
	}
}
