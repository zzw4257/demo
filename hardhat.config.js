require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true,
      metadata: {
        bytecodeHash: "none"
      }
    }
  },
  networks: {
    // 本地Hardhat网络（用于开发）
    hardhat: {
      chainId: 1337,
      gas: 8000000,
      gasPrice: 20000000000, // 20 gwei
      blockGasLimit: 8000000,
      allowUnlimitedContractSize: true,
      // 预设账户（方便前端连接）
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
        passphrase: ""
      }
    },
    // 本地部署网络
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
      gas: 8000000,
      gasPrice: 20000000000,
      timeout: 60000
    },
    // Sepolia测试网
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: 20000000000
    }
  },
  // Gas报告配置
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  },
  // Etherscan验证配置
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  // 路径配置
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
