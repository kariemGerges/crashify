import { Article } from '@/server/types/article';

type ArticlePreview = Pick<
    Article,
    'slug' | 'title' | 'publicationDate' | 'author'
> & {
    _id: string;
};

export async function getArticles(): Promise<ArticlePreview[]> {
    try {
        const res = await fetch(
            // `${process.env.NEXT_PUBLIC_APP_URL}/api/articles`,
            'http://localhost:3000/api/articles',

            {
                cache: 'no-store',
            }
        );

        if (!res.ok) {
            console.error('Failed to fetch articles:', res.statusText);
            throw new Error('Failed to fetch articles');
        }

        return res.json();
    } catch (error) {
        console.error('Error fetching articles:', error);
        throw error;
    }
}
