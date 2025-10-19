import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
    title: 'Crashify | AI-Powered Assessment',
    description: 'Smart crash analysis and workflow automation.',
    keywords: ['AI crash analysis', 'workflow automation', 'Crashify'],
    openGraph: {
        title: 'Crashify',
        description: 'Smart crash analysis and workflow automation.',
        url: 'https://crashify.ai',
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en">
          <body
              className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
        

              {children}
          </body>
      </html>
  );
}
