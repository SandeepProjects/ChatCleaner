import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limit: 20 requests per IP per hour for the cleaning API
const rateLimitHour = parseInt(process.env.RATE_LIMIT_PER_HOUR || '20', 10);
const cleanLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: rateLimitHour,
  message: {
    error: 'Rate limit exceeded. You can perform 20 cleanings per hour. Please try again later or add your own API key in Settings.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting if the client provides their own Gemini API key in the headers
    const clientKey = req.headers['x-gemini-key'];
    return typeof clientKey === 'string' && clientKey.trim().length > 0;
  }
});

// Prompt definition for cleaning conversations
const SYSTEM_INSTRUCTION = `You are an expert assistant designed to clean up messy copies of AI chat conversations.
Your task is to take a copy-pasted conversation from an AI chatbot (such as ChatGPT, Claude, Perplexity, Grok, Gemini, DeepSeek, etc.) and extract the core conversation.

You must output ONLY a valid JSON object. Do not wrap the JSON in markdown code blocks like \`\`\`json. Output raw JSON.

The JSON object must have this structure:
{
  "originalPrompt": "The user's first prompt, cleaned of UI boilerplate like 'You:', 'You said:', timestamps, etc., but retaining code and markdown formatting.",
  "cleanResponse": "The assistant's response corresponding to that prompt, cleaned of UI boilerplate like 'ChatGPT:', 'Claude:', 'Copy code', source card listings, etc., but retaining standard markdown formatting (lists, tables, code blocks).",
  "platform": "One of: ChatGPT, Claude, Perplexity, Grok, Gemini, DeepSeek, Other",
  "turns": [
    {
      "role": "user" | "assistant",
      "content": "The cleaned message text"
    }
  ]
}

Instructions for turns:
- Extract all turns in the chat log if there are multiple exchanges (multi-turn mode).
- Ensure each turn's content is cleaned of UI scaffolding and user/assistant labels.
- The 'originalPrompt' should represent the first user message, and 'cleanResponse' should represent the first assistant response.
- If the chat has only one exchange, the turns array will contain exactly 2 items (1 user, 1 assistant).
`;

// API Routes
app.post('/api/clean', cleanLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const { text } = req.body;
    
    // Check if the client provided their own key in the headers
    const clientKey = req.headers['x-gemini-key'] as string;
    const apiKey = (clientKey && clientKey.trim()) || process.env.GEMINI_API_KEY;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text content is required' });
      return;
    }

    if (text.length > 200000) {
      res.status(400).json({ error: 'Input is too long (max 200,000 characters)' });
      return;
    }

    if (!apiKey) {
      res.status(401).json({
        error: 'No Gemini API key found. Please configure it in your server .env or enter your personal Gemini API key in the application settings.'
      });
      return;
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // We try gemini-2.5-flash first, and fallback to gemini-1.5-flash
    let modelName = 'gemini-2.5-flash';
    let resultText = '';

    const executeGeneration = async (modelToUse: string) => {
      const model = genAI.getGenerativeModel({
        model: modelToUse,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
        systemInstruction: SYSTEM_INSTRUCTION,
      });

      const response = await model.generateContent(text);
      return response.response.text();
    };

    try {
      resultText = await executeGeneration(modelName);
    } catch (modelError) {
      console.warn(`Error using ${modelName}, falling back to gemini-1.5-flash:`, modelError);
      modelName = 'gemini-1.5-flash';
      resultText = await executeGeneration(modelName);
    }

    if (!resultText) {
      throw new Error('Gemini API returned empty text');
    }

    // Parse the JSON output
    let cleanData;
    try {
      // Strip markdown code fences if Gemini wrapped it anyway
      let cleanJsonStr = resultText.trim();
      if (cleanJsonStr.startsWith('```')) {
        cleanJsonStr = cleanJsonStr.replace(/^```(json)?\n/, '').replace(/\n```$/, '');
      }
      cleanData = JSON.parse(cleanJsonStr);
    } catch (parseError) {
      console.error('Error parsing JSON from Gemini response:', resultText, parseError);
      res.status(502).json({
        error: 'Failed to parse AI output. The AI response was not in the expected JSON format. Please try again.',
        rawResponse: resultText
      });
      return;
    }

    // Validate the cleanData structure
    if (!cleanData.originalPrompt || !cleanData.cleanResponse) {
      // Create fallback structure from what we got
      cleanData.originalPrompt = cleanData.originalPrompt || 'Unable to extract prompt.';
      cleanData.cleanResponse = cleanData.cleanResponse || resultText;
    }
    
    if (!cleanData.platform) {
      cleanData.platform = 'Other';
    }

    if (!cleanData.turns || !Array.isArray(cleanData.turns)) {
      cleanData.turns = [
        { role: 'user', content: cleanData.originalPrompt },
        { role: 'assistant', content: cleanData.cleanResponse }
      ];
    }

    res.json(cleanData);
  } catch (error: any) {
    console.error('Error in /api/clean:', error);
    res.status(500).json({ error: error.message || 'An unexpected error occurred during cleaning.' });
  }
});

// Serve frontend static assets in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback all routes to frontend index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`[Server] Chat Cleaner Pro backend listening at http://localhost:${PORT}`);
});
