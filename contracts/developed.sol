pragma solidity ^0.4.24;

contract developed {
	address public developer;

	// Foundation addresses to receive Primordial/Network Tokens
	address public foundationAddress1 = 0x5C63644D01Ba385eBAc5bcf2DDc1e6dBC1182b52;
	address public foundationAddress2 = 0x156C79bf4347D1891da834Ea30662A14177CbF28;

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
	 * @dev Set foundation addresses to receive Primordial/Network tokens during network exchange
	 * @param _foundationAddress1 The first foundation address
	 * @param _foundationAddress2 The second foundation address
	 */
	function setFoundationAddresses(address _foundationAddress1, address _foundationAddress2) public onlyDeveloper {
		require (_foundationAddress1 != address(0));
		require (_foundationAddress2 != address(0));
		foundationAddress1 = _foundationAddress1;
		foundationAddress2 = _foundationAddress2;
	}
}
