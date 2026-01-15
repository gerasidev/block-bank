const hre = require("hardhat");
const fs = require("fs");

async function main() {
    const deployments = JSON.parse(fs.readFileSync("deploy_addresses.json", "utf8"));
    const vaultAddress = deployments.LendingVault;

    const LendingVault = await hre.ethers.getContractFactory("LendingVault");
    const vault = LendingVault.attach(vaultAddress);

    const seedAmount = hre.ethers.parseEther("10"); // Seed with 10 ETH

    console.log(`Seeding Vault at ${vaultAddress} with ${hre.ethers.formatEther(seedAmount)} ETH...`);

    const tx = await vault.seedCapital({ value: seedAmount });
    await tx.wait();

    console.log("Seeding complete!");

    // Verify balance
    const balance = await hre.ethers.provider.getBalance(vaultAddress);
    console.log(`Vault now holds: ${hre.ethers.formatEther(balance)} ETH`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
