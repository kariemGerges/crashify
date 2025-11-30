// =============================================
// FILE: lib/config/env-validation.ts
// Environment variable validation at startup
// =============================================

/**
 * Validates all required environment variables at application startup
 * Throws error if any required variables are missing
 */
export function validateEnvironmentVariables(): void {
    const errors: string[] = [];

    // Supabase configuration (required)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        errors.push('NEXT_PUBLIC_SUPABASE_URL is required');
    } else {
        // Validate URL format
        try {
            new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
        } catch {
            errors.push('NEXT_PUBLIC_SUPABASE_URL must be a valid URL');
        }
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
    } else if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length < 20) {
        errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)');
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        errors.push('SUPABASE_SERVICE_ROLE_KEY is required for server operations');
    } else if (process.env.SUPABASE_SERVICE_ROLE_KEY.length < 20) {
        errors.push('SUPABASE_SERVICE_ROLE_KEY appears to be invalid (too short)');
    }

    // Database URL (for Prisma)
    if (!process.env.DATABASE_URL) {
        errors.push('DATABASE_URL is required for Prisma');
    } else if (!process.env.DATABASE_URL.startsWith('postgresql://')) {
        errors.push('DATABASE_URL must be a PostgreSQL connection string');
    }

    // Optional but recommended environment variables
    const warnings: string[] = [];

    if (!process.env.NEXT_PUBLIC_APP_URL) {
        warnings.push('NEXT_PUBLIC_APP_URL is not set (some features may not work correctly)');
    }

    if (!process.env.RESEND_API_KEY) {
        warnings.push('RESEND_API_KEY is not set (email functionality will be limited)');
    }

    if (!process.env.STRIPE_SECRET_KEY) {
        warnings.push('STRIPE_SECRET_KEY is not set (payment functionality will not work)');
    }

    // Log warnings (non-blocking)
    if (warnings.length > 0) {
        console.warn('⚠️  Environment variable warnings:');
        warnings.forEach(warning => console.warn(`   - ${warning}`));
    }

    // Throw error if required variables are missing
    if (errors.length > 0) {
        console.error('❌ Missing or invalid required environment variables:');
        errors.forEach(error => console.error(`   - ${error}`));
        throw new Error(
            `Environment validation failed. Missing or invalid variables:\n${errors.join('\n')}`
        );
    }

    console.log('✅ Environment variables validated successfully');
}

/**
 * Get validated environment variable (throws if missing)
 */
export function getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
}

/**
 * Get optional environment variable with default
 */
export function getOptionalEnv(key: string, defaultValue: string = ''): string {
    return process.env[key] || defaultValue;
}

