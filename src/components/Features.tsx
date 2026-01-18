import { motion } from 'framer-motion';
import { Bitcoin, Cpu, ShieldCheck, Zap } from 'lucide-react';


const features = [
    {
        icon: <Bitcoin className="w-10 h-10 text-primary" />,
        title: "NeoBank",
        desc: "ERC-20 token pegged 1:1 to BTC value. Mint by locking BTC via tBTC or native layers. Stability via open arbitrage."
    },
    {
        icon: <Zap className="w-10 h-10 text-primary" />,
        title: "Deep-Tech Lending",
        desc: "Get up to 25x leverage. 6-24 month terms with 8-18% APY. Designed for hardware founders who need to move fast."
    },
    {
        icon: <ShieldCheck className="w-10 h-10 text-primary" />,
        title: "Community Audited",
        desc: "Loans are verified by stakers and community auditors. Accurate audits are rewarded, false claims smashed."
    }
];

export default function Features() {
    return (
        <section id="features" className="container py-24">
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
            >
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-foreground">
                        Protocol <span className="text-muted-foreground">Architecture</span>
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((f, i) => (
                        <div key={i} className="group p-8 rounded-xl border border-border bg-card hover:bg-secondary transition-all duration-300 hover:-translate-y-1">
                            <div className="mb-6 bg-primary/5 w-fit p-3 rounded-lg group-hover:bg-primary/10 transition-colors duration-300">{f.icon}</div>
                            <h3 className="text-xl font-bold mb-4">{f.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="max-w-4xl mx-auto mt-32 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Hardware as <span className="text-muted-foreground">Collateral</span></h2>
                    <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
                        We tokenize physical assets into ERC-721 NFTs with rich metadata.
                        Your robots, GPUs, bioreactors, and lab equipment act as the bedrock for your liquidity.
                    </p>
                    <div className="grid md:grid-cols-2 gap-8 text-left max-w-2xl mx-auto">
                        {[
                            'Real-World Asset (RWA) Tokenization',
                            'Legal Seizure & Repo Partner Network',
                            'On-chain Dutch Auctions for Liquidations',
                            'No Real Estate. Ever.'
                        ].map((item, i) => (
                            <div key={i} className="flex items-center text-lg p-4 rounded-lg bg-card border border-border">
                                <Cpu className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
