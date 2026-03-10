import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { SYSTEM_INSTRUCTION } from '../constants';

// Get API key from process.env (injected by Vite config or AI Studio)
const getApiKey = () => {
  // 1. Try standard Vite environment variable (Best for Vercel)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  // 2. Try process.env (Used in AI Studio preview)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
    if (process.env.API_KEY) return process.env.API_KEY;
    if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;
  }
  return '';
};

const apiKey = getApiKey();

if (!apiKey) {
  console.warn("Ключ GEMINI_API_KEY не найден");
}

// We instantiate the AI client dynamically inside the function to ensure it picks up the latest key
// if it's somehow injected later, but we keep a fallback instance just in case.
let ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });

export interface GenerateOptions {
  model: 'gemini-3-flash-preview' | 'gemini-3.1-pro-preview';
  thinkingMode: boolean;
  isImageGeneration: boolean;
}

export const generateResponseStream = async function*(
  userMsg: string, 
  currentImage: { data: string, mimeType: string } | null,
  options: GenerateOptions = { model: 'gemini-3-flash-preview', thinkingMode: false, isImageGeneration: false }
) {
  const currentApiKey = getApiKey();
  
  if (!currentApiKey) {
    throw new Error('API key is missing. Please configure GEMINI_API_KEY in your Vercel environment variables.');
  }

  // Always use the freshest key
  ai = new GoogleGenAI({ apiKey: currentApiKey });

  // Enhanced detection for image generation requests
  const imageKeywords = [
    'нарисуй', 'изобрази', 'сгенерируй', 'создай картинку', 'создай изображение', 
    'draw', 'generate image', 'create image', 'picture of', 'image of'
  ];
  
  const isImageRequest = options.isImageGeneration || 
    imageKeywords.some(keyword => userMsg.toLowerCase().includes(keyword)) ||
    (currentImage && (userMsg.toLowerCase().includes('иконк') || userMsg.toLowerCase().includes('сделай') || userMsg.toLowerCase().includes('создай')));

  if (isImageRequest) {
    // Determine aspect ratio based on user prompt
    let aspectRatio = "1:1";
    const lowerMsg = userMsg.toLowerCase();
    if (lowerMsg.includes("16:9") || lowerMsg.includes("широкоформат") || lowerMsg.includes("пейзаж") || lowerMsg.includes("пк") || lowerMsg.includes("горизонталь") || lowerMsg.includes("широк")) {
      aspectRatio = "16:9";
    } else if (lowerMsg.includes("9:16") || lowerMsg.includes("телефон") || lowerMsg.includes("смартфон") || lowerMsg.includes("вертикаль") || lowerMsg.includes("портрет")) {
      aspectRatio = "9:16";
    } else if (lowerMsg.includes("4:3")) {
      aspectRatio = "4:3";
    } else if (lowerMsg.includes("3:4")) {
      aspectRatio = "3:4";
    } else if (lowerMsg.includes("1:1") || lowerMsg.includes("квадрат") || lowerMsg.includes("аватар") || lowerMsg.includes("иконк")) {
      aspectRatio = "1:1";
    }

    // Use image generation model
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            ...(currentImage ? [{ inlineData: { data: currentImage.data, mimeType: currentImage.mimeType } }] : []),
            { text: userMsg || 'Создай красивое изображение.' }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio
          }
        }
      });

      let responseText = '';
      let generatedImageUrl = '';
      
      if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                const mimeType = part.inlineData.mimeType || 'image/png';
                generatedImageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
            } else if (part.text) {
                responseText += part.text;
            }
          }
      }
      
      if (!generatedImageUrl) {
        if (!responseText) {
           throw new Error('Не удалось сгенерировать изображение. Модель вернула пустой ответ.');
        }
        yield responseText;
      } else {
        const markdownImage = `![](${generatedImageUrl})`;
        yield markdownImage;
      }

    } catch (error) {
      throw new Error("Ошибка генерации изображения: " + (error instanceof Error ? error.message : String(error)));
    }
  } else {
    // Standard chat or multimodal chat
    const parts: any[] = [{ text: userMsg || 'Посмотри на это изображение.' }];
    if (currentImage) {
      parts.push({ inlineData: { data: currentImage.data, mimeType: currentImage.mimeType } });
    }
    
    const config: any = {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
    };

    if (options.thinkingMode) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    const responseStream = await ai.models.generateContentStream({
      model: options.model,
      contents: { parts },
      config
    });
    
    for await (const chunk of responseStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  }
};
