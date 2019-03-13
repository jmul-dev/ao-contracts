pragma solidity ^0.5.4;

import './SafeMath.sol';
import './AOLibrary.sol';
import './TheAO.sol';
import './IAOPurchaseReceipt.sol';
import './IAOContent.sol';
import './IAOStakedContent.sol';
import './IAOContentHost.sol';
import './IAOTreasury.sol';
import './IAOEarning.sol';

/**
 * @title AOPurchaseReceipt
 */
contract AOPurchaseReceipt is TheAO, IAOPurchaseReceipt {
	using SafeMath for uint256;

	uint256 public totalPurchaseReceipts;
	address public aoContentAddress;
	address public aoStakedContentAddress;
	address public aoContentHostAddress;
	address public aoTreasuryAddress;
	address public aoEarningAddress;

	IAOContent internal _aoContent;
	IAOStakedContent internal _aoStakedContent;
	IAOContentHost internal _aoContentHost;
	IAOTreasury internal _aoTreasury;
	IAOEarning internal _aoEarning;

	struct PurchaseReceipt {
		bytes32 purchaseReceiptId;
		bytes32 contentHostId;
		bytes32 stakedContentId;
		bytes32 contentId;
		address buyer;
		uint256 price;
		uint256 amountPaidByBuyer;	// total network ion paid in base denomination
		uint256 amountPaidByAO; // total amount paid by AO
		string publicKey; // The public key provided by request node
		address publicAddress; // The public address provided by request node
		uint256 createdOnTimestamp;
	}

	// Mapping from PurchaseReceipt index to the PurchaseReceipt object
	mapping (uint256 => PurchaseReceipt) internal purchaseReceipts;

	// Mapping from purchase receipt ID to index of the purchaseReceipts list
	mapping (bytes32 => uint256) internal purchaseReceiptIndex;

	// Mapping from buyer's content host ID to the buy ID
	// To check whether or not buyer has bought/paid for a content
	mapping (address => mapping (bytes32 => bytes32)) public buyerPurchaseReceipts;

	// Event to be broadcasted to public when a request node buys a content
	event BuyContent(
		address indexed buyer,
		bytes32 indexed purchaseReceiptId,
		bytes32 indexed contentHostId,
		bytes32 stakedContentId,
		bytes32 contentId,
		uint256 price,
		uint256 amountPaidByAO,
		uint256 amountPaidByBuyer,
		string publicKey,
		address publicAddress,
		uint256 createdOnTimestamp
	);

	/**
	 * @dev Constructor function
	 * @param _aoContentAddress The address of AOContent
	 * @param _aoStakedContentAddress The address of AOStakedContent
	 * @param _aoTreasuryAddress The address of AOTreasury
	 * @param _aoEarningAddress The address of AOEarning
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	constructor(address _aoContentAddress,
		address _aoStakedContentAddress,
		address _aoTreasuryAddress,
		address _aoEarningAddress,
		address _nameTAOPositionAddress
		) public {
		setAOContentAddress(_aoContentAddress);
		setAOStakedContentAddress(_aoStakedContentAddress);
		setAOTreasuryAddress(_aoTreasuryAddress);
		setAOEarningAddress(_aoEarningAddress);
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
	 * @dev The AO sets AOContent address
	 * @param _aoContentAddress The address of AOContent
	 */
	function setAOContentAddress(address _aoContentAddress) public onlyTheAO {
		require (_aoContentAddress != address(0));
		aoContentAddress = _aoContentAddress;
		_aoContent = IAOContent(_aoContentAddress);
	}

	/**
	 * @dev The AO sets AOStakedContent address
	 * @param _aoStakedContentAddress The address of AOStakedContent
	 */
	function setAOStakedContentAddress(address _aoStakedContentAddress) public onlyTheAO {
		require (_aoStakedContentAddress != address(0));
		aoStakedContentAddress = _aoStakedContentAddress;
		_aoStakedContent = IAOStakedContent(_aoStakedContentAddress);
	}

	/**
	 * @dev The AO sets AOContentHost address
	 * @param _aoContentHostAddress The address of AOContentHost
	 */
	function setAOContentHostAddress(address _aoContentHostAddress) public onlyTheAO {
		require (_aoContentHostAddress != address(0));
		aoContentHostAddress = _aoContentHostAddress;
		_aoContentHost = IAOContentHost(_aoContentHostAddress);
	}

	/**
	 * @dev The AO sets AOTreasury address
	 * @param _aoTreasuryAddress The address of AOTreasury
	 */
	function setAOTreasuryAddress(address _aoTreasuryAddress) public onlyTheAO {
		require (_aoTreasuryAddress != address(0));
		aoTreasuryAddress = _aoTreasuryAddress;
		_aoTreasury = IAOTreasury(_aoTreasuryAddress);
	}

	/**
	 * @dev The AO sets AOEarning address
	 * @param _aoEarningAddress The address of AOEarning
	 */
	function setAOEarningAddress(address _aoEarningAddress) public onlyTheAO {
		require (_aoEarningAddress != address(0));
		aoEarningAddress = _aoEarningAddress;
		_aoEarning = IAOEarning(_aoEarningAddress);
	}

	/**
	 * @dev The AO sets NameTAOPosition address
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	function setNameTAOPositionAddress(address _nameTAOPositionAddress) public onlyTheAO {
		require (_nameTAOPositionAddress != address(0));
		nameTAOPositionAddress = _nameTAOPositionAddress;
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Bring content in to the requesting node by sending network ions to the contract to pay for the content
	 * @param _contentHostId The ID of hosted content
	 * @param _networkIntegerAmount The integer amount of network ion to pay
	 * @param _networkFractionAmount The fraction amount of network ion to pay
	 * @param _denomination The denomination of the network ion, i.e ao, kilo, mega, etc.
	 * @param _publicKey The public key of the request node
	 * @param _publicAddress The public address of the request node
	 */
	function buyContent(bytes32 _contentHostId,
		uint256 _networkIntegerAmount,
		uint256 _networkFractionAmount,
		bytes8 _denomination,
		string memory _publicKey,
		address _publicAddress
	) public {
		require (_canBuy(msg.sender, _contentHostId, _publicKey, _publicAddress));

		(bytes32 _stakedContentId, bytes32 _contentId,,,) = _aoContentHost.getById(_contentHostId);

		// Make sure the ion amount can pay for the content price
		if (_aoContent.isAOContentUsageType(_contentId)) {
			require (_canBuyAOContent(_aoContentHost.contentHostPrice(_contentHostId), _networkIntegerAmount, _networkFractionAmount, _denomination));
		}

		// Increment totalPurchaseReceipts;
		totalPurchaseReceipts++;

		// Generate purchaseReceiptId
		bytes32 _purchaseReceiptId = keccak256(abi.encodePacked(this, msg.sender, _contentHostId));
		PurchaseReceipt storage _purchaseReceipt = purchaseReceipts[totalPurchaseReceipts];

		// Make sure the node doesn't buy the same content twice
		require (_purchaseReceipt.buyer == address(0));

		_purchaseReceipt.purchaseReceiptId = _purchaseReceiptId;
		_purchaseReceipt.contentHostId = _contentHostId;
		_purchaseReceipt.stakedContentId = _stakedContentId;
		_purchaseReceipt.contentId = _contentId;
		_purchaseReceipt.buyer = msg.sender;
		// Update the receipt with the correct network amount
		_purchaseReceipt.price = _aoContentHost.contentHostPrice(_contentHostId);
		_purchaseReceipt.amountPaidByAO = _aoContentHost.contentHostPaidByAO(_contentHostId);
		_purchaseReceipt.amountPaidByBuyer = _purchaseReceipt.price.sub(_purchaseReceipt.amountPaidByAO);
		_purchaseReceipt.publicKey = _publicKey;
		_purchaseReceipt.publicAddress = _publicAddress;
		_purchaseReceipt.createdOnTimestamp = now;

		purchaseReceiptIndex[_purchaseReceiptId] = totalPurchaseReceipts;
		buyerPurchaseReceipts[msg.sender][_contentHostId] = _purchaseReceiptId;

		// Calculate content creator/host/The AO earning from this purchase and store them in escrow
		require (_aoEarning.calculateEarning(_purchaseReceiptId));

		emit BuyContent(
			_purchaseReceipt.buyer,
			_purchaseReceipt.purchaseReceiptId,
			_purchaseReceipt.contentHostId,
			_purchaseReceipt.stakedContentId,
			_purchaseReceipt.contentId,
			_purchaseReceipt.price,
			_purchaseReceipt.amountPaidByAO,
			_purchaseReceipt.amountPaidByBuyer,
			_purchaseReceipt.publicKey,
			_purchaseReceipt.publicAddress,
			_purchaseReceipt.createdOnTimestamp
		);
	}

	/**
	 * @dev Return purchase receipt info at a given ID
	 * @param _purchaseReceiptId The ID of the purchased content
	 * @return The ID of the content host
	 * @return The ID of the staked content
	 * @return The ID of the content
	 * @return address of the buyer
	 * @return price of the content
	 * @return amount paid by AO
	 * @return amount paid by Buyer
	 * @return request node's public key
	 * @return request node's public address
	 * @return created on timestamp
	 */
	function getById(bytes32 _purchaseReceiptId) external view returns (bytes32, bytes32, bytes32, address, uint256, uint256, uint256, string memory, address, uint256) {
		// Make sure the purchase receipt exist
		require (this.isExist(_purchaseReceiptId));
		PurchaseReceipt memory _purchaseReceipt = purchaseReceipts[purchaseReceiptIndex[_purchaseReceiptId]];
		return (
			_purchaseReceipt.contentHostId,
			_purchaseReceipt.stakedContentId,
			_purchaseReceipt.contentId,
			_purchaseReceipt.buyer,
			_purchaseReceipt.price,
			_purchaseReceipt.amountPaidByBuyer,
			_purchaseReceipt.amountPaidByAO,
			_purchaseReceipt.publicKey,
			_purchaseReceipt.publicAddress,
			_purchaseReceipt.createdOnTimestamp
		);
	}

	/**
	 * @dev Check whether or not sender is the buyer of purchase receipt ID
	 * @param _purchaseReceiptId The ID of the Purchase Receipt to be checked
	 * @param _sender The sender address
	 * @return true if yes, false otherwise
	 */
	function senderIsBuyer(bytes32 _purchaseReceiptId, address _sender) external view returns (bool) {
		require (this.isExist(_purchaseReceiptId));
		require (_sender != address(0));
		PurchaseReceipt memory _purchaseReceipt = purchaseReceipts[purchaseReceiptIndex[_purchaseReceiptId]];
		return (_purchaseReceipt.buyer == _sender);
	}

	/**
	 * @dev Check whether or not a purchaseReceiptId exist
	 * @param _purchaseReceiptId The PurchaseReceipt ID to be checked
	 * @return true if yes, false otherwise
	 */
	function isExist(bytes32 _purchaseReceiptId) external view returns (bool) {
		return (purchaseReceiptIndex[_purchaseReceiptId] > 0);
	}

	/***** INTERNAL METHODS *****/
	/**
	 * @dev Check whether or not the passed params valid
	 * @param _buyer The address of the buyer
	 * @param _contentHostId The ID of hosted content
	 * @param _publicKey The public key of the request node
	 * @param _publicAddress The public address of the request node
	 * @return true if yes, false otherwise
	 */
	function _canBuy(address _buyer,
		bytes32 _contentHostId,
		string memory _publicKey,
		address _publicAddress
	) internal view returns (bool) {
		(bytes32 _stakedContentId,,address _host,,) = _aoContentHost.getById(_contentHostId);

		// Make sure the content host exist
		return (_aoContentHost.isExist(_contentHostId) &&
			_buyer != address(0) &&
			_buyer != _host &&
			bytes(_publicKey).length > 0 &&
			_publicAddress != address(0) &&
			_aoStakedContent.isActive(_stakedContentId) &&
			buyerPurchaseReceipts[_buyer][_contentHostId][0] == 0
		);
	}

	/**
	 * @dev Check whether the network ion is adequate to pay for existing staked content
	 * @param _price The price of the content
	 * @param _networkIntegerAmount The integer amount of the network ion
	 * @param _networkFractionAmount The fraction amount of the network ion
	 * @param _denomination The denomination of the the network ion
	 * @return true when the amount is sufficient, false otherwise
	 */
	function _canBuyAOContent(uint256 _price, uint256 _networkIntegerAmount, uint256 _networkFractionAmount, bytes8 _denomination) internal view returns (bool) {
		return _aoTreasury.toBase(_networkIntegerAmount, _networkFractionAmount, _denomination) >= _price;
	}
}
