'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCancelPage() {
    const searchParams = useSearchParams();
    const quoteRequestId = searchParams.get('quote_request_id');

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-amber-500/20 rounded-xl p-8 max-w-md w-full text-center">
                <XCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Payment Cancelled</h1>
                <p className="text-gray-400 mb-6">
                    Your payment was cancelled. No charges have been made.
                </p>
                <p className="text-gray-500 text-sm mb-6">
                    If you&apos;d like to proceed with your assessment, you can try again or contact us directly.
                </p>
                <div className="flex flex-col gap-3">
                    {quoteRequestId && (
                        <Link
                            href={`/quote/${quoteRequestId}`}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded-lg hover:bg-amber-500/30 transition-colors"
                        >
                            Try Again
                        </Link>
                    )}
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Return to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

