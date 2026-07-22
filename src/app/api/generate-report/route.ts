import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

// Gemini API is initialized dynamically per request for key rotation

export async function POST(request: Request) {
  let aiEngine = "gemini";
  try {
    // Read and rotate Gemini API keys
    const apiKeysString = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
    const apiKeys = apiKeysString.split(',').map(k => k.trim()).filter(Boolean);
    const selectedApiKey = apiKeys.length > 0 ? apiKeys[Math.floor(Math.random() * apiKeys.length)] : null;
    const genAI = selectedApiKey && selectedApiKey !== "your_gemini_api_key_here" ? new GoogleGenerativeAI(selectedApiKey) : null;

    if (!genAI) {
      return NextResponse.json(
        { error: "Please add a valid Gemini API Key to the .env.local file to use this feature." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { topic, reportPageLimit } = body;
    aiEngine = body.aiEngine || "gemini";

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    let companyDomain = "";
    if (genAI && aiEngine === "gemini") {
      try {
        const preFlightModel = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash",
          tools: [{ googleSearch: {} } as any] 
        });
        const preFlightPrompt = `Identify the official company domain/URL for the following topic: "${topic}". Return ONLY the raw domain name (e.g., example.com) and absolutely nothing else. If you cannot find one or if the topic is not a company, reply with 'NOT_FOUND'.`;
        const preFlightResult = await preFlightModel.generateContent(preFlightPrompt);
        const domainResponse = await preFlightResult.response;
        const text = domainResponse.text().trim();
        // Basic validation that it looks somewhat like a domain
        if (text && text !== "NOT_FOUND" && !text.includes(" ")) {
          companyDomain = text;
        }
      } catch (err) {
        console.warn("Pre-flight domain search failed:", err);
      }
    }

    const pageLimitInstruction = reportPageLimit 
      ? `LENGTH REQUIREMENT: You MUST generate enough highly detailed, exhaustive content so that the final report spans approximately ${reportPageLimit} pages. Provide extremely deep analysis, numerous examples, and comprehensive elaboration in every section to reach this exact length target.`
      : `LENGTH REQUIREMENT: Write a comprehensive and detailed report. Expand on the points to provide a thorough analysis.`;

    const prompt = `
      You are an expert business analyst and professional report writer.
      Your task is to create a highly comprehensive, thoroughly researched business report based on the following topic from the user:
      
      USER INSTRUCTIONS / TOPIC:
      "${topic}"
      
      CRITICAL INSTRUCTION FOR RESEARCH:
      You MUST use your built-in Google Search tool to comprehensively research the topic ("${topic}") BEFORE generating the report. 
      ${companyDomain ? `The official website for this topic/company is ${companyDomain}. You MUST specifically use your Google Search tool with the \`site:${companyDomain}\` operator to deeply search their official web pages for products, history, financial data, and mission before writing the report. You should also search broadly for recent news.` : `Specifically, fetch the most up-to-date and minute details regarding company history, recent news, financial data, and specific facts. Do NOT rely solely on your internal knowledge. If the topic is a specific brand or company (e.g., a local business), you must prioritize live web data to ensure 100% accuracy.`}
      
      ${pageLimitInstruction}
      
      REQUIREMENTS:
      You MUST strictly follow this exact structure for the report. Use Markdown formatting for headers, bullet points, and bold text. Do not add or remove sections. If a section is not applicable, write "N/A" or "Not Applicable" under that section header, but keep the header.

      ## 1. Executive Summary
      * Overview of the report
      * Purpose of the study
      * Key findings
      * Major recommendations
      * Conclusion
      
      ---
      
      ## 2. Introduction
      * Background of the topic
      * Importance of the study
      * Problem statement
      * Scope of the study
      * Need for the study
      
      ---
      
      ## 3. Objectives of the Study
      * Primary objective
      * Secondary objectives
      
      ---
      
      ## 4. Research Methodology
      * Research design
      * Research approach
      * Data collection methods
        * Primary data
        * Secondary data
      * Sampling method
      * Sample size
      * Data analysis tools
      * Limitations of the methodology
      
      ---
      
      ## 5. Literature Review
      * Previous studies
      * Research gap
      * Key theories and concepts
      * Summary of literature
      
      ---
      
      ## 6. Industry Overview *(if applicable)*
      * Industry background
      * Market size
      * Industry trends
      * Growth drivers
      * Challenges
      * Opportunities
      * Future outlook
      
      ---
      
      ## 7. Company/Organization Profile *(if applicable)*
      * Company introduction
      * History
      * Vision & Mission
      * Products/Services
      * Organizational structure
      * Financial overview
      * Competitors
      * Market position
      
      ---
      
      ## 8. Conceptual Framework / Theoretical Background
      * Definitions of key concepts
      * Relevant business models
      * Frameworks used (SWOT, PESTLE, Porter's Five Forces, etc.)
      
      ---
      
      # 9. Data Analysis & Interpretation *(Core Section)*
      ### 9.1 Data Collection Overview
      ### 9.2 Analysis of Findings
      * Tables
      * Charts
      * Graphs
      * Statistical analysis
      ### 9.3 Discussion
      * Interpretation of results
      * Comparison with previous studies
      * Business implications
      
      ---
      
      # 10. Business Analysis *(Choose relevant tools based on the topic)*
      * SWOT Analysis
      * PESTLE Analysis
      * Porter's Five Forces
      * Value Chain Analysis
      * BCG Matrix
      * Ansoff Matrix
      * Business Model Canvas
      * Financial Ratio Analysis
      * Risk Analysis
      * Competitor Analysis (CRITICAL: Provide extreme detail here. Use bullet points for each major competitor. Explicitly detail their estimated market share, key strengths/weaknesses, pricing strategy, and market positioning.)
      * Customer Analysis
      
      ---
      
      # 11. Findings
      Present the major observations.
      
      ---
      
      # 12. Recommendations
      Provide actionable suggestions (Strategic, Operational, Marketing, Financial, Technology).
      
      ---
      
      # 13. Conclusion
      * Summary of the study
      * Achievement of objectives
      * Overall conclusion
      * Key takeaways
      
      ---
      
      # 14. Limitations of the Study
      
      ---
      
      # 15. Future Scope
      * Opportunities for future research
      * Suggested improvements
      * Areas for further study
      
      ---
      
      # 16. References
      Use a consistent citation style. MUST format this section as a bulleted list using the point symbol. Use this exact format for each item: "- **[Main Subject/Title]**: [Citation details...]". Do not write this as a paragraph.
      
      ---
      
      # 17. Appendix
      Include supporting materials such as questionnaires or data tables if relevant.

      CRITICAL INSTRUCTIONS:
      - Write detailed, professional content for each bullet point within the sections.
      - Ensure your response is pure Markdown text that directly starts with "## 1. Executive Summary".
      - DO NOT enclose the output in \`\`\`markdown or \`\`\` code blocks.
      - Make the report expansive, detailed, and highly professional.
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
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a professional report generator." },
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
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a professional report generator." },
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

      let retries = 1;
      let currentModel = model;
      
      while (true) {
        try {
          const result = await currentModel.generateContent(prompt);
          const response = await result.response;
          text = response.text();
          break; // Success!
        } catch (err: any) {
          if (retries > 0 && err.message && (err.message.includes("429") || err.message.includes("503") || err.message.includes("quota"))) {
            console.log("Rate limited by Gemini. Retrying without Search Grounding to save tokens...");
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
                  { role: "system", content: "You are a professional report generator." },
                  { role: "user", content: prompt }
                ],
              });
              text = groqResponse.choices[0].message.content || "";
              break;
            } else {
              throw err; 
            }
          }
        }
      }
    }
    
    // Clean up potential markdown formatting from LLM response (in case it ignores instructions)
    if (text.startsWith("```markdown")) {
        text = text.replace(/^```markdown\n/, "").replace(/\n```$/, "");
    }
    if (text.startsWith("```")) {
        text = text.replace(/^```\n/, "").replace(/\n```$/, "");
    }

    return NextResponse.json({ report: text });

  } catch (error: any) {
    console.error("Error generating report:", error);
    
    if (error.message && error.message.includes("API key not valid")) {
       return NextResponse.json(
        { error: "The provided API Key is invalid. Please check your .env.local file." },
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
      { error: "An error occurred while generating the report. Details: " + (error?.message || error?.toString()) },
      { status: 500 }
    );
  }
}
