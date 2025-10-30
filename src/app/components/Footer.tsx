import { Phone, Mail, MapPin, X, Linkedin, Youtube } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/app/components/logo';

export default function Footer() {
    return (
        <footer className="bg-[#1a1a1a] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

                    {/* Company external links */}
                    <div>
                        <div className="flex items-center space-x-2 mb-4">
                            <Logo />
                        </div>
                        <p className="text-gray-400 text-sm mb-4">
                            Modern car insurance powered by AI technology. Fast,
                            affordable, and reliable coverage.
                        </p>
                        <div className="flex space-x-4">
                            <a
                                href="https://www.linkedin.com/company/crashify/posts/?feedView=all"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-red-700 shadow-amber-600 transition-colors "
                            >
                                <Linkedin size={20} />
                            </a>
                            <a
                                href="https://x.com/crashifyau?s=21"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-red-700 font-black shadow-amber-600 transition-colors "
                            >
                                <X className="font-black" size={20} />
                            </a>
                            <a
                                href="https://www.youtube.com/watch?v=09z270QoPGg"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-red-700 shadow-amber-600 transition-colors "
                            >
                                <Youtube size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="font-bold text-lg mb-4">Newsletter</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Join our newsletter and stay up to date
                        </p>
                        <div className="flex flex-col space-y-2">
                            <input
                                type="email"
                                placeholder="Your email"
                                className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg border border-gray-700 focus:outline-none focus:border-[#e60000] text-sm"
                            />
                            <button className="px-4 py-2 bg-[#e60000] hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors">
                                Get in Touch
                            </button>
                        </div>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="font-bold text-lg mb-4">Company</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link
                                    href="/pages/about"
                                    className="text-gray-400 hover:text-red-800 transition-colors"
                                >
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/pages/contact"
                                    className="text-gray-400 hover:text-red-800 transition-colors"
                                >
                                    Careers
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/pages/blog"
                                    className="text-gray-400 hover:text-red-800 transition-colors"
                                >
                                    Blog
                                </Link>
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
                                    +6 (130) 065-5106
                                </span>
                            </li>
                            <li className="flex items-start space-x-2">
                                <span className="font-semibold text-[#e60000]">
                                    ABN
                                </span>
                                <span className="text-gray-400">
                                    82676363116
                                </span>
                            </li>
                            <li className="flex items-start space-x-2">
                                <Mail
                                    size={16}
                                    className="text-[#e60000] mt-1 flex-shrink-0"
                                />
                                <span className="text-gray-400">
                                    info@crashify.com.au
                                </span>
                            </li>
                            <li className="flex items-start space-x-2">
                                <MapPin
                                    size={16}
                                    className="text-[#e60000] mt-1 flex-shrink-0"
                                />
                                <span className="text-gray-400">
                                    81-83 Cambell St
                                    <br />
                                    Surry Hills, NSW 2010, Australia
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <p className="text-gray-400 text-sm">
                        © 2025 Crashify. All rights reserved.
                    </p>
                    <div className="flex space-x-6 text-sm">
                        <Link
                            href="#"
                            className="text-red-600 transition-colors"
                        >
                            Privacy Policy
                        </Link>
                        <Link
                            href="pages/terms"
                            className="text-red-600 transition-colors"
                        >
                            Terms of Service
                        </Link>
                        <Link
                            href="/pages/cookies"
                            className="text-red-600 transition-colors"
                        >
                            Cookie Policy
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
