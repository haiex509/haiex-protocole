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
  const btc = await getContractInfo("BTC");
  const eth = await getContractInfo("ETH");

  const hx = await getContractInfo("Haiex");

  let tgoud = await hre.ethers.getContractAt("HTG", tg.address);
  let tdop = await hre.ethers.getContractAt("DOP", td.address);
  let usd = await hre.ethers.getContractAt("USD", us.address);
  let bitcoin = await hre.ethers.getContractAt("BTC", btc.address);
  let ethereum = await hre.ethers.getContractAt("ETH", eth.address);

  let haiex = await hre.ethers.getContractAt("Haiex", hx.address);

  let balanceTgoud, balanceTdop, balanceUsd, balanceETH, balanceBTC, reserveUsd;

  const getBalance = async (user) => {
    balanceTgoud = await tgoud.balanceOf(user || process.env.DEPLOYERADDRESS);
    balanceTdop = await tdop.balanceOf(user || process.env.DEPLOYERADDRESS);
    balanceUsd = await usd.balanceOf(user || process.env.DEPLOYERADDRESS);
    balanceBTC = await bitcoin.balanceOf(user || process.env.DEPLOYERADDRESS);
    balanceETH = await ethereum.balanceOf(user || process.env.DEPLOYERADDRESS);

    reserveUsd = await haiex.getUSDReserve();

    console.log(
      "//////////////////////////////////////////////////////////////////"
    );

    console.log(
      "Balance TGOUD: ",
      (
        parseFloat(ethers.BigNumber.from(balanceTgoud).toString()) /
        10 ** 6
      ).toFixed(3) + " HTG"
    );
    console.log(
      "Balance TDOP: ",
      ethers.BigNumber.from(balanceTdop)
        .div(ethers.BigNumber.from(10).pow(6))
        .toString() + " DOP"
    );
    console.log(
      "Balance USD: ",
      (
        parseFloat(ethers.BigNumber.from(balanceUsd).toString()) /
        10 ** 6
      ).toFixed(3) + " USD"
    );
    console.log(
      "Balance BTC: ",
      (
        parseFloat(ethers.BigNumber.from(balanceBTC).toString()) /
        10 ** 8
      ).toFixed(3) + " BTC"
    );
    console.log(
      "Balance ETH: ",
      (
        parseFloat(ethers.BigNumber.from(balanceETH).toString()) /
        10 ** 18
      ).toFixed(3) + " ETH"
    );
    console.log(
      "Haiex USDC reserve: ",
      (
        parseFloat(ethers.BigNumber.from(reserveUsd).toString()) /
        10 ** 6
      ).toFixed(3) + " USD"
    );
    console.log(
      "//////////////////////////////////////////////////////////////////"
    );
  };
  await getBalance();

  // console.log("Buying $1 of tgoud");
  // const amountUsd = ethers.BigNumber.from(1).mul(
  //   ethers.BigNumber.from(10).pow(6)
  // );
  // const buyTgoud = await haiex.buyStable(tgoud.address, amountUsd);
  // await buyTgoud.wait();
  // console.log(buyTgoud.hash);
  // await getBalance();

  // console.log("estimate");
  // const estimateUsd = ethers.BigNumber.from(10).mul(
  //   ethers.BigNumber.from(10).pow(18)
  // );
  // const estimate = await haiex.swapEstimation(
  //   [usd.address, btc.address],
  //   estimateUsd
  // );
  // console.log(estimate.toString());

  // console.log("swap  tgoud token");
  // // const amount4 = ethers.BigNumber.from(balanceTgoud);

  // const amount4 = ethers.BigNumber.from(100).mul(
  //   ethers.BigNumber.from(10).pow(6)
  // );
  // const swap = await haiex.swapStable(
  //   tgoud.address,
  //   btc.address,
  //   [
  //     "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83",
  //     "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
  //     "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1",
  //     "0x8e5bbbb09ed1ebde8674cda39a0c169401db4252",
  //   ],
  //   amount4
  // );
  // await swap.wait();
  // console.log(swap.hash);
  // await getBalance();

  console.log("swap   token tgoud");
  const amount2 = ethers.BigNumber.from(balanceETH);
  const swap2 = await haiex.swapStable(
    eth.address,
    tgoud.address,
    [
      "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1",
      "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
      "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83",
    ],
    amount2
  );
  await swap2.wait();
  console.log(swap2.hash);
  await getBalance();

  // console.log("Selling htg");
  // const amount3 = ethers.BigNumber.from(balanceTgoud);
  // const sell = await haiex.sellStable(tgoud.address, amount3);
  // await sell.wait();
  // console.log(sell.hash);
  // await getBalance();
  console.log("Congratilations. Good Jobs .......");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
