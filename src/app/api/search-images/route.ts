import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing search query" }, { status: 400 });
  }

  try {
    // Generate 10 distinct, high-quality AI images related EXACTLY to the topic
    const images: { id: string; url: string; title: string }[] = [];
    
    // Different visual styles to give the user variety
    const styles = [
      "clean professional corporate stock photography high quality",
      "modern minimal elegant presentation background",
      "cinematic lighting photorealistic 8k",
      "abstract subtle geometric background",
      "bright airy office environment stock photo",
      "futuristic sleek technology concept art",
      "warm inviting natural light photography",
      "dramatic professional studio lighting",
      "minimalist flat lay design",
      "vibrant colorful dynamic composition"
    ];

    for (let i = 0; i < 10; i++) {
      const seed = Math.floor(Math.random() * 10000000);
      const fullPrompt = `${query} ${styles[i]}`;
      const encodedPrompt = encodeURIComponent(fullPrompt);
      const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true&seed=${seed}`;
      
      images.push({
        id: `img_${i}_${seed}`,
        url: url,
        title: `${query} - Variation ${i + 1}`
      });
    }

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Image search error:", error);
    return NextResponse.json({ error: "Failed to generate images" }, { status: 500 });
  }
}
