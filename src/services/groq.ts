import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function* generateGroqResponseStream(message: string, model: string, history: any[], userName?: string) {
  // Clean up history and add the current message
  const messages = [
    { role: 'system', content: `Ты — SalarisAI. Твоего собеседника зовут ${userName || 'пользователь'}.` },
    ...history.map(({ id, isTyping, role, ...rest }: any) => ({
      ...rest,
      role: role === 'model' ? 'assistant' : role,
    })),
    { role: 'user', content: message }
  ];

  const stream = await groq.chat.completions.create({
    messages,
    model,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      yield content;
    }
  }
}
