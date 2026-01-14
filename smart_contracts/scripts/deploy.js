const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying $THYSEAS Banking Hub with account:", deployer.address);

    // 1. Deploy Stablecoin ($THYSEAS)
    const ThyseasToken = await hre.ethers.getContractFactory("ThyseasToken");
    const token = await ThyseasToken.deploy();
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("1. $THYSEAS Token deployed to:", tokenAddress);

    // 2. Deploy RWA (Collateral: Robots & Real Estate)
    const ThyseasRWA = await hre.ethers.getContractFactory("ThyseasRWA");
    const rwa = await ThyseasRWA.deploy();
    await rwa.waitForDeployment();
    const rwaAddress = await rwa.getAddress();
    console.log("2. ThyseasRWA deployed to:", rwaAddress);

    // 3. Deploy Vault (The Bank)
    const LendingVault = await hre.ethers.getContractFactory("LendingVault");
    const vault = await LendingVault.deploy(tokenAddress, rwaAddress);
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log("3. LendingVault (The Bank) deployed to:", vaultAddress);

    // 4. Permissions Setup
    // Grant Vault authority to mint $THYSEAS tokens
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, vaultAddress);
    console.log("4. Permission: Vault granted MINTER_ROLE");

    console.log("\n--- DEPLOYMENT SUMMARY ---");
    console.log("HUB_VAULT_ADDR:", vaultAddress);
    console.log("STABLECOIN_ADDR:", tokenAddress);
    console.log("RWA_NFT_ADDR:", rwaAddress);
    console.log("---------------------------\n");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
