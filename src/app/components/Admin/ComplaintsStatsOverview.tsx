// =============================================
// FILE: app/components/Admin/ComplaintsStatsOverview.tsx
// Enhanced Complaints Analytics Dashboard
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
    FileText,
    CheckCircle,
    Clock,
    AlertCircle,
    TrendingUp,
    Download,
    Mail,
    Bell,
    Loader2,
    RefreshCw,
    ThumbsUp,
    ThumbsDown,
    Award,
    X,
    BarChart3,
    PieChart as PieChartIcon,
    Activity,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../Toast';

// Interface for the complaints dashboard data
interface ComplaintsDashboardData {
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
    lastRefreshed?: string;
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#0ea5e9'];
const SENTIMENT_COLORS = {
    positive: '#10b981',
    negative: '#ef4444',
};

// Interface for the complaints stats overview props
interface ComplaintsStatsOverviewProps {
    activeSubTab?: 'overview' | 'analytics' | 'activity';
    onSubTabChange?: (tab: 'overview' | 'analytics' | 'activity') => void;
    showAllSections?: boolean;
}

// Complaints stats overview component
export const ComplaintsStatsOverview: React.FC<
    ComplaintsStatsOverviewProps
> = ({
    activeSubTab = 'overview',
    onSubTabChange,
    showAllSections = false,
}) => {
    const { showSuccess, showError } = useToast();
    const [data, setData] = useState<ComplaintsDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [exportType, setExportType] = useState<string | null>(null);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportMenuRef = React.useRef<HTMLDivElement>(null);
    const [internalSubTab, setInternalSubTab] = useState<
        'overview' | 'analytics' | 'activity'
    >('overview');
    const [expandedSections, setExpandedSections] = useState<{
        charts: boolean;
        trends: boolean;
    }>({
        charts: false,
        trends: false,
    });

    // Use the external subTab if provided, otherwise use the internal state
    const currentSubTab = activeSubTab || internalSubTab;
    const setCurrentSubTab = onSubTabChange || setInternalSubTab;

    useEffect(() => {
        fetchAnalytics(false);

        // Auto-refresh every 30 minutes (1800000 ms)
        const refreshInterval = setInterval(
            () => {
                fetchAnalytics(false); // Use cache if available
            },
            30 * 60 * 1000
        );

        return () => clearInterval(refreshInterval);
    }, []);

    // Fetch the complaints analytics
    const fetchAnalytics = async (forceRefresh: boolean = false) => {
        try {
            const response = await fetch('/api/analytics/complaints', {
                credentials: 'include',
                cache: forceRefresh ? 'no-store' : 'default', // Use cache unless force refresh
                ...(forceRefresh && {
                    headers: {
                        'Cache-Control': 'no-cache',
                    },
                }),
            });
            if (!response.ok) throw new Error('Failed to fetch analytics');
            const result = await response.json();
            setData(result);
            setLastRefreshed(
                result.lastRefreshed
                    ? new Date(result.lastRefreshed)
                    : new Date()
            );
        } catch (error) {
            console.error('Failed to fetch complaints analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    // Export the complaints analytics to CSV
    const exportToCSV = async () => {
        setExporting(true);
        setExportType('csv');
        try {
            const response = await fetch(
                '/api/analytics/complaints/export?format=csv',
                {
                    credentials: 'include',
                }
            );
            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response
                        .json()
                        .catch(() => ({ error: 'Export failed' }));
                    throw new Error(errorData.error || 'Export failed');
                }
                throw new Error(`Export failed with status ${response.status}`);
            }
            const blob = await response.blob();
            // Check if the blob is actually an error JSON response
            if (blob.type === 'application/json') {
                const errorText = await blob.text();
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.error || 'Export failed');
            }
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `complaints-analytics-${format(
                new Date(),
                'yyyy-MM-dd'
            )}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showSuccess('CSV export completed successfully');
        } catch (error) {
            console.error('Export failed:', error);
            showError(
                error instanceof Error ? error.message : 'Failed to export CSV'
            );
        } finally {
            setExporting(false);
            setExportType(null);
        }
    };

    // Export the complaints analytics to Excel
    const exportToExcel = async () => {
        setExporting(true);
        setExportType('excel');
        try {
            const response = await fetch(
                '/api/analytics/complaints/export?format=xlsx',
                {
                    credentials: 'include',
                }
            );
            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response
                        .json()
                        .catch(() => ({ error: 'Export failed' }));
                    throw new Error(errorData.error || 'Export failed');
                }
                throw new Error(`Export failed with status ${response.status}`);
            }
            const blob = await response.blob();
            // Check if the blob is actually an error JSON response
            if (blob.type === 'application/json') {
                const errorText = await blob.text();
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.error || 'Export failed');
            }
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `complaints-analytics-${format(
                new Date(),
                'yyyy-MM-dd'
            )}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showSuccess('Excel export completed successfully');
        } catch (error) {
            console.error('Export failed:', error);
            showError(
                error instanceof Error
                    ? error.message
                    : 'Failed to export Excel'
            );
        } finally {
            setExporting(false);
            setExportType(null);
        }
    };

    // Generate a PDF report of the complaints analytics
    const generatePDFReport = async () => {
        setExporting(true);
        setExportType('pdf');
        try {
            const response = await fetch(
                '/api/analytics/complaints/report/pdf',
                {
                    credentials: 'include',
                }
            );
            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response
                        .json()
                        .catch(() => ({ error: 'Report generation failed' }));
                    throw new Error(
                        errorData.error || 'Report generation failed'
                    );
                }
                throw new Error(
                    `Report generation failed with status ${response.status}`
                );
            }
            const blob = await response.blob();
            // Check if the blob is actually an error JSON response
            if (blob.type === 'application/json') {
                const errorText = await blob.text();
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.error || 'Report generation failed');
            }
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `complaints-report-${format(
                new Date(),
                'yyyy-MM'
            )}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showSuccess('PDF report generated successfully');
        } catch (error) {
            console.error('Report generation failed:', error);
            showError(
                error instanceof Error
                    ? error.message
                    : 'Failed to generate PDF report'
            );
        } finally {
            setExporting(false);
            setExportType(null);
        }
    };

    // If the data is loading, show a loading spinner
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
        );
    }

    // If the data is not loaded, show a message
    if (!data) {
        return (
            <div className="text-center py-12 text-gray-400">
                Failed to load complaints analytics
            </div>
        );
    }

    // Get the status chart data
    const statusChartData = [
        { name: 'New', value: data.statusBreakdown.new },
        {
            name: 'Under Investigation',
            value: data.statusBreakdown.under_investigation,
        },
        { name: 'Resolved', value: data.statusBreakdown.resolved },
        { name: 'Closed', value: data.statusBreakdown.closed },
    ];

    // Get the sentiment chart data
    const sentimentChartData = [
        {
            name: 'Positive (Resolved/Closed)',
            value: data.positive,
            color: SENTIMENT_COLORS.positive,
        },
        {
            name: 'Negative (Active)',
            value: data.negative,
            color: SENTIMENT_COLORS.negative,
        },
    ];

    // Get the priority chart data
    const priorityChartData = [
        { name: 'Critical', value: data.priorityBreakdown.critical },
        { name: 'High', value: data.priorityBreakdown.high },
        { name: 'Medium', value: data.priorityBreakdown.medium },
        { name: 'Low', value: data.priorityBreakdown.low },
    ];

    // Get the score color based on value
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    // Get the score background color based on value
    const getScoreBgColor = (score: number) => {
        if (score >= 80) return 'bg-green-500/10 border-green-500/50';
        if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/50';
        return 'bg-red-500/10 border-red-500/50';
    };

    // Return the complaints stats overview component
    return (
        <div className="space-y-6 relative">
            {/* Floating Export Button - Only show if not showAllSections */}
            {/* If the showAllSections prop is false, show the export menu */}
            {!showAllSections && (
                <div
                    className="fixed bottom-24 right-8 z-40"
                    ref={exportMenuRef}
                >
                    {/* Export button */}
                    <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={exporting}
                        className="flex items-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Complaints Export & Reports"
                    >
                        {exporting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="hidden sm:inline">
                                    {exportType === 'csv'
                                        ? 'Exporting CSV...'
                                        : exportType === 'excel'
                                        ? 'Exporting Excel...'
                                        : exportType === 'pdf'
                                        ? 'Generating PDF...'
                                        : exportType === 'email'
                                        ? 'Sending Email...'
                                        : 'Processing...'}
                                </span>
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5" />
                                <span className="hidden sm:inline">
                                    Complaints Export
                                </span>
                            </>
                        )}
                    </button>

                    {/* Dropdown Menu */}
                    {/* If the showExportMenu state is true and the exporting state is false, show the export menu */}
                    {showExportMenu && !exporting && (
                        <div className="absolute bottom-full right-0 mb-2 w-64 bg-gray-900 border border-amber-500/50 rounded-xl shadow-2xl overflow-hidden">
                            <div className="p-2">
                                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
                                    <h3 className="text-sm font-semibold text-white">
                                        Complaints Export & Reports
                                    </h3>
                                    <button
                                        onClick={() => setShowExportMenu(false)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="py-2">
                                    {/* Export to CSV button */}
                                    <button
                                        onClick={() => {
                                            setShowExportMenu(false);
                                            exportToCSV();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-amber-500/10 transition-colors group"
                                    >
                                        <Download className="w-5 h-5 text-amber-500 group-hover:text-amber-400" />
                                        <div>
                                            <div className="text-white font-medium">
                                                Export to CSV
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                Download complaints as CSV
                                            </div>
                                        </div>
                                    </button>
                                    {/* Export to Excel button */}
                                    <button
                                        onClick={() => {
                                            setShowExportMenu(false);
                                            exportToExcel();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-amber-500/10 transition-colors group"
                                    >
                                        <Download className="w-5 h-5 text-amber-500 group-hover:text-amber-400" />
                                        <div>
                                            <div className="text-white font-medium">
                                                Export to Excel
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                Download complaints as Excel
                                            </div>
                                        </div>
                                    </button>
                                    {/* Generate PDF Report button */}
                                    <button
                                        onClick={() => {
                                            setShowExportMenu(false);
                                            generatePDFReport();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-amber-500/10 transition-colors group"
                                    >
                                        <FileText className="w-5 h-5 text-amber-500 group-hover:text-amber-400" />
                                        <div>
                                            <div className="text-white font-medium">
                                                Generate PDF Report
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                Create complaints PDF report
                                            </div>
                                        </div>
                                    </button>
                                    {/* Email Monthly Report button */}
                                    <button
                                        onClick={async () => {
                                            setShowExportMenu(false);
                                            setExporting(true);
                                            setExportType('email');
                                            try {
                                                // Try to send the email report
                                                const response = await fetch(
                                                    '/api/analytics/complaints/report/email',
                                                    {
                                                        method: 'POST',
                                                        credentials: 'include',
                                                    }
                                                );
                                                if (!response.ok) {
                                                    // If the response is not ok, throw an error
                                                    const errorData =
                                                        await response
                                                            .json()
                                                            .catch(() => ({
                                                                error: 'Failed to send email',
                                                            }));
                                                    throw new Error(
                                                        errorData.error ||
                                                            'Failed to send email'
                                                    );
                                                }
                                                // Get the result
                                                const result =
                                                    await response.json();
                                                // Show success toast
                                                showSuccess(
                                                    result.message ||
                                                        'Complaints report email sent successfully!'
                                                );
                                            } catch (error) {
                                                // Show error toast
                                                console.error(
                                                    'Failed to send email:',
                                                    error
                                                );
                                                // Show error toast
                                                showError(
                                                    error instanceof Error
                                                        ? error.message
                                                        : 'Failed to send email report'
                                                );
                                            } finally {
                                                // Set the exporting state to false
                                                setExporting(false);
                                                setExportType(null);
                                            }
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-amber-500/10 transition-colors group"
                                    >
                                        <Mail className="w-5 h-5 text-amber-500 group-hover:text-amber-400" />
                                        <div>
                                            <div className="text-white font-medium">
                                                Email Monthly Report
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                Send complaints report via email
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Alert banner for overdue items */}
            {/* If the number of overdue items is greater than 0, show the alert banner */}
            {data.overdue > 0 && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <div>
                            <p className="text-white font-semibold">
                                Overdue Complaints Alert
                            </p>
                            <p className="text-gray-400 text-sm">
                                {data.overdue} complaint
                                {data.overdue !== 1 ? 's' : ''}{' '}
                                {data.overdue !== 1 ? 'are' : 'is'} overdue
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* If the showAllSections prop is true or the currentSubTab is 'overview', show the complaints overview section */}
            {(showAllSections || currentSubTab === 'overview') && (
                <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Satisfaction Score */}
                        <div
                            className={`bg-gray-900/50 border rounded-xl p-4 ${getScoreBgColor(
                                data.satisfactionScore
                            )}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Award
                                    className={`w-5 h-5 ${getScoreColor(
                                        data.satisfactionScore
                                    )}`}
                                />
                                <span className="text-xs text-gray-400">
                                    Score
                                </span>
                            </div>
                            <p
                                className={`text-2xl font-bold ${getScoreColor(
                                    data.satisfactionScore
                                )}`}
                            >
                                {data.satisfactionScore}/100
                            </p>
                            <p className="text-sm text-gray-400">
                                Satisfaction Score
                            </p>
                        </div>

