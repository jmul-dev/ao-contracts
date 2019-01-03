pragma solidity ^0.4.24;

import './TAOController.sol';
import './Position.sol';

/**
 * @title TAOPosition
 *
 * The purpose of this contract is for Name to stake/unstake Position on a TAO
 */
contract TAOPosition is TAOController {
	Position internal _position;
	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress, address _nameTAOPositionAddress, address _positionAddress)
		TAOController(_nameFactoryAddress, _nameTAOPositionAddress) public {
		_position = Position(_positionAddress);
	}

	/**
	 * @dev Name stakes Position on a TAO
	 * @param _taoId The ID of the TAO
	 * @param _positionAmount The amount of Position to stake
	 */
	function stakePosition(address _taoId, uint256 _positionAmount) public isTAO(_taoId) senderIsName() {
		require (_position.stake(_nameFactory.ethAddressToNameId(msg.sender), _taoId, _positionAmount));
	}

	/**
	 * @dev Name unstakes Position on a TAO
	 * @param _taoId The ID of the TAO
	 * @param _positionAmount The amount of Position to unstake
	 */
	function unstakePosition(address _taoId, uint256 _positionAmount) public isTAO(_taoId) senderIsName() {
		require (_position.unstake(_nameFactory.ethAddressToNameId(msg.sender), _taoId, _positionAmount));
	}
}
