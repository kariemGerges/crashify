// =============================================
// FILE: app/components/Admin/ComplaintsTab.tsx
// Complaints Dashboard Component - Redesigned
// =============================================

'use client';

import React, { useState, useEffect } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import {
    AlertCircle,
    CheckCircle,
    Clock,
    MessageSquare,
    FileText,
    Loader2,
    Search,
    X,
    Send,
    Edit,
    TrendingUp,
    ThumbsUp,
    ThumbsDown,
    Award,
    BarChart3,
    Activity,
    RefreshCw,
    Mail,
} from 'lucide-react';
import { useToast } from '../Toast';
import { format } from 'date-fns';

// Complaint interface
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

// Complaint attachment interface
interface ComplaintAttachment {
    id: string;
    file_name: string;
    file_size: number;
    file_type: string;
    signed_url: string | null;
    created_at: string;
}

// Complaint stats interface
interface ComplaintStats {
    total: number;
    active: number;
    overdue: number;
    averageResolutionTime: number | null;
    complaintRate: number | null;
}

// Complaints analytics interface
interface ComplaintsAnalytics {
    totalThisMonth: number;
    total: number;
    positive: number;
    negative: number;
    satisfactionScore: number;
    resolutionRate: number;
    averageResolutionTime: number;
    overdue: number;
    statusBreakdown: {
        new: number;
        under_investigation: number;
        resolved: number;
        closed: number;
    };
    monthlyTrend: Array<{ month: string; count: number }>;
    resolutionTrend: Array<{ month: string; resolved: number; total: number }>;
    topCategories: Array<{ name: string; count: number }>;
    priorityBreakdown: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    activityFeed: Array<{
        id: string;
        type: string;
        description: string;
        status: string;
        timestamp: string;
    }>;
}

// Colors for the charts
const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#0ea5e9'];
const SENTIMENT_COLORS = {
    positive: '#10b981',
    negative: '#ef4444',
};

// Complaints tab component props
interface ComplaintsTabProps {
    cachedAnalytics?: ComplaintsAnalytics | null;
    isLoadingAnalytics?: boolean;
    lastRefreshed?: Date | null;
    onRefreshAnalytics?: (forceRefresh: boolean) => void;
}

