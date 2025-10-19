import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await prisma.article.findMany({
    where: { publishedAt: { not: null } },
    select: { slug: true, updatedAt: true },
  });

  const articleUrls = articles.map((article) => ({
    url: `https://thedailydog.com/article/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: "https://thedailydog.com",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://thedailydog.com/admin",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    ...articleUrls,
  ];
}
