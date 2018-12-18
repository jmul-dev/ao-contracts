var AOLibrary = artifacts.require("./AOLibrary.sol");
var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var Logos = artifacts.require("./Logos.sol");
var Ethos = artifacts.require("./Ethos.sol");
var Pathos = artifacts.require("./Pathos.sol");
var AntiLogos = artifacts.require("./AntiLogos.sol");
var AntiEthos = artifacts.require("./AntiEthos.sol");
var AntiPathos = artifacts.require("./AntiPathos.sol");

var BigNumber = require("bignumber.js");
BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: 1 }); // no rounding

contract("AOLibrary", function(accounts) {
	var library,
		percentageDivisor,
		multiplierDivisor,
		namefactory,
		taofactory,
		logos,
		ethos,
		pathos,
		antilogos,
		antiethos,
		antipathos,
		nameId1,
		nameId2,
		taoId;
	var developer = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var whitelistedAddress = accounts[3];
	var someAddress = accounts[9];

	before(async function() {
		library = await AOLibrary.deployed();
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		logos = await Logos.deployed();
		ethos = await Ethos.deployed();
		pathos = await Pathos.deployed();
		antilogos = await AntiLogos.deployed();
		antiethos = await AntiEthos.deployed();
		antipathos = await AntiPathos.deployed();

		// Create Name
		var result = await namefactory.createName("charlie", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account1
		});
		nameId1 = await namefactory.ethAddressToNameId(account1);

		result = await namefactory.createName("delta", "somedathash", "somedatabase", "somekeyvalue", "somecontentid", {
			from: account2
		});
		nameId2 = await namefactory.ethAddressToNameId(account2);

		result = await taofactory.createTAO("somedathash", "somedatabase", "somekeyvalue", "somecontentid", nameId1, {
			from: account1
		});
		var createTAOEvent = result.logs[0];
		taoId = createTAOEvent.args.taoId;

		await logos.setWhitelist(whitelistedAddress, true, { from: developer });
		await ethos.setWhitelist(whitelistedAddress, true, { from: developer });
		await pathos.setWhitelist(whitelistedAddress, true, { from: developer });
		await antilogos.setWhitelist(whitelistedAddress, true, { from: developer });
		await antiethos.setWhitelist(whitelistedAddress, true, { from: developer });
		await antipathos.setWhitelist(whitelistedAddress, true, { from: developer });

		// mint some TAOCurrencies to nameId
		await logos.mintToken(nameId1, 10, { from: whitelistedAddress });
		await ethos.mintToken(nameId1, 20, { from: whitelistedAddress });
		await pathos.mintToken(nameId1, 30, { from: whitelistedAddress });
		await antilogos.mintToken(nameId1, 40, { from: whitelistedAddress });
		await antiethos.mintToken(nameId1, 50, { from: whitelistedAddress });
		await antipathos.mintToken(nameId1, 60, { from: whitelistedAddress });
	});

	it("should have the correct percentage divisor value", async function() {
		percentageDivisor = await library.PERCENTAGE_DIVISOR();
		assert.equal(percentageDivisor.toNumber(), 10 ** 6, "Contract has incorrect PERCENTAGE_DIVISOR value");
	});

	it("should have the correct multiplier divisor value", async function() {
		multiplierDivisor = await library.MULTIPLIER_DIVISOR();
		assert.equal(multiplierDivisor.toNumber(), 10 ** 6, "Contract has incorrect MULTIPLIER_DIVISOR value");
	});

	it("calculateWeightedMultiplier() - should calculate and return correct weighted multiplier", async function() {
		var M1 = new BigNumber(1500000);
		var P1 = new BigNumber(200);
		var M2 = new BigNumber(3000000);
		var P2 = new BigNumber(100);
		var weightedMultiplier = await library.calculateWeightedMultiplier(M1.toString(), P1.toString(), M2.toString(), P2.toString());
		var _weightedMultiplier = M1.times(P1)
			.plus(M2.times(P2))
			.div(P1.plus(P2));
		assert.equal(weightedMultiplier.toNumber(), _weightedMultiplier.toString(), "Library returns incorrect weighted multiplier");

		var weightedMultiplier = await library.calculateWeightedMultiplier(0, 0, M2.toString(), P2.toString());
		assert.equal(weightedMultiplier.toNumber(), M2.toString(), "Library returns incorrect weighted multiplier");
	});

	it("calculatePrimordialMultiplier() - should calculate and return the correct primoridial multiplier on a given lot", async function() {
		var P = new BigNumber(50);
		var T = new BigNumber(1000);
		var M = new BigNumber(300);
		var S = new BigNumber(50).times(multiplierDivisor);
		var E = new BigNumber(3).times(multiplierDivisor);
		var multiplier = await library.calculatePrimordialMultiplier(P.toString(), T.toString(), M.toString(), S.toString(), E.toString());

		// Multiplier = (1 - ((M + P/2) / T)) x (S-E)
		// Let temp = M + (P/2)
		// Multiplier = (1 - (temp / T)) x (S-E)
		var temp = M.plus(P.div(2));

		/**
		 * Multiply multiplier with multiplierDivisor/multiplierDivisor to account for 6 decimals
		 * so, Multiplier = (multiplierDivisor/multiplierDivisor) * (1 - (temp / T)) * (S-E)
		 * Multiplier = ((multiplierDivisor * (1 - (temp / T))) * (S-E)) / multiplierDivisor
		 * Multiplier = ((multiplierDivisor - ((multiplierDivisor * temp) / T)) * (S-E)) / multiplierDivisor
		 * Take out the division by multiplierDivisor for now and include in later calculation
		 * Multiplier = (multiplierDivisor - ((multiplierDivisor * temp) / T)) * (S-E)
		 */
		var _multiplier = multiplierDivisor.minus(multiplierDivisor.times(temp).div(T)).times(S.minus(E));
		/**
		 * Since _startingMultiplier and _endingMultiplier are in 6 decimals
		 * Need to divide multiplier by multiplierDivisor
		 */
		_multiplier = _multiplier.div(multiplierDivisor);

		assert.equal(multiplier.toNumber(), _multiplier.toString(), "Library returns incorrect multiplier for a given lot");
	});

	it("calculateNetworkTokenBonusPercentage() - should calculate and return the correct network token bonus percentage on a given lot", async function() {
		var P = new BigNumber(50);
		var T = new BigNumber(1000);
		var M = new BigNumber(300);
		var Bs = new BigNumber(1000000);
		var Be = new BigNumber(250000);
		var bonusPercentage = await library.calculateNetworkTokenBonusPercentage(
			P.toString(),
			T.toString(),
			M.toString(),
			Bs.toString(),
			Be.toString()
		);

		// B% = (1 - ((M + P/2) / T)) x (Bs-Be)
		// Let temp = M + (P/2)
		// B% = (1 - (temp / T)) x (Bs-Be)
		var temp = M.plus(P.div(2));

		/**
		 * Multiply B% with percentageDivisor/percentageDivisor to account for 6 decimals
		 * so, B% = (percentageDivisor/percentageDivisor) * (1 - (temp / T)) * (Bs-Be)
		 * B% = ((percentageDivisor * (1 - (temp / T))) * (Bs-Be)) / percentageDivisor
		 * B% = ((percentageDivisor - ((percentageDivisor * temp) / T)) * (Bs-Be)) / percentageDivisor
		 * Take out the division by percentageDivisor for now and include in later calculation
		 * B% = (percentageDivisor - ((percentageDivisor * temp) / T)) * (Bs-Be)
		 * But since Bs and Be are in 6 decimlas, need to divide by percentageDivisor
		 * B% = (percentageDivisor - ((percentageDivisor * temp) / T)) * (Bs-Be) / percentageDivisor
		 */
		var _bonusPercentage = percentageDivisor
			.minus(percentageDivisor.times(temp).div(T))
			.times(Bs.minus(Be))
			.div(percentageDivisor);
		assert.equal(
			bonusPercentage.toString(),
			_bonusPercentage.toString(),
			"Library returns incorrect network token bonus percentage for a given lot"
		);
	});

	it("calculateNetworkTokenBonusAmount() - should calculate and return the correct network token bonus amount on a given lot", async function() {
		var P = new BigNumber(50);
		var T = new BigNumber(1000);
		var M = new BigNumber(300);
		var Bs = new BigNumber(1000000);
		var Be = new BigNumber(250000);

		var bonusPercentage = await library.calculateNetworkTokenBonusPercentage(
			P.toString(),
			T.toString(),
			M.toString(),
			Bs.toString(),
			Be.toString()
		);
		var bonusAmount = await library.calculateNetworkTokenBonusAmount(
			P.toString(),
			T.toString(),
			M.toString(),
			Bs.toString(),
			Be.toString()
		);

		// Bonus Amount = B% * P
		// But since B% is in percentageDivisor, need to divide it with percentageDivisor
		// Bonus Amount = (B% * P) / percentageDivisor
		var _bonusAmount = new BigNumber(bonusPercentage).times(P).div(percentageDivisor);
		assert.equal(
			bonusAmount.toNumber(),
			_bonusAmount.toString(),
			"Library returns incorrect network token bonus amount for a given lot"
		);
	});

	it("calculateMaximumBurnAmount() - should calculate and return the correct maximum burn amount", async function() {
		var P = new BigNumber(70);
		var M = new BigNumber(40000000);
		var S = new BigNumber(50000000);

		var burnAmount = await library.calculateMaximumBurnAmount(P.toString(), M.toString(), S.toString());
		var _burnAmount = S.times(P)
			.minus(P.times(M))
			.div(S);
		assert.equal(burnAmount.toString(), _burnAmount.toString(), "Library returns incorrect maximum burn amount");
		assert.equal(
			P.times(M)
				.div(P.minus(burnAmount))
				.toString(),
			S.toString(),
			"Burning max amount doesn't result in max multiplier"
		);
	});

	it("calculateMultiplierAfterBurn() - should calculate and return the correct new multiplier after burning primordial token", async function() {
		var P = new BigNumber(70);
		var M = new BigNumber(40000000);
		var B = new BigNumber(14);

		var newMultiplier = await library.calculateMultiplierAfterBurn(P.toString(), M.toString(), B.toString());
		var _newMultiplier = P.times(M).div(P.minus(B));
		assert.equal(newMultiplier.toString(), _newMultiplier.toString(), "Library returns incorrect new multiplier after burning");
	});

	it("calculateMultiplierAfterConversion() - should calculate and return the correct new multiplier after converting network token to primordial token", async function() {
		var P = new BigNumber(70);
		var M = new BigNumber(40000000);
		var C = new BigNumber(14);

		var newMultiplier = await library.calculateMultiplierAfterConversion(P.toString(), M.toString(), C.toString());
		var _newMultiplier = P.times(M).div(P.plus(C));
		assert.equal(newMultiplier.toString(), _newMultiplier.toString(), "Library returns incorrect new multiplier after conversion");
	});

	it("isTAO() - should return true if TAO ID is a TAO", async function() {
		var isTAO = await library.isTAO(taoId);
		assert.equal(isTAO, true, "Library returns incorrect bool value when a TAO ID is a TAO");
	});

	it("isName() - should return true if Name ID is a Name", async function() {
		var isName = await library.isName(nameId1);
		assert.equal(isName, true, "Library returns incorrect bool value when a Name ID is a Name");
	});

	it("addressIsTAOAdvocateListenerSpeaker() - should return true if the address is either TAO's Advocate/Listener/Speaker", async function() {
		var addressIsTAOAdvocateListenerSpeaker = await library.addressIsTAOAdvocateListenerSpeaker(namefactory.address, account2, taoId);
		assert.equal(
			addressIsTAOAdvocateListenerSpeaker,
			false,
			"Library returns incorrect bool value when address is not TAO's Advocate/Listener/Speaker"
		);

		var addressIsTAOAdvocateListenerSpeaker = await library.addressIsTAOAdvocateListenerSpeaker(namefactory.address, account1, taoId);
		assert.equal(
			addressIsTAOAdvocateListenerSpeaker,
			true,
			"Library returns incorrect bool value when address is TAO's Advocate/Listener/Speaker"
		);
	});

	it("getTAOCurrencyBalances() - should return Logos/Ethos/Pathos balances of a Name ID", async function() {
		var balances = await library.getTAOCurrencyBalances(nameId1, logos.address, ethos.address, pathos.address);
		assert.equal(balances[0].toNumber(), 10, "getTAOCurrencyBalances() returns incorrect Logos balance");
		assert.equal(balances[1].toNumber(), 20, "getTAOCurrencyBalances() returns incorrect Ethos balance");
		assert.equal(balances[2].toNumber(), 30, "getTAOCurrencyBalances() returns incorrect Pathos balance");
	});

	it("getAntiTAOCurrencyBalances() - should return AntiLogos/AntiEthos/AntiPathos balances of a Name ID", async function() {
		var balances = await library.getAntiTAOCurrencyBalances(nameId1, antilogos.address, antiethos.address, antipathos.address);
		assert.equal(balances[0].toNumber(), 40, "getAntiTAOCurrencyBalances() returns incorrect AntiLogos balance");
		assert.equal(balances[1].toNumber(), 50, "getAntiTAOCurrencyBalances() returns incorrect AntiEthos balance");
		assert.equal(balances[2].toNumber(), 60, "getAntiTAOCurrencyBalances() returns incorrect AntiPathos balance");
	});

	it("getAllTAOCurrencyBalances() - should return Logos/Ethos/Pathos/AntiLogos/AntiEthos/AntiPathos balances of a Name ID", async function() {
		var balances = await library.getAllTAOCurrencyBalances(
			nameId1,
			logos.address,
			ethos.address,
			pathos.address,
			antilogos.address,
			antiethos.address,
			antipathos.address
		);
		assert.equal(balances[0].toNumber(), 10, "getAllTAOCurrencyBalances() returns incorrect Logos balance");
		assert.equal(balances[1].toNumber(), 20, "getAllTAOCurrencyBalances() returns incorrect Ethos balance");
		assert.equal(balances[2].toNumber(), 30, "getAllTAOCurrencyBalances() returns incorrect Pathos balance");
		assert.equal(balances[3].toNumber(), 40, "getAllTAOCurrencyBalances() returns incorrect AntiLogos balance");
		assert.equal(balances[4].toNumber(), 50, "getAllTAOCurrencyBalances() returns incorrect AntiEthos balance");
		assert.equal(balances[5].toNumber(), 60, "getAllTAOCurrencyBalances() returns incorrect AntiPathos balance");
	});
});
