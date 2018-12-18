pragma solidity ^0.4.24;

import './SafeMath.sol';
import './AOTreasury.sol';
import './AOContent.sol';
import './AOEarning.sol';
import './AOSettingAttribute.sol';
import './AOUintSetting.sol';
import './AOBoolSetting.sol';
import './AOAddressSetting.sol';
import './AOBytesSetting.sol';
import './AOStringSetting.sol';
import './Name.sol';
import './TAO.sol';
import './NameFactory.sol';
import './AOSetting.sol';
import './TAOCurrency.sol';

/**
 * @title AOLibrary
 */
library AOLibrary {
	using SafeMath for uint256;

	uint256 constant private _MULTIPLIER_DIVISOR = 10 ** 6; // 1000000 = 1
	uint256 constant private _PERCENTAGE_DIVISOR = 10 ** 6; // 100% = 1000000

	/**
	 * @dev Return the divisor used to correctly calculate percentage.
	 *		Percentage stored throughout AO contracts covers 4 decimals,
	 *		so 1% is 10000, 1.25% is 12500, etc
	 */
	function PERCENTAGE_DIVISOR() public pure returns (uint256) {
		return _PERCENTAGE_DIVISOR;
	}

	/**
	 * @dev Return the divisor used to correctly calculate multiplier.
	 *		Multiplier stored throughout AO contracts covers 6 decimals,
	 *		so 1 is 1000000, 0.023 is 23000, etc
	 */
	function MULTIPLIER_DIVISOR() public pure returns (uint256) {
		return _MULTIPLIER_DIVISOR;
	}

	/**
	 * @dev Check whether or not content creator can stake a content based on the provided params
	 * @param _treasuryAddress AO treasury contract address
	 * @param _networkIntegerAmount The integer amount of network token to stake
	 * @param _networkFractionAmount The fraction amount of network token to stake
	 * @param _denomination The denomination of the network token, i.e ao, kilo, mega, etc.
	 * @param _primordialAmount The amount of primordial Token to stake
	 * @param _baseChallenge The base challenge string (PUBLIC KEY) of the content
	 * @param _encChallenge The encrypted challenge string (PUBLIC KEY) of the content unique to the host
	 * @param _contentDatKey The dat key of the content
	 * @param _metadataDatKey The dat key of the content's metadata
	 * @param _fileSize The size of the file
	 * @param _profitPercentage The percentage of profit the stake owner's media will charge
	 * @return true if yes. false otherwise
	 */
	function canStake(address _treasuryAddress,
		uint256 _networkIntegerAmount,
		uint256 _networkFractionAmount,
		bytes8 _denomination,
		uint256 _primordialAmount,
		string _baseChallenge,
		string _encChallenge,
		string _contentDatKey,
		string _metadataDatKey,
		uint256 _fileSize,
		uint256 _profitPercentage) public view returns (bool) {
		return (
			bytes(_baseChallenge).length > 0 &&
			bytes(_encChallenge).length > 0 &&
			bytes(_contentDatKey).length > 0 &&
			bytes(_metadataDatKey).length > 0 &&
			_fileSize > 0 &&
			(_networkIntegerAmount > 0 || _networkFractionAmount > 0 || _primordialAmount > 0) &&
			_stakeAmountValid(_treasuryAddress, _networkIntegerAmount, _networkFractionAmount, _denomination, _primordialAmount, _fileSize) == true &&
			_profitPercentage <= _PERCENTAGE_DIVISOR
		);
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
	 * @param _isAOContentUsageType whether or not the content is of AO Content usage type
	 * @param _fileSize The size of the file
	 * @param _stakedAmount The total staked amount
	 * @param _networkIntegerAmount The integer amount of the network token
	 * @param _networkFractionAmount The fraction amount of the network token
	 * @param _denomination The denomination of the the network token
	 * @param _primordialAmount The amount of primordial token
	 * @return true when the amount is sufficient, false otherwise
	 */
	function canStakeExisting(
		address _treasuryAddress,
		bool _isAOContentUsageType,
		uint256 _fileSize,
		uint256 _stakedAmount,
		uint256 _networkIntegerAmount,
		uint256 _networkFractionAmount,
		bytes8 _denomination,
		uint256 _primordialAmount
	) public view returns (bool) {
		if (_isAOContentUsageType) {
			return AOTreasury(_treasuryAddress).toBase(_networkIntegerAmount, _networkFractionAmount, _denomination).add(_primordialAmount).add(_stakedAmount) >= _fileSize;
		} else {
			return AOTreasury(_treasuryAddress).toBase(_networkIntegerAmount, _networkFractionAmount, _denomination).add(_primordialAmount).add(_stakedAmount) == _fileSize;
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
		return AOTreasury(_treasuryAddress).toBase(_networkIntegerAmount, _networkFractionAmount, _denomination) >= _price;
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
	 * @dev Return the address that signed the message when a node wants to become a host
	 * @param _callingContractAddress the address of the calling contract
	 * @param _message the message that was signed
	 * @param _v part of the signature
	 * @param _r part of the signature
	 * @param _s part of the signature
	 * @return the address that signed the message
	 */
	function getBecomeHostSignatureAddress(address _callingContractAddress, string _message, uint8 _v, bytes32 _r, bytes32 _s) public pure returns (address) {
		bytes32 _hash = keccak256(abi.encodePacked(_callingContractAddress, _message));
		return ecrecover(_hash, _v, _r, _s);
	}

	/**
	 * @dev Return the address that signed the TAO content state update
	 * @param _callingContractAddress the address of the calling contract
	 * @param _contentId the ID of the content
	 * @param _taoId the ID of the TAO
	 * @param _taoContentState the TAO Content State value, i.e Submitted, Pending Review, or Accepted to TAO
	 * @param _v part of the signature
	 * @param _r part of the signature
	 * @param _s part of the signature
	 * @return the address that signed the message
	 */
	function getUpdateTAOContentStateSignatureAddress(address _callingContractAddress, bytes32 _contentId, address _taoId, bytes32 _taoContentState, uint8 _v, bytes32 _r, bytes32 _s) public pure returns (address) {
		bytes32 _hash = keccak256(abi.encodePacked(_callingContractAddress, _contentId, _taoId, _taoContentState));
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
		(,, uint256 networkAmount, uint256 primordialAmount, uint256 primordialWeightedMultiplier,,,) = AOContent(_contentAddress).stakedContentById(_stakeId);
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
			 * Multiply multiplier with _MULTIPLIER_DIVISOR/_MULTIPLIER_DIVISOR to account for 6 decimals
			 * so, Multiplier = (_MULTIPLIER_DIVISOR/_MULTIPLIER_DIVISOR) * (1 - (temp / T)) * (S-E)
			 * Multiplier = ((_MULTIPLIER_DIVISOR * (1 - (temp / T))) * (S-E)) / _MULTIPLIER_DIVISOR
			 * Multiplier = ((_MULTIPLIER_DIVISOR - ((_MULTIPLIER_DIVISOR * temp) / T)) * (S-E)) / _MULTIPLIER_DIVISOR
			 * Take out the division by _MULTIPLIER_DIVISOR for now and include in later calculation
			 * Multiplier = (_MULTIPLIER_DIVISOR - ((_MULTIPLIER_DIVISOR * temp) / T)) * (S-E)
			 */
			uint256 multiplier = (_MULTIPLIER_DIVISOR.sub(_MULTIPLIER_DIVISOR.mul(temp).div(_totalPrimordialMintable))).mul(_startingMultiplier.sub(_endingMultiplier));
			/**
			 * Since _startingMultiplier and _endingMultiplier are in 6 decimals
			 * Need to divide multiplier by _MULTIPLIER_DIVISOR
			 */
			return multiplier.div(_MULTIPLIER_DIVISOR);
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
			 * Multiply B% with _PERCENTAGE_DIVISOR/_PERCENTAGE_DIVISOR to account for 6 decimals
			 * so, B% = (_PERCENTAGE_DIVISOR/_PERCENTAGE_DIVISOR) * (1 - (temp / T)) * (Bs-Be)
			 * B% = ((_PERCENTAGE_DIVISOR * (1 - (temp / T))) * (Bs-Be)) / _PERCENTAGE_DIVISOR
			 * B% = ((_PERCENTAGE_DIVISOR - ((_PERCENTAGE_DIVISOR * temp) / T)) * (Bs-Be)) / _PERCENTAGE_DIVISOR
			 * Take out the division by _PERCENTAGE_DIVISOR for now and include in later calculation
			 * B% = (_PERCENTAGE_DIVISOR - ((_PERCENTAGE_DIVISOR * temp) / T)) * (Bs-Be)
			 * But since Bs and Be are in 6 decimals, need to divide by _PERCENTAGE_DIVISOR
			 * B% = (_PERCENTAGE_DIVISOR - ((_PERCENTAGE_DIVISOR * temp) / T)) * (Bs-Be) / _PERCENTAGE_DIVISOR
			 */
			uint256 bonusPercentage = (_PERCENTAGE_DIVISOR.sub(_PERCENTAGE_DIVISOR.mul(temp).div(_totalPrimordialMintable))).mul(_startingMultiplier.sub(_endingMultiplier)).div(_PERCENTAGE_DIVISOR);
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
		 * Since bonusPercentage is in _PERCENTAGE_DIVISOR format, need to divide it with _PERCENTAGE DIVISOR
		 * when calculating the network token bonus amount
		 */
		uint256 networkTokenBonus = bonusPercentage.mul(_purchaseAmount).div(_PERCENTAGE_DIVISOR);
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

	/**
	 * @dev Get setting values by setting ID.
	 *		Will throw error if the setting is not exist or rejected.
	 * @param _aoSettingAttributeAddress The address of AOSettingAttribute
	 * @param _aoUintSettingAddress The address of AOUintSetting
	 * @param _aoBoolSettingAddress The address of AOBoolSetting
	 * @param _aoAddressSettingAddress The address of AOAddressSetting
	 * @param _aoBytesSettingAddress The address of AOBytesSetting
	 * @param _aoStringSettingAddress The address of AOStringSetting
	 * @param _settingId The ID of the setting
	 * @return the uint256 value of this setting ID
	 * @return the bool value of this setting ID
	 * @return the address value of this setting ID
	 * @return the bytes32 value of this setting ID
	 * @return the string value of this setting ID
	 */
	function getSettingValuesById(address _aoSettingAttributeAddress, address _aoUintSettingAddress, address _aoBoolSettingAddress, address _aoAddressSettingAddress, address _aoBytesSettingAddress, address _aoStringSettingAddress, uint256 _settingId) public view returns (uint256, bool, address, bytes32, string) {
		require (_settingExist(_aoSettingAttributeAddress, _settingId));

		_settingId = _getLatestSettingId(_aoSettingAttributeAddress, _settingId);
		return (
			AOUintSetting(_aoUintSettingAddress).settingValue(_settingId),
			AOBoolSetting(_aoBoolSettingAddress).settingValue(_settingId),
			AOAddressSetting(_aoAddressSettingAddress).settingValue(_settingId),
			AOBytesSetting(_aoBytesSettingAddress).settingValue(_settingId),
			AOStringSetting(_aoStringSettingAddress).settingValue(_settingId)
		);
	}

	/**
	 * @dev Check whether or not the given TAO ID is a TAO
	 * @param _taoId The ID of the TAO
	 * @return true if yes. false otherwise
	 */
	function isTAO(address _taoId) public view returns (bool) {
		return (_taoId != address(0) && TAO(_taoId).originId() != address(0) && TAO(_taoId).taoTypeId() == 0);
	}

	/**
	 * @dev Check whether or not the given Name ID is a Name
	 * @param _nameId The ID of the Name
	 * @return true if yes. false otherwise
	 */
	function isName(address _nameId) public view returns (bool) {
		return (_nameId != address(0) && Name(_nameId).originId() != address(0) && Name(_nameId).taoTypeId() == 1);
	}

	/**
	 * @dev Check whether or not _from address is Advocate/Listener/Speaker of the TAO
	 * @param _nameFactoryAddress The address of NameFactory
	 * @param _from The address that wants to update the TAO Content State
	 * @param _taoId The ID of the TAO
	 * @return true if yes. false otherwise
	 */
	function addressIsTAOAdvocateListenerSpeaker(address _nameFactoryAddress, address _from, address _taoId) public view returns (bool) {
		address _nameId = NameFactory(_nameFactoryAddress).ethAddressToNameId(_from);
		require (_nameId != address(0));
		require (isTAO(_taoId));
		return (_nameId == TAO(_taoId).advocateId() || _nameId == TAO(_taoId).listenerId() || _nameId == TAO(_taoId).speakerId());
	}

	/**
	 * @dev Get TAO Currency Balances given a nameId
	 * @param _nameId The ID of the Name
	 * @param _logosAddress The address of Logos
	 * @param _ethosAddress The address of Ethos
	 * @param _pathosAddress The address of Pathos
	 * @return Logos balance of the Name ID
	 * @return Ethos balance of the Name ID
	 * @return Pathos balance of the Name ID
	 */
	function getTAOCurrencyBalances(
		address _nameId,
		address _logosAddress,
		address _ethosAddress,
		address _pathosAddress
	) public view returns (uint256[]) {
		uint256[] memory balances = new uint256[](3);
		balances[0] = TAOCurrency(_logosAddress).balanceOf(_nameId);
		balances[1] = TAOCurrency(_ethosAddress).balanceOf(_nameId);
		balances[2] = TAOCurrency(_pathosAddress).balanceOf(_nameId);
		return balances;
	}

	/**
	 * @dev Get Anti TAO Currency Balances given a nameId
	 * @param _nameId The ID of the Name
	 * @param _antiLogosAddress The address of AntiLogos
	 * @param _antiEthosAddress The address of AntiEthos
	 * @param _antiPathosAddress The address of AntiPathos
	 * @return AntiLogos balance of the Name ID
	 * @return AntiEthos balance of the Name ID
	 * @return AntiPathos balance of the Name ID
	 */
	function getAntiTAOCurrencyBalances(
		address _nameId,
		address _antiLogosAddress,
		address _antiEthosAddress,
		address _antiPathosAddress
	) public view returns (uint256[]) {
		uint256[] memory balances = new uint256[](3);
		balances[0] = TAOCurrency(_antiLogosAddress).balanceOf(_nameId);
		balances[1] = TAOCurrency(_antiEthosAddress).balanceOf(_nameId);
		balances[2] = TAOCurrency(_antiPathosAddress).balanceOf(_nameId);
		return balances;
	}

	/**
	 * @dev Get all TAO/AntiTAO Currency Balances given a nameId
	 * @param _nameId The ID of the Name
	 * @param _logosAddress The address of Logos
	 * @param _ethosAddress The address of Ethos
	 * @param _pathosAddress The address of Pathos
	 * @param _antiLogosAddress The address of AntiLogos
	 * @param _antiEthosAddress The address of AntiEthos
	 * @param _antiPathosAddress The address of AntiPathos
	 * @return Logos balance of the Name ID
	 * @return Ethos balance of the Name ID
	 * @return Pathos balance of the Name ID
	 * @return AntiLogos balance of the Name ID
	 * @return AntiEthos balance of the Name ID
	 * @return AntiPathos balance of the Name ID
	 */
	function getAllTAOCurrencyBalances(
		address _nameId,
		address _logosAddress,
		address _ethosAddress,
		address _pathosAddress,
		address _antiLogosAddress,
		address _antiEthosAddress,
		address _antiPathosAddress
	) public view returns (uint256, uint256, uint256, uint256, uint256, uint256) {
		uint256[] memory taoCurrencyBalances = getTAOCurrencyBalances(_nameId, _logosAddress, _ethosAddress, _pathosAddress);
		uint256[] memory antiTAOCurrencyBalances = getAntiTAOCurrencyBalances(_nameId, _antiLogosAddress, _antiEthosAddress, _antiPathosAddress);
		return (
			taoCurrencyBalances[0],
			taoCurrencyBalances[1],
			taoCurrencyBalances[2],
			antiTAOCurrencyBalances[0],
			antiTAOCurrencyBalances[1],
			antiTAOCurrencyBalances[2]
		);
	}

	/**
	 * @dev Check if `_sender` address is the current advocate of a `_nameId`
	 *		Since there is no way to change the Advocate of a Name, the Advocate's eth address
	 *		is the same as the Name's Origin ID
	 * @param _sender The address to check
	 * @param _nameId The ID of the Name
	 * @return true if yes. false otherwise
	 */
	function isAdvocateOfName(address _sender, address _nameId) public view returns (bool) {
		return (Name(_nameId).originId() == _sender);
	}

	/**
	 * @dev Check if `_sender` address is the current advocate of a `_taoId`
	 * @param _sender The address to check
	 * @param _taoId The ID of the TAO
	 * @return true if yes. false otherwise
	 */
	function isAdvocateOfTAO(address _sender, address _taoId) public view returns (bool) {
		return (Name(TAO(_taoId).advocateId()).originId() == _sender);
	}

	/***** Internal Methods *****/
	/**
	 * @dev Check if a setting exist and not rejected
	 * @param _aoSettingAttributeAddress The address of AOSettingAttribute
	 * @param _settingId The ID of the setting
	 * @return true if exist. false otherwise
	 */
	function _settingExist(address _aoSettingAttributeAddress, uint256 _settingId) public view returns (bool) {
		(uint256 settingId,,,,,,,, bool _rejected,) = AOSettingAttribute(_aoSettingAttributeAddress).getSettingData(_settingId);
		return (settingId == _settingId && _rejected == false);
	}

	/**
	 * @dev Get the latest ID of a deprecated setting, if exist
	 * @param _aoSettingAttributeAddress The address of AOSettingAttribute
	 * @param _settingId The ID of the setting
	 * @return The latest setting ID
	 */
	function _getLatestSettingId(address _aoSettingAttributeAddress, uint256 _settingId) public view returns (uint256) {
		(,,,,,,, bool _migrated,, uint256 _newSettingId,,) = AOSettingAttribute(_aoSettingAttributeAddress).getSettingDeprecation(_settingId);
		while (_migrated && _newSettingId > 0) {
			_settingId = _newSettingId;
			(,,,,,,, _migrated,, _newSettingId,,) = AOSettingAttribute(_aoSettingAttributeAddress).getSettingDeprecation(_settingId);
		}
		return _settingId;
	}

	/**
	 * @dev Check whether the network token and/or primordial token is adequate to pay for the filesize
	 * @param _treasuryAddress AO treasury contract address
	 * @param _networkIntegerAmount The integer amount of network token to stake
	 * @param _networkFractionAmount The fraction amount of network token to stake
	 * @param _denomination The denomination of the network token, i.e ao, kilo, mega, etc.
	 * @param _primordialAmount The amount of primordial Token to stake
	 * @param _fileSize The size of the file
	 * @return true when the amount is sufficient, false otherwise
	 */
	function _stakeAmountValid(address _treasuryAddress, uint256 _networkIntegerAmount, uint256 _networkFractionAmount, bytes8 _denomination, uint256 _primordialAmount, uint256 _fileSize) internal view returns (bool) {
		return AOTreasury(_treasuryAddress).toBase(_networkIntegerAmount, _networkFractionAmount, _denomination).add(_primordialAmount) >= _fileSize;
	}
}
