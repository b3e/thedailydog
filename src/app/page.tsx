import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Article } from "@prisma/client";

type HomeData = {
  featured: Article[];
  latest: Article[];
  trending: Article[];
};

async function getData(topic?: string): Promise<HomeData> {
  const [featured, latest, trending] = await Promise.all([
    prisma.article.findMany({
      where: {
        isFeatured: true,
        publishedAt: { not: null },
        ...(topic ? { topics: { has: topic } } : {}),
      },
      orderBy: { publishedAt: "desc" },
      take: 4,
    }),
    prisma.article.findMany({
      where: {
        publishedAt: { not: null },
        ...(topic ? { topics: { has: topic } } : {}),
      },
      orderBy: { publishedAt: "desc" },
      take: 12,
    }),
    (async (): Promise<Article[]> =>
      prisma.view
        .groupBy({
          by: ["articleId"],
          where: {
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
          _count: { _all: true },
        })
        .then(async (groups: Article[]) => {
          // Sort by count descending
          const sortedGroups = groups.sort(
            (a, b) => b._count._all - a._count._all
          );
          const topArticleIds = sortedGroups
            .slice(0, 6)
            .map((g) => g.articleId);

          if (topArticleIds.length === 0) {
            return [];
          }

          const articles = await prisma.article.findMany({
            where: {
              id: { in: topArticleIds },
              ...(topic ? { topics: { has: topic } } : {}),
            },
          });

          // Create a map for sorting
          const countMap = new Map(
            sortedGroups.map((g) => [g.articleId, g._count._all])
          );
          return articles.sort(
            (a, b) => (countMap.get(b.id) || 0) - (countMap.get(a.id) || 0)
          );
        }))(),
  ]);
  return { featured, latest, trending };
}

export default async function Home({
  searchParams,
}: {
  searchParams: { topic?: string };
}) {
  const { topic } = searchParams;
  const { featured, latest, trending } = await getData(topic);
  const hero = featured[0] ?? latest[0];
  const subFeatured = featured[0] ? featured.slice(1) : latest.slice(1, 4);

  return (
    <div className="space-y-8">
      {/* Topic header */}
      {topic && (
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 mb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white">
              {topic}
            </h1>
          </div>
        </div>
      )}
      {/* Hero Section */}
      {hero && (
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900 bg-[url(/daily-d-bg.jpg)] bg-cover text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    BREAKING
                  </span>
                  <span className="text-blue-200 text-sm">
                    {hero.publishedAt?.toLocaleDateString()}
                  </span>
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  {hero.title}
                </h1>
                {hero.excerpt && (
                  <p className="text-xl text-blue-100 leading-relaxed">
                    {hero.excerpt}
                  </p>
                )}
                <Link
                  href={`/article/${hero.slug}`}
                  className="inline-flex items-center px-8 py-4 bg-white text-[#487ca7] font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  Read Full Story
                  <svg
                    className="ml-2 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
              </div>
              {hero.imageUrl && (
                <div className="relative">
                  <img
                    src={hero.imageUrl}
                    alt={hero.title}
                    className="w-full h-96 object-cover rounded-xl shadow-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Featured Articles Grid */}
        {subFeatured.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Featured Stories
              </h2>
              <div className="h-px bg-gradient-to-r from-blue-600 bg-cover to-transparent flex-1 ml-6"></div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {subFeatured.map((article) => (
                <article
                  key={article.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-200"
                >
                  {article.imageUrl && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-semibold">
                        FEATURED
                      </span>
                      {Array.isArray(article.topics) &&
                        article.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {article.topics.map((t) => (
                              <span
                                key={t}
                                className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded text-xs font-semibold"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        {article.publishedAt?.toLocaleDateString()}
                      </span>
                    </div>
                    <Link href={`/article/${article.slug}`}>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                        {article.title}
                      </h3>
                    </Link>
                    {article.excerpt && (
                      <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
                        {article.excerpt}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Trending Section */}
        {trending.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <svg
                  className="w-6 h-6 text-red-500"
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
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Trending Now
                </h2>
                <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-full text-sm font-semibold">
                  24h
                </span>
              </div>
              <div className="h-px bg-gradient-to-r from-red-500 to-transparent flex-1 ml-6"></div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trending.map((article, index) => (
                <article
                  key={article.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                        <span className="text-red-600 dark:text-red-400 font-bold text-sm">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/article/${article.slug}`}>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 line-clamp-2">
                          {article.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {article.publishedAt?.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Latest Articles */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Latest News
            </h2>
            <div className="h-px bg-gradient-to-r from-gray-400 to-transparent flex-1 ml-6"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {latest.slice(0, 6).map((article) => (
              <article
                key={article.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200 group"
              >
                {article.imageUrl && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        {article.publishedAt?.toLocaleDateString()}
                      </span>
                      {Array.isArray(article.topics) &&
                        article.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {article.topics.map((t) => (
                              <span
                                key={t}
                                className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded text-xs font-semibold"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>
                    {article.isFeatured && (
                      <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-xs font-semibold">
                        FEATURED
                      </span>
                    )}
                  </div>
                  <Link href={`/article/${article.slug}`}>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 line-clamp-2">
                      {article.title}
                    </h3>
                  </Link>
                  {article.excerpt && (
                    <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
                      {article.excerpt}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900 rounded-2xl p-8 text-white text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Stay Informed</h2>
            <p className="text-blue-100 mb-6">
              Get the latest conservative news and commentary delivered to your
              inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white border-2 border-gray-300 dark:border-gray-600"
              />
              <button className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200">
                Subscribe
              </button>
            </div>
          </div>
        </section>

        {/* Ad Space */}
        <div className="mt-16 mb-8">
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
      </div>
    </div>
  );
}
