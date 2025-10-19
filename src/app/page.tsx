

// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
//       <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
//         <h1 className="text-4xl font-bold text-center sm:text-left">
//           Welcome to <span className="text-blue-600">Crashify!</span>
//         </h1>
//       </main>
//       <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/file.svg"
//             alt="File icon"
//             width={16}
//             height={16}
//           />
//           Learn
//         </a>
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/window.svg"
//             alt="Window icon"
//             width={16}
//             height={16}
//           />
//           Examples
//         </a>
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/globe.svg"
//             alt="Globe icon"
//             width={16}
//             height={16}
//           />
//           Go to nextjs.org →
//         </a>
//       </footer>
//     </div>
//   );
// }
'use client';
import React, { useState } from 'react';
import {
    Menu,
    X,
    Phone,
    Mail,
    MapPin,
    Facebook,
    Twitter,
    Linkedin,
    Instagram,
} from 'lucide-react';

export default function CrashifyLayout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 lg:h-20">
                        {/* Logo */}
                        <div className="flex items-center">
                            <a href="/" className="flex items-center space-x-2">
                                <div className="w-10 h-10 bg-[#e60000] rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">
                                        C
                                    </span>
                                </div>
                                <span className="text-2xl font-bold text-[#1a1a1a]">
                                    Crashify
                                </span>
                            </a>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center space-x-8">
                            <a
                                href="#coverage"
                                className="text-[#555555] hover:text-[#e60000] font-medium transition-colors"
                            >
                                Coverage
                            </a>
                            <a
                                href="#claims"
                                className="text-[#555555] hover:text-[#e60000] font-medium transition-colors"
                            >
                                Claims
                            </a>
                            <a
                                href="#about"
                                className="text-[#555555] hover:text-[#e60000] font-medium transition-colors"
                            >
                                About
                            </a>
                            <a
                                href="#contact"
                                className="text-[#555555] hover:text-[#e60000] font-medium transition-colors"
                            >
                                Contact
                            </a>
                        </div>

                        {/* CTA Buttons */}
                        <div className="hidden lg:flex items-center space-x-4">
                            <button className="px-4 py-2 text-[#555555] hover:text-[#e60000] font-medium transition-colors">
                                Sign In
                            </button>
                            <button className="px-6 py-2.5 bg-[#e60000] text-white font-semibold rounded-lg hover:bg-[#cc0000] transition-colors">
                                Get Quote
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 text-[#555555] hover:text-[#e60000]"
                        >
                            {mobileMenuOpen ? (
                                <X size={24} />
                            ) : (
                                <Menu size={24} />
                            )}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="lg:hidden border-t border-gray-200 py-4 space-y-4">
                            <a
                                href="#coverage"
                                className="block px-4 py-2 text-[#555555] hover:text-[#e60000] font-medium"
                            >
                                Coverage
                            </a>
                            <a
                                href="#claims"
                                className="block px-4 py-2 text-[#555555] hover:text-[#e60000] font-medium"
                            >
                                Claims
                            </a>
                            <a
                                href="#about"
                                className="block px-4 py-2 text-[#555555] hover:text-[#e60000] font-medium"
                            >
                                About
                            </a>
                            <a
                                href="#contact"
                                className="block px-4 py-2 text-[#555555] hover:text-[#e60000] font-medium"
                            >
                                Contact
                            </a>
                            <div className="px-4 pt-4 space-y-3 border-t border-gray-200">
                                <button className="w-full px-4 py-2 text-[#555555] hover:text-[#e60000] font-medium border border-gray-300 rounded-lg">
                                    Sign In
                                </button>
                                <button className="w-full px-6 py-2.5 bg-[#e60000] text-white font-semibold rounded-lg hover:bg-[#cc0000]">
                                    Get Quote
                                </button>
                            </div>
                        </div>
                    )}
                </nav>
            </header>

            {/* Main Content Area (Demo) */}
            <main className="flex-grow bg-[#f8f9fa]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <h1 className="text-4xl lg:text-5xl font-bold text-[#1a1a1a] mb-4">
                        Welcome to Crashify
                    </h1>
                    <p className="text-lg text-[#555555] mb-8">
                        Smart Car Insurance Powered by AI
                    </p>
                    <button className="px-8 py-3 bg-[#e60000] text-white font-semibold rounded-lg hover:bg-[#cc0000] transition-colors">
                        Get Started
                    </button>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-[#1a1a1a] text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                        {/* Company Info */}
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-10 h-10 bg-[#e60000] rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">
                                        C
                                    </span>
                                </div>
                                <span className="text-2xl font-bold">
                                    Crashify
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm mb-4">
                                Modern car insurance powered by AI technology.
                                Fast, affordable, and reliable coverage.
                            </p>
                            <div className="flex space-x-4">
                                <a
                                    href="#"
                                    className="text-gray-400 hover:text-[#e60000] transition-colors"
                                >
                                    <Facebook size={20} />
                                </a>
                                <a
                                    href="#"
                                    className="text-gray-400 hover:text-[#e60000] transition-colors"
                                >
                                    <Twitter size={20} />
                                </a>
                                <a
                                    href="#"
                                    className="text-gray-400 hover:text-[#e60000] transition-colors"
                                >
                                    <Linkedin size={20} />
                                </a>
                                <a
                                    href="#"
                                    className="text-gray-400 hover:text-[#e60000] transition-colors"
                                >
                                    <Instagram size={20} />
                                </a>
                            </div>
                        </div>

                        {/* Products */}
                        <div>
                            <h3 className="font-bold text-lg mb-4">Products</h3>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <a
                                        href="#"
                                        className="text-gray-400 hover:text-[#e60000] transition-colors"
                                    >
                                        Auto Insurance
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="text-gray-400 hover:text-[#e60000] transition-colors"
                                    >
                                        Collision Coverage
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="text-gray-400 hover:text-[#e60000] transition-colors"
                                    >
                                        Comprehensive
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="text-gray-400 hover:text-[#e60000] transition-colors"
                                    >
                                        Liability Coverage
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Company */}
                        <div>
                            <h3 className="font-bold text-lg mb-4">Company</h3>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <a
                                        href="#"
                                        className="text-gray-400 hover:text-[#e60000] transition-colors"
                                    >
                                        About Us
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="text-gray-400 hover:text-[#e60000] transition-colors"
                                    >
                                        Careers
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="text-gray-400 hover:text-[#e60000] transition-colors"
                                    >
                                        Press
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="text-gray-400 hover:text-[#e60000] transition-colors"
                                    >
                                        Blog
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h3 className="font-bold text-lg mb-4">Contact</h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start space-x-2">
                                    <Phone
                                        size={16}
                                        className="text-[#e60000] mt-1 flex-shrink-0"
                                    />
                                    <span className="text-gray-400">
                                        1-800-CRASHIFY
                                    </span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <Mail
                                        size={16}
                                        className="text-[#e60000] mt-1 flex-shrink-0"
                                    />
                                    <span className="text-gray-400">
                                        support@crashify.com
                                    </span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <MapPin
                                        size={16}
                                        className="text-[#e60000] mt-1 flex-shrink-0"
                                    />
                                    <span className="text-gray-400">
                                        123 Insurance Ave
                                        <br />
                                        New York, NY 10001
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <p className="text-gray-400 text-sm">
                            © 2024 Crashify. All rights reserved.
                        </p>
                        <div className="flex space-x-6 text-sm">
                            <a
                                href="#"
                                className="text-gray-400 hover:text-[#e60000] transition-colors"
                            >
                                Privacy Policy
                            </a>
                            <a
                                href="#"
                                className="text-gray-400 hover:text-[#e60000] transition-colors"
                            >
                                Terms of Service
                            </a>
                            <a
                                href="#"
                                className="text-gray-400 hover:text-[#e60000] transition-colors"
                            >
                                Cookie Policy
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}