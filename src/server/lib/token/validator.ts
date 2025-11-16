//============================================
// FILE: /lib/token/validator.ts
// ============================================

import { ClaimToken, TokenValidationResponse } from '@/server/lib/types/claim-token';

export class TokenValidator {
    /**
     * Validate a claim token
     */
    static validate(token: ClaimToken | null): TokenValidationResponse {
        if (!token) {
            return {
                valid: false,
                error: 'Token not found',
                errorCode: 'NOT_FOUND',
            };
        }

        // Check if token is already used
        if (token.isUsed) {
            return {
                valid: false,
                error: 'This token has already been used',
                errorCode: 'USED',
            };
        }

        // Check if token is expired
        const now = new Date();
        if (now > token.expiresAt) {
            return {
                valid: false,
                error: 'This token has expired',
                errorCode: 'EXPIRED',
            };
        }

        return {
            valid: true,
            token,
        };
    }

    /**
     * Calculate time remaining for a token
     */
    static getTimeRemaining(expiresAt: Date): {
        expired: boolean;
        days: number;
        hours: number;
        minutes: number;
        totalMilliseconds: number;
    } {
        const now = new Date();
        const diff = expiresAt.getTime() - now.getTime();

        if (diff < 0) {
            return {
                expired: true,
                days: 0,
                hours: 0,
                minutes: 0,
                totalMilliseconds: 0,
            };
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
            (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return {
            expired: false,
            days,
            hours,
            minutes,
            totalMilliseconds: diff,
        };
    }
}
