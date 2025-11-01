import { Article } from '@/server/types/article';

type FullArticle = Article & {
    _id: string;
    createdAt: string;
    updatedAt: string;
};

export async function getArticleSlug(slug: string): Promise<FullArticle> {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}api/articles/${slug}`,
        // `http://localhost:3000/api/articles/${slug}`,

        {
            cache: 'no-store',
        }
    );

    if (res.status === 404) {

        throw new Error('Article not found');
    }

    if (!res.ok) {
        throw new Error('Failed to fetch article');
    }

    return res.json();
}