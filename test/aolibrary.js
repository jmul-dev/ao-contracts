var AOLibrary = artifacts.require("./AOLibrary.sol");
var AOIon = artifacts.require("./AOIon.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var NameFactory = artifacts.require("./NameFactory.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var Logos = artifacts.require("./Logos.sol");
var AOContent = artifacts.require("./AOContent.sol");
var TAO = artifacts.require("./TAO.sol");

var EthCrypto = require("eth-crypto");
var BigNumber = require("bignumber.js");
BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: 1 }); // no rounding

contract("AOLibrary", function(accounts) {
	var library,
		aoion,
		nametaoposition,
		namefactory,
		taofactory,
		logos,
		aocontent,
		percentageDivisor,
		multiplierDivisor,
		nameId1,
		taoId1,
		taoId2;
	var theAO = accounts[0];
	var account1 = accounts[1];
	var account2 = accounts[2];
	var whitelistedAddress = accounts[3];
	var someAddress = accounts[9];

	var nameId1LocalWriterKey = EthCrypto.createIdentity();

	before(async function() {
		library = await AOLibrary.deployed();
		aoion = await AOIon.deployed();
		nametaoposition = await NameTAOPosition.deployed();
		namefactory = await NameFactory.deployed();
		taofactory = await TAOFactory.deployed();
		logos = await Logos.deployed();
		aocontent = await AOContent.deployed();

		// Create Name
		var result = await namefactory.createName(
			"charlie",
			"somedathash",
			"somedatabase",
			"somekeyvalue",
			"somecontentid",
			nameId1LocalWriterKey.address,
			{
				from: account1
			}
		);
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
		taoId1 = createTAOEvent.args.taoId;
	});

	it("isTAO() - should return true if TAO ID is a TAO", async function() {
		var isTAO = await library.isTAO(taoId1);
		assert.equal(isTAO, true, "isTAO() returns incorrect value");

		try {
			isTAO = await library.isTAO(someAddress);
		} catch (e) {
			isTAO = false;
		}
		assert.equal(isTAO, false, "isTAO() returns incorrect value");

		try {
			isTAO = await library.isTAO(nameId1);
		} catch (e) {
			isTAO = false;
		}
		assert.equal(isTAO, false, "isTAO() returns incorrect value");
	});

	it("isName() - should return true if Name ID is a Name", async function() {
		var isName = await library.isName(nameId1);
		assert.equal(isName, true, "isName() returns incorrect value");

		try {
			isName = await library.isName(someAddress);
		} catch (e) {
			isName = false;
		}
		assert.equal(isName, false, "isName() returns incorrect value");

		try {
			isName = await library.isName(taoId1);
		} catch (e) {
			isName = false;
		}
		assert.equal(isName, false, "isName() returns incorrect value");
	});

	it("isValidERC20TokenAddress() - should check whether or not an address is a valid ERC20 Token", async function() {
		var isValid = await library.isValidERC20TokenAddress(aoion.address);
		assert.equal(isValid, true, "isValidERC20TokenAddress() returns incorrect value");

		try {
			isValid = await library.isValidERC20TokenAddress(someAddress);
		} catch (e) {
			isValid = false;
		}
		assert.equal(isValid, false, "isValidERC20TokenAddress() returns incorrect value");
	});

	it("isTheAO() - should check if calling address is The AO", async function() {
		var aoContentTheAO = await aocontent.theAO();
		var isTheAO = await library.isTheAO(theAO, aoContentTheAO, nametaoposition.address);
		assert.equal(isTheAO, true, "isTheAO() returns incorrect value");

		try {
			isTheAO = await library.isTheAO(account1, aoContentTheAO, nametaoposition.address);
		} catch (e) {
			isTheAO = false;
		}
		assert.equal(isTheAO, false, "isTheAO() returns incorrect value");

		await aocontent.transferOwnership(taoId1, { from: theAO });
		aoContentTheAO = await aocontent.theAO();
		isTheAO = await library.isTheAO(account1, aoContentTheAO, nametaoposition.address);
		assert.equal(isTheAO, true, "isTheAO() returns incorrect value");

		try {
			isTheAO = await library.isTheAO(account2, aoContentTheAO, nametaoposition.address);
		} catch (e) {
			isTheAO = false;
		}
		assert.equal(isTheAO, false, "isTheAO() returns incorrect value");

		await aocontent.transferOwnership(nameId1, { from: account1 });
		aoContentTheAO = await aocontent.theAO();
		isTheAO = await library.isTheAO(account1, aoContentTheAO, nametaoposition.address);
		assert.equal(isTheAO, true, "isTheAO() returns incorrect value");
	});

	it("PERCENTAGE_DIVISOR() - should have the correct percentage divisor value", async function() {
		percentageDivisor = await library.PERCENTAGE_DIVISOR();
		assert.equal(percentageDivisor.toNumber(), 10 ** 6, "Contract has incorrect PERCENTAGE_DIVISOR value");
	});

	it("MULTIPLIER_DIVISOR() - should have the correct multiplier divisor value", async function() {
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

	it("calculateNetworkBonusPercentage() - should calculate and return the correct network ion bonus percentage on a given lot", async function() {
		var P = new BigNumber(50);
		var T = new BigNumber(1000);
		var M = new BigNumber(300);
		var Bs = new BigNumber(1000000);
		var Be = new BigNumber(250000);
		var bonusPercentage = await library.calculateNetworkBonusPercentage(
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
			"Library returns incorrect network ion bonus percentage for a given lot"
		);
	});

	it("calculateNetworkBonusAmount() - should calculate and return the correct network ion bonus amount on a given lot", async function() {
		var P = new BigNumber(50);
		var T = new BigNumber(1000);
		var M = new BigNumber(300);
		var Bs = new BigNumber(1000000);
		var Be = new BigNumber(250000);

		var bonusPercentage = await library.calculateNetworkBonusPercentage(
			P.toString(),
			T.toString(),
			M.toString(),
			Bs.toString(),
			Be.toString()
		);
		var bonusAmount = await library.calculateNetworkBonusAmount(P.toString(), T.toString(), M.toString(), Bs.toString(), Be.toString());

		// Bonus Amount = B% * P
		// But since B% is in percentageDivisor, need to divide it with percentageDivisor
		// Bonus Amount = (B% * P) / percentageDivisor
		var _bonusAmount = new BigNumber(bonusPercentage).times(P).div(percentageDivisor);
		assert.equal(bonusAmount.toNumber(), _bonusAmount.toString(), "Library returns incorrect network ion bonus amount for a given lot");
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

	it("calculateMultiplierAfterBurn() - should calculate and return the correct new multiplier after burning primordial ion", async function() {
		var P = new BigNumber(70);
		var M = new BigNumber(40000000);
		var B = new BigNumber(14);

		var newMultiplier = await library.calculateMultiplierAfterBurn(P.toString(), M.toString(), B.toString());
		var _newMultiplier = P.times(M).div(P.minus(B));
		assert.equal(newMultiplier.toString(), _newMultiplier.toString(), "Library returns incorrect new multiplier after burning");
	});

	it("calculateMultiplierAfterConversion() - should calculate and return the correct new multiplier after converting network ion to primordial ion", async function() {
		var P = new BigNumber(70);
		var M = new BigNumber(40000000);
		var C = new BigNumber(14);

		var newMultiplier = await library.calculateMultiplierAfterConversion(P.toString(), M.toString(), C.toString());
		var _newMultiplier = P.times(M).div(P.plus(C));
		assert.equal(newMultiplier.toString(), _newMultiplier.toString(), "Library returns incorrect new multiplier after conversion");
	});

	it("numDigits() - should return correct num of digits of a number", async function() {
		var numDigits = await library.numDigits(2);
		assert.equal(numDigits.toNumber(), 1, "numDigits() returns incorrect value");

		numDigits = await library.numDigits(23);
		assert.equal(numDigits.toNumber(), 2, "numDigits() returns incorrect value");

		numDigits = await library.numDigits(2345678);
		assert.equal(numDigits.toNumber(), 7, "numDigits() returns incorrect value");
	});
});
