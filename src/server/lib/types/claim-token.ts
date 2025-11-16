// ============================================
// FILE: /lib/types/claim-token.ts
// ============================================

export interface ClaimToken {
    id: string;
    token: string;
    customerEmail: string;
    customerPhone: string;
    customerId: string;
    policyNumber?: string;
    expiresAt: Date;
    isUsed: boolean;
    usedAt?: Date;
    createdAt: Date;
    claimType?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
}

export interface TokenValidationResponse {
    valid: boolean;
    token?: ClaimToken;
    error?: string;
    errorCode?: 'INVALID' | 'EXPIRED' | 'USED' | 'NOT_FOUND';
}

export interface CreateTokenRequest {
    customerEmail: string;
    customerPhone: string;
    customerId: string;
    policyNumber?: string;
    claimType?: string;
    expiresInHours?: number; // Default 48
    metadata?: Record<string, any>;
}
