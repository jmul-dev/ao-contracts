pragma solidity ^0.4.24;

import './SafeMath.sol';
import './AOLibrary.sol';
import './TheAO.sol';
import './AOContent.sol';
import './AOStakedContent.sol';
import './AOPurchaseReceipt.sol';
import './AOEarning.sol';

/**
 * @title AOContentHost
 */
contract AOContentHost is TheAO {
	using SafeMath for uint256;

	uint256 public totalContentHosts;
	address public aoContentAddress;
	address public aoStakedContentAddress;
	address public aoPurchaseReceiptAddress;
	address public aoEarningAddress;

	AOContent internal _aoContent;
	AOStakedContent internal _aoStakedContent;
	AOPurchaseReceipt internal _aoPurchaseReceipt;
	AOEarning internal _aoEarning;

	struct ContentHost {
		bytes32 contentHostId;
		bytes32 stakeId;
		bytes32 contentId;
		address host;
		/**
		 * encChallenge is the content's PUBLIC KEY unique to the host
		 */
		string encChallenge;
		string contentDatKey;
		string metadataDatKey;
	}

	// Mapping from ContentHost index to the ContentHost object
	mapping (uint256 => ContentHost) internal contentHosts;

	// Mapping from content host ID to index of the contentHosts list
	mapping (bytes32 => uint256) internal contentHostIndex;

	// Event to be broadcasted to public when a node hosts a content
	event HostContent(address indexed host, bytes32 indexed contentHostId, bytes32 stakeId, bytes32 contentId, string contentDatKey, string metadataDatKey);

	/**
	 * @dev Constructor function
	 * @param _aoContentAddress The address of AOContent
	 * @param _aoStakedContentAddress The address of AOStakedContent
	 * @param _aoPurchaseReceiptAddress The address of AOPurchaseReceipt
	 * @param _aoEarningAddress The address of AOEarning
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	constructor(address _aoContentAddress, address _aoStakedContentAddress, address _aoPurchaseReceiptAddress, address _aoEarningAddress, address _nameTAOPositionAddress) public {
		setAOContentAddress(_aoContentAddress);
		setAOStakedContentAddress(_aoStakedContentAddress);
		setAOPurchaseReceiptAddress(_aoPurchaseReceiptAddress);
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
		_aoContent = AOContent(_aoContentAddress);
	}

	/**
	 * @dev The AO sets AOStakedContent address
	 * @param _aoStakedContentAddress The address of AOStakedContent
	 */
	function setAOStakedContentAddress(address _aoStakedContentAddress) public onlyTheAO {
		require (_aoStakedContentAddress != address(0));
		aoStakedContentAddress = _aoStakedContentAddress;
		_aoStakedContent = AOStakedContent(_aoStakedContentAddress);
	}

	/**
	 * @dev The AO sets AOPurchaseReceipt address
	 * @param _aoPurchaseReceiptAddress The address of AOPurchaseReceipt
	 */
	function setAOPurchaseReceiptAddress(address _aoPurchaseReceiptAddress) public onlyTheAO {
		require (_aoPurchaseReceiptAddress != address(0));
		aoPurchaseReceiptAddress = _aoPurchaseReceiptAddress;
		_aoPurchaseReceipt = AOPurchaseReceipt(_aoPurchaseReceiptAddress);
	}

	/**
	 * @dev The AO sets AOEarning address
	 * @param _aoEarningAddress The address of AOEarning
	 */
	function setAOEarningAddress(address _aoEarningAddress) public onlyTheAO {
		require (_aoEarningAddress != address(0));
		aoEarningAddress = _aoEarningAddress;
		_aoEarning = AOEarning(_aoEarningAddress);
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
	 * @dev Add the distribution node info that hosts the content
	 * @param _host the address of the host
	 * @param _stakeId The ID of the staked content
	 * @param _encChallenge The encrypted challenge string (PUBLIC KEY) of the content unique to the host
	 * @param _contentDatKey The dat key of the content
	 * @param _metadataDatKey The dat key of the content's metadata
	 * @return true on success
	 */
	function create(address _host, bytes32 _stakeId, string _encChallenge, string _contentDatKey, string _metadataDatKey) public inWhitelist returns (bool) {
		require (_create(_host, _stakeId, _encChallenge, _contentDatKey, _metadataDatKey));
		return true;
	}

	/**
	 * @dev Return content host info at a given ID
	 * @param _contentHostId The ID of the hosted content
	 * @return The ID of the staked content
	 * @return The ID of the content
	 * @return address of the host
	 * @return the dat key of the content
	 * @return the dat key of the content's metadata
	 */
	function getById(bytes32 _contentHostId) public view returns (bytes32, bytes32, address, string, string) {
		// Make sure the content host exist
		require (contentHostIndex[_contentHostId] > 0);
		ContentHost memory _contentHost = contentHosts[contentHostIndex[_contentHostId]];
		return (
			_contentHost.stakeId,
			_contentHost.contentId,
			_contentHost.host,
			_contentHost.contentDatKey,
			_contentHost.metadataDatKey
		);
	}

	/**
	 * @dev Determine the content price hosted by a host
	 * @param _contentHostId The content host ID to be checked
	 * @return the price of the content
	 */
	function contentHostPrice(bytes32 _contentHostId) public view returns (uint256) {
		// Make sure content host exist
		require (contentHostIndex[_contentHostId] > 0);

		bytes32 _stakeId = contentHosts[contentHostIndex[_contentHostId]].stakeId;
		require (_aoStakedContent.isActive(_stakeId));

		(,,uint256 _networkAmount, uint256 _primordialAmount,,,,) = _aoStakedContent.getById(_stakeId);
		return _networkAmount.add(_primordialAmount);
	}

	/**
	 * @dev Determine the how much the content is paid by AO given a contentHostId
	 * @param _contentHostId The content host ID to be checked
	 * @return the amount paid by AO
	 */
	function contentHostPaidByAO(bytes32 _contentHostId) public view returns (uint256) {
		bytes32 _contentId = contentHosts[contentHostIndex[_contentHostId]].contentId;
		if (_aoContent.isAOContentUsageType(_contentId)) {
			return 0;
		} else {
			return contentHostPrice(_contentHostId);
		}
	}

	/**
	 * @dev Check whether or not a contentHostId exist
	 * @param _contentHostId The content host ID to be checked
	 * @return true if yes, false otherwise
	 */
	function isExist(bytes32 _contentHostId) public view returns (bool) {
		return (contentHostIndex[_contentHostId] > 0);
	}

	/**
	 * @dev Request node wants to become a distribution node after buying the content
	 *		Also, if this transaction succeeds, contract will release all of the earnings that are
	 *		currently in escrow for content creator/host/The AO
	 * @param _purchaseReceiptId The ID of the Purchase Receipt
	 * @param _baseChallengeV The V part of signature when signing the base challenge
	 * @param _baseChallengeR The R part of signature when signing the base challenge
	 * @param _baseChallengeS The S part of signature when signing the base challenge
	 * @param _encChallenge The encrypted challenge string (PUBLIC KEY) of the content unique to the host
	 * @param _contentDatKey The dat key of the content
	 * @param _metadataDatKey The dat key of the content's metadata
	 */
	function becomeHost(
		bytes32 _purchaseReceiptId,
		uint8 _baseChallengeV,
		bytes32 _baseChallengeR,
		bytes32 _baseChallengeS,
		string _encChallenge,
		string _contentDatKey,
		string _metadataDatKey
	) public {
		require (_canBecomeHost(_purchaseReceiptId, msg.sender, _baseChallengeV, _baseChallengeR, _baseChallengeS));

		(bytes32[] memory _bytesValues, uint256 _amountPaidByBuyer) = _getPurchaseReceiptInfo(_purchaseReceiptId);
		(, address _stakeOwner,,,,,,) = _aoStakedContent.getById(_bytesValues[1]);
		(, uint256 _fileSize,,,,,,,) = _aoContent.getById(_bytesValues[2]);

		require (_create(msg.sender, _bytesValues[1], _encChallenge, _contentDatKey, _metadataDatKey));

		// Release earning from escrow
		require (_aoEarning.releaseEarning(
			_bytesValues[1],
			_bytesValues[0],
			_purchaseReceiptId,
			(_amountPaidByBuyer > _fileSize),
			_stakeOwner,
			contentHosts[contentHostIndex[_bytesValues[0]]].host)
		);
	}

	/***** INTERNAL METHODS *****/
	/**
	 * @dev Actual add the distribution node info that hosts the content
	 * @param _host the address of the host
	 * @param _stakeId The ID of the staked content
	 * @param _encChallenge The encrypted challenge string (PUBLIC KEY) of the content unique to the host
	 * @param _contentDatKey The dat key of the content
	 * @param _metadataDatKey The dat key of the content's metadata
	 * @return true on success
	 */
	function _create(address _host, bytes32 _stakeId, string _encChallenge, string _contentDatKey, string _metadataDatKey) internal returns (bool) {
		require (bytes(_encChallenge).length > 0);
		require (bytes(_contentDatKey).length > 0);
		require (bytes(_metadataDatKey).length > 0);
		require (_aoStakedContent.isActive(_stakeId));

		// Increment totalContentHosts
		totalContentHosts++;

		// Generate contentId
		bytes32 _contentHostId = keccak256(abi.encodePacked(this, _host, _stakeId));

		ContentHost storage _contentHost = contentHosts[totalContentHosts];

		// Make sure the node doesn't host the same content twice
		require (_contentHost.host == address(0));

		(bytes32 _contentId,,,,,,,) = _aoStakedContent.getById(_stakeId);

		_contentHost.contentHostId = _contentHostId;
		_contentHost.stakeId = _stakeId;
		_contentHost.contentId = _contentId;
		_contentHost.host = _host;
		_contentHost.encChallenge = _encChallenge;
		_contentHost.contentDatKey = _contentDatKey;
		_contentHost.metadataDatKey = _metadataDatKey;

		contentHostIndex[_contentHostId] = totalContentHosts;

		emit HostContent(_contentHost.host, _contentHost.contentHostId, _contentHost.stakeId, _contentHost.contentId, _contentHost.contentDatKey, _contentHost.metadataDatKey);
		return true;
	}

	/**
	 * @dev Check whether or not the passed params are valid
	 * @param _purchaseReceiptId The ID of the Purchase Receipt
	 * @param _sender The address of the sender
	 * @param _baseChallengeV The V part of signature when signing the base challenge
	 * @param _baseChallengeR The R part of signature when signing the base challenge
	 * @param _baseChallengeS The S part of signature when signing the base challenge
	 * @return true if yes, false otherwise
	 */
	function _canBecomeHost(bytes32 _purchaseReceiptId, address _sender, uint8 _baseChallengeV, bytes32 _baseChallengeR, bytes32 _baseChallengeS) internal view returns (bool) {
		// Make sure the purchase receipt owner is the same as the sender
		return (_aoPurchaseReceipt.senderIsBuyer(_purchaseReceiptId, _sender) &&
			_verifyBecomeHostSignature(_purchaseReceiptId, _baseChallengeV, _baseChallengeR, _baseChallengeS)
		);
	}

	/**
	 * @dev Verify the become host signature
	 * @param _purchaseReceiptId The ID of the purchase receipt
	 * @param _v part of the signature
	 * @param _r part of the signature
	 * @param _s part of the signature
	 * @return true if valid, false otherwise
	 */
	function _verifyBecomeHostSignature(bytes32 _purchaseReceiptId, uint8 _v, bytes32 _r, bytes32 _s) internal view returns (bool) {
		(,, bytes32 _contentId,,,,,, address _publicAddress,) = _aoPurchaseReceipt.getById(_purchaseReceiptId);

		bytes32 _hash = keccak256(abi.encodePacked(address(this), _aoContent.getBaseChallenge(_contentId)));
		return (ecrecover(_hash, _v, _r, _s) == _publicAddress);
	}

	/**
	 * @dev Helper function to get purchase receipt info
	 * @param _purchaseReceiptId The ID of the purchase receipt
	 * @return array of bytes32
	 *			[0] = contentHostId
	 *			[1] = stakeId
	 *			[2] = contentId
	 * @return amount paid by buyer
	 */
	function _getPurchaseReceiptInfo(bytes32 _purchaseReceiptId) internal view returns (bytes32[], uint256) {
		(bytes32 _contentHostId, bytes32 _stakeId, bytes32 _contentId,,, uint256 _amountPaidByBuyer,,,,) = _aoPurchaseReceipt.getById(_purchaseReceiptId);
		bytes32[] memory _bytesValues = new bytes32[](3);
		_bytesValues[0] = _contentHostId;
		_bytesValues[1] = _stakeId;
		_bytesValues[2] = _contentId;
		return (_bytesValues, _amountPaidByBuyer);
	}
}
