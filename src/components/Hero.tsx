import { motion } from 'framer-motion';
import { ArrowRight, FileText } from 'lucide-react';
import heroImg from '../assets/hero.png';

export default function Hero() {
    return (
        <section className="container grid md:grid-cols-2 gap-12 items-center py-20 md:py-32">
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
            >
                <h3 className="text-xl md:text-2xl font-medium mb-6 inline-block border-b-2 border-primary text-foreground">
                    BTC-Pegged Stablecoin
                </h3>
                <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 text-foreground">
                    Fund the <br />
                    <span>Machine Age</span>
                </h1>
                <p className="text-lg text-muted-foreground mb-8 text-balance max-w-lg">
                    $THYSEAS is the first crypto bank designed for deep-tech hardware startups.
                    Get 10–25× leverage to fund machines that move atoms—not real estate.
                </p>

                <div className="flex gap-4">
                    <a href="#" className="inline-flex items-center justify-center h-12 rounded-md px-8 font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                        Mint $THYSEAS <ArrowRight className="ml-2 w-5 h-5" />
                    </a>
                    <a href="#" className="inline-flex items-center justify-center h-12 rounded-md px-8 font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
                        <FileText className="mr-2 w-5 h-5" /> Whitepaper
                    </a>
                </div>

                <div className="mt-12 flex gap-12">
                    <div>
                        <h4 className="text-3xl font-bold text-foreground">1:1</h4>
                        <span className="text-sm text-muted-foreground uppercase tracking-wider">BTC Peg</span>
                    </div>
                    <div>
                        <h4 className="text-3xl font-bold text-foreground">25x</h4>
                        <span className="text-sm text-muted-foreground uppercase tracking-wider">Max Leverage</span>
                    </div>
                    <div>
                        <h4 className="text-3xl font-bold text-foreground">0%</h4>
                        <span className="text-sm text-muted-foreground uppercase tracking-wider">Real Estate</span>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
            >
                <div className="absolute inset-0 bg-primary/5 blur-3xl -z-10" />
                <img
                    src={heroImg}
                    alt="Cyberpunk Robot Hand"
                    className="w-full rounded-2xl border border-border shadow-2xl grayscale hover:grayscale-0 transition-all duration-700 animate-float"
                />
            </motion.div>
        </section>
    );
}
