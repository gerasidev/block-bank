import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Loader2, Globe, Search } from 'lucide-react';
import LendingVaultABI from '../../smart_contracts/artifacts/contracts/LendingVault.sol/LendingVault.json';
import { CONTRACT_ADDRESSES } from '../config/contracts';

// Updated Address from latest deployment
const VAULT_ADDRESS = CONTRACT_ADDRESSES.LENDING_VAULT;

interface PublicLoan {
    id: number;
    borrower: string;
    amount: string;
    description: string;
    status: 'Pending' | 'Active' | 'Repaid' | 'Ready';
    tokenId: string;
    startTime: number;
    approvals: number;
}

export default function PublicLoans() {
    const [loans, setLoans] = useState<PublicLoan[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchLoans();

        // Setup listener for real-time updates
        if (window.ethereum) {
            const provider = new ethers.BrowserProvider(window.ethereum as any);
            const vault = new ethers.Contract(VAULT_ADDRESS, LendingVaultABI.abi, provider);

            vault.on("LoanRequested", () => fetchLoans());
            vault.on("FundsReleased", () => fetchLoans());
            vault.on("RepaymentReceived", () => fetchLoans());

            return () => {
                vault.removeAllListeners();
            };
        }
    }, []);

    const fetchLoans = async () => {
        if (!window.ethereum) return;
        try {
            const provider = new ethers.BrowserProvider(window.ethereum as any);
            const vault = new ethers.Contract(VAULT_ADDRESS, LendingVaultABI.abi, provider);
            const nextId = await vault.nextLoanId();

            const fetchedLoans: PublicLoan[] = [];

            for (let i = 0; i < Number(nextId); i++) {
                const loan = await vault.loans(i);
                let status: PublicLoan['status'] = 'Pending';

                if (loan.isRepaid) status = 'Repaid';
                else if (loan.isReleased) status = 'Active';
                else if (Number(loan.approvalCount) >= 2) status = 'Ready';

                fetchedLoans.push({
                    id: i,
                    borrower: loan.borrower,
                    amount: ethers.formatEther(loan.amountLent),
                    description: loan.description,
                    status: status,
                    tokenId: loan.collateralTokenId.toString(),
                    startTime: Number(loan.startTime),
                    approvals: Number(loan.approvalCount)
                });
            }
            // Sort by newest first
            setLoans(fetchedLoans.reverse());
        } catch (err) {
            console.error("Error fetching public loans:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredLoans = loans.filter(l =>
        l.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.borrower.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.id.toString().includes(searchTerm)
    );

    return (
        <div className="container mx-auto p-8 space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-black pb-8">
                <div className="space-y-4">
                    <div className="inline-block bg-white text-black px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-black neo-shadow-green">
                        REGISTRY_STATUS: PUBLIC_DEEP_LINK
                    </div>
                    <h1 className="text-6xl font-black uppercase tracking-tighter leading-none">
                        Global <br /> Ledger
                    </h1>
                    <p className="text-sm font-bold opacity-70 uppercase tracking-widest max-w-xl">
                        Universal transparency layer. Verification of all atoms-to-bits transitions within the protocol.
                    </p>
                </div>

                <div className="w-full md:w-80">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-black" />
                        <input
                            placeholder="SEARCH_LOAN_UID..."
                            className="w-full bg-white border-4 border-black p-4 pl-12 font-black text-sm focus:bg-yellow-50 outline-none neo-shadow-lg"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="neo-card bg-white !p-0 border-4">
                <div className="bg-[#10b981] text-white px-8 py-6 flex justify-between items-center border-b-4 border-black">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black uppercase tracking-widest flex items-center gap-3">
                            Immutable Record
                        </h2>
                        <p className="text-[10px] font-black opacity-80 uppercase">Total Verified Events: {loans.length}</p>
                    </div>
                    <Globe className="h-8 w-8 text-white opacity-50" />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-zinc-100 border-b-4 border-black">
                            <tr>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">UID</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">COLLATERAL_DESC</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">BORROWER</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">LIQUIDITY_THY</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">SIGNATURES</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">PROTOCOL_STATUS</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-right">TIMESTAMP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-8 py-20 text-center">
                                        <div className="flex justify-center items-center gap-3 text-2xl font-black uppercase animate-pulse">
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                            SYNCING_BLOCKCHAIN...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLoans.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-8 py-20 text-center font-black opacity-30 uppercase italic text-xl">
                                        NO_MATCHING_RECORDS_DETECTED
                                    </td>
                                </tr>
                            ) : (
                                filteredLoans.map((loan) => (
                                    <tr key={loan.id} className="border-b-2 border-zinc-100 hover:bg-zinc-50 transition-colors">
                                        <td className="px-8 py-6 font-mono text-sm opacity-50 italic">#{loan.id}</td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-black text-sm uppercase tracking-tight">{loan.description}</span>
                                                <span className="text-[9px] font-black opacity-40 font-mono">TOKEN_ID: {loan.tokenId}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="font-black text-[10px] bg-zinc-100 p-2 border-2 border-black inline-block break-all max-w-[200px]">
                                                {loan.borrower}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 font-black text-lg tracking-tighter">
                                            {Number(loan.amount).toLocaleString()}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] font-black italic">{loan.approvals}/2 SIGNED</span>
                                                <div className="h-2 w-20 bg-white border-2 border-black p-0.5">
                                                    <div className="h-full bg-blue-500" style={{ width: `${Math.min((loan.approvals / 2) * 100, 100)}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={`
                                                inline-block px-3 py-1 border-2 border-black text-[10px] font-black uppercase skew-x-[-12deg]
                                                ${loan.status === 'Active' ? 'bg-green-400' :
                                                    loan.status === 'Repaid' ? 'bg-blue-400' :
                                                        loan.status === 'Ready' ? 'bg-yellow-400' : 'bg-zinc-100'}
                                            `}>
                                                {loan.status}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right font-black text-[10px] opacity-40">
                                            {loan.startTime > 0 ? new Date(loan.startTime * 1000).toLocaleDateString() : 'N/A'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
