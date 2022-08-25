const { expect } = require('chai');
const { ethers } = require('hardhat');

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
let initToten = [
  {
    name: 'HTG',
    type: 'token',
    price: 100000000,
  },
  {
    name: 'DOP',
    type: 'token',
    price: 55000000,
  },
];
let tokens = [];

describe('Haiex', function () {
  let haiex;
  let deployer;

  before(async () => {
    const [owner] = await ethers.getSigners();
    deployer = owner.address;
    const Haiex = await ethers.getContractFactory('Haiex');
    haiex = await Haiex.deploy();
    await haiex.deployed();
    console.log('Contract address: ', haiex.address);
  });

  it('Admin address should equal to deployer address', async function () {
    const admin = await haiex.admin();
    expect(admin).to.equal(deployer);
  });

  it('Manager should equal to deployer address', async function () {
    const manager = await haiex.manager();
    expect(manager).to.equal(deployer);
  });

  it(`Total stablecoins deployed should equal to ${list.length}`, async function () {
    for (let index = 0; index < list.length; index++) {
      const element = list[index];
      const contact = await init(element.name, element.type);
      tokens.push(contact);
    }
    const totaleDeployedStable = tokens.length;
    expect(totaleDeployedStable).to.equal(list.length);
  });

  it(`Init USD stablecoin should equal to deployed USD`, async function () {
    const us = await getContractInfo('USD');

    const addUSD = await haiex.changeUSD(us.address);
    await addUSD.wait();

    const newUSD = await haiex.USDToken();

    expect(newUSD).to.equal(us.address);
  });

  it(`Add stablecoin HTG and DOP to smart contract`, async function () {
    for (let index = 0; index < initToten.length; index++) {
      const element = initToten[index];
      const tk = await getContractInfo(element.name);
      let token = await hre.ethers.getContractAt(element.name, tk.address);

      const add = await haiex.addStable(tk.address, element.price, 0, true);
      await add.wait();

      const transferOwner = await token.transferOwnership(haiex.address);
      await transferOwner.wait();

      expect(await token.owner()).to.equal(haiex.address);
    }

    const element = initToten[0];
    const stable = await haiex.stables(0);
    const tk = await getContractInfo(element.name);
    expect(stable[0]).to.equal(tk.address);

    const element1 = initToten[1];
    const stable1 = await haiex.stables(1);
    const tk1 = await getContractInfo(element1.name);
    expect(stable1[0]).to.equal(tk1.address);
  });
});

async function init(contract, type) {
  const SmartContract = await hre.ethers.getContractFactory(contract);
  const smartContract = await SmartContract.deploy();
  await smartContract.deployed();
  return {
    name: contract,
    type: type,
    address: smartContract.address,
    contract: smartContract,
  };
}

async function getContractInfo(name) {
  const contract = tokens.filter(f => f.name === name);
  if (contract && contract[0] && contract[0].address) return contract[0];
  return null;
}
