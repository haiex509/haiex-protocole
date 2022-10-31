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
    // {
    //   name: 'USD',
    //   type: 'token',
    //   amount: 1000000,
    // },
    {
      name: 'HTG',
      type: 'token',
      amount: 1000000,
    },
    {
      name: 'DOP',
      type: 'token',
      amount: 1000000,
    },

    // {
    //   name: 'CFA',
    //   type: 'token',
    //   amount: 1000000,
    // },
    // {
    //   name: 'CAD',
    //   type: 'token',
    //   amount: 1000000,
    // },
    // {
    //   name: 'BTC',
    //   type: 'token',
    //   amount: 1000000,
    // },
    // {
    //   name: 'ETH',
    //   type: 'token',
    //   amount: 1000000,
    // },
    // {
    //   name: 'CELO',
    //   type: 'token',
    //   amount: 1000000,
    // },
    // {
    //   name: 'HaiexCoin',
    //   type: 'token',
    //   amount: 1000000,
    // },
  ];

  const hx = await getContractInfo('Haiex');
  const haiex = await hre.ethers.getContractAt('Haiex', hx.address);

  for (let index = 0; index < list.length; index++) {
    const element = list[index];
    const tk = await getContractInfo(element.name);

    let token = await hre.ethers.getContractAt(element.name, tk.address);

    const decimals = await token.decimals();
    console.log('Waitting for approve Haiex to use 10000000 ' + element.name);
    const approveToken = await token.approve(
      haiex.address,
      ethers.BigNumber.from(element.amount).mul(ethers.BigNumber.from(10).pow(decimals)),
    );
    await approveToken.wait();
    console.log(approveToken.hash);
  }

  console.log('Congratilations. Good Jobs .......');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
