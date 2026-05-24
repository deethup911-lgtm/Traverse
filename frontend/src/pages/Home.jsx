import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Wallet, PlaneTakeoff, Map } from 'lucide-react';

const Home = () => {
    const { user, login } = useAuth();
    const navigate = useNavigate();

    const [homeData, setHomeData] = useState({
        starting_point: '',
        destination: '',
        days: '',
        budget_range: ''
    });

    const [suggestions, setSuggestions] = useState({ origin: [], destination: [] });
    const [showSuggestions, setShowSuggestions] = useState({ origin: false, destination: false });
    const debounceTimeout = useRef(null);

    const [loginData, setLoginData] = useState({ username: '', password: '' });
    const [loginError, setLoginError] = useState('');

    const handleLoginChange = (e) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        try {
            await login(loginData.username, loginData.password);
        } catch (err) {
            setLoginError(err.response?.data?.message || 'Invalid credentials');
        }
    };

    const fetchLocationSuggestions = async (query, type) => {
        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`;
            const response = await fetch(url, {
                headers: {
                    'Accept-Language': 'en-US,en;q=0.9',
                    'User-Agent': 'Traverse-TripPlanner/1.0'
                }
            });
            const data = await response.json();

            const places = data.map(item => {
                // Format the display name to be shorter if possible, but the API's default is usually fine
                const parts = item.display_name.split(', ');
                return parts.length > 3 ? `${parts[0]}, ${parts[1]}, ${parts[parts.length - 1]}` : item.display_name;
            });

            const uniquePlaces = [...new Set(places)];

            setSuggestions(prev => ({ ...prev, [type]: uniquePlaces }));
            setShowSuggestions(prev => ({ ...prev, [type]: true }));
        } catch (error) {
            console.error("Error fetching locations:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setHomeData(prev => ({ ...prev, [name]: value }));

        // Handle Custom Suggestions with Debounce
        if (name === 'starting_point' || name === 'destination') {
            const type = name === 'starting_point' ? 'origin' : 'destination';

            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }

            if (value.length >= 2) {
                debounceTimeout.current = setTimeout(() => {
                    fetchLocationSuggestions(value, type);
                }, 400); // 400ms debounce
            } else {
                setSuggestions(prev => ({ ...prev, [type]: [] }));
                setShowSuggestions(prev => ({ ...prev, [type]: false }));
            }
        }
    };

    const handleSelectSuggestion = (type, value) => {
        const fieldName = type === 'origin' ? 'starting_point' : 'destination';
        setHomeData(prev => ({ ...prev, [fieldName]: value }));
        setShowSuggestions(prev => ({ ...prev, [type]: false }));
    };

    const handlePlanTrip = (e) => {
        e.preventDefault();
        navigate('/create', { state: { initialData: homeData } });
    };

    return (
        <div className="min-h-screen font-sans flex flex-col relative w-full overflow-x-hidden">
            {/* Hero Section Container */}
            <main className="flex-grow flex flex-col items-center justify-start relative w-full pt-20 pb-32">
                {/* Background Image Setup */}
                <div
                    className="absolute inset-0 z-0 w-full h-full"
                    style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=2952&auto=format&fit=crop')`, // Taj Mahal Image
                        backgroundPosition: 'center 40%',
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    {/* Dark gradient overlay for extreme text readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-transparent"></div>
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 w-full max-w-6xl px-4 flex flex-col items-center pt-8">

                    {/* Badge */}
                    <div className="bg-black/40 backdrop-blur-md text-white/90 text-sm font-semibold px-4 py-1.5 rounded-full mb-8 flex items-center gap-2 border border-white/20">
                        <span className="text-xl leading-none">🧭</span> AI-Powered Travel Planning
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-[5rem] sm:text-[6rem] md:text-[7rem] lg:text-[8rem] font-black text-white leading-[0.9] tracking-tight text-center drop-shadow-2xl">
                        Plan Your Perfect <br />
                        <span className="text-[#38A3A5] drop-shadow-xl inline-block mt-2">Journey</span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-white md:text-xl text-center max-w-2xl mt-8 font-medium drop-shadow-md tracking-wide leading-relaxed">
                        Explore personalized, budget-aware travel itineraries with our AI generator. No sign-up required to start!
                    </p>

                    {/* Floating Form Widget */}
                    <div className="mt-16 w-full max-w-4xl bg-white rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col items-center gap-4 border border-gray-100 relative z-50">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">

                            {/* From */}
                            <div className="relative flex flex-col">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <PlaneTakeoff className="w-4 h-4 text-gray-400" /> Origin
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="starting_point"
                                        placeholder="Starting city"
                                        value={homeData.starting_point}
                                        onChange={handleChange}
                                        onBlur={() => setTimeout(() => setShowSuggestions(prev => ({ ...prev, origin: false })), 200)}
                                        className="w-full bg-white border-2 border-[#5ce1e6] focus:border-[#5ce1e6] rounded-xl px-4 py-3 text-gray-800 font-semibold focus:outline-none transition-colors"
                                        id="origin-input"
                                        autoComplete="off"
                                    />
                                    {showSuggestions.origin && suggestions.origin.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden border">
                                            {suggestions.origin.map((loc, idx) => (
                                                <div
                                                    key={idx}
                                                    className="px-4 py-3 hover:bg-[#5ce1e6]/10 cursor-pointer text-gray-700 transition-colors border-b last:border-b-0 border-gray-50 font-medium"
                                                    onClick={() => handleSelectSuggestion('origin', loc)}
                                                >
                                                    {loc}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* To */}
                            <div className="relative flex flex-col">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <MapPin className="w-4 h-4 text-[#FF5A5F]" fill="#FF5A5F" /> Destination
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="destination"
                                        placeholder="Where to?"
                                        value={homeData.destination}
                                        onChange={handleChange}
                                        onBlur={() => setTimeout(() => setShowSuggestions(prev => ({ ...prev, destination: false })), 200)}
                                        className="w-full bg-gray-50 border border-transparent focus:border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-semibold focus:bg-white focus:outline-none transition-all"
                                        id="destination-input"
                                        autoComplete="off"
                                    />
                                    {showSuggestions.destination && suggestions.destination.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden border">
                                            {suggestions.destination.map((loc, idx) => (
                                                <div
                                                    key={idx}
                                                    className="px-4 py-3 hover:bg-[#FF5A5F]/10 cursor-pointer text-gray-700 transition-colors border-b last:border-b-0 border-gray-50 font-medium"
                                                    onClick={() => handleSelectSuggestion('destination', loc)}
                                                >
                                                    {loc}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Days */}
                            <div className="relative flex flex-col">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <Calendar className="w-4 h-4 text-blue-400" /> Duration
                                </label>
                                <input
                                    type="number"
                                    name="days"
                                    min="1"
                                    placeholder="Days"
                                    value={homeData.days}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 border border-transparent focus:border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-semibold focus:bg-white focus:outline-none transition-all"
                                />
                            </div>

                            {/* Budget */}
                            <div className="relative flex flex-col">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <Wallet className="w-4 h-4 text-[#5c949b]" /> Budget
                                </label>
                                <input
                                    type="number"
                                    name="budget_range"
                                    placeholder="INR Amount"
                                    value={homeData.budget_range}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 border border-transparent focus:border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-semibold focus:bg-white focus:outline-none transition-all"
                                />
                            </div>

                        </div>
                    </div>

                    {/* Centered Submit Button */}
                    <div className="mt-8 relative z-40 flex flex-col items-center">
                        <button
                            onClick={handlePlanTrip}
                            id="plan-trip-btn"
                            className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#4E9C9F] to-[#CD8971] text-white font-bold text-lg px-12 py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 border border-white/20 cursor-pointer"
                        >
                            Plan My Trip <span className="text-white/80 group-hover:translate-x-1 transition-transform">{"->"}</span>
                        </button>
                    </div>



                </div>
            </main>
        </div>
    );
};

export default Home;
