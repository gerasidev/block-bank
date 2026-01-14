const hre = require("hardhat");

async function main() {
    console.log("--- STARTING MULTISIG SIMULATION ---\n");

    const [deployer, borrower, auditor1, auditor2, auditor3, nonAuditor] = await hre.ethers.getSigners();

    console.log("Simulating with the following actors:");
    console.log(`- Deployer (Admin): ${deployer.address}`);
    console.log(`- Borrower:         ${borrower.address}`);
    console.log(`- Auditor 1:        ${auditor1.address}`);
    console.log(`- Auditor 2:        ${auditor2.address}`);
    console.log(`- Auditor 3:        ${auditor3.address}`);
    console.log(`- Stranger:         ${nonAuditor.address}\n`);

    // 2. Deploy Contracts
    console.log("--- DEPLOYING CONTRACTS ---");
    const Token = await hre.ethers.getContractFactory("ThyseasToken");
    const thyseasToken = await Token.deploy();
    await thyseasToken.waitForDeployment();
    console.log(`ThyseasToken deployed to: ${await thyseasToken.getAddress()}`);

    const RWA = await hre.ethers.getContractFactory("ThyseasRWA");
    const rwaContract = await RWA.deploy();
    await rwaContract.waitForDeployment();
    console.log(`ThyseasRWA deployed to: ${await rwaContract.getAddress()}`);

    const Vault = await hre.ethers.getContractFactory("LendingVault");
    const lendingVault = await Vault.deploy(await thyseasToken.getAddress(), await rwaContract.getAddress());
    await lendingVault.waitForDeployment();
    console.log(`LendingVault deployed to: ${await lendingVault.getAddress()}\n`);

    // 3. Setup: Grant Minter Role to Vault & Add Auditors
    await thyseasToken.grantRole(await thyseasToken.MINTER_ROLE(), await lendingVault.getAddress());

    console.log("--- SETTING UP PERMISSIONS ---");
    console.log("Adding Auditor 1...");
    await lendingVault.connect(deployer).setAuditor(auditor1.address, true);
    console.log("Adding Auditor 2...");
    await lendingVault.connect(deployer).setAuditor(auditor2.address, true);
    console.log("Adding Auditor 3...");
    await lendingVault.connect(deployer).setAuditor(auditor3.address, true);
    console.log("Permissions set.\n");

    // 4. Create a Loan Request
    console.log("--- BORROWER REQUESTING LOAN ---");

    // Mint RWA (Valuation = $10k instead of $100k so we can fund it with local ETH)
    await rwaContract.mintAsset(
        borrower.address,
        "ipfs://test-metadata",
        "Super Computer Cluster",
        hre.ethers.parseEther("10000"), // $10,000 Value
        0,       // Hardware
        "SN-12345"
    );
    const tokenId = 0;

    // Borrower approves Vault
    await rwaContract.connect(borrower).approve(await lendingVault.getAddress(), tokenId);

    // Request $50k loan (50,000 THY)
    // Max loan = 10k * 10 = 100k. 50k is safe.
    const loanAmount = hre.ethers.parseEther("50000");
    await lendingVault.connect(borrower).requestLoan(tokenId, loanAmount, 500); // 5% interest

    const loanId = 0;
    console.log(`Loan #${loanId} created for ${hre.ethers.formatEther(loanAmount)} THY.\n`);

    // 5. The Multisig Simulation
    console.log("--- BEGINNING MULTISIG APPROVAL PROCESS ---");

    let loan = await lendingVault.loans(loanId);
    console.log(`Current Approvals: ${loan.approvalCount}/3`);

    // STEP A: Auditor 1 Approves
    console.log("\n-> Auditor 1 is signing...");
    await lendingVault.connect(auditor1).approveLoan(loanId);

    loan = await lendingVault.loans(loanId);
    console.log(`Current Approvals: ${loan.approvalCount}/3`);

    // STEP B: Unhappy Path
    console.log("\n-> Stranger (Non-Auditor) is trying to sign...");
    try {
        await lendingVault.connect(nonAuditor).approveLoan(loanId);
    } catch (error) {
        console.log("   [SUCCESS] Stranger was blocked: " + (error.message.split("revert")[1]?.trim() || "Reverted"));
    }

    // STEP C: Auditor 2 Approves
    console.log("\n-> Auditor 2 is signing...");
    await lendingVault.connect(auditor2).approveLoan(loanId);

    loan = await lendingVault.loans(loanId);
    console.log(`Current Approvals: ${loan.approvalCount}/3`);

    // STEP D: Auditor 3 Approves
    console.log("\n-> Auditor 3 is signing...");
    await lendingVault.connect(auditor3).approveLoan(loanId);

    loan = await lendingVault.loans(loanId);
    console.log(`Current Approvals: ${loan.approvalCount}/3`);
    console.log("   THRESHOLD REACHED! Loan is ready for release.\n");

    // 6. Release Funds
    console.log("--- RELEASING FUNDS ---");
    // Reserve needed = Loan / 10 = 5,000.
    const reserveAmount = hre.ethers.parseEther("5000");
    await lendingVault.connect(deployer).depositLiquidity({ value: reserveAmount });
    console.log(`Bank Reserve deposited: ${hre.ethers.formatEther(reserveAmount)} ETH`);

    await lendingVault.connect(deployer).releaseFunds(loanId);

    const borrowerBalance = await thyseasToken.balanceOf(borrower.address);
    console.log(`\nLOAN RELEASED!`);
    console.log(`Borrower Balance: ${hre.ethers.formatEther(borrowerBalance)} THY`);

    console.log("\n--- SIMULATION COMPLETE ---");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
