pragma solidity ^0.4.24;

import "./TAOCurrency.sol";

contract Logos is TAOCurrency {
	// Mapping of a TAO/Name ID to the amount of Logos positioned by others to itself
	// address is the address of nameId, not the eth public address
	mapping (address => uint256) public positionFromOthers;

	// Mapping of Name ID to other TAO/Name ID and the amount of Logos positioned by itself
	mapping (address => mapping(address => uint256)) public positionToOthers;

	// Mapping of a Name ID to the total amount of Logos positioned by itself to others
	mapping (address => uint256) public totalPositionToOthers;

	event PositionFrom(address indexed from, address indexed to, uint256 value);
	event UnpositionFrom(address indexed from, address indexed to, uint256 value);

	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol, bytes32 tokenInternalName)
		TAOCurrency(initialSupply, tokenName, tokenSymbol, tokenInternalName) public {}

	/**
	 * @dev Get the total sum of Logos for an address
	 * @param _target The address to check
	 * @return The total sum of Logos (own + positioned)
	 */
	function sumBalanceOf(address _target) public view returns (uint256) {
		return balanceOf[_target].add(positionFromOthers[_target]);
	}

	/**
	 * @dev Position `_value` tokens to `_to` in behalf of `_from`
	 *
	 * @param _from The address of the sender
	 * @param _to The address of the recipient
	 * @param _value the amount to position
	 */
	function positionFrom(address _from, address _to, uint256 _value) public inWhitelist(msg.sender) returns (bool) {
		require (_to != address(0));
		require (_from != _to);	// Can't position Logos to itself
		require (balanceOf[_from].sub(totalPositionToOthers[_from]) >= _value); // should have enough balance to position
		require (positionFromOthers[_to].add(_value) >= positionFromOthers[_to]); // check for overflows

		uint256 previousPositionToOthers = totalPositionToOthers[_from];
		uint256 previousPositionFromOthers = positionFromOthers[_to];
		uint256 previousAvailPositionBalance = balanceOf[_from].sub(totalPositionToOthers[_from]);

		positionToOthers[_from][_to] = positionToOthers[_from][_to].add(_value);
		totalPositionToOthers[_from] = totalPositionToOthers[_from].add(_value);
		positionFromOthers[_to] = positionFromOthers[_to].add(_value);

		emit PositionFrom(_from, _to, _value);
		assert(totalPositionToOthers[_from].sub(_value) == previousPositionToOthers);
		assert(positionFromOthers[_to].sub(_value) == previousPositionFromOthers);
		assert(balanceOf[_from].sub(totalPositionToOthers[_from]) <= previousAvailPositionBalance);
		return true;
	}

	/**
	 * @dev Unposition `_value` tokens from `_to` in behalf of `_from`
	 *
	 * @param _from The address of the sender
	 * @param _to The address of the recipient
	 * @param _value the amount to unposition
	 */
	function unpositionFrom(address _from, address _to, uint256 _value) public inWhitelist(msg.sender) returns (bool) {
		require (_to != address(0));
		require (_from != _to);	// Can't unposition Logos to itself
		require (positionToOthers[_from][_to] >= _value);

		uint256 previousPositionToOthers = totalPositionToOthers[_from];
		uint256 previousPositionFromOthers = positionFromOthers[_to];
		uint256 previousAvailPositionBalance = balanceOf[_from].sub(totalPositionToOthers[_from]);

		positionToOthers[_from][_to] = positionToOthers[_from][_to].sub(_value);
		totalPositionToOthers[_from] = totalPositionToOthers[_from].sub(_value);
		positionFromOthers[_to] = positionFromOthers[_to].sub(_value);

		emit UnpositionFrom(_from, _to, _value);
		assert(totalPositionToOthers[_from].add(_value) == previousPositionToOthers);
		assert(positionFromOthers[_to].add(_value) == previousPositionFromOthers);
		assert(balanceOf[_from].sub(totalPositionToOthers[_from]) >= previousAvailPositionBalance);
		return true;
	}
}
