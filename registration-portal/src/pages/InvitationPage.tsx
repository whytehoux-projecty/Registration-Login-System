/**
 * Invitation Page - Verify invitation code and PIN
 * Connected to Central Auth API backend
 * Theme: Light grey (#d9d9d9) with Chaco Black (#28282B)
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { useRegistrationSession, useSystemStatus } from '../hooks';
import LogoIcon from '../assets/page2-assets/logoicon.png';

export const InvitationPage: React.FC = () => {
    const navigate = useNavigate();

    // Hooks
    const { session, timeRemaining, startSession, formatTime } = useRegistrationSession();
    const { status, isLoading: statusLoading, isOpen } = useSystemStatus();

    // Form state
    const [invitationCode, setInvitationCode] = useState('');
    const [pin, setPin] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);

    // Get timer color class
    const getTimerClass = () => {
        if (timeRemaining < 300) return 'text-red-600 bg-red-100'; // < 5 min
        if (timeRemaining < 900) return 'text-yellow-700 bg-yellow-100'; // < 15 min
        return 'text-[#28282B] bg-[#28282B]/10';
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!invitationCode.trim() || !pin.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        if (!termsAccepted) {
            toast.error('Please accept the terms and conditions');
            return;
        }

        // Check system status
        if (!isOpen) {
            toast.error(status?.message || 'Registration is currently closed');
            return;
        }

        setLoading(true);

        try {
            // Call API to verify invitation
            const result = await api.verifyInvitation({
                invitation_code: invitationCode.toUpperCase().trim(),
                pin: pin.trim(),
            });

            if (result.success && result.data?.valid) {
                // Start or continue session
                if (!session) {
                    startSession(invitationCode, result.data.invitation_id);
                }

                // Store invitation verification in session
                sessionStorage.setItem('invitation_verified', 'true');
                sessionStorage.setItem('invitation_code', invitationCode);

                toast.success('Invitation verified! Continue to registration.');
                navigate('/register');
            } else {
                toast.error(result.error || 'Invalid invitation code or PIN');
            }
        } catch (error) {
            toast.error('Failed to verify invitation. Please try again.');
            console.error('Invitation verification error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Show system closed message
    if (!statusLoading && !isOpen) {
        return (
            <div className="min-h-screen bg-[#d9d9d9] flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center">
                    <div className="bg-white p-8 border-4 border-[#28282B]">
                        <div className="w-16 h-16 bg-red-100 flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-[#28282B] mb-4 uppercase" style={{ fontFamily: "'boxing', sans-serif" }}>Registration Closed</h1>
                        <p className="text-gray-600 mb-6">{status?.message || 'Registration is currently unavailable. Please try again later.'}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 border-2 border-[#28282B] text-[#28282B] hover:bg-[#28282B] hover:text-white transition"
                        >
                            RETURN HOME
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#d9d9d9] flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Timer */}
                {session && (
                    <div className="text-center mb-6">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 ${getTimerClass()}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
                        </div>
                        <p className="text-gray-600 text-sm mt-2">Time remaining to complete registration</p>
                    </div>
                )}

                {/* Card */}
                <div className="bg-white p-8 border-4 border-[#28282B]">
                    {/* Logo */}
                    <div className="text-center mb-6">
                        <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
                            <img
                                src={LogoIcon}
                                alt="SPACE - Back to Home"
                                className="h-16 object-contain mx-auto"
                            />
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-[#28282B] mb-2 uppercase" style={{ fontFamily: "'boxing', sans-serif", letterSpacing: '0.1em' }}>
                            Verify Your Invitation
                        </h1>
                        <p className="text-gray-600 text-sm">Enter the code and PIN from your invitation</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Invitation Code */}
                        <div>
                            <label className="block text-sm font-medium text-[#28282B] mb-2">
                                Invitation Code
                            </label>
                            <input
                                type="text"
                                value={invitationCode}
                                onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                                placeholder="e.g., INV-ABC123"
                                className="w-full px-4 py-3 bg-white border-2 border-[#28282B] text-[#28282B] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#28282B] transition uppercase rounded-none"
                                disabled={loading}
                                autoComplete="off"
                            />
                            <p className="text-xs text-gray-500 mt-1">Format: XXX-XXXXXX</p>
                        </div>

                        {/* PIN */}
                        <div>
                            <label className="block text-sm font-medium text-[#28282B] mb-2">
                                PIN Code
                            </label>
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                placeholder="4-digit PIN"
                                maxLength={4}
                                className="w-full px-4 py-3 bg-white border-2 border-[#28282B] text-[#28282B] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#28282B] transition text-center text-2xl tracking-widest rounded-none"
                                disabled={loading}
                                inputMode="numeric"
                                autoComplete="off"
                            />
                        </div>

                        {/* Terms */}
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                className="mt-1 w-5 h-5 border-2 border-[#28282B] text-[#28282B] focus:ring-[#28282B] cursor-pointer rounded-none"
                                disabled={loading}
                            />
                            <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                                I agree to the{' '}
                                <a href="#terms" className="text-[#28282B] font-semibold hover:underline">Terms of Service</a>
                                {' '}and{' '}
                                <a href="#privacy" className="text-[#28282B] font-semibold hover:underline">Privacy Policy</a>
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || !invitationCode || !pin || !termsAccepted || statusLoading}
                            className="w-full bg-[#28282B] text-white py-4 font-semibold hover:bg-[#28282B]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-none text-lg"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    VERIFYING...
                                </>
                            ) : (
                                'CONTINUE'
                            )}
                        </button>
                    </form>

                    {/* Back link */}
                    <div className="text-center mt-6">
                        <button
                            onClick={() => navigate('/interest')}
                            className="text-gray-500 hover:text-[#28282B] text-sm transition"
                        >
                            ← Back to Interest Form
                        </button>
                    </div>
                </div>

                {/* Status indicator */}
                {status && (
                    <div className="text-center mt-4">
                        <span className={`inline-flex items-center gap-2 text-xs ${isOpen ? 'text-green-700' : 'text-red-600'
                            }`}>
                            <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-600' : 'bg-red-500'} animate-pulse`} />
                            System {status.status}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
