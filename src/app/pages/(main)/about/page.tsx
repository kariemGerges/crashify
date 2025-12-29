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
    Award,
    Lock,
    Gavel,
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
            color: 'from-sky-500 to-pink-500',
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
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-sky-500 blur-3xl opacity-50 animate-pulse" />
                            {/* <h1 className="relative text-7xl md:text-8xl font-black bg-gradient-to-r from-blue-400 via-sky-400 to-pink-400 bg-clip-text text-transparent">
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
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-sky-500 to-pink-500 rounded-3xl opacity-0 group-hover:opacity-20 blur transition-all duration-500" />
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

                {/* Compliance Framework Section */}
                <div className="mb-20">
                    <h2 className="text-5xl font-black text-center mb-4 bg-gradient-to-r from-blue-400 to-indigo-800 bg-clip-text text-transparent">
                        Crashify Compliance Framework
                    </h2>
                    <p className="text-center text-slate-400 text-xl mb-16">
                        Ensuring strict compliance with all regulatory
                        requirements and industry standards
                    </p>

                    <div className="max-w-6xl mx-auto space-y-8">
                        {/* Compliance Overview */}
                        <div className="relative p-8 md:p-12 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <h3 className="text-3xl font-bold">
                                    Compliance
                                </h3>
                            </div>
                            <p className="text-lg text-slate-300 leading-relaxed">
                                Our internal frameworks ensure strict compliance
                                with all relevant regulatory requirements,
                                industry standards, and best practices. We
                                maintain comprehensive systems to meet our
                                obligations across multiple regulatory
                                frameworks.
                            </p>
                        </div>

                        {/* Regulatory Frameworks */}
                        <div className="relative p-8 md:p-12 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-3xl border border-white/10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-pink-500 rounded-2xl flex items-center justify-center">
                                    <Scale className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold">
                                    Regulatory Frameworks & Standards
                                </h3>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-slate-200 mb-1">
                                                General Insurance Code of
                                                Practice (GICOP)
                                            </h4>
                                            <p className="text-sm text-slate-400">
                                                Full adherence to all
                                                enforceable provisions ensuring
                                                ethical conduct and fair
                                                treatment of all parties
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-slate-200 mb-1">
                                                RG271 Internal Dispute
                                                Regulation
                                            </h4>
                                            <p className="text-sm text-slate-400">
                                                Compliant internal dispute
                                                resolution procedures and
                                                processes
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-slate-200 mb-1">
                                                RG267 Oversight of AFCA
                                            </h4>
                                            <p className="text-sm text-slate-400">
                                                Full compliance with Australian
                                                Financial Complaints Authority
                                                oversight requirements
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-slate-200 mb-1">
                                                WOVR (Written-Off Vehicle
                                                Register)
                                            </h4>
                                            <p className="text-sm text-slate-400">
                                                Proper management and lodgement
                                                of statutory write-off
                                                notifications within required
                                                timeframes
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-slate-200 mb-1">
                                                WOHVR (Written-Off Heavy Vehicle
                                                Register)
                                            </h4>
                                            <p className="text-sm text-slate-400">
                                                Compliance with heavy vehicle
                                                write-off registration and
                                                reporting requirements
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-slate-200 mb-1">
                                                Contractual Requirements
                                            </h4>
                                            <p className="text-sm text-slate-400">
                                                Strict adherence to all
                                                contractual obligations with
                                                insurers, clients, and
                                                stakeholders
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl border border-blue-500/20">
                                <h4 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                                    <Award className="w-5 h-5 text-blue-400" />
                                    APRA Prudential Standards
                                </h4>
                                <p className="text-sm text-slate-300 mb-3">
                                    Compliance with relevant prudential
                                    standards including:
                                </p>
                                <ul className="space-y-2 text-sm text-slate-400 ml-6 list-disc">
                                    <li>
                                        Outsourcing arrangements and third-party
                                        management
                                    </li>
                                    <li>
                                        Information security and data protection
                                        protocols
                                    </li>
                                    <li>
                                        Business continuity planning and
                                        disaster recovery
                                    </li>
                                    <li>
                                        Risk management frameworks and controls
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* AI-Assisted Report Generation */}
                        <div className="relative p-8 md:p-12 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-3xl border border-white/10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold">
                                    AI-Assisted Report Generation
                                </h3>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                                        <Eye className="w-5 h-5 text-cyan-400" />
                                        Transparency in Technology Use
                                    </h4>
                                    <p className="text-slate-300 mb-3">
                                        Crashify utilizes AI technology as a
                                        professional assistance tool in the
                                        report generation process. This
                                        technology assists our qualified
                                        assessors in:
                                    </p>
                                    <ul className="space-y-2 text-slate-400 ml-6 list-disc">
                                        <li>
                                            Structuring and formatting
                                            assessment reports
                                        </li>
                                        <li>
                                            Ensuring comprehensive coverage of
                                            all relevant damage points
                                        </li>
                                        <li>
                                            Maintaining consistency in technical
                                            terminology and report quality
                                        </li>
                                        <li>
                                            Improving clarity and readability of
                                            technical findings
                                        </li>
                                    </ul>
                                </div>

                                <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                                    <h4 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-green-400" />
                                        Human Oversight and Professional
                                        Responsibility
                                    </h4>
                                    <ul className="space-y-2 text-slate-300 text-sm">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                                            <span>
                                                All reports remain subject to
                                                thorough human review and
                                                approval by qualified assessors
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                                            <span>
                                                Final assessment decisions,
                                                damage evaluations, and cost
                                                determinations are made by
                                                experienced professionals
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                                            <span>
                                                AI technology serves as an
                                                assistive tool to enhance
                                                efficiency and consistency, not
                                                as a replacement for human
                                                expertise
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                                            <span>
                                                Qualified assessors verify all
                                                AI-generated content for
                                                accuracy and appropriateness
                                                before report finalization
                                            </span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="p-5 bg-white/5 rounded-xl border border-white/10">
                                        <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
                                            <Award className="w-5 h-5 text-yellow-400" />
                                            Quality Assurance
                                        </h4>
                                        <ul className="space-y-1 text-sm text-slate-400">
                                            <li>
                                                • Every assessment undergoes
                                                professional review
                                            </li>
                                            <li>
                                                • AI-assisted content validated
                                                against industry standards
                                            </li>
                                            <li>
                                                • Full responsibility and
                                                accountability maintained
                                            </li>
                                            <li>
                                                • Reports produced in accordance
                                                with professional standards
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="p-5 bg-white/5 rounded-xl border border-white/10">
                                        <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
                                            <Lock className="w-5 h-5 text-blue-400" />
                                            Data Protection
                                        </h4>
                                        <ul className="space-y-1 text-sm text-slate-400">
                                            <li>
                                                • Data handled in accordance
                                                with Privacy Policy
                                            </li>
                                            <li>
                                                • AI processing through secure,
                                                encrypted channels
                                            </li>
                                            <li>
                                                • Compliance with Australian
                                                Privacy Principles
                                            </li>
                                            <li>
                                                • Protection under Privacy Act
                                                1988 (Cth)
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Professional Standards */}
                        <div className="relative p-8 md:p-12 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-3xl border border-white/10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center">
                                    <Gavel className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold">
                                    Professional Standards for Legal Proceedings
                                </h3>
                            </div>
                            <p className="text-lg text-slate-300 leading-relaxed">
                                When called upon to provide expert evidence in
                                court proceedings, Crashify complies with
                                applicable court rules including the Expert
                                Witness Code of Conduct (Form 44A). Our
                                assessors understand the distinct obligations
                                and impartiality requirements when acting as
                                expert witnesses.
                            </p>
                        </div>

                        {/* Compliance Commitment */}
                        <div className="relative p-8 md:p-12 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-3xl border border-white/10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold">
                                    Our Compliance Commitment
                                </h3>
                            </div>
                            <p className="text-lg text-slate-300 leading-relaxed mb-6">
                                At Crashify, regulatory compliance isn&apos;t
                                just about meeting minimum
                                requirements—it&apos;s fundamental to how we
                                operate. Our engineering-based approach to
                                vehicle assessment naturally aligns with
                                regulatory expectations for thoroughness,
                                accuracy, and professional standards.
                            </p>
                            <p className="text-lg text-slate-300 leading-relaxed mb-6">
                                We maintain detailed documentation, follow
                                established protocols, and regularly review our
                                processes to ensure ongoing compliance with all
                                applicable regulations and industry standards.
                            </p>
                            <div className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
                                <h4 className="font-semibold text-slate-200 mb-4">
                                    Key Compliance Principles:
                                </h4>
                                <div className="grid md:grid-cols-2 gap-3">
                                    {[
                                        'Transparent disclosure of all technology and methodologies used',
                                        'Human oversight and professional accountability at all stages',
                                        'Adherence to privacy legislation and data protection standards',
                                        'Commitment to accuracy, integrity, and ethical conduct',
                                        'Regular review and updates to maintain compliance standards',
                                        'Professional indemnity insurance coverage appropriate to our operations',
                                    ].map((principle, i) => (
                                        <div
                                            key={i}
                                            className="flex items-start gap-2"
                                        >
                                            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm text-slate-300">
                                                {principle}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 mt-6 italic">
                                This compliance framework is subject to regular
                                review and updates to reflect changes in
                                regulatory requirements, industry standards, and
                                operational practices.
                            </p>
                        </div>
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
