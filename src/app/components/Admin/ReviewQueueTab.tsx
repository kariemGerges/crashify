// =============================================
// FILE: app/components/Admin/ReviewQueueTab.tsx
// Manual Review Queue Tab (REQ-107-114)
// =============================================

'use client';

import React, { useState, useEffect } from 'react';
import {
    Loader2,
    AlertTriangle,
    CheckCircle,
    XCircle,
    MessageSquare,
    User,
    Clock,
} from 'lucide-react';
import { useToast } from '../Toast';

interface ReviewQueueItem {
    id: string;
    assessment_id: string | null;
    quote_request_id: string | null;
    spam_score: number;
    recaptcha_score: number | null;
    review_reason: string;
    status: string;
    admin_notes: string | null;
    created_at: string;
}

export const ReviewQueueTab: React.FC = () => {
    const toast = useToast();
    const [items, setItems] = useState<ReviewQueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<ReviewQueueItem | null>(null);
    const [action, setAction] = useState<'approve' | 'reject' | 'request_info' | null>(null);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchQueue();
    }, []);

    const fetchQueue = async () => {
        try {
            const response = await fetch('/api/review-queue?status=pending', {
                credentials: 'include',
            });
            if (!response.ok) throw new Error('Failed to fetch queue');
            const data = await response.json();
            setItems(data.data || []);
        } catch (error) {
            toast.showError('Failed to load review queue');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (itemId: string, actionType: 'approve' | 'reject' | 'request_info') => {
        try {
            const csrfResponse = await fetch('/api/csrf-token', { credentials: 'include' });
            const csrfData = await csrfResponse.json();

            const response = await fetch(`/api/review-queue/${itemId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfData.token,
                },
                credentials: 'include',
                body: JSON.stringify({
                    action: actionType,
                    adminNotes: notes,
                }),
            });

            if (!response.ok) throw new Error('Action failed');
            toast.showSuccess(`Item ${actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'marked for more info'}`);
            setAction(null);
            setSelectedItem(null);
            setNotes('');
            fetchQueue();
        } catch (error) {
            toast.showError('Failed to process action');
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
                <h2 className="text-2xl font-bold text-white mb-4">Manual Review Queue</h2>
                <p className="text-gray-400 mb-6">
                    Review suspicious submissions flagged by spam detection or low reCAPTCHA scores.
                </p>

                {items.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">No items in review queue</div>
                ) : (
                    <div className="space-y-3">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="bg-black/30 border border-gray-800 rounded-lg p-4"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start gap-4">
                                        <AlertTriangle className="w-6 h-6 text-yellow-500 mt-1" />
                                        <div>
                                            <p className="text-white font-semibold mb-1">{item.review_reason}</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                                <span>Spam Score: {item.spam_score}/100</span>
                                                {item.recaptcha_score && (
                                                    <span>reCAPTCHA: {(item.recaptcha_score * 100).toFixed(0)}%</span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => {
                                            setSelectedItem(item);
                                            setAction('approve');
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg text-sm transition-colors"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedItem(item);
                                            setAction('reject');
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg text-sm transition-colors"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedItem(item);
                                            setAction('request_info');
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg text-sm transition-colors"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        Request Info
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Action Modal */}
            {action && selectedItem && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-900 border border-amber-500/20 rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-white mb-4">
                            {action === 'approve' ? 'Approve Item' : action === 'reject' ? 'Reject Item' : 'Request More Information'}
                        </h3>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes (optional)..."
                            rows={4}
                            className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none mb-4"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setAction(null);
                                    setSelectedItem(null);
                                    setNotes('');
                                }}
                                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleAction(selectedItem.id, action)}
                                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                                    action === 'approve'
                                        ? 'bg-green-500 hover:bg-green-600 text-white'
                                        : action === 'reject'
                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

