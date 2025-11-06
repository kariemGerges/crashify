export const metadata = {
    title: 'Privacy Policy — Crashify | AI Vehicle Assessments',
    description:
        'Crashify Privacy Policy - How we collect, use, and protect your personal information in accordance with Australian Privacy Principles.',
    openGraph: {
        title: 'Privacy Policy — Crashify',
        description:
            'How we collect, use, and protect your personal information in accordance with Australian Privacy Principles.',
        url: 'https://crashify.com.au/privacy',
        images: ['/og-image.jpg'],
    },
};

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-black text-gray-100">
            {/* Header */}
            <header className="bg-gradient-to-r from-red-600 to-red-700 shadow-lg">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white">
                        Privacy Policy
                    </h1>
                    <div className="text-red-100 mt-2 text-sm sm:text-base">
                        <p>Effective Date: 05/05/2025</p>
                        <p>Last Updated: 06/11/2025</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="space-y-6 sm:space-y-8">
                    {/* Introduction */}
                    <section className="bg-zinc-900 rounded-lg p-4 sm:p-6 border border-red-900">
                        <h2 className="text-xl sm:text-2xl font-semibold text-red-500 mb-3 sm:mb-4">
                            1. About This Policy
                        </h2>
                        <div className="text-gray-300 leading-relaxed space-y-3 text-sm sm:text-base">
                            <p>
                                This Privacy Policy explains how Crashify (&quot;we&quot;,
                                &quot;us&quot;, &quot;our&quot;) collects, uses, discloses, and
                                protects personal information in accordance with
                                the Privacy Act 1988 (Cth) and the Australian
                                Privacy Principles (APPs).
                            </p>
                            <div className="bg-black/30 rounded p-3 sm:p-4 mt-4">
                                <p className="font-semibold text-red-400 mb-2">
                                    Contact Details:
                                </p>
                                <p>Crashify ABN: 82676363116</p>
                                <p>
                                    Address: 81-83 Campbell St, Surry Hills NSW
                                    2010, Australia
                                </p>
                                <p>Email: info@crashify.com.au</p>
                                <p>Phone: 0426 000 910</p>
                            </div>
                            <p className="mt-4">
                                We are committed to protecting your privacy and
                                handling your personal information in a
                                responsible manner.
                            </p>
                        </div>
                    </section>

                    {/* Information We Collect */}
                    <section className="bg-zinc-900 rounded-lg p-4 sm:p-6 border border-red-900">
                        <h2 className="text-xl sm:text-2xl font-semibold text-red-500 mb-3 sm:mb-4">
                            2. What Personal Information We Collect
                        </h2>
                        <div className="text-gray-300 space-y-4 text-sm sm:text-base">
                            <div>
                                <h3 className="font-semibold text-red-400 mb-2">
                                    Contact Information:
                                </h3>
                                <p className="ml-4">
                                    Full name, email address, mobile phone
                                    number, business/home address (for onsite
                                    assessments)
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-red-400 mb-2">
                                    Vehicle Information:
                                </h3>
                                <p className="ml-4">
                                    Vehicle registration number, VIN, make,
                                    model, year, and photos (which may
                                    incidentally contain faces, other license
                                    plates, or location information)
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-red-400 mb-2">
                                    Insurance Information:
                                </h3>
                                <p className="ml-4">
                                    Insurance company name, policy number or
                                    claim reference, insurance value type,
                                    insurance amount, claim details and incident
                                    information
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-red-400 mb-2">
                                    Assessment Information:
                                </h3>
                                <p className="ml-4">
                                    Date and location of incident, description
                                    of damage, repairer details, assessment
                                    reports and recommendations, communication
                                    records
                                </p>
                            </div>
                            <p className="mt-4 text-gray-400 italic">
                                We do not intentionally collect sensitive
                                information unless necessary for the assessment
                                and with your consent.
                            </p>
                        </div>
                    </section>

                    {/* How We Collect */}
                    <section className="bg-zinc-900 rounded-lg p-4 sm:p-6 border border-red-900">
                        <h2 className="text-xl sm:text-2xl font-semibold text-red-500 mb-3 sm:mb-4">
                            3. How We Collect Personal Information
                        </h2>
                        <div className="text-gray-300 space-y-4 text-sm sm:text-base">
                            <div>
                                <h3 className="font-semibold text-red-400 mb-2">
                                    Directly From You:
                                </h3>
                                <p className="ml-4">
                                    Through our website at crashify.com.au, via
                                    email, by telephone, through SMS
                                    communications, and from photos you submit
                                    for assessment
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-red-400 mb-2">
                                    From Third Parties:
                                </h3>
                                <p className="ml-4">
                                    From insurance companies who engage our
                                    services, from repairers or panel beaters
                                    (with your consent), from your
                                    representatives (with appropriate authority)
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Why We Collect */}
                    <section className="bg-zinc-900 rounded-lg p-4 sm:p-6 border border-red-900">
                        <h2 className="text-xl sm:text-2xl font-semibold text-red-500 mb-3 sm:mb-4">
                            4. Why We Collect Personal Information
                        </h2>
                        <div className="text-gray-300 leading-relaxed text-sm sm:text-base">
                            <p className="mb-3">
                                We collect personal information for the
                                following primary purposes:
                            </p>
                            <p className="ml-4">
                                To conduct vehicle damage assessments, provide
                                reports to insurance companies, coordinate
                                onsite inspections, communicate with you about
                                your assessment, process and fulfill our
                                contractual obligations, maintain business
                                records, comply with legal obligations, and
                                improve our services.
                            </p>
                            <p className="mt-4 text-gray-400">
                                We will not use or disclose personal information
                                for purposes other than those for which it was
                                collected unless you consent or we are required
                                or authorized by law.
                            </p>
                        </div>
                    </section>

                    {/* How We Use */}
                    <section className="bg-zinc-900 rounded-lg p-4 sm:p-6 border border-red-900">
                        <h2 className="text-xl sm:text-2xl font-semibold text-red-500 mb-3 sm:mb-4">
                            5. How We Use Your Personal Information
                        </h2>
                        <div className="text-gray-300 space-y-4 text-sm sm:text-base">
                            <div>
                                <h3 className="font-semibold text-red-400 mb-2">
                                    Assessment Services:
                                </h3>
                                <p className="ml-4">
                                    Analyze vehicle damage using AI-powered
                                    technology, generate assessment reports,
                                    coordinate onsite inspections, communicate
                                    assessment results, provide professional
                                    opinions on repair vs. replacement
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-red-400 mb-2">
                                    Business Operations:
                                </h3>
                                <p className="ml-4">
                                    Maintain assessment records, process
                                    payments and invoicing, comply with legal
                                    requirements, respond to inquiries and
                                    complaints, improve our services and
                                    technology
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-red-400 mb-2">
                                    Communications:
                                </h3>
                                <p className="ml-4">
                                    Send confirmation emails, SMS notifications
                                    for appointments, assessment updates and
                                    reports, appointment reminders, responses to
                                    your questions
                                </p>
                            </div>
                            <p className="mt-4 text-gray-400">
                                We do not use your personal information for
                                direct marketing purposes unless you have
                                consented to receive such communications.
                            </p>
                        </div>
                    </section>

                    {/* Disclosure */}
                    <section className="bg-zinc-900 rounded-lg p-4 sm:p-6 border border-red-900">
                        <h2 className="text-xl sm:text-2xl font-semibold text-red-500 mb-3 sm:mb-4">
                            6. Disclosure of Personal Information
                        </h2>
                        <div className="text-gray-300 space-y-3 text-sm sm:text-base">
                            <p>We may disclose your personal information to:</p>
                            <p className="ml-4">
                                <span className="font-semibold text-red-400">
                                    Insurance Companies:
                                </span>{' '}
                                The insurer or insurance company that engaged
                                our services and related entities as directed
                            </p>
                            <p className="ml-4">
                                <span className="font-semibold text-red-400">
                                    Service Providers:
                                </span>{' '}
                                IT service providers, AI technology providers,
                                SMS and email services, cloud hosting providers,
                                payment processors
                            </p>
                            <p className="ml-4">
                                <span className="font-semibold text-red-400">
                                    Repairers:
                                </span>{' '}
                                Panel beaters or repair shops (only for onsite
                                assessment coordination and with your knowledge)
                            </p>
                            <p className="ml-4">
                                <span className="font-semibold text-red-400">
                                    Professional Advisors:
                                </span>{' '}
                                Legal, accounting, or other professional
                                advisors when necessary
                            </p>
                            <p className="ml-4">
                                <span className="font-semibold text-red-400">
                                    Law Enforcement/Regulators:
                                </span>{' '}
                                Government agencies when required or authorized
                                by law
                            </p>
                            <p className="mt-4 font-semibold text-red-400">
                                We do not sell, rent, or trade your personal
                                information to third parties for their marketing
                                purposes.
                            </p>
                        </div>
                    </section>

                    {/* Overseas Disclosure - IMPORTANT */}
                    <section className="bg-zinc-900 rounded-lg p-4 sm:p-6 border border-red-900">
                        <h2 className="text-xl sm:text-2xl font-semibold text-red-500 mb-3 sm:mb-4">
                            7. Overseas Disclosure of Personal Information
                        </h2>
                        <div className="bg-red-950/50 border-2 border-red-600 rounded-lg p-3 sm:p-4 mb-4">
                            <p className="font-bold text-red-400 text-sm sm:text-base">
                                ⚠️ IMPORTANT:
                            </p>
                            <p className="text-gray-200 mt-2 text-sm sm:text-base">
                                Your personal information may be disclosed to,
                                or stored on servers located in, countries
                                outside of Australia.
                            </p>
                        </div>
                        <div className="text-gray-300 space-y-4 text-sm sm:text-base">
                            <div>
                                <h3 className="font-semibold text-red-400 mb-2">
                                    Countries Your Data May Be Sent To:
                                </h3>
                                <p className="ml-4">
                                    United States (AI processing, SMS services,
                                    cloud storage), European Union (workflow
                                    automation services), and other countries
                                    where our cloud service providers operate
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-red-400 mb-2">
                                    Specific Overseas Recipients:
                                </h3>
                                <ul className="ml-4 space-y-1">
                                    <li>
                                        • Anthropic Inc. (United States) -
                                        AI-powered photo analysis
                                    </li>
                                    <li>
                                        • Google LLC (United States/Global) -
                                        email and file storage
                                    </li>
                                    <li>
                                        • Make.com (Czech Republic/EU) -
                                        workflow automation
                                    </li>
                                    <li>
                                        • Twilio Inc. (United States) - SMS
                                        services
                                    </li>
                                    <li>
                                        • Vercel Inc. (United States/Global) -
                                        website hosting
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-red-400 mb-2">
                                    Privacy Protections:
                                </h3>
                                <p className="ml-4">
                                    We take reasonable steps to ensure overseas
                                    recipients handle your personal information
                                    in a manner consistent with the APPs,
                                    including using service providers with
                                    strong privacy policies, entering into
                                    contracts requiring privacy protection, and
                                    implementing technical security measures.
                                </p>
                            </div>
                            <div className="bg-black/30 rounded p-3 sm:p-4 mt-4">
                                <h3 className="font-semibold text-red-400 mb-2">
                                    Understanding Your Consent:
                                </h3>
                                <p className="text-sm">
                                    By providing your personal information to
                                    us, you consent to the disclosure of your
                                    information to these overseas recipients.
                                    You acknowledge that Australian Privacy
                                    Principle 8.1 will not apply to such
                                    disclosures and you may not be able to seek
                                    redress under the Privacy Act or in the
                                    overseas jurisdiction. You have the right to
                                    refuse consent to overseas disclosure, but
                                    this may prevent us from providing our
                                    services to you.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Data Security */}
                    <section className="bg-zinc-900 rounded-lg p-4 sm:p-6 border border-red-900">
                        <h2 className="text-xl sm:text-2xl font-semibold text-red-500 mb-3 sm:mb-4">
                            8. Data Security
                        </h2>
                        <div className="text-gray-300 space-y-3 text-sm sm:text-base">
                            <p>
                                We take reasonable steps to protect personal
                                information from misuse, interference, loss,
                                unauthorized access, modification, or
                                disclosure.
                            </p>
                            <div>
                                <h3 className="font-semibold text-red-400 mb-2">
                                    Security Measures Include:
                                </h3>
                                <p className="ml-4">
                                    Password-protected systems with two-factor
                                    authentication, encryption of data in
                                    transit (TLS/SSL), restricted access to
                                    personal information, secure cloud storage
                                    with reputable providers, regular security
                                    updates and monitoring, staff training on
                                    privacy obligations, and secure deletion
                                    procedures
                                </p>
                            </div>
                            <p className="text-gray-400 italic mt-4">
                                No method of electronic transmission or storage
                                is 100% secure. While we implement reasonable
                                security measures, we cannot guarantee absolute
                                security.
                            </p>
                        </div>
                    </section>

                    {/* Data Quality */}
                    <section className="bg-zinc-900 rounded-lg p-4 sm:p-6 border border-red-900">
                        <h2 className="text-xl sm:text-2xl font-semibold text-red-500 mb-3 sm:mb-4">
                            9. Data Quality and Accuracy
                        </h2>
                        <div className="text-gray-300 leading-relaxed text-sm sm:text-base">
                            <p className="mb-3">
                                We take reasonable steps to ensure personal
                                information we collect, use, or disclose is
                                accurate, complete, and up-to-date.
                            </p>
                            <p className="ml-4">
                                You can help by providing accurate information
                                when submitting assessments, notifying us
                                promptly of any changes to your details, and
                                reviewing information we send you for accuracy.
                            </p>
                            <p className="mt-3">
                                If you believe any information we hold about you
                                is inaccurate, incomplete, or out of date,
                                please contact us and we will take reasonable
                                steps to correct it.
                            </p>
                        </div>
                    </section>

                    {/* Data Retention */}
                    <section className="bg-zinc-900 rounded-lg p-4 sm:p-6 border border-red-900">
                        <h2 className="text-xl sm:text-2xl font-semibold text-red-500 mb-3 sm:mb-4">
                            10. Data Retention
                        </h2>
                        <div className="text-gray-300 space-y-3 text-sm sm:text-base">
                            <p>
                                We retain personal information for as long as
                                necessary to fulfill the purposes for which it
                                was collected, unless a longer retention period
                                is required or permitted by law.
                            </p>
                            <div className="bg-black/30 rounded p-3 sm:p-4">
                                <h3 className="font-semibold text-red-400 mb-2">
                                    Retention Periods:
                                </h3>
                                <ul className="ml-4 space-y-1">
                                    <li>
                                        • Assessment records: 7 years from
                                        assessment date
                                    </li>
                                    <li>
                                        • Photos: 7 years from assessment date
                                    </li>
                                    <li>
                                        • Email communications: 7 years from
                                        date sent
                                    </li>
                                    <li>
                                        • SMS records: 1 year from date sent
                                    </li>
                                    <li>
                                        • Financial records: 7 years (Australian
                                        tax law requirement)
                                    </li>
                                </ul>
                            </div>
                            <p className="text-gray-400">
                                The 7-year retention period is required by
                                Australian Taxation Office record-keeping
                                requirements and because insurance claims may be
                                disputed for many years.
                            </p>
                        </div>
                    </section>

                    {/* Access Rights */}
                    <section className="bg-zinc-900 rounded-lg p-4 sm:p-6 border border-red-900">
                        <h2 className="text-xl sm:text-2xl font-semibold text-red-500 mb-3 sm:mb-4">
                            11. Access to Your Personal Information
                        </h2>
                        <div className="text-gray-300 space-y-3 text-sm sm:text-base">
                            <p>
                                Under APP 12, you have the right to request
                                access to personal information we hold about
                                you.
                            </p>
                            <div className="bg-black/30 rounded p-3 sm:p-4">
                                <h3 className="font-semibold text-red-400 mb-2">
                                    To Request Access:
                                </h3>
                                <ol className="ml-4 space-y-1">
                                    <li>
                                        1. Email info@crashify.com.au with
                                        subject &quot;Privacy Access Request&quot;
                                    </li>
                                    <li>
                                        2. Provide sufficient details to
                                        identify you (name, assessment number,
                                        date)
                                    </li>
                                    <li>
                                        3. Specify what information you wish to
                                        access
                                    </li>
                                </ol>
                            </div>
                            <p>
                                We will respond to your request within 30 days.
                            </p>
                            <p className="text-gray-400 text-sm">
                                We do not charge for making an access request,
                                but may charge a reasonable fee for the cost of
                                providing access to large volumes of
                                information. We will advise you of any fees
                                before processing your request.
                            </p>
                        </div>
                    </section>

                    {/* Correction Rights */}
                    <section className="bg-zinc-900 rounded-lg p-4 sm:p-6 border border-red-900">
                        <h2 className="text-xl sm:text-2xl font-semibold text-red-500 mb-3 sm:mb-4">
                            12. Correction of Personal Information
                        </h2>
                        <div className="text-gray-300 space-y-3 text-sm sm:text-base">
                            <p>
                                Under APP 13, you have the right to request
                                correction of personal information we hold about
                                you if it is inaccurate, out of date,
                                incomplete, irrelevant, or misleading.
                            </p>
                            <div className="bg-black/30 rounded p-3 sm:p-4">
                                <h3 className="font-semibold text-red-400 mb-2">
                                    To Request Correction:
                                </h3>
                                <ol className="ml-4 space-y-1">
                                    <li>
                                        1. Email info@crashify.com.au with
                                        subject &quot;Privacy Correction Request&quot;
                                    </li>
                                    <li>
                                        2. Specify what information is incorrect
                                    </li>
                                    <li>3. Provide correct information</li>
                                </ol>
                            </div>
                            <p>
                                We will respond within 30 days and take
                                reasonable steps to correct the information.
                            </p>
                        </div>
                    </section>

                    {/* Deletion Rights */}
                    <section className="bg-zinc-900 rounded-lg p-4 sm:p-6 border border-red-900">
                        <h2 className="text-xl sm:text-2xl font-semibold text-red-500 mb-3 sm:mb-4">
                            13. Deletion of Personal Information
                        </h2>
                        <div className="text-gray-300 space-y-3 text-sm sm:text-base">
                            <p>
                                You may request deletion of your personal
                                information, subject to legal retention
                                requirements.
                            </p>
                            <p>
                                To request deletion, email info@crashify.com.au
                                with subject &quot;Privacy Deletion Request&quot;
                            </p>
                            <div className="bg-black/30 rounded p-3 sm:p-4">
                                <h3 className="font-semibold text-red-400 mb-2">
                                    Understanding Deletion Limitations:
                                </h3>
                                <ul className="ml-4 space-y-1 text-sm">
                                    <li>
                                        • We must retain records for 7 years
                                        under Australian tax law
                                    </li>
                                    <li>
                                        • Insurance claims may require records
                                        for future disputes
                                    </li>
                                    <li>
                                        • We cannot delete information already
                                        provided to insurers
                                    </li>
                                    <li>
                                        • Some information may be retained in
                                        de-identified form
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Electronic Communications */}
                    <section className="bg-zinc-900 rounded-lg p-4 sm:p-6 border border-red-900">
                        <h2 className="text-xl sm:text-2xl font-semibold text-red-500 mb-3 sm:mb-4">
                            14. Electronic Communications (Email & SMS)
                        </h2>
                        <div className="text-gray-300 space-y-3 text-sm sm:text-base">
                            <p>
                                By providing your email address and/or mobile
                                number, you consent to receive electronic
                                communications from us related to your
                                assessment, including email confirmations,
                                assessment reports, SMS notifications for
                                appointments, and SMS reminders.
                            </p>
                            <div className="bg-black/30 rounded p-3 sm:p-4">
                                <h3 className="font-semibold text-red-400 mb-2">
                                    Opt-Out Rights:
                                </h3>
                                <p className="ml-4">
                                    You can opt out of SMS notifications at any
                                    time by replying &quot;STOP&quot; to any SMS from us
                                    or emailing info@crashify.com.au requesting
                                    SMS opt-out. Note: We may still need to
                                    contact you via email or phone for essential
                                    assessment-related communications.
                                </p>
                            </div>
                            <p className="text-gray-400">
                                Our electronic communications comply with the
                                Spam Act 2003. We do not send marketing
                                communications unless you have opted in to
                                receive them.
                            </p>
                        </div>
                    </section>

                    {/* Cookies */}
                    <section className="bg-zinc-900 rounded-lg p-4 sm:p-6 border border-red-900">
                        <h2 className="text-xl sm:text-2xl font-semibold text-red-500 mb-3 sm:mb-4">
                            15. Cookies and Website Tracking
                        </h2>
                        <div className="text-gray-300 leading-relaxed text-sm sm:text-base">
                            <p className="mb-3">
                                Our website (crashify.com.au) may use cookies
                                and similar technologies to ensure website
                                functionality, remember your preferences, and
                                analyze website usage.
                            </p>
                            <p className="ml-4">
                                You can control cookies through your browser
                                settings, though refusing cookies may affect
                                website functionality.
                            </p>
                        </div>
                    </section>

                    {/* Children's Privacy */}
                    <section className="bg-zinc-900 rounded-lg p-4 sm:p-6 border border-red-900">
                        <h2 className="text-xl sm:text-2xl font-semibold text-red-500 mb-3 sm:mb-4">
                            16. Children&apos;s Privacy
                        </h2>
                        <div className="text-gray-300 leading-relaxed text-sm sm:text-base">
                            <p>
                                Our services are not directed at children under
                                18. We do not knowingly collect personal
                                information from children.
                            </p>
                            <p className="mt-3">
                                If you believe we have collected information
                                from a child, please contact us immediately.
                            </p>
                        </div>
                    </section>

                    {/* Data Breaches */}
                    <section className="bg-zinc-900 rounded-lg p-4 sm:p-6 border border-red-900">
                        <h2 className="text-xl sm:text-2xl font-semibold text-red-500 mb-3 sm:mb-4">
                            17. Notifiable Data Breaches
                        </h2>
                        <div className="text-gray-300 space-y-3 text-sm sm:text-base">
                            <p>
                                We have procedures in place to detect, respond
                                to, and notify you of data breaches in
                                accordance with the Notifiable Data Breaches
                                (NDB) scheme.
                            </p>
                            <p className="ml-4">
                                If a data breach occurs that is likely to result
                                in serious harm to you, we will notify the
                                Office of the Australian Information
                                Commissioner (OAIC) and affected individuals as
                                soon as practicable, provide information about
                                the breach and steps you can take, and take
                                steps to remediate and prevent future breaches.
                            </p>
                        </div>
                    </section>

                    {/* Complaints */}
                    <section className="bg-zinc-900 rounded-lg p-4 sm:p-6 border border-red-900">
                        <h2 className="text-xl sm:text-2xl font-semibold text-red-500 mb-3 sm:mb-4">
                            18. Complaints Process
                        </h2>
                        <div className="text-gray-300 space-y-3 text-sm sm:text-base">
                            <p>
                                If you believe we have breached the Privacy Act
                                or APPs, you have the right to make a complaint.
                            </p>
                            <div className="bg-black/30 rounded p-3 sm:p-4">
                                <h3 className="font-semibold text-red-400 mb-2">
                                    Step 1 - Contact Us:
                                </h3>
                                <p className="ml-4 mb-3">
                                    Email info@crashify.com.au with subject
                                    &quot;Privacy Complaint&quot; and include your contact
                                    details, details of the alleged breach, and
                                    any supporting information.
                                </p>
                                <h3 className="font-semibold text-red-400 mb-2">
                                    Step 2 - We Will Investigate:
                                </h3>
                                <p className="ml-4 mb-3">
                                    We will acknowledge your complaint within 7
                                    days, investigate thoroughly, and respond
                                    within 30 days with our findings.
                                </p>
                                <h3 className="font-semibold text-red-400 mb-2">
                                    Step 3 - If Not Satisfied:
                                </h3>
                                <p className="ml-4">
                                    Lodge a complaint with the Office of the
                                    Australian Information Commissioner (OAIC)
                                </p>
                                <ul className="ml-8 mt-2 space-y-1">
                                    <li>• Phone: 1300 363 992</li>
                                    <li>• Email: enquiries@oaic.gov.au</li>
                                    <li>• Website: www.oaic.gov.au</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Changes to Policy */}
                    <section className="bg-zinc-900 rounded-lg p-4 sm:p-6 border border-red-900">
                        <h2 className="text-xl sm:text-2xl font-semibold text-red-500 mb-3 sm:mb-4">
                            19. Changes to This Privacy Policy
                        </h2>
                        <div className="text-gray-300 leading-relaxed text-sm sm:text-base">
                            <p className="mb-3">
                                We may update this Privacy Policy from time to
                                time to reflect changes in our practices,
                                technology, legal requirements, or other
                                factors.
                            </p>
                            <p className="ml-4">
                                When we update, we will update the &quot;Last
                                Updated&quot; date at the top of this policy. For
                                material changes, we will notify you via email
                                or prominent notice on our website. The current
                                version will always be available at
                                crashify.com.au/privacy
                            </p>
                            <p className="mt-3 text-gray-400">
                                Your continued use of our services after changes
                                indicates your acceptance of the updated Privacy
                                Policy.
                            </p>
                        </div>
                    </section>

                    {/* Contact Information */}
                    <section className="bg-zinc-900 rounded-lg p-4 sm:p-6 border border-red-900">
                        <h2 className="text-xl sm:text-2xl font-semibold text-red-500 mb-3 sm:mb-4">
                            20. Contact Information
                        </h2>
                        <div className="text-gray-300 text-sm sm:text-base">
                            <p className="mb-3">
                                For privacy-related inquiries, requests, or
                                complaints:
                            </p>
                            <div className="bg-black/30 rounded p-3 sm:p-4">
                                <p className="font-semibold">
                                    Crashify Pty Ltd
                                </p>
                                <p>ABN: 82676363116</p>
                                <p>Privacy Officer: Fady Tadros</p>
                                <p>Email: info@crashify.com.au</p>
                                <p>Phone: 0426 000 910</p>
                                <p>
                                    Address: 81-83 Campbell St, Surry Hills NSW
                                    2010
                                </p>
                            </div>
                            <p className="mt-3 text-gray-400">
                                We are committed to protecting your privacy and
                                will respond to all inquiries promptly and
                                professionally.
                            </p>
                        </div>
                    </section>

                    {/* Acknowledgment */}
                    <section className="bg-red-950/50 rounded-lg p-4 sm:p-6 border-2 border-red-600">
                        <h2 className="text-xl sm:text-2xl font-semibold text-red-400 mb-3 sm:mb-4">
                            21. Acknowledgment
                        </h2>
                        <div className="text-gray-200 space-y-2 text-sm sm:text-base">
                            <p className="font-semibold mb-3">
                                By using our services, you acknowledge that you
                                have read, understood, and agree to this Privacy
                                Policy, including:
                            </p>
                            <ul className="ml-4 space-y-2">
                                <li>
                                    ✓ Collection of your personal information as
                                    described
                                </li>
                                <li>
                                    ✓ Use of your information for assessment
                                    purposes
                                </li>
                                <li>
                                    ✓ Disclosure to insurers and service
                                    providers
                                </li>
                                <li>
                                    ✓ Overseas transfer of information to US and
                                    EU
                                </li>
                                <li>
                                    ✓ AI-powered processing of your photos and
                                    data
                                </li>
                                <li>
                                    ✓ Electronic communications (email and SMS)
                                </li>
                                <li>
                                    ✓ 7-year retention of assessment records
                                </li>
                            </ul>
                            <p className="mt-4 font-semibold text-red-300">
                                If you do not agree, please do not use our
                                services or provide your personal information to
                                us.
                            </p>
                        </div>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-zinc-950 border-t border-red-900 mt-12 sm:mt-16">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 text-center text-gray-500 text-sm">
                    <p>&copy; 2025 Crashify. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
