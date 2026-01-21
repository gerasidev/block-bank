import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { AlertCircle, Loader2 } from 'lucide-react';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import LendingVaultABI from '../../smart_contracts/artifacts/contracts/LendingVault.sol/LendingVault.json';

// Configuration - In a real app these would be in environment variables
const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.LENDING_VAULT;

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
    const connectWallet = async (forceSelect = false) => {
        if (!window.ethereum) return;

        // Respect explicit disconnect unless forced
        if (!forceSelect && localStorage.getItem('wallet_disconnected') === 'true') {
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            setAccount(await signer.getAddress());
            checkAuditorStatus(signer);
        } catch (err) {
            console.error("Connection failed", err);
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
        <div className="container mx-auto p-8 space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <h1 className="text-5xl font-black uppercase tracking-tighter bg-black text-white px-4 py-2 border-4 border-black inline-block neo-shadow-lg">
                        Audit Registry
                    </h1>
                    <p className="text-sm font-bold opacity-70 uppercase tracking-widest max-w-xl">
                        Vault Governance: Multi-signature verification required for all liquidity releases.
                    </p>
                </div>
                <div className="flex flex-col items-end gap-3 bg-white p-4 border-2 border-black neo-shadow">
                    <div className={`border-2 border-black uppercase font-black text-[10px] px-3 py-1 ${isAuditor ? 'bg-black text-white' : 'bg-white text-black'}`}>
                        {isAuditor ? "AUTH_LEVEL: AUDITOR" : "ACCESS: RESTRICTED"}
                    </div>
                    <div className="flex items-center gap-3">
                        <p className="text-[10px] font-black opacity-60">
                            {account ? account : "WALLET_OFFLINE"}
                        </p>
                        <button
                            className="bg-zinc-100 text-[10px] font-black uppercase px-2 py-1 border-2 border-black neo-shadow hover:neo-shadow-none transition-all"
                            onClick={handleSwitchAccount}
                        >
                            Switch
                        </button>
                    </div>
                </div>
            </div>

            {!isAuditor ? (
                <div className="bg-white border-4 border-black p-12 neo-shadow-lg text-center space-y-4">
                    <AlertCircle className="h-20 w-20 mx-auto border-4 border-black bg-white p-2" />
                    <h2 className="text-4xl font-black uppercase italic">Access Denied!</h2>
                    <p className="text-sm font-bold uppercase">
                        Current credentials lack "AUDITOR" permissions. Switch to a privileged address.
                    </p>
                    {!account && (
                        <button
                            onClick={() => connectWallet(true)}
                            className="bg-black text-white px-8 py-3 border-2 border-black neo-shadow font-black uppercase tracking-widest"
                        >
                            Authorize Wallet
                        </button>
                    )}
                </div>
            ) : (
                <div className="neo-card bg-white !p-0 overflow-hidden">
                    <div className="bg-black text-white px-6 py-4 border-b-2 border-black flex justify-between items-center">
                        <h2 className="text-xl font-black uppercase tracking-widest">Active Requests</h2>
                        <span className="text-[10px] opacity-60 font-mono">COUNT: {loans.length}</span>
                    </div>
                    <div className="p-0 overflow-x-auto">
                        {loading && loans.length === 0 ? (
                            <div className="flex justify-center items-center py-20 bg-zinc-50">
                                <Loader2 className="h-12 w-12 animate-spin text-black" />
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-zinc-100 border-b-2 border-black">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">ID</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Client & Asset</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Capital</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Audit Config</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Consensus</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Operations</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loans.map((loan) => (
                                        <tr key={loan.id} className="border-b border-zinc-200 hover:bg-zinc-50 transition-colors">
                                            <td className="px-6 py-4 font-black text-lg">#{loan.id}</td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-0.5">
                                                    <p className="font-black uppercase text-sm truncate max-w-[200px]" title={loan.description}>{loan.description || "NO_DATA"}</p>
                                                    <p className="text-[9px] font-mono opacity-50 truncate max-w-[150px]">{loan.borrower}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="inline-block bg-zinc-800 text-white px-2 py-0.5 border-2 border-black font-black text-xs neo-shadow-sm">
                                                    {Number(loan.amount).toLocaleString()} ETH
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {(loan.approvals === 0 && loan.canApprove) ? (
                                                    <div className="flex gap-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[8px] font-black uppercase opacity-60 italic">LEV_RATIO</span>
                                                            <input
                                                                type="number"
                                                                className="w-16 h-8 text-xs bg-white border-2 border-black focus:bg-zinc-100 px-2 font-black"
                                                                value={approvalParams[loan.id]?.leverage || "5"}
                                                                onChange={(e) => handleParamChange(loan.id, 'leverage', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[8px] font-black uppercase opacity-60 italic">RATE (BPS)</span>
                                                            <input
                                                                type="number"
                                                                className="w-20 h-8 text-xs bg-white border-2 border-black focus:bg-zinc-100 px-2 font-black"
                                                                value={approvalParams[loan.id]?.interest || "500"}
                                                                onChange={(e) => handleParamChange(loan.id, 'interest', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] font-black p-0.5 border border-black bg-zinc-100 text-center uppercase tracking-tighter">
                                                            {loan.leverageRatio > 0 ? `${loan.leverageRatio}X LEV` : "PENDING"}
                                                        </span>
                                                        <span className="text-[10px] font-black p-0.5 border border-black bg-zinc-100 text-center uppercase tracking-tighter">
                                                            {loan.interestRate > 0 ? `${loan.interestRate} BPS` : "PENDING"}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-black italic">{loan.approvals}/2</span>
                                                    <div className="h-4 w-20 border-2 border-black bg-white overflow-hidden p-0.5">
                                                        <div
                                                            className="h-full bg-black border border-black transition-all duration-700"
                                                            style={{ width: `${(loan.approvals / 2) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-3">
                                                    {loan.isReleased ? (
                                                        <div className="bg-zinc-100 border-2 border-black px-3 py-1 text-[10px] font-black uppercase italic animate-pulse">
                                                            COMPLETED_RELEASE
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {loan.canApprove && (
                                                                <button
                                                                    onClick={() => handleApprove(loan.id)}
                                                                    disabled={!!processingId}
                                                                    className="bg-black text-white px-4 py-1.5 border-2 border-black neo-shadow hover:neo-shadow-none active:translate-x-[1px] font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
                                                                >
                                                                    {processingId === loan.id ? "SYNCING..." : "APPROVE_ASSET"}
                                                                </button>
                                                            )}
                                                            {loan.approvals >= 2 && (
                                                                <button
                                                                    className="bg-zinc-400 text-black px-4 py-1.5 border-2 border-black neo-shadow hover:neo-shadow-none active:translate-x-[1px] font-black text-[10px] uppercase tracking-widest"
                                                                    onClick={() => handleRelease(loan.id)}
                                                                    disabled={!!processingId}
                                                                >
                                                                    EXECUTE_RELEASE
                                                                </button>
                                                            )}
                                                            {!loan.canApprove && loan.approvals < 2 && (
                                                                <div className="border-2 border-black px-3 py-1 bg-zinc-200 text-[10px] font-black uppercase skew-x-[-10deg]">
                                                                    VOTE_RECORDED
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
