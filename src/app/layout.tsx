import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Footer from '@/app/components/Footer';
import Header from './components/Header';
import ChatBot from './components/ChatBot';
import Script from 'next/script';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Crashify pty ltd',
    url: 'https://crashify.com.au',
    logo: 'https://crashify.com.au/logo.png',
    telephone: '+61 1300 655 106',
    address: {
        '@type': 'PostalAddress',
        streetAddress: '81-83 Cambell St',
        addressLocality: 'Surry Hills',
        addressRegion: 'NSW',
        postalCode: '2010',
        addressCountry: 'AU',
    },
    sameAs: [
        'https://www.linkedin.com/company/crashify',
        'https://www.facebook.com/crashify',
    ],
};

export const metadata: Metadata = {
    title: 'Crashify — AI Vehicle Assessments | Book. Assess. Report in 48 Hours',
    description:
        'Fast AI-assisted vehicle damage assessments for insurers & fleets. Book online — get a full report within 48 hours. Serving Australia.',
    keywords: [
        'AI crash analysis',
        'workflow automation',
        'Crashify',
        'AI',
        'vehicle assessments',
        'insurers',
        'fleets',
        'Australia',
    ],
    openGraph: {
        title: 'Crashify — AI Vehicle Assessments (48-hour reports)',
        description:
            'Fast AI-assisted vehicle damage assessments for insurers & fleets. Book online — get a full report within 48 hours.',
        url: 'https://crashify.com.au',
        siteName: 'Crashify',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    robots: { index: true, follow: true },
    metadataBase: new URL('https://crashify.com.au'),
    alternates: {
        canonical: 'https://crashify.com.au',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <Script
                    id="ld-org"
                    type="application/ld+json"
                    strategy="afterInteractive"
                >
                    {JSON.stringify(orgSchema)}
                </Script>
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} 
            antialiased min-h-screen flex flex-col bg-white`}
            >
                <Header />
                {children}
                <ChatBot />
                <Footer />
            </body>
        </html>
    );
}
