import { useState } from 'react';
import { initialTransactions, type Transaction } from '../data/mockTransactions';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
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
    const [multiplier] = useState(10);
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

        setCurrentStep("Demo Complete. Bank 1:10 Ratio Solidified.");
        setIsRunning(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex space-x-2 bg-muted p-1 rounded-lg">
                    <Button
                        variant={view === 'system' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setView('system')}
                    >
                        <Activity className="mr-2 h-4 w-4" /> System Overview
                    </Button>
                    <Button
                        variant={view === 'network' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setView('network')}
                    >
                        <Network className="mr-2 h-4 w-4" /> Network Graph
                    </Button>
                </div>
                <Button
                    onClick={runDemo}
                    disabled={isRunning}
                    variant={isRunning ? "secondary" : "default"}
                >
                    {isRunning ? 'Processing...' : 'Run Simulation'}
                </Button>
            </div>

            {currentStep && (
                <div className="flex justify-center">
                    <Badge variant="secondary" className="animate-pulse">{currentStep}</Badge>
                </div>
            )}

            {view === 'system' ? (
                <div className="grid gap-6 md:grid-cols-12">
                    <Card className="md:col-span-8">
                        <CardHeader>
                            <CardTitle>On-Chain Transaction Log</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="h-[400px] overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Path</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead className="text-right">Time</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.map(tx => (
                                            <TableRow key={tx.id}>
                                                <TableCell>
                                                    <Badge variant="outline">{tx.type}</Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">{tx.from} ➔ {tx.to}</TableCell>
                                                <TableCell className="text-right font-mono">{tx.amount}</TableCell>
                                                <TableCell className="text-right text-xs text-muted-foreground">{tx.timestamp}</TableCell>
                                            </TableRow>
                                        ))}
                                        {transactions.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">Waiting for transactions...</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="md:col-span-4 space-y-6">
                        {/* Stats Cards */}
                        <Card className={reserve > 0 ? "border-primary/50 bg-secondary" : ""}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Vault Reserve</CardTitle>
                                <Shield className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{reserve.toFixed(1)} ETH</div>
                                <p className="text-xs text-muted-foreground">Hard Assets Secured</p>
                            </CardContent>
                        </Card>

                        <div className="flex justify-center">
                            <Badge variant="secondary" className="text-lg px-4 py-1">x{multiplier} Leverage</Badge>
                        </div>

                        <Card className={usedCredit > 0 ? "border-primary/50 bg-secondary" : ""}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Credit Issued</CardTitle>
                                <Landmark className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{usedCredit.toFixed(1)} $THY</div>
                                <p className="text-xs text-muted-foreground">Circulating Supply</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Fractional Network Graph</CardTitle>
                        <CardDescription>Visualizing the 1:10 relationship between Vault and Nodes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full flex justify-center py-8">
                            <svg width="100%" height="400" viewBox="0 0 800 400" className="max-w-[800px]">
                                {/* Connections */}
                                {loans.map((loan, i) => {
                                    const angle = (i / 10) * Math.PI * 2;
                                    const x = 400 + 150 * Math.cos(angle);
                                    const y = 200 + 150 * Math.sin(angle);
                                    return (
                                        <line
                                            key={`line-${i}`}
                                            x1="400" y1="200"
                                            x2={x} y2={y}
                                            stroke={loan.isNew ? "currentColor" : "var(--border)"}
                                            strokeWidth="2"
                                            className="transition-all duration-300 text-primary"
                                        />
                                    );
                                })}
                                {/* The Vault Center */}
                                <circle cx="400" cy="200" r="40" className="fill-foreground stroke-background stroke-[3px]" />
                                <text x="400" y="205" textAnchor="middle" className="fill-background text-xs font-bold pointer-events-none">VAULT</text>

                                {/* The Borrowers */}
                                {loans.map((loan, i) => {
                                    const angle = (i / 10) * Math.PI * 2;
                                    const x = 400 + 150 * Math.cos(angle);
                                    const y = 200 + 150 * Math.sin(angle);
                                    return (
                                        <g key={`node-${i}`}>
                                            <circle cx={x} cy={y} r="15" className="fill-card stroke-primary stroke-[2px]" />
                                            <text x={x} y={y + 30} textAnchor="middle" className="fill-muted-foreground text-[8px] font-mono">{loan.borrower}</text>
                                        </g>
                                    );
                                })}

                                {/* Starting Nodes placeholders */}
                                {[...Array(10 - loans.length)].map((_, i) => {
                                    const idx = i + loans.length;
                                    const angle = (idx / 10) * Math.PI * 2;
                                    const x = 400 + 150 * Math.cos(angle);
                                    const y = 200 + 150 * Math.sin(angle);
                                    return (
                                        <circle key={`empty-${idx}`} cx={x} cy={y} r="10" className="fill-background stroke-border stroke-[1px]" strokeDasharray="4" />
                                    );
                                })}
                            </svg>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default VaultVisualizer;
