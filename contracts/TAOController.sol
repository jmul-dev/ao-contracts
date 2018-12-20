pragma solidity ^0.4.24;

import './AOLibrary.sol';
import './TAO.sol';
import './NameFactory.sol';
import './Position.sol';
import './SafeMath.sol';

/**
 * @title TAOController
 */
contract TAOController {
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
	 * @dev Check if `_taoId` is a TAO
	 */
	modifier isTAO(address _taoId) {
		require (AOLibrary.isTAO(_taoId));
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
	 * @dev Check if `_id` is a Name or a TAO
	 */
	modifier isNameOrTAO(address _id) {
		require (AOLibrary.isName(_id) || AOLibrary.isTAO(_id));
		_;
	}

	/**
	 * @dev Check if msg.sender is the current advocate of a `_taoId`
	 */
	modifier onlyAdvocateOfTAO(address _taoId) {
		require (AOLibrary.isAdvocateOfTAO(msg.sender, _taoId));
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
