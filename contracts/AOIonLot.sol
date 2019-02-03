pragma solidity ^0.4.24;

import './SafeMath.sol';
import './AOLibrary.sol';
import './TheAO.sol';
import './IAOIonLot.sol';

/**
 * @title AOIonLot
 */
contract AOIonLot is TheAO {
	using SafeMath for uint256;

	address public aoIonAddress;

	uint256 public totalLots;
	uint256 public totalBurnLots;
	uint256 public totalConvertLots;

	/**
	 * Stores Lot creation data (during network exchange)
	 */
	struct Lot {
		bytes32 lotId;
		uint256 multiplier;	// This value is in 10^6, so 1000000 = 1
		address lotOwner;
		uint256 amount;
	}

	/**
	 * Struct to store info when account burns primordial ion
	 */
	struct BurnLot {
		bytes32 burnLotId;
		address lotOwner;
		uint256 amount;
	}

	/**
	 * Struct to store info when account converts network ion to primordial ion
	 */
	struct ConvertLot {
		bytes32 convertLotId;
		address lotOwner;
		uint256 amount;
	}

	// Mapping from Lot ID to Lot object
	mapping (bytes32 => Lot) internal lots;

	// Mapping from Burn Lot ID to BurnLot object
	mapping (bytes32 => BurnLot) internal burnLots;

	// Mapping from Convert Lot ID to ConvertLot object
	mapping (bytes32 => ConvertLot) internal convertLots;

	// Mapping from owner to list of owned lot IDs
	mapping (address => bytes32[]) internal ownedLots;

	// Mapping from owner to list of owned burn lot IDs
	mapping (address => bytes32[]) internal ownedBurnLots;

	// Mapping from owner to list of owned convert lot IDs
	mapping (address => bytes32[]) internal ownedConvertLots;

	// Event to be broadcasted to public when a lot is created
	// multiplier value is in 10^6 to account for 6 decimal points
	event LotCreation(address indexed lotOwner, bytes32 indexed lotId, uint256 multiplier, uint256 primordialAmount, uint256 networkBonusAmount);

	// Event to be broadcasted to public when burn lot is created (when account burns primordial ions)
	event BurnLotCreation(address indexed lotOwner, bytes32 indexed burnLotId, uint256 burnAmount, uint256 multiplierAfterBurn);

	// Event to be broadcasted to public when convert lot is created (when account convert network ions to primordial ions)
	event ConvertLotCreation(address indexed lotOwner, bytes32 indexed convertLotId, uint256 convertAmount, uint256 multiplierAfterConversion);

	/**
	 * @dev Constructor function
	 */
	constructor(address _aoIonAddress, address _nameTAOPositionAddress) public {
		setAOIonAddress(_aoIonAddress);
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
	 * @dev Check if calling address is AOIon
	 */
	modifier onlyAOIon {
		require (msg.sender == aoIonAddress);
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
	 * @dev The AO set the AOIon Address
	 * @param _aoIonAddress The address of AOIon
	 */
	function setAOIonAddress(address _aoIonAddress) public onlyTheAO {
		require (_aoIonAddress != address(0));
		aoIonAddress = _aoIonAddress;
	}

	/**
	 * @dev The AO set the NameTAOPosition Address
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	function setNameTAOPositionAddress(address _nameTAOPositionAddress) public onlyTheAO {
		require (_nameTAOPositionAddress != address(0));
		nameTAOPositionAddress = _nameTAOPositionAddress;
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Create a lot with `primordialAmount` of primordial ions with `_multiplier` for an `account`
	 *		during network exchange, and reward `_networkBonusAmount` if exist
	 * @param _account Address of the lot owner
	 * @param _primordialAmount The amount of primordial ions to be stored in the lot
	 * @param _multiplier The multiplier for this lot in (10 ** 6)
	 * @param _networkBonusAmount The network ion bonus amount
	 * @return Created lot Id
	 */
	function createPrimordialLot(address _account, uint256 _primordialAmount, uint256 _multiplier, uint256 _networkBonusAmount) external onlyAOIon returns (bytes32) {
		return _createWeightedMultiplierLot(_account, _primordialAmount, _multiplier, _networkBonusAmount);
	}

	/**
	 * @dev Create a lot with `amount` of ions at `weightedMultiplier` for an `account`
	 * @param _account Address of lot owner
	 * @param _amount The amount of ions
	 * @param _weightedMultiplier The multiplier of the lot (in 10^6)
	 * @return bytes32 of new created lot ID
	 */
	function createWeightedMultiplierLot(address _account, uint256 _amount, uint256 _weightedMultiplier) external onlyAOIon returns (bytes32) {
		require (_account != address(0));
		require (_amount > 0);
		return _createWeightedMultiplierLot(_account, _amount, _weightedMultiplier, 0);
	}

	/**
	 * @dev Return the lot information at a given ID
	 * @param _lotId The lot ID in question
	 * @return id of the lot
	 * @return The lot owner address
	 * @return multiplier of the lot in (10 ** 6)
	 * @return Primordial ion amount in the lot
	 */
	function lotById(bytes32 _lotId) external view returns (bytes32, address, uint256, uint256) {
		Lot memory _lot = lots[_lotId];
		return (_lot.lotId, _lot.lotOwner, _lot.multiplier, _lot.amount);
	}

	/**
	 * @dev Return all lot IDs owned by an address
	 * @param _lotOwner The address of the lot owner
	 * @return array of lot IDs
	 */
	function lotIdsByAddress(address _lotOwner) public view returns (bytes32[]) {
		return ownedLots[_lotOwner];
	}

	/**
	 * @dev Return the total lots owned by an address
	 * @param _lotOwner The address of the lot owner
	 * @return total lots owner by the address
	 */
	function totalLotsByAddress(address _lotOwner) external view returns (uint256) {
		return ownedLots[_lotOwner].length;
	}

	/**
	 * @dev Return the lot information at a given index of the lots list of the requested owner
	 * @param _lotOwner The address owning the lots list to be accessed
	 * @param _index uint256 representing the index to be accessed of the requested lots list
	 * @return id of the lot
	 * @return The address of the lot owner
	 * @return multiplier of the lot in (10 ** 6)
	 * @return Primordial ion amount in the lot
	 */
	function lotOfOwnerByIndex(address _lotOwner, uint256 _index) public view returns (bytes32, address, uint256, uint256) {
		require (_index < ownedLots[_lotOwner].length);
		Lot memory _lot = lots[ownedLots[_lotOwner][_index]];
		return (_lot.lotId, _lot.lotOwner, _lot.multiplier, _lot.amount);
	}

	/**
	 * @dev Store burn lot information
	 * @param _account The address of the account
	 * @param _amount The amount of primordial ions to burn
	 * @param _multiplierAfterBurn The owner's weighted multiplier after burn
	 * @return true on success
	 */
	function createBurnLot(address _account, uint256 _amount, uint256 _multiplierAfterBurn) external onlyAOIon returns (bool) {
		totalBurnLots++;

		// Generate burn lot Id
		bytes32 burnLotId = keccak256(abi.encodePacked(this, _account, totalBurnLots));

		// Make sure no one owns this lot yet
		require (burnLots[burnLotId].lotOwner == address(0));

		BurnLot storage burnLot = burnLots[burnLotId];
		burnLot.burnLotId = burnLotId;
		burnLot.lotOwner = _account;
		burnLot.amount = _amount;
		ownedBurnLots[_account].push(burnLotId);
		emit BurnLotCreation(burnLot.lotOwner, burnLot.burnLotId, burnLot.amount, _multiplierAfterBurn);
		return true;
	}

	/**
	 * @dev Return all Burn Lot IDs owned by an address
	 * @param _lotOwner The address of the burn lot owner
	 * @return array of Burn Lot IDs
	 */
	function burnLotIdsByAddress(address _lotOwner) public view returns (bytes32[]) {
		return ownedBurnLots[_lotOwner];
	}

	/**
	 * @dev Return the total burn lots owned by an address
	 * @param _lotOwner The address of the burn lot owner
	 * @return total burn lots owner by the address
	 */
	function totalBurnLotsByAddress(address _lotOwner) public view returns (uint256) {
		return ownedBurnLots[_lotOwner].length;
	}

	/**
	 * @dev Return the burn lot information at a given ID
	 * @param _burnLotId The burn lot ID in question
	 * @return id of the lot
	 * @return The address of the burn lot owner
	 * @return Primordial ion amount in the burn lot
	 */
	function burnLotById(bytes32 _burnLotId) public view returns (bytes32, address, uint256) {
		BurnLot memory _burnLot = burnLots[_burnLotId];
		return (_burnLot.burnLotId, _burnLot.lotOwner, _burnLot.amount);
	}

	/**
	 * @dev Store convert lot information
	 * @param _account The address of the account
	 * @param _amount The amount to convert
	 * @param _multiplierAfterConversion The owner's weighted multiplier after conversion
	 * @return true on success
	 */
	function createConvertLot(address _account, uint256 _amount, uint256 _multiplierAfterConversion) external onlyAOIon returns (bool) {
		// Store convert lot info
		totalConvertLots++;

		// Generate convert lot Id
		bytes32 convertLotId = keccak256(abi.encodePacked(this, _account, totalConvertLots));

		// Make sure no one owns this lot yet
		require (convertLots[convertLotId].lotOwner == address(0));

		ConvertLot storage convertLot = convertLots[convertLotId];
		convertLot.convertLotId = convertLotId;
		convertLot.lotOwner = _account;
		convertLot.amount = _amount;
		ownedConvertLots[_account].push(convertLotId);
		emit ConvertLotCreation(convertLot.lotOwner, convertLot.convertLotId, convertLot.amount, _multiplierAfterConversion);
		return true;
	}

	/**
	 * @dev Return all Convert Lot IDs owned by an address
	 * @param _lotOwner The address of the convert lot owner
	 * @return array of Convert Lot IDs
	 */
	function convertLotIdsByAddress(address _lotOwner) public view returns (bytes32[]) {
		return ownedConvertLots[_lotOwner];
	}

	/**
	 * @dev Return the total convert lots owned by an address
	 * @param _lotOwner The address of the convert lot owner
	 * @return total convert lots owner by the address
	 */
	function totalConvertLotsByAddress(address _lotOwner) public view returns (uint256) {
		return ownedConvertLots[_lotOwner].length;
	}

	/**
	 * @dev Return the convert lot information at a given ID
	 * @param _convertLotId The convert lot ID in question
	 * @return id of the lot
	 * @return The address of the convert lot owner
	 * @return Primordial ion amount in the convert lot
	 */
	function convertLotById(bytes32 _convertLotId) public view returns (bytes32, address, uint256) {
		ConvertLot memory _convertLot = convertLots[_convertLotId];
		return (_convertLot.convertLotId, _convertLot.lotOwner, _convertLot.amount);
	}

	/***** INTERNAL METHOD *****/
	/**
	 * @dev Actual creating a lot with `amount` of ions at `weightedMultiplier` for an `account`
	 * @param _account Address of lot owner
	 * @param _amount The amount of ions
	 * @param _weightedMultiplier The multiplier of the lot (in 10^6)
	 * @param _networkBonusAmount The network ion bonus amount
	 * @return bytes32 of new created lot ID
	 */
	function _createWeightedMultiplierLot(address _account, uint256 _amount, uint256 _weightedMultiplier, uint256 _networkBonusAmount) internal returns (bytes32) {
		totalLots++;

		// Generate lotId
		bytes32 lotId = keccak256(abi.encodePacked(address(this), _account, totalLots));

		// Make sure no one owns this lot yet
		require (lots[lotId].lotOwner == address(0));

		Lot storage lot = lots[lotId];
		lot.lotId = lotId;
		lot.multiplier = _weightedMultiplier;
		lot.lotOwner = _account;
		lot.amount = _amount;
		ownedLots[_account].push(lotId);

		emit LotCreation(lot.lotOwner, lot.lotId, lot.multiplier, lot.amount, _networkBonusAmount);
		return lotId;
	}
}
