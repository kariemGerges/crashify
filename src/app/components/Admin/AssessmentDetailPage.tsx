import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Loader2,
    AlertCircle,
    FileText,
    Car,
    User,
    MapPin,
    Calendar,
    DollarSign,
    Edit,
    Trash2,
    Upload,
    Image as ImageIcon,
    Download,
    CheckCircle,
    Clock,
    XCircle,
} from 'lucide-react';
import type { Json } from '@/server/lib/types/database.types';
import Image from 'next/image';
import { useToast } from '../Toast';
import { PDFReportActions } from '../Assessment/PDFReportActions';
import { EstimateEditor } from './EstimateEditor';
import InteractiveDamageDiagram, {
    type DamageEntry,
} from './InteractiveDamageDiagram';

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
    authority_confirmed: boolean;
    privacy_consent: boolean;
    email_report_consent: boolean;
    sms_updates: boolean;
    status: 'pending' | 'processing' | 'completed' | 'cancelled';
    created_at: string;
    updated_at: string | null;
}

interface UploadedFile {
    id: string;
    assessment_id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
    storage_path: string;
    uploaded_at: string;
    processing_status: 'uploaded' | 'processing' | 'processed' | 'failed';
    metadata: Json;
}

interface AssessmentDetailPageProps {
    assessmentId: string;
    onClose: () => void;
    onUpdate?: () => void;
}

