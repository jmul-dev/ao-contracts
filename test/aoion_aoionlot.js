var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var Logos = artifacts.require("./Logos.sol");

var AOIon = artifacts.require("./AOIon.sol");
var AOIonLot = artifacts.require("./AOIonLot.sol");
var AOLibrary = artifacts.require("./AOLibrary.sol");
var AOSetting = artifacts.require("./AOSetting.sol");
var AOETH = artifacts.require("./AOETH.sol");

var TokenOne = artifacts.require("./TokenOne.sol");

var NameAccountRecovery = artifacts.require("./NameAccountRecovery.sol");
var NamePublicKey = artifacts.require("./NamePublicKey.sol");

var EthCrypto = require("eth-crypto");
var BigNumber = require("bignumber.js");
var helper = require("./helpers/truffleTestHelper");

BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: 1, EXPONENTIAL_AT: [-10, 40] }); // no rounding

contract("AOIon & AOIonLot", function(accounts) {
	var namefactory,
		taofactory,
		nametaoposition,
		logos,
		aoion,
		aoionlot,
		library,
		aosetting,
		aoeth,
		tokenone,
		nameaccountrecovery,
		namepublickey,
		settingTAOId,
		nameId1,
		nameId2,
		taoId,
		totalPrimordialForSale,
		percentageDivisor,
		startingPrimordialMultiplier,
		endingPrimordialMultiplier,
		startingNetworkBonusMultiplier,
		endingNetworkBonusMultiplier,
		accountRecoveryLockDuration;

	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var account4 = accounts[4];
	var whitelistedAddress = accounts[5];
	var someAddress = accounts[7];
	var aoDevTeam1 = accounts[8];
	var aoDevTeam2 = accounts[9];
	var emptyAddress = "0x0000000000000000000000000000000000000000";
	var recipient = EthCrypto.createIdentity();
	var account4PrivateKey = "0xfc164bb116857e2b7e5bafb6f515c61cc2cddae22a052c3988c8ff5de598ede0";

	var account1Lots = [];
	var account2Lots = [];
	var account3Lots = [];

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		logos = await Logos.deployed();
		aoion = await AOIon.deployed();
		aoionlot = await AOIonLot.deployed();
		library = await AOLibrary.deployed();
		aosetting = await AOSetting.deployed();
		aoeth = await AOETH.deployed();
		tokenone = await TokenOne.deployed();
		nameaccountrecovery = await NameAccountRecovery.deployed();
		namepublickey = await NamePublicKey.deployed();

		settingTAOId = await aoion.settingTAOId();
		percentageDivisor = await library.PERCENTAGE_DIVISOR();

		var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "accountRecoveryLockDuration");
		accountRecoveryLockDuration = settingValues[0];
	});

	contract("Variable settings", function() {
		it("should return correct name", async function() {
			var name = await aoion.name();
			assert.equal(name, "AO Ion", "Contract has the incorrect name");
		});

		it("should return correct symbol", async function() {
			var symbol = await aoion.symbol();
			assert.equal(symbol, "AOION", "Contract has the incorrect symbol");
		});

		it("should have the correct power of ten", async function() {
			var powerOfTen = await aoion.powerOfTen();
			assert.equal(powerOfTen, 0, "Contract has the incorrect power of ten");
		});

		it("should have 0 decimal", async function() {
			var decimals = await aoion.decimals();
			assert.equal(decimals, 0, "Contract has the incorrect decimals");
		});

		it("should have 0 initial supply", async function() {
			var totalSupply = await aoion.totalSupply();
			assert.equal(totalSupply.toNumber(), 0, "Contract has incorrect initial supply");
		});

		it("should have total of 1125899906842620 Primordial ions for sale", async function() {
			totalPrimordialForSale = new BigNumber(await aoion.TOTAL_PRIMORDIAL_FOR_SALE());
			assert.equal(totalPrimordialForSale.toNumber(), 1125899906842620, "Contract has incorrect total primordial for sale");
		});

		it("should have the correct AO Dev team 1 address", async function() {
			var aoDevTeam = await aoion.aoDevTeam1();
			assert.equal(aoDevTeam, aoDevTeam1, "Contract has incorrect aoDevTeam1");
		});

		it("should have the correct AO Dev team 2 address", async function() {
			var aoDevTeam = await aoion.aoDevTeam2();
			assert.equal(aoDevTeam, aoDevTeam2, "Contract has incorrect aoDevTeam2");
		});

		it("should have the correct starting multiplier for calculating primordial multiplier", async function() {
			var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "startingPrimordialMultiplier");
			startingPrimordialMultiplier = new BigNumber(settingValues[0]);
			assert.equal(startingPrimordialMultiplier.toNumber(), 50 * 10 ** 6, "Contract has incorrect startingPrimordialMultiplier");
		});

		it("should have the correct ending multiplier for calculating primordial multiplier", async function() {
			var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "endingPrimordialMultiplier");
			endingPrimordialMultiplier = new BigNumber(settingValues[0]);
			assert.equal(endingPrimordialMultiplier.toNumber(), 3 * 10 ** 6, "Contract has incorrect endingPrimordialMultiplier");
		});

		it("should have the correct starting network ion bonus multiplier for calculating network ion bonus amount", async function() {
			var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "startingNetworkBonusMultiplier");
			startingNetworkBonusMultiplier = new BigNumber(settingValues[0]);
			assert.equal(startingNetworkBonusMultiplier.toNumber(), 1000000, "Contract has incorrect startingNetworkBonusMultiplier");
		});

		it("should have the correct ending network ion bonus multiplier for calculating network ion bonus amount", async function() {
			var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "endingNetworkBonusMultiplier");
			endingNetworkBonusMultiplier = new BigNumber(settingValues[0]);
			assert.equal(endingNetworkBonusMultiplier.toNumber(), 250000, "Contract has incorrect endingNetworkBonusMultiplier");
		});
	});

	contract("AOIon - The AO Only", function() {
		before(async function() {
			// Create Name
			var result = await namefactory.createName("charlie", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
				from: account1
			});
			nameId1 = await namefactory.ethAddressToNameId(account1);

			// Mint Logos to nameId1
			await logos.setWhitelist(theAO, true, { from: theAO });
			await logos.mint(nameId1, 10 ** 12, { from: theAO });

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
			taoId = createTAOEvent.args.taoId;
		});

		it("The AO - transferOwnership() - should be able to transfer ownership to a TAO", async function() {
			var canTransferOwnership;
			try {
				await aoion.transferOwnership(taoId, { from: someAddress });
				canTransferOwnership = true;
			} catch (e) {
				canTransferOwnership = false;
			}
			assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

			try {
				await aoion.transferOwnership(taoId, { from: theAO });
				canTransferOwnership = true;
			} catch (e) {
				canTransferOwnership = false;
			}
			assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

			var newTheAO = await aoion.theAO();
			assert.equal(newTheAO, taoId, "Contract has incorrect TheAO address after transferring ownership");
		});

		it("The AO - setWhitelist() should be able to whitelist an address", async function() {
			var canSetWhitelist;
			try {
				await aoion.setWhitelist(whitelistedAddress, true, { from: someAddress });
				canSetWhitelist = true;
			} catch (e) {
				canSetWhitelist = false;
			}
			assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

			try {
				await aoion.setWhitelist(whitelistedAddress, true, { from: account1 });
				canSetWhitelist = true;
			} catch (e) {
				canSetWhitelist = false;
			}
			assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

			var whitelistStatus = await aoion.whitelist(whitelistedAddress);
			assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
		});

		it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
			var canSetAddress;
			try {
				await aoion.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

			try {
				await aoion.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

			var nameTAOPositionAddress = await aoion.nameTAOPositionAddress();
			assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
		});

		it("The AO - setNameAccountRecoveryAddress() should be able to set NameAccountRecovery address", async function() {
			var canSetAddress;
			try {
				await aoion.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set NameAccountRecovery address");

			try {
				await aoion.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set NameAccountRecovery address");

			var nameAccountRecoveryAddress = await aoion.nameAccountRecoveryAddress();
			assert.equal(nameAccountRecoveryAddress, nameaccountrecovery.address, "Contract has incorrect nameAccountRecoveryAddress");
		});

		it("The AO - freezeAccount() can freeze account", async function() {
			var canFreezeAccount;
			try {
				await aoion.freezeAccount(account2, true, { from: someAddress });
				canFreezeAccount = true;
			} catch (e) {
				canFreezeAccount = false;
			}
			assert.notEqual(canFreezeAccount, true, "Others can freeze account");
			try {
				await aoion.freezeAccount(account2, true, { from: account1 });
				canFreezeAccount = true;
			} catch (e) {
				canFreezeAccount = false;
			}
			assert.equal(canFreezeAccount, true, "The AO can't mint ion");
			var account2Frozen = await aoion.frozenAccount(account2);
			assert.equal(account2Frozen, true, "Account2 is not frozen after The AO froze his account");

			await aoion.freezeAccount(account2, false, { from: account1 });
		});

		it("The AO - setPrices() can set prices", async function() {
			var canSetPrices;
			try {
				await aoion.setPrices(2, 2, { from: someAddress });
				canSetPrices = true;
			} catch (e) {
				canSetPrices = false;
			}
			assert.notEqual(canSetPrices, true, "Others can set network ion prices");
			try {
				await aoion.setPrices(2, 2, { from: account1 });
				canSetPrices = true;
			} catch (e) {
				canSetPrices = false;
			}
			assert.equal(canSetPrices, true, "The AO can't set network ion prices");
			var sellPrice = await aoion.sellPrice();
			var buyPrice = await aoion.buyPrice();
			assert.equal(sellPrice.toNumber(), 2, "Incorrect sell price");
			assert.equal(buyPrice.toNumber(), 2, "Incorrect buy price");
		});

		it("The AO - setAOIonLotAddress() should be able to set AOIonLot address", async function() {
			var canSetAddress;
			try {
				await aoion.setAOIonLotAddress(aoionlot.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set AOIonLot address");

			try {
				await aoion.setAOIonLotAddress(aoionlot.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set AOIonLot address");

			var aoIonLotAddress = await aoion.aoIonLotAddress();
			assert.equal(aoIonLotAddress, aoionlot.address, "Contract has incorrect aoIonLotAddress");
		});

		it("The AO - setSettingTAOId() should be able to set settingTAOId", async function() {
			var canSetSettingTAOId;
			try {
				await aoion.setSettingTAOId(settingTAOId, { from: someAddress });
				canSetSettingTAOId = true;
			} catch (e) {
				canSetSettingTAOId = false;
			}
			assert.equal(canSetSettingTAOId, false, "Non-AO can set settingTAOId");

			try {
				await aoion.setSettingTAOId(settingTAOId, { from: account1 });
				canSetSettingTAOId = true;
			} catch (e) {
				canSetSettingTAOId = false;
			}
			assert.equal(canSetSettingTAOId, true, "The AO can't set settingTAOId");

			var _settingTAOId = await aoion.settingTAOId();
			assert.equal(_settingTAOId, settingTAOId, "Contract has incorrect settingTAOId");
		});

		it("The AO - setAOSettingAddress() should be able to set AOSetting address", async function() {
			var canSetAddress;
			try {
				await aoion.setAOSettingAddress(aosetting.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set AOSetting address");

			try {
				await aoion.setAOSettingAddress(aosetting.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set AOSetting address");

			var aoSettingAddress = await aoion.aoSettingAddress();
			assert.equal(aoSettingAddress, aosetting.address, "Contract has incorrect aoSettingAddress");
		});

		it("The AO - setAODevTeamAddresses() should update AO Dev team addresses", async function() {
			var canSet;
			try {
				await aoion.setAODevTeamAddresses(aoDevTeam1, aoDevTeam2, { from: someAddress });
				canSet = true;
			} catch (e) {
				canSet = false;
			}
			assert.notEqual(canSet, true, "Non-The AO account can set AO Dev team addresses");

			try {
				await aoion.setAODevTeamAddresses(aoDevTeam1, aoDevTeam2, { from: account1 });
				canSet = true;
			} catch (e) {
				canSet = false;
			}
			assert.equal(canSet, true, "The AO account can't set AO Dev team addresses");

			var _aoDevTeam1 = await aoion.aoDevTeam1();
			assert.equal(_aoDevTeam1, aoDevTeam1, "Contract has incorrect aoDevTeam1");

			var _aoDevTeam2 = await aoion.aoDevTeam2();
			assert.equal(_aoDevTeam2, aoDevTeam2, "Contract has incorrect aoDevTeam2");
		});

		it("The AO - setAOETHAddress() should be able to set AOETH address", async function() {
			var canSetAddress;
			try {
				await aoion.setAOETHAddress(aoeth.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set AOETH address");

			try {
				await aoion.setAOETHAddress(aoeth.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set AOETH address");

			var aoethAddress = await aoion.aoethAddress();
			assert.equal(aoethAddress, aoeth.address, "Contract has incorrect aoethAddress");
		});
	});

	contract("AOIonLot - The AO Only", function() {
		before(async function() {
			// Create Name
			var result = await namefactory.createName("charlie", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
				from: account1
			});
			nameId1 = await namefactory.ethAddressToNameId(account1);

			// Mint Logos to nameId1
			await logos.setWhitelist(theAO, true, { from: theAO });
			await logos.mint(nameId1, 10 ** 12, { from: theAO });

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
			taoId = createTAOEvent.args.taoId;
		});

		it("The AO - transferOwnership() - should be able to transfer ownership to a TAO", async function() {
			var canTransferOwnership;
			try {
				await aoionlot.transferOwnership(taoId, { from: someAddress });
				canTransferOwnership = true;
			} catch (e) {
				canTransferOwnership = false;
			}
			assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

			try {
				await aoionlot.transferOwnership(taoId, { from: theAO });
				canTransferOwnership = true;
			} catch (e) {
				canTransferOwnership = false;
			}
			assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

			var newTheAO = await aoionlot.theAO();
			assert.equal(newTheAO, taoId, "Contract has incorrect TheAO address after transferring ownership");
		});

		it("The AO - setWhitelist() should be able to whitelist an address", async function() {
			var canSetWhitelist;
			try {
				await aoionlot.setWhitelist(whitelistedAddress, true, { from: someAddress });
				canSetWhitelist = true;
			} catch (e) {
				canSetWhitelist = false;
			}
			assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

			try {
				await aoionlot.setWhitelist(whitelistedAddress, true, { from: account1 });
				canSetWhitelist = true;
			} catch (e) {
				canSetWhitelist = false;
			}
			assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

			var whitelistStatus = await aoionlot.whitelist(whitelistedAddress);
			assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
		});

		it("The AO - setAOIonAddress() should be able to set AOIon address", async function() {
			var canSetAddress;
			try {
				await aoionlot.setAOIonAddress(aoion.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set AOIon address");

			try {
				await aoionlot.setAOIonAddress(aoion.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set AOIon address");

			var aoIonAddress = await aoionlot.aoIonAddress();
			assert.equal(aoIonAddress, aoion.address, "Contract has incorrect aoIonAddress");
		});

		it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
			var canSetAddress;
			try {
				await aoionlot.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

			try {
				await aoionlot.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

			var nameTAOPositionAddress = await aoionlot.nameTAOPositionAddress();
			assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
		});
	});

	contract("Network Ion Function Tests", function() {
		before(async function() {
			await aoion.setWhitelist(whitelistedAddress, true, { from: theAO });

			// Create Name
			var result = await namefactory.createName("charlie", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
				from: account1
			});
			nameId1 = await namefactory.ethAddressToNameId(account1);

			result = await namefactory.createName("delta", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
				from: account2
			});
			nameId2 = await namefactory.ethAddressToNameId(account2);

			await nametaoposition.setListener(nameId1, nameId2, { from: account1 });

			var nonce = await namefactory.nonces(nameId1);
			var signHash = EthCrypto.hash.keccak256([
				{
					type: "address",
					value: namepublickey.address
				},
				{
					type: "address",
					value: nameId1
				},
				{
					type: "address",
					value: account4
				},
				{
					type: "uint256",
					value: nonce.plus(1).toNumber()
				}
			]);

			var signature = EthCrypto.sign(account4PrivateKey, signHash);
			var vrs = EthCrypto.vrs.fromString(signature);

			await namepublickey.addKey(nameId1, account4, nonce.plus(1).toNumber(), vrs.v, vrs.r, vrs.s, { from: account1 });
		});

		it("Whitelisted address - mint()  can mint", async function() {
			var canMint;
			try {
				await aoion.mint(account1, 100, { from: someAddress });
				canMint = true;
			} catch (e) {
				canMint = false;
			}
			assert.notEqual(canMint, true, "Others can mint");

			var balanceBefore = await aoion.balanceOf(account1);
			var totalSupplyBefore = await aoion.totalSupply();
			try {
				await aoion.mint(account1, 100, { from: whitelistedAddress });
				canMint = true;
			} catch (e) {
				canMint = false;
			}
			assert.equal(canMint, true, "The AO can't mint");

			var balanceAfter = await aoion.balanceOf(account1);
			var totalSupplyAfter = await aoion.totalSupply();

			assert.equal(balanceAfter.toNumber(), balanceBefore.plus(100).toNumber(), "Account1 has incorrect balance after minting");
			assert.equal(totalSupplyAfter.toNumber(), totalSupplyBefore.plus(100).toNumber(), "Contract has incorrect totalSupply");
		});

		it("WhitelistedAddress - stakeFrom() should be able to stake ions on behalf of others", async function() {
			var account1BalanceBefore = await aoion.balanceOf(account1);
			var account1StakedBalanceBefore = await aoion.stakedBalance(account1);
			var totalSupplyBefore = await aoion.totalSupply();

			var canStake;
			try {
				await aoion.stakeFrom(account1, 10, { from: someAddress });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "Account that do not have permission can stake on behalf of others");
			try {
				await aoion.stakeFrom(account1, 100000, { from: whitelistedAddress });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "Account can stake more than available balance");
			try {
				await aoion.stakeFrom(account1, 10, { from: whitelistedAddress });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.equal(canStake, true, "Account that has permission can't stake on behalf of others");

			var account1BalanceAfter = await aoion.balanceOf(account1);
			var account1StakedBalanceAfter = await aoion.stakedBalance(account1);
			var totalSupplyAfter = await aoion.totalSupply();

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.minus(10).toString(),
				"Account1 has incorrect balance after staking"
			);
			assert.equal(
				account1StakedBalanceAfter.toString(),
				account1StakedBalanceBefore.plus(10).toString(),
				"Account1 has incorrect staked balance after staking"
			);
			assert.equal(totalSupplyAfter.toString(), totalSupplyBefore.toString(), "Contract has incorrect total supply after staking");
		});

		it("Whitelisted address - unstakeFrom() should be able to unstake ions on behalf of others", async function() {
			var account1BalanceBefore = await aoion.balanceOf(account1);
			var account1StakedBalanceBefore = await aoion.stakedBalance(account1);
			var totalSupplyBefore = await aoion.totalSupply();

			var canUnstake;
			try {
				await aoion.unstakeFrom(account1, 10, { from: someAddress });
				canUnstake = true;
			} catch (e) {
				canUnstake = false;
			}
			assert.notEqual(canUnstake, true, "Account that do not have permission can unstake on behalf of others");
			try {
				await aoion.unstakeFrom(account1, 100000, { from: whitelistedAddress });
				canUnstake = true;
			} catch (e) {
				canUnstake = false;
			}
			assert.notEqual(canUnstake, true, "Account can unstake more than available balance");
			try {
				await aoion.unstakeFrom(account1, 10, { from: whitelistedAddress });
				canUnstake = true;
			} catch (e) {
				canUnstake = false;
			}
			assert.equal(canUnstake, true, "Account that has permission can't unstake on behalf of others");

			var account1BalanceAfter = await aoion.balanceOf(account1);
			var account1StakedBalanceAfter = await aoion.stakedBalance(account1);
			var totalSupplyAfter = await aoion.totalSupply();

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.plus(10).toString(),
				"Account1 has incorrect balance after unstaking"
			);
			assert.equal(
				account1StakedBalanceAfter.toString(),
				account1StakedBalanceBefore.minus(10).toString(),
				"Account1 has incorrect staked balance after unstaking"
			);
			assert.equal(totalSupplyAfter.toString(), totalSupplyBefore.toString(), "Contract has incorrect total supply after unstaking");
		});

		it("Whitelisted address - escrowFrom() should be able to escrow ions on behalf of others", async function() {
			var account1BalanceBefore = await aoion.balanceOf(account1);
			var account2BalanceBefore = await aoion.balanceOf(account2);
			var account2EscrowedBalanceBefore = await aoion.escrowedBalance(account2);
			var totalSupplyBefore = await aoion.totalSupply();

			var canEscrow;
			try {
				await aoion.escrowFrom(account1, account2, 10, { from: someAddress });
				canEscrow = true;
			} catch (e) {
				canEscrow = false;
			}
			assert.notEqual(canEscrow, true, "Account that do not have permission can escrow on behalf of others");
			try {
				await aoion.escrowFrom(account1, account2, 1000, { from: whitelistedAddress });
				canEscrow = true;
			} catch (e) {
				canEscrow = false;
			}
			assert.notEqual(canEscrow, true, "Account can escrow more than available balance");
			try {
				await aoion.escrowFrom(account1, account2, 10, { from: whitelistedAddress });
				canEscrow = true;
			} catch (e) {
				canEscrow = false;
			}
			assert.equal(canEscrow, true, "Account that has permission can't escrow on behalf of others");

			var account1BalanceAfter = await aoion.balanceOf(account1);
			var account2BalanceAfter = await aoion.balanceOf(account2);
			var account2EscrowedBalanceAfter = await aoion.escrowedBalance(account2);
			var totalSupplyAfter = await aoion.totalSupply();

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.minus(10).toString(),
				"Account1 has incorrect balance after escrow"
			);
			assert.equal(account2BalanceAfter.toString(), account2BalanceBefore.toString(), "Account2 has incorrect balance after escrow");
			assert.equal(
				account2EscrowedBalanceAfter.toString(),
				account2EscrowedBalanceBefore.plus(10).toString(),
				"Account2 has incorrect escrowed balance after escrow"
			);
			assert.equal(totalSupplyAfter.toString(), totalSupplyBefore.toString(), "Contract has incorrect total supply after escrow");
		});

		it("Whitelisted address - mintEscrow() should be able to mint and escrow ions to an account", async function() {
			var account1BalanceBefore = await aoion.balanceOf(account1);
			var account1EscrowedBalanceBefore = await aoion.escrowedBalance(account1);
			var totalSupplyBefore = await aoion.totalSupply();

			var canMintEscrow;
			try {
				await aoion.mintEscrow(account1, 10, { from: someAddress });
				canMintEscrow = true;
			} catch (e) {
				canMintEscrow = false;
			}
			assert.notEqual(canMintEscrow, true, "Account that do not have permission can mint and escrow");
			try {
				await aoion.mintEscrow(account1, 10, { from: whitelistedAddress });
				canMintEscrow = true;
			} catch (e) {
				canMintEscrow = false;
			}
			assert.equal(canMintEscrow, true, "Account that has permission can't mint and escrow");

			var account1BalanceAfter = await aoion.balanceOf(account1);
			var account1EscrowedBalanceAfter = await aoion.escrowedBalance(account1);
			var totalSupplyAfter = await aoion.totalSupply();

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.toString(),
				"Account1 has incorrect balance after mint and escrow"
			);
			assert.equal(
				account1EscrowedBalanceAfter.toString(),
				account1EscrowedBalanceBefore.plus(10).toString(),
				"Account1 has incorrect escrowed balance after mint and escrow"
			);
			assert.equal(
				totalSupplyAfter.toString(),
				totalSupplyBefore.plus(10).toString(),
				"Contract has incorrect total supply after mint and escrow"
			);
		});

		it("Whitelisted address - unescrowFrom() should be able to unescrow ions for an account", async function() {
			var account1BalanceBefore = await aoion.balanceOf(account1);
			var account1EscrowedBalanceBefore = await aoion.escrowedBalance(account1);
			var totalSupplyBefore = await aoion.totalSupply();

			var canUnescrow;
			try {
				await aoion.unescrowFrom(account1, 10, { from: someAddress });
				canUnescrow = true;
			} catch (e) {
				canUnescrow = false;
			}
			assert.notEqual(canUnescrow, true, "Account that do not have permission can unescrow ions on behalf of others");
			try {
				await aoion.unescrowFrom(account1, 100000, { from: whitelistedAddress });
				canUnescrow = true;
			} catch (e) {
				canUnescrow = false;
			}
			assert.notEqual(canUnescrow, true, "Account can unescrow more than available balance");
			try {
				await aoion.unescrowFrom(account1, 10, { from: whitelistedAddress });
				canUnescrow = true;
			} catch (e) {
				canUnescrow = false;
			}
			assert.equal(canUnescrow, true, "Account that has permission can't unescrow on behalf of others");

			var account1BalanceAfter = await aoion.balanceOf(account1);
			var account1EscrowedBalanceAfter = await aoion.escrowedBalance(account1);
			var totalSupplyAfter = await aoion.totalSupply();

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.plus(10).toString(),
				"Account1 has incorrect balance after unescrow"
			);
			assert.equal(
				account1EscrowedBalanceAfter.toString(),
				account1EscrowedBalanceBefore.minus(10).toString(),
				"Account1 has incorrect escrowed balance after unescrow"
			);
			assert.equal(totalSupplyAfter.toString(), totalSupplyBefore.toString(), "Contract has incorrect total supply after unescrow");
		});

		it("Whitelisted address - whitelistBurnFrom() should be able to burn ions on behalf of others", async function() {
			var account1BalanceBefore = await aoion.balanceOf(account1);
			var totalSupplyBefore = await aoion.totalSupply();

			var canBurn;
			try {
				await aoion.whitelistBurnFrom(account1, 10, { from: someAddress });
				canBurn = true;
			} catch (e) {
				canBurn = false;
			}
			assert.notEqual(canBurn, true, "Account that do not have permission can burn on behalf of others");
			try {
				await aoion.whitelistBurnFrom(account1, 1000000, { from: whitelistedAddress });
				canBurn = true;
			} catch (e) {
				canBurn = false;
			}
			assert.notEqual(canBurn, true, "Account can burn more than available balance");
			try {
				await aoion.whitelistBurnFrom(account1, 10, { from: whitelistedAddress });
				canBurn = true;
			} catch (e) {
				canBurn = false;
			}
			assert.equal(canBurn, true, "Account that has permission can't burn on behalf of others");

			var account1BalanceAfter = await aoion.balanceOf(account1);
			var totalSupplyAfter = await aoion.totalSupply();

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.minus(10).toString(),
				"Account1 has incorrect balance after burning"
			);
			assert.equal(
				totalSupplyAfter.toString(),
				totalSupplyBefore.minus(10).toString(),
				"Contract has incorrect total supply after burning"
			);
		});

		it("Whitelisted address - whitelistTransferFrom() should be able to transfer ions from an address to another address", async function() {
			var account1BalanceBefore = await aoion.balanceOf(account1);
			var account2BalanceBefore = await aoion.balanceOf(account2);
			var totalSupplyBefore = await aoion.totalSupply();

			var canTransferFrom;
			try {
				await aoion.whitelistTransferFrom(account1, account2, 10, { from: someAddress });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.notEqual(canTransferFrom, true, "Account that do not have permission can transfer on behalf of others");

			try {
				await aoion.whitelistTransferFrom(account1, account2, 1000000, { from: whitelistedAddress });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.notEqual(canTransferFrom, true, "Account can transfer more than available balance");

			try {
				await aoion.whitelistTransferFrom(account1, account2, 10, { from: whitelistedAddress });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.equal(canTransferFrom, true, "Account that has permission can't transfer on behalf of others");

			var account1BalanceAfter = await aoion.balanceOf(account1);
			var account2BalanceAfter = await aoion.balanceOf(account2);
			var totalSupplyAfter = await aoion.totalSupply();

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.minus(10).toString(),
				"Account1 has incorrect balance after transfer"
			);
			assert.equal(
				account2BalanceAfter.toString(),
				account2BalanceBefore.plus(10).toString(),
				"Account2 has incorrect balance after transfer"
			);
			assert.equal(totalSupplyAfter.toString(), totalSupplyBefore.toString(), "Contract has incorrect total supply after transfer");
		});

		it("buy() - user can buy network ions", async function() {
			await aoion.setPrices(1, 1, { from: theAO });

			var canBuy;
			try {
				await aoion.buy({ from: account2, value: 10 });
				canBuy = true;
			} catch (e) {
				canBuy = false;
			}
			assert.notEqual(canBuy, true, "Contract does not have enough network ion balance to complete user's ion purchase");
			await aoion.mint(aoion.address, 10 ** 20, { from: whitelistedAddress });

			var account2BalanceBefore = await aoion.balanceOf(account2);
			try {
				await aoion.buy({ from: account2, value: 10 });
				canBuy = true;
			} catch (e) {
				canBuy = false;
			}
			var account2BalanceAfter = await aoion.balanceOf(account2);
			assert.equal(canBuy, true, "Fail buying network ion from contract");
			assert.equal(
				account2BalanceAfter.toNumber(),
				account2BalanceBefore.plus(10).toNumber(),
				"Account has incorrect balance after buying ion"
			);
		});

		it("sell() - user can sell network ions to contract", async function() {
			await aoion.setPrices(100, 1, { from: theAO });

			var canSell;
			try {
				await aoion.sell(10, { from: account2 });
				canSell = true;
			} catch (e) {
				canSell = false;
			}
			assert.notEqual(canSell, true, "User can sell ions to contract even if contract does not have enough ETH balance");

			await aoion.setPrices(1, 1, { from: theAO });

			var account2BalanceBefore = await aoion.balanceOf(account2);
			var contractBalanceBefore = await aoion.balanceOf(aoion.address);

			try {
				await aoion.sell(5, { from: account2 });
				canSell = true;
			} catch (e) {
				canSell = false;
			}
			assert.equal(canSell, true, "Fail selling network ion to contract");

			var account2BalanceAfter = await aoion.balanceOf(account2);
			var contractBalanceAfter = await aoion.balanceOf(aoion.address);
			assert.equal(
				account2BalanceAfter.toNumber(),
				account2BalanceBefore.minus(5).toNumber(),
				"Account has incorrect balance after selling ion"
			);
			assert.equal(
				contractBalanceAfter.toNumber(),
				contractBalanceBefore.plus(5).toNumber(),
				"Contract has incorrect balance after user sell ion"
			);
		});

		it("transfer() - should send correct `_value` to `_to` from your account", async function() {
			var account1BalanceBefore = await aoion.balanceOf(account1);
			var account2BalanceBefore = await aoion.balanceOf(account2);
			await aoion.transfer(account2, 10, { from: account1 });
			account1BalanceAfter = await aoion.balanceOf(account1);
			account2BalanceAfter = await aoion.balanceOf(account2);
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.minus(10).toNumber(),
				"Account1 has incorrect balance after transfer"
			);
			assert.equal(
				account2BalanceAfter.toNumber(),
				account2BalanceBefore.plus(10).toNumber(),
				"Account2 has incorrect balance after transfer"
			);
		});

		it("burn() - should remove `_value` ions from the system irreversibly", async function() {
			var account1BalanceBefore = await aoion.balanceOf(account1);
			await aoion.burn(10, { from: account1 });
			account1BalanceAfter = await aoion.balanceOf(account1);
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.minus(10).toNumber(),
				"Account1 has incorrect balance after burn"
			);
		});

		it("approve() - should set allowance for other address", async function() {
			var account2AllowanceBefore = await aoion.allowance(account1, account2);
			await aoion.approve(account2, 10, { from: account1 });
			var account2AllowanceAfter = await aoion.allowance(account1, account2);
			assert.equal(
				account2AllowanceAfter.toNumber(),
				account2AllowanceBefore.plus(10).toNumber(),
				"Account2 has incorrect allowance after approve"
			);
		});

		it("transferFrom() - should send `_value` ions to `_to` in behalf of `_from`", async function() {
			var canTransferFrom;
			try {
				await aoion.transferFrom(account1, account2, 5, { from: someAddress });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.notEqual(canTransferFrom, true, "Account that was not approved is able to transfer on behalf of other");

			try {
				await aoion.transferFrom(account1, account2, 1000, { from: account2 });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.notEqual(
				canTransferFrom,
				true,
				"Account that was approved is able to transfer more than it's allowance on behalf of other"
			);

			var account1BalanceBefore = await aoion.balanceOf(account1);
			var account2BalanceBefore = await aoion.balanceOf(account2);
			var account2AllowanceBefore = await aoion.allowance(account1, account2);

			try {
				await aoion.transferFrom(account1, account2, 5, { from: account2 });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.equal(canTransferFrom, true, "Account that was approved is not able to transfer on behalf of other");

			var account1BalanceAfter = await aoion.balanceOf(account1);
			var account2BalanceAfter = await aoion.balanceOf(account2);
			var account2AllowanceAfter = await aoion.allowance(account1, account2);
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.minus(5).toNumber(),
				"Account1 has incorrect balance after transferFrom"
			);
			assert.equal(
				account2BalanceAfter.toNumber(),
				account2BalanceBefore.plus(5).toNumber(),
				"Account2 has incorrect balance after transferFrom"
			);
			assert.equal(
				account2AllowanceAfter.toNumber(),
				account2AllowanceBefore.minus(5).toNumber(),
				"Account2 has incorrect allowance after transferFrom"
			);
		});

		it("burnFrom() - should remove `_value` ions from the system irreversibly on behalf of `_from`", async function() {
			var canBurnFrom;
			try {
				await aoion.burnFrom(account1, 5, { from: someAddress });
				canBurnFrom = true;
			} catch (e) {
				canBurnFrom = false;
			}
			assert.notEqual(canBurnFrom, true, "Account that was not approved is able to burn on behalf of other");

			try {
				await aoion.burnFrom(account1, 10, { from: account2 });
				canBurnFrom = true;
			} catch (e) {
				canBurnFrom = false;
			}
			assert.notEqual(canBurnFrom, true, "Account that was approved is able to burn more than it's allowance on behalf of other");

			var account1BalanceBefore = await aoion.balanceOf(account1);
			var account2AllowanceBefore = await aoion.allowance(account1, account2);

			try {
				await aoion.burnFrom(account1, 5, { from: account2 });
				canBurnFrom = true;
			} catch (e) {
				canBurnFrom = false;
			}
			assert.equal(canBurnFrom, true, "Account that was approved is not able to burn on behalf of other");

			var account1BalanceAfter = await aoion.balanceOf(account1);
			var account2AllowanceAfter = await aoion.allowance(account1, account2);

			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.minus(5).toNumber(),
				"Account1 has incorrect balance after burnFrom"
			);
			assert.equal(
				account2AllowanceAfter.toNumber(),
				account2AllowanceBefore.minus(5).toNumber(),
				"Account2 has incorrect allowance after burnFrom"
			);
		});

		it("frozen account should NOT be able to transfer", async function() {
			await aoion.freezeAccount(account1, true, { from: theAO });

			var canTransfer;
			try {
				await aoion.transfer(account2, 10, { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.notEqual(canTransfer, true, "Frozen account can transfer");

			// Unfreeze account1
			await aoion.freezeAccount(account1, false, { from: theAO });
		});

		it("transferBetweenPublicKeys() - should be able to transfer ions between public keys in a Name", async function() {
			var canTransfer;
			var transferAmount = 10;

			try {
				await aoion.transferBetweenPublicKeys(someAddress, account1, account4, transferAmount, { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, false, "Can transfer AO Ion between public keys for a non-Name");

			try {
				await aoion.transferBetweenPublicKeys(nameId1, account1, account4, transferAmount, { from: account2 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, false, "Non-Advocate of Name transfer AO Ion between public keys");

			try {
				await aoion.transferBetweenPublicKeys(nameId1, account2, account4, transferAmount, { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, false, "Advocate of Name transfer AO Ion from an address that is not listed as public key");

			try {
				await aoion.transferBetweenPublicKeys(nameId1, account1, account2, transferAmount, { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, false, "Advocate of Name transfer AO Ion to an address that is not listed as public key");

			var account1Balance = await aoion.balanceOf(account1);

			try {
				await aoion.transferBetweenPublicKeys(nameId1, account1, account4, account1Balance.plus(1).toNumber(), { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, false, "Advocate of Name transfer AO Ion more than from address' owned balance");

			// Listener submit account recovery for nameId1
			await nameaccountrecovery.submitAccountRecovery(nameId1, { from: account2 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			try {
				await aoion.transferBetweenPublicKeys(nameId1, account1, account4, transferAmount, { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, false, "Compromised Advocate of Name can transfer AO Ion between public keys");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.plus(100).toNumber());

			var account1BalanceBefore = await aoion.balanceOf(account1);
			var account4BalanceBefore = await aoion.balanceOf(account4);

			try {
				await aoion.transferBetweenPublicKeys(nameId1, account1, account4, transferAmount, { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, true, "Advocate of Name can't transfer AO Ion between public keys");

			var account1BalanceAfter = await aoion.balanceOf(account1);
			var account4BalanceAfter = await aoion.balanceOf(account4);
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.minus(transferAmount).toNumber(),
				"Account has incorrect balance"
			);
			assert.equal(
				account4BalanceAfter.toNumber(),
				account4BalanceBefore.plus(transferAmount).toNumber(),
				"Account has incorrect balance"
			);
		});

		it("The AO - transferETH() should be able to transfer ETH to an address", async function() {
			await aoion.buy({ from: account2, value: web3.toWei(2, "ether") });

			var canTransferEth;
			try {
				await aoion.transferEth(recipient.address, web3.toWei(1, "ether"), { from: someAddress });
				canTransferEth = true;
			} catch (e) {
				canTransferEth = false;
			}
			assert.equal(canTransferEth, false, "Non-AO can transfer ETH out of contract");

			try {
				await aoion.transferEth(emptyAddress, web3.toWei(1, "ether"), { from: theAO });
				canTransferEth = true;
			} catch (e) {
				canTransferEth = false;
			}
			assert.equal(canTransferEth, false, "The AO can transfer ETH out of contract to invalid address");

			try {
				await aoion.transferEth(recipient.address, web3.toWei(1000, "ether"), { from: theAO });
				canTransferEth = true;
			} catch (e) {
				canTransferEth = false;
			}
			assert.equal(canTransferEth, false, "The AO can transfer ETH out of contract more than its available balance");

			try {
				await aoion.transferEth(recipient.address, web3.toWei(1, "ether"), { from: theAO });
				canTransferEth = true;
			} catch (e) {
				canTransferEth = false;
			}
			assert.equal(canTransferEth, true, "The AO can't transfer ETH out of contract");

			var recipientBalance = await web3.eth.getBalance(recipient.address);
			assert.equal(recipientBalance.toNumber(), web3.toWei(1, "ether"), "Recipient has incorrect balance");
		});
	});

	contract("Primordial Ion Function Tests", function() {
		var stakedPrimordialWeightedMultiplier;

		var buyPrimordial = async function(amount, account, accountLots, withEth) {
			var totalEthForPrimordialBefore = await aoion.totalEthForPrimordial();
			var availablePrimordialForSaleBefore = await aoion.availablePrimordialForSale();
			var availableETHBefore = await aoion.availableETH();
			var totalRedeemedAOETHBefore = await aoion.totalRedeemedAOETH();
			var accountAOETHBalanceBefore = await aoeth.balanceOf(account);
			var aoionAOETHBalanceBefore = await aoeth.balanceOf(aoion.address);

			var aoethTotalSupply = await aoeth.totalSupply();

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
			var ionAmount = new BigNumber(amount).div(primordialBuyPrice);
			if (withEth && new BigNumber(amount).gt(availableETHBefore)) {
				ionAmount = new BigNumber(availableETHBefore).div(primordialBuyPrice);
			}

			if (primordialTotalBoughtBefore.plus(ionAmount).gte(totalPrimordialForSale)) {
				ionAmount = totalPrimordialForSale.minus(primordialTotalBoughtBefore);
			}

			var hasRemainder = false;
			if (new BigNumber(amount).gt(ionAmount.times(primordialBuyPrice))) {
				hasRemainder = true;
			}
			var remainderAmount = new BigNumber(0);

			var bonus = await aoion.calculateMultiplierAndBonus(ionAmount.toNumber());

			var inverseMultiplier = startingPrimordialMultiplier.minus(bonus[0]);
			var theAONetworkBonusAmount = startingNetworkBonusMultiplier
				.minus(bonus[1])
				.plus(endingNetworkBonusMultiplier)
				.times(ionAmount)
				.div(percentageDivisor);

			var accountWeightedMultiplierBefore = await aoion.weightedMultiplierByAddress(account);

			var _event = aoionlot.LotCreation();
			_event.watch(async function(error, log) {
				if (!error) {
					if (log.args.lotOwner == account) {
						assert.equal(log.args.multiplier.toString(), bonus[0].toString(), "Account Lot Creation has incorrect multiplier");
						assert.equal(
							log.args.primordialAmount.toString(),
							ionAmount.toString(),
							"Account Lot Creation has incorrect amount"
						);
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
				if (withEth) {
					var result = await aoion.buyPrimordial({ from: account, value: amount });
				} else {
					var result = await aoion.buyPrimordialWithAOETH(amount, { from: account });
				}
				events = result.logs;
				canBuy = true;
			} catch (e) {
				events = null;
				canBuy = false;
			}
			assert.equal(canBuy, true, "Account can't buy primordial ion");
			assert.notEqual(events, null, "Contract didn't emit events during buy primordial ion transaction");

			var halfAmount = new BigNumber(ionAmount).div(2);
			var halfTheAONetworkBonusAmount = new BigNumber(theAONetworkBonusAmount).div(2);

			var accountLotId;
			for (var i = 0; i < events.length; i++) {
				var _event = events[i];
				switch (_event.event) {
					case "BuyPrimordial":
						if (_event.args.lotOwner == account) {
							accountLotId = _event.args.lotId;
							remainderAmount = _event.args.refundedAmount;

							if (hasRemainder) {
								assert.isAbove(remainderAmount.toNumber(), 0, "Event has incorrect refundedAmount");
							}

							assert.equal(_event.args.payWith.toNumber(), withEth ? 1 : 2, "Event has incorrect payWith value");
						}
						break;
					default:
						break;
				}
			}

			var totalEthForPrimordialAfter = await aoion.totalEthForPrimordial();
			var availablePrimordialForSaleAfter = await aoion.availablePrimordialForSale();
			var availableETHAfter = await aoion.availableETH();
			var totalRedeemedAOETHAfter = await aoion.totalRedeemedAOETH();
			var accountAOETHBalanceAfter = await aoeth.balanceOf(account);
			var aoionAOETHBalanceAfter = await aoeth.balanceOf(aoion.address);

			if (withEth) {
				assert.equal(
					totalEthForPrimordialAfter.toNumber(),
					totalEthForPrimordialBefore
						.plus(amount)
						.minus(remainderAmount)
						.toNumber(),
					"Contract has incorrect value for totalEthForPrimordial"
				);
				assert.equal(
					availableETHAfter.toNumber(),
					availablePrimordialForSaleAfter.toNumber() == 1
						? primordialBuyPrice.toNumber()
						: availableETHBefore.minus(ionAmount.times(primordialBuyPrice)).toNumber(),
					"Contract has incorrect value for availableETH"
				);
				assert.equal(
					totalRedeemedAOETHAfter.toNumber(),
					totalRedeemedAOETHBefore.toNumber(),
					"Contract has incorrect value for totalRedeemedAOETH"
				);
				assert.equal(
					accountAOETHBalanceAfter.toNumber(),
					accountAOETHBalanceBefore.toNumber(),
					"Account has incorrect AOETH balance"
				);
				assert.equal(aoionAOETHBalanceAfter.toNumber(), aoionAOETHBalanceBefore.toNumber(), "AOIon has incorrect AOETH balance");
			} else {
				assert.equal(
					totalEthForPrimordialAfter.toNumber(),
					totalEthForPrimordialBefore.toNumber(),
					"Contract has incorrect value for totalEthForPrimordial"
				);
				assert.equal(availableETHAfter.toNumber(), availableETHBefore.toNumber(), "Contract has incorrect value for availableETH");
				assert.equal(
					totalRedeemedAOETHAfter.toNumber(),
					totalRedeemedAOETHBefore
						.plus(amount)
						.minus(remainderAmount)
						.toNumber(),
					"Contract has incorrect value for totalRedeemedAOETH"
				);
				assert.equal(
					accountAOETHBalanceAfter.toNumber(),
					accountAOETHBalanceBefore
						.minus(amount)
						.plus(remainderAmount)
						.toNumber(),
					"Account has incorrect AOETH balance"
				);
				assert.equal(
					aoionAOETHBalanceAfter.toNumber(),
					aoionAOETHBalanceBefore
						.plus(amount)
						.minus(remainderAmount)
						.toNumber(),
					"AOIon has incorrect AOETH balance"
				);
			}
			assert.equal(
				availablePrimordialForSaleAfter.toNumber(),
				availablePrimordialForSaleBefore.minus(ionAmount).toNumber(),
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

			assert.equal(totalLotsAfter.toString(), totalLotsBefore.plus(3).toString(), "Contract has incorrect totalLots");
			assert.equal(
				primordialTotalBoughtAfter.toString(),
				primordialTotalBoughtBefore.plus(ionAmount).toString(),
				"Contract has incorrect primordialTotalBought"
			);
			assert.equal(
				primordialTotalSupplyAfter.toString(),
				primordialTotalSupplyBefore
					.plus(ionAmount)
					.plus(halfAmount)
					.plus(halfAmount)
					.toString(),
				"Contract has incorrect primordialTotalSupply"
			);

			assert.equal(
				accountPrimordialBalanceAfter.toString(),
				accountPrimordialBalanceBefore.plus(ionAmount).toString(),
				"Account has incorrect primordial balance"
			);
			assert.equal(
				accountNetworkBalanceAfter.toString(),
				accountNetworkBalanceBefore.plus(bonus[2]).toString(),
				"Account has incorrect network balance"
			);
			assert.equal(accountTotalLotsAfter.toString(), accountTotalLotsBefore.plus(1).toString(), "Account has incorrect totalLots");

			assert.equal(
				aoDevTeam1PrimordialBalanceAfter.toString(),
				aoDevTeam1PrimordialBalanceBefore.plus(halfAmount).toString(),
				"aoDevTeam1 has incorrect primordial balance"
			);
			assert.equal(
				aoDevTeam1NetworkBalanceAfter.toString(),
				aoDevTeam1NetworkBalanceBefore.plus(halfTheAONetworkBonusAmount).toString(),
				"aoDevTeam1 has incorrect network balance"
			);

			assert.equal(
				aoDevTeam2PrimordialBalanceAfter.toString(),
				aoDevTeam2PrimordialBalanceBefore.plus(halfAmount).toString(),
				"aoDevTeam2 has incorrect primordial balance"
			);
			assert.equal(
				aoDevTeam2NetworkBalanceAfter.toString(),
				aoDevTeam2NetworkBalanceBefore.plus(halfTheAONetworkBonusAmount).toString(),
				"aoDevTeam2 has incorrect network balance"
			);

			assert.equal(
				theAOPrimordialBalanceAfter.toString(),
				theAOPrimordialBalanceBefore.toString(),
				"The AO has incorrect primordial balance"
			);
			assert.equal(
				theAONetworkBalanceAfter.toString(),
				theAONetworkBalanceBefore.plus(theAONetworkBonusAmount).toString(),
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
				accountWeightedMultiplierBefore.toNumber(),
				accountPrimordialBalanceBefore.toNumber(),
				accountLot[2].toNumber(),
				accountLot[3].toNumber()
			);

			var accountWeightedMultiplier = await aoion.weightedMultiplierByAddress(account);
			assert.equal(
				accountWeightedMultiplier.toString(),
				newWeightedMultiplier.toString(),
				"Account has incorrect weighted multiplier"
			);

			// Check max multiplier for the account
			// should be the same as multiplier from account's lot #1
			var maxMultiplier = await aoion.maxMultiplierByAddress(account);
			assert.equal(maxMultiplier.toString(), accountLots[0][2].toString(), "Account has incorrect maxMultiplier");

			return accountLotId;
		};

		var debug = async function(account) {
			var totalEthForPrimordial = await aoion.totalEthForPrimordial();
			var availablePrimordialForSale = await aoion.availablePrimordialForSale();
			var aoethTotalSupply = await aoeth.totalSupply();
			var primordialTotalBought = await aoion.primordialTotalBought();
			var availableETH = await aoion.availableETH();
			var totalRedeemedAOETH = await aoion.totalRedeemedAOETH();
			var accountAOETHBalance = await aoeth.balanceOf(account);
			var aoionAOETHBalance = await aoeth.balanceOf(aoion.address);

			console.log("Total ETH For Primordial", totalEthForPrimordial.toNumber());
			console.log("Available Primordial For Sale", availablePrimordialForSale.toNumber());
			console.log("AOETH Total Supply", aoethTotalSupply.toNumber());
			console.log("Primordial Total Bought", primordialTotalBought.toNumber());
			console.log("Available ETH", availableETH.toNumber());
			console.log("Total Redeemed AOETH", totalRedeemedAOETH.toNumber());
			console.log("Account AOETH", accountAOETHBalance.toNumber());
			console.log("AOIon AOETH", aoionAOETHBalance.toNumber());
		};

		before(async function() {
			// Need to re-set theAO address because the migration script sets theAO to primordialTAOId
			await aoion.transferOwnership(theAO, { from: theAO });

			await aoion.setWhitelist(whitelistedAddress, true, { from: theAO });

			// Create Name
			var result = await namefactory.createName("charlie", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
				from: account1
			});
			nameId1 = await namefactory.ethAddressToNameId(account1);

			result = await namefactory.createName("delta", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
				from: account2
			});
			nameId2 = await namefactory.ethAddressToNameId(account2);

			await nametaoposition.setListener(nameId1, nameId2, { from: account1 });

			var nonce = await namefactory.nonces(nameId1);
			var signHash = EthCrypto.hash.keccak256([
				{
					type: "address",
					value: namepublickey.address
				},
				{
					type: "address",
					value: nameId1
				},
				{
					type: "address",
					value: account4
				},
				{
					type: "uint256",
					value: nonce.plus(1).toNumber()
				}
			]);

			var signature = EthCrypto.sign(account4PrivateKey, signHash);
			var vrs = EthCrypto.vrs.fromString(signature);

			await namepublickey.addKey(nameId1, account4, nonce.plus(1).toNumber(), vrs.v, vrs.r, vrs.s, { from: account1 });

			// Give account 1 some aoeth tokens
			await aoeth.addERC20Token(tokenone.address, 1, 10 ** 6, { from: theAO });
			await tokenone.transfer(account1, 10 ** 6, { from: theAO });
			await tokenone.approveAndCall(aoeth.address, 10 ** 6, "", { from: account1 });
		});

		it("The AO - setPrimordialPrices() can set Primordial prices", async function() {
			var canSetPrimordialPrices;
			try {
				await aoion.setPrimordialPrices(100, 100, { from: someAddress });
				canSetPrimordialPrices = true;
			} catch (e) {
				canSetPrimordialPrices = false;
			}
			assert.notEqual(canSetPrimordialPrices, true, "Others can set Primordial ion prices");
			try {
				await aoion.setPrimordialPrices(100, 100, { from: theAO });
				canSetPrimordialPrices = true;
			} catch (e) {
				canSetPrimordialPrices = false;
			}
			assert.equal(canSetPrimordialPrices, true, "The AO can't set Primordial ion prices");
			var primordialSellPrice = await aoion.primordialSellPrice();
			var primordialBuyPrice = await aoion.primordialBuyPrice();
			assert.equal(primordialSellPrice.toNumber(), 100, "Incorrect Primordial sell price");
			assert.equal(primordialBuyPrice.toNumber(), 100, "Incorrect Primordial buy price");

			// reset primordial prices
			await aoion.setPrimordialPrices(0, 10000, { from: theAO });
		});

		it("calculateMultiplierAndBonus() - should calculate the primordial ion multiplier, bonus network ion percentage and the bonus network ion amount on a given lot when account purchases primordial ion during network exchange", async function() {
			var primordialTotalBought = await aoion.primordialTotalBought();
			var purchaseAmount = 10000;
			var primordialMultiplier = await library.calculatePrimordialMultiplier(
				purchaseAmount,
				totalPrimordialForSale.toString(),
				primordialTotalBought.toString(),
				startingPrimordialMultiplier.toString(),
				endingPrimordialMultiplier.toString()
			);
			var bonusPercentage = await library.calculateNetworkBonusPercentage(
				purchaseAmount,
				totalPrimordialForSale.toString(),
				primordialTotalBought.toString(),
				startingNetworkBonusMultiplier.toString(),
				endingNetworkBonusMultiplier.toString()
			);
			var bonusAmount = await library.calculateNetworkBonusAmount(
				purchaseAmount,
				totalPrimordialForSale.toString(),
				primordialTotalBought.toString(),
				startingNetworkBonusMultiplier.toString(),
				endingNetworkBonusMultiplier.toString()
			);

			var multiplierAndBonus = await aoion.calculateMultiplierAndBonus(purchaseAmount);
			assert.equal(
				multiplierAndBonus[0].toString(),
				primordialMultiplier.toString(),
				"calculateMultiplierAndBonus() returns incorrect primordial multiplier"
			);
			assert.equal(
				multiplierAndBonus[1].toString(),
				bonusPercentage.toString(),
				"calculateMultiplierAndBonus() returns incorrect bonus percentage"
			);
			assert.equal(
				multiplierAndBonus[2].toString(),
				bonusAmount.toString(),
				"calculateMultiplierAndBonus() returns incorrect bonus amount"
			);
		});

		it("buyPrimordial() - buy Primordial ions from contract by sending ETH", async function() {
			var canBuy;
			try {
				await aoion.buyPrimordial({ from: account1, value: 0 });
				canBuy = true;
			} catch (e) {
				canBuy = false;
			}
			assert.equal(canBuy, false, "Buy Primordial ion succeeded even though user sent 0 ETH");
			await buyPrimordial(web3.toWei(2, "ether"), account1, account1Lots, true);
		});

		it("buyPrimordial() - should re-calculate existing `account` lots' indexes and update his/her overall weighted index", async function() {
			await buyPrimordial(web3.toWei(3, "ether"), account1, account1Lots, true);
			await buyPrimordial(web3.toWei(5, "ether"), account1, account1Lots, true);
		});

		it("buyPrimordialWithAOETH() - buy Primordial ions from contract by sending AOETH", async function() {
			var canBuy;
			try {
				await aoion.buyPrimordialWithAOETH(100, { from: account2 });
				canBuy = true;
			} catch (e) {
				canBuy = false;
			}
			assert.equal(canBuy, false, "Account can buy primordial ion with AOETH even though he/she does not have enough balance");

			await buyPrimordial(10 ** 5, account1, account1Lots, false);
		});

		it("buyPrimordialWithAOETH() - should re-calculate existing `account` lots' indexes and update his/her overall weighted index", async function() {
			await buyPrimordial(2 * 10 ** 5, account1, account1Lots, false);
			await buyPrimordial(8 * 10 ** 4, account1, account1Lots, false);
		});

		it("should NOT allow buy Primordial if Total Primordial For Sale cap is reached (network exchange has ended)", async function() {
			var availableETH = new BigNumber(await aoion.availableETH());
			var primordialBuyPrice = new BigNumber(await aoion.primordialBuyPrice());
			var ionAmount = availableETH.div(primordialBuyPrice);

			// Sending more ETH than we should to check whether or not the user receives the remainder ETH
			await buyPrimordial(availableETH.toNumber(), account2, account2Lots, true);

			var account2PrimordialBalance = await aoion.primordialBalanceOf(account2);
			assert.equal(
				account2PrimordialBalance.toString(),
				ionAmount.toString(),
				"Account2 has incorrect Primordial balance after buy Primordial transaction"
			);

			var networkExchangeEnded = await aoion.networkExchangeEnded();
			assert.equal(networkExchangeEnded, false, "Network exchange is ended before reaching sale cap");

			// Buy the rest with aoeth
			var accountAOETHBalance = await aoeth.balanceOf(account1);
			await buyPrimordial(accountAOETHBalance.toNumber(), account1, account1Lots, false);

			var networkExchangeEnded = await aoion.networkExchangeEnded();
			assert.equal(networkExchangeEnded, true, "Network exchange is not ended when total Primordial for sale cap is reached");

			var canBuy;
			try {
				await aoion.buyPrimordial({ from: account2, value: web3.toWei(5, "ether") });
				canBuy = true;
			} catch (e) {
				canBuy = false;
			}
			assert.equal(canBuy, false, "Buy Primordial ion succeeded even though Network exchange has ended");
		});

		it("transferPrimordial() - should send correct `_value` to `_to` from your account", async function() {
			var account1PrimordialBalanceBefore = await aoion.primordialBalanceOf(account1);
			var account3PrimordialBalanceBefore = await aoion.primordialBalanceOf(account3);
			var account1WeightedMultiplierBefore = await aoion.weightedMultiplierByAddress(account1);
			var account3WeightedMultiplierBefore = await aoion.weightedMultiplierByAddress(account3);

			var totalLotsBefore = await aoionlot.totalLots();
			var primordialTotalSupplyBefore = await aoion.primordialTotalSupply();

			var _event = aoionlot.LotCreation();
			_event.watch(async function(error, log) {
				if (!error) {
					if (log.args.lotOwner == account) {
						var accountLotId = log.args.lotId;
						assert.equal(
							log.args.multiplier.toString(),
							account1WeightedMultiplierBefore.toString(),
							"Account Lot Creation has incorrect multiplier"
						);
						assert.equal(log.args.primordialAmount.toString(), 100, "Account Lot Creation has incorrect amount");
						assert.equal(log.args.networkBonusAmount.toString(), 0, "Account Lot Creation has incorrect networkBonusAmount");

						var account1PrimordialBalanceAfter = await aoion.primordialBalanceOf(account1);
						var account3PrimordialBalanceAfter = await aoion.primordialBalanceOf(account3);
						var account1WeightedMultiplierAfter = await aoion.weightedMultiplierByAddress(account1);
						var account3WeightedMultiplierAfter = await aoion.weightedMultiplierByAddress(account3);

						var totalLotsAfter = await aoionlot.totalLots();
						var primordialTotalSupplyAfter = await aoion.primordialTotalSupply();

						assert.equal(
							account1PrimordialBalanceAfter.toString(),
							account1PrimordialBalanceBefore.minus(100).toString(),
							"Account1 has incorrect primordial balance"
						);
						assert.equal(
							account3PrimordialBalanceAfter.toString(),
							account3PrimordialBalanceBefore.plus(100).toString(),
							"Account3 has incorrect primordial balance"
						);
						assert.equal(
							account1WeightedMultiplierAfter.toString(),
							account1WeightedMultiplierBefore.toString(),
							"Account1 has incorrect weighted multiplier"
						);

						assert.equal(totalLotsAfter.toString(), totalLotsBefore.plus(1).toString(), "Contract has incorrect totalLots");
						assert.equal(
							primordialTotalSupplyAfter.toString(),
							primordialTotalSupplyBefore.toString(),
							"Contract has incorrect primordialTotalSupply"
						);

						// Make sure the Lot is stored correctly
						var accountLot = await aoionlot.lotById(accountLotId);
						assert.equal(accountLot[0], accountLotId, "Lot has incorrect ID");
						assert.equal(accountLot[1], account3, "Lot has incorrect lot owner");
						assert.equal(accountLot[2].toString(), account1WeightedMultiplierAfter.toString(), "Lot has incorrect multiplier");
						assert.equal(accountLot[3].toString(), 100, "Lot has incorrect amount");

						account3Lots.push(accountLot);

						var newWeightedMultiplier = await library.calculateWeightedMultiplier(
							account3WeightedMultiplierBefore.toNumber(),
							account3PrimordialBalanceBefore.toNumber(),
							accountLot[2].toNumber(),
							accountLot[3].toNumber()
						);

						assert.equal(
							account3WeightedMultiplierAfter.toString(),
							newWeightedMultiplier.toString(),
							"Account3 has incorrect weighted multiplier"
						);
					}
				}
			});
			_event.stopWatching();

			var canTransfer, events;
			try {
				var result = await aoion.transferPrimordial(account3, 100, { from: account1 });
				events = result.logs;
				canTransfer = true;
			} catch (e) {
				events = null;
				canTransfer = false;
			}
			assert.equal(canTransfer, true, "Account1 can't transfer primordial ion");
			assert.notEqual(events, null, "Contract didn't emit events during transfer primordial ion");
		});

		it("maxMultiplierByAddress() - should return the max multiplier of an address (the multiplier of the first lot of the account)", async function() {
			var maxMultiplier = await aoion.maxMultiplierByAddress(account1);
			assert.equal(maxMultiplier.toString(), account1Lots[0][2].toString(), "Account1 has incorrect max multiplier");

			maxMultiplier = await aoion.maxMultiplierByAddress(account2);
			assert.equal(maxMultiplier.toString(), account2Lots[0][2].toString(), "Account2 has incorrect max multiplier");
		});

		it("calculateMaximumBurnAmount() - should return the maximum amount of primordial an account can burn", async function() {
			var accountPrimordialBalance = await aoion.primordialBalanceOf(account1);
			var accountWeightedMultiplier = await aoion.weightedMultiplierByAddress(account1);
			var accountMaxMultiplier = await aoion.maxMultiplierByAddress(account1);
			var _maxBurnAmount = await library.calculateMaximumBurnAmount(
				accountPrimordialBalance.toString(),
				accountWeightedMultiplier.toString(),
				accountMaxMultiplier.toString()
			);

			var maxBurnAmount = await aoion.calculateMaximumBurnAmount(account1);

			assert.equal(
				maxBurnAmount.toString(),
				_maxBurnAmount.toString(),
				"calculateMaximumBurnAmount() returns incorrect max burn amount"
			);
		});

		it("calculateMultiplierAfterBurn() - should return the new multiplier after burn primordial ions", async function() {
			var accountPrimordialBalance = await aoion.primordialBalanceOf(account1);
			var accountWeightedMultiplier = await aoion.weightedMultiplierByAddress(account1);
			var maxBurnAmount = await aoion.calculateMaximumBurnAmount(account1);
			var accountMaxMultiplier = await aoion.maxMultiplierByAddress(account1);
			var canCalculate, multiplierAfterBurn;
			try {
				multiplierAfterBurn = await aoion.calculateMultiplierAfterBurn(account1, maxBurnAmount.plus(100).toString());
				canCalculate = true;
			} catch (e) {
				multiplierAfterBurn = null;
				canCalculate = false;
			}
			assert.equal(canCalculate, false, "calculateMultiplierAfterBurn() returns result even though amount to burn > max burn amount");
			var burnAmount = maxBurnAmount.minus(10);
			try {
				multiplierAfterBurn = await aoion.calculateMultiplierAfterBurn(account1, burnAmount.toString());
				canCalculate = true;
			} catch (e) {
				multiplierAfterBurn = null;
				canCalculate = false;
			}
			assert.equal(canCalculate, true, "calculateMultiplierAfterBurn() failed even though amount to burn <= max burn amount");

			var _multiplierAfterBurn = await library.calculateMultiplierAfterBurn(
				accountPrimordialBalance.toString(),
				accountWeightedMultiplier.toString(),
				burnAmount.toString()
			);

			assert.equal(
				multiplierAfterBurn.toString(),
				_multiplierAfterBurn.toString(),
				"calculateMultiplierAfterBurn() returns incorrect multiplier"
			);
		});

		it("burnPrimordial() - should remove `_value` ions from the system irreversibly and re-weight the multiplier", async function() {
			var burnPrimordial = async function(account, burnAmount) {
				var accountPrimordialBalanceBefore = await aoion.primordialBalanceOf(account);
				var accountWeightedMultiplierBefore = await aoion.weightedMultiplierByAddress(account);
				var primordialTotalSupplyBefore = await aoion.primordialTotalSupply();

				var totalBurnLotsByAddressBefore = await aoionlot.totalBurnLotsByAddress(account);
				var multiplierAfterBurn = await aoion.calculateMultiplierAfterBurn(account, burnAmount.toString());

				var _event = aoionlot.BurnLotCreation();
				_event.watch(async function(error, log) {
					if (!error) {
						var burnLotId = log.args.burnLotId;
						var burnLot = await aoion.burnLotById(burnLotId);
						assert.equal(burnLot[0], burnLotId, "Burn Lot has incorrect burnLotId");
						assert.equal(burnLot[1], account, "Burn Lot has incorrect burn lotOwner");
						assert.equal(burnLot[2], burnAmount.toString(), "Burn Lot has incorrect amount");

						var burnLotIdsByAddress = await aoion.burnLotIdsByAddress(account);
						assert.include(burnLotIdsByAddress, burnLotId, "burnLotIdsByAddress() is missing a value");
					}
				});
				_event.stopWatching();

				var canBurn;
				try {
					var result = await aoion.burnPrimordial(burnAmount.toString(), { from: account });
					canBurn = true;
				} catch (e) {
					canBurn = false;
				}
				assert.equal(canBurn, true, "Account can't burn primordial ion");

				var accountPrimordialBalanceAfter = await aoion.primordialBalanceOf(account);
				var accountWeightedMultiplierAfter = await aoion.weightedMultiplierByAddress(account);
				var primordialTotalSupplyAfter = await aoion.primordialTotalSupply();

				assert.equal(
					accountPrimordialBalanceAfter.toString(),
					accountPrimordialBalanceBefore.minus(burnAmount).toString(),
					"Account has incorrect primordial balance after burn"
				);
				assert.equal(
					accountWeightedMultiplierAfter.toString(),
					multiplierAfterBurn.toString(),
					"Account has incorrect weighted multiplier after burn"
				);
				assert.isAtLeast(
					accountWeightedMultiplierAfter.toNumber(),
					accountWeightedMultiplierBefore.toNumber(),
					"New weighted multiplier should be greater than or equal to previous weighted multiplier"
				);
				assert.equal(
					primordialTotalSupplyAfter.toString(),
					primordialTotalSupplyBefore.minus(burnAmount).toString(),
					"Contract has incorrect primordialTotalSupply after burn"
				);

				var totalBurnLotsByAddressAfter = await aoionlot.totalBurnLotsByAddress(account);
				assert.equal(
					totalBurnLotsByAddressAfter.toNumber(),
					totalBurnLotsByAddressBefore.plus(1).toNumber(),
					"totalBurnLotsByAddress() returns incorrect value"
				);
			};

			var maxBurnAmount = await aoion.calculateMaximumBurnAmount(account1);
			var canBurn;
			try {
				var result = await aoion.burnPrimordial(maxBurnAmount.plus(10).toString(), { from: account1 });
				canBurn = true;
			} catch (e) {
				canBurn = false;
			}
			assert.equal(canBurn, false, "Account can burn more than maximum burn amount");

			await burnPrimordial(account1, new BigNumber(5));
			await burnPrimordial(account1, new BigNumber(10));
			await burnPrimordial(account1, new BigNumber(1000));
		});

		it("approvePrimordial() - should set Primordial allowance for other address", async function() {
			var account3PrimordialAllowance = await aoion.primordialAllowance(account1, account3);
			assert.equal(account3PrimordialAllowance.toNumber(), 0, "Account3 has incorrect Primordial allowance before approve");
			await aoion.approvePrimordial(account3, 20, { from: account1 });
			account3PrimordialAllowance = await aoion.primordialAllowance(account1, account3);
			assert.equal(account3PrimordialAllowance.toNumber(), 20, "Account3 has incorrect Primordial allowance after approve");
		});

		it("transferPrimordialFrom() - should send `_value` Primordial ions to `_to` in behalf of `_from`", async function() {
			var account1PrimordialBalanceBefore = await aoion.primordialBalanceOf(account1);
			var account3PrimordialBalanceBefore = await aoion.primordialBalanceOf(account3);
			var account1WeightedMultiplierBefore = await aoion.weightedMultiplierByAddress(account1);
			var account3WeightedMultiplierBefore = await aoion.weightedMultiplierByAddress(account3);
			var account3PrimordialAllowanceBefore = await aoion.primordialAllowance(account1, account3);

			var totalLotsBefore = await aoionlot.totalLots();
			var primordialTotalSupplyBefore = await aoion.primordialTotalSupply();

			var canTransfer, events;
			try {
				var result = await aoion.transferPrimordialFrom(account1, account3, 10, { from: theAO });
				events = result.logs;
				canTransfer = true;
			} catch (e) {
				events = null;
				canTransfer = false;
			}
			assert.notEqual(canTransfer, true, "Account with no allowance can transfer primordial on behalf of other account");

			try {
				var result = await aoion.transferPrimordialFrom(account1, account3, 100, { from: account3 });
				events = result.logs;
				canTransfer = true;
			} catch (e) {
				events = null;
				canTransfer = false;
			}
			assert.notEqual(canTransfer, true, "Account can transfer primordial on behalf of other account more than its allowance");

			var _event = aoionlot.LotCreation();
			_event.watch(async function(error, log) {
				if (!error) {
					if (log.args.lotOwner == account3) {
						var accountLotId = log.args.lotId;

						assert.equal(
							log.args.multiplier.toString(),
							account1WeightedMultiplierBefore.toString(),
							"Account Lot Creation has incorrect multiplier"
						);
						assert.equal(log.args.primordialAmount.toString(), 10, "Account Lot Creation has incorrect amount");
						assert.equal(log.args.networkBonusAmount.toString(), 0, "Account Lot Creation has incorrect networkBonusAmount");

						// Make sure the Lot is stored correctly
						var accountLot = await aoion.lotById(accountLotId);
						assert.equal(accountLot[0], accountLotId, "Lot has incorrect ID");
						assert.equal(accountLot[1], account3, "Lot has incorrect lot owner");
						assert.equal(accountLot[2].toString(), account1WeightedMultiplierAfter.toString(), "Lot has incorrect multiplier");
						assert.equal(accountLot[3].toString(), 10, "Lot has incorrect amount");

						account3Lots.push(accountLot);

						var account3WeightedMultiplierAfter = await aoion.weightedMultiplierByAddress(account3);
						var newWeightedMultiplier = await library.calculateWeightedMultiplier(
							account3WeightedMultiplierBefore.toNumber(),
							account3PrimordialBalanceBefore.toNumber(),
							accountLot[2].toNumber(),
							accountLot[3].toNumber()
						);
					}
				}
			});
			_event.stopWatching();

			try {
				var result = await aoion.transferPrimordialFrom(account1, account3, 10, { from: account3 });
				events = result.logs;
				canTransfer = true;
			} catch (e) {
				events = null;
				canTransfer = false;
			}

			assert.equal(canTransfer, true, "Account1 can't transfer primordial ion");
			assert.notEqual(events, null, "Contract didn't emit events during transfer primordial ion");

			var account1PrimordialBalanceAfter = await aoion.primordialBalanceOf(account1);
			var account3PrimordialBalanceAfter = await aoion.primordialBalanceOf(account3);
			var account1WeightedMultiplierAfter = await aoion.weightedMultiplierByAddress(account1);
			var account3PrimordialAllowanceAfter = await aoion.primordialAllowance(account1, account3);

			var totalLotsAfter = await aoionlot.totalLots();
			var primordialTotalSupplyAfter = await aoion.primordialTotalSupply();

			assert.equal(
				account1PrimordialBalanceAfter.toString(),
				account1PrimordialBalanceBefore.minus(10).toString(),
				"Account1 has incorrect primordial balance"
			);
			assert.equal(
				account3PrimordialBalanceAfter.toString(),
				account3PrimordialBalanceBefore.plus(10).toString(),
				"Account3 has incorrect primordial balance"
			);
			assert.equal(
				account1WeightedMultiplierAfter.toString(),
				account1WeightedMultiplierBefore.toString(),
				"Account1 has incorrect weighted multiplier"
			);

			assert.equal(totalLotsAfter.toString(), totalLotsBefore.plus(1).toString(), "Contract has incorrect totalLots");
			assert.equal(
				primordialTotalSupplyAfter.toString(),
				primordialTotalSupplyBefore.toString(),
				"Contract has incorrect primordialTotalSupply"
			);

			assert.equal(
				account3PrimordialAllowanceAfter.toString(),
				account3PrimordialAllowanceBefore.minus(10).toString(),
				"Account3 has incorrect primordial allowance"
			);
		});

		it("burnPrimordialFrom() - should remove `_value` Primordial ions from the system irreversibly on behalf of `_from` and re-weight multiplier", async function() {
			var maxBurnAmount = await aoion.calculateMaximumBurnAmount(account1);
			var accountPrimordialBalanceBefore = await aoion.primordialBalanceOf(account1);
			var accountWeightedMultiplierBefore = await aoion.weightedMultiplierByAddress(account1);
			var primordialTotalSupplyBefore = await aoion.primordialTotalSupply();
			var account3PrimordialAllowanceBefore = await aoion.primordialAllowance(account1, account3);

			var canBurn;
			try {
				var result = await aoion.burnPrimordialFrom(account1, maxBurnAmount.plus(10).toString(), { from: account3 });
				canBurn = true;
			} catch (e) {
				canBurn = false;
			}
			assert.equal(canBurn, false, "Account can burn more than maximum burn amount");

			var burnAmount = new BigNumber(10);
			var multiplierAfterBurn = await aoion.calculateMultiplierAfterBurn(account1, burnAmount.toString());

			var _event = aoionlot.BurnLotCreation();
			_event.watch(async function(error, log) {
				if (!error) {
					var burnLotId = log.args.burnLotId;

					var burnLot = await aoion.burnLotById(burnLotId);
					assert.equal(burnLot[0], burnLotId, "Burn Lot has incorrect burnLotId");
					assert.equal(burnLot[1], account1, "Burn Lot has incorrect burn lotOwner");
					assert.equal(burnLot[2], burnAmount.toString(), "Burn Lot has incorrect amount");

					var burnLotIdsByAddress = await aoion.burnLotIdsByAddress(account);
					assert.include(burnLotIdsByAddress, burnLotId, "burnLotIdsByAddress() is missing a value");
				}
			});
			_event.stopWatching();

			try {
				var result = await aoion.burnPrimordialFrom(account1, burnAmount.toString(), { from: account3 });
				canBurn = true;
			} catch (e) {
				canBurn = false;
			}
			assert.equal(canBurn, true, "Account can't burn primordial ion");

			var accountPrimordialBalanceAfter = await aoion.primordialBalanceOf(account1);
			var accountWeightedMultiplierAfter = await aoion.weightedMultiplierByAddress(account1);
			var primordialTotalSupplyAfter = await aoion.primordialTotalSupply();
			var account3PrimordialAllowanceAfter = await aoion.primordialAllowance(account1, account3);

			assert.equal(
				accountPrimordialBalanceAfter.toString(),
				accountPrimordialBalanceBefore.minus(burnAmount).toString(),
				"Account has incorrect primordial balance after burn"
			);
			assert.equal(
				accountWeightedMultiplierAfter.toString(),
				multiplierAfterBurn.toString(),
				"Account has incorrect weighted multiplier after burn"
			);
			assert.isAtLeast(
				accountWeightedMultiplierAfter.toNumber(),
				accountWeightedMultiplierBefore.toNumber(),
				"New weighted multiplier should be greater than or equal to previous weighted multiplier"
			);
			assert.equal(
				primordialTotalSupplyAfter.toString(),
				primordialTotalSupplyBefore.minus(burnAmount).toString(),
				"Contract has incorrect primordialTotalSupply after burn"
			);
			assert.equal(
				account3PrimordialAllowanceAfter.toString(),
				account3PrimordialAllowanceBefore.minus(burnAmount).toString(),
				"Account3 has incorrect primordial allowance after burn"
			);
		});

		it("calculateMultiplierAfterConversion() - should return the new multiplier after converting network ion to primordial ion", async function() {
			var accountPrimordialBalance = await aoion.primordialBalanceOf(account1);
			var accountWeightedMultiplier = await aoion.weightedMultiplierByAddress(account1);
			var convertAmount = new BigNumber(100);
			var multiplierAfterConversion = await aoion.calculateMultiplierAfterConversion(account1, convertAmount.toString());

			var _multiplierAfterConversion = await library.calculateMultiplierAfterConversion(
				accountPrimordialBalance.toString(),
				accountWeightedMultiplier.toString(),
				convertAmount.toString()
			);

			assert.equal(
				multiplierAfterConversion.toString(),
				_multiplierAfterConversion.toString(),
				"calculateMultiplierAfterConversion() returns incorrect multiplier"
			);
		});

		it("convertToPrimordial() - should convert network ion to primordial ion and re-weight multiplier", async function() {
			var convertToPrimordial = async function(account, convertAmount) {
				var accountNetworkBalanceBefore = await aoion.balanceOf(account);
				var accountPrimordialBalanceBefore = await aoion.primordialBalanceOf(account);
				var accountWeightedMultiplierBefore = await aoion.weightedMultiplierByAddress(account);
				var networkTotalSupplyBefore = await aoion.totalSupply();
				var primordialTotalSupplyBefore = await aoion.primordialTotalSupply();

				var totalConvertLotsByAddressBefore = await aoionlot.totalConvertLotsByAddress(account);

				var multiplierAfterConversion = await aoion.calculateMultiplierAfterConversion(account, convertAmount.toString());

				var _event = aoionlot.ConvertLotCreation();
				_event.watch(async function(error, log) {
					if (!error) {
						var convertLotId = log.args.convertLotId;
						var convertLot = await aoion.convertLotById(convertLotId);
						assert.equal(convertLot[0], convertLotId, "Convert Lot has incorrect convertLotId");
						assert.equal(convertLot[1], account, "Convert Lot has incorrect convert lotOwner");
						assert.equal(convertLot[2], convertAmount.toString(), "Convert Lot has incorrect amount");

						var convertLotIdsByAddress = await aoion.convertLotIdsByAddress(account);
						assert.include(convertLotIdsByAddress, convertLotId, "convertLotIdsByAddress() is missing a value");
					}
				});
				_event.stopWatching();

				var canConvert;
				try {
					var result = await aoion.convertToPrimordial(convertAmount.toString(), { from: account });
					canConvert = true;
				} catch (e) {
					canConvert = false;
				}
				assert.equal(canConvert, true, "Account can't convert network ions to primordial ions");

				var accountNetworkBalanceAfter = await aoion.balanceOf(account);
				var accountPrimordialBalanceAfter = await aoion.primordialBalanceOf(account);
				var accountWeightedMultiplierAfter = await aoion.weightedMultiplierByAddress(account);
				var networkTotalSupplyAfter = await aoion.totalSupply();
				var primordialTotalSupplyAfter = await aoion.primordialTotalSupply();

				assert.equal(
					accountNetworkBalanceAfter.toString(),
					accountNetworkBalanceBefore.minus(convertAmount).toString(),
					"Account has incorrect network balance after conversion"
				);
				assert.equal(
					accountPrimordialBalanceAfter.toString(),
					accountPrimordialBalanceBefore.plus(convertAmount).toString(),
					"Account has incorrect primordial balance after conversion"
				);
				assert.equal(
					accountWeightedMultiplierAfter.toString(),
					multiplierAfterConversion.toString(),
					"Account has incorrect multiplier after conversion"
				);
				assert.isAtMost(
					accountWeightedMultiplierAfter.toNumber(),
					accountWeightedMultiplierBefore.toNumber(),
					"New multiplier should be less than or equal to previous multiplier after conversion"
				);
				assert.equal(
					networkTotalSupplyAfter.toString(),
					networkTotalSupplyBefore.minus(convertAmount).toString(),
					"Contract has incorrect network total supply after conversion"
				);
				assert.equal(
					primordialTotalSupplyAfter.toString(),
					primordialTotalSupplyBefore.plus(convertAmount).toString(),
					"Contract has incorrect primordial total supply after conversion"
				);

				var totalConvertLotsByAddressAfter = await aoionlot.totalConvertLotsByAddress(account);
				assert.equal(
					totalConvertLotsByAddressAfter.toNumber(),
					totalConvertLotsByAddressBefore.plus(1).toNumber(),
					"totalConvertLotsByAddress() returns incorrect value"
				);
			};

			var canConvert;
			try {
				var result = await aoion.convertToPrimordial(10 ** 30, { from: account1 });
				canConvert = true;
			} catch (e) {
				canConvert = false;
			}
			assert.equal(canConvert, false, "Account can convert more network ions than available balance");

			await convertToPrimordial(account1, new BigNumber(500));
			await convertToPrimordial(account1, new BigNumber(10));
			await convertToPrimordial(account1, new BigNumber(400));
		});

		it("totalLotsByAddress() - should return the correct total lots owned by an address", async function() {
			var account1TotalLots = await aoionlot.totalLotsByAddress(account1);
			var account2TotalLots = await aoionlot.totalLotsByAddress(account2);
			assert.equal(
				account1TotalLots.toNumber(),
				account1Lots.length,
				"totalLotsByAddress() returns incorrect total lots for Account1"
			);
			assert.equal(
				account2TotalLots.toNumber(),
				account2Lots.length,
				"totalLotsByAddress() returns incorrect total lots for Account2"
			);
		});

		it("frozen account should NOT be able to transfer Primordial", async function() {
			var canTransferPrimordial;
			await aoion.freezeAccount(account1, true, { from: theAO });
			try {
				await aoion.transferPrimordial(account2, 10, { from: account1 });
				canTransferPrimordial = true;
			} catch (e) {
				canTransferPrimordial = false;
			}
			assert.notEqual(canTransferPrimordial, true, "Frozen account can transfer Primordial");
			// Unfreeze account1
			await aoion.freezeAccount(account1, false, { from: theAO });
		});

		it("lotIdsByAddress() - should return all lots owned by an address", async function() {
			var _lots = await aoionlot.lotIdsByAddress(account1);
			var isEqual =
				_lots.length === account1Lots.length &&
				_lots.every(function(value, index) {
					return value === account1Lots[index][0];
				});
			assert.equal(isEqual, true, "lotIdsByAddress() return incorrect lots for Account1");

			_lots = await aoionlot.lotIdsByAddress(account2);
			isEqual =
				_lots.length === account2Lots.length &&
				_lots.every(function(value, index) {
					return value === account2Lots[index][0];
				});
			assert.equal(isEqual, true, "lotIdsByAddress() return incorrect lots for Account2");
		});

		it("lotById() - should return correct lot information at a given ID", async function() {
			var lot = await aoionlot.lotById(account1Lots[0][0]);
			assert.equal(lot[0], account1Lots[0][0], "lotById() return incorrect lot ID");
			assert.equal(lot[1], account1Lots[0][1], "lotById() return incorrect lot owner");
			assert.equal(lot[1].toString(), account1Lots[0][1].toString(), "lotById() return incorrect multiplier");
			assert.equal(lot[2].toString(), account1Lots[0][2].toString(), "lotById() return incorrect amount");
		});

		it("Whitelisted address - stakePrimordialFrom() should be able to stake Primordial ions on behalf of others", async function() {
			var account1PrimordialBalanceBefore = await aoion.primordialBalanceOf(account1);
			var account1WeightedMultiplierBefore = await aoion.weightedMultiplierByAddress(account1);
			var account1PrimordialStakedBalanceBefore = await aoion.primordialStakedBalance(
				account1,
				account1WeightedMultiplierBefore.toString()
			);
			var primordialTotalSupplyBefore = await aoion.primordialTotalSupply();

			var canStakePrimordial;
			try {
				await aoion.stakePrimordialFrom(account1, 10, account1WeightedMultiplierBefore.toString(), { from: someAddress });
				canStakePrimordial = true;
			} catch (e) {
				canStakePrimordial = false;
			}
			assert.notEqual(canStakePrimordial, true, "Account that do not have permission can stake Primordial ions on behalf of others");
			try {
				await aoion.stakePrimordialFrom(account1, 10 ** 20, account1WeightedMultiplierBefore.toString(), {
					from: whitelistedAddress
				});
				canStakePrimordial = true;
			} catch (e) {
				canStakePrimordial = false;
			}
			assert.notEqual(canStakePrimordial, true, "Account can stake more than available balance");
			try {
				await aoion.stakePrimordialFrom(account1, 10, account1WeightedMultiplierBefore.toString(), {
					from: whitelistedAddress
				});
				canStakePrimordial = true;
			} catch (e) {
				canStakePrimordial = false;
			}
			assert.equal(canStakePrimordial, true, "Account that has permission can't stake Primordial ions on behalf of others");
			stakedPrimordialWeightedMultiplier = account1WeightedMultiplierBefore.toString();

			var account1PrimordialBalanceAfter = await aoion.primordialBalanceOf(account1);
			var account1WeightedMultiplierAfter = await aoion.weightedMultiplierByAddress(account1);
			var account1PrimordialStakedBalanceAfter = await aoion.primordialStakedBalance(account1, stakedPrimordialWeightedMultiplier);
			var primordialTotalSupplyAfter = await aoion.primordialTotalSupply();

			assert.equal(
				account1PrimordialBalanceAfter.toString(),
				account1PrimordialBalanceBefore.minus(10).toString(),
				"Account1 has incorrect Primordial ions balance after staking"
			);
			assert.equal(
				account1WeightedMultiplierAfter.toString(),
				account1WeightedMultiplierBefore.toString(),
				"Account1 has incorrect weighted index after staking"
			);
			assert.equal(
				account1PrimordialStakedBalanceAfter.toString(),
				account1PrimordialStakedBalanceBefore.plus(10).toString(),
				"Account1 has incorrect Primordial ions staked balance after staking"
			);
			assert.equal(
				primordialTotalSupplyAfter.toString(),
				primordialTotalSupplyBefore.toString(),
				"Contract has incorrect Primordial total supply after staking"
			);
		});

		it("Whitelisted address - unstakePrimordialFrom() should be able to unstake Primordial ions on behalf of others", async function() {
			var account1PrimordialBalanceBefore = await aoion.primordialBalanceOf(account1);
			var account1WeightedMultiplierBefore = await aoion.weightedMultiplierByAddress(account1);
			var account1PrimordialStakedBalanceBefore = await aoion.primordialStakedBalance(account1, stakedPrimordialWeightedMultiplier);
			var primordialTotalSupplyBefore = await aoion.primordialTotalSupply();

			var canUnstakePrimordial;
			try {
				await aoion.unstakePrimordialFrom(account1, 10, stakedPrimordialWeightedMultiplier, { from: someAddress });
				canUnstakePrimordial = true;
			} catch (e) {
				canUnstakePrimordial = false;
			}
			assert.notEqual(
				canUnstakePrimordial,
				true,
				"Account that do not have permission can unstake Primordial ions on behalf of others"
			);
			try {
				await aoion.unstakePrimordialFrom(account1, 100000, stakedPrimordialWeightedMultiplier, {
					from: whitelistedAddress
				});
				canUnstakePrimordial = true;
			} catch (e) {
				canUnstakePrimordial = false;
			}
			assert.notEqual(canUnstakePrimordial, true, "Account can unstake more than available balance");
			try {
				await aoion.unstakePrimordialFrom(account1, 10, stakedPrimordialWeightedMultiplier, { from: whitelistedAddress });
				canUnstakePrimordial = true;
			} catch (e) {
				canUnstakePrimordial = false;
			}
			assert.equal(canUnstakePrimordial, true, "Account that has permission can't unstake Primordial ions on behalf of others");

			var account1PrimordialBalanceAfter = await aoion.primordialBalanceOf(account1);
			var account1WeightedMultiplierAfter = await aoion.weightedMultiplierByAddress(account1);
			var account1PrimordialStakedBalanceAfter = await aoion.primordialStakedBalance(account1, stakedPrimordialWeightedMultiplier);
			var primordialTotalSupplyAfter = await aoion.primordialTotalSupply();

			assert.equal(
				account1PrimordialBalanceAfter.toString(),
				account1PrimordialBalanceBefore.plus(10).toString(),
				"Account1 has incorrect Primordial ions balance after unstaking"
			);
			assert.equal(
				account1WeightedMultiplierAfter.toString(),
				account1WeightedMultiplierBefore.toString(),
				"Account1 has incorrect weighted index after unstaking"
			);
			assert.equal(
				account1PrimordialStakedBalanceAfter.toString(),
				account1PrimordialStakedBalanceBefore.minus(10).toString(),
				"Account1 has incorrect Primordial ions staked balance after unstaking"
			);
			assert.equal(
				primordialTotalSupplyAfter.toString(),
				primordialTotalSupplyBefore.toString(),
				"Contract has incorrect Primordial total supply after unstaking"
			);
		});

		it("Whitelisted address - whitelistTransferPrimordialFrom() - should send `_value` Primordial ions to `_to` in behalf of `_from`", async function() {
			var account1PrimordialBalanceBefore = await aoion.primordialBalanceOf(account1);
			var account3PrimordialBalanceBefore = await aoion.primordialBalanceOf(account3);
			var account1WeightedMultiplierBefore = await aoion.weightedMultiplierByAddress(account1);
			var account3WeightedMultiplierBefore = await aoion.weightedMultiplierByAddress(account3);

			var totalLotsBefore = await aoionlot.totalLots();
			var primordialTotalSupplyBefore = await aoion.primordialTotalSupply();

			var canTransfer, events;
			try {
				var result = await aoion.whitelistTransferPrimordialFrom(account3, account1, 10 ** 20, { from: whitelistedAddress });
				events = result.logs;
				canTransfer = true;
			} catch (e) {
				events = null;
				canTransfer = false;
			}
			assert.notEqual(canTransfer, true, "Whitelisted address can transfer more than account's balance");

			try {
				var result = await aoion.whitelistTransferPrimordialFrom(account1, account3, 100, { from: someAddress });
				events = result.logs;
				canTransfer = true;
			} catch (e) {
				events = null;
				canTransfer = false;
			}
			assert.notEqual(canTransfer, true, "Non-whitelisted address can transfer primordial ion");

			var _event = aoionlot.LotCreation();
			_event.watch(async function(error, log) {
				if (!error) {
					if (log.args.lotOwner == account3) {
						var accountLotId = log.args.lotId;
						assert.equal(
							log.args.multiplier.toString(),
							account1WeightedMultiplierBefore.toString(),
							"Account Lot Creation has incorrect multiplier"
						);
						assert.equal(log.args.primordialAmount.toString(), 10, "Account Lot Creation has incorrect amount");
						assert.equal(log.args.networkBonusAmount.toString(), 0, "Account Lot Creation has incorrect networkBonusAmount");

						var account1WeightedMultiplierAfter = await aoion.weightedMultiplierByAddress(account1);
						var account3WeightedMultiplierAfter = await aoion.weightedMultiplierByAddress(account3);

						// Make sure the Lot is stored correctly
						var accountLot = await aoionlot.lotById(accountLotId);
						assert.equal(accountLot[0], accountLotId, "Lot has incorrect ID");
						assert.equal(accountLot[1], account3, "Lot has incorrect lot owner");
						assert.equal(accountLot[2].toString(), account1WeightedMultiplierAfter.toString(), "Lot has incorrect multiplier");
						assert.equal(accountLot[3].toString(), 10, "Lot has incorrect amount");

						account3Lots.push(accountLot);

						var newWeightedMultiplier = await library.calculateWeightedMultiplier(
							account3WeightedMultiplierBefore.toNumber(),
							account3PrimordialBalanceBefore.toNumber(),
							accountLot[2].toNumber(),
							accountLot[3].toNumber()
						);
						assert.equal(
							account3WeightedMultiplierAfter.toString(),
							newWeightedMultiplier.toString(),
							"Account3 has incorrect weighted multiplier"
						);
					}
				}
			});

			try {
				var result = await aoion.whitelistTransferPrimordialFrom(account1, account3, 10, { from: whitelistedAddress });
				events = result.logs;
				canTransfer = true;
			} catch (e) {
				events = null;
				canTransfer = false;
			}

			assert.equal(canTransfer, true, "Account1 can't transfer primordial ion");
			assert.notEqual(events, null, "Contract didn't emit events during transfer primordial ion");

			var account1PrimordialBalanceAfter = await aoion.primordialBalanceOf(account1);
			var account3PrimordialBalanceAfter = await aoion.primordialBalanceOf(account3);
			var account1WeightedMultiplierAfter = await aoion.weightedMultiplierByAddress(account1);

			var totalLotsAfter = await aoionlot.totalLots();
			var primordialTotalSupplyAfter = await aoion.primordialTotalSupply();

			assert.equal(
				account1PrimordialBalanceAfter.toString(),
				account1PrimordialBalanceBefore.minus(10).toString(),
				"Account1 has incorrect primordial balance"
			);
			assert.equal(
				account3PrimordialBalanceAfter.toString(),
				account3PrimordialBalanceBefore.plus(10).toString(),
				"Account3 has incorrect primordial balance"
			);
			assert.equal(
				account1WeightedMultiplierAfter.toString(),
				account1WeightedMultiplierBefore.toString(),
				"Account1 has incorrect weighted multiplier"
			);

			assert.equal(totalLotsAfter.toString(), totalLotsBefore.plus(1).toString(), "Contract has incorrect totalLots");
			assert.equal(
				primordialTotalSupplyAfter.toString(),
				primordialTotalSupplyBefore.toString(),
				"Contract has incorrect primordialTotalSupply"
			);
		});

		it("transferPrimordialBetweenPublicKeys() - should be able to transfer AO+ ions between public keys in a Name", async function() {
			var canTransfer;
			var transferAmount = 10;

			try {
				await aoion.transferPrimordialBetweenPublicKeys(someAddress, account1, account4, transferAmount, { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, false, "Can transfer AO Ion between public keys for a non-Name");

			try {
				await aoion.transferPrimordialBetweenPublicKeys(nameId1, account1, account4, transferAmount, { from: account2 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, false, "Non-Advocate of Name transfer AO Ion between public keys");

			try {
				await aoion.transferPrimordialBetweenPublicKeys(nameId1, account2, account4, transferAmount, { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, false, "Advocate of Name transfer AO Ion from an address that is not listed as public key");

			try {
				await aoion.transferPrimordialBetweenPublicKeys(nameId1, account1, account2, transferAmount, { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, false, "Advocate of Name transfer AO Ion to an address that is not listed as public key");

			var account1Balance = await aoion.primordialBalanceOf(account1);

			try {
				await aoion.transferPrimordialBetweenPublicKeys(nameId1, account1, account4, account1Balance.plus(1).toNumber(), {
					from: account1
				});
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, false, "Advocate of Name transfer AO Ion more than from address' owned balance");

			// Listener submit account recovery for nameId1
			await nameaccountrecovery.submitAccountRecovery(nameId1, { from: account2 });

			// Fast forward the time
			await helper.advanceTimeAndBlock(1000);

			try {
				await aoion.transferPrimordialBetweenPublicKeys(nameId1, account1, account4, transferAmount, { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, false, "Compromised Advocate of Name can transfer AO Ion between public keys");

			// Fast forward the time
			await helper.advanceTimeAndBlock(accountRecoveryLockDuration.plus(100).toNumber());

			var account1BalanceBefore = await aoion.primordialBalanceOf(account1);
			var account4BalanceBefore = await aoion.primordialBalanceOf(account4);
			var totalLotsBefore = await aoionlot.totalLots();

			try {
				await aoion.transferPrimordialBetweenPublicKeys(nameId1, account1, account4, transferAmount, { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, true, "Advocate of Name can't transfer AO Ion between public keys");

			var account1BalanceAfter = await aoion.primordialBalanceOf(account1);
			var account4BalanceAfter = await aoion.primordialBalanceOf(account4);
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.minus(transferAmount).toNumber(),
				"Account has incorrect primordial balance"
			);
			assert.equal(
				account4BalanceAfter.toNumber(),
				account4BalanceBefore.plus(transferAmount).toNumber(),
				"Account has incorrect primordial balance"
			);

			var totalLotsAfter = await aoionlot.totalLots();
			assert.equal(totalLotsAfter.toString(), totalLotsBefore.plus(1).toString(), "Contract has incorrect totalLots");
		});
	});
});
