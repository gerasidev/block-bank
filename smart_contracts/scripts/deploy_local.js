const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const signers = await hre.ethers.getSigners();
    const mnemonic = "test test test test test test test test test test test junk";

    console.log("--- ACCOUNT CHEAT SHEET (For MetaMask) ---");

    // Function to get account info including private key
    const getAccountInfo = (index) => {
        const wallet = hre.ethers.HDNodeWallet.fromPhrase(mnemonic, `m/44'/60'/0'/0/${index}`);
        return {
            address: wallet.address,
            privateKey: wallet.privateKey
        };
    };

    const auditorAccounts = [0, 1, 2].map(i => ({ role: `Auditor ${i + 1}`, ...getAccountInfo(i) }));
    const borrowerAccounts = [3, 4, 5].map(i => ({ role: `Borrower ${i - 2}`, ...getAccountInfo(i) }));

    [...auditorAccounts, ...borrowerAccounts].forEach(acc => {
        console.log(`[${acc.role}]`);
        console.log(`  Address:    ${acc.address}`);
        console.log(`  PrivateKey: ${acc.privateKey}`);
        console.log("");
    });

    const [deployer, lender] = signers;
    const borrowers = signers.slice(3, 6);

    console.log("--- SETTING UP PERSISTENT LOCAL BANK ---");

    console.log("System Operator (Auditor 1):", deployer.address);
    console.log("Lender (Reserve Provider):", lender.address);

    // 1. Deploy Contracts
    const ThyseasToken = await hre.ethers.getContractFactory("ThyseasToken");
    const token = await ThyseasToken.deploy();
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();

    const ThyseasRWA = await hre.ethers.getContractFactory("ThyseasRWA");
    const rwa = await ThyseasRWA.deploy();
    await rwa.waitForDeployment();
    const rwaAddress = await rwa.getAddress();

    // 1c. Deploy Mock BTC
    const MockBTC = await hre.ethers.getContractFactory("MockBTC");
    const mockBTC = await MockBTC.deploy();
    await mockBTC.waitForDeployment();
    const btcAddress = await mockBTC.getAddress();

    const LendingVault = await hre.ethers.getContractFactory("LendingVault");
    const vault = await LendingVault.deploy(tokenAddress, rwaAddress);
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();

    // 2. Setup Permissions
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, vaultAddress);

    // Setup Auditors (Use the first 3 accounts as auditors for testing)
    const auditor1 = signers[0];
    const auditor2 = signers[1];
    const auditor3 = signers[2];

    await vault.setAuditor(auditor2.address, true);
    await vault.setAuditor(auditor3.address, true);

    console.log("\nAuditors Initialized:");
    console.log("- Auditor 1:", auditor1.address);
    console.log("- Auditor 2:", auditor2.address);
    console.log("- Auditor 3:", auditor3.address);

    // 3. SEED THE RESERVE

    // 3a. ETH Liquidity
    // 3a. ETH Liquidity (Base Reserve)
    const depositAmount = hre.ethers.parseEther("1000.0"); // Liquidity from Lender (Big Seed)
    // 30 days lock (2592000 seconds)
    await vault.connect(lender).depositLiquidity(2592000, { value: depositAmount });
    console.log(`\n[BANK] Reserve Seeded with: 1000.0 ETH (Lender Deposit, 30d Lock)`);

    // 3b. Admin Capital (ETH)
    // 3b. Admin Capital (ETH)
    const seedAmount = hre.ethers.parseEther("100.0");
    await vault.seedCapital({ value: seedAmount });
    console.log(`[BANK] Admin Capital Seeded with: 100.0 ETH (Equity Injection)`);

    // 3c. Seed BTC (Mock)
    // 3c. Seed BTC (Mock - Asset Holding)
    const btcSeedAmount = hre.ethers.parseUnits("1000", 18);
    await mockBTC.transfer(vaultAddress, btcSeedAmount);
    console.log(`[BANK] Assets Seeded with: 1000.0 MockBTC`);

    // 3d. Seed Thyseas Tokens (Initial Bank Supply)
    const thySeedAmount = hre.ethers.parseUnits("5000000", 18);
    await token.mint(vaultAddress, thySeedAmount);
    console.log(`[BANK] Currency Reserves Seeded: 5,000,000 THY`);

    const finalBalance = await hre.ethers.provider.getBalance(vaultAddress);
    console.log(`[BANK] Total Vault Balance: ${hre.ethers.formatEther(finalBalance)} ETH`);

    // 4. SAVE ADDRESSES FOR FRONTEND
    const config = {
        ThyseasToken: tokenAddress,
        ThyseasRWA: rwaAddress,
        LendingVault: vaultAddress,
        MockBTC: btcAddress // Added MockBTC to config
    };

    // Save to a shared location if needed, or just log
    console.log("\n--- DEPLOYMENT COMPLETE ---");
    console.log(JSON.stringify(config, null, 2));

    // Save to a file that the frontend can eventually read or just for reference
    fs.writeFileSync(
        path.join(__dirname, "../deploy_addresses.json"),
        JSON.stringify(config, null, 2)
    );

    console.log("\nReady for manual interaction. Loans will NOT be auto-approved.");
    console.log("Use the Auditor Dashboard to see and approve requests.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
