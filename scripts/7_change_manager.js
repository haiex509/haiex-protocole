const hre = require('hardhat');
require('dotenv').config();

let tokens = require('../' + process.env.FILENAME);

async function getContractInfo(name) {
  const contract = tokens.filter(f => f.name === name);

  if (contract && contract[0] && contract[0].address) return contract[0];

  return null;
}

async function main() {
  const hx = await getContractInfo('Haiex');
  const haiex = await hre.ethers.getContractAt('Haiex', hx.address);

  console.log('Waitting for changing Manager');
  const changeManager = await haiex.changeManager('<MANAGER_ADDRESS_HERE>');
  await changeManager.wait();
  console.log(changeManager.hash);

  console.log('Congratilations. Good Jobs .......');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
