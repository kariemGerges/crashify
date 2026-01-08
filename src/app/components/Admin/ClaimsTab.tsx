import React, { useState, useEffect } from 'react';
import {
    FileText,
    Loader2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Copy,
    Send,
    Plus,
    X,
    CheckCircle,
    Mail,
    RefreshCw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { IQHelper } from './IQHelper';
import { EmailAutomation } from './EmailAutomation';
import { ManualClaimForm } from './ManualClaimForm';
import { useToast } from '../Toast';
import { EmailProcessingLoader } from './EmailProcessingLoader';

interface Claim {
    id: string;
    company_name: string;
    your_name: string;
    your_email: string;
    assessment_type: string;
    make: string;
    model: string;
    registration: string;
    status: 'pending' | 'processing' | 'completed';
    source?: string;
    created_at: string;
}

interface Pagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

interface ClaimsResponse {
    data: Claim[];
    pagination: Pagination;
}

export const ClaimsTab: React.FC = () => {
    const toast = useToast();
    const router = useRouter();
    const [activeSubTab, setActiveSubTab] = useState<
        'user-submitted' | 'email-processed' | 'manually-added'
    >('user-submitted');
    const [showAddForm, setShowAddForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [addSuccess, setAddSuccess] = useState(false);
    const [claims, setClaims] = useState<Claim[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [iqHelperAssessmentId, setIqHelperAssessmentId] = useState<
        string | null
    >(null);
    const [emailAutomationAssessmentId, setEmailAutomationAssessmentId] =
        useState<string | null>(null);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
    });
    
    // Email processing state
    const [processingEmails, setProcessingEmails] = useState(false);
    const [emailProcessResult, setEmailProcessResult] = useState<{
        processed: number;
        created: number;
        errors: Array<{ emailId: string; error: string }>;
    } | null>(null);
    const [processingStage, setProcessingStage] = useState<string>('connecting');
    const [processingProgress, setProcessingProgress] = useState(0);
    const [processingMessage, setProcessingMessage] = useState<string>('');

    const loadClaims = async (
        page: number = 1,
        pageSize: number = 20,
        source?: string
    ) => {
        setLoading(true);
        setError('');

        try {
            let url = `/api/assessments?page=${page}&pageSize=${pageSize}`;
            if (source) {
                url += `&source=${source}`;
            }
            const response = await fetch(url);
            const result: ClaimsResponse = await response.json();

            if (result.data) {
                setClaims(result.data);
                setPagination(result.pagination);
            } else {
                setError('Failed to load claims');
            }
        } catch (err: unknown) {
            setError(
                err instanceof Error ? err.message : 'Failed to load claims'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Load claims based on active tab
        let source: string | undefined;
        if (activeSubTab === 'email-processed') {
            source = 'email';
        } else if (activeSubTab === 'manually-added') {
            source = 'manual';
        } else {
            source = 'web_form';
        }
        loadClaims(1, pagination.pageSize, source);
    }, [activeSubTab]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            let source: string | undefined;
            if (activeSubTab === 'email-processed') {
                source = 'email';
            } else if (activeSubTab === 'manually-added') {
                source = 'manual';
            } else {
                source = 'web_form';
            }
            loadClaims(newPage, pagination.pageSize, source);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500/20 text-green-400 border-green-500/50';
            case 'processing':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
            case 'pending':
                return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const [formData, setFormData] = useState({
        companyName: '',
        yourName: '',
        yourEmail: '',
        yourPhone: '',
        yourRole: '',
        department: '',
        assessmentType: 'Desktop Assessment' as 'Desktop Assessment' | 'Onsite Assessment',
        claimReference: '',
        policyNumber: '',
        incidentDate: '',
        incidentLocation: '',
        vehicleType: '',
        year: '',
        make: '',
        model: '',
        registration: '',
        vin: '',
        color: '',
        odometer: '',
        insuranceValueType: '',
        insuranceValueAmount: '',
        ownerFirstName: '',
        ownerLastName: '',
        ownerEmail: '',
        ownerMobile: '',
        ownerAltPhone: '',
        ownerAddress: '',
        onsiteLocationType: '',
        locationName: '',
        streetAddress: '',
        suburb: '',
        state: '',
        postcode: '',
        locationContactName: '',
        locationPhone: '',
        locationEmail: '',
        preferredDate: '',
        preferredTime: '',
        accessInstructions: '',
        incidentDescription: '',
        damageAreas: [] as string[],
        specialInstructions: '',
        internalNotes: '',
        authorityConfirmed: true,
        privacyConsent: true,
        emailReportConsent: true,
        smsUpdates: false,
    });

    const handleAddClaim = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setAddSuccess(false);

        try {
            // Prepare owner info
            const ownerInfo = formData.ownerFirstName || formData.ownerLastName
                ? {
                      firstName: formData.ownerFirstName,
                      lastName: formData.ownerLastName,
                      email: formData.ownerEmail,
                      mobile: formData.ownerMobile,
                      altPhone: formData.ownerAltPhone,
                      address: formData.ownerAddress,
                  }
                : undefined;

            // Prepare location info (only for onsite assessments)
            const locationInfo = formData.assessmentType === 'Onsite Assessment'
                ? {
                      type: formData.onsiteLocationType,
                      name: formData.locationName,
                      streetAddress: formData.streetAddress,
                      suburb: formData.suburb,
                      state: formData.state,
                      postcode: formData.postcode,
                      contactName: formData.locationContactName,
                      phone: formData.locationPhone,
                      email: formData.locationEmail,
                      preferredDate: formData.preferredDate,
                      preferredTime: formData.preferredTime,
                      accessInstructions: formData.accessInstructions,
                  }
                : undefined;

            const response = await fetch('/api/assessments/manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company_name: formData.companyName,
                    your_name: formData.yourName,
                    your_email: formData.yourEmail,
                    your_phone: formData.yourPhone,
                    your_role: formData.yourRole || undefined,
                    department: formData.department || undefined,
                    assessment_type: formData.assessmentType,
                    claim_reference: formData.claimReference || undefined,
                    policy_number: formData.policyNumber || undefined,
                    incident_date: formData.incidentDate || undefined,
                    incident_location: formData.incidentLocation || undefined,
                    vehicle_type: formData.vehicleType || undefined,
                    year: formData.year ? parseInt(formData.year) : undefined,
                    make: formData.make,
                    model: formData.model,
                    registration: formData.registration?.toUpperCase() || undefined,
                    vin: formData.vin?.toUpperCase() || undefined,
                    color: formData.color || undefined,
                    odometer: formData.odometer ? parseInt(formData.odometer) : undefined,
                    insurance_value_type: formData.insuranceValueType || undefined,
                    insurance_value_amount: formData.insuranceValueAmount || undefined,
                    owner_info: ownerInfo,
                    location_info: locationInfo,
                    incident_description: formData.incidentDescription || undefined,
                    damage_areas: formData.damageAreas,
                    special_instructions: formData.specialInstructions || undefined,
                    internal_notes: formData.internalNotes || undefined,
                    authority_confirmed: formData.authorityConfirmed,
                    privacy_consent: formData.privacyConsent,
                    email_report_consent: formData.emailReportConsent,
                    sms_updates: formData.smsUpdates,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to add claim');
            }

            setAddSuccess(true);
            // Reset form
            setFormData({
                companyName: '',
                yourName: '',
                yourEmail: '',
                yourPhone: '',
                yourRole: '',
                department: '',
                assessmentType: 'Desktop Assessment',
                claimReference: '',
                policyNumber: '',
                incidentDate: '',
                incidentLocation: '',
                vehicleType: '',
                year: '',
                make: '',
                model: '',
                registration: '',
                vin: '',
                color: '',
                odometer: '',
                insuranceValueType: '',
                insuranceValueAmount: '',
                ownerFirstName: '',
                ownerLastName: '',
                ownerEmail: '',
                ownerMobile: '',
                ownerAltPhone: '',
                ownerAddress: '',
                onsiteLocationType: '',
                locationName: '',
                streetAddress: '',
                suburb: '',
                state: '',
                postcode: '',
                locationContactName: '',
                locationPhone: '',
                locationEmail: '',
                preferredDate: '',
                preferredTime: '',
                accessInstructions: '',
                incidentDescription: '',
                damageAreas: [],
                specialInstructions: '',
                internalNotes: '',
                authorityConfirmed: true,
                privacyConsent: true,
                emailReportConsent: true,
                smsUpdates: false,
            });
            
            // Reload claims
            const source = 'manual';
            loadClaims(1, pagination.pageSize, source);
            
            // Close form after 2 seconds
            setTimeout(() => {
                setShowAddForm(false);
                setAddSuccess(false);
            }, 2000);
        } catch (err: unknown) {
            setError(
                err instanceof Error ? err.message : 'Failed to add claim'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDamageAreasChange = (area: string) => {
        setFormData(prev => ({
            ...prev,
            damageAreas: prev.damageAreas.includes(area)
                ? prev.damageAreas.filter(a => a !== area)
                : [...prev.damageAreas, area],
        }));
    };

    // Handle the process emails action
    const handleProcessEmails = async () => {
        setProcessingEmails(true);
        setEmailProcessResult(null);
        setProcessingStage('connecting');
        setProcessingProgress(0);
        setProcessingMessage('');

        // Stage progression with timing
        const stageTimings = {
            connecting: 500,
            fetching: 2000,
            'ai-processing': 3000,
            creating: 2000,
            finalizing: 1000,
        };

        const updateStage = (stage: string, progress: number, message?: string) => {
            setProcessingStage(stage);
            setProcessingProgress(progress);
            if (message) setProcessingMessage(message);
        };

        try {
            // Stage 1: Connecting
            updateStage('connecting', 10, 'Connecting to email server...');
            await new Promise(resolve => setTimeout(resolve, stageTimings.connecting));

            // Stage 2: Fetching
            updateStage('fetching', 25, 'Fetching unread emails from inbox...');
            await new Promise(resolve => setTimeout(resolve, stageTimings.fetching));

            // Stage 3: AI Processing
            updateStage('ai-processing', 50, 'Claude AI is extracting claim information...');
            await new Promise(resolve => setTimeout(resolve, stageTimings['ai-processing']));

            // Stage 4: Creating
            updateStage('creating', 75, 'Creating assessment records...');
            await new Promise(resolve => setTimeout(resolve, stageTimings.creating));

            // Stage 5: Finalizing
            updateStage('finalizing', 90, 'Saving attachments and finalizing...');
            await new Promise(resolve => setTimeout(resolve, stageTimings.finalizing));

            // Make the actual API call
            updateStage('finalizing', 95, 'Completing processing...');
            const response = await fetch('/api/email/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            // Get the result
            const result = await response.json();

            // If the response is not ok, throw an error
            if (!response.ok) {
                throw new Error(
                    result.error || result.details || 'Failed to process emails'
                );
            }

            // Complete
            updateStage('finalizing', 100, 'Processing complete!');
            await new Promise(resolve => setTimeout(resolve, 500));

            // Set the email process result
            setEmailProcessResult({
                processed: result.processed || 0,
                created: result.created || 0,
                errors: Array.isArray(result.errors)
                    ? result.errors.map(
                          (err: string | { emailId: string; error: string }) =>
                              typeof err === 'string'
                                  ? { emailId: 'unknown', error: err }
                                  : err
                      )
                    : [],
            });

            // Show success toast
            toast.showSuccess(
                `Processed ${result.processed || 0} emails, created ${
                    result.created || 0
                } assessments`
            );

            // Reload claims if on email-processed tab
            if (activeSubTab === 'email-processed') {
                loadClaims(1, pagination.pageSize, 'email');
            }
        } catch (err: unknown) {
            // Show error toast
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to process emails';
            toast.showError(errorMessage);
            // Set the email process result
            setEmailProcessResult({
                processed: 0,
                created: 0,
                errors: [{ emailId: 'system', error: errorMessage }],
            });
            setProcessingMessage(`Error: ${errorMessage}`);
        } finally {
            // Wait a moment before closing
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Set the processing emails to false
            setProcessingEmails(false);
            setProcessingStage('connecting');
            setProcessingProgress(0);
            setProcessingMessage('');
        }
    };

    return (
        <>
            {/* Email Processing Loader */}
            <EmailProcessingLoader
                isOpen={processingEmails}
                currentStage={processingStage}
                progress={processingProgress}
                message={processingMessage}
                error={
                    emailProcessResult?.errors.length
                        ? emailProcessResult.errors[0]?.error
                        : undefined
                }
            />

            <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Recent Claims</h3>
                {pagination.total > 0 && (
                    <p className="text-gray-400 text-sm">
                        Showing{' '}
                        {(pagination.page - 1) * pagination.pageSize + 1}-
                        {Math.min(
                            pagination.page * pagination.pageSize,
                            pagination.total
                        )}{' '}
                        of {pagination.total}
                    </p>
                )}
            </div>

            {/* Sub-tabs for User Submitted, Email Processed, and Manually Added */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2 border-b border-gray-800">
                    <button
                        onClick={() => setActiveSubTab('user-submitted')}
                        className={`px-4 py-2 font-medium transition-colors ${
                            activeSubTab === 'user-submitted'
                                ? 'text-amber-400 border-b-2 border-amber-400'
                                : 'text-gray-400 hover:text-gray-300'
                        }`}
                    >
                        User Submitted
                    </button>
                    <button
                        onClick={() => setActiveSubTab('email-processed')}
                        className={`px-4 py-2 font-medium transition-colors ${
                            activeSubTab === 'email-processed'
                                ? 'text-amber-400 border-b-2 border-amber-400'
                                : 'text-gray-400 hover:text-gray-300'
                        }`}
                    >
                        Email Processed
                    </button>
                    <button
                        onClick={() => setActiveSubTab('manually-added')}
                        className={`px-4 py-2 font-medium transition-colors ${
                            activeSubTab === 'manually-added'
                                ? 'text-amber-400 border-b-2 border-amber-400'
                                : 'text-gray-400 hover:text-gray-300'
                        }`}
                    >
                        Manually Added
                    </button>
                </div>
                {activeSubTab === 'manually-added' && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-red-600 text-white rounded-lg hover:from-amber-600 hover:to-red-700 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Add Claim
                    </button>
                )}
            </div>

            {/* Email Processing Section - Only shown on email-processed tab */}
            {activeSubTab === 'email-processed' && (
                <div className="mb-6 bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-red-600 rounded-lg flex items-center justify-center">
                            <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">
                                Email Processing
                            </h3>
                            <p className="text-gray-400 text-sm">
                                Manually trigger email processing from
                                info@crashify.com.au
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-black/30 rounded-lg border border-gray-800">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-white font-medium">
                                        Process Unread Emails
                                    </p>
                                    <p className="text-gray-400 text-sm">
                                        Check for new emails and create
                                        assessments automatically
                                    </p>
                                </div>
                                <button
                                    onClick={handleProcessEmails}
                                    disabled={processingEmails}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-red-600 text-white rounded-lg hover:from-amber-600 hover:to-red-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processingEmails ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-4 h-4" />
                                            Process Emails
                                        </>
                                    )}
                                </button>
                            </div>

                            {emailProcessResult && (
                                <div
                                    className={`mt-4 p-4 rounded-lg border ${
                                        emailProcessResult.errors.length > 0
                                            ? 'bg-red-500/10 border-red-500/50'
                                            : 'bg-green-500/10 border-green-500/50'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {emailProcessResult.errors.length > 0 ? (
                                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                        ) : (
                                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                        )}
                                        <div className="flex-1">
                                            <p
                                                className={`font-medium mb-2 ${
                                                    emailProcessResult.errors
                                                        .length > 0
                                                        ? 'text-red-400'
                                                        : 'text-green-400'
                                                }`}
                                            >
                                                Processing Complete
                                            </p>
                                            <div className="space-y-1 text-sm">
                                                <p className="text-gray-300">
                                                    <span className="font-medium">
                                                        Emails Processed:
                                                    </span>{' '}
                                                    {
                                                        emailProcessResult.processed
                                                    }
                                                </p>
                                                <p className="text-gray-300">
                                                    <span className="font-medium">
                                                        Assessments Created:
                                                    </span>{' '}
                                                    {emailProcessResult.created}
                                                </p>
                                                {emailProcessResult.errors
                                                    .length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="text-red-400 font-medium mb-1">
                                                            Errors:
                                                        </p>
                                                        <ul className="list-disc list-inside text-red-300 space-y-1">
                                                            {emailProcessResult.errors.map(
                                                                (
                                                                    errorItem,
                                                                    idx
                                                                ) => (
                                                                    <li
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="text-xs"
                                                                    >
                                                                        {errorItem.emailId &&
                                                                            errorItem.emailId !==
                                                                                'system' && (
                                                                                <span className="font-medium">
                                                                                    {
                                                                                        errorItem.emailId
                                                                                    }
                                                                                    :{' '}
                                                                                </span>
                                                                            )}
                                                                        {
                                                                            errorItem.error
                                                                        }
                                                                    </li>
                                                                )
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() =>
                                                setEmailProcessResult(null)
                                            }
                                            className="text-gray-400 hover:text-white transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Claim Form Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-amber-500/20 rounded-xl p-6 max-w-4xl w-full max-h-[95vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">
                                Add Claim Manually
                            </h3>
                            <button
                                onClick={() => {
                                    setShowAddForm(false);
                                    setAddSuccess(false);
                                }}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {addSuccess && (
                            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/50 rounded-lg flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <p className="text-green-400 text-sm">
                                    Claim added successfully!
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <ManualClaimForm
                            formData={formData}
                            setFormData={setFormData}
                            onSubmit={handleAddClaim}
                            onCancel={() => {
                                setShowAddForm(false);
                                setAddSuccess(false);
                            }}
                            submitting={submitting}
                            handleDamageAreasChange={handleDamageAreasChange}
                        />
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
            ) : claims.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No claims found</p>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {claims.map(claim => (
                            <div
                                key={claim.id}
                                onClick={() =>
                                    router.push(`/admin/assessments/${claim.id}`)
                                }
                                className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-gray-800 hover:border-amber-500/50 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <p className="text-white font-medium">
                                                {claim.company_name}
                                            </p>
                                            <span className="text-gray-500 text-xs">
                                                #{claim.id.slice(0, 8)}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                                            <span>{claim.your_name}</span>
                                            <span>•</span>
                                            <span>
                                                {claim.make} {claim.model}
                                            </span>
                                            {claim.registration && (
                                                <>
                                                    <span>•</span>
                                                    <span>
                                                        {claim.registration}
                                                    </span>
                                                </>
                                            )}
                                            <span>•</span>
                                            <span>{claim.assessment_type}</span>
                                        </div>
                                        <p className="text-gray-500 text-xs mt-1">
                                            {formatDate(claim.created_at)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            setIqHelperAssessmentId(claim.id);
                                        }}
                                        className="p-2 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded-lg hover:bg-amber-500/30 transition-colors"
                                        title="Open IQ Controls Helper"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                    {(claim.status === 'processing' ||
                                        claim.status === 'completed') && (
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                setEmailAutomationAssessmentId(
                                                    claim.id
                                                );
                                            }}
                                            className="p-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors"
                                            title="Complete & Send Reports"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    )}
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                            claim.status
                                        )}`}
                                    >
                                        {claim.status.charAt(0).toUpperCase() +
                                            claim.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-800">
                            <button
                                onClick={() =>
                                    handlePageChange(pagination.page - 1)
                                }
                                disabled={pagination.page === 1}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </button>
                            <div className="text-gray-400 text-sm">
                                Page {pagination.page} of{' '}
                                {pagination.totalPages}
                            </div>
                            <button
                                onClick={() =>
                                    handlePageChange(pagination.page + 1)
                                }
                                disabled={
                                    pagination.page >= pagination.totalPages
                                }
                                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </>
            )}

            {iqHelperAssessmentId && (
                <IQHelper
                    assessmentId={iqHelperAssessmentId}
                    onClose={() => setIqHelperAssessmentId(null)}
                    onUpdate={() => {
                        let source: string | undefined;
                        if (activeSubTab === 'email-processed') {
                            source = 'email';
                        } else if (activeSubTab === 'manually-added') {
                            source = 'manual';
                        } else {
                            source = 'web_form';
                        }
                        loadClaims(
                            pagination.page,
                            pagination.pageSize,
                            source
                        );
                    }}
                />
            )}

            {emailAutomationAssessmentId && (
                <EmailAutomation
                    assessmentId={emailAutomationAssessmentId}
                    onClose={() => setEmailAutomationAssessmentId(null)}
                    onUpdate={() => {
                        let source: string | undefined;
                        if (activeSubTab === 'email-processed') {
                            source = 'email';
                        } else if (activeSubTab === 'manually-added') {
                            source = 'manual';
                        } else {
                            source = 'web_form';
                        }
                        loadClaims(
                            pagination.page,
                            pagination.pageSize,
                            source
                        );
                    }}
                />
            )}
        </div>
        </>
    );
};
