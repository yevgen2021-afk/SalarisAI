export type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
  images?: string[];
  isTyping?: boolean;
  isImageGen?: boolean;
};

export type Chat = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
};
