const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Starting Full Seeding Script...");

    // 1. Get Accounts
    const signers = await hre.ethers.getSigners();
    const deployer = signers[0];
    const lender1 = signers[1];
    const lender2 = signers[2];

    console.log(`Deployer: ${deployer.address}`);

    // 2. Deploy Contracts
    // 2a. Thyseas Token (The output of the bank)
    const ThyseasToken = await hre.ethers.getContractFactory("ThyseasToken");
    const thyseasToken = await ThyseasToken.deploy();
    await thyseasToken.waitForDeployment();
    const thyseasAddress = await thyseasToken.getAddress();
    console.log(`Thyseas Token deployed to: ${thyseasAddress}`);

    // 2b. Thyseas RWA (Collateral)
    const ThyseasRWA = await hre.ethers.getContractFactory("ThyseasRWA");
    const thyseasRWA = await ThyseasRWA.deploy();
    await thyseasRWA.waitForDeployment();
    const rwaAddress = await thyseasRWA.getAddress();
    console.log(`Thyseas RWA deployed to: ${rwaAddress}`);

    // 2c. Mock BTC (The "Other" Asset)
    const MockBTC = await hre.ethers.getContractFactory("MockBTC");
    const mockBTC = await MockBTC.deploy();
    await mockBTC.waitForDeployment();
    const btcAddress = await mockBTC.getAddress();
    console.log(`Mock BTC deployed to: ${btcAddress}`);

    // 2d. Lending Vault
    const LendingVault = await hre.ethers.getContractFactory("LendingVault");
    const lendingVault = await LendingVault.deploy(thyseasAddress, rwaAddress);
    await lendingVault.waitForDeployment();
    const vaultAddress = await lendingVault.getAddress();
    console.log(`Lending Vault deployed to: ${vaultAddress}`);

    // 3. Setup Permissions & Minting
    console.log("Setting up permissions...");
    // Allow Vault to mint Thyseas Tokens (It needs to print money when lending!)
    await thyseasToken.setVault(vaultAddress);
    console.log("Vault authorized to mint Thyseas Tokens");

    // 4. SEEDING THE BANK

    // 4a. Seed ETH Liquidity (Base Reserve)
    // Admin seeds 10 ETH
    await lendingVault.connect(deployer).seedCapital({ value: hre.ethers.parseEther("10") });
    console.log("Seeded 10 ETH from Admin");

    // Lender1 deposits 50 ETH
    await lendingVault.connect(lender1).depositLiquidity({ value: hre.ethers.parseEther("50") });
    console.log("Lender1 deposited 50 ETH");

    // 4b. Seed BTC (Mock)
    // Transfer 100 BTC to Vault (Simulating Bank holding BTC assets)
    // Note: ERC20 transfer, not 'deposit' function on vault unless vault accepts ERC20 deposits.
    // For now, we just send it to the address so the balance shows up.
    const btcAmount = hre.ethers.parseUnits("100", 18); // 100 BTC
    await mockBTC.transfer(vaultAddress, btcAmount);
    console.log("Transferred 100 MockBTC to Vault");

    // 4c. Seed Thyseas Tokens (The Bank's own currency reserve if needed, though it Mints on demand)
    // Let's mint some to the vault directly just in case.
    await thyseasToken.mint(vaultAddress, hre.ethers.parseUnits("1000000", 18));
    console.log("Minted 1,000,000 THY to Vault directly");

    // 5. Setup Auditors
    await lendingVault.setAuditor(deployer.address, true);
    await lendingVault.setAuditor(lender1.address, true);
    await lendingVault.setAuditor(lender2.address, true); // 3 auditors
    console.log("Auditors set up (Deployer, Lender1, Lender2)");

    // 6. Save Deployment Info
    const config = {
        VAULT_ADDRESS: vaultAddress,
        TOKEN_ADDRESS: thyseasAddress,
        RWA_ADDRESS: rwaAddress,
        BTC_ADDRESS: btcAddress,
        NETWORK: hre.network.name
    };

    fs.writeFileSync(
        path.join(__dirname, "../deploy_addresses.json"),
        JSON.stringify(config, null, 2)
    );
    console.log("Addresses saved to deploy_addresses.json");

    // 7. Verify Balances
    const vaultEthBal = await hre.ethers.provider.getBalance(vaultAddress);
    const vaultBtcBal = await mockBTC.balanceOf(vaultAddress);
    const vaultThyBal = await thyseasToken.balanceOf(vaultAddress);

    console.log("--- FINAL BANK STATUS ---");
    console.log(`ETH Liquidity: ${hre.ethers.formatEther(vaultEthBal)} ETH`);
    console.log(`BTC Assets: ${hre.ethers.formatUnits(vaultBtcBal, 18)} BTC`);
    console.log(`THY Reserves: ${hre.ethers.formatUnits(vaultThyBal, 18)} THY`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
