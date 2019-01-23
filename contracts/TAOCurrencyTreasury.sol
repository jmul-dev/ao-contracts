pragma solidity ^0.4.24;

import './SafeMath.sol';
import './AOLibrary.sol';
import './TheAO.sol';
import './ITAOCurrencyTreasury.sol';
import './TAOCurrency.sol';
import './INameFactory.sol';

/**
 * @title TAOCurrency
 *
 * The purpose of this contract is to list all of the valid denominations of TAOCurrency and do the conversion between denominations
 */
contract TAOCurrencyTreasury is TheAO, ITAOCurrencyTreasury {
	using SafeMath for uint256;

	uint256 public totalDenominations;
	uint256 public totalDenominationExchanges;

	address public nameFactoryAddress;

	INameFactory internal _nameFactory;

	struct Denomination {
		bytes8 name;
		address denominationAddress;
	}

	struct DenominationExchange {
		bytes32 exchangeId;
		address nameId;			// The nameId that perform this exchange
		address fromDenominationAddress;	// The address of the from denomination
		address toDenominationAddress;		// The address of the target denomination
		uint256 amount;
	}

	// Mapping from denomination index to Denomination object
	// The list is in order from lowest denomination to highest denomination
	// i.e, denominations[1] is the base denomination
	mapping (uint256 => Denomination) internal denominations;

	// Mapping from denomination ID to index of denominations
	mapping (bytes8 => uint256) internal denominationIndex;

	// Mapping from exchange id to DenominationExchange object
	mapping (uint256 => DenominationExchange) internal denominationExchanges;
	mapping (bytes32 => uint256) internal denominationExchangeIdLookup;

	// Event to be broadcasted to public when a exchange between denominations happens
	event ExchangeDenomination(address indexed nameId, bytes32 indexed exchangeId, uint256 amount, address fromDenominationAddress, string fromDenominationSymbol, address toDenominationAddress, string toDenominationSymbol);

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress, address _nameTAOPositionAddress) public {
		setNameFactoryAddress(_nameFactoryAddress);
		setNameTAOPositionAddress(_nameTAOPositionAddress);
	}

	/**
	 * @dev Checks if the calling contract address is The AO
	 *		OR
	 *		If The AO is set to a Name/TAO, then check if calling address is the Advocate
	 */
	modifier onlyTheAO {
		require (AOLibrary.isTheAO(msg.sender, theAO, nameTAOPositionAddress));
		_;
	}

	/**
	 * @dev Checks if denomination is valid
	 */
	modifier isValidDenomination(bytes8 denominationName) {
		require (this.isDenominationExist(denominationName));
		_;
	}

	/***** The AO ONLY METHODS *****/
	/**
	 * @dev Transfer ownership of The AO to new address
	 * @param _theAO The new address to be transferred
	 */
	function transferOwnership(address _theAO) public onlyTheAO {
		require (_theAO != address(0));
		theAO = _theAO;
	}

	/**
	 * @dev Whitelist `_account` address to transact on behalf of others
	 * @param _account The address to whitelist
	 * @param _whitelist Either to whitelist or not
	 */
	function setWhitelist(address _account, bool _whitelist) public onlyTheAO {
		require (_account != address(0));
		whitelist[_account] = _whitelist;
	}

	/**
	 * @dev The AO set the NameTAOPosition Address
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	function setNameTAOPositionAddress(address _nameTAOPositionAddress) public onlyTheAO {
		require (_nameTAOPositionAddress != address(0));
		nameTAOPositionAddress = _nameTAOPositionAddress;
	}

	/**
	 * @dev The AO set the NameFactory Address
	 * @param _nameFactoryAddress The address of NameFactory
	 */
	function setNameFactoryAddress(address _nameFactoryAddress) public onlyTheAO {
		require (_nameFactoryAddress != address(0));
		nameFactoryAddress = _nameFactoryAddress;
		_nameFactory = INameFactory(_nameFactoryAddress);
	}

	/**
	 * @dev The AO adds denomination and the contract address associated with it
	 * @param denominationName The name of the denomination, i.e ao, kilo, mega, etc.
	 * @param denominationAddress The address of the denomination token
	 * @return true on success
	 */
	function addDenomination(bytes8 denominationName, address denominationAddress) public onlyTheAO returns (bool) {
		require (denominationName.length > 0);
		require (denominationName[0] != 0);
		require (denominationAddress != address(0));
		require (denominationIndex[denominationName] == 0);
		totalDenominations++;
		// Make sure the new denomination is higher than the previous
		if (totalDenominations > 1) {
			TAOCurrency _lastDenominationToken = TAOCurrency(denominations[totalDenominations - 1].denominationAddress);
			TAOCurrency _newDenominationToken = TAOCurrency(denominationAddress);
			require (_newDenominationToken.powerOfTen() > _lastDenominationToken.powerOfTen());
		}
		denominations[totalDenominations].name = denominationName;
		denominations[totalDenominations].denominationAddress = denominationAddress;
		denominationIndex[denominationName] = totalDenominations;
		return true;
	}

	/**
	 * @dev The AO updates denomination address or activates/deactivates the denomination
	 * @param denominationName The name of the denomination, i.e ao, kilo, mega, etc.
	 * @param denominationAddress The address of the denomination token
	 * @return true on success
	 */
	function updateDenomination(bytes8 denominationName, address denominationAddress) public onlyTheAO isValidDenomination(denominationName) returns (bool) {
		require (denominationAddress != address(0));
		uint256 _denominationNameIndex = denominationIndex[denominationName];
		TAOCurrency _newDenominationToken = TAOCurrency(denominationAddress);
		if (_denominationNameIndex > 1) {
			TAOCurrency _prevDenominationToken = TAOCurrency(denominations[_denominationNameIndex - 1].denominationAddress);
			require (_newDenominationToken.powerOfTen() > _prevDenominationToken.powerOfTen());
		}
		if (_denominationNameIndex < totalDenominations) {
			TAOCurrency _lastDenominationToken = TAOCurrency(denominations[totalDenominations].denominationAddress);
			require (_newDenominationToken.powerOfTen() < _lastDenominationToken.powerOfTen());
		}
		denominations[denominationIndex[denominationName]].denominationAddress = denominationAddress;
		return true;
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Check if denomination exist given a name
	 * @param denominationName The denomination name to check
	 * @return true if yes. false otherwise
	 */
	function isDenominationExist(bytes8 denominationName) external view returns (bool) {
		return (denominationName.length > 0 &&
			denominationName[0] != 0 &&
			denominationIndex[denominationName] > 0 &&
			denominations[denominationIndex[denominationName]].denominationAddress != address(0)
	   );
	}

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
	function getDenominationByName(bytes8 denominationName) public isValidDenomination(denominationName) view returns (bytes8, address, string, string, uint8, uint256) {
		TAOCurrency _tc = TAOCurrency(denominations[denominationIndex[denominationName]].denominationAddress);
		return (
			denominations[denominationIndex[denominationName]].name,
			denominations[denominationIndex[denominationName]].denominationAddress,
			_tc.name(),
			_tc.symbol(),
			_tc.decimals(),
			_tc.powerOfTen()
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
		TAOCurrency _tc = TAOCurrency(denominations[index].denominationAddress);
		return (
			denominations[index].name,
			denominations[index].denominationAddress,
			_tc.name(),
			_tc.symbol(),
			_tc.decimals(),
			_tc.powerOfTen()
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
		require (totalDenominations > 0);
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
	function toBase(uint256 integerAmount, uint256 fractionAmount, bytes8 denominationName) external view returns (uint256) {
		uint256 _fractionAmount = fractionAmount;
		if (this.isDenominationExist(denominationName) && (integerAmount > 0 || _fractionAmount > 0)) {
			Denomination memory _denomination = denominations[denominationIndex[denominationName]];
			TAOCurrency _denominationToken = TAOCurrency(_denomination.denominationAddress);
			uint8 fractionNumDigits = AOLibrary.numDigits(_fractionAmount);
			require (fractionNumDigits <= _denominationToken.decimals());
			uint256 baseInteger = integerAmount.mul(10 ** _denominationToken.powerOfTen());
			if (_denominationToken.decimals() == 0) {
				_fractionAmount = 0;
			}
			return baseInteger.add(_fractionAmount);
		} else {
			return 0;
		}
	}

	/**
	 * @dev convert token from base denomination to `denominationName` denomination,
	 *		in this case it's similar to web3.fromWei() functionality
	 * @param integerAmount uint256 of the base amount to be converted
	 * @param denominationName bytes8 name of the target token denomination
	 * @return uint256 of the converted integer amount in target denomination
	 * @return uint256 of the converted fraction amount in target denomination
	 */
	function fromBase(uint256 integerAmount, bytes8 denominationName) public view returns (uint256, uint256) {
		if (this.isDenominationExist(denominationName)) {
			Denomination memory _denomination = denominations[denominationIndex[denominationName]];
			TAOCurrency _denominationToken = TAOCurrency(_denomination.denominationAddress);
			uint256 denominationInteger = integerAmount.div(10 ** _denominationToken.powerOfTen());
			uint256 denominationFraction = integerAmount.sub(denominationInteger.mul(10 ** _denominationToken.powerOfTen()));
			return (denominationInteger, denominationFraction);
		} else {
			return (0, 0);
		}
	}

	/**
	 * @dev exchange `amount` token from `fromDenominationName` denomination to token in `toDenominationName` denomination
	 * @param amount The amount of token to exchange
	 * @param fromDenominationName The origin denomination
	 * @param toDenominationName The target denomination
	 */
	function exchangeDenomination(uint256 amount, bytes8 fromDenominationName, bytes8 toDenominationName) public isValidDenomination(fromDenominationName) isValidDenomination(toDenominationName) {
		address _nameId = _nameFactory.ethAddressToNameId(msg.sender);
		require (_nameId != address(0));
		require (amount > 0);
		Denomination memory _fromDenomination = denominations[denominationIndex[fromDenominationName]];
		Denomination memory _toDenomination = denominations[denominationIndex[toDenominationName]];
		TAOCurrency _fromDenominationCurrency = TAOCurrency(_fromDenomination.denominationAddress);
		TAOCurrency _toDenominationCurrency = TAOCurrency(_toDenomination.denominationAddress);
		require (_fromDenominationCurrency.whitelistBurnFrom(_nameId, amount));
		require (_toDenominationCurrency.mintToken(_nameId, amount));

		// Store the DenominationExchange information
		totalDenominationExchanges++;
		bytes32 _exchangeId = keccak256(abi.encodePacked(this, _nameId, totalDenominationExchanges));
		denominationExchangeIdLookup[_exchangeId] = totalDenominationExchanges;

		DenominationExchange storage _denominationExchange = denominationExchanges[totalDenominationExchanges];
		_denominationExchange.exchangeId = _exchangeId;
		_denominationExchange.nameId = _nameId;
		_denominationExchange.fromDenominationAddress = _fromDenomination.denominationAddress;
		_denominationExchange.toDenominationAddress = _toDenomination.denominationAddress;
		_denominationExchange.amount = amount;

		emit ExchangeDenomination(_nameId, _exchangeId, amount, _fromDenomination.denominationAddress, TAOCurrency(_fromDenomination.denominationAddress).symbol(), _toDenomination.denominationAddress, TAOCurrency(_toDenomination.denominationAddress).symbol());
	}

	/**
	 * @dev Get DenominationExchange information given an exchange ID
	 * @param _exchangeId The exchange ID to query
	 * @return The name ID that performed the exchange
	 * @return The from denomination address
	 * @return The to denomination address
	 * @return The from denomination symbol
	 * @return The to denomination symbol
	 * @return The amount exchanged
	 */
	function getDenominationExchangeById(bytes32 _exchangeId) public view returns (address, address, address, string, string, uint256) {
		require (denominationExchangeIdLookup[_exchangeId] > 0);
		DenominationExchange memory _denominationExchange = denominationExchanges[denominationExchangeIdLookup[_exchangeId]];
		return (
			_denominationExchange.nameId,
			_denominationExchange.fromDenominationAddress,
			_denominationExchange.toDenominationAddress,
			TAOCurrency(_denominationExchange.fromDenominationAddress).symbol(),
			TAOCurrency(_denominationExchange.toDenominationAddress).symbol(),
			_denominationExchange.amount
		);
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
		TAOCurrency _tc = TAOCurrency(denominations[index].denominationAddress);
		return (
			denominations[index].name,
			denominations[index].denominationAddress,
			integerAmount,
			fractionAmount,
			_tc.name(),
			_tc.symbol(),
			_tc.decimals(),
			_tc.powerOfTen()
		);
	}
}
