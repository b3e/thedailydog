import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import type { Article } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import ShareBar from "@/components/ShareBar";
import SubscriptionForm from "@/components/SubscriptionForm";

interface Props {
  params: { slug: string };
}

async function getArticle(slug: string): Promise<
  | (Article & {
      author: { id: string; name: string | null; email: string | null } | null;
    })
  | null
> {
  const article = await prisma.article.findUnique({
    where: { slug },
    include: { author: true },
  });
  return article;
}

async function getRelatedArticles(
  currentArticleId: string,
  limit: number = 3
): Promise<Article[]> {
  const articles = await prisma.article.findMany({
    where: {
      publishedAt: { not: null },
      id: { not: currentArticleId },
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return articles;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: "Article Not Found",
    };
  }

  return {
    title: article.title,
    description: article.excerpt || article.title,
    openGraph: {
      title: article.title,
      description: article.excerpt || article.title,
      images: article.imageUrl ? [article.imageUrl] : [],
      type: "article",
      publishedTime: article.publishedAt?.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt || article.title,
      images: article.imageUrl ? [article.imageUrl] : [],
    },
  };
}

async function trackView(articleId: string, ipHash: string, userAgent: string) {
  try {
    await prisma.view.create({
      data: {
        articleId,
        ipHash,
        userAgent,
      },
    });
  } catch (error) {
    // Silently fail - view tracking shouldn't break the page
    console.error("Failed to track view:", error);
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = params;
  const article = await getArticle(slug);

  if (!article || !article.publishedAt) {
    notFound();
  }

  // Track view (in a real app, you'd get IP from headers)
  const ipHash = "anonymous"; // You'd hash the actual IP
  const userAgent = "Next.js Server";

  // Track view asynchronously without blocking render
  trackView(article.id, ipHash, userAgent);

  // Get related articles
  const relatedArticles = await getRelatedArticles(article.id);
  // Build absolute URL for sharing based on current request headers
  const h = await headers();
  const protocol = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const articleUrl = `${protocol}://${host}/article/${article.slug}`;

  // Prepare HTML: clean artifacts, support plain-text newlines, make links safe, convert [n] citations to links
  const processedHtml = (() => {
    const raw = article.content || "";
    const stripped = raw.replace(/[\uFFFC\uFFFD]/g, "");
    // If content looks like plain text (no common HTML block tags), convert newlines to HTML
    const looksPlainText =
      !/(<\s*(p|h1|h2|h3|h4|h5|h6|ul|ol|li|blockquote|img|a|div|section)\b)/i.test(
        stripped
      );
    const asHtml = looksPlainText
      ? (() => {
          const escaped = stripped
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          const withBreaks = escaped
            .split(/\n\n+/)
            .map((para) => para.replace(/\n/g, "<br />"))
            .map((para) => `<p>${para}</p>`)
            .join("");
          return withBreaks;
        })()
      : stripped;
    // add target and rel to links if missing
    const withTarget = asHtml.replace(
      /<a(?![^>]*\btarget=)/gi,
      '<a target="_blank" rel="noopener noreferrer"'
    );
    // ensure rel is present when target is present
    const withRel = withTarget.replace(
      /<a([^>]*\btarget=\"?_blank\"?)(?![^>]*\brel=)/gi,
      '<a$1 rel="noopener noreferrer"'
    );
    // convert inline [1] style markers to links if references list exists
    const hasRefs = /<ol[\s\S]*id=\"ref-\d+\"/i.test(withRel);
    const withCitations = hasRefs
      ? withRel.replace(/\[(\d+)\]/g, '<sup><a href="#ref-$1">[$1]</a></sup>')
      : withRel;
    return withCitations;
  })();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Article Content */}
        <article className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Article Header */}
            <div className="p-8 pb-6">
              <div className="flex items-center space-x-2 mb-4">
                {article.isFeatured && (
                  <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-full text-sm font-semibold">
                    FEATURED
                  </span>
                )}
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-semibold">
                  NEWS
                </span>
                {Array.isArray(article.topics) && article.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {article.topics.map((t) => (
                      <span
                        key={t}
                        className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm font-semibold"
                      >
                        {t.toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
                {article.title}
              </h1>

              {article.excerpt && (
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                  {article.excerpt}
                </p>
              )}

              <div className="flex items-center justify-between border-t border-b border-gray-200 dark:border-gray-700 py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-red-600 rounded-full flex items-center justify-center">
                      <Image
                        src="/logo.png"
                        alt="Daily Dog Logo"
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {article.author?.name || "Daily Dog Staff"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {article.author?.email || "staff@thedailydog.com"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <time
                    dateTime={article.publishedAt.toISOString()}
                    className="text-sm text-gray-500 dark:text-gray-400"
                  >
                    {article.publishedAt.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
              </div>
            </div>

            {/* Featured Image */}
            {article.imageUrl && (
              <div className="px-8 pb-6">
                <div className="relative w-full h-96 overflow-hidden rounded-lg">
                  <Image
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              </div>
            )}

            {/* Article Content */}
            <div className="px-8 pb-8">
              <div
                className="prose prose-lg max-w-none dark:prose-invert [&_p]:pb-3 prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20"
                dangerouslySetInnerHTML={{ __html: processedHtml }}
              />
            </div>

            {/* Source  Hidden 
            {article.sourceText && (
              <div className="mx-8 mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Source Material
                </h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {article.sourceText}
                </p>
              </div>
            )}
    */}
            {/* Social Sharing */}
            <div className="px-8 pb-8">
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Share this article:
                  </span>
                  <ShareBar url={articleUrl} title={article.title} />
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to Home
                </Link>
              </div>
            </div>
          </div>

          {/* Ad Space */}
          <div className="mt-8">
            <div className="bg-gray-100 dark:bg-gray-800 h-32 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600">
              <div className="text-center">
                <svg
                  className="w-8 h-8 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2"
                  />
                </svg>
                <p className="text-sm">Advertisement Space</p>
              </div>
            </div>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-8">
            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                  Related Articles
                </h3>
                <div className="space-y-4">
                  {relatedArticles.map((relatedArticle) => (
                    <Link
                      key={relatedArticle.id}
                      href={`/article/${relatedArticle.slug}`}
                      className="block group"
                    >
                      <div className="flex space-x-3">
                        {relatedArticle.imageUrl && (
                          <div className="flex-shrink-0 relative w-16 h-16">
                            <Image
                              src={relatedArticle.imageUrl}
                              alt={relatedArticle.title}
                              fill
                              className="object-cover rounded-lg"
                              sizes="64px"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2">
                            {relatedArticle.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {relatedArticle.publishedAt?.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Newsletter Signup */}
            <SubscriptionForm source="article" className="mb-6" />

            {/* Trending Topics */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                Trending Topics
              </h3>
              <div className="space-y-2">
                {[
                  "Politics",
                  "Economy",
                  "Culture",
                  "Opinion",
                  "Breaking News",
                ].map((topic) => (
                  <a
                    key={topic}
                    href="#"
                    className="block text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                  >
                    #{topic}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
