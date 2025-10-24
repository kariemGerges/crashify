import Hero from '@/app/components/HomePage/Hero';
import WhyChooseUs from './components/HomePage/WhyChooseUs';
import HowItWorks from './components/HomePage/HowItWorks';

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
