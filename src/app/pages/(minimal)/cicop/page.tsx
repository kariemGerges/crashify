'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, RefreshCw, Download, Plus } from 'lucide-react';
import Link from 'next/link';

// Types
interface Assessment {
    assessment_no: number;
    claim_number?: string;
    status?: string;
    client?: string;
    insurer?: string;
    vehicle?: string;
    rego?: string;
    make?: string;
    model?: string;
    date_received?: string;
    _completeness?: {
        percentage: number;
        filled: number;
        total: number;
    };
}

interface KPIData {
    total: number;
    completed: number;
    in_progress: number;
    avg_completeness: number;
}

interface SLAStatus {
    total: number;
    in_progress: number;
    completed: number;
    overdue: number;
    compliance_rate: number;
    active_claims: Array<{
        claim_ref: string;
        vehicle: string;
        insurer: string;
        hours_remaining: number;
        is_overdue: boolean;
        status: string;
    }>;
}

interface DashboardStats {
    total_assessments: number;
    total_savings: number;
    total_savings_formatted: string;
    current_month_savings: number;
    current_month_savings_formatted: string;
    avg_savings_percentage: number;
    prevented_total_losses: number;
    current_month_prevented_losses: number;
    fraud_cases: number;
    fraud_amount_blocked: number;
    fraud_amount_blocked_formatted: string;
    total_quoted: number;
    total_quoted_formatted: string;
    total_assessed: number;
    total_assessed_formatted: string;
    total_loss_ratio: number;
    compliance_rate: number;
    value_preserved: number;
    value_preserved_formatted: string;
}

// Skeleton for loading states (pulse animation)
function Skeleton({
    className = '',
    style = 'bar',
}: {
    className?: string;
    style?: 'bar' | 'short' | 'full';
}) {
    const heightClass =
        style === 'bar' ? 'h-6' : style === 'short' ? 'h-4' : 'h-8';
    return (
        <div
            className={`animate-pulse rounded bg-slate-600/50 ${heightClass} ${className}`}
            aria-hidden
        />
    );
}

