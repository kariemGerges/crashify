'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AssessmentDetailPage } from '@/app/components/Admin/AssessmentDetailPage';
import { ToastProvider } from '@/app/components/Toast';

export default function AssessmentDetailRoute() {
    const params = useParams();
    const router = useRouter();
    const assessmentId = params.id as string;

    const handleClose = () => {
        // Navigate back to admin with claims tab active
        // Use router.push for smooth navigation without page refresh
        router.push('/pages/admin?tab=claims');
    };

    const handleUpdate = () => {
        // Navigate back to admin with claims tab active
        router.push('/pages/admin?tab=claims');
    };

    return (
        <ToastProvider>
            <AssessmentDetailPage
                assessmentId={assessmentId}
                onClose={handleClose}
                onUpdate={handleUpdate}
            />
        </ToastProvider>
    );
}

