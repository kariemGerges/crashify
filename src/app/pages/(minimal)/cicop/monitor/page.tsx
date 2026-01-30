'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  RefreshCw, 
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity
} from 'lucide-react';

interface Assessment {
  assessment_no: number;
  claim_number?: string;
  status?: string;
  customer_name?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  insurer?: string;
  date_received?: string;
  priority?: string;
  assigned_to?: string;
  workflow_stage?: string;
  data_completeness?: number;
}

interface SLAItem {
  claim_ref: string;
  vehicle: string;
  insurer: string;
  hours_remaining: number;
  is_overdue: boolean;
  status: string;
}

function AssessmentMonitorContent() {
  const searchParams = useSearchParams();
  const fromAdmin = searchParams?.get('from') === 'admin';
  const backHref = '/pages/admin?tab=dashboard';
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [slaData, setSlaData] = useState<{ active_claims: SLAItem[] }>({ active_claims: [] });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadData();
    
    if (autoRefresh) {
      const interval = setInterval(loadData, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadData = async () => {
    try {
      const [assessRes, slaRes] = await Promise.all([
        fetch('/api/cicop/assessments?status=In Progress'),
        fetch('/api/cicop/sla-status')
      ]);

      if (assessRes.ok) {
        const data = await assessRes.json();
        setAssessments(data);
      }

      if (slaRes.ok) {
        const data = await slaRes.json();
        setSlaData(data);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading monitor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const urgentAssessments = assessments.filter(a => a.priority === 'Urgent' || a.priority === 'High');
  const todayAssessments = assessments.filter(a => {
    if (!a.date_received) return false;
    const today = new Date().toISOString().split('T')[0];
    return a.date_received.split('T')[0] === today;
  });

  const workflowStages = ['Received', 'In Review', 'Assessment Scheduled', 'Assessment Complete', 'Report Generated', 'Sent to Client'];
  const stageCount = workflowStages.map(stage => ({
    stage,
    count: assessments.filter(a => a.workflow_stage === stage).length
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white font-sans antialiased p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex justify-between items-center mb-6 rounded-xl border border-amber-500/20 bg-gray-900/50 p-6">
          <div className="flex items-center gap-4">
            <Link href={backHref} className="p-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-400 hover:text-white transition-all duration-200 active:scale-95">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-white">Assessment Monitor</h1>
              <p className="text-gray-500 text-sm mt-0.5">Real-time · Last updated: {lastUpdate.toLocaleTimeString()}</p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500/50" />
              Auto-refresh (30s)
            </label>
            <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white text-sm font-medium transition-all duration-200 active:scale-[0.98]">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard icon={<Activity className="text-gray-400" size={28} />} label="Active Assessments" value={assessments.length} trend="In progress" color="slate" />
          <MetricCard icon={<AlertTriangle className="text-red-400" size={28} />} label="Urgent Items" value={urgentAssessments.length} trend={urgentAssessments.length > 0 ? 'Requires attention' : 'All clear'} color="red" />
          <MetricCard icon={<Clock className="text-gray-400" size={28} />} label="SLA Active" value={slaData.active_claims?.length || 0} trend={`${slaData.active_claims?.filter(c => c.is_overdue).length || 0} overdue`} color="slate" />
          <MetricCard icon={<TrendingUp className="text-gray-400" size={28} />} label="Today's Intake" value={todayAssessments.length} trend="New assessments" color="slate" />
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-gray-900/50 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Workflow Pipeline</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stageCount.map(({ stage, count }) => (
              <div key={stage} className="rounded-lg p-4 border border-amber-500/20 bg-gray-900/50 hover:border-amber-500/40 transition-all duration-200 hover:-translate-y-0.5">
                <div className="text-2xl font-semibold text-white tabular-nums mb-1">{count}</div>
                <div className="text-[11px] text-gray-500 uppercase tracking-wide">{stage}</div>
              </div>
            ))}
          </div>
        </div>

        {slaData.active_claims && slaData.active_claims.length > 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-gray-900/50 p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">SLA Status ({slaData.active_claims.length} active)</h2>
            <div className="space-y-2">
              {slaData.active_claims.slice(0, 10).map((sla, idx) => (
                <SLAStatusItem key={idx} sla={sla} />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {urgentAssessments.length > 0 && (
            <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-6">
              <h2 className="text-sm font-semibold text-red-400 uppercase tracking-widest mb-4">Urgent Priority ({urgentAssessments.length})</h2>
              <div className="space-y-3">
                {urgentAssessments.map(assessment => (
                  <AssessmentCard key={assessment.assessment_no} assessment={assessment} urgent fromAdmin={fromAdmin} />
                ))}
              </div>
            </div>
          )}
          <div className="rounded-xl border border-amber-500/20 bg-gray-900/50 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {assessments.slice(0, 5).map(assessment => (
                <AssessmentCard key={assessment.assessment_no} assessment={assessment} fromAdmin={fromAdmin} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-amber-500/20 bg-gray-900/50 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">All Active Assessments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assessments.map(assessment => (
              <AssessmentCard key={assessment.assessment_no} assessment={assessment} compact fromAdmin={fromAdmin} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssessmentMonitorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center p-6">
        <RefreshCw className="animate-spin size-6 text-gray-500" />
      </div>
    }>
      <AssessmentMonitorContent />
    </Suspense>
  );
}

// Components
function MetricCard({ icon, label, value, trend, color }: any) {
  const isRed = color === 'red';
  return (
    <div className={`rounded-xl p-5 border ${isRed ? 'border-red-500/30 bg-red-500/5' : 'border-amber-500/20 bg-gray-900/50'}`}>
      <div className="flex items-start justify-between mb-3">
        {icon}
        <div className="text-right">
          <div className="text-3xl font-semibold tabular-nums text-white">{value}</div>
        </div>
      </div>
      <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-xs text-gray-500">{trend}</div>
    </div>
  );
}

function SLAStatusItem({ sla }: { sla: SLAItem }) {
  const isOverdue = sla.is_overdue;
  const isUrgent = !isOverdue && sla.hours_remaining < 6;
  const colorClass = isOverdue ? 'border-red-500/50 bg-red-500/10' : isUrgent ? 'border-amber-500/30 bg-gray-900/50' : 'border-amber-500/20 bg-gray-900/50';
  const getTimeDisplay = () => {
    const hours = Math.abs(sla.hours_remaining);
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    return `${hours.toFixed(1)}h`;
  };
  return (
    <div className={`p-4 rounded-lg border ${colorClass}`}>
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="font-semibold text-white tabular-nums">{sla.claim_ref}</div>
          <div className="text-xs text-gray-500 mt-0.5">{sla.vehicle} · {sla.insurer}</div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-semibold tabular-nums ${isOverdue ? 'text-red-400' : 'text-gray-300'}`}>
            {isOverdue ? `+${getTimeDisplay()}` : getTimeDisplay()}
          </div>
          <div className="text-[11px] text-gray-500 uppercase">{isOverdue ? 'Overdue' : 'Remaining'}</div>
        </div>
      </div>
    </div>
  );
}

function AssessmentCard({ assessment, urgent, compact, fromAdmin }: { assessment: Assessment; urgent?: boolean; compact?: boolean; fromAdmin?: boolean }) {
  const priorityClass = (assessment.priority === 'Urgent' || assessment.priority === 'High') ? 'text-red-400' : 'text-gray-400';
  const assessmentHrefBase = `/pages/cicop/assessment/${assessment.assessment_no}${fromAdmin ? '?from=admin' : ''}`;

  if (compact) {
    return (
      <Link href={assessmentHrefBase} className="block p-4 rounded-xl border border-neutral-800 bg-neutral-800/40 hover:border-neutral-700 hover:bg-neutral-800/60 transition-all duration-200 hover:-translate-y-0.5">
        <div className="flex justify-between items-start mb-2">
          <div className="font-semibold text-red-400 tabular-nums">#{assessment.assessment_no}</div>
          <div className={`text-[11px] font-medium ${priorityClass}`}>{assessment.priority || 'Normal'}</div>
        </div>
        <div className="text-sm text-white mb-1">{assessment.customer_name || 'Unknown'}</div>
        <div className="text-xs text-gray-500">{assessment.vehicle_make} {assessment.vehicle_model}</div>
        <div className="text-[11px] text-gray-500 mt-2">{assessment.workflow_stage || 'N/A'}</div>
      </Link>
    );
  }

  return (
    <Link
      href={assessmentHrefBase}
      className={`block p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${urgent ? 'border-red-500/50 bg-red-500/10 hover:bg-red-500/15' : 'border-neutral-800 bg-neutral-800/40 hover:border-neutral-700 hover:bg-neutral-800/60'}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-semibold text-lg text-red-400 tabular-nums">#{assessment.assessment_no}</div>
          <div className="text-xs text-gray-500 mt-0.5">{assessment.claim_number || 'No claim #'}</div>
        </div>
        <div className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border ${(assessment.priority === 'Urgent' || assessment.priority === 'High') ? 'border-red-500/50 text-red-400' : 'border-gray-600 text-gray-400'}`}>
          {assessment.priority || 'Normal'}
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <div className="text-[11px] text-gray-500 uppercase">Customer</div>
          <div className="text-white font-medium text-sm">{assessment.customer_name || 'Unknown'}</div>
        </div>
        <div>
          <div className="text-[11px] text-gray-500 uppercase">Vehicle</div>
          <div className="text-white text-sm">{assessment.vehicle_make} {assessment.vehicle_model}</div>
        </div>
        <div>
          <div className="text-[11px] text-gray-500 uppercase">Stage</div>
          <div className="text-gray-400 text-sm">{assessment.workflow_stage || 'N/A'}</div>
        </div>
        {assessment.assigned_to && (
          <div>
            <div className="text-[11px] text-gray-500 uppercase">Assigned</div>
            <div className="text-white text-sm">{assessment.assigned_to}</div>
          </div>
        )}
      </div>
    </Link>
  );
}
