// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile 
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  let gauge = "0x472075680e16d34aba24ce9a6ddb59f27995906a"
  let poolToken = "0xA42BE3dB9aff3aee48167b240bFEE5e1697e1281"
  let snob = "0xC38f41A296A4493Ff429F1238e030924A1542e50"
  const SnowballYieldSourceContract = await hre.ethers.getContractFactory("SnowballYieldSource");
  const snowballYieldSource = await SnowballYieldSourceContract.deploy(poolToken, gauge, snob);

  await snowballYieldSource.deployed();

  console.log("SnowballYieldSource deployed to:", snowballYieldSource.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
