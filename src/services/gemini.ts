import OpenAI from 'openai';
import { SYSTEM_INSTRUCTION } from '../constants';

// Get API key from process.env (injected by Vite config or AI Studio)
export const getApiKey = () => {
  try {
    if (import.meta.env && import.meta.env.VITE_OPENROUTER_API_KEY) {
      return import.meta.env.VITE_OPENROUTER_API_KEY;
    }
  } catch (e) {}
  
  try {
    if (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      return import.meta.env.VITE_GEMINI_API_KEY;
    }
  } catch (e) {}
  
  try {
    if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
  } catch (e) {}
  
  try {
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  } catch (e) {}
  
  return '';
};

export interface GenerateOptions {
  model: 'google/gemini-2.5-flash:free' | 'meta-llama/llama-3.3-70b-instruct:free';
  thinkingMode: boolean;
  isImageGeneration: boolean;
}

export const generateResponseStream = async function*(
  userMsg: string, 
  currentImage: { data: string, mimeType: string } | null,
  options: GenerateOptions = { model: 'google/gemini-2.5-flash:free', thinkingMode: false, isImageGeneration: false },
  customKey?: string
) {
  const currentApiKey = customKey || getApiKey();
  
  if (!currentApiKey) {
    throw new Error('API key is missing. Please configure VITE_OPENROUTER_API_KEY in your Vercel environment variables or enter it in Settings.');
  }

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: currentApiKey,
    dangerouslyAllowBrowser: true, // Required for client-side usage
  });

  // Image generation is not natively supported by standard OpenRouter text models in the same way,
  // so we will fallback to text generation or use a specific image model if available.
  // For now, we will just use the text model.
  const isImageRequest = options.isImageGeneration;

  if (isImageRequest) {
    yield "Генерация изображений временно недоступна через OpenRouter. Пожалуйста, используйте текстовые запросы.";
    return;
  }

  const messages: any[] = [
    { role: 'system', content: SYSTEM_INSTRUCTION }
  ];

  if (currentImage) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: userMsg || 'Посмотри на это изображение.' },
        {
          type: 'image_url',
          image_url: {
            url: `data:${currentImage.mimeType};base64,${currentImage.data}`
          }
        }
      ]
    });
  } else {
    messages.push({ role: 'user', content: userMsg });
  }

  try {
    const stream = await openai.chat.completions.create({
      model: options.model,
      messages: messages,
      stream: true,
      // OpenRouter specific headers
      extra_headers: {
        "HTTP-Referer": window.location.origin,
        "X-Title": "SalarisAI",
      }
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
};
