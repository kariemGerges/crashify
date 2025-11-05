import Hero from '@/app/components/HomePage/Hero';
import WhyChooseUs from './components/HomePage/WhyChooseUs';
import HowItWorks from './components/HomePage/HowItWorks';

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

export default function CrashifyLayout() {
    return (
        <div>
            {/* Main Content Area (Demo) */}
            <main className="flex-grow bg-[#f8f9fa]">
                <section>
                    <Hero />
                </section>
                <section>
                    <WhyChooseUs />
                </section>
                <section>
                    <HowItWorks />
                </section>
            </main>
        </div>
    );
}
