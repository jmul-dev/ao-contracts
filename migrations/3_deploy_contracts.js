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
var NameAccountRecovery = artifacts.require("./NameAccountRecovery.sol");
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
var AOSettingUpdate = artifacts.require("./AOSettingUpdate.sol");
var AOSettingDeprecation = artifacts.require("./AOSettingDeprecation.sol");

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
var AOIonLot = artifacts.require("./AOIonLot.sol");
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
		primordialAccount = "0xe80a265742e74e8c52d6ca185edf894edebe033f";
		settingAccount = "0xa21238ff54391900d002bb85019285bc08ad1ca5";
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
		nameaccountrecovery,
		taoancestry,
		taovoice,
		aosettingattribute,
		aosettingvalue,
		aosetting,
		aosettingupdate,
		aosettingdeprecation,
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
		aoionlot,
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
		NameAccountRecovery,
		TAOAncestry,
		TAOVoice,
		AOSettingAttribute,
		AOSettingValue,
		AOSetting,
		AOSettingUpdate,
		AOSettingDeprecation,
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
		AOIonLot,
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
		.deploy(Epiphany, { overwrite: false })
		.then(async function() {
			epiphany = await Epiphany.deployed();

			return deployer.deploy(Voice, "Voice", "VOICE");
		})
		.then(async function() {
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

			return deployer.deploy(NameTAOVault, namefactory.address, nametaoposition.address);
		})
		.then(async function() {
			nametaovault = await NameTAOVault.deployed();

			return deployer.deploy(NameTAOLookup, namefactory.address, taofactory.address, nametaoposition.address);
		})
		.then(async function() {
			nametaolookup = await NameTAOLookup.deployed();

			return deployer.deploy(NamePublicKey, namefactory.address, nametaoposition.address);
		})
		.then(async function() {
			namepublickey = await NamePublicKey.deployed();

			return deployer.deploy(NameAccountRecovery, namefactory.address, nametaoposition.address);
		})
		.then(async function() {
			nameaccountrecovery = await NameAccountRecovery.deployed();

			return deployer.deploy(TAOAncestry, namefactory.address, taofactory.address, nametaoposition.address);
		})
		.then(async function() {
			taoancestry = await TAOAncestry.deployed();

			return deployer.deploy(TAOVoice, namefactory.address, voice.address, nametaoposition.address);
		})
		.then(async function() {
			taovoice = await TAOVoice.deployed();

			return deployer.deploy(AOSettingAttribute, nametaoposition.address);
		})
		.then(async function() {
			aosettingattribute = await AOSettingAttribute.deployed();

			return deployer.deploy(AOSettingValue, nametaoposition.address);
		})
		.then(async function() {
			aosettingvalue = await AOSettingValue.deployed();

			return deployer.deploy(Logos, "Logos", "LOGOS", namefactory.address, nametaoposition.address);
		})
		.then(async function() {
			logos = await Logos.deployed();

			return deployer.deploy(LogosKilo, "Logos Kilo", "LOGOSKILO", nametaoposition.address);
		})
		.then(async function() {
			logoskilo = await LogosKilo.deployed();

			return deployer.deploy(LogosMega, "Logos Mega", "LOGOSMEGA", nametaoposition.address);
		})
		.then(async function() {
			logosmega = await LogosMega.deployed();

			return deployer.deploy(LogosGiga, "Logos Giga", "LOGOSGIGA", nametaoposition.address);
		})
		.then(async function() {
			logosgiga = await LogosGiga.deployed();

			return deployer.deploy(LogosTera, "Logos Tera", "LOGOSTERA", nametaoposition.address);
		})
		.then(async function() {
			logostera = await LogosTera.deployed();

			return deployer.deploy(LogosPeta, "Logos Peta", "LOGOSPETA", nametaoposition.address);
		})
		.then(async function() {
			logospeta = await LogosPeta.deployed();

			return deployer.deploy(LogosExa, "Logos Exa", "LOGOSEXA", nametaoposition.address);
		})
		.then(async function() {
			logosexa = await LogosExa.deployed();

			return deployer.deploy(LogosZetta, "Logos Zetta", "LOGOSZETTA", nametaoposition.address);
		})
		.then(async function() {
			logoszetta = await LogosZetta.deployed();

			return deployer.deploy(LogosYotta, "Logos Yotta", "LOGOSYOTTA", nametaoposition.address);
		})
		.then(async function() {
			logosyotta = await LogosYotta.deployed();

			return deployer.deploy(LogosXona, "Logos Xona", "LOGOSXONA", nametaoposition.address);
		})
		.then(async function() {
			logosxona = await LogosXona.deployed();

			return deployer.deploy(LogosTreasury, namefactory.address, nametaoposition.address);
		})
		.then(async function() {
			logostreasury = await LogosTreasury.deployed();

			return deployer.deploy(Ethos, "Ethos", "ETHOS", nametaoposition.address);
		})
		.then(async function() {
			ethos = await Ethos.deployed();

			return deployer.deploy(EthosKilo, "Ethos Kilo", "ETHOSKILO", nametaoposition.address);
		})
		.then(async function() {
			ethoskilo = await EthosKilo.deployed();

			return deployer.deploy(EthosMega, "Ethos Mega", "ETHOSMEGA", nametaoposition.address);
		})
		.then(async function() {
			ethosmega = await EthosMega.deployed();

			return deployer.deploy(EthosGiga, "Ethos Giga", "ETHOSGIGA", nametaoposition.address);
		})
		.then(async function() {
			ethosgiga = await EthosGiga.deployed();

			return deployer.deploy(EthosTera, "Ethos Tera", "ETHOSTERA", nametaoposition.address);
		})
		.then(async function() {
			ethostera = await EthosTera.deployed();

			return deployer.deploy(EthosPeta, "Ethos Peta", "ETHOSPETA", nametaoposition.address);
		})
		.then(async function() {
			ethospeta = await EthosPeta.deployed();

			return deployer.deploy(EthosExa, "Ethos Exa", "ETHOSEXA", nametaoposition.address);
		})
		.then(async function() {
			ethosexa = await EthosExa.deployed();

			return deployer.deploy(EthosZetta, "Ethos Zetta", "ETHOSZETTA", nametaoposition.address);
		})
		.then(async function() {
			ethoszetta = await EthosZetta.deployed();

			return deployer.deploy(EthosYotta, "Ethos Yotta", "ETHOSYOTTA", nametaoposition.address);
		})
		.then(async function() {
			ethosyotta = await EthosYotta.deployed();

			return deployer.deploy(EthosXona, "Ethos Xona", "ETHOSXONA", nametaoposition.address);
		})
		.then(async function() {
			ethosxona = await EthosXona.deployed();

			return deployer.deploy(EthosTreasury, namefactory.address, nametaoposition.address);
		})
		.then(async function() {
			ethostreasury = await EthosTreasury.deployed();

			return deployer.deploy(Pathos, "Pathos", "PATHOS", nametaoposition.address);
		})
		.then(async function() {
			pathos = await Pathos.deployed();

			return deployer.deploy(PathosKilo, "Pathos Kilo", "PATHOSKILO", nametaoposition.address);
		})
		.then(async function() {
			pathoskilo = await PathosKilo.deployed();

			return deployer.deploy(PathosMega, "Pathos Mega", "PATHOSMEGA", nametaoposition.address);
		})
		.then(async function() {
			pathosmega = await PathosMega.deployed();

			return deployer.deploy(PathosGiga, "Pathos Giga", "PATHOSGIGA", nametaoposition.address);
		})
		.then(async function() {
			pathosgiga = await PathosGiga.deployed();

			return deployer.deploy(PathosTera, "Pathos Tera", "PATHOSTERA", nametaoposition.address);
		})
		.then(async function() {
			pathostera = await PathosTera.deployed();

			return deployer.deploy(PathosPeta, "Pathos Peta", "PATHOSPETA", nametaoposition.address);
		})
		.then(async function() {
			pathospeta = await PathosPeta.deployed();

			return deployer.deploy(PathosExa, "Pathos Exa", "PATHOSEXA", nametaoposition.address);
		})
		.then(async function() {
			pathosexa = await PathosExa.deployed();

			return deployer.deploy(PathosZetta, "Pathos Zetta", "PATHOSZETTA", nametaoposition.address);
		})
		.then(async function() {
			pathoszetta = await PathosZetta.deployed();

			return deployer.deploy(PathosYotta, "Pathos Yotta", "PATHOSYOTTA", nametaoposition.address);
		})
		.then(async function() {
			pathosyotta = await PathosYotta.deployed();

			return deployer.deploy(PathosXona, "Pathos Xona", "PATHOSXONA", nametaoposition.address);
		})
		.then(async function() {
			pathosxona = await PathosXona.deployed();

			return deployer.deploy(PathosTreasury, namefactory.address, nametaoposition.address);
		})
		.then(async function() {
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

			// Link NamePublicKey to NameAccountRecovery
			await nameaccountrecovery.setNamePublicKeyAddress(namepublickey.address, { from: primordialAccount });

			// Link NameAccountRecovery to NameFactory
			await namefactory.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: primordialAccount });

			// Link NameAccountRecovery to NameTAOPosition
			await nametaoposition.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: primordialAccount });

			// Link NameAccountRecovery to NamePublicKey
			await namepublickey.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: primordialAccount });

			// Link NameAccountRecovery to NameTAOVault
			await nametaovault.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: primordialAccount });

			// Link TAOAncestry to TAOFactory
			await taofactory.setTAOAncestryAddress(taoancestry.address, { from: primordialAccount });

			// Link TAOAncestry to NameTAOPosition
			await nametaoposition.setTAOAncestryAddress(taoancestry.address, { from: primordialAccount });

			// Link NameAccountRecovery to TAOFactory
			await taofactory.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: primordialAccount });

			// Link NameAccountRecovery to TAOAncestry
			await taoancestry.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: primordialAccount });

			// Voice grants access to TAOVoice
			await voice.setWhitelist(taovoice.address, true, { from: primordialAccount });

			// Link Logos to TAOFactory
			await taofactory.setLogosAddress(logos.address, { from: primordialAccount });

			// Link Logos to NameTAOPosition
			await nametaoposition.setLogosAddress(logos.address, { from: primordialAccount });

			// NamePublicKey grant access to NameAccountRecovery
			await namepublickey.setWhitelist(nameaccountrecovery.address, true, { from: primordialAccount });

			// Link NameAccountRecovery to Logos
			await logos.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: primordialAccount });

			// Link NameAccountRecovery to TAOVoice
			await taovoice.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: primordialAccount });

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

			return deployer.deploy(
				AOSetting,
				namefactory.address,
				nametaoposition.address,
				nameaccountrecovery.address,
				aosettingattribute.address,
				aosettingvalue.address
			);
		})
		.then(async function() {
			aosetting = await AOSetting.deployed();

			return deployer.deploy(
				TAOPool,
				namefactory.address,
				taofactory.address,
				nametaoposition.address,
				pathos.address,
				ethos.address,
				logos.address
			);
		})
		.then(async function() {
			taopool = await TAOPool.deployed();

			// Link AOSetting to TAOFactory
			await taofactory.setAOSettingAddress(aosetting.address, { from: primordialAccount });

			// Link AOSetting to NameTAOPosition
			await nametaoposition.setAOSettingAddress(aosetting.address, { from: primordialAccount });

			// Link AOSetting to NameAccountRecovery
			await nameaccountrecovery.setAOSettingAddress(aosetting.address, { from: primordialAccount });

			// Link TAOPool to TAOFactory
			await taofactory.setTAOPoolAddress(taopool.address, { from: primordialAccount });

			// Link NameAccountRecovery to TAOPool
			await taopool.setNameAccountRecoveryAddress(nameaccountrecovery.address, { from: primordialAccount });

			// Other type of settings grant access to AOSetting
			await aosettingattribute.setWhitelist(aosetting.address, true, { from: primordialAccount });
			await aosettingvalue.setWhitelist(aosetting.address, true, { from: primordialAccount });

			// Pathos/Ethos/Logos grant access for TAOPool
			await pathos.setWhitelist(taopool.address, true, { from: primordialAccount });
			await ethos.setWhitelist(taopool.address, true, { from: primordialAccount });
			await logos.setWhitelist(taopool.address, true, { from: primordialAccount });

			return deployer.deploy(
				AOSettingUpdate,
				namefactory.address,
				nametaoposition.address,
				nameaccountrecovery.address,
				aosettingattribute.address,
				aosettingvalue.address,
				aosetting.address
			);
		})
		.then(async function() {
			aosettingupdate = await AOSettingUpdate.deployed();

			return deployer.deploy(
				AOSettingDeprecation,
				namefactory.address,
				nametaoposition.address,
				nameaccountrecovery.address,
				aosettingattribute.address,
				aosetting.address
			);
		})
		.then(async function() {
			aosettingdeprecation = await AOSettingDeprecation.deployed();

			// AOSettingAttribute grant accesss to AOSettingUpdate/AOSettingDeprecation
			await aosettingattribute.setWhitelist(aosettingupdate.address, true, { from: primordialAccount });
			await aosettingattribute.setWhitelist(aosettingdeprecation.address, true, { from: primordialAccount });

			// AOSettingValue grant accesss to AOSettingUpdate
			await aosettingvalue.setWhitelist(aosettingupdate.address, true, { from: primordialAccount });

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

			try {
				await taoancestry.approveChild(primordialTAOId, settingTAOId, { from: primordialAccount });
			} catch (e) {
				console.log("Primordial Name unable to approve setting TAO");
			}

			// Set settingTAOId in TAOFactory
			await taofactory.setSettingTAOId(settingTAOId, { from: primordialAccount });

			// Set settingTAOId in NameTAOPosition
			await nametaoposition.setSettingTAOId(settingTAOId, { from: primordialAccount });

			// Set settingTAOId in NameAccountRecovery
			await nameaccountrecovery.setSettingTAOId(settingTAOId, { from: primordialAccount });

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
			 * accountRecoveryLockDuration = 7 days = 7 * 86400 = 604800
			 * The amount of time for Speaker of Name to replace the eth address associated with the Name
			 */
			try {
				var result = await aosetting.addUintSetting("accountRecoveryLockDuration", 604800, primordialTAOId, settingTAOId, "", {
					from: primordialAccount
				});
				var settingId = result.logs[0].args.settingId;

				await aosetting.approveSettingCreation(settingId.toNumber(), true, { from: settingAccount });
				await aosetting.finalizeSettingCreation(settingId.toNumber(), { from: primordialAccount });
			} catch (e) {
				console.log("Unable to add accountRecoveryLockDuration setting", e);
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

			return deployer.deploy(
				AOIon,
				"AO Ion",
				"AOION",
				settingTAOId,
				aosetting.address,
				nametaoposition.address,
				namepublickey.address,
				nameaccountrecovery.address
			);
		})
		.then(async function() {
			aoion = await AOIon.deployed();

			return deployer.deploy(
				AOKilo,
				"AO Kilo",
				"AOKILO",
				nametaoposition.address,
				namepublickey.address,
				nameaccountrecovery.address
			);
		})
		.then(async function() {
			aokilo = await AOKilo.deployed();

			return deployer.deploy(
				AOMega,
				"AO Mega",
				"AOMEGA",
				nametaoposition.address,
				namepublickey.address,
				nameaccountrecovery.address
			);
		})
		.then(async function() {
			aomega = await AOMega.deployed();

			return deployer.deploy(
				AOGiga,
				"AO Giga",
				"AOGIGA",
				nametaoposition.address,
				namepublickey.address,
				nameaccountrecovery.address
			);
		})
		.then(async function() {
			aogiga = await AOGiga.deployed();

			return deployer.deploy(
				AOTera,
				"AO Tera",
				"AOTERA",
				nametaoposition.address,
				namepublickey.address,
				nameaccountrecovery.address
			);
		})
		.then(async function() {
			aotera = await AOTera.deployed();

			return deployer.deploy(
				AOPeta,
				"AO Peta",
				"AOPETA",
				nametaoposition.address,
				namepublickey.address,
				nameaccountrecovery.address
			);
		})
		.then(async function() {
			aopeta = await AOPeta.deployed();

			return deployer.deploy(AOExa, "AO Exa", "AOEXA", nametaoposition.address, namepublickey.address, nameaccountrecovery.address);
		})
		.then(async function() {
			aoexa = await AOExa.deployed();

			return deployer.deploy(
				AOZetta,
				"AO Zetta",
				"AOZETTA",
				nametaoposition.address,
				namepublickey.address,
				nameaccountrecovery.address
			);
		})
		.then(async function() {
			aozetta = await AOZetta.deployed();

			return deployer.deploy(
				AOYotta,
				"AO Yotta",
				"AOYOTTA",
				nametaoposition.address,
				namepublickey.address,
				nameaccountrecovery.address
			);
		})
		.then(async function() {
			aoyotta = await AOYotta.deployed();

			return deployer.deploy(
				AOXona,
				"AO Xona",
				"AOXONA",
				nametaoposition.address,
				namepublickey.address,
				nameaccountrecovery.address
			);
		})
		.then(async function() {
			aoxona = await AOXona.deployed();

			return deployer.deploy(AOTreasury, nametaoposition.address);
		})
		.then(async function() {
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

			return deployer.deploy(AOIonLot, aoion.address, nametaoposition.address);
		})
		.then(async function() {
			aoionlot = await AOIonLot.deployed();

			return deployer.deploy(AOPool, aoion.address, nametaoposition.address);
		})
		.then(async function() {
			aopool = await AOPool.deployed();

			return deployer.deploy(AOETH, 0, "AO ETH", "AOETH", aoion.address, nametaoposition.address);
		})
		.then(async function() {
			aoeth = await AOETH.deployed();

			return deployer.deploy(AOContent, settingTAOId, aosetting.address, nametaoposition.address);
		})
		.then(async function() {
			aocontent = await AOContent.deployed();

			// Link AOIonLot to AOIon
			await aoion.setAOIonLotAddress(aoionlot.address, { from: primordialAccount });

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

			return deployer.deploy(AOStakedContent, aoion.address, aotreasury.address, aocontent.address, nametaoposition.address);
		})
		.then(async function() {
			aostakedcontent = await AOStakedContent.deployed();

			return deployer.deploy(
				AOEarning,
				settingTAOId,
				aosetting.address,
				aoion.address,
				namefactory.address,
				pathos.address,
				ethos.address,
				aocontent.address,
				nametaoposition.address
			);
		})
		.then(async function() {
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

			/**
			 * For testing purposes:
			 * Remove this later
			 * --- START ---
			 */
			await aoion.setWhitelist(primordialAccount, true, { from: primordialAccount });
			await aoion.mint(accounts[1], 10 ** 6, { from: primordialAccount }); // 1,000,000,000 AO Ion
			// Buy 2 lots so that we can test avg weighted multiplier
			await aoion.buyPrimordial({ from: accounts[1], value: 50000 * 10 ** 4 });
			await aoion.buyPrimordial({ from: accounts[1], value: 20000 * 10 ** 4 });

			await logos.setWhitelist(primordialAccount, true, { from: primordialAccount });
			await ethos.setWhitelist(primordialAccount, true, { from: primordialAccount });
			await pathos.setWhitelist(primordialAccount, true, { from: primordialAccount });

			await logos.mint(primordialNameId, 10 ** 12, { from: primordialAccount });
			await ethos.mint(primordialNameId, 10 ** 12, { from: primordialAccount });
			await pathos.mint(primordialNameId, 10 ** 12, { from: primordialAccount });

			await logos.mint(settingNameId, 10 ** 12, { from: primordialAccount });
			await ethos.mint(settingNameId, 10 ** 12, { from: primordialAccount });
			await pathos.mint(settingNameId, 10 ** 12, { from: primordialAccount });

			// Test staking Ethos/Pathos and withdraw Logos
			var result = await taopool.stakeEthos(primordialTAOId, 5 * 10 ** 4, { from: primordialAccount });
			var stakeEthosEvent = result.logs[0];
			var lotId = stakeEthosEvent.args.lotId;

			await taopool.stakeEthos(primordialTAOId, 2 * 10 ** 4, { from: settingAccount });

			await taopool.stakePathos(primordialTAOId, 2 * 10 ** 3, { from: primordialAccount });
			await taopool.stakePathos(primordialTAOId, 567, { from: settingAccount });

			await taopool.withdrawLogos(lotId, { from: primordialAccount });

			await taopool.stakePathos(primordialTAOId, 8 * 10 ** 3, { from: settingAccount });

			/**
			 * --- END ---
			 */
			console.log("Primordial Name ID", primordialNameId);
			console.log("Setting Name ID", settingNameId);
			console.log("Primordial TAO ID", primordialTAOId);
			console.log("Setting TAO ID", settingTAOId);
		});
};
