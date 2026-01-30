'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AssessmentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: routeId } = use(params);
    const [assessment, setAssessment] = useState<Record<
        string,
        unknown
    > | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const id = routeId;
        if (!id) return;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/cicop/assessments/${id}`);
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    setError(data.error || 'Assessment not found');
                    setAssessment(null);
                    return;
                }
                const data = await res.json();
                setAssessment(data);
            } catch (e) {
                setError('Failed to load assessment');
                setAssessment(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [routeId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 text-white font-sans antialiased flex items-center justify-center">
                <p className="text-neutral-500 text-sm">Loading assessment...</p>
            </div>
        );
    }

    if (error || !assessment) {
        return (
            <div className="min-h-screen bg-neutral-950 text-white font-sans antialiased flex flex-col items-center justify-center gap-4">
                <p className="text-red-400 text-sm">{error || 'Not found'}</p>
                <Link href="/pages/cicop" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white text-sm transition-colors">
                    <ArrowLeft size={18} /> Back to CICOP
                </Link>
            </div>
        );
    }

    const rows = [
        { label: 'Assessment #', value: assessment.assessment_no },
        { label: 'Claim number', value: assessment.claim_number },
        { label: 'Status', value: assessment.status },
        { label: 'Date received', value: assessment.date_received },
        { label: 'Client', value: assessment.client },
        { label: 'Insurer', value: assessment.insurer },
        { label: 'Vehicle make', value: assessment.vehicle_make },
        { label: 'Vehicle model', value: assessment.vehicle_model },
        { label: 'Rego', value: assessment.rego },
        { label: 'VIN', value: assessment.vin },
        {
            label: 'Repairer quote',
            value:
                assessment.repairer_quote != null
                    ? `$${Number(assessment.repairer_quote).toLocaleString()}`
                    : null,
        },
        {
            label: 'Crashify assessed',
            value:
                assessment.crashify_assessed != null
                    ? `$${Number(
                          assessment.crashify_assessed
                      ).toLocaleString()}`
                    : null,
        },
        {
            label: 'Savings',
            value:
                assessment.savings != null
                    ? `$${Number(assessment.savings).toLocaleString()}`
                    : null,
        },
    ].filter(r => r.value != null && r.value !== '');

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans antialiased p-6">
            <div className="max-w-2xl mx-auto">
                <Link href="/pages/cicop" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white text-sm mb-6 transition-colors">
                    <ArrowLeft size={18} /> Back to CICOP
                </Link>
                <h1 className="text-xl font-semibold text-white mb-1 tabular-nums">
                    Assessment #{String(assessment.assessment_no)}
                </h1>
                <p className="text-neutral-500 text-sm mb-8">
                    {assessment.claim_number != null ? `Claim ${String(assessment.claim_number)}` : ''}
                    {assessment.status != null ? ` · ${String(assessment.status)}` : ''}
                </p>
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-0">
                    {rows.map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-baseline gap-4 py-3 border-b border-neutral-800 last:border-0 last:pb-0">
                            <span className="text-neutral-500 text-sm">{label}</span>
                            <span className="text-white font-medium text-right tabular-nums">{String(value)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
