'use client';
import { useState, useEffect, useRef, memo } from 'react';

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
            title: 'Industry Expertise',
            description:
                'Our specialized team employs advanced AI tools to analyze both light and heavy commercial vehicles, caravans, and motorbikes, eliminating concerns over human error.',
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
            title: 'Tailored Solutions',
            description:
                'We recognize that each client has unique requirements, and our AI-driven services can be customized to address a wide range of operational needs, including estimating varying labour rates as dictated by each insurance provider.',
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
            title: 'Commitment to Excellence',
            description:
                'We uphold quality, reliability, and integrity in all assessments, delivering the highest standards of service through fully automated processes.',
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
    ];

    return (
        <section
            ref={sectionRef}
            className="py-12 px-4 sm:py-16 md:py-20 bg-black overflow-hidden"
        >
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h2
                        className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-white transform transition-all duration-700 ease-out ${
                            isVisible
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 translate-y-10'
                        }`}
                    >
                        Why Choose Us
                    </h2>
                    <div
                        className={`h-1 bg-red-600 mx-auto transition-all duration-700 ease-out ${
                            isVisible ? 'w-20 opacity-100' : 'w-0 opacity-0'
                        }`}
                    ></div>
                </div>

                <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={`relative bg-gray-800 text-gray-200 rounded-lg p-6 sm:p-8 shadow-md border border-red-700 hover:border-red-500 transition-all duration-500 hover:-translate-y-2 hover:scale-105 transform ${
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
                            <div className="flex justify-center mb-5">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 transition-transform duration-500 hover:scale-110">
                                    {feature.icon}
                                </div>
                            </div>

                            <h3 className="text-xl sm:text-2xl font-semibold text-center mb-4 text-white hover:text-red-500 transition-colors duration-300">
                                {feature.title}
                            </h3>

                            <p className="text-center text-gray-300 text-sm sm:text-base leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default memo(WhyChooseUs);
