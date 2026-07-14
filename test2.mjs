import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const apiKey = envFile.split('GEMINI_API_KEY=')[1].split('\n')[0].trim();

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  tools: [{
    googleSearch: {}
  }]
});

async function run() {
  try {
    const result = await model.generateContent("What is the latest news today?");
    console.log("SUCCESS!");
    console.log(result.response.text());
  } catch (e) {
    console.error("FAILED:");
    console.error(e.message);
  }
}
run();
