// =============================================
// FILE: lib/services/spam-detector.ts
// Spam detection service for form submissions
// =============================================

export interface SpamCheckInput {
    email: string;
    phone?: string;
    name?: string;
    description?: string;
    photoCount?: number;
    submitTimeSeconds?: number; // Time taken to submit form
    ipAddress?: string;
    userAgent?: string;
}

export interface SpamCheckResult {
    isSpam: boolean;
    spamScore: number; // 0-100, higher = more spam
    flags: string[];
    action: 'auto_reject' | 'manual_review' | 'auto_approve';
}

export class SpamDetector {
    // Disposable email domains (common ones)
    private static readonly DISPOSABLE_EMAIL_DOMAINS = [
        'tempmail.com',
        '10minutemail.com',
        'guerrillamail.com',
        'mailinator.com',
        'throwaway.email',
        'trashmail.com',
        'temp-mail.org',
        'getnada.com',
        'mohmal.com',
        'fakeinbox.com',
        'test.com',
        'test.test',
        'example.com',
    ];

    // Test email patterns
    private static readonly TEST_EMAIL_PATTERNS = [
        /^test@/i,
        /^test\d+@/i,
        /^asdf@/i,
        /^qwerty@/i,
        /^123@/i,
    ];

    // Test phone patterns
    private static readonly TEST_PHONE_PATTERNS = [
        /^0{10,}$/, // All zeros
        /^1{10,}$/, // All ones
        /^1234567890$/, // Sequential
        /^0000000000$/, // All zeros
    ];

    // Suspicious description patterns
    private static readonly SUSPICIOUS_DESCRIPTION_PATTERNS = [
        /^test$/i,
        /^asdf$/i,
        /^qwerty$/i,
        /^123$/i,
        /^abc$/i,
        /^lorem ipsum/i,
    ];

    /**
     * Check if submission is spam
     */
    static checkSpam(input: SpamCheckInput): SpamCheckResult {
        const flags: string[] = [];
        let spamScore = 0;

        // Email checks
        if (input.email) {
            const emailDomain = input.email.split('@')[1]?.toLowerCase() || '';

            // Check for disposable email
            if (this.DISPOSABLE_EMAIL_DOMAINS.some(domain => emailDomain.includes(domain))) {
                flags.push('disposable_email');
                spamScore += 30;
            }

            // Check for test email patterns
            if (this.TEST_EMAIL_PATTERNS.some(pattern => pattern.test(input.email))) {
                flags.push('test_email_pattern');
                spamScore += 40;
            }

            // Check for suspicious domains
            if (emailDomain === 'test.com' || emailDomain === 'test.test' || emailDomain === 'example.com') {
                flags.push('suspicious_email_domain');
                spamScore += 50;
            }
        }

        // Phone checks
        if (input.phone) {
            const cleanPhone = input.phone.replace(/\s+/g, '');

            // Check for test phone patterns
            if (this.TEST_PHONE_PATTERNS.some(pattern => pattern.test(cleanPhone))) {
                flags.push('test_phone_pattern');
                spamScore += 40;
            }

            // Check for non-AU phone numbers (if provided)
            if (cleanPhone.length > 0 && !cleanPhone.match(/^(04|02|03|07|08)\d{8}$/)) {
                // Not a standard AU format (but not necessarily spam)
                flags.push('non_au_phone');
                spamScore += 10;
            }
        }

        // Description checks
        if (input.description) {
            const descLength = input.description.trim().length;

            // Very short descriptions
            if (descLength < 10) {
                flags.push('very_short_description');
                spamScore += 25;
            } else if (descLength < 20) {
                flags.push('short_description');
                spamScore += 10;
            }

            // Suspicious patterns
            if (this.SUSPICIOUS_DESCRIPTION_PATTERNS.some(pattern => pattern.test(input.description!))) {
                flags.push('suspicious_description');
                spamScore += 50;
            }
        }

        // Photo count checks
        if (input.photoCount !== undefined) {
            if (input.photoCount === 0) {
                flags.push('no_photos');
                spamScore += 20;
            } else if (input.photoCount < 3) {
                flags.push('few_photos');
                spamScore += 5;
            }
        }

        // Submit time checks (bot detection)
        if (input.submitTimeSeconds !== undefined) {
            if (input.submitTimeSeconds < 10) {
                flags.push('too_fast_submission');
                spamScore += 30; // Likely a bot
            } else if (input.submitTimeSeconds < 30) {
                flags.push('fast_submission');
                spamScore += 10; // Possibly a bot
            }
        }

        // Name checks
        if (input.name) {
            const nameLength = input.name.trim().length;
            if (nameLength < 2) {
                flags.push('invalid_name');
                spamScore += 20;
            }

            // Test name patterns
            if (/^(test|asdf|qwerty|123|abc)$/i.test(input.name.trim())) {
                flags.push('test_name');
                spamScore += 40;
            }
        }

        // Determine action based on spam score
        let action: 'auto_reject' | 'manual_review' | 'auto_approve';

        if (spamScore >= 70) {
            action = 'auto_reject'; // High spam score - reject automatically
        } else if (spamScore >= 30) {
            action = 'manual_review'; // Medium spam score - needs review
        } else {
            action = 'auto_approve'; // Low spam score - approve automatically
        }

        return {
            isSpam: spamScore >= 70,
            spamScore: Math.min(100, spamScore), // Cap at 100
            flags,
            action,
        };
    }

    /**
     * Check if email domain is trusted (insurance companies)
     */
    static isTrustedDomain(email: string): boolean {
        const domain = email.split('@')[1]?.toLowerCase() || '';
        
        const trustedDomains = [
            'p2pcover.com.au',
            'nrma.com.au',
            'allianz.com.au',
            'aami.com.au',
            'gio.com.au',
            'suncorp.com.au',
            'racv.com.au',
            'racq.com.au',
            'rac.com.au',
            'australianunity.com.au',
            'qbe.com',
            'chubb.com',
            'aig.com',
            'budgetdirect.com.au',
            'youi.com.au',
        ];

        return trustedDomains.includes(domain);
    }

    /**
     * Check if email domain is disposable
     */
    static isDisposableEmail(email: string): boolean {
        const domain = email.split('@')[1]?.toLowerCase() || '';
        return this.DISPOSABLE_EMAIL_DOMAINS.some(d => domain.includes(d));
    }
}

