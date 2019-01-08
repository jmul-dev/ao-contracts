pragma solidity ^0.4.24;

import './SafeMath.sol';
import './AOLibrary.sol';
import './TheAO.sol';
import './TokenERC20.sol';
import './tokenRecipient.sol';
import './AOToken.sol';

/**
 * @title AOETH
 */
contract AOETH is TheAO, TokenERC20, tokenRecipient {
	using SafeMath for uint256;

	AOToken internal _ao;

	uint256 public totalERC20Tokens;
	uint256 public totalTokenExchanges;

	struct ERC20Token {
		address tokenAddress;
		uint256 price;			// price of this ERC20 Token to AOETH
		uint256 maxQuantity;	// To prevent too much exposure to a given asset
		uint256 exchangedQuantity;	// Running total (total AOETH exchanged from this specific ERC20 Token)
		bool active;
	}

	struct TokenExchange {
		bytes32 exchangeId;
		address buyer;			// The buyer address
		address tokenAddress;	// The address of ERC20 Token
		uint256 price;			// price of ERC20 Token to AOETH
		uint256 sentAmount;		// Amount of ERC20 Token sent
		uint256 receivedAmount;	// Amount of AOETH received
		bytes extraData; // Extra data
	}

	// Mapping from id to ERC20Token object
	mapping (uint256 => ERC20Token) internal erc20Tokens;
	mapping (address => uint256) internal erc20TokenIdLookup;

	// Mapping from id to TokenExchange object
	mapping (uint256 => TokenExchange) internal tokenExchanges;
	mapping (bytes32 => uint256) internal tokenExchangeIdLookup;
	mapping (address => uint256) public totalAddressTokenExchanges;

	// Event to be broadcasted to public when TheAO adds an ERC20 Token
	event AddERC20Token(address indexed tokenAddress, uint256 price, uint256 maxQuantity);

	// Event to be broadcasted to public when TheAO sets price for ERC20 Token
	event SetPrice(address indexed tokenAddress, uint256 price);

	// Event to be broadcasted to public when TheAO sets max quantity for ERC20 Token
	event SetMaxQuantity(address indexed tokenAddress, uint256 maxQuantity);

	// Event to be broadcasted to public when TheAO sets active status for ERC20 Token
	event SetActive(address indexed tokenAddress, bool active);

	// Event to be broadcasted to public when user exchanges ERC20 Token for AOETH
	event ExchangeToken(bytes32 indexed exchangeId, address indexed from, address tokenAddress, string tokenName, string tokenSymbol, uint256 sentTokenAmount, uint256 receivedAOETHAmount, bytes extraData);

	/**
	 * @dev Constructor function
	 */
	constructor(uint256 initialSupply, string tokenName, string tokenSymbol, address _aoTokenAddress)
		TokenERC20(initialSupply, tokenName, tokenSymbol) public {
		_ao = AOToken(_aoTokenAddress);
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
	 * @dev The AO set the NameTAOPosition Address
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	function setNameTAOPositionAddress(address _nameTAOPositionAddress) public onlyTheAO {
		require (_nameTAOPositionAddress != address(0));
		nameTAOPositionAddress = _nameTAOPositionAddress;
	}

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
	 * @dev Allows TheAO to transfer `_amount` of ETH from this address to `_recipient`
	 * @param _recipient The recipient address
	 * @param _amount The amount to transfer
	 */
	function transferEth(address _recipient, uint256 _amount) public onlyTheAO {
		_recipient.transfer(_amount);
	}

	/**
	 * @dev Allows TheAO to transfer `_amount` of ERC20 Token from this address to `_recipient`
	 * @param _erc20TokenAddress The address of ERC20 Token
	 * @param _recipient The recipient address
	 * @param _amount The amount to transfer
	 */
	function transferERC20(address _erc20TokenAddress, address _recipient, uint256 _amount) public onlyTheAO {
		TokenERC20 _erc20 = TokenERC20(_erc20TokenAddress);
		require (_erc20.transfer(_recipient, _amount));
	}

	/**
	 * @dev Add an ERC20 Token to the list
	 * @param _tokenAddress The address of the ERC20 Token
	 * @param _price The price of this token to AOETH
	 * @param _maxQuantity Maximum quantity allowed for exchange
	 */
	function addERC20Token(address _tokenAddress, uint256 _price, uint256 _maxQuantity) public onlyTheAO {
		require (_tokenAddress != address(0) && _price > 0 && _maxQuantity > 0);
		require (AOLibrary.isValidERC20TokenAddress(_tokenAddress));
		require (erc20TokenIdLookup[_tokenAddress] == 0);

		totalERC20Tokens++;
		erc20TokenIdLookup[_tokenAddress] = totalERC20Tokens;
		ERC20Token storage _erc20Token = erc20Tokens[totalERC20Tokens];
		_erc20Token.tokenAddress = _tokenAddress;
		_erc20Token.price = _price;
		_erc20Token.maxQuantity = _maxQuantity;
		_erc20Token.active = true;
		emit AddERC20Token(_erc20Token.tokenAddress, _erc20Token.price, _erc20Token.maxQuantity);
	}

	/**
	 * @dev Set price for existing ERC20 Token
	 * @param _tokenAddress The address of the ERC20 Token
	 * @param _price The price of this token to AOETH
	 */
	function setPrice(address _tokenAddress, uint256 _price) public onlyTheAO {
		require (erc20TokenIdLookup[_tokenAddress] > 0);

		ERC20Token storage _erc20Token = erc20Tokens[erc20TokenIdLookup[_tokenAddress]];
		_erc20Token.price = _price;
		emit SetPrice(_erc20Token.tokenAddress, _erc20Token.price);
	}

	/**
	 * @dev Set max quantity for existing ERC20 Token
	 * @param _tokenAddress The address of the ERC20 Token
	 * @param _maxQuantity The max exchange quantity for this token
	 */
	function setMaxQuantity(address _tokenAddress, uint256 _maxQuantity) public onlyTheAO {
		require (erc20TokenIdLookup[_tokenAddress] > 0);

		ERC20Token storage _erc20Token = erc20Tokens[erc20TokenIdLookup[_tokenAddress]];
		require (_maxQuantity > _erc20Token.exchangedQuantity);
		_erc20Token.maxQuantity = _maxQuantity;
		emit SetMaxQuantity(_erc20Token.tokenAddress, _erc20Token.maxQuantity);
	}

	/**
	 * @dev Set active status for existing ERC20 Token
	 * @param _tokenAddress The address of the ERC20 Token
	 * @param _active The active status for this token
	 */
	function setActive(address _tokenAddress, bool _active) public onlyTheAO {
		require (erc20TokenIdLookup[_tokenAddress] > 0);

		ERC20Token storage _erc20Token = erc20Tokens[erc20TokenIdLookup[_tokenAddress]];
		_erc20Token.active = _active;
		emit SetActive(_erc20Token.tokenAddress, _erc20Token.active);
	}

	/**
	 * @dev Whitelisted address transfer tokens from other address
	 *
	 * Send `_value` tokens to `_to` on behalf of `_from`
	 *
	 * @param _from The address of the sender
	 * @param _to The address of the recipient
	 * @param _value the amount to send
	 */
	function whitelistTransferFrom(address _from, address _to, uint256 _value) public inWhitelist returns (bool success) {
		_transfer(_from, _to, _value);
		return true;
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Get an ERC20 Token information given an ID
	 * @param _id The internal ID of the ERC20 Token
	 * @return The ERC20 Token address
	 * @return The name of the token
	 * @return The symbol of the token
	 * @return The price of this token to AOETH
	 * @return The max quantity for exchange
	 * @return The total AOETH exchanged from this token
	 * @return The status of this token
	 */
	function getById(uint256 _id) public view returns (address, string, string, uint256, uint256, uint256, bool) {
		require (erc20Tokens[_id].tokenAddress != address(0));
		ERC20Token memory _erc20Token = erc20Tokens[_id];
		return (
			_erc20Token.tokenAddress,
			TokenERC20(_erc20Token.tokenAddress).name(),
			TokenERC20(_erc20Token.tokenAddress).symbol(),
			_erc20Token.price,
			_erc20Token.maxQuantity,
			_erc20Token.exchangedQuantity,
			_erc20Token.active
		);
	}

	/**
	 * @dev Get an ERC20 Token information given an address
	 * @param _tokenAddress The address of the ERC20 Token
	 * @return The ERC20 Token address
	 * @return The name of the token
	 * @return The symbol of the token
	 * @return The price of this token to AOETH
	 * @return The max quantity for exchange
	 * @return The total AOETH exchanged from this token
	 * @return The status of this token
	 */
	function getByAddress(address _tokenAddress) public view returns (address, string, string, uint256, uint256, uint256, bool) {
		require (erc20TokenIdLookup[_tokenAddress] > 0);
		return getById(erc20TokenIdLookup[_tokenAddress]);
	}

	/**
	 * @dev When a user approves AOETH to spend on his/her behalf (i.e exchange to AOETH)
	 * @param _from The user address that approved AOETH
	 * @param _value The amount that the user approved
	 * @param _token The address of the ERC20 Token
	 * @param _extraData The extra data sent during the approval
	 */
	function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData) external {
		require (_from != address(0));
		require (AOLibrary.isValidERC20TokenAddress(_token));

		// Check if the token is supported
		require (erc20TokenIdLookup[_token] > 0);
		ERC20Token storage _erc20Token = erc20Tokens[erc20TokenIdLookup[_token]];
		require (_erc20Token.active && _erc20Token.price > 0 && _erc20Token.exchangedQuantity < _erc20Token.maxQuantity);

		uint256 amountToTransfer = _value.div(_erc20Token.price);
		require (_erc20Token.maxQuantity.sub(_erc20Token.exchangedQuantity) >= amountToTransfer);
		require (_ao.availableETH() >= amountToTransfer);

		// Burn the ERC20 Token from the `_from` address
		require (TokenERC20(_token).burnFrom(_from, _value));

		_erc20Token.exchangedQuantity = _erc20Token.exchangedQuantity.add(amountToTransfer);
		balanceOf[_from] = balanceOf[_from].add(amountToTransfer);
		totalSupply = totalSupply.add(amountToTransfer);

		// Store the TokenExchange information
		totalTokenExchanges++;
		totalAddressTokenExchanges[_from]++;
		bytes32 _exchangeId = keccak256(abi.encodePacked(this, _from, totalTokenExchanges));
		tokenExchangeIdLookup[_exchangeId] = totalTokenExchanges;

		TokenExchange storage _tokenExchange = tokenExchanges[totalTokenExchanges];
		_tokenExchange.exchangeId = _exchangeId;
		_tokenExchange.buyer = _from;
		_tokenExchange.tokenAddress = _token;
		_tokenExchange.price = _erc20Token.price;
		_tokenExchange.sentAmount = _value;
		_tokenExchange.receivedAmount = amountToTransfer;
		_tokenExchange.extraData = _extraData;

		emit ExchangeToken(_tokenExchange.exchangeId, _tokenExchange.buyer, _tokenExchange.tokenAddress, TokenERC20(_token).name(), TokenERC20(_token).symbol(), _tokenExchange.sentAmount, _tokenExchange.receivedAmount, _tokenExchange.extraData);
	}

	/**
	 * @dev Get TokenExchange information given an exchange ID
	 * @param _exchangeId The exchange ID to query
	 * @return The buyer address
	 * @return The sent ERC20 Token address
	 * @return The ERC20 Token name
	 * @return The ERC20 Token symbol
	 * @return The price of ERC20 Token to AOETH
	 * @return The amount of ERC20 Token sent
	 * @return The amount of AOETH received
	 * @return Extra data during the transaction
	 */
	function getTokenExchangeById(bytes32 _exchangeId) public view returns (address, address, string, string, uint256, uint256,  uint256, bytes) {
		require (tokenExchangeIdLookup[_exchangeId] > 0);
		TokenExchange memory _tokenExchange = tokenExchanges[tokenExchangeIdLookup[_exchangeId]];
		return (
			_tokenExchange.buyer,
			_tokenExchange.tokenAddress,
			TokenERC20(_tokenExchange.tokenAddress).name(),
			TokenERC20(_tokenExchange.tokenAddress).symbol(),
			_tokenExchange.price,
			_tokenExchange.sentAmount,
			_tokenExchange.receivedAmount,
			_tokenExchange.extraData
		);
	}
}
