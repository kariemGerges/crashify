'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get('session_id');
    const [loading, setLoading] = useState(true);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState('');
    const [secureLink, setSecureLink] = useState('');

    useEffect(() => {
        if (!sessionId) {
            setError('No session ID provided');
            setLoading(false);
            return;
        }

        verifyPayment();
    }, [sessionId]);

    const verifyPayment = async () => {
        try {
            const response = await fetch(`/api/payments/verify-session?session_id=${sessionId}`);
            const result = await response.json();

            if (!result.success) {
                setError(result.error || 'Payment verification failed');
                setLoading(false);
                return;
            }

            if (result.session.status === 'paid') {
                setVerified(true);
                
                // Get secure form link from metadata
                const quoteRequestId = result.session.metadata?.quote_request_id;
                if (quoteRequestId) {
                    // Fetch or generate secure form link
                    const linkResponse = await fetch(`/api/quotes/${quoteRequestId}/secure-link`, {
                        method: 'POST',
                    });
                    const linkResult = await linkResponse.json();
                    
                    if (linkResult.success && linkResult.secureLink) {
                        setSecureLink(linkResult.secureLink);
                    } else {
                        // If link generation fails, show message
                        console.error('Failed to generate secure link:', linkResult.error);
                    }
                }
            } else {
                setError('Payment not completed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to verify payment');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Verifying payment...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black flex items-center justify-center p-4">
                <div className="bg-gray-900 border border-red-500/20 rounded-xl p-8 max-w-md w-full text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Payment Verification Failed</h1>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                    >
                        Return to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-green-500/20 rounded-xl p-8 max-w-md w-full text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
                <p className="text-gray-400 mb-6">
                    Your payment has been received. You can now complete your assessment request.
                </p>
                {secureLink ? (
                    <Link
                        href={secureLink}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-red-600 text-white rounded-lg hover:from-amber-600 hover:to-red-700 transition-all font-semibold"
                    >
                        Complete Assessment Form
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                ) : (
                    <p className="text-gray-400 text-sm">
                        You will receive an email with a secure link to complete your assessment.
                    </p>
                )}
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading...</p>
                </div>
            </div>
        }>
            <PaymentSuccessContent />
        </Suspense>
    );
}

