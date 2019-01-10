pragma solidity ^0.4.24;

import './SafeMath.sol';
import './AOLibrary.sol';
import './AOTokenInterface.sol';
import './tokenRecipient.sol';
import './AOSetting.sol';
import './AOETH.sol';

/**
 * @title AOToken
 */
contract AOToken is AOTokenInterface {
	using SafeMath for uint256;

	address public settingTAOId;
	address public aoSettingAddress;
	address public aoethAddress;

	// AO Dev Team addresses to receive Primordial/Network Tokens
	address public aoDevTeam1 = 0x5C63644D01Ba385eBAc5bcf2DDc1e6dBC1182b52;
	address public aoDevTeam2 = 0x156C79bf4347D1891da834Ea30662A14177CbF28;

	AOSetting internal _aoSetting;
	AOETH internal _aoeth;

	/***** PRIMORDIAL TOKEN VARIABLES *****/
	uint256 public primordialTotalSupply;
	uint256 public primordialTotalBought;
	uint256 public primordialSellPrice;
	uint256 public primordialBuyPrice;
	uint256 public totalEthForPrimordial;	// Total ETH sent for Primordial AO+
	uint256 public totalRedeemedAOETH;		// Total AOETH redeemed for Primordial AO+

	// Total available primordial token for sale 1,125,899,906,842,620 AO+
	uint256 constant public TOTAL_PRIMORDIAL_FOR_SALE = 1125899906842620;

	mapping (address => uint256) public primordialBalanceOf;
	mapping (address => mapping (address => uint256)) public primordialAllowance;

	// Mapping from owner's lot weighted multiplier to the amount of staked tokens
	mapping (address => mapping (uint256 => uint256)) public primordialStakedBalance;

	event PrimordialTransfer(address indexed from, address indexed to, uint256 value);
	event PrimordialApproval(address indexed _owner, address indexed _spender, uint256 _value);
	event PrimordialBurn(address indexed from, uint256 value);
	event PrimordialStake(address indexed from, uint256 value, uint256 weightedMultiplier);
	event PrimordialUnstake(address indexed from, uint256 value, uint256 weightedMultiplier);

	uint256 public totalLots;
	uint256 public totalBurnLots;
	uint256 public totalConvertLots;

	bool public networkExchangeEnded;

	/**
	 * Stores Lot creation data (during network exchange)
	 */
	struct Lot {
		bytes32 lotId;
		uint256 multiplier;	// This value is in 10^6, so 1000000 = 1
		address lotOwner;
		uint256 tokenAmount;
	}

	/**
	 * Struct to store info when account burns primordial token
	 */
	struct BurnLot {
		bytes32 burnLotId;
		address lotOwner;
		uint256 tokenAmount;
	}

	/**
	 * Struct to store info when account converts network token to primordial token
	 */
	struct ConvertLot {
		bytes32 convertLotId;
		address lotOwner;
		uint256 tokenAmount;
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

	// Mapping from owner to his/her current weighted multiplier
	mapping (address => uint256) internal ownerWeightedMultiplier;

	// Mapping from owner to his/her max multiplier (multiplier of account's first Lot)
	mapping (address => uint256) internal ownerMaxMultiplier;

	// Event to be broadcasted to public when a lot is created
	// multiplier value is in 10^6 to account for 6 decimal points
	event LotCreation(address indexed lotOwner, bytes32 indexed lotId, uint256 multiplier, uint256 primordialTokenAmount, uint256 networkTokenBonusAmount);

	// Event to be broadcasted to public when user buys primordial token
	// payWith 1 == with Ethereum
	// payWith 2 == with AOETH
	event BuyPrimordialToken(address indexed lotOwner, bytes32 indexed lotId, uint8 payWith, uint256 sentAmount, uint256 refundedAmount);

	// Event to be broadcasted to public when burn lot is created (when account burns primordial tokens)
	event BurnLotCreation(address indexed lotOwner, bytes32 indexed burnLotId, uint256 burnTokenAmount, uint256 multiplierAfterBurn);

	// Event to be broadcasted to public when convert lot is created (when account convert network tokens to primordial tokens)
	event ConvertLotCreation(address indexed lotOwner, bytes32 indexed convertLotId, uint256 convertTokenAmount, uint256 multiplierAfterBurn);

	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol, address _settingTAOId, address _aoSettingAddress, address _nameTAOPositionAddress)
		AOTokenInterface(initialSupply, tokenName, tokenSymbol, _nameTAOPositionAddress) public {
		setSettingTAOId(_settingTAOId);
		setAOSettingAddress(_aoSettingAddress);

		powerOfTen = 0;
		decimals = 0;
		setPrimordialPrices(0, 10000); // Set Primordial buy price to 10000 Wei/token
	}

	/**
	 * @dev Checks if buyer can buy primordial token
	 */
	modifier canBuyPrimordial(uint256 _sentAmount, bool _withETH) {
		require (networkExchangeEnded == false &&
			primordialTotalBought < TOTAL_PRIMORDIAL_FOR_SALE &&
			primordialBuyPrice > 0 &&
			_sentAmount > 0 &&
			(
				(_withETH && availableETH() > 0) ||
				(!_withETH && availablePrimordialForSaleInETH() > 0)
			)
		);
		_;
	}

	/***** The AO ONLY METHODS *****/
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
		_aoSetting = AOSetting(_aoSettingAddress);
	}

	/**
	 * @dev Set AO Dev team addresses to receive Primordial/Network tokens during network exchange
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
	function setAOEthAddress(address _aoethAddress) public onlyTheAO {
		require (_aoethAddress != address(0));
		aoethAddress = _aoethAddress;
		_aoeth = AOETH(_aoethAddress);
	}

	/***** PRIMORDIAL TOKEN The AO ONLY METHODS *****/
	/**
	 * @dev Allow users to buy Primordial tokens for `newBuyPrice` eth and sell Primordial tokens for `newSellPrice` eth
	 * @param newPrimordialSellPrice Price users can sell to the contract
	 * @param newPrimordialBuyPrice Price users can buy from the contract
	 */
	function setPrimordialPrices(uint256 newPrimordialSellPrice, uint256 newPrimordialBuyPrice) public onlyTheAO {
		primordialSellPrice = newPrimordialSellPrice;
		primordialBuyPrice = newPrimordialBuyPrice;
	}

	/***** PRIMORDIAL TOKEN WHITELISTED ADDRESS ONLY METHODS *****/
	/**
	 * @dev Stake `_value` Primordial tokens at `_weightedMultiplier ` multiplier on behalf of `_from`
	 * @param _from The address of the target
	 * @param _value The amount of Primordial tokens to stake
	 * @param _weightedMultiplier The weighted multiplier of the Primordial tokens
	 * @return true on success
	 */
	function stakePrimordialTokenFrom(address _from, uint256 _value, uint256 _weightedMultiplier) public inWhitelist returns (bool) {
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
	 * @dev Unstake `_value` Primordial tokens at `_weightedMultiplier` on behalf of `_from`
	 * @param _from The address of the target
	 * @param _value The amount to unstake
	 * @param _weightedMultiplier The weighted multiplier of the Primordial tokens
	 * @return true on success
	 */
	function unstakePrimordialTokenFrom(address _from, uint256 _value, uint256 _weightedMultiplier) public inWhitelist returns (bool) {
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
	 * @dev Send `_value` primordial tokens to `_to` on behalf of `_from`
	 * @param _from The address of the sender
	 * @param _to The address of the recipient
	 * @param _value The amount to send
	 * @return true on success
	 */
	function whitelistTransferPrimordialTokenFrom(address _from, address _to, uint256 _value) public inWhitelist returns (bool) {
		bytes32 _createdLotId = _createWeightedMultiplierLot(_to, _value, ownerWeightedMultiplier[_from]);
		Lot memory _lot = lots[_createdLotId];

		// Make sure the new lot is created successfully
		require (_lot.lotOwner == _to);

		// Update the weighted multiplier of the recipient
		ownerWeightedMultiplier[_to] = AOLibrary.calculateWeightedMultiplier(ownerWeightedMultiplier[_to], primordialBalanceOf[_to], ownerWeightedMultiplier[_from], _value);

		// Transfer the Primordial tokens
		require (_transferPrimordialToken(_from, _to, _value));
		emit LotCreation(_lot.lotOwner, _lot.lotId, _lot.multiplier, _lot.tokenAmount, 0);
		return true;
	}

	/***** PUBLIC METHODS *****/
	/***** Primordial TOKEN PUBLIC METHODS *****/
	/**
	 * @dev Buy Primordial tokens from contract by sending ether
	 */
	function buyPrimordialToken() public payable canBuyPrimordial(msg.value, true) {
		(uint256 tokenAmount, uint256 remainderBudget, bool shouldEndNetworkExchange) = _calculateTokenAmountAndRemainderBudget(msg.value);
		require (tokenAmount > 0);

		// Ends network exchange if necessary
		if (shouldEndNetworkExchange) {
			networkExchangeEnded = true;
		}

		// Update totalEthForPrimordial
		totalEthForPrimordial = totalEthForPrimordial.add(msg.value.sub(remainderBudget));

		// Send the primordial token to buyer and reward AO devs
		bytes32 _lotId = _sendPrimordialTokenAndRewardDev(tokenAmount, msg.sender);

		emit BuyPrimordialToken(msg.sender, _lotId, 1, msg.value, remainderBudget);

		// Send remainder budget back to buyer if exist
		if (remainderBudget > 0) {
			msg.sender.transfer(remainderBudget);
		}
	}

	/**
	 * @dev Buy Primordial tokens from contract by sending AOETH
	 */
	function buyPrimordialTokenWithAOETH(uint256 _aoethAmount) public canBuyPrimordial(_aoethAmount, false) {
		(uint256 tokenAmount, uint256 remainderBudget, bool shouldEndNetworkExchange) = _calculateTokenAmountAndRemainderBudget(_aoethAmount);
		require (tokenAmount > 0);

		// Ends network exchange if necessary
		if (shouldEndNetworkExchange) {
			networkExchangeEnded = true;
		}

		// Calculate the actual AOETH that was charged for this transaction
		uint256 actualCharge = _aoethAmount.sub(remainderBudget);

		// Update totalRedeemedAOETH
		totalRedeemedAOETH = totalRedeemedAOETH.add(actualCharge);

		// Transfer AOETH from buyer to here
		require (_aoeth.whitelistTransferFrom(msg.sender, address(this), actualCharge));

		// Send the primordial token to buyer and reward AO devs
		bytes32 _lotId = _sendPrimordialTokenAndRewardDev(tokenAmount, msg.sender);

		emit BuyPrimordialToken(msg.sender, _lotId, 2, _aoethAmount, remainderBudget);
	}

	/**
	 * @dev Send `_value` Primordial tokens to `_to` from your account
	 * @param _to The address of the recipient
	 * @param _value The amount to send
	 * @return true on success
	 */
	function transferPrimordialToken(address _to, uint256 _value) public returns (bool success) {
		bytes32 _createdLotId = _createWeightedMultiplierLot(_to, _value, ownerWeightedMultiplier[msg.sender]);
		Lot memory _lot = lots[_createdLotId];

		// Make sure the new lot is created successfully
		require (_lot.lotOwner == _to);

		// Update the weighted multiplier of the recipient
		ownerWeightedMultiplier[_to] = AOLibrary.calculateWeightedMultiplier(ownerWeightedMultiplier[_to], primordialBalanceOf[_to], ownerWeightedMultiplier[msg.sender], _value);

		// Transfer the Primordial tokens
		require (_transferPrimordialToken(msg.sender, _to, _value));
		emit LotCreation(_lot.lotOwner, _lot.lotId, _lot.multiplier, _lot.tokenAmount, 0);
		return true;
	}

	/**
	 * @dev Send `_value` Primordial tokens to `_to` from `_from`
	 * @param _from The address of the sender
	 * @param _to The address of the recipient
	 * @param _value The amount to send
	 * @return true on success
	 */
	function transferPrimordialTokenFrom(address _from, address _to, uint256 _value) public returns (bool success) {
		require (_value <= primordialAllowance[_from][msg.sender]);
		primordialAllowance[_from][msg.sender] = primordialAllowance[_from][msg.sender].sub(_value);

		bytes32 _createdLotId = _createWeightedMultiplierLot(_to, _value, ownerWeightedMultiplier[_from]);
		Lot memory _lot = lots[_createdLotId];

		// Make sure the new lot is created successfully
		require (_lot.lotOwner == _to);

		// Update the weighted multiplier of the recipient
		ownerWeightedMultiplier[_to] = AOLibrary.calculateWeightedMultiplier(ownerWeightedMultiplier[_to], primordialBalanceOf[_to], ownerWeightedMultiplier[_from], _value);

		// Transfer the Primordial tokens
		require (_transferPrimordialToken(_from, _to, _value));
		emit LotCreation(_lot.lotOwner, _lot.lotId, _lot.multiplier, _lot.tokenAmount, 0);
		return true;
	}

	/**
	 * @dev Allows `_spender` to spend no more than `_value` Primordial tokens in your behalf
	 * @param _spender The address authorized to spend
	 * @param _value The max amount they can spend
	 * @return true on success
	 */
	function approvePrimordialToken(address _spender, uint256 _value) public returns (bool success) {
		primordialAllowance[msg.sender][_spender] = _value;
		emit PrimordialApproval(msg.sender, _spender, _value);
		return true;
	}

	/**
	 * @dev Allows `_spender` to spend no more than `_value` Primordial tokens in your behalf, and then ping the contract about it
	 * @param _spender The address authorized to spend
	 * @param _value The max amount they can spend
	 * @param _extraData some extra information to send to the approved contract
	 * @return true on success
	 */
	function approvePrimordialTokenAndCall(address _spender, uint256 _value, bytes _extraData) public returns (bool success) {
		tokenRecipient spender = tokenRecipient(_spender);
		if (approvePrimordialToken(_spender, _value)) {
			spender.receiveApproval(msg.sender, _value, this, _extraData);
			return true;
		}
	}

	/**
	 * @dev Remove `_value` Primordial tokens from the system irreversibly
	 *		and re-weight the account's multiplier after burn
	 * @param _value The amount to burn
	 * @return true on success
	 */
	function burnPrimordialToken(uint256 _value) public returns (bool success) {
		require (primordialBalanceOf[msg.sender] >= _value);
		require (calculateMaximumBurnAmount(msg.sender) >= _value);

		// Update the account's multiplier
		ownerWeightedMultiplier[msg.sender] = calculateMultiplierAfterBurn(msg.sender, _value);
		primordialBalanceOf[msg.sender] = primordialBalanceOf[msg.sender].sub(_value);
		primordialTotalSupply = primordialTotalSupply.sub(_value);

		// Store burn lot info
		_createBurnLot(msg.sender, _value);
		emit PrimordialBurn(msg.sender, _value);
		return true;
	}

	/**
	 * @dev Remove `_value` Primordial tokens from the system irreversibly on behalf of `_from`
	 *		and re-weight `_from`'s multiplier after burn
	 * @param _from The address of sender
	 * @param _value The amount to burn
	 * @return true on success
	 */
	function burnPrimordialTokenFrom(address _from, uint256 _value) public returns (bool success) {
		require (primordialBalanceOf[_from] >= _value);
		require (primordialAllowance[_from][msg.sender] >= _value);
		require (calculateMaximumBurnAmount(_from) >= _value);

		// Update `_from`'s multiplier
		ownerWeightedMultiplier[_from] = calculateMultiplierAfterBurn(_from, _value);
		primordialBalanceOf[_from] = primordialBalanceOf[_from].sub(_value);
		primordialAllowance[_from][msg.sender] = primordialAllowance[_from][msg.sender].sub(_value);
		primordialTotalSupply = primordialTotalSupply.sub(_value);

		// Store burn lot info
		_createBurnLot(_from, _value);
		emit PrimordialBurn(_from, _value);
		return true;
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
	function totalLotsByAddress(address _lotOwner) public view returns (uint256) {
		return ownedLots[_lotOwner].length;
	}

	/**
	 * @dev Return the lot information at a given index of the lots list of the requested owner
	 * @param _lotOwner The address owning the lots list to be accessed
	 * @param _index uint256 representing the index to be accessed of the requested lots list
	 * @return id of the lot
	 * @return The address of the lot owner
	 * @return multiplier of the lot in (10 ** 6)
	 * @return Primordial token amount in the lot
	 */
	function lotOfOwnerByIndex(address _lotOwner, uint256 _index) public view returns (bytes32, address, uint256, uint256) {
		require (_index < ownedLots[_lotOwner].length);
		Lot memory _lot = lots[ownedLots[_lotOwner][_index]];
		return (_lot.lotId, _lot.lotOwner, _lot.multiplier, _lot.tokenAmount);
	}

	/**
	 * @dev Return the lot information at a given ID
	 * @param _lotId The lot ID in question
	 * @return id of the lot
	 * @return The lot owner address
	 * @return multiplier of the lot in (10 ** 6)
	 * @return Primordial token amount in the lot
	 */
	function lotById(bytes32 _lotId) public view returns (bytes32, address, uint256, uint256) {
		Lot memory _lot = lots[_lotId];
		return (_lot.lotId, _lot.lotOwner, _lot.multiplier, _lot.tokenAmount);
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
	 * @return Primordial token amount in the burn lot
	 */
	function burnLotById(bytes32 _burnLotId) public view returns (bytes32, address, uint256) {
		BurnLot memory _burnLot = burnLots[_burnLotId];
		return (_burnLot.burnLotId, _burnLot.lotOwner, _burnLot.tokenAmount);
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
	 * @return Primordial token amount in the convert lot
	 */
	function convertLotById(bytes32 _convertLotId) public view returns (bytes32, address, uint256) {
		ConvertLot memory _convertLot = convertLots[_convertLotId];
		return (_convertLot.convertLotId, _convertLot.lotOwner, _convertLot.tokenAmount);
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
		return (ownedLots[_target].length > 0) ? ownerMaxMultiplier[_target] : 0;
	}

	/**
	 * @dev Calculate the primordial token multiplier, bonus network token percentage, and the
	 *		bonus network token amount on a given lot when someone purchases primordial token
	 *		during network exchange
	 * @param _purchaseAmount The amount of primordial token intended to be purchased
	 * @return The multiplier in (10 ** 6)
	 * @return The bonus percentage
	 * @return The amount of network token as bonus
	 */
	function calculateMultiplierAndBonus(uint256 _purchaseAmount) public view returns (uint256, uint256, uint256) {
		(uint256 startingPrimordialMultiplier, uint256 endingPrimordialMultiplier, uint256 startingNetworkTokenBonusMultiplier, uint256 endingNetworkTokenBonusMultiplier) = _getSettingVariables();
		return (
			AOLibrary.calculatePrimordialMultiplier(_purchaseAmount, TOTAL_PRIMORDIAL_FOR_SALE, primordialTotalBought, startingPrimordialMultiplier, endingPrimordialMultiplier),
			AOLibrary.calculateNetworkTokenBonusPercentage(_purchaseAmount, TOTAL_PRIMORDIAL_FOR_SALE, primordialTotalBought, startingNetworkTokenBonusMultiplier, endingNetworkTokenBonusMultiplier),
			AOLibrary.calculateNetworkTokenBonusAmount(_purchaseAmount, TOTAL_PRIMORDIAL_FOR_SALE, primordialTotalBought, startingNetworkTokenBonusMultiplier, endingNetworkTokenBonusMultiplier)
		);
	}

	/**
	 * @dev Calculate the maximum amount of Primordial an account can burn
	 * @param _account The address of the account
	 * @return The maximum primordial token amount to burn
	 */
	function calculateMaximumBurnAmount(address _account) public view returns (uint256) {
		return AOLibrary.calculateMaximumBurnAmount(primordialBalanceOf[_account], ownerWeightedMultiplier[_account], ownerMaxMultiplier[_account]);
	}

	/**
	 * @dev Calculate account's new multiplier after burn `_amountToBurn` primordial tokens
	 * @param _account The address of the account
	 * @param _amountToBurn The amount of primordial token to burn
	 * @return The new multiplier in (10 ** 6)
	 */
	function calculateMultiplierAfterBurn(address _account, uint256 _amountToBurn) public view returns (uint256) {
		require (calculateMaximumBurnAmount(_account) >= _amountToBurn);
		return AOLibrary.calculateMultiplierAfterBurn(primordialBalanceOf[_account], ownerWeightedMultiplier[_account], _amountToBurn);
	}

	/**
	 * @dev Calculate account's new multiplier after converting `amountToConvert` network token to primordial token
	 * @param _account The address of the account
	 * @param _amountToConvert The amount of network token to convert
	 * @return The new multiplier in (10 ** 6)
	 */
	function calculateMultiplierAfterConversion(address _account, uint256 _amountToConvert) public view returns (uint256) {
		return AOLibrary.calculateMultiplierAfterConversion(primordialBalanceOf[_account], ownerWeightedMultiplier[_account], _amountToConvert);
	}

	/**
	 * @dev Convert `_value` of network tokens to primordial tokens
	 *		and re-weight the account's multiplier after conversion
	 * @param _value The amount to convert
	 * @return true on success
	 */
	function convertToPrimordial(uint256 _value) public returns (bool success) {
		require (balanceOf[msg.sender] >= _value);

		// Update the account's multiplier
		ownerWeightedMultiplier[msg.sender] = calculateMultiplierAfterConversion(msg.sender, _value);
		// Burn network token
		burn(_value);
		// mint primordial token
		_mintPrimordialToken(msg.sender, _value);

		// Store convert lot info
		totalConvertLots++;

		// Generate convert lot Id
		bytes32 convertLotId = keccak256(abi.encodePacked(this, msg.sender, totalConvertLots));

		// Make sure no one owns this lot yet
		require (convertLots[convertLotId].lotOwner == address(0));

		ConvertLot storage convertLot = convertLots[convertLotId];
		convertLot.convertLotId = convertLotId;
		convertLot.lotOwner = msg.sender;
		convertLot.tokenAmount = _value;
		ownedConvertLots[msg.sender].push(convertLotId);
		emit ConvertLotCreation(convertLot.lotOwner, convertLot.convertLotId, convertLot.tokenAmount, ownerWeightedMultiplier[convertLot.lotOwner]);
		return true;
	}

	/***** NETWORK TOKEN & PRIMORDIAL TOKEN METHODS *****/
	/**
	 * @dev Send `_value` network tokens and `_primordialValue` primordial tokens to `_to` from your account
	 * @param _to The address of the recipient
	 * @param _value The amount of network tokens to send
	 * @param _primordialValue The amount of Primordial tokens to send
	 * @return true on success
	 */
	function transferTokens(address _to, uint256 _value, uint256 _primordialValue) public returns (bool success) {
		require (super.transfer(_to, _value));
		require (transferPrimordialToken(_to, _primordialValue));
		return true;
	}

	/**
	 * @dev Send `_value` network tokens and `_primordialValue` primordial tokens to `_to` from `_from`
	 * @param _from The address of the sender
	 * @param _to The address of the recipient
	 * @param _value The amount of network tokens tokens to send
	 * @param _primordialValue The amount of Primordial tokens to send
	 * @return true on success
	 */
	function transferTokensFrom(address _from, address _to, uint256 _value, uint256 _primordialValue) public returns (bool success) {
		require (super.transferFrom(_from, _to, _value));
		require (transferPrimordialTokenFrom(_from, _to, _primordialValue));
		return true;
	}

	/**
	 * @dev Allows `_spender` to spend no more than `_value` network tokens and `_primordialValue` Primordial tokens in your behalf
	 * @param _spender The address authorized to spend
	 * @param _value The max amount of network tokens they can spend
	 * @param _primordialValue The max amount of network tokens they can spend
	 * @return true on success
	 */
	function approveTokens(address _spender, uint256 _value, uint256 _primordialValue) public returns (bool success) {
		require (super.approve(_spender, _value));
		require (approvePrimordialToken(_spender, _primordialValue));
		return true;
	}

	/**
	 * @dev Allows `_spender` to spend no more than `_value` network tokens and `_primordialValue` Primordial tokens in your behalf, and then ping the contract about it
	 * @param _spender The address authorized to spend
	 * @param _value The max amount of network tokens they can spend
	 * @param _primordialValue The max amount of Primordial Tokens they can spend
	 * @param _extraData some extra information to send to the approved contract
	 * @return true on success
	 */
	function approveTokensAndCall(address _spender, uint256 _value, uint256 _primordialValue, bytes _extraData) public returns (bool success) {
		require (super.approveAndCall(_spender, _value, _extraData));
		require (approvePrimordialTokenAndCall(_spender, _primordialValue, _extraData));
		return true;
	}

	/**
	 * @dev Remove `_value` network tokens and `_primordialValue` Primordial tokens from the system irreversibly
	 * @param _value The amount of network tokens to burn
	 * @param _primordialValue The amount of Primordial tokens to burn
	 * @return true on success
	 */
	function burnTokens(uint256 _value, uint256 _primordialValue) public returns (bool success) {
		require (super.burn(_value));
		require (burnPrimordialToken(_primordialValue));
		return true;
	}

	/**
	 * @dev Remove `_value` network tokens and `_primordialValue` Primordial tokens from the system irreversibly on behalf of `_from`
	 * @param _from The address of sender
	 * @param _value The amount of network tokens to burn
	 * @param _primordialValue The amount of Primordial tokens to burn
	 * @return true on success
	 */
	function burnTokensFrom(address _from, uint256 _value, uint256 _primordialValue) public returns (bool success) {
		require (super.burnFrom(_from, _value));
		require (burnPrimordialTokenFrom(_from, _primordialValue));
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
		return availablePrimordialForSaleInETH().sub(_aoeth.totalSupply()).sub(totalRedeemedAOETH);
	}

	/***** INTERNAL METHODS *****/
	/***** PRIMORDIAL TOKEN INTERNAL METHODS *****/
	/**
	 * @dev Calculate the amount of token the buyer will receive and remaining budget if exist
	 *		when he/she buys primordial token
	 * @param _budget The amount of ETH sent by buyer
	 * @return uint256 of the tokenAmount the buyer will receiver
	 * @return uint256 of the remaining budget, if exist
	 * @return bool whether or not the network exchange should end
	 */
	function _calculateTokenAmountAndRemainderBudget(uint256 _budget) internal view returns (uint256, uint256, bool) {
		// Calculate the amount of tokens
		uint256 tokenAmount = _budget.div(primordialBuyPrice);

		// If we need to return ETH to the buyer, in the case
		// where the buyer sends more ETH than available primordial token to be purchased
		uint256 remainderEth = 0;

		// Make sure primordialTotalBought is not overflowing
		bool shouldEndNetworkExchange = false;
		if (primordialTotalBought.add(tokenAmount) >= TOTAL_PRIMORDIAL_FOR_SALE) {
			tokenAmount = TOTAL_PRIMORDIAL_FOR_SALE.sub(primordialTotalBought);
			shouldEndNetworkExchange = true;
			remainderEth = _budget.sub(tokenAmount.mul(primordialBuyPrice));
		}
		return (tokenAmount, remainderEth, shouldEndNetworkExchange);
	}

	/**
	 * @dev Actually sending the primordial token to buyer and reward AO devs accordingly
	 * @param tokenAmount The amount of primordial token to be sent to buyer
	 * @param to The recipient of the token
	 * @return the lot Id of the buyer
	 */
	function _sendPrimordialTokenAndRewardDev(uint256 tokenAmount, address to) internal returns (bytes32) {
		(uint256 startingPrimordialMultiplier,, uint256 startingNetworkTokenBonusMultiplier, uint256 endingNetworkTokenBonusMultiplier) = _getSettingVariables();

		// Update primordialTotalBought
		(uint256 multiplier, uint256 networkTokenBonusPercentage, uint256 networkTokenBonusAmount) = calculateMultiplierAndBonus(tokenAmount);
		primordialTotalBought = primordialTotalBought.add(tokenAmount);
		bytes32 _lotId = _createPrimordialLot(to, tokenAmount, multiplier, networkTokenBonusAmount);

		// Calculate The AO and AO Dev Team's portion of Primordial and Network Token Bonus
		uint256 inverseMultiplier = startingPrimordialMultiplier.sub(multiplier); // Inverse of the buyer's multiplier
		uint256 theAONetworkTokenBonusAmount = (startingNetworkTokenBonusMultiplier.sub(networkTokenBonusPercentage).add(endingNetworkTokenBonusMultiplier)).mul(tokenAmount).div(AOLibrary.PERCENTAGE_DIVISOR());
		if (aoDevTeam1 != address(0)) {
			_createPrimordialLot(aoDevTeam1, tokenAmount.div(2), inverseMultiplier, theAONetworkTokenBonusAmount.div(2));
		}
		if (aoDevTeam2 != address(0)) {
			_createPrimordialLot(aoDevTeam2, tokenAmount.div(2), inverseMultiplier, theAONetworkTokenBonusAmount.div(2));
		}
		_mintToken(theAO, theAONetworkTokenBonusAmount);
		return _lotId;
	}

	/**
	 * @dev Create a lot with `primordialTokenAmount` of primordial tokens with `_multiplier` for an `account`
	 *		during network exchange, and reward `_networkTokenBonusAmount` if exist
	 * @param _account Address of the lot owner
	 * @param _primordialTokenAmount The amount of primordial tokens to be stored in the lot
	 * @param _multiplier The multiplier for this lot in (10 ** 6)
	 * @param _networkTokenBonusAmount The network token bonus amount
	 * @return Created lot Id
	 */
	function _createPrimordialLot(address _account, uint256 _primordialTokenAmount, uint256 _multiplier, uint256 _networkTokenBonusAmount) internal returns (bytes32) {
		totalLots++;

		// Generate lotId
		bytes32 lotId = keccak256(abi.encodePacked(this, _account, totalLots));

		// Make sure no one owns this lot yet
		require (lots[lotId].lotOwner == address(0));

		Lot storage lot = lots[lotId];
		lot.lotId = lotId;
		lot.multiplier = _multiplier;
		lot.lotOwner = _account;
		lot.tokenAmount = _primordialTokenAmount;
		ownedLots[_account].push(lotId);
		ownerWeightedMultiplier[_account] = AOLibrary.calculateWeightedMultiplier(ownerWeightedMultiplier[_account], primordialBalanceOf[_account], lot.multiplier, lot.tokenAmount);
		// If this is the first lot, set this as the max multiplier of the account
		if (ownedLots[_account].length == 1) {
			ownerMaxMultiplier[_account] = lot.multiplier;
		}
		_mintPrimordialToken(_account, lot.tokenAmount);
		_mintToken(_account, _networkTokenBonusAmount);

		emit LotCreation(lot.lotOwner, lot.lotId, lot.multiplier, lot.tokenAmount, _networkTokenBonusAmount);
		return lotId;
	}

	/**
	 * @dev Create `mintedAmount` Primordial tokens and send it to `target`
	 * @param target Address to receive the Primordial tokens
	 * @param mintedAmount The amount of Primordial tokens it will receive
	 */
	function _mintPrimordialToken(address target, uint256 mintedAmount) internal {
		primordialBalanceOf[target] = primordialBalanceOf[target].add(mintedAmount);
		primordialTotalSupply = primordialTotalSupply.add(mintedAmount);
		emit PrimordialTransfer(0, this, mintedAmount);
		emit PrimordialTransfer(this, target, mintedAmount);
	}

	/**
	 * @dev Create a lot with `tokenAmount` of tokens at `weightedMultiplier` for an `account`
	 * @param _account Address of lot owner
	 * @param _tokenAmount The amount of tokens
	 * @param _weightedMultiplier The multiplier of the lot (in 10^6)
	 * @return bytes32 of new created lot ID
	 */
	function _createWeightedMultiplierLot(address _account, uint256 _tokenAmount, uint256 _weightedMultiplier) internal returns (bytes32) {
		require (_account != address(0));
		require (_tokenAmount > 0);

		totalLots++;

		// Generate lotId
		bytes32 lotId = keccak256(abi.encodePacked(this, _account, totalLots));

		// Make sure no one owns this lot yet
		require (lots[lotId].lotOwner == address(0));

		Lot storage lot = lots[lotId];
		lot.lotId = lotId;
		lot.multiplier = _weightedMultiplier;
		lot.lotOwner = _account;
		lot.tokenAmount = _tokenAmount;
		ownedLots[_account].push(lotId);
		// If this is the first lot, set this as the max multiplier of the account
		if (ownedLots[_account].length == 1) {
			ownerMaxMultiplier[_account] = lot.multiplier;
		}
		return lotId;
	}

	/**
	 * @dev Send `_value` Primordial tokens from `_from` to `_to`
	 * @param _from The address of sender
	 * @param _to The address of the recipient
	 * @param _value The amount to send
	 */
	function _transferPrimordialToken(address _from, address _to, uint256 _value) internal returns (bool) {
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
	 * @dev Store burn lot information
	 * @param _account The address of the account
	 * @param _tokenAmount The amount of primordial tokens to burn
	 */
	function _createBurnLot(address _account, uint256 _tokenAmount) internal {
		totalBurnLots++;

		// Generate burn lot Id
		bytes32 burnLotId = keccak256(abi.encodePacked(this, _account, totalBurnLots));

		// Make sure no one owns this lot yet
		require (burnLots[burnLotId].lotOwner == address(0));

		BurnLot storage burnLot = burnLots[burnLotId];
		burnLot.burnLotId = burnLotId;
		burnLot.lotOwner = _account;
		burnLot.tokenAmount = _tokenAmount;
		ownedBurnLots[_account].push(burnLotId);
		emit BurnLotCreation(burnLot.lotOwner, burnLot.burnLotId, burnLot.tokenAmount, ownerWeightedMultiplier[burnLot.lotOwner]);
	}

	/**
	 * @dev Get setting variables
	 * @return startingPrimordialMultiplier The starting multiplier used to calculate primordial token
	 * @return endingPrimordialMultiplier The ending multiplier used to calculate primordial token
	 * @return startingNetworkTokenBonusMultiplier The starting multiplier used to calculate network token bonus
	 * @return endingNetworkTokenBonusMultiplier The ending multiplier used to calculate network token bonus
	 */
	function _getSettingVariables() internal view returns (uint256, uint256, uint256, uint256) {
		(uint256 startingPrimordialMultiplier,,,,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'startingPrimordialMultiplier');
		(uint256 endingPrimordialMultiplier,,,,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'endingPrimordialMultiplier');

		(uint256 startingNetworkTokenBonusMultiplier,,,,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'startingNetworkTokenBonusMultiplier');
		(uint256 endingNetworkTokenBonusMultiplier,,,,) = _aoSetting.getSettingValuesByTAOName(settingTAOId, 'endingNetworkTokenBonusMultiplier');

		return (startingPrimordialMultiplier, endingPrimordialMultiplier, startingNetworkTokenBonusMultiplier, endingNetworkTokenBonusMultiplier);
	}
}
