'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from '@/app/components/Footer';
import ChatBot from './ChatBot';

export default function ConditionalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isAdminRoute =
        pathname?.includes('/pages/admin') || pathname?.includes('/admin');

    return (
        <>
            {!isAdminRoute && <Header />}
            {children}
            {!isAdminRoute && <ChatBot />}
            {!isAdminRoute && <Footer />}
        </>
    );
}
