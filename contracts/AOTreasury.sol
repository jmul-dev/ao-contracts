pragma solidity ^0.4.24;

import './SafeMath.sol';
import './developed.sol';
import './AOToken.sol';

/**
 * @title AOTreasury
 *
 * The purpose of this contract is to list all of the valid denominations of AO Token and do the conversion between denominations
 */
contract AOTreasury is developed {
	using SafeMath for uint256;

	bool public paused;
	bool public killed;

	struct Denomination {
		bytes8 name;
		address denominationAddress;
	}

	// Mapping from denomination index to Denomination object
	// The list is in order from lowest denomination to highest denomination
	// i.e, denominations[1] is the base denomination
	mapping (uint256 => Denomination) private denominations;

	// Mapping from denomination ID to index of denominations
	mapping (bytes8 => uint256) private denominationIndex;

	uint256 public totalDenominations;

	// Event to be broadcasted to public when a token exchange happens
	event Exchange(address indexed account, uint256 amount, bytes8 fromDenominationName, bytes8 toDenominationName);

	// Event to be broadcasted to public when emergency mode is triggered
	event EscapeHatch();

	/**
	 * @dev Constructor function
	 */
	constructor() public {}

	/**
	 * @dev Checks if contract is currently active
	 */
	modifier isActive {
		require (paused == false && killed == false);
		_;
	}

	/**
	 * @dev Checks if denomination is valid
	 */
	modifier isValidDenomination(bytes8 denominationName) {
		require (denominationIndex[denominationName] > 0 && denominations[denominationIndex[denominationName]].denominationAddress != address(0));
		_;
	}

	/***** DEVELOPER ONLY METHODS *****/
	/**
	 * @dev Developer pauses/unpauses contract
	 * @param _paused Either to pause contract or not
	 */
	function setPaused(bool _paused) public onlyDeveloper {
		paused = _paused;
	}

	/**
	 * @dev Developer triggers emergency mode.
	 *
	 */
	function escapeHatch() public onlyDeveloper {
		require (killed == false);
		killed = true;
		emit EscapeHatch();
	}

	/**
	 * @dev Developer adds denomination and the contract address associated with it
	 * @param denominationName The name of the denomination, i.e ao, kilo, mega, etc.
	 * @param denominationAddress The address of the denomination token
	 * @return true on success
	 */
	function addDenomination(bytes8 denominationName, address denominationAddress) public onlyDeveloper returns (bool) {
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
		denominations[totalDenominations].name = denominationName;
		denominations[totalDenominations].denominationAddress = denominationAddress;
		denominationIndex[denominationName] = totalDenominations;
		return true;
	}

	/**
	 * @dev Developer updates denomination address or activates/deactivates the denomination
	 * @param denominationName The name of the denomination, i.e ao, kilo, mega, etc.
	 * @param denominationAddress The address of the denomination token
	 * @return true on success
	 */
	function updateDenomination(bytes8 denominationName, address denominationAddress) public onlyDeveloper returns (bool) {
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
		denominations[denominationIndex[denominationName]].denominationAddress = denominationAddress;
		return true;
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Get denomination info based on name
	 * @param denominationName The name to be queried
	 * @return the denomination short name
	 * @return the denomination address
	 * @return the denomination public name
	 * @return the denomination symbol
	 * @return the denomination num of decimals
	 * @return the denomination multiplier (power of ten)
	 */
	function getDenominationByName(bytes8 denominationName) public view returns (bytes8, address, string, string, uint8, uint256) {
		require (denominationName.length != 0);
		require (denominationIndex[denominationName] > 0);
		require (denominations[denominationIndex[denominationName]].denominationAddress != address(0));
		AOToken _ao = AOToken(denominations[denominationIndex[denominationName]].denominationAddress);
		return (
			denominations[denominationIndex[denominationName]].name,
			denominations[denominationIndex[denominationName]].denominationAddress,
			_ao.name(),
			_ao.symbol(),
			_ao.decimals(),
			_ao.powerOfTen()
		);
	}

	/**
	 * @dev Get denomination info by index
	 * @param index The index to be queried
	 * @return the denomination short name
	 * @return the denomination address
	 * @return the denomination public name
	 * @return the denomination symbol
	 * @return the denomination num of decimals
	 * @return the denomination multiplier (power of ten)
	 */
	function getDenominationByIndex(uint256 index) public view returns (bytes8, address, string, string, uint8, uint256) {
		require (index > 0 && index <= totalDenominations);
		require (denominations[index].denominationAddress != address(0));
		AOToken _ao = AOToken(denominations[index].denominationAddress);
		return (
			denominations[index].name,
			denominations[index].denominationAddress,
			_ao.name(),
			_ao.symbol(),
			_ao.decimals(),
			_ao.powerOfTen()
		);
	}

	/**
	 * @dev Get base denomination info
	 * @return the denomination short name
	 * @return the denomination address
	 * @return the denomination public name
	 * @return the denomination symbol
	 * @return the denomination num of decimals
	 * @return the denomination multiplier (power of ten)
	 */
	function getBaseDenomination() public view returns (bytes8, address, string, string, uint8, uint256) {
		require (totalDenominations > 1);
		return getDenominationByIndex(1);
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
	function exchange(uint256 amount, bytes8 fromDenominationName, bytes8 toDenominationName) public isActive isValidDenomination(fromDenominationName) isValidDenomination(toDenominationName) {
		require (amount > 0);
		Denomination memory _fromDenomination = denominations[denominationIndex[fromDenominationName]];
		Denomination memory _toDenomination = denominations[denominationIndex[toDenominationName]];
		AOToken _fromDenominationToken = AOToken(_fromDenomination.denominationAddress);
		AOToken _toDenominationToken = AOToken(_toDenomination.denominationAddress);
		require (_fromDenominationToken.whitelistBurnFrom(msg.sender, amount));
		require (_toDenominationToken.mintToken(msg.sender, amount));
		emit Exchange(msg.sender, amount, fromDenominationName, toDenominationName);
	}

	/**
	 * @dev Return the highest possible denomination given a base amount
	 * @param amount The amount to be converted
	 * @return the denomination short name
	 * @return the denomination address
	 * @return the integer amount at the denomination level
	 * @return the fraction amount at the denomination level
	 * @return the denomination public name
	 * @return the denomination symbol
	 * @return the denomination num of decimals
	 * @return the denomination multiplier (power of ten)
	 */
	function toHighestDenomination(uint256 amount) public view returns (bytes8, address, uint256, uint256, string, string, uint8, uint256) {
		uint256 integerAmount;
		uint256 fractionAmount;
		uint256 index;
		for (uint256 i=totalDenominations; i>0; i--) {
			Denomination memory _denomination = denominations[i];
			(integerAmount, fractionAmount) = fromBase(amount, _denomination.name);
			if (integerAmount > 0) {
				index = i;
				break;
			}
		}
		require (index > 0 && index <= totalDenominations);
		require (integerAmount > 0 || fractionAmount > 0);
		require (denominations[index].denominationAddress != address(0));
		AOToken _ao = AOToken(denominations[index].denominationAddress);
		return (
			denominations[index].name,
			denominations[index].denominationAddress,
			integerAmount,
			fractionAmount,
			_ao.name(),
			_ao.symbol(),
			_ao.decimals(),
			_ao.powerOfTen()
		);
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
