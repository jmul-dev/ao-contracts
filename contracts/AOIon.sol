pragma solidity >=0.5.4 <0.6.0;

import './SafeMath.sol';
import './AOLibrary.sol';
import './AOIonInterface.sol';
import './IAOIonLot.sol';
import './tokenRecipient.sol';
import './IAOSetting.sol';
import './AOETH.sol';

/**
 * @title AOIon
 */
contract AOIon is AOIonInterface {
	using SafeMath for uint256;

	address public aoIonLotAddress;
	address public settingTAOId;
	address public aoSettingAddress;
	address public aoethAddress;

	// AO Dev Team addresses to receive Primordial/Network Ions
	address public aoDevTeam1 = 0x146CbD9821e6A42c8ff6DC903fe91CB69625A105;
	address public aoDevTeam2 = 0x4810aF1dA3aC827259eEa72ef845F4206C703E8D;

	IAOIonLot internal _aoIonLot;
	IAOSetting internal _aoSetting;
	AOETH internal _aoeth;

	/***** PRIMORDIAL ION VARIABLES *****/
	uint256 public primordialTotalSupply;
	uint256 public primordialTotalBought;
	uint256 public primordialSellPrice;
	uint256 public primordialBuyPrice;
	uint256 public totalEthForPrimordial;	// Total ETH sent for Primordial AO+
	uint256 public totalRedeemedAOETH;		// Total AOETH redeemed for Primordial AO+

	// Total available primordial ion for sale 3,377,699,720,527,872 AO+
	uint256 constant public TOTAL_PRIMORDIAL_FOR_SALE = 3377699720527872;

	mapping (address => uint256) public primordialBalanceOf;
	mapping (address => mapping (address => uint256)) public primordialAllowance;

	// Mapping from owner's lot weighted multiplier to the amount of staked ions
	mapping (address => mapping (uint256 => uint256)) public primordialStakedBalance;

	event PrimordialTransfer(address indexed from, address indexed to, uint256 value);
	event PrimordialApproval(address indexed _owner, address indexed _spender, uint256 _value);
	event PrimordialBurn(address indexed from, uint256 value);
	event PrimordialStake(address indexed from, uint256 value, uint256 weightedMultiplier);
	event PrimordialUnstake(address indexed from, uint256 value, uint256 weightedMultiplier);

	event NetworkExchangeEnded();

	bool public networkExchangeEnded;

	// Mapping from owner to his/her current weighted multiplier
	mapping (address => uint256) internal ownerWeightedMultiplier;

	// Mapping from owner to his/her max multiplier (multiplier of account's first Lot)
	mapping (address => uint256) internal ownerMaxMultiplier;

	// Event to be broadcasted to public when user buys primordial ion
	// payWith 1 == with Ethereum
	// payWith 2 == with AOETH
	event BuyPrimordial(address indexed lotOwner, bytes32 indexed lotId, uint8 payWith, uint256 sentAmount, uint256 refundedAmount);

	/**
	 * @dev Constructor function
	 */
	constructor(string memory _name, string memory _symbol, address _settingTAOId, address _aoSettingAddress, address _nameTAOPositionAddress, address _namePublicKeyAddress, address _nameAccountRecoveryAddress)
		AOIonInterface(_name, _symbol, _nameTAOPositionAddress, _namePublicKeyAddress, _nameAccountRecoveryAddress) public {
		setSettingTAOId(_settingTAOId);
		setAOSettingAddress(_aoSettingAddress);

		powerOfTen = 0;
		decimals = 0;
		setPrimordialPrices(0, 10 ** 8); // Set Primordial buy price to 0.1 gwei/ion
	}

	/**
	 * @dev Checks if buyer can buy primordial ion
	 */
	modifier canBuyPrimordial(uint256 _sentAmount, bool _withETH) {
		require (networkExchangeEnded == false &&
			primordialTotalBought < TOTAL_PRIMORDIAL_FOR_SALE &&
			primordialBuyPrice > 0 &&
			_sentAmount > 0 &&
			availablePrimordialForSaleInETH() > 0 &&
			(
				(_withETH && availableETH() > 0) ||
				(!_withETH && totalRedeemedAOETH < _aoeth.totalSupply())
			)
		);
		_;
	}

	/***** The AO ONLY METHODS *****/
	/**
	 * @dev The AO sets AOIonLot address
	 * @param _aoIonLotAddress The address of AOIonLot
	 */
	function setAOIonLotAddress(address _aoIonLotAddress) public onlyTheAO {
		require (_aoIonLotAddress != address(0));
		aoIonLotAddress = _aoIonLotAddress;
		_aoIonLot = IAOIonLot(_aoIonLotAddress);
	}

	/**
	 * @dev The AO sets setting TAO ID
	 * @param _settingTAOId The new setting TAO ID to set
	 */
	function setSettingTAOId(address _settingTAOId) public onlyTheAO {
		require (AOLibrary.isTAO(_settingTAOId));
		settingTAOId = _settingTAOId;
	}

	/**
	 * @dev The AO sets AO Setting address
	 * @param _aoSettingAddress The address of AOSetting
	 */
	function setAOSettingAddress(address _aoSettingAddress) public onlyTheAO {
		require (_aoSettingAddress != address(0));
		aoSettingAddress = _aoSettingAddress;
		_aoSetting = IAOSetting(_aoSettingAddress);
	}

	/**
	 * @dev Set AO Dev team addresses to receive Primordial/Network ions during network exchange
	 * @param _aoDevTeam1 The first AO dev team address
	 * @param _aoDevTeam2 The second AO dev team address
	 */
	function setAODevTeamAddresses(address _aoDevTeam1, address _aoDevTeam2) public onlyTheAO {
		aoDevTeam1 = _aoDevTeam1;
		aoDevTeam2 = _aoDevTeam2;
	}

	/**
	 * @dev Set AOETH address
	 * @param _aoethAddress The address of AOETH
	 */
	function setAOETHAddress(address _aoethAddress) public onlyTheAO {
		require (_aoethAddress != address(0));
		aoethAddress = _aoethAddress;
		_aoeth = AOETH(_aoethAddress);
	}

	/***** PRIMORDIAL ION THE AO ONLY METHODS *****/
	/**
	 * @dev Allow users to buy Primordial ions for `newBuyPrice` eth and sell Primordial ions for `newSellPrice` eth
	 * @param newPrimordialSellPrice Price users can sell to the contract
	 * @param newPrimordialBuyPrice Price users can buy from the contract
	 */
	function setPrimordialPrices(uint256 newPrimordialSellPrice, uint256 newPrimordialBuyPrice) public onlyTheAO {
		primordialSellPrice = newPrimordialSellPrice;
		primordialBuyPrice = newPrimordialBuyPrice;
	}

	/**
	 * @dev Only the AO can force end network exchange
	 */
	function endNetworkExchange() public onlyTheAO {
		require (!networkExchangeEnded);
		networkExchangeEnded = true;
		emit NetworkExchangeEnded();
	}

	/***** PRIMORDIAL ION WHITELISTED ADDRESS ONLY METHODS *****/
	/**
	 * @dev Stake `_value` Primordial ions at `_weightedMultiplier ` multiplier on behalf of `_from`
	 * @param _from The address of the target
	 * @param _value The amount of Primordial ions to stake
	 * @param _weightedMultiplier The weighted multiplier of the Primordial ions
	 * @return true on success
	 */
	function stakePrimordialFrom(address _from, uint256 _value, uint256 _weightedMultiplier) public inWhitelist returns (bool) {
		// Check if the targeted balance is enough
		require (primordialBalanceOf[_from] >= _value);
		// Make sure the weighted multiplier is the same as account's current weighted multiplier
		require (_weightedMultiplier == ownerWeightedMultiplier[_from]);
		// Subtract from the targeted balance
		primordialBalanceOf[_from] = primordialBalanceOf[_from].sub(_value);
		// Add to the targeted staked balance
		primordialStakedBalance[_from][_weightedMultiplier] = primordialStakedBalance[_from][_weightedMultiplier].add(_value);
		emit PrimordialStake(_from, _value, _weightedMultiplier);
		return true;
	}

	/**
	 * @dev Unstake `_value` Primordial ions at `_weightedMultiplier` on behalf of `_from`
	 * @param _from The address of the target
	 * @param _value The amount to unstake
	 * @param _weightedMultiplier The weighted multiplier of the Primordial ions
	 * @return true on success
	 */
	function unstakePrimordialFrom(address _from, uint256 _value, uint256 _weightedMultiplier) public inWhitelist returns (bool) {
		// Check if the targeted staked balance is enough
		require (primordialStakedBalance[_from][_weightedMultiplier] >= _value);
		// Subtract from the targeted staked balance
		primordialStakedBalance[_from][_weightedMultiplier] = primordialStakedBalance[_from][_weightedMultiplier].sub(_value);
		// Add to the targeted balance
		primordialBalanceOf[_from] = primordialBalanceOf[_from].add(_value);
		emit PrimordialUnstake(_from, _value, _weightedMultiplier);
		return true;
	}

	/**
	 * @dev Send `_value` primordial ions to `_to` on behalf of `_from`
	 * @param _from The address of the sender
	 * @param _to The address of the recipient
	 * @param _value The amount to send
	 * @return true on success
	 */
	function whitelistTransferPrimordialFrom(address _from, address _to, uint256 _value) public inWhitelist returns (bool) {
		return _createLotAndTransferPrimordial(_from, _to, _value);
	}

	/***** PUBLIC METHODS *****/
	/***** PRIMORDIAL ION PUBLIC METHODS *****/
	/**
	 * @dev Buy Primordial ions from contract by sending ether
	 */
	function buyPrimordial() public payable canBuyPrimordial(msg.value, true) {
		(uint256 amount, uint256 remainderBudget, bool shouldEndNetworkExchange) = _calculateAmountAndRemainderBudget(msg.value, true);
		require (amount > 0);

		// Ends network exchange if necessary
		if (shouldEndNetworkExchange) {
			networkExchangeEnded = true;
			emit NetworkExchangeEnded();
		}

		// Update totalEthForPrimordial
		totalEthForPrimordial = totalEthForPrimordial.add(msg.value.sub(remainderBudget));

		// Send the primordial ion to buyer and reward AO devs
		bytes32 _lotId = _sendPrimordialAndRewardDev(amount, msg.sender);

		emit BuyPrimordial(msg.sender, _lotId, 1, msg.value, remainderBudget);

		// Send remainder budget back to buyer if exist
		if (remainderBudget > 0) {
			msg.sender.transfer(remainderBudget);
		}
	}

	/**
	 * @dev Buy Primordial ion from contract by sending AOETH
	 */
	function buyPrimordialWithAOETH(uint256 _aoethAmount) public canBuyPrimordial(_aoethAmount, false) {
		(uint256 amount, uint256 remainderBudget, bool shouldEndNetworkExchange) = _calculateAmountAndRemainderBudget(_aoethAmount, false);
		require (amount > 0);

		// Ends network exchange if necessary
		if (shouldEndNetworkExchange) {
			networkExchangeEnded = true;
			emit NetworkExchangeEnded();
		}

		// Calculate the actual AOETH that was charged for this transaction
		uint256 actualCharge = _aoethAmount.sub(remainderBudget);

		// Update totalRedeemedAOETH
		totalRedeemedAOETH = totalRedeemedAOETH.add(actualCharge);

		// Transfer AOETH from buyer to here
		require (_aoeth.whitelistTransferFrom(msg.sender, address(this), actualCharge));

		// Send the primordial ion to buyer and reward AO devs
		bytes32 _lotId = _sendPrimordialAndRewardDev(amount, msg.sender);

		emit BuyPrimordial(msg.sender, _lotId, 2, _aoethAmount, remainderBudget);
	}

	/**
	 * @dev Send `_value` Primordial ions to `_to` from your account
	 * @param _to The address of the recipient
	 * @param _value The amount to send
	 * @return true on success
	 */
	function transferPrimordial(address _to, uint256 _value) public returns (bool) {
		return _createLotAndTransferPrimordial(msg.sender, _to, _value);
	}

	/**
	 * @dev Send `_value` Primordial ions to `_to` from `_from`
	 * @param _from The address of the sender
	 * @param _to The address of the recipient
	 * @param _value The amount to send
	 * @return true on success
	 */
	function transferPrimordialFrom(address _from, address _to, uint256 _value) public returns (bool) {
		require (_value <= primordialAllowance[_from][msg.sender]);
		primordialAllowance[_from][msg.sender] = primordialAllowance[_from][msg.sender].sub(_value);

		return _createLotAndTransferPrimordial(_from, _to, _value);
	}

	/**
	 * Transfer primordial ions between public key addresses in a Name
	 * @param _nameId The ID of the Name
	 * @param _from The address of the sender
	 * @param _to The address of the recipient
	 * @param _value the amount to send
	 */
	function transferPrimordialBetweenPublicKeys(address _nameId, address _from, address _to, uint256 _value) public returns (bool) {
		require (AOLibrary.isName(_nameId));
		require (_nameTAOPosition.senderIsAdvocate(msg.sender, _nameId));
		require (!_nameAccountRecovery.isCompromised(_nameId));
		// Make sure _from exist in the Name's Public Keys
		require (_namePublicKey.isKeyExist(_nameId, _from));
		// Make sure _to exist in the Name's Public Keys
		require (_namePublicKey.isKeyExist(_nameId, _to));
		return _createLotAndTransferPrimordial(_from, _to, _value);
	}

	/**
	 * @dev Allows `_spender` to spend no more than `_value` Primordial ions in your behalf
	 * @param _spender The address authorized to spend
	 * @param _value The max amount they can spend
	 * @return true on success
	 */
	function approvePrimordial(address _spender, uint256 _value) public returns (bool) {
		primordialAllowance[msg.sender][_spender] = _value;
		emit PrimordialApproval(msg.sender, _spender, _value);
		return true;
	}

	/**
	 * @dev Allows `_spender` to spend no more than `_value` Primordial ions in your behalf, and then ping the contract about it
	 * @param _spender The address authorized to spend
	 * @param _value The max amount they can spend
	 * @param _extraData some extra information to send to the approved contract
	 * @return true on success
	 */
	function approvePrimordialAndCall(address _spender, uint256 _value, bytes memory _extraData) public returns (bool) {
		tokenRecipient spender = tokenRecipient(_spender);
		if (approvePrimordial(_spender, _value)) {
			spender.receiveApproval(msg.sender, _value, address(this), _extraData);
			return true;
		}
	}

	/**
	 * @dev Remove `_value` Primordial ions from the system irreversibly
	 *		and re-weight the account's multiplier after burn
	 * @param _value The amount to burn
	 * @return true on success
	 */
	function burnPrimordial(uint256 _value) public returns (bool) {
		require (primordialBalanceOf[msg.sender] >= _value);
		require (calculateMaximumBurnAmount(msg.sender) >= _value);

		// Update the account's multiplier
		ownerWeightedMultiplier[msg.sender] = calculateMultiplierAfterBurn(msg.sender, _value);
		primordialBalanceOf[msg.sender] = primordialBalanceOf[msg.sender].sub(_value);
		primordialTotalSupply = primordialTotalSupply.sub(_value);

		// Store burn lot info
		require (_aoIonLot.createBurnLot(msg.sender, _value, ownerWeightedMultiplier[msg.sender]));
		emit PrimordialBurn(msg.sender, _value);
		return true;
	}

	/**
	 * @dev Remove `_value` Primordial ions from the system irreversibly on behalf of `_from`
	 *		and re-weight `_from`'s multiplier after burn
	 * @param _from The address of sender
	 * @param _value The amount to burn
	 * @return true on success
	 */
	function burnPrimordialFrom(address _from, uint256 _value) public returns (bool) {
		require (primordialBalanceOf[_from] >= _value);
		require (primordialAllowance[_from][msg.sender] >= _value);
		require (calculateMaximumBurnAmount(_from) >= _value);

		// Update `_from`'s multiplier
		ownerWeightedMultiplier[_from] = calculateMultiplierAfterBurn(_from, _value);
		primordialBalanceOf[_from] = primordialBalanceOf[_from].sub(_value);
		primordialAllowance[_from][msg.sender] = primordialAllowance[_from][msg.sender].sub(_value);
		primordialTotalSupply = primordialTotalSupply.sub(_value);

		// Store burn lot info
		require (_aoIonLot.createBurnLot(_from, _value, ownerWeightedMultiplier[_from]));
		emit PrimordialBurn(_from, _value);
		return true;
	}

	/**
	 * @dev Return the average weighted multiplier of all lots owned by an address
	 * @param _lotOwner The address of the lot owner
	 * @return the weighted multiplier of the address (in 10 ** 6)
	 */
	function weightedMultiplierByAddress(address _lotOwner) public view returns (uint256) {
		return ownerWeightedMultiplier[_lotOwner];
	}

	/**
	 * @dev Return the max multiplier of an address
	 * @param _target The address to query
	 * @return the max multiplier of the address (in 10 ** 6)
	 */
	function maxMultiplierByAddress(address _target) public view returns (uint256) {
		return (_aoIonLot.totalLotsByAddress(_target) > 0) ? ownerMaxMultiplier[_target] : 0;
	}

	/**
	 * @dev Calculate the primordial ion multiplier, bonus network ion percentage, and the
	 *		bonus network ion amount on a given lot when someone purchases primordial ion
	 *		during network exchange
	 * @param _purchaseAmount The amount of primordial ion intended to be purchased
	 * @return The multiplier in (10 ** 6)
	 * @return The bonus percentage
	 * @return The amount of network ion as bonus
	 */
	function calculateMultiplierAndBonus(uint256 _purchaseAmount) public view returns (uint256, uint256, uint256) {
		(uint256 startingPrimordialMultiplier, uint256 endingPrimordialMultiplier, uint256 startingNetworkBonusMultiplier, uint256 endingNetworkBonusMultiplier) = _getSettingVariables();
		return (
			AOLibrary.calculatePrimordialMultiplier(_purchaseAmount, TOTAL_PRIMORDIAL_FOR_SALE, primordialTotalBought, startingPrimordialMultiplier, endingPrimordialMultiplier),
			AOLibrary.calculateNetworkBonusPercentage(_purchaseAmount, TOTAL_PRIMORDIAL_FOR_SALE, primordialTotalBought, startingNetworkBonusMultiplier, endingNetworkBonusMultiplier),
			AOLibrary.calculateNetworkBonusAmount(_purchaseAmount, TOTAL_PRIMORDIAL_FOR_SALE, primordialTotalBought, startingNetworkBonusMultiplier, endingNetworkBonusMultiplier)
		);
	}

	/**
	 * @dev Calculate the maximum amount of Primordial an account can burn
	 * @param _account The address of the account
	 * @return The maximum primordial ion amount to burn
	 */
	function calculateMaximumBurnAmount(address _account) public view returns (uint256) {
		return AOLibrary.calculateMaximumBurnAmount(primordialBalanceOf[_account], ownerWeightedMultiplier[_account], ownerMaxMultiplier[_account]);
	}

	/**
	 * @dev Calculate account's new multiplier after burn `_amountToBurn` primordial ions
	 * @param _account The address of the account
	 * @param _amountToBurn The amount of primordial ion to burn
	 * @return The new multiplier in (10 ** 6)
	 */
	function calculateMultiplierAfterBurn(address _account, uint256 _amountToBurn) public view returns (uint256) {
		require (calculateMaximumBurnAmount(_account) >= _amountToBurn);
		return AOLibrary.calculateMultiplierAfterBurn(primordialBalanceOf[_account], ownerWeightedMultiplier[_account], _amountToBurn);
	}

	/**
	 * @dev Calculate account's new multiplier after converting `amountToConvert` network ion to primordial ion
	 * @param _account The address of the account
	 * @param _amountToConvert The amount of network ion to convert
	 * @return The new multiplier in (10 ** 6)
	 */
	function calculateMultiplierAfterConversion(address _account, uint256 _amountToConvert) public view returns (uint256) {
		return AOLibrary.calculateMultiplierAfterConversion(primordialBalanceOf[_account], ownerWeightedMultiplier[_account], _amountToConvert);
	}

	/**
	 * @dev Convert `_value` of network ions to primordial ions
	 *		and re-weight the account's multiplier after conversion
	 * @param _value The amount to convert
	 * @return true on success
	 */
	function convertToPrimordial(uint256 _value) public returns (bool) {
		require (balanceOf[msg.sender] >= _value);

		// Update the account's multiplier
		ownerWeightedMultiplier[msg.sender] = calculateMultiplierAfterConversion(msg.sender, _value);
		// Burn network ion
		burn(_value);
		// mint primordial ion
		_mintPrimordial(msg.sender, _value);

		require (_aoIonLot.createConvertLot(msg.sender, _value, ownerWeightedMultiplier[msg.sender]));
		return true;
	}

	/**
	 * @dev Get quantity of AO+ left in Network Exchange
	 * @return The quantity of AO+ left in Network Exchange
	 */
	function availablePrimordialForSale() public view returns (uint256) {
		return TOTAL_PRIMORDIAL_FOR_SALE.sub(primordialTotalBought);
	}

	/**
	 * @dev Get quantity of AO+ in ETH left in Network Exchange (i.e How much ETH is there total that can be
	 *		exchanged for AO+
	 * @return The quantity of AO+ in ETH left in Network Exchange
	 */
	function availablePrimordialForSaleInETH() public view returns (uint256) {
		return availablePrimordialForSale().mul(primordialBuyPrice);
	}

	/**
	 * @dev Get maximum quantity of AOETH or ETH that can still be sold
	 * @return The maximum quantity of AOETH or ETH that can still be sold
	 */
	function availableETH() public view returns (uint256) {
		if (availablePrimordialForSaleInETH() > 0) {
			uint256 _availableETH = availablePrimordialForSaleInETH().sub(_aoeth.totalSupply().sub(totalRedeemedAOETH));
			if (availablePrimordialForSale() == 1 && _availableETH < primordialBuyPrice) {
				return primordialBuyPrice;
			} else {
				return _availableETH;
			}
		} else {
			return 0;
		}
	}

	/***** INTERNAL METHODS *****/
	/***** PRIMORDIAL ION INTERNAL METHODS *****/
	/**
	 * @dev Calculate the amount of ion the buyer will receive and remaining budget if exist
	 *		when he/she buys primordial ion
	 * @param _budget The amount of ETH sent by buyer
	 * @param _withETH Whether or not buyer is paying with ETH
	 * @return uint256 of the amount the buyer will receiver
	 * @return uint256 of the remaining budget, if exist
	 * @return bool whether or not the network exchange should end
	 */
	function _calculateAmountAndRemainderBudget(uint256 _budget, bool _withETH) internal view returns (uint256, uint256, bool) {
		// Calculate the amount of ion
		uint256 amount = _budget.div(primordialBuyPrice);

		// If we need to return ETH to the buyer, in the case
		// where the buyer sends more ETH than available primordial ion to be purchased
		uint256 remainderEth = _budget.sub(amount.mul(primordialBuyPrice));

		uint256 _availableETH = availableETH();
		// If paying with ETH, it can't exceed availableETH
		if (_withETH && _budget > availableETH()) {
			// Calculate the amount of ions
			amount = _availableETH.div(primordialBuyPrice);
			remainderEth = _budget.sub(amount.mul(primordialBuyPrice));
		}

		// Make sure primordialTotalBought is not overflowing
		bool shouldEndNetworkExchange = false;
		if (primordialTotalBought.add(amount) >= TOTAL_PRIMORDIAL_FOR_SALE) {
			amount = TOTAL_PRIMORDIAL_FOR_SALE.sub(primordialTotalBought);
			shouldEndNetworkExchange = true;
			remainderEth = _budget.sub(amount.mul(primordialBuyPrice));
		}
		return (amount, remainderEth, shouldEndNetworkExchange);
	}

	/**
	 * @dev Actually sending the primordial ion to buyer and reward AO devs accordingly
	 * @param amount The amount of primordial ion to be sent to buyer
	 * @param to The recipient of ion
	 * @return the lot Id of the buyer
	 */
	function _sendPrimordialAndRewardDev(uint256 amount, address to) internal returns (bytes32) {
		(uint256 startingPrimordialMultiplier,, uint256 startingNetworkBonusMultiplier, uint256 endingNetworkBonusMultiplier) = _getSettingVariables();

		// Update primordialTotalBought
		(uint256 multiplier, uint256 networkBonusPercentage, uint256 networkBonusAmount) = calculateMultiplierAndBonus(amount);
		primordialTotalBought = primordialTotalBought.add(amount);
		bytes32 _lotId = _createPrimordialLot(to, amount, multiplier, networkBonusAmount);

		// Calculate The AO and AO Dev Team's portion of Primordial and Network ion Bonus
		uint256 inverseMultiplier = startingPrimordialMultiplier.sub(multiplier); // Inverse of the buyer's multiplier
		uint256 theAONetworkBonusAmount = (startingNetworkBonusMultiplier.sub(networkBonusPercentage).add(endingNetworkBonusMultiplier)).mul(amount).div(AOLibrary.PERCENTAGE_DIVISOR());
		if (aoDevTeam1 != address(0)) {
			_createPrimordialLot(aoDevTeam1, amount.div(2), inverseMultiplier, theAONetworkBonusAmount.div(2));
		}
		if (aoDevTeam2 != address(0)) {
			_createPrimordialLot(aoDevTeam2, amount.div(2), inverseMultiplier, theAONetworkBonusAmount.div(2));
		}
		_mint(theAO, theAONetworkBonusAmount);
		return _lotId;
	}

	/**
	 * @dev Create a lot with `primordialAmount` of primordial ions with `_multiplier` for an `account`
	 *		during network exchange, and reward `_networkBonusAmount` if exist
	 * @param _account Address of the lot owner
	 * @param _primordialAmount The amount of primordial ions to be stored in the lot
	 * @param _multiplier The multiplier for this lot in (10 ** 6)
	 * @param _networkBonusAmount The network ion bonus amount
	 * @return Created lot Id
	 */
	function _createPrimordialLot(address _account, uint256 _primordialAmount, uint256 _multiplier, uint256 _networkBonusAmount) internal returns (bytes32) {
		bytes32 lotId = _aoIonLot.createPrimordialLot(_account, _primordialAmount, _multiplier, _networkBonusAmount);

		ownerWeightedMultiplier[_account] = AOLibrary.calculateWeightedMultiplier(ownerWeightedMultiplier[_account], primordialBalanceOf[_account], _multiplier, _primordialAmount);

		// If this is the first lot, set this as the max multiplier of the account
		if (_aoIonLot.totalLotsByAddress(_account) == 1) {
			ownerMaxMultiplier[_account] = _multiplier;
		}
		_mintPrimordial(_account, _primordialAmount);
		_mint(_account, _networkBonusAmount);

		return lotId;
	}

	/**
	 * @dev Create `mintedAmount` Primordial ions and send it to `target`
	 * @param target Address to receive the Primordial ions
	 * @param mintedAmount The amount of Primordial ions it will receive
	 */
	function _mintPrimordial(address target, uint256 mintedAmount) internal {
		primordialBalanceOf[target] = primordialBalanceOf[target].add(mintedAmount);
		primordialTotalSupply = primordialTotalSupply.add(mintedAmount);
		emit PrimordialTransfer(address(0), address(this), mintedAmount);
		emit PrimordialTransfer(address(this), target, mintedAmount);
	}

	/**
	 * @dev Create a lot with `amount` of ions at `weightedMultiplier` for an `account`
	 * @param _account Address of lot owner
	 * @param _amount The amount of ions
	 * @param _weightedMultiplier The multiplier of the lot (in 10^6)
	 * @return bytes32 of new created lot ID
	 */
	function _createWeightedMultiplierLot(address _account, uint256 _amount, uint256 _weightedMultiplier) internal returns (bytes32) {
		require (_account != address(0));
		require (_amount > 0);

		bytes32 lotId = _aoIonLot.createWeightedMultiplierLot(_account, _amount, _weightedMultiplier);
		// If this is the first lot, set this as the max multiplier of the account
		if (_aoIonLot.totalLotsByAddress(_account) == 1) {
			ownerMaxMultiplier[_account] = _weightedMultiplier;
		}
		return lotId;
	}

	/**
	 * @dev Create Lot and send `_value` Primordial ions from `_from` to `_to`
	 * @param _from The address of sender
	 * @param _to The address of the recipient
	 * @param _value The amount to send
	 * @return true on success
	 */
	function _createLotAndTransferPrimordial(address _from, address _to, uint256 _value) internal returns (bool) {
		bytes32 _createdLotId = _createWeightedMultiplierLot(_to, _value, ownerWeightedMultiplier[_from]);
		(, address _lotOwner,,) = _aoIonLot.lotById(_createdLotId);

		// Make sure the new lot is created successfully
		require (_lotOwner == _to);

		// Update the weighted multiplier of the recipient
		ownerWeightedMultiplier[_to] = AOLibrary.calculateWeightedMultiplier(ownerWeightedMultiplier[_to], primordialBalanceOf[_to], ownerWeightedMultiplier[_from], _value);

		// Transfer the Primordial ions
		require (_transferPrimordial(_from, _to, _value));
		return true;
	}

	/**
	 * @dev Send `_value` Primordial ions from `_from` to `_to`
	 * @param _from The address of sender
	 * @param _to The address of the recipient
	 * @param _value The amount to send
	 */
	function _transferPrimordial(address _from, address _to, uint256 _value) internal returns (bool) {
		require (_to != address(0));									// Prevent transfer to 0x0 address. Use burn() instead
		require (primordialBalanceOf[_from] >= _value);						// Check if the sender has enough
		require (primordialBalanceOf[_to].add(_value) >= primordialBalanceOf[_to]);	// Check for overflows
		require (!frozenAccount[_from]);								// Check if sender is frozen
		require (!frozenAccount[_to]);									// Check if recipient is frozen
		uint256 previousBalances = primordialBalanceOf[_from].add(primordialBalanceOf[_to]);
		primordialBalanceOf[_from] = primordialBalanceOf[_from].sub(_value);			// Subtract from the sender
		primordialBalanceOf[_to] = primordialBalanceOf[_to].add(_value);				// Add the same to the recipient
		emit PrimordialTransfer(_from, _to, _value);
		assert(primordialBalanceOf[_from].add(primordialBalanceOf[_to]) == previousBalances);
		return true;
	}

	/**
	 * @dev Get setting variables
	 * @return startingPrimordialMultiplier The starting multiplier used to calculate primordial ion
	 * @return endingPrimordialMultiplier The ending multiplier used to calculate primordial ion
	 * @return startingNetworkBonusMultiplier The starting multiplier used to calculate network ion bonus
	 * @return endingNetworkBonusMultiplier The ending multiplier used to calculate network ion bonus
	 */
	function _getSettingVariables() internal view returns (uint256, uint256, uint256, uint256) {
		(uint256 startingPrimordialMultiplier,,,,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'startingPrimordialMultiplier');
		(uint256 endingPrimordialMultiplier,,,,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'endingPrimordialMultiplier');

		(uint256 startingNetworkBonusMultiplier,,,,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'startingNetworkBonusMultiplier');
		(uint256 endingNetworkBonusMultiplier,,,,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'endingNetworkBonusMultiplier');

		return (startingPrimordialMultiplier, endingPrimordialMultiplier, startingNetworkBonusMultiplier, endingNetworkBonusMultiplier);
	}
}
