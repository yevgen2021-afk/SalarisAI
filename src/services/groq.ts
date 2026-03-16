import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const getGroqChatCompletion = async (messages: any[], model: string, thinking: boolean) => {
  // Clean up messages: remove unsupported properties and map 'model' role to 'assistant'
  const cleanedMessages = messages.map(({ id, isTyping, role, ...rest }) => ({
    ...rest,
    role: role === 'model' ? 'assistant' : role,
  }));

  const stream = await groq.chat.completions.create({
    messages: cleanedMessages,
    model,
    stream: true,
  });
  
  return stream;
};
