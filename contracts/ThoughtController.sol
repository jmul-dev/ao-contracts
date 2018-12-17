pragma solidity ^0.4.24;

import './AOLibrary.sol';
import './Thought.sol';
import './NameFactory.sol';
import './Position.sol';
import './SafeMath.sol';

/**
 * @title ThoughtController
 */
contract ThoughtController {
	using SafeMath for uint256;

	address public nameFactoryAddress;
	address public positionAddress;
	NameFactory internal _nameFactory;
	Position internal _position;

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress, address _positionAddress) public {
		nameFactoryAddress = _nameFactoryAddress;
		positionAddress = _positionAddress;

		_nameFactory = NameFactory(nameFactoryAddress);
		_position = Position(positionAddress);
	}

	/**
	 * @dev Check if `_thoughtId` is a Thought
	 */
	modifier isThought(address _thoughtId) {
		require (AOLibrary.isThought(_thoughtId));
		_;
	}

	/**
	 * @dev Check if `_nameId` is a Name
	 */
	modifier isName(address _nameId) {
		require (AOLibrary.isName(_nameId));
		_;
	}

	/**
	 * @dev Check if msg.sender is the current advocate of a `_thoughtId`
	 */
	modifier onlyAdvocateOfThought(address _thoughtId) {
		require (AOLibrary.isAdvocateOfThought(msg.sender, _thoughtId));
		_;
	}

	/**
	 * @dev Check is msg.sender address is a Name
	 */
	 modifier senderIsName() {
		require (_nameFactory.ethAddressToNameId(msg.sender) != address(0));
		_;
	 }
}
