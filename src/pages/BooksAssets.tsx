import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
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
const LENDING_VAULT_ADDRESS = "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1";

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
        <div className="container mx-auto py-20 px-8 space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-black pb-8">
                <div className="space-y-4">
                    <div className="inline-block bg-white text-black px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-black neo-shadow">
                        SYSTEM_STATE: IMMUTABLE_LEDGER
                    </div>
                    <h1 className="text-6xl font-black uppercase tracking-tighter leading-none">
                        The <br /> Books
                    </h1>
                    <p className="text-sm font-bold opacity-70 uppercase tracking-widest max-w-xl">
                        Real-time solvency tracking & Multi-Sig Audit Log. Every transaction is verifiable on-chain.
                    </p>
                </div>
                {statusMsg && (
                    <div className={`px-4 py-2 border-2 border-black font-black text-[10px] uppercase neo-shadow ${statusMsg.includes("Error") ? "bg-white text-red-600" : "bg-black text-white"}`}>
                        {statusMsg}
                    </div>
                )}
            </div>

            <div className="grid gap-10 md:grid-cols-2">
                {/* ASSETS COLUMN */}
                <div className="neo-card bg-white border-4 !p-0 overflow-hidden">
                    <div className="bg-black text-white px-8 py-4 border-b-4 border-black">
                        <h2 className="text-xl font-black uppercase tracking-widest">Assets (Collateral)</h2>
                        <p className="text-[10px] font-bold opacity-50 uppercase">Reserve ETH, Tokenized Hardware</p>
                    </div>
                    <div className="p-0">
                        <Table>
                            <TableHeader className="bg-zinc-100 border-b-4 border-black">
                                <TableRow>
                                    <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">Asset</TableHead>
                                    <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">Type</TableHead>
                                    <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-right">Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assets.map((asset) => (
                                    <TableRow key={asset.id} className="border-b-2 border-zinc-100 hover:bg-zinc-50 transition-colors">
                                        <TableCell className="px-8 py-6 font-black uppercase text-sm">
                                            {asset.name}
                                            {asset.verified && (
                                                <span className="ml-3 inline-block px-2 py-0.5 border-2 border-black bg-white text-[8px] font-black uppercase skew-x-[-10deg]">
                                                    Verified
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-8 py-6 text-[10px] font-bold opacity-50">{asset.type}</TableCell>
                                        <TableCell className="px-8 py-6 text-right font-black text-lg tracking-tighter">{asset.value}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* LIABILITIES COLUMN */}
                <div className="neo-card bg-white border-4 !p-0 overflow-hidden">
                    <div className="bg-black text-white px-8 py-4 border-b-4 border-black">
                        <h2 className="text-xl font-black uppercase tracking-widest">Liabilities (Issued)</h2>
                        <p className="text-[10px] font-bold opacity-50 uppercase">Stablecoins in circulation</p>
                    </div>
                    <div className="p-0">
                        <Table>
                            <TableHeader className="bg-zinc-100 border-b-4 border-black">
                                <TableRow>
                                    <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">Liability</TableHead>
                                    <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">Type</TableHead>
                                    <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-right">Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {liabilities.map((l) => (
                                    <TableRow key={l.id} className="border-b-2 border-zinc-100 hover:bg-zinc-50 transition-colors">
                                        <TableCell className="px-8 py-6 font-black uppercase text-sm">{l.name}</TableCell>
                                        <TableCell className="px-8 py-6 text-[10px] font-bold opacity-50">{l.type}</TableCell>
                                        <TableCell className="px-8 py-6 text-right font-black text-lg tracking-tighter">{l.value}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* AUDIT SECTION */}
            <div className="neo-card bg-white border-4 !p-0 overflow-hidden">
                <div className="bg-black text-white px-8 py-6 border-b-4 border-black flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-widest">Cryptographic Audit Log</h2>
                        <p className="text-[10px] font-bold opacity-50 uppercase mt-1">Pending loans require 3 signatures from the governance council.</p>
                    </div>
                    {isAuditor && (
                        <div className="bg-white text-black px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-black neo-shadow-sm skew-x-[-10deg]">
                            AUTH_LEVEL: AUDITOR
                        </div>
                    )}
                </div>
                <div className="p-8 space-y-8">
                    {/* Add Auditor Panel */}
                    <div className="p-6 border-4 border-black bg-zinc-50 flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-50 italic">Governance Recruitment</label>
                            <Input
                                type="text"
                                placeholder="0x... (New Auditor Address)"
                                value={newAuditorAddress}
                                onChange={(e) => setNewAuditorAddress(e.target.value)}
                                className="w-full bg-white border-4 border-black p-4 font-black text-sm focus:bg-zinc-100 outline-none"
                            />
                        </div>
                        <button
                            onClick={handleAddAuditor}
                            className="bg-black text-white px-8 py-4 border-4 border-black neo-shadow hover:neo-shadow-none transition-all font-black uppercase tracking-widest text-sm"
                        >
                            ENROLL_AUDITOR
                        </button>
                    </div>

                    {/* Pending Loans Table */}
                    <div className="border-4 border-black overflow-hidden">
                        <Table>
                            <TableHeader className="bg-zinc-100 border-b-4 border-black">
                                <TableRow>
                                    <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">STREAM_ID</TableHead>
                                    <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">BORROWER_ID</TableHead>
                                    <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">REQUEST_VAL</TableHead>
                                    <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">QUORUM</TableHead>
                                    <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-right">OPS</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingLoans.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="px-8 py-20 text-center font-black opacity-30 uppercase italic text-xl">
                                            NO_PENDING_STREAMS_DETECTED
                                        </TableCell>
                                    </TableRow>
                                ) : pendingLoans.map((loan) => (
                                    <TableRow key={loan.id} className="border-b-2 border-zinc-100 hover:bg-zinc-50 transition-colors">
                                        <TableCell className="px-8 py-6 font-mono text-sm opacity-50 italic">#{loan.id}</TableCell>
                                        <TableCell className="px-8 py-6 font-mono text-xs truncate max-w-[150px]">{loan.borrower}</TableCell>
                                        <TableCell className="px-8 py-6 font-black text-lg tracking-tighter">{loan.amount} <span className="text-[10px] opacity-40">$THY</span></TableCell>
                                        <TableCell className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black italic">{loan.approvalCount}/3 SIGNED</span>
                                                <div className="h-2 w-28 bg-white border-2 border-black p-0.5">
                                                    <div
                                                        className="h-full bg-black border border-black transition-all duration-1000"
                                                        style={{ width: `${(loan.approvalCount / 3) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 py-6 text-right space-x-3">
                                            {loan.approvalCount < 3 ? (
                                                <button
                                                    onClick={() => handleSignAsAuditor(loan.id)}
                                                    disabled={!isAuditor}
                                                    className="bg-black text-white px-4 py-2 border-2 border-black neo-shadow hover:neo-shadow-none transition-all font-black text-[10px] uppercase tracking-widest disabled:opacity-30"
                                                >
                                                    SIGN_DATA
                                                </button>
                                            ) : (
                                                <button
                                                    className="bg-zinc-400 text-black px-4 py-2 border-2 border-black neo-shadow hover:neo-shadow-none transition-all font-black text-[10px] uppercase tracking-widest"
                                                    onClick={() => handleRelease(loan.id)}
                                                >
                                                    EXECUTE_RELEASE
                                                </button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
