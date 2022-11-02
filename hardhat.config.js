require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy");
require("dotenv").config();
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-etherscan");
// npx hardhat run --network localhost scripts/2_init_assets.js
// npx hardhat node

module.exports = {
  // defaultNetwork: 'alfajores',
  namedAccounts: {
    deployer: 0,
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.CELOURL,
      },
    },
    goerli: {
      url: process.env.GOERLI,
      accounts: [process.env.PRIVATEKEY],
      chainId: 5,
    },
    matic: {
      url: process.env.POLYGONURL,
      accounts: [process.env.PRIVATEKEY],
      chainId: 137,
    },
    alfajores: {
      url: process.env.ALFAJORESURL,
      accounts: [process.env.PRIVATEKEY],
      chainId: 44787,
    },
    bnbtestnet: {
      url: process.env.BNBTESTNETURL,
      accounts: [process.env.PRIVATEKEY],
      chainId: 97,
    },
    celo: {
      url: process.env.CELOURL,
      accounts: [process.env.PRIVATEKEY],
      chainId: 42220,
    },
    gnosis: {
      url: process.env.GNOSISCHAINURL,
      accounts: [process.env.PRIVATEKEY],
      chainId: 100,
    },
  },
  etherscan: {
    apiKey: {
      polygon: "FRESPWCDKGK7947Y3UH4GMIAJVK8QR4GP8",
    },
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 20000,
  },
};
