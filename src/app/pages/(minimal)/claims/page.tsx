'use client';
import React, { useState, useCallback } from 'react';
import { AlertCircle, Upload, X, CheckCircle, Loader2 } from 'lucide-react';
import {
    AssessmentFormData,
    FormErrors,
    UploadedFile,
} from '@/server/lib/types/database.types';

const API_BASE = '/api/assessments';

const CrashifyForm: React.FC = () => {
    // Form state and validation
    const [currentSection, setCurrentSection] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState(false);
    const [formData, setFormData] = useState<AssessmentFormData>({
        companyName: '',
        yourName: '',
        yourEmail: '',
        yourPhone: '',
        yourRole: '',
        department: '',
        assessmentType: '',
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
        authorityConfirmed: false,
        privacyConsent: false,
        emailReportConsent: true,
        smsUpdates: false,
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [assessmentId, setAssessmentId] = useState<string | null>(null);

    // Form validation
    const validateEmail = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validateAustralianPhone = (phone: string) =>
        /^(?:\+?61|0)[2-478](?:[ -]?[0-9]){8}$/.test(phone.replace(/\s/g, ''));

    // Utility functions
    const formatCurrency = (value: string) => {
        const num = value.replace(/[^0-9]/g, '');
        return num ? `$${parseInt(num).toLocaleString()}` : '';
    };

    // Utility functions
    const formatMobile = (value: string) => {
        const digits = value.replace(/[^0-9]/g, '');
        if (digits.length <= 4) return digits;
        if (digits.length <= 7)
            return `${digits.slice(0, 4)} ${digits.slice(4)}`;
        return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(
            7,
            10
        )}`;
    };

    // Form event handlers
    const handleInputChange = useCallback(
        (
            e: React.ChangeEvent<
                HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
            >
        ) => {
            const { name, value } = e.target;
            let processedValue = value;

            if (name === 'insuranceValueAmount')
                processedValue = formatCurrency(value);
            else if (name === 'ownerMobile' && value)
                processedValue = formatMobile(value);

            setFormData((prev) => ({ ...prev, [name]: processedValue }));
            if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
        },
        [errors]
    );

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: checked }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handleDamageAreasChange = (area: string) => {
        setFormData((prev) => ({
            ...prev,
            damageAreas: prev.damageAreas.includes(area)
                ? prev.damageAreas.filter((a) => a !== area)
                : [...prev.damageAreas, area],
        }));
    };

    const handleFileUpload = useCallback(
        (files: FileList | null) => {
            if (!files) return;
            const validTypes = [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/heic',
                'image/webp',
                'application/pdf',
            ];
            const maxSize = 10 * 1024 * 1024;
            const maxFiles = 30;

            Array.from(files).forEach((file) => {
                if (uploadedFiles.length >= maxFiles) {
                    alert(`Maximum ${maxFiles} files allowed`);
                    return;
                }
                if (!validTypes.includes(file.type)) {
                    alert(`Invalid file type: ${file.name}`);
                    return;
                }
                if (file.size > maxSize) {
                    alert(`File too large: ${file.name}. Max 10MB`);
                    return;
                }

                const newFile: UploadedFile = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    file,
                    uploadProgress: 0,
                };

                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        newFile.preview = e.target?.result as string;
                        setUploadedFiles((prev) => [...prev, newFile]);
                    };
                    reader.readAsDataURL(file);
                } else {
                    setUploadedFiles((prev) => [...prev, newFile]);
                }
            });
        },
        [uploadedFiles]
    );

    const removeFile = (id: string) =>
        setUploadedFiles((prev) => prev.filter((f) => f.id !== id));

    const validateSection = (section: number): boolean => {
        const newErrors: FormErrors = {};

        if (section === 1) {
            if (!formData.companyName.trim())
                newErrors.companyName = 'Company name is required';
            if (!formData.yourName.trim())
                newErrors.yourName = 'Your name is required';
            if (!formData.yourEmail.trim())
                newErrors.yourEmail = 'Email is required';
            else if (!validateEmail(formData.yourEmail))
                newErrors.yourEmail = 'Invalid email format';
            if (!formData.yourPhone.trim())
                newErrors.yourPhone = 'Phone is required';
            else if (!validateAustralianPhone(formData.yourPhone))
                newErrors.yourPhone = 'Invalid Australian phone number';
        }

        if (section === 2) {
            if (!formData.assessmentType)
                newErrors.assessmentType = 'Assessment type is required';
            if (
                formData.incidentDate &&
                new Date(formData.incidentDate) > new Date()
            )
                newErrors.incidentDate = 'Cannot be future date';
        }

        if (section === 3) {
            if (!formData.make.trim()) newErrors.make = 'Make is required';
            if (!formData.model.trim()) newErrors.model = 'Model is required';
            if (
                formData.year &&
                (parseInt(formData.year) < 1900 ||
                    parseInt(formData.year) > 2026)
            )
                newErrors.year = 'Year must be 1900-2026';
        }

        if (section === 8) {
            if (!formData.authorityConfirmed)
                newErrors.authorityConfirmed = 'You must confirm authority';
            if (!formData.privacyConsent)
                newErrors.privacyConsent = 'Privacy consent is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const uploadFilesToServer = async (assessmentId: string) => {
        if (uploadedFiles.length === 0) return { success: true, uploaded: 0 };

        setUploadingFiles(true);
        const formData = new FormData();
        uploadedFiles.forEach((f) => formData.append('files', f.file));

        try {
            const response = await fetch(`${API_BASE}/${assessmentId}/files`, {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();

            if (!response.ok)
                throw new Error(result.error || 'File upload failed');
            return result;
        } catch (error) {
            console.error('File upload error:', error);
            throw error;
        } finally {
            setUploadingFiles(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateSection(8)) return;

        setIsSubmitting(true);

        try {
            // Prepare data
            const payload = {
                formData: {
                    companyName: formData.companyName,
                    yourName: formData.yourName,
                    yourEmail: formData.yourEmail,
                    yourPhone: formData.yourPhone,
                    yourRole: formData.yourRole || undefined,
                    department: formData.department || undefined,
                    assessmentType: formData.assessmentType,
                    claimReference: formData.claimReference || undefined,
                    policyNumber: formData.policyNumber || undefined,
                    incidentDate: formData.incidentDate || undefined,
                    incidentLocation: formData.incidentLocation || undefined,
                    vehicleType: formData.vehicleType || undefined,
                    year: formData.year ? parseInt(formData.year) : undefined,
                    make: formData.make,
                    model: formData.model,
                    registration:
                        formData.registration?.toUpperCase() || undefined,
                    vin: formData.vin?.toUpperCase() || undefined,
                    color: formData.color || undefined,
                    odometer: formData.odometer
                        ? parseInt(formData.odometer)
                        : undefined,
                    insuranceValueType:
                        formData.insuranceValueType || undefined,
                    insuranceValueAmount:
                        formData.insuranceValueAmount || undefined,
                    ownerInfo:
                        formData.ownerFirstName || formData.ownerLastName
                            ? {
                                  firstName: formData.ownerFirstName,
                                  lastName: formData.ownerLastName,
                                  email: formData.ownerEmail,
                                  mobile: formData.ownerMobile,
                                  altPhone: formData.ownerAltPhone,
                                  address: formData.ownerAddress,
                              }
                            : undefined,
                    locationInfo:
                        formData.assessmentType === 'Onsite Assessment'
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
                                  accessInstructions:
                                      formData.accessInstructions,
                              }
                            : undefined,
                    incidentDescription:
                        formData.incidentDescription || undefined,
                    damageAreas: formData.damageAreas,
                    specialInstructions:
                        formData.specialInstructions || undefined,
                    internalNotes: formData.internalNotes || undefined,
                    authorityConfirmed: formData.authorityConfirmed,
                    privacyConsent: formData.privacyConsent,
                    emailReportConsent: formData.emailReportConsent,
                    smsUpdates: formData.smsUpdates,
                },
            };

            const response = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Submission failed');
            }

            // Upload files if any
            if (uploadedFiles.length > 0) {
                await uploadFilesToServer(result.assessment.id);
            }

            setAssessmentId(result.assessment.id);
            setSubmitted(true);
        } catch (error) {
            console.error('Submission error:', error);
            alert(
                error instanceof Error
                    ? error.message
                    : 'Failed to submit assessment'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNext = () => {
        if (validateSection(currentSection)) {
            if (
                currentSection === 2 &&
                formData.assessmentType === 'Desktop Assessment'
            )
                setCurrentSection(3);
            else setCurrentSection((prev) => Math.min(prev + 1, 8));
        }
    };

    const handlePrevious = () => {
        if (
            currentSection === 3 &&
            formData.assessmentType === 'Desktop Assessment'
        )
            setCurrentSection(2);
        else setCurrentSection((prev) => Math.max(prev - 1, 1));
    };

    // Render
    if (submitted) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <div className="max-w-2xl w-full bg-gradient-to-br from-gray-900 to-black border border-red-900 rounded-lg p-8 text-center">
                    <CheckCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold mb-4">
                        Assessment Request Submitted
                    </h2>
                    <p className="text-gray-300 mb-2">
                        Thank you! Your assessment request has been received.
                    </p>
                    <p className="text-sm text-gray-400 mb-6">
                        Assessment ID:{' '}
                        <span className="text-red-500 font-mono">
                            {assessmentId}
                        </span>
                    </p>
                    <p className="text-gray-300 mb-6">
                        We'll send the report to{' '}
                        <span className="text-red-500">
                            {formData.yourEmail}
                        </span>
                    </p>
                    <button
                        onClick={() => {
                            setSubmitted(false);
                            setCurrentSection(1);
                            setUploadedFiles([]);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                        Submit Another Request
                    </button>
                </div>
            </div>
        );
    }

    const sections = [
        { num: 1, title: 'Requestor Information' },
        { num: 2, title: 'Claim Information' },
        { num: 3, title: 'Vehicle Information' },
        { num: 4, title: 'Vehicle Owner Details' },
        {
            num: 5,
            title: 'Assessment Location',
            conditional: formData.assessmentType === 'Onsite Assessment',
        },
        { num: 6, title: 'Photos & Documents' },
        { num: 7, title: 'Additional Information' },
        { num: 8, title: 'Consent & Legal' },
    ].filter((s) => !s.conditional || s.conditional === true);

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}

                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                        Crashify Assessment Request
                    </h1>
                    <p className="text-gray-400">
                        Complete the form below to request a vehicle damage
                        assessment
                    </p>
                </div>

                {/* Progress bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">
                            Section {currentSection} of {sections.length}
                        </span>
                        <span className="text-sm text-gray-400">
                            {Math.round(
                                (currentSection / sections.length) * 100
                            )}
                            % Complete
                        </span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300"
                            style={{
                                width: `${
                                    (currentSection / sections.length) * 100
                                }%`,
                            }}
                        />
                    </div>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-lg p-6 md:p-8 shadow-2xl"
                >
                    <h2 className="text-2xl font-bold mb-6 text-red-500">
                        {sections.find((s) => s.num === currentSection)?.title}
                    </h2>

                    {/* Section 1 */}
                    {currentSection === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Company Name{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    maxLength={100}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                    placeholder="Insurance company or fleet name"
                                />
                                {errors.companyName && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle size={14} />
                                        {errors.companyName}
                                    </p>
                                )}
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Your Name{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="yourName"
                                        value={formData.yourName}
                                        onChange={handleInputChange}
                                        maxLength={100}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                        placeholder="Your full name"
                                    />
                                    {errors.yourName && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                            <AlertCircle size={14} />
                                            {errors.yourName}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Your Email{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="yourEmail"
                                        value={formData.yourEmail}
                                        onChange={handleInputChange}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                        placeholder="you@company.com"
                                    />
                                    {errors.yourEmail && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                            <AlertCircle size={14} />
                                            {errors.yourEmail}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Your Phone{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="yourPhone"
                                        value={formData.yourPhone}
                                        onChange={handleInputChange}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                        placeholder="04XX XXX XXX"
                                    />
                                    {errors.yourPhone && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                            <AlertCircle size={14} />
                                            {errors.yourPhone}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Your Role/Position
                                    </label>
                                    <input
                                        type="text"
                                        name="yourRole"
                                        value={formData.yourRole}
                                        onChange={handleInputChange}
                                        maxLength={50}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                        placeholder="e.g., Claims Assessor"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Department
                                </label>
                                <input
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    maxLength={50}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                    placeholder="e.g., Claims, Fleet Operations"
                                />
                            </div>
                        </div>
                    )}

                    {/* Section 2 */}
                    {currentSection === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Assessment Type{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="assessmentType"
                                    value={formData.assessmentType}
                                    onChange={handleInputChange}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                >
                                    <option value="">
                                        Select assessment type...
                                    </option>
                                    <option value="Desktop Assessment">
                                        Desktop Assessment
                                    </option>
                                    <option value="Onsite Assessment">
                                        Onsite Assessment
                                    </option>
                                </select>
                                {errors.assessmentType && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle size={14} />
                                        {errors.assessmentType}
                                    </p>
                                )}
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Your Claim/Job Reference
                                    </label>
                                    <input
                                        type="text"
                                        name="claimReference"
                                        value={formData.claimReference}
                                        onChange={handleInputChange}
                                        maxLength={30}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                        placeholder="Your internal reference"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Insurance Policy Number
                                    </label>
                                    <input
                                        type="text"
                                        name="policyNumber"
                                        value={formData.policyNumber}
                                        onChange={handleInputChange}
                                        maxLength={30}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                        placeholder="Policy number"
                                    />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Date of Incident
                                    </label>
                                    <input
                                        type="date"
                                        name="incidentDate"
                                        value={formData.incidentDate}
                                        onChange={handleInputChange}
                                        max={
                                            new Date()
                                                .toISOString()
                                                .split('T')[0]
                                        }
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                    />
                                    {errors.incidentDate && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                            <AlertCircle size={14} />
                                            {errors.incidentDate}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Location of Incident
                                    </label>
                                    <input
                                        type="text"
                                        name="incidentLocation"
                                        value={formData.incidentLocation}
                                        onChange={handleInputChange}
                                        maxLength={200}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                        placeholder="Suburb, State"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Section 3: Vehicle Information */}
                    {currentSection === 3 && (
                        <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Vehicle Type
                                    </label>
                                    <select
                                        name="vehicleType"
                                        value={formData.vehicleType}
                                        onChange={handleInputChange}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                    >
                                        <option value="">Select type...</option>
                                        <option value="Light Vehicle">
                                            Light Vehicle
                                        </option>
                                        <option value="Commercial Vehicle">
                                            Commercial Vehicle
                                        </option>
                                        <option value="Motorcycle">
                                            Motorcycle
                                        </option>
                                        <option value="Heavy Vehicle">
                                            Heavy Vehicle
                                        </option>
                                        <option value="Unknown">Unknown</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Year
                                    </label>
                                    <input
                                        type="number"
                                        name="year"
                                        value={formData.year}
                                        onChange={handleInputChange}
                                        min="1900"
                                        max="2026"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                        placeholder="YYYY"
                                    />
                                    {errors.year && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                            <AlertCircle size={14} />
                                            {errors.year}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Make{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="make"
                                        value={formData.make}
                                        onChange={handleInputChange}
                                        maxLength={50}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                        placeholder="e.g., Toyota, Ford"
                                    />
                                    {errors.make && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                            <AlertCircle size={14} />
                                            {errors.make}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Model{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="model"
                                        value={formData.model}
                                        onChange={handleInputChange}
                                        maxLength={50}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                        placeholder="e.g., Camry, Ranger"
                                    />
                                    {errors.model && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                            <AlertCircle size={14} />
                                            {errors.model}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Registration
                                    </label>
                                    <input
                                        type="text"
                                        name="registration"
                                        value={formData.registration}
                                        onChange={handleInputChange}
                                        maxLength={10}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors uppercase"
                                        placeholder="ABC123"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        VIN
                                    </label>
                                    <input
                                        type="text"
                                        name="vin"
                                        value={formData.vin}
                                        onChange={handleInputChange}
                                        maxLength={17}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors uppercase"
                                        placeholder="17 characters"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Color
                                    </label>
                                    <input
                                        type="text"
                                        name="color"
                                        value={formData.color}
                                        onChange={handleInputChange}
                                        maxLength={30}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                        placeholder="Vehicle color"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Odometer (km)
                                    </label>
                                    <input
                                        type="number"
                                        name="odometer"
                                        value={formData.odometer}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                        placeholder="Kilometers"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Insurance Value Type
                                    </label>
                                    <select
                                        name="insuranceValueType"
                                        value={formData.insuranceValueType}
                                        onChange={handleInputChange}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                    >
                                        <option value="">Select type...</option>
                                        <option value="Market Value">
                                            Market Value
                                        </option>
                                        <option value="Agreed Value">
                                            Agreed Value
                                        </option>
                                        <option value="Replacement Value">
                                            Replacement Value
                                        </option>
                                        <option value="Unknown">Unknown</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Insurance Value Amount
                                    </label>
                                    <input
                                        type="text"
                                        name="insuranceValueAmount"
                                        value={formData.insuranceValueAmount}
                                        onChange={handleInputChange}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                        placeholder="$XX,XXX"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Section 4: Vehicle Owner Information */}
                    {currentSection === 4 && (
                        <div className="space-y-4">
                            <p className="text-gray-400 text-sm mb-4">
                                All fields in this section are optional
                            </p>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Owner First Name
                                    </label>
                                    <input
                                        type="text"
                                        name="ownerFirstName"
                                        value={formData.ownerFirstName}
                                        onChange={handleInputChange}
                                        maxLength={50}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                        placeholder="First name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Owner Last Name
                                    </label>
                                    <input
                                        type="text"
                                        name="ownerLastName"
                                        value={formData.ownerLastName}
                                        onChange={handleInputChange}
                                        maxLength={50}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                        placeholder="Last name"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Owner Email
                                    </label>
                                    <input
                                        type="email"
                                        name="ownerEmail"
                                        value={formData.ownerEmail}
                                        onChange={handleInputChange}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                        placeholder="owner@email.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Owner Mobile Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="ownerMobile"
                                        value={formData.ownerMobile}
                                        onChange={handleInputChange}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                        placeholder="04XX XXX XXX"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Owner Alternative Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="ownerAltPhone"
                                        value={formData.ownerAltPhone}
                                        onChange={handleInputChange}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                        placeholder="Landline or alternative"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Owner Postal Address
                                </label>
                                <textarea
                                    name="ownerAddress"
                                    value={formData.ownerAddress}
                                    onChange={handleInputChange}
                                    maxLength={200}
                                    rows={3}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors resize-none"
                                    placeholder="Full street address"
                                />
                            </div>
                        </div>
                    )}

                    {/* Section 5: Assessment Location (Onsite only) */}
                    {currentSection === 5 &&
                        formData.assessmentType === 'Onsite Assessment' && (
                            <div className="space-y-4">
                                <p className="text-gray-400 text-sm mb-4">
                                    Provide details for the onsite assessment
                                    location
                                </p>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Onsite Location Type
                                    </label>
                                    <select
                                        name="onsiteLocationType"
                                        value={formData.onsiteLocationType}
                                        onChange={handleInputChange}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                    >
                                        <option value="">
                                            Select location type...
                                        </option>
                                        <option value="Repairer Workshop">
                                            Repairer Workshop
                                        </option>
                                        <option value="Owner's Home/Business">
                                            Owner's Home/Business
                                        </option>
                                        <option value="Fleet Depot">
                                            Fleet Depot
                                        </option>
                                        <option value="Storage Yard">
                                            Storage Yard
                                        </option>
                                        <option value="Other Location">
                                            Other Location
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Location/Repairer Name
                                    </label>
                                    <input
                                        type="text"
                                        name="locationName"
                                        value={formData.locationName}
                                        onChange={handleInputChange}
                                        maxLength={100}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                        placeholder="Name of facility or business"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Street Address
                                    </label>
                                    <input
                                        type="text"
                                        name="streetAddress"
                                        value={formData.streetAddress}
                                        onChange={handleInputChange}
                                        maxLength={100}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                        placeholder="Physical address for assessment"
                                    />
                                </div>

                                <div className="grid md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Suburb
                                        </label>
                                        <input
                                            type="text"
                                            name="suburb"
                                            value={formData.suburb}
                                            onChange={handleInputChange}
                                            maxLength={50}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                            placeholder="Suburb/town"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            State
                                        </label>
                                        <select
                                            name="state"
                                            value={formData.state}
                                            onChange={handleInputChange}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                        >
                                            <option value="">
                                                Select state...
                                            </option>
                                            <option value="NSW">NSW</option>
                                            <option value="VIC">VIC</option>
                                            <option value="QLD">QLD</option>
                                            <option value="SA">SA</option>
                                            <option value="WA">WA</option>
                                            <option value="TAS">TAS</option>
                                            <option value="NT">NT</option>
                                            <option value="ACT">ACT</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Postcode
                                        </label>
                                        <input
                                            type="number"
                                            name="postcode"
                                            value={formData.postcode}
                                            onChange={handleInputChange}
                                            maxLength={4}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                            placeholder="4 digits"
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Location Contact Name
                                        </label>
                                        <input
                                            type="text"
                                            name="locationContactName"
                                            value={formData.locationContactName}
                                            onChange={handleInputChange}
                                            maxLength={100}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                            placeholder="Who to contact"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Location Phone
                                        </label>
                                        <input
                                            type="tel"
                                            name="locationPhone"
                                            value={formData.locationPhone}
                                            onChange={handleInputChange}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                            placeholder="Contact number"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Location Email
                                        </label>
                                        <input
                                            type="email"
                                            name="locationEmail"
                                            value={formData.locationEmail}
                                            onChange={handleInputChange}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                            placeholder="Contact email"
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Preferred Date
                                        </label>
                                        <input
                                            type="date"
                                            name="preferredDate"
                                            value={formData.preferredDate}
                                            onChange={handleInputChange}
                                            min={
                                                new Date()
                                                    .toISOString()
                                                    .split('T')[0]
                                            }
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Preferred Time
                                        </label>
                                        <select
                                            name="preferredTime"
                                            value={formData.preferredTime}
                                            onChange={handleInputChange}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                                        >
                                            <option value="">
                                                Select preferred time...
                                            </option>
                                            <option value="Morning (9am-12pm)">
                                                Morning (9am-12pm)
                                            </option>
                                            <option value="Afternoon (12pm-5pm)">
                                                Afternoon (12pm-5pm)
                                            </option>
                                            <option value="Anytime">
                                                Anytime
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Special Access Instructions
                                    </label>
                                    <textarea
                                        name="accessInstructions"
                                        value={formData.accessInstructions}
                                        onChange={handleInputChange}
                                        maxLength={500}
                                        rows={3}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors resize-none"
                                        placeholder="e.g., Gate code: 1234, Call on arrival"
                                    />
                                </div>
                            </div>
                        )}

                    {/* Section 6: Photos & Documents */}
                    {currentSection === 6 && (
                        <div className="space-y-4">
                            <p className="text-gray-400 text-sm mb-4">
                                Upload photos and documents (optional, max 30
                                files, 10MB each)
                            </p>

                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    handleFileUpload(e.dataTransfer.files);
                                }}
                                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                    isDragging
                                        ? 'border-red-500 bg-red-900/20'
                                        : 'border-gray-700 bg-gray-800/50'
                                }`}
                            >
                                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                                <p className="text-gray-300 mb-2">
                                    Drag & drop files here, or click to select
                                </p>
                                <p className="text-sm text-gray-500 mb-4">
                                    JPG, PNG, HEIC, WebP, PDF (max 10MB each)
                                </p>
                                <input
                                    type="file"
                                    multiple
                                    accept=".jpg,.jpeg,.png,.heic,.webp,.pdf"
                                    onChange={(e) =>
                                        handleFileUpload(e.target.files)
                                    }
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors"
                                >
                                    Select Files
                                </label>
                            </div>

                            {uploadedFiles.length > 0 && (
                                <div className="mt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-sm text-gray-400">
                                            {uploadedFiles.length} of 30 files
                                            uploaded
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {uploadedFiles.map((file) => (
                                            <div
                                                key={file.id}
                                                className="relative bg-gray-800 rounded-lg p-2 border border-gray-700"
                                            >
                                                {file.preview ? (
                                                    <img
                                                        src={file.preview}
                                                        alt={file.name}
                                                        className="w-full h-24 object-cover rounded mb-2"
                                                    />
                                                ) : (
                                                    <div className="w-full h-24 bg-gray-700 rounded mb-2 flex items-center justify-center">
                                                        <span className="text-gray-500 text-xs">
                                                            PDF
                                                        </span>
                                                    </div>
                                                )}
                                                <p className="text-xs text-gray-300 truncate">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {(
                                                        file.size /
                                                        1024 /
                                                        1024
                                                    ).toFixed(2)}{' '}
                                                    MB
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeFile(file.id)
                                                    }
                                                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 rounded-full p-1 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Section 7: Additional Information */}
                    {currentSection === 7 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Incident Description
                                </label>
                                <textarea
                                    name="incidentDescription"
                                    value={formData.incidentDescription}
                                    onChange={handleInputChange}
                                    maxLength={1000}
                                    rows={4}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors resize-none"
                                    placeholder="Brief description of damage/incident"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {formData?.incidentDescription}/1000
                                    characters
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-3">
                                    Damage Areas (Select all that apply)
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {[
                                        'Front End',
                                        'Rear End',
                                        'Left Side',
                                        'Right Side',
                                        'Roof',
                                        'Undercarriage',
                                        'Interior',
                                        'Glass',
                                        'Mechanical',
                                    ].map((area) => (
                                        <label
                                            key={area}
                                            className="flex items-center space-x-2 bg-gray-800 p-3 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.damageAreas.includes(
                                                    area
                                                )}
                                                onChange={() =>
                                                    handleDamageAreasChange(
                                                        area
                                                    )
                                                }
                                                className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                                            />
                                            <span className="text-sm">
                                                {area}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Special Instructions
                                </label>
                                <textarea
                                    name="specialInstructions"
                                    value={formData.specialInstructions}
                                    onChange={handleInputChange}
                                    maxLength={500}
                                    rows={3}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors resize-none"
                                    placeholder="Any special notes or requirements"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Internal Notes
                                </label>
                                <textarea
                                    name="internalNotes"
                                    value={formData.internalNotes}
                                    onChange={handleInputChange}
                                    maxLength={500}
                                    rows={3}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 transition-colors resize-none"
                                    placeholder="Your internal notes (not shared with owner)"
                                />
                            </div>
                        </div>
                    )}

                    {/* Section 8: Consent & Legal */}
                    {currentSection === 8 && (
                        <div className="space-y-6">
                            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                                <label className="flex items-start space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="authorityConfirmed"
                                        checked={formData.authorityConfirmed}
                                        onChange={handleCheckboxChange}
                                        className="w-5 h-5 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500 mt-1 flex-shrink-0"
                                    />
                                    <div className="flex-1">
                                        <span className="text-sm font-medium">
                                            Authority Confirmation{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </span>
                                        <p className="text-sm text-gray-400 mt-1">
                                            I confirm that I have authority to
                                            request this assessment on behalf of
                                            my organization and that appropriate
                                            consents have been obtained from the
                                            vehicle owner for this assessment to
                                            be conducted.
                                        </p>
                                    </div>
                                </label>
                                {errors.authorityConfirmed && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        <AlertCircle size={14} />
                                        {errors.authorityConfirmed}
                                    </p>
                                )}
                            </div>

                            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                                <label className="flex items-start space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="privacyConsent"
                                        checked={formData.privacyConsent}
                                        onChange={handleCheckboxChange}
                                        className="w-5 h-5 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500 mt-1 flex-shrink-0"
                                    />
                                    <div className="flex-1">
                                        <span className="text-sm font-medium">
                                            Privacy Consent{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </span>
                                        <p className="text-sm text-gray-400 mt-1">
                                            I consent to Crashify collecting and
                                            processing information provided in
                                            this form for vehicle damage
                                            assessment purposes. I understand:
                                        </p>
                                        <ul className="text-sm text-gray-400 mt-2 ml-4 space-y-1 list-disc">
                                            <li>
                                                Information will be processed
                                                using AI technology
                                            </li>
                                            <li>
                                                Data may be stored on servers
                                                outside Australia (US/EU)
                                            </li>
                                            <li>
                                                The assessment report will be
                                                provided to my organization
                                            </li>
                                            <li>
                                                Records retained for 7 years as
                                                required by law
                                            </li>
                                        </ul>
                                        <p className="text-sm text-gray-400 mt-2">
                                            I have read the{' '}
                                            <a
                                                href="https://www.crashify.com.au/pages/privacy"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-red-500 hover:text-red-400 underline"
                                            >
                                                Privacy Policy
                                            </a>
                                        </p>
                                    </div>
                                </label>
                                {errors.privacyConsent && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        <AlertCircle size={14} />
                                        {errors.privacyConsent}
                                    </p>
                                )}
                            </div>

                            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                                <label className="flex items-start space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="emailReportConsent"
                                        checked={formData.emailReportConsent}
                                        onChange={handleCheckboxChange}
                                        className="w-5 h-5 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500 mt-1 flex-shrink-0"
                                    />
                                    <div className="flex-1">
                                        <span className="text-sm font-medium">
                                            Email Report Consent
                                        </span>
                                        <p className="text-sm text-gray-400 mt-1">
                                            I consent to receive the assessment
                                            report via email at the address
                                            provided above. (This is our
                                            standard delivery method)
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {formData.assessmentType ===
                                'Onsite Assessment' && (
                                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                                    <label className="flex items-start space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="smsUpdates"
                                            checked={formData.smsUpdates}
                                            onChange={handleCheckboxChange}
                                            className="w-5 h-5 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500 mt-1 flex-shrink-0"
                                        />
                                        <div className="flex-1">
                                            <span className="text-sm font-medium">
                                                SMS Updates (Optional)
                                            </span>
                                            <p className="text-sm text-gray-400 mt-1">
                                                I consent to receive SMS
                                                notifications for booking
                                                confirmations and appointment
                                                reminders (onsite assessments
                                                only). Reply STOP to opt out
                                                anytime.
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-gray-800">
                        <button
                            type="button"
                            onClick={handlePrevious}
                            disabled={currentSection === 1}
                            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                        >
                            Previous
                        </button>
                        {currentSection < sections.length ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                            >
                                Next Section
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={isSubmitting || uploadingFiles}
                                className="px-8 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 disabled:opacity-50 text-white rounded-lg transition-all font-semibold shadow-lg shadow-red-900/50 flex items-center gap-2"
                            >
                                {(isSubmitting || uploadingFiles) && (
                                    <Loader2
                                        className="animate-spin"
                                        size={16}
                                    />
                                )}
                                {uploadingFiles
                                    ? 'Uploading Files...'
                                    : isSubmitting
                                    ? 'Submitting...'
                                    : 'Submit Request'}
                            </button>
                        )}
            </div>
            
                </form>
            </div>
        </div>
    );
};

export default CrashifyForm;
