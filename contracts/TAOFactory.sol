pragma solidity ^0.4.24;

import './TAOController.sol';

/**
 * @title TAOFactory
 *
 * The purpose of this contract is to allow node to create TAO
 */
contract TAOFactory is TAOController {
	address[] internal taos;

	// Event to be broadcasted to public when Advocate creates a TAO
	event CreateTAO(address indexed ethAddress, address advocateId, address taoId, uint256 index, address from, uint8 fromTAOTypeId, address to);

	// Event to be broadcasted to public when current Advocate sets New Advocate for a TAO
	event SetTAOAdvocate(address indexed taoId, address oldAdvocateId, address newAdvocateId);

	// Event to be broadcasted to public when current Advocate sets New Listener for a TAO
	event SetTAOListener(address indexed taoId, address oldListenerId, address newListenerId);

	// Event to be broadcasted to public when current Advocate sets New Speaker for a TAO
	event SetTAOSpeaker(address indexed taoId, address oldSpeakerId, address newSpeakerId);

	// Event to be broadcasted to public when a parent TAO adds a child TAO
	event AddChildTAO(address indexed parentTAOId, address childTAOId);

	// Event to be broadcasted to public when a parent TAO adds an orphan TAO
	event AddOrphanTAO(address indexed parentTAOId, address orphanTAOId);

	// Event to be broadcasted to public when a parent TAO's Listener approves an orphan TAO
	event ApproveOrphanTAO(address indexed listenerId, address parentTAOId, address orphanTAOId);

	// Event to be broadcasted to public when a TAO is locked/unlocked
	event SetTAOLocked(address indexed taoId, bool locked);

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress, address _positionAddress)
		TAOController(_nameFactoryAddress, _positionAddress) public {}

	/**
	 * @dev Name creates a TAO
	 * @param _taoName The name of the TAO
	 * @param _datHash The datHash of this TAO
	 * @param _database The database for this TAO
	 * @param _keyValue The key/value pair to be checked on the database
	 * @param _contentId The contentId related to this TAO
	 * @param _from The origin of this TAO (has to be a Name or TAO)
	 */
	function createTAO(string _taoName, string _datHash, string _database, string _keyValue, bytes32 _contentId, address _from) public senderIsName() {
		require (bytes(_taoName).length > 0);
		address _nameId = _nameFactory.ethAddressToNameId(msg.sender);

		// Make sure _from is a TAO/Name
		require (_from != address(0) && TAO(_from).originId() != address(0));

		/**
		 * If _from is a TAO (TAOTypeId == 0)
		 * Decide what are the _from and _to IDs
		 * 1. If the _from's advocateId is the same as msg.sender's nameId, then
		 *    the same advocateId is creating this new TAO from _from TAO.
		 *    In this case, _from doesn't change, and _to is address(0).
		 *
		 * 2. If the _from's advocateId is different from msg.sender's nameId, then
		 *    another advocate is creating this new TAO and want to be part of
		 *    _from TAO.
		 *	  In this case, _from is the nameId, and _to is _from
		 */
		address _assignedFrom = _from;
		address _assignedTo = address(0);
		if (TAO(_assignedFrom).taoTypeId() == 0 && TAO(_assignedFrom).advocateId() != _nameId) {
			_assignedFrom = _nameId;
			_assignedTo = _from;
		}

		address taoId = new TAO(Name(_nameId).username(), _taoName, _nameId, _datHash, _database, _keyValue, _contentId, _assignedFrom, _assignedTo);
		taos.push(taoId);

		emit CreateTAO(msg.sender, _nameId, taoId, taos.length.sub(1), _assignedFrom, TAO(_assignedFrom).taoTypeId(), _assignedTo);

		if (TAO(_from).taoTypeId() == 0) {
			// If this TAO is created from another TAO from the same advocate,
			// Want to add this TAO to its parent TAO as a ChildTAO
			if (TAO(_from).advocateId() == _nameId) {
				require (TAO(_from).addSubTAO(taoId, true));
				emit AddChildTAO(_from, taoId);
			} else {
				// Otherwise, add this TAO to its parent TAO as an OrphanTAO
				require (TAO(_from).addSubTAO(taoId, false));
				emit AddOrphanTAO(_from, taoId);
			}
		}
	}

	/**
	 * @dev Get TAO information
	 * @param _taoId The ID of the TAO to be queried
	 * @return The username of the Name that created this TAO
	 * @return The name of the TAO
	 * @return The origin Name/TAO ID of the TAO
	 * @return The datHash of the TAO
	 * @return The database of the TAO
	 * @return The keyValue of the TAO
	 * @return The contentId of the TAO
	 * @return The taoTypeId of the TAO
	 */
	function getTAO(address _taoId) public view returns (string, string, address, string, string, string, bytes32, uint8) {
		TAO _tao = TAO(_taoId);
		return (
			_tao.username(),
			_tao.taoName(),
			_tao.originId(),
			_tao.datHash(),
			_tao.database(),
			_tao.keyValue(),
			_tao.contentId(),
			_tao.taoTypeId()
		);
	}

	/**
	 * @dev Given a TAO ID, wants to get the TAO's Position, i.e Advocate/Listener/Speaker
	 * @param _taoId The ID of the TAO
	 * @return The advocateId of the TAO
	 * @return The listenerId of the TAO
	 * @return The speakerId of the TAO
	 */
	function getTAOPosition(address _taoId) public view returns (address, address, address) {
		TAO _tao = TAO(_taoId);
		return (
			_tao.advocateId(),
			_tao.listenerId(),
			_tao.speakerId()
		);
	}

	/**
	 * @dev Get total TAOs count
	 * @return total TAOs count
	 */
	function getTotalTAOsCount() public view returns (uint256) {
		return taos.length;
	}

	/**
	 * @dev Get list of TAO IDs
	 * @param _from The starting index
	 * @param _to The ending index
	 * @return list of TAO IDs
	 */
	function getTAOIds(uint256 _from, uint256 _to) public view returns (address[]) {
		require (_from >= 0 && _to >= _from && taos.length > _to);

		address[] memory _taos = new address[](_to.sub(_from).add(1));
		for (uint256 i = _from; i <= _to; i++) {
			_taos[i.sub(_from)] = taos[i];
		}
		return _taos;
	}

	/**
	 * @dev Set TAO's advocate
	 * @param _taoId The ID of the TAO
	 * @param _newAdvocateId The new advocate ID to be set
	 */
	function setTAOAdvocate(address _taoId, address _newAdvocateId) public isTAO(_taoId) isName(_newAdvocateId) senderIsName() onlyAdvocateOfTAO(_taoId) {
		TAO _tao = TAO(_taoId);

		address _currentAdvocateId = _tao.advocateId();

		// Set the new advocate
		require (_tao.setAdvocate(_newAdvocateId));

		emit SetTAOAdvocate(_taoId, _currentAdvocateId, _newAdvocateId);
	}

	/**
	 * @dev Set TAO's listener
	 * @param _taoId The ID of the TAO
	 * @param _newListenerId The new listener ID to be set
	 */
	function setTAOListener(address _taoId, address _newListenerId) public isTAO(_taoId) isName(_newListenerId) senderIsName() onlyAdvocateOfTAO(_taoId) {
		TAO _tao = TAO(_taoId);

		// Set the new listener
		address _currentListenerId = _tao.listenerId();
		require (_tao.setListener(_newListenerId));

		emit SetTAOListener(_taoId, _currentListenerId, _newListenerId);
	}

	/**
	 * @dev Set TAO's speaker
	 * @param _taoId The ID of the TAO
	 * @param _newSpeakerId The new speaker ID to be set
	 */
	function setTAOSpeaker(address _taoId, address _newSpeakerId) public isTAO(_taoId) isName(_newSpeakerId) senderIsName() onlyAdvocateOfTAO(_taoId) {
		TAO _tao = TAO(_taoId);

		// Set the new speaker
		address _currentSpeakerId = _tao.speakerId();
		require (_tao.setSpeaker(_newSpeakerId));

		emit SetTAOSpeaker(_taoId, _currentSpeakerId, _newSpeakerId);
	}

	/**
	 * @dev Get TAO's relationship
	 * @param _taoId The ID of the TAO
	 * @return fromId (Origin of the TAO)
	 * @return throughId
	 * @return toId (Destination of the TAO)
	 */
	function getTAORelationship(address _taoId) public view returns (address, address, address) {
		TAO _tao = TAO(_taoId);
		return (
			_tao.fromId(),
			_tao.throughId(),
			_tao.toId()
		);
	}

	/**
	 * @dev Get TAO's sub TAO Ids
	 * @param _taoId The ID of the TAO
	 * @param _from The starting index
	 * @param _to The ending index
	 * @return list of sub TAO IDs
	 */
	function getSubTAOIds(address _taoId, uint256 _from, uint256 _to) public isTAO(_taoId) view returns (address[]) {
		require (_from >= 1 && _to >= _from);
		return TAO(_taoId).getSubTAOIds(_from, _to);
	}

	/**
	 * @dev Get TAO's sub TAOs total count
	 * @param _taoId The ID of the TAO
	 * @return total sub TAOs count
	 */
	function getTotalSubTAOsCount(address _taoId) public isTAO(_taoId) view returns (uint256) {
		return TAO(_taoId).totalSubTAOs();
	}

	/**
	 * @dev Get TAO's child TAOs total count
	 * @param _taoId The ID of the TAO
	 * @return total child TAOs count
	 */
	function getTotalChildTAOsCount(address _taoId) public isTAO(_taoId) view returns (uint256) {
		return TAO(_taoId).totalChildTAOs();
	}

	/**
	 * @dev Get TAO's orphan TAOs total count
	 * @param _taoId The ID of the TAO
	 * @return total orphan TAOs count
	 */
	function getTotalOrphanTAOsCount(address _taoId) public isTAO(_taoId) view returns (uint256) {
		return TAO(_taoId).totalOrphanTAOs();
	}

	/**
	 * @dev Check if `_childTAOId` is child TAO of `_taoId`
	 * @param _taoId The ID of the parent TAO
	 * @param _childTAOId The child TAO ID to check
	 * @return return true if yes. Otherwise return false.
	 */
	function isChildTAOOfTAO(address _taoId, address _childTAOId) public isTAO(_taoId) isTAO(_childTAOId) view returns (bool) {
		return TAO(_taoId).isChildTAO(_childTAOId);
	}

	/**
	 * @dev Check if `_orphanTAOId` is orphan TAO of `_taoId`
	 * @param _taoId The ID of the parent TAO
	 * @param _orphanTAOId The orphan TAO ID to check
	 * @return return true if yes. Otherwise return false.
	 */
	function isOrphanTAOOfTAO(address _taoId, address _orphanTAOId) public isTAO(_taoId) isTAO(_orphanTAOId) view returns (bool) {
		return TAO(_taoId).isOrphanTAO(_orphanTAOId);
	}

	/**
	 * @dev Listener approves orphan TAO.
	 *		This will switch orphan TAO to becoming a child TAO.
	 * @param _taoId The ID of the parent TAO
	 * @param _orphanTAOId The orphan TAO ID to approve
	 */
	function approveOrphanTAO(address _taoId, address _orphanTAOId) public senderIsName() {
		require (isOrphanTAOOfTAO(_taoId, _orphanTAOId));

		TAO _tao = TAO(_taoId);

		// Only TAO's current listener can approve orphan TAO
		require (Name(_tao.listenerId()).originId() == msg.sender);

		require (_tao.approveOrphanTAO(_orphanTAOId));

		emit ApproveOrphanTAO(_tao.listenerId(), _taoId, _orphanTAOId);
	}

	/**
	 * @dev Advocate locks/unlocks a TAO.
			When a TAO is locked, no transaction can happen on the TAO (i.e adding funds, adding sub TAO, etc.)
			until the TAO is unlocked again.
	 * @param _taoId The ID of the TAO
	 * @param _locked The bool value to be set
	 */
	function setTAOLocked(address _taoId, bool _locked) public isTAO(_taoId) senderIsName() onlyAdvocateOfTAO(_taoId) {
		require (TAO(_taoId).setLocked(_locked));

		emit SetTAOLocked(_taoId, _locked);
	}
}
