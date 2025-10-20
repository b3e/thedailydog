import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const topics: string[] = Array.isArray(data.topics)
      ? (data.topics as string[]).filter((t) => typeof t === "string" && t.trim().length > 0)
      : data.topic
      ? [String(data.topic)]
      : [];

    const article = await prisma.article.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        imageUrl: data.imageUrl || null,
        sourceText: data.sourceText || null,
        sourceImageUrl: data.sourceImageUrl || null,
        topics,
        isFeatured: data.isFeatured || false,
        publishedAt: data.publish ? new Date() : null,
        authorId: session.user.id,
      },
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
