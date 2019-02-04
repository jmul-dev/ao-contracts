pragma solidity ^0.4.24;

import './SafeMath.sol';
import './AOLibrary.sol';
import './TheAO.sol';
import './INameFactory.sol';
import './INameTAOPosition.sol';
import './INameAccountRecovery.sol';
import './TokenERC20.sol';
import './AOIon.sol';

/**
 * @title NameTAOVault
 */
contract NameTAOVault is TheAO {
	using SafeMath for uint256;

	address public nameFactoryAddress;
	address public nameAccountRecoveryAddress;
	address public aoIonAddress;

	INameFactory internal _nameFactory;
	INameTAOPosition internal _nameTAOPosition;
	INameAccountRecovery internal _nameAccountRecovery;
	AOIon internal _aoIon;

	// Event to be broadcasted to public when Advocate of `from` Name/TAO transfer ETH
	// `from` is a Name/TAO
	event TransferEth(address indexed advocateId, address from, address to, uint256 amount);

	// Event to be broadcasted to public when Advocate of `from` Name/TAO transfer ERC20 Token
	// `from` is a Name/TAO
	event TransferERC20(address indexed advocateId, address from, address to, uint256 amount, address erc20TokenAddress, string erc20Name, string erc20Symbol);

	// Event to be broadcasted to public when Advocate of `from` Name/TAO transfer AO
	// `from` is a Name/TAO
	event TransferAO(address indexed advocateId, address from, address to, uint256 amount);

	// Event to be broadcasted to public when Advocate of `from` Name/TAO transfer AO+
	// `from` is a Name/TAO
	event TransferPrimordialAO(address indexed advocateId, address from, address to, uint256 amount);

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress, address _nameTAOPositionAddress) public {
		setNameFactoryAddress(_nameFactoryAddress);
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
	 * @dev Check if `_id` is a Name or a TAO
	 */
	modifier isNameOrTAO(address _id) {
		require (AOLibrary.isName(_id) || AOLibrary.isTAO(_id));
		_;
	}

	/**
	 * @dev Check if msg.sender is the current advocate of Name ID
	 */
	modifier onlyAdvocate(address _id) {
		require (_nameTAOPosition.senderIsAdvocate(msg.sender, _id));
		_;
	}

	/**
	 * @dev Only allowed if sender's Name is not compromised
	 */
	modifier senderNameNotCompromised() {
		require (!_nameAccountRecovery.isCompromised(_nameFactory.ethAddressToNameId(msg.sender)));
		_;
	}

	/***** THE AO ONLY METHODS *****/
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
	 * @dev The AO sets NameFactory address
	 * @param _nameFactoryAddress The address of NameFactory
	 */
	function setNameFactoryAddress(address _nameFactoryAddress) public onlyTheAO {
		require (_nameFactoryAddress != address(0));
		nameFactoryAddress = _nameFactoryAddress;
		_nameFactory = INameFactory(_nameFactoryAddress);
	}

	/**
	 * @dev The AO sets NameTAOPosition address
	 * @param _nameTAOPositionAddress The address of NameTAOPosition
	 */
	function setNameTAOPositionAddress(address _nameTAOPositionAddress) public onlyTheAO {
		require (_nameTAOPositionAddress != address(0));
		nameTAOPositionAddress = _nameTAOPositionAddress;
		_nameTAOPosition = INameTAOPosition(_nameTAOPositionAddress);
	}

	/**
	 * @dev The AO set the NameAccountRecovery Address
	 * @param _nameAccountRecoveryAddress The address of NameAccountRecovery
	 */
	function setNameAccountRecoveryAddress(address _nameAccountRecoveryAddress) public onlyTheAO {
		require (_nameAccountRecoveryAddress != address(0));
		nameAccountRecoveryAddress = _nameAccountRecoveryAddress;
		_nameAccountRecovery = INameAccountRecovery(nameAccountRecoveryAddress);
	}

	/**
	 * @dev The AO sets AOIon (base denomination of AO) address
	 * @param _aoIonAddress The address of AOIon
	 */
	function setAOIonAddress(address _aoIonAddress) public onlyTheAO {
		require (_aoIonAddress != address(0));
		aoIonAddress = _aoIonAddress;
		_aoIon = AOIon(_aoIonAddress);
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Get Ethereum balance of `_id`
	 * @param _id The ID to check
	 * @return The ethereum balance
	 */
	function ethBalanceOf(address _id) public isNameOrTAO(_id) view returns (uint256) {
		return address(_id).balance;
	}

	/**
	 * @dev Get ERC20 token balance of `_id`
	 * @param _erc20TokenAddress The address of the ERC20 Token
	 * @param _id The ID to check
	 * @return The ERC20 Token balance
	 */
	function erc20BalanceOf(address _erc20TokenAddress, address _id) public isNameOrTAO(_id) view returns (uint256) {
		return TokenERC20(_erc20TokenAddress).balanceOf(_id);
	}

	/**
	 * @dev Get AO balance of `_id`
	 * @param _id The ID to check
	 * @return The AO balance
	 */
	function AOBalanceOf(address _id) public isNameOrTAO(_id) view returns (uint256) {
		return _aoIon.balanceOf(_id);
	}

	/**
	 * @dev Get AO+ balance of `_id`
	 * @param _id The ID to check
	 * @return The AO+ balance
	 */
	function primordialAOBalanceOf(address _id) public isNameOrTAO(_id) view returns (uint256) {
		return _aoIon.primordialBalanceOf(_id);
	}

	/**
	 * @dev Transfer `_amount` of ETH from `_from` to `_to`
	 * @param _from The sender address
	 * @param _to The recipient address
	 * @param _amount The amount to transfer
	 */
	function transferEth(address _from, address _to, uint256 _amount) public isNameOrTAO(_from) onlyAdvocate(_from) senderNameNotCompromised {
		require (_amount > 0 && address(_from).balance >= _amount);
		require (_to != address(0) && _from != _to);
		if (_nameFactory.nameIdToEthAddress(_from) != address(0)) {
			require (!_nameAccountRecovery.isCompromised(_from));
		}
		if (_nameFactory.nameIdToEthAddress(_to) != address(0)) {
			require (!_nameAccountRecovery.isCompromised(_to));
		}
		require (TAO(_from).transferEth(_to, _amount));
		emit TransferEth(_nameFactory.ethAddressToNameId(msg.sender), _from, _to, _amount);
	}

	/**
	 * @dev Transfer `_amount` of ERC20 Token from `_from` to `_to`
	 * @param _erc20TokenAddress The ERC20 Token Address
	 * @param _from The sender address
	 * @param _to The recipient address
	 * @param _amount The amount to transfer
	 */
	function transferERC20(address _erc20TokenAddress, address _from, address _to, uint256 _amount) public isNameOrTAO(_from) onlyAdvocate(_from) senderNameNotCompromised {
		require (AOLibrary.isValidERC20TokenAddress(_erc20TokenAddress));
		TokenERC20 _erc20 = TokenERC20(_erc20TokenAddress);
		require (_amount > 0 && _erc20.balanceOf(_from) >= _amount);
		require (_to != address(0) && _from != _to);
		if (_nameFactory.nameIdToEthAddress(_from) != address(0)) {
			require (!_nameAccountRecovery.isCompromised(_from));
		}
		if (_nameFactory.nameIdToEthAddress(_to) != address(0)) {
			require (!_nameAccountRecovery.isCompromised(_to));
		}
		require (TAO(_from).transferERC20(_erc20TokenAddress, _to, _amount));
		emit TransferERC20(_nameFactory.ethAddressToNameId(msg.sender), _from, _to, _amount, _erc20TokenAddress, _erc20.name(), _erc20.symbol());
	}

	/**
	 * @dev Transfer `_amount` of AO from `_from` to `_to`
	 * @param _from The sender address
	 * @param _to The recipient address
	 * @param _amount The amount to transfer
	 */
	function transferAO(address _from, address _to, uint256 _amount) public isNameOrTAO(_from) onlyAdvocate(_from) senderNameNotCompromised {
		require (_amount > 0 && _aoIon.balanceOf(_from) >= _amount);
		require (_to != address(0) && _from != _to);
		if (_nameFactory.nameIdToEthAddress(_from) != address(0)) {
			require (!_nameAccountRecovery.isCompromised(_from));
		}
		if (_nameFactory.nameIdToEthAddress(_to) != address(0)) {
			require (!_nameAccountRecovery.isCompromised(_to));
		}
		require (_aoIon.whitelistTransferFrom(_from, _to, _amount));
		emit TransferAO(_nameFactory.ethAddressToNameId(msg.sender), _from, _to, _amount);
	}

	/**
	 * @dev Transfer `_amount` of AO+ (Primordial) from `_from` to `_to`
	 * @param _from The sender address
	 * @param _to The recipient address
	 * @param _amount The amount to transfer
	 */
	function transferPrimordialAO(address _from, address _to, uint256 _amount) public isNameOrTAO(_from) onlyAdvocate(_from) senderNameNotCompromised {
		require (_amount > 0 && _aoIon.primordialBalanceOf(_from) >= _amount);
		require (_to != address(0) && _from != _to);
		if (_nameFactory.nameIdToEthAddress(_from) != address(0)) {
			require (!_nameAccountRecovery.isCompromised(_from));
		}
		if (_nameFactory.nameIdToEthAddress(_to) != address(0)) {
			require (!_nameAccountRecovery.isCompromised(_to));
		}
		require (_aoIon.whitelistTransferPrimordialFrom(_from, _to, _amount));
		emit TransferPrimordialAO(_nameFactory.ethAddressToNameId(msg.sender), _from, _to, _amount);
	}
}
