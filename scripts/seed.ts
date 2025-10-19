import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@thedailydog.com" },
    update: {},
    create: {
      email: "admin@thedailydog.com",
      name: "Admin User",
      passwordHash: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Created admin user:", admin.email);

  // Create sample articles
  const sampleArticles = [
    {
      title: "Breaking: Major Policy Announcement Shakes Washington",
      slug: "breaking-major-policy-announcement-shakes-washington",
      excerpt:
        "A significant policy change announced today has sent shockwaves through the nation's capital.",
      content:
        "<p>In a stunning development that has caught many by surprise, a major policy announcement was made today that could reshape the political landscape for years to come.</p><p>The announcement, which came during a high-profile press conference, represents a significant shift in approach that has been months in the making behind closed doors.</p><p>Political analysts are already weighing in on the potential implications, with some calling it a game-changer while others remain cautious about the long-term effects.</p>",
      imageUrl:
        "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&h=400&fit=crop",
      sourceText:
        "Just shared this important update on our Facebook page. The response has been overwhelming!",
      isFeatured: true,
      publishedAt: new Date(),
      authorId: admin.id,
    },
    {
      title: "Economic Indicators Show Promising Trends",
      slug: "economic-indicators-show-promising-trends",
      excerpt:
        "Latest economic data reveals positive signals for the nation's financial outlook.",
      content:
        "<p>The latest economic indicators released this week paint an encouraging picture for the nation's economic future.</p><p>Key metrics including employment rates, consumer confidence, and manufacturing output all show positive trends that suggest a robust recovery is underway.</p><p>Economists are cautiously optimistic about these developments, though they emphasize the need for continued monitoring of global economic conditions.</p>",
      imageUrl:
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop",
      sourceText:
        "Shared this economic update on Facebook. Great discussion in the comments!",
      isFeatured: false,
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      authorId: admin.id,
    },
    {
      title: "Local Community Initiative Gains National Attention",
      slug: "local-community-initiative-gains-national-attention",
      excerpt:
        "A grassroots effort in a small town has captured the imagination of communities nationwide.",
      content:
        "<p>What started as a local initiative in a small Midwestern town has now gained national recognition for its innovative approach to community building.</p><p>The program, which focuses on bringing neighbors together through shared activities and mutual support, has seen remarkable success in its first year of operation.</p><p>Organizers hope that their model can be replicated in other communities across the country, potentially creating a ripple effect of positive change.</p>",
      imageUrl:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=400&fit=crop",
      sourceText:
        "This heartwarming story was shared on our Facebook page and got amazing engagement!",
      isFeatured: false,
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      authorId: admin.id,
    },
  ];

  for (const articleData of sampleArticles) {
    const article = await prisma.article.upsert({
      where: { slug: articleData.slug },
      update: {},
      create: articleData,
    });
    console.log("Created article:", article.title);
  }

  // Create some sample views for trending functionality
  const articles = await prisma.article.findMany();
  for (let i = 0; i < 50; i++) {
    const randomArticle = articles[Math.floor(Math.random() * articles.length)];
    const randomHoursAgo = Math.floor(Math.random() * 24);

    await prisma.view.create({
      data: {
        articleId: randomArticle.id,
        ipHash: `user_${i}`,
        userAgent: "Sample User Agent",
        createdAt: new Date(Date.now() - randomHoursAgo * 60 * 60 * 1000),
      },
    });
  }

  console.log("Created sample views for trending functionality");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
