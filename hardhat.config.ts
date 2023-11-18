import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const fallbackMnemonic = "test test test test test test test test test test test junk";
const fallbackRpc = "http://localhost:8545";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.22",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 1000000
      }
    }
  },
  networks: {
    hardhat: {
      forking: {
        enabled: true,
        url: process.env.GOERLI_URL || fallbackRpc,
        blockNumber: 10066325
      },
      accounts: {
        mnemonic: process.env.MNEMONIC || fallbackMnemonic
      }
    },
    goerli: {
      url: process.env.GOERLI_URL || fallbackRpc,
      accounts: {
        mnemonic: process.env.MNEMONIC || fallbackMnemonic
      }
    },
    mainnet: {
      url: process.env.MAINNET_URL || fallbackRpc,
      accounts: {
        mnemonic: process.env.MNEMONIC || fallbackMnemonic
      }
    },
  },
  etherscan: {
    apiKey: {
      goerli: process.env.ETHERSCAN_API_KEY as string,
      mainnet: process.env.ETHERSCAN_API_KEY as string,
      sepolia: process.env.ETHERSCAN_API_KEY as string,
    }
  },
};
