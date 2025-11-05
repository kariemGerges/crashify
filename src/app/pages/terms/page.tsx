'use client';
export const metadata = {
    title: 'Crashify — AI Vehicle Assessments | Book. Assess. Report in 48 Hours',
    description:
        'Fast AI-assisted vehicle damage assessments for insurers & fleets. Book online — get a full report within 48 hours. Serving Australia.',
    openGraph: {
        title: 'Crashify — AI Vehicle Assessments (48-hour reports)',
        description:
            'Fast AI-assisted vehicle damage assessments for insurers & fleets. Book online — get a full report within 48 hours.',
        url: 'https://crashify.com.au',
        images: ['/og-image.jpg'],
    },
};
export default function PrivacyPolicyPage() {
    const sections = [
        {
            title: 'Types of Information Collected',
            content:
                'We collect the following types of personal information during vehicle assessments: Photographs of the vehicle and its components, GPS location and timestamp metadata embedded in uploaded images, vehicle details (make, model, VIN, registration number), claim-related information (claim number, excess, quotes), and contact details of the vehicle custodian and requestor.',
        },
        {
            title: 'Purpose of Collection',
            content:
                'Crashify collects this information to conduct insurance assessments, generate AI-assisted damage analysis reports, verify vehicle location and condition, and communicate with relevant parties.',
        },
        {
            title: 'Use of AI Systems',
            content:
                'Crashify uses Claude AI to assist in identifying damage severity, repair complexity, and safety concerns. All AI-generated outputs are reviewed by qualified human assessors before inclusion in final reports.',
        },
        {
            title: 'Disclosure of Information',
            content:
                'We may disclose your personal information to authorized parties involved in the assessment process, including insurers, fleet managers, and independent assessors. We do not disclose your information to third parties for unrelated purposes without your consent.',
        },
        {
            title: 'Storage and Security',
            content:
                'Your information is stored securely using encrypted cloud storage. We maintain access logs, audit trails, and metadata to ensure data integrity and traceability. Information is retained for a minimum of seven years in accordance with insurance industry standards.',
        },
        {
            title: 'Data Retention',
            content:
                'We will retain your information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy or as required by law. You have the right to access and correct your personal information held by Crashify. Requests can be made by contacting us at the details below.',
        },
        {
            title: 'Consent',
            content:
                'By uploading photos via our secure portal, you consent to the collection and use of GPS metadata and other personal information for assessment purposes. You may withdraw your consent or request access to your information by contacting us.',
        },
        {
            title: 'Contact Information',
            content:
                'For privacy-related inquiries, please contact: Crashify Pty Ltd | Email: info@crashify.com.au | Phone: +61 426000910',
        },
        {
            title: 'Automation Tools and Infrastructure',
            content:
                'Crashify uses secure automation tools to manage booking workflows, generate upload links, and deliver notifications. These tools operate within our controlled infrastructure and do not independently collect or store personal information.',
        },
    ];

    return (
        <div className="min-h-screen bg-black py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-16 animate-fade-in">
                    <div className="inline-block mb-6">
                        <svg
                            className="w-20 h-20 mx-auto text-red-600"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1 14H9v-2h2v2zm0-4H9V7h2v5z" />
                        </svg>
                    </div>
                    <h1 className="text-5xl font-bold text-white mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-xl text-gray-400 mb-2">
                        Crashify Pty Ltd
                    </p>
                    <div className="mt-6 h-1 w-32 bg-gradient-to-r from-red-600 to-red-800 mx-auto rounded-full"></div>
                </div>

                {/* Introduction */}
                <div className="relative mb-12">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-red-600 rounded-full opacity-10 blur-3xl"></div>
                    <div className="relative bg-zinc-900 rounded-2xl shadow-2xl p-8 border border-zinc-800">
                        <p className="text-gray-300 leading-relaxed text-lg">
                            Crashify Pty Ltd{' '}
                            <span className="text-red-500">
                                (Crashify, we, us, our)
                            </span>{' '}
                            is committed to protecting your privacy. This
                            Privacy Policy outlines how we collect, use,
                            disclose, and store your personal information in
                            accordance with the{' '}
                            <span className="text-red-500">
                                Privacy Act 1988 (Cth)
                            </span>{' '}
                            and the{' '}
                            <span className="text-red-500">
                                Australian Privacy Principles (APPs)
                            </span>
                            .
                        </p>
                    </div>
                </div>

                {/* Policy Sections */}
                <div className="space-y-8">
                    {sections.map((section, index) => (
                        <div
                            key={index}
                            className="relative group animate-fade-in-up"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="bg-zinc-900 rounded-xl shadow-lg p-8 border border-zinc-800 hover:border-red-900 transition-all duration-300">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-white mb-4 group-hover:text-red-500 transition-colors duration-300">
                                            {section.title}
                                        </h2>
                                        <p className="text-gray-400 leading-relaxed">
                                            {section.content}
                                        </p>
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-red-600 to-red-800 transition-all duration-300 w-0 group-hover:w-full rounded-b-xl"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contact Card */}
                <div className="mt-16 relative">
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-red-800 rounded-full opacity-10 blur-3xl"></div>
                    <div className="relative bg-gradient-to-br from-zinc-900 to-black rounded-2xl shadow-2xl p-8 border-2 border-red-900">
                        <div className="flex items-center gap-4 mb-6">
                            <svg
                                className="w-8 h-8 text-red-600"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                            </svg>
                            <h3 className="text-2xl font-bold text-white">
                                Need Help?
                            </h3>
                        </div>
                        <p className="text-gray-300 mb-6">
                            If you have any questions about this Privacy Policy
                            or wish to exercise your rights, please don&#39;t
                            hesitate to contact us.
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <a
                                href="mailto:info@crashify.com.au"
                                className="flex items-center gap-3 bg-black p-4 rounded-lg border border-zinc-800 hover:border-red-600 transition-all duration-300 group"
                            >
                                <svg
                                    className="w-6 h-6 text-red-600 group-hover:scale-110 transition-transform"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                </svg>
                                <div>
                                    <div className="text-xs text-gray-500">
                                        Email
                                    </div>
                                    <div className="text-white font-medium">
                                        info@crashify.com.au
                                    </div>
                                </div>
                            </a>
                            <a
                                href="tel:+61426000910"
                                className="flex items-center gap-3 bg-black p-4 rounded-lg border border-zinc-800 hover:border-red-600 transition-all duration-300 group"
                            >
                                <svg
                                    className="w-6 h-6 text-red-600 group-hover:scale-110 transition-transform"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                                </svg>
                                <div>
                                    <div className="text-xs text-gray-500">
                                        Phone
                                    </div>
                                    <div className="text-white font-medium">
                                        +61 426000910
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center">
                    <p className="text-gray-600 text-sm">
                        Last updated:{' '}
                        <span className="text-red-600 font-medium">
                            17th October 2025
                        </span>
                    </p>
                    <p className="text-gray-600 text-sm mt-2">
                        Any changes to this policy will be posted on our
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
