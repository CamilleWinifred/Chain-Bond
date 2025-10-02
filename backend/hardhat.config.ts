import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-deploy";
import type { HardhatUserConfig } from "hardhat/config";

const MNEMONIC = process.env.MNEMONIC || "test test test test test test test test test test test junk";
const INFURA_API_KEY = process.env.INFURA_API_KEY || "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || (process.env.INFURA_API_KEY ? `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}` : "https://rpc.sepolia.org");

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: { deployer: 0 },
  networks: {
    hardhat: {
      accounts: { mnemonic: MNEMONIC },
      chainId: 31337,
    },
    localhost: {
      accounts: { mnemonic: MNEMONIC },
      chainId: 31337,
      url: "http://localhost:8545",
    },
    sepolia: {
      accounts: { mnemonic: MNEMONIC, path: "m/44'/60'/0'/0/", count: 10 },
      chainId: 11155111,
      url: SEPOLIA_RPC_URL,
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
    deployments: "./deployments",
  },
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: { enabled: true, runs: 800 },
      evmVersion: "cancun",
    },
  },
  typechain: { outDir: "types", target: "ethers-v6" },
};

export default config;


