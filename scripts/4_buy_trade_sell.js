const hre = require("hardhat");
require("dotenv").config();

let tokens = require("../" + process.env.FILENAME);

async function getContractInfo(name) {
  const contract = tokens.filter((f) => f.name === name);

  if (contract && contract[0] && contract[0].address) return contract[0];

  return null;
}

async function main() {
  const tg = await getContractInfo("HTG");
  const td = await getContractInfo("DOP");
  const us = await getContractInfo("USD");
  const hx = await getContractInfo("Haiex");

  let tgoud = await hre.ethers.getContractAt("HTG", tg.address);
  let tdop = await hre.ethers.getContractAt("DOP", td.address);
  let usd = await hre.ethers.getContractAt("USD", us.address);
  let haiex = await hre.ethers.getContractAt("Haiex", hx.address);

  let balanceTgoud, balanceTdop, balanceUsd, reserveUsd;

  const getBalance = async (user) => {
    balanceTgoud = await tgoud.balanceOf(user || process.env.DEPLOYERADDRESS);
    balanceTdop = await tdop.balanceOf(user || process.env.DEPLOYERADDRESS);
    balanceUsd = await usd.balanceOf(user || process.env.DEPLOYERADDRESS);
    reserveUsd = await haiex.getUSDReserve();

    console.log(await tgoud.decimals());
    console.log(
      "//////////////////////////////////////////////////////////////////"
    );
    console.log(
      "Balance TGOUD: ",
      ethers.BigNumber.from(balanceTgoud)
        // .div(ethers.BigNumber.from(10).pow(await tgoud.decimals()))
        .toString() + " HTG"
    );
    console.log(
      "Balance TDOP: ",

      ethers.BigNumber.from(balanceTdop)
        .div(ethers.BigNumber.from(10).pow(await tdop.decimals()))
        .toString() + " DOP"
    );
    console.log(
      "Balance USDC: ",
      (
        parseFloat(ethers.BigNumber.from(balanceUsd).toString()) /
        10 ** (await usd.decimals())
      ).toFixed(3) + " USD"
    );
    console.log(
      "Haiex USDC reserve: ",
      (
        parseFloat(ethers.BigNumber.from(reserveUsd).toString()) /
        10 ** (await usd.decimals())
      ).toFixed(3) + " USD"
    );
    console.log(
      "//////////////////////////////////////////////////////////////////"
    );
  };
  await getBalance();

  const amount = 1;
  console.log(`Buying $${amount} of tgoud`);
  const amountUsd = ethers.BigNumber.from(amount).mul(
    ethers.BigNumber.from(10).pow(await usd.decimals())
  );
  console.log(amountUsd);
  const buyTgoud = await haiex.buyStable(tgoud.address, amountUsd);
  await buyTgoud.wait();
  console.log(buyTgoud.hash);

  await getBalance();

  console.log("trade tgoud - tdop");
  const amount1 = ethers.BigNumber.from(balanceTgoud);
  const trade = await haiex.stableTrade(tgoud.address, tdop.address, amount1);
  await trade.wait();
  console.log(trade.hash);
  await getBalance();

  console.log("trade tdop - tgoud");
  const amount2 = ethers.BigNumber.from(balanceTdop);
  const trade2 = await haiex.stableTrade(tdop.address, tgoud.address, amount2);
  await trade2.wait();
  console.log(trade2.hash);
  await getBalance();

  console.log("Selling htg");
  const amount3 = ethers.BigNumber.from(balanceTgoud);
  const sell = await haiex.sellStable(tgoud.address, amount3);
  await sell.wait();
  console.log(sell.hash);
  await getBalance();

  console.log("Congratilations. Good Jobs .......");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
