import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sourceText, sourceImageUrl } = await request.json();

    if (!sourceText) {
      return NextResponse.json(
        { error: "Source text is required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Generate article content using ChatGPT
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a conservative news writer for "The Daily Dog" - a patriotic American news outlet with the slogan "Guarding America's Values." 

Your task is to transform Facebook post content into professional, well-structured news articles that:
- Maintain a conservative perspective
- Use professional journalistic tone
- Include proper HTML formatting
- Are fact-based and objective
- Appeal to patriotic Americans
- Follow traditional news article structure

Format your response as JSON with these fields:
{
  "title": "Compelling headline (max 100 characters - keep it concise but descriptive)",
  "excerpt": "Brief summary (max 150 characters)",
  "content": "Full article in HTML format with proper paragraphs, headings, etc."
}

The content should be 3-5 paragraphs with proper HTML tags like <p>, <h2>, <h3>, etc.

If you cite facts or refer to external sources, include a References section at the end of the HTML with this exact structure so citations render properly:

<h2>References</h2>
<ol>
  <li id="ref-1"><a href="https://example.com" target="_blank" rel="noopener noreferrer">Source title 1</a></li>
  <li id="ref-2"><a href="https://example2.com" target="_blank" rel="noopener noreferrer">Source title 2</a></li>
</ol>

When you reference a source inline, use bracketed citation markers like [1], [2], etc., immediately after the relevant sentence. Do not use footnote symbols or unicode objects; use plain text markers like [1].`,
        },
        {
          role: "user",
          content: `Please transform this Facebook post into a professional news article:\n\n${sourceText}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error("No response from OpenAI");
    }

    let generatedData;
    try {
      generatedData = JSON.parse(response);
    } catch {
      // Fallback if JSON parsing fails
      generatedData = {
        title: extractTitleFromResponse(response),
        excerpt: extractExcerptFromResponse(response),
        content: response,
      };
    }

    // Ensure title doesn't exceed 100 characters
    let finalTitle = generatedData.title || "Breaking News Update";
    if (finalTitle.length > 100) {
      finalTitle = finalTitle.substring(0, 97) + "...";
    }

    return NextResponse.json({
      title: finalTitle,
      excerpt:
        generatedData.excerpt ||
        "Recent developments have sparked significant discussion and analysis.",
      content: generatedData.content || response,
      imageUrl: sourceImageUrl || null,
    });
  } catch (error) {
    console.error("Error generating article:", error);
    return NextResponse.json(
      { error: "Failed to generate article" },
      { status: 500 }
    );
  }
}

function extractTitleFromResponse(response: string): string {
  const lines = response.split("\n");
  const firstLine = lines[0]?.trim();
  if (firstLine && firstLine.length > 0) {
    let title = firstLine.replace(/^#+\s*/, ""); // Remove markdown headers
    if (title.length > 100) {
      title = title.substring(0, 97) + "...";
    }
    return title;
  }
  return "Breaking News Update";
}

function extractExcerptFromResponse(response: string): string {
  const paragraphs = response.split("\n\n");
  const firstParagraph = paragraphs[0]?.replace(/<[^>]*>/g, "").trim(); // Remove HTML tags
  if (firstParagraph && firstParagraph.length > 20) {
    return (
      firstParagraph.substring(0, 150) +
      (firstParagraph.length > 150 ? "..." : "")
    );
  }
  return "Recent developments have sparked significant discussion and analysis.";
}
