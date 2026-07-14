import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(request: Request) {
  let aiEngine = "gemini";
  try {
    if (!genAI || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json(
        { error: "Please add a valid Gemini API Key to the .env.local file to use this feature." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { topic, slideCount = 5 } = body;
    aiEngine = body.aiEngine || "gemini";

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      tools: [{ googleSearch: {} } as any] 
    });

    const prompt = `
      You are an expert researcher and professional presentation creator. 
      Your task is to create a highly informative, thoroughly researched ${slideCount}-slide presentation based on the following instructions from the user:
      
      USER INSTRUCTIONS / TOPIC:
      "${topic}"
      
      REQUIREMENTS:
      1. Exactly ${slideCount} slides must be generated.
      2. CRITICAL FACT-CHECKING RULES: ${aiEngine === "gemini" 
        ? 'You MUST prioritize absolute factual accuracy. DO NOT hallucinate. If you are unsure of a specific fact, explicitly state "Information not available" or leave it out.'
        : 'Do your best to provide accurate, general information based on your training data. Do NOT use the phrase "Information not available". If specific exact dates or statistics are unknown to you, describe the topic generally instead.'}
      3. If the user provided specific points, sections, or information they want included, you MUST include them and expand upon them with accurate research.
      4. Make the content professional, engaging, and strictly fact-based.
      5. The first slide should be an Introduction/Title slide.
      6. The final slide should be a Conclusion/Summary slide.
      7. CRITICAL: Each slide must have at least 4 to 5 bullet points. Format EVERY bullet point as "Point Name: Explanation". The explanation for each point must be strictly limited to exactly one short line or sentence.
      
      Return your response in two parts:
      
      PART 1: FACT-CHECKING ANALYSIS
      Write a brief paragraph explicitly double-checking the names, dates, and historical facts you are about to use. ${aiEngine === "gemini" ? "Verify that they are 100% accurate based on your Google Search grounding." : "Rely on your internal knowledge base to ensure complete accuracy."}
      
      PART 2: THE PRESENTATION JSON
      After your analysis, output ONLY a valid JSON array containing the slides. Do not include markdown code blocks (\`\`\`json).
      The JSON array should contain objects with the following structure:
      [
        {
          "title": "Slide Title",
          "subtitle": "Optional slide subtitle",
          "content": [
            "Topic One: An explanation that is exactly one short line.", 
            "Topic Two: Another explanation restricted to just one single sentence.",
            "Topic Three: A third point that also strictly follows the one-line rule.",
            "Topic Four: The fourth required point to ensure there are at least 4 to 5 points."
          ],
          "speakerNotes": "Comprehensive speaker notes explaining the context and research behind this slide.",
          "imageKeyword": "A single, highly relevant search keyword (1-2 words max) to find a real stock photo for this slide. E.g., 'technology', 'hospital', 'finance'"
        }
      ]
    `;

    let text = "";

    if (aiEngine === "groq") {
      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey) {
        return NextResponse.json(
          { error: "Please add your GROQ_API_KEY to the .env.local file to use Groq." },
          { status: 400 }
        );
      }
      
      const groq = new OpenAI({ apiKey: groqKey, baseURL: "https://api.groq.com/openai/v1" });
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile", // Fast and highly capable
        messages: [
          { role: "system", content: "You are a professional presentation generator." },
          { role: "user", content: prompt }
        ],
      });
      
      text = response.choices[0].message.content || "";
    } else if (aiEngine === "chatgpt") {
      const openAiKey = process.env.OPENAI_API_KEY;
      if (!openAiKey) {
        return NextResponse.json(
          { error: "Please add your OPENAI_API_KEY to the .env.local file to use ChatGPT." },
          { status: 400 }
        );
      }
      
      const openai = new OpenAI({ apiKey: openAiKey });
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Fast, highly capable, and cheap
        messages: [
          { role: "system", content: "You are a professional presentation generator." },
          { role: "user", content: prompt }
        ],
      });
      
      text = response.choices[0].message.content || "";
    } else {
      // Use Gemini
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        tools: [{ googleSearch: {} } as any] 
      });

      let retries = 1; // Try once, then retry once if rate limited
      let currentModel = model;
      
      while (true) {
        try {
          const result = await currentModel.generateContent(prompt);
          const response = await result.response;
          text = response.text();
          break; // Success!
        } catch (err: any) {
          if (retries > 0 && err.message && (err.message.includes("429") || err.message.includes("503") || err.message.includes("quota"))) {
            console.log("Rate limited by Gemini with Search Grounding. Retrying immediately without Search Grounding to save tokens...");
            // Fallback: If Search Grounding is causing massive token limits or strict 429s, we downgrade to the base model instantly
            currentModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            retries--;
          } else {
            console.log("Gemini failed completely. Attempting to fall back to Groq...");
            const groqKey = process.env.GROQ_API_KEY;
            if (groqKey) {
              const groq = new OpenAI({ apiKey: groqKey, baseURL: "https://api.groq.com/openai/v1" });
              const groqResponse = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                  { role: "system", content: "You are a professional presentation generator." },
                  { role: "user", content: prompt }
                ],
              });
              text = groqResponse.choices[0].message.content || "";
              break;
            } else {
              throw err; // Out of retries and no Groq key, fatal error
            }
          }
        }
      }
    }
    
    // Clean up potential markdown formatting from Gemini response
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    try {
      let parsedSlides;
      
      // Try extracting an array first
      const arrayMatch = text.match(/\[[\s\S]*\]/);
      const objectMatch = text.match(/\{[\s\S]*\}/);
      
      if (arrayMatch) {
        try {
          parsedSlides = JSON.parse(arrayMatch[0]);
        } catch (e) {
          // fallback to object match if array match fails to parse (e.g. malformed inside object)
          if (objectMatch) {
            const obj = JSON.parse(objectMatch[0]);
            parsedSlides = obj.slides || obj;
          } else {
            throw e;
          }
        }
      } else if (objectMatch) {
        const obj = JSON.parse(objectMatch[0]);
        parsedSlides = obj.slides || obj;
      } else {
        throw new Error("No JSON structure found in response");
      }
      
      // Ensure it's an array
      if (!Array.isArray(parsedSlides)) {
        throw new Error("Parsed result is not an array");
      }

      return NextResponse.json({ slides: parsedSlides });
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", text, parseError);
      return NextResponse.json(
        { error: "Failed to generate valid presentation structure." },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("Error generating presentation:", error);
    
    // Pass along API Key invalid errors specifically if they occur
    if (error.message && error.message.includes("API key not valid")) {
       return NextResponse.json(
        { error: "The provided Gemini API Key is invalid. Please check your .env.local file." },
        { status: 400 }
      );
    }

    if (error.message && (error.message.includes("503") || error.message.includes("high demand") || error.message.includes("overloaded"))) {
       return NextResponse.json(
        { error: "The AI service is currently experiencing high demand. Please wait a moment and try again." },
        { status: 503 }
      );
    }

    if (error.message && (error.message.includes("429") || error.message.includes("quota"))) {
       const providerName = aiEngine === "chatgpt" ? "OpenAI" : aiEngine === "groq" ? "Groq" : "Gemini AI";
       return NextResponse.json(
        { error: `You have reached the rate limit or quota for ${providerName}. Please check your billing details or wait a minute before trying again.` },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "An error occurred while generating the presentation. Details: " + (error?.message || error?.toString()) },
      { status: 500 }
    );
  }
}
