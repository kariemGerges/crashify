'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Loading from '@/app/components/Loading';
import Err from '@/app/components/Error';
import { getArticles } from '@/app/actions/getArticles';
import { Article } from '@/server/types/article';

export const metadata = {
    title: 'Crashify — AI Vehicle Assessments | Book. Assess. Report in 48 Hours',
    description:
        'Fast AI-assisted vehicle damage assessments for insurers & fleets. Book online — get a full report within 48 hours. Serving Australia.',
    openGraph: {
        title: 'Crashify — AI Vehicle Assessments (48-hour reports)',
        description:
            'Fast AI-assisted vehicle damage assessments for insurers & fleets. Book online — get a full report within 48 hours.',
        url: 'https://crashify.com.au',
        images: ['/og-image.jpg'],
    },
};

export default function Page(): React.ReactElement {
    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const data = (await getArticles()) as unknown as Article[];
                setArticles(data);
            } catch {
                setErrorMessage(
                    'Unable to load articles. Please try again later.'
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchArticles();
    }, []);

    if (isLoading) {
        return <Loading />;
    }

    if (errorMessage) {
        return <Err  message={errorMessage} />;
    }

    const readDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        };
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, options);
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Hero - Mobile Optimized */}
            <section className="border-b-2 sm:border-b-4 border-red-600 bg-gradient-to-br from-zinc-900 to-black py-12 sm:py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-5 sm:px-6">
                    <div className="max-w-3xl">
                        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-6 leading-tight">
                            Stories Worth
                            <span className="block text-red-600 mt-1 sm:mt-2">
                                Reading
                            </span>
                        </h2>
                        <p className="text-base sm:text-lg md:text-xl text-gray-400 font-medium leading-relaxed">
                            Transforming the automotive industry with
                            cutting-edge AI damage detection vision technology
                        </p>
                    </div>
                </div>
            </section>

            {/* Articles Grid - Mobile First */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
                <div className="flex flex-col gap-5 sm:gap-6 md:grid md:grid-cols-2 lg:grid-cols-3">
                    {articles.map((article) => (
                        <Link
                            href={`/pages/blog/${article.slug}`}
                            key={article._id}
                            className="block"
                        >
                            <article className="group bg-zinc-900 border-2 border-zinc-800 hover:border-red-600 active:border-red-500 transition-all duration-300 overflow-hidden">
                                {/* Image placeholder - Mobile optimized height */}
                                <div className="bg-gradient-to-br from-zinc-800 to-black h-44 sm:h-48 md:h-52 flex items-center justify-center text-5xl sm:text-6xl border-b-2 border-zinc-800 group-hover:border-red-600 transition-all">
                                    <span className="opacity-50">📰</span>
                                </div>

                                {/* Content - Better mobile spacing */}
                                <div className="p-5 sm:p-6">
                                    <div className="flex items-center justify-between mb-3 gap-2">
                                        <span className="text-xs font-black text-red-600 uppercase tracking-wider truncate">
                                            {/* {article.slug} */} Followers
                                        </span>
                                        <span className="text-xs text-gray-500 font-bold whitespace-nowrap">
                                            {article.author.followers}
                                        </span>
                                    </div>

                                    <h3 className="text-xl sm:text-2xl font-black mb-3 group-hover:text-red-600 transition-colors leading-tight line-clamp-2">
                                        {article.title}
                                    </h3>

                                    <p className="text-sm sm:text-base text-gray-400 mb-4 leading-relaxed line-clamp-3">
                                        {article.slug}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-sm truncate">
                                                {article.author.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {readDate(
                                                    article.publicationDate
                                                )}
                                            </p>
                                        </div>
                                        <Link
                                            href={`/pages/blog/${article.slug}`}
                                            aria-label={`Read article: ${article.title}`}
                                            className="w-10 h-10 sm:w-8 sm:h-8 bg-red-600 flex items-center justify-center group-hover:bg-white group-active:scale-95 transition-all transition-colors flex-shrink-0 ml-3"
                                        >
                                            <span className="text-black font-black text-xl sm:text-lg">
                                                →
                                            </span>
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>

                {/* Load More - Mobile optimized button */}
                <div className="text-center mt-10 sm:mt-12 md:mt-16 px-4">
                    <button className="w-full sm:w-auto bg-red-600 text-black px-8 sm:px-12 py-4 font-black text-sm uppercase hover:bg-white active:scale-95 transition-all touch-manipulation">
                        Load More Articles
                    </button>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t-2 sm:border-t-4 border-red-600 bg-zinc-900 mt-12 sm:mt-16 md:mt-20 h-16 sm:h-20"></footer>
        </div>
    );
}
