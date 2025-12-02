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
} from 'lucide-react';
import { format } from 'date-fns';

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

export const EnhancedStatsOverview: React.FC = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

    useEffect(() => {
        fetchAnalytics(false);

        // Auto-refresh every 30 minutes (1800000 ms)
        const refreshInterval = setInterval(() => {
            fetchAnalytics(false); // Use cache if available
        }, 30 * 60 * 1000);

        return () => clearInterval(refreshInterval);
    }, []);

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
            setLastRefreshed(result.lastRefreshed ? new Date(result.lastRefreshed) : new Date());
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = async () => {
        setExporting(true);
        try {
            const response = await fetch('/api/analytics/export?format=csv', {
                credentials: 'include',
            });
            if (!response.ok) throw new Error('Export failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setExporting(false);
        }
    };

    const exportToExcel = async () => {
        setExporting(true);
        try {
            const response = await fetch('/api/analytics/export?format=xlsx', {
                credentials: 'include',
            });
            if (!response.ok) throw new Error('Export failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setExporting(false);
        }
    };

    const generatePDFReport = async () => {
        setExporting(true);
        try {
            const response = await fetch('/api/analytics/report/pdf', {
                credentials: 'include',
            });
            if (!response.ok) throw new Error('Report generation failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `monthly-report-${format(new Date(), 'yyyy-MM')}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Report generation failed:', error);
        } finally {
            setExporting(false);
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
        return <div className="text-center py-12 text-gray-400">Failed to load analytics</div>;
    }

    const statusChartData = [
        { name: 'Pending', value: data.statusBreakdown.pending },
        { name: 'Processing', value: data.statusBreakdown.processing },
        { name: 'Completed', value: data.statusBreakdown.completed },
        { name: 'Cancelled', value: data.statusBreakdown.cancelled },
    ];

    return (
        <div className="space-y-6">
            {/* Header with refresh button and last refreshed time */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    {lastRefreshed && (
                        <div className="text-sm text-gray-400">
                            Last refreshed: {format(lastRefreshed, 'MMM dd, yyyy HH:mm:ss')}
                        </div>
                    )}
                </div>
                <button
                    onClick={() => {
                        setLoading(true);
                        fetchAnalytics(true); // Force refresh, bypass cache
                    }}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/50 text-amber-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Refresh data (bypasses cache)"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* REQ-52: Alert banner for overdue items */}
            {data.overdue > 0 && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <div>
                            <p className="text-white font-semibold">Overdue Items Alert</p>
                            <p className="text-gray-400 text-sm">
                                {data.overdue} assessment{data.overdue !== 1 ? 's' : ''} are overdue
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <FileText className="w-5 h-5 text-amber-500" />
                        <span className="text-xs text-gray-400">This Month</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{data.totalThisMonth}</p>
                    <p className="text-sm text-gray-400">Total Assessments</p>
                </div>

                <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-xs text-gray-400">Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{data.completionRate}%</p>
                    <p className="text-sm text-gray-400">Completion Rate</p>
                </div>

                <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <span className="text-xs text-gray-400">Average</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {data.averageDaysToComplete.toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-400">Days to Complete</p>
                </div>

                <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        <span className="text-xs text-gray-400">This Month</span>
                    </div>
                    <p className="text-2xl font-bold text-white">${data.revenueThisMonth.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Revenue</p>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* REQ-45: Pie chart - assessments by status */}
                <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Assessments by Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={statusChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {statusChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* REQ-46: Line graph - monthly volume trend */}
                <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Monthly Volume Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data.monthlyTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="month" stroke="#9ca3af" />
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
                                name="Assessments"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* REQ-47: Bar chart - top insurers */}
                <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Top Insurers</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.topInsurers}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
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

                {/* REQ-49: Bar chart - average completion time */}
                <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Average Completion Time</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.completionTimeByMonth}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="month" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1f2937',
                                    border: '1px solid #374151',
                                    borderRadius: '8px',
                                }}
                            />
                            <Bar dataKey="days" fill="#3b82f6" name="Days" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* REQ-51: Live activity feed */}
            <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Bell className="w-5 h-5 text-amber-500" />
                        Live Activity Feed
                    </h3>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {data.activityFeed.map((activity) => (
                        <div
                            key={activity.id}
                            className="bg-black/30 border border-gray-800 rounded-lg p-4 flex items-center justify-between"
                        >
                            <div>
                                <p className="text-white text-sm">{activity.description}</p>
                                <p className="text-gray-400 text-xs mt-1">
                                    {format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}
                                </p>
                            </div>
                            <span
                                className={`px-2 py-1 rounded text-xs ${
                                    activity.status === 'completed'
                                        ? 'bg-green-500/20 text-green-400'
                                        : activity.status === 'processing'
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

            {/* REQ-53, 54, 55: Export buttons */}
            <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Export & Reports</h3>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={exportToCSV}
                        disabled={exporting}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/50 text-amber-500 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        Export to CSV
                    </button>
                    <button
                        onClick={exportToExcel}
                        disabled={exporting}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/50 text-amber-500 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        Export to Excel
                    </button>
                    <button
                        onClick={generatePDFReport}
                        disabled={exporting}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/50 text-amber-500 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <FileText className="w-4 h-4" />
                        Generate PDF Report
                    </button>
                    <button
                        onClick={async () => {
                            // REQ-55: Email monthly report
                            try {
                                const response = await fetch('/api/analytics/report/email', {
                                    method: 'POST',
                                    credentials: 'include',
                                });
                                if (response.ok) {
                                    alert('Monthly report email sent successfully!');
                                }
                            } catch (error) {
                                console.error('Failed to send email:', error);
                            }
                        }}
                        disabled={exporting}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/50 text-amber-500 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Mail className="w-4 h-4" />
                        Email Monthly Report
                    </button>
                </div>
            </div>
        </div>
    );
};

