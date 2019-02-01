pragma solidity ^0.4.24;

import "./TAOCurrency.sol";
import "./INameTAOPosition.sol";

contract Logos is TAOCurrency {
	INameTAOPosition internal _nameTAOPosition;

	// Mapping of a Name ID to the amount of Logos positioned by others to itself
	// address is the address of nameId, not the eth public address
	mapping (address => uint256) public positionFromOthers;

	// Mapping of Name ID to other Name ID and the amount of Logos positioned by itself
	mapping (address => mapping(address => uint256)) public positionOnOthers;

	// Mapping of a Name ID to the total amount of Logos positioned by itself on others
	mapping (address => uint256) public totalPositionOnOthers;

	// Mapping of Name ID to it's advocated TAO ID and the amount of Logos earned
	mapping (address => mapping(address => uint256)) public advocatedTAOLogos;

	// Mapping of a Name ID to the total amount of Logos earned from advocated TAO
	mapping (address => uint256) public totalAdvocatedTAOLogos;

	// Event broadcasted to public when `from` address position `value` Logos to `to`
	event PositionFrom(address indexed from, address indexed to, uint256 value);

	// Event broadcasted to public when `from` address unposition `value` Logos from `to`
	event UnpositionFrom(address indexed from, address indexed to, uint256 value);

	// Event broadcasted to public when `nameId` receives `amount` of Logos from advocating `taoId`
	event AddAdvocatedTAOLogos(address indexed nameId, address indexed taoId, uint256 amount);

	// Event broadcasted to public when Logos from advocating `taoId` is transferred from `fromNameId` to `toNameId`
	event TransferAdvocatedTAOLogos(address indexed fromNameId, address indexed toNameId, address indexed taoId, uint256 amount);

	/**
	 * @dev Constructor function
	 */
	constructor(string _name, string _symbol, address _nameTAOPositionAddress)
		TAOCurrency(_name, _symbol, _nameTAOPositionAddress) public {
		setNameTAOPositionAddress(_nameTAOPositionAddress);
	}

	/**
	 * @dev Check if `_taoId` is a TAO
	 */
	modifier isTAO(address _taoId) {
		require (AOLibrary.isTAO(_taoId));
		_;
	}

	/**
	 * @dev Check if `_nameId` is a Name
	 */
	modifier isName(address _nameId) {
		require (AOLibrary.isName(_nameId));
		_;
	}

	/**
	 * @dev Check if msg.sender is the current advocate of _id
	 */
	modifier onlyAdvocate(address _id) {
		require (_nameTAOPosition.senderIsAdvocate(msg.sender, _id));
		_;
	}

	/***** THE AO ONLY METHODS *****/
	/**
	 * @dev The AO set the NameTAOPosition Address
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	function setNameTAOPositionAddress(address _nameTAOPositionAddress) public onlyTheAO {
		require (_nameTAOPositionAddress != address(0));
		nameTAOPositionAddress = _nameTAOPositionAddress;
		_nameTAOPosition = INameTAOPosition(_nameTAOPositionAddress);
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Get the total sum of Logos for an address
	 * @param _target The address to check
	 * @return The total sum of Logos (own + positioned + advocated TAOs)
	 */
	function sumBalanceOf(address _target) public isNameOrTAO(_target) view returns (uint256) {
		return balanceOf[_target].add(positionFromOthers[_target]).add(totalAdvocatedTAOLogos[_target]);
	}

	/**
	 * @dev Return the amount of Logos that are available to be positioned on other
	 * @param _sender The sender address to check
	 * @return The amount of Logos that are available to be positioned on other
	 */
	function availableToPositionAmount(address _sender) public view returns (uint256) {
		return balanceOf[_sender].sub(totalPositionOnOthers[_sender]);
	}

	/**
	 * @dev `_from` Name position `_value` Logos onto `_to` Name
	 *
	 * @param _from The address of the sender
	 * @param _to The address of the recipient
	 * @param _value the amount to position
	 * @return true on success
	 */
	function positionFrom(address _from, address _to, uint256 _value) public isName(_from) isName(_to) onlyAdvocate(_from) returns (bool) {
		require (_from != _to);	// Can't position Logos to itself
		require (availableToPositionAmount(_from) >= _value); // should have enough balance to position
		require (positionFromOthers[_to].add(_value) >= positionFromOthers[_to]); // check for overflows

		uint256 previousPositionToOthers = totalPositionOnOthers[_from];
		uint256 previousPositionFromOthers = positionFromOthers[_to];
		uint256 previousAvailPositionBalance = balanceOf[_from].sub(totalPositionOnOthers[_from]);

		positionOnOthers[_from][_to] = positionOnOthers[_from][_to].add(_value);
		totalPositionOnOthers[_from] = totalPositionOnOthers[_from].add(_value);
		positionFromOthers[_to] = positionFromOthers[_to].add(_value);

		emit PositionFrom(_from, _to, _value);
		assert(totalPositionOnOthers[_from].sub(_value) == previousPositionToOthers);
		assert(positionFromOthers[_to].sub(_value) == previousPositionFromOthers);
		assert(balanceOf[_from].sub(totalPositionOnOthers[_from]) <= previousAvailPositionBalance);
		return true;
	}

	/**
	 * @dev `_from` Name unposition `_value` Logos from `_to` Name
	 *
	 * @param _from The address of the sender
	 * @param _to The address of the recipient
	 * @param _value the amount to unposition
	 * @return true on success
	 */
	function unpositionFrom(address _from, address _to, uint256 _value) public isName(_from) isName(_to) onlyAdvocate(_from) returns (bool) {
		require (_from != _to);	// Can't unposition Logos to itself
		require (positionOnOthers[_from][_to] >= _value);

		uint256 previousPositionToOthers = totalPositionOnOthers[_from];
		uint256 previousPositionFromOthers = positionFromOthers[_to];
		uint256 previousAvailPositionBalance = balanceOf[_from].sub(totalPositionOnOthers[_from]);

		positionOnOthers[_from][_to] = positionOnOthers[_from][_to].sub(_value);
		totalPositionOnOthers[_from] = totalPositionOnOthers[_from].sub(_value);
		positionFromOthers[_to] = positionFromOthers[_to].sub(_value);

		emit UnpositionFrom(_from, _to, _value);
		assert(totalPositionOnOthers[_from].add(_value) == previousPositionToOthers);
		assert(positionFromOthers[_to].add(_value) == previousPositionFromOthers);
		assert(balanceOf[_from].sub(totalPositionOnOthers[_from]) >= previousAvailPositionBalance);
		return true;
	}

	/**
	 * @dev Add `_amount` logos earned from advocating a TAO `_taoId` to its Advocate
	 * @param _taoId The ID of the advocated TAO
	 * @param _amount the amount to reward
	 * @return true on success
	 */
	function addAdvocatedTAOLogos(address _taoId, uint256 _amount) public inWhitelist isTAO(_taoId) returns (bool) {
		require (_amount > 0);
		address _nameId = _nameTAOPosition.getAdvocate(_taoId);

		advocatedTAOLogos[_nameId][_taoId] = advocatedTAOLogos[_nameId][_taoId].add(_amount);
		totalAdvocatedTAOLogos[_nameId] = totalAdvocatedTAOLogos[_nameId].add(_amount);

		emit AddAdvocatedTAOLogos(_nameId, _taoId, _amount);
		return true;
	}

	/**
	 * @dev Transfer logos earned from advocating a TAO `_taoId` from `_fromNameId` to the Advocate of `_taoId`
	 * @param _fromNameId The ID of the Name that sends the Logos
	 * @param _taoId The ID of the advocated TAO
	 * @return true on success
	 */
	function transferAdvocatedTAOLogos(address _fromNameId, address _taoId) public inWhitelist isName(_fromNameId) isTAO(_taoId) returns (bool) {
		address _toNameId = _nameTAOPosition.getAdvocate(_taoId);
		require (_fromNameId != _toNameId);
		require (totalAdvocatedTAOLogos[_fromNameId] >= advocatedTAOLogos[_fromNameId][_taoId]);

		uint256 _amount = advocatedTAOLogos[_fromNameId][_taoId];
		advocatedTAOLogos[_fromNameId][_taoId] = 0;
		totalAdvocatedTAOLogos[_fromNameId] = totalAdvocatedTAOLogos[_fromNameId].sub(_amount);
		advocatedTAOLogos[_toNameId][_taoId] = advocatedTAOLogos[_toNameId][_taoId].add(_amount);
		totalAdvocatedTAOLogos[_toNameId] = totalAdvocatedTAOLogos[_toNameId].add(_amount);

		emit TransferAdvocatedTAOLogos(_fromNameId, _toNameId, _taoId, _amount);
		return true;
	}
}
