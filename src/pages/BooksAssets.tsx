import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import LendingVaultABI from '../abis/LendingVault.json';

// --- Types ---
export interface Asset {
    id: number;
    name: string;
    value: string;
    type: string;
    verified: boolean;
}

export interface Liability {
    id: number;
    name: string;
    value: string;
    type: string;
}

export interface PendingLoan {
    id: number;
    tokenId: number;
    borrower: string;
    amount: string;
    interest: number;
    approvalCount: number;
    isActive: boolean;
}

// TODO: Replace with deployed address after user deploys
const LENDING_VAULT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export default function BooksAssets() {
    // --- State ---
    const [assets] = useState<Asset[]>([
        { id: 1, name: 'ETH Reserve', value: '0.0 ETH', type: 'HARD_ASSET', verified: true },
    ]);
    const [liabilities] = useState<Liability[]>([
        { id: 1, name: '$THY Circulation', value: '0.0 $THY', type: 'STABLECOIN' },
    ]);
    const [pendingLoans, setPendingLoans] = useState<PendingLoan[]>([]);

    // Admin / User State
    const [, setAccount] = useState<string>("");
    const [isAuditor, setIsAuditor] = useState(false);
    const [newAuditorAddress, setNewAuditorAddress] = useState("");
    const [statusMsg, setStatusMsg] = useState("");

    // --- Effects ---
    useEffect(() => {
        checkWallet();
        fetchContractData();

        // Listen for account changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
        }
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            }
        };
    }, []);

    // --- Connection Logic ---
    const checkWallet = async () => {
        if (window.ethereum) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.listAccounts();
            if (accounts.length > 0) {
                setAccount(accounts[0].address);
                checkIfAuditor(accounts[0].address, provider);
            }
        }
    };

    const handleAccountsChanged = async (accounts: any[]) => {
        if (accounts.length > 0) {
            setAccount(accounts[0]);
            const provider = new ethers.BrowserProvider(window.ethereum);
            checkIfAuditor(accounts[0], provider);
            fetchContractData();
        } else {
            setAccount("");
            setIsAuditor(false);
        }
    };

    const checkIfAuditor = async (addr: string, provider: ethers.BrowserProvider) => {
        try {
            const contract = new ethers.Contract(LENDING_VAULT_ADDRESS, LendingVaultABI.abi, provider);
            const isAuth = await contract.auditors(addr);
            setIsAuditor(isAuth);
        } catch (e) {
            console.log("Not connected to correct network or contract not deployed yet.");
        }
    };

    const fetchContractData = async () => {
        if (!window.ethereum) return;
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(LENDING_VAULT_ADDRESS, LendingVaultABI.abi, provider);

        try {
            // Fetch Loans (Naive fetch first 5 for demo)
            const loansData: PendingLoan[] = [];
            for (let i = 0; i < 5; i++) {
                try {
                    const loan = await contract.loans(i);
                    // Check if initialized
                    if (loan.borrower === ethers.ZeroAddress) continue;

                    loansData.push({
                        id: i,
                        tokenId: Number(loan.collateralTokenId),
                        borrower: loan.borrower,
                        amount: ethers.formatEther(loan.amount),
                        interest: Number(loan.interestRate),
                        approvalCount: Number(loan.approvalCount),
                        isActive: loan.isActive
                    });
                } catch (err) {
                    break;
                }
            }
            setPendingLoans(loansData);
        } catch (e) {
            console.error("Error fetching data", e);
        }
    };

    // --- Actions ---
    const handleAddAuditor = async () => {
        if (!ethers.isAddress(newAuditorAddress)) {
            setStatusMsg("Invalid Address");
            return;
        }
        try {
            setStatusMsg("Adding Auditor...");
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(LENDING_VAULT_ADDRESS, LendingVaultABI.abi, signer);

            const tx = await contract.setAuditor(newAuditorAddress, true);
            await tx.wait();
            setStatusMsg("Auditor Added Successfully!");
            setNewAuditorAddress("");
        } catch (err: any) {
            setStatusMsg("Error: " + (err.reason || err.message));
        }
    };

    const handleSignAsAuditor = async (loanId: number) => {
        try {
            setStatusMsg("Signing...");
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(LENDING_VAULT_ADDRESS, LendingVaultABI.abi, signer);

            const tx = await contract.approveLoan(loanId);
            await tx.wait();
            setStatusMsg("Signed successfully!");
            fetchContractData(); // Refresh
        } catch (err: any) {
            setStatusMsg("Error signing: " + (err.reason || err.message));
        }
    };

    const handleRelease = async (loanId: number) => {
        try {
            setStatusMsg("Releasing Funds...");
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(LENDING_VAULT_ADDRESS, LendingVaultABI.abi, signer);

            const tx = await contract.releaseFunds(loanId);
            await tx.wait();
            setStatusMsg("Funds Released!");
            fetchContractData();
        } catch (err: any) {
            setStatusMsg("Error releasing: " + (err.reason || err.message));
        }
    };

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">The Books</h2>
                <p className="text-muted-foreground">
                    Real-time solvency tracking & Multi-Sig Audit Log.
                </p>
                {statusMsg && <Badge variant={statusMsg.includes("Error") ? "destructive" : "default"}>{statusMsg}</Badge>}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* ASSETS COLUMN */}
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">Assets (Collateral)</CardTitle>
                        <CardDescription>Reserve ETH, Tokenized Hardware</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Asset</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assets.map((asset) => (
                                    <TableRow key={asset.id}>
                                        <TableCell className="font-medium">
                                            {asset.name}
                                            {asset.verified && <Badge variant="secondary" className="ml-2 bg-secondary text-foreground border-border">Verified</Badge>}
                                        </TableCell>
                                        <TableCell>{asset.type}</TableCell>
                                        <TableCell className="text-right font-mono">{asset.value}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* LIABILITIES COLUMN */}
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">Liabilities (Issued)</CardTitle>
                        <CardDescription>Stablecoins in circulation</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Liability</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {liabilities.map((l) => (
                                    <TableRow key={l.id}>
                                        <TableCell className="font-medium">{l.name}</TableCell>
                                        <TableCell>{l.type}</TableCell>
                                        <TableCell className="text-right font-mono">{l.value}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* AUDIT SECTION */}
            <Card className="border border-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Cryptographic Audit Log
                        {isAuditor && <Badge className="bg-primary text-primary-foreground">You are an Auditor</Badge>}
                    </CardTitle>
                    <CardDescription>
                        Pending loans require <strong>3/5 signatures</strong> from the governance council.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Add Auditor Panel */}
                    <div className="flex w-full items-center space-x-2 p-4 border rounded-lg bg-secondary">
                        <Input
                            type="text"
                            placeholder="0x... (New Auditor Address)"
                            value={newAuditorAddress}
                            onChange={(e) => setNewAuditorAddress(e.target.value)}
                            className="max-w-md bg-background"
                        />
                        <Button onClick={handleAddAuditor} variant="outline">Add Auditor</Button>
                    </div>

                    {/* Pending Loans Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Loan ID</TableHead>
                                    <TableHead>Borrower</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Approvals (Req 3)</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingLoans.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            No pending loans found on chain.
                                        </TableCell>
                                    </TableRow>
                                ) : pendingLoans.map((loan) => (
                                    <TableRow key={loan.id}>
                                        <TableCell>#{loan.id}</TableCell>
                                        <TableCell className="font-mono text-xs">{loan.borrower}</TableCell>
                                        <TableCell>{loan.amount} $THY</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold">{loan.approvalCount}/3</span>
                                                <div className="h-2 w-24 bg-secondary rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary"
                                                        style={{ width: `${(loan.approvalCount / 3) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {loan.approvalCount < 3 ? (
                                                <Button size="sm" onClick={() => handleSignAsAuditor(loan.id)} disabled={!isAuditor}>
                                                    Sign
                                                </Button>
                                            ) : (
                                                <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => handleRelease(loan.id)}>
                                                    Release Funds
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
