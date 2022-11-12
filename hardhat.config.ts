import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "hardhat-gas-reporter";
import { resolve } from "path";
import { config as dotenvConfig } from "dotenv";
import { NetworkUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ganache";
import "./tasks/index";

dotenvConfig({ path: resolve(__dirname, "./.env") });

const chainIds = {
  hardhat: 7545,
  mumbai: 80001,
  goerli: 5,
};

// Ensure that we have all the environment variables we need.
const mnemonic = process.env.PRIVATE_KEY;
if (!mnemonic) {
  throw new Error("Please set your PRIVATE_KEY in a .env file");
}

function getChainConfig(network: keyof typeof chainIds): NetworkUserConfig {
  let url = "";
  if (network == "hardhat") {
    return {
      accounts: [`${process.env.PRIVATE_KEY}`],
      chainId: chainIds[network],
    };
  }
  if (network == "mumbai") {
    url = process.env.MUMBAI_RPC ? process.env.MUMBAI_RPC : "	https://heimdall.api.matic.today";
  } else if (network == "goerli") {
    url = process.env.GOERLI_RPC ? process.env.GOERLI_RPC : "https://rpc.ankr.com/eth_goerli";
  }
  return {
    // accounts: {
    //   count: 10,
    //   mnemonic,
    //   path: "m/44'/60'/0'/0",
    //   initialIndex:2,
    // },
    accounts: [`${process.env.PRIVATE_KEY}`],
    chainId: chainIds[network],
    url,
    // gasPrice: 200000000000,
    // gasPrice: 450_000_000_000
  };
}

const config = {
  defaultNetwork: "hardhat",
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
    src: "./contracts",
  },
  networks: {
    hardhat: {
      accounts: [
        {
          privateKey: mnemonic,
          balance: "1000000000000000000000",
        },
        {
          // Dummy key
          privateKey: "acf5f38cf11255e3c3559897fb6bc315e5238358c1acb3143d42a0e2bd6210c7",
          balance: "1000000000000000000000",
        },
        {
          // Dummy key
          privateKey: "8a642372a4244124b99fa5cfd932a230cdbb3c1aefe7fd9e8ad824bb5e00feaf",
          balance: "1000000000000000000000",
        },
      ],
      chainId: chainIds.hardhat,
      mining: {
        auto: true,
        interval: 100,
      },
    },

    mumbai: getChainConfig("mumbai"),
    goerli: getChainConfig("goerli"),
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
    // deploy: "./deploy",
    deployments: "./deployments",
    // imports: "./imports",
  },
  solidity: {
    version: "0.8.10",
    settings: {
      evmVersion: "berlin",
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/solidity-template/issues/31
        bytecodeHash: "none",
      },
      // You should disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 50,
      },
    },
  },

  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  namedAccounts: {
    deployer: 0,
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.POLYGONSCAN_API_KEY,
      goerli: process.env.ETHERSCAN_API_KEY,
    },
  },
};

export default config;
