'use client';
import Link from 'next/link';
import { useState } from 'react';





export default function ServicesPage() {
    const [activeService, setActiveService] = useState<number | null>(null);

    // const services = [
    //     {
    //         title: 'AI-Powered Vehicle Damage Detection',
    //         subtitle: 'Precision Assessment Technology',
    //         description:
    //             'Our AI-driven tools enable precise vehicle damage detection without human intervention, ensuring accurate assessments and cost estimates that guarantee fair compensation for vehicle owners.',
    //         icon: (
    //             <svg
    //                 className="w-full h-full"
    //                 fill="currentColor"
    //                 viewBox="0 0 24 24"
    //             >
    //                 <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.06 13.54L7.4 12l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41-5.64 5.66z" />
    //             </svg>
    //         ),
    //         features: [
    //             'Instant damage analysis',
    //             'Cost estimation accuracy',
    //             'Fair compensation guarantee',
    //         ],
    //     },
    //     {
    //         title: 'First Notice of Loss (FNOL) Processing',
    //         subtitle: 'Streamlined Claims Management',
    //         description:
    //             'Expedite your claims process with our FNOL services, which utilize AI to streamline claim initiation, reduce cycle times, and boost customer satisfaction—all with no human oversight.',
    //         icon: (
    //             <svg
    //                 className="w-full h-full"
    //                 fill="currentColor"
    //                 viewBox="0 0 24 24"
    //             >
    //                 <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
    //             </svg>
    //         ),
    //         features: [
    //             'Rapid claim initiation',
    //             'Reduced processing time',
    //             'Enhanced satisfaction',
    //         ],
    //     },
    //     {
    //         title: 'End of Lease Condition Reports',
    //         subtitle: 'Comprehensive Lease Documentation',
    //         description:
    //             'Our meticulous end-of-lease inspections utilize AI to deliver accurate condition reports, ensuring compliance with leasing agreements and avoiding unexpected charges.',
    //         icon: (
    //             <svg
    //                 className="w-full h-full"
    //                 fill="currentColor"
    //                 viewBox="0 0 24 24"
    //             >
    //                 <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
    //             </svg>
    //         ),
    //         features: [
    //             'Detailed condition analysis',
    //             'Lease compliance verification',
    //             'Dispute prevention',
    //         ],
    //     },
    //     {
    //         title: 'Pre & Post Repair Inspections',
    //         subtitle: 'Quality Assurance Standards',
    //         description:
    //             'We conduct thorough post-repair inspections using advanced AI technology to ensure all repairs meet industry standards, providing confidence that vehicles are safe and operable and the work has been conducted according to the Australian Standards.',
    //         icon: (
    //             <svg
    //                 className="w-full h-full"
    //                 fill="currentColor"
    //                 viewBox="0 0 24 24"
    //             >
    //                 <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
    //             </svg>
    //         ),
    //         features: [
    //             'Australian Standards compliance',
    //             'Safety verification',
    //             'Repair quality assurance',
    //         ],
    //     },
    //     {
    //         title: 'Total Loss Vehicle Assessment',
    //         subtitle: 'AI-Driven Valuation Expertise',
    //         description:
    //             'Our expertise in total loss evaluations leverages AI for accurate vehicle valuation, facilitating effective communication and resolution with all stakeholders involved.',
    //         icon: (
    //             <svg
    //                 className="w-full h-full"
    //                 fill="currentColor"
    //                 viewBox="0 0 24 24"
    //             >
    //                 <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
    //             </svg>
    //         ),
    //         features: [
    //             'Accurate market valuation',
    //             'Stakeholder communication',
    //             'Fair settlement resolution',
    //         ],
    //     },
    //     {
    //         title: 'Third-Party Cost Comparisons',
    //         subtitle: 'Fair and Transparent Analysis',
    //         description:
    //             'We conduct in-depth comparisons of third-party repair costs using advanced AI analytics, ensuring fairness and transparency in negotiations.',
    //         icon: (
    //             <svg
    //                 className="w-full h-full"
    //                 fill="currentColor"
    //                 viewBox="0 0 24 24"
    //             >
    //                 <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
    //             </svg>
    //         ),
    //         features: [
    //             'Cost benchmark analysis',
    //             'Transparent negotiations',
    //             'Fair pricing validation',
    //         ],
    //     },
    // ];

    const services = [
        {
            title: 'Comprehensive Damage Assessment',
            subtitle: 'Damage Assessment',
            description:
                'Our qualified assessors conduct thorough on-site vehicle damage evaluations using industry-standard methodologies. Each assessment includes detailed photography, precise measurements, and comprehensive reporting to ensure accurate cost estimates and fair outcomes for all parties.',
            icon: (
                <svg
                    className="w-full h-full"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.06 13.54L7.4 12l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41-5.64 5.66z" />
                </svg>
            ),
            features: [
                'On-site professional assessment within 24 hours',
                'Detailed damage documentation with photos',
                'Accurate repair cost estimates',
                '48-hour report delivery guarantee',
                'Insurance-compliant documentation',
            ],
        },
        {
            title: 'Streamlined Booking & Coordination',
            subtitle: 'Booking',
            description:
                'Skip the endless phone calls and email chains. Our smart booking platform handles all coordination automatically, ensuring every stakeholder receives timely notifications and updates throughout the assessment process.',
            icon: (
                <svg
                    className="w-full h-full"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.06 13.54L7.4 12l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41-5.64 5.66z" />
                </svg>
            ),
            features: [
                '2-minute online booking process',
                'Automated client, owner, and repairer notifications',
                'Real-time booking confirmations',
                'Seamless administrative workflow',
            ],
        },
        {
            title: 'First Notification of Loss (FNOL) Services',
            subtitle: 'FNOL',
            description:
                'Expedite your claims process with our efficient FNOL services. We coordinate immediate assessment scheduling, ensure all required documentation is captured, and deliver comprehensive initial reports within 48 hours—reducing claim cycle times and improving customer satisfaction.',
            icon: (
                <svg
                    className="w-full h-full"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
            ),
            features: [
                'Rapid response to new claims',
                'Complete initial damage assessment',
                'Documentation collection and verification',
                'Stakeholder coordination',
                'Priority scheduling for urgent claims',
            ],
        },
        {
            title: 'End-of-Lease Inspections',
            subtitle: 'End-of-Lease',
            description:
                'Our meticulous end-of-lease inspections deliver accurate vehicle condition reports that ensure compliance with leasing agreements and prevent unexpected charges. Professional documentation protects both lessors and lessees.',
            icon: (
                <svg
                    className="w-full h-full"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                </svg>
            ),
            features: [
                'Full exterior and interior condition assessment',
                'Photographic documentation of all damage',
                'Detailed wear-and-tear evaluation',
                'Compliance verification with lease agreements',
                'Professional reporting for dispute resolution',
            ],
        },
        {
            title: 'Post-Repair Quality Inspection',
            subtitle: 'Post-Repair',
            description:
                'Ensure repairs meet Australian Standards with our thorough post-repair inspections. Our experienced assessors verify workmanship quality, parts compliance, and safety standards—providing confidence that vehicles are properly restored and road-ready.',
            icon: (
                <svg
                    className="w-full h-full"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
                </svg>
            ),
            features: [
                'Comprehensive repair quality assessment',
                'Australian Standards compliance check',
                'Parts and materials verification',
                'Safety system validation',
                'Detailed completion reports',
            ],
        },
        {
            title: 'Total Loss Evaluation',
            subtitle: 'Total Loss',
            description:
                'Our experienced assessors provide accurate total loss valuations using current market data, vehicle condition analysis, and industry-standard methodologies. We facilitate clear communication and fair resolution between insurers, owners, and claimants.',
            icon: (
                <svg
                    className="w-full h-full"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                </svg>
            ),
            features: [
                'Current market value assessment',
                'Pre-accident condition analysis',
                'Salvage value determination',
                'Comprehensive documentation for claims',
                'Independent, unbiased reporting',
            ],
        },
        {
            title: 'Third-Party Repair Cost Analysis',
            subtitle: 'Third-Party Repair',
            description:
                'We conduct thorough comparisons of third-party repair estimates, identifying discrepancies and ensuring fair pricing. Our detailed analysis provides transparency in negotiations and protects against inflated repair costs.',
            icon: (
                <svg
                    className="w-full h-full"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                </svg>
            ),
            features: [
                'Line-by-line estimate review',
                'Market rate comparison',
                'Parts pricing verification',
                'Labour hour validation',
                'Professional recommendations',
                'Expert witness',
            ],
        },
        {
            title: 'Multi-Vehicle Specialization',
            subtitle: 'Specialization',
            description:
                'From passenger cars to heavy commercial vehicles, caravans to motorcycles—we provide professional assessment services across the full spectrum of vehicle types, ensuring comprehensive coverage for all your assessment needs.',
            icon: (
                <svg
                    className="w-full h-full"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.06 13.54L7.4 12l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41-5.64 5.66z" />
                </svg>
            ),
            features: [
                'Light vehicles (cars, SUVs, vans)',
                'Heavy commercial vehicles',
                'Motorcycles and scooters',
                'Caravans and trailers',
                'Machinery and equipment',
            ],
        },
    ];
    const vehicles = [
        {
            emoji: '🚗',
            name: 'Light Passenger',
            type: 'Vehicles',
            gradient: 'from-red-600 to-red-800',
        },
        {
            emoji: '🚛',
            name: 'Heavy Commercial',
            type: 'Vehicles',
            gradient: 'from-red-700 to-red-900',
        },
        {
            emoji: '🚐',
            name: 'Campervans',
            type: '& RVs',
            gradient: 'from-red-600 to-red-800',
        },
        {
            emoji: '🏍️',
            name: 'Motorcycles',
            type: '',
            gradient: 'from-red-700 to-red-900',
        },
        {
            emoji: '🏎️',
            name: 'Exotic & Luxury',
            type: 'Vehicles',
            gradient: 'from-red-600 to-red-800',
        },
    ];

    return (
        <div className="min-h-screen bg-black">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-black via-zinc-900 to-black py-24 px-4">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-red-600 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-800 rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="text-center animate-fade-in">
                        <div className="inline-block mb-6 px-6 py-2 bg-red-600/20 border border-red-600/30 rounded-full">
                            <span className="text-red-400 font-semibold">
                                AI-Powered Solutions
                            </span>
                        </div>
                        <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
                            Our{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">
                                Services
                            </span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                            Expert assessors, streamlined booking, guaranteed
                            turnaround. Experience professional vehicle
                            assessment services backed by smart coordination.
                        </p>
                    </div>
                </div>
            </div>

            {/* Services Grid */}
            <div className="max-w-7xl mx-auto px-4 py-20">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service, index) => (
                        <div
                            key={index}
                            className="group relative animate-fade-in-up"
                            style={{ animationDelay: `${index * 0.15}s` }}
                            onMouseEnter={() => setActiveService(index)}
                            onMouseLeave={() => setActiveService(null)}
                        >
                            <div className="relative h-full bg-zinc-900 rounded-2xl p-8 border border-zinc-800 hover:border-red-600 transition-all duration-500 overflow-hidden">
                                {/* Animated background gradient */}
                                <div
                                    className={`absolute inset-0 bg-gradient-to-br from-red-600/0 to-red-900/0 group-hover:from-red-600/5 group-hover:to-red-900/10 transition-all duration-500`}
                                ></div>

                                {/* Icon */}
                                <div className="relative mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                        {service.icon}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="relative">
                                    <div className="mb-2">
                                        <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">
                                            {service.subtitle}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-red-500 transition-colors duration-300">
                                        {service.title}
                                    </h3>
                                    <p className="text-gray-400 leading-relaxed mb-6">
                                        {service.description}
                                    </p>

                                    {/* Features List */}
                                    <div className="space-y-2">
                                        {service.features.map(
                                            (feature, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-2 text-sm"
                                                >
                                                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                                                    <span className="text-gray-500">
                                                        {feature}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                {/* Hover indicator */}
                                <div
                                    className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-red-800 transform origin-left transition-transform duration-500 ${
                                        activeService === index
                                            ? 'scale-x-100'
                                            : 'scale-x-0'
                                    }`}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Vehicle Expertise Section */}
            <div className="relative py-24 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900 to-black"></div>
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600 rounded-full opacity-10 blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-800 rounded-full opacity-10 blur-3xl"></div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="text-center mb-16">
                        <div className="inline-block mb-4 px-6 py-2 bg-red-600/20 border border-red-600/30 rounded-full">
                            <span className="text-red-400 font-semibold">
                                Comprehensive Coverage
                            </span>
                        </div>
                        <h2 className="text-5xl font-bold text-white mb-6">
                            Our Vehicle{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">
                                Expertise
                            </span>
                        </h2>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            We provide specialized assessments across the full
                            spectrum of vehicles, ensuring comprehensive
                            coverage for all your assessment needs.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {vehicles.map((vehicle, index) => (
                            <div
                                key={index}
                                className="group relative animate-fade-in-up"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="relative bg-zinc-900 rounded-2xl p-8 border border-zinc-800 hover:border-red-600 transition-all duration-300 text-center h-full flex flex-col items-center justify-center">
                                    <div className="text-6xl mb-4 transform group-hover:scale-125 transition-transform duration-300">
                                        {vehicle.emoji}
                                    </div>
                                    <div
                                        className={`text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r ${vehicle.gradient} mb-1`}
                                    >
                                        {vehicle.name}
                                    </div>
                                    {vehicle.type && (
                                        <div className="text-xs text-gray-500 font-medium">
                                            {vehicle.type}
                                        </div>
                                    )}

                                    {/* Hover glow effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/0 to-red-900/0 group-hover:from-red-600/10 group-hover:to-red-900/20 rounded-2xl transition-all duration-300"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="max-w-5xl mx-auto px-4 pb-24">
                <div className="relative bg-gradient-to-br from-red-600 to-red-900 rounded-3xl p-12 text-center overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black rounded-full blur-3xl"></div>
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Ready to Transform Your Assessment Process?
                        </h2>
                        <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
                            Experience the precision and efficiency of
                            AI-powered vehicle assessments. Get in touch with
                            our team today.
                        </p>
                        <Link
                            href="/pages/contact"
                            className="bg-white text-red-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-2xl"
                        >
                            Get Started Today
                        </Link>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(40px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.8s ease-out;
                }
                .animate-fade-in-up {
                    animation: fade-in-up 1s ease-out;
                    opacity: 0;
                    animation-fill-mode: forwards;
                }
            `}</style>
        </div>
    );
}
