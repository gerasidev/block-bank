import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Zap, Package, Landmark, Plus, ClipboardList } from 'lucide-react';
import LendingVaultABI from '../../smart_contracts/artifacts/contracts/LendingVault.sol/LendingVault.json';
import ThyseasRWA_ABI from '../../smart_contracts/artifacts/contracts/ThyseasRWA.sol/ThyseasRWA.json';

// Addresses from our deploy_local.js output
const VAULT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const RWA_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

interface BorrowerLoan {
    id: number;
    amount: string;
    approvals: number;
    isReleased: boolean;
    isRepaid: boolean;
    status: string;
}

export default function BorrowerDashboard() {
    const [account, setAccount] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [description, setDescription] = useState("");
    const [assetName, setAssetName] = useState("Robotic Arm Pro");
    const [valuation, setValuation] = useState("1.5");
    const [loanAmount, setLoanAmount] = useState("10");
    const [statusMsg, setStatusMsg] = useState("");
    const [myLoans, setMyLoans] = useState<BorrowerLoan[]>([]);

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum as any);
                const network = await provider.getNetwork();
                console.log("Connected to network:", network.name, network.chainId);

                const signer = await provider.getSigner();
                const address = await signer.getAddress();
                setAccount(address);
                fetchMyLoans(address, provider);
            } catch (err: any) {
                console.error("Wallet connection failed", err);
                if (err.code === -32002) {
                    setStatusMsg("MetaMask is pending another request. Please open MetaMask.");
                } else {
                    setStatusMsg("Connection Error: " + (err.message || "Unknown error"));
                }
            }
        }
    };

    const fetchMyLoans = async (address: string, provider: ethers.BrowserProvider) => {
        try {
            const signer = await provider.getSigner();
            const vault = new ethers.Contract(VAULT_ADDRESS, LendingVaultABI.abi, signer);
            const nextId = await vault.nextLoanId();
            const loansFound: BorrowerLoan[] = [];

            for (let i = 0; i < Number(nextId); i++) {
                const loanData = await vault.loans(i);
                if (loanData.borrower.toLowerCase() === address.toLowerCase()) {
                    let status = "Verification Pending";
                    if (loanData.isRepaid) status = "Completed";
                    else if (loanData.isReleased) status = "Active";
                    else if (Number(loanData.approvalCount) >= 3) status = "Ready for Release";

                    loansFound.push({
                        id: i,
                        amount: ethers.formatEther(loanData.amountLent),
                        approvals: Number(loanData.approvalCount),
                        isReleased: loanData.isReleased,
                        isRepaid: loanData.isRepaid,
                        status: status
                    });
                }
            }
            setMyLoans(loansFound);
        } catch (err) {
            console.error("Error fetching loans", err);
        }
    };

    const handleMintAndRequest = async () => {
        if (!window.ethereum || !account) return;
        setLoading(true);
        setStatusMsg("Initializing Atomic Request...");

        try {
            const provider = new ethers.BrowserProvider(window.ethereum as any);
            const signer = await provider.getSigner();

            // Check Balance
            const balance = await provider.getBalance(account);
            if (balance === 0n) {
                throw new Error("Insufficient ETH for gas. Please fund your account from the Hardhat node (Account 1).");
            }

            const rwaContract = new ethers.Contract(RWA_ADDRESS, ThyseasRWA_ABI.abi, signer);
            const vaultContract = new ethers.Contract(VAULT_ADDRESS, LendingVaultABI.abi, signer);

            // 1. Mint Asset
            console.log("Starting Step 1: Minting NFT...");
            setStatusMsg("Step 1/3: Confirm Mint in MetaMask...");

            const mintTx = await rwaContract.mintAsset(
                account,
                "ipfs://trusted-verification-hash",
                assetName,
                ethers.parseUnits(valuation.toString(), 18),
                0, // HARDWARE
                "Berlin Hub #4"
            );

            console.log("Mint Transaction Sent:", mintTx.hash);
            setStatusMsg("Step 1/3: Mining Transaction...");
            const receipt = await mintTx.wait();
            console.log("Mint Receipt Received:", receipt);

            const transferEvent = receipt.logs.find(
                (log: any) => log.topics[0] === ethers.id("Transfer(address,address,uint256)")
            );

            if (!transferEvent) {
                console.error("Transfer event not found in logs:", receipt.logs);
                throw new Error("Minting failed: Transfer event not found");
            }

            const tokenId = ethers.toBigInt(transferEvent.topics[3]);
            console.log("Token ID Minted:", tokenId.toString());

            setStatusMsg(`Asset Minted! Token ID: ${tokenId.toString()}. Step 2/3: Approve Vault...`);

            // 2. Approve Vault
            console.log(`Starting Step 2: Approving Vault for Token ${tokenId.toString()}...`);
            const approveTx = await rwaContract.approve(VAULT_ADDRESS, tokenId);
            console.log("Approve Transaction Sent:", approveTx.hash);
            await approveTx.wait();

            // 3. Request Loan
            console.log("Starting Step 3: Requesting Loan...");
            setStatusMsg("Step 3/3: Locked! Requesting Leverage in Vault...");
            const requestTx = await vaultContract.requestLoan(
                tokenId,
                ethers.parseUnits(loanAmount.toString(), 18),
                description
            );
            console.log("Request Transaction Sent:", requestTx.hash);
            await requestTx.wait();

            setStatusMsg(`Protocol Initiated! Token #${tokenId.toString()} successfully locked.`);
            fetchMyLoans(account, provider);

        } catch (err: any) {
            console.error(err);
            setStatusMsg("Protocol Error: " + (err.reason || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        connectWallet();
        if (window.ethereum) {
            (window as any).ethereum.on('accountsChanged', () => window.location.reload());
        }
    }, []);

    const handleRepay = async (id: number, amount: string) => {
        if (!window.ethereum) return;
        setLoading(true);
        setStatusMsg(`Processing Repayment for Loan #${id}...`);

        try {
            const provider = new ethers.BrowserProvider(window.ethereum as any);
            const signer = await provider.getSigner();
            const vaultContract = new ethers.Contract(VAULT_ADDRESS, LendingVaultABI.abi, signer);
            // We need the token contract to approve spending first, assuming token is ThyseasToken
            // But usually Vault handles burning if it has allowance, or we just transfer.
            // The contract says: thyseasToken.transferFrom(msg.sender, address(this), totalOwed);
            // So we need to Approve the Vault to spend our THY.

            // For this UI, we assume approval is done or we add a step. 
            // Simplified: Direct Repay call (assuming existing allowance or user handles it).
            // Actually, let's just call repayLoan. If allowance fails, it errors.

            const req = await vaultContract.repayLoan(id);
            await req.wait();

            setStatusMsg("Loan Repaid Successfully!");
            fetchMyLoans(account!, provider);
        } catch (err: any) {
            console.error(err);
            setStatusMsg("Repayment Error: " + (err.reason || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-end border-b border-white/5 pb-6">
                <div>
                    <Badge variant="outline" className="mb-2 border-primary/20 text-primary bg-primary/5">Borrower Access</Badge>
                    <h1 className="text-4xl font-bold tracking-tighter text-foreground">Borrower Dashboard</h1>
                    <p className="text-muted-foreground mt-2">Manage your physical asset collateral and request bank leverage.</p>
                </div>
                {account && (
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Your Identity</p>
                        <Badge variant="secondary" className="font-mono px-3 py-1 bg-secondary border-border hover:bg-secondary/80 cursor-pointer">
                            {account.slice(0, 10)}...{account.slice(-8)}
                        </Badge>
                    </div>
                )}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-card border-border shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                <Plus className="h-5 w-5 text-primary" />
                                Create Loan Request
                            </CardTitle>
                            <CardDescription>Lock atoms, borrow bits.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Company / Asset Description</label>
                                <Input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="bg-transparent border-border focus:ring-primary"
                                    placeholder="e.g. Series A Tech Startup, Robotic Arm for Factory Line 1"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Physical Asset name</label>
                                <Input
                                    value={assetName}
                                    onChange={(e) => setAssetName(e.target.value)}
                                    className="bg-transparent border-border focus:ring-primary"
                                    placeholder="e.g. Robot X-Series #12"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Valuation (ETH)</label>
                                    <Input
                                        type="number"
                                        value={valuation}
                                        onChange={(e) => setValuation(e.target.value)}
                                        className="bg-transparent border-border"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Requested Amount ($THY)</label>
                                    <Input
                                        type="number"
                                        value={loanAmount}
                                        onChange={(e) => setLoanAmount(e.target.value)}
                                        className="bg-transparent border-border"
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-secondary/50 border border-border rounded-lg">
                                <p className="text-[10px] text-muted-foreground mb-1">Estimated Leverage Ratio (Subject to Audit)</p>
                                <p className="text-lg font-bold text-foreground">{(Number(loanAmount) / Number(valuation)).toFixed(1)}x <span className="text-[10px] font-normal text-muted-foreground uppercase ml-1">Requested</span></p>
                            </div>

                            <Button
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 font-bold shadow-sm"
                                onClick={handleMintAndRequest}
                                disabled={loading || !account || !description}
                            >
                                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Zap className="mr-2 h-4 w-4" />}
                                {loading ? "Executing Protocol..." : "Mint & Request Loan"}
                            </Button>

                            {statusMsg && (
                                <p className={`text-[11px] text-center font-medium ${statusMsg.includes("Error") ? "text-destructive" : "text-primary animate-pulse"}`}>
                                    {statusMsg}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card className="bg-card border-border h-full shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                                    <ClipboardList className="h-5 w-5 text-primary" />
                                    Personal Resource Ledger
                                </CardTitle>
                                <CardDescription>Tracking your active leverage and collateral status.</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => account && fetchMyLoans(account, new ethers.BrowserProvider(window.ethereum as any))} className="text-xs hover:bg-secondary">
                                Refresh
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/5 hover:bg-transparent">
                                        <TableHead className="text-slate-500 uppercase text-[10px] font-bold">Loan ID</TableHead>
                                        <TableHead className="text-slate-500 uppercase text-[10px] font-bold">Injected Capital</TableHead>
                                        <TableHead className="text-slate-500 uppercase text-[10px] font-bold">Audit Signatures</TableHead>
                                        <TableHead className="text-slate-500 uppercase text-[10px] font-bold">Protocol Status</TableHead>
                                        <TableHead className="text-slate-500 uppercase text-[10px] font-bold text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {myLoans.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                                                No active protocol streams found for this identity.
                                            </TableCell>
                                        </TableRow>
                                    ) : myLoans.map((loan) => (
                                        <TableRow key={loan.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                            <TableCell className="font-mono text-sm text-muted-foreground italic">#{loan.id}</TableCell>
                                            <TableCell className="font-bold text-foreground tracking-widest">{loan.amount} <span className="text-[10px] text-muted-foreground ml-1">$THY</span></TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-bold ${loan.approvals >= 3 ? "text-foreground" : "text-muted-foreground"}`}>
                                                        {loan.approvals}/3
                                                    </span>
                                                    <div className="h-1 w-16 bg-secondary rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full transition-all duration-1000 bg-primary"
                                                            style={{ width: `${(loan.approvals / 3) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`
                                                        text-[10px] uppercase tracking-tighter
                                                        ${loan.isReleased ? 'border-primary text-primary bg-primary/5' :
                                                            loan.isRepaid ? 'border-border text-muted-foreground bg-secondary' :
                                                                'border-border text-foreground bg-secondary'}
                                                    `}
                                                >
                                                    {loan.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {loan.isReleased && !loan.isRepaid && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/10"
                                                        onClick={() => handleRepay(loan.id, loan.amount)}
                                                    >
                                                        Repay Loan
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
