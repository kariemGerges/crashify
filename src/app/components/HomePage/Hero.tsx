import Image from 'next/image';
import carImage from '../../../../public/heroCar.png';
import TakeSpin from '../TakeSpin';
import StatCard from '@/app/components/HomePage/animated-stats-cards';

export default function CrashifyHero() {
    return (
        <section className="relative min-h-screen bg-black overflow-hidden">
            {/* Subtle animated background */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full filter blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600 rounded-full filter blur-3xl animate-pulse"></div>
            </div>

            <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
                {/* Top Title */}
                <div className="text-center mb-6 sm:mb-8 lg:mb-12">
                    <div className="inline-block mb-3 sm:mb-4">
                        <span className="inline-block px-4 py-1.5 sm:px-5 sm:py-2 bg-red-600/20 border border-red-500/40 rounded-full backdrop-blur-sm">
                            <span className="text-red-400 text-xs sm:text-sm font-semibold uppercase tracking-wider">
                                48-Hour Guarantee
                            </span>
                        </span>
                    </div>
                    <h1 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 leading-tight">
                        <span className="block mb-2 sm:mb-3 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                            Book. Assess. Report.
                        </span>
                        <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-red-400">
                            All in 48 Hours
                        </span>
                    </h1>
                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                        <div className="h-px w-12 sm:w-16 bg-gradient-to-r from-transparent via-red-500 to-red-500"></div>
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        <div className="h-px w-12 sm:w-16 bg-gradient-to-l from-transparent via-red-500 to-red-500"></div>
                    </div>
                </div>

                {/* Car Image Section */}
                <div className="relative max-w-5xl mx-auto mb-8 sm:mb-12 lg:mb-16">
                    <div className="relative aspect-video sm:aspect-[16/10] lg:aspect-[16/9] rounded-lg overflow-hidden">
                        {/* Geometric overlay lines */}
                        <div className="absolute inset-0 z-10">
                            <svg
                                className="w-full h-full"
                                viewBox="0 0 800 500"
                                preserveAspectRatio="xMidYMid slice"
                            >
                                <defs>
                                    <linearGradient
                                        id="lineGradient"
                                        x1="0%"
                                        y1="0%"
                                        x2="100%"
                                        y2="100%"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#FF0000"
                                            stopOpacity="0.6"
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="#FF0000"
                                            stopOpacity="0.6"
                                        />
                                    </linearGradient>
                                </defs>

                                {/* Animated scanning lines */}
                                <line
                                    x1="100"
                                    y1="150"
                                    x2="300"
                                    y2="100"
                                    stroke="url(#lineGradient)"
                                    strokeWidth="1.5"
                                >
                                    <animate
                                        attributeName="opacity"
                                        values="0.3;1;0.3"
                                        dur="2s"
                                        repeatCount="indefinite"
                                    />
                                </line>
                                <line
                                    x1="300"
                                    y1="100"
                                    x2="500"
                                    y2="100"
                                    stroke="url(#lineGradient)"
                                    strokeWidth="1.5"
                                >
                                    <animate
                                        attributeName="opacity"
                                        values="0.5;1;0.5"
                                        dur="2.5s"
                                        repeatCount="indefinite"
                                    />
                                </line>
                                <line
                                    x1="500"
                                    y1="100"
                                    x2="700"
                                    y2="150"
                                    stroke="url(#lineGradient)"
                                    strokeWidth="1.5"
                                >
                                    <animate
                                        attributeName="opacity"
                                        values="0.4;1;0.4"
                                        dur="3s"
                                        repeatCount="indefinite"
                                    />
                                </line>

                                {/* Detection points */}
                                <circle cx="200" cy="125" r="4" fill="#FF0000">
                                    <animate
                                        attributeName="r"
                                        values="3;6;3"
                                        dur="1.5s"
                                        repeatCount="indefinite"
                                    />
                                </circle>
                                <circle cx="400" cy="100" r="4" fill="#FF0000">
                                    <animate
                                        attributeName="r"
                                        values="3;6;3"
                                        dur="2s"
                                        repeatCount="indefinite"
                                    />
                                </circle>
                                <circle cx="600" cy="125" r="4" fill="#FF0000">
                                    <animate
                                        attributeName="r"
                                        values="3;6;3"
                                        dur="2.5s"
                                        repeatCount="indefinite"
                                    />
                                </circle>
                            </svg>
                        </div>

                        {/* Car Image */}
                        <Image
                            src={carImage}
                            alt="AI analyzing vehicle damage"
                            className="w-full h-full object-cover"
                        />

                        {/* Scanning overlay effect */}
                        <div
                            className="absolute inset-0 rounded-full 
                        bg-gradient-to-b from-transparent via-gray-300/5 to-transparent
                        animate-pulse"
                        ></div>
                    </div>
                </div>

                {/* Text Content Section */}
                <div className="max-w-4xl mx-auto text-center space-y-8 sm:space-y-10 lg:space-y-12">
                    {/* Main Heading */}
                    <div className="space-y-4 sm:space-y-6">
                        <div className="inline-block">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4">
                                <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                                    Why Crashify?
                                </span>
                            </h2>
                            <div className="h-1 w-16 sm:w-20 bg-gradient-to-r from-red-500 via-red-600 to-red-500 mx-auto rounded-full"></div>
                        </div>
                    </div>
                    
                    {/* Description */}
                    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
                        <p className="text-white text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed sm:leading-loose font-light max-w-3xl mx-auto">
                            Crashify transforms the traditional vehicle
                            assessment process with smart AI automation and
                            professional coordination. Our streamlined booking
                            system eliminates delays, reduces administrative
                            overhead, and ensures consistent 48-hour report
                            delivery. No more chasing quotes, managing
                            spreadsheets, or waiting weeks for assessments.
                        </p>
                    </div>
                    
                    {/* Stats Section */}
                    <div className="py-4 sm:py-6">
                        <StatCard />
                    </div>
                    
                    {/* CTA Button */}
                    <div className="pt-4 sm:pt-6">
                        <TakeSpin px="px-12" py="py-4" />
                    </div>
                </div>
            </div>

            {/* Bottom decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
        </section>
    );
}
