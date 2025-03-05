import { useMutation, useQueryClient } from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import { useState } from 'react';

import { sendChatMessage } from '@/lib/api/chat';
import { Message, ChatState } from '@/types/chat';

const CHAT_CACHE_KEY = 'chat';

export function useChat() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ChatState>({
    messages: [],
    isTyping: false,
    error: null,
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const lastUserMessage = state.messages
        .filter((m) => m.role === 'user')
        .slice(-1)[0]?.content;

      return sendChatMessage(message, lastUserMessage);
    },
    onMutate: (message) => {
      setState((prev) => ({
        ...prev,
        isTyping: true,
        error: null,
      }));

      // Optimistically add the user message
      const userMessage: Message = {
        id: nanoid(),
        role: 'user',
        content: message,
        timestamp: Date.now(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
      }));

      // Invalidate the chat cache
      queryClient.invalidateQueries({ queryKey: [CHAT_CACHE_KEY] });

      return { userMessage };
    },
    onSuccess: (response) => {
      const assistantMessage: Message = {
        id: nanoid(),
        content: response.data.response,
        role: 'assistant',
        timestamp: Date.now(),
      };

      setState((prev) => ({
        ...prev,
        isTyping: false,
        messages: [...prev.messages, assistantMessage],
      }));
    },
    onError: (error) => {
      setState((prev) => ({
        ...prev,
        isTyping: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    },
  });

  const sendMessage = (message: string) => {
    if (!message.trim()) return;
    chatMutation.mutate(message);
  };

  const clearChat = () => {
    setState({
      messages: [],
      isTyping: false,
      error: null,
    });
  };

  return {
    ...state,
    sendMessage,
    clearChat,
  };
}
