'use client';

import dynamic from 'next/dynamic';

// Dynamically import the ChatBox component
const ChatBox = dynamic(() => import('./ChatBox'), {
  ssr: false, // Disable server-side rendering for this component
});

export default function ChatBoxWrapper() {
  return <ChatBox />;
}
