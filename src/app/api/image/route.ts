import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const isDownload = searchParams.get("download") === "true";
  const filename = searchParams.get("filename") || "image.jpg";

  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    // Fetch the image from the external source with proper headers to avoid 403 Forbidden
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    
    const headers: Record<string, string> = {
      "Content-Type": isDownload ? "application/octet-stream" : (response.headers.get("Content-Type") || "image/jpeg"),
      "Cache-Control": "public, max-age=31536000",
    };

    if (isDownload) {
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
    }

    return new NextResponse(arrayBuffer, { headers });
  } catch (error) {
    console.error("Error proxying image:", error);
    return new NextResponse("Error fetching image", { status: 500 });
  }
}
