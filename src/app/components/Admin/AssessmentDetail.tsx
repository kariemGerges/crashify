import React, { useState, useEffect } from 'react';
import {
    X,
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

interface AssessmentDetailProps {
    assessmentId: string;
    onClose: () => void;
    onUpdate?: () => void;
}

export const AssessmentDetail: React.FC<AssessmentDetailProps> = ({
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
    const [newStatus, setNewStatus] = useState<'pending' | 'processing' | 'completed' | 'cancelled'>('pending');
    const { showError, showSuccess, showConfirm } = useToast(); // Toast context hooks to show toast messages and confirm dialogs   // Destructure the toast context hooks to use them in the component 
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
            if (onUpdate) onUpdate();
        } catch (err: unknown) {
            showError(err instanceof Error ? err.message : 'Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async () => {
        const confirm = await showConfirm('Are you sure you want to delete this assessment?');
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
            showError(err instanceof Error ? err.message : 'Failed to delete assessment');
        } finally {
            setUpdating(false);
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

            const response = await fetch(`/api/assessments/${assessmentId}/files`, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.error) {
                showError(result.error);
                return;
            }

            showSuccess(`Successfully uploaded ${result.uploaded} file(s)`);
            loadFiles();
        } catch (err: unknown) {
            showError(err instanceof Error ? err.message : 'Failed to upload files');
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
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-gray-900 border border-amber-500/20 rounded-xl p-8">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                    <p className="text-gray-400 mt-4">Loading assessment details...</p>
                </div>
            </div>
        );
    }

    if (error || !assessment) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-gray-900 border border-red-500/20 rounded-xl p-8 max-w-md">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                    <p className="text-red-400 text-center mb-4">{error || 'Assessment not found'}</p>
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-screen p-4 md:p-8">
                <div className="max-w-6xl mx-auto bg-gray-900 border border-amber-500/20 rounded-xl p-6 md:p-8 my-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-800">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-2xl font-bold text-white">Assessment Details</h2>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(
                                        assessment.status
                                    )}`}
                                >
                                    {getStatusIcon(assessment.status)}
                                    {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm">ID: {assessment.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {!showStatusEdit ? (
                                <>
                                    <button
                                        onClick={() => setShowStatusEdit(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded-lg hover:bg-amber-500/30 transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit Status
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={updating}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value as 'pending' | 'processing' | 'completed' | 'cancelled')}
                                        className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                    <button
                                        onClick={handleStatusUpdate}
                                        disabled={updating}
                                        className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                    >
                                        {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => setShowStatusEdit(false)}
                                        className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
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
                                        <p className="text-gray-400">Company Name</p>
                                        <p className="text-white">{assessment.company_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Contact Name</p>
                                        <p className="text-white">{assessment.your_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Email</p>
                                        <p className="text-white">{assessment.your_email}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Phone</p>
                                        <p className="text-white">{assessment.your_phone}</p>
                                    </div>
                                    {assessment.your_role && (
                                        <div>
                                            <p className="text-gray-400">Role</p>
                                            <p className="text-white">{assessment.your_role}</p>
                                        </div>
                                    )}
                                    {assessment.department && (
                                        <div>
                                            <p className="text-gray-400">Department</p>
                                            <p className="text-white">{assessment.department}</p>
                                        </div>
                                    )}
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
                                        <p className="text-gray-400">Assessment Type</p>
                                        <p className="text-white">{assessment.assessment_type}</p>
                                    </div>
                                    {assessment.vehicle_type && (
                                        <div>
                                            <p className="text-gray-400">Vehicle Type</p>
                                            <p className="text-white">{assessment.vehicle_type}</p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-gray-400">Make</p>
                                            <p className="text-white">{assessment.make}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Model</p>
                                            <p className="text-white">{assessment.model}</p>
                                        </div>
                                    </div>
                                    {assessment.year && (
                                        <div>
                                            <p className="text-gray-400">Year</p>
                                            <p className="text-white">{assessment.year}</p>
                                        </div>
                                    )}
                                    {assessment.registration && (
                                        <div>
                                            <p className="text-gray-400">Registration</p>
                                            <p className="text-white">{assessment.registration}</p>
                                        </div>
                                    )}
                                    {assessment.vin && (
                                        <div>
                                            <p className="text-gray-400">VIN</p>
                                            <p className="text-white font-mono text-xs">{assessment.vin}</p>
                                        </div>
                                    )}
                                    {assessment.color && (
                                        <div>
                                            <p className="text-gray-400">Color</p>
                                            <p className="text-white">{assessment.color}</p>
                                        </div>
                                    )}
                                    {assessment.odometer && (
                                        <div>
                                            <p className="text-gray-400">Odometer</p>
                                            <p className="text-white">{assessment.odometer.toLocaleString()} km</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Insurance Information */}
                            {(assessment.insurance_value_type || assessment.insurance_value_amount) && (
                                <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-amber-500" />
                                        Insurance Information
                                    </h3>
                                    <div className="space-y-3 text-sm">
                                        {assessment.insurance_value_type && (
                                            <div>
                                                <p className="text-gray-400">Value Type</p>
                                                <p className="text-white">{assessment.insurance_value_type}</p>
                                            </div>
                                        )}
                                        {assessment.insurance_value_amount && (
                                            <div>
                                                <p className="text-gray-400">Value Amount</p>
                                                <p className="text-white">
                                                    ${assessment.insurance_value_amount.toLocaleString()}
                                                </p>
                                            </div>
                                        )}
                                        {assessment.claim_reference && (
                                            <div>
                                                <p className="text-gray-400">Claim Reference</p>
                                                <p className="text-white">{assessment.claim_reference}</p>
                                            </div>
                                        )}
                                        {assessment.policy_number && (
                                            <div>
                                                <p className="text-gray-400">Policy Number</p>
                                                <p className="text-white">{assessment.policy_number}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Incident Information */}
                            {(assessment.incident_date || assessment.incident_location || assessment.incident_description) && (
                                <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-amber-500" />
                                        Incident Information
                                    </h3>
                                    <div className="space-y-3 text-sm">
                                        {assessment.incident_date && (
                                            <div>
                                                <p className="text-gray-400">Incident Date</p>
                                                <p className="text-white">{formatDate(assessment.incident_date)}</p>
                                            </div>
                                        )}
                                        {assessment.incident_location && (
                                            <div>
                                                <p className="text-gray-400">Incident Location</p>
                                                <p className="text-white">{assessment.incident_location}</p>
                                            </div>
                                        )}
                                        {assessment.incident_description && (
                                            <div>
                                                <p className="text-gray-400">Description</p>
                                                <p className="text-white whitespace-pre-wrap">{assessment.incident_description}</p>
                                            </div>
                                        )}
                                        {assessment.damage_areas && assessment.damage_areas.length > 0 && (
                                            <div>
                                                <p className="text-gray-400">Damage Areas</p>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {assessment.damage_areas.map((area, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs border border-amber-500/50"
                                                        >
                                                            {area}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Owner Information */}
                            {ownerInfo && (
                                <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <User className="w-5 h-5 text-amber-500" />
                                        Owner Information
                                    </h3>
                                    <div className="space-y-3 text-sm">
                                        {(ownerInfo.firstName || ownerInfo.lastName) && (
                                            <div>
                                                <p className="text-gray-400">Name</p>
                                                <p className="text-white">
                                                    {ownerInfo.firstName} {ownerInfo.lastName}
                                                </p>
                                            </div>
                                        )}
                                        {ownerInfo.email && (
                                            <div>
                                                <p className="text-gray-400">Email</p>
                                                <p className="text-white">{ownerInfo.email}</p>
                                            </div>
                                        )}
                                        {ownerInfo.mobile && (
                                            <div>
                                                <p className="text-gray-400">Mobile</p>
                                                <p className="text-white">{ownerInfo.mobile}</p>
                                            </div>
                                        )}
                                        {ownerInfo.altPhone && (
                                            <div>
                                                <p className="text-gray-400">Alternate Phone</p>
                                                <p className="text-white">{ownerInfo.altPhone}</p>
                                            </div>
                                        )}
                                        {ownerInfo.address && (
                                            <div>
                                                <p className="text-gray-400">Address</p>
                                                <p className="text-white">{ownerInfo.address}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Location Information (Onsite) */}
                            {locationInfo && assessment.assessment_type === 'Onsite Assessment' && (
                                <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-amber-500" />
                                        Location Information
                                    </h3>
                                    <div className="space-y-3 text-sm">
                                        {locationInfo.locationName && (
                                            <div>
                                                <p className="text-gray-400">Location Name</p>
                                                <p className="text-white">{locationInfo.locationName}</p>
                                            </div>
                                        )}
                                        {locationInfo.streetAddress && (
                                            <div>
                                                <p className="text-gray-400">Address</p>
                                                <p className="text-white">{locationInfo.streetAddress}</p>
                                            </div>
                                        )}
                                        {(locationInfo.suburb || locationInfo.state || locationInfo.postcode) && (
                                            <div>
                                                <p className="text-gray-400">Location</p>
                                                <p className="text-white">
                                                    {[locationInfo.suburb, locationInfo.state, locationInfo.postcode]
                                                        .filter(Boolean)
                                                        .join(', ')}
                                                </p>
                                            </div>
                                        )}
                                        {locationInfo.contactName && (
                                            <div>
                                                <p className="text-gray-400">Contact Name</p>
                                                <p className="text-white">{locationInfo.contactName}</p>
                                            </div>
                                        )}
                                        {locationInfo.phone && (
                                            <div>
                                                <p className="text-gray-400">Phone</p>
                                                <p className="text-white">{locationInfo.phone}</p>
                                            </div>
                                        )}
                                        {locationInfo.preferredDate && (
                                            <div>
                                                <p className="text-gray-400">Preferred Date</p>
                                                <p className="text-white">{formatDate(locationInfo.preferredDate)}</p>
                                            </div>
                                        )}
                                        {locationInfo.preferredTime && (
                                            <div>
                                                <p className="text-gray-400">Preferred Time</p>
                                                <p className="text-white">{locationInfo.preferredTime}</p>
                                            </div>
                                        )}
                                        {locationInfo.accessInstructions && (
                                            <div>
                                                <p className="text-gray-400">Access Instructions</p>
                                                <p className="text-white whitespace-pre-wrap">{locationInfo.accessInstructions}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Additional Information */}
                            {(assessment.special_instructions || assessment.internal_notes) && (
                                <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-white mb-4">Additional Information</h3>
                                    <div className="space-y-3 text-sm">
                                        {assessment.special_instructions && (
                                            <div>
                                                <p className="text-gray-400">Special Instructions</p>
                                                <p className="text-white whitespace-pre-wrap">{assessment.special_instructions}</p>
                                            </div>
                                        )}
                                        {assessment.internal_notes && (
                                            <div>
                                                <p className="text-gray-400">Internal Notes</p>
                                                <p className="text-white whitespace-pre-wrap">{assessment.internal_notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Consents */}
                            <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-white mb-4">Consents</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className={assessment.authority_confirmed ? 'text-green-400' : 'text-gray-500'}>
                                            {assessment.authority_confirmed ? '✓' : '✗'}
                                        </span>
                                        <span className="text-gray-400">Authority Confirmed</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={assessment.privacy_consent ? 'text-green-400' : 'text-gray-500'}>
                                            {assessment.privacy_consent ? '✓' : '✗'}
                                        </span>
                                        <span className="text-gray-400">Privacy Consent</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={assessment.email_report_consent ? 'text-green-400' : 'text-gray-500'}>
                                            {assessment.email_report_consent ? '✓' : '✗'}
                                        </span>
                                        <span className="text-gray-400">Email Report Consent</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={assessment.sms_updates ? 'text-green-400' : 'text-gray-500'}>
                                            {assessment.sms_updates ? '✓' : '✗'}
                                        </span>
                                        <span className="text-gray-400">SMS Updates</span>
                                    </div>
                                </div>
                            </div>

                            {/* Timestamps */}
                            <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-white mb-4">Timestamps</h3>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <p className="text-gray-400">Created At</p>
                                        <p className="text-white">{formatDateTime(assessment.created_at)}</p>
                                    </div>
                                    {assessment.updated_at && (
                                        <div>
                                            <p className="text-gray-400">Updated At</p>
                                            <p className="text-white">{formatDateTime(assessment.updated_at)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Files Section */}
                    <div className="mt-6 pt-6 border-t border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-amber-500" />
                                Files ({files.length})
                            </h3>
                            <label className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded-lg hover:bg-amber-500/30 transition-colors cursor-pointer">
                                <Upload className="w-4 h-4" />
                                {uploading ? 'Uploading...' : 'Upload Files'}
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
                                        className="bg-black/30 border border-gray-800 rounded-lg p-3 hover:border-amber-500/50 transition-colors"
                                    >
                                        <div className="aspect-square bg-gray-800 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                                            {file.file_type.startsWith('image/') ? (
                                                <Image
                                                    src={file.file_url}
                                                    alt={file.file_name}
                                                    width={100}
                                                    height={100}
                                                />
                                            ) : (
                                                <FileText className="w-8 h-8 text-gray-500" />
                                            )}
                                        </div>
                                        <p className="text-white text-xs font-medium truncate mb-1" title={file.file_name}>
                                            {file.file_name}
                                        </p>
                                        <p className="text-gray-500 text-xs mb-2">{formatFileSize(file.file_size)}</p>
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
                </div>
            </div>
        </div>
    );
};

