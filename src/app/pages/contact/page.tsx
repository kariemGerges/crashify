// 'use client';
// import { useState } from 'react';

// export default function ContactPage() {
//   const [form, setForm] = useState({
//     FirstName: '',
//     LastName: '',
//     email: '',
//     message: '',
//   });

//   const [status, setStatus] = useState<string | null>(null);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setStatus('Sending...');

//     try {
//       const res = await fetch('/api/sendEmail', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(form),
//       });

//       if (!res.ok) throw new Error('Failed to send message');
//       setStatus('✅ Message sent successfully!');
//       setForm({ FirstName: '', LastName: '', email: '', message: '' });
//     } catch (err) {
//       console.error(err);
//       setStatus('❌ Failed to send message.');
//     }
//   };

//   return (
//     <section className="max-w-lg mx-auto p-6">
//       <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
//       <form onSubmit={handleSubmit} className="space-y-3">
//         <input name="FirstName" placeholder="First Name" value={form.FirstName} onChange={handleChange} className="border p-2 w-full rounded" required />
//         <input name="LastName" placeholder="Last Name" value={form.LastName} onChange={handleChange} className="border p-2 w-full rounded" required />
//         <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} className="border p-2 w-full rounded" required />
//         <textarea name="message" placeholder="Message" value={form.message} onChange={handleChange} className="border p-2 w-full rounded h-28" required />
//         <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Send</button>
//       </form>
//       {status && <p className="mt-3 text-sm">{status}</p>}
//     </section>
//   );
// }
'use client';
import { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({
    FirstName: '',
    LastName: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      setForm({ FirstName: '', LastName: '', email: '', message: '' });
    } catch (err) {
      console.error(err);
      setStatus('❌ Failed to send message.');
    }
  };

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-block mb-4">
            <svg className="w-16 h-16 mx-auto text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-white mb-3">Get Your Free Quote</h2>
          <p className="text-gray-400 text-lg">Fill out the form below and we'll get back to you within mins</p>
          <div className="mt-6 h-1 w-24 bg-gradient-to-r from-red-600 to-red-800 mx-auto rounded-full"></div>
        </div>

        {/* Form Section */}
        <div className="relative">
          {/* Decorative elements */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-red-600 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-red-800 rounded-full opacity-10 blur-3xl"></div>
          
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
                    className="w-full bg-black border-2 border-zinc-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-red-600 transition-all duration-300 placeholder-gray-600"
                    required
                  />
                  <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-red-600 to-red-800 transition-all duration-300 ${focused === 'FirstName' ? 'w-full' : 'w-0'}`}></div>
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
                    className="w-full bg-black border-2 border-zinc-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-red-600 transition-all duration-300 placeholder-gray-600"
                    required
                  />
                  <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-red-600 to-red-800 transition-all duration-300 ${focused === 'LastName' ? 'w-full' : 'w-0'}`}></div>
                </div>
              </div>

              {/* Email */}
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={form.email}
                  onChange={handleChange}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  className="w-full bg-black border-2 border-zinc-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-red-600 transition-all duration-300 placeholder-gray-600"
                  required
                />
                <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-red-600 to-red-800 transition-all duration-300 ${focused === 'email' ? 'w-full' : 'w-0'}`}></div>
              </div>

              {/* Message */}
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  name="message"
                  placeholder="Tell us about your insurance needs..."
                  value={form.message}
                  onChange={handleChange}
                  onFocus={() => setFocused('message')}
                  onBlur={() => setFocused(null)}
                  className="w-full bg-black border-2 border-zinc-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-red-600 transition-all duration-300 placeholder-gray-600 h-32 resize-none"
                  required
                />
                <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-red-600 to-red-800 transition-all duration-300 ${focused === 'message' ? 'w-full' : 'w-0'}`}></div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-red-600/50"
              >
                <span className="flex items-center justify-center gap-2">
                  Send Message
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </button>
            </form>

            {/* Status Message */}
            {status && (
              <div className={`mt-6 p-4 rounded-lg text-center font-medium animate-fade-in ${
                status.includes('✅') 
                  ? 'bg-green-900/30 text-green-400 border border-green-700' 
                  : status.includes('❌')
                  ? 'bg-red-900/30 text-red-400 border border-red-700'
                  : 'bg-zinc-800 text-gray-300 border border-zinc-700'
              }`}>
                {status}
              </div>
            )}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="text-red-600 text-3xl font-bold mb-2">24/7</div>
            <div className="text-gray-400 text-sm">Customer Support</div>
          </div>
          <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="text-red-600 text-3xl font-bold mb-2">Fast</div>
            <div className="text-gray-400 text-sm">Quote Response</div>
          </div>
          <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="text-red-600 text-3xl font-bold mb-2">100%</div>
            <div className="text-gray-400 text-sm">Secure & Private</div>
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