// Create and Fetch Articles API Route


import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/server/config/mongoDb';
import Article from '@/server/models/Article';

interface MongoError {
    name?: string;
    code?: number;
    keyValue?: Record<string, unknown>;
    errors?: Record<string, unknown>;
}

// --- CREATE a new article ---
export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const body = await request.json();
        const newArticle = await Article.create(body);
        return NextResponse.json(newArticle, { status: 201 });
    } catch (error: unknown) {
        console.error(error);
        const err = error as MongoError;
        if (err?.name === 'ValidationError') {
            return NextResponse.json(
                { message: 'Validation Error', errors: err.errors },
                { status: 400 }
            );
        }
        if (err?.code === 11000) {
            return NextResponse.json(
                { message: 'Duplicate key error', field: err.keyValue },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { message: 'An error occurred while creating the article' },
            { status: 500 }
        );
    }
}

// --- FETCH all articles ---
export async function GET() {
    try {
        await dbConnect();

        // Find all articles
        // .select(): Only fetches the fields we need for a list view (improves performance)
        // .sort(): Sorts by publication date, newest first
        const articles = await Article.find({})
            .select('title slug publicationDate author')
            .sort({ publicationDate: -1 });

        return NextResponse.json(articles, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: 'An error occurred while fetching articles' },
            { status: 500 }
        );
    }
}
