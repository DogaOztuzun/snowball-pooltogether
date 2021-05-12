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
  let icequeen = "0x041EE186982159da50Cc8A3A87B5eC669Db0b758"
  let avaxSnobLP = "0xf91BD10B18B45262A324883FbDB2Ea21d66ca938"
  let snob = "0xf319e2f610462f846d6e93f51cdc862eeff2a554"
  const SnowballYieldSourceContract = await hre.ethers.getContractFactory("SnowballYieldSource");
  const snowballYieldSource = await SnowballYieldSourceContract.deploy(avaxSnobLP, icequeen, snob, 1);

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
