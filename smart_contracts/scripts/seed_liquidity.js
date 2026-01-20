const hre = require("hardhat");

async function main() {
    console.log("Seeding existing vault with liquidity...");

    const addresses = require("../deploy_addresses.json");
    const VAULT_ADDRESS = addresses.LendingVault;

    const [signer] = await hre.ethers.getSigners();
    console.log("Using signer:", signer.address);

    const ThyseasToken = await hre.ethers.getContractAt("ThyseasToken", addresses.ThyseasToken);
    const LendingVault = await hre.ethers.getContractAt("LendingVault", VAULT_ADDRESS);

    // 30 days in seconds
    const lockDuration = 30 * 24 * 60 * 60;

    // Amount: 10,000 THY
    const amount = hre.ethers.parseUnits("10000", 18);

    // 1. Mint THY to self (Deployer is Minter)
    console.log(`Minting ${hre.ethers.formatUnits(amount, 18)} THY to signer...`);
    const mintTx = await ThyseasToken.mint(signer.address, amount);
    await mintTx.wait();

    // 2. Approve Vault
    console.log("Approving Vault to spend THY...");
    const approveTx = await ThyseasToken.connect(signer).approve(VAULT_ADDRESS, amount);
    await approveTx.wait();

    // 3. Deposit THY
    console.log(`Depositing ${hre.ethers.formatUnits(amount, 18)} THY with lock duration ${lockDuration}...`);
    const tx = await LendingVault.connect(signer).depositLiquidity(amount, lockDuration);
    await tx.wait();

    console.log("Deposited 10,000 THY liquidity successfully.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
