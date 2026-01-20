import { Link } from 'react-router-dom';
import { Wallet, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import LendingVaultABI from '../../smart_contracts/artifacts/contracts/LendingVault.sol/LendingVault.json';

export default function Navbar() {
    const [account, setAccount] = useState<string | null>(null);
    const [balance, setBalance] = useState<string | null>(null);
    const [chainId, setChainId] = useState<number | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [bankLiquidity, setBankLiquidity] = useState<string>("0.0");
    const [maxLeverage, setMaxLeverage] = useState<string>("0");
    const [isWarping, setIsWarping] = useState(false);
    const [chainTime, setChainTime] = useState<number>(Math.floor(Date.now() / 1000));

    const VAULT_ADDRESS = CONTRACT_ADDRESSES.LENDING_VAULT;
    const isLocal = chainId === 31337 || chainId === 1337;

    const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    const fetchBankStats = async (provider: ethers.BrowserProvider) => {
        try {
            const vault = new ethers.Contract(VAULT_ADDRESS, LendingVaultABI.abi, provider);
            const extraLiquidity = await provider.getBalance(VAULT_ADDRESS);
            setBankLiquidity(ethers.formatEther(extraLiquidity));
            const leverage = await vault.MAX_PLATFORM_LEVERAGE();
            setMaxLeverage(leverage.toString());
        } catch (err) {
            console.error("Failed to fetch bank stats", err);
        }
    };

    const loadAccountData = async (provider: ethers.BrowserProvider) => {
        try {
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            const balanceBigInt = await provider.getBalance(address);
            const network = await provider.getNetwork();
            const block = await provider.getBlock('latest');

            setAccount(address);
            setBalance(ethers.formatEther(balanceBigInt));
            setChainId(Number(network.chainId));
            if (block) setChainTime(Number(block.timestamp));
            fetchBankStats(provider);
        } catch (err: any) {
            console.error("Error loading account data", err);
        }
    };

    const advanceTime = async (seconds: number) => {
        if (!window.ethereum || !isLocal) return;
        try {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            await provider.send("evm_increaseTime", [seconds]);
            await provider.send("evm_mine", []);
            await loadAccountData(provider);
        } catch (err) {
            console.error("Failed to advance time", err);
        }
    };

    const toggleWarp = () => setIsWarping(!isWarping);

    const resetSession = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
    };

    const disconnectWallet = () => {
        setAccount(null);
        setBalance(null);
        setChainId(null);
        localStorage.setItem('wallet_disconnected', 'true');
        setIsMenuOpen(false);
    };

    const connectWallet = async () => {
        if ((window as any).ethereum) {
            try {
                localStorage.removeItem('wallet_disconnected');
                const provider = new ethers.BrowserProvider((window as any).ethereum);
                await (window as any).ethereum.request({
                    method: "wallet_requestPermissions",
                    params: [{ eth_accounts: {} }],
                });
                await provider.send("eth_requestAccounts", []);
                await loadAccountData(provider);
            } catch (error) {
                console.error("Connection failed", error);
            }
        } else {
            alert('Please install MetaMask!');
        }
    };

    useEffect(() => {
        const checkConnection = async () => {
            if ((window as any).ethereum) {
                if (localStorage.getItem('wallet_disconnected') === 'true') return;
                const provider = new ethers.BrowserProvider((window as any).ethereum);
                try {
                    const accounts = await provider.listAccounts();
                    if (accounts.length > 0) await loadAccountData(provider);
                } catch (err) {
                    console.error("Failed to list accounts", err);
                }
                (window as any).ethereum.on('accountsChanged', () => window.location.reload());
                (window as any).ethereum.on('chainChanged', () => window.location.reload());
            }
        };
        checkConnection();
        return () => {
            if ((window as any).ethereum) {
                (window as any).ethereum.removeAllListeners('accountsChanged');
                (window as any).ethereum.removeAllListeners('chainChanged');
            }
        };
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isWarping && isLocal) {
            interval = setInterval(() => advanceTime(31536000), 60000);
        }
        return () => interval && clearInterval(interval);
    }, [isWarping, isLocal]);

    return (
        <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
                <Link to="/" className="flex items-center space-x-2 font-bold text-xl tracking-tighter hover:opacity-80 transition-opacity">
                    <span className="text-foreground">$ THYSEAS</span>
                </Link>

                <button className="md:hidden p-2 text-foreground hover:bg-secondary rounded-md" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>

                <div className="hidden md:flex flex-1 items-center justify-end space-x-4 text-[10px] font-bold uppercase tracking-widest">
                    <a href="#features" className="hover:text-primary transition-colors">Features</a>
                    <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                    <Link to="/books" className="hover:text-primary transition-colors">Books</Link>
                    <Link to="/loans" className="hover:text-primary transition-colors">Registry</Link>
                    <Link to="/lender" className="hover:text-primary transition-colors text-blue-600">Lender</Link>
                    <Link to="/borrower" className="hover:text-primary transition-colors text-orange-600">Borrow</Link>

                    <Link to="/auditor" className="bg-zinc-950 text-white px-3 py-1 neo-shadow hover:bg-zinc-800 transition-all border-2 border-black">
                        Audit
                    </Link>

                    {/* BANK STATS DISPLAY */}
                    <div className="hidden lg:flex items-center gap-3 px-3 py-1 border-2 border-black bg-yellow-400 neo-shadow">
                        <div className="flex flex-col items-end">
                            <span className="text-[7px] opacity-70">Reserve</span>
                            <span className="text-[10px] font-black">{parseFloat(bankLiquidity).toFixed(2)} ETH</span>
                        </div>
                        <div className="w-[1px] h-6 bg-black/20" />
                        <div className="flex flex-col items-end">
                            <span className="text-[7px] opacity-70">Max Lev</span>
                            <span className="text-[10px] font-black">{maxLeverage}x</span>
                        </div>
                    </div>

                    {/* TIME SIMULATION (Local Only) */}
                    {isLocal && (
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1 border-2 border-black bg-blue-400 neo-shadow">
                            <div className="flex flex-col items-end">
                                <span className="text-[7px] opacity-70">Sim Date</span>
                                <span className="text-[10px] font-black">
                                    {new Date(chainTime * 1000).toLocaleDateString()}
                                </span>
                            </div>
                            <button
                                onClick={() => advanceTime(31536000)}
                                className="bg-white px-2 py-0.5 border border-black text-[9px] font-black hover:bg-black hover:text-white transition-colors"
                            >
                                +1Y
                            </button>
                            <label className="flex items-center gap-1 cursor-pointer">
                                <input type="checkbox" checked={isWarping} onChange={toggleWarp} className="w-3 h-3 accent-black" />
                                <span className="text-[8px] font-black">Warp</span>
                            </label>
                        </div>
                    )}

                    {account ? (
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end leading-none border-2 border-black bg-white px-2 py-1 neo-shadow text-black">
                                <span className="text-[10px] font-black">{formatAddress(account)}</span>
                                <span className="text-[9px] opacity-70">{balance ? parseFloat(balance).toFixed(2) : '0'} ETH</span>
                            </div>
                            <button onClick={disconnectWallet} className="bg-red-500 text-white p-1 border-2 border-black neo-shadow hover:neo-shadow-none active:translate-x-[1px] transition-all">
                                <X className="h-4 w-4" />
                            </button>
                            <button onClick={resetSession} className="bg-zinc-200 p-1 border-2 border-black neo-shadow hover:neo-shadow-none active:translate-x-[1px] transition-all" title="Hard Reset">
                                <span className="text-[8px] font-bold">RST</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            className="bg-[#10b981] text-white px-4 py-2 border-2 border-black neo-btn font-black text-xs uppercase tracking-widest flex items-center gap-2"
                            onClick={connectWallet}
                        >
                            <Wallet className="h-4 w-4" /> Connect
                        </button>
                    )}
                </div>
            </div>

            {isMenuOpen && (
                <div className="md:hidden border-t p-4 space-y-4 bg-background">
                    <Link to="/dashboard" className="block text-foreground/60">Dashboard</Link>
                    <Link to="/books" className="block text-foreground/60">Books & Audit</Link>
                    <Link to="/lender" className="block text-foreground/60">Lender</Link>
                    <Link to="/auditor" className="block text-muted-foreground font-medium">Auditor Only</Link>
                    <Link to="/borrower" className="block text-muted-foreground font-medium">Borrower</Link>

                    {account ? (
                        <>
                            <button className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium border border-red-500/20 text-red-500 h-9 px-4 py-2 mt-4" onClick={disconnectWallet}>
                                Disconnect {formatAddress(account)}
                            </button>
                            <button className="w-full text-[10px] text-muted-foreground/40 uppercase tracking-widest py-2" onClick={resetSession}>Hard Reset Cache</button>
                        </>
                    ) : (
                        <button className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background h-9 px-4 py-2 mt-4" onClick={connectWallet}>
                            <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
                        </button>
                    )}
                </div>
            )}
        </nav>
    );
}
