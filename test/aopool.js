var AOPool = artifacts.require("./AOPool.sol");
var AOToken = artifacts.require("./AOToken.sol");
var BigNumber = require("bignumber.js");

contract("AOPool", function(accounts) {
	var aopool, aotoken, poolId1, poolId2, poolId3, poolId4, poolId5, poolId6;
	var developer = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var emptyAddress = "0x0000000000000000000000000000000000000000";

	before(async function() {
		aopool = await AOPool.deployed();
		aotoken = await AOToken.deployed();
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

	it("createPool() - only developer can create Pool", async function() {
		var price = 10000;
		var status = true;
		var sellCapStatus = true;
		var sellCapAmount = 1000000;
		var quantityCapStatus = true;
		var quantityCapAmount = 500000;
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
		poolId5 = await createPool(
			price,
			false,
			false,
			sellCapAmount,
			false,
			quantityCapAmount,
			erc20CounterAsset,
			erc20TokenAddress,
			erc20TokenMultiplier,
			developer
		);
		poolId6 = await createPool(
			price,
			false,
			false,
			sellCapAmount,
			false,
			quantityCapAmount,
			false,
			erc20TokenAddress,
			erc20TokenMultiplier,
			developer
		);
	});

	it("updatePoolStatus() - only Pool's admin can start/stop a Pool", async function() {
		var canUpdatePoolStatus;
		try {
			var result = await aopool.updatePoolStatus(poolId1, true, { from: account1 });
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
			var result = await aopool.updatePoolStatus(poolId1, true, { from: developer });
			canUpdatePoolStatus = true;
		} catch (e) {
			canUpdatePoolStatus = false;
		}
		assert.equal(canUpdatePoolStatus, true, "Pool's admin can't start/stop non-existing Pool");
		var pool = await aopool.pools(poolId1);
		assert.equal(pool[1], true, "Pool has incorrect status after update");

		try {
			var result = await aopool.updatePoolStatus(poolId1, false, { from: developer });
			canUpdatePoolStatus = true;
		} catch (e) {
			canUpdatePoolStatus = false;
		}
		assert.equal(canUpdatePoolStatus, true, "Pool's admin can't start/stop non-existing Pool");
		var pool = await aopool.pools(poolId1);
		assert.equal(pool[1], false, "Pool has incorrect status after update");
	});

	it("changeAdminAddress() - only Pool's admin can change admin address", async function() {
		var canChangeAdminAddress;
		try {
			var result = await aopool.changeAdminAddress(poolId1, account1, { from: account1 });
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
			var result = await aopool.changeAdminAddress(poolId1, account1, { from: developer });
			canChangeAdminAddress = true;
		} catch (e) {
			canChangeAdminAddress = false;
		}
		assert.equal(canChangeAdminAddress, true, "Pool's admin can't change admin address");
		var pool = await aopool.pools(poolId1);
		assert.equal(pool[9], account1, "Pool has incorrect admin address after update");

		try {
			var result = await aopool.changeAdminAddress(poolId1, account2, { from: account1 });
			canChangeAdminAddress = true;
		} catch (e) {
			canChangeAdminAddress = false;
		}
		assert.equal(canChangeAdminAddress, true, "Pool's admin can't change admin address");
		var pool = await aopool.pools(poolId1);
		assert.equal(pool[9], account2, "Pool has incorrect admin address after update");

		var owner = await aopool.developer();
		try {
			var result = await aopool.changeAdminAddress(poolId1, account3, { from: developer });
			canChangeAdminAddress = true;
		} catch (e) {
			canChangeAdminAddress = false;
		}
		assert.equal(canChangeAdminAddress, true, "Developer can't change admin address");
		var pool = await aopool.pools(poolId1);
		assert.equal(pool[9], account3, "Pool has incorrect admin address after update");
	});
});
