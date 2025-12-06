// =============================================
// FILE: app/components/Admin/EnhancedStatsOverview.tsx
// Enhanced Dashboard Analytics (REQ-37 to REQ-55)
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
    MoreVertical,
    X,
    ChevronDown,
    ChevronUp,
    BarChart3,
    PieChart as PieChartIcon,
    Activity,
} from 'lucide-react';
import { format } from 'date-fns';
import { ComplaintsStatsOverview } from '@/app/components/Admin/ComplaintsStatsOverview';
import { useToast } from '../Toast';

interface DashboardData {
    totalThisMonth: number;
    pending: number;
    inProgress: number;
    completed: number;
    completionRate: number;
    averageDaysToComplete: number;
    revenueThisMonth: number;
    overdue: number;
    statusBreakdown: {
        pending: number;
        processing: number;
        completed: number;
        cancelled: number;
    };
    monthlyTrend: Array<{ month: string; count: number }>;
    topInsurers: Array<{ name: string; count: number }>;
    topRepairers: Array<{ name: string; count: number }>;
    completionTimeByMonth: Array<{ month: string; days: number }>;
    revenueByMonth: Array<{ month: string; revenue: number }>;
    activityFeed: Array<{
        id: string;
        type: string;
        description: string;
        status: string;
        timestamp: string;
    }>;
    lastRefreshed?: string;
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];

interface EnhancedStatsOverviewProps {
    showAllSections?: boolean;
    mainTab?: 'assessments' | 'complaints';
}

