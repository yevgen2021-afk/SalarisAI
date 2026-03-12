import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { SYSTEM_INSTRUCTION } from '../constants';
import { Message } from '../types';

// Get API key from environment variables
export const getApiKey = () => {
  try {
    if (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) return import.meta.env.VITE_GEMINI_API_KEY;
  } catch (e) {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  } catch (e) {}
  return '';
};

const apiKey = getApiKey();

if (!apiKey) {
  console.warn("GEMINI_API_KEY not found");
}

let ai = new GoogleGenAI({ 
  apiKey: apiKey || 'dummy-key'
});

export interface GenerateOptions {
  model: 'gemini-3-flash-preview' | 'gemini-3.1-pro-preview';
  thinkingMode: boolean;
}

export const generateResponseStream = async function*(
  userMsg: string, 
  options: GenerateOptions = { model: 'gemini-3-flash-preview', thinkingMode: false },
  history: Message[] = []
) {
  const currentApiKey = getApiKey();
  
  if (!currentApiKey) {
    throw new Error('API key is missing. Please configure GEMINI_API_KEY.');
  }

  ai = new GoogleGenAI({ 
    apiKey: currentApiKey
  });

  const config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: [{ googleSearch: {} }],
  };

  if (options.thinkingMode) {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  }

  // Format history for Gemini
  const formattedHistory = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  try {
    const responseStream = await ai.models.generateContentStream({
      model: options.model,
      contents: [...formattedHistory, { role: 'user', parts: [{ text: userMsg || '...' }] }],
      config
    });
    
    for await (const chunk of responseStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
};
