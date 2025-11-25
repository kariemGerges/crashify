#!/usr/bin/env tsx
/**
 * Script to create the ClaimToken table in the database
 * Run with: npx tsx scripts/create-claim-token-table.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Creating ClaimToken table...');

    try {
        // Check if table exists
        const tableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'ClaimToken'
            );
        `;

        if (tableExists[0]?.exists) {
            console.log('✅ ClaimToken table already exists');
            return;
        }

        // Create table
        await prisma.$executeRaw`
            CREATE TABLE "ClaimToken" (
                "id" TEXT NOT NULL,
                "tokenHash" TEXT NOT NULL,
                "customerEmail" TEXT NOT NULL,
                "customerPhone" TEXT NOT NULL,
                "customerId" TEXT NOT NULL,
                "policyNumber" TEXT,
                "expiresAt" TIMESTAMP(3) NOT NULL,
                "isUsed" BOOLEAN NOT NULL DEFAULT false,
                "usedAt" TIMESTAMP(3),
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "claimType" TEXT,
                "ipAddress" TEXT,
                "userAgent" TEXT,
                "metadata" JSONB,

                CONSTRAINT "ClaimToken_pkey" PRIMARY KEY ("id")
            );
        `;

        // Create unique index on tokenHash
        await prisma.$executeRaw`
            CREATE UNIQUE INDEX "ClaimToken_tokenHash_key" ON "ClaimToken"("tokenHash");
        `;

        // Create indexes for performance
        await prisma.$executeRaw`
            CREATE INDEX "ClaimToken_tokenHash_idx" ON "ClaimToken"("tokenHash");
        `;

        await prisma.$executeRaw`
            CREATE INDEX "ClaimToken_customerId_idx" ON "ClaimToken"("customerId");
        `;

        await prisma.$executeRaw`
            CREATE INDEX "ClaimToken_expiresAt_idx" ON "ClaimToken"("expiresAt");
        `;

        await prisma.$executeRaw`
            CREATE INDEX "ClaimToken_isUsed_expiresAt_idx" ON "ClaimToken"("isUsed", "expiresAt");
        `;

        console.log('✅ ClaimToken table created successfully!');
    } catch (error) {
        console.error('❌ Error creating table:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

