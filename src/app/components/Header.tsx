'use client';
import React, { useEffect, useState } from 'react';
import { Layers, SquareStack } from 'lucide-react';
import Logo from './logo';
import TakeSpin from './TakeSpin';
import Link from 'next/link';


export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`sticky top-0 z-50 transition-all duration-300 ${
                isScrolled
                    ? 'bg-white/80 backdrop-blur-3xl shadow-sm rounded-2xl'
                    : 'bg-transparent'
            }`}
        >
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 lg:h-20">
                    {/* Logo */}
                    <div className="flex items-center border-amber-950">
                        <Logo size={120}/>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center space-x-1">
                        <Link
                            href="/pages/services"
                            className={`px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-lg
                                ${isScrolled 
                                    ? 'text-gray-900 hover:text-red-600 hover:bg-red-50' 
                                    : 'text-white/90 hover:text-white hover:bg-white/10'
                                }
                                `}
                        >
                            Services
                        </Link>
                        <Link
                            href="/pages/blog"
                            className={`px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-lg
                                ${isScrolled 
                                    ? 'text-gray-900 hover:text-red-600 hover:bg-red-50' 
                                    : 'text-white/90 hover:text-white hover:bg-white/10'
                                }
                                `}
                        >
                            Blog
                        </Link>
                        <Link
                            href="/pages/about"
                            className={`px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-lg
                                ${isScrolled 
                                    ? 'text-gray-900 hover:text-red-600 hover:bg-red-50' 
                                    : 'text-white/90 hover:text-white hover:bg-white/10'
                                }
                                `}
                        >
                            About
                        </Link>
                        <Link
                            href="/pages/contact"
                            className={`px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-lg
                                ${isScrolled 
                                    ? 'text-gray-900 hover:text-red-600 hover:bg-red-50' 
                                    : 'text-white/90 hover:text-white hover:bg-white/10'
                                }
                                `}
                        >
                            Contact
                        </Link>
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden lg:flex items-center space-x-4 pb-4">
                        {/* <button className="px-4 py-2 font-medium transition-colors">
                            Sign In
                        </button>
                        <button className="px-6 py-2.5 bg-[#e60000] text-white font-semibold rounded-lg hover:bg-[#cc0000] transition-colors">
                            Get Quote
                        </button> */}
                        <TakeSpin px="px-4" py="py-2" />
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen )}
                        className="lg:hidden p-2 hover:bg-red-700"
                    >
                        {mobileMenuOpen ? (
                            <SquareStack
                                size={24}
                                className={`${
                                    isScrolled ? 'text-gray-950' : ''
                                }`}
                            />
                        ) : (
                            <Layers
                                size={24}
                                className={`${
                                    isScrolled ? 'text-gray-950' : ''
                                }`}
                            />
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div
                        onClick={() => setMobileMenuOpen(false)}
                        className={`lg:hidden border-t py-4 space-y-1 ${
                            isScrolled 
                                ? ' transition-all duration-300' 
                                : ' transition-all duration-300'
                        }`}
                    >
                        <Link
                            href="/pages/services"
                            className={`block px-6 py-3 text-base font-semibold transition-colors rounded-lg mx-2
                                ${isScrolled 
                                    ? 'text-gray-900 hover:text-red-600 hover:bg-red-50' 
                                    : 'text-white hover:text-red-400 hover:bg-white/10'
                                }
                                `}
                        >
                            Services
                        </Link>
                        <Link
                            href="/pages/blog"
                            className={`block px-6 py-3 text-base font-semibold transition-colors rounded-lg mx-2
                                ${isScrolled 
                                    ? 'text-gray-900 hover:text-red-600 hover:bg-red-50' 
                                    : 'text-white hover:text-red-400 hover:bg-white/10'
                                }
                                `}
                        >
                            Blog
                        </Link>
                        <Link
                            href="/pages/about"
                            className={`block px-6 py-3 text-base font-semibold transition-colors rounded-lg mx-2
                                ${isScrolled 
                                    ? 'text-gray-900 hover:text-red-600 hover:bg-red-50' 
                                    : 'text-white hover:text-red-400 hover:bg-white/10'
                                }
                                `}
                        >
                            About
                        </Link>
                        <Link
                            href="/pages/contact"
                            className={`block px-6 py-3 text-base font-semibold transition-colors rounded-lg mx-2
                                ${isScrolled 
                                    ? 'text-gray-900 hover:text-red-600 hover:bg-red-50' 
                                    : 'text-white hover:text-red-400 hover:bg-white/10'
                                }
                                `}
                        >
                            Contact
                        </Link>
                        <div className={`px-4 pt-4 space-y-3 border-t mt-4 ${
                            isScrolled ? 'border-gray-200' : 'border-white/20'
                        }`}>
                            <div className="pb-2 text-center">
                                <TakeSpin px="px-28" py="py-2.5" />
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}
