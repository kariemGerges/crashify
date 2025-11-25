import { Phone, Mail, MapPin, X, Linkedin, Youtube } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/app/components/logo';

export default function Footer() {
    return (
        <footer className="bg-gradient-to-b from-[#1a1a1a] to-black text-white border-t border-gray-800/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-10 sm:mb-12">
                    {/* Company external links */}
                    <div className="space-y-4 sm:space-y-6">
                        <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                            <Logo />
                        </div>
                        <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8">
                            Professional vehicle assessments made easy.
                        </p>
                        <div className="flex space-x-4">
                            <a
                                href="https://www.linkedin.com/company/crashify/posts/?feedView=all"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-gray-800/50 hover:bg-red-600/20 border border-gray-700/50 hover:border-red-500/50 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all duration-300"
                            >
                                <Linkedin size={18} />
                            </a>
                            <a
                                href="https://x.com/crashifyau?s=21"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-gray-800/50 hover:bg-red-600/20 border border-gray-700/50 hover:border-red-500/50 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all duration-300"
                            >
                                <X size={18} />
                            </a>
                            <a
                                href="https://www.youtube.com/watch?v=09z270QoPGg"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-gray-800/50 hover:bg-red-600/20 border border-gray-700/50 hover:border-red-500/50 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all duration-300"
                            >
                                <Youtube size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Newsletter */}
                    <div className="space-y-4 sm:space-y-6">
                        <h3 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6 text-white">Newsletter</h3>
                        <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
                            Join our newsletter and stay up to date
                        </p>
                        <div className="flex flex-col space-y-3">
                            <input
                                type="email"
                                placeholder="Your email"
                                className="px-4 py-3 bg-gray-800/50 text-white rounded-lg border border-gray-700/50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-sm sm:text-base transition-all duration-300"
                            />
                            <button className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 shadow-lg hover:shadow-red-500/20">
                                Get in Touch
                            </button>
                        </div>
                    </div>

                    {/* Company Links */}
                    <div className="space-y-4 sm:space-y-6">
                        <h3 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6 text-white">Company</h3>
                        <ul className="space-y-3 text-sm sm:text-base">
                            <li>
                                <Link
                                    href="/pages/services"
                                    className="text-gray-400 hover:text-red-400 transition-colors duration-300 inline-block"
                                >
                                    Services
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/pages/blog"
                                    className="text-gray-400 hover:text-red-400 transition-colors duration-300 inline-block"
                                >
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/pages/about"
                                    className="text-gray-400 hover:text-red-400 transition-colors duration-300 inline-block"
                                >
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/pages/contact"
                                    className="text-gray-400 hover:text-red-400 transition-colors duration-300 inline-block"
                                >
                                    Contact Us
                                </Link>
                            </li>
                            <li>
                                <a
                                    href="mailto:info@crashify.com.au"
                                    className="text-gray-400 hover:text-red-400 transition-colors duration-300 inline-block"
                                >
                                    Careers
                                </a>
                            </li>
                            <li>
                                <Link
                                    href="/pages/admin"
                                    className="text-gray-400 hover:text-red-400 transition-colors duration-300 inline-block"
                                >
                                    Admin
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-4 sm:space-y-6">
                        <h3 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6 text-white">Contact</h3>
                        <ul className="space-y-4 text-sm sm:text-base">
                            <li className="flex items-start space-x-3">
                                <Phone
                                    size={18}
                                    className="text-red-500 mt-0.5 flex-shrink-0"
                                />
                                <span className="text-gray-400 leading-relaxed">
                                    1300 655 106
                                </span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <span className="font-semibold text-red-500 text-sm">
                                    ABN
                                </span>
                                <span className="text-gray-400 leading-relaxed">
                                    82676363116
                                </span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <Mail
                                    size={18}
                                    className="text-red-500 mt-0.5 flex-shrink-0"
                                />
                                <span className="text-gray-400 leading-relaxed break-all">
                                    info@crashify.com.au
                                </span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <MapPin
                                    size={18}
                                    className="text-red-500 mt-0.5 flex-shrink-0"
                                />
                                <span className="text-gray-400 leading-relaxed">
                                    81-83 Cambell St<br />
                                    Surry Hills, NSW 2010, Australia
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800/50 pt-8 sm:pt-10 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <p className="text-gray-500 text-sm sm:text-base">
                        © 2025 Crashify. All rights reserved.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm sm:text-base">
                        <Link
                            href="/pages/privacy"
                            className="text-gray-400 hover:text-red-400 transition-colors duration-300"
                        >
                            Privacy Policy
                        </Link>
                        <Link
                            href="/pages/terms"
                            className="text-gray-400 hover:text-red-400 transition-colors duration-300"
                        >
                            Terms of Service
                        </Link>
                        <Link
                            href="/pages/cookies"
                            className="text-gray-400 hover:text-red-400 transition-colors duration-300"
                        >
                            Cookie Policy
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
