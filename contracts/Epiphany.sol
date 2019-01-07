pragma solidity ^0.4.24;

import './TheAO.sol';
import './AOLibrary.sol';

contract Epiphany is TheAO {
	string public what;
	string public when;
	string public why;
	string public who;
	address public where;
	string public aSign;
	string public logos;

	constructor() public {
		what = 'The AO';
		when = 'January 6th, 2019 a.d, year 1 a.c. Epiphany. An appearance or manifestation especially of a divine being. An illuminating discovery, realization, or disclosure.';
		why = 'To Hear, See, and Speak the Human inside Humanity.';
		who = 'You.  Set the world, Free. – Truth';
		aSign = '08e2c4e1ccf3bccfb3b8eef14679b28442649a2a733960661210a0b00d9c93bf';
		logos = '0920c6ab1848df83a332a21e8c9ec1a393e694c396b872aee053722d023e2a32';
	}

	/**
	 * @dev Checks if the calling contract address is The AO
	 *		OR
	 *		If The AO is set to a Name/TAO, then check if calling address is the Advocate
	 */
	modifier onlyTheAO {
		require (AOLibrary.isTheAO(msg.sender, theAO, nameTAOPositionAddress));
		_;
	}

	/***** The AO ONLY METHODS *****/
	/**
	 * @dev The AO set the NameTAOPosition Address
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	function setNameTAOPositionAddress(address _nameTAOPositionAddress) public onlyTheAO {
		require (_nameTAOPositionAddress != address(0));
		nameTAOPositionAddress = _nameTAOPositionAddress;
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

	/**
	 * @dev Set `where` value
	 * @param _where The new value to be set
	 */
	function setWhere(address _where) public onlyTheAO {
		where = _where;
	}
}
