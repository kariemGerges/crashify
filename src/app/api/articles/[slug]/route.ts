// Fetch a Single Article by Slug API Route

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/server/config/mongoDb';
import Article from '@/server/models/Article';

// --- FETCH a single article by its slug ---
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ slug: string }> }
) {
    try {
        await dbConnect();

        // Get the slug from the URL parameters
        const { slug } = await context.params;
        if (!slug) {
            return NextResponse.json(
                { message: 'Slug is required' },
                { status: 400 }
            );
        }

        // Find the single article in the database
        // This time, we do NOT use .select() because we want all the content
        const article = await Article.findOne({ slug: slug });

        // If no article is found, return a 404
        if (!article) {
            return NextResponse.json(
                { message: 'Article not found' },
                { status: 404 }
            );
        }

        // Return the found article
        return NextResponse.json(article, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: 'An error occurred while fetching the article' },
            { status: 500 }
        );
    }
}
