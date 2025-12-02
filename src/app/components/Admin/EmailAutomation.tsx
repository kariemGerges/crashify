'use client';

import React, { useState, useEffect } from 'react';
import {
    X,
    Loader2,
    Upload,
    FileText,
    Mail,
    Send,
    CheckCircle,
    AlertCircle,
    Eye,
    XCircle,
    Download,
} from 'lucide-react';
import type { Json } from '@/server/lib/types/database.types';
import { useToast } from '../Toast';

interface OwnerInfo {
    firstName?: string;
    lastName?: string;
    email?: string;
    mobile?: string;
}

interface Assessment {
    id: string;
    company_name: string;
    your_name: string;
    your_email: string;
    your_phone: string;
    assessment_type: 'Desktop Assessment' | 'Onsite Assessment';
    claim_reference: string | null;
    make: string;
    model: string;
    registration: string | null;
    year: number | null;
    owner_info: OwnerInfo | Json | null;
    incident_description: string | null;
    status: 'pending' | 'processing' | 'completed' | 'cancelled';
}

interface EmailAutomationProps {
    assessmentId: string;
    onClose: () => void;
    onUpdate?: () => void;
}

interface DocumentFile {
    file: File;
    type: 'repair_authority' | 'assessed_quote' | 'assessment_report';
    preview?: string;
}

