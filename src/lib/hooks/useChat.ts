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
        .filter(m => m.role === 'user')
        .slice(-1)[0]?.content;
      
      return sendChatMessage(message, lastUserMessage);
    },
    onMutate: async (message) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [CHAT_CACHE_KEY] });

      // Optimistically update messages
      const userMessage: Message = {
        id: nanoid(),
        content: message,
        role: 'user',
        timestamp: Date.now(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isTyping: true,
        error: null,
      }));

      return { userMessage };
    },
    onSuccess: (response, _, context) => {
      const assistantMessage: Message = {
        id: nanoid(),
        content: response.data.response,
        role: 'assistant',
        timestamp: Date.now(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isTyping: false,
        error: null,
      }));

      // Update cache with new messages
      queryClient.setQueryData([CHAT_CACHE_KEY], state.messages);
    },
    onError: (error: Error, message, context) => {
      console.error('Chat Error:', error);
      
      // Remove the optimistically added message on error
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(m => m.id !== context?.userMessage.id),
        isTyping: false,
        error: error.message || 'Failed to send message. Please try again.',
      }));

      // Show error message for 5 seconds then clear it
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          error: null,
        }));
      }, 5000);
    },
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
  });

  const sendMessage = (message: string) => {
    if (chatMutation.isPending) return; // Prevent multiple simultaneous requests
    setState(prev => ({ ...prev, error: null }));
    chatMutation.mutate(message);
  };

  const clearChat = () => {
    setState({
      messages: [],
      isTyping: false,
      error: null,
    });
    queryClient.setQueryData([CHAT_CACHE_KEY], []);
  };

  return {
    messages: state.messages,
    isTyping: state.isTyping || chatMutation.isPending,
    error: state.error || chatMutation.error?.message,
    sendMessage,
    clearChat,
    isError: !!state.error || chatMutation.isError,
  };
} 