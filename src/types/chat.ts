export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: number;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  error: string | null;
} 