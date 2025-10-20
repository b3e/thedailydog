import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await request.json();

    // Verify the user exists in the database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      console.error("User not found in database:", session.user.id);
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    const topics: string[] = Array.isArray(data.topics)
      ? (data.topics as string[]).filter(
          (t) => typeof t === "string" && t.trim().length > 0
        )
      : data.topic
      ? [String(data.topic)]
      : [];

    // Generate unique slug if it already exists (excluding current article)
    let slug = data.slug;
    let counter = 1;
    while (await prisma.article.findFirst({ where: { slug, NOT: { id } } })) {
      slug = `${data.slug}-${counter}`;
      counter++;
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        title: data.title,
        slug: slug,
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
    console.error("Error updating article:", error);
    return NextResponse.json(
      {
        error: "Failed to update article",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Optional: restrict to admins
    // if (session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    // Delete related views first, then the article
    await prisma.view.deleteMany({ where: { articleId: id } });
    await prisma.article.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
