require('@nomiclabs/hardhat-ethers')
require('@nomiclabs/hardhat-etherscan')
require('hardhat-abi-exporter')
require('hardhat-gas-reporter')

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  // https://github.com/ethereum/solidity/releases
  solidity: '0.8.11',
  networks: {
    hardhat: {},
    ...(process.env.RINKEBY_ENABLED
      ? {
          rinkeby: {
            url: process.env.RINKEBY_URL,
            chainId: 4,
            accounts: [process.env.RINKEBY_PRIVATE_KEY],
          },
        }
      : {}),
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
  },
}
