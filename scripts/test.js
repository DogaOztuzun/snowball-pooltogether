const hardhat = require("hardhat");
const chalk = require("chalk");
const SNOB_HOLDER = "0x83b03A06A4733BC1778159AC5cAAf11Ac3087cc8";
const { ethers, deployments, getNamedAccounts } = hardhat;
const hre = require("hardhat");
const fs = require('fs');

function dim() {
  console.log(chalk.dim.call(chalk, ...arguments));
}

function green() {
  console.log(chalk.green.call(chalk, ...arguments));
}

const toWei = ethers.utils.parseEther;

async function getYieldSourcePrizePoolProxy(tx) {
  const snobHolder = await ethers.provider.getSigner(SNOB_HOLDER);
  const proxyAbi = JSON.parse(fs.readFileSync('./abis/YieldSourcePrizePoolProxyFactory.json', 'utf8'));
  const stakePrizePoolProxyFactory = await ethers.getContractAt(
    proxyAbi.abi,
    "0x54DCaf5CBC54b02dB781622A883722d05918AEa3",
    snobHolder
  );
  const createResultReceipt = await ethers.provider.getTransactionReceipt(
    tx.hash
  );
  const createResultEvents = createResultReceipt.logs.map((log) => {
    try {
      return stakePrizePoolProxyFactory.interface.parseLog(log);
    } catch (e) {
      return null;
    }
  });
  const address = createResultEvents[0].args.proxy;
  dim(`Found pool address at ${address}`);
  return address;
}

