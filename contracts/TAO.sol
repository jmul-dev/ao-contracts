pragma solidity ^0.4.24;

import './SafeMath.sol';

/**
 * @title TAO
 */
contract TAO {
	using SafeMath for uint256;

	// Public variables
	bool public locked;
	bool public closed;

	address public factoryAddress;
	string public originName;		// the name of the Name that created this TAO
	string public taoName;			// the name of this TAO
	address public originNameId;	// the ID of the Name that created this TAO

	address public advocateId;	// current advocateId
	address public listenerId;	// current listenerId
	address public speakerId;	// current speakerId

	// TAO's data
	string public datHash;
	string public database;
	string public keyValue;
	bytes32 public contentId;

	/**
	 * 0 = create a TAO
	 * 1 = create a Name
	 */
	uint8 public taoTypeId;

	address public fromId;		// The origin TAO ID
	address public throughId;
	address public toId;		// When this TAO wants to be part of a larger TAO but it's not coming from its Advocate

	uint256 public totalChildTAOs;
	uint256 public totalOrphanTAOs;
	uint256 public totalSubTAOs;

	uint256 public balance;
	uint256 public nonce;

	struct SubTAO {
		address taoId;
		bool child;			// If false, then it's an orphan TAO
		bool connected;		// If false, then parent TAO want to remove this sub TAO
	}

	mapping (uint256 => SubTAO) public subTAOs;
	mapping (address => uint256) public subTAOInternalIdLookup;

	/**
	 * @dev Constructor function
	 */
	constructor (string _originName, string _taoName, address _originNameId, string _datHash, string _database, string _keyValue, bytes32 _contentId, address _fromId, address _toId) public {
		factoryAddress = msg.sender;
		originName = _originName;
		taoName = _taoName;
		originNameId = _originNameId;
		advocateId = _originNameId;
		datHash = _datHash;
		database = _database;
		keyValue = _keyValue;
		contentId = _contentId;
		fromId = _fromId;
		toId = _toId;

		listenerId = advocateId;
		speakerId = advocateId;

		// Creating TAO
		taoTypeId = 0;

		nonce = 1;
	}

	/**
	 * @dev Check if contract is active
	 */
	modifier isActive {
		require (locked == false && closed == false);
		_;
	}

	/**
	 * @dev Check if calling address is Factory
	 */
	modifier onlyFactory {
		require (msg.sender == factoryAddress);
		_;
	}

	/**
	 * @dev Set advocate (only works for a TAO)
	 * @param _advocateId The advocate ID to be set
	 * @return true on success
	 */
	function setAdvocate(address _advocateId) public isActive onlyFactory returns (bool) {
		require (_advocateId != address(0));
		require (taoTypeId == 0);
		advocateId = _advocateId;
		return true;
	}

	/**
	 * @dev Set listener
	 * @param _listenerId The listener ID to be set
	 * @return true on success
	 */
	function setListener(address _listenerId) public isActive onlyFactory returns (bool) {
		require (_listenerId != address(0));
		listenerId = _listenerId;
		return true;
	}

	/**
	 * @dev Set speaker
	 * @param _speakerId The speaker ID to be set
	 * @return true on success
	 */
	function setSpeaker(address _speakerId) public isActive onlyFactory returns (bool) {
		require (_speakerId != address(0));
		speakerId = _speakerId;
		return true;
	}

	/**
	 * @dev Add sub TAO
	 * @param _taoId The TAO ID to be added to as sub TAO
	 * @param _child True if adding this as a child TAO. False if it's an orphan TAO.
	 * @return true on success
	 */
	function addSubTAO(address _taoId, bool _child) public isActive onlyFactory returns (bool) {
		require (_taoId != address(0));
		require (subTAOInternalIdLookup[_taoId] == 0);

		totalSubTAOs++;
		if (_child) {
			totalChildTAOs++;
		} else {
			totalOrphanTAOs++;
		}
		subTAOInternalIdLookup[_taoId] = totalSubTAOs;
		SubTAO storage _subTAO = subTAOs[totalSubTAOs];
		_subTAO.taoId = _taoId;
		_subTAO.child = _child;
		_subTAO.connected = true;
		return true;
	}

	/**
	 * @dev Get list of sub TAO IDs
	 * @param _from The starting index (start from 1)
	 * @param _to The ending index, (max is totalSubTAOs count )
	 * @return list of sub TAO IDs
	 */
	function getSubTAOIds(uint256 _from, uint256 _to) public view returns (address[]) {
		require (_from >= 1 && _to >= _from && totalSubTAOs >= _to);
		address[] memory _subTAOIds = new address[](_to.sub(_from).add(1));
		for (uint256 i = _from; i <= _to; i++) {
			_subTAOIds[i.sub(_from)] = subTAOs[i].connected ? subTAOs[i].taoId : address(0);
		}
		return _subTAOIds;
	}

	/**
	 * @dev Check if `_childTAOId` is a child TAO
	 * @param _childTAOId The child TAO ID to check
	 * @return true if yes. Otherwise return false.
	 */
	function isChildTAO(address _childTAOId) public view returns (bool) {
		return (subTAOInternalIdLookup[_childTAOId] > 0 && subTAOs[subTAOInternalIdLookup[_childTAOId]].child && subTAOs[subTAOInternalIdLookup[_childTAOId]].connected);
	}

	/**
	 * @dev Check if `_orphanTAOId` is an orphan TAO
	 * @param _orphanTAOId The orphan TAO ID to check
	 * @return true if yes. Otherwise return false.
	 */
	function isOrphanTAO(address _orphanTAOId) public view returns (bool) {
		return (subTAOInternalIdLookup[_orphanTAOId] > 0 && !subTAOs[subTAOInternalIdLookup[_orphanTAOId]].child && subTAOs[subTAOInternalIdLookup[_orphanTAOId]].connected);
	}

	/**
	 * @dev Approve orphan TAO and switch it to a child TAO
	 * @param _orphanTAOId The orphan TAO ID to approve
	 * @return true on success
	 */
	function approveOrphanTAO(address _orphanTAOId) public isActive onlyFactory returns (bool) {
		SubTAO storage _subTAO = subTAOs[subTAOInternalIdLookup[_orphanTAOId]];
		_subTAO.child = true;
		totalChildTAOs++;
		totalOrphanTAOs--;
		return true;
	}

	/**
	 * @dev Lock/unlock TAO. If at "locked" state, no transaction can be executed on this TAO
			until it's unlocked again.
	 * @param _locked The bool value to set
	 * @return true on success
	 */
	function setLocked(bool _locked) public onlyFactory returns (bool) {
		require (closed == false);
		locked = _locked;
		return true;
	}

	/**
	 * @dev Mark TAO as closed
	 * @return true on success
	 */
	function close() public onlyFactory returns (bool) {
		require (closed == false);
		closed = true;
		return true;
	}

	/**
	 * @dev Receive ETH
	 */
	function () public payable isActive {
		balance = balance.add(msg.value);
	}
}
