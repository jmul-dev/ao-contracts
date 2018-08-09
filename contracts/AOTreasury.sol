pragma solidity ^0.4.24;

import './SafeMath.sol';
import './owned.sol';
import './AOToken.sol';

/**
 * @title AOTreasury
 *
 * The purpose of this contract is to list all of the valid denominations of AO Token and do the conversion between denominations
 */
contract AOTreasury is owned {
	using SafeMath for uint256;

	struct Denomination {
		bytes8 name;
		address denominationAddress;
		bool active;
	}

	// Mapping from denomination index to the Denomination object
	// The list is in order from lowest denomination to highest denomination
	// i.e, denominations[1] is the base denomination
	mapping (uint256 => Denomination) private denominations;

	// Mapping from denomination ID to index of denominations
	mapping (bytes8 => uint256) public denominationIndex;

	uint256 public totalDenominations;

	// Event to be broadcasted to public when a token exchange happens
	event Exchange(address indexed account, uint256 amount, bytes8 fromDenominationName, bytes8 toDenominationName);

	/**
	 * @dev Constructor function
	 */
	constructor() public {}

	modifier isValidDenomination(bytes8 denominationName) {
		require (denominationIndex[denominationName] > 0 && denominations[denominationIndex[denominationName]].active == true);
		_;
	}

	/***** OWNER ONLY METHODS *****/
	/**
	 * @dev Owner adds denomination and the contract address associated with it
	 * @param denominationName The name of the denomination, i.e ao, kilo, mega, etc.
	 * @param denominationAddress The address of the denomination token
	 * @return true on success
	 */
	function addDenomination(bytes8 denominationName, address denominationAddress) public onlyOwner returns (bool) {
		require (denominationName.length != 0);
		require (denominationAddress != address(0));
		require (denominationIndex[denominationName] == 0);
		totalDenominations++;
		// Make sure the new denomination is higher than the previous
		if (totalDenominations > 1) {
			AOToken _lastDenominationToken = AOToken(denominations[totalDenominations - 1].denominationAddress);
			AOToken _newDenominationToken = AOToken(denominationAddress);
			require (_newDenominationToken.powerOfTen() > _lastDenominationToken.powerOfTen());
		}
		Denomination storage _denomination = denominations[totalDenominations];
		_denomination.name = denominationName;
		_denomination.denominationAddress = denominationAddress;
		_denomination.active = true;
		denominationIndex[denominationName] = totalDenominations;
		return true;
	}

	/**
	 * @dev Owner updates denomination address or activates/deactivates the denomination
	 * @param denominationName The name of the denomination, i.e ao, kilo, mega, etc.
	 * @param denominationAddress The address of the denomination token
	 * @param active Either to activate/deactivate
	 * @return true on success
	 */
	function updateDenomination(bytes8 denominationName, address denominationAddress, bool active) public onlyOwner returns (bool) {
		require (denominationName.length != 0);
		require (denominationIndex[denominationName] > 0);
		require (denominationAddress != address(0));
		uint256 _denominationNameIndex = denominationIndex[denominationName];
		AOToken _newDenominationToken = AOToken(denominationAddress);
		if (_denominationNameIndex > 1) {
			AOToken _prevDenominationToken = AOToken(denominations[_denominationNameIndex - 1].denominationAddress);
			require (_newDenominationToken.powerOfTen() > _prevDenominationToken.powerOfTen());
		}
		if (_denominationNameIndex < totalDenominations) {
			AOToken _lastDenominationToken = AOToken(denominations[totalDenominations].denominationAddress);
			require (_newDenominationToken.powerOfTen() < _lastDenominationToken.powerOfTen());
		}
		Denomination storage _denomination = denominations[denominationIndex[denominationName]];
		_denomination.denominationAddress = denominationAddress;
		_denomination.active = active;
		return true;
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Get denomination info based on name
	 * @param denominationName The name to be queried
	 * @return address of the denomination
	 * @return current status of the denomination (active/inactive)
	 */
	function getDenomination(bytes8 denominationName) public view returns (address, bool) {
		require (denominationName.length != 0);
		require (denominationIndex[denominationName] > 0);
		Denomination memory _denomination = denominations[denominationIndex[denominationName]];
		return (_denomination.denominationAddress, _denomination.active);
	}

	/**
	 * @dev Get base denomination info
	 * @return name of the denomination
	 * @return address of the denomination
	 * @return current status of the denomination (active/inactive)
	 */
	function getBaseDenomination() public view returns (bytes8, address, bool) {
		require (totalDenominations > 1);
		Denomination memory _denomination = denominations[1];
		return (_denomination.name, _denomination.denominationAddress, _denomination.active);
	}

	/**
	 * @dev Return sum of account's total network balance from every denominations in base denomination
	 * @param _account The address to be check
	 * @return The total balance in base denomination
	 */
	function totalNetworkBalanceOf(address _account) public view returns (uint256) {
		uint256 totalBalance = 0;
		for (uint256 i=1; i <= totalDenominations; i++) {
			totalBalance = totalBalance.add(AOToken(denominations[i].denominationAddress).balanceOf(_account));
		}
		return totalBalance;
	}

	/**
	 * @dev Return sum of account's total staked network balance from every denominations in base denomination
	 * @param _account The address to be check
	 * @return The total staked balance in base denomination
	 */
	function totalNetworkStakedBalanceOf(address _account) public view returns (uint256) {
		uint256 totalStakedBalance = 0;
		for (uint256 i=1; i <= totalDenominations; i++) {
			totalStakedBalance = totalStakedBalance.add(AOToken(denominations[i].denominationAddress).stakedBalance(_account));
		}
		return totalStakedBalance;
	}

	/**
	 * @dev Return account's total primordial token balance
	 * @param _account The address to be check
	 * @return The total primordial balance
	 */
	function totalPrimordialBalanceOf(address _account) public view returns (uint256) {
		(, address baseDenominationAddress, ) = getBaseDenomination();
		return AOToken(baseDenominationAddress).icoBalanceOf(_account);
	}

	/**
	 * @dev Return account's total primordial staked token balance at weighted index
	 * @param _account The address to be check
	 * @param _weightedIndex The weighted index of the primordial token
	 * @return The total primordial staked balance
	 */
	function totalPrimordialStakedBalanceOf(address _account, uint256 _weightedIndex) public view returns (uint256) {
		(, address baseDenominationAddress, ) = getBaseDenomination();
		return AOToken(baseDenominationAddress).icoStakedBalance(_account, _weightedIndex);
	}

	/**
	 * @dev Given `integerAmount` and `fractionAmount` price at `denominationName`, return list of denominations and the amount to pay the price with
	 * @param sender The sender address
	 * @param totalAmount The amount to pay
	 * @return A list of denomination addresses as payment
	 * @return A list of denomination amounts for each denomination address payment
	 */
	function determinePayment(address sender, uint256 totalAmount) public view returns (address[], uint256[]) {
		uint256 totalPrice = totalAmount;
		uint256 totalPayment;
		require (totalNetworkBalanceOf(sender) >= totalPrice);
		address[] memory denominationAddress = new address[](totalDenominations);
		uint256[] memory paymentAmount = new uint256[](totalDenominations);

		if (totalPrice > 0) {
			for (uint256 i=totalDenominations; i>0; i--) {
				Denomination memory _denomination = denominations[i];
				if (_denomination.active == true) {
					uint256 tokenBalance = AOToken(_denomination.denominationAddress).balanceOf(sender);
					if (tokenBalance > 0) {
						if (tokenBalance >= totalPrice) {
							totalPayment = totalPrice;
							totalPrice = 0;
							// Since array index starts at 0, we need to subtract i with 1
							denominationAddress[i-1] = _denomination.denominationAddress;
							paymentAmount[i-1] = totalPayment;
							break;
						} else {
							totalPayment = totalPayment.add(tokenBalance);
							totalPrice = totalPrice.sub(tokenBalance);
							// Since array index starts at 0, we need to subtract i with 1
							denominationAddress[i-1] = _denomination.denominationAddress;
							paymentAmount[i-1] = tokenBalance;
						}
					}
				}
				if (totalPrice == 0) {
					break;
				}
			}
		}
		assert (totalPrice == 0);
		return (denominationAddress, paymentAmount);
	}

	/**
	 * @dev Given `integerAmount` and `fractionAmount` price at `denominationName`, return list of denominations and the amount to unstake the price with
	 * @param sender The sender address
	 * @param totalAmount The amount to unstake
	 * @return A list of denomination addresses to unstake
	 * @return A list of denomination amounts for each denomination address
	 */
	function determineUnstake(address sender, uint256 totalAmount) public view returns (address[], uint256[]) {
		uint256 totalPrice = totalAmount;
		uint256 totalUnstake;
		require (totalNetworkStakedBalanceOf(sender) >= totalPrice);
		address[] memory denominationAddress = new address[](totalDenominations);
		uint256[] memory unstakeAmount = new uint256[](totalDenominations);

		if (totalPrice > 0) {
			for (uint256 i=totalDenominations; i>0; i--) {
				Denomination memory _denomination = denominations[i];
				if (_denomination.active == true) {
					uint256 tokenStakedBalance = AOToken(_denomination.denominationAddress).stakedBalance(sender);
					if (tokenStakedBalance > 0) {
						if (tokenStakedBalance >= totalPrice) {
							totalUnstake = totalPrice;
							totalPrice = 0;
							// Since array index starts at 0, we need to subtract i with 1
							denominationAddress[i-1] = _denomination.denominationAddress;
							unstakeAmount[i-1] = totalUnstake;
							break;
						} else {
							totalUnstake = totalUnstake.add(tokenStakedBalance);
							totalPrice = totalPrice.sub(tokenStakedBalance);
							// Since array index starts at 0, we need to subtract i with 1
							denominationAddress[i-1] = _denomination.denominationAddress;
							unstakeAmount[i-1] = tokenStakedBalance;
						}
					}
				}
				if (totalPrice == 0) {
					break;
				}
			}
		}
		assert (totalPrice == 0);
		return (denominationAddress, unstakeAmount);
	}

	/**
	 * @dev convert token from `denominationName` denomination to base denomination,
	 *		in this case it's similar to web3.toWei() functionality
	 *
	 * Example:
	 * 9.1 Kilo should be entered as 9 integerAmount and 100 fractionAmount
	 * 9.02 Kilo should be entered as 9 integerAmount and 20 fractionAmount
	 * 9.001 Kilo should be entered as 9 integerAmount and 1 fractionAmount
	 *
	 * @param integerAmount uint256 of the integer amount to be converted
	 * @param fractionAmount uint256 of the frational amount to be converted
	 * @param denominationName bytes8 name of the token denomination
	 * @return uint256 converted amount in base denomination from target denomination
	 */
	function toBase(uint256 integerAmount, uint256 fractionAmount, bytes8 denominationName) public isValidDenomination(denominationName) view returns (uint256) {
		Denomination memory _denomination = denominations[denominationIndex[denominationName]];
		AOToken _denominationToken = AOToken(_denomination.denominationAddress);
		uint8 fractionNumDigits = _numDigits(fractionAmount);
		require (fractionNumDigits <= _denominationToken.decimals());
		uint256 baseInteger = integerAmount.mul(10 ** _denominationToken.powerOfTen());
		if (_denominationToken.decimals() == 0) {
			fractionAmount = 0;
		}
		return baseInteger.add(fractionAmount);
	}

	/**
	 * @dev convert token from base denomination to `denominationName` denomination,
	 *		in this case it's similar to web3.fromWei() functionality
	 * @param integerAmount uint256 of the base amount to be converted
	 * @param denominationName bytes8 name of the target token denomination
	 * @return uint256 of the converted integer amount in target denomination
	 * @return uint256 of the converted fraction amount in target denomination
	 */
	function fromBase(uint256 integerAmount, bytes8 denominationName) public isValidDenomination(denominationName) view returns (uint256, uint256) {
		Denomination memory _denomination = denominations[denominationIndex[denominationName]];
		AOToken _denominationToken = AOToken(_denomination.denominationAddress);
		uint256 denominationInteger = integerAmount.div(10 ** _denominationToken.powerOfTen());
		uint256 denominationFraction = integerAmount.sub(denominationInteger.mul(10 ** _denominationToken.powerOfTen()));
		return (denominationInteger, denominationFraction);
	}

	/**
	 * @dev exchange `amount` token from `fromDenominationName` denomination to token in `toDenominationName` denomination
	 * @param amount The amount of token to exchange
	 * @param fromDenominationName The origin denomination
	 * @param toDenominationName The target denomination
	 */
	function exchange(uint256 amount, bytes8 fromDenominationName, bytes8 toDenominationName) public isValidDenomination(fromDenominationName) isValidDenomination(toDenominationName) {
		require (amount > 0);
		Denomination memory _fromDenomination = denominations[denominationIndex[fromDenominationName]];
		Denomination memory _toDenomination = denominations[denominationIndex[toDenominationName]];
		AOToken _fromDenominationToken = AOToken(_fromDenomination.denominationAddress);
		AOToken _toDenominationToken = AOToken(_toDenomination.denominationAddress);
		require (_fromDenominationToken.whitelistBurnFrom(msg.sender, amount));
		require (_toDenominationToken.mintToken(msg.sender, amount));
		emit Exchange(msg.sender, amount, fromDenominationName, toDenominationName);
	}

	/***** Private functions *****/
	/**
	 * @dev count num of digits
	 * @param number uint256 of the nuumber to be checked
	 * @return uint8 num of digits
	 */
	function _numDigits(uint256 number) private pure returns (uint8) {
		uint8 digits = 0;
		while(number != 0) {
			number = number.div(10);
			digits++;
		}
		return digits;
	}
}
