const hre = require('hardhat');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
resolve = require('path').resolve;
require('dotenv').config();

async function init(contract, type) {
  const SmartContract = await hre.ethers.getContractFactory(contract);
  console.log(`Deploying ${contract} ...`);

  const smartContract = await SmartContract.deploy();
  await smartContract.deployed();

  console.log('Deployed to:', smartContract.address);
  return {
    name: contract,
    type: type,
    address: smartContract.address,
  };
}

async function main() {
  let tokens = [];
  let list = [
    {
      name: 'HTG',
      type: 'token',
    },
    {
      name: 'DOP',
      type: 'token',
    },
    {
      name: 'USD',
      type: 'token',
    },
    {
      name: 'BTC',
      type: 'token',
    },
    {
      name: 'ETH',
      type: 'token',
    },
    {
      name: 'CELO',
      type: 'token',
    },
    {
      name: 'HaiexCoin',
      type: 'token',
    },
    {
      name: 'Haiex',
      type: 'dapp',
    },
  ];

  for (let index = 0; index < list.length; index++) {
    const element = list[index];
    const contact = await init(element.name, element.type);
    tokens.push(contact);
  }

  fs.writeFileSync(path.resolve(resolve('./'), process.env.FILENAME), JSON.stringify(tokens));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
