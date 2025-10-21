import { put } from "@vercel/blob";

export async function downloadAndSaveImage(
  imageUrl: string,
  filename: string
): Promise<string | null> {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error("Failed to fetch image:", response.statusText);
      return null;
    }

    // Get the image buffer
    const imageBuffer = await response.arrayBuffer();

    // Generate a unique filename with timestamp
    const timestamp = Date.now();
    const extension =
      imageUrl.includes(".jpg") || imageUrl.includes(".jpeg") ? ".jpg" : ".png";
    const uniqueFilename = `${filename}-${timestamp}${extension}`;

    // Upload to Vercel Blob storage
    const blob = await put(uniqueFilename, imageBuffer, {
      access: "public",
      contentType: extension === ".jpg" ? "image/jpeg" : "image/png",
    });

    console.log("Image uploaded to Vercel Blob:", blob.url);
    return blob.url;
  } catch (error) {
    console.error("Error downloading and saving image:", error);
    return null;
  }
}

export function generateImageFilename(title: string): string {
  // Convert title to a safe filename
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 50); // Limit length
}
