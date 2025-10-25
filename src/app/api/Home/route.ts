import { NextResponse } from 'next/server';
import dbConnect from '@/server/config/mongoDb';

export async function GET(): Promise<NextResponse> {
    try {
        await dbConnect();
        return NextResponse.json(
            { message: 'Connected to MongoDB' },
            { status: 200 }
        );
    } catch (err) {
        // Log full error server-side for diagnostics
        console.error('DB connect error in /api/Home:', err);

        // In development, return useful message; in production avoid leaking internal details
        const isDev = process.env.NODE_ENV === 'development';
        const message =
            isDev && err instanceof Error
                ? err.message
                : 'Database connection failed';

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
