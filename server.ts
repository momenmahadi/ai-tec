/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON bodies with higher limits for larger text contents
app.use(express.json({ limit: '10mb' }));

// Lazy initializer for Google Gen AI
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Warning: GEMINI_API_KEY is not defined. Using a placeholder key for local build or testing.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || 'MOCK_KEY',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// REST API endpoint to generate quiz questions using Gemini API
app.post('/api/quiz/generate', async (req, res) => {
  try {
    const { text, customKey } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text content is required to generate a quiz.' });
      return;
    }

    // Determine if custom key is provided, or fallback to the secure server environment key
    let ai = getAiClient();
    if (customKey && typeof customKey === 'string' && customKey.trim() !== '') {
      ai = new GoogleGenAI({
        apiKey: customKey.trim(),
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } else if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        error: 'Gemini API Key is not configured on the server. Please provide one in the Settings panel.',
      });
      return;
    }

    const systemPrompt = `You are an expert educational content writer. 
Analyze the provided Arabic study material text and write exactly 15 high-quality, professional multiple-choice questions (MCQs) in Arabic.
Each question must have exactly 4 choices/options, 1 correct option (which must match exactly one of the options text), and a detailed educational explanation in Arabic.
Make sure the language is clear, precise, and educational.`;

    const instructions = `اقرأ النص التالي واستخرج منه 15 سؤال خيارات متعددة بصيغة JSON.
يجب أن يحتوي كل سؤال على الحقول التالية:
- question: نص السؤال باللغة العربية.
- options: مصفوفة تحتوي على 4 خيارات مختلفة بالضبط باللغة العربية.
- correctAnswer: الإجابة الصحيحة بالضبط (يجب أن تطابق حرفياً أحد الخيارات الأربعة الموجودة في مصفوفة options).
- explanation: شرح وتفسير مفصل للإجابة الصحيحة باللغة العربية لمساعدة الطالب على الفهم.

النص المصدري:\n\n${text.substring(0, 50000)}`; // limit size to safety

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: instructions,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: "List of 15 multiple choice questions.",
          items: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: "The Arabic question string."
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly 4 options in Arabic."
              },
              correctAnswer: {
                type: Type.STRING,
                description: "The correct Arabic option string. Must match one of the options elements exactly."
              },
              explanation: {
                type: Type.STRING,
                description: "A detailed explanation of why the answer is correct and educational context."
              }
            },
            required: ['question', 'options', 'correctAnswer', 'explanation']
          }
        }
      }
    });

    const outputText = response.text;
    if (!outputText) {
      res.status(500).json({ error: 'Failed to retrieve generated response from Gemini.' });
      return;
    }

    // Try parsing the json to make sure it's correct
    const quizData = JSON.parse(outputText);
    res.json(quizData);
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({
      error: 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي لتوليد الأسئلة. تأكد من إدخال نص كافٍ وصلاحية المفاتيح المروجة.',
      details: error.message
    });
  }
});

// Configure Vite or Serve static assets
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware loaded in Development mode.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production static assets.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

setupServer();
