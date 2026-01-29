// Test script to list available Gemini models
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
    console.error('❌ GOOGLE_GEMINI_API_KEY not found in environment');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

console.log('🔍 Testing available models...\n');

const modelsToTest = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest'
];

for (const modelName of modelsToTest) {
    try {
        console.log(`Testing: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello');
        const response = await result.response;
        const text = response.text();
        console.log(`✅ ${modelName} - WORKS! Response: ${text.substring(0, 50)}...\n`);
        break; // Found working model, exit
    } catch (error) {
        console.log(`❌ ${modelName} - Failed: ${error.message}\n`);
    }
}
