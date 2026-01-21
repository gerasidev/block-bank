import { useState } from 'react';
import { initialTransactions, type Transaction } from '../data/mockTransactions';
import { Activity, Network, Shield, Landmark } from 'lucide-react';

interface Loan {
    id: number;
    amount: number;
    borrower: string;
    isNew?: boolean;
}

const VaultVisualizer = () => {
    const [view, setView] = useState<'system' | 'network'>('system');
    const [reserve, setReserve] = useState(0);
    const [multiplier] = useState(5);
    const [loans, setLoans] = useState<Loan[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
    const [isRunning, setIsRunning] = useState(false);
    const [currentStep, setCurrentStep] = useState("");

    // const totalCredit = reserve * multiplier;
    const usedCredit = loans.reduce((acc, loan) => acc + loan.amount, 0);

    const addTx = (type: Transaction['type'], from: string, to: string, amount: string) => {
        const newTx: Transaction = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            from,
            to,
            amount,
            timestamp: new Date().toLocaleTimeString(),
            status: 'SUCCESS'
        };
        setTransactions(prev => [newTx, ...prev]);
    };

    const runDemo = async () => {
        if (isRunning) return;
        setIsRunning(true);
        setReserve(0);
        setLoans([]);
        setTransactions([]);
        setCurrentStep("Seeding Hard Reserve...");
        await new Promise(r => setTimeout(r, 1000));
        setReserve(1);
        addTx('DEPOSIT', '0xLender...79C8', 'Vault', '1.0 ETH');

        setCurrentStep("Expanding Credit to Trusted Network...");
        const borrowerAddresses = [
            "0x3C4...4", "0x90F...7", "0x15d...3", "0x996...5", "0x976...E",
            "0x14d...C", "0x236...1", "0xa0E...e", "0xBCd...4", "0x71b...E"
        ];

        for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 600));
            const addr = borrowerAddresses[i];
            addTx('LOAN_REQUEST', addr, 'Vault', '1.0 $THY');
            await new Promise(r => setTimeout(r, 300));
            addTx('RELEASE', 'Vault', addr, '1.0 $THY');
            const newLoan = { id: i + 1, amount: 1, borrower: addr, isNew: true };
            setLoans(prev => [...prev, newLoan]);
        }

        setCurrentStep("Demo Complete. Bank 1:5 Ratio Solidified.");
        setIsRunning(false);
    };

    return (
        <div className="space-y-12">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                <div className="flex border-4 border-black p-1 bg-white neo-shadow">
                    <button
                        className={`px-6 py-2 font-black text-xs uppercase tracking-widest transition-all ${view === 'system' ? 'bg-black text-white' : 'bg-transparent text-black hover:bg-zinc-100'}`}
                        onClick={() => setView('system')}
                    >
                        SYSTEM_OVERVIEW
                    </button>
                    <button
                        className={`px-6 py-2 font-black text-xs uppercase tracking-widest transition-all ${view === 'network' ? 'bg-black text-white' : 'bg-transparent text-black hover:bg-zinc-100'}`}
                        onClick={() => setView('network')}
                    >
                        NETWORK_GRAPH
                    </button>
                </div>
                <button
                    onClick={runDemo}
                    disabled={isRunning}
                    className={`px-8 py-3 border-4 border-black font-black uppercase tracking-widest text-sm transition-all neo-shadow hover:neo-shadow-none active:translate-x-[2px] active:translate-y-[2px] ${isRunning ? 'bg-zinc-200 cursor-not-allowed' : 'bg-black text-white'}`}
                >
                    {isRunning ? 'EXECUTING_PROTOCOL...' : 'RUN_SIMULATION'}
                </button>
            </div>

            {currentStep && (
                <div className="flex justify-center">
                    <div className="bg-white text-black border-2 border-black px-6 py-2 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse neo-shadow-sm">
                        {currentStep}
                    </div>
                </div>
            )}

            {view === 'system' ? (
                <div className="grid gap-10 md:grid-cols-12">
                    <div className="md:col-span-8 neo-card bg-white !p-0 border-4 overflow-hidden">
                        <div className="bg-black text-white px-8 py-4 flex justify-between items-center border-b-4 border-black">
                            <h2 className="text-xl font-black uppercase tracking-widest">Transaction Log</h2>
                            <Activity className="h-5 w-5 text-white" />
                        </div>
                        <div className="h-[450px] overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-zinc-100 border-b-4 border-black sticky top-0">
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">EVENT_TYPE</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">ENTITY_PATH</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-right">VOLUME</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-right">TIME</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map(tx => (
                                        <tr key={tx.id} className="border-b-2 border-zinc-100 hover:bg-zinc-50">
                                            <td className="px-8 py-4">
                                                <span className={`inline-block px-2 py-1 border-2 border-black text-[9px] font-black uppercase skew-x-[-10deg] ${tx.type === 'DEPOSIT' ? 'bg-zinc-800 text-white' : tx.type === 'RELEASE' ? 'bg-zinc-200' : 'bg-zinc-400'}`}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 font-mono text-[10px] opacity-70">{tx.from} ➔ {tx.to}</td>
                                            <td className="px-8 py-4 text-right font-black text-sm">{tx.amount}</td>
                                            <td className="px-8 py-4 text-right text-[10px] font-black opacity-40 italic">{tx.timestamp}</td>
                                        </tr>
                                    ))}
                                    {transactions.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="text-center py-20 font-black opacity-30 uppercase italic">AWAITING_NETWORK_ACTIVITY</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="md:col-span-4 space-y-8">
                        <div className={`neo-card border-4 p-8 transition-all ${reserve > 0 ? "bg-zinc-800 text-white shadow-none" : "bg-white text-black"}`}>
                            <div className="flex flex-row items-center justify-between mb-4">
                                <h3 className="text-xs font-black uppercase tracking-widest opacity-60">Vault Reserve</h3>
                                <Shield className="h-6 w-6" />
                            </div>
                            <div className="text-5xl font-black tracking-tighter">{reserve.toFixed(1)} <span className="text-xl">ETH</span></div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mt-2">Hard Assets Secured</p>
                        </div>

                        <div className="flex justify-center">
                            <div className="bg-white border-4 border-black px-6 py-2 font-black text-lg uppercase tracking-widest neo-shadow rotate-3 hover:rotate-0 transition-transform">
                                X{multiplier} LEVERAGE
                            </div>
                        </div>

                        <div className={`neo-card border-4 p-8 transition-all ${usedCredit > 0 ? "bg-black text-white shadow-none" : "bg-white text-black"}`}>
                            <div className="flex flex-row items-center justify-between mb-4">
                                <h3 className="text-xs font-black uppercase tracking-widest opacity-60">Credit Issued</h3>
                                <Landmark className="h-6 w-6" />
                            </div>
                            <div className="text-5xl font-black tracking-tighter">{usedCredit.toFixed(1)} <span className="text-xl">$THY</span></div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mt-2">Circulating Supply</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="neo-card bg-white border-4 !p-0 overflow-hidden">
                    <div className="bg-black text-white px-8 py-4 flex justify-between items-center border-b-4 border-black">
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-widest">Fractional Network Graph</h2>
                            <p className="text-[10px] font-black opacity-50 uppercase tracking-[0.2em]">Visualizing the 1:{multiplier} Reserve Ratio</p>
                        </div>
                        <Network className="h-8 w-8 text-black" />
                    </div>
                    <div className="w-full flex justify-center py-12 bg-zinc-50 overflow-hidden">
                        <svg width="100%" height="500" viewBox="0 0 800 500" className="max-w-[800px]">
                            {/* Connections */}
                            {loans.map((loan, i) => {
                                const angle = (i / 10) * Math.PI * 2;
                                const x = 400 + 180 * Math.cos(angle);
                                const y = 250 + 180 * Math.sin(angle);
                                return (
                                    <line
                                        key={`line-${i}`}
                                        x1="400" y1="250"
                                        x2={x} y2={y}
                                        stroke="black"
                                        strokeWidth={loan.isNew ? "6" : "3"}
                                        className="transition-all duration-300 opacity-20"
                                    />
                                );
                            })}
                            {/* The Vault Center */}
                            <g className="cursor-pointer group">
                                <circle cx="400" cy="250" r="50" className="fill-black neo-shadow stroke-white stroke-[4px]" />
                                <text x="400" y="255" textAnchor="middle" className="fill-white text-sm font-black tracking-widest uppercase">VAULT</text>
                            </g>

                            {/* The Borrowers */}
                            {loans.map((loan, i) => {
                                const angle = (i / 10) * Math.PI * 2;
                                const x = 400 + 180 * Math.cos(angle);
                                const y = 250 + 180 * Math.sin(angle);
                                return (
                                    <g key={`node-${i}`} className="transition-all duration-500 animate-in fade-in zoom-in">
                                        <circle cx={x} cy={y} r="20" className="fill-white border-2 border-black stroke-black stroke-[3px] neo-shadow hover:r-25 transition-all" />
                                        <text x={x} y={y + 40} textAnchor="middle" className="fill-black text-[9px] font-black uppercase tracking-tighter">{loan.borrower}</text>
                                    </g>
                                );
                            })}

                            {/* Starting Nodes placeholders */}
                            {[...Array(10 - loans.length)].map((_, i) => {
                                const idx = i + loans.length;
                                const angle = (idx / 10) * Math.PI * 2;
                                const x = 400 + 180 * Math.cos(angle);
                                const y = 250 + 180 * Math.sin(angle);
                                return (
                                    <circle key={`empty-${idx}`} cx={x} cy={y} r="12" className="fill-transparent stroke-black stroke-[2px] opacity-10" strokeDasharray="6" />
                                );
                            })}
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VaultVisualizer;
