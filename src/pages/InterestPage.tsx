import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import SpaceIcon from '../assets/page2-assets/spaceicon.svg';
import LogoIcon from '../assets/page2-assets/logoicon.png';
import { api } from '../services/api';

// System status type
interface SystemStatusData {
    status: 'open' | 'closed' | 'unknown';
    message: string;
    warning?: boolean;
    is_manual_override?: boolean;
    minutes_until_close?: number;
}

export const InterestPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        company: '',
        role: ''
    });
    const [loading, setLoading] = useState(false);

    // System status state
    const [systemStatus, setSystemStatus] = useState<SystemStatusData>({
        status: 'unknown',
        message: 'Checking system status...'
    });
    const [statusLoading, setStatusLoading] = useState(true);

    // Fetch system status on mount and periodically
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const result = await api.getSystemStatus();
                if (result.success && result.data) {
                    setSystemStatus({
                        status: result.data.status as 'open' | 'closed',
                        message: result.data.message,
                        warning: result.data.warning,
                        is_manual_override: result.data.is_manual_override,
                        minutes_until_close: result.data.minutes_until_close
                    });
                } else {
                    setSystemStatus({
                        status: 'unknown',
                        message: 'Unable to determine system status'
                    });
                }
            } catch {
                setSystemStatus({
                    status: 'unknown',
                    message: 'Connection error'
                });
            } finally {
                setStatusLoading(false);
            }
        };

        checkStatus();

        // Poll every 30 seconds
        const interval = setInterval(checkStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Interest form submission - ALWAYS AVAILABLE (works even when MIS is offline)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.fullName || !formData.email) {
            toast.error('Please fill in required fields');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            const result = await api.submitInterest({
                full_name: formData.fullName,
                email: formData.email,
                company: formData.company || undefined,
                role: formData.role || undefined,
            });

            if (result.success && result.data) {
                toast.success(result.data.message || 'Thank you for your interest! We will contact you soon with an invitation.');
                // Clear form
                setFormData({ fullName: '', email: '', company: '', role: '' });
            } else {
                toast.error(result.error || 'Something went wrong. Please try again.');
            }
        } catch {
            toast.error('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    // Navigate to registration - ONLY when MIS is ONLINE
    const handleNavigateToRegistration = () => {
        if (systemStatus.status === 'closed') {
            toast.warning('Registration is currently offline. Please try again during operating hours or submit your interest above to receive an invitation.');
            return;
        }
        if (systemStatus.status === 'unknown') {
            toast.warning('Unable to verify system status. Please try again in a moment.');
            return;
        }
        navigate('/invitation');
    };

    // Get status indicator styles
    const getStatusStyles = () => {
        if (statusLoading) {
            return {
                bgColor: 'bg-gray-400',
                pulseColor: 'bg-gray-300',
                glowColor: 'shadow-gray-400/50',
                textColor: 'text-gray-600',
                label: 'Checking...',
                icon: '◌'
            };
        }

        switch (systemStatus.status) {
            case 'open':
                return systemStatus.warning ? {
                    bgColor: 'bg-amber-500',
                    pulseColor: 'bg-amber-400',
                    glowColor: 'shadow-amber-500/50',
                    textColor: 'text-amber-700',
                    label: `Closing Soon (${systemStatus.minutes_until_close}min)`,
                    icon: '⚠'
                } : {
                    bgColor: 'bg-emerald-500',
                    pulseColor: 'bg-emerald-400',
                    glowColor: 'shadow-emerald-500/50',
                    textColor: 'text-emerald-700',
                    label: 'MIS Online',
                    icon: '●'
                };
            case 'closed':
                return {
                    bgColor: 'bg-red-500',
                    pulseColor: 'bg-red-400',
                    glowColor: 'shadow-red-500/50',
                    textColor: 'text-red-700',
                    label: 'MIS Offline',
                    icon: '○'
                };
            default:
                return {
                    bgColor: 'bg-gray-400',
                    pulseColor: 'bg-gray-300',
                    glowColor: 'shadow-gray-400/50',
                    textColor: 'text-gray-600',
                    label: 'Unknown',
                    icon: '?'
                };
        }
    };

    const statusStyles = getStatusStyles();
    const isOnline = systemStatus.status === 'open';
    const isOffline = systemStatus.status === 'closed';

    return (
        <div className="flex min-h-screen w-full font-['Inter']">
            {/* Left Side - Space Icon */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#d9d9d9] relative items-center justify-center overflow-hidden">
                {/* 3D Space Icon */}
                <div className="relative z-10 w-3/4 max-w-lg aspect-square flex items-center justify-center">
                    <img
                        src={SpaceIcon}
                        alt="Space Icon"
                        className={`w-full h-full object-contain drop-shadow-2xl transition-all duration-1000 ${isOffline ? 'opacity-50 grayscale animate-float-slow' : 'animate-float-lift'
                            }`}
                    />
                </div>

                {/* Offline Overlay for Left Side */}
                {isOffline && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/10 to-gray-900/20 pointer-events-none" />
                )}
            </div>

            {/* Right Side - Light with Form */}
            <div className={`w-full lg:w-1/2 bg-[#d9d9d9] flex flex-col items-center justify-center p-4 sm:p-8 relative transition-all duration-700 ${isOffline ? 'bg-opacity-95' : ''
                }`}>

                {/* ═══════════════════════════════════════════════════════════
                    LIVING STATUS BEACON - Top Right Corner
                ═══════════════════════════════════════════════════════════ */}
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
                    <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200">
                        {/* Animated Pulse Orb */}
                        <div className="relative">
                            {/* Outer pulse ring */}
                            <div
                                className={`absolute inset-0 rounded-full ${statusStyles.pulseColor} ${isOnline ? 'animate-ping-fast' : isOffline ? 'animate-pulse-slow' : ''
                                    } opacity-75`}
                            />
                            {/* Core orb */}
                            <div className={`relative w-3 h-3 rounded-full ${statusStyles.bgColor} shadow-lg ${statusStyles.glowColor}`} />
                        </div>

                        {/* Status Text */}
                        <span className={`text-sm font-semibold ${statusStyles.textColor} whitespace-nowrap`}>
                            {statusStyles.label}
                        </span>
                    </div>
                </div>

                <div className="w-full max-w-md space-y-2">
                    {/* Header */}
                    <div className="flex flex-col items-center">
                        <Link to="/" className="cursor-pointer hover:opacity-80 transition-opacity">
                            <img
                                src={LogoIcon}
                                alt="SPACE - Back to Home"
                                className={`mb-4 object-contain transition-all duration-500 h-[100px] ${isOffline ? 'opacity-70 grayscale-[30%]' : ''
                                    }`}
                            />
                        </Link>
                        <h1 className="text-4xl font-black text-[#28282B] tracking-[0.1em] uppercase text-center font-['boxing']">
                            Register Your Interest
                        </h1>
                        <p className="text-gray-600 text-sm text-center font-normal font-['boxing']">
                            Be the first to explore the future.
                        </p>
                    </div>

                    {/* ═══════════════════════════════════════════════════════════
                        INTEREST/WAITLIST FORM - ALWAYS ACTIVE
                        This form allows users to request an invitation even when
                        the registration system is offline.
                    ═══════════════════════════════════════════════════════════ */}
                    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                        {/* Helpful note when offline */}
                        {isOffline && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-blue-800 text-sm text-center">
                                    <span className="font-semibold">💡 Tip:</span> While registration is offline, you can still submit your interest below to receive an invitation when we're back online.
                                </p>
                            </div>
                        )}

                        <div className="space-y-5">
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-none focus:ring-2 focus:ring-[#28282B] focus:border-transparent transition outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john@example.com"
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-none focus:ring-2 focus:ring-[#28282B] focus:border-transparent transition outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                                    Company <span className="text-gray-400 font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    id="company"
                                    name="company"
                                    value={formData.company}
                                    onChange={handleChange}
                                    placeholder="Company Ltd."
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-none focus:ring-2 focus:ring-[#28282B] focus:border-transparent transition outline-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#28282B] text-white text-lg font-semibold py-4 rounded-none hover:bg-gray-800 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    REQUEST INVITATION
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    {/* ═══════════════════════════════════════════════════════════
                        REGISTRATION SECTION - REQUIRES ONLINE STATUS
                        This section allows users with invitation codes to proceed
                        ONLY when the registration system is online.
                    ═══════════════════════════════════════════════════════════ */}
                    <div className="mt-8 pt-6 border-t-2 border-gray-300">
                        {/* Section Header */}
                        <div className="text-center mb-4">
                            <h2 className="text-lg font-bold text-[#28282B] uppercase tracking-wide">
                                Already Have an Invitation?
                            </h2>
                            <p className="text-gray-600 text-sm mt-1">
                                Enter your <span className="font-bold text-[#28282B]">Invitation Code</span> to complete registration
                            </p>
                        </div>

                        {/* Offline Warning Banner */}
                        {isOffline && (
                            <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-red-50 via-orange-50 to-red-50 border border-red-200 p-4 shadow-inner mb-4">
                                {/* Animated background stripes */}
                                <div className="absolute inset-0 opacity-10 bg-warning-stripes" />

                                <div className="relative flex items-center gap-3">
                                    {/* Animated Icon */}
                                    <div className="flex-shrink-0">
                                        <svg
                                            className="w-8 h-8 text-red-500 animate-pulse"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                                            />
                                        </svg>
                                    </div>

                                    <div className="flex-1 text-left">
                                        <p className="text-red-800 font-bold text-sm">
                                            Registration System Offline
                                        </p>
                                        <p className="text-red-600 text-xs mt-0.5">
                                            {systemStatus.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Warning Banner for Closing Soon */}
                        {isOnline && systemStatus.warning && (
                            <div className="rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 p-3 shadow-sm mb-4">
                                <div className="flex items-center gap-2 justify-center">
                                    <svg className="w-5 h-5 text-amber-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-amber-700 text-sm font-medium">
                                        System closing in {systemStatus.minutes_until_close} minutes - Complete registration quickly!
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Smart Registration Button */}
                        <button
                            type="button"
                            onClick={handleNavigateToRegistration}
                            disabled={isOffline || statusLoading}
                            className={`relative w-full text-lg font-semibold py-4 rounded-none transition-all duration-300 transform flex items-center justify-center gap-2 overflow-hidden ${isOffline
                                ? 'bg-gray-300 text-gray-500 border-2 border-gray-400 cursor-not-allowed opacity-75'
                                : 'bg-transparent border-2 border-[#28282B] text-[#28282B] hover:bg-[#28282B] hover:text-white hover:-translate-y-0.5 active:translate-y-0'
                                }`}
                        >
                            {/* Lock Icon Overlay for Offline */}
                            {isOffline && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-200/50">
                                    <svg
                                        className="w-6 h-6 text-gray-500 opacity-50"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                            )}

                            <span className={isOffline ? 'opacity-50' : ''}>
                                {isOffline ? 'REGISTRATION UNAVAILABLE' : 'COMPLETE REGISTRATION'}
                            </span>

                            {!isOffline && (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* CSS for custom animations */}
            <style>{`
                @keyframes slide {
                    from { transform: translateX(-20px); }
                    to { transform: translateX(20px); }
                }
                
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                
                .animate-float-slow {
                    animation: float-slow 6s ease-in-out infinite;
                }
                
                .animate-pulse-slow {
                    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
};
