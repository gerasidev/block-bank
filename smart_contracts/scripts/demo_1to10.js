const hre = require("hardhat");

async function main() {
    const signers = await hre.ethers.getSigners();
    const [deployer, lender] = signers;
    const borrowers = signers.slice(2, 12); // Get 10 borrowers

    console.log("--- STARTING 1-TO-10 CREDIT EXPANSION DEMO ---");
    console.log("System Operator:", deployer.address);
    console.log("The Lender (Reserve Provider):", lender.address);

    // 1. Deploy Contracts
    const ThyseasToken = await hre.ethers.getContractFactory("ThyseasToken");
    const token = await ThyseasToken.deploy();
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();

    const ThyseasRWA = await hre.ethers.getContractFactory("ThyseasRWA");
    const rwa = await ThyseasRWA.deploy();
    await rwa.waitForDeployment();
    const rwaAddress = await rwa.getAddress();

    const LendingVault = await hre.ethers.getContractFactory("LendingVault");
    const vault = await LendingVault.deploy(tokenAddress, rwaAddress);
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();

    // 2. Setup Permissions
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, vaultAddress);

    // 3. SEED THE RESERVE (The "1" in 1-to-10)
    // Lender deposits 1 ETH into the bank
    const depositAmount = hre.ethers.parseEther("1.0");
    await vault.connect(lender).depositLiquidity({ value: depositAmount });
    console.log(`\n[BANK] Reserve Seeded with: 1.0 ETH`);
    console.log(`[BANK] Theoretical Credit Capacity: 10.0 $THY\n`);

    // 4. MINT ASSETS & REQUEST LOANS (The "10" in 1-to-10)
    // To borrow 1 $THY (10^18 units), and with 10x leverage, 
    // the asset valuation must be at least 0.1 (10^17).
    // Let's use a valuation of 10^18 to be safe (1:1 collateral vs loan, 
    // but the BANK level is where the 1:10 happens).
    const unitValuation = hre.ethers.parseUnits("1", 18);
    const loanAmountPerBorrower = hre.ethers.parseUnits("1", 18); // 1 $THY

    for (let i = 0; i < borrowers.length; i++) {
        const borrower = borrowers[i];

        // A. Admin mints an RWA NFT
        await rwa.mintAsset(
            borrower.address,
            "ipfs://proof",
            `Collateral Node #${i + 1}`,
            unitValuation,
            0, // Hardware
            "Factory Zero"
        );

        // B. Borrower approves vault 
        await rwa.connect(borrower).approve(vaultAddress, i);

        // C. Borrower requests loan
        await vault.connect(borrower).requestLoan(i, loanAmountPerBorrower, 500);

        console.log(`Borrower ${i + 1} (${borrower.address.substring(0, 6)}) requested 1 $THY.`);

        // D. Admin releases the funds
        await vault.approveLoan(i);
        await vault.releaseFunds(i);
        console.log(`Vault released 1 $THY to Borrower ${i + 1}.`);
    }

    // 5. FINAL SUMMARY
    const totalCirculating = await token.totalSupply();
    const vaultReserve = await hre.ethers.provider.getBalance(vaultAddress);

    console.log("\n--- DEMO COMPLETE ---");
    console.log("🏦 Actual Reserve (ETH in Vault):", hre.ethers.formatEther(vaultReserve), "ETH");
    console.log("🪙 Issued Credit (Total $THY Minted):", hre.ethers.formatUnits(totalCirculating, 18), "$THY");
    console.log("---------------------------------------");
    console.log("RESULT: The Bank turned 1.0 ETH of 'Hard' reserve into 10.0 $THY of 'Economic' credit.");
    console.log("TRUST LEVEL: 100% (Backed by 10 separate physical assets & trusted individuals).");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
