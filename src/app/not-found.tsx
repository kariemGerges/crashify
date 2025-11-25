'use client';

import Image from 'next/image';
import notFoundImage from '../../public/404.png';
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from './components/logo';

export default function NotFound(): React.ReactElement {
    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            {/* Full-screen background image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={notFoundImage}
                    alt="404 Not Found"
                    fill
                    className="object-cover"
                    priority
                    quality={90}
                    sizes="100vw"
                />
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px]"></div>
            </div>

            {/* Content overlay */}
            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Main Content - Centered */}
                <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
                    <div className="max-w-4xl mx-auto text-center w-full">
                        {/* Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.6,
                                delay: 0.2,
                                ease: 'easeOut',
                            }}
                            className="space-y-4 sm:space-y-6"
                        >
                            {/* Animated 404 Numbers */}
                            <div className="flex items-center justify-center gap-2 sm:gap-4 lg:gap-6">
                                {/* First 4 */}
                                <motion.span
                                    initial={{
                                        opacity: 0,
                                        scale: 0,
                                        rotate: -180,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                        rotate: 0,
                                        y: [0, -10, 0],
                                    }}
                                    transition={{
                                        opacity: { duration: 0.5, delay: 0.3 },
                                        scale: {
                                            duration: 0.6,
                                            delay: 0.3,
                                            type: 'spring',
                                            stiffness: 200,
                                            damping: 10,
                                        },
                                        rotate: {
                                            duration: 0.8,
                                            delay: 0.3,
                                            type: 'spring',
                                            stiffness: 150,
                                        },
                                        y: {
                                            duration: 2,
                                            delay: 1.2,
                                            repeat: Infinity,
                                            repeatType: 'reverse',
                                            ease: 'easeInOut',
                                        },
                                    }}
                                    className="text-6xl sm:text-7xl lg:text-8xl font-bold text-white drop-shadow-2xl inline-block"
                                >
                                    4
                                </motion.span>

                                {/* 0 */}
                                <motion.span
                                    initial={{
                                        opacity: 0,
                                        scale: 0,
                                        rotate: 180,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                        rotate: 0,
                                        y: [0, -10, 0],
                                    }}
                                    transition={{
                                        opacity: { duration: 0.5, delay: 0.5 },
                                        scale: {
                                            duration: 0.6,
                                            delay: 0.5,
                                            type: 'spring',
                                            stiffness: 200,
                                            damping: 10,
                                        },
                                        rotate: {
                                            duration: 0.8,
                                            delay: 0.5,
                                            type: 'spring',
                                            stiffness: 150,
                                        },
                                        y: {
                                            duration: 2,
                                            delay: 1.4,
                                            repeat: Infinity,
                                            repeatType: 'reverse',
                                            ease: 'easeInOut',
                                        },
                                    }}
                                    className="text-6xl sm:text-7xl lg:text-8xl font-bold text-white drop-shadow-2xl inline-block"
                                >
                                    0
                                </motion.span>

                                {/* Second 4 */}
                                <motion.span
                                    initial={{
                                        opacity: 0,
                                        scale: 0,
                                        rotate: -180,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                        rotate: 0,
                                        y: [0, -10, 0],
                                    }}
                                    transition={{
                                        opacity: { duration: 0.5, delay: 0.7 },
                                        scale: {
                                            duration: 0.6,
                                            delay: 0.7,
                                            type: 'spring',
                                            stiffness: 200,
                                            damping: 10,
                                        },
                                        rotate: {
                                            duration: 0.8,
                                            delay: 0.7,
                                            type: 'spring',
                                            stiffness: 150,
                                        },
                                        y: {
                                            duration: 2,
                                            delay: 1.6,
                                            repeat: Infinity,
                                            repeatType: 'reverse',
                                            ease: 'easeInOut',
                                        },
                                    }}
                                    className="text-6xl sm:text-7xl lg:text-8xl font-bold text-white drop-shadow-2xl inline-block"
                                >
                                    4
                                </motion.span>
                            </div>

                            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-semibold text-white drop-shadow-lg">
                                Page Not Found
                            </h2>
                            <p className="text-base sm:text-lg lg:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
                                The page you&apos;re looking for doesn&apos;t exist or has
                                been moved. Let&apos;s get you back on track.
                            </p>
                        </motion.div>
                    </div>
                </div>

                {/* Footer - Bottom of page */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.6,
                        delay: 0.4,
                        ease: 'easeOut',
                    }}
                    className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12"
                >
                    <div className="max-w-4xl mx-auto">
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-6 sm:mb-8">
                            <Link
                                href="/"
                                className="group relative inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl hover:bg-white/20 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
                            >
                                <Home className=" text-white/95 mr-2 w-5 h-5" />
                                <Logo size={100} />
                            </Link>

                            <button
                                onClick={() => window.history.back()}
                                className="group relative inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl hover:bg-white/20 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
                            >
                                <ArrowLeft className="mr-2 w-5 h-5" />
                                Go Back
                            </button>
                        </div>

                        {/* Helpful Links */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            className="pt-6 sm:pt-8 border-t border-white/20"
                        >
                            <p className="text-sm sm:text-base text-white/80 mb-4">
                                Quick Links
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                                <Link
                                    href="/"
                                    className="text-sm sm:text-base text-white hover:text-white/80 transition-colors duration-200 underline-offset-4 hover:underline"
                                >
                                    Home
                                </Link>
                                <span className="text-white/50">•</span>
                                <Link
                                    href="/pages/services"
                                    className="text-sm sm:text-base text-white hover:text-white/80 transition-colors duration-200 underline-offset-4 hover:underline"
                                >
                                    Services
                                </Link>
                                <span className="text-white/50">•</span>
                                <Link
                                    href="/pages/about"
                                    className="text-sm sm:text-base text-white hover:text-white/80 transition-colors duration-200 underline-offset-4 hover:underline"
                                >
                                    About
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
