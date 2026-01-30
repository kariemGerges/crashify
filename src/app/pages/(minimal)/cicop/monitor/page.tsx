'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

export default function AssessmentMonitorPage() {
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
    <div className="min-h-screen bg-neutral-950 text-white font-sans antialiased p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex justify-between items-center mb-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
          <div className="flex items-center gap-4">
            <Link href="/pages/cicop" className="p-2 rounded-xl bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-white">Assessment Monitor</h1>
              <p className="text-neutral-500 text-sm mt-0.5">Real-time · Last updated: {lastUpdate.toLocaleTimeString()}</p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <label className="flex items-center gap-2 text-sm text-neutral-400">
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="w-4 h-4 rounded border-neutral-600 bg-neutral-800" />
              Auto-refresh (30s)
            </label>
            <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-white text-sm font-medium transition-colors">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard icon={<Activity className="text-neutral-400" size={28} />} label="Active Assessments" value={assessments.length} trend="In progress" color="slate" />
          <MetricCard icon={<AlertTriangle className="text-red-400" size={28} />} label="Urgent Items" value={urgentAssessments.length} trend={urgentAssessments.length > 0 ? 'Requires attention' : 'All clear'} color="red" />
          <MetricCard icon={<Clock className="text-neutral-400" size={28} />} label="SLA Active" value={slaData.active_claims?.length || 0} trend={`${slaData.active_claims?.filter(c => c.is_overdue).length || 0} overdue`} color="slate" />
          <MetricCard icon={<TrendingUp className="text-neutral-400" size={28} />} label="Today's Intake" value={todayAssessments.length} trend="New assessments" color="slate" />
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 mb-6">
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-widest mb-4">Workflow Pipeline</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stageCount.map(({ stage, count }) => (
              <div key={stage} className="rounded-xl p-4 border border-neutral-800 bg-neutral-800/40 hover:border-neutral-700 transition-colors">
                <div className="text-2xl font-semibold text-white tabular-nums mb-1">{count}</div>
                <div className="text-[11px] text-neutral-500 uppercase tracking-wide">{stage}</div>
              </div>
            ))}
          </div>
        </div>

        {slaData.active_claims && slaData.active_claims.length > 0 && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 mb-6">
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-widest mb-4">SLA Status ({slaData.active_claims.length} active)</h2>
            <div className="space-y-2">
              {slaData.active_claims.slice(0, 10).map((sla, idx) => (
                <SLAStatusItem key={idx} sla={sla} />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {urgentAssessments.length > 0 && (
            <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-6">
              <h2 className="text-sm font-semibold text-red-400 uppercase tracking-widest mb-4">Urgent Priority ({urgentAssessments.length})</h2>
              <div className="space-y-3">
                {urgentAssessments.map(assessment => (
                  <AssessmentCard key={assessment.assessment_no} assessment={assessment} urgent />
                ))}
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-widest mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {assessments.slice(0, 5).map(assessment => (
                <AssessmentCard key={assessment.assessment_no} assessment={assessment} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-widest mb-4">All Active Assessments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assessments.map(assessment => (
              <AssessmentCard key={assessment.assessment_no} assessment={assessment} compact />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Components
function MetricCard({ icon, label, value, trend, color }: any) {
  const isRed = color === 'red';
  return (
    <div className={`rounded-2xl p-5 border ${isRed ? 'border-red-500/30 bg-red-500/5' : 'border-neutral-800 bg-neutral-900/60'}`}>
      <div className="flex items-start justify-between mb-3">
        {icon}
        <div className="text-right">
          <div className="text-3xl font-semibold tabular-nums text-white">{value}</div>
        </div>
      </div>
      <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-xs text-neutral-500">{trend}</div>
    </div>
  );
}

function SLAStatusItem({ sla }: { sla: SLAItem }) {
  const isOverdue = sla.is_overdue;
  const isUrgent = !isOverdue && sla.hours_remaining < 6;
  const colorClass = isOverdue ? 'border-red-500/50 bg-red-500/10' : isUrgent ? 'border-neutral-600 bg-neutral-800/60' : 'border-neutral-800 bg-neutral-800/40';
  const getTimeDisplay = () => {
    const hours = Math.abs(sla.hours_remaining);
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    return `${hours.toFixed(1)}h`;
  };
  return (
    <div className={`p-4 rounded-xl border ${colorClass}`}>
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="font-semibold text-white tabular-nums">{sla.claim_ref}</div>
          <div className="text-xs text-neutral-500 mt-0.5">{sla.vehicle} · {sla.insurer}</div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-semibold tabular-nums ${isOverdue ? 'text-red-400' : 'text-neutral-300'}`}>
            {isOverdue ? `+${getTimeDisplay()}` : getTimeDisplay()}
          </div>
          <div className="text-[11px] text-neutral-500 uppercase">{isOverdue ? 'Overdue' : 'Remaining'}</div>
        </div>
      </div>
    </div>
  );
}

function AssessmentCard({ assessment, urgent, compact }: { assessment: Assessment; urgent?: boolean; compact?: boolean }) {
  const priorityClass = (assessment.priority === 'Urgent' || assessment.priority === 'High') ? 'text-red-400' : 'text-neutral-400';

  if (compact) {
    return (
      <Link href={`/pages/cicop/assessment/${assessment.assessment_no}`} className="block p-4 rounded-xl border border-neutral-800 bg-neutral-800/40 hover:border-neutral-700 hover:bg-neutral-800/60 transition-colors">
        <div className="flex justify-between items-start mb-2">
          <div className="font-semibold text-red-400 tabular-nums">#{assessment.assessment_no}</div>
          <div className={`text-[11px] font-medium ${priorityClass}`}>{assessment.priority || 'Normal'}</div>
        </div>
        <div className="text-sm text-white mb-1">{assessment.customer_name || 'Unknown'}</div>
        <div className="text-xs text-neutral-500">{assessment.vehicle_make} {assessment.vehicle_model}</div>
        <div className="text-[11px] text-neutral-500 mt-2">{assessment.workflow_stage || 'N/A'}</div>
      </Link>
    );
  }

  return (
    <Link
      href={`/pages/cicop/assessment/${assessment.assessment_no}`}
      className={`block p-4 rounded-xl border transition-colors ${urgent ? 'border-red-500/50 bg-red-500/10 hover:bg-red-500/15' : 'border-neutral-800 bg-neutral-800/40 hover:border-neutral-700 hover:bg-neutral-800/60'}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-semibold text-lg text-red-400 tabular-nums">#{assessment.assessment_no}</div>
          <div className="text-xs text-neutral-500 mt-0.5">{assessment.claim_number || 'No claim #'}</div>
        </div>
        <div className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border ${(assessment.priority === 'Urgent' || assessment.priority === 'High') ? 'border-red-500/50 text-red-400' : 'border-neutral-600 text-neutral-400'}`}>
          {assessment.priority || 'Normal'}
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <div className="text-[11px] text-neutral-500 uppercase">Customer</div>
          <div className="text-white font-medium text-sm">{assessment.customer_name || 'Unknown'}</div>
        </div>
        <div>
          <div className="text-[11px] text-neutral-500 uppercase">Vehicle</div>
          <div className="text-white text-sm">{assessment.vehicle_make} {assessment.vehicle_model}</div>
        </div>
        <div>
          <div className="text-[11px] text-neutral-500 uppercase">Stage</div>
          <div className="text-neutral-400 text-sm">{assessment.workflow_stage || 'N/A'}</div>
        </div>
        {assessment.assigned_to && (
          <div>
            <div className="text-[11px] text-neutral-500 uppercase">Assigned</div>
            <div className="text-white text-sm">{assessment.assigned_to}</div>
          </div>
        )}
      </div>
    </Link>
  );
}
