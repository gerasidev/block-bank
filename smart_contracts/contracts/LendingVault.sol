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
    uint256 public constant MIN_APPROVALS = 3;

    // Default global max leverage (can be overridden by auditors per loan if safe)
    uint256 public constant MAX_PLATFORM_LEVERAGE = 10;

    // Lender specific logic
    uint256 public constant LOCK_PERIOD = 30 days;
    uint256 public constant LENDER_INTEREST_RATE = 500; // 5% annual basis points

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

        uint256 lockUntil = block.timestamp + LOCK_PERIOD;

        depositsByLender[msg.sender].push(
            Deposit({
                amount: msg.value,
                timestamp: block.timestamp,
                lockUntil: lockUntil,
                withdrawn: false
            })
        );

        lenderBalances[msg.sender] += msg.value;
        totalLiquidityDeposited += msg.value;

        emit LiquidityDeposited(msg.sender, msg.value);

        console.log(
            "Liquidity deposited by %s: %s wei, locked until %s",
            msg.sender,
            msg.value,
            lockUntil
        );
    }

    /**
     * @dev Admin seeding function for initial bank capital.
     * Does not accrue interest, does not lock. Pure equity injection.
     */
    function seedCapital() external payable onlyOwner {
        require(msg.value > 0, "Must seed something");
        totalLiquidityDeposited += msg.value;
        // We don't track this as a lender deposit, so it's "free" equity for the protocol.
        console.log("Capital Seeded by Admin: %s wei", msg.value);
    }

    // --- BORROWER FUNCTIONS ---

    /**
     * @dev Borrower locks their RWA NFT to request a loan.
     * Borrower does NOT set leverage/interest. They just ask for an amount and give a description.
     */
    function requestLoan(
        uint256 tokenId,
        uint256 requestedAmount,
        string memory description
    ) external nonReentrant {
        console.log("Requesting loan for Token ID: %s", tokenId);

        // Transfer RWA to Vault
        rwaContract.safeTransferFrom(msg.sender, address(this), tokenId);

        // Valuation Check: Just ensure it's verified. Max leverage checks happen at approval.
        ThyseasRWA.AssetDetails memory asset = rwaContract.getAssetDetails(
            tokenId
        );
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

        // Simple calculation for MVP: total = principal + interest
        uint256 duration = block.timestamp - loan.startTime;
        // If duration is 0 (same block), charge minimal interest or just 0.
        if (duration == 0) duration = 1;

        uint256 interest = (loan.amountLent * loan.interestRate * duration) /
            (10000 * 365 days);
        // Minimum interest floor for demo purposes so it's not 0
        if (interest == 0) interest = loan.amountLent / 1000; // 0.1% fee min

        uint256 totalOwed = loan.amountLent + interest;

        // Borrower must have approved Vault to spend their THY tokens
        thyseasToken.transferFrom(msg.sender, address(this), totalOwed);
        thyseasToken.burn(address(this), totalOwed);

        loan.isRepaid = true;
        totalActiveLoansAmount -= loan.amountLent; // Remove principal from active liability

        // Return Collateral
        rwaContract.safeTransferFrom(
            address(this),
            loan.borrower,
            loan.collateralTokenId
        );

        emit RepaymentReceived(loanId, totalOwed);
        console.log("Loan %s repaid. Total: %s", loanId, totalOwed);
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
        require(auditors[msg.sender], "Not an auditor");
        require(loans[loanId].borrower != address(0), "No such loan");
        require(!loanAuditorApprovals[loanId][msg.sender], "Already approved");
        require(!loans[loanId].isReleased, "Already released");

        Loan storage loan = loans[loanId];

        // Consensus Check
        if (loan.approvalCount == 0) {
            // First approver sets the terms
            loan.leverageRatio = _leverageRatio;
            loan.interestRate = _interestRateBps;
        } else {
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

        emit LoanApproved(
            loanId,
            msg.sender,
            loan.approvalCount,
            _leverageRatio,
            _interestRateBps
        );
        console.log(
            "Auditor %s approved loan %s. Total: %s",
            msg.sender,
            loanId,
            loan.approvalCount
        );
    }

    /**
     * @dev Release Funds: Mints stablecoins to borrower.
     * This is where the "fractional" magic happens.
     */
    /**
     * @dev Release Funds: Mints stablecoins to borrower.
     * This is where the "fractional" magic happens.
     */
    function releaseFunds(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.approvalCount >= MIN_APPROVALS, "Not enough approvals");
        require(!loan.isReleased, "Already released");

        // Bank Safety Check: We don't lend if we don't have enough base asset reserves.
        // Ensure total active loans don't exceed MAX LEVERAGE x total deposited liquidity.
        require(
            totalActiveLoansAmount + loan.amountLent <=
                totalLiquidityDeposited * MAX_PLATFORM_LEVERAGE,
            "Vault Reserve Limit Reached"
        );

        loan.isReleased = true;
        loan.startTime = block.timestamp;
        totalActiveLoansAmount += loan.amountLent;

        // Mint stablecoins into existence (Fractional Lending)
        thyseasToken.mint(loan.borrower, loan.amountLent);

        emit FundsReleased(loanId, loan.amountLent);
        console.log(
            "Funds RELEASED for loan %s: %s THY",
            loanId,
            loan.amountLent
        );
    }

    // --- UTILITIES ---

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
        Deposit storage dep = depositsByLender[msg.sender][depositIndex];
        require(!dep.withdrawn, "Already withdrawn");
        require(block.timestamp >= dep.lockUntil, "Liquidity is locked");

        uint256 amount = dep.amount;
        uint256 interest = calculateInterest(
            amount,
            block.timestamp - dep.timestamp
        );
        uint256 totalToWithdraw = amount + interest;

        // Bank Check: Can only withdraw if it doesn't break our reserve requirement for active loans
        require(
            totalActiveLoansAmount <=
                (totalLiquidityDeposited - amount) * MAX_PLATFORM_LEVERAGE,
            "Liquidity locked in loans"
        );

        dep.withdrawn = true;
        lenderBalances[msg.sender] -= amount;
        totalLiquidityDeposited -= amount;

        // Note: Interest is paid out of the bank's "earnings" (in this MVP, we assume the bank has it or it's minted/available)
        // For simplicity, we just send it if the contract has it.
        (bool success, ) = payable(msg.sender).call{value: totalToWithdraw}("");
        require(success, "Transfer failed");

        console.log(
            "Liquidity withdrawn by %s: %s + %s interest",
            msg.sender,
            amount,
            interest
        );
    }

    function getDepositsCount(address lender) external view returns (uint256) {
        return depositsByLender[lender].length;
    }
}
