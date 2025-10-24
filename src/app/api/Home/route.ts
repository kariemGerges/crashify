import { NextResponse } from "next/server";
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/server/config/mongoDb';


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    await dbConnect();
    res.status(200).json({ message: 'Connected to MongoDB' });
    return NextResponse.json({ message: 'Hello, Next.js!' });
}