import Hero from '../components/Hero';
import Features from '../components/Features';


function Home() {
    return (
        <>
            <Hero />
            <Features />

            <div className="container py-24 text-center">
                <h2 className="text-4xl md:text-5xl font-bold mb-8 text-foreground">
                    Ready to build the future?
                </h2>
                <a href="#" className="inline-flex items-center justify-center h-11 rounded-md px-8 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    Get Started
                </a>
            </div>
        </>
    );
}

export default Home;
