import React, { useState, useEffect } from 'react';
import { FileText, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { AssessmentDetail } from './AssessmentDetail';

interface Claim {
    id: string;
    company_name: string;
    your_name: string;
    your_email: string;
    assessment_type: string;
    make: string;
    model: string;
    registration: string;
    status: 'pending' | 'processing' | 'completed';
    created_at: string;
}

interface Pagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

interface ClaimsResponse {
    data: Claim[];
    pagination: Pagination;
}

export const ClaimsTab: React.FC = () => {
    const [claims, setClaims] = useState<Claim[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
    });

    const loadClaims = async (page: number = 1, pageSize: number = 20) => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(
                `/api/assessments?page=${page}&pageSize=${pageSize}`
            );
            const result: ClaimsResponse = await response.json();

            if (result.data) {
                setClaims(result.data);
                setPagination(result.pagination);
            } else {
                setError('Failed to load claims');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load claims');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClaims(1);
    }, []);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            loadClaims(newPage, pagination.pageSize);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500/20 text-green-400 border-green-500/50';
            case 'processing':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
            case 'pending':
                return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Recent Claims</h3>
                {pagination.total > 0 && (
                    <p className="text-gray-400 text-sm">
                        Showing {((pagination.page - 1) * pagination.pageSize) + 1}-
                        {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                        {pagination.total}
                    </p>
                )}
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
            ) : claims.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No claims found</p>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {claims.map(claim => (
                            <div
                                key={claim.id}
                                onClick={() => setSelectedAssessmentId(claim.id)}
                                className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-gray-800 hover:border-amber-500/50 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <p className="text-white font-medium">
                                                {claim.company_name}
                                            </p>
                                            <span className="text-gray-500 text-xs">
                                                #{claim.id.slice(0, 8)}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                                            <span>{claim.your_name}</span>
                                            <span>•</span>
                                            <span>{claim.make} {claim.model}</span>
                                            {claim.registration && (
                                                <>
                                                    <span>•</span>
                                                    <span>{claim.registration}</span>
                                                </>
                                            )}
                                            <span>•</span>
                                            <span>{claim.assessment_type}</span>
                                        </div>
                                        <p className="text-gray-500 text-xs mt-1">
                                            {formatDate(claim.created_at)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 ml-4">
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                            claim.status
                                        )}`}
                                    >
                                        {claim.status.charAt(0).toUpperCase() +
                                            claim.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-800">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </button>
                            <div className="text-gray-400 text-sm">
                                Page {pagination.page} of {pagination.totalPages}
                            </div>
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </>
            )}

            {selectedAssessmentId && (
                <AssessmentDetail
                    assessmentId={selectedAssessmentId}
                    onClose={() => setSelectedAssessmentId(null)}
                    onUpdate={() => {
                        loadClaims(pagination.page, pagination.pageSize);
                    }}
                />
            )}
        </div>
    );
};