export const EnhancedStatsOverview: React.FC<EnhancedStatsOverviewProps> = ({
    showAllSections = false,
    mainTab = 'assessments',
}) => {
    const { showSuccess, showError } = useToast();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [exportType, setExportType] = useState<string | null>(null);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportMenuRef = React.useRef<HTMLDivElement>(null);
    const [activeMainTab, setActiveMainTab] = useState<
        'assessments' | 'complaints'
    >(mainTab || 'assessments');
    const [assessmentsSubTab, setAssessmentsSubTab] = useState<
        'overview' | 'analytics' | 'activity'
    >('overview');
    const [complaintsSubTab, setComplaintsSubTab] = useState<
        'overview' | 'analytics' | 'activity'
    >('overview');
    const [expandedSections, setExpandedSections] = useState<{
        charts: boolean;
        trends: boolean;
        activity: boolean;
    }>({
        charts: false,
        trends: false,
        activity: false,
    });

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

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                exportMenuRef.current &&
                !exportMenuRef.current.contains(event.target as Node)
            ) {
                setShowExportMenu(false);
            }
        };

        if (showExportMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showExportMenu]);

    const fetchAnalytics = async (forceRefresh: boolean = false) => {
        try {
            const response = await fetch('/api/analytics/dashboard', {
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
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = async () => {
        setExporting(true);
        setExportType('csv');
        try {
            const response = await fetch('/api/analytics/export?format=csv', {
                credentials: 'include',
            });
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
            a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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

    const exportToExcel = async () => {
        setExporting(true);
        setExportType('excel');
        try {
            const response = await fetch('/api/analytics/export?format=xlsx', {
                credentials: 'include',
            });
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
            a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
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

    const generatePDFReport = async () => {
        setExporting(true);
        setExportType('pdf');
        try {
            const response = await fetch('/api/analytics/report/pdf', {
                credentials: 'include',
            });
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
            a.download = `monthly-report-${format(new Date(), 'yyyy-MM')}.pdf`;
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-12 text-gray-400">
                Failed to load analytics
            </div>
        );
    }

    const statusChartData = [
        { name: 'Pending', value: data.statusBreakdown.pending },
        { name: 'Processing', value: data.statusBreakdown.processing },
        { name: 'Completed', value: data.statusBreakdown.completed },
        { name: 'Cancelled', value: data.statusBreakdown.cancelled },
    ];

    return (
        <div className="space-y-6 relative">
            {/* Floating Export Button - Only show if not showAllSections */}
            {!showAllSections && (
                <div
                    className="fixed bottom-8 right-8 z-50"
                    ref={exportMenuRef}
                >
                    <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={exporting}
                        className="flex items-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Export & Reports"
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
                                    Export & Reports
                                </span>
                            </>
                        )}
                    </button>

                    {/* Dropdown Menu */}
                    {showExportMenu && !exporting && (
                        <div className="absolute bottom-full right-0 mb-2 w-64 bg-gray-900 border border-amber-500/50 rounded-xl shadow-2xl overflow-hidden">
                            <div className="p-2">
                                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
                                    <h3 className="text-sm font-semibold text-white">
                                        Export & Reports
                                    </h3>
                                    <button
                                        onClick={() => setShowExportMenu(false)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="py-2">
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
                                                Download data as CSV file
                                            </div>
                                        </div>
                                    </button>
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
                                                Download data as Excel file
                                            </div>
                                        </div>
                                    </button>
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
                                                Create monthly PDF report
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={async () => {
                                            setShowExportMenu(false);
                                            setExporting(true);
                                            setExportType('email');
                                            try {
                                                const response = await fetch(
                                                    '/api/analytics/report/email',
                                                    {
                                                        method: 'POST',
                                                        credentials: 'include',
                                                    }
                                                );
                                                if (!response.ok) {
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
                                                const result =
                                                    await response.json();
                                                showSuccess(
                                                    result.message ||
                                                        'Monthly report email sent successfully!'
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
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-amber-500/10 transition-colors group"
                                    >
                                        <Mail className="w-5 h-5 text-amber-500 group-hover:text-amber-400" />
                                        <div>
                                            <div className="text-white font-medium">
                                                Email Monthly Report
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                Send report via email
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Header with refresh - Only show tabs if not showAllSections */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white">
                        {activeMainTab === 'assessments'
                            ? 'Assessments'
                            : 'Complaints'}{' '}
                        Dashboard
                    </h2>
                    <div className="flex items-center gap-3">
                        {lastRefreshed && (
                            <div className="text-sm text-gray-400 hidden md:block">
                                Last refreshed:{' '}
                                {format(lastRefreshed, 'MMM dd, yyyy HH:mm')}
                            </div>
                        )}
                        <button
                            onClick={() => {
                                setLoading(true);
                                fetchAnalytics(true);
                            }}
                            disabled={loading}
                            className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/50 text-amber-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Refresh data"
                        >
                            <RefreshCw
                                className={`w-4 h-4 ${
                                    loading ? 'animate-spin' : ''
                                }`}
                            />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Main Tabs - Only show if not showAllSections */}
                {!showAllSections && (
                    <>
                        <div className="flex gap-2 border-b border-gray-700 mb-4">
                            <button
                                onClick={() => setActiveMainTab('assessments')}
                                className={`px-6 py-3 font-semibold transition-colors ${
                                    activeMainTab === 'assessments'
                                        ? 'text-amber-500 border-b-2 border-amber-500'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Assessments
                            </button>
                            <button
                                onClick={() => setActiveMainTab('complaints')}
                                className={`px-6 py-3 font-semibold transition-colors ${
                                    activeMainTab === 'complaints'
                                        ? 'text-amber-500 border-b-2 border-amber-500'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Complaints
                            </button>
                        </div>

                        {/* Sub Tabs - Only show when Assessments tab is active */}
                        {activeMainTab === 'assessments' && (
                            <div className="flex gap-2 border-b border-gray-700">
                                <button
                                    onClick={() =>
                                        setAssessmentsSubTab('overview')
                                    }
                                    className={`px-4 py-2 font-medium transition-colors ${
                                        assessmentsSubTab === 'overview'
                                            ? 'text-amber-500 border-b-2 border-amber-500'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() =>
                                        setAssessmentsSubTab('analytics')
                                    }
                                    className={`px-4 py-2 font-medium transition-colors ${
                                        assessmentsSubTab === 'analytics'
                                            ? 'text-amber-500 border-b-2 border-amber-500'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    Analytics
                                </button>
                                <button
                                    onClick={() =>
                                        setAssessmentsSubTab('activity')
                                    }
                                    className={`px-4 py-2 font-medium transition-colors ${
                                        assessmentsSubTab === 'activity'
                                            ? 'text-amber-500 border-b-2 border-amber-500'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    Activity
                                </button>
                            </div>
                        )}

                        {/* Sub Tabs - Only show when Complaints tab is active */}
                        {activeMainTab === 'complaints' && (
                            <div className="flex gap-2 border-b border-gray-700">
                                <button
                                    onClick={() =>
                                        setComplaintsSubTab('overview')
                                    }
                                    className={`px-4 py-2 font-medium transition-colors ${
                                        complaintsSubTab === 'overview'
                                            ? 'text-amber-500 border-b-2 border-amber-500'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() =>
                                        setComplaintsSubTab('analytics')
                                    }
                                    className={`px-4 py-2 font-medium transition-colors ${
                                        complaintsSubTab === 'analytics'
                                            ? 'text-amber-500 border-b-2 border-amber-500'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    Analytics
                                </button>
                                <button
                                    onClick={() =>
                                        setComplaintsSubTab('activity')
                                    }
                                    className={`px-4 py-2 font-medium transition-colors ${
                                        complaintsSubTab === 'activity'
                                            ? 'text-amber-500 border-b-2 border-amber-500'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    Activity
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Alert banner for overdue items */}
            {data.overdue > 0 && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <div>
                            <p className="text-white font-semibold">
                                Overdue Items Alert
                            </p>
                            <p className="text-gray-400 text-sm">
                                {data.overdue} assessment
                                {data.overdue !== 1 ? 's' : ''} are overdue
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Assessments Tab Content */}
            {activeMainTab === 'assessments' && (
                <>
                    {/* Assessments Overview Section */}
                    {(showAllSections || assessmentsSubTab === 'overview') && (
                        <div className="space-y-6">
                            {/* Key Metrics - Prominent Display */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/30 rounded-xl p-5 hover:border-amber-500/50 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <FileText className="w-6 h-6 text-amber-500" />
                                        <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
                                            This Month
                                        </span>
                                    </div>
                                    <p className="text-3xl font-bold text-white mb-1">
                                        {data.totalThisMonth}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        Total Assessments
                                    </p>
                                </div>

                                <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded-xl p-5 hover:border-green-500/50 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <CheckCircle className="w-6 h-6 text-green-500" />
                                        <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
                                            Rate
                                        </span>
                                    </div>
                                    <p className="text-3xl font-bold text-white mb-1">
                                        {data.completionRate}%
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        Completion Rate
                                    </p>
                                </div>

                                <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 rounded-xl p-5 hover:border-blue-500/50 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <Clock className="w-6 h-6 text-blue-500" />
                                        <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
                                            Average
                                        </span>
                                    </div>
                                    <p className="text-3xl font-bold text-white mb-1">
                                        {data.averageDaysToComplete.toFixed(1)}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        Days to Complete
                                    </p>
                                </div>

                                <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 rounded-xl p-5 hover:border-purple-500/50 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <TrendingUp className="w-6 h-6 text-purple-500" />
                                        <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
                                            This Month
                                        </span>
                                    </div>
                                    <p className="text-3xl font-bold text-white mb-1">
                                        $
                                        {data.revenueThisMonth.toLocaleString()}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        Revenue
                                    </p>
                                </div>
                            </div>

                            {/* Quick Stats Summary */}
                            <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-amber-500" />
                                    Quick Summary
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-white">
                                            {data.statusBreakdown.pending}
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            Pending
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-white">
                                            {data.statusBreakdown.processing}
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            In Progress
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-white">
                                            {data.statusBreakdown.completed}
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            Completed
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-white">
                                            {data.overdue}
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            Overdue
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Assessments Analytics Section */}
                    {(showAllSections || assessmentsSubTab === 'analytics') && (
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
                                            {/* Pie chart - assessments by status */}
                                            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                                                <h3 className="text-lg font-semibold text-white mb-4">
                                                    Assessments by Status
                                                </h3>
                                                <ResponsiveContainer
                                                    width="100%"
                                                    height={300}
                                                >
                                                    <PieChart>
                                                        <Pie
                                                            data={
                                                                statusChartData
                                                            }
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
                                                                          ).toFixed(
                                                                              0
                                                                          )
                                                                        : 0
                                                                }%`
                                                            }
                                                            outerRadius={80}
                                                            fill="#8884d8"
                                                            dataKey="value"
                                                        >
                                                            {statusChartData.map(
                                                                (
                                                                    entry,
                                                                    index
                                                                ) => (
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

                                            {/* Bar chart - top insurers */}
                                            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                                                <h3 className="text-lg font-semibold text-white mb-4">
                                                    Top Insurers
                                                </h3>
                                                <ResponsiveContainer
                                                    width="100%"
                                                    height={300}
                                                >
                                                    <BarChart
                                                        data={data.topInsurers}
                                                    >
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
                                                        />
                                                        <YAxis stroke="#9ca3af" />
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor:
                                                                    '#1f2937',
                                                                border: '1px solid #374151',
                                                                borderRadius:
                                                                    '8px',
                                                            }}
                                                        />
                                                        <Bar
                                                            dataKey="count"
                                                            fill="#f59e0b"
                                                        />
                                                    </BarChart>
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
                                        Trends & Performance
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
                                                    Monthly Volume Trend
                                                </h3>
                                                <ResponsiveContainer
                                                    width="100%"
                                                    height={300}
                                                >
                                                    <LineChart
                                                        data={data.monthlyTrend}
                                                    >
                                                        <CartesianGrid
                                                            strokeDasharray="3 3"
                                                            stroke="#374151"
                                                        />
                                                        <XAxis
                                                            dataKey="month"
                                                            stroke="#9ca3af"
                                                        />
                                                        <YAxis stroke="#9ca3af" />
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor:
                                                                    '#1f2937',
                                                                border: '1px solid #374151',
                                                                borderRadius:
                                                                    '8px',
                                                            }}
                                                        />
                                                        <Legend />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="count"
                                                            stroke="#f59e0b"
                                                            strokeWidth={2}
                                                            name="Assessments"
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* Bar chart - average completion time */}
                                            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                                                <h3 className="text-lg font-semibold text-white mb-4">
                                                    Average Completion Time
                                                </h3>
                                                <ResponsiveContainer
                                                    width="100%"
                                                    height={300}
                                                >
                                                    <BarChart
                                                        data={
                                                            data.completionTimeByMonth
                                                        }
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
                                                                borderRadius:
                                                                    '8px',
                                                            }}
                                                        />
                                                        <Bar
                                                            dataKey="days"
                                                            fill="#3b82f6"
                                                            name="Days"
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

                    {/* Assessments Activity Section */}
                    {(showAllSections || assessmentsSubTab === 'activity') && (
                        <div className="space-y-6">
                            <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-amber-500" />
                                        Live Activity Feed
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
                                                        new Date(
                                                            activity.timestamp
                                                        ),
                                                        'MMM dd, yyyy HH:mm'
                                                    )}
                                                </p>
                                            </div>
                                            <span
                                                className={`px-2 py-1 rounded text-xs ${
                                                    activity.status ===
                                                    'completed'
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : activity.status ===
                                                          'processing'
                                                        ? 'bg-blue-500/20 text-blue-400'
                                                        : 'bg-yellow-500/20 text-yellow-400'
                                                }`}
                                            >
                                                {activity.status}
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
                                        Download data as CSV
                                    </span>
                                </button>
                                <button
                                    onClick={exportToExcel}
                                    disabled={
                                        exporting && exportType === 'excel'
                                    }
                                    className="flex flex-col items-center gap-2 p-4 bg-black/30 border border-gray-800 rounded-lg hover:bg-black/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Download className="w-6 h-6 text-amber-500" />
                                    <span className="text-white font-medium text-sm">
                                        Export to Excel
                                    </span>
                                    <span className="text-gray-400 text-xs">
                                        Download data as Excel
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
                                        Create monthly PDF report
                                    </span>
                                </button>
                                <button
                                    onClick={async () => {
                                        setExporting(true);
                                        setExportType('email');
                                        try {
                                            const response = await fetch(
                                                '/api/analytics/report/email',
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
                                            const result =
                                                await response.json();
                                            showSuccess(
                                                result.message ||
                                                    'Monthly report email sent successfully!'
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
                                    disabled={
                                        exporting && exportType === 'email'
                                    }
                                    className="flex flex-col items-center gap-2 p-4 bg-black/30 border border-gray-800 rounded-lg hover:bg-black/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Mail className="w-6 h-6 text-amber-500" />
                                    <span className="text-white font-medium text-sm">
                                        Email Report
                                    </span>
                                    <span className="text-gray-400 text-xs">
                                        Send report via email
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Complaints Tab Content */}
            {activeMainTab === 'complaints' && (
                <ComplaintsStatsOverview
                    activeSubTab={
                        showAllSections ? undefined : complaintsSubTab
                    }
                    onSubTabChange={
                        showAllSections ? undefined : setComplaintsSubTab
                    }
                    showAllSections={showAllSections}
                />
            )}
        </div>
    );
};
