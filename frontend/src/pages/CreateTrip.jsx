import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';

const popularPlaces = {
    'delhi': ["Red Fort", "Qutub Minar", "India Gate", "Lotus Temple", "Humayun's Tomb", "Chandni Chowk", "Akshardham"],
    'manali': ["Solang Valley", "Hadimba Temple", "Rohtang Pass", "Jogini Waterfall", "Mall Road", "Old Manali", "Vashisht Springs"],
    'mumbai': ["Gateway of India", "Marine Drive", "Colaba Causeway", "Elephanta Caves", "Siddhivinayak Temple", "Juhu Beach", "Haji Ali Dargah"],
    'goa': ["Baga Beach", "Calangute Beach", "Fort Aguada", "Dudhsagar Falls", "Anjuna Market", "Basilica of Bom Jesus"],
    'jaipur': ["Hawa Mahal", "Amer Fort", "City Palace", "Jantar Mantar", "Nahargarh Fort", "Jal Mahal"],
    'bengaluru': ["Lalbagh Garden", "Cubbon Park", "Bangalore Palace", "Nandi Hills", "Bannerghatta Park"],
    'bangalore': ["Lalbagh Garden", "Cubbon Park", "Bangalore Palace", "Nandi Hills", "Bannerghatta Park"],
    'agra': ["Taj Mahal", "Agra Fort", "Fatehpur Sikri", "Mehtab Bagh"],
    'paris': ["Eiffel Tower", "Louvre Museum", "Notre-Dame", "Arc de Triomphe", "Champs-Élysées", "Sacré-Cœur"],
    'london': ["British Museum", "London Eye", "Tower of London", "Big Ben", "Buckingham Palace", "Hyde Park"],
    'new york': ["Statue of Liberty", "Central Park", "Times Square", "Empire State Building", "Brooklyn Bridge"],
    'singapore': ["Marina Bay Sands", "Gardens by the Bay", "Sentosa Island", "Universal Studios", "Orchard Road"]
};

