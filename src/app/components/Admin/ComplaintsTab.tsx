// =============================================
// FILE: app/components/Admin/ComplaintsTab.tsx
// Complaints Dashboard Component (REQ-65)
// =============================================

'use client';

import React, { useState, useEffect } from 'react';
import {
    AlertCircle,
    CheckCircle,
    Clock,
    MessageSquare,
    FileText,
    Loader2,
    Search,
    Filter,
    X,
    Send,
    Edit,
    Eye,
} from 'lucide-react';
import { useToast } from '../Toast';

interface Complaint {
    id: string;
    complaint_number: string;
    complainant_name: string;
    complainant_email: string;
    category: string;
    priority: string;
    status: string;
    description: string;
    created_at: string;
    updated_at: string;
    sla_deadline: string | null;
    sla_breached: boolean;
    assessment_id: string | null;
}

interface ComplaintStats {
    total: number;
    active: number;
    overdue: number;
    averageResolutionTime: number | null;
    complaintRate: number | null;
}

export const ComplaintsTab: React.FC = () => {
    const toast = useToast();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [stats, setStats] = useState<ComplaintStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] =
        useState<Complaint | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [message, setMessage] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [internalNotes, setInternalNotes] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        category: '',
        search: '',
    });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchComplaints();
        fetchStats();
    }, [page, filters]);

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: '20',
            });

            if (filters.status) params.append('status', filters.status);
            if (filters.priority) params.append('priority', filters.priority);
            if (filters.category) params.append('category', filters.category);

            const response = await fetch(`/api/complaints?${params}`);
            if (!response.ok) throw new Error('Failed to fetch complaints');

            const data = await response.json();
            setComplaints(data.data || []);
            setTotalPages(data.pagination?.totalPages || 1);
        } catch (error) {
            toast.showError('Failed to load complaints');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/complaints/stats');
            if (!response.ok) throw new Error('Failed to fetch stats');

            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch complaint stats:', error);
        }
    };

    const fetchComplaintDetail = async (id: string) => {
        try {
            const response = await fetch(`/api/complaints/${id}`);
            if (!response.ok)
                throw new Error('Failed to fetch complaint details');

            const data = await response.json();
            setSelectedComplaint(data.complaint);
            setInternalNotes(data.complaint.internal_notes || '');
            setShowDetailModal(true);
        } catch (error) {
            toast.showError('Failed to load complaint details');
            console.error(error);
        }
    };

    const updateComplaintStatus = async (id: string, status: string) => {
        try {
            const csrfResponse = await fetch('/api/csrf-token', {
                credentials: 'include',
            });
            const csrfData = await csrfResponse.json();

            const response = await fetch(`/api/complaints/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfData.token,
                },
                credentials: 'include',
                body: JSON.stringify({ status }),
            });

            if (!response.ok) throw new Error('Failed to update status');

            toast.showSuccess('Status updated successfully');
            fetchComplaints();
            if (selectedComplaint?.id === id) {
                fetchComplaintDetail(id);
            }
        } catch (error) {
            toast.showError('Failed to update status');
            console.error(error);
        }
    };

    const saveInternalNotes = async () => {
        if (!selectedComplaint) return;

        try {
            const csrfResponse = await fetch('/api/csrf-token', {
                credentials: 'include',
            });
            const csrfData = await csrfResponse.json();

            const response = await fetch(
                `/api/complaints/${selectedComplaint.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-csrf-token': csrfData.token,
                    },
                    credentials: 'include',
                    body: JSON.stringify({ internal_notes: internalNotes }),
                }
            );

            if (!response.ok) throw new Error('Failed to save notes');

            toast.showSuccess('Internal notes saved');
        } catch (error) {
            toast.showError('Failed to save notes');
            console.error(error);
        }
    };

    const sendMessage = async () => {
        if (!selectedComplaint || !message.trim()) return;

        try {
            const csrfResponse = await fetch('/api/csrf-token', {
                credentials: 'include',
            });
            const csrfData = await csrfResponse.json();

            const response = await fetch(
                `/api/complaints/${selectedComplaint.id}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-csrf-token': csrfData.token,
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        message: message.trim(),
                        isInternal: isInternal,
                    }),
                }
            );

            if (!response.ok) throw new Error('Failed to send message');

            toast.showSuccess('Message sent successfully');
            setMessage('');
            setIsInternal(false);
            setShowMessageModal(false);
            fetchComplaintDetail(selectedComplaint.id);
        } catch (error) {
            toast.showError('Failed to send message');
            console.error(error);
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

    const getPriorityColor = (priority: string): string => {
        switch (priority) {
            case 'critical':
                return 'text-red-500';
            case 'high':
                return 'text-orange-500';
            case 'medium':
                return 'text-yellow-500';
            case 'low':
                return 'text-green-500';
            default:
                return 'text-gray-500';
        }
    };

    const clearFilters = () => {
        setFilters({
            status: '',
            priority: '',
            category: '',
            search: '',
        });
        setPage(1);
    };

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-4">
                        <p className="text-sm text-gray-400 mb-1">
                            Total Complaints
                        </p>
                        <p className="text-2xl font-bold text-white">
                            {stats.total}
                        </p>
                    </div>
                    <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-4">
                        <p className="text-sm text-gray-400 mb-1">Active</p>
                        <p className="text-2xl font-bold text-yellow-500">
                            {stats.active}
                        </p>
                    </div>
                    <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-4">
                        <p className="text-sm text-gray-400 mb-1">Overdue</p>
                        <p className="text-2xl font-bold text-red-500">
                            {stats.overdue}
                        </p>
                    </div>
                    <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-4">
                        <p className="text-sm text-gray-400 mb-1">
                            Avg Resolution
                        </p>
                        <p className="text-2xl font-bold text-white">
                            {stats.averageResolutionTime
                                ? `${Math.round(
                                      stats.averageResolutionTime
                                  )} days`
                                : 'N/A'}
                        </p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search complaints..."
                                value={filters.search}
                                onChange={e =>
                                    setFilters({
                                        ...filters,
                                        search: e.target.value,
                                    })
                                }
                                className="w-full bg-black/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                            />
                        </div>
                    </div>
                    <select
                        value={filters.status}
                        onChange={e =>
                            setFilters({ ...filters, status: e.target.value })
                        }
                        className="bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                    >
                        <option value="">All Status</option>
                        <option value="new">New</option>
                        <option value="under_investigation">
                            Under Investigation
                        </option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                    <select
                        value={filters.priority}
                        onChange={e =>
                            setFilters({ ...filters, priority: e.target.value })
                        }
                        className="bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                    >
                        <option value="">All Priorities</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                        Clear
                    </button>
                </div>
            </div>

            {/* Complaints List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
            ) : complaints.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    No complaints found
                </div>
            ) : (
                <div className="space-y-2">
                    {complaints.map(complaint => (
                        <div
                            key={complaint.id}
                            className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-4 hover:border-amber-500/50 transition-colors cursor-pointer"
                            onClick={() => fetchComplaintDetail(complaint.id)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-semibold text-white">
                                            {complaint.complaint_number}
                                        </span>
                                        <span
                                            className={`px-2 py-1 rounded text-xs border ${getStatusColor(
                                                complaint.status
                                            )}`}
                                        >
                                            {complaint.status
                                                .replace(/_/g, ' ')
                                                .toUpperCase()}
                                        </span>
                                        <span
                                            className={`text-sm font-medium ${getPriorityColor(
                                                complaint.priority
                                            )}`}
                                        >
                                            {complaint.priority.toUpperCase()}
                                        </span>
                                        {complaint.sla_breached && (
                                            <span className="text-xs text-red-500 font-semibold">
                                                SLA BREACHED
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400 mb-1">
                                        {complaint.complainant_name}
                                    </p>
                                    <p className="text-sm text-gray-500 line-clamp-2">
                                        {complaint.description}
                                    </p>
                                </div>
                                <div className="ml-4 text-right text-xs text-gray-500">
                                    <p>
                                        {new Date(
                                            complaint.created_at
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-amber-500/50 transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-gray-400">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() =>
                            setPage(p => Math.min(totalPages, p + 1))
                        }
                        disabled={page === totalPages}
                        className="px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-amber-500/50 transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedComplaint && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-900 border border-amber-500/20 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-white">
                                    {selectedComplaint.complaint_number}
                                </h2>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex items-center gap-4">
                                <span
                                    className={`px-3 py-1 rounded text-sm border ${getStatusColor(
                                        selectedComplaint.status
                                    )}`}
                                >
                                    {selectedComplaint.status
                                        .replace(/_/g, ' ')
                                        .toUpperCase()}
                                </span>
                                <span
                                    className={`text-sm font-medium ${getPriorityColor(
                                        selectedComplaint.priority
                                    )}`}
                                >
                                    {selectedComplaint.priority.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Complaint Details */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">
                                    Complaint Details
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-gray-400">
                                            Complainant:
                                        </span>{' '}
                                        <span className="text-white">
                                            {selectedComplaint.complainant_name}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">
                                            Email:
                                        </span>{' '}
                                        <span className="text-white">
                                            {
                                                selectedComplaint.complainant_email
                                            }
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">
                                            Category:
                                        </span>{' '}
                                        <span className="text-white">
                                            {selectedComplaint.category
                                                .replace(/_/g, ' ')
                                                .toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">
                                            Description:
                                        </span>
                                        <p className="text-white mt-1 whitespace-pre-wrap">
                                            {selectedComplaint.description}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Status Update */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">
                                    Update Status
                                </h3>
                                <div className="flex gap-2">
                                    {[
                                        'new',
                                        'under_investigation',
                                        'resolved',
                                        'closed',
                                    ].map(status => (
                                        <button
                                            key={status}
                                            onClick={() =>
                                                updateComplaintStatus(
                                                    selectedComplaint.id,
                                                    status
                                                )
                                            }
                                            className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                                                selectedComplaint.status ===
                                                status
                                                    ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                                                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-amber-500/50'
                                            }`}
                                        >
                                            {status
                                                .replace(/_/g, ' ')
                                                .toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Internal Notes */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">
                                    Internal Notes
                                </h3>
                                <textarea
                                    value={internalNotes}
                                    onChange={e =>
                                        setInternalNotes(e.target.value)
                                    }
                                    onBlur={saveInternalNotes}
                                    rows={4}
                                    className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
                                    placeholder="Add internal notes..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setShowMessageModal(true);
                                        setIsInternal(false);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/50 text-amber-500 rounded-lg transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                    Send Message
                                </button>
                                <button
                                    onClick={() => {
                                        setShowMessageModal(true);
                                        setIsInternal(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                    Add Internal Note
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Message Modal */}
            {showMessageModal && selectedComplaint && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-900 border border-amber-500/20 rounded-2xl shadow-2xl max-w-2xl w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">
                                {isInternal
                                    ? 'Add Internal Note'
                                    : 'Send Message'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowMessageModal(false);
                                    setMessage('');
                                }}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            rows={6}
                            className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none mb-4"
                            placeholder={
                                isInternal
                                    ? 'Internal note (not visible to complainant)...'
                                    : 'Message to complainant...'
                            }
                        />
                        <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowMessageModal(false);
                                    setMessage('');
                                }}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={sendMessage}
                                disabled={!message.trim()}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                {isInternal ? 'Save Note' : 'Send Message'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
