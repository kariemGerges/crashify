import React, { useState, useEffect } from 'react';
import {
    Loader2,
    AlertCircle,
    CheckCircle,
    XCircle,
    DollarSign,
    Mail,
    Clock,
    ChevronLeft,
    ChevronRight,
    Eye,
} from 'lucide-react';

interface QuoteRequest {
    id: string;
    name: string;
    email: string;
    phone: string;
    vehicle: string;
    description: string;
    photo_count: number;
    status: 'pending_review' | 'approved' | 'rejected' | 'payment_received' | 'expired';
    spam_score: number;
    recommended_service: string | null;
    recommended_price: number | null;
    payment_id: string | null;
    payment_amount: number | null;
    paid_at: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    rejection_reason: string | null;
    created_at: string;
}

interface Pagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

interface QuoteRequestsResponse {
    data: QuoteRequest[];
    pagination: Pagination;
}

export const QuoteRequestsTab: React.FC = () => {
    const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approveForm, setApproveForm] = useState({
        recommendedService: '',
        recommendedPrice: '',
    });
    const [approving, setApproving] = useState(false);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
    });
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const loadQuoteRequests = async (page: number = 1, status?: string) => {
        setLoading(true);
        setError('');

        try {
            const url = status && status !== 'all'
                ? `/api/quotes?page=${page}&status=${status}`
                : `/api/quotes?page=${page}`;
            
            const response = await fetch(url);
            const result: QuoteRequestsResponse = await response.json();

            if (result.data) {
                setQuoteRequests(result.data);
                setPagination(result.pagination);
            } else {
                setError('Failed to load quote requests');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load quote requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQuoteRequests(1, statusFilter);
    }, [statusFilter]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            loadQuoteRequests(newPage, statusFilter);
        }
    };

    const handleApprove = (request: QuoteRequest) => {
        setSelectedRequest(request);
        setApproveForm({
            recommendedService: '',
            recommendedPrice: '',
        });
        setShowApproveModal(true);
    };

    const handleApproveSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRequest) return;

        setApproving(true);
        try {
            const response = await fetch(`/api/quotes/${selectedRequest.id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recommendedService: approveForm.recommendedService,
                    recommendedPrice: parseFloat(approveForm.recommendedPrice),
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to approve quote request');
            }

            setShowApproveModal(false);
            setSelectedRequest(null);
            loadQuoteRequests(pagination.page, statusFilter);
            alert('Quote request approved! Payment email sent to customer.');
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Failed to approve quote request');
        } finally {
            setApproving(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'payment_received':
                return 'bg-green-500/20 text-green-400 border-green-500/50';
            case 'approved':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
            case 'rejected':
                return 'bg-red-500/20 text-red-400 border-red-500/50';
            case 'expired':
                return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
            case 'pending_review':
                return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-AU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount: number | null) => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD',
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex items-center gap-4">
                <label className="text-gray-400 text-sm">Filter by status:</label>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                >
                    <option value="all">All</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="payment_received">Payment Received</option>
                    <option value="rejected">Rejected</option>
                    <option value="expired">Expired</option>
                </select>
            </div>

            {/* Error message */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Loading state */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
            ) : quoteRequests.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-400">No quote requests found</p>
                </div>
            ) : (
                <>
                    {/* Quote Requests Table */}
                    <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-800/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Vehicle
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Spam Score
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Price
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {quoteRequests.map((request) => (
                                        <tr
                                            key={request.id}
                                            className="hover:bg-gray-800/30 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-white font-medium">
                                                        {request.name}
                                                    </div>
                                                    <div className="text-gray-400 text-sm">
                                                        {request.email}
                                                    </div>
                                                    <div className="text-gray-500 text-xs">
                                                        {request.phone}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-white">{request.vehicle}</div>
                                                <div className="text-gray-400 text-xs">
                                                    {request.photo_count} photos
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                                        request.status
                                                    )}`}
                                                >
                                                    {request.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`text-sm ${
                                                        request.spam_score >= 70
                                                            ? 'text-red-400'
                                                            : request.spam_score >= 30
                                                              ? 'text-amber-400'
                                                              : 'text-green-400'
                                                    }`}
                                                >
                                                    {request.spam_score}/100
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {request.recommended_price
                                                    ? formatCurrency(request.recommended_price)
                                                    : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                                                {formatDate(request.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedRequest(request)}
                                                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                                                        title="View details"
                                                    >
                                                        <Eye className="w-4 h-4 text-gray-300" />
                                                    </button>
                                                    {request.status === 'pending_review' && (
                                                        <button
                                                            onClick={() => handleApprove(request)}
                                                            className="p-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg transition-colors"
                                                            title="Approve & send payment link"
                                                        >
                                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <div className="text-gray-400 text-sm">
                                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5 text-gray-300" />
                                </button>
                                <button
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === pagination.totalPages}
                                    className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5 text-gray-300" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Approve Modal */}
            {showApproveModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-amber-500/20 rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-white mb-4">
                            Approve Quote Request
                        </h3>
                        <form onSubmit={handleApproveSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Recommended Service
                                </label>
                                <input
                                    type="text"
                                    value={approveForm.recommendedService}
                                    onChange={(e) =>
                                        setApproveForm({
                                            ...approveForm,
                                            recommendedService: e.target.value,
                                        })
                                    }
                                    required
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                                    placeholder="e.g., Desktop Assessment"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Recommended Price (AUD)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={approveForm.recommendedPrice}
                                    onChange={(e) =>
                                        setApproveForm({
                                            ...approveForm,
                                            recommendedPrice: e.target.value,
                                        })
                                    }
                                    required
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                                    placeholder="175.00"
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={approving}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-red-600 text-white rounded-lg hover:from-amber-600 hover:to-red-700 transition-all font-semibold disabled:opacity-50"
                                >
                                    {approving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                                            Approving...
                                        </>
                                    ) : (
                                        'Approve & Send Payment Link'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowApproveModal(false);
                                        setSelectedRequest(null);
                                    }}
                                    className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {selectedRequest && !showApproveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-amber-500/20 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">Quote Request Details</h3>
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <XCircle className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-400 mb-1">Customer</h4>
                                <p className="text-white">{selectedRequest.name}</p>
                                <p className="text-gray-400 text-sm">{selectedRequest.email}</p>
                                <p className="text-gray-400 text-sm">{selectedRequest.phone}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-400 mb-1">Vehicle</h4>
                                <p className="text-white">{selectedRequest.vehicle}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-400 mb-1">Description</h4>
                                <p className="text-white">{selectedRequest.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-400 mb-1">Status</h4>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                            selectedRequest.status
                                        )}`}
                                    >
                                        {selectedRequest.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-400 mb-1">Spam Score</h4>
                                    <p className="text-white">{selectedRequest.spam_score}/100</p>
                                </div>
                                {selectedRequest.recommended_price && (
                                    <>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-400 mb-1">Price</h4>
                                            <p className="text-white">
                                                {formatCurrency(selectedRequest.recommended_price)}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-400 mb-1">Service</h4>
                                            <p className="text-white">
                                                {selectedRequest.recommended_service || '-'}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                            {selectedRequest.paid_at && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-400 mb-1">Payment</h4>
                                    <p className="text-white">
                                        Paid: {formatCurrency(selectedRequest.payment_amount)} on{' '}
                                        {formatDate(selectedRequest.paid_at)}
                                    </p>
                                </div>
                            )}
                            <div>
                                <h4 className="text-sm font-medium text-gray-400 mb-1">Submitted</h4>
                                <p className="text-white">{formatDate(selectedRequest.created_at)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

