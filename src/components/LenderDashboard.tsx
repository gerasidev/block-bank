import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import LendingVaultABI from '../abis/LendingVault.json';

const LENDING_VAULT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
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
    const [depositAmount, setDepositAmount] = useState("");
    const [statusMsg, setStatusMsg] = useState("");
    const [account, setAccount] = useState<string>("");

    useEffect(() => {
        checkWallet();
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

    const checkWallet = async () => {
        if (window.ethereum) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.listAccounts();
            if (accounts.length > 0) {
                setAccount(accounts[0].address);
            }
        }
    };

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

            const depositsCount = await contract.getDepositsCount(account);
            const now = Math.floor(Date.now() / 1000);

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

    const handleDeposit = async () => {
        if (!depositAmount || parseFloat(depositAmount) <= 0) {
            setStatusMsg("Please enter a valid amount");
            return;
        }

        try {
            setStatusMsg("Depositing...");
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(LENDING_VAULT_ADDRESS, LendingVaultABI.abi, signer);

            const tx = await contract.depositLiquidity({
                value: ethers.parseEther(depositAmount)
            });
            await tx.wait();

            setStatusMsg(`Successfully deposited ${depositAmount} ETH! Locked for ${LOCK_PERIOD_DAYS} days.`);
            setDepositAmount("");
            fetchDeposits();
        } catch (err: any) {
            setStatusMsg("Error: " + (err.reason || err.message));
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
        <div className="container mx-auto py-10 space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Lender Dashboard</h2>
                <p className="text-muted-foreground">
                    Deposit liquidity and earn interest. All deposits are locked for {LOCK_PERIOD_DAYS} days.
                </p>
                {statusMsg && <Badge variant={statusMsg.includes("Error") ? "destructive" : "default"}>{statusMsg}</Badge>}
            </div>

            {/* Deposit Card */}
            <Card className="border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Make a Deposit</CardTitle>
                    <CardDescription>
                        Earn 5% APR on your deposits. Funds will be locked for {LOCK_PERIOD_DAYS} days to ensure protocol stability.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex w-full items-center space-x-2">
                        <Input
                            type="number"
                            placeholder="Amount in ETH"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="max-w-md"
                            step="0.01"
                            min="0"
                        />
                        <Button onClick={handleDeposit} variant="default">
                            Deposit ETH
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        ⚠️ Your deposit will be locked until the unlock date. Early withdrawal is not possible.
                    </p>
                </CardContent>
            </Card>

            {/* Deposits Table */}
            <Card className="border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Your Deposits</CardTitle>
                    <CardDescription>Track your deposits and withdraw when unlocked</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Deposit #</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Deposit Date</TableHead>
                                <TableHead>Unlock Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {deposits.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No deposits found. Make your first deposit above!
                                    </TableCell>
                                </TableRow>
                            ) : deposits.map((deposit) => (
                                <TableRow key={deposit.index}>
                                    <TableCell className="font-medium">#{deposit.index + 1}</TableCell>
                                    <TableCell className="font-mono">{deposit.amount} ETH</TableCell>
                                    <TableCell>{formatDate(deposit.timestamp)}</TableCell>
                                    <TableCell>{formatDate(deposit.lockUntil)}</TableCell>
                                    <TableCell>
                                        {deposit.withdrawn ? (
                                            <Badge variant="secondary">Withdrawn</Badge>
                                        ) : deposit.canWithdraw ? (
                                            <Badge variant="default" className="bg-green-600">Ready to Withdraw</Badge>
                                        ) : (
                                            <Badge variant="outline">
                                                Locked ({deposit.daysRemaining} days left)
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {!deposit.withdrawn && deposit.canWithdraw ? (
                                            <Button
                                                size="sm"
                                                onClick={() => handleWithdraw(deposit.index)}
                                                variant="default"
                                            >
                                                Withdraw + Interest
                                            </Button>
                                        ) : (
                                            <Button size="sm" disabled variant="ghost">
                                                {deposit.withdrawn ? "Withdrawn" : "Locked"}
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
