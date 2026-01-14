// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "hardhat/console.sol"; // Debugging
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ThyseasToken.sol";
import "./ThyseasRWA.sol";

/**
 * @title LendingVault
 * @dev The Core Bank. Handles RWA collateral, liquidity deposits, and fractional lending.
 */
contract LendingVault is Ownable, IERC721Receiver, ReentrancyGuard {
    ThyseasToken public thyseasToken;
    ThyseasRWA public rwaContract;

    struct Loan {
        address borrower;
        uint256 collateralTokenId;
        uint256 amountLent;
        uint256 startTime;
        uint256 interestRate; // Annual basis points (e.g. 1000 = 10%)
        // Multi-Sig State
        uint256 approvalCount;
        bool isReleased;
        bool isRepaid;
    }

    // Liquidity Pool trackers
    uint256 public totalLiquidityDeposited; // ETH/Base Asset deposited by lenders
    mapping(address => uint256) public lenderBalances;

    mapping(uint256 => Loan) public loans;
    uint256 public nextLoanId;

    // Multi-Sig / Auditor Logic
    mapping(address => bool) public auditors;
    mapping(uint256 => mapping(address => bool)) public loanAuditorApprovals; // loanId -> auditor -> approved
    uint256 public constant MIN_APPROVALS = 3;

    // Fractional Reserve Logic: 10x Leverage
    // We can lend up to 10x the value of the collateral deposited.
    uint256 public constant LEVERAGE_RATIO = 10;
    
    // Safety Ratio: Total Loans shouldn't exceed 10x total vault liquidity (Bank reserve)
    uint256 public totalActiveLoansAmount;

    event LiquidityDeposited(address lender, uint256 amount);
    event LoanRequested(uint256 loanId, address borrower, uint256 amount);
    event LoanApproved(uint256 loanId, address reviewer, uint256 currentApprovals);
    event FundsReleased(uint256 loanId, uint256 amount);
    event RepaymentReceived(uint256 loanId, uint256 amount);
    event AuditorStatusChanged(address auditor, bool status);

    constructor(address _tokenAddress, address _rwaAddress) Ownable(msg.sender) {
        thyseasToken = ThyseasToken(_tokenAddress);
        rwaContract = ThyseasRWA(_rwaAddress);
        
        // Add deployer as initial auditor for ease of use
        auditors[msg.sender] = true;
    }

    // --- ADMIN / REVIEWER FUNCTIONS ---
    
    function setAuditor(address _auditor, bool _status) external onlyOwner {
        auditors[_auditor] = _status;
        emit AuditorStatusChanged(_auditor, _status);
    }

    // --- LENDER FUNCTIONS ---

    /**
     * @dev Lenders deposit base assets (ETH) to provide the reserve for the bank.
     */
    function depositLiquidity() external payable nonReentrant {
        require(msg.value > 0, "Must deposit something");
        lenderBalances[msg.sender] += msg.value;
        totalLiquidityDeposited += msg.value;
        emit LiquidityDeposited(msg.sender, msg.value);
        
        console.log("Liquidity deposited by %s: %s wei", msg.sender, msg.value);
    }

    // --- BORROWER FUNCTIONS ---

    /**
     * @dev Borrower locks their RWA NFT to request a loan.
     */
    function requestLoan(uint256 tokenId, uint256 amountInTHY, uint256 interestRateBps) external nonReentrant {
        console.log("Requesting loan for Token ID: %s", tokenId);

        // Transfer RWA to Vault
        rwaContract.safeTransferFrom(msg.sender, address(this), tokenId);

        // Valuation Check: Loan <= 10x Asset Appraised Value
        ThyseasRWA.AssetDetails memory asset = rwaContract.getAssetDetails(tokenId);
        require(asset.isVerified, "Asset must be verified first");
        
        // Asset valuation is in USD. We assume THY is $1/unit for this MVP logic.
        uint256 maxLoan = asset.valuationUSD * LEVERAGE_RATIO;
        require(amountInTHY <= maxLoan, "Exceeds 10x Leverage limit");

        loans[nextLoanId] = Loan({
            borrower: msg.sender,
            collateralTokenId: tokenId,
            amountLent: amountInTHY,
            startTime: 0,
            interestRate: interestRateBps,
            approvalCount: 0,
            isReleased: false,
            isRepaid: false
        });

        emit LoanRequested(nextLoanId, msg.sender, amountInTHY);
        console.log("Loan %s requested by %s", nextLoanId, msg.sender);
        
        nextLoanId++;
    }

    /**
     * @dev Repay the loan + interest to recover collateral.
     */
    function repayLoan(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.isReleased, "Loan not active");
        require(!loan.isRepaid, "Already repaid");

        // Simple calculation for MVP: total = principal + 10% (fixed for demo or based on rate)
        uint256 totalOwed = loan.amountLent; // + interest calculation logic would go here
        
        // Borrower must have approved Vault to spend their THY tokens
        thyseasToken.transferFrom(msg.sender, address(this), totalOwed);
        thyseasToken.burn(address(this), totalOwed);

        loan.isRepaid = true;
        totalActiveLoansAmount -= totalOwed;

        // Return Collateral
        rwaContract.safeTransferFrom(address(this), loan.borrower, loan.collateralTokenId);
        
        emit RepaymentReceived(loanId, totalOwed);
        console.log("Loan %s repaid", loanId);
    }

    /**
     * @dev Auditor Approval Step. Requires MIN_APPROVALS to proceed.
     */
    function approveLoan(uint256 loanId) external {
        require(auditors[msg.sender], "Not an auditor");
        require(loans[loanId].borrower != address(0), "No such loan");
        require(!loanAuditorApprovals[loanId][msg.sender], "Already approved");
        require(!loans[loanId].isReleased, "Already released");

        loanAuditorApprovals[loanId][msg.sender] = true;
        loans[loanId].approvalCount++;

        emit LoanApproved(loanId, msg.sender, loans[loanId].approvalCount);
        console.log("Auditor %s approved loan %s. Total: %s", msg.sender, loanId, loans[loanId].approvalCount);
    }

    /**
     * @dev Release Funds: Mints stablecoins to borrower.
     * This is where the "fractional" magic happens.
     */
    function releaseFunds(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.approvalCount >= MIN_APPROVALS, "Not enough approvals");
        require(!loan.isReleased, "Already released");

        // Bank Safety Check: We don't lend if we don't have enough base asset reserves (1:10 ratio)
        // Ensure total active loans don't exceed 10x our total deposited liquidity.
        require(totalActiveLoansAmount + loan.amountLent <= totalLiquidityDeposited * 10, "Vault Reserve Limit Reached");

        loan.isReleased = true;
        loan.startTime = block.timestamp;
        totalActiveLoansAmount += loan.amountLent;

        // Mint stablecoins into existence (Fractional Lending)
        thyseasToken.mint(loan.borrower, loan.amountLent);

        emit FundsReleased(loanId, loan.amountLent);
        console.log("Funds RELEASED for loan %s: %s THY", loanId, loan.amountLent);
    }

    // --- UTILITIES ---

    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    // Withdraw liquidity (For lenders)
    function withdrawLiquidity(uint256 amount) external nonReentrant {
        require(lenderBalances[msg.sender] >= amount, "Insufficient balance");
        
        // Bank Check: Can only withdraw if it doesn't break our 10x reserve requirement for active loans
        require(totalActiveLoansAmount <= (totalLiquidityDeposited - amount) * 10, "Liquidity locked in loans");

        lenderBalances[msg.sender] -= amount;
        totalLiquidityDeposited -= amount;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
    }
}
