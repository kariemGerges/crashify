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

export default function Legal() {
    return (
        <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
            <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
                <h1 className="text-4xl font-bold text-center sm:text-left">
                    Legal Information
                </h1>
            </main>
            <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
                <p className="text-center text-sm text-gray-500">
                    © 2024 Crashify. All rights reserved.
                </p>
            </footer>
        </div>
    );
}
