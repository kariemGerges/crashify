// models/Article.ts

import mongoose, { Schema, Document } from 'mongoose';
import { Article, ArticleAuthor, ArticleSection } from '@/server/types/article';

// Mongoose Document interface
export interface IArticle extends Document<unknown, Article> {
    title: string;
    slug: string;
    publicationDate: Date;
    author: ArticleAuthor;
    article: ArticleSection[];
}

// --- Schemas ---

const ArticleAuthorSchema = new Schema<ArticleAuthor>(
    {
        name: { type: String, required: true },
        followers: { type: Number, required: true },
    },
    { _id: false }
);

// This schema is flexible to allow for our different content block types.
// Mongoose's validation will be more general here,
// but TypeScript types provide strictness at the application level.
const ArticleContentBlockSchema = new Schema(
    {
        type: {
            type: String,
            required: true,
            enum: ['paragraph', 'list', 'callToAction'],
        },
        text: { type: String },
        ordered: { type: Boolean },
        items: [{ type: String }],
        url: { type: String },
    },
    { _id: false, minimize: false }
);

const ArticleSectionSchema = new Schema<ArticleSection>(
    {
        type: { type: String, required: true, default: 'section' },
        heading: { type: String, default: null },
        content: [ArticleContentBlockSchema],
    },
    { _id: false }
);

// --- Main Article Schema ---

const ArticleSchema = new Schema<IArticle>(
    {
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true, index: true },
        // MongoDB handles dates natively
        publicationDate: { type: Schema.Types.Date, required: true },
        author: { type: ArticleAuthorSchema, required: true },
        article: [ArticleSectionSchema],
    },
    {
        timestamps: true, // Adds createdAt and updatedAt timestamps
    }
);

/**
 * Prevent Mongoose from recompiling the model
 * if it's already compiled in the dev environment (HMR)
 */
export default mongoose.models.Article ||
    mongoose.model<IArticle>('Article', ArticleSchema);