export const AssessmentDetailPage: React.FC<AssessmentDetailPageProps> = ({
    assessmentId,
    onClose,
    onUpdate,
}) => {
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showStatusEdit, setShowStatusEdit] = useState(false);
    const [newStatus, setNewStatus] = useState<
        'pending' | 'processing' | 'completed' | 'cancelled'
    >('pending');
    const [activeTab, setActiveTab] = useState<
        'details' | 'damage' | 'repair' | 'estimates' | 'reports' | 'admin'
    >('details');
    const [editingFields, setEditingFields] = useState<Record<string, any>>({});
    const [savingFields, setSavingFields] = useState<Record<string, boolean>>(
        {}
    );
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
                setNewStatus(assessmentData.status);
            }
        } catch (err: unknown) {
            setError(
                err instanceof Error ? err.message : 'Failed to load assessment'
            );
        } finally {
            setLoading(false);
        }
    };

    const loadFiles = async () => {
        try {
            const response = await fetch(
                `/api/assessments/${assessmentId}/files`
            );
            const result = await response.json();

            if (result.data) {
                setFiles(result.data);
            }
        } catch (err) {
            console.error('Failed to load files:', err);
        }
    };

    const handleStatusUpdate = async () => {
        if (!assessment) return;

        setUpdating(true);
        try {
            const response = await fetch(`/api/assessments/${assessmentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            const result = await response.json();

            if (result.error) {
                showError(result.error);
                return;
            }

            setAssessment({ ...assessment, status: newStatus });
            setShowStatusEdit(false);
            showSuccess('Status updated successfully');
            if (onUpdate) onUpdate();
        } catch (err: unknown) {
            showError(
                err instanceof Error ? err.message : 'Failed to update status'
            );
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async () => {
        const confirm = await showConfirm(
            'Are you sure you want to delete this assessment?'
        );
        if (!confirm) return;

        setUpdating(true);
        try {
            const response = await fetch(`/api/assessments/${assessmentId}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.error) {
                showError(result.error);
                return;
            }

            showSuccess('Assessment deleted successfully');
            if (onUpdate) onUpdate();
            onClose();
        } catch (err: unknown) {
            showError(
                err instanceof Error
                    ? err.message
                    : 'Failed to delete assessment'
            );
        } finally {
            setUpdating(false);
        }
    };

    const handleFieldChange = (field: string, value: any) => {
        setEditingFields(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSaveField = async (field: string, value: any) => {
        if (!assessment) return;

        setSavingFields(prev => ({ ...prev, [field]: true }));
        try {
            const response = await fetch(`/api/assessments/${assessmentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value }),
            });

            const result = await response.json();

            if (result.error) {
                showError(result.error);
                return;
            }

            showSuccess('Field updated successfully');
            // Update local state
            setAssessment({ ...assessment, [field]: value });
            // Remove from editing fields
            setEditingFields(prev => {
                const newFields = { ...prev };
                delete newFields[field];
                return newFields;
            });
            if (onUpdate) onUpdate();
        } catch (err: unknown) {
            showError(
                err instanceof Error ? err.message : 'Failed to update field'
            );
        } finally {
            setSavingFields(prev => {
                const newFields = { ...prev };
                delete newFields[field];
                return newFields;
            });
        }
    };

    const handleSaveJsonField = async (
        field: string,
        updates: Partial<OwnerInfo | LocationInfo>
    ) => {
        if (!assessment) return;

        setSavingFields(prev => ({ ...prev, [field]: true }));
        try {
            const currentValue = assessment[field as keyof Assessment] as
                | OwnerInfo
                | LocationInfo
                | null;
            const updatedValue = { ...currentValue, ...updates };

            const response = await fetch(`/api/assessments/${assessmentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: updatedValue }),
            });

            const result = await response.json();

            if (result.error) {
                showError(result.error);
                return;
            }

            showSuccess('Field updated successfully');
            setAssessment({ ...assessment, [field]: updatedValue });
            setEditingFields(prev => {
                const newFields = { ...prev };
                delete newFields[field];
                return newFields;
            });
            if (onUpdate) onUpdate();
        } catch (err: unknown) {
            showError(
                err instanceof Error ? err.message : 'Failed to update field'
            );
        } finally {
            setSavingFields(prev => {
                const newFields = { ...prev };
                delete newFields[field];
                return newFields;
            });
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;

        setUploading(true);
        try {
            const formData = new FormData();
            Array.from(selectedFiles).forEach(file => {
                formData.append('files', file);
            });

            const response = await fetch(
                `/api/assessments/${assessmentId}/files`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            const result = await response.json();

            if (result.error) {
                showError(result.error);
                return;
            }

            showSuccess(`Successfully uploaded ${result.uploaded} file(s)`);
            loadFiles();
        } catch (err: unknown) {
            showError(
                err instanceof Error ? err.message : 'Failed to upload files'
            );
        } finally {
            setUploading(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500/20 text-green-400 border-green-500/50';
            case 'processing':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
            case 'pending':
                return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
            case 'cancelled':
                return 'bg-red-500/20 text-red-400 border-red-500/50';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-4 h-4" />;
            case 'processing':
                return <Clock className="w-4 h-4" />;
            case 'pending':
                return <Clock className="w-4 h-4" />;
            case 'cancelled':
                return <XCircle className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    const ownerInfo = assessment?.owner_info as OwnerInfo | null;
    const locationInfo = assessment?.location_info as LocationInfo | null;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
                <div className="bg-gray-900 border border-amber-500/20 rounded-xl p-8">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                    <p className="text-gray-400 mt-4 text-center">
                        Loading assessment details...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !assessment) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
                <div className="bg-gray-900 border border-red-500/20 rounded-xl p-8 max-w-md">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                    <p className="text-red-400 text-center mb-4">
                        {error || 'Assessment not found'}
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4 md:p-8">
            <div className="max-w-6xl mx-auto bg-gray-900 border border-amber-500/20 rounded-xl p-6 md:p-8 my-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-800">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            title="Go back"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-2xl font-bold text-white">
                                    Assessment Details
                                </h2>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(
                                        assessment.status
                                    )}`}
                                >
                                    {getStatusIcon(assessment.status)}
                                    {assessment.status.charAt(0).toUpperCase() +
                                        assessment.status.slice(1)}
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm">
                                ID: {assessment.id}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="border-b border-gray-800 mb-6">
                    <div className="flex space-x-1 overflow-x-auto">
                        {[
                            { id: 'details', label: 'DETAILS' },
                            { id: 'damage', label: 'DAMAGE' },
                            { id: 'repair', label: 'REPAIR' },
                            { id: 'estimates', label: 'ESTIMATES' },
                            { id: 'reports', label: 'REPORTS' },
                            { id: 'admin', label: 'ADMIN' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() =>
                                    setActiveTab(tab.id as typeof activeTab)
                                }
                                className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'text-amber-500 border-b-2 border-amber-500 bg-amber-500/10'
                                        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'details' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Company Information */}
                            <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-amber-500" />
                                    Company Information
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <label className="text-gray-400 block mb-1">
                                            Company Name
                                        </label>
                                        {editingFields.company_name !==
                                        undefined ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={
                                                        editingFields.company_name
                                                    }
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            'company_name',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                                                />
                                                <button
                                                    onClick={() =>
                                                        handleSaveField(
                                                            'company_name',
                                                            editingFields.company_name
                                                        )
                                                    }
                                                    disabled={
                                                        savingFields.company_name
                                                    }
                                                    className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    {savingFields.company_name ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Save'
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setEditingFields(
                                                            prev => {
                                                                const newFields =
                                                                    { ...prev };
                                                                delete newFields.company_name;
                                                                return newFields;
                                                            }
                                                        )
                                                    }
                                                    className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between group">
                                                <p className="text-white flex-1">
                                                    {assessment.company_name}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        handleFieldChange(
                                                            'company_name',
                                                            assessment.company_name
                                                        )
                                                    }
                                                    className="opacity-30 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-amber-500 transition-all rounded hover:bg-gray-800/50"
                                                    title="Edit field"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-gray-400 block mb-1">
                                            Contact Name
                                        </label>
                                        {editingFields.your_name !==
                                        undefined ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={
                                                        editingFields.your_name
                                                    }
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            'your_name',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                                                />
                                                <button
                                                    onClick={() =>
                                                        handleSaveField(
                                                            'your_name',
                                                            editingFields.your_name
                                                        )
                                                    }
                                                    disabled={
                                                        savingFields.your_name
                                                    }
                                                    className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    {savingFields.your_name ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Save'
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setEditingFields(
                                                            prev => {
                                                                const newFields =
                                                                    { ...prev };
                                                                delete newFields.your_name;
                                                                return newFields;
                                                            }
                                                        )
                                                    }
                                                    className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between group">
                                                <p className="text-white">
                                                    {assessment.your_name}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        handleFieldChange(
                                                            'your_name',
                                                            assessment.your_name
                                                        )
                                                    }
                                                    className="opacity-30 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-amber-500 transition-all rounded hover:bg-gray-800/50"
                                                    title="Edit field"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-gray-400 block mb-1">
                                            Email
                                        </label>
                                        {editingFields.your_email !==
                                        undefined ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="email"
                                                    value={
                                                        editingFields.your_email
                                                    }
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            'your_email',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                                                />
                                                <button
                                                    onClick={() =>
                                                        handleSaveField(
                                                            'your_email',
                                                            editingFields.your_email
                                                        )
                                                    }
                                                    disabled={
                                                        savingFields.your_email
                                                    }
                                                    className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    {savingFields.your_email ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Save'
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setEditingFields(
                                                            prev => {
                                                                const newFields =
                                                                    { ...prev };
                                                                delete newFields.your_email;
                                                                return newFields;
                                                            }
                                                        )
                                                    }
                                                    className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between group">
                                                <p className="text-white">
                                                    {assessment.your_email}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        handleFieldChange(
                                                            'your_email',
                                                            assessment.your_email
                                                        )
                                                    }
                                                    className="opacity-30 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-amber-500 transition-all rounded hover:bg-gray-800/50"
                                                    title="Edit field"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-gray-400 block mb-1">
                                            Phone
                                        </label>
                                        {editingFields.your_phone !==
                                        undefined ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="tel"
                                                    value={
                                                        editingFields.your_phone
                                                    }
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            'your_phone',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                                                />
                                                <button
                                                    onClick={() =>
                                                        handleSaveField(
                                                            'your_phone',
                                                            editingFields.your_phone
                                                        )
                                                    }
                                                    disabled={
                                                        savingFields.your_phone
                                                    }
                                                    className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    {savingFields.your_phone ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Save'
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setEditingFields(
                                                            prev => {
                                                                const newFields =
                                                                    { ...prev };
                                                                delete newFields.your_phone;
                                                                return newFields;
                                                            }
                                                        )
                                                    }
                                                    className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between group">
                                                <p className="text-white">
                                                    {assessment.your_phone}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        handleFieldChange(
                                                            'your_phone',
                                                            assessment.your_phone
                                                        )
                                                    }
                                                    className="opacity-30 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-amber-500 transition-all rounded hover:bg-gray-800/50"
                                                    title="Edit field"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-gray-400 block mb-1">
                                            Role
                                        </label>
                                        {editingFields.your_role !==
                                        undefined ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={
                                                        editingFields.your_role ||
                                                        ''
                                                    }
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            'your_role',
                                                            e.target.value ||
                                                                null
                                                        )
                                                    }
                                                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                                                    placeholder="Enter role"
                                                />
                                                <button
                                                    onClick={() =>
                                                        handleSaveField(
                                                            'your_role',
                                                            editingFields.your_role ||
                                                                null
                                                        )
                                                    }
                                                    disabled={
                                                        savingFields.your_role
                                                    }
                                                    className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    {savingFields.your_role ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Save'
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setEditingFields(
                                                            prev => {
                                                                const newFields =
                                                                    { ...prev };
                                                                delete newFields.your_role;
                                                                return newFields;
                                                            }
                                                        )
                                                    }
                                                    className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between group">
                                                <p className="text-white">
                                                    {assessment.your_role ||
                                                        'N/A'}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        handleFieldChange(
                                                            'your_role',
                                                            assessment.your_role
                                                        )
                                                    }
                                                    className="opacity-30 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-amber-500 transition-all rounded hover:bg-gray-800/50"
                                                    title="Edit field"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-gray-400 block mb-1">
                                            Department
                                        </label>
                                        {editingFields.department !==
                                        undefined ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={
                                                        editingFields.department ||
                                                        ''
                                                    }
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            'department',
                                                            e.target.value ||
                                                                null
                                                        )
                                                    }
                                                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                                                    placeholder="Enter department"
                                                />
                                                <button
                                                    onClick={() =>
                                                        handleSaveField(
                                                            'department',
                                                            editingFields.department ||
                                                                null
                                                        )
                                                    }
                                                    disabled={
                                                        savingFields.department
                                                    }
                                                    className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    {savingFields.department ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Save'
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setEditingFields(
                                                            prev => {
                                                                const newFields =
                                                                    { ...prev };
                                                                delete newFields.department;
                                                                return newFields;
                                                            }
                                                        )
                                                    }
                                                    className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between group">
                                                <p className="text-white">
                                                    {assessment.department ||
                                                        'N/A'}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        handleFieldChange(
                                                            'department',
                                                            assessment.department
                                                        )
                                                    }
                                                    className="opacity-30 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-amber-500 transition-all rounded hover:bg-gray-800/50"
                                                    title="Edit field"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle Information */}
                            <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Car className="w-5 h-5 text-amber-500" />
                                    Vehicle Information
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <label className="text-gray-400 block mb-1">
                                            Assessment Type
                                        </label>
                                        {editingFields.assessment_type !==
                                        undefined ? (
                                            <div className="flex gap-2">
                                                <select
                                                    value={
                                                        editingFields.assessment_type
                                                    }
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            'assessment_type',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                                                >
                                                    <option value="Desktop Assessment">
                                                        Desktop Assessment
                                                    </option>
                                                    <option value="Onsite Assessment">
                                                        Onsite Assessment
                                                    </option>
                                                </select>
                                                <button
                                                    onClick={() =>
                                                        handleSaveField(
                                                            'assessment_type',
                                                            editingFields.assessment_type
                                                        )
                                                    }
                                                    disabled={
                                                        savingFields.assessment_type
                                                    }
                                                    className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    {savingFields.assessment_type ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Save'
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setEditingFields(
                                                            prev => {
                                                                const newFields =
                                                                    { ...prev };
                                                                delete newFields.assessment_type;
                                                                return newFields;
                                                            }
                                                        )
                                                    }
                                                    className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between group">
                                                <p className="text-white">
                                                    {assessment.assessment_type}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        handleFieldChange(
                                                            'assessment_type',
                                                            assessment.assessment_type
                                                        )
                                                    }
                                                    className="opacity-30 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-amber-500 transition-all rounded hover:bg-gray-800/50"
                                                    title="Edit field"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-gray-400 block mb-1">
                                            Vehicle Type
                                        </label>
                                        {editingFields.vehicle_type !==
                                        undefined ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={
                                                        editingFields.vehicle_type ||
                                                        ''
                                                    }
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            'vehicle_type',
                                                            e.target.value ||
                                                                null
                                                        )
                                                    }
                                                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                                                    placeholder="Enter vehicle type"
                                                />
                                                <button
                                                    onClick={() =>
                                                        handleSaveField(
                                                            'vehicle_type',
                                                            editingFields.vehicle_type ||
                                                                null
                                                        )
                                                    }
                                                    disabled={
                                                        savingFields.vehicle_type
                                                    }
                                                    className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    {savingFields.vehicle_type ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Save'
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setEditingFields(
                                                            prev => {
                                                                const newFields =
                                                                    { ...prev };
                                                                delete newFields.vehicle_type;
                                                                return newFields;
                                                            }
                                                        )
                                                    }
                                                    className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between group">
                                                <p className="text-white">
                                                    {assessment.vehicle_type ||
                                                        'N/A'}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        handleFieldChange(
                                                            'vehicle_type',
                                                            assessment.vehicle_type
                                                        )
                                                    }
                                                    className="opacity-30 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-amber-500 transition-all rounded hover:bg-gray-800/50"
                                                    title="Edit field"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-gray-400 block mb-1">
                                                Make
                                            </label>
                                            {editingFields.make !==
                                            undefined ? (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={
                                                            editingFields.make
                                                        }
                                                        onChange={e =>
                                                            handleFieldChange(
                                                                'make',
                                                                e.target.value
                                                            )
                                                        }
                                                        className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-amber-500"
                                                    />
                                                    <button
                                                        onClick={() =>
                                                            handleSaveField(
                                                                'make',
                                                                editingFields.make
                                                            )
                                                        }
                                                        disabled={
                                                            savingFields.make
                                                        }
                                                        className="px-2 py-1.5 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                    >
                                                        {savingFields.make ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            '✓'
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setEditingFields(
                                                                prev => {
                                                                    const newFields =
                                                                        {
                                                                            ...prev,
                                                                        };
                                                                    delete newFields.make;
                                                                    return newFields;
                                                                }
                                                            )
                                                        }
                                                        className="px-2 py-1.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-xs"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between group">
                                                    <p className="text-white">
                                                        {assessment.make}
                                                    </p>
                                                    <button
                                                        onClick={() =>
                                                            handleFieldChange(
                                                                'make',
                                                                assessment.make
                                                            )
                                                        }
                                                        className="opacity-30 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-amber-500 transition-all rounded hover:bg-gray-800/50"
                                                        title="Edit field"
                                                    >
                                                        <Edit className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-gray-400 block mb-1">
                                                Model
                                            </label>
                                            {editingFields.model !==
                                            undefined ? (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={
                                                            editingFields.model
                                                        }
                                                        onChange={e =>
                                                            handleFieldChange(
                                                                'model',
                                                                e.target.value
                                                            )
                                                        }
                                                        className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-amber-500"
                                                    />
                                                    <button
                                                        onClick={() =>
                                                            handleSaveField(
                                                                'model',
                                                                editingFields.model
                                                            )
                                                        }
                                                        disabled={
                                                            savingFields.model
                                                        }
                                                        className="px-2 py-1.5 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                    >
                                                        {savingFields.model ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            '✓'
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setEditingFields(
                                                                prev => {
                                                                    const newFields =
                                                                        {
                                                                            ...prev,
                                                                        };
                                                                    delete newFields.model;
                                                                    return newFields;
                                                                }
                                                            )
                                                        }
                                                        className="px-2 py-1.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-xs"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between group">
                                                    <p className="text-white">
                                                        {assessment.model}
                                                    </p>
                                                    <button
                                                        onClick={() =>
                                                            handleFieldChange(
                                                                'model',
                                                                assessment.model
                                                            )
                                                        }
                                                        className="opacity-30 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-amber-500 transition-all rounded hover:bg-gray-800/50"
                                                        title="Edit field"
                                                    >
                                                        <Edit className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-gray-400 block mb-1">
                                            Year
                                        </label>
                                        {editingFields.year !== undefined ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    value={
                                                        editingFields.year || ''
                                                    }
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            'year',
                                                            e.target.value
                                                                ? parseInt(
                                                                      e.target
                                                                          .value
                                                                  )
                                                                : null
                                                        )
                                                    }
                                                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                                                    placeholder="Enter year"
                                                />
                                                <button
                                                    onClick={() =>
                                                        handleSaveField(
                                                            'year',
                                                            editingFields.year ||
                                                                null
                                                        )
                                                    }
                                                    disabled={savingFields.year}
                                                    className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    {savingFields.year ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Save'
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setEditingFields(
                                                            prev => {
                                                                const newFields =
                                                                    { ...prev };
                                                                delete newFields.year;
                                                                return newFields;
                                                            }
                                                        )
                                                    }
                                                    className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between group">
                                                <p className="text-white">
                                                    {assessment.year || 'N/A'}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        handleFieldChange(
                                                            'year',
                                                            assessment.year
                                                        )
                                                    }
                                                    className="opacity-30 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-amber-500 transition-all rounded hover:bg-gray-800/50"
                                                    title="Edit field"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-gray-400 block mb-1">
                                            Registration
                                        </label>
                                        {editingFields.registration !==
                                        undefined ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={
                                                        editingFields.registration ||
                                                        ''
                                                    }
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            'registration',
                                                            e.target.value ||
                                                                null
                                                        )
                                                    }
                                                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                                                    placeholder="Enter registration"
                                                />
                                                <button
                                                    onClick={() =>
                                                        handleSaveField(
                                                            'registration',
                                                            editingFields.registration ||
                                                                null
                                                        )
                                                    }
                                                    disabled={
                                                        savingFields.registration
                                                    }
                                                    className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    {savingFields.registration ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Save'
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setEditingFields(
                                                            prev => {
                                                                const newFields =
                                                                    { ...prev };
                                                                delete newFields.registration;
                                                                return newFields;
                                                            }
                                                        )
                                                    }
                                                    className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between group">
                                                <p className="text-white">
                                                    {assessment.registration ||
                                                        'N/A'}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        handleFieldChange(
                                                            'registration',
                                                            assessment.registration
                                                        )
                                                    }
                                                    className="opacity-30 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-amber-500 transition-all rounded hover:bg-gray-800/50"
                                                    title="Edit field"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-gray-400 block mb-1">
                                            VIN
                                        </label>
                                        {editingFields.vin !== undefined ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={
                                                        editingFields.vin || ''
                                                    }
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            'vin',
                                                            e.target.value ||
                                                                null
                                                        )
                                                    }
                                                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm font-mono text-xs focus:outline-none focus:border-amber-500"
                                                    placeholder="Enter VIN"
                                                />
                                                <button
                                                    onClick={() =>
                                                        handleSaveField(
                                                            'vin',
                                                            editingFields.vin ||
                                                                null
                                                        )
                                                    }
                                                    disabled={savingFields.vin}
                                                    className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    {savingFields.vin ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Save'
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setEditingFields(
                                                            prev => {
                                                                const newFields =
                                                                    { ...prev };
                                                                delete newFields.vin;
                                                                return newFields;
                                                            }
                                                        )
                                                    }
                                                    className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between group">
                                                <p className="text-white font-mono text-xs">
                                                    {assessment.vin || 'N/A'}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        handleFieldChange(
                                                            'vin',
                                                            assessment.vin
                                                        )
                                                    }
                                                    className="opacity-30 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-amber-500 transition-all rounded hover:bg-gray-800/50"
                                                    title="Edit field"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-gray-400 block mb-1">
                                            Color
                                        </label>
                                        {editingFields.color !== undefined ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={
                                                        editingFields.color ||
                                                        ''
                                                    }
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            'color',
                                                            e.target.value ||
                                                                null
                                                        )
                                                    }
                                                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                                                    placeholder="Enter color"
                                                />
                                                <button
                                                    onClick={() =>
                                                        handleSaveField(
                                                            'color',
                                                            editingFields.color ||
                                                                null
                                                        )
                                                    }
                                                    disabled={
                                                        savingFields.color
                                                    }
                                                    className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    {savingFields.color ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Save'
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setEditingFields(
                                                            prev => {
                                                                const newFields =
                                                                    { ...prev };
                                                                delete newFields.color;
                                                                return newFields;
                                                            }
                                                        )
                                                    }
                                                    className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between group">
                                                <p className="text-white">
                                                    {assessment.color || 'N/A'}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        handleFieldChange(
                                                            'color',
                                                            assessment.color
                                                        )
                                                    }
                                                    className="opacity-30 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-amber-500 transition-all rounded hover:bg-gray-800/50"
                                                    title="Edit field"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-gray-400 block mb-1">
                                            Odometer (km)
                                        </label>
                                        {editingFields.odometer !==
                                        undefined ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    value={
                                                        editingFields.odometer ||
                                                        ''
                                                    }
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            'odometer',
                                                            e.target.value
                                                                ? parseInt(
                                                                      e.target
                                                                          .value
                                                                  )
                                                                : null
                                                        )
                                                    }
                                                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                                                    placeholder="Enter odometer reading"
                                                />
                                                <button
                                                    onClick={() =>
                                                        handleSaveField(
                                                            'odometer',
                                                            editingFields.odometer ||
                                                                null
                                                        )
                                                    }
                                                    disabled={
                                                        savingFields.odometer
                                                    }
                                                    className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    {savingFields.odometer ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Save'
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setEditingFields(
                                                            prev => {
                                                                const newFields =
                                                                    { ...prev };
                                                                delete newFields.odometer;
                                                                return newFields;
                                                            }
                                                        )
                                                    }
                                                    className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between group">
                                                <p className="text-white">
                                                    {assessment.odometer
                                                        ? assessment.odometer.toLocaleString() +
                                                          ' km'
                                                        : 'N/A'}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        handleFieldChange(
                                                            'odometer',
                                                            assessment.odometer
                                                        )
                                                    }
                                                    className="opacity-30 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-amber-500 transition-all rounded hover:bg-gray-800/50"
                                                    title="Edit field"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Insurance Information */}
                            <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-amber-500" />
                                    Insurance Information
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <label className="text-gray-400 block mb-1">
                                            Value Type
                                        </label>
                                        {editingFields.insurance_value_type !==
                                        undefined ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={
                                                        editingFields.insurance_value_type ||
                                                        ''
                                                    }
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            'insurance_value_type',
                                                            e.target.value ||
                                                                null
                                                        )
                                                    }
                                                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                                                    placeholder="Enter value type"
                                                />
                                                <button
                                                    onClick={() =>
                                                        handleSaveField(
                                                            'insurance_value_type',
                                                            editingFields.insurance_value_type ||
                                                                null
                                                        )
                                                    }
                                                    disabled={
                                                        savingFields.insurance_value_type
                                                    }
                                                    className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    {savingFields.insurance_value_type ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Save'
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setEditingFields(
                                                            prev => {
                                                                const newFields =
                                                                    { ...prev };
                                                                delete newFields.insurance_value_type;
                                                                return newFields;
                                                            }
                                                        )
                                                    }
                                                    className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between group">
                                                <p className="text-white">
                                                    {assessment.insurance_value_type ||
                                                        'N/A'}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        handleFieldChange(
                                                            'insurance_value_type',
                                                            assessment.insurance_value_type
                                                        )
                                                    }
                                                    className="opacity-30 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-amber-500 transition-all rounded hover:bg-gray-800/50"
                                                    title="Edit field"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-gray-400 block mb-1">
                                            Value Amount
                                        </label>
                                        {editingFields.insurance_value_amount !==
                                        undefined ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={
                                                        editingFields.insurance_value_amount ||
                                                        ''
                                                    }
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            'insurance_value_amount',
                                                            e.target.value
                                                                ? parseFloat(
                                                                      e.target
                                                                          .value
                                                                  )
                                                                : null
                                                        )
                                                    }
                                                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                                                    placeholder="Enter amount"
                                                />
                                                <button
                                                    onClick={() =>
                                                        handleSaveField(
                                                            'insurance_value_amount',
                                                            editingFields.insurance_value_amount ||
                                                                null
                                                        )
                                                    }
                                                    disabled={
                                                        savingFields.insurance_value_amount
                                                    }
                                                    className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    {savingFields.insurance_value_amount ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Save'
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setEditingFields(
                                                            prev => {
                                                                const newFields =
                                                                    { ...prev };
                                                                delete newFields.insurance_value_amount;
                                                                return newFields;
                                                            }
                                                        )
                                                    }
                                                    className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between group">
                                                <p className="text-white">
                                                    {assessment.insurance_value_amount
                                                        ? `$${assessment.insurance_value_amount.toLocaleString()}`
                                                        : 'N/A'}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        handleFieldChange(
                                                            'insurance_value_amount',
                                                            assessment.insurance_value_amount
                                                        )
                                                    }
                                                    className="opacity-30 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-amber-500 transition-all rounded hover:bg-gray-800/50"
                                                    title="Edit field"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-gray-400 block mb-1">
                                            Claim Reference
                                        </label>
                                        {editingFields.claim_reference !==
                                        undefined ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={
                                                        editingFields.claim_reference ||
                                                        ''
                                                    }
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            'claim_reference',
                                                            e.target.value ||
                                                                null
                                                        )
                                                    }
                                                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                                                    placeholder="Enter claim reference"
                                                />
                                                <button
                                                    onClick={() =>
                                                        handleSaveField(
                                                            'claim_reference',
                                                            editingFields.claim_reference ||
                                                                null
                                                        )
                                                    }
                                                    disabled={
                                                        savingFields.claim_reference
                                                    }
                                                    className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    {savingFields.claim_reference ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Save'
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setEditingFields(
                                                            prev => {
                                                                const newFields =
                                                                    { ...prev };
                                                                delete newFields.claim_reference;
                                                                return newFields;
                                                            }
                                                        )
                                                    }
                                                    className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between group">
                                                <p className="text-white">
                                                    {assessment.claim_reference ||
                                                        'N/A'}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        handleFieldChange(
                                                            'claim_reference',
                                                            assessment.claim_reference
                                                        )
                                                    }
                                                    className="opacity-30 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-amber-500 transition-all rounded hover:bg-gray-800/50"
                                                    title="Edit field"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-gray-400 block mb-1">
                                            Policy Number
                                        </label>
                                        {editingFields.policy_number !==
                                        undefined ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={
                                                        editingFields.policy_number ||
                                                        ''
                                                    }
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            'policy_number',
                                                            e.target.value ||
                                                                null
                                                        )
                                                    }
                                                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                                                    placeholder="Enter policy number"
                                                />
                                                <button
                                                    onClick={() =>
                                                        handleSaveField(
                                                            'policy_number',
                                                            editingFields.policy_number ||
                                                                null
                                                        )
                                                    }
                                                    disabled={
                                                        savingFields.policy_number
                                                    }
                                                    className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    {savingFields.policy_number ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Save'
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setEditingFields(
                                                            prev => {
                                                                const newFields =
                                                                    { ...prev };
                                                                delete newFields.policy_number;
                                                                return newFields;
                                                            }
                                                        )
                                                    }
                                                    className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between group">
                                                <p className="text-white">
                                                    {assessment.policy_number ||
                                                        'N/A'}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        handleFieldChange(
                                                            'policy_number',
                                                            assessment.policy_number
                                                        )
                                                    }
                                                    className="opacity-30 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-amber-500 transition-all rounded hover:bg-gray-800/50"
                                                    title="Edit field"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Incident Information */}
                            <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-amber-500" />
                                    Incident Information
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <label className="text-gray-400 block mb-1">
                                            Incident Date
                                        </label>
                                        {editingFields.incident_date !==
                                        undefined ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="date"
                                                    value={
                                                        editingFields.incident_date
                                                            ? new Date(
                                                                  editingFields.incident_date
                                                              )
                                                                  .toISOString()
                                                                  .split('T')[0]
                                                            : ''
                                                    }
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            'incident_date',
                                                            e.target.value ||
                                                                null
                                                        )
                                                    }
                                                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                                                />
                                                <button
                                                    onClick={() =>
                                                        handleSaveField(
                                                            'incident_date',
                                                            editingFields.incident_date ||
                                                                null
                                                        )
                                                    }
                                                    disabled={
                                                        savingFields.incident_date
                                                    }
                                                    className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    {savingFields.incident_date ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Save'
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setEditingFields(
                                                            prev => {
                                                                const newFields =
                                                                    { ...prev };
                                                                delete newFields.incident_date;
                                                                return newFields;
                                                            }
                                                        )
                                                    }
                                                    className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between group">
                                                <p className="text-white">
                                                    {assessment.incident_date
                                                        ? formatDate(
                                                              assessment.incident_date
                                                          )
                                                        : 'N/A'}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        handleFieldChange(
                                                            'incident_date',
                                                            assessment.incident_date
                                                        )
                                                    }
                                                    className="opacity-30 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-amber-500 transition-all rounded hover:bg-gray-800/50"
                                                    title="Edit field"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-gray-400 block mb-1">
                                            Incident Location
                                        </label>
                                        {editingFields.incident_location !==
                                        undefined ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={
                                                        editingFields.incident_location ||
                                                        ''
                                                    }
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            'incident_location',
                                                            e.target.value ||
                                                                null
                                                        )
                                                    }
                                                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                                                    placeholder="Enter incident location"
                                                />
                                                <button
                                                    onClick={() =>
                                                        handleSaveField(
                                                            'incident_location',
                                                            editingFields.incident_location ||
                                                                null
                                                        )
                                                    }
                                                    disabled={
                                                        savingFields.incident_location
                                                    }
                                                    className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    {savingFields.incident_location ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Save'
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setEditingFields(
                                                            prev => {
                                                                const newFields =
                                                                    { ...prev };
                                                                delete newFields.incident_location;
                                                                return newFields;
                                                            }
                                                        )
                                                    }
                                                    className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between group">
                                                <p className="text-white">
                                                    {assessment.incident_location ||
                                                        'N/A'}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        handleFieldChange(
                                                            'incident_location',
                                                            assessment.incident_location
                                                        )
                                                    }
                                                    className="opacity-30 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-amber-500 transition-all rounded hover:bg-gray-800/50"
                                                    title="Edit field"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-gray-400 block mb-1">
                                            Description
                                        </label>
                                        {editingFields.incident_description !==
                                        undefined ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={
                                                        editingFields.incident_description ||
                                                        ''
                                                    }
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            'incident_description',
                                                            e.target.value ||
                                                                null
                                                        )
                                                    }
                                                    rows={4}
                                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 resize-none"
                                                    placeholder="Enter incident description"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() =>
                                                            handleSaveField(
                                                                'incident_description',
                                                                editingFields.incident_description ||
                                                                    null
                                                            )
                                                        }
                                                        disabled={
                                                            savingFields.incident_description
                                                        }
                                                        className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                    >
                                                        {savingFields.incident_description ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            'Save'
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setEditingFields(
                                                                prev => {
                                                                    const newFields =
                                                                        {
                                                                            ...prev,
                                                                        };
                                                                    delete newFields.incident_description;
                                                                    return newFields;
                                                                }
                                                            )
                                                        }
                                                        className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start justify-between group">
                                                <p className="text-white whitespace-pre-wrap flex-1">
                                                    {assessment.incident_description ||
                                                        'N/A'}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        handleFieldChange(
                                                            'incident_description',
                                                            assessment.incident_description
                                                        )
                                                    }
                                                    className="opacity-30 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-amber-500 transition-all rounded hover:bg-gray-800/50 ml-2"
                                                    title="Edit field"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-gray-400 block mb-1">
                                            Damage Areas (comma-separated)
                                        </label>
                                        {editingFields.damage_areas !==
                                        undefined ? (
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={
                                                        Array.isArray(
                                                            editingFields.damage_areas
                                                        )
                                                            ? editingFields.damage_areas.join(
                                                                  ', '
                                                              )
                                                            : Array.isArray(
                                                                  assessment.damage_areas
                                                              )
                                                            ? assessment.damage_areas.join(
                                                                  ', '
                                                              )
                                                            : ''
                                                    }
                                                    onChange={e => {
                                                        const areas =
                                                            e.target.value
                                                                .split(',')
                                                                .map(a =>
                                                                    a.trim()
                                                                )
                                                                .filter(a => a);
                                                        handleFieldChange(
                                                            'damage_areas',
                                                            areas
                                                        );
                                                    }}
                                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                                                    placeholder="e.g., Front Bumper, Hood, Left Door"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() =>
                                                            handleSaveField(
                                                                'damage_areas',
                                                                editingFields.damage_areas
                                                            )
                                                        }
                                                        disabled={
                                                            savingFields.damage_areas
                                                        }
                                                        className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                    >
                                                        {savingFields.damage_areas ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            'Save'
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setEditingFields(
                                                                prev => {
                                                                    const newFields =
                                                                        {
                                                                            ...prev,
                                                                        };
                                                                    delete newFields.damage_areas;
                                                                    return newFields;
                                                                }
                                                            )
                                                        }
                                                        className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {assessment.damage_areas &&
                                                assessment.damage_areas.length >
                                                    0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {assessment.damage_areas.map(
                                                            (area, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs border border-amber-500/50"
                                                                >
                                                                    {area}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500">
                                                        No damage areas
                                                        specified
                                                    </p>
                                                )}
                                                <button
                                                    onClick={() =>
                                                        handleFieldChange(
                                                            'damage_areas',
                                                            assessment.damage_areas ||
                                                                []
                                                        )
                                                    }
                                                    className="text-amber-500 hover:text-amber-400 text-xs flex items-center gap-1"
                                                >
                                                    <Edit className="w-3 h-3" />
                                                    Edit
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Owner Information */}
                            {ownerInfo && (
                                <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <User className="w-5 h-5 text-amber-500" />
                                        Owner Information
                                    </h3>
                                    <div className="space-y-3 text-sm">
                                        {(ownerInfo.firstName ||
                                            ownerInfo.lastName) && (
                                            <div>
                                                <p className="text-gray-400">
                                                    Name
                                                </p>
                                                <p className="text-white">
                                                    {ownerInfo.firstName}{' '}
                                                    {ownerInfo.lastName}
                                                </p>
                                            </div>
                                        )}
                                        {ownerInfo.email && (
                                            <div>
                                                <p className="text-gray-400">
                                                    Email
                                                </p>
                                                <p className="text-white">
                                                    {ownerInfo.email}
                                                </p>
                                            </div>
                                        )}
                                        {ownerInfo.mobile && (
                                            <div>
                                                <p className="text-gray-400">
                                                    Mobile
                                                </p>
                                                <p className="text-white">
                                                    {ownerInfo.mobile}
                                                </p>
                                            </div>
                                        )}
                                        {ownerInfo.altPhone && (
                                            <div>
                                                <p className="text-gray-400">
                                                    Alternate Phone
                                                </p>
                                                <p className="text-white">
                                                    {ownerInfo.altPhone}
                                                </p>
                                            </div>
                                        )}
                                        {ownerInfo.address && (
                                            <div>
                                                <p className="text-gray-400">
                                                    Address
                                                </p>
                                                <p className="text-white">
                                                    {ownerInfo.address}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Location Information (Onsite) */}
                            {locationInfo &&
                                assessment.assessment_type ===
                                    'Onsite Assessment' && (
                                    <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            <MapPin className="w-5 h-5 text-amber-500" />
                                            Location Information
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            {locationInfo.locationName && (
                                                <div>
                                                    <p className="text-gray-400">
                                                        Location Name
                                                    </p>
                                                    <p className="text-white">
                                                        {
                                                            locationInfo.locationName
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                            {locationInfo.streetAddress && (
                                                <div>
                                                    <p className="text-gray-400">
                                                        Address
                                                    </p>
                                                    <p className="text-white">
                                                        {
                                                            locationInfo.streetAddress
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                            {(locationInfo.suburb ||
                                                locationInfo.state ||
                                                locationInfo.postcode) && (
                                                <div>
                                                    <p className="text-gray-400">
                                                        Location
                                                    </p>
                                                    <p className="text-white">
                                                        {[
                                                            locationInfo.suburb,
                                                            locationInfo.state,
                                                            locationInfo.postcode,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(', ')}
                                                    </p>
                                                </div>
                                            )}
                                            {locationInfo.contactName && (
                                                <div>
                                                    <p className="text-gray-400">
                                                        Contact Name
                                                    </p>
                                                    <p className="text-white">
                                                        {
                                                            locationInfo.contactName
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                            {locationInfo.phone && (
                                                <div>
                                                    <p className="text-gray-400">
                                                        Phone
                                                    </p>
                                                    <p className="text-white">
                                                        {locationInfo.phone}
                                                    </p>
                                                </div>
                                            )}
                                            {locationInfo.preferredDate && (
                                                <div>
                                                    <p className="text-gray-400">
                                                        Preferred Date
                                                    </p>
                                                    <p className="text-white">
                                                        {formatDate(
                                                            locationInfo.preferredDate
                                                        )}
                                                    </p>
                                                </div>
                                            )}
                                            {locationInfo.preferredTime && (
                                                <div>
                                                    <p className="text-gray-400">
                                                        Preferred Time
                                                    </p>
                                                    <p className="text-white">
                                                        {
                                                            locationInfo.preferredTime
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                            {locationInfo.accessInstructions && (
                                                <div>
                                                    <p className="text-gray-400">
                                                        Access Instructions
                                                    </p>
                                                    <p className="text-white whitespace-pre-wrap">
                                                        {
                                                            locationInfo.accessInstructions
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* Additional Information */}
                            <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-white mb-4">
                                    Additional Information
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <label className="text-gray-400 block mb-1">
                                            Special Instructions
                                        </label>
                                        {editingFields.special_instructions !==
                                        undefined ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={
                                                        editingFields.special_instructions ||
                                                        ''
                                                    }
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            'special_instructions',
                                                            e.target.value ||
                                                                null
                                                        )
                                                    }
                                                    rows={3}
                                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 resize-none"
                                                    placeholder="Enter special instructions"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() =>
                                                            handleSaveField(
                                                                'special_instructions',
                                                                editingFields.special_instructions ||
                                                                    null
                                                            )
                                                        }
                                                        disabled={
                                                            savingFields.special_instructions
                                                        }
                                                        className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                    >
                                                        {savingFields.special_instructions ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            'Save'
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setEditingFields(
                                                                prev => {
                                                                    const newFields =
                                                                        {
                                                                            ...prev,
                                                                        };
                                                                    delete newFields.special_instructions;
                                                                    return newFields;
                                                                }
                                                            )
                                                        }
                                                        className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start justify-between group">
                                                <p className="text-white whitespace-pre-wrap flex-1">
                                                    {assessment.special_instructions ||
                                                        'N/A'}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        handleFieldChange(
                                                            'special_instructions',
                                                            assessment.special_instructions
                                                        )
                                                    }
                                                    className="opacity-30 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-amber-500 transition-all rounded hover:bg-gray-800/50 ml-2"
                                                    title="Edit field"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-gray-400 block mb-1">
                                            Internal Notes
                                        </label>
                                        {editingFields.internal_notes !==
                                        undefined ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={
                                                        editingFields.internal_notes ||
                                                        ''
                                                    }
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            'internal_notes',
                                                            e.target.value ||
                                                                null
                                                        )
                                                    }
                                                    rows={3}
                                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 resize-none"
                                                    placeholder="Enter internal notes"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() =>
                                                            handleSaveField(
                                                                'internal_notes',
                                                                editingFields.internal_notes ||
                                                                    null
                                                            )
                                                        }
                                                        disabled={
                                                            savingFields.internal_notes
                                                        }
                                                        className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                    >
                                                        {savingFields.internal_notes ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            'Save'
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setEditingFields(
                                                                prev => {
                                                                    const newFields =
                                                                        {
                                                                            ...prev,
                                                                        };
                                                                    delete newFields.internal_notes;
                                                                    return newFields;
                                                                }
                                                            )
                                                        }
                                                        className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start justify-between group">
                                                <p className="text-white whitespace-pre-wrap flex-1">
                                                    {assessment.internal_notes ||
                                                        'N/A'}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        handleFieldChange(
                                                            'internal_notes',
                                                            assessment.internal_notes
                                                        )
                                                    }
                                                    className="opacity-30 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-amber-500 transition-all rounded hover:bg-gray-800/50 ml-2"
                                                    title="Edit field"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Consents */}
                            <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-white mb-4">
                                    Consents
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={
                                                assessment.authority_confirmed
                                                    ? 'text-green-400'
                                                    : 'text-gray-500'
                                            }
                                        >
                                            {assessment.authority_confirmed
                                                ? '✓'
                                                : '✗'}
                                        </span>
                                        <span className="text-gray-400">
                                            Authority Confirmed
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={
                                                assessment.privacy_consent
                                                    ? 'text-green-400'
                                                    : 'text-gray-500'
                                            }
                                        >
                                            {assessment.privacy_consent
                                                ? '✓'
                                                : '✗'}
                                        </span>
                                        <span className="text-gray-400">
                                            Privacy Consent
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={
                                                assessment.email_report_consent
                                                    ? 'text-green-400'
                                                    : 'text-gray-500'
                                            }
                                        >
                                            {assessment.email_report_consent
                                                ? '✓'
                                                : '✗'}
                                        </span>
                                        <span className="text-gray-400">
                                            Email Report Consent
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={
                                                assessment.sms_updates
                                                    ? 'text-green-400'
                                                    : 'text-gray-500'
                                            }
                                        >
                                            {assessment.sms_updates ? '✓' : '✗'}
                                        </span>
                                        <span className="text-gray-400">
                                            SMS Updates
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Timestamps */}
                            <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-white mb-4">
                                    Timestamps
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <p className="text-gray-400">
                                            Created At
                                        </p>
                                        <p className="text-white">
                                            {formatDateTime(
                                                assessment.created_at
                                            )}
                                        </p>
                                    </div>
                                    {assessment.updated_at && (
                                        <div>
                                            <p className="text-gray-400">
                                                Updated At
                                            </p>
                                            <p className="text-white">
                                                {formatDateTime(
                                                    assessment.updated_at
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Damage Tab */}
                {activeTab === 'damage' && (
                    <div className="space-y-6">
                        <InteractiveDamageDiagram
                            assessmentId={assessment.id}
                            assetClass="LV"
                            bodyType={
                                assessment.vehicle_type === 'SUV'
                                    ? 'SUV'
                                    : 'SED'
                            }
                            initialDamage={(() => {
                                // Try to load SVC-compliant damage_data from assessment
                                // Check if damage_data exists (stored as JSON)
                                try {
                                    const damageData = (assessment as any)
                                        .damage_data;
                                    if (
                                        damageData &&
                                        Array.isArray(damageData)
                                    ) {
                                        return damageData as DamageEntry[];
                                    }
                                } catch (e) {
                                    console.error(
                                        'Error parsing damage_data:',
                                        e
                                    );
                                }

                                // Fallback: reconstruct from damage_areas if available
                                if (
                                    assessment.damage_areas &&
                                    assessment.damage_areas.length > 0
                                ) {
                                    return assessment.damage_areas.map(
                                        (area, idx) => {
                                            // Try to match zone ID from area name
                                            const zoneId = `LV_SUV_${area
                                                .replace(/\s+/g, '_')
                                                .toUpperCase()}`;
                                            return {
                                                zone_id: zoneId,
                                                label: area,
                                                category: 'PNL' as const,
                                                severity: 'LP' as const,
                                                pre_existing: false,
                                                comments: '',
                                            } as DamageEntry;
                                        }
                                    );
                                }
                                return [];
                            })()}
                            onSave={async damage => {
                                // Reload assessment to get updated data
                                await loadAssessment();
                                if (onUpdate) onUpdate();
                            }}
                            onUpdate={async () => {
                                await loadAssessment();
                                if (onUpdate) onUpdate();
                            }}
                        />
                    </div>
                )}

                {/* Repair Tab */}
                {activeTab === 'repair' && (
                    <div className="space-y-6">
                        <div className="bg-black/30 border border-gray-800 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Car className="w-5 h-5 text-amber-500" />
                                Repair Information
                            </h3>
                            <div className="text-center py-8 text-gray-400">
                                <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>Repair information will be displayed here</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Estimates Tab */}
                {activeTab === 'estimates' && (
                    <div className="space-y-6">
                        <div className="bg-black/30 border border-gray-800 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                                <DollarSign className="w-5 h-5 text-amber-500" />
                                Estimate Editor
                            </h3>
                            <EstimateEditor
                                assessmentId={assessment.id}
                                onUpdate={loadAssessment}
                            />
                        </div>
                    </div>
                )}

                {/* Reports Tab */}
                {activeTab === 'reports' && (
                    <div className="space-y-6">
                        <div className="bg-black/30 border border-gray-800 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                                <FileText className="w-5 h-5 text-amber-500" />
                                PDF Reports
                            </h3>
                            <PDFReportActions
                                assessmentId={assessment.id}
                                reportType="detailed-assessment"
                            />
                        </div>
                    </div>
                )}

                {/* Admin Tab */}
                {activeTab === 'admin' && (
                    <div className="space-y-6">
                        {/* Status Management */}
                        <div className="bg-black/30 border border-gray-800 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Edit className="w-5 h-5 text-amber-500" />
                                Status Management
                            </h3>
                            {!showStatusEdit ? (
                                <div className="flex items-center gap-4">
                                    <div>
                                        <p className="text-gray-400 mb-2">
                                            Current Status
                                        </p>
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 w-fit ${getStatusColor(
                                                assessment.status
                                            )}`}
                                        >
                                            {getStatusIcon(assessment.status)}
                                            {assessment.status
                                                .charAt(0)
                                                .toUpperCase() +
                                                assessment.status.slice(1)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setShowStatusEdit(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded-lg hover:bg-amber-500/30 transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit Status
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <select
                                        value={newStatus}
                                        onChange={e =>
                                            setNewStatus(
                                                e.target.value as
                                                    | 'pending'
                                                    | 'processing'
                                                    | 'completed'
                                                    | 'cancelled'
                                            )
                                        }
                                        className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="processing">
                                            Processing
                                        </option>
                                        <option value="completed">
                                            Completed
                                        </option>
                                        <option value="cancelled">
                                            Cancelled
                                        </option>
                                    </select>
                                    <button
                                        onClick={handleStatusUpdate}
                                        disabled={updating}
                                        className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                    >
                                        {updating ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            'Save'
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setShowStatusEdit(false)}
                                        className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Files Section */}
                        <div className="bg-black/30 border border-gray-800 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-amber-500" />
                                    Files ({files.length})
                                </h3>
                                <label className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded-lg hover:bg-amber-500/30 transition-colors cursor-pointer">
                                    <Upload className="w-4 h-4" />
                                    {uploading
                                        ? 'Uploading...'
                                        : 'Upload Files'}
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                        className="hidden"
                                        accept="image/*,.pdf,.doc,.docx"
                                    />
                                </label>
                            </div>

                            {files.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No files uploaded yet</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {files.map(file => (
                                        <div
                                            key={file.id}
                                            className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 hover:border-amber-500/50 transition-colors"
                                        >
                                            <div className="aspect-square bg-gray-800 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                                                {file.file_type.startsWith(
                                                    'image/'
                                                ) ? (
                                                    <Image
                                                        src={file.file_url}
                                                        alt={file.file_name}
                                                        width={100}
                                                        height={100}
                                                        className="object-cover w-full h-full"
                                                    />
                                                ) : (
                                                    <FileText className="w-8 h-8 text-gray-500" />
                                                )}
                                            </div>
                                            <p
                                                className="text-white text-xs font-medium truncate mb-1"
                                                title={file.file_name}
                                            >
                                                {file.file_name}
                                            </p>
                                            <p className="text-gray-500 text-xs mb-2">
                                                {formatFileSize(file.file_size)}
                                            </p>
                                            <a
                                                href={file.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 text-xs"
                                            >
                                                <Download className="w-3 h-3" />
                                                Download
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Delete Section */}
                        <div className="bg-black/30 border border-red-500/30 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Trash2 className="w-5 h-5 text-red-500" />
                                Danger Zone
                            </h3>
                            <p className="text-gray-400 text-sm mb-4">
                                Once you delete an assessment, there is no going
                                back. Please be certain.
                            </p>
                            <button
                                onClick={handleDelete}
                                disabled={updating}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Assessment
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