// Complaints tab component
export const ComplaintsTab: React.FC<ComplaintsTabProps> = ({
    cachedAnalytics = null,
    isLoadingAnalytics = false,
    lastRefreshed: propLastRefreshed = null,
    onRefreshAnalytics,
}) => {
    const toast = useToast();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    // State for the stats
    const [stats, setStats] = useState<ComplaintStats | null>(null);
    const [analytics, setAnalytics] = useState<ComplaintsAnalytics | null>(
        cachedAnalytics
    );
    // State for the loading of the complaints
    const [loading, setLoading] = useState(true);
    // State for the loading of the analytics
    const [loadingAnalytics, setLoadingAnalytics] = useState(!cachedAnalytics);
    // State for the selected complaint
    const [selectedComplaint, setSelectedComplaint] =
        useState<Complaint | null>(null);
    // State for the selected attachments
    const [selectedAttachments, setSelectedAttachments] = useState<
        ComplaintAttachment[]
    >([]);
    // State for the show detail modal
    const [showDetailModal, setShowDetailModal] = useState(false);
    // State for the show message modal
    const [showMessageModal, setShowMessageModal] = useState(false);
    // State for the message
    const [message, setMessage] = useState('');
    // State for the internal notes
    const [isInternal, setIsInternal] = useState(false);
    const [internalNotes, setInternalNotes] = useState('');
    // State for the filters
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        category: '',
        search: '',
    });
    // State for the page
    const [page, setPage] = useState(1);
    // State for the total pages of the complaints
    const [totalPages, setTotalPages] = useState(1);

    // Email processing state
    const [processingEmails, setProcessingEmails] = useState(false);
    const [emailProcessResult, setEmailProcessResult] = useState<{
        processed: number;
        created: number;
        errors: Array<{ emailId: string; error: string }>;
    } | null>(null);

    // Update analytics when cached data changes
    useEffect(() => {
        if (cachedAnalytics) {
            setAnalytics(cachedAnalytics);
            setLoadingAnalytics(false);
        }
    }, [cachedAnalytics]);

    // Update loading state when prop changes
    useEffect(() => {
        setLoadingAnalytics(isLoadingAnalytics);
    }, [isLoadingAnalytics]);

    // Fetch complaints, stats, and analytics when the page or filters change
    useEffect(() => {
        fetchComplaints();
        fetchStats();
        // Only fetch analytics if we don't have cached data and onRefreshAnalytics is provided
        if (!cachedAnalytics && onRefreshAnalytics) {
            onRefreshAnalytics(false);
        } else if (!cachedAnalytics) {
            fetchAnalytics();
        }
    }, [page, filters]);

    // Fetch complaints
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

    // Fetch stats
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

    // Fetch analytics
    const fetchAnalytics = async (forceRefresh: boolean = false) => {
        // If onRefreshAnalytics callback is provided, use it instead of fetching directly
        if (onRefreshAnalytics) {
            onRefreshAnalytics(forceRefresh);
            return;
        }

        // Fallback to direct fetch if no callback provided (for backward compatibility)
        setLoadingAnalytics(true);
        try {
            const response = await fetch('/api/analytics/complaints', {
                credentials: 'include',
                cache: forceRefresh ? 'no-store' : 'default',
                ...(forceRefresh && {
                    headers: {
                        'Cache-Control': 'no-cache',
                    },
                }),
            });
            if (!response.ok) throw new Error('Failed to fetch analytics');
            const data = await response.json();
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to fetch complaints analytics:', error);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    // Fetch complaint detail
    const fetchComplaintDetail = async (id: string) => {
        try {
            const response = await fetch(`/api/complaints/${id}`);
            if (!response.ok)
                throw new Error('Failed to fetch complaint details');

            const data = await response.json();
            setSelectedComplaint(data.complaint);
            setInternalNotes(data.complaint.internal_notes || '');
            setSelectedAttachments(data.attachments || []);
            setShowDetailModal(true);
        } catch (error) {
            toast.showError('Failed to load complaint details');
            console.error(error);
        }
    };

    // Update complaint status
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
            // Force refresh analytics after status update
            if (onRefreshAnalytics) {
                onRefreshAnalytics(true);
            } else {
                fetchAnalytics(true);
            }
            if (selectedComplaint?.id === id) {
                fetchComplaintDetail(id);
            }
        } catch (error) {
            toast.showError('Failed to update status');
            console.error(error);
        }
    };

    // Save internal notes
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

    // Send message
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

    // Get status color
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

    // Get priority color
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

    // Get score color
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    // Get score background color
    const getScoreBgColor = (score: number) => {
        if (score >= 80) return 'bg-green-500/10 border-green-500/50';
        if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/50';
        return 'bg-red-500/10 border-red-500/50';
    };

    // Clear filters
    const clearFilters = () => {
        setFilters({
            status: '',
            priority: '',
            category: '',
            search: '',
        });
        setPage(1);
    };

    // Handle the process complaint emails action
    const handleProcessComplaintEmails = async () => {
        setProcessingEmails(true);
        setEmailProcessResult(null);

        try {
            // Try to process the complaint emails
            const response = await fetch('/api/email/process-complaints', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            // Get the result
            const result = await response.json();

            // If the response is not ok, throw an error
            if (!response.ok) {
                throw new Error(
                    result.error ||
                        result.details ||
                        'Failed to process complaint emails'
                );
            }

            // Set the email process result
            setEmailProcessResult({
                processed: result.processed || 0,
                created: result.created || 0,
                errors: Array.isArray(result.errors)
                    ? result.errors.map(
                          (err: string | { emailId: string; error: string }) =>
                              typeof err === 'string'
                                  ? { emailId: 'unknown', error: err }
                                  : err
                      )
                    : [],
            });

            // Show success toast
            toast.showSuccess(
                `Processed ${result.processed || 0} emails, created ${
                    result.created || 0
                } complaints`
            );

            // Reload complaints
            fetchComplaints();
            fetchStats();
        } catch (err: unknown) {
            // Show error toast
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Failed to process complaint emails';
            toast.showError(errorMessage);
            // Set the email process result
            setEmailProcessResult({
                processed: 0,
                created: 0,
                errors: [{ emailId: 'system', error: errorMessage }],
            });
        } finally {
            // Set the processing emails to false
            setProcessingEmails(false);
        }
    };

    // Prepare status chart data
    const statusChartData = analytics
        ? [
              { name: 'New', value: analytics.statusBreakdown.new },
              {
                  name: 'Under Investigation',
                  value: analytics.statusBreakdown.under_investigation,
              },
              { name: 'Resolved', value: analytics.statusBreakdown.resolved },
              { name: 'Closed', value: analytics.statusBreakdown.closed },
          ]
        : [];

    // Prepare sentiment chart data
    const sentimentChartData = analytics
        ? [
              {
                  name: 'Positive',
                  value: analytics.positive,
                  color: SENTIMENT_COLORS.positive,
              },
              {
                  name: 'Negative',
                  value: analytics.negative,
                  color: SENTIMENT_COLORS.negative,
              },
          ]
        : [];

    // Prepare priority chart data
    const priorityChartData = analytics
        ? [
              { name: 'Critical', value: analytics.priorityBreakdown.critical },
              { name: 'High', value: analytics.priorityBreakdown.high },
              { name: 'Medium', value: analytics.priorityBreakdown.medium },
              { name: 'Low', value: analytics.priorityBreakdown.low },
          ]
        : [];

    // Render the component
    return (
        <div className="space-y-6">
            {/* Header with refresh button */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">
                    Complaints Dashboard
                </h2>
                <div className="flex items-center gap-3">
                    {propLastRefreshed && (
                        <div className="text-sm text-gray-400 hidden md:block">
                            Last refreshed:{' '}
                            {format(propLastRefreshed, 'MMM dd, yyyy HH:mm')}
                        </div>
                    )}
                    <button
                        onClick={() => {
                            if (onRefreshAnalytics) {
                                setLoadingAnalytics(true);
                                onRefreshAnalytics(true);
                            } else {
                                fetchAnalytics(true);
                            }
                        }}
                        disabled={loadingAnalytics}
                        className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/50 text-amber-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh data"
                    >
                        <RefreshCw
                            className={`w-4 h-4 ${
                                loadingAnalytics ? 'animate-spin' : ''
                            }`}
                        />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>
            </div>

            {/* Email Processing Section */}
            <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-red-600 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">
                            Email Processing
                        </h3>
                        <p className="text-gray-400 text-sm">
                            Manually trigger email processing from "Urgent
                            Complaints" folder
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-black/30 rounded-lg border border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-white font-medium">
                                    Process Unread Emails
                                </p>
                                <p className="text-gray-400 text-sm">
                                    Check for new emails in "Urgent Complaints"
                                    folder and create complaints automatically
                                </p>
                            </div>
                            <button
                                onClick={handleProcessComplaintEmails}
                                disabled={processingEmails}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-red-600 text-white rounded-lg hover:from-amber-600 hover:to-red-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processingEmails ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-4 h-4" />
                                        Process Emails
                                    </>
                                )}
                            </button>
                        </div>

                        {emailProcessResult && (
                            <div
                                className={`mt-4 p-4 rounded-lg border ${
                                    emailProcessResult.errors.length > 0
                                        ? 'bg-red-500/10 border-red-500/50'
                                        : 'bg-green-500/10 border-green-500/50'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    {emailProcessResult.errors.length > 0 ? (
                                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1">
                                        <p
                                            className={`font-medium mb-2 ${
                                                emailProcessResult.errors
                                                    .length > 0
                                                    ? 'text-red-400'
                                                    : 'text-green-400'
                                            }`}
                                        >
                                            Processing Complete
                                        </p>
                                        <div className="space-y-1 text-sm">
                                            <p className="text-gray-300">
                                                <span className="font-medium">
                                                    Emails Processed:
                                                </span>{' '}
                                                {emailProcessResult.processed}
                                            </p>
                                            <p className="text-gray-300">
                                                <span className="font-medium">
                                                    Complaints Created:
                                                </span>{' '}
                                                {emailProcessResult.created}
                                            </p>
                                            {emailProcessResult.errors.length >
                                                0 && (
                                                <div className="mt-2">
                                                    <p className="text-red-400 font-medium mb-1">
                                                        Errors:
                                                    </p>
                                                    <ul className="list-disc list-inside text-red-300 space-y-1">
                                                        {emailProcessResult.errors.map(
                                                            (
                                                                errorItem,
                                                                idx
                                                            ) => (
                                                                <li
                                                                    key={idx}
                                                                    className="text-xs"
                                                                >
                                                                    {errorItem.emailId &&
                                                                        errorItem.emailId !==
                                                                            'system' && (
                                                                            <span className="font-medium">
                                                                                {
                                                                                    errorItem.emailId
                                                                                }

                                                                                :{' '}
                                                                            </span>
                                                                        )}
                                                                    {
                                                                        errorItem.error
                                                                    }
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() =>
                                            setEmailProcessResult(null)
                                        }
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Alert banner for overdue items */}
            {analytics && analytics.overdue > 0 && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <div>
                            <p className="text-white font-semibold">
                                Overdue Complaints Alert
                            </p>
                            <p className="text-gray-400 text-sm">
                                {analytics.overdue} complaint
                                {analytics.overdue !== 1 ? 's' : ''}{' '}
                                {analytics.overdue !== 1 ? 'are' : 'is'} overdue
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            if (onRefreshAnalytics) {
                                setLoadingAnalytics(true);
                                onRefreshAnalytics(true);
                            } else {
                                fetchAnalytics(true);
                            }
                        }}
                        disabled={loadingAnalytics}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh Analytics"
                    >
                        <RefreshCw
                            className={`w-4 h-4 text-red-500 ${
                                loadingAnalytics ? 'animate-spin' : ''
                            }`}
                        />
                    </button>
                </div>
            )}

            {/* Key Metrics Cards */}
            {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Satisfaction Score */}
                    <div
                        className={`bg-gray-900/50 border rounded-xl p-5 ${getScoreBgColor(
                            analytics.satisfactionScore
                        )}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Award
                                className={`w-6 h-6 ${getScoreColor(
                                    analytics.satisfactionScore
                                )}`}
                            />
                            <span className="text-xs text-gray-400">Score</span>
                        </div>
                        <p
                            className={`text-3xl font-bold mb-1 ${getScoreColor(
                                analytics.satisfactionScore
                            )}`}
                        >
                            {analytics.satisfactionScore}/100
                        </p>
                        <p className="text-sm text-gray-400">
                            Satisfaction Score
                        </p>
                    </div>

                    <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="w-6 h-6 text-amber-500" />
                            <span className="text-xs text-gray-400">
                                This Month
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">
                            {analytics.totalThisMonth}
                        </p>
                        <p className="text-sm text-gray-400">
                            Total Complaints
                        </p>
                    </div>

                    <div className="bg-gray-900/50 border border-green-500/20 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-2">
                            <ThumbsUp className="w-6 h-6 text-green-500" />
                            <span className="text-xs text-gray-400">
                                Resolved
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">
                            {analytics.positive}
                        </p>
                        <p className="text-sm text-gray-400">
                            Positive (Resolved/Closed)
                        </p>
                    </div>

                    <div className="bg-gray-900/50 border border-red-500/20 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-2">
                            <ThumbsDown className="w-6 h-6 text-red-500" />
                            <span className="text-xs text-gray-400">
                                Active
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">
                            {analytics.negative}
                        </p>
                        <p className="text-sm text-gray-400">
                            Negative (Active Issues)
                        </p>
                    </div>
                </div>
            )}

            {/* Secondary Metrics */}
            {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                            <span className="text-xs text-gray-400">Rate</span>
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">
                            {analytics.resolutionRate.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-400">Resolution Rate</p>
                    </div>

                    <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-6 h-6 text-blue-500" />
                            <span className="text-xs text-gray-400">
                                Average
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">
                            {analytics.averageResolutionTime.toFixed(1)}
                        </p>
                        <p className="text-sm text-gray-400">Days to Resolve</p>
                    </div>

                    <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-6 h-6 text-green-500" />
                            <span className="text-xs text-gray-400">Total</span>
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">
                            {analytics.total}
                        </p>
                        <p className="text-sm text-gray-400">
                            All Time Complaints
                        </p>
                    </div>
                </div>
            )}

            {/* Charts Section - Always Visible */}
            {analytics && !loadingAnalytics && (
                <div className="space-y-6">
                    {/* Status Distribution Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pie chart - Positive vs Negative */}
                        <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-amber-500" />
                                Positive vs Negative Complaints
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={sentimentChartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) =>
                                            `${name} ${
                                                percent
                                                    ? (percent * 100).toFixed(0)
                                                    : 0
                                            }%`
                                        }
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {sentimentChartData.map(
                                            (entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.color}
                                                />
                                            )
                                        )}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Pie chart - Complaints by status */}
                        <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-amber-500" />
                                Complaints by Status
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={statusChartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) =>
                                            `${name} ${
                                                percent
                                                    ? (percent * 100).toFixed(0)
                                                    : 0
                                            }%`
                                        }
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {statusChartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={
                                                    COLORS[
                                                        index % COLORS.length
                                                    ]
                                                }
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Trends Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Line graph - monthly volume trend */}
                        <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-amber-500" />
                                Monthly Complaint Trend
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={analytics.monthlyTrend}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#374151"
                                    />
                                    <XAxis
                                        dataKey="month"
                                        stroke="#9ca3af"
                                        angle={-45}
                                        textAnchor="end"
                                        height={100}
                                    />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#f59e0b"
                                        strokeWidth={2}
                                        name="Complaints"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Line graph - resolution trend */}
                        <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-amber-500" />
                                Monthly Resolution Trend
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={analytics.resolutionTrend}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#374151"
                                    />
                                    <XAxis
                                        dataKey="month"
                                        stroke="#9ca3af"
                                        angle={-45}
                                        textAnchor="end"
                                        height={100}
                                    />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="resolved"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        name="Resolved"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        name="Total"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Category and Priority Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Bar chart - top categories */}
                        <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-amber-500" />
                                Top Complaint Categories
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analytics.topCategories}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#374151"
                                    />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#9ca3af"
                                        angle={-45}
                                        textAnchor="end"
                                        height={100}
                                        tickFormatter={value =>
                                            value.replace(/_/g, ' ')
                                        }
                                    />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Bar dataKey="count" fill="#f59e0b" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Bar chart - complaints by priority */}
                        <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-amber-500" />
                                Complaints by Priority
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={priorityChartData}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#374151"
                                    />
                                    <XAxis dataKey="name" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Status Breakdown Matrix */}
                    <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-amber-500" />
                            Status Breakdown Matrix
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-black/30 border border-blue-500/30 rounded-lg p-4 text-center">
                                <p className="text-3xl font-bold text-blue-400 mb-1">
                                    {analytics.statusBreakdown.new}
                                </p>
                                <p className="text-sm text-gray-400">New</p>
                            </div>
                            <div className="bg-black/30 border border-yellow-500/30 rounded-lg p-4 text-center">
                                <p className="text-3xl font-bold text-yellow-400 mb-1">
                                    {
                                        analytics.statusBreakdown
                                            .under_investigation
                                    }
                                </p>
                                <p className="text-sm text-gray-400">
                                    Under Investigation
                                </p>
                            </div>
                            <div className="bg-black/30 border border-green-500/30 rounded-lg p-4 text-center">
                                <p className="text-3xl font-bold text-green-400 mb-1">
                                    {analytics.statusBreakdown.resolved}
                                </p>
                                <p className="text-sm text-gray-400">
                                    Resolved
                                </p>
                            </div>
                            <div className="bg-black/30 border border-gray-500/30 rounded-lg p-4 text-center">
                                <p className="text-3xl font-bold text-gray-400 mb-1">
                                    {analytics.statusBreakdown.closed}
                                </p>
                                <p className="text-sm text-gray-400">Closed</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading state for analytics */}
            {loadingAnalytics && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
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

                            {/* Attachments */}
                            {selectedAttachments &&
                            selectedAttachments.length > 0 ? (
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-amber-500" />
                                        Attachments (
                                        {selectedAttachments.length})
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {selectedAttachments.map(attachment => (
                                            <div
                                                key={attachment.id}
                                                className="bg-black/50 border border-gray-700 rounded-lg p-4 hover:border-amber-500/50 transition-colors"
                                            >
                                                {attachment.file_type.startsWith(
                                                    'image/'
                                                ) && attachment.signed_url ? (
                                                    <div className="mb-3">
                                                        <img
                                                            src={
                                                                attachment.signed_url
                                                            }
                                                            alt={
                                                                attachment.file_name
                                                            }
                                                            className="w-full h-32 object-cover rounded-lg"
                                                            onError={e => {
                                                                console.error(
                                                                    '[ADMIN] Image load error:',
                                                                    attachment.signed_url
                                                                );
                                                                e.currentTarget.style.display =
                                                                    'none';
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="mb-3 flex items-center justify-center h-32 bg-gray-800 rounded-lg">
                                                        <FileText className="w-8 h-8 text-gray-500" />
                                                    </div>
                                                )}
                                                <p
                                                    className="text-white text-sm font-medium truncate mb-1"
                                                    title={attachment.file_name}
                                                >
                                                    {attachment.file_name}
                                                </p>
                                                <p className="text-gray-500 text-xs mb-2">
                                                    {(
                                                        attachment.file_size /
                                                        1024
                                                    ).toFixed(1)}{' '}
                                                    KB
                                                </p>
                                                {attachment.signed_url ? (
                                                    <a
                                                        href={
                                                            attachment.signed_url
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-amber-500 hover:text-amber-400 text-xs"
                                                    >
                                                        View/Download
                                                    </a>
                                                ) : (
                                                    <p className="text-red-400 text-xs">
                                                        URL not available
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-amber-500" />
                                        Attachments
                                    </h3>
                                    <p className="text-gray-400 text-sm">
                                        No attachments for this complaint.
                                    </p>
                                </div>
                            )}

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
