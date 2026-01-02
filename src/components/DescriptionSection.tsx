import React from 'react';

export const DescriptionSection: React.FC = () => {
    return (
        <section className="bg-gradient-to-b from-black to-zinc-900 text-white py-24 px-6 md:px-12 lg:px-24 overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-20 animate-slide-up">
                    <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 mb-6">
                        Redefining Membership
                    </h2>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                        Experience a unified ecosystem designed for seamless access, enhanced security, and global connectivity.
                        Your gateway to the Whytehoux network starts here.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                    {/* Feature 1 */}
                    <div className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/20">
                        <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500/30 transition-colors">
                            <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-semibold mb-3 text-white">Secure Identity</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Enterprise-grade encryption and biometric-ready authentication ensure your digital identity remains protected at all times.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20">
                        <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500/30 transition-colors">
                            <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-semibold mb-3 text-white">Instant Access</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Seamlessly navigate through the entire ecosystem with a single credential. No more multiple logins or forgotten passwords.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20">
                        <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500/30 transition-colors">
                            <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-semibold mb-3 text-white">Global Community</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Connect with a curated network of professionals and peers. Your membership opens doors to exclusive events and opportunities.
                        </p>
                    </div>
                </div>

                {/* Visual/Image Section */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-900/50">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                    
                    {/* Placeholder for High-Quality Image - Using a CSS pattern for now */}
                    <div className="w-full h-[400px] md:h-[500px] bg-grid-pattern relative flex items-center justify-center overflow-hidden">
                        {/* Abstract Digital Earth/Network Visualization using CSS */}
                         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay hover:scale-105 transition-transform duration-1000" />
                         
                         <div className="relative z-20 text-center px-4">
                             <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
                                 The Future of Connection
                             </h3>
                             <p className="text-lg text-gray-200 max-w-2xl mx-auto drop-shadow-md">
                                 Built on advanced architecture to support the next generation of digital interaction.
                             </p>
                         </div>
                    </div>
                </div>

                {/* Stats/Trust Indicators */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 border-t border-white/10 pt-16">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-2">10k+</div>
                        <div className="text-sm text-gray-500 uppercase tracking-wider">Members</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-2">99.9%</div>
                        <div className="text-sm text-gray-500 uppercase tracking-wider">Uptime</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-2">256-bit</div>
                        <div className="text-sm text-gray-500 uppercase tracking-wider">Encryption</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-2">24/7</div>
                        <div className="text-sm text-gray-500 uppercase tracking-wider">Support</div>
                    </div>
                </div>
            </div>
        </section>
    );
};
