import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import api from '../api';

const Chatbot = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hi! I'm TRAVE. Need help planning or adjusting your trip?", isBot: true }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const handleOpenChat = (e) => {
            setIsOpen(true);
            if (e.detail?.message) {
                setInput(e.detail.message);
            }
        };
        window.addEventListener('open-chat', handleOpenChat);
        return () => window.removeEventListener('open-chat', handleOpenChat);
    }, []);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input;
        setMessages(prev => [...prev, { text: userMessage, isBot: false }]);
        setInput('');
        setLoading(true);

        // Context aware if on a Trip Details page
        const tripIdMatch = location.pathname.match(/\/trip\/([a-z0-9_]+)/i);
        const trip_id = tripIdMatch ? tripIdMatch[1] : null;

        let tripData = null;
        if (trip_id && trip_id.startsWith('guest_')) {
            const localTrip = localStorage.getItem(`trip_${trip_id}`);
            if (localTrip) tripData = JSON.parse(localTrip);
        }

        try {
            const response = await api.post('/chat', { query: userMessage, trip_id, tripData });
            setMessages(prev => [...prev, { text: response.data.answer, isBot: true }]);

            if (response.data.updated_itinerary) {
                window.dispatchEvent(new CustomEvent('itinerary-updated', {
                    detail: { newItinerary: response.data.updated_itinerary }
                }));
            }
        } catch (error) {
            setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting right now.", isBot: true }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`${isOpen ? 'hidden' : 'flex'} fixed bottom-6 right-6 group items-center gap-3 bg-gradient-to-r from-[#0B1B3D] to-[#1e293b] text-white pl-4 pr-6 py-3 rounded-full shadow-2xl hover:-translate-y-1 transition-all z-50`}
            >
                <div className="relative">
                    <MessageCircle size={24} />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#38bdf8] rounded-full border-2 border-[#0B1B3D] animate-ping"></span>
                </div>
                <span className="font-bold text-sm tracking-tight">Chat with TRAVE AI</span>
            </button>

            {isOpen && (
                <div className="fixed bottom-6 right-6 w-80 sm:w-[400px] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-100 flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5 duration-300" style={{ height: '600px', maxHeight: '85vh' }}>
                    {/* Header */}
                    <div className="bg-[#0B1B3D] text-white px-5 py-5 flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#38bdf8]/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md"><Bot size={22} className="text-[#38bdf8]" /></div>
                            <div>
                                <h3 className="font-extrabold text-lg leading-tight uppercase tracking-wide">TRAVE AI</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Active Assistant</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors relative z-10"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-5 overflow-y-auto bg-[#f8fafc] flex flex-col gap-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed shadow-sm ${msg.isBot
                                    ? 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                    : 'bg-[#0B1B3D] text-white rounded-tr-none'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-5 py-4 text-sm shadow-sm flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-[#38bdf8] rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-[#38bdf8] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                    <span className="w-1.5 h-1.5 bg-[#38bdf8] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white border-t border-gray-100 shadow-inner">
                        <form onSubmit={handleSend} className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask TRAVE or request a change..."
                                className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/30 focus:bg-white transition-all"
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="bg-[#0B1B3D] text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-[#1e293b] transition-all disabled:opacity-40 disabled:scale-95 shadow-lg active:scale-90"
                            >
                                <Send size={20} className="translate-x-[-1px] translate-y-[1px]" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Chatbot;
