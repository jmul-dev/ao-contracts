var AOLibrary = artifacts.require("./AOLibrary.sol");
var Epiphany = artifacts.require("./Epiphany.sol");

// Name/TAO Contracts
var Voice = artifacts.require("./Voice.sol");
var NameFactory = artifacts.require("./NameFactory.sol");
var NameTAOVault = artifacts.require("./NameTAOVault.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var NameTAOLookup = artifacts.require("./NameTAOLookup.sol");
var NamePublicKey = artifacts.require("./NamePublicKey.sol");
var TAOAncestry = artifacts.require("./TAOAncestry.sol");
var TAOVoice = artifacts.require("./TAOVoice.sol");

// Settings
var AOSettingAttribute = artifacts.require("./AOSettingAttribute.sol");
var AOSettingValue = artifacts.require("./AOSettingValue.sol");

// Logos and its denominations
var Logos = artifacts.require("./Logos.sol");
var LogosKilo = artifacts.require("./LogosKilo.sol");
var LogosMega = artifacts.require("./LogosMega.sol");
var LogosGiga = artifacts.require("./LogosGiga.sol");
var LogosTera = artifacts.require("./LogosTera.sol");
var LogosPeta = artifacts.require("./LogosPeta.sol");
var LogosExa = artifacts.require("./LogosExa.sol");
var LogosZetta = artifacts.require("./LogosZetta.sol");
var LogosYotta = artifacts.require("./LogosYotta.sol");
var LogosXona = artifacts.require("./LogosXona.sol");
var LogosTreasury = artifacts.require("./LogosTreasury.sol");

// Ethos and its denominations
var Ethos = artifacts.require("./Ethos.sol");
var EthosKilo = artifacts.require("./EthosKilo.sol");
var EthosMega = artifacts.require("./EthosMega.sol");
var EthosGiga = artifacts.require("./EthosGiga.sol");
var EthosTera = artifacts.require("./EthosTera.sol");
var EthosPeta = artifacts.require("./EthosPeta.sol");
var EthosExa = artifacts.require("./EthosExa.sol");
var EthosZetta = artifacts.require("./EthosZetta.sol");
var EthosYotta = artifacts.require("./EthosYotta.sol");
var EthosXona = artifacts.require("./EthosXona.sol");
var EthosTreasury = artifacts.require("./EthosTreasury.sol");

// Pathos and its denominations
var Pathos = artifacts.require("./Pathos.sol");
var PathosKilo = artifacts.require("./PathosKilo.sol");
var PathosMega = artifacts.require("./PathosMega.sol");
var PathosGiga = artifacts.require("./PathosGiga.sol");
var PathosTera = artifacts.require("./PathosTera.sol");
var PathosPeta = artifacts.require("./PathosPeta.sol");
var PathosExa = artifacts.require("./PathosExa.sol");
var PathosZetta = artifacts.require("./PathosZetta.sol");
var PathosYotta = artifacts.require("./PathosYotta.sol");
var PathosXona = artifacts.require("./PathosXona.sol");
var PathosTreasury = artifacts.require("./PathosTreasury.sol");

// AO Setting
var AOSetting = artifacts.require("./AOSetting.sol");

// TAO Pool
var TAOPool = artifacts.require("./TAOPool.sol");

// AO and its denominations
var AOIon = artifacts.require("./AOIon.sol");
var AOKilo = artifacts.require("./AOKilo.sol");
var AOMega = artifacts.require("./AOMega.sol");
var AOGiga = artifacts.require("./AOGiga.sol");
var AOTera = artifacts.require("./AOTera.sol");
var AOPeta = artifacts.require("./AOPeta.sol");
var AOExa = artifacts.require("./AOExa.sol");
var AOZetta = artifacts.require("./AOZetta.sol");
var AOYotta = artifacts.require("./AOYotta.sol");
var AOXona = artifacts.require("./AOXona.sol");

// Contracts that interact with AO and its denominations contracts
var AOPool = artifacts.require("./AOPool.sol");
var AOETH = artifacts.require("./AOETH.sol");
var AOTreasury = artifacts.require("./AOTreasury.sol");

// AO Content & Earning
var AOContent = artifacts.require("./AOContent.sol");
var AOEarning = artifacts.require("./AOEarning.sol");
var AOStakedContent = artifacts.require("./AOStakedContent.sol");
var AOPurchaseReceipt = artifacts.require("./AOPurchaseReceipt.sol");
var AOContentHost = artifacts.require("./AOContentHost.sol");
var AOContentFactory = artifacts.require("./AOContentFactory.sol");

// Testing ERC20 Tokens
var TokenOne = artifacts.require("./TokenOne.sol");
var TokenTwo = artifacts.require("./TokenTwo.sol");
var TokenThree = artifacts.require("./TokenThree.sol");

module.exports = function(deployer, network, accounts) {
	var primordialAccount, settingAccount, primordialNameId, settingNameId, primordialTAOId, settingTAOId;
	if (network === "rinkeby") {
		primordialAccount = "0x16a038099561ac8ad73c497c18207e6c88ff6593";
		settingAccount = "0xd2021e918ed447797fb66c48efa2899ea17dbddb";
	} else if (network === "live") {
		primordialAccount = "0x268c85ef559be52f3749791445dfd9a5abc37186";
		settingAccount = "0x5a5ee57f51d412018d6da04e66d97ad0e7f02a04";
	} else {
		primordialAccount = accounts[0];
		settingAccount = accounts[9];
	}

	var epiphany,
		voice,
		namefactory,
		nametaovault,
		taofactory,
		nametaoposition,
		nametaolookup,
		namepublickey,
		taoancestry,
		taovoice,
		aosettingattribute,
		aosettingvalue,
		aosetting,
		logos,
		logoskilo,
		logosmega,
		logosgiga,
		logostera,
		logospeta,
		logosexa,
		logoszetta,
		logosyotta,
		logosxona,
		logostreasury,
		ethos,
		ethoskilo,
		ethosmega,
		ethosgiga,
		ethostera,
		ethospeta,
		ethosexa,
		ethoszetta,
		ethosyotta,
		ethosxona,
		ethostreasury,
		pathos,
		pathoskilo,
		pathosmega,
		pathosgiga,
		pathostera,
		pathospeta,
		pathosexa,
		pathoszetta,
		pathosyotta,
		pathosxona,
		pathostreasury,
		taopool,
		aoion,
		aokilo,
		aomega,
		aogiga,
		aotera,
		aopeta,
		aoexa,
		aozetta,
		aoyotta,
		aoxona,
		aopool,
		aoeth,
		aotreasury,
		aocontent,
		aostakedcontent,
		aopurchasereceipt,
		aocontenthost,
		aoearning,
		aocontentfactory,
		tokenone,
		tokentwo,
		tokenthree;

	deployer.deploy(AOLibrary, { overwrite: false });
	deployer.link(AOLibrary, [
		Voice,
		NameFactory,
		NameTAOVault,
		TAOFactory,
		NameTAOPosition,
		NameTAOLookup,
		NamePublicKey,
		TAOAncestry,
		TAOVoice,
		AOSettingAttribute,
		AOSettingValue,
		AOSetting,
		Logos,
		LogosKilo,
		LogosMega,
		LogosGiga,
		LogosTera,
		LogosPeta,
		LogosExa,
		LogosZetta,
		LogosYotta,
		LogosXona,
		LogosTreasury,
		Ethos,
		EthosKilo,
		EthosMega,
		EthosGiga,
		EthosTera,
		EthosPeta,
		EthosExa,
		EthosZetta,
		EthosYotta,
		EthosXona,
		EthosTreasury,
		Pathos,
		PathosKilo,
		PathosMega,
		PathosGiga,
		PathosTera,
		PathosPeta,
		PathosExa,
		PathosZetta,
		PathosYotta,
		PathosXona,
		PathosTreasury,
		TAOPool,
		AOIon,
		AOKilo,
		AOMega,
		AOGiga,
		AOTera,
		AOPeta,
		AOExa,
		AOZetta,
		AOYotta,
		AOXona,
		AOPool,
		AOETH,
		AOTreasury,
		AOContent,
		AOStakedContent,
		AOPurchaseReceipt,
		AOContentHost,
		AOEarning,
		AOContentFactory
	]);

	// Deploy Testing ERC20 tokens only in development network
	if (network === "development") {
		deployer.deploy([
			[TokenOne, 10 ** 6, "Token One", "TOKENONE"],
			[TokenTwo, 10 ** 6, "Token Two", "TOKENTWO"],
			[TokenThree, 10 ** 6, "Token Three", "TOKENTHREE"]
		]);
	}

	deployer
		.deploy([[Epiphany, { overwrite: false }], [Voice, "Voice", "VOICE"]])
		.then(async function() {
			epiphany = await Epiphany.deployed();
			voice = await Voice.deployed();

			return deployer.deploy(NameFactory, voice.address);
		})
		.then(async function() {
			namefactory = await NameFactory.deployed();

			// Voice grants access to NameFactory
			await voice.setWhitelist(namefactory.address, true, { from: primordialAccount });

			return deployer.deploy(TAOFactory, namefactory.address);
		})
		.then(async function() {
			taofactory = await TAOFactory.deployed();

			return deployer.deploy(NameTAOPosition, namefactory.address, taofactory.address);
		})
		.then(async function() {
			nametaoposition = await NameTAOPosition.deployed();

			// Link NameTAOPosition to Epiphany
			await epiphany.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });

			// Link NameTAOPosition to Voice
			await voice.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });

			// Link NameTAOPosition to NameFactory
			await namefactory.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });

			// Link NameTAOPosition to TAOFactory
			await taofactory.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });

			return deployer.deploy([
				[NameTAOVault, namefactory.address, nametaoposition.address],
				[NameTAOLookup, namefactory.address, taofactory.address, nametaoposition.address],
				[NamePublicKey, namefactory.address, nametaoposition.address],
				[TAOAncestry, namefactory.address, taofactory.address, nametaoposition.address],
				[TAOVoice, namefactory.address, voice.address, nametaoposition.address],
				[AOSettingAttribute, nametaoposition.address],
				[AOSettingValue, nametaoposition.address],
				[Logos, "Logos", "LOGOS", nametaoposition.address],
				[LogosKilo, "Logos Kilo", "LOGOSKILO", nametaoposition.address],
				[LogosMega, "Logos Mega", "LOGOSMEGA", nametaoposition.address],
				[LogosGiga, "Logos Giga", "LOGOSGIGA", nametaoposition.address],
				[LogosTera, "Logos Tera", "LOGOSTERA", nametaoposition.address],
				[LogosPeta, "Logos Peta", "LOGOSPETA", nametaoposition.address],
				[LogosExa, "Logos Exa", "LOGOSEXA", nametaoposition.address],
				[LogosZetta, "Logos Zetta", "LOGOSZETTA", nametaoposition.address],
				[LogosYotta, "Logos Yotta", "LOGOSYOTTA", nametaoposition.address],
				[LogosXona, "Logos Xona", "LOGOSXONA", nametaoposition.address],
				[LogosTreasury, namefactory.address, nametaoposition.address],
				[Ethos, "Ethos", "ETHOS", nametaoposition.address],
				[EthosKilo, "Ethos Kilo", "ETHOSKILO", nametaoposition.address],
				[EthosMega, "Ethos Mega", "ETHOSMEGA", nametaoposition.address],
				[EthosGiga, "Ethos Giga", "ETHOSGIGA", nametaoposition.address],
				[EthosTera, "Ethos Tera", "ETHOSTERA", nametaoposition.address],
				[EthosPeta, "Ethos Peta", "ETHOSPETA", nametaoposition.address],
				[EthosExa, "Ethos Exa", "ETHOSEXA", nametaoposition.address],
				[EthosZetta, "Ethos Zetta", "ETHOSZETTA", nametaoposition.address],
				[EthosYotta, "Ethos Yotta", "ETHOSYOTTA", nametaoposition.address],
				[EthosXona, "Ethos Xona", "ETHOSXONA", nametaoposition.address],
				[EthosTreasury, namefactory.address, nametaoposition.address],
				[Pathos, "Pathos", "PATHOS", nametaoposition.address],
				[PathosKilo, "Pathos Kilo", "PATHOSKILO", nametaoposition.address],
				[PathosMega, "Pathos Mega", "PATHOSMEGA", nametaoposition.address],
				[PathosGiga, "Pathos Giga", "PATHOSGIGA", nametaoposition.address],
				[PathosTera, "Pathos Tera", "PATHOSTERA", nametaoposition.address],
				[PathosPeta, "Pathos Peta", "PATHOSPETA", nametaoposition.address],
				[PathosExa, "Pathos Exa", "PATHOSEXA", nametaoposition.address],
				[PathosZetta, "Pathos Zetta", "PATHOSZETTA", nametaoposition.address],
				[PathosYotta, "Pathos Yotta", "PATHOSYOTTA", nametaoposition.address],
				[PathosXona, "Pathos Xona", "PATHOSXONA", nametaoposition.address],
				[PathosTreasury, namefactory.address, nametaoposition.address]
			]);
		})
		.then(async function() {
			nametaovault = await NameTAOVault.deployed();
			nametaolookup = await NameTAOLookup.deployed();
			namepublickey = await NamePublicKey.deployed();
			taoancestry = await TAOAncestry.deployed();
			taovoice = await TAOVoice.deployed();
			aosettingattribute = await AOSettingAttribute.deployed();
			aosettingvalue = await AOSettingValue.deployed();
			logos = await Logos.deployed();
			logoskilo = await LogosKilo.deployed();
			logosmega = await LogosMega.deployed();
			logosgiga = await LogosGiga.deployed();
			logostera = await LogosTera.deployed();
			logospeta = await LogosPeta.deployed();
			logosexa = await LogosExa.deployed();
			logoszetta = await LogosZetta.deployed();
			logosyotta = await LogosYotta.deployed();
			logosxona = await LogosXona.deployed();
			logostreasury = await LogosTreasury.deployed();
			ethos = await Ethos.deployed();
			ethoskilo = await EthosKilo.deployed();
			ethosmega = await EthosMega.deployed();
			ethosgiga = await EthosGiga.deployed();
			ethostera = await EthosTera.deployed();
			ethospeta = await EthosPeta.deployed();
			ethosexa = await EthosExa.deployed();
			ethoszetta = await EthosZetta.deployed();
			ethosyotta = await EthosYotta.deployed();
			ethosxona = await EthosXona.deployed();
			ethostreasury = await EthosTreasury.deployed();
			pathos = await Pathos.deployed();
			pathoskilo = await PathosKilo.deployed();
			pathosmega = await PathosMega.deployed();
			pathosgiga = await PathosGiga.deployed();
			pathostera = await PathosTera.deployed();
			pathospeta = await PathosPeta.deployed();
			pathosexa = await PathosExa.deployed();
			pathoszetta = await PathosZetta.deployed();
			pathosyotta = await PathosYotta.deployed();
			pathosxona = await PathosXona.deployed();
			pathostreasury = await PathosTreasury.deployed();

			// Link NameTAOVault to NameFactory
			await namefactory.setNameTAOVaultAddress(nametaovault.address, { from: primordialAccount });

			// Link NameTAOVault to TAOFactory
			await taofactory.setNameTAOVaultAddress(nametaovault.address, { from: primordialAccount });

			// Link NameTAOLookup to NameFactory
			await namefactory.setNameTAOLookupAddress(nametaolookup.address, { from: primordialAccount });

			// Link NameTAOLookup to TAOFactory
			await taofactory.setNameTAOLookupAddress(nametaolookup.address, { from: primordialAccount });

			// Link NamePublicKey to NameFactory
			await namefactory.setNamePublicKeyAddress(namepublickey.address, { from: primordialAccount });

			// Link TAOAncestry to TAOFactory
			await taofactory.setTAOAncestryAddress(taoancestry.address, { from: primordialAccount });

			// Link TAOAncestry to NameTAOPosition
			await nametaoposition.setTAOAncestryAddress(taoancestry.address, { from: primordialAccount });

			// Voice grants access to TAOVoice
			await voice.setWhitelist(taovoice.address, true, { from: primordialAccount });

			// Link Logos to TAOFactory
			await taofactory.setLogosAddress(logos.address, { from: primordialAccount });

			// Link Logos to NameTAOPosition
			await nametaoposition.setLogosAddress(logos.address, { from: primordialAccount });

			// Logos grant access to NameTAOPosition
			await logos.setWhitelist(nametaoposition.address, true, { from: primordialAccount });

			// Store Logos denominations in LogosTreasury
			await logostreasury.addDenomination("logos", logos.address, { from: primordialAccount });
			await logostreasury.addDenomination("kilo", logoskilo.address, { from: primordialAccount });
			await logostreasury.addDenomination("mega", logosmega.address, { from: primordialAccount });
			await logostreasury.addDenomination("giga", logosgiga.address, { from: primordialAccount });
			await logostreasury.addDenomination("tera", logostera.address, { from: primordialAccount });
			await logostreasury.addDenomination("peta", logospeta.address, { from: primordialAccount });
			await logostreasury.addDenomination("exa", logosexa.address, { from: primordialAccount });
			await logostreasury.addDenomination("zetta", logoszetta.address, { from: primordialAccount });
			await logostreasury.addDenomination("yotta", logosyotta.address, { from: primordialAccount });
			await logostreasury.addDenomination("xona", logosxona.address, { from: primordialAccount });

			// Logos denominations grant access to LogosTreasury
			await logos.setWhitelist(logostreasury.address, true, { from: primordialAccount });
			await logoskilo.setWhitelist(logostreasury.address, true, { from: primordialAccount });
			await logosmega.setWhitelist(logostreasury.address, true, { from: primordialAccount });
			await logosgiga.setWhitelist(logostreasury.address, true, { from: primordialAccount });
			await logostera.setWhitelist(logostreasury.address, true, { from: primordialAccount });
			await logospeta.setWhitelist(logostreasury.address, true, { from: primordialAccount });
			await logosexa.setWhitelist(logostreasury.address, true, { from: primordialAccount });
			await logoszetta.setWhitelist(logostreasury.address, true, { from: primordialAccount });
			await logosyotta.setWhitelist(logostreasury.address, true, { from: primordialAccount });
			await logosxona.setWhitelist(logostreasury.address, true, { from: primordialAccount });

			// Store Ethos denominations in EthosTreasury
			await ethostreasury.addDenomination("ethos", ethos.address, { from: primordialAccount });
			await ethostreasury.addDenomination("kilo", ethoskilo.address, { from: primordialAccount });
			await ethostreasury.addDenomination("mega", ethosmega.address, { from: primordialAccount });
			await ethostreasury.addDenomination("giga", ethosgiga.address, { from: primordialAccount });
			await ethostreasury.addDenomination("tera", ethostera.address, { from: primordialAccount });
			await ethostreasury.addDenomination("peta", ethospeta.address, { from: primordialAccount });
			await ethostreasury.addDenomination("exa", ethosexa.address, { from: primordialAccount });
			await ethostreasury.addDenomination("zetta", ethoszetta.address, { from: primordialAccount });
			await ethostreasury.addDenomination("yotta", ethosyotta.address, { from: primordialAccount });
			await ethostreasury.addDenomination("xona", ethosxona.address, { from: primordialAccount });

			// Ethos denominations grant access to EthosTreasury
			await ethos.setWhitelist(ethostreasury.address, true, { from: primordialAccount });
			await ethoskilo.setWhitelist(ethostreasury.address, true, { from: primordialAccount });
			await ethosmega.setWhitelist(ethostreasury.address, true, { from: primordialAccount });
			await ethosgiga.setWhitelist(ethostreasury.address, true, { from: primordialAccount });
			await ethostera.setWhitelist(ethostreasury.address, true, { from: primordialAccount });
			await ethospeta.setWhitelist(ethostreasury.address, true, { from: primordialAccount });
			await ethosexa.setWhitelist(ethostreasury.address, true, { from: primordialAccount });
			await ethoszetta.setWhitelist(ethostreasury.address, true, { from: primordialAccount });
			await ethosyotta.setWhitelist(ethostreasury.address, true, { from: primordialAccount });
			await ethosxona.setWhitelist(ethostreasury.address, true, { from: primordialAccount });

			// Store Pathos denominations in PathosTreasury
			await pathostreasury.addDenomination("pathos", pathos.address, { from: primordialAccount });
			await pathostreasury.addDenomination("kilo", pathoskilo.address, { from: primordialAccount });
			await pathostreasury.addDenomination("mega", pathosmega.address, { from: primordialAccount });
			await pathostreasury.addDenomination("giga", pathosgiga.address, { from: primordialAccount });
			await pathostreasury.addDenomination("tera", pathostera.address, { from: primordialAccount });
			await pathostreasury.addDenomination("peta", pathospeta.address, { from: primordialAccount });
			await pathostreasury.addDenomination("exa", pathosexa.address, { from: primordialAccount });
			await pathostreasury.addDenomination("zetta", pathoszetta.address, { from: primordialAccount });
			await pathostreasury.addDenomination("yotta", pathosyotta.address, { from: primordialAccount });
			await pathostreasury.addDenomination("xona", pathosxona.address, { from: primordialAccount });

			// Pathos denominations grant access to PathosTreasury
			await pathos.setWhitelist(pathostreasury.address, true, { from: primordialAccount });
			await pathoskilo.setWhitelist(pathostreasury.address, true, { from: primordialAccount });
			await pathosmega.setWhitelist(pathostreasury.address, true, { from: primordialAccount });
			await pathosgiga.setWhitelist(pathostreasury.address, true, { from: primordialAccount });
			await pathostera.setWhitelist(pathostreasury.address, true, { from: primordialAccount });
			await pathospeta.setWhitelist(pathostreasury.address, true, { from: primordialAccount });
			await pathosexa.setWhitelist(pathostreasury.address, true, { from: primordialAccount });
			await pathoszetta.setWhitelist(pathostreasury.address, true, { from: primordialAccount });
			await pathosyotta.setWhitelist(pathostreasury.address, true, { from: primordialAccount });
			await pathosxona.setWhitelist(pathostreasury.address, true, { from: primordialAccount });

			return deployer.deploy([
				[AOSetting, namefactory.address, nametaoposition.address, aosettingattribute.address, aosettingvalue.address],
				[TAOPool, namefactory.address, taofactory.address, nametaoposition.address, pathos.address, ethos.address, logos.address]
			]);
		})
		.then(async function() {
			aosetting = await AOSetting.deployed();
			taopool = await TAOPool.deployed();

			// Link AOSetting to TAOFactory
			await taofactory.setAOSettingAddress(aosetting.address, { from: primordialAccount });

			// Link AOSetting to NameTAOPosition
			await nametaoposition.setAOSettingAddress(aosetting.address, { from: primordialAccount });

			// Link TAOPool to TAOFactory
			await taofactory.setTAOPoolAddress(taopool.address, { from: primordialAccount });

			// Other type of settings grant access to AOSetting
			await aosettingattribute.setWhitelist(aosetting.address, true, { from: primordialAccount });
			await aosettingvalue.setWhitelist(aosetting.address, true, { from: primordialAccount });

			// Pathos/Ethos/Logos grant access for TAOPool
			await pathos.setWhitelist(taopool.address, true, { from: primordialAccount });
			await ethos.setWhitelist(taopool.address, true, { from: primordialAccount });
			await logos.setWhitelist(taopool.address, true, { from: primordialAccount });

			/**
			 * Create Primordial Name and Associated Name
			 */
			try {
				var result = await namefactory.createName("alpha", "", "", "", "", {
					from: primordialAccount
				});
				primordialNameId = await namefactory.ethAddressToNameId(primordialAccount);
			} catch (e) {
				console.log("Unable to create Primordial Name", e);
				return;
			}

			try {
				var result = await namefactory.createName("beta", "", "", "", "", {
					from: settingAccount
				});
				settingNameId = await namefactory.ethAddressToNameId(settingAccount);
			} catch (e) {
				console.log("Unable to create Associated Name", e);
				return;
			}

			/**
			 * Create Primordial TAO and Associated TAO that proposes Content Usage Setting creation
			 */
			try {
				var result = await taofactory.createTAO("Primordial Thought of AO", "", "", "", "", primordialNameId, 0, false, 0, {
					from: primordialAccount
				});
				var createTAOEvent = result.logs[0];
				primordialTAOId = createTAOEvent.args.taoId;
			} catch (e) {
				console.log("Unable to create Primordial TAO", e);
				return;
			}

			try {
				var result = await taofactory.createTAO("Settings of AO", "", "", "", "", primordialTAOId, 0, false, 0, {
					from: settingAccount
				});
				var createTAOEvent = result.logs[0];
				settingTAOId = createTAOEvent.args.taoId;
			} catch (e) {
				console.log("Unable to create Associated TAO", e);
				return;
			}

			// Set settingTAOId in TAOFactory
			await taofactory.setSettingTAOId(settingTAOId, { from: primordialAccount });

			// Set settingTAOId in NameTAOPosition
			await nametaoposition.setSettingTAOId(settingTAOId, { from: primordialAccount });

			/***** Add Settings *****/
			/**
			 * startingPrimordialMultiplier 50 * (1000000) = 50
			 */
			try {
				var result = await aosetting.addUintSetting(
					"startingPrimordialMultiplier",
					50 * 10 ** 6,
					primordialTAOId,
					settingTAOId,
					"",
					{
						from: primordialAccount
					}
				);
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add startingPrimordialMultiplier setting", e);
			}

			/**
			 * endingPrimordialMultiplier 3 * (1000000) = 3
			 */
			try {
				var result = await aosetting.addUintSetting("endingPrimordialMultiplier", 3 * 10 ** 6, primordialTAOId, settingTAOId, "", {
					from: primordialAccount
				});
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add endingPrimordialMultiplier setting", e);
			}

			/**
			 * startingNetworkBonusMultiplier 1000000 = 100%
			 */
			try {
				var result = await aosetting.addUintSetting("startingNetworkBonusMultiplier", 10 ** 6, primordialTAOId, settingTAOId, "", {
					from: primordialAccount
				});
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add startingNetworkBonusMultiplier setting", e);
			}

			/**
			 * endingNetworkBonusMultiplier 250000 = 25%
			 */
			try {
				var result = await aosetting.addUintSetting("endingNetworkBonusMultiplier", 250000, primordialTAOId, settingTAOId, "", {
					from: primordialAccount
				});
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add endingNetworkBonusMultiplier setting", e);
			}

			/**
			 * Inflation Rate 1%
			 */
			try {
				var result = await aosetting.addUintSetting("inflationRate", 10000, primordialTAOId, settingTAOId, "", {
					from: primordialAccount
				});
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add inflationRate setting", e);
			}

			/**
			 * The AO Cut 0%
			 */
			try {
				var result = await aosetting.addUintSetting("theAOCut", 0, primordialTAOId, settingTAOId, "", {
					from: primordialAccount
				});
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add theAOCut setting", e);
			}

			/**
			 * The AO Ethos Earned Rate = 100%
			 */
			try {
				var result = await aosetting.addUintSetting("theAOEthosEarnedRate", 10 ** 6, primordialTAOId, settingTAOId, "", {
					from: primordialAccount
				});
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add theAOEthosEarnedRate setting", e);
			}

			/**
			 * challengeTAOAdvocateLockDuration = 7 days = 7 * 86400 = 604800
			 * The amount of time for current Advocate to response to Advocate replacement challenge from another Name
			 */
			try {
				var result = await aosetting.addUintSetting("challengeTAOAdvocateLockDuration", 604800, primordialTAOId, settingTAOId, "", {
					from: primordialAccount
				});
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add challengeTAOAdvocateLockDuration setting", e);
			}

			/**
			 * challengeTAOAdvocateCompleteDuration = 7 days = 7 * 86400 = 604800
			 * The amount of time for challenger Advocate to check and complete the challenge after the lock period ends
			 */
			try {
				var result = await aosetting.addUintSetting(
					"challengeTAOAdvocateCompleteDuration",
					604800,
					primordialTAOId,
					settingTAOId,
					"",
					{
						from: primordialAccount
					}
				);
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add challengeTAOAdvocateCompleteDuration setting", e);
			}

			/**
			 * Content Usage Type AO Content = AO Content
			 */
			try {
				var result = await aosetting.addBytesSetting(
					"contentUsageType_aoContent",
					"AO Content",
					primordialTAOId,
					settingTAOId,
					"",
					{
						from: primordialAccount
					}
				);
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add contentUsageType_aoContent setting", e);
			}

			/**
			 * Content Usage Type Creative Commons = Creative Commons
			 */
			try {
				var result = await aosetting.addBytesSetting(
					"contentUsageType_creativeCommons",
					"Creative Commons",
					primordialTAOId,
					settingTAOId,
					"",
					{
						from: primordialAccount
					}
				);
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add contentUsageType_creativeCommons setting", e);
			}

			/**
			 * Content Usage Type TAO Content = T(AO) Content
			 */
			try {
				var result = await aosetting.addBytesSetting(
					"contentUsageType_taoContent",
					"T(AO) Content",
					primordialTAOId,
					settingTAOId,
					"",
					{
						from: primordialAccount
					}
				);
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add contentUsageType_taoContent setting", e);
			}

			/**
			 * TAO Content State Submitted = Submitted
			 */
			try {
				var result = await aosetting.addBytesSetting("taoContentState_submitted", "Submitted", primordialTAOId, settingTAOId, "", {
					from: primordialAccount
				});
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add taoContentState_submitted setting", e);
			}

			/**
			 * TAO Content State Pending Review = Pending Review
			 */
			try {
				var result = await aosetting.addBytesSetting(
					"taoContentState_pendingReview",
					"Pending Review",
					primordialTAOId,
					settingTAOId,
					"",
					{
						from: primordialAccount
					}
				);
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add taoContentState_pendingReview setting", e);
			}

			/**
			 * TAO Content State Accepted to TAO = Accepted to TAO
			 */
			try {
				var result = await aosetting.addBytesSetting(
					"taoContentState_acceptedToTAO",
					"Accepted to TAO",
					primordialTAOId,
					settingTAOId,
					"",
					{
						from: primordialAccount
					}
				);
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add taoContentState_acceptedToTAO setting", e);
			}

			/**
			 * ingressUrl = https://www.ingress.one
			 */
			try {
				var result = await aosetting.addStringSetting("ingressUrl", "https://www.ingress.one", primordialTAOId, settingTAOId, "", {
					from: primordialAccount
				});
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add ingressUrl setting", e);
			}

			/**
			 * developerUrl = https://gitlab.paramation.com/AO-core/aodb
			 */
			try {
				var result = await aosetting.addStringSetting(
					"developerUrl",
					"https://gitlab.paramation.com/AO-core/aodb",
					primordialTAOId,
					settingTAOId,
					"",
					{
						from: primordialAccount
					}
				);
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add developerUrl setting", e);
			}

			/**
			 * aoUrl = ao.network
			 */
			try {
				var result = await aosetting.addStringSetting("aoUrl", "https://ao.network", primordialTAOId, settingTAOId, "", {
					from: primordialAccount
				});
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add aoUrl setting", e);
			}

			/**
			 * taoDbKey = b9b874b28cc2792b0becdf2c40c9254f874be3efa1a48cd61903fb62e883f271
			 */
			try {
				var result = await aosetting.addStringSetting(
					"taoDbKey",
					"b9b874b28cc2792b0becdf2c40c9254f874be3efa1a48cd61903fb62e883f271",
					primordialTAOId,
					settingTAOId,
					"",
					{
						from: primordialAccount
					}
				);
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add taoDbKey setting", e);
			}

			/**
			 * createChildTAOMinLogos 1Giga = 10 ** 9
			 */
			try {
				var result = await aosetting.addUintSetting("createChildTAOMinLogos", 10 ** 9, primordialTAOId, settingTAOId, "", {
					from: primordialAccount
				});
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add createChildTAOMinLogos setting", e);
			}

			/**
			 * defaultEthereumProvider_1 = wss://mainnet.infura.io/ws
			 */
			try {
				var result = await aosetting.addStringSetting(
					"defaultEthereumProvider_1",
					"wss://mainnet.infura.io/ws",
					primordialTAOId,
					settingTAOId,
					"",
					{
						from: primordialAccount
					}
				);
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add Default Ethereum Provider for Mainnet setting", e);
			}

			/**
			 * defaultEthereumProvider_3 = wss://ropsten.infura.io/ws
			 */
			try {
				var result = await aosetting.addStringSetting(
					"defaultEthereumProvider_3",
					"wss://ropsten.infura.io/ws",
					primordialTAOId,
					settingTAOId,
					"",
					{
						from: primordialAccount
					}
				);
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add Default Ethereum Provider for Ropsten setting", e);
			}

			/**
			 * defaultEthereumProvider_4 = wss://rinkeby.infura.io/ws
			 */
			try {
				var result = await aosetting.addStringSetting(
					"defaultEthereumProvider_4",
					"wss://rinkeby.infura.io/ws",
					primordialTAOId,
					settingTAOId,
					"",
					{
						from: primordialAccount
					}
				);
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add Default Ethereum Provider for Rinkeby setting", e);
			}

			/**
			 * defaultEthereumProvider_42 = wss://kovan.infura.io/ws
			 */
			try {
				var result = await aosetting.addStringSetting(
					"defaultEthereumProvider_42",
					"wss://kovan.infura.io/ws",
					primordialTAOId,
					settingTAOId,
					"",
					{
						from: primordialAccount
					}
				);
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add Default Ethereum Provider for Kovan setting", e);
			}

			return deployer.deploy([
				[AOIon, "AO Ion", "AOION", settingTAOId, aosetting.address, nametaoposition.address],
				[AOKilo, "AO Kilo", "AOKILO", nametaoposition.address],
				[AOMega, "AO Mega", "AOMEGA", nametaoposition.address],
				[AOGiga, "AO Giga", "AOGIGA", nametaoposition.address],
				[AOTera, "AO Tera", "AOTERA", nametaoposition.address],
				[AOPeta, "AO Peta", "AOPETA", nametaoposition.address],
				[AOExa, "AO Exa", "AOEXA", nametaoposition.address],
				[AOZetta, "AO Zetta", "AOZETTA", nametaoposition.address],
				[AOYotta, "AO Yotta", "AOYOTTA", nametaoposition.address],
				[AOXona, "AO Xona", "AOXONA", nametaoposition.address],
				[AOTreasury, nametaoposition.address]
			]);
		})
		.then(async function() {
			aoion = await AOIon.deployed();
			aokilo = await AOKilo.deployed();
			aomega = await AOMega.deployed();
			aogiga = await AOGiga.deployed();
			aotera = await AOTera.deployed();
			aopeta = await AOPeta.deployed();
			aoexa = await AOExa.deployed();
			aozetta = await AOZetta.deployed();
			aoyotta = await AOYotta.deployed();
			aoxona = await AOXona.deployed();
			aotreasury = await AOTreasury.deployed();

			// Link AOIon to NameTAOVault
			await nametaovault.setAOIonAddress(aoion.address, { from: primordialAccount });

			// AOIon Grant access to NameTAOVault
			await aoion.setWhitelist(nametaovault.address, true, { from: primordialAccount });

			// Store AO denominations in AOTreasury
			await aotreasury.addDenomination("ao", aoion.address, { from: primordialAccount });
			await aotreasury.addDenomination("kilo", aokilo.address, { from: primordialAccount });
			await aotreasury.addDenomination("mega", aomega.address, { from: primordialAccount });
			await aotreasury.addDenomination("giga", aogiga.address, { from: primordialAccount });
			await aotreasury.addDenomination("tera", aotera.address, { from: primordialAccount });
			await aotreasury.addDenomination("peta", aopeta.address, { from: primordialAccount });
			await aotreasury.addDenomination("exa", aoexa.address, { from: primordialAccount });
			await aotreasury.addDenomination("zetta", aozetta.address, { from: primordialAccount });
			await aotreasury.addDenomination("yotta", aoyotta.address, { from: primordialAccount });
			await aotreasury.addDenomination("xona", aoxona.address, { from: primordialAccount });

			// AO denominations grant access to AOTreasury
			await aoion.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aokilo.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aomega.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aogiga.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aotera.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aopeta.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aoexa.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aozetta.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aoyotta.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aoxona.setWhitelist(aotreasury.address, true, { from: primordialAccount });

			return deployer.deploy([
				[AOPool, aoion.address, nametaoposition.address],
				[AOETH, 0, "AO ETH", "AOETH", aoion.address, nametaoposition.address],
				[AOContent, settingTAOId, aosetting.address, nametaoposition.address]
			]);
		})
		.then(async function() {
			aopool = await AOPool.deployed();
			aoeth = await AOETH.deployed();
			aocontent = await AOContent.deployed();

			// Grant access to aopool to transact on behalf of others on base denomination
			await aoion.setWhitelist(aopool.address, true, { from: primordialAccount });

			// Create test pools for testing exchanges
			// Pool #1
			// price: 10000
			// status: true (active)
			// sellCapStatus: no
			// quantityCapStatus: no
			// erc20CounterAsset: false (priced in Eth)
			await aopool.createPool(10000, true, false, "", false, "", false, "", "", { from: primordialAccount });

			// Pool #2
			// price: 10000
			// status: true (active)
			// sellCapStatus: yes
			// sellCapAmount: 10000000
			// quantityCapStatus: no
			// erc20CounterAsset: false (priced in Eth)
			await aopool.createPool(10000, true, true, 10000000, false, "", false, "", "", { from: primordialAccount });

			// Pool #3
			// price: 10000
			// status: true (active)
			// sellCapStatus: no
			// quantityCapStatus: yes
			// quantityCapAmount: 5000
			// erc20CounterAsset: false (priced in Eth)
			await aopool.createPool(10000, true, false, "", true, 5000, false, "", "", { from: primordialAccount });

			// Pool #4
			// price: 10000
			// status: true (active)
			// sellCapStatus: yes
			// sellCapAmount: 10000000
			// quantityCapStatus: yes
			// quantityCapAmount: 5000
			// erc20CounterAsset: false (priced in Eth)
			await aopool.createPool(10000, true, true, 10000000, true, 5000, false, "", "", { from: primordialAccount });

			// Pool #5
			// price: 10000
			// status: false (inactive)
			// sellCapStatus: yes
			// sellCapAmount: 10000000
			// quantityCapStatus: yes
			// quantityCapAmount: 5000
			// erc20CounterAsset: false (priced in Eth)
			await aopool.createPool(10000, false, true, 10000000, true, 5000, false, "", "", { from: primordialAccount });

			// Link AOETH to AOIon
			await aoion.setAOETHAddress(aoeth.address, { from: primordialAccount });

			// AOETH grant access to AOIon
			await aoeth.setWhitelist(aoion.address, true, { from: primordialAccount });

			return deployer.deploy([
				[AOStakedContent, aoion.address, aotreasury.address, aocontent.address, nametaoposition.address],
				[
					AOEarning,
					settingTAOId,
					aosetting.address,
					aoion.address,
					namefactory.address,
					pathos.address,
					ethos.address,
					aocontent.address,
					nametaoposition.address
				]
			]);
		})
		.then(async function() {
			aostakedcontent = await AOStakedContent.deployed();
			aoearning = await AOEarning.deployed();

			// AOIon grant access to AOStakedContent
			await aoion.setWhitelist(aostakedcontent.address, true, { from: primordialAccount });

			// AOIon grant access to AOEarning
			await aoion.setWhitelist(aoearning.address, true, { from: primordialAccount });

			// Pathos grant access to AOEarning
			await pathos.setWhitelist(aoearning.address, true, { from: primordialAccount });

			// Ethos grant access to AOEarning
			await ethos.setWhitelist(aoearning.address, true, { from: primordialAccount });

			// Link AOStakedContent to AOEarning
			await aoearning.setAOStakedContentAddress(aostakedcontent.address, { from: primordialAccount });

			return deployer.deploy(
				AOPurchaseReceipt,
				aocontent.address,
				aostakedcontent.address,
				aotreasury.address,
				aoearning.address,
				nametaoposition.address
			);
		})
		.then(async function() {
			aopurchasereceipt = await AOPurchaseReceipt.deployed();

			// Link AOPurchaseReceipt to AOEarning
			await aoearning.setAOPurchaseReceiptAddress(aopurchasereceipt.address, { from: primordialAccount });

			// AOEarning grant access to AOPurchaseReceipt
			await aoearning.setWhitelist(aopurchasereceipt.address, true, { from: primordialAccount });

			return deployer.deploy(
				AOContentHost,
				aocontent.address,
				aostakedcontent.address,
				aopurchasereceipt.address,
				aoearning.address,
				nametaoposition.address
			);
		})
		.then(async function() {
			aocontenthost = await AOContentHost.deployed();

			// AOContent grant access to AOContentHost
			await aocontent.setWhitelist(aocontenthost.address, true, { from: primordialAccount });

			// Link AOContentHost to AOPurchaseReceipt
			await aopurchasereceipt.setAOContentHostAddress(aocontenthost.address, { from: primordialAccount });

			// Link AOContentHost to AOEarning
			await aoearning.setAOContentHostAddress(aocontenthost.address, { from: primordialAccount });

			// AOEarning grant access to AOContentHost
			await aoearning.setWhitelist(aocontenthost.address, true, { from: primordialAccount });

			return deployer.deploy(
				AOContentFactory,
				settingTAOId,
				aosetting.address,
				aotreasury.address,
				aocontent.address,
				aostakedcontent.address,
				aocontenthost.address,
				aoearning.address,
				nametaoposition.address
			);
		})
		.then(async function() {
			aocontentfactory = await AOContentFactory.deployed();

			// AOContent grant access to AOContentFactory
			await aocontent.setWhitelist(aocontentfactory.address, true, { from: primordialAccount });

			// AOStakedContent grant access to AOContentFactory
			await aostakedcontent.setWhitelist(aocontentfactory.address, true, { from: primordialAccount });

			// AOContentHost grant access to AOContentFactory
			await aocontenthost.setWhitelist(aocontentfactory.address, true, { from: primordialAccount });

			// TODO: Transfer TheAO ownership to Primordial TAO

			console.log("Primordial Name ID", primordialNameId);
			console.log("Setting Name ID", settingNameId);
			console.log("Primordial TAO ID", primordialTAOId);
			console.log("Setting TAO ID", settingTAOId);
		});
};
