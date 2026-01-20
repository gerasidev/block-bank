import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import LendingVaultABI from '../../smart_contracts/artifacts/contracts/LendingVault.sol/LendingVault.json';
import { CONTRACT_ADDRESSES } from '../config/contracts';

const LENDING_VAULT_ADDRESS = CONTRACT_ADDRESSES.LENDING_VAULT;
const LOCK_PERIOD_DAYS = 30;

interface Deposit {
    index: number;
    amount: string;
    timestamp: number;
    lockUntil: number;
    withdrawn: boolean;
    daysRemaining: number;
    canWithdraw: boolean;
}

export default function LenderDashboard() {
    const [deposits, setDeposits] = useState<Deposit[]>([]);

    const [statusMsg, setStatusMsg] = useState("");
    const [account, setAccount] = useState<string>("");

    const checkWallet = async (forceSelect = false) => {
        if (!window.ethereum) return;

        // Respect explicit disconnect unless forced
        if (!forceSelect && localStorage.getItem('wallet_disconnected') === 'true') {
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.listAccounts();
            if (accounts.length > 0) {
                setAccount(accounts[0].address);
            }
        } catch (err) {
            console.error("Connection check failed", err);
        }
    };

    useEffect(() => {
        if (localStorage.getItem('wallet_disconnected') !== 'true') {
            checkWallet();
        }
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
        }
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            }
        };
    }, []);

    useEffect(() => {
        if (account) {
            fetchDeposits();
        }
    }, [account]);

    const handleAccountsChanged = async (accounts: any[]) => {
        if (accounts.length > 0) {
            setAccount(accounts[0]);
        } else {
            setAccount("");
            setDeposits([]);
        }
    };

    const fetchDeposits = async () => {
        if (!window.ethereum || !account) return;

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(LENDING_VAULT_ADDRESS, LendingVaultABI.abi, provider);

            // Get blockchain time instead of browser time for accurate simulation
            const block = await provider.getBlock('latest');
            const now = block ? Number(block.timestamp) : Math.floor(Date.now() / 1000);

            const depositsCount = await contract.getDepositsCount(account);

            const depositsData: Deposit[] = [];
            for (let i = 0; i < Number(depositsCount); i++) {
                const deposit = await contract.depositsByLender(account, i);

                const lockUntil = Number(deposit.lockUntil);
                const daysRemaining = Math.max(0, Math.ceil((lockUntil - now) / 86400));
                const canWithdraw = now >= lockUntil && !deposit.withdrawn;

                depositsData.push({
                    index: i,
                    amount: ethers.formatEther(deposit.amount),
                    timestamp: Number(deposit.timestamp),
                    lockUntil: lockUntil,
                    withdrawn: deposit.withdrawn,
                    daysRemaining: daysRemaining,
                    canWithdraw: canWithdraw
                });
            }

            setDeposits(depositsData);
        } catch (e) {
            console.error("Error fetching deposits", e);
        }
    };



    const handleWithdraw = async (depositIndex: number) => {
        try {
            setStatusMsg("Withdrawing...");
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(LENDING_VAULT_ADDRESS, LendingVaultABI.abi, signer);

            const tx = await contract.withdrawLiquidity(depositIndex);
            await tx.wait();

            setStatusMsg("Successfully withdrawn with interest!");
            fetchDeposits();
        } catch (err: any) {
            setStatusMsg("Error: " + (err.reason || err.message));
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString();
    };

    return (
        <div className="container mx-auto p-8 space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-black pb-8">
                <div className="space-y-4">
                    <div className="inline-block bg-zinc-950 text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-black neo-shadow-blue">
                        POSITION: LIQUIDITY_PROVIDER
                    </div>
                    <h1 className="text-6xl font-black uppercase tracking-tighter leading-none">
                        Yield <br /> Engine
                    </h1>
                    <p className="text-sm font-bold opacity-70 uppercase tracking-widest max-w-xl">
                        Stake capital. Underwrite hardware. Earn protocol incentives. Locked for {LOCK_PERIOD_DAYS} days.
                    </p>
                </div>
                {account && (
                    <div className="bg-white p-6 border-4 border-black neo-shadow-lg text-right">
                        <p className="text-[10px] font-black uppercase mb-2 opacity-50 tracking-tighter italic">ACTIVE_PROVIDER</p>
                        <div className="font-black text-xs break-all bg-zinc-100 p-2 border-2 border-black">
                            {account}
                        </div>
                    </div>
                )}
            </div>

            {statusMsg && (
                <div className={`p-4 border-4 border-black font-black uppercase text-center neo-shadow-lg ${statusMsg.includes("Error") ? "bg-red-400" : "bg-green-400"}`}>
                    {statusMsg}
                </div>
            )}

            <div className="neo-card bg-white !p-0 border-4">
                <div className="bg-black text-white px-8 py-6 flex justify-between items-center border-b-4 border-black">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black uppercase tracking-widest flex items-center gap-3">
                            Stake Ledger
                        </h2>
                        <p className="text-[10px] font-bold opacity-50 uppercase">Individual Proof of Liquidity</p>
                    </div>
                    <button
                        onClick={() => fetchDeposits()}
                        className="bg-yellow-400 text-black px-4 py-2 border-2 border-black neo-shadow hover:neo-shadow-none transition-all text-[10px] font-black uppercase tracking-widest"
                    >
                        SYNC_STATE
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-zinc-100 border-b-4 border-black">
                            <tr>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">DEPOSIT_ID</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">PRINCIPAL</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">TIMESTAMP</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">RELEASES</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">PROTOCOL_STATE</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-right">OPERATIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deposits.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center font-black opacity-30 uppercase italic text-xl">
                                        NO_ACTIVE_LIQUIDITY_DETECTED
                                    </td>
                                </tr>
                            ) : deposits.map((deposit) => (
                                <tr key={deposit.index} className="border-b-2 border-zinc-100 hover:bg-zinc-50 transition-colors">
                                    <td className="px-8 py-6 font-mono text-sm opacity-50 italic">#{deposit.index + 1}</td>
                                    <td className="px-8 py-6 font-black text-lg tracking-tighter">
                                        {deposit.amount} <span className="text-[10px] opacity-40">THY</span>
                                    </td>
                                    <td className="px-8 py-6 font-black text-xs uppercase opacity-70">
                                        {formatDate(deposit.timestamp)}
                                    </td>
                                    <td className="px-8 py-6 font-black text-xs uppercase opacity-70">
                                        {formatDate(deposit.lockUntil)}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className={`
                                            inline-block px-3 py-1 border-2 border-black text-[10px] font-black uppercase skew-x-[-10deg]
                                            ${deposit.withdrawn ? 'bg-zinc-200 opacity-50' :
                                                deposit.canWithdraw ? 'bg-green-400' : 'bg-yellow-100'}
                                        `}>
                                            {deposit.withdrawn ? "IDLE_RELEASED" :
                                                deposit.canWithdraw ? "YIELD_READY" :
                                                    `LOCKED (${deposit.daysRemaining}D)`}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {!deposit.withdrawn && deposit.canWithdraw ? (
                                            <button
                                                className="bg-[#10b981] text-white px-4 py-2 border-2 border-black neo-shadow hover:neo-shadow-none active:translate-x-[1px] font-black text-[10px] uppercase tracking-widest"
                                                onClick={() => handleWithdraw(deposit.index)}
                                            >
                                                WITHDRAW_TOTAL
                                            </button>
                                        ) : (
                                            <button className="bg-zinc-100 text-black px-4 py-2 border-2 border-black opacity-30 font-black text-[10px] uppercase cursor-not-allowed" disabled>
                                                {deposit.withdrawn ? "RELEASED" : "FROZEN"}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
