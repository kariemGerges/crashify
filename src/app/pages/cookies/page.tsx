'use client';

export default function CookiesPolicyPage() {
    const sections = [
        {
            title: 'What Are Cookies?',
            content:
                'Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences, analyzing how you use our site, and ensuring our services function properly.',
        },
        {
            title: 'Types of Cookies We Use',
            content:
                'We use several types of cookies on our website: Essential cookies that are necessary for the website to function properly, Performance cookies that help us understand how visitors interact with our website, Functional cookies that remember your preferences and choices, and Analytics cookies that help us improve our services by collecting anonymous usage data.',
        },
        {
            title: 'Essential Cookies',
            content:
                'These cookies are strictly necessary for the operation of our website. They enable core functionality such as security, network management, and accessibility. Without these cookies, services you have requested cannot be provided. These cookies do not store any personally identifiable information.',
        },
        {
            title: 'Performance and Analytics Cookies',
            content:
                "We use analytics cookies to understand how visitors interact with our website. This helps us improve our site's functionality and user experience. These cookies collect information about which pages you visit most often, error messages you receive, and how you navigate through the site. All information collected is aggregated and anonymous.",
        },
        {
            title: 'Functional Cookies',
            content:
                'Functional cookies allow our website to remember choices you make, such as your language preference, region, or username. These cookies provide enhanced, personalized features and help improve your experience on our site. The information these cookies collect may be anonymized and they cannot track your browsing activity on other websites.',
        },
        {
            title: 'Third-Party Cookies',
            content:
                'We may use trusted third-party services that place cookies on your device to help us analyze website usage and improve our services. These third parties have their own privacy policies and cookie policies. We ensure all third-party partners comply with Australian privacy laws and data protection standards.',
        },
        {
            title: 'How Long Do Cookies Last?',
            content:
                "Session cookies are temporary and are deleted when you close your browser. Persistent cookies remain on your device for a set period or until you delete them. The duration varies depending on the cookie's purpose, ranging from a few hours to several years for preference settings.",
        },
        {
            title: 'Managing Your Cookie Preferences',
            content:
                'You can control and manage cookies through your browser settings. Most browsers allow you to refuse or accept cookies, delete existing cookies, and set preferences for certain websites. Please note that disabling certain cookies may affect the functionality of our website and limit your ability to use some features.',
        },
        {
            title: 'Cookie Consent',
            content:
                'By continuing to use our website, you consent to our use of cookies as described in this policy. When you first visit our site, you will see a cookie banner allowing you to accept or customize your cookie preferences. You can change your preferences at any time through your browser settings or by contacting us.',
        },
        {
            title: 'Updates to This Policy',
            content:
                'We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our business practices. Any changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically to stay informed about how we use cookies.',
        },
    ];

    const cookieTypes = [
        {
            name: 'Essential',
            icon: '🔒',
            description: 'Required for site functionality',
            status: 'Always Active',
        },
        {
            name: 'Analytics',
            icon: '📊',
            description: 'Help us improve our services',
            status: 'Optional',
        },
        {
            name: 'Functional',
            icon: '⚙️',
            description: 'Remember your preferences',
            status: 'Optional',
        },
        {
            name: 'Performance',
            icon: '⚡',
            description: 'Optimize site performance',
            status: 'Optional',
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
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                        </svg>
                    </div>
                    <h1 className="text-5xl font-bold text-white mb-4">
                        Cookies Policy
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
                            This Cookie Policy explains how{' '}
                            <span className="text-red-500">
                                Crashify Pty Ltd
                            </span>{' '}
                            uses cookies and similar technologies to recognize
                            you when you visit our website. It explains what
                            these technologies are, why we use them, and your
                            rights to control our use of them.
                        </p>
                    </div>
                </div>

                {/* Cookie Types Overview */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-white mb-8 text-center">
                        Cookie Categories
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {cookieTypes.map((type, index) => (
                            <div
                                key={index}
                                className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 hover:border-red-900 transition-all duration-300 group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="text-4xl">{type.icon}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xl font-bold text-white group-hover:text-red-500 transition-colors">
                                                {type.name}
                                            </h3>
                                            <span
                                                className={`text-xs px-3 py-1 rounded-full ${
                                                    type.status ===
                                                    'Always Active'
                                                        ? 'bg-red-900/30 text-red-400 border border-red-700'
                                                        : 'bg-zinc-800 text-gray-400 border border-zinc-700'
                                                }`}
                                            >
                                                {type.status}
                                            </span>
                                        </div>
                                        <p className="text-gray-400 text-sm">
                                            {type.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
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

                {/* Browser Settings Guide */}
                <div className="mt-16 relative">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-800 rounded-full opacity-10 blur-3xl"></div>
                    <div className="relative bg-gradient-to-br from-zinc-900 to-black rounded-2xl shadow-2xl p-8 border-2 border-red-900">
                        <div className="flex items-center gap-4 mb-6">
                            <svg
                                className="w-8 h-8 text-red-600"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                            <h3 className="text-2xl font-bold text-white">
                                Managing Cookies in Your Browser
                            </h3>
                        </div>
                        <p className="text-gray-300 mb-6">
                            Most web browsers allow you to control cookies
                            through their settings. Here are links to cookie
                            management guides for popular browsers:
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-black p-4 rounded-lg border border-zinc-800">
                                <p className="text-white font-medium mb-1">
                                    Google Chrome
                                </p>
                                <p className="text-gray-500 text-sm">
                                    Settings → Privacy and Security → Cookies
                                </p>
                            </div>
                            <div className="bg-black p-4 rounded-lg border border-zinc-800">
                                <p className="text-white font-medium mb-1">
                                    Mozilla Firefox
                                </p>
                                <p className="text-gray-500 text-sm">
                                    Settings → Privacy & Security → Cookies
                                </p>
                            </div>
                            <div className="bg-black p-4 rounded-lg border border-zinc-800">
                                <p className="text-white font-medium mb-1">
                                    Safari
                                </p>
                                <p className="text-gray-500 text-sm">
                                    Preferences → Privacy → Cookies
                                </p>
                            </div>
                            <div className="bg-black p-4 rounded-lg border border-zinc-800">
                                <p className="text-white font-medium mb-1">
                                    Microsoft Edge
                                </p>
                                <p className="text-gray-500 text-sm">
                                    Settings → Privacy → Cookies
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Card */}
                <div className="mt-16 relative">
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-red-600 rounded-full opacity-10 blur-3xl"></div>
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
                                Questions About Cookies?
                            </h3>
                        </div>
                        <p className="text-gray-300 mb-6">
                            If you have any questions about our use of cookies
                            or this Cookie Policy, please feel free to contact
                            us.
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
                            24th October 2025
                        </span>
                    </p>
                    <p className="text-gray-600 text-sm mt-2">
                        This Cookie Policy is part of our Privacy Policy and
                        Terms of Service.
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
