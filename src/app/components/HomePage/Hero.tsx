
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
                    <h1 className="text-white text-2xl sm:text-base lg:text-4xl font-light tracking-widest mb-2">
                        Book. Assess. Report. All in 48 Hours.
                    </h1>
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
                <div className="max-w-4xl mx-auto text-center space-y-1 sm:space-y-8">
                    {/* Main Heading */}
                    <div className="inline-block px-6 sm:px-8 py-3 sm:py-4">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r text-blue-50">
                            Why Crashify?
                        </h1>
                    </div>
                    {/* Description */}
                    <div className=" px-6 sm:px-10 lg:px-16 py-6 sm:py-8 lg:py-10 rounded-lg mx-4 sm:mx-0">
                        <p className="text-white text-base sm:text-lg lg:text-xl leading-relaxed font-light">
                            Crashify transforms the traditional vehicle
                            assessment process with smart AI automation and
                            professional coordination. Our streamlined booking
                            system eliminates delays, reduces administrative
                            overhead, and ensures consistent 48-hour report
                            delivery. No more chasing quotes, managing
                            spreadsheets, or waiting weeks for assessments.
                        </p>
                    </div>
                    <StatCard />
                    {/* CTA Button */}
                    <TakeSpin px="px-12" py="py-4" />
                </div>
            </div>

            {/* Bottom decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
        </section>
    );
}