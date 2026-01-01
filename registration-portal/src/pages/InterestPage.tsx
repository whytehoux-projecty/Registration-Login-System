import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import SpaceIcon from '../assets/page2-assets/spaceicon.svg';
import LogoIcon from '../assets/page2-assets/logoicon.png';
import { api } from '../services/api';

export const InterestPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        company: '',
        role: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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
                toast.success(result.data.message || 'Thank you for your interest! We will contact you soon.');
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

    return (
        <div className="flex min-h-screen w-full font-['Inter']">
            {/* Left Side - Space Icon */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#d9d9d9] relative items-center justify-center overflow-hidden">
                {/* Background effects (removed to match flat right side) */}

                {/* 3D Space Icon */}
                <div className="relative z-10 w-3/4 max-w-lg aspect-square flex items-center justify-center">
                    <img
                        src={SpaceIcon}
                        alt="Space Icon"
                        className="w-full h-full object-contain animate-float-lift drop-shadow-2xl"
                    />
                </div>
            </div>

            {/* Right Side - Light with Form */}
            <div className="w-full lg:w-1/2 bg-[#d9d9d9] flex flex-col items-center justify-center p-4 sm:p-8 relative">
                <div className="w-full max-w-md space-y-2">
                    {/* Header */}
                    <div className="flex flex-col items-center">
                        <Link to="/" className="cursor-pointer hover:opacity-80 transition-opacity">
                            <img
                                src={LogoIcon}
                                alt="SPACE - Back to Home"
                                className="mb-4 object-contain"
                                style={{ height: '100px' }}
                            />
                        </Link>
                        <h1 className="text-4xl font-black text-[#28282B] tracking-tight uppercase text-center" style={{ fontFamily: "'boxing', sans-serif", letterSpacing: '0.1em' }}>
                            Register Your Interest
                        </h1>
                        <p className="text-gray-600 text-sm text-center font-normal" style={{ fontFamily: "'boxing', sans-serif" }}>
                            Be the first to explore the future.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name
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
                                    Email Address
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
                                    SUBMIT INTEREST
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Invitation Link Section */}
                    <div className="mt-6 text-center space-y-4">
                        <p className="text-gray-600 text-sm">
                            Have you gotten your <span className="font-bold text-[#28282B]">Invitation Code</span>? click below to start your <span className="font-bold text-[#28282B]">Registration</span>
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/invitation')}
                            className="w-full bg-transparent border-2 border-[#28282B] text-[#28282B] text-lg font-semibold py-4 rounded-none hover:bg-[#28282B] hover:text-white transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                        >
                            COMPLETE REGISTRATION
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
