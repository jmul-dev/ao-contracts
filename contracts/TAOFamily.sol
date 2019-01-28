pragma solidity ^0.4.24;

import './SafeMath.sol';
import './AOLibrary.sol';
import './TAOController.sol';
import './ITAOFamily.sol';
import './ITAOFactory.sol';

/**
 * @title TAOFamily
 */
contract TAOFamily is TAOController, ITAOFamily {
	using SafeMath for uint256;

	address public taoFactoryAddress;

	ITAOFactory internal _taoFactory;

	struct Child {
		address taoId;
		bool approved;		// If false, then waiting for parent TAO approval
		bool connected;		// If false, then parent TAO want to remove this child TAO
	}

	struct Family {
		address taoId;
		address parentId;	// The parent of this TAO ID (could be a Name or TAO)
		uint256 childMinLogos;
		mapping (uint256 => Child) children;
		mapping (address => uint256) childInternalIdLookup;
		uint256 totalChildren;
		uint256 childInternalId;
	}

	mapping (address => Family) internal families;

	// Event to be broadcasted to public when Advocate updates min required Logos to create a child TAO
	event UpdateChildMinLogos(address indexed taoId, uint256 childMinLogos, uint256 nonce);

	// Event to be broadcasted to public when a TAO adds a child TAO
	event AddChild(address indexed taoId, address childId, bool approved, bool connected, uint256 nonce);

	// Event to be broadcasted to public when a TAO approves a child TAO
	event ApproveChild(address indexed taoId, address childId, uint256 nonce);

	// Event to be broadcasted to public when a TAO removes a child TAO
	event RemoveChild(address indexed taoId, address childId, uint256 nonce);

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
	 * @dev Check whether or not a TAO ID exist in the list of families
	 * @param _id The ID to be checked
	 * @return true if yes, false otherwise
	 */
	function isExist(address _id) public view returns (bool) {
		return families[_id].taoId != address(0);
	}

	/**
	 * @dev Store the Family info for a TAO
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

		Family storage _family = families[_id];
		_family.taoId = _id;
		_family.parentId = _parentId;
		_family.childMinLogos = _childMinLogos;
		return true;
	}

	/**
	 * @dev Get Family info given a TAO ID
	 * @param _id The ID of the TAO
	 * @return the parent ID of this TAO (could be a Name/TAO)
	 * @return the min required Logos to create a child TAO
	 * @return the total child TAOs count
	 */
	function getFamilyById(address _id) external view returns (address, uint256, uint256) {
		require (isExist(_id));
		Family memory _family = families[_id];
		return (
			_family.parentId,
			_family.childMinLogos,
			_family.totalChildren
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
		senderIsName()
		onlyAdvocate(_id) {
		require (isExist(_id));

		Family storage _family = families[_id];
		_family.childMinLogos = _childMinLogos;

		uint256 _nonce = _taoFactory.incrementNonce(_id);
		require (_nonce > 0);
		emit UpdateChildMinLogos(_id, _family.childMinLogos, _nonce);
	}

	/**
	 * @dev Check if `_childId` is a child TAO of `_taoId`
	 * @param _taoId The TAO ID to be checked
	 * @param _childId The child TAO ID to check
	 * @return true if yes. Otherwise return false.
	 */
	function isChild(address _taoId, address _childId) public view returns (bool) {
		require (isExist(_taoId) && isExist(_childId));
		Family storage _family = families[_taoId];
		Family memory _childFamily = families[_childId];
		uint256 _childInternalId = _family.childInternalIdLookup[_childId];
		return (
			_childInternalId > 0 &&
			_family.children[_childInternalId].approved &&
			_family.children[_childInternalId].connected &&
			_childFamily.parentId == _taoId
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
		require (!isChild(_taoId, _childId));
		Family storage _family = families[_taoId];
		require (_family.childInternalIdLookup[_childId] == 0);

		_family.childInternalId++;
		_family.childInternalIdLookup[_childId] = _family.childInternalId;
		uint256 _nonce = _taoFactory.incrementNonce(_taoId);
		require (_nonce > 0);

		Child storage _child = _family.children[_family.childInternalId];
		_child.taoId = _childId;

		// If _taoId's Advocate == _childId's Advocate, then the child is automatically approved and connected
		// Otherwise, child TAO needs parent TAO approval
		address _taoAdvocate = _nameTAOPosition.getAdvocate(_taoId);
		address _childAdvocate = _nameTAOPosition.getAdvocate(_childId);
		if (_taoAdvocate == _childAdvocate) {
			_family.totalChildren++;
			_child.approved = true;
			_child.connected = true;

			Family storage _childFamily = families[_childId];
			_childFamily.parentId = _taoId;
		}

		emit AddChild(_taoId, _childId, _child.approved, _child.connected, _nonce);
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
		senderIsName()
		onlyAdvocate(_taoId) {
		require (isExist(_taoId) && isExist(_childId));
		Family storage _family = families[_taoId];
		Family storage _childFamily = families[_childId];
		uint256 _childInternalId = _family.childInternalIdLookup[_childId];

		require (_childInternalId > 0 &&
			!_family.children[_childInternalId].approved &&
			!_family.children[_childInternalId].connected
		);

		_family.totalChildren++;

		Child storage _child = _family.children[_childInternalId];
		_child.approved = true;
		_child.connected = true;

		_childFamily.parentId = _taoId;

		uint256 _nonce = _taoFactory.incrementNonce(_taoId);
		require (_nonce > 0);

		emit ApproveChild(_taoId, _childId, _nonce);
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
		senderIsName()
		onlyAdvocate(_taoId) {
		require (isChild(_taoId, _childId));

		Family storage _family = families[_taoId];
		_family.totalChildren--;

		Child storage _child = _family.children[_family.childInternalIdLookup[_childId]];
		_child.connected = false;
		_family.childInternalIdLookup[_childId] = 0;

		Family storage _childFamily = families[_childId];
		_childFamily.parentId = address(0);

		uint256 _nonce = _taoFactory.incrementNonce(_taoId);
		require (_nonce > 0);

		emit RemoveChild(_taoId, _childId, _nonce);
	}

	/**
	 * @dev Get list of child TAO IDs
	 * @param _taoId The TAO ID to be checked
	 * @param _from The starting index (start from 1)
	 * @param _to The ending index, (max is childInternalId)
	 * @return list of child TAO IDs
	 */
	function getChildIds(address _taoId, uint256 _from, uint256 _to) public view returns (address[]) {
		require (isExist(_taoId));
		Family storage _family = families[_taoId];
		require (_from >= 1 && _to >= _from && _family.childInternalId >= _to);
		address[] memory _childIds = new address[](_to.sub(_from).add(1));
		for (uint256 i = _from; i <= _to; i++) {
			_childIds[i.sub(_from)] = _family.children[i].approved && _family.children[i].connected ? _family.children[i].taoId : address(0);
		}
		return _childIds;
	}
}
