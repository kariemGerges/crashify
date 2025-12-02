// =============================================
// FILE: app/components/Admin/SupplementaryRequestsTab.tsx
// Supplementary Requests Tab (REQ-147)
// =============================================

'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, FileText, CheckCircle, XCircle, Clock, Upload } from 'lucide-react';
import { useToast } from '../Toast';

interface SupplementaryRequest {
    id: string;
    original_assessment_id: string;
    supplementary_number: number;
    amount: number;
    status: string;
    ai_recommendation: string | null;
    ai_confidence: number | null;
    created_at: string;
}

export const SupplementaryRequestsTab: React.FC = () => {
    const toast = useToast();
    const [requests, setRequests] = useState<SupplementaryRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const response = await fetch('/api/supplementary', {
                credentials: 'include',
            });
            if (!response.ok) throw new Error('Failed to fetch requests');
            const data = await response.json();
            setRequests(data.data || []);
        } catch (error) {
            toast.showError('Failed to load supplementary requests');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Supplementary Requests</h2>
                <p className="text-gray-400 mb-6">
                    Manage supplementary quote requests linked to original assessments.
                </p>

                {requests.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">No supplementary requests found</div>
                ) : (
                    <div className="space-y-3">
                        {requests.map((request) => (
                            <div
                                key={request.id}
                                className="bg-black/30 border border-gray-800 rounded-lg p-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <FileText className="w-8 h-8 text-amber-500" />
                                    <div>
                                        <p className="text-white font-semibold">
                                            Supplementary #{request.supplementary_number}
                                        </p>
                                        <p className="text-gray-400 text-sm">
                                            Assessment: {request.original_assessment_id.substring(0, 8)}...
                                        </p>
                                        <p className="text-gray-400 text-sm">Amount: ${request.amount.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {request.ai_recommendation && (
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400">AI Confidence</p>
                                            <p className="text-sm font-semibold text-amber-500">
                                                {request.ai_confidence?.toFixed(0) || 0}%
                                            </p>
                                        </div>
                                    )}
                                    <span
                                        className={`px-3 py-1 rounded text-sm ${
                                            request.status === 'approved'
                                                ? 'bg-green-500/20 text-green-400'
                                                : request.status === 'rejected'
                                                ? 'bg-red-500/20 text-red-400'
                                                : 'bg-yellow-500/20 text-yellow-400'
                                        }`}
                                    >
                                        {request.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

