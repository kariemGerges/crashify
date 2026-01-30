'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  RefreshCw,
  Mail,
  MailOpen,
  Clock,
  Send,
  Trash2,
} from 'lucide-react';

interface Email {
  id: string;
  sender: string;
  subject: string;
  content: string;
  received_at: string;
  is_read: boolean;
  has_sla: boolean;
  sla_hours_remaining?: number;
  is_complaint: boolean;
  analysis?: {
    claim_reference?: string;
    vehicle_rego?: string;
    urgency: string;
    confidence: number;
  };
}

interface DraftResponse {
  subject: string;
  body: string;
}

function EmailMonitorContent() {
  const searchParams = useSearchParams();
  const fromAdmin = searchParams?.get('from') === 'admin';
  const backHref = fromAdmin ? '/pages/admin?tab=dashboard' : '/pages/cicop';
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [draftResponse, setDraftResponse] = useState<DraftResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'sla' | 'complaints'>('all');

  useEffect(() => {
    loadEmails();

    if (autoRefresh) {
      const interval = setInterval(loadEmails, 60000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadEmails = async () => {
    try {
      const res = await fetch('/api/cicop/emails');
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
      }
    } catch (error) {
      console.error('Error loading emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailClick = async (email: Email) => {
    setSelectedEmail(email);

    if (!email.is_read) {
      await fetch(`/api/cicop/emails/${email.id}/read`, { method: 'POST' });
      setEmails(prev =>
        prev.map(e => (e.id === email.id ? { ...e, is_read: true } : e))
      );
    }

    try {
      const res = await fetch('/api/cicop/emails/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_id: email.id,
          sender: email.sender,
          subject: email.subject,
          content: email.content,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDraftResponse(data);
      }
    } catch (error) {
      console.error('Error generating response:', error);
    }
  };

  const handleSendResponse = async () => {
    if (!selectedEmail || !draftResponse) return;

    setSending(true);
    try {
      const res = await fetch('/api/cicop/emails/send-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_id: selectedEmail.id,
          to: selectedEmail.sender,
          subject: draftResponse.subject,
          body: draftResponse.body,
        }),
      });

      if (res.ok) {
        alert('Response sent successfully!');
        setSelectedEmail(null);
        setDraftResponse(null);
        loadEmails();
      } else {
        alert('Failed to send response');
      }
    } catch (error) {
      console.error('Error sending response:', error);
      alert('Error sending response');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (emailId: string) => {
    if (!confirm('Delete this email?')) return;

    try {
      await fetch(`/api/cicop/emails/${emailId}`, { method: 'DELETE' });
      setEmails(prev => prev.filter(e => e.id !== emailId));
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
        setDraftResponse(null);
      }
    } catch (error) {
      console.error('Error deleting email:', error);
    }
  };

  const filteredEmails = emails.filter(email => {
    if (filter === 'unread') return !email.is_read;
    if (filter === 'sla') return email.has_sla;
    if (filter === 'complaints') return email.is_complaint;
    return true;
  });

  const unreadCount = emails.filter(e => !e.is_read).length;
  const slaCount = emails.filter(e => e.has_sla).length;
  const complaintCount = emails.filter(e => e.is_complaint).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white font-sans antialiased p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 rounded-xl border border-amber-500/20 bg-gray-900/50 p-6">
          <div className="flex items-center gap-4">
            <Link
              href={backHref}
              className="p-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-all duration-200 active:scale-95 text-gray-400 hover:text-white"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-white">
                Email Monitoring
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {unreadCount} unread · {slaCount} with SLA · {complaintCount}{' '}
                complaints
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500/50"
              />
              Auto-refresh (1m)
            </label>
            <button
              onClick={loadEmails}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white text-sm font-medium transition-all duration-200 active:scale-[0.98]"
            >
              <RefreshCw
                size={18}
                className={loading ? 'animate-spin' : ''}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <FilterTab
            label="All"
            count={emails.length}
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <FilterTab
            label="Unread"
            count={unreadCount}
            active={filter === 'unread'}
            onClick={() => setFilter('unread')}
          />
          <FilterTab
            label="SLA Active"
            count={slaCount}
            active={filter === 'sla'}
            onClick={() => setFilter('sla')}
          />
          <FilterTab
            label="Complaints"
            count={complaintCount}
            active={filter === 'complaints'}
            onClick={() => setFilter('complaints')}
          />
        </div>

        {/* Email Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email List */}
          <div className="lg:col-span-1 rounded-xl border border-amber-500/20 bg-gray-900/50 overflow-hidden">
            <div className="p-4 border-b border-amber-500/20">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
                Inbox ({filteredEmails.length})
              </h2>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <RefreshCw
                    className="animate-spin inline-block"
                    size={24}
                  />
                  <p className="mt-2 text-sm">Loading emails...</p>
                </div>
              ) : filteredEmails.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Mail size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No emails found</p>
                </div>
              ) : (
                filteredEmails.map(email => (
                  <EmailListItem
                    key={email.id}
                    email={email}
                    selected={selectedEmail?.id === email.id}
                    onClick={() => handleEmailClick(email)}
                    onDelete={() => handleDelete(email.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Email Detail & Response */}
          <div className="lg:col-span-2 space-y-6">
            {selectedEmail ? (
              <>
                {/* Email Detail */}
                <div className="rounded-xl border border-amber-500/20 bg-gray-900/50 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-white mb-2">
                        {selectedEmail.subject}
                      </h2>
                      <div className="text-sm text-gray-500 space-y-1">
                        <div>
                          <span className="text-gray-400">From:</span>{' '}
                          {selectedEmail.sender}
                        </div>
                        <div>
                          <span className="text-gray-400">Received:</span>{' '}
                          {new Date(
                            selectedEmail.received_at
                          ).toLocaleString()}
                        </div>
                        {selectedEmail.analysis?.claim_reference && (
                          <div>
                            <span className="text-gray-400">Claim Ref:</span>{' '}
                            {selectedEmail.analysis.claim_reference}
                          </div>
                        )}
                        {selectedEmail.analysis?.vehicle_rego && (
                          <div>
                            <span className="text-gray-400">Rego:</span>{' '}
                            {selectedEmail.analysis.vehicle_rego}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {selectedEmail.has_sla && (
                        <SLABadge
                          hoursRemaining={
                            selectedEmail.sla_hours_remaining
                          }
                        />
                      )}
                      {selectedEmail.is_complaint && (
                        <span className="px-3 py-1 rounded-lg border border-red-500/50 bg-red-500/10 text-xs font-semibold text-red-400">
                          Complaint
                        </span>
                      )}
                      {selectedEmail.analysis?.urgency === 'urgent' && (
                        <span className="px-3 py-1 rounded-lg border border-red-500/50 bg-red-500/10 text-xs font-semibold text-red-400">
                          Urgent
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-700 bg-black/30 p-4 mt-4">
                    <div className="whitespace-pre-wrap text-sm text-gray-300">
                      {selectedEmail.content}
                    </div>
                  </div>
                </div>

                {/* Draft Response */}
                {draftResponse && (
                  <div className="rounded-xl border border-amber-500/20 bg-gray-900/50 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
                        Draft Response
                      </h3>
                      <button
                        onClick={handleSendResponse}
                        disabled={sending}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:pointer-events-none"
                      >
                        <Send size={18} />
                        {sending ? 'Sending...' : 'Send Response'}
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={draftResponse.subject}
                          onChange={e =>
                            setDraftResponse({
                              ...draftResponse,
                              subject: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
                          Body
                        </label>
                        <textarea
                          value={draftResponse.body}
                          onChange={e =>
                            setDraftResponse({
                              ...draftResponse,
                              body: e.target.value,
                            })
                          }
                          rows={12}
                          className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-amber-500/20 bg-gray-900/40 p-12 text-center">
                <Mail
                  size={64}
                  className="mx-auto mb-4 text-gray-600"
                />
                <p className="text-gray-500 text-sm">
                  Select an email to view details and draft a response
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmailMonitorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center p-6">
        <RefreshCw className="animate-spin size-6 text-gray-500" />
      </div>
    }>
      <EmailMonitorContent />
    </Suspense>
  );
}

function FilterTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
          active
            ? 'bg-gradient-to-r from-amber-500/20 to-red-600/20 text-amber-400 border border-amber-500/50'
            : 'bg-gray-800 border border-gray-700 text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      {label} ({count})
    </button>
  );
}

function EmailListItem({
  email,
  selected,
  onClick,
  onDelete,
}: {
  email: Email;
  selected: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`p-4 border-b border-amber-500/20 cursor-pointer transition-all duration-200 last:border-0 ${
        selected
          ? 'bg-gradient-to-r from-amber-500/20 to-red-600/20 border-l-4 border-l-amber-500'
          : 'hover:bg-white/5'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {email.is_read ? (
            <MailOpen size={16} className="text-neutral-500" />
          ) : (
            <Mail size={16} className="text-red-400" />
          )}
          <span
            className={`font-medium text-sm truncate ${
              email.is_read ? 'text-gray-400' : 'text-white'
            }`}
          >
            {email.sender}
          </span>
        </div>
        <button
          onClick={e => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded-lg hover:bg-red-500/10 text-neutral-500 hover:text-red-400 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div
        className={`text-sm mb-1 line-clamp-2 ${
          email.is_read ? 'text-gray-500' : 'text-gray-300'
        }`}
      >
        {email.subject}
      </div>

      <div className="flex gap-2 flex-wrap">
        {email.has_sla && (
          <span className="px-2 py-0.5 rounded-md bg-gray-700/80 text-gray-400 text-xs font-medium">
            SLA
          </span>
        )}
        {email.is_complaint && (
          <span className="px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 text-xs font-medium">
            Complaint
          </span>
        )}
        {email.analysis?.urgency === 'urgent' && (
          <span className="px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 text-xs font-medium">
            Urgent
          </span>
        )}
      </div>

      <div className="text-[11px] text-gray-500 mt-2">
        {new Date(email.received_at).toLocaleString()}
      </div>
    </div>
  );
}

function SLABadge({ hoursRemaining }: { hoursRemaining?: number }) {
  if (hoursRemaining === undefined) return null;

  const isOverdue = hoursRemaining < 0;
  const isUrgent = hoursRemaining < 6 && hoursRemaining >= 0;

  const colorClass = isOverdue
    ? 'border-red-500/50 bg-red-500/10 text-red-400'
    : isUrgent
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
      : 'border-amber-500/20 bg-gray-900/50 text-gray-300';

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-semibold ${colorClass}`}
    >
      <Clock size={14} />
      {isOverdue
        ? `${Math.abs(hoursRemaining).toFixed(1)}h overdue`
        : `${hoursRemaining.toFixed(1)}h left`}
    </div>
  );
}
