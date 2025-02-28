import { Message, MessageRole } from '@/types/chat';

const CHAT_API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL;
const TIMEOUT_MS = 30000; // 30 seconds

if (!CHAT_API_URL) {
  throw new Error('NEXT_PUBLIC_CHAT_API_URL environment variable is not set');
}

export interface ChatResponse {
  data: {
    response: string;
    metadata: {
      processed_at: string;
      processing_time: number;
    };
  };
}

export async function sendChatMessage(message: string, lastMessage?: string): Promise<ChatResponse> {
  const context = lastMessage ? `User's last message was: "${lastMessage}". Current message: ` : '';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        question: `${context}${message}`,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(
        `Failed to send message: ${response.status} ${response.statusText}${
          errorData ? ` - ${errorData}` : ''
        }`
      );
    }

    return response.json();
  } catch (error) {
    console.error('Chat API Error:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to connect to chat service. Please try again.'
    );
  }
} 