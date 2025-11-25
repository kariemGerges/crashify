// =============================================
// FILE: lib/utils/validation.ts
// Form validation utilities
// =============================================

import { AssessmentFormData } from '@/server/lib/types/database.types';

export const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validateAustralianPhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\s/g, '');
    return /^(?:\+?61|0)[2-478](?:[0-9]){8}$/.test(cleaned);
};

export const validateAustralianMobile = (mobile: string): boolean => {
    const cleaned = mobile.replace(/\s/g, '');
    return /^04\d{8}$/.test(cleaned);
};

export const validateVIN = (vin: string): boolean => {
    return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
};

export const validatePostcode = (postcode: string): boolean => {
    return /^\d{4}$/.test(postcode);
};

export interface ValidationError {
    field: string;
    message: string;
}

export function validateAssessmentForm(
    data: AssessmentFormData
): ValidationError[] {
    const errors: ValidationError[] = [];

    // Section 1 validations
    if (!data.companyName?.trim()) {
        errors.push({
            field: 'companyName',
            message: 'Company name is required',
        });
    }
    if (!data.yourName?.trim()) {
        errors.push({ field: 'yourName', message: 'Your name is required' });
    }
    if (!data.yourEmail?.trim()) {
        errors.push({ field: 'yourEmail', message: 'Email is required' });
    } else if (!validateEmail(data.yourEmail)) {
        errors.push({ field: 'yourEmail', message: 'Invalid email format' });
    }
    if (!data.yourPhone?.trim()) {
        errors.push({ field: 'yourPhone', message: 'Phone is required' });
    } else if (!validateAustralianPhone(data.yourPhone)) {
        errors.push({
            field: 'yourPhone',
            message: 'Invalid Australian phone number',
        });
    }

    // Section 2 validations
    if (!data.assessmentType) {
        errors.push({
            field: 'assessmentType',
            message: 'Assessment type is required',
        });
    }

    // Section 3 validations
    if (!data.make?.trim()) {
        errors.push({ field: 'make', message: 'Vehicle make is required' });
    }
    if (!data.model?.trim()) {
        errors.push({ field: 'model', message: 'Vehicle model is required' });
    }
    if (data.year && (Number(data.year) < 1900 || Number(data.year) > 2026)) {
        errors.push({
            field: 'year',
            message: 'Year must be between 1900 and 2026',
        });
    }
    if (data.vin && !validateVIN(data.vin)) {
        errors.push({ field: 'vin', message: 'Invalid VIN format' });
    }

    // Section 8 validations
    if (!data.authorityConfirmed) {
        errors.push({
            field: 'authorityConfirmed',
            message: 'Authority confirmation is required',
        });
    }
    if (!data.privacyConsent) {
        errors.push({
            field: 'privacyConsent',
            message: 'Privacy consent is required',
        });
    }

    return errors;
}
