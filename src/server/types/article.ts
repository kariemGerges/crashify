// types/article.ts

/**
 * Content block for a standard text paragraph.
 */
export interface ParagraphContent {
    type: 'paragraph';
    text: string;
}

/**
 * Content block for a bulleted or numbered list.
 */
export interface ListContent {
    type: 'list';
    ordered: boolean;
    items: string[];
}

/**
 * Content block for a call-to-action link.
 */
export interface CallToActionContent {
    type: 'callToAction';
    text: string;
    url: string;
}

// A union type representing any possible content block
export type ArticleContentBlock =
    | ParagraphContent
    | ListContent
    | CallToActionContent;

/**
 * A section of the article, which can contain multiple content blocks.
 * It may or may not have a heading.
 */
export interface ArticleSection {
    type: 'section';
    heading: string | null;
    content: ArticleContentBlock[];
}

/**
 * The author's information.
 */
export interface ArticleAuthor {
    name: string;
    followers: number;
}

/**
 * The main Article document structure.
 */
export interface Article {
    _id: string;
    title: string;
    author: ArticleAuthor;
    publicationDate: string; // Using string for ISO 8601 date
    slug: string;
    article: ArticleSection[];
}