async function run() {

  const snobHolder = await ethers.provider.getSigner(SNOB_HOLDER);

  const snob = await ethers.getContractAt(
    "IERC20Upgradeable",
    "0xf319e2f610462f846d6e93f51cdc862eeff2a554",
    snobHolder
  );

  const pgl = await ethers.getContractAt(
    "IERC20Upgradeable",
    "0xf91BD10B18B45262A324883FbDB2Ea21d66ca938",
    snobHolder
  );

  const builderAbi = JSON.parse(fs.readFileSync('./abis/PoolWithMultipleWinnersBuilder.json', 'utf8'));
  const builder = await ethers.getContractAt(
    builderAbi.abi,
    "0x9A490223b0B9825033929A1CF0288F5d7CE654B4",
    snobHolder
  );

  const snowballYieldSource = await ethers.getContractAt(
    "SnowballYieldSource",
    "0xEa9f1C1AFe6F03c947B5a2513FF157D745D9E8bA",
    snobHolder
  );

  const block = await ethers.provider.getBlock();

  const yieldSourcePrizePoolConfig = {
    yieldSource: snowballYieldSource.address,
    maxExitFeeMantissa: ethers.utils.parseEther("0.1"),
    maxTimelockDuration: 300,
  };

  const multipleWinnersConfig = {
    rngService: "0xb0375F38c7A31EfE51047470a4685ce1ED6eF2bB",
    prizePeriodStart: block.timestamp,
    prizePeriodSeconds: 1,
    ticketName: "TICKET",
    ticketSymbol: "TICK",
    sponsorshipName: "SPONSORSHIP",
    sponsorshipSymbol: "SPON",
    ticketCreditLimitMantissa: ethers.utils.parseEther("0.1"),
    ticketCreditRateMantissa: "166666666666666",
    numberOfWinners: 1,
    splitExternalErc20Awards: false,
  };

  const tx = await builder.createYieldSourceMultipleWinners(
    yieldSourcePrizePoolConfig,
    multipleWinnersConfig,
    18
  );
  const prizePool = await ethers.getContractAt(
    "YieldSourcePrizePool",
    await getYieldSourcePrizePoolProxy(tx),
    snobHolder
  );

  green(`Created YieldSourcePrizePool ${prizePool.address}`);

  const prizeStrategy = await ethers.getContractAt(
    "MultipleWinners",
    await prizePool.prizeStrategy(),
    snobHolder
  );
  const ticketAddress = await prizeStrategy.ticket();
  const ticket = await ethers.getContractAt(
    "Ticket",
    ticketAddress,
    snobHolder
  );

  green(`SNOB adding as External Erc20`);
  await prizeStrategy.addExternalErc20Award(snob.address); 

  const depositAmount = toWei("1");

  dim(`Approving AVAX-SNOB PGL spend for ${snobHolder._address}...`);
  await pgl.approve(prizePool.address, depositAmount);
    dim(
      `Depositing into Pool with ${snobHolder._address}, ${depositAmount}, ${ticketAddress} ${ethers.constants.AddressZero}...`
    );
    await prizePool.depositTo(
      snobHolder._address,
      depositAmount,
      ticketAddress,
      ethers.constants.AddressZero
    );
    dim(
      `Prize Pool PGL balance: ${ethers.utils.formatEther(
        await snowballYieldSource.callStatic.balanceOfToken(prizePool.address)
      )}`
    );

    dim(`Wait 120 secs`);
    await delay(120000);

    dim(`Withdrawing...`);
    const pglBalanceBeforeWithdrawal = await pgl.balanceOf(
      snobHolder._address
    );
    await prizePool.withdrawInstantlyFrom(
      snobHolder._address,
      depositAmount,
      ticketAddress,
      depositAmount
    );
    const pglDiffAfterWithdrawal = (
      await pgl.balanceOf(snobHolder._address)
    ).sub(pglBalanceBeforeWithdrawal);
    dim(`Withdrew ${ethers.utils.formatEther(pglDiffAfterWithdrawal)} pgl`);

    dim(
      `Prize Pool pgl balance: ${ethers.utils.formatEther(
        await snowballYieldSource.callStatic.balanceOfToken(prizePool.address)
      )}`
    );

    await snowballYieldSource.harvest(prizePool.address, {gasLimit:181881});
    dim(`Yielded Snob: ${await snob.balanceOf(snowballYieldSource.address)}`)
    dim(`My Snob: ${await snob.balanceOf(SNOB_HOLDER)}`)

  //   now there should be some prize
    await prizePool.captureAwardBalance();
    console.log(
      `Prize is now: ${ethers.utils.formatEther(await prizePool.awardBalance())}`
    );

    await pgl.approve(prizePool.address, depositAmount);
    await prizePool.depositTo(
      snobHolder._address,
      depositAmount,
      await prizeStrategy.ticket(),
      ethers.constants.AddressZero
    );

    dim(`Starting award...`);
    await prizeStrategy.startAward();

    // hre.network.provider.send("evm_increaseTime", [301]);
    // await hre.network.provider.send("evm_mine", []);

    dim(`Completing award...`);
    const awardTx = await prizeStrategy.completeAward();
    const awardReceipt = await ethers.provider.getTransactionReceipt(
      awardTx.hash
    );
    const awardLogs = awardReceipt.logs.map((log) => {
      try {
        return prizePool.interface.parseLog(log);
      } catch (e) {
        return null;
      }
    });
    const strategyLogs = awardReceipt.logs.map((log) => {
      try {
        return prizeStrategy.interface.parseLog(log);
      } catch (e) {
        return null;
      }
    });

    console.log({ awardLogs })
    console.log({ strategyLogs })

    const awarded = awardLogs.find((event) => event && event.name === "Awarded");

    if (awarded) {
      console.log(
        `Awarded ${ethers.utils.formatEther(awarded.args.amount)} SNOB`
      );
    } else {
      console.log(`No prizes`);
    }

    const pglBalance = await pgl.balanceOf(snobHolder._address);
    const balance = await ticket.balanceOf(snobHolder._address);
    dim(`Users balance is ${ethers.utils.formatEther(balance)}`);
    await prizePool.withdrawInstantlyFrom(
      snobHolder._address,
      balance,
      ticketAddress,
      balance
    );

    const pglDiff = (await pgl.balanceOf(snobHolder._address)).sub(
      pglBalance
    );
    dim(`Amount withdrawn is ${ethers.utils.formatEther(pglDiff)}`);
    dim(`My Snob: ${await snob.balanceOf(SNOB_HOLDER)}`)
}

const delay = ms => new Promise(res => setTimeout(res, ms));

run();