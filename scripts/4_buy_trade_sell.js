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
      name: 'USD',
      type: 'token',
      amount: 100000000 * 10 ** 18,
    },
    {
      name: 'BTC',
      type: 'token',
      amount: 1000 * 10 ** 18,
    },
    {
      name: 'ETH',
      type: 'token',
      amount: 1000 * 10 ** 18,
    },
    {
      name: 'CELO',
      type: 'token',
      amount: 10000 * 10 ** 18,
    },
    {
      name: 'HaiexCoin',
      type: 'token',
      amount: 1000000 * 10 ** 18,
    },
  ];

  const tg = await getContractInfo('HTG');
  const td = await getContractInfo('DOP');
  const us = await getContractInfo('USD');
  const hx = await getContractInfo('Haiex');

  let tgoud = await hre.ethers.getContractAt('HTG', tg.address);
  let tdop = await hre.ethers.getContractAt('DOP', td.address);
  let usd = await hre.ethers.getContractAt('USD', us.address);
  let haiex = await hre.ethers.getContractAt('Haiex', hx.address);

  let balanceTgoud, balanceTdop, balanceUsd, reserveUsd;

  const getBalance = async user => {
    balanceTgoud = await tgoud.balanceOf(user || process.env.DEPLOYERADDRESS);
    balanceTdop = await tdop.balanceOf(user || process.env.DEPLOYERADDRESS);
    balanceUsd = await usd.balanceOf(user || process.env.DEPLOYERADDRESS);
    reserveUsd = await haiex.getUSDReserve();

    console.log('//////////////////////////////////////////////////////////////////');
    console.log(
      'Balance TGOUD: ',
      ethers.BigNumber.from(balanceTgoud).div(ethers.BigNumber.from(10).pow(18)).toString() + ' HTG',
    );
    console.log(
      'Balance TDOP: ',
      ethers.BigNumber.from(balanceTdop).div(ethers.BigNumber.from(10).pow(18)).toString() + ' DOP',
    );
    console.log(
      'Balance USDC: ',
      (parseFloat(ethers.BigNumber.from(balanceUsd).toString()) / 10 ** 18).toFixed(3) + ' USD',
    );
    console.log(
      'Haiex USDC reserve: ',
      (parseFloat(ethers.BigNumber.from(reserveUsd).toString()) / 10 ** 18).toFixed(3) + ' USD',
    );
    console.log('//////////////////////////////////////////////////////////////////');
  };
  await getBalance();

  console.log('Buying $100 of tgoud');
  const amountUsd = ethers.BigNumber.from(10).mul(ethers.BigNumber.from(10).pow(18));
  const buyTgoud = await haiex.buyStable(tgoud.address, amountUsd);
  await buyTgoud.wait();
  console.log(buyTgoud.hash);
  await getBalance();

  console.log('trade tgoud - tdop');
  const amount = ethers.BigNumber.from(balanceTgoud);
  const trade = await haiex.stableTrade(tgoud.address, tdop.address, amount);
  await trade.wait();
  console.log(trade.hash);
  await getBalance();

  console.log('trade tdop - tgoud');
  const amount2 = ethers.BigNumber.from(balanceTdop);
  const trade2 = await haiex.stableTrade(tdop.address, tgoud.address, amount2);
  await trade2.wait();
  console.log(trade2.hash);
  await getBalance();

  console.log('Selling htg');
  const amount3 = ethers.BigNumber.from(balanceTgoud);
  const sell = await haiex.sellStable(tgoud.address, amount3);
  await sell.wait();
  console.log(sell.hash);
  await getBalance();

  console.log('Selling  dop');
  const amount4 = ethers.BigNumber.from(balanceTdop);
  const sell2 = await haiex.sellStable(tdop.address, amount4);
  await sell2.wait();
  console.log(sell2.hash);
  await getBalance();

  console.log('Congratilations. Good Jobs .......');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
