import { Article } from '@/server/types/article';

type ArticlePreview = Pick<
    Article,
    'slug' | 'title' | 'publicationDate' | 'author'
> & {
    _id: string;
};

export async function getArticles(): Promise<ArticlePreview[]> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    try {
        // Check for missing environment variable early
        if (!baseUrl) {
            throw new Error(
                'Environment variable NEXT_PUBLIC_APP_URL is not defined.'
            );
        }

        const fullUrl = `${baseUrl}api/articles`;
        // console.log('[getArticles] Fetching from:', fullUrl);

        const res = await fetch(fullUrl, {
            next: { revalidate: 3600 },
        });
                // const res = await fetch('http://localhost:3000/api/articles', { cache: 'no-store' });


        if (!res.ok) {
            const errorText = await res.text().catch(() => '');
            throw new Error(
                `Fetch failed: ${res.status} ${res.statusText}. Response: ${errorText}`
            );
        }

        const data = await res.json().catch((err) => {
            throw new Error(`Invalid JSON response: ${err}`);
        });

        if (!Array.isArray(data)) {
            throw new Error('Unexpected response format: expected an array.');
        }

        return data as ArticlePreview[];
    } catch (error: unknown) {
        // Identify specific error types
        if (error instanceof TypeError && error.message.includes('fetch')) {
            console.error('[getArticles] Network or CORS error:', error);
        } else if (error instanceof Error) {
            console.error('[getArticles] Error:', error.message);
        } else {
            console.error('[getArticles] Unknown error:', error);
        }

        // Rethrow for the caller to handle
        throw error;
    }
}
