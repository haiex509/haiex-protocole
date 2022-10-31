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
    },
    {
      name: 'DOP',
      type: 'token',
    },
  ];

  const hx = await getContractInfo('Haiex');
  const haiex = await hre.ethers.getContractAt('Haiex', hx.address);

  for (let index = 0; index < list.length; index++) {
    const element = list[index];
    const tk = await getContractInfo(element.name);
    let token = await hre.ethers.getContractAt(element.name, tk.address);

    console.log('getting Stable By Address ' + element.name);
    const getStableByAddress = await haiex.getStableByAddress(token.address);
    // await getStableByAddress.wait();
    console.log('1$ => ' + ethers.BigNumber.from(getStableByAddress['price']).toNumber() / 1000000);
  }

  console.log('Congratilations. Good Jobs .......');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
