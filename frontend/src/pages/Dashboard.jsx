import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Plane, Calendar, MapPin, ChevronRight, Clock, Image as ImageIcon } from 'lucide-react';

const Dashboard = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewTrip, setReviewTrip] = useState(null);
    const [reviewText, setReviewText] = useState('');
    const [rating, setRating] = useState(5);

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const res = await api.get('/trips');
                setTrips(res.data);

                // Check if any trip needs a review
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const tripToReview = res.data.find(trip => {
                    if (trip.review || trip.rating) return false;
                    if (!trip.createdAt) return false;

                    const endDate = trip.end_date ? new Date(trip.end_date) : new Date(new Date(trip.createdAt).getTime() + (trip.days_count * 24 * 60 * 60 * 1000));
                    endDate.setHours(23, 59, 59, 999);
                    return today > endDate;
                });

                if (tripToReview) {
                    setReviewTrip(tripToReview);
                }
            } catch (err) {
                console.error('Failed to fetch trips:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTrips();
    }, []);

    const handleSubmitReview = async () => {
        try {
            await api.put(`/trips/${reviewTrip._id}`, {
                review: reviewText,
                rating,
                status: 'completed'
            });
            setReviewTrip(null);
            // Refresh trips
            const res = await api.get('/trips');
            setTrips(res.data);
        } catch (err) {
            console.error('Failed to submit review:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="w-12 h-12 border-4 border-[#5C949B] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-[#334155] font-bold animate-pulse">Loading your journeys...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header section */}
            <div className="bg-[#0B1B3D] pt-20 pb-24 px-6 md:px-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#38bdf8]/10 rounded-full blur-3xl -mr-64 -mt-64"></div>
                <div className="max-w-6xl mx-auto relative z-10">
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 flex items-center gap-4">
                        My Journeys
                        <span className="text-sm bg-white/10 px-4 py-1.5 rounded-full border border-white/10 font-bold uppercase tracking-widest text-[#38bdf8]">
                            {trips.length} Planned
                        </span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-xl font-medium">All your AI-planned adventures in one place. Ready to explore?</p>
                </div>
            </div>

            {/* Trips List */}
            <div className="max-w-6xl mx-auto px-6 md:px-12 -mt-12 relative z-20">
                {trips.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-gray-100">
                        <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Plane size={32} className="text-gray-300" />
                        </div>
                        <h2 className="text-2xl font-black text-[#0B1B3D] mb-2">No trips planned yet</h2>
                        <p className="text-gray-500 font-medium mb-8 max-w-sm mx-auto">Start your first AI-guided journey today and see where TRAVE takes you.</p>
                        <Link to="/" className="inline-flex items-center gap-2 bg-[#5C949B] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#5C949B]/20 hover:scale-105 transition-transform">
                            Create a Trip <ChevronRight size={18} />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {trips.map((trip) => (
                            <Link
                                key={trip._id}
                                to={`/trip/${trip._id}`}
                                className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border border-gray-50 flex flex-col"
                            >
                                <div className="h-48 bg-[#0B1B3D] relative overflow-hidden flex items-center justify-center">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#0B1B3D] via-[#1e293b] to-[#0B1B3D] z-10 opacity-50"></div>
                                    <div className="absolute inset-0 flex items-center justify-center z-0 opacity-10">
                                        <ImageIcon size={120} className="text-white transform -rotate-12" />
                                    </div>
                                    <div className="relative z-20 flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center mb-3">
                                            <ImageIcon size={24} className="text-[#38bdf8]" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-4 left-6 z-20">
                                        <h3 className="text-white text-2xl font-black tracking-tight">{trip.destination}</h3>
                                        <div className="flex items-center gap-2 text-white/80 text-xs font-bold uppercase tracking-widest">
                                            <MapPin size={10} className="text-[#38bdf8]" /> {trip.starting_point}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 flex-grow">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 text-[#0B1B3D] font-black">
                                            <Calendar size={16} className="text-[#5C949B]" />
                                            {trip.days_count} Days
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest">
                                            <Clock size={14} />
                                            {trip.status}
                                        </div>
                                    </div>
                                    <p className="text-gray-500 text-sm font-medium line-clamp-2 leading-relaxed mb-6">
                                        {trip.itinerary?.destination_overview || `Exploring the wonders of ${trip.destination} for ${trip.days_count} budget-friendly days.`}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest group-hover:text-[#5C949B] transition-colors">Details</span>
                                        <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-[#5C949B] group-hover:text-white flex items-center justify-center transition-all">
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {reviewTrip && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                        <h2 className="text-2xl font-black text-[#0B1B3D] mb-2 text-center text-primary">How was your trip?</h2>
                        <p className="text-gray-500 text-center mb-6">Your journey to <strong>{reviewTrip.destination}</strong> has ended. We'd love to hear your thoughts!</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${rating >= star ? 'bg-[#5C949B] text-white' : 'bg-gray-100 text-gray-400'}`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Your Feedback</label>
                                <textarea
                                    className="w-full rounded-xl border-gray-200 focus:border-primary focus:ring-primary h-32 p-3 text-sm"
                                    placeholder="Tell us about the highlights..."
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setReviewTrip(null)}
                                    className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Later
                                </button>
                                <button
                                    onClick={handleSubmitReview}
                                    className="flex-2 bg-primary text-white py-3 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
