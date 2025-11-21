"use client";
export default function TermsOfServicePage() {
    const sections = [
        {
            title: 'Introduction and Acceptance',
            content:
                'These Terms and Conditions govern your use of vehicle damage assessment services provided by Crashify ABN 82676363116. By submitting an assessment request, using our website, or engaging our services, you agree to be bound by these Terms. These Terms should be read together with our Privacy Policy, which is incorporated by reference.',
        },
        {
            title: 'Services Provided',
            content:
                'Crashify provides desktop assessments (photo-based analysis), onsite assessments (physical vehicle inspections), AI-powered damage analysis, professional assessment reports, repair vs. replacement recommendations, and cost estimates. Our assessment process includes receipt of vehicle information and photos, automated AI analysis of damage, professional review by qualified assessor, generation of comprehensive assessment report, and delivery of report to Client.',
        },
        {
            title: 'AI-Assisted Assessments',
            content:
                'Our services utilize AI technology to analyze vehicle damage. All AI analysis is reviewed and verified by a qualified assessor, and final assessments are made by a human professional. AI is a tool to enhance, not replace, human expertise.',
        },
        {
            title: 'Client Obligations',
            content:
                'You must provide accurate and complete vehicle information, clear well-lit photos of all damage (minimum 10, maximum 20 per vehicle), correct contact details, and truthful incident descriptions. You represent that you have authority to request the assessment and have obtained necessary consents from vehicle owners.',
        },
        {
            title: 'Fees and Payment',
            content:
                'Desktop assessments: Payment due within 7 days of invoice. Onsite assessments: Payment due within 14 days of invoice. All fees are in Australian Dollars (AUD) and exclude GST. Late payments may incur interest at 10% per annum. Cancellation fees apply: onsite assessments cancelled with less than 24 hours notice incur 100% of quoted fee.',
        },
        {
            title: 'Turnaround Times',
            content:
                'Desktop assessments: 24-48 hours from receipt of all information. Onsite assessments: Report within 24 hours of inspection. We make reasonable efforts to meet turnaround times but are not liable for delays caused by insufficient information, technical issues, force majeure events, or high volume periods.',
        },
        {
            title: 'Assessment Reports',
            content:
                'Our reports include vehicle identification details, description of damage, damaged components, severity ratings, repair vs. replacement recommendations, estimated repair costs and labor hours, and safety concerns. Cost estimates are approximate and may vary. Hidden damage may not be visible in photos, and final repair costs may differ from estimates.',
        },
        {
            title: 'Report Ownership and Use',
            content:
                "Reports are provided for the Client's internal use and remain the intellectual property of Crashify. Reports may be shared with insurers, vehicle owners, and repairers as necessary for claims processing. Reports must not be altered, edited, modified, or used for purposes other than insurance claims assessment.",
        },
        {
            title: 'Privacy and Data Protection',
            content:
                'Personal information is collected, used, and disclosed in accordance with our Privacy Policy. By using our services, you consent to collection of personal information, processing of photos using AI technology, storage of data on cloud servers (including overseas), disclosure to third-party service providers, and electronic communications.',
        },
        {
            title: 'Intellectual Property',
            content:
                'All intellectual property rights in assessment reports, methodologies, AI algorithms and technology, website content and design, business processes, and Crashify branding remain with Crashify. By submitting photos and information, you grant Crashify a non-exclusive license to use, reproduce, and analyze submissions for assessment purposes.',
        },
        {
            title: 'Limitation of Liability',
            content:
                'To the maximum extent permitted by law, our total liability for any claim is limited to the fees paid for the specific assessment. We are not liable for consequential, indirect, or special damages, loss of profits or business, decisions made by insurers based on our reports, or hidden damage not visible in photos. Nothing in these Terms excludes rights under Australian Consumer Law.',
        },
        {
            title: 'Confidentiality',
            content:
                'Both parties agree to keep confidential any information disclosed during the engagement, including assessment reports, insurance policy details, claim information, business processes, and pricing terms. Confidential information may be disclosed to the extent required by law, to professional advisors under confidentiality obligations, or to service providers necessary for performing services.',
        },
        {
            title: 'Termination',
            content:
                "You may terminate individual assessment requests at any time (cancellation fees apply) or ongoing service agreements with 30 days' written notice. We may terminate immediately if you breach these Terms and fail to remedy within 14 days, fail to pay undisputed invoices within 60 days, or engage in fraudulent or unlawful conduct.",
        },
        {
            title: 'Dispute Resolution',
            content:
                'Before commencing legal proceedings, parties agree to notify the other party in writing of the dispute and meet to negotiate in good faith for 30 days. If negotiations fail, parties agree to attempt mediation. During dispute resolution, both parties must continue to perform their obligations under these Terms.',
        },
        {
            title: 'Governing Law',
            content:
                'These Terms are governed by the laws of New South Wales, Australia. Both parties submit to the exclusive jurisdiction of courts in New South Wales. These Terms, together with the Privacy Policy, constitute the entire agreement between the parties.',
        },
    ];

    return (
        <div className="min-h-screen bg-black py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-12 sm:mb-16 animate-fade-in">
                    <div className="inline-block mb-6">
                        <svg
                            className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-red-600"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                        Terms & Conditions
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-400 mb-2">
                        Crashify Pty Ltd
                    </p>
                    <p className="text-sm sm:text-base text-gray-500 mb-1">
                        ABN: 82676363116
                    </p>
                    <div className="mt-6 h-1 w-32 bg-gradient-to-r from-red-600 to-red-800 mx-auto rounded-full"></div>
                </div>

                {/* Introduction */}
                <div className="relative mb-12">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-red-600 rounded-full opacity-10 blur-3xl"></div>
                    <div className="relative bg-zinc-900 rounded-2xl shadow-2xl p-6 sm:p-8 border border-zinc-800">
                        <div className="mb-4">
                            <span className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full mb-4">
                                EFFECTIVE DATE: 05/05/2025
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
                            Please Read Carefully Before Using Our Services
                        </h2>
                        <p className="text-gray-300 leading-relaxed text-base sm:text-lg mb-4">
                            These Terms and Conditions govern your use of
                            vehicle damage assessment services provided by{' '}
                            <span className="text-red-500">Crashify</span>.
                        </p>
                        <p className="text-gray-300 leading-relaxed text-base sm:text-lg">
                            By submitting an assessment request, using our
                            website, or engaging our services, you agree to be
                            bound by these Terms. If you do not agree to these
                            Terms,{' '}
                            <span className="text-red-500 font-semibold">
                                do not use our services
                            </span>
                            .
                        </p>
                    </div>
                </div>

                {/* Key Definitions */}
                <div className="mb-12">
                    <div className="bg-gradient-to-br from-zinc-900 to-black rounded-xl shadow-lg p-6 sm:p-8 border border-zinc-800">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <svg
                                className="w-6 h-6 text-red-600"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                            </svg>
                            Key Definitions
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-4 text-sm">
                            <div className="bg-black p-4 rounded-lg border border-zinc-800">
                                <span className="text-red-500 font-semibold">
                                    Assessment:
                                </span>{' '}
                                <span className="text-gray-400">
                                    Vehicle damage assessment service including
                                    photo analysis and professional reporting
                                </span>
                            </div>
                            <div className="bg-black p-4 rounded-lg border border-zinc-800">
                                <span className="text-red-500 font-semibold">
                                    Client:
                                </span>{' '}
                                <span className="text-gray-400">
                                    The party engaging Crashify&apos;s services
                                    (typically an insurance company)
                                </span>
                            </div>
                            <div className="bg-black p-4 rounded-lg border border-zinc-800">
                                <span className="text-red-500 font-semibold">
                                    AI Technology:
                                </span>{' '}
                                <span className="text-gray-400">
                                    Artificial intelligence systems used to
                                    analyze photos and assist in damage
                                    assessment
                                </span>
                            </div>
                            <div className="bg-black p-4 rounded-lg border border-zinc-800">
                                <span className="text-red-500 font-semibold">
                                    Assessment Report:
                                </span>{' '}
                                <span className="text-gray-400">
                                    Written report detailing vehicle damage and
                                    repair recommendations
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Terms Sections */}
                <div className="space-y-6 sm:space-y-8">
                    {sections.map((section, index) => (
                        <div
                            key={index}
                            className="relative group animate-fade-in-up"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <div className="bg-zinc-900 rounded-xl shadow-lg p-6 sm:p-8 border border-zinc-800 hover:border-red-900 transition-all duration-300">
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center text-white font-bold shadow-lg text-sm sm:text-base">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 group-hover:text-red-500 transition-colors duration-300 break-words">
                                            {section.title}
                                        </h2>
                                        <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                                            {section.content}
                                        </p>
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-red-600 to-red-800 transition-all duration-300 w-0 group-hover:w-full rounded-b-xl"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Important Notice */}
                <div className="mt-12 bg-gradient-to-br from-red-950 to-black rounded-2xl shadow-2xl p-6 sm:p-8 border-2 border-red-900">
                    <div className="flex items-start gap-4 mb-4">
                        <svg
                            className="w-8 h-8 text-red-500 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                        </svg>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                                Important Notice
                            </h3>
                            <p className="text-gray-300 leading-relaxed text-sm sm:text-base mb-3">
                                By using our services, you acknowledge that:
                            </p>
                            <ul className="space-y-2 text-gray-300 text-sm sm:text-base">
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 mt-1">✓</span>
                                    <span>
                                        You have read and understood these Terms
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 mt-1">✓</span>
                                    <span>
                                        You agree to be bound by these Terms
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 mt-1">✓</span>
                                    <span>
                                        You have authority to agree on behalf of
                                        your organization (if applicable)
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 mt-1">✓</span>
                                    <span>
                                        You consent to data processing as
                                        described in the Privacy Policy
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 mt-1">✓</span>
                                    <span>
                                        You understand limitations of liability
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Contact Card */}
                <div className="mt-12 relative">
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-red-800 rounded-full opacity-10 blur-3xl"></div>
                    <div className="relative bg-gradient-to-br from-zinc-900 to-black rounded-2xl shadow-2xl p-6 sm:p-8 border-2 border-red-900">
                        <div className="flex items-center gap-4 mb-6">
                            <svg
                                className="w-8 h-8 text-red-600"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                            </svg>
                            <h3 className="text-xl sm:text-2xl font-bold text-white">
                                Questions About These Terms?
                            </h3>
                        </div>
                        <p className="text-gray-300 mb-6 text-sm sm:text-base">
                            If you have any questions about these Terms &
                            Conditions, please don&apos;t hesitate to contact us.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4 mb-4">
                            <a
                                href="mailto:info@crashify.com.au"
                                className="flex items-center gap-3 bg-black p-4 rounded-lg border border-zinc-800 hover:border-red-600 transition-all duration-300 group"
                            >
                                <svg
                                    className="w-6 h-6 text-red-600 group-hover:scale-110 transition-transform flex-shrink-0"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                </svg>
                                <div className="min-w-0">
                                    <div className="text-xs text-gray-500">
                                        Email
                                    </div>
                                    <div className="text-white font-medium text-sm sm:text-base break-all">
                                        info@crashify.com.au
                                    </div>
                                </div>
                            </a>
                            <a
                                href="tel:+61426000910"
                                className="flex items-center gap-3 bg-black p-4 rounded-lg border border-zinc-800 hover:border-red-600 transition-all duration-300 group"
                            >
                                <svg
                                    className="w-6 h-6 text-red-600 group-hover:scale-110 transition-transform flex-shrink-0"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                                </svg>
                                <div className="min-w-0">
                                    <div className="text-xs text-gray-500">
                                        Phone
                                    </div>
                                    <div className="text-white font-medium text-sm sm:text-base">
                                        1300 655 106
                                    </div>
                                </div>
                            </a>
                        </div>
                        <div className="bg-black p-4 rounded-lg border border-zinc-800">
                            <div className="text-xs text-gray-500 mb-1">
                                Address
                            </div>
                            <div className="text-white text-sm sm:text-base">
                                81-83 Campbell St, Surry Hills, NSW 2010,
                                Australia
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center space-y-2">
                    <p className="text-gray-600 text-xs sm:text-sm">
                        Effective Date:{' '}
                        <span className="text-red-600 font-medium">
                            05th May 2025
                        </span>
                    </p>
                    <p className="text-gray-600 text-xs sm:text-sm">
                        Last Updated:{' '}
                        <span className="text-red-600 font-medium">
                            06th November 2025
                        </span>
                    </p>
                    <p className="text-gray-600 text-xs sm:text-sm mt-2">
                        Any changes to these terms will be posted on our
                        website.
                    </p>
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
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out;
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s ease-out;
                    opacity: 0;
                    animation-fill-mode: forwards;
                }
            `}</style>
        </div>
    );
}
