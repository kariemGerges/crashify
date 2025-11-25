'use client';
import { useState, useEffect, useRef, memo } from 'react';
import { AlignHorizontalJustifyEnd } from 'lucide-react';

function WhyChooseUs() {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    // Trigger only when at least 40% of section is visible
                    if (
                        entry.isIntersecting &&
                        entry.intersectionRatio >= 0.4
                    ) {
                        setIsVisible(true);
                        observer.disconnect(); // Fire once only
                    }
                });
            },
            { threshold: [0, 0.4, 0.6, 1] }
        );

        observer.observe(section);
        return () => observer.disconnect();
    }, []);

    const features = [
        {
            title: 'Guaranteed 48-Hour Delivery',
            description:
                'We take turnaround time seriously. Every assessment is completed and delivered within 48 hours, with automated notifications keeping all parties informed throughout the process.',
            icon: (
                <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                </svg>
            ),
        },
        {
            title: 'Professional Coordination',
            description:
                'Forget juggling multiple phone calls and emails. Crashify automatically notifies clients, vehicle owners, and repairers with all necessary information, ensuring everyone stays on the same page.',
            icon: (
                <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                </svg>
            ),
        },
        {
            title: 'Streamlined Workflow',
            description:
                'From initial booking to final invoice, every step is automated. Your team saves hours of administrative work while maintaining professional service standards.',
            icon: (
                <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                </svg>
            ),
        },
        {
            title: 'Flexible Service Options',
            description:
                'Light vehicles, heavy commercial, machinery - we handle it all. Same-day urgent bookings available. Services tailored for insurance companies, fleet managers, and assessing firms.',
            icon: (
                <AlignHorizontalJustifyEnd className="w-8 h-8" />
            ),
        },
    ];

    return (
        <section
            ref={sectionRef}
            className="py-12 px-4 sm:py-16 md:py-20 bg-black overflow-hidden"
        >
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12 sm:mb-16 lg:mb-20">
                    <div className="inline-block mb-4 sm:mb-5">
                        <span className="inline-block px-4 py-1.5 sm:px-5 sm:py-2 bg-red-600/10 border border-red-500/30 rounded-full backdrop-blur-sm">
                            <span className="text-red-400 text-xs sm:text-sm font-semibold uppercase tracking-wider">
                                Our Advantages
                            </span>
                        </span>
                    </div>
                    <h2
                        className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-white transform transition-all duration-700 ease-out ${
                            isVisible
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 translate-y-10'
                        }`}
                    >
                        Why Choose Us
                    </h2>
                    <div
                        className={`h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-500 mx-auto rounded-full transition-all duration-700 ease-out ${
                            isVisible ? 'w-20 sm:w-24 opacity-100' : 'w-0 opacity-0'
                        }`}
                    ></div>
                </div>

                <div className="grid gap-6 sm:gap-8 lg:gap-10 md:grid-cols-2 lg:grid-cols-4">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={`relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm text-gray-200 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-10 shadow-xl border border-gray-700/50 hover:border-red-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-500/10 transform ${
                                isVisible
                                    ? 'opacity-100 translate-y-0'
                                    : 'opacity-0 translate-y-10'
                            }`}
                            style={{
                                transitionDelay: isVisible
                                    ? `${index * 150}ms`
                                    : '0ms',
                            }}
                        >
                            {/* Icon Container */}
                            <div className="flex justify-center mb-6 sm:mb-8">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"></div>
                                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500/20 to-red-600/30 rounded-full flex items-center justify-center text-red-400 border border-red-500/30 transition-all duration-500 hover:scale-110 hover:bg-red-500/30">
                                        {feature.icon}
                                    </div>
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6 text-white hover:text-red-400 transition-colors duration-300 leading-tight">
                                {feature.title}
                            </h3>

                            {/* Description */}
                            <p className="text-center text-gray-300 text-sm sm:text-base leading-relaxed sm:leading-loose">
                                {feature.description}
                            </p>
                            
                            {/* Decorative bottom accent */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default memo(WhyChooseUs);
