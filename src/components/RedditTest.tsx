'use client';

import { useEffect, useState } from 'react';

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  created_utc: number;
}

interface RedditComment {
  id: string;
  body: string;
  author: string;
  created_utc: number;
}

interface ThreadWithComments {
  post: RedditPost;
  comments: RedditComment[];
}

interface GroqSummary {
  creditCardIdeas: string[];
  bankBonuses: string[];
}

export default function RedditTest() {
  const [thread, setThread] = useState<ThreadWithComments | null>(null);
  const [summary, setSummary] = useState<GroqSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch the most recent weekly thread
        const threadResponse = await fetch('/api/reddit?endpoint=weekly-threads');
        if (!threadResponse.ok) {
          throw new Error('Failed to fetch weekly thread');
        }
        const threadData = await threadResponse.json();
        const post = threadData.data.children[0]?.data;
        
        if (!post) {
          throw new Error('No weekly thread found');
        }

        // Fetch comments for the thread
        const commentsResponse = await fetch(`/api/reddit?endpoint=comments&postId=${post.id}`);
        if (!commentsResponse.ok) {
          throw new Error('Failed to fetch comments');
        }
        const comments = await commentsResponse.json();

        setThread({
          post,
          comments
        });

        // Get Groq summary
        const content = `${post.selftext}\n\n${comments.map((c: RedditComment) => c.body).join('\n\n')}`;
        const summaryResponse = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content })
        });

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          setSummary(summaryData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!thread) {
    return <div>No thread found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {summary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 mb-8 border border-blue-200">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">AI Summary</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-blue-700">Credit Card Trip Ideas</h3>
              <ul className="list-disc pl-5 space-y-1">
                {summary.creditCardIdeas.map((idea, index) => (
                  <li key={index} className="text-gray-700">{idea}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-blue-700">Bank Account Bonuses</h3>
              <ul className="list-disc pl-5 space-y-1">
                {summary.bankBonuses.map((bonus, index) => (
                  <li key={index} className="text-gray-700">{bonus}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">{thread.post.title}</h2>
        <div className="prose max-w-none">
          {thread.post.selftext}
        </div>
        <div className="text-sm text-gray-500 mt-2">
          Posted: {new Date(thread.post.created_utc * 1000).toLocaleString()}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Top Comments</h3>
        {thread.comments.map((comment) => (
          <div key={comment.id} className="bg-white rounded-lg shadow-md p-4">
            <div className="prose max-w-none">
              {comment.body}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              By {comment.author} • {new Date(comment.created_utc * 1000).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 