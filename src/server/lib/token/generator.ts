// ============================================
// FILE: /lib/token/generator.ts
// ============================================

import crypto from 'crypto';

export class TokenGenerator {
    /**
     * Generate a cryptographically secure random token
     * @param length Token length in bytes (default: 32 bytes = 64 hex chars)
     */
    static generateSecureToken(length: number = 32): string {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Generate a shorter, more readable token (still secure)
     * @param length Token length (default: 32 chars)
     */
    static generateReadableToken(length: number = 32): string {
        const chars = 'abcdefghijkmnopqrstuvwxyz23456789'; // Removed ambiguous chars
        const bytes = crypto.randomBytes(length);
        let token = '';

        for (let i = 0; i < length; i++) {
            token += chars[bytes[i] % chars.length];
        }

        return token;
    }

    /**
     * Hash a token for secure storage
     */
    static hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    /**
     * Verify a token against its hash
     */
    static verifyToken(token: string, hash: string): boolean {
        return this.hashToken(token) === hash;
    }
}
