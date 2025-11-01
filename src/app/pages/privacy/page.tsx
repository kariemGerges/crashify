export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-black text-gray-100">
            {/* Header */}
            <header className="bg-gradient-to-r from-red-600 to-red-700 shadow-lg">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <h1 className="text-4xl font-bold text-white">
                        Privacy Policy
                    </h1>
                    <p className="text-red-100 mt-2">
                        Last updated: October 31, 2025
                    </p>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="space-y-8">
                    {/* Introduction */}
                    <section className="bg-zinc-900 rounded-lg p-6 border border-red-900">
                        <h2 className="text-2xl font-semibold text-red-500 mb-4">
                            Introduction
                        </h2>
                        <p className="text-gray-300 leading-relaxed">
                            At Crashify, we take your privacy seriously. This
                            Privacy Policy explains how we collect, use,
                            disclose, and safeguard your information when you
                            visit our website or use our services. Please read
                            this policy carefully to understand our practices
                            regarding your personal data.
                        </p>
                    </section>

                    {/* Information We Collect */}
                    <section className="bg-zinc-900 rounded-lg p-6 border border-red-900">
                        <h2 className="text-2xl font-semibold text-red-500 mb-4">
                            Information We Collect
                        </h2>
                        <p className="text-gray-300 mb-4">
                            We collect information that you provide directly to
                            us, including:
                        </p>
                        <ul className="text-gray-300 space-y-2 ml-6">
                            <li className="before:content-['•'] before:text-red-500 before:font-bold before:mr-2">
                                Personal identification information (name,
                                address, email, phone number)
                            </li>
                            <li className="before:content-['•'] before:text-red-500 before:font-bold before:mr-2">
                                Driver license information and driving history
                            </li>
                            <li className="before:content-['•'] before:text-red-500 before:font-bold before:mr-2">
                                Vehicle information (make, model, year, VIN)
                            </li>
                            <li className="before:content-['•'] before:text-red-500 before:font-bold before:mr-2">
                                Insurance history and claims information
                            </li>
                            <li className="before:content-['•'] before:text-red-500 before:font-bold before:mr-2">
                                Payment information for processing premiums
                            </li>
                        </ul>
                    </section>

                    {/* How We Use Your Information */}
                    <section className="bg-zinc-900 rounded-lg p-6 border border-red-900">
                        <h2 className="text-2xl font-semibold text-red-500 mb-4">
                            How We Use Your Information
                        </h2>
                        <p className="text-gray-300 mb-4">
                            We use the information we collect to:
                        </p>
                        <ul className="text-gray-300 space-y-2 ml-6">
                            <li className="before:content-['•'] before:text-red-500 before:font-bold before:mr-2">
                                Provide and maintain insurance coverage
                            </li>
                            <li className="before:content-['•'] before:text-red-500 before:font-bold before:mr-2">
                                Process quotes and policy applications
                            </li>
                            <li className="before:content-['•'] before:text-red-500 before:font-bold before:mr-2">
                                Handle claims and customer service requests
                            </li>
                            <li className="before:content-['•'] before:text-red-500 before:font-bold before:mr-2">
                                Send policy updates and important notices
                            </li>
                            <li className="before:content-['•'] before:text-red-500 before:font-bold before:mr-2">
                                Improve our services and website functionality
                            </li>
                        </ul>
                    </section>

                    {/* Information Sharing */}
                    <section className="bg-zinc-900 rounded-lg p-6 border border-red-900">
                        <h2 className="text-2xl font-semibold text-red-500 mb-4">
                            Information Sharing
                        </h2>
                        <p className="text-gray-300 leading-relaxed">
                            We do not sell your personal information. We may
                            share your information with third parties only in
                            the following circumstances: with your consent, to
                            comply with legal obligations, with service
                            providers who assist us in operating our business,
                            or with insurance underwriters and partners
                            necessary to provide your coverage.
                        </p>
                    </section>

                    {/* Data Security */}
                    <section className="bg-zinc-900 rounded-lg p-6 border border-red-900">
                        <h2 className="text-2xl font-semibold text-red-500 mb-4">
                            Data Security
                        </h2>
                        <p className="text-gray-300 leading-relaxed">
                            We implement appropriate technical and
                            organizational security measures to protect your
                            personal information against unauthorized access,
                            alteration, disclosure, or destruction. However, no
                            method of transmission over the internet is 100%
                            secure, and we cannot guarantee absolute security.
                        </p>
                    </section>

                    {/* Your Rights */}
                    <section className="bg-zinc-900 rounded-lg p-6 border border-red-900">
                        <h2 className="text-2xl font-semibold text-red-500 mb-4">
                            Your Rights
                        </h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            Depending on your location, you may have certain
                            rights regarding your personal information:
                        </p>
                        <ul className="text-gray-300 space-y-2 ml-6">
                            <li className="before:content-['•'] before:text-red-500 before:font-bold before:mr-2">
                                Access and receive a copy of your data
                            </li>
                            <li className="before:content-['•'] before:text-red-500 before:font-bold before:mr-2">
                                Request correction of inaccurate information
                            </li>
                            <li className="before:content-['•'] before:text-red-500 before:font-bold before:mr-2">
                                Request deletion of your data
                            </li>
                            <li className="before:content-['•'] before:text-red-500 before:font-bold before:mr-2">
                                Opt-out of marketing communications
                            </li>
                        </ul>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-zinc-950 border-t border-red-900 mt-16">
                <div className="max-w-4xl mx-auto px-6 py-8 text-center text-gray-500">
                    <p>&copy; 2025 Crashify. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
