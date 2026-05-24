import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Wallet, ArrowLeft, Sun, Coffee, Moon, Download, Share2 } from 'lucide-react';
import api from '../api';

const TripDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [shareTooltip, setShareTooltip] = useState(false);
    const [budgetWarningVisible, setBudgetWarningVisible] = useState(true);

    const handleShare = async () => {
        const shareData = {
            title: trip?.itinerary?.trip_title || 'My Travel Itinerary',
            text: `Check out my itinerary for ${trip?.destination}!`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            setShareTooltip(true);
            setTimeout(() => setShareTooltip(false), 2000);
        }
    };

    const handleDownload = () => {
        window.print();
    };

    useEffect(() => {
        const fetchTrip = async () => {
            try {
                if (id && id.startsWith('guest_')) {
                    const localTrip = localStorage.getItem(`trip_${id}`);
                    if (localTrip) {
                        setTrip(JSON.parse(localTrip));
                    }
                    setLoading(false);
                    return;
                }
                const { data } = await api.get(`/trips/${id}`);
                setTrip(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchTrip();
    }, [id]);

    useEffect(() => {
        const handleItineraryUpdate = (e) => {
            if (e.detail?.newItinerary) {
                setTrip(prev => {
                    const updatedTrip = { ...prev, itinerary: e.detail.newItinerary };
                    if (id && id.startsWith('guest_')) {
                        localStorage.setItem(`trip_${id}`, JSON.stringify(updatedTrip));
                    }
                    return updatedTrip;
                });
            }
        };
        window.addEventListener('itinerary-updated', handleItineraryUpdate);
        return () => window.removeEventListener('itinerary-updated', handleItineraryUpdate);
    }, [id]);

    if (loading) return <div className="min-h-screen flex justify-center items-center text-primary text-xl font-bold">Loading...</div>;
    if (!trip || !trip.itinerary) return <div className="min-h-screen flex justify-center items-center">Trip not found.</div>;

    const itinerary = trip.itinerary;
    const costs = itinerary.estimated_costs_inr;

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-24">
            {/* Header Hero */}
            <div className={`${itinerary.weather_info?.visual_hints?.toLowerCase().includes('rain') ? 'bg-[#1e293b]' : itinerary.weather_info?.visual_hints?.toLowerCase().includes('sunny') ? 'bg-[#0B1B3D]' : 'bg-[#0B1B3D]'} pt-12 pb-20 relative overflow-hidden transition-colors duration-1000`}>
                <div className={`absolute top-0 right-0 w-[500px] h-[500px] ${itinerary.weather_info?.visual_hints?.toLowerCase().includes('sunny') ? 'bg-yellow-400/10' : 'bg-[#38bdf8]/10'} rounded-full -mr-64 -mt-64 blur-3xl`}></div>
                <div className={`absolute bottom-0 left-0 w-[300px] h-[300px] ${itinerary.weather_info?.visual_hints?.toLowerCase().includes('rain') ? 'bg-blue-400/10' : 'bg-[#CD8971]/10'} rounded-full -ml-32 -mb-32 blur-3xl`}></div>

                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-white/60 hover:text-[#38bdf8] transition-colors mb-8 font-bold text-sm tracking-widest uppercase"
                    >
                        <ArrowLeft size={16} /> Go Back
                    </button>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-2 text-[#38bdf8] font-black text-xs uppercase tracking-[0.2em] mb-3">
                                <span className="w-8 h-[1px] bg-[#38bdf8]"></span> Your Generated Journey
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 leading-tight">
                                {itinerary.trip_title}
                            </h1>
                            <div className="flex flex-wrap gap-4 text-white/80 font-bold">
                                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                                    <MapPin size={18} className="text-[#38bdf8]" /> {trip.destination}
                                </div>
                                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                                    <Calendar size={18} className="text-[#38bdf8]" /> {trip.days_count} Days
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6 no-print">
                            <div className="flex flex-col items-center bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-[2rem] min-w-[200px]">
                                <p className="text-white/50 text-[10px] uppercase font-black tracking-widest mb-1">Total Base Est.</p>
                                <h2 className="text-4xl font-black text-[#38bdf8]">
                                    ₹{((costs?.accommodation || 0) + (costs?.food || 0) + (costs?.transport || 0) + (costs?.activities || 0)).toLocaleString()}
                                </h2>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleDownload}
                                    className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-2xl border border-white/10 backdrop-blur-md transition-all"
                                >
                                    <Download size={18} /> PDF
                                </button>
                                <div className="relative flex-1">
                                    <button
                                        onClick={handleShare}
                                        className="w-full flex items-center justify-center gap-2 bg-[#38bdf8] hover:bg-[#0ea5e9] text-[#0B1B3D] font-black py-3 px-6 rounded-2xl transition-all shadow-lg shadow-[#38bdf8]/20"
                                    >
                                        <Share2 size={18} /> Share
                                    </button>
                                    {shareTooltip && (
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap animate-bounce">
                                            Link Copied!
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Budget Warning Banner */}
            {trip.budget_warning && budgetWarningVisible && (
                <div className="max-w-6xl mx-auto px-6 mt-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start justify-between gap-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl shrink-0">⚠️</span>
                            <p className="text-amber-800 font-semibold text-sm leading-relaxed">{trip.budget_warning}</p>
                        </div>
                        <button
                            onClick={() => setBudgetWarningVisible(false)}
                            className="text-amber-400 hover:text-amber-700 font-black text-lg shrink-0 transition-colors"
                        >✕</button>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto px-6 -mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Itinerary Section */}
                <div className="lg:col-span-8 space-y-12">
                    {selectedPlace ? (
                        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-gray-50 flex flex-col gap-8 animate-in slide-in-from-bottom-8 duration-500">
                            <button
                                onClick={() => setSelectedPlace(null)}
                                className="self-start inline-flex items-center gap-2 text-sm md:text-base font-black uppercase tracking-widest text-[#0B1B3D] hover:text-[#38bdf8] transition-colors bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md"
                            >
                                <ArrowLeft size={18} /> Back to Itinerary
                            </button>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="bg-[#f0f9ff] text-[#0284c7] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-blue-100">Deep Dive</span>
                                    {(selectedPlace.fee_display || selectedPlace.entry_fee_inr !== undefined) && (
                                        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-emerald-100">
                                            {selectedPlace.fee_display || (selectedPlace.entry_fee_inr === 0 ? 'Free Entry' : `Ticket: ₹${selectedPlace.entry_fee_inr}`)}
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-3xl md:text-5xl font-black text-[#0B1B3D] tracking-tight leading-tight">
                                    {selectedPlace.activity}
                                </h2>
                                <div className="flex items-center gap-4 text-gray-500 font-bold text-sm">
                                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Arrive: {selectedPlace.arrival_time}</span>
                                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-400"></div> Leave: {selectedPlace.leaving_time}</span>
                                </div>
                            </div>

                            <div className="prose prose-lg prose-blue max-w-none text-gray-600 font-medium leading-relaxed space-y-6">
                                {(selectedPlace.place_description || "No description provided.").split('\n').filter(p => p.trim()).map((paragraph, i) => (
                                    <p key={i} className="text-base md:text-lg mb-4">{paragraph}</p>
                                ))}
                            </div>

                            {selectedPlace.demo_booking_link && (
                                <div className="pt-6 border-t border-gray-100 mt-4">
                                    <a href={selectedPlace.demo_booking_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 w-full md:w-auto bg-[#0B1B3D] text-white font-black text-lg px-8 py-4 rounded-2xl hover:bg-[#38bdf8] transition-all shadow-xl shadow-blue-900/20 hover:-translate-y-1">
                                        View Details / Map ↗
                                    </a>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Overview & Quick Info */}
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-gray-50 flex flex-col gap-10">
                                {/* Vibe Section - Full Width */}
                                <div className="border-b border-gray-100 pb-8">
                                    <h2 className="text-2xl font-black text-[#0B1B3D] mb-4">The Vibe</h2>
                                    <p className="text-gray-500 font-medium leading-relaxed italic text-lg pr-4">
                                        "{itinerary.destination_overview}"
                                    </p>
                                </div>

                                <div className="flex flex-wrap md:flex-nowrap gap-6 items-stretch">
                                    {itinerary.weather_info && (
                                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-8 rounded-3xl border border-orange-100/50 flex flex-col items-center justify-center text-center flex-1 min-w-[200px]">
                                            <div className="text-4xl mb-4">
                                                {itinerary.weather_info.visual_hints?.toLowerCase().includes('sunny') ? '☀️' :
                                                    itinerary.weather_info.visual_hints?.toLowerCase().includes('rain') ? '🌧️' :
                                                        itinerary.weather_info.visual_hints?.toLowerCase().includes('cloud') ? '☁️' : '🌤️'}
                                            </div>
                                            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2">Forecast</span>
                                            <span className="text-sm font-bold text-[#0B1B3D] mb-2">{itinerary.weather_info.forecast_summary}</span>
                                            {itinerary.weather_info.approx_temperature_range && (
                                                <div className="mt-2 bg-orange-100/50 px-3 py-1 rounded-full border border-orange-200/50">
                                                    <span className="text-[11px] font-black text-orange-600 uppercase tracking-tighter">
                                                        Temp: {itinerary.weather_info.approx_temperature_range}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {itinerary.best_time_to_visit && (
                                        <div className="bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe] p-6 rounded-3xl border border-blue-100/50 flex flex-col items-center justify-center text-center flex-1 min-w-[150px]">
                                            <div className="text-4xl mb-3">✨</div>
                                            <span className="text-[10px] font-black text-[#5ba5f0] uppercase tracking-widest mb-1">Best Time</span>
                                            <span className="text-sm font-bold text-[#0B1B3D]">{itinerary.best_time_to_visit}</span>
                                        </div>
                                    )}

                                    {itinerary.local_festivals && itinerary.local_festivals !== 'None' && (
                                        <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 p-6 rounded-3xl border border-purple-100/50 flex flex-col items-center justify-center text-center flex-1 min-w-[150px]">
                                            <div className="text-4xl mb-3">🎉</div>
                                            <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Festivals</span>
                                            <span className="text-sm font-bold text-[#0B1B3D]">{itinerary.local_festivals}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Transport, Stay, and Savings */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                {itinerary.transportation && (
                                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-3xl border border-indigo-100/50">
                                        <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <MapPin size={16} className="text-indigo-500" /> Mode of Transport
                                        </h3>
                                        <p className="text-indigo-950 font-black text-xl mb-2">{itinerary.transportation.mode}</p>
                                        <p className="text-sm text-indigo-700/80 mb-4 leading-relaxed font-medium">
                                            {itinerary.transportation.suggestions_and_options}
                                        </p>
                                        <div className="flex justify-between items-center text-xs font-bold text-indigo-900 bg-white/50 backdrop-blur-sm p-3 rounded-xl">
                                            <div className="flex flex-col">
                                                <span className="text-indigo-400 uppercase tracking-wider text-[10px]">Depart</span>
                                                {itinerary.transportation.suggested_departure_time}
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-indigo-400 uppercase tracking-wider text-[10px]">Return</span>
                                                {itinerary.transportation.suggested_return_time}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {itinerary.savings_opportunities && itinerary.savings_opportunities.length > 0 && (
                                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-3xl border border-emerald-100/50">
                                        <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Wallet size={16} className="text-emerald-500" /> Savings Opportunities
                                        </h3>
                                        <ul className="text-sm text-emerald-800 font-medium leading-relaxed list-disc list-inside space-y-1">
                                            {itinerary.savings_opportunities.map((tip, i) => (
                                                <li key={i}>{tip}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {itinerary.budget_compliance && (
                                    <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-6 rounded-3xl border border-gray-100 md:col-span-2">
                                        <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Wallet size={16} className="text-gray-400" /> Budget Strategy
                                        </h3>
                                        <div className="text-sm text-gray-600 font-medium leading-relaxed space-y-2">
                                            {itinerary.budget_compliance.split('\n').map((line, i) => {
                                                const trimmed = line.trim();
                                                if (!trimmed) return null;
                                                const colonIndex = trimmed.indexOf(':');
                                                if (colonIndex !== -1 && colonIndex < 30) {
                                                    const key = trimmed.slice(0, colonIndex);
                                                    const rest = trimmed.slice(colonIndex + 1);
                                                    return (
                                                        <div key={i} className="flex items-start gap-2">
                                                            <div className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></div>
                                                            <p><span className="font-bold text-gray-800">{key}:</span>{rest}</p>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div key={i} className="flex items-start gap-2">
                                                        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-300 shrink-0 opacity-50"></div>
                                                        <p>{trimmed}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Timeline */}
                            <div className="space-y-16 pt-4">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-[#0B1B3D] text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-blue-900/20">
                                        🗓️
                                    </div>
                                    <h2 className="text-3xl font-black text-[#0B1B3D] tracking-tight">Daily Schedule</h2>
                                </div>

                                {(itinerary.daily_itinerary || []).map((dayPlan, index) => (
                                    <div key={index} className="relative pl-12 sm:pl-20">
                                        {/* Vertical Line */}
                                        {index !== (itinerary.daily_itinerary?.length || 0) - 1 && (
                                            <div className="absolute left-6 sm:left-10 top-14 bottom-0 w-0.5 bg-gradient-to-b from-[#38bdf8] to-transparent"></div>
                                        )}

                                        {/* Day Circle */}
                                        <div className="absolute left-0 sm:left-4 top-2 w-12 h-12 sm:w-14 sm:h-14 bg-white border-4 border-[#38bdf8] rounded-2xl flex flex-col items-center justify-center shadow-xl z-10 transition-transform hover:scale-110">
                                            <span className="text-[10px] font-black text-[#38bdf8] leading-none uppercase">Day</span>
                                            <span className="text-xl font-black text-[#0B1B3D] leading-none">{dayPlan.day || index + 1}</span>
                                        </div>

                                        <div className="mb-2">
                                            <h3 className="text-2xl font-black text-[#0B1B3D] tracking-tight mb-6 flex items-center gap-3">
                                                {dayPlan.theme || `Exploring the City`}
                                                <span className="w-1.5 h-1.5 bg-[#CD8971] rounded-full"></span>
                                            </h3>

                                            <div className="grid gap-6">
                                                {/* Daily Stay */}
                                                {dayPlan.stay && (
                                                    <div className="bg-gradient-to-r from-blue-50 to-transparent p-4 flex items-center justify-between rounded-2xl border border-blue-100/50">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><Moon size={18} /></div>
                                                            <div>
                                                                <p className="text-xs font-black text-blue-400 uppercase tracking-widest">Night Stay</p>
                                                                <p className="text-sm font-bold text-[#0B1B3D]">{dayPlan.stay.name} <span className="text-gray-400 font-medium text-xs">({dayPlan.stay.check_in_time} - {dayPlan.stay.check_out_time})</span></p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex flex-col items-end gap-2">
                                                            <span className="font-black text-blue-700 text-xs bg-blue-100 px-2 py-1 rounded-md">{dayPlan.stay.cost_display || `₹${dayPlan.stay.estimated_cost_per_night_inr}`} / night</span>
                                                            {dayPlan.stay.demo_booking_link && (
                                                                <a href={dayPlan.stay.demo_booking_link} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">View Stay ↗</a>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Activities */}
                                                {(dayPlan.activities || []).map((act, actIndex) => (
                                                    <React.Fragment key={actIndex}>
                                                        {/* Transit to Activity */}
                                                        {act.transit_to_activity && (
                                                            <div className="flex items-center gap-3 pl-8 py-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                                                <p className="text-xs font-bold text-gray-500">{act.transit_to_activity}</p>
                                                            </div>
                                                        )}

                                                        <div
                                                            onClick={() => setSelectedPlace(act)}
                                                            className="bg-white p-6 rounded-3xl shadow-lg shadow-blue-900/5 border border-gray-50 hover:shadow-xl hover:-translate-y-1 hover:border-[#38bdf8]/30 transition-all group cursor-pointer"
                                                        >
                                                            <div className="flex flex-col md:flex-row gap-6">
                                                                <div className="w-32 shrink-0 flex flex-col border-r border-gray-100 pr-4 mt-1">
                                                                    <span className="text-xs font-black text-gray-800 tracking-wider group-hover:text-[#38bdf8] transition-colors flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> {act.arrival_time}</span>
                                                                    <span className="text-xs font-bold text-gray-400 tracking-wider mt-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-400"></div> {act.leaving_time}</span>
                                                                    {act.distance_and_time && (
                                                                        <span className="text-[10px] font-black text-purple-600 mt-4 bg-purple-50 px-2 py-1.5 rounded-md text-center border border-purple-100">📍 {act.distance_and_time}</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 space-y-3">
                                                                    <div className="flex justify-between items-start gap-4">
                                                                        <h4 className="font-black text-[#0B1B3D] text-lg leading-snug group-hover:text-[#38bdf8] transition-colors flex items-center gap-2">
                                                                            {act.activity || 'Activity planned'}
                                                                            <ArrowLeft size={14} className="opacity-0 group-hover:opacity-100 rotate-180 transform transition-all text-[#38bdf8]" />
                                                                        </h4>
                                                                        {(act.fee_display || act.entry_fee_inr !== undefined) && (
                                                                            <span className="font-black text-emerald-700 text-xs bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md shrink-0">
                                                                                {act.fee_display || (act.entry_fee_inr === 0 ? 'Free Entry' : `₹${act.entry_fee_inr}`)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {act.place_description && (
                                                                        <p className="text-sm text-gray-500 font-medium leading-relaxed line-clamp-2">
                                                                            {act.place_description.split('\n')[0]}
                                                                        </p>
                                                                    )}
                                                                    {act.demo_booking_link && (
                                                                        <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                                                                            <a href={act.demo_booking_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs bg-[#0B1B3D] text-white font-bold px-4 py-2 rounded-xl hover:bg-[#38bdf8] transition-colors shadow-md shadow-blue-900/20">
                                                                                View Details ↗
                                                                            </a>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </React.Fragment>
                                                ))}
                                            </div>

                                            {/* Modification Prompt */}
                                            <div
                                                onClick={() => {
                                                    window.dispatchEvent(new CustomEvent('open-chat', {
                                                        detail: { message: `modify day ${dayPlan.day || index + 1} and ` }
                                                    }));
                                                }}
                                                className="mt-8 bg-gray-50/50 border border-dashed border-gray-200 rounded-3xl p-6 flex items-center justify-between group cursor-pointer hover:bg-white hover:border-[#38bdf8]/30 transition-all"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-lg">✨</div>
                                                    <div>
                                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Change plans?</p>
                                                        <p className="text-sm font-bold text-[#0B1B3D]">Ask TRAVE to modify Day {dayPlan.day || index + 1}</p>
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-[#0B1B3D] text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                                                    <Coffee size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 lg:pt-24">
                    <div className="sticky top-28 space-y-8">
                        {/* Budget Breakdown */}
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-gray-50">
                            <h3 className="text-xl font-black text-[#0B1B3D] mb-6 flex items-center gap-2">
                                <Wallet className="text-[#38bdf8]" size={24} /> Budget Breakdown
                            </h3>
                            <div className="space-y-6">
                                {[
                                    { label: 'Accommodation', val: costs?.accommodation, icon: '🏨' },
                                    { label: 'Food & Dining', val: costs?.food, icon: '🍛' },
                                    { label: 'Transportation', val: costs?.transport, icon: '🚖' },
                                    { label: 'Activities', val: costs?.activities, icon: '🎢' }
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center group">
                                        <div className="flex items-center gap-3">
                                            <span className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center filter group-hover:grayscale-0 grayscale transition-all">{item.icon}</span>
                                            <span className="text-gray-500 font-bold text-sm tracking-tight">{item.label}</span>
                                        </div>
                                        <span className="font-black text-[#0B1B3D]">₹{item.val?.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print Specific Styles */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    .min-h-screen { min-height: auto !important; }
                    .bg-[#0B1B3D] { background: #0B1B3D !important; -webkit-print-color-adjust: exact; }
                    #travel-assistant-chat { display: none !important; }
                    .shadow-xl, .shadow-2xl, .shadow-lg { box-shadow: none !important; }
                    .border { border: 1px solid #e2e8f0 !important; }
                }
            `}} />
            </div>
        </div>
    );
};

export default TripDetails;
