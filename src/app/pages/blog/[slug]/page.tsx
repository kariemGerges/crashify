import Link from 'next/link';
import { getArticleSlug } from '@/app/actions/getArticleSlug';

export default async function ArticleDetailPage({ params }: { params: { slug: string } }) {
    // Fetch the article data based on the slug
    const article = await getArticleSlug(params.slug);


    // function for reading time
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
            {/* Article Header */}
            <section className="border-b-4 border-zinc-800 bg-gradient-to-br from-zinc-900 to-black">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
                    <div className="mb-6 flex items-center gap-4 text-xs sm:text-sm font-bold">
                        <span className="bg-red-600 text-black px-4 py-2 uppercase">
                            {/* {article.category} */} AI
                        </span>
                        <span className="text-gray-500">
                            {readDate(article.publicationDate)}
                        </span>
                        <span className="text-gray-500">
                            {article.author.followers} views
                        </span>

                        <Link
                            href="/pages/blog"
                            className="text-sm font-bold hover:text-red-600 transition-colors"
                        >
                            ← ARTICLES
                        </Link>
                    </div>

                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black mb-6 leading-none">
                        {article.title}
                    </h1>

                    <p className="text-xl sm:text-2xl text-gray-400 mb-8 leading-relaxed">
                        {article.title}
                    </p>

                    <div className="flex items-center justify-between border-t-2 border-b-2 border-zinc-800 py-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-red-600 flex items-center justify-center">
                                <span className="text-xl sm:text-2xl font-black text-black">
                                    {article.author.name
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')}
                                </span>
                            </div>
                            <div>
                                <p className="font-bold text-sm sm:text-base">
                                    {article.author.name}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500">
                                    {readDate(article.publicationDate)}
                                </p>
                            </div>
                        </div>
                        {/* <button
                            onClick={() => setIsBookmarked(!isBookmarked)}
                            className={`w-10 h-10 sm:w-12 sm:h-12 border-2 flex items-center justify-center transition-all ${
                                isBookmarked
                                    ? 'bg-red-600 border-red-600'
                                    : 'border-zinc-700 hover:border-red-600'
                            }`}
                        >
                            <span className="text-lg sm:text-xl">
                                {isBookmarked ? '★' : '☆'}
                            </span>
                        </button> */}
                    </div>
                </div>
            </section>

            {/* Featured Image */}
            <div className="border-b-4 border-zinc-800">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-gradient-to-br from-zinc-800 to-black h-64 sm:h-96 lg:h-[500px] flex items-center justify-center text-8xl sm:text-9xl">
                        {/* {article.image} */} image
                    </div>
                </div>
            </div>

            <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
                <div className="prose prose-invert prose-lg max-w-none">
                    {article.article.map((section, i) => (
                        <div key={i} className="mb-12">
                            {/* Section Heading */}
                            {section.heading && (
                                <h2 className="text-2xl sm:text-3xl font-black text-white mt-12 mb-6">
                                    {section.heading}
                                </h2>
                            )}

                            {/* Section Content */}
                            {section.content.map((content, j) => {
                                interface ContentType {
                                    type: 'paragraph' | 'quote' | 'list';
                                    text?: string;
                                    items?: string[];
                                }
                                const c = content as ContentType;

                                if (c.type === 'paragraph') {
                                    return (
                                        <p
                                            key={j}
                                            className="text-gray-300 mb-6 leading-relaxed"
                                        >
                                            {c.text}
                                        </p>
                                    );
                                }

                                if (c.type === 'quote') {
                                    return (
                                        <div
                                            key={j}
                                            className="bg-zinc-900 border-l-4 border-red-600 p-6 my-8"
                                        >
                                            <p className="text-lg sm:text-xl italic text-gray-300">
                                                “{c.text}”
                                            </p>
                                        </div>
                                    );
                                }

                                if (c.type === 'list' && c.items && c.items.length > 0) {
                                    return (
                                        <ul
                                            key={j}
                                            className="space-y-3 text-gray-300 bg-zinc-900 p-8 my-12 border-2 border-zinc-800 rounded-lg"
                                        >
                                            {c.items.map(
                                                (item: string, k: number) => (
                                                    <li
                                                        key={k}
                                                        className="flex items-start gap-3"
                                                    >
                                                        <span className="text-red-600 font-black">
                                                            →
                                                        </span>
                                                        <span>{item}</span>
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    );
                                }

                                return null;
                            })}
                        </div>
                    ))}
                </div>

                {/* Tags */}
                {Array.isArray(article.tags) &&
                    article.tags.length > 0 && (
                        <div className="mt-12 pt-8 border-t-2 border-zinc-800">
                            <div className="flex flex-wrap gap-3">
                                {article.tags.map((tag: string) => (
                                    <span
                                        key={tag}
                                        className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-sm font-bold hover:border-red-600 transition-colors cursor-pointer"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
            </article>

            {/* Author Bio */}
            <section className="border-y-4 border-zinc-800 bg-zinc-900">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
                    <div className="flex items-start gap-6">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-3xl sm:text-4xl font-black text-black">
                                {article.author.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black mb-2">
                                About {article.author.name}
                            </h3>
                            <p className="text-gray-400 mb-4 leading-relaxed">
                                {/* {article.authorBio} */}
                            </p>
                            <a
                                href="https://www.linkedin.com/newsletters/crashify-ai-powered-solution-7202494885646528513/"
                                target="_blank"
                                rel="noopener noreferrer"
                                title="More from this author"
                                className="text-sm font-bold text-red-600 hover:text-white transition-colors"
                            >
                                MORE FROM THIS AUTHOR →
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Related Articles */}
            <section className="bg-black">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
                    <h2 className="text-3xl sm:text-4xl font-black mb-8 sm:mb-12">
                        Keep Reading
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {/* {relatedArticles.map((related, index) => (
                            <div
                                key={index}
                                className="bg-zinc-900 border-2 border-zinc-800 p-6 hover:border-red-600 transition-all cursor-pointer group"
                            >
                                <span className="text-xs font-black text-red-600 uppercase mb-3 block">
                                    {related.category}
                                </span>
                                <h3 className="text-xl font-black mb-3 group-hover:text-red-600 transition-colors">
                                    {related.title}
                                </h3>
                                <span className="text-sm text-gray-500 font-bold">
                                    {related.time}
                                </span>
                            </div>
                        ))} */}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t-4 border-red-600 bg-zinc-900"></footer>
        </div>
    );
};

