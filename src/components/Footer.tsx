import { Github, Twitter, Disc } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="border-t border-border py-16 bg-card text-card-foreground">
            <div className="container grid md:grid-cols-2 gap-8 items-start">
                <div>
                    <Link to="/" className="block text-2xl font-bold mb-4 hover:opacity-80 transition-opacity">
                        <span className="text-foreground">$ THYSEAS</span>
                    </Link>
                    <p className="text-muted-foreground leading-relaxed">
                        The deep-tech stablecoin.<br />
                        No VC. No premine. Just hardware and code.
                    </p>
                    <div className="flex gap-4 mt-4">
                        <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Github className="w-5 h-5" /></a>
                        <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Twitter className="w-5 h-5" /></a>
                        <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Disc className="w-5 h-5" /></a>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <h4 className="mb-4 font-semibold text-primary">Protocol</h4>
                        <ul className="space-y-2 text-muted-foreground">
                            <li><a href="#" className="hover:text-foreground transition-colors">Docs</a></li>
                            <li><a href="#" className="hover:text-foreground transition-colors">Governance</a></li>
                            <li><a href="#" className="hover:text-foreground transition-colors">Bug Bounty</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="mb-4 font-semibold text-primary">Legal</h4>
                        <ul className="space-y-2 text-muted-foreground">
                            <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                            <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                            <li><a href="#" className="hover:text-foreground transition-colors">Repo Partners</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="container mt-16 text-center text-sm text-muted-foreground">
                © 2025 $THYSEAS Protocol. All rights reserved. Built for the machine age.
            </div>
        </footer>
    );
}
