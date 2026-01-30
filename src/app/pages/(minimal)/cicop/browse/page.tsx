'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';

interface Assessment {
  id: string;
  assessment_no: number;
  claim_number?: string;
  status?: string;
  client?: string;
  insurer?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  rego?: string;
  customer_name?: string;
  date_received?: string;
  crashify_assessed?: number;
  repairer_quote?: number;
  savings?: number;
  data_completeness?: number;
  risk_level?: string;
}

export default function AssessmentBrowserPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [insurerFilter, setInsurerFilter] = useState('all');
  const [sortField, setSortField] = useState<keyof Assessment>('assessment_no');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    loadAssessments();
  }, []);

  useEffect(() => {
    filterAndSortAssessments();
  }, [assessments, searchTerm, statusFilter, insurerFilter, sortField, sortDirection]);

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cicop/assessments');
      if (res.ok) {
        const data = await res.json();
        setAssessments(data);
      }
    } catch (error) {
      console.error('Error loading assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortAssessments = () => {
    let filtered = [...assessments];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.claim_number?.toLowerCase().includes(term) ||
        a.rego?.toLowerCase().includes(term) ||
        a.customer_name?.toLowerCase().includes(term) ||
        a.vehicle_make?.toLowerCase().includes(term) ||
        a.vehicle_model?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    // Insurer filter
    if (insurerFilter !== 'all') {
      filtered = filtered.filter(a => a.insurer === insurerFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredAssessments(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSort = (field: keyof Assessment) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleDelete = async (id: string, assessmentNo: number) => {
    if (!confirm(`Delete Assessment #${assessmentNo}?`)) return;

    try {
      const res = await fetch(`/api/cicop/assessments/${assessmentNo}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setAssessments(prev => prev.filter(a => a.id !== id));
      } else {
        alert('Failed to delete assessment');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error deleting assessment');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected assessments?`)) return;

    for (const id of selectedIds) {
      const assessment = assessments.find(a => a.id === id);
      if (assessment) {
        await fetch(`/api/cicop/assessments/${assessment.assessment_no}`, {
          method: 'DELETE'
        });
      }
    }

    setAssessments(prev => prev.filter(a => !selectedIds.includes(a.id)));
    setSelectedIds([]);
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/cicop/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assessments: filteredAssessments.map(a => a.assessment_no)
        })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `assessments_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      } else {
        alert('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export error');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedAssessments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedAssessments.map(a => a.id));
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedAssessments = filteredAssessments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAssessments.length / itemsPerPage);

  // Get unique values for filters
  const uniqueStatuses = [...new Set(assessments.map(a => a.status).filter(Boolean))];
  const uniqueInsurers = [...new Set(assessments.map(a => a.insurer).filter(Boolean))];

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans antialiased p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex justify-between items-center mb-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
          <div className="flex items-center gap-4">
            <Link href="/pages/cicop" className="p-2 rounded-xl bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-white">Assessment Browser</h1>
              <p className="text-neutral-500 text-sm mt-0.5">
                {filteredAssessments.length} of {assessments.length} assessments
                {selectedIds.length > 0 && ` · ${selectedIds.length} selected`}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {selectedIds.length > 0 && (
              <button onClick={handleBulkDelete} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors">
                <Trash2 size={18} /> Delete Selected
              </button>
            )}
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-white text-sm font-medium transition-colors">
              <Download size={18} /> Export CSV
            </button>
            <button onClick={loadAssessments} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-white text-sm font-medium transition-colors">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                <input
                  type="text"
                  placeholder="Search by claim #, rego, customer, vehicle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-800/80 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800/80 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-neutral-600"
              >
                <option value="all">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Insurer Filter */}
            <div>
              <select
                value={insurerFilter}
                onChange={(e) => setInsurerFilter(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800/80 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-neutral-600"
              >
                <option value="all">All Insurers</option>
                {uniqueInsurers.map(insurer => (
                  <option key={insurer} value={insurer}>{insurer}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-800/80 border-b border-neutral-700">
                <tr>
                  <th className="p-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === paginatedAssessments.length && paginatedAssessments.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-white/20"
                    />
                  </th>
                  <SortableHeader field="assessment_no" label="Assessment #" current={sortField} direction={sortDirection} onClick={handleSort} />
                  <SortableHeader field="claim_number" label="Claim #" current={sortField} direction={sortDirection} onClick={handleSort} />
                  <SortableHeader field="status" label="Status" current={sortField} direction={sortDirection} onClick={handleSort} />
                  <SortableHeader field="customer_name" label="Customer" current={sortField} direction={sortDirection} onClick={handleSort} />
                  <th className="p-3 text-left text-xs font-semibold text-neutral-400 uppercase">Vehicle</th>
                  <SortableHeader field="rego" label="Rego" current={sortField} direction={sortDirection} onClick={handleSort} />
                  <SortableHeader field="insurer" label="Insurer" current={sortField} direction={sortDirection} onClick={handleSort} />
                  <th className="p-3 text-left text-xs font-semibold text-neutral-400 uppercase">Savings</th>
                  <th className="p-3 text-left text-xs font-semibold text-neutral-400 uppercase">Completeness</th>
                  <SortableHeader field="date_received" label="Date" current={sortField} direction={sortDirection} onClick={handleSort} />
                  <th className="p-3 text-left text-xs font-semibold text-neutral-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-neutral-500">
                      <RefreshCw className="animate-spin inline-block mr-2" size={20} />
                      Loading assessments...
                    </td>
                  </tr>
                ) : paginatedAssessments.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-neutral-500">
                      No assessments found
                    </td>
                  </tr>
                ) : (
                  paginatedAssessments.map((assessment) => (
                    <tr key={assessment.id} className="border-b border-neutral-800 hover:bg-neutral-800/40 transition-colors">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(assessment.id)}
                          onChange={() => toggleSelect(assessment.id)}
                          className="w-4 h-4 rounded border-white/20"
                        />
                      </td>
                      <td className="p-3 font-semibold text-red-400 tabular-nums">#{assessment.assessment_no}</td>
                      <td className="p-3">{assessment.claim_number || '-'}</td>
                      <td className="p-3">
                        <StatusBadge status={assessment.status} />
                      </td>
                      <td className="p-3">{assessment.customer_name || '-'}</td>
                      <td className="p-3 text-sm">
                        {assessment.vehicle_make} {assessment.vehicle_model}
                      </td>
                      <td className="p-3 font-mono text-sm">{assessment.rego || '-'}</td>
                      <td className="p-3 text-sm">{assessment.insurer || '-'}</td>
                      <td className="p-3">
                        {assessment.savings ? (
                          <span className="text-red-400 font-semibold tabular-nums">${assessment.savings.toLocaleString()}</span>
                        ) : '-'}
                      </td>
                      <td className="p-3">
                        <CompletenessBar percentage={assessment.data_completeness || 0} />
                      </td>
                      <td className="p-3 text-sm">
                        {assessment.date_received ? new Date(assessment.date_received).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Link href={`/pages/cicop/assessment/${assessment.assessment_no}`} className="p-2 rounded-lg bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 transition-colors" title="View">
                            <Eye size={16} />
                          </Link>
                          <Link href={`/pages/cicop/assessment/${assessment.assessment_no}/edit`} className="p-2 rounded-lg bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 transition-colors" title="Edit">
                            <Edit size={16} />
                          </Link>
                          <button onClick={() => handleDelete(assessment.id, assessment.assessment_no)} className="p-2 rounded-lg bg-red-500/20 border border-red-500/50 hover:bg-red-500/30 transition-colors" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 bg-neutral-800/40 border-t border-neutral-700">
              <div className="text-sm text-neutral-500">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredAssessments.length)} of {filteredAssessments.length}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-lg transition-colors ${
                          currentPage === page ? 'bg-red-600 text-white' : 'bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-white'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  {totalPages > 5 && <span className="px-2">...</span>}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-lg bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function SortableHeader({ field, label, current, direction, onClick }: any) {
  const isActive = current === field;
  
  return (
    <th className="p-3 text-left text-xs font-semibold text-neutral-400 uppercase cursor-pointer hover:text-white transition-colors" onClick={() => onClick(field)}>
      <div className="flex items-center gap-2">
        {label}
        <ArrowUpDown size={14} className={isActive ? 'text-red-400' : 'text-neutral-500'} />
      </div>
    </th>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const colors: Record<string, string> = {
    'Completed': 'bg-red-500/15 border-red-500/50 text-red-400',
    'In Progress': 'bg-neutral-600/30 border-neutral-500 text-neutral-300',
    'Pending': 'bg-neutral-600/30 border-neutral-500 text-neutral-400',
    'On Hold': 'bg-red-500/15 border-red-500/50 text-red-400',
  };
  const colorClass = colors[status || ''] || 'bg-neutral-600/30 border-neutral-600 text-neutral-400';
  return <span className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border ${colorClass}`}>{status || 'Unknown'}</span>;
}

function CompletenessBar({ percentage }: { percentage: number }) {
  const isHigh = percentage >= 80;
  const isMid = percentage >= 50;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div className={`h-full transition-all ${isHigh ? 'bg-red-500' : isMid ? 'bg-neutral-500' : 'bg-red-500/70'}`} style={{ width: `${percentage}%` }} />
      </div>
      <span className="text-[11px] font-medium tabular-nums w-8 text-right text-neutral-400">{percentage}%</span>
    </div>
  );
}
