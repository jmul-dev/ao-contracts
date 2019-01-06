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
			host: "127.0.0.1",
			port: 8545,
			network_id: "*",
			gas: 6900000
		},
		ropsten: {
			host: "localhost", // Connect to geth on the specified
			port: 8545,
			from: "0x52af6e29eefd251d37028c9f8254724ac54422cd", // default address to use for any transaction Truffle makes during migrations
			network_id: 3,
			gas: 6900000, // Gas limit used for deploys,
			gasPrice: 10000000000 // 10 Gwei
		},
		rinkeby: {
			host: "localhost", // Connect to geth on the specified
			port: 8545,
			from: "0x16a038099561ac8ad73c497c18207e6c88ff6593", // default address to use for any transaction Truffle makes during migrations
			network_id: 4,
			gas: 6900000, // Gas limit used for deploys,
			gasPrice: 10000000000 // 10 Gwei
		},
		live: {
			host: "localhost", // Connect to geth on the specified
			port: 8545,
			from: "0x268c85ef559be52f3749791445dfd9a5abc37186", // default address to use for any transaction Truffle makes during migrations
			network_id: 1,
			gas: 6900000, // Gas limit used for deploys,
			gasPrice: 10000000000 // 10 Gwei
		}
	},
	solc: {
		optimizer: {
			enabled: true,
			runs: 200
		}
	}
};
