import { ArrowRight, FileText } from 'lucide-react';


export default function Hero() {
    return (
        <section className="container flex flex-col items-center justify-center py-20 md:py-32 text-center overflow-hidden">
            <div className="max-w-5xl mx-auto space-y-12">
                <div className="inline-block bg-white text-black px-4 py-1 text-sm font-black uppercase tracking-[0.2em] border-2 border-black neo-shadow rotate-[-1deg]">
                    PROTOCOL_V1.0 // MACHINE_CREDIT
                </div>

                <h1 className="text-7xl md:text-[10rem] font-black leading-[0.85] uppercase tracking-tighter italic text-gradient">
                    THYSEAS<br />
                    <span className="text-zinc-600 not-italic">BANK</span>
                </h1>

                <p className="text-2xl md:text-4xl font-black uppercase tracking-[0.2em] mt-4 italic">
                    The Future <span className="text-zinc-400">as Collateral</span>
                </p>

                <div className="relative inline-block max-w-3xl mx-auto pt-12">
                    <div className="flex justify-start mb-6">
                        <div className="h-3 w-20 bg-red-600 animate-blink neo-shadow-none"></div>
                    </div>
                    <p className="text-xl md:text-2xl font-bold uppercase tracking-widest text-black leading-tight border-l-8 border-black pl-8 text-left py-4">
                        A community operating on <span className="underline decoration-4 underline-offset-4 decoration-black whitespace-nowrap">absolute trust</span>.
                        We fund individuals we believe in, trusting they return the favor of liquidity
                        regardless of the outcome. The promise of the future is our only collateral.
                    </p>
                    <div className="absolute -top-4 -right-8 w-24 h-24 border-4 border-black bg-white -z-10 rotate-12 neo-shadow"></div>
                </div>

                <div className="flex flex-wrap gap-6 justify-center pt-8">
                    <button className="bg-black text-white px-10 py-5 border-4 border-black neo-shadow hover:neo-shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all font-black text-xl uppercase tracking-widest flex items-center gap-4">
                        REQUEST_CAPITAL <ArrowRight className="w-6 h-6 stroke-[3px]" />
                    </button>
                    <button className="bg-white text-black px-10 py-5 border-4 border-black neo-shadow hover:neo-shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all font-black text-xl uppercase tracking-widest flex items-center gap-4">
                        WHITEPAPER <FileText className="w-6 h-6 stroke-[3px]" />
                    </button>
                </div>

                <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
                    <div className="bg-white p-8 border-4 border-black neo-shadow hover:neo-shadow-none transition-all rotate-[-2deg]">
                        <h4 className="text-6xl font-black text-black leading-none">10X</h4>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Max Platform Leverage</span>
                    </div>
                    <div className="bg-zinc-950 p-8 border-4 border-black neo-shadow hover:neo-shadow-none transition-all rotate-[1deg] text-white col-span-1 md:col-span-2 flex flex-col justify-center text-left">
                        <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                            <div className="space-y-2 border-l-4 border-white/20 pl-4">
                                <h4 className="text-sm font-black text-red-500 tracking-widest uppercase italic">Legacy Finance</h4>
                                <p className="text-xs font-bold leading-tight uppercase">Funds land appreciation.<br />Rewards the <span className="underline decoration-2">Lazy</span>.</p>
                            </div>
                            <div className="space-y-2 border-l-4 border-accent pl-4">
                                <h4 className="text-sm font-black text-accent tracking-widest uppercase italic">THYSEAS</h4>
                                <p className="text-xs font-bold leading-tight uppercase">Funds the Promise.<br />Rewards the <span className="underline decoration-2 text-accent">Trusted</span>.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
