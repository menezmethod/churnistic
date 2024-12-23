import { RedditAPI } from '../reddit';

// Mock fetch
global.fetch = jest.fn();

describe('RedditAPI', () => {
  let api: RedditAPI;

  beforeEach(() => {
    api = new RedditAPI();
    jest.clearAllMocks();
  });

  it('should get weekly threads', async () => {
    const mockThreads = {
      data: {
        children: [
          {
            data: {
              id: '1',
              title: 'Weekly Discussion Thread - December 23, 2024',
              selftext: 'Weekly discussion thread content',
              created_utc: 1703376000,
              permalink: '/r/churning/comments/1/weekly_discussion_thread',
            },
          },
        ],
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockThreads),
    });

    const threads = await api.getWeeklyThreads();

    expect(threads).toBeDefined();
    expect(Array.isArray(threads)).toBe(true);
    expect(threads.length).toBeGreaterThan(0);
    expect(threads[0]).toHaveProperty('title');
    expect(threads[0]).toHaveProperty('selftext');
    expect(threads[0]).toHaveProperty('permalink');
  });

  it('should get post comments', async () => {
    const mockComments = [
      {
        data: {
          children: [],
        },
      },
      {
        data: {
          children: [
            {
              data: {
                id: '1',
                body: 'Test comment',
                author: 'testuser',
                created_utc: 1703376000,
                permalink: '/r/churning/comments/1/comment',
              },
            },
          ],
        },
      },
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockComments),
    });

    const comments = await api.getPostComments('test-post-id');

    expect(comments).toBeDefined();
    expect(Array.isArray(comments)).toBe(true);
    expect(comments.length).toBeGreaterThan(0);
    expect(comments[0]).toHaveProperty('body');
    expect(comments[0]).toHaveProperty('author');
    expect(comments[0]).toHaveProperty('created_utc');
  });
});
