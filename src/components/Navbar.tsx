import { Link } from 'react-router-dom';
import { Wallet, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function Navbar() {
    const [account, setAccount] = useState<string | null>(null);
    const [balance, setBalance] = useState<string | null>(null);
    const [chainId, setChainId] = useState<number | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Helper to format address
    const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    const loadAccountData = async (provider: ethers.BrowserProvider) => {
        try {
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            const balanceBigInt = await provider.getBalance(address);
            const network = await provider.getNetwork();

            setAccount(address);
            setBalance(ethers.formatEther(balanceBigInt));
            setChainId(Number(network.chainId));
        } catch (err) {
            console.error("Error loading account data", err);
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
        setBalance(null);
        setChainId(null);
        localStorage.setItem('wallet_disconnected', 'true');
    };

    const connectWallet = async () => {
        if ((window as any).ethereum) {
            try {
                const provider = new ethers.BrowserProvider((window as any).ethereum);
                // Trigger the permissions popup to allow switching/selecting accounts
                await (window as any).ethereum.request({
                    method: "wallet_requestPermissions",
                    params: [{ eth_accounts: {} }],
                });
                await provider.send("eth_requestAccounts", []);
                localStorage.removeItem('wallet_disconnected');
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
                const disconnected = localStorage.getItem('wallet_disconnected');
                if (disconnected === 'true') return;

                const provider = new ethers.BrowserProvider((window as any).ethereum);
                try {
                    const accounts = await provider.listAccounts();
                    if (accounts.length > 0) {
                        await loadAccountData(provider);
                    }
                } catch (err) {
                    console.error("Failed to list accounts", err);
                }

                // Listen for account changes
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

    const isSepolia = chainId === 11155111;
    const isLocal = chainId === 31337;

    return (
        <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
                <Link to="/" className="flex items-center space-x-2 font-bold text-xl tracking-tighter hover:opacity-80 transition-opacity">
                    <span className="text-foreground">$ THYSEAS</span>
                </Link>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden p-2 text-foreground hover:bg-secondary rounded-md"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>

                <div className="hidden md:flex flex-1 items-center justify-end space-x-6 text-sm font-medium">
                    <a href="#features" className="text-foreground/60 transition-colors hover:text-foreground">Features</a>
                    <Link to="/dashboard" className="text-foreground/60 transition-colors hover:text-foreground">Dashboard</Link>
                    <Link to="/books" className="text-foreground/60 transition-colors hover:text-foreground">Books & Audit</Link>
                    <Link to="/lender" className="text-foreground/60 transition-colors hover:text-foreground">Lender</Link>
                    <Link to="/borrower" className="text-foreground/60 transition-colors hover:text-foreground">Request a Loan</Link>

                    <Link to="/auditor" className="text-muted-foreground hover:text-foreground font-semibold transition-colors flex items-center gap-1">
                        Auditor Only
                    </Link>

                    {account ? (
                        <div className="flex items-center gap-4">
                            <div className={`
                                px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 border
                                ${isSepolia || isLocal
                                    ? 'bg-secondary text-foreground border-border'
                                    : 'bg-destructive/10 text-destructive border-destructive/20'}
                            `}>
                                <div className={`w-2 h-2 rounded-full ${isSepolia || isLocal ? 'bg-foreground' : 'bg-destructive'}`} />
                                {isSepolia ? 'Sepolia' : (isLocal ? 'LocalNode' : 'Wrong Net')}
                            </div>

                            <div className="flex flex-col items-end leading-none">
                                <span className="font-semibold text-sm">{formatAddress(account)}</span>
                                <span className="text-xs text-muted-foreground">
                                    {balance ? parseFloat(balance).toFixed(4) : '0.00'} ETH
                                </span>
                            </div>

                            <button
                                onClick={disconnectWallet}
                                className="text-xs text-muted-foreground hover:text-destructive font-medium transition-colors"
                            >
                                Disconnect
                            </button>
                        </div>
                    ) : (
                        <button
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                            onClick={connectWallet}
                        >
                            <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
                        </button>
                    )}
                </div>
            </div>

            {isMenuOpen && (
                <div className="md:hidden border-t p-4 space-y-4 bg-background">
                    <a href="#features" className="block text-foreground/60 hover:text-foreground">Features</a>
                    <Link to="/dashboard" className="block text-foreground/60 hover:text-foreground">Dashboard</Link>
                    <Link to="/books" className="block text-foreground/60 hover:text-foreground">Books & Audit</Link>
                    <Link to="/lender" className="block text-foreground/60 hover:text-foreground">Lender</Link>
                    <Link to="/auditor" className="block text-muted-foreground font-medium">Auditor Only</Link>
                    <Link to="/borrower" className="block text-muted-foreground font-medium">Borrower</Link>

                    {account ? (
                        <button
                            className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium border border-red-500/20 text-red-500 h-9 px-4 py-2 mt-4"
                            onClick={disconnectWallet}
                        >
                            Disconnect {formatAddress(account)}
                        </button>
                    ) : (
                        <button
                            className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background h-9 px-4 py-2 mt-4"
                            onClick={connectWallet}
                        >
                            <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
                        </button>
                    )}
                </div>
            )}
        </nav>
    );
}