export const EmailAutomation: React.FC<EmailAutomationProps> = ({
    assessmentId,
    onClose,
    onUpdate,
}) => {
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sending, setSending] = useState(false);
    const [previewEmail, setPreviewEmail] = useState<'repairer' | 'insurance' | null>(null);

    // Document files
    const [repairAuthority, setRepairAuthority] = useState<DocumentFile | null>(null);
    const [assessedQuote, setAssessedQuote] = useState<DocumentFile | null>(null);
    const [assessmentReport, setAssessmentReport] = useState<DocumentFile | null>(null);

    // Email recipients (auto-filled from assessment)
    const [repairerEmail, setRepairerEmail] = useState('');
    const [repairerName, setRepairerName] = useState('');
    const [insuranceEmail, setInsuranceEmail] = useState('');
    const [insuranceName, setInsuranceName] = useState('');

    // Optional notes
    const [additionalNotes, setAdditionalNotes] = useState('');

    const { showError, showSuccess, showConfirm } = useToast();

    useEffect(() => {
        loadAssessment();
    }, [assessmentId]);

    const loadAssessment = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/assessments/${assessmentId}`);
            const result = await response.json();

            if (result.error) {
                setError(result.error);
                return;
            }

            if (result.data) {
                const assessmentData = result.data.assessment as Assessment;
                setAssessment(assessmentData);

                // Auto-fill email addresses
                // For repairer, we'd need to extract from owner_info or have a separate repairer field
                // For now, we'll use the assessment contact email as insurance
                setInsuranceEmail(assessmentData.your_email);
                setInsuranceName(assessmentData.company_name);

                // Extract owner info for repairer (if available)
                if (assessmentData.owner_info) {
                    const owner = assessmentData.owner_info as OwnerInfo;
                    if (owner.email) {
                        setRepairerEmail(owner.email);
                        setRepairerName(`${owner.firstName || ''} ${owner.lastName || ''}`.trim());
                    }
                }
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load assessment');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (
        type: 'repair_authority' | 'assessed_quote' | 'assessment_report',
        file: File | null
    ) => {
        if (!file) return;

        // Validate file type (PDF only for now)
        if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
            showError('Please upload PDF files only');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showError('File size must be less than 10MB');
            return;
        }

        const documentFile: DocumentFile = {
            file,
            type,
        };

        switch (type) {
            case 'repair_authority':
                setRepairAuthority(documentFile);
                break;
            case 'assessed_quote':
                setAssessedQuote(documentFile);
                break;
            case 'assessment_report':
                setAssessmentReport(documentFile);
                break;
        }
    };

    const removeFile = (type: 'repair_authority' | 'assessed_quote' | 'assessment_report') => {
        switch (type) {
            case 'repair_authority':
                setRepairAuthority(null);
                break;
            case 'assessed_quote':
                setAssessedQuote(null);
                break;
            case 'assessment_report':
                setAssessmentReport(null);
                break;
        }
    };

    const validateForm = (): boolean => {
        if (!repairAuthority && !assessmentReport) {
            showError('Please upload at least Repair Authority or Assessment Report');
            return false;
        }

        if (!repairerEmail && !insuranceEmail) {
            showError('Please provide at least one recipient email address');
            return false;
        }

        // Validate email formats
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (repairerEmail && !emailRegex.test(repairerEmail)) {
            showError('Repairer email is invalid');
            return false;
        }
        if (insuranceEmail && !emailRegex.test(insuranceEmail)) {
            showError('Insurance email is invalid');
            return false;
        }

        return true;
    };

    const handleSendEmails = async () => {
        if (!validateForm()) return;

        const confirmed = await showConfirm(
            `Send emails to recipients?\nThis will send emails to:\n${repairerEmail ? `- Repairer: ${repairerEmail}\n` : ''}${insuranceEmail ? `- Insurance: ${insuranceEmail}` : ''}`
        );

        if (!confirmed) return;

        setSending(true);
        try {
            // Prepare form data
            const formData = new FormData();

            // Add documents
            if (repairAuthority) {
                formData.append('repair_authority', repairAuthority.file);
            }
            if (assessedQuote) {
                formData.append('assessed_quote', assessedQuote.file);
            }
            if (assessmentReport) {
                formData.append('assessment_report', assessmentReport.file);
            }

            // Add email data
            formData.append('repairer_email', repairerEmail);
            formData.append('repairer_name', repairerName);
            formData.append('insurance_email', insuranceEmail);
            formData.append('insurance_name', insuranceName);
            formData.append('additional_notes', additionalNotes);

            const response = await fetch(`/api/assessments/${assessmentId}/send-emails`, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.error) {
                showError(result.error);
                return;
            }

            showSuccess('Emails sent successfully!');
            if (onUpdate) onUpdate();
            onClose();
        } catch (err: unknown) {
            showError(err instanceof Error ? err.message : 'Failed to send emails');
        } finally {
            setSending(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-AU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading assessment...</p>
                </div>
            </div>
        );
    }

    if (error || !assessment) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="w-6 h-6 text-red-500" />
                        <h3 className="text-lg font-semibold text-white">Error</h3>
                    </div>
                    <p className="text-gray-400 mb-4">{error || 'Assessment not found'}</p>
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    const vehicleDisplay = `${assessment.make} ${assessment.model}${assessment.year ? ` (${assessment.year})` : ''}${assessment.registration ? ` - ${assessment.registration}` : ''}`;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-black border border-amber-500/20 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-amber-500/20 p-6 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">
                                Complete Assessment & Send Reports
                            </h2>
                            <p className="text-gray-400 text-sm">
                                Assessment #{assessmentId} - {vehicleDisplay}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Upload Documents Section */}
                    <div className="bg-black/30 border border-gray-800 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-amber-500" />
                            Upload Documents from IQ Controls
                        </h3>
                        <div className="space-y-4">
                            {/* Repair Authority */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    1. Repair Authority (for Repairer) <span className="text-red-500">*Required</span>
                                </label>
                                {repairAuthority ? (
                                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-amber-500" />
                                            <div>
                                                <p className="text-white text-sm font-medium">{repairAuthority.file.name}</p>
                                                <p className="text-gray-400 text-xs">{formatFileSize(repairAuthority.file.size)}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeFile('repair_authority')}
                                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-700 rounded-lg hover:border-amber-500/50 transition-colors cursor-pointer">
                                        <Upload className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-400">Select PDF file</span>
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => handleFileSelect('repair_authority', e.target.files?.[0] || null)}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>

                            {/* Assessed Quote */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    2. Assessed Quote (for Repairer) <span className="text-gray-500">Optional</span>
                                </label>
                                {assessedQuote ? (
                                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-amber-500" />
                                            <div>
                                                <p className="text-white text-sm font-medium">{assessedQuote.file.name}</p>
                                                <p className="text-gray-400 text-xs">{formatFileSize(assessedQuote.file.size)}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeFile('assessed_quote')}
                                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-700 rounded-lg hover:border-amber-500/50 transition-colors cursor-pointer">
                                        <Upload className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-400">Select PDF file</span>
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => handleFileSelect('assessed_quote', e.target.files?.[0] || null)}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>

                            {/* Assessment Report */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    3. Full Assessment Report (for Insurance) <span className="text-red-500">*Required</span>
                                </label>
                                {assessmentReport ? (
                                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-amber-500" />
                                            <div>
                                                <p className="text-white text-sm font-medium">{assessmentReport.file.name}</p>
                                                <p className="text-gray-400 text-xs">{formatFileSize(assessmentReport.file.size)}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeFile('assessment_report')}
                                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-700 rounded-lg hover:border-amber-500/50 transition-colors cursor-pointer">
                                        <Upload className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-400">Select PDF file</span>
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => handleFileSelect('assessment_report', e.target.files?.[0] || null)}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Email Recipients Section */}
                    <div className="bg-black/30 border border-gray-800 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-amber-500" />
                            Email Recipients
                        </h3>
                        <div className="space-y-4">
                            {/* Repairer Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Repairer Email
                                </label>
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={repairerName}
                                        onChange={(e) => setRepairerName(e.target.value)}
                                        placeholder="Repairer Name (e.g., Rod Bowen's Prestige Smash Repairs)"
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500 transition-colors"
                                    />
                                    <input
                                        type="email"
                                        value={repairerEmail}
                                        onChange={(e) => setRepairerEmail(e.target.value)}
                                        placeholder="quotes@repairer.com.au"
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Insurance Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Insurance Company Email
                                </label>
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={insuranceName}
                                        onChange={(e) => setInsuranceName(e.target.value)}
                                        placeholder="Insurance Company Name"
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500 transition-colors"
                                    />
                                    <input
                                        type="email"
                                        value={insuranceEmail}
                                        onChange={(e) => setInsuranceEmail(e.target.value)}
                                        placeholder="claims@insurance.com.au"
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Notes */}
                    <div className="bg-black/30 border border-gray-800 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Additional Notes (Optional)</h3>
                        <textarea
                            value={additionalNotes}
                            onChange={(e) => setAdditionalNotes(e.target.value)}
                            placeholder="Any additional notes or instructions to include in the emails..."
                            rows={4}
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleSendEmails}
                            disabled={sending || (!repairAuthority && !assessmentReport)}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-red-600 text-white rounded-lg hover:from-amber-600 hover:to-red-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sending ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Sending Emails...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Send Both Emails Now
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

