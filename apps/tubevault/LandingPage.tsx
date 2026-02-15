import React from 'react';
import { ArrowRight, Shield, Zap, Layers, Monitor } from 'lucide-react';

interface LandingPageProps {
    onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
    return (
        <div className="min-h-screen flex flex-col text-white relative overflow-hidden">
            {/* Background Ambience handled by global CSS on body, but we can add specific landing touches */}

            {/* Navbar */}
            <nav className="p-6 flex justify-between items-center z-20">
                <div className="text-2xl font-display font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                    TUBEVAULT
                </div>
                <button
                    onClick={onEnter}
                    className="btn-secondary px-6 rounded-full border-white/20 hover:bg-white/10"
                >
                    Login
                </button>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 py-12 md:py-20">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-200 text-xs font-bold uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                    Anti-Algorithm Archive
                </div>

                {/* Headline */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black tracking-widest mb-6 max-w-6xl mx-auto leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 drop-shadow-2xl animate-in fade-in zoom-in duration-700 delay-100 uppercase">
                    RECLAIM YOUR FEED
                </h1>

                {/* Subhead */}
                <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                    Stop scrolling through the noise. TubeVault is your private sanctuary for the videos that matter. No ads, no suggestions, just your curated collection.
                </p>

                {/* CTA */}
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                    <button
                        onClick={onEnter}
                        className="group relative px-8 py-4 bg-white text-black text-lg font-bold rounded-full shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] hover:scale-105 transition-all duration-300 flex items-center gap-3 overflow-hidden"
                    >
                        <span className="relative z-10">Enter The Vault</span>
                        <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />

                        {/* Gloss Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shine" />
                    </button>
                </div>

            </main>

            {/* Grid Features */}
            <div className="w-full max-w-7xl mx-auto px-4 pb-12 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">

                {/* Feature 1: The Problem */}
                <div className="glass p-6 rounded-2xl md:col-span-1 border-white/5 bg-gradient-to-br from-red-500/5 to-transparent hover:from-red-500/10 transition-colors group">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-red-500/20 shrink-0">
                            <Shield className="w-5 h-5 text-red-400" />
                        </div>
                        <h3 className="text-lg font-bold text-red-100 leading-tight">The Problem</h3>
                    </div>
                    <p className="text-white/50 text-sm leading-relaxed pl-[3.5rem]">
                        Algorithms are designed to hijack your attention. They bury high-value content under sensational clicks.
                    </p>
                </div>

                {/* Feature 2: The Solution */}
                <div className="glass p-6 rounded-2xl md:col-span-1 border-white/5 bg-gradient-to-br from-cyan-500/5 to-transparent hover:from-cyan-500/10 transition-colors group">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-cyan-500/20 shrink-0">
                            <Zap className="w-5 h-5 text-cyan-400" />
                        </div>
                        <h3 className="text-lg font-bold text-cyan-100 leading-tight">The Solution</h3>
                    </div>
                    <p className="text-white/50 text-sm leading-relaxed pl-[3.5rem]">
                        A distraction-free environment. Add the videos you want to keep. Categorize them your way.
                    </p>
                </div>

                {/* Feature 3: Features */}
                <div className="glass p-6 rounded-2xl md:col-span-1 border-white/5 bg-gradient-to-br from-purple-500/5 to-transparent hover:from-purple-500/10 transition-colors group">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-purple-500/20 shrink-0">
                            <Layers className="w-5 h-5 text-purple-400" />
                        </div>
                        <h3 className="text-lg font-bold text-purple-100 leading-tight">The Tech</h3>
                    </div>
                    <p className="text-white/50 text-sm leading-relaxed pl-[3.5rem]">
                        Built with modern web standards. Fast, responsive, and beautiful. Grid views and direct playback.
                    </p>
                </div>

            </div>

            {/* Footer */}
            <footer className="p-6 text-center text-white/20 text-xs font-medium uppercase tracking-widest relative z-10">
                TubeVault © 2026 • RMXLABS • Curated by You
            </footer>

        </div>
    );
}
