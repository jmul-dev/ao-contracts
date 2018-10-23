pragma solidity ^0.4.24;

import './SafeMath.sol';
import './AOTreasury.sol';
import './AOContent.sol';
import './AOEarning.sol';

/**
 * @title AOLibrary
 */
library AOLibrary {
	using SafeMath for uint256;

	uint256 constant public MULTIPLIER_DIVISOR = 10 ** 6; // 1000000 = 1
	uint256 constant public PERCENTAGE_DIVISOR = 10 ** 6; // 100% = 1000000

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
	 * @dev Check whether the network token is adequate to pay for existing staked content
	 * @param _treasuryAddress AO treasury contract address
	 * @param _price The price of the content
	 * @param _networkIntegerAmount The integer amount of the network token
	 * @param _networkFractionAmount The fraction amount of the network token
	 * @param _denomination The denomination of the the network token
	 * @return true when the amount is sufficient, false otherwise
	 */
	function canBuy(address _treasuryAddress, uint256 _price, uint256 _networkIntegerAmount, uint256 _networkFractionAmount, bytes8 _denomination) public view returns (bool) {
		if (_denomination.length > 0 && (_networkIntegerAmount > 0 || _networkFractionAmount > 0)) {
			return AOTreasury(_treasuryAddress).toBase(_networkIntegerAmount, _networkFractionAmount, _denomination) >= _price;
		} else {
			return false;
		}
	}

	/**
	 * @dev Calculate the new weighted multiplier when adding `_additionalPrimordialAmount` at `_additionalWeightedMultiplier` to the current `_currentPrimordialBalance` at `_currentWeightedMultiplier`
	 * @param _currentWeightedMultiplier Account's current weighted multiplier
	 * @param _currentPrimordialBalance Account's current primordial token balance
	 * @param _additionalWeightedMultiplier The weighted multiplier to be added
	 * @param _additionalPrimordialAmount The primordial token amount to be added
	 * @return the new primordial weighted multiplier
	 */
	function calculateWeightedMultiplier(uint256 _currentWeightedMultiplier, uint256 _currentPrimordialBalance, uint256 _additionalWeightedMultiplier, uint256 _additionalPrimordialAmount) public pure returns (uint256) {
		if (_currentWeightedMultiplier > 0) {
			uint256 _totalWeightedTokens = (_currentWeightedMultiplier.mul(_currentPrimordialBalance)).add(_additionalWeightedMultiplier.mul(_additionalPrimordialAmount));
			uint256 _totalTokens = _currentPrimordialBalance.add(_additionalPrimordialAmount);
			return _totalWeightedTokens.div(_totalTokens);
		} else {
			return _additionalWeightedMultiplier;
		}
	}

	/**
	 * @dev Generate hash of the message
	 * @param _callingContractAddress the address of the calling contract
	 * @param _message the message to be hashed
	 * @return hash
	 */
	function doHash(address _callingContractAddress, string _message) public pure returns (bytes32) {
		return keccak256(abi.encodePacked(_callingContractAddress, _message));
	}

	/**
	 * @dev Return the address that signed the message
	 * @param _callingContractAddress the address of the calling contract
	 * @param _message the message that was signed
	 * @param _v part of the signature
	 * @param _r part of the signature
	 * @param _s part of the signature
	 * @return the address that signed the message
	 */
	function checkSignature(address _callingContractAddress, string _message, uint8 _v, bytes32 _r, bytes32 _s) public pure returns (address) {
		bytes32 _hash = doHash(_callingContractAddress, _message);
		return ecrecover(_hash, _v, _r, _s);
	}

	/**
	 * @dev Return the staking and earning information of a stake ID
	 * @param _contentAddress The address of AOContent
	 * @param _earningAddress The address of AOEarning
	 * @param _stakeId The ID of the staked content
	 * @return the network base token amount staked for this content
	 * @return the primordial token amount staked for this content
	 * @return the primordial weighted multiplier of the staked content
	 * @return the total earning from staking this content
	 * @return the total earning from hosting this content
	 * @return the total foundation earning of this content
	 */
	function getContentMetrics(address _contentAddress, address _earningAddress, bytes32 _stakeId) public view returns (uint256, uint256, uint256, uint256, uint256, uint256) {
		(uint256 networkAmount, uint256 primordialAmount, uint256 primordialWeightedMultiplier) = getStakingMetrics(_contentAddress, _stakeId);
		(uint256 totalStakeEarning, uint256 totalHostEarning, uint256 totalFoundationEarning) = getEarningMetrics(_earningAddress, _stakeId);
		return (
			networkAmount,
			primordialAmount,
			primordialWeightedMultiplier,
			totalStakeEarning,
			totalHostEarning,
			totalFoundationEarning
		);
	}

	/**
	 * @dev Return the staking information of a stake ID
	 * @param _contentAddress The address of AOContent
	 * @param _stakeId The ID of the staked content
	 * @return the network base token amount staked for this content
	 * @return the primordial token amount staked for this content
	 * @return the primordial weighted multiplier of the staked content
	 */
	function getStakingMetrics(address _contentAddress, bytes32 _stakeId) public view returns (uint256, uint256, uint256) {
		(,, uint256 networkAmount, uint256 primordialAmount, uint256 primordialWeightedMultiplier,,,,) = AOContent(_contentAddress).stakedContentById(_stakeId);
		return (
			networkAmount,
			primordialAmount,
			primordialWeightedMultiplier
		);
	}

	/**
	 * @dev Return the earning information of a stake ID
	 * @param _earningAddress The address of AOEarning
	 * @param _stakeId The ID of the staked content
	 * @return the total earning from staking this content
	 * @return the total earning from hosting this content
	 * @return the total foundation earning of this content
	 */
	function getEarningMetrics(address _earningAddress, bytes32 _stakeId) public view returns (uint256, uint256, uint256) {
		return (
			AOEarning(_earningAddress).totalStakedContentStakeEarning(_stakeId),
			AOEarning(_earningAddress).totalStakedContentHostEarning(_stakeId),
			AOEarning(_earningAddress).totalStakedContentFoundationEarning(_stakeId)
		);
	}

	/**
	 * @dev Calculate the primordial token multiplier on a given lot
	 *		Total Primordial Mintable = T
	 *		Total Primordial Minted = M
	 *		Starting Multiplier = S
	 *		Ending Multiplier = E
	 *		To Purchase = P
	 *		Multiplier for next Lot of Amount = (1 - ((M + P/2) / T)) x (S-E)
	 *
	 * @param _purchaseAmount The amount of primordial token intended to be purchased
	 * @param _totalPrimordialMintable Total Primordial token intable
	 * @param _totalPrimordialMinted Total Primordial token minted so far
	 * @param _startingMultiplier The starting multiplier in (10 ** 6)
	 * @param _endingMultiplier The ending multiplier in (10 ** 6)
	 * @return The multiplier in (10 ** 6)
	 */
	function calculatePrimordialMultiplier(uint256 _purchaseAmount, uint256 _totalPrimordialMintable, uint256 _totalPrimordialMinted, uint256 _startingMultiplier, uint256 _endingMultiplier) public pure returns (uint256) {
		if (_purchaseAmount > 0 && _purchaseAmount <= _totalPrimordialMintable.sub(_totalPrimordialMinted)) {
			/**
			 * Let temp = M + (P/2)
			 * Multiplier = (1 - (temp / T)) x (S-E)
			 */
			uint256 temp = _totalPrimordialMinted.add(_purchaseAmount.div(2));

			/**
			 * Multiply multiplier with MULTIPLIER_DIVISOR/MULTIPLIER_DIVISOR to account for 6 decimals
			 * so, Multiplier = (MULTIPLIER_DIVISOR/MULTIPLIER_DIVISOR) * (1 - (temp / T)) * (S-E)
			 * Multiplier = ((MULTIPLIER_DIVISOR * (1 - (temp / T))) * (S-E)) / MULTIPLIER_DIVISOR
			 * Multiplier = ((MULTIPLIER_DIVISOR - ((MULTIPLIER_DIVISOR * temp) / T)) * (S-E)) / MULTIPLIER_DIVISOR
			 * Take out the division by MULTIPLIER_DIVISOR for now and include in later calculation
			 * Multiplier = (MULTIPLIER_DIVISOR - ((MULTIPLIER_DIVISOR * temp) / T)) * (S-E)
			 */
			uint256 multiplier = (MULTIPLIER_DIVISOR.sub(MULTIPLIER_DIVISOR.mul(temp).div(_totalPrimordialMintable))).mul(_startingMultiplier.sub(_endingMultiplier));
			/**
			 * Since _startingMultiplier and _endingMultiplier are in 6 decimals
			 * Need to divide multiplier by MULTIPLIER_DIVISOR
			 */
			return multiplier.div(MULTIPLIER_DIVISOR);
		} else {
			return 0;
		}
	}

	/**
	 * @dev Calculate the bonus percentage of network token on a given lot
	 *		Total Primordial Mintable = T
	 *		Total Primordial Minted = M
	 *		Starting Network Token Bonus Multiplier = Bs
	 *		Ending Network Token Bonus Multiplier = Be
	 *		To Purchase = P
	 *		AO Bonus % = B% = (1 - ((M + P/2) / T)) x (Bs-Be)
	 *
	 * @param _purchaseAmount The amount of primordial token intended to be purchased
	 * @param _totalPrimordialMintable Total Primordial token intable
	 * @param _totalPrimordialMinted Total Primordial token minted so far
	 * @param _startingMultiplier The starting Network token bonus multiplier
	 * @param _endingMultiplier The ending Network token bonus multiplier
	 * @return The bonus percentage
	 */
	function calculateNetworkTokenBonusPercentage(uint256 _purchaseAmount, uint256 _totalPrimordialMintable, uint256 _totalPrimordialMinted, uint256 _startingMultiplier, uint256 _endingMultiplier) public pure returns (uint256) {
		if (_purchaseAmount > 0 && _purchaseAmount <= _totalPrimordialMintable.sub(_totalPrimordialMinted)) {
			/**
			 * Let temp = M + (P/2)
			 * B% = (1 - (temp / T)) x (Bs-Be)
			 */
			uint256 temp = _totalPrimordialMinted.add(_purchaseAmount.div(2));

			/**
			 * Multiply B% with PERCENTAGE_DIVISOR/PERCENTAGE_DIVISOR to account for 6 decimals
			 * so, B% = (PERCENTAGE_DIVISOR/PERCENTAGE_DIVISOR) * (1 - (temp / T)) * (Bs-Be)
			 * B% = ((PERCENTAGE_DIVISOR * (1 - (temp / T))) * (Bs-Be)) / PERCENTAGE_DIVISOR
			 * B% = ((PERCENTAGE_DIVISOR - ((PERCENTAGE_DIVISOR * temp) / T)) * (Bs-Be)) / PERCENTAGE_DIVISOR
			 * Take out the division by PERCENTAGE_DIVISOR for now and include in later calculation
			 * B% = (PERCENTAGE_DIVISOR - ((PERCENTAGE_DIVISOR * temp) / T)) * (Bs-Be)
			 * But since Bs and Be are in 6 decimals, need to divide by PERCENTAGE_DIVISOR
			 * B% = (PERCENTAGE_DIVISOR - ((PERCENTAGE_DIVISOR * temp) / T)) * (Bs-Be) / PERCENTAGE_DIVISOR
			 */
			uint256 bonusPercentage = (PERCENTAGE_DIVISOR.sub(PERCENTAGE_DIVISOR.mul(temp).div(_totalPrimordialMintable))).mul(_startingMultiplier.sub(_endingMultiplier)).div(PERCENTAGE_DIVISOR);
			return bonusPercentage;
		} else {
			return 0;
		}
	}

	/**
	 * @dev Calculate the bonus amount of network token on a given lot
	 *		AO Bonus Amount = B% x P
	 *
	 * @param _purchaseAmount The amount of primordial token intended to be purchased
	 * @param _totalPrimordialMintable Total Primordial token intable
	 * @param _totalPrimordialMinted Total Primordial token minted so far
	 * @param _startingMultiplier The starting Network token bonus multiplier
	 * @param _endingMultiplier The ending Network token bonus multiplier
	 * @return The bonus percentage
	 */
	function calculateNetworkTokenBonusAmount(uint256 _purchaseAmount, uint256 _totalPrimordialMintable, uint256 _totalPrimordialMinted, uint256 _startingMultiplier, uint256 _endingMultiplier) public pure returns (uint256) {
		uint256 bonusPercentage = calculateNetworkTokenBonusPercentage(_purchaseAmount, _totalPrimordialMintable, _totalPrimordialMinted, _startingMultiplier, _endingMultiplier);
		/**
		 * Since bonusPercentage is in PERCENTAGE_DIVISOR format, need to divide it with PERCENTAGE DIVISOR
		 * when calculating the network token bonus amount
		 */
		uint256 networkTokenBonus = bonusPercentage.mul(_purchaseAmount).div(PERCENTAGE_DIVISOR);
		return networkTokenBonus;
	}

	/**
	 * @dev Calculate the maximum amount of Primordial an account can burn
	 *		_primordialBalance = P
	 *		_currentWeightedMultiplier = M
	 *		_maximumMultiplier = S
	 *		_amountToBurn = B
	 *		B = ((S x P) - (P x M)) / S
	 *
	 * @param _primordialBalance Account's primordial token balance
	 * @param _currentWeightedMultiplier Account's current weighted multiplier
	 * @param _maximumMultiplier The maximum multiplier of this account
	 * @return The maximum burn amount
	 */
	function calculateMaximumBurnAmount(uint256 _primordialBalance, uint256 _currentWeightedMultiplier, uint256 _maximumMultiplier) public pure returns (uint256) {
		return (_maximumMultiplier.mul(_primordialBalance).sub(_primordialBalance.mul(_currentWeightedMultiplier))).div(_maximumMultiplier);
	}

	/**
	 * @dev Calculate the new multiplier after burning primordial token
	 *		_primordialBalance = P
	 *		_currentWeightedMultiplier = M
	 *		_amountToBurn = B
	 *		_newMultiplier = E
	 *		E = (P x M) / (P - B)
	 *
	 * @param _primordialBalance Account's primordial token balance
	 * @param _currentWeightedMultiplier Account's current weighted multiplier
	 * @param _amountToBurn The amount of primordial token to burn
	 * @return The new multiplier
	 */
	function calculateMultiplierAfterBurn(uint256 _primordialBalance, uint256 _currentWeightedMultiplier, uint256 _amountToBurn) public pure returns (uint256) {
		return _primordialBalance.mul(_currentWeightedMultiplier).div(_primordialBalance.sub(_amountToBurn));
	}

	/**
	 * @dev Calculate the new multiplier after converting network token to primordial token
	 *		_primordialBalance = P
	 *		_currentWeightedMultiplier = M
	 *		_amountToConvert = C
	 *		_newMultiplier = E
	 *		E = (P x M) / (P + C)
	 *
	 * @param _primordialBalance Account's primordial token balance
	 * @param _currentWeightedMultiplier Account's current weighted multiplier
	 * @param _amountToConvert The amount of network token to convert
	 * @return The new multiplier
	 */
	function calculateMultiplierAfterConversion(uint256 _primordialBalance, uint256 _currentWeightedMultiplier, uint256 _amountToConvert) public pure returns (uint256) {
		return _primordialBalance.mul(_currentWeightedMultiplier).div(_primordialBalance.add(_amountToConvert));
	}
}
