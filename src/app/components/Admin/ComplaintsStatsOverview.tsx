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
} from 'lucide-react';
import { format } from 'date-fns';

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

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];
const SENTIMENT_COLORS = {
    positive: '#10b981',
    negative: '#ef4444',
};

export const ComplaintsStatsOverview: React.FC = () => {
    const [data, setData] = useState<ComplaintsDashboardData | null>(null);
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
            setLastRefreshed(result.lastRefreshed ? new Date(result.lastRefreshed) : new Date());
        } catch (error) {
            console.error('Failed to fetch complaints analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = async () => {
        setExporting(true);
        try {
            const response = await fetch('/api/analytics/complaints/export?format=csv', {
                credentials: 'include',
            });
            if (!response.ok) throw new Error('Export failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `complaints-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
            const response = await fetch('/api/analytics/complaints/export?format=xlsx', {
                credentials: 'include',
            });
            if (!response.ok) throw new Error('Export failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `complaints-analytics-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
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
            const response = await fetch('/api/analytics/complaints/report/pdf', {
                credentials: 'include',
            });
            if (!response.ok) throw new Error('Report generation failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `complaints-report-${format(new Date(), 'yyyy-MM')}.pdf`;
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
        return <div className="text-center py-12 text-gray-400">Failed to load complaints analytics</div>;
    }

    const statusChartData = [
        { name: 'New', value: data.statusBreakdown.new },
        { name: 'Under Investigation', value: data.statusBreakdown.under_investigation },
        { name: 'Resolved', value: data.statusBreakdown.resolved },
        { name: 'Closed', value: data.statusBreakdown.closed },
    ];

    const sentimentChartData = [
        { name: 'Positive (Resolved/Closed)', value: data.positive, color: SENTIMENT_COLORS.positive },
        { name: 'Negative (Active)', value: data.negative, color: SENTIMENT_COLORS.negative },
    ];

    const priorityChartData = [
        { name: 'Critical', value: data.priorityBreakdown.critical },
        { name: 'High', value: data.priorityBreakdown.high },
        { name: 'Medium', value: data.priorityBreakdown.medium },
        { name: 'Low', value: data.priorityBreakdown.low },
    ];

    // Get score color based on value
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 80) return 'bg-green-500/10 border-green-500/50';
        if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/50';
        return 'bg-red-500/10 border-red-500/50';
    };

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

            {/* Alert banner for overdue items */}
            {data.overdue > 0 && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <div>
                            <p className="text-white font-semibold">Overdue Complaints Alert</p>
                            <p className="text-gray-400 text-sm">
                                {data.overdue} complaint{data.overdue !== 1 ? 's' : ''} {data.overdue !== 1 ? 'are' : 'is'} overdue
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Satisfaction Score */}
                <div className={`bg-gray-900/50 border rounded-xl p-4 ${getScoreBgColor(data.satisfactionScore)}`}>
                    <div className="flex items-center justify-between mb-2">
                        <Award className={`w-5 h-5 ${getScoreColor(data.satisfactionScore)}`} />
                        <span className="text-xs text-gray-400">Score</span>
                    </div>
                    <p className={`text-2xl font-bold ${getScoreColor(data.satisfactionScore)}`}>
                        {data.satisfactionScore}/100
                    </p>
                    <p className="text-sm text-gray-400">Satisfaction Score</p>
                </div>

                <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <FileText className="w-5 h-5 text-amber-500" />
                        <span className="text-xs text-gray-400">This Month</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{data.totalThisMonth}</p>
                    <p className="text-sm text-gray-400">Total Complaints</p>
                </div>

                <div className="bg-gray-900/50 border border-green-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <ThumbsUp className="w-5 h-5 text-green-500" />
                        <span className="text-xs text-gray-400">Resolved</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{data.positive}</p>
                    <p className="text-sm text-gray-400">Positive (Resolved/Closed)</p>
                </div>

                <div className="bg-gray-900/50 border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <ThumbsDown className="w-5 h-5 text-red-500" />
                        <span className="text-xs text-gray-400">Active</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{data.negative}</p>
                    <p className="text-sm text-gray-400">Negative (Active Issues)</p>
                </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-xs text-gray-400">Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{data.resolutionRate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-400">Resolution Rate</p>
                </div>

                <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <span className="text-xs text-gray-400">Average</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {data.averageResolutionTime.toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-400">Days to Resolve</p>
                </div>

                <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        <span className="text-xs text-gray-400">Total</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{data.total}</p>
                    <p className="text-sm text-gray-400">All Time Complaints</p>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie chart - Positive vs Negative */}
                <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Positive vs Negative Complaints</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={sentimentChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {sentimentChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie chart - Complaints by status */}
                <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Complaints by Status</h3>
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
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Line graph - monthly volume trend */}
                <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Monthly Complaint Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data.monthlyTrend}>
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
                    <h3 className="text-lg font-semibold text-white mb-4">Monthly Resolution Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data.resolutionTrend}>
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

            {/* Charts Row 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar chart - top categories */}
                <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Top Complaint Categories</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.topCategories}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis 
                                dataKey="name" 
                                stroke="#9ca3af" 
                                angle={-45} 
                                textAnchor="end" 
                                height={100}
                                tickFormatter={(value) => value.replace(/_/g, ' ')}
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
                    <h3 className="text-lg font-semibold text-white mb-4">Complaints by Priority</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={priorityChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
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

            {/* Live activity feed */}
            <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Bell className="w-5 h-5 text-amber-500" />
                        Recent Complaints Activity
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
                                    activity.status === 'resolved' || activity.status === 'closed'
                                        ? 'bg-green-500/20 text-green-400'
                                        : activity.status === 'under_investigation'
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

            {/* Export buttons */}
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
                            try {
                                const response = await fetch('/api/analytics/complaints/report/email', {
                                    method: 'POST',
                                    credentials: 'include',
                                });
                                if (response.ok) {
                                    alert('Complaints report email sent successfully!');
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

