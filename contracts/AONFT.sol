pragma solidity ^0.4.24;

import "./ERC721Token.sol";

contract AONFT is ERC721Token {
	uint256 public maxSupply = 1125899906842620;

	/**
	 * @dev constructor function
	 */
	constructor(string _name, string _symbol) ERC721Token(_name, _symbol) public {
	}
}
