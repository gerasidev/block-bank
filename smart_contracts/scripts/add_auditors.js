const hre = require("hardhat");

async function main() {
    // Address from AuditorDashboard.tsx
    const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // Ensure this matches your deployment!

    const signers = await hre.ethers.getSigners();
    const deployer = signers[0];
    const auditor2 = signers[1];
    const auditor3 = signers[2];

    console.log("--- SETUP AUDITORS ---");
    console.log("Connecting to LendingVault at:", CONTRACT_ADDRESS);
    console.log("Deployer (Admin):", deployer.address);

    const LendingVault = await hre.ethers.getContractFactory("LendingVault");
    const vault = LendingVault.attach(CONTRACT_ADDRESS);

    // Verify connection
    try {
        const isDeployerAuditor = await vault.auditors(deployer.address);
        console.log(`Is Deployer (${deployer.address}) an auditor? ${isDeployerAuditor}`);
    } catch (e) {
        console.error("Error connecting to contract. Make sure your local node is running and the address is correct.");
        console.error(e);
        return;
    }

    // Add Auditor 2
    console.log(`\nAdding Account #1 (${auditor2.address}) as auditor...`);
    let tx = await vault.setAuditor(auditor2.address, true);
    await tx.wait();
    console.log("Confirmed.");

    // Add Auditor 3
    console.log(`Adding Account #2 (${auditor3.address}) as auditor...`);
    tx = await vault.setAuditor(auditor3.address, true);
    await tx.wait();
    console.log("Confirmed.");

    console.log("\n--- AUDITORS READY ---");
    console.log("You can now approve loans with:");
    console.log("1. Account #0 (Deployer)");
    console.log("2. Account #1");
    console.log("3. Account #2");
    console.log("\nImport these private keys into MetaMask if you haven't (Default Hardhat Keys):");
    console.log("Account #1 PK: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
    console.log("Account #2 PK: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
