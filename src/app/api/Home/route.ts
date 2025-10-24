import { NextResponse } from 'next/server';
import dbConnect from '@/server/config/mongoDb';

export async function GET() {
    await dbConnect();
    return NextResponse.json({ message: 'Connected to MongoDB' });
}
