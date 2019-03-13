pragma solidity ^0.5.4;

import './SafeMath.sol';
import './AOLibrary.sol';
import './TAOController.sol';
import './ITAOAncestry.sol';
import './ITAOFactory.sol';

/**
 * @title TAOAncestry
 */
contract TAOAncestry is TAOController, ITAOAncestry {
	using SafeMath for uint256;

	address public taoFactoryAddress;

	ITAOFactory internal _taoFactory;

	struct Child {
		address taoId;
		bool approved;		// If false, then waiting for parent TAO approval
		bool connected;		// If false, then parent TAO want to remove this child TAO
	}

	struct Ancestry {
		address taoId;
		address parentId;	// The parent of this TAO ID (could be a Name or TAO)
		uint256 childMinLogos;
		mapping (uint256 => Child) children;
		mapping (address => uint256) childInternalIdLookup;
		uint256 totalChildren;
		uint256 childInternalId;
	}

	mapping (address => Ancestry) internal ancestries;

	// Event to be broadcasted to public when Advocate updates min required Logos to create a child TAO
	event UpdateChildMinLogos(address indexed taoId, uint256 childMinLogos, uint256 nonce);

	// Event to be broadcasted to public when a TAO adds a child TAO
	event AddChild(address indexed taoId, address taoAdvocate, address childId, address childAdvocate, bool approved, bool connected);

	// Event to be broadcasted to public when a TAO approves a child TAO
	event ApproveChild(address indexed taoId, address taoAdvocate, address childId, address childAdvocate, uint256 nonce);

	// Event to be broadcasted to public when a TAO removes a child TAO
	event RemoveChild(address indexed taoId, address taoAdvocate, address childId, address childAdvocate, uint256 nonce);

	/**
	 * @dev Constructor function
	 */
	constructor(address _nameFactoryAddress, address _taoFactoryAddress, address _nameTAOPositionAddress)
		TAOController(_nameFactoryAddress) public {
		setTAOFactoryAddress(_taoFactoryAddress);
		setNameTAOPositionAddress(_nameTAOPositionAddress);
	}

	/**
	 * @dev Check if calling address is Factory
	 */
	modifier onlyFactory {
		require (msg.sender == taoFactoryAddress);
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
		_taoFactory = ITAOFactory(_taoFactoryAddress);
	}

	/***** PUBLIC METHODS *****/
	/**
	 * @dev Check whether or not a TAO ID exist in the list of ancestries
	 * @param _id The ID to be checked
	 * @return true if yes, false otherwise
	 */
	function isExist(address _id) public view returns (bool) {
		return ancestries[_id].taoId != address(0);
	}

	/**
	 * @dev Store the Ancestry info for a TAO
	 * @param _id The ID of the TAO
	 * @param _parentId The parent ID of this TAO
	 * @param _childMinLogos The min required Logos to create a TAO
	 * @return true on success
	 */
	function initialize(address _id, address _parentId, uint256 _childMinLogos)
		external
		isTAO(_id)
		isNameOrTAO(_parentId)
		onlyFactory returns (bool) {
		require (!isExist(_id));

		Ancestry storage _ancestry = ancestries[_id];
		_ancestry.taoId = _id;
		_ancestry.parentId = _parentId;
		_ancestry.childMinLogos = _childMinLogos;
		return true;
	}

	/**
	 * @dev Get Ancestry info given a TAO ID
	 * @param _id The ID of the TAO
	 * @return the parent ID of this TAO (could be a Name/TAO)
	 * @return the min required Logos to create a child TAO
	 * @return the total child TAOs count
	 */
	function getAncestryById(address _id) external view returns (address, uint256, uint256) {
		require (isExist(_id));
		Ancestry memory _ancestry = ancestries[_id];
		return (
			_ancestry.parentId,
			_ancestry.childMinLogos,
			_ancestry.totalChildren
		);
	}

	/**
	 * @dev Set min required Logos to create a child from this TAO
	 * @param _childMinLogos The min Logos to set
	 * @return the nonce for this transaction
	 */
	function updateChildMinLogos(address _id, uint256 _childMinLogos)
		public
		isTAO(_id)
		senderIsName
		senderNameNotCompromised
		onlyAdvocate(_id) {
		require (isExist(_id));

		Ancestry storage _ancestry = ancestries[_id];
		_ancestry.childMinLogos = _childMinLogos;

		uint256 _nonce = _taoFactory.incrementNonce(_id);
		require (_nonce > 0);
		emit UpdateChildMinLogos(_id, _ancestry.childMinLogos, _nonce);
	}

	/**
	 * @dev Check if `_childId` is a child TAO of `_taoId`
	 * @param _taoId The TAO ID to be checked
	 * @param _childId The child TAO ID to check
	 * @return true if yes. Otherwise return false.
	 */
	function isChild(address _taoId, address _childId) external view returns (bool) {
		require (isExist(_taoId) && isExist(_childId));
		Ancestry storage _ancestry = ancestries[_taoId];
		Ancestry memory _childAncestry = ancestries[_childId];
		uint256 _childInternalId = _ancestry.childInternalIdLookup[_childId];
		return (
			_childInternalId > 0 &&
			_ancestry.children[_childInternalId].approved &&
			_ancestry.children[_childInternalId].connected &&
			_childAncestry.parentId == _taoId
		);
	}

	/**
	 * @dev Check if `_childId` is a child TAO of `_taoId` that is not yet approved
	 * @param _taoId The TAO ID to be checked
	 * @param _childId The child TAO ID to check
	 * @return true if yes. Otherwise return false.
	 */
	function isNotApprovedChild(address _taoId, address _childId) public view returns (bool) {
		require (isExist(_taoId) && isExist(_childId));
		Ancestry storage _ancestry = ancestries[_taoId];
		uint256 _childInternalId = _ancestry.childInternalIdLookup[_childId];
		return (
			_childInternalId > 0 &&
			!_ancestry.children[_childInternalId].approved &&
			!_ancestry.children[_childInternalId].connected
		);
	}

	/**
	 * @dev Add child TAO
	 * @param _taoId The TAO ID to be added to
	 * @param _childId The ID to be added to as child TAO
	 */
	function addChild(address _taoId, address _childId)
		external
		isTAO(_taoId)
		isTAO(_childId)
		onlyFactory returns (bool) {
		require (!this.isChild(_taoId, _childId));
		Ancestry storage _ancestry = ancestries[_taoId];
		require (_ancestry.childInternalIdLookup[_childId] == 0);

		_ancestry.childInternalId++;
		_ancestry.childInternalIdLookup[_childId] = _ancestry.childInternalId;

		Child storage _child = _ancestry.children[_ancestry.childInternalId];
		_child.taoId = _childId;

		// If _taoId's Advocate == _childId's Advocate, then the child is automatically approved and connected
		// Otherwise, child TAO needs parent TAO approval
		address _taoAdvocate = _nameTAOPosition.getAdvocate(_taoId);
		address _childAdvocate = _nameTAOPosition.getAdvocate(_childId);
		emit AddChild(_taoId, _taoAdvocate, _childId, _childAdvocate, _child.approved, _child.connected);

		if (_taoAdvocate == _childAdvocate) {
			_approveChild(_taoId, _childId);
		}
		return true;
	}

	/**
	 * @dev Advocate of `_taoId` approves child `_childId`
	 * @param _taoId The TAO ID to be checked
	 * @param _childId The child TAO ID to be approved
	 */
	function approveChild(address _taoId, address _childId)
		public
		isTAO(_taoId)
		isTAO(_childId)
		senderIsName
		senderNameNotCompromised
		onlyAdvocate(_taoId) {
		require (isExist(_taoId) && isExist(_childId));
		require (isNotApprovedChild(_taoId, _childId));
		_approveChild(_taoId, _childId);
	}

	/**
	 * @dev Advocate of `_taoId` removes child `_childId`
	 * @param _taoId The TAO ID to be checked
	 * @param _childId The child TAO ID to be removed
	 */
	function removeChild(address _taoId, address _childId)
		public
		isTAO(_taoId)
		isTAO(_childId)
		senderIsName
		senderNameNotCompromised
		onlyAdvocate(_taoId) {
		require (this.isChild(_taoId, _childId));

		Ancestry storage _ancestry = ancestries[_taoId];
		_ancestry.totalChildren--;

		Child storage _child = _ancestry.children[_ancestry.childInternalIdLookup[_childId]];
		_child.connected = false;
		_ancestry.childInternalIdLookup[_childId] = 0;

		Ancestry storage _childAncestry = ancestries[_childId];
		_childAncestry.parentId = address(0);

		uint256 _nonce = _taoFactory.incrementNonce(_taoId);
		require (_nonce > 0);

		address _taoAdvocate = _nameTAOPosition.getAdvocate(_taoId);
		address _childAdvocate = _nameTAOPosition.getAdvocate(_childId);
		emit RemoveChild(_taoId, _taoAdvocate, _childId, _childAdvocate, _nonce);
	}

	/**
	 * @dev Get list of child TAO IDs
	 * @param _taoId The TAO ID to be checked
	 * @param _from The starting index (start from 1)
	 * @param _to The ending index, (max is childInternalId)
	 * @return list of child TAO IDs
	 */
	function getChildIds(address _taoId, uint256 _from, uint256 _to) public view returns (address[] memory) {
		require (isExist(_taoId));
		Ancestry storage _ancestry = ancestries[_taoId];
		require (_from >= 1 && _to >= _from && _ancestry.childInternalId >= _to);
		address[] memory _childIds = new address[](_to.sub(_from).add(1));
		for (uint256 i = _from; i <= _to; i++) {
			_childIds[i.sub(_from)] = _ancestry.children[i].approved && _ancestry.children[i].connected ? _ancestry.children[i].taoId : address(0);
		}
		return _childIds;
	}

	/***** INTERNAL METHOD *****/
	/**
	 * @dev Actually approving the child TAO
	 * @param _taoId The TAO ID to be checked
	 * @param _childId The child TAO ID to be approved
	 */
	function _approveChild(address _taoId, address _childId) internal {
		Ancestry storage _ancestry = ancestries[_taoId];
		Ancestry storage _childAncestry = ancestries[_childId];
		uint256 _childInternalId = _ancestry.childInternalIdLookup[_childId];

		_ancestry.totalChildren++;

		Child storage _child = _ancestry.children[_childInternalId];
		_child.approved = true;
		_child.connected = true;

		_childAncestry.parentId = _taoId;

		uint256 _nonce = _taoFactory.incrementNonce(_taoId);
		require (_nonce > 0);

		address _taoAdvocate = _nameTAOPosition.getAdvocate(_taoId);
		address _childAdvocate = _nameTAOPosition.getAdvocate(_childId);
		emit ApproveChild(_taoId, _taoAdvocate, _childId, _childAdvocate, _nonce);
	}
}
