import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Fixed import path
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import LendingVaultABI from '../../smart_contracts/artifacts/contracts/LendingVault.sol/LendingVault.json';

// Configuration - In a real app these would be in environment variables
const CONTRACT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"; // From our simulation output

interface Loan {
    id: number;
    borrower: string;
    amount: string;
    description: string;
    approvals: number;
    interestRate: number; // bps
    leverageRatio: number;
    isReleased: boolean;
    isRepaid: boolean;
    canApprove: boolean; // Computed client-side
}

export default function AuditorDashboard() {
    const [account, setAccount] = useState<string | null>(null);
    const [isAuditor, setIsAuditor] = useState(false);
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);

    // Track inputs for each loan: { loanId: { leverage: "5", interest: "500" } }
    const [approvalParams, setApprovalParams] = useState<Record<number, { leverage: string, interest: string }>>({});

    // Connect Wallet
    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                setAccount(await signer.getAddress());
                checkAuditorStatus(signer);
            } catch (err) {
                console.error("Connection failed", err);
            }
        }
    };

    // Check if current user is an auditor
    const checkAuditorStatus = async (signer: ethers.Signer) => {
        const vault = new ethers.Contract(CONTRACT_ADDRESS, LendingVaultABI.abi, signer);
        try {
            const address = await signer.getAddress();
            const status = await vault.auditors(address);
            setIsAuditor(status);
            if (status) fetchLoans(signer);
        } catch (err) {
            console.error("Error checking auditor status", err);
        }
    };

    // Fetch all loans
    const fetchLoans = async (signer: ethers.Signer) => {
        setLoading(true);
        const vault = new ethers.Contract(CONTRACT_ADDRESS, LendingVaultABI.abi, signer);
        const loadedLoans: Loan[] = [];

        try {
            const nextId = await vault.nextLoanId();
            const auditorAddress = await signer.getAddress();

            for (let i = 0; i < Number(nextId); i++) {
                const loanData = await vault.loans(i);
                const alreadyApproved = await vault.loanAuditorApprovals(i, auditorAddress);

                // Initialize params if not set
                if (!approvalParams[i]) {
                    // Default or existing values
                    setApprovalParams(prev => ({
                        ...prev,
                        [i]: {
                            leverage: loanData.leverageRatio > 0 ? loanData.leverageRatio.toString() : "5",
                            interest: loanData.interestRate > 0 ? loanData.interestRate.toString() : "500"
                        }
                    }));
                }

                loadedLoans.push({
                    id: i,
                    borrower: loanData.borrower,
                    amount: ethers.formatEther(loanData.amountLent),
                    description: loanData.description,
                    interestRate: Number(loanData.interestRate),
                    leverageRatio: Number(loanData.leverageRatio),
                    approvals: Number(loanData.approvalCount),
                    isReleased: loanData.isReleased,
                    isRepaid: loanData.isRepaid,
                    canApprove: !alreadyApproved && !loanData.isReleased
                });
            }
            setLoans(loadedLoans);
        } catch (err) {
            console.error("Error fetching loans", err);
        } finally {
            setLoading(false);
        }
    };

    const handleParamChange = (id: number, field: 'leverage' | 'interest', value: string) => {
        setApprovalParams(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    const handleApprove = async (id: number) => {
        if (!window.ethereum) return;
        setProcessingId(id);
        const params = approvalParams[id];

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const vault = new ethers.Contract(CONTRACT_ADDRESS, LendingVaultABI.abi, signer);

            console.log(`Approving Loan ${id} with Leverage: ${params.leverage}, Interest: ${params.interest}`);

            const tx = await vault.approveLoan(
                id,
                Number(params.leverage),
                Number(params.interest)
            );
            await tx.wait();

            // Refresh
            fetchLoans(signer);
        } catch (err) {
            console.error("Approval failed", err);
            alert("Approval failed: " + (err as any).message); // Simple error feedback
        } finally {
            setProcessingId(null);
        }
    };

    const handleRelease = async (id: number) => {
        if (!window.ethereum) return;
        setProcessingId(id);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const vault = new ethers.Contract(CONTRACT_ADDRESS, LendingVaultABI.abi, signer);

            const tx = await vault.releaseFunds(id);
            await tx.wait();

            // Refresh
            fetchLoans(signer);
        } catch (err) {
            console.error("Release failed", err);
            alert("Release failed: " + (err as any).message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleSwitchAccount = async () => {
        if (!window.ethereum) return;
        try {
            await window.ethereum.request({
                method: "wallet_requestPermissions",
                params: [{ eth_accounts: {} }],
            });
            // Result handled by accountsChanged listener
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        connectWallet();

        // Listen for account changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', () => window.location.reload());
        }

        // Real-time Event Listeners
        let vaultContract: ethers.Contract | null = null;
        if (window.ethereum) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            vaultContract = new ethers.Contract(CONTRACT_ADDRESS, LendingVaultABI.abi, provider);

            vaultContract.on("LoanRequested", (id, borrower, amount) => {
                console.log("New Loan Requested!", id, borrower, amount);
                // Refresh list if we are connected
                provider.getSigner().then(signer => fetchLoans(signer)).catch(() => { });
            });

            vaultContract.on("LoanApproved", (id, auditor) => {
                console.log("Loan Approved!", id, auditor);
                provider.getSigner().then(signer => fetchLoans(signer)).catch(() => { });
            });

            vaultContract.on("FundsReleased", (id) => {
                console.log("Loan Released!", id);
                provider.getSigner().then(signer => fetchLoans(signer)).catch(() => { });
            });
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', () => window.location.reload());
            }
            if (vaultContract) {
                vaultContract.removeAllListeners();
            }
        }
    }, []);

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Auditor Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Review and approve pending loan requests. 2 signatures required.
                    </p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                    <Badge variant={isAuditor ? "default" : "destructive"}>
                        {isAuditor ? "Auditor Access Granted" : "Restricted Access"}
                    </Badge>
                    <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground font-mono">
                            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Not Connected"}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs border-border hover:bg-secondary"
                            onClick={handleSwitchAccount}
                        >
                            Switch
                        </Button>
                    </div>
                </div>
            </div>

            {!isAuditor ? (
                <Card className="border-destructive/20 bg-destructive/5">
                    <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px] text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                        <p className="text-muted-foreground max-w-md">
                            Your connected wallet is not registered as an auditor. Please switch to an authorized account.
                        </p>
                        {!account && <Button onClick={connectWallet} className="mt-6">Connect Wallet</Button>}
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle>Pending Loans</CardTitle>
                        <CardDescription>Manage approvals for active loan requests</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading && loans.length === 0 ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-secondary border-border">
                                        <TableHead className="w-[80px]">ID</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Requested</TableHead>
                                        <TableHead>Audit Terms</TableHead>
                                        <TableHead>Approvals</TableHead>
                                        <TableHead className="text-right w-[300px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loans.map((loan) => (
                                        <TableRow key={loan.id} className="hover:bg-white/5 border-white/10">
                                            <TableCell className="font-mono">#{loan.id}</TableCell>
                                            <TableCell className="max-w-[200px]">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium leading-none truncate" title={loan.description}>{loan.description || "No description"}</p>
                                                    <p className="text-xs text-muted-foreground font-mono truncate">{loan.borrower}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-foreground">
                                                {Number(loan.amount).toLocaleString()} <span className="text-[10px] text-muted-foreground">ETH</span>
                                            </TableCell>
                                            <TableCell>
                                                {/* Logic for displaying inputs vs set values */}
                                                {(loan.approvals === 0 && loan.canApprove) ? (
                                                    <div className="flex gap-2">
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] uppercase text-muted-foreground">Leverage</p>
                                                            <input
                                                                type="number"
                                                                className="w-16 h-7 text-xs bg-secondary border border-border rounded px-2"
                                                                value={approvalParams[loan.id]?.leverage || "5"}
                                                                onChange={(e) => handleParamChange(loan.id, 'leverage', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] uppercase text-muted-foreground">Rate (bps)</p>
                                                            <input
                                                                type="number"
                                                                className="w-16 h-7 text-xs bg-secondary border border-border rounded px-2"
                                                                value={approvalParams[loan.id]?.interest || "500"}
                                                                onChange={(e) => handleParamChange(loan.id, 'interest', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <Badge variant="outline" className="text-[10px] h-5 mb-1">{loan.leverageRatio > 0 ? `${loan.leverageRatio}x` : "Pending"}</Badge>
                                                        <p className="text-xs text-muted-foreground">{loan.interestRate > 0 ? `${loan.interestRate} bps` : "Pending Rate"}</p>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold ${loan.approvals >= 2 ? "text-primary" : "text-muted-foreground"}`}>
                                                        {loan.approvals}/2
                                                    </span>
                                                    <div className="h-2 w-16 bg-secondary rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary transition-all duration-500"
                                                            style={{ width: `${(loan.approvals / 2) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {loan.isReleased ? (
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <CheckCircle className="h-3 w-3" /> Released
                                                        </span>
                                                    ) : (
                                                        <>
                                                            {loan.canApprove && (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleApprove(loan.id)}
                                                                    disabled={!!processingId}
                                                                    className="bg-primary hover:bg-primary/90 h-8 text-xs font-bold"
                                                                >
                                                                    {processingId === loan.id ? <Loader2 className="h-3 w-3 animate-spin" /> : (loan.approvals === 0 ? "Set Terms & Approve" : "Consensus Approve")}
                                                                </Button>
                                                            )}
                                                            {loan.approvals >= 2 && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground h-8 text-xs"
                                                                    onClick={() => handleRelease(loan.id)}
                                                                    disabled={!!processingId}
                                                                >
                                                                    {processingId === loan.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Release Funds"}
                                                                </Button>
                                                            )}
                                                            {!loan.canApprove && loan.approvals < 2 && (
                                                                <span className="text-xs text-muted-foreground italic">Voted</span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
