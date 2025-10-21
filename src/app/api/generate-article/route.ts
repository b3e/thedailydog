import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";
import { downloadAndSaveImage, generateImageFilename } from "@/lib/imageUtils";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure API route timeout
export const maxDuration = 60; // 60 seconds timeout for Vercel
export const dynamic = "force-dynamic";

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

    // Generate article content using ChatGPT with timeout
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a conservative news writer for "The Daily Dog" - a patriotic American news outlet with the slogan "Guarding America's Values." 

Transform Facebook post content into professional news articles that:
- Maintain a conservative perspective
- Use professional journalistic tone
- Include proper HTML formatting
- Are fact-based and objective
- Include specific facts, figures, and concrete details when possible

Format your response as JSON with these fields:
{
  "title": "Compelling headline (max 70 characters)",
  "excerpt": "Brief summary (max 150 characters)",
  "content": "Full article body in HTML format with proper paragraphs",
  "suggestedImageUrl": "URL of a suitable image (or null if no good image found)"
}

For suggestedImageUrl: Suggest a DIFFERENT image URL from reliable sources (Reuters, AP, Getty Images, government sites) that would be appropriate for this story. Do NOT suggest the same source image URL. If you cannot find a suitable alternative, set it to null.

The content should be 4-6 paragraphs with proper HTML tags. Include specific facts and figures throughout. Do not include the title or excerpt in the content section.`,
          },
          {
            role: "user",
            content: `Please transform this Facebook post into a professional news article:\n\n${sourceText}${
              sourceImageUrl ? `\n\nSource Image URL: ${sourceImageUrl}` : ""
            }\n\nIf a source image is provided, consider it when writing the article. For the suggestedImageUrl field, suggest a DIFFERENT image URL from a reliable news source (like Reuters, AP, Getty Images, government sites, or official accounts) that would be appropriate for this story. Do NOT suggest the same source image URL. If you cannot find a suitable alternative image URL, set suggestedImageUrl to null.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("OpenAI API timeout after 45 seconds")),
          45000
        )
      ),
    ]);

    console.log("OpenAI API call completed successfully");

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error("No response from OpenAI");
    }

    console.log("OpenAI response length:", response.length);
    console.log("OpenAI response preview:", response.substring(0, 200) + "...");

    let generatedData;
    try {
      // Clean the response by removing markdown code blocks if present
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith("```json")) {
        cleanResponse = cleanResponse
          .replace(/^```json\s*/, "")
          .replace(/\s*```$/, "");
      } else if (cleanResponse.startsWith("```")) {
        cleanResponse = cleanResponse
          .replace(/^```\s*/, "")
          .replace(/\s*```$/, "");
      }

      generatedData = JSON.parse(cleanResponse);
      console.log("Successfully parsed JSON response");
      console.log("AI suggested image URL:", generatedData.suggestedImageUrl);
    } catch (parseError) {
      console.log("JSON parsing failed, using fallback:", parseError);
      console.log("Raw response:", response.substring(0, 500));
      // Fallback if JSON parsing fails
      generatedData = {
        title: extractTitleFromResponse(response),
        excerpt: extractExcerptFromResponse(response),
        content: response,
        suggestedImageUrl: null,
      };
    }

    // Ensure title doesn't exceed 70 characters
    let finalTitle = generatedData.title || "Breaking News Update";
    if (finalTitle.length > 70) {
      finalTitle = finalTitle.substring(0, 67) + "...";
    }

    // Always generate a new image using DALL-E
    let finalImageUrl = null;

    try {
      console.log("Generating new image with DALL-E...");
      const imageResponse = await Promise.race([
        openai.images.generate({
          model: "dall-e-3",
          prompt: `Professional news photo for article: "${finalTitle}". Conservative news style, high quality, photojournalistic.`,
          size: "1024x1024",
          quality: "standard",
          n: 1,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("DALL-E API timeout after 30 seconds")),
            30000
          )
        ),
      ]);

      if (imageResponse.data && imageResponse.data[0]?.url) {
        const dallEImageUrl = imageResponse.data[0].url;
        console.log("DALL-E generated image URL:", dallEImageUrl);

        // Download and save the image to our server with timeout
        const filename = generateImageFilename(finalTitle);
        const savedImageUrl = (await Promise.race([
          downloadAndSaveImage(dallEImageUrl, filename),
          new Promise<never>((_, reject) =>
            setTimeout(
              () =>
                reject(new Error("Image download timeout after 20 seconds")),
              20000
            )
          ),
        ])) as string | null;

        if (savedImageUrl) {
          finalImageUrl = savedImageUrl;
          console.log("Image saved locally:", finalImageUrl);
        } else {
          console.log("Failed to save image locally, using original URL");
          finalImageUrl = dallEImageUrl;
        }
      }
    } catch (imageError) {
      console.log("DALL-E image generation failed:", imageError);
      // Fallback to source image if DALL-E fails
      finalImageUrl = sourceImageUrl || null;

      // If it's a timeout error, provide a more specific message
      if (
        imageError instanceof Error &&
        imageError.message.includes("timeout")
      ) {
        console.log("Image generation timed out, using fallback");
      }
    }

    console.log("Final image URL being returned:", finalImageUrl);

    return NextResponse.json({
      title: finalTitle,
      excerpt:
        generatedData.excerpt ||
        "Recent developments have sparked significant discussion and analysis.",
      content: generatedData.content || response,
      imageUrl: finalImageUrl,
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

    // Handle timeout errors
    if (error instanceof Error && error.message.includes("timeout")) {
      return NextResponse.json(
        {
          error: "Request timed out. Please try again with shorter content.",
          details:
            "The AI generation process took too long. Try reducing the source text length.",
        },
        { status: 408 }
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
