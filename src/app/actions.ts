"use server";

export async function checkOpenAIKey() {
  return !!process.env.OPENAI_API_KEY;
}

export async function checkGroqKey() {
  return !!process.env.GROQ_API_KEY;
}
