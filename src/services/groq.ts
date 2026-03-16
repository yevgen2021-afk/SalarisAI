import { SYSTEM_INSTRUCTION } from '../constants';
import { Message } from '../types';

// Get API key from environment variables
export const getGroqApiKey = () => {
  try {
    if (import.meta.env && import.meta.env.VITE_GROQ_API_KEY) return import.meta.env.VITE_GROQ_API_KEY;
  } catch (e) {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY;
  } catch (e) {}
  return '';
};

export const generateGroqResponseStream = async function*(
  userMsg: string,
  model: string,
  history: Message[] = []
) {
  const apiKey = getGroqApiKey();
  
  if (!apiKey) {
    throw new Error('API key is missing. Please configure VITE_GROQ_API_KEY in your environment variables.');
  }

  const messages = [
    { role: 'system', content: SYSTEM_INSTRUCTION },
    ...history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    })),
    { role: 'user', content: userMsg }
  ];

  let response;
  try {
    response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      })
    });
  } catch (e: any) {
    console.error('Groq fetch error:', e);
    if (e.message === 'Load failed') {
      throw new Error('Groq API request failed (Load failed). This usually means the request was blocked by a browser extension or network policy.');
    }
    throw new Error(`Failed to connect to Groq API: ${e.message}`);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Groq API error: ${response.status} ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder('utf-8');

  if (!reader) {
    throw new Error('Failed to read response stream from Groq');
  }

  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    
    // Keep the last incomplete line in the buffer
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
        try {
          const data = JSON.parse(trimmedLine.slice(6));
          const content = data.choices[0]?.delta?.content;
          if (content) {
            // Yield the exact content chunk
            yield content;
          }
        } catch (e) {
          // Ignore parse errors for incomplete chunks
          console.warn('Error parsing Groq chunk', e);
        }
      }
    }
  }
};
