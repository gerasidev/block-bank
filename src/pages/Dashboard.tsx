import VaultVisualizer from '../components/VaultVisualizer';

function Dashboard() {
    return (
        <div className="container mx-auto py-12 space-y-8">
            <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold tracking-tight">Protocol Dashboard</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Visualize real-time liquidity flows, reserve status, and network graph connections.
                </p>
            </div>
            <VaultVisualizer />
        </div>
    );
}

export default Dashboard;
