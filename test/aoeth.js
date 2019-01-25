var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var Logos = artifacts.require("./Logos.sol");

var AOETH = artifacts.require("./AOETH.sol");
var AOToken = artifacts.require("./AOToken.sol");
var TokenOne = artifacts.require("./TokenOne.sol");
var TokenTwo = artifacts.require("./TokenTwo.sol");
var TokenThree = artifacts.require("./TokenThree.sol");

var BigNumber = require("bignumber.js");

BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: 1, EXPONENTIAL_AT: [-10, 40] }); // no rounding

contract("AOETH", function(accounts) {
	var namefactory,
		taofactory,
		nametaoposition,
		logos,
		nameId,
		taoId,
		aoeth,
		aotoken,
		tokenone,
		tokentwo,
		tokenthree,
		erc1,
		erc2,
		exchangeId1;

	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var someAddress = accounts[3];
	var whitelistedAddress = accounts[4];

	before(async function() {
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		logos = await Logos.deployed();
		aoeth = await AOETH.deployed();
		aotoken = await AOToken.deployed();
		tokenone = await TokenOne.deployed();
		tokentwo = await TokenTwo.deployed();
		tokenthree = await TokenThree.deployed();

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
			await aoeth.transferOwnership(taoId, { from: someAddress });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, false, "Non-AO can transfer ownership");

		try {
			await aoeth.transferOwnership(taoId, { from: theAO });
			canTransferOwnership = true;
		} catch (e) {
			canTransferOwnership = false;
		}
		assert.equal(canTransferOwnership, true, "The AO can't transfer ownership");

		var newTheAO = await aoeth.theAO();
		assert.equal(newTheAO, taoId, "Contract has incorrect TheAO address after transferring ownership");
	});

	it("The AO - setWhitelist() should be able to whitelist an address", async function() {
		var canSetWhitelist;
		try {
			await aoeth.setWhitelist(whitelistedAddress, true, { from: someAddress });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, false, "Non-AO can set whitelist");

		try {
			await aoeth.setWhitelist(whitelistedAddress, true, { from: account1 });
			canSetWhitelist = true;
		} catch (e) {
			canSetWhitelist = false;
		}
		assert.equal(canSetWhitelist, true, "The AO can't set whitelist");

		var whitelistStatus = await aoeth.whitelist(whitelistedAddress);
		assert.equal(whitelistStatus, true, "Contract returns incorrect whitelist status for an address");
	});

	it("The AO - setAOTokenAddress() should be able to set AOToken address", async function() {
		var canSetAddress;
		try {
			await aoeth.setAOTokenAddress(aotoken.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set AOToken address");

		try {
			await aoeth.setAOTokenAddress(aotoken.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set AOToken address");

		var aoTokenAddress = await aoeth.aoTokenAddress();
		assert.equal(aoTokenAddress, aotoken.address, "Contract has incorrect aoTokenAddress");
	});

	it("The AO - setNameTAOPositionAddress() should be able to set NameTAOPosition address", async function() {
		var canSetAddress;
		try {
			await aoeth.setNameTAOPositionAddress(nametaoposition.address, { from: someAddress });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, false, "Non-AO can set NameTAOPosition address");

		try {
			await aoeth.setNameTAOPositionAddress(nametaoposition.address, { from: account1 });
			canSetAddress = true;
		} catch (e) {
			canSetAddress = false;
		}
		assert.equal(canSetAddress, true, "The AO can't set NameTAOPosition address");

		var nameTAOPositionAddress = await aoeth.nameTAOPositionAddress();
		assert.equal(nameTAOPositionAddress, nametaoposition.address, "Contract has incorrect nameTAOPositionAddress");
	});

	it("The AO - transferERC20() should be able to transfer ERC20 to an address", async function() {
		await tokenone.transfer(aoeth.address, 100, { from: theAO });

		var accountBalanceBefore = await tokenone.balanceOf(account1);
		var aoethBalanceBefore = await tokenone.balanceOf(aoeth.address);

		var canTransfer;
		try {
			await aoeth.transferERC20(tokenone.address, account1, 10, { from: someAddress });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Non-AO can transfer ERC20 token from AOETH");

		try {
			await aoeth.transferERC20(tokenone.address, account1, 1000, { from: account1 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "The AO can transfer ERC20 token more than owned balance");

		try {
			await aoeth.transferERC20(tokenone.address, account1, 100, { from: account1 });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, true, "The AO can't transfer ERC20 token from AOETH to another recipient");

		var accountBalanceAfter = await tokenone.balanceOf(account1);
		var aoethBalanceAfter = await tokenone.balanceOf(aoeth.address);

		assert.equal(accountBalanceAfter.toNumber(), accountBalanceBefore.plus(100).toNumber(), "Account has incorrect ERC20 balance");
		assert.equal(aoethBalanceAfter.toNumber(), aoethBalanceBefore.minus(100).toNumber(), "AOETH has incorrect ERC20 balance");
	});

	it("The AO - addERC20Token() should not be able to add ERC20 Token to the list with invalid params", async function() {
		var canAdd;
		try {
			var result = await aoeth.addERC20Token(tokenone.address, 1000, 1000000, { from: someAddress });
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.equal(canAdd, false, "Non-AO can add ERC20 Token to the list");

		try {
			var result = await aoeth.addERC20Token(someAddress, 1000, 1000000, { from: account1 });
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.equal(canAdd, false, "The AO can add ERC20 Token to the list with invalid ERC20 Token Address");

		try {
			var result = await aoeth.addERC20Token(tokenone.address, 0, 1000000, { from: account1 });
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.equal(canAdd, false, "The AO can add ERC20 Token to the list with invalid price");

		try {
			var result = await aoeth.addERC20Token(tokenone.address, 1000, 0, { from: account1 });
			canAdd = true;
		} catch (e) {
			canAdd = false;
		}
		assert.equal(canAdd, false, "The AO can add ERC20 Token to the list with invalid maxQuantity");
	});

	it("The AO - addERC20Token() should be able to add ERC20 Token to the list", async function() {
		var addERC20Token = async function(erc20Token, price, maxQuantity) {
			var totalERC20TokensBefore = await aoeth.totalERC20Tokens();

			var canAdd;
			try {
				var result = await aoeth.addERC20Token(erc20Token.address, price, maxQuantity, { from: account1 });
				canAdd = true;
			} catch (e) {
				canAdd = false;
			}
			assert.equal(canAdd, true, "The AO can't add ERC20 Token to the list");

			var totalERC20TokensAfter = await aoeth.totalERC20Tokens();
			assert.equal(
				totalERC20TokensAfter.toNumber(),
				totalERC20TokensBefore.plus(1).toNumber(),
				"Contract has incorrect value for totalERC20Tokens"
			);

			var token = await aoeth.getByAddress(erc20Token.address);
			var tokenName = await erc20Token.name();
			var tokenSymbol = await erc20Token.symbol();

			assert.equal(token[0], erc20Token.address, "getByAddress() returns incorrect tokenAddress");
			assert.equal(token[1], tokenName, "getByAddress() returns incorrect token name");
			assert.equal(token[2], tokenSymbol, "getByAddress() returns incorrect token symbol");
			assert.equal(token[3].toNumber(), price, "getByAddress() returns incorrect price");
			assert.equal(token[4].toNumber(), maxQuantity, "getByAddress() returns incorrect maxQuantity");
			assert.equal(token[5].toNumber(), 0, "getByAddress() returns incorrect exchangedQuantity");
			assert.equal(token[6], true, "getByAddress() returns incorrect status");

			token = await aoeth.getById(totalERC20TokensAfter.toNumber());
			assert.equal(token[0], erc20Token.address, "getById() returns incorrect tokenAddress");
			assert.equal(token[1], tokenName, "getById() returns incorrect token name");
			assert.equal(token[2], tokenSymbol, "getById() returns incorrect token symbol");
			assert.equal(token[3].toNumber(), price, "getById() returns incorrect price");
			assert.equal(token[4].toNumber(), maxQuantity, "getById() returns incorrect maxQuantity");
			assert.equal(token[5].toNumber(), 0, "getById() returns incorrect exchangedQuantity");
			assert.equal(token[6], true, "getById() returns incorrect status");

			try {
				var result = await aoeth.addERC20Token(erc20Token.address, price, maxQuantity, { from: account1 });
				canAdd = true;
			} catch (e) {
				canAdd = false;
			}
			assert.equal(canAdd, false, "The AO can add the same ERC20 Token to the list more than once");
			return erc20Token.address;
		};

		erc1 = await addERC20Token(tokenone, 1000, 100);
		erc2 = await addERC20Token(tokentwo, 10, 100);
	});

	it("The AO - setPrice() should not be able to set price with invalid params", async function() {
		var canSetPrice;
		try {
			var result = await aoeth.setPrice(tokenone.address, 10, { from: someAddress });
			canSetPrice = true;
		} catch (e) {
			canSetPrice = false;
		}
		assert.equal(canSetPrice, false, "Non-AO can set price");

		try {
			var result = await aoeth.setPrice(someAddress, 10, { from: account1 });
			canSetPrice = true;
		} catch (e) {
			canSetPrice = false;
		}
		assert.equal(canSetPrice, false, "The AO can set price of non-existing ERC20 Token");

		try {
			var result = await aoeth.setPrice(tokenone.address, 0, { from: account1 });
			canSetPrice = true;
		} catch (e) {
			canSetPrice = false;
		}
		assert.equal(canSetPrice, false, "The AO can set price of with invalid price");
	});

	it("The AO - setPrice() should be able to set price", async function() {
		var setPrice = async function(tokenAddress, price) {
			var canSetPrice;
			try {
				var result = await aoeth.setPrice(tokenAddress, price, { from: account1 });
				canSetPrice = true;
			} catch (e) {
				canSetPrice = false;
			}
			assert.equal(canSetPrice, true, "The AO can't set price");

			var token = await aoeth.getByAddress(tokenAddress);
			assert.equal(token[3].toNumber(), price, "getByAddress() returns incorrect price");
		};

		await setPrice(tokenone.address, 1000);
		await setPrice(tokentwo.address, 10);
	});

	it("The AO - setMaxQuantity() should not be able to set maxQuantity with invalid params", async function() {
		var canSetMaxQuantity;
		try {
			var result = await aoeth.setMaxQuantity(tokenone.address, 10, { from: someAddress });
			canSetMaxQuantity = true;
		} catch (e) {
			canSetMaxQuantity = false;
		}
		assert.equal(canSetMaxQuantity, false, "Non-AO can set maxQuantity");

		try {
			var result = await aoeth.setMaxQuantity(someAddress, 10, { from: account1 });
			canSetMaxQuantity = true;
		} catch (e) {
			canSetMaxQuantity = false;
		}
		assert.equal(canSetMaxQuantity, false, "The AO can set maxQuantity of non-existing ERC20 Token");

		try {
			var result = await aoeth.setMaxQuantity(tokenone.address, 0, { from: account1 });
			canSetMaxQuantity = true;
		} catch (e) {
			canSetMaxQuantity = false;
		}
		assert.equal(canSetMaxQuantity, false, "The AO can set maxQuantity of with invalid maxQuantity");
	});

	it("The AO - setMaxQuantity() should be able to set maxQuantity", async function() {
		var setMaxQuantity = async function(tokenAddress, maxQuantity) {
			var canSetMaxQuantity;
			try {
				var result = await aoeth.setMaxQuantity(tokenAddress, maxQuantity, { from: account1 });
				canSetMaxQuantity = true;
			} catch (e) {
				canSetMaxQuantity = false;
			}
			assert.equal(canSetMaxQuantity, true, "The AO can't set maxQuantity");

			var token = await aoeth.getByAddress(tokenAddress);
			assert.equal(token[4].toNumber(), maxQuantity, "getByAddress() returns incorrect maxQuantity");
		};

		await setMaxQuantity(tokenone.address, 100);
		await setMaxQuantity(tokentwo.address, 100);
	});

	it("The AO - setActive() should not be able to set active with invalid params", async function() {
		var canSetActive;
		try {
			var result = await aoeth.setActive(tokenone.address, false, { from: someAddress });
			canSetActive = true;
		} catch (e) {
			canSetActive = false;
		}
		assert.equal(canSetActive, false, "Non-AO can set active");

		try {
			var result = await aoeth.setActive(someAddress, false, { from: account1 });
			canSetActive = true;
		} catch (e) {
			canSetActive = false;
		}
		assert.equal(canSetActive, false, "The AO can set active of non-existing ERC20 Token");
	});

	it("The AO - setActive() should be able to set active", async function() {
		var setActive = async function(tokenAddress, active) {
			var canSetActive;
			try {
				var result = await aoeth.setActive(tokenAddress, active, { from: account1 });
				canSetActive = true;
			} catch (e) {
				canSetActive = false;
			}
			assert.equal(canSetActive, true, "The AO can't set active");

			var token = await aoeth.getByAddress(tokenAddress);
			assert.equal(token[6], active, "getByAddress() returns incorrect status");
		};

		await setActive(tokenone.address, true);
		await setActive(tokentwo.address, true);
	});

	it("receiveApproval() - should not send out AOETH if receive approval from ERC20 token that is not in the list", async function() {
		var totalSupplyBefore = await aoeth.totalSupply();

		var canReceiveApproval;
		try {
			await tokenthree.approveAndCall(aoeth.address, 10 ** 3, "", { from: theAO });
			canReceiveApproval = true;
		} catch (e) {
			canReceiveApproval = false;
		}
		assert.equal(canReceiveApproval, false, "ERC20 Token not in the list can approve and call AOETH");

		var totalSupplyAfter = await aoeth.totalSupply();
		assert.equal(totalSupplyAfter.toNumber(), totalSupplyBefore.toNumber(), "Contract has incorrect totalSupply");
	});

	it("receiveApproval() - should not send out AOETH if receive approval from ERC20 token that is not in the list", async function() {
		var totalSupplyBefore = await aoeth.totalSupply();

		var canReceiveApproval;
		try {
			await tokenthree.approveAndCall(aoeth.address, 10 ** 3, "", { from: theAO });
			canReceiveApproval = true;
		} catch (e) {
			canReceiveApproval = false;
		}
		assert.equal(canReceiveApproval, false, "ERC20 Token not in the list can approve and call AOETH");

		var totalSupplyAfter = await aoeth.totalSupply();
		assert.equal(totalSupplyAfter.toNumber(), totalSupplyBefore.toNumber(), "Contract has incorrect totalSupply");
	});

	it("receiveApproval() - should not send out AOETH if receive approval from ERC20 token is not active in the list", async function() {
		var totalSupplyBefore = await aoeth.totalSupply();
		await aoeth.setActive(tokenone.address, false, { from: account1 });

		var canReceiveApproval;
		try {
			await tokenone.approveAndCall(aoeth.address, 10 ** 3, "", { from: theAO });
			canReceiveApproval = true;
		} catch (e) {
			canReceiveApproval = false;
		}
		assert.equal(canReceiveApproval, false, "ERC20 Token that is not active in the list can approve and call AOETH");

		var totalSupplyAfter = await aoeth.totalSupply();
		assert.equal(totalSupplyAfter.toNumber(), totalSupplyBefore.toNumber(), "Contract has incorrect totalSupply");

		await aoeth.setActive(tokenone.address, true, { from: account1 });
	});

	it("receiveApproval() - should not send out AOETH if amount to transfer is more than allowed", async function() {
		var totalSupplyBefore = await aoeth.totalSupply();

		var canReceiveApproval;
		try {
			await tokenone.approveAndCall(aoeth.address, 10 ** 6, "", { from: theAO });
			canReceiveApproval = true;
		} catch (e) {
			canReceiveApproval = false;
		}
		assert.equal(canReceiveApproval, false, "ERC20 Token can approve and call AOETH more than allowed balance");

		var totalSupplyAfter = await aoeth.totalSupply();
		assert.equal(totalSupplyAfter.toNumber(), totalSupplyBefore.toNumber(), "Contract has incorrect totalSupply");
	});

	it("receiveApproval() - should be able to send out AOETH to user when receiving approval from ERC20 token - Token One", async function() {
		var availableETHBefore = await aotoken.availableETH();
		var accountTokenBalanceBefore = await tokenone.balanceOf(theAO);
		var aoEthTokenBalanceBefore = await tokenone.balanceOf(aoeth.address);
		var aoEthTotalSupplyBefore = await aoeth.totalSupply();
		var tokenBefore = await aoeth.getByAddress(tokenone.address);
		var accountAoEthBalanceBefore = await aoeth.balanceOf(theAO);
		var totalTokenExchangesBefore = await aoeth.totalTokenExchanges();
		var totalAddressTokenExchangesBefore = await aoeth.totalAddressTokenExchanges(theAO);

		var sentAmount = new BigNumber(10 ** 5);
		var price = new BigNumber(tokenBefore[3]);
		var amountToTransfer = sentAmount.div(price);

		var _event = aoeth.ExchangeToken();
		_event.watch(async function(error, log) {
			if (!error) {
				if (log.event === "ExchangeToken" && log.args.tokenAddress == tokenone.address) {
					var exchangeId = log.args.exchangeId;

					var availableETHAfter = await aotoken.availableETH();
					var accountTokenBalanceAfter = await tokenone.balanceOf(theAO);
					var aoEthTokenBalanceAfter = await tokenone.balanceOf(aoeth.address);
					var aoEthTotalSupplyAfter = await aoeth.totalSupply();
					var tokenAfter = await aoeth.getByAddress(tokenone.address);
					var accountAoEthBalanceAfter = await aoeth.balanceOf(theAO);
					var totalTokenExchangesAfter = await aoeth.totalTokenExchanges();
					var totalAddressTokenExchangesAfter = await aoeth.totalAddressTokenExchanges(theAO);

					assert.equal(
						availableETHAfter.toNumber(),
						availableETHBefore.minus(amountToTransfer).toNumber(),
						"availableETH() returns incorrect value"
					);

					assert.equal(
						accountTokenBalanceAfter.toNumber(),
						accountTokenBalanceBefore.minus(sentAmount).toNumber(),
						"Account has incorrect ERC20 Token balance"
					);
					assert.equal(
						aoEthTokenBalanceAfter.toNumber(),
						aoEthTokenBalanceBefore.plus(sentAmount).toNumber(),
						"AOETH has incorrect ERC20 Token Balance"
					);
					assert.equal(
						aoEthTotalSupplyAfter.toNumber(),
						aoEthTotalSupplyBefore.plus(amountToTransfer).toNumber(),
						"AOETH has incorrect totalSupply"
					);
					assert.equal(
						tokenAfter[5].toNumber(),
						tokenBefore[5].plus(amountToTransfer).toNumber(),
						"getByAddress() returns incorrect exchangedQuantity"
					);
					assert.equal(
						accountAoEthBalanceAfter.toNumber(),
						accountAoEthBalanceBefore.plus(amountToTransfer).toNumber(),
						"Account has incorrect AOETH balance"
					);
					assert.equal(
						totalTokenExchangesAfter.toNumber(),
						totalTokenExchangesBefore.plus(1).toNumber(),
						"Contract has incorrect totalTokenExchanges"
					);
					assert.equal(
						totalAddressTokenExchangesAfter.toNumber(),
						totalAddressTokenExchangesBefore.plus(1).toNumber(),
						"Contract has incorrect totalAddressTokenExchanges"
					);

					var exchange = await aoeth.getTokenExchangeById(exchangeId);
					var tokenName = await tokenone.name();
					var tokenSymbol = await tokenone.symbol();

					assert.equal(exchange[0], theAO, "TokenExchange has incorrect value for buyer");
					assert.equal(exchange[1], tokenone.address, "TokenExchange has incorrect value for token address");
					assert.equal(exchange[2], tokenName, "TokenExchange has incorrect value for token name");
					assert.equal(exchange[3], tokenSymbol, "TokenExchange has incorrect value for token symbol");
					assert.equal(exchange[4].toNumber(), price.toNumber(), "TokenExchange has incorrect value for price");
					assert.equal(exchange[5].toNumber(), sentAmount.toNumber(), "TokenExchange has incorrect value for sentAmount");
					assert.equal(
						exchange[6].toNumber(),
						amountToTransfer.toNumber(),
						"TokenExchange has incorrect value for receivedAmount"
					);
					assert.equal(web3.toAscii(exchange[7]).replace(/\0/g, ""), "", "TokenExchange has incorrect value for extraData");
				}
			}
			_event.stopWatching();
		});

		// Approve 100000 ERC20 Tokens
		await tokenone.approveAndCall(aoeth.address, sentAmount.toNumber(), "", { from: theAO });
	});

	it("receiveApproval() - should be able to send out AOETH to user when receiving approval from ERC20 token - Token Two", async function() {
		var availableETHBefore = await aotoken.availableETH();
		var accountTokenBalanceBefore = await tokentwo.balanceOf(theAO);
		var aoEthTokenBalanceBefore = await tokentwo.balanceOf(aoeth.address);
		var aoEthTotalSupplyBefore = await aoeth.totalSupply();
		var tokenBefore = await aoeth.getByAddress(tokentwo.address);
		var accountAoEthBalanceBefore = await aoeth.balanceOf(theAO);
		var totalTokenExchangesBefore = await aoeth.totalTokenExchanges();
		var totalAddressTokenExchangesBefore = await aoeth.totalAddressTokenExchanges(theAO);

		var sentAmount = new BigNumber(100);
		var price = new BigNumber(tokenBefore[3]);
		var amountToTransfer = sentAmount.div(price);

		var _event = aoeth.ExchangeToken();
		_event.watch(async function(error, log) {
			if (!error) {
				if (log.event === "ExchangeToken" && log.args.tokenAddress == tokentwo.address) {
					var exchangeId = log.args.exchangeId;

					var availableETHAfter = await aotoken.availableETH();
					var accountTokenBalanceAfter = await tokentwo.balanceOf(theAO);
					var aoEthTokenBalanceAfter = await tokentwo.balanceOf(aoeth.address);
					var aoEthTotalSupplyAfter = await aoeth.totalSupply();
					var tokenAfter = await aoeth.getByAddress(tokentwo.address);
					var accountAoEthBalanceAfter = await aoeth.balanceOf(theAO);
					var totalTokenExchangesAfter = await aoeth.totalTokenExchanges();
					var totalAddressTokenExchangesAfter = await aoeth.totalAddressTokenExchanges(theAO);

					assert.equal(
						availableETHAfter.toNumber(),
						availableETHBefore.minus(amountToTransfer).toNumber(),
						"availableETH() returns incorrect value"
					);

					assert.equal(
						accountTokenBalanceAfter.toNumber(),
						accountTokenBalanceBefore.minus(sentAmount).toNumber(),
						"Account has incorrect ERC20 Token balance"
					);
					assert.equal(
						aoEthTokenBalanceAfter.toNumber(),
						aoEthTokenBalanceBefore.plus(sentAmount).toNumber(),
						"AOETH has incorrect ERC20 Token Balance"
					);
					assert.equal(
						aoEthTotalSupplyAfter.toNumber(),
						aoEthTotalSupplyBefore.plus(amountToTransfer).toNumber(),
						"AOETH has incorrect totalSupply"
					);
					assert.equal(
						tokenAfter[5].toNumber(),
						tokenBefore[5].plus(amountToTransfer).toNumber(),
						"getByAddress() returns incorrect exchangedQuantity"
					);
					assert.equal(
						accountAoEthBalanceAfter.toNumber(),
						accountAoEthBalanceBefore.plus(amountToTransfer).toNumber(),
						"Account has incorrect AOETH balance"
					);
					assert.equal(
						totalTokenExchangesAfter.toNumber(),
						totalTokenExchangesBefore.plus(1).toNumber(),
						"Contract has incorrect totalTokenExchanges"
					);
					assert.equal(
						totalAddressTokenExchangesAfter.toNumber(),
						totalAddressTokenExchangesBefore.plus(1).toNumber(),
						"Contract has incorrect totalAddressTokenExchanges"
					);

					var exchange = await aoeth.getTokenExchangeById(exchangeId);
					var tokenName = await tokentwo.name();
					var tokenSymbol = await tokentwo.symbol();

					assert.equal(exchange[0], theAO, "TokenExchange has incorrect value for buyer");
					assert.equal(exchange[1], tokentwo.address, "TokenExchange has incorrect value for token address");
					assert.equal(exchange[2], tokenName, "TokenExchange has incorrect value for token name");
					assert.equal(exchange[3], tokenSymbol, "TokenExchange has incorrect value for token symbol");
					assert.equal(exchange[4].toNumber(), price.toNumber(), "TokenExchange has incorrect value for price");
					assert.equal(exchange[5].toNumber(), sentAmount.toNumber(), "TokenExchange has incorrect value for sentAmount");
					assert.equal(
						exchange[6].toNumber(),
						amountToTransfer.toNumber(),
						"TokenExchange has incorrect value for receivedAmount"
					);
					assert.equal(web3.toAscii(exchange[7]).replace(/\0/g, ""), "", "TokenExchange has incorrect value for extraData");
				}
			}
			_event.stopWatching();
		});

		// Approve 100 ERC20 Tokens
		await tokentwo.approveAndCall(aoeth.address, sentAmount.toNumber(), "", { from: theAO });
	});

	it("Whitelisted address - should be able to transfer token from an address to another address", async function() {
		var canTransfer;
		try {
			var result = await aoeth.whitelistTransferFrom(theAO, account1, 10, { from: someAddress });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Non-whitelisted address can transfer AOETH");

		try {
			var result = await aoeth.whitelistTransferFrom(account1, theAO, 10, { from: whitelistedAddress });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, false, "Whitelisted address can transfer AOETH from account with not enough balance to transfer");

		var theAOBalanceBefore = await aoeth.balanceOf(theAO);
		var accountBalanceBefore = await aoeth.balanceOf(account1);
		try {
			var result = await aoeth.whitelistTransferFrom(theAO, account1, 10, { from: whitelistedAddress });
			canTransfer = true;
		} catch (e) {
			canTransfer = false;
		}
		assert.equal(canTransfer, true, "Whitelisted address can't transfer AOETH");

		var theAOBalanceAfter = await aoeth.balanceOf(theAO);
		var accountBalanceAfter = await aoeth.balanceOf(account1);

		assert.equal(theAOBalanceAfter.toNumber(), theAOBalanceBefore.minus(10).toNumber(), "The AO has incorrect balance");
		assert.equal(accountBalanceAfter.toNumber(), accountBalanceBefore.plus(10).toNumber(), "Account has incorrect balance");
	});
});
