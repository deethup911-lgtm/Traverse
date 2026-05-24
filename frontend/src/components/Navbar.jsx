import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm w-full h-[80px]">
            <div className="w-full px-4 sm:px-6 lg:px-12 h-full flex justify-between items-center">
                {/* Left Side: Logo & Badge */}
                <Link to="/" className="flex items-center gap-3">
                    <span className="text-3xl font-black tracking-tighter text-[#5C949B]">
                        TRAVERSE
                    </span>
                    <span className="bg-[#e0f2fe] text-[#0284c7] text-[11px] font-bold px-3 py-1 rounded-sm uppercase tracking-widest hidden sm:block">
                        2026 Edition
                    </span>
                </Link>

                {/* Right Side: Links & Auth */}
                <div className="flex items-center space-x-8">
                    <div className="hidden md:flex items-center space-x-8">
                        <Link to="/" className="text-[#334155] font-bold hover:text-[#5C949B] transition-colors text-sm">Plan my trip</Link>
                        <Link to="/dashboard" className="text-[#334155] font-bold hover:text-[#5C949B] transition-colors text-sm">My Dashboard</Link>
                    </div>

                    <div className="flex items-center">
                        {user ? (
                            <button
                                onClick={() => {
                                    logout();
                                    navigate('/login');
                                }}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2 rounded-lg text-sm font-bold transition-colors ml-4"
                            >
                                Sign Out
                            </button>
                        ) : (
                            <Link
                                to="/login"
                                className="bg-gray-50 hover:bg-gray-100 px-5 py-2 rounded-lg text-sm font-bold text-gray-800 transition-colors border border-gray-100"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