                        <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <FileText className="w-5 h-5 text-amber-500" />
                                <span className="text-xs text-gray-400">
                                    This Month
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {data.totalThisMonth}
                            </p>
                            <p className="text-sm text-gray-400">
                                Total Complaints
                            </p>
                        </div>

                        <div className="bg-gray-900/50 border border-green-500/20 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <ThumbsUp className="w-5 h-5 text-green-500" />
                                <span className="text-xs text-gray-400">
                                    Resolved
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {data.positive}
                            </p>
                            <p className="text-sm text-gray-400">
                                Positive (Resolved/Closed)
                            </p>
                        </div>

                        <div className="bg-gray-900/50 border border-red-500/20 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <ThumbsDown className="w-5 h-5 text-red-500" />
                                <span className="text-xs text-gray-400">
                                    Active
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {data.negative}
                            </p>
                            <p className="text-sm text-gray-400">
                                Negative (Active Issues)
                            </p>
                        </div>
                    </div>

                    {/* Secondary Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span className="text-xs text-gray-400">
                                    Rate
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {data.resolutionRate.toFixed(1)}%
                            </p>
                            <p className="text-sm text-gray-400">
                                Resolution Rate
                            </p>
                        </div>

                        <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <Clock className="w-5 h-5 text-blue-500" />
                                <span className="text-xs text-gray-400">
                                    Average
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {data.averageResolutionTime.toFixed(1)}
                            </p>
                            <p className="text-sm text-gray-400">
                                Days to Resolve
                            </p>
                        </div>

                        <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <TrendingUp className="w-5 h-5 text-green-500" />
                                <span className="text-xs text-gray-400">
                                    Total
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {data.total}
                            </p>
                            <p className="text-sm text-gray-400">
                                All Time Complaints
                            </p>
                        </div>
                    </div>

                    {/* Quick Summary */}
                    <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-amber-500" />
                            Quick Summary
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-white">
                                    {data.statusBreakdown.new}
                                </p>
                                <p className="text-sm text-gray-400">New</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-white">
                                    {data.statusBreakdown.under_investigation}
                                </p>
                                <p className="text-sm text-gray-400">
                                    Under Investigation
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-white">
                                    {data.statusBreakdown.resolved}
                                </p>
                                <p className="text-sm text-gray-400">
                                    Resolved
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-white">
                                    {data.statusBreakdown.closed}
                                </p>
                                <p className="text-sm text-gray-400">Closed</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Complaints Analytics Section */}
            {(showAllSections || currentSubTab === 'analytics') && (
                <div className="space-y-6">
                    {/* Charts Section - Collapsible */}
                    <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl overflow-hidden">
                        <button
                            onClick={() =>
                                setExpandedSections(prev => ({
                                    ...prev,
                                    charts: !prev.charts,
                                }))
                            }
                            className="w-full flex items-center justify-between p-6 hover:bg-gray-800/50 transition-colors"
                        >
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <PieChartIcon className="w-5 h-5 text-amber-500" />
                                Status & Distribution Charts
                            </h3>
                            {expandedSections.charts ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                        </button>
                        {expandedSections.charts && (
                            <div className="p-6 pt-0 space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Pie chart - Positive vs Negative */}
                                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-white mb-4">
                                            Positive vs Negative Complaints
                                        </h3>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={300}
                                        >
                                            <PieChart>
                                                <Pie
                                                    data={sentimentChartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({
                                                        name,
                                                        percent,
                                                    }) =>
                                                        `${name} ${
                                                            percent
                                                                ? (
                                                                      percent *
                                                                      100
                                                                  ).toFixed(0)
                                                                : 0
                                                        }%`
                                                    }
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {sentimentChartData.map(
                                                        (entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={
                                                                    entry.color
                                                                }
                                                            />
                                                        )
                                                    )}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Pie chart - Complaints by status */}
                                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-white mb-4">
                                            Complaints by Status
                                        </h3>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={300}
                                        >
                                            <PieChart>
                                                <Pie
                                                    data={statusChartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({
                                                        name,
                                                        percent,
                                                    }) =>
                                                        `${name} ${
                                                            percent
                                                                ? (
                                                                      percent *
                                                                      100
                                                                  ).toFixed(0)
                                                                : 0
                                                        }%`
                                                    }
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {statusChartData.map(
                                                        (entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={
                                                                    COLORS[
                                                                        index %
                                                                            COLORS.length
                                                                    ]
                                                                }
                                                            />
                                                        )
                                                    )}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Trends Section - Collapsible */}
                    <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl overflow-hidden">
                        <button
                            onClick={() =>
                                setExpandedSections(prev => ({
                                    ...prev,
                                    trends: !prev.trends,
                                }))
                            }
                            className="w-full flex items-center justify-between p-6 hover:bg-gray-800/50 transition-colors"
                        >
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-amber-500" />
                                Trends & Categories
                            </h3>
                            {expandedSections.trends ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                        </button>
                        {expandedSections.trends && (
                            <div className="p-6 pt-0 space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Line graph - monthly volume trend */}
                                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-white mb-4">
                                            Monthly Complaint Trend
                                        </h3>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={300}
                                        >
                                            <LineChart data={data.monthlyTrend}>
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
                                                        backgroundColor:
                                                            '#1f2937',
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
                                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-white mb-4">
                                            Monthly Resolution Trend
                                        </h3>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={300}
                                        >
                                            <LineChart
                                                data={data.resolutionTrend}
                                            >
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
                                                        backgroundColor:
                                                            '#1f2937',
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

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Bar chart - top categories */}
                                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-white mb-4">
                                            Top Complaint Categories
                                        </h3>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={300}
                                        >
                                            <BarChart data={data.topCategories}>
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
                                                        backgroundColor:
                                                            '#1f2937',
                                                        border: '1px solid #374151',
                                                        borderRadius: '8px',
                                                    }}
                                                />
                                                <Bar
                                                    dataKey="count"
                                                    fill="#f59e0b"
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Bar chart - complaints by priority */}
                                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-white mb-4">
                                            Complaints by Priority
                                        </h3>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={300}
                                        >
                                            <BarChart data={priorityChartData}>
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    stroke="#374151"
                                                />
                                                <XAxis
                                                    dataKey="name"
                                                    stroke="#9ca3af"
                                                />
                                                <YAxis stroke="#9ca3af" />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor:
                                                            '#1f2937',
                                                        border: '1px solid #374151',
                                                        borderRadius: '8px',
                                                    }}
                                                />
                                                <Bar
                                                    dataKey="value"
                                                    fill="#3b82f6"
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Complaints Activity Section */}
            {(showAllSections || currentSubTab === 'activity') && (
                <div className="space-y-6">
                    <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-amber-500" />
                                Recent Complaints Activity
                            </h3>
                        </div>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto">
                            {data.activityFeed.map(activity => (
                                <div
                                    key={activity.id}
                                    className="bg-black/30 border border-gray-800 rounded-lg p-4 flex items-center justify-between hover:bg-black/40 transition-colors"
                                >
                                    <div>
                                        <p className="text-white text-sm">
                                            {activity.description}
                                        </p>
                                        <p className="text-gray-400 text-xs mt-1">
                                            {format(
                                                new Date(activity.timestamp),
                                                'MMM dd, yyyy HH:mm'
                                            )}
                                        </p>
                                    </div>
                                    <span
                                        className={`px-2 py-1 rounded text-xs ${
                                            activity.status === 'resolved' ||
                                            activity.status === 'closed'
                                                ? 'bg-green-500/20 text-green-400'
                                                : activity.status ===
                                                  'under_investigation'
                                                ? 'bg-blue-500/20 text-blue-400'
                                                : 'bg-yellow-500/20 text-yellow-400'
                                        }`}
                                    >
                                        {activity.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Download Reports Section */}
            {showAllSections && (
                <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Download className="w-5 h-5 text-amber-500" />
                        Download Reports
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button
                            onClick={exportToCSV}
                            disabled={exporting && exportType === 'csv'}
                            className="flex flex-col items-center gap-2 p-4 bg-black/30 border border-gray-800 rounded-lg hover:bg-black/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="w-6 h-6 text-amber-500" />
                            <span className="text-white font-medium text-sm">
                                Export to CSV
                            </span>
                            <span className="text-gray-400 text-xs">
                                Download complaints as CSV
                            </span>
                        </button>
                        <button
                            onClick={exportToExcel}
                            disabled={exporting && exportType === 'excel'}
                            className="flex flex-col items-center gap-2 p-4 bg-black/30 border border-gray-800 rounded-lg hover:bg-black/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="w-6 h-6 text-amber-500" />
                            <span className="text-white font-medium text-sm">
                                Export to Excel
                            </span>
                            <span className="text-gray-400 text-xs">
                                Download complaints as Excel
                            </span>
                        </button>
                        <button
                            onClick={generatePDFReport}
                            disabled={exporting && exportType === 'pdf'}
                            className="flex flex-col items-center gap-2 p-4 bg-black/30 border border-gray-800 rounded-lg hover:bg-black/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FileText className="w-6 h-6 text-amber-500" />
                            <span className="text-white font-medium text-sm">
                                Generate PDF
                            </span>
                            <span className="text-gray-400 text-xs">
                                Create complaints PDF report
                            </span>
                        </button>
                        <button
                            onClick={async () => {
                                setExporting(true);
                                setExportType('email');
                                try {
                                    const response = await fetch(
                                        '/api/analytics/complaints/report/email',
                                        {
                                            method: 'POST',
                                            credentials: 'include',
                                        }
                                    );
                                    if (!response.ok) {
                                        const errorData = await response
                                            .json()
                                            .catch(() => ({
                                                error: 'Failed to send email',
                                            }));
                                        throw new Error(
                                            errorData.error ||
                                                'Failed to send email'
                                        );
                                    }
                                    const result = await response.json();
                                    showSuccess(
                                        result.message ||
                                            'Complaints report email sent successfully!'
                                    );
                                } catch (error) {
                                    console.error(
                                        'Failed to send email:',
                                        error
                                    );
                                    showError(
                                        error instanceof Error
                                            ? error.message
                                            : 'Failed to send email report'
                                    );
                                } finally {
                                    setExporting(false);
                                    setExportType(null);
                                }
                            }}
                            disabled={exporting && exportType === 'email'}
                            className="flex flex-col items-center gap-2 p-4 bg-black/30 border border-gray-800 rounded-lg hover:bg-black/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Mail className="w-6 h-6 text-amber-500" />
                            <span className="text-white font-medium text-sm">
                                Email Report
                            </span>
                            <span className="text-gray-400 text-xs">
                                Send complaints report via email
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
