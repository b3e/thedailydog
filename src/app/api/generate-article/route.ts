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

    console.log("Starting OpenAI API call...");
    console.log("Source text length:", sourceText.length);

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
  "title": "Compelling headline (max 70 characters - keep it concise but descriptive)",
  "excerpt": "Brief summary (max 150 characters)",
  "content": "Full article body in HTML format with proper paragraphs, headings, etc."
}

IMPORTANT: The content field should contain ONLY the article body paragraphs. Do NOT repeat the title or excerpt in the content. Start directly with the main article content using <p> tags.

The content should be 3-5 paragraphs with proper HTML tags like <p>, <h2>, <h3>, etc. Do not include the title or excerpt in the content section.

IMPORTANT: Only include a References section if you are actually citing specific external sources with real URLs. Do NOT include example references or placeholder URLs. If you don't have specific sources to cite, do not include a References section at all.

When you do cite real sources, use this format:
- In the text: Use bracketed citation markers like [1], [2], etc., immediately after the relevant sentence
- At the end: Include a References section with this structure:
<h2>References</h2>
<ol>
  <li id="ref-1"><a href="https://actual-source-url.com" target="_blank" rel="noopener noreferrer">Actual Source Title</a></li>
</ol>

Do not use example.com or placeholder URLs. Only cite sources you can verify exist.`,
        },
        {
          role: "user",
          content: `Please transform this Facebook post into a professional news article:\n\n${sourceText}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    console.log("OpenAI API call completed successfully");

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error("No response from OpenAI");
    }

    console.log("OpenAI response length:", response.length);
    console.log("OpenAI response preview:", response.substring(0, 200) + "...");

    let generatedData;
    try {
      generatedData = JSON.parse(response);
      console.log("Successfully parsed JSON response");
    } catch (parseError) {
      console.log("JSON parsing failed, using fallback:", parseError);
      // Fallback if JSON parsing fails
      generatedData = {
        title: extractTitleFromResponse(response),
        excerpt: extractExcerptFromResponse(response),
        content: response,
      };
    }

    // Ensure title doesn't exceed 70 characters
    let finalTitle = generatedData.title || "Breaking News Update";
    if (finalTitle.length > 70) {
      finalTitle = finalTitle.substring(0, 67) + "...";
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
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle specific OpenAI errors
    if (error instanceof Error && error.message.includes("429")) {
      return NextResponse.json(
        {
          error:
            "OpenAI API quota exceeded. Please check your billing details.",
          details:
            "You have exceeded your current OpenAI API quota. Please add credits to your account.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate article",
        details: error instanceof Error ? error.message : "Unknown error",
      },
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
