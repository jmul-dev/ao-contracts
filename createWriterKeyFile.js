const fs = require("fs");
const EthCrypto = require("eth-crypto");
const networkId = process.argv[2];
const name = process.argv[3];

if (!networkId) {
	throw new Error("Missing networkId args");
}

if (!name) {
	throw new Error("Missing name args");
}

const identity = EthCrypto.createIdentity();

const filename = "./writerKeys/" + networkId + "_" + name + ".json";
if (fs.existsSync(filename)) {
	throw new Error("writer key file already exists");
} else {
	fs.writeFile(filename, JSON.stringify(identity), (err) => {
		if (err) throw new Error(err);
		console.log("writer key file was created: ", filename);
	});
}
