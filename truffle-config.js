/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() {
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>')
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */

module.exports = {
	// See <http://truffleframework.com/docs/advanced/configuration>
	// to customize your Truffle configuration!
	networks: {
		development: {
			host: "localhost",
			port: 8545,
			network_id: "*",
			gas: 6950000,
			gasPrice: 10000000000, // 10 Gwei
			websockets: false
		},
		rinkeby: {
			host: "localhost", // Connect to geth on the specified
			port: 9545,
			from: "0xe80a265742e74e8c52d6ca185edf894edebe033f", // default address to use for any transaction Truffle makes during migrations
			network_id: 4,
			gas: 6950000, // Gas limit used for deploys,
			gasPrice: 15000000000, // 15 Gwei
			websockets: false,
			skipDryRun: true
		},
		mainnet: {
			host: "localhost", // Connect to geth on the specified
			port: 8545,
			from: "0x268c85ef559be52f3749791445dfd9a5abc37186", // default address to use for any transaction Truffle makes during migrations
			network_id: 1,
			gas: 6950000, // Gas limit used for deploys,
			gasPrice: 10000000000, // 10 Gwei
			websockets: false,
			skipDryRun: true
		}
	},
	compilers: {
		solc: {
			version: "v0.5.4",
			settings: {
				optimizer: {
					enabled: true,
					runs: 200
				}
			}
		}
	}
};
