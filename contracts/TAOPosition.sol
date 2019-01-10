pragma solidity ^0.4.24;

import './TAOController.sol';
import './Position.sol';

/**
 * @title TAOPosition
 *
 * The purpose of this contract is for Name to stake/unstake Position on a TAO
 */
contract TAOPosition is TAOController {
	address public positionAddress;

	Position internal _position;

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress, address _positionAddress)
		TAOController(_nameFactoryAddress) public {
		setPositionAddress(_positionAddress);
	}

	/***** The AO ONLY METHODS *****/
	/**
	 * @dev The AO set the Position Address
	 * @param _positionAddress The address of Position
	 */
	function setPositionAddress(address _positionAddress) public onlyTheAO {
		require (_positionAddress != address(0));
		positionAddress = _positionAddress;
		_position = Position(_positionAddress);
	}

	/***** PUBLIC METHODS *****/
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
