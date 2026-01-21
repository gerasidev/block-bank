import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Loader2, Zap, Plus, ClipboardList } from 'lucide-react';
import LendingVaultABI from '../../smart_contracts/artifacts/contracts/LendingVault.sol/LendingVault.json';
import ThyseasRWA_ABI from '../../smart_contracts/artifacts/contracts/ThyseasRWA.sol/ThyseasRWA.json';
import ThyseasToken_ABI from '../../smart_contracts/artifacts/contracts/ThyseasToken.sol/ThyseasToken.json';
import { CONTRACT_ADDRESSES } from '../config/contracts';

// Addresses from our deploy_local.js output
const VAULT_ADDRESS = CONTRACT_ADDRESSES.LENDING_VAULT;
const RWA_ADDRESS = CONTRACT_ADDRESSES.THYSEAS_RWA;
const THYSEAS_TOKEN_ADDRESS = CONTRACT_ADDRESSES.THYSEAS_TOKEN;

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

    const [loanAmount, setLoanAmount] = useState("10");
    const [statusMsg, setStatusMsg] = useState("");
    const [myLoans, setMyLoans] = useState<BorrowerLoan[]>([]);

    const connectWallet = async (forceSelect = false) => {
        if (!window.ethereum) return;

        // Respect explicit disconnect unless forced
        if (!forceSelect && localStorage.getItem('wallet_disconnected') === 'true') {
            return;
        }

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
                0, // Valuation irrelevant/hype-based
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

    const handleRepay = async (id: number, _amount: string) => {
        if (!window.ethereum) return;
        setLoading(true);
        setStatusMsg(`Processing Repayment for Loan #${id}...`);

        try {
            const provider = new ethers.BrowserProvider(window.ethereum as any);
            const signer = await provider.getSigner();
            const vaultContract = new ethers.Contract(VAULT_ADDRESS, LendingVaultABI.abi, signer);

            // 1. Approve Token Spending (Fix for execution reverted)
            setStatusMsg("Step 1/2: Approving Repayment...");
            const tokenContract = new ethers.Contract(THYSEAS_TOKEN_ADDRESS, ThyseasToken_ABI.abi, signer);
            const approveTx = await tokenContract.approve(VAULT_ADDRESS, ethers.MaxUint256);
            await approveTx.wait();

            // 2. Repay Loan
            setStatusMsg("Step 2/2: Repaying Loan...");
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
        <div className="container mx-auto p-8 space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-black pb-8">
                <div className="space-y-4">
                    <div className="inline-block bg-white text-black px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-black neo-shadow">
                        ACCESS_LEVEL: BORROWER
                    </div>
                    <h1 className="text-6xl font-black uppercase tracking-tighter leading-none">
                        Capital <br /> Request
                    </h1>
                    <p className="text-sm font-bold opacity-70 uppercase tracking-widest max-w-xl">
                        Lock physical assets. Stream digital liquidity. Zero trust verification architecture.
                    </p>
                </div>
                {account && (
                    <div className="bg-white p-6 border-4 border-black neo-shadow-lg text-right">
                        <p className="text-[10px] font-black uppercase mb-2 opacity-50 tracking-tighter italic">AUTHENTICATED_IDENTITY</p>
                        <div className="font-black text-xs break-all bg-zinc-100 p-2 border-2 border-black">
                            {account}
                        </div>
                    </div>
                )}
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4 space-y-8">
                    <div className="neo-card bg-white !p-8 border-4">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                                    <Plus className="h-6 w-6 border-2 border-black bg-white" />
                                    New Request
                                </h2>
                                <p className="text-[10px] font-bold uppercase opacity-70">Convert atoms to bits instantly.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-70 italic">Asset Description</label>
                                    <input
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-white border-4 border-black p-3 font-black text-sm focus:bg-zinc-50 outline-none"
                                        placeholder="E.G. SERIES A STARTUP"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-70 italic">Registry Name</label>
                                    <input
                                        value={assetName}
                                        onChange={(e) => setAssetName(e.target.value)}
                                        className="w-full bg-white border-4 border-black p-3 font-black text-sm focus:bg-zinc-50 outline-none"
                                        placeholder="E.G. PROJECT PHOENIX #01"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-70 italic">Leverage Amount (ETH)</label>
                                    <input
                                        type="number"
                                        value={loanAmount}
                                        onChange={(e) => setLoanAmount(e.target.value)}
                                        className="w-full bg-white border-4 border-black p-3 font-black text-sm focus:bg-zinc-50 outline-none"
                                    />
                                </div>

                                <button
                                    className="w-full bg-black text-white py-4 border-4 border-black neo-shadow hover:neo-shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all font-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
                                    onClick={handleMintAndRequest}
                                    disabled={loading || !account || !description}
                                >
                                    {loading ? <Loader2 className="animate-spin h-6 w-6" /> : <Zap className="h-6 w-6" />}
                                    {loading ? "PROCESSING..." : "INIT_REQUEST"}
                                </button>

                                {statusMsg && (
                                    <div className="bg-white border-2 border-black p-2 text-center">
                                        <p className={`text-[10px] font-black uppercase tracking-tighter ${statusMsg.includes("Error") ? "text-red-600" : "text-zinc-600 italic animate-pulse"}`}>
                                            {statusMsg}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8">
                    <div className="neo-card bg-white !p-0 border-4 h-full">
                        <div className="bg-black text-white px-8 py-6 flex justify-between items-center border-b-4 border-black">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black uppercase tracking-widest flex items-center gap-3">
                                    <ClipboardList className="h-6 w-6" />
                                    Active Protocols
                                </h2>
                                <p className="text-[10px] font-bold opacity-50 uppercase">Individual Transaction Ledger</p>
                            </div>
                            <button
                                onClick={() => account && fetchMyLoans(account, new ethers.BrowserProvider(window.ethereum as any))}
                                className="bg-zinc-100 text-black p-2 border-2 border-black neo-shadow hover:neo-shadow-none transition-all text-[10px] font-black"
                            >
                                REFRESH
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-zinc-100 border-b-4 border-black">
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">STREAM_ID</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">LIQUIDITY</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">SIGNATURES</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">STATUS</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-right">OPS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myLoans.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center font-black opacity-30 uppercase italic text-xl">
                                                NO_ACTIVE_STREAMS_DETECTED
                                            </td>
                                        </tr>
                                    ) : myLoans.map((loan) => (
                                        <tr key={loan.id} className="border-b-2 border-zinc-100 hover:bg-zinc-50 transition-colors">
                                            <td className="px-8 py-6 font-mono text-sm opacity-50 italic">#{loan.id}</td>
                                            <td className="px-8 py-6 font-black text-lg tracking-tighter">
                                                {loan.amount} <span className="text-[10px] opacity-40">ETH</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-black italic">{loan.approvals}/2 SIGNED</span>
                                                    <div className="h-2 w-28 bg-white border-2 border-black p-0.5">
                                                        <div
                                                            className="h-full bg-black border border-black transition-all duration-1000"
                                                            style={{ width: `${(loan.approvals / 2) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={`
                                                    inline-block px-3 py-1 border-2 border-black text-[10px] font-black uppercase skew-x-[-10deg]
                                                    ${loan.isReleased ? 'bg-zinc-800 text-white' : 'bg-transparent'}
                                                `}>
                                                    {loan.status}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {loan.isReleased && !loan.isRepaid && (
                                                    <button
                                                        className="bg-white text-red-600 px-4 py-2 border-2 border-black neo-shadow hover:neo-shadow-none active:translate-x-[1px] font-black text-[10px] uppercase"
                                                        onClick={() => handleRepay(loan.id, loan.amount)}
                                                    >
                                                        REPAY_LIQUIDITY
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
            </div>
        </div>
    );
}
