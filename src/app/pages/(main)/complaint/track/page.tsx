// =============================================
// FILE: app/pages/(main)/complaint/track/page.tsx
// Public Complaint Tracking Page (REQ-76)
// =============================================

'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Loader2,
    MessageSquare,
    FileText,
    Calendar,
} from 'lucide-react';

interface Complaint {
    id: string;
    complaint_number: string;
    status: string;
    category: string;
    priority: string;
    description: string;
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
    closed_at: string | null;
    sla_deadline: string | null;
    sla_breached: boolean;
}

interface ComplaintMessage {
    id: string;
    message: string;
    sender_type: string;
    is_internal: boolean;
    created_at: string;
}

export default function ComplaintTrackPage() {
    const searchParams = useSearchParams();
    const complaintNumber = searchParams.get('number') || '';
    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [messages, setMessages] = useState<ComplaintMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (complaintNumber) {
            fetchComplaint();
        } else {
            setError('Complaint number is required');
            setLoading(false);
        }
    }, [complaintNumber]);

    const fetchComplaint = async () => {
        try {
            // First, find complaint by number
            const searchResponse = await fetch(
                `/api/complaints/search?number=${encodeURIComponent(complaintNumber)}`
            );

            if (!searchResponse.ok) {
                throw new Error('Complaint not found');
            }

            const searchData = await searchResponse.json();
            if (!searchData.complaint) {
                throw new Error('Complaint not found');
            }

            // Get full complaint details
            const detailResponse = await fetch(`/api/complaints/${searchData.complaint.id}`);
            if (!detailResponse.ok) {
                throw new Error('Failed to load complaint details');
            }

            const detailData = await detailResponse.json();
            setComplaint(detailData.complaint);
            setMessages(detailData.messages || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load complaint');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'new':
                return 'text-blue-400 bg-blue-500/10 border-blue-500/50';
            case 'under_investigation':
                return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/50';
            case 'resolved':
                return 'text-green-400 bg-green-500/10 border-green-500/50';
            case 'closed':
                return 'text-gray-400 bg-gray-500/10 border-gray-500/50';
            default:
                return 'text-gray-400 bg-gray-500/10 border-gray-500/50';
        }
    };

    const getStatusLabel = (status: string): string => {
        switch (status) {
            case 'new':
                return 'New';
            case 'under_investigation':
                return 'Under Investigation';
            case 'resolved':
                return 'Resolved';
            case 'closed':
                return 'Closed';
            default:
                return status;
        }
    };

    const getPriorityColor = (priority: string): string => {
        switch (priority) {
            case 'critical':
                return 'text-red-400';
            case 'high':
                return 'text-orange-400';
            case 'medium':
                return 'text-yellow-400';
            case 'low':
                return 'text-green-400';
            default:
                return 'text-gray-400';
        }
    };

    const formatDate = (dateString: string | null): string => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-AU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading complaint...</p>
                </div>
            </div>
        );
    }

    if (error || !complaint) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-gray-900 border border-red-500/20 rounded-2xl shadow-2xl p-8 text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Complaint Not Found</h1>
                    <p className="text-gray-400 mb-4">
                        {error || 'The complaint you are looking for could not be found.'}
                    </p>
                    <a
                        href="/complaint"
                        className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                    >
                        Submit a Complaint
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-gray-900 border border-amber-500/20 rounded-2xl shadow-2xl p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Complaint Tracking</h1>
                        <p className="text-gray-400">Complaint Number: {complaint.complaint_number}</p>
                    </div>

                    {/* Status Card */}
                    <div className="mb-6 p-6 bg-black/50 border border-amber-500/20 rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm text-gray-400 mb-1">Status</p>
                                <span
                                    className={`inline-block px-4 py-2 rounded-lg border ${getStatusColor(
                                        complaint.status
                                    )}`}
                                >
                                    {getStatusLabel(complaint.status)}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-400 mb-1">Priority</p>
                                <p className={`text-lg font-semibold ${getPriorityColor(complaint.priority)}`}>
                                    {complaint.priority.toUpperCase()}
                                </p>
                            </div>
                        </div>

                        {complaint.sla_deadline && (
                            <div className="mt-4 pt-4 border-t border-gray-700">
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-400">SLA Deadline:</span>
                                    <span
                                        className={
                                            complaint.sla_breached
                                                ? 'text-red-400 font-semibold'
                                                : 'text-gray-300'
                                        }
                                    >
                                        {formatDate(complaint.sla_deadline)}
                                    </span>
                                    {complaint.sla_breached && (
                                        <span className="text-red-500 text-xs">(BREACHED)</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Complaint Details */}
                    <div className="mb-6 space-y-4">
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Category</p>
                            <p className="text-white">{complaint.category.replace(/_/g, ' ').toUpperCase()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Description</p>
                            <p className="text-white whitespace-pre-wrap">{complaint.description}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-400 mb-1">Created</p>
                                <p className="text-white">{formatDate(complaint.created_at)}</p>
                            </div>
                            {complaint.resolved_at && (
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Resolved</p>
                                    <p className="text-white">{formatDate(complaint.resolved_at)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Messages */}
                    {messages.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-amber-500" />
                                Updates
                            </h2>
                            <div className="space-y-4">
                                {messages
                                    .filter((msg) => !msg.is_internal)
                                    .map((message) => (
                                        <div
                                            key={message.id}
                                            className="bg-black/50 border border-gray-700 rounded-lg p-4"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-gray-400">
                                                    {message.sender_type === 'admin'
                                                        ? 'Crashify Team'
                                                        : 'You'}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {formatDate(message.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-white whitespace-pre-wrap">{message.message}</p>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-8 pt-6 border-t border-gray-700">
                        <a
                            href="/complaint"
                            className="inline-block text-amber-500 hover:text-amber-400 transition-colors"
                        >
                            ← Submit Another Complaint
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

