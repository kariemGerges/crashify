// ============================================
// FILE: /lib/db/client.ts
// ============================================

// Prisma client singleton for Next.js
// Prevents multiple instances in development

import { PrismaClient } from '@/generated/prisma/client';

declare global {
    // eslint-disable-next-line no-var
    var prisma: InstanceType<typeof PrismaClient> | undefined;
}

export const prisma: InstanceType<typeof PrismaClient> =
    globalThis.prisma ??
    new PrismaClient({
        log:
            process.env.NODE_ENV === 'development'
                ? ['query', 'error', 'warn']
                : ['error'],
    });

if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}
