var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var Logos = artifacts.require("./Logos.sol");

var AOPool = artifacts.require("./AOPool.sol");
var AOIon = artifacts.require("./AOIon.sol");
var TokenOne = artifacts.require("./TokenOne.sol");

var EthCrypto = require("eth-crypto");
var BN = require("bn.js");

contract("AOPool", function(accounts) {
	var namefactory,
		taofactory,
		nametaoposition,
		logos,
		nameId,
		taoId,
		aopool,
		aoion,
		tokenone,
		poolId1,
		poolId2,
		poolId3,
		poolId4,
		poolId5,
		poolId6,
		poolId7,
		poolId8,
		poolId9,
		lotId1,
		lotId2,
		lotId3,
		lotId4,
		lotId5,
		lotId6,
		lotId7,
		lotId8;
	var account1Lots = [];
	var account2Lots = [];
	var account3Lots = [];
	var account4Lots = [];
	var account5Lots = [];
	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var account4 = accounts[4];
	var account5 = accounts[5];
	var buyer1 = accounts[6];
	var buyer2 = accounts[7];
	var buyer3 = accounts[8];

	var someAddress = accounts[8];
	var whitelistedAddress = accounts[9];
	var accountNoBalance = accounts[9];
	var emptyAddress = "0x0000000000000000000000000000000000000000";
	var nameIdLocalWriterKey = EthCrypto.createIdentity();

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		logos = await Logos.deployed();

		aopool = await AOPool.deployed();
		aoion = await AOIon.deployed();
		tokenone = await TokenOne.deployed();

		// Create Name
		var result = await namefactory.createName(
			"charlie",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			web3.utils.toHex("somecontentid"),
			nameIdLocalWriterKey.address,
			{
				from: account1
			}
		);
		nameId = await namefactory.ethAddressToNameId(account1);

		// Mint Logos to nameId
		await logos.setWhitelist(theAO, true, { from: theAO });
		await logos.mint(nameId, 10 ** 12, { from: theAO });

		result = await taofactory.createTAO(
			"Charlie's TAO",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			web3.utils.toHex("somecontentid"),
			nameId,
			0,
			false,
			0,
			{
				from: account1
			}
		);
		var createTAOEvent = result.logs[0];
		taoId = createTAOEvent.args.taoId;

		await aoion.setWhitelist(theAO, true, { from: theAO });
		await aoion.mint(account1, 1000000, { from: theAO });
		await aoion.mint(account2, 1000000, { from: theAO });
		await aoion.mint(account3, 1000000, { from: theAO });
		await aoion.mint(account4, 1000000, { from: theAO });
		await aoion.mint(account5, 1000000, { from: theAO });
	});

	var createPool = async function(
		price,
		status,
		sellCapStatus,
		sellCapAmount,
		quantityCapStatus,
		quantityCapAmount,
		erc20CounterAsset,
		erc20TokenAddress,
		erc20TokenMultiplier,
		account
	) {
		var totalPoolBefore = await aopool.totalPool();

		var canCreatePool, createPoolEvent, poolId;
		try {
			var result = await aopool.createPool(
				price,
				status,
				sellCapStatus,
				sellCapAmount,
				quantityCapStatus,
				quantityCapAmount,
				erc20CounterAsset,
				erc20TokenAddress,
				erc20TokenMultiplier,
				{ from: account }
			);
			createPoolEvent = result.logs[0];
			poolId = createPoolEvent.args.poolId;
			canCreatePool = true;
		} catch (e) {
			createPoolEvent = null;
			poolId = null;
			canCreatePool = false;
		}
		assert.equal(canCreatePool, true, "The AO can't create Pool");

		var totalPoolAfter = await aopool.totalPool();
		assert.equal(totalPoolAfter.toString(), totalPoolBefore.add(new BN(1)).toString(), "Contract has incorrect totalPool value");

		assert.equal(poolId.toString(), totalPoolAfter.toString(), "CreatePool event has incorrect poolId");

		var pool = await aopool.pools(poolId.toString());
		assert.equal(pool[0].toString(), new BN(price).toString(), "Pool has incorrect price");
		assert.equal(pool[1], status, "Pool has incorrect status");
		assert.equal(pool[2], sellCapStatus, "Pool has incorrect sellCapStatus");
		if (sellCapStatus) {
			assert.equal(pool[3].toString(), new BN(sellCapAmount).toString(), "Pool has incorrect sellCapAmount");
		} else {
			assert.equal(pool[3].toString(), new BN(0).toString(), "Pool has incorrect sellCapAmount");
		}
		assert.equal(pool[4], quantityCapStatus, "Pool has incorrect quantityCapStatus");
		if (quantityCapStatus) {
			assert.equal(pool[5].toString(), new BN(quantityCapAmount).toString(), "Pool has incorrect quantityCapAmount");
		} else {
			assert.equal(pool[5].toString(), new BN(0).toString(), "Pool has incorrect quantityCapAmount");
		}
		assert.equal(pool[6], erc20CounterAsset, "Pool has incorrect erc20CounterAsset");
		if (erc20CounterAsset) {
			assert.equal(pool[7], erc20TokenAddress, "Pool has incorrect erc20TokenAddress");
			assert.equal(pool[8].toString(), new BN(erc20TokenMultiplier).toString(), "Pool has incorrect erc20TokenMultiplier");
		} else {
			assert.equal(pool[7], emptyAddress, "Pool has incorrect erc20TokenAddress");
			assert.equal(pool[8].toString(), new BN(0).toString(), "Pool has incorrect erc20TokenMultiplier");
		}
		assert.equal(pool[9], account, "Pool has incorrect adminAddress");
		return poolId;
	};

	var sell = async function(poolId, quantity, price, account, accountLots) {
		var contractTotalLotBefore = await aopool.contractTotalLot();
		var poolTotalLotBefore = await aopool.poolTotalLot(poolId);
		var ownerTotalLotBefore = await aopool.ownerTotalLot(account);
		var poolTotalQuantityBefore = await aopool.poolTotalQuantity(poolId);
		var poolTotalSellBefore = await aopool.poolTotalSell(poolId);
		var totalPutOnSaleBefore = await aopool.totalPutOnSale(account);
		var contractTotalQuantityBefore = await aopool.contractTotalQuantity();
		var contractTotalSellBefore = await aopool.contractTotalSell();
		var accountNetworkBalanceBefore = await aoion.balanceOf(account);
		var poolNetworkBalanceBefore = await aoion.balanceOf(aopool.address);

		var canSell, lotCreationEvent, lotId;
		try {
			var result = await aopool.sell(poolId, quantity, price, { from: account });
			lotCreationEvent = result.logs[0];
			lotId = lotCreationEvent.args.lotId;
			canSell = true;
		} catch (e) {
			lotCreationEvent = null;
			lotId = null;
			canSell = false;
		}
		assert.equal(canSell, true, "Account can't sell ions on a Pool");

		var contractTotalLotAfter = await aopool.contractTotalLot();
		var poolTotalLotAfter = await aopool.poolTotalLot(poolId);
		var ownerTotalLotAfter = await aopool.ownerTotalLot(account);
		var poolTotalQuantityAfter = await aopool.poolTotalQuantity(poolId);
		var poolTotalSellAfter = await aopool.poolTotalSell(poolId);
		var totalPutOnSaleAfter = await aopool.totalPutOnSale(account);
		var contractTotalQuantityAfter = await aopool.contractTotalQuantity();
		var contractTotalSellAfter = await aopool.contractTotalSell();
		var accountNetworkBalanceAfter = await aoion.balanceOf(account);
		var poolNetworkBalanceAfter = await aoion.balanceOf(aopool.address);

		assert.equal(
			contractTotalLotAfter.toString(),
			contractTotalLotBefore.add(new BN(1)).toString(),
			"Contract has incorrect total Lot"
		);
		assert.equal(poolTotalLotAfter.toString(), poolTotalLotBefore.add(new BN(1)).toString(), "Pool has incorrect total Lot");
		assert.equal(ownerTotalLotAfter.toString(), ownerTotalLotBefore.add(new BN(1)).toString(), "Account has incorrect total Lot");
		assert.equal(
			poolTotalQuantityAfter.toString(),
			poolTotalQuantityBefore.add(new BN(quantity)).toString(),
			"Pool has incorrect total quantity"
		);
		assert.equal(poolTotalSellAfter.toString(), poolTotalSellBefore.add(new BN(quantity)).toString(), "Pool has incorrect total sell");
		assert.equal(
			totalPutOnSaleAfter.toString(),
			totalPutOnSaleBefore.add(new BN(quantity)).toString(),
			"Account has incorrect totalPutOnSale"
		);
		assert.equal(
			contractTotalQuantityAfter.toString(),
			contractTotalQuantityBefore.add(new BN(quantity)).toString(),
			"Contract has incorrect total quantity"
		);
		assert.equal(
			contractTotalSellAfter.toString(),
			contractTotalSellBefore.add(new BN(quantity)).toString(),
			"Contract has incorrect total sell"
		);
		assert.equal(
			accountNetworkBalanceAfter.toString(),
			accountNetworkBalanceBefore.sub(new BN(quantity)).toString(),
			"Account has incorrect network ion balance"
		);
		assert.equal(
			poolNetworkBalanceAfter.toString(),
			poolNetworkBalanceBefore.add(new BN(quantity)).toString(),
			"Pool has incorrect network ion balance"
		);

		var lot = await aopool.lots(lotId);
		assert.equal(lot[0], lotId, "Lot has incorrect lotId");
		assert.equal(lot[1], account, "Lot has incorrect seller");
		assert.equal(lot[2].toString(), quantity, "Lot has incorrect lotQuantity");
		assert.equal(lot[3].toString(), poolId, "Lot has incorrect poolId");
		assert.equal(lot[4].toString(), poolTotalSellBefore.toString(), "Lot has incorrect poolPreSellSnapshot");
		assert.equal(lot[5].toString(), poolTotalSellBefore.add(new BN(quantity)).toString(), "Lot has incorrect poolSellLotSnapshot");
		assert.equal(lot[6].toString(), new BN(quantity).mul(new BN(price)).toString(), "Lot has incorrect lotValueInCounterAsset");
		assert.equal(lot[7].toString(), 0, "Lot has incorrect counterAssetWithdrawn");
		assert.equal(lot[8].toString(), 0, "Lot has incorrect ionWithdrawn");
		assert.isAbove(lot[9].toNumber(), 0, "Lot has incorrect multamp");

		accountLots.push(lotId);
		return lotId;
	};

	var buyWithEth = async function(poolId, quantity, price, account) {
		var poolTotalQuantityBefore = await aopool.poolTotalQuantity(poolId);
		var poolTotalBuyBefore = await aopool.poolTotalBuy(poolId);
		var poolEthereumBalanceBefore = await aopool.poolEthereumBalance(poolId);
		var contractTotalQuantityBefore = await aopool.contractTotalQuantity();
		var contractTotalBuyBefore = await aopool.contractTotalBuy();
		var contractEthereumBalanceBefore = await aopool.contractEthereumBalance();
		var totalBoughtBefore = await aopool.totalBought(account);
		var accountNetworkBalanceBefore = await aoion.balanceOf(account);
		var poolNetworkBalanceBefore = await aoion.balanceOf(aopool.address);

		var canBuy, buyWithEthEvent;
		try {
			var result = await aopool.buyWithEth(poolId, quantity, price, { from: account, value: quantity * price });
			buyWithEthEvent = result.logs[0];
			canBuy = true;
		} catch (e) {
			buyWithEthEvent = null;
			canBuy = false;
		}
		assert.equal(canBuy, true, "Account can't buy ion with Eth");

		var poolTotalQuantityAfter = await aopool.poolTotalQuantity(poolId);
		var poolTotalBuyAfter = await aopool.poolTotalBuy(poolId);
		var poolEthereumBalanceAfter = await aopool.poolEthereumBalance(poolId);
		var contractTotalQuantityAfter = await aopool.contractTotalQuantity();
		var contractTotalBuyAfter = await aopool.contractTotalBuy();
		var contractEthereumBalanceAfter = await aopool.contractEthereumBalance();
		var totalBoughtAfter = await aopool.totalBought(account);
		var accountNetworkBalanceAfter = await aoion.balanceOf(account);
		var poolNetworkBalanceAfter = await aoion.balanceOf(aopool.address);

		assert.equal(
			poolTotalQuantityAfter.toString(),
			poolTotalQuantityBefore.sub(new BN(quantity)).toString(),
			"Pool has incorrect total quantity"
		);
		assert.equal(poolTotalBuyAfter.toString(), poolTotalBuyBefore.add(new BN(quantity)).toString(), "Pool has incorrect total buy");
		assert.equal(
			poolEthereumBalanceAfter.toString(),
			poolEthereumBalanceBefore.add(new BN(quantity * price)).toString(),
			"Pool has incorrect ethereum balance"
		);
		assert.equal(
			contractTotalQuantityAfter.toString(),
			contractTotalQuantityBefore.sub(new BN(quantity)).toString(),
			"Contract has incorrect total quantity"
		);
		assert.equal(
			contractTotalBuyAfter.toString(),
			contractTotalBuyBefore.add(new BN(quantity)).toString(),
			"Contract has incorrect total buy"
		);
		assert.equal(
			contractEthereumBalanceAfter.toString(),
			contractEthereumBalanceBefore.add(new BN(quantity * price)).toString(),
			"Contract has incorrect ethereum balance"
		);
		assert.equal(totalBoughtAfter.toString(), totalBoughtBefore.add(new BN(quantity)).toString(), "Account has incorrect totalBought");
		assert.equal(
			accountNetworkBalanceAfter.toString(),
			accountNetworkBalanceBefore.add(new BN(quantity)).toString(),
			"Account has incorrect network ion balance"
		);
		assert.equal(
			poolNetworkBalanceAfter.toString(),
			poolNetworkBalanceBefore.sub(new BN(quantity)).toString(),
			"Pool has incorrect network ion balance"
		);
	};

	var withdrawEth = async function(lotId, account) {
		var lotBefore = await aopool.lots(lotId);
		var poolId = lotBefore[3];
		var poolEthereumBalanceBefore = await aopool.poolEthereumBalance(poolId.toString());
		var poolTotalEthereumWithdrawnBefore = await aopool.poolTotalEthereumWithdrawn(poolId.toString());
		var contractEthereumBalanceBefore = await aopool.contractEthereumBalance();
		var contractTotalEthereumWithdrawnBefore = await aopool.contractTotalEthereumWithdrawn();
		var totalSoldBefore = await aopool.totalSold(account);
		var totalEthereumWithdrawnBefore = await aopool.totalEthereumWithdrawn(account);
		var availableToWithdrawBefore = await aopool.lotEthAvailableToWithdraw(lotId);

		var canWithdrawEth, withdrawEthEvent;
		try {
			var result = await aopool.withdrawEth(lotId, { from: account });
			//console.log("Withdraw Gas", result.receipt.gasUsed);
			withdrawEthEvent = result.logs[0];
			canWithdrawEth = true;
		} catch (e) {
			withdrawEthEvent = null;
			canWithdrawEth = false;
		}
		assert.equal(canWithdrawEth, true, "Account can't withdraw Eth from Lot");

		var lotAfter = await aopool.lots(lotId);
		var poolEthereumBalanceAfter = await aopool.poolEthereumBalance(poolId.toString());
		var poolTotalEthereumWithdrawnAfter = await aopool.poolTotalEthereumWithdrawn(poolId.toString());
		var contractEthereumBalanceAfter = await aopool.contractEthereumBalance();
		var contractTotalEthereumWithdrawnAfter = await aopool.contractTotalEthereumWithdrawn();
		var totalSoldAfter = await aopool.totalSold(account);
		var totalEthereumWithdrawnAfter = await aopool.totalEthereumWithdrawn(account);
		var availableToWithdrawAfter = await aopool.lotEthAvailableToWithdraw(lotId);

		assert.equal(
			lotAfter[6].toString(),
			lotBefore[6].sub(availableToWithdrawBefore[1]).toString(),
			"Lot has incorrect lotValueInCounterAsset"
		);
		assert.equal(
			lotAfter[7].toString(),
			lotBefore[7].add(availableToWithdrawBefore[1]).toString(),
			"Lot has incorrect counterAssetWithdrawn"
		);
		assert.equal(
			poolEthereumBalanceAfter.toString(),
			poolEthereumBalanceBefore.sub(availableToWithdrawBefore[1]).toString(),
			"Pool has incorrect ethereum balance"
		);
		assert.equal(
			poolTotalEthereumWithdrawnAfter.toString(),
			poolTotalEthereumWithdrawnBefore.add(availableToWithdrawBefore[1]).toString(),
			"Pool has incorrect total ethereum withdrawn"
		);
		assert.equal(
			contractEthereumBalanceAfter.toString(),
			contractEthereumBalanceBefore.sub(availableToWithdrawBefore[1]).toString(),
			"Contract has incorrect ethereum balance"
		);
		assert.equal(
			contractTotalEthereumWithdrawnAfter.toString(),
			contractTotalEthereumWithdrawnBefore.add(availableToWithdrawBefore[1]).toString(),
			"Contract has incorrect total ethereum withdrawn"
		);
		assert.equal(
			totalSoldAfter.toString(),
			totalSoldBefore.add(availableToWithdrawBefore[0]).toString(),
			"Account has incorrect total sold"
		);
		assert.equal(
			totalEthereumWithdrawnAfter.toString(),
			totalEthereumWithdrawnBefore.add(availableToWithdrawBefore[1]).toString(),
			"Account has incorrect total ethereum withdrawn"
		);

		assert.equal(availableToWithdrawAfter[0].toString(), 0, "lotEthAvailableToWithdraw() returns incorrect sold quantity");
		assert.equal(availableToWithdrawAfter[1].toString(), 0, "lotEthAvailableToWithdraw() returns incorrect ETH available to withdraw");
		assert.equal(
			availableToWithdrawAfter[2].toString(),
			lotAfter[7].toString(),
			"lotEthAvailableToWithdraw() returns incorrect current ETH withdrawn from Lot"
		);
	};

	var withdrawIon = async function(lotId, quantity, account) {
		var lotBefore = await aopool.lots(lotId);

		var poolId = lotBefore[3];
		var pool = await aopool.pools(poolId.toString());
		var price = pool[0];

		var poolTotalQuantityBefore = await aopool.poolTotalQuantity(poolId.toString());
		var contractTotalQuantityBefore = await aopool.contractTotalQuantity();
		var poolTotalWithdrawnBefore = await aopool.poolTotalWithdrawn(poolId.toString());
		var contractTotalWithdrawnBefore = await aopool.contractTotalWithdrawn();
		var totalPutOnSaleBefore = await aopool.totalPutOnSale(account);
		var accountNetworkBalanceBefore = await aoion.balanceOf(account);
		var poolNetworkBalanceBefore = await aoion.balanceOf(aopool.address);

		var canWithdrawIon, withdrawIonEvent;
		try {
			var result = await aopool.withdrawIon(lotId, quantity, { from: account });
			withdrawIonEvent = result.logs[0];
			canWithdrawIon = true;
		} catch (e) {
			withdrawIonEvent = null;
			canWithdrawIon = false;
		}
		assert.equal(canWithdrawIon, true, "Account can't withdraw ion from Lot");

		var lotAfter = await aopool.lots(lotId);
		var poolTotalQuantityAfter = await aopool.poolTotalQuantity(poolId.toString());
		var contractTotalQuantityAfter = await aopool.contractTotalQuantity();
		var poolTotalWithdrawnAfter = await aopool.poolTotalWithdrawn(poolId.toString());
		var contractTotalWithdrawnAfter = await aopool.contractTotalWithdrawn();
		var totalPutOnSaleAfter = await aopool.totalPutOnSale(account);
		var accountNetworkBalanceAfter = await aoion.balanceOf(account);
		var poolNetworkBalanceAfter = await aoion.balanceOf(aopool.address);

		assert.equal(lotAfter[5].toString(), lotBefore[5].toString(), "Lot has incorrect poolSellLotSnapshot");
		assert.equal(
			lotAfter[6].toString(),
			lotBefore[6].sub(new BN(quantity).mul(new BN(price))).toString(),
			"Lot has incorrect lotValueInCounterAsset"
		);
		assert.equal(lotAfter[8].toString(), lotBefore[8].add(new BN(quantity)).toString(), "Lot has incorrect ionWithdrawn");

		assert.equal(
			poolTotalQuantityAfter.toString(),
			poolTotalQuantityBefore.sub(new BN(quantity)).toString(),
			"Pool has incorrect total quantity"
		);
		assert.equal(
			contractTotalQuantityAfter.toString(),
			contractTotalQuantityBefore.sub(new BN(quantity)).toString(),
			"Contract has incorrect total quantity"
		);
		assert.equal(
			poolTotalWithdrawnAfter.toString(),
			poolTotalWithdrawnBefore.add(new BN(quantity)).toString(),
			"Pool has incorrect total withdrawn"
		);
		assert.equal(
			contractTotalWithdrawnAfter.toString(),
			contractTotalWithdrawnBefore.add(new BN(quantity)).toString(),
			"Contract has incorrect total withdrawn"
		);
		assert.equal(
			totalPutOnSaleAfter.toString(),
			totalPutOnSaleBefore.sub(new BN(quantity)).toString(),
			"Account has incorrect total put on sale"
		);
		assert.equal(
			accountNetworkBalanceAfter.toString(),
			accountNetworkBalanceBefore.add(new BN(quantity)).toString(),
			"Account has incorrect network ion balance"
		);
		assert.equal(
			poolNetworkBalanceAfter.toString(),
			poolNetworkBalanceBefore.sub(new BN(quantity)).toString(),
			"Pool has incorrect network ion balance"
		);
	};

	it("The AO - transferOwnership() - should be able to transfer ownership to a TAO", async function() {
		var canTransferOwnership;
		try {
			await aopool.transferOwnership(taoId, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await aopool.transferOwnership(taoId, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await aopool.theAO();
		assert.equal(newTheAO, taoId, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - setWhitelist() should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await aopool.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await aopool.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await aopool.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
	});

	it("The AO - setAOIonAddress() should be able to set AOIon address", async function() {
		var canSetAddress;
		try {
			await aopool.setAOIonAddress(aoion.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOIon address");

		try {
			await aopool.setAOIonAddress(aoion.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOIon address");

		var aoIonAddress = await aopool.aoIonAddress();
		assert.equal(aoIonAddress, aoion.address, "Contract has incorrect aoIonAddress");
	});

	it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await aopool.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await aopool.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await aopool.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("The AO - transferERC20() should be able to transfer ERC20 to an address", async function() {
		await tokenone.transfer(aopool.address, 100, { from: theAO });

		var accountBalanceBefore = await tokenone.balanceOf(account1);
		var aopoolBalanceBefore = await tokenone.balanceOf(aopool.address);

		var canTransfer;
		try {
			await aopool.transferERC20(tokenone.address, account1, 10, { from: someAddress });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Non-AO can transfer ERC20 token from aopool");

		try {
			await aopool.transferERC20(tokenone.address, account1, 1000, { from: account1 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "The AO can transfer ERC20 token more than owned balance");

		try {
			await aopool.transferERC20(tokenone.address, account1, 100, { from: account1 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, true, "The AO can't transfer ERC20 token from aopool to another recipient");

		var accountBalanceAfter = await tokenone.balanceOf(account1);
		var aopoolBalanceAfter = await tokenone.balanceOf(aopool.address);

		assert.equal(
			accountBalanceAfter.toNumber(),
			accountBalanceBefore.add(new BN(100)).toNumber(),
			"Account has incorrect ERC20 balance"
		);
		assert.equal(aopoolBalanceAfter.toNumber(), aopoolBalanceBefore.sub(new BN(100)).toNumber(), "aopool has incorrect ERC20 balance");
	});

	it("createPool() - only The AO can create Pool", async function() {
		var price = 10000;
		var status = true;
		var sellCapStatus = true;
		var sellCapAmount = 100;
		var quantityCapStatus = true;
		var quantityCapAmount = 50;
		var erc20CounterAsset = true;
		var erc20TokenAddress = aoion.address;
		var erc20TokenMultiplier = 1;
		var canCreatePool, createPoolEvent;
		try {
			var result = await aopool.createPool(
				price,
				status,
				sellCapStatus,
				sellCapAmount,
				quantityCapStatus,
				quantityCapAmount,
				erc20CounterAsset,
				erc20TokenAddress,
				erc20TokenMultiplier,
				{ from: someAddress }
			);
			createPoolEvent = result.logs[0];
			poolId1 = createPoolEvent.args.poolId;
			canCreatePool = true;
		} catch (e) {
			createPoolEvent = null;
			poolId1 = null;
			canCreatePool = false;
		}
		assert.notEqual(canCreatePool, true, "Non-The AO account can create Pool");

		try {
			var result = await aopool.createPool(
				0,
				status,
				sellCapStatus,
				sellCapAmount,
				quantityCapStatus,
				quantityCapAmount,
				erc20CounterAsset,
				erc20TokenAddress,
				erc20TokenMultiplier,
				{ from: account1 }
			);
			createPoolEvent = result.logs[0];
			poolId1 = createPoolEvent.args.poolId;
			canCreatePool = true;
		} catch (e) {
			createPoolEvent = null;
			poolId1 = null;
			canCreatePool = false;
		}
		assert.notEqual(canCreatePool, true, "The AO can create Pool with 0 price");

		try {
			var result = await aopool.createPool(
				price,
				status,
				sellCapStatus,
				0,
				quantityCapStatus,
				quantityCapAmount,
				erc20CounterAsset,
				erc20TokenAddress,
				erc20TokenMultiplier,
				{ from: account1 }
			);
			createPoolEvent = result.logs[0];
			poolId1 = createPoolEvent.args.poolId;
			canCreatePool = true;
		} catch (e) {
			createPoolEvent = null;
			poolId1 = null;
			canCreatePool = false;
		}
		assert.notEqual(canCreatePool, true, "The AO can create Pool with sell cap enabled but 0 sell cap amount");

		try {
			var result = await aopool.createPool(
				price,
				status,
				sellCapStatus,
				sellCapAmount,
				quantityCapStatus,
				0,
				erc20CounterAsset,
				erc20TokenAddress,
				erc20TokenMultiplier,
				{ from: account1 }
			);
			createPoolEvent = result.logs[0];
			poolId1 = createPoolEvent.args.poolId;
			canCreatePool = true;
		} catch (e) {
			createPoolEvent = null;
			poolId1 = null;
			canCreatePool = false;
		}
		assert.notEqual(canCreatePool, true, "The AO can create Pool with quantity cap enabled but 0 quantity cap amount");

		try {
			var result = await aopool.createPool(
				price,
				status,
				sellCapStatus,
				sellCapAmount,
				quantityCapStatus,
				quantityCapAmount,
				erc20CounterAsset,
				"0x6635f83421bf059cd8111f180f0727128685bae4",
				erc20TokenMultiplier,
				{ from: account1 }
			);
			createPoolEvent = result.logs[0];
			poolId1 = createPoolEvent.args.poolId;
			canCreatePool = true;
		} catch (e) {
			createPoolEvent = null;
			poolId1 = null;
			canCreatePool = false;
		}
		assert.notEqual(canCreatePool, true, "The AO can create Pool that is priced in ERC20 compatible token but no ERC20 Token address");

		try {
			var result = await aopool.createPool(
				price,
				status,
				sellCapStatus,
				sellCapAmount,
				quantityCapStatus,
				quantityCapAmount,
				erc20CounterAsset,
				erc20TokenAddress,
				0,
				{ from: account1 }
			);
			createPoolEvent = result.logs[0];
			poolId1 = createPoolEvent.args.poolId;
			canCreatePool = true;
		} catch (e) {
			createPoolEvent = null;
			poolId1 = null;
			canCreatePool = false;
		}
		assert.notEqual(
			canCreatePool,
			true,
			"The AO can create Pool that is priced in ERC20 compatible token but no ERC20 Token multiplier"
		);

		// pool active
		// has sell cap
		// has quantity cap
		// is erc20
		poolId1 = await createPool(
			price,
			status,
			sellCapStatus,
			sellCapAmount,
			quantityCapStatus,
			quantityCapAmount,
			erc20CounterAsset,
			erc20TokenAddress,
			erc20TokenMultiplier,
			account1
		);

		// pool inactive
		// has sell cap
		// has quantity cap
		// is erc20
		poolId2 = await createPool(
			price,
			false,
			sellCapStatus,
			sellCapAmount,
			quantityCapStatus,
			quantityCapAmount,
			erc20CounterAsset,
			erc20TokenAddress,
			erc20TokenMultiplier,
			account1
		);

		// pool active
		// no sell cap
		// has quantity cap
		// is erc20
		poolId3 = await createPool(
			price,
			status,
			false,
			sellCapAmount,
			quantityCapStatus,
			quantityCapAmount,
			erc20CounterAsset,
			erc20TokenAddress,
			erc20TokenMultiplier,
			account1
		);

		// pool active
		// has sell cap
		// no quantity cap
		// is erc20
		poolId4 = await createPool(
			price,
			status,
			true,
			sellCapAmount,
			false,
			quantityCapAmount,
			erc20CounterAsset,
			erc20TokenAddress,
			erc20TokenMultiplier,
			account1
		);

		// pool active
		// no sell cap
		// no quantity cap
		// is erc20
		poolId5 = await createPool(
			price,
			status,
			false,
			sellCapAmount,
			false,
			quantityCapAmount,
			erc20CounterAsset,
			erc20TokenAddress,
			erc20TokenMultiplier,
			account1
		);

		// pool active
		// no sell cap
		// no quantity cap
		// is ethereum
		poolId6 = await createPool(price, status, false, sellCapAmount, false, quantityCapAmount, false, emptyAddress, 0, account1);

		// pool active
		// has sell cap
		// no quantity cap
		// is ethereum
		poolId7 = await createPool(price, status, true, sellCapAmount, false, quantityCapAmount, false, emptyAddress, 0, account1);

		// pool active
		// no sell cap
		// has quantity cap
		// is ethereum
		poolId8 = await createPool(price, status, false, sellCapAmount, true, quantityCapAmount, false, emptyAddress, 0, account1);

		// pool active
		// has sell cap
		// has quantity cap
		// is ethereum
		poolId9 = await createPool(price, status, true, sellCapAmount, true, quantityCapAmount, false, emptyAddress, 0, account1);
	});

	it("updatePoolStatus() - only Pool's admin can start/stop a Pool", async function() {
		var canUpdatePoolStatus;
		try {
			var result = await aopool.updatePoolStatus(poolId1.toString(), true, { from: someAddress });
			canUpdatePoolStatus = true;
		} catch (e) {
			canUpdatePoolStatus = false;
		}
		assert.notEqual(canUpdatePoolStatus, true, "Non-Pool's admin can start/stop the Pool");

		try {
			var result = await aopool.updatePoolStatus(0, true, { from: account1 });
			canUpdatePoolStatus = true;
		} catch (e) {
			canUpdatePoolStatus = false;
		}
		assert.notEqual(canUpdatePoolStatus, true, "The AO can start/stop non-existing Pool");

		try {
			var result = await aopool.updatePoolStatus(poolId1.toString(), true, { from: account1 });
			canUpdatePoolStatus = true;
		} catch (e) {
			canUpdatePoolStatus = false;
		}
		assert.equal(canUpdatePoolStatus, true, "The AO can't start/stop Pool");
		var pool = await aopool.pools(poolId1.toString());
		assert.equal(pool[1], true, "Pool has incorrect status after update");

		try {
			var result = await aopool.updatePoolStatus(poolId1.toString(), false, { from: account1 });
			canUpdatePoolStatus = true;
		} catch (e) {
			canUpdatePoolStatus = false;
		}
		assert.equal(canUpdatePoolStatus, true, "Pool's admin can't start/stop Pool");
		var pool = await aopool.pools(poolId1.toString());
		assert.equal(pool[1], false, "Pool has incorrect status after update");

		// Start the pool again
		await aopool.updatePoolStatus(poolId1.toString(), true, { from: account1 });
	});

	it("changeAdminAddress() - only Pool's admin can change admin address", async function() {
		var canChangeAdminAddress;
		try {
			var result = await aopool.changeAdminAddress(poolId1.toString(), account1, { from: someAddress });
			canChangeAdminAddress = true;
		} catch (e) {
			canChangeAdminAddress = false;
		}
		assert.notEqual(canChangeAdminAddress, true, "Non-Pool's admin can change admin address");

		try {
			var result = await aopool.changeAdminAddress(0, account1, { from: account1 });
			canChangeAdminAddress = true;
		} catch (e) {
			canChangeAdminAddress = false;
		}
		assert.notEqual(canChangeAdminAddress, true, "The AO can change admin address on non-existing Pool");

		try {
			var result = await aopool.changeAdminAddress(poolId1.toString(), account2, { from: account1 });
			canChangeAdminAddress = true;
		} catch (e) {
			canChangeAdminAddress = false;
		}
		assert.equal(canChangeAdminAddress, true, "The AO can't change admin address");
		var pool = await aopool.pools(poolId1.toString());
		assert.equal(pool[9], account2, "Pool has incorrect admin address after update");

		try {
			var result = await aopool.changeAdminAddress(poolId1.toString(), account1, { from: account2 });
			canChangeAdminAddress = true;
		} catch (e) {
			canChangeAdminAddress = false;
		}
		assert.equal(canChangeAdminAddress, true, "Pool's admin can't change admin address");
		var pool = await aopool.pools(poolId1.toString());
		assert.equal(pool[9], account1, "Pool has incorrect admin address after update");
	});

	it("sell() - should be able to sell AO ions in a Pool", async function() {
		var canSell, lotCreationEvent;
		try {
			var result = await aopool.sell(100, 10, 10000, { from: account1 });
			lotCreationEvent = result.logs[0];
			canSell = true;
		} catch (e) {
			lotCreationEvent = null;
			canSell = false;
		}
		assert.equal(canSell, false, "Account can sell AO on non-existing Pool");

		try {
			var result = await aopool.sell(poolId1.toString(), 10, 10000, { from: accountNoBalance });
			lotCreationEvent = result.logs[0];
			canSell = true;
		} catch (e) {
			lotCreationEvent = null;
			canSell = false;
		}
		assert.equal(canSell, false, "Account with no ion balance can sell AO on a Pool");

		try {
			var result = await aopool.sell(poolId1.toString(), 10, 1000, { from: account1 });
			lotCreationEvent = result.logs[0];
			canSell = true;
		} catch (e) {
			lotCreationEvent = null;
			canSell = false;
		}
		assert.equal(canSell, false, "Account can sell AO on a Pool even though entered price doesn't match Pool's price");

		// Stop the pool
		await aopool.updatePoolStatus(poolId1.toString(), false, { from: account1 });

		try {
			var result = await aopool.sell(poolId1.toString(), 10, 10000, { from: account1 });
			lotCreationEvent = result.logs[0];
			canSell = true;
		} catch (e) {
			lotCreationEvent = null;
			canSell = false;
		}
		assert.equal(canSell, false, "Account can sell AO on a Pool even though Pool is currently stopped (status = 0)");

		// Start the pool
		await aopool.updatePoolStatus(poolId1.toString(), true, { from: account1 });

		await sell(poolId1.toString(), 10, 10000, account1, account1Lots);
		await sell(poolId3.toString(), 10, 10000, account1, account1Lots);
		await sell(poolId4.toString(), 10, 10000, account1, account1Lots);
		await sell(poolId5.toString(), 10, 10000, account1, account1Lots);
		await sell(poolId7.toString(), 10, 10000, account1, account1Lots);
		await sell(poolId8.toString(), 10, 10000, account1, account1Lots);
		await sell(poolId9.toString(), 10, 10000, account1, account1Lots);

		// Test sell cap
		try {
			var result = await aopool.sell(poolId7.toString(), 100, 10000, { from: account1 });
			lotCreationEvent = result.logs[0];
			canSell = true;
		} catch (e) {
			lotCreationEvent = null;
			canSell = false;
		}
		assert.equal(canSell, false, "Account can buy more than the Pool's sell cap");

		// Test quantity cap
		try {
			var result = await aopool.sell(poolId8.toString(), 100, 10000, { from: account1 });
			lotCreationEvent = result.logs[0];
			canSell = true;
		} catch (e) {
			lotCreationEvent = null;
			canSell = false;
		}
		assert.equal(canSell, false, "Account can buy more than the Pool's quantity cap");

		// Test sell and quantity cap
		try {
			var result = await aopool.sell(poolId9.toString(), 100, 10000, { from: account1 });
			lotCreationEvent = result.logs[0];
			canSell = true;
		} catch (e) {
			lotCreationEvent = null;
			canSell = false;
		}
		assert.equal(canSell, false, "Account can buy more than the Pool's sell/quantity cap");

		// Majority of the test will be on poolId6
		// Since it's the Pool that is priced in Eth with no cap
		lotId1 = await sell(poolId6.toString(), 10, 10000, account1, account1Lots);
		lotId2 = await sell(poolId6.toString(), 25, 10000, account2, account2Lots);
		lotId3 = await sell(poolId6.toString(), 100, 10000, account3, account3Lots);
		lotId4 = await sell(poolId6.toString(), 73, 10000, account4, account4Lots);
		lotId5 = await sell(poolId6.toString(), 28, 10000, account5, account5Lots);
		lotId6 = await sell(poolId6.toString(), 3, 10000, account1, account1Lots);
		lotId7 = await sell(poolId6.toString(), 40, 10000, account2, account2Lots);
		lotId8 = await sell(poolId6.toString(), 20, 10000, account3, account3Lots);
	});

	it("ownerTotalLot() - should return the correct total Lots of an account", async function() {
		var account1TotalLot = await aopool.ownerTotalLot(account1);
		assert.equal(account1TotalLot.toString(), account1Lots.length, "ownerTotalLot returns incorrect total Lots");

		var account2TotalLot = await aopool.ownerTotalLot(account2);
		assert.equal(account2TotalLot.toString(), account2Lots.length, "ownerTotalLot returns incorrect total Lots");

		var account3TotalLot = await aopool.ownerTotalLot(account3);
		assert.equal(account3TotalLot.toString(), account3Lots.length, "ownerTotalLot returns incorrect total Lots");

		var account4TotalLot = await aopool.ownerTotalLot(account4);
		assert.equal(account4TotalLot.toString(), account4Lots.length, "ownerTotalLot returns incorrect total Lots");

		var account5TotalLot = await aopool.ownerTotalLot(account5);
		assert.equal(account5TotalLot.toString(), account5Lots.length, "ownerTotalLot returns incorrect total Lots");
	});

	it("ownerLotIds() - should return all the Lot IDs of an account", async function() {
		var account1TotalLot = await aopool.ownerTotalLot(account1);
		var lots = await aopool.ownerLotIds(account1, 0, account1TotalLot.sub(new BN(1)).toString());
		var isEqual =
			lots.length === account1Lots.length &&
			lots.every(function(value, index) {
				return value === account1Lots[index];
			});
		assert.equal(isEqual, true, "ownerLotIds() return incorrect Lot IDs");

		var account2TotalLot = await aopool.ownerTotalLot(account2);
		var lots = await aopool.ownerLotIds(account2, 0, account2TotalLot.sub(new BN(1)).toString());
		var isEqual =
			lots.length === account2Lots.length &&
			lots.every(function(value, index) {
				return value === account2Lots[index];
			});
		assert.equal(isEqual, true, "ownerLotIds() return incorrect Lot IDs");

		var account3TotalLot = await aopool.ownerTotalLot(account3);
		var lots = await aopool.ownerLotIds(account3, 0, account3TotalLot.sub(new BN(1)).toString());
		var isEqual =
			lots.length === account3Lots.length &&
			lots.every(function(value, index) {
				return value === account3Lots[index];
			});
		assert.equal(isEqual, true, "ownerLotIds() return incorrect Lot IDs");

		var account4TotalLot = await aopool.ownerTotalLot(account4);
		var lots = await aopool.ownerLotIds(account4, 0, account4TotalLot.sub(new BN(1)).toString());
		var isEqual =
			lots.length === account4Lots.length &&
			lots.every(function(value, index) {
				return value === account4Lots[index];
			});
		assert.equal(isEqual, true, "ownerLotIds() return incorrect Lot IDs");

		var account5TotalLot = await aopool.ownerTotalLot(account5);
		var lots = await aopool.ownerLotIds(account5, 0, account5TotalLot.sub(new BN(1)).toString());
		var isEqual =
			lots.length === account5Lots.length &&
			lots.every(function(value, index) {
				return value === account5Lots[index];
			});
		assert.equal(isEqual, true, "ownerLotIds() return incorrect Lot IDs");
	});

	it("buyWithEth() - should buy ion from Pool with Eth", async function() {
		var canBuy, buyWithEthEvent;
		try {
			var result = await aopool.buyWithEth(100, 15, 10000, { from: account1, value: 15 * 10000 });
			buyWithEthEvent = result.logs[0];
			canBuy = true;
		} catch (e) {
			buyWithEthEvent = false;
			canBuy = false;
		}
		assert.equal(canBuy, false, "Account can buy ion from non-existing Pool");

		var poolTotalQuantity = await aopool.poolTotalQuantity(poolId6.toString());
		try {
			var result = await aopool.buyWithEth(poolId6.toString(), poolTotalQuantity.add(new BN(1)).toString(), 10000, {
				from: account1,
				value: poolTotalQuantity
					.add(new BN(1))
					.mul(new BN(10000))
					.toString()
			});
			buyWithEthEvent = result.logs[0];
			canBuy = true;
		} catch (e) {
			buyWithEthEvent = false;
			canBuy = false;
		}
		assert.equal(canBuy, false, "Account can buy ion more than Pool's total quantity");

		try {
			var result = await aopool.buyWithEth(poolId6.toString(), 15, 1000, { from: account1, value: 15 * 1000 });
			buyWithEthEvent = result.logs[0];
			canBuy = true;
		} catch (e) {
			buyWithEthEvent = false;
			canBuy = false;
		}
		assert.equal(canBuy, false, "Account can buy ion from Pool even though entered price doesn't match Pool's price");

		try {
			var result = await aopool.buyWithEth(poolId6.toString(), 15, 10000, { from: account1, value: 15 * 1000 });
			buyWithEthEvent = result.logs[0];
			canBuy = true;
		} catch (e) {
			buyWithEthEvent = false;
			canBuy = false;
		}
		assert.equal(canBuy, false, "Account can buy ion from Pool even though sent Eth is not the exact total price for the transaction");

		try {
			var result = await aopool.buyWithEth(poolId1.toString(), 5, 10000, { from: account1, value: 5 * 10000 });
			buyWithEthEvent = result.logs[0];
			canBuy = true;
		} catch (e) {
			buyWithEthEvent = false;
			canBuy = false;
		}
		assert.equal(canBuy, false, "Account can buy ion with Eth from Pool that is not priced in Eth");

		// Stop the pool
		await aopool.updatePoolStatus(poolId6.toString(), false, { from: account1 });

		try {
			var result = await aopool.buyWithEth(poolId6.toString(), 15, 10000, { from: account1, value: 15 * 10000 });
			buyWithEthEvent = result.logs[0];
			canBuy = true;
		} catch (e) {
			buyWithEthEvent = false;
			canBuy = false;
		}
		assert.equal(canBuy, false, "Account can buy ion from Pool even though Pool is currently inactive");

		// Start the pool
		await aopool.updatePoolStatus(poolId6.toString(), true, { from: account1 });

		await buyWithEth(poolId6.toString(), 15, 10000, buyer1);
	});

	it("lotEthAvailableToWithdraw() - should return the amount of ion sold, ethereum available to withdraw, and current ethereum withdrawn from the Lot that is priced in Eth", async function() {
		// lotId1 has 10 lotQuantity
		// buyer1 bought 15 ions
		// lotId1 is sold entirely
		var availableToWithdraw = await aopool.lotEthAvailableToWithdraw(lotId1);
		assert.equal(availableToWithdraw[0].toString(), 10, "lotEthAvailableToWithdraw() returns incorrect sold quantity");
		assert.equal(
			availableToWithdraw[1].toString(),
			10 * 10000,
			"lotEthAvailableToWithdraw() returns incorrect ETH available to withdraw"
		);
		assert.equal(availableToWithdraw[2].toString(), 0, "lotEthAvailableToWithdraw() returns incorrect current ETH withdrawn from Lot");

		// lotId2 has 25 lotQuantity
		// buyer1 bought 15 ions
		// lotId2 is sold partially
		var availableToWithdraw = await aopool.lotEthAvailableToWithdraw(lotId2);
		assert.equal(availableToWithdraw[0].toString(), 5, "lotEthAvailableToWithdraw() returns incorrect sold quantity");
		assert.equal(
			availableToWithdraw[1].toString(),
			5 * 10000,
			"lotEthAvailableToWithdraw() returns incorrect ETH available to withdraw"
		);
		assert.equal(availableToWithdraw[2].toString(), 0, "lotEthAvailableToWithdraw() returns incorrect current ETH withdrawn from Lot");
	});

	it("withdrawEth() - should withdraw ethereum from sold Lot", async function() {
		var canWithdrawEth, withdrawEthEvent;
		try {
			var result = await aopool.withdrawEth("someid", { from: account1 });
			withdrawEthEvent = result.logs[0];
			canWithdrawEth = true;
		} catch (e) {
			withdrawEthEvent = null;
			canWithdrawEth = false;
		}
		assert.equal(canWithdrawEth, false, "Account can withdraw Eth from non-existing Lot");

		try {
			var result = await aopool.withdrawEth(lotId1, { from: account2 });
			withdrawEthEvent = result.logs[0];
			canWithdrawEth = true;
		} catch (e) {
			withdrawEthEvent = null;
			canWithdrawEth = false;
		}
		assert.equal(canWithdrawEth, false, "Non-Lot owner can withdraw Eth from Lot");

		try {
			var result = await aopool.withdrawEth(lotId3, { from: account3 });
			withdrawEthEvent = result.logs[0];
			canWithdrawEth = true;
		} catch (e) {
			withdrawEthEvent = null;
			canWithdrawEth = false;
		}
		assert.equal(canWithdrawEth, false, "Account can withdraw Eth from Lot that is not yet sold");

		await withdrawEth(lotId1, account1);
		await withdrawEth(lotId2, account2);
	});

	it("withdrawIon() - should able to withdraw ion from Lot", async function() {
		var canWithdrawIon, withdrawIonEvent;
		try {
			var result = await aopool.withdrawIon("someid", 10, { from: account1 });
			withdrawIonEvent = result.logs[0];
			canWithdrawIon = true;
		} catch (e) {
			withdrawIonEvent = null;
			canWithdrawIon = false;
		}
		assert.equal(canWithdrawIon, false, "Account can withdraw ion from non-existing Lot");

		try {
			var result = await aopool.withdrawIon(lotId1, 10, { from: account1 });
			withdrawIonEvent = result.logs[0];
			canWithdrawIon = true;
		} catch (e) {
			withdrawIonEvent = null;
			canWithdrawIon = false;
		}
		assert.equal(canWithdrawIon, false, "Account can withdraw ion from Lot that has been sold entirely");

		try {
			var result = await aopool.withdrawIon(lotId2, 5, { from: account1 });
			withdrawIonEvent = result.logs[0];
			canWithdrawIon = true;
		} catch (e) {
			withdrawIonEvent = null;
			canWithdrawIon = false;
		}
		assert.equal(canWithdrawIon, false, "Non-Lot owner can withdraw ion from Lot");

		try {
			var result = await aopool.withdrawIon(lotId2, 21, { from: account1 });
			withdrawIonEvent = result.logs[0];
			canWithdrawIon = true;
		} catch (e) {
			withdrawIonEvent = null;
			canWithdrawIon = false;
		}
		assert.equal(canWithdrawIon, false, "Account can withdraw ion more than Lot's available amount");

		await withdrawIon(lotId2, 5, account2);
		await withdrawIon(lotId4, 20, account4);
		await withdrawIon(lotId5, 4, account5);
		await withdrawIon(lotId6, 3, account1);
	});

	it("totalIonWithdrawnBeforeLot() - should return correct total ion withdrawn from all Lots before certain Lot ID", async function() {
		var totalIonWithdrawn = await aopool.totalIonWithdrawnBeforeLot(lotId1);
		assert.equal(totalIonWithdrawn.toString(), 0, "totalIonWithdrawnBeforeLot() return incorrect total ion withdrawn");

		var totalIonWithdrawn = await aopool.totalIonWithdrawnBeforeLot(lotId2);
		assert.equal(totalIonWithdrawn.toString(), 0, "totalIonWithdrawnBeforeLot() return incorrect total ion withdrawn");

		var totalIonWithdrawn = await aopool.totalIonWithdrawnBeforeLot(lotId3);
		assert.equal(totalIonWithdrawn.toString(), 5, "totalIonWithdrawnBeforeLot() return incorrect total ion withdrawn");

		var totalIonWithdrawn = await aopool.totalIonWithdrawnBeforeLot(lotId4);
		assert.equal(totalIonWithdrawn.toString(), 5, "totalIonWithdrawnBeforeLot() return incorrect total ion withdrawn");

		var totalIonWithdrawn = await aopool.totalIonWithdrawnBeforeLot(lotId5);
		assert.equal(totalIonWithdrawn.toString(), 25, "totalIonWithdrawnBeforeLot() return incorrect total ion withdrawn");

		var totalIonWithdrawn = await aopool.totalIonWithdrawnBeforeLot(lotId6);
		assert.equal(totalIonWithdrawn.toString(), 29, "totalIonWithdrawnBeforeLot() return incorrect total ion withdrawn");

		var totalIonWithdrawn = await aopool.totalIonWithdrawnBeforeLot(lotId7);
		assert.equal(totalIonWithdrawn.toString(), 32, "totalIonWithdrawnBeforeLot() return incorrect total ion withdrawn");

		var totalIonWithdrawn = await aopool.totalIonWithdrawnBeforeLot(lotId8);
		assert.equal(totalIonWithdrawn.toString(), 32, "totalIonWithdrawnBeforeLot() return incorrect total ion withdrawn");
	});

	it("should be able to buy ion and reward the lot accordingly after some accounts withdraw ions from their lots", async function() {
		// Should buy 15 ions from lotId2 and 5 ions from lotId3
		await buyWithEth(poolId6.toString(), 20, 10000, buyer2);
		var lotId2AvailableToWithdraw = await aopool.lotEthAvailableToWithdraw(lotId2);
		assert.equal(lotId2AvailableToWithdraw[0].toString(), 15, "lotEthAvailableToWithdraw() returns incorrect sold quantity");
		await withdrawEth(lotId2, account2);

		var lot = await aopool.lots(lotId2);
		var pool = await aopool.pools(lot[3].toString());
		var price = pool[0];

		assert.equal(lot[6].toString(), 0, "Lot has incorrect lotValueInCounterAsset");
		assert.equal(
			lot[7].toString(),
			lot[2].mul(new BN(price)).sub(lot[8].mul(new BN(price))),
			"Lot has incorrect counterAssetWithdrawn"
		);
		assert.equal(lot[8].toString(), 5, "Lot has incorrect ionWithdrawn");

		var lotId3AvailableToWithdraw = await aopool.lotEthAvailableToWithdraw(lotId3);
		assert.equal(lotId3AvailableToWithdraw[0].toString(), 5, "lotEthAvailableToWithdraw() returns incorrect sold quantity");

		await withdrawEth(lotId3, account3);
		var lot = await aopool.lots(lotId3);
		var pool = await aopool.pools(lot[3].toString());
		var price = pool[0];

		assert.equal(
			lot[7].toString(),
			new BN(5).mul(new BN(price)).sub(lot[8].mul(new BN(price))),
			"Lot has incorrect counterAssetWithdrawn"
		);

		// Should buy 95 ions from lotId3
		// Should buy 53 ions from lotId4
		// Should buy 24 ions from lotId5
		// Should buy 28 ions from lotId7
		await buyWithEth(poolId6.toString(), 200, 10000, buyer3);

		var lotId3AvailableToWithdraw = await aopool.lotEthAvailableToWithdraw(lotId3);
		assert.equal(lotId3AvailableToWithdraw[0].toString(), 95, "lotEthAvailableToWithdraw() returns incorrect sold quantity");
		await withdrawEth(lotId3, account3);

		var lot = await aopool.lots(lotId3);
		var pool = await aopool.pools(lot[3].toString());
		var price = pool[0];

		assert.equal(lot[6].toString(), 0, "Lot has incorrect lotValueInCounterAsset");
		assert.equal(
			lot[7].toString(),
			lot[2].mul(new BN(price)).sub(lot[8].mul(new BN(price))),
			"Lot has incorrect counterAssetWithdrawn"
		);
		assert.equal(lot[8].toString(), 0, "Lot has incorrect ionWithdrawn");

		var lotId4AvailableToWithdraw = await aopool.lotEthAvailableToWithdraw(lotId4);
		assert.equal(lotId4AvailableToWithdraw[0].toString(), 53, "lotEthAvailableToWithdraw() returns incorrect sold quantity");
		await withdrawEth(lotId4, account4);

		var lot = await aopool.lots(lotId4);
		var pool = await aopool.pools(lot[3].toString());
		var price = pool[0];

		assert.equal(lot[6].toString(), 0, "Lot has incorrect lotValueInCounterAsset");
		assert.equal(
			lot[7].toString(),
			lot[2].mul(new BN(price)).sub(lot[8].mul(new BN(price))),
			"Lot has incorrect counterAssetWithdrawn"
		);
		assert.equal(lot[8].toString(), 20, "Lot has incorrect ionWithdrawn");

		var lotId5AvailableToWithdraw = await aopool.lotEthAvailableToWithdraw(lotId5);
		assert.equal(lotId5AvailableToWithdraw[0].toString(), 24, "lotEthAvailableToWithdraw() returns incorrect sold quantity");
		await withdrawEth(lotId5, account5);

		var lot = await aopool.lots(lotId5);
		var pool = await aopool.pools(lot[3].toString());
		var price = pool[0];

		assert.equal(lot[6].toString(), 0, "Lot has incorrect lotValueInCounterAsset");
		assert.equal(
			lot[7].toString(),
			lot[2].mul(new BN(price)).sub(lot[8].mul(new BN(price))),
			"Lot has incorrect counterAssetWithdrawn"
		);
		assert.equal(lot[8].toString(), 4, "Lot has incorrect ionWithdrawn");

		var lotId7AvailableToWithdraw = await aopool.lotEthAvailableToWithdraw(lotId7);
		assert.equal(lotId7AvailableToWithdraw[0].toString(), 28, "lotEthAvailableToWithdraw() returns incorrect sold quantity");

		await withdrawEth(lotId7, account2);
		var lot = await aopool.lots(lotId7);
		var pool = await aopool.pools(lot[3].toString());
		var price = pool[0];

		assert.equal(
			lot[7].toString(),
			new BN(28).mul(new BN(price)).sub(lot[8].mul(new BN(price))),
			"Lot has incorrect counterAssetWithdrawn"
		);
	});

	it("stress testing to calculate gas cost for withdrawing Eth on last Lot especially when there is ion withdrawn from the Lots before the last Lot", async function() {
		var poolId = await createPool(1000, true, false, 0, false, 0, false, emptyAddress, 0, account1);
		var pool = await aopool.pools(poolId.toString());

		var lots = [];
		var totalLot = 432; // random big amount for testing
		for (var i = 1; i <= totalLot; i++) {
			console.log("Creating Lot " + i + " out of " + totalLot);
			lotId = await sell(poolId.toString(), 10, 1000, account1, account1Lots);
			lots.push(lotId);
			// Every "even" lot, withdraw 5 ions
			if (i % 2 == 0) {
				await withdrawIon(lotId, 5, account1);
			}
		}
		var poolTotalQuantity = await aopool.poolTotalQuantity(poolId.toString());
		await buyWithEth(poolId.toString(), poolTotalQuantity.toString(), 1000, buyer1);
		await withdrawEth(lots[lots.length - 1], account1);
	}).timeout(24 * 60 * 60 * 1000);
});
