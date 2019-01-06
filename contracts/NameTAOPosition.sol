pragma solidity ^0.4.24;

import './TheAO.sol';
import './AOLibrary.sol';
import './NameFactory.sol';
import './TAOFactory.sol';

/**
 * @title NameTAOPosition
 */
contract NameTAOPosition is TheAO {
	address public nameFactoryAddress;
	address public taoFactoryAddress;

	NameFactory internal _nameFactory;
	TAOFactory internal _taoFactory;

	struct Position {
		address advocateId;
		address listenerId;
		address speakerId;
		bool created;
	}

	mapping (address => Position) internal positions;

	// Event to be broadcasted to public when current Advocate of TAO sets New Advocate
	event SetAdvocate(address indexed taoId, address oldAdvocateId, address newAdvocateId, uint256 nonce);

	// Event to be broadcasted to public when current Advocate of Name/TAO sets New Listener
	event SetListener(address indexed taoId, address oldListenerId, address newListenerId, uint256 nonce);

	// Event to be broadcasted to public when current Advocate of Name/TAO sets New Speaker
	event SetSpeaker(address indexed taoId, address oldSpeakerId, address newSpeakerId, uint256 nonce);

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress) public {
		nameFactoryAddress = _nameFactoryAddress;
		_nameFactory = NameFactory(_nameFactoryAddress);
		nameTAOPositionAddress = address(this);
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
	 * @dev Check if calling address is Factory
	 */
	modifier onlyFactory {
		require (msg.sender == nameFactoryAddress || msg.sender == taoFactoryAddress);
		_;
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
	 * @dev Check if `_id` is a Name or a TAO
	 */
	modifier isNameOrTAO(address _id) {
		require (AOLibrary.isName(_id) || AOLibrary.isTAO(_id));
		_;
	}

	/**
	 * @dev Check is msg.sender address is a Name
	 */
	 modifier senderIsName() {
		require (_nameFactory.ethAddressToNameId(msg.sender) != address(0));
		_;
	 }

	/**
	 * @dev Check if msg.sender is the current advocate of a Name/TAO ID
	 */
	modifier onlyAdvocate(address _id) {
		require (senderIsAdvocate(msg.sender, _id));
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
	 * @dev The AO set the taoFactoryAddress Address
	 * @param _taoFactoryAddress The address of TAOFactory
	 */
	function setTAOFactoryAddress(address _taoFactoryAddress) public onlyTheAO {
		require (_taoFactoryAddress != address(0));
		taoFactoryAddress = _taoFactoryAddress;
		_taoFactory = TAOFactory(_taoFactoryAddress);
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Check whether or not a Name/TAO ID exist in the list
	 * @param _id The ID to be checked
	 * @return true if yes, false otherwise
	 */
	function isExist(address _id) public view returns (bool) {
		return positions[_id].created;
	}

	/**
	 * @dev Check whether or not eth address is advocate of _id
	 * @param _sender The eth address to check
	 * @param _id The ID to be checked
	 * @return true if yes, false otherwise
	 */
	function senderIsAdvocate(address _sender, address _id) public view returns (bool) {
		return (positions[_id].created && positions[_id].advocateId == _nameFactory.ethAddressToNameId(_sender));
	}

	/**
	 * @dev Check whether or not eth address is either Advocate/Listener/Speaker of _id
	 * @param _sender The eth address to check
	 * @param _id The ID to be checked
	 * @return true if yes, false otherwise
	 */
	function senderIsPosition(address _sender, address _id) public view returns (bool) {
		address _nameId = _nameFactory.ethAddressToNameId(_sender);
		if (_nameId == address(0)) {
			return false;
		} else {
			return (positions[_id].created &&
				(positions[_id].advocateId == _nameId ||
				 positions[_id].listenerId == _nameId ||
				 positions[_id].speakerId == _nameId
				)
			);
		}
	}

	/**
	 * @dev Check whether or not _nameId is advocate of _id
	 * @param _nameId The name ID to be checked
	 * @param _id The ID to be checked
	 * @return true if yes, false otherwise
	 */
	function nameIsAdvocate(address _nameId, address _id) public view returns (bool) {
		return (positions[_id].created && positions[_id].advocateId == _nameId);
	}

	/**
	 * @dev Determine whether or not `_sender` is Advocate/Listener/Speaker of the Name/TAO
	 * @param _sender The ETH address that to check
	 * @param _id The ID of the Name/TAO
	 * @return 1 if Advocate. 2 if Listener. 3 if Speaker
	 */
	function determinePosition(address _sender, address _id) public view returns (uint256) {
		require (senderIsPosition(_sender, _id));
		Position memory _position = positions[_id];
		address _nameId = _nameFactory.ethAddressToNameId(_sender);
		if (_nameId == _position.advocateId) {
			return 1;
		} else if (_nameId == _position.listenerId) {
			return 2;
		} else {
			return 3;
		}
	}

	/**
	 * @dev Add Position for a Name/TAO
	 * @param _id The ID of the Name/TAO
	 * @param _advocateId The Advocate ID of the Name/TAO
	 * @param _listenerId The Listener ID of the Name/TAO
	 * @param _speakerId The Speaker ID of the Name/TAO
	 * @return true on success
	 */
	function add(address _id, address _advocateId, address _listenerId, address _speakerId)
		public
		isNameOrTAO(_id)
		isName(_advocateId)
		isNameOrTAO(_listenerId)
		isNameOrTAO(_speakerId)
		onlyFactory returns (bool) {
		require (!isExist(_id));

		Position storage _position = positions[_id];
		_position.advocateId = _advocateId;
		_position.listenerId = _listenerId;
		_position.speakerId = _speakerId;
		_position.created = true;
		return true;
	}

	/**
	 * @dev Get Name/TAO's Position info
	 * @param _id The ID of the Name/TAO
	 * @return the Advocate ID of Name/TAO
	 * @return the Listener ID of Name/TAO
	 * @return the Speaker ID of Name/TAO
	 */
	function getPositionById(address _id) public view returns (address, address, address) {
		require (isExist(_id));
		Position memory _position = positions[_id];
		return (
			_position.advocateId,
			_position.listenerId,
			_position.speakerId
		);
	}

	/**
	 * @dev Get Name/TAO's Advocate
	 * @param _id The ID of the Name/TAO
	 * @return the Advocate ID of Name/TAO
	 */
	function getAdvocate(address _id) public view returns (address) {
		require (isExist(_id));
		Position memory _position = positions[_id];
		return _position.advocateId;
	}

	/**
	 * @dev Get Name/TAO's Listener
	 * @param _id The ID of the Name/TAO
	 * @return the Listener ID of Name/TAO
	 */
	function getListener(address _id) public view returns (address) {
		require (isExist(_id));
		Position memory _position = positions[_id];
		return _position.listenerId;
	}

	/**
	 * @dev Get Name/TAO's Speaker
	 * @param _id The ID of the Name/TAO
	 * @return the Speaker ID of Name/TAO
	 */
	function getSpeaker(address _id) public view returns (address) {
		require (isExist(_id));
		Position memory _position = positions[_id];
		return _position.speakerId;
	}

	/**
	 * @dev Set Advocate for a TAO
	 * @param _taoId The ID of the TAO
	 * @param _newAdvocateId The new advocate ID to be set
	 */
	function setAdvocate(address _taoId, address _newAdvocateId)
		public
		isTAO(_taoId)
		isName(_newAdvocateId)
		senderIsName()
		onlyAdvocate(_taoId) {

		Position storage _position = positions[_taoId];
		address _currentAdvocateId = _position.advocateId;
		_position.advocateId = _newAdvocateId;

		uint256 _nonce = _taoFactory.incrementNonce(_taoId);
		require (_nonce > 0);
		emit SetAdvocate(_taoId, _currentAdvocateId, _position.advocateId, _nonce);
	}

	/**
	 * @dev Set Listener for a Name/TAO
	 * @param _id The ID of the Name/TAO
	 * @param _newListenerId The new listener ID to be set
	 */
	function setListener(address _id, address _newListenerId)
		public
		isNameOrTAO(_id)
		isNameOrTAO(_newListenerId)
		senderIsName()
		onlyAdvocate(_id) {

		// If _id is a Name, then new Listener can only be a Name
		// If _id is a TAO, then new Listener can be a TAO/Name
		bool _isName = false;
		if (AOLibrary.isName(_id)) {
			_isName = true;
			require (AOLibrary.isName(_newListenerId));
		}

		Position storage _position = positions[_id];
		address _currentListenerId = _position.listenerId;
		_position.listenerId = _newListenerId;

		if (_isName) {
			uint256 _nonce = _nameFactory.incrementNonce(_id);
		} else {
			_nonce = _taoFactory.incrementNonce(_id);
		}
		emit SetListener(_id, _currentListenerId, _position.listenerId, _nonce);
	}

	/**
	 * @dev Set Speaker for a Name/TAO
	 * @param _id The ID of the Name/TAO
	 * @param _newSpeakerId The new speaker ID to be set
	 */
	function setSpeaker(address _id, address _newSpeakerId)
		public
		isNameOrTAO(_id)
		isNameOrTAO(_newSpeakerId)
		senderIsName()
		onlyAdvocate(_id) {

		// If _id is a Name, then new Speaker can only be a Name
		// If _id is a TAO, then new Speaker can be a TAO/Name
		bool _isName = false;
		if (AOLibrary.isName(_id)) {
			_isName = true;
			require (AOLibrary.isName(_newSpeakerId));
		}

		Position storage _position = positions[_id];
		address _currentSpeakerId = _position.speakerId;
		_position.speakerId = _newSpeakerId;

		if (_isName) {
			uint256 _nonce = _nameFactory.incrementNonce(_id);
		} else {
			_nonce = _taoFactory.incrementNonce(_id);
		}
		emit SetSpeaker(_id, _currentSpeakerId, _position.speakerId, _nonce);
	}
}
