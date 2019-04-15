const fs = require("fs");
const EthCrypto = require("eth-crypto");
const name = process.argv[2];

if (!name) {
	throw new Error("Missing name args");
}

const identity = EthCrypto.createIdentity();

const filename = "./writerKeys/" + name + ".json";
if (fs.existsSync(filename)) {
	throw new Error("writer key file already exists");
} else {
	fs.writeFile(filename, JSON.stringify(identity), (err) => {
		if (err) throw new Error(err);
		console.log("writer key file was created: ", filename);
	});
}
