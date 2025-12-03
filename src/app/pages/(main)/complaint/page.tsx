// =============================================
// FILE: app/pages/(main)/complaint/page.tsx
// Public Complaint Form (REQ-56)
// =============================================

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    AlertCircle,
    CheckCircle,
    Upload,
    Loader2,
    FileText,
    Mail,
    Phone,
    User,
    MessageSquare,
} from 'lucide-react';

interface ComplaintFormData {
    name: string;
    email: string;
    phone: string;
    category: string;
    priority: string;
    description: string;
    assessmentReference?: string;
}

const COMPLAINT_CATEGORIES = [
    { value: 'service_quality', label: 'Service Quality' },
    { value: 'delayed_response', label: 'Delayed Response' },
    { value: 'incorrect_assessment', label: 'Incorrect Assessment' },
    { value: 'billing_issue', label: 'Billing Issue' },
    { value: 'communication', label: 'Communication' },
    { value: 'data_privacy', label: 'Data Privacy' },
    { value: 'other', label: 'Other' },
] as const;

const PRIORITY_LEVELS = [
    { value: 'low', label: 'Low (72 hours)' },
    { value: 'medium', label: 'Medium (48 hours)' },
    { value: 'high', label: 'High (24 hours)' },
    { value: 'critical', label: 'Critical (4 hours)' },
] as const;

