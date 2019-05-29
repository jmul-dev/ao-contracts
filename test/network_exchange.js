var AOIon = artifacts.require("./AOIon.sol");
var AOIonLot = artifacts.require("./AOIonLot.sol");
var AOLibrary = artifacts.require("./AOLibrary.sol");
var AOSetting = artifacts.require("./AOSetting.sol");
var EthCrypto = require("eth-crypto");
var BN = require("bn.js");
var helper = require("./helpers/truffleTestHelper");
var Web3 = require("web3");
var _web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

contract("Network Exchange", function(accounts) {
	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var aoDevTeam1 = "0x146CbD9821e6A42c8ff6DC903fe91CB69625A105";
	var aoDevTeam2 = "0x4810aF1dA3aC827259eEa72ef845F4206C703E8D";
	var emptyAddress = "0x0000000000000000000000000000000000000000";
	var recipient = EthCrypto.createIdentity();

	var account1Lots = [];
	var aoion,
		aoionlot,
		_aoionlot,
		library,
		aosetting,
		settingTAOId,
		percentageDivisor,
		totalPrimordialForSale,
		startingPrimordialMultiplier,
		endingPrimordialMultiplier,
		startingNetworkBonusMultiplier,
		endingNetworkBonusMultiplier;

	before(async function() {
		aoion = await AOIon.deployed();
		aoionlot = await AOIonLot.deployed();
		_aoionlot = _web3.eth.contract(aoionlot.abi).at(aoionlot.address);
		library = await AOLibrary.deployed();
		aosetting = await AOSetting.deployed();
		settingTAOId = await aoion.settingTAOId();
		percentageDivisor = await library.PERCENTAGE_DIVISOR();

		// Need to re-set theAO address because the migration script sets theAO to primordialTAOId
		await aoion.transferOwnership(theAO, { from: theAO });

		totalPrimordialForSale = new BN(await aoion.TOTAL_PRIMORDIAL_FOR_SALE());

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "startingPrimordialMultiplier");
		startingPrimordialMultiplier = new BN(settingValues[0]);

		settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "endingPrimordialMultiplier");
		endingPrimordialMultiplier = new BN(settingValues[0]);

		settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "startingNetworkBonusMultiplier");
		startingNetworkBonusMultiplier = new BN(settingValues[0]);

		settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "endingNetworkBonusMultiplier");
		endingNetworkBonusMultiplier = new BN(settingValues[0]);
	});

	var buyPrimordial = async function(amount, account, accountLots) {
		var totalEthForPrimordialBefore = await aoion.totalEthForPrimordial();
		var availablePrimordialForSaleBefore = await aoion.availablePrimordialForSale();
		var availableETHBefore = await aoion.availableETH();
		var totalRedeemedAOETHBefore = await aoion.totalRedeemedAOETH();

		var totalLotsBefore = await aoionlot.totalLots();
		var primordialTotalBoughtBefore = await aoion.primordialTotalBought();
		var primordialTotalSupplyBefore = await aoion.primordialTotalSupply();

		var accountPrimordialBalanceBefore = await aoion.primordialBalanceOf(account);
		var accountNetworkBalanceBefore = await aoion.balanceOf(account);
		var accountTotalLotsBefore = await aoionlot.totalLotsByAddress(account);

		var aoDevTeam1PrimordialBalanceBefore = await aoion.primordialBalanceOf(aoDevTeam1);
		var aoDevTeam1NetworkBalanceBefore = await aoion.balanceOf(aoDevTeam1);

		var aoDevTeam2PrimordialBalanceBefore = await aoion.primordialBalanceOf(aoDevTeam2);
		var aoDevTeam2NetworkBalanceBefore = await aoion.balanceOf(aoDevTeam2);

		var theAOPrimordialBalanceBefore = await aoion.primordialBalanceOf(theAO);
		var theAONetworkBalanceBefore = await aoion.balanceOf(theAO);

		var primordialBuyPrice = await aoion.primordialBuyPrice();
		var ionAmount = new BN(amount).div(primordialBuyPrice);
		if (new BN(amount).gt(availableETHBefore)) {
			ionAmount = new BN(availableETHBefore).div(primordialBuyPrice);
		}

		if (primordialTotalBoughtBefore.add(ionAmount).gte(totalPrimordialForSale)) {
			ionAmount = totalPrimordialForSale.sub(primordialTotalBoughtBefore);
		}

		var hasRemainder = false;
		if (new BN(amount).gt(ionAmount.mul(primordialBuyPrice))) {
			hasRemainder = true;
		}
		var remainderAmount = new BN(0);

		var bonus = await aoion.calculateMultiplierAndBonus(ionAmount.toString());

		var inverseMultiplier = startingPrimordialMultiplier.sub(bonus[0]);
		var theAONetworkBonusAmount = startingNetworkBonusMultiplier
			.sub(bonus[1])
			.add(endingNetworkBonusMultiplier)
			.mul(ionAmount)
			.div(percentageDivisor);

		var accountWeightedMultiplierBefore = await aoion.weightedMultiplierByAddress(account);

		var _event = _aoionlot.LotCreation();
		_event.watch(async function(error, log) {
			if (!error) {
				if (log.args.lotOwner == account) {
					assert.equal(log.args.multiplier.toString(), bonus[0].toString(), "Account Lot Creation has incorrect multiplier");
					assert.equal(log.args.primordialAmount.toString(), ionAmount.toString(), "Account Lot Creation has incorrect amount");
					assert.equal(
						log.args.networkBonusAmount.toString(),
						bonus[2].toString(),
						"Account Lot Creation has incorrect networkBonusAmount"
					);
				} else if (log.args.lotOwner == aoDevTeam1) {
					var aoDevTeam1LotId = log.args.lotId;
					assert.equal(
						log.args.multiplier.toString(),
						inverseMultiplier.toString(),
						"aoDevTeam1 Lot Creation has incorrect multiplier"
					);
					assert.equal(
						log.args.primordialAmount.toString(),
						halfAmount.toString(),
						"aoDevTeam1 Lot Creation has incorrect amount"
					);
					assert.equal(
						log.args.networkBonusAmount.toString(),
						halfTheAONetworkBonusAmount.toString(),
						"aoDevTeam1 Lot Creation has incorrect networkBonusAmount"
					);

					var aoDevTeam1Lot = await aoionlot.lotById(aoDevTeam1LotId);
					assert.equal(aoDevTeam1Lot[0], aoDevTeam1LotId, "Lot has incorrect ID");
					assert.equal(aoDevTeam1Lot[1], aoDevTeam1, "Lot has incorrect lot owner");
					assert.equal(aoDevTeam1Lot[2].toString(), inverseMultiplier.toString(), "Lot has incorrect multiplier");
					assert.equal(aoDevTeam1Lot[3].toString(), halfAmount.toString(), "Lot has incorrect amount");
				} else if (log.args.lotOwner == aoDevTeam2) {
					var aoDevTeam2LotId = log.args.lotId;
					assert.equal(
						log.args.multiplier.toString(),
						inverseMultiplier.toString(),
						"aoDevTeam2 Lot Creation has incorrect multiplier"
					);
					assert.equal(
						log.args.primordialAmount.toString(),
						halfAmount.toString(),
						"aoDevTeam2 Lot Creation has incorrect amount"
					);
					assert.equal(
						log.args.networkBonusAmount.toString(),
						halfTheAONetworkBonusAmount.toString(),
						"aoDevTeam2 Lot Creation has incorrect networkBonusAmount"
					);

					var aoDevTeam2Lot = await aoionlot.lotById(aoDevTeam2LotId);
					assert.equal(aoDevTeam2Lot[0], aoDevTeam2LotId, "Lot has incorrect ID");
					assert.equal(aoDevTeam2Lot[1], aoDevTeam2, "Lot has incorrect lot owner");
					assert.equal(aoDevTeam2Lot[2].toString(), inverseMultiplier.toString(), "Lot has incorrect multiplier");
					assert.equal(aoDevTeam2Lot[3].toString(), halfAmount.toString(), "Lot has incorrect amount");
				}
			}
		});
		_event.stopWatching();

		var canBuy, events;
		try {
			var result = await aoion.buyPrimordial({ from: account, value: amount });
			events = result.logs;
			canBuy = true;
		} catch (e) {
			events = null;
			canBuy = false;
		}
		assert.equal(canBuy, true, "Account can't buy primordial ion");
		assert.notEqual(events, null, "Contract didn't emit events during buy primordial ion transaction");

		var halfAmount = new BN(ionAmount).div(new BN(2));
		var halfTheAONetworkBonusAmount = new BN(theAONetworkBonusAmount).div(new BN(2));

		var accountLotId;
		for (var i = 0; i < events.length; i++) {
			var _event = events[i];
			switch (_event.event) {
				case "BuyPrimordial":
					if (_event.args.lotOwner == account) {
						accountLotId = _event.args.lotId;
						remainderAmount = _event.args.refundedAmount;

						if (hasRemainder) {
							assert.isAbove(parseInt(remainderAmount.toString()), 0, "Event has incorrect refundedAmount");
						}

						assert.equal(_event.args.payWith.toString(), 1, "Event has incorrect payWith value");
					}
					break;
				default:
					break;
			}
		}

		var totalEthForPrimordialAfter = await aoion.totalEthForPrimordial();
		var availablePrimordialForSaleAfter = await aoion.availablePrimordialForSale();
		var availableETHAfter = await aoion.availableETH();

		assert.equal(
			totalEthForPrimordialAfter.toString(),
			totalEthForPrimordialBefore
				.add(new BN(amount))
				.sub(remainderAmount)
				.toString(),
			"Contract has incorrect value for totalEthForPrimordial"
		);
		assert.equal(
			availableETHAfter.toString(),
			availablePrimordialForSaleAfter.toString() == 1
				? primordialBuyPrice.toString()
				: availableETHBefore.sub(ionAmount.mul(primordialBuyPrice)).toString(),
			"Contract has incorrect value for availableETH"
		);
		assert.equal(
			availablePrimordialForSaleAfter.toString(),
			availablePrimordialForSaleBefore.sub(ionAmount).toString(),
			"Contract has incorrect value for availablePrimordialForSale"
		);

		var totalLotsAfter = await aoionlot.totalLots();
		var primordialTotalBoughtAfter = await aoion.primordialTotalBought();
		var primordialTotalSupplyAfter = await aoion.primordialTotalSupply();

		var accountPrimordialBalanceAfter = await aoion.primordialBalanceOf(account);
		var accountNetworkBalanceAfter = await aoion.balanceOf(account);
		var accountTotalLotsAfter = await aoionlot.totalLotsByAddress(account);

		var aoDevTeam1PrimordialBalanceAfter = await aoion.primordialBalanceOf(aoDevTeam1);
		var aoDevTeam1NetworkBalanceAfter = await aoion.balanceOf(aoDevTeam1);

		var aoDevTeam2PrimordialBalanceAfter = await aoion.primordialBalanceOf(aoDevTeam2);
		var aoDevTeam2NetworkBalanceAfter = await aoion.balanceOf(aoDevTeam2);

		var theAOPrimordialBalanceAfter = await aoion.primordialBalanceOf(theAO);
		var theAONetworkBalanceAfter = await aoion.balanceOf(theAO);

		assert.equal(totalLotsAfter.toString(), totalLotsBefore.add(new BN(3)).toString(), "Contract has incorrect totalLots");
		assert.equal(
			primordialTotalBoughtAfter.toString(),
			primordialTotalBoughtBefore.add(ionAmount).toString(),
			"Contract has incorrect primordialTotalBought"
		);
		assert.equal(
			primordialTotalSupplyAfter.toString(),
			primordialTotalSupplyBefore
				.add(ionAmount)
				.add(halfAmount)
				.add(halfAmount)
				.toString(),
			"Contract has incorrect primordialTotalSupply"
		);

		assert.equal(
			accountPrimordialBalanceAfter.toString(),
			accountPrimordialBalanceBefore.add(ionAmount).toString(),
			"Account has incorrect primordial balance"
		);
		assert.equal(
			accountNetworkBalanceAfter.toString(),
			accountNetworkBalanceBefore.add(bonus[2]).toString(),
			"Account has incorrect network balance"
		);
		assert.equal(accountTotalLotsAfter.toString(), accountTotalLotsBefore.add(new BN(1)).toString(), "Account has incorrect totalLots");

		assert.equal(
			aoDevTeam1PrimordialBalanceAfter.toString(),
			aoDevTeam1PrimordialBalanceBefore.add(halfAmount).toString(),
			"aoDevTeam1 has incorrect primordial balance"
		);
		assert.equal(
			aoDevTeam1NetworkBalanceAfter.toString(),
			aoDevTeam1NetworkBalanceBefore.add(halfTheAONetworkBonusAmount).toString(),
			"aoDevTeam1 has incorrect network balance"
		);

		assert.equal(
			aoDevTeam2PrimordialBalanceAfter.toString(),
			aoDevTeam2PrimordialBalanceBefore.add(halfAmount).toString(),
			"aoDevTeam2 has incorrect primordial balance"
		);
		assert.equal(
			aoDevTeam2NetworkBalanceAfter.toString(),
			aoDevTeam2NetworkBalanceBefore.add(halfTheAONetworkBonusAmount).toString(),
			"aoDevTeam2 has incorrect network balance"
		);

		assert.equal(
			theAOPrimordialBalanceAfter.toString(),
			theAOPrimordialBalanceBefore.toString(),
			"The AO has incorrect primordial balance"
		);
		assert.equal(
			theAONetworkBalanceAfter.toString(),
			theAONetworkBalanceBefore.add(theAONetworkBonusAmount).toString(),
			"The AO has incorrect network balance"
		);

		// Make sure the Lot is stored correctly
		var accountLot = await aoionlot.lotById(accountLotId);
		assert.equal(accountLot[0], accountLotId, "Lot has incorrect ID");
		assert.equal(accountLot[1], account, "Lot has incorrect lot owner");
		assert.equal(accountLot[2].toString(), bonus[0].toString(), "Lot has incorrect multiplier");
		assert.equal(accountLot[3].toString(), ionAmount.toString(), "Lot has incorrect amount");

		accountLots.push(accountLot);

		var newWeightedMultiplier = await library.calculateWeightedMultiplier(
			accountWeightedMultiplierBefore.toString(),
			accountPrimordialBalanceBefore.toString(),
			accountLot[2].toString(),
			accountLot[3].toString()
		);

		var accountWeightedMultiplier = await aoion.weightedMultiplierByAddress(account);
		assert.equal(accountWeightedMultiplier.toString(), newWeightedMultiplier.toString(), "Account has incorrect weighted multiplier");

		// Check max multiplier for the account
		// should be the same as multiplier from account's lot #1
		var maxMultiplier = await aoion.maxMultiplierByAddress(account);
		assert.equal(maxMultiplier.toString(), accountLots[0][2].toString(), "Account has incorrect maxMultiplier");

		await helper.advanceBlock();

		return accountLotId;
	};

	it("buyPrimordial() - buy Primordial ions from contract by sending ETH", async function() {
		var networkExchangeEnded = await aoion.networkExchangeEnded();
		assert.equal(networkExchangeEnded, false, "Contract has incorrect networkExchangeEnded value");

		await buyPrimordial(web3.utils.toWei("400000", "ether"), account1, account1Lots);

		var networkExchangeEnded = await aoion.networkExchangeEnded();
		assert.equal(networkExchangeEnded, true, "Contract has incorrect networkExchangeEnded value");

		var ethBalance = await web3.eth.getBalance(aoion.address);
		var canTransferEth;
		try {
			await aoion.transferEth(recipient.address, web3.utils.toWei("100000", "ether"), { from: theAO });
			canTransferEth = true;
		} catch (e) {
			canTransferEth = false;
		}
		assert.equal(canTransferEth, true, "The AO can't transfer ETH out of contract");

		var recipientBalance = await web3.eth.getBalance(recipient.address);
		assert.equal(recipientBalance, web3.utils.toWei("100000", "ether"), "Recipient has incorrect balance");
	});
});
