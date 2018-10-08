pragma solidity ^0.4.24;

import './ThoughtController.sol';

/**
 * @title ThoughtPosition
 *
 * The purpose of this contract is for Name to stake/unstake Position on a Thought
 */
contract ThoughtPosition is ThoughtController {
	// Event to be broadcasted to public when a Thought becomes a TAO, or no longer is a TAO
	// TAO is a Thought with Position that is not a Name
	event IsTAO(address indexed thoughtId, bool isTAO);

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress, address _positionAddress)
		ThoughtController(_nameFactoryAddress, _positionAddress) public {}

	/**
	 * @dev Check whether or not a Thought is a TAO
	 *		TAO is a Thought with Position that is not a Name
	 * @param _thoughtId The ID of the Thought
	 * @return true if it's a TAO, false otherwise.
	 */
	function isTAO(address _thoughtId) public view returns (bool) {
		return (_position.totalThoughtStakedBalance(_thoughtId) > 0);
	}

	/**
	 * @dev Name stakes Position on a Thought
	 * @param _thoughtId The ID of the Thought
	 * @param _positionAmount The amount of Position to stake
	 */
	function stakePosition(address _thoughtId, uint256 _positionAmount) public isThought(_thoughtId) senderIsName(msg.sender) {
		uint256 _previousStakedBalance = _position.totalThoughtStakedBalance(_thoughtId);
		require (_position.stake(_nameFactory.ethAddressToNameId(msg.sender), _thoughtId, _positionAmount));
		if (_previousStakedBalance == 0 && _position.totalThoughtStakedBalance(_thoughtId) > 0) {
			emit IsTAO(_thoughtId, true);
		}
	}

	/**
	 * @dev Name unstakes Position on a Thought
	 * @param _thoughtId The ID of the Thought
	 * @param _positionAmount The amount of Position to unstake
	 */
	function unstakePosition(address _thoughtId, uint256 _positionAmount) public isThought(_thoughtId) senderIsName(msg.sender) {
		uint256 _previousStakedBalance = _position.totalThoughtStakedBalance(_thoughtId);
		require (_position.unstake(_nameFactory.ethAddressToNameId(msg.sender), _thoughtId, _positionAmount));
		if (_previousStakedBalance > 0 && _position.totalThoughtStakedBalance(_thoughtId) == 0) {
			emit IsTAO(_thoughtId, false);
		}
	}
}
