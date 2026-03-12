export type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
  isTyping?: boolean;
};

export type Chat = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
};
