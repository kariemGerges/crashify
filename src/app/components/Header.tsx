'use client';
import React, { useEffect, useState } from 'react';
import Logo from './logo';
import TakeSpin from './TakeSpin';
import Link from 'next/link';

const navLinks = [
    { href: '/pages/services', label: 'Services' },
    { href: '/pages/blog', label: 'Blog' },
    { href: '/pages/about', label: 'About' },
    { href: '/pages/contact', label: 'Contact' },
    { href: '/pages/admin', label: 'Login' },
];

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

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        } else {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        };
    }, [mobileMenuOpen]);

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
                        <Logo size={120} />
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center space-x-1">
                        {navLinks.map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-lg
                                    ${
                                        isScrolled
                                            ? 'text-gray-900 hover:text-red-600 hover:bg-red-50'
                                            : 'text-white/90 hover:text-white hover:bg-white/10'
                                    }
                                    `}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden lg:flex items-center space-x-4 pb-4">
                        <TakeSpin px="px-4" py="py-2" />
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden relative w-12 h-12 flex flex-col justify-center items-center group focus:outline-none touch-manipulation active:scale-95 transition-transform"
                        aria-label="Toggle menu"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                        {/* Animated Hamburger Lines */}
                        <span
                            className={`absolute w-6 h-0.5 transition-all duration-300 ease-out ${
                                mobileMenuOpen
                                    ? 'rotate-45 translate-y-0'
                                    : '-translate-y-2'
                            } ${
                                isScrolled
                                    ? 'bg-gray-950'
                                    : 'bg-white group-hover:bg-red-400'
                            }`}
                        />
                        <span
                            className={`absolute w-6 h-0.5 transition-all duration-300 ease-out ${
                                mobileMenuOpen
                                    ? 'opacity-0 scale-0'
                                    : 'opacity-100 scale-100'
                            } ${
                                isScrolled
                                    ? 'bg-gray-950'
                                    : 'bg-white group-hover:bg-red-400'
                            }`}
                        />
                        <span
                            className={`absolute w-6 h-0.5 transition-all duration-300 ease-out ${
                                mobileMenuOpen
                                    ? '-rotate-45 translate-y-0'
                                    : 'translate-y-2'
                            } ${
                                isScrolled
                                    ? 'bg-gray-950'
                                    : 'bg-white group-hover:bg-red-400'
                            }`}
                        />

                        {/* Animated Background Circle */}
                        <span
                            className={`absolute inset-0 rounded-full transition-all duration-300 ease-out ${
                                mobileMenuOpen
                                    ? 'scale-100 opacity-20'
                                    : 'scale-0 opacity-0'
                            } ${isScrolled ? 'bg-gray-950' : 'bg-white'}`}
                        />
                    </button>
                </div>

                {/* Mobile Menu - Full Screen Overlay */}
                <div
                    className={`lg:hidden fixed inset-0 z-50 transition-all duration-500 ease-out ${
                        mobileMenuOpen
                            ? 'opacity-100 visible'
                            : 'opacity-0 invisible pointer-events-none'
                    }`}
                >
                    {/* Backdrop with gradient */}
                    <div
                        onClick={() => setMobileMenuOpen(false)}
                        className={`absolute inset-0 transition-all duration-500 ${
                            mobileMenuOpen
                                ? 'backdrop-blur-xl bg-black/60'
                                : 'backdrop-blur-0 bg-black/0'
                        }`}
                    />

                    {/* Close Button */}
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className={`absolute top-6 right-6 z-50 w-14 h-14 flex items-center justify-center rounded-full backdrop-blur-md border-2 transition-all duration-500 ease-out group touch-manipulation active:scale-90 ${
                            mobileMenuOpen
                                ? 'opacity-100 scale-100 rotate-0'
                                : 'opacity-0 scale-0 rotate-90'
                        } ${
                            isScrolled
                                ? 'bg-white/90 border-gray-200 hover:border-red-500 hover:bg-red-50 active:bg-red-100'
                                : 'bg-white/10 border-white/20 hover:border-red-400 hover:bg-red-500/20 active:bg-red-500/30'
                        }`}
                        aria-label="Close menu"
                        style={{
                            transitionDelay: mobileMenuOpen ? '600ms' : '0ms',
                            WebkitTapHighlightColor: 'transparent',
                        }}
                    >
                        <div className="relative w-6 h-6">
                            <span
                                className={`absolute top-1/2 left-1/2 w-5 h-0.5 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                                    isScrolled
                                        ? 'bg-gray-900 group-hover:bg-red-600'
                                        : 'bg-white group-hover:bg-red-400'
                                } ${mobileMenuOpen ? 'rotate-45' : 'rotate-0'}`}
                            />
                            <span
                                className={`absolute top-1/2 left-1/2 w-5 h-0.5 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                                    isScrolled
                                        ? 'bg-gray-900 group-hover:bg-red-600'
                                        : 'bg-white group-hover:bg-red-400'
                                } ${
                                    mobileMenuOpen ? '-rotate-45' : 'rotate-0'
                                }`}
                            />
                        </div>
                    </button>

                    {/* Menu Content */}
                    <div
                        onClick={e => e.stopPropagation()}
                        className={`relative h-full flex flex-col justify-center items-center px-6 transition-all duration-700 ease-out ${
                            mobileMenuOpen
                                ? 'translate-y-0 opacity-100'
                                : 'translate-y-8 opacity-0'
                        }`}
                    >
                        {/* Animated Background Pattern */}
                        <div className="absolute inset-0 overflow-hidden">
                            <div
                                className={`absolute -top-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-br from-red-600/20 to-red-800/10 blur-3xl transition-all duration-1000 ${
                                    mobileMenuOpen ? 'scale-100' : 'scale-0'
                                }`}
                            />
                            <div
                                className={`absolute -bottom-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-tr from-red-500/15 to-red-700/5 blur-3xl transition-all duration-1000 delay-200 ${
                                    mobileMenuOpen ? 'scale-100' : 'scale-0'
                                }`}
                            />
                        </div>

                        {/* Menu Items Container */}
                        <nav className="relative z-10 w-full max-w-sm space-y-4">
                            {navLinks.map((link, index) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`group block relative overflow-hidden rounded-2xl transition-all duration-500 ease-out touch-manipulation active:scale-[0.98] ${
                                        mobileMenuOpen
                                            ? 'translate-x-0 opacity-100'
                                            : 'translate-x-full opacity-0'
                                    }`}
                                    style={{
                                        transitionDelay: mobileMenuOpen
                                            ? `${(index + 1) * 100}ms`
                                            : '0ms',
                                        WebkitTapHighlightColor: 'transparent',
                                        minHeight: '56px',
                                    }}
                                >
                                    <div
                                        className={`relative px-6 py-4 backdrop-blur-md border-2 transition-all duration-300 ${
                                            isScrolled
                                                ? 'bg-white/90 border-gray-200 text-gray-900 group-hover:border-red-500 group-hover:bg-red-50 group-active:bg-red-100'
                                                : 'bg-white/10 border-white/20 text-white group-hover:border-red-400 group-hover:bg-red-500/20 group-active:bg-red-500/30'
                                        }`}
                                    >
                                        <span className="relative z-10 text-xl font-bold tracking-wide flex items-center justify-between">
                                            {link.label}
                                            <span className="text-2xl transition-transform duration-300 group-hover:translate-x-2">
                                                →
                                            </span>
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-500/0 to-red-600/0 group-hover:from-red-600/10 group-hover:via-red-500/5 group-hover:to-red-600/10 transition-all duration-300" />
                                    </div>
                                </Link>
                            ))}

                            {/* CTA Button */}
                            <div
                                className={`pt-6 transition-all duration-500 ease-out ${
                                    mobileMenuOpen
                                        ? 'translate-y-0 opacity-100'
                                        : 'translate-y-8 opacity-0'
                                }`}
                                style={{
                                    transitionDelay: mobileMenuOpen
                                        ? '500ms'
                                        : '0ms',
                                }}
                            >
                                <div className="flex justify-center">
                                    <TakeSpin px="px-8" py="py-3" />
                                </div>
                            </div>
                        </nav>
                    </div>
                </div>
            </nav>
        </header>
    );
}
