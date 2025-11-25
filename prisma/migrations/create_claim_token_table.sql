-- Migration: Create ClaimToken table
-- Run this SQL script in your PostgreSQL database

CREATE TABLE IF NOT EXISTS "ClaimToken" (
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

-- Create unique index on tokenHash
CREATE UNIQUE INDEX IF NOT EXISTS "ClaimToken_tokenHash_key" ON "ClaimToken"("tokenHash");

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "ClaimToken_tokenHash_idx" ON "ClaimToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "ClaimToken_customerId_idx" ON "ClaimToken"("customerId");
CREATE INDEX IF NOT EXISTS "ClaimToken_expiresAt_idx" ON "ClaimToken"("expiresAt");
CREATE INDEX IF NOT EXISTS "ClaimToken_isUsed_expiresAt_idx" ON "ClaimToken"("isUsed", "expiresAt");

