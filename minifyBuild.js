const fsExtra = require("fs-extra");
const fs = require("fs");
const path = require("path");
const Debug = require("debug");

const debug = Debug(`ao:contracts`);
const buildDir = path.resolve(__dirname, "build");
const contractsDir = path.join(buildDir, "contracts");
const minifiedDir = path.join(buildDir, "minified");

const minify = async () => {
	await fsExtra.ensureDir(minifiedDir);

	const existingContracts = await fs.readdirSync(contractsDir);
	if (!existingContracts.length) {
		debug(`No contracts found. Exit gracefully`);
		process.exit();
	}
	existingContracts.map((contract, index) => {
		debug(`[${contract}] - minifying ${index + 1} out of ${existingContracts.length}`);
		const contractJSON = fsExtra.readJsonSync(path.join(contractsDir, contract));
		const minifiedContractJSON = { contractName: contractJSON.contractName, abi: contractJSON.abi, networks: contractJSON.networks };
		fs.writeFileSync(path.join(minifiedDir, contract), JSON.stringify(minifiedContractJSON));
	});
};

minify();
