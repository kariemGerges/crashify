
'use client';
import { useState } from 'react';
import { Book, BellRing, Sparkles } from 'lucide-react';


export default function ContactPage() {
    const [form, setForm] = useState({
        FirstName: '',
        LastName: '',
        email: '',
        phone: '',
        company: '',
        userType: '',
        inquiryType: '',
        message: '',
    });
    const [status, setStatus] = useState<string | null>(null);
    const [focused, setFocused] = useState<string | null>(null);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('Sending...');
        try {
            const res = await fetch('/api/sendEmail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error('Failed to send message');
            setStatus('✅ Message sent successfully!');
            setForm({
                FirstName: '',
                LastName: '',
                email: '',
                message: '',
                phone: '',
                company: '',
                userType: '',
                inquiryType: '',
            });
        } catch (err) {
            console.error(err);
            setStatus('❌ Failed to send message.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-12 animate-fade-in">
                    <h1 className="text-5xl font-extrabold text-white mb-3">
                        LET&apos;S TALK! 💬
                    </h1>
                    <p className="text-2xl text-gray-300 mb-2">
                        Your Vehicle Assessment Partner Australia-Wide 🇦🇺
                    </p>
                    <p className="text-gray-400 text-lg max-w-3xl mx-auto">
                        Got questions? Want to book an assessment? We&apos;re
                        here to help! Choose how you&apos;d like to connect:
                    </p>
                    <div className="mt-6 h-1 w-32 bg-red-600 mx-auto rounded-full"></div>
                </div>

                {/* Contact Methods Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {/* Call Us */}
                    <div className="bg-gradient-to-b from-gray-800 via-black to-gray-800  rounded-2xl p-8 shadow-2xl border border-red-600 transform hover:scale-[1.02] transition-all duration-300">
                        <div className="text-4xl mb-4">📞</div>
                        <h3 className="text-2xl font-bold text-white mb-3">
                            CALL US DIRECTLY
                        </h3>
                        <a
                            href="tel:1300655106"
                            className="text-3xl font-bold text-white hover:text-blue-200 transition-colors"
                        >
                            1300 655 106
                        </a>
                        <div className="mt-4 space-y-2 text-blue-100">
                            <p className="font-semibold">Business Hours:</p>
                            <p className="text-sm">
                                Monday - Friday: 7:00am - 6:00pm AEST
                            </p>
                            <p className="text-sm">
                                Saturday: 7:00am - 3:00pm AEST
                            </p>
                            <p className="text-sm">Sunday: Closed</p>
                        </div>
                        <p className="mt-4 text-sm text-blue-200 italic">
                            For urgent bookings during business hours, calling
                            is fastest!
                        </p>
                    </div>

                    {/* Email Us */}
                    <div className="bg-gradient-to-b from-gray-800 via-black to-gray-800 rounded-2xl p-8 shadow-2xl border border-red-600 transform hover:scale-[1.02] transition-all duration-300">
                        <div className="text-4xl mb-4">📧</div>
                        <h3 className="text-2xl font-bold text-white mb-3">
                            EMAIL US
                        </h3>
                        <a
                            href="mailto:info@crashify.com.au"
                            className="text-xl font-bold text-white hover:text-purple-200 transition-colors break-all"
                        >
                            info@crashify.com.au
                        </a>
                        <div className="mt-4 text-purple-100 space-y-2">
                            <p className="text-sm">
                                We respond to all emails within 24 hours during
                                business days.
                            </p>
                            <p className="text-sm">
                                For after-hours inquiries, we&#39;ll get back to
                                you first thing the next business morning.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Book Assessment CTA */}
                <div className="bg-gradient-to-b from-gray-800 via-black to-gray-800 rounded-2xl p-8 shadow-2xl border border-red-600 mb-12 transform hover:scale-[1.01] transition-all duration-300">
                    <div className="flex items-start gap-4">
                        {/* <div className="text-5xl">🚀</div> */}
                        <div className="flex-1">
                            <h3 className="text-3xl font-bold text-white mb-3">
                                BOOK AN ASSESSMENT NOW
                            </h3>
                            <p className="text-green-50 mb-4">
                                Skip the wait! Use our online booking system
                                for:
                            </p>
                            <ul className="space-y-2 text-green-50 mb-6">
                                <li className="flex items-center gap-2">
                                    <span className="text-xl text-red-300">
                                        <Book />
                                    </span>
                                    <span>Immediate booking confirmation</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-xl text-red-300">
                                        <BellRing />
                                    </span>
                                    <span>
                                        Automatic notifications to all parties
                                    </span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-xl text-red-300">
                                        <Sparkles />
                                    </span>
                                    <span>
                                        Transparent quote before you commit
                                    </span>
                                </li>
                            </ul>
                            <button className="bg-white text-red-700 font-bold px-8 py-4 rounded-lg hover:bg-green-50 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2 group">
                                BOOK ASSESSMENT
                                <svg
                                    className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                                    />
                                </svg>
                            </button>
                            <p className="mt-4 text-white font-semibold text-lg">
                                Report in 48 hours!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contact Form Section */}
                <div className="relative">
                    <div className="text-center mb-8">
                        <div className="text-4xl mb-3">✉️</div>
                        <h2 className="text-3xl font-bold text-white mb-2">
                            SEND US A MESSAGE
                        </h2>
                        <p className="text-gray-400">
                            Fill out the form below and we&apos;ll respond
                            within one business day.
                        </p>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-600 rounded-full opacity-10 blur-3xl"></div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-600 rounded-full opacity-10 blur-3xl"></div>

                    <div className="relative bg-zinc-900 rounded-2xl shadow-2xl p-8 border border-zinc-800">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name Fields Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* First Name */}
                                <div className="relative group">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        First Name
                                    </label>
                                    <input
                                        name="FirstName"
                                        placeholder="John"
                                        value={form.FirstName}
                                        onChange={handleChange}
                                        onFocus={() => setFocused('FirstName')}
                                        onBlur={() => setFocused(null)}
                                        className="w-full bg-black border-2 border-zinc-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 placeholder-gray-600"
                                        required
                                    />
                                    <div
                                        className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ${
                                            focused === 'FirstName'
                                                ? 'w-full'
                                                : 'w-0'
                                        }`}
                                    ></div>
                                </div>

                                {/* Last Name */}
                                <div className="relative group">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Last Name
                                    </label>
                                    <input
                                        name="LastName"
                                        placeholder="Doe"
                                        value={form.LastName}
                                        onChange={handleChange}
                                        onFocus={() => setFocused('LastName')}
                                        onBlur={() => setFocused(null)}
                                        className="w-full bg-black border-2 border-zinc-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 placeholder-gray-600"
                                        required
                                    />
                                    <div
                                        className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ${
                                            focused === 'LastName'
                                                ? 'w-full'
                                                : 'w-0'
                                        }`}
                                    ></div>
                                </div>
                            </div>

                            {/* Email and Phone Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Email */}
                                <div className="relative group">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Email Address *
                                    </label>
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="john.doe@example.com"
                                        value={form.email}
                                        onChange={handleChange}
                                        onFocus={() => setFocused('email')}
                                        onBlur={() => setFocused(null)}
                                        className="w-full bg-black border-2 border-zinc-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 placeholder-gray-600"
                                        required
                                    />
                                    <div
                                        className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ${
                                            focused === 'email'
                                                ? 'w-full'
                                                : 'w-0'
                                        }`}
                                    ></div>
                                </div>

                                {/* Phone Number */}
                                <div className="relative group">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        placeholder="0400 000 000"
                                        onFocus={() => setFocused('phone')}
                                        onBlur={() => setFocused(null)}
                                        className="w-full bg-black border-2 border-zinc-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 placeholder-gray-600"
                                        required
                                    />
                                    <div
                                        className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ${
                                            focused === 'phone'
                                                ? 'w-full'
                                                : 'w-0'
                                        }`}
                                    ></div>
                                </div>
                            </div>

                            {/* Company Name */}
                            <div className="relative group">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    name="company"
                                    value={form.company}
                                    onChange={handleChange}
                                    placeholder="Your company name (optional)"
                                    onFocus={() => setFocused('company')}
                                    onBlur={() => setFocused(null)}
                                    className="w-full bg-black border-2 border-zinc-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 placeholder-gray-600"
                                />
                                <div
                                    className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ${
                                        focused === 'company' ? 'w-full' : 'w-0'
                                    }`}
                                ></div>
                            </div>

                            {/* Dropdowns Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* I am a */}
                                <div className="relative group">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        I am a: *
                                    </label>
                                    <select
                                        name="userType"
                                        value={form.userType}
                                        onChange={handleChange}
                                        onFocus={() => setFocused('userType')}
                                        onBlur={() => setFocused(null)}
                                        className="w-full bg-black border-2 border-zinc-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="">
                                            Select an option
                                        </option>
                                        <option value="Insurance Company">
                                            Insurance Company
                                        </option>
                                        <option value="Fleet Manager">
                                            Fleet Manager
                                        </option>
                                        <option value="Assessing Firm">
                                            Assessing Firm
                                        </option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <div
                                        className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ${
                                            focused === 'userType'
                                                ? 'w-full'
                                                : 'w-0'
                                        }`}
                                    ></div>
                                </div>

                                {/* What can we help you with */}
                                <div className="relative group">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        What can we help you with? *
                                    </label>
                                    <select
                                        name="inquiryType"
                                        value={form.inquiryType}
                                        onFocus={() =>
                                            setFocused('inquiryType')
                                        }
                                        onChange={handleChange}
                                        onBlur={() => setFocused(null)}
                                        className="w-full bg-black border-2 border-zinc-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="">
                                            Select an option
                                        </option>
                                        <option value="General Inquiry">
                                            General Inquiry
                                        </option>
                                        <option value="Booking Question">
                                            Booking Question
                                        </option>
                                        <option value="Pricing Information">
                                            Pricing Information
                                        </option>
                                        <option value="Partnership Opportunity">
                                            Partnership Opportunity
                                        </option>
                                        <option value="Technical Support">
                                            Technical Support
                                        </option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <div
                                        className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ${
                                            focused === 'inquiryType'
                                                ? 'w-full'
                                                : 'w-0'
                                        }`}
                                    ></div>
                                </div>
                            </div>

                            {/* Your Message */}
                            <div className="relative group">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Your Message *
                                </label>
                                <textarea
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    placeholder="Tell us about your vehicle assessment needs..."
                                    onFocus={() => setFocused('userMessage')}
                                    onBlur={() => setFocused(null)}
                                    className="w-full bg-black border-2 border-zinc-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 placeholder-gray-600 h-32 resize-none"
                                    required
                                />
                                <div
                                    className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-red-500 to-purple-600 transition-all duration-300 ${
                                        focused === 'userMessage'
                                            ? 'w-full'
                                            : 'w-0'
                                    }`}
                                ></div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-red-600/50"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    Send Message
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                                        />
                                    </svg>
                                </span>
                            </button>
                        </form>

                        {/* Status Message */}
                        {status && (
                            <div
                                className={`mt-6 p-4 rounded-lg text-center font-medium animate-fade-in ${
                                    status.includes('✅')
                                        ? 'bg-green-900/30 text-green-400 border border-green-700'
                                        : status.includes('❌')
                                        ? 'bg-red-900/30 text-red-400 border border-red-700'
                                        : 'bg-zinc-800 text-gray-300 border border-zinc-700'
                                }`}
                            >
                                {status}
                            </div>
                        )}
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
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out;
                }
            `}</style>
        </div>
    );
}
