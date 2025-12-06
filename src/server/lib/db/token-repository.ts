// ============================================
// FILE: /lib/db/token-repository.ts
// ============================================

// Repository pattern for claim token database operations
// Provides type-safe database access with proper error handling

import { ClaimToken, CreateTokenRequest } from '@/server/lib/types/claim-token';
import { TokenGenerator } from '@/server/lib/token/generator';
import { prisma } from '@/server/lib/db/client';
import { Prisma } from '@/generated/prisma/client';
import type { Json } from '@/server/lib/types/database.types';

/**
 * Prisma ClaimToken model type
 */
type PrismaClaimToken = Prisma.ClaimTokenGetPayload<Record<string, never>>;

/**
 * Maps Prisma ClaimToken database record to application ClaimToken interface
 * Note: Plain token is only available during creation, otherwise empty string
 */
function mapPrismaToClaimToken(
    dbRecord: PrismaClaimToken,
    plainToken?: string
): ClaimToken {
    return {
        id: dbRecord.id,
        token: plainToken ?? '', // Plain token only available during creation
        customerEmail: dbRecord.customerEmail,
        customerPhone: dbRecord.customerPhone,
        customerId: dbRecord.customerId,
        policyNumber: dbRecord.policyNumber ?? undefined,
        expiresAt: dbRecord.expiresAt,
        isUsed: dbRecord.isUsed,
        usedAt: dbRecord.usedAt ?? undefined,
        createdAt: dbRecord.createdAt,
        claimType: dbRecord.claimType ?? undefined,
        ipAddress: dbRecord.ipAddress ?? undefined,
        userAgent: dbRecord.userAgent ?? undefined,
        metadata:
            dbRecord.metadata && typeof dbRecord.metadata === 'object'
                ? (dbRecord.metadata as Record<string, unknown>)
                : undefined,
    };
}

export class TokenRepository {
    /**
     * Create a new claim token and store it in the database
     * @param request Token creation request with customer and policy information
     * @returns ClaimToken with the plain token (only returned here, never stored)
     * @throws Error if database operation fails
     */
    static async create(request: CreateTokenRequest): Promise<ClaimToken> {
        try {
            const token = TokenGenerator.generateSecureToken();
            const tokenHash = TokenGenerator.hashToken(token);

            const expiresInHours = request.expiresInHours || 48;
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + expiresInHours);

            const dbRecord = await prisma.claimToken.create({
                data: {
                    tokenHash,
                    customerEmail: request.customerEmail,
                    customerPhone: request.customerPhone,
                    customerId: request.customerId,
                    policyNumber: request.policyNumber,
                    expiresAt,
                    claimType: request.claimType,
                    metadata: request.metadata ? (request.metadata as Prisma.InputJsonValue) : undefined,
                },
            });

            // Return the token with plain token included (only time it's available)
            return mapPrismaToClaimToken(dbRecord, token);
        } catch (error: unknown) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    // Unique constraint violation (tokenHash already exists - extremely rare)
                    throw new Error(
                        'Token generation conflict. Please try again.'
                    );
                }
            }
            console.error('[TokenRepository] Error creating token:', error);
            throw new Error('Failed to create claim token');
        }
    }

    /**
     * Find a token by its plain token value
     * Hashes the token and looks up by hash in the database
     * @param token Plain token string
     * @returns ClaimToken if found, null otherwise
     * @throws Error if database operation fails
     */
    static async findByToken(token: string): Promise<ClaimToken | null> {
        try {
            const tokenHash = TokenGenerator.hashToken(token);

            const dbRecord = await prisma.claimToken.findUnique({
                where: { tokenHash },
            });

            if (!dbRecord) {
                return null;
            }

            return mapPrismaToClaimToken(dbRecord);
        } catch (error: unknown) {
            console.error('[TokenRepository] Error finding token:', error);
            throw new Error('Failed to find claim token');
        }
    }

    /**
     * Mark a token as used with optional tracking information
     * @param tokenId Database ID of the token
     * @param ipAddress Optional IP address of the user
     * @param userAgent Optional user agent string
     * @throws Error if token not found or database operation fails
     */
    static async markAsUsed(
        tokenId: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        try {
            await prisma.claimToken.update({
                where: { id: tokenId },
                data: {
                    isUsed: true,
                    usedAt: new Date(),
                    ipAddress,
                    userAgent,
                },
            });
        } catch (error: unknown) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    // Record not found
                    throw new Error('Token not found');
                }
            }
            console.error(
                '[TokenRepository] Error marking token as used:',
                error
            );
            throw new Error('Failed to mark token as used');
        }
    }

    /**
     * Delete expired tokens from the database
     * Should be run as a scheduled cron job
     * @returns Number of tokens deleted
     * @throws Error if database operation fails
     */
    static async deleteExpired(): Promise<number> {
        try {
            const result = await prisma.claimToken.deleteMany({
                where: {
                    expiresAt: { lt: new Date() },
                },
            });
            return result.count;
        } catch (error: unknown) {
            console.error(
                '[TokenRepository] Error deleting expired tokens:',
                error
            );
            throw new Error('Failed to delete expired tokens');
        }
    }

    /**
     * Get all active (unused and not expired) tokens
     * Used for admin dashboard and monitoring
     * @returns Array of active ClaimToken records
     * @throws Error if database operation fails
     */
    static async getActiveTokens(): Promise<ClaimToken[]> {
        try {
            const dbRecords = await prisma.claimToken.findMany({
                where: {
                    isUsed: false,
                    expiresAt: { gt: new Date() },
                },
                orderBy: { createdAt: 'desc' },
            });

            return dbRecords.map(record => mapPrismaToClaimToken(record));
        } catch (error: unknown) {
            console.error(
                '[TokenRepository] Error getting active tokens:',
                error
            );
            
            // Provide more detailed error information
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                console.error('[TokenRepository] Prisma error code:', error.code);
                console.error('[TokenRepository] Prisma error message:', error.message);
                throw new Error(
                    `Database error (${error.code}): ${error.message}`
                );
            }
            
            if (error instanceof Prisma.PrismaClientInitializationError) {
                console.error('[TokenRepository] Prisma initialization error:', error.message);
                throw new Error(
                    `Database connection failed: ${error.message}. Please check your DATABASE_URL environment variable.`
                );
            }
            
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to get active tokens: ${errorMessage}`);
        }
    }
}
