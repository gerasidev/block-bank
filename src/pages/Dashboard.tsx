import VaultVisualizer from '../components/VaultVisualizer';

function Dashboard() {
    return (
        <div className="container mx-auto p-8 space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-black pb-8">
                <div className="space-y-4">
                    <div className="inline-block bg-white text-black px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-black neo-shadow-yellow">
                        SYSTEM_METRICS: LIVE_FEED
                    </div>
                    <h1 className="text-6xl font-black uppercase tracking-tighter leading-none">
                        Protocol <br /> Analytics
                    </h1>
                    <p className="text-sm font-bold opacity-70 uppercase tracking-widest max-w-xl">
                        Visualize reserve ratios, liquidity streams, and fractional expansion cycles in real-time.
                    </p>
                </div>
            </div>
            <VaultVisualizer />
        </div>
    );
}

export default Dashboard;
