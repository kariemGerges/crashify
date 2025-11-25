import Hero from '@/app/components/HomePage/Hero';
import WhyChooseUs from './components/HomePage/WhyChooseUs';
import HowItWorks from './components/HomePage/HowItWorks';
import Header from './components/Header';
import Footer from './components/Footer';
import ChatBot from './components/ChatBot';

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

/**
 * Enterprise-level homepage layout with optimized structure,
 * accessibility, and performance considerations.
 */
export default function CrashifyLayout() {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Header Navigation */}
            <Header />

            {/* Main Content Area with proper semantic structure */}
            <main
                id="main-content"
                className="flex-grow bg-gradient-to-b from-[#f8f9fa] via-white to-[#f8f9fa]"
                role="main"
                aria-label="Main content"
            >
                {/* Hero Section - Primary CTA and Value Proposition */}
                <section
                    id="hero"
                    aria-label="Hero section"
                    className="relative overflow-hidden"
                >
                    <Hero />
                </section>

                {/* Why Choose Us Section - Key Differentiators */}
                <section
                    id="why-choose-us"
                    aria-label="Why choose Crashify"
                    className="relative"
                >
                    <WhyChooseUs />
                </section>

                {/* How It Works Section - Process Overview */}
                <section
                    id="how-it-works"
                    aria-label="How Crashify works"
                    className="relative"
                >
                    <HowItWorks />
                </section>
            </main>

            {/* ChatBot - Customer Support */}
            <ChatBot />

            {/* Footer - Site Information and Links */}
            <Footer />
        </div>
    );
}
