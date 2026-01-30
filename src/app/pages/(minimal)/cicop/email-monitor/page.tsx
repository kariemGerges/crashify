'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  RefreshCw, 
  Mail,
  MailOpen,
  AlertTriangle,
  Clock,
  Send,
  Eye,
  Trash2
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

export default function EmailMonitorPage() {
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
      const interval = setInterval(loadEmails, 60000); // Every minute
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
    
    // Mark as read
    if (!email.is_read) {
      await fetch(`/api/cicop/emails/${email.id}/read`, { method: 'POST' });
      setEmails(prev => prev.map(e => 
        e.id === email.id ? { ...e, is_read: true } : e
      ));
    }

    // Generate draft response
    try {
      const res = await fetch('/api/cicop/emails/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_id: email.id,
          sender: email.sender,
          subject: email.subject,
          content: email.content
        })
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
          body: draftResponse.body
        })
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-4">
            <Link
              href="/pages/cicop"
              className="p-2 bg-orange-500/20 border border-orange-500 rounded-lg hover:bg-orange-500/30 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white to-orange-500 bg-clip-text text-transparent">
                📧 Email Monitoring
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                {unreadCount} unread • {slaCount} with SLA • {complaintCount} complaints
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              Auto-refresh (1m)
            </label>
            <button
              onClick={loadEmails}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <FilterTab label="All" count={emails.length} active={filter === 'all'} onClick={() => setFilter('all')} />
          <FilterTab label="Unread" count={unreadCount} active={filter === 'unread'} onClick={() => setFilter('unread')} />
          <FilterTab label="SLA Active" count={slaCount} active={filter === 'sla'} onClick={() => setFilter('sla')} />
          <FilterTab label="Complaints" count={complaintCount} active={filter === 'complaints'} onClick={() => setFilter('complaints')} />
        </div>

        {/* Email Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email List */}
          <div className="lg:col-span-1 bg-white/5 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
            <div className="p-4 bg-white/5 border-b border-white/20">
              <h2 className="font-bold">Inbox ({filteredEmails.length})</h2>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
              {loading ? (
                <div className="p-8 text-center text-slate-400">
                  <RefreshCw className="animate-spin inline-block" size={24} />
                  <p className="mt-2">Loading emails...</p>
                </div>
              ) : filteredEmails.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Mail size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No emails found</p>
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
                <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold mb-2">{selectedEmail.subject}</h2>
                      <div className="text-sm text-slate-400 space-y-1">
                        <div><strong>From:</strong> {selectedEmail.sender}</div>
                        <div><strong>Received:</strong> {new Date(selectedEmail.received_at).toLocaleString()}</div>
                        {selectedEmail.analysis?.claim_reference && (
                          <div><strong>Claim Ref:</strong> {selectedEmail.analysis.claim_reference}</div>
                        )}
                        {selectedEmail.analysis?.vehicle_rego && (
                          <div><strong>Rego:</strong> {selectedEmail.analysis.vehicle_rego}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {selectedEmail.has_sla && (
                        <SLABadge hoursRemaining={selectedEmail.sla_hours_remaining} />
                      )}
                      {selectedEmail.is_complaint && (
                        <span className="px-3 py-1 bg-red-500/20 border border-red-500 rounded-full text-xs font-semibold text-red-400">
                          ⚠️ Complaint
                        </span>
                      )}
                      {selectedEmail.analysis?.urgency === 'urgent' && (
                        <span className="px-3 py-1 bg-orange-500/20 border border-orange-500 rounded-full text-xs font-semibold text-orange-400">
                          🔥 Urgent
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10 mt-4">
                    <div className="whitespace-pre-wrap text-sm">{selectedEmail.content}</div>
                  </div>
                </div>

                {/* Draft Response */}
                {draftResponse && (
                  <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold">Draft Response</h3>
                      <button
                        onClick={handleSendResponse}
                        disabled={sending}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                      >
                        <Send size={18} />
                        {sending ? 'Sending...' : 'Send Response'}
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Subject</label>
                        <input
                          type="text"
                          value={draftResponse.subject}
                          onChange={(e) => setDraftResponse({ ...draftResponse, subject: e.target.value })}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Body</label>
                        <textarea
                          value={draftResponse.body}
                          onChange={(e) => setDraftResponse({ ...draftResponse, body: e.target.value })}
                          rows={12}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-orange-500 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-12 border border-white/20 text-center">
                <Mail size={64} className="mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">Select an email to view details and draft a response</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Components
function FilterTab({ label, count, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
        active
          ? 'bg-orange-500 text-white'
          : 'bg-white/10 text-slate-400 hover:bg-white/15'
      }`}
    >
      {label} ({count})
    </button>
  );
}

function EmailListItem({ email, selected, onClick, onDelete }: any) {
  return (
    <div
      className={`p-4 border-b border-white/10 cursor-pointer transition-colors ${
        selected ? 'bg-orange-500/20 border-l-4 border-l-orange-500' : 'hover:bg-white/5'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {email.is_read ? (
            <MailOpen size={16} className="text-slate-500" />
          ) : (
            <Mail size={16} className="text-orange-500" />
          )}
          <span className={`font-semibold ${email.is_read ? 'text-slate-400' : 'text-white'}`}>
            {email.sender}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 hover:bg-red-500/20 rounded transition-colors"
        >
          <Trash2 size={14} className="text-red-400" />
        </button>
      </div>
      
      <div className={`text-sm mb-1 ${email.is_read ? 'text-slate-500' : 'text-slate-300'}`}>
        {email.subject}
      </div>
      
      <div className="flex gap-2 flex-wrap">
        {email.has_sla && (
          <span className="px-2 py-0.5 bg-teal-500/20 border border-teal-500 rounded text-xs text-teal-400">
            SLA
          </span>
        )}
        {email.is_complaint && (
          <span className="px-2 py-0.5 bg-red-500/20 border border-red-500 rounded text-xs text-red-400">
            Complaint
          </span>
        )}
        {email.analysis?.urgency === 'urgent' && (
          <span className="px-2 py-0.5 bg-orange-500/20 border border-orange-500 rounded text-xs text-orange-400">
            Urgent
          </span>
        )}
      </div>
      
      <div className="text-xs text-slate-500 mt-2">
        {new Date(email.received_at).toLocaleString()}
      </div>
    </div>
  );
}

function SLABadge({ hoursRemaining }: { hoursRemaining?: number }) {
  if (hoursRemaining === undefined) return null;

  const isOverdue = hoursRemaining < 0;
  const isUrgent = hoursRemaining < 6 && hoursRemaining >= 0;

  const getColor = () => {
    if (isOverdue) return 'bg-red-500/20 border-red-500 text-red-400';
    if (isUrgent) return 'bg-orange-500/20 border-orange-500 text-orange-400';
    return 'bg-teal-500/20 border-teal-500 text-teal-400';
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${getColor()}`}>
      <Clock size={14} />
      {isOverdue ? `${Math.abs(hoursRemaining).toFixed(1)}h overdue` : `${hoursRemaining.toFixed(1)}h left`}
    </div>
  );
}
