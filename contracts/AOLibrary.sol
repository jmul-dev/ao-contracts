pragma solidity ^0.4.24;

import './SafeMath.sol';
import './AOTreasury.sol';

/**
 * @title AOLibrary
 */
library AOLibrary {
	using SafeMath for uint256;

	/**
	 * @dev Check whether the network token and/or primordial token is adequate to pay for the filesize
	 * @param _treasuryAddress AO treasury contract address
	 * @param _networkIntegerAmount The integer amount of the network token
	 * @param _networkFractionAmount The fraction amount of the network token
	 * @param _denomination The denomination of the the network token
	 * @param _primordialAmount The amount of primordial token
	 * @param _fileSize The file size of the content
	 * @return true when the amount is sufficient, false otherwise
	 */
	function canStake(address _treasuryAddress, uint256 _networkIntegerAmount, uint256 _networkFractionAmount, bytes8 _denomination, uint256 _primordialAmount, uint256 _fileSize) public view returns (bool) {
		if (_denomination.length > 0 && (_networkIntegerAmount > 0 || _networkFractionAmount > 0)) {
			if (AOTreasury(_treasuryAddress).toBase(_networkIntegerAmount, _networkFractionAmount, _denomination).add(_primordialAmount) >= _fileSize) {
				return true;
			} else {
				return false;
			}
		} else if (_primordialAmount >= _fileSize) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * @dev Check whether or the requested unstake amount is valid
	 * @param _treasuryAddress AO treasury contract address
	 * @param _networkIntegerAmount The integer amount of the network token
	 * @param _networkFractionAmount The fraction amount of the network token
	 * @param _denomination The denomination of the the network token
	 * @param _primordialAmount The amount of primordial token
	 * @param _stakedNetworkAmount The current staked network token amount
	 * @param _stakedPrimordialAmount The current staked primordial token amount
	 * @param _stakedFileSize The file size of the staked content
	 * @return true if can unstake, false otherwise
	 */
	function canUnstakePartial(
		address _treasuryAddress,
		uint256 _networkIntegerAmount,
		uint256 _networkFractionAmount,
		bytes8 _denomination,
		uint256 _primordialAmount,
		uint256 _stakedNetworkAmount,
		uint256 _stakedPrimordialAmount,
		uint256 _stakedFileSize) public view returns (bool) {
		if (
			(_denomination.length > 0 &&
				(_networkIntegerAmount > 0 || _networkFractionAmount > 0) &&
				_stakedNetworkAmount < AOTreasury(_treasuryAddress).toBase(_networkIntegerAmount, _networkFractionAmount, _denomination)
			) ||
			_stakedPrimordialAmount < _primordialAmount ||
			(
				_denomination.length > 0
					&& (_networkIntegerAmount > 0 || _networkFractionAmount > 0)
					&& (_stakedNetworkAmount.sub(AOTreasury(_treasuryAddress).toBase(_networkIntegerAmount, _networkFractionAmount, _denomination)).add(_stakedPrimordialAmount.sub(_primordialAmount)) < _stakedFileSize)
			) ||
			( _denomination.length == 0 && _networkIntegerAmount == 0 && _networkFractionAmount == 0 && _primordialAmount > 0 && _stakedPrimordialAmount.sub(_primordialAmount) < _stakedFileSize)
		) {
			return false;
		} else {
			return true;
		}
	}

	/**
	 * @dev Check whether the network token and/or primordial token is adequate to pay for existing staked content
	 * @param _treasuryAddress AO treasury contract address
	 * @param _fileSize The size of the file
	 * @param _stakedAmount The total staked amount
	 * @param _networkIntegerAmount The integer amount of the network token
	 * @param _networkFractionAmount The fraction amount of the network token
	 * @param _denomination The denomination of the the network token
	 * @param _primordialAmount The amount of primordial token
	 * @return true when the amount is sufficient, false otherwise
	 */
	function canStakeExisting(address _treasuryAddress, uint256 _fileSize, uint256 _stakedAmount, uint256 _networkIntegerAmount, uint256 _networkFractionAmount, bytes8 _denomination, uint256 _primordialAmount) public view returns (bool) {
		if (_denomination.length > 0 && (_networkIntegerAmount > 0 || _networkFractionAmount > 0)) {
			return AOTreasury(_treasuryAddress).toBase(_networkIntegerAmount, _networkFractionAmount, _denomination).add(_primordialAmount).add(_stakedAmount) >= _fileSize;
		} else if (_primordialAmount > 0) {
			return _stakedAmount.add(_primordialAmount) >= _fileSize;
		} else {
			return false;
		}
	}

	/**
	 * @dev Check whether the network token and/or primordial token is adequate to pay for existing staked content
	 * @param _treasuryAddress AO treasury contract address
	 * @param _price The price of the content
	 * @param _networkIntegerAmount The integer amount of the network token
	 * @param _networkFractionAmount The fraction amount of the network token
	 * @param _denomination The denomination of the the network token
	 * @param _primordialAmount The amount of primordial token
	 * @return true when the amount is sufficient, false otherwise
	 */
	function canBuy(address _treasuryAddress, uint256 _price, uint256 _networkIntegerAmount, uint256 _networkFractionAmount, bytes8 _denomination, uint256 _primordialAmount) public view returns (bool) {
		if (_denomination.length > 0 && (_networkIntegerAmount > 0 || _networkFractionAmount > 0)) {
			return AOTreasury(_treasuryAddress).toBase(_networkIntegerAmount, _networkFractionAmount, _denomination).add(_primordialAmount) >= _price;
		} else if (_primordialAmount > 0) {
			return _primordialAmount >= _price;
		} else {
			return false;
		}
	}

	/**
	 * @dev Calculate the new weighted index when adding `_additionalPrimordialAmount` at `_additionalWeightedIdex` to the current `_currentPrimordialBalance` at `_currentWeightedIndex`
	 * @param _currentWeightedIndex Account's current weighted index
	 * @param _currentPrimordialBalance Account's current primordial token balance
	 * @param _additionalWeightedIndex The weighted index to be added
	 * @param _additionalPrimordialAmount The primordial token amount to be added
	 * @return the new primordial weighted index
	 */
	function calculateWeightedIndex(uint256 _currentWeightedIndex, uint256 _currentPrimordialBalance, uint256 _additionalWeightedIndex, uint256 _additionalPrimordialAmount) public pure returns (uint256) {
		if (_currentWeightedIndex > 0) {
			uint256 _totalWeightedTokens = (_currentWeightedIndex.mul(_currentPrimordialBalance)).add(_additionalWeightedIndex.mul(_additionalPrimordialAmount));
			uint256 _totalTokens = _currentPrimordialBalance.add(_additionalPrimordialAmount);
			return _totalWeightedTokens.div(_totalTokens);
		} else {
			return _additionalWeightedIndex;
		}
	}
}
