var AOLibrary = artifacts.require("./AOLibrary.sol");
var Epiphany = artifacts.require("./Epiphany.sol");

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

// Name/TAO Contracts
var Position = artifacts.require("./Position.sol");
var NameTAOVault = artifacts.require("./NameTAOVault.sol");
var NameFactory = artifacts.require("./NameFactory.sol");
var NameTAOLookup = artifacts.require("./NameTAOLookup.sol");
var NameTAOPosition = artifacts.require("./NameTAOPosition.sol");
var NamePublicKey = artifacts.require("./NamePublicKey.sol");
var TAOFactory = artifacts.require("./TAOFactory.sol");
var TAOFamily = artifacts.require("./TAOFamily.sol");
var TAOPosition = artifacts.require("./TAOPosition.sol");
var TAOPool = artifacts.require("./TAOPool.sol");

// Settings
var AOSettingAttribute = artifacts.require("./AOSettingAttribute.sol");
var AOUintSetting = artifacts.require("./AOUintSetting.sol");
var AOBoolSetting = artifacts.require("./AOBoolSetting.sol");
var AOAddressSetting = artifacts.require("./AOAddressSetting.sol");
var AOBytesSetting = artifacts.require("./AOBytesSetting.sol");
var AOStringSetting = artifacts.require("./AOStringSetting.sol");
var AOSetting = artifacts.require("./AOSetting.sol");

// AO and its denominations
var AOToken = artifacts.require("./AOToken.sol");
var AOKilo = artifacts.require("./AOKilo.sol");
var AOMega = artifacts.require("./AOMega.sol");
var AOGiga = artifacts.require("./AOGiga.sol");
var AOTera = artifacts.require("./AOTera.sol");
var AOPeta = artifacts.require("./AOPeta.sol");
var AOExa = artifacts.require("./AOExa.sol");
var AOZetta = artifacts.require("./AOZetta.sol");
var AOYotta = artifacts.require("./AOYotta.sol");
var AOXona = artifacts.require("./AOXona.sol");

// AO Pool
var AOPool = artifacts.require("./AOPool.sol");

