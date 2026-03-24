import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function* generateGroqResponseStream(message: string, model: string, history: any[], userName?: string, isThinkingMode?: boolean, images?: string[]) {
  let systemContent = `Ты — SalarisAI. Твоего собеседника зовут ${userName}.`;
  if (isThinkingMode) {
    systemContent += ` Пожалуйста, дай максимально подробный и развернутый ответ, рассуждая шаг за шагом.`;
  }

  const formatMessageContent = (content: string, imgs?: string[]) => {
    if (!imgs || imgs.length === 0) return content;
    return [
      { type: 'text', text: content },
      ...imgs.map(img => ({
        type: 'image_url',
        image_url: { url: img }
      }))
    ];
  };

  // Clean up history and add the current message
  const messages = [
    { role: 'system', content: systemContent },
    ...history.map(({ id, isTyping, role, content, images: msgImages }: any) => ({
      role: role === 'model' ? 'assistant' : role,
      content: formatMessageContent(content, msgImages)
    })),
    { role: 'user', content: formatMessageContent(message, images) }
  ];

  const stream = await groq.chat.completions.create({
    messages: messages as any,
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
