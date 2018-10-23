var AOPool = artifacts.require("./AOPool.sol");
var AOToken = artifacts.require("./AOToken.sol");
var BigNumber = require("bignumber.js");
BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: 1, EXPONENTIAL_AT: [-10, 40] }); // no rounding

contract("AOPool", function(accounts) {
	var aopool,
		aotoken,
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
	var developer = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var account4 = accounts[4];
	var account5 = accounts[5];
	var buyer1 = accounts[6];
	var buyer2 = accounts[7];
	var buyer3 = accounts[8];

	var accountNoBalance = accounts[9];
	var emptyAddress = "0x0000000000000000000000000000000000000000";

	before(async function() {
		aopool = await AOPool.deployed();
		aotoken = await AOToken.deployed();

		await aotoken.mintToken(account1, 1000000, { from: developer });
		await aotoken.mintToken(account2, 1000000, { from: developer });
		await aotoken.mintToken(account3, 1000000, { from: developer });
		await aotoken.mintToken(account4, 1000000, { from: developer });
		await aotoken.mintToken(account5, 1000000, { from: developer });
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
		assert.equal(canCreatePool, true, "Developer can't create Pool");

		var totalPoolAfter = await aopool.totalPool();
		assert.equal(totalPoolAfter.toString(), totalPoolBefore.plus(1).toString(), "Contract has incorrect totalPool value");

		assert.equal(poolId.toString(), totalPoolAfter.toString(), "CreatePool event has incorrect poolId");

		var pool = await aopool.pools(poolId.toString());
		assert.equal(pool[0].toString(), new BigNumber(price).toString(), "Pool has incorrect price");
		assert.equal(pool[1], status, "Pool has incorrect status");
		assert.equal(pool[2], sellCapStatus, "Pool has incorrect sellCapStatus");
		if (sellCapStatus) {
			assert.equal(pool[3].toString(), new BigNumber(sellCapAmount).toString(), "Pool has incorrect sellCapAmount");
		} else {
			assert.equal(pool[3].toString(), new BigNumber(0).toString(), "Pool has incorrect sellCapAmount");
		}
		assert.equal(pool[4], quantityCapStatus, "Pool has incorrect quantityCapStatus");
		if (quantityCapStatus) {
			assert.equal(pool[5].toString(), new BigNumber(quantityCapAmount).toString(), "Pool has incorrect quantityCapAmount");
		} else {
			assert.equal(pool[5].toString(), new BigNumber(0).toString(), "Pool has incorrect quantityCapAmount");
		}
		assert.equal(pool[6], erc20CounterAsset, "Pool has incorrect erc20CounterAsset");
		if (erc20CounterAsset) {
			assert.equal(pool[7], erc20TokenAddress, "Pool has incorrect erc20TokenAddress");
			assert.equal(pool[8].toString(), new BigNumber(erc20TokenMultiplier).toString(), "Pool has incorrect erc20TokenMultiplier");
		} else {
			assert.equal(pool[7], emptyAddress, "Pool has incorrect erc20TokenAddress");
			assert.equal(pool[8].toString(), new BigNumber(0).toString(), "Pool has incorrect erc20TokenMultiplier");
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
		var accountNetworkTokenBalanceBefore = await aotoken.balanceOf(account);
		var poolNetworkTokenBalanceBefore = await aotoken.balanceOf(aopool.address);

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
		assert.equal(canSell, true, "Account can't sell tokens on a Pool");

		var contractTotalLotAfter = await aopool.contractTotalLot();
		var poolTotalLotAfter = await aopool.poolTotalLot(poolId);
		var ownerTotalLotAfter = await aopool.ownerTotalLot(account);
		var poolTotalQuantityAfter = await aopool.poolTotalQuantity(poolId);
		var poolTotalSellAfter = await aopool.poolTotalSell(poolId);
		var totalPutOnSaleAfter = await aopool.totalPutOnSale(account);
		var contractTotalQuantityAfter = await aopool.contractTotalQuantity();
		var contractTotalSellAfter = await aopool.contractTotalSell();
		var accountNetworkTokenBalanceAfter = await aotoken.balanceOf(account);
		var poolNetworkTokenBalanceAfter = await aotoken.balanceOf(aopool.address);

		assert.equal(contractTotalLotAfter.toString(), contractTotalLotBefore.plus(1).toString(), "Contract has incorrect total Lot");
		assert.equal(poolTotalLotAfter.toString(), poolTotalLotBefore.plus(1).toString(), "Pool has incorrect total Lot");
		assert.equal(ownerTotalLotAfter.toString(), ownerTotalLotBefore.plus(1).toString(), "Account has incorrect total Lot");
		assert.equal(
			poolTotalQuantityAfter.toString(),
			poolTotalQuantityBefore.plus(quantity).toString(),
			"Pool has incorrect total quantity"
		);
		assert.equal(poolTotalSellAfter.toString(), poolTotalSellBefore.plus(quantity).toString(), "Pool has incorrect total sell");
		assert.equal(
			totalPutOnSaleAfter.toString(),
			totalPutOnSaleBefore.plus(quantity).toString(),
			"Account has incorrect totalPutOnSale"
		);
		assert.equal(
			contractTotalQuantityAfter.toString(),
			contractTotalQuantityBefore.plus(quantity).toString(),
			"Contract has incorrect total quantity"
		);
		assert.equal(
			contractTotalSellAfter.toString(),
			contractTotalSellBefore.plus(quantity).toString(),
			"Contract has incorrect total sell"
		);
		assert.equal(
			accountNetworkTokenBalanceAfter.toString(),
			accountNetworkTokenBalanceBefore.minus(quantity).toString(),
			"Account has incorrect network token balance"
		);
		assert.equal(
			poolNetworkTokenBalanceAfter.toString(),
			poolNetworkTokenBalanceBefore.plus(quantity).toString(),
			"Pool has incorrect network token balance"
		);

		var lot = await aopool.lots(lotId);
		assert.equal(lot[0], lotId, "Lot has incorrect lotId");
		assert.equal(lot[1], account, "Lot has incorrect seller");
		assert.equal(lot[2].toString(), quantity, "Lot has incorrect lotQuantity");
		assert.equal(lot[3].toString(), poolId, "Lot has incorrect poolId");
		assert.equal(lot[4].toString(), poolTotalSellBefore.toString(), "Lot has incorrect poolPreSellSnapshot");
		assert.equal(lot[5].toString(), poolTotalSellBefore.plus(quantity).toString(), "Lot has incorrect poolSellLotSnapshot");
		assert.equal(lot[6].toString(), new BigNumber(quantity).times(price).toString(), "Lot has incorrect lotValueInCounterAsset");
		assert.equal(lot[7].toString(), 0, "Lot has incorrect counterAssetWithdrawn");
		assert.equal(lot[8].toString(), 0, "Lot has incorrect tokenWithdrawn");
		assert.isAbove(lot[9].toNumber(), 0, "Lot has incorrect timestamp");

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
		var accountNetworkTokenBalanceBefore = await aotoken.balanceOf(account);
		var poolNetworkTokenBalanceBefore = await aotoken.balanceOf(aopool.address);

		var canBuy, buyWithEthEvent;
		try {
			var result = await aopool.buyWithEth(poolId, quantity, price, { from: account, value: quantity * price });
			buyWithEthEvent = result.logs[0];
			canBuy = true;
		} catch (e) {
			buyWithEthEvent = null;
			canBuy = false;
		}
		assert.equal(canBuy, true, "Account can't buy token with Eth");

		var poolTotalQuantityAfter = await aopool.poolTotalQuantity(poolId);
		var poolTotalBuyAfter = await aopool.poolTotalBuy(poolId);
		var poolEthereumBalanceAfter = await aopool.poolEthereumBalance(poolId);
		var contractTotalQuantityAfter = await aopool.contractTotalQuantity();
		var contractTotalBuyAfter = await aopool.contractTotalBuy();
		var contractEthereumBalanceAfter = await aopool.contractEthereumBalance();
		var totalBoughtAfter = await aopool.totalBought(account);
		var accountNetworkTokenBalanceAfter = await aotoken.balanceOf(account);
		var poolNetworkTokenBalanceAfter = await aotoken.balanceOf(aopool.address);

		assert.equal(
			poolTotalQuantityAfter.toString(),
			poolTotalQuantityBefore.minus(quantity).toString(),
			"Pool has incorrect total quantity"
		);
		assert.equal(poolTotalBuyAfter.toString(), poolTotalBuyBefore.plus(quantity).toString(), "Pool has incorrect total buy");
		assert.equal(
			poolEthereumBalanceAfter.toString(),
			poolEthereumBalanceBefore.plus(quantity * price).toString(),
			"Pool has incorrect ethereum balance"
		);
		assert.equal(
			contractTotalQuantityAfter.toString(),
			contractTotalQuantityBefore.minus(quantity).toString(),
			"Contract has incorrect total quantity"
		);
		assert.equal(
			contractTotalBuyAfter.toString(),
			contractTotalBuyBefore.plus(quantity).toString(),
			"Contract has incorrect total buy"
		);
		assert.equal(
			contractEthereumBalanceAfter.toString(),
			contractEthereumBalanceBefore.plus(quantity * price).toString(),
			"Contract has incorrect ethereum balance"
		);
		assert.equal(totalBoughtAfter.toString(), totalBoughtBefore.plus(quantity).toString(), "Account has incorrect totalBought");
		assert.equal(
			accountNetworkTokenBalanceAfter.toString(),
			accountNetworkTokenBalanceBefore.plus(quantity).toString(),
			"Account has incorrect network token balance"
		);
		assert.equal(
			poolNetworkTokenBalanceAfter.toString(),
			poolNetworkTokenBalanceBefore.minus(quantity).toString(),
			"Pool has incorrect network token balance"
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
			lotBefore[6].minus(availableToWithdrawBefore[1]).toString(),
			"Lot has incorrect lotValueInCounterAsset"
		);
		assert.equal(
			lotAfter[7].toString(),
			lotBefore[7].plus(availableToWithdrawBefore[1]).toString(),
			"Lot has incorrect counterAssetWithdrawn"
		);
		assert.equal(
			poolEthereumBalanceAfter.toString(),
			poolEthereumBalanceBefore.minus(availableToWithdrawBefore[1]).toString(),
			"Pool has incorrect ethereum balance"
		);
		assert.equal(
			poolTotalEthereumWithdrawnAfter.toString(),
			poolTotalEthereumWithdrawnBefore.plus(availableToWithdrawBefore[1]).toString(),
			"Pool has incorrect total ethereum withdrawn"
		);
		assert.equal(
			contractEthereumBalanceAfter.toString(),
			contractEthereumBalanceBefore.minus(availableToWithdrawBefore[1]).toString(),
			"Contract has incorrect ethereum balance"
		);
		assert.equal(
			contractTotalEthereumWithdrawnAfter.toString(),
			contractTotalEthereumWithdrawnBefore.plus(availableToWithdrawBefore[1]).toString(),
			"Contract has incorrect total ethereum withdrawn"
		);
		assert.equal(
			totalSoldAfter.toString(),
			totalSoldBefore.plus(availableToWithdrawBefore[0]).toString(),
			"Account has incorrect total sold"
		);
		assert.equal(
			totalEthereumWithdrawnAfter.toString(),
			totalEthereumWithdrawnBefore.plus(availableToWithdrawBefore[1]).toString(),
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

	var withdrawToken = async function(lotId, quantity, account) {
		var lotBefore = await aopool.lots(lotId);

		var poolId = lotBefore[3];
		var pool = await aopool.pools(poolId.toString());
		var price = pool[0];

		var poolTotalQuantityBefore = await aopool.poolTotalQuantity(poolId.toString());
		var contractTotalQuantityBefore = await aopool.contractTotalQuantity();
		var poolTotalWithdrawnBefore = await aopool.poolTotalWithdrawn(poolId.toString());
		var contractTotalWithdrawnBefore = await aopool.contractTotalWithdrawn();
		var totalPutOnSaleBefore = await aopool.totalPutOnSale(account);
		var accountNetworkTokenBalanceBefore = await aotoken.balanceOf(account);
		var poolNetworkTokenBalanceBefore = await aotoken.balanceOf(aopool.address);

		var canWithdrawToken, withdrawTokenEvent;
		try {
			var result = await aopool.withdrawToken(lotId, quantity, { from: account });
			withdrawTokenEvent = result.logs[0];
			canWithdrawToken = true;
		} catch (e) {
			withdrawTokenEvent = null;
			canWithdrawToken = false;
		}
		assert.equal(canWithdrawToken, true, "Account can't withdraw token from Lot");

		var lotAfter = await aopool.lots(lotId);
		var poolTotalQuantityAfter = await aopool.poolTotalQuantity(poolId.toString());
		var contractTotalQuantityAfter = await aopool.contractTotalQuantity();
		var poolTotalWithdrawnAfter = await aopool.poolTotalWithdrawn(poolId.toString());
		var contractTotalWithdrawnAfter = await aopool.contractTotalWithdrawn();
		var totalPutOnSaleAfter = await aopool.totalPutOnSale(account);
		var accountNetworkTokenBalanceAfter = await aotoken.balanceOf(account);
		var poolNetworkTokenBalanceAfter = await aotoken.balanceOf(aopool.address);

		assert.equal(lotAfter[5].toString(), lotBefore[5].minus(quantity).toString(), "Lot has incorrect poolSellLotSnapshot");
		assert.equal(
			lotAfter[6].toString(),
			lotBefore[6].minus(new BigNumber(quantity).times(price)).toString(),
			"Lot has incorrect lotValueInCounterAsset"
		);
		assert.equal(lotAfter[8].toString(), lotBefore[8].plus(quantity).toString(), "Lot has incorrect tokenWithdrawn");

		assert.equal(
			poolTotalQuantityAfter.toString(),
			poolTotalQuantityBefore.minus(quantity).toString(),
			"Pool has incorrect total quantity"
		);
		assert.equal(
			contractTotalQuantityAfter.toString(),
			contractTotalQuantityBefore.minus(quantity).toString(),
			"Contract has incorrect total quantity"
		);
		assert.equal(
			poolTotalWithdrawnAfter.toString(),
			poolTotalWithdrawnBefore.plus(quantity).toString(),
			"Pool has incorrect total withdrawn"
		);
		assert.equal(
			contractTotalWithdrawnAfter.toString(),
			contractTotalWithdrawnBefore.plus(quantity).toString(),
			"Contract has incorrect total withdrawn"
		);
		assert.equal(
			totalPutOnSaleAfter.toString(),
			totalPutOnSaleBefore.minus(quantity).toString(),
			"Account has incorrect total put on sale"
		);
		assert.equal(
			accountNetworkTokenBalanceAfter.toString(),
			accountNetworkTokenBalanceBefore.plus(quantity).toString(),
			"Account has incorrect network token balance"
		);
		assert.equal(
			poolNetworkTokenBalanceAfter.toString(),
			poolNetworkTokenBalanceBefore.minus(quantity).toString(),
			"Pool has incorrect network token balance"
		);
	};

	it("createPool() - only developer can create Pool", async function() {
		var price = 10000;
		var status = true;
		var sellCapStatus = true;
		var sellCapAmount = 100;
		var quantityCapStatus = true;
		var quantityCapAmount = 50;
		var erc20CounterAsset = true;
		var erc20TokenAddress = aotoken.address;
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
		assert.notEqual(canCreatePool, true, "Non-developer account can create Pool");

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
				{ from: developer }
			);
			createPoolEvent = result.logs[0];
			poolId1 = createPoolEvent.args.poolId;
			canCreatePool = true;
		} catch (e) {
			createPoolEvent = null;
			poolId1 = null;
			canCreatePool = false;
		}
		assert.notEqual(canCreatePool, true, "Developer can create Pool with 0 price");

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
				{ from: developer }
			);
			createPoolEvent = result.logs[0];
			poolId1 = createPoolEvent.args.poolId;
			canCreatePool = true;
		} catch (e) {
			createPoolEvent = null;
			poolId1 = null;
			canCreatePool = false;
		}
		assert.notEqual(canCreatePool, true, "Developer can create Pool with sell cap enabled but 0 sell cap amount");

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
				{ from: developer }
			);
			createPoolEvent = result.logs[0];
			poolId1 = createPoolEvent.args.poolId;
			canCreatePool = true;
		} catch (e) {
			createPoolEvent = null;
			poolId1 = null;
			canCreatePool = false;
		}
		assert.notEqual(canCreatePool, true, "Developer can create Pool with quantity cap enabled but 0 quantity cap amount");

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
				{ from: developer }
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
			"Developer can create Pool that is priced in ERC20 compatible token but no ERC20 Token address"
		);

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
				{ from: developer }
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
			"Developer can create Pool that is priced in ERC20 compatible token but no ERC20 Token multiplier"
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
			developer
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
			developer
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
			developer
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
			developer
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
			developer
		);

		// pool active
		// no sell cap
		// no quantity cap
		// is ethereum
		poolId6 = await createPool(price, status, false, sellCapAmount, false, quantityCapAmount, false, "", "", developer);

		// pool active
		// has sell cap
		// no quantity cap
		// is ethereum
		poolId7 = await createPool(price, status, true, sellCapAmount, false, quantityCapAmount, false, "", "", developer);

		// pool active
		// no sell cap
		// has quantity cap
		// is ethereum
		poolId8 = await createPool(price, status, false, sellCapAmount, true, quantityCapAmount, false, "", "", developer);

		// pool active
		// has sell cap
		// has quantity cap
		// is ethereum
		poolId9 = await createPool(price, status, true, sellCapAmount, true, quantityCapAmount, false, "", "", developer);
	});

	it("updatePoolStatus() - only Pool's admin can start/stop a Pool", async function() {
		var canUpdatePoolStatus;
		try {
			var result = await aopool.updatePoolStatus(poolId1.toString(), true, { from: account1 });
			canUpdatePoolStatus = true;
		} catch (e) {
			canUpdatePoolStatus = false;
		}
		assert.notEqual(canUpdatePoolStatus, true, "Non-Pool's admin can start/stop the Pool");

		try {
			var result = await aopool.updatePoolStatus(0, true, { from: developer });
			canUpdatePoolStatus = true;
		} catch (e) {
			canUpdatePoolStatus = false;
		}
		assert.notEqual(canUpdatePoolStatus, true, "Pool's admin can start/stop non-existing Pool");

		try {
			var result = await aopool.updatePoolStatus(poolId1.toString(), true, { from: developer });
			canUpdatePoolStatus = true;
		} catch (e) {
			canUpdatePoolStatus = false;
		}
		assert.equal(canUpdatePoolStatus, true, "Pool's admin can't start/stop non-existing Pool");
		var pool = await aopool.pools(poolId1.toString());
		assert.equal(pool[1], true, "Pool has incorrect status after update");

		try {
			var result = await aopool.updatePoolStatus(poolId1.toString(), false, { from: developer });
			canUpdatePoolStatus = true;
		} catch (e) {
			canUpdatePoolStatus = false;
		}
		assert.equal(canUpdatePoolStatus, true, "Pool's admin can't start/stop non-existing Pool");
		var pool = await aopool.pools(poolId1.toString());
		assert.equal(pool[1], false, "Pool has incorrect status after update");

		// Start the pool again
		await aopool.updatePoolStatus(poolId1.toString(), true, { from: developer });
	});

	it("changeAdminAddress() - only Pool's admin can change admin address", async function() {
		var canChangeAdminAddress;
		try {
			var result = await aopool.changeAdminAddress(poolId1.toString(), account1, { from: account1 });
			canChangeAdminAddress = true;
		} catch (e) {
			canChangeAdminAddress = false;
		}
		assert.notEqual(canChangeAdminAddress, true, "Non-Pool's admin can change admin address");

		try {
			var result = await aopool.changeAdminAddress(0, account1, { from: developer });
			canChangeAdminAddress = true;
		} catch (e) {
			canChangeAdminAddress = false;
		}
		assert.notEqual(canChangeAdminAddress, true, "Pool's admin can change admin address on non-existing Pool");

		try {
			var result = await aopool.changeAdminAddress(poolId1.toString(), account1, { from: developer });
			canChangeAdminAddress = true;
		} catch (e) {
			canChangeAdminAddress = false;
		}
		assert.equal(canChangeAdminAddress, true, "Pool's admin can't change admin address");
		var pool = await aopool.pools(poolId1.toString());
		assert.equal(pool[9], account1, "Pool has incorrect admin address after update");

		try {
			var result = await aopool.changeAdminAddress(poolId1.toString(), account2, { from: account1 });
			canChangeAdminAddress = true;
		} catch (e) {
			canChangeAdminAddress = false;
		}
		assert.equal(canChangeAdminAddress, true, "Pool's admin can't change admin address");
		var pool = await aopool.pools(poolId1.toString());
		assert.equal(pool[9], account2, "Pool has incorrect admin address after update");

		var owner = await aopool.developer();
		try {
			var result = await aopool.changeAdminAddress(poolId1.toString(), account3, { from: developer });
			canChangeAdminAddress = true;
		} catch (e) {
			canChangeAdminAddress = false;
		}
		assert.equal(canChangeAdminAddress, true, "Developer can't change admin address");
		var pool = await aopool.pools(poolId1.toString());
		assert.equal(pool[9], account3, "Pool has incorrect admin address after update");

		// Change it back again to developer
		await aopool.changeAdminAddress(poolId1.toString(), developer, { from: developer });
	});

	it("sell() - should be able to sell AO tokens in a Pool", async function() {
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
		assert.equal(canSell, false, "Account with no token balance can sell AO on a Pool");

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
		await aopool.updatePoolStatus(poolId1.toString(), false, { from: developer });

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
		await aopool.updatePoolStatus(poolId1.toString(), true, { from: developer });

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
		var lots = await aopool.ownerLotIds(account1, 0, account1TotalLot.minus(1).toString());
		var isEqual =
			lots.length === account1Lots.length &&
			lots.every(function(value, index) {
				return value === account1Lots[index];
			});
		assert.equal(isEqual, true, "ownerLotIds() return incorrect Lot IDs");

		var account2TotalLot = await aopool.ownerTotalLot(account2);
		var lots = await aopool.ownerLotIds(account2, 0, account2TotalLot.minus(1).toString());
		var isEqual =
			lots.length === account2Lots.length &&
			lots.every(function(value, index) {
				return value === account2Lots[index];
			});
		assert.equal(isEqual, true, "ownerLotIds() return incorrect Lot IDs");

		var account3TotalLot = await aopool.ownerTotalLot(account3);
		var lots = await aopool.ownerLotIds(account3, 0, account3TotalLot.minus(1).toString());
		var isEqual =
			lots.length === account3Lots.length &&
			lots.every(function(value, index) {
				return value === account3Lots[index];
			});
		assert.equal(isEqual, true, "ownerLotIds() return incorrect Lot IDs");

		var account4TotalLot = await aopool.ownerTotalLot(account4);
		var lots = await aopool.ownerLotIds(account4, 0, account4TotalLot.minus(1).toString());
		var isEqual =
			lots.length === account4Lots.length &&
			lots.every(function(value, index) {
				return value === account4Lots[index];
			});
		assert.equal(isEqual, true, "ownerLotIds() return incorrect Lot IDs");

		var account5TotalLot = await aopool.ownerTotalLot(account5);
		var lots = await aopool.ownerLotIds(account5, 0, account5TotalLot.minus(1).toString());
		var isEqual =
			lots.length === account5Lots.length &&
			lots.every(function(value, index) {
				return value === account5Lots[index];
			});
		assert.equal(isEqual, true, "ownerLotIds() return incorrect Lot IDs");
	});

	it("buyWithEth() - should buy token from Pool with Eth", async function() {
		var canBuy, buyWithEthEvent;
		try {
			var result = await aopool.buyWithEth(100, 15, 10000, { from: account1, value: 15 * 10000 });
			buyWithEthEvent = result.logs[0];
			canBuy = true;
		} catch (e) {
			buyWithEthEvent = false;
			canBuy = false;
		}
		assert.equal(canBuy, false, "Account can buy token from non-existing Pool");

		var poolTotalQuantity = await aopool.poolTotalQuantity(poolId6.toString());
		try {
			var result = await aopool.buyWithEth(poolId6.toString(), poolTotalQuantity.plus(1).toString(), 10000, {
				from: account1,
				value: poolTotalQuantity
					.plus(1)
					.times(10000)
					.toString()
			});
			buyWithEthEvent = result.logs[0];
			canBuy = true;
		} catch (e) {
			buyWithEthEvent = false;
			canBuy = false;
		}
		assert.equal(canBuy, false, "Account can buy token more than Pool's total quantity");

		try {
			var result = await aopool.buyWithEth(poolId6.toString(), 15, 1000, { from: account1, value: 15 * 1000 });
			buyWithEthEvent = result.logs[0];
			canBuy = true;
		} catch (e) {
			buyWithEthEvent = false;
			canBuy = false;
		}
		assert.equal(canBuy, false, "Account can buy token from Pool even though entered price doesn't match Pool's price");

		try {
			var result = await aopool.buyWithEth(poolId6.toString(), 15, 10000, { from: account1, value: 15 * 1000 });
			buyWithEthEvent = result.logs[0];
			canBuy = true;
		} catch (e) {
			buyWithEthEvent = false;
			canBuy = false;
		}
		assert.equal(
			canBuy,
			false,
			"Account can buy token from Pool even though sent Eth is not the exact total price for the transaction"
		);

		try {
			var result = await aopool.buyWithEth(poolId1.toString(), 5, 10000, { from: account1, value: 5 * 10000 });
			buyWithEthEvent = result.logs[0];
			canBuy = true;
		} catch (e) {
			buyWithEthEvent = false;
			canBuy = false;
		}
		assert.equal(canBuy, false, "Account can buy token with Eth from Pool that is not priced in Eth");

		// Stop the pool
		await aopool.updatePoolStatus(poolId6.toString(), false, { from: developer });

		try {
			var result = await aopool.buyWithEth(poolId6.toString(), 15, 10000, { from: account1, value: 15 * 10000 });
			buyWithEthEvent = result.logs[0];
			canBuy = true;
		} catch (e) {
			buyWithEthEvent = false;
			canBuy = false;
		}
		assert.equal(canBuy, false, "Account can buy token from Pool even though Pool is currently inactive");

		// Start the pool
		await aopool.updatePoolStatus(poolId6.toString(), true, { from: developer });

		await buyWithEth(poolId6.toString(), 15, 10000, buyer1);
	});

	it("lotEthAvailableToWithdraw() - should return the amount of token sold, ethereum available to withdraw, and current ethereum withdrawn from the Lot that is priced in Eth", async function() {
		// lotId1 has 10 lotQuantity
		// buyer1 bought 15 tokens
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
		// buyer1 bought 15 tokens
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

	it("withdrawToken() - should able to withdraw token from Lot", async function() {
		var canWithdrawToken, withdrawTokenEvent;
		try {
			var result = await aopool.withdrawToken("someid", 10, { from: account1 });
			withdrawTokenEvent = result.logs[0];
			canWithdrawToken = true;
		} catch (e) {
			withdrawTokenEvent = null;
			canWithdrawToken = false;
		}
		assert.equal(canWithdrawToken, false, "Account can withdraw token from non-existing Lot");

		try {
			var result = await aopool.withdrawToken(lotId1, 10, { from: account1 });
			withdrawTokenEvent = result.logs[0];
			canWithdrawToken = true;
		} catch (e) {
			withdrawTokenEvent = null;
			canWithdrawToken = false;
		}
		assert.equal(canWithdrawToken, false, "Account can withdraw token from Lot that has been sold entirely");

		try {
			var result = await aopool.withdrawToken(lotId2, 5, { from: account1 });
			withdrawTokenEvent = result.logs[0];
			canWithdrawToken = true;
		} catch (e) {
			withdrawTokenEvent = null;
			canWithdrawToken = false;
		}
		assert.equal(canWithdrawToken, false, "Non-Lot owner can withdraw token from Lot");

		try {
			var result = await aopool.withdrawToken(lotId2, 21, { from: account1 });
			withdrawTokenEvent = result.logs[0];
			canWithdrawToken = true;
		} catch (e) {
			withdrawTokenEvent = null;
			canWithdrawToken = false;
		}
		assert.equal(canWithdrawToken, false, "Account can withdraw token more than Lot's available amount");

		await withdrawToken(lotId2, 5, account2);
		await withdrawToken(lotId4, 20, account4);
		await withdrawToken(lotId5, 4, account5);
		await withdrawToken(lotId6, 3, account1);
	});

	it("totalTokenWithdrawnBeforeLot() - should return correct total token withdrawn from all Lots before certain Lot ID", async function() {
		var totalTokenWithdrawn = await aopool.totalTokenWithdrawnBeforeLot(lotId1);
		assert.equal(totalTokenWithdrawn.toString(), 0, "totalTokenWithdrawnBeforeLot() return incorrect total token withdrawn");

		var totalTokenWithdrawn = await aopool.totalTokenWithdrawnBeforeLot(lotId2);
		assert.equal(totalTokenWithdrawn.toString(), 0, "totalTokenWithdrawnBeforeLot() return incorrect total token withdrawn");

		var totalTokenWithdrawn = await aopool.totalTokenWithdrawnBeforeLot(lotId3);
		assert.equal(totalTokenWithdrawn.toString(), 5, "totalTokenWithdrawnBeforeLot() return incorrect total token withdrawn");

		var totalTokenWithdrawn = await aopool.totalTokenWithdrawnBeforeLot(lotId4);
		assert.equal(totalTokenWithdrawn.toString(), 5, "totalTokenWithdrawnBeforeLot() return incorrect total token withdrawn");

		var totalTokenWithdrawn = await aopool.totalTokenWithdrawnBeforeLot(lotId5);
		assert.equal(totalTokenWithdrawn.toString(), 25, "totalTokenWithdrawnBeforeLot() return incorrect total token withdrawn");

		var totalTokenWithdrawn = await aopool.totalTokenWithdrawnBeforeLot(lotId6);
		assert.equal(totalTokenWithdrawn.toString(), 29, "totalTokenWithdrawnBeforeLot() return incorrect total token withdrawn");

		var totalTokenWithdrawn = await aopool.totalTokenWithdrawnBeforeLot(lotId7);
		assert.equal(totalTokenWithdrawn.toString(), 32, "totalTokenWithdrawnBeforeLot() return incorrect total token withdrawn");

		var totalTokenWithdrawn = await aopool.totalTokenWithdrawnBeforeLot(lotId8);
		assert.equal(totalTokenWithdrawn.toString(), 32, "totalTokenWithdrawnBeforeLot() return incorrect total token withdrawn");
	});

	it("should be able to buy token and reward the lot accordingly after some accounts withdraw tokens from their lots", async function() {
		// Should buy 15 tokens from lotId2 and 5 tokens from lotId3
		await buyWithEth(poolId6.toString(), 20, 10000, buyer2);
		var lotId2AvailableToWithdraw = await aopool.lotEthAvailableToWithdraw(lotId2);
		assert.equal(lotId2AvailableToWithdraw[0].toString(), 15, "lotEthAvailableToWithdraw() returns incorrect sold quantity");
		await withdrawEth(lotId2, account2);

		var lot = await aopool.lots(lotId2);
		var pool = await aopool.pools(lot[3].toString());
		var price = pool[0];

		assert.equal(lot[6].toString(), 0, "Lot has incorrect lotValueInCounterAsset");
		assert.equal(lot[7].toString(), lot[2].times(price).minus(lot[8].times(price)), "Lot has incorrect counterAssetWithdrawn");
		assert.equal(lot[8].toString(), 5, "Lot has incorrect tokenWithdrawn");

		var lotId3AvailableToWithdraw = await aopool.lotEthAvailableToWithdraw(lotId3);
		assert.equal(lotId3AvailableToWithdraw[0].toString(), 5, "lotEthAvailableToWithdraw() returns incorrect sold quantity");

		await withdrawEth(lotId3, account3);
		var lot = await aopool.lots(lotId3);
		var pool = await aopool.pools(lot[3].toString());
		var price = pool[0];

		assert.equal(
			lot[7].toString(),
			new BigNumber(5).times(price).minus(lot[8].times(price)),
			"Lot has incorrect counterAssetWithdrawn"
		);

		// Should buy 95 tokens from lotId3
		// Should buy 53 tokens from lotId4
		// Should buy 24 tokens from lotId5
		// Should buy 28 tokens from lotId7
		await buyWithEth(poolId6.toString(), 200, 10000, buyer3);

		var lotId3AvailableToWithdraw = await aopool.lotEthAvailableToWithdraw(lotId3);
		assert.equal(lotId3AvailableToWithdraw[0].toString(), 95, "lotEthAvailableToWithdraw() returns incorrect sold quantity");
		await withdrawEth(lotId3, account3);

		var lot = await aopool.lots(lotId3);
		var pool = await aopool.pools(lot[3].toString());
		var price = pool[0];

		assert.equal(lot[6].toString(), 0, "Lot has incorrect lotValueInCounterAsset");
		assert.equal(lot[7].toString(), lot[2].times(price).minus(lot[8].times(price)), "Lot has incorrect counterAssetWithdrawn");
		assert.equal(lot[8].toString(), 0, "Lot has incorrect tokenWithdrawn");

		var lotId4AvailableToWithdraw = await aopool.lotEthAvailableToWithdraw(lotId4);
		assert.equal(lotId4AvailableToWithdraw[0].toString(), 53, "lotEthAvailableToWithdraw() returns incorrect sold quantity");
		await withdrawEth(lotId4, account4);

		var lot = await aopool.lots(lotId4);
		var pool = await aopool.pools(lot[3].toString());
		var price = pool[0];

		assert.equal(lot[6].toString(), 0, "Lot has incorrect lotValueInCounterAsset");
		assert.equal(lot[7].toString(), lot[2].times(price).minus(lot[8].times(price)), "Lot has incorrect counterAssetWithdrawn");
		assert.equal(lot[8].toString(), 20, "Lot has incorrect tokenWithdrawn");

		var lotId5AvailableToWithdraw = await aopool.lotEthAvailableToWithdraw(lotId5);
		assert.equal(lotId5AvailableToWithdraw[0].toString(), 24, "lotEthAvailableToWithdraw() returns incorrect sold quantity");
		await withdrawEth(lotId5, account5);

		var lot = await aopool.lots(lotId5);
		var pool = await aopool.pools(lot[3].toString());
		var price = pool[0];

		assert.equal(lot[6].toString(), 0, "Lot has incorrect lotValueInCounterAsset");
		assert.equal(lot[7].toString(), lot[2].times(price).minus(lot[8].times(price)), "Lot has incorrect counterAssetWithdrawn");
		assert.equal(lot[8].toString(), 4, "Lot has incorrect tokenWithdrawn");

		var lotId7AvailableToWithdraw = await aopool.lotEthAvailableToWithdraw(lotId7);
		assert.equal(lotId7AvailableToWithdraw[0].toString(), 28, "lotEthAvailableToWithdraw() returns incorrect sold quantity");

		await withdrawEth(lotId7, account2);
		var lot = await aopool.lots(lotId7);
		var pool = await aopool.pools(lot[3].toString());
		var price = pool[0];

		assert.equal(
			lot[7].toString(),
			new BigNumber(28).times(price).minus(lot[8].times(price)),
			"Lot has incorrect counterAssetWithdrawn"
		);
	});

	it("stress testing to calculate gas cost for withdrawing Eth on last Lot especially when there is token withdrawn from the Lots before the last Lot", async function() {
		var poolId = await createPool(1000, true, false, "", false, "", false, "", "", developer);
		var pool = await aopool.pools(poolId.toString());

		var lots = [];
		var totalLot = 432; // random big amount for testing
		for (var i = 1; i <= totalLot; i++) {
			console.log("Creating Lot " + i + " out of " + totalLot);
			lotId = await sell(poolId.toString(), 10, 1000, account1, account1Lots);
			lots.push(lotId);
			// Every "even" lot, withdraw 5 tokens
			if (i % 2 == 0) {
				await withdrawToken(lotId, 5, account1);
			}
		}
		var poolTotalQuantity = await aopool.poolTotalQuantity(poolId.toString());
		await buyWithEth(poolId.toString(), poolTotalQuantity.toString(), 1000, buyer1);
		await withdrawEth(lots[lots.length - 1], account1);
	}).timeout(24 * 60 * 60 * 1000);
});
