const hre = require('hardhat');
require('dotenv').config();

let tokens = require('../' + process.env.FILENAME);

async function getContractInfo(name) {
  const contract = tokens.filter(f => f.name === name);

  if (contract && contract[0] && contract[0].address) return contract[0];

  return null;
}

async function main() {
  let list = [
    {
      name: 'HTG',
      type: 'token',
      price: 117570857,
    },
    {
      name: 'DOP',
      type: 'token',
      price: 53318548,
    },
    // {
    //   name: 'CFA',
    //   type: 'token',
    //   price: 658181286,
    // },
    // {
    //   name: 'CAD',
    //   type: 'token',
    //   price: 1303443,
    // },
  ];

  const hx = await getContractInfo('Haiex');
  const haiex = await hre.ethers.getContractAt('Haiex', hx.address);

  const us = await getContractInfo('USD');
  let usdc = await hre.ethers.getContractAt('USD', us.address);

  console.log('Waitting for add usdc');
  const addedUSD = await haiex.changeUSD(usdc.address);
  await addedUSD.wait();
  console.log(addedUSD.hash);

  for (let index = 0; index < list.length; index++) {
    const element = list[index];
    const tk = await getContractInfo(element.name);

    let token = await hre.ethers.getContractAt(element.name, tk.address);

    // console.log('removing ' + element.name);
    // const remove = await haiex.removeStableByAddress(token.address);
    // await remove.wait();
    // console.log(remove.hash);

    console.log('adding ' + element.name);
    const add = await haiex.addStable(token.address, ethers.BigNumber.from(element.price), 0, true);
    await add.wait();
    console.log(add.hash);

    console.log('transfering Ownership' + element.name);
    const transferOwner = await token.changeManager(haiex.address);
    await transferOwner.wait();
    console.log(transferOwner.hash);
  }

  console.log('Congratilations. Good Jobs .......');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
