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
  
  // We check for apiKey but don't strictly block if it's missing on client, 
  // as the server proxy might have it.
  // However, if the server doesn't have it either, it will return a 500.

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
    // Relative path is more stable within the AI Studio proxy environment
    response = await fetch('/api/groq', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
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
    throw new Error(`Groq fetch error: ${e.message || 'Load failed'}. This usually means the request was blocked by a browser extension or the server is not responding.`);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Server error:', response.status, errorData);
    throw new Error(errorData.error?.message || `Groq API error: ${response.status}`);
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
