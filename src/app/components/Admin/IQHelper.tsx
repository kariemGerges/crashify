'use client';

import React, { useState, useEffect } from 'react';
import {
    X,
    Loader2,
    Copy,
    Check,
    Download,
    FileText,
    Car,
    User,
    Calendar,
    DollarSign,
    MapPin,
    Clock,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';
import type { Json } from '@/server/lib/types/database.types';
import { useToast } from '../Toast';

interface OwnerInfo {
    firstName?: string;
    lastName?: string;
    email?: string;
    mobile?: string;
    altPhone?: string;
    address?: string;
}

interface LocationInfo {
    locationType?: string;
    locationName?: string;
    streetAddress?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
    contactName?: string;
    phone?: string;
    email?: string;
    preferredDate?: string;
    preferredTime?: string;
    accessInstructions?: string;
}

interface Assessment {
    id: string;
    company_name: string;
    your_name: string;
    your_email: string;
    your_phone: string;
    your_role: string | null;
    department: string | null;
    assessment_type: 'Desktop Assessment' | 'Onsite Assessment';
    claim_reference: string | null;
    policy_number: string | null;
    incident_date: string | null;
    incident_location: string | null;
    vehicle_type: string | null;
    year: number | null;
    make: string;
    model: string;
    registration: string | null;
    vin: string | null;
    color: string | null;
    odometer: number | null;
    insurance_value_type: string | null;
    insurance_value_amount: number | null;
    owner_info: OwnerInfo | Json | null;
    location_info: LocationInfo | Json | null;
    incident_description: string | null;
    damage_areas: string[];
    special_instructions: string | null;
    internal_notes: string | null;
    status: 'pending' | 'processing' | 'completed' | 'cancelled';
    created_at: string;
}

interface UploadedFile {
    id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
}

interface IQHelperProps {
    assessmentId: string;
    onClose: () => void;
    onUpdate?: () => void;
}

export const IQHelper: React.FC<IQHelperProps> = ({
    assessmentId,
    onClose,
    onUpdate,
}) => {
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copiedFields, setCopiedFields] = useState<Set<string>>(new Set());
    const [downloadingZip, setDownloadingZip] = useState(false);
    const [markingAsEntered, setMarkingAsEntered] = useState(false);
    const [iqReference, setIqReference] = useState('');
    const { showError, showSuccess, showConfirm } = useToast();

    useEffect(() => {
        loadAssessment();
        loadFiles();
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
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load assessment');
        } finally {
            setLoading(false);
        }
    };

    const loadFiles = async () => {
        try {
            const response = await fetch(`/api/assessments/${assessmentId}/files`);
            const result = await response.json();

            if (result.data) {
                setFiles(result.data);
            }
        } catch (err) {
            console.error('Failed to load files:', err);
        }
    };

    const copyToClipboard = async (text: string, fieldName: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedFields(prev => new Set(prev).add(fieldName));
            showSuccess(`Copied ${fieldName} to clipboard`);
            setTimeout(() => {
                setCopiedFields(prev => {
                    const next = new Set(prev);
                    next.delete(fieldName);
                    return next;
                });
            }, 2000);
        } catch (err) {
            showError('Failed to copy to clipboard');
        }
    };

    const downloadPhotosZip = async () => {
        setDownloadingZip(true);
        try {
            const response = await fetch(`/api/assessments/${assessmentId}/files/zip`);
            
            if (!response.ok) {
                throw new Error('Failed to generate ZIP');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `CarDamage_${assessmentId}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showSuccess('Photos downloaded as ZIP');
        } catch (err) {
            showError('Failed to download photos');
        } finally {
            setDownloadingZip(false);
        }
    };

    const handleMarkAsEntered = async () => {
        const confirmed = await showConfirm(
            'Mark this assessment as entered in IQ Controls?',
            iqReference ? `IQ Controls Reference: ${iqReference}` : undefined
        );
        
        if (!confirmed) return;

        setMarkingAsEntered(true);
        try {
            const response = await fetch(`/api/assessments/${assessmentId}/iq-helper/mark-entered`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ iqReference: iqReference || null }),
            });

            const result = await response.json();

            if (result.error) {
                showError(result.error);
                return;
            }

            showSuccess('Assessment marked as entered in IQ Controls');
            if (onUpdate) onUpdate();
            onClose();
        } catch (err: unknown) {
            showError(err instanceof Error ? err.message : 'Failed to mark as entered');
        } finally {
            setMarkingAsEntered(false);
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

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-AU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getFieldValue = (value: string | number | null | undefined): string => {
        if (value === null || value === undefined) return '';
        return String(value);
    };

    const getOwnerName = (): string => {
        if (!assessment?.owner_info) return '';
        const owner = assessment.owner_info as OwnerInfo;
        return `${owner.firstName || ''} ${owner.lastName || ''}`.trim();
    };

    const getOwnerEmail = (): string => {
        if (!assessment?.owner_info) return '';
        const owner = assessment.owner_info as OwnerInfo;
        return owner.email || '';
    };

    const getOwnerPhone = (): string => {
        if (!assessment?.owner_info) return '';
        const owner = assessment.owner_info as OwnerInfo;
        return owner.mobile || '';
    };

    const getIncidentDescription = (): string => {
        if (!assessment?.incident_description) return '';
        return assessment.incident_description;
    };

    const imageFiles = files.filter(f => f.file_type.startsWith('image/'));
    const photoCount = imageFiles.length;

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

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-black border border-amber-500/20 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-amber-500/20 p-6 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">
                                Copy to IQ Controls - Assessment #{assessmentId}
                            </h2>
                            <p className="text-gray-400 text-sm">
                                {assessment.make} {assessment.model} {assessment.year ? `(${assessment.year})` : ''} - {assessment.company_name}
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
                    {/* Assessment Details Section */}
                    <div className="bg-black/30 border border-gray-800 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-amber-500" />
                            Assessment Details
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <FieldWithCopy
                                label="Assessment No"
                                value={assessmentId}
                                fieldName="assessment_no"
                                copied={copiedFields.has('assessment_no')}
                                onCopy={() => copyToClipboard(assessmentId, 'assessment_no')}
                            />
                            <FieldWithCopy
                                label="Claim Type"
                                value={assessment.assessment_type === 'Desktop Assessment' ? 'Desktop' : 'Onsite'}
                                fieldName="claim_type"
                                copied={copiedFields.has('claim_type')}
                                onCopy={() => copyToClipboard(
                                    assessment.assessment_type === 'Desktop Assessment' ? 'Desktop' : 'Onsite',
                                    'claim_type'
                                )}
                            />
                            <FieldWithCopy
                                label="Status"
                                value="New"
                                fieldName="status"
                                copied={copiedFields.has('status')}
                                onCopy={() => copyToClipboard('New', 'status')}
                            />
                            <FieldWithCopy
                                label="Book Date"
                                value={formatDate(assessment.created_at)}
                                fieldName="book_date"
                                copied={copiedFields.has('book_date')}
                                onCopy={() => copyToClipboard(formatDate(assessment.created_at), 'book_date')}
                            />
                        </div>
                    </div>

                    {/* Parties Section */}
                    <div className="bg-black/30 border border-gray-800 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-amber-500" />
                            Parties
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <FieldWithCopy
                                label="Insurer"
                                value={assessment.company_name}
                                fieldName="insurer"
                                copied={copiedFields.has('insurer')}
                                onCopy={() => copyToClipboard(assessment.company_name, 'insurer')}
                            />
                            <FieldWithCopy
                                label="Insured"
                                value={getOwnerName()}
                                fieldName="insured"
                                copied={copiedFields.has('insured')}
                                onCopy={() => copyToClipboard(getOwnerName(), 'insured')}
                            />
                            <FieldWithCopy
                                label="Claim No"
                                value={getFieldValue(assessment.claim_reference)}
                                fieldName="claim_no"
                                copied={copiedFields.has('claim_no')}
                                onCopy={() => copyToClipboard(getFieldValue(assessment.claim_reference), 'claim_no')}
                            />
                            <FieldWithCopy
                                label="Policy Number"
                                value={getFieldValue(assessment.policy_number)}
                                fieldName="policy_number"
                                copied={copiedFields.has('policy_number')}
                                onCopy={() => copyToClipboard(getFieldValue(assessment.policy_number), 'policy_number')}
                            />
                        </div>
                    </div>

                    {/* Vehicle Section */}
                    <div className="bg-black/30 border border-gray-800 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Car className="w-5 h-5 text-amber-500" />
                            Vehicle
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <FieldWithCopy
                                label="Make"
                                value={assessment.make}
                                fieldName="make"
                                copied={copiedFields.has('make')}
                                onCopy={() => copyToClipboard(assessment.make, 'make')}
                            />
                            <FieldWithCopy
                                label="Model"
                                value={assessment.model}
                                fieldName="model"
                                copied={copiedFields.has('model')}
                                onCopy={() => copyToClipboard(assessment.model, 'model')}
                            />
                            <FieldWithCopy
                                label="Year"
                                value={getFieldValue(assessment.year)}
                                fieldName="year"
                                copied={copiedFields.has('year')}
                                onCopy={() => copyToClipboard(getFieldValue(assessment.year), 'year')}
                            />
                            <FieldWithCopy
                                label="Registration"
                                value={getFieldValue(assessment.registration)}
                                fieldName="rego"
                                copied={copiedFields.has('rego')}
                                onCopy={() => copyToClipboard(getFieldValue(assessment.registration), 'rego')}
                            />
                            <FieldWithCopy
                                label="VIN"
                                value={getFieldValue(assessment.vin)}
                                fieldName="vin"
                                copied={copiedFields.has('vin')}
                                onCopy={() => copyToClipboard(getFieldValue(assessment.vin), 'vin')}
                            />
                            <FieldWithCopy
                                label="Odometer"
                                value={assessment.odometer ? `${assessment.odometer.toLocaleString()} km` : ''}
                                fieldName="odometer"
                                copied={copiedFields.has('odometer')}
                                onCopy={() => copyToClipboard(
                                    assessment.odometer ? assessment.odometer.toString() : '',
                                    'odometer'
                                )}
                            />
                            {assessment.color && (
                                <FieldWithCopy
                                    label="Color"
                                    value={assessment.color}
                                    fieldName="color"
                                    copied={copiedFields.has('color')}
                                    onCopy={() => copyToClipboard(assessment.color!, 'color')}
                                />
                            )}
                        </div>
                    </div>

                    {/* Financial Section */}
                    {(assessment.insurance_value_amount || assessment.claim_reference) && (
                        <div className="bg-black/30 border border-gray-800 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-amber-500" />
                                Financial
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {assessment.insurance_value_amount && (
                                    <FieldWithCopy
                                        label="Sum Insured / PAV"
                                        value={`$${assessment.insurance_value_amount.toLocaleString()}`}
                                        fieldName="sum_insured"
                                        copied={copiedFields.has('sum_insured')}
                                        onCopy={() => copyToClipboard(
                                            assessment.insurance_value_amount!.toString(),
                                            'sum_insured'
                                        )}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Incident Description */}
                    {assessment.incident_description && (
                        <div className="bg-black/30 border border-gray-800 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-amber-500" />
                                Incident Description
                            </h3>
                            <div className="space-y-2">
                                <p className="text-gray-300 whitespace-pre-wrap">{assessment.incident_description}</p>
                                <button
                                    onClick={() => copyToClipboard(getIncidentDescription(), 'incident_all')}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded-lg hover:bg-amber-500/30 transition-colors"
                                >
                                    {copiedFields.has('incident_all') ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copy All
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Photos Section */}
                    <div className="bg-black/30 border border-gray-800 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Download className="w-5 h-5 text-amber-500" />
                                Photos ({photoCount} files)
                            </h3>
                            <button
                                onClick={downloadPhotosZip}
                                disabled={downloadingZip || photoCount === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded-lg hover:bg-amber-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {downloadingZip ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Generating ZIP...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        Download All as ZIP
                                    </>
                                )}
                            </button>
                        </div>
                        {photoCount === 0 && (
                            <p className="text-gray-400 text-sm">No photos uploaded</p>
                        )}
                    </div>

                    {/* Actions Section */}
                    <div className="bg-black/30 border border-gray-800 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-amber-500" />
                            Actions
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    IQ Controls Reference (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={iqReference}
                                    onChange={(e) => setIqReference(e.target.value)}
                                    placeholder="e.g., claim-abc123"
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500 transition-colors"
                                />
                            </div>
                            <button
                                onClick={handleMarkAsEntered}
                                disabled={markingAsEntered}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-red-600 text-white rounded-lg hover:from-amber-600 hover:to-red-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {markingAsEntered ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Mark as Entered in IQ Controls
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-gray-800">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Opened: {formatDateTime(assessment.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>Status: {assessment.status}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface FieldWithCopyProps {
    label: string;
    value: string;
    fieldName: string;
    copied: boolean;
    onCopy: () => void;
}

const FieldWithCopy: React.FC<FieldWithCopyProps> = ({
    label,
    value,
    fieldName,
    copied,
    onCopy,
}) => {
    if (!value) return null;

    return (
        <div className="space-y-1">
            <label className="text-sm text-gray-400">{label}</label>
            <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-sm">
                    {value}
                </div>
                <button
                    onClick={onCopy}
                    className={`p-2 rounded-lg transition-colors ${
                        copied
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                    }`}
                    title={`Copy ${label}`}
                >
                    {copied ? (
                        <Check className="w-4 h-4" />
                    ) : (
                        <Copy className="w-4 h-4" />
                    )}
                </button>
            </div>
        </div>
    );
};

