import TakeSpin from '@/app/components/TakeSpin';
import Image from 'next/image';
export default function HowItWorks() {
    const steps = [
        {
            number: '01',
            title: 'Submit Your Claim',
            description:
                'Upload photos and details of the damaged vehicle through our secure platform.',
            image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80',
            icon: (
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                </svg>
            ),
        },
        {
            number: '02',
            title: 'AI Analysis',
            description:
                'Our advanced AI technology analyzes the damage using sophisticated algorithms and databases.',
            image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
            icon: (
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                </svg>
            ),
        },
        {
            number: '03',
            title: 'Instant Report',
            description:
                'Receive a detailed assessment report with accurate cost estimates within minutes.',
            image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
            icon: (
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
            ),
        },
        {
            number: '04',
            title: 'Process & Approve',
            description:
                'Review the automated assessment and expedite the claims process with confidence.',
            image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
            icon: (
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
        },
    ];

    return (
        <section className="py-12 px-4 sm:py-16 md:py-20 bg-gradient-to-b from-black via-slate-900 to-black relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-20 left-10 w-72 h-72 bg-red-500 rounded-full filter blur-3xl animate-pulse"></div>
                <div
                    className="absolute bottom-20 right-10 w-96 h-96 bg-red-600 rounded-full filter blur-3xl animate-pulse"
                    style={{ animationDelay: '1s' }}
                ></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-10 sm:mb-12 md:mb-16">
                    <div className="inline-block mb-4 px-4 py-2 bg-red-600/10 border border-red-600/30 rounded-full">
                        <span className="text-red-400 text-sm font-semibold uppercase tracking-wider">
                            Simple Process
                        </span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 text-white">
                        How It Works
                    </h2>
                    <div className="w-20 h-1 bg-gradient-to-r from-red-500 to-red-600 mx-auto mb-4 sm:mb-6"></div>
                    <p className="text-gray-300 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                        Utilize Crashify&apos;s advanced technology to offers services in just a few simple steps.
                        This technology can help insurance companies expedite
                        the claims process, reduce fraud, and ensure fair and
                        accurate assessments.
                    </p>
                </div>

                <div className="relative">
                    {/* Connection line - hidden on mobile, visible on larger screens */}
                    <div
                        className="hidden lg:block absolute top-32 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"
                        style={{ top: '140px' }}
                    ></div>

                    <div className="grid gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-4">
                        {steps.map((step, index) => (
                            <div key={index} className="relative group">
                                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-slate-700 hover:border-red-500 transition-all duration-500 hover:shadow-2xl hover:shadow-red-500/20 hover:-translate-y-2">
                                    {/* Image section with overlay */}
                                    <div className="relative h-48 overflow-hidden">
                                        <Image
                                            src={step.image}
                                            alt={step.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>

                                        {/* Step number badge on image */}
                                        <div className="absolute top-4 left-4">
                                            <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-xl ring-4 ring-red-500/30">
                                                {step.number}
                                            </div>
                                        </div>

                                        {/* Icon badge */}
                                        <div className="absolute bottom-4 right-4">
                                            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/20">
                                                {step.icon}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content section */}
                                    <div className="p-6">
                                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                                            {step.title}
                                        </h3>

                                        <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                                            {step.description}
                                        </p>

                                        {/* Hover indicator */}
                                        <div className="mt-4 flex items-center text-red-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <span>Learn more</span>
                                            <svg
                                                className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 5l7 7-7 7"
                                                />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Decorative corner accent */}
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-500/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>

                                {/* Arrow for mobile - hidden on desktop */}
                                {index < steps.length - 1 && (
                                    <div className="flex justify-center my-6 lg:hidden">
                                        <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center">
                                            <svg
                                                className="w-5 h-5 text-red-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <div className="mt-6 sm:mt-16 text-center">
                    <TakeSpin px="px-8" py="py-8" />
                    <p className="text-gray-400 text-sm mt-6">
                        Trust your car with Crashify today!
                    </p>
                </div>
            </div>
        </section>
    );
}