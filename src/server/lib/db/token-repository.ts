// ============================================
// FILE: /lib/db/token-repository.ts
// ============================================

// This is a repository pattern for database operations

import { ClaimToken, CreateTokenRequest } from '@/server/lib/types/claim-token';
import { TokenGenerator } from '@/server/lib/token/generator';
import { prisma } from '@/server/lib/db/client';

export class TokenRepository {
    /**
     * Create a new claim token
     * In production, this would interact with your database
     */
    static async create(request: CreateTokenRequest): Promise<ClaimToken> {
        const token = TokenGenerator.generateSecureToken();
        const tokenHash = TokenGenerator.hashToken(token);

        const expiresInHours = request.expiresInHours || 48;
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + expiresInHours);

        // Prisma
        const claimToken = await prisma.claimToken.create({
            data: {
                tokenHash,
                customerEmail: request.customerEmail,
                customerPhone: request.customerPhone,
                customerId: request.customerId,
                policyNumber: request.policyNumber,
                expiresAt,
                claimType: request.claimType,
                metadata: request.metadata,
            },
        });

        // Return the token (NOT the hash) to send to customer
        return {
            id: `claim_${Date.now()}`,
            token, // Only returned here, never stored
            customerEmail: request.customerEmail,
            customerPhone: request.customerPhone,
            customerId: request.customerId,
            policyNumber: request.policyNumber,
            expiresAt,
            isUsed: false,
            createdAt: new Date(),
            claimType: request.claimType,
            metadata: request.metadata,
        };
    }

    /**
     * Find a token by its value
     * In production, hash the token and look up by hash
     */
    static async findByToken(token: string): Promise<ClaimToken | null> {
        const tokenHash = TokenGenerator.hashToken(token);

        // Example with Prisma:
        // const claimToken = await prisma.claimToken.findUnique({
        //   where: { tokenHash },
        // });

        // For demo purposes:
        return null;
    }

    /**
     * Mark a token as used
     */
    static async markAsUsed(
        tokenId: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        // Example with Prisma:
        // await prisma.claimToken.update({
        //   where: { id: tokenId },
        //   data: {
        //     isUsed: true,
        //     usedAt: new Date(),
        //     ipAddress,
        //     userAgent,
        //   },
        // });
    }

    /**
     * Clean up expired tokens (run as cron job)
     */
    static async deleteExpired(): Promise<number> {
        // Example with Prisma:
        // const result = await prisma.claimToken.deleteMany({
        //   where: {
        //     expiresAt: { lt: new Date() },
        //   },
        // });
        // return result.count;

        return 0;
    }

    /**
     * Get all active tokens for admin dashboard
     */
    static async getActiveTokens(): Promise<ClaimToken[]> {
        // Example with Prisma:
        // return await prisma.claimToken.findMany({
        //   where: {
        //     isUsed: false,
        //     expiresAt: { gt: new Date() },
        //   },
        //   orderBy: { createdAt: 'desc' },
        // });

        return [];
    }
}
