import { Cpu, ShieldCheck, Zap } from 'lucide-react';

const features = [
    {
        icon: <Zap className="w-10 h-10" />,
        color: "bg-white",
        title: "10x Strategic Leverage",
        desc: "High-efficiency liquidity for the promise of the future. Up to 10× leverage backed by communal trust and future production, not just cold collateral."
    },
    {
        icon: <ShieldCheck className="w-10 h-10" />,
        color: "bg-white",
        title: "Audit Layer",
        desc: "Loans verified in by community auditors in the open. Multi-signature release enforcement."
    },
    {
        icon: <ShieldCheck className="w-10 h-10" />,
        color: "bg-white",
        title: "Trust Network",
        desc: "Operating on trust among individuals we believe in. We fund the person, their vision, and their integrity."
    },
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
                            The  Future <br />
                            <span className="text-black">as Collateral</span>
                        </h2>
                        <p className="text-xl font-bold uppercase tracking-widest opacity-70">
                            We tokenize the commitment of builders.
                            Your reputation, your vision, and your future production act as the bedrock for protocol liquidity.
                        </p>

                        <div className="space-y-4">
                            {[
                                'RWA Tokenization Engine',
                                'Community Trust Protocol',
                                'Future-as-Collateral Model'
                            ].map((item, i) => (
                                <div key={i} className="flex items-center text-sm font-black uppercase p-4 border-2 border-black bg-white neo-shadow-none hover:translate-x-2 transition-transform cursor-default">
                                    <Cpu className="w-5 h-5 mr-4 flex-shrink-0" />
                                    {item}
                                </div>
                            ))}
                            <div className="mt-8 p-6 border-4 border-black bg-red-50 neo-shadow hover:neo-shadow-none transition-all">
                                <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
                                    <ShieldCheck className="w-6 h-6" /> Strict No Real Estate Policy
                                </h3>
                                <p className="text-sm font-bold uppercase tracking-tight leading-relaxed">
                                    "We don't fund bricks. Bricks cannot be eaten, cannot be consumed.
                                    With a machine you can make a building, with a building you can't make a machine.
                                    We fuel the movers, not the sitters."
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="bg-zinc-100 border-4 border-black p-12 neo-shadow-lg rotate-2 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="text-8xl font-black italic">TRUST</div>
                            <div className="text-4xl font-black opacity-30 uppercase tracking-[0.5em]">MONEY</div>
                            <div className="w-full h-2 bg-black"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                VERIFIED_FUTURE_BACKED_CREDIT_SYSTEM_001
                            </p>
                        </div>
                        <div className="absolute -top-8 -left-8 w-20 h-20 bg-white border-4 border-black neo-shadow -z-10 -rotate-12"></div>
                    </div>
                </div>
            </div>
            <div className="pt-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
                    <div>
                        <h4 className="text-sm font-black text-red-600 uppercase tracking-[0.3em] mb-2">High-Conviction</h4>
                        <h2 className="text-5xl font-black uppercase tracking-tighter italic leading-none">
                            Example projects that we are <br />
                            willing to fund from day 1
                        </h2>
                    </div>
                    <div className="text-xs font-bold uppercase opacity-50 text-right">
                        ACCELERATOR_MODE: ENABLED<br />
                        CO_FOUNDER_MATCHING: ACTIVE
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {[
                        {
                            name: "LeRobot (Hugging Face)",
                            tag: "ROBOTICS",
                            desc: "Open-source robotics ecosystem. We fund the shift from digital AI to physical machine intelligence.",
                            author: "REMI CADENE"
                        },
                        {
                            name: "BiVACOR",
                            tag: "MED_TECH",
                            desc: "The maglev-powered titanium heart. Funding the Australian breakthrough in permanent artificial circulation.",
                            author: "DR. DANIEL TIMMS"
                        },
                        {
                            name: "The ODIN",
                            tag: "BIO_TECH",
                            desc: "Consumer-grade genetic engineering. Conviction in democratizing the tools of life itself.",
                            author: "JOSIAH ZAYNER"
                        },
                        {
                            name: "Small Teams & Labs",
                            tag: "COMMUNITY",
                            desc: "The long tail of talent. 2-3 person student labs and solo builders. Find your community and co-founder here.",
                            author: "VARIOUS_BUILDERS"
                        },
                        {
                            name: "YOU",
                            tag: "NEXT_GEN",
                            desc: "The builder reading this. We act as an accelerator, matching you with the right tech and the right people. Start now.",
                            author: "YOUR_VISION"
                        }
                    ].map((p, i) => (
                        <div key={i} className={`bg-white border-4 border-black p-8 neo-shadow hover:neo-shadow-none transition-all flex flex-col justify-between group ${p.name === 'YOU' ? 'bg-red-50 ring-4 ring-offset-4 ring-black/10' : ''}`}>
                            <div>
                                <div className="text-[10px] font-black bg-black text-white px-2 py-1 w-fit mb-4 uppercase">
                                    {p.tag}
                                </div>
                                <h3 className={`font-black uppercase mb-2 group-hover:text-red-600 transition-colors leading-tight ${p.name === 'YOU' ? 'text-5xl' : 'text-xl'}`}>{p.name}</h3>
                                <p className="text-[10px] font-bold uppercase tracking-tight opacity-70 mb-6 leading-relaxed">
                                    {p.desc}
                                </p>
                            </div>
                            <div className="border-t-2 border-black pt-4 flex justify-between items-center">
                                <span className="text-[10px] font-black opacity-50 uppercase">{i >= 3 ? 'Focus:' : 'Creator:'} {p.author}</span>
                                <div className={`h-2 w-2 ${i >= 3 ? 'bg-accent' : 'bg-red-600'}`}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
