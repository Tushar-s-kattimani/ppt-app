import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  tools: [{
    googleSearch: {}
  }]
});

async function run() {
  try {
    const result = await model.generateContent("Who founded Anthropic and when?");
    console.log(result.response.text());
  } catch (e) {
    console.error(e);
  }
}
run();
