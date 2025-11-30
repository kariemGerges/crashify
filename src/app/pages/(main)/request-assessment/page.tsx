'use client';

import React, { useState } from 'react';
import { Upload, Loader2, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

export default function RequestAssessmentPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        vehicle: '',
        description: '',
    });
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [startTime] = useState(Date.now());

    const validateForm = (): boolean => {
        if (!formData.name.trim()) {
            setError('Name is required');
            return false;
        }
        if (!formData.email.trim()) {
            setError('Email is required');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Invalid email address');
            return false;
        }
        if (!formData.phone.trim()) {
            setError('Phone is required');
            return false;
        }
        if (!formData.vehicle.trim()) {
            setError('Vehicle information is required');
            return false;
        }
        if (!formData.description.trim() || formData.description.trim().length < 10) {
            setError('Please provide a description of at least 10 characters');
            return false;
        }
        if (files.length === 0) {
            setError('Please upload at least one photo');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);

        try {
            // Calculate submit time
            const submitTimeSeconds = (Date.now() - startTime) / 1000;

            // Prepare form data
            const data = new FormData();
            data.append('name', formData.name);
            data.append('email', formData.email);
            data.append('phone', formData.phone);
            data.append('vehicle', formData.vehicle);
            data.append('description', formData.description);
            data.append('submitTimeSeconds', submitTimeSeconds.toString());

            // Add files
            files.forEach((file) => {
                data.append('photos', file);
            });

            const response = await fetch('/api/quotes/request', {
                method: 'POST',
                body: data,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to submit request');
            }

            setSuccess(true);
            
            // Redirect after 3 seconds
            setTimeout(() => {
                router.push('/');
            }, 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length + files.length > 30) {
            setError('Maximum 30 photos allowed');
            return;
        }

        setFiles(prev => [...prev, ...imageFiles]);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        const imageFiles = droppedFiles.filter(file => file.type.startsWith('image/'));

        if (imageFiles.length + files.length > 30) {
            setError('Maximum 30 photos allowed');
            return;
        }

        setFiles(prev => [...prev, ...imageFiles]);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <>
            <Header />
            <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-12 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Request an Assessment Quote
                            </h1>
                            <p className="text-gray-400">
                                Fill out the form below and we'll get back to you within 2 hours with pricing
                            </p>
                        </div>

                        {success ? (
                            <div className="text-center py-12">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-white mb-2">Request Received!</h2>
                                <p className="text-gray-400 mb-6">
                                    We'll review your request and email you within 2 hours with pricing and next steps.
                                </p>
                                <p className="text-gray-500 text-sm">
                                    If urgent, call us: <a href="tel:0426000910" className="text-amber-500 hover:text-amber-400">0426 000 910</a>
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}

                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Your Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                                        placeholder="John Smith"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Your Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                                        placeholder="john@example.com"
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Your Phone <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                                        placeholder="04XX XXX XXX"
                                    />
                                </div>

                                {/* Vehicle */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Vehicle (Make/Model) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.vehicle}
                                        onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                                        required
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                                        placeholder="e.g., 2020 Toyota Camry"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        What happened? <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                        rows={4}
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                                        placeholder="Brief description of the damage or incident..."
                                    />
                                    <p className="text-gray-500 text-xs mt-1">
                                        Minimum 10 characters
                                    </p>
                                </div>

                                {/* Photo Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Upload Damage Photos <span className="text-red-500">*</span>
                                    </label>
                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                            isDragging
                                                ? 'border-amber-500 bg-amber-500/10'
                                                : 'border-gray-700 hover:border-gray-600'
                                        }`}
                                    >
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-400 text-sm mb-2">
                                            Drag & drop photos here, or click to select
                                        </p>
                                        <p className="text-gray-500 text-xs mb-4">
                                            Up to 30 photos, max 10MB each
                                        </p>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            id="photo-upload"
                                        />
                                        <label
                                            htmlFor="photo-upload"
                                            className="inline-block px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded-lg hover:bg-amber-500/30 transition-colors cursor-pointer"
                                        >
                                            Select Photos
                                        </label>
                                    </div>

                                    {files.length > 0 && (
                                        <div className="mt-4 grid grid-cols-3 gap-3">
                                            {files.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="relative group bg-gray-800 rounded-lg overflow-hidden"
                                                >
                                                    <img
                                                        src={URL.createObjectURL(file)}
                                                        alt={`Photo ${index + 1}`}
                                                        className="w-full h-24 object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(index)}
                                                        className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <AlertCircle className="w-4 h-4" />
                                                    </button>
                                                    <p className="text-xs text-gray-400 p-1 truncate" title={file.name}>
                                                        {file.name}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-red-600 text-white rounded-lg hover:from-amber-600 hover:to-red-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="w-5 h-5" />
                                            Request Quote
                                        </>
                                    )}
                                </button>

                                <p className="text-gray-500 text-xs text-center">
                                    By submitting, you agree to our Terms of Service and Privacy Policy
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}

