const hre = require("hardhat");

async function main() {
    console.log("Seeding existing vault with liquidity...");

    const addresses = require("../deploy_addresses.json");
    const VAULT_ADDRESS = addresses.LendingVault;

    const [signer] = await hre.ethers.getSigners();
    console.log("Using signer:", signer.address);

    const LendingVault = await hre.ethers.getContractAt("LendingVault", VAULT_ADDRESS);

    // 30 days in seconds
    const lockDuration = 30 * 24 * 60 * 60;

    // Deposit 200 ETH
    const amount = hre.ethers.parseEther("200");
    console.log(`Depositing ${hre.ethers.formatEther(amount)} ETH with lock duration ${lockDuration}...`);

    const tx = await LendingVault.connect(signer).depositLiquidity(lockDuration, {
        value: amount
    });

    await tx.wait();

    console.log("Deposited 200 ETH liquidity successfully.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
