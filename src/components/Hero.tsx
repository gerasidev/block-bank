import { ArrowRight, FileText } from 'lucide-react';


export default function Hero() {
    return (
        <section className="container flex flex-col items-center justify-center py-20 md:py-32 text-center overflow-hidden">
            <div className="max-w-5xl mx-auto space-y-12">
                <div className="inline-block bg-white text-black px-4 py-1 text-sm font-black uppercase tracking-[0.2em] border-2 border-black neo-shadow-green rotate-[-1deg]">
                    PROTOCOL_V1.0 // MACHINE_CREDIT
                </div>

                <h1 className="text-7xl md:text-[10rem] font-black leading-[0.85] uppercase tracking-tighter text-black italic">
                    THYSEAS<br />
                    <span className="text-zinc-400 not-italic">BANK</span>
                </h1>

                <div className="relative inline-block">
                    <p className="text-xl md:text-2xl font-bold uppercase tracking-widest max-w-3xl mx-auto text-black leading-tight border-l-8 border-black pl-8 text-left py-4">
                        The first digital credit facility designed for
                        <span className="bg-yellow-400 px-2 ml-2">hard-tech hardware</span>.
                        Operating on the conviction that robotics will dwarf the internet.
                    </p>
                    <div className="absolute -top-4 -right-8 w-24 h-24 border-4 border-black bg-blue-400 -z-10 rotate-12 neo-shadow"></div>
                </div>

                <div className="flex flex-wrap gap-6 justify-center pt-8">
                    <button className="bg-[#10b981] text-white px-10 py-5 border-4 border-black neo-shadow hover:neo-shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all font-black text-xl uppercase tracking-widest flex items-center gap-4">
                        REQUEST_CAPITAL <ArrowRight className="w-6 h-6 stroke-[3px]" />
                    </button>
                    <button className="bg-white text-black px-10 py-5 border-4 border-black neo-shadow hover:neo-shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all font-black text-xl uppercase tracking-widest flex items-center gap-4">
                        WHITEPAPER <FileText className="w-6 h-6 stroke-[3px]" />
                    </button>
                </div>

                <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
                    <div className="bg-white p-8 border-4 border-black neo-shadow hover:neo-shadow-none transition-all rotate-[-2deg]">
                        <h4 className="text-6xl font-black text-black leading-none">5X</h4>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Max Platform Leverage</span>
                    </div>
                    <div className="bg-yellow-400 p-8 border-4 border-black neo-shadow-lg hover:neo-shadow-none transition-all rotate-[1deg]">
                        <h4 className="text-6xl font-black text-black leading-none">0%</h4>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Real Estate Exposure</span>
                    </div>
                    <div className="bg-blue-400 p-8 border-4 border-black neo-shadow hover:neo-shadow-none transition-all rotate-[3deg]">
                        <h4 className="text-6xl font-black text-black leading-none">1:1</h4>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">THY:ETH Liquid Peg</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
