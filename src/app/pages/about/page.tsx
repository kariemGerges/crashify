'use client';
import React, { useState, useEffect } from 'react';
import {
    Eye,
    Zap,
    Shield,
    CheckCircle,
    Scale,
    FileText,
    Camera,
    MapPin,
    MapPinHouse,
} from 'lucide-react';
import Logo from '@/app/components/logo';
import TakeSpin from '@/app/components/TakeSpin';

export default function CrashifyAbout() {
    const [scrollY, setScrollY] = useState(0);
    const [activeService, setActiveService] = useState<number | null>(null);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const services = [
        {
            icon: Camera,
            title: 'Comprehensive Damage Assessment',
            desc: 'Thorough on-site evaluations with detailed photography, precise measurements, and comprehensive reporting for accurate cost estimates.',
            features: [
                'Rapid preliminary assessments',
                'High-resolution digital documentation',
                'Immediate report delivery',
            ],
            color: 'from-blue-500 to-cyan-500',
            delay: '0',
        },
        {
            icon: MapPin,
            title: 'Rapid FNOL Response',
            desc: 'Fast-track your first notification of loss with priority scheduling and expedited reporting to reduce claim cycle times.',
            features: [
                'Qualified professional assessors',
                'Comprehensive on-location inspections',
                'Immediate results and clarity',
            ],
            color: 'from-purple-500 to-pink-500',
            delay: '100',
        },
        {
            icon: Scale,
            title: 'On-Site Inspections',
            desc: 'Our qualified assessors conduct immediate on-location inspections, eliminating delays and providing clarity for time-sensitive cases.',
            features: [
                'Expert valuation services',
                'Settlement management',
                'Fair and defensible outcomes',
            ],
            color: 'from-orange-500 to-red-500',
            delay: '200',
        },
        {
            icon: CheckCircle,
            title: 'Total Loss Evaluation',
            desc: 'Expert valuation and settlement management services that ensure fair and defensible outcomes for all parties involved.',
            features: [
                'Quality assurance inspections',
                'Regulatory compliance',
                'Stakeholder protection',
            ],
            color: 'from-green-500 to-emerald-500',
            delay: '300',
        },
        {
            icon: FileText,
            title: 'Quality Assurance Inspections',
            desc: 'End-of-lease and post-repair verification conducted in strict compliance with Australian Standards and regulatory requirements.',
            features: [
                'Legal process support',
                'Full compliance assurance',
                'Expert testimony services',
            ],
            color: 'from-indigo-500 to-blue-500',
            delay: '400',
        },
        {
            icon: Shield,
            title: 'WOVR Management',
            desc: 'Complete handling of Written-Off Vehicle Register submissions with proper documentation and regulatory compliance.',
            features: [
                'Comprehensive total loss reports',
                'WOVR submission handling',
                'Regulatory compliance',
            ],
            color: 'from-yellow-500 to-orange-500',
            delay: '500',
        },
        
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
            {/* Animated background particles */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 bg-blue-500 rounded-full opacity-20 animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${3 + Math.random() * 4}s`,
                        }}
                    />
                ))}
            </div>

            {/* Hero Section */}
            <div className="relative z-10 container mx-auto px-6 pt-20 pb-32">
                <div
                    className="text-center transform transition-all duration-1000"
                    style={{
                        transform: `translateY(${scrollY * 0.3}px)`,
                        opacity: Math.max(0, 1 - scrollY / 500),
                    }}
                >
                    {/* · "Smart automation meets human expertise" */}
                    <div className="inline-block mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-3xl opacity-50 animate-pulse" />
                            {/* <h1 className="relative text-7xl md:text-8xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Crashify
                            </h1> */}
                            <Logo size={260} />
                        </div>
                    </div>

                    <p className="text-2xl md:text-3xl font-light text-slate-300 mb-8 max-w-3xl mx-auto">
                        Where{' '}
                        <span className="text-cyan-400 font-semibold">
                            Smart automation
                        </span>{' '}
                        Meets{' '}
                        <span className="text-amber-500 font-semibold">
                            human expertise
                        </span>
                    </p>

                    <div className="flex flex-wrap justify-center gap-4 mb-16">
                        {[
                            { icon: Eye, text: 'Professional' },
                            { icon: Zap, text: 'Efficiency' },
                            { icon: Shield, text: 'Guarantee' },
                            { icon: MapPinHouse, text: 'Nationwide' },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2 px-6 py-3 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105"
                                style={{ animationDelay: `${i * 200}ms` }}
                            >
                                <item.icon className="w-5 h-5 text-cyan-400" />
                                <span className="font-medium">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mission Statement */}
                <div className="max-w-5xl mx-auto mb-20">
                    <div className="relative p-8 md:p-12 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl opacity-0 group-hover:opacity-20 blur transition-all duration-500" />
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-500 rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <h2 className="text-3xl font-bold">
                                    Revolutionary AI Technology
                                </h2>
                            </div>

                            <p className="text-lg text-slate-300 leading-relaxed mb-6">
                                Crashify is a professional vehicle assessment
                                firm serving insurance companies, fleet
                                managers, and assessing firms across Australia.
                                We&apos;ve built a streamlined booking and
                                coordination system that eliminates the
                                administrative burden of traditional assessment
                                scheduling while maintaining the highest
                                standards of professional evaluation.
                            </p>

                            <p className="text-lg text-slate-300 leading-relaxed">
                                Our network of qualified assessors conducts
                                thorough on-site inspections using
                                industry-standard methodologies, delivering
                                comprehensive reports within guaranteed
                                timeframes. By combining smart booking
                                automation with experienced human expertise, we
                                provide the reliability and accuracy the
                                insurance industry demands.
                            </p>

                            <div className="mt-8 p-6 bg-gradient-to-r from-gray-200/10 to-gray-700/10 rounded-2xl border border-red-700/20">
                                <p className="text-lg text-slate-200 font-medium">
                                    🇦🇺 Proudly serving clients across Australia
                                    with accurate and timely assessments. From
                                    total loss reporting to instant damage
                                    quoting and valuation, we offer
                                    comprehensive services tailored to meet your
                                    specific needs.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Services Grid */}
                <div className="mb-20">
                    <h2 className="text-5xl font-black text-center mb-4 bg-gradient-to-r from-red-400 to-red-800 bg-clip-text text-transparent">
                        Our Services
                    </h2>
                    <p className="text-center text-slate-400 text-xl mb-16">
                        Comprehensive solutions for every assessment need
                    </p>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map((service, index) => {
                            const Icon = service.icon;
                            return (
                                <div
                                    key={index}
                                    className="group relative p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-500 hover:scale-105 cursor-pointer"
                                    onMouseEnter={() => setActiveService(index)}
                                    onMouseLeave={() => setActiveService(null)}
                                    style={{
                                        animation: `fadeIn 0.6s ease-out ${service.delay}ms both`,
                                    }}
                                >
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500`}
                                    />

                                    <div className="relative">
                                        <div className="flex items-center gap-4 mb-4">
                                            {/* <div
                                                className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center text-3xl transform group-hover:rotate-12 transition-transform duration-500 shadow-lg`}
                                            >
                                                {service.emoji}
                                            </div> */}
                                            <Icon
                                                className={`w-8 h-8 text-red-400 group-hover:text-white/70 transition-colors duration-300`}
                                            />
                                        </div>

                                        <h3 className="text-2xl font-bold mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-white group-hover:to-slate-300 transition-all duration-300">
                                            {service.title}
                                        </h3>

                                        <p className="text-slate-400 mb-6 leading-relaxed">
                                            {service.desc}
                                        </p>

                                        <div
                                            className={`space-y-3 overflow-hidden transition-all duration-500 ${
                                                activeService === index
                                                    ? 'max-h-96 opacity-100'
                                                    : 'max-h-0 opacity-0'
                                            }`}
                                        >
                                            {service.features.map(
                                                (feature, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-start gap-2"
                                                    >
                                                        <div
                                                            className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${service.color} mt-2 animate-pulse`}
                                                        />
                                                        <span className="text-sm text-slate-300">
                                                            {feature}
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* CTA Section */}
                <div className="text-center relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-pink-900/20 to-gray-900/20 blur-3xl" />
                    <div className="relative p-12 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 max-w-3xl mx-auto">
                        <h2 className="text-4xl font-black mb-6 bg-gradient-to-r from-red-200 to-red-600 bg-clip-text text-transparent">
                            Experience the Crashify Difference
                        </h2>
                        <p className="text-xl text-slate-300 mb-8">
                            Where accuracy and excellence meet in every aspect
                            of our work. Choose Crashify for reliable
                            assessments, top-notch services, and a commitment to
                            customer satisfaction.
                        </p>
                        <TakeSpin px="px-6 md:px-8" py="py-3 md:py-4" />
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
