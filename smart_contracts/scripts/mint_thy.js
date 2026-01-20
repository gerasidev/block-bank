const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    // 1. Get the address to mint to (default to first borrower if none provided)
    const signers = await hre.ethers.getSigners();
    const recipient = process.env.RECIPIENT || signers[3].address; // Default to Borrower 1
    const amount = process.env.AMOUNT || "1000";

    // 2. Load addresses
    const addressesPath = path.join(__dirname, "../deploy_addresses.json");
    if (!fs.existsSync(addressesPath)) {
        console.error("No deployment addresses found. Please run deploy_local.js first.");
        return;
    }
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf-8"));

    // 3. Get Contract
    const ThyseasToken = await hre.ethers.getContractAt("ThyseasToken", addresses.ThyseasToken);

    // 4. Mint
    console.log(`Minting ${amount} THY to ${recipient}...`);
    const tx = await ThyseasToken.mint(recipient, hre.ethers.parseUnits(amount, 18));
    await tx.wait();

    console.log("Success! Balance for", recipient, "is now:",
        hre.ethers.formatUnits(await ThyseasToken.balanceOf(recipient), 18), "THY");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
