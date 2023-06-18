require("dotenv").config({ path: ".env" });
import "@nomiclabs/hardhat-ethers"
import "@nomicfoundation/hardhat-toolbox";

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
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    mumbai: {
      url: `${process.env.MUMBAI_PROVIDER_URL}`,
      accounts: [process.env.MUMBAI_PRIVATE_KEY],
    },
  },
  settings: {
    optimizer: { enabled: true, runs: 200, details: { yul: false } },
  },
};
