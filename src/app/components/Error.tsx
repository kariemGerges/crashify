'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
    message: string;
}

export default function ErrorComponent({
    message,
}: ErrorProps): React.ReactElement {
    const [glitchActive, setGlitchActive] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setGlitchActive(true);
            setTimeout(() => setGlitchActive(false), 200);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 overflow-hidden relative">
            {/* Animated grid background */}
            <div className="absolute inset-0 opacity-10">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage:
                            'linear-gradient(#ff0000 1px, transparent 1px), linear-gradient(90deg, #ff0000 1px, transparent 1px)',
                        backgroundSize: '50px 50px',
                    }}
                ></div>
            </div>

            {/* Scanline effect */}
            <div className="absolute inset-0 pointer-events-none opacity-10">
                <div className="w-full h-full bg-gradient-to-b from-transparent via-red-600 to-transparent animate-scan"></div>
            </div>

            <div className="relative z-10 max-w-4xl w-full">
                {/* Error Code */}
                <div className="text-center mb-8">
                    <div
                        className={`inline-block transition-all duration-200 ${
                            glitchActive ? 'glitch' : ''
                        }`}
                    >
                        <h1 className="text-8xl sm:text-9xl lg:text-[12rem] font-black leading-none mb-4">
                            <span className="text-red-600">4</span>
                            <span className="text-white">0</span>
                            <span className="text-red-600">4</span>
                        </h1>
                    </div>
                    <div className="h-1 bg-red-600 w-32 mx-auto mb-8"></div>
                </div>

                {/* Main Message */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black mb-6 leading-tight">
                        OFF THE
                        <span className="block text-red-600 mt-2">TRACK</span>
                    </h2>
                    <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Looks like you took a wrong turn. The page you&apos;re
                        looking for doesn&apos;t exist or has been moved.
                    </p>
                </div>

                {/* Error Details */}
                <div className="bg-zinc-900 border-2 border-zinc-800 p-6 sm:p-8 mb-12 font-mono text-sm">
                    <div className="flex items-start gap-4 mb-4">
                        <span className="text-red-600 font-black text-xl">
                            ⚠
                        </span>
                        <div className="flex-1">
                            <p className="text-gray-400 mb-2">
                                <span className="text-red-600 font-bold">
                                    ERROR:
                                </span>{' '}
                                {message}
                            </p>
                            <p className="text-gray-500 text-xs mb-2">
                                Status: 404 | Timestamp:{' '}
                                {new Date().toLocaleTimeString()}
                            </p>
                            <p className="text-gray-600 text-xs">
                                The requested URL was not found on this server.
                            </p>
                        </div>
                    </div>
                    <div className="border-t border-zinc-800 pt-4 mt-4">
                        <p className="text-gray-600 text-xs">
                            → Check the URL for typos
                            <br />
                            → Use navigation to find what you need
                            <br />→ Contact support if you think this is a
                            mistake
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        href="/"
                        className="bg-red-600 text-black px-8 py-4 font-black text-sm uppercase hover:bg-white transition-all w-full sm:w-auto group"
                    >
                        <span className="flex items-center justify-center gap-2">
                            GO HOME
                            <span className="group-hover:translate-x-1 transition-transform">
                                →
                            </span>
                        </span>
                    </Link>
                    <Link
                        href="/pages/blog"
                        className="bg-transparent border-2 border-zinc-700 text-white px-8 py-4 font-black text-sm uppercase hover:border-red-600 transition-all w-full sm:w-auto"
                    >
                        GO BACK
                    </Link>
                </div>

                {/* Quick Links */}
                {/* <div className="mt-16 pt-8 border-t-2 border-zinc-800">
                    <p className="text-center text-sm font-bold text-gray-500 mb-6 uppercase">
                        Try These Instead
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { name: 'Articles', icon: '📰' },
                            { name: 'Home', icon: '🏠' },
                            { name: 'About', icon: '💡' },
                        ].map((link) => (
                            <button
                                key={link.name}
                                className="bg-zinc-900 border-2 border-zinc-800 p-4 hover:border-red-600 transition-all group"
                            >
                                <div className="text-3xl mb-2">{link.icon}</div>
                                <div className="font-bold text-sm group-hover:text-red-600 transition-colors">
                                    {link.name}
                                </div>
                            </button>
                        ))}
                    </div>
                </div> */}

                {/* Fun message */}
                <div className="mt-12 text-center">
                    <p className="text-xs text-gray-600 font-mono">
                        Error ID: VEL-
                        {Math.random().toString(36).substr(2, 9).toUpperCase()}
                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes scan {
                    0% {
                        transform: translateY(-100%);
                    }
                    100% {
                        transform: translateY(100%);
                    }
                }

                .animate-scan {
                    animation: scan 4s linear infinite;
                }

                .glitch {
                    animation: glitch-animation 0.2s ease-in-out;
                }

                @keyframes glitch-animation {
                    0% {
                        transform: translate(0);
                    }
                    20% {
                        transform: translate(-2px, 2px);
                    }
                    40% {
                        transform: translate(-2px, -2px);
                    }
                    60% {
                        transform: translate(2px, 2px);
                    }
                    80% {
                        transform: translate(2px, -2px);
                    }
                    100% {
                        transform: translate(0);
                    }
                }

                @keyframes glitch-skew {
                    0% {
                        transform: skew(0deg);
                    }
                    50% {
                        transform: skew(-2deg);
                    }
                    100% {
                        transform: skew(0deg);
                    }
                }
            `}</style>
        </div>
    );
}
