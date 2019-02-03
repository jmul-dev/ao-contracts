pragma solidity ^0.4.24;

import './TAOController.sol';
import './Voice.sol';

/**
 * @title TAOVoice
 *
 * The purpose of this contract is for Name to stake/unstake Voice on a TAO
 */
contract TAOVoice is TAOController {
	address public voiceAddress;

	Voice internal _voice;

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress, address _voiceAddress, address _nameTAOPositionAddress)
		TAOController(_nameFactoryAddress) public {
		setVoiceAddress(_voiceAddress);
		setNameTAOPositionAddress(_nameTAOPositionAddress);
	}

	/***** The AO ONLY METHODS *****/
	/**
	 * @dev The AO set the Voice Address
	 * @param _voiceAddress The address of Voice
	 */
	function setVoiceAddress(address _voiceAddress) public onlyTheAO {
		require (_voiceAddress != address(0));
		voiceAddress = _voiceAddress;
		_voice = Voice(_voiceAddress);
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Name stakes Voice on a TAO
	 * @param _taoId The ID of the TAO
	 * @param _voiceAmount The amount of Voice to stake
	 */
	function stakeVoice(address _taoId, uint256 _voiceAmount) public isTAO(_taoId) senderIsName senderNameNotCompromised {
		require (_voice.stake(_nameFactory.ethAddressToNameId(msg.sender), _taoId, _voiceAmount));
	}

	/**
	 * @dev Name unstakes Voice on a TAO
	 * @param _taoId The ID of the TAO
	 * @param _voiceAmount The amount of Voice to unstake
	 */
	function unstakeVoice(address _taoId, uint256 _voiceAmount) public isTAO(_taoId) senderIsName senderNameNotCompromised {
		require (_voice.unstake(_nameFactory.ethAddressToNameId(msg.sender), _taoId, _voiceAmount));
	}
}
