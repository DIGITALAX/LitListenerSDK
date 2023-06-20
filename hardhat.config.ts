require("dotenv").config({ path: ".env" });
require("@nomicfoundation/hardhat-toolbox");
import "@nomiclabs/hardhat-ethers";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.9",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 31337,
      mining: {
        auto: true,
        interval: 5000,
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
  settings: {
    optimizer: { enabled: true, runs: 200, details: { yul: false } },
  },
  mocha: {
    timeout: 3200000, // Timeout value in milliseconds
  },
};