export default function CICOPDashboard() {
    const [activeTab, setActiveTab] = useState('executive');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Assessment[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Filters
    const [filterInsurer, setFilterInsurer] = useState('all');
    const [filterDateRange, setFilterDateRange] = useState('last-30');
    const [filterRepairer, setFilterRepairer] = useState('all');
    const [filterMake, setFilterMake] = useState('all');
    const [filterClaimType, setFilterClaimType] = useState('all');

    // Data
    const [kpiData, setKpiData] = useState<KPIData | null>(null);
    const [slaStatus, setSlaStatus] = useState<SLAStatus | null>(null);
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
        null
    );
    const [loading, setLoading] = useState(true);

    // Filter options (from real data)
    const insurers = [
        'RACV',
        'RACQ INSURANCE',
        'QBE INSURANCE',
        'ZURICH AUSTRALIAN INSURANCE LIMITED',
    ];
    const repairers = [
        'SUPER PRO SMASH REPAIRS',
        'TIMES AUTOMOTIVE PTY LTD',
        'VANSH MECHANICAL & SMASH REPAIRS',
    ];
    const makes = [
        'Toyota',
        'Ford',
        'Mazda',
        'Honda',
        'Hyundai',
        'Kia',
        'BMW',
        'Mercedes Benz',
    ];
    const claimTypes = [
        'Light Vehicle Repair',
        '3rd Party Total Loss - FNR',
        'Heavy Vehicle Repair',
    ];

    // Build filter query string and load dashboard data (refetch when filters change)
    const loadDashboardData = useCallback(async () => {
        setLoading(true);
        const p = new URLSearchParams();
        if (filterInsurer && filterInsurer !== 'all')
            p.set('insurer', filterInsurer);
        if (filterDateRange && filterDateRange !== 'all')
            p.set('date_range', filterDateRange);
        if (filterRepairer && filterRepairer !== 'all')
            p.set('repairer', filterRepairer);
        if (filterMake && filterMake !== 'all')
            p.set('vehicle_make', filterMake);
        if (filterClaimType && filterClaimType !== 'all')
            p.set('assessment_type', filterClaimType);
        const q = p.toString() ? `?${p.toString()}` : '';
        try {
            const [statsRes, slaRes, dashboardRes] = await Promise.all([
                fetch(`/api/cicop/assessments/stats${q}`),
                fetch('/api/cicop/sla-status'),
                fetch(`/api/cicop/dashboard-stats${q}`),
            ]);

            if (statsRes.ok) {
                const stats = await statsRes.json();
                setKpiData(stats);
            }

            if (slaRes.ok) {
                const sla = await slaRes.json();
                setSlaStatus(sla);
            }

            if (dashboardRes.ok) {
                const dashboard = await dashboardRes.json();
                setDashboardStats(dashboard);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }, [
        filterInsurer,
        filterDateRange,
        filterRepairer,
        filterMake,
        filterClaimType,
    ]);

    useEffect(() => {
        loadDashboardData();
        const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, [loadDashboardData]);

    // Search handler: debounced fetch when term >= 2 chars
    useEffect(() => {
        if (searchTerm.length < 2) {
            setShowSearchResults(false);
            setSearchResults([]);
            setSearchError(null);
            setIsSearching(false);
            return;
        }

        const debounce = setTimeout(async () => {
            setIsSearching(true);
            setSearchError(null);
            try {
                const res = await fetch(
                    `/api/cicop/search?q=${encodeURIComponent(
                        searchTerm.trim()
                    )}`
                );
                const data = await res.json();
                if (!res.ok) {
                    setSearchError(data.error || 'Search failed');
                    setSearchResults([]);
                    setShowSearchResults(true);
                    return;
                }
                setSearchResults(data.results || []);
                setShowSearchResults(true);
            } catch (error) {
                console.error('Search error:', error);
                setSearchError('Search failed. Try again.');
                setSearchResults([]);
                setShowSearchResults(true);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(debounce);
    }, [searchTerm]);

    // Close search dropdown on click outside or Escape
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(e.target as Node)
            ) {
                setShowSearchResults(false);
            }
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowSearchResults(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans antialiased">
            {/* Top bar */}
            <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800/80">
                <Link
                    href="/pages/cicop"
                    className="flex items-center shrink-0 mr-8"
                >
                    <span className="text-lg font-semibold tracking-tight text-white">
                        CRASHIFY
                    </span>
                    <span className="text-lg font-semibold tracking-tight text-red-500 ml-1">
                        CICOP
                    </span>
                </Link>

                <div
                    className="flex-1 max-w-xl relative"
                    ref={searchContainerRef}
                >
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search claim number, rego, VIN, customer..."
                        className="w-full h-10 pl-11 pr-4 rounded-xl bg-neutral-800/80 border border-neutral-700/80 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-neutral-600 focus:ring-2 focus:ring-neutral-700/50"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onFocus={() =>
                            searchTerm.length >= 2 && setShowSearchResults(true)
                        }
                    />
                    {showSearchResults && (
                        <div className="absolute top-full mt-2 left-0 right-0 z-50 rounded-xl border border-neutral-700/80 bg-neutral-900 shadow-2xl shadow-black/40 max-h-[28rem] overflow-y-auto">
                            {isSearching ? (
                                <div className="p-5 flex items-center justify-center gap-2 text-neutral-400 text-sm">
                                    <RefreshCw className="size-4 animate-spin" />
                                    Searching...
                                </div>
                            ) : searchError ? (
                                <div className="p-5 text-center text-red-400 text-sm">
                                    {searchError}
                                </div>
                            ) : searchResults.length > 0 ? (
                                searchResults.map(result => (
                                    <Link
                                        key={result.assessment_no}
                                        href={`/pages/cicop/assessment/${result.assessment_no}`}
                                        className="block px-4 py-3 border-b border-neutral-800/80 last:border-0 hover:bg-neutral-800/60 transition-colors"
                                    >
                                        <div className="flex justify-between items-start gap-2 mb-1.5">
                                            <span className="font-medium text-sm text-white tabular-nums">
                                                #{result.assessment_no} ·{' '}
                                                {result.claim_number || 'N/A'}
                                            </span>
                                            <span className="shrink-0 px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 text-[11px] font-medium">
                                                {result.status}
                                            </span>
                                        </div>
                                        <div className="flex gap-4 text-xs text-neutral-400">
                                            <span>
                                                {result.make} {result.model}
                                            </span>
                                            <span>{result.rego || 'N/A'}</span>
                                            <span>
                                                {result.insurer || 'N/A'}
                                            </span>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="p-5 text-center text-neutral-400 text-sm">
                                    No results for &quot;{searchTerm}&quot;
                                    <p className="text-neutral-500 text-xs mt-1">
                                        Try claim number, rego, VIN, or customer
                                        name
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <button
                    onClick={loadDashboardData}
                    className="shrink-0 ml-4 h-10 w-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                    title="Refresh"
                >
                    <RefreshCw
                        size={18}
                        className={loading ? 'animate-spin' : ''}
                    />
                </button>
            </header>

            <div className="flex pt-16">
                <aside className="fixed left-0 top-16 w-56 h-[calc(100vh-4rem)] border-r border-neutral-800/80 bg-neutral-900/50 overflow-y-auto">
                    <nav className="p-3 space-y-6">
                        <div>
                            <p className="px-3 mb-1.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">
                                Executive
                            </p>
                            <NavItem
                                label="Executive Command Centre"
                                active={activeTab === 'executive'}
                                onClick={() => setActiveTab('executive')}
                            />
                            <NavItem
                                label="Savings Attribution"
                                active={activeTab === 'savings'}
                                onClick={() => setActiveTab('savings')}
                            />
                            <NavItem
                                label="Vehicle Intelligence"
                                active={activeTab === 'vehicle-intelligence'}
                                onClick={() =>
                                    setActiveTab('vehicle-intelligence')
                                }
                            />
                        </div>
                        <div>
                            <p className="px-3 mb-1.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">
                                Workspaces
                            </p>
                            <NavItem
                                label="Assessment View"
                                active={activeTab === 'assessment'}
                                onClick={() => setActiveTab('assessment')}
                            />
                            <NavItem
                                label="Cost Control"
                                active={activeTab === 'cost-control'}
                                onClick={() => setActiveTab('cost-control')}
                            />
                            <NavItem
                                label="Fraud & Risk"
                                active={activeTab === 'fraud-risk'}
                                onClick={() => setActiveTab('fraud-risk')}
                            />
                            <NavItem
                                label="Repairer Network"
                                active={activeTab === 'repairer-network'}
                                onClick={() => setActiveTab('repairer-network')}
                            />
                        </div>
                        <div>
                            <p className="px-3 mb-1.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">
                                AI
                            </p>
                            <NavItem
                                label="AI Health Dashboard"
                                active={activeTab === 'ai-health'}
                                onClick={() => setActiveTab('ai-health')}
                            />
                            <NavItem
                                label="Triage Engine"
                                active={activeTab === 'triage'}
                                onClick={() => setActiveTab('triage')}
                            />
                        </div>
                    </nav>
                </aside>

                <main className="ml-56 flex-1 min-h-[calc(100vh-4rem)] p-6">
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest mr-1">
                            Filters
                        </span>
                        <FilterSelect
                            label="Insurer"
                            value={filterInsurer}
                            onChange={setFilterInsurer}
                            options={['all', ...insurers]}
                        />
                        <FilterSelect
                            label="Date"
                            value={filterDateRange}
                            onChange={setFilterDateRange}
                            options={[
                                'last-7',
                                'last-30',
                                'last-90',
                                'this-year',
                            ]}
                        />
                        <FilterSelect
                            label="Repairer"
                            value={filterRepairer}
                            onChange={setFilterRepairer}
                            options={['all', ...repairers]}
                        />
                        <FilterSelect
                            label="Make"
                            value={filterMake}
                            onChange={setFilterMake}
                            options={['all', ...makes]}
                        />
                        <FilterSelect
                            label="Claim type"
                            value={filterClaimType}
                            onChange={setFilterClaimType}
                            options={['all', ...claimTypes]}
                        />
                        {(filterInsurer !== 'all' ||
                            filterDateRange !== 'last-30' ||
                            filterRepairer !== 'all' ||
                            filterMake !== 'all' ||
                            filterClaimType !== 'all') && (
                            <button
                                type="button"
                                onClick={() => {
                                    setFilterInsurer('all');
                                    setFilterDateRange('last-30');
                                    setFilterRepairer('all');
                                    setFilterMake('all');
                                    setFilterClaimType('all');
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* KPI row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        <KPITile
                            label="TOTAL CLAIMS"
                            value={kpiData?.total?.toString() || '-'}
                            trend="Total claims"
                            loading={loading}
                        />
                        <KPITile
                            label="INSPECTION TYPE"
                            value="-"
                            trend="Inspection Split"
                            loading={loading}
                        />
                        <KPITile
                            label="COMPLETION RATE"
                            value={
                                kpiData
                                    ? `${Math.round(
                                          kpiData.avg_completeness || 0
                                      )}%`
                                    : '-'
                            }
                            trend="Avg completeness"
                            loading={loading}
                        />
                        <KPITile
                            label="INITIAL QUOTE"
                            value={
                                dashboardStats?.total_quoted_formatted || '-'
                            }
                            trend="Total quoted"
                            loading={loading}
                        />
                        <KPITile
                            label="ASSESSED AMOUNT"
                            value={
                                dashboardStats?.total_assessed_formatted || '-'
                            }
                            trend="After savings"
                            loading={loading}
                        />
                        <KPITile
                            label="SUPPLEMENTARY ADDED"
                            value="-"
                            trend="Additional costs"
                            loading={loading}
                        />
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <KPITile
                            label="ESTIMATED CLAIM RESERVE"
                            value={
                                dashboardStats?.total_assessed_formatted || '-'
                            }
                            trend="Total reserves"
                            loading={loading}
                        />
                        <KPITile
                            label="TOTAL LOSS RATIO"
                            value={
                                dashboardStats
                                    ? `${dashboardStats.total_loss_ratio}%`
                                    : '-'
                            }
                            trend="Industry avg: 12%"
                            loading={loading}
                        />
                        <KPITile
                            label="SAVINGS ACHIEVED"
                            value={
                                dashboardStats?.total_savings_formatted || '-'
                            }
                            trend={
                                dashboardStats
                                    ? `${dashboardStats.avg_savings_percentage}% reduction`
                                    : 'Avg reduction'
                            }
                            loading={loading}
                            color="red"
                        />
                        <KPITile
                            label="REPAIRER COMPLIANCE"
                            value={
                                dashboardStats
                                    ? `${dashboardStats.compliance_rate}%`
                                    : '-'
                            }
                            trend="Network compliance"
                            loading={loading}
                            color="slate"
                        />
                    </div>

                    <div className="flex flex-wrap gap-3 mb-8">
                        <Link
                            href="/pages/cicop/assessment/new"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition-colors"
                        >
                            Add Assessment
                        </Link>
                        <Link
                            href="/pages/cicop/monitor"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-medium text-sm transition-colors"
                        >
                            Monitor
                        </Link>
                        <Link
                            href="/pages/cicop/browse"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-medium text-sm transition-colors"
                        >
                            Browse ({kpiData?.total ?? '—'})
                        </Link>
                        <Link
                            href="/pages/cicop/email-monitor"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-medium text-sm transition-colors"
                        >
                            Email
                        </Link>
                    </div>

                    {/* Workspace Content */}
                    {activeTab === 'executive' && (
                        <ExecutiveWorkspace
                            slaStatus={slaStatus}
                            dashboardStats={dashboardStats}
                            loading={loading}
                        />
                    )}
                    {activeTab === 'savings' && (
                        <PlaceholderWorkspace title="Savings Attribution" />
                    )}
                    {activeTab === 'vehicle-intelligence' && (
                        <PlaceholderWorkspace title="Vehicle Intelligence" />
                    )}
                    {activeTab === 'assessment' && (
                        <PlaceholderWorkspace title="Assessment View" />
                    )}
                    {activeTab === 'cost-control' && (
                        <PlaceholderWorkspace title="Cost Control" />
                    )}
                    {activeTab === 'fraud-risk' && (
                        <PlaceholderWorkspace title="Fraud & Risk" />
                    )}
                    {activeTab === 'repairer-network' && (
                        <PlaceholderWorkspace title="Repairer Network" />
                    )}
                    {activeTab === 'ai-health' && (
                        <PlaceholderWorkspace title="AI Health Dashboard" />
                    )}
                    {activeTab === 'triage' && (
                        <PlaceholderWorkspace title="Triage Engine" />
                    )}
                </main>
            </div>
        </div>
    );
}

// Components
function NavItem({ label, active, onClick }: any) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full text-left px-3 py-2 rounded-r-lg text-sm font-medium transition-colors ${
                active
                    ? 'bg-neutral-800 text-white border-l-2 border-l-red-500 -ml-px pl-[11px]'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 border-l-2 border-l-transparent'
            }`}
        >
            {label}
        </button>
    );
}

function FilterSelect({ label, value, onChange, options }: any) {
    return (
        <div className="flex items-center gap-2">
            <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest shrink-0">
                {label}
            </label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="h-9 px-3 rounded-lg bg-neutral-800/80 border border-neutral-700/80 text-white text-sm cursor-pointer focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600"
            >
                {options.map((opt: string) => (
                    <option key={opt} value={opt} className="bg-neutral-800">
                        {opt === 'all'
                            ? 'All'
                            : opt
                                  .replace(/-/g, ' ')
                                  .replace(/\b\w/g, (l: string) =>
                                      l.toUpperCase()
                                  )}
                    </option>
                ))}
            </select>
        </div>
    );
}

function KPITile({ label, value, trend, loading, color = 'slate' }: any) {
    return (
        <div
            className={`rounded-2xl border p-4 transition-colors ${
                color === 'red'
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'border-neutral-800 bg-neutral-900/60'
            }`}
        >
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest mb-1.5">
                {label}
            </p>
            <div className="text-2xl font-semibold tabular-nums min-h-[2rem] flex items-center">
                {loading ? <Skeleton className="w-14" style="bar" /> : value}
            </div>
            <p className="text-[11px] text-neutral-500 min-h-[1rem] mt-0.5">
                {loading ? <Skeleton className="w-20" style="short" /> : trend}
            </p>
        </div>
    );
}

function ExecutiveWorkspace({
    slaStatus,
    dashboardStats,
    loading,
}: {
    slaStatus: SLAStatus | null;
    dashboardStats: DashboardStats | null;
    loading: boolean;
}) {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <BigStatCard
                    title="Total Monthly Savings"
                    value={
                        dashboardStats?.current_month_savings_formatted || '-'
                    }
                    subtitle="vs Repairer Quotes"
                    trend="Savings Trend"
                    trendValue={
                        dashboardStats
                            ? `${dashboardStats.avg_savings_percentage}% vs quotes`
                            : '-'
                    }
                    actionText="View Details"
                    loading={loading}
                />
                <BigStatCard
                    title="Prevented Total Losses"
                    value={
                        dashboardStats?.current_month_prevented_losses?.toString() ||
                        '-'
                    }
                    subtitle="Vehicles Saved This Month"
                    trend="Value Preserved"
                    trendValue={
                        dashboardStats?.value_preserved_formatted || '-'
                    }
                    actionText="View List"
                    loading={loading}
                />
                <BigStatCard
                    title="Fraud Prevented"
                    value={
                        dashboardStats?.fraud_amount_blocked_formatted || '-'
                    }
                    subtitle="Estimated Fraud Blocked"
                    trend="Cases Identified"
                    trendValue={
                        dashboardStats
                            ? `${dashboardStats.fraud_cases} cases`
                            : '-'
                    }
                    actionText="View Cases"
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <MediumStatCard
                    title="SLA Breach Forecast"
                    value={slaStatus?.overdue?.toString() || '0'}
                    subtitle="at-risk claims (7 days)"
                    details={[
                        { label: '14 days', value: slaStatus?.overdue || 0 },
                        {
                            label: '30 days',
                            value: slaStatus?.in_progress || 0,
                        },
                    ]}
                    loading={loading}
                />
                <MediumStatCard
                    title="Repairer Network Health"
                    value={
                        dashboardStats
                            ? `${dashboardStats.compliance_rate}%`
                            : '-'
                    }
                    subtitle="Network Health Score"
                    details={[
                        {
                            label: 'Gold Tier',
                            value: dashboardStats
                                ? Math.round(
                                      dashboardStats.compliance_rate * 0.3
                                  )
                                : '-',
                        },
                        {
                            label: 'Silver Tier',
                            value: dashboardStats
                                ? Math.round(
                                      dashboardStats.compliance_rate * 0.5
                                  )
                                : '-',
                        },
                        {
                            label: 'Watchlist',
                            value: dashboardStats
                                ? Math.round(
                                      dashboardStats.total_assessments * 0.05
                                  )
                                : '-',
                        },
                    ]}
                    loading={loading}
                />
                <MediumStatCard
                    title="Assessment Capacity"
                    value={
                        dashboardStats
                            ? `${Math.round(
                                  (dashboardStats.total_assessments / 500) * 100
                              )}%`
                            : '-'
                    }
                    subtitle="Capacity Used"
                    details={[
                        {
                            label: 'Current',
                            value: dashboardStats?.total_assessments || '-',
                        },
                        { label: 'Max', value: '500' },
                        {
                            label: 'Available',
                            value: dashboardStats
                                ? `${
                                      500 - dashboardStats.total_assessments
                                  } slots`
                                : '- slots',
                        },
                    ]}
                    loading={loading}
                />
            </div>

            <div className="pt-4">
                <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-widest mb-4">
                    Advanced Analytics
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                    <AnalyticsCard
                        title="Repairer Risk Index"
                        stats={[
                            { label: 'Trusted', value: '-', color: 'slate' },
                            { label: 'Standard', value: '-', color: 'slate' },
                            { label: 'Elevated', value: '-', color: 'slate' },
                            { label: 'High Risk', value: '-', color: 'red' },
                        ]}
                    />
                    <AnalyticsCard
                        title="Savings Scorecard"
                        loading={loading}
                        content={
                            <div className="space-y-3 mt-3">
                                <div>
                                    <div className="text-xs text-slate-400">
                                        Total Savings This Month
                                    </div>
                                    <div className="text-2xl font-bold min-h-[2rem] flex items-center">
                                        {loading ? (
                                            <Skeleton
                                                className="w-24 h-8 rounded"
                                                style="full"
                                            />
                                        ) : (
                                            dashboardStats?.current_month_savings_formatted ||
                                            '-'
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div>
                                        <div className="text-xs text-slate-400">
                                            Quote Reduction
                                        </div>
                                        <div className="text-xl font-bold min-h-[1.5rem] flex items-center">
                                            {loading ? (
                                                <Skeleton
                                                    className="w-12 h-6 rounded"
                                                    style="bar"
                                                />
                                            ) : dashboardStats ? (
                                                `${dashboardStats.avg_savings_percentage}%`
                                            ) : (
                                                '-'
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-400">
                                            ROI
                                        </div>
                                        <div className="text-xl font-bold min-h-[1.5rem] flex items-center">
                                            {loading ? (
                                                <Skeleton
                                                    className="w-10 h-6 rounded"
                                                    style="bar"
                                                />
                                            ) : dashboardStats ? (
                                                `${(
                                                    dashboardStats.avg_savings_percentage *
                                                    10
                                                ).toFixed(0)}x`
                                            ) : (
                                                '-'
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                    />
                    <AnalyticsCard
                        title="Assessor Performance"
                        loading={loading}
                        content={
                            loading ? (
                                <div className="space-y-2 py-6">
                                    <Skeleton
                                        className="w-full h-10 rounded"
                                        style="bar"
                                    />
                                    <Skeleton
                                        className="w-4/5 h-8 rounded mx-auto"
                                        style="bar"
                                    />
                                    <Skeleton
                                        className="w-3/4 h-8 rounded mx-auto"
                                        style="bar"
                                    />
                                </div>
                            ) : (
                                <div className="text-center text-slate-500 py-6 text-sm">
                                    — Coming soon
                                </div>
                            )
                        }
                    />
                    <AnalyticsCard
                        title="SLA Risk Monitor"
                        loading={loading}
                        stats={[
                            {
                                label: 'High Risk',
                                value: slaStatus?.overdue?.toString() || '0',
                                color: 'red',
                            },
                            {
                                label: 'On Track',
                                value: slaStatus
                                    ? (
                                          (slaStatus.in_progress || 0) -
                                          (slaStatus.overdue || 0)
                                      ).toString()
                                    : '0',
                                color: 'slate',
                            },
                        ]}
                    />
                    <AnalyticsCard
                        title="Triage Efficiency"
                        content={
                            <div className="space-y-2 mt-3">
                                <div className="text-xs text-slate-400">
                                    Desktop vs Onsite Split
                                </div>
                                <div className="flex gap-4">
                                    <div>
                                        <div className="text-xs text-slate-500">
                                            Desktop
                                        </div>
                                        <div className="text-xl font-bold">
                                            -
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500">
                                            Onsite
                                        </div>
                                        <div className="text-xl font-bold">
                                            -
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                    />
                </div>
            </div>

            {slaStatus && slaStatus.active_claims.length > 0 && (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 mt-8">
                    <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-4">
                        Active SLA Claims
                    </h3>
                    <div className="space-y-2">
                        {slaStatus.active_claims.map(claim => (
                            <div
                                key={claim.claim_ref}
                                className={`flex justify-between items-center p-4 rounded-xl border ${
                                    claim.is_overdue
                                        ? 'border-red-500/50 bg-red-500/10'
                                        : 'border-neutral-700/80 bg-neutral-800/40'
                                }`}
                            >
                                <div>
                                    <p className="font-medium text-white tabular-nums">
                                        {claim.claim_ref}
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                        {claim.vehicle} · {claim.insurer}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p
                                        className={`font-semibold text-sm tabular-nums ${
                                            claim.is_overdue
                                                ? 'text-red-400'
                                                : 'text-neutral-300'
                                        }`}
                                    >
                                        {claim.is_overdue
                                            ? 'Overdue'
                                            : `${Math.abs(
                                                  claim.hours_remaining
                                              ).toFixed(1)}h left`}
                                    </p>
                                    <p className="text-[11px] text-neutral-500 capitalize">
                                        {claim.status}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function BigStatCard({
    title,
    value,
    subtitle,
    trend,
    trendValue,
    actionText,
    loading,
}: any) {
    return (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 hover:border-neutral-700 transition-colors">
            <p className="text-sm font-medium text-neutral-400 mb-1">{title}</p>
            <div className="text-4xl font-semibold tabular-nums min-h-[2.75rem] flex items-center mb-1">
                {loading ? (
                    <Skeleton className="w-24 h-10 rounded-xl" style="full" />
                ) : (
                    value
                )}
            </div>
            <p className="text-xs text-neutral-500 mb-3">{subtitle}</p>
            <div className="flex items-baseline justify-between gap-2">
                <span className="text-[11px] text-neutral-500">{trend}</span>
                <span className="text-sm font-medium text-red-400 min-h-[1.25rem] flex items-center">
                    {loading ? (
                        <Skeleton className="w-20" style="short" />
                    ) : (
                        trendValue
                    )}
                </span>
            </div>
            {actionText && (
                <button
                    type="button"
                    className="mt-4 text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                >
                    {actionText}
                </button>
            )}
        </div>
    );
}

function MediumStatCard({ title, value, subtitle, details, loading }: any) {
    return (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
            <p className="text-sm font-medium text-neutral-400 mb-1">{title}</p>
            <div className="text-3xl font-semibold tabular-nums min-h-[2.25rem] flex items-center mb-1">
                {loading ? (
                    <Skeleton className="w-16 h-9 rounded-lg" style="full" />
                ) : (
                    value
                )}
            </div>
            <p className="text-[11px] text-neutral-500 mb-4">{subtitle}</p>
            {details && (
                <div className="space-y-2">
                    {details.map((detail: any, idx: number) => (
                        <div
                            key={idx}
                            className="flex justify-between text-xs items-center"
                        >
                            <span className="text-neutral-500">
                                {detail.label}
                            </span>
                            <span className="text-neutral-300 font-medium tabular-nums text-right min-w-[2rem]">
                                {loading ? (
                                    <Skeleton
                                        className="w-8 h-4 inline-block rounded"
                                        style="short"
                                    />
                                ) : (
                                    detail.value
                                )}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function AnalyticsCard({ title, stats, content, loading }: any) {
    return (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
            <p className="text-sm font-medium text-neutral-400 mb-4">{title}</p>
            {stats && (
                <div className="space-y-2.5">
                    {stats.map((stat: any, idx: number) => (
                        <div
                            key={idx}
                            className="flex justify-between items-center"
                        >
                            <span className="text-xs text-neutral-500">
                                {stat.label}
                            </span>
                            <span
                                className={`text-sm font-semibold tabular-nums ${
                                    stat.color === 'red'
                                        ? 'text-red-400'
                                        : 'text-neutral-300'
                                }`}
                            >
                                {loading ? (
                                    <Skeleton
                                        className="w-10 h-4 rounded"
                                        style="short"
                                    />
                                ) : (
                                    stat.value
                                )}
                            </span>
                        </div>
                    ))}
                </div>
            )}
            {content && <div className="mt-4">{content}</div>}
        </div>
    );
}

function PlaceholderWorkspace({ title }: { title: string }) {
    return (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-12 text-center">
            <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
            <p className="text-sm text-neutral-500">
                {title.replace(/^[^\s]+\s/, '')} coming soon.
            </p>
        </div>
    );
}
