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
                    <div className="hidden lg:flex items-center space-x-8">
                        <Link
                            href="/pages/services"
                            className={`font-medium transition-colors
                                ${isScrolled ? 'text-gray-950' : ''}
                                `}
                        >
                            Services
                        </Link>
                        <Link
                            href="/pages/blog"
                            className={`font-medium transition-colors
                ${isScrolled ? 'text-gray-950' : ''}
                                `}
                        >
                            Blog
                        </Link>
                        <Link
                            href="/pages/about"
                            className={`font-medium transition-colors
                ${isScrolled ? 'text-gray-950' : ''}
                                `}
                        >
                            About
                        </Link>
                        <Link
                            href="/pages/contact"
                            className={`font-medium transition-colors
                ${isScrolled ? 'text-gray-950' : ''}
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
                        className="lg:hidden border-t border-red-200 py-4 space-y-4">
                        <Link
                            href="/pages/services"
                            className={`block px-4 py-2 font-medium
                                ${isScrolled ? 'text-gray-950' : ''}
                                `}
                        >
                            Services
                        </Link>
                        <Link
                            href="/pages/blog"
                            className={`block px-4 py-2 font-medium
                            ${isScrolled ? 'text-gray-950' : ''}
                            `}
                        >
                            Blog
                        </Link>
                        <Link
                            href="/pages/about"
                            className={`block px-4 py-2 font-medium
                                ${isScrolled ? 'text-gray-950' : ''}
                                `}
                        >
                            About
                        </Link>
                        <Link
                            href="/pages/contact"
                            className={`block px-4 py-2 font-medium
                                ${isScrolled ? 'text-gray-950' : ''}
                                `}
                        >
                            Contact
                        </Link>
                        <div className="px-4 pt-4 space-y-3 border-t border-red-200">
                            {/* <button className="w-full px-4 py-2 font-medium border border-gray-300 rounded-lg">
                                Sign In
                            </button> */}
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
