pragma solidity ^0.4.24;

import './Thought.sol';
import './Name.sol';
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
		require (Thought(_thoughtId).originNameId() != address(0) && Thought(_thoughtId).thoughtTypeId() == 0);
		_;
	}

	/**
	 * @dev Check if `_nameId` is a Name
	 */
	modifier isName(address _nameId) {
		require (Name(_nameId).originNameId() != address(0) && Name(_nameId).thoughtTypeId() == 1);
		_;
	}

	/**
	 * @dev Check if `_sender` address is the current advocate of a `_thoughtId`
	 */
	modifier onlyAdvocateOf(address _sender, address _thoughtId) {
		require (Name(Thought(_thoughtId).advocateId()).originNameId() == _sender);
		_;
	}

	/**
	 * @dev Check is `_sender` address is a Name
	 */
	 modifier senderIsName(address _sender) {
		require (_nameFactory.ethAddressToNameId(_sender) != address(0));
		_;
	 }
}
