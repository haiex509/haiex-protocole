require('@nomiclabs/hardhat-ethers');
require('hardhat-deploy');
require('dotenv').config();
require('@nomiclabs/hardhat-web3');
// npx hardhat run --network localhost scripts/2_init_assets.js
// npx hardhat node

module.exports = {
  // defaultNetwork: 'alfajores',
  namedAccounts: {
    deployer: 0,
  },
  networks: {
    // hardhat: {
    //   forking: {
    //     url: process.env.ALFAJORESURL,
    //   },
    // },
    alfajores: {
      url: process.env.ALFAJORESURL,
      accounts: [process.env.PRIVATEKEY],
      chainId: 44787,
    },
    celo: {
      url: process.env.CELOURL,
      accounts: [process.env.PRIVATEKEY],
      chainId: 42220,
    },
  },
  solidity: {
    version: '0.8.4',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  mocha: {
    timeout: 20000,
  },
};
