require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require('hardhat-dependency-compiler');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("balances", "Prints the list of AVAX account balances", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    balance = await ethers.provider.getBalance(account.address);
    console.log(account.address, "has balance", balance.toString());
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.6.12",
    settings: {
      outputSelection: {
        "*": {
          "*": ["storageLayout"],
        },
      },
    }
  },
  dependencyCompiler: {
    paths: [
      "@pooltogether/pooltogether-contracts/contracts/builders/PoolWithMultipleWinnersBuilder.sol",
      "@pooltogether/pooltogether-contracts/contracts/registry/Registry.sol",
      "@pooltogether/pooltogether-contracts/contracts/prize-pool/compound/CompoundPrizePoolProxyFactory.sol",
      "@pooltogether/pooltogether-contracts/contracts/prize-pool/yield-source/YieldSourcePrizePoolProxyFactory.sol",
      "@pooltogether/pooltogether-contracts/contracts/prize-pool/stake/StakePrizePoolProxyFactory.sol",
      "@pooltogether/pooltogether-contracts/contracts/builders/MultipleWinnersBuilder.sol",
      "@pooltogether/pooltogether-contracts/contracts/prize-strategy/multiple-winners/MultipleWinnersProxyFactory.sol",
      "@pooltogether/pooltogether-contracts/contracts/builders/ControlledTokenBuilder.sol",
      "@pooltogether/pooltogether-contracts/contracts/token/ControlledTokenProxyFactory.sol",
      "@pooltogether/pooltogether-contracts/contracts/token/TicketProxyFactory.sol",
    ]
  },
  networks: {
    hardhat: {
      gasPrice: 225000000000,
      chainId: 43112,
    },
    avash: {
      url: 'http://localhost:9650/ext/bc/C/rpc',
      gasPrice: 225000000000,
      chainId: 43112,
      accounts: [
        "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027",
        "0x7b4198529994b0dc604278c99d153cfd069d594753d471171a1d102a10438e07",
        "0x15614556be13730e9e8d6eacc1603143e7b96987429df8726384c2ec4502ef6e",
        "0x31b571bf6894a248831ff937bb49f7754509fe93bbd2517c9c73c4144c0e97dc",
        "0x6934bef917e01692b789da754a0eae31a8536eb465e7bff752ea291dad88c675",
        "0xe700bdbdbc279b808b1ec45f8c2370e4616d3a02c336e68d85d4668e08f53cff",
        "0xbbc2865b76ba28016bc2255c7504d000e046ae01934b04c694592a6276988630",
        "0xcdbfd34f687ced8c6968854f8a99ae47712c4f4183b78dcc4a903d1bfe8cbf60",
        "0x86f78c5416151fe3546dece84fda4b4b1e36089f2dbc48496faf3a950f16157c",
        "0x750839e9dbbd2a0910efe40f50b2f3b2f2f59f5580bb4b83bd8c1201cf9a010a"
      ]
    },
    fuji: {
      url: 'https://api.avax-test.network/ext/bc/C/rpc',
      gasPrice: 225000000000,
      chainId: 43113,
      accounts: {
      }
    },
    mainnet: {
      url: 'https://api.avax.network/ext/bc/C/rpc',
      gasPrice: 225000000000,
      chainId: 43114,
      accounts: []
    }
  }
};