export default function ComplaintPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<ComplaintFormData>({
        name: '',
        email: '',
        phone: '',
        category: '',
        priority: 'medium',
        description: '',
        assessmentReference: '',
    });
    const [files, setFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [complaintNumber, setComplaintNumber] = useState('');
    const [csrfToken, setCsrfToken] = useState<string | null>(null);
    const [startTime] = useState(Date.now());

    // Fetch CSRF token
    useEffect(() => {
        const fetchCsrfToken = async () => {
            try {
                const response = await fetch('/api/csrf-token', {
                    credentials: 'include',
                });
                if (response.ok) {
                    const data = await response.json();
                    setCsrfToken(data.token);
                }
            } catch (err) {
                console.error('Failed to fetch CSRF token:', err);
            }
        };

        fetchCsrfToken();
    }, []);

    const validateForm = (): boolean => {
        if (!formData.name.trim()) {
            setError('Name is required');
            return false;
        }

        if (!formData.email.trim()) {
            setError('Email is required');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Invalid email format');
            return false;
        }

        if (!formData.category) {
            setError('Please select a complaint category');
            return false;
        }

        if (!formData.description.trim() || formData.description.trim().length < 10) {
            setError('Description must be at least 10 characters');
            return false;
        }

        // Time-based validation (REQ-88)
        const submitTimeSeconds = (Date.now() - startTime) / 1000;
        if (submitTimeSeconds < 10) {
            setError('Please take your time filling out the form');
            return false;
        }

        if (submitTimeSeconds > 24 * 60 * 60) {
            setError('Form session expired. Please refresh and try again.');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!validateForm()) {
            return;
        }

        if (!csrfToken) {
            setError('Security token not loaded. Please refresh the page.');
            return;
        }

        setSubmitting(true);

        try {
            const submitTimeSeconds = (Date.now() - startTime) / 1000;
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name.trim());
            formDataToSend.append('email', formData.email.trim().toLowerCase());
            formDataToSend.append('phone', formData.phone.trim());
            formDataToSend.append('category', formData.category);
            formDataToSend.append('priority', formData.priority);
            formDataToSend.append('description', formData.description.trim());
            formDataToSend.append('submitTimeSeconds', submitTimeSeconds.toString());
            if (formData.assessmentReference) {
                formDataToSend.append('assessmentReference', formData.assessmentReference.trim());
            }

            // Add files
            files.forEach((file) => {
                formDataToSend.append('attachments', file);
            });

            const response = await fetch('/api/complaints', {
                method: 'POST',
                headers: {
                    'x-csrf-token': csrfToken,
                },
                credentials: 'include',
                body: formDataToSend,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to submit complaint');
            }

            setSuccess(true);
            setComplaintNumber(result.complaintNumber);

            // Redirect to tracking page after 3 seconds
            setTimeout(() => {
                router.push(`/pages/complaint/track?number=${result.complaintNumber}`);
            }, 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit complaint');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const validFiles = selectedFiles.filter(
            (file) => file.size <= 10 * 1024 * 1024 // 10MB max
        );

        if (validFiles.length !== selectedFiles.length) {
            setError('Some files were too large (max 10MB per file)');
        }

        setFiles((prev) => [...prev, ...validFiles]);
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-gray-900 border border-amber-500/20 rounded-2xl shadow-2xl p-8 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Complaint Submitted</h1>
                    <p className="text-gray-400 mb-4">
                        Your complaint has been received and assigned a reference number.
                    </p>
                    <div className="bg-amber-500/10 border border-amber-500/50 rounded-lg p-4 mb-4">
                        <p className="text-sm text-gray-400 mb-1">Complaint Number</p>
                        <p className="text-2xl font-bold text-amber-500">{complaintNumber}</p>
                    </div>
                    <p className="text-sm text-gray-400">
                        Redirecting to tracking page...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-gray-900 border border-amber-500/20 rounded-2xl shadow-2xl p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Submit a Complaint</h1>
                        <p className="text-gray-400">
                            We take all complaints seriously. Please provide as much detail as possible.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Complainant Details */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <User className="w-5 h-5 text-amber-500" />
                                Your Details
                            </h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                    placeholder="John Doe"
                                    required
                                    disabled={submitting}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                        className="w-full bg-black/50 border border-gray-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                        placeholder="john@example.com"
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData({ ...formData, phone: e.target.value })
                                        }
                                        className="w-full bg-black/50 border border-gray-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                        placeholder="+61 400 000 000"
                                        disabled={submitting}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Complaint Details */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-amber-500" />
                                Complaint Details
                            </h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) =>
                                        setFormData({ ...formData, category: e.target.value })
                                    }
                                    className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                    required
                                    disabled={submitting}
                                >
                                    <option value="">Select a category</option>
                                    {COMPLAINT_CATEGORIES.map((cat) => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Priority Level <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) =>
                                        setFormData({ ...formData, priority: e.target.value })
                                    }
                                    className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                    required
                                    disabled={submitting}
                                >
                                    {PRIORITY_LEVELS.map((priority) => (
                                        <option key={priority.value} value={priority.value}>
                                            {priority.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    rows={6}
                                    className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
                                    placeholder="Please provide a detailed description of your complaint..."
                                    required
                                    disabled={submitting}
                                    minLength={10}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Minimum 10 characters required
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Related Assessment Reference (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.assessmentReference}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            assessmentReference: e.target.value,
                                        })
                                    }
                                    className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                    placeholder="Assessment ID or reference number"
                                    disabled={submitting}
                                />
                            </div>
                        </div>

                        {/* File Attachments */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-amber-500" />
                                Attachments (Optional)
                            </h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Upload Files
                                </label>
                                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-amber-500/50 transition-colors">
                                    <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400 mb-2">
                                        Click to upload or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Max 10MB per file (PDF, images, documents)
                                    </p>
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="file-upload"
                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                        disabled={submitting}
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="mt-4 inline-block bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 px-4 py-2 rounded-lg cursor-pointer transition-colors text-sm font-medium"
                                    >
                                        Choose Files
                                    </label>
                                </div>

                                {files.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        {files.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between bg-black/50 border border-gray-700 rounded-lg p-3"
                                            >
                                                <span className="text-sm text-gray-300 truncate flex-1">
                                                    {file.name}
                                                </span>
                                                <span className="text-xs text-gray-500 mx-2">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(index)}
                                                    className="text-red-500 hover:text-red-400 text-sm"
                                                    disabled={submitting}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || !csrfToken}
                            className="w-full bg-gradient-to-r from-amber-500 to-red-600 text-white font-semibold py-3 rounded-lg hover:from-amber-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Complaint'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

