var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var Logos = artifacts.require("./Logos.sol");

var AOToken = artifacts.require("./AOToken.sol");
var AOLibrary = artifacts.require("./AOLibrary.sol");
var AOSetting = artifacts.require("./AOSetting.sol");
var AOETH = artifacts.require("./AOETH.sol");

var TokenOne = artifacts.require("./TokenOne.sol");
var TokenTwo = artifacts.require("./TokenTwo.sol");
var TokenThree = artifacts.require("./TokenThree.sol");

var EthCrypto = require("eth-crypto");
var BigNumber = require("bignumber.js");
BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: 1, EXPONENTIAL_AT: [-10, 40] }); // no rounding

contract("AOToken", function(accounts) {
	var namefactory,
		taofactory,
		nametaoposition,
		logos,
		aotoken,
		library,
		aosetting,
		aoeth,
		tokenone,
		tokentwo,
		tokenthree,
		settingTAOId,
		nameId,
		taoId,
		totalPrimordialForSale,
		percentageDivisor,
		startingPrimordialMultiplier,
		endingPrimordialMultiplier,
		startingNetworkTokenBonusMultiplier,
		endingNetworkTokenBonusMultiplier;

	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var account3 = accounts[3];
	var whitelistedAddress = accounts[4];
	var someAddress = accounts[7];
	var aoDevTeam1 = accounts[8];
	var aoDevTeam2 = accounts[9];
	var emptyAddress = "0x0000000000000000000000000000000000000000";
	var recipient = EthCrypto.createIdentity();

	var account1Lots = [];
	var account2Lots = [];
	var account3Lots = [];

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		logos = await Logos.deployed();
		aotoken = await AOToken.deployed();
		library = await AOLibrary.deployed();
		aosetting = await AOSetting.deployed();
		aoeth = await AOETH.deployed();
		tokenone = await TokenOne.deployed();
		tokentwo = await TokenTwo.deployed();
		tokenthree = await TokenThree.deployed();

		settingTAOId = await aotoken.settingTAOId();
		percentageDivisor = await library.PERCENTAGE_DIVISOR();
	});

	contract("Variable settings", function() {
		it("should return correct name", async function() {
			var name = await aotoken.name();
			assert.equal(name, "AO Token", "Contract has the incorrect name");
		});

		it("should return correct symbol", async function() {
			var symbol = await aotoken.symbol();
			assert.equal(symbol, "AOTKN", "Contract has the incorrect symbol");
		});

		it("should have the correct power of ten", async function() {
			var powerOfTen = await aotoken.powerOfTen();
			assert.equal(powerOfTen, 0, "Contract has the incorrect power of ten");
		});

		it("should have 0 decimal", async function() {
			var decimals = await aotoken.decimals();
			assert.equal(decimals, 0, "Contract has the incorrect decimals");
		});

		it("should have 0 initial supply", async function() {
			var totalSupply = await aotoken.totalSupply();
			assert.equal(totalSupply.toNumber(), 0, "Contract has incorrect initial supply");
		});

		it("should have total of 1125899906842620 Primordial tokens for sale", async function() {
			totalPrimordialForSale = new BigNumber(await aotoken.TOTAL_PRIMORDIAL_FOR_SALE());
			assert.equal(totalPrimordialForSale.toNumber(), 1125899906842620, "Contract has incorrect total primordial for sale");
		});

		it("should have the correct AO Dev team 1 address", async function() {
			var aoDevTeam = await aotoken.aoDevTeam1();
			assert.equal(aoDevTeam, aoDevTeam1, "Contract has incorrect aoDevTeam1");
		});

		it("should have the correct AO Dev team 2 address", async function() {
			var aoDevTeam = await aotoken.aoDevTeam2();
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

		it("should have the correct starting network token bonus multiplier for calculating network token bonus amount", async function() {
			var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "startingNetworkTokenBonusMultiplier");
			startingNetworkTokenBonusMultiplier = new BigNumber(settingValues[0]);
			assert.equal(
				startingNetworkTokenBonusMultiplier.toNumber(),
				1000000,
				"Contract has incorrect startingNetworkTokenBonusMultiplier"
			);
		});

		it("should have the correct ending network token bonus multiplier for calculating network token bonus amount", async function() {
			var settingValues = await aosetting.getSettingValuesByTAOName(settingTAOId, "endingNetworkTokenBonusMultiplier");
			endingNetworkTokenBonusMultiplier = new BigNumber(settingValues[0]);
			assert.equal(endingNetworkTokenBonusMultiplier.toNumber(), 250000, "Contract has incorrect endingNetworkTokenBonusMultiplier");
		});
	});

	contract("The AO Only", function() {
		before(async function() {
			// Create Name
			var result = await namefactory.createName("charlie", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
				from: account1
			});
			nameId = await namefactory.ethAddressToNameId(account1);

			// Mint Logos to nameId
			await logos.setWhitelist(theAO, true, { from: theAO });
			await logos.mintToken(nameId, 10 ** 12, { from: theAO });

			result = await taofactory.createTAO(
				"Charlie's TAO",
				"somedathash",
				"somedatabase",
				"somekeyvalue",
				"somecontentid",
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
		});

		it("The AO - transferOwnership() - should be able to transfer ownership to a TAO", async function() {
			var canTransferOwnership;
			try {
				await aotoken.transferOwnership(taoId, { from: someAddress });
				canTransferOwnership = true;
			} catch (e) {
				canTransferOwnership = false;
			}
			assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

			try {
				await aotoken.transferOwnership(taoId, { from: theAO });
				canTransferOwnership = true;
			} catch (e) {
				canTransferOwnership = false;
			}
			assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

			var newTheAO = await aotoken.theAO();
			assert.equal(newTheAO, taoId, "Contract has incorrect TheAO address after transferring ownership");
		});

		it("The AO - setWhitelist() should be able to whitelist an address", async function() {
			var canSetWhitelist;
			try {
				await aotoken.setWhitelist(whitelistedAddress, true, { from: someAddress });
				canSetWhitelist = true;
			} catch (e) {
				canSetWhitelist = false;
			}
			assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

			try {
				await aotoken.setWhitelist(whitelistedAddress, true, { from: account1 });
				canSetWhitelist = true;
			} catch (e) {
				canSetWhitelist = false;
			}
			assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

			var whitelistStatus = await aotoken.whitelist(whitelistedAddress);
			assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
		});

		it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
			var canSetAddress;
			try {
				await aotoken.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

			try {
				await aotoken.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

			var nameTAOPositionAddress = await aotoken.nameTAOPositionAddress();
			assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
		});

		it("The AO - transferERC20() should be able to transfer ERC20 to an address", async function() {
			await tokenone.transfer(aotoken.address, 100, { from: theAO });

			var accountBalanceBefore = await tokenone.balanceOf(account1);
			var aotokenBalanceBefore = await tokenone.balanceOf(aotoken.address);

			var canTransfer;
			try {
				await aotoken.transferERC20(tokenone.address, account1, 10, { from: someAddress });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, false, "Non-AO can transfer ERC20 token from AOToken");

			try {
				await aotoken.transferERC20(tokenone.address, account1, 1000, { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, false, "The AO can transfer ERC20 token more than owned balance");

			try {
				await aotoken.transferERC20(tokenone.address, account1, 100, { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.equal(canTransfer, true, "The AO can't transfer ERC20 token from AOToken to another recipient");

			var accountBalanceAfter = await tokenone.balanceOf(account1);
			var aotokenBalanceAfter = await tokenone.balanceOf(aotoken.address);

			assert.equal(accountBalanceAfter.toNumber(), accountBalanceBefore.plus(100).toNumber(), "Account has incorrect ERC20 balance");
			assert.equal(aotokenBalanceAfter.toNumber(), aotokenBalanceBefore.minus(100).toNumber(), "AOToken has incorrect ERC20 balance");
		});

		it("The AO - freezeAccount() can freeze account", async function() {
			var canFreezeAccount;
			try {
				await aotoken.freezeAccount(account2, true, { from: someAddress });
				canFreezeAccount = true;
			} catch (e) {
				canFreezeAccount = false;
			}
			assert.notEqual(canFreezeAccount, true, "Others can freeze account");
			try {
				await aotoken.freezeAccount(account2, true, { from: account1 });
				canFreezeAccount = true;
			} catch (e) {
				canFreezeAccount = false;
			}
			assert.equal(canFreezeAccount, true, "The AO can't mint token");
			var account2Frozen = await aotoken.frozenAccount(account2);
			assert.equal(account2Frozen, true, "Account2 is not frozen after The AO froze his account");

			await aotoken.freezeAccount(account2, false, { from: account1 });
		});

		it("The AO - setPrices() can set prices", async function() {
			var canSetPrices;
			try {
				await aotoken.setPrices(2, 2, { from: someAddress });
				canSetPrices = true;
			} catch (e) {
				canSetPrices = false;
			}
			assert.notEqual(canSetPrices, true, "Others can set network token prices");
			try {
				await aotoken.setPrices(2, 2, { from: account1 });
				canSetPrices = true;
			} catch (e) {
				canSetPrices = false;
			}
			assert.equal(canSetPrices, true, "The AO can't set network token prices");
			var sellPrice = await aotoken.sellPrice();
			var buyPrice = await aotoken.buyPrice();
			assert.equal(sellPrice.toNumber(), 2, "Incorrect sell price");
			assert.equal(buyPrice.toNumber(), 2, "Incorrect buy price");
		});

		it("The AO - should be able to set settingTAOId", async function() {
			var canSetSettingTAOId;
			try {
				await aotoken.setSettingTAOId(settingTAOId, { from: someAddress });
				canSetSettingTAOId = true;
			} catch (e) {
				canSetSettingTAOId = false;
			}
			assert.equal(canSetSettingTAOId, false, "Non-AO can set settingTAOId");

			try {
				await aotoken.setSettingTAOId(settingTAOId, { from: account1 });
				canSetSettingTAOId = true;
			} catch (e) {
				canSetSettingTAOId = false;
			}
			assert.equal(canSetSettingTAOId, true, "The AO can't set settingTAOId");

			var _settingTAOId = await aotoken.settingTAOId();
			assert.equal(_settingTAOId, settingTAOId, "Contract has incorrect settingTAOId");
		});

		it("The AO - should be able to set AOSetting address", async function() {
			var canSetAddress;
			try {
				await aotoken.setAOSettingAddress(aosetting.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set AOSetting address");

			try {
				await aotoken.setAOSettingAddress(aosetting.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set AOSetting address");

			var aoSettingAddress = await aotoken.aoSettingAddress();
			assert.equal(aoSettingAddress, aosetting.address, "Contract has incorrect aoSettingAddress");
		});

		it("The AO - setAODevTeamAddresses() should update AO Dev team addresses", async function() {
			var canSet;
			try {
				await aotoken.setAODevTeamAddresses(aoDevTeam1, aoDevTeam2, { from: someAddress });
				canSet = true;
			} catch (e) {
				canSet = false;
			}
			assert.notEqual(canSet, true, "Non-The AO account can set AO Dev team addresses");

			try {
				await aotoken.setAODevTeamAddresses(aoDevTeam1, aoDevTeam2, { from: account1 });
				canSet = true;
			} catch (e) {
				canSet = false;
			}
			assert.equal(canSet, true, "The AO account can't set AO Dev team addresses");

			var _aoDevTeam1 = await aotoken.aoDevTeam1();
			assert.equal(_aoDevTeam1, aoDevTeam1, "Contract has incorrect aoDevTeam1");

			var _aoDevTeam2 = await aotoken.aoDevTeam2();
			assert.equal(_aoDevTeam2, aoDevTeam2, "Contract has incorrect aoDevTeam2");
		});

		it("The AO - should be able to set AOETH address", async function() {
			var canSetAddress;
			try {
				await aotoken.setAOETHAddress(aoeth.address, { from: someAddress });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, false, "Non-AO can set AOETH address");

			try {
				await aotoken.setAOETHAddress(aoeth.address, { from: account1 });
				canSetAddress = true;
			} catch (e) {
				canSetAddress = false;
			}
			assert.equal(canSetAddress, true, "The AO can't set AOETH address");

			var aoethAddress = await aotoken.aoethAddress();
			assert.equal(aoethAddress, aoeth.address, "Contract has incorrect aoethAddress");
		});
	});

	contract("Network Token Function Tests", function() {
		before(async function() {
			await aotoken.setWhitelist(whitelistedAddress, true, { from: theAO });
		});

		it("Whitelisted address - mintToken()  can mint token", async function() {
			var canMint;
			try {
				await aotoken.mintToken(account1, 100, { from: someAddress });
				canMint = true;
			} catch (e) {
				canMint = false;
			}
			assert.notEqual(canMint, true, "Others can mint token");

			var balanceBefore = await aotoken.balanceOf(account1);
			var totalSupplyBefore = await aotoken.totalSupply();
			try {
				await aotoken.mintToken(account1, 100, { from: whitelistedAddress });
				canMint = true;
			} catch (e) {
				canMint = false;
			}
			assert.equal(canMint, true, "The AO can't mint token");

			var balanceAfter = await aotoken.balanceOf(account1);
			var totalSupplyAfter = await aotoken.totalSupply();

			assert.equal(balanceAfter.toNumber(), balanceBefore.plus(100).toNumber(), "Account1 has incorrect balance after minting");
			assert.equal(totalSupplyAfter.toNumber(), totalSupplyBefore.plus(100).toNumber(), "Contract has incorrect totalSupply");
		});

		it("WhitelistedAddress - stakeFrom() should be able to stake tokens on behalf of others", async function() {
			var account1BalanceBefore = await aotoken.balanceOf(account1);
			var account1StakedBalanceBefore = await aotoken.stakedBalance(account1);
			var totalSupplyBefore = await aotoken.totalSupply();

			var canStake;
			try {
				await aotoken.stakeFrom(account1, 10, { from: someAddress });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "Account that do not have permission can stake on behalf of others");
			try {
				await aotoken.stakeFrom(account1, 100000, { from: whitelistedAddress });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.notEqual(canStake, true, "Account can stake more than available balance");
			try {
				await aotoken.stakeFrom(account1, 10, { from: whitelistedAddress });
				canStake = true;
			} catch (e) {
				canStake = false;
			}
			assert.equal(canStake, true, "Account that has permission can't stake on behalf of others");

			var account1BalanceAfter = await aotoken.balanceOf(account1);
			var account1StakedBalanceAfter = await aotoken.stakedBalance(account1);
			var totalSupplyAfter = await aotoken.totalSupply();

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

		it("Whitelisted address - unstakeFrom() should be able to unstake tokens on behalf of others", async function() {
			var account1BalanceBefore = await aotoken.balanceOf(account1);
			var account1StakedBalanceBefore = await aotoken.stakedBalance(account1);
			var totalSupplyBefore = await aotoken.totalSupply();

			var canUnstake;
			try {
				await aotoken.unstakeFrom(account1, 10, { from: someAddress });
				canUnstake = true;
			} catch (e) {
				canUnstake = false;
			}
			assert.notEqual(canUnstake, true, "Account that do not have permission can unstake on behalf of others");
			try {
				await aotoken.unstakeFrom(account1, 100000, { from: whitelistedAddress });
				canUnstake = true;
			} catch (e) {
				canUnstake = false;
			}
			assert.notEqual(canUnstake, true, "Account can unstake more than available balance");
			try {
				await aotoken.unstakeFrom(account1, 10, { from: whitelistedAddress });
				canUnstake = true;
			} catch (e) {
				canUnstake = false;
			}
			assert.equal(canUnstake, true, "Account that has permission can't unstake on behalf of others");

			var account1BalanceAfter = await aotoken.balanceOf(account1);
			var account1StakedBalanceAfter = await aotoken.stakedBalance(account1);
			var totalSupplyAfter = await aotoken.totalSupply();

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

		it("Whitelisted address - escrowFrom() should be able to escrow tokens on behalf of others", async function() {
			var account1BalanceBefore = await aotoken.balanceOf(account1);
			var account2BalanceBefore = await aotoken.balanceOf(account2);
			var account2EscrowedBalanceBefore = await aotoken.escrowedBalance(account2);
			var totalSupplyBefore = await aotoken.totalSupply();

			var canEscrow;
			try {
				await aotoken.escrowFrom(account1, account2, 10, { from: someAddress });
				canEscrow = true;
			} catch (e) {
				canEscrow = false;
			}
			assert.notEqual(canEscrow, true, "Account that do not have permission can escrow on behalf of others");
			try {
				await aotoken.escrowFrom(account1, account2, 1000, { from: whitelistedAddress });
				canEscrow = true;
			} catch (e) {
				canEscrow = false;
			}
			assert.notEqual(canEscrow, true, "Account can escrow more than available balance");
			try {
				await aotoken.escrowFrom(account1, account2, 10, { from: whitelistedAddress });
				canEscrow = true;
			} catch (e) {
				canEscrow = false;
			}
			assert.equal(canEscrow, true, "Account that has permission can't escrow on behalf of others");

			var account1BalanceAfter = await aotoken.balanceOf(account1);
			var account2BalanceAfter = await aotoken.balanceOf(account2);
			var account2EscrowedBalanceAfter = await aotoken.escrowedBalance(account2);
			var totalSupplyAfter = await aotoken.totalSupply();

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

		it("Whitelisted address - mintTokenEscrow() should be able to mint and escrow tokens to an account", async function() {
			var account1BalanceBefore = await aotoken.balanceOf(account1);
			var account1EscrowedBalanceBefore = await aotoken.escrowedBalance(account1);
			var totalSupplyBefore = await aotoken.totalSupply();

			var canMintEscrow;
			try {
				await aotoken.mintTokenEscrow(account1, 10, { from: someAddress });
				canMintEscrow = true;
			} catch (e) {
				canMintEscrow = false;
			}
			assert.notEqual(canMintEscrow, true, "Account that do not have permission can mint and escrow");
			try {
				await aotoken.mintTokenEscrow(account1, 10, { from: whitelistedAddress });
				canMintEscrow = true;
			} catch (e) {
				canMintEscrow = false;
			}
			assert.equal(canMintEscrow, true, "Account that has permission can't mint and escrow");

			var account1BalanceAfter = await aotoken.balanceOf(account1);
			var account1EscrowedBalanceAfter = await aotoken.escrowedBalance(account1);
			var totalSupplyAfter = await aotoken.totalSupply();

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

		it("Whitelisted address - unescrowFrom() should be able to unescrow tokens for an account", async function() {
			var account1BalanceBefore = await aotoken.balanceOf(account1);
			var account1EscrowedBalanceBefore = await aotoken.escrowedBalance(account1);
			var totalSupplyBefore = await aotoken.totalSupply();

			var canUnescrow;
			try {
				await aotoken.unescrowFrom(account1, 10, { from: someAddress });
				canUnescrow = true;
			} catch (e) {
				canUnescrow = false;
			}
			assert.notEqual(canUnescrow, true, "Account that do not have permission can unescrow tokens on behalf of others");
			try {
				await aotoken.unescrowFrom(account1, 100000, { from: whitelistedAddress });
				canUnescrow = true;
			} catch (e) {
				canUnescrow = false;
			}
			assert.notEqual(canUnescrow, true, "Account can unescrow more than available balance");
			try {
				await aotoken.unescrowFrom(account1, 10, { from: whitelistedAddress });
				canUnescrow = true;
			} catch (e) {
				canUnescrow = false;
			}
			assert.equal(canUnescrow, true, "Account that has permission can't unescrow on behalf of others");

			var account1BalanceAfter = await aotoken.balanceOf(account1);
			var account1EscrowedBalanceAfter = await aotoken.escrowedBalance(account1);
			var totalSupplyAfter = await aotoken.totalSupply();

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

		it("Whitelisted address - whitelistBurnFrom() should be able to burn tokens on behalf of others", async function() {
			var account1BalanceBefore = await aotoken.balanceOf(account1);
			var totalSupplyBefore = await aotoken.totalSupply();

			var canBurn;
			try {
				await aotoken.whitelistBurnFrom(account1, 10, { from: someAddress });
				canBurn = true;
			} catch (e) {
				canBurn = false;
			}
			assert.notEqual(canBurn, true, "Account that do not have permission can burn on behalf of others");
			try {
				await aotoken.whitelistBurnFrom(account1, 1000000, { from: whitelistedAddress });
				canBurn = true;
			} catch (e) {
				canBurn = false;
			}
			assert.notEqual(canBurn, true, "Account can burn more than available balance");
			try {
				await aotoken.whitelistBurnFrom(account1, 10, { from: whitelistedAddress });
				canBurn = true;
			} catch (e) {
				canBurn = false;
			}
			assert.equal(canBurn, true, "Account that has permission can't burn on behalf of others");

			var account1BalanceAfter = await aotoken.balanceOf(account1);
			var totalSupplyAfter = await aotoken.totalSupply();

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

		it("Whitelisted address - whitelistTransferFrom() should be able to transfer tokens from an address to another address", async function() {
			var account1BalanceBefore = await aotoken.balanceOf(account1);
			var account2BalanceBefore = await aotoken.balanceOf(account2);
			var totalSupplyBefore = await aotoken.totalSupply();

			var canTransferFrom;
			try {
				await aotoken.whitelistTransferFrom(account1, account2, 10, { from: someAddress });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.notEqual(canTransferFrom, true, "Account that do not have permission can transfer on behalf of others");

			try {
				await aotoken.whitelistTransferFrom(account1, account2, 1000000, { from: whitelistedAddress });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.notEqual(canTransferFrom, true, "Account can transfer more than available balance");

			try {
				await aotoken.whitelistTransferFrom(account1, account2, 10, { from: whitelistedAddress });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.equal(canTransferFrom, true, "Account that has permission can't transfer on behalf of others");

			var account1BalanceAfter = await aotoken.balanceOf(account1);
			var account2BalanceAfter = await aotoken.balanceOf(account2);
			var totalSupplyAfter = await aotoken.totalSupply();

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

		it("buy() - user can buy network tokens", async function() {
			await aotoken.setPrices(1, 1, { from: theAO });

			var canBuyToken;
			try {
				await aotoken.buy({ from: account2, value: 10 });
				canBuyToken = true;
			} catch (e) {
				canBuyToken = false;
			}
			assert.notEqual(canBuyToken, true, "Contract does not have enough network token balance to complete user's token purchase");
			await aotoken.mintToken(aotoken.address, 10 ** 20, { from: whitelistedAddress });

			var account2BalanceBefore = await aotoken.balanceOf(account2);
			try {
				await aotoken.buy({ from: account2, value: 10 });
				canBuyToken = true;
			} catch (e) {
				canBuyToken = false;
			}
			var account2BalanceAfter = await aotoken.balanceOf(account2);
			assert.equal(canBuyToken, true, "Fail buying network token from contract");
			assert.equal(
				account2BalanceAfter.toNumber(),
				account2BalanceBefore.plus(10).toNumber(),
				"Account has incorrect balance after buying token"
			);
		});

		it("sell() - user can sell network tokens to contract", async function() {
			await aotoken.setPrices(100, 1, { from: theAO });

			var canSellToken;
			try {
				await aotoken.sell(10, { from: account2 });
				canSellToken = true;
			} catch (e) {
				canSellToken = false;
			}
			assert.notEqual(canSellToken, true, "User can sell tokens to contract even if contract does not have enough ETH balance");

			await aotoken.setPrices(1, 1, { from: theAO });

			var account2BalanceBefore = await aotoken.balanceOf(account2);
			var contractBalanceBefore = await aotoken.balanceOf(aotoken.address);

			try {
				await aotoken.sell(5, { from: account2 });
				canSellToken = true;
			} catch (e) {
				canSellToken = false;
			}
			assert.equal(canSellToken, true, "Fail selling network token to contract");

			var account2BalanceAfter = await aotoken.balanceOf(account2);
			var contractBalanceAfter = await aotoken.balanceOf(aotoken.address);
			assert.equal(
				account2BalanceAfter.toNumber(),
				account2BalanceBefore.minus(5).toNumber(),
				"Account has incorrect balance after selling token"
			);
			assert.equal(
				contractBalanceAfter.toNumber(),
				contractBalanceBefore.plus(5).toNumber(),
				"Contract has incorrect balance after user sell token"
			);
		});

		it("transfer() - should send correct `_value` to `_to` from your account", async function() {
			var account1BalanceBefore = await aotoken.balanceOf(account1);
			var account2BalanceBefore = await aotoken.balanceOf(account2);
			await aotoken.transfer(account2, 10, { from: account1 });
			account1BalanceAfter = await aotoken.balanceOf(account1);
			account2BalanceAfter = await aotoken.balanceOf(account2);
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

		it("burn() - should remove `_value` tokens from the system irreversibly", async function() {
			var account1BalanceBefore = await aotoken.balanceOf(account1);
			await aotoken.burn(10, { from: account1 });
			account1BalanceAfter = await aotoken.balanceOf(account1);
			assert.equal(
				account1BalanceAfter.toNumber(),
				account1BalanceBefore.minus(10).toNumber(),
				"Account1 has incorrect balance after burn"
			);
		});

		it("approve() - should set allowance for other address", async function() {
			var account2AllowanceBefore = await aotoken.allowance(account1, account2);
			await aotoken.approve(account2, 10, { from: account1 });
			var account2AllowanceAfter = await aotoken.allowance(account1, account2);
			assert.equal(
				account2AllowanceAfter.toNumber(),
				account2AllowanceBefore.plus(10).toNumber(),
				"Account2 has incorrect allowance after approve"
			);
		});

		it("transferFrom() - should send `_value` tokens to `_to` in behalf of `_from`", async function() {
			var canTransferFrom;
			try {
				await aotoken.transferFrom(account1, account2, 5, { from: someAddress });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.notEqual(canTransferFrom, true, "Account that was not approved is able to transfer on behalf of other");

			try {
				await aotoken.transferFrom(account1, account2, 1000, { from: account2 });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.notEqual(
				canTransferFrom,
				true,
				"Account that was approved is able to transfer more than it's allowance on behalf of other"
			);

			var account1BalanceBefore = await aotoken.balanceOf(account1);
			var account2BalanceBefore = await aotoken.balanceOf(account2);
			var account2AllowanceBefore = await aotoken.allowance(account1, account2);

			try {
				await aotoken.transferFrom(account1, account2, 5, { from: account2 });
				canTransferFrom = true;
			} catch (e) {
				canTransferFrom = false;
			}
			assert.equal(canTransferFrom, true, "Account that was approved is not able to transfer on behalf of other");

			var account1BalanceAfter = await aotoken.balanceOf(account1);
			var account2BalanceAfter = await aotoken.balanceOf(account2);
			var account2AllowanceAfter = await aotoken.allowance(account1, account2);
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

		it("burnFrom() - should remove `_value` tokens from the system irreversibly on behalf of `_from`", async function() {
			var canBurnFrom;
			try {
				await aotoken.burnFrom(account1, 5, { from: someAddress });
				canBurnFrom = true;
			} catch (e) {
				canBurnFrom = false;
			}
			assert.notEqual(canBurnFrom, true, "Account that was not approved is able to burn on behalf of other");

			try {
				await aotoken.burnFrom(account1, 10, { from: account2 });
				canBurnFrom = true;
			} catch (e) {
				canBurnFrom = false;
			}
			assert.notEqual(canBurnFrom, true, "Account that was approved is able to burn more than it's allowance on behalf of other");

			var account1BalanceBefore = await aotoken.balanceOf(account1);
			var account2AllowanceBefore = await aotoken.allowance(account1, account2);

			try {
				await aotoken.burnFrom(account1, 5, { from: account2 });
				canBurnFrom = true;
			} catch (e) {
				canBurnFrom = false;
			}
			assert.equal(canBurnFrom, true, "Account that was approved is not able to burn on behalf of other");

			var account1BalanceAfter = await aotoken.balanceOf(account1);
			var account2AllowanceAfter = await aotoken.allowance(account1, account2);

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
			await aotoken.freezeAccount(account1, true, { from: theAO });

			var canTransfer;
			try {
				await aotoken.transfer(account2, 10, { from: account1 });
				canTransfer = true;
			} catch (e) {
				canTransfer = false;
			}
			assert.notEqual(canTransfer, true, "Frozen account can transfer");

			// Unfreeze account1
			await aotoken.freezeAccount(account1, false, { from: theAO });
		});

		it("The AO - transferETH() should be able to transfer ETH to an address", async function() {
			await aotoken.buy({ from: account2, value: web3.toWei(2, "ether") });

			var canTransferEth;
			try {
				await aotoken.transferEth(recipient.address, web3.toWei(1, "ether"), { from: someAddress });
				canTransferEth = true;
			} catch (e) {
				canTransferEth = false;
			}
			assert.equal(canTransferEth, false, "Non-AO can transfer ETH out of contract");

			try {
				await aotoken.transferEth(emptyAddress, web3.toWei(1, "ether"), { from: theAO });
				canTransferEth = true;
			} catch (e) {
				canTransferEth = false;
			}
			assert.equal(canTransferEth, false, "The AO can transfer ETH out of contract to invalid address");

			try {
				await aotoken.transferEth(recipient.address, web3.toWei(1000, "ether"), { from: theAO });
				canTransferEth = true;
			} catch (e) {
				canTransferEth = false;
			}
			assert.equal(canTransferEth, false, "The AO can transfer ETH out of contract more than its available balance");

			try {
				await aotoken.transferEth(recipient.address, web3.toWei(1, "ether"), { from: theAO });
				canTransferEth = true;
			} catch (e) {
				canTransferEth = false;
			}
			assert.equal(canTransferEth, true, "The AO can't transfer ETH out of contract");

			var recipientBalance = await web3.eth.getBalance(recipient.address);
			assert.equal(recipientBalance.toNumber(), web3.toWei(1, "ether"), "Recipient has incorrect balance");
		});
	});

	contract("Primordial Token Function Tests", function() {
		var stakedPrimordialWeightedMultiplier;

		var buyPrimordialToken = async function(amount, account, accountLots, withEth) {
			var totalEthForPrimordialBefore = await aotoken.totalEthForPrimordial();
			var availablePrimordialForSaleBefore = await aotoken.availablePrimordialForSale();
			var availableETHBefore = await aotoken.availableETH();
			var totalRedeemedAOETHBefore = await aotoken.totalRedeemedAOETH();
			var accountAOETHBalanceBefore = await aoeth.balanceOf(account);
			var aotokenAOETHBalanceBefore = await aoeth.balanceOf(aotoken.address);

			var aoethTotalSupply = await aoeth.totalSupply();

			var totalLotsBefore = await aotoken.totalLots();
			var primordialTotalBoughtBefore = await aotoken.primordialTotalBought();
			var primordialTotalSupplyBefore = await aotoken.primordialTotalSupply();

			var accountPrimordialBalanceBefore = await aotoken.primordialBalanceOf(account);
			var accountNetworkBalanceBefore = await aotoken.balanceOf(account);
			var accountTotalLotsBefore = await aotoken.totalLotsByAddress(account);

			var aoDevTeam1PrimordialBalanceBefore = await aotoken.primordialBalanceOf(aoDevTeam1);
			var aoDevTeam1NetworkBalanceBefore = await aotoken.balanceOf(aoDevTeam1);

			var aoDevTeam2PrimordialBalanceBefore = await aotoken.primordialBalanceOf(aoDevTeam2);
			var aoDevTeam2NetworkBalanceBefore = await aotoken.balanceOf(aoDevTeam2);

			var theAOPrimordialBalanceBefore = await aotoken.primordialBalanceOf(theAO);
			var theAONetworkBalanceBefore = await aotoken.balanceOf(theAO);

			var primordialBuyPrice = await aotoken.primordialBuyPrice();
			var tokenAmount = new BigNumber(amount).div(primordialBuyPrice);
			if (withEth && new BigNumber(amount).gt(availableETHBefore)) {
				tokenAmount = new BigNumber(availableETHBefore).div(primordialBuyPrice);
			}

			if (primordialTotalBoughtBefore.plus(tokenAmount).gte(totalPrimordialForSale)) {
				tokenAmount = totalPrimordialForSale.minus(primordialTotalBoughtBefore);
			}

			var hasRemainder = false;
			if (new BigNumber(amount).gt(tokenAmount.times(primordialBuyPrice))) {
				hasRemainder = true;
			}
			var remainderAmount = new BigNumber(0);

			var bonus = await aotoken.calculateMultiplierAndBonus(tokenAmount.toNumber());

			var inverseMultiplier = startingPrimordialMultiplier.minus(bonus[0]);
			var theAONetworkTokenBonusAmount = startingNetworkTokenBonusMultiplier
				.minus(bonus[1])
				.plus(endingNetworkTokenBonusMultiplier)
				.times(tokenAmount)
				.div(percentageDivisor);

			var accountWeightedMultiplierBefore = await aotoken.weightedMultiplierByAddress(account);

			var canBuy, events;
			try {
				if (withEth) {
					var result = await aotoken.buyPrimordialToken({ from: account, value: amount });
				} else {
					var result = await aotoken.buyPrimordialTokenWithAOETH(amount, { from: account });
				}
				events = result.logs;
				canBuy = true;
			} catch (e) {
				events = null;
				canBuy = false;
			}
			assert.equal(canBuy, true, "Account can't buy primordial token");
			assert.notEqual(events, null, "Contract didn't emit events during buy primordial token transaction");

			var halfTokenAmount = new BigNumber(tokenAmount).div(2);
			var halfTheAONetworkTokenBonusAmount = new BigNumber(theAONetworkTokenBonusAmount).div(2);

			var accountLotId, aoDevTeam1LotId, aoDevTeam2LotId;
			for (var i = 0; i < events.length; i++) {
				var _event = events[i];
				switch (_event.event) {
					case "LotCreation":
						if (_event.args.lotOwner == account) {
							accountLotId = _event.args.lotId;
							assert.equal(
								_event.args.multiplier.toString(),
								bonus[0].toString(),
								"Account Lot Creation has incorrect multiplier"
							);
							assert.equal(
								_event.args.primordialTokenAmount.toString(),
								tokenAmount.toString(),
								"Account Lot Creation has incorrect tokenAmount"
							);
							assert.equal(
								_event.args.networkTokenBonusAmount.toString(),
								bonus[2].toString(),
								"Account Lot Creation has incorrect networkTokenBonusAmount"
							);
						} else if (_event.args.lotOwner == aoDevTeam1) {
							aoDevTeam1LotId = _event.args.lotId;
							assert.equal(
								_event.args.multiplier.toString(),
								inverseMultiplier.toString(),
								"aoDevTeam1 Lot Creation has incorrect multiplier"
							);
							assert.equal(
								_event.args.primordialTokenAmount.toString(),
								halfTokenAmount.toString(),
								"aoDevTeam1 Lot Creation has incorrect tokenAmount"
							);
							assert.equal(
								_event.args.networkTokenBonusAmount.toString(),
								halfTheAONetworkTokenBonusAmount.toString(),
								"aoDevTeam1 Lot Creation has incorrect networkTokenBonusAmount"
							);
						} else if (_event.args.lotOwner == aoDevTeam2) {
							aoDevTeam2LotId = _event.args.lotId;
							assert.equal(
								_event.args.multiplier.toString(),
								inverseMultiplier.toString(),
								"aoDevTeam2 Lot Creation has incorrect multiplier"
							);
							assert.equal(
								_event.args.primordialTokenAmount.toString(),
								halfTokenAmount.toString(),
								"aoDevTeam2 Lot Creation has incorrect tokenAmount"
							);
							assert.equal(
								_event.args.networkTokenBonusAmount.toString(),
								halfTheAONetworkTokenBonusAmount.toString(),
								"aoDevTeam2 Lot Creation has incorrect networkTokenBonusAmount"
							);
						}
						break;
					case "BuyPrimordialToken":
						if (_event.args.lotOwner == account) {
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

			var totalEthForPrimordialAfter = await aotoken.totalEthForPrimordial();
			var availablePrimordialForSaleAfter = await aotoken.availablePrimordialForSale();
			var availableETHAfter = await aotoken.availableETH();
			var totalRedeemedAOETHAfter = await aotoken.totalRedeemedAOETH();
			var accountAOETHBalanceAfter = await aoeth.balanceOf(account);
			var aotokenAOETHBalanceAfter = await aoeth.balanceOf(aotoken.address);

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
						: availableETHBefore.minus(tokenAmount.times(primordialBuyPrice)).toNumber(),
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
				assert.equal(
					aotokenAOETHBalanceAfter.toNumber(),
					aotokenAOETHBalanceBefore.toNumber(),
					"AOToken has incorrect AOETH balance"
				);
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
					aotokenAOETHBalanceAfter.toNumber(),
					aotokenAOETHBalanceBefore
						.plus(amount)
						.minus(remainderAmount)
						.toNumber(),
					"AOToken has incorrect AOETH balance"
				);
			}
			assert.equal(
				availablePrimordialForSaleAfter.toNumber(),
				availablePrimordialForSaleBefore.minus(tokenAmount).toNumber(),
				"Contract has incorrect value for availablePrimordialForSale"
			);

			var totalLotsAfter = await aotoken.totalLots();
			var primordialTotalBoughtAfter = await aotoken.primordialTotalBought();
			var primordialTotalSupplyAfter = await aotoken.primordialTotalSupply();

			var accountPrimordialBalanceAfter = await aotoken.primordialBalanceOf(account);
			var accountNetworkBalanceAfter = await aotoken.balanceOf(account);
			var accountTotalLotsAfter = await aotoken.totalLotsByAddress(account);

			var aoDevTeam1PrimordialBalanceAfter = await aotoken.primordialBalanceOf(aoDevTeam1);
			var aoDevTeam1NetworkBalanceAfter = await aotoken.balanceOf(aoDevTeam1);

			var aoDevTeam2PrimordialBalanceAfter = await aotoken.primordialBalanceOf(aoDevTeam2);
			var aoDevTeam2NetworkBalanceAfter = await aotoken.balanceOf(aoDevTeam2);

			var theAOPrimordialBalanceAfter = await aotoken.primordialBalanceOf(theAO);
			var theAONetworkBalanceAfter = await aotoken.balanceOf(theAO);

			assert.equal(totalLotsAfter.toString(), totalLotsBefore.plus(3).toString(), "Contract has incorrect totalLots");
			assert.equal(
				primordialTotalBoughtAfter.toString(),
				primordialTotalBoughtBefore.plus(tokenAmount).toString(),
				"Contract has incorrect primordialTotalBought"
			);
			assert.equal(
				primordialTotalSupplyAfter.toString(),
				primordialTotalSupplyBefore
					.plus(tokenAmount)
					.plus(halfTokenAmount)
					.plus(halfTokenAmount)
					.toString(),
				"Contract has incorrect primordialTotalSupply"
			);

			assert.equal(
				accountPrimordialBalanceAfter.toString(),
				accountPrimordialBalanceBefore.plus(tokenAmount).toString(),
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
				aoDevTeam1PrimordialBalanceBefore.plus(halfTokenAmount).toString(),
				"aoDevTeam1 has incorrect primordial balance"
			);
			assert.equal(
				aoDevTeam1NetworkBalanceAfter.toString(),
				aoDevTeam1NetworkBalanceBefore.plus(halfTheAONetworkTokenBonusAmount).toString(),
				"aoDevTeam1 has incorrect network balance"
			);

			assert.equal(
				aoDevTeam2PrimordialBalanceAfter.toString(),
				aoDevTeam2PrimordialBalanceBefore.plus(halfTokenAmount).toString(),
				"aoDevTeam2 has incorrect primordial balance"
			);
			assert.equal(
				aoDevTeam2NetworkBalanceAfter.toString(),
				aoDevTeam2NetworkBalanceBefore.plus(halfTheAONetworkTokenBonusAmount).toString(),
				"aoDevTeam2 has incorrect network balance"
			);

			assert.equal(
				theAOPrimordialBalanceAfter.toString(),
				theAOPrimordialBalanceBefore.toString(),
				"The AO has incorrect primordial balance"
			);
			assert.equal(
				theAONetworkBalanceAfter.toString(),
				theAONetworkBalanceBefore.plus(theAONetworkTokenBonusAmount).toString(),
				"The AO has incorrect network balance"
			);

			// Make sure the Lot is stored correctly
			var accountLot = await aotoken.lotById(accountLotId);
			assert.equal(accountLot[0], accountLotId, "Lot has incorrect ID");
			assert.equal(accountLot[1], account, "Lot has incorrect lot owner");
			assert.equal(accountLot[2].toString(), bonus[0].toString(), "Lot has incorrect multiplier");
			assert.equal(accountLot[3].toString(), tokenAmount.toString(), "Lot has incorrect tokenAmount");

			var aoDevTeam1Lot = await aotoken.lotById(aoDevTeam1LotId);
			assert.equal(aoDevTeam1Lot[0], aoDevTeam1LotId, "Lot has incorrect ID");
			assert.equal(aoDevTeam1Lot[1], aoDevTeam1, "Lot has incorrect lot owner");
			assert.equal(aoDevTeam1Lot[2].toString(), inverseMultiplier.toString(), "Lot has incorrect multiplier");
			assert.equal(aoDevTeam1Lot[3].toString(), halfTokenAmount.toString(), "Lot has incorrect tokenAmount");

			var aoDevTeam2Lot = await aotoken.lotById(aoDevTeam2LotId);
			assert.equal(aoDevTeam2Lot[0], aoDevTeam2LotId, "Lot has incorrect ID");
			assert.equal(aoDevTeam2Lot[1], aoDevTeam2, "Lot has incorrect lot owner");
			assert.equal(aoDevTeam2Lot[2].toString(), inverseMultiplier.toString(), "Lot has incorrect multiplier");
			assert.equal(aoDevTeam2Lot[3].toString(), halfTokenAmount.toString(), "Lot has incorrect tokenAmount");

			accountLots.push(accountLot);

			var newWeightedMultiplier = await library.calculateWeightedMultiplier(
				accountWeightedMultiplierBefore.toNumber(),
				accountPrimordialBalanceBefore.toNumber(),
				accountLot[2].toNumber(),
				accountLot[3].toNumber()
			);

			var accountWeightedMultiplier = await aotoken.weightedMultiplierByAddress(account);
			assert.equal(
				accountWeightedMultiplier.toString(),
				newWeightedMultiplier.toString(),
				"Account has incorrect weighted multiplier"
			);

			// Check max multiplier for the account
			// should be the same as multiplier from account's lot #1
			var maxMultiplier = await aotoken.maxMultiplierByAddress(account);
			assert.equal(maxMultiplier.toString(), accountLots[0][2].toString(), "Account has incorrect maxMultiplier");

			return accountLotId;
		};

		var debug = async function(account) {
			var totalEthForPrimordial = await aotoken.totalEthForPrimordial();
			var availablePrimordialForSale = await aotoken.availablePrimordialForSale();
			var aoethTotalSupply = await aoeth.totalSupply();
			var primordialTotalBought = await aotoken.primordialTotalBought();
			var availableETH = await aotoken.availableETH();
			var totalRedeemedAOETH = await aotoken.totalRedeemedAOETH();
			var accountAOETHBalance = await aoeth.balanceOf(account);
			var aotokenAOETHBalance = await aoeth.balanceOf(aotoken.address);

			console.log("Total ETH For Primordial", totalEthForPrimordial.toNumber());
			console.log("Available Primordial For Sale", availablePrimordialForSale.toNumber());
			console.log("AOETH Total Supply", aoethTotalSupply.toNumber());
			console.log("Primordial Total Bought", primordialTotalBought.toNumber());
			console.log("Available ETH", availableETH.toNumber());
			console.log("Total Redeemed AOETH", totalRedeemedAOETH.toNumber());
			console.log("Account AOETH", accountAOETHBalance.toNumber());
			console.log("AOToken AOETH", aotokenAOETHBalance.toNumber());
		};

		before(async function() {
			await aotoken.setWhitelist(whitelistedAddress, true, { from: theAO });

			// Give account 1 some aoeth tokens
			await aoeth.addERC20Token(tokenone.address, 1, 10 ** 6, { from: theAO });
			await tokenone.transfer(account1, 10 ** 6, { from: theAO });
			await tokenone.approveAndCall(aoeth.address, 10 ** 6, "", { from: account1 });
		});

		it("The AO - setPrimordialPrices() can set Primordial prices", async function() {
			var canSetPrimordialPrices;
			try {
				await aotoken.setPrimordialPrices(100, 100, { from: someAddress });
				canSetPrimordialPrices = true;
			} catch (e) {
				canSetPrimordialPrices = false;
			}
			assert.notEqual(canSetPrimordialPrices, true, "Others can set Primordial token prices");
			try {
				await aotoken.setPrimordialPrices(100, 100, { from: theAO });
				canSetPrimordialPrices = true;
			} catch (e) {
				canSetPrimordialPrices = false;
			}
			assert.equal(canSetPrimordialPrices, true, "The AO can't set Primordial token prices");
			var primordialSellPrice = await aotoken.primordialSellPrice();
			var primordialBuyPrice = await aotoken.primordialBuyPrice();
			assert.equal(primordialSellPrice.toNumber(), 100, "Incorrect Primordial sell price");
			assert.equal(primordialBuyPrice.toNumber(), 100, "Incorrect Primordial buy price");

			// reset primordial prices
			await aotoken.setPrimordialPrices(0, 10000, { from: theAO });
		});

		it("calculateMultiplierAndBonus() - should calculate the primordial token multiplier, bonus network token percentage and the bonus network token amount on a given lot when account purchases primordial token during network exchange", async function() {
			var primordialTotalBought = await aotoken.primordialTotalBought();
			var purchaseAmount = 10000;
			var primordialMultiplier = await library.calculatePrimordialMultiplier(
				purchaseAmount,
				totalPrimordialForSale.toString(),
				primordialTotalBought.toString(),
				startingPrimordialMultiplier.toString(),
				endingPrimordialMultiplier.toString()
			);
			var bonusPercentage = await library.calculateNetworkTokenBonusPercentage(
				purchaseAmount,
				totalPrimordialForSale.toString(),
				primordialTotalBought.toString(),
				startingNetworkTokenBonusMultiplier.toString(),
				endingNetworkTokenBonusMultiplier.toString()
			);
			var bonusAmount = await library.calculateNetworkTokenBonusAmount(
				purchaseAmount,
				totalPrimordialForSale.toString(),
				primordialTotalBought.toString(),
				startingNetworkTokenBonusMultiplier.toString(),
				endingNetworkTokenBonusMultiplier.toString()
			);

			var multiplierAndBonus = await aotoken.calculateMultiplierAndBonus(purchaseAmount);
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

		it("buyPrimordialToken() - buy Primordial tokens from contract by sending ETH", async function() {
			var canBuy;
			try {
				await aotoken.buyPrimordialToken({ from: account1, value: 0 });
				canBuy = true;
			} catch (e) {
				canBuy = false;
			}
			assert.equal(canBuy, false, "Buy Primordial token succeeded even though user sent 0 ETH");
			await buyPrimordialToken(web3.toWei(2, "ether"), account1, account1Lots, true);
		});

		it("buyPrimordialToken() - should re-calculate existing `account` lots' indexes and update his/her overall weighted index", async function() {
			await buyPrimordialToken(web3.toWei(3, "ether"), account1, account1Lots, true);
			await buyPrimordialToken(web3.toWei(5, "ether"), account1, account1Lots, true);
		});

		it("buyPrimordialTokenWithAOETH() - buy Primordial tokens from contract by sending AOETH", async function() {
			var canBuy;
			try {
				await aotoken.buyPrimordialTokenWithAOETH(100, { from: account2 });
				canBuy = true;
			} catch (e) {
				canBuy = false;
			}
			assert.equal(canBuy, false, "Account can buy primordial token with AOETH even though he/she does not have enough balance");

			await buyPrimordialToken(10 ** 5, account1, account1Lots, false);
		});

		it("buyPrimordialTokenWithAOETH() - should re-calculate existing `account` lots' indexes and update his/her overall weighted index", async function() {
			await buyPrimordialToken(2 * 10 ** 5, account1, account1Lots, false);
			await buyPrimordialToken(8 * 10 ** 4, account1, account1Lots, false);
		});

		it("should NOT allow buy Primordial if Total Primordial For Sale cap is reached (network exchange has ended)", async function() {
			var availableETH = new BigNumber(await aotoken.availableETH());
			var primordialBuyPrice = new BigNumber(await aotoken.primordialBuyPrice());
			var tokenAmount = availableETH.div(primordialBuyPrice);

			// Sending more ETH than we should to check whether or not the user receives the remainder ETH
			await buyPrimordialToken(availableETH.toNumber(), account2, account2Lots, true);

			var account2PrimordialBalance = await aotoken.primordialBalanceOf(account2);
			assert.equal(
				account2PrimordialBalance.toString(),
				tokenAmount.toString(),
				"Account2 has incorrect Primordial balance after buy Primordial transaction"
			);

			var networkExchangeEnded = await aotoken.networkExchangeEnded();
			assert.equal(networkExchangeEnded, false, "Network exchange is ended before reaching sale cap");

			// Buy the rest with aoeth
			var accountAOETHBalance = await aoeth.balanceOf(account1);
			await buyPrimordialToken(accountAOETHBalance.toNumber(), account1, account1Lots, false);

			var networkExchangeEnded = await aotoken.networkExchangeEnded();
			assert.equal(networkExchangeEnded, true, "Network exchange is not ended when total Primordial for sale cap is reached");

			var canBuy;
			try {
				await aotoken.buyPrimordialToken({ from: account2, value: web3.toWei(5, "ether") });
				canBuy = true;
			} catch (e) {
				canBuy = false;
			}
			assert.equal(canBuy, false, "Buy Primordial token succeeded even though Network exchange has ended");
		});

		it("transferPrimordialToken() - should send correct `_value` to `_to` from your account", async function() {
			var account1PrimordialBalanceBefore = await aotoken.primordialBalanceOf(account1);
			var account3PrimordialBalanceBefore = await aotoken.primordialBalanceOf(account3);
			var account1WeightedMultiplierBefore = await aotoken.weightedMultiplierByAddress(account1);
			var account3WeightedMultiplierBefore = await aotoken.weightedMultiplierByAddress(account3);

			var totalLotsBefore = await aotoken.totalLots();
			var primordialTotalSupplyBefore = await aotoken.primordialTotalSupply();

			var canTransfer, events;
			try {
				var result = await aotoken.transferPrimordialToken(account3, 100, { from: account1 });
				events = result.logs;
				canTransfer = true;
			} catch (e) {
				events = null;
				canTransfer = false;
			}
			assert.equal(canTransfer, true, "Account1 can't transfer primordial token");
			assert.notEqual(events, null, "Contract didn't emit events during transfer primordial token");

			var accountLotId;
			for (var i = 0; i < events.length; i++) {
				var _event = events[i];
				switch (_event.event) {
					case "LotCreation":
						accountLotId = _event.args.lotId;
						assert.equal(
							_event.args.multiplier.toString(),
							account1WeightedMultiplierBefore.toString(),
							"Account Lot Creation has incorrect multiplier"
						);
						assert.equal(_event.args.primordialTokenAmount.toString(), 100, "Account Lot Creation has incorrect tokenAmount");
						assert.equal(
							_event.args.networkTokenBonusAmount.toString(),
							0,
							"Account Lot Creation has incorrect networkTokenBonusAmount"
						);
						break;
					default:
						break;
				}
			}

			var account1PrimordialBalanceAfter = await aotoken.primordialBalanceOf(account1);
			var account3PrimordialBalanceAfter = await aotoken.primordialBalanceOf(account3);
			var account1WeightedMultiplierAfter = await aotoken.weightedMultiplierByAddress(account1);
			var account3WeightedMultiplierAfter = await aotoken.weightedMultiplierByAddress(account3);

			var totalLotsAfter = await aotoken.totalLots();
			var primordialTotalSupplyAfter = await aotoken.primordialTotalSupply();

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
			var accountLot = await aotoken.lotById(accountLotId);
			assert.equal(accountLot[0], accountLotId, "Lot has incorrect ID");
			assert.equal(accountLot[1], account3, "Lot has incorrect lot owner");
			assert.equal(accountLot[2].toString(), account1WeightedMultiplierAfter.toString(), "Lot has incorrect multiplier");
			assert.equal(accountLot[3].toString(), 100, "Lot has incorrect tokenAmount");

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
		});

		it("maxMultiplierByAddress() - should return the max multiplier of an address (the multiplier of the first lot of the account)", async function() {
			var maxMultiplier = await aotoken.maxMultiplierByAddress(account1);
			assert.equal(maxMultiplier.toString(), account1Lots[0][2].toString(), "Account1 has incorrect max multiplier");

			maxMultiplier = await aotoken.maxMultiplierByAddress(account2);
			assert.equal(maxMultiplier.toString(), account2Lots[0][2].toString(), "Account2 has incorrect max multiplier");

			maxMultiplier = await aotoken.maxMultiplierByAddress(account3);
			assert.equal(maxMultiplier.toString(), account3Lots[0][2].toString(), "Account3 has incorrect max multiplier");
		});

		it("calculateMaximumBurnAmount() - should return the maximum amount of primordial an account can burn", async function() {
			var accountPrimordialBalance = await aotoken.primordialBalanceOf(account1);
			var accountWeightedMultiplier = await aotoken.weightedMultiplierByAddress(account1);
			var accountMaxMultiplier = await aotoken.maxMultiplierByAddress(account1);
			var _maxBurnAmount = await library.calculateMaximumBurnAmount(
				accountPrimordialBalance.toString(),
				accountWeightedMultiplier.toString(),
				accountMaxMultiplier.toString()
			);

			var maxBurnAmount = await aotoken.calculateMaximumBurnAmount(account1);

			assert.equal(
				maxBurnAmount.toString(),
				_maxBurnAmount.toString(),
				"calculateMaximumBurnAmount() returns incorrect max burn amount"
			);
		});

		it("calculateMultiplierAfterBurn() - should return the new multiplier after burn primordial tokens", async function() {
			var accountPrimordialBalance = await aotoken.primordialBalanceOf(account1);
			var accountWeightedMultiplier = await aotoken.weightedMultiplierByAddress(account1);
			var maxBurnAmount = await aotoken.calculateMaximumBurnAmount(account1);
			var accountMaxMultiplier = await aotoken.maxMultiplierByAddress(account1);
			var canCalculate, multiplierAfterBurn;
			try {
				multiplierAfterBurn = await aotoken.calculateMultiplierAfterBurn(account1, maxBurnAmount.plus(100).toString());
				canCalculate = true;
			} catch (e) {
				multiplierAfterBurn = null;
				canCalculate = false;
			}
			assert.equal(canCalculate, false, "calculateMultiplierAfterBurn() returns result even though amount to burn > max burn amount");
			var burnAmount = maxBurnAmount.minus(10);
			try {
				multiplierAfterBurn = await aotoken.calculateMultiplierAfterBurn(account1, burnAmount.toString());
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

		it("burnPrimordialToken() - should remove `_value` tokens from the system irreversibly and re-weight the multiplier", async function() {
			var burnPrimordialToken = async function(account, burnAmount) {
				var accountPrimordialBalanceBefore = await aotoken.primordialBalanceOf(account);
				var accountWeightedMultiplierBefore = await aotoken.weightedMultiplierByAddress(account);
				var primordialTotalSupplyBefore = await aotoken.primordialTotalSupply();

				var canBurn, burnLotCreationEvent, burnLotId;
				var totalBurnLotsByAddressBefore = await aotoken.totalBurnLotsByAddress(account);
				var multiplierAfterBurn = await aotoken.calculateMultiplierAfterBurn(account, burnAmount.toString());
				try {
					var result = await aotoken.burnPrimordialToken(burnAmount.toString(), { from: account });
					burnLotCreationEvent = result.logs[0];
					burnLotId = burnLotCreationEvent.args.burnLotId;
					canBurn = true;
				} catch (e) {
					burnLotCreationEvent = null;
					primordialBurnEvent = null;
					burnLotId = null;
					canBurn = false;
				}
				assert.equal(canBurn, true, "Account can't burn primordial token");

				var accountPrimordialBalanceAfter = await aotoken.primordialBalanceOf(account);
				var accountWeightedMultiplierAfter = await aotoken.weightedMultiplierByAddress(account);
				var primordialTotalSupplyAfter = await aotoken.primordialTotalSupply();

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

				var burnLot = await aotoken.burnLotById(burnLotId);
				assert.equal(burnLot[0], burnLotId, "Burn Lot has incorrect burnLotId");
				assert.equal(burnLot[1], account, "Burn Lot has incorrect burn lotOwner");
				assert.equal(burnLot[2], burnAmount.toString(), "Burn Lot has incorrect tokenAmount");

				var burnLotIdsByAddress = await aotoken.burnLotIdsByAddress(account);
				assert.include(burnLotIdsByAddress, burnLotId, "burnLotIdsByAddress() is missing a value");

				var totalBurnLotsByAddressAfter = await aotoken.totalBurnLotsByAddress(account);
				assert.equal(
					totalBurnLotsByAddressAfter.toNumber(),
					totalBurnLotsByAddressBefore.plus(1).toNumber(),
					"totalBurnLotsByAddress() returns incorrect value"
				);
			};

			var maxBurnAmount = await aotoken.calculateMaximumBurnAmount(account1);
			var canBurn, burnLotCreationEvent, burnLotId;
			try {
				var result = await aotoken.burnPrimordialToken(maxBurnAmount.plus(10).toString(), { from: account1 });
				burnLotCreationEvent = result.logs[0];
				burnLotId = burnLotCreationEvent.args.burnLotId;
				canBurn = true;
			} catch (e) {
				burnLotCreationEvent = null;
				primordialBurnEvent = null;
				burnLotId = null;
				canBurn = false;
			}
			assert.equal(canBurn, false, "Account can burn more than maximum burn amount");

			await burnPrimordialToken(account1, new BigNumber(5));
			await burnPrimordialToken(account1, new BigNumber(10));
			await burnPrimordialToken(account1, new BigNumber(1000));
		});

		it("approvePrimordialToken() - should set Primordial allowance for other address", async function() {
			var account3PrimordialAllowance = await aotoken.primordialAllowance(account1, account3);
			assert.equal(account3PrimordialAllowance.toNumber(), 0, "Account3 has incorrect Primordial allowance before approve");
			await aotoken.approvePrimordialToken(account3, 20, { from: account1 });
			account3PrimordialAllowance = await aotoken.primordialAllowance(account1, account3);
			assert.equal(account3PrimordialAllowance.toNumber(), 20, "Account3 has incorrect Primordial allowance after approve");
		});

		it("transferPrimordialTokenFrom() - should send `_value` Primordial tokens to `_to` in behalf of `_from`", async function() {
			var account1PrimordialBalanceBefore = await aotoken.primordialBalanceOf(account1);
			var account3PrimordialBalanceBefore = await aotoken.primordialBalanceOf(account3);
			var account1WeightedMultiplierBefore = await aotoken.weightedMultiplierByAddress(account1);
			var account3WeightedMultiplierBefore = await aotoken.weightedMultiplierByAddress(account3);
			var account3PrimordialAllowanceBefore = await aotoken.primordialAllowance(account1, account3);

			var totalLotsBefore = await aotoken.totalLots();
			var primordialTotalSupplyBefore = await aotoken.primordialTotalSupply();

			var canTransfer, events;
			try {
				var result = await aotoken.transferPrimordialTokenFrom(account1, account3, 10, { from: theAO });
				events = result.logs;
				canTransfer = true;
			} catch (e) {
				events = null;
				canTransfer = false;
			}
			assert.notEqual(canTransfer, true, "Account with no allowance can transfer primordial on behalf of other account");

			try {
				var result = await aotoken.transferPrimordialTokenFrom(account1, account3, 100, { from: account3 });
				events = result.logs;
				canTransfer = true;
			} catch (e) {
				events = null;
				canTransfer = false;
			}
			assert.notEqual(canTransfer, true, "Account can transfer primordial on behalf of other account more than its allowance");

			try {
				var result = await aotoken.transferPrimordialTokenFrom(account1, account3, 10, { from: account3 });
				events = result.logs;
				canTransfer = true;
			} catch (e) {
				events = null;
				canTransfer = false;
			}

			assert.equal(canTransfer, true, "Account1 can't transfer primordial token");
			assert.notEqual(events, null, "Contract didn't emit events during transfer primordial token");

			var accountLotId;
			for (var i = 0; i < events.length; i++) {
				var _event = events[i];
				switch (_event.event) {
					case "LotCreation":
						accountLotId = _event.args.lotId;
						assert.equal(
							_event.args.multiplier.toString(),
							account1WeightedMultiplierBefore.toString(),
							"Account Lot Creation has incorrect multiplier"
						);
						assert.equal(_event.args.primordialTokenAmount.toString(), 10, "Account Lot Creation has incorrect tokenAmount");
						assert.equal(
							_event.args.networkTokenBonusAmount.toString(),
							0,
							"Account Lot Creation has incorrect networkTokenBonusAmount"
						);
						break;
					default:
						break;
				}
			}

			var account1PrimordialBalanceAfter = await aotoken.primordialBalanceOf(account1);
			var account3PrimordialBalanceAfter = await aotoken.primordialBalanceOf(account3);
			var account1WeightedMultiplierAfter = await aotoken.weightedMultiplierByAddress(account1);
			var account3WeightedMultiplierAfter = await aotoken.weightedMultiplierByAddress(account3);
			var account3PrimordialAllowanceAfter = await aotoken.primordialAllowance(account1, account3);

			var totalLotsAfter = await aotoken.totalLots();
			var primordialTotalSupplyAfter = await aotoken.primordialTotalSupply();

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

			// Make sure the Lot is stored correctly
			var accountLot = await aotoken.lotById(accountLotId);
			assert.equal(accountLot[0], accountLotId, "Lot has incorrect ID");
			assert.equal(accountLot[1], account3, "Lot has incorrect lot owner");
			assert.equal(accountLot[2].toString(), account1WeightedMultiplierAfter.toString(), "Lot has incorrect multiplier");
			assert.equal(accountLot[3].toString(), 10, "Lot has incorrect tokenAmount");

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
		});

		it("burnPrimordialTokenFrom() - should remove `_value` Primordial tokens from the system irreversibly on behalf of `_from` and re-weight multiplier", async function() {
			var maxBurnAmount = await aotoken.calculateMaximumBurnAmount(account1);
			var accountPrimordialBalanceBefore = await aotoken.primordialBalanceOf(account1);
			var accountWeightedMultiplierBefore = await aotoken.weightedMultiplierByAddress(account1);
			var primordialTotalSupplyBefore = await aotoken.primordialTotalSupply();
			var account3PrimordialAllowanceBefore = await aotoken.primordialAllowance(account1, account3);

			var canBurn, burnLotCreationEvent, burnLotId;
			try {
				var result = await aotoken.burnPrimordialTokenFrom(account1, maxBurnAmount.plus(10).toString(), { from: account3 });
				burnLotCreationEvent = result.logs[0];
				burnLotId = burnLotCreationEvent.args.burnLotId;
				canBurn = true;
			} catch (e) {
				burnLotCreationEvent = null;
				primordialBurnEvent = null;
				burnLotId = null;
				canBurn = false;
			}
			assert.equal(canBurn, false, "Account can burn more than maximum burn amount");

			var burnAmount = new BigNumber(10);
			var multiplierAfterBurn = await aotoken.calculateMultiplierAfterBurn(account1, burnAmount.toString());
			try {
				var result = await aotoken.burnPrimordialTokenFrom(account1, burnAmount.toString(), { from: account3 });
				burnLotCreationEvent = result.logs[0];
				burnLotId = burnLotCreationEvent.args.burnLotId;
				canBurn = true;
			} catch (e) {
				burnLotCreationEvent = null;
				primordialBurnEvent = null;
				burnLotId = null;
				canBurn = false;
			}
			assert.equal(canBurn, true, "Account can't burn primordial token");

			var accountPrimordialBalanceAfter = await aotoken.primordialBalanceOf(account1);
			var accountWeightedMultiplierAfter = await aotoken.weightedMultiplierByAddress(account1);
			var primordialTotalSupplyAfter = await aotoken.primordialTotalSupply();
			var account3PrimordialAllowanceAfter = await aotoken.primordialAllowance(account1, account3);

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

			var burnLot = await aotoken.burnLotById(burnLotId);
			assert.equal(burnLot[0], burnLotId, "Burn Lot has incorrect burnLotId");
			assert.equal(burnLot[1], account1, "Burn Lot has incorrect burn lotOwner");
			assert.equal(burnLot[2], burnAmount.toString(), "Burn Lot has incorrect tokenAmount");
		});

		it("calculateMultiplierAfterConversion() - should return the new multiplier after converting network token to primordial tokens", async function() {
			var accountPrimordialBalance = await aotoken.primordialBalanceOf(account1);
			var accountWeightedMultiplier = await aotoken.weightedMultiplierByAddress(account1);
			var convertAmount = new BigNumber(100);
			var multiplierAfterConversion = await aotoken.calculateMultiplierAfterConversion(account1, convertAmount.toString());

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

		it("convertToPrimordial() - should convert network token to primordial tokens and re-weight multiplier", async function() {
			var convertToPrimordial = async function(account, convertAmount) {
				var accountNetworkBalanceBefore = await aotoken.balanceOf(account);
				var accountPrimordialBalanceBefore = await aotoken.primordialBalanceOf(account);
				var accountWeightedMultiplierBefore = await aotoken.weightedMultiplierByAddress(account);
				var networkTotalSupplyBefore = await aotoken.totalSupply();
				var primordialTotalSupplyBefore = await aotoken.primordialTotalSupply();

				var canConvert, convertLotId;
				var totalConvertLotsByAddressBefore = await aotoken.totalConvertLotsByAddress(account);

				var multiplierAfterConversion = await aotoken.calculateMultiplierAfterConversion(account, convertAmount.toString());
				try {
					var result = await aotoken.convertToPrimordial(convertAmount.toString(), { from: account });
					for (var i = 0; i < result.logs.length; i++) {
						var log = result.logs[i];
						if (log.event == "ConvertLotCreation") {
							convertLotId = log.args.convertLotId;
							break;
						}
					}
					canConvert = true;
				} catch (e) {
					convertLotId = null;
					canConvert = false;
				}
				assert.equal(canConvert, true, "Account can't convert network tokens to primordial tokens");

				var accountNetworkBalanceAfter = await aotoken.balanceOf(account);
				var accountPrimordialBalanceAfter = await aotoken.primordialBalanceOf(account);
				var accountWeightedMultiplierAfter = await aotoken.weightedMultiplierByAddress(account);
				var networkTotalSupplyAfter = await aotoken.totalSupply();
				var primordialTotalSupplyAfter = await aotoken.primordialTotalSupply();

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

				var convertLot = await aotoken.convertLotById(convertLotId);
				assert.equal(convertLot[0], convertLotId, "Convert Lot has incorrect convertLotId");
				assert.equal(convertLot[1], account, "Convert Lot has incorrect convert lotOwner");
				assert.equal(convertLot[2], convertAmount.toString(), "Convert Lot has incorrect tokenAmount");

				var convertLotIdsByAddress = await aotoken.convertLotIdsByAddress(account);
				assert.include(convertLotIdsByAddress, convertLotId, "convertLotIdsByAddress() is missing a value");

				var totalConvertLotsByAddressAfter = await aotoken.totalConvertLotsByAddress(account);
				assert.equal(
					totalConvertLotsByAddressAfter.toNumber(),
					totalConvertLotsByAddressBefore.plus(1).toNumber(),
					"totalConvertLotsByAddress() returns incorrect value"
				);
			};

			var canConvert, convertLotId;
			try {
				var result = await aotoken.convertToPrimordial(10 ** 30, { from: account1 });
				for (var i = 0; i < result.logs.length; i++) {
					var log = result.logs[i];
					if (log.event == "ConvertLotCreation") {
						convertLotId = log.args.convertLotId;
						break;
					}
				}
				canConvert = true;
			} catch (e) {
				convertLotId = null;
				canConvert = false;
			}
			assert.equal(canConvert, false, "Account can convert more network tokens than available balance");

			await convertToPrimordial(account1, new BigNumber(500));
			await convertToPrimordial(account1, new BigNumber(10));
			await convertToPrimordial(account1, new BigNumber(400));
		});

		it("totalLotsByAddress() - should return the correct total lots owned by an address", async function() {
			var account1TotalLots = await aotoken.totalLotsByAddress(account1);
			var account2TotalLots = await aotoken.totalLotsByAddress(account2);
			var account3TotalLots = await aotoken.totalLotsByAddress(account3);
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
			assert.equal(
				account3TotalLots.toNumber(),
				account3Lots.length,
				"totalLotsByAddress() returns incorrect total lots for Account3"
			);
		});

		it("frozen account should NOT be able to transfer Primordial", async function() {
			var canTransferPrimordial;
			await aotoken.freezeAccount(account1, true, { from: theAO });
			try {
				await aotoken.transferPrimordialToken(account2, 10, { from: account1 });
				canTransferPrimordial = true;
			} catch (e) {
				canTransferPrimordial = false;
			}
			assert.notEqual(canTransferPrimordial, true, "Frozen account can transfer Primordial");
			// Unfreeze account1
			await aotoken.freezeAccount(account1, false, { from: theAO });
		});

		it("lotIdsByAddress() - should return all lots owned by an address", async function() {
			var _lots = await aotoken.lotIdsByAddress(account1);
			var isEqual =
				_lots.length === account1Lots.length &&
				_lots.every(function(value, index) {
					return value === account1Lots[index][0];
				});
			assert.equal(isEqual, true, "lotIdsByAddress() return incorrect lots for Account1");

			_lots = await aotoken.lotIdsByAddress(account2);
			isEqual =
				_lots.length === account2Lots.length &&
				_lots.every(function(value, index) {
					return value === account2Lots[index][0];
				});
			assert.equal(isEqual, true, "lotIdsByAddress() return incorrect lots for Account2");

			_lots = await aotoken.lotIdsByAddress(account3);
			isEqual =
				_lots.length === account3Lots.length &&
				_lots.every(function(value, index) {
					return value === account3Lots[index][0];
				});
			assert.equal(isEqual, true, "lotIdsByAddress() return incorrect lots for Account3");
		});

		it("lotById() - should return correct lot information at a given ID", async function() {
			var lot = await aotoken.lotById(account1Lots[0][0]);
			assert.equal(lot[0], account1Lots[0][0], "lotById() return incorrect lot ID");
			assert.equal(lot[1], account1Lots[0][1], "lotById() return incorrect lot owner");
			assert.equal(lot[1].toString(), account1Lots[0][1].toString(), "lotById() return incorrect multiplier");
			assert.equal(lot[2].toString(), account1Lots[0][2].toString(), "lotById() return incorrect token amount");
		});

		it("Whitelisted address - stakePrimordialTokenFrom() should be able to stake Primordial tokens on behalf of others", async function() {
			var account1PrimordialBalanceBefore = await aotoken.primordialBalanceOf(account1);
			var account1WeightedMultiplierBefore = await aotoken.weightedMultiplierByAddress(account1);
			var account1PrimordialStakedBalanceBefore = await aotoken.primordialStakedBalance(
				account1,
				account1WeightedMultiplierBefore.toString()
			);
			var primordialTotalSupplyBefore = await aotoken.primordialTotalSupply();

			var canStakePrimordial;
			try {
				await aotoken.stakePrimordialTokenFrom(account1, 10, account1WeightedMultiplierBefore.toString(), { from: someAddress });
				canStakePrimordial = true;
			} catch (e) {
				canStakePrimordial = false;
			}
			assert.notEqual(
				canStakePrimordial,
				true,
				"Account that do not have permission can stake Primordial tokens on behalf of others"
			);
			try {
				await aotoken.stakePrimordialTokenFrom(account1, 10 ** 20, account1WeightedMultiplierBefore.toString(), {
					from: whitelistedAddress
				});
				canStakePrimordial = true;
			} catch (e) {
				canStakePrimordial = false;
			}
			assert.notEqual(canStakePrimordial, true, "Account can stake more than available balance");
			try {
				await aotoken.stakePrimordialTokenFrom(account1, 10, account1WeightedMultiplierBefore.toString(), {
					from: whitelistedAddress
				});
				canStakePrimordial = true;
			} catch (e) {
				canStakePrimordial = false;
			}
			assert.equal(canStakePrimordial, true, "Account that has permission can't stake Primordial tokens on behalf of others");
			stakedPrimordialWeightedMultiplier = account1WeightedMultiplierBefore.toString();

			var account1PrimordialBalanceAfter = await aotoken.primordialBalanceOf(account1);
			var account1WeightedMultiplierAfter = await aotoken.weightedMultiplierByAddress(account1);
			var account1PrimordialStakedBalanceAfter = await aotoken.primordialStakedBalance(account1, stakedPrimordialWeightedMultiplier);
			var primordialTotalSupplyAfter = await aotoken.primordialTotalSupply();

			assert.equal(
				account1PrimordialBalanceAfter.toString(),
				account1PrimordialBalanceBefore.minus(10).toString(),
				"Account1 has incorrect Primordial tokens balance after staking"
			);
			assert.equal(
				account1WeightedMultiplierAfter.toString(),
				account1WeightedMultiplierBefore.toString(),
				"Account1 has incorrect weighted index after staking"
			);
			assert.equal(
				account1PrimordialStakedBalanceAfter.toString(),
				account1PrimordialStakedBalanceBefore.plus(10).toString(),
				"Account1 has incorrect Primordial tokens staked balance after staking"
			);
			assert.equal(
				primordialTotalSupplyAfter.toString(),
				primordialTotalSupplyBefore.toString(),
				"Contract has incorrect Primordial total supply after staking"
			);
		});

		it("Whitelisted address - unstakePrimordialTokenFrom() should be able to unstake Primordial tokens on behalf of others", async function() {
			var account1PrimordialBalanceBefore = await aotoken.primordialBalanceOf(account1);
			var account1WeightedMultiplierBefore = await aotoken.weightedMultiplierByAddress(account1);
			var account1PrimordialStakedBalanceBefore = await aotoken.primordialStakedBalance(account1, stakedPrimordialWeightedMultiplier);
			var primordialTotalSupplyBefore = await aotoken.primordialTotalSupply();

			var canUnstakePrimordial;
			try {
				await aotoken.unstakePrimordialTokenFrom(account1, 10, stakedPrimordialWeightedMultiplier, { from: someAddress });
				canUnstakePrimordial = true;
			} catch (e) {
				canUnstakePrimordial = false;
			}
			assert.notEqual(
				canUnstakePrimordial,
				true,
				"Account that do not have permission can unstake Primordial tokens on behalf of others"
			);
			try {
				await aotoken.unstakePrimordialTokenFrom(account1, 100000, stakedPrimordialWeightedMultiplier, {
					from: whitelistedAddress
				});
				canUnstakePrimordial = true;
			} catch (e) {
				canUnstakePrimordial = false;
			}
			assert.notEqual(canUnstakePrimordial, true, "Account can unstake more than available balance");
			try {
				await aotoken.unstakePrimordialTokenFrom(account1, 10, stakedPrimordialWeightedMultiplier, { from: whitelistedAddress });
				canUnstakePrimordial = true;
			} catch (e) {
				canUnstakePrimordial = false;
			}
			assert.equal(canUnstakePrimordial, true, "Account that has permission can't unstake Primordial tokens on behalf of others");

			var account1PrimordialBalanceAfter = await aotoken.primordialBalanceOf(account1);
			var account1WeightedMultiplierAfter = await aotoken.weightedMultiplierByAddress(account1);
			var account1PrimordialStakedBalanceAfter = await aotoken.primordialStakedBalance(account1, stakedPrimordialWeightedMultiplier);
			var primordialTotalSupplyAfter = await aotoken.primordialTotalSupply();

			assert.equal(
				account1PrimordialBalanceAfter.toString(),
				account1PrimordialBalanceBefore.plus(10).toString(),
				"Account1 has incorrect Primordial tokens balance after unstaking"
			);
			assert.equal(
				account1WeightedMultiplierAfter.toString(),
				account1WeightedMultiplierBefore.toString(),
				"Account1 has incorrect weighted index after unstaking"
			);
			assert.equal(
				account1PrimordialStakedBalanceAfter.toString(),
				account1PrimordialStakedBalanceBefore.minus(10).toString(),
				"Account1 has incorrect Primordial tokens staked balance after unstaking"
			);
			assert.equal(
				primordialTotalSupplyAfter.toString(),
				primordialTotalSupplyBefore.toString(),
				"Contract has incorrect Primordial total supply after unstaking"
			);
		});

		it("Whitelisted address - whitelistTransferPrimordialTokenFrom() - should send `_value` Primordial tokens to `_to` in behalf of `_from`", async function() {
			var account1PrimordialBalanceBefore = await aotoken.primordialBalanceOf(account1);
			var account3PrimordialBalanceBefore = await aotoken.primordialBalanceOf(account3);
			var account1WeightedMultiplierBefore = await aotoken.weightedMultiplierByAddress(account1);
			var account3WeightedMultiplierBefore = await aotoken.weightedMultiplierByAddress(account3);

			var totalLotsBefore = await aotoken.totalLots();
			var primordialTotalSupplyBefore = await aotoken.primordialTotalSupply();

			var canTransfer, events;
			try {
				var result = await aotoken.whitelistTransferPrimordialTokenFrom(account3, account1, 10 ** 20, { from: whitelistedAddress });
				events = result.logs;
				canTransfer = true;
			} catch (e) {
				events = null;
				canTransfer = false;
			}
			assert.notEqual(canTransfer, true, "Whitelisted address can transfer more than account's balance");

			try {
				var result = await aotoken.whitelistTransferPrimordialTokenFrom(account1, account3, 100, { from: someAddress });
				events = result.logs;
				canTransfer = true;
			} catch (e) {
				events = null;
				canTransfer = false;
			}
			assert.notEqual(canTransfer, true, "Non-whitelisted address can transfer primordial token");

			try {
				var result = await aotoken.whitelistTransferPrimordialTokenFrom(account1, account3, 10, { from: whitelistedAddress });
				events = result.logs;
				canTransfer = true;
			} catch (e) {
				events = null;
				canTransfer = false;
			}

			assert.equal(canTransfer, true, "Account1 can't transfer primordial token");
			assert.notEqual(events, null, "Contract didn't emit events during transfer primordial token");

			var accountLotId;
			for (var i = 0; i < events.length; i++) {
				var _event = events[i];
				switch (_event.event) {
					case "LotCreation":
						accountLotId = _event.args.lotId;
						assert.equal(
							_event.args.multiplier.toString(),
							account1WeightedMultiplierBefore.toString(),
							"Account Lot Creation has incorrect multiplier"
						);
						assert.equal(_event.args.primordialTokenAmount.toString(), 10, "Account Lot Creation has incorrect tokenAmount");
						assert.equal(
							_event.args.networkTokenBonusAmount.toString(),
							0,
							"Account Lot Creation has incorrect networkTokenBonusAmount"
						);
						break;
					default:
						break;
				}
			}

			var account1PrimordialBalanceAfter = await aotoken.primordialBalanceOf(account1);
			var account3PrimordialBalanceAfter = await aotoken.primordialBalanceOf(account3);
			var account1WeightedMultiplierAfter = await aotoken.weightedMultiplierByAddress(account1);
			var account3WeightedMultiplierAfter = await aotoken.weightedMultiplierByAddress(account3);

			var totalLotsAfter = await aotoken.totalLots();
			var primordialTotalSupplyAfter = await aotoken.primordialTotalSupply();

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

			// Make sure the Lot is stored correctly
			var accountLot = await aotoken.lotById(accountLotId);
			assert.equal(accountLot[0], accountLotId, "Lot has incorrect ID");
			assert.equal(accountLot[1], account3, "Lot has incorrect lot owner");
			assert.equal(accountLot[2].toString(), account1WeightedMultiplierAfter.toString(), "Lot has incorrect multiplier");
			assert.equal(accountLot[3].toString(), 10, "Lot has incorrect tokenAmount");

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
		});
	});

	contract("Token Combination Function Tests", function() {
		before(async function() {
			await aotoken.setWhitelist(whitelistedAddress, true, { from: theAO });
			await aotoken.mintToken(account1, 1000, { from: whitelistedAddress });
			await aotoken.buyPrimordialToken({ from: account1, value: web3.toWei(2, "ether") });
			await aotoken.buyPrimordialToken({ from: account1, value: web3.toWei(5, "ether") });
			await aotoken.buyPrimordialToken({ from: account1, value: web3.toWei(3, "ether") });
		});

		it("transferTokens() - should send correct `_value` network tokens and `_primordialValue` Primordial tokens to `_to` from your account", async function() {
			var account1BalanceBefore = await aotoken.balanceOf(account1);
			var account2BalanceBefore = await aotoken.balanceOf(account2);

			var account1PrimordialBalanceBefore = await aotoken.primordialBalanceOf(account1);
			var account2PrimordialBalanceBefore = await aotoken.primordialBalanceOf(account2);

			var account1WeightedMultiplier = await aotoken.weightedMultiplierByAddress(account1);

			await aotoken.transferTokens(account2, 10, 10, { from: account1 });

			var account1BalanceAfter = await aotoken.balanceOf(account1);
			var account2BalanceAfter = await aotoken.balanceOf(account2);

			var account1PrimordialBalanceAfter = await aotoken.primordialBalanceOf(account1);
			var account2PrimordialBalanceAfter = await aotoken.primordialBalanceOf(account2);

			var account2WeightedMultiplier = await aotoken.weightedMultiplierByAddress(account2);

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.minus(10).toString(),
				"Account1 has incorrect network tokens balance after transfer"
			);
			assert.equal(
				account2BalanceAfter.toString(),
				account2BalanceBefore.plus(10).toString(),
				"Account2 has incorrect network tokens balance after transfer"
			);
			assert.equal(
				account1PrimordialBalanceAfter.toString(),
				account1PrimordialBalanceBefore.minus(10).toString(),
				"Account1 has incorrect Primordial Tokens balance after transfer"
			);
			assert.equal(
				account2PrimordialBalanceAfter.toString(),
				account2PrimordialBalanceBefore.plus(10).toString(),
				"Account2 has incorrect Primordial Tokens balance after transfer"
			);
			assert.equal(
				account2WeightedMultiplier.toString(),
				account1WeightedMultiplier.toString(),
				"Account2 has incorrect weighted multiplier after transfer"
			);
		});

		it("burnTokens() - should remove `_value` network tokens and `_primordialValue` Primordial tokens from the system irreversibly and re-weight multiplier", async function() {
			var maxBurnAmount = await aotoken.calculateMaximumBurnAmount(account1);
			var accountNetworkBalanceBefore = await aotoken.balanceOf(account1);
			var accountPrimordialBalanceBefore = await aotoken.primordialBalanceOf(account1);
			var accountWeightedMultiplierBefore = await aotoken.weightedMultiplierByAddress(account1);
			var networkTotalSupplyBefore = await aotoken.totalSupply();
			var primordialTotalSupplyBefore = await aotoken.primordialTotalSupply();

			var canBurn, burnLotId;
			try {
				var result = await aotoken.burnTokens(accountNetworkBalanceBefore.plus(10).toString(), 2, { from: account1 });
				for (var i = 0; i < result.logs.length; i++) {
					var log = result.logs[i];
					if (log.event == "BurnLotCreation") {
						burnLotId = log.args.burnLotId;
						break;
					}
				}
				canBurn = true;
			} catch (e) {
				burnLotId = null;
				canBurn = false;
			}
			assert.equal(canBurn, false, "Account can burn more than maximum network balance");

			try {
				var result = await aotoken.burnTokens(2, maxBurnAmount.plus(10).toString(), { from: account1 });
				for (var i = 0; i < result.logs.length; i++) {
					var log = result.logs[i];
					if (log.event == "BurnLotCreation") {
						burnLotId = log.args.burnLotId;
						break;
					}
				}
				canBurn = true;
			} catch (e) {
				burnLotId = null;
				canBurn = false;
			}
			assert.equal(canBurn, false, "Account can burn more than maximum burn amount");

			var burnAmount = new BigNumber(5);
			var multiplierAfterBurn = await aotoken.calculateMultiplierAfterBurn(account1, burnAmount.toString());
			try {
				var result = await aotoken.burnTokens(burnAmount.toString(), burnAmount.toString(), { from: account1 });
				for (var i = 0; i < result.logs.length; i++) {
					var log = result.logs[i];
					if (log.event == "BurnLotCreation") {
						burnLotId = log.args.burnLotId;
						break;
					}
				}
				canBurn = true;
			} catch (e) {
				burnLotId = null;
				canBurn = false;
			}
			assert.equal(canBurn, true, "Account can't burn network and primordial token");

			var accountNetworkBalanceAfter = await aotoken.balanceOf(account1);
			var accountPrimordialBalanceAfter = await aotoken.primordialBalanceOf(account1);
			var accountWeightedMultiplierAfter = await aotoken.weightedMultiplierByAddress(account1);
			var networkTotalSupplyAfter = await aotoken.totalSupply();
			var primordialTotalSupplyAfter = await aotoken.primordialTotalSupply();

			assert.equal(
				accountNetworkBalanceAfter.toString(),
				accountNetworkBalanceBefore.minus(burnAmount).toString(),
				"Account has incorrect network balance after burn"
			);
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
				networkTotalSupplyAfter.toString(),
				networkTotalSupplyBefore.minus(burnAmount).toString(),
				"Contract has incorrect networkTotalSupply after burn"
			);
			assert.equal(
				primordialTotalSupplyAfter.toString(),
				primordialTotalSupplyBefore.minus(burnAmount).toString(),
				"Contract has incorrect primordialTotalSupply after burn"
			);

			var burnLot = await aotoken.burnLotById(burnLotId);
			assert.equal(burnLot[0], burnLotId, "Burn Lot has incorrect burnLotId");
			assert.equal(burnLot[1], account1, "Burn Lot has incorrect burn lotOwner");
			assert.equal(burnLot[2], burnAmount.toString(), "Burn Lot has incorrect tokenAmount");
		});

		it("approveTokens() - should allow `_spender` to spend no more than `_value` network tokens and `_primordialValue` Primordial tokens in your behalf", async function() {
			var account2AllowanceBefore = await aotoken.allowance(account1, account2);
			var account2PrimordialAllowanceBefore = await aotoken.primordialAllowance(account1, account2);

			await aotoken.approveTokens(account2, 40, 40, { from: account1 });

			var account2AllowanceAfter = await aotoken.allowance(account1, account2);
			var account2PrimordialAllowanceAfter = await aotoken.primordialAllowance(account1, account2);

			assert.equal(
				account2AllowanceAfter.toString(),
				account2AllowanceBefore.plus(40).toString(),
				"Account2 has incorrect network tokens allowance after approve"
			);
			assert.equal(
				account2PrimordialAllowanceAfter.toString(),
				account2PrimordialAllowanceBefore.plus(40).toString(),
				"Account2 has incorrect Primordial Tokens allowance after approve"
			);
		});

		it("transferTokensFrom() - should send `_value` network tokens tokens and `_primordialValue` Primordial Tokens to `_to` in behalf of `_from`", async function() {
			var canTransferTokensFrom;
			try {
				await aotoken.transferTokensFrom(account1, account3, 5, 5, { from: theAO });
				canTransferTokensFrom = true;
			} catch (e) {
				canTransferTokensFrom = false;
			}
			assert.notEqual(canTransferTokensFrom, true, "Account that was not approved is able to transfer tokens on behalf of other");

			var account1BalanceBefore = await aotoken.balanceOf(account1);
			var account3BalanceBefore = await aotoken.balanceOf(account3);
			var account2AllowanceBefore = await aotoken.allowance(account1, account2);

			var account1PrimordialBalanceBefore = await aotoken.primordialBalanceOf(account1);
			var account3PrimordialBalanceBefore = await aotoken.primordialBalanceOf(account3);
			var account2PrimordialAllowanceBefore = await aotoken.primordialAllowance(account1, account2);

			var account1WeightedMultiplierBefore = await aotoken.weightedMultiplierByAddress(account1);

			try {
				await aotoken.transferTokensFrom(account1, account3, 5, 5, { from: account2 });
				canTransferTokensFrom = true;
			} catch (e) {
				canTransferTokensFrom = false;
			}
			assert.equal(canTransferTokensFrom, true, "Account that was approved is not able to transfer on behalf of other");

			var account1BalanceAfter = await aotoken.balanceOf(account1);
			var account3BalanceAfter = await aotoken.balanceOf(account3);
			var account2AllowanceAfter = await aotoken.allowance(account1, account2);

			var account1PrimordialBalanceAfter = await aotoken.primordialBalanceOf(account1);
			var account3PrimordialBalanceAfter = await aotoken.primordialBalanceOf(account3);
			var account2PrimordialAllowanceAfter = await aotoken.primordialAllowance(account1, account2);

			assert.equal(
				account1BalanceAfter.toString(),
				account1BalanceBefore.minus(5).toString(),
				"Account1 has incorrect network tokens balance after transferTokensFrom"
			);
			assert.equal(
				account3BalanceAfter.toString(),
				account3BalanceBefore.plus(5).toString(),
				"Account3 has incorrect network tokens balance after transferTokensFrom"
			);
			assert.equal(
				account2AllowanceAfter.toString(),
				account2AllowanceBefore.minus(5).toString(),
				"Account2 has incorrect network tokens allowance after transferTokensFrom"
			);

			assert.equal(
				account1PrimordialBalanceAfter.toString(),
				account1PrimordialBalanceBefore.minus(5).toString(),
				"Account1 has incorrect Primordial Tokens balance after transferTokensFrom"
			);
			assert.equal(
				account3PrimordialBalanceAfter.toString(),
				account3PrimordialBalanceBefore.plus(5).toString(),
				"Account3 has incorrect Primordial Tokens balance after transferTokensFrom"
			);
			assert.equal(
				account2PrimordialAllowanceAfter.toString(),
				account2PrimordialAllowanceBefore.minus(5).toString(),
				"Account2 has incorrect Primordial Tokens allowance after transferTokensFrom"
			);

			var account1WeightedMultiplierAfter = await aotoken.weightedMultiplierByAddress(account1);
			var account3WeightedMultiplier = await aotoken.weightedMultiplierByAddress(account3);
			assert.equal(
				account1WeightedMultiplierAfter.toString(),
				account1WeightedMultiplierBefore.toString(),
				"Account1 has incorrect weighted multiplier"
			);
			assert.equal(
				account3WeightedMultiplier.toString(),
				account1WeightedMultiplierBefore.toString(),
				"Account3 has incorrect weighted multiplier"
			);
		});

		it("burnTokensFrom() - should remove `_value` network tokens and `_primordialValue` Primordial Tokens from the system irreversibly on behalf of `_from` and re-weight multiplier", async function() {
			var maxBurnAmount = await aotoken.calculateMaximumBurnAmount(account1);
			var accountNetworkBalanceBefore = await aotoken.balanceOf(account1);
			var accountPrimordialBalanceBefore = await aotoken.primordialBalanceOf(account1);
			var accountWeightedMultiplierBefore = await aotoken.weightedMultiplierByAddress(account1);
			var networkTotalSupplyBefore = await aotoken.totalSupply();
			var primordialTotalSupplyBefore = await aotoken.primordialTotalSupply();
			var account2NetworkAllowanceBefore = await aotoken.allowance(account1, account2);
			var account2PrimordialAllowanceBefore = await aotoken.primordialAllowance(account1, account2);

			var canBurn, burnLotId;
			try {
				var result = await aotoken.burnTokensFrom(account1, account2NetworkAllowanceBefore.plus(10).toString(), 2, {
					from: account2
				});
				for (var i = 0; i < result.logs.length; i++) {
					var log = result.logs[i];
					if (log.event == "BurnLotCreation") {
						burnLotId = log.args.burnLotId;
						break;
					}
				}
				canBurn = true;
			} catch (e) {
				burnLotId = null;
				canBurn = false;
			}
			assert.equal(canBurn, false, "Account can burn more than network allowance");

			try {
				var result = await aotoken.burnTokensFrom(account1, 2, account2PrimordialAllowanceBefore.plus(10).toString(), {
					from: account2
				});

				var result = await aotoken.burnTokens(2, maxBurnAmount.plus(10).toString(), { from: account1 });
				for (var i = 0; i < result.logs.length; i++) {
					var log = result.logs[i];
					if (log.event == "BurnLotCreation") {
						burnLotId = log.args.burnLotId;
						break;
					}
				}
				canBurn = true;
			} catch (e) {
				burnLotId = null;
				canBurn = false;
			}
			assert.equal(canBurn, false, "Account can burn more than primordial allowance");

			var burnAmount = new BigNumber(5);
			var multiplierAfterBurn = await aotoken.calculateMultiplierAfterBurn(account1, burnAmount.toString());
			try {
				var result = await aotoken.burnTokensFrom(account1, burnAmount.toString(), burnAmount.toString(), { from: account2 });
				for (var i = 0; i < result.logs.length; i++) {
					var log = result.logs[i];
					if (log.event == "BurnLotCreation") {
						burnLotId = log.args.burnLotId;
						break;
					}
				}
				canBurn = true;
			} catch (e) {
				burnLotId = null;
				canBurn = false;
			}
			assert.equal(canBurn, true, "Account can't burn network and primordial token");

			var accountNetworkBalanceAfter = await aotoken.balanceOf(account1);
			var accountPrimordialBalanceAfter = await aotoken.primordialBalanceOf(account1);
			var accountWeightedMultiplierAfter = await aotoken.weightedMultiplierByAddress(account1);
			var networkTotalSupplyAfter = await aotoken.totalSupply();
			var primordialTotalSupplyAfter = await aotoken.primordialTotalSupply();
			var account2NetworkAllowanceAfter = await aotoken.allowance(account1, account2);
			var account2PrimordialAllowanceAfter = await aotoken.primordialAllowance(account1, account2);

			assert.equal(
				accountNetworkBalanceAfter.toString(),
				accountNetworkBalanceBefore.minus(burnAmount).toString(),
				"Account has incorrect network balance after burn"
			);
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
				networkTotalSupplyAfter.toString(),
				networkTotalSupplyBefore.minus(burnAmount).toString(),
				"Contract has incorrect networkTotalSupply after burn"
			);
			assert.equal(
				primordialTotalSupplyAfter.toString(),
				primordialTotalSupplyBefore.minus(burnAmount).toString(),
				"Contract has incorrect primordialTotalSupply after burn"
			);
			assert.equal(
				account2NetworkAllowanceAfter.toString(),
				account2NetworkAllowanceBefore.minus(burnAmount).toString(),
				"Account has incorrect network allowance after burn"
			);
			assert.equal(
				account2PrimordialAllowanceAfter.toString(),
				account2PrimordialAllowanceBefore.minus(burnAmount).toString(),
				"Account has incorrect primordial allowance after burn"
			);

			var burnLot = await aotoken.burnLotById(burnLotId);
			assert.equal(burnLot[0], burnLotId, "Burn Lot has incorrect burnLotId");
			assert.equal(burnLot[1], account1, "Burn Lot has incorrect burn lotOwner");
			assert.equal(burnLot[2], burnAmount.toString(), "Burn Lot has incorrect tokenAmount");
		});
	});
});