const CreateTrip = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        starting_point: '',
        destination: '',
        days: '',
        budget_range: '',
        travel_mode: 'Flight',
        local_transit: 'Private / Cabs',
        interests: [],
        start_date: '',
        end_date: '',
        trip_pace: 'Balanced (5/10)',
        accessibility: '',
        stay_style: 'Hotel',
        places_to_cover: '',
        trip_companions: 'Couple',
        family_adults: 2,
        family_kids: 1,
        gender: ''
    });

    const [placesInput, setPlacesInput] = useState('');
    const [placesList, setPlacesList] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    useEffect(() => {
        if (!placesInput.trim() || placesInput.trim().length < 2) {
            setSuggestions([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearchingSuggestions(true);
            try {
                const query = `${placesInput.trim()}, ${formData.destination || ''}`;
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
                );
                if (response.ok) {
                    const data = await response.json();
                    const places = data.map(item => {
                        const parts = item.display_name.split(',');
                        return parts.slice(0, 2).map(p => p.trim()).join(', ');
                    });
                    const uniquePlaces = [...new Set(places)].filter(p => !placesList.includes(p));
                    setSuggestions(uniquePlaces);
                }
            } catch (err) {
                console.error("Autocomplete failed:", err);
            } finally {
                setIsSearchingSuggestions(false);
            }
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [placesInput, formData.destination]);

    useEffect(() => {
        if (location.state && location.state.places_to_cover) {
            setPlacesList(location.state.places_to_cover.split(', ').filter(p => p));
        }
    }, [location]);

    useEffect(() => {
        setFormData(prev => ({ ...prev, places_to_cover: placesList.join(', ') }));
    }, [placesList]);

    const addPlace = () => {
        if (placesInput.trim() && !placesList.includes(placesInput.trim())) {
            setPlacesList([...placesList, placesInput.trim()]);
        }
        setPlacesInput('');
    };

    const removePlace = (place) => {
        setPlacesList(placesList.filter(p => p !== place));
    };

    useEffect(() => {
        if (location.state) {
            const initialValues = location.state.initialData || location.state;
            setFormData(prev => ({
                ...prev,
                ...initialValues
            }));
        }
    }, [location]);

    const INTEREST_OPTIONS = [
        'Historical Sites', 'Beaches', 'Adventure Sports',
        'Museums', 'Local Markets', 'Religious Sites',
        'Nature & Parks', 'Nightlife', 'Art Galleries',
        'Workshops', 'Culinary Tours', 'Spa & Wellness'
    ];

    const handleInterestToggle = (interest) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'start_date' && formData.days) {
            setFormData(prev => {
                if (!value) return { ...prev, [name]: value };
                const [year, month, day] = value.split('-');
                const localDate = new Date(year, month - 1, day);
                localDate.setDate(localDate.getDate() + parseInt(formData.days) - 1);
                
                const endYear = localDate.getFullYear();
                const endMonth = String(localDate.getMonth() + 1).padStart(2, '0');
                const endDay = String(localDate.getDate()).padStart(2, '0');
                
                return {
                    ...prev,
                    [name]: value,
                    end_date: `${endYear}-${endMonth}-${endDay}`
                };
            });
            return;
        }

        setFormData({ ...formData, [name]: value });
    };

    const setField = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const nextStep = () => {
        setErrorMessage('');
        if (!formData.start_date || !formData.end_date) {
            setErrorMessage('Please select both Start Date and End Date before proceeding.');
            return;
        }
        
        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.end_date);
        const today = new Date();
        today.setHours(0,0,0,0);

        if (startDate < today) {
            setErrorMessage('Starting date cannot be in the past!');
            return;
        }
        if (endDate < startDate) {
            setErrorMessage('Ending date cannot be before the starting date!');
            return;
        }

        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        
        if (!formData.starting_point || !formData.destination) {
            setErrorMessage('Starting Point and Destination are required! Go back to the Home page to start.');
            return;
        }

        if (!formData.start_date || !formData.end_date) {
            setErrorMessage('Start Date and End Date are required!');
            return;
        }

        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.end_date);
        const today = new Date();
        today.setHours(0,0,0,0);

        if (startDate < today) {
            setErrorMessage('Starting date cannot be in the past!');
            return;
        }
        if (endDate < startDate) {
            setErrorMessage('Ending date cannot be before the starting date!');
            return;
        }

        const calculatedDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        const submissionData = { ...formData, days: calculatedDays };

        console.log('Generating trip with data:', submissionData);

        setLoading(true);
        setLoadingMessage('Initializing AI... (~15s)');

        let secondsElapsed = 0;
        const interval = setInterval(() => {
            secondsElapsed++;
            if (secondsElapsed < 5) {
                setLoadingMessage('Analyzing preferences... (~10s)');
            } else if (secondsElapsed < 10) {
                setLoadingMessage('Crafting daily itinerary... (~5s)');
            } else if (secondsElapsed < 14) {
                setLoadingMessage('Finalizing details... almost there!');
            } else {
                setLoadingMessage('Just a moment, wrapping up...');
            }
        }, 1000);

        try {
            console.log('Sending request to /api/trips');
            const res = await api.post('/trips', submissionData);
            console.log('Trip created successfully:', res.data);
            if (res.data._id && res.data._id.startsWith('guest_')) {
                localStorage.setItem(`trip_${res.data._id}`, JSON.stringify(res.data));
            }
            navigate(`/trip/${res.data._id}`);
        } catch (error) {
            console.error('Failed to create trip:', error);
            if (error.response) {
                console.error('Server responded with:', error.response.status, error.response.data);
                const serverMsg = error.response.data.message || 'Server error';
                const suggestions = error.response.data.suggestions;

                if (suggestions && suggestions.length > 0) {
                    const suggestionText = suggestions.join('\n');
                    setErrorMessage(`Impossible Trip Parameters: ${suggestionText}`);
                } else {
                    const innerError = error.response.data.error || '';
                    setErrorMessage(`Failed to generate trip plan: ${serverMsg}. ${innerError}`);
                }
            } else if (error.request) {
                console.error('No response received:', error.request);
                setErrorMessage('Failed to connect to the server. Is the backend running?');
            } else {
                console.error('Error setting up request:', error.message);
                setErrorMessage('Error: ' + error.message);
            }
        } finally {
            clearInterval(interval);
            setLoading(false);
            setLoadingMessage('');
        }
    };

    const getNumericPace = (paceStr) => {
        if (!paceStr) return 5;
        const match = paceStr.match(/\((\d+)\/10\)/);
        if (match) return parseInt(match[1]);
        if (paceStr.includes('Slow')) return 2;
        if (paceStr.includes('Hectic')) return 9;
        return 5;
    };

    const paceIndex = getNumericPace(formData.trip_pace);

    const getPaceDescription = (val) => {
        if (val <= 2) return `Slow & Relaxed (${val}/10)`;
        if (val <= 4) return `Moderate (${val}/10)`;
        if (val <= 6) return `Balanced (${val}/10)`;
        if (val <= 8) return `Active & Fast (${val}/10)`;
        return `Fast & Hectic (${val}/10)`;
    };

    const handlePaceChange = (e) => {
        const val = parseInt(e.target.value);
        setField('trip_pace', getPaceDescription(val));
    };

    return (
        <div className="min-h-screen bg-[#f9fafc] flex flex-col items-center pt-8 pb-16 font-sans">
            <div className="w-full max-w-4xl px-4 sm:px-6">

                {step === 1 && (
                    <div className="animate-in fade-in duration-500">
                        <div className="mb-12">
                            <h1 className="text-4xl md:text-[2.75rem] font-black text-[#0B1B3D] tracking-tight mb-2">Trip Setup</h1>
                            <p className="text-[#64748b] text-lg font-medium">Let's lock in your travel modes and schedule.</p>
                            {errorMessage && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium shadow-sm animate-in fade-in">
                                    ⚠️ {errorMessage}
                                </div>
                            )}
                        </div>

                        <div className="space-y-12">
                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-xs font-bold text-[#8492a6] uppercase tracking-wider mb-2">Start Date</label>
                                    <input
                                        type="date" name="start_date" value={formData.start_date} onChange={handleChange} required
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full bg-white border border-gray-100 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 rounded-2xl px-5 py-4 text-base font-bold text-gray-800 outline-none shadow-sm transition-all focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#8492a6] uppercase tracking-wider mb-2">End Date</label>
                                    <input
                                        type="date" name="end_date" value={formData.end_date} onChange={handleChange} required
                                        min={formData.start_date || new Date().toISOString().split('T')[0]}
                                        className="w-full bg-white border border-gray-100 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 rounded-2xl px-5 py-4 text-base font-bold text-gray-800 outline-none shadow-sm transition-all focus:bg-white"
                                    />
                                </div>
                            </div>
                            {/* Trip Companions */}
                            <div>
                                <label className="block text-xs font-bold text-[#8492a6] uppercase tracking-wider mb-2">Trip Companions</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {['Solo', 'Couple', 'Family', 'Friends'].map(comp => (
                                        <button
                                            key={comp} type="button" onClick={() => {
                                                setField('trip_companions', comp);
                                                if (comp === 'Solo' && !formData.gender) {
                                                    setFormData(prev => ({ ...prev, trip_companions: comp, gender: 'Female' }));
                                                }
                                            }}
                                            className={`py-4 px-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-sm ${formData.trip_companions === comp ? 'bg-[#f0f9ff] text-[#0284c7] border-2 border-[#38bdf8]' : 'bg-white text-[#64748b] border border-gray-100 hover:border-gray-200'}`}
                                        >
                                            {comp === 'Solo' && '👤'}
                                            {comp === 'Couple' && '💑'}
                                            {comp === 'Family' && '👨‍👩‍👧‍👦'}
                                            {comp === 'Friends' && '🍻'}
                                            {comp}
                                        </button>
                                    ))}
                                </div>

                                {/* Solo Traveler Gender — shown only when Solo is selected */}
                                {formData.trip_companions === 'Solo' && (
                                    <div className="mt-5 p-5 bg-[#f0f9ff] border border-blue-100 rounded-2xl animate-in fade-in duration-300">
                                        <p className="text-xs font-bold text-[#0284c7] uppercase tracking-wider mb-4">👤 Solo Traveler Details</p>
                                        <div className="flex flex-col gap-2">
                                            <label className="block text-xs font-semibold text-[#64748b] mb-1">Your Gender</label>
                                            <div className="flex gap-3">
                                                {['Female', 'Male'].map(g => (
                                                    <button
                                                        key={g} type="button" onClick={() => setField('gender', g)}
                                                        className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-sm ${formData.gender === g ? 'bg-[#0284c7] text-white border border-[#0284c7]' : 'bg-white text-[#64748b] border border-gray-100 hover:border-gray-200'}`}
                                                    >
                                                        {g === 'Female' ? '👩 Female' : '👨 Male'}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-[11px] text-[#94a3b8] mt-2 font-medium">This helps TRAVE find stays that prioritize safety, security, and amenities specific to solo travelers.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Family Member Count — shown only when Family is selected */}
                                {formData.trip_companions === 'Family' && (
                                    <div className="mt-5 p-5 bg-[#f0f9ff] border border-blue-100 rounded-2xl animate-in fade-in duration-300">
                                        <p className="text-xs font-bold text-[#0284c7] uppercase tracking-wider mb-4">👨‍👩‍👧‍👦 Family Composition</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-[#64748b] mb-2">Adults</label>
                                                <div className="flex items-center gap-3 bg-white border border-blue-100 rounded-xl px-4 py-2 shadow-sm">
                                                    <button type="button"
                                                        onClick={() => setField('family_adults', Math.max(1, formData.family_adults - 1))}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[#e0f2fe] text-[#0284c7] font-black text-lg hover:bg-[#bae6fd] transition-colors">−</button>
                                                    <span className="flex-1 text-center font-black text-[#0B1B3D] text-lg">{formData.family_adults}</span>
                                                    <button type="button"
                                                        onClick={() => setField('family_adults', formData.family_adults + 1)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[#e0f2fe] text-[#0284c7] font-black text-lg hover:bg-[#bae6fd] transition-colors">+</button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-[#64748b] mb-2">Kids (under 12)</label>
                                                <div className="flex items-center gap-3 bg-white border border-blue-100 rounded-xl px-4 py-2 shadow-sm">
                                                    <button type="button"
                                                        onClick={() => setField('family_kids', Math.max(0, formData.family_kids - 1))}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[#e0f2fe] text-[#0284c7] font-black text-lg hover:bg-[#bae6fd] transition-colors">−</button>
                                                    <span className="flex-1 text-center font-black text-[#0B1B3D] text-lg">{formData.family_kids}</span>
                                                    <button type="button"
                                                        onClick={() => setField('family_kids', formData.family_kids + 1)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[#e0f2fe] text-[#0284c7] font-black text-lg hover:bg-[#bae6fd] transition-colors">+</button>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-[#94a3b8] mt-3 font-medium">This helps TRAVE plan meals, stays, and activities for your whole family.</p>
                                    </div>
                                )}
                            </div>

                            {/* Travel & Transit Mode */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-xs font-bold text-[#8492a6] uppercase tracking-wider mb-2">Main Travel Mode</label>
                                    <div className="flex gap-2 w-full h-[60px]">
                                        {['Flight', 'Private', 'Public'].map(mode => (
                                            <button
                                                key={mode} type="button" onClick={() => setField('travel_mode', mode)}
                                                className={`flex-1 flex items-center justify-center gap-2 rounded-2xl font-bold text-sm transition-all shadow-sm ${formData.travel_mode === mode ? 'bg-[#f0f9ff] text-[#0284c7] border-2 border-[#38bdf8]' : 'bg-white text-[#64748b] border border-gray-100 hover:border-gray-200'}`}
                                            >
                                                {mode === 'Flight' && '✈️'}
                                                {mode === 'Private' && '🚙'}
                                                {mode === 'Public' && '🚌'}
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#8492a6] uppercase tracking-wider mb-2">Local Transit Mode</label>
                                    <select
                                        name="local_transit" value={formData.local_transit} onChange={handleChange}
                                        className="w-full bg-white border border-gray-100 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 rounded-2xl px-5 py-4 text-base font-bold text-gray-800 outline-none shadow-sm appearance-none h-[60px] cursor-pointer"
                                    >
                                        <option value="Private / Cabs">Private / Cabs</option>
                                        <option value="Public / Bus / Metro">Public / Bus / Metro</option>
                                        <option value="Rental Scooter">Rental Bike / Scooter</option>
                                    </select>
                                </div>
                            </div>

                            {/* Interests */}
                            <div>
                                <h2 className="text-xs font-bold text-[#8492a6] uppercase tracking-wider mb-4">Interests (Select Any)</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {INTEREST_OPTIONS.map(interest => (
                                        <button
                                            key={interest} type="button"
                                            onClick={() => handleInterestToggle(interest)}
                                            className={`py-4 px-4 text-center sm:text-left rounded-2xl font-semibold text-sm transition-all shadow-sm ${formData.interests.includes(interest)
                                                ? 'bg-[#f0f9ff] text-[#0284c7] border-2 border-[#38bdf8]'
                                                : 'bg-white text-[#475569] border border-gray-100 hover:border-gray-200'
                                                }`}
                                        >
                                            {interest}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer Save */}
                        <div className="flex justify-between items-center mt-16 pt-8 border-t border-gray-200">
                            <button type="button" onClick={() => navigate('/')} className="text-[#8492a6] font-extrabold uppercase tracking-widest text-sm hover:text-gray-800 transition-colors">
                                Back
                            </button>
                            <button
                                onClick={nextStep}
                                className="bg-[#0B1B3D] text-white font-bold text-lg px-12 py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all focus:outline-none cursor-pointer"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-in fade-in duration-500">
                        <div className="mb-12">
                            <h1 className="text-4xl md:text-[2.75rem] font-black text-[#0B1B3D] tracking-tight mb-2">Personalize It</h1>
                            <p className="text-[#64748b] text-lg font-medium mb-4">The final touches for your journey.</p>
                            {errorMessage && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium shadow-sm animate-in fade-in">
                                    ⚠️ {errorMessage}
                                </div>
                            )}
                        </div>

                        <div className="space-y-10 border-t border-gray-200 pt-8">
                            {/* Places to Cover */}
                            <div>
                                <label className="block text-xs font-bold text-[#8492a6] uppercase tracking-wider mb-2">Places to Cover (Optional)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text" value={placesInput}
                                        onChange={(e) => setPlacesInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPlace(); } }}
                                        placeholder="Type a specific place and hit +"
                                        className="flex-1 bg-white border border-gray-100 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 rounded-2xl px-5 py-4 text-sm font-medium text-gray-800 outline-none shadow-sm transition-all focus:bg-white"
                                    />
                                    <button type="button" onClick={addPlace} className="bg-[#0B1B3D] text-white px-6 rounded-2xl font-black text-2xl hover:bg-[#38bdf8] transition-colors leading-none pb-1">+</button>
                                </div>
                                
                                {/* Autocomplete/pill suggestions */}
                                {placesInput.trim().length >= 2 ? (
                                    <div className="mt-2.5 animate-in fade-in duration-300">
                                        <p className="text-[11px] font-bold text-[#8492a6] uppercase tracking-wider mb-1.5">
                                            {isSearchingSuggestions ? 'Searching matching places...' : 'Matching Places:'}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {suggestions.map(place => (
                                                <button
                                                    key={place}
                                                    type="button"
                                                    onClick={() => {
                                                        setPlacesList([...placesList, place]);
                                                        setPlacesInput('');
                                                    }}
                                                    className="bg-white hover:bg-sky-50 text-gray-600 hover:text-[#0284c7] border border-gray-100 hover:border-sky-200 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1"
                                                >
                                                    ➕ {place}
                                                </button>
                                            ))}
                                            {!isSearchingSuggestions && suggestions.length === 0 && (
                                                <span className="text-xs font-semibold text-gray-400">No matching places found. Hit Enter to add as a custom place.</span>
                                            )}
                                        </div>
                                    </div>
                                ) : (() => {
                                    const dest = (formData.destination || '').toLowerCase();
                                    let matchedKey = null;
                                    for (const key of Object.keys(popularPlaces)) {
                                        if (dest.includes(key)) {
                                            matchedKey = key;
                                            break;
                                        }
                                    }
                                    if (matchedKey) {
                                        const popularSuggestions = popularPlaces[matchedKey].filter(place => 
                                            !placesList.includes(place)
                                        );
                                        if (popularSuggestions.length > 0) {
                                            return (
                                                <div className="mt-2.5 animate-in fade-in duration-300">
                                                    <p className="text-[11px] font-bold text-[#8492a6] uppercase tracking-wider mb-1.5">Popular spots in {formData.destination}:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {popularSuggestions.slice(0, 5).map(place => (
                                                            <button
                                                                key={place}
                                                                type="button"
                                                                onClick={() => setPlacesList([...placesList, place])}
                                                                className="bg-white hover:bg-sky-50 text-gray-600 hover:text-[#0284c7] border border-gray-100 hover:border-sky-200 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1"
                                                            >
                                                                ➕ {place}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                    }
                                    return null;
                                })()}

                                {placesList.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {placesList.map(place => (
                                            <div key={place} className="bg-[#f0f9ff] text-[#0284c7] font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-blue-100 shadow-sm animate-in zoom-in duration-200">
                                                {place}
                                                <button type="button" onClick={() => removePlace(place)} className="text-blue-400 hover:text-blue-800 w-4 h-4 flex items-center justify-center rounded-full hover:bg-blue-200 transition-colors">✕</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Trip Pace */}
                            <div>
                                <div className="flex justify-between items-end mb-4">
                                    <label className="text-xs font-bold text-[#8492a6] uppercase tracking-wider">Trip Pace</label>
                                    <span className={`font-bold text-sm uppercase px-3 py-1 rounded-full border transition-all ${
                                        paceIndex <= 3 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                        paceIndex <= 7 ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                        'bg-rose-50 text-rose-600 border-rose-100'
                                    }`}>{formData.trip_pace}</span>
                                </div>
                                <div className="flex items-center gap-3.5 bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                                    <span className="text-xl select-none">🐢</span>
                                    <div className="flex-1 relative">
                                        <input
                                            type="range" min="0" max="10" step="1"
                                            value={paceIndex} onChange={handlePaceChange}
                                            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all z-10 relative"
                                            style={{
                                                background: `linear-gradient(to right, ${
                                                    paceIndex <= 3 ? '#10b981' :
                                                    paceIndex <= 7 ? '#0284c7' :
                                                    '#f43f5e'
                                                } ${paceIndex * 10}%, #e5e7eb ${paceIndex * 10}%)`
                                            }}
                                        />
                                        <div className="flex justify-between mt-3 text-[11px] font-bold text-gray-400 uppercase px-1">
                                            <span className={paceIndex <= 3 ? 'text-[#10b981]' : ''}>Slow & Relaxed</span>
                                            <span className={paceIndex > 3 && paceIndex <= 7 ? 'text-[#0284c7]' : ''}>Balanced</span>
                                            <span className={paceIndex > 7 ? 'text-[#f43f5e]' : ''}>Fast & Hectic</span>
                                        </div>
                                        {/* Visual Ticks */}
                                        <div className="absolute top-[5px] left-0 w-full flex justify-between px-3 pointer-events-none">
                                            <div className={`w-2 h-2 rounded-full ${paceIndex >= 0 ? 'bg-white' : 'bg-gray-400'}`}></div>
                                            <div className={`w-2 h-2 rounded-full ${paceIndex >= 5 ? 'bg-white' : 'bg-gray-400'}`}></div>
                                            <div className={`w-2 h-2 rounded-full ${paceIndex >= 10 ? 'bg-white' : 'bg-gray-400'}`}></div>
                                        </div>
                                    </div>
                                    <span className="text-xl select-none">⚡</span>
                                </div>
                            </div>

                            {/* Accessibility */}
                            <div>
                                <label className="block text-xs font-bold text-[#8492a6] uppercase tracking-wider mb-3">Accessibility & Inclusivity</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {['Senior-Friendly', 'Wheelchair', 'Kid-Friendly'].map(acc => (
                                        <button
                                            key={acc} type="button"
                                            onClick={() => setField('accessibility', formData.accessibility === acc ? '' : acc)}
                                            className={`py-4 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${formData.accessibility === acc ? 'bg-[#f0f9ff] text-[#0284c7] border-2 border-[#38bdf8]' : 'bg-white text-[#64748b] border border-gray-100 hover:border-gray-200'
                                                }`}
                                        >
                                            {acc === 'Senior-Friendly' && '👴'}
                                            {acc === 'Wheelchair' && '♿'}
                                            {acc === 'Kid-Friendly' && '🧒'}
                                            {acc.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Stay Style (No Local Transit Here) */}
                            <div>
                                <label className="block text-xs font-bold text-[#8492a6] uppercase tracking-wider mb-2">Stay Style</label>
                                <select
                                    name="stay_style" value={formData.stay_style} onChange={handleChange}
                                    className="w-full bg-white border border-gray-100 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 rounded-2xl px-5 py-4 text-base font-bold text-gray-800 outline-none shadow-sm appearance-none h-[60px] cursor-pointer"
                                >
                                    <option value="Hostel">Hostel</option>
                                    <option value="Hotel">Hotel</option>
                                    <option value="Resort">Resort</option>
                                    <option value="Airbnb">Airbnb / Homestay</option>
                                    <option value="Luxury">Luxury Boutique</option>
                                </select>
                            </div>
                        </div>

                        {/* Footer Generate */}
                        <div className="flex justify-between items-center mt-16 pt-8 border-t border-gray-200">
                            <button type="button" onClick={() => setStep(1)} className="text-[#8492a6] font-extrabold uppercase tracking-widest text-sm hover:text-gray-800 transition-colors">
                                Back
                            </button>
                            <button
                                onClick={handleSubmit} disabled={loading}
                                className={`bg-gradient-to-r from-[#38bdf8] to-[#CD8971] text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg transition-transform focus:outline-none flex items-center justify-center min-w-[200px] cursor-pointer ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'}`}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-3">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span className="text-sm tracking-wide">{loadingMessage}</span>
                                    </span>
                                ) : 'Generate Plan ✨'}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default CreateTrip;
