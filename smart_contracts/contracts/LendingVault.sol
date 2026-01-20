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
        string description; // Company/Loan description
        uint256 startTime;
        uint256 interestRate; // Annual basis points (e.g. 1000 = 10%) - Set by Auditor
        uint256 leverageRatio; // Set by Auditor
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
    uint256 public constant MIN_APPROVALS = 2;

    // Default global max leverage (can be overridden by auditors per loan if safe)
    uint256 public constant MAX_PLATFORM_LEVERAGE = 10;

    // Lender specific logic
    // Lender specific logic
    uint256 public constant MIN_LOCK_PERIOD = 30 days;
    uint256 public constant MAX_LOCK_PERIOD = 365 days;
    uint256 public constant LENDER_INTEREST_RATE = 500; // 5% annual basis points
    uint256 public constant EARLY_WITHDRAWAL_PENALTY = 500; // 5% penalty

    struct Deposit {
        uint256 amount;
        uint256 timestamp;
        uint256 lockUntil;
        bool withdrawn;
    }

    mapping(address => Deposit[]) public depositsByLender;

    // Safety Ratio: Total Loans shouldn't exceed 10x total vault liquidity (Bank reserve)
    // Audited loans can range, but overall system health is capped at MAX_PLATFORM_LEVERAGE
    uint256 public totalActiveLoansAmount;

    event LiquidityDeposited(address lender, uint256 amount);
    event LoanRequested(
        uint256 loanId,
        address borrower,
        uint256 amount,
        string description
    );
    event LoanApproved(
        uint256 loanId,
        address reviewer,
        uint256 currentApprovals,
        uint256 setLeverage,
        uint256 setInterest
    );
    event FundsReleased(uint256 loanId, uint256 amount);
    event RepaymentReceived(uint256 loanId, uint256 amount);
    event AuditorStatusChanged(address auditor, bool status);

    constructor(
        address _tokenAddress,
        address _rwaAddress
    ) Ownable(msg.sender) {
        thyseasToken = ThyseasToken(_tokenAddress);
        rwaContract = ThyseasRWA(_rwaAddress);

        // Add deployer as initial auditor for ease of use
        auditors[msg.sender] = true;
    }

    // --- ADMIN / REVIEWER FUNCTIONS ---

    // --- ADMIN / REVIEWER FUNCTIONS ---

    function setAuditor(address _auditor, bool _status) external onlyOwner {
        console.log(
            "Admin setting auditor status for: %s to %s",
            _auditor,
            _status
        );
        auditors[_auditor] = _status;
        emit AuditorStatusChanged(_auditor, _status);
    }

    // --- LENDER FUNCTIONS ---

    /**
     * @dev Lenders deposit base assets (THY) to provide the reserve for the bank.
     * @param amount Amount of THY to deposit.
     * @param lockDurationSeconds Duration to lock funds (min 30 days, max 365 days).
     */
    function depositLiquidity(
        uint256 amount,
        uint256 lockDurationSeconds
    ) external nonReentrant {
        console.log("--- depositLiquidity called ---");
        console.log("Caller: %s", msg.sender);
        console.log("Amount: %s THY", amount);

        require(amount > 0, "Must deposit something");
        require(lockDurationSeconds >= MIN_LOCK_PERIOD, "Min lock 30 days");
        require(lockDurationSeconds <= MAX_LOCK_PERIOD, "Max lock 365 days");

        uint256 lockUntil = block.timestamp + lockDurationSeconds;

        // Transfer THY from Lender to Vault
        thyseasToken.transferFrom(msg.sender, address(this), amount);

        depositsByLender[msg.sender].push(
            Deposit({
                amount: amount,
                timestamp: block.timestamp,
                lockUntil: lockUntil,
                withdrawn: false
            })
        );

        uint256 oldBalance = lenderBalances[msg.sender];
        lenderBalances[msg.sender] += amount;
        totalLiquidityDeposited += amount;

        console.log("Lender old balance: %s", oldBalance);
        console.log("Lender new balance: %s", lenderBalances[msg.sender]);
        console.log("Total System Liquidity: %s", totalLiquidityDeposited);

        emit LiquidityDeposited(msg.sender, amount);
    }

    /**
     * @dev Admin seeding function for initial bank capital.
     * Does not accrue interest, does not lock. Pure equity injection.
     */
    function seedCapital(uint256 amount) external onlyOwner {
        console.log("--- seedCapital called ---");
        require(amount > 0, "Must seed something");

        // Transfer THY from Admin to Vault
        thyseasToken.transferFrom(msg.sender, address(this), amount);

        totalLiquidityDeposited += amount;
        console.log("Capital Seeded by Admin: %s THY", amount);
        console.log("New Total Liquidity: %s", totalLiquidityDeposited);
    }

    // --- BORROWER FUNCTIONS ---

    /**
     * @dev Borrower locks their RWA NFT to request a loan.
     * Borrower does NOT set leverage/interest. They just ask for an amount and give a description.
     * NOTE: This operates on a "Good Faith" model. We hold the NFT as a trust pledge.
     * The physical control of the asset remains with the borrower, trusting they will not sell it off-chain.
     */
    function requestLoan(
        uint256 tokenId,
        uint256 requestedAmount,
        string memory description
    ) external nonReentrant {
        console.log("--- requestLoan called ---");
        console.log("Borrower: %s", msg.sender);
        console.log("TokenID: %s", tokenId);
        console.log("Requested Amount: %s", requestedAmount);

        // Transfer RWA to Vault
        console.log("Transferring RWA from borrower to Vault...");
        rwaContract.safeTransferFrom(msg.sender, address(this), tokenId);

        // Valuation Check: Just ensure it's verified. Max leverage checks happen at approval.
        ThyseasRWA.AssetDetails memory asset = rwaContract.getAssetDetails(
            tokenId
        );
        console.log("Asset Name: %s", asset.name);
        console.log("Asset Verified: %s", asset.isVerified);
        require(asset.isVerified, "Asset must be verified first");

        loans[nextLoanId] = Loan({
            borrower: msg.sender,
            collateralTokenId: tokenId,
            amountLent: requestedAmount,
            description: description,
            startTime: 0,
            interestRate: 0, // Pending Auditor
            leverageRatio: 0, // Pending Auditor
            approvalCount: 0,
            isReleased: false,
            isRepaid: false
        });

        emit LoanRequested(
            nextLoanId,
            msg.sender,
            requestedAmount,
            description
        );
        console.log("Loan Created ID: %s", nextLoanId);
        nextLoanId++;
    }

    /**
     * @dev Repay the loan + interest to recover collateral.
     */
    function repayLoan(uint256 loanId) external nonReentrant {
        console.log("--- repayLoan called ---");
        console.log("LoanID: %s", loanId);
        console.log("Caller: %s", msg.sender);

        Loan storage loan = loans[loanId];
        require(loan.isReleased, "Loan not active");
        require(!loan.isRepaid, "Already repaid");

        console.log("Original Amount Lent: %s", loan.amountLent);

        // Simple calculation for MVP: total = principal + interest
        uint256 duration = block.timestamp - loan.startTime;
        console.log("Loan Duration in seconds: %s", duration);

        // If duration is 0 (same block), charge minimal interest or just 0.
        if (duration == 0) duration = 1;

        uint256 interest = (loan.amountLent * loan.interestRate * duration) /
            (10000 * 365 days);

        console.log("Calculated Raw Interest: %s", interest);

        // Minimum interest floor for demo purposes so it's not 0
        if (interest == 0) {
            interest = loan.amountLent / 1000; // 0.1% fee min
            console.log("Interest bumped to min floor: %s", interest);
        }

        uint256 totalOwed = loan.amountLent + interest;
        console.log("Total Owed (Principal + Interest): %s", totalOwed);

        // Borrower must have approved Vault to spend their THY tokens
        console.log("Attempting to transfer THY from borrower...");
        thyseasToken.transferFrom(msg.sender, address(this), totalOwed);

        console.log("Burning repayment...");
        thyseasToken.burn(address(this), totalOwed);

        loan.isRepaid = true;
        totalActiveLoansAmount -= loan.amountLent; // Remove principal from active liability
        console.log(
            "Active Loans Amount Reduced. New Total: %s",
            totalActiveLoansAmount
        );

        // Return Collateral
        console.log(
            "Returning Collateral Token ID: %s",
            loan.collateralTokenId
        );
        rwaContract.safeTransferFrom(
            address(this),
            loan.borrower,
            loan.collateralTokenId
        );

        emit RepaymentReceived(loanId, totalOwed);
        console.log("Repayment Successful.");
    }

    /**
     * @dev Calculate interest for a deposit.
     * interest = amount * (rate/10000) * (time/year)
     */
    function calculateInterest(
        uint256 amount,
        uint256 duration
    ) public pure returns (uint256) {
        return (amount * LENDER_INTEREST_RATE * duration) / (10000 * 365 days);
    }

    /**
     * @dev Auditor Approval Step. Requires MIN_APPROVALS to proceed.
     * Auditors define the Leverage and Interest Rate.
     * For consensus: The first auditor sets the terms. Subsequent auditors must agree (pass same values).
     */
    function approveLoan(
        uint256 loanId,
        uint256 _leverageRatio,
        uint256 _interestRateBps
    ) external {
        console.log("--- approveLoan called ---");
        console.log("Auditor: %s", msg.sender);
        console.log("Loan ID: %s", loanId);
        console.log("Proposed Leverage: %s", _leverageRatio);
        console.log("Proposed Interest: %s bps", _interestRateBps);

        require(auditors[msg.sender], "Not an auditor");
        require(loans[loanId].borrower != address(0), "No such loan");
        require(!loanAuditorApprovals[loanId][msg.sender], "Already approved");
        require(!loans[loanId].isReleased, "Already released");

        Loan storage loan = loans[loanId];

        // Consensus Check
        if (loan.approvalCount == 0) {
            // First approver sets the terms
            console.log("First approval. Setting terms.");
            loan.leverageRatio = _leverageRatio;
            loan.interestRate = _interestRateBps;
        } else {
            console.log("Subsequent approval. Checking consensus.");
            // Subsequent approvers must match the set terms
            require(
                loan.leverageRatio == _leverageRatio,
                "Leverage mismatch with existing approvals"
            );
            require(
                loan.interestRate == _interestRateBps,
                "Interest mismatch with existing approvals"
            );
        }

        loanAuditorApprovals[loanId][msg.sender] = true;
        loan.approvalCount++;

        console.log("Approval recorded. Current Count: %s", loan.approvalCount);

        emit LoanApproved(
            loanId,
            msg.sender,
            loan.approvalCount,
            _leverageRatio,
            _interestRateBps
        );
    }

    /**
     * @dev Release Funds: Mints stablecoins to borrower.
     * This is where the "fractional" magic happens.
     */
    function releaseFunds(uint256 loanId) external nonReentrant {
        console.log("--- releaseFunds called ---");
        console.log("Loan ID: %s", loanId);
        console.log("Caller: %s", msg.sender); // Anyone can call, but usually borrower or auto

        Loan storage loan = loans[loanId];
        console.log(
            "Approvals: %s (Required: %s)",
            loan.approvalCount,
            MIN_APPROVALS
        );
        require(loan.approvalCount >= MIN_APPROVALS, "Not enough approvals");
        require(!loan.isReleased, "Already released");

        // Bank Safety Check: We don't lend if we don't have enough base asset reserves.
        // Ensure total active loans don't exceed MAX LEVERAGE x total deposited liquidity.

        console.log("Safety Check:");
        console.log("  Current Active Loans: %s", totalActiveLoansAmount);
        console.log("  Loan Request Amount:  %s", loan.amountLent);
        console.log("  Total Liquidity:      %s", totalLiquidityDeposited);
        console.log("  Max Leverage Ratio:   %s", MAX_PLATFORM_LEVERAGE);

        // Uses the new helper function
        uint256 maxLoansAllowed = calculateMaxAllowedLoans(
            totalLiquidityDeposited
        );
        console.log("  Max Allowed Loan Exposure: %s", maxLoansAllowed);

        (bool isSafe, ) = checkBankSolvency(
            totalLiquidityDeposited,
            totalActiveLoansAmount + loan.amountLent
        );

        require(isSafe, "Vault Reserve Limit Reached: Solvency Check Failed");

        loan.isReleased = true;
        loan.startTime = block.timestamp;
        totalActiveLoansAmount += loan.amountLent;

        console.log("Check Passed. Funds Released: %s", loan.amountLent);
        console.log("Minting THY tokens to Borrower: %s", loan.borrower);

        // Mint stablecoins into existence (Fractional Lending)
        thyseasToken.mint(loan.borrower, loan.amountLent);

        emit FundsReleased(loanId, loan.amountLent);
    }

    // --- UTILITIES & CALCULATIONS ---

    /**
     * @dev Calculates the maximum loan exposure allowed for a given liquidity amount.
     * Formula: Liquidity * MAX_PLATFORM_LEVERAGE
     */
    function calculateMaxAllowedLoans(
        uint256 liquidityAmount
    ) public pure returns (uint256) {
        return liquidityAmount * MAX_PLATFORM_LEVERAGE;
    }

    /**
     * @dev Checks if the bank remains solvent (healthy) after a potential change.
     * Returns true if TotalLoans <= Liquidity * Leverage
     */
    function checkBankSolvency(
        uint256 newTotalLiquidity,
        uint256 newTotalLoans
    ) public pure returns (bool isSafe, uint256 maxAllowed) {
        maxAllowed = calculateMaxAllowedLoans(newTotalLiquidity);
        if (newTotalLoans <= maxAllowed) {
            return (true, maxAllowed);
        } else {
            return (false, maxAllowed);
        }
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    // Withdraw liquidity (For lenders)
    function withdrawLiquidity(uint256 depositIndex) external nonReentrant {
        console.log("--- withdrawLiquidity called ---");
        console.log("Caller: %s", msg.sender);
        console.log("Deposit Index: %s", depositIndex);

        Deposit storage dep = depositsByLender[msg.sender][depositIndex];
        require(!dep.withdrawn, "Already withdrawn");

        console.log("Deposit Amount: %s", dep.amount);
        console.log("Lock Until:     %s", dep.lockUntil);
        console.log("Current Time:   %s", block.timestamp);

        uint256 amountToSend;
        uint256 penalty = 0;
        uint256 interest = 0;

        if (block.timestamp >= dep.lockUntil) {
            // Maturity Reached: Full Principal + Interest
            interest = calculateInterest(
                dep.amount,
                block.timestamp - dep.timestamp
            );
            amountToSend = dep.amount + interest;
            console.log("Maturity reached. Interest earned: %s", interest);
        } else {
            // Early Withdrawal: Principal - 5% Penalty, No Interest
            penalty = (dep.amount * EARLY_WITHDRAWAL_PENALTY) / 10000;
            amountToSend = dep.amount - penalty;
            console.log("Early withdrawal. Penalty applied: %s", penalty);
        }

        uint256 potentialNewLiquidity = totalLiquidityDeposited -
            (dep.amount - penalty);
        // Note: If penalty > 0, the penalty amount essentially stays in the bank's equity (totalLiquidityDeposited logic is tricky here)
        // Strictly speaking, totalLiquidityDeposited tracks "User Deposits".
        // If we penalize, we reduce totalLiquidityDeposited by the full original amount (since that liability is gone),
        // but we only pay out (amount - penalty). The penalty effectively becomes protocol equity.
        // For solvency check, we care about what leaves the vault.

        // Solvency Check:
        // We verify if the bank still satisfies: TotalLoans <= NewLiquidity * MaxLeverage
        // Actually, "NewLiquidity" for the purpose of backing loans should be the actual assets held.
        // If penalty is kept, assets drop by 'amountToSend'.
        // So potentialNewLiquidity = CurrentLiquidity - amountToSend.

        potentialNewLiquidity = totalLiquidityDeposited - amountToSend; // Accurate reserve tracking

        // Use the helper function to calculate new limits
        (bool isSafe, uint256 maxLoansAfterWithdrawal) = checkBankSolvency(
            potentialNewLiquidity,
            totalActiveLoansAmount
        );

        console.log("Reserve Check:");
        console.log("  Total Active Loans:        %s", totalActiveLoansAmount);
        console.log("  Max Loans after withdraw:  %s", maxLoansAfterWithdrawal);

        require(
            isSafe,
            "Liquidity locked in loans: Withdrawal would make bank insolvent"
        );

        dep.withdrawn = true;

        // Update state
        lenderBalances[msg.sender] -= dep.amount; // Remove full liability from user balance

        // Update Total Liquidity to reflect what remains
        // TotalLiquidityDeposited was tracking "Amount Deposited".
        // Technically, if we keep penalty, that penalty is "Free Equity" similar to seedCapital.
        // So TotalLiquidityDeposited should theoretically decrease by 'amountToSend' (what left) ?
        // Or if TotalLiquidityDeposited represents "Total Assets Available", then yes, decrease by amountToSend.
        // Let's assume TotalLiquidityDeposited tracks "Total Available Reserve Assets".
        totalLiquidityDeposited = potentialNewLiquidity;

        console.log("Sending %s THY to lender...", amountToSend);

        // Transfer THY to lender
        thyseasToken.transfer(msg.sender, amountToSend);

        console.log("Withdraw successful.");
    }

    function getDepositsCount(address lender) external view returns (uint256) {
        return depositsByLender[lender].length;
    }
}