// Contracts that interact with AO and its denominations contracts
var AOETH = artifacts.require("./AOETH.sol");
var AOTreasury = artifacts.require("./AOTreasury.sol");
var AOEarning = artifacts.require("./AOEarning.sol");
var AOContent = artifacts.require("./AOContent.sol");

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
		position,
		nametaovault,
		namefactory,
		nametaolookup,
		nametaoposition,
		namepublickey,
		taofactory,
		taofamily,
		taoposition,
		taopool,
		aosettingattribute,
		aouintsetting,
		aoboolsetting,
		aoaddresssetting,
		aobytessetting,
		aostringsetting,
		aosetting,
		aotoken,
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
		aoearning,
		aocontent;

	deployer.deploy(AOLibrary, { overwrite: false });
	deployer.link(AOLibrary, Logos);
	deployer.link(AOLibrary, LogosKilo);
	deployer.link(AOLibrary, LogosMega);
	deployer.link(AOLibrary, LogosGiga);
	deployer.link(AOLibrary, LogosTera);
	deployer.link(AOLibrary, LogosPeta);
	deployer.link(AOLibrary, LogosExa);
	deployer.link(AOLibrary, LogosZetta);
	deployer.link(AOLibrary, LogosYotta);
	deployer.link(AOLibrary, LogosXona);
	deployer.link(AOLibrary, Ethos);
	deployer.link(AOLibrary, EthosKilo);
	deployer.link(AOLibrary, EthosMega);
	deployer.link(AOLibrary, EthosGiga);
	deployer.link(AOLibrary, EthosTera);
	deployer.link(AOLibrary, EthosPeta);
	deployer.link(AOLibrary, EthosExa);
	deployer.link(AOLibrary, EthosZetta);
	deployer.link(AOLibrary, EthosYotta);
	deployer.link(AOLibrary, EthosXona);
	deployer.link(AOLibrary, Pathos);
	deployer.link(AOLibrary, PathosKilo);
	deployer.link(AOLibrary, PathosMega);
	deployer.link(AOLibrary, PathosGiga);
	deployer.link(AOLibrary, PathosTera);
	deployer.link(AOLibrary, PathosPeta);
	deployer.link(AOLibrary, PathosExa);
	deployer.link(AOLibrary, PathosZetta);
	deployer.link(AOLibrary, PathosYotta);
	deployer.link(AOLibrary, PathosXona);
	deployer.link(AOLibrary, NameTAOVault);
	deployer.link(AOLibrary, NameFactory);
	deployer.link(AOLibrary, NameTAOPosition);
	deployer.link(AOLibrary, NamePublicKey);
	deployer.link(AOLibrary, TAOFactory);
	deployer.link(AOLibrary, TAOFamily);
	deployer.link(AOLibrary, TAOPosition);
	deployer.link(AOLibrary, TAOPool);
	deployer.link(AOLibrary, AOSetting);
	deployer.link(AOLibrary, AOToken);
	deployer.link(AOLibrary, AOKilo);
	deployer.link(AOLibrary, AOMega);
	deployer.link(AOLibrary, AOGiga);
	deployer.link(AOLibrary, AOTera);
	deployer.link(AOLibrary, AOPeta);
	deployer.link(AOLibrary, AOExa);
	deployer.link(AOLibrary, AOZetta);
	deployer.link(AOLibrary, AOYotta);
	deployer.link(AOLibrary, AOXona);
	deployer.link(AOLibrary, AOContent);
	deployer.link(AOLibrary, AOEarning);

	deployer.link(AOLibrary, AOAddressSetting);
	deployer.link(AOLibrary, AOBoolSetting);
	deployer.link(AOLibrary, AOBytesSetting);
	deployer.link(AOLibrary, AOStringSetting);
	deployer.link(AOLibrary, AOPool);
	deployer.link(AOLibrary, AOSettingAttribute);
	deployer.link(AOLibrary, AOETH);
	deployer.link(AOLibrary, AOTreasury);
	deployer.link(AOLibrary, AOUintSetting);
	deployer.link(AOLibrary, NameTAOLookup);
	deployer.link(AOLibrary, Position);
	deployer.link(AOLibrary, LogosTreasury);
	deployer.link(AOLibrary, EthosTreasury);
	deployer.link(AOLibrary, PathosTreasury);

	deployer.deploy([
		[Epiphany, { overwrite: false }],
		[Ethos, 0, "Ethos", "ETHOS"],
		[EthosKilo, 0, "Ethos Kilo", "ETHOSKILO"],
		[EthosMega, 0, "Ethos Mega", "ETHOSMEGA"],
		[EthosGiga, 0, "Ethos Giga", "ETHOSGIGA"],
		[EthosTera, 0, "Ethos Tera", "ETHOSTERA"],
		[EthosPeta, 0, "Ethos Peta", "ETHOSPETA"],
		[EthosExa, 0, "Ethos Exa", "ETHOSEXA"],
		[EthosZetta, 0, "Ethos Zetta", "ETHOSZETTA"],
		[EthosYotta, 0, "Ethos Yotta", "ETHOSYOTTA"],
		[EthosXona, 0, "Ethos Xona", "ETHOSXONA"],
		[Pathos, 0, "Pathos", "PATHOS"],
		[PathosKilo, 0, "Pathos Kilo", "PATHOSKILO"],
		[PathosMega, 0, "Pathos Mega", "PATHOSMEGA"],
		[PathosGiga, 0, "Pathos Giga", "PATHOSGIGA"],
		[PathosTera, 0, "Pathos Tera", "PATHOSTERA"],
		[PathosPeta, 0, "Pathos Peta", "PATHOSPETA"],
		[PathosExa, 0, "Pathos Exa", "PATHOSEXA"],
		[PathosZetta, 0, "Pathos Zetta", "PATHOSZETTA"],
		[PathosYotta, 0, "Pathos Yotta", "PATHOSYOTTA"],
		[PathosXona, 0, "Pathos Xona", "PATHOSXONA"],
		[Position, 0, "AO Position", "AOPOS"],
		NameTAOVault,
		AOUintSetting,
		AOBoolSetting,
		AOAddressSetting,
		AOBytesSetting,
		AOStringSetting
	]);

	deployer
		.then(async function() {
			epiphany = await Epiphany.deployed();
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
			position = await Position.deployed();
			nametaovault = await NameTAOVault.deployed();
			aouintsetting = await AOUintSetting.deployed();
			aoboolsetting = await AOBoolSetting.deployed();
			aoaddresssetting = await AOAddressSetting.deployed();
			aobytessetting = await AOBytesSetting.deployed();
			aostringsetting = await AOStringSetting.deployed();

			return deployer.deploy(NameFactory, position.address, nametaovault.address);
		})
		.then(async function() {
			namefactory = await NameFactory.deployed();

			// position grant access to namefactory
			await position.setWhitelist(namefactory.address, true, { from: primordialAccount });

			// Link NameFactory to NameTAOVault
			await nametaovault.setNameFactoryAddress(namefactory.address, { from: primordialAccount });

			// Deploy NameTAOLookup, NameTAOPosition, LogosTreasury, EthosTreasury, PathosTreasury
			return deployer.deploy([
				[NameTAOLookup, namefactory.address],
				[NameTAOPosition, namefactory.address],
				[LogosTreasury, namefactory.address],
				[EthosTreasury, namefactory.address],
				[PathosTreasury, namefactory.address]
			]);
		})
		.then(async function() {
			nametaolookup = await NameTAOLookup.deployed();
			nametaoposition = await NameTAOPosition.deployed();
			logostreasury = await LogosTreasury.deployed();
			ethostreasury = await EthosTreasury.deployed();
			pathostreasury = await PathosTreasury.deployed();

			// Link NameTAOLookup to NameFactory
			await namefactory.setNameTAOLookupAddress(nametaolookup.address, { from: primordialAccount });

			// Link NameTAOPosition to NameFactory
			await namefactory.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });

			// Link NameTAOPosition to NameTAOVault
			await nametaovault.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });

			// Store Ethos denominations in the treasury contract
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

			// Grant access to EthosTreasury to transact on behalf of others on all Ethos denominations
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

			// Store Pathos denominations in the treasury contract
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

			// Grant access to PathosTreasury to transact on behalf of others on all Pathos denominations
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

			// Deploy NamePublicKey, TAOPosition, AOSetting
			return deployer.deploy([
				[NamePublicKey, namefactory.address, nametaoposition.address],
				[TAOPosition, namefactory.address, nametaoposition.address, position.address],
				[AOSettingAttribute, nametaoposition.address],
				[Logos, 0, "Logos", "LOGOS", nametaoposition.address],
				[LogosKilo, 0, "Logos Kilo", "LOGOSKILO", nametaoposition.address],
				[LogosMega, 0, "Logos Mega", "LOGOSMEGA", nametaoposition.address],
				[LogosGiga, 0, "Logos Giga", "LOGOSGIGA", nametaoposition.address],
				[LogosTera, 0, "Logos Tera", "LOGOSTERA", nametaoposition.address],
				[LogosPeta, 0, "Logos Peta", "LOGOSPETA", nametaoposition.address],
				[LogosExa, 0, "Logos Exa", "LOGOSEXA", nametaoposition.address],
				[LogosZetta, 0, "Logos Zetta", "LOGOSZETTA", nametaoposition.address],
				[LogosYotta, 0, "Logos Yotta", "LOGOSYOTTA", nametaoposition.address],
				[LogosXona, 0, "Logos Xona", "LOGOSXONA", nametaoposition.address]
			]);
		})
		.then(async function() {
			namepublickey = await NamePublicKey.deployed();
			taoposition = await TAOPosition.deployed();
			aosettingattribute = await AOSettingAttribute.deployed();
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

			// Link NamePublicKey to NameFactory
			await namefactory.setNamePublicKeyAddress(namepublickey.address, { from: primordialAccount });

			// position grant access to taoposition
			await position.setWhitelist(taoposition.address, true, { from: primordialAccount });

			// Store Logos denominations in the treasury contract
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

			// Grant access to LogosTreasury to transact on behalf of others on all Logos denominations
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

			// Deploy AOSetting
			return deployer.deploy(
				AOSetting,
				namefactory.address,
				nametaoposition.address,
				aosettingattribute.address,
				aouintsetting.address,
				aoboolsetting.address,
				aoaddresssetting.address,
				aobytessetting.address,
				aostringsetting.address
			);
		})
		.then(async function() {
			aosetting = await AOSetting.deployed();

			// Grant access to aosetting
			await aosettingattribute.setWhitelist(aosetting.address, true, { from: primordialAccount });
			await aouintsetting.setWhitelist(aosetting.address, true, { from: primordialAccount });
			await aoboolsetting.setWhitelist(aosetting.address, true, { from: primordialAccount });
			await aoaddresssetting.setWhitelist(aosetting.address, true, { from: primordialAccount });
			await aobytessetting.setWhitelist(aosetting.address, true, { from: primordialAccount });
			await aostringsetting.setWhitelist(aosetting.address, true, { from: primordialAccount });

			// Deploy TAOFactory
			return deployer.deploy(
				TAOFactory,
				namefactory.address,
				nametaolookup.address,
				nametaoposition.address,
				aosetting.address,
				logos.address,
				nametaovault.address
			);
		})
		.then(async function() {
			taofactory = await TAOFactory.deployed();

			// Link TAOFactory to NameTAOLookup
			await nametaolookup.setTAOFactoryAddress(taofactory.address, { from: primordialAccount });

			// Link TAOFactory to NameTAOPosition
			await nametaoposition.setTAOFactoryAddress(taofactory.address, { from: primordialAccount });

			// Deploy TAOFamily, TAOPool
			return deployer.deploy([
				[TAOFamily, namefactory.address, nametaoposition.address, taofactory.address],
				[TAOPool, namefactory.address, nametaoposition.address, taofactory.address, pathos.address, ethos.address, logos.address]
			]);
		})
		.then(async function() {
			taofamily = await TAOFamily.deployed();
			taopool = await TAOPool.deployed();

			// Link TAOFamily to TAOFactory
			await taofactory.setTAOFamilyAddress(taofamily.address, { from: primordialAccount });

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
				var result = await taofactory.createTAO("Primordial Thought of AO", "", "", "", "", primordialNameId, 0, {
					from: primordialAccount
				});
				var createTAOEvent = result.logs[0];
				primordialTAOId = createTAOEvent.args.taoId;
			} catch (e) {
				console.log("Unable to create Primordial TAO", e);
				return;
			}

			try {
				var result = await taofactory.createTAO("Settings of AO", "", "", "", "", primordialTAOId, 0, {
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
			 * startingNetworkTokenBonusMultiplier 1000000 = 100%
			 */
			try {
				var result = await aosetting.addUintSetting(
					"startingNetworkTokenBonusMultiplier",
					10 ** 6,
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
				console.log("Unable to add startingNetworkTokenBonusMultiplier setting", e);
			}

			/**
			 * endingNetworkTokenBonusMultiplier 250000 = 25%
			 */
			try {
				var result = await aosetting.addUintSetting(
					"endingNetworkTokenBonusMultiplier",
					250000,
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
				console.log("Unable to add endingNetworkTokenBonusMultiplier setting", e);
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

			// Deploy AOToken and all of the denominations
			return deployer.deploy([
				[AOToken, 0, "AO Token", "AOTKN", settingTAOId, aosetting.address],
				[AOKilo, 0, "AO Kilo", "AOKILO"],
				[AOMega, 0, "AO Mega", "AOMEGA"],
				[AOGiga, 0, "AO Giga", "AOGIGA"],
				[AOTera, 0, "AO Tera", "AOTERA"],
				[AOPeta, 0, "AO Peta", "AOPETA"],
				[AOExa, 0, "AO Exa", "AOEXA"],
				[AOZetta, 0, "AO Zetta", "AOZETTA"],
				[AOYotta, 0, "AO Yotta", "AOYOTTA"],
				[AOXona, 0, "AO Xona", "AOXONA"],
				AOTreasury
			]);
		})
		.then(async function() {
			aotoken = await AOToken.deployed();
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

			// Link AOToken to NameTAOVault
			await nametaovault.setAOTokenAddress(aotoken.address, { from: primordialAccount });

			// Store AO denominations in the treasury contract
			await aotreasury.addDenomination("ao", aotoken.address, { from: primordialAccount });
			await aotreasury.addDenomination("kilo", aokilo.address, { from: primordialAccount });
			await aotreasury.addDenomination("mega", aomega.address, { from: primordialAccount });
			await aotreasury.addDenomination("giga", aogiga.address, { from: primordialAccount });
			await aotreasury.addDenomination("tera", aotera.address, { from: primordialAccount });
			await aotreasury.addDenomination("peta", aopeta.address, { from: primordialAccount });
			await aotreasury.addDenomination("exa", aoexa.address, { from: primordialAccount });
			await aotreasury.addDenomination("zetta", aozetta.address, { from: primordialAccount });
			await aotreasury.addDenomination("yotta", aoyotta.address, { from: primordialAccount });
			await aotreasury.addDenomination("xona", aoxona.address, { from: primordialAccount });

			// Grant access to aotreasury to transact on behalf of others on all AO Tokens denominations
			await aotoken.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aokilo.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aomega.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aogiga.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aotera.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aopeta.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aoexa.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aozetta.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aoyotta.setWhitelist(aotreasury.address, true, { from: primordialAccount });
			await aoxona.setWhitelist(aotreasury.address, true, { from: primordialAccount });

			// AOToken Grant access to NameTAOVault
			await aotoken.setWhitelist(nametaovault.address, true, { from: primordialAccount });

			return deployer.deploy([
				[AOPool, aotoken.address],
				[AOETH, 0, "AO ETH", "AOETH", aotoken.address],
				[
					AOEarning,
					settingTAOId,
					aosetting.address,
					aotoken.address,
					aotreasury.address,
					namefactory.address,
					pathos.address,
					ethos.address
				]
			]);
		})
		.then(async function() {
			aopool = await AOPool.deployed();
			aoeth = await AOETH.deployed();
			aoearning = await AOEarning.deployed();

			// Grant access to aopool to transact on behalf of others on base denomination
			await aotoken.setWhitelist(aopool.address, true, { from: primordialAccount });

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

			// Link AOETH to AOToken
			await aotoken.setAOEthAddress(aoeth.address, { from: primordialAccount });

			// AOETH grant access to AOToken
			await aoeth.setWhitelist(aotoken.address, true, { from: primordialAccount });

			// Grant access to aoearning to transact on behalf of others on base denomination
			await aotoken.setWhitelist(aoearning.address, true, { from: primordialAccount });

			// pathos grant access to aoearning
			await pathos.setWhitelist(aoearning.address, true, { from: primordialAccount });

			// ethos grant access to aoearning
			await ethos.setWhitelist(aoearning.address, true, { from: primordialAccount });

			return deployer.deploy(
				AOContent,
				settingTAOId,
				aosetting.address,
				aotoken.address,
				aotreasury.address,
				aoearning.address,
				nametaoposition.address
			);
		})
		.then(async function() {
			aocontent = await AOContent.deployed();

			// Grant access to aocontent to transact on behalf of others on all AO Tokens denominations
			await aotoken.setWhitelist(aocontent.address, true, { from: primordialAccount });

			// aoearning grant access to aocontent
			await aoearning.setWhitelist(aocontent.address, true, { from: primordialAccount });

			// Set NameTAOPositionAddress on the following contracts
			await aoaddresssetting.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await aoboolsetting.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await aobytessetting.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await aostringsetting.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await aouintsetting.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });

			await epiphany.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await nametaolookup.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await position.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });

			await aoearning.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await aopool.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });

			await aotoken.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await aokilo.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await aomega.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await aogiga.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await aotera.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await aopeta.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await aoexa.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await aozetta.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await aoyotta.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await aoxona.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await aotreasury.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });

			await logos.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await logoskilo.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await logosmega.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await logosgiga.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await logostera.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await logospeta.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await logosexa.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await logoszetta.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await logosyotta.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await logosxona.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await logostreasury.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });

			await ethos.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await ethoskilo.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await ethosmega.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await ethosgiga.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await ethostera.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await ethospeta.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await ethosexa.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await ethoszetta.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await ethosyotta.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await ethosxona.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await ethostreasury.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });

			await pathos.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await pathoskilo.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await pathosmega.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await pathosgiga.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await pathostera.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await pathospeta.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await pathosexa.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await pathoszetta.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await pathosyotta.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await pathosxona.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });
			await pathostreasury.setNameTAOPositionAddress(nametaoposition.address, { from: primordialAccount });

			// TODO: Transfer TheAO ownership to Primordial TAO

			console.log("Primordial TAO ID", primordialTAOId);
			console.log("Setting TAO ID", settingTAOId);
		});
};
