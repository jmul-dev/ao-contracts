var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var Logos = artifacts.require("./Logos.sol");

var TAOPool = artifacts.require("./TAOPool.sol");
var Pathos = artifacts.require("./Pathos.sol");
var Ethos = artifacts.require("./Ethos.sol");

var NameAccountRecovery = artifacts.require("./NameAccountRecovery.sol");
var AOSetting = artifacts.require("./AOSetting.sol");

var BigNumber = require("bignumber.js");
var helper = require("./helpers/truffleTestHelper");

BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: 1, EXPONENTIAL_AT: [-10, 40] }); // no rounding

contract("TAOPool", function(accounts) {
	var namefactory,
		taofactory,
		nametaoposition,
		logos,
		nameId1,
		nameId2,
		nameId3,
		nameId4,
		nameId5,
		nameId6,
		taoId1,
		taoId2,
		taoId3,
		taopool,
		pathos,
		ethos,
		ethosLotId1,
		ethosLotId2,
		ethosLotId4,
		ethosLotId5,
		ethosLotId6,
		nameaccountrecovery,
		aosetting,
		accountRecoveryLockDuration;

	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var account4 = accounts[4];
	var account5 = accounts[5];
	var account6 = accounts[6];
	var someAddress = accounts[7];
	var whitelistedAddress = accounts[8];
	var emptyAddress = "0x0000000000000000000000000000000000000000";

	var nameId4EthosLots = [];
	var nameId5EthosLots = [];
	var nameId6EthosLots = [];

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		logos = await Logos.deployed();
		taopool = await TAOPool.deployed();
		pathos = await Pathos.deployed();
		ethos = await Ethos.deployed();
		nameaccountrecovery = await NameAccountRecovery.deployed();
		aosetting = await AOSetting.deployed();

		var settingTAOId = await nameaccountrecovery.settingTAOId();

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "accountRecoveryLockDuration");
		accountRecoveryLockDuration = settingValues[0];

		// Create Name
		var result = await namefactory.createName("charlie", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account1
		});
		nameId1 = await namefactory.ethAddressToNameId(account1);

		result = await namefactory.createName("delta", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account2
		});
		nameId2 = await namefactory.ethAddressToNameId(account2);

		result = await namefactory.createName("echo", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account3
		});
		nameId3 = await namefactory.ethAddressToNameId(account3);

		result = await namefactory.createName("foxtrot", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account4
		});
		nameId4 = await namefactory.ethAddressToNameId(account4);

		result = await namefactory.createName("golf", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account5
		});
		nameId5 = await namefactory.ethAddressToNameId(account5);

		result = await namefactory.createName("hotel", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account6
		});
		nameId6 = await namefactory.ethAddressToNameId(account6);

		// Mint Logos to nameId
		await logos.setWhitelist(theAO, true, { from: theAO });
		await logos.mint(nameId1, 10 ** 12, { from: theAO });
		await logos.mint(nameId2, 10 ** 12, { from: theAO });
		await logos.mint(nameId3, 10 ** 12, { from: theAO });

		await pathos.setWhitelist(theAO, true, { from: theAO });
		await pathos.mint(nameId4, 10 ** 6, { from: theAO });
		await pathos.mint(nameId5, 10 ** 6, { from: theAO });
		await pathos.mint(nameId6, 10 ** 6, { from: theAO });

		await ethos.setWhitelist(theAO, true, { from: theAO });
		await ethos.mint(nameId4, 10 ** 6, { from: theAO });
		await ethos.mint(nameId5, 10 ** 6, { from: theAO });
		await ethos.mint(nameId6, 10 ** 6, { from: theAO });

		result = await taofactory.createTAO(
			"Charlie's TAO",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			"somecontentid",
			nameId1,
			0,
			false,
			0,
			{
				from: account1
			}
		);
		var createTAOEvent = result.logs[0];
		taoId1 = createTAOEvent.args.taoId;

		await nametaoposition.setListener(nameId2, nameId3, { from: account2 });
		await nametaoposition.setListener(nameId4, nameId3, { from: account4 });
	});

	var stakeEthos = async function(taoId, quantity, account, nameEthosLots) {
		var nameId = await namefactory.ethAddressToNameId(account);
		var contractTotalEthosLotBefore = await taopool.contractTotalEthosLot();
		var contractTotalEthosBefore = await taopool.contractTotalEthos();

		var poolTotalEthosLotBefore = await taopool.poolTotalEthosLot(taoId);
		var ownerTotalEthosLotBefore = await taopool.ownerTotalEthosLot(nameId);

		var nameTotalEthosStakedBefore = await taopool.totalEthosStaked(nameId);
		var namePoolEthosStakedBefore = await taopool.namePoolEthosStaked(nameId, taoId);
		var nameEthosBalanceBefore = await ethos.balanceOf(nameId);
		var taoEthosBalanceBefore = await ethos.balanceOf(taoId);

		var canStakeEthos, stakeEthosEvent, ethosLotId;
		try {
			var result = await taopool.stakeEthos(taoId, quantity, { from: account });
			stakeEthosEvent = result.logs[0];
			ethosLotId = stakeEthosEvent.args.ethosLotId;
			canStakeEthos = true;
		} catch (e) {
			stakeEthosEvent = null;
			ethosLotId = null;
			canStakeEthos = false;
		}
		assert.equal(canStakeEthos, true, "Name can't stake Ethos on a TAO");

		var contractTotalEthosLotAfter = await taopool.contractTotalEthosLot();
		var contractTotalEthosAfter = await taopool.contractTotalEthos();

		var poolTotalEthosLotAfter = await taopool.poolTotalEthosLot(taoId);
		var ownerTotalEthosLotAfter = await taopool.ownerTotalEthosLot(nameId);

		var nameTotalEthosStakedAfter = await taopool.totalEthosStaked(nameId);
		var namePoolEthosStakedAfter = await taopool.namePoolEthosStaked(nameId, taoId);
		var nameEthosBalanceAfter = await ethos.balanceOf(nameId);
		var taoEthosBalanceAfter = await ethos.balanceOf(taoId);

		assert.equal(
			contractTotalEthosLotAfter.toNumber(),
			contractTotalEthosLotBefore.plus(1).toNumber(),
			"Contract has incorrect contractTotalEthosLot"
		);
		assert.equal(
			contractTotalEthosAfter.toNumber(),
			contractTotalEthosBefore.plus(quantity).toNumber(),
			"Contract has incorrect contractTotalEthos"
		);

		assert.equal(poolTotalEthosLotAfter.toNumber(), poolTotalEthosLotBefore.plus(1).toNumber(), "Pool has incorrect total Ethos Lot");
		assert.equal(ownerTotalEthosLotAfter.toNumber(), ownerTotalEthosLotBefore.plus(1).toNumber(), "Name has incorrect total Ethos Lot");

		assert.equal(
			nameTotalEthosStakedAfter.toNumber(),
			nameTotalEthosStakedBefore.plus(quantity).toNumber(),
			"Name has incorrect totalEthosStaked value"
		);
		assert.equal(
			namePoolEthosStakedAfter.toNumber(),
			namePoolEthosStakedBefore.plus(quantity).toNumber(),
			"Name has incorrect namePoolEthosStaked value"
		);
		assert.equal(
			nameEthosBalanceAfter.toNumber(),
			nameEthosBalanceBefore.minus(quantity).toNumber(),
			"Name has incorrect Ethos balance"
		);
		assert.equal(taoEthosBalanceAfter.toNumber(), taoEthosBalanceBefore.plus(quantity).toNumber(), "TAO has incorrect Ethos balance");

		var ethosLot = await taopool.ethosLots(ethosLotId);
		assert.equal(ethosLot[0], ethosLotId, "EthosLot has incorrect ethosLotId");
		assert.equal(ethosLot[1], nameId, "EthosLot has incorrect nameId (seller)");
		assert.equal(ethosLot[2].toNumber(), quantity, "EthosLot has incorrect lotQuantity");
		assert.equal(ethosLot[3], taoId, "EthosLot has incorrect taoId");
		assert.equal(ethosLot[4].toNumber(), taoEthosBalanceBefore.toNumber(), "EthosLot has incorrect poolPreStakeSnapshot");
		assert.equal(
			ethosLot[5].toNumber(),
			taoEthosBalanceBefore.plus(quantity).toNumber(),
			"EthosLot has incorrect poolStakeLotSnapshot"
		);
		assert.equal(ethosLot[6].toNumber(), quantity, "EthosLot has incorrect lotValueInLogos");
		assert.equal(ethosLot[7].toNumber(), 0, "EthosLot has incorrect logosWithdrawn");
		nameEthosLots.push(ethosLotId);
		return ethosLotId;
	};

	var stakePathos = async function(taoId, quantity, advocateNameId, account) {
		var nameId = await namefactory.ethAddressToNameId(account);

		var contractTotalPathosStakeBefore = await taopool.contractTotalPathosStake();
		var contractTotalPathosBefore = await taopool.contractTotalPathos();
		var nameTotalPathosStakedBefore = await taopool.totalPathosStaked(nameId);
		var namePoolPathosStakedBefore = await taopool.namePoolPathosStaked(nameId, taoId);
		var namePathosBalanceBefore = await pathos.balanceOf(nameId);
		var taoPathosBalanceBefore = await pathos.balanceOf(taoId);
		var availablePathosToStakeBefore = await taopool.availablePathosToStake(taoId);

		var advocatedTAOLogosBefore = await logos.advocatedTAOLogos(advocateNameId, taoId);
		var totalAdvocatedTAOLogosBefore = await logos.totalAdvocatedTAOLogos(advocateNameId);

		var canStakePathos;
		try {
			var result = await taopool.stakePathos(taoId, quantity, { from: account });
			canStakePathos = true;
		} catch (e) {
			canStakePathos = false;
		}
		assert.equal(canStakePathos, true, "Name can't stake Pathos on a TAO");

		var contractTotalPathosStakeAfter = await taopool.contractTotalPathosStake();
		var contractTotalPathosAfter = await taopool.contractTotalPathos();
		var nameTotalPathosStakedAfter = await taopool.totalPathosStaked(nameId);
		var namePoolPathosStakedAfter = await taopool.namePoolPathosStaked(nameId, taoId);
		var namePathosBalanceAfter = await pathos.balanceOf(nameId);
		var taoPathosBalanceAfter = await pathos.balanceOf(taoId);
		var availablePathosToStakeAfter = await taopool.availablePathosToStake(taoId);

		var advocatedTAOLogosAfter = await logos.advocatedTAOLogos(advocateNameId, taoId);
		var totalAdvocatedTAOLogosAfter = await logos.totalAdvocatedTAOLogos(advocateNameId);

		assert.equal(
			contractTotalPathosStakeAfter.toNumber(),
			contractTotalPathosStakeBefore.plus(1).toNumber(),
			"Contract has incorrect contractTotalPathosStake"
		);

		assert.equal(
			contractTotalPathosAfter.toNumber(),
			contractTotalPathosBefore.plus(quantity).toNumber(),
			"Contract has incorrect contractTotalPathos"
		);

		assert.equal(
			nameTotalPathosStakedAfter.toNumber(),
			nameTotalPathosStakedBefore.plus(quantity).toNumber(),
			"Name has incorrect totalPathosStaked value"
		);
		assert.equal(
			namePoolPathosStakedAfter.toNumber(),
			namePoolPathosStakedBefore.plus(quantity).toNumber(),
			"Name has incorrect namePoolPathosStaked value"
		);
		assert.equal(
			namePathosBalanceAfter.toNumber(),
			namePathosBalanceBefore.minus(quantity).toNumber(),
			"Name has incorrect Pathos balance"
		);
		assert.equal(
			taoPathosBalanceAfter.toNumber(),
			taoPathosBalanceBefore.plus(quantity).toNumber(),
			"TAO has incorrect Pathos balance"
		);
		assert.equal(
			availablePathosToStakeAfter.toNumber(),
			availablePathosToStakeBefore.minus(quantity).toNumber(),
			"availablePathosToStake() returns incorrect value"
		);

		assert.equal(
			advocatedTAOLogosAfter.toNumber(),
			advocatedTAOLogosBefore.plus(quantity).toNumber(),
			"advocatedTAOLogos() returns incorrect value"
		);
		assert.equal(
			totalAdvocatedTAOLogosAfter.toNumber(),
			totalAdvocatedTAOLogosBefore.plus(quantity).toNumber(),
			"advocatedTAOLogos() returns incorrect value"
		);
	};

	var withdrawLogos = async function(ethosLotId, account) {
		var nameId = await namefactory.ethAddressToNameId(account);

		var ethosLotBefore = await taopool.ethosLots(ethosLotId);
		var taoId = ethosLotBefore[3];

		var nameLogosBefore = await logos.balanceOf(nameId);
		var contractTotalLogosWithdrawnBefore = await taopool.contractTotalLogosWithdrawn();
		var poolTotalLogosWithdrawnBefore = await taopool.poolTotalLogosWithdrawn(taoId);
		var lotLogosAvailableToWithdrawBefore = await taopool.lotLogosAvailableToWithdraw(ethosLotId);
		var nameTotalLogosWithdrawnBefore = await taopool.totalLogosWithdrawn(nameId);
		var namePoolLogosWithdrawnBefore = await taopool.namePoolLogosWithdrawn(nameId, taoId);

		var canWithdrawLogos;
		try {
			var result = await taopool.withdrawLogos(ethosLotId, { from: account });
			canWithdrawLogos = true;
		} catch (e) {
			canWithdrawLogos = false;
		}
		assert.equal(canWithdrawLogos, true, "Name can't withdraw Logos from Ethos Lot");

		var ethosLotAfter = await taopool.ethosLots(ethosLotId);
		var nameLogosAfter = await logos.balanceOf(nameId);
		var contractTotalLogosWithdrawnAfter = await taopool.contractTotalLogosWithdrawn();
		var poolTotalLogosWithdrawnAfter = await taopool.poolTotalLogosWithdrawn(taoId);
		var lotLogosAvailableToWithdrawAfter = await taopool.lotLogosAvailableToWithdraw(ethosLotId);
		var nameTotalLogosWithdrawnAfter = await taopool.totalLogosWithdrawn(nameId);
		var namePoolLogosWithdrawnAfter = await taopool.namePoolLogosWithdrawn(nameId, taoId);

		assert.equal(
			ethosLotAfter[6].toNumber(),
			ethosLotBefore[6].minus(lotLogosAvailableToWithdrawBefore).toNumber(),
			"Ethos Lot has incorrect lotValueInLogos"
		);
		assert.equal(
			ethosLotAfter[7].toNumber(),
			ethosLotBefore[7].plus(lotLogosAvailableToWithdrawBefore).toNumber(),
			"Ethos Lot has incorrect logosWithdrawn"
		);

		assert.equal(
			nameLogosAfter.toNumber(),
			nameLogosBefore.plus(lotLogosAvailableToWithdrawBefore).toNumber(),
			"Name has incorrect Logos balance"
		);
		assert.equal(
			contractTotalLogosWithdrawnAfter.toNumber(),
			contractTotalLogosWithdrawnBefore.plus(lotLogosAvailableToWithdrawBefore).toNumber(),
			"Contract has incorrect contractTotalLogosWithdrawn"
		);
		assert.equal(
			poolTotalLogosWithdrawnAfter.toNumber(),
			poolTotalLogosWithdrawnBefore.plus(lotLogosAvailableToWithdrawBefore).toNumber(),
			"Contract has incorrect poolTotalLogosWithdrawn"
		);
		assert.equal(lotLogosAvailableToWithdrawAfter.toNumber(), 0, "lotLogosAvailableToWithdraw() returns incorrect value");

		assert.equal(
			nameTotalLogosWithdrawnAfter.toNumber(),
			nameTotalLogosWithdrawnBefore.plus(lotLogosAvailableToWithdrawBefore).toNumber(),
			"Name has incorrect totalLogosWithdrawn value"
		);
		assert.equal(
			namePoolLogosWithdrawnAfter.toNumber(),
			namePoolLogosWithdrawnBefore.plus(lotLogosAvailableToWithdrawBefore).toNumber(),
			"Name has incorrect namePoolLogosWithdrawn value"
		);
	};

	it("The AO - transferOwnership() - should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await taopool.transferOwnership(taoId1, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await taopool.transferOwnership(taoId1, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await taopool.theAO();
		assert.equal(newTheAO, taoId1, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - setWhitelist() should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await taopool.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await taopool.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await taopool.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
	});

	it("The AO - setNameFactoryAddress() should be able to set NameFactory address", async function() {
		var canSetAddress;
		try {
			await taopool.setNameFactoryAddress(namefactory.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameFactory address");

		try {
			await taopool.setNameFactoryAddress(namefactory.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameFactory address");

		var nameFactoryAddress = await taopool.nameFactoryAddress();
		assert.equal(nameFactoryAddress, namefactory.address, "Contract has incorrect nameFactoryAddress");
	});

	it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await taopool.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await taopool.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await taopool.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("The AO - setTAOFactoryAddress() should be able to set TAOFactory address", async function() {
		var canSetAddress;
		try {
			await taopool.setTAOFactoryAddress(taofactory.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set TAOFactory address");

		try {
			await taopool.setTAOFactoryAddress(taofactory.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set TAOFactory address");

		var taoFactoryAddress = await taopool.taoFactoryAddress();
		assert.equal(taoFactoryAddress, taofactory.address, "Contract has incorrect taoFactoryAddress");
	});

	it("The AO - setPathosAddress() should be able to set Pathos address", async function() {
		var canSetAddress;
		try {
			await taopool.setPathosAddress(pathos.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set Pathos address");

		try {
			await taopool.setPathosAddress(pathos.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set Pathos address");

		var pathosAddress = await taopool.pathosAddress();
		assert.equal(pathosAddress, pathos.address, "Contract has incorrect pathosAddress");
	});

	it("The AO - setEthosAddress() should be able to set Ethos address", async function() {
		var canSetAddress;
		try {
			await taopool.setEthosAddress(ethos.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set Ethos address");

		try {
			await taopool.setEthosAddress(ethos.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set Ethos address");

		var ethosAddress = await taopool.ethosAddress();
		assert.equal(ethosAddress, ethos.address, "Contract has incorrect ethosAddress");
	});

	it("The AO - setLogosAddress() should be able to set Logos address", async function() {
		var canSetAddress;
		try {
			await taopool.setLogosAddress(logos.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set Logos address");

		try {
			await taopool.setLogosAddress(logos.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set Logos address");

		var logosAddress = await taopool.logosAddress();
		assert.equal(logosAddress, logos.address, "Contract has incorrect logosAddress");
	});

	it("The AO - setNameAccountRecoveryAddress() should be able to set NameAccountRecovery address", async function() {
		var canSetAddress;
		try {
			await taopool.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameAccountRecovery address");

		try {
			await taopool.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameAccountRecovery address");

		var nameAccountRecoveryAddress = await taopool.nameAccountRecoveryAddress();
		assert.equal(nameAccountRecoveryAddress, nameaccountrecovery.address, "Contract has incorrect nameAccountRecoveryAddress");
	});

	it("initialize() - only TAOFactory can create a pool for a TAO", async function() {
		var canCreate;
		try {
			var result = await taofactory.createTAO(
				"Delta's TAO",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				"somecontentid",
				nameId2,
				0,
				true,
				0,
				{
					from: account2
				}
			);
			canCreate = true;
		} catch (e) {
			canCreate = false;
		}
		assert.equal(canCreate, false, "TAO Factory can create TAO with ethos cap status on, but has 0 etho cap amount");

		var childMinLogos = 10;
		var ethosCapStatus = true;
		var ethosCapAmount = 1000;

		// Create a TAO
		var result = await taofactory.createTAO(
			"Delta's TAO",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			"somecontentid",
			nameId2,
			childMinLogos,
			ethosCapStatus,
			ethosCapAmount,
			{
				from: account2
			}
		);
		var createTAOEvent = result.logs[0];
		taoId2 = createTAOEvent.args.taoId;

		var isExist = await taopool.isExist(taoId2);
		assert.equal(isExist, true, "isExist() returns incorrect value");

		var pool = await taopool.pools(taoId2);
		assert.equal(pool[0], taoId2, "Pool has incorrect taoId");
		assert.equal(pool[1], ethosCapStatus, "Pool has incorrect ethosCapStatus");
		assert.equal(pool[2].toNumber(), ethosCapAmount, "Pool has incorrect ethosCapAmount");
		assert.equal(pool[3], true, "Pool has incorrect status");

		childMinLogos = 10;
		ethosCapStatus = false;
		ethosCapAmount = 1000;

		// Create a TAO
		var result = await taofactory.createTAO(
			"Echo's TAO",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			"somecontentid",
			nameId3,
			childMinLogos,
			ethosCapStatus,
			ethosCapAmount,
			{
				from: account3
			}
		);
		createTAOEvent = result.logs[0];
		taoId3 = createTAOEvent.args.taoId;

		isExist = await taopool.isExist(taoId3);
		assert.equal(isExist, true, "isExist() returns incorrect value");

		pool = await taopool.pools(taoId3);
		assert.equal(pool[0], taoId3, "Pool has incorrect taoId");
		assert.equal(pool[1], ethosCapStatus, "Pool has incorrect ethosCapStatus");
		assert.equal(pool[2].toNumber(), 0, "Pool has incorrect ethosCapAmount");
		assert.equal(pool[3], true, "Pool has incorrect status");
	});

	it("updatePoolStatus() - Advocate of TAO should be able to update the Pool status", async function() {
		var canUpdatePoolStatus;
		try {
			await taopool.updatePoolStatus(someAddress, false, { from: account2 });
			canUpdatePoolStatus = true;
		} catch (e) {
			canUpdatePoolStatus = false;
		}
		assert.equal(canUpdatePoolStatus, false, "Can update Pool status of a non-TAO");

		try {
			await taopool.updatePoolStatus(taoId2, false, { from: someAddress });
			canUpdatePoolStatus = true;
		} catch (e) {
			canUpdatePoolStatus = false;
		}
		assert.equal(canUpdatePoolStatus, false, "Non-advocate of TAO can update Pool status");

		// Listener submit account recovery for nameId2
		await nameaccountrecovery.submitAccountRecovery(nameId2, { from: account3 });

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		try {
			await taopool.updatePoolStatus(taoId2, false, { from: account2 });
			canUpdatePoolStatus = true;
		} catch (e) {
			canUpdatePoolStatus = false;
		}
		assert.equal(canUpdatePoolStatus, false, "Compromised Advocate of TAO can update Pool status");

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.plus(100).toNumber());

		var nonceBefore = await taofactory.nonces(taoId2);

		try {
			await taopool.updatePoolStatus(taoId2, false, { from: account2 });
			canUpdatePoolStatus = true;
		} catch (e) {
			canUpdatePoolStatus = false;
		}
		assert.equal(canUpdatePoolStatus, true, "Advocate of TAO can't update Pool status");

		var nonceAfter = await taofactory.nonces(taoId2);
		assert.equal(nonceAfter.toNumber(), nonceBefore.plus(1).toNumber(), "TAO has incorrect nonce");

		var pool = await taopool.pools(taoId2);
		assert.equal(pool[3], false, "Pool has incorrect status");

		// Update the status of the Pool again
		await taopool.updatePoolStatus(taoId2, true, { from: account2 });
	});

	it("updatePoolEthosCap() - Advocate of TAO should be able to update the Pool's Ethos cap", async function() {
		var canUpdate;
		try {
			await taopool.updatePoolEthosCap(someAddress, true, 1000, { from: account2 });
			canUpdate = true;
		} catch (e) {
			canUpdate = false;
		}
		assert.equal(canUpdate, false, "Can update Pool's Ethos cap of a non-TAO");

		try {
			await taopool.updatePoolEthosCap(taoId2, true, 1000, { from: someAddress });
			canUpdate = true;
		} catch (e) {
			canUpdate = false;
		}
		assert.equal(canUpdate, false, "Non-Advocate of TAO can update Pool's Ethos cap");

		try {
			await taopool.updatePoolEthosCap(taoId2, true, 0, { from: account2 });
			canUpdate = true;
		} catch (e) {
			canUpdate = false;
		}
		assert.equal(canUpdate, false, "Advocate of TAO can update Pool's Ethos cap with cap on but no cap amount");

		await pathos.mint(taoId2, 10, { from: theAO });
		try {
			await taopool.updatePoolEthosCap(taoId2, true, 5, { from: account2 });
			canUpdate = true;
		} catch (e) {
			canUpdate = false;
		}
		assert.equal(
			canUpdate,
			false,
			"Advocate of TAO can update Pool's Ethos cap with cap on and Ethos cap amount less than current Pathos amount in the TAO"
		);

		await pathos.whitelistBurnFrom(taoId2, 10, { from: theAO });

		// Listener submit account recovery for nameId2
		await nameaccountrecovery.submitAccountRecovery(nameId2, { from: account3 });

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		try {
			await taopool.updatePoolEthosCap(taoId2, true, 1500, { from: account2 });
			canUpdate = true;
		} catch (e) {
			canUpdate = false;
		}
		assert.equal(canUpdate, false, "Compromised Advocate of TAO can update Pool's Ethos cap");

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.plus(100).toNumber());

		var nonceBefore = await taofactory.nonces(taoId2);
		try {
			await taopool.updatePoolEthosCap(taoId2, true, 1500, { from: account2 });
			canUpdate = true;
		} catch (e) {
			canUpdate = false;
		}
		assert.equal(canUpdate, true, "Advocate of TAO can't update Pool's Ethos cap");

		var nonceAfter = await taofactory.nonces(taoId2);
		assert.equal(nonceAfter.toNumber(), nonceBefore.plus(1).toNumber(), "TAO has incorrect nonce");

		var pool = await taopool.pools(taoId2);
		assert.equal(pool[1], true, "Pool has incorrect ethosCapStatus");
		assert.equal(pool[2].toNumber(), 1500, "Pool has incorrect ethosCapAmount");
	});

	it("stakeEthos() - Name should be able to stake Ethos on a TAO", async function() {
		var canStakeEthos;
		try {
			var result = await taopool.stakeEthos(someAddress, 10, { from: account4 });
			canStakeEthos = true;
		} catch (e) {
			canStakeEthos = false;
		}
		assert.equal(canStakeEthos, false, "Name can stake Ethos on a non-existing TAO");

		try {
			var result = await taopool.stakeEthos(taoId2, 10, { from: account3 });
			canStakeEthos = true;
		} catch (e) {
			canStakeEthos = false;
		}
		assert.equal(canStakeEthos, false, "Name with no balance can stake Ethos on a TAO");

		try {
			var result = await taopool.stakeEthos(taoId3, 10 ** 10, { from: account4 });
			canStakeEthos = true;
		} catch (e) {
			canStakeEthos = false;
		}
		assert.equal(canStakeEthos, false, "Name can stake Ethos on a TAO more than its owned balance");

		// Stop the pool
		await taopool.updatePoolStatus(taoId2, false, { from: account2 });

		try {
			var result = await taopool.stakeEthos(taoId2, 10, { from: account4 });
			canStakeEthos = true;
		} catch (e) {
			canStakeEthos = false;
		}
		assert.equal(canStakeEthos, false, "Name can stake Ethos on a TAO that is currently stopped");

		// Start the pool
		await taopool.updatePoolStatus(taoId2, true, { from: account2 });

		// Listener submit account recovery for nameId4
		await nameaccountrecovery.submitAccountRecovery(nameId4, { from: account3 });

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		try {
			var result = await taopool.stakeEthos(taoId2, 500, { from: account4 });
			canStakeEthos = true;
		} catch (e) {
			canStakeEthos = false;
		}
		assert.equal(canStakeEthos, false, "Compromised Name can stake Ethos on a TAO");

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.plus(100).toNumber());

		ethosLotId1 = await stakeEthos(taoId2, 500, account4, nameId4EthosLots);
		ethosLotId2 = await stakeEthos(taoId2, 500, account5, nameId5EthosLots);
		ethosLotId3 = await stakeEthos(taoId2, 500, account6, nameId6EthosLots);

		// Test Ethos cap
		try {
			var result = await taopool.stakeEthos(taoId2, 10, { from: account4 });
			canStakeEthos = true;
		} catch (e) {
			canStakeEthos = false;
		}
		assert.equal(canStakeEthos, false, "Name can stake Ethos on a TAO that has reached Ethos cap");

		// Test stake Ethos on Pool with no cap
		ethosLotId4 = await stakeEthos(taoId3, 10000, account4, nameId4EthosLots);
		ethosLotId5 = await stakeEthos(taoId3, 10000, account5, nameId5EthosLots);
		ethosLotId6 = await stakeEthos(taoId3, 10000, account6, nameId6EthosLots);
	});

	it("ownerTotalEthosLot() - should return the correct total Ethos Lots of a Name", async function() {
		var nameId4TotalEthosLot = await taopool.ownerTotalEthosLot(nameId4);
		assert.equal(nameId4TotalEthosLot.toString(), nameId4EthosLots.length, "ownerTotalEthosLot returns incorrect total Ethos Lots");

		var nameId5TotalEthosLot = await taopool.ownerTotalEthosLot(nameId5);
		assert.equal(nameId5TotalEthosLot.toString(), nameId5EthosLots.length, "ownerTotalEthosLot returns incorrect total Ethos Lots");

		var nameId6TotalEthosLot = await taopool.ownerTotalEthosLot(nameId6);
		assert.equal(nameId6TotalEthosLot.toString(), nameId6EthosLots.length, "ownerTotalEthosLot returns incorrect total Ethos Lots");
	});

	it("ownerEthosLotIds() - should return all the Ethos Lot IDs of a Name", async function() {
		var nameId4TotalEthosLot = await taopool.ownerTotalEthosLot(nameId4);
		var ethosLots = await taopool.ownerEthosLotIds(nameId4, 0, nameId4TotalEthosLot.minus(1).toString());
		var isEqual =
			ethosLots.length === nameId4EthosLots.length &&
			ethosLots.every(function(value, index) {
				return value === nameId4EthosLots[index];
			});
		assert.equal(isEqual, true, "ownerEthosLotIds() return incorrect EthosLot IDs");

		var nameId5TotalEthosLot = await taopool.ownerTotalEthosLot(nameId5);
		var ethosLots = await taopool.ownerEthosLotIds(nameId5, 0, nameId5TotalEthosLot.minus(1).toString());
		var isEqual =
			ethosLots.length === nameId5EthosLots.length &&
			ethosLots.every(function(value, index) {
				return value === nameId5EthosLots[index];
			});
		assert.equal(isEqual, true, "ownerEthosLotIds() return incorrect EthosLot IDs");

		var nameId6TotalEthosLot = await taopool.ownerTotalEthosLot(nameId6);
		var ethosLots = await taopool.ownerEthosLotIds(nameId6, 0, nameId6TotalEthosLot.minus(1).toString());
		var isEqual =
			ethosLots.length === nameId6EthosLots.length &&
			ethosLots.every(function(value, index) {
				return value === nameId6EthosLots[index];
			});
		assert.equal(isEqual, true, "ownerEthosLotIds() return incorrect EthosLot IDs");
	});

	it("availablePathosToStake() - should return the amount of Pathos that can be staked on a TAO", async function() {
		var canGetAvailablePathosToStake, availablePathosToStake;
		try {
			availablePathosToStake = await taopool.availablePathosToStake(someAddress);
			canGetAvailablePathosToStake = true;
		} catch (e) {
			canGetAvailablePathosToStake = false;
		}
		assert.equal(canGetAvailablePathosToStake, false, "Can get available Pathos to stake on a non-TAO");

		availablePathosToStake = await taopool.availablePathosToStake(taoId2);
		var ethosBalance = await ethos.balanceOf(taoId2);
		var pathosBalance = await pathos.balanceOf(taoId2);
		assert.equal(
			availablePathosToStake.toNumber(),
			ethosBalance.minus(pathosBalance).toNumber(),
			"availablePathosToStake() returns incorrect value"
		);

		// Stop the pool
		await taopool.updatePoolStatus(taoId2, false, { from: account2 });
		availablePathosToStake = await taopool.availablePathosToStake(taoId2);
		assert.equal(availablePathosToStake.toNumber(), 0, "availablePathosToStake() returns incorrect value");

		// Start the pool again
		await taopool.updatePoolStatus(taoId2, true, { from: account2 });
	});

	it("stakePathos() - Name should be able to stake Pathos on a TAO", async function() {
		var canStakePathos;
		try {
			var result = await taopool.stakePathos(someAddress, 10, { from: account4 });
			canStakePathos = true;
		} catch (e) {
			canStakePathos = false;
		}
		assert.equal(canStakePathos, false, "Name can stake Pathos on a non-existing TAO");

		try {
			var result = await taopool.stakePathos(taoId2, 10, { from: account3 });
			canStakePathos = true;
		} catch (e) {
			canStakePathos = false;
		}
		assert.equal(canStakePathos, false, "Name with no balance can stake Pathos on a TAO");

		try {
			var result = await taopool.stakePathos(taoId3, 10 ** 10, { from: account4 });
			canStakePathos = true;
		} catch (e) {
			canStakePathos = false;
		}
		assert.equal(canStakePathos, false, "Name can stake Pathos on a TAO more than its owned balance");

		// Stop the pool
		await taopool.updatePoolStatus(taoId2, false, { from: account2 });

		try {
			var result = await taopool.stakePathos(taoId2, 10, { from: account4 });
			canStakePathos = true;
		} catch (e) {
			canStakePathos = false;
		}
		assert.equal(canStakePathos, false, "Name can stake Pathos on a TAO that is currently stopped");

		// Start the pool
		await taopool.updatePoolStatus(taoId2, true, { from: account2 });

		// Listener submit account recovery for nameId4
		await nameaccountrecovery.submitAccountRecovery(nameId4, { from: account3 });

		try {
			var result = await taopool.stakePathos(taoId2, 400, { from: account4 });
			canStakePathos = true;
		} catch (e) {
			canStakePathos = false;
		}
		assert.equal(canStakePathos, false, "Compromised Name can stake Pathos on a TAO");

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.plus(100).toNumber());

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		await stakePathos(taoId2, 400, nameId2, account4);
		await stakePathos(taoId2, 300, nameId2, account5);

		// Try staking Pathos more than available amount to fill, i.e TAO's Ethos - TAO's Pathos >= quantity
		var availablePathosToStake = await taopool.availablePathosToStake(taoId2);
		try {
			var result = await taopool.stakePathos(taoId2, availablePathosToStake.plus(10).toNumber(), { from: account4 });
			canStakePathos = true;
		} catch (e) {
			canStakePathos = false;
		}
		assert.equal(canStakePathos, false, "Name can stake Pathos on a TAO more than its available amount to fill");
	});

	it("lotLogosAvailableToWithdraw() - should return the amount of Logos available to withdraw from a Ethos Lot", async function() {
		var canGet;
		try {
			await taopool.lotLogosAvailableToWithdraw(someAddress);
			canGet = true;
		} catch (e) {
			canGet = false;
		}
		assert.equal(canGet, false, "Can get Logos available to withdraw of a non-existing TAO");

		// ethosLotId1 has 500 lotQuantity
		// nameId4 staked 400 Pathos
		// nameId5 staked 300 Pathos
		// ethosLotId1 is filled entirely
		var availableToWithdraw = await taopool.lotLogosAvailableToWithdraw(ethosLotId1);
		assert.equal(availableToWithdraw.toNumber(), 500, "lotLogosAvailableToWithdraw() returns incorrect value");

		// ethosLotId2 has 500 lotQuantity
		// nameId4 staked 400 Pathos
		// nameId5 staked 300 Pathos
		// ethosLotId2 is sold partially
		availableToWithdraw = await taopool.lotLogosAvailableToWithdraw(ethosLotId2);
		assert.equal(availableToWithdraw.toNumber(), 200, "lotLogosAvailableToWithdraw() returns incorrect value");
	});

	it("withdrawLogos() - should be able to withdraw Logos from filled Ethos Lot", async function() {
		var canWithdrawLogos;
		try {
			var result = await taopool.withdrawLogos(someAddress, { from: account4 });
			canWithdrawLogos = true;
		} catch (e) {
			canWithdrawLogos = false;
		}
		assert.equal(canWithdrawLogos, false, "Name can withdraw Logos from non-existing Ethos Lot");

		try {
			var result = await taopool.withdrawLogos(ethosLotId1, { from: account3 });
			canWithdrawLogos = true;
		} catch (e) {
			canWithdrawLogos = false;
		}
		assert.equal(canWithdrawLogos, false, "Non-Ethos Lot owner can withdraw Logos from Ethos Lot");

		try {
			var result = await taopool.withdrawLogos(ethosLotId3, { from: account6 });
			canWithdrawLogos = true;
		} catch (e) {
			canWithdrawLogos = false;
		}
		assert.equal(canWithdrawLogos, false, "Name can withdraw Logos from Ethos Lot that is not yet filled");

		// Listener submit account recovery for nameId4
		await nameaccountrecovery.submitAccountRecovery(nameId4, { from: account3 });

		// Fast forward the time
		await helper.advanceTimeAndBlock(1000);

		try {
			var result = await taopool.withdrawLogos(ethosLotId1, { from: account4 });
			canWithdrawLogos = true;
		} catch (e) {
			canWithdrawLogos = false;
		}
		assert.equal(canWithdrawLogos, false, "Compromised Name can withdraw Logos from Ethos Lot");

		// Fast forward the time
		await helper.advanceTimeAndBlock(accountRecoveryLockDuration.plus(100).toNumber());

		await withdrawLogos(ethosLotId1, account4);
		await withdrawLogos(ethosLotId2, account5);
	});
});
