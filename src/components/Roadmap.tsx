import { motion } from 'framer-motion';

const quarters = [
    { q: "Q1 2026", title: "Testnet Launch", items: ["5 Committed Pilot Teams", "Smart Contract Audits", "Community Staking Trials"] },
    { q: "Q2 2026", title: "Mainnet Genesis", items: ["$THYSEAS Token Generation", "First Lending Pools Live", "Initial Hardware Tokenization"] },
    { q: "Q3 2026", title: "Expansion", items: ["Repo Partner Integration", "Open Applications", "Cross-chain Bridges"] },
    { q: "Q4 2026", title: "Decentralization", items: ["Governance DAO Live", "Treasury Handover", "Full Protocol Autonomy"] }
];

export default function Roadmap() {
    return (
        <section id="roadmap" className="container relative py-24">
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-foreground">
                Mission <span className="text-muted-foreground">Timeline</span>
            </h2>

            <div className="max-w-3xl mx-auto relative">
                {/* Vertical Line */}
                <div className="absolute left-[20px] top-0 bottom-0 w-px bg-border hidden md:block" />

                {quarters.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.2 }}
                        className="group relative ml-0 md:ml-12 mb-8 p-6 rounded-xl border border-border bg-card hover:bg-secondary transition-all duration-300"
                    >
                        {/* Dot */}
                        <div className="absolute left-[-3.4rem] top-8 w-4 h-4 rounded-full bg-primary hidden md:block group-hover:scale-110 transition-transform duration-300" />

                        <div className="flex flex-col gap-2">
                            <span className="text-primary-foreground bg-primary px-2 py-0.5 rounded text-xs w-fit font-bold">{item.q}</span>
                            <h3 className="text-2xl font-semibold text-foreground">{item.title}</h3>
                            <ul className="pl-5 list-disc text-muted-foreground space-y-1">
                                {item.items.map((sub, j) => (
                                    <li key={j}>{sub}</li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
