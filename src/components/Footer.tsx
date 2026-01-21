import { Github, Twitter, Disc } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="border-t-4 border-black py-16 bg-white text-black font-bold">
            <div className="container mx-auto px-8 grid md:grid-cols-2 gap-8 items-start">
                <div>
                    <Link to="/" className="block text-3xl font-black mb-4 hover:opacity-80 transition-opacity uppercase tracking-tighter">
                        $ THYSEAS
                    </Link>
                    <p className="opacity-70 leading-relaxed uppercase tracking-widest text-[10px]">
                        The deep-tech stablecoin.<br />
                        No VC. No premine. Just hardware and code.
                    </p>
                    <div className="flex gap-4 mt-8">
                        <a href="#" className="p-2 border-2 border-black neo-shadow hover:neo-shadow-none transition-all"><Github className="w-5 h-5" /></a>
                        <a href="#" className="p-2 border-2 border-black neo-shadow hover:neo-shadow-none transition-all"><Twitter className="w-5 h-5" /></a>
                        <a href="#" className="p-2 border-2 border-black neo-shadow hover:neo-shadow-none transition-all"><Disc className="w-5 h-5" /></a>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <h4 className="mb-4 font-black uppercase tracking-widest text-xs">Protocol</h4>
                        <ul className="space-y-2 uppercase tracking-tighter text-sm opacity-60">
                            <li><a href="#" className="hover:opacity-100 transition-colors">Docs</a></li>
                            <li><a href="#" className="hover:opacity-100 transition-colors">Governance</a></li>
                            <li><a href="#" className="hover:opacity-100 transition-colors">Bug Bounty</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="mb-4 font-black uppercase tracking-widest text-xs">Legal</h4>
                        <ul className="space-y-2 uppercase tracking-tighter text-sm opacity-60">
                            <li><a href="#" className="hover:opacity-100 transition-colors">Terms</a></li>
                            <li><a href="#" className="hover:opacity-100 transition-colors">Privacy</a></li>
                            <li><a href="#" className="hover:opacity-100 transition-colors">Repo Partners</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="container mx-auto px-8 mt-16 text-center text-[10px] font-black uppercase tracking-[0.2em] opacity-30">
                © 2025 $THYSEAS Protocol. All rights reserved. Built for the machine age.
            </div>
        </footer>
    );
}
