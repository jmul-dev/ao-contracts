pragma solidity ^0.4.24;

import './AOLibrary.sol';
import './NameFactory.sol';
import './NameTAOPosition.sol';

/**
 * @title TAOController
 */
contract TAOController {
	NameFactory internal _nameFactory;
	NameTAOPosition internal _nameTAOPosition;

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress, address _nameTAOPositionAddress) public {
		_nameFactory = NameFactory(_nameFactoryAddress);
		_nameTAOPosition = NameTAOPosition(_nameTAOPositionAddress);
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
	 * @dev Check is msg.sender address is a Name
	 */
	 modifier senderIsName() {
		require (_nameFactory.ethAddressToNameId(msg.sender) != address(0));
		_;
	 }

	/**
	 * @dev Check if msg.sender is the current advocate of TAO ID
	 */
	modifier onlyAdvocate(address _id) {
		require (_nameTAOPosition.senderIsAdvocate(msg.sender, _id));
		_;
	}
}
