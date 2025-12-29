// =============================================
// FILE: components/Assessment/PDFReportActions.tsx
// Component for PDF report actions (download, email, print, Excel)
// =============================================

'use client';

import { useState } from 'react';
import {
    Download,
    Mail,
    Printer,
    FileSpreadsheet,
    Loader2,
} from 'lucide-react';
import type { PDFReportType } from '@/server/lib/types/pdf-report.types';

interface PDFReportActionsProps {
    assessmentId: string;
    reportType?: PDFReportType;
    className?: string;
}

const REPORT_TYPES: Array<{ value: PDFReportType; label: string }> = [
    { value: 'assessed-quote', label: 'Assessed Quote' },
    { value: 'detailed-assessment', label: 'Detailed Assessment' },
    { value: 'salvage-tender', label: 'Salvage Tender Request' },
    { value: 'total-loss', label: 'Total Loss Assessment' },
];

export function PDFReportActions({
    assessmentId,
    reportType = 'detailed-assessment',
    className = '',
}: PDFReportActionsProps) {
    const [selectedReportType, setSelectedReportType] =
        useState<PDFReportType>(reportType);
    const [loading, setLoading] = useState<string | null>(null);
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [emailData, setEmailData] = useState({
        recipientEmail: '',
        subject: '',
        message: '',
    });

    const handleDownload = async () => {
        setLoading('download');
        try {
            const response = await fetch(
                `/api/assessments/${assessmentId}/pdf?type=${selectedReportType}`
            );
            if (!response.ok) {
                throw new Error('Failed to generate PDF');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report-${selectedReportType}-${assessmentId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download PDF. Please try again.');
        } finally {
            setLoading(null);
        }
    };

    const handlePrint = async () => {
        setLoading('print');
        try {
            const response = await fetch(
                `/api/assessments/${assessmentId}/pdf?type=${selectedReportType}`
            );
            if (!response.ok) {
                throw new Error('Failed to generate PDF');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const printWindow = window.open(url, '_blank');
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print();
                };
            }
        } catch (error) {
            console.error('Print error:', error);
            alert('Failed to generate PDF for printing. Please try again.');
        } finally {
            setLoading(null);
        }
    };

    const handleEmail = async () => {
        if (!emailData.recipientEmail) {
            alert('Please enter recipient email address');
            return;
        }

        setLoading('email');
        try {
            const response = await fetch(
                `/api/assessments/${assessmentId}/pdf/email`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        reportType: selectedReportType,
                        recipientEmail: emailData.recipientEmail,
                        subject: emailData.subject,
                        message: emailData.message,
                    }),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.details || 'Failed to send email');
            }

            alert('PDF sent successfully via email!');
            setEmailDialogOpen(false);
            setEmailData({ recipientEmail: '', subject: '', message: '' });
        } catch (error) {
            console.error('Email error:', error);
            alert(
                `Failed to send email: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`
            );
        } finally {
            setLoading(null);
        }
    };

    const handleExcelExport = async () => {
        setLoading('excel');
        try {
            const response = await fetch(
                `/api/assessments/${assessmentId}/pdf/excel?type=${selectedReportType}`
            );
            if (!response.ok) {
                throw new Error('Failed to generate Excel file');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report-${selectedReportType}-${assessmentId}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Excel export error:', error);
            alert('Failed to export to Excel. Please try again.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Report Type Selector */}
            <div>
                <label
                    htmlFor="report-type"
                    className="block text-sm font-medium text-gray-300 mb-2"
                >
                    Report Type
                </label>
                <select
                    id="report-type"
                    value={selectedReportType}
                    onChange={e =>
                        setSelectedReportType(e.target.value as PDFReportType)
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                    {REPORT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                            {type.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={handleDownload}
                    disabled={loading !== null}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/50 rounded-lg hover:bg-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading === 'download' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Download className="w-4 h-4" />
                    )}
                    <span>Download PDF</span>
                </button>

                <button
                    onClick={() => setEmailDialogOpen(true)}
                    disabled={loading !== null}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Mail className="w-4 h-4" />
                    <span>Email PDF</span>
                </button>

                <button
                    onClick={handlePrint}
                    disabled={loading !== null}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-sky-600/20 text-sky-400 border border-sky-500/50 rounded-lg hover:bg-sky-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading === 'print' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Printer className="w-4 h-4" />
                    )}
                    <span>Print PDF</span>
                </button>

                <button
                    onClick={handleExcelExport}
                    disabled={loading !== null}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600/20 text-orange-400 border border-orange-500/50 rounded-lg hover:bg-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading === 'excel' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <FileSpreadsheet className="w-4 h-4" />
                    )}
                    <span>Export Excel</span>
                </button>
            </div>

            {/* Email Dialog */}
            {emailDialogOpen && (
                <div
                    className="fixed inset-0 bg-red/80 backdrop-blur-sm z-[9999]"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflowY: 'auto',
                        padding: '1rem',
                        zIndex: 9999,
                    }}
                    onClick={e => {
                        if (e.target === e.currentTarget) {
                            setEmailDialogOpen(false);
                        }
                    }}
                >
                    <div
                        className="bg-gray-900 border border-amber-500/20 rounded-lg p-6 max-w-md w-full"
                        style={{
                            margin: 'auto',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Send PDF via Email
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="recipient-email"
                                    className="block text-sm font-medium text-gray-300 mb-1"
                                >
                                    Recipient Email *
                                </label>
                                <input
                                    id="recipient-email"
                                    type="email"
                                    value={emailData.recipientEmail}
                                    onChange={e =>
                                        setEmailData({
                                            ...emailData,
                                            recipientEmail: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    placeholder="recipient@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="email-subject"
                                    className="block text-sm font-medium text-gray-300 mb-1"
                                >
                                    Subject
                                </label>
                                <input
                                    id="email-subject"
                                    type="text"
                                    value={emailData.subject}
                                    onChange={e =>
                                        setEmailData({
                                            ...emailData,
                                            subject: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    placeholder="Optional custom subject"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="email-message"
                                    className="block text-sm font-medium text-gray-300 mb-1"
                                >
                                    Message
                                </label>
                                <textarea
                                    id="email-message"
                                    value={emailData.message}
                                    onChange={e =>
                                        setEmailData({
                                            ...emailData,
                                            message: e.target.value,
                                        })
                                    }
                                    rows={4}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    placeholder="Optional custom message"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleEmail}
                                disabled={
                                    loading === 'email' ||
                                    !emailData.recipientEmail
                                }
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading === 'email' ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    <>
                                        <Mail className="w-4 h-4" />
                                        <span>Send</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => {
                                    setEmailDialogOpen(false);
                                    setEmailData({
                                        recipientEmail: '',
                                        subject: '',
                                        message: '',
                                    });
                                }}
                                disabled={loading === 'email'}
                                className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
