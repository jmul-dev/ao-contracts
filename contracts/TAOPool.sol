pragma solidity ^0.4.24;

import './SafeMath.sol';
import './TAOController.sol';
import './TAOCurrency.sol';
import './Logos.sol';
import './TAO.sol';

/**
 * @title TAOPool
 *
 * This contract acts as the bookkeeper of TAO Currencies that are staked on TAO
 */
contract TAOPool is TAOController {
	using SafeMath for uint256;

	address public taoFactoryAddress;
	address public pathosAddress;
	address public ethosAddress;
	address public logosAddress;

	TAOCurrency internal _pathos;
	TAOCurrency internal _ethos;
	Logos internal _logos;

	struct Pool {
		address taoId;
		/**
		 * If true, has ethos cap. Otherwise, no ethos cap.
		 */
		bool ethosCapStatus;
		uint256 ethosCapAmount;	// Creates a cap for the amount of Ethos that can be staked into this pool

		/**
		 * If true, Pool is live and can be staked into.
		 */
		bool status;
	}

	struct Lot {
		bytes32 lotId;						// The ID of this Lot
		address nameId;						// The ID of the Name that staked Ethos
		uint256 lotQuantity;				// Amount of Ethos being staked to the Pool from this Lot
		address taoId;						// Identifier for the Pool this Lot is adding to
		uint256 poolPreStakeSnapshot;		// Amount of Ethos contributed to the Pool prior to this Lot Number
		uint256 poolStakeLotSnapshot;		// poolPreStakeSnapshot + lotQuantity - logosWithdrawn
		uint256 lotValueInLogos;
		uint256 logosWithdrawn;				// Amount of Logos withdrawn from this Lot
		uint256 timestamp;
	}

	uint256 public contractTotalLot;		// Total lot from all pools
	uint256 public contractTotalEthos;		// Quantity of Ethos that has been staked to all Pools
	uint256 public contractTotalPathos;		// Quantity of Pathos that has been staked to all Pools
	uint256 public contractTotalLogosWithdrawn;		// Quantity of Logos that has been withdrawn from all Pools

	// Mapping from TAO ID to Pool
	mapping (address => Pool) public pools;

	// Mapping from Lot ID to Lot
	mapping (bytes32 => Lot) public lots;

	// Mapping from Pool's TAO ID to total Lots in the Pool
	mapping (address => uint256) public poolTotalLot;

	// Mapping from a Name ID to its Lots
	mapping (address => bytes32[]) internal ownerLots;

	// Mapping from a Name ID to quantity of Ethos staked from all lots
	mapping (address => uint256) public totalEthosStaked;

	// Mapping from a Name ID to quantity of Pathos staked from all lots
	mapping (address => uint256) public totalPathosStaked;

	// Event to be broadcasted to public when Pool is created
	event CreatePool(address indexed taoId, bool ethosCapStatus, uint256 ethosCapAmount, bool status);

	// Event to be broadcasted to public when Pool's status is updated
	// If status == true, start Pool
	// Otherwise, stop Pool
	event UpdatePoolStatus(address indexed taoId, bool status);

	/**
	 * Event to be broadcasted to public when nameId stakes Ethos
	 */
	event StakeEthos(address indexed taoId, bytes32 indexed lotId, address indexed nameId, uint256 lotQuantity, uint256 poolPreStakeSnapshot, uint256 poolStakeLotSnapshot, uint256 lotValueInLogos, uint256 timestamp);

	// Event to be broadcasted to public when nameId stakes Pathos
	event StakePathos(address indexed taoId, address indexed nameId, uint256 stakeQuantity, uint256 currentPoolTotalStakedPathos);

	// Event to be broadcasted to public when nameId withdraws Logos from Lot
	event WithdrawLogos(address indexed nameId, bytes32 indexed lotId, address indexed taoId, uint256 withdrawnAmount, uint256 currentLotValueInLogos, uint256 currentLotLogosWithdrawn);

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress, address _taoFactoryAddress, address _pathosAddress, address _ethosAddress, address _logosAddress)
		TAOController(_nameFactoryAddress) public {
		setTAOFactoryAddress(_taoFactoryAddress);
		setPathosAddress(_pathosAddress);
		setEthosAddress(_ethosAddress);
		setLogosAddress(_logosAddress);
	}

	/**
	 * @dev Check if calling address is TAO Factory address
	 */
	modifier onlyTAOFactory {
		require (msg.sender == taoFactoryAddress);
		_;
	}

	/**
	 * @dev Check if msg.sender is the current advocate of Name/TAO ID
	 */
	modifier onlyAdvocate(address _id) {
		require (_nameTAOPosition.senderIsAdvocate(msg.sender, _id));
		_;
	}

	/***** The AO ONLY METHODS *****/
	/**
	 * @dev The AO set the TAOFactory Address
	 * @param _taoFactoryAddress The address of TAOFactory
	 */
	function setTAOFactoryAddress(address _taoFactoryAddress) public onlyTheAO {
		require (_taoFactoryAddress != address(0));
		taoFactoryAddress = _taoFactoryAddress;
	}

	/**
	 * @dev The AO set the Pathos Address
	 * @param _pathosAddress The address of Pathos
	 */
	function setPathosAddress(address _pathosAddress) public onlyTheAO {
		require (_pathosAddress != address(0));
		pathosAddress = _pathosAddress;
		_pathos = TAOCurrency(_pathosAddress);
	}

	/**
	 * @dev The AO set the Ethos Address
	 * @param _ethosAddress The address of Ethos
	 */
	function setEthosAddress(address _ethosAddress) public onlyTheAO {
		require (_ethosAddress != address(0));
		ethosAddress = _ethosAddress;
		_ethos = TAOCurrency(_ethosAddress);
	}

	/**
	 * @dev The AO set the Logos Address
	 * @param _logosAddress The address of Logos
	 */
	function setLogosAddress(address _logosAddress) public onlyTheAO {
		require (_logosAddress != address(0));
		logosAddress = _logosAddress;
		_logos = Logos(_logosAddress);
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Create a pool for a TAO
	 */
	function createPool(
		address _taoId,
		bool _ethosCapStatus,
		uint256 _ethosCapAmount
	) public isTAO(_taoId) onlyTAOFactory returns (bool) {
		// Make sure ethos cap amount is provided if ethos cap is enabled
		if (_ethosCapStatus == true) {
			require (_ethosCapAmount > 0);
		}
		// Make sure the pool is not yet created
		require (pools[_taoId].taoId == address(0));

		Pool storage _pool = pools[_taoId];
		_pool.taoId = _taoId;
		_pool.status = true;
		_pool.ethosCapStatus = _ethosCapStatus;
		if (_ethosCapStatus) {
			_pool.ethosCapAmount = _ethosCapAmount;
		}

		emit CreatePool(_pool.taoId, _pool.ethosCapStatus, _pool.ethosCapAmount, _pool.status);
		return true;
	}

	/**
	 * @dev Start/Stop a Pool
	 * @param _taoId The TAO ID of the Pool
	 * @param _status The status to set. true = start. false = stop
	 */
	function updatePoolStatus(address _taoId, bool _status) public isTAO(_taoId) onlyAdvocate(_taoId) {
		require (pools[_taoId].taoId != address(0));
		pools[_taoId].status = _status;
		emit UpdatePoolStatus(_taoId, _status);
	}

	/***** Public Methods *****/
	/**
	 * @dev A Name stakes Ethos in Pool `_taoId`
	 * @param _taoId The TAO ID of the Pool
	 * @param _quantity The amount of Ethos to be staked
	 */
	function stakeEthos(address _taoId, uint256 _quantity) public isTAO(_taoId) senderIsName {
		Pool memory _pool = pools[_taoId];
		address _nameId = _nameFactory.ethAddressToNameId(msg.sender);
		require (_pool.status == true && _quantity > 0 && _ethos.balanceOf(_nameId) >= _quantity);

		// If there is an ethos cap
		if (_pool.ethosCapStatus == true) {
			require (_ethos.balanceOf(_taoId).add(_quantity) <= _pool.ethosCapAmount);
		}

		// Create Lot for this transaction
		contractTotalLot++;
		poolTotalLot[_taoId]++;

		// Generate Lot ID
		bytes32 _lotId = keccak256(abi.encodePacked(this, msg.sender, contractTotalLot));

		Lot storage _lot = lots[_lotId];
		_lot.lotId = _lotId;
		_lot.nameId = _nameId;
		_lot.lotQuantity = _quantity;
		_lot.taoId = _taoId;
		_lot.poolPreStakeSnapshot = _ethos.balanceOf(_taoId);
		_lot.poolStakeLotSnapshot = _ethos.balanceOf(_taoId).add(_quantity);
		_lot.lotValueInLogos = _quantity;
		_lot.timestamp = now;

		ownerLots[_nameId].push(_lotId);

		// Update contract variables
		totalEthosStaked[_nameId] = totalEthosStaked[_nameId].add(_quantity);
		contractTotalEthos = contractTotalEthos.add(_quantity);

		require (_ethos.transferFrom(_nameId, _taoId, _quantity));

		emit StakeEthos(_lot.taoId, _lot.lotId, _lot.nameId, _lot.lotQuantity, _lot.poolPreStakeSnapshot, _lot.poolStakeLotSnapshot, _lot.lotValueInLogos, _lot.timestamp);
	}

	/**
	 * @dev Retrieve number of Lots a `_nameId` has
	 * @param _nameId The Name ID of the Lot's owner
	 * @return Total Lots the owner has
	 */
	function ownerTotalLot(address _nameId) public view returns (uint256) {
		return ownerLots[_nameId].length;
	}

	/**
	 * @dev Get list of owner's Lot IDs from `_from` to `_to` index
	 * @param _nameId The Name Id of the Lot's owner
	 * @param _from The starting index, (i.e 0)
	 * @param _to The ending index, (i.e total - 1)
	 * @return list of owner's Lot IDs
	 */
	function ownerLotIds(address _nameId, uint256 _from, uint256 _to) public view returns (bytes32[]) {
		require (_from >= 0 && _to >= _from && ownerLots[_nameId].length > _to);
		bytes32[] memory _lotIds = new bytes32[](_to.sub(_from).add(1));
		for (uint256 i = _from; i <= _to; i++) {
			_lotIds[i.sub(_from)] = ownerLots[_nameId][i];
		}
		return _lotIds;
	}

	/**
	 * @dev A Name stakes Pathos in Pool `_taoId`
	 * @param _taoId The TAO ID of the Pool
	 * @param _quantity The amount of Pathos to stake
	 */
	function stakePathos(address _taoId, uint256 _quantity) public isTAO(_taoId) senderIsName {
		Pool memory _pool = pools[_taoId];
		address _nameId = _nameFactory.ethAddressToNameId(msg.sender);
		require (_pool.status == true && _quantity > 0 && _pathos.balanceOf(_nameId) >= _quantity && _quantity <= _ethos.balanceOf(_taoId));
		// Update contract variables
		totalPathosStaked[_nameId] = totalPathosStaked[_nameId].add(_quantity);
		contractTotalPathos = contractTotalPathos.add(_quantity);

		require (_pathos.transferFrom(_nameId, _taoId, _quantity));

		// Also add advocated TAO logos to Advocate of _taoId
		require (_logos.addAdvocatedTAOLogos(_taoId, _quantity));

		emit StakePathos(_taoId, _nameId, _quantity, _pathos.balanceOf(_taoId));
	}

	/**
	 * @dev Name that staked Ethos withdraw Logos from Lot `_lotId`
	 * @param _lotId The ID of the Lot
	 */
	function withdrawLogos(bytes32 _lotId) public senderIsName {
		Lot storage _lot = lots[_lotId];
		address _nameId = _nameFactory.ethAddressToNameId(msg.sender);
		require (_lot.nameId == _nameId && _lot.lotValueInLogos > 0);

		uint256 logosAvailableToWithdraw = lotLogosAvailableToWithdraw(_lotId);

		require (logosAvailableToWithdraw > 0 && logosAvailableToWithdraw <= _lot.lotValueInLogos);

		// Update lot variables
		_lot.logosWithdrawn = _lot.logosWithdrawn.add(logosAvailableToWithdraw);
		_lot.lotValueInLogos = _lot.lotValueInLogos.sub(logosAvailableToWithdraw);

		// Update contract variables
		contractTotalLogosWithdrawn = contractTotalLogosWithdrawn.add(logosAvailableToWithdraw);

		// Mint logos to seller
		require (_logos.mintToken(_nameId, logosAvailableToWithdraw));

		emit WithdrawLogos(_lot.nameId, _lot.lotId, _lot.taoId, logosAvailableToWithdraw, _lot.lotValueInLogos, _lot.logosWithdrawn);
	}

	/**
	 * @dev Name gets Lot `_lotId` available Logos to withdraw
	 * @param _lotId The ID of the Lot
	 * @return The amount of Logos available to withdraw
	 */
	function lotLogosAvailableToWithdraw(bytes32 _lotId) public view returns (uint256) {
		Lot memory _lot = lots[_lotId];
		require (_lot.nameId != address(0));

		uint256 logosAvailableToWithdraw = 0;

		if (_pathos.balanceOf(_lot.taoId) > _lot.poolPreStakeSnapshot && _lot.lotValueInLogos > 0) {
			logosAvailableToWithdraw = (_pathos.balanceOf(_lot.taoId) >= _lot.poolStakeLotSnapshot) ? _lot.lotQuantity : _pathos.balanceOf(_lot.taoId).sub(_lot.poolPreStakeSnapshot);
			if (logosAvailableToWithdraw > 0) {
				logosAvailableToWithdraw = logosAvailableToWithdraw.sub(_lot.logosWithdrawn);
			}
		}
		return logosAvailableToWithdraw;
	}
}
