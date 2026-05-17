import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

// Manually parse .env file
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        process.env[key] = value.trim();
      }
    });
  }
}

loadEnv();

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';

console.log('Testing with API Key:', apiKey ? `${apiKey.substring(0, 15)}...` : 'undefined');
console.log('Model Name:', modelName);

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY is not defined in .env');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: 'Hello, respond with exactly one word: "Success"',
    });
    console.log('API Response text:', response.text);
    console.log('API Response usageMetadata:', response.usageMetadata);
  } catch (error: any) {
    console.error('API Error details:');
    console.error('- Message:', error.message);
    console.error('- Status/StatusCode:', error.status || error.statusCode);
    console.error('- Raw Error Object:', JSON.stringify(error, null, 2));
  }
}

test();
