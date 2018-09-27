pragma solidity ^0.4.24;

import './SafeMath.sol';
import './Logos.sol';
import './Ethos.sol';
import './Pathos.sol';
import './AntiLogos.sol';
import './AntiEthos.sol';
import './AntiPathos.sol';

/**
 * @title Thought
 */
contract Thought {
	using SafeMath for uint256;

	// Public variables
	address public advocate;
	address public listener;
	address public speaker;

	string public description;

	bool public accepted;
	bool public fulfilled;

	Logos internal _logos;
	Ethos internal _ethos;
	Pathos internal _pathos;
	AntiLogos internal _antiLogos;
	AntiEthos internal _antiEthos;
	AntiPathos internal _antiPathos;

	// Mapping from ThoughtCurrency name to its total amount in this Thought
	mapping (bytes32 => uint256) public totalThoughtCurrency;

	// Mapping from a Name address to its ThoughtCurrency amount in this Thought
	mapping (address => mapping (bytes32 => uint256)) public nameThoughtCurrencyAmount;

	// Event to be broadcasted to public when ThoughtCurrencies are added to this Thought
	event ThoughtCurrencyAdded(address indexed from, bytes32 thoughtCurrencyName, uint256 amount);

	// Event to be broadcasted to public when ThoughtCurrencies are removed to this Thought
	event ThoughtCurrencyRemoved(address indexed from, bytes32 thoughtCurrencyName, uint256 amount);

	/**
	 * Constructor function
	 */
	constructor (address _advocate, string _description, address _logosAddress, address _ethosAddress, address _pathosAddress, address _antiLogosAddress, address _antiEthosAddress, address _antiPathosAddress) public {
		advocate = _advocate;
		description = _description;

		_logos = Logos(_logosAddress);
		_ethos = Ethos(_ethosAddress);
		_pathos = Pathos(_pathosAddress);
		_antiLogos = AntiLogos(_antiLogosAddress);
		_antiEthos = AntiEthos(_antiEthosAddress);
		_antiPathos = AntiPathos(_antiPathosAddress);
	}

	modifier onlyAdvocate {
		require(msg.sender == advocate);
		_;
	}

	modifier onlyListener {
		require(msg.sender == listener);
		_;
	}

	modifier onlySpeaker {
		require(msg.sender == speaker);
		_;
	}

	modifier isValidThoughtCurrency(bytes32 name) {
		require(name == 'logos' ||
			name == 'ethos' ||
			name == 'pathos' ||
			name == 'antilogos' ||
			name == 'antiethos' ||
			name == 'antipathos'
		);
		_;
	}

	/***** Advocate Only Methods *****/
	/**
	 * @dev Advocate sets new advocate of the Thought
	 * @param _advocate The address of the new advocate
	 */
	function setAdvocate(address _advocate) public onlyAdvocate {
		require (_advocate != address(0));
		advocate = _advocate;
	}

	/**
	 * @dev Advocate sets new listener of the Thought
	 * @param _listener The address of the new listener
	 */
	function setListener(address _listener) public onlyAdvocate {
		require (_listener != address(0));
		listener = _listener;
	}

	/**
	 * @dev Advocate sets new speaker of the Thought
	 * @param _speaker The address of the new speaker
	 */
	function setSpeaker(address _speaker) public onlyAdvocate {
		require (_speaker != address(0));
		speaker = _speaker;
	}

	/***** Public Methods *****/
	/**
	 * @dev Name adds ThoughtCurrency to this Thought
	 * @param _thoughtCurrencyName The name of the ThoughtCurrency, i.e logos, ethos, pathos, antilogos, antiethos, antipathos
	 * @param _amount The amount of ThoughtCurrency to be added
	 * @return true on success
	 */
	function addThoughtCurrency(bytes32 _thoughtCurrencyName, uint256 _amount) public isValidThoughtCurrency(_thoughtCurrencyName) returns (bool) {
		ThoughtCurrency _thoughtCurrency;
		if (_thoughtCurrencyName == 'logos') {
			_thoughtCurrency = _logos;
		} else if (_thoughtCurrencyName == 'ethos') {
			_thoughtCurrency = _ethos;
		} else if (_thoughtCurrencyName == 'pathos') {
			_thoughtCurrency = _pathos;
		} else if (_thoughtCurrencyName == 'antilogos') {
			_thoughtCurrency = _antiLogos;
		} else if (_thoughtCurrencyName == 'antiethos') {
			_thoughtCurrency = _antiEthos;
		} else {
			_thoughtCurrency = _antiPathos;
		}

		require (_thoughtCurrency.balanceOf(msg.sender) >= _amount);
		require (nameThoughtCurrencyAmount[msg.sender][_thoughtCurrencyName].add(_amount) <= _thoughtCurrency.balanceOf(msg.sender));

		totalThoughtCurrency[_thoughtCurrencyName] = totalThoughtCurrency[_thoughtCurrencyName].add(_amount);
		nameThoughtCurrencyAmount[msg.sender][_thoughtCurrencyName] = nameThoughtCurrencyAmount[msg.sender][_thoughtCurrencyName].add(_amount);

		emit ThoughtCurrencyAdded(msg.sender, _thoughtCurrencyName, _amount);
		return true;
	}

	/**
	 * @dev Name removes ThoughtCurrency from this Thought
	 * @param _thoughtCurrencyName The name of the ThoughtCurrency, i.e logos, ethos, pathos, antilogos, antiethos, antipathos
	 * @param _amount The amount of ThoughtCurrency to be removed
	 * @return true on success
	 */
	function removeThoughtCurrency(bytes32 _thoughtCurrencyName, uint256 _amount) public isValidThoughtCurrency(_thoughtCurrencyName) returns (bool) {
		ThoughtCurrency _thoughtCurrency;
		if (_thoughtCurrencyName == 'logos') {
			_thoughtCurrency = _logos;
		} else if (_thoughtCurrencyName == 'ethos') {
			_thoughtCurrency = _ethos;
		} else if (_thoughtCurrencyName == 'pathos') {
			_thoughtCurrency = _pathos;
		} else if (_thoughtCurrencyName == 'antilogos') {
			_thoughtCurrency = _antiLogos;
		} else if (_thoughtCurrencyName == 'antiethos') {
			_thoughtCurrency = _antiEthos;
		} else {
			_thoughtCurrency = _antiPathos;
		}

		require (nameThoughtCurrencyAmount[msg.sender][_thoughtCurrencyName] >= _amount);

		totalThoughtCurrency[_thoughtCurrencyName] = totalThoughtCurrency[_thoughtCurrencyName].sub(_amount);
		nameThoughtCurrencyAmount[msg.sender][_thoughtCurrencyName] = nameThoughtCurrencyAmount[msg.sender][_thoughtCurrencyName].sub(_amount);

		emit ThoughtCurrencyRemoved(msg.sender, _thoughtCurrencyName, _amount);
		return true;
	}
}
