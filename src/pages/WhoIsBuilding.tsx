import { useState, useEffect } from 'react';
import { Plus, MapPin, X, Loader2, Hammer, Zap, Globe } from 'lucide-react';
import { Map, MapMarker, MapPopup } from '../components/ui/map';

interface Builder {
    id: string;
    name: string;
    location: string;
    coordinates: [number, number]; // [lon, lat] from server
    building: string;
    category: string;
}

const API_BASE = "http://localhost:3001/api";

export default function WhoIsBuilding() {
    const [builders, setBuilders] = useState<Builder[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newBuild, setNewBuild] = useState({
        name: '',
        location: '',
        building: '',
        category: 'ROBOTICS'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchBuilders();
    }, []);

    const fetchBuilders = async () => {
        try {
            const res = await fetch(`${API_BASE}/builders`);
            const data = await res.json();
            setBuilders(data);
        } catch (err) {
            console.error("Failed to fetch builders", err);
        }
    };

    const handleAddBuild = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/builders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBuild)
            });

            if (res.ok) {
                const addedBuilder = await res.json();
                setBuilders([...builders, addedBuilder]);
                setShowAddForm(false);
                setNewBuild({ name: '', location: '', building: '', category: 'ROBOTICS' });
            }
        } catch (err) {
            console.error("Failed to add build", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-20 px-4 space-y-12 min-h-screen max-w-[1600px]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-black pb-8">
                <div className="space-y-4">
                    <div className="inline-block bg-white text-black px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-black neo-shadow">
                        NETWORK_STATUS: GLOBAL_EXPANSION
                    </div>
                    <h1 className="text-6xl font-black uppercase tracking-tighter leading-none">
                        Who is <br /> Building?
                    </h1>
                    <p className="text-sm font-bold opacity-70 uppercase tracking-widest max-w-xl">
                        A real-time visualization of the $THYSEAS ecosystem using precision Leaflet mapping. Robotics, Biotech, and fractional systems.
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-black text-white px-8 py-4 border-4 border-black neo-shadow hover:neo-shadow-none transition-all font-black uppercase tracking-widest text-sm flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> REGISTER_BUILD
                </button>
            </div>

            <div className="grid lg:grid-cols-12 gap-4">
                {/* MAP PANEL */}
                <div className="lg:col-span-9 neo-card bg-white border-4 !p-0 overflow-hidden relative min-h-[750px] z-10 flex flex-col">
                    <div className="absolute top-4 left-4 z-[1000]">
                        <div className="bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-black neo-shadow-sm skew-x-[-10deg]">
                            PRECISION_MAP: LEAFLET_ENGINE
                        </div>
                    </div>

                    <Map className="flex-1" center={[20, 0]} zoom={2}>
                        {builders.map((builder) => (
                            <MapMarker
                                key={builder.id}
                                position={[builder.coordinates[1], builder.coordinates[0]]}
                            >
                                <MapPopup>
                                    <div className="p-2 space-y-2 min-w-[150px]">
                                        <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none">
                                            {builder.category}
                                        </div>
                                        <div className="text-sm font-black uppercase tracking-tight text-black">
                                            {builder.name}
                                        </div>
                                        <div className="text-[10px] font-bold text-zinc-600 bg-zinc-100 px-2 py-1 border border-zinc-200">
                                            {builder.building}
                                        </div>
                                        <div className="text-[8px] font-black italic opacity-50 flex items-center gap-1">
                                            <MapPin className="w-2 h-2" /> {builder.location}
                                        </div>
                                    </div>
                                </MapPopup>
                            </MapMarker>
                        ))}
                    </Map>
                </div>

                {/* LIST PANEL */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="neo-card bg-zinc-950 text-white border-4 !p-6 space-y-4">
                        <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
                            <Globe className="w-5 h-5" /> RECENT_ACTIVITY
                        </h3>
                        <div className="space-y-4">
                            {builders.slice(-4).reverse().map((builder) => (
                                <div key={builder.id} className="border-l-4 border-white pl-4 space-y-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-50">{builder.category}</div>
                                    <div className="text-sm font-black uppercase tracking-tight">{builder.name}</div>
                                    <div className="text-[10px] font-bold opacity-70 italic flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {builder.location}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="neo-card bg-white border-4 !p-6 space-y-4">
                        <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400" /> STATS
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="border-2 border-black p-3 bg-zinc-50">
                                <div className="text-[8px] font-black uppercase opacity-50">Total Builds</div>
                                <div className="text-2xl font-black">{builders.length}</div>
                            </div>
                            <div className="border-2 border-black p-3 bg-zinc-50">
                                <div className="text-[8px] font-black uppercase opacity-50">Categories</div>
                                <div className="text-2xl font-black">{new Set(builders.map(b => b.category)).size}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ADD FORM MODAL */}
            {showAddForm && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white border-8 border-black w-full max-w-xl neo-shadow-lg p-8 relative">
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-zinc-100 transition-colors border-2 border-black"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="space-y-8">
                            <div>
                                <h2 className="text-4xl font-black uppercase tracking-tighter">Register Your Build</h2>
                                <p className="text-sm font-bold opacity-60 uppercase tracking-widest">Join the machine age ecosystem.</p>
                            </div>

                            <form onSubmit={handleAddBuild} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Entity / Builder Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={newBuild.name}
                                        onChange={(e) => setNewBuild({ ...newBuild, name: e.target.value })}
                                        placeholder="e.g. CYBERNETIC LABS"
                                        className="w-full bg-white border-4 border-black p-4 font-black text-sm focus:bg-zinc-100 outline-none uppercase"
                                    />
                                </div>

                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Physical Location</label>
                                        <input
                                            required
                                            type="text"
                                            value={newBuild.location}
                                            onChange={(e) => setNewBuild({ ...newBuild, location: e.target.value })}
                                            placeholder="e.g. BERLIN, DE"
                                            className="w-full bg-white border-4 border-black p-4 font-black text-sm focus:bg-zinc-100 outline-none uppercase"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Category</label>
                                        <select
                                            value={newBuild.category}
                                            onChange={(e) => setNewBuild({ ...newBuild, category: e.target.value })}
                                            className="w-full bg-white border-4 border-black p-4 font-black text-sm focus:bg-zinc-100 outline-none uppercase appearance-none"
                                        >
                                            <option>ROBOTICS</option>
                                            <option>BIOTECH</option>
                                            <option>HARDWARE</option>
                                            <option>SOFTWARE</option>
                                            <option>FINTECH</option>
                                            <option>ENERGY</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50">What are you building?</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={newBuild.building}
                                        onChange={(e) => setNewBuild({ ...newBuild, building: e.target.value })}
                                        placeholder="Brief description of your project..."
                                        className="w-full bg-white border-4 border-black p-4 font-black text-sm focus:bg-zinc-100 outline-none uppercase"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-black text-white px-8 py-6 border-4 border-black neo-shadow hover:neo-shadow-none transition-all font-black uppercase tracking-widest text-lg flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" /> PROCESSING...
                                        </>
                                    ) : (
                                        <>
                                            <Hammer className="w-6 h-6" /> SUBMIT_BUILD_RECORD
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
