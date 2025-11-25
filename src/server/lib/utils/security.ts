// =============================================
// FILE: lib/utils/security.ts
// Security utilities for input validation and sanitization
// =============================================

/**
 * Validates and sanitizes an IP address from headers
 * Handles x-forwarded-for which can contain multiple IPs or be spoofed
 * @param ipHeader The IP address header value (e.g., from x-forwarded-for)
 * @returns The first valid IP address or null
 */
export function validateAndExtractIp(ipHeader: string | null): string | null {
    if (!ipHeader) return null;

    // x-forwarded-for can contain multiple IPs: "client, proxy1, proxy2"
    // Take the first one (original client)
    const firstIp = ipHeader.split(',')[0].trim();

    // Validate IPv4 format
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    // Validate IPv6 format (simplified)
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

    if (ipv4Regex.test(firstIp)) {
        // Additional IPv4 validation - check each octet is 0-255
        const parts = firstIp.split('.');
        const isValid = parts.every(
            part => {
                const num = parseInt(part, 10);
                return num >= 0 && num <= 255;
            }
        );
        return isValid ? firstIp : null;
    }

    if (ipv6Regex.test(firstIp)) {
        return firstIp;
    }

    // Invalid IP format
    return null;
}

/**
 * Validates email format and length
 * @param email Email to validate
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    
    // RFC 5322 compliant email regex (simplified but secure)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    // Maximum email length per RFC 5321
    const MAX_EMAIL_LENGTH = 254;
    
    const trimmed = email.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_EMAIL_LENGTH) {
        return false;
    }
    
    return emailRegex.test(trimmed);
}

/**
 * Sanitizes email by trimming and lowercasing
 * Should only be called after validation
 * @param email Email to sanitize
 * @returns Sanitized email
 */
export function sanitizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

/**
 * Validates password length to prevent DoS attacks
 * @param password Password to validate
 * @returns true if valid, false otherwise
 */
export function isValidPasswordLength(password: string): boolean {
    if (!password || typeof password !== 'string') return false;
    
    // Minimum length (should match your password policy)
    const MIN_LENGTH = 8;
    // Maximum length to prevent DoS attacks (e.g., bcrypt has limits)
    const MAX_LENGTH = 128;
    
    return password.length >= MIN_LENGTH && password.length <= MAX_LENGTH;
}

