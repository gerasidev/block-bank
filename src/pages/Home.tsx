import Hero from '../components/Hero';
import Features from '../components/Features';


function Home() {
    return (
        <>
            <Hero />
            <Features />

            <div className="container py-32 text-center bg-white text-black border-y-8 border-black">
                <h2 className="text-6xl md:text-8xl font-black mb-12 uppercase tracking-tighter italic">
                    Ready to build <br className="hidden md:block" /> the future?
                </h2>
                <a href="/borrower" className="inline-block bg-yellow-400 text-black px-12 py-6 border-4 border-black neo-shadow hover:neo-shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all font-black text-2xl uppercase tracking-[0.2em]">
                    CONNECT_IDENTITY
                </a>
            </div>
        </>
    );
}

export default Home;
