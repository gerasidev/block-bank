
export interface Transaction {
    id: string;
    type: 'DEPOSIT' | 'MINT' | 'LOAN_REQUEST' | 'RELEASE';
    from: string;
    to: string;
    amount: string;
    timestamp: string;
    status: 'PENDING' | 'SUCCESS';
}

export const initialTransactions: Transaction[] = [
    {
        id: 'tx_init_1',
        type: 'DEPOSIT',
        from: '0xLender...79C8',
        to: 'Vault',
        amount: '1.0 ETH',
        timestamp: '10:00:00 AM',
        status: 'SUCCESS'
    },
    {
        id: 'tx_init_2',
        type: 'MINT',
        from: 'Vault',
        to: 'Pool',
        amount: '10.0 $THY',
        timestamp: '10:00:05 AM',
        status: 'SUCCESS'
    },
    {
        id: 'tx_init_3',
        type: 'LOAN_REQUEST',
        from: '0xBorrower...A1B2',
        to: 'Vault',
        amount: '5.0 $THY',
        timestamp: '10:05:12 AM',
        status: 'SUCCESS'
    },
    {
        id: 'tx_init_4',
        type: 'RELEASE',
        from: 'Vault',
        to: '0xBorrower...A1B2',
        amount: '5.0 $THY',
        timestamp: '10:05:15 AM',
        status: 'SUCCESS'
    }
];

export const getRecentTransactions = (): Transaction[] => {
    // In a real app, this would fetch from an API/DB
    return initialTransactions;
};
