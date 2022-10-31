const hre = require('hardhat');
require('dotenv').config();

let tokens = require('../' + process.env.FILENAME);

async function getContractInfo(name) {
  const contract = tokens.filter(f => f.name === name);

  if (contract && contract[0] && contract[0].address) return contract[0];

  return null;
}

async function main() {
  // let list = [
  //   {
  //     name: 'USD',
  //     type: 'token',
  //     amount: 100000000 * 10 ** 18,
  //   },
  //   {
  //     name: 'BTC',
  //     type: 'token',
  //     amount: 1000 * 10 ** 18,
  //   },
  //   {
  //     name: 'ETH',
  //     type: 'token',
  //     amount: 1000 * 10 ** 18,
  //   },
  //   {
  //     name: 'CELO',
  //     type: 'token',
  //     amount: 10000 * 10 ** 18,
  //   },
  //   {
  //     name: 'HaiexCoin',
  //     type: 'token',
  //     amount: 1000000 * 10 ** 18,
  //   },
  // ];

  const tg = await getContractInfo('HTG');
  const td = await getContractInfo('DOP');
  const us = await getContractInfo('USD');
  const hx = await getContractInfo('Haiex');

  let tgoud = await hre.ethers.getContractAt('HTG', tg.address);
  let tdop = await hre.ethers.getContractAt('DOP', td.address);
  let usd = await hre.ethers.getContractAt('USD', us.address);
  let ausd = await hre.ethers.getContractAt('USD', '0x935c0F6019b05C787573B5e6176681282A3f3E05');

  let haiex = await hre.ethers.getContractAt('Haiex', hx.address);

  let balanceTgoud, balanceTdop, balanceUsd, balanceAUsd, reserveUsd, reserveAUsd;

  const getBalance = async user => {
    balanceTgoud = await tgoud.balanceOf(user || process.env.DEPLOYERADDRESS);
    balanceTdop = await tdop.balanceOf(user || process.env.DEPLOYERADDRESS);
    balanceUsd = await usd.balanceOf(user || process.env.DEPLOYERADDRESS);
    balanceAUsd = await ausd.balanceOf(user || process.env.DEPLOYERADDRESS);

    reserveUsd = await haiex.getUSDReserve();
    reserveAUsd = await ausd.balanceOf(haiex.address);

    console.log(await tgoud.decimals());
    console.log('//////////////////////////////////////////////////////////////////');
    console.log(
      'Balance TGOUD: ',
      ethers.BigNumber.from(balanceTgoud)
        // .div(ethers.BigNumber.from(10).pow(await tgoud.decimals()))
        .toString() + ' HTG',
    );
    console.log(
      'Balance TDOP: ',

      ethers.BigNumber.from(balanceTdop)
        .div(ethers.BigNumber.from(10).pow(await tdop.decimals()))
        .toString() + ' DOP',
    );
    console.log(
      'Balance USDC: ',
      (parseFloat(ethers.BigNumber.from(balanceUsd).toString()) / 10 ** (await usd.decimals())).toFixed(3) + ' USD',
    );
    console.log(
      'Balance AUSDC : ',
      (parseFloat(ethers.BigNumber.from(balanceAUsd).toString()) / 10 ** (await ausd.decimals())).toFixed(3) + ' AUSD',
    );
    console.log(
      'Haiex USDC reserve: ',
      (parseFloat(ethers.BigNumber.from(reserveUsd).toString()) / 10 ** (await usd.decimals())).toFixed(3) + ' USD',
    );
    console.log(
      'Haiex AUSDC : ',
      (parseFloat(ethers.BigNumber.from(reserveAUsd).toString()) / 10 ** (await usd.decimals())).toFixed(3) + ' AUSD',
    );
    console.log('//////////////////////////////////////////////////////////////////');
  };
  await getBalance();
  // const lendingpool = await haiex.changeLendingPool('0x4bd5643ac6f66a5237e18bfa7d47cf22f1c9f210');
  // await lendingpool.wait();
  // console.log(lendingpool.hash);

  // const lendingUsd = await haiex.changeAUSD('0x935c0F6019b05C787573B5e6176681282A3f3E05');
  // await lendingUsd.wait();
  // console.log(lendingUsd.hash);

  const lending = await haiex.lendingDepositReseve(`${500 * 10 ** 6}`);
  await lending.wait();
  console.log(lending.hash);

  await getBalance();

  // const lending2 = await haiex.lendingWithdrawReseve(`${499.99 * 100 * 10 ** 4}`);
  // await lending2.wait();
  // console.log(lending2.hash);

  // await getBalance();

  // const lending = await haiex.lendingDepositStable('0x9c44276E983292aEFD367A3332967A82ccbD347c', `${1000 * 10 ** 6}`);
  // await lending.wait();
  // console.log(lending.hash);
  // await getBalance();

  // const appr = await ausd.approve(process.env.DEPLOYERADDRESS, haiex.address, `${9 * 10 ** 6}`);
  // await appr.wait();
  // console.log(appr.hash);

  // const lending = await haiex.lendingWithdrawStable(tgoud.address, `${9 * 10 ** 6}`);
  // await lending.wait();
  // console.log(lending.hash);
  // await getBalance();

  // console.log('Congratilations. Good Jobs .......');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
