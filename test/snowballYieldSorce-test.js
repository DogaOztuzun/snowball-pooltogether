const { ethers } = require("hardhat");
const { solidity } = require("ethereum-waffle");
const chai = require("chai");
chai.use(require('chai-as-promised'))

chai.use(solidity);

const toWei = ethers.utils.parseEther;
const toEth = ethers.utils.formatEther;
const { expect } = chai;

describe("SnowballYieldSource", function(){
  let snowglobe;
  let icequeen;
  let wallet;
  let wallet2;
  let yieldSource;
  let amount;

  let overrides = { gasLimit: 15000 };

  beforeEach(async function () {
    [wallet, wallet2, walletDev] = await ethers.getSigners();
    const ERC20MintableContract = await hre.ethers.getContractFactory(
      "ERC20Mintable",
      wallet
    );
    snowglobe = await ERC20MintableContract.deploy("snowglobe", "SG");

    const snowballTokenContract = await hre.ethers.getContractFactory(
      "Snowball",
      wallet
    );
    snowballToken = await snowballTokenContract.deploy();

    const IcequeenContract = await hre.ethers.getContractFactory(
      "IceQueen",
      wallet
    );
    icequeen = await IcequeenContract.deploy(snowglobe.address, walletDev.address, walletDev.address, 300000000000, 1, 1043700);

    const SnowballYieldSourceContract = await ethers.getContractFactory(
      "SnowballYieldSource"
    );
    yieldSource = await SnowballYieldSourceContract.deploy(
      snowglobe.address,
      icequeen.address,
      snowballToken.address,
      0
      );
    
    amount = toWei("1");
    amountFee = toWei("0.99");
    
    await snowglobe.mint(wallet.address, amount);
    await snowglobe.mint(wallet2.address, amount.mul(99));

    await icequeen.connect(wallet).add(100, snowglobe.address, false);

    await snowglobe.connect(wallet2).approve(icequeen.address, amount.mul(99));
    await icequeen.connect(wallet2).deposit(0, amount.mul(99));
  });

  it("get token address", async function () {
    let address = await yieldSource.depositToken();
    expect(address == snowglobe);
  });

  it("balanceOfToken", async function () {
    expect(await yieldSource.callStatic.balanceOfToken(wallet.address)).to.eq(
      0
    );

    await snowglobe.connect(wallet).approve(yieldSource.address, amount);
    await yieldSource.supplyTokenTo(amount, wallet.address);
    expect(await yieldSource.callStatic.balanceOfToken(wallet.address)).to.eq(
      amount
    );

    let userInfo = await icequeen.userInfo(0, yieldSource.address);
    expect(userInfo[0]).to.eq(amount); // balance
  });

  it("supplyTokenTo", async function () {
    await snowglobe.connect(wallet).approve(yieldSource.address, amount);
    await yieldSource.supplyTokenTo(amount, wallet.address);
    expect(await snowglobe.balanceOf(icequeen.address)).to.gt(amount.mul(100));
    expect(await yieldSource.callStatic.balanceOfToken(wallet.address)).to.eq(
      amount
    );
    
    let userInfo = await icequeen.userInfo(0, yieldSource.address);
    expect(userInfo[0]).to.eq(amount); // balance
  });

  it("redeemToken", async function () {
    await snowglobe.connect(wallet).approve(yieldSource.address, amount);
    await yieldSource.supplyTokenTo(amount, wallet.address);

    expect(await snowglobe.balanceOf(wallet.address)).to.eq(0);
    await yieldSource.redeemToken(amount);
    expect(await snowglobe.balanceOf(wallet.address)).to.eq(amount);
  });

  it("harvest", async function(){
    await snowglobe.connect(wallet).approve(yieldSource.address, amount);
    await yieldSource.supplyTokenTo(amount, wallet.address);

    expect(yieldSource.harvest(wallet.address)).to.not.eventually.be.rejected; //owner
    expect(yieldSource.connect(wallet2).harvest(wallet.address)).to.eventually.be.rejected; //not owner

    await snowballToken.mint(yieldSource.address, 100);
    await yieldSource.harvest(wallet2.address);
    
    expect(await snowballToken.balanceOf(wallet2.address)).to.eq(90); //reward
    expect(await snowballToken.balanceOf(wallet.address)).to.eq(10); //dev fee
  });

  it("setDevFundDivRate", async () => {
    expect(await yieldSource.devFundDivRate()).to.be.eq(10);

    await yieldSource.setDevFundDivRate(20);
    expect(await yieldSource.devFundDivRate()).to.be.eq(20);
    expect(yieldSource.connect(wallet2).setDevFundDivRate(30)).to.eventually.be.rejected; //not owner
    expect(await yieldSource.devFundDivRate()).to.be.eq(20);
  });

  it("updateDevfund", async () => {
    expect(await yieldSource.devfund()).to.be.eq(wallet.address);

    await yieldSource.updateDevfund(wallet2.address);
    expect(await yieldSource.devfund()).to.be.eq(wallet2.address);

    expect(yieldSource.updateDevfund(wallet.address)).to.eventually.be.rejected; //not devFund

    await yieldSource.connect(wallet2).updateDevfund(wallet.address);
    expect(await yieldSource.devfund()).to.be.eq(wallet.address);
  })
});