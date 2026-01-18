import { motion } from 'framer-motion';
import { ArrowRight, FileText } from 'lucide-react';


export default function Hero() {
    return (
        <section className="container flex flex-col items-center justify-center py-20 md:py-32 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-4xl mx-auto"
            >
                <h3 className="text-xl md:text-2xl font-medium mb-6 inline-block border-b-2 border-primary text-foreground">
                    NeoBank
                </h3>
                <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 text-foreground">
                    Fund the <br />
                    <span>Machine Age</span>
                </h1>
                <p className="text-lg text-muted-foreground mb-8 text-balance mx-auto max-w-2xl">
                    $THYSEAS is the first crypto bank designed for
                    deep-tech hardware startups.
                    with 3–5× leverage to fund machines that move atoms—not real estate.
                    Operating on the conviction that robotics is going to be bigger than the internet
                    and the combustion engine combined.
                </p>

                <div className="flex gap-4 justify-center">
                    <a href="#" className="inline-flex items-center justify-center h-12 rounded-md px-8 font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                        Mint $THYSEAS <ArrowRight className="ml-2 w-5 h-5" />
                    </a>
                    <a href="#" className="inline-flex items-center justify-center h-12 rounded-md px-8 font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
                        <FileText className="mr-2 w-5 h-5" /> Whitepaper
                    </a>
                </div>

                <div className="mt-16 flex flex-wrap justify-center gap-12 md:gap-24">
                    <div className="text-center">
                        <h4 className="text-4xl font-bold text-foreground">1:1</h4>
                        <span className="text-sm text-muted-foreground uppercase tracking-wider">BTC Peg</span>
                    </div>
                    <div className="text-center">
                        <h4 className="text-4xl font-bold text-foreground">25x</h4>
                        <span className="text-sm text-muted-foreground uppercase tracking-wider">Max Leverage</span>
                    </div>
                    <div className="text-center">
                        <h4 className="text-4xl font-bold text-foreground">0%</h4>
                        <span className="text-sm text-muted-foreground uppercase tracking-wider">Real Estate</span>
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
