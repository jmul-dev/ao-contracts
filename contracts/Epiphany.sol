pragma solidity ^0.4.24;

import './TheAO.sol';

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
		logos = 'hashofthewp';
	}

	/**
	 * @dev Set `where` value
	 * @param _where The new value to be set
	 */
	function setWhere(address _where) public onlyTheAO {
		where = _where;
	}
}
