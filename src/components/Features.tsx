import { Cpu, ShieldCheck, Zap, Activity } from 'lucide-react';

const features = [
    {
        icon: <Activity className="w-10 h-10" />,
        color: "bg-blue-400",
        title: "Liquidity Peg",
        desc: "ERC-20 token pegged 1:1 to ETH value. Mint by locking ETH via native layers. Arbitrage-stabilized liquidity."
    },
    {
        icon: <Zap className="w-10 h-10" />,
        color: "bg-yellow-400",
        title: "Deep-Tech Credit",
        desc: "Up to 5x leverage. 6-24 month lockups with dynamic yield. Purpose-built for high-capex hardware scaling."
    },
    {
        icon: <ShieldCheck className="w-10 h-10" />,
        color: "bg-[#10b981]",
        title: "Audit Layer",
        desc: "Loans verified by a decentralized network of hardware experts. Multi-signature release enforcement."
    }
];

export default function Features() {
    return (
        <section id="features" className="container py-24 space-y-32">
            <div>
                <div className="text-center mb-20">
                    <h2 className="text-6xl font-black uppercase tracking-tighter italic border-b-8 border-black inline-block pb-4">
                        Protocol Architecture
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-10">
                    {features.map((f, i) => (
                        <div key={i} className={`neo-card ${f.color} border-4 p-10 flex flex-col gap-6 rotate-[${(i % 2 === 0 ? '-1' : '1')}deg]`}>
                            <div className="bg-white border-2 border-black p-4 w-fit neo-shadow-none">
                                {f.icon}
                            </div>
                            <h3 className="text-3xl font-black uppercase tracking-tight">{f.title}</h3>
                            <p className="font-bold text-sm leading-relaxed opacity-80 uppercase tracking-wide">
                                {f.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="max-w-5xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <h2 className="text-6xl font-black uppercase leading-[0.9] tracking-tighter">
                            Atoms <br />
                            <span className="text-blue-500">as Collateral</span>
                        </h2>
                        <p className="text-xl font-bold uppercase tracking-widest opacity-70">
                            We tokenize physical assets into ERC-721 NFTs.
                            Your robots, GPUs, and lab equipment act as the bedrock for protocol liquidity.
                        </p>

                        <div className="space-y-4">
                            {[
                                'RWA Tokenization Engine',
                                'Legal Seizure Network',
                                'Dutch Auction Liquidations',
                                'Strict No Real Estate Policy'
                            ].map((item, i) => (
                                <div key={i} className="flex items-center text-sm font-black uppercase p-4 border-2 border-black bg-white neo-shadow-none hover:translate-x-2 transition-transform cursor-default">
                                    <Cpu className="w-5 h-5 mr-4 flex-shrink-0" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="bg-zinc-100 border-4 border-black p-12 neo-shadow-lg rotate-2 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="text-8xl font-black italic">HARD</div>
                            <div className="text-4xl font-black opacity-30 uppercase tracking-[0.5em]">MONEY</div>
                            <div className="w-full h-2 bg-black"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                VERIFIED_HARDWARE_BACKED_CREDIT_SYSTEM_001
                            </p>
                        </div>
                        <div className="absolute -top-8 -left-8 w-20 h-20 bg-yellow-400 border-4 border-black neo-shadow -z-10 -rotate-12"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
