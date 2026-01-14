require("@nomicfoundation/hardhat-ethers");
require("dotenv").config({ path: "../.env" }); // Load from parent directory .env

const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
    console.error("Please set your PRIVATE_KEY in a .env file");
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.20",
    networks: {
        hardhat: {
            accounts: {
                mnemonic: "test test test test test test test test test test test junk",
                path: "m/44'/60'/0'/0",
                initialIndex: 0,
                count: 20,
            },
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            accounts: {
                mnemonic: "test test test test test test test test test test test junk",
            },
        },
        sepolia: {
            url: "https://ethereum-sepolia-rpc.publicnode.com",
            accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
        }
    }
};

