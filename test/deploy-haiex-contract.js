const { expect } = require('chai');
const { ethers } = require('hardhat');

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
});
