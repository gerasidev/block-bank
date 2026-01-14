const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LendingVault Multi-Sig", function () {
    let Token, RWA, Vault;
    let token, rwa, vault;
    let owner, lender, borrower, auditor1, auditor2;

    beforeEach(async function () {
        [owner, lender, borrower, auditor1, auditor2] = await ethers.getSigners();

        // Deploy Token
        Token = await ethers.getContractFactory("ThyseasToken");
        token = await Token.deploy();

        // Deploy RWA
        RWA = await ethers.getContractFactory("ThyseasRWA");
        rwa = await RWA.deploy();

        // Deploy Vault
        Vault = await ethers.getContractFactory("LendingVault");
        vault = await Vault.deploy(token.target, rwa.target);

        // Setup: Grant MINTER_ROLE to Vault
        const MINTER_ROLE = await token.MINTER_ROLE();
        await token.grantRole(MINTER_ROLE, vault.target);

        // Setup: Add Auditors
        await vault.setAuditor(auditor1.address, true);
        await vault.setAuditor(auditor2.address, true);
    });

    it("Should handle full loan flow with multi-sig approval", async function () {
        // 1. Lender deposits liquidity
        const depositAmount = ethers.parseEther("9000");
        await vault.connect(lender).depositLiquidity({ value: depositAmount });

        // 2. Mint RWA to borrower
        // mintAsset(to, uri, name, valUSD, type, loc)
        // Type 0 = Hardware
        await rwa.mintAsset(borrower.address, "ipfs://test", "Robot Arm", ethers.parseEther("10000"), 0, "Warehouse A");
        const tokenId = 0;

        // Asset is verified by default on mint in the current contract logic

        // 3. Borrower approves Vault to take NFT
        await rwa.connect(borrower).approve(vault.target, tokenId);

        // 4. Request Loan (10k valuation * 10 leverage = 100k max loan)
        // Requesting 50k THY. Note: 50k THY = 50,000 * 10^18.
        const loanAmount = ethers.parseEther("50000");
        await vault.connect(borrower).requestLoan(tokenId, loanAmount, 500); // 5% rate

        // 5. Auditor 1 Approves
        await vault.connect(auditor1).approveLoan(0); // loanId 0
        let loan = await vault.loans(0);
        expect(loan.approvalCount).to.equal(1n);

        // 6. Auditor 2 Approves
        await vault.connect(auditor2).approveLoan(0);
        loan = await vault.loans(0);
        expect(loan.approvalCount).to.equal(2n);

        // 7. Release Funds
        await vault.releaseFunds(0);

        // 8. Verify Borrower Balance
        const borrowerBalance = await token.balanceOf(borrower.address);
        expect(borrowerBalance).to.equal(loanAmount);
    });
});
