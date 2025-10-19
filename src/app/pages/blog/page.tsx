import React from "react";
import Link from "next/link";

type Post = {
    id: string;
    title: string;
    excerpt: string;
    date: string;
    slug: string;
};

async function fetchPosts(): Promise<Post[]> {
    // Replace this with a real fetch to your CMS/API
    return [
        {
            id: "1",
            title: "Welcome to the Blog",
            excerpt: "Introductory post showing how to use the blog.",
            date: "2025-01-01",
            slug: "welcome-to-the-blog",
        },
        {
            id: "2",
            title: "Second Post",
            excerpt: "Short post describing the project structure.",
            date: "2025-02-14",
            slug: "second-post",
        },
    ];
}

export default async function Page(): Promise<React.ReactElement> {
    const posts = await fetchPosts();

    return (
        <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
            <header>
                <h1 style={{ margin: 0 }}>Blog</h1>
                <p style={{ color: "#666" }}>Latest posts and updates</p>
            </header>

            <section style={{ marginTop: "1.5rem" }}>
                {posts.length === 0 ? (
                    <p>No posts yet.</p>
                ) : (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {posts.map((post) => (
                            <li
                                key={post.id}
                                style={{
                                    borderTop: "1px solid #eee",
                                    padding: "1rem 0",
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <Link href={`/blog/${post.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                                    <h2 style={{ margin: 0 }}>{post.title}</h2>
                                </Link>
                                <small style={{ color: "#999", marginTop: 6 }}>{new Date(post.date).toLocaleDateString()}</small>
                                <p style={{ marginTop: 8, color: "#333" }}>{post.excerpt}</p>
                                <Link href={`/blog/${post.slug}`} style={{ marginTop: 6, color: "#0070f3" }}>
                                    Read more →
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    );
}